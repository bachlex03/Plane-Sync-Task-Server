# Hospital Portal API Endpoints

## Tổng quan

Hospital Portal API cung cấp các endpoints để quản lý nghiệp vụ bệnh viện bao gồm: quản lý bệnh nhân, lịch hẹn, hồ sơ bệnh án, bác sĩ, và báo cáo. API này dành cho nhân viên y tế và quản trị viên bệnh viện.

## Base URL
```
https://api.emr.com/hospital/v1
```

## Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Role Required**: `HOSPITAL_ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`

## Endpoints

### 1. Patient Management

#### GET /patients
Lấy danh sách bệnh nhân
```json
{
  "data": [
    {
      "id": "patient-001",
      "patientId": "P001",
      "name": "Nguyễn Văn A",
      "dateOfBirth": "1990-01-01",
      "gender": "MALE",
      "phone": "0123456789",
      "email": "patient@email.com",
      "address": "Hà Nội",
      "bloodType": "A+",
      "allergies": ["Penicillin"],
      "emergencyContact": {
        "name": "Nguyễn Thị B",
        "relationship": "Vợ",
        "phone": "0987654321"
      },
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastVisitAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500
  }
}
```

#### POST /patients
Tạo bệnh nhân mới
```json
{
  "name": "Trần Văn C",
  "dateOfBirth": "1985-05-15",
  "gender": "MALE",
  "phone": "0123456789",
  "email": "tranvan.c@email.com",
  "address": "Hà Nội",
  "bloodType": "O+",
  "allergies": [],
  "emergencyContact": {
    "name": "Trần Thị D",
    "relationship": "Vợ",
    "phone": "0987654321"
  },
  "insurance": {
    "number": "BH123456789",
    "provider": "Bảo hiểm Y tế",
    "expiryDate": "2025-12-31"
  }
}
```

#### GET /patients/{patientId}
Lấy chi tiết bệnh nhân
```json
{
  "data": {
    "id": "patient-001",
    "patientId": "P001",
    "name": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-01",
    "gender": "MALE",
    "phone": "0123456789",
    "email": "patient@email.com",
    "address": "Hà Nội",
    "bloodType": "A+",
    "allergies": ["Penicillin"],
    "emergencyContact": {
      "name": "Nguyễn Thị B",
      "relationship": "Vợ",
      "phone": "0987654321"
    },
    "insurance": {
      "number": "BH123456789",
      "provider": "Bảo hiểm Y tế",
      "expiryDate": "2025-12-31"
    },
    "medicalHistory": [
      {
        "id": "history-001",
        "diagnosis": "Tiểu đường type 2",
        "treatment": "Metformin 500mg",
        "date": "2023-12-01",
        "doctor": "Dr. Nguyễn Văn E"
      }
    ],
    "appointments": [
      {
        "id": "appointment-001",
        "date": "2024-01-20T09:00:00Z",
        "doctor": "Dr. Trần Văn F",
        "department": "Nội tiết",
        "status": "SCHEDULED"
      }
    ]
  }
}
```

#### PUT /patients/{patientId}
Cập nhật thông tin bệnh nhân
```json
{
  "phone": "0123456789",
  "email": "newemail@email.com",
  "address": "Hà Nội - Cập nhật",
  "allergies": ["Penicillin", "Sulfa"],
  "emergencyContact": {
    "name": "Nguyễn Thị B",
    "relationship": "Vợ",
    "phone": "0987654321"
  }
}
```

### 2. Appointment Management

#### GET /appointments
Lấy danh sách lịch hẹn
```json
{
  "data": [
    {
      "id": "appointment-001",
      "patientId": "patient-001",
      "patientName": "Nguyễn Văn A",
      "doctorId": "doctor-001",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "date": "2024-01-20T09:00:00Z",
      "duration": 30,
      "type": "CONSULTATION",
      "status": "SCHEDULED",
      "notes": "Tái khám định kỳ",
      "room": "Phòng 101"
    }
  ]
}
```

#### POST /appointments
Tạo lịch hẹn mới
```json
{
  "patientId": "patient-001",
  "doctorId": "doctor-001",
  "department": "Nội tiết",
  "date": "2024-01-25T10:00:00Z",
  "duration": 30,
  "type": "CONSULTATION",
  "notes": "Tái khám định kỳ",
  "room": "Phòng 101"
}
```

#### PUT /appointments/{appointmentId}
Cập nhật lịch hẹn
```json
{
  "date": "2024-01-25T11:00:00Z",
  "status": "CONFIRMED",
  "notes": "Tái khám định kỳ - Đã xác nhận"
}
```

