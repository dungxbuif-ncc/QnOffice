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
import { PERMISSIONS } from '@/shared/auth';
import { PATHS } from '@/shared/constants/paths';
import { UserAuth } from '@qnoffice/shared';

const navigationData = [
  {
    title: 'Bảng điều khiển',
    href: PATHS.DASHBOARD.BASE,
    icon: '📊',
  },
  {
    title: 'Menu Pantry',
    href: PATHS.DASHBOARD.PANTRY_MENU,
    icon: '🍽️',
  },
  {
    title: 'Giao dịch Pantry',
    href: PATHS.DASHBOARD.PANTRY_TRANSACTIONS,
    icon: '💰',
  },
  // {
  //   title: 'Chi nhánh',
  //   href: PATHS.DASHBOARD.BRANCHES,
  //   icon: '🏢',
  //   permission: PERMISSIONS.VIEW_BRANCHES,
  // },
  {
    title: 'Quản lý nhân sự',
    href: PATHS.DASHBOARD.STAFF,
    icon: '👥',
    permission: PERMISSIONS.VIEW_STAFF,
  },
  {
    title: 'Lên lịch',
    href: PATHS.DASHBOARD.SCHEDULES.BASE,
    icon: '📋',
    permission: PERMISSIONS.VIEW_SCHEDULES,
    items: [
      {
        title: 'Lịch',
        href: PATHS.DASHBOARD.CALENDAR,
        icon: '📅',
      },
      {
        title: 'Ngày nghỉ',
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
        title: 'Trực nhật',
        href: PATHS.DASHBOARD.SCHEDULES.CLEANING,
        icon: '🧹',
        permission: PERMISSIONS.VIEW_SCHEDULES,
      },
    ],
  },
  {
    title: 'Phạt',
    icon: '⚠️',
    items: [
      {
        title: 'Tất cả vi phạm',
        href: PATHS.DASHBOARD.PENALTIES,
        icon: '⚠️',
      },
      {
        title: 'Loại phạt',
        href: PATHS.DASHBOARD.MANAGE_PENALTIES,
        icon: '🛡️',
      },
    ],
  },
  {
    title: 'Quản lý',
    icon: '⚙️',
    permission: PERMISSIONS.MANAGE_OPENTALK,
    items: [
      {
        title: 'Slide OpenTalk',
        href: PATHS.DASHBOARD.MANAGEMENT.OPENTALK_SLIDES,
        icon: '📊',
        permission: PERMISSIONS.APPROVE_OPENTALK_SLIDES,
      },
      {
        title: 'Đổi lịch OpenTalk',
        href: PATHS.DASHBOARD.MANAGEMENT.OPENTALK_SWAPS,
        icon: '🔄',
        permission: PERMISSIONS.MANAGE_OPENTALK_SWAP_REQUESTS,
      },
      {
        title: 'Đổi lịch dọn dẹp',
        href: PATHS.DASHBOARD.MANAGEMENT.CLEANING_SWAPS,
        icon: '🧹',
        permission: PERMISSIONS.MANAGE_CLEANING_SWAP_REQUESTS,
      },
      {
        title: 'Quản lý kênh',
        href: PATHS.DASHBOARD.CHANNELS,
        icon: '📢',
        permission: PERMISSIONS.MANAGE_CHANNELS,
      },
    ],
  },
  {
    title: 'Nhật ký hệ thống',
    href: PATHS.DASHBOARD.AUDIT_LOGS,
    icon: '📋',
  },
  {
    title: 'Order',
    href: PATHS.DASHBOARD.ORDERS,
    icon: '🛒',
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserAuth | null;
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
