import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePantryMenuItems1768205846800
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pantry_menu_items',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'price',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['FOOD', 'DRINK'],
            default: "'FOOD'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Insert seed data from current menu
    // Order by creation (insertion order)
    await queryRunner.query(`
      INSERT INTO pantry_menu_items (name, price, category) VALUES
      -- Food items
      ('XÚC XÍCH, BENTO', '8K', 'FOOD'),
      ('BENTO NHỎ', '8K', 'FOOD'),
      ('CHOCOPIE, BÁNH BON GÀ', '4K', 'FOOD'),
      ('BÁNH OREO', '15K', 'FOOD'),
      ('SNACK CÁC VỊ, BÁNH KARO', '6K', 'FOOD'),
      ('SNACK LAY''S, OSTAR, POCA', '10K', 'FOOD'),
      ('KẸO GUM XYLITOL', '27K', 'FOOD'),
      ('BÁNH AFC LÚA MÌ', '15K', 'FOOD'),
      ('BÁNH PILLOWS', '12K', 'FOOD'),
      -- Drink items
      ('SỮA MEN', '5K', 'DRINK'),
      ('SỮA VINAMILK', '8K', 'DRINK'),
      ('MILO, RIVIVE, TRÀ OLONG', '8K', 'DRINK'),
      ('SỮA HẠT', '10K', 'DRINK'),
      ('SỮA CHUA', '7K', 'DRINK'),
      ('NƯỚC TÁO TH', '20K', 'DRINK'),
      ('RONG BIỂN', '6,5K', 'DRINK'),
      ('MÍT SẤY', '33K', 'DRINK'),
      ('XOÀI SẤY', '35K', 'DRINK');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pantry_menu_items');
  }
}
