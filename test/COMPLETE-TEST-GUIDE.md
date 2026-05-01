# 🎯 Complete Testing Guide - SmartSchedule

## 📊 Overview

Dự án SmartSchedule có **193 test cases** covering 3 platforms:
- **Backend**: 135 tests (98 unit + 37 E2E)
- **Web**: 29 tests (14 unit + 15 component)
- **Mobile**: 29 tests (29 unit + 12 component)

## 🗂️ Test Structure

```
test/
├── backend/          # 10 files, 135 tests
│   ├── Unit Tests (98)
│   │   ├── auth.service.spec.ts (12)
│   │   ├── schedules.service.spec.ts (20)
│   │   ├── reminders.service.spec.ts (13)
│   │   ├── tags.service.spec.ts (15)
│   │   ├── templates.service.spec.ts (12)
│   │   ├── shares.service.spec.ts (10)
│   │   ├── users.service.spec.ts (8)
│   │   └── audit.service.spec.ts (8)
│   └── E2E Tests (37)
│       ├── auth.e2e.spec.ts (12)
│       └── schedules.e2e.spec.ts (25)
│
├── web/              # 5 files, 29 tests
│   ├── Hooks & Utils (14)
│   │   ├── use-auth.test.ts (8)
│   │   └── api.test.ts (6)
│   └── Components (15)
│       ├── EmptyState.test.tsx (8)
│       ├── ScheduleCard.test.tsx (25)
│       └── PriorityBadge.test.tsx (7)
│
└── mobile/           # 6 files, 29 tests
    ├── Services & Hooks (29)
    │   ├── useAuthStore.test.ts (10)
    │   ├── api.test.ts (7)
    │   └── notifications.test.ts (12)
    └── Components (12)
        ├── Input.test.tsx (8)
        ├── Button.test.tsx (5)
        └── ScheduleCard.test.tsx (11)
```

## 🚀 Quick Start

### Option 1: Run All Tests (Recommended for CI/CD)

**Linux/Mac:**
```bash
cd test
chmod +x run-all-tests.sh
./run-all-tests.sh
```

**Windows:**
```powershell
cd test
.\run-all-tests.ps1
```

### Option 2: Run Tests by Platform

**Backend Only:**
```bash
# Unit tests (fast, no DB needed)
cd test
./run-tests.sh unit

# E2E tests (requires PostgreSQL)
./run-tests.sh e2e

# All backend tests
./run-tests.sh all
```

**Web Only:**
```bash
cd test/web
npm install  # first time only
npm test
```

**Mobile Only:**
```bash
cd test/mobile
npm install  # first time only
npm test
```

## 📋 Prerequisites

### For Backend Tests

**Unit Tests:**
- ✅ No prerequisites
- ✅ Runs in isolation with mocks
- ✅ Fast (~10-20 seconds)

**E2E Tests:**
- ⚠️ PostgreSQL running
- ⚠️ Database created: `smartschedule_test`
- ⚠️ Migrations applied
- ⚠️ `.env` configured in `backend/`

Setup E2E:
```bash
# 1. Create database
createdb smartschedule_test

# 2. Run migrations
cd backend
psql $DATABASE_URL -f migrations/001-init.sql

# 3. Configure .env
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/smartschedule_test" >> .env
echo "JWT_SECRET=test-secret-key-minimum-32-characters-long" >> .env
```

### For Web Tests

**Prerequisites:**
- ✅ Node.js 20+
- ✅ npm or pnpm

**First time setup:**
```bash
cd test/web
npm install
```

