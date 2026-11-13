import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '@/common/constants/roles-key.constant';
import { AuthUser } from '@/common/types/auth-user.type';
import { RoleType } from '@/common/types/roles.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      Array<RoleType> | undefined
    >(ROLES_KEY, [
      // Handler-level @Roles() wins over class-level @Roles()
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles() decorator is present, skip the guard
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();

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

    // Authenticated but not allowed: 403, not 401
    throw new ForbiddenException(
      'You do not have the required role to access this resource',
    );
  }
}
