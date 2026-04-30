import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, User])],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}
