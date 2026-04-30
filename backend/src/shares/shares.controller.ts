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
import { SharesService } from './shares.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ShareTargetDto } from './dto/share.dto';

@ApiTags('shares')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class SharesController {
  constructor(private readonly service: SharesService) {}

  @Post('schedules/:id/shares')
  share(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ShareTargetDto,
  ) {
    return this.service.share(id, u.id, dto.target_user_id);
  }

  @Delete('schedules/:id/shares/:targetId')
  unshare(
    @CurrentUser() u: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Param('targetId') targetId: string,
  ) {
    return this.service.unshare(id, u.id, targetId);
  }

  @Get('schedules/:id/shares')
  list(@CurrentUser() u: { id: string }, @Param('id', ParseIntPipe) id: number) {
    return this.service.listSharedUsers(id, u.id);
  }

  @Get('shared-with-me')
  sharedWithMe(@CurrentUser() u: { id: string }) {
    return this.service.findSchedulesSharedWith(u.id);
  }
}
