import { Module } from '@nestjs/common';

import { MoviesController } from '@movies/movies.controller';
import { MoviesService } from '@movies/movies.service';

@Module({
  providers: [MoviesService],
  controllers: [MoviesController],
  exports: [MoviesService],
})
export class MoviesModule {}
