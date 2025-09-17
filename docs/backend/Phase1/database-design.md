# Database Design - Multi-DB per Tenant Architecture

## Tổng quan kiến trúc

### Diagram 1: Kiến trúc tổng thể hệ thống

```
                        ┌────────────────────────────┐
                        │        Admin Portal        │
                        │  (Truy cập Central DB)     │
                        └────────────┬───────────────┘
                                     │
                            ┌────────▼────────┐
                            │   Central DB    │◄────────────────────────────────────────────┐
                            │(Tenant config,  │                                             │
                            │  metadata, logs)│                                             │
                            └────────┬────────┘                                             │
                                     │                                                      │
                  ┌──────────────────▼─────────────────┐                                    │
                  │         Central System             │◄────────────┐                      │
                  │ - Quản lý danh tính bệnh nhân      │             │                      │
                  │ - Định tuyến truy vấn theo tenant  │             │                      │
                  │ - Đồng bộ metadata bệnh nhân       │             │                      │
                  │ - Frontend Integration Layer       │             │                      │
                  │ - Shared Libraries Support         │             │                      │
                  └───────┬───────────────────┬────────┘             │                      │
                          │                   │                      │                      │
         ┌────────────────▼──┐      ┌─────────▼─────────┐    ┌───────▼────────┐    ┌────────▼───────┐
         │  Patient Portal   │      │ Hospital Portal   │    │  Hospital DB A │    │  Hospital DB B │
         │(Web/Mobile App)   │      │ (Bệnh viện A)     │    └────────────────┘    └────────────────┘
         │- Giao diện bệnh   │      │- Nhân viên y tế   │
         │  nhân truy cập    │      │  & bác sĩ         │
         │- Kết nối động tới │      │- Quản lý nội bộ   │
         │  DB bệnh viện qua │      │  theo phân quyền  │
         │  Central System   │      │- Shared Libraries │
         │- Shared Libraries │      │  Integration      │
         └───────────────────┘      └───────────────────┘
```

**Giải thích:**
- **Admin Portal**: Giao diện quản trị viên hệ thống, chỉ truy cập Central DB để quản lý tất cả bệnh viện
- **Central DB**: Lưu trữ cấu hình tenant, metadata, logs chung cho toàn hệ thống, bao gồm portal configs và shared libraries
- **Central System**: Bộ não điều phối, quản lý danh tính bệnh nhân, định tuyến request, hỗ trợ frontend integration và shared libraries
- **Patient Portal**: Ứng dụng cho bệnh nhân, kết nối động đến DB bệnh viện qua Central System, tích hợp shared libraries (web-ui, web-utils, types)
- **Hospital Portal**: Giao diện nội bộ cho nhân viên y tế, kết nối trực tiếp đến DB bệnh viện, tích hợp shared libraries
- **Hospital DB A/B**: Database riêng biệt cho từng bệnh viện với portal-specific configurations

**Ví dụ thực tế:**
```
1. Bệnh nhân Nguyễn Văn A đăng nhập Patient Portal
2. Central System kiểm tra: "Bệnh nhân này thuộc Bệnh viện ABC"
3. Chuyển request đến Hospital DB A (Bệnh viện ABC)
4. Bệnh nhân xem được lịch hẹn, đơn thuốc của mình tại Bệnh viện ABC
5. Bệnh viện XYZ không thể thấy dữ liệu này
6. Shared libraries (web-ui, web-utils, types) được load từ Central System
```

### Diagram 2: Chi tiết luồng dữ liệu với Frontend Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Portal  │    │  API Gateway    │    │  Auth Service   │
│                 │    │                 │    │                 │
│ - Quản lý tenant│    │ - Route request │    │ - JWT validation│
│ - Monitoring    │    │ - Load balance  │    │ - RBAC check    │
│ - System config │    │ - Rate limiting │    │ - Audit logging │
│ - Shared Libs   │    │ - CORS/CSP      │    │ - Portal Auth   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Central System      │
                    │                         │
                    │ ┌─────────────────────┐ │
                    │ │   Tenant Router     │ │
                    │ │ - Resolve tenant    │ │
                    │ │ - DB connection     │ │
                    │ │ - Context injection │ │
                    │ └─────────────────────┘ │
                    │ ┌─────────────────────┐ │
                    │ │ Frontend Integration│ │
                    │ │ - Portal APIs       │ │
                    │ │ - Shared Libraries  │ │
                    │ │ - Real-time Updates │ │
                    │ └─────────────────────┘ │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │Central DB │          │Tenant DB A│          │Tenant DB B│
    │           │          │           │          │           │
    │┌─────────┐│          │┌─────────┐│          │┌─────────┐│
    ││Tenants  ││          ││Patients ││          ││Patients ││
    ││Users    ││          ││Users    ││          ││Users    ││
    ││Configs  ││          ││Appoints ││          ││Appoints ││
    ││Sync Log ││          ││Records  ││          ││Records  ││
    ││Audit    ││          ││Billing  ││          ││Billing  ││
    ││Portal   ││          ││Portal   ││          ││Portal   ││
    ││Configs  ││          ││Configs  ││          ││Configs  ││
    │└─────────┘│          │└─────────┘│          │└─────────┘│
    └───────────┘          └───────────┘          └───────────┘
```

**Giải thích:**
- **API Gateway**: Cổng vào duy nhất, xử lý routing, load balancing, rate limiting, CORS/CSP cho multi-portal
- **Auth Service**: Xác thực JWT, kiểm tra quyền truy cập (RBAC), portal-specific authentication
- **Tenant Router**: Xác định tenant từ request, tạo kết nối DB tương ứng
- **Frontend Integration**: Hỗ trợ API cho 3 portals, shared libraries, real-time updates
- **Central DB**: Lưu thông tin quản trị (tenants, users, configs, logs, portal configs)
- **Tenant DB**: Database riêng cho từng bệnh viện với cấu trúc giống nhau, bao gồm portal configs

**Ví dụ thực tế:**
```
1. Bác sĩ đăng nhập Hospital Portal với JWT token
2. API Gateway nhận request, chuyển đến Auth Service
3. Auth Service validate JWT, kiểm tra quyền "doctor" cho Hospital Portal
4. Tenant Router xác định: "Token này thuộc Bệnh viện ABC"
5. Frontend Integration load shared libraries config cho Hospital Portal
6. Tạo kết nối đến Tenant DB A, bác sĩ chỉ thấy dữ liệu Bệnh viện ABC
```

### Diagram 3: Luồng xác thực và phân quyền

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ API Gateway │    │ Auth Module │
│             │    │             │    │             │
│ Login       │───▶│ Extract JWT │───▶│ Validate    │
│ Request     │    │ Route       │    │ Token       │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌─────────────┐    ┌─────────────┐
                    │Tenant Router│    │ RBAC Check  │
                    │             │    │             │
                    │ Resolve     │    │ Permissions │
                    │ Tenant      │    │ Roles       │
                    └─────────────┘    └─────────────┘
                           │                      │
                           └──────────┬───────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Tenant DB   │
                              │             │
                              │ Check User  │
                              │ Permissions │
                              └─────────────┘
```

