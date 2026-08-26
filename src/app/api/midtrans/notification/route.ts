import { NextRequest, NextResponse } from "next/server";
import path from "path";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import toDate from "@/app/components/utils/toDate";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import { db } from "@/libs/firebase/admin";
import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { sendBuyerToGoogleSheets } from "@/libs/googleSheets";

const ALPHABET: string = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(length: number = 20): string {
  let result: string = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[array[i] % ALPHABET.length];
  }
  return result;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.DEFAULT_EMAIL_USER_ADMIN,
    pass: process.env.DEFAULT_EMAIL_PASSWORD_ADMIN,
  },
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    order_id,
    transaction_status,
    fraud_status,
    transaction_id,
    transaction_time,
    payment_type,
  } = body;
  try {
    if (["expire", "cancel", "deny"].includes(transaction_status)) {
      const baseUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      await fetch(`${baseUrl}/api/event`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id,
        }),
      });
    }

    if (
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")
    ) {
      const qrCodes: string[] = [];
      let dataPaymentResult: PaymentStatusInterface | null = null;
      const result = await db.runTransaction(async (transaction) => {
        const paymentSnap = await transaction.get(
          db.collection("payment_status").where("order_id", "==", order_id)
        );

        if (paymentSnap.empty) {
          throw new Error("Payment not found");
        }

        const paymentDoc = paymentSnap.docs[0];
        const dataPayment = paymentDoc.data() as PaymentStatusInterface;
        const paymentRef = paymentDoc.ref;

        const eventRef = db.collection("event").doc(dataPayment.event_id);
        const eventSnap = await transaction.get(eventRef);

        if (!eventSnap.exists) {
          throw new Error("Event not found");
        }

        const eventData = eventSnap.data();

        try {
          const totalTickets = dataPayment.ticket;
          const qrDetails: QrCodeInterface[] = [];

          for (let i = 0; i < totalTickets; i++) {
            let qrcode: string;
            let exists = true;

            do {
              qrcode = generateCode();

              const existingSnap = await transaction.get(
                db.collection("qr_detail").where("qr_code", "==", qrcode)
              );

              exists = !existingSnap.empty;
            } while (exists);

            const data: QrCodeInterface = {
              qr_code: qrcode,
              id_event: dataPayment.event_id,
              name: dataPayment.name[i],
              nik: dataPayment.nik?.[i] || "-",
              email: dataPayment.email,
              isScanned: false,
              transaction_id,
              transaction_time,
              payment_type,
              ticket: totalTickets,
              order_id,
              event_name: dataPayment.event_name,
              scanned_at: "-",
              action: "First Scan",
              scanned_by: "-",
            };

            qrCodes.push(qrcode);
            qrDetails.push(data);
          }

          transaction.delete(paymentRef);
          qrDetails.forEach((qrData) => {
            const qrRef = db.collection("qr_detail").doc();
            transaction.set(qrRef, qrData);
          });
          dataPaymentResult = dataPayment;
          return { dataPayment, eventData, qrDetails, status: true };
        } catch {
          await transporter.sendMail({
            from: process.env.DEFAULT_EMAIL_USER_ADMIN,
            to: dataPayment.email,
            subject: "Failed Sending Email | Payment ~ Smasa E-Ticket",
            html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
    <p style="font-weight: bold; font-size: 20px;">Maaf terjadi kesalahan dengan sistem kami, jika kamu sudah melakukan pembayaran dan berhasil, tunjukkan history pembayaran dan email ini ke panitia kami.</p>
    
    <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 10px; width: 100%; max-width: 600px;">
      <tr>
        <td style="font-weight: bold; width: 150px;">Nama</td>
        <td>${dataPayment.name[0]}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="font-weight: bold;">Email</td>
        <td>${dataPayment.email}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Nama Event</td>
        <td>${dataPayment.event_name}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="font-weight: bold;">Transaction ID</td>
        <td>${transaction_id}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Transaction Time</td>
        <td>${transaction_time}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="font-weight: bold;">Payment Type</td>
        <td>${payment_type}</td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Order ID</td>
        <td>${order_id}</td>
      </tr>
      <tr style="background-color: #f9f9f9;">
        <td style="font-weight: bold;">Ticket</td>
        <td>${dataPayment.ticket}</td>
      </tr>
    </table>
    
    <p style="margin-top: 20px; color: #555; font-size: 12px;">
      *Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
    </p>
  </div>`,
          });
          throw new Error("Failed Sending Email");
        }
      });

      try {
        const { dataPayment, eventData, qrDetails } = result;

        // Sync to Google Sheets
        if (qrDetails && qrDetails.length > 0) {
          try {
            await sendBuyerToGoogleSheets(qrDetails);
          } catch (err) {
            console.error("Google Sheets sync failed:", err);
          }
        }

        const qrImages: string[] = [];

        for (const code of qrCodes) {
          const qrImage = await QRCode.toDataURL(code, {
            width: 500,
            margin: 2,
          });
          qrImages.push(qrImage);
        }

        const dateConvert = toDate(eventData?.timestamp)
          .toLocaleDateString("id-ID")
          .split("/")
          .join("-");
        const imageName = eventData?.src.slice(
          eventData?.src.lastIndexOf("/") + 1
        );

        const qrHtml = qrImages
          .map((_, index) => {
            return `
<tr><td align="center">
<table class="t119" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t118" style="width:600px;">
<table class="t117" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t116"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td><div class="t33" style="mso-line-height-rule:exactly;mso-line-height-alt:5px;line-height:5px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t37" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="250" class="t36" style="width:250px;">
<table class="t35" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t34" style="overflow:hidden;background-color:#F6F6F6;border-radius:12px 12px 12px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td><div class="t28" style="mso-line-height-rule:exactly;mso-line-height-alt:10px;line-height:10px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t32" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="250" class="t31" style="width:300px;">
<table class="t30" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t29"><div style="font-size:0px;"><img class="t27" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="250" height="250" alt="" src="cid:qrcode_${
              index + 1
            }"/></div></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t38" style="mso-line-height-rule:exactly;mso-line-height-alt:5px;line-height:5px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td><div class="t110" style="mso-line-height-rule:exactly;mso-line-height-alt:5px;line-height:5px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t114" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="440" class="t113" style="width:440px;">
<table class="t112" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t111" style="overflow:hidden;background-color:#F6F6F6;padding:30px 40px 30px 40px;border-radius:12px 12px 12px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td align="center">
<table class="t55" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="360" class="t54" style="width:800px;">
<table class="t53" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t52"><div class="t51" style="width:100%;text-align:left;"><div class="t50" style="display:inline-block;"><table class="t49" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
<tr class="t48"><td></td><td class="t43" width="93.75" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t42" style="width:100%;"><tr><td class="t40"><p class="t39" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:600;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Nama</p></td><td class="t41" style="width:5px;" width="5"></td></tr></table>
</td><td class="t47" width="266.25" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t46" style="width:100%;"><tr><td class="t45"><p class="t44" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#787878;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">${
              dataPayment.name[index]
            }</p></td></tr></table>
</td>
<td></td></tr>
</table></div></div></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t69" style="mso-line-height-rule:exactly;mso-line-height-alt:10px;line-height:10px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t73" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="360" class="t72" style="width:800px;">
<table class="t71" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t70"><div class="t68" style="width:100%;text-align:left;"><div class="t67" style="display:inline-block;"><table class="t66" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
<tr class="t65"><td></td><td class="t60" width="93.75" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t59" style="width:100%;"><tr><td class="t57"><p class="t56" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:600;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Event</p></td><td class="t58" style="width:5px;" width="5"></td></tr></table>
</td><td class="t64" width="266.25" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t63" style="width:100%;"><tr><td class="t62"><p class="t61" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#787878;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">${
              dataPayment.event_name
            }</p></td></tr></table>
</td>
<td></td></tr>
</table></div></div></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t87" style="mso-line-height-rule:exactly;mso-line-height-alt:10px;line-height:10px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t91" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="360" class="t90" style="width:800px;">
<table class="t89" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t88"><div class="t86" style="width:100%;text-align:left;"><div class="t85" style="display:inline-block;"><table class="t84" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
<tr class="t83"><td></td><td class="t78" width="93.75" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t77" style="width:100%;"><tr><td class="t75"><p class="t74" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:600;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Tanggal</p></td><td class="t76" style="width:5px;" width="5"></td></tr></table>
</td><td class="t82" width="266.25" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t81" style="width:100%;"><tr><td class="t80"><p class="t79" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#787878;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">${dateConvert}</p></td></tr></table>
</td>
<td></td></tr>
</table></div></div></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t105" style="mso-line-height-rule:exactly;mso-line-height-alt:10px;line-height:10px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t109" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="360" class="t108" style="width:800px;">
<table class="t107" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t106"><div class="t104" style="width:100%;text-align:left;"><div class="t103" style="display:inline-block;"><table class="t102" role="presentation" cellpadding="0" cellspacing="0" align="left" valign="top">
<tr class="t101"><td></td><td class="t96" width="93.75" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t95" style="width:100%;"><tr><td class="t93"><p class="t92" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:600;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Lokasi</p></td><td class="t94" style="width:5px;" width="5"></td></tr></table>
</td><td class="t100" width="266.25" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t99" style="width:100%;"><tr><td class="t98"><p class="t97" style="margin:0;Margin:0;font-family:Inter Tight,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;direction:ltr;color:#787878;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">${
              eventData?.location
            }</p></td></tr></table>
</td>
<td></td></tr>
</table></div></div></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t115" style="mso-line-height-rule:exactly;mso-line-height-alt:5px;line-height:5px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr></table></td></tr></table>
</td></tr></table>
</td></tr>


    `;
          })
          .join("");

        const sendResult = await transporter.sendMail({
          from: process.env.DEFAULT_EMAIL_USER_ADMIN,
          to: dataPayment.email,
          subject: "Ticket QR Code by Sma Negeri 1 Madiun",
          html: `
               <!--
* This email was built using Tabular.
* For more information, visit https://tabular.email
-->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<title></title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<!--[if !mso]>-->
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<!--<![endif]-->
<meta name="x-apple-disable-message-reformatting" content="" />
<meta content="target-densitydpi=device-dpi" name="viewport" />
<meta content="true" name="HandheldFriendly" />
<meta content="width=device-width" name="viewport" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
<style type="text/css">
table {
border-collapse: separate;
table-layout: fixed;
mso-table-lspace: 0pt;
mso-table-rspace: 0pt
}
table td {
border-collapse: collapse
}
.ExternalClass {
width: 100%
}
.ExternalClass,
.ExternalClass p,
.ExternalClass span,
.ExternalClass font,
.ExternalClass td,
.ExternalClass div {
line-height: 100%
}
body, a, li, p, h1, h2, h3 {
-ms-text-size-adjust: 100%;
-webkit-text-size-adjust: 100%;
}
html {
-webkit-text-size-adjust: none !important
}
body {
min-width: 100%;
Margin: 0px;
padding: 0px;
}
body, #innerTable {
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale
}
#innerTable img+div {
display: none;
display: none !important
}
img {
Margin: 0;
padding: 0;
-ms-interpolation-mode: bicubic
}
h1, h2, h3, p, a {
line-height: inherit;
overflow-wrap: normal;
white-space: normal;
word-break: break-word
}
a {
text-decoration: none
}
h1, h2, h3, p {
min-width: 100%!important;
width: 100%!important;
max-width: 100%!important;
display: inline-block!important;
border: 0;
padding: 0;
margin: 0
}
a[x-apple-data-detectors] {
color: inherit !important;
text-decoration: none !important;
font-size: inherit !important;
font-family: inherit !important;
font-weight: inherit !important;
line-height: inherit !important
}
u + #body a {
color: inherit;
text-decoration: none;
font-size: inherit;
font-family: inherit;
font-weight: inherit;
line-height: inherit;
}
a[href^="mailto"],
a[href^="tel"],
a[href^="sms"] {
color: inherit;
text-decoration: none
}
</style>
<style type="text/css">
@media (min-width: 481px) {
.hd { display: none!important }
}
</style>
<style type="text/css">
@media (max-width: 480px) {
.hm { display: none!important }
}
</style>
<style type="text/css">
@media (max-width: 480px) {
.t10,.t5{color:#1a1a1a!important}.t1{padding-top:0!important}.t218{padding:40px 30px!important;background-color:#f7f7f7!important}.t11{padding-bottom:20px!important}.t10{line-height:28px!important;font-size:26px!important;letter-spacing:-1.04px!important}.t264{padding:40px 30px!important}.t250{padding-bottom:36px!important}.t246{text-align:center!important}.t134,.t151,.t169,.t187,.t229,.t234,.t239,.t41,.t58,.t76,.t94{display:revert!important}.t231,.t236,.t241{vertical-align:top!important;width:49px!important}.t245{vertical-align:top!important;width:24px!important}.t111,.t127,.t204,.t34{border-radius:0!important}.t101,.t141,.t158,.t176,.t194,.t48,.t65,.t83{text-align:left!important}.t136,.t153,.t171,.t189,.t43,.t60,.t78,.t96{vertical-align:top!important;width:205px!important}.t100,.t140,.t157,.t175,.t193,.t47,.t64,.t82{vertical-align:top!important;width:600px!important}
}
</style>
<!--[if !mso]>-->
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,500;0,800;1,500&amp;family=Roboto:wght@700&amp;family=Inter+Tight:wght@500;600&amp;display=swap" rel="stylesheet" type="text/css" />
<!--<![endif]-->
<!--[if mso]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
</head>
<body id="body" class="t270" style="min-width:100%;Margin:0px;padding:0px;background-color:#242424;"><div class="t269" style="background-color:#242424;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td class="t268" style="font-size:0;line-height:0;mso-line-height-rule:exactly;background-color:#242424;" valign="top" align="center">
<!--[if mso]>
<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false">
<v:fill color="#242424"/>
</v:background>
<![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" id="innerTable"><tr><td align="center">
<table class="t4" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="600" class="t3" style="width:600px;">
<table class="t2" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t1" style="padding:48px 0 0 0;"><div style="font-size:0px;"><img class="t0" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="600" height="356.25" alt="" src="cid:banner"/></div></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t221" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="600" class="t220" style="width:600px;">
<table class="t219" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t218" style="background-color:#F8F8F8;padding:60px 50px 60px 50px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td align="center">
<table class="t9" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t8" style="width:600px;">
<table class="t7" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t6" style="padding:0 0 6px 0;"><h1 class="t5" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:16px;font-weight:800;font-style:normal;font-size:16px;text-decoration:none;text-transform:uppercase;letter-spacing:3px;direction:ltr;color:#191919;text-align:left;mso-line-height-rule:exactly;">E-Ticket smasa</h1></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t14" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t13" style="width:600px;">
<table class="t12" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t11"><h1 class="t10" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:41px;font-weight:800;font-style:normal;font-size:39px;text-decoration:none;text-transform:none;letter-spacing:-1.56px;direction:ltr;color:#191919;text-align:left;mso-line-height-rule:exactly;mso-text-raise:1px;">Pembelian Ticket Berhasil 🎊</h1></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t15" style="mso-line-height-rule:exactly;mso-line-height-alt:6px;line-height:6px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t20" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t19" style="width:600px;">
<table class="t18" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t17"><h2 class="t16" style="margin:0;Margin:0;font-family:Roboto,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:30px;font-weight:700;font-style:normal;font-size:28px;text-decoration:none;text-transform:none;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:1px;">Hai ${dataPayment.name[0]} 👋🏻</h2></td></tr></table>
</td></tr></table>
</td></tr><tr><td><div class="t21" style="mso-line-height-rule:exactly;mso-line-height-alt:10px;line-height:10px;font-size:1px;display:block;">&nbsp;&nbsp;</div></td></tr><tr><td align="center">
<table class="t26" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t25" style="width:600px;">
<table class="t24" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t23"><p class="t22" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:16px;text-decoration:none;text-transform:none;letter-spacing:-0.56px;direction:ltr;color:#333333;text-align:left;mso-line-height-rule:exactly;mso-text-raise:2px;">Berikut adalah QR Code kamu<br/>Tunjukkan QR Code ini pada panitia</p></td></tr></table>
</td></tr></table>
</td></tr>

${qrHtml}

<tr><td align="center">
<table class="t217" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t216" style="width:600px;">
<table class="t215" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t214" style="padding:0 0 3px 0;"><p class="t213" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:italic;font-size:16px;text-decoration:none;text-transform:none;letter-spacing:-0.56px;direction:ltr;color:#333333;text-align:center;mso-line-height-rule:exactly;mso-text-raise:2px;">QR Code hanya bisa di scan sekali! Silahkan konfirmasi ke panitia jika ingin keluar dan masuk lagi ke event tersebut</p></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t267" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="600" class="t266" style="width:600px;">
<table class="t265" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t264" style="padding:48px 50px 48px 50px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100% !important;"><tr><td align="center">
<table class="t226" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t225" style="width:600px;">
<table class="t224" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t223"><p class="t222" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:800;font-style:normal;font-size:18px;text-decoration:none;text-transform:none;letter-spacing:-0.9px;direction:ltr;color:#757575;text-align:center;mso-line-height-rule:exactly;mso-text-raise:1px;">Temukan Kami di Media Sosial</p></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t253" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t252" style="width:800px;">
<table class="t251" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t250" style="padding:10px 0 10px 0;"><div class="t249" style="width:100%;text-align:center;"><div class="t248" style="display:inline-block;"><table class="t247" role="presentation" cellpadding="0" cellspacing="0" align="center" valign="top">
<tr class="t246"><td></td><td class="t231" width="49" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t230" style="width:100%;"><tr><td class="t228"><div style="font-size:0px;"><img class="t227" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="24" height="24" alt="" src="https://5315b7be-4a3b-4b68-a98d-29d6fc66bfca.b-cdn.net/e/10fdbaa2-5f77-45a3-8aba-9d03c712fed8/50f96a91-e655-4327-82d4-7dae95c9726b.png"/></div></td><td class="t229" style="width:25px;" width="25"></td></tr></table>
</td><td class="t236" width="49" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t235" style="width:100%;"><tr><td class="t233"><div style="font-size:0px;"><img class="t232" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="24" height="24" alt="" src="https://5315b7be-4a3b-4b68-a98d-29d6fc66bfca.b-cdn.net/e/10fdbaa2-5f77-45a3-8aba-9d03c712fed8/35ae5083-3e59-4690-b516-547ebd1dd1ed.png"/></div></td><td class="t234" style="width:25px;" width="25"></td></tr></table>
</td><td class="t241" width="49" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t240" style="width:100%;"><tr><td class="t238"><div style="font-size:0px;"><img class="t237" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="24" height="24" alt="" src="https://5315b7be-4a3b-4b68-a98d-29d6fc66bfca.b-cdn.net/e/10fdbaa2-5f77-45a3-8aba-9d03c712fed8/f5d11977-4471-4151-85ca-acd605ce3e83.png"/></div></td><td class="t239" style="width:25px;" width="25"></td></tr></table>
</td><td class="t245" width="24" valign="top">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="t244" style="width:100%;"><tr><td class="t243"><a href="https://www.instagram.com/alexanderfarrel._/" style="font-size:0px;" target="_blank"><img class="t242" style="display:block;border:0;height:auto;width:100%;Margin:0;max-width:100%;" width="24" height="24" alt="" src="https://5315b7be-4a3b-4b68-a98d-29d6fc66bfca.b-cdn.net/e/10fdbaa2-5f77-45a3-8aba-9d03c712fed8/2c314951-5c74-40dd-9653-7087a0f19ae3.png"/></a></td></tr></table>
</td>
<td></td></tr>
</table></div></div></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t258" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="500" class="t257" style="width:600px;">
<table class="t256" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t255"><p class="t254" style="margin:0;Margin:0;font-family:Albert Sans,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:22px;font-weight:500;font-style:normal;font-size:12px;text-decoration:none;text-transform:none;direction:ltr;color:#888888;text-align:center;mso-line-height-rule:exactly;mso-text-raise:3px;">Jl. Mastrip No.19, Mojorejo, Kec. Taman, Kota Madiun, Jawa Timur 63139</p></td></tr></table>
</td></tr></table>
</td></tr><tr><td align="center">
<table class="t263" role="presentation" cellpadding="0" cellspacing="0" style="Margin-left:auto;Margin-right:auto;"><tr><td width="200" class="t262" style="width:200px;">
<table class="t261" role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr><td class="t260" style="background-color:#242424;text-align:center;line-height:24px;mso-line-height-rule:exactly;mso-text-raise:3px;"><a class="t259" href="https://sman1madiun.sch.id/" style="display:block;margin:0;Margin:0;font-family:Roboto,BlinkMacSystemFont,Segoe UI,Helvetica Neue,Arial,sans-serif;line-height:24px;font-weight:700;font-style:normal;font-size:14px;text-decoration:none;direction:ltr;color:#0A81FF;text-align:center;mso-line-height-rule:exactly;mso-text-raise:3px;" target="_blank">SMA Negeri 1 Madiun</a></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table>
</td></tr></table>
</td></tr></table></td></tr></table></div><div class="gmail-fix" style="display: none; white-space: nowrap; font: 15px courier; line-height: 0;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></body>
</html>
              `,
          attachments: [
            {
              filename: imageName,
              path: path.join(
                process.cwd(),
                "public",
                "images",
                "bnc_2025",
                imageName
              ),
              cid: "banner",
            },
            ...qrImages.map((qrImage, index) => ({
              filename: `qrcode_${index + 1}.png`,
              content: qrImage.split("base64,")[1],
              encoding: "base64",
              cid: `qrcode_${index + 1}`,
            })),
          ],
        });

        if (sendResult.accepted.length <= 0) {
          return NextResponse.json(
            { message: "Failed to send email" },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Success" }, { status: 200 });
      } catch {
        if (dataPaymentResult) {
          (dataPaymentResult as PaymentStatusInterface).status =
            "failed send email";
          await db.collection("payment_status").doc().set(dataPaymentResult);
        }

        return NextResponse.json(
          { message: "Failed to send email" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const paymentSnap = await db
        .collection("payment_status")
        .where("order_id", "==", order_id)
        .get();
      if (!paymentSnap.empty) {
        const docRef = paymentSnap.docs[0].ref;
        await docRef.update({
          status: error.message,
        });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
