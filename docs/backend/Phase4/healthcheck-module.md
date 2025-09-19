# Checklist: Tích hợp Healthcheck Toàn Hệ Thống (Gateway, DB, Queue, Central)

> **Lưu ý quan trọng:**
>
> - Healthcheck module chịu trách nhiệm kiểm tra tình trạng sống (liveness), sẵn sàng (readiness), và trạng thái (status) của toàn bộ hệ thống: API Gateway, các service backend (EHR, Auth, Sync, Migration, Central, Monitoring), Database (Postgres, Redis, MongoDB), Message Queue (RabbitMQ), các external service (Central, 3rd party).
> - Healthcheck phải expose endpoint chuẩn (ví dụ: /health, /ready, /live) cho từng service, trả về JSON chi tiết trạng thái từng thành phần, bao gồm lifecycle (STARTING, READY, DEGRADED, FAILED, RESTARTING, SHUTTING_DOWN), rollout status (blue-green, canary), self-link dashboard/alert history nếu cần.
> - Healthcheck endpoint phải liệt kê dependency tree của service hiện tại, tự động cập nhật khi deploy mới.
> - Hỗ trợ Prometheus metrics cho healthcheck (service_up, db_up, queue_up, latency, error_count, degraded_count, restart_count, version, region, cluster).
> - Hỗ trợ alert khi service down, degraded, latency cao, version mismatch, failover, circuit breaker, DB/queue/central không kết nối.
> - Healthcheck phải có RBAC, audit log, cảnh báo khi bị abuse (rate-limit, IP whitelist).
> - Hỗ trợ multi-tenant: healthcheck từng tenant (nếu DB/queue tách biệt), expose label tenantId, option /health?tenant=abc để test riêng 1 tenant.
> - Hỗ trợ synthetic/scheduled check, end-to-end path test, archive & replay log healthcheck, plugin indicator, cấu hình indicator qua YAML/JSON.
> - Có dashboard/dev tool để xem trạng thái health toàn hệ thống, lịch sử downtime, thống kê lỗi, alert, push data vào SLA dashboard/BI tool, so sánh SLA thực tế vs cam kết.
> - Hỗ trợ AI/ML: predictive degraded mode, confidence level, anomaly detection.
> - Healthcheck phải expose cấu hình resilience (circuit breaker, retry, timeout) hiện tại của từng service.
> - Checklist này tập trung cho backend, không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── monitoring-service/                 # Monitoring Service
│   ├── src/
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.service.ts
│   │   ├── monitoring.controller.ts
│   │   ├── healthcheck/               # Healthcheck Module
│   │   │   ├── healthcheck.module.ts
│   │   │   ├── healthcheck.service.ts
│   │   │   ├── healthcheck.controller.ts
│   │   │   ├── indicators/            # Health Indicators
│   │   │   │   ├── db-indicator.ts
│   │   │   │   ├── queue-indicator.ts
│   │   │   │   ├── gateway-indicator.ts
│   │   │   │   ├── central-indicator.ts
│   │   │   │   ├── external-indicator.ts
│   │   │   │   ├── ai-health-indicator.ts
│   │   │   │   ├── tenant-indicator.ts
│   │   │   │   ├── service-indicator.ts
│   │   │   │   └── plugin-indicator.ts
│   │   │   ├── strategies/            # Health Strategies
│   │   │   │   ├── liveness.strategy.ts
│   │   │   │   ├── readiness.strategy.ts
│   │   │   │   ├── degraded.strategy.ts
│   │   │   │   ├── predictive.strategy.ts
│   │   │   │   ├── failover.strategy.ts
│   │   │   │   ├── circuit-breaker.strategy.ts
│   │   │   │   └── synthetic.strategy.ts
│   │   │   ├── utils/                 # Health Utilities
│   │   │   │   ├── health-metrics.ts
│   │   │   │   ├── health-logger.ts
│   │   │   │   ├── dependency-tree.ts
│   │   │   │   ├── archive-replay.ts
│   │   │   │   ├── sla-calculator.ts
│   │   │   │   ├── confidence-level.ts
│   │   │   │   └── anomaly-detector.ts
│   │   │   ├── config/                # Health Configuration
│   │   │   │   ├── indicator-config.yaml
│   │   │   │   ├── strategy-config.yaml
│   │   │   │   ├── sla-config.yaml
│   │   │   │   └── alert-config.yaml
│   │   │   ├── cli/                   # Health CLI Commands
│   │   │   │   ├── healthcheck.cli.ts
│   │   │   │   ├── replay.cli.ts
│   │   │   │   ├── inject-failure.cli.ts
│   │   │   │   ├── test-health.cli.ts
│   │   │   │   ├── sla-report.cli.ts
│   │   │   │   └── simulate-downtime.cli.ts
│   │   │   ├── plugins/               # Health Plugins
│   │   │   │   ├── base-health-plugin.ts
│   │   │   │   ├── custom-indicator.ts
│   │   │   │   ├── plugin-manager.ts
│   │   │   │   └── plugin-registry.ts
│   │   │   ├── synthetic/             # Synthetic Checks
│   │   │   │   ├── synthetic.service.ts
│   │   │   │   ├── end-to-end-check.ts
│   │   │   │   ├── scheduled-check.ts
│   │   │   │   ├── path-check.ts
│   │   │   │   └── synthetic-scheduler.ts
│   │   │   ├── sla/                   # SLA Management
│   │   │   │   ├── sla.service.ts
│   │   │   │   ├── sla-calculator.ts
│   │   │   │   ├── sla-reporter.ts
│   │   │   │   ├── sla-dashboard.ts
│   │   │   │   └── sla-alert.ts
│   │   │   ├── lifecycle/             # Service Lifecycle
│   │   │   │   ├── lifecycle.service.ts
│   │   │   │   ├── rollout-status.ts
│   │   │   │   ├── version-check.ts
│   │   │   │   ├── dependency-tree.ts
│   │   │   │   └── self-link.ts
│   │   │   ├── resilience/            # Resilience Patterns
│   │   │   │   ├── circuit-breaker.ts
│   │   │   │   ├── retry-policy.ts
│   │   │   │   ├── timeout-config.ts
│   │   │   │   ├── failover.ts
│   │   │   │   └── resilience-exposer.ts
│   │   │   ├── guards/                # Health Guards
│   │   │   │   ├── healthcheck-auth.guard.ts
│   │   │   │   ├── tenant-isolation.guard.ts
│   │   │   │   └── rbac.guard.ts
│   │   │   ├── interfaces/            # Health Interfaces
│   │   │   │   ├── healthcheck.interface.ts
│   │   │   │   ├── indicator.interface.ts
│   │   │   │   ├── strategy.interface.ts
│   │   │   │   ├── plugin.interface.ts
│   │   │   │   └── sla.interface.ts
│   │   │   └── __tests__/             # Health Tests
│   │   │       ├── healthcheck.service.spec.ts
│   │   │       ├── db-indicator.spec.ts
│   │   │       ├── queue-indicator.spec.ts
│   │   │       ├── gateway-indicator.spec.ts
│   │   │       ├── central-indicator.spec.ts
│   │   │       ├── synthetic.spec.ts
│   │   │       ├── sla.spec.ts
│   │   │       └── resilience.spec.ts
│   │   ├── exporters/                 # Monitoring Exporters
│   │   │   ├── prometheus-exporter.ts
│   │   │   ├── custom-exporter.ts
│   │   │   ├── otlp-exporter.ts
│   │   │   ├── grafana-exporter.ts
│   │   │   ├── alert-exporter.ts
│   │   │   └── domain-exporter.ts
│   │   ├── dashboards/                # Dashboard Configurations
│   │   │   ├── system-dashboard.json
│   │   │   ├── tenant-dashboard.json
│   │   │   ├── domain-dashboard.json
│   │   │   ├── monitoring-dashboard.json
│   │   │   ├── auth-dashboard.json
│   │   │   ├── sync-dashboard.json
│   │   │   ├── migration-dashboard.json
│   │   │   ├── central-dashboard.json
│   │   │   └── health-dashboard.json
│   │   ├── alert-rules/               # Alert Rule Configurations
│   │   │   ├── system-alerts.yml
│   │   │   ├── tenant-alerts.yml
│   │   │   ├── domain-alerts.yml
│   │   │   ├── monitoring-alerts.yml
│   │   │   ├── auth-alerts.yml
│   │   │   ├── sync-alerts.yml
│   │   │   ├── migration-alerts.yml
│   │   │   ├── central-alerts.yml
│   │   │   └── health-alerts.yml
│   │   ├── logs/                      # Monitoring Logging
│   │   │   ├── alert-log.entity.ts
│   │   │   ├── notification-log.entity.ts
│   │   │   ├── anomaly-log.entity.ts
│   │   │   ├── metric-log.entity.ts
│   │   │   ├── dashboard-log.entity.ts
│   │   │   ├── health-log.entity.ts
│   │   │   ├── downtime-log.entity.ts
│   │   │   └── monitoring-stats.entity.ts
│   │   ├── api/                       # Monitoring API
│   │   │   ├── monitoring.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── alert-rule.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── exporter.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── cli/                       # CLI Commands
│   │   │   ├── monitoring.cli.ts
│   │   │   ├── import-dashboard.cli.ts
│   │   │   ├── export-dashboard.cli.ts
│   │   │   ├── validate-alert-rule.cli.ts
│   │   │   ├── test-alert.cli.ts
│   │   │   ├── rollback-dashboard.cli.ts
│   │   │   └── rollback-alert.cli.ts
│   │   ├── devtools/                  # Development Tools
│   │   │   ├── monitoring-dashboard.ts
│   │   │   ├── alert-tester.ts
│   │   │   ├── dashboard-analyzer.ts
│   │   │   ├── alert-analyzer.ts
│   │   │   ├── notification-tester.ts
│   │   │   └── health-analyzer.ts
│   │   ├── notifications/             # Notification Management
│   │   │   ├── notification.service.ts
│   │   │   ├── email-notification.ts
│   │   │   ├── slack-notification.ts
│   │   │   ├── webhook-notification.ts
│   │   │   ├── pagerduty-notification.ts
│   │   │   └── opsgenie-notification.ts
│   │   ├── escalations/               # Escalation Management
│   │   │   ├── escalation.service.ts
│   │   │   ├── escalation-rules.ts
│   │   │   ├── escalation-timeline.ts
│   │   │   └── escalation-notification.ts
│   │   ├── suppressions/              # Alert Suppression
│   │   │   ├── suppression.service.ts
│   │   │   ├── suppression-rules.ts
│   │   │   ├── maintenance-window.ts
│   │   │   └── context-suppression.ts
│   │   ├── guards/                    # Monitoring Guards
│   │   │   ├── monitoring-auth.guard.ts
│   │   │   ├── tenant-isolation.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── interfaces/                # Monitoring Interfaces
│   │   │   ├── monitoring.interface.ts
│   │   │   ├── exporter.interface.ts
│   │   │   ├── dashboard.interface.ts
│   │   │   ├── alert-rule.interface.ts
│   │   │   ├── notification.interface.ts
│   │   │   └── healthcheck.interface.ts
│   │   └── __tests__/                 # Monitoring Tests
│   │       ├── monitoring-service.spec.ts
│   │       ├── exporter.spec.ts
│   │       ├── alert-rule.spec.ts
│   │       ├── dashboard.spec.ts
│   │       ├── notification.spec.ts
│   │       ├── escalation.spec.ts
│   │       └── suppression.spec.ts
│   ├── test/                          # E2E Tests
│   │   ├── monitoring-e2e.spec.ts
│   │   ├── multi-tenant-monitoring.spec.ts
│   │   ├── dashboard-e2e.spec.ts
│   │   ├── alert-e2e.spec.ts
│   │   └── health-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── monitoring/                         # Monitoring Library
│   ├── src/
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.service.ts
│   │   ├── healthcheck/               # Base Healthcheck Functionality
│   │   │   ├── healthcheck.service.ts
│   │   │   ├── health-indicator.ts
│   │   │   ├── health-strategy.ts
│   │   │   ├── health-plugin.ts
│   │   │   ├── health-metrics.ts
│   │   │   ├── health-logger.ts
│   │   │   ├── dependency-tree.ts
│   │   │   ├── sla-calculator.ts
│   │   │   ├── confidence-level.ts
│   │   │   └── anomaly-detector.ts
│   │   ├── exporters/                 # Base Monitoring Exporters
│   │   │   ├── base-exporter.ts
│   │   │   ├── prometheus-exporter.ts
│   │   │   ├── custom-exporter.ts
│   │   │   ├── otlp-exporter.ts
│   │   │   ├── grafana-exporter.ts
│   │   │   └── alert-exporter.ts
│   │   ├── dashboards/                # Base Dashboard Management
│   │   │   ├── dashboard-manager.ts
│   │   │   ├── dashboard-validator.ts
│   │   │   ├── dashboard-importer.ts
│   │   │   └── dashboard-exporter.ts
│   │   ├── alert-rules/               # Base Alert Rule Management
│   │   │   ├── alert-rule-manager.ts
│   │   │   ├── alert-rule-validator.ts
│   │   │   ├── alert-rule-importer.ts
│   │   │   └── alert-rule-exporter.ts
│   │   ├── notifications/             # Base Notification Management
│   │   │   ├── notification.service.ts
│   │   │   ├── notification-channel.ts
│   │   │   ├── notification-retry.ts
│   │   │   └── notification-template.ts
│   │   ├── escalations/               # Base Escalation Management
│   │   │   ├── escalation.service.ts
│   │   │   ├── escalation-rules.ts
│   │   │   ├── escalation-timeline.ts
│   │   │   └── escalation-notification.ts
│   │   ├── suppressions/              # Base Alert Suppression
│   │   │   ├── suppression.service.ts
│   │   │   ├── suppression-rules.ts
│   │   │   ├── maintenance-window.ts
│   │   │   └── context-suppression.ts
│   │   ├── utils/                     # Monitoring Utilities
│   │   │   ├── monitoring-utils.ts
│   │   │   ├── exporter-utils.ts
│   │   │   ├── dashboard-utils.ts
│   │   │   ├── alert-utils.ts
│   │   │   ├── notification-utils.ts
│   │   │   ├── escalation-utils.ts
│   │   │   └── health-utils.ts
│   │   ├── interfaces/                # Monitoring Interfaces
│   │   │   ├── monitoring.interface.ts
│   │   │   ├── exporter.interface.ts
│   │   │   ├── dashboard.interface.ts
│   │   │   ├── alert-rule.interface.ts
│   │   │   ├── notification.interface.ts
│   │   │   └── healthcheck.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Kiến trúc & Triển khai Healthcheck

