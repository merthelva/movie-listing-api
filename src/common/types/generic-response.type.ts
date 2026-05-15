import { HttpStatus } from '@nestjs/common';

export type GenericResponseType<TData = undefined> =
  | {
      code: HttpStatus;
      status: 'error';
      message: string;
    }
  | {
      status: 'success';
      data: TData;
    };
