import { PantryMenuCategory } from '@qnoffice/shared';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class CreatePantryMenuItemDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(20)
  price!: string;

  @IsEnum(PantryMenuCategory)
  category!: PantryMenuCategory;
}
