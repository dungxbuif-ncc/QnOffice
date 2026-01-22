'use client';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { GroupedOrder } from '@qnoffice/shared';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronDown, Clock, User } from 'lucide-react';
import { useState } from 'react';

interface OrdersPageClientProps {
  groupedOrders: GroupedOrder[];
}

export function OrdersPageClient({ groupedOrders }: OrdersPageClientProps) {
  const [openChannels, setOpenChannels] = useState<Set<string>>(
    new Set(groupedOrders.map((g) => g.channelId)),
  );
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());

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
                  {group.sessions.map((session, sessionIdx) => {
                    const sessionKey = `${group.channelId}-${sessionIdx}`;
                    const isSessionOpen = openSessions.has(sessionKey);

                    return (
                      <Collapsible
                        key={sessionKey}
                        open={isSessionOpen}
                        onOpenChange={() => toggleSession(sessionKey)}
                      >
                        <div className="rounded-lg border bg-background">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-3 hover:bg-accent"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <h3 className="text-sm font-medium text-muted-foreground">
                                  Nhóm đơn {sessionIdx + 1}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  ({session.orders.length} đơn)
                                </span>
                                {session.orders.length > 0 && (
                                  <>
                                    <span className="text-muted-foreground">
                                      •
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(
                                          session.orders[
                                            session.orders.length - 1
                                          ].createdAt,
                                        ),
                                        'HH:mm',
                                        { locale: vi },
                                      )}
                                      {' - '}
                                      {format(
                                        new Date(session.orders[0].createdAt),
                                        'HH:mm',
                                        { locale: vi },
                                      )}
                                    </span>
                                  </>
                                )}
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
                              {session.orders.map((order) => (
                                <div
                                  key={order.id}
                                  className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors"
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
                                            {
                                              locale: vi,
                                            },
                                          )
                                        : ''}
                                    </span>
                                  </div>
                                </div>
                              ))}
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
    </div>
  );
}
