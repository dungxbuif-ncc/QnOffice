'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    name: 'Branches',
    href: '/dashboard/branches',
    icon: '🏢',
  },
  {
    name: 'Staff Management',
    href: '/dashboard/staff',
    icon: '👥',
  },
  {
    name: 'Schedules',
    href: '/dashboard/schedules',
    icon: '📅',
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: '📄',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: '⚙️',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-sm border-r">
      <div className="flex flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h2 className="text-lg font-semibold text-gray-900">QN Management</h2>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                          isActive
                            ? 'bg-gray-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                        )}
                      >
                        <span
                          className={cn(
                            'text-xl shrink-0',
                            isActive
                              ? 'text-blue-600'
                              : 'text-gray-400 group-hover:text-blue-600',
                          )}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
