import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { WatchlistsService } from '@watchlists/watchlists.service';
import { WatchlistsController } from '@watchlists/watchlists.controller';
import { MoviesModule } from '@movies/movies.module';
import { MovieEntity } from '@movies/entity/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WatchlistEntity, MovieEntity]),
    MoviesModule,
  ],
  providers: [WatchlistsService],
  controllers: [WatchlistsController],
})
export class WatchlistsModule {}
