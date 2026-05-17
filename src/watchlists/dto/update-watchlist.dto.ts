import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateWatchlistDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
