import { NextRequest, NextResponse } from "next/server";
import Midtrans from "midtrans-client";
import validator from "validator";
import { db } from "@/libs/firebase/admin";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import { sendBuyerToGoogleSheets } from "@/libs/googleSheets";

const ALPHABET: string = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(length: number = 20): string {
  let result: string = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[array[i] % ALPHABET.length];
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";

    const { orderId, eventId, productName, packageId, price, quantity, names, niks, email, bypassMidtrans } =
      await req.json();

    const isBypassMode =
      bypassMidtrans === true ||
      process.env.NEXT_PUBLIC_BYPASS_MIDTRANS === "true" ||
      process.env.BYPASS_MIDTRANS === "true";

    if (!isBypassMode && (!serverKey || !clientKey)) {
      return NextResponse.json(
        {
          message:
            "Kunci Midtrans (MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY) belum dikonfigurasi di file .env. Silakan masukkan kunci Midtrans Anda untuk mengaktifkan pembayaran.",
        },
        { status: 500 }
      );
    }

    const midtransIsProductionEnv = process.env.MIDTRANS_IS_PRODUCTION;
    const isProduction =
      midtransIsProductionEnv !== undefined
        ? midtransIsProductionEnv === "true"
        : (serverKey ? !serverKey.startsWith("SB-") : false);

    // === DEBUG: Midtrans Configuration Log ===
    console.log("\n========================================");
    console.log("🔧 MIDTRANS CONFIG DEBUG");
    console.log("========================================");
    console.log("Mode:", isBypassMode ? "⏭️  BYPASS (no Midtrans)" : isProduction ? "🔴 PRODUCTION" : "🟡 SANDBOX");
    console.log("MIDTRANS_IS_PRODUCTION env:", process.env.MIDTRANS_IS_PRODUCTION || "(not set)");
    console.log("Server Key:", serverKey ? `${serverKey.substring(0, 15)}...${serverKey.substring(serverKey.length - 4)}` : "❌ KOSONG");
    console.log("Client Key:", clientKey ? `${clientKey.substring(0, 15)}...${clientKey.substring(clientKey.length - 4)}` : "❌ KOSONG");
    console.log("Server Key starts with SB-:", serverKey.startsWith("SB-"));
    console.log("Snap URL:", process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "(not set)");
    console.log("Bypass:", isBypassMode);
    console.log("API Target:", isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
    console.log("========================================\n");

    const snap = !isBypassMode && serverKey && clientKey
      ? new Midtrans.Snap({
          isProduction,
          serverKey,
          clientKey,
        })
      : null;

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

      if (isBypassMode) {
        const qrDetails: QrCodeInterface[] = [];
        const nowStr = new Date().toLocaleString("id-ID");
        const trxId = `TRX-BYPASS-${Date.now()}`;

        for (let i = 0; i < quantity; i++) {
          const qrcode = generateCode();
          const qrData: QrCodeInterface = {
            qr_code: qrcode,
            id_event: eventId,
            name: trimmedNames[i] || trimmedNames[0],
            nik: populatedNiks[i] || populatedNiks[0] || "-",
            email,
            isScanned: false,
            transaction_id: trxId,
            transaction_time: nowStr,
            payment_type: "bypass_test",
            ticket: quantity,
            order_id: orderId,
            event_name: productName,
            scanned_at: "-",
            action: "First Scan",
            scanned_by: "-",
          };
          qrDetails.push(qrData);

          const qrRef = db.collection("qr_detail").doc();
          transaction.set(qrRef, qrData);
        }

        return { bypass: true, orderId, qrDetails };
      }

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

        if (!snap) {
          throw new Error("Snap client is not initialized");
        }

        const token = await snap.createTransaction(parameter);
        return { token };
      } catch (err: unknown) {
        // Rollback stock
        transaction.update(eventRef, eventData);

        // === DEBUG: Detailed Midtrans Error Log ===
        console.error("\n❌ ========================================");
        console.error("❌ MIDTRANS API ERROR");
        console.error("❌ ========================================");
        if (typeof err === "object" && err !== null) {
          const midErr = err as Record<string, unknown>;
          console.error("HTTP Status Code:", midErr.httpStatusCode ?? "N/A");
          console.error("API Response:", JSON.stringify(midErr.ApiResponse ?? "N/A", null, 2));
          console.error("Error Message:", midErr.message ?? "N/A");
          console.error("Raw Error Keys:", Object.keys(midErr).join(", "));
        } else {
          console.error("Error (non-object):", err);
        }
        console.error("Server Key used:", serverKey ? `${serverKey.substring(0, 15)}...${serverKey.substring(serverKey.length - 4)}` : "KOSONG");
        console.error("Client Key used:", clientKey ? `${clientKey.substring(0, 15)}...${clientKey.substring(clientKey.length - 4)}` : "KOSONG");
        console.error("isProduction:", isProduction);
        console.error("API Target:", isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com");
        console.error("❌ ========================================\n");

        if (
          typeof err === "object" &&
          err !== null &&
          "httpStatusCode" in err &&
          (err as { httpStatusCode: number }).httpStatusCode === 401
        ) {
          throw new Error("Kunci Akses Midtrans (MIDTRANS_SERVER_KEY) tidak valid atau ditolak oleh Midtrans (Error 401 Unauthorized). Silakan periksa kembali Server Key & Client Key di dashboard.midtrans.com atau aktifkan NEXT_PUBLIC_BYPASS_MIDTRANS=true di .env untuk mode pengujian.");
        }
        if (
          typeof err === "object" &&
          err !== null &&
          "ApiResponse" in err &&
          (err as { ApiResponse: { error_messages: string[] } }).ApiResponse
            .error_messages?.[0] === "customer_details.email format is invalid"
        ) {
          throw new Error("Format email tidak valid");
        }
        throw new Error(
          err instanceof Error ? err.message : "Transaksi Midtrans gagal: pastikan Server Key Midtrans valid"
        );
      }
    });

    if (result.bypass) {
      if (result.qrDetails && result.qrDetails.length > 0) {
        await sendBuyerToGoogleSheets(result.qrDetails);
      }
      return NextResponse.json({ bypass: true, orderId }, { status: 200 });
    }

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
