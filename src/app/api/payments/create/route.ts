import { NextRequest, NextResponse } from "next/server";
import validator from "validator";
import crypto from "crypto";
import { db } from "@/libs/firebase/admin";
import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { createCheckoutTransaction } from "@/libs/payments/doku";
import { reserveStock, releaseStock } from "@/libs/tickets/stock";
import { issueTicketsForOrder } from "@/libs/tickets/issueTickets";
import { sendTicketEmail } from "@/libs/email/ticketEmail";

export async function POST(req: NextRequest) {
  let createdOrderId = "";
  let reservedEventId = "";
  let reservedPackageId = "";
  let reservedQuantity = 0;
  let stockWasReserved = false;

  try {
    const body = await req.json();
    const {
      eventId,
      packageId,
      quantity,
      names,
      niks,
      email,
      bypassPayment,
    } = body;

    // 1. Validation
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json(
        { message: "Parameter eventId wajib diisi" },
        { status: 400 }
      );
    }

    const ticketQuantity = Number(quantity);
    if (!ticketQuantity || ticketQuantity < 1 || ticketQuantity > 20) {
      return NextResponse.json(
        { message: "Jumlah tiket tidak valid (1-20 tiket)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(names) || names.length !== ticketQuantity) {
      return NextResponse.json(
        { message: "Daftar nama pengunjung harus sesuai dengan jumlah tiket" },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9 ]{3,50}$/;
    for (const name of names) {
      if (!name || !usernameRegex.test(name.trim())) {
        return NextResponse.json(
          { message: "Format nama tidak valid (3-50 karakter alfanumerik)" },
          { status: 400 }
        );
      }
    }

    const primaryNik = Array.isArray(niks) && niks[0] ? String(niks[0]).trim() : "";
    const nikRegex = /^[0-9]{10,20}$/;
    if (!primaryNik || !nikRegex.test(primaryNik)) {
      return NextResponse.json(
        { message: "NIK kontak utama wajib diisi dengan 10-20 digit angka" },
        { status: 400 }
      );
    }

    const cleanEmail = (email || "").trim();
    if (!cleanEmail || !validator.isEmail(cleanEmail)) {
      return NextResponse.json(
        { message: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // 2. Server-side Bypass check (Only allowed in non-production)
    const isServerBypassEnv =
      process.env.PAYMENT_BYPASS === "true" ||
      process.env.NEXT_PUBLIC_BYPASS_MIDTRANS === "true"; // temporary fallback
    const isNonProduction = process.env.NODE_ENV !== "production";
    const isBypassMode =
      isNonProduction && (isServerBypassEnv || bypassPayment === true);

    // 3. Generate server-side Order ID
    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const orderId = `BNC${Date.now().toString().slice(-6)}${randomSuffix}`;
    createdOrderId = orderId;
    reservedEventId = eventId;
    reservedPackageId = packageId || "FESTIVAL";
    reservedQuantity = ticketQuantity;

    // 4. Reserve stock & create payment_status in a single atomic Firestore Transaction
    const eventRef = db.collection("event").doc(eventId);

    const transactionResult = await db.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists) {
        throw new Error("Event tidak ditemukan");
      }

      const eventData = eventSnap.data()!;

      // Determine Server-side Price
      let unitPrice = eventData.price || 56000;
      const pkgUpper = (packageId || "").toUpperCase();

      if (pkgUpper === "VIP" && eventData.price_vip) {
        unitPrice = eventData.price_vip;
      } else if (pkgUpper === "FESTIVAL" && eventData.price_festival) {
        unitPrice = eventData.price_festival;
      } else if (Array.isArray(eventData.packages)) {
        const pkg = eventData.packages.find(
          (p: any) => (p.id || "").toUpperCase() === pkgUpper
        );
        if (pkg && pkg.price) {
          unitPrice = pkg.price;
        }
      }

      const grossAmount = unitPrice * ticketQuantity;
      const eventTitle = eventData.title || "Bhima Night Carnival 2026";
      const productName = `${eventTitle} - ${pkgUpper || "Tiket"}`;

      // Reserve stock in database
      await reserveStock(
        transaction,
        eventRef,
        eventData,
        packageId,
        ticketQuantity
      );

      // Create permanent payment_status record
      const paymentDocRef = db.collection("payment_status").doc(orderId);
      const paymentRecord: PaymentStatusInterface = {
        order_id: orderId,
        event_id: eventId,
        event_name: productName,
        package_id: packageId || "FESTIVAL",
        ticket: ticketQuantity,
        unit_price: unitPrice,
        gross_amount: grossAmount,
        name: names.map((n: string) => n.trim()),
        nik: [primaryNik],
        email: cleanEmail,
        status: isBypassMode ? "paid" : "pending",
        provider: isBypassMode ? "bypass_test" : "doku",
        stock_reserved: true,
        stock_released: false,
        tickets_issued: isBypassMode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      transaction.set(paymentDocRef, paymentRecord);

      return {
        eventData,
        unitPrice,
        grossAmount,
        productName,
        paymentRecord,
      };
    });

    stockWasReserved = true;

    // 5. Handle Bypass mode (Direct Ticket Issuance)
    if (isBypassMode) {
      const nowIso = new Date().toISOString();
      const qrDetails = await issueTicketsForOrder({
        orderId,
        eventId,
        eventName: transactionResult.productName,
        names: transactionResult.paymentRecord.name,
        niks: transactionResult.paymentRecord.nik || [primaryNik],
        email: cleanEmail,
        totalTickets: ticketQuantity,
        transactionId: `BYPASS-${orderId}`,
        transactionTime: nowIso,
        paymentType: "TEST_BYPASS",
      });

      // Send email in background
      const qrCodes = qrDetails.map((q) => q.qr_code);
      sendTicketEmail({
        email: cleanEmail,
        names: transactionResult.paymentRecord.name,
        eventName: transactionResult.productName,
        eventTimestamp: transactionResult.eventData.timestamp,
        eventLocation: transactionResult.eventData.location,
        eventImageSrc: transactionResult.eventData.src,
        qrCodes,
      }).catch((err) => console.error("Bypass background email error:", err));

      return NextResponse.json(
        {
          success: true,
          bypass: true,
          orderId,
          message: "Bypass mode active. Tickets issued.",
        },
        { status: 200 }
      );
    }

    // 6. Call DOKU Checkout API (Performed OUTSIDE Firestore transaction)
    const returnUrlEnv = process.env.DOKU_RETURN_URL;
    let callbackUrl = "";
    if (returnUrlEnv && returnUrlEnv.trim() !== "") {
      const cleanUrl = returnUrlEnv.trim().replace(/\/+$/, "");
      callbackUrl = cleanUrl.endsWith("/success")
        ? `${cleanUrl}?order_id=${encodeURIComponent(orderId)}`
        : `${cleanUrl}/success?order_id=${encodeURIComponent(orderId)}`;
    } else {
      const baseUrl =
        process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      callbackUrl = `${baseUrl.replace(/\/+$/, "")}/success?order_id=${encodeURIComponent(orderId)}`;
    }

    try {
      const dokuResult = await createCheckoutTransaction({
        invoiceNumber: orderId,
        amount: transactionResult.grossAmount,
        callbackUrl,
        customerName: names[0].trim(),
        customerEmail: cleanEmail,
        itemName: transactionResult.productName,
      });

      // Update payment_status with DOKU reference and payment URL
      await db.collection("payment_status").doc(orderId).update({
        payment_url: dokuResult.paymentUrl,
        provider_reference: dokuResult.invoiceNumber,
        updatedAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          orderId,
          paymentUrl: dokuResult.paymentUrl,
          invoiceNumber: dokuResult.invoiceNumber,
        },
        { status: 200 }
      );
    } catch (dokuErr: any) {
      console.error("DOKU Checkout creation failed:", dokuErr);

      // Rollback reserved stock
      if (stockWasReserved) {
        await releaseStock(
          orderId,
          reservedEventId,
          reservedPackageId,
          reservedQuantity
        );
        await db.collection("payment_status").doc(orderId).update({
          status: "failed",
          stock_released: true,
          updatedAt: new Date(),
        });
      }

      return NextResponse.json(
        {
          message:
            "Gagal menghubungi server pembayaran DOKU. Silakan coba beberapa saat lagi.",
        },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    console.error("POST /api/payments/create error:", err);

    if (stockWasReserved && createdOrderId) {
      try {
        await releaseStock(
          createdOrderId,
          reservedEventId,
          reservedPackageId,
          reservedQuantity
        );
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan server internal" },
      { status: 500 }
    );
  }
}