- [ ] [None] Thiết kế healthcheck module cho toàn hệ thống (gateway, backend, db, queue, central, external)
- [ ] [None] Định nghĩa DTO/schema cho health status (service, status, lifecycle, rolloutStatus, latency, error, version, region, cluster, tenantId, timestamp, degraded, restartCount, failover, circuitBreaker, dependencyTree, selfLink, confidenceLevel, history...)
- [ ] [None] Xây dựng các indicator: db, queue, gateway, central, external, degraded, failover, ai-health-indicator, plugin indicator
- [ ] [None] Xây dựng các strategy: liveness, readiness, degraded, failover, circuit breaker, predictive degraded
- [ ] [None] Expose endpoint /health, /ready, /live cho từng service, trả về JSON chi tiết, trạng thái lifecycle, rollout, dependency tree, self-link dashboard/alert history
- [ ] [None] Hỗ trợ multi-tenant healthcheck (label tenantId, region, cluster, /health?tenant=abc)
- [ ] [None] Hỗ trợ Prometheus metrics cho healthcheck (service_up, db_up, queue_up, latency, error_count, degraded_count, restart_count, version, region, cluster)
- [ ] [None] Hỗ trợ version check, region/cluster check, failover/circuit breaker status

### Lifecycle & Observability nâng cao

