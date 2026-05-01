import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../backend/src/audit/audit.service';
import { ScheduleAuditLog } from '../backend/src/audit/entities/schedule-audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repo: Repository<ScheduleAuditLog>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const scheduleId = 1;

  const mockAuditLog: ScheduleAuditLog = {
    id: BigInt(1),
    schedule_id: scheduleId,
    user_id: userId,
    action: 'create',
    changes: null,
    created_at: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(ScheduleAuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get<Repository<ScheduleAuditLog>>(getRepositoryToken(ScheduleAuditLog));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log(scheduleId, userId, 'create');

      expect(mockRepository.create).toHaveBeenCalledWith({
        schedule_id: scheduleId,
        user_id: userId,
        action: 'create',
        changes: null,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should log with changes', async () => {
      const changes = {
        title: { from: 'Old Title', to: 'New Title' },
        priority: { from: 'low', to: 'high' },
      };
      mockRepository.create.mockReturnValue({ ...mockAuditLog, changes });
      mockRepository.save.mockResolvedValue({ ...mockAuditLog, changes });

      await service.log(scheduleId, userId, 'update', changes);

      expect(mockRepository.create).toHaveBeenCalledWith({
        schedule_id: scheduleId,
        user_id: userId,
        action: 'update',
        changes,
      });
    });

    it('should log different actions', async () => {
      const actions = ['create', 'update', 'complete', 'cancel', 'delete', 'restore'];
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      for (const action of actions) {
        await service.log(scheduleId, userId, action as any);
        expect(mockRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ action }),
        );
      }
    });

    it('should log share actions', async () => {
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log(scheduleId, userId, 'share-add');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'share-add' }),
      );

      await service.log(scheduleId, userId, 'share-remove');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'share-remove' }),
      );
    });

    it('should log tag actions', async () => {
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log(scheduleId, userId, 'tag-add');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'tag-add' }),
      );

      await service.log(scheduleId, userId, 'tag-remove');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'tag-remove' }),
      );
    });

    it('should handle null changes', async () => {
      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log(scheduleId, userId, 'create', null);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ changes: null }),
      );
    });
  });

  describe('history', () => {
    it('should return audit history for schedule', async () => {
      const logs = [
        mockAuditLog,
        { ...mockAuditLog, id: BigInt(2), action: 'update' as const },
      ];
      mockRepository.findAndCount.mockResolvedValue([logs, 2]);

      const result = await service.history(scheduleId, userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { schedule_id: scheduleId, user_id: userId },
        order: { created_at: 'DESC' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual([logs, 2]);
    });

    it('should support pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.history(scheduleId, userId, 10, 5);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { schedule_id: scheduleId, user_id: userId },
        order: { created_at: 'DESC' },
        take: 10,
        skip: 5,
      });
    });

    it('should use default limit of 20', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.history(scheduleId, userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
    });

    it('should use default offset of 0', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.history(scheduleId, userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });

    it('should order by created_at DESC', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.history(scheduleId, userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { created_at: 'DESC' },
        }),
      );
    });

    it('should return empty array if no history', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.history(scheduleId, userId);

      expect(result).toEqual([[], 0]);
    });

    it('should filter by schedule_id and user_id', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.history(scheduleId, userId);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schedule_id: scheduleId, user_id: userId },
        }),
      );
    });
  });
});
