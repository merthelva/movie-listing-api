import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWatchlistDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
