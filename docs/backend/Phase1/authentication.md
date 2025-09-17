# Authentication Checklist (ABP + EMR đặc thù)

> **Lưu ý quan trọng:**
>
> - **Gợi ý công nghệ:** Sử dụng NestJS (DI, module, guard, interceptor), Prisma ORM (PostgreSQL), Redis (session, cache), JWT (access/refresh), Passport.js (local, JWT, OAuth2/SSO), bcryptjs (hash password), class-validator, Multer (file upload), Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mọi xác thực, phân quyền đều phải kiểm tra context tenant. Không được để user tenant này truy cập dữ liệu tenant khác, trừ super admin.
> - Audit log phải immutable, lưu đủ 6 năm (theo HIPAA), không được chỉnh sửa/xóa.
> - Phân quyền sâu theo loại dữ liệu, phòng ban, hành động. Permission Matrix phải được review bởi chuyên gia nghiệp vụ y tế.
> - Cơ chế truy cập khẩn cấp (break-glass) phải log lại lý do, cảnh báo admin, và chỉ cho phép trong tình huống thực sự cần thiết.

## Cấu trúc thư mục

```
apps/backend/
├── auth-api/                         # Authentication Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── authentication/       # Authentication module
│   │   │   │   ├── commands/         # Authentication commands
│   │   │   │   │   ├── login.command.ts
│   │   │   │   │   ├── register.command.ts
│   │   │   │   │   ├── logout.command.ts
│   │   │   │   │   ├── refresh-token.command.ts
│   │   │   │   │   └── change-password.command.ts
│   │   │   │   ├── queries/          # Authentication queries
│   │   │   │   │   ├── get-user.query.ts
│   │   │   │   │   ├── get-session.query.ts
│   │   │   │   │   └── validate-token.query.ts
│   │   │   │   ├── events/           # Authentication events
│   │   │   │   │   ├── user-logged-in.event.ts
│   │   │   │   │   ├── user-logged-out.event.ts
│   │   │   │   │   └── password-changed.event.ts
│   │   │   │   ├── dtos/             # Authentication DTOs
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   ├── user.dto.ts
│   │   │   │   │   └── session.dto.ts
│   │   │   │   ├── schemas/          # Authentication schemas
│   │   │   │   │   ├── user.schema.ts
│   │   │   │   │   ├── session.schema.ts
│   │   │   │   │   └── token.schema.ts
│   │   │   │   ├── guards/           # Authentication guards
│   │   │   │   │   ├── jwt.guard.ts
│   │   │   │   │   ├── local.guard.ts
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── strategies/       # Passport strategies
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   └── oauth.strategy.ts
│   │   │   │   ├── services/         # Authentication services
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── jwt.service.ts
│   │   │   │   │   ├── session.service.ts
│   │   │   │   │   └── otp.service.ts
│   │   │   │   └── authentication.module.ts
│   │   │   ├── users/                # User management module
│   │   │   │   ├── commands/         # User commands
│   │   │   │   │   ├── create-user.command.ts
│   │   │   │   │   ├── update-user.command.ts
│   │   │   │   │   ├── delete-user.command.ts
│   │   │   │   │   └── assign-role.command.ts
│   │   │   │   ├── queries/          # User queries
│   │   │   │   │   ├── get-users.query.ts
│   │   │   │   │   ├── get-user-by-id.query.ts
│   │   │   │   │   └── search-users.query.ts
│   │   │   │   ├── dtos/             # User DTOs
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   └── user-profile.dto.ts
│   │   │   │   ├── services/         # User services
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   ├── user-profile.service.ts
│   │   │   │   │   └── user-avatar.service.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── roles/                # Role management module
│   │   │   │   ├── commands/         # Role commands
│   │   │   │   │   ├── create-role.command.ts
│   │   │   │   │   ├── update-role.command.ts
│   │   │   │   │   └── assign-permission.command.ts
│   │   │   │   ├── queries/          # Role queries
│   │   │   │   │   ├── get-roles.query.ts
│   │   │   │   │   ├── get-role-permissions.query.ts
│   │   │   │   │   └── search-roles.query.ts
│   │   │   │   ├── dtos/             # Role DTOs
│   │   │   │   │   ├── create-role.dto.ts
│   │   │   │   │   ├── update-role.dto.ts
│   │   │   │   │   └── role-permission.dto.ts
│   │   │   │   ├── services/         # Role services
│   │   │   │   │   ├── role.service.ts
│   │   │   │   │   ├── permission.service.ts
│   │   │   │   │   └── rbac.service.ts
│   │   │   │   └── roles.module.ts
│   │   │   └── audit/                # Audit logging module
│   │   │       ├── commands/         # Audit commands
│   │   │       │   ├── log-action.command.ts
│   │   │       │   └── log-login.command.ts
│   │   │       ├── queries/          # Audit queries
│   │   │       │   ├── get-audit-logs.query.ts
│   │   │       │   └── search-audit-logs.query.ts
│   │   │       ├── dtos/             # Audit DTOs
│   │   │       │   ├── audit-log.dto.ts
│   │   │       │   └── audit-search.dto.ts
│   │   │       ├── services/         # Audit services
│   │   │       │   ├── audit.service.ts
│   │   │       │   ├── audit-logger.service.ts
│   │   │       │   └── audit-export.service.ts
│   │   │       └── audit.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── auth.controller.ts    # Authentication endpoints
│   │   │   ├── users.controller.ts   # User management endpoints
│   │   │   ├── roles.controller.ts   # Role management endpoints
│   │   │   └── audit.controller.ts   # Audit endpoints
│   │   ├── middleware/               # Auth middleware
│   │   │   ├── tenant.middleware.ts  # Tenant context middleware
│   │   │   ├── audit.middleware.ts   # Audit logging middleware
│   │   │   └── security.middleware.ts # Security middleware
│   │   ├── interceptors/             # Auth interceptors
│   │   │   ├── audit-logging.interceptor.ts # Request audit logging
│   │   │   ├── jwt.interceptor.ts    # JWT handling interceptor
│   │   │   └── tenant.interceptor.ts # Tenant context interceptor
│   │   ├── guards/                   # Auth guards
│   │   │   ├── jwt.guard.ts          # JWT authentication guard
│   │   │   ├── tenant.guard.ts       # Tenant isolation guard
│   │   │   ├── role.guard.ts         # Role-based access guard
│   │   │   └── permission.guard.ts   # Permission-based access guard
│   │   ├── decorators/               # Auth decorators
│   │   │   ├── current-user.decorator.ts # Current user decorator
│   │   │   ├── current-tenant.decorator.ts # Current tenant decorator
│   │   │   ├── roles.decorator.ts    # Roles decorator
│   │   │   └── permissions.decorator.ts # Permissions decorator
│   │   ├── utils/                    # Auth utilities
│   │   │   ├── password.util.ts      # Password utilities
│   │   │   ├── jwt.util.ts           # JWT utilities
│   │   │   ├── session.util.ts       # Session utilities
│   │   │   └── security.util.ts      # Security utilities
│   │   ├── config/                   # Auth configuration
│   │   │   ├── auth.config.ts        # Authentication config
│   │   │   ├── jwt.config.ts         # JWT config
│   │   │   ├── session.config.ts     # Session config
│   │   │   └── security.config.ts    # Security config
│   │   └── auth-api.module.ts
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── README.md
│
libs/backend/
├── shared/                           # Shared utilities
│   ├── src/
│   │   ├── constants/                # Shared constants
│   │   │   ├── auth.constants.ts     # Auth constants
│   │   │   ├── user.constants.ts     # User constants
│   │   │   ├── role.constants.ts     # Role constants
│   │   │   └── security.constants.ts # Security constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── user-role.enum.ts     # User role enums
│   │   │   ├── permission.enum.ts    # Permission enums
│   │   │   ├── auth-status.enum.ts   # Auth status enums
│   │   │   └── tenant-status.enum.ts # Tenant status enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── user.interface.ts     # User interfaces
│   │   │   ├── role.interface.ts     # Role interfaces
│   │   │   ├── permission.interface.ts # Permission interfaces
│   │   │   └── tenant.interface.ts   # Tenant interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── password.util.ts      # Password utilities
│   │   │   ├── jwt.util.ts           # JWT utilities
│   │   │   ├── session.util.ts       # Session utilities
│   │   │   └── security.util.ts      # Security utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

- [ ] [High] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có JWT, RBAC, multi-tenant guard, mã hóa mật khẩu, rate limit...)

## 2. Những việc cần làm

### Authentication

- [ ] [High] Đăng nhập đa phương thức (OAuth2, SSO) nếu cần tích hợp với hệ thống y tế quốc gia
- [ ] [High] Xác thực 2 lớp (2FA/OTP) cho bác sĩ, admin (qua SMS/email)
- [ ] [High] Quản lý session (đa thiết bị, revoke, tracking)

### Authorization

- [ ] [High] Mapping permission vào từng role (DB hoặc hardcode, nên dùng DB để linh hoạt)
- [ ] [High] Super admin cross-tenant (role SuperAdmin, kiểm tra ở guard)

### User Management

- [ ] [High] Đăng ký, tạo user, cập nhật, xóa, khóa/mở khóa tài khoản (API/UI cho admin bệnh viện)
- [ ] [High] Đổi mật khẩu, quên mật khẩu (email/SMS)
- [ ] [Medium] Quản lý thông tin user (profile, avatar, contact info)
- [ ] [High] Gán/xóa vai trò, permission cho user qua API

### Audit & Security

- [ ] [High] Log chi tiết mọi hành động đăng nhập, thay đổi quyền, thay đổi thông tin user (audit log, immutable)
- [ ] [High] Lưu lịch sử đăng nhập, IP, thiết bị
- [ ] [High] Cảnh báo khi có hành động bất thường (login lạ, xuất nhiều dữ liệu...)
- [ ] [High] Đảm bảo tuân thủ HIPAA/GDPR ở mọi thao tác (không được sửa log, lưu log đủ 6 năm, kiểm soát xuất dữ liệu lớn)

### Đặc thù cho EMR

- [ ] [High] Granular Permission (phân quyền chi tiết theo loại dữ liệu, phòng ban, hành động)
- [ ] [High] Break-glass/Emergency Access (truy cập khẩn cấp, log & cảnh báo admin)
- [ ] [Medium] Consent Management (quản lý sự đồng ý của bệnh nhân, lưu lịch sử consent)
- [ ] [High] Audit Trail & Truy vết (log mọi chỉnh sửa hồ sơ, ghi lại thông tin cũ/mới, ai thao tác, lúc nào)
- [ ] [Medium] Session & Device Management (hiển thị thiết bị đăng nhập, cho phép admin logout từ xa, giới hạn session)
- [ ] [Medium] Data Masking & Redaction (ẩn/mask thông tin nhạy cảm với user không đủ quyền)

### Tuân thủ quy định y tế (HIPAA, GDPR, ...)

- [ ] [High] Đảm bảo chỉ user được ủy quyền mới truy cập dữ liệu bệnh nhân
- [ ] [High] Audit log không được phép chỉnh sửa/xóa, lưu đủ 6 năm
- [ ] [High] Cảnh báo khi có truy cập bất thường hoặc truy cập khối lượng lớn dữ liệu
- [ ] [Medium] Cho phép bệnh nhân yêu cầu xem/xóa dữ liệu cá nhân
- [ ] [Medium] Quản lý consent rõ ràng, minh bạch

## 3. Bổ sung checklist nâng cao

- [ ] [Medium] Hỗ trợ xác thực đa phương thức (OIDC, SAML, LDAP nếu cần)
- [ ] [Medium] Cho phép bật/tắt 2FA bắt buộc theo vai trò (ex: bác sĩ điều trị cần 2FA, điều dưỡng thì không)
- [ ] [Medium] API import/export user, đồng bộ user với hệ thống ngoài (HIS, HRM, ...)
- [ ] [Medium] Kiểm thử tải cao (Load Test) cho login & session
- [ ] [Medium] Test isolation dữ liệu giữa các tenant (test backend)
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật y tế

## 4. Quy trình kiểm tra & xác thực chất lượng module Authentication

- [ ] [High] **Kiểm thử tự động:**
  - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan authentication
  - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
  - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
  - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
  - [ ] [High] Test RBAC, ABAC, phân quyền per-tenant, cross-tenant
  - [ ] [High] Test middleware auth, mTLS, tenant isolation, brute force
  - [ ] [High] Test rate limit, audit log, session hijack, token revoke
  - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] [High] **Kiểm thử hiệu năng:**
  - [ ] [High] Benchmark login, refresh token, revoke, cross-tenant
  - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
  - [ ] [High] Benchmark khi nhiều user thao tác đồng thời (load test, stress test)
  - [ ] [Medium] Benchmark queue, job async, background task liên quan authentication
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
  - [ ] [High] Test migration schema auth, rollback, zero-downtime
  - [ ] [High] Test versioning API, backward compatibility
- [ ] [High] **Kiểm thử CI/CD & alert:**
  - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
  - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
  - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] [High] **Kiểm thử tài liệu:**
  - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
  - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] [High] **Kiểm thử manual & quy trình:**
  - [ ] [High] Test chuyển user giữa tenant, revoke session, 2FA, SSO, import/export
  - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc
