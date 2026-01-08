'use client';

import { CreateHolidayModal } from '@/components/holidays/create-holiday-modal';
import { Button } from '@/components/ui/button';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface HolidayPageActionsProps {
  onHolidayCreated?: () => void;
}

export function HolidayPageActions({
  onHolidayCreated,
}: HolidayPageActionsProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <ProtectedComponent permission={PERMISSIONS.MANAGE_HOLIDAYS}>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Holiday
        </Button>
        <CreateHolidayModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={onHolidayCreated}
        />
      </ProtectedComponent>
    </div>
  );
}
