import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { UserEntity } from '@users/entity/user.entity';
import { Roles } from '@/common/constants/roles.constant';
import { PgViolationCodes } from '@/common/constants/pg-violation-codes.constant';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (await this.adminExists()) {
      return;
    }

    // ADMIN_* and BCRYPT_SALT_ROUNDS are required by the env schema (Joi), so a
    // missing value fails fast at startup: there is no "skip seeding" mode.
    const email = this.configService.getOrThrow<string>('ADMIN_EMAIL');
    const password = this.configService.getOrThrow<string>('ADMIN_PASSWORD');
    const name = this.configService.getOrThrow<string>('ADMIN_NAME');
    const saltRounds =
      this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    const hashedPassword = await hash(password, saltRounds);

    const admin = this.usersRepository.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Roles.ADMIN,
    });

    try {
      await this.usersRepository.save(admin);
    } catch (error) {
      // Several instances may boot at once: all pass the exists-check above and
      // the unique constraint lets exactly one INSERT win. A loser is fine only
      // if an admin exists now; otherwise the email belongs to a non-admin user
      // (misconfiguration) and booting must keep failing loudly.
      const pgErr = error as { code?: string };
      if (
        pgErr.code === PgViolationCodes.UNIQUE_VIOLATION &&
        (await this.adminExists())
      ) {
        this.logger.log('Admin was seeded by another instance. Skipping.');
        return;
      }
      throw error;
    }

    this.logger.log(`Admin user seeded: ${email}`);
  }

  private async adminExists(): Promise<boolean> {
    const admin = await this.usersRepository.findOne({
      where: { role: Roles.ADMIN },
    });
    return admin !== null;
  }
}
