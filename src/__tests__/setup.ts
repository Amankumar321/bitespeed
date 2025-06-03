import { DataSource } from 'typeorm';
import { Contact } from '../entity/Contact';
import { AppDataSource } from '../database/data-source';

export let testDataSource: DataSource;

beforeAll(async () => {
  try {
    // First create a connection to the default database to create our test database
    const tempDataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: "postgres", // Connect to default database first
    });

    await tempDataSource.initialize();
    console.log('Connected to default database');

    // Drop and recreate the test database
    const testDbName = process.env.TEST_DB_NAME || 'customer_identity_test_db';
    
    // Terminate all connections to the test database
    await tempDataSource.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${testDbName}'
      AND pid <> pg_backend_pid();
    `);
    
    await tempDataSource.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    await tempDataSource.query(`CREATE DATABASE ${testDbName}`);
    await tempDataSource.destroy();
    console.log('Created test database');

    // Now create the actual test database connection
    testDataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: testDbName,
      entities: [Contact],
      logging: false
    });

    await testDataSource.initialize();
    console.log('Connected to test database');

    // Create enum type
    await testDataSource.query(`
      DO $$ BEGIN
        CREATE TYPE link_precedence_enum AS ENUM ('primary', 'secondary');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Created enum type');

    // Create the contact table
    await testDataSource.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR NULL,
        email VARCHAR NULL,
        linked_id INT NULL REFERENCES contact(id) ON DELETE SET NULL,
        link_precedence link_precedence_enum DEFAULT 'primary',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      )
    `);
    console.log('Created contact table');

    // Create indices if they don't exist
    await testDataSource.query(`
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS idx_contact_email ON contact(email);
        CREATE INDEX IF NOT EXISTS idx_contact_phone ON contact(phone_number);
        CREATE INDEX IF NOT EXISTS idx_contact_linked_id ON contact(linked_id);
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Created indices');

    // Create updated_at trigger
    await testDataSource.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await testDataSource.query(`
      DROP TRIGGER IF EXISTS update_contact_updated_at ON contact;
      CREATE TRIGGER update_contact_updated_at
      BEFORE UPDATE ON contact
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('Created trigger');
    
    // Replace the main AppDataSource with testDataSource during tests
    Object.assign(AppDataSource, testDataSource);
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}, 30000); // 30 second timeout

afterAll(async () => {
  try {
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.destroy();
      console.log('Test database connection closed');

      // Connect to default database to clean up
      const tempDataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: "postgres",
      });

      await tempDataSource.initialize();
      
      // Drop the test database
      const testDbName = process.env.TEST_DB_NAME || 'customer_identity_test_db';
      await tempDataSource.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${testDbName}'
        AND pid <> pg_backend_pid();
      `);
      await tempDataSource.query(`DROP DATABASE IF EXISTS ${testDbName}`);
      await tempDataSource.destroy();
      console.log('Test database cleaned up');
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    // Clear all tables before each test
    await testDataSource.query('TRUNCATE TABLE contact CASCADE');
    console.log('Cleared contact table');
  } catch (error) {
    console.error('Error clearing contact table:', error);
    throw error;
  }
}); 