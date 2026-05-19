import { Module } from '@nestjs/common';
import { MoviesService } from '@movies/movies.service';
import { MoviesController } from '@movies/movies.controller';

@Module({
  providers: [MoviesService],
  controllers: [MoviesController],
  exports: [MoviesService],
})
export class MoviesModule {}
