import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UserSettings } from '../users/entities/user-settings.entity';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSettings) private readonly settings: Repository<UserSettings>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('Email đã được sử dụng');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({
        email: dto.email.toLowerCase(),
        password_hash,
        display_name: dto.display_name ?? null,
      }),
    );
    await this.settings.save(this.settings.create({ user_id: user.id }));
    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    return this.signToken(user);
  }

  async me(userId: string) {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['settings'],
    });
    if (!user) throw new UnauthorizedException();
    const { password_hash, ...safe } = user;
    void password_hash;
    return safe;
  }

  private signToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    return {
      access_token: token,
      user: { id: user.id, email: user.email, display_name: user.display_name },
    };
  }
}
