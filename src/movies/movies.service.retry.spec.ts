import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import { delayInMs } from '@/common/utils/delay-ms.utils';
import { MoviesService } from './movies.service';

jest.mock('@/common/utils/delay-ms.utils', () => ({
  delayInMs: jest.fn().mockResolvedValue(undefined),
}));

const RETRY_ATTEMPTS = 3;
const MAX_RETRY_DELAY_MS = 5000;

describe('MoviesService.fetchWithRetry', () => {
  let service: MoviesService;
  let fetchSpy: jest.SpyInstance;
  const delayMock = delayInMs as jest.Mock;

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('mock-token'),
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        TMDB_BASE_URL: 'https://api.themoviedb.org/3',
        TMDB_CACHE_TTL_MS: 300_000,
        TMDB_RETRY_ATTEMPTS: RETRY_ATTEMPTS,
        TMDB_FETCH_TIMEOUT_MS: 10_000,
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  const respondWith = (status: number, headers: Record<string, string> = {}) =>
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response(null, { status, headers })),
    );

  const retry = (url = 'https://example.test/movie') =>
    service['fetchWithRetry'](url);

  beforeEach(() => {
    delayMock.mockClear();
    fetchSpy = jest.spyOn(global, 'fetch');
    service = new MoviesService(configService, {} as unknown as I18nService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
  });

  it('returns the first successful response without waiting', async () => {
    respondWith(200);

    const response = await retry();

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(delayMock).not.toHaveBeenCalled();
  });

  it('honours a small Retry-After value', async () => {
    respondWith(429, { 'Retry-After': '2' });

    await expect(retry()).rejects.toThrow();

    expect(delayMock.mock.calls[0]).toEqual([2000]);
  });

  it('caps a large Retry-After at the maximum retry delay', async () => {
    respondWith(429, { 'Retry-After': '60' });

    await expect(retry()).rejects.toThrow();

    expect(delayMock.mock.calls.length).toBeGreaterThan(0);
    for (const [ms] of delayMock.mock.calls as Array<[number]>) {
      expect(ms).toBeLessThanOrEqual(MAX_RETRY_DELAY_MS);
    }
  });

  it('still tells the caller the wait TMDB actually asked for', async () => {
    respondWith(429, { 'Retry-After': '60' });

    await expect(retry()).rejects.toThrow('60 seconds');
  });

  it.each([
    ['an HTTP date', 'Wed, 21 Oct 2026 07:28:00 GMT'],
    ['a negative number', '-5'],
    ['garbage', 'soon'],
  ])(
    'falls back to exponential backoff when Retry-After is %s',
    async (_, value) => {
      respondWith(503, { 'Retry-After': value });

      await expect(retry()).rejects.toThrow();

      expect(delayMock.mock.calls.map(([ms]) => ms as number)).toEqual([
        1000, 2000, 4000,
      ]);
    },
  );

  it('does not sleep after the last failed attempt', async () => {
    respondWith(503);

    await expect(retry()).rejects.toThrow();

    expect(fetchSpy).toHaveBeenCalledTimes(RETRY_ATTEMPTS + 1);
    expect(delayMock).toHaveBeenCalledTimes(RETRY_ATTEMPTS);
  });

  it('keeps the total sleep under the documented 15 s bound even with huge Retry-After values', async () => {
    respondWith(429, { 'Retry-After': '86400' });

    await expect(retry()).rejects.toThrow();

    const total = (delayMock.mock.calls as Array<[number]>).reduce(
      (sum, [ms]) => sum + ms,
      0,
    );
    expect(total).toBeLessThanOrEqual(RETRY_ATTEMPTS * MAX_RETRY_DELAY_MS);
  });

  it('does not retry non-retriable client errors', async () => {
    respondWith(404);

    const response = await retry();

    expect(response.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(delayMock).not.toHaveBeenCalled();
  });
});
