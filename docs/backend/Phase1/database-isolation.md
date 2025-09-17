# Database Isolation & Operations Guide (Enhanced Multi-Tenancy)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng Prisma ORM (PostgreSQL, database-per-tenant), Redis (cache, session), Docker Compose (devops), Prometheus/Grafana (monitoring), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mỗi tenant (bệnh viện) sử dụng một database độc lập hoàn toàn (database-per-tenant), không dùng chung DB với cột TenantId.
> - Đảm bảo isolation mạnh, không có single point of failure (SPOF), đáp ứng các tiêu chuẩn bảo mật và compliance y tế (HIPAA, GDPR, ISO 27799).
> - Không dùng central DB cho dữ liệu nghiệp vụ, chỉ lưu metadata kết nối ở central config.
> - Mọi thao tác quản trị, vận hành, phát triển đều phải tuân thủ các nguyên tắc isolation, audit, compliance, và không có SPOF.

## Cấu trúc thư mục

```
libs/backend/
├── multi-tenant/                     # Multi-tenant shared library
│   ├── src/
│   │   ├── constants/                # Multi-tenant constants
│   │   │   ├── tenant.constants.ts   # Tenant constants
│   │   │   ├── database.constants.ts # Database constants
│   │   │   ├── connection.constants.ts # Connection constants
│   │   │   └── isolation.constants.ts # Isolation constants
│   │   ├── enums/                    # Multi-tenant enums
│   │   │   ├── tenant-status.enum.ts # Tenant status enums
│   │   │   ├── database-status.enum.ts # Database status enums
│   │   │   ├── connection-type.enum.ts # Connection type enums
│   │   │   └── isolation-level.enum.ts # Isolation level enums
│   │   ├── interfaces/               # Multi-tenant interfaces
│   │   │   ├── tenant.interface.ts   # Tenant interfaces
│   │   │   ├── database.interface.ts # Database interfaces
│   │   │   ├── connection.interface.ts # Connection interfaces
│   │   │   └── isolation.interface.ts # Isolation interfaces
│   │   ├── utils/                    # Multi-tenant utilities
│   │   │   ├── tenant.util.ts        # Tenant utilities
│   │   │   ├── database.util.ts      # Database utilities
│   │   │   ├── connection.util.ts    # Connection utilities
│   │   │   └── isolation.util.ts     # Isolation utilities
│   │   ├── services/                 # Multi-tenant services
│   │   │   ├── tenant-context.service.ts # Tenant context service
│   │   │   ├── tenant-resolver.service.ts # Tenant resolver service
│   │   │   ├── database-connection.service.ts # Database connection service
│   │   │   ├── database-isolation.service.ts # Database isolation service
│   │   │   ├── database-migration.service.ts # Database migration service
│   │   │   ├── database-backup.service.ts # Database backup service
│   │   │   ├── database-monitoring.service.ts # Database monitoring service
│   │   │   └── database-security.service.ts # Database security service
│   │   ├── middleware/               # Multi-tenant middleware
│   │   │   ├── tenant.middleware.ts  # Tenant middleware
│   │   │   ├── database.middleware.ts # Database middleware
│   │   │   ├── connection.middleware.ts # Connection middleware
│   │   │   └── isolation.middleware.ts # Isolation middleware
│   │   ├── guards/                   # Multi-tenant guards
│   │   │   ├── tenant.guard.ts       # Tenant guard
│   │   │   ├── database.guard.ts     # Database guard
│   │   │   ├── connection.guard.ts   # Connection guard
│   │   │   └── isolation.guard.ts    # Isolation guard
│   │   ├── decorators/               # Multi-tenant decorators
│   │   │   ├── tenant.decorator.ts   # Tenant decorator
│   │   │   ├── database.decorator.ts # Database decorator
│   │   │   ├── connection.decorator.ts # Connection decorator
│   │   │   └── isolation.decorator.ts # Isolation decorator
│   │   ├── config/                   # Multi-tenant configuration
│   │   │   ├── tenant.config.ts      # Tenant config
│   │   │   ├── database.config.ts    # Database config
│   │   │   ├── connection.config.ts  # Connection config
│   │   │   ├── isolation.config.ts   # Isolation config
│   │   │   ├── migration.config.ts   # Migration config
│   │   │   ├── backup.config.ts      # Backup config
│   │   │   ├── monitoring.config.ts  # Monitoring config
│   │   │   └── security.config.ts    # Security config
│   │   ├── types/                    # Multi-tenant types
│   │   │   ├── tenant.types.ts       # Tenant types
│   │   │   ├── database.types.ts     # Database types
│   │   │   ├── connection.types.ts   # Connection types
│   │   │   └── isolation.types.ts    # Isolation types
│   │   ├── multi-tenant.module.ts    # Multi-tenant module
│   │   └── index.ts                  # Main export file
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── guards/
│   │   │   └── utils/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docs/                         # Documentation
│   │   ├── README.md                 # Usage guide
│   │   ├── tenant.md                 # Tenant documentation
│   │   ├── database.md               # Database documentation
│   │   ├── connection.md             # Connection documentation
│   │   └── isolation.md              # Isolation documentation
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── README.md
│
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── database/             # Database management module
│   │   │   │   ├── commands/         # Database commands
│   │   │   │   │   ├── create-database.command.ts
│   │   │   │   │   ├── update-database.command.ts
│   │   │   │   │   ├── delete-database.command.ts
│   │   │   │   │   ├── backup-database.command.ts
│   │   │   │   │   ├── restore-database.command.ts
│   │   │   │   │   ├── migrate-database.command.ts
│   │   │   │   │   └── monitor-database.command.ts
│   │   │   │   ├── queries/          # Database queries
│   │   │   │   │   ├── get-databases.query.ts
│   │   │   │   │   ├── get-database-by-id.query.ts
│   │   │   │   │   ├── search-databases.query.ts
│   │   │   │   │   ├── get-database-stats.query.ts
│   │   │   │   │   ├── get-database-health.query.ts
│   │   │   │   │   └── get-database-backup.query.ts
│   │   │   │   ├── events/           # Database events
│   │   │   │   │   ├── database-created.event.ts
│   │   │   │   │   ├── database-updated.event.ts
│   │   │   │   │   ├── database-deleted.event.ts
│   │   │   │   │   ├── database-backed-up.event.ts
│   │   │   │   │   ├── database-restored.event.ts
│   │   │   │   │   └── database-migrated.event.ts
│   │   │   │   ├── dtos/             # Database DTOs
│   │   │   │   │   ├── create-database.dto.ts
│   │   │   │   │   ├── update-database.dto.ts
│   │   │   │   │   ├── database-info.dto.ts
│   │   │   │   │   ├── database-search.dto.ts
│   │   │   │   │   ├── database-stats.dto.ts
│   │   │   │   │   └── database-backup.dto.ts
│   │   │   │   ├── schemas/          # Database schemas
│   │   │   │   │   ├── database.schema.ts
│   │   │   │   │   ├── database-config.schema.ts
│   │   │   │   │   ├── database-stats.schema.ts
│   │   │   │   │   └── database-backup.schema.ts
│   │   │   │   ├── services/         # Database services
│   │   │   │   │   ├── database.service.ts
│   │   │   │   │   ├── database-config.service.ts
│   │   │   │   │   ├── database-stats.service.ts
│   │   │   │   │   ├── database-backup.service.ts
│   │   │   │   │   ├── database-restore.service.ts
│   │   │   │   │   ├── database-migration.service.ts
│   │   │   │   │   └── database-monitoring.service.ts
│   │   │   │   ├── validators/       # Database validators
│   │   │   │   │   ├── database.validator.ts
│   │   │   │   │   ├── database-config.validator.ts
│   │   │   │   │   └── database-backup.validator.ts
│   │   │   │   └── database.module.ts
│   │   │   ├── database-backup/      # Database backup module
│   │   │   │   ├── commands/         # Backup commands
│   │   │   │   │   ├── create-backup.command.ts
│   │   │   │   │   ├── restore-backup.command.ts
│   │   │   │   │   └── delete-backup.command.ts
│   │   │   │   ├── queries/          # Backup queries
│   │   │   │   │   ├── get-backups.query.ts
│   │   │   │   │   ├── get-backup-by-id.query.ts
│   │   │   │   │   └── search-backups.query.ts
│   │   │   │   ├── dtos/             # Backup DTOs
│   │   │   │   │   ├── create-backup.dto.ts
│   │   │   │   │   ├── restore-backup.dto.ts
│   │   │   │   │   └── backup-info.dto.ts
│   │   │   │   ├── services/         # Backup services
│   │   │   │   │   ├── backup.service.ts
│   │   │   │   │   ├── backup-storage.service.ts
│   │   │   │   │   └── backup-encryption.service.ts
│   │   │   │   └── database-backup.module.ts
│   │   │   ├── database-migration/   # Database migration module
│   │   │   │   ├── commands/         # Migration commands
│   │   │   │   │   ├── run-migration.command.ts
│   │   │   │   │   ├── rollback-migration.command.ts
│   │   │   │   │   └── check-migration.command.ts
│   │   │   │   ├── queries/          # Migration queries
│   │   │   │   │   ├── get-migrations.query.ts
│   │   │   │   │   ├── get-migration-by-id.query.ts
│   │   │   │   │   └── search-migrations.query.ts
│   │   │   │   ├── dtos/             # Migration DTOs
│   │   │   │   │   ├── run-migration.dto.ts
│   │   │   │   │   ├── rollback-migration.dto.ts
│   │   │   │   │   └── migration-info.dto.ts
│   │   │   │   ├── services/         # Migration services
│   │   │   │   │   ├── migration.service.ts
│   │   │   │   │   ├── migration-runner.service.ts
│   │   │   │   │   └── migration-rollback.service.ts
│   │   │   │   └── database-migration.module.ts
│   │   │   └── database-monitoring/  # Database monitoring module
│   │   │       ├── commands/         # Monitoring commands
│   │   │       │   ├── check-health.command.ts
│   │   │       │   ├── collect-metrics.command.ts
│   │   │       │   └── send-alert.command.ts
│   │   │       ├── queries/          # Monitoring queries
│   │   │       │   ├── get-health.query.ts
│   │   │       │   ├── get-metrics.query.ts
│   │   │       │   └── get-alerts.query.ts
│   │   │       ├── dtos/             # Monitoring DTOs
│   │   │       │   ├── health.dto.ts
│   │   │       │   ├── metrics.dto.ts
│   │   │       │   └── alert.dto.ts
│   │   │       ├── services/         # Monitoring services
│   │   │       │   ├── monitoring.service.ts
│   │   │       │   ├── health-check.service.ts
│   │   │       │   └── metrics-collector.service.ts
│   │   │       └── database-monitoring.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── database.controller.ts # Database management endpoints
│   │   │   ├── database-backup.controller.ts # Database backup endpoints
│   │   │   ├── database-migration.controller.ts # Database migration endpoints
│   │   │   └── database-monitoring.controller.ts # Database monitoring endpoints
│   │   ├── middleware/               # Database middleware
│   │   │   ├── database-audit.middleware.ts # Database audit logging
│   │   │   ├── database-validation.middleware.ts # Database validation
│   │   │   └── database-security.middleware.ts # Database security
│   │   ├── guards/                   # Database guards
│   │   │   ├── database-access.guard.ts # Database access guard
│   │   │   ├── database-permission.guard.ts # Database permission guard
│   │   │   └── database-tenant.guard.ts # Database tenant guard
│   │   ├── services/                 # Core services
│   │   │   ├── database-audit.service.ts # Database audit service
│   │   │   ├── database-security.service.ts # Database security service
│   │   │   ├── database-encryption.service.ts # Database encryption service
│   │   │   └── database-compliance.service.ts # Database compliance service
│   │   ├── utils/                    # Database utilities
│   │   │   ├── database.util.ts      # Database utilities
│   │   │   ├── backup.util.ts        # Backup utilities
│   │   │   ├── migration.util.ts     # Migration utilities
│   │   │   └── monitoring.util.ts    # Monitoring utilities
│   │   ├── config/                   # Database configuration
│   │   │   ├── database.config.ts    # Database config
│   │   │   ├── backup.config.ts      # Backup config
│   │   │   ├── migration.config.ts   # Migration config
│   │   │   ├── monitoring.config.ts  # Monitoring config
│   │   │   └── security.config.ts    # Security config
│   │   └── ehr-api.module.ts
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── README.md
```

