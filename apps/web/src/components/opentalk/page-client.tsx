'use client';

import { OpentalkSpreadsheetView } from '@/components/opentalk/opentalk-spreadsheet-view';
import { SwapRequestManagement } from '@/components/opentalk/swap-request-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/shared/contexts/auth-context';
import { ScheduleCycle, UserRole } from '@qnoffice/shared';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface OpentalkPageClientProps {
  cycles: ScheduleCycle[];
  error?: string | null;
}

export function OpentalkPageClient({ cycles, error }: OpentalkPageClientProps) {
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
  const mode = user?.role === UserRole.STAFF ? 'user' : 'hr';

  return (
    <div className="space-y-6">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules">Schedule Management</TabsTrigger>
          <TabsTrigger value="requests">Swap Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <OpentalkSpreadsheetView cycles={cycles} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <SwapRequestManagement mode={mode} user={user || undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