- [ ] [None] Expose status lifecycle của service (STARTING, READY, DEGRADED, FAILED, RESTARTING, SHUTTING_DOWN)
- [ ] [None] Expose trạng thái rollout (blue-green, canary) khi deploy
- [ ] [None] Link đến dashboard/alert history trong JSON response (self-linking)
- [ ] [None] Lưu lịch sử response healthcheck (history array)
- [ ] [None] Expose self-metrics cho healthcheck module (healthcheck_request_total, healthcheck_error_total, healthcheck_latency_seconds)

### Service Discovery & Dependency Tree

- [ ] [None] Healthcheck endpoint liệt kê dependency tree của service hiện tại
- [ ] [None] Healthcheck tự động cập nhật dependency khi deploy mới

### Intelligent Healthcheck (AI/ML Ready)

- [ ] [None] Hỗ trợ predictive degraded mode (dấu hiệu bất thường nhưng chưa down)
- [ ] [None] Đính kèm confidence level (%) cho trạng thái degraded/unstable
- [ ] [None] Hỗ trợ AI/ML-based anomaly detection cho healthcheck

### Synthetic & Scheduled Check

- [ ] [None] Cho phép tạo healthcheck định kỳ qua scheduler (cron synthetic test)
- [ ] [None] Cho phép kiểm tra end-to-end path (auth login + query central + ghi DB)

