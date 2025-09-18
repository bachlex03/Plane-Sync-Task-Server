# EMR Backend Implementation Phases - Checklist

```text
emr-monorepo/
├── apps/
│   ├── backend/
│   │   ├── auth-api/                 # Dịch vụ xác thực (NestJS)
│   │   ├── ehr-api/                  # Dịch vụ chính EMR (Patient, Appointment, Lab, etc.)
│   │   ├── sync-service/             # Dịch vụ đồng bộ dữ liệu
│   │   ├── pull-service/             # Dịch vụ kéo dữ liệu từ Central về tenant
│   │   ├── migration-service/        # Dịch vụ migrate schema theo tenant
│   │   ├── central-system/           # Backend trung tâm (metadata, analytics, sync)
│   │   ├── monitoring-service/       # Dịch vụ giám sát health, alert
│   │   ├── event-bus-service/        # Dịch vụ tương tác message queue
│   │   ├── conflict-resolver/        # Dịch vụ xử lý xung đột dữ liệu
│   │   ├── encryption-service/       # Dịch vụ mã hóa/giải mã dữ liệu
│   │   ├── dlq-retry-service/        # Dịch vụ xử lý dead letter queue & retry
│   │   ├── healthcheck-service/      # Dịch vụ kiểm tra sức khỏe hệ thống
│   │   └── integration-adapter/      # Dịch vụ tích hợp HIS/LIS/RIS
│   │
│   ├── frontend/
│   │   ├── admin-portal/             # Next.js: super admin, kỹ thuật viên
│   │   ├── hospital-portal/          # Next.js: bệnh viện
│   │   └── patient-portal/           # Next.js: bệnh nhân
│   │
│   └── gateway/
│       └── api-gateway/              # API Gateway, Load balancer (NestJS, Express, hoặc BFF)
│
├── libs/
│   ├── backend/
│   │   ├── shared/                   # Constants, DTO, exceptions, utils dùng chung
│   │   ├── rbac/                     # RBAC service / decorators / guards
│   │   ├── cqrs/                     # CommandBus, QueryBus, EventBus layer
│   │   ├── multi-tenant/             # TenantContext, tenant resolver
│   │   ├── sync/                     # Logic cho pull/push/conflict resolver/encryption
│   │   ├── database/                 # Schema, TypeORM config, tenant DB factory
│   │   ├── security/                 # Security layer, rate limit, input validation
│   │   ├── monitoring/               # Monitoring, logging, alerting
│   │   ├── encryption/               # Encryption utilities, key management
│   │   ├── conflict/                 # Conflict resolution logic
│   │   ├── integration/              # Integration adapters, schema mapping
│   │   └── performance/              # Performance optimization, caching
│   │
│   ├── web-ui/                       # UI Component dùng chung (React)
│   │   ├── components/               # Button, Modal, Table, ...
│   │   ├── hooks/                    # useAuth, useForm, useTenant...
│   │   ├── theme/                    # Cấu hình Tailwind / Styled Component / MUI
│   │   ├── context/                  # Context dùng chung (auth, theme, tenant)
│   │   └── index.ts
│   │
│   ├── web-utils/                    # Tiện ích dùng chung giữa các portal (format, parse, etc.)
│   └── types/                        # Kiểu dùng chung (Patient, Appointment, etc.)
│
├── tools/                            # Script CLI, codegen, migrate, seed DB, etc.
├── nx.json                           # Cấu hình Nx
├── tsconfig.base.json                # Cấu hình TypeScript chung
├── package.json
└── README.md
```

> **Lưu ý xuyên suốt:**
>
> - Mỗi tenant có DB riêng (database-per-tenant), không dùng chung DB với cột TenantId.
> - Không có Single Point of Failure (SPOF) ở bất kỳ tầng nào.
> - Không lưu dữ liệu nghiệp vụ vào Central, chỉ dùng cho metadata, đồng bộ, không xử lý nghiệp vụ.
> - Monitoring, Migration, Sync, DLQ đều hoạt động độc lập từng tenant.
> - Central chỉ dùng cho metadata, đồng bộ, xác thực, không xử lý nghiệp vụ.
> - **Frontend Integration**: Tất cả API phải hỗ trợ CORS, rate limiting, và authentication cho 3 portals (admin, hospital, patient).
> - **Shared Libraries**: Backend phải cung cấp API cho libs/web-ui, web-utils, và types để frontend có thể tái sử dụng.

## Phase 1: [BE-CORE] Nền tảng & Khởi tạo kiến trúc cơ bản

