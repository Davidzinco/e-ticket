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
      return toast.info("Pembelian kupon sudah mencapai batas");

    if (count < maxCount) setCount(count + 1);
  };
  const handleDown = () => {
    if (count <= 1) return toast.error("Minimal pembelian adalah 1 kupon");

    if (count > 1) setCount(count - 1);
  };
  return (
    <>
      <div className="flex bg-[#873567] text-white rounded-md text-[17px] w-[5rem] items-center sm:text-xl">
        <button
          type="button"
          className="w-full cursor-pointer "
          onClick={handleDown}
        >
          -
        </button>
        <p className="w-full text-center">{count}</p>
        <button
          type="button"
          className="w-full cursor-pointer"
          onClick={handleUp}
        >
          +
        </button>
      </div>
    </>
  );
}
