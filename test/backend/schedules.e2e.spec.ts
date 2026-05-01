import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../backend/src/app.module';

describe('Schedules E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let scheduleId: number;

  const testUser = {
    email: `schedule-test-${Date.now()}@example.com`,
    password: 'Test123456!',
    display_name: 'Schedule Test User',
  };

  const testSchedule = {
    title: 'Test Meeting',
    description: 'E2E test schedule',
    start_time: new Date('2026-06-01T09:00:00Z').toISOString(),
    end_time: new Date('2026-06-01T10:00:00Z').toISOString(),
    item_type: 'meeting',
    priority: 'high',
    remind_at: new Date('2026-06-01T08:30:00Z').toISOString(),
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

    // Register and login test user
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    authToken = registerRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/schedules (POST)', () => {
    it('should create a new schedule', () => {
      return request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSchedule)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(testSchedule.title);
          expect(res.body.description).toBe(testSchedule.description);
          expect(res.body.priority).toBe(testSchedule.priority);
          expect(res.body.status).toBe('pending');
          scheduleId = res.body.id;
        });
    });

    it('should create schedule with minimal fields', () => {
      return request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Minimal Schedule',
          start_time: new Date('2026-06-02T10:00:00Z').toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Minimal Schedule');
          expect(res.body.item_type).toBe('task');
          expect(res.body.priority).toBe('normal');
        });
    });

    it('should reject schedule without title', () => {
      return request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          start_time: new Date('2026-06-02T10:00:00Z').toISOString(),
        })
        .expect(400);
    });

    it('should reject schedule without start_time', () => {
      return request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Start Time',
        })
        .expect(400);
    });

    it('should reject unauthorized request', () => {
      return request(app.getHttpServer())
        .post('/api/schedules')
        .send(testSchedule)
        .expect(401);
    });
  });

  describe('/api/schedules (GET)', () => {
    it('should list user schedules', () => {
      return request(app.getHttpServer())
        .get('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('offset');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/schedules?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.every((s: any) => s.status === 'pending')).toBe(true);
        });
    });

    it('should filter by priority', () => {
      return request(app.getHttpServer())
        .get('/api/schedules?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.every((s: any) => s.priority === 'high')).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/schedules?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.limit).toBe(5);
          expect(res.body.offset).toBe(0);
        });
    });
  });

  describe('/api/schedules/:id (GET)', () => {
    it('should get schedule by id', () => {
      return request(app.getHttpServer())
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(scheduleId);
          expect(res.body.title).toBe(testSchedule.title);
        });
    });

    it('should return 404 for non-existent schedule', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/schedules/today (GET)', () => {
    it('should get today schedules', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/schedules/upcoming (GET)', () => {
    it('should get upcoming schedules', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/upcoming')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/upcoming?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });
  });

  describe('/api/schedules/overdue (GET)', () => {
    it('should get overdue schedules', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/schedules/search (GET)', () => {
    it('should search schedules by keyword', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/search?q=Meeting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return empty array for empty query', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/search?q=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('/api/schedules/stats (GET)', () => {
    it('should get statistics', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('completed');
          expect(res.body).toHaveProperty('completionRate');
          expect(res.body).toHaveProperty('byPriority');
          expect(res.body).toHaveProperty('byType');
        });
    });

    it('should support range parameter', () => {
      return request(app.getHttpServer())
        .get('/api/schedules/stats?range=tuan')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/api/schedules/:id (PATCH)', () => {
    it('should update schedule', () => {
      return request(app.getHttpServer())
        .patch(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Meeting Title',
          priority: 'normal',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Meeting Title');
          expect(res.body.priority).toBe('normal');
        });
    });

    it('should return 404 for non-existent schedule', () => {
      return request(app.getHttpServer())
        .patch('/api/schedules/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('/api/schedules/:id/complete (POST)', () => {
    it('should mark schedule as completed', () => {
      return request(app.getHttpServer())
        .post(`/api/schedules/${scheduleId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('completed');
          expect(res.body.acknowledged_at).toBeDefined();
        });
    });

    it('should be idempotent', async () => {
      const res1 = await request(app.getHttpServer())
        .post(`/api/schedules/${scheduleId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post(`/api/schedules/${scheduleId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res1.body.status).toBe('completed');
      expect(res2.body.status).toBe('completed');
    });
  });

  describe('/api/schedules/:id (DELETE)', () => {
    it('should delete schedule', () => {
      return request(app.getHttpServer())
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ ok: true });
        });
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent schedule', () => {
      return request(app.getHttpServer())
        .delete('/api/schedules/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Schedule Flow Integration', () => {
    it('should complete full schedule lifecycle', async () => {
      // Create
      const createRes = await request(app.getHttpServer())
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Lifecycle Test',
          start_time: new Date('2026-07-01T14:00:00Z').toISOString(),
          priority: 'low',
        })
        .expect(201);

      const id = createRes.body.id;

      // Read
      await request(app.getHttpServer())
        .get(`/api/schedules/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Lifecycle Test');
        });

      // Update
      await request(app.getHttpServer())
        .patch(`/api/schedules/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Lifecycle Test' })
        .expect(200);

      // Complete
      await request(app.getHttpServer())
        .post(`/api/schedules/${id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('completed');
        });

      // Delete
      await request(app.getHttpServer())
        .delete(`/api/schedules/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/schedules/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
