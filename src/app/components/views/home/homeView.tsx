import { EventInterface } from "../../interfaces/event";
import Header from "../../layouts/header/header";
import BottomNav from "../../layouts/bottomNav/bottomNav";
import Content from "../../ui/home/content";

export default function HomeView({
  events,
  hasError,
}: {
  events: EventInterface[];
  hasError: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container font-sans">
      <Header title="Bhima Night Carnival" currentView="info" />
      <div className="flex-grow pt-16 pb-20">
        <Content events={events} hasError={hasError} />
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
