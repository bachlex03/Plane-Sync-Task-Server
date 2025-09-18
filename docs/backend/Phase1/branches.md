# Branches Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
>
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, guard, service), Prisma ORM (PostgreSQL), Redis (cache), class-validator, Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mọi thao tác với chi nhánh đều phải kiểm tra context tenant, không để rò rỉ dữ liệu giữa các tenant.
> - Audit log phải đầy đủ, immutable, phục vụ truy vết và compliance (HIPAA/GDPR), lưu đủ 6 năm.
> - Các API nhạy cảm (tạo/sửa/xóa chi nhánh) chỉ cho phép user đủ quyền thực hiện, kiểm tra phân quyền chi tiết.
> - Khi xóa chi nhánh nên soft delete, không xóa vật lý để phục vụ audit và compliance.
> - Checklist này chỉ tập trung cho backend (API, service, bảo mật, audit, multi-tenant isolation), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── branches/             # Branch management module
│   │   │   │   ├── commands/         # Branch commands
│   │   │   │   │   ├── create-branch.command.ts
│   │   │   │   │   ├── update-branch.command.ts
│   │   │   │   │   ├── delete-branch.command.ts
│   │   │   │   │   ├── activate-branch.command.ts
│   │   │   │   │   ├── suspend-branch.command.ts
│   │   │   │   │   ├── clone-branch.command.ts
│   │   │   │   │   └── move-branch.command.ts
│   │   │   │   ├── queries/          # Branch queries
│   │   │   │   │   ├── get-branches.query.ts
│   │   │   │   │   ├── get-branch-by-id.query.ts
│   │   │   │   │   ├── search-branches.query.ts
│   │   │   │   │   ├── get-branch-stats.query.ts
│   │   │   │   │   ├── get-branch-users.query.ts
│   │   │   │   │   └── get-branch-departments.query.ts
│   │   │   │   ├── events/           # Branch events
│   │   │   │   │   ├── branch-created.event.ts
│   │   │   │   │   ├── branch-updated.event.ts
│   │   │   │   │   ├── branch-deleted.event.ts
│   │   │   │   │   ├── branch-activated.event.ts
│   │   │   │   │   ├── branch-suspended.event.ts
│   │   │   │   │   └── branch-cloned.event.ts
│   │   │   │   ├── dtos/             # Branch DTOs
│   │   │   │   │   ├── create-branch.dto.ts
│   │   │   │   │   ├── update-branch.dto.ts
│   │   │   │   │   ├── branch-info.dto.ts
│   │   │   │   │   ├── branch-search.dto.ts
│   │   │   │   │   ├── branch-stats.dto.ts
│   │   │   │   │   └── branch-clone.dto.ts
│   │   │   │   ├── schemas/          # Branch schemas
│   │   │   │   │   ├── branch.schema.ts
│   │   │   │   │   ├── branch-config.schema.ts
│   │   │   │   │   ├── branch-stats.schema.ts
│   │   │   │   │   └── branch-metadata.schema.ts
│   │   │   │   ├── services/         # Branch services
│   │   │   │   │   ├── branch.service.ts
│   │   │   │   │   ├── branch-config.service.ts
│   │   │   │   │   ├── branch-stats.service.ts
│   │   │   │   │   ├── branch-clone.service.ts
│   │   │   │   │   ├── branch-import.service.ts
│   │   │   │   │   └── branch-export.service.ts
│   │   │   │   ├── validators/       # Branch validators
│   │   │   │   │   ├── branch.validator.ts
│   │   │   │   │   ├── branch-code.validator.ts
│   │   │   │   │   └── branch-name.validator.ts
│   │   │   │   └── branches.module.ts
│   │   │   ├── branch-configs/       # Branch configuration module
│   │   │   │   ├── commands/         # Config commands
│   │   │   │   │   ├── update-config.command.ts
│   │   │   │   │   ├── apply-config.command.ts
│   │   │   │   │   └── reset-config.command.ts
│   │   │   │   ├── queries/          # Config queries
│   │   │   │   │   ├── get-config.query.ts
│   │   │   │   │   ├── get-configs.query.ts
│   │   │   │   │   └── search-configs.query.ts
│   │   │   │   ├── dtos/             # Config DTOs
│   │   │   │   │   ├── update-config.dto.ts
│   │   │   │   │   ├── config-info.dto.ts
│   │   │   │   │   └── config-search.dto.ts
│   │   │   │   ├── services/         # Config services
│   │   │   │   │   ├── config.service.ts
│   │   │   │   │   ├── config-apply.service.ts
│   │   │   │   │   └── config-reset.service.ts
│   │   │   │   └── branch-configs.module.ts
│   │   │   ├── branch-stats/         # Branch statistics module
│   │   │   │   ├── commands/         # Stats commands
│   │   │   │   │   ├── collect-stats.command.ts
│   │   │   │   │   ├── update-stats.command.ts
│   │   │   │   │   └── export-stats.command.ts
│   │   │   │   ├── queries/          # Stats queries
│   │   │   │   │   ├── get-stats.query.ts
│   │   │   │   │   ├── get-stats-by-period.query.ts
│   │   │   │   │   └── search-stats.query.ts
│   │   │   │   ├── dtos/             # Stats DTOs
│   │   │   │   │   ├── stats.dto.ts
│   │   │   │   │   ├── stats-period.dto.ts
│   │   │   │   │   └── stats-search.dto.ts
│   │   │   │   ├── services/         # Stats services
│   │   │   │   │   ├── stats.service.ts
│   │   │   │   │   ├── stats-collector.service.ts
│   │   │   │   │   └── stats-export.service.ts
│   │   │   │   └── branch-stats.module.ts
│   │   │   └── branch-metadata/      # Branch metadata module
│   │   │       ├── commands/         # Metadata commands
│   │   │       │   ├── update-metadata.command.ts
│   │   │       │   ├── apply-metadata.command.ts
│   │   │       │   └── reset-metadata.command.ts
│   │   │       ├── queries/          # Metadata queries
│   │   │       │   ├── get-metadata.query.ts
│   │   │       │   ├── get-metadatas.query.ts
│   │   │       │   └── search-metadata.query.ts
│   │   │       ├── dtos/             # Metadata DTOs
│   │   │       │   ├── update-metadata.dto.ts
│   │   │       │   ├── metadata-info.dto.ts
│   │   │       │   └── metadata-search.dto.ts
│   │   │       ├── services/         # Metadata services
│   │   │       │   ├── metadata.service.ts
│   │   │       │   ├── metadata-apply.service.ts
│   │   │       │   └── metadata-reset.service.ts
│   │   │       └── branch-metadata.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── branches.controller.ts # Branch management endpoints
│   │   │   ├── branch-configs.controller.ts # Branch config endpoints
│   │   │   ├── branch-stats.controller.ts # Branch stats endpoints
│   │   │   └── branch-metadata.controller.ts # Branch metadata endpoints
│   │   ├── middleware/               # Branch middleware
│   │   │   ├── branch-audit.middleware.ts # Branch audit logging
│   │   │   ├── branch-validation.middleware.ts # Branch validation
│   │   │   └── branch-security.middleware.ts # Branch security
│   │   ├── guards/                   # Branch guards
│   │   │   ├── branch-access.guard.ts # Branch access guard
│   │   │   ├── branch-permission.guard.ts # Branch permission guard
│   │   │   └── branch-tenant.guard.ts # Branch tenant guard
│   │   ├── services/                 # Core services
│   │   │   ├── branch-audit.service.ts # Branch audit service
│   │   │   ├── branch-clone.service.ts # Branch clone service
│   │   │   ├── branch-import.service.ts # Branch import service
│   │   │   └── branch-export.service.ts # Branch export service
│   │   ├── utils/                    # Branch utilities
│   │   │   ├── branch.util.ts        # Branch utilities
│   │   │   ├── config.util.ts        # Config utilities
│   │   │   ├── stats.util.ts         # Stats utilities
│   │   │   └── metadata.util.ts      # Metadata utilities
│   │   ├── config/                   # Branch configuration
│   │   │   ├── branch.config.ts      # Branch config
│   │   │   ├── config.config.ts      # Config config
│   │   │   ├── stats.config.ts       # Stats config
│   │   │   └── metadata.config.ts    # Metadata config
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
│   │   │   ├── branch.constants.ts   # Branch constants
│   │   │   ├── config.constants.ts   # Config constants
│   │   │   ├── stats.constants.ts    # Stats constants
│   │   │   └── metadata.constants.ts # Metadata constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── branch-status.enum.ts # Branch status enums
│   │   │   ├── branch-type.enum.ts   # Branch type enums
│   │   │   ├── config-type.enum.ts   # Config type enums
│   │   │   └── stats-type.enum.ts    # Stats type enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── branch.interface.ts   # Branch interfaces
│   │   │   ├── config.interface.ts   # Config interfaces
│   │   │   ├── stats.interface.ts    # Stats interfaces
│   │   │   └── metadata.interface.ts # Metadata interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── branch.util.ts        # Branch utilities
│   │   │   ├── config.util.ts        # Config utilities
│   │   │   ├── stats.util.ts         # Stats utilities
│   │   │   └── metadata.util.ts      # Metadata utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

