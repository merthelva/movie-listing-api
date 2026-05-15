import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// It protects routes from unauthenticated access.
// It can be applied to controllers/routes with `@UseGuards(JwtGuard)`
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
