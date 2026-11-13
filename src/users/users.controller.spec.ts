import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entity/user.entity';
import type { RoleType } from '@/common/types/roles.type';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getCurrentUser: jest.fn(),
    updateUserDetails: jest.fn(),
    getAllUsers: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUserEntity: UserEntity = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    role: 'user',
    createdAt: new Date(),
  } as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user data on success', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue({
        status: 'success',
        data: mockUserEntity,
      });

      const result = await controller.getCurrentUser(mockUserEntity);

      expect(mockUsersService.getCurrentUser).toHaveBeenCalledWith(
        mockUserEntity.id,
      );
      expect(result).toEqual(mockUserEntity);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersService.getCurrentUser.mockResolvedValue({
        code: 404,
        status: 'error',
        message: 'User not found',
      });

      await expect(controller.getCurrentUser(mockUserEntity)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserDetails', () => {
    it('should update user details and return success data', async () => {
      const updateDto = {
        name: 'Updated Name',
        currentPassword: 'current-password',
      };
      const successData = {
        success: true,
        message: 'User details have been updated successfully.',
      };
      mockUsersService.updateUserDetails.mockResolvedValue({
        status: 'success',
        data: successData,
      });

      const result = await controller.updateUserDetails(
        mockUserEntity,
        mockUserEntity.id,
        updateDto,
      );

      expect(mockUsersService.updateUserDetails).toHaveBeenCalledWith(
        mockUserEntity.id,
        mockUserEntity,
        updateDto,
      );
      expect(result).toEqual(successData);
    });

    it('should throw UnauthorizedException when updating other user', async () => {
      const updateDto = {
        name: 'Hacker Name',
        currentPassword: 'current-password',
      };
      mockUsersService.updateUserDetails.mockResolvedValue({
        code: 401,
        status: 'error',
        message: 'You are not allowed to update details of other users.',
      });

      await expect(
        controller.updateUserDetails(mockUserEntity, 999, updateDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users on success', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const listData = {
        items: [mockUserEntity],
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
      };
      mockUsersService.getAllUsers.mockResolvedValue({
        status: 'success',
        data: listData,
      });

      const result = await controller.getAllUsers(paginationDto);

      expect(mockUsersService.getAllUsers).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(listData);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role and return success data', async () => {
      const updateRoleDto = { role: 'admin' } as { role: RoleType };
      const successData = {
        success: true,
        message: 'User role has been updated successfully.',
      };
      mockUsersService.updateUserRole.mockResolvedValue({
        status: 'success',
        data: successData,
      });

      const result = await controller.updateUserRole(
        mockUserEntity,
        2,
        updateRoleDto,
      );

      expect(mockUsersService.updateUserRole).toHaveBeenCalledWith(
        mockUserEntity.id,
        2,
        updateRoleDto.role,
      );
      expect(result).toEqual(successData);
    });

    it('should throw ForbiddenException when preventing self role update', async () => {
      const updateRoleDto = { role: 'admin' } as { role: RoleType };
      mockUsersService.updateUserRole.mockResolvedValue({
        code: 403,
        status: 'error',
        message: 'User cannot change (his/her) own role.',
      });

      await expect(
        controller.updateUserRole(
          mockUserEntity,
          mockUserEntity.id,
          updateRoleDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success data', async () => {
      const successData = {
        success: true,
        message: 'User has been deleted successfully.',
      };
      mockUsersService.deleteUser.mockResolvedValue({
        status: 'success',
        data: successData,
      });

      const result = await controller.deleteUser(mockUserEntity, 2);

      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(
        mockUserEntity.id,
        2,
      );
      expect(result).toEqual(successData);
    });

    it('should throw ForbiddenException when preventing self deletion', async () => {
      mockUsersService.deleteUser.mockResolvedValue({
        code: 403,
        status: 'error',
        message: 'User cannot delete (him/her)self.',
      });

      await expect(
        controller.deleteUser(mockUserEntity, mockUserEntity.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
