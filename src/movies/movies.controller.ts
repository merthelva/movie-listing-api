import { Controller, Get, Query } from '@nestjs/common';
import { MoviesService } from '@movies/movies.service';
import { SearchMoviesDto } from '@movies/dto/search-movies.dto';
import { throwError } from '@/common/utils/throw-error';

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Get('search')
  async searchMovies(@Query() searchMoviesDto: SearchMoviesDto) {
    const response = await this.moviesService.searchMovies(
      searchMoviesDto.query,
      searchMoviesDto.page,
    );
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }
}
