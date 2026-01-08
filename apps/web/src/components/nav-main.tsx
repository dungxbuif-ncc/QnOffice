'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Permission, ProtectedComponent } from '@/shared/auth';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    href?: string;
    icon?: string;
    isActive?: boolean;
    permission?: Permission;
    items?: {
      title: string;
      href: string;
      permission?: Permission;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.href;
          const hasSubItems = item.items && item.items.length > 0;

          return (
            <ProtectedComponent key={item.title} permission={item.permission}>
              {hasSubItems ? (
                // Multi-level item with collapsible functionality
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <ProtectedComponent
                            key={subItem.title}
                            permission={subItem.permission}
                          >
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </ProtectedComponent>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                // Single-level item
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.href || '#'}>
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </ProtectedComponent>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
