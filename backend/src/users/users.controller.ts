import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateSettingsDto, RegisterPushTokenDto } from './dto/users.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me/settings')
  getSettings(@CurrentUser() user: { id: string }) {
    return this.users.getSettings(user.id);
  }

  @Patch('me/settings')
  updateSettings(@CurrentUser() user: { id: string }, @Body() dto: UpdateSettingsDto) {
    return this.users.updateSettings(user.id, dto);
  }

  @Patch('me/push-token')
  registerPushToken(@CurrentUser() user: { id: string }, @Body() dto: RegisterPushTokenDto) {
    return this.users.registerPushToken(user.id, dto.token);
  }
}
