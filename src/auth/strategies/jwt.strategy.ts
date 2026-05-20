import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@users/entity/user.entity';
import { TtlCache } from '@/common/utils/ttl-cache.util';
import {
  maxUserCacheSize,
  userCacheTtlMs,
} from '@/auth/constants/user-cache.constant';
import { JwtPayloadType, CachedUserType } from '@/auth/types';

// Validates JWT tokens and extracts user information from them.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly userCache = new TtlCache<number, CachedUserType>(
    userCacheTtlMs,
    maxUserCacheSize,
  );

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
    setInterval(() => this.userCache.evictExpired(), userCacheTtlMs);
  }

  async validate(payload: JwtPayloadType): Promise<CachedUserType> {
    const cachedUserEntity = this.userCache.get(payload.sub);
    if (cachedUserEntity) {
      return cachedUserEntity;
    }

    const foundUser = await this.usersRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, deletedAt: true },
    });
    if (!foundUser || foundUser.deletedAt !== null) {
      throw new UnauthorizedException('User not found');
    }

    this.userCache.set(payload.sub, foundUser);
    return foundUser;
  }
}
