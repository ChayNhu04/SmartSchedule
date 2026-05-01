import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemindersService } from '../../backend/src/reminders/reminders.service';
import { Schedule, ScheduleStatus } from '../../backend/src/schedules/entities/schedule.entity';
import { PushService } from '../../backend/src/reminders/push.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let repo: Repository<Schedule>;
  let pushService: PushService;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockSchedule: Schedule = {
    id: 1,
    user_id: userId,
    item_type: 'task',
    title: 'Test Reminder',
    description: 'Test Description',
    start_time: new Date('2026-05-15T09:00:00Z'),
    end_time: new Date('2026-05-15T10:00:00Z'),
    status: 'pending' as ScheduleStatus,
    priority: 'normal',
    remind_at: new Date('2026-05-15T08:30:00Z'),
    is_reminded: false,
    acknowledged_at: null,
    end_notified_at: null,
    recurrence_type: 'none',
    recurrence_interval: 1,
    recurrence_until: null,
    recurrence_parent_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    user: {
      id: userId,
      email: 'test@example.com',
      password_hash: 'hash',
      display_name: 'Test User',
      expo_push_token: 'ExponentPushToken[xxxxx]',
      created_at: new Date(),
      updated_at: new Date(),
      settings: {
        user_id: userId,
        timezone: 'Asia/Ho_Chi_Minh',
        default_remind_minutes: 30,
        notify_via_push: true,
        work_start_hour: 9,
        work_end_hour: 18,
        created_at: new Date(),
        updated_at: new Date(),
        user: undefined,
      },
      schedules: [],
    },
    tags: [],
    sharedWith: [],
  };

  const mockRepository = {
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockPushService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockRepository,
        },
        {
          provide: PushService,
          useValue: mockPushService,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    repo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
    pushService = module.get<PushService>(PushService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tick', () => {
    it('should process start reminders', async () => {
      const now = new Date();
      const dueSchedule = { ...mockSchedule, remind_at: new Date(now.getTime() - 1000) };
      
      mockRepository.find
        .mockResolvedValueOnce([dueSchedule]) // processStart
        .mockResolvedValueOnce([]); // processEnd

      await service.tick();

      expect(mockRepository.find).toHaveBeenCalledTimes(2);
      expect(mockPushService.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: 'ExponentPushToken[xxxxx]',
            title: '⏰ Test Reminder',
            body: 'Test Description',
            data: { schedule_id: 1, kind: 'start' },
          }),
        ]),
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          is_reminded: true,
        }),
      );
    });

    it('should process end notifications', async () => {
      const now = new Date();
      const endingSchedule = {
        ...mockSchedule,
        end_time: new Date(now.getTime() - 1000),
        end_notified_at: null,
      };

      mockRepository.find
        .mockResolvedValueOnce([]) // processStart
        .mockResolvedValueOnce([endingSchedule]); // processEnd

      await service.tick();

      expect(mockPushService.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            to: 'ExponentPushToken[xxxxx]',
            title: '🏁 Kết thúc: Test Reminder',
            body: 'Lịch đã đến giờ kết thúc.',
            data: { schedule_id: 1, kind: 'end' },
          }),
        ]),
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          end_notified_at: expect.any(Date),
        }),
      );
    });

    it('should not process if already running', async () => {
      mockRepository.find.mockResolvedValue([mockSchedule]);

      // Start first tick
      const firstTick = service.tick();
      
      // Try to start second tick while first is running
      const secondTick = service.tick();

      await Promise.all([firstTick, secondTick]);

      // Should only process once
      expect(mockRepository.find).toHaveBeenCalledTimes(2); // 2 calls per tick (start + end)
    });

    it('should handle schedules without push token', async () => {
      const scheduleWithoutToken = {
        ...mockSchedule,
        user: { ...mockSchedule.user, expo_push_token: null },
      };

      mockRepository.find
        .mockResolvedValueOnce([scheduleWithoutToken])
        .mockResolvedValueOnce([]);

      await service.tick();

      expect(mockPushService.send).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should handle empty reminder queue', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.tick();

      expect(mockPushService.send).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update remind_at to future time', async () => {
      const now = new Date();
      const dueSchedule = { ...mockSchedule, remind_at: new Date(now.getTime() - 1000) };

      mockRepository.find
        .mockResolvedValueOnce([dueSchedule])
        .mockResolvedValueOnce([]);

      await service.tick();

      const updateCall = mockRepository.update.mock.calls[0][1];
      expect(updateCall.remind_at.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should use default_remind_minutes from user settings', async () => {
      const customSettings = {
        ...mockSchedule.user!.settings,
        default_remind_minutes: 60,
      };
      const scheduleWithCustomSettings = {
        ...mockSchedule,
        user: { ...mockSchedule.user!, settings: customSettings },
      };

      mockRepository.find
        .mockResolvedValueOnce([scheduleWithCustomSettings])
        .mockResolvedValueOnce([]);

      await service.tick();

      const updateCall = mockRepository.update.mock.calls[0][1];
      const expectedTime = new Date(Date.now() + 60 * 60_000);
      
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(updateCall.remind_at.getTime() - expectedTime.getTime())).toBeLessThan(1000);
    });

    it('should limit to 100 schedules per batch', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.tick();

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should only process pending schedules for start reminders', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.tick();

      const startReminderCall = mockRepository.find.mock.calls[0][0];
      expect(startReminderCall.where.status).toBe('pending');
    });

    it('should only process schedules with null acknowledged_at', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.tick();

      const startReminderCall = mockRepository.find.mock.calls[0][0];
      expect(startReminderCall.where.acknowledged_at).toBeDefined();
    });

    it('should handle errors gracefully and reset running flag', async () => {
      mockRepository.find.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.tick()).rejects.toThrow('Database error');

      // Should be able to run again after error
      mockRepository.find.mockResolvedValue([]);
      await expect(service.tick()).resolves.not.toThrow();
    });
  });
});
