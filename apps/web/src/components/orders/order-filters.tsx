'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/shared/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return undefined;
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    
    if (range?.from) {
      const params = new URLSearchParams(searchParams);
      params.set('startDate', format(range.from, 'yyyy-MM-dd'));
      
      if (range.to) {
        params.set('endDate', format(range.to, 'yyyy-MM-dd'));
      } else {
        params.set('endDate', format(range.from, 'yyyy-MM-dd'));
      }
      
      router.push(`?${params.toString()}`);
    } else {
      router.push('?');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd MMM yyyy', { locale: vi })} -{' '}
                  {format(dateRange.to, 'dd MMM yyyy', { locale: vi })}
                </>
              ) : (
                format(dateRange.from, 'dd MMM yyyy', { locale: vi })
              )
            ) : (
              <span>Chọn khoảng thời gian</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            initialFocus
            locale={vi}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
