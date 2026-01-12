export enum PantryMenuCategory {
  FOOD = 'FOOD',
  DRINK = 'DRINK',
}

export interface PantryMenuItem {
  id: number;
  name: string;
  price: string;
  category: PantryMenuCategory;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICreatePantryMenuItemDto {
  name: string;
  price: string;
  category: PantryMenuCategory;
}

export interface IUpdatePantryMenuItemDto {
  name?: string;
  price?: string;
  category?: PantryMenuCategory;
  isActive?: boolean;
}
