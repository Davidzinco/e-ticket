"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = activeTab || (pathname === "/" ? "info" : "myticket");

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      if (tab === "info") {
        router.push("/");
      } else if (tab === "myticket") {
        router.push("/myticket");
      }
    }
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 border-t border-outline-variant bg-surface transition-transform duration-200 ease-in-out shadow-lg text-on-surface">
      <div className="flex justify-around items-center h-16 pb-safe bg-surface w-full px-2 max-w-[600px] mx-auto">
        {/* Info Tab */}
        <button
          onClick={() => handleTabClick("info")}
          className={`flex flex-col items-center justify-center w-full h-full font-label-bold transition-transform duration-200 ease-in-out active:scale-90 cursor-pointer ${
            currentTab === "info"
              ? "text-primary font-bold"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full ${
              currentTab === "info" ? "bg-primary-container mb-1" : "mb-1"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings:
                  currentTab === "info" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              info
            </span>
          </div>
          <span className="text-[10px] font-medium">Info</span>
        </button>

        {/* My Ticket Tab */}
        <button
          onClick={() => handleTabClick("myticket")}
          className={`flex flex-col items-center justify-center w-full h-full font-label-bold transition-transform duration-200 ease-in-out active:scale-90 cursor-pointer ${
            currentTab === "myticket"
              ? "text-primary font-bold"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full ${
              currentTab === "myticket" ? "bg-primary-container mb-1" : "mb-1"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings:
                  currentTab === "myticket" ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              local_activity
            </span>
          </div>
          <span className="text-[10px] font-medium">My Ticket</span>
        </button>
      </div>
    </nav>
  );
}
