# Health Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, service), Prometheus (metrics exporter), Grafana (dashboard, alert), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Health check phải kiểm tra isolation từng tenant, không để lộ thông tin hệ thống hoặc tenant khác qua API.
> - Health check phải bảo vệ endpoint (rate limit, auth nếu cần), tránh bị abuse hoặc dò quét.
> - Các chỉ số health phải phục vụ cả monitoring nội bộ (Prometheus, Grafana, ...), cảnh báo sớm sự cố, và compliance (audit log).
> - Checklist này chỉ tập trung cho backend (API, service, monitoring, audit, multi-tenant isolation), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── health/               # Health check module
│   │   │   │   ├── commands/         # Health commands
│   │   │   │   │   ├── check-health.command.ts
│   │   │   │   │   ├── check-database.command.ts
│   │   │   │   │   ├── check-cache.command.ts
│   │   │   │   │   ├── check-queue.command.ts
│   │   │   │   │   └── check-external.command.ts
│   │   │   │   ├── queries/          # Health queries
│   │   │   │   │   ├── get-health.query.ts
│   │   │   │   │   ├── get-health-detailed.query.ts
│   │   │   │   │   ├── get-health-tenant.query.ts
│   │   │   │   │   ├── get-health-metrics.query.ts
│   │   │   │   │   └── get-health-status.query.ts
│   │   │   │   ├── events/           # Health events
│   │   │   │   │   ├── health-checked.event.ts
│   │   │   │   │   ├── health-failed.event.ts
│   │   │   │   │   ├── health-recovered.event.ts
│   │   │   │   │   └── health-alert.event.ts
│   │   │   │   ├── dtos/             # Health DTOs
│   │   │   │   │   ├── health-status.dto.ts
│   │   │   │   │   ├── health-detailed.dto.ts
│   │   │   │   │   ├── health-metrics.dto.ts
│   │   │   │   │   ├── health-alert.dto.ts
│   │   │   │   │   └── health-tenant.dto.ts
│   │   │   │   ├── schemas/          # Health schemas
│   │   │   │   │   ├── health.schema.ts
│   │   │   │   │   ├── health-metrics.schema.ts
│   │   │   │   │   ├── health-alert.schema.ts
│   │   │   │   │   └── health-tenant.schema.ts
│   │   │   │   ├── services/         # Health services
│   │   │   │   │   ├── health.service.ts
│   │   │   │   │   ├── health-database.service.ts
│   │   │   │   │   ├── health-cache.service.ts
│   │   │   │   │   ├── health-queue.service.ts
│   │   │   │   │   ├── health-external.service.ts
│   │   │   │   │   ├── health-metrics.service.ts
│   │   │   │   │   └── health-alert.service.ts
│   │   │   │   ├── checks/           # Health check implementations
│   │   │   │   │   ├── database.check.ts
│   │   │   │   │   ├── cache.check.ts
│   │   │   │   │   ├── queue.check.ts
│   │   │   │   │   ├── storage.check.ts
│   │   │   │   │   ├── external-api.check.ts
│   │   │   │   │   ├── background-job.check.ts
│   │   │   │   │   └── tenant.check.ts
│   │   │   │   └── health.module.ts
│   │   │   ├── monitoring/           # Monitoring module
│   │   │   │   ├── commands/         # Monitoring commands
│   │   │   │   │   ├── collect-metrics.command.ts
│   │   │   │   │   ├── send-alert.command.ts
│   │   │   │   │   └── update-dashboard.command.ts
│   │   │   │   ├── queries/          # Monitoring queries
│   │   │   │   │   ├── get-metrics.query.ts
│   │   │   │   │   ├── get-alerts.query.ts
│   │   │   │   │   └── get-dashboard.query.ts
│   │   │   │   ├── dtos/             # Monitoring DTOs
│   │   │   │   │   ├── metrics.dto.ts
│   │   │   │   │   ├── alert.dto.ts
│   │   │   │   │   └── dashboard.dto.ts
│   │   │   │   ├── services/         # Monitoring services
│   │   │   │   │   ├── metrics.service.ts
│   │   │   │   │   ├── alert.service.ts
│   │   │   │   │   ├── dashboard.service.ts
│   │   │   │   │   └── prometheus.service.ts
│   │   │   │   └── monitoring.module.ts
│   │   │   └── alerts/               # Alert management module
│   │   │       ├── commands/         # Alert commands
│   │   │       │   ├── create-alert.command.ts
│   │   │       │   ├── update-alert.command.ts
│   │   │       │   └── resolve-alert.command.ts
│   │   │       ├── queries/          # Alert queries
│   │   │       │   ├── get-alerts.query.ts
│   │   │       │   ├── get-alert-by-id.query.ts
│   │   │       │   └── search-alerts.query.ts
│   │   │       ├── dtos/             # Alert DTOs
│   │   │       │   ├── create-alert.dto.ts
│   │   │       │   ├── update-alert.dto.ts
│   │   │       │   └── alert-info.dto.ts
│   │   │       ├── services/         # Alert services
│   │   │       │   ├── alert.service.ts
│   │   │       │   ├── alert-notification.service.ts
│   │   │       │   └── alert-escalation.service.ts
│   │   │       └── alerts.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── health.controller.ts  # Health check endpoints
│   │   │   ├── monitoring.controller.ts # Monitoring endpoints
│   │   │   └── alerts.controller.ts  # Alert endpoints
│   │   ├── middleware/               # Health middleware
│   │   │   ├── health-auth.middleware.ts # Health authentication
│   │   │   ├── health-rate-limit.middleware.ts # Health rate limiting
│   │   │   └── health-audit.middleware.ts # Health audit logging
│   │   ├── guards/                   # Health guards
│   │   │   ├── health-access.guard.ts # Health access guard
│   │   │   ├── health-permission.guard.ts # Health permission guard
│   │   │   └── health-tenant.guard.ts # Health tenant guard
│   │   ├── services/                 # Core services
│   │   │   ├── health-check.service.ts # Health check orchestration
│   │   │   ├── health-metrics.service.ts # Health metrics collection
│   │   │   ├── health-alert.service.ts # Health alerting
│   │   │   └── health-dashboard.service.ts # Health dashboard
│   │   ├── utils/                    # Health utilities
│   │   │   ├── health.util.ts        # Health utilities
│   │   │   ├── metrics.util.ts       # Metrics utilities
│   │   │   ├── alert.util.ts         # Alert utilities
│   │   │   └── dashboard.util.ts     # Dashboard utilities
│   │   ├── config/                   # Health configuration
│   │   │   ├── health.config.ts      # Health config
│   │   │   ├── monitoring.config.ts  # Monitoring config
│   │   │   ├── alert.config.ts       # Alert config
│   │   │   └── prometheus.config.ts  # Prometheus config
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
│   │   │   ├── health.constants.ts   # Health constants
│   │   │   ├── monitoring.constants.ts # Monitoring constants
│   │   │   ├── alert.constants.ts    # Alert constants
│   │   │   └── metrics.constants.ts  # Metrics constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── health-status.enum.ts # Health status enums
│   │   │   ├── alert-level.enum.ts   # Alert level enums
│   │   │   ├── alert-type.enum.ts    # Alert type enums
│   │   │   └── metrics-type.enum.ts  # Metrics type enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── health.interface.ts   # Health interfaces
│   │   │   ├── monitoring.interface.ts # Monitoring interfaces
│   │   │   ├── alert.interface.ts    # Alert interfaces
│   │   │   └── metrics.interface.ts  # Metrics interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── health.util.ts        # Health utilities
│   │   │   ├── monitoring.util.ts    # Monitoring utilities
│   │   │   ├── alert.util.ts         # Alert utilities
│   │   │   └── metrics.util.ts       # Metrics utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm
- [ ] [High] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có API health check cơ bản, kiểm tra DB, Redis...)

