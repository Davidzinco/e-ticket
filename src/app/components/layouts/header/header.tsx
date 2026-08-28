"use client";
import React from "react";
import { toast } from "sonner";

interface HeaderProps {
  currentView?: string;
  title?: string;
}

export default function Header({
  title = "BNC",
}: HeaderProps) {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "Bhima Night Carnival 2026 - E-Coupon",
      text: "Dapatkan kupon resmi Bhima Night Carnival (BNC) sekarang!",
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Abaikan jika user membatalkan share dialog
        if (err instanceof Error && err.name !== "AbortError") {
          fallbackCopy(url);
        }
      }
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = async (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Tautan berhasil disalin ke papan klip!");
      } catch {
        toast.error("Gagal menyalin tautan");
      }
    } else {
      toast.info(`Salin tautan: ${url}`);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface shadow-sm border-b border-outline-variant flex items-center justify-between px-4 sm:px-6 h-16 transition-colors duration-200 text-on-surface">
      <div className="flex items-center gap-2">
        <span
          className="text-xl font-extrabold text-primary"
          style={{ color: "rgb(56, 105, 72)" }}
        >
          {title}
        </span>
      </div>
      <button
        onClick={handleShare}
        aria-label="Share"
        className="text-on-surface-variant hover:bg-surface-container active:scale-95 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
        title="Bagikan"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          share
        </span>
      </button>
    </header>
  );
}
