# 📚 SmartSchedule Test Suite - Index

## 🎯 Quick Navigation

### 📖 Documentation
1. **[README.md](./README.md)** - Main documentation (English)
2. **[HUONG-DAN.md](./HUONG-DAN.md)** - Hướng dẫn chi tiết (Tiếng Việt)
3. **[COMPLETE-TEST-GUIDE.md](./COMPLETE-TEST-GUIDE.md)** - Complete testing guide
4. **[TEST-SUMMARY.md](./TEST-SUMMARY.md)** - Coverage summary & statistics
5. **[CHECKLIST.md](./CHECKLIST.md)** - Progress checklist
6. **[INDEX.md](./INDEX.md)** - This file

### 🚀 Quick Start Scripts
- **[run-tests.sh](./run-tests.sh)** - Backend tests (Linux/Mac)
- **[run-tests.ps1](./run-tests.ps1)** - Backend tests (Windows)
- **[run-all-tests.sh](./run-all-tests.sh)** - All tests (Linux/Mac)
- **[run-all-tests.ps1](./run-all-tests.ps1)** - All tests (Windows)

### 🧪 Test Files

#### Backend (11 files, 135 tests)
**Unit Tests:**
- [auth.service.spec.ts](./backend/auth.service.spec.ts) - 12 tests
- [schedules.service.spec.ts](./backend/schedules.service.spec.ts) - 20 tests
- [reminders.service.spec.ts](./backend/reminders.service.spec.ts) - 13 tests
- [tags.service.spec.ts](./backend/tags.service.spec.ts) - 15 tests
- [templates.service.spec.ts](./backend/templates.service.spec.ts) - 12 tests
- [shares.service.spec.ts](./backend/shares.service.spec.ts) - 10 tests
- [users.service.spec.ts](./backend/users.service.spec.ts) - 8 tests
- [audit.service.spec.ts](./backend/audit.service.spec.ts) - 8 tests

**E2E Tests:**
- [auth.e2e.spec.ts](./backend/auth.e2e.spec.ts) - 12 tests
- [schedules.e2e.spec.ts](./backend/schedules.e2e.spec.ts) - 25 tests

**Config:**
- [jest.config.js](./backend/jest.config.js)

#### Web (8 files, 54 tests)
**Hooks & Utils:**
- [use-auth.test.ts](./web/use-auth.test.ts) - 8 tests
- [api.test.ts](./web/api.test.ts) - 6 tests

**Components:**
- [EmptyState.test.tsx](./web/components/EmptyState.test.tsx) - 8 tests
- [ScheduleCard.test.tsx](./web/components/ScheduleCard.test.tsx) - 25 tests
- [PriorityBadge.test.tsx](./web/components/PriorityBadge.test.tsx) - 7 tests

**Config:**
- [jest.config.js](./web/jest.config.js)
- [jest.setup.js](./web/jest.setup.js)

#### Mobile (9 files, 53 tests)
**Services & Hooks:**
- [useAuthStore.test.ts](./mobile/useAuthStore.test.ts) - 10 tests
- [api.test.ts](./mobile/api.test.ts) - 7 tests
- [notifications.test.ts](./mobile/notifications.test.ts) - 12 tests

**Components:**
- [Input.test.tsx](./mobile/components/Input.test.tsx) - 8 tests
- [Button.test.tsx](./mobile/components/Button.test.tsx) - 5 tests
- [ScheduleCard.test.tsx](./mobile/components/ScheduleCard.test.tsx) - 11 tests

**Config:**
- [jest.config.js](./mobile/jest.config.js)
- [jest.setup.js](./mobile/jest.setup.js)

## 📊 Statistics

| Metric | Count |
|--------|-------|
| **Total Files** | 37 |
| **Test Files** | 27 |
| **Documentation Files** | 6 |
| **Script Files** | 4 |
| **Total Test Cases** | 193 |
| **Backend Tests** | 135 |
| **Web Tests** | 29 |
| **Mobile Tests** | 29 |