### Developer Tooling nâng cao

- [ ] [None] Cho phép test healthcheck trực tiếp từ CLI (emr-healthcheck test --service=auth-api --inject=queue_down)
- [ ] [None] Ghi lại lịch sử response để debug
- [ ] [None] CLI tool export/import/simulate healthcheck log
- [ ] [None] Archive & replay log healthcheck, đặc biệt lỗi/degraded/fail
- [ ] [None] Cho phép replay tình huống lỗi trong staging (failover, mạng chậm, mất kết nối Redis...)

### Extensibility

- [ ] [None] Cho phép tích hợp plugin health indicator từ bên thứ ba (ai-health-indicator.ts)
- [ ] [None] Hỗ trợ cấu hình indicator mới qua YAML/JSON mà không cần build lại

### SLA Dashboard & BI Integration

- [ ] [None] Tự động push data vào bảng tính/BI tools để theo dõi SLA uptime từng tenant/service
- [ ] [None] So sánh SLA thực tế vs cam kết, alert nếu vi phạm

### Resilience Architecture Review

- [ ] [None] Có tài liệu riêng mô tả resilience pattern: circuit breaker, retry policy, timeout threshold
- [ ] [None] Healthcheck phải expose cấu hình hiện tại của circuit breaker/timeout cho từng service

