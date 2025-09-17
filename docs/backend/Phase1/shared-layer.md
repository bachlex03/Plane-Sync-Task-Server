# Shared Layer Checklist (Constants, Enums, Error Codes, Utilities)

> **Lưu ý quan trọng:**
> - **Gợi ý công nghệ:** Sử dụng TypeScript (strict mode), NestJS (module, DI), tách riêng shared thành module dùng chung cho toàn bộ backend. Đặt constants, enums, error codes, utilities vào thư mục `common/` hoặc `shared/` theo chuẩn NestJS. Đảm bảo không import ngược từ domain vào shared. Sử dụng các pattern best practice: error code registry, enum chuẩn hóa, utility function có test. Có thể tách shared thành package riêng nếu cần dùng cho nhiều service/microservice.
> - Shared Layer là nơi tập trung các thành phần dùng chung: constants (hằng số), enums (liệt kê), error codes (mã lỗi chuẩn hóa), utilities (hàm tiện ích), types/interfaces chung.
> - Không chứa logic nghiệp vụ domain, không phụ thuộc vào module cụ thể nào. Chỉ import từ shared ra ngoài, không import ngược lại.
> - Đảm bảo shared layer dễ mở rộng, dễ test, có tài liệu rõ ràng, tuân thủ chuẩn hóa codebase.
## Cấu trúc thư mục

```
libs/backend/
├── shared/                           # Shared utilities library
│   ├── src/
│   │   ├── constants/                # Application constants
│   │   │   ├── app.constants.ts      # Main application constants
│   │   │   ├── api.constants.ts      # API-related constants
│   │   │   ├── validation.constants.ts # Validation constants
│   │   │   └── index.ts
│   │   ├── enums/                    # Application enums
│   │   │   ├── user-role.enum.ts     # User role enums
│   │   │   ├── patient-status.enum.ts # Patient status enums
│   │   │   ├── appointment-status.enum.ts # Appointment status enums
│   │   │   ├── tenant-status.enum.ts # Tenant status enums
│   │   │   ├── audit-type.enum.ts    # Audit type enums
│   │   │   └── index.ts
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── api-response.interface.ts # API response interface
│   │   │   ├── pagination.interface.ts # Pagination interface
│   │   │   ├── tenant.interface.ts   # Tenant interface
│   │   │   ├── user.interface.ts     # User interface
│   │   │   └── index.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── date-utils.ts         # Date manipulation utilities
│   │   │   ├── string-utils.ts       # String manipulation utilities
│   │   │   ├── validation-utils.ts   # Validation utilities
│   │   │   ├── crypto-utils.ts       # Cryptographic utilities
│   │   │   ├── file-utils.ts         # File handling utilities
│   │   │   └── index.ts
│   │   ├── errors/                   # Error handling
│   │   │   ├── error-codes.enum.ts   # Error code enums
│   │   │   ├── error-messages.ts     # Error messages
│   │   │   ├── custom-errors.ts      # Custom error classes
│   │   │   └── index.ts
│   │   ├── decorators/               # Custom decorators
│   │   │   ├── api-response.decorator.ts # API response decorator
│   │   │   ├── validation.decorator.ts # Validation decorator
│   │   │   └── index.ts
│   │   ├── filters/                  # Exception filters
│   │   │   ├── http-exception.filter.ts # HTTP exception filter
│   │   │   ├── validation-exception.filter.ts # Validation exception filter
│   │   │   └── index.ts
│   │   ├── interceptors/             # Interceptors
│   │   │   ├── logging.interceptor.ts # Logging interceptor
│   │   │   ├── transform.interceptor.ts # Response transform interceptor
│   │   │   └── index.ts
│   │   ├── guards/                   # Guards
│   │   │   ├── tenant.guard.ts       # Tenant guard
│   │   │   ├── auth.guard.ts         # Authentication guard
│   │   │   └── index.ts
│   │   ├── middleware/               # Middleware
│   │   │   ├── tenant.middleware.ts  # Tenant middleware
│   │   │   ├── audit.middleware.ts   # Audit middleware
│   │   │   └── index.ts
│   │   ├── types/                    # Type definitions
│   │   │   ├── common.types.ts       # Common types
│   │   │   ├── api.types.ts          # API types
│   │   │   └── index.ts
│   │   ├── config/                   # Configuration
│   │   │   ├── shared.config.ts      # Shared configuration
│   │   │   ├── validation.config.ts  # Validation configuration
│   │   │   └── index.ts
│   │   ├── shared.module.ts          # Shared module
│   │   └── index.ts                  # Main export file
│   ├── test/                         # Test files
│   │   ├── unit/
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   ├── enums/
│   │   │   └── interfaces/
│   │   ├── integration/
│   │   └── e2e/
│   ├── docs/                         # Documentation
│   │   ├── README.md                 # Usage guide
│   │   ├── constants.md              # Constants documentation
│   │   ├── enums.md                  # Enums documentation
│   │   ├── utils.md                  # Utilities documentation
│   │   └── interfaces.md             # Interfaces documentation
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.ts
│   └── README.md
```

## 1. Những việc cần làm
- [x] Đã tạo cấu trúc thư mục chuẩn: constants/, enums/, errors/, utils/, types/ trong libs/backend/shared/
- [x] Đã tạo các file mẫu: app.constants.ts, user-role.enum.ts, patient-status.enum.ts, appointment-status.enum.ts, error-codes.enum.ts, error-messages.ts, date-utils.ts, string-utils.ts, pagination.interface.ts, api-response.interface.ts
- [x] (Cần bổ sung: shared.module.ts, unit test cho utils, tài liệu hướng dẫn sử dụng shared layer, export thành module NestJS)
### Cấu trúc & Tổ chức
- [x] Thiết kế cấu trúc thư mục shared/common chuẩn hóa (constants/, enums/, errors/, utils/, types/) (**Đã hoàn thành**)
- [x] Chia nhỏ enums/ thành từng file: user-role.enum.ts, patient-status.enum.ts, appointment-status.enum.ts, ... (**Đã hoàn thành**)
- [x] Tạo file constants.ts: tập trung các hằng số dùng chung (**Đã hoàn thành: app.constants.ts**)
- [x] Tạo file enums.ts: tập trung các enum dùng chung (**Đã hoàn thành: user-role.enum.ts, patient-status.enum.ts, appointment-status.enum.ts**)
- [x] Tạo file error-codes.ts: chuẩn hóa mã lỗi (**Đã hoàn thành: error-codes.enum.ts, error-messages.ts**)
- [x] Tạo file utils.ts: các hàm tiện ích dùng chung (**Đã hoàn thành: date-utils.ts, string-utils.ts**)
- [x] Tạo types/interfaces chung (**Đã hoàn thành: pagination.interface.ts, api-response.interface.ts**)
- [x] Viết unit test cho các hàm utils, validate enum, error code
- [x] Export shared layer thành module NestJS (SharedModule) để import vào các module khác
- [x] Đảm bảo không có import ngược từ domain/service vào shared (**Đã tuân thủ**)
- [x] Viết tài liệu hướng dẫn sử dụng shared layer cho dev
- [x] Tạo docs/shared.md liệt kê rõ enum nào dùng ở đâu, hướng dẫn sử dụng cho dev mới

### Best Practice & Chuẩn hóa
- [x] Đặt tên constants, enums, error codes theo convention (UPPER_SNAKE_CASE, PascalCase, ...) (**Đã hoàn thành**)
- [x] Chuẩn hóa error response format (code, message, details, ...) (**Đã hoàn thành**)
- [ ] Hỗ trợ đa ngôn ngữ cho error message nếu cần (i18n)
- [x] Đảm bảo các hàm utils không có side effect, dễ test (**Đã hoàn thành**)
- [x] Tách các nhóm utils lớn thành file riêng (date-utils.ts, string-utils.ts, ...) (**Đã tạo file mẫu, cần mở rộng thêm nếu nhiều nhóm utils**)
- [x] Đảm bảo shared layer có test coverage >=80%

## 2. Bổ sung checklist nâng cao
- [x] Export shared layer thành package npm nội bộ (monorepo hoặc publish lên registry riêng, ví dụ: @qkit-emr/shared)
- [x] Tích hợp lint/prettier rule riêng cho shared layer
- [x] Tích hợp auto-generate docs cho constants, enums, error codes (dùng TypeDoc, JSDoc)
- [x] Hỗ trợ versioning cho shared layer (nếu dùng cho nhiều service, áp dụng semantic version cho từng module con, dùng changesets/nx/lerna...)
- [x] Tích hợp schema validation cho constants/enums (dùng zod, joi nếu cần)
- [x] Load test các hàm utils quan trọng (nếu dùng cho batch processing)
- [x] Đảm bảo shared layer không chứa secret, không hardcode sensitive info (**Đã tuân thủ**)
- [x] Build shared module thành package @qkit-emr/shared nếu dùng microservice (dễ reuse)

## 3. Quy trình kiểm tra & xác thực chất lượng module Shared Layer
- [ ] **Kiểm thử tự động:**
    - Unit test, integration test, e2e test cho toàn bộ shared service, util, middleware, guard
    - Test isolation dữ liệu, context giữa các tenant
    - Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
    - Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [ ] **Kiểm thử bảo mật:**
    - Test RBAC, ABAC, phân quyền sử dụng shared layer
    - Test middleware auth, mTLS, tenant isolation
    - Test rate limit, audit log, session hijack, token revoke
    - Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [ ] **Kiểm thử hiệu năng:**
    - Benchmark các shared util, service, cross-tenant
    - Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
    - Benchmark khi nhiều service sử dụng đồng thời (load test, stress test)
    - Benchmark queue, job async, background task liên quan shared layer
- [ ] **Kiểm thử migration, rollback, versioning:**
    - Test migration schema shared, rollback, zero-downtime
    - Test versioning API, backward compatibility
- [ ] **Kiểm thử CI/CD & alert:**
    - Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
    - Tự động comment cảnh báo PR nếu coverage/benchmark giảm
    - Gửi report coverage/benchmark vào dashboard/dev chat
- [x] **Kiểm thử tài liệu:**
    - Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
    - Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [ ] **Kiểm thử manual & quy trình:**
    - Test import/export, rollback, chuyển đổi shared config
    - Checklist review trước khi release: security, compliance, performance, doc 