- [ ] [High] Xây dựng API Gateway / Load Balancer (Tenant routing, context injection) [Xem chi tiết](./Phase1/api-gateway.md)
- [ ] [High] Phát triển Auth Module (JWT, OTP, RBAC, login theo tenant) [Xem chi tiết](./Phase1/authentication.md)
- [ ] [High] Phát triển Tenant Module (Tenant discovery, dynamic DB connection) [Xem chi tiết](./Phase1/tenants.md)
- [ ] [High] Phát triển Users Domain [Xem chi tiết](./Phase1/users.md)
- [ ] [High] Phát triển Patients Domain [Xem chi tiết](./Phase1/patients.md)
- [ ] [High] Phát triển Branches Domain [Xem chi tiết](./Phase1/branches.md)
- [ ] [High] Phát triển Form Generator [Xem chi tiết](./Phase1/form-generator.md)
- [ ] [High] Phát triển File Upload System [Xem chi tiết](./Phase1/file-upload.md)
- [ ] [High] Xây dựng Audit / Log Service (ghi log hành động người dùng) [Xem chi tiết](./Phase1/audit-log.md)
- [ ] [Medium] Tạo Shared Layer (constants, enums, error codes, utilities dùng chung) [Xem chi tiết](./Phase1/shared-layer.md)
- [ ] [Medium] Endpoint /health cho từng module để phục vụ giám sát [Xem chi tiết](./Phase1/health.md)
- [ ] [Medium] Đảm bảo database isolation per tenant [Xem chi tiết](./Phase1/database-isolation.md)
- [ ] [High] Thiết kế và triển khai database schema cho Multi-DB per Tenant [Xem chi tiết](./Phase1/database-design.md)

### Phase 1.1: [BE-FRONTEND-API] API cho Frontend Portals

- [ ] [High] Thiết kế API endpoints cho Admin Portal (quản lý tenant, user, RBAC, system config) [Xem chi tiết](./Phase1/admin-portal-api.md)
- [ ] [High] Thiết kế API endpoints cho Hospital Portal (patients, appointments, medical records, doctors) [Xem chi tiết](./Phase1/hospital-portal-api.md)
- [ ] [High] Thiết kế API endpoints cho Patient Portal (profile, appointments, prescriptions, lab results) [Xem chi tiết](./Phase1/patient-portal-api.md)
- [ ] [Medium] Cấu hình CORS và security headers cho multi-portal access [Xem chi tiết](./Phase1/cors-security-config.md)
- [ ] [Medium] API versioning strategy và backward compatibility [Xem chi tiết](./Phase1/api-versioning.md)
- [ ] [Medium] OpenAPI/Swagger documentation cho tất cả endpoints [Xem chi tiết](./Phase1/api-documentation.md)

### Phase 1.2: [BE-SHARED-LIBS] Shared Libraries Support

- [ ] [High] API endpoints cho libs/web-ui (theme config, component data, i18n) [Xem chi tiết](./Phase1/web-ui-api.md)
- [ ] [High] API endpoints cho libs/web-utils (validation schemas, formatting rules) [Xem chi tiết](./Phase1/web-utils-api.md)
- [ ] [High] API endpoints cho libs/types (type definitions, enums, constants) [Xem chi tiết](./Phase1/types-api.md)
- [ ] [Medium] Real-time updates cho shared libraries (WebSocket/SSE) [Xem chi tiết](./Phase1/realtime-updates.md)

## Phase 2: [BE-CQRS] CQRS & Event-Driven Architecture

- [ ] [High] Xây dựng CQRS Layer (CommandBus, QueryBus, EventBus abstraction) [Xem chi tiết](./Phase2/cqrs-layer.md)
- [ ] [High] Refactor domain modules sang CQRS pattern [Xem chi tiết](./Phase2/refactor-domain-cqrs.md)
- [ ] [High] Tích hợp Event Bus (RabbitMQ) [Xem chi tiết](./Phase2/integrate-event-bus.md)
- [ ] [Medium] Cho phép Domain Modules phát sự kiện (DomainEvent) [Xem chi tiết](./Phase2/domain-event-publish.md)
- [ ] [Medium] Kiểm thử CQRS per tenant (đọc/ghi tách biệt) [Xem chi tiết](./Phase2/test-cqrs-per-tenant.md)

### Phase 2.1: [BE-OPS] Quản trị vận hành & kỹ thuật (Operation & Technical Management)

- [High] Quản lý cấu hình hệ thống (System Config Management)
- [ ] [High] API quản lý cấu hình hệ thống (get/set/update/delete config)
- [ ] [High] Audit log thao tác cấu hình, versioning config, rollback
- [ ] [Medium] API filter/search cấu hình, export/import config

