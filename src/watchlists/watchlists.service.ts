import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { I18nContext, I18nService } from 'nestjs-i18n';
import { EntityManager, Repository } from 'typeorm';

import { PgViolationCodes } from '@/common/constants/pg-violation-codes.constant';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { hasNoUpdateFields } from '@/common/utils/has-no-update-fields.utils';
import { returnPaginatedData } from '@/common/utils/return-paginated-data.utils';
import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesService } from '@movies/movies.service';
import { MovieDetailsType } from '@movies/types';
import { CreateWatchlistDto } from '@watchlists/dto/create-watchlist.dto';
import { UpdateWatchlistDto } from './dto/update-watchlist.dto';
import { ErrorTokens } from './constants/error-tokens.constant';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import {
  CheckIsMovieInUserWatchlistResponseType,
  ListUserWatchlistMoviesResponseType,
  ListUserWatchlistsResponseType,
  WatchlistWithMovieStatusResponseType,
} from '@watchlists/types';

@Injectable()
export class WatchlistsService {
  private readonly logger = new Logger(WatchlistsService.name);

  constructor(
    @InjectRepository(WatchlistEntity)
    private watchlistRepository: Repository<WatchlistEntity>,
    @InjectRepository(MovieEntity)
    private movieRepository: Repository<MovieEntity>,
    private moviesService: MoviesService,
    private i18n: I18nService,
  ) {}

