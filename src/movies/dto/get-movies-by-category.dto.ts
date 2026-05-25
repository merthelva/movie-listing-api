import { IsNumber, IsOptional, IsPositive, Max } from 'class-validator';

export class GetMoviesByCategoryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(500)
  page?: number;
}
