import { FetchEvents } from "./components/hooks/home/fetchEvents";
import HomeView from "./components/views/home/homeView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  try {
    const events = await FetchEvents();
    return <HomeView events={events} hasError={false} />;
  } catch {
    return <HomeView events={[]} hasError={true} />;
  }
}
