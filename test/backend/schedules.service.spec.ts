import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulesService } from '../../backend/src/schedules/schedules.service';
import { Schedule, ScheduleStatus } from '../../backend/src/schedules/entities/schedule.entity';
import { AuditService } from '../../backend/src/audit/audit.service';
import { UndoStore } from '../../backend/src/schedules/undo.store';
import { CreateScheduleDto, UpdateScheduleDto } from '../../backend/src/schedules/dto/schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let repo: Repository<Schedule>;
  let auditService: AuditService;
  let undoStore: UndoStore;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockSchedule: Schedule = {
    id: 1,
    user_id: userId,
    item_type: 'task',
    title: 'Test Schedule',
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
    user: undefined,
    tags: [],
    sharedWith: [],
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        UndoStore,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockRepository,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
    repo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
    auditService = module.get<AuditService>(AuditService);
    undoStore = module.get<UndoStore>(UndoStore);

    jest.clearAllMocks();
    undoStore.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateScheduleDto = {
      title: 'New Schedule',
      start_time: '2026-05-15T09:00:00Z',
      item_type: 'task',
      priority: 'high',
    };

    it('should create a new schedule', async () => {
      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.create(userId, createDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(mockSchedule.id, userId, 'create');
      expect(result).toEqual(mockSchedule);
    });

    it('should set default values for optional fields', async () => {
      const minimalDto: CreateScheduleDto = {
        title: 'Minimal Schedule',
        start_time: '2026-05-15T09:00:00Z',
      };

      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockResolvedValue(mockSchedule);

      await service.create(userId, minimalDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          item_type: 'task',
          priority: 'normal',
          recurrence_type: 'none',
          recurrence_interval: 1,
        }),
      );
    });

    it('should convert date strings to Date objects', async () => {
      mockRepository.create.mockReturnValue(mockSchedule);
      mockRepository.save.mockResolvedValue(mockSchedule);

      await service.create(userId, createDto);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.start_time).toBeInstanceOf(Date);
    });
  });

  describe('findOne', () => {
    it('should return a schedule by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockSchedule);

      const result = await service.findOne(userId, 1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: userId },
        relations: ['tags'],
      });
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 999)).rejects.toThrow(NotFoundException);
    });

    it('should not return schedules from other users', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('other-user-id', 1)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 'other-user-id' },
        relations: ['tags'],
      });
    });
  });

  describe('list', () => {
    it('should return paginated list of schedules', async () => {
      const schedules = [mockSchedule];
      mockRepository.findAndCount.mockResolvedValue([schedules, 1]);

      const result = await service.list(userId, {});

      expect(result).toEqual({
        items: schedules,
        total: 1,
        limit: 20,
        offset: 0,
      });
    });

    it('should filter by status', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.list(userId, { status: 'completed' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });

    it('should filter by priority', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.list(userId, { priority: 'high' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'high' }),
        }),
      );
    });

    it('should support custom limit and offset', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.list(userId, { limit: 10, offset: 5 });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('today', () => {
    it('should return schedules for today', async () => {
      mockRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.today(userId);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockSchedule]);
    });

    it('should filter by today date range', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.today(userId);

      const findCall = mockRepository.find.mock.calls[0][0];
      expect(findCall.where.user_id).toBe(userId);
      expect(findCall.where.start_time).toBeDefined();
    });
  });

  describe('upcoming', () => {
    it('should return upcoming schedules', async () => {
      mockRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.upcoming(userId, 5);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
            status: 'pending',
          }),
          take: 5,
        }),
      );
      expect(result).toEqual([mockSchedule]);
    });

    it('should use default limit of 5', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.upcoming(userId);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  describe('overdue', () => {
    it('should return overdue schedules', async () => {
      mockRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.overdue(userId);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: userId,
            status: 'pending',
          }),
        }),
      );
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('search', () => {
    it('should search schedules by keyword', async () => {
      mockRepository.find.mockResolvedValue([mockSchedule]);

      const result = await service.search(userId, 'test');

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockSchedule]);
    });

    it('should return empty array if no keyword provided', async () => {
      const result = await service.search(userId, '');

      expect(result).toEqual([]);
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should limit results to 50', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.search(userId, 'keyword');

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  describe('stats', () => {
    it('should return statistics', async () => {
      const schedules = [
        { ...mockSchedule, status: 'completed' as ScheduleStatus },
        { ...mockSchedule, id: 2, status: 'pending' as ScheduleStatus },
      ];
      mockRepository.find.mockResolvedValue(schedules);

      const result = await service.stats(userId);

      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.completionRate).toBe(0.5);
      expect(result.byPriority).toBeDefined();
      expect(result.byType).toBeDefined();
    });

    it('should handle empty results', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.stats(userId);

      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe('update', () => {
    const updateDto: UpdateScheduleDto = {
      title: 'Updated Title',
      priority: 'high',
    };

    it('should update a schedule', async () => {
      mockRepository.findOne.mockResolvedValue(mockSchedule);
      mockRepository.save.mockResolvedValue({ ...mockSchedule, ...updateDto });

      const result = await service.update(userId, 1, updateDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(1, userId, 'update');
      expect(result.title).toBe(updateDto.title);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, 999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('should mark schedule as completed', async () => {
      mockRepository.findOne.mockResolvedValue(mockSchedule);
      const completedSchedule = {
        ...mockSchedule,
        status: 'completed' as ScheduleStatus,
        acknowledged_at: expect.any(Date),
      };
      mockRepository.save.mockResolvedValue(completedSchedule);

      const result = await service.complete(userId, 1);

      expect(result.status).toBe('completed');
      expect(result.acknowledged_at).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(1, userId, 'complete');
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.complete(userId, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a schedule', async () => {
      mockRepository.findOne.mockResolvedValue(mockSchedule);
      mockRepository.remove.mockResolvedValue(mockSchedule);

      const result = await service.remove(userId, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockSchedule);
      expect(mockAuditService.log).toHaveBeenCalledWith(1, userId, 'delete');
      expect(result).toEqual({ ok: true });
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('undo', () => {
    /**
     * Trả Schedule fresh mỗi test, tránh share reference với các describe khác
     * (vì describe('update') mutate `mockSchedule` qua Object.assign).
     */
    const freshSchedule = (override: Partial<Schedule> = {}): Schedule => ({
      ...mockSchedule,
      title: 'Undo Schedule',
      ...override,
    });

    it('peekUndo returns null when no entries', () => {
      expect(service.peekUndo(userId)).toBeNull();
    });

    it('after delete, peekUndo returns the entry', async () => {
      const s = freshSchedule();
      mockRepository.findOne.mockResolvedValue(s);
      mockRepository.remove.mockResolvedValue(s);

      await service.remove(userId, 1);

      const peek = service.peekUndo(userId);
      expect(peek).not.toBeNull();
      expect(peek!.action).toBe('delete');
      expect(peek!.title).toBe('Undo Schedule');
      expect(peek!.expiresAt).toBeGreaterThan(Date.now());
    });

    it('after complete, peekUndo returns the entry', async () => {
      const s = freshSchedule();
      mockRepository.findOne.mockResolvedValue(s);
      mockRepository.save.mockResolvedValue({
        ...s,
        status: 'completed' as ScheduleStatus,
      });

      await service.complete(userId, 1);

      const peek = service.peekUndo(userId);
      expect(peek).not.toBeNull();
      expect(peek!.action).toBe('complete');
    });

    it('undoLast after delete re-creates the schedule', async () => {
      const s = freshSchedule();
      mockRepository.findOne.mockResolvedValue(s);
      mockRepository.remove.mockResolvedValue(s);
      await service.remove(userId, 1);

      const restored = { ...s, id: 42 };
      mockRepository.create.mockReturnValue(restored);
      mockRepository.save.mockResolvedValue(restored);

      const result = await service.undoLast(userId);

      expect(result.action).toBe('delete');
      expect(result.schedule.title).toBe('Undo Schedule');
      expect(mockAuditService.log).toHaveBeenCalledWith(42, userId, 'restore');
      expect(service.peekUndo(userId)).toBeNull();
    });

    it('undoLast after complete reverts status', async () => {
      const s = freshSchedule();
      mockRepository.findOne.mockResolvedValueOnce(s);
      mockRepository.save.mockResolvedValueOnce({
        ...s,
        status: 'completed' as ScheduleStatus,
        acknowledged_at: new Date(),
      });

      await service.complete(userId, 1);

      const completedRow = {
        ...s,
        status: 'completed' as ScheduleStatus,
        acknowledged_at: new Date(),
      };
      mockRepository.findOne.mockResolvedValueOnce(completedRow);
      mockRepository.save.mockResolvedValueOnce({
        ...completedRow,
        status: 'pending' as ScheduleStatus,
        acknowledged_at: null,
      });

      const result = await service.undoLast(userId);

      expect(result.action).toBe('complete');
      expect(result.schedule.status).toBe('pending');
      expect(result.schedule.acknowledged_at).toBeNull();
      expect(mockAuditService.log).toHaveBeenCalledWith(1, userId, 'restore');
    });

    it('undoLast throws BadRequestException when stack empty', async () => {
      await expect(service.undoLast(userId)).rejects.toThrow(BadRequestException);
    });

    it('undoLast pops only the most recent entry', async () => {
      const first = freshSchedule({ title: 'First' });
      mockRepository.findOne.mockResolvedValue(first);
      mockRepository.remove.mockResolvedValue(first);
      await service.remove(userId, 1);

      const second = freshSchedule({ id: 2, title: 'Second' });
      mockRepository.findOne.mockResolvedValue(second);
      mockRepository.remove.mockResolvedValue(second);
      await service.remove(userId, 2);

      const restored2 = { ...second, id: 99 };
      mockRepository.create.mockReturnValue(restored2);
      mockRepository.save.mockResolvedValue(restored2);

      const r = await service.undoLast(userId);
      expect(r.schedule.title).toBe('Second');

      const peek = service.peekUndo(userId);
      expect(peek).not.toBeNull();
      expect(peek!.title).toBe('First');
    });
  });
});
