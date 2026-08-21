"use client";
import Image from "next/image";
import Counter from "./counter";
import { useEffect, useState } from "react";
import { toIdr } from "../../utils/toIdr";
import { EventInterface } from "../../interfaces/event";
import useSWR from "swr";
import BuyModal from "../../layouts/modalLayouts/buyModal";

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
    const snapScript = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? "";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey!);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!detailEvent) return;

    const closeTime = detailEvent?.closeTime?.seconds
      ? new Date(detailEvent.closeTime.seconds * 1000)
      : null;

    if (detailEvent.isSoldOut || (closeTime && new Date() > closeTime)) {
      setIsSoldOut(true);
    }
  }, [detailEvent]);

  const {
    data: event,
    error,
    mutate,
  } = useSWR<EventInterface>(`/api/event?id=${slug}`, fetcher, {
    fallbackData: detailEvent,
  });

  if (error) {
    return (
      <p className="text-red-500 text-center mt-5">Failed to fetch event</p>
    );
  }

  // const handleCheckoutInvalid = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!name || !email) {
  //     toast.error("Mohon isi nama dan email");
  //     return;
  //   }

  //   return toast.info("Maaf Saat ini pembayaran belum tersedia ");
  // };

  const handleBuyTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenBuyModal(true);
    return;
  };

  return (
    <>
      {event && (
        <main className="bg-[#0b0105] backdrop-blur-2xl flex flex-col mx-auto select-none">
          <section className="h-full w-full bg-[#770b4d] relative mx-auto">
            <Image
              src={"/images/bnc_2025/tree_(right).webp"}
              alt="tree"
              width={1000}
              height={1000}
              className="absolute right-0 top-[-12%] w-[38%] h-auto z-10"
            ></Image>
            <div className="w-full min-h-full flex justify-center items-center relative">
              <Image
                src={"/images/bnc_2025/stars_falling.webp"}
                alt="stars_failling"
                width={500}
                height={500}
                className="absolute left-[4%] top-[3%] w-[40%] h-auto z-[0]"
              />

              <Image
                src={"/images/bnc_2025/sky_haze.webp"}
                alt="sky haze"
                width={500}
                height={500}
                className="absolute top-[10%] w-full h-auto z-[0]"
              />
              <Image
                src={"/images/bnc_2025/sky_haze_bottom.webp"}
                alt="sky haze bottom"
                width={500}
                height={500}
                className="absolute top-[58%] w-full h-auto z-[0]"
              />

              <Image
                src={"/images/bnc_2025/the_moon.webp"}
                alt="moon"
                width={1000}
                height={1000}
                className="w-full h-auto z-[1] blur-[2px]"
              />

              <Image
                src={"/images/bnc_2025/bhima_night_carnival26.png"}
                alt="bnc"
                width={1000}
                height={1000}
                className="absolute left-1/2 top-[30%] -translate-x-1/2
               w-[60%] max-w-[800px] h-auto z-[2]"
              />
            </div>
          </section>
          <section className="w-full bg-[#0b0105] px-7 flex flex-col gap-0 relative z-50">
            <Image
              src={"/images/bnc_2025/hills.webp"}
              alt="hills"
              width={1000}
              height={1000}
              className="w-full h-auto absolute left-0 top-0 -translate-y-[60%] z-[3]"
            />
            <section className="w-full absolute left-0 top-0 -translate-y-[25%] z-[4] overflow-hidden">
              <div className="w-full relative h-auto overflow-hidden">
                <Image
                  src={"/images/bnc_2025/forrest.webp"}
                  alt="forrest"
                  width={1000}
                  height={1000}
                  className="w-full h-auto object-cover object-center"
                />
              </div>
              <Image
                src={"/images/bnc_2025/haze.webp"}
                alt="haze"
                width={1000}
                height={1000}
                className="absolute top-1/7 left-0 w-full h-auto"
              />
            </section>

              {/* container description */}
            <div className="bg-transparent max-w-3xl mx-auto relative z-[10] mt-36 sm:mt-44 w-full">
              <div className="relative p-6 sm:p-8 rounded-2xl bg-[#16263b] border border-[#213145] shadow-xl shadow-black/30">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#4f46e5]/15 border border-[#4f46e5]/30 text-[#c3c0ff] text-xs font-bold uppercase tracking-wider mb-3">
                  Detail Acara
                </div>
                <p className="text-white text-sm sm:text-base sm:leading-relaxed font-normal text-justify">
                  {detailEvent.description || "Festival Bhima Night Carnival menghadirkan pertunjukan seni akbar, kolaborasi musik, dan kehangatan kebersamaan keluarga besar SMA Negeri 1 Madiun."}
                </p>

                <div className="mt-5 pt-4 border-t border-[#213145] flex items-center justify-between">
                  <span className="text-xs text-[#9aa4bc] font-semibold">Ketersediaan Tiket:</span>
                  {isSoldOut ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      Tiket Habis
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#4f46e5]/20 text-[#c3c0ff] border border-[#4f46e5]/40">
                      {detailEvent.ticket} Tiket Tersedia
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stitch TiketGo Checkout Bar — sticky on mobile, normal on desktop */}
            <form
              action=""
              onSubmit={(e) => handleBuyTicket(e)}
              className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:mt-6 sm:mb-20 z-50 sm:z-10 sm:max-w-3xl sm:mx-auto sm:rounded-2xl sm:w-full"
            >
              <div className="p-4 sm:p-5 sm:rounded-2xl bg-[#16263b] border-t sm:border border-[#213145] sm:shadow-xl shadow-black/50 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: counter */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-[#9aa4bc] hidden xs:block">Jumlah</span>
                    <Counter
                      maxCount={isSoldOut ? 0 : detailEvent.ticket}
                      count={count}
                      setCount={setCount}
                    />
                  </div>

                  {/* Right: price + buy button */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-[#9aa4bc] uppercase font-bold tracking-wider">Total</span>
                      <p className="text-base sm:text-xl font-extrabold text-[#c3c0ff] tracking-tight">
                        {toIdr(event?.price * count)}
                      </p>
                    </div>

                    <button
                      disabled={count > detailEvent.ticket || isSoldOut}
                      type="submit"
                      className={`py-2.5 px-6 rounded-lg font-bold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap shadow-md ${
                        isSoldOut
                          ? "bg-[#0b1c30] text-[#777587] border border-[#213145] cursor-not-allowed"
                          : "bg-[#4f46e5] text-white hover:bg-[#3525cd] shadow-[#4f46e5]/30"
                      }`}
                    >
                      {isSoldOut ? "Habis" : "Beli Tiket →"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        </main>
      )}
      {openBuyModal && (
        <BuyModal
          onClose={() => setOpenBuyModal(false)}
          count={count}
          mutate={mutate}
          event={event}
        />
      )}
    </>
  );
}
