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

function cleanTicketCode(rawCode: string): string {
  if (!rawCode) return "";
  let code = rawCode.trim();

  // If input is a URL, extract code from search params or path
  if (code.startsWith("http://") || code.startsWith("https://")) {
    try {
      const parsedUrl = new URL(code);
      const queryCode =
        parsedUrl.searchParams.get("qrCode") ||
        parsedUrl.searchParams.get("code") ||
        parsedUrl.searchParams.get("qr");
      if (queryCode) {
        code = queryCode;
      } else {
        const segments = parsedUrl.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          code = segments[segments.length - 1];
        }
      }
    } catch {
      // Keep original code if URL parsing fails
    }
  }

  code = code.replace(/\.pdf$/i, "");
  code = code.replace(/^e[-_]?ticket[-_]?/i, "");
  code = code.replace(/^e[-_]?coupon[-_]?/i, "");
  code = code.replace(/^e[-_]?kupon[-_]?/i, "");
  code = code.replace(/^ticket[-_]?/i, "");
  code = code.replace(/^coupon[-_]?/i, "");
  code = code.replace(/^kupon[-_]?/i, "");
  return code.trim();
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

    const cleanCode = cleanTicketCode(qrCode);
    const candidateCodes = Array.from(
      new Set([
        qrCode,
        cleanCode,
        `E-Ticket-${cleanCode}`,
        `E-Coupon-${cleanCode}`,
        `Ticket-${cleanCode}`,
        `Coupon-${cleanCode}`,
      ])
    ).filter(Boolean);

    let docSnap: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    for (const code of candidateCodes) {
      const snap = await db
        .collection("qr_detail")
        .where("qr_code", "==", code)
        .limit(1)
        .get();

      if (!snap.empty) {
        docSnap = snap.docs[0];
        break;
      }
    }

    // Fallback: check transaction_id for DRIVE- imports
    if (!docSnap && cleanCode) {
      const driveSnap = await db
        .collection("qr_detail")
        .where("transaction_id", "==", `DRIVE-${cleanCode}`)
        .limit(1)
        .get();

      if (!driveSnap.empty) {
        docSnap = driveSnap.docs[0];
      }
    }

    if (!docSnap) {
      return NextResponse.json(
        { message: "Barcode Tidak Ditemukan" },
        { status: 404 }
      );
    }
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
        try {
          const sheetRes = await updateTicketScanInGoogleSheets(data.qr_code, dateFormat, true);
          console.log(`[QR Scan] Sheets sync result for ${data.qr_code}:`, sheetRes);
        } catch (sheetErr) {
          console.error("[QR Scan] Google Sheets sync error:", sheetErr);
        }
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
