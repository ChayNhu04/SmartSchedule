import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../backend/src/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;
  let authToken: string;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123456!',
    display_name: 'Test User E2E',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email.toLowerCase());
          expect(res.body.user.display_name).toBe(testUser.display_name);
          authToken = res.body.access_token;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email đã được sử dụng');
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123456!',
        })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123',
        })
        .expect(400);
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email.toLowerCase());
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Email hoặc mật khẩu không đúng');
        });
    });

    it('should reject non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456!',
        })
        .expect(401);
    });

    it('should handle case-insensitive email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password,
        })
        .expect(201);
    });
  });

  describe('/api/auth/me (GET)', () => {
    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('settings');
          expect(res.body).not.toHaveProperty('password_hash');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('Auth Flow Integration', () => {
    it('should complete full auth flow: register -> login -> me', async () => {
      const uniqueUser = {
        email: `flow-test-${Date.now()}@example.com`,
        password: 'FlowTest123!',
        display_name: 'Flow Test User',
      };

      // Step 1: Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(uniqueUser)
        .expect(201);

      expect(registerRes.body).toHaveProperty('access_token');
      const token1 = registerRes.body.access_token;

      // Step 2: Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: uniqueUser.email,
          password: uniqueUser.password,
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty('access_token');
      const token2 = loginRes.body.access_token;

      // Step 3: Get profile with register token
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(uniqueUser.email.toLowerCase());
        });

      // Step 4: Get profile with login token
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(uniqueUser.email.toLowerCase());
        });
    });
  });
});
