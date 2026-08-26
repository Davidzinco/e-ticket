import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminSettingsView from "@/app/components/views/admin/consolAdminSettingsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Sistem & Integrasi"
      subtitle="Informasi Konfigurasi dan Keamanan Console Admin"
    >
      <ConsolAdminSettingsView />
    </ConsolAdminLayout>
  );
}
