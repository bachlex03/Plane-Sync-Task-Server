# Users Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, guard, service), Prisma ORM (PostgreSQL), Redis (session, cache), JWT (access/refresh), Passport.js (local, JWT, OAuth2/SSO), bcryptjs (hash password), class-validator, Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mọi thao tác với user đều phải kiểm tra context tenant, không để rò rỉ dữ liệu giữa các tenant.
> - Audit log phải đầy đủ, immutable, phục vụ truy vết và compliance (HIPAA/GDPR), lưu đủ 6 năm.
> - Các API nhạy cảm (reset password, phân quyền, xóa user) chỉ cho phép admin hoặc super admin thực hiện.
> - Khi xóa user nên soft delete, không xóa vật lý để phục vụ audit và compliance.
> - Checklist này chỉ tập trung cho backend (API, service, bảo mật, audit, multi-tenant isolation), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── users/                # User management module
│   │   │   │   ├── commands/         # User commands
│   │   │   │   │   ├── create-user.command.ts
│   │   │   │   │   ├── update-user.command.ts
│   │   │   │   │   ├── delete-user.command.ts
│   │   │   │   │   ├── activate-user.command.ts
│   │   │   │   │   ├── deactivate-user.command.ts
│   │   │   │   │   ├── change-password.command.ts
│   │   │   │   │   ├── reset-password.command.ts
│   │   │   │   │   ├── assign-role.command.ts
│   │   │   │   │   └── revoke-role.command.ts
│   │   │   │   ├── queries/          # User queries
│   │   │   │   │   ├── get-users.query.ts
│   │   │   │   │   ├── get-user-by-id.query.ts
│   │   │   │   │   ├── get-user-by-email.query.ts
│   │   │   │   │   ├── search-users.query.ts
│   │   │   │   │   ├── get-user-sessions.query.ts
│   │   │   │   │   └── get-user-audit.query.ts
│   │   │   │   ├── events/           # User events
│   │   │   │   │   ├── user-created.event.ts
│   │   │   │   │   ├── user-updated.event.ts
│   │   │   │   │   ├── user-deleted.event.ts
│   │   │   │   │   ├── user-activated.event.ts
│   │   │   │   │   ├── user-deactivated.event.ts
│   │   │   │   │   ├── password-changed.event.ts
│   │   │   │   │   └── role-assigned.event.ts
│   │   │   │   ├── dtos/             # User DTOs
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   ├── user-info.dto.ts
│   │   │   │   │   ├── user-search.dto.ts
│   │   │   │   │   ├── change-password.dto.ts
│   │   │   │   │   ├── reset-password.dto.ts
│   │   │   │   │   ├── assign-role.dto.ts
│   │   │   │   │   └── user-session.dto.ts
│   │   │   │   ├── schemas/          # User schemas
│   │   │   │   │   ├── user.schema.ts
│   │   │   │   │   ├── user-profile.schema.ts
│   │   │   │   │   ├── user-session.schema.ts
│   │   │   │   │   ├── user-role.schema.ts
│   │   │   │   │   └── user-audit.schema.ts
│   │   │   │   ├── services/         # User services
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   ├── user-profile.service.ts
│   │   │   │   │   ├── user-session.service.ts
│   │   │   │   │   ├── user-role.service.ts
│   │   │   │   │   ├── user-audit.service.ts
│   │   │   │   │   ├── user-password.service.ts
│   │   │   │   │   └── user-import.service.ts
│   │   │   │   ├── validators/       # User validators
│   │   │   │   │   ├── user.validator.ts
│   │   │   │   │   ├── user-email.validator.ts
│   │   │   │   │   ├── user-password.validator.ts
│   │   │   │   │   └── user-role.validator.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── user-profiles/        # User profile module
│   │   │   │   ├── commands/         # Profile commands
│   │   │   │   │   ├── update-profile.command.ts
│   │   │   │   │   └── upload-avatar.command.ts
│   │   │   │   ├── queries/          # Profile queries
│   │   │   │   │   ├── get-profile.query.ts
│   │   │   │   │   └── search-profiles.query.ts
│   │   │   │   ├── dtos/             # Profile DTOs
│   │   │   │   │   ├── update-profile.dto.ts
│   │   │   │   │   └── profile-info.dto.ts
│   │   │   │   ├── services/         # Profile services
│   │   │   │   │   ├── profile.service.ts
│   │   │   │   │   └── avatar.service.ts
│   │   │   │   └── user-profiles.module.ts
│   │   │   ├── user-sessions/        # User session module
│   │   │   │   ├── commands/         # Session commands
│   │   │   │   │   ├── create-session.command.ts
│   │   │   │   │   ├── revoke-session.command.ts
│   │   │   │   │   └── revoke-all-sessions.command.ts
│   │   │   │   ├── queries/          # Session queries
│   │   │   │   │   ├── get-sessions.query.ts
│   │   │   │   │   ├── get-session-by-id.query.ts
│   │   │   │   │   └── search-sessions.query.ts
│   │   │   │   ├── dtos/             # Session DTOs
│   │   │   │   │   ├── session-info.dto.ts
│   │   │   │   │   └── session-search.dto.ts
│   │   │   │   ├── services/         # Session services
│   │   │   │   │   ├── session.service.ts
│   │   │   │   │   └── session-monitoring.service.ts
│   │   │   │   └── user-sessions.module.ts
│   │   │   └── user-audit/           # User audit module
│   │   │       ├── commands/         # Audit commands
│   │   │       │   ├── log-user-action.command.ts
│   │   │       │   ├── log-login.command.ts
│   │   │       │   └── log-logout.command.ts
│   │   │       ├── queries/          # Audit queries
│   │   │       │   ├── get-audit-logs.query.ts
│   │   │       │   ├── search-audit-logs.query.ts
│   │   │       │   └── get-audit-stats.query.ts
│   │   │       ├── dtos/             # Audit DTOs
│   │   │       │   ├── audit-log.dto.ts
│   │   │       │   └── audit-search.dto.ts
│   │   │       ├── services/         # Audit services
│   │   │       │   ├── audit.service.ts
│   │   │       │   └── audit-export.service.ts
│   │   │       └── user-audit.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── users.controller.ts   # User management endpoints
│   │   │   ├── profiles.controller.ts # Profile endpoints
│   │   │   ├── sessions.controller.ts # Session endpoints
│   │   │   └── audit.controller.ts   # Audit endpoints
│   │   ├── middleware/               # User middleware
│   │   │   ├── user-audit.middleware.ts # User audit logging
│   │   │   ├── user-validation.middleware.ts # User validation
│   │   │   └── user-security.middleware.ts # User security
│   │   ├── guards/                   # User guards
│   │   │   ├── user-access.guard.ts  # User access guard
│   │   │   ├── user-permission.guard.ts # User permission guard
│   │   │   └── user-role.guard.ts    # User role guard
│   │   ├── services/                 # Core services
│   │   │   ├── user-audit.service.ts # User audit service
│   │   │   ├── user-session.service.ts # User session service
│   │   │   ├── user-import.service.ts # User import service
│   │   │   └── user-export.service.ts # User export service
│   │   ├── utils/                    # User utilities
│   │   │   ├── user.util.ts          # User utilities
│   │   │   ├── profile.util.ts       # Profile utilities
│   │   │   ├── session.util.ts       # Session utilities
│   │   │   └── audit.util.ts         # Audit utilities
│   │   ├── config/                   # User configuration
│   │   │   ├── user.config.ts        # User config
│   │   │   ├── session.config.ts     # Session config
│   │   │   ├── audit.config.ts       # Audit config
│   │   │   └── security.config.ts    # Security config
│   │   └── ehr-api.module.ts
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
│   │   │   ├── user.constants.ts     # User constants
│   │   │   ├── session.constants.ts  # Session constants
│   │   │   ├── audit.constants.ts    # Audit constants
│   │   │   └── security.constants.ts # Security constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── user-role.enum.ts     # User role enums
│   │   │   ├── user-status.enum.ts   # User status enums
│   │   │   ├── session-status.enum.ts # Session status enums
│   │   │   └── audit-type.enum.ts    # Audit type enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── user.interface.ts     # User interfaces
│   │   │   ├── session.interface.ts  # Session interfaces
│   │   │   ├── audit.interface.ts    # Audit interfaces
│   │   │   └── profile.interface.ts  # Profile interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── user.util.ts          # User utilities
│   │   │   ├── session.util.ts       # Session utilities
│   │   │   ├── audit.util.ts         # Audit utilities
│   │   │   └── security.util.ts      # Security utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