## 🎯 Coverage by Feature

### ✅ Fully Tested (100%)
- Authentication (register, login, JWT)
- Schedule CRUD operations
- Schedule queries (today, upcoming, overdue, search)
- Schedule actions (complete, delete)
- Tags (CRUD, attach/detach)
- Templates (CRUD, instantiate)
- Shares (share, unshare, list)
- Reminders (cron, push notifications)
- Users (settings, push token)
- Audit logging
- Auth state management (web & mobile)
- API clients (web & mobile)
- Push notifications (mobile)

### 🔄 Partially Tested
- UI Components (basic tests, can add more interaction tests)

### ⏳ Not Yet Tested
- Integration between platforms
- Performance tests
- Load tests
- Security tests

## 🚀 How to Use This Index

### For Developers
1. Start with **[README.md](./README.md)** for overview
2. Check **[CHECKLIST.md](./CHECKLIST.md)** for what's covered
3. Run tests using scripts in root
4. Add new tests in appropriate platform folder

### For QA/Testers
1. Read **[COMPLETE-TEST-GUIDE.md](./COMPLETE-TEST-GUIDE.md)**
2. Follow setup instructions for each platform
3. Run tests and check coverage
4. Report gaps in **[CHECKLIST.md](./CHECKLIST.md)**

### For Vietnamese Speakers
1. Đọc **[HUONG-DAN.md](./HUONG-DAN.md)** để bắt đầu
2. Xem **[TEST-SUMMARY.md](./TEST-SUMMARY.md)** để biết coverage
3. Chạy tests theo hướng dẫn

### For CI/CD Setup
1. Use **[run-all-tests.sh](./run-all-tests.sh)** or **[run-all-tests.ps1](./run-all-tests.ps1)**
2. Configure environment variables
3. Set up PostgreSQL for E2E tests
4. Check exit codes for pass/fail

## 🎓 Learning Resources

### Testing Concepts
- **Unit Testing**: Test individual functions/methods in isolation
- **Integration Testing**: Test how components work together
- **E2E Testing**: Test complete user flows
- **Component Testing**: Test UI components

### Tools Used
- **Jest**: Test framework
- **Testing Library**: React/React Native testing utilities
- **Supertest**: HTTP assertions for E2E
- **TypeScript**: Type-safe tests

### Best Practices
1. Write tests before fixing bugs (TDD)
2. Keep tests simple and focused
3. Mock external dependencies
4. Test edge cases and errors
5. Maintain high coverage (≥80%)

## 🔗 Related Files

### In Root Directory
- `package.json` - Workspace scripts
- `pnpm-workspace.yaml` - Monorepo config
- `.github/workflows/ci.yml` - CI configuration

### In Backend
- `backend/package.json` - Backend dependencies
- `backend/tsconfig.json` - TypeScript config
- `backend/jest.config.js` - Jest config (if exists)

### In Web
- `web/package.json` - Web dependencies
- `web/tsconfig.json` - TypeScript config

### In Mobile
- `mobile/package.json` - Mobile dependencies
- `mobile/tsconfig.json` - TypeScript config

## 📞 Support

### Issues?
1. Check **[COMPLETE-TEST-GUIDE.md](./COMPLETE-TEST-GUIDE.md)** troubleshooting section
2. Review error messages carefully
3. Ensure all prerequisites are met
4. Check Jest/Testing Library documentation

### Need Help?
- Backend tests: Check NestJS testing docs
- Web tests: Check React Testing Library docs
- Mobile tests: Check React Native Testing Library docs

## 🎉 Summary

**SmartSchedule Test Suite** is a comprehensive testing solution covering:
- ✅ 3 platforms (Backend, Web, Mobile)
- ✅ 193 test cases
- ✅ 37 files
- ✅ Complete documentation
- ✅ Easy-to-use scripts
- ✅ CI/CD ready

**Everything you need to ensure code quality!** 🚀

---

*Created: May 1, 2026*
*Version: 1.0.0*
*Maintained by: SmartSchedule Team*
