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

const navigationData = [
  {
    title: 'Dashboard',
    href: PATHS.DASHBOARD.BASE,
    icon: '📊',
  },
  {
    title: 'Branches',
    href: PATHS.DASHBOARD.BRANCHES,
    icon: '🏢',
  },
  {
    title: 'Staff Management',
    href: PATHS.DASHBOARD.STAFF,
    icon: '👥',
  },
  {
    title: 'Schedules',
    href: PATHS.DASHBOARD.SCHEDULES.BASE,
    icon: '📅',
    items: [
      {
        title: 'Cleaning Schedule',
        href: PATHS.DASHBOARD.SCHEDULES.CLEANING,
      },
      {
        title: 'Open Talk Schedule',
        href: PATHS.DASHBOARD.SCHEDULES.OPEN_TALK,
      },
      {
        title: 'Holiday Schedule',
        href: PATHS.DASHBOARD.SCHEDULES.HOLIDAY,
      },
    ],
  },
  {
    title: 'Reports',
    href: PATHS.DASHBOARD.REPORTS,
    icon: '📄',
  },
  {
    title: 'Settings',
    href: PATHS.DASHBOARD.SETTINGS,
    icon: '⚙️',
  },
];

import { PATHS } from '@/constants/paths';
import { User } from '@/lib/services/auth-service';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User | null;
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
        {user && onLogout && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
