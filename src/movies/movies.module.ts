import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesService } from '@movies/movies.service';
import { MoviesController } from '@movies/movies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity])],
  providers: [MoviesService],
  controllers: [MoviesController],
  exports: [MoviesService],
})
export class MoviesModule {}
