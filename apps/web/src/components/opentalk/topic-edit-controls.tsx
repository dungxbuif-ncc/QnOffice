'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface TopicEditControlsProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function TopicEditControls({
  value,
  onChange,
  onSave,
  onCancel,
}: TopicEditControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
      <Button size="sm" variant="outline" className="h-8 px-2" onClick={onSave}>
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
