import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTagDto, AttachTagsDto } from './dto/tag.dto';

@ApiTags('tags')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get('tags')
  list(@CurrentUser() u: { id: string }) {
    return this.service.list(u.id);
  }

  @Post('tags')
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateTagDto) {
    return this.service.create(u.id, dto);
  }

  @Delete('tags/:name')
  remove(@CurrentUser() u: { id: string }, @Param('name') name: string) {
    return this.service.remove(u.id, name);
  }

  @Post('schedules/:id/tags')
  attach(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttachTagsDto,
  ) {
    return this.service.attach(u.id, id, dto.names);
  }

  @Delete('schedules/:id/tags/:name')
  detach(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Param('name') name: string,
  ) {
    return this.service.detach(u.id, id, name);
  }

  @Get('schedules-by-tag/:name')
  byTag(@CurrentUser() u: { id: string }, @Param('name') name: string) {
    return this.service.findSchedulesByTag(u.id, name);
  }
}
