import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStaffRelations1768381726912 implements MigrationInterface {
    name = 'UpdateStaffRelations1768381726912'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "penalties" RENAME COLUMN "user_id" TO "staff_id"`);
        await queryRunner.query(`ALTER TABLE "penalties" ADD CONSTRAINT "FK_4d3c4677f0876e21b790544b6ba" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "penalties" DROP CONSTRAINT "FK_4d3c4677f0876e21b790544b6ba"`);
        await queryRunner.query(`ALTER TABLE "penalties" RENAME COLUMN "staff_id" TO "user_id"`);
    }

}
