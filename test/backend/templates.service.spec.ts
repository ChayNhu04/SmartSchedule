import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatesService } from '../../backend/src/templates/templates.service';
import { ScheduleTemplate } from '../../backend/src/templates/entities/schedule-template.entity';
import { Schedule } from '../../backend/src/schedules/entities/schedule.entity';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templatesRepo: Repository<ScheduleTemplate>;
  let schedulesRepo: Repository<Schedule>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockTemplate: ScheduleTemplate = {
    id: 1,
    user_id: userId,
    name: 'daily-standup',
    item_type: 'meeting',
    title: 'Daily Standup',
    description: 'Team sync meeting',
    duration_minutes: 15,
    default_remind_minutes: 10,
    priority: 'normal',
    created_at: new Date(),
    updated_at: new Date(),
    user: undefined,
  };

  const mockSchedule: any = {
    id: 1,
    user_id: userId,
    title: 'Daily Standup',
    start_time: new Date('2026-05-15T09:00:00Z'),
  };

  const mockTemplatesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockSchedulesRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(ScheduleTemplate),
          useValue: mockTemplatesRepository,
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockSchedulesRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templatesRepo = module.get<Repository<ScheduleTemplate>>(
      getRepositoryToken(ScheduleTemplate),
    );
    schedulesRepo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should return all templates for user', async () => {
      const templates = [mockTemplate, { ...mockTemplate, id: 2, name: 'weekly-review' }];
      mockTemplatesRepository.find.mockResolvedValue(templates);

      const result = await service.list(userId);

      expect(mockTemplatesRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(templates);
    });

    it('should return empty array if no templates', async () => {
      mockTemplatesRepository.find.mockResolvedValue([]);

      const result = await service.list(userId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'daily-standup',
      title: 'Daily Standup',
      description: 'Team sync meeting',
      duration_minutes: 15,
      default_remind_minutes: 10,
      item_type: 'meeting' as const,
      priority: 'normal' as const,
    };

    it('should create a new template', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(null);
      mockTemplatesRepository.create.mockReturnValue(mockTemplate);
      mockTemplatesRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.create(userId, createDto);

      expect(mockTemplatesRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'daily-standup' },
      });
      expect(mockTemplatesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTemplate);
    });

    it('should throw BadRequestException if template already exists', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);

      await expect(service.create(userId, createDto)).rejects.toThrow(BadRequestException);
    });

    it('should normalize template name', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(null);
      mockTemplatesRepository.create.mockReturnValue(mockTemplate);
      mockTemplatesRepository.save.mockResolvedValue(mockTemplate);

      await service.create(userId, { ...createDto, name: '  DAILY-STANDUP  ' });

      expect(mockTemplatesRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'daily-standup' },
      });
    });

    it('should reject invalid template name with special characters', async () => {
      await expect(
        service.create(userId, { ...createDto, name: 'daily@standup' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject template name with spaces', async () => {
      await expect(
        service.create(userId, { ...createDto, name: 'daily standup' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject template name longer than 50 characters', async () => {
      const longName = 'a'.repeat(51);
      await expect(service.create(userId, { ...createDto, name: longName })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid template names with hyphens and underscores', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(null);
      mockTemplatesRepository.create.mockReturnValue(mockTemplate);
      mockTemplatesRepository.save.mockResolvedValue(mockTemplate);

      await service.create(userId, { ...createDto, name: 'daily-standup_2023' });

      expect(mockTemplatesRepository.save).toHaveBeenCalled();
    });

    it('should set default values for optional fields', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(null);
      mockTemplatesRepository.create.mockReturnValue(mockTemplate);
      mockTemplatesRepository.save.mockResolvedValue(mockTemplate);

      await service.create(userId, {
        name: 'simple-task',
        title: 'Simple Task',
      });

      expect(mockTemplatesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          item_type: 'task',
          priority: 'normal',
          description: null,
          duration_minutes: null,
          default_remind_minutes: null,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a template', async () => {
      mockTemplatesRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(userId, 'daily-standup');

      expect(mockTemplatesRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        name: 'daily-standup',
      });
      expect(result).toEqual({ ok: true });
    });

    it('should normalize template name before deletion', async () => {
      mockTemplatesRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(userId, '  DAILY-STANDUP  ');

      expect(mockTemplatesRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        name: 'daily-standup',
      });
    });

    it('should return ok even if template does not exist', async () => {
      mockTemplatesRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.remove(userId, 'nonexistent');

      expect(result).toEqual({ ok: true });
    });
  });

  describe('instantiate', () => {
    const instantiateDto = {
      start_time: '2026-05-15T09:00:00Z',
    };

    it('should create schedule from template', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      const result = await service.instantiate(userId, 'daily-standup', instantiateDto);

      expect(mockTemplatesRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'daily-standup' },
      });
      expect(mockSchedulesRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSchedule);
    });

    it('should throw NotFoundException if template not found', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.instantiate(userId, 'nonexistent', instantiateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate end_time from duration_minutes', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, 'daily-standup', instantiateDto);

      const createCall = mockSchedulesRepository.create.mock.calls[0][0];
      expect(createCall.end_time).toBeInstanceOf(Date);
      expect(createCall.end_time.getTime()).toBe(
        new Date('2026-05-15T09:00:00Z').getTime() + 15 * 60_000,
      );
    });

    it('should calculate remind_at from default_remind_minutes', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, 'daily-standup', instantiateDto);

      const createCall = mockSchedulesRepository.create.mock.calls[0][0];
      expect(createCall.remind_at).toBeInstanceOf(Date);
      expect(createCall.remind_at.getTime()).toBe(
        new Date('2026-05-15T09:00:00Z').getTime() - 10 * 60_000,
      );
    });

    it('should set end_time to null if duration_minutes is null', async () => {
      const templateWithoutDuration = { ...mockTemplate, duration_minutes: null };
      mockTemplatesRepository.findOne.mockResolvedValue(templateWithoutDuration);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, 'daily-standup', instantiateDto);

      const createCall = mockSchedulesRepository.create.mock.calls[0][0];
      expect(createCall.end_time).toBeNull();
    });

    it('should set remind_at to null if default_remind_minutes is null', async () => {
      const templateWithoutRemind = { ...mockTemplate, default_remind_minutes: null };
      mockTemplatesRepository.findOne.mockResolvedValue(templateWithoutRemind);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, 'daily-standup', instantiateDto);

      const createCall = mockSchedulesRepository.create.mock.calls[0][0];
      expect(createCall.remind_at).toBeNull();
    });

    it('should copy all template fields to schedule', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, 'daily-standup', instantiateDto);

      expect(mockSchedulesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          item_type: mockTemplate.item_type,
          title: mockTemplate.title,
          description: mockTemplate.description,
          priority: mockTemplate.priority,
        }),
      );
    });

    it('should normalize template name before instantiating', async () => {
      mockTemplatesRepository.findOne.mockResolvedValue(mockTemplate);
      mockSchedulesRepository.create.mockReturnValue(mockSchedule);
      mockSchedulesRepository.save.mockResolvedValue(mockSchedule);

      await service.instantiate(userId, '  DAILY-STANDUP  ', instantiateDto);

      expect(mockTemplatesRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'daily-standup' },
      });
    });
  });
});
