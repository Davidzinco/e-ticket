export default async function FetchDetailEvent(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/event?id=${id}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch event");
  return data;
}
