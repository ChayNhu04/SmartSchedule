import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagsService } from '../backend/src/tags/tags.service';
import { Tag } from '../backend/src/tags/entities/tag.entity';
import { Schedule } from '../backend/src/schedules/entities/schedule.entity';

describe('TagsService', () => {
  let service: TagsService;
  let tagsRepo: Repository<Tag>;
  let schedulesRepo: Repository<Schedule>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockTag: Tag = {
    id: 1,
    user_id: userId,
    name: 'work',
    color: '#3B82F6',
    created_at: new Date(),
    user: null,
    schedules: [],
  };

  const mockSchedule: any = {
    id: 1,
    user_id: userId,
    title: 'Test Schedule',
    tags: [],
  };

  const mockTagsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockSchedulesRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagsRepository,
        },
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockSchedulesRepository,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagsRepo = module.get<Repository<Tag>>(getRepositoryToken(Tag));
    schedulesRepo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(TagsService.normalize('WORK')).toBe('work');
    });

    it('should trim whitespace', () => {
      expect(TagsService.normalize('  work  ')).toBe('work');
    });

    it('should handle mixed case and spaces', () => {
      expect(TagsService.normalize('  Work Tag  ')).toBe('work tag');
    });
  });

  describe('list', () => {
    it('should return all tags for user', async () => {
      const tags = [mockTag, { ...mockTag, id: 2, name: 'personal' }];
      mockTagsRepository.find.mockResolvedValue(tags);

      const result = await service.list(userId);

      expect(mockTagsRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(tags);
    });

    it('should return empty array if no tags', async () => {
      mockTagsRepository.find.mockResolvedValue([]);

      const result = await service.list(userId);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);

      const result = await service.create(userId, { name: 'work', color: '#3B82F6' });

      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'work' },
      });
      expect(mockTagsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTag);
    });

    it('should return existing tag if already exists', async () => {
      mockTagsRepository.findOne.mockResolvedValue(mockTag);

      const result = await service.create(userId, { name: 'work' });

      expect(result).toEqual(mockTag);
      expect(mockTagsRepository.save).not.toHaveBeenCalled();
    });

    it('should normalize tag name', async () => {
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);

      await service.create(userId, { name: '  WORK  ' });

      expect(mockTagsRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, name: 'work' },
      });
    });

    it('should reject invalid tag name with special characters', async () => {
      await expect(service.create(userId, { name: 'work@tag' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tag name with spaces', async () => {
      await expect(service.create(userId, { name: 'work tag' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tag name longer than 30 characters', async () => {
      const longName = 'a'.repeat(31);
      await expect(service.create(userId, { name: longName })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept valid tag names with hyphens and underscores', async () => {
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);

      await service.create(userId, { name: 'work-tag_2023' });

      expect(mockTagsRepository.save).toHaveBeenCalled();
    });

    it('should set color to null if not provided', async () => {
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue({ ...mockTag, color: null });
      mockTagsRepository.save.mockResolvedValue({ ...mockTag, color: null });

      const result = await service.create(userId, { name: 'work' });

      expect(mockTagsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: null }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      mockTagsRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(userId, 'work');

      expect(mockTagsRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        name: 'work',
      });
      expect(result).toEqual({ ok: true });
    });

    it('should normalize tag name before deletion', async () => {
      mockTagsRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(userId, '  WORK  ');

      expect(mockTagsRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        name: 'work',
      });
    });

    it('should return ok even if tag does not exist', async () => {
      mockTagsRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.remove(userId, 'nonexistent');

      expect(result).toEqual({ ok: true });
    });
  });

  describe('attach', () => {
    it('should attach tags to schedule', async () => {
      const schedule = { ...mockSchedule, tags: [] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);
      mockSchedulesRepository.save.mockResolvedValue({
        ...schedule,
        tags: [mockTag],
      });

      const result = await service.attach(userId, 1, ['work']);

      expect(mockSchedulesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: userId },
        relations: ['tags'],
      });
      expect(result.tags).toHaveLength(1);
    });

    it('should create tags if they do not exist', async () => {
      const schedule = { ...mockSchedule, tags: [] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);
      mockSchedulesRepository.save.mockResolvedValue(schedule);

      await service.attach(userId, 1, ['work', 'urgent']);

      expect(mockTagsRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate existing tags', async () => {
      const existingTag = { ...mockTag, name: 'work' };
      const schedule = { ...mockSchedule, tags: [existingTag] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockTagsRepository.findOne.mockResolvedValue(existingTag);
      mockSchedulesRepository.save.mockResolvedValue(schedule);

      const result = await service.attach(userId, 1, ['work']);

      expect(result.tags).toHaveLength(1);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(null);

      await expect(service.attach(userId, 999, ['work'])).rejects.toThrow(NotFoundException);
    });

    it('should handle multiple tags at once', async () => {
      const schedule = { ...mockSchedule, tags: [] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockTagsRepository.findOne.mockResolvedValue(null);
      mockTagsRepository.create.mockReturnValue(mockTag);
      mockTagsRepository.save.mockResolvedValue(mockTag);
      mockSchedulesRepository.save.mockResolvedValue(schedule);

      await service.attach(userId, 1, ['work', 'urgent', 'meeting']);

      expect(mockTagsRepository.save).toHaveBeenCalledTimes(3);
    });
  });

  describe('detach', () => {
    it('should remove tag from schedule', async () => {
      const tag1 = { ...mockTag, name: 'work' };
      const tag2 = { ...mockTag, id: 2, name: 'urgent' };
      const schedule = { ...mockSchedule, tags: [tag1, tag2] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockSchedulesRepository.save.mockResolvedValue({
        ...schedule,
        tags: [tag2],
      });

      const result = await service.detach(userId, 1, 'work');

      expect(result.tags).toHaveLength(1);
      expect(result.tags[0].name).toBe('urgent');
    });

    it('should normalize tag name before detaching', async () => {
      const tag = { ...mockTag, name: 'work' };
      const schedule = { ...mockSchedule, tags: [tag] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockSchedulesRepository.save.mockResolvedValue({
        ...schedule,
        tags: [],
      });

      await service.detach(userId, 1, '  WORK  ');

      expect(mockSchedulesRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [] }),
      );
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(null);

      await expect(service.detach(userId, 999, 'work')).rejects.toThrow(NotFoundException);
    });

    it('should handle detaching non-existent tag gracefully', async () => {
      const schedule = { ...mockSchedule, tags: [mockTag] };
      mockSchedulesRepository.findOne.mockResolvedValue(schedule);
      mockSchedulesRepository.save.mockResolvedValue(schedule);

      const result = await service.detach(userId, 1, 'nonexistent');

      expect(result.tags).toHaveLength(1);
    });
  });

  describe('findSchedulesByTag', () => {
    it('should find schedules with specific tag', async () => {
      const schedules = [mockSchedule];
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(schedules),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findSchedulesByTag(userId, 'work');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        's.user_id = :userId AND t.name = :name',
        { userId, name: 'work' },
      );
      expect(result).toEqual(schedules);
    });

    it('should normalize tag name before searching', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findSchedulesByTag(userId, '  WORK  ');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        's.user_id = :userId AND t.name = :name',
        { userId, name: 'work' },
      );
    });

    it('should return empty array if no schedules found', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findSchedulesByTag(userId, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should order results by start_time', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findSchedulesByTag(userId, 'work');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s.start_time', 'ASC');
    });
  });
});
