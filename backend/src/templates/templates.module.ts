import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleTemplate, Schedule])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
