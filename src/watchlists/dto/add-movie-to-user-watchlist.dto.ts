import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AddMovieToUserWatchlistDto {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;
}
