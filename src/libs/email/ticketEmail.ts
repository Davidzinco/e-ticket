import nodemailer from "nodemailer";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import toDate from "@/app/components/utils/toDate";

export interface SendTicketEmailParams {
  email: string;
  names: string[];
  niks?: string[];
  orderId?: string;
  transactionId?: string;
  transactionTime?: string;
  paymentType?: string;
  eventName: string;
  eventTimestamp?: { seconds: number } | Date | string | any;
  eventLocation?: string;
  eventImageSrc?: string;
  qrCodes: string[];
}

function maskNik(rawNik?: string): string {
  if (!rawNik || rawNik === "-") return "-";
  const cleaned = String(rawNik).trim();
  if (cleaned.length <= 8) return cleaned.slice(0, 3) + "****" + cleaned.slice(-2);
  return cleaned.slice(0, 4) + "*".repeat(cleaned.length - 8) + cleaned.slice(-4);
}

function formatEventDateTime(timestamp?: any, defaultStr = "15 Desember 2026 • 16:00 WIB"): string {
  if (!timestamp) return defaultStr;
  try {
    const d = toDate(timestamp);
    if (d && !isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      const timeStr = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      });
      return `${dateStr} • ${timeStr} WIB`;
    }
  } catch {
    // Fallback if parsing fails
  }
  return defaultStr;
}

