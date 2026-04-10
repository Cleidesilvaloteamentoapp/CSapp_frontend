"use client";

import { useRequirePermission } from "@/hooks/use-require-permission";
import AdminDocumentsPage from "@/app/admin/documents/page";

export default function StaffDocumentsPage() {
  useRequirePermission("view_documents");
  return <AdminDocumentsPage />;
}
