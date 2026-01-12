'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InlineEditControlsProps {
  value: string;
  type?: 'text' | 'date';
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function InlineEditControls({
  value,
  type = 'text',
  onChange,
  onSave,
  onCancel,
}: InlineEditControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Button size="sm" variant="outline" onClick={onSave}>
        ✓
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel}>
        ✕
      </Button>
    </div>
  );
}
