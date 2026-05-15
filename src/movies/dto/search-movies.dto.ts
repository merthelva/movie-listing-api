import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchMoviesDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  // TODO: Query parameters for a more refined search can be added later. For reference, see https://developer.themoviedb.org/reference/search-movie#query-params
}
