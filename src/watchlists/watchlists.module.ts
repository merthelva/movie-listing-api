import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesModule } from '@movies/movies.module';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { WatchlistsController } from '@watchlists/watchlists.controller';
import { WatchlistsService } from '@watchlists/watchlists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchlistEntity, MovieEntity]),
    MoviesModule,
  ],
  providers: [WatchlistsService],
  controllers: [WatchlistsController],
})
export class WatchlistsModule {}
