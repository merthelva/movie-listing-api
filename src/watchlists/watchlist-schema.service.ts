import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WatchlistEntity } from './entity/watchlist.entity';
import { MovieEntity } from '@movies/entity/movie.entity';

@Injectable()
export class WatchlistSchemaService implements OnModuleInit {
  private readonly logger = new Logger(WatchlistSchemaService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      // Create a unique index on the explicit join table to prevent duplicate pairs.
      await this.dataSource.query(`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i' AND c.relname = 'watchlist_movies_unique_idx'
        ) THEN
          CREATE UNIQUE INDEX watchlist_movies_unique_idx
          ON watchlist_movies (watchlist_id, movie_tmdb_id);
        END IF;
      END
      $$;`);

      // Ensure foreign key on watchlist_id uses ON DELETE CASCADE to clean up join rows.
      const watchlistMeta = this.dataSource.getMetadata(WatchlistEntity);
      const movieMeta = this.dataSource.getMetadata(MovieEntity);
      const watchlistTable = watchlistMeta.tableName;
      const movieTable = movieMeta.tableName;
      const watchlistPk = watchlistMeta.primaryColumns[0].databaseName;
      const moviePk = movieMeta.primaryColumns[0].databaseName;

      // Find any existing FK constraints on the join table for the watchlist_id column and drop them.
      const fkRows: Array<{ constraint_name: string }> =
        await this.dataSource.query(
          `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = $2`,
          ['watchlist_movies', 'watchlist_id'],
        );

      for (const { constraint_name } of fkRows) {
        await this.dataSource.query(
          `ALTER TABLE public.watchlist_movies DROP CONSTRAINT IF EXISTS "${constraint_name}";`,
        );
      }

      // Recreate FK with ON DELETE CASCADE (if not already present).
      await this.dataSource.query(
        `ALTER TABLE public.watchlist_movies
         ADD CONSTRAINT watchlist_movies_watchlist_fk
         FOREIGN KEY (watchlist_id) REFERENCES public."${watchlistTable}"("${watchlistPk}") ON DELETE CASCADE;`,
      );

      // Ensure movie FK exists (non-cascading) — drop and recreate to be safe.
      const movieFkRows: Array<{ constraint_name: string }> =
        await this.dataSource.query(
          `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = $2`,
          ['watchlist_movies', 'movie_tmdb_id'],
        );

      for (const { constraint_name } of movieFkRows) {
        await this.dataSource.query(
          `ALTER TABLE public.watchlist_movies DROP CONSTRAINT IF EXISTS "${constraint_name}";`,
        );
      }

      await this.dataSource.query(
        `ALTER TABLE public.watchlist_movies
         ADD CONSTRAINT watchlist_movies_movie_fk
         FOREIGN KEY (movie_tmdb_id) REFERENCES public."${movieTable}"("${moviePk}");`,
      );

      this.logger.log(
        'Ensured unique index and FK constraints for watchlist_movies',
      );
    } catch (err) {
      this.logger.error(
        'Failed to ensure unique index / FK constraints for watchlist_movies',
        err,
      );
    }
  }
}
