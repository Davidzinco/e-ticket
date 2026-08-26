import FetchDetailEvent from "@/app/components/hooks/detail/fetchDetailEvent";
import Bnc2025View from "@/app/components/views/detail/bnc_2025/bnc2025View";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  try {
    const detailEvent = await FetchDetailEvent("5W7jcnr28tGc5E8tywRl");
    return (
      <Bnc2025View
        detailEvent={detailEvent}
        hasError={false}
        slug={"5W7jcnr28tGc5E8tywRl"}
      />
    );
  } catch (err) {
    console.error("HomePage load error:", err);
    const fallbackEvent = await FetchDetailEvent("5W7jcnr28tGc5E8tywRl");
    return (
      <Bnc2025View
        detailEvent={fallbackEvent}
        hasError={false}
        slug={"5W7jcnr28tGc5E8tywRl"}
      />
    );
  }
}
