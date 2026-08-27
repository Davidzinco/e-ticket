import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/libs/firebase/admin";
import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { generateDigest, generateSignature } from "@/libs/payments/doku";
import { mapDokuStatus } from "@/libs/payments/status";
import { issueTicketsForOrder } from "@/libs/tickets/issueTickets";
import { releaseStock } from "@/libs/tickets/stock";
import { sendTicketEmail } from "@/libs/email/ticketEmail";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const clientId = req.headers.get("client-id") || req.headers.get("Client-Id") || "";
    const requestId = req.headers.get("request-id") || req.headers.get("Request-Id") || "";
    const requestTimestamp = req.headers.get("request-timestamp") || req.headers.get("Request-Timestamp") || "";
    const incomingSignature = req.headers.get("signature") || req.headers.get("Signature") || "";
    const targetPath = "/api/doku/notification";

    const secretKey = process.env.DOKU_SECRET_KEY || "";
    const configuredClientId = process.env.DOKU_CLIENT_ID || "";

    // 1. Signature Verification (if secretKey is configured)
    if (secretKey && incomingSignature) {
      const digest = generateDigest(rawBody);
      const expectedSignature = generateSignature(
        clientId || configuredClientId,
        requestId,
        requestTimestamp,
        targetPath,
        digest,
        secretKey
      );

      // Timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature);
      const incomingBuffer = Buffer.from(incomingSignature);

      const isValid =
        expectedBuffer.length === incomingBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, incomingBuffer);

      if (!isValid) {
        console.warn("❌ DOKU Webhook: Signature verification failed");
        // In sandbox / testing mode, continue if signatures are mismatched only when strict is off
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { message: "Signature verification failed" },
            { status: 401 }
          );
        }
      }
    }

    // 2. Extract transaction & order info from DOKU notification payload
    const orderId =
      body.order?.invoice_number ||
      body.order?.order_id ||
      body.transaction?.invoice_number ||
      body.invoice_number ||
      "";

    if (!orderId) {
      return NextResponse.json(
        { message: "Order invoice_number not found in notification" },
        { status: 400 }
      );
    }

    const transactionStatusRaw =
      body.transaction?.status ||
      body.transaction_status ||
      body.service?.id ||
      body.status ||
      "";
    const responseCode = body.response_code || body.transaction?.response_code || "";
    const internalStatus = mapDokuStatus(transactionStatusRaw, responseCode);

    const transactionId =
      body.transaction?.id ||
      body.transaction_id ||
      body.order?.transaction_id ||
      `DOKU-${orderId}`;
    const transactionTime =
      body.transaction?.date ||
      body.transaction_time ||
      new Date().toISOString();
    const paymentType =
      body.channel?.id ||
      body.payment?.payment_method_type ||
      body.payment_type ||
      "DOKU_CHECKOUT";

    const incomingAmount = Number(body.order?.amount || body.amount || 0);

    // 3. Lookup payment_status record in Firestore
    let paymentDocRef = db.collection("payment_status").doc(orderId);
    let paymentDoc = await paymentDocRef.get();

    if (!paymentDoc.exists) {
      // Query by order_id field
      const querySnap = await db
        .collection("payment_status")
        .where("order_id", "==", orderId)
        .limit(1)
        .get();

      if (querySnap.empty) {
        console.warn(`Payment record not found for orderId: ${orderId}`);
        return NextResponse.json(
          { message: "Order not found in database" },
          { status: 404 }
        );
      }
      paymentDoc = querySnap.docs[0];
      paymentDocRef = paymentDoc.ref;
    }

    const paymentData = paymentDoc.data() as PaymentStatusInterface;

    // 4. Verify Amount (prevent fraud/tampering)
    if (
      incomingAmount > 0 &&
      paymentData.gross_amount &&
      paymentData.gross_amount > 0 &&
      paymentData.gross_amount !== incomingAmount
    ) {
      console.error(
        `Amount mismatch for ${orderId}: expected ${paymentData.gross_amount}, got ${incomingAmount}`
      );
      return NextResponse.json(
        { message: "Amount mismatch" },
        { status: 400 }
      );
    }

    // 5. Handle Status: PAID / SUCCESS
    if (internalStatus === "paid") {
      // Guard: Idempotency check for ticket issuance
      if (!paymentData.tickets_issued) {
        const primaryNik = Array.isArray(paymentData.nik)
          ? paymentData.nik[0]
          : String(paymentData.nik || "-");

        const qrDetails = await issueTicketsForOrder({
          orderId,
          eventId: paymentData.event_id,
          eventName: paymentData.event_name,
          names: paymentData.name,
          niks: paymentData.nik || [primaryNik],
          email: paymentData.email,
          totalTickets: paymentData.ticket,
          transactionId,
          transactionTime,
          paymentType,
        });

        // Update payment_status as permanently paid
        await paymentDocRef.update({
          status: "paid",
          provider_status: transactionStatusRaw,
          transaction_id: transactionId,
          transaction_time: transactionTime,
          payment_type: paymentType,
          paidAt: new Date(),
          updatedAt: new Date(),
          tickets_issued: true,
          sheets_sync_status: "synced",
        });

        // Fetch event metadata to include poster/time in email
        try {
          const eventSnap = await db.collection("event").doc(paymentData.event_id).get();
          const eventData = eventSnap.exists ? eventSnap.data() : undefined;

          const qrCodes = qrDetails.map((q) => q.qr_code);
          await sendTicketEmail({
            email: paymentData.email,
            names: paymentData.name,
            eventName: paymentData.event_name,
            eventTimestamp: eventData?.timestamp,
            eventLocation: eventData?.location,
            eventImageSrc: eventData?.src,
            qrCodes,
          });

          await paymentDocRef.update({
            email_status: "sent",
          });
        } catch (emailErr) {
          console.error("Email send failed in webhook:", emailErr);
          await paymentDocRef.update({
            email_status: "failed",
          });
        }
      } else {
        // Tickets were already issued, just acknowledge
        await paymentDocRef.update({
          status: "paid",
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({ message: "SUCCESS" }, { status: 200 });
    }

    // 6. Handle Status: FAILED / EXPIRED / CANCELLED
    if (["failed", "expired", "cancelled"].includes(internalStatus)) {
      // Guard: Release stock only once
      if (paymentData.stock_reserved && !paymentData.stock_released) {
        await releaseStock(
          orderId,
          paymentData.event_id,
          paymentData.package_id || "FESTIVAL",
          paymentData.ticket
        );

        await paymentDocRef.update({
          status: internalStatus,
          provider_status: transactionStatusRaw,
          stock_released: true,
          updatedAt: new Date(),
        });
      } else {
        await paymentDocRef.update({
          status: internalStatus,
          provider_status: transactionStatusRaw,
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({ message: "ACKNOWLEDGED" }, { status: 200 });
    }

    // Default: Pending / other state
    await paymentDocRef.update({
      status: internalStatus,
      provider_status: transactionStatusRaw,
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: "ACKNOWLEDGED" }, { status: 200 });
  } catch (error: unknown) {
    console.error("DOKU Notification Webhook Error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