**Giải thích:**
- **Client**: Ứng dụng gửi request đăng nhập với username/password
- **API Gateway**: Trích xuất JWT token từ request header
- **Auth Module**: Validate JWT token, kiểm tra tính hợp lệ
- **Tenant Router**: Xác định tenant từ JWT payload
- **RBAC Check**: Kiểm tra role và permission của user
- **Tenant DB**: Kiểm tra quyền chi tiết trong database

**Ví dụ thực tế:**
```
1. Bác sĩ Trần Văn B đăng nhập với username: "dr.tran", password: "***"
2. Auth Module tạo JWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   Payload: {user_id: "123", tenant: "hospital_abc", role: "doctor"}
3. Tenant Router đọc payload: "tenant: hospital_abc" → kết nối Hospital DB A
4. RBAC Check: "role: doctor" → có quyền xem bệnh nhân, tạo đơn thuốc
5. Tenant DB kiểm tra: "User 123 có quyền truy cập khoa Nội không?"
```

### Diagram 4: Luồng đồng bộ dữ liệu

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Tenant DB A │    │Sync Service │    │ Central DB  │
│             │    │             │    │             │
│ New Data    │───▶│ Push Data   │───▶│ Metadata    │
│ Created     │    │ Encrypt     │    │ Store       │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌─────────────┐    ┌─────────────┐
                    │ Event Bus   │    │ Audit Log   │
                    │             │    │             │
                    │ Publish     │    │ Track Sync  │
                    │ Events      │    │ History     │
                    └─────────────┘    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ DLQ/Retry   │
                    │             │
                    │ Handle      │
                    │ Failures    │
                    └─────────────┘
```

**Giải thích:**
- **Tenant DB**: Database bệnh viện có dữ liệu mới (bệnh nhân, lịch hẹn, đơn thuốc)
- **Sync Service**: Dịch vụ đồng bộ, mã hóa dữ liệu trước khi gửi
- **Central DB**: Lưu metadata (thống kê, logs) không phải dữ liệu chi tiết
- **Event Bus**: Phát tán sự kiện đồng bộ cho các service khác
- **Audit Log**: Ghi lại lịch sử đồng bộ
- **DLQ/Retry**: Xử lý lỗi đồng bộ, thử lại tự động

**Ví dụ thực tế:**
```
1. Bệnh viện ABC tạo bệnh nhân mới: "Nguyễn Thị C"
2. Sync Service phát hiện có dữ liệu mới, mã hóa và gửi lên Central DB
3. Central DB lưu metadata: "Hospital ABC có thêm 1 bệnh nhân mới"
4. Event Bus thông báo: "Có bệnh nhân mới tại Hospital ABC"
5. Audit Log ghi: "Sync thành công - 1 record - Hospital ABC - 2024-01-15"
6. Nếu lỗi mạng, DLQ lưu vào queue và thử lại sau 5 phút
```

### Diagram 5: Audit Trail Layer - Cross-tenant Monitoring

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │ API Gateway │    │ Auth Module │
│             │    │             │    │             │
│ Request     │───▶│ Extract     │───▶│ Validate    │
│             │    │ Headers     │    │ Token       │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                      │
                           ▼                      ▼
                    ┌─────────────┐    ┌─────────────┐
                    │Audit Trail  │    │ Tenant      │
                    │   Layer     │    │ Router      │
                    │             │    │             │
                    │ ┌─────────┐ │    │ Resolve     │
                    │ │Capture  │ │    │ Tenant      │
                    │ │Request  │ │    │ Context     │
                    │ │Headers  │ │    │             │
                    │ │User ID  │ │    │             │
                    │ │IP/Time  │ │    │             │
                    │ └─────────┘ │    │             │
                    └─────────────┘    └─────────────┘
                           │                      │
                           └──────────┬───────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ Central DB  │
                              │             │
                              │ ┌─────────┐ │
                              │ │Audit    │ │
                              │ │Logs     │ │
                              │ │Cross    │ │
                              │ │Tenant   │ │
                              │ │Access   │ │
                              │ └─────────┘ │
                              └─────────────┘
```

**Giải thích:**
- **Audit Trail Layer**: Layer ghi lại tất cả hoạt động xuyên tenant
- **Capture Request**: Thu thập thông tin request (headers, user ID, IP, timestamp)
- **Cross-tenant Access**: Theo dõi truy cập xuyên tenant
- **Central DB**: Lưu trữ audit logs tập trung

**Ví dụ thực tế:**
```
1. Bác sĩ từ Bệnh viện ABC truy cập dữ liệu bệnh nhân
2. Audit Trail Layer ghi lại:
   - User ID: "dr.nguyen@hospital_abc.com"
   - IP: "192.168.1.100"
   - Time: "2024-01-15 14:30:25"
   - Action: "VIEW_PATIENT_RECORD"
   - Resource: "patient_123"
   - Tenant: "hospital_abc"
3. Lưu vào Central DB để admin có thể theo dõi
4. Nếu có truy cập bất thường (IP lạ, giờ lạ) → gửi alert
```

### Diagram 6: Gateway Layer - Request Control & Throttling

