import { throwError } from './throw-error.utils';
import type { GenericResponseType } from '@/common/types/generic-response.type';

export function returnOrThrow<T>(response: GenericResponseType<T>): T {
  if (response.status === 'error') {
    throwError({
      statusCode: response.code,
      message: response.message,
    });
  }

  return response.data;
}