export async function sendTicketEmail(
  params: SendTicketEmailParams
): Promise<{ success: boolean; message?: string }> {
  try {
    const userEmail = process.env.DEFAULT_EMAIL_USER_ADMIN;
    const passEmail = process.env.DEFAULT_EMAIL_PASSWORD_ADMIN;

    if (!userEmail || !passEmail) {
      console.warn("⚠️ SMTP credentials not configured (DEFAULT_EMAIL_USER_ADMIN / DEFAULT_EMAIL_PASSWORD_ADMIN). Skipping email dispatch.");
      return { success: false, message: "SMTP credentials not configured" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: userEmail.trim(),
        pass: passEmail.replace(/\s+/g, ""),
      },
    });

    const {
      email,
      names,
      niks = [],
      orderId = "",
      transactionId = "",
      transactionTime,
      eventName,
      eventTimestamp,
      eventLocation = "SMAN 1 Madiun",
      qrCodes,
    } = params;

    const eventTimeStr = formatEventDateTime(eventTimestamp, transactionTime || "15 Desember 2026 • 16:00 WIB");
    const primaryNik = niks[0] || "";
    const totalTickets = qrCodes.length;

    // Resolve site url for web lookup button
    const siteUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const myTicketUrl = `${siteUrl}/myticket?email=${encodeURIComponent(email)}&nik=${encodeURIComponent(primaryNik)}`;

    // Prepare binary Buffer attachments for high reliability CID rendering
    const attachments: any[] = [];
    const qrCidMap: string[] = [];

    // Attach BNC official logo header
    const logoCid = "bnc_header_logo";
    let hasLogoAttachment = false;
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "bnc_2025", "bhima_night_carnival26.webp");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        attachments.push({
          filename: "bhima_night_carnival26.webp",
          content: logoBuffer,
          cid: logoCid,
          contentType: "image/webp",
          contentDisposition: "inline",
        });
        hasLogoAttachment = true;
      }
    } catch (e) {
      console.warn("Could not attach local BNC logo:", e);
    }

    for (let i = 0; i < qrCodes.length; i++) {
      const code = qrCodes[i];
      const cid = `qr_${orderId.replace(/[^a-zA-Z0-9]/g, "")}_${i + 1}`;
      qrCidMap.push(cid);

      const qrDataUrl = await QRCode.toDataURL(code, {
        width: 440,
        margin: 3,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const qrBuffer = Buffer.from(qrDataUrl.split("base64,")[1], "base64");
      attachments.push({
        filename: `qrcode_${i + 1}.png`,
        content: qrBuffer,
        cid: cid,
        contentType: "image/png",
        contentDisposition: "inline",
      });
    }

    // Build coupon cards matching http://localhost:3000/myticket
    const couponCardsHtml = qrCodes
      .map((code, index) => {
        const ownerName = names[index] || names[0] || "Pengunjung";
        const ownerNik = maskNik(niks[index] || primaryNik);
        const couponNumber = index + 1;
        const cidName = qrCidMap[index];

        return `
        <!-- COUPON CARD ${couponNumber} -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #dbe2d9; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;">
          <tr>
            <td style="padding: 24px 24px 20px 24px;">
              <!-- Card Header -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #386948; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      OFFICIAL E-COUPON
                    </span>
                    ${
                      totalTickets > 1
                        ? `<span style="display: inline-block; font-size: 10px; font-weight: 700; background-color: #edf2eb; color: #2e3830; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            Kupon ${couponNumber} dari ${totalTickets}
                          </span>`
                        : ""
                    }
                    <h3 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #181d18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.3;">
                      ${eventName || "Bhima Night Carnival 2026"}
                    </h3>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #657064; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${eventTimeStr} • ${eventLocation}
                    </p>
                  </td>
                  <td align="right" valign="top" style="white-space: nowrap;">
                    <span style="display: inline-block; padding: 5px 14px; font-size: 11px; font-weight: 800; border-radius: 9999px; color: #2a5b3b; background-color: #b9efc5; border: 1px solid #86db99; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      VALID
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Dashed Divider -->
              <div style="border-top: 1px dashed #d1dcd0; margin: 18px 0 18px 0;"></div>

              <!-- Ticket Info Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td width="50%" valign="top" style="padding-bottom: 12px; padding-right: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Nama Pemilik Kupon
                    </span>
                    <strong style="font-size: 14px; color: #181d18; display: block; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${ownerName}
                    </strong>
                  </td>
                  <td width="50%" valign="top" style="padding-bottom: 12px; padding-left: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Identitas (NIK)
                    </span>
                    <strong style="font-size: 14px; color: #181d18; display: block; margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      ${ownerNik}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding-bottom: 12px; padding-right: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Order ID
                    </span>
                    <strong style="font-size: 13px; color: #181d18; display: block; margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                      #${orderId || "-"}
                    </strong>
                  </td>
                  <td width="50%" valign="top" style="padding-bottom: 12px; padding-left: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break: break-all;">
                      ID Transaksi
                    </span>
                    <strong style="font-size: 13px; color: #181d18; display: block; margin-top: 2px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; word-break: break-all;">
                      ${transactionId || "-"}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style="padding-right: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Email Pemesan
                    </span>
                    <strong style="font-size: 13px; color: #181d18; display: block; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; word-break: break-all;">
                      ${email}
                    </strong>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 8px;">
                    <span style="font-size: 10px; color: #6b776a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Status Pembayaran
                    </span>
                    <strong style="font-size: 13px; color: #386948; text-transform: uppercase; display: block; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      LUNAS
                    </strong>
                  </td>
                </tr>
              </table>

              <!-- QR Code Display Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7faf6; border: 1px solid #dce4da; border-radius: 12px; text-align: center;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <!-- QR Code Image Container (White box with fixed background) -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; background-color: #ffffff !important; border: 1px solid #dce4da; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                      <tr>
                        <td align="center" style="padding: 10px; background-color: #ffffff !important;">
                          <img src="cid:${cidName}" alt="QR Code ${code}" width="200" height="200" style="display: block; margin: 0 auto; border: 0; outline: none; width: 200px; height: 200px; object-fit: contain; background-color: #ffffff !important;" />
                        </td>
                      </tr>
                    </table>

                    <!-- QR Alphanumeric Code Pill -->
                    <div style="margin-top: 14px;">
                      <span style="display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: #181d18; background-color: #e5ece3; padding: 6px 16px; border-radius: 8px; border: 1px solid #ced8cb;">
                        ${code}
                      </span>
                    </div>

                    <p style="margin: 8px 0 0 0; font-size: 11px; color: #6b776a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Tunjukkan QR Code ini kepada panitia di pintu masuk acara.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        `;
      })
      .join("");

    const emailHtml = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Coupon Official - Bhima Night Carnival 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121914; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #121914; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 30px 15px 50px 15px;">
        <!-- MAIN CONTAINER (Max width 600px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
          
          <!-- BRAND / BANNER HEADER -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              ${
                hasLogoAttachment
                  ? `<div style="text-align: center; padding: 10px 0;">
                      <img src="cid:${logoCid}" alt="Bhima Night Carnival 2026" width="340" style="display: block; margin: 0 auto; max-width: 340px; width: 100%; height: auto; object-fit: contain;" />
                    </div>`
                  : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #1d3324 0%, #0d1710 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
                      <tr>
                        <td style="padding: 28px 20px;">
                          <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #86db99; text-transform: uppercase;">
                            SMA NEGERI 1 MADIUN
                          </span>
                          <h1 style="margin: 6px 0 0 0; font-size: 24px; font-weight: 800; color: #ffffff;">
                            BHIMA NIGHT CARNIVAL 2026
                          </h1>
                        </td>
                      </tr>
                    </table>`
              }
            </td>
          </tr>

          <!-- GREETING & SUCCESS BANNER -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 24px;">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #86db99; text-transform: uppercase;">
                      E-COUPON RESMI SMASA
                    </span>
                    <h2 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      Pembelian Kupon Berhasil 🎊
                    </h2>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #c0ccc2; line-height: 1.5;">
                      Hai <strong style="color: #ffffff;">${names[0] || "Pengunjung"}</strong> 👋🏻, transaksi kamu telah berhasil diverifikasi. Berikut adalah data e-kupon dan QR Code resmi kamu:
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- COUPON CARDS LIST -->
          <tr>
            <td>
              ${couponCardsHtml}
            </td>
          </tr>

          <!-- WEB ACCESS CTA BUTTON -->
          <tr>
            <td align="center" style="padding: 10px 0 30px 0;">
              <a href="${myTicketUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: rgb(56, 105, 72); color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(56, 105, 72, 0.4); text-align: center;">
                📱 Buka &amp; Simpan E-Kupon di Web
              </a>
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #8e9c90;">
                Atau akses kapan saja di menu <strong style="color: #ffffff;">"My Coupon"</strong> dengan email &amp; NIK kamu.
              </p>
            </td>
          </tr>

          <!-- IMPORTANT NOTICE -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 12px; padding: 16px;">
                <tr>
                  <td>
                    <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #fde047;">
                      ⚠️ Ketentuan Penting:
                    </h4>
                    <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #e2e8e0; line-height: 1.6;">
                      <li>QR Code hanya dapat di-scan <strong>1 (satu) kali</strong> di pintu masuk acara.</li>
                      <li>Harap bawa kartu identitas (KTP/Kartu Pelajar/KK) yang sesuai saat penukaran.</li>
                      <li>Jangan membagikan tangkapan layar (screenshot) QR Code ini ke publik untuk menghindari penyalahgunaan.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #ffffff;">
                © 2026 Bhima Night Carnival • SMAN 1 Madiun
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #8e9c90;">
                Jl. Mastrip No.19, Mojorejo, Kec. Taman, Kota Madiun, Jawa Timur 63139
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px;">
                <a href="https://sman1madiun.sch.id/" target="_blank" style="color: #86db99; text-decoration: none; font-weight: 700;">
                  Website Resmi SMAN 1 Madiun
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const plainText = `Halo ${names[0] || "Pengunjung"}!\n\nPembelian E-Coupon Bhima Night Carnival 2026 berhasil.\nOrder ID: #${orderId}\nEvent: ${eventName}\nWaktu & Lokasi: ${eventTimeStr} • ${eventLocation}\nKode Kupon: ${qrCodes.join(", ")}\n\nBuka E-Kupon kamu di web: ${myTicketUrl}\n\n© 2026 Bhima Night Carnival • SMAN 1 Madiun`;

    const sendResult = await transporter.sendMail({
      from: `"Bhima Night Carnival 2026" <${userEmail}>`,
      to: email,
      subject: `E-Coupon Resmi (${orderId}) - ${eventName || "Bhima Night Carnival 2026"}`,
      text: plainText,
      html: emailHtml,
      attachments,
    });

    if (sendResult.accepted && sendResult.accepted.length > 0) {
      console.log(`✅ E-Coupon email successfully sent to ${email} (Order ID: ${orderId})`);
      return { success: true };
    }

    return { success: false, message: "Email not accepted by recipient server" };
  } catch (error) {
    console.error("❌ Failed to send ticket/coupon email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
