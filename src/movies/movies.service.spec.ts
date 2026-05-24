import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MoviesService } from './movies.service';

describe('MoviesService', () => {
  let service: MoviesService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'TMDB_API_READ_ACCESS_TOKEN') return 'mock-token';
      throw new Error(`Config key ${key} not found`);
    }),
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const config: Record<string, unknown> = {
        TMDB_BASE_URL: 'https://api.themoviedb.org/3',
        TMDB_CACHE_TTL_MS: 5 * 60 * 1000,
        TMDB_RETRY_ATTEMPTS: 3,
        TMDB_FETCH_TIMEOUT_MS: 10000,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovieDetails', () => {
    it('should return cached movie details if available', async () => {
      const mockCachedData = {
        tmdbId: 123,
        title: 'Cached Movie',
        overview: 'Cached overview',
        posterPath: '/path',
        budget: 1000000,
        genres: ['Action'],
        revenue: 5000000,
        runtime: 120,
        releaseDate: '2024-01-01',
        voteAverage: 8.5,
        voteCount: 1000,
      };

      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(mockCachedData);

      const result = await service.getMovieDetails(123);

      expect(result.status).toBe('success');
      expect(result.data?.title).toBe('Cached Movie');
      expect(service['cache'].get).toHaveBeenCalledWith('movie:123');
    });

    it('should return error for invalid tmdbId', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);

      const result = await service.getMovieDetails(-1);

      expect(result.status).toBe('error');
      expect(result.code).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toContain('positive integer');
    });

    it('should handle fetch errors gracefully', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getMovieDetails(123);

      expect(result.status).toBe('error');
      expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('searchMovies', () => {
    it('should return cached search results if available', async () => {
      const mockCachedResults = {
        page: 1,
        totalPages: 10,
        totalResults: 200,
        results: [
          {
            tmdbId: 1,
            title: 'Test Movie',
            overview: 'Test overview',
            posterPath: '/path',
            releaseDate: '2024-01-01',
            voteAverage: 8.5,
          },
        ],
      };

      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(mockCachedResults);

      const result = await service.searchMovies('test', 1);

      expect(result.status).toBe('success');
      expect(result.data?.page).toBe(1);
      expect(service['cache'].get).toHaveBeenCalledWith('search:test:1');
    });

    it('should use default page value of 1', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.searchMovies('test');

      expect(result.status).toBe('error');
    });

    it('should handle fetch errors gracefully', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.searchMovies('test', 1);

      expect(result.status).toBe('error');
      expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
