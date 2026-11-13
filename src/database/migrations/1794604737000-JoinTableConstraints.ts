import { MigrationInterface, QueryRunner } from 'typeorm';

// Replaces the runtime schema patching that FavoritelistSchemaService and
// WatchlistSchemaService used to run on every boot. After this migration all
// environments converge on the schema the entities describe:
//   - list FK  : ON DELETE CASCADE  ON UPDATE CASCADE
//   - movie FK : ON DELETE NO ACTION ON UPDATE NO ACTION
//   - no extra *_unique_idx (the composite primary key already enforces it)
//
// up() is idempotent: it works whether or not the runtime patch ever ran
// (production did run it, a fresh database did not), so it drops BOTH possible
// constraint names before re-adding the canonical ones.
export class JoinTableConstraints1794604737000 implements MigrationInterface {
  name = 'JoinTableConstraints1794604737000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "favoritelist_movies_unique_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "watchlist_movies_unique_idx"`,
    );

    // favoritelist_movies
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" DROP CONSTRAINT IF EXISTS "FK_ed4accc8a51741d87478648f878"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" DROP CONSTRAINT IF EXISTS "favoritelist_movies_favoritelist_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" DROP CONSTRAINT IF EXISTS "FK_7825bc68eaebfd2381fb27564b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" DROP CONSTRAINT IF EXISTS "favoritelist_movies_movie_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" ADD CONSTRAINT "FK_ed4accc8a51741d87478648f878" FOREIGN KEY ("favoritelist_id") REFERENCES "favoritelist_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" ADD CONSTRAINT "FK_7825bc68eaebfd2381fb27564b0" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // watchlist_movies
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" DROP CONSTRAINT IF EXISTS "FK_7f7e9053be5ffa41e3a419ca902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" DROP CONSTRAINT IF EXISTS "watchlist_movies_watchlist_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" DROP CONSTRAINT IF EXISTS "FK_274887fadb0180295a9fb56fb5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" DROP CONSTRAINT IF EXISTS "watchlist_movies_movie_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" ADD CONSTRAINT "FK_7f7e9053be5ffa41e3a419ca902" FOREIGN KEY ("watchlist_id") REFERENCES "watchlist_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" ADD CONSTRAINT "FK_274887fadb0180295a9fb56fb5d" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  // Back to the InitialSchema state (movie FK cascades). The redundant
  // *_unique_idx indexes are intentionally not recreated.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" DROP CONSTRAINT "FK_274887fadb0180295a9fb56fb5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "watchlist_movies" ADD CONSTRAINT "FK_274887fadb0180295a9fb56fb5d" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" DROP CONSTRAINT "FK_7825bc68eaebfd2381fb27564b0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favoritelist_movies" ADD CONSTRAINT "FK_7825bc68eaebfd2381fb27564b0" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
