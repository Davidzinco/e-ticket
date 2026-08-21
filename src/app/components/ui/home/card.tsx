"use client";
import { motion } from "framer-motion";
import { useTransitionRouter } from "next-view-transitions";
import Image from "next/image";

export default function Card({
  id,
  title,
  description,
  date,
  src,
  keyId,
  ticket,
  entryNumber = "01",
  viewTicket = true,
  isSoldOut,
}: {
  id: string;
  keyId: string;
  title: string;
  description: string;
  date: Date;
  src: string;
  ticket: number;
  entryNumber?: string;
  viewTicket?: boolean;
  isSoldOut?: boolean;
}) {
  const router = useTransitionRouter();
  const dateConvert = date
    .toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
    .split("/")
    .join(".");

  const soldOut = isSoldOut || ticket <= 0;

  return (
    <motion.div
      key={keyId}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative rounded-2xl bg-[#16263b] border border-[#213145] hover:border-[#4f46e5]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden shadow-lg shadow-black/30"
      onClick={() =>
        router.push(`detail/${id}`, {
          onTransitionReady: PageAnimation,
        })
      }
    >
      {/* Side Perforation Knockouts (Ticket Stub Mask effect from Stitch) */}
      <div className="absolute top-1/2 -left-2.5 w-5 h-5 rounded-full bg-[#0b1c30] border-r border-[#213145] z-30 hidden sm:block"></div>
      <div className="absolute top-1/2 -right-2.5 w-5 h-5 rounded-full bg-[#0b1c30] border-l border-[#213145] z-30 hidden sm:block"></div>

      <div className="p-4 sm:p-5">
        {/* Media Container */}
        <div className="relative w-full aspect-[16/10] bg-[#0b1c30] rounded-xl overflow-hidden mb-4 border border-[#213145]">
          {soldOut && (
            <div className="absolute inset-0 bg-[#0b1c30]/85 backdrop-blur-xs flex flex-col justify-center items-center z-20">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-bold text-xs tracking-wider uppercase border border-red-500/30">
                Tiket Habis
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#0b1c30]/80 backdrop-blur-md text-[#c3c0ff] border border-[#4f46e5]/40">
              BNC Pass
            </span>
          </div>

          <Image
            src={src}
            alt={title}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            fill
          />
        </div>

        {/* Header & Meta */}
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[#c3c0ff] transition-colors line-clamp-1">
              {title}
            </h2>
            {viewTicket && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                  soldOut
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : "bg-[#4f46e5]/20 text-[#c3c0ff] border border-[#4f46e5]/40"
                }`}
              >
                {soldOut ? "Habis" : `${ticket} Tiket`}
              </span>
            )}
          </div>

          <p className="text-xs text-[#c7c4d8] font-medium flex items-center gap-2">
            <span className="text-[#c3c0ff] font-semibold">{dateConvert}</span>
            <span className="text-[#464555]">•</span>
            <span>SMAN 1 Madiun</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-[#9aa4bc] line-clamp-2 leading-relaxed font-normal mb-2">
          {description || "Perayaan seni dan pertunjukan akbar Bhima Night Carnival."}
        </p>
      </div>

      {/* Ticket Action Footer (Perforated Line separator) */}
      <div className="px-4 py-3 sm:px-5 border-t border-dashed border-[#213145] bg-[#112035] flex items-center justify-between">
        <span className="text-xs font-bold text-[#c3c0ff]">
          Detail & Tiket
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`detail/${id}`, {
              onTransitionReady: PageAnimation,
            });
          }}
          className={`py-2 px-5 rounded-lg font-bold text-xs transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md ${
            soldOut
              ? "bg-[#16263b] text-[#777587] border border-[#213145] cursor-not-allowed"
              : "bg-[#4f46e5] text-white hover:bg-[#3525cd] shadow-[#4f46e5]/30"
          }`}
        >
          <span>{soldOut ? "Habis" : "Beli Tiket"}</span>
          <span>→</span>
        </button>
      </div>
    </motion.div>
  );
}

const PageAnimation = () => {
  document.documentElement.animate(
    [
      { transform: `translateY(0%)` },
      { transform: `translateY(-100%)` },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)",
    }
  );

  document.documentElement.animate(
    [
      { transform: `translateY(100%)` },
      { transform: `translateY(0)` },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    }
  );
};

