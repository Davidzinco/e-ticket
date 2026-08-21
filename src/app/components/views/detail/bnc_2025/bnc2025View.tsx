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
      <div className="bg-[#0b1c30] min-h-screen flex flex-col justify-center items-center px-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-[#16263b] border border-[#213145]">
          <h2 className="text-white font-bold text-lg mb-1">Gagal Memuat Acara</h2>
          <p className="text-[#9aa4bc] text-xs mb-5">
            Terjadi kendala saat menghubungkan ke sistem tiket.
          </p>
          <a
            href="/"
            className="inline-block py-2.5 px-5 rounded-lg bg-[#4f46e5] text-white font-bold text-xs hover:bg-[#3525cd] transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1c30] text-[#f8f9ff] selection:bg-[#4f46e5] selection:text-white flex flex-col font-sans">
      {!hasError && detailEvent !== null && (
        <>
          <Navbar />
          <Header
            title={detailEvent.title}
            sub_title={detailEvent.sub_title}
            date={toDate(detailEvent.timestamp)}
            location={detailEvent.location}
          />
          <div className="flex-grow pb-24 sm:pb-0">
            <Content detailEvent={detailEvent} slug={slug} />
          </div>
          <footer className="py-8 text-center text-xs text-[#9aa4bc] border-t border-[#213145] bg-[#081525] z-50">
            <p className="font-semibold text-[#c7c4d8]">
              © 2026 <span className="text-white font-bold">Bhima Night Carnival</span> • SMAN 1 Madiun
            </p>
            <p className="text-[11px] text-[#777587] mt-1">Platform Pemesanan Tiket Resmi</p>
          </footer>
        </>
      )}
    </div>
  );
}
