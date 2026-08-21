"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { EventInterface } from "../../interfaces/event";
import BuyModal from "../../layouts/modalLayouts/buyModal";
import toDate from "../../utils/toDate";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Content({
  detailEvent,
  slug,
}: {
  detailEvent: EventInterface;
  slug: string | null;
}) {
  const [count, setCount] = useState<number>(1);
  const [isSoldOut, setIsSoldOut] = useState<boolean>(false);
  const [openBuyModal, setOpenBuyModal] = useState<boolean>(false);

  useEffect(() => {
    const snapScript =
      process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
      "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (snapScript && !document.querySelector(`script[src="${snapScript}"]`)) {
      const script = document.createElement("script");
      script.src = snapScript;
      if (clientKey) script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!detailEvent) return;
    const closeTime = detailEvent?.closeTime?.seconds
      ? new Date(detailEvent.closeTime.seconds * 1000)
      : null;

    if (
      detailEvent.isSoldOut === true ||
      (closeTime && new Date() > closeTime) ||
      (typeof detailEvent.ticket === "number" && detailEvent.ticket <= 0)
    ) {
      setIsSoldOut(true);
    } else {
      setIsSoldOut(false);
    }
  }, [detailEvent]);

  const {
    data: event,
    error,
    mutate,
  } = useSWR<EventInterface>(slug ? `/api/event?id=${slug}` : null, fetcher, {
    fallbackData: detailEvent,
  });

  const currentEvent = event || detailEvent;
  const ticketPrice = currentEvent?.price || 45000;
  const formattedPrice = `Rp ${ticketPrice.toLocaleString("id-ID")}`;

  return (
    <>
      <main className="pt-20 px-4 sm:px-6 max-w-[1200px] mx-auto pb-36 font-sans text-on-surface">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden ambient-shadow flex-shrink-0">
            {/* Banner Image & Badges */}
            <div className="h-64 md:h-96 w-full relative bg-surface-container-low overflow-hidden">
              <Image
                alt={currentEvent?.title || "Bhima Night Carnival"}
                className="w-full h-full object-cover"
                src="/images/bnc_2025/bhima_night_carnival26.png"
                width={1200}
                height={600}
                priority
              />
              {/* Date Badge */}
              <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-2 rounded-xl flex flex-col items-center border border-outline-variant shadow-sm">
                <span className="font-bold text-xs text-primary uppercase tracking-wider">
                  Dec
                </span>
                <span className="text-xl font-extrabold text-on-surface leading-none">
                  15
                </span>
              </div>
              {/* Category Chip */}
              <div className="absolute top-4 left-4 bg-surface-container-highest/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  festival
                </span>
                Carnival
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-md mb-3">
                <span className="material-symbols-outlined text-[14px]">
                  festival
                </span>
                <span className="font-bold text-[10px] uppercase tracking-wider">
                  {currentEvent?.sub_title || "Official E-Ticket Platform"}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface mb-2 tracking-tight">
                {currentEvent?.title || "Bhima Night Carnival"}
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant mb-6 leading-relaxed">
                {currentEvent?.description ||
                  "Experience the magic of the night with spectacular lights, live performances, and incredible food. A night to remember!"}
              </p>

              {/* Event Metadata (Date, Time, Venue) */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <div className="bg-surface-container p-2.5 rounded-xl mr-4 flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined">
                      calendar_today
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      Tanggal &amp; Waktu
                    </h4>
                    <p className="text-xs md:text-sm text-on-surface-variant">
                      {currentEvent?.timestamp
                        ? toDate(currentEvent.timestamp).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Desember 15, 2024"}{" "}
                      • 18:00 - Selesai
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-surface-container p-2.5 rounded-xl mr-4 flex-shrink-0 text-primary">
                    <span className="material-symbols-outlined">
                      location_on
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      Lokasi / Venue
                    </h4>
                    <p className="text-xs md:text-sm text-on-surface-variant">
                      {currentEvent?.location || "SMAN 1 Madiun Arena"}
                    </p>
                    <a
                      className="font-bold text-primary hover:underline text-xs mt-1 inline-block"
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lihat di Peta →
                    </a>
                  </div>
                </div>
              </div>

              {/* Bento Grid Schedule & Perks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-surface border border-outline-variant rounded-2xl p-5 soft-shadow flex flex-col justify-center">
                  <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      schedule
                    </span>
                    Jadwal Event
                  </h3>
                  <div className="space-y-2.5 text-xs text-on-surface-variant">
                    <div className="flex justify-between items-center border-b border-outline-variant/40 pb-2">
                      <span>Open Gate</span>
                      <span className="font-bold text-on-surface">
                        16:00 WIB
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/40 pb-2">
                      <span>Main Performance</span>
                      <span className="font-bold text-on-surface">
                        19:30 WIB
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Closing &amp; Fireworks</span>
                      <span className="font-bold text-on-surface">
                        22:30 WIB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-5 soft-shadow flex flex-col justify-center">
                  <h3 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified_user
                    </span>
                    Fasilitas Tiket
                  </h3>
                  <div className="space-y-2 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        check_circle
                      </span>
                      <span>Akses Masuk Jalur Cepat (Fast-track)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        check_circle
                      </span>
                      <span>E-Tiket Resmi &amp; QR Scan Instan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">
                        check_circle
                      </span>
                      <span>Free Merch / Wristband Spesial</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <section className="mb-8">
                <h3 className="text-lg font-extrabold text-on-surface mb-2">
                  Tentang Acara
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Festival Bhima Night Carnival menghadirkan pertunjukan seni akbar, kolaborasi musik, dan kehangatan kebersamaan keluarga besar SMA Negeri 1 Madiun. Beli tiket sekarang untuk menikmati pengalaman luar biasa!
                </p>
              </section>

              {/* Desktop / Inline Price & Action */}
              <div className="border-t border-outline-variant pt-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col w-full md:w-auto text-center md:text-left">
                    <span className="text-xs text-on-surface-variant font-medium">
                      Harga tiket mulai dari
                    </span>
                    <span
                      className="text-2xl font-extrabold text-primary"
                      style={{ color: "rgb(56, 105, 72)" }}
                    >
                      {formattedPrice}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => setOpenBuyModal(true)}
                    className={`w-full md:w-auto font-bold text-sm px-8 py-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                      isSoldOut
                        ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                        : "bg-primary text-on-primary hover:opacity-90"
                    }`}
                    style={
                      !isSoldOut ? { backgroundColor: "rgb(56, 105, 72)" } : {}
                    }
                  >
                    <span>{isSoldOut ? "Tiket Habis" : "Pilih Tiket"}</span>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      confirmation_number
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Universal Sticky Bottom CTA (Visible across all screen sizes) */}
        <div className="fixed bottom-16 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-outline-variant shadow-[0_-4px_16px_rgba(15,23,42,0.08)] z-40 p-3 sm:p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-on-surface-variant">
                Mulai dari
              </span>
              <span
                className="text-base sm:text-xl font-extrabold text-primary"
                style={{ color: "rgb(56, 105, 72)" }}
              >
                {formattedPrice}
              </span>
            </div>
            <button
              type="button"
              disabled={isSoldOut}
              onClick={() => setOpenBuyModal(true)}
              className={`flex-1 max-w-[240px] py-3 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all flex justify-center items-center gap-2 cursor-pointer shadow-md ${
                isSoldOut
                  ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
                  : "bg-primary text-on-primary hover:opacity-90"
              }`}
              style={
                !isSoldOut ? { backgroundColor: "rgb(56, 105, 72)" } : {}
              }
            >
              <span>{isSoldOut ? "Habis" : "Pilih Tiket"}</span>
              <span
                className="material-symbols-outlined text-sm sm:text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                confirmation_number
              </span>
            </button>
          </div>
        </div>
      </main>

      {openBuyModal && (
        <BuyModal
          onClose={() => setOpenBuyModal(false)}
          count={count}
          mutate={mutate}
          event={currentEvent}
        />
      )}
    </>
  );
}
