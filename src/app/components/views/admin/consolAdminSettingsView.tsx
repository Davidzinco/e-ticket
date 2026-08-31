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

  const handleSyncSheets = async (action: "test" | "sync_all" | "test_email") => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      let targetEmail = "";
      if (action === "test_email") {
        const input = window.prompt("Masukkan alamat email tujuan untuk menerima contoh E-Kupon:", "user@example.com");
        if (!input) {
          setIsSyncing(false);
          return;
        }
        targetEmail = input.trim();
      }

      const res = await fetch("/api/admin/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || (action === "test_email" ? "Email e-kupon berhasil dikirim!" : "Sinkronisasi berhasil!"));
        setSyncResult(`Berhasil: ${data.message || "Email e-kupon berhasil dikirim ke target"} ${data.count ? `(${data.count} kupon)` : ""}`);
      } else {
        toast.error(data.message || "Gagal melakukan aksi.");
        setSyncResult(`Gagal: ${data.message}`);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
      setSyncResult("Gagal terhubung ke server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const [driveImportResult, setDriveImportResult] = useState<string | null>(null);
  const [pastedCodes, setPastedCodes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"Festival" | "VIP" | "Coupon Festival">("Festival");

  const handleImportDriveTickets = async (type: "paste" | "test" | "pull_sheets") => {
    setIsImportingDrive(true);
    setDriveImportResult(null);

    try {
      let bodyPayload: any = {};

      if (type === "pull_sheets") {
        bodyPayload = { action: "pull_from_sheets" };
      } else if (type === "test") {
        const sampleCode = `BNC-20260824-${Math.floor(100000 + Math.random() * 900000)}`;
        bodyPayload = {
          tickets: [
            {
              qr_code: sampleCode,
              kategori: selectedCategory,
              event_name: `Bhima Night Carnival 2026 (${selectedCategory})`,
            },
          ],
        };
      } else {
        const rawLines = pastedCodes
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (rawLines.length === 0) {
          toast.error("Silakan masukkan minimal satu kode tiket/kupon.");
          setIsImportingDrive(false);
          return;
        }

        bodyPayload = {
          tickets: rawLines.map((code) => ({
            qr_code: code,
            kategori: selectedCategory,
            event_name: `Bhima Night Carnival 2026 (${selectedCategory})`,
          })),
        };
      }

      const res = await fetch("/api/admin/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Import tiket berhasil!");
        setDriveImportResult(`✅ ${data.message}`);
        if (type === "paste") setPastedCodes("");
      } else {
        toast.error(data.message || "Gagal import tiket.");
        setDriveImportResult(`❌ Gagal: ${data.message}`);
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat import tiket.");
      setDriveImportResult("❌ Gagal terhubung ke server.");
    } finally {
      setIsImportingDrive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Integrasi Google Drive & Tab 'DATA DRIVE' */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
              folder_zip
            </span>
            <span>Integrasi Kupon / Tiket Google Drive ➔ Tab "DATA DRIVE"</span>
          </h3>
          <span className="py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            DRIVE &amp; OFFLINE
          </span>
        </div>

        <div className="space-y-3 text-xs text-on-surface-variant">
          <p>
            Otomasi pembacaan file PDF tiket dari Google Drive ke tab <strong>"DATA DRIVE"</strong> di Google Spreadsheet, lalu sinkronisasi instan ke Firebase Firestore agar siap dipindai di Scanner Gate.
          </p>
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
            <p className="font-bold text-on-surface">Alur Integrasi Otomatis:</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-on-surface-variant">
              <li>Pasang script <code>google-apps-script/Code.gs</code> pada Spreadsheet (menu <em>Extensions &gt; Apps Script</em>).</li>
              <li>Buka spreadsheet, klik menu <strong>🎟️ E-Ticket SMASA Tools &gt; 1. 📂 Baca Google Drive</strong>.</li>
              <li>Klik menu <strong>2. 🚀 Sinkronkan Tab 'DATA DRIVE' ke Firebase</strong>.</li>
              <li>Semua barcode PDF langsung aktif dan terdaftar di Scanner Gate!</li>
            </ol>
          </div>
        </div>

        {/* Quick Manual Code Import / Test */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
          <h4 className="font-extrabold text-xs text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">input</span>
            <span>Input / Import Cepat Kode Kupon ke Database:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Kategori Tiket:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-outline-variant rounded-xl text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Festival">Festival</option>
                <option value="VIP">VIP</option>
                <option value="Coupon Festival">Coupon Festival</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Tempel Kode Tiket (pisahkan dengan baris baru atau koma):
              </label>
              <textarea
                rows={2}
                value={pastedCodes}
                onChange={(e) => setPastedCodes(e.target.value)}
                placeholder="Contoh: BNC-20260824-154557, BNC-20260824-155622..."
                className="w-full px-3 py-2 bg-background border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              onClick={() => handleImportDriveTickets("pull_sheets")}
              disabled={isImportingDrive}
              className="py-2 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50"
              style={{ backgroundColor: "rgb(56, 105, 72)" }}
            >
              <span className="material-symbols-outlined text-base">cloud_download</span>
              <span>Tarik Tiket dari Tab 'DATA DRIVE' Sheets ke Firebase</span>
            </button>
            <button
              onClick={() => handleImportDriveTickets("test")}
              disabled={isImportingDrive}
              className="py-2 px-3.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">science</span>
              <span>Uji Coba 1 Kode Acak</span>
            </button>
            <button
              onClick={() => handleImportDriveTickets("paste")}
              disabled={isImportingDrive || !pastedCodes.trim()}
              className="py-2 px-4 rounded-xl border border-outline-variant text-xs font-bold flex items-center gap-1.5 hover:bg-surface-container transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">publish</span>
              <span>Import Kode yang Ditempel</span>
            </button>
          </div>

          {driveImportResult && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                driveImportResult.startsWith("✅")
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30"
              }`}
            >
              {driveImportResult}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Status Sistem & Integrasi Google Sheets (Tab WEBSITE RESMI) */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-5">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ color: "rgb(56, 105, 72)" }}>
              table_chart
            </span>
            <span>Integrasi Google Spreadsheet (Tab "WEBSITE RESMI")</span>
          </h3>
          <span className="py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            ONLINE STORE
          </span>
        </div>

        <div className="space-y-3 text-xs text-on-surface-variant">
          <p>
            Sistem secara otomatis mengirimkan data pembeli ke tab <strong>"WEBSITE RESMI"</strong> pada spreadsheet setiap kali transaksi checkout DOKU diselesaikan.
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
          <h4 className="font-extrabold text-xs text-on-surface">Aksi &amp; Pengujian Sinkronisasi &amp; Email:</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSyncSheets("test")}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>Kirim 1 Baris Uji Coba ke Sheets</span>
            </button>
            <button
              onClick={() => handleSyncSheets("test_email")}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>Kirim Uji Coba Email E-Kupon</span>
            </button>
            <button
              onClick={() => handleSyncSheets("sync_all")}
              disabled={isSyncing}
              className="py-2.5 px-4 rounded-xl text-on-primary text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50"
              style={{ backgroundColor: "rgb(56, 105, 72)" }}
            >
              <span className="material-symbols-outlined text-base">sync</span>
              <span>Sinkronkan Seluruh Kupon ke Sheets</span>
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
            <p>ADMIN_SECRET_EMAIL="your-admin-email@domain.com"</p>
            <p>ADMIN_SECRET_NIK="your-secret-nik-number"</p>
            <p>ADMIN_ACCESS_CODE="your-strong-access-code"</p>
            <p>ADMIN_SESSION_SECRET="your-strong-random-session-secret"</p>
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
