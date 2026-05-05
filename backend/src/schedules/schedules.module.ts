import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { Tag } from '../tags/entities/tag.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { UndoStore } from './undo.store';
import { UndoCleanupService } from './undo-cleanup.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Tag]), AuditModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, UndoStore, UndoCleanupService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