- [ ] [High] Đã có BranchesController, BranchesService, BranchesModule.
- [ ] [High] Đã có API tạo branch (POST /branches), kiểm tra tenant, validate dữ liệu, tạo kèm phòng ban nếu có.
- [ ] [High] Đã có API cập nhật branch (PATCH /branches/:id), kiểm tra quyền, validate.
- [ ] [High] Đã có API lấy danh sách branch theo tenant, phân trang (GET /branches).
- [ ] [High] Đã có API lấy chi tiết branch theo id và tenant (GET /branches/:id).
- [ ] [High] Đã có API xóa branch (DELETE /branches/:id), kiểm tra quyền, soft delete hoặc xóa vật lý.
- [ ] [Medium] Đã có API tìm kiếm branch (GET /branches/search) theo tên, mã, địa chỉ.
- [ ] [Medium] Đã có API thống kê branch (GET /branches/stats).
- [ ] [Medium] Đã có API lấy branch theo tenantId (GET /branches/tenant/:tenantId), kiểm tra quyền.
- [ ] [High] Đã kiểm tra context tenant ở mọi API, chỉ super_admin mới truy cập cross-tenant.
- [ ] [High] Đã phân quyền chi tiết (RolesGuard, chỉ admin/super_admin được thao tác).
- [ ] [High] Đã validate dữ liệu đầu vào (class-validator, DTO).
- [ ] [Medium] Đã log lỗi chi tiết trong service.

