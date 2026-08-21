"use client";

import { useState } from "react";

export default function Header() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <header className="relative pt-24 sm:pt-28 pb-14 px-5 sm:px-8 bg-[#0b1c30] border-b border-[#213145] text-center overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4f46e5]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
        {/* Category Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#16263b] border border-[#213145] text-[#c3c0ff] text-xs font-semibold uppercase tracking-wider mb-5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#4f46e5]"></span>
          <span>SMAN 1 Madiun</span>
          <span className="text-[#464555]">•</span>
          <span>Official Event 2026</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Bhima Night Carnival.
        </h1>

        <p className="text-sm sm:text-lg text-[#9aa4bc] max-w-xl mb-8 leading-relaxed font-normal">
          Panggung mahakarya seni dan festival musik tahunan kebanggaan SMAN 1 Madiun.
        </p>

        {/* Search Input Container */}
        <div className="w-full max-w-md relative">
          <div className="flex items-center bg-[#16263b] rounded-xl px-4 py-3 border border-[#213145] focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-[#4f46e5]/20 transition-all duration-200 shadow-md">
            <svg
              className="w-4 h-4 text-[#c7c4d8] mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari acara atau festival..."
              className="bg-transparent w-full text-white placeholder-[#777587] text-sm outline-none font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-[#c7c4d8] hover:text-white ml-2 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
