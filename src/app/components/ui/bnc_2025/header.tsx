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
    <header className="relative bg-[#0b1c30] border-b border-[#213145] z-[10] pt-16">
      <section className="flex flex-col items-center w-full text-center mx-auto relative pb-10">
        {/* Gallery Image Showcase */}
        <main className="w-full flex relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30] via-transparent to-[#0b1c30]/40 z-10 pointer-events-none"></div>

          <div className="relative w-full h-[240px] sm:h-[320px] overflow-hidden max-md:hidden">
            <Image
              src="/images/bnc_2025/gambar2.webp"
              alt="Festival Showcase 1"
              fill
              className="object-cover object-center filter brightness-[0.9]"
            />
          </div>

          <div className="relative w-full h-[240px] sm:h-[320px] overflow-hidden">
            <Image
              src="/images/bnc_2025/gambar1.webp"
              alt="Festival Stage Showcase"
              fill
              className="object-cover object-center filter brightness-[0.95]"
            />
          </div>

          <div className="relative w-full h-[240px] sm:h-[320px] overflow-hidden max-lg:hidden">
            <Image
              src="/images/bnc_2025/gambar3.webp"
              alt="Festival Showcase 2"
              fill
              className="object-cover object-center filter brightness-[0.9]"
            />
          </div>
        </main>

        {/* Stitch TiketGo Metadata Capsule */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-xl border border-[#213145] bg-[#16263b]/95 backdrop-blur-xl text-white flex flex-wrap justify-around items-center gap-3 py-3 px-6 rounded-xl shadow-xl shadow-black/40 z-20">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[#9aa4bc]">Lokasi:</span>
            <span className="text-white font-bold">{location}</span>
          </div>

          <div className="w-px h-3.5 bg-[#213145] hidden sm:block"></div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[#9aa4bc]">Tanggal:</span>
            <span className="text-[#c3c0ff] font-bold">{dateConvert}</span>
          </div>

          <div className="w-px h-3.5 bg-[#213145] hidden sm:block"></div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[#9aa4bc]">Waktu:</span>
            <span className="text-white font-bold">{timeConvert} WIB</span>
          </div>
        </div>
      </section>
    </header>
  );
}
