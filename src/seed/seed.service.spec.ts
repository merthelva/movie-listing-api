import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { UserEntity } from '@users/entity/user.entity';
import { Roles } from '@/common/constants/roles.constant';

describe('SeedService', () => {
  let service: SeedService;
  let configService: ConfigService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onApplicationBootstrap', () => {
    it('should skip seeding if admin already exists', async () => {
      const existingAdmin = { id: 1, email: 'admin@test.com', role: Roles.ADMIN };
      mockRepository.findOne.mockResolvedValue(existingAdmin);

      await service.onApplicationBootstrap();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: Roles.ADMIN },
      });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should skip seeding if admin credentials are not configured', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_EMAIL') return undefined;
        if (key === 'ADMIN_PASSWORD') return undefined;
        return null;
      });

      await service.onApplicationBootstrap();

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create and save admin user when no admin exists and credentials are provided', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockImplementation((key: string, defaultVal?: string) => {
        if (key === 'ADMIN_EMAIL') return 'admin@example.com';
        if (key === 'ADMIN_PASSWORD') return 'password123';
        if (key === 'ADMIN_NAME') return 'Admin';
        if (key === 'BCRYPT_SALT_ROUNDS') return '14';
        return defaultVal || null;
      });

      const createdAdmin = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: Roles.ADMIN,
      };
      mockRepository.create.mockReturnValue(createdAdmin);

      await service.onApplicationBootstrap();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: Roles.ADMIN },
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Admin',
        email: 'admin@example.com',
        password: expect.any(String),
        role: Roles.ADMIN,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdAdmin);
    });

    it('should use default admin name when not configured', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockImplementation((key: string, defaultVal?: string) => {
        if (key === 'ADMIN_EMAIL') return 'admin@example.com';
        if (key === 'ADMIN_PASSWORD') return 'password123';
        if (key === 'ADMIN_NAME') return 'Admin';
        if (key === 'BCRYPT_SALT_ROUNDS') return '14';
        return defaultVal || null;
      });

      const createdAdmin = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: Roles.ADMIN,
      };
      mockRepository.create.mockReturnValue(createdAdmin);

      await service.onApplicationBootstrap();

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Admin',
        }),
      );
    });

    it('should convert email to lowercase before saving', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockConfigService.get.mockImplementation((key: string, defaultVal?: string) => {
        if (key === 'ADMIN_EMAIL') return 'ADMIN@EXAMPLE.COM';
        if (key === 'ADMIN_PASSWORD') return 'password123';
        if (key === 'ADMIN_NAME') return 'Admin';
        if (key === 'BCRYPT_SALT_ROUNDS') return '14';
        return defaultVal || null;
      });

      const createdAdmin = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed_password',
        role: Roles.ADMIN,
      };
      mockRepository.create.mockReturnValue(createdAdmin);

      await service.onApplicationBootstrap();

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
        }),
      );
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
