# Admin Portal API Endpoints

## Tổng quan

Admin Portal API cung cấp các endpoints để quản lý hệ thống, tenant, user, RBAC, và các cấu hình kỹ thuật. API này chỉ dành cho Super Admin và Kỹ thuật viên.

## Base URL
```
https://api.emr.com/admin/v1
```

## Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Role Required**: `SUPER_ADMIN` hoặc `TECHNICIAN`

## Endpoints

### 1. Tenant Management

#### GET /tenants
Lấy danh sách tất cả tenants
```json
{
  "data": [
    {
      "id": "tenant-001",
      "name": "Bệnh viện Bạch Mai",
      "domain": "bachmai.emr.com",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastSyncAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### POST /tenants
Tạo tenant mới
```json
{
  "name": "Bệnh viện Việt Đức",
  "domain": "vietduc.emr.com",
  "adminEmail": "admin@vietduc.com",
  "adminPassword": "secure-password",
  "config": {
    "maxUsers": 1000,
    "storageLimit": "100GB"
  }
}
```

#### PUT /tenants/{tenantId}
Cập nhật thông tin tenant
```json
{
  "name": "Bệnh viện Việt Đức - Cơ sở 2",
  "status": "SUSPENDED",
  "config": {
    "maxUsers": 2000
  }
}
```

#### DELETE /tenants/{tenantId}
Xóa tenant (soft delete)
```json
{
  "reason": "Dừng hoạt động",
  "effectiveDate": "2024-02-01T00:00:00Z"
}
```

### 2. User Management

#### GET /users
Lấy danh sách users (có thể filter theo tenant)
```json
{
  "data": [
    {
      "id": "user-001",
      "email": "admin@bachmai.com",
      "name": "Nguyễn Văn A",
      "role": "HOSPITAL_ADMIN",
      "tenantId": "tenant-001",
      "status": "ACTIVE",
      "lastLoginAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### POST /users
Tạo user mới
```json
{
  "email": "doctor@bachmai.com",
  "name": "Bác sĩ Nguyễn Văn B",
  "role": "DOCTOR",
  "tenantId": "tenant-001",
  "permissions": ["READ_PATIENT", "WRITE_PATIENT"]
}
```

#### PUT /users/{userId}
Cập nhật thông tin user
```json
{
  "name": "Bác sĩ Nguyễn Văn B - Trưởng khoa",
  "role": "DEPARTMENT_HEAD",
  "permissions": ["READ_PATIENT", "WRITE_PATIENT", "MANAGE_DEPARTMENT"]
}
```

### 3. RBAC Management

#### GET /roles
Lấy danh sách roles
```json
{
  "data": [
    {
      "id": "role-001",
      "name": "SUPER_ADMIN",
      "description": "Quản trị viên hệ thống",
      "permissions": ["*"],
      "isSystem": true
    }
  ]
}
```

#### POST /roles
Tạo role mới
```json
{
  "name": "DEPARTMENT_MANAGER",
  "description": "Quản lý khoa",
  "permissions": [
    "READ_PATIENT",
    "WRITE_PATIENT",
    "MANAGE_DEPARTMENT_USERS",
    "VIEW_DEPARTMENT_REPORTS"
  ]
}
```

#### GET /permissions
Lấy danh sách permissions
```json
{
  "data": [
    {
      "id": "perm-001",
      "name": "READ_PATIENT",
      "description": "Đọc thông tin bệnh nhân",
      "category": "PATIENT"
    }
  ]
}
```

### 4. System Configuration

#### GET /config
Lấy cấu hình hệ thống
```json
{
  "data": {
    "system": {
      "maintenanceMode": false,
      "maxFileSize": "10MB",
      "sessionTimeout": 3600
    },
    "security": {
      "passwordPolicy": {
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": true
      },
      "mfaRequired": true
    },
    "sync": {
      "interval": 300,
      "retryAttempts": 3
    }
  }
}
```

#### PUT /config
Cập nhật cấu hình hệ thống
```json
{
  "system": {
    "maintenanceMode": true,
    "maintenanceMessage": "Hệ thống đang bảo trì"
  }
}
```

### 5. Monitoring & Health

#### GET /health
Kiểm tra sức khỏe hệ thống
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "auth-api": "healthy",
    "ehr-api": "healthy",
    "sync-service": "healthy",
    "database": "healthy"
  },
  "tenants": {
    "total": 150,
    "healthy": 148,
    "unhealthy": 2
  }
}
```

#### GET /metrics
Lấy metrics hệ thống
```json
{
  "data": {
    "requests": {
      "total": 1000000,
      "success": 995000,
      "error": 5000
    },
    "performance": {
      "avgResponseTime": 150,
      "p95ResponseTime": 300
    },
    "storage": {
      "total": "1TB",
      "used": "750GB",
      "available": "250GB"
    }
  }
}
```

### 6. Audit Logs

#### GET /audit-logs
Lấy audit logs
```json
{
  "data": [
    {
      "id": "log-001",
      "userId": "user-001",
      "action": "CREATE_PATIENT",
      "resource": "patient-001",
      "tenantId": "tenant-001",
      "timestamp": "2024-01-15T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "details": {
        "patientName": "Nguyễn Văn C",
        "patientId": "P001"
      }
    }
  ]
}
```

### 7. Migration Management

#### GET /migrations
Lấy danh sách migrations
```json
{
  "data": [
    {
      "id": "migration-001",
      "name": "Add patient table",
      "version": "1.0.1",
      "status": "COMPLETED",
      "appliedAt": "2024-01-15T10:30:00Z",
      "duration": 5000
    }
  ]
}
```

#### POST /migrations/run
Chạy migration
```json
{
  "version": "1.0.2",
  "tenants": ["tenant-001", "tenant-002"]
}
```

### 8. Event Bus Management

#### GET /event-bus/queues
Lấy trạng thái queues
```json
{
  "data": [
    {
      "name": "patient-events",
      "messages": 150,
      "consumers": 5,
      "status": "healthy"
    }
  ]
}
```

#### POST /event-bus/queues/{queueName}/purge
Xóa tất cả messages trong queue
```json
{
  "reason": "Maintenance"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "code": "AUTH_001"
}
```

### 403 Forbidden
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions",
  "code": "RBAC_001"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Tenant not found",
  "code": "TENANT_001"
}
```

