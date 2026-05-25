import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import type {
  SearchMovieResultType,
  MovieDetailsType,
  MovieCastResponseType,
  MovieTrailerType,
} from './types';

describe('MoviesController', () => {
  let controller: MoviesController;

  const mockMovieSearchResult: SearchMovieResultType = {
    page: 1,
    totalPages: 10,
    totalResults: 100,
    results: [
      {
        tmdbId: 1,
        title: 'Test Movie',
        overview: 'A test movie',
        posterPath: '/path.jpg',
        releaseDate: '2024-01-01',
        voteAverage: 7.5,
      },
    ],
  };

  const mockMovieDetails: MovieDetailsType = {
    tmdbId: 1,
    title: 'Test Movie',
    overview: 'A test movie',
    posterPath: '/path.jpg',
    budget: 100000,
    genres: ['Action', 'Drama'],
    revenue: 500000,
    runtime: 120,
    releaseDate: '2024-01-01',
    voteAverage: 7.5,
    voteCount: 1000,
  };

  const mockMovieCast: MovieCastResponseType['cast'] = [
    {
      id: 1,
      name: 'Actor Name',
      character: 'Character Name',
      order: 0,
      profilePath: '/profile.jpg',
    },
  ];

  const mockMovieTrailer: MovieTrailerType = {
    id: 'abc123',
    key: 'dQw4w9WgXcQ',
    site: 'YouTube',
    type: 'Trailer',
  };

  const mockMoviesService = {
    searchMovies: jest.fn(),
    getMovieDetails: jest.fn(),
    getMovieCast: jest.fn(),
    getMovieTrailer: jest.fn(),
    getMoviesByCategory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMovies', () => {
    it('should call service searchMovies and return result', async () => {
      const searchDto = { query: 'test', page: 1 };
      mockMoviesService.searchMovies.mockResolvedValue({
        status: 'success',
        data: mockMovieSearchResult,
      });

      const result = await controller.searchMovies(searchDto);

      expect(mockMoviesService.searchMovies).toHaveBeenCalledWith('test', 1);
      expect(result).toEqual(mockMovieSearchResult);
    });

    it('should throw on service errors', async () => {
      const searchDto = { query: 'test', page: 1 };
      mockMoviesService.searchMovies.mockResolvedValue({
        status: 'error',
        code: 404,
        message: 'No results found',
      });

      await expect(controller.searchMovies(searchDto)).rejects.toThrow();
    });

    it('should pass page parameter correctly', async () => {
      const searchDto = { query: 'test', page: 2 };
      mockMoviesService.searchMovies.mockResolvedValue({
        status: 'success',
        data: { ...mockMovieSearchResult, page: 2 },
      });

      const result = await controller.searchMovies(searchDto);

      expect(mockMoviesService.searchMovies).toHaveBeenCalledWith('test', 2);
      expect(result.page).toBe(2);
    });
  });

  describe('getMovieDetails', () => {
    it('should call service getMovieDetails and return result', async () => {
      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'success',
        data: mockMovieDetails,
      });

      const result = await controller.getMovieDetails(1);

      expect(mockMoviesService.getMovieDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMovieDetails);
    });

    it('should throw on invalid tmdbId errors', async () => {
      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'error',
        code: 400,
        message: 'Invalid tmdbId',
      });

      await expect(controller.getMovieDetails(-1)).rejects.toThrow();
    });

    it('should throw on not found errors', async () => {
      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'error',
        code: 404,
        message: 'Movie not found',
      });

      await expect(controller.getMovieDetails(999999)).rejects.toThrow();
    });
  });

  describe('getMovieCast', () => {
    it('should call service getMovieCast and return cast data', async () => {
      mockMoviesService.getMovieCast.mockResolvedValue({
        status: 'success',
        data: mockMovieCast,
      });

      const result = await controller.getMovieCast(1);

      expect(mockMoviesService.getMovieCast).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMovieCast);
    });

    it('should throw on cast fetch errors', async () => {
      mockMoviesService.getMovieCast.mockResolvedValue({
        status: 'error',
        code: 500,
        message: 'Failed to fetch cast',
      });

      await expect(controller.getMovieCast(1)).rejects.toThrow();
    });

    it('should throw on invalid tmdbId', async () => {
      mockMoviesService.getMovieCast.mockResolvedValue({
        status: 'error',
        code: 400,
        message: 'Invalid tmdbId',
      });

      await expect(controller.getMovieCast(-1)).rejects.toThrow();
    });
  });

  describe('getMovieTrailer', () => {
    it('should call service getMovieTrailer and return trailer data', async () => {
      mockMoviesService.getMovieTrailer.mockResolvedValue({
        status: 'success',
        data: mockMovieTrailer,
      });

      const result = await controller.getMovieTrailer(1);

      expect(mockMoviesService.getMovieTrailer).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMovieTrailer);
    });

    it('should throw on trailer not found error', async () => {
      mockMoviesService.getMovieTrailer.mockResolvedValue({
        status: 'error',
        code: 404,
        message: 'No trailer found',
      });

      await expect(controller.getMovieTrailer(1)).rejects.toThrow();
    });

    it('should throw on invalid tmdbId', async () => {
      mockMoviesService.getMovieTrailer.mockResolvedValue({
        status: 'error',
        code: 400,
        message: 'Invalid tmdbId',
      });

      await expect(controller.getMovieTrailer(0)).rejects.toThrow();
    });
  });

  describe('getMoviesByCategory', () => {
    it('should call service getMoviesByCategory and return results', async () => {
      const queryDto = { page: 1 };
      mockMoviesService.getMoviesByCategory.mockResolvedValue({
        status: 'success',
        data: mockMovieSearchResult,
      });

      const result = await controller.getMoviesByCategory(queryDto, 'popular');

      expect(mockMoviesService.getMoviesByCategory).toHaveBeenCalledWith(
        'popular',
        1,
      );
      expect(result).toEqual(mockMovieSearchResult);
    });

    it('should handle pagination correctly', async () => {
      const queryDto = { page: 2 };
      const resultWithPage2 = { ...mockMovieSearchResult, page: 2 };
      mockMoviesService.getMoviesByCategory.mockResolvedValue({
        status: 'success',
        data: resultWithPage2,
      });

      const result = await controller.getMoviesByCategory(queryDto, 'popular');

      expect(mockMoviesService.getMoviesByCategory).toHaveBeenCalledWith(
        'popular',
        2,
      );
      expect(result.page).toBe(2);
    });

    it('should use correct category parameter', async () => {
      const queryDto = { page: 1 };
      mockMoviesService.getMoviesByCategory.mockResolvedValue({
        status: 'success',
        data: mockMovieSearchResult,
      });

      await controller.getMoviesByCategory(queryDto, 'upcoming');

      expect(mockMoviesService.getMoviesByCategory).toHaveBeenCalledWith(
        'upcoming',
        1,
      );
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
