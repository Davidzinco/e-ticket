import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { db } from "@/libs/firebase/admin";
import {
  retrieveData,
  retrieveDataByFieldAdmin,
  retrieveDataById,
} from "@/libs/firebase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const hasFirebaseCredentials =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (!hasFirebaseCredentials) {
    const mockEvents = [
      {
        id: "5W7jcnr28tGc5E8tywRl",
        title: "Bhirawa Night Carnival 2025",
        sub_title: "BNC 2025",
        description: "Bhirawa Night Carnival (BNC) 2025 adalah festival seni dan budaya tahunan SMA Negeri 1 Madiun.",
        isSoldOut: false,
        location: "Gedung Olahraga Wilis Madiun",
        price: 35000,
        src: "https://sman1madiun.sch.id/wp-content/uploads/2024/10/logo-banner.png",
        ticket: 150,
        timestamp: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
        },
        closeTime: {
          seconds: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          nanoseconds: 0,
        },
      }
    ];

    const searchParams = req.nextUrl.searchParams.get("id");
    if (searchParams) {
      const found = mockEvents.find(e => e.id === searchParams);
      return NextResponse.json(found || null);
    }
    return NextResponse.json(mockEvents);
  }

  const searchParams = req.nextUrl.searchParams.get("id");
  if (searchParams) {
    const data = await retrieveDataById("event", searchParams);
    return NextResponse.json(data);
  }
  const data = await retrieveData("event");
  return NextResponse.json(data);
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
