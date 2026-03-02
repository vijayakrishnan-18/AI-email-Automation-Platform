'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FolderPageLayout } from '@/components/email/folder-page-layout';

export default function AllMailPage() {
  return (
    <DashboardLayout title="All Mail">
      <FolderPageLayout
        folder="all"
        title="All Mail"
        emptyMessage="No emails"
        showActions={{
          star: true,
          trash: true,
          spam: true,
        }}
      />
    </DashboardLayout>
  );
}
