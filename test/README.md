# SmartSchedule Tests

Thư mục này chứa các file test cho backend SmartSchedule.

## Cấu trúc

```
test/
├── backend/                   # Backend tests (NestJS)
│   ├── auth.service.spec.ts
│   ├── schedules.service.spec.ts
│   ├── reminders.service.spec.ts
│   ├── tags.service.spec.ts
│   ├── templates.service.spec.ts
│   ├── shares.service.spec.ts
│   ├── users.service.spec.ts
│   ├── audit.service.spec.ts
│   ├── auth.e2e.spec.ts
│   ├── schedules.e2e.spec.ts
│   └── jest.config.js
├── web/                       # Web tests (Next.js + React)
│   ├── use-auth.test.ts
│   ├── api.test.ts
│   ├── components/
│   │   ├── EmptyState.test.tsx
│   │   ├── ScheduleCard.test.tsx
│   │   └── PriorityBadge.test.tsx
│   ├── jest.config.js
│   └── jest.setup.js
├── mobile/                    # Mobile tests (React Native + Expo)
│   ├── useAuthStore.test.ts
│   ├── api.test.ts
│   ├── notifications.test.ts
│   ├── components/
│   │   ├── Input.test.tsx
│   │   ├── Button.test.tsx
│   │   └── ScheduleCard.test.tsx
│   ├── jest.config.js
│   └── jest.setup.js
├── jest-e2e.json
├── run-tests.sh              # Script chạy tests (Linux/Mac)
├── run-tests.ps1             # Script chạy tests (Windows)
├── README.md                 # File này
├── HUONG-DAN.md              # Hướng dẫn tiếng Việt
└── TEST-SUMMARY.md           # Tổng kết coverage
```

## Chạy tests

### Cách 1: Sử dụng script helper (Khuyến nghị)

**Linux/Mac:**
```bash
cd test
./run-tests.sh [unit|e2e|cov|all]
```

**Windows:**
```powershell
cd test
.\run-tests.ps1 [unit|e2e|cov|all]
```

Ví dụ:
```bash
# Chạy tất cả tests
./run-tests.sh all

# Chỉ unit tests (nhanh, không cần database)
./run-tests.sh unit

# Chỉ E2E tests
./run-tests.sh e2e

# Tests với coverage report
./run-tests.sh cov
```

### Cách 2: Sử dụng pnpm trực tiếp

**Từ root directory:**

```bash
# Chạy tất cả tests
pnpm test

# Chỉ unit tests
pnpm test:unit

# Chỉ E2E tests
pnpm test:e2e

# Tests với coverage
pnpm test:cov
```

**Từ backend directory:**

```bash
cd backend

# Chạy tất cả tests
pnpm test

# Chỉ unit tests
pnpm test -- --testPathIgnorePatterns=e2e

# Chỉ E2E tests
pnpm test:e2e

# Tests với coverage
pnpm test:cov

# Watch mode
pnpm test:watch

# Chạy một file test cụ thể
pnpm test auth.service.spec
```

## Yêu cầu

### Cho Unit Tests
- Không cần database thật
- Sử dụng mocks cho repositories và services
- Chạy nhanh, isolated

### Cho E2E Tests
- Cần database PostgreSQL đang chạy
- Set biến môi trường `DATABASE_URL` trong `.env`
- Tạo database test riêng (khuyến nghị)

```bash
# Ví dụ .env cho E2E tests
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartschedule_test
JWT_SECRET=test-secret-key-for-e2e-tests
```

## Coverage mục tiêu

- **Unit tests**: ≥ 80% coverage cho services
- **E2E tests**: Cover các happy paths và error cases chính

## Test cases đã implement

### Auth Service
- ✅ Register user mới
- ✅ Register với email đã tồn tại (conflict)
- ✅ Login với credentials đúng
- ✅ Login với password sai
- ✅ Login với email không tồn tại
- ✅ Get user profile
- ✅ Password hashing
- ✅ Email lowercase normalization
- ✅ JWT token generation

### Schedules Service
- ✅ Create schedule
- ✅ Find schedule by ID
- ✅ List schedules với pagination
- ✅ Filter by status, priority
- ✅ Today schedules
- ✅ Upcoming schedules
- ✅ Overdue schedules
- ✅ Search schedules
- ✅ Statistics
- ✅ Update schedule
- ✅ Complete schedule
- ✅ Delete schedule
- ✅ Not found errors
- ✅ User isolation (không thấy lịch của user khác)

### Reminders Service
- ✅ Process start reminders
- ✅ Process end notifications
- ✅ Send push notifications
- ✅ Update remind_at for repeat
- ✅ Handle schedules without push token
- ✅ Prevent concurrent execution
- ✅ Batch processing (limit 100)
- ✅ Use user settings for remind interval
- ✅ Error handling

### Auth E2E
- ✅ Register flow
- ✅ Login flow
- ✅ Get profile
- ✅ Validation errors
- ✅ Unauthorized access
- ✅ Full auth flow integration

### Schedules E2E
- ✅ CRUD operations
- ✅ List với filters
- ✅ Today/upcoming/overdue endpoints
- ✅ Search
- ✅ Stats
- ✅ Complete action
- ✅ Full lifecycle integration
- ✅ Authorization checks

## Thêm tests mới

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from '../backend/src/your-module/your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        // Add mocks here
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add your tests here
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../backend/src/app.module';

describe('YourModule E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/your-endpoint')
      .expect(200);
  });
});
```

## Best Practices

1. **Isolation**: Mỗi test phải độc lập, không phụ thuộc vào thứ tự chạy
2. **Cleanup**: E2E tests nên dùng unique data (timestamp) để tránh conflict
3. **Mocking**: Unit tests mock tất cả dependencies
4. **Assertions**: Test cả happy path và error cases
5. **Naming**: Tên test mô tả rõ ràng behavior đang test
6. **AAA Pattern**: Arrange → Act → Assert

## Troubleshooting

### E2E tests fail với database errors
- Kiểm tra `DATABASE_URL` trong `.env`
- Đảm bảo PostgreSQL đang chạy
- Chạy migrations: `psql $DATABASE_URL -f backend/migrations/001-init.sql`

### Tests timeout
- Tăng timeout trong `jest-e2e.json`: `"testTimeout": 60000`
- Kiểm tra database connection

### Mock không hoạt động
- Đảm bảo `jest.clearAllMocks()` trong `beforeEach`
- Kiểm tra mock implementation

## CI/CD

Tests được chạy tự động trong GitHub Actions workflow:
- Unit tests: Chạy trên mọi PR và push
- E2E tests: Chạy với PostgreSQL service container

Xem `.github/workflows/ci.yml` để biết chi tiết.
