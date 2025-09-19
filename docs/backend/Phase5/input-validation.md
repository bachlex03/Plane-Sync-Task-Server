# Checklist: Input Validation – Security Layer Toàn Hệ Thống

> **Lưu ý quan trọng:**
>
> - Input validation là lớp bảo vệ đầu tiên chống lại tấn công injection, XSS, dữ liệu sai định dạng, và các lỗ hổng bảo mật khác.
> - Checklist này tập trung vào kiến trúc, policy, schema, multi-tenant, dynamic rule, API, logging, monitoring, resilience, compliance, testing cho input validation toàn hệ thống.

## Cấu trúc thư mục

```
apps/backend/
├── security-service/                   # Security Service
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── security.controller.ts
│   │   ├── input-validation/          # Input Validation Module
│   │   │   ├── input-validation.module.ts
│   │   │   ├── input-validation.service.ts
│   │   │   ├── input-validation.guard.ts
│   │   │   ├── input-validation.config.ts
│   │   │   ├── schemas/               # Validation Schemas
│   │   │   │   ├── user.schema.ts
│   │   │   │   ├── patient.schema.ts
│   │   │   │   ├── branch.schema.ts
│   │   │   │   ├── file-upload.schema.ts
│   │   │   │   ├── appointment.schema.ts
│   │   │   │   ├── medical-record.schema.ts
│   │   │   │   ├── prescription.schema.ts
│   │   │   │   ├── lab-result.schema.ts
│   │   │   │   ├── billing.schema.ts
│   │   │   │   ├── audit.schema.ts
│   │   │   │   └── custom.schema.ts
│   │   │   ├── strategies/            # Validation Strategies
│   │   │   │   ├── json-schema.strategy.ts
│   │   │   │   ├── class-validator.strategy.ts
│   │   │   │   ├── zod.strategy.ts
│   │   │   │   ├── joi.strategy.ts
│   │   │   │   ├── yup.strategy.ts
│   │   │   │   ├── ajv.strategy.ts
│   │   │   │   └── custom.strategy.ts
│   │   │   ├── validators/            # Custom Validators
│   │   │   │   ├── email.validator.ts
│   │   │   │   ├── phone.validator.ts
│   │   │   │   ├── id-card.validator.ts
│   │   │   │   ├── medical-id.validator.ts
│   │   │   │   ├── insurance.validator.ts
│   │   │   │   ├── date.validator.ts
│   │   │   │   ├── file.validator.ts
│   │   │   │   └── business-logic.validator.ts
│   │   │   ├── sanitizers/            # Input Sanitizers
│   │   │   │   ├── html-sanitizer.ts
│   │   │   │   ├── sql-sanitizer.ts
│   │   │   │   ├── xss-sanitizer.ts
│   │   │   │   ├── path-sanitizer.ts
│   │   │   │   ├── script-sanitizer.ts
│   │   │   │   └── content-sanitizer.ts
│   │   │   ├── policies/              # Validation Policies
│   │   │   │   ├── global-policy.ts
│   │   │   │   ├── tenant-policy.ts
│   │   │   │   ├── endpoint-policy.ts
│   │   │   │   ├── role-policy.ts
│   │   │   │   ├── module-policy.ts
│   │   │   │   └── field-policy.ts
│   │   │   ├── guards/                # Validation Guards
│   │   │   │   ├── validation-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   ├── rbac.guard.ts
│   │   │   │   └── schema.guard.ts
│   │   │   ├── decorators/            # Validation Decorators
│   │   │   │   ├── validate.decorator.ts
│   │   │   │   ├── sanitize.decorator.ts
│   │   │   │   ├── transform.decorator.ts
│   │   │   │   ├── custom.decorator.ts
│   │   │   │   └── business-logic.decorator.ts
│   │   │   ├── utils/                 # Validation Utilities
│   │   │   │   ├── validation-logger.ts
│   │   │   │   ├── validation-metrics.ts
│   │   │   │   ├── validation-cache.ts
│   │   │   │   ├── validation-validator.ts
│   │   │   │   ├── error-formatter.ts
│   │   │   │   ├── i18n-helper.ts
│   │   │   │   └── schema-manager.ts
│   │   │   ├── templates/             # Validation Templates
│   │   │   │   ├── hospital.template.ts
│   │   │   │   ├── clinic.template.ts
│   │   │   │   ├── lab.template.ts
│   │   │   │   ├── pharmacy.template.ts
│   │   │   │   └── emergency.template.ts
│   │   │   ├── cli/                   # Validation CLI Commands
│   │   │   │   ├── validation.cli.ts
│   │   │   │   ├── schema-manage.cli.ts
│   │   │   │   ├── test-validation.cli.ts
│   │   │   │   ├── validation-status.cli.ts
│   │   │   │   └── schema-validate.cli.ts
│   │   │   ├── interfaces/            # Validation Interfaces
│   │   │   │   ├── validation.interface.ts
│   │   │   │   ├── schema.interface.ts
│   │   │   │   ├── strategy.interface.ts
│   │   │   │   ├── validator.interface.ts
│   │   │   │   ├── sanitizer.interface.ts
│   │   │   │   └── policy.interface.ts
│   │   │   └── __tests__/             # Validation Tests
│   │   │       ├── input-validation.service.spec.ts
│   │   │       ├── input-validation.guard.spec.ts
│   │   │       ├── validation-schemas.spec.ts
│   │   │       ├── validation-strategies.spec.ts
│   │   │       ├── validation-validators.spec.ts
│   │   │       └── validation-sanitizers.spec.ts
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
│   │   │   ├── input-validation.controller.ts
│   │   │   ├── rate-limit.controller.ts
│   │   │   ├── ip-whitelist.controller.ts
│   │   │   ├── firewall.controller.ts
│   │   │   ├── waf.controller.ts
│   │   │   └── ddos.controller.ts
│   │   ├── logs/                      # Security Logging
│   │   │   ├── security-log.entity.ts
│   │   │   ├── rbac-log.entity.ts
│   │   │   ├── validation-log.entity.ts
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
│   │   │   ├── validation.interface.ts
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
│   │   ├── validation-e2e.spec.ts
│   │   ├── rate-limit-e2e.spec.ts
│   │   └── ip-whitelist-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── security/                           # Security Library
│   ├── src/
│   │   ├── security.module.ts
│   │   ├── security.service.ts
│   │   ├── input-validation/          # Base Input Validation Functionality
│   │   │   ├── input-validation.service.ts
│   │   │   ├── input-validation-guard.ts
│   │   │   ├── input-validation-policy.ts
│   │   │   ├── input-validation-cache.ts
│   │   │   ├── input-validation-metrics.ts
│   │   │   ├── schema-manager.ts
│   │   │   ├── strategy-manager.ts
│   │   │   └── error-formatter.ts
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
│   │   │   ├── validation-utils.ts
│   │   │   ├── rbac-utils.ts
│   │   │   ├── rate-limit-utils.ts
│   │   │   ├── ip-whitelist-utils.ts
│   │   │   ├── firewall-utils.ts
│   │   │   ├── waf-utils.ts
│   │   │   └── ddos-utils.ts
│   │   ├── interfaces/                # Security Interfaces
│   │   │   ├── security.interface.ts
│   │   │   ├── validation.interface.ts
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

- [ ] [None] Thiết kế module input validation cho toàn hệ thống (service, guard, config, schema, strategy, utils)
- [ ] [None] Định nghĩa policy validation: global, per endpoint, per tenant, per module, per field, per role, per API group/tag
- [ ] [None] Hỗ trợ dynamic rule: thay đổi schema/policy mà không cần deploy lại (hot reload, API, config service)
- [ ] [None] Hỗ trợ multi-tenant: mỗi tenant có schema/policy riêng, isolation, override
- [ ] [None] Hỗ trợ versioning cho schema/policy, audit trail thay đổi
- [ ] [None] Hỗ trợ custom schema/policy cho từng module/endpoint
- [ ] [None] Hỗ trợ policy exception (bypass cho admin, internal service, healthcheck...)
- [ ] [None] Hỗ trợ policy fallback: nếu không có schema/policy → fallback global hoặc reject rõ ràng
- [ ] [None] Kiểm soát số lượng schema/policy per tenant (quota)
- [ ] [None] Hỗ trợ policy theo vai trò (role), cho phép bypass rule với admin hoặc role đặc biệt
- [ ] [None] Hỗ trợ policy theo API group/tag (ví dụ: /auth/_, /patient/_)
- [ ] [None] Cơ chế đánh dấu và tắt/bật schema tạm thời (feature flag cho schema)
- [ ] [None] Cho phép ghi chú hoặc metadata kèm theo mỗi schema/policy (trace, phân tích)

### Schema & Validation

- [ ] [None] Định nghĩa schema validation cho từng module (user, patient, branch, file-upload...)
- [ ] [None] Hỗ trợ nhiều engine: JSON Schema, class-validator, zod, custom
- [ ] [None] Hỗ trợ validate input: body, query, params, headers, file, multipart, nested object
- [ ] [None] Hỗ trợ validate kiểu dữ liệu, pattern, enum, min/max, required, custom rule
- [ ] [None] Hỗ trợ validate cross-field, cross-object, conditional logic
- [ ] [None] Hỗ trợ validate file type, size, content (file upload)
- [ ] [None] Hỗ trợ validate input lớn (batch, array, import)
- [ ] [None] Hỗ trợ validate input theo ngôn ngữ (i18n, error message đa ngữ)
- [ ] [None] Hỗ trợ auto-trim, sanitize input trước khi validate (chống dirty input, trailing space)
- [ ] [None] Validate logic phân quyền liên quan đến dữ liệu (bác sĩ không được ghi thông tin bệnh nhân ngoài khoa mình)
- [ ] [None] Validate ID format riêng theo tenant (mỗi bệnh viện có thể dùng mã bệnh nhân riêng)
- [ ] [None] Hỗ trợ validation theo business day/time (ví dụ: không cho chọn ngày khám trong quá khứ)

### API & Cấu hình

- [ ] [None] API quản lý schema/policy: tạo, sửa, xóa, xem, export/import
- [ ] [None] API kiểm tra input validation cho 1 request cụ thể (validate on demand)
- [ ] [None] Hỗ trợ batch API cho quản lý nhiều schema/policy cùng lúc
- [ ] [None] Hỗ trợ validate, test schema trước khi apply
- [ ] [None] Hỗ trợ rollback schema/policy khi phát hiện lỗi
- [ ] [None] API trả về error object chuẩn: code, message, field, hint, i18n
- [ ] [None] API hỗ trợ chế độ test (dry-run) để kiểm tra dữ liệu mà không lưu (debug frontend)
- [ ] [None] Cho phép định nghĩa nhiều schema cho cùng 1 endpoint, dùng rule để chọn schema theo context (user role, tenant type…)

### Logging & Monitoring

- [ ] [None] Structured logging: tenantId, userId, endpoint, schema, status, error, input, latency
- [ ] [None] Expose Prometheus metrics: validation_fail_total, validation_latency, tenantId, endpoint, schema
- [ ] [None] Alert khi có nhiều lỗi validation bất thường, tenant bị reject liên tục
- [ ] [None] Dashboard/dev tool xem trạng thái validation, lịch sử lỗi, thống kê, alert
- [ ] [None] Log audit trail mọi thay đổi schema/policy, unblock, bypass
- [ ] [None] Cho phép tắt log chi tiết cho input chứa dữ liệu nhạy cảm (PII, PHI)
- [ ] [None] Gửi alert khi một trường cụ thể thường xuyên gây lỗi validation
- [ ] [None] Gắn nhãn (label) cho log validation lỗi để SIEM dễ phân loại

### Resilience & Compliance

- [ ] [None] Retry, circuit breaker, failover cho service input validation
- [ ] [None] Test resilience: simulate schema error, failover, policy reload, cache miss
- [ ] [None] Compliance: log access, data retention, audit trail, GDPR (xóa input theo yêu cầu)
- [ ] [None] Hỗ trợ backup/restore schema/policy, log, config
- [ ] [None] Hỗ trợ graceful degradation: nếu validation service down → fallback sang rule cũ (cache) hoặc fail-safe reject
- [ ] [None] Cho phép xóa log theo từng tenant hoặc từng khoảng thời gian (data retention by tenant)
- [ ] [None] Log rõ nguồn policy được load từ đâu (e.g. cache/local/api)

### Testing

- [ ] [None] Unit test, integration test, e2e test cho input validation, schema, policy API
- [ ] [None] Test multi-tenant: schema/policy riêng biệt, isolation, override
- [ ] [None] Test performance: đo throughput, latency, reject rate
- [ ] [None] Test rollback schema/policy, test validate schema, test batch API
- [ ] [None] Test alert, dashboard, log, audit trail
- [ ] [None] Test bảo mật chống bypass: cố tình gửi sai kiểu MIME, nested field fake, v.v.
- [ ] [None] Test với input có encoding đặc biệt (unicode, escape char, null byte)
- [ ] [None] Test behavior khi schema bị lỗi cú pháp, service vẫn phải xử lý đúng hoặc báo lỗi rõ

### Tài liệu hóa & DevOps

- [ ] [None] Tạo template schema chuẩn để các team tái sử dụng nhanh
- [ ] [None] Hỗ trợ migration schema/policy giữa các môi trường (dev → staging → prod)
- [ ] [None] Gen tài liệu tự động từ schema (OpenAPI, markdown, HTML)
- [ ] [None] Tài liệu hóa schema, policy, API, flow xử lý input validation
- [ ] [None] Tài liệu hóa audit trail, compliance, data retention
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] CI/CD pipeline tự động test, build, deploy input validation layer
- [ ] [None] Script seed/test schema/policy, inject lỗi, test resilience

## 3. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ schema inference từ traffic thực tế để gợi ý schema mới (giống OpenAPI Generator)
- [ ] [None] Policy conflict detector: phát hiện schema bị conflict, không bao phủ đủ, rule trùng lặp
- [ ] [None] Hỗ trợ graph-based visualizer: input schema → luồng xử lý → kết quả → alert/log
- [ ] [None] Hỗ trợ multi-stage validation pipeline (pre-validate → normalize → validate → enrich → post-check)
- [ ] [None] Hỗ trợ self-service cho tenant quản lý schema/policy của mình (UI/API)
- [ ] [None] Hỗ trợ export log/schema/policy sang SIEM, log aggregator
- [ ] [None] Định nghĩa lifecycle cho schema/policy (created, active, deprecated, archived)
- [ ] [None] Định nghĩa SLA/SLO cho input validation layer (uptime, latency, reject accuracy, alert response time)
- [ ] [None] AI/ML-based anomaly detection trên pattern input bị reject
- [ ] [None] Gợi ý schema/policy dựa trên historical usage pattern
- [ ] [None] Graph/visualization cây schema/policy áp dụng theo endpoint/module
