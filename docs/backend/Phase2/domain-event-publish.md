# Checklist: Cho phép Domain Modules phát sự kiện (DomainEvent)

> **Lưu ý quan trọng:**
>
> - DomainEvent là các sự kiện nghiệp vụ phát sinh từ các module domain (ví dụ: UserCreated, PatientAdmitted, BranchUpdated...).
> - Sự kiện phải truyền đúng context (tenantId, userId, traceId) và đảm bảo isolation giữa các tenant.
> - Nên sử dụng EventBus abstraction (libs/backend/cqrs/event-bus/) để publish event, hỗ trợ transactional outbox nếu cần.
> - Checklist này chỉ tập trung cho backend (domain event, event bus, bảo mật, monitoring, resilience), không bao gồm UI/UX.
> - Mỗi event handler nên xác thực lại quyền của event sender nếu dùng shared bus (userId trong event có đúng là của tenant đó không?).
> - Bổ sung context.guard() chung để validate tenantId trong mọi publish/handler.
> - Gợi ý schema event nên đặt tên rõ ràng và versioned, ví dụ: `export class PatientAdmittedV1Event { ... }`

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/                  # Domain modules
│   │   │   ├── users/                # User domain
│   │   │   │   ├── events/           # User domain events
│   │   │   │   │   ├── user-created.event.ts
│   │   │   │   │   ├── user-updated.event.ts
│   │   │   │   │   ├── user-deleted.event.ts
│   │   │   │   │   ├── user-created.handler.ts
│   │   │   │   │   ├── user-updated.handler.ts
│   │   │   │   │   └── user-deleted.handler.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── patients/             # Patient domain
│   │   │   │   ├── events/           # Patient domain events
│   │   │   │   │   ├── patient-admitted.event.ts
│   │   │   │   │   ├── patient-discharged.event.ts
│   │   │   │   │   ├── patient-updated.event.ts
│   │   │   │   │   ├── patient-admitted.handler.ts
│   │   │   │   │   ├── patient-discharged.handler.ts
│   │   │   │   │   └── patient-updated.handler.ts
│   │   │   │   └── patients.module.ts
│   │   │   ├── appointments/          # Appointment domain
│   │   │   │   ├── events/           # Appointment domain events
│   │   │   │   │   ├── appointment-created.event.ts
│   │   │   │   │   ├── appointment-cancelled.event.ts
│   │   │   │   │   ├── appointment-completed.event.ts
│   │   │   │   │   ├── appointment-created.handler.ts
│   │   │   │   │   ├── appointment-cancelled.handler.ts
│   │   │   │   │   └── appointment-completed.handler.ts
│   │   │   │   └── appointments.module.ts
│   │   │   └── branches/             # Branch domain
│   │   │       ├── events/           # Branch domain events
│   │   │       │   ├── branch-created.event.ts
│   │   │       │   ├── branch-updated.event.ts
│   │   │       │   ├── branch-deleted.event.ts
│   │   │       │   ├── branch-created.handler.ts
│   │   │       │   ├── branch-updated.handler.ts
│   │   │       │   └── branch-deleted.handler.ts
│   │   │       └── branches.module.ts
│   │   └── ehr-api.module.ts
│   ├── test/
│   └── package.json
│
libs/backend/
├── cqrs/                             # CQRS Layer
│   ├── src/
│   │   ├── event-bus/                # Event Bus
│   │   │   ├── event-bus.module.ts
│   │   │   ├── event-bus.service.ts
│   │   │   ├── event-publisher.service.ts
│   │   │   ├── event-subscriber.service.ts
│   │   │   └── outbox.service.ts     # Transactional outbox
│   │   ├── interfaces/               # Event interfaces
│   │   │   ├── domain-event.interface.ts
│   │   │   ├── event-handler.interface.ts
│   │   │   └── event-context.interface.ts
│   │   ├── utils/                    # Event utilities
│   │   │   ├── event-utils.ts
│   │   │   ├── context-utils.ts
│   │   │   └── idempotency-utils.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai DomainEvent

