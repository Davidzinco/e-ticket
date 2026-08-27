"use client";
import React, { useEffect, useState } from "react";
import { Link } from "next-view-transitions";

interface StatsData {
  totalTickets: number;
  vipTickets: number;
  festivalTickets: number;
  totalRevenue: number;
  scannedCount: number;
  unscannedCount: number;
  pendingOrdersCount?: number;
  recentTickets: any[];
  eventStock?: {
    totalStock: number;
    vipStock: number;
    festivalStock: number;
  } | null;
  isDemoMode?: boolean;
}

export default function ConsolAdminDashboardView() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (res.ok && json.success) {
        setStats(json.data);
      } else {
        setError(json.message || "Gagal memuat data statistik.");
      }
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
      setError("Gagal menghubungi server statistik.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {stats?.isDemoMode && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">info</span>
            <span>
              <strong>Mode Demonstrasi:</strong> Firebase credentials belum dikonfigurasi pada .env, data contoh ditampilkan.
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Tiket Terbit */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 ambient-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Total Tiket Terjual</span>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(56, 105, 72, 0.1)", color: "rgb(56, 105, 72)" }}
            >
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {isLoading ? "..." : stats?.totalTickets ?? 0}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1.5">
              <span>Festival: {stats?.festivalTickets ?? 0}</span> • <span>VIP: {stats?.vipTickets ?? 0}</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Estimasi Pendapatan */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 ambient-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Estimasi Pendapatan</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface truncate">
              {isLoading
                ? "..."
                : `Rp ${(stats?.totalRevenue ?? 0).toLocaleString("id-ID")}`}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Dari tiket lunas terverifikasi
            </p>
          </div>
        </div>

        {/* Metric 3: Pengunjung Hadir (Scanned) */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 ambient-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Kehadiran (Scanned)</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-xl">how_to_reg</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {isLoading ? "..." : stats?.scannedCount ?? 0}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Belum Scan: <strong>{stats?.unscannedCount ?? 0}</strong> tiket
            </p>
          </div>
        </div>

        {/* Metric 4: Sisa Kuota Tiket */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 ambient-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">Sisa Kuota Total</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {isLoading
                ? "..."
                : (Number(stats?.eventStock?.vipStock ?? 0) +
                   Number(stats?.eventStock?.festivalStock ?? 0))}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1">
              VIP: {stats?.eventStock?.vipStock ?? "-"} • Fest: {stats?.eventStock?.festivalStock ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: QR Scanner Gate */}
        <Link
          href="/consol_admin/scan"
          className="bg-surface hover:bg-surface-container rounded-2xl border border-outline-variant p-5 ambient-shadow transition-all group flex items-start gap-4"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-on-primary flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          >
            <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors">
              Buka Scanner Gate
            </h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Validasi tiket pengunjung secara langsung di gerbang masuk via kamera HP atau webcam.
            </p>
          </div>
        </Link>

        {/* Action 2: Kelola Tiket */}
        <Link
          href="/consol_admin/tickets"
          className="bg-surface hover:bg-surface-container rounded-2xl border border-outline-variant p-5 ambient-shadow transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">table_view</span>
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-on-surface group-hover:text-blue-600 transition-colors">
              Lihat Seluruh Tiket
            </h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Cari data pemilik tiket berdasarkan Nama, NIK, Email, atau Kode QR tiket.
            </p>
          </div>
        </Link>

        {/* Action 3: Transaksi & Order */}
        <Link
          href="/consol_admin/orders"
          className="bg-surface hover:bg-surface-container rounded-2xl border border-outline-variant p-5 ambient-shadow transition-all group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-on-surface group-hover:text-amber-600 transition-colors">
              Riwayat Transaksi
            </h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Pantau status pembayaran &amp; riwayat transaksi masuk.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Tickets Section */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-on-surface">Tiket Terbaru Diterbitkan</h3>
            <p className="text-xs text-on-surface-variant">Daftar transaksi tiket terakhir yang masuk ke database.</p>
          </div>
          <button
            onClick={fetchStats}
            className="py-2 px-3 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-xs">Memuat data tiket...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs">
            {error}
          </div>
        ) : stats?.recentTickets && stats.recentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="py-3 px-3 font-bold">Nama Pembeli</th>
                  <th className="py-3 px-3 font-bold">Email</th>
                  <th className="py-3 px-3 font-bold">Kode Tiket</th>
                  <th className="py-3 px-3 font-bold">Kategori</th>
                  <th className="py-3 px-3 font-bold text-center">Status Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {stats.recentTickets.map((ticket, idx) => (
                  <tr key={ticket.id || ticket.qr_code || idx} className="hover:bg-surface-container/50">
                    <td className="py-3 px-3 font-bold text-on-surface">{ticket.name || "-"}</td>
                    <td className="py-3 px-3 text-on-surface-variant">{ticket.email || "-"}</td>
                    <td className="py-3 px-3 font-mono">{ticket.qr_code || "-"}</td>
                    <td className="py-3 px-3">{ticket.event_name || "BNC 2026"}</td>
                    <td className="py-3 px-3 text-center">
                      {ticket.isScanned ? (
                        <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Sudah Scan
                        </span>
                      ) : (
                        <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          Belum Scan
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-on-surface-variant text-xs">
            Belum ada transaksi tiket yang tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
