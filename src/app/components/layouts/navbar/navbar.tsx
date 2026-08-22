"use client";
import { signOut } from "next-auth/react";
import { useTransitionRouter } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useWindowWidth from "../../utils/useWindowWidth";
import Image from "next/image";

export default function Navbar({
  isFixHeight = false,
  isAdmin = false,
  name,
}: {
  isFixHeight?: boolean;
  isAdmin?: boolean;
  name?: string;
}) {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  const router = useTransitionRouter();
  const windowWidth = useWindowWidth();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;
  return (
    <nav
      className={`fixed top-0 left-0 right-0 h-16 transition-all duration-300 z-[999] ${
        scrollY > 10
          ? "bg-[#0b1c30]/90 backdrop-blur-xl border-b border-[#213145] shadow-lg shadow-[#0b1c30]/50"
          : "bg-[#0b1c30]/60 backdrop-blur-md border-b border-transparent"
      } ${isFixHeight && "bg-[#0b1c30]/95 backdrop-blur-xl border-b border-[#213145]"}`}
    >
      <div className="max-w-6xl mx-auto w-full h-full flex justify-between px-5 sm:px-8 items-center">
        {isAdmin ? (
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => {
              if (path == "/admin") return;
              router.push("/admin", {
                onTransitionReady: PageAnimation,
              });
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] animate-pulse"></span>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-[#c3c0ff] transition-colors">
              Admin Portal
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (path == "/") return;
              router.push("/", {
                onTransitionReady: PageAnimation,
              });
            }}
          >
            <div className="p-1.5 rounded-xl bg-[#16263b] border border-[#213145]">
              <Image
                className="opacity-95 group-hover:scale-105 transition-transform"
                src="/images/smasa.webp"
                alt="SMAN 1 Madiun"
                width={22}
                height={22}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">SMAN 1 Madiun</span>
              <span className="text-[#464555] text-xs">/</span>
              <span className="text-xs text-[#c3c0ff] font-semibold bg-[#4f46e5]/15 border border-[#4f46e5]/30 px-2 py-0.5 rounded-md">TiketGo</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex gap-3 items-center">
              {name && (
                <span
                  className={`text-xs text-[#c7c4d8] font-medium ${
                    windowWidth <= 400
                      ? "max-w-[70px] truncate"
                      : "max-w-[300px] truncate"
                  }`}
                >
                  {name}
                </span>
              )}
              <button
                className="bg-[#4f46e5] hover:bg-[#3525cd] text-white text-xs font-bold py-1.5 px-4 rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-md shadow-[#4f46e5]/20"
                onClick={() =>
                  signOut({
                    callbackUrl: "/auth/login",
                  })
                }
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16263b] border border-[#213145] text-white text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#4f46e5] animate-pulse"></span>
                <span>BNC 2026</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const PageAnimation = () => {
  document.documentElement.animate(
    [
      {
        transform: `translateY(0)`,
      },
      {
        transform: `translateY(100%)`,
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
        transform: `translateY(-100%)`,
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
