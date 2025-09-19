# Refactor Domain Modules sang CQRS Pattern (CommandBus, QueryBus, EventBus)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS CQRS, custom Command/Query/Event, RabbitMQ/NATS (event bus), Prisma ORM, Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Refactor các module domain (Patients, Users, Branches, Tenants, FileUpload, ...) sang CQRS pattern: tách rõ Command (ghi), Query (đọc), Event (phát sự kiện).
> - Đảm bảo mọi command/query/event đều truyền đúng context (tenantId, userId, traceId), không để rò rỉ dữ liệu giữa các tenant.
> - Audit log đầy đủ, immutable cho mọi command, event, phục vụ compliance (HIPAA/GDPR).
> - Checklist này chỉ tập trung cho backend (CQRS hóa domain, isolation, bảo mật, audit, resilience), không bao gồm UI/UX.
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
│   │   │   │   ├── dtos/             # Patient DTOs
│   │   │   │   │   ├── create-patient.dto.ts
│   │   │   │   │   ├── update-patient.dto.ts
│   │   │   │   │   └── patient-response.dto.ts
│   │   │   │   ├── schemas/          # Patient schemas
│   │   │   │   │   ├── patient.schema.ts
│   │   │   │   │   └── patient-validation.schema.ts
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
│   │   │   │   ├── dtos/             # User DTOs
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   ├── schemas/          # User schemas
│   │   │   │   │   ├── user.schema.ts
│   │   │   │   │   └── user-validation.schema.ts
│   │   │   │   └── users.module.ts
│   │   │   ├── branches/             # Branch domain (CQRS)
│   │   │   │   ├── commands/         # Branch commands
│   │   │   │   │   ├── create-branch.command.ts
│   │   │   │   │   ├── update-branch.command.ts
│   │   │   │   │   ├── delete-branch.command.ts
│   │   │   │   │   ├── create-branch.handler.ts
│   │   │   │   │   ├── update-branch.handler.ts
│   │   │   │   │   └── delete-branch.handler.ts
│   │   │   │   ├── queries/          # Branch queries
│   │   │   │   │   ├── get-branch.query.ts
│   │   │   │   │   ├── get-branches.query.ts
│   │   │   │   │   ├── search-branches.query.ts
│   │   │   │   │   ├── get-branch.handler.ts
│   │   │   │   │   ├── get-branches.handler.ts
│   │   │   │   │   └── search-branches.handler.ts
│   │   │   │   ├── events/           # Branch events
│   │   │   │   │   ├── branch-created.event.ts
│   │   │   │   │   ├── branch-updated.event.ts
│   │   │   │   │   ├── branch-deleted.event.ts
│   │   │   │   │   ├── branch-created.handler.ts
│   │   │   │   │   ├── branch-updated.handler.ts
│   │   │   │   │   └── branch-deleted.handler.ts
│   │   │   │   ├── dtos/             # Branch DTOs
│   │   │   │   │   ├── create-branch.dto.ts
│   │   │   │   │   ├── update-branch.dto.ts
│   │   │   │   │   └── branch-response.dto.ts
│   │   │   │   ├── schemas/          # Branch schemas
│   │   │   │   │   ├── branch.schema.ts
│   │   │   │   │   └── branch-validation.schema.ts
│   │   │   │   └── branches.module.ts
│   │   │   └── tenants/              # Tenant domain (CQRS)
│   │   │       ├── commands/         # Tenant commands
│   │   │       │   ├── create-tenant.command.ts
│   │   │       │   ├── update-tenant.command.ts
│   │   │       │   ├── delete-tenant.command.ts
│   │   │       │   ├── create-tenant.handler.ts
│   │   │       │   ├── update-tenant.handler.ts
│   │   │       │   └── delete-tenant.handler.ts
│   │   │       ├── queries/          # Tenant queries
│   │   │       │   ├── get-tenant.query.ts
│   │   │       │   ├── get-tenants.query.ts
│   │   │       │   ├── search-tenants.query.ts
│   │   │       │   ├── get-tenant.handler.ts
│   │   │       │   ├── get-tenants.handler.ts
│   │   │       │   └── search-tenants.handler.ts
│   │   │       ├── events/           # Tenant events
│   │   │       │   ├── tenant-created.event.ts
│   │   │       │   ├── tenant-updated.event.ts
│   │   │       │   ├── tenant-deleted.event.ts
│   │   │       │   ├── tenant-created.handler.ts
│   │   │       │   ├── tenant-updated.handler.ts
│   │   │       │   └── tenant-deleted.handler.ts
│   │   │       ├── dtos/             # Tenant DTOs
│   │   │       │   ├── create-tenant.dto.ts
│   │   │       │   ├── update-tenant.dto.ts
│   │   │       │   └── tenant-response.dto.ts
│   │   │       ├── schemas/          # Tenant schemas
│   │   │       │   ├── tenant.schema.ts
│   │   │       │   └── tenant-validation.schema.ts
│   │   │       └── tenants.module.ts
│   │   └── ehr-api.module.ts
│   ├── test/
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
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm
- [ ] (Điền các task đã hoàn thành tại đây, ví dụ: Đã refactor Patients module sang CQRS, đã có CommandHandler cho CreatePatient...)

