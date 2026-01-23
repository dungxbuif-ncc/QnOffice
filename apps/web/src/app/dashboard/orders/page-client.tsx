'use client';

import { ActionPanel } from '@/components/ui/action-panel';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/shared/contexts/auth-context';
import { GroupedOrder } from '@qnoffice/shared';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar,
  ChevronDown,
  Clock,
  Receipt,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface OrdersPageClientProps {
  groupedOrders: GroupedOrder[];
}

export function OrdersPageClient({ groupedOrders }: OrdersPageClientProps) {
  const { user } = useAuth();
  const [openChannels, setOpenChannels] = useState<Set<string>>(
    new Set(groupedOrders.map((g) => g.channelId)),
  );
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);

  const toggleChannel = (channelId: string) => {
    setOpenChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const toggleSession = (sessionKey: string) => {
    setOpenSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionKey)) {
        next.delete(sessionKey);
      } else {
        next.add(sessionKey);
      }
      return next;
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleRemoveOrders = async () => {
    setIsRemoving(true);
    try {
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Failed to remove orders:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
  };

  return (
    <div className="space-y-4">
      {groupedOrders.map((group) => {
        const isChannelOpen = openChannels.has(group.channelId);

        return (
          <Collapsible
            key={group.channelId}
            open={isChannelOpen}
            onOpenChange={() => toggleChannel(group.channelId)}
          >
            <div className="rounded-lg border bg-card shadow-sm">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      Channel Đặt Cơm
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      (
                      {group.sessions.reduce(
                        (acc, s) => acc + s.orders.length,
                        0,
                      )}{' '}
                      đơn)
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isChannelOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-3 p-4 pt-0">
                  {/* Combined Unbilled Group */}
                  {(() => {
                    const unbilledSessions = group.sessions.filter(
                      (s) => !s.billingId,
                    );
                    const allUnbilledOrders = unbilledSessions
                      .flatMap((s) => s.orders)
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      );
                    const unbilledDates = Array.from(
                      new Set(
                        allUnbilledOrders.map((o) =>
                          format(new Date(o.createdAt), 'dd/MM/yyyy'),
                        ),
                      ),
                    );
                    const unbilledDateLabel = unbilledDates.join(', ');

                    if (allUnbilledOrders.length === 0) return null;

                    const unbilledKey = `unbilled-${group.channelId}`;
                    const isUnbilledOpen = openSessions.has(unbilledKey);

                    return (
                      <Collapsible
                        key={unbilledKey}
                        open={isUnbilledOpen}
                        onOpenChange={() => toggleSession(unbilledKey)}
                      >
                        <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/40"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                  Đơn lẻ chưa thanh toán (
                                  {allUnbilledOrders.length} đơn)
                                  {unbilledDateLabel && (
                                    <span className="opacity-80 font-normal text-xs ml-1">
                                      • {unbilledDateLabel}
                                    </span>
                                  )}
                                </h3>
                              </div>
                              <ChevronDown
                                className={`h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform ${isUnbilledOpen ? 'rotate-180' : ''}`}
                              />
                            </Button>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="flex flex-wrap gap-2 p-3 pt-0">
                              {allUnbilledOrders.map((order) => {
                                return (
                                  <div
                                    key={order.id}
                                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition-colors bg-background border-amber-200 dark:border-amber-800"
                                  >
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <User className="h-3.5 w-3.5" />
                                      <span className="font-medium text-foreground">
                                        {order.user?.name || order.userMezonId}
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-foreground">
                                      {order.content}
                                    </span>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-xs">
                                        {order.createdAt
                                          ? format(
                                              new Date(order.createdAt),
                                              'HH:mm',
                                              { locale: vi },
                                            )
                                          : ''}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })()}

                  {/* Billed Sessions */}
                  {group.sessions
                    .filter((s) => !!s.billingId)
                    .map((session, sessionIdx) => {
                      const sessionKey = `${group.channelId}-${session.billingId}-${sessionIdx}`;
                      const isSessionOpen = openSessions.has(sessionKey);
                      const sortedOrders = [...session.orders].sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      );

                      return (
                        <Collapsible
                          key={sessionKey}
                          open={isSessionOpen}
                          onOpenChange={() => toggleSession(sessionKey)}
                        >
                          <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-3 hover:bg-accent"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <>
                                    <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                      Billing
                                    </h3>

                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800">
                                      <User className="h-3 w-3 text-blue-700 dark:text-blue-300" />
                                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                        Chủ bill: {session.billingOwner}
                                      </span>
                                    </div>

                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {session.orders.length} đơn
                                    </span>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {session.billingDate
                                          ? format(
                                              new Date(session.billingDate),
                                              'dd/MM/yyyy',
                                              { locale: vi },
                                            )
                                          : ''}
                                      </span>
                                    </div>
                                  </>
                                </div>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    isSessionOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="flex flex-wrap gap-2 p-3 pt-0">
                                {sortedOrders.map((order) => {
                                  const isOwner =
                                    user?.mezonId === session.billingOwner;
                                  const isSelected = selectedOrders.has(
                                    order.id,
                                  );

                                  return (
                                    <div
                                      key={order.id}
                                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition-colors ${
                                        isSelected
                                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                                          : 'bg-card hover:bg-accent'
                                      }`}
                                    >
                                      {isOwner && (
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            toggleOrderSelection(order.id)
                                          }
                                          className="h-4 w-4"
                                        />
                                      )}
                                      <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        <span className="font-medium text-foreground">
                                          {order.user?.name ||
                                            order.userMezonId}
                                        </span>
                                      </div>
                                      <span className="text-muted-foreground">
                                        •
                                      </span>
                                      <span className="text-foreground">
                                        {order.content}
                                      </span>
                                      <span className="text-muted-foreground">
                                        •
                                      </span>
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-xs">
                                          {order.createdAt
                                            ? format(
                                                new Date(order.createdAt),
                                                'HH:mm',
                                                {
                                                  locale: vi,
                                                },
                                              )
                                            : ''}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
      {groupedOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy đơn hàng nào.</p>
        </div>
      )}

      {/* Action Panel for selected orders */}
      <ActionPanel
        open={selectedOrders.size > 0}
        onClose={clearSelection}
        icon={<Trash2 className="h-5 w-5" />}
        title={`Đã chọn ${selectedOrders.size} đơn hàng`}
        description="Bạn có thể xóa các đơn hàng đã chọn khỏi billing"
        variant="warning"
        primaryAction={{
          label: 'Xóa khỏi billing',
          onClick: handleRemoveOrders,
          loading: isRemoving,
          variant: 'destructive',
        }}
        secondaryAction={{
          label: 'Hủy',
          onClick: clearSelection,
          variant: 'outline',
        }}
      />
    </div>
  );
}
