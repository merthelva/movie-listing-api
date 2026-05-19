import type { GenericResponseType } from '../types/generic-response.type';
import { throwError } from './throw-error.utils';

export function returnOrThrow<T>(response: GenericResponseType<T>): T {
  if (response.status === 'error') {
    throwError({
      statusCode: response.code,
      message: response.message,
    });
  }

  return response.data;
}
