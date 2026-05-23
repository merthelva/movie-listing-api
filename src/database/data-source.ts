import * as dotenv from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { MovieEntity } from '@movies/entity/movie.entity';
import { UserEntity } from '@users/entity/user.entity';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';

const envFile = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFile });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [UserEntity, MovieEntity, WatchlistEntity, FavoritelistEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
