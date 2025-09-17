# Patient Portal API Endpoints

## Tổng quan

Patient Portal API cung cấp các endpoints để bệnh nhân quản lý thông tin cá nhân, lịch khám, đơn thuốc, kết quả xét nghiệm, và tài chính. API này dành cho bệnh nhân và người thân được ủy quyền.

## Base URL
```
https://api.emr.com/patient/v1
```

## Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Role Required**: `PATIENT`, `PATIENT_GUARDIAN`

## Endpoints

### 1. Patient Profile

#### GET /profile
Lấy thông tin cá nhân bệnh nhân
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
      "expiryDate": "2025-12-31",
      "coverage": 80
    },
    "preferences": {
      "language": "vi",
      "notifications": {
        "email": true,
        "sms": true,
        "push": false
      }
    },
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /profile
Cập nhật thông tin cá nhân
```json
{
  "phone": "0123456789",
  "email": "newemail@email.com",
  "address": "Hà Nội - Cập nhật",
  "emergencyContact": {
    "name": "Nguyễn Thị B",
    "relationship": "Vợ",
    "phone": "0987654321"
  },
  "preferences": {
    "language": "en",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```

#### PUT /profile/password
Đổi mật khẩu
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-secure-password",
  "confirmPassword": "new-secure-password"
}
```

### 2. Appointments

#### GET /appointments
Lấy danh sách lịch hẹn
```json
{
  "data": [
    {
      "id": "appointment-001",
      "doctorId": "doctor-001",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "date": "2024-01-20T09:00:00Z",
      "duration": 30,
      "type": "CONSULTATION",
      "status": "SCHEDULED",
      "notes": "Tái khám định kỳ",
      "room": "Phòng 101",
      "hospital": "Bệnh viện Bạch Mai",
      "address": "78 Giải Phóng, Hà Nội"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

#### POST /appointments
Đặt lịch hẹn mới
```json
{
  "doctorId": "doctor-001",
  "department": "Nội tiết",
  "date": "2024-01-25T10:00:00Z",
  "type": "CONSULTATION",
  "notes": "Khám định kỳ",
  "preferredTime": "MORNING"
}
```

#### PUT /appointments/{appointmentId}
Cập nhật lịch hẹn
```json
{
  "date": "2024-01-25T11:00:00Z",
  "notes": "Khám định kỳ - Thay đổi giờ"
}
```

#### DELETE /appointments/{appointmentId}
Hủy lịch hẹn
```json
{
  "reason": "Có việc đột xuất"
}
```

#### GET /appointments/available-slots
Lấy các slot trống
```json
{
  "data": [
    {
      "doctorId": "doctor-001",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "date": "2024-01-25",
      "slots": [
        {
          "time": "09:00",
          "available": true
        },
        {
          "time": "10:00",
          "available": false
        }
      ]
    }
  ]
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
      "visitDate": "2024-01-15T10:30:00Z",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "chiefComplaint": "Mệt mỏi, khát nước",
      "diagnosis": "Tiểu đường type 2",
      "treatment": "Metformin 500mg x 2 lần/ngày",
      "status": "COMPLETED",
      "hasPrescription": true,
      "hasLabResults": true
    }
  ]
}
```

#### GET /medical-records/{recordId}
Lấy chi tiết hồ sơ bệnh án
```json
{
  "data": {
    "id": "record-001",
    "visitDate": "2024-01-15T10:30:00Z",
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
        "duration": "30 ngày",
        "instructions": "Uống sau bữa ăn"
      }
    ],
    "labResults": [
      {
        "test": "Đường huyết",
        "value": "180 mg/dL",
        "normalRange": "70-140 mg/dL",
        "unit": "mg/dL",
        "status": "HIGH",
        "notes": "Cần theo dõi thêm"
      }
    ],
    "imaging": [
      {
        "type": "X-ray",
        "description": "X-quang ngực",
        "result": "Bình thường",
        "fileUrl": "https://storage.emr.com/imaging/xray-001.jpg",
        "viewable": true
      }
    ],
    "followUp": {
      "date": "2024-02-20T09:00:00Z",
      "type": "REVIEW",
      "notes": "Tái khám để kiểm tra đường huyết"
    }
  }
}
```

### 4. Prescriptions

#### GET /prescriptions
Lấy danh sách đơn thuốc
```json
{
  "data": [
    {
      "id": "prescription-001",
      "date": "2024-01-15T10:30:00Z",
      "doctorName": "Dr. Trần Văn F",
      "department": "Nội tiết",
      "medications": [
        {
          "name": "Metformin",
          "dosage": "500mg",
          "frequency": "2 lần/ngày",
          "duration": "30 ngày",
          "instructions": "Uống sau bữa ăn",
          "quantity": 60,
          "remaining": 45
        }
      ],
      "status": "ACTIVE",
      "refills": 2
    }
  ]
}
```

#### GET /prescriptions/{prescriptionId}
Lấy chi tiết đơn thuốc
```json
{
  "data": {
    "id": "prescription-001",
    "date": "2024-01-15T10:30:00Z",
    "doctorName": "Dr. Trần Văn F",
    "department": "Nội tiết",
    "diagnosis": "Tiểu đường type 2",
    "medications": [
      {
        "name": "Metformin",
        "genericName": "Metformin Hydrochloride",
        "dosage": "500mg",
        "frequency": "2 lần/ngày",
        "duration": "30 ngày",
        "instructions": "Uống sau bữa ăn",
        "quantity": 60,
        "remaining": 45,
        "sideEffects": ["Buồn nôn", "Tiêu chảy"],
        "interactions": ["Rượu", "Thuốc khác"]
      }
    ],
    "status": "ACTIVE",
    "refills": 2,
    "expiryDate": "2024-02-15T00:00:00Z"
  }
}
```

#### POST /prescriptions/{prescriptionId}/refill
Yêu cầu tái kê đơn
```json
{
  "reason": "Hết thuốc",
  "preferredDate": "2024-01-25T09:00:00Z"
}
```

### 5. Lab Results

#### GET /lab-results
Lấy kết quả xét nghiệm
```json
{
  "data": [
    {
      "id": "lab-001",
      "testName": "Đường huyết",
      "date": "2024-01-15T10:30:00Z",
      "value": "180 mg/dL",
      "normalRange": "70-140 mg/dL",
      "unit": "mg/dL",
      "status": "HIGH",
      "orderedBy": "Dr. Trần Văn F",
      "completedDate": "2024-01-15T11:00:00Z",
      "notes": "Cần theo dõi thêm",
      "trend": "INCREASING"
    }
  ]
}
```

#### GET /lab-results/{resultId}
Lấy chi tiết kết quả xét nghiệm
```json
{
  "data": {
    "id": "lab-001",
    "testName": "Đường huyết",
    "date": "2024-01-15T10:30:00Z",
    "value": "180",
    "normalRange": "70-140",
    "unit": "mg/dL",
    "status": "HIGH",
    "orderedBy": "Dr. Trần Văn F",
    "completedDate": "2024-01-15T11:00:00Z",
    "notes": "Cần theo dõi thêm",
    "trend": "INCREASING",
    "history": [
      {
        "date": "2023-12-01",
        "value": "160",
        "status": "HIGH"
      },
      {
        "date": "2023-11-01",
        "value": "140",
        "status": "NORMAL"
      }
    ],
    "recommendations": [
      "Giảm ăn đường",
      "Tập thể dục thường xuyên",
      "Theo dõi đường huyết hàng ngày"
    ]
  }
}
```

### 6. Billing & Payments

#### GET /bills
Lấy danh sách hóa đơn
```json
{
  "data": [
    {
      "id": "bill-001",
      "date": "2024-01-15T10:30:00Z",
      "description": "Khám bệnh - Nội tiết",
      "amount": 500000,
      "insuranceCoverage": 400000,
      "patientResponsibility": 100000,
      "status": "PAID",
      "dueDate": "2024-02-15T00:00:00Z",
      "paidDate": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### GET /bills/{billId}
Lấy chi tiết hóa đơn
```json
{
  "data": {
    "id": "bill-001",
    "date": "2024-01-15T10:30:00Z",
    "description": "Khám bệnh - Nội tiết",
    "items": [
      {
        "name": "Phí khám bệnh",
        "amount": 300000,
        "insuranceCoverage": 240000,
        "patientResponsibility": 60000
      },
      {
        "name": "Xét nghiệm đường huyết",
        "amount": 200000,
        "insuranceCoverage": 160000,
        "patientResponsibility": 40000
      }
    ],
    "totalAmount": 500000,
    "insuranceCoverage": 400000,
    "patientResponsibility": 100000,
    "status": "PAID",
    "dueDate": "2024-02-15T00:00:00Z",
    "paidDate": "2024-01-15T12:00:00Z",
    "paymentMethod": "CREDIT_CARD"
  }
}
```

#### POST /bills/{billId}/pay
Thanh toán hóa đơn
```json
{
  "paymentMethod": "CREDIT_CARD",
  "cardNumber": "**** **** **** 1234",
  "amount": 100000
}
```

### 7. Notifications

#### GET /notifications
Lấy danh sách thông báo
```json
{
  "data": [
    {
      "id": "notification-001",
      "type": "APPOINTMENT_REMINDER",
      "title": "Nhắc lịch khám",
      "message": "Bạn có lịch khám vào ngày mai lúc 9:00",
      "date": "2024-01-19T08:00:00Z",
      "read": false,
      "actionUrl": "/appointments/appointment-001"
    }
  ]
}
```

#### PUT /notifications/{notificationId}/read
Đánh dấu đã đọc
```json
{
  "read": true
}
```

#### PUT /notifications/preferences
Cập nhật tùy chọn thông báo
```json
{
  "appointmentReminders": true,
  "labResults": true,
  "prescriptionRefills": false,
  "billing": true,
  "email": true,
  "sms": true,
  "push": false
}
```

### 8. Feedback & Support

#### POST /feedback
Gửi phản hồi
```json
{
  "type": "GENERAL",
  "subject": "Góp ý về dịch vụ",
  "message": "Dịch vụ rất tốt, nhân viên thân thiện",
  "rating": 5
}
```

#### GET /support/topics
Lấy danh sách chủ đề hỗ trợ
```json
{
  "data": [
    {
      "id": "topic-001",
      "title": "Cách đặt lịch khám",
      "category": "APPOINTMENTS",
      "content": "Hướng dẫn chi tiết cách đặt lịch khám..."
    }
  ]
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
  "message": "Access denied to patient data",
  "code": "RBAC_001"
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Appointment not found",
  "code": "APPOINTMENT_001"
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

- **Standard**: 1000 requests/hour
- **File Download**: 100 requests/hour
- **Appointment Booking**: 10 requests/hour

## Pagination

Tất cả endpoints trả về danh sách đều hỗ trợ pagination:

```
GET /appointments?page=1&limit=20&sort=date&order=desc
```

## Filtering & Searching

Hỗ trợ filter và search:

```
GET /appointments?status=scheduled&from=2024-01-01&to=2024-01-31
GET /medical-records?department=endocrinology&from=2024-01-01
GET /lab-results?status=high&from=2024-01-01
```

## WebSocket Events

### Real-time Updates
```javascript
// Kết nối WebSocket
const ws = new WebSocket('wss://api.emr.com/patient/ws');

// Lắng nghe events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'APPOINTMENT_REMINDER':
      // Hiển thị nhắc lịch khám
      break;
    case 'LAB_RESULT_READY':
      // Thông báo kết quả xét nghiệm
      break;
    case 'PRESCRIPTION_REFILL_APPROVED':
      // Thông báo tái kê đơn được chấp thuận
      break;
    case 'BILL_DUE':
      // Thông báo hóa đơn đến hạn
      break;
  }
};
```

## File Download

### Download Medical Records
```javascript
fetch('/api/medical-records/record-001/download', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'medical-record.pdf';
  a.click();
});
```

## Testing

### Postman Collection
Import collection: `Patient Portal API.postman_collection.json`

### Swagger Documentation
API documentation: `https://api.emr.com/patient/docs`

## Security Considerations

1. **Authentication**: JWT token với expiration time
2. **Authorization**: Chỉ cho phép truy cập dữ liệu của chính bệnh nhân
3. **Data Privacy**: Mã hóa dữ liệu nhạy cảm
4. **Audit Logging**: Log tất cả actions
5. **Input Validation**: Validate tất cả inputs
6. **CORS**: Configure cho patient portal domain
7. **HTTPS**: Force HTTPS cho tất cả requests
8. **Rate Limiting**: Prevent abuse
9. **File Access Control**: Kiểm soát truy cập file y tế 