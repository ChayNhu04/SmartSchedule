# Hướng dẫn chạy Tests - SmartSchedule

## 🚀 Bắt đầu nhanh

### Cách đơn giản nhất (Khuyến nghị)

**Windows:**
```powershell
cd test
.\run-tests.ps1 unit
```

**Linux/Mac:**
```bash
cd test
./run-tests.sh unit
```

## 📋 Các loại tests

### 1. Unit Tests (Nhanh - Không cần database)
Tests các service riêng lẻ với mock data.

```powershell
# Windows
.\run-tests.ps1 unit

# Linux/Mac
./run-tests.sh unit

# Hoặc từ root
pnpm test:unit
```

**Thời gian:** ~5-10 giây  
**Yêu cầu:** Không cần gì cả, chỉ cần code

### 2. E2E Tests (Chậm - Cần database)
Tests toàn bộ API endpoints với database thật.

```powershell
# Windows
.\run-tests.ps1 e2e

# Linux/Mac
./run-tests.sh e2e

# Hoặc từ root
pnpm test:e2e
```

**Thời gian:** ~30-60 giây  
**Yêu cầu:** 
- PostgreSQL đang chạy
- File `.env` trong `backend/` có `DATABASE_URL`

### 3. Coverage Tests (Xem độ phủ code)
Chạy tests và tạo báo cáo coverage.

```powershell
# Windows
.\run-tests.ps1 cov

# Linux/Mac
./run-tests.sh cov

# Hoặc từ root
pnpm test:cov
```

**Kết quả:** File HTML trong `backend/coverage/lcov-report/index.html`

### 4. All Tests (Tất cả)
Chạy unit tests trước, sau đó hỏi có muốn chạy E2E không.

```powershell
# Windows
.\run-tests.ps1 all

# Linux/Mac
./run-tests.sh all

# Hoặc từ root
pnpm test
```

## 🔧 Setup cho E2E Tests

### Bước 1: Cài PostgreSQL

**Windows:**
- Download từ https://www.postgresql.org/download/windows/
- Hoặc dùng Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`

**Linux/Mac:**
```bash
# Mac với Homebrew
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql-16

# Hoặc Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

### Bước 2: Tạo database test

```sql
-- Kết nối vào PostgreSQL
psql -U postgres

-- Tạo database
CREATE DATABASE smartschedule_test;

-- Thoát
\q
```

### Bước 3: Cấu hình .env

Tạo hoặc sửa file `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartschedule_test
JWT_SECRET=test-secret-key-minimum-32-characters-long
```

### Bước 4: Chạy migrations

```bash
cd backend
psql $DATABASE_URL -f migrations/001-init.sql
```

### Bước 5: Chạy E2E tests

```powershell
cd test
.\run-tests.ps1 e2e
```

## 📊 Đọc kết quả tests

### Kết quả thành công
```
✅ Auth Service
  ✓ should register a new user (15ms)
  ✓ should login with correct credentials (12ms)
  ✓ should throw error for wrong password (8ms)

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Time:        8.234s
```

### Kết quả thất bại
```
❌ Auth Service
  ✓ should register a new user (15ms)
  ✗ should login with correct credentials (12ms)
    
    Expected: 200
    Received: 401

Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 44 passed, 45 total
```

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
```bash
# Cài lại dependencies
cd backend
pnpm install
```

### Lỗi: "Connection refused" (E2E tests)
- Kiểm tra PostgreSQL có đang chạy không:
  ```bash
  # Windows
  Get-Service postgresql*
  
  # Linux/Mac
  pg_isready
  ```
- Kiểm tra `DATABASE_URL` trong `.env`

### Lỗi: "Relation does not exist"
```bash
# Chạy lại migrations
cd backend
psql $DATABASE_URL -f migrations/001-init.sql
```

### Tests chạy quá chậm
- Chỉ chạy unit tests: `.\run-tests.ps1 unit`
- Hoặc chạy một file cụ thể:
  ```bash
  cd backend
  pnpm test auth.service.spec
  ```

### Lỗi: "Port 5432 already in use"
- PostgreSQL đã chạy rồi, không cần làm gì
- Hoặc có service khác đang dùng port 5432, đổi port trong `DATABASE_URL`

## 📝 Chạy test cụ thể

### Chạy một file test
```bash
cd backend
pnpm test auth.service.spec
```

### Chạy tests có tên chứa "login"
```bash
cd backend
pnpm test -- -t "login"
```

### Watch mode (tự động chạy lại khi code thay đổi)
```bash
cd backend
pnpm test:watch
```

## 📈 Coverage Report

Sau khi chạy `pnpm test:cov`, mở file:
```
backend/coverage/lcov-report/index.html
```

Trong browser để xem:
- % code được test
- Dòng nào chưa được test (màu đỏ)
- Branch nào chưa cover

## 🎯 Mục tiêu Coverage

- **Services:** ≥ 80%
- **Controllers:** ≥ 70%
- **Overall:** ≥ 75%

## 💡 Tips

1. **Chạy unit tests thường xuyên** khi code - nhanh và không cần setup
2. **Chạy E2E tests trước khi commit** - đảm bảo API hoạt động đúng
3. **Xem coverage report** để biết phần nào cần thêm tests
4. **Dùng watch mode** khi viết tests mới - tự động chạy lại

## 📚 Tài liệu thêm

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)

## ❓ Câu hỏi thường gặp

**Q: Tôi cần chạy tests trước mỗi lần commit không?**  
A: Khuyến nghị chạy ít nhất unit tests. E2E tests có thể chạy trước khi push.

**Q: Tests có chạy tự động trong CI/CD không?**  
A: Có, GitHub Actions sẽ chạy tất cả tests khi bạn tạo PR.

**Q: Tôi có thể skip E2E tests không?**  
A: Có, chỉ chạy `.\run-tests.ps1 unit` hoặc chọn "N" khi được hỏi.

**Q: Database test có bị xóa sau mỗi lần chạy không?**  
A: Không, nhưng E2E tests dùng unique data (timestamp) nên không conflict.

**Q: Làm sao để debug một test fail?**  
A: Thêm `console.log()` trong test hoặc dùng `--verbose` flag:
```bash
pnpm test -- --verbose auth.service.spec
```
