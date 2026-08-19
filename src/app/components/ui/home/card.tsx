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
    <motion.article
      key={keyId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.995 }}
      className="group cursor-pointer border-t border-[#1A1814] hover:border-[#C9A87C]/40 transition-colors duration-500 py-7 sm:py-10"
      onClick={() =>
        router.push(`detail/${id}`, {
          onTransitionReady: PageAnimation,
        })
      }
    >
      {/* Entry header row */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="text-[9px] tracking-[0.35em] uppercase text-[#C9A87C] font-medium tabular-nums">
            {entryNumber}
          </span>
          <div className="w-3 h-px bg-[#2A2520]"></div>
          <span className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34]">
            Festival Musik
          </span>
        </div>
        {viewTicket && (
          <span className={`text-[9px] tracking-[0.3em] uppercase ${soldOut ? "text-red-400/60" : "text-emerald-400/70"}`}>
            {soldOut ? "Habis" : `${ticket} Tiket`}
          </span>
        )}
      </div>

      {/* Cinematic image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-[#1A1814] mb-6 sm:mb-8">
        {soldOut && (
          <div className="absolute inset-0 bg-black/70 z-20 flex items-center justify-center">
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 border border-white/15 px-4 py-2">
              Tiket Habis
            </span>
          </div>
        )}
        <Image
          src={src}
          alt={title}
          fill
          className="object-cover object-center group-hover:scale-[1.018] transition-transform duration-700 ease-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent z-10 pointer-events-none" />
      </div>

      {/* Giant editorial title */}
      <h2
        className="font-black uppercase text-[#F0ECE4] leading-none tracking-[-0.03em] group-hover:text-[#C9A87C] transition-colors duration-300 mb-4"
        style={{ fontSize: "clamp(32px, 7vw, 80px)" }}
      >
        {title}
      </h2>

      {/* Description */}
      <p className="text-sm text-[#6B6560] leading-relaxed font-normal mb-6 line-clamp-2 sm:line-clamp-3 max-w-2xl">
        {description || "Festival seni dan pertunjukan akbar tahunan SMAN 1 Madiun."}
      </p>

      {/* Bottom action strip */}
      <div className="flex items-end justify-between pt-5 border-t border-[#1A1814]">
        <div className="flex gap-6 sm:gap-10">
          <div>
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#3E3A34] mb-0.5">Tanggal</p>
            <p className="text-xs font-medium text-[#6B6560]">{dateConvert}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#3E3A34] mb-0.5">Lokasi</p>
            <p className="text-xs font-medium text-[#6B6560]">SMAN 1 Madiun</p>
          </div>
        </div>
        <button
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`detail/${id}`, { onTransitionReady: PageAnimation });
          }}
          className={`text-[9px] font-medium tracking-[0.2em] uppercase px-5 py-2.5 border transition-all duration-200 active:scale-95 ${
            soldOut
              ? "border-[#2A2520] text-[#3E3A34] cursor-not-allowed"
              : "border-[#F0ECE4]/30 text-[#F0ECE4] hover:bg-[#F0ECE4] hover:text-[#080808] hover:border-[#F0ECE4] cursor-pointer"
          }`}
        >
          {soldOut ? "Habis" : "Beli Tiket →"}
        </button>
      </div>
    </motion.article>
  );
}

const PageAnimation = () => {
  document.documentElement.animate(
    [{ transform: `translateY(0%)` }, { transform: `translateY(-100%)` }],
    { duration: 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards", pseudoElement: "::view-transition-old(root)" }
  );
  document.documentElement.animate(
    [{ transform: `translateY(100%)` }, { transform: `translateY(0)` }],
    { duration: 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards", pseudoElement: "::view-transition-new(root)" }
  );
};