(Để trống, đã chuyển checklist sang mục 2)

## 2. Những việc cần làm
- [ ] [High] Đã có UsersController, UsersService, UsersModule.
- [ ] [High] Đã có API tạo user (POST /users), kiểm tra trùng email theo tenant, validate dữ liệu, hash password.
- [ ] [High] Đã có API cập nhật user (PATCH /users/:id), kiểm tra quyền, validate, kiểm tra trùng email khi update.
- [ ] [High] Đã có API lấy danh sách user theo tenant, phân trang (GET /users).
- [ ] [High] Đã có API lấy chi tiết user theo id và tenant (GET /users/:id).
- [ ] [High] Đã có API xóa user (soft delete, set isActive=false) (DELETE /users/:id).
- [ ] [High] Đã có API kích hoạt lại user (POST /users/:id/reactivate).
- [ ] [High] Đã kiểm tra context tenant ở mọi API, chỉ super_admin mới truy cập cross-tenant.
- [ ] [High] Đã phân quyền chi tiết (RolesGuard, chỉ admin/super_admin được thao tác).
- [ ] [High] Đã validate dữ liệu đầu vào (class-validator, DTO).
- [ ] [High] Đã log lỗi chi tiết trong service.

### Chức năng API & Service
- [ ] [High] API đăng ký user mới (nếu cho phép self-signup)
- [ ] [High] API tạo user bởi admin (POST /users)
- [ ] [High] API cập nhật thông tin user (PUT/PATCH /users/:id)
- [ ] [High] API đổi mật khẩu, quên mật khẩu (POST /users/change-password, /users/forgot-password)
- [ ] [High] API khóa/mở khóa tài khoản user (PATCH /users/:id/lock)
- [ ] [High] API xóa (soft delete) user (DELETE /users/:id)
- [ ] [High] API lấy danh sách user (GET /users?paging,filter,search)
- [ ] [High] API xem chi tiết user (GET /users/:id)
- [ ] [Medium] API đổi email / username (trường hợp bác sĩ chuyển viện, yêu cầu bảo mật cao)
- [ ] [Medium] API kiểm tra tồn tại (GET /users/check-exists?email=...)
- [ ] [Medium] API khôi phục tài khoản bị khóa (quy trình unlock có kiểm duyệt)
- [ ] [Medium] API reset user về trạng thái ban đầu (dành cho admin khôi phục tài khoản nội bộ)

