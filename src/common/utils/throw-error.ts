import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

type ThrowErrorType = {
  statusCode: HttpStatus;
  message?: string;
};

export function throwError({ statusCode, message }: ThrowErrorType) {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST: {
      throw new BadRequestException(message);
    }
    case HttpStatus.NOT_FOUND: {
      throw new NotFoundException(message);
    }
    case HttpStatus.UNAUTHORIZED: {
      throw new UnauthorizedException(message);
    }
    case HttpStatus.FORBIDDEN: {
      throw new ForbiddenException(message);
    }
    case HttpStatus.CONFLICT: {
      throw new ConflictException(message);
    }
    case HttpStatus.INTERNAL_SERVER_ERROR:
    default: {
      throw new InternalServerErrorException(message);
    }
  }
}
