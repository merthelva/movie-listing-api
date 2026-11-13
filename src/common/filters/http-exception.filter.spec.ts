import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { I18nContext } from 'nestjs-i18n';

import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

const GENERIC_MESSAGE =
  'An internal server error occurred. Please try again later.';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    // No i18n context by default: the filter must use its English fallback.
    jest.spyOn(I18nContext, 'current').mockReturnValue(undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('keeps the envelope for HttpException with a string message', () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Movie not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      status: 'error',
      code: HttpStatus.NOT_FOUND,
      message: 'Movie not found',
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('normalizes array messages from HttpException', () => {
    const { host, status, json } = createHost();

    filter.catch(
      new BadRequestException(['a is invalid', 'b is invalid']),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        code: HttpStatus.BAD_REQUEST,
      }),
    );
  });

  it('wraps a non-HTTP Error in the same envelope as 500 and logs it', () => {
    const { host, status, json } = createHost();
    const error = new TypeError('boom: secret internal detail');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      status: 'error',
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: GENERIC_MESSAGE,
    });
    expect(errorSpy).toHaveBeenCalledWith(error.message, error.stack);
  });

  it('handles thrown non-Error values without crashing', () => {
    const { host, status, json } = createHost();

    filter.catch('just a string', host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: GENERIC_MESSAGE }),
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('translates the generic 500 message using the request i18n context', () => {
    const { host, json } = createHost();
    const t = jest.fn().mockReturnValue('Dahili bir sunucu hatası oluştu.');
    jest
      .spyOn(I18nContext, 'current')
      .mockReturnValue({ t } as unknown as I18nContext);

    filter.catch(new Error('boom'), host);

    expect(t).toHaveBeenCalledWith('messages.common.INTERNAL_SERVER_ERROR');
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Dahili bir sunucu hatası oluştu.' }),
    );
  });
});
