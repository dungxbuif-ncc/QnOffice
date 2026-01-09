'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRightLeft } from 'lucide-react';

interface SwapControlsProps {
  selectedCount: number;
  isSwapping: boolean;
  onSwap: () => void;
  onClear: () => void;
}

export function SwapControls({
  selectedCount,
  isSwapping,
  onSwap,
  onClear,
}: SwapControlsProps) {
  if (selectedCount === 0) return null;

  const message =
    selectedCount === 1
      ? '1 event selected. Select one more to swap.'
      : '2 events selected. Ready to swap.';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-0 bg-background shadow-lg mx-auto max-w-xl">
      <div className="container ">
        <Card className="border-0 border-orange-200 bg-orange-50 shadow-none">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">{message}</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={onClear}>
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  disabled={selectedCount !== 2 || isSwapping}
                  onClick={onSwap}
                >
                  {isSwapping ? 'Swapping...' : 'Swap Events'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
