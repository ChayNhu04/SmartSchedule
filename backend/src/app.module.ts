import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { TagsModule } from './tags/tags.module';
import { TemplatesModule } from './templates/templates.module';
import { SharesModule } from './shares/shares.module';
import { RemindersModule } from './reminders/reminders.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(databaseConfig),
    NestScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    UsersModule,
    SchedulesModule,
    TagsModule,
    TemplatesModule,
    SharesModule,
    RemindersModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}
