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
import { PATHS } from '@/shared/constants/paths';
import { PERMISSIONS } from '@/shared/lib/auth';

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
    permission: PERMISSIONS.VIEW_BRANCHES,
  },
  {
    title: 'Staff Management',
    href: PATHS.DASHBOARD.STAFF,
    icon: '👥',
    permission: PERMISSIONS.VIEW_STAFF,
  },
  {
    title: 'Schedules',
    href: PATHS.DASHBOARD.SCHEDULES.BASE,
    icon: '📋',
    permission: PERMISSIONS.VIEW_SCHEDULES,
    items: [
      {
        title: 'Calendar',
        href: PATHS.DASHBOARD.CALENDAR,
        icon: '📅',
      },
      {
        title: 'Holidays',
        href: PATHS.DASHBOARD.HOLIDAYS,
        icon: '🎉',
        permission: PERMISSIONS.VIEW_HOLIDAYS,
      },
      {
        title: 'OpenTalk',
        href: PATHS.DASHBOARD.OPENTALK,
        icon: '🎤',
        permission: PERMISSIONS.VIEW_OPENTALK,
      },
      {
        title: 'Cleaning',
        href: PATHS.DASHBOARD.SCHEDULES.CLEANING,
        icon: '🧹',
        permission: PERMISSIONS.VIEW_SCHEDULES,
      },
    ],
  },
  {
    title: 'Penalties',
    icon: '⚠️',
    items: [
      {
        title: 'All Penalties',
        href: PATHS.DASHBOARD.PENALTIES,
        icon: '⚠️',
      },
      {
        title: 'Penalty Types',
        href: PATHS.DASHBOARD.MANAGE_PENALTIES,
        icon: '🛡️',
      },
    ],
  },
];

import { User } from '@/shared/lib/services/auth-service';

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
