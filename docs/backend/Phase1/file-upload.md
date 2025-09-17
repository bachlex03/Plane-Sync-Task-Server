# File Upload Checklist (Backend, Multi-Tenant EMR)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng NestJS (module, guard, service), Prisma ORM (PostgreSQL), Redis (cache), Multer (file upload), cloud storage (S3, GCS, Azure Blob nếu cần), class-validator, Prometheus/Grafana (monitoring), Jest/Supertest (test), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Mọi thao tác upload, truy xuất file đều phải kiểm tra context tenant, không để rò rỉ file giữa các tenant.
> - Audit log phải đầy đủ, immutable, phục vụ truy vết và compliance (HIPAA/GDPR), lưu đủ 6 năm.
> - Các API nhạy cảm (upload, xóa, truy xuất file nhạy cảm) chỉ cho phép user đủ quyền thực hiện, kiểm tra phân quyền chi tiết.
> - File nhạy cảm (hồ sơ bệnh án, kết quả xét nghiệm, ảnh chẩn đoán, ...) phải được mã hóa khi lưu trữ và truyền tải.
> - Checklist này chỉ tập trung cho backend (API, service, bảo mật, audit, multi-tenant isolation), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── ehr-api/                          # EHR API Service
│   ├── src/
│   │   ├── modules/
│   │   │   ├── file-upload/          # File upload module
│   │   │   │   ├── commands/         # File upload commands
│   │   │   │   │   ├── upload-file.command.ts
│   │   │   │   │   ├── delete-file.command.ts
│   │   │   │   │   ├── update-file.command.ts
│   │   │   │   │   ├── duplicate-file.command.ts
│   │   │   │   │   ├── assign-file.command.ts
│   │   │   │   │   └── revoke-access.command.ts
│   │   │   │   ├── queries/          # File upload queries
│   │   │   │   │   ├── get-files.query.ts
│   │   │   │   │   ├── get-file-by-id.query.ts
│   │   │   │   │   ├── search-files.query.ts
│   │   │   │   │   ├── get-file-history.query.ts
│   │   │   │   │   ├── get-file-access.query.ts
│   │   │   │   │   └── get-file-stats.query.ts
│   │   │   │   ├── events/           # File upload events
│   │   │   │   │   ├── file-uploaded.event.ts
│   │   │   │   │   ├── file-deleted.event.ts
│   │   │   │   │   ├── file-downloaded.event.ts
│   │   │   │   │   ├── file-assigned.event.ts
│   │   │   │   │   └── file-access-revoked.event.ts
│   │   │   │   ├── dtos/             # File upload DTOs
│   │   │   │   │   ├── upload-file.dto.ts
│   │   │   │   │   ├── update-file.dto.ts
│   │   │   │   │   ├── file-info.dto.ts
│   │   │   │   │   ├── file-search.dto.ts
│   │   │   │   │   ├── file-assign.dto.ts
│   │   │   │   │   └── file-access.dto.ts
│   │   │   │   ├── schemas/          # File upload schemas
│   │   │   │   │   ├── file.schema.ts
│   │   │   │   │   ├── file-metadata.schema.ts
│   │   │   │   │   ├── file-access.schema.ts
│   │   │   │   │   ├── file-history.schema.ts
│   │   │   │   │   └── file-stats.schema.ts
│   │   │   │   ├── services/         # File upload services
│   │   │   │   │   ├── file-upload.service.ts
│   │   │   │   │   ├── file-storage.service.ts
│   │   │   │   │   ├── file-security.service.ts
│   │   │   │   │   ├── file-validation.service.ts
│   │   │   │   │   ├── file-encryption.service.ts
│   │   │   │   │   ├── file-virus-scan.service.ts
│   │   │   │   │   ├── file-ocr.service.ts
│   │   │   │   │   └── file-dicom.service.ts
│   │   │   │   ├── validators/       # File upload validators
│   │   │   │   │   ├── file.validator.ts
│   │   │   │   │   ├── file-type.validator.ts
│   │   │   │   │   ├── file-size.validator.ts
│   │   │   │   │   └── file-content.validator.ts
│   │   │   │   └── file-upload.module.ts
│   │   │   ├── file-metadata/        # File metadata module
│   │   │   │   ├── commands/         # Metadata commands
│   │   │   │   │   ├── update-metadata.command.ts
│   │   │   │   │   ├── assign-tags.command.ts
│   │   │   │   │   └── classify-file.command.ts
│   │   │   │   ├── queries/          # Metadata queries
│   │   │   │   │   ├── get-metadata.query.ts
│   │   │   │   │   ├── search-metadata.query.ts
│   │   │   │   │   └── get-tags.query.ts
│   │   │   │   ├── dtos/             # Metadata DTOs
│   │   │   │   │   ├── update-metadata.dto.ts
│   │   │   │   │   ├── metadata-info.dto.ts
│   │   │   │   │   └── tags.dto.ts
│   │   │   │   ├── services/         # Metadata services
│   │   │   │   │   ├── metadata.service.ts
│   │   │   │   │   ├── tags.service.ts
│   │   │   │   │   └── classification.service.ts
│   │   │   │   └── file-metadata.module.ts
│   │   │   ├── file-access/          # File access module
│   │   │   │   ├── commands/         # Access commands
│   │   │   │   │   ├── grant-access.command.ts
│   │   │   │   │   ├── revoke-access.command.ts
│   │   │   │   │   └── create-link.command.ts
│   │   │   │   ├── queries/          # Access queries
│   │   │   │   │   ├── get-access.query.ts
│   │   │   │   │   ├── get-links.query.ts
│   │   │   │   │   └── search-access.query.ts
│   │   │   │   ├── dtos/             # Access DTOs
│   │   │   │   │   ├── grant-access.dto.ts
│   │   │   │   │   ├── access-info.dto.ts
│   │   │   │   │   └── link.dto.ts
│   │   │   │   ├── services/         # Access services
│   │   │   │   │   ├── access.service.ts
│   │   │   │   │   ├── link.service.ts
│   │   │   │   │   └── permission.service.ts
│   │   │   │   └── file-access.module.ts
│   │   │   └── file-history/         # File history module
│   │   │       ├── commands/         # History commands
│   │   │       │   ├── log-access.command.ts
│   │   │       │   ├── log-download.command.ts
│   │   │       │   └── log-modification.command.ts
│   │   │       ├── queries/          # History queries
│   │   │       │   ├── get-history.query.ts
│   │   │       │   ├── search-history.query.ts
│   │   │       │   └── get-stats.query.ts
│   │   │       ├── dtos/             # History DTOs
│   │   │       │   ├── history.dto.ts
│   │   │       │   ├── history-search.dto.ts
│   │   │       │   └── stats.dto.ts
│   │   │       ├── services/         # History services
│   │   │       │   ├── history.service.ts
│   │   │       │   ├── stats.service.ts
│   │   │       │   └── audit.service.ts
│   │   │       └── file-history.module.ts
│   │   ├── controllers/              # API Controllers
│   │   │   ├── file-upload.controller.ts # File upload endpoints
│   │   │   ├── file-metadata.controller.ts # File metadata endpoints
│   │   │   ├── file-access.controller.ts # File access endpoints
│   │   │   └── file-history.controller.ts # File history endpoints
│   │   ├── middleware/               # File upload middleware
│   │   │   ├── file-upload.middleware.ts # File upload handling
│   │   │   ├── file-validation.middleware.ts # File validation
│   │   │   ├── file-security.middleware.ts # File security
│   │   │   └── file-audit.middleware.ts # File audit logging
│   │   ├── guards/                   # File upload guards
│   │   │   ├── file-access.guard.ts  # File access guard
│   │   │   ├── file-permission.guard.ts # File permission guard
│   │   │   └── file-tenant.guard.ts  # File tenant guard
│   │   ├── services/                 # Core services
│   │   │   ├── file-storage.service.ts # File storage service
│   │   │   ├── file-encryption.service.ts # File encryption service
│   │   │   ├── file-virus-scan.service.ts # File virus scanning
│   │   │   ├── file-ocr.service.ts   # File OCR service
│   │   │   └── file-dicom.service.ts # File DICOM service
│   │   ├── utils/                    # File upload utilities
│   │   │   ├── file.util.ts          # File utilities
│   │   │   ├── metadata.util.ts      # Metadata utilities
│   │   │   ├── access.util.ts        # Access utilities
│   │   │   ├── encryption.util.ts    # Encryption utilities
│   │   │   └── validation.util.ts    # Validation utilities
│   │   ├── config/                   # File upload configuration
│   │   │   ├── file-upload.config.ts # File upload config
│   │   │   ├── storage.config.ts     # Storage config
│   │   │   ├── security.config.ts    # Security config
│   │   │   ├── virus-scan.config.ts  # Virus scan config
│   │   │   └── encryption.config.ts  # Encryption config
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
│   │   │   ├── file.constants.ts     # File constants
│   │   │   ├── upload.constants.ts   # Upload constants
│   │   │   ├── security.constants.ts # Security constants
│   │   │   └── storage.constants.ts  # Storage constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── file-type.enum.ts     # File type enums
│   │   │   ├── file-status.enum.ts   # File status enums
│   │   │   ├── access-level.enum.ts  # Access level enums
│   │   │   └── security-level.enum.ts # Security level enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── file.interface.ts     # File interfaces
│   │   │   ├── upload.interface.ts   # Upload interfaces
│   │   │   ├── access.interface.ts   # Access interfaces
│   │   │   └── security.interface.ts # Security interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── file.util.ts          # File utilities
│   │   │   ├── upload.util.ts        # Upload utilities
│   │   │   ├── access.util.ts        # Access utilities
│   │   │   ├── security.util.ts      # Security utilities
│   │   │   └── encryption.util.ts    # Encryption utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm
- [ ] [High] (Điền các task đã hoàn thành tại đây, ví dụ: Đã có API upload file, kiểm tra context tenant, soft delete file...)

## 2. Những việc cần làm

### Chức năng API & Service
- [ ] [High] API upload file (POST /file-upload)
- [ ] [High] API lấy danh sách file (GET /file-upload?paging,filter,search)
- [ ] [High] API xem/truy xuất file (GET /file-upload/:id/download)
- [ ] [High] API xóa (soft delete) file (DELETE /file-upload/:id)
- [ ] [Medium] API cập nhật metadata file (PUT/PATCH /file-upload/:id)
- [ ] [High] API lấy chi tiết file (GET /file-upload/:id)
- [ ] [Medium] API kiểm tra trùng lặp file (hash, tên, dung lượng, ... nếu cần)
- [ ] [Optional] API duplicate file detection nâng cao (AI fingerprint cho ảnh, tài liệu)
- [ ] [Medium] API download link có thời hạn (expiring URLs)
- [ ] [Medium] API revoke file access token (thu hồi quyền truy cập file chia sẻ qua link)
- [ ] [Medium] API phân loại file (loại tài liệu, ảnh, kết quả cận lâm sàng, ...)
- [ ] [Medium] API gán file vào hồ sơ bệnh nhân, chi nhánh, phòng ban, dịch vụ, ... (liên kết entity)
- [ ] [Medium] API lấy lịch sử truy cập, tải về, chỉnh sửa file

### Phân quyền & Multi-tenant
- [ ] [High] Đảm bảo mọi API chỉ truy cập file thuộc tenant của mình (trừ super admin)
- [ ] [High] Kiểm tra context tenant ở mọi API/service liên quan file
- [ ] [High] Phân quyền chi tiết: upload_own_files, delete_any_file, view_sensitive_files, assign_file_to_patient, ...
- [ ] [Medium] Phân quyền theo thời điểm (chỉ được xem file trong ca trực, ...)
- [ ] [High] Super admin có thể truy cập cross-tenant (nếu cần)
- [ ] [Medium] Phân quyền theo loại file (ví dụ: chỉ bác sĩ được xem file cận lâm sàng, điều dưỡng chỉ xem tài liệu hành chính...)

### Bảo mật & Audit
- [ ] [High] Mã hóa file nhạy cảm khi lưu trữ (at-rest) và truyền tải (in-transit)
- [ ] [High] Log mọi hành động upload, tải về, xóa, truy xuất file (audit log, immutable)
- [ ] [High] Ghi log hành vi truy cập file nhạy cảm (read audit)
- [ ] [Medium] Log failed upload attempts (ghi lại hành vi nghi ngờ, upload lặp, định dạng bất thường...)
- [ ] [Medium] Checksum / Integrity check định kỳ (đảm bảo file không bị thay đổi ngoài hệ thống)
- [ ] [High] Chống upload file mã độc (scan virus: ClamAV, S3 Antivirus, VirusTotal...)
- [ ] [Medium] Cảnh báo khi có truy cập/tải về file nhạy cảm bất thường (số lượng lớn, ngoài giờ, user không đủ quyền)
- [ ] [High] Đảm bảo tuân thủ HIPAA/GDPR (audit log, quyền truy cập, retention, export data...)
- [ ] [Medium] Cấu hình thời gian lưu trữ file, tự động xóa file hết hạn (retention policy)
- [ ] [Medium] API cho phép bệnh nhân tự tải về/xóa file cá nhân (theo GDPR)

### Kiểm thử & tài liệu
- [ ] [High] Unit test, integration test cho toàn bộ API file upload
- [ ] [High] Test isolation file giữa các tenant (test backend)
- [ ] [Medium] Test upload file lớn, nhiều file cùng lúc (stress/load test)
- [ ] [Medium] Test upload file định dạng đặc biệt (DICOM, PDF, ảnh y tế, ...)
- [ ] [Medium] Test kiểm tra đồng thời nhiều tenant upload cùng lúc
- [ ] [Medium] Test phục hồi file đã soft delete
- [ ] [High] Test quyền chéo (user A tenant X không thể lấy file của tenant Y dù biết ID)
- [ ] [Medium] Tài liệu API (OpenAPI/Swagger, backend)
- [ ] [Medium] Hướng dẫn sử dụng API cho admin/backend dev

## 3. Bổ sung checklist nâng cao
- [ ] [Medium] Hỗ trợ upload trực tiếp lên cloud storage (S3, GCS, Azure Blob...) với presigned URL
- [ ] [Medium] API chuyển file giữa các tenant (chỉ cho phép super admin, audit chặt)
- [ ] [Medium] API cho phép tagging file (loại tài liệu, nhãn, ... phục vụ tìm kiếm)
- [ ] [Medium] API cho phép versioning file (lưu lịch sử các lần upload/chỉnh sửa)
- [ ] [Medium] API đồng bộ file với hệ thống ngoài (PACS, LIS, HIS, ... nếu cần)
- [ ] [Medium] API cho phép watermark file khi tải về (bảo vệ dữ liệu nhạy cảm)
- [ ] [Optional] OCR tự động trích xuất nội dung từ file PDF hoặc ảnh
- [ ] [Optional] Chuẩn DICOM + PACS Viewer tích hợp (cho ảnh y tế như CT, MRI)
- [ ] [Medium] Phân loại dữ liệu cá nhân nhạy cảm (PII/PHI tagging) để xử lý theo GDPR
- [ ] [Medium] Ký số tài liệu PDF (digital signature)
- [ ] [Medium] Load test cho các API upload/download file lớn, nhiều user đồng thời
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật y tế

## 4. Quy trình kiểm tra & xác thực chất lượng module File Upload
- [ ] [High] **Kiểm thử tự động:**
    - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API, service, guard, middleware liên quan file upload
    - [ ] [High] Test isolation dữ liệu giữa các tenant (test backend)
    - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] [High] **Kiểm thử bảo mật:**
    - [ ] [High] Test RBAC, ABAC, phân quyền upload/download, cross-tenant
    - [ ] [High] Test middleware auth, mTLS, tenant isolation
    - [ ] [High] Test rate limit, audit log, session hijack, token revoke
    - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
    - [ ] [High] Test kiểm soát loại file, kích thước, virus scan
- [ ] [High] **Kiểm thử hiệu năng:**
    - [ ] [High] Benchmark upload/download file, batch upload, cross-tenant
    - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - [ ] [High] Benchmark khi nhiều user thao tác đồng thời (load test, stress test)
    - [ ] [Medium] Benchmark queue, job async, background task liên quan file
- [ ] [High] **Kiểm thử migration, rollback, versioning:**
    - [ ] [High] Test migration schema file, rollback, zero-downtime
    - [ ] [High] Test versioning API, backward compatibility
- [ ] [High] **Kiểm thử CI/CD & alert:**
    - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [ ] [High] **Kiểm thử tài liệu:**
    - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] [High] **Kiểm thử manual & quy trình:**
    - [ ] [High] Test upload/download, rollback, import/export file
    - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc 