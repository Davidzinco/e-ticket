"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "next-view-transitions";

export default function ConsolAdminEventsView() {
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvent = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/event?id=5W7jcnr28tGc5E8tywRl");
      const data = await res.json();
      setEventData(data);
    } catch {
      toast.error("Gagal memuat detail event.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-outline-variant p-6 ambient-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h3 className="font-extrabold text-base text-on-surface">
              {eventData?.title || "Bhima Night Carnival 2026"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Lokasi: {eventData?.location || "SMAN 1 Madiun"} • ID: 5W7jcnr28tGc5E8tywRl
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                eventData?.isSoldOut
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
            >
              {eventData?.isSoldOut ? "SOLDOUT" : "PENJUALAN AKTIF"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paket Festival */}
            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-on-surface">Paket FESTIVAL</h4>
                <span className="text-[10px] font-bold py-0.5 px-2 bg-primary/10 text-primary rounded-md">
                  Reguler
                </span>
              </div>
              <div className="text-2xl font-black text-on-surface">
                Rp {(eventData?.price_festival || eventData?.price || 56000).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-on-surface-variant">
                Sisa Kuota: <strong>{eventData?.ticket_festival ?? 500}</strong> kupon
              </p>
            </div>

            {/* Paket VIP */}
            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-on-surface">Paket VIP</h4>
                <span className="text-[10px] font-bold py-0.5 px-2 bg-amber-500/10 text-amber-600 rounded-md">
                  Special Access
                </span>
              </div>
              <div className="text-2xl font-black text-on-surface">
                Rp {(eventData?.price_vip || 140000).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-on-surface-variant">
                Sisa Kuota: <strong>{eventData?.ticket_vip ?? 100}</strong> kupon
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-outline-variant">
          <Link
            href="/"
            target="_blank"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Buka Halaman Pembelian Publik</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          <button
            onClick={fetchEvent}
            className="py-2 px-3.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container"
          >
            Segarkan Data
          </button>
        </div>
      </div>
    </div>
  );
}
