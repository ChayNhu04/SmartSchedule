import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('schedules/:id/history')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async history(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const [items, total] = await this.audit.history(
      id,
      u.id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
    return { items, total };
  }
}
