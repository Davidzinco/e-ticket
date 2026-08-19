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
    <div className="flex flex-col min-h-screen bg-[#080808] text-[#F0ECE4] selection:bg-[#C9A87C] selection:text-[#080808]">
      <Navbar />
      <Header />
      <div className="flex-grow">
        <Content events={events} hasError={hasError} />
      </div>
      <footer className="px-5 sm:px-10 py-6 border-t border-[#1A1814] bg-[#080808]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#3E3A34]">
              © 2026 Bhima Night Carnival
            </p>
            <p className="text-[9px] tracking-[0.3em] uppercase text-[#2A2520] mt-0.5">
              SMAN 1 Madiun · Platform Tiket Resmi
            </p>
          </div>
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#2A2520]">
            All Rights Reserved
          </span>
        </div>
      </footer>
    </div>
  );
}
