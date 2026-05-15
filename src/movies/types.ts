// ##########################################
// ############# TMDB API TYPES #############
// ##########################################

type TmdbMovieType = {
  adult: boolean;
  backdrop_path: string;
  genre_ids: Array<number>;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type TmdbSearchResultType = {
  page: number;
  results: Array<TmdbMovieType>;
  total_pages: number;
  total_results: number;
};

// ################################################
// ############# ENTITY RELATED TYPES #############
// ################################################

export type MovieItemType = {
  tmdbId: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
};

export type SearchMovieResultType = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: Array<MovieItemType>;
};
