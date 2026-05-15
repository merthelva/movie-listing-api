import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { LoginUserDto } from '@users/dto/login-user.dto';
import {
  UserLoginResponseDto,
  UserRegisterResponseDto,
} from '@/users/dto/user-response.dto';
import { throwError } from '@/common/utils/throw-error';
import { Serialize } from '@/common/interceptors/serialize.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Serialize(UserRegisterResponseDto)
  async register(@Body() createUserDto: CreateUserDto) {
    const response = await this.authService.register(createUserDto);
    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }

  @Post('login')
  @Serialize(UserLoginResponseDto)
  async login(@Body() { email, password }: LoginUserDto) {
    const response = await this.authService.login(email, password);

    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }

  @Delete('/remove/:id')
  async removeAccount(@Param('id', ParseIntPipe) id: number) {
    const response = await this.authService.removeAccount(id);

    if (response.status === 'error') {
      return throwError({
        statusCode: response.code,
        message: response.message,
      });
    }

    return response.data;
  }
}
