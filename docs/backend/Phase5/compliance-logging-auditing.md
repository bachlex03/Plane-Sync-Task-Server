# Checklist: Compliance (Logging, Auditing) – Security Layer Toàn Hệ Thống

> **Lưu ý quan trọng:**
>
> - Logging và auditing là nền tảng cho compliance, forensic, bảo mật, phát hiện sự cố, và đáp ứng các tiêu chuẩn HIPAA, GDPR, SOC2, ISO 27001.
> - Checklist này tập trung vào kiến trúc, policy, multi-tenant, log schema, audit trail, retention, masking, export, monitoring, resilience, compliance, testing cho logging & auditing toàn hệ thống.
>
> **Cấu trúc thư mục mẫu cho Compliance Logging & Auditing Layer:**
>
> apps/backend/security-layer/
> ├── compliance/
> │ ├── logging.module.ts
> │ ├── logging.service.ts
> │ ├── logging.config.ts
> │ ├── audit.module.ts
> │ ├── audit.service.ts
> │ ├── audit.config.ts
> │ ├── schemas/
> │ │ ├── log.schema.ts
> │ │ ├── audit.schema.ts
> │ ├── exporters/
> │ │ ├── elastic-exporter.ts
> │ │ ├── loki-exporter.ts
> │ │ ├── siem-exporter.ts
> │ ├── utils/
> │ │ ├── log-formatter.ts
> │ │ ├── audit-formatter.ts
> │ │ ├── masking.ts
> │ │ ├── retention.ts
> │ ├── **tests**/
> │ │ ├── logging.service.spec.ts
> │ │ ├── audit.service.spec.ts

## 1. Những việc cần làm

### Kiến trúc & Policy

- [ ] [None] Thiết kế module logging & auditing cho toàn hệ thống (service, config, schema, exporter, utils)
- [ ] [None] Định nghĩa policy logging/auditing: global, per module, per tenant, per event, per data type
- [ ] [None] Hỗ trợ multi-tenant: log/audit riêng biệt từng tenant, isolation, override policy
- [ ] [None] Multi-region / geo-compliance: log/audit lưu trữ và xử lý theo vùng địa lý riêng biệt (tuân thủ GDPR, HIPAA)
- [ ] [None] Hỗ trợ dynamic rule: thay đổi policy log/audit mà không cần deploy lại (hot reload, API, config service)
- [ ] [None] Hỗ trợ versioning cho policy, audit trail thay đổi policy
- [ ] [None] Hỗ trợ policy exception (bypass cho internal, healthcheck, test...)
- [ ] [None] Hỗ trợ policy fallback: nếu không có policy → fallback global hoặc reject rõ ràng
- [ ] [None] Kiểm soát số lượng policy/log per tenant (quota)
- [ ] [None] Configurable sampling rate: sampling log theo loại log/audit, tenant, module
- [ ] [None] Throttling & rate-limit logging: chống log flooding, bảo vệ logger

### Log Schema & Audit Trail

- [ ] [None] Định nghĩa schema log/audit chuẩn: timestamp (ISO8601), tenantId, userId, actor, action, resource, resourceId, status, error, ip (IPv4/v6), location (geo), traceId, correlationId, sessionId, data, before/after, reason, severity, module, eventType, version, context, label, masking, retention, exported, source_service, source_host, deployment_env, app_version, git_commit_hash, request_headers, db_query_hash, masking_level
- [ ] [None] Field chuẩn hóa kiểu dữ liệu: enforce ISO8601 cho timestamp, UUID cho ID, IP v4/v6 hợp lệ, geo-location chuẩn
- [ ] [None] Correlation giữa log và audit: liên kết log kỹ thuật (request, DB, error) với audit logic (action người dùng) qua traceId, correlationId
- [ ] [None] Audit trail user impersonation: ghi rõ khi admin/CSKH truy cập thay user, trace toàn bộ chuỗi hành vi
- [ ] [None] Hỗ trợ log/audit theo chuẩn CEF, JSON, OpenTelemetry, syslog
- [ ] [None] Hỗ trợ audit trail: ghi nhận mọi thay đổi, truy cập, thao tác nhạy cảm, escalation, policy change
- [ ] [None] Hỗ trợ masking dữ liệu nhạy cảm (PII, PHI, secret, token, password...)
- [ ] [None] Hỗ trợ log/audit immutable (write-once, signed log, tamper-evident)
- [ ] [None] Hỗ trợ log/audit theo event sourcing (append-only, versioned)
- [ ] [None] Hỗ trợ log/audit theo lifecycle (created, active, archived, purged)

### Retention, Export & Privacy

- [ ] [None] Định nghĩa policy retention: thời gian lưu log/audit theo loại, tenant, event
- [ ] [None] Retention audit-able: log rõ thời điểm bắt đầu/xóa retention, ai thực hiện, hệ thống đã xóa gì
- [ ] [None] Hỗ trợ TTL, auto-purge, xóa log/audit theo yêu cầu tenant (GDPR, right to be forgotten)
- [ ] [None] Right to object (GDPR): tenant có thể từ chối bị audit/log thao tác không bắt buộc
- [ ] [None] Hỗ trợ export log/audit sang SIEM, Elastic, Loki, Splunk, S3, BigQuery...
- [ ] [None] Hỗ trợ export log/audit theo range thời gian, event, tenant, module
- [ ] [None] Hỗ trợ masking khi export log/audit
- [ ] [None] Hỗ trợ audit changelog: ai đã export, khi nào, lý do

### Monitoring & Alert

- [ ] [None] Expose Prometheus metrics: log_write_total, audit_event_total, log_error_total, audit_latency, tenantId, module, eventType
- [ ] [None] Alert khi có lỗi ghi log/audit, log/audit bị đầy, retention/purge fail, log/audit bị truy cập trái phép
- [ ] [None] Alert về bất thường hành vi: pattern bất thường (login sai nhiều, thao tác nhiều trên PII, truy cập giờ khuya, tài liệu cấm)
- [ ] [None] Auto mute log spam: phát hiện service lặp log lỗi giống nhau và tự mute/tách group
- [ ] [None] Dashboard/dev tool xem trạng thái log/audit, lịch sử, thống kê, alert
- [ ] [None] Log structured, label, traceId, context để SIEM dễ phân loại

### Resilience & Compliance

- [ ] [None] Retry, circuit breaker, failover cho logging/auditing service
- [ ] [None] Forward log offline: nếu mất kết nối SIEM/S3, ghi log tạm vào disk/local và forward lại khi online
- [ ] [None] Test resilience: simulate log backend down, exporter fail, policy reload, cache miss
- [ ] [None] Compliance: HIPAA, GDPR, SOC2, ISO 27001, log access, data retention, audit trail, immutable log
- [ ] [None] Compliance evidence generator: sinh báo cáo chứng minh hệ thống tuân thủ logging/auditing
- [ ] [None] Hỗ trợ backup/restore log/audit, policy, config

### Testing

- [ ] [None] Unit test, integration test, e2e test cho logging, auditing, policy API
- [ ] [None] Test multi-tenant: log/audit riêng biệt, isolation, override
- [ ] [None] Test performance: đo throughput, latency, error rate
- [ ] [None] Test rollback policy, test validate policy, test batch API
- [ ] [None] Test alert, dashboard, log, audit trail
- [ ] [None] Test masking, export, retention, purge, immutable log
- [ ] [None] Replay testing: replay log từ file/archive vào hệ thống mới để kiểm tra format/schema/version
- [ ] [None] Tamper test: thử chỉnh sửa log bằng tay và verify log bị phát hiện là không hợp lệ (hash, ký số, chain hash)

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa schema, policy, API, flow xử lý logging/auditing
- [ ] [None] Changelog cho policy/schema: version rõ ràng cho mỗi thay đổi (Git, changelog API)
- [ ] [None] Policy test DSL: viết file test policy bằng DSL (JSON/YAML) để test logic
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy logging/auditing layer
- [ ] [None] Script seed/test log/audit, inject lỗi, test resilience

## 2. Bổ sung checklist nâng cao

- [ ] [None] Tenant audit insight dashboard: giao diện insight cho từng tenant: hành vi, cảnh báo, audit tự động...
- [ ] [None] Replay log vào môi trường staging: dùng log thật (đã ẩn PII) để chạy e2e/stress/load test
- [ ] [None] Trusted timestamp authority (TSA): tích hợp timestamp server đảm bảo log đúng thời gian, không bị làm giả
- [ ] [None] Zero-trust logging architecture: các hệ thống log/audit không tin cậy nhau, cần xác thực/phân quyền rõ ràng trước khi ghi log
- [ ] [None] Hỗ trợ self-service cho tenant truy vấn/export log/audit của mình (UI/API)
- [ ] [None] Hỗ trợ AI/ML-based anomaly detection trên pattern log/audit
- [ ] [None] Hỗ trợ policy conflict detector, policy suggestion dựa trên usage
- [ ] [None] Hỗ trợ graph/visualize log/audit flow, event sourcing, retention
- [ ] [None] Định nghĩa SLA/SLO cho logging/auditing layer (uptime, latency, retention, alert response time)

## Cấu trúc thư mục

```
apps/backend/
├── security-service/                   # Security Service
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── security.controller.ts
│   │   ├── compliance/                # Compliance Module
│   │   │   ├── compliance.module.ts
│   │   │   ├── compliance.service.ts
│   │   │   ├── compliance.controller.ts
│   │   │   ├── logging/               # Logging Module
│   │   │   │   ├── logging.module.ts
│   │   │   │   ├── logging.service.ts
│   │   │   │   ├── logging.config.ts
│   │   │   │   ├── schemas/           # Log Schemas
│   │   │   │   │   ├── log.schema.ts
│   │   │   │   │   ├── security-log.schema.ts
│   │   │   │   │   ├── audit-log.schema.ts
│   │   │   │   │   ├── access-log.schema.ts
│   │   │   │   │   └── error-log.schema.ts
│   │   │   │   ├── exporters/         # Log Exporters
│   │   │   │   │   ├── elastic-exporter.ts
│   │   │   │   │   ├── loki-exporter.ts
│   │   │   │   │   ├── siem-exporter.ts
│   │   │   │   │   ├── splunk-exporter.ts
│   │   │   │   │   ├── s3-exporter.ts
│   │   │   │   │   └── bigquery-exporter.ts
│   │   │   │   ├── formatters/        # Log Formatters
│   │   │   │   │   ├── json-formatter.ts
│   │   │   │   │   ├── cef-formatter.ts
│   │   │   │   │   ├── syslog-formatter.ts
│   │   │   │   │   └── otel-formatter.ts
│   │   │   │   ├── utils/             # Logging Utilities
│   │   │   │   │   ├── log-formatter.ts
│   │   │   │   │   ├── log-masking.ts
│   │   │   │   │   ├── log-retention.ts
│   │   │   │   │   ├── log-correlation.ts
│   │   │   │   │   └── log-immutable.ts
│   │   │   │   └── __tests__/         # Logging Tests
│   │   │   │       ├── logging.service.spec.ts
│   │   │   │       ├── exporters.spec.ts
│   │   │   │       └── formatters.spec.ts
│   │   │   ├── auditing/              # Auditing Module
│   │   │   │   ├── audit.module.ts
│   │   │   │   ├── audit.service.ts
│   │   │   │   ├── audit.config.ts
│   │   │   │   ├── schemas/           # Audit Schemas
│   │   │   │   │   ├── audit.schema.ts
│   │   │   │   │   ├── user-audit.schema.ts
│   │   │   │   │   ├── data-audit.schema.ts
│   │   │   │   │   ├── system-audit.schema.ts
│   │   │   │   │   └── compliance-audit.schema.ts
│   │   │   │   ├── trail/             # Audit Trail
│   │   │   │   │   ├── audit-trail.service.ts
│   │   │   │   │   ├── event-sourcing.ts
│   │   │   │   │   ├── change-tracking.ts
│   │   │   │   │   └── version-control.ts
│   │   │   │   ├── utils/             # Auditing Utilities
│   │   │   │   │   ├── audit-formatter.ts
│   │   │   │   │   ├── audit-masking.ts
│   │   │   │   │   ├── audit-retention.ts
│   │   │   │   │   └── audit-immutable.ts
│   │   │   │   └── __tests__/         # Auditing Tests
│   │   │   │       ├── audit.service.spec.ts
│   │   │   │       ├── trail.spec.ts
│   │   │   │       └── formatters.spec.ts
│   │   │   ├── retention/             # Retention Management
│   │   │   │   ├── retention.service.ts
│   │   │   │   ├── ttl-manager.ts
│   │   │   │   ├── purge-manager.ts
│   │   │   │   └── gdpr-manager.ts
│   │   │   ├── masking/               # Data Masking
│   │   │   │   ├── masking.service.ts
│   │   │   │   ├── pii-masker.ts
│   │   │   │   ├── phi-masker.ts
│   │   │   │   ├── secret-masker.ts
│   │   │   │   └── token-masker.ts
│   │   │   ├── policies/              # Compliance Policies
│   │   │   │   ├── hipaa-policy.ts
│   │   │   │   ├── gdpr-policy.ts
│   │   │   │   ├── soc2-policy.ts
│   │   │   │   ├── iso27001-policy.ts
│   │   │   │   └── custom-policy.ts
│   │   │   ├── cli/                   # Compliance CLI Commands
│   │   │   │   ├── compliance.cli.ts
│   │   │   │   ├── log-manage.cli.ts
│   │   │   │   ├── audit-manage.cli.ts
│   │   │   │   ├── retention-manage.cli.ts
│   │   │   │   └── export-manage.cli.ts
│   │   │   ├── interfaces/            # Compliance Interfaces
│   │   │   │   ├── compliance.interface.ts
│   │   │   │   ├── logging.interface.ts
│   │   │   │   ├── auditing.interface.ts
│   │   │   │   ├── retention.interface.ts
│   │   │   │   └── masking.interface.ts
│   │   │   └── __tests__/             # Compliance Tests
│   │   │       ├── compliance.service.spec.ts
│   │   │       ├── retention.spec.ts
│   │   │       ├── masking.spec.ts
│   │   │       └── policies.spec.ts
│   │   ├── rbac/                      # RBAC Module
│   │   ├── input-validation/          # Input Validation Module
│   │   ├── rate-limit/                # Rate Limit Module
│   │   ├── ip-whitelist/              # IP Whitelist Module
│   │   ├── firewall/                  # Firewall Module
│   │   ├── waf/                       # WAF Module
│   │   ├── ddos-protection/           # DDoS Protection Module
│   │   ├── api/                       # Security API
│   │   ├── logs/                      # Security Logging
│   │   ├── monitoring/                # Security Monitoring
│   │   ├── guards/                    # Security Guards
│   │   ├── interfaces/                # Security Interfaces
│   │   └── __tests__/                 # Security Tests
│   ├── test/                          # E2E Tests
│   └── package.json
│
libs/backend/
├── security/                           # Security Library
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── compliance/                # Base Compliance Functionality
│   │   │   ├── compliance.service.ts
│   │   │   ├── logging.service.ts
│   │   │   ├── auditing.service.ts
│   │   │   ├── retention.service.ts
│   │   │   ├── masking.service.ts
│   │   │   ├── correlation.service.ts
│   │   │   └── immutable.service.ts
│   │   ├── rbac/                      # Base RBAC Functionality
│   │   ├── input-validation/          # Base Input Validation Functionality
│   │   ├── rate-limit/                # Base Rate Limit Functionality
│   │   ├── ip-whitelist/              # Base IP Whitelist Functionality
│   │   ├── firewall/                  # Base Firewall Functionality
│   │   ├── waf/                       # Base WAF Functionality
│   │   ├── ddos/                      # Base DDoS Protection
│   │   ├── utils/                     # Security Utilities
│   │   ├── interfaces/                # Security Interfaces
│   │   └── index.ts
│   ├── test/
│   └── package.json
```
