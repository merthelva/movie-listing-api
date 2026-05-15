import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWatchlistDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
