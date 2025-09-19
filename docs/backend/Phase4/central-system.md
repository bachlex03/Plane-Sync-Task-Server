# Checklist: Tích hợp Central System – API đồng bộ với các tenant

> **Lưu ý quan trọng:**
>
> - Central System là backend trung tâm, chịu trách nhiệm nhận, lưu trữ, đồng bộ dữ liệu từ các tenant (bệnh viện), cung cấp API cho các dịch vụ khác truy vấn hoặc đồng bộ dữ liệu.
> - API Central phải hỗ trợ multi-tenant, xác thực 2 chiều (JWT hoặc mutual TLS), lưu metadata (lastSyncAt, log, checksum), audit log, monitoring, resilience, compliance.
> - Checklist này tập trung vào API đồng bộ với các tenant, không bao gồm các API public/external khác.

## Cấu trúc thư mục

```
apps/backend/
├── central-system/                    # Central System Service
│   ├── src/
│   │   ├── central.module.ts
│   │   ├── central.service.ts
│   │   ├── central.controller.ts
│   │   ├── sync/                     # Sync Module
│   │   │   ├── sync.module.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── sync.controller.ts
│   │   │   ├── dtos/                 # Sync DTOs
│   │   │   │   ├── sync-request.dto.ts
│   │   │   │   ├── sync-response.dto.ts
│   │   │   │   ├── sync-status.dto.ts
│   │   │   │   └── sync-metrics.dto.ts
│   │   │   ├── strategies/           # Sync Strategies
│   │   │   │   ├── full-sync.strategy.ts
│   │   │   │   ├── incremental-sync.strategy.ts
│   │   │   │   ├── batch-sync.strategy.ts
│   │   │   │   └── conflict-sync.strategy.ts
│   │   │   ├── utils/                # Sync Utilities
│   │   │   │   ├── checksum.ts
│   │   │   │   ├── sync-logger.ts
│   │   │   │   ├── versioning.ts
│   │   │   │   └── validation.ts
│   │   │   ├── guards/               # Sync Guards
│   │   │   │   ├── sync-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rate-limit.guard.ts
│   │   │   ├── interfaces/           # Sync Interfaces
│   │   │   │   ├── sync.interface.ts
│   │   │   │   ├── sync-strategy.interface.ts
│   │   │   │   └── sync-log.interface.ts
│   │   │   └── __tests__/            # Sync Tests
│   │   │       ├── sync.service.spec.ts
│   │   │       ├── sync.controller.spec.ts
│   │   │       ├── sync-strategies.spec.ts
│   │   │       └── sync-isolation.spec.ts
│   │   ├── metadata/                 # Metadata Module
│   │   │   ├── metadata.module.ts
│   │   │   ├── metadata.entity.ts
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata.controller.ts
│   │   │   ├── dtos/                 # Metadata DTOs
│   │   │   │   ├── metadata.dto.ts
│   │   │   │   ├── metadata-query.dto.ts
│   │   │   │   └── metadata-update.dto.ts
│   │   │   ├── utils/                # Metadata Utilities
│   │   │   │   ├── metadata-utils.ts
│   │   │   │   ├── versioning.ts
│   │   │   │   └── validation.ts
│   │   │   └── __tests__/            # Metadata Tests
│   │   │       ├── metadata.service.spec.ts
│   │   │       ├── metadata.controller.spec.ts
│   │   │       └── metadata-isolation.spec.ts
│   │   ├── auth/                     # Authentication Module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/           # Auth Strategies
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── mTLS.strategy.ts
│   │   │   │   ├── oauth.strategy.ts
│   │   │   │   └── api-key.strategy.ts
│   │   │   ├── guards/               # Auth Guards
│   │   │   │   ├── tenant.guard.ts
│   │   │   │   ├── mutual-tls.guard.ts
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   └── api-key.guard.ts
│   │   │   ├── utils/                # Auth Utilities
│   │   │   │   ├── jwt-utils.ts
│   │   │   │   ├── cert-utils.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── encryption.ts
│   │   │   └── __tests__/            # Auth Tests
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── auth.controller.spec.ts
│   │   │       └── auth-strategies.spec.ts
│   │   ├── logs/                     # Logging Module
│   │   │   ├── logs.module.ts
│   │   │   ├── sync-log.entity.ts
│   │   │   ├── sync-log.service.ts
│   │   │   ├── sync-log.controller.ts
│   │   │   ├── audit-log.entity.ts
│   │   │   ├── audit-log.service.ts
│   │   │   ├── audit-log.controller.ts
│   │   │   ├── utils/                # Logging Utilities
│   │   │   │   ├── log-utils.ts
│   │   │   │   ├── audit-utils.ts
│   │   │   │   └── retention.ts
│   │   │   └── __tests__/            # Logging Tests
│   │   │       ├── sync-log.service.spec.ts
│   │   │       ├── audit-log.service.spec.ts
│   │   │       └── log-retention.spec.ts
│   │   ├── monitoring/               # Monitoring Module
│   │   │   ├── monitoring.module.ts
│   │   │   ├── monitoring.service.ts
│   │   │   ├── monitoring.controller.ts
│   │   │   ├── exporters/            # Monitoring Exporters
│   │   │   │   ├── prometheus-exporter.ts
│   │   │   │   ├── custom-exporter.ts
│   │   │   │   ├── grafana-exporter.ts
│   │   │   │   └── alert-exporter.ts
│   │   │   ├── metrics/              # Metrics Collection
│   │   │   │   ├── sync-metrics.ts
│   │   │   │   ├── auth-metrics.ts
│   │   │   │   ├── performance-metrics.ts
│   │   │   │   └── business-metrics.ts
│   │   │   ├── alerts/               # Alert Management
│   │   │   │   ├── alert.service.ts
│   │   │   │   ├── alert-rules.ts
│   │   │   │   ├── alert-notification.ts
│   │   │   │   └── alert-escalation.ts
│   │   │   ├── utils/                # Monitoring Utilities
│   │   │   │   ├── monitoring-utils.ts
│   │   │   │   ├── metrics-utils.ts
│   │   │   │   ├── alert-utils.ts
│   │   │   │   └── dashboard-utils.ts
│   │   │   └── __tests__/            # Monitoring Tests
│   │   │       ├── monitoring.service.spec.ts
│   │   │       ├── metrics.spec.ts
│   │   │       └── alerts.spec.ts
│   │   ├── interfaces/               # Central System Interfaces
│   │   │   ├── central.interface.ts
│   │   │   ├── sync.interface.ts
│   │   │   ├── metadata.interface.ts
│   │   │   ├── auth.interface.ts
│   │   │   └── monitoring.interface.ts
│   │   └── __tests__/                # Central System Tests
│   │       ├── central-system.e2e-spec.ts
│   │       ├── central-integration.spec.ts
│   │       ├── central-performance.spec.ts
│   │       └── central-resilience.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── central-e2e.spec.ts
│   │   ├── multi-tenant-central.spec.ts
│   │   ├── sync-integration.spec.ts
│   │   └── auth-integration.spec.ts
│   └── package.json
│
libs/backend/
├── central/                           # Central System Library
│   ├── src/
│   │   ├── central.module.ts
│   │   ├── central.service.ts
│   │   ├── sync/                     # Base Sync Functionality
│   │   │   ├── sync.service.ts
│   │   │   ├── sync-strategy.ts
│   │   │   ├── sync-validator.ts
│   │   │   └── sync-logger.ts
│   │   ├── metadata/                 # Base Metadata Functionality
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata-entity.ts
│   │   │   └── metadata-validator.ts
│   │   ├── auth/                     # Base Auth Functionality
│   │   │   ├── auth.service.ts
│   │   │   ├── auth-strategy.ts
│   │   │   ├── auth-validator.ts
│   │   │   └── auth-guard.ts
│   │   ├── monitoring/               # Base Monitoring Functionality
│   │   │   ├── monitoring.service.ts
│   │   │   ├── metrics-collector.ts
│   │   │   ├── alert-manager.ts
│   │   │   └── exporter.ts
│   │   ├── utils/                    # Central Utilities
│   │   │   ├── central-utils.ts
│   │   │   ├── sync-utils.ts
│   │   │   ├── metadata-utils.ts
│   │   │   ├── auth-utils.ts
│   │   │   └── monitoring-utils.ts
│   │   ├── interfaces/               # Central Interfaces
│   │   │   ├── central.interface.ts
│   │   │   ├── sync.interface.ts
│   │   │   ├── metadata.interface.ts
│   │   │   ├── auth.interface.ts
│   │   │   └── monitoring.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Kiến trúc & API đồng bộ

- [ ] [None] Thiết kế kiến trúc Central System cho đồng bộ dữ liệu với tenant (module, service, controller, strategy, metadata, log, monitoring)
- [ ] [None] Định nghĩa API đồng bộ: endpoint, method, payload, response, versioning, error format
- [ ] [None] Hỗ trợ idempotency cho sync API (Idempotency-Key hoặc hash)
- [ ] [None] Ghi nhận sync direction (push từ tenant, pull từ central)
- [ ] [None] Phân biệt sync trigger (manual, schedule, event, recovery)
- [ ] [None] Mapping schema/version giữa central và tenant nếu khác nhau
- [ ] [None] Hỗ trợ full sync, incremental sync, batch sync, conflict resolution
- [ ] [None] Hỗ trợ pagination & chunking cho batch sync (đặc biệt với full sync lớn)
- [ ] [None] Định nghĩa DTO/schema cho sync request/response (tenantId, data, lastSyncAt, checksum, version, status, error, metadata, direction, trigger...)
- [ ] [None] Hỗ trợ multi-tenant: xác định tenant qua header, token, hoặc mTLS cert
- [ ] [None] Lưu metadata: lastSyncAt, sync log, checksum, version, actor, status
- [ ] [None] Lưu log đồng bộ: request, response, error, latency, actor, traceId

### Xác thực & Bảo mật

- [ ] [None] Xác thực 2 chiều: JWT (Bearer token) hoặc mutual TLS (client cert)
- [ ] [None] Xác thực client (tenant) theo CA riêng (mTLS + custom root CA per tenant)
- [ ] [None] Ký nội dung payload bằng HMAC hoặc JWT để chống tampering
- [ ] [None] Token-based throttle riêng cho mỗi tenant (rate limit phân biệt)
- [ ] [None] Check token expiry và revoke (JWT blacklist/rotation)
- [ ] [None] RBAC/ABAC: phân quyền truy cập API đồng bộ
- [ ] [None] Input validation, rate-limit, IP whitelist, audit log truy cập
- [ ] [None] Mã hóa dữ liệu nhạy cảm khi truyền/ghi log
- [ ] [None] Compliance: HIPAA, GDPR, log access, data retention

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho sync API (sync_request_total, sync_error_total, sync_latency_seconds, sync_status, tenantId, version, sync_completion_time, sync_duration)
- [ ] [None] Ghi nhận sync completion time và sync duration per tenant
- [ ] [None] Phân loại lỗi theo tầng (network, auth, schema, logic, infra)
- [ ] [None] Log theo chế độ Verbose/Compact (tùy môi trường dev/prod)
- [ ] [None] Support trace context propagation (W3C Trace Context hoặc OpenTelemetry)
- [ ] [None] Alert khi sync lỗi, latency cao, version mismatch, tenant không đồng bộ quá hạn
- [ ] [None] Structured logging: tenantId, actor, traceId, status, error, latency
- [ ] [None] Dashboard/dev tool xem trạng thái sync, lịch sử, thống kê lỗi, alert

### Resilience & Testing

- [ ] [None] Retry, circuit breaker, failover cho sync API
- [ ] [None] Test race condition khi sync đồng thời cùng 1 entity giữa các tenant
- [ ] [None] Test order of events khi sync incremental theo timestamp/eventId
- [ ] [None] Test đồng bộ lệch múi giờ/timezone hoặc clock drift giữa các node
- [ ] [None] Test kết hợp sync API với retry queue (sidekiq, bull, celery...) để đảm bảo retry bền vững
- [ ] [None] Test resilience: simulate network error, DB/queue down, partial sync, rollback
- [ ] [None] Unit test, integration test, e2e test cho sync API, metadata, log
- [ ] [None] Test multi-tenant: đồng bộ song song nhiều tenant, test isolate tenant
- [ ] [None] Test performance: đo throughput, latency, error rate

### Tài liệu hóa & DevOps

- [ ] [None] Có Postman collection hoặc OpenAPI spec cho sync API
- [ ] [None] Tự động sinh changelog khi thay đổi version schema
- [ ] [None] Bảng mapping các version của từng tenant và phiên bản sync tương ứng
- [ ] [None] Công cụ mô phỏng tenant fake để test ở staging/local (mock tenant)
- [ ] [None] Tài liệu hóa API đồng bộ: endpoint, payload, response, error, version
- [ ] [None] Tài liệu hóa kiến trúc, flow đồng bộ, metadata, log, monitoring
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy Central System
- [ ] [None] Script seed/test sync API, inject lỗi, test resilience

## 2. Bổ sung checklist nâng cao

- [ ] [None] Cơ chế kiểm tra "last successful sync" và đề xuất retry khi sync bị ngắt
- [ ] [None] Tích hợp auto-recovery job nếu tenant sync fail liên tục quá X giờ
- [ ] [None] Có bảng lịch đồng bộ định kỳ và trạng thái thực thi (job scheduler visualization)
- [ ] [None] Tích hợp hệ thống hỗ trợ "data diff" (so sánh dữ liệu giữa central và tenant theo checksum)
- [ ] [None] Hỗ trợ event sourcing cho log sync, metadata
- [ ] [None] Hỗ trợ simulate sync/downtime để demo QA hoặc training
- [ ] [None] Định nghĩa lifecycle cho sync API (created, active, deprecated, archived)
- [ ] [None] Định nghĩa SLA/SLO cho sync API (uptime, latency, error rate, alert response time)
