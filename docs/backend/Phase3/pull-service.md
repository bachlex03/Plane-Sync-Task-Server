# Checklist: Triển khai PullService (Kéo dữ liệu mới từ Central về tenant)

> **Lưu ý quan trọng:**
>
> - PullService chịu trách nhiệm đồng bộ dữ liệu mới/đã thay đổi từ Central về từng tenant (database riêng), phục vụ cập nhật, liên thông, khôi phục dữ liệu, hoặc onboarding tenant mới.
> - Phải đảm bảo isolation dữ liệu từng tenant, không rò rỉ sang tenant khác.
> - Hỗ trợ incremental pull, conflict resolution, retry, audit trail, bảo mật truyền tải (TLS, encryption).
> - Checklist này chỉ tập trung cho backend (service, đồng bộ, bảo mật, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ jobs, strategies, dtos, events, utils, guards, adapters, config, cli.
> - Thiết kế pull.adapter hoặc pull.provider để mở rộng cho nhiều loại dữ liệu (Patient, Encounter, Lab, Imaging...).
> - Thêm pull-config.service.ts: cấu hình mức độ pull từng tenant (on/off, interval, loại dữ liệu...).
> - Tích hợp tenant database resolver, connection pool giới hạn.
> - Validate, normalize, mapping dữ liệu trước khi ghi vào tenant; mapping entity giữa Central và tenant nếu không đồng nhất.
> - Cấu hình conflict policy, lưu conflict log, API giải quyết conflict thủ công.
> - Pull dependency graph: pull đúng thứ tự entity phụ thuộc, hỗ trợ pull song song các entity độc lập, tuần tự các entity phụ thuộc.
> - Hỗ trợ batch size, dynamic throttle/throttling pull theo load thực tế hoặc giới hạn tài nguyên.
> - Cấu hình động: cho phép cấu hình pull theo facility, department, location; feature flag/toggle tắt/bật từng loại dữ liệu.
> - Bảo mật mở rộng: ký dữ liệu (data signature), xác thực token chuỗi từ Central, rate-limit API pull từ Central.
> - Conflict resolution nâng cao: version history table, policy theo loại dữ liệu, rollback record khi detect conflict.
> - CLI/tool: lệnh pull:full, pull:tenant --id=xxx, pull:status, pull:retry; dashboard trạng thái pull, queue, lỗi, xóa cache pull/local.
> - Metadata/versioning: mỗi bản ghi pull có pullVersion, sourceUpdatedAt, pulledAt, checksum, schemaVersion.
> - Yêu cầu nghiệp vụ EMR: mapping HL7/FHIR, lưu pull_log phục vụ kiểm toán, cảnh báo thiếu mã BHYT, ICD-10, viện phí.
> - Kết nối hệ thống liên thông ngoài: endpoint nhận dữ liệu, mapping HL7/FHIR/XML, webhook nhận data real-time.
> - Hỗ trợ bidirectional sync (kéo data từ Central về tenant, API Central cung cấp dữ liệu cho tenant mới).
> - Test automation: fake Central API, mô phỏng 100/500 tenant đồng thời, data-faker sinh dữ liệu test, test unicode, multi-thread pull.
> - Cloud/infra: horizontal scale worker, autoscale pod, read replica Central DB.
> - Tài liệu & audit compliance: log ai pull, thời điểm, dữ liệu, trạng thái; tài liệu pipeline build/test/deploy; checklist security review.
> - Plugin-based adapter: adapters/core/base-pull.adapter.ts, adapters/[entity]/[entity]-pull.adapter.ts, mapping, validator.
> - Checklist Central: expose changelog API, filter time window/tenantId, push webhook khi thay đổi, health-check tenant, từ chối pull khi bảo trì, định nghĩa dữ liệu master.

## Cấu trúc thư mục

```
apps/backend/
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
│   │       └── pull-adapters.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── pull-e2e.spec.ts
│   │   ├── multi-tenant-pull.spec.ts
│   │   └── conflict-resolution.spec.ts
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

### Triển khai PullService

- [ ] [None] Thiết kế kiến trúc PullService (module, service, job, strategy, adapter, config, guard)
- [ ] [None] Xây dựng API/endpoint nhận yêu cầu pull hoặc chủ động pull từ Central
- [ ] [None] Hỗ trợ incremental pull (chỉ lấy dữ liệu mới/thay đổi), full pull (đồng bộ toàn bộ)
- [ ] [None] Định nghĩa DTO, schema cho dữ liệu pull (metadata, version, checksum...)
- [ ] [None] Tích hợp job scheduler (cron, queue) để tự động pull định kỳ hoặc theo sự kiện
- [ ] [None] Hỗ trợ pull song song các entity độc lập, tuần tự các entity phụ thuộc (dựa vào pull dependency graph)
- [ ] [None] Hỗ trợ batch size, dynamic throttle/throttling pull theo load thực tế hoặc giới hạn tài nguyên
- [ ] [None] Hỗ trợ retry, DLQ cho pull job lỗi
- [ ] [None] Hỗ trợ conflict resolution (timestamp, version, hash...), policy (prefer-newer, prefer-central, manual-review)
- [ ] [None] Lưu conflict log vào bảng riêng, API truy vấn/giải quyết conflict thủ công
- [ ] [None] Ghi version history table cho mọi record bị ghi đè
- [ ] [None] Cho phép rollback record khi detect conflict không hợp lệ
- [ ] [None] Policy conflict tùy chỉnh theo loại dữ liệu (timestamp, checksum...)
- [ ] [None] Ghi audit trail mọi lần pull (ai, khi nào, dữ liệu gì, kết quả)
- [ ] [None] Hỗ trợ encryption dữ liệu khi truyền tải (TLS, AES...)
- [ ] [None] Đảm bảo isolation: mỗi tenant chỉ pull dữ liệu của mình, tenant db resolver, connection pool giới hạn
- [ ] [None] Hỗ trợ event publish (pull started, completed, failed)
- [ ] [None] Hỗ trợ monitoring health, trạng thái pull từng tenant
- [ ] [None] Validate dữ liệu trước khi ghi vào tenant: schema, required fields, reference integrity
- [ ] [None] Normalize/mapping dữ liệu từ Central về tenant, mapping entity nếu không đồng nhất
- [ ] [None] Pull dependency graph: pull đúng thứ tự entity phụ thuộc
- [ ] [None] Metadata/versioning: pullVersion, sourceUpdatedAt, pulledAt, checksum, schemaVersion
- [ ] [None] Mapping HL7/FHIR nếu cần, lưu pull_log phục vụ kiểm toán, cảnh báo thiếu mã BHYT, ICD-10, viện phí
- [ ] [None] Endpoint nhận dữ liệu đã pull từ hệ thống ngoài, mapping HL7/FHIR/XML, webhook nhận data real-time
- [ ] [None] Hỗ trợ bidirectional sync (kéo data từ Central về tenant, API Central cung cấp dữ liệu cho tenant mới)
- [ ] [None] Cấu hình động: pull theo facility, department, location; feature flag/toggle tắt/bật từng loại dữ liệu

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi pull data (JWT, API key, mutual TLS), guard validate
- [ ] [None] Ký dữ liệu (data signature) để chống giả mạo khi truyền tải
- [ ] [None] Hỗ trợ xác thực token chuỗi từ Central khi Central push ngược data
- [ ] [None] Rate-limit API pull từ Central để chống abuse hoặc bị đánh spam
- [ ] [None] Kiểm tra context tenant ở mọi request pull
- [ ] [None] Audit log mọi thao tác pull data, log ai pull, thời điểm, dữ liệu, trạng thái
- [ ] [None] Cảnh báo khi có truy cập bất thường, pull cross-tenant
- [ ] [None] Hỗ trợ encrypt payload khi truyền tải

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho pull (latency, error rate, throughput, queue depth...), counter/gauge
- [ ] [None] Metric số bản ghi pull/giây theo từng adapter
- [ ] [None] Metrics retry rate, failure trend theo loại lỗi (network, schema mismatch, timeout…)
- [ ] [None] Metric thời gian xử lý từng batch pull
- [ ] [None] Metrics memory usage, pool connection usage
- [ ] [None] Alert khi pull fail, latency cao, retry nhiều lần
- [ ] [None] Structured logging (tenantId, pullType, traceId, correlationId, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho pull
- [ ] [None] Cảnh báo proactive khi một tenant không pull được dữ liệu quá thời gian cấu hình

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho pull job, conflict resolver, fake central API
- [ ] [None] Test isolation dữ liệu giữa các tenant
- [ ] [None] Test resilience: mô phỏng central down, network fail, retry, DLQ
- [ ] [None] Test concurrent pull nhiều tenant (100+/500+), seed script, data-faker, multi-thread pull
- [ ] [None] Test rollback khi pull fail
- [ ] [None] Test performance: đo throughput, latency pull, batch size
- [ ] [None] Test soft/hard delete, restore, rollback đúng
- [ ] [None] Test backup/restore dữ liệu pull từng tenant
- [ ] [None] Test migration schema pull giữa các version
- [ ] [None] Test live migration khi schema Central thay đổi (thêm field, đổi type…)
- [ ] [None] Test pull non-UTF8 data, ký tự Unicode, tên bệnh nhân tiếng Việt, emoji…
- [ ] [None] Test multi-thread pull với cùng một loại dữ liệu nhưng khác tenant
- [ ] [None] Load-test concurrent 500+ tenant cùng pull cùng lúc

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa API/flow pull, hướng dẫn tích hợp
- [ ] [None] Có script seed dữ liệu test cho pull
- [ ] [None] Có CI/CD pipeline tự động chạy test pull
- [ ] [None] Tài liệu hóa pipeline build, test, deploy pull-service
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi pull dữ liệu thật
- [ ] [None] Tích hợp log traceId và correlationId để trace toàn bộ luồng pull
- [ ] [None] Có công cụ xóa toàn bộ cache pull/local nếu gặp lỗi nặng

### CLI & Tool

- [ ] [None] Tạo CLI: pull:full, pull:tenant --id=xxx, pull:status, pull:retry
- [ ] [None] Tạo dashboard Dev/kỹ thuật viên xem trạng thái pull từng tenant (hiển thị: đang chờ, đang chạy, lỗi, thành công, latency)

### Plugin-based Adapter

- [ ] [None] Chuẩn hóa adapters/core/base-pull.adapter.ts, adapters/[entity]/[entity]-pull.adapter.ts, mapping, validator

### Checklist Central

- [ ] [None] Expose changelog API cho incremental pull
- [ ] [None] Hỗ trợ filter theo time window, tenantId
- [ ] [None] Push real-time webhook khi có thay đổi quan trọng
- [ ] [None] Có health-check định kỳ để Central biết tenant đang hoạt động
- [ ] [None] Có cơ chế từ chối pull nếu hệ thống tenant đang bảo trì
- [ ] [None] Định nghĩa “dữ liệu master” mà tenant không được ghi đè (ví dụ: user, config)

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ canary release, blue/green deployment cho pull job
- [ ] [None] Hỗ trợ versioning schema pull
- [ ] [None] Hỗ trợ event sourcing cho pull log
- [ ] [None] Test backup/restore dữ liệu pull từng tenant
- [ ] [None] Test migration schema pull giữa các version
