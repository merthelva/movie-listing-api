import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt';
import { UserEntity } from '@users/entity/user.entity';
import { Roles } from '@/common/constants/roles.constant';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const isAdminExists = await this.usersRepository.findOne({
      where: { role: Roles.ADMIN },
    });
    if (isAdminExists) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const name = this.configService.get<string>('ADMIN_NAME', 'Admin');

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed.',
      );
      return;
    }

    const saltRounds = parseInt(
      this.configService.get('BCRYPT_SALT_ROUNDS', '14'),
      10,
    );
    const hashedPassword = await hash(password, saltRounds);

    const admin = this.usersRepository.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Roles.ADMIN,
    });

    await this.usersRepository.save(admin);
    this.logger.log(`Admin user seeded: ${email}`);
  }
}
