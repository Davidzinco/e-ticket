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
      if (data) return NextResponse.json(data);
      // Fallback
      return NextResponse.json({
        id: searchParams,
        title: "Bhima Night Carnival",
        sub_title: "BNC 2026",
        description: "Official E-Ticket Bhima Night Carnival 2026 SMAN 1 Madiun.",
        location: "SMAN 1 Madiun",
        src: "https://sman1madiun.sch.id/wp-content/uploads/2024/10/logo-banner.png",
        closeTime: { seconds: 1788616800, nanoseconds: 0 },
        isSoldOut: false,
        timestamp: { seconds: 1788595200, nanoseconds: 0 },
        price: 56000,
        price_festival: 56000,
        price_vip: 140000,
        ticket: 1698,
        ticket_festival: 500,
        ticket_vip: 100,
      });
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
      const updates: { [key: string]: any } = { ticket: newTicket };

      const packageId = (dataPayment as any).package_id;
      if (packageId === "VIP" && eventData.ticket_vip !== undefined) {
        updates.ticket_vip = eventData.ticket_vip + dataPayment.ticket;
      } else if (packageId === "FESTIVAL" && eventData.ticket_festival !== undefined) {
        updates.ticket_festival = eventData.ticket_festival + dataPayment.ticket;
      }

      if (Array.isArray(eventData.packages) && packageId) {
        updates.packages = eventData.packages.map((pkg: any) => {
          if (pkg.id === packageId && typeof pkg.ticket === "number") {
            return { ...pkg, ticket: pkg.ticket + dataPayment.ticket };
          }
          return pkg;
        });
      }

      transaction.update(eventRef, updates);
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
