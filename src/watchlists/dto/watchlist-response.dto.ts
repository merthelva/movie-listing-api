import { Expose, Type } from 'class-transformer';
import { MovieEntity } from '@movies/entity/movie.entity';

export class WatchlistResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  createdAt!: Date;
}

export class GetAllUserWatchlistMoviesResponseDto {
  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalItems!: number;

  @Expose()
  isFirstPage!: boolean;

  @Expose()
  isLastPage!: boolean;

  @Expose()
  @Type(() => MovieEntity)
  items!: Array<MovieEntity>;
}

export class GetAllUserWatchlistsResponseDto {
  @Expose()
  page!: number;

  @Expose()
  limit!: number;

  @Expose()
  totalItems!: number;

  @Expose()
  isFirstPage!: boolean;

  @Expose()
  isLastPage!: boolean;

  @Expose()
  @Type(() => WatchlistResponseDto)
  items!: Array<WatchlistResponseDto>;
}
