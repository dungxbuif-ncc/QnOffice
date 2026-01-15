'use client';

import { CleaningSpreadsheetView } from '@/components/cleaning/cleaning-spreadsheet-view';
import { SwapRequestManagement } from '@/components/cleaning/swap-request-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/shared/contexts/auth-context';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { UserRole } from '@qnoffice/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface CleaningPageClientProps {
  cycles: any[];
  error?: string | null;
}

export function CleaningPageClient({ cycles, error }: CleaningPageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'schedules';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const events = cycles.flatMap((cycle) => cycle.events || []);

  const mode = user?.role === UserRole.STAFF ? 'user' : 'hr';

  return (
    <div className="space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules">Quản lý lịch trực</TabsTrigger>
          <TabsTrigger value="requests">Yêu cầu đổi lịch</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <CleaningSpreadsheetView events={events} cycles={cycles} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <SwapRequestManagement mode={mode} user={user || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
