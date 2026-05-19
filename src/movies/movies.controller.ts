import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { MoviesService } from '@movies/movies.service';
import { SearchMoviesDto } from '@movies/dto/search-movies.dto';
import { returnOrThrow } from '@/common/utils/return-or-throw.utils';

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Get('search')
  async searchMovies(@Query() searchMoviesDto: SearchMoviesDto) {
    const response = await this.moviesService.searchMovies(
      searchMoviesDto.query,
      searchMoviesDto.page,
    );

    return returnOrThrow(response);
  }

  @Get(':tmdbId/details')
  async getMovieDetails(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    const response = await this.moviesService.getMovieDetails(tmdbId);

    return returnOrThrow(response);
  }
}
