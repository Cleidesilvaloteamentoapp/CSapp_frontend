"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminEarlyPayoffPage from "@/app/admin/early-payoff-requests/page";

export default function StaffEarlyPayoffPage() {
  useRequirePermission("manage_financial");
  return <AdminEarlyPayoffPage />;
}
