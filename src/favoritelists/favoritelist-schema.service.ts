import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MovieEntity } from '@/movies/entity/movie.entity';
import { FavoritelistEntity } from './entity/favoritelist.entity';

@Injectable()
export class FavoritelistSchemaService implements OnModuleInit {
  private readonly logger = new Logger(FavoritelistSchemaService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i' AND c.relname = 'favoritelist_movies_unique_idx'
        ) THEN
          CREATE UNIQUE INDEX favoritelist_movies_unique_idx
          ON favoritelist_movies (favoritelist_id, movie_tmdb_id);
        END IF;
      END
      $$;`);

      const favoritelistMeta =
        this.dataSource.getMetadata(FavoritelistEntity);
      const movieMeta = this.dataSource.getMetadata(MovieEntity);
      const favoritelistTable = favoritelistMeta.tableName;
      const movieTable = movieMeta.tableName;
      const favoritelistPk = favoritelistMeta.primaryColumns[0].databaseName;
      const moviePk = movieMeta.primaryColumns[0].databaseName;

      const fkRows: Array<{ constraint_name: string }> =
        await this.dataSource.query(
          `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = $2`,
          ['favoritelist_movies', 'favoritelist_id'],
        );

      for (const { constraint_name } of fkRows) {
        await this.dataSource.query(
          `ALTER TABLE public.favoritelist_movies DROP CONSTRAINT IF EXISTS "${constraint_name}";`,
        );
      }

      await this.dataSource.query(
        `ALTER TABLE public.favoritelist_movies
         ADD CONSTRAINT favoritelist_movies_favoritelist_fk
         FOREIGN KEY (favoritelist_id) REFERENCES public."${favoritelistTable}"("${favoritelistPk}") ON DELETE CASCADE;`,
      );

      const movieFkRows: Array<{ constraint_name: string }> =
        await this.dataSource.query(
          `SELECT tc.constraint_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = $2`,
          ['favoritelist_movies', 'movie_tmdb_id'],
        );

      for (const { constraint_name } of movieFkRows) {
        await this.dataSource.query(
          `ALTER TABLE public.favoritelist_movies DROP CONSTRAINT IF EXISTS "${constraint_name}";`,
        );
      }

      await this.dataSource.query(
        `ALTER TABLE public.favoritelist_movies
         ADD CONSTRAINT favoritelist_movies_movie_fk
         FOREIGN KEY (movie_tmdb_id) REFERENCES public."${movieTable}"("${moviePk}");`,
      );

      this.logger.log(
        'Ensured unique index and FK constraints for favoritelist_movies',
      );
    } catch (err) {
      this.logger.error(
        'Failed to ensure unique index / FK constraints for favoritelist_movies',
        err,
      );
    }
  }
}
