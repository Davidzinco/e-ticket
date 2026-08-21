import { EventInterface } from "../../interfaces/event";
import Navbar from "../../layouts/navbar/navbar";
import Content from "../../ui/home/content";
import Header from "../../ui/home/header";

export default function HomeView({
  events,
  hasError,
}: {
  events: EventInterface[];
  hasError: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0b1c30] text-[#f8f9ff] selection:bg-[#4f46e5] selection:text-white">
      <Navbar />
      <Header />
      <div className="flex-grow">
        <Content events={events} hasError={hasError} />
      </div>
      <footer className="py-8 text-center text-xs text-[#9aa4bc] border-t border-[#213145] bg-[#081525]">
        <p className="font-semibold text-[#c7c4d8]">
          © 2026 <span className="text-white font-bold">Bhima Night Carnival</span> • SMAN 1 Madiun
        </p>
        <p className="text-[11px] text-[#777587] mt-1">Platform Pemesanan Tiket Resmi</p>
      </footer>
    </div>
  );
}
