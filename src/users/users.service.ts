import { GenericResponseType } from '@/common/types/generic-response.type';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, type FindOneOptions } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SuccessResponseType } from '@/common/types/success-response.type';
import { ListUsersResponseType } from './types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
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
          message: `User with ${userId} is not found`,
        };
      }

      return {
        status: 'success',
        data: foundUser,
      };
    } catch (error) {
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
      if (
        Object.keys(updatedFields).length === 0 ||
        Object.values(updatedFields).filter(Boolean).length === 0
      ) {
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
          message: `User with ${userIdToUpdate} is not found`,
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

      const hasUserWithSameEmail =
        updatedFields.email != null &&
        (await this.usersRepository.exists({
          where: {
            email: updatedFields.email.toLowerCase(),
          },
        }));
      if (hasUserWithSameEmail) {
        return {
          code: HttpStatus.FORBIDDEN,
          status: 'error',
          message:
            'A user with this email already exists. Please choose a different email.',
        };
      }

      await this.usersRepository.update({ id: userIdToUpdate }, updatedFields);

      return {
        status: 'success',
        data: {
          success: true,
          message: 'User details have been updated successfully.',
        },
      };
    } catch (error) {
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

      const where: FindOneOptions<UserEntity>['where'] = {};

      if (search && search.trim() !== '') {
        where.name = Like(`%${search}%`);
      }

      const [paginatedUsers, totalItems] =
        await this.usersRepository.findAndCount({
          where,
          skip,
          take: limit,
        });

      return {
        status: 'success',
        data: {
          isFirstPage: page === 1,
          isLastPage: skip + paginatedUsers.length >= totalItems,
          limit,
          page,
          totalItems,
          items: paginatedUsers,
        },
      };
    } catch (error) {
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
          message: `User with ${userIdToDelete} is not found`,
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
      return {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'error',
        message: 'An error occurred while deleting the user.',
      };
    }
  }
}
