import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateScheduleDto, UpdateScheduleDto, QueryScheduleDto } from './dto/schedule.dto';
import { buildIcs } from './ics';

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateScheduleDto) {
    return this.service.create(u.id, dto);
  }

  @Get()
  list(@CurrentUser() u: { id: string }, @Query() q: QueryScheduleDto) {
    return this.service.list(u.id, q);
  }

  @Get('today')
  today(@CurrentUser() u: { id: string }) {
    return this.service.today(u.id);
  }

  @Get('upcoming')
  upcoming(
    @CurrentUser() u: { id: string },
    @Query('limit') limit?: string,
    @Query('tag_id') tagId?: string,
  ) {
    return this.service.upcoming(
      u.id,
      limit ? parseInt(limit, 10) : 5,
      tagId ? parseInt(tagId, 10) : undefined,
    );
  }

  @Get('overdue')
  overdue(@CurrentUser() u: { id: string }) {
    return this.service.overdue(u.id);
  }

  @Get('search')
  search(@CurrentUser() u: { id: string }, @Query('q') q: string) {
    return this.service.search(u.id, q);
  }

  @Get('stats')
  stats(@CurrentUser() u: { id: string }, @Query('range') range?: string) {
    return this.service.stats(u.id, range);
  }

  @Get('export.ics')
  @ApiOperation({ summary: 'Xuất toàn bộ lịch dạng iCalendar (.ics)' })
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="smartschedule.ics"')
  async exportIcs(@CurrentUser() u: { id: string }): Promise<string> {
    const items = await this.service.allForExport(u.id);
    return buildIcs(items);
  }

  @Get(':id')
  findOne(@CurrentUser() u: { id: string }, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(u.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.service.update(u.id, id, dto);
  }

  @Post(':id/complete')
  complete(@CurrentUser() u: { id: string }, @Param('id', ParseIntPipe) id: number) {
    return this.service.complete(u.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() u: { id: string }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(u.id, id);
  }
}
