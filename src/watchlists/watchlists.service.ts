import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import { MovieEntity } from '@movies/entity/movie.entity';
import { MoviesService } from '@movies/movies.service';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import type {
  ListUserWatchlistMoviesResponseType,
  ListUserWatchlistsResponseType,
} from '@watchlists/types';
import { CreateWatchlistDto } from '@watchlists/dto/create-watchlist.dto';
import type { UpdateWatchlistDto } from './dto/update-watchlist.dto';

@Injectable()
export class WatchlistsService {
  constructor(
    @InjectRepository(WatchlistEntity)
    private watchlistRepository: Repository<WatchlistEntity>,
    @InjectRepository(MovieEntity)
    private movieRepository: Repository<MovieEntity>,
    private moviesService: MoviesService,
  ) {}

  async createUserWatchlist(
    userId: number,
    createUserWatchlistDto: CreateWatchlistDto,
  ): Promise<GenericResponseType<WatchlistEntity>> {
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { name: createUserWatchlistDto.name, user: { id: userId } },
      });
      if (foundUserWatchlist) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: `Watchlist with name ${createUserWatchlistDto.name} for this user already exists`,
        };
      }

      const watchlist = this.watchlistRepository.create({
        name: createUserWatchlistDto.name,
        user: { id: userId },
      });
      return {
        status: 'success',
        data: await this.watchlistRepository.save(watchlist),
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while creating the watchlist.',
      };
    }
  }

  async deleteUserWatchlist(
    userId: number,
    id: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: id, user: { id: userId } },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Watchlist with id ${id} for this user is not found.`,
        };
      }

      await this.watchlistRepository.remove(foundUserWatchlist);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'The watchlist has been deleted successfully.',
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while deleting the watchlist.',
      };
    }
  }

  async getAllUserWatchlists(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserWatchlistsResponseType>> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [paginatedWatchlists, totalItems] =
        await this.watchlistRepository.findAndCount({
          where: { user: { id: userId } },
          skip,
          take: limit,
          order: { createdAt: 'DESC' },
        });

      return {
        status: 'success',
        data: {
          isFirstPage: page === 1,
          isLastPage: skip + paginatedWatchlists.length >= totalItems,
          limit,
          page,
          totalItems,
          items: paginatedWatchlists,
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while getting the user watchlists.',
      };
    }
  }

  async getAllUserWatchlistMovies(
    userId: number,
    id: number,
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUserWatchlistMoviesResponseType>> {
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id, user: { id: userId } },
        relations: { movies: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Watchlist with id ${id} for the user is not found.`,
        };
      }

      // TODO: Check for any error/bug in pagination logic here.
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;
      const paginatedWatchlistMovies = foundUserWatchlist.movies.slice(
        skip,
        skip + limit,
      );
      const totalItems = foundUserWatchlist.movies.length;

      return {
        status: 'success',
        data: {
          isFirstPage: page === 1,
          isLastPage: skip + paginatedWatchlistMovies.length >= totalItems,
          limit,
          page,
          totalItems,
          items: paginatedWatchlistMovies,
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while getting the user watchlist movies.',
      };
    }
  }

  async addMovieToUserWatchlist(
    userId: number,
    watchlistId: number,
    movieName: string,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
        relations: { movies: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Watchlist with id ${watchlistId} for the user is not found.`,
        };
      }

      const searchMovieResponse =
        await this.moviesService.searchMovies(movieName);
      if (searchMovieResponse.status === 'error') {
        return searchMovieResponse;
      }

      const [foundMovie] = searchMovieResponse.data.results;

      const isMovieAlreadyInWatchlist = foundUserWatchlist.movies.some(
        (movie) => movie.tmdbId === foundMovie.tmdbId,
      );
      if (isMovieAlreadyInWatchlist) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: 'This movie is already in the watchlist for this user.',
        };
      }

      let foundMovieEntity = await this.movieRepository.findOne({
        where: { tmdbId: foundMovie.tmdbId },
      });
      if (!foundMovieEntity) {
        foundMovieEntity = this.movieRepository.create({
          tmdbId: foundMovie.tmdbId,
          title: foundMovie.title,
          overview: foundMovie.overview,
          posterPath: foundMovie.posterPath ?? null,
          releaseDate: foundMovie.releaseDate,
          voteAverage: foundMovie.voteAverage,
        });
        await this.movieRepository.save(foundMovieEntity);
      }

      const isMovieAddedToWatchlist = foundUserWatchlist.movies.some(
        (mv) => mv.tmdbId === foundMovie.tmdbId,
      );
      if (isMovieAddedToWatchlist) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: 'This movie is already in the watchlist for this user.',
        };
      }

      foundUserWatchlist.movies.push(foundMovieEntity);
      await this.watchlistRepository.save(foundUserWatchlist);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Movie has been added to the watchlist.',
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while adding the movie to the watchlist.',
      };
    }
  }

  async deleteMovieFromUserWatchlist(
    userId: number,
    watchlistId: number,
    movieTmdbId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
        relations: { movies: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Watchlist with id ${watchlistId} for the user is not found.`,
        };
      }

      const foundMovieIndex = foundUserWatchlist.movies.findIndex(
        ({ tmdbId }) => tmdbId === movieTmdbId,
      );
      if (foundMovieIndex < 0) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Movie with id ${movieTmdbId} for the user is not found in this watchlist.`,
        };
      }

      foundUserWatchlist.movies.splice(foundMovieIndex, 1);
      await this.watchlistRepository.save(foundUserWatchlist);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Movie has been deleted from the watchlist successfully.',
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message:
          'An error occurred while deleting the movie from the watchlist.',
      };
    }
  }

  async updateUserWatchlistDetails(
    userId: number,
    watchlistId: number,
    updatedFields: UpdateWatchlistDto,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      if (
        Object.keys(updatedFields).length === 0 ||
        Object.values(updatedFields).filter(Boolean).length === 0
      ) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: 'Please provide at least one field to update.',
        };
      }

      const foundUserWatchlist = await this.watchlistRepository.findOne({
        where: { id: watchlistId, user: { id: userId } },
        relations: { movies: true },
      });
      if (!foundUserWatchlist) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `Watchlist with id ${watchlistId} for the user is not found.`,
        };
      }

      if (
        updatedFields.name?.trim().toLowerCase() ===
        foundUserWatchlist.name.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'Please provide a different name to update. The provided name is the same as the current name.',
        };
      }

      const hasUserWatchlistWithSameName =
        updatedFields.name != null &&
        (await this.watchlistRepository.exists({
          where: {
            name: updatedFields.name,
          },
        }));
      if (hasUserWatchlistWithSameName) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'A watchlist with this name already exists for this user. Please choose a different name.',
        };
      }

      await this.watchlistRepository.update({ id: watchlistId }, updatedFields);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'Watchlist has been updated successfully.',
        },
      };
    } catch {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while updating the watchlist.',
      };
    }
  }
}
