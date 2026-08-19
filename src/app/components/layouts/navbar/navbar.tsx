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
      className={`fixed top-0 left-0 right-0 h-14 transition-all duration-300 z-[999] ${
        scrollY > 10
          ? "bg-black/80 backdrop-blur-2xl border-b border-white/[0.08]"
          : "bg-black/40 backdrop-blur-md border-b border-transparent"
      } ${isFixHeight && "bg-black/85 backdrop-blur-2xl border-b border-white/[0.08]"}`}
    >
      <div className="max-w-6xl mx-auto w-full h-full flex justify-between px-6 items-center">
        {isAdmin ? (
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              if (path == "/admin") return;
              router.push("/admin", {
                onTransitionReady: PageAnimation,
              });
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
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
            <Image
              className="opacity-90 group-hover:opacity-100 transition-opacity"
              src="/images/smasa.webp"
              alt="SMAN 1 Madiun"
              width={26}
              height={26}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-white/90">SMAN 1 Madiun</span>
              <span className="text-white/20 text-xs">/</span>
              <span className="text-xs text-white/60 font-medium">E-Ticket</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex gap-3 items-center">
              {name && (
                <span
                  className={`text-xs text-white/60 font-medium ${
                    windowWidth <= 400
                      ? "max-w-[70px] truncate"
                      : "max-w-[300px] truncate"
                  }`}
                >
                  {name}
                </span>
              )}
              <button
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-medium py-1.5 px-3.5 rounded-full transition-all duration-150 cursor-pointer active:scale-95 border border-white/10"
                onClick={() =>
                  signOut({
                    callbackUrl: "/auth/login",
                  })
                }
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 animate-pulse"></span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium">Live</span>
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
