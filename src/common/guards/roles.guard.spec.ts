import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Roles as RolesDecorator } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

class HandlerLevelController {
  @RolesDecorator('admin')
  adminOnly() {}

  open() {}
}

@RolesDecorator('admin')
class ClassLevelController {
  inheritsClassRoles() {}

  @RolesDecorator('user')
  overridesClassRoles() {}
}

function createContext(
  controller: new () => object,
  handlerName: string,
  user?: { role: string },
): ExecutionContext {
  const handler = (controller.prototype as Record<string, () => void>)[
    handlerName
  ];
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(new Reflector());
  });

  it('allows routes without @Roles, even with no user', () => {
    const ctx = createContext(HandlerLevelController, 'open');

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows a user whose role matches the handler-level @Roles', () => {
    const ctx = createContext(HandlerLevelController, 'adminOnly', {
      role: 'admin',
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws 403 when the role does not match', () => {
    const ctx = createContext(HandlerLevelController, 'adminOnly', {
      role: 'user',
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws 401 when no user is attached to the request', () => {
    const ctx = createContext(HandlerLevelController, 'adminOnly');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('applies class-level @Roles to handlers without their own', () => {
    const asUser = createContext(ClassLevelController, 'inheritsClassRoles', {
      role: 'user',
    });
    const asAdmin = createContext(ClassLevelController, 'inheritsClassRoles', {
      role: 'admin',
    });

    expect(() => guard.canActivate(asUser)).toThrow(ForbiddenException);
    expect(guard.canActivate(asAdmin)).toBe(true);
  });

  it('lets handler-level @Roles override class-level @Roles', () => {
    const asUser = createContext(ClassLevelController, 'overridesClassRoles', {
      role: 'user',
    });
    const asAdmin = createContext(ClassLevelController, 'overridesClassRoles', {
      role: 'admin',
    });

    expect(guard.canActivate(asUser)).toBe(true);
    expect(() => guard.canActivate(asAdmin)).toThrow(ForbiddenException);
  });
});
