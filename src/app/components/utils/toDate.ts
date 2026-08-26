import { EventTimestamp } from "../interfaces/event";

export default function toDate(timestamp: EventTimestamp | { seconds: number; nanoseconds?: number }) {
  if (!timestamp) return new Date();
  const seconds = timestamp.seconds ?? (timestamp as any)._seconds ?? 0;
  const nanoseconds = timestamp.nanoseconds ?? (timestamp as any)._nanoseconds ?? 0;
  const date = new Date(seconds * 1000 + nanoseconds / 1000000);
  return date;
}
