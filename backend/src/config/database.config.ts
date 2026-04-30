import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: false,
    ssl:
      config.get<string>('DATABASE_SSL') === 'true'
        ? { rejectUnauthorized: false }
        : false,
    logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : false,
  }),
};
