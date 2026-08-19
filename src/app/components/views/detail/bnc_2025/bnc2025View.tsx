import { EventInterface } from "@/app/components/interfaces/event";
import Navbar from "@/app/components/layouts/navbar/navbar";
import Content from "@/app/components/ui/bnc_2025/content";
import Header from "@/app/components/ui/bnc_2025/header";
import toDate from "@/app/components/utils/toDate";

export default function Bnc2025View({
  detailEvent,
  hasError,
  slug,
}: {
  detailEvent: EventInterface | null;
  hasError: boolean;
  slug: string | null;
}) {
  if (hasError) {
    return (
      <div className="bg-black min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-[#121417] border border-white/[0.08]">
          <h2 className="text-white font-bold text-lg mb-1">Gagal Memuat Acara</h2>
          <p className="text-[#86868b] text-xs mb-5">
            Terjadi kendala saat menghubungkan ke sistem tiket.
          </p>
          <a
            href="/"
            className="inline-block py-2.5 px-5 rounded-full bg-white text-black font-semibold text-xs hover:bg-[#e5e5ea] transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] selection:bg-white selection:text-black flex flex-col">
      {!hasError && detailEvent !== null && (
        <>
          <Navbar />
          <Header
            title={detailEvent.title}
            sub_title={detailEvent.sub_title}
            date={toDate(detailEvent.timestamp)}
            location={detailEvent.location}
          />
          <div className="flex-grow pb-20 sm:pb-0">
            <Content detailEvent={detailEvent} slug={slug} />
          </div>
          <footer className="py-8 text-center text-xs text-[#86868b] border-t border-white/[0.08] bg-[#0c0d0e] z-50">
            <p className="font-normal">
              © 2026 <span className="text-[#f5f5f7] font-medium">Bhima Night Carnival</span> • SMAN 1 Madiun
            </p>
            <p className="text-[11px] text-[#86868b]/70 mt-1">Platform Pemesanan Tiket Resmi</p>
          </footer>
        </>
      )}
    </div>
  );
}
