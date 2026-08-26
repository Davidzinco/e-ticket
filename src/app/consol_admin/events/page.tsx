import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminEventsView from "@/app/components/views/admin/consolAdminEventsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Pengaturan Acara"
      subtitle="Informasi Kuota, Harga, dan Status Penjualan Acara"
    >
      <ConsolAdminEventsView />
    </ConsolAdminLayout>
  );
}
