import type { FavoritelistEntity } from '@favoritelists/entity/favoritelist.entity';
import type { PaginationType } from '@/common/types/pagination.type';
import type { MovieEntity } from '@movies/entity/movie.entity';

export type ListUserFavoritelistsResponseType = PaginationType & {
  items: Array<FavoritelistEntity>;
};

export type ListUserFavoritelistMoviesResponseType = PaginationType & {
  items: Array<MovieEntity>;
};

export type CheckIsMovieInUserFavoritelistResponseType = {
  isMovieInList: boolean;
};

export type FavoritelistWithMovieStatusResponseType = {
  id: number;
  name: string;
  hasMovie: boolean;
};
