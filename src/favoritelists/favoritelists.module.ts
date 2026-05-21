import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import { FavoritelistsService } from '@favoritelists/favoritelists.service';
import { FavoritelistsController } from '@favoritelists/favoritelists.controller';
import { MoviesModule } from '@movies/movies.module';
import { MovieEntity } from '@movies/entity/movie.entity';
import { FavoritelistSchemaService } from './favoritelist-schema.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FavoritelistEntity, MovieEntity]),
    MoviesModule,
  ],
  providers: [FavoritelistsService, FavoritelistSchemaService],
  controllers: [FavoritelistsController],
})
export class FavoritelistsModule {}
