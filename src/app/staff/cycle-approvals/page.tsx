"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminCycleApprovalsPage from "@/app/admin/cycle-approvals/page";

export default function StaffCycleApprovalsPage() {
  useRequirePermission("manage_financial");
  return <AdminCycleApprovalsPage />;
}
