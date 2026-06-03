import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

import { Response } from 'express';

import { serializeErrorMessage } from '@/common/utils/serialize-error-message.utils';
import { GenericResponseType } from '@/common/types/generic-response.type';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    // Get the response object from the underlying Express platform
    const response = ctx.getResponse<Response>();

    // Extract the HTTP status code from the exception
    const status = exception.getStatus();

    // Extract the internal response object/message from the NestJS exception
    // NestJS exception responses can be a string or an object
    // (e.g., validation errors contain an array/object)
    const exceptionResponse = exception.getResponse();

    let message = 'An internal server error occurred. Please try again later.';
    if (typeof exceptionResponse === 'string') {
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