  private async requireWatchlistForUser(
    manager: EntityManager,
    watchlistId: number,
    userId: number,
  ): Promise<WatchlistEntity> {
    const watchlist = await manager
      .createQueryBuilder(WatchlistEntity, 'watchlist')
      .innerJoin('watchlist.user', 'user')
      .where('watchlist.id = :watchlistId', { watchlistId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!watchlist) {
      throw new Error(ErrorTokens.WATCHLIST_NOT_FOUND);
    }

    return watchlist;
  }

  private async upsertMovieEntity(
    manager: EntityManager,
    movieDetails: MovieDetailsType,
  ): Promise<MovieEntity> {
    let movieEntity = await manager.findOne(MovieEntity, {
      where: { tmdbId: movieDetails.tmdbId },
    });
    if (!movieEntity) {
      // Instantiating MovieEntity and assigning fields
      // prevents the TypeORM overload/type inference mismatch
      movieEntity = new MovieEntity();
      movieEntity.tmdbId = movieDetails.tmdbId;
      movieEntity.title = movieDetails.title;
      movieEntity.overview = movieDetails.overview ?? '';
      movieEntity.posterPath = movieDetails.posterPath ?? null;
      movieEntity.releaseDate = movieDetails.releaseDate;
      movieEntity.voteAverage = movieDetails.voteAverage;
      movieEntity.voteCount = movieDetails.voteCount;
      movieEntity.budget = movieDetails.budget;
      movieEntity.revenue = movieDetails.revenue;
      movieEntity.runtime = movieDetails.runtime;
      movieEntity.genres = movieDetails.genres;
      await manager.save(movieEntity);
    }
    return movieEntity;
  }

  async createUserWatchlist(
    userId: number,
    createUserWatchlistDto: CreateWatchlistDto,
  ): Promise<GenericResponseType<WatchlistEntity>> {
    const lang = I18nContext.current()?.lang;
    try {
      const watchlist = this.watchlistRepository.create({
        name: createUserWatchlistDto.name,
        user: { id: userId },
      });
      return {
        status: 'success',
        data: await this.watchlistRepository.save(watchlist),
      };
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.watchlists.CREATE_DUPLICATE', {
            lang,
            args: { name: createUserWatchlistDto.name },
          }),
        };
      }
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.CREATE_ERROR', { lang }),
      };
    }
  }

  async deleteUserWatchlist(
    userId: number,
    id: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: id, user: { id: userId } },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.NOT_FOUND', {
            lang,
            args: { id },
          }),
        };
      }

      await this.watchlistRepository.remove(foundUserWatchlist);

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.watchlists.DELETE_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.DELETE_ERROR', { lang }),
      };
    }
  }

  async getAllUserWatchlists(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserWatchlistsResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      // Use QueryBuilder and select only the required watchlist fields
      // to avoid loading relations (e.g. movies) and causing N+1 queries.
      const [paginatedWatchlists, totalItems] = await this.watchlistRepository
        .createQueryBuilder('watchlist')
        .innerJoin('watchlist.user', 'user')
        .where('user.id = :userId', { userId })
        .select(['watchlist.id', 'watchlist.name', 'watchlist.createdAt'])
        .orderBy('watchlist.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        status: 'success',
        data: returnPaginatedData({
          items: paginatedWatchlists,
          totalItems,
          page,
          limit,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.GET_LISTS_ERROR', { lang }),
      };
    }
  }

  async getAllUserWatchlistMovies(
    userId: number,
    id: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserWatchlistMoviesResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      // Verify watchlist ownership without eagerly loading movies
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id, user: { id: userId } },
        select: { id: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.LIST_NOT_FOUND', {
            lang,
            args: { id },
          }),
        };
      }

      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      // Query the join table at DB level to fetch only the requested page of movies
      const [paginatedWatchlistMovies, totalItems] = await this.movieRepository
        .createQueryBuilder('movie')
        .innerJoin('watchlist_movies', 'wm', 'wm.movie_tmdb_id = movie.tmdbId')
        .where('wm.watchlist_id = :watchlistId', { watchlistId: id })
        .orderBy('movie.tmdbId', 'ASC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        status: 'success',
        data: returnPaginatedData({
          items: paginatedWatchlistMovies,
          totalItems,
          page,
          limit,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.GET_MOVIES_ERROR', { lang }),
      };
    }
  }

  async addMovieToUserWatchlist(
    userId: number,
    watchlistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      // Resolve the movie first (external API) before opening a DB transaction.
      const movieDetailsResponse =
        await this.moviesService.getMovieDetails(movieTmdbId);
      if (movieDetailsResponse.status === 'error') {
        return movieDetailsResponse;
      }

      const foundMovie = movieDetailsResponse.data;

      const alreadyInWatchlistError = new Error(
        ErrorTokens.MOVIE_ALREADY_IN_WATCHLIST,
      );

      // Use a DB transaction on the watchlist row
      // to make check-and-insert atomic and avoid race conditions.
      await this.watchlistRepository.manager.transaction(async (manager) => {
        await this.requireWatchlistForUser(manager, watchlistId, userId);
        const movieEntity = await this.upsertMovieEntity(manager, foundMovie);

        // Check join table for existing pair (avoid loading all movies)
        const existingRows: Array<{ exists: number }> = await manager.query(
          'SELECT 1 as exists FROM watchlist_movies WHERE watchlist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [watchlistId, movieEntity.tmdbId],
        );
        if (existingRows.length > 0) {
          throw alreadyInWatchlistError;
        }

        // Insert into join table directly; unique index will protect against races.
        try {
          await manager.query(
            'INSERT INTO watchlist_movies (watchlist_id, movie_tmdb_id) VALUES ($1, $2)',
            [watchlistId, movieEntity.tmdbId],
          );
        } catch (dbErr: unknown) {
          const pgErr = dbErr as { code?: string };
          if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
            throw alreadyInWatchlistError;
          }
          throw dbErr;
        }
      });

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.watchlists.ADD_MOVIE_SUCCESS', {
            lang,
          }),
        },
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === ErrorTokens.WATCHLIST_NOT_FOUND) {
          return {
            code: HttpStatus.NOT_FOUND,
            status: 'error',
            message: this.i18n.t('messages.watchlists.LIST_NOT_FOUND', {
              lang,
              args: { id: watchlistId },
            }),
          };
        }
        if (err.message === ErrorTokens.MOVIE_ALREADY_IN_WATCHLIST) {
          return {
            code: HttpStatus.FORBIDDEN,
            status: 'error',
            message: this.i18n.t('messages.watchlists.MOVIE_ALREADY_IN_LIST', {
              lang,
            }),
          };
        }
      }

      this.logger.error(err);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.ADD_MOVIE_ERROR', { lang }),
      };
    }
  }

  async deleteMovieFromUserWatchlist(
    userId: number,
    watchlistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.LIST_NOT_FOUND', {
            lang,
            args: { id: watchlistId },
          }),
        };
      }

      const [movieRow]: Array<{ exists: number }> =
        await this.watchlistRepository.manager.query(
          'SELECT 1 as exists FROM watchlist_movies WHERE watchlist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [watchlistId, movieTmdbId],
        );
      if (!movieRow) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.MOVIE_NOT_IN_LIST', {
            lang,
            args: { movieTmdbId },
          }),
        };
      }

      await this.watchlistRepository
        .createQueryBuilder()
        .delete()
        .from('watchlist_movies')
        .where('watchlist_id = :watchlistId', { watchlistId })
        .andWhere('movie_tmdb_id = :movieTmdbId', { movieTmdbId })
        .execute();

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.watchlists.REMOVE_MOVIE_SUCCESS', {
            lang,
          }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.REMOVE_MOVIE_ERROR', {
          lang,
        }),
      };
    }
  }

  async updateUserWatchlistDetails(
    userId: number,
    watchlistId: number,
    updatedFields: UpdateWatchlistDto,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      if (hasNoUpdateFields(updatedFields)) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: this.i18n.t('messages.watchlists.NO_UPDATE_FIELDS', {
            lang,
          }),
        };
      }

      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.LIST_NOT_FOUND', {
            lang,
            args: { id: watchlistId },
          }),
        };
      }

      if (
        updatedFields.name?.trim().toLowerCase() ===
        foundUserWatchlist.name.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.watchlists.SAME_NAME', { lang }),
        };
      }

      await this.watchlistRepository.update({ id: watchlistId }, updatedFields);

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.watchlists.UPDATE_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.watchlists.UPDATE_DUPLICATE', {
            lang,
            args: { name: updatedFields.name },
          }),
        };
      }
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.UPDATE_ERROR', { lang }),
      };
    }
  }

  async getUserWatchlistsWithMovieStatus(
    userId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<Array<WatchlistWithMovieStatusResponseType>>> {
    const lang = I18nContext.current()?.lang;
    try {
      const results: Array<WatchlistWithMovieStatusResponseType> =
        await this.watchlistRepository
          .createQueryBuilder('watchlist')
          .innerJoin('watchlist.user', 'user')
          .select('watchlist.id', 'id')
          .addSelect('watchlist.name', 'name')
          .addSelect(
            'EXISTS(SELECT 1 FROM watchlist_movies wm WHERE wm.watchlist_id = watchlist.id AND wm.movie_tmdb_id = :movieTmdbId)',
            'hasMovie',
          )
          .where('user.id = :userId', { userId })
          .setParameter('movieTmdbId', movieTmdbId)
          .getRawMany();

      return {
        status: 'success',
        data: results,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.GET_WITH_STATUS_ERROR', {
          lang,
        }),
      };
    }
  }

  async checkIsMovieInUserWatchlist(
    userId: number,
    watchlistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<CheckIsMovieInUserWatchlistResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
        select: { id: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.watchlists.LIST_NOT_FOUND', {
            lang,
            args: { id: watchlistId },
          }),
        };
      }

      const existingRows: Array<{ exists: number }> =
        await this.watchlistRepository.manager.query(
          'SELECT 1 as exists FROM watchlist_movies WHERE watchlist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [watchlistId, movieTmdbId],
        );

      return {
        status: 'success',
        data: {
          isMovieInList: existingRows.length > 0,
        },
      };
    } catch (err: unknown) {
      this.logger.error(err);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.watchlists.CHECK_MOVIE_ERROR', { lang }),
      };
    }
  }
}
