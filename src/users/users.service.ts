import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { compare, hash } from 'bcrypt';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';

import { Roles } from '@/common/constants/roles.constant';
import { PgViolationCodes } from '@/common/constants/pg-violation-codes.constant';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { GenericResponseType } from '@/common/types/generic-response.type';
import { RoleType } from '@/common/types/roles.type';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { returnPaginatedData } from '@/common/utils/return-paginated-data.utils';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entity/user.entity';
import { ListUsersResponseType } from './types';
import { UserCacheService } from './user-cache.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
    private userCacheService: UserCacheService,
    private i18n: I18nService,
  ) {}

  async getCurrentUser(
    userId: number,
  ): Promise<GenericResponseType<UserEntity>> {
    const lang = I18nContext.current()?.lang;
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.users.USER_NOT_FOUND', { lang }),
        };
      }

      return {
        status: 'success',
        data: foundUser,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.users.GET_USER_ERROR', { lang }),
      };
    }
  }

  async updateUserDetails(
    userIdToUpdate: number,
    currentUser: UserEntity,
    updatedFields: UpdateUserDto,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      // Note that `UpdateUserDto` has been updated in the previous commit.
      // Now, `currentPassword` field exists and it is required. So, `hasNoUpdateFields`
      // means that there is only one field defined in `updatedFields` object
      // and it is `currentPassword`. There is no need here for `hasNoUpdateFields` utility
      // function defined in "@/common/utils/has-no-update-fields.utils" anymore.
      const hasNoUpdateFields =
        (Object.keys(updatedFields).length === 1 ||
          Object.values(updatedFields).filter(Boolean).length === 1) &&
        updatedFields.currentPassword !== undefined;

      if (hasNoUpdateFields) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: this.i18n.t('messages.users.NO_UPDATE_FIELDS', { lang }),
        };
      }

      if (currentUser.id !== userIdToUpdate) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: this.i18n.t('messages.users.CANNOT_UPDATE_OTHER_USER', {
            lang,
          }),
        };
      }

      const foundUser = await this.usersRepository.findOne({
        where: { id: userIdToUpdate },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.users.USER_NOT_FOUND', { lang }),
        };
      }

      const doPasswordsMatch = await compare(
        updatedFields.currentPassword,
        foundUser.password,
      );
      if (!doPasswordsMatch) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message: this.i18n.t('messages.auth.INVALID_CREDENTIALS', { lang }),
        };
      }

      if (
        updatedFields.email?.trim().toLowerCase() ===
        foundUser.email.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.users.SAME_EMAIL', { lang }),
        };
      }

      if (
        updatedFields.name?.trim().toLowerCase() ===
        foundUser.name.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.users.SAME_NAME', { lang }),
        };
      }

      const transformedFields = {
        name: updatedFields.name,
        email: updatedFields.email,
        password: updatedFields.newPassword,
      };

      if (updatedFields.newPassword) {
        const saltRounds =
          this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
        transformedFields.password = await hash(
          updatedFields.newPassword,
          saltRounds,
        );
      }

      if (updatedFields.email) {
        transformedFields.email = updatedFields.email.toLowerCase();
      }

      if (updatedFields.name) {
        transformedFields.name = updatedFields.name;
      }

      try {
        await this.usersRepository.update(
          { id: userIdToUpdate },
          transformedFields,
        );
      } catch (dbErr: unknown) {
        const pgErr = dbErr as { code?: string };
        if (pgErr.code === PgViolationCodes.UNIQUE_VIOLATION) {
          return {
            code: HttpStatus.FORBIDDEN,
            status: 'error',
            message: this.i18n.t('messages.users.EMAIL_ALREADY_EXISTS', {
              lang,
            }),
          };
        }
        throw dbErr;
      }

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.users.UPDATE_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.users.UPDATE_ERROR', { lang }),
      };
    }
  }

  async getAllUsers(
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUsersResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      const { page = 1, limit = 10, search } = paginationDto || {};
      const skip = (page - 1) * limit;

      const qb = this.usersRepository
        .createQueryBuilder('user')
        .skip(skip)
        .take(limit);

      if (search?.trim()) {
        qb.where('user.name LIKE :search', { search: `%${search}%` });
      }

      const [paginatedUsers, totalItems] = await qb.getManyAndCount();

      return {
        status: 'success',
        data: returnPaginatedData({
          items: paginatedUsers,
          totalItems,
          page,
          limit,
        }),
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.users.GET_USERS_ERROR', { lang }),
      };
    }
  }

  async updateUserRole(
    currentUserId: number,
    userIdToUpdate: number,
    newRole: RoleType,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      if (currentUserId === userIdToUpdate) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.users.CANNOT_CHANGE_OWN_ROLE', {
            lang,
          }),
        };
      }

      const foundUser = await this.usersRepository.findOne({
        where: { id: userIdToUpdate },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.users.USER_NOT_FOUND', { lang }),
        };
      }

      if (foundUser.role === newRole) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: this.i18n.t('messages.users.ROLE_ALREADY_SET', {
            lang,
            args: { role: newRole },
          }),
        };
      }

      await this.usersRepository.update(
        { id: userIdToUpdate },
        { role: newRole },
      );

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.users.UPDATE_ROLE_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.users.UPDATE_ROLE_ERROR', { lang }),
      };
    }
  }

  async deleteUser(
    currentUserId: number,
    userIdToDelete: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    const lang = I18nContext.current()?.lang;
    try {
      if (currentUserId === userIdToDelete) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message: this.i18n.t('messages.users.CANNOT_DELETE_SELF', { lang }),
        };
      }

      const foundUser = await this.usersRepository.findOne({
        where: { id: userIdToDelete },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: this.i18n.t('messages.users.USER_NOT_FOUND', { lang }),
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
            message: this.i18n.t('messages.users.ONLY_ADMIN_CANNOT_DELETE', {
              lang,
            }),
          };
        }
      }

      await this.usersRepository.remove(foundUser);
      this.userCacheService.invalidate(userIdToDelete);

      return {
        status: 'success',
        data: {
          success: true,
          message: this.i18n.t('messages.users.DELETE_SUCCESS', { lang }),
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: this.i18n.t('messages.users.DELETE_ERROR', { lang }),
      };
    }
  }
}
