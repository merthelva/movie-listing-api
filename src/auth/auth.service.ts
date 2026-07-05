import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { compare, hash } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { Roles } from '@/common/constants/roles.constant';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UserEntity } from '@/users/entity/user.entity';
import { UserCacheService } from '@/users/user-cache.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userCacheService: UserCacheService,
    private i18n: I18nService,
  ) {}

  async register(
    createUserDto: CreateUserDto,
  ): Promise<GenericResponseType<UserEntity>> {
    const lang = I18nContext.current()?.lang;
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email.toLowerCase() },
      });
      if (foundUser) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.auth.USER_ALREADY_EXISTS', { lang }),
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
        message: this.i18n.t('messages.auth.REGISTER_ERROR', { lang }),
      };
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<GenericResponseType<UserEntity & { accessToken: string }>> {
    const lang = I18nContext.current()?.lang;
    try {
      const user = await this.usersRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (!user) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: this.i18n.t('messages.auth.INVALID_CREDENTIALS', { lang }),
        };
      }

      const doPasswordsMatch = await compare(password, user.password);
      if (!doPasswordsMatch) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: this.i18n.t('messages.auth.INVALID_CREDENTIALS', { lang }),
        };
      }

      const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        tokenVersion: user.tokenVersion,
      });

      return {
        status: 'success',
        data: {
          accessToken,
          ...user,
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.auth.LOGIN_ERROR', { lang }),
      };
    }
  }

  async logout(
    userId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
      this.userCacheService.invalidate(userId);
      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.auth.LOGOUT_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.auth.LOGOUT_ERROR', { lang }),
      };
    }
  }

  async removeAccount(
    id: number,
    currentUserId: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      if (id !== currentUserId) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: this.i18n.t('messages.auth.DELETE_OWN_ACCOUNT_ONLY', {
            lang,
          }),
        };
      }

      const foundUser = await this.usersRepository.findOne({ where: { id } });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.auth.USER_NOT_FOUND', { lang }),
        };
      }

      if (foundUser.role === Roles.ADMIN) {
        const adminCount = await this.usersRepository.count({
          where: { role: Roles.ADMIN },
        });
        if (adminCount === 1) {
          return {
            code: HttpStatus.FORBIDDEN,
            status: 'error',
            message: this.i18n.t('messages.auth.ONLY_ADMIN_CANNOT_DELETE', {
              lang,
            }),
          };
        }
      }

      await this.usersRepository.delete({ id });
      this.userCacheService.invalidate(id);

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.auth.ACCOUNT_REMOVED_SUCCESS', {
            lang,
          }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.auth.REMOVE_ACCOUNT_ERROR', { lang }),
      };
    }
  }
}
