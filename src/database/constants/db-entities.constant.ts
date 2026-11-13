import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { MovieEntity } from '@movies/entity/movie.entity';
import { UserEntity } from '@users/entity/user.entity';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';

// Single source of truth for the app (app.module.ts) and the TypeORM CLI
// (data-source.ts). A new entity must be added here only.
export const DB_ENTITIES = [
  UserEntity,
  WatchlistEntity,
  MovieEntity,
  FavoritelistEntity,
];
