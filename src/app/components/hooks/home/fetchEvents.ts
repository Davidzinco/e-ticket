import { retrieveData } from "@/libs/firebase/service";
import { EventInterface } from "../../interfaces/event";

export async function FetchEvents(): Promise<EventInterface[]> {
  try {
    const data = await retrieveData("event");
    return (data || []) as unknown as EventInterface[];
  } catch (error) {
    console.error("FetchEvents error:", error);
    throw error;
  }
}
