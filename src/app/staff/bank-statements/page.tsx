"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminBankStatementsPage from "@/app/admin/bank-statements/page";

export default function StaffBankStatementsPage() {
  useRequirePermission("view_financial");
  return <AdminBankStatementsPage />;
}
