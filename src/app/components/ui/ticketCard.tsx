"use client";
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCodeInterface } from "../interfaces/qrCode";
import { toast } from "sonner";

interface TicketCardProps {
  ticket: QrCodeInterface;
  index?: number;
  totalTickets?: number;
}

export default function TicketCard({ ticket, index = 0, totalTickets = 1 }: TicketCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const maskNik = (rawNik?: string) => {
    if (!rawNik || rawNik === "-") return "-";
    const cleaned = String(rawNik).trim();
    if (cleaned.length <= 8) return cleaned.slice(0, 3) + "****" + cleaned.slice(-2);
    return cleaned.slice(0, 4) + "*".repeat(cleaned.length - 8) + cleaned.slice(-4);
  };

  useEffect(() => {
    if (!ticket.qr_code) return;

    let isMounted = true;
    QRCode.toDataURL(ticket.qr_code, {
      width: 360,
      margin: 2,
      color: {
        dark: "#181d18",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [ticket.qr_code]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `Coupon_${ticket.name.replace(/\s+/g, "_")}_${ticket.qr_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Berhasil mengunduh QR Code untuk ${ticket.name}`);
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 md:p-6 shadow-md relative overflow-hidden text-left mb-6 font-sans">
      {/* Header Badge & Title */}
      <div className="flex justify-between items-start border-b border-dashed border-outline-variant pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider block"
              style={{ color: "rgb(56, 105, 72)" }}
            >
              Official E-Coupon
            </span>
            {totalTickets > 1 && (
              <span className="text-[10px] bg-surface-container-high text-on-surface px-2 py-0.5 rounded-full font-bold">
                Kupon {index + 1} dari {totalTickets}
              </span>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-on-surface mt-0.5">
            {ticket.event_name || "Bhima Night Carnival 2026"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {ticket.transaction_time ? ticket.transaction_time : "Desember 15, 2026 • 16:00 WIB"}
          </p>
        </div>
        <div>
          {ticket.isScanned ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              TERPAKAI / SCANNED
            </span>
          ) : (
            <span
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                color: "rgb(42, 91, 59)",
                backgroundColor: "rgb(185, 239, 197)",
                borderColor: "rgb(134, 219, 153)",
              }}
            >
              VALID
            </span>
          )}
        </div>
      </div>

      {/* Ticket Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-5">
        <div>
          <span className="text-[10px] text-on-surface-variant block">Nama Pemilik Kupon</span>
          <span className="font-bold text-on-surface text-sm">{ticket.name}</span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block">Identitas (NIK)</span>
          <span className="font-mono font-bold text-on-surface">{maskNik(ticket.nik)}</span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block">Order ID</span>
          <span className="font-mono font-bold text-on-surface">#{ticket.order_id}</span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block">ID Transaksi</span>
          <span className="font-mono font-bold text-on-surface truncate block">
            {ticket.transaction_id || "-"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block">Email Pemesan</span>
          <span className="font-bold text-on-surface truncate block">{ticket.email}</span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant block">Status Pembayaran</span>
          <span className="font-bold text-primary uppercase" style={{ color: "rgb(56, 105, 72)" }}>
            LUNAS
          </span>
        </div>
      </div>

      {/* Real QR Code Container */}
      <div className="flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-xl border border-outline-variant text-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code ${ticket.qr_code}`}
            className="w-44 h-44 md:w-52 md:h-52 object-contain rounded-lg border border-outline-variant bg-white p-2 shadow-sm"
          />
        ) : (
          <div className="w-44 h-44 md:w-52 md:h-52 flex flex-col items-center justify-center bg-white rounded-lg border border-outline-variant p-4">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary mb-2">
              progress_activity
            </span>
            <span className="text-[11px] text-on-surface-variant">Generating QR Code...</span>
          </div>
        )}
        <span className="font-mono text-xs text-on-surface font-extrabold tracking-wider mt-2.5 bg-surface-container-highest px-3 py-1 rounded-md border border-outline-variant">
          {ticket.qr_code}
        </span>
        <p className="text-[11px] text-on-surface-variant mt-1">
          Tunjukkan QR Code ini kepada panitia di pintu masuk acara.
        </p>

        <button
          type="button"
          onClick={handleDownloadQr}
          className="mt-3 py-2 px-4 bg-surface border border-outline-variant text-on-surface rounded-lg font-bold text-xs hover:bg-surface-container-high transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span> Unduh QR Kupon Ini
        </button>
      </div>

      {/* Decorative Ticket Cutout Notches */}
      <div className="absolute -left-3 top-1/2 w-6 h-6 bg-surface rounded-full border-r border-outline-variant"></div>
      <div className="absolute -right-3 top-1/2 w-6 h-6 bg-surface rounded-full border-l border-outline-variant"></div>
    </div>
  );
}
