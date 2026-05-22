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

import { JwtGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { returnOrThrow } from '@/common/utils/return-or-throw.utils';
import { AddMovieToUserFavoritelistDto } from '@favoritelists/dto/add-movie-to-user-favoritelist.dto';
import { CreateFavoritelistDto } from '@favoritelists/dto/create-favoritelist.dto';
import { UpdateFavoritelistDto } from './dto/update-favoritelist.dto';
import {
  GetAllUserFavoritelistMoviesResponseDto,
  GetAllUserFavoritelistsResponseDto,
  FavoritelistResponseDto,
} from '@favoritelists/dto/favoritelist-response.dto';
import { UserEntity } from '@/users/entity/user.entity';
import { FavoritelistsService } from '@favoritelists/favoritelists.service';

@Controller('favoritelists')
@UseGuards(JwtGuard)
export class FavoritelistsController {
  constructor(private favoritelistsService: FavoritelistsService) {}

  @Post('create')
  @Serialize(FavoritelistResponseDto)
  async createUserFavoritelist(
    @CurrentUser() currentUser: UserEntity,
    @Body() createUserFavoritelistDto: CreateFavoritelistDto,
  ) {
    const response = await this.favoritelistsService.createUserFavoritelist(
      currentUser.id,
      createUserFavoritelistDto,
    );

    return returnOrThrow(response);
  }

  @Delete('/delete/:id')
  async deleteUserFavoritelist(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response = await this.favoritelistsService.deleteUserFavoritelist(
      currentUser.id,
      id,
    );

    return returnOrThrow(response);
  }

  @Get('all')
  @Serialize(GetAllUserFavoritelistsResponseDto)
  async getAllUserFavoritelists(
    @CurrentUser() currentUser: UserEntity,
    @Query() paginationDto: PaginationDto,
  ) {
    const response = await this.favoritelistsService.getAllUserFavoritelists(
      currentUser.id,
      paginationDto,
    );

    return returnOrThrow(response);
  }

  @Get(':id')
  @Serialize(GetAllUserFavoritelistMoviesResponseDto)
  async getAllUserFavoritelistMovies(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const response =
      await this.favoritelistsService.getAllUserFavoritelistMovies(
        currentUser.id,
        id,
        paginationDto,
      );

    return returnOrThrow(response);
  }

  @Post(':id/addMovie')
  async addMovieToUserFavoritelist(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() addMovieDto: AddMovieToUserFavoritelistDto,
  ) {
    const response = await this.favoritelistsService.addMovieToUserFavoritelist(
      currentUser.id,
      id,
      addMovieDto.tmdbId,
    );

    return returnOrThrow(response);
  }

  @Delete(':id/deleteMovie/:movieTmdbId')
  async deleteMovieFromUserFavoritelist(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Param('movieTmdbId', ParseIntPipe) movieTmdbId: number,
  ) {
    const response =
      await this.favoritelistsService.deleteMovieFromUserFavoritelist(
        currentUser.id,
        id,
        movieTmdbId,
      );

    return returnOrThrow(response);
  }

  @Patch(':id')
  async updateUserFavoritelistDetails(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatedFields: UpdateFavoritelistDto,
  ) {
    const response =
      await this.favoritelistsService.updateUserFavoritelistDetails(
        currentUser.id,
        id,
        updatedFields,
      );

    return returnOrThrow(response);
  }
}
