'use client';

import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// Navigation data matching your existing navigation structure
const navigationData = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    title: 'Branches',
    href: '/dashboard/branches',
    icon: '🏢',
  },
  {
    title: 'Staff Management',
    href: '/dashboard/staff',
    icon: '👥',
  },
  {
    title: 'Schedules',
    href: '/dashboard/schedules',
    icon: '📅',
    items: [
      {
        title: 'Cleaning Schedule',
        href: '/dashboard/schedules/cleaning',
      },
      {
        title: 'Open Talk Schedule',
        href: '/dashboard/schedules/open-talk',
      },
      {
        title: 'Holiday Schedule',
        href: '/dashboard/schedules/holiday',
      },
    ],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: '📄',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: '⚙️',
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    username: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export function AppSidebar({ user, onLogout, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData} />
      </SidebarContent>
      <SidebarFooter>
        {user && onLogout && (
          <NavUser
            user={{
              name: 'Dungx Buif',
              email: 'dung.buihuu@ncc.asia',
              avatar: 'https://avatars.githubusercontent.com/u/5072455?v=4',
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