```
┌─────────────┐    ┌─────────────────────────────────┐
│   Client    │    │        Gateway Layer            │
│             │    │                                 │
│ Request     │───▶│ ┌─────────────────────────────┐ │
│             │    │ │     Request Interceptor     │ │
│             │    │ │                             │ │
│             │    │ │ - Rate Limiting             │ │
│             │    │ │ - IP Whitelist/Blacklist    │ │
│             │    │ │ - Request Size Validation   │ │
│             │    │ │ - CORS Headers              │ │
│             │    │ └─────────────────────────────┘ │
└─────────────┘    │                                 │
                   │ ┌─────────────────────────────┐ │
                   │ │      Request Logger         │ │
                   │ │                             │ │
                   │ │ - Log all requests          │ │
                   │ │ - Track response times      │ │
                   │ │ - Monitor error rates       │ │
                   │ │ - Alert on anomalies        │ │
                   │ └─────────────────────────────┘ │
                   └─────────────────┬───────────────┘
                                     │
                                     ▼
                            ┌─────────────┐
                            │ Tenant DB   │
                            │             │
                            │ Process     │
                            │ Request     │
                            └─────────────┘
```

**Giải thích:**
- **Request Interceptor**: Bộ lọc request trước khi xử lý
- **Rate Limiting**: Giới hạn số request/giờ để tránh spam
- **IP Control**: Chặn IP xấu, cho phép IP tin cậy
- **Request Validation**: Kiểm tra kích thước, format request
- **Request Logger**: Ghi log tất cả request để monitoring

**Ví dụ thực tế:**
```
1. Bệnh nhân gửi 100 request/giây (có thể là bot tấn công)
2. Rate Limiting phát hiện: "IP 192.168.1.50 vượt quá 50 req/phút"
3. Trả về HTTP 429 "Too Many Requests"
4. Request Logger ghi: "Rate limit exceeded - IP: 192.168.1.50"
5. Nếu IP này tiếp tục spam → thêm vào blacklist
6. Admin nhận alert: "Có IP đang tấn công hệ thống"
```

### Diagram 7: Caching Layer - Patient Metadata Optimization

```
┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│Patient Portal│    │ API Gateway │    │   Cache     │
│              │    │             │    │   Layer     │
│ Request      │───▶│ Check Cache │───▶│ ┌─────────┐ │
│ Patient ID   │    │ Patient     │    │ │Redis/   │ │
│              │    │ Metadata    │    │ │Memcached│ │
└──────────────┘    └─────────────┘    │ │         │ │
                                       │ │Patient  │ │
                                       │ │Metadata │ │
                                       │ │Tenant   │ │
                                       │ │Mapping  │ │
                                       │ └─────────┘ │
                                       └─────────────┘
                                                │
                                                ▼
                                       ┌─────────────┐
                                       │ Central DB  │
                                       │             │
                                       │ ┌─────────┐ │
                                       │ │Patient  │ │
                                       │ │Registry │ │
                                       │ │Tenant   │ │
                                       │ │Mapping  │ │
                                       │ └─────────┘ │
                                       └─────────────┘
                                                │
                                                ▼
                                       ┌─────────────┐
                                       │ Tenant DB   │
                                       │             │
                                       │ Fetch       │
                                       │ Patient     │
                                       │ Data        │
                                       └─────────────┘
```

**Giải thích:**
- **Cache Layer**: Redis/Memcached lưu thông tin mapping patient-tenant
- **Patient Metadata**: Thông tin cơ bản về bệnh nhân và tenant
- **Central DB**: Lưu registry mapping patient-tenant
- **Tenant DB**: Database thực chứa dữ liệu chi tiết bệnh nhân

**Ví dụ thực tế:**
```
1. Bệnh nhân đăng nhập Patient Portal với CCCD: "123456789"
2. API Gateway kiểm tra cache: "CCCD 123456789 → Hospital ABC"
3. Cache hit → chuyển ngay đến Hospital DB A (0.1ms)
4. Nếu cache miss → query Central DB: "CCCD 123456789 thuộc tenant nào?"
5. Central DB trả về: "Hospital ABC"
6. Cập nhật cache và chuyển đến Hospital DB A
7. Lần sau bệnh nhân này đăng nhập → cache hit, nhanh hơn 100x
```

### Diagram 8: Enhanced Central System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Central System                               │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │   Gateway       │  │   Audit Trail   │  │     Cache       │  │
│ │     Layer       │  │     Layer       │  │     Layer       │  │
│ │                 │  │                 │  │                 │  │
│ │ • Rate Limiting │  │ • Cross-tenant  │  │ • Patient       │  │
│ │ • IP Control    │  │   Monitoring    │  │   Metadata      │  │
│ │ • Request Log   │  │ • Access Log    │  │ • Tenant        │  │
│ │ • CORS          │  │ • Security      │  │   Mapping       │  │
│ │ • Validation    │  │   Alerts        │  │ • Performance   │  │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │   Tenant        │  │     Auth        │  │     Sync        │  │
│ │   Router        │  │   Module        │  │   Service       │  │
│ │                 │  │                 │  │                 │  │
│ │ • Resolve       │  │ • JWT Validate  │  │ • Push/Pull     │  │
│ │   Tenant        │  │ • RBAC Check    │  │ • Conflict      │  │
│ │ • DB Connection │  │ • Permission    │  │   Resolution    │  │
│ │ • Context       │  │   Validation    │  │ • Encryption    │  │
│ │   Injection     │  │ • Audit Log     │  │ • Event Bus     │  │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │   Central DB    │
                            │                 │
                            │ ┌─────────────┐ │
                            │ │ Tenants     │ │
                            │ │ Users       │ │
                            │ │ Configs     │ │
                            │ │ Audit Logs  │ │
                            │ │ Sync History│ │
                            │ │ Cache Data  │ │
                            │ └─────────────┘ │
                            └─────────────────┘
