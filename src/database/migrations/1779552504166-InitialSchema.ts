import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1779552504166 implements MigrationInterface {
    name = 'InitialSchema1779552504166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "movie_entity" ("tmdbId" integer NOT NULL, "title" character varying NOT NULL, "overview" character varying NOT NULL, "posterPath" character varying, "releaseDate" character varying NOT NULL, "voteAverage" double precision NOT NULL, "voteCount" integer NOT NULL, "budget" bigint NOT NULL, "revenue" bigint NOT NULL, "runtime" integer, "genres" text array NOT NULL DEFAULT '{}', CONSTRAINT "PK_ff83390881d0628284465073cee" PRIMARY KEY ("tmdbId"))`);
        await queryRunner.query(`CREATE TABLE "user_entity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'user', "tokenVersion" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_415c35b9b3b6fe45a3b065030f5" UNIQUE ("email"), CONSTRAINT "PK_b54f8ea623b17094db7667d8206" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3fe76ecf0f0ef036ff981e9f67" ON "user_entity" ("name") `);
        await queryRunner.query(`CREATE TABLE "favoritelist_entity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_3d46dd6ef3ab7a652d86c815fd8" UNIQUE ("name", "userId"), CONSTRAINT "PK_74e408e36bda852d1548b641b53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "watchlist_entity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "UQ_0819bc94fb3764fdf616b9aed77" UNIQUE ("name", "userId"), CONSTRAINT "PK_257b59bf3f29a5f0e891171356f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "favoritelist_movies" ("favoritelist_id" integer NOT NULL, "movie_tmdb_id" integer NOT NULL, CONSTRAINT "PK_e1640999fdd126a822f0eb22eb1" PRIMARY KEY ("favoritelist_id", "movie_tmdb_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed4accc8a51741d87478648f87" ON "favoritelist_movies" ("favoritelist_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7825bc68eaebfd2381fb27564b" ON "favoritelist_movies" ("movie_tmdb_id") `);
        await queryRunner.query(`CREATE TABLE "watchlist_movies" ("watchlist_id" integer NOT NULL, "movie_tmdb_id" integer NOT NULL, CONSTRAINT "PK_f902704f3970e1541c9070604df" PRIMARY KEY ("watchlist_id", "movie_tmdb_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7f7e9053be5ffa41e3a419ca90" ON "watchlist_movies" ("watchlist_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_274887fadb0180295a9fb56fb5" ON "watchlist_movies" ("movie_tmdb_id") `);
        await queryRunner.query(`ALTER TABLE "favoritelist_entity" ADD CONSTRAINT "FK_656f27303da631f9712f18bfe1b" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "watchlist_entity" ADD CONSTRAINT "FK_a288bddbd60c3984279ea6d19af" FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoritelist_movies" ADD CONSTRAINT "FK_ed4accc8a51741d87478648f878" FOREIGN KEY ("favoritelist_id") REFERENCES "favoritelist_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "favoritelist_movies" ADD CONSTRAINT "FK_7825bc68eaebfd2381fb27564b0" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "watchlist_movies" ADD CONSTRAINT "FK_7f7e9053be5ffa41e3a419ca902" FOREIGN KEY ("watchlist_id") REFERENCES "watchlist_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "watchlist_movies" ADD CONSTRAINT "FK_274887fadb0180295a9fb56fb5d" FOREIGN KEY ("movie_tmdb_id") REFERENCES "movie_entity"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "watchlist_movies" DROP CONSTRAINT "FK_274887fadb0180295a9fb56fb5d"`);
        await queryRunner.query(`ALTER TABLE "watchlist_movies" DROP CONSTRAINT "FK_7f7e9053be5ffa41e3a419ca902"`);
        await queryRunner.query(`ALTER TABLE "favoritelist_movies" DROP CONSTRAINT "FK_7825bc68eaebfd2381fb27564b0"`);
        await queryRunner.query(`ALTER TABLE "favoritelist_movies" DROP CONSTRAINT "FK_ed4accc8a51741d87478648f878"`);
        await queryRunner.query(`ALTER TABLE "watchlist_entity" DROP CONSTRAINT "FK_a288bddbd60c3984279ea6d19af"`);
        await queryRunner.query(`ALTER TABLE "favoritelist_entity" DROP CONSTRAINT "FK_656f27303da631f9712f18bfe1b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_274887fadb0180295a9fb56fb5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f7e9053be5ffa41e3a419ca90"`);
        await queryRunner.query(`DROP TABLE "watchlist_movies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7825bc68eaebfd2381fb27564b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed4accc8a51741d87478648f87"`);
        await queryRunner.query(`DROP TABLE "favoritelist_movies"`);
        await queryRunner.query(`DROP TABLE "watchlist_entity"`);
        await queryRunner.query(`DROP TABLE "favoritelist_entity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3fe76ecf0f0ef036ff981e9f67"`);
        await queryRunner.query(`DROP TABLE "user_entity"`);
        await queryRunner.query(`DROP TABLE "movie_entity"`);
    }

}
