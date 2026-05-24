import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { GenericResponseType } from '@/common/types/generic-response.type';
import type {
  MovieDetailsType,
  SearchMovieResultType,
} from '@movies/types';

describe('MoviesController', () => {
  let controller: MoviesController;

  const mockMoviesService = {
    searchMovies: jest.fn(),
    getMovieDetails: jest.fn(),
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
    it('should call service and return search results', async () => {
      const mockData: SearchMovieResultType = {
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

      const mockSearchResult: GenericResponseType<SearchMovieResultType> = {
        status: 'success',
        data: mockData,
      };

      mockMoviesService.searchMovies.mockResolvedValue(mockSearchResult);

      const searchDto: SearchMoviesDto = { query: 'test', page: 1 };
      const result = await controller.searchMovies(searchDto);

      expect(mockMoviesService.searchMovies).toHaveBeenCalledWith(
        'test',
        1,
      );
      expect(result).toEqual(mockData);
    });

    it('should throw on search errors', async () => {
      const mockErrorResult: GenericResponseType<SearchMovieResultType> = {
        status: 'error',
        code: 500,
        message: 'An error occurred while fetching movies from TMDB.',
      };

      mockMoviesService.searchMovies.mockResolvedValue(mockErrorResult);

      const searchDto: SearchMoviesDto = { query: 'test', page: 1 };

      await expect(controller.searchMovies(searchDto)).rejects.toThrow();
    });

    it('should use page parameter from dto', async () => {
      const mockData: SearchMovieResultType = {
        page: 2,
        totalPages: 10,
        totalResults: 200,
        results: [],
      };

      const mockSearchResult: GenericResponseType<SearchMovieResultType> = {
        status: 'success',
        data: mockData,
      };

      mockMoviesService.searchMovies.mockResolvedValue(mockSearchResult);

      const searchDto: SearchMoviesDto = { query: 'test', page: 2 };
      await controller.searchMovies(searchDto);

      expect(mockMoviesService.searchMovies).toHaveBeenCalledWith('test', 2);
    });
  });

  describe('getMovieDetails', () => {
    it('should call service and return movie details', async () => {
      const mockData: MovieDetailsType = {
        tmdbId: 123,
        title: 'Test Movie',
        overview: 'Test overview',
        posterPath: '/path',
        budget: 1000000,
        genres: ['Action', 'Drama'],
        revenue: 5000000,
        runtime: 120,
        releaseDate: '2024-01-01',
        voteAverage: 8.5,
        voteCount: 1000,
      };

      const mockMovieDetails: GenericResponseType<MovieDetailsType> = {
        status: 'success',
        data: mockData,
      };

      mockMoviesService.getMovieDetails.mockResolvedValue(mockMovieDetails);

      const result = await controller.getMovieDetails(123);

      expect(mockMoviesService.getMovieDetails).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockData);
    });

    it('should throw on movie not found error', async () => {
      const mockErrorResult: GenericResponseType<MovieDetailsType> = {
        status: 'error',
        code: 404,
        message: 'Movie with id 999 is not found in TMDB.',
      };

      mockMoviesService.getMovieDetails.mockResolvedValue(mockErrorResult);

      await expect(controller.getMovieDetails(999)).rejects.toThrow();
    });

    it('should throw on invalid tmdbId', async () => {
      const mockErrorResult: GenericResponseType<MovieDetailsType> = {
        status: 'error',
        code: 400,
        message: 'Invalid "tmdbId" value is provided. It must be a positive integer.',
      };

      mockMoviesService.getMovieDetails.mockResolvedValue(mockErrorResult);

      await expect(controller.getMovieDetails(-1)).rejects.toThrow();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
