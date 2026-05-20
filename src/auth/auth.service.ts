import { UserEntity } from '@users/entity/user.entity';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { LoginResponseType } from './types';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { Roles } from '@/common/constants/roles.constant';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<GenericResponseType<UserEntity>> {
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email.toLowerCase() },
      });
      if (foundUser) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: 'User with this email already exists',
        };
      }

      const saltRounds = parseInt(
        this.configService.get('BCRYPT_SALT_ROUNDS', '14'),
        10,
      );
      const hashedPassword = await hash(createUserDto.password, saltRounds);
      const user = this.usersRepository.create({
        ...createUserDto,
        role: Roles.USER,
        email: createUserDto.email.toLowerCase(),
        password: hashedPassword,
      });
      return {
        status: 'success',
        data: await this.usersRepository.save(user),
      };
    } catch (error) {
      this.logger.error(error);
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
        where: { email: email.toLowerCase() },
      });
      if (!user) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: 'Invalid credentials',
        };
      }

      const doPasswordsMatch = await compare(password, user.password);
      if (!doPasswordsMatch) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: 'Invalid credentials',
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
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while logging the user in.',
      };
    }
  }

  async removeAccount(
    id: number,
    currentUserId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      if (id !== currentUserId) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: 'You can only delete your own account.',
        };
      }

      const user = await this.usersRepository.findOne({
        where: { id },
      });
      if (!user) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: 'User not found',
        };
      }

      await this.usersRepository.update({ id }, { deletedAt: new Date() });

      return {
        status: 'success',
        data: {
          success: true,
          message: 'The account has been removed successfully.',
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while removing the user account.',
      };
    }
  }
}
