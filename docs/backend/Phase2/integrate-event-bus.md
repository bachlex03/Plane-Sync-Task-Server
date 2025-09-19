# Tích hợp Event Bus (RabbitMQ) Checklist

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng RabbitMQ (topic exchange + DLX), NestJS microservices, amqplib client, Docker Compose (devops), Prometheus/Grafana (monitoring), OpenTelemetry (tracing), audit log, tuân thủ HIPAA/GDPR.
> - Event Bus phải đảm bảo isolation giữa các tenant (queue/partition riêng hoặc label context), không để lộ event giữa các tenant.
> - Mọi event phải truyền đúng context (tenantId, userId, traceId).
> - Checklist này chỉ tập trung cho backend (event bus, bảo mật, monitoring, resilience), không bao gồm UI/UX.
> - **Gợi ý:** Có thể tạo folder `libs/backend/event-context/` nếu bạn có middleware tái sử dụng để inject context (traceId, tenantId, userId) từ request vào event.
> 
## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/                  # Domain modules
│   │   │   ├── patients/             # Patient domain
│   │   │   │   ├── events/           # Patient domain events
│   │   │   │   │   ├── patient-created.event.ts
│   │   │   │   │   ├── patient-updated.event.ts
│   │   │   │   │   ├── patient-deleted.event.ts
│   │   │   │   │   ├── patient-created.handler.ts
│   │   │   │   │   ├── patient-updated.handler.ts
│   │   │   │   │   └── patient-deleted.handler.ts
│   │   │   │   └── patients.module.ts
│   │   │   └── ...                   # Other domains
│   │   └── ehr-api.module.ts
│   ├── test/
│   └── package.json
│
libs/backend/
├── event-bus/                        # Event Bus Layer
│   ├── src/
│   │   ├── event-bus.module.ts
│   │   ├── event-bus.service.ts
│   │   ├── rabbitmq.service.ts       # RabbitMQ integration
│   │   ├── event-publisher.service.ts
│   │   ├── event-subscriber.service.ts
│   │   ├── outbox.service.ts         # Transactional outbox
│   │   ├── config/                   # Event bus configuration
│   │   │   ├── rabbitmq.config.ts
│   │   │   ├── exchange.config.ts
│   │   │   ├── queue.config.ts
│   │   │   └── dlq.config.ts
│   │   ├── interfaces/               # Event bus interfaces
│   │   │   ├── event-bus.interface.ts
│   │   │   ├── event-publisher.interface.ts
│   │   │   ├── event-subscriber.interface.ts
│   │   │   └── outbox.interface.ts
│   │   ├── utils/                    # Event bus utilities
│   │   │   ├── rabbitmq-utils.ts
│   │   │   ├── event-utils.ts
│   │   │   ├── context-utils.ts
│   │   │   └── retry-utils.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
│
├── event-context/                    # Event Context Layer
│   ├── src/
│   │   ├── event-context.module.ts
│   │   ├── event-context.middleware.ts
│   │   ├── event-context.service.ts
│   │   ├── context-injector.service.ts
│   │   ├── interfaces/               # Context interfaces
│   │   │   ├── event-context.interface.ts
│   │   │   ├── tenant-context.interface.ts
│   │   │   └── user-context.interface.ts
│   │   ├── utils/                    # Context utilities
│   │   │   ├── context-utils.ts
│   │   │   ├── tenant-utils.ts
│   │   │   └── trace-utils.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm
- [ ] (Điền các task đã hoàn thành tại đây, ví dụ: Đã tích hợp RabbitMQ client, đã có event publish/subcribe demo...)

## 2. Những việc cần làm

### Triển khai Event Bus với RabbitMQ
- [ ] Thiết lập Docker Compose cho RabbitMQ (dev, test, prod)
- [ ] Xây dựng event-bus module/service (kết nối, publish, subscribe, retry) sử dụng amqplib hoặc NestJS microservices
- [ ] Định nghĩa topic exchange, queue, routing key cho từng loại event
- [ ] Hỗ trợ DLX (Dead Letter Exchange) hoặc DLQ (Dead Letter Queue)
- [ ] Hỗ trợ queue riêng cho từng tenant (nếu cần isolation cao)
- [ ] Truyền context (tenantId, userId, traceId) trong metadata event
- [ ] Hỗ trợ transactional outbox pattern khi publish event
- [ ] Hỗ trợ event replay, event sourcing (nếu cần)
- [ ] Hỗ trợ event versioning (nếu cần)

### Bảo mật & Isolation
- [ ] Đảm bảo authentication/authorization khi kết nối RabbitMQ
- [ ] Kiểm tra context tenant khi nhận event (reject nếu thiếu/không hợp lệ)
- [ ] Audit log mọi event publish/consume (traceId, actor, resource, action)
- [ ] Cảnh báo khi có event cross-tenant hoặc bất thường
- [ ] Hỗ trợ encrypt payload (nếu cần bảo mật cao)

### Monitoring & Observability
- [ ] Expose Prometheus metrics cho RabbitMQ (event count, latency, error rate, queue depth...)
- [ ] Sử dụng custom label cho metrics (tenantId, eventName, latency bucket)
- [ ] Tích hợp alerting (Grafana Alert, email, Slack... khi RabbitMQ fail hoặc queue đầy)
- [ ] Gắn trace ID + span ID vào mọi event (OpenTelemetry)
- [ ] Tạo dashboard Prometheus/Grafana mẫu cho event bus
- [ ] Alert khi có burst bất thường từ một tenant

### Kiểm thử & resilience
- [ ] Unit test, integration test cho event publish/consume qua RabbitMQ
- [ ] Test isolation event giữa các tenant
- [ ] Test resilience: mô phỏng RabbitMQ down, queue đầy, handler lỗi, kiểm tra retry/failover
- [ ] Test event replay, event sourcing (nếu có)
- [ ] Test concurrent tenants (100+), concurrent events (1000+)
- [ ] Load test cho RabbitMQ

### Tài liệu hóa
- [ ] Tài liệu cấu hình RabbitMQ, hướng dẫn tích hợp với domain module
- [ ] Tài liệu log schema (traceId, actor, event, resourceId)
- [ ] Hướng dẫn vận hành, backup/restore RabbitMQ
- [ ] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật event bus

## 3. Bổ sung checklist nâng cao
- [ ] Hỗ trợ canary release, blue/green deployment cho event handler
- [ ] Hỗ trợ API versioning cho event
- [ ] Hỗ trợ WebSocket/gRPC event streaming nếu cần
- [ ] Tích hợp WAF cho event API nếu expose ra ngoài 