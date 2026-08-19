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
    .toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
    .split("/")
    .join("-");
  return (
    <motion.div
      key={keyId}
      className="rounded-lg bg-[#eee] p-3 flex flex-col gap-2 justify-center cursor-pointer"
      onClick={() =>
        router.push(`detail/${id}`, {
          onTransitionReady: PageAnimation,
        })
      }
    >
      <div className="overflow-hidden rounded-lg w-full mx-auto relative aspect-[4/3]">
        {(ticket <= 0 || isSoldOut) && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/40 flex justify-center items-center z-10">
            <h1 className="font-semibold text-red-500 text-2xl w-full bg-black text-center">
              Sold Out!
            </h1>
          </div>
        )}
        <Image src={src} alt="" className="object-cover object-center" fill />
      </div>
      <div className="flex justify-between items-center -mb-1">
        <h1 className="font-bold">{title}</h1>
        {!viewTicket ? (
          <p className="font-light text-[14px]">{dateConvert}</p>
        ) : (
          <p className={`text-sm font-light`}>
            Ticket : <span>{isSoldOut ? "0" : ticket}</span>
          </p>
        )}
      </div>
      <p className="text-base line-clamp-4">{description}</p>
      <p className={`font-light text-[14px] ${!viewTicket && "hidden"}`}>
        {dateConvert}
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() =>
          router.push(`detail/${id}`, {
            onTransitionReady: PageAnimation,
          })
        }
        whileTap={{ scale: 0.95 }}
        className="bg-blue-500 text-white rounded-lg py-[6px] mt-auto hover:bg-blue-600 transition-colors cursor-pointer outline-none text-sm"
      >
        Lihat Detail
      </motion.button>
    </motion.div>
  );
}

const PageAnimation = () => {
  document.documentElement.animate(
    [
      {
        transform: `translateY(0%)`,
      },
      {
        transform: `translateY(-100%)`,
      },
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
      {
        transform: `translateY(100%)`,
      },
      {
        transform: `translateY(0)`,
      },
    ],
    {
      duration: 1000,
      easing: "cubic-bezier(0.76, 0, 0.24, 1)",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    }
  );
};
