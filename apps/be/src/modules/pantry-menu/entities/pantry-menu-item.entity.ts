import { PantryMenuCategory } from '@qnoffice/shared';
import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/database/abstract.entity';

@Entity('pantry_menu_items')
export class PantryMenuItemEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  price!: string;

  @Column({
    type: 'enum',
    enum: PantryMenuCategory,
    default: PantryMenuCategory.FOOD,
  })
  category!: PantryMenuCategory;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
