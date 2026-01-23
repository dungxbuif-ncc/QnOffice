import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateBillingAndOrder1769111756095 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop tables if they exist
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billings" CASCADE`);

    // Create Billings table
    await queryRunner.query(`
            CREATE TABLE "billings" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" integer,
                "updated_by" integer,
                "user_mezon_id" character varying(255) NOT NULL,
                "channel_id" character varying(255) NOT NULL,
                "date" date NOT NULL,
                CONSTRAINT "PK_billings_id" PRIMARY KEY ("id")
            )
        `);

    // Create Orders table
    await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "created_by" integer,
                "updated_by" integer,
                "user_mezon_id" character varying(255) NOT NULL,
                "content" character varying NOT NULL,
                "message_id" character varying(255) NOT NULL,
                "channel_id" character varying(255),
                "date" date NOT NULL,
                "billing_id" integer,
                "is_paid" boolean NOT NULL DEFAULT false,
                "amount" integer,
                CONSTRAINT "PK_orders_id" PRIMARY KEY ("id")
            )
        `);

    // Add Foreign Keys
    // billings -> users
    await queryRunner.query(`
            ALTER TABLE "billings" 
            ADD CONSTRAINT "FK_billings_users_user_mezon_id" 
            FOREIGN KEY ("user_mezon_id") REFERENCES "users"("mezon_id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    // orders -> users
    await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD CONSTRAINT "FK_orders_users_user_mezon_id" 
            FOREIGN KEY ("user_mezon_id") REFERENCES "users"("mezon_id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    // orders -> billings
    await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD CONSTRAINT "FK_orders_billings_billing_id" 
            FOREIGN KEY ("billing_id") REFERENCES "billings"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billings" CASCADE`);
  }
}
