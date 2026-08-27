import { NextRequest } from "next/server";
import { POST as createPayment } from "@/app/api/payments/create/route";

/**
 * Transition wrapper: forwards legacy requests from /api/tokenizer to /api/payments/create.
 */
export async function POST(req: NextRequest) {
  return createPayment(req);
}

