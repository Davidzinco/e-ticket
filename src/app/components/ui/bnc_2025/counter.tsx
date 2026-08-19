import { toast } from "sonner";

export default function Counter({
  maxCount,
  count,
  setCount,
}: {
  maxCount: number;
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  const handleUp = () => {
    if (count >= maxCount)
      return toast.info("Pembelian tiket sudah mencapai batas");

    if (count < maxCount) setCount(count + 1);
  };
  const handleDown = () => {
    if (count <= 1) return toast.error("Minimal pembelian adalah 1 tiket");

    if (count > 1) setCount(count - 1);
  };
  return (
    <div className="flex bg-[#16181b] text-white rounded-full border border-white/[0.12] overflow-hidden items-center h-10 w-28 sm:w-32 shadow-sm">
      <button
        type="button"
        className="w-10 h-full flex items-center justify-center font-medium text-base text-[#86868b] hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer select-none"
        onClick={handleDown}
      >
        −
      </button>
      <span className="flex-1 text-center font-semibold text-sm sm:text-base text-[#f5f5f7] select-none">
        {count}
      </span>
      <button
        type="button"
        className="w-10 h-full flex items-center justify-center font-medium text-base text-[#86868b] hover:text-white hover:bg-white/[0.06] active:scale-90 transition-all cursor-pointer select-none"
        onClick={handleUp}
      >
        +
      </button>
    </div>
  );
}
