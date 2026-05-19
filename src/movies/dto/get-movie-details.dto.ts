import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetMovieDetailsDto {
  @IsNumber()
  @IsNotEmpty()
  tmdbId!: number;
}
