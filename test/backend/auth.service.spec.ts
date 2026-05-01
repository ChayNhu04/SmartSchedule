import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../backend/src/auth/auth.service';
import { User } from '../../backend/src/users/entities/user.entity';
import { UserSettings } from '../../backend/src/users/entities/user-settings.entity';
import { RegisterDto, LoginDto } from '../../backend/src/auth/dto/auth.dto';

jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let settingsRepo: Repository<UserSettings>;
  let jwtService: JwtService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    display_name: 'Test User',
    expo_push_token: null,
    created_at: new Date(),
    updated_at: new Date(),
    settings: undefined,
    schedules: [],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSettingsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSettings),
          useValue: mockSettingsRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    settingsRepo = module.get<Repository<UserSettings>>(getRepositoryToken(UserSettings));
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      display_name: 'New User',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockSettingsRepository.create.mockReturnValue({});
      mockSettingsRepository.save.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockSettingsRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          display_name: mockUser.display_name,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email.toLowerCase() },
      });
    });

    it('should hash password before saving', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockSettingsRepository.create.mockReturnValue({});
      mockSettingsRepository.save.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt_token');

      bcryptMock.hash.mockResolvedValue('hashed' as never);

      await service.register(registerDto);

      expect(bcryptMock.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should convert email to lowercase', async () => {
      const dtoWithUpperCase = { ...registerDto, email: 'UPPER@EXAMPLE.COM' };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockSettingsRepository.create.mockReturnValue({});
      mockSettingsRepository.save.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('jwt_token');

      await service.register(dtoWithUpperCase);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'upper@example.com' },
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with correct credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt_token');

      const result = await service.login(loginDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
      expect(result).toEqual({
        access_token: 'jwt_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          display_name: mockUser.display_name,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email.toLowerCase() },
      });
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should convert email to lowercase when logging in', async () => {
      const dtoWithUpperCase = { ...loginDto, email: 'TEST@EXAMPLE.COM' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt_token');

      await service.login(dtoWithUpperCase);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('me', () => {
    it('should return user profile without password', async () => {
      const userWithSettings = { ...mockUser, settings: {} };
      mockUserRepository.findOne.mockResolvedValue(userWithSettings);

      const result = await service.me(mockUser.id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: ['settings'],
      });
      expect(result).not.toHaveProperty('password_hash');
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.me('non-existent-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signToken', () => {
    it('should generate JWT with correct payload', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt_token');

      await service.login({ email: mockUser.email, password: 'password' });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });
  });
});
