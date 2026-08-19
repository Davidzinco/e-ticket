"use client";
import { Link } from "next-view-transitions";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const transactionStatus = searchParams.get("transaction_status");
  const statusCode = searchParams.get("status_code");
  return (
    <>
      {(transactionStatus === "settlement" ||
        transactionStatus === "capture") &&
      statusCode === "200" ? (
        <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <p className="font-semibold text-green-500 text-[4rem] leading-[3rem] max-sm:text-3xl">
              Pembayaran Berhasil
            </p>
            <h1 className="mt-4 text-7xl font-semibold tracking-tight text-balance text-gray-900 max-sm:text-2xl max-sm:mt-0">
              Terimakasih Atas Pembeliannya
            </h1>
            <p className="mt-6 text-xl font-medium text-pretty text-orange-500 max-sm:text-[14px] max-sm:mt-1">
              {`Cek folder spam jika email tidak muncul di inbox!`}
            </p>
            <p className="text-md font-medium text-pretty text-black-500 max-sm:text-[12px] max-sm:mt-1 mt-2 italic">
              {`Hubungi panitia kami dibawah ini jika mengalami kendala`}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 max-sm:mt-4">
              <Link
                href="/"
                className="border-2 rounded-xl bg-green-500 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-green-500/80 max-sm:py-2"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/+6289680575400"
                className="border-2 rounded-xl bg-orange-400 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-orange-400/80 max-sm:py-2"
              >
                Hubungi Panitia
              </Link>
            </div>
          </div>
        </main>
      ) : transactionStatus === "pending" && statusCode === "201" ? (
        <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <p className="font-semibold text-orange-400 text-[4rem] leading-[3rem] max-sm:text-3xl">
              Payment Pending
            </p>
            <h1 className="mt-4 text-7xl font-semibold tracking-tight text-balance text-gray-900 max-sm:text-2xl max-sm:mt-0">
              Pembayaranmu Masih Tertunda
            </h1>
            <p className="mt-6 text-xl font-medium text-pretty text-orange-500 max-sm:text-[14px] max-sm:mt-1">
              {`Kamu bisa melanjutkan pembayaran atau membuat pembayaran baru`}
            </p>
            <p className="text-md font-medium text-pretty text-black-500 max-sm:text-[12px] max-sm:mt-1 mt-2 italic">
              {`Hubungi panitia kami dibawah ini jika mengalami kendala`}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 max-sm:mt-4">
              <Link
                href="/"
                className="border-2 rounded-xl bg-orange-400 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-orange-400/80 max-sm:py-2"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/+6289680575400"
                className="border-2 rounded-xl bg-gray-400 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-gray-400/80 max-sm:py-2"
              >
                Hubungi Panitia
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <p className="font-semibold text-red-500 text-[4rem] leading-[3rem] max-sm:text-3xl">
              Terjadi Kesalahan
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl max-sm:text-2xl max-sm:mt-0">
              Mohon Maaf Atas Kendala yang terjadi
            </h1>
            <p className="mt-6 text-xl font-medium text-pretty text-orange-500 max-sm:text-base max-sm:mt-1">
              {`Silahkan hubungi panitia kami dibawah ini untuk memproses kendalamu lebih lanjut`}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 max-sm:mt-4">
              <Link
                href="/"
                className="border-2 rounded-xl bg-blue-500 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-blue-500/80 max-sm:py-2"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="https://wa.me/+6289680575400"
                className="border-2 rounded-xl bg-green-500 px-3.5 py-2.5 max-sm:text-[12px] text-sm font-semibold text-white shadow-xs hover:bg-green-500/80 max-sm:py-2"
              >
                Hubungi Panitia
              </Link>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