- [High] Quản lý phiên bản & cập nhật (Version Management)
- [ ] [High] API lấy thông tin version, changelog, trạng thái cập nhật các service/module
- [ ] [High] API trigger cập nhật, rollback, kiểm tra trạng thái cập nhật
- [ ] [Medium] API log lịch sử cập nhật, filter/search version, export/import version config

- [High] Quản lý Encryption Layer (Encryption Management)
- [ ] [High] API lấy trạng thái encryption, bật/tắt encryption từng module/tenant
- [ ] [High] API quản lý key/cert, audit log thao tác encryption
- [ ] [Medium] API log sự kiện mã hóa/giải mã, filter/search, export/import log

- [High] Quản lý Event Bus & DLQ (Event Bus/DLQ Management)
- [ ] [High] API lấy trạng thái queue, message, backlog, trạng thái kết nối
- [ ] [High] API thao tác retry/xóa/chuyển message, bulk action, log queue
- [ ] [Medium] API filter/search message, export/import log, audit thao tác queue

- [High] Quản lý Conflict Resolver (Conflict Management)
- [ ] [High] API lấy danh sách conflict, chi tiết conflict, thao tác resolve/ignore/merge
- [ ] [High] API log/audit thao tác conflict, diff highlight, bulk resolve
- [ ] [Medium] API filter/search conflict, export/import log, auto-resolve rule

- [High] Quản lý Multi-Tenant DB Connections
- [ ] [High] API lấy trạng thái kết nối DB từng tenant/module
- [ ] [High] API thao tác reconnect/test connection, bulk action, log connection
- [ ] [Medium] API filter/search, export/import log, audit thao tác connection

- [High] Quản lý Central System (Central System Management)
- [ ] [High] API lấy trạng thái kết nối, đồng bộ, metadata, log sync giữa tenant và Central
- [ ] [High] API thao tác đồng bộ thủ công, bulk sync, log/audit thao tác central
- [ ] [Medium] API filter/search, export/import log, trạng thái API tích hợp ngoài, audit thao tác

## Phase 3: [BE-SYNC] Đồng bộ, Conflict & Tính sẵn sàng

- [ ] [High] Triển khai SyncService (Push data từ tenant lên Central) [Xem chi tiết](./Phase3/sync-service.md)
- [ ] [High] Triển khai PullService (Kéo dữ liệu mới từ Central về tenant) [Xem chi tiết](./Phase3/pull-service.md)
- [ ] [High] Xây dựng Conflict Resolver (version/timestamp/hash checksum) [Xem chi tiết](./Phase3/conflict-resolver.md)
- [ ] [High] Tích hợp Encryption Layer (AES/mutual TLS để mã hóa dữ liệu khi sync) [Xem chi tiết](./Phase3/encryption-layer.md)
- [ ] [Medium] Thiết lập DLQ / Retry Handler (đẩy lỗi vào dead-letter, xử lý retry tự động) [Xem chi tiết](./Phase3/dlq-retry-handler.md)
- [ ] [Medium] Kiểm thử lỗi sync per tenant: rollback, retry, alert riêng biệt [Xem chi tiết](./Phase3/test-sync-error-per-tenant.md)

## Phase 4: [BE-MONITOR] Migration, Monitoring & Central Integration

- [ ] [High] Xây dựng Migration Service (tạo schema DB riêng, version hóa, rollback) [Xem chi tiết](./Phase4/migration-service.md)
- [ ] [High] Cấu hình Monitoring Module (Prometheus, Grafana, alert rule theo tenant) [Xem chi tiết](./Phase4/monitoring-module.md)
- [ ] [High] Tích hợp healthcheck toàn hệ thống: Gateway, DB, Queue, Central [Xem chi tiết](./Phase4/healthcheck-module.md)
- [ ] [Medium] Tích hợp Central System:
  - [ ] [Medium] API đồng bộ với các tenant [Xem chi tiết](./Phase4/central-system.md)
  - [ ] [Medium] Lưu metadata như lastSyncAt, log, checksum [Xem chi tiết](./Phase4/central-system-metadata.md)
  - [ ] [Medium] Xác thực 2 chiều: JWT hoặc mutual TLS [Xem chi tiết](./Phase4/central-system-auth.md)

## Phase 5: [BE-SEC] Bảo mật, Kiểm thử & Tối ưu