#### DELETE /appointments/{appointmentId}
Hủy lịch hẹn
```json
{
  "reason": "Bệnh nhân yêu cầu hủy",
  "cancelledBy": "doctor-001"
}
```

### 3. Medical Records

#### GET /medical-records
Lấy danh sách hồ sơ bệnh án
```json
{
  "data": [
    {
      "id": "record-001",
      "patientId": "patient-001",
      "patientName": "Nguyễn Văn A",
      "visitDate": "2024-01-15T10:30:00Z",
      "doctorId": "doctor-001",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "chiefComplaint": "Mệt mỏi, khát nước",
      "diagnosis": "Tiểu đường type 2",
      "treatment": "Metformin 500mg x 2 lần/ngày",
      "prescription": [
        {
          "medication": "Metformin",
          "dosage": "500mg",
          "frequency": "2 lần/ngày",
          "duration": "30 ngày"
        }
      ],
      "labResults": [
        {
          "test": "Đường huyết",
          "value": "180 mg/dL",
          "normalRange": "70-140 mg/dL",
          "status": "HIGH"
        }
      ],
      "status": "COMPLETED"
    }
  ]
}
```

#### POST /medical-records
Tạo hồ sơ bệnh án mới
```json
{
  "patientId": "patient-001",
  "visitDate": "2024-01-20T09:00:00Z",
  "doctorId": "doctor-001",
  "department": "Nội tiết",
  "chiefComplaint": "Mệt mỏi, khát nước",
  "vitalSigns": {
    "bloodPressure": "120/80",
    "heartRate": 72,
    "temperature": 36.5,
    "weight": 70
  },
  "examination": "Bệnh nhân tỉnh táo, da khô, niêm mạc khô",
  "diagnosis": "Tiểu đường type 2",
  "treatment": "Metformin 500mg x 2 lần/ngày",
  "prescription": [
    {
      "medication": "Metformin",
      "dosage": "500mg",
      "frequency": "2 lần/ngày",
      "duration": "30 ngày"
    }
  ],
  "followUp": {
    "date": "2024-02-20T09:00:00Z",
    "type": "REVIEW"
  }
}
```

