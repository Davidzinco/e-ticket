import { NextRequest, NextResponse } from "next/server";
import Midtrans from "midtrans-client";
import validator from "validator";
import { db } from "@/libs/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
      return NextResponse.json(
        {
          message:
            "Kunci Midtrans (MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY) belum dikonfigurasi di file .env. Silakan masukkan kunci Midtrans Anda untuk mengaktifkan pembayaran.",
        },
        { status: 500 }
      );
    }

    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === "true" ||
      !serverKey.startsWith("SB-");

    const snap = new Midtrans.Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    const { orderId, eventId, productName, packageId, price, quantity, names, niks, email } =
      await req.json();

    const usernameRegex = /^[a-zA-Z0-9 ]{3,50}$/;
    for (const name of names) {
      if (!usernameRegex.test(name)) {
        return NextResponse.json(
          { message: "Format nama tidak valid (3-50 karakter)" },
          { status: 400 }
        );
      }
    }

    const trimmedNames = names.map((n: string) => n.trim());
    const rawNiks = Array.isArray(niks)
      ? niks.map((nik: string) => String(nik).trim())
      : typeof niks === "string" && niks.trim()
      ? [niks.trim()]
      : [];

    const nikRegex = /^[0-9]{10,20}$/;
    if (rawNiks.length === 0) {
      return NextResponse.json(
        { message: "NIK kontak utama wajib diisi" },
        { status: 400 }
      );
    }

    for (const nik of rawNiks) {
      if (!nikRegex.test(nik)) {
        return NextResponse.json(
          { message: "Format NIK tidak valid (harus 10-20 digit angka)" },
          { status: 400 }
        );
      }
    }

    const populatedNiks =
      rawNiks.length === 1 && quantity > 1
        ? Array(quantity).fill(rawNiks[0])
        : rawNiks;

    if (!validator.isEmail(email)) {
      return NextResponse.json({ message: "Format email tidak valid" }, { status: 400 });
    }

    const existingPayment = await db
      .collection("payment_status")
      .where("order_id", "==", orderId)
      .limit(1)
      .get();

    if (!existingPayment.empty) {
      return NextResponse.json(
        { message: "Order ID duplikat" },
        { status: 400 }
      );
    }

    const result = await db.runTransaction(async (transaction) => {
      const eventRef = db.collection("event").doc(eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error("Event not found");
      }

      const eventData = eventDoc.data();
      if (!eventData) {
        throw new Error("Event data missing");
      }

      // Check overall stock
      if (eventData.ticket - quantity < 0) {
        throw new Error("Tiket sudah tidak mencukupi");
      }

      // Prepare updates for package-specific stock
      const updates: { [key: string]: any } = {
        ticket: eventData.ticket - quantity,
      };

      if (packageId === "VIP" && eventData.ticket_vip !== undefined) {
        if (eventData.ticket_vip - quantity < 0) {
          throw new Error("Tiket VIP sudah habis atau tidak mencukupi");
        }
        updates.ticket_vip = eventData.ticket_vip - quantity;
      } else if (packageId === "FESTIVAL" && eventData.ticket_festival !== undefined) {
        if (eventData.ticket_festival - quantity < 0) {
          throw new Error("Tiket Festival sudah habis atau tidak mencukupi");
        }
        updates.ticket_festival = eventData.ticket_festival - quantity;
      }

      if (Array.isArray(eventData.packages)) {
        updates.packages = eventData.packages.map((pkg: any) => {
          if (pkg.id === packageId && typeof pkg.ticket === "number") {
            if (pkg.ticket - quantity < 0) {
              throw new Error(`Tiket ${pkg.name || packageId} sudah habis`);
            }
            return { ...pkg, ticket: pkg.ticket - quantity };
          }
          return pkg;
        });
      }

      transaction.update(eventRef, updates);

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: price * quantity,
        },
        item_details: [
          {
            name: productName,
            price,
            quantity,
          },
        ],
        customer_details: {
          first_name: trimmedNames[0],
          email,
        },
      };

      try {
        const token = await snap.createTransaction(parameter);

        const paymentRef = db.collection("payment_status").doc(orderId);
        transaction.set(paymentRef, {
          status: "pending",
          name: trimmedNames,
          nik: populatedNiks,
          email,
          order_id: orderId,
          event_id: eventId,
          ticket: quantity,
          package_id: packageId || "FESTIVAL",
          event_name: productName,
          createdAt: new Date(),
        });

        return { token };
      } catch (err: unknown) {
        // Rollback stock
        transaction.update(eventRef, eventData);
        if (
          typeof err === "object" &&
          err !== null &&
          "ApiResponse" in err &&
          (err as { ApiResponse: { error_messages: string[] } }).ApiResponse
            .error_messages?.[0] === "customer_details.email format is invalid"
        ) {
          throw new Error("Invalid email");
        }
        throw new Error("Midtrans transaction failed: pastikan Server Key Midtrans valid");
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan server saat memproses transaksi" },
      { status: 500 }
    );
  }
}
