import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { DB_ENTITIES } from './constants/db-entities.constant';
import { DB_MIGRATIONS } from './constants/db-migrations.constant';

// Load environment-specific .env file. Defaults to 'development' if NODE_ENV not set.
// For production migrations, explicitly set: NODE_ENV=production pnpm migration:run
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
dotenv.config({ path: envFile });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: DB_ENTITIES,
  migrations: DB_MIGRATIONS,
  synchronize: false,
});
