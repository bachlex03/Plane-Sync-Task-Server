# Audit / Log Service Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS (interceptor, service), Prisma ORM (PostgreSQL, bảng auditLog append-only), Redis (cache), Prometheus/Grafana (monitoring), OpenTelemetry (tracing, metrics), Docker Compose (devops), audit log immutable, tuân thủ HIPAA/GDPR.
> - Audit log phải đầy đủ, immutable, phục vụ truy vết và compliance (HIPAA/GDPR), lưu đủ 6 năm.
> - Mọi hành động người dùng, admin, hệ thống đều phải log lại (action, resource, user, tenant, IP, user-agent, ...).
> - Audit log phải phân biệt severity, cảnh báo khi có hành động nguy hiểm (break-glass, delete, export, ...).
> - Checklist này chỉ tập trung cho backend (API, service, audit, monitoring, compliance), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── audit-log/            # Audit log module
│   │   │   │   ├── commands/         # Audit log commands
│   │   │   │   │   ├── create-audit-log.command.ts
│   │   │   │   │   ├── update-audit-log.command.ts
│   │   │   │   │   ├── delete-audit-log.command.ts
│   │   │   │   │   ├── export-audit-log.command.ts
│   │   │   │   │   └── archive-audit-log.command.ts
│   │   │   │   ├── queries/          # Audit log queries
│   │   │   │   │   ├── get-audit-logs.query.ts
│   │   │   │   │   ├── get-audit-log-by-id.query.ts
│   │   │   │   │   ├── search-audit-logs.query.ts
│   │   │   │   │   ├── get-audit-stats.query.ts
│   │   │   │   │   ├── get-audit-anomalies.query.ts
│   │   │   │   │   └── get-audit-compliance.query.ts
│   │   │   │   ├── events/           # Audit log events
│   │   │   │   │   ├── audit-log-created.event.ts
│   │   │   │   │   ├── audit-log-updated.event.ts
│   │   │   │   │   ├── audit-log-deleted.event.ts
│   │   │   │   │   ├── audit-anomaly-detected.event.ts
│   │   │   │   │   └── audit-compliance-alert.event.ts
│   │   │   │   ├── dtos/             # Audit log DTOs
│   │   │   │   │   ├── create-audit-log.dto.ts
│   │   │   │   │   ├── update-audit-log.dto.ts
│   │   │   │   │   ├── audit-log-info.dto.ts
│   │   │   │   │   ├── audit-log-search.dto.ts
│   │   │   │   │   ├── audit-stats.dto.ts
│   │   │   │   │   └── audit-compliance.dto.ts
│   │   │   │   ├── schemas/          # Audit log schemas
│   │   │   │   │   ├── audit-log.schema.ts
│   │   │   │   │   ├── audit-stats.schema.ts
│   │   │   │   │   ├── audit-anomaly.schema.ts
│   │   │   │   │   ├── audit-compliance.schema.ts
│   │   │   │   │   └── audit-retention.schema.ts
│   │   │   │   ├── services/         # Audit log services
│   │   │   │   │   ├── audit-log.service.ts
│   │   │   │   │   ├── audit-stats.service.ts
│   │   │   │   │   ├── audit-anomaly.service.ts
│   │   │   │   │   ├── audit-compliance.service.ts
│   │   │   │   │   ├── audit-export.service.ts
│   │   │   │   │   ├── audit-archive.service.ts
│   │   │   │   │   └── audit-retention.service.ts
│   │   │   │   ├── validators/       # Audit log validators
│   │   │   │   │   ├── audit-log.validator.ts
│   │   │   │   │   ├── audit-search.validator.ts
│   │   │   │   │   └── audit-export.validator.ts
│   │   │   │   └── audit-log.module.ts
│   │   │   ├── audit-stats/          # Audit statistics module
│   │   │   │   ├── commands/         # Stats commands
│   │   │   │   │   ├── collect-stats.command.ts
│   │   │   │   │   ├── update-stats.command.ts
│   │   │   │   │   └── export-stats.command.ts
│   │   │   │   ├── queries/          # Stats queries
│   │   │   │   │   ├── get-stats.query.ts
│   │   │   │   │   ├── get-stats-by-period.query.ts
│   │   │   │   │   └── search-stats.query.ts
│   │   │   │   ├── dtos/             # Stats DTOs
│   │   │   │   │   ├── stats.dto.ts
│   │   │   │   │   ├── stats-period.dto.ts
│   │   │   │   │   └── stats-search.dto.ts
│   │   │   │   ├── services/         # Stats services
│   │   │   │   │   ├── stats.service.ts
│   │   │   │   │   ├── stats-collector.service.ts
│   │   │   │   │   └── stats-export.service.ts
│   │   │   │   └── audit-stats.module.ts
│   │   │   ├── audit-anomaly/        # Audit anomaly module
│   │   │   │   ├── commands/         # Anomaly commands
│   │   │   │   │   ├── detect-anomaly.command.ts
│   │   │   │   │   ├── flag-anomaly.command.ts
│   │   │   │   │   └── resolve-anomaly.command.ts
│   │   │   │   ├── queries/          # Anomaly queries
│   │   │   │   │   ├── get-anomalies.query.ts
│   │   │   │   │   ├── get-anomaly-by-id.query.ts
│   │   │   │   │   └── search-anomalies.query.ts
│   │   │   │   ├── dtos/             # Anomaly DTOs
│   │   │   │   │   ├── anomaly.dto.ts
│   │   │   │   │   ├── anomaly-detection.dto.ts
│   │   │   │   │   └── anomaly-resolution.dto.ts
│   │   │   │   ├── services/         # Anomaly services
│   │   │   │   │   ├── anomaly.service.ts
│   │   │   │   │   ├── anomaly-detection.service.ts
│   │   │   │   │   └── anomaly-alert.service.ts
│   │   │   │   └── audit-anomaly.module.ts
│   │   │   └── audit-compliance/     # Audit compliance module
│   │   │       ├── commands/         # Compliance commands
│   │   │       │   ├── check-compliance.command.ts
│   │   │       │   ├── generate-report.command.ts
│   │   │       │   └── export-compliance.command.ts
│   │   │       ├── queries/          # Compliance queries
│   │   │       │   ├── get-compliance.query.ts
│   │   │       │   ├── get-compliance-report.query.ts
│   │   │       │   └── search-compliance.query.ts
│   │   │       ├── dtos/             # Compliance DTOs
│   │   │       │   ├── compliance.dto.ts
│   │   │       │   ├── compliance-report.dto.ts
│   │   │       │   └── compliance-export.dto.ts
│   │   │       ├── services/         # Compliance services
│   │   │       │   ├── compliance.service.ts
│   │   │       │   ├── compliance-report.service.ts
│   │   │       │   └── compliance-export.service.ts
│   │   │       └── audit-compliance.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── audit-log.controller.ts # Audit log endpoints
│   │   │   ├── audit-stats.controller.ts # Audit stats endpoints
│   │   │   ├── audit-anomaly.controller.ts # Audit anomaly endpoints
│   │   │   └── audit-compliance.controller.ts # Audit compliance endpoints
│   │   ├── middleware/               # Audit middleware
│   │   │   ├── audit-logging.middleware.ts # Audit logging middleware
│   │   │   ├── audit-validation.middleware.ts # Audit validation
│   │   │   └── audit-security.middleware.ts # Audit security
│   │   ├── interceptors/             # Audit interceptors
│   │   │   ├── audit-logging.interceptor.ts # Audit logging interceptor
│   │   │   ├── audit-performance.interceptor.ts # Audit performance
│   │   │   └── audit-security.interceptor.ts # Audit security
│   │   ├── guards/                   # Audit guards
│   │   │   ├── audit-access.guard.ts # Audit access guard
│   │   │   ├── audit-permission.guard.ts # Audit permission guard
│   │   │   └── audit-tenant.guard.ts # Audit tenant guard
│   │   ├── services/                 # Core services
│   │   │   ├── audit-logger.service.ts # Audit logger service
│   │   │   ├── audit-storage.service.ts # Audit storage service
│   │   │   ├── audit-encryption.service.ts # Audit encryption service
│   │   │   ├── audit-export.service.ts # Audit export service
│   │   │   └── audit-archive.service.ts # Audit archive service
│   │   ├── utils/                    # Audit utilities
│   │   │   ├── audit.util.ts         # Audit utilities
│   │   │   ├── stats.util.ts         # Stats utilities
│   │   │   ├── anomaly.util.ts       # Anomaly utilities
│   │   │   ├── compliance.util.ts    # Compliance utilities
│   │   │   └── encryption.util.ts    # Encryption utilities
│   │   ├── config/                   # Audit configuration
│   │   │   ├── audit.config.ts       # Audit config
│   │   │   ├── stats.config.ts       # Stats config
│   │   │   ├── anomaly.config.ts     # Anomaly config
│   │   │   ├── compliance.config.ts  # Compliance config
│   │   │   └── encryption.config.ts  # Encryption config
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
│   │   │   ├── audit.constants.ts    # Audit constants
│   │   │   ├── stats.constants.ts    # Stats constants
│   │   │   ├── anomaly.constants.ts  # Anomaly constants
│   │   │   ├── compliance.constants.ts # Compliance constants
│   │   │   └── security.constants.ts # Security constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── audit-level.enum.ts   # Audit level enums
│   │   │   ├── audit-action.enum.ts  # Audit action enums
│   │   │   ├── audit-resource.enum.ts # Audit resource enums
│   │   │   ├── anomaly-type.enum.ts  # Anomaly type enums
│   │   │   └── compliance-type.enum.ts # Compliance type enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── audit.interface.ts    # Audit interfaces
│   │   │   ├── stats.interface.ts    # Stats interfaces
│   │   │   ├── anomaly.interface.ts  # Anomaly interfaces
│   │   │   ├── compliance.interface.ts # Compliance interfaces
│   │   │   └── security.interface.ts # Security interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── audit.util.ts         # Audit utilities
│   │   │   ├── stats.util.ts         # Stats utilities
│   │   │   ├── anomaly.util.ts       # Anomaly utilities
│   │   │   ├── compliance.util.ts    # Compliance utilities
│   │   │   ├── security.util.ts      # Security utilities
│   │   │   └── encryption.util.ts    # Encryption utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

