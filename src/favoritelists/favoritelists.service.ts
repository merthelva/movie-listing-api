import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
import { CreateFavoritelistDto } from '@favoritelists/dto/create-favoritelist.dto';
import { UpdateFavoritelistDto } from './dto/update-favoritelist.dto';
import { ErrorTokens } from './constants/error-tokens.constant';
import { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import {
  ListUserFavoritelistMoviesResponseType,
  ListUserFavoritelistsResponseType,
  CheckIsMovieInUserFavoritelistResponseType,
  FavoritelistWithMovieStatusResponseType,
} from '@favoritelists/types';

@Injectable()
export class FavoritelistsService {
  private readonly logger = new Logger(FavoritelistsService.name);

  constructor(
    @InjectRepository(FavoritelistEntity)
    private favoritelistRepository: Repository<FavoritelistEntity>,
    @InjectRepository(MovieEntity)
    private movieRepository: Repository<MovieEntity>,
    private moviesService: MoviesService,
  ) {}

  private async requireFavoritelistForUser(
    manager: EntityManager,
    favoritelistId: number,
    userId: number,
  ): Promise<FavoritelistEntity> {
    const favoritelist = await manager
      .createQueryBuilder(FavoritelistEntity, 'favoritelist')
      .innerJoin('favoritelist.user', 'user')
      .where('favoritelist.id = :favoritelistId', { favoritelistId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!favoritelist) {
      throw new Error(ErrorTokens.FAVORITELIST_NOT_FOUND);
    }

    return favoritelist;
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

  async createUserFavoritelist(
    userId: number,
    createUserFavoritelistDto: CreateFavoritelistDto,
  ): Promise<GenericResponseType<FavoritelistEntity>> {
    try {
      const favoritelist = this.favoritelistRepository.create({
        name: createUserFavoritelistDto.name,
        user: { id: userId },
      });
      return {
        status: 'success',
        data: await this.favoritelistRepository.save(favoritelist),
      };
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: `Favoritelist with name ${createUserFavoritelistDto.name} for this user already exists`,
        };
      }
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while creating the favoritelist.',
      };
    }
  }

  async deleteUserFavoritelist(
    userId: number,
    id: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const foundUserFavoritelist = await this.favoritelistRepository.findOne({
        where: { id: id, user: { id: userId } },
      });
      if (!foundUserFavoritelist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Favoritelist with id ${id} for this user is not found.`,
        };
      }

      await this.favoritelistRepository.remove(foundUserFavoritelist);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'The favoritelist has been deleted successfully.',
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while deleting the favoritelist.',
      };
    }
  }

  async getAllUserFavoritelists(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserFavoritelistsResponseType>> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [paginatedFavoritelists, totalItems] =
        await this.favoritelistRepository
          .createQueryBuilder('favoritelist')
          .innerJoin('favoritelist.user', 'user')
          .where('user.id = :userId', { userId })
          .select([
            'favoritelist.id',
            'favoritelist.name',
            'favoritelist.createdAt',
          ])
          .orderBy('favoritelist.createdAt', 'DESC')
          .skip(skip)
          .take(limit)
          .getManyAndCount();

      return {
        status: 'success',
        data: returnPaginatedData({
          items: paginatedFavoritelists,
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
        message: 'An error occurred while getting the user favoritelists.',
      };
    }
  }

  async getAllUserFavoritelistMovies(
    userId: number,
    id: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserFavoritelistMoviesResponseType>> {
    try {
      const foundUserFavoritelist = await this.favoritelistRepository.findOne({
        where: { id, user: { id: userId } },
        select: { id: true },
      });
      if (!foundUserFavoritelist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Favoritelist with id ${id} for the user is not found.`,
        };
      }

      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [paginatedFavoritelistMovies, totalItems] =
        await this.movieRepository
          .createQueryBuilder('movie')
          .innerJoin(
            'favoritelist_movies',
            'fm',
            'fm.movie_tmdb_id = movie.tmdbId',
          )
          .where('fm.favoritelist_id = :favoritelistId', { favoritelistId: id })
          .orderBy('movie.tmdbId', 'ASC')
          .skip(skip)
          .take(limit)
          .getManyAndCount();

      return {
        status: 'success',
        data: returnPaginatedData({
          items: paginatedFavoritelistMovies,
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
        message:
          'An error occurred while getting the user favoritelist movies.',
      };
    }
  }

  async addMovieToUserFavoritelist(
    userId: number,
    favoritelistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      // Resolve the movie first (external API) before opening a DB transaction.
      const movieDetailsResponse =
        await this.moviesService.getMovieDetails(movieTmdbId);
      if (movieDetailsResponse.status === 'error') {
        return movieDetailsResponse;
      }

      const foundMovie = movieDetailsResponse.data;

      const alreadyInFavoritelistError = new Error(
        ErrorTokens.MOVIE_ALREADY_IN_FAVORITELIST,
      );

      // Use a DB transaction on the favoritelist row
      // to make check-and-insert atomic and avoid race conditions.
      await this.favoritelistRepository.manager.transaction(async (manager) => {
        await this.requireFavoritelistForUser(manager, favoritelistId, userId);
        const movieEntity = await this.upsertMovieEntity(manager, foundMovie);

        // Check join table for existing pair (avoid loading all movies)
        const existingRows: Array<{ exists: number }> = await manager.query(
          'SELECT 1 as exists FROM favoritelist_movies WHERE favoritelist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [favoritelistId, movieEntity.tmdbId],
        );
        if (existingRows.length > 0) {
          throw alreadyInFavoritelistError;
        }

        // Insert into join table directly; unique index will protect against races.
        try {
          await manager.query(
            'INSERT INTO favoritelist_movies (favoritelist_id, movie_tmdb_id) VALUES ($1, $2)',
            [favoritelistId, movieEntity.tmdbId],
          );
        } catch (dbErr: unknown) {
          const pgErr = dbErr as { code?: string };
          if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
            throw alreadyInFavoritelistError;
          }
          throw dbErr;
        }
      });

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Movie has been added to the favoritelist.',
        },
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === ErrorTokens.FAVORITELIST_NOT_FOUND) {
          return {
            code: HttpStatus.NOT_FOUND,
            status: 'error',
            message: `Favoritelist with id ${favoritelistId} for the user is not found.`,
          };
        }
        if (err.message === ErrorTokens.MOVIE_ALREADY_IN_FAVORITELIST) {
          return {
            code: HttpStatus.FORBIDDEN,
            status: 'error',
            message: 'This movie is already in the favoritelist for this user.',
          };
        }
      }

      this.logger.error(err);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message:
          'An error occurred while adding the movie to the favoritelist.',
      };
    }
  }

  async deleteMovieFromUserFavoritelist(
    userId: number,
    favoritelistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const foundUserFavoritelist = await this.favoritelistRepository.findOne({
        where: { id: favoritelistId, user: { id: userId } },
      });
      if (!foundUserFavoritelist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Favoritelist with id ${favoritelistId} for the user is not found.`,
        };
      }

      const [movieRow]: Array<{ exists: number }> =
        await this.favoritelistRepository.manager.query(
          'SELECT 1 as exists FROM favoritelist_movies WHERE favoritelist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [favoritelistId, movieTmdbId],
        );
      if (!movieRow) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Movie with id ${movieTmdbId} for the user is not found in this favoritelist.`,
        };
      }

      await this.favoritelistRepository
        .createQueryBuilder()
        .delete()
        .from('favoritelist_movies')
        .where('favoritelist_id = :favoritelistId', { favoritelistId })
        .andWhere('movie_tmdb_id = :movieTmdbId', { movieTmdbId })
        .execute();

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Movie has been deleted from the favoritelist successfully.',
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message:
          'An error occurred while deleting the movie from the favoritelist.',
      };
    }
  }

  async updateUserFavoritelistDetails(
    userId: number,
    favoritelistId: number,
    updatedFields: UpdateFavoritelistDto,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      if (hasNoUpdateFields(updatedFields)) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: 'Please provide at least one field to update.',
        };
      }

      const foundUserFavoritelist = await this.favoritelistRepository.findOne({
        where: { id: favoritelistId, user: { id: userId } },
      });
      if (!foundUserFavoritelist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Favoritelist with id ${favoritelistId} for the user is not found.`,
        };
      }

      if (
        updatedFields.name?.trim().toLowerCase() ===
        foundUserFavoritelist.name.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'Please provide a different name to update. The provided name is the same as the current name.',
        };
      }

      await this.favoritelistRepository.update(
        { id: favoritelistId },
        updatedFields,
      );

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Favoritelist has been updated successfully.',
        },
      };
    } catch (error) {
      const pgErr = error as { code?: string };
      if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: `Favoritelist with name ${updatedFields.name} for this user already exists`,
        };
      }
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while updating the favoritelist.',
      };
    }
  }

  async getUserFavoritelistsWithMovieStatus(
    userId: number,
    movieTmdbId: number,
  ): Promise<
    GenericResponseType<Array<FavoritelistWithMovieStatusResponseType>>
  > {
    try {
      const results: Array<FavoritelistWithMovieStatusResponseType> =
        await this.favoritelistRepository
          .createQueryBuilder('favoritelist')
          .innerJoin('favoritelist.user', 'user')
          .select('favoritelist.id', 'id')
          .addSelect('favoritelist.name', 'name')
          .addSelect(
            'EXISTS(SELECT 1 FROM favoritelist_movies fm WHERE fm.favoritelist_id = favoritelist.id AND fm.movie_tmdb_id = :movieTmdbId)',
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
        message:
          'An error occurred while fetching the user favoritelists with movie status.',
      };
    }
  }

  async checkIsMovieInUserFavoritelist(
    userId: number,
    favoritelistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<CheckIsMovieInUserFavoritelistResponseType>> {
    try {
      const foundUserFavoritelist = await this.favoritelistRepository.findOne({
        where: { id: favoritelistId, user: { id: userId } },
        select: { id: true },
      });
      if (!foundUserFavoritelist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Favoritelist with id ${favoritelistId} for the user is not found.`,
        };
      }

      const existingRows: Array<{ exists: number }> =
        await this.favoritelistRepository.manager.query(
          'SELECT 1 as exists FROM favoritelist_movies WHERE favoritelist_id = $1 AND movie_tmdb_id = $2 LIMIT 1',
          [favoritelistId, movieTmdbId],
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
        message:
          'An error occurred while checking the movie in the favoritelist.',
      };
    }
  }
}
