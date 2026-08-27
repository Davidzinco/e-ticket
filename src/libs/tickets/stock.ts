import { db } from "@/libs/firebase/admin";
import type { Transaction, DocumentReference, DocumentData } from "firebase-admin/firestore";

export async function reserveStock(
  transaction: Transaction,
  eventRef: DocumentReference,
  eventData: DocumentData,
  packageId: string,
  quantity: number
): Promise<DocumentData> {
  const totalStock = eventData.ticket || 0;
  if (totalStock < quantity) {
    throw new Error("Stok tiket total tidak mencukupi");
  }

  const updatedData: { [key: string]: any } = { ...eventData };
  updatedData.ticket = totalStock - quantity;

  const pkgUpper = (packageId || "").toUpperCase();

  if (pkgUpper === "FESTIVAL" && eventData.ticket_festival !== undefined) {
    if (eventData.ticket_festival < quantity) {
      throw new Error("Stok tiket Festival tidak mencukupi");
    }
    updatedData.ticket_festival = eventData.ticket_festival - quantity;
  } else if (pkgUpper === "VIP" && eventData.ticket_vip !== undefined) {
    if (eventData.ticket_vip < quantity) {
      throw new Error("Stok tiket VIP tidak mencukupi");
    }
    updatedData.ticket_vip = eventData.ticket_vip - quantity;
  }

  if (eventData.packages && Array.isArray(eventData.packages)) {
    const pkgIndex = eventData.packages.findIndex(
      (p: any) => (p.id || "").toUpperCase() === pkgUpper
    );
    if (pkgIndex !== -1) {
      const currentPkgTicket = eventData.packages[pkgIndex].ticket ?? eventData.packages[pkgIndex].quota ?? 0;
      if (currentPkgTicket < quantity) {
        throw new Error(`Stok paket ${packageId} tidak mencukupi`);
      }
      updatedData.packages = eventData.packages.map((pkg: any, idx: number) => {
        if (idx === pkgIndex) {
          return {
            ...pkg,
            ticket: currentPkgTicket - quantity,
          };
        }
        return pkg;
      });
    }
  }

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

    updatedData.ticket = (eventData.ticket || 0) + quantity;

    const pkgUpper = (packageId || "").toUpperCase();

    if (pkgUpper === "FESTIVAL" && eventData.ticket_festival !== undefined) {
      updatedData.ticket_festival = eventData.ticket_festival + quantity;
    } else if (pkgUpper === "VIP" && eventData.ticket_vip !== undefined) {
      updatedData.ticket_vip = eventData.ticket_vip + quantity;
    }

    if (eventData.packages && Array.isArray(eventData.packages)) {
      const pkgIndex = eventData.packages.findIndex(
        (p: any) => (p.id || "").toUpperCase() === pkgUpper
      );
      if (pkgIndex !== -1) {
        updatedData.packages = eventData.packages.map((pkg: any, idx: number) => {
          if (idx === pkgIndex) {
            return {
              ...pkg,
              ticket: (pkg.ticket || 0) + quantity,
            };
          }
          return pkg;
        });
      }
    }

    transaction.update(eventRef, updatedData);
  });
}
