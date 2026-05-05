import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const startedAt = Date.now();

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database probe' })
  async check(): Promise<{
    status: 'ok' | 'degraded';
    db: 'up' | 'down';
    uptime_seconds: number;
    timestamp: string;
  }> {
    let dbUp = false;
    try {
      await this.dataSource.query('SELECT 1');
      dbUp = true;
    } catch {
      dbUp = false;
    }
    return {
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'up' : 'down',
      uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
