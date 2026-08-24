"use client";
import React, { useEffect, useState, Suspense } from "react";
import Header from "../components/layouts/header/header";
import BottomNav from "../components/layouts/bottomNav/bottomNav";
import { QrCodeInterface } from "../components/interfaces/qrCode";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";
import { Link } from "next-view-transitions";

export default function MyTicketPage() {
  return (
    <Suspense fallback={null}>
      <MyTicketContent />
    </Suspense>
  );
}

function MyTicketContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [nik, setNik] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingOrder, setIsPendingOrder] = useState<boolean>(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<QrCodeInterface[] | null>(null);
  const [qrImages, setQrImages] = useState<{ [key: string]: string }>({});

  const generateQRCodes = async (ticketList: QrCodeInterface[]) => {
    const images: { [key: string]: string } = {};
    for (const item of ticketList) {
      try {
        const url = await QRCode.toDataURL(item.qr_code, {
          width: 320,
          margin: 2,
          color: {
            dark: "#181d18",
            light: "#ffffff",
          },
        });
        images[item.id || item.qr_code] = url;
      } catch (err) {
        console.error("Failed to generate QR code image:", err);
      }
    }
    setQrImages(images);
  };

  const fetchTickets = async (userEmail: string, userNik: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsPendingOrder(false);
    setPendingOrderId(null);

    try {
      const res = await fetch("/api/myticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, nik: userNik }),
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
        setTickets(data.data);
        await generateQRCodes(data.data);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "bnc_saved_ticket_auth",
            JSON.stringify({ email: userEmail, nik: userNik })
          );
        }
        toast.success(data.message || "Tiket berhasil ditemukan!");
      } else if (data.isPending) {
        setIsPendingOrder(true);
        setPendingOrderId(data.orderId || null);
        setTickets(null);
        setErrorMessage(data.message);
      } else {
        setTickets(null);
        setErrorMessage(
          data.message ||
            "Tiket tidak ditemukan. Pastikan email dan NIK yang Anda masukkan sesuai saat pembelian."
        );
        toast.error(data.message || "Tiket tidak ditemukan.");
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
      setErrorMessage("Terjadi kesalahan jaringan saat memuat tiket.");
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login on mount if credentials exist in localStorage or searchParams
  useEffect(() => {
    const paramEmail = searchParams.get("email");
    const paramNik = searchParams.get("nik");

    if (paramEmail && paramNik) {
      setEmail(paramEmail);
      setNik(paramNik);
      fetchTickets(paramEmail, paramNik);
      return;
    }

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bnc_saved_ticket_auth");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.email && parsed.nik) {
            setEmail(parsed.email);
            setNik(parsed.nik);
            fetchTickets(parsed.email, parsed.nik);
          }
        } catch {
          // ignore corrupted localstorage
        }
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      return toast.error("Format email tidak valid");
    }
    if (!nik || nik.length < 8) {
      return toast.error("Masukkan NIK minimal 8 digit angka");
    }
    fetchTickets(email.trim(), nik.trim());
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bnc_saved_ticket_auth");
    }
    setTickets(null);
    setErrorMessage(null);
    setIsPendingOrder(false);
    toast.info("Anda telah keluar dari sesi tiket.");
  };

  const handleDownloadQr = (qrCodeStr: string, name: string) => {
    const dataUrl = qrImages[qrCodeStr];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `BNC2026-QR-${name.replace(/\s+/g, "_")}-${qrCodeStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code berhasil diunduh!");
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container">
      <Header title="Official E-Ticket" currentView="myticket" />

      <main className="flex-grow container mx-auto max-w-2xl px-4 sm:px-6 py-6 flex flex-col gap-6 pt-20 pb-28">
        {/* VIEW 1: LOGIN / LOOKUP FORM */}
        {!tickets ? (
          <div className="flex flex-col gap-6">
            {/* Card Login */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-6 sm:p-8 ambient-shadow relative overflow-hidden">
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                  style={{
                    backgroundColor: "rgb(185, 239, 197)",
                    color: "rgb(42, 91, 59)",
                  }}
                >
                  <span className="material-symbols-outlined text-3xl font-bold">
                    local_activity
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  Akses E-Tiket Kamu
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-md">
                  Masukkan <strong>Email</strong> dan <strong>NIK</strong> yang
                  Anda gunakan saat melakukan pemesanan tiket.
                </p>
              </div>

              {/* Alert Error / Pending Message */}
              {errorMessage && (
                <div
                  className={`p-4 rounded-xl mb-6 text-xs sm:text-sm flex items-start gap-3 border ${
                    isPendingOrder
                      ? "bg-amber-50 text-amber-900 border-amber-200"
                      : "bg-red-50 text-red-900 border-red-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">
                    {isPendingOrder ? "schedule" : "error"}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{errorMessage}</p>
                    {isPendingOrder && pendingOrderId && (
                      <p className="mt-1 font-mono text-xs">
                        Order ID: #{pendingOrderId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider"
                  >
                    Email Pemesan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">
                        mail
                      </span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      autoCapitalize="off"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Input NIK */}
                <div>
                  <label
                    htmlFor="nik"
                    className="block text-xs font-bold text-on-surface mb-1.5 uppercase tracking-wider"
                  >
                    Nomor Induk Kependudukan (NIK){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">
                        badge
                      </span>
                    </div>
                    <input
                      id="nik"
                      type="text"
                      inputMode="numeric"
                      required
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                      maxLength={20}
                      placeholder="Masukkan 16 digit NIK terdaftar"
                      className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{ backgroundColor: "rgb(56, 105, 72)" }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memverifikasi Data...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">
                        search
                      </span>
                      <span>Lihat Tiket Saya</span>
                    </>
                  )}
                </button>
              </form>

              {/* Info Note */}
              <div className="mt-6 pt-5 border-t border-outline-variant/60 flex items-start gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5 text-primary">
                  info
                </span>
                <p>
                  Tiket akan muncul jika pembayaran Anda telah berstatus{" "}
                  <strong>LUNAS</strong>. Tunjukkan QR Code tiket pada panitia
                  saat registrasi di lokasi.
                </p>
              </div>
            </div>

            {/* Hubungi Panitia */}
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <h3 className="text-xs font-bold text-on-surface">
                  Kendala Akses Tiket?
                </h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Hubungi admin resmi Bhima Night Carnival untuk bantuan.
                </p>
              </div>
              <Link
                href="https://wa.me/+6289680575400"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-xl text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-green-600">
                  chat
                </span>
                WhatsApp Panitia
              </Link>
            </div>
          </div>
        ) : (
          /* VIEW 2: TICKETS LIST (LOGGED IN) */
          <div className="flex flex-col gap-6">
            {/* User Session Bar */}
            <div className="bg-surface rounded-2xl border border-outline-variant p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-xs"
                  style={{
                    backgroundColor: "rgb(185, 239, 197)",
                    color: "rgb(42, 91, 59)",
                  }}
                >
                  <span className="material-symbols-outlined text-xl">
                    person
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {email}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-mono truncate">
                    NIK: {nik} • {tickets.length} Tiket Ditemukan
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Ganti Akun</span>
              </button>
            </div>

            {/* List of Tickets */}
            <div className="space-y-6">
              {tickets.map((ticket, index) => {
                const qrUrl = qrImages[ticket.id || ticket.qr_code];
                const isScanned = ticket.isScanned;

                return (
                  <div
                    key={ticket.id || ticket.qr_code || index}
                    className="bg-surface rounded-2xl border border-outline-variant p-6 sm:p-8 ambient-shadow relative overflow-hidden text-left"
                  >
                    {/* Ticket Header & Status */}
                    <div className="flex justify-between items-start border-b border-dashed border-outline-variant pb-4 mb-4">
                      <div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                          style={{ color: "rgb(56, 105, 72)" }}
                        >
                          Official E-Ticket #{index + 1}
                        </span>
                        <h2 className="text-xl font-extrabold text-on-surface">
                          {ticket.event_name || "Bhima Night Carnival 2026"}
                        </h2>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          5 Desember 2026 • 16:00 WIB • SMAN 1 Madiun
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-xs"
                        style={
                          isScanned
                            ? {
                                color: "rgb(90, 90, 90)",
                                backgroundColor: "rgb(230, 230, 230)",
                              }
                            : {
                                color: "rgb(42, 91, 59)",
                                backgroundColor: "rgb(185, 239, 197)",
                              }
                        }
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isScanned ? "check" : "verified"}
                        </span>
                        {isScanned ? "SUDAH DI-SCAN" : "VALID"}
                      </div>
                    </div>

                    {/* Ticket Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                          Nama Pemegang
                        </span>
                        <span className="font-bold text-sm text-on-surface">
                          {ticket.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                          NIK
                        </span>
                        <span className="font-mono font-bold text-on-surface">
                          {ticket.nik || nik}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                          Order ID
                        </span>
                        <span className="font-mono font-bold text-on-surface truncate block">
                          #{ticket.order_id}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">
                          Status Pembayaran
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: "rgb(56, 105, 72)" }}
                        >
                          LUNAS
                        </span>
                      </div>
                    </div>

                    {/* Real QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-xl border border-outline-variant text-center">
                      {qrUrl ? (
                        <div className="p-3 bg-white rounded-xl shadow-md border border-outline-variant">
                          <img
                            src={qrUrl}
                            alt={`QR Code ${ticket.qr_code}`}
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-48 h-48 bg-white flex items-center justify-center rounded-xl animate-pulse">
                          <span className="text-xs text-gray-400">
                            Membuat QR Code...
                          </span>
                        </div>
                      )}

                      <span className="font-mono text-xs text-on-surface font-extrabold mt-3 tracking-widest bg-surface px-3 py-1 rounded-lg border border-outline-variant">
                        {ticket.qr_code}
                      </span>
                      <p className="text-[11px] text-on-surface-variant mt-2 max-w-xs">
                        Tunjukkan QR Code ini kepada panitia tiket di pintu
                        masuk event.
                      </p>
                    </div>

                    {/* Action Buttons for this ticket */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full pt-5">
                      <button
                        onClick={() =>
                          handleDownloadQr(
                            ticket.id || ticket.qr_code,
                            ticket.name
                          )
                        }
                        className="flex-1 py-2.5 px-4 bg-surface border border-outline-variant text-on-surface rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-container transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm text-primary">
                          download
                        </span>
                        Simpan Gambar QR
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-xs"
                        style={{ backgroundColor: "rgb(56, 105, 72)" }}
                      >
                        <span className="material-symbols-outlined text-sm">
                          print
                        </span>
                        Cetak / Download PDF
                      </button>
                    </div>

                    {/* Perforated Side Notches */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full border-r border-outline-variant"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full border-l border-outline-variant"></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab="myticket" />
    </div>
  );
}
