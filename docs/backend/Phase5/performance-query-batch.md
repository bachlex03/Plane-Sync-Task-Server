# Checklist: Query Index & Batch Insert/Update – Tối Ưu Hiệu Năng

> **Lưu ý quan trọng:**
>
> - Tối ưu truy vấn (indexing) và batch insert/update là yếu tố then chốt để đảm bảo hiệu năng, khả năng mở rộng và độ ổn định cho hệ thống multi-tenant lớn.
> - Checklist này tập trung vào kiến trúc, indexing, batch operation, multi-tenant, automation, logging, monitoring, resilience, testing, compliance, tài liệu hóa cho tối ưu hiệu năng truy vấn và ghi dữ liệu.
>
> **Cấu trúc thư mục mẫu cho Performance Optimization Layer:**
>
> apps/backend/performance/
> ├── query-optimization/
> │ ├── query-index.module.ts
> │ ├── query-index.service.ts
> │ ├── query-index.config.ts
> │ ├── index-strategies/
> │ │ ├── btree-index.strategy.ts
> │ │ ├── hash-index.strategy.ts
> │ │ ├── gin-index.strategy.ts
> │ │ ├── partial-index.strategy.ts
> │ │ ├── composite-index.strategy.ts
> │ ├── utils/
> │ │ ├── index-analyzer.ts
> │ │ ├── slow-query-logger.ts
> │ ├── **tests**/
> │ │ ├── query-index.service.spec.ts
> ├── batch-operation/
> │ ├── batch-operation.module.ts
> │ ├── batch-operation.service.ts
> │ ├── batch-operation.config.ts
> │ ├── strategies/
> │ │ ├── batch-insert.strategy.ts
> │ │ ├── batch-update.strategy.ts
> │ │ ├── upsert.strategy.ts
> │ │ ├── chunking.strategy.ts
> │ ├── utils/
> │ │ ├── batch-logger.ts
> │ │ ├── batch-metrics.ts
> │ ├── **tests**/
> │ │ ├── batch-operation.service.spec.ts

## 1. Những việc đã làm

- [ ] [None] (Điền các task đã hoàn thành tại đây)

## 2. Những việc cần làm

### Kiến trúc & Indexing

- [ ] [None] Thiết kế module tối ưu truy vấn: index, batch insert/update, upsert
- [ ] [None] Định nghĩa policy indexing: global, per table, per tenant, per field, per query pattern
- [ ] [None] Hỗ trợ multi-tenant: index riêng biệt hoặc shared, isolation, override policy
- [ ] [None] Hỗ trợ dynamic index: thêm/xóa/sửa index runtime (hot reload, migration script)
- [ ] [None] Hỗ trợ versioning cho index policy, audit trail thay đổi index
- [ ] [None] Hỗ trợ index analyzer: phát hiện query chậm, gợi ý index
- [ ] [None] Hỗ trợ partial index, composite index, covering index, index cho JSONB/array
- [ ] [None] Hỗ trợ index cho trường thời gian, trường tìm kiếm, trường phân vùng
- [ ] [None] Hỗ trợ index cho foreign key, unique, fulltext, hash, GIN/GIST
- [ ] [None] Hỗ trợ cost-based index selection: đánh giá chi phí sử dụng index nào tốt nhất cho từng loại query
- [ ] [None] Hỗ trợ index advisor CLI/API (GET /tenant/:id/index-advice)
- [ ] [None] Tự động phân tích query plan (EXPLAIN/ANALYZE) và gợi ý index hoặc re-write query
- [ ] [None] Test rollback khi tạo/sửa index lỗi hoặc không phù hợp

### Batch Operation & Automation

- [ ] [None] Thiết kế module batch insert/update/upsert, chunking, retry, error handling
- [ ] [None] Hỗ trợ batch operation: insert, update, upsert, delete, bulk import/export
- [ ] [None] Hỗ trợ chunking, phân trang, streaming cho batch lớn
- [ ] [None] Hỗ trợ transaction cho batch, rollback khi lỗi
- [ ] [None] Hỗ trợ batch operation multi-tenant: batch riêng biệt, isolation, cross-tenant
- [ ] [None] Hỗ trợ batch scheduler, job queue, background worker
- [ ] [None] Hỗ trợ automation: script seed/test batch, inject lỗi, test resilience
- [ ] [None] Hỗ trợ batch idempotency, deduplication, conflict resolution
- [ ] [None] Hỗ trợ merge batch (group by key) cho các request batch cùng loại đến gần nhau
- [ ] [None] Hỗ trợ dynamic throttle: điều chỉnh tốc độ batch theo tải hệ thống
- [ ] [None] Hỗ trợ batch profiling tool: phân tích tốc độ ghi từng batch, các điểm nghẽn (bottlenecks)
- [ ] [None] Batch có thể pause/resume/retry thủ công theo batchId

