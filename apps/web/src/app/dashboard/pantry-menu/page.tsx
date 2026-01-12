import PantryMenuView from '@/components/features/pantry-menu/pantry-menu-view';
import { pantryMenuServerService } from '@/shared/services/server/pantry-menu-server.service';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pantry Menu | NCC QN',
  description: 'View and manage pantry menu items',
};

// Force dynamic because we fetch data from API
export const dynamic = 'force-dynamic';

export default async function PantryMenuPage() {
  const menuItems = await pantryMenuServerService.getAll();

  return <PantryMenuView initialData={menuItems} />;
}
