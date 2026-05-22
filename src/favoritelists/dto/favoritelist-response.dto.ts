import { Expose, Type } from 'class-transformer';

import { MovieEntity } from '@/movies/entity/movie.entity';

export class FavoritelistResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  createdAt!: Date;
}

export class GetAllUserFavoritelistMoviesResponseDto {
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

export class GetAllUserFavoritelistsResponseDto {
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
  @Type(() => FavoritelistResponseDto)
  items!: Array<FavoritelistResponseDto>;
}
