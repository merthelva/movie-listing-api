import {
  CallHandler,
  ExecutionContext,
  RequestTimeoutException,
} from '@nestjs/common';
import { lastValueFrom, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';

import { TimeoutInterceptor } from '@/common/interceptors/timeout.interceptor';

const context = {} as ExecutionContext;

const handlerTaking = (ms: number): CallHandler => ({
  handle: () => timer(ms).pipe(map(() => 'done')),
});

describe('TimeoutInterceptor', () => {
  it('passes the handler result through when it finishes in time', async () => {
    const interceptor = new TimeoutInterceptor(200);

    await expect(
      lastValueFrom(interceptor.intercept(context, handlerTaking(10))),
    ).resolves.toBe('done');
  });

  it('throws RequestTimeoutException when the handler exceeds the configured timeout', async () => {
    const interceptor = new TimeoutInterceptor(20);

    await expect(
      lastValueFrom(interceptor.intercept(context, handlerTaking(200))),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it('uses the configured value, not a hard-coded one', async () => {
    const handler = handlerTaking(60);

    await expect(
      lastValueFrom(new TimeoutInterceptor(500).intercept(context, handler)),
    ).resolves.toBe('done');
    await expect(
      lastValueFrom(new TimeoutInterceptor(10).intercept(context, handler)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it('rethrows non-timeout errors unchanged', async () => {
    const boom = new Error('boom');
    const handler: CallHandler = {
      handle: () => throwError(() => boom),
    };

    await expect(
      lastValueFrom(new TimeoutInterceptor(200).intercept(context, handler)),
    ).rejects.toBe(boom);
  });

  it('completes synchronous handlers immediately', async () => {
    const handler: CallHandler = { handle: () => of('sync') };

    await expect(
      lastValueFrom(new TimeoutInterceptor(5).intercept(context, handler)),
    ).resolves.toBe('sync');
  });
});
