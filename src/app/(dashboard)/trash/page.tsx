'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FolderPageLayout } from '@/components/email/folder-page-layout';

export default function TrashPage() {
  return (
    <DashboardLayout title="Trash">
      <FolderPageLayout
        folder="trash"
        title="Trash"
        emptyMessage="Trash is empty"
        showActions={{
          restore: true,
          delete: true,
        }}
      />
    </DashboardLayout>
  );
}
