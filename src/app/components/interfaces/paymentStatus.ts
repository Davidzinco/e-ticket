export type PaymentProvider = "doku" | "midtrans" | "bypass_test";
export type PaymentEmailStatus = "pending" | "sent" | "failed";
export type PaymentSheetsSyncStatus = "pending" | "synced" | "failed";

export interface PaymentStatusInterface {
  id?: string;

  // Core identifiers
  order_id: string;
  event_id: string;
  event_name: string;

  // Buyer info
  name: string[];
  nik?: string[];
  email: string;

  // Ticket info
  ticket: number;
  package_id?: string;
  unit_price?: number;
  gross_amount?: number;

  // Payment provider
  provider?: PaymentProvider;
  provider_reference?: string;
  provider_status?: string;
  payment_url?: string;
  payment_type?: string;
  transaction_id?: string;
  transaction_time?: string;

  // Internal status
  status: string;

  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
  paidAt?: Date | string;
  expiresAt?: Date | string;

  // Guards (idempotency)
  stock_reserved?: boolean;
  stock_released?: boolean;
  tickets_issued?: boolean;

  // Side-effect tracking
  email_status?: PaymentEmailStatus;
  sheets_sync_status?: PaymentSheetsSyncStatus;
}
