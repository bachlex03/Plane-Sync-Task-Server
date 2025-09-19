# Checklist: Xác thực 2 chiều (JWT hoặc mutual TLS) – Central System

> **Lưu ý quan trọng:**
>
> - Xác thực 2 chiều là yêu cầu bắt buộc để đảm bảo an toàn khi đồng bộ dữ liệu giữa Central System và các tenant.
> - Checklist này tập trung vào kiến trúc, triển khai, bảo mật, monitoring, resilience, compliance cho xác thực JWT và mutual TLS (mTLS), bao gồm cả CA riêng cho từng tenant, rotation, revoke, audit, self-service.

## Cấu trúc thư mục

```
apps/backend/
├── central-system/                    # Central System Service
│   ├── src/
│   │   ├── central.module.ts
│   │   ├── central.service.ts
│   │   ├── central.controller.ts
│   │   ├── auth/                     # Authentication Module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/           # Auth Strategies
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── mTLS.strategy.ts
│   │   │   │   ├── oauth.strategy.ts
│   │   │   │   ├── api-key.strategy.ts
│   │   │   │   └── hybrid.strategy.ts
│   │   │   ├── guards/               # Auth Guards
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   ├── mutual-tls.guard.ts
│   │   │   │   ├── tenant.guard.ts
│   │   │   │   ├── api-key.guard.ts
│   │   │   │   └── hybrid.guard.ts
│   │   │   ├── utils/                # Auth Utilities
│   │   │   │   ├── token-manager.ts
│   │   │   │   ├── cert-manager.ts
│   │   │   │   ├── ca-manager.ts
│   │   │   │   ├── audit-logger.ts
│   │   │   │   ├── rotation.ts
│   │   │   │   ├── revocation.ts
│   │   │   │   └── validation.ts
│   │   │   ├── dtos/                 # Auth DTOs
│   │   │   │   ├── auth-request.dto.ts
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── token.dto.ts
│   │   │   │   ├── cert.dto.ts
│   │   │   │   └── tenant-auth.dto.ts
│   │   │   ├── interfaces/           # Auth Interfaces
│   │   │   │   ├── auth.interface.ts
│   │   │   │   ├── strategy.interface.ts
│   │   │   │   ├── guard.interface.ts
│   │   │   │   └── tenant.interface.ts
│   │   │   ├── cli/                  # Auth CLI Commands
│   │   │   │   ├── token-rotate.cli.ts
│   │   │   │   ├── cert-rotate.cli.ts
│   │   │   │   ├── tenant-revoke.cli.ts
│   │   │   │   └── auth-status.cli.ts
│   │   │   ├── ui/                   # Auth UI Components
│   │   │   │   ├── tenant-self-service.tsx
│   │   │   │   ├── cert-management.tsx
│   │   │   │   ├── token-management.tsx
│   │   │   │   └── auth-dashboard.tsx
│   │   │   └── __tests__/            # Auth Tests
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── jwt.strategy.spec.ts
│   │   │       ├── mTLS.strategy.spec.ts
│   │   │       ├── auth-guards.spec.ts
│   │   │       ├── token-manager.spec.ts
│   │   │       ├── cert-manager.spec.ts
│   │   │       └── auth-isolation.spec.ts
│   │   ├── sync/                     # Sync Module
│   │   │   ├── sync.module.ts
│   │   │   ├── sync.service.ts
│   │   │   ├── sync.controller.ts
│   │   │   ├── dtos/                 # Sync DTOs
│   │   │   │   ├── sync-request.dto.ts
│   │   │   │   ├── sync-response.dto.ts
│   │   │   │   ├── sync-status.dto.ts
│   │   │   │   └── sync-metrics.dto.ts
│   │   │   ├── strategies/           # Sync Strategies
│   │   │   │   ├── full-sync.strategy.ts
│   │   │   │   ├── incremental-sync.strategy.ts
│   │   │   │   ├── batch-sync.strategy.ts
│   │   │   │   └── conflict-sync.strategy.ts
│   │   │   ├── utils/                # Sync Utilities
│   │   │   │   ├── checksum.ts
│   │   │   │   ├── sync-logger.ts
│   │   │   │   ├── versioning.ts
│   │   │   │   └── validation.ts
│   │   │   ├── guards/               # Sync Guards
│   │   │   │   ├── sync-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rate-limit.guard.ts
│   │   │   ├── interfaces/           # Sync Interfaces
│   │   │   │   ├── sync.interface.ts
│   │   │   │   ├── sync-strategy.interface.ts
│   │   │   │   └── sync-log.interface.ts
│   │   │   └── __tests__/            # Sync Tests
│   │   │       ├── sync.service.spec.ts
│   │   │       ├── sync.controller.spec.ts
│   │   │       ├── sync-strategies.spec.ts
│   │   │       └── sync-isolation.spec.ts
│   │   ├── metadata/                 # Metadata Module
│   │   │   ├── metadata.module.ts
│   │   │   ├── metadata.entity.ts
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata.controller.ts
│   │   │   ├── dtos/                 # Metadata DTOs
│   │   │   │   ├── metadata.dto.ts
│   │   │   │   ├── metadata-query.dto.ts
│   │   │   │   └── metadata-update.dto.ts
│   │   │   ├── utils/                # Metadata Utilities
│   │   │   │   ├── metadata-utils.ts
│   │   │   │   ├── versioning.ts
│   │   │   │   └── validation.ts
│   │   │   └── __tests__/            # Metadata Tests
│   │   │       ├── metadata.service.spec.ts
│   │   │       ├── metadata.controller.spec.ts
│   │   │       └── metadata-isolation.spec.ts
│   │   ├── logs/                     # Logging Module
│   │   │   ├── logs.module.ts
│   │   │   ├── sync-log.entity.ts
│   │   │   ├── sync-log.service.ts
│   │   │   ├── sync-log.controller.ts
│   │   │   ├── audit-log.entity.ts
│   │   │   ├── audit-log.service.ts
│   │   │   ├── audit-log.controller.ts
│   │   │   ├── utils/                # Logging Utilities
│   │   │   │   ├── log-utils.ts
│   │   │   │   ├── audit-utils.ts
│   │   │   │   └── retention.ts
│   │   │   └── __tests__/            # Logging Tests
│   │   │       ├── sync-log.service.spec.ts
│   │   │       ├── audit-log.service.spec.ts
│   │   │       └── log-retention.spec.ts
│   │   ├── monitoring/               # Monitoring Module
│   │   │   ├── monitoring.module.ts
│   │   │   ├── monitoring.service.ts
│   │   │   ├── monitoring.controller.ts
│   │   │   ├── exporters/            # Monitoring Exporters
│   │   │   │   ├── prometheus-exporter.ts
│   │   │   │   ├── custom-exporter.ts
│   │   │   │   ├── grafana-exporter.ts
│   │   │   │   └── alert-exporter.ts
│   │   │   ├── metrics/              # Metrics Collection
│   │   │   │   ├── sync-metrics.ts
│   │   │   │   ├── auth-metrics.ts
│   │   │   │   ├── performance-metrics.ts
│   │   │   │   └── business-metrics.ts
│   │   │   ├── alerts/               # Alert Management
│   │   │   │   ├── alert.service.ts
│   │   │   │   ├── alert-rules.ts
│   │   │   │   ├── alert-notification.ts
│   │   │   │   └── alert-escalation.ts
│   │   │   ├── utils/                # Monitoring Utilities
│   │   │   │   ├── monitoring-utils.ts
│   │   │   │   ├── metrics-utils.ts
│   │   │   │   ├── alert-utils.ts
│   │   │   │   └── dashboard-utils.ts
│   │   │   └── __tests__/            # Monitoring Tests
│   │   │       ├── monitoring.service.spec.ts
│   │   │       ├── metrics.spec.ts
│   │   │       └── alerts.spec.ts
│   │   ├── interfaces/               # Central System Interfaces
│   │   │   ├── central.interface.ts
│   │   │   ├── sync.interface.ts
│   │   │   ├── metadata.interface.ts
│   │   │   ├── auth.interface.ts
│   │   │   └── monitoring.interface.ts
│   │   └── __tests__/                # Central System Tests
│   │       ├── central-system.e2e-spec.ts
│   │       ├── central-integration.spec.ts
│   │       ├── central-performance.spec.ts
│   │       └── central-resilience.spec.ts
│   ├── test/                         # E2E Tests
│   │   ├── central-e2e.spec.ts
│   │   ├── multi-tenant-central.spec.ts
│   │   ├── sync-integration.spec.ts
│   │   └── auth-integration.spec.ts
│   └── package.json
│
libs/backend/
├── central/                           # Central System Library
│   ├── src/
│   │   ├── central.module.ts
│   │   ├── central.service.ts
│   │   ├── auth/                     # Base Auth Functionality
│   │   │   ├── auth.service.ts
│   │   │   ├── auth-strategy.ts
│   │   │   ├── auth-validator.ts
│   │   │   ├── auth-guard.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── mTLS.service.ts
│   │   │   ├── token-manager.ts
│   │   │   ├── cert-manager.ts
│   │   │   └── ca-manager.ts
│   │   ├── sync/                     # Base Sync Functionality
│   │   │   ├── sync.service.ts
│   │   │   ├── sync-strategy.ts
│   │   │   ├── sync-validator.ts
│   │   │   └── sync-logger.ts
│   │   ├── metadata/                 # Base Metadata Functionality
│   │   │   ├── metadata.service.ts
│   │   │   ├── metadata-entity.ts
│   │   │   └── metadata-validator.ts
│   │   ├── monitoring/               # Base Monitoring Functionality
│   │   │   ├── monitoring.service.ts
│   │   │   ├── metrics-collector.ts
│   │   │   ├── alert-manager.ts
│   │   │   └── exporter.ts
│   │   ├── utils/                    # Central Utilities
│   │   │   ├── central-utils.ts
│   │   │   ├── sync-utils.ts
│   │   │   ├── metadata-utils.ts
│   │   │   ├── auth-utils.ts
│   │   │   └── monitoring-utils.ts
│   │   ├── interfaces/               # Central Interfaces
│   │   │   ├── central.interface.ts
│   │   │   ├── sync.interface.ts
│   │   │   ├── metadata.interface.ts
│   │   │   ├── auth.interface.ts
│   │   │   └── monitoring.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Kiến trúc & Triển khai xác thực 2 chiều

- [ ] [None] Thiết kế module xác thực hỗ trợ cả JWT và mutual TLS (mTLS)
- [ ] [None] Cho phép cấu hình cấp độ xác thực theo endpoint (chỉ JWT, chỉ mTLS, hoặc cả hai)
- [ ] [None] Cho phép disable/enable từng phương thức xác thực (per tenant / per environment)
- [ ] [None] Hỗ trợ rolling update cho cert/token mà không làm gián đoạn tenant đang kết nối
- [ ] [None] Tối ưu performance khi xác thực đồng thời hàng ngàn yêu cầu từ nhiều tenant (multi-tenant pooling hoặc caching cert/token)
- [ ] [None] Hỗ trợ pinned public key hoặc fingerprint cho mTLS (nâng cao hơn CA trust)
- [ ] [None] Hỗ trợ auditing context propagation: gắn thông tin xác thực vào context trace end-to-end
- [ ] [None] Định nghĩa flow xác thực: handshake, token/cert exchange, validation, error handling
- [ ] [None] Hỗ trợ CA riêng cho từng tenant (custom root CA per tenant)
- [ ] [None] Hỗ trợ rotation, revoke, blacklist cho JWT/cert
- [ ] [None] Hỗ trợ JWT claim chuẩn (tenantId, exp, iat, jti, role, version, signature)
- [ ] [None] Hỗ trợ JWT signing algorithm mạnh (RS256, ES256)
- [ ] [None] Hỗ trợ mutual TLS: validate client cert, chain of trust, CRL/OCSP check
- [ ] [None] Hỗ trợ mapping cert → tenant, mapping token → tenant
- [ ] [None] Hỗ trợ xác thực đồng thời nhiều tenant (multi-tenant handshake)
- [ ] [None] Hỗ trợ fallback: nếu mTLS fail có thể dùng JWT (hoặc ngược lại, tùy policy)
- [ ] [None] Hỗ trợ audit log toàn bộ quá trình xác thực (success, fail, error, actor, IP, cert/token, reason)

### Bảo mật & Compliance

- [ ] [None] RBAC/ABAC cho endpoint xác thực (chỉ cho phép tenant hợp lệ truy cập)
- [ ] [None] Cơ chế xác thực yêu cầu replay protection cho JWT (nonce, jti chống tấn công phát lại)
- [ ] [None] Check CRL/OCSP cache TTL & fallback nếu CA/OCSP server tạm thời unavailable
- [ ] [None] Chính sách bảo mật cert/token cấp tenant (expire sau X ngày, rotate sau Y lần dùng)
- [ ] [None] Theo dõi và cảnh báo các hành vi bất thường: IP lạ, retry nhiều lần, expired cert reuse
- [ ] [None] Giao diện để tenant tự revoke hoặc rotate token/cert của họ
- [ ] [None] Mã hóa audit log (write-once hoặc signed log để chống chỉnh sửa)
- [ ] [None] Input validation, rate-limit, IP whitelist cho endpoint xác thực
- [ ] [None] Mã hóa private key/cert/token khi lưu trữ (Vault/KMS)
- [ ] [None] Không log private key/cert/token ra log file
- [ ] [None] Hỗ trợ JWT blacklist, cert revoke, cert rotation, token rotation
- [ ] [None] Hỗ trợ kiểm tra expiry, notBefore, audience, issuer, subject cho JWT/cert
- [ ] [None] Compliance: HIPAA, GDPR, log access, data retention, audit trail

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho xác thực (auth_request_total, auth_error_total, auth_latency_seconds, tenantId, method, certStatus, tokenStatus)
- [ ] [None] Metrics theo từng tenant hoặc nhóm tenant (auth_success_total{tenant="a"}…)
- [ ] [None] Lưu audit log theo chuẩn chuẩn hóa (CEF, JSON, hoặc OpenTelemetry logs)
- [ ] [None] Hỗ trợ export log đến SIEM hoặc log aggregator (Loki, Elastic, Splunk)
- [ ] [None] Truy vết xác thực vào centralized tracing tool (Jaeger/Tempo + tenant ID)
- [ ] [None] Alert khi xác thực fail liên tục, cert/token sắp hết hạn, cert/token bị revoke
- [ ] [None] Structured logging: tenantId, actor, certId, tokenId, status, error, latency
- [ ] [None] Dashboard/dev tool xem trạng thái xác thực, lịch sử, thống kê lỗi, alert

### Resilience & Testing

- [ ] [None] Retry, circuit breaker, failover cho xác thực (đặc biệt khi validate cert/token với CA/OCSP)
- [ ] [None] Tạo bộ test vector cho từng kiểu lỗi (token sai claim, cert sai CN, chain không tin cậy…)
- [ ] [None] Thử nghiệm under None load (stress test auth 1000 req/s với 50 tenant đồng thời)
- [ ] [None] Test rollback khi update cert/token bị lỗi
- [ ] [None] Mô phỏng lỗi CA hoặc OCSP service (simulate CA downtime)
- [ ] [None] Test resilience: simulate cert/token expired, revoked, invalid, network error
- [ ] [None] Unit test, integration test, e2e test cho JWT, mTLS, CA, revoke, rotation
- [ ] [None] Test multi-tenant: xác thực đồng thời nhiều tenant, isolate tenant
- [ ] [None] Test performance: đo throughput, latency, error rate

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu mô tả lỗi xác thực phổ biến và cách xử lý (để dev và tenant debug)
- [ ] [None] Dashboard real-time cho dev/ops kiểm tra trạng thái xác thực (live token/cert)
- [ ] [None] Script CLI để revoke/rotate cert/token thủ công (cho incident response)
- [ ] [None] Mẫu policy mTLS/token chuẩn có thể apply cho từng loại tenant (hospital/patient/admin)
- [ ] [None] Cảnh báo cert/token sắp hết hạn qua email/SMS/webhook (tenant nhận trực tiếp)
- [ ] [None] Tài liệu hóa flow xác thực, policy, rotation, revoke, mapping cert/token → tenant
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy auth module
- [ ] [None] Script seed/test cert/token, inject lỗi, test resilience

### Tích hợp hệ thống ngoài (SaaS/3rd-party)

- [ ] [None] Hỗ trợ JWT issuer từ SSO của bệnh viện (OIDC, SAML) và ánh xạ về tenant nội bộ
- [ ] [None] Cho phép xác thực external API key nếu có hệ thống bên ngoài tích hợp (CDSS, PACS, LIS…)
- [ ] [None] Thử nghiệm cross-domain JWT (subdomain → central → tenant) nếu liên quan CORS hoặc frontend auth forwarding

### Giao diện & Tự phục vụ Tenant

- [ ] [None] Giao diện UI để tenant tự tạo cert/token, revoke, rotate
- [ ] [None] Cho phép audit lịch sử cert/token sử dụng theo ngày/giờ/IP/actor
- [ ] [None] Cho phép tenant chọn phương thức xác thực mặc định (JWT/mTLS)

## 3. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ xác thực đa lớp (JWT + mTLS + API key nếu cần)
- [ ] [None] Hỗ trợ xác thực federated (OIDC/SAML) nếu tích hợp hệ thống ngoài
- [ ] [None] Hỗ trợ auto-renew cert/token, cảnh báo trước khi hết hạn
- [ ] [None] Hỗ trợ simulate cert/token compromise để test incident response
- [ ] [None] Định nghĩa lifecycle cho cert/token (created, active, revoked, expired, rotated)
- [ ] [None] Định nghĩa SLA/SLO cho auth API (uptime, latency, error rate, alert response time)
- [ ] [None] Tích hợp công cụ visualize audit log xác thực (dashboard, BI tool)
