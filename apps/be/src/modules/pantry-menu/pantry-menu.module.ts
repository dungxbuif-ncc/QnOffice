import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PantryMenuItemEntity } from './entities/pantry-menu-item.entity';
import { PantryMenuController } from './pantry-menu.controller';
import { PantryMenuService } from './pantry-menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([PantryMenuItemEntity])],
  controllers: [PantryMenuController],
  providers: [PantryMenuService],
  exports: [PantryMenuService],
})
export class PantryMenuModule {}
