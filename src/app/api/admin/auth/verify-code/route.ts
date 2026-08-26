import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  checkRateLimit,
  createAdminSessionToken,
  getClientIp,
  recordFailedAttempt,
  resetRateLimit,
  verifyAdminAccessCode,
} from "@/libs/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: rateCheck.message || "Akses diblokir sementara.",
          remainingAttempts: 0,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Kode akses wajib diisi.",
          remainingAttempts: rateCheck.remainingAttempts,
        },
        { status: 400 }
      );
    }

    const isValid = verifyAdminAccessCode(code);

    if (!isValid) {
      const failRecord = recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          locked: failRecord.locked,
          message: failRecord.message,
          remainingAttempts: failRecord.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Success: reset failed attempts and generate secure session cookie
    resetRateLimit(ip);
    const token = createAdminSessionToken();

    const response = NextResponse.json(
      {
        success: true,
        message: "Verifikasi berhasil. Mengarahkan ke Console Admin...",
        redirect: "/consol_admin",
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("POST /api/admin/auth/verify-code error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memverifikasi kode." },
      { status: 500 }
    );
  }
}
