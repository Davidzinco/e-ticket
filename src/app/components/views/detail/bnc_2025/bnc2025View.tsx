import { EventInterface } from "@/app/components/interfaces/event";
import Header from "@/app/components/layouts/header/header";
import BottomNav from "@/app/components/layouts/bottomNav/bottomNav";
import Content from "@/app/components/ui/bnc_2025/content";

export default function Bnc2025View({
  detailEvent,
  hasError,
  slug,
}: {
  detailEvent: EventInterface | null;
  hasError: boolean;
  slug: string | null;
}) {
  if (hasError || !detailEvent) {
    return (
      <div className="bg-background min-h-screen flex flex-col justify-center items-center px-6 text-center text-on-background">
        <div className="max-w-md p-8 rounded-2xl bg-surface border border-outline-variant shadow-lg">
          <h2 className="font-bold text-lg text-on-surface mb-2">Gagal Memuat Acara</h2>
          <p className="text-on-surface-variant text-xs mb-6">
            Terjadi kendala saat menghubungkan ke sistem tiket.
          </p>
          <a
            href="/"
            className="inline-block py-3 px-6 rounded-xl bg-primary text-on-primary font-bold text-xs hover:opacity-90 transition-all shadow-md"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container">
      <Header title={detailEvent.title || "BNC"} currentView="info" />
      <div className="flex-grow pb-16">
        <Content detailEvent={detailEvent} slug={slug} />
      </div>
      <footer className="py-6 text-center text-xs text-on-surface-variant border-t border-outline-variant bg-surface mb-16">
        <p className="font-bold text-on-surface">
          © 2026 <span className="text-primary font-bold" style={{ color: "rgb(56, 105, 72)" }}>Bhima Night Carnival</span> • SMAN 1 Madiun
        </p>
        <p className="text-[11px] text-on-surface-variant mt-1">Platform Pemesanan Tiket Resmi</p>
      </footer>
      <BottomNav activeTab="info" />
    </div>
  );
}
