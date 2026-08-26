import { isServerAdminAuthenticated } from "@/libs/adminAuth";
import { redirect } from "next/navigation";
import ConsolAdminLayout from "@/app/components/layouts/admin/consolAdminLayout";
import ConsolAdminOrdersView from "@/app/components/views/admin/consolAdminOrdersView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const isAuthenticated = await isServerAdminAuthenticated();

  if (!isAuthenticated) {
    redirect("/consol_admin");
  }

  return (
    <ConsolAdminLayout
      title="Transaksi & Pemesanan"
      subtitle="Riwayat Transaksi dan Status Pembayaran"
    >
      <ConsolAdminOrdersView />
    </ConsolAdminLayout>
  );
}
