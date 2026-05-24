import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UserEntity } from './entity/user.entity';
import { UserCacheService } from './user-cache.service';
import { HttpStatus } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('14'),
  };

  const mockUserCacheService = {
    invalidate: jest.fn(),
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
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserCacheService,
          useValue: mockUserCacheService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserEntity);

      const result = await service.getCurrentUser(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toEqual(mockUserEntity);
      }
    });

    it('should return error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentUser(999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
        expect(result.message).toBe('User not found');
      }
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB Error'));

      const result = await service.getCurrentUser(1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('updateUserDetails', () => {
    it('should update user details successfully', async () => {
      const updateDto = { name: 'Updated Name' };
      mockRepository.findOne.mockResolvedValue(mockUserEntity);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserDetails(
        1,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('success');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should return error when no fields to update', async () => {
      const updateDto = {};

      const result = await service.updateUserDetails(
        1,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
        expect(result.message).toContain('at least one field');
      }
    });

    it('should prevent user from updating other users', async () => {
      const updateDto = { name: 'Hacker Name' };
      const otherUser = { ...mockUserEntity, id: 2 };
      mockRepository.findOne.mockResolvedValue(otherUser);

      const result = await service.updateUserDetails(
        2,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should return error when user not found', async () => {
      const updateDto = { name: 'New Name' };
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserDetails(
        999,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should hash password if provided', async () => {
      const updateDto = { password: 'newpassword' };
      mockRepository.findOne.mockResolvedValue(mockUserEntity);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserDetails(
        1,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('success');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
      const updateDto = { email: 'duplicate@example.com' };
      mockRepository.findOne.mockResolvedValue(mockUserEntity);
      mockRepository.update.mockRejectedValue({ code: '23505' }); // PG unique violation

      const result = await service.updateUserDetails(
        1,
        mockUserEntity,
        updateDto,
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('already exists');
      }
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUserEntity], 1]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAllUsers({ page: 1, limit: 10 });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('should handle search filter', async () => {
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockUserEntity], 1]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAllUsers({
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(result.status).toBe('success');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('DB Error');
      });

      const result = await service.getAllUsers({ page: 1, limit: 10 });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockUserEntity);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateUserRole(1, 2, 'admin');

      expect(result.status).toBe('success');
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 2 },
        { role: 'admin' },
      );
    });

    it('should prevent user from updating own role', async () => {
      const result = await service.updateUserRole(1, 1, 'admin');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('cannot change');
      }
    });

    it('should return error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserRole(1, 999, 'admin');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should prevent updating to same role', async () => {
      const adminUser = { ...mockUserEntity, role: 'admin' };
      mockRepository.findOne.mockResolvedValue(adminUser);

      const result = await service.updateUserRole(1, 2, 'admin');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
        expect(result.message).toContain('already has the role');
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userToDelete = { ...mockUserEntity, id: 2 };
      mockRepository.findOne.mockResolvedValue(userToDelete);
      mockRepository.remove.mockResolvedValue(userToDelete);
      mockRepository.count.mockResolvedValue(2); // Multiple admins exist

      const result = await service.deleteUser(1, 2);

      expect(result.status).toBe('success');
      expect(mockRepository.remove).toHaveBeenCalledWith(userToDelete);
      expect(mockUserCacheService.invalidate).toHaveBeenCalledWith(2);
    });

    it('should prevent user from deleting themselves', async () => {
      const result = await service.deleteUser(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('cannot delete');
      }
    });

    it('should return error when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteUser(1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should prevent deleting the only admin', async () => {
      const adminUser = { ...mockUserEntity, id: 2, role: 'admin' };
      mockRepository.findOne.mockResolvedValue(adminUser);
      mockRepository.count.mockResolvedValue(1); // Only one admin

      const result = await service.deleteUser(1, 2);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('only admin');
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