## 2. Những việc cần làm

### Chức năng API & Service

- [ ] [High] API tạo chi nhánh mới (POST /branches)
- [ ] [High] API cập nhật thông tin chi nhánh (PUT/PATCH /branches/:id)
- [ ] [Medium] API đổi mã chi nhánh (branch code), kiểm tra duy nhất & audit
- [ ] [High] API xóa (soft delete) chi nhánh (DELETE /branches/:id)
- [ ] [High] API lấy danh sách chi nhánh (GET /branches?paging,filter,search)
- [ ] [High] API xem chi tiết chi nhánh (GET /branches/:id)
- [ ] [Medium] API bulk import/export chi nhánh (CSV, Excel)
- [ ] [Medium] API kiểm tra trùng lặp tên/mã chi nhánh khi tạo/sửa
- [ ] [Medium] API chuyển trạng thái chi nhánh (active/inactive/suspended), kiểm tra quyền chuyển trạng thái
- [ ] [Medium] API lấy danh sách user, phòng ban, dịch vụ thuộc chi nhánh
- [ ] [Medium] API truy xuất các tài nguyên liên quan trong chi nhánh (số lượng user, dịch vụ, khoa phòng...)
- [ ] [Medium] API gán/di chuyển user giữa các chi nhánh

### Phân quyền & Multi-tenant

