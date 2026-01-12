import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePantryMenuItemDto } from './create-pantry-menu-item.dto';

export class UpdatePantryMenuItemDto extends PartialType(
  CreatePantryMenuItemDto,
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
