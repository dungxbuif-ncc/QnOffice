import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserIdToStaffIdInPenalties1736845539000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename column user_id to staff_id
    await queryRunner.query(
      `ALTER TABLE "penalties" RENAME COLUMN "user_id" TO "staff_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: rename staff_id back to user_id
    await queryRunner.query(
      `ALTER TABLE "penalties" RENAME COLUMN "staff_id" TO "user_id"`,
    );
  }
}
