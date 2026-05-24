import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;

  const mockHealthCheckResult = {
    status: 'ok',
    checks: {
      database: { status: 'up' },
    },
  };

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn().mockImplementation((checks) => {
        // Execute the callback functions passed to check()
        const results = checks.map((check) => check());
        return Promise.all(results).then(() => mockHealthCheckResult);
      }),
    };

    const mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result).toEqual(mockHealthCheckResult);
    });

    it('should call database ping check', async () => {
      await controller.check();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });

    it('should handle database connectivity issues', async () => {
      const errorResult = {
        status: 'error',
        checks: {
          database: { status: 'down' },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValueOnce(errorResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
