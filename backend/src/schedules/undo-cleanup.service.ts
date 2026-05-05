import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UndoStore } from './undo.store';

@Injectable()
export class UndoCleanupService {
  private readonly logger = new Logger(UndoCleanupService.name);

  constructor(private readonly store: UndoStore) {}

  @Cron(CronExpression.EVERY_MINUTE)
  sweep(): void {
    const dropped = this.store.cleanup();
    if (dropped > 0) {
      this.logger.log(`Cleaned ${dropped} expired undo entr${dropped === 1 ? 'y' : 'ies'}`);
    }
  }
}