### Phân quyền & Multi-tenant
- [ ] [High] Gán/xóa vai trò (role) cho user (API/Service)
- [ ] [High] Gán/xóa permission cho user (nếu cần granular, API/Service)
- [ ] [High] Đảm bảo mọi API user chỉ truy cập được dữ liệu tenant của mình (trừ super admin)
- [ ] [High] Super admin có thể quản lý user của mọi tenant (cross-tenant)
- [ ] [High] Kiểm tra context tenant ở mọi API/service liên quan user
- [ ] [Medium] Hỗ trợ user có thể hoạt động ở nhiều tenant (nếu có bác sĩ liên kết nhiều bệnh viện), kèm switch context
- [ ] [Medium] Cấu trúc bảng UserTenants (userId, tenantId, roleInTenant, isDefaultTenant)
- [ ] [High] Rule check tự động: không cho phép user thao tác nếu chưa được gán vào tenant đó
- [ ] [High] Phân biệt rõ:
    - [ ] [High] Super Admin: quản lý toàn hệ thống
    - [ ] [High] Tenant Admin: chỉ quản lý trong tenant
    - [ ] [Medium] Cross-Tenant Support: user đặc biệt như Kỹ sư kỹ thuật, có thể được gán vào nhiều tenant

### Bảo mật & Audit
- [ ] [High] Mã hóa mật khẩu (bcrypt/argon2) khi tạo/cập nhật user
- [ ] [High] Lưu lịch sử đăng nhập, IP, thiết bị (audit log)
- [ ] [High] Log mọi hành động tạo, sửa, xóa, đổi quyền user (audit log, immutable)
- [ ] [Medium] Ghi log hành vi đọc dữ liệu nhạy cảm (read audit): xem bệnh án, hồ sơ nhân sự, kết quả cận lâm sàng…
- [ ] [High] Cảnh báo khi có đăng nhập bất thường, nhiều lần sai mật khẩu, hoặc truy cập trái phép (service, log)
- [ ] [Medium] Cảnh báo hành vi bất thường: truy cập liên tục nhiều tài khoản khác nhau, truy cập dữ liệu vượt phạm vi chuyên ngành hoặc tenant
- [ ] [Medium] Hỗ trợ chuẩn GeoIP để xác định vùng/khu vực đăng nhập bất thường
- [ ] [High] Rate limit các endpoint nhạy cảm (login, reset password)
- [ ] [High] Đảm bảo tuân thủ HIPAA/GDPR (không lộ thông tin nhạy cảm, audit log immutable, retention đủ 6 năm)