## 2. Những việc cần làm

### Chức năng API & Service
- [ ] [High] API health check tổng quát (GET /health): kiểm tra trạng thái app, DB, cache, storage, queue, external service...
- [ ] [High] API health check chi tiết (GET /health/detailed): trả về trạng thái từng service, từng tenant (nếu cần)
- [ ] [High] API kiểm tra trạng thái DB từng tenant (multi-tenant DB health)
- [ ] [High] API kiểm tra trạng thái các service phụ trợ (Redis, RabbitMQ, S3, ...), external API
- [ ] [Medium] API kiểm tra trạng thái background job, scheduled job, event bus
- [ ] [Medium] API kiểm tra trạng thái license/subscription (nếu có)
- [ ] [Medium] API kiểm tra trạng thái các integration (HIS, LIS, PACS, ... nếu có)
- [ ] [Medium] API kiểm tra version, uptime, build info, commit hash
- [ ] [High] Health check readiness & liveness endpoint riêng biệt (liveness: container còn chạy, readiness: đã sẵn sàng nhận request)

### Bảo mật & Audit
- [ ] [High] Phân tầng quyền truy cập health check (public chỉ được /health, /health/detailed chỉ cho admin hoặc hệ thống giám sát nội bộ)
- [ ] [High] Bảo vệ endpoint health (rate limit, auth, IP whitelist nếu cần)
- [ ] [High] Log mọi lần health check thất bại (audit log, immutable)
- [ ] [Medium] Ghi log các tình huống health fail theo phân loại (lỗi DB, lỗi external API, lỗi CPU/memory overload...)
- [ ] [High] Cảnh báo khi có health check bất thường (liên tục fail, latency cao, ...)

