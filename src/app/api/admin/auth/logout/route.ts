import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/libs/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Sesi admin berhasil diakhiri.",
      redirect: "/consol_admin",
    },
    { status: 200 }
  );

  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
