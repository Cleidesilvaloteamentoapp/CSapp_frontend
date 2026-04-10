"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminBoletoPage from "@/app/admin/sicredi/boletos/page";

export default function StaffBoletoPage() {
  useRequirePermission("manage_sicredi");
  return <AdminBoletoPage />;
}