### Quản lý session & device
- [ ] [High] Quản lý session đa thiết bị (service, revoke session)
- [ ] [High] Cho phép admin logout user từ xa (API/service)
- [ ] [Medium] Hạn chế số lượng session đồng thời (nếu cần, service)
- [ ] [Medium] Ghi nhận thiết bị đăng nhập: platform, app version, IP, geo location
- [ ] [High] Tự động revoke session khi đổi mật khẩu, bị khóa, bị xóa quyền
- [ ] [Medium] Hạn chế thao tác từ thiết bị lạ (option cấu hình)

### Tích hợp & mở rộng
- [ ] [Medium] Hỗ trợ xác thực đa phương thức (OAuth2, SSO, OIDC nếu cần, backend)
- [ ] [Medium] Hỗ trợ xác thực 2 lớp (2FA/OTP, backend)
- [ ] [Medium] API import/export user (CSV, Excel, backend)
- [ ] [Medium] API đồng bộ user với hệ thống ngoài (HIS, HRM, ... nếu cần, backend)
- [ ] [Medium] Phân quyền chi tiết theo phòng ban, chi nhánh, chuyên khoa (service, guard)
- [ ] [Medium] Cấu hình thời gian hết hạn của phiên đăng nhập (token lifetime) riêng cho từng nhóm user
- [ ] [Medium] Hỗ trợ login SSO với hệ thống HIS/HRM nếu có (sử dụng LDAP/SAML nếu bệnh viện nội bộ)
- [ ] [Medium] Cho phép bật/tắt 2FA bắt buộc theo vai trò (ex: bác sĩ điều trị cần 2FA, điều dưỡng thì không)

### Kiểm thử & tài liệu
- [ ] [High] Unit test, integration test cho toàn bộ API user
- [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
- [ ] [Medium] Tài liệu API (OpenAPI/Swagger, backend)
- [ ] [Medium] Hướng dẫn sử dụng API cho admin/backend dev
- [ ] [High] Kiểm thử tải cao (Load Test) cho login & session (vì EMR có thể hàng nghìn user dùng cùng lúc)
- [ ] [Medium] Kiểm thử trường hợp chuyển user giữa các tenant (ex: bác sĩ chuyển viện)
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật y tế

## 3. Bổ sung checklist nâng cao
- [ ] [Medium] UserSecurityPolicyService: Giao diện trung tâm để quy định bảo mật người dùng theo tenant (session timeout, bắt buộc 2FA, IP restriction…)
- [ ] [Medium] UserTenantSwitchService: Hỗ trợ user chuyển đổi giữa các bệnh viện (tenant) mình được gán

## 4. Quy trình kiểm tra & xác thực chất lượng module Users
- [ ] [High] **Kiểm thử tự động:**
    - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan user
    - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
    - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
    - [ ] [High] Test RBAC, ABAC, phân quyền per-tenant, cross-tenant
    - [ ] [High] Test middleware auth, mTLS, tenant isolation
    - [ ] [High] Test rate limit, brute force, audit log, session hijack, token revoke
    - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] [High] **Kiểm thử hiệu năng:**
    - [ ] [High] Benchmark login, session, batch user, cross-tenant, session revoke
    - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - [ ] [High] Benchmark khi nhiều user thao tác đồng thời (load test, stress test)
    - [ ] [Medium] Benchmark queue, job async, background task liên quan user
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
    - [ ] [High] Test migration schema user, rollback, zero-downtime
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