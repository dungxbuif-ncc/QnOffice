'use client';

import { CreateCycleModal } from '@/components/opentalk/create-cycle-modal';
import { Button } from '@/components/ui/button';
import { PERMISSIONS, ProtectedComponent } from '@/shared/auth';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';

interface OpentalkPageActionsProps {
  onScheduleCreated?: () => void;
}

export function OpentalkPageActions({
  onScheduleCreated,
}: OpentalkPageActionsProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <ProtectedComponent permission={PERMISSIONS.MANAGE_OPENTALK}>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <CalendarPlus className="mr-2 h-4 w-4" />
            New Cycle
          </Button>
        </ProtectedComponent>
      </div>

      <CreateCycleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        type="OPENTALK"
        onSuccess={() => {
          onScheduleCreated?.();
        }}
      />
    </>
  );
}
