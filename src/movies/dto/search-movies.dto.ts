import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class SearchMoviesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  query!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(500)
  page?: number;

  // TODO: Query parameters for a more refined search can be added later. For reference, see https://developer.themoviedb.org/reference/search-movie#query-params
}
