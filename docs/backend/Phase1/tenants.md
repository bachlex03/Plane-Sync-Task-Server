# Tenants Checklist (Multi-Tenant EMR)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, guard, middleware), Prisma ORM (PostgreSQL, database-per-tenant), Redis (cache, session), Docker Compose (devops), Prometheus/Grafana (monitoring), audit log (custom interceptor + DB), Jest/Supertest (test), tuân thủ HIPAA/GDPR.
> - Hệ thống sử dụng database độc lập cho từng tenant (database-per-tenant), không dùng chung một DB với cột TenantId. Mọi thao tác, migration, backup, restore, monitoring phải thực hiện riêng biệt cho từng DB.
> - Luôn truyền đúng context tenant cho mọi service, repository, event, job. Không được cache/pool connection sai tenant.
> - Chỉ super admin mới được phép cross-tenant. Mọi thao tác cross-tenant phải được log lại đầy đủ để phục vụ audit.
> - Khi tạo tenant mới, phải tự động tạo DB/schema mới, chạy migration, seed dữ liệu mẫu, lưu thông tin kết nối vào central config.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── tenants/              # Tenant management module
│   │   │   │   ├── commands/         # Tenant commands
│   │   │   │   │   ├── create-tenant.command.ts
│   │   │   │   │   ├── update-tenant.command.ts
│   │   │   │   │   ├── delete-tenant.command.ts
│   │   │   │   │   ├── activate-tenant.command.ts
│   │   │   │   │   └── suspend-tenant.command.ts
│   │   │   │   ├── queries/          # Tenant queries
│   │   │   │   │   ├── get-tenants.query.ts
│   │   │   │   │   ├── get-tenant-by-id.query.ts
│   │   │   │   │   ├── get-tenant-by-domain.query.ts
│   │   │   │   │   └── search-tenants.query.ts
│   │   │   │   ├── events/           # Tenant events
│   │   │   │   │   ├── tenant-created.event.ts
│   │   │   │   │   ├── tenant-updated.event.ts
│   │   │   │   │   ├── tenant-activated.event.ts
│   │   │   │   │   └── tenant-suspended.event.ts
│   │   │   │   ├── dtos/             # Tenant DTOs
│   │   │   │   │   ├── create-tenant.dto.ts
│   │   │   │   │   ├── update-tenant.dto.ts
│   │   │   │   │   ├── tenant-info.dto.ts
│   │   │   │   │   └── tenant-status.dto.ts
│   │   │   │   ├── schemas/          # Tenant schemas
│   │   │   │   │   ├── tenant.schema.ts
│   │   │   │   │   ├── tenant-config.schema.ts
│   │   │   │   │   └── tenant-plan.schema.ts
│   │   │   │   ├── services/         # Tenant services
│   │   │   │   │   ├── tenant.service.ts
│   │   │   │   │   ├── tenant-config.service.ts
│   │   │   │   │   ├── tenant-plan.service.ts
│   │   │   │   │   └── tenant-migration.service.ts
│   │   │   │   └── tenants.module.ts
│   │   │   ├── branches/             # Branch management module
│   │   │   │   ├── commands/         # Branch commands
│   │   │   │   │   ├── create-branch.command.ts
│   │   │   │   │   ├── update-branch.command.ts
│   │   │   │   │   └── delete-branch.command.ts
│   │   │   │   ├── queries/          # Branch queries
│   │   │   │   │   ├── get-branches.query.ts
│   │   │   │   │   ├── get-branch-by-id.query.ts
│   │   │   │   │   └── search-branches.query.ts
│   │   │   │   ├── dtos/             # Branch DTOs
│   │   │   │   │   ├── create-branch.dto.ts
│   │   │   │   │   ├── update-branch.dto.ts
│   │   │   │   │   └── branch-info.dto.ts
│   │   │   │   ├── services/         # Branch services
│   │   │   │   │   ├── branch.service.ts
│   │   │   │   │   └── branch-config.service.ts
│   │   │   │   └── branches.module.ts
│   │   │   └── departments/          # Department management module
│   │   │       ├── commands/         # Department commands
│   │   │       │   ├── create-department.command.ts
│   │   │       │   ├── update-department.command.ts
│   │   │       │   └── delete-department.command.ts
│   │   │       ├── queries/          # Department queries
│   │   │       │   ├── get-departments.query.ts
│   │   │       │   ├── get-department-by-id.query.ts
│   │   │       │   └── search-departments.query.ts
│   │   │       ├── dtos/             # Department DTOs
│   │   │       │   ├── create-department.dto.ts
│   │   │       │   ├── update-department.dto.ts
│   │   │       │   └── department-info.dto.ts
│   │   │       ├── services/         # Department services
│   │   │       │   ├── department.service.ts
│   │   │       │   └── department-config.service.ts
│   │   │       └── departments.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── tenants.controller.ts # Tenant management endpoints
│   │   │   ├── branches.controller.ts # Branch management endpoints
│   │   │   └── departments.controller.ts # Department management endpoints
│   │   ├── middleware/               # Tenant middleware
│   │   │   ├── tenant.middleware.ts  # Tenant context middleware
│   │   │   ├── tenant-validation.middleware.ts # Tenant validation
│   │   │   └── domain.middleware.ts  # Domain resolution middleware
│   │   ├── guards/                   # Tenant guards
│   │   │   ├── tenant.guard.ts       # Tenant isolation guard
│   │   │   ├── multi-tenant.guard.ts # Multi-tenant guard
│   │   │   └── cross-tenant.guard.ts # Cross-tenant guard
│   │   ├── decorators/               # Tenant decorators
│   │   │   ├── multi-tenant.decorator.ts # Multi-tenant decorator
│   │   │   ├── require-tenant.decorator.ts # Require tenant decorator
│   │   │   └── cross-tenant.decorator.ts # Cross-tenant decorator
│   │   ├── services/                 # Core services
│   │   │   ├── tenant-context.service.ts # Tenant context service
│   │   │   ├── tenant-resolver.service.ts # Tenant resolver service
│   │   │   ├── tenant-connection.service.ts # Tenant DB connection service
│   │   │   └── tenant-monitoring.service.ts # Tenant monitoring service
│   │   ├── utils/                    # Tenant utilities
│   │   │   ├── tenant.util.ts        # Tenant utilities
│   │   │   ├── domain.util.ts        # Domain utilities
│   │   │   ├── connection.util.ts    # Connection utilities
│   │   │   └── monitoring.util.ts    # Monitoring utilities
│   │   ├── config/                   # Tenant configuration
│   │   │   ├── tenant.config.ts      # Tenant config
│   │   │   ├── database.config.ts    # Database config
│   │   │   ├── connection.config.ts  # Connection config
│   │   │   └── monitoring.config.ts  # Monitoring config
│   │   └── ehr-api.module.ts
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── README.md
│
libs/backend/
├── multi-tenant/                     # Multi-tenant shared library
│   ├── src/
│   │   ├── constants/                # Multi-tenant constants
│   │   │   ├── tenant.constants.ts   # Tenant constants
│   │   │   ├── branch.constants.ts   # Branch constants
│   │   │   ├── department.constants.ts # Department constants
│   │   │   └── connection.constants.ts # Connection constants
│   │   ├── enums/                    # Multi-tenant enums
│   │   │   ├── tenant-status.enum.ts # Tenant status enums
│   │   │   ├── tenant-plan.enum.ts   # Tenant plan enums
│   │   │   ├── branch-status.enum.ts # Branch status enums
│   │   │   └── department-status.enum.ts # Department status enums
│   │   ├── interfaces/               # Multi-tenant interfaces
│   │   │   ├── tenant.interface.ts   # Tenant interfaces
│   │   │   ├── branch.interface.ts   # Branch interfaces
│   │   │   ├── department.interface.ts # Department interfaces
│   │   │   └── connection.interface.ts # Connection interfaces
│   │   ├── utils/                    # Multi-tenant utilities
│   │   │   ├── tenant.util.ts        # Tenant utilities
│   │   │   ├── branch.util.ts        # Branch utilities
│   │   │   ├── department.util.ts    # Department utilities
│   │   │   └── connection.util.ts    # Connection utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

