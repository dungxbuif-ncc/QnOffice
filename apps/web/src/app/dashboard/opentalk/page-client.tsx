'use client';

import { OpentalkSpreadsheetView } from '@/components/opentalk/opentalk-spreadsheet-view';
import { SwapRequestManagement } from '@/components/opentalk/swap-request-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/contexts/auth-context';
import { ScheduleCycle } from '@qnoffice/shared';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface OpentalkPageClientProps {
  cycles: ScheduleCycle[];
  error?: string | null;
}

export function OpentalkPageClient({ cycles, error }: OpentalkPageClientProps) {
  const { user } = useAuth();

  const canApproveRequests = hasPermission(
    user?.role,
    PERMISSIONS.APPROVE_OPENTALK_SWAP_REQUESTS,
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const events = cycles.flatMap((cycle) => cycle.events || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          OpenTalk Management
        </h1>
        <div className="text-sm text-muted-foreground">
          {events.length} events • {cycles.length} cycles
        </div>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedules">Schedule Management</TabsTrigger>
          <TabsTrigger value="requests">Swap Requests</TabsTrigger>
          {canApproveRequests && (
            <TabsTrigger value="approval">GDVP Approval</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <OpentalkSpreadsheetView
            events={events}
            cycles={cycles}
            user={user || undefined}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <SwapRequestManagement mode="user" user={user || undefined} />
        </TabsContent>

        {canApproveRequests && (
          <TabsContent value="approval" className="space-y-4">
            <SwapRequestManagement mode="hr" user={user} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
