import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from '@/users/entity/user.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    removeAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call service.register and return success response', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };

      const user = { id: 1, ...createUserDto } as UserEntity;
      const serviceResponse = { status: 'success', data: user };

      mockAuthService.register.mockResolvedValue(serviceResponse);

      const result = await controller.register(createUserDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });

    it('should throw error when user already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      };

      const errorResponse = {
        status: 'error',
        code: HttpStatus.FORBIDDEN,
        message: 'User already exists',
      };

      mockAuthService.register.mockResolvedValue(errorResponse);

      await expect(controller.register(createUserDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should call service.login with email and password', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const serviceResponse = {
        status: 'success',
        data: {
          accessToken: 'jwt.token',
          id: 1,
          email: 'test@example.com',
        },
      };

      mockAuthService.login.mockResolvedValue(serviceResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(result).toEqual(serviceResponse.data);
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrong' };
      const errorResponse = {
        status: 'error',
        code: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      };

      mockAuthService.login.mockResolvedValue(errorResponse);

      await expect(controller.login(loginDto)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should call service.logout with user id', async () => {
      const currentUser = { id: 1 } as UserEntity;
      const serviceResponse = {
        status: 'success',
        data: { success: true, message: 'Logged out' },
      };

      mockAuthService.logout.mockResolvedValue(serviceResponse);

      const result = await controller.logout(currentUser);

      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
      expect(result).toEqual(serviceResponse.data);
    });

    it('should throw error on logout failure', async () => {
      const currentUser = { id: 1 } as UserEntity;
      const errorResponse = {
        status: 'error',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Logout failed',
      };

      mockAuthService.logout.mockResolvedValue(errorResponse);

      await expect(controller.logout(currentUser)).rejects.toThrow();
    });
  });

  describe('removeAccount', () => {
    it('should call service.removeAccount with id and current user id', async () => {
      const currentUser = { id: 1 } as UserEntity;
      const accountId = 1;
      const serviceResponse = {
        status: 'success',
        data: { success: true, message: 'Account removed' },
      };

      mockAuthService.removeAccount.mockResolvedValue(serviceResponse);

      const result = await controller.removeAccount(currentUser, accountId);

      expect(mockAuthService.removeAccount).toHaveBeenCalledWith(accountId, 1);
      expect(result).toEqual(serviceResponse.data);
    });

    it('should throw error on unauthorized removal attempt', async () => {
      const currentUser = { id: 1 } as UserEntity;
      const accountId = 2;
      const errorResponse = {
        status: 'error',
        code: HttpStatus.UNAUTHORIZED,
        message: 'You can only delete your own account',
      };

      mockAuthService.removeAccount.mockResolvedValue(errorResponse);

      await expect(
        controller.removeAccount(currentUser, accountId),
      ).rejects.toThrow();
    });

    it('should throw error when user not found', async () => {
      const currentUser = { id: 1 } as UserEntity;
      const accountId = 999;
      const errorResponse = {
        status: 'error',
        code: HttpStatus.NOT_FOUND,
        message: 'User not found',
      };

      mockAuthService.removeAccount.mockResolvedValue(errorResponse);

      await expect(
        controller.removeAccount(currentUser, accountId),
      ).rejects.toThrow();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
