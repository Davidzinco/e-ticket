import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminDashboardView from "@/app/components/views/admin/consolAdminDashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Dashboard Ringkasan"
      subtitle="Ringkasan Penjualan Kupon & Kehadiran BNC 2026"
    >
      <ConsolAdminDashboardView />
    </ConsolAdminLayout>
  );
}
