import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/libs/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = verifyAdminSessionToken(token);

  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}
