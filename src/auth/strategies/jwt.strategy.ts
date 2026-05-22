import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { JwtPayloadType, CachedUserType } from '@/auth/types';
import { UserEntity } from '@/users/entity/user.entity';
import { UserCacheService } from '@/users/user-cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private userCacheService: UserCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayloadType): Promise<CachedUserType> {
    const cachedUser = this.userCacheService.get(payload.sub);
    if (cachedUser) {
      if (cachedUser.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }
      return cachedUser;
    }

    const foundUser = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }
    if (foundUser.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    this.userCacheService.set(payload.sub, foundUser);
    return foundUser;
  }
}
