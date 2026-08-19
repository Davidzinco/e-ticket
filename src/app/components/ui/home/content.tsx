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
      <div className="px-5 sm:px-10 py-16">
        <div className="border-t border-[#1A1814] pt-6">
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34] mb-1">Error</p>
          <p className="text-sm text-[#6B6560]">Gagal memuat acara. Periksa koneksi Anda.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="px-5 sm:px-10 pb-16">
      {/* Editorial section header */}
      <div className="flex items-center justify-between py-4 border-b border-[#1A1814] mb-0">
        <span className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34]">
          Acara Mendatang
        </span>
        <span className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34] tabular-nums">
          {String(events?.length || 0).padStart(2, "0")} Acara
        </span>
      </div>

      {/* Events as editorial list entries */}
      <div>
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
    </section>
  );
}
