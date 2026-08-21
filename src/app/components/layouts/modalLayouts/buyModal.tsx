"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import Modal from "../../common/modal";
import { EventInterface } from "../../interfaces/event";
import { v4 as uuidv4 } from "uuid";
import { Tooltip } from "../../common/toolTip";

export default function BuyModal({
  onClose,
  count: initialCount = 1,
  mutate,
  event,
}: {
  onClose: () => void;
  count: number;
  mutate: () => void;
  event: EventInterface | undefined;
}) {
  const [ticketQuantity, setTicketQuantity] = useState<number>(initialCount);
  const [selectedCategory, setSelectedCategory] = useState<string>("vip");
  const [isUsernameErr, setIsUsernameErr] = useState<{ [key: number]: boolean }>({});
  const [isNikErr, setIsNikErr] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const basePrice = event?.price || 45000;
  const categories = [
    {
      id: "vip",
      name: "VIP Pass",
      price: basePrice,
      description: "Fast track entry, VIP Lounge access & free souvenir",
      recommended: true,
    },
    {
      id: "ga",
      name: "General Admission",
      price: Math.max(25000, Math.floor(basePrice * 0.7)),
      description: "General entry to main stage & carnival area",
      recommended: false,
    },
  ];

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0];
  const ticketSubtotal = currentCategoryObj.price * ticketQuantity;
  const serviceFee = selectedCategory === "vip" ? 2500 : 1000;
  const totalAmount = ticketSubtotal + serviceFee;

  const maxTickets = Math.min(5, event?.ticket && event.ticket > 0 ? event.ticket : 5);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const usernameRegex = /^[a-zA-Z0-9 ]{3,50}$/;
    const nikRegex = /^[0-9]{10,20}$/;

    const newErrors: { [key: number]: boolean } = {};
    const newNikErrors: { [key: number]: boolean } = {};

    for (let i = 0; i < ticketQuantity; i++) {
      const name = (formData.get(`name${i}`) as string)?.trim() || "";
      const nik = (formData.get(`nik${i}`) as string)?.trim() || "";

      newErrors[i] = !usernameRegex.test(name);
      newNikErrors[i] = !nikRegex.test(nik);
    }

    setIsUsernameErr(newErrors);
    setIsNikErr(newNikErrors);

    const hasNameError = Object.values(newErrors).some((v) => v);
    const hasNikError = Object.values(newNikErrors).some((v) => v);

    if (hasNameError) {
      setIsLoading(false);
      return toast.error("Nama pengunjung wajib diisi (3-50 karakter)");
    }

    if (hasNikError) {
      setIsLoading(false);
      return toast.error("NIK harus berupa 16 digit angka valid (KTP / KK / Kartu Pelajar)");
    }

    const email = (formData.get("email") as string)?.trim() || "";
    if (!email || !email.includes("@")) {
      setIsLoading(false);
      return toast.error("Format email tidak valid");
    }

    try {
      const orderId = uuidv4().replace(/-/g, "").slice(0, 24);
      const names = Array.from(
        { length: ticketQuantity },
        (_, i) => (formData.get(`name${i}`) as string)?.trim()
      );
      const niks = Array.from(
        { length: ticketQuantity },
        (_, i) => (formData.get(`nik${i}`) as string)?.trim()
      );

      const payload = {
        orderId,
        eventId: event?.id || "5W7jcnr28tGc5E8tywRl",
        productName: `${event?.title || "Bhima Night Carnival"} (${currentCategoryObj.name})`,
        price: currentCategoryObj.price,
        quantity: ticketQuantity,
        email,
        names,
        niks,
      };

      const res = await fetch("/api/tokenizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const reqData = await res.json();

      if (res.status !== 200) {
        toast.error(reqData.message || "Terjadi kesalahan saat memproses pesanan");
        return;
      }

      if (window?.snap?.pay && reqData?.token?.token) {
        window.snap.pay(reqData.token.token, {
          onSuccess() {
            toast.success("Pembayaran berhasil!");
            window.location.href = `/success?order_id=${orderId}&transaction_status=settlement&status_code=200`;
          },
          onPending() {
            toast.info("Menunggu pembayaran...");
            window.location.href = `/success?order_id=${orderId}&transaction_status=pending&status_code=201`;
          },
          async onError() {
            toast.error("Pembayaran gagal atau dibatalkan");
            await handleFail(orderId);
            mutate();
          },
          async onClose() {
            toast.info("Popup pembayaran ditutup");
            await handleFail(orderId);
            mutate();
          },
        });
      } else {
        toast.error("Midtrans Snap belum terhubung. Pastikan kunci Midtrans di file .env sudah diisi.");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Terjadi kendala koneksi saat menghubungi server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFail = async (order_id: string) => {
    await fetch("/api/event", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id }),
    }).catch(() => {});
  };

  return (
    <Modal
      onClose={onClose}
      className="bg-surface border border-outline-variant text-on-surface max-w-lg w-full p-0 rounded-2xl shadow-2xl overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant bg-surface-container-lowest">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">Pilih Tiket &amp; Data</h3>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {event?.title || "Bhima Night Carnival"} • SMAN 1 Madiun
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Form & Selection Content */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75dvh] overflow-y-auto">
        {/* Ticket Category Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Kategori Tiket
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                  selectedCategory === c.id
                    ? "border-primary bg-primary-container/20 ring-1 ring-primary"
                    : "border-outline-variant hover:bg-surface-container-low"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                    {c.name}
                    {c.recommended && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-on-primary font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">{c.description}</p>
                </div>
                <span
                  className="font-extrabold text-sm text-primary whitespace-nowrap"
                  style={{ color: "rgb(56, 105, 72)" }}
                >
                  Rp {c.price.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          <div>
            <span className="font-bold text-sm text-on-surface block">Jumlah Tiket</span>
            <span className="text-xs text-on-surface-variant">Maksimal {maxTickets} tiket per pemesanan</span>
          </div>
          <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
            <button
              type="button"
              onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="w-10 text-center font-bold text-sm text-on-surface">
              {ticketQuantity}
            </span>
            <button
              type="button"
              onClick={() => setTicketQuantity(Math.min(maxTickets, ticketQuantity + 1))}
              className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        {/* Visitor Identitas (Nama & NIK) Inputs */}
        <div className="space-y-3 pt-3 border-t border-outline-variant">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Identitas Pengunjung ({ticketQuantity} Orang)
          </label>
          <div className="space-y-3">
            {Array.from({ length: ticketQuantity }, (_, index) => (
              <div key={index} className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">
                    Pengunjung {ticketQuantity > 1 ? `#${index + 1}` : ""}
                  </span>
                  {ticketQuantity > 1 && index === 0 && (
                    <Tooltip label="Nama dan NIK ini digunakan sebagai kontak utama pembeli">
                      <span className="text-[10px] font-bold text-primary bg-primary-container px-2 py-0.5 rounded-md border border-outline-variant">
                        Kontak Utama
                      </span>
                    </Tooltip>
                  )}
                </div>

                {/* Nama Pengunjung */}
                <div>
                  <label
                    htmlFor={`name${index}`}
                    className="block text-[11px] font-semibold text-on-surface-variant mb-1"
                  >
                    Nama Lengkap (sesuai KTP/Kartu Pelajar)
                  </label>
                  <input
                    type="text"
                    id={`name${index}`}
                    name={`name${index}`}
                    placeholder="Contoh: Budi Santoso"
                    required
                    minLength={3}
                    maxLength={50}
                    className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant/50 px-3 py-2 text-xs outline-none transition-colors"
                  />
                  {isUsernameErr[index] && (
                    <p className="text-red-500 text-[11px] mt-1">
                      Nama hanya boleh berisi huruf, angka, dan spasi (3-50 karakter)
                    </p>
                  )}
                </div>

                {/* NIK Pengunjung */}
                <div>
                  <label
                    htmlFor={`nik${index}`}
                    className="block text-[11px] font-semibold text-on-surface-variant mb-1"
                  >
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    id={`nik${index}`}
                    name={`nik${index}`}
                    placeholder="Contoh: 3519012345670001 (16 digit)"
                    required
                    minLength={10}
                    maxLength={20}
                    className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant/50 px-3 py-2 text-xs outline-none transition-colors"
                  />
                  {isNikErr[index] && (
                    <p className="text-red-500 text-[11px] mt-1">
                      NIK wajib diisi dengan 16 digit angka valid (KTP / KK / Kartu Pelajar)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Input */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant">
          <label htmlFor="email" className="block text-xs font-bold text-on-surface mb-1">
            Email Aktif (Pengiriman E-Tiket QR)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="contoh: nama@gmail.com"
            required
            className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant/50 px-3 py-2 text-xs outline-none transition-colors"
          />
        </div>

        {/* Rincian Biaya Summary */}
        <div className="bg-surface-container-low p-4 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>{ticketQuantity}x {currentCategoryObj.name}</span>
            <span>Rp {ticketSubtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Biaya Layanan &amp; Penanganan</span>
            <span>Rp {serviceFee.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-on-surface pt-2 border-t border-outline-variant font-bold text-sm">
            <span>Total Bayar</span>
            <span style={{ color: "rgb(56, 105, 72)" }}>
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
            style={!isLoading ? { backgroundColor: "rgb(56, 105, 72)" } : {}}
          >
            <span>{isLoading ? "Menghubungkan Midtrans..." : "Bayar Sekarang via QRIS / Midtrans"}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
          <p className="text-[10px] text-center text-on-surface-variant flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">shield</span>
            Pembayaran terenkripsi &amp; aman via Midtrans / QRIS
          </p>
        </div>
      </form>
    </Modal>
  );
}
