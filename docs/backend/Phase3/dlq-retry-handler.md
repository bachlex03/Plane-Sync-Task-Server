# Checklist: Thiết lập DLQ / Retry Handler (đẩy lỗi vào dead-letter, xử lý retry tự động)

> **Lưu ý quan trọng:**
>
> - DLQ (Dead Letter Queue) / Retry Handler chịu trách nhiệm phát hiện, lưu trữ, và xử lý lại các message/job/event bị lỗi khi sync, pull, event bus, background jobs.
> - Hỗ trợ nhiều chiến lược retry: exponential backoff, capped retry, manual retry, scheduled retry, dead-letter routing, retryUntil/expirationTime, throttling/rate-limit, dynamic delay theo lỗi, cancel future retry, routing theo domain.
> - Checklist này chỉ tập trung cho backend (service, đồng bộ, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ core, strategies, utils, logs, api, cli, tests.
> - Hỗ trợ plugin-based strategy: dễ mở rộng cho từng loại job/event/domain, pluggable policy (DSL/JSON).
> - Lưu log retry, dead-letter vào bảng riêng, hỗ trợ API truy vấn, xử lý lại thủ công, partial replay, mark non-retriable, detect retry loop, suppress burst retry.
> - Có dashboard/dev tool để review, retry, xóa, export dead-letter, snapshot trạng thái, replay sandbox.
> - Hỗ trợ alert khi DLQ tăng đột biến, retry fail nhiều lần, SLA chưa xử lý, retry success rate.
> - Hỗ trợ compliance: audit log, traceId, tenantId, retry reason, retry actor, mask sensitive data, RBAC granular log, encryption.
> - DLQ tích hợp audit log/event bus, fallback executor, API callback, npm package, env var, Helm chart/Dockerfile.
> - Checklist QA/DEV/SRE, schema validation script, forward/backward compatibility.

## Cấu trúc thư mục

```
apps/backend/
├── dlq-retry-service/                 # DLQ Retry Service
│   ├── src/
│   │   ├── dlq-retry.module.ts
│   │   ├── dlq-retry.service.ts
│   │   ├── dlq-retry.controller.ts
│   │   ├── strategies/                # Retry Strategies
│   │   │   ├── exponential-backoff.strategy.ts
│   │   │   ├── capped-retry.strategy.ts
│   │   │   ├── scheduled-retry.strategy.ts
│   │   │   ├── manual-retry.strategy.ts
│   │   │   ├── dynamic-delay.strategy.ts
│   │   │   ├── domain-routing.strategy.ts
│   │   │   ├── throttling.strategy.ts
│   │   │   └── chaos-test.strategy.ts
│   │   ├── utils/                     # DLQ Retry Utilities
│   │   │   ├── retry-queue.ts
│   │   │   ├── dead-letter-queue.ts
│   │   │   ├── retry-context.ts
│   │   │   ├── snapshot.ts
│   │   │   ├── chaos-test.ts
│   │   │   └── burst-protection.ts
│   │   ├── logs/                      # DLQ Retry Logging
│   │   │   ├── retry-log.entity.ts
│   │   │   ├── dead-letter-log.entity.ts
│   │   │   ├── retry-snapshot.entity.ts
│   │   │   └── retry-stats.entity.ts
│   │   ├── api/                       # DLQ Retry API
│   │   │   ├── dlq.controller.ts
│   │   │   ├── retry.controller.ts
│   │   │   ├── dlq-stats.controller.ts
│   │   │   └── dlq-export.controller.ts
│   │   ├── cli/                       # CLI Commands
│   │   │   ├── retry.cli.ts
│   │   │   ├── export-dlq.cli.ts
│   │   │   ├── validate-schema.cli.ts
│   │   │   ├── simulate-error.cli.ts
│   │   │   └── dlq-cleanup.cli.ts
│   │   ├── devtools/                  # Development Tools
│   │   │   ├── dlq-dashboard.ts
│   │   │   ├── sandbox-replay.ts
│   │   │   ├── dlq-analyzer.ts
│   │   │   └── chaos-simulator.ts
│   │   ├── guards/                    # DLQ Retry Guards
│   │   │   ├── dlq-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/                # DLQ Retry Interfaces
│   │   │   ├── dlq-retry.interface.ts
│   │   │   ├── retry-strategy.interface.ts
│   │   │   ├── dead-letter.interface.ts
│   │   │   └── retry-log.interface.ts
│   │   └── __tests__/                 # DLQ Retry Tests
│   │       ├── dlq-retry.spec.ts
│   │       ├── retry-queue.spec.ts
│   │       ├── dead-letter-queue.spec.ts
│   │       ├── chaos.spec.ts
│   │       └── strategy-tests.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── dlq-e2e.spec.ts
│   │   ├── multi-tenant-dlq.spec.ts
│   │   └── retry-resolution.spec.ts
│   └── package.json
│
libs/backend/
├── dlq-retry/                         # DLQ Retry Library
│   ├── src/
│   │   ├── dlq-retry.module.ts
│   │   ├── dlq-retry.service.ts
│   │   ├── strategies/                # Base Retry Strategies
│   │   │   ├── base-retry.strategy.ts
│   │   │   ├── exponential-backoff.strategy.ts
│   │   │   ├── capped-retry.strategy.ts
│   │   │   ├── scheduled-retry.strategy.ts
│   │   │   ├── manual-retry.strategy.ts
│   │   │   ├── dynamic-delay.strategy.ts
│   │   │   ├── domain-routing.strategy.ts
│   │   │   └── throttling.strategy.ts
│   │   ├── queues/                    # Queue Management
│   │   │   ├── retry-queue.service.ts
│   │   │   ├── dead-letter-queue.service.ts
│   │   │   ├── retry-context.service.ts
│   │   │   └── snapshot.service.ts
│   │   ├── utils/                     # DLQ Retry Utilities
│   │   │   ├── dlq-retry-utils.ts
│   │   │   ├── retry-queue-utils.ts
│   │   │   ├── dead-letter-utils.ts
│   │   │   ├── snapshot-utils.ts
│   │   │   └── chaos-utils.ts
│   │   ├── interfaces/                # DLQ Retry Interfaces
│   │   │   ├── dlq-retry.interface.ts
│   │   │   ├── retry-strategy.interface.ts
│   │   │   ├── dead-letter.interface.ts
│   │   │   └── retry-log.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai DLQ / Retry Handler

- [ ] [None] Thiết kế kiến trúc DLQ / Retry Handler (module, service, strategy, log, API, CLI, devtools)
- [ ] [None] Định nghĩa DTO/schema cho retry/dead-letter (jobId, eventId, payload, error, retryCount, nextRetryAt, status, traceId, tenantId, reason, actor, retryUntil, expirationTime, snapshot, severity, nonRetriable, callbackUrl...)
- [ ] [None] Xây dựng các strategy: exponential backoff, capped retry, scheduled/manual retry, dead-letter routing, retryUntil/expirationTime, throttling/rate-limit, dynamic delay theo lỗi, cancel future retry, routing theo domain
- [ ] [None] Hỗ trợ plugin-based strategy cho từng loại job/event/domain, pluggable policy (DSL/JSON)
- [ ] [None] Lưu log retry, dead-letter vào bảng riêng (retry_log, dead_letter_log), snapshot trạng thái, mark non-retriable, partial replay
- [ ] [None] API truy vấn, review, retry/xóa/export dead-letter thủ công, partial replay, cancel future retry
- [ ] [None] Hỗ trợ batch retry, scheduled retry, manual retry, fallback executor
- [ ] [None] Ghi audit trail mọi lần retry, dead-letter, xóa, export, API callback
- [ ] [None] Tích hợp với SyncService, PullService, EventBus, background jobs, file upload, audit log, event bus notify, API callback
- [ ] [None] Dashboard/dev tool để review, retry, xóa, export dead-letter, thống kê, snapshot trạng thái, sandbox replay
- [ ] [None] Hỗ trợ alert khi DLQ tăng đột biến, retry fail nhiều lần, SLA chưa xử lý, retry success rate
- [ ] [None] Hỗ trợ compliance: audit log, traceId, tenantId, retry reason, retry actor, mask sensitive data, RBAC granular log, encryption
- [ ] [None] Mask sensitive data trong dead-letter payload khi log/export, chia access log metadata vs payload
- [ ] [None] Tích hợp với encryption module nếu lưu DLQ chứa thông tin nhạy cảm
- [ ] [None] Tách thư viện DLQ thành npm package nội bộ, khai báo env var, Helm chart/Dockerfile chuẩn
- [ ] [None] Script validate DLQ schema giữa các version: forward + backward compatibility

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi truy vấn/xử lý DLQ/retry (RBAC, audit log, granular log)
- [ ] [None] Audit log mọi thao tác retry, dead-letter, xóa, export
- [ ] [None] Cảnh báo khi có retry/dead-letter nghiêm trọng hoặc lặp lại nhiều lần
- [ ] [None] RBAC: user chỉ thấy DLQ/retry của tenant mình, superadmin mới retry/xóa toàn hệ thống

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho retry/DLQ (retry count, fail count, DLQ size, latency, error type, retry success rate...)
- [ ] [None] Alert khi retry/DLQ tăng đột biến, fail nhiều, latency cao, SLA chưa xử lý
- [ ] [None] Structured logging (tenantId, jobId, eventId, retryCount, traceId, error, severity, nonRetriable, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho retry/DLQ
- [ ] [None] Thống kê loại lỗi nhiều nhất, retry reason, dead-letter reason, burst retry spam protection
- [ ] [None] SLA: retry/dead-letter chưa xử lý trong 24h thì raise alert
- [ ] [None] Log số lần sử dụng retry/DLQ theo ngày, monitor burst retry, detect retry loop/recursion

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho từng strategy, retry queue, dead-letter queue, API retry, chaos test
- [ ] [None] Test isolation retry/DLQ giữa các tenant
- [ ] [None] Test resilience: mô phỏng lỗi liên tục, retry fail, dead-letter fail, chaos retry
- [ ] [None] Test performance: đo throughput, latency retry/DLQ, stress test 1 triệu job lỗi
- [ ] [None] Test rollback/cancel retry, batch retry, scheduled retry, partial replay
- [ ] [None] Test consistency sau retry/dead-letter (không để orphan job/event)
- [ ] [None] Test auto suppress retry khi burst retry liên tục
- [ ] [None] Test replay retry từ thời điểm bất kỳ (partial replay)
- [ ] [None] Test cancel future retry khi job bị huỷ/thay đổi trạng thái
- [ ] [None] Test sandbox replay, snapshot trạng thái trước/sau retry

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các strategy, flow retry/DLQ, hướng dẫn tích hợp, checklist QA/DEV/SRE
- [ ] [None] Có script seed dữ liệu test retry/DLQ
- [ ] [None] Có CI/CD pipeline tự động chạy test retry/DLQ
- [ ] [None] Tài liệu hóa pipeline build, test, deploy dlq-retry-handler
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi retry/dead-letter thật
- [ ] [None] Tạo Helm chart/Dockerfile chuẩn kèm cấu hình DLQ riêng nếu chạy riêng service

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ retry idempotency, deduplication
- [ ] [None] Hỗ trợ AI/ML-based retry suggestion (gợi ý retry tối ưu)
- [ ] [None] Hỗ trợ event sourcing cho retry/dead-letter log
- [ ] [None] Test backup/restore retry/dead-letter log
- [ ] [None] Test migration schema retry/DLQ giữa các version
- [ ] [None] Hỗ trợ simulate error để demo QA hoặc training
- [ ] [None] Hỗ trợ CLI tool export/import/simulate retry/dead-letter logs
