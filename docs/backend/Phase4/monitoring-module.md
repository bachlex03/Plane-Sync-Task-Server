# Checklist: Cấu hình Monitoring Module (Prometheus, Grafana, alert rule theo tenant)

> **Lưu ý quan trọng:**
>
> - Monitoring Module chịu trách nhiệm thu thập, lưu trữ, hiển thị và cảnh báo các chỉ số hệ thống, ứng dụng, và tenant (multi-tenant metrics, alerting, dashboard).
> - Hỗ trợ Prometheus (metrics, alertmanager), Grafana (dashboard, alert rule), multi-tenant isolation, RBAC dashboard, alert rule per tenant.
> - Hỗ trợ Prometheus federation (scale lớn), retention/compaction, None Availability, performance tuning (remote_write, Thanos/Cortex), self-metrics.
> - Hỗ trợ mã hóa nhạy cảm trong alert rule, OIDC/LDAP cho Grafana, alert suppression theo context, logging severity/module.
> - Hỗ trợ multi-channel alert, escalation, grouping, incident integration, retry/DLQ alert, alert rule validation, rollback, conflict check, test rule.
> - Hỗ trợ export OTLP/OpenTelemetry, naming convention, dashboard/alert lifecycle, self-monitoring SLA.
> - Checklist này chỉ tập trung cho backend (monitoring, alerting, observability, resilience), không bao gồm UI/UX.
> - Chuẩn hóa cấu trúc module: tách rõ exporters, dashboards, alert rules, api, cli, tests.
> - Hỗ trợ plugin-based exporter: dễ mở rộng cho từng domain/module.
> - Lưu log alert, notification, metric anomaly vào bảng riêng, audit trail.
> - Có dashboard/dev tool để review, cấu hình, export/import dashboard, alert rule, notification channel.
> - Hỗ trợ alert khi metric vượt ngưỡng, anomaly, SLA, alert suppression, escalation, notification retry.
> - Hỗ trợ compliance: audit log, traceId, tenantId, alert reason, alert actor.

## Cấu trúc thư mục

