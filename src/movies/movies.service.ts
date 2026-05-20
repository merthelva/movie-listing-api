import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GenericResponseType } from '@/common/types/generic-response.type';
import type {
  MovieDetailsType,
  SearchMovieResultType,
  TmdbMovieDetailType,
  TmdbSearchResultType,
} from '@movies/types';
import { ConfigService } from '@nestjs/config';
import { delayInMs } from '@/common/utils/delay-ms.utils';
import { maxCacheSize } from './constants/max-cache-size.constant';

@Injectable()
export class MoviesService {
  private readonly readAccessToken: string;
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly retryAttempts: number;
  private readonly fetchTimeoutMs: number;
  private readonly cacheStoreMap = new Map<
    string,
    { value: SearchMovieResultType | MovieDetailsType; expiresAt: number }
  >();

  private readonly logger = new Logger(MoviesService.name);

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

  private setCacheEntry(
    key: string,
    value: SearchMovieResultType | MovieDetailsType,
  ) {
    if (
      this.cacheStoreMap.size >= maxCacheSize &&
      !this.cacheStoreMap.has(key)
    ) {
      const firstKey = this.cacheStoreMap.keys().next().value as string;
      this.logger.warn(`Cache full. Evicting oldest entry: ${firstKey}`);
      this.cacheStoreMap.delete(firstKey);
    }
    this.cacheStoreMap.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  async getMovieDetails(
    tmdbId: number,
  ): Promise<GenericResponseType<MovieDetailsType>> {
    const cacheKey = `movie:${tmdbId}`;
    const now = Date.now();
    const cachedMovieDetails = this.cacheStoreMap.get(cacheKey);
    if (cachedMovieDetails && cachedMovieDetails.expiresAt > now) {
      return {
        status: 'success',
        data: cachedMovieDetails.value as MovieDetailsType,
      };
    }

    if (tmdbId <= 0) {
      return {
        code: HttpStatus.BAD_REQUEST,
        status: 'error',
        message:
          'Invalid "tmdbId" value is provided. It must be a positive integer.',
      };
    }

    const url = `${this.baseUrl}/movie/${tmdbId}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message: 'An error occurred while fetching movie details from TMDB.',
        };
      }

      const data = (await response.json()) as TmdbMovieDetailType;
      const cachedMovieDetailsValue: MovieDetailsType = {
        tmdbId: data.id,
        title: data.title,
        overview: data.overview,
        posterPath: data.poster_path ?? null,
        budget: data.budget,
        genres: data.genres.map((genre) => genre.name),
        revenue: data.revenue,
        runtime: data.runtime,
        releaseDate: data.release_date,
        voteAverage:
          data.vote_average != null ? +data.vote_average.toFixed(1) : 0,
        voteCount: data.vote_count,
      };

      this.setCacheEntry(cacheKey, cachedMovieDetailsValue);

      return { status: 'success', data: cachedMovieDetailsValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movie details from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while fetching movie details from TMDB.',
      };
    }
  }

  async searchMovies(
    query: string,
    page: number = 1,
  ): Promise<GenericResponseType<SearchMovieResultType>> {
    const cacheKey = `search:${query.toLowerCase()}:${page}`;
    const now = Date.now();
    const cachedMovieResults = this.cacheStoreMap.get(cacheKey);
    if (cachedMovieResults && cachedMovieResults.expiresAt > now) {
      return {
        status: 'success',
        data: cachedMovieResults.value as SearchMovieResultType,
      };
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
          voteAverage:
            item.vote_average != null ? +item.vote_average.toFixed(1) : 0,
        })),
      };

      this.setCacheEntry(cacheKey, cachedMovieResultsValue);

      return { status: 'success', data: cachedMovieResultsValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movies from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while fetching movies from TMDB.',
      };
    }
  }

  private async fetchWithRetry(url: string) {
    let lastErr = new Error('All retry attempts are failed');
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
          this.logger.warn(
            `TMDB responded ${response.status}. Retry attempt ${attempt + 1}/${this.retryAttempts}`,
          );
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
        this.logger.error(
          'fetchWithRetry exhausted all attempts',
          err instanceof Error ? err.stack : err,
        );
        throw lastErr;
      }
    }

    throw lastErr;
  }
}