### Monitoring & Alerting
- [ ] [High] Expose structured Prometheus metrics (ví dụ: emr_db_up{tenant="a", db="core"} 1)
- [ ] [Medium] Thống kê sức khỏe theo nhóm tenant (theo khu vực, bệnh viện lớn nhỏ) để ưu tiên cảnh báo
- [ ] [High] Tích hợp Prometheus metrics cho health (exporter)
- [ ] [High] Tích hợp alerting (Grafana Alert, email, Slack, ... khi health check fail)
- [ ] [Medium] Ghi log health check định kỳ vào hệ thống monitoring/audit

### Kiểm thử & tài liệu
- [ ] [High] Unit test, integration test cho toàn bộ API health
- [ ] [High] Test isolation health check giữa các tenant (test backend)
- [ ] [Medium] Test resilience: mô phỏng service phụ trợ down, DB mất kết nối, ... kiểm tra health phản hồi đúng
- [ ] [Medium] Chaos test mô phỏng mất 1 service (Redis, RabbitMQ...) và kiểm tra hệ thống vẫn báo đúng (dùng Chaos Mesh, Gremlin, custom script...)
- [ ] [Medium] Tài liệu API (OpenAPI/Swagger, backend)
- [ ] [Medium] Hướng dẫn sử dụng API health cho admin/backend dev

## 3. Bổ sung checklist nâng cao
- [ ] [Medium] API kiểm tra health từng tenant độc lập (dành cho super admin, audit chặt)
- [ ] [Medium] API kiểm tra health từng module (file upload, patients, users, ...), trả về trạng thái chi tiết
- [ ] [Medium] API kiểm tra health các node trong cluster (multi-instance, multi-region)
- [ ] [Medium] API kiểm tra health các job đồng bộ dữ liệu (sync, CDC, event sourcing)
- [ ] [Optional] API kiểm tra health các endpoint AI/ML (nếu có)
- [ ] [Medium] Load test health check endpoint khi có nhiều request đồng thời
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về monitoring hệ thống y tế

## 4. Quy trình kiểm tra & xác thực chất lượng module Health
- [ ] [High] **Kiểm thử tự động:**
    - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan healthcheck
    - [ ] [High] Test isolation dữ liệu, context giữa các tenant
    - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
    - [ ] [High] Test RBAC, ABAC, phân quyền truy cập health, cross-tenant
    - [ ] [High] Test middleware auth, mTLS, tenant isolation
    - [ ] [High] Test rate limit, audit log, session hijack, token revoke
    - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] [High] **Kiểm thử hiệu năng:**
    - [ ] [High] Benchmark healthcheck, cross-tenant, multi-service
    - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - [ ] [High] Benchmark khi nhiều request đồng thời (load test, stress test)
    - [ ] [Medium] Benchmark queue, job async, background task liên quan health
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
    - [ ] [High] Test migration schema health, rollback, zero-downtime
    - [ ] [High] Test versioning API, backward compatibility
- [ ] [High] **Kiểm thử CI/CD & alert:**
    - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] [High] **Kiểm thử tài liệu:**
    - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] [High] **Kiểm thử manual & quy trình:**
    - [ ] [High] Test healthcheck các service, rollback, import/export health config
    - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc 