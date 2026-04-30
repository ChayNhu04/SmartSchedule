import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SharesService {
  constructor(
    @InjectRepository(Schedule) private readonly schedules: Repository<Schedule>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async share(scheduleId: number, ownerId: string, targetUserId: string) {
    if (!targetUserId || targetUserId === ownerId) {
      throw new NotFoundException('Target user invalid');
    }
    const s = await this.schedules.findOne({
      where: { id: scheduleId, user_id: ownerId },
      relations: ['sharedWith'],
    });
    if (!s) throw new NotFoundException('Schedule not found');
    const target = await this.users.findOne({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('Target user not found');

    const list = s.sharedWith ?? [];
    if (list.some((u) => u.id === targetUserId)) {
      return { added: false, sharedWith: list };
    }
    s.sharedWith = [...list, target];
    await this.schedules.save(s);
    return { added: true, sharedWith: s.sharedWith };
  }

  async unshare(scheduleId: number, ownerId: string, targetUserId: string) {
    const s = await this.schedules.findOne({
      where: { id: scheduleId, user_id: ownerId },
      relations: ['sharedWith'],
    });
    if (!s) throw new NotFoundException('Schedule not found');
    const before = s.sharedWith ?? [];
    const after = before.filter((u) => u.id !== targetUserId);
    if (after.length === before.length) return { removed: false, sharedWith: before };
    s.sharedWith = after;
    await this.schedules.save(s);
    return { removed: true, sharedWith: after };
  }

  async listSharedUsers(scheduleId: number, ownerId: string): Promise<User[]> {
    const s = await this.schedules.findOne({
      where: { id: scheduleId, user_id: ownerId },
      relations: ['sharedWith'],
    });
    return s?.sharedWith ?? [];
  }

  findSchedulesSharedWith(userId: string): Promise<Schedule[]> {
    return this.schedules
      .createQueryBuilder('s')
      .innerJoin('schedule_shares', 'ss', 'ss.schedule_id = s.id AND ss.shared_with_user_id = :userId', { userId })
      .leftJoinAndSelect('s.user', 'owner')
      .orderBy('s.start_time', 'ASC')
      .getMany();
  }
}
