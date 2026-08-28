import { db } from "@/libs/firebase/admin";
import type { Transaction, DocumentReference, DocumentData } from "firebase-admin/firestore";

export async function reserveStock(
  transaction: Transaction,
  eventRef: DocumentReference,
  eventData: DocumentData,
  packageId: string,
  quantity: number
): Promise<DocumentData> {
  const totalStock = eventData.ticket ?? 0;
  if (totalStock < quantity) {
    throw new Error("Stok tiket tidak mencukupi");
  }

  const updatedData: { [key: string]: any } = { ...eventData };
  updatedData.ticket = totalStock - quantity;

  transaction.update(eventRef, updatedData);
  return updatedData;
}

export async function releaseStock(
  orderId: string,
  eventId: string,
  packageId: string,
  quantity: number
): Promise<void> {
  if (!eventId || quantity <= 0) return;
  const eventRef = db.collection("event").doc(eventId);

  await db.runTransaction(async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists) {
      console.warn(`Event ${eventId} not found during stock release for order ${orderId}`);
      return;
    }

    const eventData = eventSnap.data() as DocumentData;
    const updatedData: { [key: string]: any } = { ...eventData };

    updatedData.ticket = (eventData.ticket ?? 0) + quantity;

    transaction.update(eventRef, updatedData);
  });
}