## 1. Những việc đã làm
- [ ] [High] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có dynamic DB connection pool, backup/restore tự động từng DB, monitoring health từng DB...)

## 2. Những việc cần làm
### Vận hành & Kiểm tra
- [ ] [High] Kiểm tra định kỳ quyền truy cập DB từng tenant (đảm bảo không có user/role nào có quyền truy cập chéo DB)
- [ ] [High] Tự động health check connection tới tất cả tenant DB mỗi X phút (đảm bảo DB luôn sẵn sàng trước khi app routing request)
- [ ] [High] Migration versioning riêng cho từng tenant (đồng bộ, rollback độc lập, quản lý version rõ ràng)
- [ ] [High] Test framework kiểm tra isolation (test case tự động xác minh không có dữ liệu tenant A xuất hiện ở tenant B)
- [ ] [High] Middleware xác định tenant từ domain/header/token, route request tới đúng DB
- [ ] [High] Onboarding tenant mới: tự động tạo DB/schema, migration, seed dữ liệu mẫu, rollback an toàn nếu lỗi
- [ ] [High] API quản lý tenant: thêm, sửa, xóa, backup, restore, monitor DB từng tenant
- [ ] [High] Backup/restore tự động từng DB, đảm bảo backup riêng biệt, phục hồi không ảnh hưởng tenant khác
- [ ] [High] Monitoring health, performance từng DB, cảnh báo khi có sự cố ở bất kỳ tenant nào
- [ ] [Medium] Hỗ trợ hybrid cloud (app cloud, DB local) và on-premise (app & DB local), kết nối bảo mật (VPN, SSH, ZeroTier...), latency thấp, đảm bảo HA
- [ ] [High] Disaster recovery: Kế hoạch phục hồi khi mất DB, mất kết nối, mất site

