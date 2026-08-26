import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import { authOptions } from "@/libs/auth/auth";
import { db } from "@/libs/firebase/admin";
import { firestore } from "@/libs/firebase/init";
import { doc, getDoc } from "firebase/firestore";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/libs/adminAuth";
import { updateTicketScanInGoogleSheets } from "@/libs/googleSheets";

export const dynamic = "force-dynamic";

async function checkAdmin(req: NextRequest) {
  // 1. Check Console Admin session cookie (bnc_admin_session)
  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminSessionToken(adminCookie)) {
    return {
      user: {
        email: "admin@bnc.smasa.sch.id",
        name: "Panitia BNC 2026",
      },
    };
  }

  // 2. Check NextAuth Google session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const userDoc = await getDoc(doc(firestore, "users", session.user.id));
      if (userDoc.exists() && userDoc.data().role === "admin") {
        return session;
      }
    }
  } catch (e) {
    console.warn("NextAuth session check error:", e);
  }

  return null;
}

export async function GET(req: NextRequest) {
  const session = await checkAdmin(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized: Sesi admin diperlukan." }, { status: 401 });
  }

  try {
    const qrCode = req.nextUrl.searchParams.get("qrCode")?.trim();
    if (!qrCode) {
      return NextResponse.json(
        { message: "Parameter qrCode wajib disertakan" },
        { status: 400 }
      );
    }

    const hasFirebaseCredentials =
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (!hasFirebaseCredentials || !db) {
      return NextResponse.json(
        {
          data: {
            id: "demo_ticket_scan",
            name: "Pengunjung Demo",
            email: "demo@smasa.sch.id",
            nik: "3519000000000000",
            qr_code: qrCode,
            event_name: "Bhima Night Carnival 2026",
            isScanned: true,
            scanned_at: new Date().toLocaleString("id-ID"),
            scanned_by: session.user?.email || "Admin",
          },
          message: "Unscanned",
        },
        { status: 200 }
      );
    }

    const res = await db
      .collection("qr_detail")
      .where("qr_code", "==", qrCode)
      .get();

    if (res.empty) {
      return NextResponse.json(
        { message: "Barcode Tidak Ditemukan" },
        { status: 404 }
      );
    }

    const docSnap = res.docs[0];
    const data = {
      id: docSnap.id,
      ...docSnap.data(),
    } as QrCodeInterface;

    if (data.isScanned && data.action !== "Invalid") {
      return NextResponse.json(
        { data, message: "Scanned" },
        { status: 200 }
      );
    }

    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    };

    const parts = new Intl.DateTimeFormat("id-ID", options).formatToParts(date);
    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const year = parts.find((p) => p.type === "year")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    const second = parts.find((p) => p.type === "second")?.value;

    const dateFormat = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

    data.scanned_at = dateFormat;
    data.scanned_by = session?.user?.email || "Admin";
    data.isScanned = true;

    try {
      await db.collection("qr_detail").doc(data.id!).update({
        isScanned: true,
        scanned_at: dateFormat,
        scanned_by: session?.user?.email || "Admin",
      });

      // Sync scan status & time to Google Sheets in real-time
      if (data.qr_code) {
        updateTicketScanInGoogleSheets(data.qr_code, dateFormat, true).catch((err) =>
          console.error("Async Google Sheets scan update error:", err)
        );
      }

      return NextResponse.json(
        { data, message: "Unscanned" },
        { status: 200 }
      );
    } catch {
      return NextResponse.json(
        { message: "Gagal memperbarui status scan di database" },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ message: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
