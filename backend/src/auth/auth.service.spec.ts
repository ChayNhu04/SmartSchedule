import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UserSettings } from '../users/entities/user-settings.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let settingsRepo: jest.Mocked<Repository<UserSettings>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    display_name: 'Test User',
    expo_push_token: null,
    created_at: new Date(),
    settings: null,
    schedules: [],
    tags: [],
    templates: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    settingsRepo = module.get(getRepositoryToken(UserSettings));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('nên tạo user mới với thông tin hợp lệ', async () => {
      const dto = {
        email: 'NEW@Example.com',
        password: 'password123',
        display_name: 'New User',
      };

      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser);
      settingsRepo.create.mockReturnValue({} as any);
      settingsRepo.save.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('jwt_token');

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);

      const result = await service.register(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password_hash: 'hashed_password',
        display_name: 'New User',
      });
      expect(settingsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
        },
      });
    });

    it('nên throw ConflictException khi email đã tồn tại', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow('Email đã được sử dụng');
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('nên chuyển email về lowercase', async () => {
      const dto = {
        email: 'UPPERCASE@EXAMPLE.COM',
        password: 'password123',
      };

      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser);
      settingsRepo.create.mockReturnValue({} as any);
      settingsRepo.save.mockResolvedValue({} as any);
      jwtService.sign.mockReturnValue('jwt_token');

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);

      await service.register(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'uppercase@example.com' },
      });
    });
  });

  describe('login', () => {
    it('nên đăng nhập thành công với thông tin đúng', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'correct_password',
      };

      userRepo.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt_token');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correct_password', 'hashed_password');
      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          display_name: 'Test User',
        },
      });
    });

    it('nên throw UnauthorizedException khi email không tồn tại', async () => {
      const dto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });

    it('nên throw UnauthorizedException khi mật khẩu sai', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(dto)).rejects.toThrow('Email hoặc mật khẩu không đúng');
    });
  });

  describe('me', () => {
    it('nên trả về thông tin user (không có password)', async () => {
      const userWithSettings = {
        ...mockUser,
        settings: { user_id: 'user-123', timezone: 'Asia/Ho_Chi_Minh' } as any,
      };

      userRepo.findOne.mockResolvedValue(userWithSettings);

      const result = await service.me('user-123');

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['settings'],
      });
      expect(result).not.toHaveProperty('password_hash');
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('nên throw UnauthorizedException khi user không tồn tại', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.me('invalid-id')).rejects.toThrow(UnauthorizedException);
    });
  });
});