### Multi-Tenant Context Deep Support

- [ ] [None] Healthcheck kiểm tra connectivity đến từng tenant database/queue riêng biệt
- [ ] [None] Option /health?tenant=abc để test riêng 1 tenant (hỗ trợ tenant bị cô lập)

### Alert & Observability

- [ ] [None] Alert khi service/db/queue/central down, degraded, latency cao, version mismatch, failover, circuit breaker
- [ ] [None] Alert grouping, escalation, suppression theo context (giờ hành chính, maintenance window)
- [ ] [None] Logging structured (service, status, error, latency, version, region, cluster, tenantId, traceId, actor, severity)
- [ ] [None] Lưu log healthcheck, alert, downtime, failover vào bảng riêng, audit trail
- [ ] [None] Dashboard/dev tool xem trạng thái health toàn hệ thống, lịch sử downtime, thống kê lỗi, alert

### Bảo mật & Compliance

- [ ] [None] RBAC cho healthcheck endpoint (chỉ user có quyền mới xem được health chi tiết)
- [ ] [None] Audit log mọi truy cập healthcheck endpoint
- [ ] [None] Rate-limit, IP whitelist cho healthcheck endpoint
- [ ] [None] Cảnh báo khi healthcheck bị abuse (scan, brute force, DDoS)
- [ ] [None] Compliance: log traceId, actor, region, cluster, lý do downtime, version, audit trail

### DevOps & Khả năng mở rộng

- [ ] [None] Script seed/test healthcheck, inject lỗi, mô phỏng failover, test resilience
- [ ] [None] CI/CD pipeline tự động test healthcheck, validate healthcheck response
- [ ] [None] Hỗ trợ multi-cloud, cross-region, multi-tenant healthcheck
- [ ] [None] Hỗ trợ plugin-based indicator/strategy (dễ mở rộng cho service mới)
- [ ] [None] Hỗ trợ backup/restore log healthcheck, downtime, alert
- [ ] [None] Tài liệu hóa healthcheck, hướng dẫn tích hợp Prometheus/Grafana/Alertmanager
- [ ] [None] Định nghĩa SLA/SLO cho healthcheck (tỷ lệ uptime, latency, alert response time)

### Testing & resilience

- [ ] [None] Unit test, integration test cho indicator, strategy, endpoint
- [ ] [None] Test resilience: db/queue/gateway/central down, degraded, failover, circuit breaker
- [ ] [None] Test performance: đo latency healthcheck, throughput, alert response
- [ ] [None] Test isolation healthcheck giữa các tenant/region/cluster
- [ ] [None] Test backup/restore log healthcheck, downtime, alert

### Tài liệu hóa

- [ ] [None] Tài liệu hóa healthcheck module, schema, endpoint, metrics, alert, dashboard
- [ ] [None] Checklist security review, compliance, audit log khi go-live
- [ ] [None] Tài liệu hóa pipeline build, test, deploy healthcheck module
- [ ] [None] Demo script/dev tool mô phỏng healthcheck, inject lỗi, test resilience
- [ ] [None] Tài liệu riêng mô tả resilience pattern, circuit breaker, retry policy, timeout threshold

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ event sourcing cho log healthcheck, downtime, alert
- [ ] [None] Hỗ trợ simulate healthcheck/downtime để demo QA hoặc training
- [ ] [None] Định nghĩa lifecycle cho healthcheck (created, active, deprecated, archived)
- [ ] [None] Định nghĩa SLA/SLO cho healthcheck module (self-monitoring SLA)
