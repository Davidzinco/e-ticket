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
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-surface border border-outline-variant text-center shadow-md">
        <h3 className="text-on-surface font-bold text-base mb-1">Gagal Memuat Acara</h3>
        <p className="text-on-surface-variant text-xs">Silakan periksa koneksi atau coba beberapa saat lagi.</p>
      </div>
    );
  }

  return (
    <section className="py-8 w-full flex flex-col justify-center items-center">
      <div className="max-w-5xl w-full px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
              Jadwal Acara
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
              Tiket resmi yang tersedia untuk pemesanan langsung.
            </p>
          </div>
          <span className="text-xs text-primary font-bold px-3 py-1 rounded-full bg-primary-container border border-outline-variant">
            {events?.length || 0} Acara
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
