# Checklist: Xây dựng Conflict Resolver (version/timestamp/hash checksum)

> **Lưu ý quan trọng:**
>
> - Conflict Resolver chịu trách nhiệm phát hiện và giải quyết xung đột dữ liệu khi đồng bộ giữa tenant và Central (hoặc giữa các tenant nếu có liên thông).
> - Phải hỗ trợ nhiều chiến lược: so sánh version, timestamp, hash/checksum, policy tùy chỉnh theo loại dữ liệu.
> - Checklist này chỉ tập trung cho backend (service, đồng bộ, bảo mật, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ core, strategies, dtos, utils, logs, tests.
> - Hỗ trợ plugin-based strategy: dễ mở rộng cho từng loại entity (Patient, Lab, Encounter...).
> - Lưu log conflict vào bảng riêng, hỗ trợ API truy vấn, giải quyết conflict thủ công.
> - Có version history table để trace mọi lần ghi đè.
> - Hỗ trợ rollback record khi detect conflict không hợp lệ.
> - Có dashboard/dev tool để review, resolve conflict.
> - Hook conflict-resolver vào data write pipeline (không chỉ pull/sync) để xử lý ghi đè khi user ghi dữ liệu mới.
> - Cho phép tenant chủ động gọi API resolve conflict (nếu phát hiện inconsistency khi nhập liệu).
> - Cho phép ghi đè tạm thời và gắn tag NEEDS_REVIEW nếu chưa chắc chắn đúng (để conflict-resolver xử lý sau).
> - Tạo bảng thống kê loại conflict nhiều nhất theo loại dữ liệu, thời gian, tenant (heatmap).
> - Cho phép export conflict sample cho training AI/ML auto-resolve sau này.
> - Gợi ý confidence score khi auto-resolve để dev/QA biết mức độ tin cậy.
> - Chiến lược timestamp: so sánh cả updatedAt, deletedAt, createdBy, source.
> - Hash/checksum: tool tạo checksum theo field subset (bỏ qua field volatile).
> - Custom strategy: cho phép DSL nhỏ gọn định nghĩa rule conflict bằng JSON/YAML.
> - Manual resolve: cho phép user ghi chú lý do resolve thủ công.
> - Gắn tag bảo mật cho conflict liên quan PII/PHI, mã hóa dữ liệu conflict nếu sensitive, RBAC chi tiết.
> - Tag conflict theo severity: minor, critical, compliance; auto-resolve minor, critical bắt buộc review, SLA alert.
> - Ghi lại tất cả resolve thủ công để huấn luyện AI/rule engine, attach comment từ reviewer.
> - Tối ưu tổ chức mã nguồn: tách rõ chiến lược domain-specific (shared, patient, medication, encounter...).
> - Flowchart quyết định chiến lược resolve, quy tắc đổi schema ảnh hưởng resolve, so sánh conflict giữa môi trường.
> - Hỗ trợ conflict-aware diff tool (visual diff), CLI export/import conflict logs, simulate conflict cho QA/training.

## Cấu trúc thư mục

```
apps/backend/
├── conflict-resolver/                 # Conflict Resolver Service
│   ├── src/
│   │   ├── conflict-resolver.module.ts
│   │   ├── conflict-resolver.service.ts
│   │   ├── conflict-resolver.controller.ts
│   │   ├── strategies/               # Conflict Resolution Strategies
│   │   │   ├── shared/               # Shared strategies
│   │   │   │   ├── base.strategy.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── strategy-utils.ts
│   │   │   │   │   └── diff-utils.ts
│   │   │   ├── patient/              # Patient-specific strategies
│   │   │   │   ├── timestamp.strategy.ts
│   │   │   │   ├── version.strategy.ts
│   │   │   │   ├── hash.strategy.ts
│   │   │   │   └── custom.strategy.ts
│   │   │   ├── medication/           # Medication-specific strategies
│   │   │   │   ├── version.strategy.ts
│   │   │   │   ├── timestamp.strategy.ts
│   │   │   │   └── custom.strategy.ts
│   │   │   ├── encounter/            # Encounter-specific strategies
│   │   │   │   ├── hash.strategy.ts
│   │   │   │   ├── version.strategy.ts
│   │   │   │   └── custom.strategy.ts
│   │   │   └── lab/                  # Lab-specific strategies
│   │   │       ├── version.strategy.ts
│   │   │       ├── timestamp.strategy.ts
│   │   │       └── custom.strategy.ts
│   │   ├── dtos/                     # Data Transfer Objects
│   │   │   ├── conflict.dto.ts
│   │   │   ├── conflict-resolution.dto.ts
│   │   │   ├── conflict-log.dto.ts
│   │   │   ├── version-history.dto.ts
│   │   │   └── conflict-heatmap.dto.ts
│   │   ├── utils/                    # Conflict Utilities
│   │   │   ├── checksum.ts
│   │   │   ├── diff.ts
│   │   │   ├── versioning.ts
│   │   │   ├── confidence.ts
│   │   │   └── severity.ts
│   │   ├── logs/                     # Conflict Logging
│   │   │   ├── conflict-log.entity.ts
│   │   │   ├── version-history.entity.ts
│   │   │   ├── conflict-heatmap.entity.ts
│   │   │   └── conflict-stats.entity.ts
│   │   ├── api/                      # Conflict API
│   │   │   ├── conflict.controller.ts
│   │   │   ├── conflict-review.controller.ts
│   │   │   ├── conflict-stats.controller.ts
│   │   │   └── conflict-export.controller.ts
│   │   ├── cli/                      # CLI Commands
│   │   │   ├── export-conflict.cli.ts
│   │   │   ├── import-conflict.cli.ts
│   │   │   ├── simulate-conflict.cli.ts
│   │   │   ├── conflict-stats.cli.ts
│   │   │   └── conflict-cleanup.cli.ts
│   │   ├── devtools/                 # Development Tools
│   │   │   ├── visual-diff.ts
│   │   │   ├── conflict-dashboard.ts
│   │   │   ├── conflict-simulator.ts
│   │   │   └── conflict-analyzer.ts
│   │   ├── guards/                   # Conflict Guards
│   │   │   ├── conflict-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/               # Conflict Interfaces
│   │   │   ├── conflict-strategy.interface.ts
│   │   │   ├── conflict-resolver.interface.ts
│   │   │   ├── conflict-log.interface.ts
│   │   │   └── conflict-api.interface.ts
│   │   └── __tests__/                # Conflict Resolver Tests
│   │       ├── conflict-resolver.spec.ts
│   │       ├── version-history.spec.ts
│   │       ├── stress-test.spec.ts
│   │       ├── strategy-tests.spec.ts
│   │       └── api-tests.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── conflict-e2e.spec.ts
│   │   ├── multi-tenant-conflict.spec.ts
│   │   └── conflict-resolution.spec.ts
│   └── package.json
│
libs/backend/
├── conflict/                          # Conflict Library
│   ├── src/
│   │   ├── conflict.module.ts
│   │   ├── conflict.service.ts
│   │   ├── strategies/               # Base Conflict Strategies
│   │   │   ├── base.strategy.ts
│   │   │   ├── timestamp.strategy.ts
│   │   │   ├── version.strategy.ts
│   │   │   ├── hash.strategy.ts
│   │   │   └── custom.strategy.ts
│   │   ├── resolvers/                # Conflict Resolvers
│   │   │   ├── conflict-resolver.service.ts
│   │   │   ├── auto-resolver.ts
│   │   │   ├── manual-resolver.ts
│   │   │   └── batch-resolver.ts
│   │   ├── utils/                    # Conflict Utilities
│   │   │   ├── conflict-utils.ts
│   │   │   ├── checksum-utils.ts
│   │   │   ├── diff-utils.ts
│   │   │   ├── version-utils.ts
│   │   │   └── confidence-utils.ts
│   │   ├── interfaces/               # Conflict Interfaces
│   │   │   ├── conflict.interface.ts
│   │   │   ├── strategy.interface.ts
│   │   │   ├── resolver.interface.ts
│   │   │   └── log.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai Conflict Resolver

- [ ] [None] Thiết kế kiến trúc Conflict Resolver (module, service, strategy, log, API, CLI, devtools)
- [ ] [None] Định nghĩa DTO/schema cho conflict (entity, field, old/new value, version, timestamp, hash, severity, tag, comment, confidenceScore...)
- [ ] [None] Xây dựng các strategy: version, timestamp (updatedAt, deletedAt, createdBy, source), hash/checksum (field subset), custom/policy (DSL JSON/YAML), manual (note)
- [ ] [None] Hỗ trợ plugin-based strategy cho từng entity, tách domain-specific
- [ ] [None] Lưu log conflict vào bảng riêng (conflict_log), version history, heatmap, tag severity, tag NEEDS_REVIEW
- [ ] [None] API truy vấn, review, resolve conflict thủ công (resolve, rollback, accept, attach comment)
- [ ] [None] Cho phép tenant chủ động gọi API resolve conflict khi nhập liệu
- [ ] [None] Cho phép ghi đè tạm thời, tag NEEDS_REVIEW, xử lý sau
- [ ] [None] Hỗ trợ batch resolve conflict, auto-resolve theo rule, confidence score
- [ ] [None] Ghi audit trail mọi lần resolve/rollback conflict, export sample cho AI/ML
- [ ] [None] Tích hợp với SyncService/PullService/data write pipeline để tự động gọi khi sync/pull/ghi mới
- [ ] [None] Dashboard/dev tool để review, resolve conflict, thống kê, visual diff
- [ ] [None] CLI tool export/import/simulate conflict logs giữa môi trường

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi truy vấn/giải quyết conflict (RBAC chi tiết, audit log)
- [ ] [None] Gắn tag bảo mật cho conflict PII/PHI, mã hóa dữ liệu conflict nếu sensitive
- [ ] [None] Audit log mọi thao tác resolve/rollback conflict
- [ ] [None] Cảnh báo khi có conflict nghiêm trọng hoặc lặp lại nhiều lần
- [ ] [None] RBAC: user chỉ thấy conflict tenant mình, superadmin mới rollback toàn hệ thống

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho conflict (số lượng conflict, auto-resolve rate, rollback rate, heatmap...)
- [ ] [None] Alert khi conflict tăng đột biến, rollback nhiều, auto-resolve thất bại, SLA chưa resolve
- [ ] [None] Structured logging (tenantId, entity, conflictType, traceId, severity, tag, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho conflict
- [ ] [None] Thống kê loại conflict nhiều nhất theo loại dữ liệu, thời gian, tenant (heatmap)
- [ ] [None] SLA: conflict chưa resolve trong 24h thì raise alert

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho từng strategy, conflict log, API resolve
- [ ] [None] Test isolation conflict giữa các tenant
- [ ] [None] Test resilience: mô phỏng conflict liên tục, rollback, auto-resolve fail
- [ ] [None] Test performance: đo latency, throughput conflict resolve, stress test 1 triệu conflict
- [ ] [None] Test rollback cascading (rollback Encounter sẽ rollback Observation liên quan)
- [ ] [None] Test consistency sau rollback (không để orphan record)
- [ ] [None] Test rollback record, version history, batch resolve

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các strategy, flow resolve conflict, flowchart quyết định, hướng dẫn tích hợp
- [ ] [None] Có script seed dữ liệu test conflict
- [ ] [None] Có CI/CD pipeline tự động chạy test conflict resolver
- [ ] [None] Tài liệu hóa pipeline build, test, deploy conflict-resolver
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi resolve conflict thật
- [ ] [None] So sánh conflict giữa Dev/UAT/Prod, nhận diện lỗi chỉ xảy ra ở 1 môi trường

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ AI/ML-based conflict suggestion (gợi ý auto-resolve)
- [ ] [None] Hỗ trợ versioning schema conflict
- [ ] [None] Hỗ trợ event sourcing cho conflict log
- [ ] [None] Test backup/restore conflict log, version history
- [ ] [None] Test migration schema conflict giữa các version
- [ ] [None] Hỗ trợ conflict-aware diff tool (visual diff: HTML/Markdown frontend)
- [ ] [None] Xây dựng CLI tool export/import/simulate conflict logs giữa môi trường
