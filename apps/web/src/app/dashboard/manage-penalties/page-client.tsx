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
import { Shield } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Manage Penalty Types
          </h1>
          <p className="text-muted-foreground">
            Manage penalty types and their default amounts
          </p>
        </div>
      </div>

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
