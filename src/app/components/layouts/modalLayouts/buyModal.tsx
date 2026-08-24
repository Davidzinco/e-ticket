"use client";
import React, { useState } from "react";
import { toast } from "sonner";
import Modal from "../../common/modal";
import { EventInterface, TicketPackageInterface } from "../../interfaces/event";
import { v4 as uuidv4 } from "uuid";

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
  // 1. Ambil harga dan stok tiket masing-masing paket dari Firebase
  const basePrice = event?.price && event.price > 0 ? event.price : 35000;
  const festivalPrice = event?.price_festival ?? event?.price ?? basePrice;
  const vipPrice =
    event?.price_vip ??
    (event?.price ? Math.round((event.price * 1.75) / 1000) * 1000 : 60000);

  // Default quota kuota tiket per paket (bisa diset via ticket_festival & ticket_vip di Firestore)
  const defaultTotalTickets = event?.ticket && event.ticket > 0 ? event.ticket : 50;
  const festivalTickets =
    event?.ticket_festival !== undefined
      ? event.ticket_festival
      : defaultTotalTickets;
  const vipTickets =
    event?.ticket_vip !== undefined
      ? event.ticket_vip
      : Math.min(15, Math.floor(defaultTotalTickets / 3));

  const availablePackages: TicketPackageInterface[] =
    event?.packages && event.packages.length > 0
      ? event.packages.map((pkg) => ({
          ...pkg,
          ticket:
            pkg.ticket !== undefined
              ? pkg.ticket
              : pkg.quota !== undefined
              ? pkg.quota
              : pkg.id === "VIP"
              ? vipTickets
              : festivalTickets,
        }))
      : event?.ticket_types && event.ticket_types.length > 0
      ? event.ticket_types.map((pkg) => ({
          ...pkg,
          ticket:
            pkg.ticket !== undefined
              ? pkg.ticket
              : pkg.quota !== undefined
              ? pkg.quota
              : pkg.id === "VIP"
              ? vipTickets
              : festivalTickets,
        }))
      : [
          {
            id: "FESTIVAL",
            name: "FESTIVAL",
            price: festivalPrice,
            ticket: festivalTickets,
            badge: "POPULER",
            badgeBg: "rgb(185, 239, 197)",
            badgeText: "rgb(42, 91, 59)",
            description: "Akses area festival, standing area & panggung utama",
          },
          {
            id: "VIP",
            name: "VIP",
            price: vipPrice,
            ticket: vipTickets,
            badge: "PREMIUM",
            badgeBg: "rgb(254, 240, 138)",
            badgeText: "rgb(133, 77, 14)",
            description: "Akses baris depan + tempat duduk khusus & fast lane",
          },
        ];

  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    availablePackages[0]?.id || "FESTIVAL"
  );
  const [ticketQuantity, setTicketQuantity] = useState<number>(initialCount);
  const [isUsernameErr, setIsUsernameErr] = useState<{ [key: number]: boolean }>({});
  const [isNikErr, setIsNikErr] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedPackage =
    availablePackages.find((p) => p.id === selectedPackageId) ||
    availablePackages[0];

  const availableStock = selectedPackage?.ticket !== undefined ? selectedPackage.ticket : 999;
  const isPackageSoldOut = availableStock <= 0;
  const activeTicketPrice = selectedPackage?.price || festivalPrice;
  const totalAmount = activeTicketPrice * ticketQuantity;

  const handleSelectPackage = (pkg: TicketPackageInterface) => {
    setSelectedPackageId(pkg.id);
    setIsUsernameErr({});
    const pkgStock = pkg.ticket !== undefined ? pkg.ticket : 999;
    if (pkgStock > 0 && ticketQuantity > pkgStock) {
      setTicketQuantity(pkgStock);
    } else if (pkgStock > 0 && ticketQuantity < 1) {
      setTicketQuantity(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPackageSoldOut) {
      return toast.error(`Tiket paket ${selectedPackage.name} sudah habis!`);
    }

    if (ticketQuantity > availableStock) {
      return toast.error(`Maksimal pembelian untuk ${selectedPackage.name} adalah ${availableStock} tiket`);
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const usernameRegex = /^[a-zA-Z0-9 ]{3,50}$/;
    const nikRegex = /^[0-9]{10,20}$/;

    // Validasi Nama Setiap Pengunjung
    const newErrors: { [key: number]: boolean } = {};
    for (let i = 0; i < ticketQuantity; i++) {
      const name = (formData.get(`name${i}`) as string)?.trim() || "";
      newErrors[i] = !usernameRegex.test(name);
    }
    setIsUsernameErr(newErrors);

    const hasNameError = Object.values(newErrors).some((v) => v);
    if (hasNameError) {
      setIsLoading(false);
      return toast.error("Nama semua pengunjung wajib diisi (3-50 karakter)");
    }

    // Validasi NIK Kontak Utama (Hanya 1 kali)
    const primaryNik = (formData.get("nik") as string)?.trim() || "";
    const hasNikError = !nikRegex.test(primaryNik);
    setIsNikErr(hasNikError);

    if (hasNikError) {
      setIsLoading(false);
      return toast.error("NIK kontak utama wajib diisi dengan 16 digit angka valid");
    }

    // Validasi Email
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

      const payload = {
        orderId,
        eventId: event?.id || "5W7jcnr28tGc5E8tywRl",
        productName: `${event?.title || "Bhima Night Carnival"} - ${selectedPackage.name}`,
        packageId: selectedPackage.id,
        price: activeTicketPrice,
        quantity: ticketQuantity,
        email,
        names,
        niks: [primaryNik],
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
      className="w-full max-w-[540px] bg-surface border border-outline-variant text-on-surface p-0 rounded-2xl shadow-2xl overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant bg-surface-container-lowest">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">Pemesanan Tiket</h3>
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
        {/* Pilihan Paket Tiket dari Firebase */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Pilih Paket / Tipe Tiket
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {availablePackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              const stock = pkg.ticket !== undefined ? pkg.ticket : 0;
              const isSoldOut = stock <= 0;

              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary-container/20 ring-2 ring-primary shadow-xs"
                      : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-on-primary"
                          : "border-outline-variant bg-surface"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-on-surface">
                          {pkg.name}
                        </span>
                        {pkg.badge && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: pkg.badgeBg || "rgb(185, 239, 197)",
                              color: pkg.badgeText || "rgb(42, 91, 59)",
                            }}
                          >
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-on-surface-variant">
                          {pkg.description}
                        </p>
                      )}
                      {/* Sisa kuota tiket masing-masing paket */}
                      <div className="pt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSoldOut
                              ? "bg-red-100 text-red-700"
                              : stock <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-surface-container text-primary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isSoldOut ? "cancel" : "confirmation_number"}
                          </span>
                          {isSoldOut ? "Tiket Habis" : `Tersedia ${stock} tiket`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="font-extrabold text-sm text-primary block whitespace-nowrap"
                      style={{ color: "rgb(56, 105, 72)" }}
                    >
                      Rp {Number(pkg.price || 0).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      / tiket
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Selector (Dinamis sesuai kuota paket yang dipilih) */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
          <div>
            <span className="font-bold text-sm text-on-surface block">Jumlah Tiket</span>
            <span className="text-xs text-on-surface-variant">
              {isPackageSoldOut
                ? `Tiket ${selectedPackage.name} telah habis`
                : `Tersedia ${availableStock} tiket`}
            </span>
          </div>
          <div className="flex items-center border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
            <button
              type="button"
              disabled={ticketQuantity <= 1 || isPackageSoldOut}
              onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="w-12 text-center font-bold text-sm text-on-surface">
              {isPackageSoldOut ? 0 : ticketQuantity}
            </span>
            <button
              type="button"
              disabled={ticketQuantity >= availableStock || isPackageSoldOut}
              onClick={() => setTicketQuantity(Math.min(availableStock, ticketQuantity + 1))}
              className="w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        {/* Visitor Identitas (Daftar Nama Pengunjung) */}
        <div className="space-y-3 pt-3 border-t border-outline-variant">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Daftar Nama Pengunjung ({ticketQuantity} Orang)
          </label>
          <div className="space-y-2.5">
            {Array.from({ length: isPackageSoldOut ? 0 : ticketQuantity }, (_, index) => (
              <div key={index} className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-1.5">
                <label
                  htmlFor={`name${index}`}
                  className="block text-xs font-bold text-on-surface"
                >
                  Nama Pengunjung #{index + 1} {index === 0 ? "(Kontak Utama)" : ""}
                </label>
                <input
                  type="text"
                  id={`name${index}`}
                  name={`name${index}`}
                  placeholder={`Contoh: Nama Pengunjung ${index + 1}`}
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant/50 px-3 py-2 text-xs outline-none transition-colors"
                />
                {isUsernameErr[index] && (
                  <p className="text-red-500 text-[11px] mt-0.5">
                    Nama hanya boleh berisi huruf, angka, dan spasi (3-50 karakter)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Pemesan & Kontak Utama (NIK 1x + Email) */}
        <div className="space-y-3 pt-3 border-t border-outline-variant">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Kontak &amp; Identitas Pemesan Utama
          </label>
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
            {/* NIK Kontak Utama */}
            <div>
              <label htmlFor="nik" className="block text-xs font-bold text-on-surface mb-1">
                NIK Pemesan / Kontak Utama (KTP / KK / Kartu Pelajar)
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="nik"
                name="nik"
                placeholder="Contoh: 3519012345670001 (16 digit angka)"
                required
                minLength={10}
                maxLength={20}
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface placeholder-on-surface-variant/50 px-3 py-2 text-xs outline-none transition-colors font-mono"
              />
              {isNikErr && (
                <p className="text-red-500 text-[11px] mt-1">
                  NIK wajib diisi dengan 16 digit angka valid
                </p>
              )}
            </div>

            {/* Email Aktif */}
            <div>
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
          </div>
        </div>

        {/* Rincian Biaya Summary */}
        <div className="bg-surface-container-low p-4 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>{ticketQuantity}x Tiket {selectedPackage.name}</span>
            <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
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
            disabled={isLoading || isPackageSoldOut}
            className="w-full h-12 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
            style={!isLoading && !isPackageSoldOut ? { backgroundColor: "rgb(56, 105, 72)" } : {}}
          >
            <span>
              {isLoading
                ? "Menghubungkan Midtrans..."
                : isPackageSoldOut
                ? `Tiket ${selectedPackage.name} Habis`
                : "Bayar Sekarang via QRIS / Midtrans"}
            </span>
            {!isPackageSoldOut && (
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            )}
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
