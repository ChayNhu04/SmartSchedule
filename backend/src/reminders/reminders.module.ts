import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { RemindersService } from './reminders.service';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, User])],
  providers: [RemindersService, PushService],
  exports: [RemindersService, PushService],
})
export class RemindersModule {}
