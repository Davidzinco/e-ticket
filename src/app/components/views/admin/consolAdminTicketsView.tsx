"use client";
import React, { useEffect, useState, useCallback } from "react";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function ConsolAdminTicketsView() {
  const [tickets, setTickets] = useState<QrCodeInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<QrCodeInterface | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setTickets(json.data || []);
      } else {
        toast.error(json.message || "Gagal memuat tiket.");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketDetail = async (ticket: QrCodeInterface) => {
    setSelectedTicket(ticket);
    try {
      const url = await QRCode.toDataURL(ticket.qr_code, {
        width: 300,
        margin: 2,
        color: { dark: "#181d18", light: "#ffffff" },
      });
      setModalQrUrl(url);
    } catch (e) {
      console.error(e);
      setModalQrUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-4 sm:p-5 ambient-shadow flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama, Email, NIK, Order ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none py-2.5 px-3 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-bold text-on-surface focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="scanned">Sudah Masuk (Scanned)</option>
            <option value="unscanned">Belum Scan</option>
          </select>

          <button
            onClick={fetchTickets}
            className="py-2.5 px-4 rounded-xl text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-5 sm:p-6 ambient-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
            Data E-Tiket ({tickets.length} Tiket)
          </h3>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            <p className="text-xs">Memuat data tiket...</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant">
                  <th className="py-3 px-3 font-bold">No</th>
                  <th className="py-3 px-3 font-bold">Nama Pemilik</th>
                  <th className="py-3 px-3 font-bold">NIK</th>
                  <th className="py-3 px-3 font-bold">Email</th>
                  <th className="py-3 px-3 font-bold">Kode Tiket</th>
                  <th className="py-3 px-3 font-bold text-center">Status</th>
                  <th className="py-3 px-3 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {tickets.map((t, idx) => (
                  <tr key={t.id || t.qr_code || idx} className="hover:bg-surface-container/50">
                    <td className="py-3 px-3 text-on-surface-variant font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-on-surface">{t.name || "-"}</td>
                    <td className="py-3 px-3 font-mono text-on-surface-variant">{t.nik || "-"}</td>
                    <td className="py-3 px-3 text-on-surface-variant">{t.email || "-"}</td>
                    <td className="py-3 px-3 font-mono font-bold text-primary" style={{ color: "rgb(56, 105, 72)" }}>
                      {t.qr_code || "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {t.isScanned ? (
                        <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Sudah Scan
                        </span>
                      ) : (
                        <span className="inline-block py-0.5 px-2.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          Belum Scan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => openTicketDetail(t)}
                        className="py-1 px-2.5 rounded-lg border border-outline-variant text-[11px] font-bold hover:bg-surface-container transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-on-surface-variant text-xs">
            Tidak ada tiket yang cocok dengan filter pencarian.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-outline-variant max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Detail E-Tiket</h3>
                <p className="text-xs text-on-surface-variant">Order: #{selectedTicket.order_id || "-"}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* QR Image */}
            {modalQrUrl && (
              <div className="flex justify-center py-2">
                <div className="bg-white p-3 rounded-2xl shadow-inner border border-zinc-200">
                  <img src={modalQrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                </div>
              </div>
            )}

            {/* Ticket Info List */}
            <div className="bg-surface-container-low p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Nama:</span>
                <span className="font-bold text-on-surface">{selectedTicket.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">NIK:</span>
                <span className="font-mono font-bold text-on-surface">{selectedTicket.nik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Email:</span>
                <span className="text-on-surface">{selectedTicket.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Kategori:</span>
                <span className="font-bold text-on-surface">{selectedTicket.event_name || "BNC 2026"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Kode Tiket:</span>
                <span className="font-mono font-bold text-primary" style={{ color: "rgb(56, 105, 72)" }}>
                  {selectedTicket.qr_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Status Scan:</span>
                <span className="font-bold">
                  {selectedTicket.isScanned ? "Sudah Scan (Hadir)" : "Belum Scan"}
                </span>
              </div>
              {selectedTicket.isScanned && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Waktu Scan:</span>
                  <span className="text-on-surface">{selectedTicket.scanned_at || "-"}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 rounded-xl text-on-primary font-bold text-xs"
              style={{ backgroundColor: "rgb(56, 105, 72)" }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
