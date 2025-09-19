# Checklist: RBAC Đa Cấp (User, Chuyên Ngành, Phòng Ban...) – Security Layer Toàn Hệ Thống

> **Lưu ý quan trọng:**
>
> - RBAC đa cấp là nền tảng kiểm soát truy cập chi tiết theo user, vai trò, chuyên ngành, phòng ban, nhóm, tổ chức, giúp đảm bảo bảo mật, phân quyền linh hoạt, tuân thủ quy định ngành y tế.
> - Checklist này tập trung vào kiến trúc, policy, multi-tenant, role/group/department/specialty, dynamic rule, API, logging, monitoring, resilience, compliance, testing cho RBAC toàn hệ thống.

## Cấu trúc thư mục

```
apps/backend/
├── security-service/                   # Security Service
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── security.controller.ts
│   │   ├── rbac/                      # RBAC Module
│   │   │   ├── rbac.module.ts
│   │   │   ├── rbac.service.ts
│   │   │   ├── rbac.controller.ts
│   │   │   ├── rbac.config.ts
│   │   │   ├── policies/              # RBAC Policies
│   │   │   │   ├── user.policy.ts
│   │   │   │   ├── role.policy.ts
│   │   │   │   ├── department.policy.ts
│   │   │   │   ├── specialty.policy.ts
│   │   │   │   ├── group.policy.ts
│   │   │   │   ├── organization.policy.ts
│   │   │   │   ├── resource.policy.ts
│   │   │   │   ├── action.policy.ts
│   │   │   │   ├── context.policy.ts
│   │   │   │   └── attribute.policy.ts
│   │   │   ├── strategies/            # RBAC Strategies
│   │   │   │   ├── role-hierarchy.strategy.ts
│   │   │   │   ├── attribute-based.strategy.ts
│   │   │   │   ├── context-aware.strategy.ts
│   │   │   │   ├── time-based.strategy.ts
│   │   │   │   ├── location-based.strategy.ts
│   │   │   │   ├── resource-based.strategy.ts
│   │   │   │   └── emergency.strategy.ts
│   │   │   ├── models/                # RBAC Models
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── role.model.ts
│   │   │   │   ├── permission.model.ts
│   │   │   │   ├── department.model.ts
│   │   │   │   ├── specialty.model.ts
│   │   │   │   ├── group.model.ts
│   │   │   │   ├── organization.model.ts
│   │   │   │   └── resource.model.ts
│   │   │   ├── guards/                # RBAC Guards
│   │   │   │   ├── rbac-auth.guard.ts
│   │   │   │   ├── role.guard.ts
│   │   │   │   ├── permission.guard.ts
│   │   │   │   ├── department.guard.ts
│   │   │   │   ├── specialty.guard.ts
│   │   │   │   ├── resource.guard.ts
│   │   │   │   └── context.guard.ts
│   │   │   ├── decorators/            # RBAC Decorators
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   ├── permissions.decorator.ts
│   │   │   │   ├── departments.decorator.ts
│   │   │   │   ├── specialties.decorator.ts
│   │   │   │   ├── resources.decorator.ts
│   │   │   │   └── context.decorator.ts
│   │   │   ├── utils/                 # RBAC Utilities
│   │   │   │   ├── rbac-logger.ts
│   │   │   │   ├── rbac-metrics.ts
│   │   │   │   ├── rbac-cache.ts
│   │   │   │   ├── rbac-validator.ts
│   │   │   │   ├── policy-engine.ts
│   │   │   │   ├── token-manager.ts
│   │   │   │   └── session-manager.ts
│   │   │   ├── templates/             # RBAC Templates
│   │   │   │   ├── hospital.template.ts
│   │   │   │   ├── clinic.template.ts
│   │   │   │   ├── lab.template.ts
│   │   │   │   ├── pharmacy.template.ts
│   │   │   │   └── emergency.template.ts
│   │   │   ├── integrations/          # RBAC Integrations
│   │   │   │   ├── hrm-integration.ts
│   │   │   │   ├── schedule-integration.ts
│   │   │   │   ├── pacs-integration.ts
│   │   │   │   ├── lis-integration.ts
│   │   │   │   └── workflow-integration.ts
│   │   │   ├── cli/                   # RBAC CLI Commands
│   │   │   │   ├── rbac.cli.ts
│   │   │   │   ├── policy-manage.cli.ts
│   │   │   │   ├── role-manage.cli.ts
│   │   │   │   ├── test-rbac.cli.ts
│   │   │   │   └── rbac-audit.cli.ts
│   │   │   ├── interfaces/            # RBAC Interfaces
│   │   │   │   ├── rbac.interface.ts
│   │   │   │   ├── policy.interface.ts
│   │   │   │   ├── role.interface.ts
│   │   │   │   ├── permission.interface.ts
│   │   │   │   ├── guard.interface.ts
│   │   │   │   └── template.interface.ts
│   │   │   └── __tests__/             # RBAC Tests
│   │   │       ├── rbac.service.spec.ts
│   │   │       ├── rbac.controller.spec.ts
│   │   │       ├── rbac-guards.spec.ts
│   │   │       ├── rbac-policies.spec.ts
│   │   │       ├── rbac-strategies.spec.ts
│   │   │       └── rbac-templates.spec.ts
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
│   │   │   ├── rbac.controller.ts
│   │   │   ├── rate-limit.controller.ts
│   │   │   ├── ip-whitelist.controller.ts
│   │   │   ├── firewall.controller.ts
│   │   │   ├── waf.controller.ts
│   │   │   └── ddos.controller.ts
│   │   ├── logs/                      # Security Logging
│   │   │   ├── security-log.entity.ts
│   │   │   ├── rbac-log.entity.ts
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
│   │   │   ├── rbac.interface.ts
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
│   │   ├── rbac-e2e.spec.ts
│   │   ├── rate-limit-e2e.spec.ts
│   │   └── ip-whitelist-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── security/                           # Security Library
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── rbac/                      # Base RBAC Functionality
│   │   │   ├── rbac.service.ts
│   │   │   ├── rbac-guard.ts
│   │   │   ├── rbac-policy.ts
│   │   │   ├── rbac-cache.ts
│   │   │   ├── rbac-metrics.ts
│   │   │   ├── role-hierarchy.ts
│   │   │   ├── permission-checker.ts
│   │   │   └── context-resolver.ts
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
│   │   │   ├── rbac-utils.ts
│   │   │   ├── rate-limit-utils.ts
│   │   │   ├── ip-whitelist-utils.ts
│   │   │   ├── firewall-utils.ts
│   │   │   ├── waf-utils.ts
│   │   │   └── ddos-utils.ts
│   │   ├── interfaces/                # Security Interfaces
│   │   │   ├── security.interface.ts
│   │   │   ├── rbac.interface.ts
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

- [ ] [None] Thiết kế module RBAC đa cấp: user, role, group, department, specialty, organization
- [ ] [None] Định nghĩa policy RBAC: global, per tenant, per module, per resource, per action, per context
- [ ] [None] Hỗ trợ multi-tenant: RBAC riêng biệt từng tenant, isolation, override policy
- [ ] [None] Hỗ trợ dynamic rule: thay đổi policy mà không cần deploy lại (hot reload, API, config service)
- [ ] [None] Hỗ trợ versioning cho policy, audit trail thay đổi policy
- [ ] [None] Hỗ trợ policy exception (bypass cho admin, emergency, internal service...)
- [ ] [None] Hỗ trợ policy fallback: nếu không có policy → fallback global hoặc reject rõ ràng
- [ ] [None] Kiểm soát số lượng policy per tenant (quota)
- [ ] [None] Hỗ trợ role hierarchy (superadmin > admin > doctor > nurse > staff...)
- [ ] [None] Hỗ trợ mapping role với department, specialty, group, location
- [ ] [None] Hỗ trợ policy theo thời gian (ca trực, ngày nghỉ, maintenance window)
- [ ] [None] Hỗ trợ policy theo context (ca cấp cứu, phòng cách ly, trạng thái bệnh nhân...)
- [ ] [None] Hỗ trợ policy theo attribute (ABAC): gender, age, insurance, etc.
- [ ] [None] Hỗ trợ policy theo resource type (patient, prescription, lab, billing...)
- [ ] [None] Hỗ trợ policy theo action (read, write, update, delete, approve, export...)
- [ ] [None] Hỗ trợ policy theo data sensitivity (PII, PHI, confidential...)
- [ ] [None] Hỗ trợ policy theo location (branch, region, geoIP)
- [ ] [None] Hỗ trợ phân quyền nâng cao ngành y tế: chuyên môn cấp y khoa (nội trú, ngoại trú, CLS...), nhóm bệnh nhân (VIP, BHYT, trẻ em, người cao tuổi...), trạng thái bệnh án (mới tạo, điều trị, lưu trữ...)

### Kiểm soát Session & Token theo RBAC

- [ ] [None] Gán claims (role, department, specialty...) trong JWT/OAuth token để optimize kiểm tra quyền
- [ ] [None] Hỗ trợ short-lived token & refresh token cho hành vi RBAC nhạy cảm (phiên cấp cứu, hành động admin)
- [ ] [None] Hỗ trợ revoke token khi policy thay đổi hoặc role bị xóa (real-time revocation)
- [ ] [None] Middleware kiểm tra token phù hợp với policy hiện hành (token stale detection)

### Caching & Performance cho Policy Engine

- [ ] [None] Cache policy per tenant (Redis/local memory/tenant-isolated cache layer)
- [ ] [None] TTL cho cache theo loại policy (e.g. dynamic context → TTL ngắn)
- [ ] [None] Invalidate cache khi policy thay đổi (event-driven cache busting)
- [ ] [None] Benchmark hiệu năng engine check quyền dưới tải cao (10k QPS)

### Policy Enforcement Point (PEP) Design

- [ ] [None] Định nghĩa rõ PEP ở mỗi lớp (GraphQL resolver, REST controller, service layer)
- [ ] [None] Cho phép override policy logic trong microservice khi cần (hook/extension)
- [ ] [None] Cảnh báo khi thiếu PEP tại một entry point (guard coverage tool)

### API & Cấu hình

- [ ] [None] API quản lý policy: tạo, sửa, xóa, xem, export/import policy
- [ ] [None] API kiểm tra quyền truy cập cho 1 user/action/resource/context cụ thể
- [ ] [None] Hỗ trợ batch API cho quản lý nhiều policy cùng lúc
- [ ] [None] Hỗ trợ validate, test policy trước khi apply
- [ ] [None] Hỗ trợ rollback policy khi phát hiện lỗi
- [ ] [None] API trả về error object chuẩn: code, message, resource, action, context, hint
- [ ] [None] API hỗ trợ chế độ test (dry-run) để kiểm tra quyền mà không thực thi
- [ ] [None] Hỗ trợ policy template cho từng loại tổ chức (hospital, clinic, lab...)

### Logging & Monitoring

- [ ] [None] Structured logging: tenantId, userId, role, department, specialty, group, resource, action, context, status, error, latency
- [ ] [None] Expose Prometheus metrics: rbac_check_total, rbac_deny_total, rbac_latency, tenantId, role, resource, action
- [ ] [None] Alert khi có deny bất thường, escalation, policy conflict, abuse
- [ ] [None] Dashboard/dev tool xem trạng thái RBAC, lịch sử, thống kê, alert
- [ ] [None] Log audit trail mọi thay đổi policy, escalation, override, bypass
- [ ] [None] Export toàn bộ access log để phân tích theo thời gian (time-based access review)

### Integration với hệ thống khác

- [ ] [None] Đồng bộ hoặc ánh xạ RBAC từ hệ thống quản lý nhân sự (HRM)
- [ ] [None] RBAC tích hợp với hệ thống lịch trực, điều phối ca, phân công công việc
- [ ] [None] RBAC tích hợp với hệ thống phân quyền file (PACS, LIS...)

### Audit & Replay

- [ ] [None] Cho phép replay truy cập theo quyền cũ để debug policy mới (policy simulation)

### Resilience & Compliance

- [ ] [None] Retry, circuit breaker, failover cho RBAC service
- [ ] [None] Test resilience: simulate backend down, policy reload, cache miss
- [ ] [None] Compliance: HIPAA, GDPR, SOC2, log access, data retention, audit trail
- [ ] [None] Hỗ trợ backup/restore policy, log, config

### Testing

- [ ] [None] Unit test, integration test, e2e test cho RBAC, policy API
- [ ] [None] Test multi-tenant: policy riêng biệt, isolation, override
- [ ] [None] Test performance: đo throughput, latency, deny rate
- [ ] [None] Test rollback policy, test validate policy, test batch API
- [ ] [None] Test alert, dashboard, log, audit trail
- [ ] [None] Test escalation, override, emergency access
- [ ] [None] Test case: bác sĩ thuộc nhiều chuyên ngành → có quyền khác nhau với mỗi bệnh nhân
- [ ] [None] Test case: nhân viên thuộc 2 phòng ban → quyền ưu tiên/ghép/mâu thuẫn?
- [ ] [None] Test shadow policy: chỉ theo dõi quyền mà không áp dụng thật (giúp tuning policy)

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa schema, policy, API, flow xử lý RBAC
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy RBAC layer
- [ ] [None] Script seed/test policy, inject lỗi, test resilience
- [ ] [None] Giao diện quản trị policy theo dạng cây phân cấp (tree visualization)
- [ ] [None] Version rollback GUI cho từng policy (history, diff, rollback trực quan)
- [ ] [None] Hỗ trợ delegated admin: phân quyền quản lý policy theo scope (phòng ban, chi nhánh)

## 3. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ self-service cho admin/tenant quản lý policy (UI/API)
- [ ] [None] Hỗ trợ AI/ML-based anomaly detection trên pattern truy cập
- [ ] [None] Hỗ trợ policy conflict detector, policy suggestion dựa trên usage
- [ ] [None] Hỗ trợ graph/visualize policy flow, escalation, override
- [ ] [None] Định nghĩa SLA/SLO cho RBAC layer (uptime, latency, deny accuracy, alert response time)
