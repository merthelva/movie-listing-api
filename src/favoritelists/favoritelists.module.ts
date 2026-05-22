import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesModule } from '@movies/movies.module';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { FavoritelistsController } from '@favoritelists/favoritelists.controller';
import { FavoritelistSchemaService } from './favoritelist-schema.service';
import { FavoritelistsService } from '@favoritelists/favoritelists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoritelistEntity, MovieEntity]),
    MoviesModule,
  ],
  providers: [FavoritelistsService, FavoritelistSchemaService],
  controllers: [FavoritelistsController],
})
export class FavoritelistsModule {}
