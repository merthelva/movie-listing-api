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

type TmdbMovieVideoType = {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  id: string;
  published_at: string;
};

export type TmdbMovieListResponseType = {
  id: number;
  results: Array<TmdbMovieVideoType>;
};

type TmdbMovieCastType = {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
};

export type TmdbMovieCastResponseType = {
  id: number;
  cast: Array<TmdbMovieCastType>;
};

export type TmdbSearchResultType = {
  page: number;
  results: Array<TmdbMovieType>;
  total_pages: number;
  total_results: number;
};

export type TmdbMovieDetailType = {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: TmdbCollectionType | null;
  budget: number;
  genres: Array<TmdbGenreType>;
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  origin_country: string[];
  original_language: string;
  original_title: string;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  production_companies: Array<TmdbProductionCompanyType>;
  production_countries: Array<TmdbProductionCountryType>;
  release_date: string; // YYYY-MM-DD
  revenue: number;
  runtime: number | null;
  spoken_languages: Array<TmdbSpokenLanguageType>;
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

type TmdbCollectionType = {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
};

type TmdbGenreType = {
  id: number;
  name: string;
};

type TmdbProductionCompanyType = {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
};

type TmdbProductionCountryType = {
  iso_3166_1: string;
  name: string;
};

type TmdbSpokenLanguageType = {
  english_name: string;
  iso_639_1: string;
  name: string;
};

// ################################################
// ############# ENTITY RELATED TYPES #############
// ################################################

type MovieItemType = {
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

export type MovieDetailsType = {
  tmdbId: number;
  title: string;
  overview: string | null;
  posterPath: string | null;
  budget: number;
  genres: Array<string>;
  revenue: number;
  runtime: number | null;
  releaseDate: string; // YYYY-MM-DD
  voteAverage: number;
  voteCount: number;
};

type CastType = {
  id: number;
  name: string;
  character: string;
  order: number;
  profilePath: string;
};

type MovieCastType = Array<CastType>;

export type MovieCastResponseType = {
  id: number;
  cast: MovieCastType;
};

export type MovieTrailerType = {
  id: string;
  key: string;
  site: string;
  type: string;
} | null;

export type MovieCategoryType =
  | 'popular'
  | 'top_rated'
  | 'upcoming'
  | 'now_playing';
