import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  server: {
    port: number;
    nodeEnv: string;
    isProduction: boolean;
  };
  api: {
    url: string;
    supportEmail: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    testDatabase: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
  api: {
    url: process.env.API_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://api.example.com' 
      : `http://localhost:${process.env.PORT || '3000'}`),
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'customer_identity_db',
    testDatabase: process.env.TEST_DB_NAME || 'customer_identity_test_db',
  },
};

export default config; 