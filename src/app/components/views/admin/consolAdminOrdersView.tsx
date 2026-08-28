"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export default function ConsolAdminOrdersView() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (res.ok && json.success) {
        setOrders(json.data || []);
      } else {
        toast.error(json.message || "Gagal memuat transaksi.");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-outline-variant p-5 sm:p-6 ambient-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
              Daftar Transaksi Pemesanan ({orders.length} Transaksi)
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Data transaksi yang tercatat pada sistem pembayaran.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="py-2 px-3.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Segarkan</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-xs">Memuat data order...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="py-3 px-3 font-bold">Order ID</th>
                  <th className="py-3 px-3 font-bold">Nama Kontak</th>
                  <th className="py-3 px-3 font-bold">Email</th>
                  <th className="py-3 px-3 font-bold">Jumlah</th>
                  <th className="py-3 px-3 font-bold text-center">Status</th>
                  <th className="py-3 px-3 font-bold">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {orders.map((o, idx) => (
                  <tr key={o.id || o.order_id || idx} className="hover:bg-surface-container/50">
                    <td className="py-3 px-3 font-mono font-bold text-on-surface">#{o.order_id || o.id}</td>
                    <td className="py-3 px-3 text-on-surface">
                      {Array.isArray(o.name) ? o.name.join(", ") : o.name || "-"}
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">{o.email || "-"}</td>
                    <td className="py-3 px-3 font-bold">{o.ticket || 1} Kupon</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold ${
                          o.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {String(o.status || "Unknown").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant text-[11px]">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-on-surface-variant text-xs">
            Belum ada transaksi pending atau tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
