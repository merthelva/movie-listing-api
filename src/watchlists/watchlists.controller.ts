import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '@auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserEntity } from '@users/entity/user.entity';
import { WatchlistsService } from '@watchlists/watchlists.service';
import { CreateWatchlistDto } from '@watchlists/dto/create-watchlist.dto';
import { AddMovieToUserWatchlistDto } from '@watchlists/dto/add-movie-to-user-watchlist.dto';
import { returnOrThrow } from '@/common/utils/return-or-throw';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import {
  GetAllUserWatchlistMoviesResponseDto,
  GetAllUserWatchlistsResponseDto,
  WatchlistResponseDto,
} from '@watchlists/dto/watchlist-response.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { UpdateWatchlistDto } from './dto/update-watchlist.dto';

@Controller('watchlists')
@UseGuards(JwtGuard)
export class WatchlistsController {
  constructor(private watchlistsService: WatchlistsService) {}

  @Post('create')
  @UseGuards(JwtGuard)
  @Serialize(WatchlistResponseDto)
  async createUserWatchlist(
    @CurrentUser() user: UserEntity,
    @Body() createUserWatchlistDto: CreateWatchlistDto,
  ) {
    const response = await this.watchlistsService.createUserWatchlist(
      user.id,
      createUserWatchlistDto,
    );

    return returnOrThrow(response);
  }

  @Delete('/delete/:id')
  @UseGuards(JwtGuard)
  async deleteUserWatchlist(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response = await this.watchlistsService.deleteUserWatchlist(
      user.id,
      id,
    );

    return returnOrThrow(response);
  }

  @Get('all')
  @UseGuards(JwtGuard)
  @Serialize(GetAllUserWatchlistsResponseDto)
  async getAllUserWatchlists(
    @CurrentUser() user: UserEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    const response = await this.watchlistsService.getAllUserWatchlists(
      user.id,
      paginationDto,
    );

    return returnOrThrow(response);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  @Serialize(GetAllUserWatchlistMoviesResponseDto)
  async getAllUserWatchlistMovies(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const response = await this.watchlistsService.getAllUserWatchlistMovies(
      user.id,
      id,
      paginationDto,
    );

    return returnOrThrow(response);
  }

  @Post(':id/addMovie')
  @UseGuards(JwtGuard)
  async addMovieToUserWatchlist(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() addMovieDto: AddMovieToUserWatchlistDto,
  ) {
    const response = await this.watchlistsService.addMovieToUserWatchlist(
      user.id,
      id,
      addMovieDto.name,
    );

    return returnOrThrow(response);
  }

  @Delete(':id/deleteMovie/:movieTmdbId')
  @UseGuards(JwtGuard)
  async deleteMovieFromUserWatchlist(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Param('movieTmdbId', ParseIntPipe) movieTmdbId: number,
  ) {
    const response = await this.watchlistsService.deleteMovieFromUserWatchlist(
      user.id,
      id,
      movieTmdbId,
    );

    return returnOrThrow(response);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateUserWatchlistDetails(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatedFields: UpdateWatchlistDto,
  ) {
    const response = await this.watchlistsService.updateUserWatchlistDetails(
      currentUser.id,
      id,
      updatedFields,
    );

    return returnOrThrow(response);
  }
}
