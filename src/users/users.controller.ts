import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles as RolesDecorator } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtGuard } from '@/auth/guards/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserEntity } from './entity/user.entity';
import { UsersService } from './users.service';
import { throwError } from '@/common/utils/throw-error';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserRegisterResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '@/common/constants/roles.constant';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { GetAllUsersResponseDto } from './dto/get-all-users.response.dto';
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  @Serialize(UserRegisterResponseDto)
  async getCurrentUser(@CurrentUser() user: UserEntity) {
    const response = await this.usersService.getCurrentUser(user.id);
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async updateUserDetails(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatedFields: UpdateUserDto,
  ) {
    const response = await this.usersService.updateUserDetails(
      id,
      currentUser,
      updatedFields,
    );
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }

  @Get('all')
  @UseGuards(JwtGuard, RolesGuard) // Guard order matters: JwtGuard validates authentication first, then RolesGuard checks roles.
  @RolesDecorator(Roles.ADMIN)
  @Serialize(GetAllUsersResponseDto)
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    const response = await this.usersService.getAllUsers(paginationDto);
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }

  @Delete('/delete/:id')
  @UseGuards(JwtGuard, RolesGuard) // Guard order matters: JwtGuard validates authentication first, then RolesGuard checks roles.
  @RolesDecorator(Roles.ADMIN)
  async deleteUser(
    @CurrentUser() currentUser: UserEntity,
    @Param('userIdToDelete', ParseIntPipe) userIdToDelete: number,
  ) {
    const response = await this.usersService.deleteUser(
      currentUser.id,
      userIdToDelete,
    );
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }
}
