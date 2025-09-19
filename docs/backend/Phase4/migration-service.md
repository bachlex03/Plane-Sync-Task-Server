# Checklist: Xây dựng Migration Service (tạo schema DB riêng, version hóa, rollback)

> **Lưu ý quan trọng:**
>
> - Migration Service chịu trách nhiệm tạo, quản lý, version hóa schema DB riêng cho từng tenant, hỗ trợ rollback, upgrade, multi-tenant isolation.
> - Hỗ trợ nhiều DB engine (PostgreSQL, MySQL, ...), multi-schema, multi-database, versioning, rollback, audit trail.
> - Checklist này chỉ tập trung cho backend (service, migration, versioning, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ core, strategies, scripts, logs, api, cli, tests.
> - Hỗ trợ plugin-based migration: dễ mở rộng cho từng domain/module, plugin lifecycle, migration hook, override strategy, precedence.
> - Lưu log migration, version history, rollback, audit trail vào bảng riêng, log IP/device/user agent, migration reason, trace script error.
> - Có dashboard/dev tool để review, trigger migration, rollback, export log, compare schema, demo script, video hướng dẫn, checklist DevOps.
> - Hỗ trợ alert khi migration fail, rollback, version mismatch, SLA chưa xử lý, destructive rollback warning, data loss risk.
> - Hỗ trợ compliance: audit log, traceId, tenantId, migration reason, migration actor, schema compatibility check.
> - Hỗ trợ zero-downtime migration, parallel migration, migration-as-a-service.

## Cấu trúc thư mục

```
apps/backend/
├── migration-service/                  # Migration Service
│   ├── src/
│   │   ├── migration.module.ts
│   │   ├── migration.service.ts
│   │   ├── migration.controller.ts
│   │   ├── strategies/                # Migration Strategies
│   │   │   ├── versioned-migration.strategy.ts
│   │   │   ├── rollback.strategy.ts
│   │   │   ├── multi-tenant.strategy.ts
│   │   │   ├── plugin-migration.strategy.ts
│   │   │   ├── zero-downtime.strategy.ts
│   │   │   ├── parallel-migration.strategy.ts
│   │   │   └── canary-migration.strategy.ts
│   │   ├── scripts/                   # Migration Scripts
│   │   │   ├── 001-init-schema.sql
│   │   │   ├── 002-add-column-x.sql
│   │   │   ├── 002-add-column-x.down.sql
│   │   │   ├── 003-add-index-y.sql
│   │   │   ├── 003-add-index-y.down.sql
│   │   │   ├── 004-modify-table-z.sql
│   │   │   ├── 004-modify-table-z.down.sql
│   │   │   └── ...
│   │   ├── logs/                      # Migration Logging
│   │   │   ├── migration-log.entity.ts
│   │   │   ├── version-history.entity.ts
│   │   │   ├── rollback-log.entity.ts
│   │   │   ├── migration-snapshot.entity.ts
│   │   │   ├── migration-error.entity.ts
│   │   │   └── migration-stats.entity.ts
│   │   ├── api/                       # Migration API
│   │   │   ├── migration.controller.ts
│   │   │   ├── migration-status.controller.ts
│   │   │   ├── migration-rollback.controller.ts
│   │   │   └── migration-export.controller.ts
│   │   ├── cli/                       # CLI Commands
│   │   │   ├── migrate.cli.ts
│   │   │   ├── rollback.cli.ts
│   │   │   ├── status.cli.ts
│   │   │   ├── compare-schema.cli.ts
│   │   │   ├── import-export-log.cli.ts
│   │   │   ├── validate.cli.ts
│   │   │   └── dry-run.cli.ts
│   │   ├── devtools/                  # Development Tools
│   │   │   ├── migration-dashboard.ts
│   │   │   ├── demo-script/
│   │   │   │   ├── demo-migration.ts
│   │   │   │   ├── demo-rollback.ts
│   │   │   │   └── demo-schema-compare.ts
│   │   │   ├── video-guide.md
│   │   │   ├── checklist-devops.md
│   │   │   └── migration-analyzer.ts
│   │   ├── plugins/                   # Migration Plugins
│   │   │   ├── base-plugin.ts
│   │   │   ├── patient-plugin.ts
│   │   │   ├── encounter-plugin.ts
│   │   │   ├── lab-plugin.ts
│   │   │   └── user-plugin.ts
│   │   ├── guards/                    # Migration Guards
│   │   │   ├── migration-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/                # Migration Interfaces
│   │   │   ├── migration.interface.ts
│   │   │   ├── migration-strategy.interface.ts
│   │   │   ├── migration-plugin.interface.ts
│   │   │   └── migration-log.interface.ts
│   │   └── __tests__/                 # Migration Tests
│   │       ├── migration-service.spec.ts
│   │       ├── rollback.spec.ts
│   │       ├── versioning.spec.ts
│   │       ├── conflict-migration.spec.ts
│   │       ├── dry-run.spec.ts
│   │       ├── parallel-migration.spec.ts
│   │       ├── zero-downtime.spec.ts
│   │       └── plugin-tests.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── migration-e2e.spec.ts
│   │   ├── multi-tenant-migration.spec.ts
│   │   ├── rollback-e2e.spec.ts
│   │   └── plugin-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── migration/                          # Migration Library
│   ├── src/
│   │   ├── migration.module.ts
│   │   ├── migration.service.ts
│   │   ├── strategies/                # Base Migration Strategies
│   │   │   ├── base-migration.strategy.ts
│   │   │   ├── versioned-migration.strategy.ts
│   │   │   ├── rollback.strategy.ts
│   │   │   ├── multi-tenant.strategy.ts
│   │   │   ├── plugin-migration.strategy.ts
│   │   │   ├── zero-downtime.strategy.ts
│   │   │   └── parallel-migration.strategy.ts
│   │   ├── plugins/                   # Base Migration Plugins
│   │   │   ├── base-plugin.ts
│   │   │   ├── plugin-manager.ts
│   │   │   ├── plugin-lifecycle.ts
│   │   │   └── plugin-registry.ts
│   │   ├── scripts/                   # Base Migration Scripts
│   │   │   ├── script-manager.ts
│   │   │   ├── script-validator.ts
│   │   │   ├── script-executor.ts
│   │   │   └── script-generator.ts
│   │   ├── utils/                     # Migration Utilities
│   │   │   ├── migration-utils.ts
│   │   │   ├── version-utils.ts
│   │   │   ├── rollback-utils.ts
│   │   │   ├── schema-utils.ts
│   │   │   ├── validation-utils.ts
│   │   │   └── backup-utils.ts
│   │   ├── interfaces/                # Migration Interfaces
│   │   │   ├── migration.interface.ts
│   │   │   ├── strategy.interface.ts
│   │   │   ├── plugin.interface.ts
│   │   │   └── script.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai Migration Service

- [ ] [None] Thiết kế kiến trúc Migration Service (module, service, strategy, log, API, CLI, devtools)
- [ ] [None] Precondition check: kiểm tra trạng thái DB/schema trước khi migrate, check version hiện tại, validate checksum script, locking mechanism, idempotent execution, snapshot schema trước khi migrate
- [ ] [None] Định nghĩa DTO/schema cho migration (tenantId, version, script, status, actor, timestamp, rollbackable, traceId, IP, device, userAgent, reason, errorLine, compatibility...)
- [ ] [None] Xây dựng các strategy: versioned migration, rollback, multi-tenant, plugin-based, zero-downtime, override per domain, precedence
- [ ] [None] Hỗ trợ plugin/domain extension: đăng ký plugin, lifecycle hook (beforeEachMigration, afterEachMigration, onFail), override strategy, migration precedence
- [ ] [None] Hỗ trợ migration multi-schema, multi-database, multi-tenant isolation
- [ ] [None] Lưu log migration, version history, rollback, audit trail, snapshot, error, data loss risk, destructive warning vào bảng riêng
- [ ] [None] API trigger migration, rollback, status, version check, export log, import/export log, compare schema, dry-run, migrate domain/module, pattern, skip version
- [ ] [None] CLI tool migrate, rollback, status, validate, dry-run, compare schema, import/export log, simulate migration/rollback
- [ ] [None] Hỗ trợ batch migration, scheduled migration, canary migration, parallel migration, migration-as-a-service
- [ ] [None] Hỗ trợ migration dependency graph (theo domain/module)
- [ ] [None] Hỗ trợ migration script versioning, rollback từng script, generate down.sql tự động
- [ ] [None] Hỗ trợ migration rollback partial, full, cascading, atomic rollback, rollback+forward test
- [ ] [None] Hỗ trợ migration validation, dry-run, backup/restore trước khi migrate
- [ ] [None] Dashboard/dev tool để review, trigger migration, rollback, export log, thống kê, compare schema, demo script, video hướng dẫn, checklist DevOps
- [ ] [None] Hỗ trợ alert khi migration fail, rollback, version mismatch, destructive rollback, data loss risk, SLA chưa xử lý
- [ ] [None] Hỗ trợ compliance: audit log, traceId, tenantId, migration reason, migration actor, schema compatibility check

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi trigger migration/rollback (RBAC, audit log)
- [ ] [None] Audit log mọi thao tác migration, rollback, export log, log IP/device/user agent
- [ ] [None] Cảnh báo khi có migration/rollback nghiêm trọng hoặc lặp lại nhiều lần
- [ ] [None] RBAC: user chỉ thấy migration/rollback của tenant mình, superadmin mới migrate/rollback toàn hệ thống

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho migration (migration count, fail count, rollback count, version mismatch, latency...)
- [ ] [None] Alert khi migration fail, rollback, version mismatch, latency cao, SLA chưa xử lý, destructive rollback
- [ ] [None] Structured logging (tenantId, migrationId, version, script, traceId, status, actor, IP, device, userAgent, reason, errorLine, compatibility, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho migration
- [ ] [None] Thống kê migration theo tenant, domain, entity, thời gian

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho từng strategy, migration script, rollback, API, CLI
- [ ] [None] Test isolation migration/rollback giữa các tenant
- [ ] [None] Test resilience: mô phỏng migration fail, rollback fail, version mismatch, destructive rollback
- [ ] [None] Test performance: đo throughput, latency migration, batch migration, parallel migration
- [ ] [None] Test rollback/cancel migration, batch rollback, scheduled migration, atomic rollback, rollback+forward
- [ ] [None] Test consistency sau rollback (không để orphan schema/data)
- [ ] [None] Test backup/restore schema/data trước/sau migration
- [ ] [None] Test conflict migration (2 team push cùng version khác nhau), import/export logs, active connection, read-only, maintenance

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các strategy, flow migration/rollback, hướng dẫn tích hợp, mindmap lỗi, JSON schema, kịch bản lỗi lớn nhất
- [ ] [None] Có script seed dữ liệu test migration/rollback
- [ ] [None] Có CI/CD pipeline tự động chạy test migration/rollback
- [ ] [None] Tài liệu hóa pipeline build, test, deploy migration-service
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi migration/rollback thật
- [ ] [None] Bộ câu hỏi kiểm tra checklist DevOps trước khi migrate

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ migration idempotency, deduplication
- [ ] [None] Hỗ trợ AI/ML-based migration suggestion (gợi ý rollback/migrate tối ưu)
- [ ] [None] Hỗ trợ event sourcing cho migration/rollback log
- [ ] [None] Test backup/restore migration/rollback log
- [ ] [None] Test migration schema giữa các version
- [ ] [None] Hỗ trợ simulate migration/rollback để demo QA hoặc training
- [ ] [None] Hỗ trợ CLI tool export/import/simulate migration/rollback logs
- [ ] [None] Hỗ trợ Zero-Downtime Migration (online schema migration)
- [ ] [None] Hỗ trợ Migration-as-a-Service (module đăng ký migration riêng, orchestration tự động gom lại)