## 2. Những việc cần làm
- [ ] [High] Đã có AuditLoggingInterceptor tự động log mọi hành động người dùng (userId, tenantId, action, resource, method, url, IP, user-agent, requestBody, query, timestamp, status, response, duration, severity...)
- [ ] [High] Log cả thành công và lỗi, phân loại severity (CRITICAL, HIGH, MEDIUM, LOW)
- [ ] [Medium] Có decorator để skip audit, hoặc custom action/resource
- [ ] [High] Log vào bảng auditLog trong DB (immutable, phục vụ compliance HIPAA/GDPR)
- [ ] [High] Log break-glass/emergency access với severity CRITICAL
- [ ] [High] Tự động ẩn/redact các trường nhạy cảm (password, token, secret, ssn, creditCard)
- [ ] [High] Có global exception filter log lỗi, stack trace, status, message
- [ ] [Medium] LoggingMiddleware log request/response, user-agent, IP, duration cho mọi request
- [ ] [High] Audit log tự động xác định action/resource (VIEW, CREATE, UPDATE, DELETE, EXPORT, EMERGENCY_ACCESS...)
- [ ] [High] Log audit cho các thao tác hệ thống (background job, sync, migration, ...)
- [ ] [High] Log audit cho các thao tác cross-tenant, truy cập dữ liệu nhạy cảm
- [ ] [High] Log audit cho các API truy cập file, download, export dữ liệu
- [ ] [Medium] Log audit cho các thao tác cấu hình, phân quyền, thay đổi policy
- [ ] [Medium] Log audit cho các thao tác admin (reset password, unlock user, ...)
- [ ] [Medium] Log audit cho các thao tác liên quan đến compliance (consent, break-glass, ...)
- [ ] [Medium] Tích hợp audit log với hệ thống monitoring (Prometheus, OpenTelemetry, ...)
- [ ] [High] API truy vấn, export, filter audit log (theo user, tenant, action, resource, severity, time...)
- [ ] [Medium] API dashboard thống kê audit log (số lượng, loại hành động, cảnh báo bất thường...)
- [ ] [High] Cảnh báo khi có hành động bất thường (nhiều DELETE, EXPORT, EMERGENCY_ACCESS liên tục)
- [ ] [High] Đảm bảo audit log immutable, không bị xóa/sửa (có thể dùng append-only, backup định kỳ)
- [ ] [High] Test audit log isolation giữa các tenant