### Logging & Monitoring

- [ ] [None] Structured logging: tenantId, table, query, index, batchId, status, error, latency, rowCount
- [ ] [None] Expose Prometheus metrics: slow_query_total, batch_op_total, batch_op_latency, index_hit_ratio, tenantId, table
- [ ] [None] Log query plan cache hit/miss theo thời gian thực
- [ ] [None] Đo I/O cost, buffer hit ratio, table scan vs index scan
- [ ] [None] Alert khi có slow query, batch fail, index miss, deadlock, lock wait
- [ ] [None] Alert khi có index bloat (phình to do update/delete)
- [ ] [None] Alert khi có sequential scan vượt ngưỡng (cảnh báo thiếu index)
- [ ] [None] Dashboard/dev tool xem trạng thái query, index, batch, lịch sử lỗi, thống kê, alert
- [ ] [None] Log audit trail mọi thay đổi index, batch, migration

### Resilience & Compliance

- [ ] [None] Retry, circuit breaker, failover cho batch operation/query service
- [ ] [None] Test resilience: simulate DB down, index drop, batch fail, migration fail
- [ ] [None] Hỗ trợ hot-swap batch engine: chuyển giữa batch-sync / batch-async nếu gặp lỗi
- [ ] [None] Xác thực index policy không vi phạm PII/PHI (trường nhạy cảm)
- [ ] [None] Alert khi batch vượt hạn ngạch dữ liệu theo tenant hoặc schema
- [ ] [None] Compliance: log access, data retention, audit trail, GDPR
- [ ] [None] Hỗ trợ backup/restore index, batch, log, config

### Testing

- [ ] [None] Unit test, integration test, e2e test cho query, index, batch, migration
- [ ] [None] Test multi-tenant: index/batch riêng biệt, isolation, override
- [ ] [None] Test performance: đo throughput, latency, index hit ratio, batch size
- [ ] [None] Test rollback index/batch, test validate index, test batch API
- [ ] [None] Test alert, dashboard, log, audit trail
- [ ] [None] Test case index regression: index bị xoá hoặc thay đổi gây degrade hiệu năng
- [ ] [None] So sánh hiệu năng có/không có index trong e2e test
- [ ] [None] Test realistic load model theo hành vi truy vấn thật (recorded query pattern)
- [ ] [None] Test cross-region batch sync (nếu có replica/multi-region)

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa schema, index, batch, API, flow tối ưu hiệu năng
- [ ] [None] Bản mô tả query-index lifecycle (provision – usage – expiry – reindex)
- [ ] [None] Script compare index policy giữa tenant để phát hiện bất thường
- [ ] [None] Tự động tạo tài liệu chênh lệch batch/index giữa môi trường dev/staging/prod
- [ ] [None] Checklist zero-downtime migration khi thay đổi batch/index schema
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy performance layer
- [ ] [None] Script seed/test index, batch, inject lỗi, test resilience

## 3. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ self-service cho admin/tenant quản lý index, batch (UI/API)
- [ ] [None] Hỗ trợ AI/ML-based index suggestion, batch optimization
- [ ] [None] Hỗ trợ policy conflict detector, policy suggestion dựa trên usage
- [ ] [None] Hỗ trợ graph/visualize query/index/batch flow, deadlock, lock wait
- [ ] [None] Định nghĩa SLA/SLO cho performance layer (uptime, query latency, batch throughput, alert response time)
- [ ] [None] Hỗ trợ query pattern fingerprinting: nhóm các query có dạng giống nhau để tối ưu tập trung
- [ ] [None] Hỗ trợ background reindexing không gây gián đoạn
- [ ] [None] Hỗ trợ AI cảnh báo drift performance theo thời gian (latency tăng dần trên một batch type)
- [ ] [None] Test hiệu năng batch + query khi có schema versioning hoặc shard version mismatch

## Cấu trúc thư mục

