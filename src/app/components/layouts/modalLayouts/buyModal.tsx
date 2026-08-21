import { toast } from "sonner";
import Modal from "../../common/modal";
import { useState } from "react";
import { EventInterface } from "../../interfaces/event";
import { v4 as uuidv4 } from "uuid";
import { Tooltip } from "../../common/toolTip";

export default function BuyModal({
  onClose,
  count,
  mutate,
  event,
}: {
  onClose: () => void;
  count: number;
  mutate: () => void;
  event: EventInterface | undefined;
}) {
  const [isUsernameErr, setIsUsernameErr] = useState<{
    [key: number]: boolean;
  }>({});
  const [isConfirm, setIsConfirm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isConfirm) {
      setIsConfirm(true);
      return toast.info("Pastikan data sudah benar lalu klik sekali lagi");
    }
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const usernameRegex = /^[a-zA-Z0-9 ]{3,50}$/;
    const newErrors: { [key: number]: boolean } = {};
    for (let i = 0; i < count; i++) {
      const name = formData.get(`name${i}`) as string;
      newErrors[i] = usernameRegex.test(name) ? false : true;
    }
    setIsUsernameErr(newErrors);

    const hasError = Object.values(newErrors).some((v) => v);
    if (hasError) {
      setIsLoading(false);
      return toast.error("Username Tidak Valid");
    }
    try {
      const orderId = uuidv4().replace(/-/g, "").slice(0, 24);
      const names = Array.from(
        { length: count },
        (_, i) => formData.get(`name${i}`) as string
      );
      const data = {
        orderId,
        eventId: "5W7jcnr28tGc5E8tywRl",
        productName: event?.title,
        price: event?.price,
        quantity: count,
        email: formData.get("email") as string,
        names,
      };

      const res = await fetch("/api/tokenizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const reqData = await res.json();
      if (reqData.message === "Invalid username") {
        toast.error("Invalid username");
        return;
      }
      if (reqData.message === "Invalid email") {
        toast.error("Invalid email");
        return;
      }
      if (reqData.message === "Ticket not enough") {
        toast.info("Maaf Saat Ini Ticket Sudah Habis");
        mutate();
        return;
      }
      if (res.status !== 200) {
        toast.error("Ups Terjadi Kesalahan");
        return;
      }
      window?.snap?.pay(reqData?.token?.token, {
        async onError() {
          await handleFail(orderId);

          mutate();
        },
        async onClose() {
          await handleFail(orderId);

          mutate();
        },
      });
    } catch {
      toast.error("Ups Terjadi Kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFail = async (order_id: string) => {
    await fetch("/api/event", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id,
      }),
    }).catch(() => toast.error("Ups Terjadi Kesalahan"));
  };
  return (
    <Modal onClose={onClose} className="bg-[#16263b] border border-[#213145] text-[#f8f9ff] max-w-lg w-full p-6 sm:p-7 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4f46e5]/15 border border-[#4f46e5]/30 text-[#c3c0ff] text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>Checkout Tiket</span>
          </div>
          <h2 className="font-extrabold text-2xl text-white tracking-tight">
            Data Pemesan
          </h2>
          <p className="text-xs text-[#9aa4bc] mt-1">
            Lengkapi nama dan email untuk penerbitan tiket resmi.
          </p>
        </div>

        <section className="max-h-[48dvh] overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar">
          {Array.from({ length: count }, (_, index) => (
            <div key={index} className="p-3.5 rounded-xl bg-[#0b1c30] border border-[#213145]">
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor={`name${index}`}
                  className="text-xs font-bold text-[#c3c0ff]"
                >
                  Nama Pengunjung {count > 1 ? `#${index + 1}` : ""}
                </label>
                {count > 1 && index === 0 && (
                  <Tooltip label="Nama ini digunakan sebagai kontak utama pembeli">
                    <span className="text-[11px] font-bold text-[#4f46e5] bg-[#4f46e5]/15 px-2 py-0.5 rounded-md border border-[#4f46e5]/30">
                      Kontak Utama
                    </span>
                  </Tooltip>
                )}
              </div>
              <input
                type="text"
                id={`name${index}`}
                name={`name${index}`}
                placeholder="Nama lengkap sesuai kartu identitas"
                required
                min={3}
                max={50}
                className="w-full rounded-lg bg-[#16263b] border border-[#213145] focus:border-[#4f46e5] text-white placeholder-[#777587] px-3.5 py-2 text-sm outline-none transition-colors"
              />
              {isUsernameErr[index] && (
                <p className="text-red-400 text-xs mt-1 pl-1">
                  Hanya boleh mengandung huruf dan angka
                </p>
              )}
            </div>
          ))}
        </section>

        <div className="p-3.5 rounded-xl bg-[#0b1c30] border border-[#213145]">
          <label htmlFor="email" className="block text-xs font-bold text-[#c3c0ff] mb-1.5">
            Email Pengiriman Tiket QR
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="contoh: nama@gmail.com"
            required
            className="w-full rounded-lg bg-[#16263b] border border-[#213145] focus:border-[#4f46e5] text-white placeholder-[#777587] px-3.5 py-2 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#213145]">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#9aa4bc] hover:text-white px-3 py-2 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#4f46e5] text-white hover:bg-[#3525cd] font-bold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-md shadow-[#4f46e5]/30 cursor-pointer active:scale-95 disabled:bg-[#213145] disabled:text-[#777587] disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Memproses..." : isConfirm ? "Konfirmasi & Bayar" : "Lanjut Pembayaran"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
