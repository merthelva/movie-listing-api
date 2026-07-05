import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { WatchlistsService } from './watchlists.service';
import { WatchlistEntity } from './entity/watchlist.entity';
import { MovieEntity } from '@/movies/entity/movie.entity';
import { MoviesService } from '@/movies/movies.service';
import * as enMessages from '@/i18n/en-US/messages.json';

describe('WatchlistsService', () => {
  let service: WatchlistsService;

  const mockWatchlistRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    update: jest.fn(),
    manager: {
      transaction: jest.fn(),
      query: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  const mockMovieRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMoviesService = {
    getMovieDetails: jest.fn(),
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
        WatchlistsService,
        {
          provide: getRepositoryToken(WatchlistEntity),
          useValue: mockWatchlistRepository,
        },
        {
          provide: getRepositoryToken(MovieEntity),
          useValue: mockMovieRepository,
        },
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<WatchlistsService>(WatchlistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserWatchlist', () => {
    it('should create a new watchlist for user', async () => {
      const mockWatchlist = { id: 1, name: 'My List', userId: 1 };
      mockWatchlistRepository.create.mockReturnValue(mockWatchlist);
      mockWatchlistRepository.save.mockResolvedValue(mockWatchlist);

      const result = await service.createUserWatchlist(1, {
        name: 'My List',
      });

      expect(mockWatchlistRepository.create).toHaveBeenCalledWith({
        name: 'My List',
        user: { id: 1 },
      });
      expect(mockWatchlistRepository.save).toHaveBeenCalled();
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toEqual(mockWatchlist);
      }
    });

    it('should return error on unique violation', async () => {
      const error = new Error('Unique violation');
      (error as any).code = '23505';
      mockWatchlistRepository.create.mockReturnValue({});
      mockWatchlistRepository.save.mockRejectedValue(error);

      const result = await service.createUserWatchlist(1, {
        name: 'Duplicate List',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
        expect(result.message).toContain('already exists');
      }
    });

    it('should handle unexpected errors', async () => {
      mockWatchlistRepository.create.mockReturnValue({});
      mockWatchlistRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.createUserWatchlist(1, {
        name: 'List',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('deleteUserWatchlist', () => {
    it('should delete user watchlist', async () => {
      const mockWatchlist = { id: 1, name: 'My List' };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);
      mockWatchlistRepository.remove.mockResolvedValue({});

      const result = await service.deleteUserWatchlist(1, 1);

      expect(mockWatchlistRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 1 } },
      });
      expect(mockWatchlistRepository.remove).toHaveBeenCalledWith(
        mockWatchlist,
      );
      expect(result.status).toBe('success');
    });

    it('should return not found error', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteUserWatchlist(1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
        expect(result.message).toContain('not found');
      }
    });

    it('should handle database errors', async () => {
      mockWatchlistRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.deleteUserWatchlist(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('getAllUserWatchlists', () => {
    it('should return paginated watchlists', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            { id: 1, name: 'List 1', createdAt: new Date() },
            { id: 2, name: 'List 2', createdAt: new Date() },
          ],
          2,
        ]),
      };
      mockWatchlistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAllUserWatchlists(1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.items).toHaveLength(2);
      }
    });

    it('should use default pagination', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockWatchlistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAllUserWatchlists(1);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.status).toBe('success');
    });

    it('should handle database errors', async () => {
      mockWatchlistRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await service.getAllUserWatchlists(1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('getAllUserWatchlistMovies', () => {
    it('should return movies in watchlist', async () => {
      const mockWatchlist = { id: 1 };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);

      const mockMovieQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValue([[{ id: 1, title: 'Movie 1' }], 1]),
      };
      mockMovieRepository.createQueryBuilder.mockReturnValue(
        mockMovieQueryBuilder,
      );

      const result = await service.getAllUserWatchlistMovies(1, 1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('should return not found error if watchlist not found', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      const result = await service.getAllUserWatchlistMovies(1, 999, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should handle database errors', async () => {
      mockWatchlistRepository.findOne.mockRejectedValue(new Error('DB error'));

      const result = await service.getAllUserWatchlistMovies(1, 1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('addMovieToUserWatchlist', () => {
    it('should add movie to watchlist', async () => {
      const mockMovie = {
        tmdbId: 123,
        title: 'Test Movie',
        overview: 'Overview',
        releaseDate: '2023-01-01',
        voteAverage: 8,
        voteCount: 1000,
      };

      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'success',
        data: mockMovie,
      });

      const mockWatchlist = { id: 1, userId: 1 };
      mockWatchlistRepository.manager.transaction.mockImplementation(
        async (callback) => {
          const mockManager = {
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(mockWatchlist),
            }),
            findOne: jest.fn().mockResolvedValue(null),
            save: jest.fn().mockResolvedValue({ tmdbId: 123 }),
            query: jest.fn().mockResolvedValue([]), // No existing rows
          };
          await callback(mockManager);
        },
      );

      const result = await service.addMovieToUserWatchlist(1, 1, 123);

      expect(result.status).toBe('success');
    });

    it('should return error if movie already in watchlist', async () => {
      const mockMovie = {
        tmdbId: 123,
        title: 'Test Movie',
        releaseDate: '2023-01-01',
        voteAverage: 8,
        voteCount: 1000,
      };

      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'success',
        data: mockMovie,
      });

      mockWatchlistRepository.manager.transaction.mockImplementation(
        async (callback) => {
          const mockManager = {
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({ id: 1 }),
            }),
            findOne: jest.fn().mockResolvedValue({ tmdbId: 123 }), // Movie exists
            query: jest.fn().mockResolvedValue([{ exists: 1 }]), // Already in list
          };
          await callback(mockManager);
        },
      );

      const result = await service.addMovieToUserWatchlist(1, 1, 123);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
      }
    });

    it('should return error if movie details not found', async () => {
      mockMoviesService.getMovieDetails.mockResolvedValue({
        status: 'error',
        code: 404,
        message: 'Movie not found',
      });

      const result = await service.addMovieToUserWatchlist(1, 1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });
  });

  describe('deleteMovieFromUserWatchlist', () => {
    it('should remove movie from watchlist', async () => {
      const mockWatchlist = { id: 1 };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);
      mockWatchlistRepository.manager.query.mockResolvedValue([{ exists: 1 }]);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      mockWatchlistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.deleteMovieFromUserWatchlist(1, 1, 123);

      expect(result.status).toBe('success');
    });

    it('should return not found if watchlist not found', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteMovieFromUserWatchlist(1, 999, 123);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should return not found if movie not in watchlist', async () => {
      const mockWatchlist = { id: 1 };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);
      mockWatchlistRepository.manager.query.mockResolvedValue([]);

      const result = await service.deleteMovieFromUserWatchlist(1, 1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });
  });

  describe('updateUserWatchlistDetails', () => {
    it('should update watchlist details', async () => {
      const mockWatchlist = { id: 1, name: 'Old Name' };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);
      mockWatchlistRepository.update.mockResolvedValue({});

      const result = await service.updateUserWatchlistDetails(1, 1, {
        name: 'New Name',
      });

      expect(mockWatchlistRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { name: 'New Name' },
      );
      expect(result.status).toBe('success');
    });

    it('should return error if no fields provided', async () => {
      const result = await service.updateUserWatchlistDetails(1, 1, {} as any);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(400);
      }
    });

    it('should return error if name is the same', async () => {
      const mockWatchlist = { id: 1, name: 'Same Name' };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);

      const result = await service.updateUserWatchlistDetails(1, 1, {
        name: 'Same Name',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
      }
    });

    it('should return not found error', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserWatchlistDetails(1, 999, {
        name: 'New Name',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should handle unique violation on name update', async () => {
      const mockWatchlist = { id: 1, name: 'Old Name' };
      mockWatchlistRepository.findOne.mockResolvedValue(mockWatchlist);

      const error = new Error('Unique violation');
      (error as any).code = '23505';
      mockWatchlistRepository.update.mockRejectedValue(error);

      const result = await service.updateUserWatchlistDetails(1, 1, {
        name: 'Duplicate Name',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
        expect(result.message).toContain('already exists');
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
