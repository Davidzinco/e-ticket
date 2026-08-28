"use client";
import { motion } from "framer-motion";
import { useTransitionRouter } from "next-view-transitions";
import Image from "next/image";

export default function EventCard({
  id,
  title,
  description,
  date,
  src,
  keyId,
  ticket,
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
  viewTicket?: boolean;
  isSoldOut?: boolean;
}) {
  const router = useTransitionRouter();
  const dateConvert = date
    ? date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }).split("/").join(".")
    : "15.12.2024";

  const soldOut = isSoldOut || ticket <= 0;

  return (
    <motion.div
      key={keyId}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative rounded-2xl bg-surface-container-lowest border border-outline-variant hover:border-primary transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ambient-shadow"
      onClick={() => router.push(`/detail/${id}`)}
    >
      <div className="p-5">
        {/* Media Container */}
        <div className="relative w-full aspect-[16/10] bg-surface-container-low rounded-xl overflow-hidden mb-4 border border-outline-variant">
          {soldOut && (
            <div className="absolute inset-0 bg-surface/85 backdrop-blur-xs flex flex-col justify-center items-center z-20">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-600 font-bold text-xs tracking-wider uppercase border border-red-500/30">
                Kupon Habis
              </span>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-surface/90 backdrop-blur-md text-primary border border-outline-variant">
              BNC Pass
            </span>
          </div>

          <Image
            src={src || "https://sman1madiun.sch.id/wp-content/uploads/2024/10/logo-banner.png"}
            alt={title}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            fill
          />
        </div>

        {/* Header & Meta */}
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-lg font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h2>
            {viewTicket && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                  soldOut
                    ? "bg-red-500/15 text-red-600 border border-red-500/30"
                    : "bg-primary-container text-on-primary-container border border-outline-variant"
                }`}
              >
                {soldOut ? "Habis" : `${ticket} Kupon`}
              </span>
            )}
          </div>

          <p className="text-xs text-on-surface-variant font-medium flex items-center gap-2">
            <span className="text-primary font-bold" style={{ color: "rgb(56, 105, 72)" }}>{dateConvert}</span>
            <span>•</span>
            <span>SMAN 1 Madiun</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-normal mb-2">
          {description || "Perayaan seni dan pertunjukan akbar Bhima Night Carnival."}
        </p>
      </div>

      {/* Ticket Action Footer */}
      <div className="px-5 py-3 border-t border-dashed border-outline-variant bg-surface-container-low flex items-center justify-between">
        <span className="text-xs font-bold text-on-surface">
          Detail &amp; Kupon
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/detail/${id}`);
          }}
          className={`py-2 px-5 rounded-lg font-bold text-xs transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm ${
            soldOut
              ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
              : "bg-primary text-on-primary hover:opacity-90"
          }`}
          style={!soldOut ? { backgroundColor: "rgb(56, 105, 72)" } : {}}
        >
          <span>{soldOut ? "Habis" : "Beli Kupon"}</span>
          <span>→</span>
        </button>
      </div>
    </motion.div>
  );
}
