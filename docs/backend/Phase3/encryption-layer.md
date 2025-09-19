# Checklist: Tích hợp Encryption Layer (AES/mutual TLS để mã hóa dữ liệu khi sync)

> **Lưu ý quan trọng:**
>
> - Encryption Layer chịu trách nhiệm mã hóa dữ liệu nhạy cảm khi đồng bộ giữa tenant và Central, bảo vệ dữ liệu khi truyền tải và lưu trữ.
> - Hỗ trợ nhiều phương pháp: AES-256 (symmetric), RSA/ECC (asymmetric), mutual TLS (transport), HMAC (integrity).
> - Checklist này chỉ tập trung cho backend (service, đồng bộ, bảo mật, resilience, monitoring), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ core, strategies, utils, keys, certs, tests.
> - Phân tách rõ encryption runtime vs. management (key lifecycle) – module runtime không có quyền rotate/revoke key.
> - Hỗ trợ auto-negotiation strategy theo tenant, payload type, channel (RSA cho file, AES cho payload nhỏ).
> - Định nghĩa interface chuẩn cho strategy (IEncryptionStrategy, ISigningStrategy) để dễ mock/test/extend.
> - Thêm caching layer cho key/cert ngắn hạn (in-memory) để giảm latency khi decrypt liên tục.
> - Hỗ trợ plugin-based strategy: dễ mở rộng cho từng loại dữ liệu hoặc kênh truyền tải.
> - Quản lý key/cert an toàn: rotation, revoke, audit log truy cập key, scope sử dụng key (chỉ dùng cho audit log, không dùng cho payload).
> - Chống downgrade attack (key/algorithm negotiation), enforce min version/key length.
> - Tách role quản lý key và role hệ thống sử dụng key (least privilege).
> - Kiểm padding oracle attack (AES-CBC), hạn chế log plaintext trong error trace.
> - Hỗ trợ encrypt/decrypt từng field hoặc toàn bộ payload, hỗ trợ masking dữ liệu khi log.
> - Tích hợp với SyncService, PullService, API, file upload, event bus, background jobs.
> - Hỗ trợ encrypt file lớn (streaming), chunked encryption, resume file encryption khi gián đoạn, verify file integrity, encrypt file metadata.
> - Hỗ trợ encrypt metadata, audit log, conflict log nếu có sensitive data.
> - Hỗ trợ kiểm tra compliance (HIPAA, GDPR, ISO 27001), tenant-specific compliance policy.
> - Log số lần sử dụng key/cert theo ngày (usage analytics), monitor entropy key/cert, cảnh báo miss config, auto revoke key không dùng lâu.
> - Fuzz testing input, test backward compatibility key versioning, simulate key loss, asset audit.
> - Tích hợp kiểm tra Vault/KMS trong CI/CD pipeline, block nếu thiếu key/cert.
> - Zero Trust Encryption Support, hybrid encryption, remote key validation (OCSP, CRL).

## Cấu trúc thư mục

