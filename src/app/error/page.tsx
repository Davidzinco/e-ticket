import { Link } from "next-view-transitions";

export default function successPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="font-semibold text-red-500 text-[4rem] leading-[3rem] max-sm:text-3xl">
          Terjadi Kesalahan
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl max-sm:text-2xl max-sm:mt-0">
          Mohon Maaf Atas Kendala yang terjadi
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-orange-500 sm:text-xl/8 max-sm:text-base max-sm:mt-1">
          {`Silahkan hubungi panitia kami dibawah ini untuk memproses kendalamu lebih lanjut`}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6 max-sm:mt-4">
          <Link
            href="/"
            className="border-2 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500/80 max-sm:py-2"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href={`https://wa.me/${(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "6289680575400").replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 rounded-xl bg-green-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-green-500/80 max-sm:py-2"
          >
            Hubungi Panitia
          </Link>
        </div>
      </div>
    </main>
  );
}
