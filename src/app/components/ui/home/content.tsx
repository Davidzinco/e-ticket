"use client";
import Card from "./card";
import toDate from "../../utils/toDate";
import { EventInterface } from "../../interfaces/event";
import React from "react";

export default function Content({
  events,
  hasError,
}: {
  events: EventInterface[];
  hasError: boolean;
}) {
  if (hasError) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-[#16263b] border border-[#213145] text-center">
        <h3 className="text-white font-bold text-base mb-1">Gagal Memuat Acara</h3>
        <p className="text-[#9aa4bc] text-xs">Silakan periksa koneksi atau coba beberapa saat lagi.</p>
      </div>
    );
  }

  return (
    <section className="py-10 w-full flex flex-col justify-center items-center bg-[#0b1c30]">
      <div className="max-w-5xl w-full px-5 sm:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Jadwal Acara
            </h2>
            <p className="text-xs text-[#9aa4bc] mt-0.5 font-medium">
              Tiket resmi yang tersedia untuk pemesanan langsung.
            </p>
          </div>
          <span className="text-xs text-[#c3c0ff] font-bold px-3 py-1 rounded-full bg-[#16263b] border border-[#213145]">
            {events?.length || 0} Acara
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {!hasError &&
            events?.map((item: EventInterface, index: number) => (
              <React.Fragment key={item.id}>
                <Card
                  keyId={item.id}
                  id={item.id}
                  date={toDate(item.timestamp)}
                  title={item.title}
                  description={item.description}
                  src={item.src}
                  ticket={item.ticket}
                  isSoldOut={item.isSoldOut}
                  entryNumber={String(index + 1).padStart(2, "0")}
                />
              </React.Fragment>
            ))}
        </div>
      </div>
    </section>
  );
}
