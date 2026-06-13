import type { WatchlistEntity } from '@watchlists/entity/watchlist.entity';
import type { PaginationType } from '@/common/types/pagination.type';
import type { MovieEntity } from '@movies/entity/movie.entity';

export type ListUserWatchlistsResponseType = PaginationType & {
  items: Array<WatchlistEntity>;
};

export type ListUserWatchlistMoviesResponseType = PaginationType & {
  items: Array<MovieEntity>;
};

export type CheckIsMovieInUserWatchlistResponseType = {
  isMovieInList: boolean;
};
