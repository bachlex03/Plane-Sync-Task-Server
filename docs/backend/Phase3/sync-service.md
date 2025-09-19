# Checklist: Triển khai SyncService (Push data từ tenant lên Central)

> **Lưu ý quan trọng:**
>
> - SyncService chịu trách nhiệm đồng bộ dữ liệu từ từng tenant (database riêng) lên Central (metadata, bản sao dữ liệu, phục vụ phân tích, backup, liên thông).
> - Phải đảm bảo isolation dữ liệu từng tenant, không rò rỉ sang tenant khác.
> - Hỗ trợ incremental sync, conflict resolution, retry, audit trail, bảo mật truyền tải (TLS, encryption).
> - Checklist này chỉ tập trung cho backend (service, đồng bộ, bảo mật, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ jobs, strategies, dtos, events, utils, guards.
> - Thiết kế sync.adapter hoặc sync.provider để mở rộng cho nhiều loại dữ liệu (Patient, Encounter, Lab, Imaging...).
> - Thêm sync-config.service.ts: cấu hình mức độ sync từng tenant (on/off, interval, loại dữ liệu...).
> - Tích hợp tenant database resolver (TenantContext, RequestScoped Provider, Dynamic Module), connection pool giới hạn.
> - Validate, normalize, mapping dữ liệu trước khi sync; mapping entity giữa tenant và Central nếu không đồng nhất.
> - Cấu hình conflict policy (prefer-newer, prefer-central, manual-review), lưu conflict log, API giải quyết conflict thủ công.
> - Sync dependency graph: sync theo thứ tự phụ thuộc giữa các entity.
> - CLI/tool: lệnh sync:full, sync:tenant, sync:status, sync:retry; dashboard trạng thái sync, queue, lỗi.
> - Metadata/versioning: mỗi bản ghi sync có syncVersion, sourceUpdatedAt, syncedAt, checksum, schemaVersion.
> - Yêu cầu nghiệp vụ EMR: mapping HL7/FHIR, lưu sync_log phục vụ kiểm toán, cảnh báo thiếu mã BHYT, ICD-10, viện phí.
> - Kết nối hệ thống liên thông ngoài: endpoint publish, mapping HL7/FHIR/XML, webhook push data real-time.
> - Hỗ trợ bidirectional sync (kéo data từ Central về tenant, API Central cung cấp dữ liệu cho tenant mới).
> - Test automation: fake sync Central API, mô phỏng 100 tenant đồng thời, data-faker sinh dữ liệu test.
> - Cloud/infra: horizontal scale worker, autoscale pod, read replica Central DB.
> - Tài liệu & audit compliance: log ai push, thời điểm, dữ liệu, trạng thái; tài liệu pipeline build/test/deploy; checklist security review.

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
│   │       └── sync-adapters.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── sync-e2e.spec.ts
│   │   ├── multi-tenant-sync.spec.ts
│   │   └── conflict-resolution.spec.ts
│   └── package.json
│
libs/backend/
├── sync/                             # Sync Library
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

### Triển khai SyncService

- [ ] [None] Thiết kế kiến trúc SyncService (module, service, job, strategy, adapter, config, guard)
- [ ] [None] Xây dựng API/endpoint nhận dữ liệu push từ tenant lên central
- [ ] [None] Hỗ trợ incremental sync (chỉ gửi dữ liệu thay đổi), full sync (đồng bộ toàn bộ)
- [ ] [None] Định nghĩa DTO, schema cho dữ liệu sync (metadata, version, checksum...)
- [ ] [None] Tích hợp job scheduler (cron, queue) để tự động sync định kỳ hoặc theo sự kiện
- [ ] [None] Hỗ trợ retry, DLQ cho sync job lỗi
- [ ] [None] Hỗ trợ conflict resolution (timestamp, version, hash...), policy (prefer-newer, prefer-central, manual-review)
- [ ] [None] Lưu conflict log vào bảng riêng, API truy vấn/giải quyết conflict thủ công
- [ ] [None] Ghi audit trail mọi lần sync (ai, khi nào, dữ liệu gì, kết quả)
- [ ] [None] Hỗ trợ encryption dữ liệu khi truyền tải (TLS, AES...)
- [ ] [None] Đảm bảo isolation: mỗi tenant chỉ sync dữ liệu của mình, tenant db resolver, connection pool giới hạn
- [ ] [None] Hỗ trợ event publish (sync started, completed, failed)
- [ ] [None] Hỗ trợ monitoring health, trạng thái sync từng tenant
- [ ] [None] Validate dữ liệu trước khi sync: schema, required fields, reference integrity
- [ ] [None] Normalize/mapping dữ liệu lên Central, mapping entity nếu không đồng nhất
- [ ] [None] Sync dependency graph: sync đúng thứ tự entity phụ thuộc
- [ ] [None] Metadata/versioning: syncVersion, sourceUpdatedAt, syncedAt, checksum, schemaVersion
- [ ] [None] Mapping HL7/FHIR nếu cần, lưu sync_log phục vụ kiểm toán, cảnh báo thiếu mã BHYT, ICD-10, viện phí
- [ ] [None] Endpoint publish dữ liệu đã sync ra hệ thống ngoài, mapping HL7/FHIR/XML, webhook push data real-time
- [ ] [None] Hỗ trợ bidirectional sync (kéo data từ Central về tenant, API Central cung cấp dữ liệu cho tenant mới)

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi push data (JWT, API key, mutual TLS), guard validate
- [ ] [None] Kiểm tra context tenant ở mọi request sync
- [ ] [None] Audit log mọi thao tác push data, log ai push, thời điểm, dữ liệu, trạng thái
- [ ] [None] Cảnh báo khi có truy cập bất thường, sync cross-tenant
- [ ] [None] Hỗ trợ encrypt payload khi truyền tải

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho sync (latency, error rate, throughput, queue depth...), counter/gauge
- [ ] [None] Alert khi sync fail, latency cao, retry nhiều lần
- [ ] [None] Structured logging (tenantId, syncType, traceId, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho sync

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho sync job, conflict resolver, fake central API
- [ ] [None] Test isolation dữ liệu giữa các tenant
- [ ] [None] Test resilience: mô phỏng central down, network fail, retry, DLQ
- [ ] [None] Test concurrent sync nhiều tenant (100+), seed script, data-faker
- [ ] [None] Test rollback khi sync fail
- [ ] [None] Test performance: đo throughput, latency sync
- [ ] [None] Test soft/hard delete, restore, rollback đúng
- [ ] [None] Test backup/restore dữ liệu sync từng tenant
- [ ] [None] Test migration schema sync giữa các version

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa API/flow sync, hướng dẫn tích hợp
- [ ] [None] Có script seed dữ liệu test cho sync
- [ ] [None] Có CI/CD pipeline tự động chạy test sync
- [ ] [None] Tài liệu hóa pipeline build, test, deploy sync-service
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi sync dữ liệu thật

### CLI & Tool

- [ ] [None] Tạo CLI: sync:full, sync:tenant --id=xxx, sync:status, sync:retry
- [ ] [None] Tạo dashboard Dev/kỹ thuật viên xem trạng thái sync, queue, lỗi

## 2. Bổ sung checklist nâng cao

- [ ] [Low] Hỗ trợ canary release, blue/green deployment cho sync job
- [ ] [None] Hỗ trợ versioning schema sync
- [ ] [Low] Hỗ trợ event sourcing cho sync log
- [ ] [None] Test backup/restore dữ liệu sync từng tenant
- [ ] [None] Test migration schema sync giữa các version