```

**Giải thích:**
- **6 Layer Architecture**: Mỗi layer có trách nhiệm riêng biệt
- **Gateway Layer**: Bảo vệ, kiểm soát request
- **Audit Trail Layer**: Theo dõi, ghi log hoạt động
- **Cache Layer**: Tối ưu performance
- **Tenant Router**: Định tuyến đến đúng tenant
- **Auth Module**: Xác thực, phân quyền
- **Sync Service**: Đồng bộ dữ liệu

**Ví dụ thực tế:**
```
1. Bệnh nhân đăng nhập Patient Portal
2. Gateway Layer: Kiểm tra rate limit, IP, CORS
3. Audit Trail Layer: Ghi log "User login attempt"
4. Cache Layer: Kiểm tra mapping patient-tenant
5. Auth Module: Validate JWT token
6. Tenant Router: Xác định tenant "Hospital ABC"
7. Sync Service: Đồng bộ metadata nếu cần
8. Central DB: Lưu audit log, cache data
9. Chuyển request đến Hospital DB A
```

## 1. Central Database (Admin Portal)

### 1.1 Bảng quản lý Tenant
```sql
-- Bảng quản lý các bệnh viện/tenant
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL, -- Mã bệnh viện
    name VARCHAR(255) NOT NULL, -- Tên bệnh viện
    display_name VARCHAR(255), -- Tên hiển thị
    domain VARCHAR(255) UNIQUE, -- Domain riêng (optional)
    database_name VARCHAR(100) NOT NULL, -- Tên database của tenant
    database_host VARCHAR(255) NOT NULL, -- Host database
    database_port INTEGER DEFAULT 5432,
    database_username VARCHAR(100) NOT NULL,
    database_password_encrypted TEXT NOT NULL, -- Mã hóa password
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    subscription_plan VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
    max_users INTEGER DEFAULT 100,
    max_storage_gb INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng cấu hình tenant
CREATE TABLE tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string', -- string, json, boolean, number
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, config_key)
);

-- Bảng thống kê sử dụng tenant
CREATE TABLE tenant_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    active_users INTEGER DEFAULT 0,
    total_patients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    portal_usage JSONB, -- Thống kê sử dụng từng portal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, date)
);
```

### 1.2 Bảng quản lý User (Admin Portal)
```sql
-- Bảng users cho admin portal
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, technician, support
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, locked
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- tenant, user, system, portal, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete
    portal VARCHAR(50), -- admin, hospital, patient, all
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng user permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, permission_id)
);
```

### 1.3 Bảng Frontend Integration và Shared Libraries
```sql
-- Bảng cấu hình portal cho từng tenant
CREATE TABLE portal_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal_type VARCHAR(50) NOT NULL, -- admin, hospital, patient
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB, -- Cấu hình chi tiết cho portal
    theme_config JSONB, -- Cấu hình theme, colors, branding
    feature_flags JSONB, -- Feature flags cho portal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, portal_type)
);

-- Bảng cấu hình shared libraries
CREATE TABLE shared_library_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    library_type VARCHAR(50) NOT NULL, -- web-ui, web-utils, types
    version VARCHAR(50) NOT NULL,
    config JSONB, -- Cấu hình cho library
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, library_type, version)
);

-- Bảng cấu hình theme và UI components
CREATE TABLE ui_theme_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    theme_name VARCHAR(100) NOT NULL,
    theme_config JSONB NOT NULL, -- Colors, fonts, spacing, components
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng cấu hình i18n cho từng tenant
CREATE TABLE i18n_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    locale VARCHAR(10) NOT NULL, -- vi, en, etc.
    translations JSONB NOT NULL, -- Translation strings
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, locale)
);

-- Bảng cấu hình validation schemas
CREATE TABLE validation_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    schema_name VARCHAR(100) NOT NULL,
    schema_type VARCHAR(50) NOT NULL, -- patient, appointment, prescription
    schema_definition JSONB NOT NULL, -- Validation rules
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, schema_name)
);

-- Bảng real-time events cho frontend
CREATE TABLE real_time_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- appointment_created, patient_updated
    event_data JSONB NOT NULL,
    target_portal VARCHAR(50), -- admin, hospital, patient, all
    target_user_id UUID, -- Specific user or NULL for broadcast
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.4 Bảng đồng bộ và monitoring
```sql
-- Bảng lịch sử đồng bộ
CREATE TABLE sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- push, pull, metadata, frontend_config
    status VARCHAR(20) NOT NULL, -- success, failed, partial
    records_count INTEGER DEFAULT 0,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    error_message TEXT,
    checksum VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng health check
CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- database, api, queue, frontend
    status VARCHAR(20) NOT NULL, -- healthy, degraded, down
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng audit log cho admin portal
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50), -- admin, hospital, patient
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng frontend performance monitoring
CREATE TABLE frontend_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    page_load_time_ms INTEGER,
    api_response_time_ms INTEGER,
    bundle_size_kb INTEGER,
    error_count INTEGER DEFAULT 0,
    user_session_duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Tenant Database (Mỗi bệnh viện)

### 2.1 Bảng cấu hình tenant
```sql
-- Bảng thông tin bệnh viện
CREATE TABLE hospital_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    license_number VARCHAR(100),
    tax_code VARCHAR(50),
    logo_url VARCHAR(500),
    theme_config JSONB, -- Cấu hình giao diện
    business_hours JSONB, -- Giờ làm việc
    portal_configs JSONB, -- Cấu hình cho từng portal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng cấu hình hệ thống
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    portal VARCHAR(50), -- admin, hospital, patient, all
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_key, portal)
);
```

### 2.2 Bảng quản lý User (Hospital Portal)
```sql
-- Bảng users cho hospital portal
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role VARCHAR(50) NOT NULL, -- doctor, nurse, receptionist, admin
    department_id UUID, -- FK to departments
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    portal_access JSONB, -- Quyền truy cập portal (hospital, patient)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    head_doctor_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng roles và permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB, -- Array of permission strings
    portal VARCHAR(50) NOT NULL, -- hospital, patient, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
);
```

### 2.3 Bảng quản lý bệnh nhân
```sql
-- Bảng patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code VARCHAR(50) UNIQUE NOT NULL, -- Mã bệnh nhân nội bộ
    patient_global_id UUID, -- Định danh toàn cục để đồng bộ giữa các tenant
    cccd VARCHAR(20) UNIQUE, -- CCCD
    bhyt_number VARCHAR(20), -- Số BHYT
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10), -- male, female, other
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact JSONB, -- Thông tin liên hệ khẩn cấp
    medical_history JSONB, -- Tiền sử bệnh
    allergies JSONB, -- Dị ứng
    blood_type VARCHAR(10),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    insurance_info JSONB, -- Thông tin bảo hiểm
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, deceased
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Index cho patient_global_id để tối ưu đồng bộ
CREATE INDEX idx_patients_global_id ON patients(patient_global_id);
```

### 2.4 Bảng quản lý lịch hẹn
```sql
-- Bảng appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type VARCHAR(50) NOT NULL, -- consultation, follow_up, emergency
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled
    source VARCHAR(50) DEFAULT 'hospital_staff', -- web_portal, mobile_app, hospital_staff
    is_prepaid BOOLEAN DEFAULT FALSE, -- Thanh toán trước qua cổng thanh toán
    reason TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng appointment reminders
CREATE TABLE appointment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- sms, email, push
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT
);
```

### 2.5 Bảng hồ sơ bệnh án
```sql
-- Bảng medical records
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID REFERENCES users(id),
    record_type VARCHAR(50) NOT NULL, -- consultation, inpatient, outpatient
    admission_date DATE,
    discharge_date DATE,
    chief_complaint TEXT,
    present_illness TEXT,
    past_medical_history TEXT,
    physical_examination TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescription_id UUID, -- FK to prescriptions
    status VARCHAR(20) DEFAULT 'draft', -- draft, signed, archived
    version INTEGER DEFAULT 1,
    parent_record_id UUID REFERENCES medical_records(id), -- For versioning
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bảng prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_code VARCHAR(50) UNIQUE NOT NULL,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    prescription_date DATE NOT NULL,
    diagnosis TEXT,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng prescription items
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INTEGER,
    quantity INTEGER,
    unit VARCHAR(50),
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lab orders
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id),
    order_date DATE NOT NULL,
    lab_type VARCHAR(100) NOT NULL, -- blood_test, xray, mri, etc.
    test_name VARCHAR(255) NOT NULL,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'ordered', -- ordered, in_progress, completed, cancelled
    result_file_path VARCHAR(500),
    result_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 Bảng tài chính và thanh toán
```sql
-- Bảng billing
CREATE TABLE billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    medical_record_id UUID REFERENCES medical_records(id),
    total_amount DECIMAL(12,2) NOT NULL,
    insurance_amount DECIMAL(12,2) DEFAULT 0,
    patient_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng billing items
CREATE TABLE billing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID REFERENCES billing(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL, -- consultation, medicine, lab_test
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7 Bảng audit và logging
```sql
-- Bảng audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50), -- hospital, patient, admin
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng system logs
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL, -- info, warning, error, debug
    message TEXT NOT NULL,
    context JSONB,
    portal VARCHAR(50), -- hospital, patient, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng patient login logs (cho Patient Portal)
CREATE TABLE patient_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_user_id UUID REFERENCES patient_users(id) ON DELETE CASCADE,
    login_method VARCHAR(50) NOT NULL, -- username_password, otp, biometric
    ip_address INET,
    user_agent TEXT,
    device_info JSONB, -- Thông tin thiết bị (mobile, desktop, app version)
    login_status VARCHAR(20) NOT NULL, -- success, failed, locked
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng patient access logs (tracking hành vi bệnh nhân)
CREATE TABLE patient_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_user_id UUID REFERENCES patient_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- view_prescription, view_lab_result, book_appointment
    resource_type VARCHAR(100) NOT NULL, -- prescription, lab_result, appointment
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    session_duration_seconds INTEGER, -- Thời gian xem trang
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng portal usage analytics
CREATE TABLE portal_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal VARCHAR(50) NOT NULL, -- hospital, patient, admin
    user_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    session_id VARCHAR(255),
    page_visited VARCHAR(255),
    time_spent_seconds INTEGER,
    actions_performed JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Patient Portal Database (Shared với Hospital Portal)

Patient Portal sử dụng cùng database với Hospital Portal của bệnh viện tương ứng, nhưng có các bảng riêng cho:

```sql
-- Bảng patient portal users
CREATE TABLE patient_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(20),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng patient notifications
CREATE TABLE patient_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- appointment, prescription, lab_result
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Bảng patient feedback
CREATE TABLE patient_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    doctor_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    feedback_type VARCHAR(50), -- service, doctor, facility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng patient portal preferences
CREATE TABLE patient_portal_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, preference_key)
);
```

## 4. Migration và Schema Management

### 4.1 Bảng migration history
```sql
-- Trong mỗi tenant database
CREATE TABLE migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER
);
```

## 5. Central Database Enhancements

### 5.1 Bảng central_patient_index
```sql
-- Bảng index bệnh nhân toàn cục ở Central DB
CREATE TABLE central_patient_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_global_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    patient_local_id UUID NOT NULL, -- ID trong DB tenant
    cccd VARCHAR(20),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_global_id, tenant_id)
);

-- Indexes cho tìm kiếm nhanh
CREATE INDEX idx_central_patient_cccd ON central_patient_index(cccd);
CREATE INDEX idx_central_patient_global_id ON central_patient_index(patient_global_id);
CREATE INDEX idx_central_patient_tenant ON central_patient_index(tenant_id);
```

### 5.2 Bảng tenant_features
```sql
-- Bảng quản lý tính năng cho từng tenant
CREATE TABLE tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL, -- e.g. "patient_portal", "e_rx", "lab_module"
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB, -- Cấu hình chi tiết cho feature
    portal VARCHAR(50), -- admin, hospital, patient, all
    enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disabled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, feature_key, portal)
);

-- Bảng feature definitions
CREATE TABLE feature_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- portal, module, integration
    portal VARCHAR(50), -- admin, hospital, patient, all
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Bảng data_sync_jobs
```sql
-- Bảng quản lý job đồng bộ dữ liệu cho Data Warehouse
CREATE TABLE data_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- "daily_summary", "medical_record", "billing", "frontend_config"
    status VARCHAR(20) NOT NULL, -- pending, running, completed, failed
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    record_count INTEGER DEFAULT 0,
    error_message TEXT,
    config JSONB, -- Cấu hình sync (tables, filters, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng data_sync_history
CREATE TABLE data_sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_job_id UUID REFERENCES data_sync_jobs(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_count INTEGER DEFAULT 0,
    sync_status VARCHAR(20) NOT NULL, -- success, failed, partial
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Data Warehouse Integration

### 6.1 Bảng data_warehouse_config
```sql
-- Cấu hình kết nối Data Warehouse
CREATE TABLE data_warehouse_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    dw_type VARCHAR(50) NOT NULL, -- bigquery, redshift, snowflake
    connection_config JSONB NOT NULL, -- Thông tin kết nối (encrypted)
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 7. Frontend Integration Database Schema

### 7.1 Bảng API Gateway Configuration
```sql
-- Bảng cấu hình API Gateway cho từng portal
CREATE TABLE api_gateway_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    endpoint_pattern VARCHAR(255) NOT NULL,
    rate_limit_per_minute INTEGER DEFAULT 100,
    cors_origins JSONB, -- Allowed origins
    security_headers JSONB, -- Security headers config
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, portal, endpoint_pattern)
);

