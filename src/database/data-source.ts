import "reflect-metadata";
import { DataSource } from "typeorm";
import { Contact } from "../entity/Contact";
import { CreateContactTable1710864000000 } from "./migrations/1710864000000-CreateContactTable";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "customer_identity_db",
    synchronize: false, // Set to false in production
    logging: true,
    entities: [Contact],
    migrations: [CreateContactTable1710864000000],
    subscribers: [],
}); 