## 2. Những việc cần làm

### Refactor từng domain module
- [ ] Refactor Patients module sang CQRS (CommandHandler, QueryHandler, EventHandler)
- [ ] Refactor Users module sang CQRS
- [ ] Refactor Branches module sang CQRS
- [ ] Refactor Tenants module sang CQRS
- [ ] Refactor FileUpload module sang CQRS
- [ ] Refactor các module domain khác (nếu có)

### Command/Query/Event
- [ ] Tách rõ Command (ghi), Query (đọc), Event (phát sự kiện) cho từng use case
- [ ] Đảm bảo mọi Command/Query/Event đều truyền context (tenantId, userId, traceId)
- [ ] Định nghĩa DTO, schema cho từng Command/Query/Event
- [ ] Đảm bảo idempotency cho Command (nếu cần)
- [ ] Hỗ trợ transactional outbox cho Event publish
- [ ] Hỗ trợ event replay, event sourcing (nếu cần)
- [ ] Định nghĩa schema hợp lệ cho CQRS DTO (dùng class-validator hoặc zod)
- [ ] Xây dựng chiến lược mapping giữa DTO ↔ entity (dùng mapper riêng hoặc manual)
- [ ] Áp dụng rate limit/throttling cho các Command đặc biệt quan trọng (giảm abuse)

### Bảo mật & Multi-tenant isolation
- [ ] Kiểm tra context tenant ở mọi Command/Query/Event
- [ ] Đảm bảo isolation dữ liệu giữa các tenant (trừ super admin)
- [ ] Phân quyền chi tiết cho từng Command/Query (RBAC, permission matrix)
- [ ] Audit log immutable cho mọi Command, Event
- [ ] Cảnh báo khi có truy cập bất thường (cross-tenant, replay, duplicate)
- [ ] Kiểm tra JWT/Session trước khi xử lý Command/Query
- [ ] Hỗ trợ super admin override mode (nếu có)
- [ ] Cơ chế tách quyền theo role chuyên ngành (Y sĩ, Bác sĩ, Kế toán…)

### Monitoring & Observability
- [ ] Expose Prometheus metrics cho từng Command, Query, Event (count, latency, error rate...)
- [ ] Tạo dashboard Prometheus/Grafana mẫu cho domain CQRS
- [ ] Tích hợp alerting (Grafana Alert, email, Slack... khi handler fail)
- [ ] Gắn trace ID + span ID vào mọi log (OpenTelemetry)
- [ ] Sử dụng custom label cho Prometheus (tenantId, commandName, latency bucket)
- [ ] Alert khi có burst bất thường từ một tenant (điều tra abuse/loop)

### Kiểm thử & tài liệu
- [ ] Unit test, integration test cho từng Command, Query, Event handler
- [ ] Test isolation dữ liệu giữa các tenant
- [ ] Test resilience: mô phỏng event bus down, handler lỗi, kiểm tra phản hồi đúng
- [ ] Test concurrent tenants (100+), concurrent users (1000+)
- [ ] Test rollback khi Command thất bại (transactional integrity)
- [ ] Tài liệu hóa refactor CQRS cho từng domain (OpenAPI/Swagger, hướng dẫn tích hợp CQRS)
- [ ] Tài liệu log schema (gồm traceId, actor, module, resourceId)
- [ ] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật y tế

## 3. Bổ sung checklist nâng cao
- [ ] Hỗ trợ event sourcing, snapshotting cho domain quan trọng
- [ ] Hỗ trợ canary release, blue/green deployment cho handler
- [ ] Hỗ trợ API versioning cho Command/Query/Event
- [ ] Load test cho domain CQRS với nhiều tenant, nhiều event đồng thời 