### 422 Validation Error
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "code": "VAL_001",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Rate Limiting

- **Standard**: 1000 requests/hour
- **Bulk Operations**: 100 requests/hour
- **Health Checks**: 10000 requests/hour

## Pagination

Tất cả endpoints trả về danh sách đều hỗ trợ pagination:

```
GET /tenants?page=1&limit=20&sort=name&order=asc
```

## Filtering & Searching

Hỗ trợ filter và search:

```
GET /users?tenantId=tenant-001&role=DOCTOR&search=nguyen
GET /audit-logs?action=CREATE&from=2024-01-01&to=2024-01-15
```

## WebSocket Events

### Real-time Updates
```javascript
// Kết nối WebSocket
const ws = new WebSocket('wss://api.emr.com/admin/ws');

// Lắng nghe events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'TENANT_STATUS_CHANGED':
      // Cập nhật UI khi tenant status thay đổi
      break;
    case 'SYSTEM_ALERT':
      // Hiển thị alert hệ thống
      break;
    case 'AUDIT_LOG_CREATED':
      // Cập nhật audit log real-time
      break;
  }
};
```

## Testing

### Postman Collection
Import collection: `Admin Portal API.postman_collection.json`

### Swagger Documentation
API documentation: `https://api.emr.com/admin/docs`

## Security Considerations

1. **Authentication**: JWT token với expiration time
2. **Authorization**: RBAC với granular permissions
3. **Rate Limiting**: Prevent abuse
4. **Audit Logging**: Log tất cả actions
5. **Input Validation**: Validate tất cả inputs
6. **CORS**: Configure cho admin portal domain
7. **HTTPS**: Force HTTPS cho tất cả requests 