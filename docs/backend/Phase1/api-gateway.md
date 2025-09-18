# API Gateway / Load Balancer Checklist (Tenant Routing, Context Injection)

> **Lưu ý quan trọng:**
>
> - **Gợi ý công nghệ:** Sử dụng Nginx/HAProxy (gateway, load balancer), NestJS/Express (API gateway custom), Prometheus/Grafana (monitoring), OpenTelemetry (tracing, metrics), Docker Compose (devops), audit log (custom interceptor + DB), tuân thủ HIPAA/GDPR.
> - Gateway phải đảm bảo isolation, không để lộ thông tin tenant này sang tenant khác.
> - Mọi request phải xác định đúng tenant (qua domain, subdomain, header, token...) và inject context vào downstream service.
> - Gateway phải hỗ trợ scale, không trở thành SPOF, có healthcheck, rate limit, logging, audit.
> - Checklist này chỉ tập trung cho backend (API Gateway, routing, context, bảo mật, audit), không bao gồm UI/UX.

## Cấu trúc thư mục

```
apps/backend/
├── gateway-api/                      # API Gateway Service
│   ├── src/
│   │   ├── middleware/               # Gateway middleware
│   │   │   ├── tenant.middleware.ts  # Tenant identification & routing
│   │   │   ├── auth.middleware.ts    # Authentication middleware
│   │   │   ├── cors.middleware.ts    # CORS handling
│   │   │   ├── rate-limit.middleware.ts # Rate limiting
│   │   │   ├── audit.middleware.ts   # Audit logging
│   │   │   └── security.middleware.ts # Security checks
│   │   ├── guards/                   # Gateway guards
│   │   │   ├── tenant.guard.ts       # Tenant isolation guard
│   │   │   ├── auth.guard.ts         # Authentication guard
│   │   │   └── role.guard.ts         # Role-based access guard
│   │   ├── interceptors/             # Gateway interceptors
│   │   │   ├── audit-logging.interceptor.ts # Request audit logging
│   │   │   ├── context.interceptor.ts # Context injection
│   │   │   ├── metrics.interceptor.ts # Metrics collection
│   │   │   └── tracing.interceptor.ts # Request tracing
│   │   ├── controllers/              # Gateway controllers
│   │   │   ├── health.controller.ts  # Health check endpoints
│   │   │   ├── admin.controller.ts   # Admin endpoints
│   │   │   └── proxy.controller.ts   # Proxy endpoints
│   │   ├── services/                 # Gateway services
│   │   │   ├── tenant.service.ts     # Tenant management
│   │   │   ├── routing.service.ts    # Request routing
│   │   │   ├── load-balancer.service.ts # Load balancing
│   │   │   ├── jwt.service.ts        # JWT handling
│   │   │   └── monitoring.service.ts # Monitoring & metrics
│   │   ├── utils/                    # Gateway utilities
│   │   │   ├── context.util.ts       # Context utilities
│   │   │   ├── routing.util.ts       # Routing utilities
│   │   │   ├── security.util.ts      # Security utilities
│   │   │   └── metrics.util.ts       # Metrics utilities
│   │   ├── config/                   # Gateway configuration
│   │   │   ├── gateway.config.ts     # Main gateway config
│   │   │   ├── tenant.config.ts      # Tenant routing config
│   │   │   ├── security.config.ts    # Security config
│   │   │   └── monitoring.config.ts  # Monitoring config
│   │   ├── dto/                      # Data Transfer Objects
│   │   │   ├── tenant.dto.ts         # Tenant DTOs
│   │   │   ├── health.dto.ts         # Health check DTOs
│   │   │   └── admin.dto.ts          # Admin DTOs
│   │   └── gateway-api.module.ts
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
│   │   │   ├── gateway.constants.ts  # Gateway constants
│   │   │   ├── tenant.constants.ts   # Tenant constants
│   │   │   └── security.constants.ts # Security constants
│   │   ├── enums/                    # Shared enums
│   │   │   ├── tenant.enum.ts        # Tenant enums
│   │   │   ├── auth.enum.ts          # Auth enums
│   │   │   └── gateway.enum.ts       # Gateway enums
│   │   ├── interfaces/               # Shared interfaces
│   │   │   ├── tenant.interface.ts   # Tenant interfaces
│   │   │   ├── context.interface.ts  # Context interfaces
│   │   │   └── gateway.interface.ts  # Gateway interfaces
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── tenant.util.ts        # Tenant utilities
│   │   │   ├── context.util.ts       # Context utilities
│   │   │   └── security.util.ts      # Security utilities
│   │   └── index.ts
│   ├── test/
│   └── package.json
```

