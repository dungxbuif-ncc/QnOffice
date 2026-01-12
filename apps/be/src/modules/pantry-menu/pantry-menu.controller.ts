import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PantryMenuItem, UserRole } from '@qnoffice/shared';
import { Roles, RolesGuard } from '@src/common/gaurds/role.gaurd';
import { JwtAuthGuard } from '@src/modules/auth/guards/jwt-auth.guard';
import { CreatePantryMenuItemDto } from './dto/create-pantry-menu-item.dto';
import { UpdatePantryMenuItemDto } from './dto/update-pantry-menu-item.dto';
import { PantryMenuService } from './pantry-menu.service';

@Controller('pantry-menu')
@ApiTags('Pantry Menu')
export class PantryMenuController {
  constructor(private readonly pantryMenuService: PantryMenuService) {}

  @Get()
  async findAll(): Promise<PantryMenuItem[]> {
    return this.pantryMenuService.findAll() as any;
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<PantryMenuItem> {
    return this.pantryMenuService.findOne(id) as any;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR])
  async create(@Body() dto: CreatePantryMenuItemDto): Promise<PantryMenuItem> {
    return this.pantryMenuService.create(dto) as any;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR])
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePantryMenuItemDto,
  ): Promise<PantryMenuItem> {
    return this.pantryMenuService.update(id, dto) as any;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.HR])
  async remove(@Param('id') id: number): Promise<void> {
    return this.pantryMenuService.remove(id);
  }
}
