# Patients Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
>
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, guard, service), Prisma ORM (PostgreSQL), Redis (cache), class-validator, Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mọi thao tác với bệnh nhân đều phải kiểm tra context tenant, không để rò rỉ dữ liệu giữa các tenant.
> - Audit log phải đầy đủ, immutable, phục vụ truy vết và compliance (HIPAA/GDPR), lưu đủ 6 năm.
> - Các API nhạy cảm (xem/sửa/xóa hồ sơ bệnh án) chỉ cho phép user đủ quyền thực hiện, kiểm tra phân quyền chi tiết.
> - Khi xóa bệnh nhân nên soft delete, không xóa vật lý để phục vụ audit và compliance.
> - Checklist này chỉ tập trung cho backend (API, service, bảo mật, audit, multi-tenant isolation), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── patients/             # Patient management module
│   │   │   │   ├── commands/         # Patient commands
│   │   │   │   │   ├── create-patient.command.ts
│   │   │   │   │   ├── update-patient.command.ts
│   │   │   │   │   ├── delete-patient.command.ts
│   │   │   │   │   ├── merge-patient.command.ts
│   │   │   │   │   └── split-patient.command.ts
│   │   │   │   ├── queries/          # Patient queries
│   │   │   │   │   ├── get-patients.query.ts
│   │   │   │   │   ├── get-patient-by-id.query.ts
│   │   │   │   │   ├── get-patient-by-code.query.ts
│   │   │   │   │   ├── search-patients.query.ts
│   │   │   │   │   └── get-patient-stats.query.ts
│   │   │   │   ├── events/           # Patient events
│   │   │   │   │   ├── patient-created.event.ts
│   │   │   │   │   ├── patient-updated.event.ts
│   │   │   │   │   ├── patient-deleted.event.ts
│   │   │   │   │   └── patient-merged.event.ts
│   │   │   │   ├── dtos/             # Patient DTOs
│   │   │   │   │   ├── create-patient.dto.ts
│   │   │   │   │   ├── update-patient.dto.ts
│   │   │   │   │   ├── patient-info.dto.ts
│   │   │   │   │   ├── patient-search.dto.ts
│   │   │   │   │   └── patient-stats.dto.ts
│   │   │   │   ├── schemas/          # Patient schemas
│   │   │   │   │   ├── patient.schema.ts
│   │   │   │   │   ├── patient-demographics.schema.ts
│   │   │   │   │   ├── patient-contact.schema.ts
│   │   │   │   │   └── patient-medical.schema.ts
│   │   │   │   ├── services/         # Patient services
│   │   │   │   │   ├── patient.service.ts
│   │   │   │   │   ├── patient-search.service.ts
│   │   │   │   │   ├── patient-import.service.ts
│   │   │   │   │   ├── patient-export.service.ts
│   │   │   │   │   └── patient-audit.service.ts
│   │   │   │   ├── validators/       # Patient validators
│   │   │   │   │   ├── patient.validator.ts
│   │   │   │   │   ├── patient-duplicate.validator.ts
│   │   │   │   │   └── patient-business.validator.ts
│   │   │   │   └── patients.module.ts
│   │   │   ├── patient-demographics/ # Patient demographics module
│   │   │   │   ├── commands/         # Demographics commands
│   │   │   │   │   ├── update-demographics.command.ts
│   │   │   │   │   └── validate-demographics.command.ts
│   │   │   │   ├── queries/          # Demographics queries
│   │   │   │   │   ├── get-demographics.query.ts
│   │   │   │   │   └── search-demographics.query.ts
│   │   │   │   ├── dtos/             # Demographics DTOs
│   │   │   │   │   ├── demographics.dto.ts
│   │   │   │   │   └── demographics-search.dto.ts
│   │   │   │   ├── services/         # Demographics services
│   │   │   │   │   ├── demographics.service.ts
│   │   │   │   │   └── demographics-validation.service.ts
│   │   │   │   └── patient-demographics.module.ts
│   │   │   ├── patient-contacts/     # Patient contacts module
│   │   │   │   ├── commands/         # Contact commands
│   │   │   │   │   ├── add-contact.command.ts
│   │   │   │   │   ├── update-contact.command.ts
│   │   │   │   │   └── remove-contact.command.ts
│   │   │   │   ├── queries/          # Contact queries
│   │   │   │   │   ├── get-contacts.query.ts
│   │   │   │   │   └── search-contacts.query.ts
│   │   │   │   ├── dtos/             # Contact DTOs
│   │   │   │   │   ├── contact.dto.ts
│   │   │   │   │   └── contact-search.dto.ts
│   │   │   │   ├── services/         # Contact services
│   │   │   │   │   ├── contact.service.ts
│   │   │   │   │   └── contact-validation.service.ts
│   │   │   │   └── patient-contacts.module.ts
│   │   │   └── patient-medical/      # Patient medical info module
│   │   │       ├── commands/         # Medical commands
│   │   │       │   ├── update-medical.command.ts
│   │   │       │   └── validate-medical.command.ts
│   │   │       ├── queries/          # Medical queries
│   │   │       │   ├── get-medical.query.ts
│   │   │       │   └── search-medical.query.ts
│   │   │       ├── dtos/             # Medical DTOs
│   │   │       │   ├── medical.dto.ts
│   │   │       │   └── medical-search.dto.ts
│   │   │       ├── services/         # Medical services
│   │   │       │   ├── medical.service.ts
│   │   │       │   └── medical-validation.service.ts
│   │   │       └── patient-medical.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── patients.controller.ts # Patient management endpoints
│   │   │   ├── demographics.controller.ts # Demographics endpoints
│   │   │   ├── contacts.controller.ts # Contact endpoints
│   │   │   └── medical.controller.ts # Medical info endpoints
│   │   ├── middleware/               # Patient middleware
│   │   │   ├── patient-audit.middleware.ts # Patient audit logging
│   │   │   ├── patient-validation.middleware.ts # Patient validation
│   │   │   └── patient-security.middleware.ts # Patient security
│   │   ├── guards/                   # Patient guards
│   │   │   ├── patient-access.guard.ts # Patient access guard
│   │   │   ├── patient-permission.guard.ts # Patient permission guard
│   │   │   └── patient-field.guard.ts # Patient field-level guard
│   │   ├── services/                 # Core services
│   │   │   ├── patient-audit.service.ts # Patient audit service
│   │   │   ├── patient-duplicate.service.ts # Patient duplicate detection
│   │   │   ├── patient-import.service.ts # Patient import service
│   │   │   └── patient-export.service.ts # Patient export service
│   │   ├── utils/                    # Patient utilities
│   │   │   ├── patient.util.ts       # Patient utilities
│   │   │   ├── demographics.util.ts  # Demographics utilities
│   │   │   ├── contact.util.ts       # Contact utilities
│   │   │   └── medical.util.ts       # Medical utilities
│   │   ├── config/                   # Patient configuration
│   │   │   ├── patient.config.ts     # Patient config
│   │   │   ├── demographics.config.ts # Demographics config
│   │   │   ├── contact.config.ts     # Contact config
│   │   │   └── medical.config.ts     # Medical config
│   │   └── ehr-api.module.ts
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── README.md
│
libs/backend/
├── shared/                           # Shared utilities
│   ├── src/
│   │   ├── constants/                # Shared constants
│   │   │   ├── patient.constants.ts  # Patient constants
│   │   │   ├── demographics.constants.ts # Demographics constants
│   │   │   ├── contact.constants.ts  # Contact constants
│   │   │   └── medical.constants.ts  # Medical constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── patient-status.enum.ts # Patient status enums
│   │   │   ├── patient-type.enum.ts  # Patient type enums
│   │   │   ├── contact-type.enum.ts  # Contact type enums
│   │   │   └── medical-type.enum.ts  # Medical type enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── patient.interface.ts  # Patient interfaces
│   │   │   ├── demographics.interface.ts # Demographics interfaces
│   │   │   ├── contact.interface.ts  # Contact interfaces
│   │   │   └── medical.interface.ts  # Medical interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── patient.util.ts       # Patient utilities
│   │   │   ├── demographics.util.ts  # Demographics utilities
│   │   │   ├── contact.util.ts       # Contact utilities
│   │   │   └── medical.util.ts       # Medical utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