## 1. Những việc cần làm

- [x] [High] Middleware xác định tenant từ header/domain, kiểm tra tenant tồn tại, active, inject context vào request
- [x] [High] Propagation tenant context cho downstream service/controller (gắn tenantId, tenantDomain vào request)
- [x] [High] Middleware kiểm tra CORS, rate limit, global exception filter
- [x] [High] Audit logging mọi request (tenantId, userId, action, resource, IP...)
- [x] [High] Guard đảm bảo tenant isolation (user chỉ truy cập tenant của mình, trừ super_admin)
- [x] [High] Context injection cho downstream (tenant, user, branch, department)

### Chức năng chính

- [ ] [High] Thiết kế kiến trúc API Gateway/Load Balancer (chọn công nghệ: Nginx, HAProxy, Traefik, Kong, custom Node.js/Express, ... nếu cần ngoài emr-api)
- [ ] [High] Hỗ trợ routing theo subdomain/domain ở gateway ngoài (nếu dùng Nginx/HAProxy)
- [ ] [High] Hỗ trợ routing theo header (X-Tenant-ID) hoặc path prefix (nếu cần)
- [ ] [High] Middleware kiểm tra, validate tenant (tồn tại, active, không bị suspend) ở gateway ngoài (nếu cần)
- [ ] [High] Middleware kiểm tra authentication (JWT, session, ...), inject user context ở gateway ngoài (nếu cần)
- [ ] [High] Middleware kiểm tra rate limit, IP whitelist, CORS ở gateway ngoài (nếu cần)
- [ ] [High] Logging, audit mọi request ở gateway ngoài (nếu cần)
- [ ] [High] Healthcheck endpoint cho gateway (liveness, readiness)
- [ ] [Medium] Hỗ trợ sticky session (nếu cần cho load balancing)
- [ ] [High] Hỗ trợ HTTPS termination, redirect HTTP->HTTPS
- [ ] [High] JWT revocation support (danh sách token đã bị thu hồi, đặc biệt khi bị lộ token)
- [ ] [Medium] Token binding (ràng buộc JWT với IP/session/device nếu cần)
- [ ] [High] Support Mutual TLS (mTLS) giữa Gateway và Backend (ngăn service lạ gửi request vào backend)

### Bảo mật & Audit

- [ ] [High] Bảo vệ endpoint quản trị gateway (admin API, dashboard)
- [ ] [High] Log mọi request cross-tenant, cảnh báo khi có truy cập bất thường
- [ ] [High] Audit log immutable, lưu đủ 6 năm (HIPAA/GDPR)
- [ ] [High] Cảnh báo khi có brute force, DDoS, scan endpoint
- [ ] [Medium] Log thêm thông tin user-agent, geo-location IP (nếu cần audit cao)

### Context & Propagation

- [ ] [High] Truyền đầy đủ context qua header chuẩn (X-Tenant-Id, X-User-Id, X-Trace-Id, X-Request-Id, ...)
- [ ] [High] Gắn trace ID + span ID vào mọi log (tích hợp OpenTelemetry)

### Monitoring & Observability

- [ ] [High] Expose structured Prometheus metrics (ví dụ: emr_db_up{tenant="a", db="core"} 1)
- [ ] [Medium] Thống kê sức khỏe theo nhóm tenant (theo khu vực, bệnh viện lớn nhỏ) để ưu tiên cảnh báo
- [ ] [High] Tích hợp Prometheus metrics cho gateway (request count, latency, error rate, ... theo tenant)
- [ ] [High] Tích hợp alerting (Grafana Alert, email, Slack, ... khi gateway fail)
- [ ] [High] Tích hợp OpenTelemetry collector để export trace + log + metrics sang Jaeger, Tempo, Loki...
- [ ] [Medium] Tạo dashboard theo từng tenant: số request, tỉ lệ lỗi, độ trễ trung bình...
- [ ] [Medium] Ghi log health check định kỳ vào hệ thống monitoring/audit

### Dynamic Config (nếu dùng Kong/Traefik)

- [ ] [Medium] Hỗ trợ reload cấu hình không cần downtime (hot-reload hoặc API-based config)
- [ ] [Medium] Đồng bộ tenant mới từ DB/Redis vào routing config

### Failover / Retry

