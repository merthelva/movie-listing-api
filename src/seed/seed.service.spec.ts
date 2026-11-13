import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { compare } from 'bcrypt';

import { SeedService } from './seed.service';
import { UserEntity } from '@users/entity/user.entity';
import { Roles } from '@/common/constants/roles.constant';
import { PgViolationCodes } from '@/common/constants/pg-violation-codes.constant';

describe('SeedService', () => {
  let service: SeedService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mirrors ConfigService.getOrThrow: unknown keys throw
  let configValues: Record<string, unknown>;
  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (!(key in configValues)) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return configValues[key];
    }),
  };

  const validConfig = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'password123',
    ADMIN_NAME: 'Admin',
    BCRYPT_SALT_ROUNDS: 10, // Joi enforces min 10; keeps bcrypt fast in tests
  };

  const uniqueViolation = Object.assign(new Error('duplicate key'), {
    code: PgViolationCodes.UNIQUE_VIOLATION,
  });

  beforeEach(async () => {
    configValues = { ...validConfig };
    mockRepository.create.mockImplementation((entity: object) => entity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    // resetAllMocks also drops the getOrThrow implementation: restore it
    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      if (!(key in configValues)) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return configValues[key];
    });
  });

  describe('onApplicationBootstrap', () => {
    it('skips seeding if an admin already exists', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        role: Roles.ADMIN,
      });

      await service.onApplicationBootstrap();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { role: Roles.ADMIN },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('creates and saves a hashed admin when none exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await service.onApplicationBootstrap();

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Admin',
        email: 'admin@example.com',
        password: expect.any(String) as string,
        role: Roles.ADMIN,
      });
      const [saved] = mockRepository.save.mock.calls[0] as [
        { password: string },
      ];
      expect(saved.password).not.toBe('password123');
      await expect(compare('password123', saved.password)).resolves.toBe(true);
    });

    it('lowercases the admin email before saving', async () => {
      configValues.ADMIN_EMAIL = 'ADMIN@EXAMPLE.COM';
      mockRepository.findOne.mockResolvedValue(null);

      await service.onApplicationBootstrap();

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@example.com' }),
      );
    });

    it('fails loudly (no silent skip) when required admin config is missing', async () => {
      delete configValues.ADMIN_PASSWORD;
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'ADMIN_PASSWORD',
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('treats a unique violation as success when another instance already seeded the admin', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce(null) // initial exists-check
        .mockResolvedValueOnce({ id: 1, role: Roles.ADMIN }); // re-check after race
      mockRepository.save.mockRejectedValue(uniqueViolation);

      await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('rethrows a unique violation when still no admin exists (e.g. ADMIN_EMAIL taken by a normal user)', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(uniqueViolation);

      await expect(service.onApplicationBootstrap()).rejects.toBe(
        uniqueViolation,
      );
    });

    it('rethrows any other database error', async () => {
      const dbDown = Object.assign(new Error('connection lost'), {
        code: '08006',
      });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(dbDown);

      await expect(service.onApplicationBootstrap()).rejects.toBe(dbDown);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
