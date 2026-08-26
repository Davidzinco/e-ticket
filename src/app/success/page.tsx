"use client";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { Link } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import Header from "../components/layouts/header/header";
import BottomNav from "../components/layouts/bottomNav/bottomNav";
import TicketCard from "../components/ui/ticketCard";
import { QrCodeInterface } from "../components/interfaces/qrCode";
import { toast } from "sonner";

interface OrderData {
  order_id: string;
  status: string;
  email?: string;
  nik?: string;
  transaction_id?: string;
  transaction_time?: string;
  payment_type?: string;
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessLoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessLoadingFallback() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      <Header title="Official E-Ticket" currentView="myticket" />
      <main className="flex-grow container mx-auto max-w-2xl px-4 py-12 flex flex-col items-center justify-center text-center pt-24 pb-28">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center animate-spin mb-4"
          style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
        >
          <span className="material-symbols-outlined text-3xl font-bold">progress_activity</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Memuat Data Tiket...</h2>
        <p className="text-xs text-on-surface-variant mt-1">Mohon tunggu sebentar.</p>
      </main>
      <BottomNav activeTab="myticket" />
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("order_id")?.trim() || null;
  const urlStatus = searchParams.get("transaction_status")?.trim() || null;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [tickets, setTickets] = useState<QrCodeInterface[]>([]);
  const [pollCount, setPollCount] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const fetchTicketData = useCallback(
    async (isManualRefresh = false) => {
      if (!urlOrderId) {
        setIsLoading(false);
        setErrorMessage("Order ID tidak ditemukan pada URL callback.");
        return;
      }

      if (isManualRefresh) {
        setIsLoading(true);
      }

      try {
        const res = await fetch(`/api/tickets/by-order?order_id=${encodeURIComponent(urlOrderId)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setOrder(data.order || null);
          setOrderStatus(data.status || data.order?.status || "settlement");

          if (Array.isArray(data.tickets) && data.tickets.length > 0) {
            setTickets(data.tickets);
            setIsProcessing(false);
            setIsLoading(false);

            // Auto-save email & NIK to localStorage for /myticket
            if (typeof window !== "undefined") {
              const primaryEmail = data.order?.email || data.tickets[0]?.email;
              const primaryNik = data.order?.nik || data.tickets[0]?.nik;
              if (primaryEmail && primaryNik && primaryNik !== "-") {
                localStorage.setItem(
                  "bnc_saved_ticket_auth",
                  JSON.stringify({ email: primaryEmail, nik: primaryNik })
                );
              }
            }
            return true;
          } else if (data.isTicketsProcessing) {
            setIsProcessing(true);
            setIsLoading(false);
            return false;
          } else {
            setTickets([]);
            setIsProcessing(false);
            setIsLoading(false);
            return false;
          }
        } else {
          setOrderStatus(data.status || urlStatus || "unknown");
          setOrder(data.order || null);
          setTickets([]);
          setErrorMessage(data.message || "Gagal mengambil data tiket.");
          setIsProcessing(false);
          setIsLoading(false);
          return false;
        }
      } catch (err) {
        console.error("Error fetching order tickets:", err);
        setErrorMessage("Terjadi kesalahan jaringan saat memverifikasi tiket.");
        setIsLoading(false);
        setIsProcessing(false);
        return false;
      }
    },
    [urlOrderId, urlStatus]
  );

  // Initial load
  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Polling mechanism if payment is settled but webhook is processing tickets
  useEffect(() => {
    if (!isProcessing || !urlOrderId || pollCount >= 10) return;

    const timer = setInterval(async () => {
      setPollCount((prev) => prev + 1);
      const found = await fetchTicketData();
      if (found) {
        clearInterval(timer);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [isProcessing, urlOrderId, pollCount, fetchTicketData]);

  // Handle print / download full e-ticket
  const handlePrint = () => {
    window.print();
  };

  const isSuccessStatus =
    orderStatus === "settlement" || orderStatus === "capture" || urlStatus === "settlement";
  const isPendingStatus = orderStatus === "pending" || urlStatus === "pending";
  const isFailedStatus =
    orderStatus && ["expire", "cancel", "deny", "failed"].includes(orderStatus.toLowerCase());

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container">
      <Header title="Official E-Ticket" currentView="myticket" />

      <main className="flex-grow container mx-auto max-w-2xl px-4 sm:px-6 py-6 flex flex-col gap-6 pt-20 pb-28">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center w-full px-4 mb-2">
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              ✓
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">Pilih</span>
          </div>
          <div
            className="flex-1 h-[2px] mx-3 max-w-[70px]"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          ></div>
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              ✓
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">Pembayaran</span>
          </div>
          <div
            className="flex-1 h-[2px] mx-3 max-w-[70px]"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          ></div>
          <div className="flex items-center text-primary">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md"
              style={{ backgroundColor: "rgb(56, 105, 72)", color: "rgb(232, 255, 233)" }}
            >
              3
            </div>
            <span className="ml-2 font-bold text-xs hidden sm:inline text-on-surface">E-Tiket</span>
          </div>
        </div>

        {/* STATE 1: LOADING */}
        {isLoading && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center animate-spin shadow-sm"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              <span className="material-symbols-outlined text-3xl font-bold">progress_activity</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">
                Memverifikasi Pembayaran & Tiket...
              </h2>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                Sistem sedang memeriksa status transaksi dan mengambil data tiket dari database.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: SUCCESS & TICKETS AVAILABLE */}
        {!isLoading && isSuccessStatus && tickets.length > 0 && (
          <div className="flex flex-col items-center space-y-6">
            {/* Header Banner */}
            <div className="w-full bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow flex flex-col items-center text-center space-y-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-md animate-bounce"
                style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
              >
                <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">
                  Pembayaran Berhasil!
                </h2>
                <p className="text-xs md:text-sm text-on-surface-variant mt-1">
                  Transaksi Anda terverifikasi lunas. Berikut e-tiket resmi Anda:
                </p>
              </div>
            </div>

            {/* List of Real Tickets */}
            <div className="w-full">
              {tickets.map((t, idx) => (
                <TicketCard
                  key={t.id || t.qr_code || idx}
                  ticket={t}
                  index={idx}
                  totalTickets={tickets.length}
                />
              ))}
            </div>

            {/* Main Action Buttons */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-5 w-full ambient-shadow space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md"
                  style={{ backgroundColor: "rgb(56, 105, 72)" }}
                >
                  <span className="material-symbols-outlined text-sm">print</span> Cetak / Unduh E-Tiket
                </button>
                <Link
                  href="/myticket"
                  className="py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container transition-all text-center"
                >
                  <span className="material-symbols-outlined text-sm">confirmation_number</span> Lihat di "Tiket Saya"
                </Link>
              </div>

              <Link
                href="/"
                className="w-full py-2.5 px-4 text-on-surface-variant hover:text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span className="material-symbols-outlined text-sm">home</span> Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {/* STATE 3: WEBHOOK TICKETS PROCESSING (TICKETS DELAYED) */}
        {!isLoading && isSuccessStatus && tickets.length === 0 && isProcessing && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-spin shadow-md"
              style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
            >
              <span className="material-symbols-outlined text-3xl font-bold">sync</span>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                Pembayaran Diterima! Tiket Sedang Diproses...
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 max-w-md">
                Pembayaran Anda sudah terverifikasi. Sistem sedang menerbitkan e-tiket dan kode QR resmi untuk Anda.
              </p>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl text-xs w-full max-w-md border border-outline-variant font-mono">
              <span>Order ID: #{urlOrderId}</span>
              <span className="block text-[11px] text-on-surface-variant mt-1">
                Percobaan verifikasi ({pollCount}/10)...
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => fetchTicketData(true)}
                className="flex-1 py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                <span className="material-symbols-outlined text-sm">refresh</span> Coba Muat Ulang Tiket
              </button>
              <Link
                href="/myticket"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container text-center"
              >
                Cek di "Tiket Saya"
              </Link>
            </div>
          </div>
        )}

        {/* STATE 4: PAYMENT PENDING */}
        {!isLoading && isPendingStatus && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Pembayaran Menunggu Penyelesaian</h2>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                Transaksi dengan Order ID <span className="font-mono font-bold text-on-surface">#{urlOrderId}</span> masih berstatus pending. Silakan selesaikan instruksi pembayaran Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <button
                type="button"
                onClick={() => fetchTicketData(true)}
                className="flex-1 py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                <span className="material-symbols-outlined text-sm">refresh</span> Cek Ulang Status Pembayaran
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {/* STATE 5: PAYMENT FAILED / CANCELLED / EXPIRED */}
        {!isLoading && isFailedStatus && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-3xl">cancel</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Transaksi {orderStatus?.toUpperCase()}</h2>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                Transaksi dengan Order ID <span className="font-mono font-bold text-on-surface">#{urlOrderId}</span> telah {orderStatus}. Silakan lakukan pemesanan ulang atau hubungi panitia kami.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center text-center"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/+6289680575400"
                target="_blank"
                className="flex-1 py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-center shadow-md"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                <span className="material-symbols-outlined text-sm">support_agent</span> Hubungi Panitia
              </Link>
            </div>
          </div>
        )}

        {/* STATE 6: ORDER NOT FOUND / ERROR */}
        {!isLoading && !isSuccessStatus && !isPendingStatus && !isFailedStatus && (
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 md:p-8 ambient-shadow flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface">Pesanan Tidak Ditemukan</h2>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md">
                {errorMessage || "Data transaksi tidak dapat ditemukan. Pastikan URL pesanan Anda benar."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Link
                href="/myticket"
                className="flex-1 py-3 px-4 text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all text-center shadow-md"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                <span className="material-symbols-outlined text-sm">search</span> Cari Tiket di "Tiket Saya"
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab="myticket" />
    </div>
  );
}
