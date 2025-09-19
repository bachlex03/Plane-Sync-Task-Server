# Checklist: Kiểm thử CQRS per tenant (đọc/ghi tách biệt)

> **Lưu ý quan trọng:**
> - CQRS per tenant nghĩa là mỗi tenant có luồng đọc (Query) và ghi (Command) tách biệt, đảm bảo isolation dữ liệu, không rò rỉ giữa các tenant.
> - Cần kiểm thử cả unit test, integration test, e2e test cho các CommandHandler, QueryHandler, EventHandler.
> - Checklist này chỉ tập trung cho backend (CQRS, multi-tenant, isolation, test coverage), không bao gồm UI/UX.
> - Nên viết test mô phỏng nhiều tenant đồng thời truy vấn (100+), cần có seed script và chạy song song.
> - Load test concurrent user trên cùng tenant bằng tool như Artillery, k6 (1000 user).
> - Test failover (DB/queue bị mất kết nối) dùng docker-compose mô phỏng fail rồi test retry/resilience.
> - Test circuit breaker, timeout dùng @nestjs/terminus hoặc opossum/resilience4js, inject delay để kiểm thử.
> - Test soft/hard delete + restore per tenant: flow test dữ liệu bị xoá đúng scope tenant, restore rollback đúng.
> - Expose kết quả test Prometheus counter/gauge, alert khi có lỗi isolation.
> - Logging: gắn tenantId, userId, traceId rõ trong log để phục vụ test/tracing.
>
## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/                  # Domain modules
│   │   │   ├── patients/             # Patient domain (CQRS)
│   │   │   │   ├── commands/         # Patient commands
│   │   │   │   │   ├── create-patient.command.ts
│   │   │   │   │   ├── update-patient.command.ts
│   │   │   │   │   ├── delete-patient.command.ts
│   │   │   │   │   ├── create-patient.handler.ts
│   │   │   │   │   ├── update-patient.handler.ts
│   │   │   │   │   └── delete-patient.handler.ts
│   │   │   │   ├── queries/          # Patient queries
│   │   │   │   │   ├── get-patient.query.ts
│   │   │   │   │   ├── get-patients.query.ts
│   │   │   │   │   ├── search-patients.query.ts
│   │   │   │   │   ├── get-patient.handler.ts
│   │   │   │   │   ├── get-patients.handler.ts
│   │   │   │   │   └── search-patients.handler.ts
│   │   │   │   ├── events/           # Patient events
│   │   │   │   │   ├── patient-created.event.ts
│   │   │   │   │   ├── patient-updated.event.ts
│   │   │   │   │   ├── patient-deleted.event.ts
│   │   │   │   │   ├── patient-created.handler.ts
│   │   │   │   │   ├── patient-updated.handler.ts
│   │   │   │   │   └── patient-deleted.handler.ts
│   │   │   │   ├── __tests__/        # Patient domain tests
│   │   │   │   │   ├── command-handler.spec.ts
│   │   │   │   │   ├── query-handler.spec.ts
│   │   │   │   │   ├── event-handler.spec.ts
│   │   │   │   │   ├── integration.spec.ts
│   │   │   │   │   └── isolation.spec.ts
│   │   │   │   └── patients.module.ts
│   │   │   ├── users/                # User domain (CQRS)
│   │   │   │   ├── commands/         # User commands
│   │   │   │   │   ├── create-user.command.ts
│   │   │   │   │   ├── update-user.command.ts
│   │   │   │   │   ├── delete-user.command.ts
│   │   │   │   │   ├── create-user.handler.ts
│   │   │   │   │   ├── update-user.handler.ts
│   │   │   │   │   └── delete-user.handler.ts
│   │   │   │   ├── queries/          # User queries
│   │   │   │   │   ├── get-user.query.ts
│   │   │   │   │   ├── get-users.query.ts
│   │   │   │   │   ├── search-users.query.ts
│   │   │   │   │   ├── get-user.handler.ts
│   │   │   │   │   ├── get-users.handler.ts
│   │   │   │   │   └── search-users.handler.ts
│   │   │   │   ├── events/           # User events
│   │   │   │   │   ├── user-created.event.ts
│   │   │   │   │   ├── user-updated.event.ts
│   │   │   │   │   ├── user-deleted.event.ts
│   │   │   │   │   ├── user-created.handler.ts
│   │   │   │   │   ├── user-updated.handler.ts
│   │   │   │   │   └── user-deleted.handler.ts
│   │   │   │   ├── __tests__/        # User domain tests
│   │   │   │   │   ├── command-handler.spec.ts
│   │   │   │   │   ├── query-handler.spec.ts
│   │   │   │   │   ├── event-handler.spec.ts
│   │   │   │   │   ├── integration.spec.ts
│   │   │   │   │   └── isolation.spec.ts
│   │   │   │   └── users.module.ts
│   │   │   └── ...                   # Other domains with similar structure
│   │   ├── __tests__/                # Integration tests
│   │   │   ├── cqrs-integration.spec.ts
│   │   │   ├── multi-tenant.spec.ts
│   │   │   ├── isolation.spec.ts
│   │   │   ├── performance.spec.ts
│   │   │   └── resilience.spec.ts
│   │   └── ehr-api.module.ts
│   ├── test/                         # E2E tests
│   │   ├── cqrs-e2e.spec.ts
│   │   ├── multi-tenant-e2e.spec.ts
│   │   ├── isolation-e2e.spec.ts
│   │   └── performance-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── cqrs/                             # CQRS Layer
│   ├── src/
│   │   ├── command-bus/              # Command Bus
│   │   │   ├── command-bus.module.ts
│   │   │   ├── command-bus.service.ts
│   │   │   ├── command-handler.interface.ts
│   │   │   └── command.interface.ts
│   │   ├── query-bus/                # Query Bus
│   │   │   ├── query-bus.module.ts
│   │   │   ├── query-bus.service.ts
│   │   │   ├── query-handler.interface.ts
│   │   │   └── query.interface.ts
│   │   ├── event-bus/                # Event Bus
│   │   │   ├── event-bus.module.ts
│   │   │   ├── event-bus.service.ts
│   │   │   ├── event-handler.interface.ts
│   │   │   └── event.interface.ts
│   │   ├── decorators/               # CQRS Decorators
│   │   │   ├── command.decorator.ts
│   │   │   ├── query.decorator.ts
│   │   │   ├── event.decorator.ts
│   │   │   └── handler.decorator.ts
│   │   ├── interceptors/             # CQRS Interceptors
│   │   │   ├── cqrs-context.interceptor.ts
│   │   │   ├── command-audit.interceptor.ts
│   │   │   ├── event-audit.interceptor.ts
│   │   │   └── metrics.interceptor.ts
│   │   ├── interfaces/               # CQRS Interfaces
│   │   │   ├── command.interface.ts
│   │   │   ├── query.interface.ts
│   │   │   ├── event.interface.ts
│   │   │   ├── handler.interface.ts
│   │   │   └── context.interface.ts
│   │   ├── utils/                    # CQRS Utilities
│   │   │   ├── context-propagation.ts
│   │   │   ├── command-utils.ts
│   │   │   ├── query-utils.ts
│   │   │   ├── event-utils.ts
│   │   │   └── metrics-utils.ts
│   │   ├── config/                   # CQRS Configuration
│   │   │   ├── cqrs.config.ts
│   │   │   ├── event-bus.config.ts
│   │   │   └── metrics.config.ts
│   │   └── index.ts
│   ├── __tests__/                    # CQRS Layer tests
│   │   ├── command-bus.spec.ts
│   │   ├── query-bus.spec.ts
│   │   ├── event-bus.spec.ts
│   │   ├── integration.spec.ts
│   │   ├── isolation.spec.ts
│   │   └── performance.spec.ts
│   └── package.json
```

## 1. Những việc đã làm
- [ ] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có unit test cho CommandHandler, đã test isolation dữ liệu giữa các tenant...)

## 2. Những việc cần làm

### Kiểm thử isolation CQRS per tenant
- [ ] Viết unit test cho từng CommandHandler, QueryHandler, EventHandler (mỗi domain)
- [ ] Viết integration test cho flow CQRS (Command → Event → Query) trên từng tenant
- [ ] Test isolation dữ liệu: tenant A không truy cập, ghi/chỉnh sửa dữ liệu của tenant B
- [ ] Test concurrent command/query trên nhiều tenant (100+), seed script và chạy song song
- [ ] Test concurrent user trên cùng một tenant (1000+), load test bằng Artillery, k6
- [ ] Test rollback khi command fail (transactional integrity)
- [ ] Test idempotency cho command (gửi lặp lại không gây lỗi/nhân bản)
- [ ] Test event publish và consume đúng context tenant
- [ ] Test event replay, event sourcing (nếu có)
- [ ] Test failover: mô phỏng mất kết nối DB/queue/tenant riêng biệt bằng docker-compose
- [ ] Test resilience: delay, timeout, retry, circuit breaker trên từng tenant (dùng @nestjs/terminus, opossum, resilience4js)
- [ ] Test multi-tenant migration (migrate schema từng tenant, kiểm tra không ảnh hưởng tenant khác)
- [ ] Test soft delete, hard delete, restore dữ liệu từng tenant, kiểm tra rollback đúng
- [ ] Test cross-tenant access bị từ chối (RBAC, guard, context)
- [ ] Test audit log ghi nhận đúng tenantId, userId, action
- [ ] Test performance: đo latency, throughput đọc/ghi từng tenant, benchmark 1000 query/s

### Monitoring & Observability
- [ ] Expose Prometheus metrics cho test CQRS per tenant (latency, error rate, isolation violation...), counter/gauge
- [ ] Alert khi có lỗi isolation, cross-tenant, hoặc latency bất thường
- [ ] Structured logging cho test (tenantId, command/query, traceId, kết quả)

### Tài liệu hóa & DevOps
- [ ] Tài liệu hóa các case test CQRS per tenant, hướng dẫn chạy test
- [ ] Có script seed dữ liệu test cho nhiều tenant
- [ ] Có script xóa/clean dữ liệu test từng tenant
- [ ] Có CI/CD pipeline tự động chạy test isolation CQRS per tenant
- [ ] Ghi chú kỹ quyền audit, compliance khi test dữ liệu thật
- [ ] Có script migrate schema event (nếu versioned)
- [ ] Có test run contract event với consumer (consumer-driven contract)

## 3. Bổ sung checklist nâng cao
- [ ] Test canary release, blue/green deployment cho CQRS từng tenant (có tenant test version mới, rollback version handler)
- [ ] Test versioning command/query/event giữa các tenant, backward compatibility
- [ ] Test rollback/compensate khi migration CQRS fail trên một tenant
- [ ] Test backup/restore dữ liệu CQRS từng tenant
- [ ] Test schema migration tenant riêng biệt, kiểm tra ảnh hưởng các tenant khác
- [ ] Test migration fail và compensate (rollback partial)
- [ ] Test RBAC + Guard per tenant: truy cập command/query đúng theo quyền, scope RBAC từng tenant 