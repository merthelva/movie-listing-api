import { UserEntity } from '@users/entity/user.entity';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { LoginResponseType } from './types';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { SuccessResponseType } from '@/common/types/success-response.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<GenericResponseType<UserEntity>> {
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (foundUser) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: 'User with this email already exists',
        };
      }

      const hashedPassword = await hash(createUserDto.password, 10);
      const user = this.usersRepository.create({
        ...createUserDto,
        email: createUserDto.email.toLowerCase(),
        password: hashedPassword,
      });
      return {
        status: 'success',
        data: await this.usersRepository.save(user),
      };
    } catch (error) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while registering the user.',
      };
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<GenericResponseType<LoginResponseType>> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
      });
      if (!user) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `User with ${email} is not found`,
        };
      }

      const doPasswordsMatch = await compare(password, user.password);
      if (!doPasswordsMatch) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: 'Invalid password is provided',
        };
      }

      // Generate JWT token with user id and email in payload
      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        status: 'success',
        data: {
          accessToken,
          ...user,
        },
      };
    } catch (error) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while logging the user in.',
      };
    }
  }

  async removeAccount(
    id: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id },
      });
      if (!user) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: `User with id ${id} is not found`,
        };
      }

      await this.usersRepository.remove(user);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'The account has been removed successfully.',
        },
      };
    } catch (error) {
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while removing the user account.',
      };
    }
  }
}