```
apps/backend/
├── performance-service/                 # Performance Service
│   ├── src/
│   │   ├── performance.module.ts
│   │   ├── performance.service.ts
│   │   ├── performance.controller.ts
│   │   ├── query-optimization/         # Query Optimization Module
│   │   │   ├── query-optimization.module.ts
│   │   │   ├── query-optimization.service.ts
│   │   │   ├── optimizers/            # Query Optimizers
│   │   │   │   ├── sql-optimizer.ts
│   │   │   │   ├── index-optimizer.ts
│   │   │   │   ├── join-optimizer.ts
│   │   │   │   ├── cache-optimizer.ts
│   │   │   │   └── query-planner.ts
│   │   │   ├── analyzers/             # Query Analyzers
│   │   │   │   ├── query-analyzer.ts
│   │   │   │   ├── performance-analyzer.ts
│   │   │   │   ├── bottleneck-analyzer.ts
│   │   │   │   └── slow-query-detector.ts
│   │   │   ├── advisors/              # Query Advisors
│   │   │   │   ├── index-advisor.ts
│   │   │   │   ├── query-advisor.ts
│   │   │   │   ├── schema-advisor.ts
│   │   │   │   └── performance-advisor.ts
│   │   │   └── __tests__/             # Query Optimization Tests
│   │   │       ├── query-optimization.service.spec.ts
│   │   │       ├── optimizers.spec.ts
│   │   │       └── analyzers.spec.ts
│   │   ├── batch-processing/           # Batch Processing Module
│   │   │   ├── batch-processing.module.ts
│   │   │   ├── batch-processing.service.ts
│   │   │   ├── processors/            # Batch Processors
│   │   │   │   ├── data-processor.ts
│   │   │   │   ├── file-processor.ts
│   │   │   │   ├── image-processor.ts
│   │   │   │   ├── document-processor.ts
│   │   │   │   └── report-processor.ts
│   │   │   ├── schedulers/            # Batch Schedulers
│   │   │   │   ├── batch-scheduler.ts
│   │   │   │   ├── cron-scheduler.ts
│   │   │   │   ├── queue-scheduler.ts
│   │   │   │   └── priority-scheduler.ts
│   │   │   ├── workers/               # Batch Workers
│   │   │   │   ├── batch-worker.ts
│   │   │   │   ├── parallel-worker.ts
│   │   │   │   ├── distributed-worker.ts
│   │   │   │   └── retry-worker.ts
│   │   │   └── __tests__/             # Batch Processing Tests
│   │   │       ├── batch-processing.service.spec.ts
│   │   │       ├── processors.spec.ts
│   │   │       └── schedulers.spec.ts
│   │   ├── caching/                   # Caching Module
│   │   │   ├── caching.module.ts
│   │   │   ├── caching.service.ts
│   │   │   ├── strategies/            # Caching Strategies
│   │   │   │   ├── lru-strategy.ts
│   │   │   │   ├── lfu-strategy.ts
│   │   │   │   ├── ttl-strategy.ts
│   │   │   │   ├── write-through.ts
│   │   │   │   └── write-behind.ts
│   │   │   ├── stores/                # Cache Stores
│   │   │   │   ├── redis-store.ts
│   │   │   │   ├── memory-store.ts
│   │   │   │   ├── file-store.ts
│   │   │   │   └── distributed-store.ts
│   │   │   ├── invalidators/          # Cache Invalidators
│   │   │   │   ├── time-invalidator.ts
│   │   │   │   ├── event-invalidator.ts
│   │   │   │   ├── tag-invalidator.ts
│   │   │   │   └── pattern-invalidator.ts
│   │   │   └── __tests__/             # Caching Tests
│   │   │       ├── caching.service.spec.ts
│   │   │       ├── strategies.spec.ts
│   │   │       └── stores.spec.ts
│   │   ├── indexing/                  # Indexing Module
│   │   │   ├── indexing.module.ts
│   │   │   ├── indexing.service.ts
│   │   │   ├── indexers/              # Indexers
│   │   │   │   ├── database-indexer.ts
│   │   │   │   ├── search-indexer.ts
│   │   │   │   ├── fulltext-indexer.ts
│   │   │   │   ├── spatial-indexer.ts
│   │   │   │   └── composite-indexer.ts
│   │   │   ├── managers/              # Index Managers
│   │   │   │   ├── index-manager.ts
│   │   │   │   ├── index-maintainer.ts
│   │   │   │   ├── index-rebuilder.ts
│   │   │   │   └── index-analyzer.ts
│   │   │   └── __tests__/             # Indexing Tests
│   │   │       ├── indexing.service.spec.ts
│   │   │       ├── indexers.spec.ts
│   │   │       └── managers.spec.ts
│   │   ├── monitoring/                # Performance Monitoring
│   │   │   ├── monitoring.module.ts
│   │   │   ├── monitoring.service.ts
│   │   │   ├── metrics/               # Performance Metrics
│   │   │   │   ├── query-metrics.ts
│   │   │   │   ├── batch-metrics.ts
│   │   │   │   ├── cache-metrics.ts
│   │   │   │   ├── index-metrics.ts
│   │   │   │   └── system-metrics.ts
│   │   │   ├── dashboards/            # Performance Dashboards
│   │   │   │   ├── query-dashboard.ts
│   │   │   │   ├── batch-dashboard.ts
│   │   │   │   ├── cache-dashboard.ts
│   │   │   │   └── system-dashboard.ts
│   │   │   └── __tests__/             # Monitoring Tests
│   │   │       ├── monitoring.service.spec.ts
│   │   │       ├── metrics.spec.ts
│   │   │       └── dashboards.spec.ts
│   │   ├── cli/                       # Performance CLI Commands
│   │   │   ├── performance.cli.ts
│   │   │   ├── query-optimize.cli.ts
│   │   │   ├── batch-process.cli.ts
│   │   │   ├── cache-manage.cli.ts
│   │   │   └── index-manage.cli.ts
│   │   ├── api/                       # Performance API
│   │   │   ├── performance.controller.ts
│   │   │   ├── query-optimization.controller.ts
│   │   │   ├── batch-processing.controller.ts
│   │   │   ├── caching.controller.ts
│   │   │   └── indexing.controller.ts
│   │   ├── interfaces/                # Performance Interfaces
│   │   │   ├── performance.interface.ts
│   │   │   ├── query-optimization.interface.ts
│   │   │   ├── batch-processing.interface.ts
│   │   │   ├── caching.interface.ts
│   │   │   └── indexing.interface.ts
│   │   └── __tests__/                 # Performance Tests
│   │       ├── performance.service.spec.ts
│   │       ├── performance-integration.spec.ts
│   │       └── performance-e2e.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── performance-e2e.spec.ts
│   │   ├── query-optimization-e2e.spec.ts
│   │   └── batch-processing-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── performance/                         # Performance Library
│   ├── src/
│   │   ├── performance.module.ts
│   │   ├── performance.service.ts
│   │   ├── query-optimization/         # Base Query Optimization
│   │   │   ├── query-optimization.service.ts
│   │   │   ├── sql-optimizer.ts
│   │   │   ├── query-analyzer.ts
│   │   │   └── index-advisor.ts
│   │   ├── batch-processing/           # Base Batch Processing
│   │   │   ├── batch-processing.service.ts
│   │   │   ├── data-processor.ts
│   │   │   ├── batch-scheduler.ts
│   │   │   └── batch-worker.ts
│   │   ├── caching/                    # Base Caching
│   │   │   ├── caching.service.ts
│   │   │   ├── lru-strategy.ts
│   │   │   ├── redis-store.ts
│   │   │   └── time-invalidator.ts
│   │   ├── indexing/                   # Base Indexing
│   │   │   ├── indexing.service.ts
│   │   │   ├── database-indexer.ts
│   │   │   ├── index-manager.ts
│   │   │   └── index-maintainer.ts
│   │   ├── monitoring/                 # Base Performance Monitoring
│   │   │   ├── monitoring.service.ts
│   │   │   ├── query-metrics.ts
│   │   │   ├── batch-metrics.ts
│   │   │   └── cache-metrics.ts
│   │   ├── utils/                      # Performance Utilities
│   │   │   ├── performance-utils.ts
│   │   │   ├── query-utils.ts
│   │   │   ├── batch-utils.ts
│   │   │   ├── cache-utils.ts
│   │   │   └── index-utils.ts
│   │   ├── interfaces/                 # Performance Interfaces
│   │   │   ├── performance.interface.ts
│   │   │   ├── query-optimization.interface.ts
│   │   │   ├── batch-processing.interface.ts
│   │   │   ├── caching.interface.ts
│   │   │   └── indexing.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```
