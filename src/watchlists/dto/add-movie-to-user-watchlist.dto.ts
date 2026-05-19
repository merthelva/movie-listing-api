import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddMovieToUserWatchlistDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  tmdbId!: number;
}
