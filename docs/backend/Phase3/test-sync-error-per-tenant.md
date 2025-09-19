# Checklist: Kiểm thử lỗi sync per tenant (rollback, retry, alert riêng biệt)

> **Lưu ý quan trọng:**
>
> - Mục tiêu: Đảm bảo khi xảy ra lỗi sync (push/pull) ở một tenant, hệ thống rollback, retry, alert hoàn toàn tách biệt, không ảnh hưởng tenant khác.
> - Checklist này chỉ tập trung cho backend (sync, isolation, resilience, monitoring, alert), không bao gồm UI/UX.
> - Cần kiểm thử cả unit test, integration test, e2e test cho các trường hợp lỗi sync, rollback, retry, alert.
> - Gợi ý cấu trúc thư mục test theo chuẩn monorepo: apps/backend/sync-service/**tests**/, apps/backend/pull-service/**tests**/
> - Test retry theo error-type (error-type aware retry strategy), failover worker, cancel signal, retry-loop, persist retry state.
> - Test rollback race condition, multi-phase commit, external service, duplicate message, index/view.
> - Test alert DLQ threshold, batch alert, alert channel down, audit log alert, tenant alert channel.
> - Expose metric successAfterRetryCount, error timestamp, region/cluster tag, event emit fail.
> - Test RBAC, log tenantId, sensitive field, audit manager, rate-limit, deploy/migrate, scale, read-only, maintenance.
> - Dashboard DLQ, script cleanup, CLI inject lỗi, mindmap lỗi, JSON schema, tài liệu kịch bản lỗi lớn nhất.

## Cấu trúc thư mục

