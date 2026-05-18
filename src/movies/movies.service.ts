import { HttpStatus, Injectable } from '@nestjs/common';
import { GenericResponseType } from '@/common/types/generic-response.type';
import type {
  SearchMovieResultType,
  TmdbSearchResultType,
} from '@movies/types';
import { ConfigService } from '@nestjs/config';
import { delayInMs } from '@/common/utils/delay-ms';

@Injectable()
export class MoviesService {
  private readonly readAccessToken: string;
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly retryAttempts: number;
  private readonly fetchTimeoutMs: number;
  private readonly cacheStoreMap = new Map<
    string,
    { value: SearchMovieResultType; expiresAt: number }
  >();

  constructor(private configService: ConfigService) {
    this.readAccessToken = this.configService.getOrThrow<string>(
      'TMDB_API_READ_ACCESS_TOKEN',
    );
    this.baseUrl = this.configService.get<string>(
      'TMDB_BASE_URL',
      'https://api.themoviedb.org/3',
    );
    this.cacheTtlMs = this.configService.get<number>(
      'TMDB_CACHE_TTL_MS',
      5 * 60 * 1000,
    );
    this.retryAttempts = this.configService.get<number>(
      'TMDB_RETRY_ATTEMPTS',
      3,
    );
    this.fetchTimeoutMs = this.configService.get<number>(
      'TMDB_FETCH_TIMEOUT_MS',
      10000,
    );
  }

  async searchMovies(
    query: string,
    page: number = 1,
  ): Promise<GenericResponseType<SearchMovieResultType>> {
    const cacheKey = `${query.toLowerCase()}:${page}`;
    const now = Date.now();
    const cachedMovieResults = this.cacheStoreMap.get(cacheKey);
    if (cachedMovieResults && cachedMovieResults.expiresAt > now) {
      return { status: 'success', data: cachedMovieResults.value };
    }

    const url = `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&page=${page}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message: 'An error occurred while fetching movies from TMDB.',
        };
      }

      const data = (await response.json()) as TmdbSearchResultType;
      const cachedMovieResultsValue: SearchMovieResultType = {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        results: data.results.map((item) => ({
          tmdbId: item.id,
          title: item.title,
          overview: item.overview,
          posterPath: item.poster_path ?? null,
          releaseDate: item.release_date,
          voteAverage: +item.vote_average.toFixed(1),
        })),
      };

      this.cacheStoreMap.set(cacheKey, {
        value: cachedMovieResultsValue,
        expiresAt: now + this.cacheTtlMs,
      });

      return { status: 'success', data: cachedMovieResultsValue };
    } catch (err) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while fetching movies from TMDB.',
      };
    }
  }

  private async fetchWithRetry(url: string) {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.fetchTimeoutMs);
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.readAccessToken}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          return response;
        }

        // Retry on server errors and rate limiting
        if (response.status === 429 || response.status >= 500) {
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.pow(2, attempt) * 1000;
          await delayInMs(delayMs);
          lastErr = new Error(
            response.status === 429
              ? `Server receives too many requests. Please try again in ${delayMs / 1000} seconds.`
              : 'An error occurred while fetching movies from TMDB.',
          );
          continue;
        }

        // Non-retriable response
        return response;
      } catch (err: unknown) {
        clearTimeout(timeout);

        if (err instanceof Error) {
          lastErr = err;
          if (attempt < this.retryAttempts) {
            await delayInMs(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        throw lastErr;
      }
    }

    throw lastErr;
  }
}
