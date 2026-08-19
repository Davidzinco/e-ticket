import Image from "next/image";

export default function Header({
  title,
  sub_title,
  location,
  date,
}: {
  title: string;
  sub_title: string;
  location: string;
  date: Date;
}) {
  const dateConvert = date
    .toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
    .split("/")
    .join("-");
  const timeConvert = date
    .toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .split(".")
    .slice(0, 2)
    .join(":");

  return (
    <header className="relative bg-black border-b border-white/[0.08] z-[10]">
      <section className="flex flex-col items-center w-full text-center mx-auto relative pb-12">
        {/* Gallery Image Showcase */}
        <main className="w-full flex relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10 pointer-events-none"></div>

          {/* Only show side images on medium+ screens */}
          <div className="relative w-full h-[200px] sm:h-[300px] overflow-hidden max-md:hidden">
            <Image
              src="/images/bnc_2025/gambar2.webp"
              alt="Festival Showcase 1"
              fill
              className="object-cover object-center filter brightness-[0.85] contrast-[1.05]"
            />
          </div>

          {/* Main image — always visible */}
          <div className="relative w-full h-[220px] sm:h-[300px] overflow-hidden">
            <Image
              src="/images/bnc_2025/gambar1.webp"
              alt="Festival Stage Showcase"
              fill
              className="object-cover object-center filter brightness-[0.95] contrast-[1.05]"
            />
          </div>

          <div className="relative w-full h-[200px] sm:h-[300px] overflow-hidden max-lg:hidden">
            <Image
              src="/images/bnc_2025/gambar3.webp"
              alt="Festival Showcase 2"
              fill
              className="object-cover object-center filter brightness-[0.85] contrast-[1.05]"
            />
          </div>
        </main>

        {/* Metadata Capsule — stacks vertically on mobile */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl border border-white/[0.12] bg-[#121417]/90 backdrop-blur-2xl text-[#f5f5f7] flex flex-col sm:flex-row flex-wrap justify-around items-center gap-1.5 sm:gap-3 py-3 px-5 sm:px-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20">
          <div className="flex items-center gap-2 text-xs font-medium w-full sm:w-auto justify-center">
            <span className="text-[#86868b]">Lokasi</span>
            <span className="text-white font-semibold">{location}</span>
          </div>

          <div className="hidden sm:block w-px h-3.5 bg-white/[0.12]"></div>

          <div className="flex items-center gap-2 text-xs font-medium w-full sm:w-auto justify-center">
            <span className="text-[#86868b]">Tanggal</span>
            <span className="text-[#e5c378] font-semibold">{dateConvert}</span>
          </div>

          <div className="hidden sm:block w-px h-3.5 bg-white/[0.12]"></div>

          <div className="flex items-center gap-2 text-xs font-medium w-full sm:w-auto justify-center">
            <span className="text-[#86868b]">Waktu</span>
            <span className="text-white font-semibold">{timeConvert} WIB</span>
          </div>
        </div>
      </section>
    </header>
  );
}
