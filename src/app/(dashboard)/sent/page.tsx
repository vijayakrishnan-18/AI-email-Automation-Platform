'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FolderPageLayout } from '@/components/email/folder-page-layout';

export default function SentPage() {
  return (
    <DashboardLayout title="Sent">
      <FolderPageLayout
        folder="sent"
        title="Sent"
        emptyMessage="No sent emails"
        showActions={{
          star: true,
          trash: true,
        }}
      />
    </DashboardLayout>
  );
}
