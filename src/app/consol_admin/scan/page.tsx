import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminScanView from "@/app/components/views/admin/consolAdminScanView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScanGatePage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Scanner Gate"
      subtitle="Validasi Tiket Pengunjung di Pintu Masuk BNC 2026"
    >
      <ConsolAdminScanView />
    </ConsolAdminLayout>
  );
}
