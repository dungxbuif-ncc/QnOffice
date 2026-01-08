'use client';

import { CreateStaffModal } from '@/components/staff/create-staff-modal';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { useRouter } from 'next/navigation';

interface StaffPageActionsProps {
  branches: Array<{ id: number; name: string; code: string }>;
}

export function StaffPageActions({ branches }: StaffPageActionsProps) {
  const router = useRouter();

  const handleStaffCreated = async () => {
    // Small delay to ensure backend has processed the request
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Refresh the page to show the new staff member
    router.refresh();
  };

  return (
    <ProtectedComponent permission={PERMISSIONS.CREATE_STAFF}>
      <CreateStaffModal
        branches={branches}
        onStaffCreated={handleStaffCreated}
      />
    </ProtectedComponent>
  );
}
