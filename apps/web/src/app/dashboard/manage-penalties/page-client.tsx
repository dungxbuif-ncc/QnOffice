'use client';

import { PenaltyTypeManager } from '@/components/penalties/penalty-type-manager';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaginationState, PenaltyType } from '@qnoffice/shared';

interface ManagePenaltiesClientProps {
  initialData: PenaltyType[];
  initialPagination: PaginationState;
}

export function ManagePenaltiesClient({
  initialData,
  initialPagination,
}: ManagePenaltiesClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Penalty Types</CardTitle>
          <CardDescription>
            Create, edit, and manage penalty types used across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PenaltyTypeManager
            initialData={initialData}
            initialPagination={initialPagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
