"use client";
import React, { useState } from "react";
import { Link } from "next-view-transitions";
import { toast } from "sonner";

export default function AdminVerifyForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage("Silakan masukkan kode akses khusus.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Verifikasi berhasil! Selamat datang di Console Admin.");
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = data.redirect || "/consol_admin";
        }
      } else {
        setErrorMessage(data.message || "Kode akses tidak valid.");
        if (typeof data.remainingAttempts === "number") {
          setRemainingAttempts(data.remainingAttempts);
        }
        if (data.locked) {
          setIsLocked(true);
        }
        toast.error(data.message || "Akses ditolak.");
      }
    } catch (err) {
      console.error("Admin verify error:", err);
      setErrorMessage("Terjadi kendala jaringan saat menghubungi server.");
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center px-4 sm:px-6 py-12 selection:bg-primary-container selection:text-on-primary-container font-sans">
      <div className="w-full max-w-md bg-surface rounded-3xl border border-outline-variant p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-md mb-3"
            style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
          >
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(56, 105, 72, 0.1)", color: "rgb(56, 105, 72)" }}
          >
            Restricted Access
          </span>
          <h1 className="text-2xl font-extrabold text-on-surface">Console Admin</h1>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
            Halaman ini dikhususkan bagi pengelola dan panitia resmi Bhima Night Carnival.
          </p>
        </div>

        {/* Warning Banner for Remaining Attempts */}
        {remainingAttempts !== null && remainingAttempts <= 2 && !isLocked && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>
              Peringatan: Tersisa <strong>{remainingAttempts}</strong> percobaan sebelum akses diblokir sementara.
            </span>
          </div>
        )}

        {/* Lockout Banner */}
        {isLocked && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-lg flex-shrink-0">lock_clock</span>
            <div>
              <p className="font-bold">Akses Diblokir Sementara</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                Terlalu banyak percobaan gagal. Silakan coba kembali dalam 15 menit.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-on-surface">
              Kode Akses Khusus
            </label>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading || isLocked}
                placeholder="Masukkan kode akses admin..."
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 bg-surface-container-low border border-outline-variant rounded-xl text-sm font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                disabled={isLoading || isLocked}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                aria-label={showCode ? "Sembunyikan kode" : "Tampilkan kode"}
              >
                <span className="material-symbols-outlined text-lg">
                  {showCode ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked || !code.trim()}
            className="w-full py-3.5 px-4 text-on-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
                <span>Memverifikasi Kode...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Masuk ke Console</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Home Link */}
        <div className="pt-2 border-t border-outline-variant text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors py-1 px-3 rounded-lg hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
