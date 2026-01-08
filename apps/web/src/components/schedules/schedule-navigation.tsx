'use client';

import { cn } from '@/shared/utils';
import { Calendar, CalendarCheck, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const scheduleNavItems = [
  {
    title: 'Calendar View',
    href: '/dashboard/schedules/calendar',
    icon: Calendar,
    description: 'Visual calendar overview',
  },
  {
    title: 'Management',
    href: '/dashboard/schedules/management',
    icon: Users,
    description: 'Manage assignments by cycle',
  },
  {
    title: 'My Requests',
    href: '/dashboard/schedules/requests',
    icon: CalendarCheck,
    description: 'Submit swap or excuse requests',
  },
  {
    title: 'HR Approval',
    href: '/dashboard/schedules/approval',
    icon: UserCheck,
    description: 'Review pending requests',
  },
];

export function ScheduleNavigation() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {scheduleNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center p-6 rounded-lg border transition-colors hover:bg-accent',
              isActive ? 'bg-accent border-primary' : 'bg-card',
            )}
          >
            <Icon
              className={cn(
                'h-8 w-8 mb-2',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <h3
              className={cn(
                'font-semibold text-center',
                isActive ? 'text-primary' : 'text-foreground',
              )}
            >
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