-- Bảng API versioning
CREATE TABLE api_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    version VARCHAR(20) NOT NULL, -- v1, v2, etc.
    is_active BOOLEAN DEFAULT TRUE,
    deprecated_at TIMESTAMP,
    sunset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, portal, version)
);

-- Indexes cho API Gateway
CREATE INDEX idx_api_gateway_configs_portal ON api_gateway_configs(tenant_id, portal, is_active);
CREATE INDEX idx_api_versions_active ON api_versions(tenant_id, portal, is_active);
```

### 7.2 Bảng WebSocket và Real-time Events
```sql
-- Bảng WebSocket connections
CREATE TABLE websocket_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    patient_id UUID, -- Removed FK constraint to avoid cross-schema issues
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    ip_address INET,
    user_agent TEXT,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Bảng real-time event subscriptions
CREATE TABLE event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    patient_id UUID, -- Removed FK constraint to avoid cross-schema issues
    event_type VARCHAR(100) NOT NULL,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    subscription_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho WebSocket và Events
CREATE INDEX idx_websocket_connections_active ON websocket_connections(tenant_id, portal, is_active);
CREATE INDEX idx_websocket_connections_user ON websocket_connections(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_event_subscriptions_active ON event_subscriptions(tenant_id, portal, is_active);
CREATE INDEX idx_event_subscriptions_user ON event_subscriptions(user_id) WHERE user_id IS NOT NULL;
```

### 7.3 Bảng Frontend Performance và Analytics
```sql
-- Bảng frontend error tracking
CREATE TABLE frontend_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    user_id UUID,
    patient_id UUID, -- Removed FK constraint to avoid cross-schema issues
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    user_agent TEXT,
    page_url VARCHAR(500),
    component_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng frontend analytics
CREATE TABLE frontend_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    user_id UUID,
    patient_id UUID, -- Removed FK constraint to avoid cross-schema issues
    event_type VARCHAR(100) NOT NULL, -- page_view, button_click, form_submit
    event_data JSONB,
    session_id VARCHAR(255),
    page_url VARCHAR(500),
    referrer_url VARCHAR(500),
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho Frontend Analytics
CREATE INDEX idx_frontend_errors_portal ON frontend_errors(portal, created_at);
CREATE INDEX idx_frontend_errors_user ON frontend_errors(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_frontend_analytics_portal ON frontend_analytics(portal, created_at);
CREATE INDEX idx_frontend_analytics_user ON frontend_analytics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_frontend_analytics_event_data ON frontend_analytics USING GIN(event_data);
CREATE INDEX idx_frontend_analytics_device_info ON frontend_analytics USING GIN(device_info);
```

## 8. Enhanced Indexes và Performance

### 8.1 Indexes bổ sung cho các bảng lớn
```sql
-- Central Database
CREATE INDEX idx_central_patient_cccd ON central_patient_index(cccd);
CREATE INDEX idx_central_patient_global_id ON central_patient_index(patient_global_id);
CREATE INDEX idx_tenant_features_enabled ON tenant_features(tenant_id, is_enabled);
CREATE INDEX idx_data_sync_jobs_status ON data_sync_jobs(status, tenant_id);
CREATE INDEX idx_portal_configs_tenant ON portal_configs(tenant_id, portal_type);
CREATE INDEX idx_shared_library_configs_active ON shared_library_configs(tenant_id, library_type, is_active);
CREATE INDEX idx_real_time_events_tenant ON real_time_events(tenant_id, target_portal, is_sent);
CREATE INDEX idx_frontend_performance_logs_portal ON frontend_performance_logs(tenant_id, portal, created_at);

-- Tenant Database - Critical Performance Indexes
CREATE INDEX idx_patients_global_id ON patients(patient_global_id);
CREATE INDEX idx_patients_cccd ON patients(cccd);
CREATE INDEX idx_patients_bhyt ON patients(bhyt_number);
CREATE INDEX idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_source ON appointments(source, created_at);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id, created_at);
CREATE INDEX idx_medical_records_doctor ON medical_records(doctor_id, created_at);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id, prescription_date);
CREATE INDEX idx_lab_orders_doctor ON lab_orders(doctor_id, order_date);
CREATE INDEX idx_billing_patient ON billing(patient_id, created_at);
CREATE INDEX idx_billing_appointment ON billing(appointment_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_portal ON audit_logs(portal, created_at);
CREATE INDEX idx_patient_login_logs_status ON patient_login_logs(login_status, created_at);
CREATE INDEX idx_patient_access_logs_action ON patient_access_logs(action, created_at);
CREATE INDEX idx_portal_usage_analytics_portal ON portal_usage_analytics(portal, created_at);
```

### 8.2 JSONB Indexes cho Performance
```sql
-- Indexes cho JSONB columns
CREATE INDEX idx_tenant_usage_stats_portal_usage ON tenant_usage_stats USING GIN(portal_usage);
CREATE INDEX idx_portal_configs_config ON portal_configs USING GIN(config);
CREATE INDEX idx_portal_configs_theme_config ON portal_configs USING GIN(theme_config);
CREATE INDEX idx_portal_configs_feature_flags ON portal_configs USING GIN(feature_flags);
CREATE INDEX idx_shared_library_configs_config ON shared_library_configs USING GIN(config);
CREATE INDEX idx_ui_theme_configs_theme_config ON ui_theme_configs USING GIN(theme_config);
CREATE INDEX idx_i18n_configs_translations ON i18n_configs USING GIN(translations);
CREATE INDEX idx_validation_schemas_schema_definition ON validation_schemas USING GIN(schema_definition);
CREATE INDEX idx_real_time_events_event_data ON real_time_events USING GIN(event_data);
CREATE INDEX idx_patients_emergency_contact ON patients USING GIN(emergency_contact);
CREATE INDEX idx_patients_medical_history ON patients USING GIN(medical_history);
CREATE INDEX idx_patients_allergies ON patients USING GIN(allergies);
CREATE INDEX idx_patients_insurance_info ON patients USING GIN(insurance_info);
CREATE INDEX idx_users_portal_access ON users USING GIN(portal_access);
CREATE INDEX idx_roles_permissions ON roles USING GIN(permissions);
CREATE INDEX idx_audit_logs_old_values ON audit_logs USING GIN(old_values);
CREATE INDEX idx_audit_logs_new_values ON audit_logs USING GIN(new_values);
CREATE INDEX idx_patient_login_logs_device_info ON patient_login_logs USING GIN(device_info);
CREATE INDEX idx_portal_usage_analytics_actions_performed ON portal_usage_analytics USING GIN(actions_performed);
```

## 9. Security và Compliance Enhancements

### 9.1 Enhanced User Security
```sql
-- Cải thiện bảng users với security features
ALTER TABLE users ADD COLUMN password_salt VARCHAR(255);
ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN password_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Cải thiện bảng patient_users với security features
ALTER TABLE patient_users ADD COLUMN password_salt VARCHAR(255);
ALTER TABLE patient_users ADD COLUMN password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE patient_users ADD COLUMN password_expires_at TIMESTAMP;
ALTER TABLE patient_users ADD COLUMN last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Bảng password history để tuân thủ chính sách rotation
CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    password_salt VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID REFERENCES patient_users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    password_salt VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho password history
CREATE INDEX idx_password_history_user ON password_history(user_id, created_at);
CREATE INDEX idx_patient_password_history_user ON patient_password_history(patient_user_id, created_at);
```

### 9.2 Enhanced Security Configuration
```sql
-- Bảng cấu hình bảo mật cho từng portal
CREATE TABLE security_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    config_type VARCHAR(100) NOT NULL, -- cors, csp, rate_limiting, session
    config_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, portal, config_type)
);

