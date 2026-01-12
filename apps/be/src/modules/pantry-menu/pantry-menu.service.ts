import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePantryMenuItemDto } from './dto/create-pantry-menu-item.dto';
import { UpdatePantryMenuItemDto } from './dto/update-pantry-menu-item.dto';
import { PantryMenuItemEntity } from './entities/pantry-menu-item.entity';

@Injectable()
export class PantryMenuService {
  constructor(
    @InjectRepository(PantryMenuItemEntity)
    private readonly pantryMenuRepository: Repository<PantryMenuItemEntity>,
  ) {}

  async findAll(): Promise<PantryMenuItemEntity[]> {
    return this.pantryMenuRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PantryMenuItemEntity> {
    const item = await this.pantryMenuRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Pantry menu item with ID ${id} not found`);
    }
    return item;
  }

  async create(dto: CreatePantryMenuItemDto): Promise<PantryMenuItemEntity> {
    const item = this.pantryMenuRepository.create(dto);
    return this.pantryMenuRepository.save(item);
  }

  async update(
    id: number,
    dto: UpdatePantryMenuItemDto,
  ): Promise<PantryMenuItemEntity> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.pantryMenuRepository.save(item);
  }

  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    item.isActive = false;
    await this.pantryMenuRepository.save(item);
  }
}
