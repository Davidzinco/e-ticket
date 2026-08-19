"use client";

import { useState } from "react";

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header className="relative min-h-[92dvh] flex flex-col bg-[#080808] pt-14">
      {/* Top editorial metadata strip */}
      <div className="px-5 sm:px-10 flex items-center justify-between py-3 border-b border-[#1A1814]">
        <span className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34] font-medium select-none">
          SMAN 1 Madiun — Est. 1961
        </span>
        <span className="text-[9px] tracking-[0.35em] uppercase text-[#3E3A34] font-medium select-none">
          Platform Tiket Resmi
        </span>
      </div>

      {/* Main editorial display zone */}
      <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 py-10 sm:py-16">

        {/* Edition marker */}
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          <div className="w-5 h-px bg-[#C9A87C]"></div>
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#C9A87C] select-none">
            Festival Tahunan · 2026
          </span>
        </div>

        {/* Giant display headline — heavy/thin weight contrast */}
        <div className="mb-8 sm:mb-12 select-none">
          <h1 aria-label="Bhima Night Carnival">
            <span
              className="block uppercase font-black text-[#F0ECE4] leading-[0.84] tracking-[-0.04em]"
              style={{ fontSize: "clamp(64px, 13vw, 164px)" }}
            >
              Bhima
            </span>
            <span
              className="block font-thin italic text-[#F0ECE4] leading-[0.88] tracking-[-0.02em] font-serif"
              style={{ fontSize: "clamp(52px, 10.5vw, 130px)" }}
            >
              Night
            </span>
            <span
              className="block uppercase font-black text-[#F0ECE4] leading-[0.84] tracking-[-0.04em]"
              style={{ fontSize: "clamp(64px, 13vw, 164px)" }}
            >
              Carnival.
            </span>
          </h1>
        </div>

        {/* Horizontal divider with roman numeral year */}
        <div className="flex items-center gap-5 mb-8">
          <div className="flex-1 h-px bg-[#1A1814]"></div>
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#3E3A34] select-none">MMXXVI</span>
          <div className="w-4 h-px bg-[#1A1814]"></div>
        </div>

        {/* Body text + editorial search — responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 sm:gap-16 items-end max-w-2xl">
          <p className="text-sm text-[#6B6560] leading-relaxed font-normal">
            Panggung mahakarya seni dan festival musik tahunan kebanggaan SMAN 1 Madiun.
            Amankan tempat Anda sekarang.
          </p>

          {/* Underline-style search — editorial, no pill */}
          <div className="min-w-[180px]">
            <div className="flex items-center gap-3 border-b border-[#2A2520] focus-within:border-[#C9A87C] transition-colors duration-300 pb-2 group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari acara..."
                className="bg-transparent flex-1 text-[#F0ECE4] placeholder-[#3E3A34] text-xs outline-none font-normal"
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-[#6B6560] hover:text-[#F0ECE4] text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              ) : (
                <span className="text-[#3E3A34] group-focus-within:text-[#C9A87C] text-xs transition-colors select-none">
                  →
                </span>
              )}
            </div>
            <p className="text-[8px] tracking-[0.25em] uppercase text-[#3E3A34] mt-1.5 select-none">
              Cari Tiket
            </p>
          </div>
        </div>
      </div>

      {/* Bottom editorial strip */}
      <div className="px-5 sm:px-10 py-3 border-t border-[#1A1814] flex items-center justify-between">
        <span className="text-[9px] text-[#3E3A34] tracking-[0.3em] uppercase select-none">
          Official Event
        </span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-pulse"></span>
          <span className="text-[9px] text-[#3E3A34] tracking-[0.3em] uppercase select-none">
            Tiket Tersedia
          </span>
        </div>
      </div>
    </header>
  );
}

