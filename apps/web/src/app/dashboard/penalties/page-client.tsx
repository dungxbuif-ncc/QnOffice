'use client';

import { CreatePenaltyForm } from '@/components/penalties/create-penalty-form';
import { PenaltiesDataTable } from '@/components/penalties/penalties-data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, ProtectedComponent } from '@/shared/lib/auth';
import { PaginationState } from '@/shared/types/pagination';
import { Penalty } from '@/shared/types/penalty';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PenaltiesPageClientProps {
  initialData: Penalty[];
  initialPagination: PaginationState;
}

export function PenaltiesPageClient({
  initialData,
  initialPagination,
}: PenaltiesPageClientProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Penalties</CardTitle>
          <ProtectedComponent permission={PERMISSIONS.MANAGE_PENALTIES}>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Penalty
            </Button>
          </ProtectedComponent>
        </CardHeader>
        <CardContent className="overflow-auto">
          <PenaltiesDataTable
            initialData={initialData}
            initialPagination={initialPagination}
          />
        </CardContent>
      </Card>

      <CreatePenaltyForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
