import { Test, TestingModule } from '@nestjs/testing';
import { FavoritelistsController } from './favoritelists.controller';
import { FavoritelistsService } from './favoritelists.service';

describe('FavoritelistsController', () => {
  let controller: FavoritelistsController;

  const mockFavoritelistsService = {
    createUserFavoritelist: jest.fn(),
    deleteUserFavoritelist: jest.fn(),
    getAllUserFavoritelists: jest.fn(),
    getAllUserFavoritelistMovies: jest.fn(),
    addMovieToUserFavoritelist: jest.fn(),
    deleteMovieFromUserFavoritelist: jest.fn(),
    updateUserFavoritelistDetails: jest.fn(),
  };

  const mockCurrentUser = {
    id: 1,
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritelistsController],
      providers: [
        {
          provide: FavoritelistsService,
          useValue: mockFavoritelistsService,
        },
      ],
    }).compile();

    controller = module.get<FavoritelistsController>(FavoritelistsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserFavoritelist', () => {
    it('should call service and return serialized result', async () => {
      const mockResult = {
        status: 'success',
        data: { id: 1, name: 'My List', userId: 1 },
      };
      mockFavoritelistsService.createUserFavoritelist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.createUserFavoritelist(
        mockCurrentUser as any,
        { name: 'My List' },
      );

      expect(
        mockFavoritelistsService.createUserFavoritelist,
      ).toHaveBeenCalledWith(1, { name: 'My List' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('My List');
    });

    it('should throw ForbiddenException on unique constraint violation', async () => {
      const mockError = {
        status: 'error',
        code: 403,
        message: 'Favoritelist already exists',
      };
      mockFavoritelistsService.createUserFavoritelist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.createUserFavoritelist(mockCurrentUser as any, {
          name: 'My List',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteUserFavoritelist', () => {
    it('should delete and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Deleted' },
      };
      mockFavoritelistsService.deleteUserFavoritelist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.deleteUserFavoritelist(
        mockCurrentUser as any,
        1,
      );

      expect(
        mockFavoritelistsService.deleteUserFavoritelist,
      ).toHaveBeenCalledWith(1, 1);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Favoritelist not found',
      };
      mockFavoritelistsService.deleteUserFavoritelist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.deleteUserFavoritelist(mockCurrentUser as any, 999),
      ).rejects.toThrow();
    });
  });

  describe('getAllUserFavoritelists', () => {
    it('should return paginated favoritelists', async () => {
      const mockResult = {
        status: 'success',
        data: {
          items: [
            { id: 1, name: 'List 1', createdAt: new Date() },
            { id: 2, name: 'List 2', createdAt: new Date() },
          ],
          page: 1,
          limit: 10,
          totalItems: 2,
          isFirstPage: true,
          isLastPage: true,
        },
      };
      mockFavoritelistsService.getAllUserFavoritelists.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getAllUserFavoritelists(
        mockCurrentUser as any,
        { page: 1, limit: 10 },
      );

      expect(
        mockFavoritelistsService.getAllUserFavoritelists,
      ).toHaveBeenCalledWith(1, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it('should throw InternalServerErrorException on error', async () => {
      const mockError = {
        status: 'error',
        code: 500,
        message: 'Server error',
      };
      mockFavoritelistsService.getAllUserFavoritelists.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.getAllUserFavoritelists(mockCurrentUser as any, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow();
    });
  });

  describe('getAllUserFavoritelistMovies', () => {
    it('should return movies in favoritelist', async () => {
      const mockResult = {
        status: 'success',
        data: {
          items: [{ id: 1, title: 'Movie 1', tmdbId: 123 }],
          pagination: { page: 1, limit: 10, total: 1 },
        },
      };
      mockFavoritelistsService.getAllUserFavoritelistMovies.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getAllUserFavoritelistMovies(
        mockCurrentUser as any,
        1,
        { page: 1, limit: 10 },
      );

      expect(
        mockFavoritelistsService.getAllUserFavoritelistMovies,
      ).toHaveBeenCalledWith(1, 1, { page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundException when favoritelist not found', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Favoritelist not found',
      };
      mockFavoritelistsService.getAllUserFavoritelistMovies.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.getAllUserFavoritelistMovies(mockCurrentUser as any, 999, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow();
    });
  });

  describe('addMovieToUserFavoritelist', () => {
    it('should add movie and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Movie added' },
      };
      mockFavoritelistsService.addMovieToUserFavoritelist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.addMovieToUserFavoritelist(
        mockCurrentUser as any,
        1,
        { tmdbId: 123 },
      );

      expect(
        mockFavoritelistsService.addMovieToUserFavoritelist,
      ).toHaveBeenCalledWith(1, 1, 123);
      expect(result.success).toBe(true);
    });

    it('should throw ForbiddenException when movie already exists', async () => {
      const mockError = {
        status: 'error',
        code: 403,
        message: 'Movie already in favoritelist',
      };
      mockFavoritelistsService.addMovieToUserFavoritelist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.addMovieToUserFavoritelist(mockCurrentUser as any, 1, {
          tmdbId: 123,
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteMovieFromUserFavoritelist', () => {
    it('should remove movie and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Movie deleted' },
      };
      mockFavoritelistsService.deleteMovieFromUserFavoritelist.mockResolvedValue(
        mockResult,
      );

      const result = await controller.deleteMovieFromUserFavoritelist(
        mockCurrentUser as any,
        1,
        123,
      );

      expect(
        mockFavoritelistsService.deleteMovieFromUserFavoritelist,
      ).toHaveBeenCalledWith(1, 1, 123);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when movie not in list', async () => {
      const mockError = {
        status: 'error',
        code: 404,
        message: 'Movie not found in favoritelist',
      };
      mockFavoritelistsService.deleteMovieFromUserFavoritelist.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.deleteMovieFromUserFavoritelist(
          mockCurrentUser as any,
          1,
          999,
        ),
      ).rejects.toThrow();
    });
  });

  describe('updateUserFavoritelistDetails', () => {
    it('should update details and return success response', async () => {
      const mockResult = {
        status: 'success',
        data: { success: true, message: 'Updated' },
      };
      mockFavoritelistsService.updateUserFavoritelistDetails.mockResolvedValue(
        mockResult,
      );

      const result = await controller.updateUserFavoritelistDetails(
        mockCurrentUser as any,
        1,
        { name: 'Updated Name' },
      );

      expect(
        mockFavoritelistsService.updateUserFavoritelistDetails,
      ).toHaveBeenCalledWith(1, 1, { name: 'Updated Name' });
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when no fields provided', async () => {
      const mockError = {
        status: 'error',
        code: 400,
        message: 'No fields to update',
      };
      mockFavoritelistsService.updateUserFavoritelistDetails.mockResolvedValue(
        mockError,
      );

      await expect(
        controller.updateUserFavoritelistDetails(
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