- [ ] [High] Đảm bảo mọi API chỉ truy cập được dữ liệu tenant của mình (trừ super admin)
- [ ] [High] Ràng buộc chi nhánh phải thuộc tenant hiện tại khi tạo/sửa (tránh super admin thao tác nhầm)
- [ ] [High] Kiểm tra context tenant ở mọi API/service liên quan chi nhánh
- [ ] [High] Phân quyền chi tiết: chỉ user đủ quyền mới được tạo/sửa/xóa chi nhánh (RBAC, permission matrix)
- [ ] [High] Super admin có thể truy cập cross-tenant (nếu cần)
- [ ] [Medium] Phân quyền theo vai trò: chỉ admin tenant hoặc super admin mới được thao tác toàn bộ chi nhánh
- [ ] [Medium] Check ownership khi sửa/xóa (user chỉ thao tác trên chi nhánh mình được gán)

### Bảo mật & Audit

- [ ] [High] Log mọi hành động tạo, sửa, xóa, xem chi nhánh (audit log, immutable)
- [ ] [Medium] Ghi log chi tiết trạng thái trước/sau khi chỉnh sửa chi nhánh (đổi tên, trạng thái, thông tin liên hệ...)
- [ ] [Medium] Audit API truy cập thông tin chi nhánh, không chỉ khi thao tác thay đổi
- [ ] [Medium] Cảnh báo khi có thao tác bất thường (tạo/sửa/xóa liên tục, thao tác ngoài giờ)
- [ ] [Medium] Cảnh báo nếu tạo nhiều chi nhánh trong thời gian ngắn
- [ ] [High] Đảm bảo tuân thủ HIPAA/GDPR (audit log, quyền truy cập, retention...)

### Kiểm thử & tài liệu

- [ ] [High] Unit test, integration test cho toàn bộ API chi nhánh
- [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
- [ ] [Medium] Test hành vi khi chi nhánh bị tạm ngưng (suspended): đảm bảo API liên quan bị vô hiệu hóa đúng cách
- [ ] [Medium] Tài liệu API (OpenAPI/Swagger, backend)
- [ ] [Medium] Hướng dẫn sử dụng API cho admin/backend dev

## 3. Bổ sung checklist nâng cao

- [ ] [Medium] API đồng bộ chi nhánh với hệ thống ngoài (HIS, ERP, ... nếu cần)
- [ ] [Medium] API cho phép gắn metadata, cấu hình riêng cho từng chi nhánh (logo, màu sắc, policy, ... phục vụ UI)
- [ ] [Medium] API cho phép tạm ngưng/suspend chi nhánh (khóa API, không xóa DB)
- [ ] [Medium] API cho phép phân quyền user theo chi nhánh (user chỉ thao tác được trên chi nhánh mình được gán)
- [ ] [Medium] API clone cấu hình chi nhánh (dành cho tenant mở nhiều nhánh giống nhau)
- [ ] [Medium] Tự động tạo cấu trúc mặc định khi tạo nhánh mới (khoa/phòng ban mẫu, nhóm dịch vụ...)
- [ ] [Medium] Load test cho các API truy vấn danh sách chi nhánh lớn
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật y tế

## 4. Quy trình kiểm tra & xác thực chất lượng module Branches

- [High] **Kiểm thử tự động:**
  - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan branch
  - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
  - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
  - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [High] **Kiểm thử bảo mật:**
  - [ ] [High] Test RBAC, ABAC, phân quyền per-tenant, cross-tenant
  - [ ] [High] Test middleware auth, mTLS, tenant isolation
  - [ ] [High] Test rate limit, brute force, audit log, session hijack, token revoke
  - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [High] **Kiểm thử hiệu năng:**
  - [ ] [High] Benchmark tạo/sửa/xóa branch, batch update, cross-tenant
  - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
  - [ ] [High] Benchmark khi nhiều user thao tác đồng thời (load test, stress test)
  - [ ] [Medium] Benchmark queue, job async, background task liên quan branch
- [High] **Kiểm thử migration, rollback, versioning:**
  - [ ] [High] Test migration schema branch, rollback, zero-downtime
  - [ ] [High] Test versioning API, backward compatibility
- [High] **Kiểm thử CI/CD & alert:**
  - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
  - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
  - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [High] **Kiểm thử tài liệu:**
  - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
  - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [High] **Kiểm thử manual & quy trình:**
  - [ ] [High] Test chuyển branch giữa tenant, rollback, import/export
  - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc
