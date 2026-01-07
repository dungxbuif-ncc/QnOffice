'use client';

import { CleaningSpreadsheetView } from '@/components/cleaning/cleaning-spreadsheet-view';
import { useAuth } from '@/shared/contexts/auth-context';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface CleaningPageClientProps {
  cycles: any[];
  error?: string | null;
}

export function CleaningPageClient({ cycles, error }: CleaningPageClientProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const events = cycles.flatMap((cycle) => cycle.events || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Office Cleaning Management
        </h1>
        <div className="text-sm text-muted-foreground">
          {events.length} events • {cycles.length} cycles
        </div>
      </div>

      <CleaningSpreadsheetView events={events} cycles={cycles} />
    </div>
  );
}