- [ ] [High] Hỗ trợ retry tự động nếu backend timeout (giới hạn retry + circuit breaker)
- [ ] [High] Load balancing nhiều instance backend theo tenant

### Kiểm thử & tài liệu

- [ ] [High] Unit test, integration test cho middleware, routing, context injection
- [ ] [High] Test multi-tenant routing (subdomain, header, path)
- [ ] [High] Test rate limit, IP whitelist, CORS
- [ ] [High] Test resilience: mô phỏng backend down, tenant DB down, kiểm tra gateway phản hồi đúng
- [ ] [High] Test isolation: request tenant A không thể truy cập resource tenant B
- [ ] [High] Test failover + timeout handling
- [ ] [Medium] Test toàn diện với chaotic test: delay backend, drop connection, DB crash → Gateway phản ứng ra sao?
- [ ] [Medium] Kiểm thử concurrent tenants (100+), concurrent users (1000+)
- [ ] [Medium] Tài liệu cấu hình gateway, hướng dẫn tích hợp backend
- [ ] [Medium] Hướng dẫn sử dụng, vận hành, backup/restore cấu hình gateway

## 2. Bổ sung checklist nâng cao

- [ ] [Medium] Hỗ trợ dynamic routing (thêm tenant mới không cần reload gateway)
- [ ] [Medium] Hỗ trợ canary release, blue/green deployment qua gateway
- [ ] [Medium] Hỗ trợ API versioning, rewrite path, custom rewrite rule
- [ ] [Medium] Hỗ trợ JWT validation, OAuth2 proxy, SSO integration tại gateway
- [ ] [Medium] Hỗ trợ WebSocket, gRPC proxy nếu backend cần
- [ ] [Medium] Tích hợp WAF (Web Application Firewall) cho gateway
- [ ] [Medium] Load test cho gateway với nhiều tenant, nhiều request đồng thời
- [ ] [Medium] Ghi chú kỹ quyền audit cần tuân thủ chuẩn ISO 27799 / HIPAA về bảo mật gateway

## 3. Quy trình kiểm tra & xác thực chất lượng module API Gateway

- [High] **Kiểm thử tự động:**
  - [ ] [High] Unit test, integration test, e2e test cho toàn bộ API gateway, middleware, guard, proxy, rate limit
  - [ ] [High] Test isolation dữ liệu, route, context giữa các tenant
  - [ ] [High] Test coverage đạt tối thiểu 80% function/branch/line, fail CI nếu không đạt
  - [ ] [Medium] Mutation test (StrykerJS hoặc tương đương) để đánh giá chất lượng test
- [High] **Kiểm thử bảo mật:**
  - [ ] [High] Test RBAC, ABAC, phân quyền route, cross-tenant
  - [ ] [High] Test middleware auth, mTLS, tenant isolation, IP whitelist
  - [ ] [High] Test rate limit, brute force, audit log, session hijack, token revoke
  - [ ] [High] Test compliance: audit log immutable, retention, data masking, HIPAA/GDPR
- [High] **Kiểm thử hiệu năng:**
  - [ ] [High] Benchmark route forwarding, load balancing, cross-tenant
  - [ ] [High] Benchmark theo tenant size (lớn/vừa/nhỏ), schema khác nhau
  - [ ] [High] Benchmark khi nhiều request đồng thời (load test, stress test)
  - [ ] [Medium] Benchmark queue, job async, background task liên quan gateway
- [High] **Kiểm thử migration, rollback, versioning:**
  - [ ] [High] Test migration schema gateway, rollback, zero-downtime
  - [ ] [High] Test versioning API, backward compatibility
- [High] **Kiểm thử CI/CD & alert:**
  - [ ] [High] Tích hợp coverage, benchmark, mutation test vào pipeline CI/CD
  - [ ] [Medium] Tự động comment cảnh báo PR nếu coverage/benchmark giảm
  - [ ] [Medium] Gửi report coverage/benchmark vào dashboard/dev chat
- [High] **Kiểm thử tài liệu:**
  - [ ] [High] Validate OpenAPI/Swagger, Postman collection, doc lint (Spectral)
  - [ ] [High] Đảm bảo tài liệu luôn đồng bộ với code, có ví dụ, error, multi-tenant
- [High] **Kiểm thử manual & quy trình:**
  - [ ] [High] Test chuyển route, rollback, import/export cấu hình
  - [ ] [High] Checklist review trước khi release: security, compliance, performance, doc