- [ ] [None] Định nghĩa các DomainEvent cho từng module (UserCreated, PatientAdmitted, BranchUpdated...)
- [ ] [None] Tạo event class và event handler cho từng sự kiện (nên versioned, ví dụ: PatientAdmittedV1Event)
- [ ] [None] Sử dụng EventBus abstraction để publish event từ service/domain logic
- [ ] [Critical] Truyền context (tenantId, userId, traceId) vào event
- [ ] [None] Hỗ trợ transactional outbox pattern khi publish event (nếu cần đảm bảo nhất quán)
- [ ] [Critical] Audit trail trong outbox table: actorId, action, resourceId, timestamp
- [ ] [Critical] Đảm bảo event không bị phát cross-tenant
- [ ] [Medium] Hỗ trợ event versioning (nếu cần)
- [ ] [None] Có check idempotency key cho mỗi event (tránh xử lý trùng)
- [ ] [None] Có retry backoff strategy (exponential, capped)

### Bảo mật & Isolation

- [ ] [Critical] Kiểm tra context tenant khi publish event
- [ ] [Critical] Audit log mọi event publish (traceId, actor, resource, action)
- [ ] [None] Cảnh báo khi có event cross-tenant hoặc bất thường
- [ ] [Medium] Hỗ trợ encrypt payload (nếu cần bảo mật cao)
- [ ] [None] Xác thực và phân quyền ở mức handler nếu dùng shared bus
- [ ] [Critical] context.guard() validate tenantId trong mọi publish/handler

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho event publish (event count, latency, error rate...)
- [ ] [None] Sử dụng custom label cho metrics (tenantId, eventName, latency bucket)
- [ ] [None] Tích hợp alerting (Grafana Alert, email, Slack... khi event publish fail)
- [ ] [Medium] Gắn trace ID + span ID vào mọi event (OpenTelemetry)
- [ ] [Medium] Tạo dashboard Prometheus/Grafana mẫu cho domain event
- [ ] [None] Thêm alert khi sự kiện mất traceId hoặc tenantId (reject/cảnh báo)
- [ ] [None] Structured logging cho event publish (log JSON: eventName, tenantId, userId, resourceType, resourceId)

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho event publish/handler
- [ ] [Critical] Test isolation event giữa các tenant
- [ ] [None] Test resilience: mô phỏng event bus down, handler lỗi, kiểm tra retry/failover
- [ ] [Medium] Test event replay, event sourcing (nếu có)
- [ ] [Medium] Test concurrent tenants (100+), concurrent events (1000+)
- [ ] [Medium] Load test cho event publish
- [ ] [None] Test rollback khi event publish thành công nhưng downstream fail
- [ ] [None] Test khi event publish nhưng DB rollback (nếu không dùng outbox → lost event)

### Tài liệu hóa

- [ ] [Medium] Tài liệu hóa các DomainEvent, hướng dẫn publish/subscribe
- [ ] [Medium] Tài liệu log schema (traceId, actor, event, resourceId)
- [ ] [Medium] Hướng dẫn vận hành, backup/restore event bus
- [ ] [None] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật event bus
- [ ] [Medium] Có mẫu schema cụ thể cho tất cả event (event contract: field, kiểu dữ liệu, required)
- [ ] [None] Bổ sung quy trình rollback hoặc compensating nếu event bị lỗi không xử lý kịp
- [ ] [Low] Có script để migrate schema event (nếu versioned)
- [ ] [Medium] Có test run contract event với consumer (consumer-driven contract)

## 2. Bổ sung checklist nâng cao

- [ ] [Medium] Hỗ trợ event sourcing cho domain quan trọng
- [ ] [Low] Hỗ trợ canary release, blue/green deployment cho event handler
- [ ] [Medium] Hỗ trợ API versioning cho event
- [ ] [Low] Hỗ trợ WebSocket/gRPC event streaming nếu cần
- [ ] [Medium] Tích hợp WAF cho event API nếu expose ra ngoài
