import { retrieveDataById } from "@/libs/firebase/service";
import { EventInterface } from "../../interfaces/event";

export default async function FetchDetailEvent(id: string): Promise<EventInterface> {
  try {
    const data = await retrieveDataById("event", id);
    if (!data) throw new Error("Event not found");
    return { id, ...data } as unknown as EventInterface;
  } catch (error) {
    console.error("FetchDetailEvent error:", error);
    throw error;
  }
}
