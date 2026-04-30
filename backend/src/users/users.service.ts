import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserSettings } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSettings) private readonly settings: Repository<UserSettings>,
  ) {}

  async getSettings(userId: string): Promise<UserSettings> {
    const s = await this.settings.findOne({ where: { user_id: userId } });
    if (!s) throw new NotFoundException('Chưa có settings — gọi register lại');
    return s;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    await this.settings.update({ user_id: userId }, dto);
    return this.getSettings(userId);
  }

  async registerPushToken(userId: string, token: string): Promise<{ ok: true }> {
    await this.users.update({ id: userId }, { expo_push_token: token });
    return { ok: true };
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id }, relations: ['settings'] });
  }
}
