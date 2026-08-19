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
    <header className="relative bg-linear-to-t from-[#18893c] from-20% to-[#8ee822] border-b-4 border-[#ffb64d] z-[1]">
      <section className="flex flex-col items-center w-full text-center min-h-[180px] mx-auto">
        <main className="w-full flex">
          <div className="relative w-full h-[300px] overflow-hidden max-md:hidden">
            <Image
              src="/images/bnc_2025/gambar2.webp"
              alt="gambar1"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="relative w-full h-[300px] overflow-hidden">
            <Image
              src="/images/bnc_2025/gambar1.webp"
              alt="gambar2"
              fill
              className="object-cover object-center"
            />
          </div>

          <div className="relative w-full h-[300px] overflow-hidden max-lg:hidden">
            <Image
              src="/images/bnc_2025/gambar3.webp"
              alt="gambar3"
              fill
              className="object-cover object-center"
            />
          </div>
        </main>

        <div className="absolute bottom-0 translate-y-1/2 mx-auto border-2 border-[#ffb64d] bg-[#770b4d] text-white flex gap-4 p-2 rounded-lg shadow-xl max-sm:text-sm">
          <h1 className="flex gap-1 sm:gap-2 items-center sm:text-xl">
            <Image
              src="/icons/redLocation.webp"
              alt="pin"
              width={100}
              height={100}
              className="max-w-[17px] max-h-[17px] w-full sm:max-w-[20px] sm:max-h-[20px]"
            />
            <span>{location}</span>
          </h1>
          <h1 className="flex gap-1 sm:gap-2 items-center sm:text-xl">
            <Image
              src="/icons/calendar.png"
              alt="pin"
              width={100}
              height={100}
              className="max-w-[19px] max-h-[19px] w-full sm:max-w-[21px] sm:max-h-[21px]"
            />
            <span>{dateConvert}</span>
          </h1>
          <h1 className="flex gap-1 sm:gap-2 items-center sm:text-xl">
            <Image
              src="/icons/clock.png"
              alt="pin"
              width={100}
              height={100}
              className="max-w-[20px] max-h-[20px] w-full sm:max-w-[22px] sm:max-h-[22px]"
            />
            <span>{timeConvert}</span>
          </h1>
        </div>
      </section>
    </header>
  );
}
