'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditLogSearchParams, LogLevel } from '@qnoffice/shared';
import { CalendarIcon, FilterIcon, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface AuditLogFiltersProps {
  contexts: string[];
}

export function AuditLogFilters({ contexts }: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<AuditLogSearchParams>({
    level: (searchParams.get('level') as LogLevel) || undefined,
    context: searchParams.get('context') || undefined,
    journeyId: searchParams.get('journeyId') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  });

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Clear existing filter params
    params.delete('level');
    params.delete('context');
    params.delete('journeyId');
    params.delete('startDate');
    params.delete('endDate');
    params.set('page', '1'); // Reset to first page

    // Add new filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({});
    const params = new URLSearchParams(searchParams);
    params.delete('level');
    params.delete('context');
    params.delete('journeyId');
    params.delete('startDate');
    params.delete('endDate');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <FilterIcon className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Log Level</Label>
            <Select
              value={filters.level || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  level: value === 'all' ? undefined : (value as LogLevel),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value={LogLevel.TRACE}>TRACE</SelectItem>
                <SelectItem value={LogLevel.DEBUG}>DEBUG</SelectItem>
                <SelectItem value={LogLevel.LOG}>LOG</SelectItem>
                <SelectItem value={LogLevel.WARN}>WARN</SelectItem>
                <SelectItem value={LogLevel.ERROR}>ERROR</SelectItem>
                <SelectItem value={LogLevel.FATAL}>FATAL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Select
              value={filters.context || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  context: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All contexts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contexts</SelectItem>
                {contexts.map((context) => (
                  <SelectItem key={context} value={context}>
                    {context}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="journeyId">Journey ID</Label>
            <Input
              id="journeyId"
              placeholder="e.g. 123e4567-e89b-12d3"
              value={filters.journeyId || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  journeyId: e.target.value || undefined,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Input
                id="startDate"
                type="datetime-local"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    startDate: e.target.value || undefined,
                  })
                }
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <Input
                id="endDate"
                type="datetime-local"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    endDate: e.target.value || undefined,
                  })
                }
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
