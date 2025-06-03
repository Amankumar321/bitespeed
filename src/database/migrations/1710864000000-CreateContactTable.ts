import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateContactTable1710864000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for link_precedence
        await queryRunner.query(`
            CREATE TYPE link_precedence_enum AS ENUM ('primary', 'secondary')
        `);

        await queryRunner.createTable(
            new Table({
                name: "contact",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "phone_number",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "linked_id",
                        type: "int",
                        isNullable: true
                    },
                    {
                        name: "link_precedence",
                        type: "link_precedence_enum",
                        default: "'primary'"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ],
                foreignKeys: [
                    {
                        columnNames: ["linked_id"],
                        referencedTableName: "contact",
                        referencedColumnNames: ["id"],
                        onDelete: "SET NULL"
                    }
                ],
                indices: [
                    {
                        name: "idx_contact_email",
                        columnNames: ["email"]
                    },
                    {
                        name: "idx_contact_phone",
                        columnNames: ["phone_number"]
                    },
                    {
                        name: "idx_contact_linked_id",
                        columnNames: ["linked_id"]
                    }
                ]
            }),
            true
        );

        // Add trigger for updated_at
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_contact_updated_at
                BEFORE UPDATE ON contact
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop trigger and function
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_contact_updated_at ON contact`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);

        // Drop table
        await queryRunner.dropTable("contact");

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS link_precedence_enum`);
    }
} 