**Dependencies:**
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jest`
- `ts-jest`

### For Mobile Tests

**Prerequisites:**
- ✅ Node.js 20+
- ✅ npm or pnpm

**First time setup:**
```bash
cd test/mobile
npm install
```

**Dependencies:**
- `@testing-library/react-native`
- `@testing-library/jest-native`
- `jest`
- `react-native` (preset)

## 🎯 Test Coverage Goals

| Platform | Component | Target | Current Status |
|----------|-----------|--------|----------------|
| Backend | Services | ≥ 80% | ⏳ Run `pnpm test:cov` |
| Backend | Controllers | ≥ 70% | ⏳ Run `pnpm test:cov` |
| Web | Hooks | ≥ 80% | ⏳ Run `npm test -- --coverage` |
| Web | Components | ≥ 70% | ⏳ Run `npm test -- --coverage` |
| Mobile | Services | ≥ 80% | ⏳ Run `npm test -- --coverage` |
| Mobile | Components | ≥ 70% | ⏳ Run `npm test -- --coverage` |

## 📝 Test Patterns Used

### 1. AAA Pattern (Arrange-Act-Assert)
```typescript
it('should create a schedule', async () => {
  // Arrange
  const dto = { title: 'Test', start_time: '2026-05-15T09:00:00Z' };
  
  // Act
  const result = await service.create(userId, dto);
  
  // Assert
  expect(result.title).toBe('Test');
});
```

### 2. Mocking with Jest
```typescript
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};
```

### 3. Component Testing (React)
```typescript
it('should render button text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});
```

### 4. Async Testing
```typescript
it('should fetch data', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### 5. Error Testing
```typescript
it('should throw error', async () => {
  await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
});
```

## 🐛 Troubleshooting

### Backend Tests

**Error: "Cannot find module"**
```bash
cd backend
pnpm install
```

**Error: "Connection refused" (E2E)**
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL
```

**Error: "Relation does not exist"**
```bash
# Run migrations
cd backend
psql $DATABASE_URL -f migrations/001-init.sql
```

### Web Tests

**Error: "Cannot find module '@testing-library/react'"**
```bash
cd test/web
npm install
```

**Error: "window is not defined"**
- This is normal for SSR components
- Tests use jsdom environment
- Check `jest.setup.js` for mocks

### Mobile Tests

**Error: "Cannot find module 'react-native'"**
```bash
cd test/mobile
npm install
```

**Error: "Invariant Violation: Native module cannot be null"**
- Check `jest.setup.js` for proper mocks
- Ensure all Expo modules are mocked

## 📈 Coverage Reports

### Generate Coverage

**Backend:**
```bash
cd backend
pnpm test:cov
# Open: backend/coverage/lcov-report/index.html
```

**Web:**
```bash
cd test/web
npm test -- --coverage
# Open: test/web/coverage/lcov-report/index.html
```

**Mobile:**
```bash
cd test/mobile
npm test -- --coverage
# Open: test/mobile/coverage/lcov-report/index.html
```

### Reading Coverage Reports

- **Green**: Well covered (≥80%)
- **Yellow**: Needs attention (50-80%)
- **Red**: Poor coverage (<50%)

Focus on:
1. Uncovered lines (red highlights)
2. Uncovered branches (if/else not tested)
3. Uncovered functions

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- ✅ Every push to `main`
- ✅ Every pull request
- ✅ Manual workflow dispatch

Workflow file: `.github/workflows/ci.yml`

### Local Pre-commit

Run before committing:
```bash
# Quick check (unit tests only)
cd test
./run-tests.sh unit

# Full check (all tests)
./run-all-tests.sh
```

## 💡 Best Practices

### Writing New Tests

1. **One test, one assertion** (when possible)
2. **Descriptive test names**: `should do X when Y`
3. **Test behavior, not implementation**
4. **Mock external dependencies**
5. **Clean up after tests** (beforeEach/afterEach)

### Test Organization

1. **Group related tests** with `describe`
2. **Use beforeEach** for common setup
3. **Keep tests independent**
4. **Test edge cases** (null, empty, invalid)
5. **Test error paths** (not just happy path)

### Performance

1. **Unit tests should be fast** (<100ms each)
2. **Use mocks** to avoid real I/O
3. **Run unit tests frequently**
4. **Run E2E tests before commit**
5. **Run full suite in CI**

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

## 🎉 Summary

- ✅ **193 tests** across 3 platforms
- ✅ **27 test files** organized by platform
- ✅ **Jest configs** for each platform
- ✅ **Scripts** for easy execution
- ✅ **Mocks** for external dependencies
- ✅ **Documentation** in English & Vietnamese

**Ready to test!** 🚀

---

*Last updated: May 1, 2026*
*Test count: 193 (Backend: 135, Web: 29, Mobile: 29)*