```
apps/backend/
├── encryption-service/                 # Encryption Service
│   ├── src/
│   │   ├── encryption.module.ts
│   │   ├── encryption.service.ts
│   │   ├── encryption.controller.ts
│   │   ├── strategies/                # Encryption Strategies
│   │   │   ├── aes.strategy.ts
│   │   │   ├── rsa.strategy.ts
│   │   │   ├── tls.strategy.ts
│   │   │   ├── hmac.strategy.ts
│   │   │   ├── hybrid.strategy.ts
│   │   │   └── auto-negotiation.strategy.ts
│   │   ├── utils/                     # Encryption Utilities
│   │   │   ├── key-manager.ts
│   │   │   ├── cert-manager.ts
│   │   │   ├── masking.ts
│   │   │   ├── chunked-encryption.ts
│   │   │   ├── cache.ts
│   │   │   ├── integrity.ts
│   │   │   └── compliance.ts
│   │   ├── keys/                      # Key Management
│   │   │   ├── tenant-key.pem
│   │   │   ├── central-key.pem
│   │   │   ├── backup-key.pem
│   │   │   └── key-rotation.log
│   │   ├── certs/                     # Certificate Management
│   │   │   ├── tenant-cert.pem
│   │   │   ├── central-cert.pem
│   │   │   ├── backup-cert.pem
│   │   │   └── cert-rotation.log
│   │   ├── api/                       # Encryption API
│   │   │   ├── encryption.controller.ts
│   │   │   ├── key-management.controller.ts
│   │   │   ├── cert-management.controller.ts
│   │   │   └── compliance.controller.ts
│   │   ├── cli/                       # CLI Commands
│   │   │   ├── encrypt.cli.ts
│   │   │   ├── decrypt.cli.ts
│   │   │   ├── key-rotate.cli.ts
│   │   │   ├── cert-renew.cli.ts
│   │   │   └── compliance-check.cli.ts
│   │   ├── guards/                    # Encryption Guards
│   │   │   ├── encryption-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/                # Encryption Interfaces
│   │   │   ├── encryption-strategy.interface.ts
│   │   │   ├── key-manager.interface.ts
│   │   │   ├── cert-manager.interface.ts
│   │   │   └── compliance.interface.ts
│   │   └── __tests__/                 # Encryption Tests
│   │       ├── encryption.spec.ts
│   │       ├── key-manager.spec.ts
│   │       ├── masking.spec.ts
│   │       ├── fuzz.spec.ts
│   │       ├── compatibility.spec.ts
│   │       └── file-encryption.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── encryption-e2e.spec.ts
│   │   ├── multi-tenant-encryption.spec.ts
│   │   └── compliance-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── encryption/                         # Encryption Library
│   ├── src/
│   │   ├── encryption.module.ts
│   │   ├── encryption.service.ts
│   │   ├── strategies/                # Base Encryption Strategies
│   │   │   ├── base-encryption.strategy.ts
│   │   │   ├── aes.strategy.ts
│   │   │   ├── rsa.strategy.ts
│   │   │   ├── tls.strategy.ts
│   │   │   ├── hmac.strategy.ts
│   │   │   └── hybrid.strategy.ts
│   │   ├── managers/                  # Key & Certificate Managers
│   │   │   ├── key-manager.service.ts
│   │   │   ├── cert-manager.service.ts
│   │   │   ├── rotation.service.ts
│   │   │   └── revocation.service.ts
│   │   ├── utils/                     # Encryption Utilities
│   │   │   ├── encryption-utils.ts
│   │   │   ├── key-utils.ts
│   │   │   ├── cert-utils.ts
│   │   │   ├── masking-utils.ts
│   │   │   ├── chunked-utils.ts
│   │   │   ├── cache-utils.ts
│   │   │   └── integrity-utils.ts
│   │   ├── interfaces/                # Encryption Interfaces
│   │   │   ├── encryption.interface.ts
│   │   │   ├── strategy.interface.ts
│   │   │   ├── key-manager.interface.ts
│   │   │   └── cert-manager.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai Encryption Layer

- [ ] [None] Thiết kế kiến trúc Encryption Layer (module, service, strategy, key/cert management, runtime vs management)
- [ ] [None] Xây dựng các strategy: AES-256 (symmetric), RSA/ECC (asymmetric), mutual TLS (transport), HMAC (integrity), auto-negotiation
- [ ] [None] Định nghĩa interface chuẩn cho strategy (IEncryptionStrategy, ISigningStrategy)
- [ ] [None] Định nghĩa DTO/schema cho encrypt/decrypt request/response
- [ ] [None] Hỗ trợ encrypt/decrypt từng field hoặc toàn bộ payload
- [ ] [None] Hỗ trợ masking dữ liệu nhạy cảm khi log, audit log
- [ ] [None] Tích hợp encrypt/decrypt với SyncService, PullService, API, file upload, event bus, jobs
- [ ] [None] Hỗ trợ encrypt file lớn (streaming), chunked encryption, resume file encryption khi gián đoạn, verify file integrity, encrypt file metadata
- [ ] [None] Hỗ trợ encrypt metadata, audit log, conflict log nếu có sensitive data
- [ ] [None] Quản lý key/cert an toàn: generate, rotation, revoke, audit log truy cập key, scope sử dụng key, tách role quản lý key
- [ ] [None] Hỗ trợ key/cert per tenant, multi-tenant key isolation, tenant-specific compliance policy
- [ ] [None] Hỗ trợ caching layer cho key/cert ngắn hạn (in-memory)
- [ ] [None] Hỗ trợ encrypt/decrypt trên nhiều môi trường (dev, staging, prod)
- [ ] [None] Hỗ trợ compliance: kiểm tra cấu hình, log, audit theo HIPAA, GDPR, ISO 27001
- [ ] [None] Chống downgrade attack, enforce min version/key length
- [ ] [None] Kiểm padding oracle attack (AES-CBC), hạn chế log plaintext trong error trace

### Bảo mật & Isolation

- [ ] [None] Lưu key/cert an toàn (vault, HSM, env secret), không hardcode
- [ ] [None] Audit log mọi thao tác encrypt/decrypt, truy cập key/cert, log usage analytics
- [ ] [None] Cảnh báo khi có truy cập key/cert bất thường, key/cert sắp hết hạn, entropy thấp
- [ ] [None] Hỗ trợ rotate key/cert định kỳ, revoke khi nghi ngờ lộ, auto revoke nếu không dùng lâu
- [ ] [None] Hỗ trợ RBAC: chỉ user/role đủ quyền mới được decrypt dữ liệu, scope key
- [ ] [None] Hỗ trợ encrypt dữ liệu backup, snapshot, log

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho encrypt/decrypt (latency, error rate, key usage, entropy...)
- [ ] [None] Alert khi encrypt/decrypt fail, key/cert hết hạn, rotate/revoke, miss config
- [ ] [None] Structured logging (tenantId, operation, keyId, traceId, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho encryption
- [ ] [None] Cảnh báo khi không có key phù hợp cho tenant/kênh sync

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho từng strategy, key/cert management, caching
- [ ] [None] Test encrypt/decrypt multi-tenant, isolation key, scope key
- [ ] [None] Test resilience: key/cert revoke, rotate, failover, simulate key loss
- [ ] [None] Test performance: encrypt/decrypt file lớn, batch payload, caching
- [ ] [None] Test masking log, audit log, hạn chế log plaintext
- [ ] [None] Test compliance: log, audit, cấu hình theo HIPAA/GDPR/ISO
- [ ] [None] Fuzz testing input: test dữ liệu bất thường, payload lỗi, input lớn đột biến
- [ ] [None] Test backward compatibility key versioning, decrypt dữ liệu cũ
- [ ] [None] Test resume file encryption, verify file integrity, encrypt file metadata

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các strategy, flow encrypt/decrypt, hướng dẫn tích hợp, asset audit
- [ ] [None] Có script generate/rotate/revoke key/cert
- [ ] [None] Có CI/CD pipeline tự động chạy test encryption, kiểm tra Vault/KMS
- [ ] [None] Tài liệu hóa pipeline build, test, deploy encryption-layer
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi encrypt dữ liệu thật

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ envelope encryption (multi-layer key)
- [ ] [None] Hỗ trợ BYOK (Bring Your Own Key), KMS/AWS Secrets Manager/Azure Key Vault
- [ ] [None] Hỗ trợ hardware HSM integration
- [ ] [None] Test backup/restore key/cert, rotation history
- [ ] [None] Test migration schema encryption giữa các version
- [ ] [None] Zero Trust Encryption Support (không server nào giữ plaintext)
- [ ] [None] Hybrid encryption (asymmetric encrypt key + symmetric encrypt data)
- [ ] [None] Remote key validation (OCSP, CRL)
