import { HttpStatus, Injectable } from '@nestjs/common';
import { GenericResponseType } from '@/common/types/generic-response.type';
import type {
  SearchMovieResultType,
  TmdbSearchResultType,
} from '@movies/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MoviesService {
  private readonly readAccessToken: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.readAccessToken = this.configService.getOrThrow<string>(
      'TMDB_API_READ_ACCESS_TOKEN',
    );
    this.baseUrl = this.configService.get<string>(
      'TMDB_BASE_URL',
      'https://api.themoviedb.org/3',
    );
  }

  async searchMovies(
    query: string,
    page: number = 1,
  ): Promise<GenericResponseType<SearchMovieResultType>> {
    const url = `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.readAccessToken}`,
      },
    });

    if (!response.ok) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while fetching movies from TMDB.',
      };
    }

    const data = (await response.json()) as TmdbSearchResultType;

    return {
      status: 'success',
      data: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        results: data.results.map((item) => ({
          tmdbId: item.id,
          title: item.title,
          overview: item.overview,
          posterPath: item.poster_path ?? null,
          releaseDate: item.release_date,
          voteAverage: item.vote_average,
        })),
      },
    };
  }
}
