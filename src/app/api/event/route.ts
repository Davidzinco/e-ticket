import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { db } from "@/libs/firebase/admin";
import {
  retrieveData,
  retrieveDataByFieldAdmin,
  retrieveDataById,
} from "@/libs/firebase/service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams.get("id");
    if (searchParams) {
      const data = await retrieveDataById("event", searchParams);
      return NextResponse.json(data);
    }
    const data = await retrieveData("event");
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/event error:", error);
    return NextResponse.json(
      { message: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { order_id } = await req.json();
    const paymentSnap = await db
      .collection("payment_status")
      .where("order_id", "==", order_id)
      .get();

    if (paymentSnap.empty) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    const paymentDoc = paymentSnap.docs[0];
    const dataPayment = paymentDoc.data() as PaymentStatusInterface;

    if (dataPayment.status !== "pending") {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    const eventRef = db.collection("event").doc(dataPayment.event_id!);

    await db.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);

      if (!eventSnap.exists) {
        throw new Error("Event not found");
      }

      const eventData = eventSnap.data()!;
      const newTicket = eventData.ticket + dataPayment.ticket;

      transaction.update(eventRef, { ticket: newTicket });
      transaction.delete(paymentDoc.ref);
    });

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