-- Bảng IP whitelist/blacklist
CREATE TABLE ip_access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    portal VARCHAR(50) NOT NULL, -- admin, hospital, patient
    ip_address INET NOT NULL,
    access_type VARCHAR(20) NOT NULL, -- whitelist, blacklist
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, portal, ip_address)
);

-- Cải thiện bảng tenants với encryption standard
ALTER TABLE tenants ADD COLUMN encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM';
ALTER TABLE tenants ADD COLUMN encryption_key_id VARCHAR(255); -- KMS/Vault key ID
ALTER TABLE tenants ADD COLUMN database_password_encrypted_iv VARCHAR(255); -- Initialization vector

-- Cải thiện bảng ip_access_control với CIDR support
ALTER TABLE ip_access_control ADD COLUMN ip_range CIDR;
ALTER TABLE ip_access_control ADD COLUMN subnet_mask INTEGER;
ALTER TABLE ip_access_control ADD COLUMN country_code VARCHAR(10);
ALTER TABLE ip_access_control ADD COLUMN organization VARCHAR(255);

-- Bảng security audit
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    security_event VARCHAR(100) NOT NULL, -- login_failed, password_changed, access_denied
    ip_address INET,
    user_agent TEXT,
    event_details JSONB,
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho security
CREATE INDEX idx_security_configs_portal ON security_configs(tenant_id, portal, config_type);
CREATE INDEX idx_ip_access_control_portal ON ip_access_control(tenant_id, portal, access_type);
CREATE INDEX idx_security_audit_logs_event ON security_audit_logs(security_event, created_at);
CREATE INDEX idx_security_audit_logs_risk ON security_audit_logs(risk_level, created_at);
CREATE INDEX idx_ip_access_control_range ON ip_access_control(ip_range) WHERE ip_range IS NOT NULL;
```

### 9.3 Data Integrity và Compliance
```sql
-- Constraints cho time integrity
ALTER TABLE appointments ADD CONSTRAINT chk_appointment_time 
    CHECK (start_time < end_time);

ALTER TABLE lab_orders ADD CONSTRAINT chk_lab_order_date 
    CHECK (order_date <= result_date OR result_date IS NULL);

ALTER TABLE billing ADD CONSTRAINT chk_billing_amount 
    CHECK (total_amount >= 0 AND patient_amount >= 0 AND insurance_amount >= 0);

ALTER TABLE appointment_reminders ADD CONSTRAINT chk_reminder_time 
    CHECK (scheduled_at > created_at);

-- Constraints cho medical records versioning
ALTER TABLE medical_records ADD CONSTRAINT chk_medical_record_version 
    CHECK (version > 0);

-- Constraints cho patient global ID
ALTER TABLE patients ADD CONSTRAINT chk_patient_global_id_not_null 
    CHECK (patient_global_id IS NOT NULL);

ALTER TABLE central_patient_index ADD CONSTRAINT chk_central_patient_global_id_not_null 
    CHECK (patient_global_id IS NOT NULL);

-- Constraints cho prescriptions
ALTER TABLE prescriptions ADD CONSTRAINT fk_prescriptions_doctor 
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Bảng để đảm bảo chỉ có 1 bản "current" cho medical records
CREATE TABLE medical_record_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    current_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id)
);

-- Trigger để tự động cập nhật current record
CREATE OR REPLACE FUNCTION update_current_medical_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO medical_record_versions (patient_id, current_record_id)
    VALUES (NEW.patient_id, NEW.id)
    ON CONFLICT (patient_id) 
    DO UPDATE SET current_record_id = NEW.id, updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_current_medical_record
    AFTER INSERT OR UPDATE ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_current_medical_record();
