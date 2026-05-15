import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@/common/types/roles.type';
import { UserEntity } from '@/users/entity/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Array<RoleType>>(
      'user-roles',
      context.getHandler(),
    );

    // If no @Roles() decorator is present, skip the guard
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserEntity | undefined = request.user;

    // Defensive check: user should be present if JwtGuard is applied first
    if (!user) {
      throw new UnauthorizedException(
        'There is no "user" object attached to the request.',
      );
    }

    // Check if user's role matches any of the required roles
    if (new Set(requiredRoles).has(user.role)) {
      return true;
    }

    throw new UnauthorizedException(
      'You do not have the required role to access this resource',
    );
  }
}