- [ ] [High] Áp dụng Security Layer toàn hệ thống:
  - [ ] [High] Rate limit, IP whitelist [Xem chi tiết](./Phase5/security-layer.md)
  - [ ] [High] Input validation [Xem chi tiết](./Phase5/input-validation.md)
  - [ ] [High] Compliance (logging, auditing) [Xem chi tiết](./Phase5/compliance-logging-auditing.md)
  - [ ] [High] RBAC đa cấp (user, chuyên ngành, phòng ban...) [Xem chi tiết](./Phase5/rbac-multilevel.md)
- [ ] [High] Kiểm thử toàn bộ tenant isolation (data leakage, API bypass) [Xem chi tiết](./Phase5/tenant-isolation-testing.md)
- [ ] [Medium] Tối ưu hiệu năng:
  - [ ] [Medium] Query index, batch insert/update [Xem chi tiết](./Phase5/performance-query-batch.md)
  - [ ] [Medium] Queue tuning [Xem chi tiết](./Phase5/performance-queue-tuning.md)
- [ ] [Medium] Tài liệu hóa đầy đủ (OpenAPI, hướng dẫn triển khai, CI/CD) [Xem chi tiết](./Phase5/documentation.md)
- [ ] [Medium] Tạo bộ test coverage & performance benchmark từng module [Xem chi tiết](./Phase5/test-coverage-benchmark.md)

### Phase 5.1: [BE-FRONTEND-SEC] Frontend Security & Performance

- [ ] [High] API security cho multi-portal access (CORS, CSP, rate limiting) [Xem chi tiết](./Phase5/frontend-security.md)
- [ ] [High] Real-time data synchronization cho frontend (WebSocket/SSE) [Xem chi tiết](./Phase5/realtime-sync.md)
- [ ] [Medium] API caching strategy cho shared libraries [Xem chi tiết](./Phase5/api-caching.md)
- [ ] [Medium] Performance optimization cho large datasets (pagination, lazy loading) [Xem chi tiết](./Phase5/performance-optimization.md)

## Phase 6: [BE-INTEGRATION] Tích hợp HIS/LIS/RIS & Hệ thống cũ

- [ ] [High] Phân loại các hệ thống đang sử dụng tại bệnh viện: HIS, LIS, RIS, PACS, EMR cũ [Xem chi tiết](./Phase6/system-classification.md)
- [ ] [High] Xác định hình thức kết nối: file-based (CSV/XML), API (REST/SOAP), HL7/FHIR [Xem chi tiết](./Phase6/connection-protocols.md)
- [ ] [High] Thiết kế kiến trúc "Integration Adapter" riêng từng hệ thống [Xem chi tiết](./Phase6/integration-adapter-architecture.md)
- [ ] [High] Mapping schema giữa hệ thống hiện tại và schema EMR mới [Xem chi tiết](./Phase6/schema-mapping.md)
- [ ] [High] Viết logic chuẩn hóa dữ liệu (normalize, convert, validate) [Xem chi tiết](./Phase6/data-normalization.md)
- [ ] [High] Ghi log đồng bộ (import status, error, audit, time range) [Xem chi tiết](./Phase6/sync-logging.md)
- [ ] [High] Tạo module quản lý Import job (theo batch, realtime, manual) [Xem chi tiết](./Phase6/import-job-management.md)
- [ ] [Medium] Cho phép chạy song song (dual-write / dual-read) để vận hành thử [Xem chi tiết](./Phase6/dual-operation-mode.md)
- [ ] [Medium] Giao diện kiểm tra kết quả sync & log [Xem chi tiết](./Phase6/sync-monitoring-ui.md)
- [ ] [Medium] Thiết lập alert khi đồng bộ lỗi hoặc dữ liệu không hợp lệ [Xem chi tiết](./Phase6/sync-alerting.md)
- [ ] [Medium] Bộ rule xử lý xung đột nếu dữ liệu khác nhau giữa 2 bên [Xem chi tiết](./Phase6/conflict-resolution-rules.md)
- [ ] [Medium] Export lại dữ liệu dạng chuẩn (FHIR/HL7) sau khi xử lý [Xem chi tiết](./Phase6/standard-export.md)
- [ ] [Medium] Kiểm thử hiệu suất với dữ liệu lớn từ HIS/LIS [Xem chi tiết](./Phase6/performance-testing.md)

### Phase 6.1: [BE-LEGACY] Tích hợp hệ thống cũ đặc biệt