(Để trống, đã chuyển checklist sang mục 2)

## 2. Những việc cần làm

- [ ] [High] TenantGuard kiểm tra user chỉ truy cập tenant của mình (trừ super_admin)
- [ ] [High] Decorator @MultiTenant, @RequireTenant, @CrossTenant để đánh dấu context tenant, cho phép cross-tenant
- [ ] [High] Middleware DomainMiddleware, TenantValidationMiddleware tự động resolve, validate tenant từ header/domain, kiểm tra tenant active
- [ ] [High] CRUD tenant (controller, service), kiểm tra trùng domain, cho phép tạo branch liên kết khi tạo tenant mới
- [ ] [High] User có trường tenantId, khi tạo user kiểm tra tenant tồn tại
- [ ] [High] JWT payload và validate đều gắn tenantId, branchId, departmentId
- [ ] [High] PermissionGuard kiểm tra quyền và context tenant
- [ ] [High] Super admin được phép truy cập cross-tenant (không bị giới hạn tenant như user thường)
- [ ] [High] Các DTO liên quan user, tenant đều có trường tenantId
- [ ] [High] Các API đều kiểm tra guard, role, tenant context

- [ ] [High] Đảm bảo mọi API/service đều hỗ trợ cross-tenant đúng cho super admin
  - [ ] [High] Super admin là tài khoản quản trị cấp cao nhất, có thể truy cập, xem, chỉnh sửa dữ liệu của tất cả các tenant (bệnh viện) trong hệ thống. Guard cần kiểm tra nếu user có role `super_admin` thì cho phép truy cập mọi tenant, không giới hạn như user thường.
- [ ] [High] Đảm bảo propagation tenant context toàn hệ thống (service, event, job)
  - [ ] [High] Mọi service, repository, event phải truyền đúng context tenant để tránh rò rỉ dữ liệu giữa các tenant.
- [ ] [High] Soft delete & audit cho tenant
  - [ ] [High] Khi xóa tenant nên soft delete, log lại toàn bộ thao tác liên quan.
