import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTemplateDto, InstantiateTemplateDto } from './dto/template.dto';

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  list(@CurrentUser() u: { id: string }) {
    return this.service.list(u.id);
  }

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateTemplateDto) {
    return this.service.create(u.id, dto);
  }

  @Delete(':name')
  remove(@CurrentUser() u: { id: string }, @Param('name') name: string) {
    return this.service.remove(u.id, name);
  }

  @Post(':name/instantiate')
  instantiate(
    @CurrentUser() u: { id: string },
    @Param('name') name: string,
    @Body() dto: InstantiateTemplateDto,
  ) {
    return this.service.instantiate(u.id, name, dto);
  }
}