- [ ] [High] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có API CRUD cơ bản, validate dữ liệu, ...)

## 2. Những việc cần làm

### Chức năng API & Service

- [ ] [High] API CRUD bệnh nhân (create, read, update, delete, soft delete)
- [ ] [High] API tìm kiếm, lọc, phân trang bệnh nhân (search, filter, pagination)
- [ ] [High] API lấy chi tiết bệnh nhân (by id, by code, by phone, ...)
- [ ] [High] API cập nhật trạng thái bệnh nhân (active, inactive, deceased, ...)
- [ ] [Medium] API import/export danh sách bệnh nhân (Excel, CSV, HL7, ...)
- [ ] [Medium] API đồng bộ bệnh nhân với hệ thống ngoài (HIS, LIS, ...)
- [ ] [Medium] API ghi nhận lịch sử thay đổi (audit log, versioning)
- [ ] [Medium] API thống kê số lượng, trạng thái bệnh nhân
- [ ] [Optional] API merge, split hồ sơ bệnh nhân
- [ ] [Optional] API đồng bộ ảnh, tài liệu liên quan bệnh nhân

### Bảo mật & Audit

- [ ] [High] Phân quyền truy cập API bệnh nhân (RBAC, ABAC, multi-tenant)
- [ ] [High] Bảo vệ dữ liệu nhạy cảm (masking, encrypt, audit log)
- [ ] [High] Log mọi thay đổi dữ liệu bệnh nhân (audit log, immutable)
- [ ] [Medium] Ghi log các truy cập bất thường (truy cập ngoài giờ, IP lạ, ...)
- [ ] [High] Cảnh báo khi có thao tác bất thường (xóa hàng loạt, sửa nhiều trường, ...)

