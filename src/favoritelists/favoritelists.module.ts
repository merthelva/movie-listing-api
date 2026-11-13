import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesModule } from '@movies/movies.module';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { FavoritelistsController } from '@favoritelists/favoritelists.controller';
import { FavoritelistsService } from '@favoritelists/favoritelists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoritelistEntity, MovieEntity]),
    MoviesModule,
  ],
  providers: [FavoritelistsService],
  controllers: [FavoritelistsController],
})
export class FavoritelistsModule {}
