"use client";
import { Link } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "../components/layouts/header/header";
import BottomNav from "../components/layouts/bottomNav/bottomNav";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const transactionStatus = searchParams.get("transaction_status");
  const statusCode = searchParams.get("status_code");
  const orderId = searchParams.get("order_id") || "BNC-892410";

  const isSuccess =
    (transactionStatus === "settlement" || transactionStatus === "capture") &&
    statusCode === "200";
  const isPending = transactionStatus === "pending" && statusCode === "201";

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container">
      <Header title="Official E-Ticket" currentView="myticket" />

      <main className="flex-grow container mx-auto max-w-2xl px-4 sm:px-6 py-6 flex flex-col gap-6 pt-20 pb-28">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center w-full px-4 mb-2">
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              ✓
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">Select</span>
          </div>
          <div
            className="flex-1 h-[2px] mx-4 max-w-[80px]"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          ></div>
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              ✓
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">Payment</span>
          </div>
          <div
            className="flex-1 h-[2px] mx-4 max-w-[80px]"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          ></div>
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md"
              style={{ backgroundColor: "rgb(56, 105, 72)", color: "rgb(232, 255, 233)" }}
            >
              3
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">Success</span>
          </div>
        </div>

        {/* Status Card */}
        {isSuccess || !transactionStatus ? (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-bounce shadow-md"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">
                Pembayaran Berhasil!
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1">
                Transaksi Anda telah terverifikasi. E-Tiket resmi Anda sudah aktif.
              </p>
            </div>

            {/* Official E-Ticket Card Stub */}
            <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-md relative overflow-hidden text-left mt-4">
              <div className="flex justify-between items-start border-b border-dashed border-outline-variant pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block" style={{ color: "rgb(56, 105, 72)" }}>
                    Official E-Ticket
                  </span>
                  <h3 className="text-lg font-bold text-on-surface">Bhima Night Carnival</h3>
                  <p className="text-xs text-on-surface-variant">Desember 15, 2024 • 18:00 WIB</p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ color: "rgb(42, 91, 59)", backgroundColor: "rgb(185, 239, 197)" }}
                >
                  VALID
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Jenis Tiket</span>
                  <span className="font-bold text-on-surface">Tiket Resmi (Official Pass)</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">ID Transaksi</span>
                  <span className="font-mono font-bold text-on-surface">#{orderId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Identitas / NIK</span>
                  <span className="font-bold text-on-surface">Terverifikasi</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Status Pembayaran</span>
                  <span className="font-bold text-primary" style={{ color: "rgb(56, 105, 72)" }}>LUNAS</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                {/* Embedded SVG QR representation */}
                <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                  <rect width="100" height="100" fill="#ffffff" />
                  <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#181d18"/>
                  <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#181d18"/>
                  <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#181d18"/>
                  <rect x="45" y="10" width="10" height="20" fill="#181d18"/>
                  <rect x="45" y="45" width="20" height="10" fill="#181d18"/>
                  <rect x="70" y="55" width="20" height="20" fill="#181d18"/>
                  <rect x="50" y="70" width="15" height="15" fill="#181d18"/>
                </svg>
                <span className="font-mono text-[11px] text-on-surface-variant mt-2 font-bold">
                  #{orderId}-QR-TICKET
                </span>
              </div>

              {/* Side Cutout Notches */}
              <div className="absolute -left-3 top-1/2 w-6 h-6 bg-surface rounded-full border-r border-outline-variant"></div>
              <div className="absolute -right-3 top-1/2 w-6 h-6 bg-surface rounded-full border-l border-outline-variant"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                <span className="material-symbols-outlined text-sm">download</span> Download E-Ticket
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container transition-all text-center"
              >
                <span className="material-symbols-outlined text-sm">home</span> Beranda
              </Link>
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Pembayaran Tertunda</h2>
            <p className="text-xs text-on-surface-variant">
              Pembayaran Anda masih menunggu proses. Silakan selesaikan pembayaran sesuai instruksi.
            </p>
            <div className="flex gap-3 w-full pt-4">
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Status Transaksi</h2>
            <p className="text-xs text-on-surface-variant">
              Mohon hubungi panitia kami jika mengalami kendala transaksi.
            </p>
            <div className="flex gap-3 w-full pt-4">
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs text-center"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/+6289680575400"
                className="flex-1 py-3 px-4 bg-primary text-on-primary rounded-xl font-bold text-xs text-center"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                Hubungi Panitia
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab="myticket" />
    </div>
  );
}
