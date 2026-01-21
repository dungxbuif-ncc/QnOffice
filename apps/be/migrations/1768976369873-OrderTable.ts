import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderTable1768976369873 implements MigrationInterface {
    name = 'OrderTable1768976369873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "orders" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" integer, "updated_by" integer, "id" SERIAL NOT NULL, "user_mezon_id" character varying(255) NOT NULL, "content" character varying NOT NULL, "message_id" character varying(255) NOT NULL, "channel_id" character varying(255), "date" date NOT NULL, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_62ce2785d317c6a30437cb8759f" FOREIGN KEY ("user_mezon_id") REFERENCES "users"("mezon_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_62ce2785d317c6a30437cb8759f"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}