- [ ] [High] Kiểm tra plan, hạn sử dụng, trạng thái tenant khi truy cập
  - [ ] [High] Bổ sung logic kiểm tra plan, hạn sử dụng, trạng thái tenant (hết hạn, bị khóa, v.v.) ở middleware/service.
- [ ] [Medium] Tenant-level config (theme, policy, ...)
  - [ ] [Medium] Cho phép mỗi tenant có cấu hình riêng (theme, logo, policy, ...).
- [ ] [High] Migration/onboarding tenant mới
  - [ ] [High] Hỗ trợ migrate schema động khi có tenant mới (nếu dùng DB riêng cho từng tenant), API onboarding cho tenant mới (tạo user admin, cấu hình ban đầu).
- [ ] [High] UI/API quản lý tenant cho super admin
  - [ ] [High] UI/API cho super admin quản lý toàn bộ tenant, xem log, trạng thái, audit.
- [ ] [High] Test isolation dữ liệu giữa các tenant
  - [ ] [High] Viết test kiểm tra isolation dữ liệu giữa các tenant, đảm bảo không rò rỉ dữ liệu.

---

## 3.Bổ sung checklist nâng cao

### 1. Tenant Context & Propagation (Runtime & Background)
- [ ] [High] Propagate tenant context cho tất cả background job / scheduled job / event listener
  - [ ] [High] Đảm bảo mọi job, event, queue đều truyền đúng tenant context, tránh chạy nhầm dữ liệu tenant khác (job thường không qua middleware).
  - [ ] [High] Nếu dùng queue (Bull, RabbitMQ...), cần pass tenant context trong job payload hoặc header.
- [ ] [High] Tenant context trong external integration (webhook, API gọi ra ngoài)
  - [ ] [High] Khi gửi webhook/callback/audit log ra hệ thống ngoài, phải ghi rõ tenantId trong payload hoặc header.

### 2. Tenant Management & Monitoring
- [ ] [Medium] Tenant activity log (cấp hệ thống)
  - [ ] [Medium] Log lại các hoạt động chính: tạo, sửa, khóa tenant, số lần login, request volume...
- [ ] [Medium] Tenant status auto check (expired, inactive, over quota)
  - [ ] [Medium] Cronjob kiểm tra định kỳ tenant nào hết hạn, vượt quota, bị inactive → tự động khóa hoặc cảnh báo.
- [ ] [Medium] Cơ chế “suspend” tenant mềm
  - [ ] [Medium] Khi tạm ngừng dịch vụ tenant (chậm thanh toán...), chỉ khóa API, không xóa DB.

### 3. Compliance & Audit
- [ ] [High] Mọi thao tác cross-tenant phải log chi tiết (who, what, when, where)
  - [ ] [High] Đủ thông tin để audit về sau. Lưu vào centralized audit log table (append-only).
- [ ] [High] Tenant isolation test scripts
  - [ ] [High] Viết test case cho các API giả định tấn công chéo tenant → fail nếu có rò rỉ.
- [ ] [Medium] Cross-tenant data access report
  - [ ] [Medium] Xuất báo cáo các lần super_admin hoặc job truy cập dữ liệu từ tenant khác (theo ngày/tuần).

### 4. Feature Optional Nhưng Nên Có
- [ ] [Optional] Cho phép mỗi tenant tắt/bật module (feature toggle per tenant)
  - [ ] [Optional] Ví dụ: bệnh viện A không dùng phân khoa, B dùng phân khoa và phân ca trực.
- [ ] [Optional] API cấu hình metadata mỗi tenant (logo, primary color, form tuỳ biến...)
  - [ ] [Optional] Backend cần API cho cấu hình metadata, phục vụ UI cấu hình.
- [ ] [Optional] Giới hạn đồng thời (concurrent users/sessions) mỗi tenant
  - [ ] [Optional] Nếu bán theo gói, có thể có giới hạn session, số lượng bác sĩ đang truy cập cùng lúc.

## 4. Quy trình kiểm tra & xác thực chất lượng module Tenants
- [ ] [High] **Kiểm thử tự động:**
    - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan tenant
    - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
    - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
    - [ ] [High] Test RBAC, ABAC, phân quyền quản lý tenant, cross-tenant
    - [ ] [High] Test middleware auth, mTLS, tenant isolation
    - [ ] [High] Test rate limit, audit log, session hijack, token revoke
    - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] [High] **Kiểm thử hiệu năng:**
    - [ ] [High] Benchmark tạo/sửa/xóa tenant, batch update, cross-tenant
    - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - [ ] [High] Benchmark khi nhiều tenant thao tác đồng thời (load test, stress test)
    - [ ] [Medium] Benchmark queue, job async, background task liên quan tenant
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
    - [ ] [High] Test migration schema tenant, rollback, zero-downtime
    - [ ] [High] Test versioning API, backward compatibility
- [ ] [High] **Kiểm thử CI/CD & alert:**
    - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] [High] **Kiểm thử tài liệu:**
    - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] [High] **Kiểm thử manual & quy trình:**
    - [ ] [High] Test chuyển tenant, rollback, import/export tenant
    - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc 