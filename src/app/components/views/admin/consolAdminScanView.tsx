"use client";
import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CustDataInterface } from "@/app/components/interfaces/qrCode";
import { toast } from "sonner";

export default function ConsolAdminScanView() {
  const readerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [decodedResult, setDecodedResult] = useState<string>("-");
  const [manualCode, setManualCode] = useState<string>("");
  const [ticketResult, setTicketResult] = useState<CustDataInterface | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "valid" | "already_scanned" | "invalid">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  // Sound effects via Web Audio API (no external asset dependencies)
  const playBeep = (type: "success" | "warning" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        // High double beep
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === "warning") {
        // Lower triple beep for already scanned
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        // Low error buzz
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch {
      // AudioContext not allowed before user interaction
    }
  };

  const processQrCode = async (code: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setDecodedResult(code);

    try {
      const res = await fetch(`/api/qr?qrCode=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (res.status === 200) {
        setTicketResult(data);
        if (data.message === "Scanned") {
          // Already scanned before
          setScanStatus("already_scanned");
          setStatusMessage("KUPON SUDAH PERNAH DIGUNAKAN");
          playBeep("warning");
          toast.warning("Kupon ini sudah pernah masuk sebelumnya!");
          setScanHistory((prev) => [
            {
              code,
              name: data.data?.name || "Pengunjung",
              time: new Date().toLocaleTimeString("id-ID"),
              status: "already_scanned",
            },
            ...prev.slice(0, 19),
          ]);
        } else {
          // Valid unscanned ticket -> successfully scanned!
          setScanStatus("valid");
          setStatusMessage("KUPON VALID - SILAKAN MASUK");
          playBeep("success");
          toast.success("Kupon Valid! Pengunjung dipersilakan masuk.");
          setScanHistory((prev) => [
            {
              code,
              name: data.data?.name || "Pengunjung",
              time: new Date().toLocaleTimeString("id-ID"),
              status: "valid",
            },
            ...prev.slice(0, 19),
          ]);
        }
      } else {
        setScanStatus("invalid");
        setStatusMessage(data.message || "KUPON TIDAK DITEMUKAN");
        setTicketResult(null);
        playBeep("error");
        toast.error(data.message || "Kupon tidak terdaftar di sistem.");
        setScanHistory((prev) => [
          {
            code,
            name: "Tidak Dikenal",
            time: new Date().toLocaleTimeString("id-ID"),
            status: "invalid",
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err) {
      console.error("Scan processing error:", err);
      setScanStatus("invalid");
      setStatusMessage("KENDALA KONEKSI SERVER");
      playBeep("error");
      toast.error("Gagal memverifikasi kupon ke server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanner = async () => {
    if (!readerRef.current) return;

    if (!qrRef.current) {
      qrRef.current = new Html5Qrcode("reader");
    }

    try {
      setIsScanning(true);
      // Perfect 1:1 square qrbox calculation
      const qrboxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
        return { width: edge, height: edge };
      };

      await qrRef.current.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: qrboxSize,
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Debounce / pause scanner briefly to avoid double reads
          if (qrRef.current && qrRef.current.isScanning) {
            try {
              await qrRef.current.stop();
              setIsScanning(false);
            } catch (e) {
              console.warn(e);
            }
          }
          await processQrCode(decodedText.trim());
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera start error:", err);
      setIsScanning(false);
      toast.error("Gagal membuka kamera. Pastikan izin kamera aktif.");
    }
  };

  const stopScanner = async () => {
    if (qrRef.current && isScanning) {
      try {
        await qrRef.current.stop();
      } catch (err) {
        console.warn(err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleToggleScan = () => {
    if (isScanning) {
      stopScanner();
    } else {
      setScanStatus("idle");
      startScanner();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processQrCode(manualCode.trim());
    setManualCode("");
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (qrRef.current && qrRef.current.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Dynamic inline styles for 1:1 camera feed and square viewfinder */}
      <style jsx global>{`
        #reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: #09090b !important;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem !important;
        }
        #reader__scan_region {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          aspect-ratio: 1 / 1 !important;
        }
        #reader__scan_region svg {
          aspect-ratio: 1 / 1 !important;
        }
        #reader__dashboard_section {
          display: none !important;
        }
        #reader img {
          display: none !important;
        }
      `}</style>

      {/* Top Banner / Status Indicator */}
      {scanStatus !== "idle" && (
        <div
          className={`p-5 rounded-2xl text-center font-black text-sm md:text-base border shadow-md animate-pulse flex items-center justify-center gap-2 ${
            scanStatus === "valid"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
              : scanStatus === "already_scanned"
              ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
              : "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300"
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {scanStatus === "valid"
              ? "check_circle"
              : scanStatus === "already_scanned"
              ? "warning"
              : "cancel"}
          </span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Scanner Camera & Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Camera & Controls */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 sm:p-5 ambient-shadow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
                  videocam
                </span>
                <span>Kamera Scanner Gate</span>
              </h3>
              <span
                className={`py-0.5 px-2.5 rounded-full text-[10px] font-bold ${
                  isScanning
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {isScanning ? "LIVE SCANNING" : "STANDBY"}
              </span>
            </div>

            {/* Video Viewport: Strictly 1:1 Aspect Ratio on Mobile & Desktop */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] aspect-square mx-auto bg-zinc-950 rounded-2xl overflow-hidden relative border border-outline-variant flex items-center justify-center shadow-inner">
              <div id="reader" ref={readerRef} className="w-full h-full"></div>
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-4 text-center bg-zinc-900/90 space-y-2">
                  <span className="material-symbols-outlined text-4xl text-zinc-500">
                    qr_code_scanner
                  </span>
                  <p className="text-xs font-bold text-zinc-300">Kamera Sedang Nonaktif</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs">
                    Klik tombol "Mulai Scan" di bawah untuk mengaktifkan kamera scanner pintu masuk.
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleScan}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 text-white ${
                isScanning ? "bg-red-600 hover:bg-red-700" : "hover:opacity-90"
              }`}
              style={!isScanning ? { backgroundColor: "rgb(56, 105, 72)" } : undefined}
            >
              <span className="material-symbols-outlined text-base">
                {isScanning ? "stop" : "play_arrow"}
              </span>
              <span>{isScanning ? "Hentikan Kamera" : "Mulai Scan Kamera"}</span>
            </button>
          </div>

          {/* Manual Code Input */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 sm:p-5 ambient-shadow space-y-3">
            <h4 className="font-extrabold text-xs text-on-surface">Input Manual Kode Kupon</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: BNC2026..."
                className="flex-1 px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="py-2.5 px-4 rounded-xl text-on-primary font-bold text-xs shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: "rgb(56, 105, 72)" }}
              >
                Cek
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Ticket Details & History */}
        <div className="lg:col-span-6 space-y-4">
          {/* Ticket Information Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 sm:p-5 ambient-shadow space-y-4">
            <h3 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
                badge
              </span>
              <span>Informasi E-Kupon Terbaca</span>
            </h3>

            <div className="bg-surface-container-low p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant font-bold">Kode QR:</span>
                <span className="font-mono font-bold text-primary" style={{ color: "rgb(56, 105, 72)" }}>
                  {decodedResult}
                </span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">Nama Pemilik:</span>
                <span className="font-bold text-on-surface">{ticketResult?.data?.name || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">NIK:</span>
                <span className="font-mono text-on-surface">{ticketResult?.data?.nik || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">Email:</span>
                <span className="text-on-surface">{ticketResult?.data?.email || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">Kategori:</span>
                <span className="font-bold text-on-surface">{ticketResult?.data?.event_name || "BNC 2026"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">Order ID:</span>
                <span className="font-mono text-on-surface">#{ticketResult?.data?.order_id || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-on-surface-variant">Waktu Scan:</span>
                <span className="text-on-surface">{ticketResult?.data?.scanned_at || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Petugas Gate:</span>
                <span className="text-on-surface">{ticketResult?.data?.scanned_by || "Admin"}</span>
              </div>
            </div>
          </div>

          {/* Scan Log History */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-4 sm:p-5 ambient-shadow space-y-3">
            <h3 className="font-extrabold text-xs text-on-surface">Riwayat Scan Terakhir Sesi Ini</h3>
            {scanHistory.length > 0 ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-surface-container-low rounded-xl text-xs flex items-center justify-between border border-outline-variant/50"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">{item.name}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant">{item.code}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-on-surface-variant">{item.time}</span>
                      <span
                        className={`py-0.5 px-2 rounded-full text-[9px] font-bold ${
                          item.status === "valid"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : item.status === "already_scanned"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {item.status === "valid"
                          ? "VALID"
                          : item.status === "already_scanned"
                          ? "DUPLIKAT"
                          : "INVALID"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                Belum ada riwayat pemindaian kupon pada sesi ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
