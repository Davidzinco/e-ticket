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
                src={"/images/bnc_2025/bhima_night_carnival26.webp"}
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
            <div className="bg-transparent max-w-3xl mx-auto text-justify relative z-[10] mt-52">
              <div className="border p-4 rounded-xl">
                <div className="absolute left-0 top-0 w-full h-full bg-[#3e042c] blur-xl rounded-2xl z-[-1]"></div>
                <p className="text-white sm:text-2xl sm:leading-[32px]">
                  {detailEvent.description}
                </p>
              </div>
              {isSoldOut ? (
                <p className="text-center sm:text-lg text-[13px] text-yellow-400/90 mt-3">
                  {`Ticket Sudah Habis!`}
                </p>
              ) : (
                <p className="text-center sm:text-lg text-[13px] text-yellow-400/90 mt-3">
                  {`Sisa Tiket : ${detailEvent.ticket}`}
                </p>
              )}
            </div>
            {/* container form */}
            <form
              action=""
              onSubmit={(e) => handleBuyTicket(e)}
              className="bg-transparent relative flex flex-col p-5 gap-7 rounded-xl mx-auto w-full max-w-3xl z-10 text-white"
            >
              <div className="absolute left-0 top-0 w-full h-full bg-[#3e042c] blur-xl rounded-2xl z-[-1]"></div>
              <aside className="w-full rounded-lg flex justify-between items-center">
                <Counter
                  maxCount={isSoldOut ? 0 : detailEvent.ticket}
                  count={count}
                  setCount={setCount}
                />
                <div className="flex gap-2 sm:gap-5 items-center">
                  <p className="text-white sm:text-xl">
                    {toIdr(event?.price * count)}
                  </p>
                  <button
                    disabled={count > detailEvent.ticket || isSoldOut}
                    type="submit"
                    className={`bg-[#873567] py-1 rounded-lg text-white cursor-pointer hover:bg-[#873567]/80 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed sm:text-xl ${
                      isSoldOut ? "px-3" : "px-4"
                    }`}
                  >
                    {isSoldOut ? "Tiket Habis" : "Beli Tiket"}
                  </button>
                </div>
              </aside>
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
