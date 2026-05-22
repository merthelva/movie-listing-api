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

import { JwtGuard } from '@/auth/guards/jwt.guard';
import { Roles } from '@/common/constants/roles.constant';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles as RolesDecorator } from '@/common/decorators/roles.decorator';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { RolesGuard } from '@/common/guards/roles.guard';
import { returnOrThrow } from '@/common/utils/return-or-throw.utils';
import { GetAllUsersResponseDto } from './dto/get-all-users.response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRegisterResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entity/user.entity';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  @Serialize(UserRegisterResponseDto)
  async getCurrentUser(@CurrentUser() currentUser: UserEntity) {
    const response = await this.usersService.getCurrentUser(currentUser.id);
    return returnOrThrow(response);
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
    return returnOrThrow(response);
  }

  @Get('all')
  @UseGuards(JwtGuard, RolesGuard) // Guard order matters: JwtGuard validates authentication first, then RolesGuard checks roles.
  @RolesDecorator(Roles.ADMIN)
  @Serialize(GetAllUsersResponseDto)
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    const response = await this.usersService.getAllUsers(paginationDto);
    return returnOrThrow(response);
  }

  @Patch('/updateRole/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  async updateUserRole(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const response = await this.usersService.updateUserRole(
      currentUser.id,
      id,
      updateUserRoleDto.role,
    );
    return returnOrThrow(response);
  }

  @Delete('/delete/:id')
  @UseGuards(JwtGuard, RolesGuard) // Guard order matters: JwtGuard validates authentication first, then RolesGuard checks roles.
  @RolesDecorator(Roles.ADMIN)
  async deleteUser(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response = await this.usersService.deleteUser(currentUser.id, id);
    return returnOrThrow(response);
  }
}
