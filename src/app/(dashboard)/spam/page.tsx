'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FolderPageLayout } from '@/components/email/folder-page-layout';

export default function SpamPage() {
  return (
    <DashboardLayout title="Spam">
      <FolderPageLayout
        folder="spam"
        title="Spam"
        emptyMessage="No spam - great!"
        showActions={{
          restore: true,
          delete: true,
        }}
      />
    </DashboardLayout>
  );
}
