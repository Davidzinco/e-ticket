"use client";
import React, { useState } from "react";
import { toast } from "sonner";

export default function ConsolAdminSettingsView() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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

  const handleSyncSheets = async (action: "test" | "sync_all") => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Sinkronisasi berhasil!");
        setSyncResult(`Berhasil: ${data.message} ${data.count ? `(${data.count} tiket)` : ""}`);
      } else {
        toast.error(data.message || "Gagal sinkronisasi.");
        setSyncResult(`Gagal: ${data.message}`);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat sync.");
      setSyncResult("Gagal terhubung ke server.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Status Sistem & Integrasi Google Sheets */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
              table_chart
            </span>
            <span>Integrasi Google Spreadsheet (Opsi B)</span>
          </h3>
          <span className="py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            AKTIF
          </span>
        </div>

        <div className="space-y-3 text-xs text-on-surface-variant">
          <p>
            Sistem secara otomatis mengirimkan data pembeli ke tab <strong>"WEBSITE RESMI"</strong> pada spreadsheet setiap kali transaksi diselesaikan.
          </p>
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant space-y-1">
            <p className="font-bold text-on-surface">Target Sheet: "WEBSITE RESMI"</p>
            <p className="text-[11px]">
              Kolom: <em>Timestamp, Email Address, Bukti Pembayaran, Nama Lengkap, NIK, No Telp, Email, Kategori Tiket, Jumlah, Nama, Kategori Detail, Kode Tiket, Order ID, <strong>Kehadiran (Checkbox)</strong>, Waktu Scan</em>.
            </p>
          </div>
        </div>

        {/* Sync Action Buttons */}
        <div className="space-y-3 pt-2">
          <h4 className="font-extrabold text-xs text-on-surface">Aksi & Pengujian Sinkronisasi:</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSyncSheets("test")}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>Kirim 1 Baris Uji Coba ke Spreadsheet</span>
            </button>
            <button
              onClick={() => handleSyncSheets("sync_all")}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-xl text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50"
              style={{ backgroundColor: "rgb(56, 105, 72)" }}
            >
              <span className="material-symbols-outlined text-base">sync</span>
              <span>Sinkronkan Seluruh Tiket Database ke Spreadsheet</span>
            </button>
          </div>

          {syncResult && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                syncResult.startsWith("Berhasil")
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30"
              }`}
            >
              {syncResult}
            </div>
          )}
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
          className="py-2.5 px-5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>{isLoggingOut ? "Keluar..." : "Keluar dari Console"}</span>
        </button>
      </div>
    </div>
  );
}
