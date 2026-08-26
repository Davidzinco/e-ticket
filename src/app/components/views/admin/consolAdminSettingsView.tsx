"use client";
import React, { useState } from "react";
import { toast } from "sonner";

export default function ConsolAdminSettingsView() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Sesi admin berhasil diakhiri.");
        window.location.href = "/consol_admin";
      } else {
        toast.error("Gagal logout.");
      }
    } catch {
      toast.error("Terjadi kendala jaringan.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Status Sistem & Integrasi */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-4">
        <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
            sync_saved_locally
          </span>
          <span>Status Integrasi Cloud</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Google Sheets Live Sync</span>
              <span className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AKTIF
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Data tiket otomatis disinkronkan ke tab <strong>WEBSITE RESMI</strong> dengan kolom Checkbox Kehadiran.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">Payment Gateway</span>
              <span className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                TERHUBUNG
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Midtrans Snap API & Webhook Notification untuk penerbitan e-tiket otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Pengaturan Keamanan Akses */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-4">
        <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
            shield
          </span>
          <span>Keamanan & Jalur Akses Admin</span>
        </h3>

        <div className="space-y-3 text-xs text-on-surface-variant">
          <p>Sistem akses Console Admin dikonfigurasi dengan dua jalur terenkripsi:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li>
              <strong>Jalur Tersembunyi (/myticket):</strong> Menggunakan kombinasi rahasia Email dan NIK admin.
            </li>
            <li>
              <strong>Jalur Langsung (/consol_admin):</strong> Menggunakan Kode Akses Khusus dengan perlindungan *Brute-Force Rate Limiting*.
            </li>
            <li>
              <strong>Sesi HTTP-Only Cookie:</strong> Token sesi terenkripsi dengan proteksi *SameSite* & *Secure*.
            </li>
          </ul>
        </div>

        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant text-xs space-y-2">
          <p className="font-bold text-on-surface">Kustomisasi Kredensial Admin di .env:</p>
          <div className="font-mono text-[11px] bg-background p-3 rounded-lg border border-outline-variant text-on-surface overflow-x-auto space-y-1">
            <p>ADMIN_SECRET_EMAIL="admin@bnc.smasa.sch.id"</p>
            <p>ADMIN_SECRET_NIK="3519999999999999"</p>
            <p>ADMIN_ACCESS_CODE="BNC2026-ADMIN-PASS"</p>
            <p>ADMIN_SESSION_SECRET="rahasia_kunci_sesi_admin_anda"</p>
          </div>
        </div>
      </div>

      {/* Card 3: Keluar dari Sesi */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-sm text-on-surface">Akhiri Sesi Admin</h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Hapus cookie sesi dari browser Anda dan kunci kembali Console Admin.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="py-2.5 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>{isLoggingOut ? "Keluar..." : "Keluar dari Console"}</span>
        </button>
      </div>
    </div>
  );
}