## 3. Bổ sung checklist nâng cao
- [ ] [Medium] Audit log phân tán (ghi log ra hệ thống ngoài: Kafka, Loki, Elasticsearch...)
- [ ] [Medium] Audit log real-time alert (push notification, email, Slack khi có hành động nguy hiểm)
- [ ] [Medium] Audit log retention policy (tự động archive, backup, xóa log cũ theo quy định)
- [ ] [Medium] Audit log compliance export (chuẩn ISO 27799, HIPAA, GDPR...)
- [ ] [Medium] Load test, stress test audit log khi hệ thống nhiều request

### 🔒 Security & Tamper-Proofing
- [ ] [Medium] Mã hóa bản ghi log trước khi ghi DB (optional): chống đọc trực tiếp dữ liệu từ bảng.
- [ ] [Medium] Ghi hash SHA256 kèm theo mỗi log để kiểm tra tính nguyên vẹn (tamper-detection).
- [ ] [Medium] Viết log ra file append-only và sync định kỳ với backend.

### 📊 Metrics & Anomaly Detection
- [ ] [Medium] Tự động phát hiện anomaly bằng rule hoặc ML nhẹ (ví dụ: 5 lần EXPORT cùng user trong 1 phút → flag).
- [ ] [Medium] Alert có thể cấu hình per-tenant (tenant A cho phép export thoải mái, tenant B cần alert ngay).

