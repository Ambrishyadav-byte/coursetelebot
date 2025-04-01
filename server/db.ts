import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Initialize the database client with postgres.js
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
