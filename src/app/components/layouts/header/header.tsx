"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  currentView?: string;
  onBack?: () => void;
  title?: string;
}

export default function Header({
  currentView,
  onBack,
  title = "BNC",
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface shadow-sm border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 h-16 transition-colors duration-200 text-on-surface">
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="text-on-surface-variant hover:bg-surface-container active:scale-95 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            arrow_back
          </span>
        </button>
        <span
          className="text-xl font-extrabold text-primary"
          style={{ color: "rgb(56, 105, 72)" }}
        >
          {title}
        </span>
      </div>
      <button
        aria-label={currentView === "payment" ? "Help" : "Share"}
        className="text-on-surface-variant hover:bg-surface-container active:scale-95 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          {currentView === "payment" ? "help_outline" : "share"}
        </span>
      </button>
    </header>
  );
}
