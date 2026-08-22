import { useEffect, useState } from "react";
import { EventInterface } from "../../interfaces/event";

export default function useGetEvent() {
  const [data, setData] = useState<EventInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/event");
        if (!res.ok) {
          throw new Error("Failed to fetch event");
        }
        const data = await res.json();
        setData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(true);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  return { data, loading, error };
}
