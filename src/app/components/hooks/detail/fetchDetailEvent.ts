import { retrieveDataById } from "@/libs/firebase/service";
import { EventInterface } from "../../interfaces/event";

const DEFAULT_EVENT_FALLBACK: EventInterface = {
  id: "5W7jcnr28tGc5E8tywRl",
  title: "Bhima Night Carnival",
  sub_title: "BNC 2026",
  description: "Official E-Ticket Bhima Night Carnival 2026 SMAN 1 Madiun.",
  location: "SMAN 1 Madiun",
  src: "https://sman1madiun.sch.id/wp-content/uploads/2024/10/logo-banner.png",
  closeTime: { seconds: 1788616800, nanoseconds: 0 },
  isSoldOut: false,
  timestamp: { seconds: 1788595200, nanoseconds: 0 },
  price: 56000,
  price_festival: 56000,
  price_vip: 140000,
  ticket: 1698,
  ticket_festival: 500,
  ticket_vip: 100,
};

export default async function FetchDetailEvent(id: string): Promise<EventInterface> {
  try {
    const data = await retrieveDataById("event", id);
    if (data) {
      return { id, ...data } as unknown as EventInterface;
    }
  } catch (error) {
    console.error("FetchDetailEvent error:", error);
  }

  // Gracefully fallback to default event if database is unreachable
  return { ...DEFAULT_EVENT_FALLBACK, id };
}
