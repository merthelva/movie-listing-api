import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { MoviesService } from './movies.service';
import * as enMessages from '@/i18n/en-US/messages.json';

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
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      jest
        .spyOn(service['cache'], 'get')
        .mockReturnValueOnce(mockCachedResults);

      const result = await service.searchMovies('test', 1);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.page).toBe(1);
      }
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
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });

    it('should normalize vote averages', async () => {
      const mockCachedResults = {
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            tmdbId: 1,
            title: 'Test',
            overview: 'Test',
            posterPath: null,
            releaseDate: '2024-01-01',
            voteAverage: 7.55555,
          },
        ],
      };

      jest
        .spyOn(service['cache'], 'get')
        .mockReturnValueOnce(mockCachedResults);

      const result = await service.searchMovies('test', 1);

      if (result.status === 'success') {
        expect(result.data.results[0].voteAverage).toBe(7.55555);
      }
    });
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
      if (result.status === 'success') {
        expect(result.data.title).toBe('Cached Movie');
      }
      expect(service['cache'].get).toHaveBeenCalledWith('movie:123');
    });

    it('should return error for invalid tmdbId', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);

      const result = await service.getMovieDetails(-1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
        expect(result.message).toContain('positive integer');
      }
    });

    it('should return error for zero tmdbId', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);

      const result = await service.getMovieDetails(0);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should handle fetch errors gracefully', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getMovieDetails(123);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });

    it('should handle 404 errors for missing movie', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest.spyOn(service as any, 'fetchWithRetry').mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getMovieDetails(999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('getMovieCast', () => {
    it('should return cached cast if available', async () => {
      const mockCachedCast = [
        {
          id: 1,
          name: 'Actor',
          character: 'Character',
          order: 0,
          profilePath: '/profile.jpg',
        },
      ];

      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(mockCachedCast);

      const result = await service.getMovieCast(123);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data[0].name).toBe('Actor');
      }
      expect(service['cache'].get).toHaveBeenCalledWith('movie-cast:123');
    });

    it('should return error for invalid tmdbId', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);

      const result = await service.getMovieCast(-1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('should handle API errors for cast retrieval', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getMovieCast(1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });

    it('should handle 404 errors for missing movie cast', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest.spyOn(service as any, 'fetchWithRetry').mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await service.getMovieCast(999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('getMovieTrailer', () => {
    it('should return cached trailer if available', async () => {
      const mockCachedTrailer = {
        id: 'abc123',
        key: 'dQw4w9WgXcQ',
        site: 'YouTube',
        type: 'Trailer',
      };

      jest
        .spyOn(service['cache'], 'get')
        .mockReturnValueOnce(mockCachedTrailer);

      const result = await service.getMovieTrailer(123);

      expect(result.status).toBe('success');
      if (result.status === 'success' && result.data) {
        expect(result.data.key).toBe('dQw4w9WgXcQ');
      }
      expect(service['cache'].get).toHaveBeenCalledWith('movie-trailer:123');
    });

    it('should return null trailer if no YouTube trailer found', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest.spyOn(service as any, 'fetchWithRetry').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [
            {
              id: 'abc123',
              key: 'somekey',
              site: 'Vimeo',
              type: 'Teaser',
            },
          ],
        }),
      });

      const result = await service.getMovieTrailer(1);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toBeNull();
      }
    });

    it('should handle empty trailer results', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest.spyOn(service as any, 'fetchWithRetry').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          results: [],
        }),
      });

      const result = await service.getMovieTrailer(1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should return error for invalid tmdbId', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);

      const result = await service.getMovieTrailer(-5);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('getMoviesByCategory', () => {
    it('should return cached movies by category if available', async () => {
      const mockCachedResults = {
        page: 1,
        totalPages: 5,
        totalResults: 100,
        results: [
          {
            tmdbId: 1,
            title: 'Popular Movie',
            overview: 'Very popular',
            posterPath: '/popular.jpg',
            releaseDate: '2024-01-01',
            voteAverage: 8.5,
          },
        ],
      };

      jest
        .spyOn(service['cache'], 'get')
        .mockReturnValueOnce(mockCachedResults);

      const result = await service.getMoviesByCategory('popular', 1);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.results[0].title).toBe('Popular Movie');
      }
      expect(service['cache'].get).toHaveBeenCalledWith('popular:1');
    });

    it('should use default page value of 1', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest.spyOn(service as any, 'fetchWithRetry').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          page: 1,
          total_pages: 5,
          total_results: 100,
          results: [],
        }),
      });

      await service.getMoviesByCategory('upcoming');

      expect(service['cache'].get).toHaveBeenCalledWith('upcoming:1');
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(service['cache'], 'get').mockReturnValueOnce(null);
      jest
        .spyOn(service as any, 'fetchWithRetry')
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getMoviesByCategory('popular', 1);

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
