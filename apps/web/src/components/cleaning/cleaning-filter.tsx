'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventStatus } from '@qnoffice/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export function CleaningFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const initialStatus = searchParams.get('status') || '';

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState(initialStatus);

  const hasQueryFilter = useMemo(
    () => Boolean(initialEmail || initialStatus),
    [initialEmail, initialStatus],
  );

  const isChanged = useMemo(
    () => email !== initialEmail || status !== initialStatus,
    [email, status, initialEmail, initialStatus],
  );

  const handleApply = () => {
    if (!isChanged) return;

    const params = new URLSearchParams(searchParams.toString());

    email ? params.set('email', email) : params.delete('email');
    status ? params.set('status', status) : params.delete('status');

    params.set('tab', 'schedules');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClear = () => {
    if (!hasQueryFilter) {
      setEmail('');
      setStatus('');
      return;
    }

    setEmail('');
    setStatus('');

    const params = new URLSearchParams(searchParams.toString());
    params.delete('email');
    params.delete('status');
    params.set('tab', 'schedules');

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="w-[220px]">
        <Input
          placeholder="Search email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="w-[160px]">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EventStatus.PENDING}>
              {EventStatus.PENDING}
            </SelectItem>
            <SelectItem value={EventStatus.COMPLETED}>
              {EventStatus.COMPLETED}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleApply} disabled={!isChanged}>
        Áp dụng
      </Button>

      <Button variant="outline" onClick={handleClear}>
        Clear filter
      </Button>
    </div>
  );
}
