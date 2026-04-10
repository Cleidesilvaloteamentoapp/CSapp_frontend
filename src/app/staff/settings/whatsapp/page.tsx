"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminWhatsappPage from "@/app/admin/settings/whatsapp/page";

export default function StaffWhatsappPage() {
  useRequirePermission("manage_whatsapp");
  return <AdminWhatsappPage />;
}
