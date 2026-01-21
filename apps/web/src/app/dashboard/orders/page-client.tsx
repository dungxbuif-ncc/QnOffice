'use client';

import { GroupedOrder } from '@qnoffice/shared';
import { format } from 'date-fns';

interface OrdersPageClientProps {
  groupedOrders: GroupedOrder[];
}

export function OrdersPageClient({ groupedOrders }: OrdersPageClientProps) {
  return (
    <div className="grid gap-6">
      {groupedOrders.map((group) => (
        <div key={group.channelId} className="space-y-4">
          <h2 className="text-xl font-semibold">Channel: {group.channelId}</h2>
          <div className="space-y-4">
            {group.sessions.map((session, sessionIdx) => (
              <div
                key={sessionIdx}
                className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm"
              >
                <h3 className="font-medium mb-2">Session {sessionIdx + 1}</h3>
                <div className="space-y-2">
                  {session.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex flex-col">
                         <span className='font-semibold'>{order.user?.name || order.userMezonId}</span>
                         <span>{order.content}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'HH:mm:ss') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {groupedOrders.length === 0 && (
        <p className="text-muted-foreground">No orders found.</p>
      )}
    </div>
  );
}