### Bảo mật & Compliance
- [ ] [High] Log chi tiết thao tác DB của admin/devops (log các lệnh DROP/ALTER/GRANT/DENY, dùng audit plugin hoặc proxy log)
- [ ] [High] IP Whitelist cho truy cập DB (giới hạn kết nối chỉ từ các IP xác định)
- [ ] [High] Key rotation định kỳ cho DB password/token (dùng HashiCorp Vault hoặc tương đương)
- [ ] [High] Mã hóa dữ liệu at-rest (cloud DB: bật encryption, KMS rotation, audit)
- [ ] [High] Mã hóa kết nối DB (SSL/TLS) bắt buộc
- [ ] [High] Quản lý secret, credential an toàn (vault, env, không hardcode)
- [ ] [High] Audit log mọi thao tác quản trị DB (immutable, phục vụ truy vết và compliance)
- [ ] [High] Đáp ứng yêu cầu backup, retention, audit của HIPAA/GDPR (backup định kỳ, lưu trữ đủ thời gian, audit khi cần)

## 3. Bổ sung checklist nâng cao
- [ ] [Medium] Cho phép tenant chọn DB location (region/zone) để đáp ứng data locality (Việt Nam, EU, US...)
- [ ] [Medium] Cho phép scale DB riêng theo tenant (Read replica / write splitting) cho tenant lớn
- [ ] [Medium] Tích hợp event stream (CDC, event sourcing) để đồng bộ dữ liệu tenant với hệ thống ngoài (HIS, ERP, Billing)
- [ ] [Medium] Đảm bảo không có SPOF ở central config/service discovery (dùng distributed config như Consul, etcd, Redis cluster...)
- [ ] [Optional] Cho phép tùy biến logic, module, giao diện từng tenant (nên chuẩn hóa core logic, chỉ override phần cấu hình, giao diện, module mở rộng)

## 4. Quy trình kiểm tra & xác thực chất lượng module Database Isolation
- [ ] [High] **Kiểm thử tự động:**
    - [ ] [High] Unit test, integration test, e2e test cho toàn bộ logic tách DB, schema, migration, connection pool
    - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
    - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
    - [ ] [High] Test RBAC, ABAC, phân quyền truy cập DB, schema
    - [ ] [High] Test middleware auth, mTLS, tenant isolation
    - [ ] [High] Test rate limit, audit log, session hijack, token revoke
    - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] [High] **Kiểm thử hiệu năng:**
    - [ ] [High] Benchmark kết nối DB, schema switch, cross-tenant
    - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - [ ] [High] Benchmark khi nhiều tenant thao tác đồng thời (load test, stress test)
    - [ ] [Medium] Benchmark queue, job async, background task liên quan DB
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
    - [ ] [High] Test migration schema DB, rollback, zero-downtime
    - [ ] [High] Test versioning API, backward compatibility
- [ ] [High] **Kiểm thử CI/CD & alert:**
    - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] [High] **Kiểm thử tài liệu:**
    - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] [High] **Kiểm thử manual & quy trình:**
    - [ ] [High] Test chuyển tenant, rollback, import/export schema
    - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc 