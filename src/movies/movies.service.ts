import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { I18nContext, I18nService } from 'nestjs-i18n';

import { delayInMs } from '@/common/utils/delay-ms.utils';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { TtlCache } from '@/common/utils/ttl-cache.utils';
import { maxCacheSize } from './constants/max-cache-size.constant';
import type {
  MovieCastResponseType,
  MovieDetailsType,
  SearchMovieResultType,
  TmdbMovieCastResponseType,
  TmdbMovieDetailType,
  TmdbMovieListResponseType,
  TmdbSearchResultType,
  MovieTrailerType,
  MovieCategoryType,
} from '@movies/types';
import { LocaleType } from '@/common/types/locale.type';

@Injectable()
export class MoviesService implements OnModuleDestroy {
  private readonly readAccessToken: string;
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly retryAttempts: number;
  private readonly fetchTimeoutMs: number;
  private readonly sweeper: NodeJS.Timeout;
  private readonly cache: TtlCache<
    string,
    | SearchMovieResultType
    | MovieDetailsType
    | MovieCastResponseType['cast']
    | MovieTrailerType
  >;

  private readonly logger = new Logger(MoviesService.name);

  constructor(
    private configService: ConfigService,
    private i18n: I18nService,
  ) {
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
    this.cache = new TtlCache(this.cacheTtlMs, maxCacheSize);
    this.sweeper = setInterval(
      () => this.cache.evictExpired(),
      this.cacheTtlMs,
    );
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }

