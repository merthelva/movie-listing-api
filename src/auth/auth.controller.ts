import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { LoginUserDto } from '@users/dto/login-user.dto';
import {
  UserLoginResponseDto,
  UserRegisterResponseDto,
} from '@/users/dto/user-response.dto';
import { returnOrThrow } from '@/common/utils/return-or-throw.utils';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserEntity } from '@users/entity/user.entity';
import { JwtGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Serialize(UserRegisterResponseDto)
  async register(@Body() createUserDto: CreateUserDto) {
    const response = await this.authService.register(createUserDto);
    return returnOrThrow(response);
  }

  @Post('login')
  @Serialize(UserLoginResponseDto)
  async login(@Body() { email, password }: LoginUserDto) {
    const response = await this.authService.login(email, password);
    return returnOrThrow(response);
  }

  @Delete('/remove/:id')
  @UseGuards(JwtGuard)
  async removeAccount(
    @CurrentUser() currentUser: UserEntity,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response = await this.authService.removeAccount(id, currentUser.id);
    return returnOrThrow(response);
  }
}