### Validation & Business Rule

- [ ] [High] Validate dữ liệu đầu vào (họ tên, ngày sinh, số điện thoại, mã bệnh nhân, ...)
- [ ] [High] Kiểm tra trùng lặp bệnh nhân (theo tên, ngày sinh, số điện thoại, ...)
- [ ] [High] Kiểm tra quyền thao tác trên từng trường dữ liệu (field-level permission)
- [ ] [Medium] Validate logic nghiệp vụ (tuổi, trạng thái, liên kết hồ sơ...)
- [ ] [Medium] Validate dữ liệu import/export

### Monitoring & Alerting

- [ ] [High] Expose Prometheus metrics cho API bệnh nhân (số lượng, latency, error rate)
- [ ] [Medium] Thống kê truy cập, thao tác trên bệnh nhân theo user, role, tenant
- [ ] [High] Tích hợp alerting khi có lỗi nghiêm trọng (insert/update/delete fail, data loss)
- [ ] [Medium] Ghi log health check định kỳ vào hệ thống monitoring/audit

### Kiểm thử & tài liệu

- [ ] [High] Unit test, integration test cho toàn bộ API bệnh nhân
- [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
- [ ] [Medium] Test resilience: mô phỏng lỗi DB, lỗi external API, ... kiểm tra API phản hồi đúng
- [ ] [Medium] Chaos test mô phỏng mất 1 service (DB, Redis...) và kiểm tra hệ thống vẫn báo đúng
- [ ] [Medium] Tài liệu API (OpenAPI/Swagger, backend)
- [ ] [Medium] Hướng dẫn sử dụng API bệnh nhân cho admin/backend dev

## 3. Bổ sung checklist nâng cao

- [ ] [Medium] API kiểm tra lịch sử thay đổi từng trường (field-level audit)
- [ ] [Medium] API kiểm tra quyền truy cập từng trường (field-level access)
- [ ] [Medium] API kiểm tra health các node trong cluster (multi-instance, multi-region)
- [ ] [Medium] API kiểm tra health các job đồng bộ dữ liệu (sync, CDC, event sourcing)
- [ ] [Optional] API kiểm tra health các endpoint AI/ML (nếu có)
- [ ] [Medium] Load test API bệnh nhân khi có nhiều request đồng thời
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về monitoring hệ thống y tế

## 4. Quy trình kiểm tra & xác thực chất lượng module Patients

- [High] **Kiểm thử tự động:**
  - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan patients
  - [ ] [High] Test isolation dữ liệu, context giữa các tenant
  - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
  - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [High] **Kiểm thử bảo mật:**
  - [ ] [High] Test RBAC, ABAC, phân quyền truy cập patients, cross-tenant
  - [ ] [High] Test middleware auth, mTLS, tenant isolation
  - [ ] [High] Test rate limit, audit log, session hijack, token revoke
  - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [High] **Kiểm thử hiệu năng:**
  - [ ] [High] Benchmark patients API, cross-tenant, multi-service
  - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
  - [ ] [High] Benchmark khi nhiều request đồng thời (load test, stress test)
  - [ ] [Medium] Benchmark queue, job async, background task liên quan patients
- [High] **Kiểm thử migration, rollback, versioning:**
  - [ ] [High] Test migration schema patients, rollback, zero-downtime
  - [ ] [High] Test versioning API, backward compatibility
- [High] **Kiểm thử CI/CD & alert:**
  - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
  - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
  - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [High] **Kiểm thử tài liệu:**
  - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
  - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [High] **Kiểm thử manual & quy trình:**
  - [ ] [High] Test patients API các service, rollback, import/export patients config
  - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc
