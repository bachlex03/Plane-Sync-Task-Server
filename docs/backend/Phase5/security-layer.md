# Checklist: Rate Limit & IP Whitelist – Security Layer Toàn Hệ Thống

> **Lưu ý quan trọng:**
>
> - Rate limit và IP whitelist là hai lớp bảo vệ quan trọng trong Security Layer toàn hệ thống, giúp ngăn chặn abuse, DDoS, brute force, và kiểm soát truy cập theo chính sách.
> - Checklist này tập trung vào kiến trúc, triển khai, policy, multi-tenant, dynamic rule, API, logging, monitoring, resilience, compliance, testing cho rate limit và IP whitelist.

## Cấu trúc thư mục

```
apps/backend/
├── security-service/                   # Security Service
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── security.controller.ts
│   │   ├── rate-limit/                # Rate Limit Module
│   │   │   ├── rate-limit.module.ts
│   │   │   ├── rate-limit.service.ts
│   │   │   ├── rate-limit.guard.ts
│   │   │   ├── rate-limit.config.ts
│   │   │   ├── strategies/            # Rate Limit Strategies
│   │   │   │   ├── fixed-window.strategy.ts
│   │   │   │   ├── sliding-window.strategy.ts
│   │   │   │   ├── token-bucket.strategy.ts
│   │   │   │   ├── leaky-bucket.strategy.ts
│   │   │   │   ├── adaptive.strategy.ts
│   │   │   │   └── burst.strategy.ts
│   │   │   ├── utils/                 # Rate Limit Utilities
│   │   │   │   ├── rate-limit-logger.ts
│   │   │   │   ├── rate-limit-metrics.ts
│   │   │   │   ├── rate-limit-cache.ts
│   │   │   │   ├── rate-limit-validator.ts
│   │   │   │   └── rate-limit-policy.ts
│   │   │   ├── policies/              # Rate Limit Policies
│   │   │   │   ├── global-policy.ts
│   │   │   │   ├── tenant-policy.ts
│   │   │   │   ├── endpoint-policy.ts
│   │   │   │   ├── user-policy.ts
│   │   │   │   └── api-key-policy.ts
│   │   │   ├── guards/                # Rate Limit Guards
│   │   │   │   ├── rate-limit-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rbac.guard.ts
│   │   │   ├── interfaces/            # Rate Limit Interfaces
│   │   │   │   ├── rate-limit.interface.ts
│   │   │   │   ├── strategy.interface.ts
│   │   │   │   ├── policy.interface.ts
│   │   │   │   └── guard.interface.ts
│   │   │   ├── cli/                   # Rate Limit CLI Commands
│   │   │   │   ├── rate-limit.cli.ts
│   │   │   │   ├── policy-manage.cli.ts
│   │   │   │   ├── test-rate-limit.cli.ts
│   │   │   │   └── rate-limit-status.cli.ts
│   │   │   └── __tests__/             # Rate Limit Tests
│   │   │       ├── rate-limit.service.spec.ts
│   │   │       ├── rate-limit-guards.spec.ts
│   │   │       ├── rate-limit-strategies.spec.ts
│   │   │       └── rate-limit-policies.spec.ts
│   │   ├── ip-whitelist/              # IP Whitelist Module
│   │   │   ├── ip-whitelist.module.ts
│   │   │   ├── ip-whitelist.service.ts
│   │   │   ├── ip-whitelist.guard.ts
│   │   │   ├── ip-whitelist.config.ts
│   │   │   ├── utils/                 # IP Whitelist Utilities
│   │   │   │   ├── ip-logger.ts
│   │   │   │   ├── ip-metrics.ts
│   │   │   │   ├── ip-cache.ts
│   │   │   │   ├── ip-validator.ts
│   │   │   │   ├── geoip-resolver.ts
│   │   │   │   └── cidr-calculator.ts
│   │   │   ├── policies/              # IP Whitelist Policies
│   │   │   │   ├── global-whitelist.ts
│   │   │   │   ├── tenant-whitelist.ts
│   │   │   │   ├── endpoint-whitelist.ts
│   │   │   │   ├── geo-whitelist.ts
│   │   │   │   └── dynamic-whitelist.ts
│   │   │   ├── guards/                # IP Whitelist Guards
│   │   │   │   ├── ip-whitelist-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rbac.guard.ts
│   │   │   ├── interfaces/            # IP Whitelist Interfaces
│   │   │   │   ├── ip-whitelist.interface.ts
│   │   │   │   ├── policy.interface.ts
│   │   │   │   ├── guard.interface.ts
│   │   │   │   └── geoip.interface.ts
│   │   │   ├── cli/                   # IP Whitelist CLI Commands
│   │   │   │   ├── ip-whitelist.cli.ts
│   │   │   │   ├── whitelist-manage.cli.ts
│   │   │   │   ├── test-ip-whitelist.cli.ts
│   │   │   │   └── ip-whitelist-status.cli.ts
│   │   │   └── __tests__/             # IP Whitelist Tests
│   │   │       ├── ip-whitelist.service.spec.ts
│   │   │       ├── ip-whitelist-guards.spec.ts
│   │   │       ├── ip-whitelist-policies.spec.ts
│   │   │       └── geoip.spec.ts
│   │   ├── firewall/                  # Firewall Module
│   │   │   ├── firewall.module.ts
│   │   │   ├── firewall.service.ts
│   │   │   ├── firewall.guard.ts
│   │   │   ├── rules/                 # Firewall Rules
│   │   │   │   ├── rule-engine.ts
│   │   │   │   ├── rule-validator.ts
│   │   │   │   ├── rule-manager.ts
│   │   │   │   └── rule-cache.ts
│   │   │   ├── actions/               # Firewall Actions
│   │   │   │   ├── block-action.ts
│   │   │   │   ├── allow-action.ts
│   │   │   │   ├── redirect-action.ts
│   │   │   │   └── log-action.ts
│   │   │   └── __tests__/             # Firewall Tests
│   │   │       ├── firewall.service.spec.ts
│   │   │       ├── rule-engine.spec.ts
│   │   │       └── actions.spec.ts
│   │   ├── waf/                       # Web Application Firewall
│   │   │   ├── waf.module.ts
│   │   │   ├── waf.service.ts
│   │   │   ├── waf.guard.ts
│   │   │   ├── rules/                 # WAF Rules
│   │   │   │   ├── sql-injection.ts
│   │   │   │   ├── xss-protection.ts
│   │   │   │   ├── csrf-protection.ts
│   │   │   │   └── path-traversal.ts
│   │   │   ├── scanners/              # WAF Scanners
│   │   │   │   ├── request-scanner.ts
│   │   │   │   ├── payload-scanner.ts
│   │   │   │   ├── header-scanner.ts
│   │   │   │   └── signature-scanner.ts
│   │   │   └── __tests__/             # WAF Tests
│   │   │       ├── waf.service.spec.ts
│   │   │       ├── scanners.spec.ts
│   │   │       └── rules.spec.ts
│   │   ├── ddos-protection/           # DDoS Protection
│   │   │   ├── ddos.module.ts
│   │   │   ├── ddos.service.ts
│   │   │   ├── ddos.guard.ts
│   │   │   ├── detectors/             # DDoS Detectors
│   │   │   │   ├── volume-detector.ts
│   │   │   │   ├── pattern-detector.ts
│   │   │   │   ├── anomaly-detector.ts
│   │   │   │   └── behavioral-detector.ts
│   │   │   ├── mitigators/            # DDoS Mitigators
│   │   │   │   ├── rate-limiting.ts
│   │   │   │   ├── ip-blocking.ts
│   │   │   │   ├── traffic-shaping.ts
│   │   │   │   └── challenge-response.ts
│   │   │   └── __tests__/             # DDoS Tests
│   │   │       ├── ddos.service.spec.ts
│   │   │       ├── detectors.spec.ts
│   │   │       └── mitigators.spec.ts
│   │   ├── api/                       # Security API
│   │   │   ├── security.controller.ts
│   │   │   ├── rate-limit.controller.ts
│   │   │   ├── ip-whitelist.controller.ts
│   │   │   ├── firewall.controller.ts
│   │   │   ├── waf.controller.ts
│   │   │   └── ddos.controller.ts
│   │   ├── logs/                      # Security Logging
│   │   │   ├── security-log.entity.ts
│   │   │   ├── rate-limit-log.entity.ts
│   │   │   ├── ip-whitelist-log.entity.ts
│   │   │   ├── firewall-log.entity.ts
│   │   │   ├── waf-log.entity.ts
│   │   │   ├── ddos-log.entity.ts
│   │   │   └── audit-log.entity.ts
│   │   ├── monitoring/                # Security Monitoring
│   │   │   ├── security-metrics.ts
│   │   │   ├── security-alerts.ts
│   │   │   ├── security-dashboard.ts
│   │   │   └── security-reporter.ts
│   │   ├── guards/                    # Security Guards
│   │   │   ├── security-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/                # Security Interfaces
│   │   │   ├── security.interface.ts
│   │   │   ├── rate-limit.interface.ts
│   │   │   ├── ip-whitelist.interface.ts
│   │   │   ├── firewall.interface.ts
│   │   │   ├── waf.interface.ts
│   │   │   └── ddos.interface.ts
│   │   └── __tests__/                 # Security Tests
│   │       ├── security-layer.e2e-spec.ts
│   │       ├── security-integration.spec.ts
│   │       ├── security-performance.spec.ts
│   │       └── security-resilience.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── security-e2e.spec.ts
│   │   ├── multi-tenant-security.spec.ts
│   │   ├── rate-limit-e2e.spec.ts
│   │   └── ip-whitelist-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── security/                           # Security Library
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── rate-limit/                # Base Rate Limit Functionality
│   │   │   ├── rate-limit.service.ts
│   │   │   ├── rate-limit-strategy.ts
│   │   │   ├── rate-limit-guard.ts
│   │   │   ├── rate-limit-policy.ts
│   │   │   ├── rate-limit-cache.ts
│   │   │   └── rate-limit-metrics.ts
│   │   ├── ip-whitelist/              # Base IP Whitelist Functionality
│   │   │   ├── ip-whitelist.service.ts
│   │   │   ├── ip-whitelist-guard.ts
│   │   │   ├── ip-whitelist-policy.ts
│   │   │   ├── ip-whitelist-cache.ts
│   │   │   ├── geoip-resolver.ts
│   │   │   └── cidr-calculator.ts
│   │   ├── firewall/                  # Base Firewall Functionality
│   │   │   ├── firewall.service.ts
│   │   │   ├── firewall-guard.ts
│   │   │   ├── rule-engine.ts
│   │   │   └── rule-manager.ts
│   │   ├── waf/                       # Base WAF Functionality
│   │   │   ├── waf.service.ts
│   │   │   ├── waf-guard.ts
│   │   │   ├── request-scanner.ts
│   │   │   └── signature-scanner.ts
│   │   ├── ddos/                      # Base DDoS Protection
│   │   │   ├── ddos.service.ts
│   │   │   ├── ddos-guard.ts
│   │   │   ├── volume-detector.ts
│   │   │   └── anomaly-detector.ts
│   │   ├── utils/                     # Security Utilities
│   │   │   ├── security-utils.ts
│   │   │   ├── rate-limit-utils.ts
│   │   │   ├── ip-whitelist-utils.ts
│   │   │   ├── firewall-utils.ts
│   │   │   ├── waf-utils.ts
│   │   │   └── ddos-utils.ts
│   │   ├── interfaces/                # Security Interfaces
│   │   │   ├── security.interface.ts
│   │   │   ├── rate-limit.interface.ts
│   │   │   ├── ip-whitelist.interface.ts
│   │   │   ├── firewall.interface.ts
│   │   │   ├── waf.interface.ts
│   │   │   └── ddos.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc đã làm

- [ ] [None] (Điền các task đã hoàn thành tại đây)

## 2. Những việc cần làm

### Kiến trúc & Policy

- [ ] [None] Thiết kế module rate limit & IP whitelist cho toàn hệ thống (service, guard, config, strategy, utils)
- [ ] [None] Định nghĩa policy rate limit: global, per endpoint, per tenant, per user, per IP, per API key
- [ ] [None] Định nghĩa policy IP whitelist: global, per endpoint, per tenant, per environment
- [ ] [None] Hỗ trợ policy fallback: nếu không tìm thấy policy của tenant → fallback global default hoặc reject rõ ràng
- [ ] [None] Hỗ trợ policy theo nhóm API (tag/grouping): ví dụ: /auth/_, /internal/_, /billing/\*
- [ ] [None] Policy theo HTTP method (GET vs POST có rule khác nhau)
- [ ] [None] Phân biệt policy theo môi trường (dev/test/staging/prod): có flag bật/tắt
- [ ] [None] Kiểm soát tối đa số rule per tenant để tránh abuse (policy quota)
- [ ] [None] Hỗ trợ dynamic rule: thay đổi policy mà không cần deploy lại (hot reload, API, config service)
- [ ] [None] Hỗ trợ multi-tenant: mỗi tenant có rule riêng, isolation, override policy
- [ ] [None] Hỗ trợ whitelist/blacklist IP theo CIDR, range, geoIP
- [ ] [None] Hỗ trợ allowlist/denylist cho API key, user agent, referrer
- [ ] [None] Hỗ trợ burst limit, slow mode, penalty/quarantine IP khi vi phạm
- [ ] [None] Hỗ trợ policy exception (bypass cho admin, internal service, healthcheck...)
- [ ] [None] Hỗ trợ policy versioning, audit trail thay đổi policy

### Triển khai & Tích hợp

- [ ] [None] Có adapter tích hợp với gateway/middleware khác (e.g., NGINX, Envoy, Traefik nếu có)
- [ ] [None] Tích hợp với reverse proxy để chặn từ sớm (IP whitelist tại edge)
- [ ] [None] Cho phép tích hợp policy qua service mesh (Sidecar hoặc WASM extension nếu dùng Istio, Linkerd...)

### Cấu hình & API

- [ ] [None] Định nghĩa schema config cho rate limit & IP whitelist (YAML/JSON, env, API)
- [ ] [None] API quản lý policy: tạo, sửa, xóa, xem, export/import policy
- [ ] [None] API kiểm tra trạng thái rate limit/IP whitelist cho 1 request cụ thể
- [ ] [None] Hỗ trợ batch API cho quản lý nhiều rule cùng lúc
- [ ] [None] Hỗ trợ validate, test policy trước khi apply
- [ ] [None] Hỗ trợ rollback policy khi phát hiện lỗi

### Logging & Monitoring

- [ ] [None] Structured logging: tenantId, userId, IP, endpoint, rule, status, error, latency
- [ ] [None] Expose Prometheus metrics: rate_limit_block_total, ip_whitelist_block_total, rate_limit_latency, ip_whitelist_latency, tenantId, endpoint
- [ ] [None] Alert khi có burst/block bất thường, IP bị block nhiều lần, tenant bị rate limit liên tục
- [ ] [None] Alert theo tần suất vi phạm (ex: IP bị block 10 lần/phút)
- [ ] [None] Alert khi hệ thống vượt ngưỡng config: số rule quá nhiều, throughput cao bất thường
- [ ] [None] Dashboard so sánh tenant bình thường vs tenant bị abuse
- [ ] [None] Export metrics sang các hệ khác như Elastic, Loki, Datadog...
- [ ] [None] Dashboard/dev tool xem trạng thái rate limit, IP whitelist, lịch sử block, thống kê lỗi, alert
- [ ] [None] Log audit trail mọi thay đổi policy, unblock, bypass

### Compliance & Privacy

- [ ] [None] Mask IP trong log nếu bật chế độ ẩn danh/tuân thủ bảo mật
- [ ] [None] TTL cho IP log (auto purge sau 7-30 ngày theo chính sách)
- [ ] [None] Khả năng xóa toàn bộ log theo yêu cầu của tenant (Right to be forgotten – GDPR)
- [ ] [None] Hỗ trợ audit changelog: ai đã chỉnh sửa rule, khi nào, từ IP nào

### Resilience & Compliance

- [ ] [None] Retry, circuit breaker, failover cho service rate limit/IP whitelist
- [ ] [None] Test resilience: simulate burst, DDoS, failover, policy reload, cache miss
- [ ] [None] Test lỗi khi backend policy service bị mất kết nối (timeout → fallback hoặc reject)
- [ ] [None] Compliance: log access, data retention, audit trail, GDPR (xóa IP theo yêu cầu)
- [ ] [None] Hỗ trợ backup/restore policy, log, config

### Testing

- [ ] [None] Unit test, integration test, e2e test cho rate limit, IP whitelist, policy API
- [ ] [None] Test multi-tenant: rule riêng biệt, isolation, override
- [ ] [None] Test concurrency: nhiều rule apply cùng lúc từ nhiều thread/request
- [ ] [None] Test delay propagation nếu dùng cache/distributed config (redis, etcd, konsul...)
- [ ] [None] Test recovery sau khi hot reload thất bại
- [ ] [None] Test performance: đo throughput, latency, block rate
- [ ] [None] Test rollback policy, test validate policy, test batch API
- [ ] [None] Test alert, dashboard, log, audit trail

### Tài liệu hóa & DevOps

- [ ] [None] Policy migration tool khi đổi schema rule giữa các version
- [ ] [None] CLI/SDK cho quản lý policy nhanh (không cần qua UI)
- [ ] [None] Policy dry-run/test-mode (áp dụng rule nhưng không thực thi, chỉ log)
- [ ] [None] Auto snapshot chính sách (định kỳ lưu lại, so sánh version)
- [ ] [None] Tạo changelog hoặc diff khi export policy (so sánh với bản cũ)
- [ ] [None] Tài liệu hóa policy, config, API, flow xử lý rate limit/IP whitelist
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy security layer
- [ ] [None] Script seed/test policy, inject lỗi, test resilience

## 3. Bổ sung checklist nâng cao

- [ ] [None] AI/ML-based anomaly detection trên pattern IP, tenant bị block
- [ ] [None] Gợi ý policy dựa trên historical usage pattern
- [ ] [None] Dynamic rate limit theo trạng thái hệ thống (ví dụ: giảm limit nếu backend đang overload)
- [ ] [None] Graph/visualization cây policy áp dụng theo endpoint → giúp debug policy conflict
- [ ] [None] Hỗ trợ geoIP-based policy (chặn IP theo quốc gia/khu vực)
- [ ] [None] Hỗ trợ policy theo thời gian (chặn theo khung giờ, maintenance window)
- [ ] [None] Hỗ trợ self-service cho tenant quản lý rule của mình (UI/API)
- [ ] [None] Hỗ trợ export log/policy sang SIEM, log aggregator
- [ ] [None] Định nghĩa lifecycle cho policy (created, active, deprecated, archived)
- [ ] [None] Định nghĩa SLA/SLO cho security layer (uptime, latency, block accuracy, alert response time)
