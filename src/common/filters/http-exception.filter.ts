import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { Response } from 'express';

import { flattenValidationErrors } from '@/common/utils/flatten-validation-errors.utils';
import { serializeErrorMessage } from '@/common/utils/serialize-error-message.utils';
import { GenericResponseType } from '@/common/types/generic-response.type';

const GENERIC_ERROR_I18N_KEY = 'messages.common.INTERNAL_SERVER_ERROR';
// Last resort when no i18n context exists for the request (e.g. the error
// happened before the language resolver ran).
const GENERIC_ERROR_FALLBACK =
  'An internal server error occurred. Please try again later.';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    // Get the response object from the underlying Express platform
    const response = ctx.getResponse<Response>();
    const genericMessage =
      I18nContext.current(host)?.t(GENERIC_ERROR_I18N_KEY) ??
      GENERIC_ERROR_FALLBACK;

    // Non-HTTP errors (TypeError, DB driver errors, ...) are unexpected:
    // log the real cause, but give the client only the generic 500 envelope.
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
      const body: Extract<GenericResponseType, { status: 'error' }> = {
        status: 'error',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: genericMessage,
      };
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
      return;
    }

    // Extract the HTTP status code from the exception
    const status = exception.getStatus();

    // Extract the internal response object/message from the NestJS exception
    // NestJS exception responses can be a string or an object
    // (e.g., validation errors contain an array/object)
    const exceptionResponse = exception.getResponse();

    let message = genericMessage;
    if (exception instanceof I18nValidationException) {
      message = serializeErrorMessage(
        flattenValidationErrors(exception.errors),
      );
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      if (
        typeof exceptionResponse.message === 'string' ||
        Array.isArray(exceptionResponse.message)
      ) {
        message = serializeErrorMessage(exceptionResponse.message);
      }
    }

    const formattedExceptionResponse: Extract<
      GenericResponseType,
      { status: 'error' }
    > = {
      status: 'error',
      code: status,
      message,
    };

    // Send the structured JSON response back to the client
    response.status(status).json(formattedExceptionResponse);
  }
}
