import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FavoritelistsService } from './favoritelists.service';
import { FavoritelistEntity } from './entity/favoritelist.entity';
import { MovieEntity } from '@/movies/entity/movie.entity';
import { MoviesService } from '@/movies/movies.service';

describe('FavoritelistsService', () => {
  let service: FavoritelistsService;

  const mockFavoritelistRepository = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritelistsService,
        {
          provide: getRepositoryToken(FavoritelistEntity),
          useValue: mockFavoritelistRepository,
        },
        {
          provide: getRepositoryToken(MovieEntity),
          useValue: mockMovieRepository,
        },
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    service = module.get<FavoritelistsService>(FavoritelistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserFavoritelist', () => {
    it('should create a new favoritelist for user', async () => {
      const mockFavoritelist = { id: 1, name: 'My List', userId: 1 };
      mockFavoritelistRepository.create.mockReturnValue(mockFavoritelist);
      mockFavoritelistRepository.save.mockResolvedValue(mockFavoritelist);

      const result = await service.createUserFavoritelist(1, {
        name: 'My List',
      });

      expect(mockFavoritelistRepository.create).toHaveBeenCalledWith({
        name: 'My List',
        user: { id: 1 },
      });
      expect(mockFavoritelistRepository.save).toHaveBeenCalled();
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data).toEqual(mockFavoritelist);
      }
    });

    it('should return error on unique violation', async () => {
      const error = new Error('Unique violation');
      (error as any).code = '23505';
      mockFavoritelistRepository.create.mockReturnValue({});
      mockFavoritelistRepository.save.mockRejectedValue(error);

      const result = await service.createUserFavoritelist(1, {
        name: 'Duplicate List',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
        expect(result.message).toContain('already exists');
      }
    });

    it('should handle unexpected errors', async () => {
      mockFavoritelistRepository.create.mockReturnValue({});
      mockFavoritelistRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.createUserFavoritelist(1, {
        name: 'List',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('deleteUserFavoritelist', () => {
    it('should delete user favoritelist', async () => {
      const mockFavoritelist = { id: 1, name: 'My List' };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);
      mockFavoritelistRepository.remove.mockResolvedValue({});

      const result = await service.deleteUserFavoritelist(1, 1);

      expect(mockFavoritelistRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user: { id: 1 } },
      });
      expect(mockFavoritelistRepository.remove).toHaveBeenCalledWith(
        mockFavoritelist,
      );
      expect(result.status).toBe('success');
    });

    it('should return not found error', async () => {
      mockFavoritelistRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteUserFavoritelist(1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
        expect(result.message).toContain('not found');
      }
    });

    it('should handle database errors', async () => {
      mockFavoritelistRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.deleteUserFavoritelist(1, 1);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('getAllUserFavoritelists', () => {
    it('should return paginated favoritelists', async () => {
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
      mockFavoritelistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAllUserFavoritelists(1, {
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
      mockFavoritelistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getAllUserFavoritelists(1);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.status).toBe('success');
    });

    it('should handle database errors', async () => {
      mockFavoritelistRepository.createQueryBuilder.mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await service.getAllUserFavoritelists(1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('getAllUserFavoritelistMovies', () => {
    it('should return movies in favoritelist', async () => {
      const mockFavoritelist = { id: 1 };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);

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

      const result = await service.getAllUserFavoritelistMovies(1, 1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('should return not found error if favoritelist not found', async () => {
      mockFavoritelistRepository.findOne.mockResolvedValue(null);

      const result = await service.getAllUserFavoritelistMovies(1, 999, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should handle database errors', async () => {
      mockFavoritelistRepository.findOne.mockRejectedValue(
        new Error('DB error'),
      );

      const result = await service.getAllUserFavoritelistMovies(1, 1, {
        page: 1,
        limit: 10,
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(500);
      }
    });
  });

  describe('addMovieToUserFavoritelist', () => {
    it('should add movie to favoritelist', async () => {
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

      const mockFavoritelist = { id: 1, userId: 1 };
      mockFavoritelistRepository.manager.transaction.mockImplementation(
        async (callback) => {
          const mockManager = {
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(mockFavoritelist),
            }),
            findOne: jest.fn().mockResolvedValue(null),
            save: jest.fn().mockResolvedValue({ tmdbId: 123 }),
            query: jest.fn().mockResolvedValue([]), // No existing rows
          };
          await callback(mockManager);
        },
      );

      const result = await service.addMovieToUserFavoritelist(1, 1, 123);

      expect(result.status).toBe('success');
    });

    it('should return error if movie already in favoritelist', async () => {
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

      mockFavoritelistRepository.manager.transaction.mockImplementation(
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

      const result = await service.addMovieToUserFavoritelist(1, 1, 123);

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

      const result = await service.addMovieToUserFavoritelist(1, 1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });
  });

  describe('deleteMovieFromUserFavoritelist', () => {
    it('should remove movie from favoritelist', async () => {
      const mockFavoritelist = { id: 1 };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);
      mockFavoritelistRepository.manager.query.mockResolvedValue([
        { exists: 1 },
      ]);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      mockFavoritelistRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.deleteMovieFromUserFavoritelist(1, 1, 123);

      expect(result.status).toBe('success');
    });

    it('should return not found if favoritelist not found', async () => {
      mockFavoritelistRepository.findOne.mockResolvedValue(null);

      const result = await service.deleteMovieFromUserFavoritelist(1, 999, 123);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should return not found if movie not in favoritelist', async () => {
      const mockFavoritelist = { id: 1 };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);
      mockFavoritelistRepository.manager.query.mockResolvedValue([]);

      const result = await service.deleteMovieFromUserFavoritelist(1, 1, 999);

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });
  });

  describe('updateUserFavoritelistDetails', () => {
    it('should update favoritelist details', async () => {
      const mockFavoritelist = { id: 1, name: 'Old Name' };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);
      mockFavoritelistRepository.update.mockResolvedValue({});

      const result = await service.updateUserFavoritelistDetails(1, 1, {
        name: 'New Name',
      });

      expect(mockFavoritelistRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { name: 'New Name' },
      );
      expect(result.status).toBe('success');
    });

    it('should return error if no fields provided', async () => {
      const result = await service.updateUserFavoritelistDetails(
        1,
        1,
        {} as any,
      );

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(400);
      }
    });

    it('should return error if name is the same', async () => {
      const mockFavoritelist = { id: 1, name: 'Same Name' };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);

      const result = await service.updateUserFavoritelistDetails(1, 1, {
        name: 'Same Name',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(403);
      }
    });

    it('should return not found error', async () => {
      mockFavoritelistRepository.findOne.mockResolvedValue(null);

      const result = await service.updateUserFavoritelistDetails(1, 999, {
        name: 'New Name',
      });

      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.code).toBe(404);
      }
    });

    it('should handle unique violation on name update', async () => {
      const mockFavoritelist = { id: 1, name: 'Old Name' };
      mockFavoritelistRepository.findOne.mockResolvedValue(mockFavoritelist);

      const error = new Error('Unique violation');
      (error as any).code = '23505';
      mockFavoritelistRepository.update.mockRejectedValue(error);

      const result = await service.updateUserFavoritelistDetails(1, 1, {
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