```

## 10. Monitoring và Alerting Enhancements

### 10.1 Enhanced Health Monitoring
```sql
-- Bảng uptime history cho long-term monitoring
CREATE TABLE uptime_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- database, api, queue, frontend
    status VARCHAR(20) NOT NULL, -- healthy, degraded, down
    response_time_ms INTEGER,
    error_message TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cải thiện bảng monitoring_alerts
ALTER TABLE monitoring_alerts ADD COLUMN acknowledged_at TIMESTAMP;
ALTER TABLE monitoring_alerts ADD COLUMN acknowledged_by UUID REFERENCES users(id);
ALTER TABLE monitoring_alerts ADD COLUMN escalation_level INTEGER DEFAULT 1;
ALTER TABLE monitoring_alerts ADD COLUMN auto_resolve_after_hours INTEGER;

-- Bảng alert rules
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- threshold, anomaly, pattern
    rule_config JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho monitoring
CREATE INDEX idx_uptime_history_service ON uptime_history(tenant_id, service_name, recorded_at);
CREATE INDEX idx_monitoring_alerts_unresolved ON monitoring_alerts(tenant_id, is_resolved, severity) WHERE is_resolved = FALSE;
CREATE INDEX idx_alert_rules_active ON alert_rules(tenant_id, is_active);
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name);
```

## 11. Performance Optimization và Caching

### 11.1 Query Optimization
```sql
-- Materialized views cho reporting
CREATE MATERIALIZED VIEW patient_summary_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
    COUNT(CASE WHEN date_of_birth >= CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as adult_patients,
    COUNT(CASE WHEN date_of_birth < CURRENT_DATE - INTERVAL '18 years' THEN 1 END) as child_patients
FROM patients
GROUP BY tenant_id;

CREATE MATERIALIZED VIEW appointment_summary_stats AS
SELECT 
    tenant_id,
    DATE(appointment_date) as appointment_day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
FROM appointments
GROUP BY tenant_id, DATE(appointment_date);

-- Indexes cho materialized views
CREATE INDEX idx_patient_summary_stats_tenant ON patient_summary_stats(tenant_id);
CREATE INDEX idx_appointment_summary_stats_tenant_day ON appointment_summary_stats(tenant_id, appointment_day);

-- Refresh function cho materialized views
CREATE OR REPLACE FUNCTION refresh_patient_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY patient_summary_stats;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_appointment_summary_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary_stats;
END;
$$ LANGUAGE plpgsql;
```

### 11.2 Partitioning Strategy
```sql
-- Partitioning cho audit_logs theo thời gian
CREATE TABLE audit_logs_partitioned (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    portal VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Tạo partitions cho từng tháng
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Tương tự cho các tháng khác...

-- Indexes cho partitioned table
CREATE INDEX idx_audit_logs_partitioned_user ON audit_logs_partitioned(user_id, created_at);
CREATE INDEX idx_audit_logs_partitioned_portal ON audit_logs_partitioned(portal, created_at);
```

## Lưu ý quan trọng

### Frontend Integration
- **Portal Isolation**: Mỗi portal (admin, hospital, patient) có cấu hình riêng biệt
- **Shared Libraries**: Backend cung cấp API cho web-ui, web-utils, types
- **Real-time Updates**: WebSocket/SSE cho real-time notifications
- **Performance Monitoring**: Tracking frontend performance và errors
- **Security**: CORS, CSP, rate limiting cho từng portal
- **API Versioning**: Hỗ trợ versioning cho từng portal
- **Analytics**: Tracking user behavior và portal usage

### Multi-tenant Security
- **Data Isolation**: Hoàn toàn tách biệt dữ liệu giữa các tenant
- **Portal Isolation**: Mỗi portal có quyền truy cập riêng
- **Audit Trail**: Ghi log tất cả hoạt động xuyên tenant
- **Access Control**: IP whitelist/blacklist cho từng portal
- **Portal-specific Permissions**: RBAC riêng cho từng portal
- **Password Security**: Salt, rotation, history tracking
- **Encryption Standards**: AES-256-GCM với KMS/Vault integration

### Performance Optimization
- **Caching**: Redis cho patient metadata và portal configs
- **Indexing**: Indexes tối ưu cho portal-specific queries và JSONB columns
- **Connection Pooling**: Tối ưu kết nối database cho multi-tenant
- **Query Optimization**: Pagination, lazy loading, materialized views
- **Frontend Performance**: Monitoring và optimization cho từng portal
- **Partitioning**: Time-based partitioning cho audit logs
- **JSONB Optimization**: GIN indexes cho nested data queries

### Data Integrity & Compliance
- **Time Constraints**: CHECK constraints cho appointment times, lab dates
- **Versioning Control**: Medical records versioning với current record tracking
- **Audit Compliance**: Immutable audit logs với partitioning
- **Migration Management**: Central và tenant migration tracking
- **Health Monitoring**: Uptime history và alert management
- **Security Auditing**: Comprehensive security event logging

### Database Schema Highlights
- **Portal Configs**: Cấu hình riêng cho từng portal (admin, hospital, patient)
- **Shared Libraries Support**: Database schema hỗ trợ web-ui, web-utils, types
- **Real-time Events**: WebSocket connections và event subscriptions
- **Frontend Analytics**: Error tracking và user behavior analytics
- **API Gateway Configs**: Rate limiting, CORS, security headers per portal
- **Enhanced Security**: Password history, encryption standards, IP control
- **Performance**: Materialized views, partitioning, comprehensive indexing
- **Monitoring**: Uptime tracking, alert management, migration history 
```

### 10.2 Migration Management
```sql
-- Bảng migration history cho Central DB
CREATE TABLE central_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(255),
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- success, failed, partial
    error_message TEXT
);

-- Cải thiện bảng migrations trong tenant DB
ALTER TABLE migrations ADD COLUMN status VARCHAR(20) DEFAULT 'success';
ALTER TABLE migrations ADD COLUMN error_message TEXT;
ALTER TABLE migrations ADD COLUMN rollback_script TEXT;

-- Bảng migration dependencies
CREATE TABLE migration_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_name VARCHAR(255) NOT NULL,
    depends_on_migration VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes cho migration
CREATE INDEX idx_central_migrations_version ON central_migrations(version);
CREATE INDEX idx_migrations_status ON migrations(status);
CREATE INDEX idx_migration_dependencies_migration ON migration_dependencies(migration_name