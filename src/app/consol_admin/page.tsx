import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import AdminVerifyForm from "../components/ui/admin/adminVerifyForm";
import ConsolAdminLayout from "../components/layouts/admin/consolAdminLayout";
import ConsolAdminDashboardView from "../components/views/admin/consolAdminDashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsolAdminPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    return <AdminVerifyForm />;
  }

  return (
    <ConsolAdminLayout
      title="Dashboard Ringkasan"
      subtitle="Ringkasan Penjualan Tiket & Kehadiran BNC 2026"
    >
      <ConsolAdminDashboardView />
    </ConsolAdminLayout>
  );
}
