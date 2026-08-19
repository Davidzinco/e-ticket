"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginView() {
  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-black px-6 py-12 relative overflow-hidden selection:bg-white selection:text-black">
      <div className="relative w-full max-w-md bg-[#121417] border border-white/[0.08] p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center text-center">
        {/* SMAN 1 Madiun Logo */}
        <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] mb-6">
          <Image
            src="/images/smasa.webp"
            alt="SMAN 1 Madiun"
            width={48}
            height={48}
            className="opacity-90"
          />
        </div>

        <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-medium tracking-wide text-[#e5c378] uppercase mb-3">
          Admin Portal
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f7] tracking-tight mb-2">
          SMAN 1 Madiun
        </h1>

        <p className="text-xs sm:text-sm text-[#86868b] mb-8 max-w-xs leading-relaxed">
          Portal verifikasi dan manajemen tiket resmi Bhima Night Carnival.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full py-3 px-5 rounded-full bg-white text-black hover:bg-[#e5e5ea] font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-98 flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Google</span>
        </button>

        <a
          href="/"
          className="mt-6 text-xs text-[#86868b] hover:text-white transition-colors"
        >
          ← Kembali ke Beranda
        </a>
      </div>
    </section>
  );
}
