# Checklist: Lưu Metadata (lastSyncAt, log, checksum) – Central System

> **Lưu ý quan trọng:**
>
> - Metadata là thông tin phụ trợ quan trọng cho quá trình đồng bộ giữa Central System và các tenant: lastSyncAt, sync log, checksum, version, actor, trạng thái, lịch sử đồng bộ, lỗi, v.v.
> - Metadata giúp kiểm soát, truy vết, kiểm toán, phát hiện lỗi, hỗ trợ recovery, audit, compliance.
> - Checklist này tập trung vào kiến trúc, lưu trữ, API, bảo mật, monitoring, resilience, compliance cho metadata đồng bộ.

## Cấu trúc thư mục

```
apps/backend/
├── central-system/                    # Central System Service
│   ├── src/
│   │   ├── central.module.ts
│   │   ├── central.service.ts
│   │   ├── central.controller.ts
│   │   ├── metadata/                 # Metadata Module
│   │   │   ├── metadata.module.ts
│   │   │   ├── metadata.entity.ts
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata.controller.ts
│   │   │   ├── dtos/                 # Metadata DTOs
│   │   │   │   ├── metadata-request.dto.ts
│   │   │   │   ├── metadata-response.dto.ts
│   │   │   │   ├── metadata-query.dto.ts
│   │   │   │   ├── metadata-update.dto.ts
│   │   │   │   └── metadata-export.dto.ts
│   │   │   ├── strategies/           # Metadata Strategies
│   │   │   │   ├── update-last-sync.strategy.ts
│   │   │   │   ├── checksum.strategy.ts
│   │   │   │   ├── versioning.strategy.ts
│   │   │   │   ├── diff.strategy.ts
│   │   │   │   └── retention.strategy.ts
│   │   │   ├── utils/                # Metadata Utilities
│   │   │   │   ├── metadata-logger.ts
│   │   │   │   ├── diff-tool.ts
│   │   │   │   ├── checksum-utils.ts
│   │   │   │   ├── versioning-utils.ts
│   │   │   │   ├── retention-utils.ts
│   │   │   │   └── export-utils.ts
│   │   │   ├── watchers/             # Metadata Watchers
│   │   │   │   ├── metadata-watcher.service.ts
│   │   │   │   ├── change-detector.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── subscription.service.ts
│   │   │   ├── guards/               # Metadata Guards
│   │   │   │   ├── metadata-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rbac.guard.ts
│   │   │   ├── interfaces/           # Metadata Interfaces
│   │   │   │   ├── metadata.interface.ts
│   │   │   │   ├── metadata-strategy.interface.ts
│   │   │   │   ├── metadata-watcher.interface.ts
│   │   │   │   └── metadata-log.interface.ts
│   │   │   ├── cli/                  # Metadata CLI Commands
│   │   │   │   ├── metadata-export.cli.ts
│   │   │   │   ├── metadata-cleanup.cli.ts
│   │   │   │   ├── metadata-diff.cli.ts
│   │   │   │   └── metadata-status.cli.ts
│   │   │   └── __tests__/            # Metadata Tests
│   │   │       ├── metadata.service.spec.ts
│   │   │       ├── metadata.controller.spec.ts
│   │   │       ├── metadata-strategies.spec.ts
│   │   │       ├── metadata-watchers.spec.ts
│   │   │       └── metadata-isolation.spec.ts
│   │   ├── auth/                     # Authentication Module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/           # Auth Strategies
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── mTLS.strategy.ts
│   │   │   │   ├── oauth.strategy.ts
│   │   │   │   ├── api-key.strategy.ts
│   │   │   │   └── hybrid.strategy.ts
│   │   │   ├── guards/               # Auth Guards
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   ├── mutual-tls.guard.ts
│   │   │   │   ├── tenant.guard.ts
│   │   │   │   ├── api-key.guard.ts
│   │   │   │   └── hybrid.guard.ts
│   │   │   ├── utils/                # Auth Utilities
│   │   │   │   ├── token-manager.ts
│   │   │   │   ├── cert-manager.ts
│   │   │   │   ├── ca-manager.ts
│   │   │   │   ├── audit-logger.ts
│   │   │   │   ├── rotation.ts
│   │   │   │   ├── revocation.ts
│   │   │   │   └── validation.ts
│   │   │   ├── dtos/                 # Auth DTOs
│   │   │   │   ├── auth-request.dto.ts
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── token.dto.ts
│   │   │   │   ├── cert.dto.ts
│   │   │   │   └── tenant-auth.dto.ts
│   │   │   ├── interfaces/           # Auth Interfaces
│   │   │   │   ├── auth.interface.ts
│   │   │   │   ├── strategy.interface.ts
│   │   │   │   ├── guard.interface.ts
│   │   │   │   └── tenant.interface.ts
│   │   │   ├── cli/                  # Auth CLI Commands
│   │   │   │   ├── token-rotate.cli.ts
│   │   │   │   ├── cert-rotate.cli.ts
│   │   │   │   ├── tenant-revoke.cli.ts
│   │   │   │   └── auth-status.cli.ts
│   │   │   ├── ui/                   # Auth UI Components
│   │   │   │   ├── tenant-self-service.tsx
│   │   │   │   ├── cert-management.tsx
│   │   │   │   ├── token-management.tsx
│   │   │   │   └── auth-dashboard.tsx
│   │   │   └── __tests__/            # Auth Tests
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── jwt.strategy.spec.ts
│   │   │       ├── mTLS.strategy.spec.ts
│   │   │       ├── auth-guards.spec.ts
│   │   │       ├── token-manager.spec.ts
│   │   │       ├── cert-manager.spec.ts
│   │   │       └── auth-isolation.spec.ts
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
│   │   ├── metadata/                 # Base Metadata Functionality
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata-entity.ts
│   │   │   ├── metadata-validator.ts
│   │   │   ├── metadata-strategy.ts
│   │   │   ├── metadata-watcher.ts
│   │   │   ├── checksum-utils.ts
│   │   │   ├── versioning-utils.ts
│   │   │   └── retention-utils.ts
│   │   ├── auth/                     # Base Auth Functionality
│   │   │   ├── auth.service.ts
│   │   │   ├── auth-strategy.ts
│   │   │   ├── auth-validator.ts
│   │   │   ├── auth-guard.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── mTLS.service.ts
│   │   │   ├── token-manager.ts
│   │   │   ├── cert-manager.ts
│   │   │   └── ca-manager.ts
│   │   ├── sync/                     # Base Sync Functionality
│   │   │   ├── sync.service.ts
│   │   │   ├── sync-strategy.ts
│   │   │   ├── sync-validator.ts
│   │   │   └── sync-logger.ts
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

### Kiến trúc & Lưu trữ Metadata

- [ ] [None] Thiết kế schema bảng metadata: tenantId, lastSyncAt, checksum, version, syncStatus (enum: PENDING, IN_PROGRESS, SUCCESS, FAILED, PARTIAL), syncScope (toàn bộ module hay subset), syncLatency, actor, error, syncDirection, trigger, log, history, diff, updatedAt, createdAt, custom key-value
- [ ] [None] Định nghĩa entity/model cho metadata, mapping với bảng DB
- [ ] [None] Hỗ trợ lưu nhiều loại metadata: lastSyncAt, sync log, checksum, version, error, diff, lịch sử đồng bộ, syncScope, syncLatency, custom key-value
- [ ] [None] Hỗ trợ versioning cho metadata (schema version, breaking changes)
- [ ] [None] Lưu lịch sử thay đổi metadata (audit trail, history table)
- [ ] [None] Hỗ trợ lưu metadata riêng cho từng tenant, từng loại dữ liệu (Patient, Visit, Lab...)
- [ ] [None] Hỗ trợ lưu metadata cho từng direction (push, pull), trigger (manual, schedule, event, recovery)
- [ ] [None] Hỗ trợ lưu diff/checksum để so sánh dữ liệu giữa central và tenant
- [ ] [None] Tự động archive metadata sau N tháng (retention policy)
- [ ] [None] Cân nhắc cache layer (Redis) để giảm truy vấn DB real-time nếu metadata truy cập thường xuyên

### API & Đồng bộ Metadata

- [ ] [None] Định nghĩa API truy vấn, cập nhật, đồng bộ metadata (RESTful hoặc GraphQL)
- [ ] [None] API lấy lastSyncAt, checksum, log, diff, lịch sử đồng bộ cho từng tenant/module
- [ ] [None] API cập nhật metadata khi sync thành công/thất bại, rollback, recovery
- [ ] [None] Hỗ trợ batch API cho truy vấn/cập nhật metadata nhiều tenant/module cùng lúc
- [ ] [None] Hỗ trợ pagination, filter, sort cho log/lịch sử metadata
- [ ] [None] Hỗ trợ idempotency cho API cập nhật metadata
- [ ] [None] API export toàn bộ metadata theo range thời gian (CSV/JSON phục vụ audit/troubleshooting)
- [ ] [None] API diff tool giữa tenant và central (model-based/checksum-based)
- [ ] [None] API webhook thông báo tenant khi metadata thay đổi hoặc đồng bộ thất bại
- [ ] [None] Cơ chế "metadata watcher"/subscription (GraphQL/subscription/socket) để giám sát realtime
- [ ] [None] API đánh dấu "override" nếu metadata cũ bị thay bằng bản mới không khớp checksum

### Bảo mật & Compliance

- [ ] [None] RBAC/ABAC cho API metadata (chỉ user/tenant có quyền mới truy cập/cập nhật)
- [ ] [None] Bảo vệ metadata khỏi truy vấn chéo tenant (cross-tenant isolation)
- [ ] [None] Cơ chế xóa/ẩn metadata theo yêu cầu tenant (right to be forgotten - GDPR)
- [ ] [None] Audit log mọi thao tác truy cập/cập nhật metadata, log cả thao tác "read" (forensic)
- [ ] [None] Cơ chế soft delete metadata (xóa nhưng có thể phục hồi)
- [ ] [None] Mã hóa trường nhạy cảm (checksum, error, actor) khi lưu/log
- [ ] [None] Compliance: HIPAA, GDPR, data retention, log access, schema migration

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho metadata (metadata_update_total, metadata_error_total, metadata_latency_seconds, tenantId, module, version)
- [ ] [None] Alert nếu lastSyncAt chênh lệch vượt ngưỡng (delay nghi ngờ)
- [ ] [None] Alert nếu metadata có checksum mismatch liên tiếp trong N lần
- [ ] [None] Alert khi metadata update fail, checksum mismatch, lastSyncAt quá hạn, diff lớn bất thường
- [ ] [None] Log chi tiết các trường hợp override metadata (ghi rõ giá trị cũ và mới)
- [ ] [None] Structured logging: tenantId, module, actor, status, error, latency, diff
- [ ] [None] Dashboard/dev tool xem trạng thái metadata, lịch sử, thống kê lỗi, alert
- [ ] [None] Giao diện CLI hoặc mini dashboard để debug metadata theo tenant/module nhanh chóng

### Resilience & Testing

- [ ] [None] Retry, circuit breaker, failover cho API metadata
- [ ] [None] Thử nghiệm rollback metadata nếu sync phía tenant thất bại sau cập nhật central
- [ ] [None] Test handling metadata conflict giữa manual sync vs auto sync
- [ ] [None] Test thời điểm race condition khi metadata bị cập nhật bởi 2 sync job song song
- [ ] [None] Fake latency/error injection để test stability trong staging
- [ ] [None] Test resilience: simulate DB error, partial update, rollback, diff mismatch
- [ ] [None] Unit test, integration test, e2e test cho metadata API, entity, log
- [ ] [None] Test multi-tenant: metadata riêng biệt từng tenant, test isolate tenant
- [ ] [None] Test performance: đo throughput, latency, error rate

### Tài liệu hóa & DevOps

- [ ] [None] Auto-gen document schema metadata từ entity (Swagger/GraphQL SDL)
- [ ] [None] Dev script generate dummy metadata để test UI/monitor/dashboard
- [ ] [None] Tag version cho metadata module để dễ trace deployment và rollback
- [ ] [None] Kiểm thử rollback metadata trong CI pipeline (GitHub Actions/GitLab CI)
- [ ] [None] Tài liệu hóa schema, API, flow cập nhật/truy vấn metadata
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy metadata module
- [ ] [None] Script seed/test metadata, inject lỗi, test resilience

## 2. Bổ sung checklist nâng cao

- [ ] [None] Cho phép metadata được "mirror" ra các hệ thống khác: Kafka, Elasticsearch, audit system
- [ ] [None] Metadata "baseline hash" cho mỗi module để kiểm tra data corruption/lost sync
- [ ] [None] Workflow sync metadata liên kết với rule engine (nếu metadata thỏa điều kiện X thì auto alert, auto retry...)
- [ ] [None] Cho phép nhập metadata qua file nếu tenant gửi backup thủ công (CSV/JSON -> validate -> insert)
- [ ] [None] Giao diện visualize version graph/timeline của metadata (flow đồng bộ bản v1 → v2 → v3...)
- [ ] [None] Hỗ trợ event sourcing cho metadata/history
- [ ] [None] Hỗ trợ simulate metadata/diff mismatch để demo QA hoặc training
- [ ] [None] Định nghĩa lifecycle cho metadata (created, active, deprecated, archived)
- [ ] [None] Định nghĩa SLA/SLO cho metadata API (uptime, latency, error rate, alert response time)
- [ ] [None] Tích hợp công cụ visualize diff/lịch sử metadata (dashboard, BI tool)
