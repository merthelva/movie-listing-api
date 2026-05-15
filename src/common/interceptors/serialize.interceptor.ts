import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map } from 'rxjs/operators';

type DtoClassType = {
  new (...args: Array<any>): {};
};

export function Serialize(dto: DtoClassType) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

// This interceptor will transform the response data
// into an instance of the provided DTO class
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: DtoClassType) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
