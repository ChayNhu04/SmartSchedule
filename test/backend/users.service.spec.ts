import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../backend/src/users/users.service';
import { User } from '../../backend/src/users/entities/user.entity';
import { UserSettings } from '../../backend/src/users/entities/user-settings.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: Repository<User>;
  let settingsRepo: Repository<UserSettings>;

  const userId = '123e4567-e89b-12d3-a456-426614174000';

  const mockUser: User = {
    id: userId,
    email: 'test@example.com',
    password_hash: 'hash',
    display_name: 'Test User',
    expo_push_token: null,
    created_at: new Date(),
    updated_at: new Date(),
    settings: undefined,
    schedules: [],
  };

  const mockSettings: UserSettings = {
    user_id: userId,
    timezone: 'Asia/Ho_Chi_Minh',
    default_remind_minutes: 30,
    notify_via_push: true,
    work_start_hour: 9,
    work_end_hour: 18,
    created_at: new Date(),
    updated_at: new Date(),
    user: undefined,
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockSettingsRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockSettingsRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));
    settingsRepo = module.get<Repository<UserSettings>>(getRepositoryToken(UserSettings));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return user settings', async () => {
      mockSettingsRepository.findOne.mockResolvedValue(mockSettings);

      const result = await service.getSettings(userId);

      expect(mockSettingsRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(result).toEqual(mockSettings);
    });

    it('should throw NotFoundException if settings not found', async () => {
      mockSettingsRepository.findOne.mockResolvedValue(null);

      await expect(service.getSettings(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    const updateDto = {
      timezone: 'America/New_York',
      default_remind_minutes: 60,
      notify_via_push: false,
    };

    it('should update user settings', async () => {
      const updatedSettings = { ...mockSettings, ...updateDto };
      mockSettingsRepository.update.mockResolvedValue({ affected: 1 });
      mockSettingsRepository.findOne.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(userId, updateDto);

      expect(mockSettingsRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        updateDto,
      );
      expect(result).toEqual(updatedSettings);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { timezone: 'Europe/London' };
      mockSettingsRepository.update.mockResolvedValue({ affected: 1 });
      mockSettingsRepository.findOne.mockResolvedValue({
        ...mockSettings,
        ...partialUpdate,
      });

      const result = await service.updateSettings(userId, partialUpdate);

      expect(mockSettingsRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        partialUpdate,
      );
      expect(result.timezone).toBe('Europe/London');
    });

    it('should throw NotFoundException if settings not found after update', async () => {
      mockSettingsRepository.update.mockResolvedValue({ affected: 1 });
      mockSettingsRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSettings(userId, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerPushToken', () => {
    const pushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

    it('should register push token', async () => {
      mockUsersRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.registerPushToken(userId, pushToken);

      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        { id: userId },
        { expo_push_token: pushToken },
      );
      expect(result).toEqual({ ok: true });
    });

    it('should update existing push token', async () => {
      const newToken = 'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]';
      mockUsersRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.registerPushToken(userId, newToken);

      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        { id: userId },
        { expo_push_token: newToken },
      );
      expect(result).toEqual({ ok: true });
    });

    it('should return ok even if user not found', async () => {
      mockUsersRepository.update.mockResolvedValue({ affected: 0 });

      const result = await service.registerPushToken('nonexistent', pushToken);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userWithSettings = { ...mockUser, settings: mockSettings };
      mockUsersRepository.findOne.mockResolvedValue(userWithSettings);

      const result = await service.findById(userId);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['settings'],
      });
      expect(result).toEqual(userWithSettings);
    });

    it('should return null if user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should include settings relation', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await service.findById(userId);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['settings'],
        }),
      );
    });
  });
});
