import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminTicketsView from "@/app/components/views/admin/consolAdminTicketsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TicketsPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Data E-Tiket"
      subtitle="Kelola dan Cari Data E-Tiket BNC 2026"
    >
      <ConsolAdminTicketsView />
    </ConsolAdminLayout>
  );
}
