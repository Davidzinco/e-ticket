export type InternalPaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled" | "refunded";

export function mapDokuStatus(dokuStatus: string, responseCode?: string): InternalPaymentStatus {
  const status = dokuStatus.toUpperCase();
  if (status === "SUCCESS" || responseCode === "00") return "paid";
  if (status === "PENDING") return "pending";
  if (status === "FAILED") return "failed";
  if (status === "VOIDED") return "cancelled";
  if (status === "REFUND") return "refunded";
  return "pending"; // Default
}

export function isSuccessStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "paid" || s === "settlement" || s === "capture";
}

export function isFailedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "expired" || s === "cancelled";
}

export function isPendingStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "pending";
}
