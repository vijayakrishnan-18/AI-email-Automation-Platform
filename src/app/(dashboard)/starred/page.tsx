'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FolderPageLayout } from '@/components/email/folder-page-layout';

export default function StarredPage() {
  return (
    <DashboardLayout title="Starred">
      <FolderPageLayout
        folder="starred"
        title="Starred"
        emptyMessage="No starred emails"
        showActions={{
          star: true,
          trash: true,
          spam: true,
        }}
      />
    </DashboardLayout>
  );
}
