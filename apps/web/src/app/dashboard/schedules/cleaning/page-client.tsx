'use client';

import { CleaningSpreadsheetView } from '@/components/cleaning/cleaning-spreadsheet-view';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface CleaningPageClientProps {
  cycles: any[];
  error?: string | null;
}

export function CleaningPageClient({ cycles, error }: CleaningPageClientProps) {
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const events = cycles.flatMap((cycle) => cycle.events || []);

  return (
    <div className="space-y-6">
      <CleaningSpreadsheetView events={events} cycles={cycles} />
    </div>
  );
}
