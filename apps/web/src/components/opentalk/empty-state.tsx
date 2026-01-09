'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No cycles found. Create a new cycle to get started.</p>
        </div>
      </CardContent>
    </Card>
  );
}
