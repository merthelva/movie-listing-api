import { GenericResponseType } from '@/common/types/generic-response.type';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { ListUsersResponseType } from './types';
import { PgViolationCodes } from '@/common/constants/pg-violation-codes.constant';
import { hasNoUpdateFields } from '@/common/utils/has-no-update-fields.utils';
import { returnPaginatedData } from '@/common/utils/return-paginated-data.utils';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async getCurrentUser(
    userId: number,
  ): Promise<GenericResponseType<UserEntity>> {
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: 'User not found',
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
        message: 'An error occurred while getting the user details.',
      };
    }
  }

  async updateUserDetails(
    userIdToUpdate: number,
    currentUser: UserEntity,
    updatedFields: UpdateUserDto,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      if (hasNoUpdateFields(updatedFields)) {
        return {
          code: HttpStatus.BAD_REQUEST,
          status: 'error',
          message: 'Please provide at least one field to update.',
        };
      }

      const foundUser = await this.usersRepository.findOne({
        where: { id: userIdToUpdate },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: 'User not found',
        };
      }

      if (currentUser.id !== userIdToUpdate) {
        return {
          code: HttpStatus.UNAUTHORIZED,
          status: 'error',
          message:
            'You are not allowed to update details of other users. Please provide the \"id\" for the current user as the path parameter',
        };
      }

      if (
        updatedFields.email?.trim().toLowerCase() ===
        foundUser.email.trim().toLowerCase()
      ) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'Please provide a different email to update. The provided email is the same as the current email.',
        };
      }

      const transformedFields = {
        ...updatedFields,
      };

      if (updatedFields.password) {
        const saltRounds = this.configService.get<number>(
          'BCRYPT_SALT_AMOUNT',
          14,
        );
        transformedFields.password = await hash(
          updatedFields.password,
          saltRounds,
        );
      }

      if (updatedFields.email) {
        transformedFields.email = updatedFields.email.toLowerCase();
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
            message:
              'A user with this email already exists. Please choose a different email.',
          };
        }
        throw dbErr;
      }

      return {
        status: 'success',
        data: {
          success: true,
          message: 'User details have been updated successfully.',
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while updating the user details.',
      };
    }
  }

  async getAllUsers(
    paginationDto?: PaginationDto,
  ): Promise<GenericResponseType<ListUsersResponseType>> {
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
        message: 'An error occurred while getting the users.',
      };
    }
  }

  async deleteUser(
    currentUserId: number,
    userIdToDelete: number,
  ): Promise<GenericResponseType<SuccessResponseType>> {
    try {
      if (currentUserId === userIdToDelete) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'User cannot delete (him/her)self. In order to delete the current user, please use /auth/remove/:id endpoint instead.',
        };
      }

      const foundUser = await this.usersRepository.findOne({
        where: { id: userIdToDelete },
      });
      if (!foundUser) {
        return {
          code: HttpStatus.NOT_FOUND,
          status: 'error',
          message: 'User not found',
        };
      }

      await this.usersRepository.remove(foundUser);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'User has been deleted successfully.',
        },
      };
    } catch (error) {
      this.logger.error(error);
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while deleting the user.',
      };
    }
  }
}