#### GET /medical-records/{recordId}
Lấy chi tiết hồ sơ bệnh án
```json
{
  "data": {
    "id": "record-001",
    "patientId": "patient-001",
    "patientName": "Nguyễn Văn A",
    "visitDate": "2024-01-15T10:30:00Z",
    "doctorId": "doctor-001",
    "doctorName": "Dr. Trần Văn F",
    "department": "Nội tiết",
    "chiefComplaint": "Mệt mỏi, khát nước",
    "vitalSigns": {
      "bloodPressure": "120/80",
      "heartRate": 72,
      "temperature": 36.5,
      "weight": 70
    },
    "examination": "Bệnh nhân tỉnh táo, da khô, niêm mạc khô",
    "diagnosis": "Tiểu đường type 2",
    "treatment": "Metformin 500mg x 2 lần/ngày",
    "prescription": [
      {
        "medication": "Metformin",
        "dosage": "500mg",
        "frequency": "2 lần/ngày",
        "duration": "30 ngày"
      }
    ],
    "labResults": [
      {
        "test": "Đường huyết",
        "value": "180 mg/dL",
        "normalRange": "70-140 mg/dL",
        "status": "HIGH"
      }
    ],
    "imaging": [
      {
        "type": "X-ray",
        "description": "X-quang ngực",
        "result": "Bình thường",
        "fileUrl": "https://storage.emr.com/imaging/xray-001.jpg"
      }
    ],
    "status": "COMPLETED",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

### 4. Doctor Management

#### GET /doctors
Lấy danh sách bác sĩ
```json
{
  "data": [
    {
      "id": "doctor-001",
      "name": "Dr. Trần Văn F",
      "specialization": "Nội tiết",
      "department": "Nội tiết",
      "license": "BS123456",
      "phone": "0123456789",
      "email": "tranvan.f@hospital.com",
      "schedule": [
        {
          "day": "MONDAY",
          "startTime": "08:00",
          "endTime": "17:00"
        }
      ],
      "status": "ACTIVE"
    }
  ]
}
```

#### POST /doctors
Tạo bác sĩ mới
```json
{
  "name": "Dr. Nguyễn Thị G",
  "specialization": "Tim mạch",
  "department": "Tim mạch",
  "license": "BS789012",
  "phone": "0987654321",
  "email": "nguyenthi.g@hospital.com",
  "schedule": [
    {
      "day": "TUESDAY",
      "startTime": "08:00",
      "endTime": "17:00"
    }
  ]
}
```

### 5. Dashboard & Reports

#### GET /dashboard/overview
Lấy tổng quan dashboard
```json
{
  "data": {
    "patients": {
      "total": 1500,
      "newThisMonth": 45,
      "active": 1200
    },
    "appointments": {
      "today": 25,
      "thisWeek": 150,
      "pending": 10
    },
    "revenue": {
      "thisMonth": 50000000,
      "lastMonth": 45000000,
      "growth": 11.1
    },
    "departments": [
      {
        "name": "Nội tiết",
        "patients": 200,
        "appointments": 50
      }
    ]
  }
}
```

#### GET /reports/patient-statistics
Báo cáo thống kê bệnh nhân
```json
{
  "data": {
    "byAge": [
      {
        "range": "0-18",
        "count": 150
      },
      {
        "range": "19-30",
        "count": 300
      }
    ],
    "byGender": [
      {
        "gender": "MALE",
        "count": 750
      },
      {
        "gender": "FEMALE",
        "count": 750
      }
    ],
    "byDepartment": [
      {
        "department": "Nội tiết",
        "count": 200
      }
    ]
  }
}
```

### 6. Lab Results

#### GET /lab-results
Lấy kết quả xét nghiệm
```json
{
  "data": [
    {
      "id": "lab-001",
      "patientId": "patient-001",
      "patientName": "Nguyễn Văn A",
      "testName": "Đường huyết",
      "value": "180 mg/dL",
      "normalRange": "70-140 mg/dL",
      "unit": "mg/dL",
      "status": "HIGH",
      "orderedBy": "Dr. Trần Văn F",
      "orderedDate": "2024-01-15T10:30:00Z",
      "completedDate": "2024-01-15T11:00:00Z",
      "notes": "Cần theo dõi thêm"
    }
  ]
}
```

#### POST /lab-results
Tạo kết quả xét nghiệm
```json
{
  "patientId": "patient-001",
  "testName": "Đường huyết",
  "value": "180",
  "normalRange": "70-140",
  "unit": "mg/dL",
  "status": "HIGH",
  "orderedBy": "doctor-001",
  "notes": "Cần theo dõi thêm"
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
  "message": "Insufficient permissions to access patient data",
  "code": "RBAC_001"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Patient not found",
  "code": "PATIENT_001"
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
      "field": "phone",
      "message": "Invalid phone number format"
    }
  ]
}
```

## Rate Limiting

- **Standard**: 2000 requests/hour
- **File Upload**: 100 requests/hour
- **Reports**: 100 requests/hour

## Pagination

Tất cả endpoints trả về danh sách đều hỗ trợ pagination:

```
GET /patients?page=1&limit=20&sort=name&order=asc
```

## Filtering & Searching

Hỗ trợ filter và search:

```
GET /patients?department=endocrinology&search=nguyen
GET /appointments?date=2024-01-20&status=scheduled
GET /medical-records?patientId=patient-001&from=2024-01-01&to=2024-01-31
```

## WebSocket Events

### Real-time Updates
```javascript
// Kết nối WebSocket
const ws = new WebSocket('wss://api.emr.com/hospital/ws');

// Lắng nghe events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'APPOINTMENT_CREATED':
      // Cập nhật danh sách lịch hẹn
      break;
    case 'PATIENT_UPDATED':
      // Cập nhật thông tin bệnh nhân
      break;
    case 'LAB_RESULT_READY':
      // Thông báo kết quả xét nghiệm
      break;
    case 'EMERGENCY_ALERT':
      // Thông báo khẩn cấp
      break;
  }
};
```

## File Upload

### Upload Medical Images
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('patientId', 'patient-001');
formData.append('type', 'X-ray');

fetch('/api/medical-records/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## Testing

### Postman Collection
Import collection: `Hospital Portal API.postman_collection.json`

### Swagger Documentation
API documentation: `https://api.emr.com/hospital/docs`

## Security Considerations

1. **Authentication**: JWT token với expiration time
2. **Authorization**: RBAC với granular permissions theo department
3. **Data Privacy**: Chỉ hiển thị dữ liệu bệnh nhân theo quyền
4. **Audit Logging**: Log tất cả actions liên quan đến dữ liệu y tế
5. **Input Validation**: Validate tất cả inputs, đặc biệt là dữ liệu y tế
6. **CORS**: Configure cho hospital portal domain
7. **HTTPS**: Force HTTPS cho tất cả requests
8. **Data Encryption**: Mã hóa dữ liệu nhạy cảm 