### 🚦 Data Governance & Compliance
- [ ] [Medium] Cơ chế lưu trace của consent (ai đồng ý, lúc nào, thay đổi ra sao).
- [ ] [Medium] Audit log ghi rõ context của user (role, branch, department, impersonation nếu có).
- [ ] [Medium] Kiểm soát ghi log theo loại user (ví dụ: chỉ ghi log chi tiết với user thực, không cần với cron).

### ⚙️ Ops / Infra Support
- [ ] [Medium] Script backup + restore riêng cho audit log (nên tách DB audit riêng nếu quy mô lớn).
- [ ] [Medium] Bảng audit log chia theo partition by tenant hoặc tenant + time nếu PostgreSQL hỗ trợ.
- [ ] [Medium] Bổ sung query optimization (index cho filter theo tenantId, action, timestamp...).

### 🧪 Testing bổ sung
- [ ] [Medium] Test audit log khi service retry nhiều lần → chỉ log 1 entry.
- [ ] [Medium] Test khi ghi log thất bại → hệ thống có fallback (ví dụ: backup sang file tạm).

## 4. Quy trình kiểm tra & xác thực chất lượng module Audit Log
- [ ] **Kiểm thử tự động:**
    - Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan audit log
    - Test isolation dữ liệu giữa các tenant (test backend)
    - Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] **Kiểm thử bảo mật:**
    - Test RBAC, ABAC, phân quyền truy cập log, cross-tenant
    - Test middleware auth, mTLS, tenant isolation
    - Test rate limit, audit log, session hijack, token revoke
    - Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] **Kiểm thử hiệu năng:**
    - Benchmark ghi log, truy vấn log, cross-tenant
    - Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - Benchmark khi nhiều user thao tác đồng thời (load test, stress test)
    - Benchmark queue, job async, background task liên quan log
- [ ] **Kiểm thử migration, rollback, versioning:**
    - Test migration schema log, rollback, zero-downtime
    - Test versioning API, backward compatibility
- [ ] **Kiểm thử CI/CD & alert:**
    - Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] **Kiểm thử tài liệu:**
    - Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] **Kiểm thử manual & quy trình:**
    - Test truy xuất log, rollback, import/export log
    - Checklist review trước khi release: security, compliance, performance, doc 