```
apps/backend/
├── monitoring-service/                 # Monitoring Service
│   ├── src/
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.service.ts
│   │   ├── monitoring.controller.ts
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
│   │   │   └── central-dashboard.json
│   │   ├── alert-rules/               # Alert Rule Configurations
│   │   │   ├── system-alerts.yml
│   │   │   ├── tenant-alerts.yml
│   │   │   ├── domain-alerts.yml
│   │   │   ├── monitoring-alerts.yml
│   │   │   ├── auth-alerts.yml
│   │   │   ├── sync-alerts.yml
│   │   │   ├── migration-alerts.yml
│   │   │   └── central-alerts.yml
│   │   ├── logs/                      # Monitoring Logging
│   │   │   ├── alert-log.entity.ts
│   │   │   ├── notification-log.entity.ts
│   │   │   ├── anomaly-log.entity.ts
│   │   │   ├── metric-log.entity.ts
│   │   │   ├── dashboard-log.entity.ts
│   │   │   └── monitoring-stats.entity.ts
│   │   ├── api/                       # Monitoring API
│   │   │   ├── monitoring.controller.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── alert-rule.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── exporter.controller.ts
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
│   │   │   └── notification-tester.ts
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
│   │   │   └── notification.interface.ts
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
│   │   └── alert-e2e.spec.ts
│   └── package.json
│
libs/backend/
├── monitoring/                         # Monitoring Library
│   ├── src/
│   │   ├── monitoring.module.ts
│   │   ├── monitoring.service.ts
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
│   │   │   └── escalation-utils.ts
│   │   ├── interfaces/                # Monitoring Interfaces
│   │   │   ├── monitoring.interface.ts
│   │   │   ├── exporter.interface.ts
│   │   │   ├── dashboard.interface.ts
│   │   │   ├── alert-rule.interface.ts
│   │   │   └── notification.interface.ts
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

### Triển khai Monitoring Module

- [ ] [None] Thiết kế kiến trúc Monitoring Module (module, service, exporter, dashboard, alert rule, log, API, CLI, devtools)
- [ ] [None] Định nghĩa DTO/schema cho metric, alert, notification (tenantId, metric, value, threshold, status, actor, timestamp, traceId, severity, module, channel, region, cluster, lifecycle...)
- [ ] [None] Xây dựng các exporter: Prometheus, custom, domain/module exporter, OTLP/OpenTelemetry
- [ ] [None] Hỗ trợ multi-tenant metrics: label tenantId, region, domain, RBAC dashboard, naming convention
- [ ] [None] Hỗ trợ Prometheus federation, retention, compaction, HA, performance tuning (remote_write, Thanos/Cortex)
- [ ] [None] Hỗ trợ alert rule per tenant, domain, SLA, anomaly detection, escalation, suppression, grouping, retry/DLQ, notification retry
- [ ] [None] Hỗ trợ mã hóa nhạy cảm trong alert rule (email, webhook token)
- [ ] [None] Tích hợp OIDC/LDAP cho dashboard Grafana RBAC
- [ ] [None] Alert suppression theo context (giờ hành chính, maintenance window), escalation, grouping, incident integration (PagerDuty, Opsgenie)
- [ ] [None] Logging phân loại theo severity/module, structured logging
- [ ] [None] Lưu log alert, notification, anomaly, audit trail vào bảng riêng
- [ ] [None] API cấu hình, export/import dashboard, alert rule, notification channel
- [ ] [None] CLI tool quản lý dashboard, alert rule, notification channel, test alert, validate alert rule, rollback dashboard/alert rule
- [ ] [None] Dashboard/dev tool để review, cấu hình, export/import dashboard, alert rule, notification channel, thống kê, self-monitoring
- [ ] [None] Hỗ trợ alert khi metric vượt ngưỡng, anomaly, SLA, alert suppression, escalation, notification retry, alert channel down
- [ ] [None] Hỗ trợ compliance: audit log, traceId, tenantId, alert reason, alert actor, encryption alert rule
- [ ] [None] Hỗ trợ lifecycle dashboard/alert (created, active, deprecated, archived), self-monitoring SLA

### Bảo mật & Isolation

- [ ] [None] Xác thực, phân quyền khi truy vấn/cấu hình dashboard, alert rule (RBAC, audit log, OIDC/LDAP)
- [ ] [None] Audit log mọi thao tác cấu hình, export/import, notification
- [ ] [None] Cảnh báo khi có alert nghiêm trọng hoặc lặp lại nhiều lần
- [ ] [None] RBAC: user chỉ thấy dashboard/alert của tenant mình, superadmin mới cấu hình toàn hệ thống

### Monitoring & Observability

- [ ] [None] Expose Prometheus metrics cho monitoring module (exporter count, alert count, notification count, anomaly count, latency, monitoring_alert_total, monitoring_exporter_errors_total...)
- [ ] [None] Alert khi exporter fail, alert rule fail, notification fail, anomaly, SLA chưa xử lý, monitoring module overload/crash
- [ ] [None] Structured logging (tenantId, metric, alert, notification, traceId, status, actor, severity, module, channel, region, cluster, lifecycle, kết quả)
- [ ] [None] Tạo dashboard Prometheus/Grafana mẫu cho monitoring, alert, notification, self-monitoring
- [ ] [None] Thống kê alert, notification, anomaly theo tenant, domain, entity, thời gian

### Kiểm thử & resilience

- [ ] [None] Unit test, integration test cho exporter, dashboard, alert rule, API, CLI
- [ ] [None] Test isolation dashboard/alert giữa các tenant
- [ ] [None] Test resilience: exporter fail, alert rule fail, notification fail, anomaly, alert channel down
- [ ] [None] Test performance: đo throughput, latency exporter, alert, notification
- [ ] [None] Test rollback/cancel alert rule, batch import/export dashboard/alert rule, rollback dashboard/alert rule khi lỗi
- [ ] [None] Test consistency sau alert/notification/anomaly
- [ ] [None] Test backup/restore dashboard, alert rule, notification channel
- [ ] [None] Test validate alert rule syntax, alert rule conflict, test rule trên dữ liệu thật/tổng hợp

### Tài liệu hóa & DevOps

- [ ] [None] Tài liệu hóa các exporter, dashboard, alert rule, notification, hướng dẫn tích hợp
- [ ] [None] Có script seed dữ liệu test monitoring/alert
- [ ] [None] Có CI/CD pipeline tự động chạy test monitoring/alert, validate alert rule syntax
- [ ] [None] Tài liệu hóa pipeline build, test, deploy monitoring-module
- [ ] [None] Checklist security review, kiểm toán dữ liệu khi go-live
- [ ] [None] Ghi chú kỹ quyền audit, compliance khi monitoring/alert thật

## 2. Bổ sung checklist nâng cao

- [ ] [None] Hỗ trợ multi-cloud monitoring, cross-region dashboard
- [ ] [None] Hỗ trợ AI/ML-based anomaly/alert suggestion
- [ ] [None] Hỗ trợ event sourcing cho alert/notification/anomaly log
- [ ] [None] Test backup/restore alert/notification/anomaly log
- [ ] [None] Test migration schema monitoring giữa các version
- [ ] [None] Hỗ trợ simulate alert/anomaly để demo QA hoặc training
- [ ] [None] Hỗ trợ CLI tool export/import/simulate monitoring/alert logs
- [ ] [None] Định nghĩa SLA/SLO cho chính module monitoring (self-monitoring SLA)
