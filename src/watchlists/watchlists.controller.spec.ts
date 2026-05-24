import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistsController } from './watchlists.controller';
import { WatchlistsService } from './watchlists.service';

describe('WatchlistsController', () => {
  let controller: WatchlistsController;

  const mockWatchlistsService = {
    createUserWatchlist: jest.fn(),
    deleteUserWatchlist: jest.fn(),
    getAllUserWatchlists: jest.fn(),
    getAllUserWatchlistMovies: jest.fn(),
    addMovieToUserWatchlist: jest.fn(),
    deleteMovieFromUserWatchlist: jest.fn(),
    updateUserWatchlistDetails: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistsController],
      providers: [
        {
          provide: WatchlistsService,
          useValue: mockWatchlistsService,
        },
      ],
    }).compile();

    controller = module.get<WatchlistsController>(WatchlistsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserWatchlist', () => {
    it('should call service and return serialized result', async () => {
      const mockResult = {
        status: 'success',
        data: { id: 1, name: 'My List', userId: 1 },
      };
      mockWatchlistsService.createUserWatchlist.mockResolvedValue(mockResult);

      const result = await controller.createUserWatchlist(
        mockCurrentUser as any,
        { name: 'My List' },
      );

      expect(mockWatchlistsService.createUserWatchlist).toHaveBeenCalledWith(
        1,
        { name: 'My List' },
      );
      expect(result.id).toBe(1);
      expect(result.name).toBe('My List');
    });

    it('should throw ForbiddenException on unique constraint violation', async () => {
      const mockError = {
        status: 'error',
        code: 403,
        message: 'Watchlist already exists',
      };
      mockWatchlistsService.createUserWatchlist.mockResolvedValue(mockError);

      await expect(
        controller.createUserWatchlist(mockCurrentUser as any, {
          name: 'My List',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteUserWatchlist', () => {
    it('should delete and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Deleted' },
      };
      mockWatchlistsService.deleteUserWatchlist.mockResolvedValue(mockResult);

      const result = await controller.deleteUserWatchlist(
        mockCurrentUser as any,
        1,
      );

      expect(mockWatchlistsService.deleteUserWatchlist).toHaveBeenCalledWith(
        1,
        1,
      );
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Watchlist not found',
      };
      mockWatchlistsService.deleteUserWatchlist.mockResolvedValue(mockError);

      await expect(
        controller.deleteUserWatchlist(mockCurrentUser as any, 999),
      ).rejects.toThrow();
    });
  });

  describe('getAllUserWatchlists', () => {
    it('should return paginated watchlists', async () => {
      const mockResult = {
        status: 'success',
        data: {
          items: [
            { id: 1, name: 'List 1', createdAt: new Date() },
            { id: 2, name: 'List 2', createdAt: new Date() },
          ],
          pagination: { page: 1, limit: 10, total: 2 },
        },
      };
      mockWatchlistsService.getAllUserWatchlists.mockResolvedValue(mockResult);

      const result = await controller.getAllUserWatchlists(
        mockCurrentUser as any,
        { page: 1, limit: 10 },
      );

      expect(mockWatchlistsService.getAllUserWatchlists).toHaveBeenCalledWith(
        1,
        { page: 1, limit: 10 },
      );
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const mockError = {
        status: 'error',
        code: 500,
        message: 'Server error',
      };
      mockWatchlistsService.getAllUserWatchlists.mockResolvedValue(mockError);

      await expect(
        controller.getAllUserWatchlists(mockCurrentUser as any, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getAllUserWatchlistMovies', () => {
    it('should return movies in watchlist', async () => {
      const mockResult = {
        status: 'success',
        data: {
          items: [{ id: 1, title: 'Movie 1', tmdbId: 123 }],
          pagination: { page: 1, limit: 10, total: 1 },
        },
      };
      mockWatchlistsService.getAllUserWatchlistMovies.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getAllUserWatchlistMovies(
        mockCurrentUser as any,
        1,
        { page: 1, limit: 10 },
      );

      expect(
        mockWatchlistsService.getAllUserWatchlistMovies,
      ).toHaveBeenCalledWith(1, 1, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when watchlist not found', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Watchlist not found',
      };
      mockWatchlistsService.getAllUserWatchlistMovies.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.getAllUserWatchlistMovies(mockCurrentUser as any, 999, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow();
    });
  });

  describe('addMovieToUserWatchlist', () => {
    it('should add movie and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Movie added' },
      };
      mockWatchlistsService.addMovieToUserWatchlist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.addMovieToUserWatchlist(
        mockCurrentUser as any,
        1,
        { tmdbId: 123 },
      );

      expect(
        mockWatchlistsService.addMovieToUserWatchlist,
      ).toHaveBeenCalledWith(1, 1, 123);
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when movie already exists', async () => {
      const mockError = {
        status: 'error',
        code: 403,
        message: 'Movie already in watchlist',
      };
      mockWatchlistsService.addMovieToUserWatchlist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.addMovieToUserWatchlist(mockCurrentUser as any, 1, {
          tmdbId: 123,
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteMovieFromUserWatchlist', () => {
    it('should remove movie and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Movie deleted' },
      };
      mockWatchlistsService.deleteMovieFromUserWatchlist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.deleteMovieFromUserWatchlist(
        mockCurrentUser as any,
        1,
        123,
      );

      expect(
        mockWatchlistsService.deleteMovieFromUserWatchlist,
      ).toHaveBeenCalledWith(1, 1, 123);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when movie not in list', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Movie not found in watchlist',
      };
      mockWatchlistsService.deleteMovieFromUserWatchlist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.deleteMovieFromUserWatchlist(mockCurrentUser as any, 1, 999),
      ).rejects.toThrow();
    });
  });

  describe('updateUserWatchlistDetails', () => {
    it('should update details and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Updated' },
      };
      mockWatchlistsService.updateUserWatchlistDetails.mockResolvedValue(
        mockResult,
      );

      const result = await controller.updateUserWatchlistDetails(
        mockCurrentUser as any,
        1,
        { name: 'Updated Name' },
      );

      expect(
        mockWatchlistsService.updateUserWatchlistDetails,
      ).toHaveBeenCalledWith(1, 1, { name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when no fields provided', async () => {
      const mockError = {
        status: 'error',
        code: 400,
        message: 'No fields to update',
      };
      mockWatchlistsService.updateUserWatchlistDetails.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.updateUserWatchlistDetails(
          mockCurrentUser as any,
          1,
          {} as any,
        ),
      ).rejects.toThrow();
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
