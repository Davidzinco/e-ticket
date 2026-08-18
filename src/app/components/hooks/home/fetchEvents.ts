export async function FetchEvents() {
  const baseUrl =
    process.env.NEXT_PUBLIC_NEXTAUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const res = await fetch(`${baseUrl}/api/event`, {
    next: { revalidate: 60 },
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch event");
  return data;
}
