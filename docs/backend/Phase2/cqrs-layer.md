# CQRS Layer Checklist (CommandBus, QueryBus, EventBus Abstraction)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS CQRS, custom CommandBus/QueryBus/EventBus, RabbitMQ/NATS (event bus), OpenTelemetry (tracing), Prometheus/Grafana (metrics), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - CQRS phải đảm bảo isolation giữa các tenant, không để lộ dữ liệu hoặc event giữa các tenant.
> - Validate context header khi nhận command/event — reject nếu thiếu tenantId.
> - Mỗi tenant nên có queue riêng hoặc partition trong event bus (tuỳ công nghệ).
> - Logging context: dùng cls-hooked hoặc AsyncLocalStorage để trace toàn bộ chain.
> 
## Cấu trúc thư mục

```
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
│   ├── test/
│   └── package.json
```
> 

## 1. Những việc đã làm
- [x] Đã có abstraction CommandBus, QueryBus, EventBus (NestJS CQRS base).
- [x] Đã có context propagation cho command/query/event (tenantId, userId, traceId).
- [x] Đã có unit test cho command/query handler cơ bản.
- [x] Đã có event bus nội bộ (in-memory) cho domain event.

## 2. Những việc cần làm

### Chức năng chính
- [ ] Thiết kế kiến trúc CQRS Layer (CommandBus, QueryBus, EventBus abstraction)
- [ ] Hỗ trợ multi-tenant isolation cho command/query/event
- [ ] Tích hợp event bus external (RabbitMQ/NATS) cho event-driven
- [ ] Middleware/Interceptor truyền context (tenantId, userId, traceId) tự động
- [ ] Hỗ trợ transactional outbox pattern cho event publish
- [ ] Hỗ trợ event replay, event sourcing (nếu cần)
- [ ] Hỗ trợ command scheduling/delayed command (nếu cần)
- [ ] Hỗ trợ dead-letter queue (DLQ) cho event lỗi
- [ ] Hỗ trợ retry, circuit breaker cho event handler
- [ ] Hỗ trợ audit log cho mọi command/query/event
- [ ] Validate context header khi nhận command/event — reject nếu thiếu tenantId
- [ ] Mỗi tenant có queue riêng hoặc partition trong event bus (tuỳ công nghệ)

### Bảo mật & Audit
- [ ] Audit log immutable cho mọi command, event (chuẩn HIPAA/GDPR)
- [ ] Cảnh báo khi có event/command bất thường (cross-tenant, replay, duplicate)
- [ ] Log đầy đủ context (user-agent, IP, traceId, ...)

### Context & Propagation
- [ ] Truyền đầy đủ context qua metadata/header (tenantId, userId, traceId, ...)
- [ ] Gắn trace ID + span ID vào mọi log (OpenTelemetry)

### Monitoring & Observability
- [ ] Expose Prometheus metrics cho command, query, event (count, latency, error rate...)
- [ ] Tích hợp alerting (Grafana Alert, email, Slack... khi event bus fail)
- [ ] Tích hợp OpenTelemetry collector để export trace + log + metrics
- [ ] Tạo dashboard theo từng tenant: số command, event, tỉ lệ lỗi, độ trễ trung bình...
- [ ] Tạo dashboard Prometheus/Grafana mẫu với các metrics:
    - command_request_total{tenantId, commandName}
    - command_duration_seconds{tenantId, commandName}
    - command_error_total{tenantId, commandName}

### Dynamic Config
- [ ] Hỗ trợ reload cấu hình event bus không cần downtime
- [ ] Đồng bộ tenant mới vào event bus config

### Failover / Retry
- [ ] Hỗ trợ retry tự động nếu event handler lỗi (giới hạn retry + circuit breaker)
- [ ] Hỗ trợ failover event bus (multi-node, HA)

### EventBus external
- [ ] Khuyến nghị: RabbitMQ với topic exchange + DLX
- [ ] NATS Jetstream (nếu cần high-throughput / streaming)

### Kiểm thử & tài liệu
- [ ] Unit test, integration test cho command, query, event handler
- [ ] Test multi-tenant isolation (event/command không cross-tenant)
- [ ] Test resilience: mô phỏng event bus down, handler lỗi, kiểm tra CQRS phản hồi đúng
- [ ] Test failover + timeout handling
- [ ] Test concurrent tenants (100+), concurrent users (1000+)
- [ ] Tài liệu cấu hình CQRS Layer, hướng dẫn tích hợp domain module
- [ ] Hướng dẫn sử dụng, vận hành, backup/restore event bus
- [ ] Có thể viết 1 markdown file docs/cqrs-layer.md giải thích:
    - Context flow
    - Retry strategy
    - Transactional outbox diagram
    - Ví dụ integration giữa patient module và CQRS layer

## 3. Bổ sung checklist nâng cao
- [ ] Hỗ trợ event sourcing cho domain quan trọng (Patient, Appointment...)
- [ ] Hỗ trợ snapshotting, versioning event store
- [ ] Hỗ trợ canary release, blue/green deployment cho event handler
- [ ] Hỗ trợ API versioning cho command/query/event
- [ ] Hỗ trợ WebSocket/gRPC event streaming nếu cần
- [ ] Tích hợp WAF cho event API nếu expose ra ngoài
- [ ] Load test cho CQRS Layer với nhiều tenant, nhiều event đồng thời
- [ ] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật event bus 