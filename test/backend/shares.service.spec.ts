import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharesService } from '../../backend/src/shares/shares.service';
import { Schedule } from '../../backend/src/schedules/entities/schedule.entity';
import { User } from '../../backend/src/users/entities/user.entity';

describe('SharesService', () => {
  let service: SharesService;
  let schedulesRepo: Repository<Schedule>;
  let usersRepo: Repository<User>;

  const ownerId = '123e4567-e89b-12d3-a456-426614174000';
  const targetUserId = '987e6543-e21b-12d3-a456-426614174000';

  const mockOwner: User = {
    id: ownerId,
    email: 'owner@example.com',
    password_hash: 'hash',
    display_name: 'Owner',
    expo_push_token: null,
    created_at: new Date(),
    updated_at: new Date(),
    settings: undefined,
    schedules: [],
  };

  const mockTargetUser: User = {
    id: targetUserId,
    email: 'target@example.com',
    password_hash: 'hash',
    display_name: 'Target User',
    expo_push_token: null,
    created_at: new Date(),
    updated_at: new Date(),
    settings: undefined,
    schedules: [],
  };

  const mockSchedule: any = {
    id: 1,
    user_id: ownerId,
    title: 'Test Schedule',
    sharedWith: [],
  };

  const mockSchedulesRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharesService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockSchedulesRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<SharesService>(SharesService);
    schedulesRepo = module.get<Repository<Schedule>>(getRepositoryToken(Schedule));
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('share', () => {
    it('should share schedule with target user', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(mockSchedule);
      mockUsersRepository.findOne.mockResolvedValue(mockTargetUser);
      mockSchedulesRepository.save.mockResolvedValue({
        ...mockSchedule,
        sharedWith: [mockTargetUser],
      });

      const result = await service.share(1, ownerId, targetUserId);

      expect(mockSchedulesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: ownerId },
        relations: ['sharedWith'],
      });
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: targetUserId },
      });
      expect(result.added).toBe(true);
      expect(result.sharedWith).toHaveLength(1);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(null);

      await expect(service.share(999, ownerId, targetUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(mockSchedule);
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.share(1, ownerId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target user is owner', async () => {
      await expect(service.share(1, ownerId, ownerId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target user id is empty', async () => {
      await expect(service.share(1, ownerId, '')).rejects.toThrow(NotFoundException);
    });

    it('should not duplicate if already shared', async () => {
      const scheduleWithShare = {
        ...mockSchedule,
        sharedWith: [mockTargetUser],
      };
      mockSchedulesRepository.findOne.mockResolvedValue(scheduleWithShare);
      mockUsersRepository.findOne.mockResolvedValue(mockTargetUser);

      const result = await service.share(1, ownerId, targetUserId);

      expect(result.added).toBe(false);
      expect(result.sharedWith).toHaveLength(1);
      expect(mockSchedulesRepository.save).not.toHaveBeenCalled();
    });

    it('should add to existing shares', async () => {
      const anotherUser = { ...mockTargetUser, id: 'another-user-id' };
      const scheduleWithShare = {
        ...mockSchedule,
        sharedWith: [anotherUser],
      };
      mockSchedulesRepository.findOne.mockResolvedValue(scheduleWithShare);
      mockUsersRepository.findOne.mockResolvedValue(mockTargetUser);
      mockSchedulesRepository.save.mockResolvedValue({
        ...scheduleWithShare,
        sharedWith: [anotherUser, mockTargetUser],
      });

      const result = await service.share(1, ownerId, targetUserId);

      expect(result.added).toBe(true);
      expect(result.sharedWith).toHaveLength(2);
    });
  });

  describe('unshare', () => {
    it('should remove user from shared list', async () => {
      const scheduleWithShare = {
        ...mockSchedule,
        sharedWith: [mockTargetUser],
      };
      mockSchedulesRepository.findOne.mockResolvedValue(scheduleWithShare);
      mockSchedulesRepository.save.mockResolvedValue({
        ...mockSchedule,
        sharedWith: [],
      });

      const result = await service.unshare(1, ownerId, targetUserId);

      expect(result.removed).toBe(true);
      expect(result.sharedWith).toHaveLength(0);
    });

    it('should throw NotFoundException if schedule not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(null);

      await expect(service.unshare(999, ownerId, targetUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return removed false if user not in shared list', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(mockSchedule);

      const result = await service.unshare(1, ownerId, 'nonexistent-user');

      expect(result.removed).toBe(false);
      expect(mockSchedulesRepository.save).not.toHaveBeenCalled();
    });

    it('should only remove specified user', async () => {
      const anotherUser = { ...mockTargetUser, id: 'another-user-id' };
      const scheduleWithShares = {
        ...mockSchedule,
        sharedWith: [mockTargetUser, anotherUser],
      };
      mockSchedulesRepository.findOne.mockResolvedValue(scheduleWithShares);
      mockSchedulesRepository.save.mockResolvedValue({
        ...mockSchedule,
        sharedWith: [anotherUser],
      });

      const result = await service.unshare(1, ownerId, targetUserId);

      expect(result.removed).toBe(true);
      expect(result.sharedWith).toHaveLength(1);
      expect(result.sharedWith[0].id).toBe('another-user-id');
    });
  });

  describe('listSharedUsers', () => {
    it('should return list of users schedule is shared with', async () => {
      const scheduleWithShares = {
        ...mockSchedule,
        sharedWith: [mockTargetUser],
      };
      mockSchedulesRepository.findOne.mockResolvedValue(scheduleWithShares);

      const result = await service.listSharedUsers(1, ownerId);

      expect(mockSchedulesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: ownerId },
        relations: ['sharedWith'],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(targetUserId);
    });

    it('should return empty array if schedule not found', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(null);

      const result = await service.listSharedUsers(999, ownerId);

      expect(result).toEqual([]);
    });

    it('should return empty array if no shares', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue({ ...mockSchedule, sharedWith: [] });

      const result = await service.listSharedUsers(1, ownerId);

      expect(result).toEqual([]);
    });
  });

  describe('findSchedulesSharedWith', () => {
    it('should find schedules shared with user', async () => {
      const schedules = [mockSchedule];
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(schedules),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findSchedulesSharedWith(targetUserId);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'schedule_shares',
        'ss',
        'ss.schedule_id = s.id AND ss.shared_with_user_id = :userId',
        { userId: targetUserId },
      );
      expect(result).toEqual(schedules);
    });

    it('should include owner information', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findSchedulesSharedWith(targetUserId);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('s.user', 'owner');
    });

    it('should order by start_time', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findSchedulesSharedWith(targetUserId);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s.start_time', 'ASC');
    });

    it('should return empty array if no shared schedules', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockSchedulesRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findSchedulesSharedWith(targetUserId);

      expect(result).toEqual([]);
    });
  });
});
