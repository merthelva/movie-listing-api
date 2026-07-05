import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';

import { returnOrThrow } from '@/common/utils/return-or-throw.utils';
import { GetMovieCastDto } from '@movies/dto/get-movie-cast.dto';
import { GetMovieTrailerDto } from '@movies/dto/get-movie-trailer.dto';
import { SearchMoviesDto } from '@movies/dto/search-movies.dto';
import { MoviesService } from '@movies/movies.service';
import { GetMoviesByCategoryDto } from './dto/get-movies-by-category.dto';
import { GetMovieDetailsDto } from './dto/get-movie-details.dto';
import type { MovieCategoryType } from './types';

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Get('search')
  async searchMovies(@Query() searchMoviesDto: SearchMoviesDto) {
    const response = await this.moviesService.searchMovies(
      searchMoviesDto.query,
      searchMoviesDto.page,
      searchMoviesDto.language,
    );

    return returnOrThrow(response);
  }

  @Get(':tmdbId/details')
  async getMovieDetails(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query() { language }: GetMovieDetailsDto,
  ) {
    const response = await this.moviesService.getMovieDetails(tmdbId, language);

    return returnOrThrow(response);
  }

  @Get(':tmdbId/cast')
  async getMovieCast(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query() { language }: GetMovieCastDto,
  ) {
    const response = await this.moviesService.getMovieCast(tmdbId, language);

    return returnOrThrow(response);
  }

  @Get(':tmdbId/trailer')
  async getMovieTrailer(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Query() { language }: GetMovieTrailerDto,
  ) {
    const response = await this.moviesService.getMovieTrailer(tmdbId, language);

    return returnOrThrow(response);
  }

  @Get(':category')
  async getMoviesByCategory(
    @Query() getMoviesByCategoryDto: GetMoviesByCategoryDto,
    @Param('category') category: MovieCategoryType,
  ) {
    const response = await this.moviesService.getMoviesByCategory(
      category,
      getMoviesByCategoryDto.page,
      getMoviesByCategoryDto.language,
    );

    return returnOrThrow(response);
  }
}
