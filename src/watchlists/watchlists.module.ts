import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { WatchlistsService } from '@watchlists/watchlists.service';
import { WatchlistsController } from '@watchlists/watchlists.controller';
import { MoviesModule } from '@movies/movies.module';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistEntity]), MoviesModule],
  providers: [WatchlistsService],
  controllers: [WatchlistsController],
})
export class WatchlistsModule {}