- [ ] [High] Hỗ trợ đọc trực tiếp từ file .dbf, .csv, hoặc folder scan cho HIS không có API [Xem chi tiết](./Phase6/legacy-file-integration.md)
- [ ] [High] Viết parser HL7 v2.x hoặc FHIR bridge cho LIS [Xem chi tiết](./Phase6/hl7-fhir-parser.md)
- [ ] [High] Logic tự gán hoặc cảnh báo cho dữ liệu thiếu field chuẩn [Xem chi tiết](./Phase6/data-enrichment.md)
- [ ] [Medium] Ưu tiên "batch sync" trước khi chuyển sang real-time [Xem chi tiết](./Phase6/batch-sync-strategy.md)
- [ ] [Medium] Hỗ trợ rollback và recovery khi đồng bộ lỗi [Xem chi tiết](./Phase6/rollback-recovery.md)

## Phase 7: [BE-WORKFLOW] Tùy biến workflow đa tenant (config-driven)

- [ ] [High] Thiết kế schema metadata workflow theo tenant (steps, transitions, rules, forms, validations)
- [ ] [High] Service nạp workflow theo tenant_id (cache + versioning + chọn version active)
- [ ] [High] API CRUD workflow config; validate/dry-run trước khi publish; publish/unpublish
- [ ] [High] Dynamic Form Engine: render/validate form từ metadata (required/optional, field types)
- [ ] [High] Hook/Event: cắm bước đặc thù theo tenant (vd: beforeAdmission → covid-screening)
- [ ] [Medium] Tích hợp Rule Engine (BPMN/DMN) qua adapter; bật/tắt theo tenant
- [ ] [Medium] Migration/seed workflow mặc định; script nâng cấp dữ liệu đảm bảo backward-compatibility
- [ ] [Medium] Feature flags + guard backward-compatibility theo tenant
- [ ] [Medium] Audit log thay đổi cấu hình và audit thực thi workflow (ai, khi nào, ở bước nào)
- [ ] [Low] Metrics/Tracing theo bước: thời gian xử lý, tỉ lệ lỗi, điểm nghẽn

## Phase 8: [BE-TASK] Task/To-do module dựa trên workflow (workflow-driven)

- [ ] [High] Task Engine sinh task từ sự kiện bước workflow (enter/exit/guard-failed)
- [ ] [High] Schema task đa tenant: workflow, step, patient_id, record_ref, assigned_role, assignees, status, priority, due_at, shift, metadata
- [ ] [High] Mapping step → role theo tenant (doctor, nurse, lab, pharmacy, admin); override per-tenant
- [ ] [High] API CRUD + search/filter/sort/pagination theo ngày/ca/bệnh nhân/khoa/vai trò/trạng thái
- [ ] [High] State machine vòng đời task: pending → in-progress → done → verified (tùy chọn) + cancel; audit trail đầy đủ
- [ ] [High] Reassign/claim/unassign kiểm soát theo RBAC/department
- [ ] [High] Notification khi tạo/cập nhật/hết hạn (web push/email); scheduler nhắc nhở định kỳ
- [ ] [Medium] Hook khi hoàn thành task để trigger bước workflow tiếp theo (có guard/validation)
- [ ] [Medium] Queue/Scheduler cho batch task; rate limit/throttling để tránh bùng nổ
- [ ] [Low] Metrics: SLA hoàn thành, tồn đọng theo khoa/ca; dashboard theo dõi

## Phase 9: [BE-DRAFT] Lưu nháp hồ sơ (Save Draft) cho bác sĩ & điều dưỡng

- [ ] [High] API tạo/lưu nháp (Save Draft) theo user_id + patient_id + encounter_id; giới hạn 1 draft/encounter/user (configurable)
- [ ] [High] API lấy danh sách draft theo user/bệnh nhân/ngày/encounter; filter/sort/pagination
- [ ] [High] API cập nhật draft; kiểm soát version/timestamp để tránh ghi đè; upsert idempotent autosave
- [ ] [High] API discard draft và submit final (convert draft → EMR entry); transaction đảm bảo nhất quán
- [ ] [Medium] Autosave service/endpoint (ví dụ 30s): idempotency key, retry, conflict guard
- [ ] [Medium] Data model `ehr_drafts` per-tenant; serialization/validation tương thích EMR schema
- [ ] [Medium] Không sync draft lên BHYT/Central; chỉ sync khi final; guard ở integration layer
- [ ] [Medium] Audit log thao tác Save/Update/Discard/Submit Final; phân biệt Draft vs Final trong audit
- [ ] [Low] Metrics: số draft theo user/khoa/ca, thời gian hoàn tất từ draft → final

---

**Định nghĩa hoàn thành checklist:**

✅ Một mục chỉ được đánh [x] nếu có: code hoàn chỉnh, test pass, CI chạy ok, review merge, có docs (nếu cần).
