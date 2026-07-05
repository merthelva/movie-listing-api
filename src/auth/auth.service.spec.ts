import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { UserEntity } from '@/users/entity/user.entity';
import { UserCacheService } from '@/users/user-cache.service';
import { Roles } from '@/common/constants/roles.constant';
import * as bcrypt from 'bcrypt';
import * as enMessages from '@/i18n/en-US/messages.json';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    increment: jest.fn(),
    count: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUserCacheService = {
    invalidate: jest.fn(),
  };

  const mockI18nService = {
    t: jest.fn(
      (key: string) =>
        key
          .replace('messages.', '')
          .split('.')
          .reduce((obj: any, part) => obj?.[part], enMessages) ?? key,
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserCacheService,
          useValue: mockUserCacheService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      };

      const createdUser = {
        id: 1,
        ...createUserDto,
        role: Roles.USER,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue('14');
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(createUserDto);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toEqual(createdUser);
      }
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('should return error if user already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };

      mockRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.register(createUserDto);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('already exists');
      }
    });

    it('should handle registration errors', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };

      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.register(createUserDto);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: '$2b$14$hashedPassword',
        tokenVersion: 0,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('jwt.token.here');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password');

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toHaveProperty('accessToken');
        expect(result.data.id).toBe(user.id);
        expect(result.data.email).toBe(user.email);
      }
    });

    it('should return error if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.login('nonexistent@example.com', 'password');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.UNAUTHORIZED);
        expect(result.message).toContain('Invalid credentials');
      }
    });

    it('should return error if password is incorrect', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: '$2b$14$wronghashedpassword',
        tokenVersion: 0,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.login('test@example.com', 'wrongpassword');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should handle login errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.login('test@example.com', 'password');

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 });
      mockUserCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.logout(1);

      expect(result.status).toBe('success');
      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: 1 },
        'tokenVersion',
        1,
      );
      expect(mockUserCacheService.invalidate).toHaveBeenCalledWith(1);
    });

    it('should handle logout errors', async () => {
      mockRepository.increment.mockRejectedValue(new Error('DB error'));

      const result = await service.logout(1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('removeAccount', () => {
    it('should remove account successfully', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        role: Roles.USER,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockUserCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.removeAccount(1, 1);

      expect(result.status).toBe('success');
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return error if user tries to delete another account', async () => {
      const result = await service.removeAccount(2, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.UNAUTHORIZED);
        expect(result.message).toContain('only delete your own account');
      }
    });

    it('should return error if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.removeAccount(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
        expect(result.message).toContain('User not found');
      }
    });

    it('should prevent deletion of last admin account', async () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: Roles.ADMIN,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(adminUser);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.removeAccount(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.FORBIDDEN);
        expect(result.message).toContain('only admin account');
      }
    });

    it('should allow deletion of admin account if multiple admins exist', async () => {
      const adminUser = {
        id: 1,
        email: 'admin@example.com',
        role: Roles.ADMIN,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(adminUser);
      mockRepository.count.mockResolvedValue(2);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockUserCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.removeAccount(1, 1);

      expect(result.status).toBe('success');
    });

    it('should handle removeAccount errors', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        role: Roles.USER,
      } as UserEntity;

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.delete.mockRejectedValue(new Error('DB error'));

      const result = await service.removeAccount(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