```
apps/backend/
├── sync-service/                      # Sync Service
│   ├── src/
│   │   ├── sync.module.ts
│   │   ├── sync.service.ts
│   │   ├── sync.controller.ts
│   │   ├── jobs/                     # Sync Jobs
│   │   │   ├── sync-job.ts
│   │   │   ├── retry-job.ts
│   │   │   ├── incremental-sync.job.ts
│   │   │   ├── full-sync.job.ts
│   │   │   └── conflict-resolve.job.ts
│   │   ├── strategies/               # Sync Strategies
│   │   │   ├── incremental-sync.strategy.ts
│   │   │   ├── full-sync.strategy.ts
│   │   │   ├── batch-sync.strategy.ts
│   │   │   └── realtime-sync.strategy.ts
│   │   ├── adapters/                 # Sync Adapters
│   │   │   ├── patient-sync.adapter.ts
│   │   │   ├── encounter-sync.adapter.ts
│   │   │   ├── lab-sync.adapter.ts
│   │   │   ├── imaging-sync.adapter.ts
│   │   │   ├── user-sync.adapter.ts
│   │   │   └── base-sync.adapter.ts
│   │   ├── config/                   # Sync Configuration
│   │   │   ├── sync-config.service.ts
│   │   │   ├── tenant-config.service.ts
│   │   │   ├── conflict-config.service.ts
│   │   │   └── encryption-config.service.ts
│   │   ├── dtos/                     # Data Transfer Objects
│   │   │   ├── sync-request.dto.ts
│   │   │   ├── sync-response.dto.ts
│   │   │   ├── conflict.dto.ts
│   │   │   ├── sync-status.dto.ts
│   │   │   └── sync-metrics.dto.ts
│   │   ├── events/                   # Sync Events
│   │   │   ├── sync-started.event.ts
│   │   │   ├── sync-completed.event.ts
│   │   │   ├── sync-failed.event.ts
│   │   │   ├── conflict-detected.event.ts
│   │   │   └── sync-retry.event.ts
│   │   ├── utils/                    # Sync Utilities
│   │   │   ├── conflict-resolver.ts
│   │   │   ├── dependency-graph.ts
│   │   │   ├── encryption.ts
│   │   │   ├── checksum.ts
│   │   │   ├── versioning.ts
│   │   │   └── validation.ts
│   │   ├── guards/                   # Sync Guards
│   │   │   ├── sync-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rate-limit.guard.ts
│   │   ├── cli/                      # CLI Commands
│   │   │   ├── sync.cli.ts
│   │   │   ├── sync-full.cli.ts
│   │   │   ├── sync-tenant.cli.ts
│   │   │   ├── sync-status.cli.ts
│   │   │   └── sync-retry.cli.ts
│   │   ├── interfaces/               # Sync Interfaces
│   │   │   ├── sync-adapter.interface.ts
│   │   │   ├── sync-strategy.interface.ts
│   │   │   ├── conflict-resolver.interface.ts
│   │   │   └── sync-config.interface.ts
│   │   └── __tests__/                # Sync Service Tests
│   │       ├── sync-service.spec.ts
│   │       ├── conflict-resolver.spec.ts
│   │       ├── fake-central-api.spec.ts
│   │       ├── sync-strategies.spec.ts
│   │       ├── sync-adapters.spec.ts
│   │       ├── sync-error-rollback.spec.ts
│   │       ├── sync-error-retry.spec.ts
│   │       ├── sync-error-alert.spec.ts
│   │       └── sync-isolation.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── sync-e2e.spec.ts
│   │   ├── multi-tenant-sync.spec.ts
│   │   ├── conflict-resolution.spec.ts
│   │   ├── sync-error-e2e.spec.ts
│   │   └── sync-rollback-e2e.spec.ts
│   └── package.json
│
├── pull-service/                      # Pull Service
│   ├── src/
│   │   ├── pull.module.ts
│   │   ├── pull.service.ts
│   │   ├── pull.controller.ts
│   │   ├── jobs/                     # Pull Jobs
│   │   │   ├── pull-job.ts
│   │   │   ├── retry-job.ts
│   │   │   ├── incremental-pull.job.ts
│   │   │   ├── full-pull.job.ts
│   │   │   └── conflict-resolve.job.ts
│   │   ├── strategies/               # Pull Strategies
│   │   │   ├── incremental-pull.strategy.ts
│   │   │   ├── full-pull.strategy.ts
│   │   │   ├── batch-pull.strategy.ts
│   │   │   └── realtime-pull.strategy.ts
│   │   ├── adapters/                 # Pull Adapters
│   │   │   ├── core/                 # Core adapters
│   │   │   │   ├── base-pull.adapter.ts
│   │   │   │   ├── base-mapping.ts
│   │   │   │   └── base-validator.ts
│   │   │   ├── patient/              # Patient adapter
│   │   │   │   ├── patient-pull.adapter.ts
│   │   │   │   ├── patient-mapping.ts
│   │   │   │   └── patient-validator.ts
│   │   │   ├── encounter/            # Encounter adapter
│   │   │   │   ├── encounter-pull.adapter.ts
│   │   │   │   ├── encounter-mapping.ts
│   │   │   │   └── encounter-validator.ts
│   │   │   ├── lab/                  # Lab adapter
│   │   │   │   ├── lab-pull.adapter.ts
│   │   │   │   ├── lab-mapping.ts
│   │   │   │   └── lab-validator.ts
│   │   │   ├── imaging/              # Imaging adapter
│   │   │   │   ├── imaging-pull.adapter.ts
│   │   │   │   ├── imaging-mapping.ts
│   │   │   │   └── imaging-validator.ts
│   │   │   └── user/                 # User adapter
│   │   │       ├── user-pull.adapter.ts
│   │   │       ├── user-mapping.ts
│   │   │       └── user-validator.ts
│   │   ├── config/                   # Pull Configuration
│   │   │   ├── pull-config.service.ts
│   │   │   ├── tenant-config.service.ts
│   │   │   ├── conflict-config.service.ts
│   │   │   └── encryption-config.service.ts
│   │   ├── dtos/                     # Data Transfer Objects
│   │   │   ├── pull-request.dto.ts
│   │   │   ├── pull-response.dto.ts
│   │   │   ├── conflict.dto.ts
│   │   │   ├── pull-status.dto.ts
│   │   │   └── pull-metrics.dto.ts
│   │   ├── events/                   # Pull Events
│   │   │   ├── pull-started.event.ts
│   │   │   ├── pull-completed.event.ts
│   │   │   ├── pull-failed.event.ts
│   │   │   ├── conflict-detected.event.ts
│   │   │   └── pull-retry.event.ts
│   │   ├── utils/                    # Pull Utilities
│   │   │   ├── conflict-resolver.ts
│   │   │   ├── dependency-graph.ts
│   │   │   ├── encryption.ts
│   │   │   ├── checksum.ts
│   │   │   ├── versioning.ts
│   │   │   └── validation.ts
│   │   ├── guards/                   # Pull Guards
│   │   │   ├── pull-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rate-limit.guard.ts
│   │   ├── cli/                      # CLI Commands
│   │   │   ├── pull.cli.ts
│   │   │   ├── pull-full.cli.ts
│   │   │   ├── pull-tenant.cli.ts
│   │   │   ├── pull-status.cli.ts
│   │   │   └── pull-retry.cli.ts
│   │   ├── interfaces/               # Pull Interfaces
│   │   │   ├── pull-adapter.interface.ts
│   │   │   ├── pull-strategy.interface.ts
│   │   │   ├── conflict-resolver.interface.ts
│   │   │   └── pull-config.interface.ts
│   │   └── __tests__/                # Pull Service Tests
│   │       ├── pull-service.spec.ts
│   │       ├── conflict-resolver.spec.ts
│   │       ├── fake-central-api.spec.ts
│   │       ├── pull-strategies.spec.ts
│   │       ├── pull-adapters.spec.ts
│   │       ├── pull-error-rollback.spec.ts
│   │       ├── pull-error-retry.spec.ts
│   │       ├── pull-error-alert.spec.ts
│   │       └── pull-isolation.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── pull-e2e.spec.ts
│   │   ├── multi-tenant-pull.spec.ts
│   │   ├── conflict-resolution.spec.ts
│   │   ├── pull-error-e2e.spec.ts
│   │   └── pull-rollback-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── sync/                             # Sync Library (shared with sync-service)
│   ├── src/
│   │   ├── sync.module.ts
│   │   ├── sync.service.ts
│   │   ├── adapters/                 # Base Sync Adapters
│   │   │   ├── base-sync.adapter.ts
│   │   │   ├── http-sync.adapter.ts
│   │   │   ├── queue-sync.adapter.ts
│   │   │   └── file-sync.adapter.ts
│   │   ├── strategies/               # Base Sync Strategies
│   │   │   ├── base-sync.strategy.ts
│   │   │   ├── incremental.strategy.ts
│   │   │   ├── full.strategy.ts
│   │   │   └── batch.strategy.ts
│   │   ├── resolvers/                # Conflict Resolvers
│   │   │   ├── conflict-resolver.service.ts
│   │   │   ├── timestamp-resolver.ts
│   │   │   ├── version-resolver.ts
│   │   │   └── manual-resolver.ts
│   │   ├── utils/                    # Sync Utilities
│   │   │   ├── sync-utils.ts
│   │   │   ├── conflict-utils.ts
│   │   │   ├── encryption-utils.ts
│   │   │   ├── checksum-utils.ts
│   │   │   └── validation-utils.ts
│   │   ├── interfaces/               # Sync Interfaces
│   │   │   ├── sync.interface.ts
│   │   │   ├── adapter.interface.ts
│   │   │   ├── strategy.interface.ts
│   │   │   └── resolver.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Kiểm thử rollback per tenant

- [ ] [None] Test rollback dữ liệu khi sync lỗi (transactional rollback, partial rollback)
- [ ] [None] Test rollback chỉ ảnh hưởng tenant gặp lỗi, tenant khác không bị revert
- [ ] [None] Test rollback cascading (nếu sync nhiều entity liên quan)
- [ ] [None] Test consistency sau rollback (không để orphan record, dữ liệu không đồng bộ)
- [ ] [None] Test rollback khi lỗi network, DB, conflict, validation, timeout
- [ ] [None] Test rollback khi bị race condition (sync song song cùng entity ở 2 tenant)
- [ ] [None] Test rollback với multi-phase commit (nếu sync tới nhiều DB/system)
- [ ] [None] Test rollback với sự kiện đồng bộ đến external service (VD: upload file, gửi API tới bảo hiểm)
- [ ] [None] Test rollback khi message bị duplicate, rollback không làm hỏng dữ liệu (idempotent)
- [ ] [None] Test rollback khôi phục lại index, view materialized nếu có
- [ ] [None] Test rollback khi đang scale down/up service, deploy/migrate DB, read-only mode, maintenance mode

### Kiểm thử retry per tenant

- [ ] [None] Test retry tự động khi sync lỗi (exponential backoff, capped retry)
- [ ] [None] Test retry chỉ thực hiện cho tenant gặp lỗi, không retry toàn hệ thống
- [ ] [None] Test retry throttling/rate-limit per tenant
- [ ] [None] Test retry cancel khi user huỷ hoặc tenant chuyển trạng thái
- [ ] [None] Test retry routing theo domain/entity
- [ ] [None] Test retryUntil/expirationTime, non-retriable error
- [ ] [None] Test partial replay retry từ thời điểm bất kỳ
- [ ] [None] Test retry loop/burst protection, detect retry recursion
- [ ] [None] Test retry theo từng loại lỗi (error-type aware retry strategy)
- [ ] [None] Test retry failover sang worker khác (nếu có cluster)
- [ ] [None] Test retry dừng khi gặp tín hiệu huỷ (user cancel / timeout vượt ngưỡng)
- [ ] [None] Test retry gây ra lỗi khác và phát hiện retry-loop (A gây B, B gây A)
- [ ] [None] Test retry sau khi dịch vụ restart, có persist retry state không?
- [ ] [None] Test retry không dẫn đến rate-limit bị vượt nếu tenant dùng free tier

### Kiểm thử alert per tenant

- [ ] [None] Test alert riêng biệt khi tenant sync lỗi (email, Slack, dashboard...)
- [ ] [None] Test alert SLA: lỗi chưa xử lý quá thời gian cấu hình
- [ ] [None] Test alert escalation: lỗi lặp lại nhiều lần, lỗi None
- [ ] [None] Test alert chỉ gửi cho admin/manager của tenant gặp lỗi
- [ ] [None] Test alert suppression khi lỗi đã acknowledge hoặc đang retry
- [ ] [None] Test alert khi retry fail, rollback fail, dead-letter
- [ ] [None] Test alert khi DLQ tích tụ vượt ngưỡng theo từng tenant
- [ ] [None] Test alert gộp lỗi cùng loại theo batch, tránh spam alert
- [ ] [None] Test alert khi alert channel không khả dụng (Slack down), log lại, retry gửi alert sau
- [ ] [None] Test alert audit log riêng biệt để trace lịch sử alert của từng tenant
- [ ] [None] Test tenant tự cấu hình alert channel riêng (Slack, Email), giả lập thay đổi để test

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho sync error per tenant (error count, rollback count, retry count, alert count, successAfterRetryCount...)
- [ ] [None] Structured logging (tenantId, syncType, errorType, traceId, rollback, retry, alert, region, cluster, firstErrorTimestamp, lastErrorTimestamp, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho sync error per tenant, dashboard cảnh báo DLQ vượt ngưỡng
- [ ] [None] Thống kê lỗi theo tenant, domain, entity, thời gian, log event emit fail

### Bảo mật & compliance

- [ ] [None] Test rollback/retry không vi phạm RBAC giữa tenant (tenant A không thấy log của B)
- [ ] [None] Test rollback/retry không ghi nhầm log sai tenantId
- [ ] [None] Test dữ liệu rollback không log sensitive field (accessToken, hashed password...)
- [ ] [None] Test phân quyền audit rollback: chỉ audit manager được phép xem

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các case test sync error per tenant, hướng dẫn chạy test
- [ ] [None] Có script seed dữ liệu test sync error cho nhiều tenant
- [ ] [None] Có CI/CD pipeline tự động chạy test isolation sync error per tenant
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi test lỗi sync
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi test dữ liệu thật
- [ ] [None] Có mindmap các loại lỗi phổ biến và retry strategy đề xuất
- [ ] [None] Có JSON schema cho alert payload, rollback log, retry metadata
- [ ] [None] Có tài liệu kịch bản lỗi lớn nhất từng gặp và cách xử lý – training nội bộ
- [ ] [None] Có script xóa tự động hoặc lưu trữ DLQ quá cũ theo tenant
- [ ] [None] Có công cụ test CLI inject lỗi vào sync/pull để kiểm tra toàn hệ thống

## 2. Bổ sung checklist nâng cao

- [ ] [None] Test chaos sync error: mô phỏng lỗi ngẫu nhiên, network partition, DB failover
- [ ] [None] Test alert integration với incident management tool (PagerDuty, Opsgenie...)
- [ ] [None] Test backup/restore dữ liệu sau rollback/retry
- [ ] [None] Test migration schema khi đang rollback/retry
- [ ] [None] Test multi-tenant sync error với 100+ tenant đồng thời