  async searchMovies(
    query: string,
    page: number = 1,
    language: LocaleType = 'en-US',
  ): Promise<GenericResponseType<SearchMovieResultType>> {
    const lang = I18nContext.current()?.lang;
    const cacheKey = `search:${query.toLowerCase()}:${page}:${language}`;
    const cachedMovieResults = this.cache.get(cacheKey);
    if (cachedMovieResults) {
      return {
        status: 'success',
        data: cachedMovieResults as SearchMovieResultType,
      };
    }

    const url = `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=${language}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code:
            response.status === 404
              ? HttpStatus.NOT_FOUND
              : HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message:
            response.status === 404
              ? this.i18n.t('messages.movies.SEARCH_NOT_FOUND', {
                  lang,
                  args: { query },
                })
              : this.i18n.t('messages.movies.SEARCH_ERROR', { lang }),
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
          voteAverage: this.normalizeVoteAverage(item.vote_average),
        })),
      };

      this.cache.set(cacheKey, cachedMovieResultsValue);

      return { status: 'success', data: cachedMovieResultsValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movies from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.movies.SEARCH_ERROR', { lang }),
      };
    }
  }

  async getMovieDetails(
    tmdbId: number,
    language: LocaleType = 'en-US',
  ): Promise<GenericResponseType<MovieDetailsType>> {
    const lang = I18nContext.current()?.lang;
    const cacheKey = `movie:${tmdbId}:${language}`;
    const cachedMovieDetails = this.cache.get(cacheKey);
    if (cachedMovieDetails) {
      return {
        status: 'success',
        data: cachedMovieDetails as MovieDetailsType,
      };
    }

    if (tmdbId <= 0) {
      return {
        code: HttpStatus.BAD_REQUEST,
        status: 'error',
        message: this.i18n.t('messages.movies.INVALID_TMDB_ID', { lang }),
      };
    }

    const url = `${this.baseUrl}/movie/${tmdbId}?language=${language}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code:
            response.status === 404
              ? HttpStatus.NOT_FOUND
              : HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message:
            response.status === 404
              ? this.i18n.t('messages.movies.MOVIE_NOT_FOUND', {
                  lang,
                  args: { tmdbId },
                })
              : this.i18n.t('messages.movies.DETAILS_ERROR', { lang }),
        };
      }

      const data = (await response.json()) as TmdbMovieDetailType;
      const cachedMovieDetailsValue: MovieDetailsType = {
        tmdbId: data.id,
        title: data.title,
        overview: data.overview,
        posterPath: data.poster_path ?? null,
        budget: data.budget,
        genres: (data.genres ?? []).map((genre) => genre.name),
        revenue: data.revenue,
        runtime: data.runtime,
        releaseDate: data.release_date,
        voteAverage: this.normalizeVoteAverage(data.vote_average),
        voteCount: data.vote_count,
      };

      this.cache.set(cacheKey, cachedMovieDetailsValue);

      return { status: 'success', data: cachedMovieDetailsValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movie details from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.movies.DETAILS_ERROR', { lang }),
      };
    }
  }

  async getMovieCast(
    tmdbId: number,
    language: LocaleType = 'en-US',
  ): Promise<GenericResponseType<MovieCastResponseType['cast']>> {
    const lang = I18nContext.current()?.lang;
    const cacheKey = `movie-cast:${tmdbId}:${language}`;
    const cachedMovieCast = this.cache.get(cacheKey);
    if (cachedMovieCast) {
      return {
        status: 'success',
        data: cachedMovieCast as MovieCastResponseType['cast'],
      };
    }

    if (tmdbId <= 0) {
      return {
        code: HttpStatus.BAD_REQUEST,
        status: 'error',
        message: this.i18n.t('messages.movies.INVALID_TMDB_ID', { lang }),
      };
    }

    const url = `${this.baseUrl}/movie/${tmdbId}/credits?language=${language}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code:
            response.status === 404
              ? HttpStatus.NOT_FOUND
              : HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message:
            response.status === 404
              ? this.i18n.t('messages.movies.CAST_NOT_FOUND', {
                  lang,
                  args: { tmdbId },
                })
              : this.i18n.t('messages.movies.CAST_ERROR', { lang }),
        };
      }

      const data = (await response.json()) as TmdbMovieCastResponseType;
      const cachedMovieCastValue: MovieCastResponseType['cast'] = data.cast.map(
        (castMember) => ({
          id: castMember.id,
          name: castMember.name,
          character: castMember.character,
          order: castMember.order,
          profilePath: castMember.profile_path ?? null,
        }),
      );

      this.cache.set(cacheKey, cachedMovieCastValue);

      return { status: 'success', data: cachedMovieCastValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movie cast from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.movies.CAST_ERROR', { lang }),
      };
    }
  }

  async getMovieTrailer(
    tmdbId: number,
    language: LocaleType = 'en-US',
  ): Promise<GenericResponseType<MovieTrailerType>> {
    const lang = I18nContext.current()?.lang;
    const cacheKey = `movie-trailer:${tmdbId}:${language}`;
    const cachedMovieTrailer = this.cache.get(cacheKey);
    if (cachedMovieTrailer) {
      return {
        status: 'success',
        data: cachedMovieTrailer as MovieTrailerType,
      };
    }

    if (tmdbId <= 0) {
      return {
        code: HttpStatus.BAD_REQUEST,
        status: 'error',
        message: this.i18n.t('messages.movies.INVALID_TMDB_ID', { lang }),
      };
    }

    const url = `${this.baseUrl}/movie/${tmdbId}/videos?language=${language}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code:
            response.status === 404
              ? HttpStatus.NOT_FOUND
              : HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message:
            response.status === 404
              ? this.i18n.t('messages.movies.TRAILER_NOT_FOUND', {
                  lang,
                  args: { tmdbId },
                })
              : this.i18n.t('messages.movies.TRAILER_ERROR', { lang }),
        };
      }

      const data = (await response.json()) as TmdbMovieListResponseType;

      if (data.results.length === 0) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.movies.NO_OFFICIAL_TRAILER', {
            lang,
            args: { tmdbId },
          }),
        };
      }

      const cachedMovieTrailerValue: MovieTrailerType =
        data.results
          .map(({ id, key, site, type }) => ({
            id,
            key,
            site,
            type,
          }))
          .find(({ site, type }) => site === 'YouTube' && type === 'Trailer') ??
        null;

      this.cache.set(cacheKey, cachedMovieTrailerValue);

      return { status: 'success', data: cachedMovieTrailerValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movie trailer from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.movies.TRAILER_ERROR', { lang }),
      };
    }
  }

  async getMoviesByCategory(
    category: MovieCategoryType,
    page: number = 1,
    language: LocaleType = 'en-US',
  ): Promise<GenericResponseType<SearchMovieResultType>> {
    const lang = I18nContext.current()?.lang;
    const cacheKey = `${category}:${page}:${language}`;
    const cachedMoviesByCategory = this.cache.get(cacheKey);
    if (cachedMoviesByCategory) {
      return {
        status: 'success',
        data: cachedMoviesByCategory as SearchMovieResultType,
      };
    }

    const url = `${this.baseUrl}/movie/${category}?page=${page}&language=${language}`;

    try {
      const response = await this.fetchWithRetry(url);
      if (!response.ok) {
        return {
          code:
            response.status === 404
              ? HttpStatus.NOT_FOUND
              : HttpStatus.INTERNAL_SERVER_ERROR,
          status: 'error',
          message:
            response.status === 404
              ? this.i18n.t('messages.movies.CATEGORY_NOT_FOUND', {
                  lang,
                  args: { category },
                })
              : this.i18n.t('messages.movies.CATEGORY_ERROR', {
                  lang,
                  args: { category },
                }),
        };
      }

      const data = (await response.json()) as TmdbSearchResultType;
      const cachedMoviesByCategoryValue: SearchMovieResultType = {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
        results: data.results.map((item) => ({
          tmdbId: item.id,
          title: item.title,
          overview: item.overview,
          posterPath: item.poster_path ?? null,
          releaseDate: item.release_date,
          voteAverage: this.normalizeVoteAverage(item.vote_average),
        })),
      };

      this.cache.set(cacheKey, cachedMoviesByCategoryValue);

      return { status: 'success', data: cachedMoviesByCategoryValue };
    } catch (err) {
      this.logger.error(
        'Failed to fetch movies from TMDB',
        err instanceof Error ? err.stack : err,
      );
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.movies.FETCH_ERROR', { lang }),
      };
    }
  }

  private normalizeVoteAverage(value: number | null | undefined): number {
    return value != null ? +value.toFixed(1) : 0;
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
