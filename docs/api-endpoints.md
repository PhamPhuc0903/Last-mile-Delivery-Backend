# Tài liệu API - Last Mile Delivery Backend

**Dự án:** Last Mile Delivery Backend  
**Kiến trúc:** Microservice-lite + API Gateway + AI + Chatbot  
**Kiểu database:** Schema-per-service trong cùng một PostgreSQL database  
**Gateway Base URL:** `http://localhost:3000`  
**Cập nhật lần cuối:** 2026-06-25

> Gateway hiện tại **không dùng `/api/v1`**. Tất cả API qua gateway đi trực tiếp từ `http://localhost:3000`, ví dụ: `http://localhost:3000/auth/login`.

---

## 0. Quy ước chung

### 0.1 Header xác thực

Các API cần đăng nhập dùng JWT access token:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 0.2 Format response chung

Thành công:

```json
{
  "success": true,
  "data": {}
}
```

Thất bại:

```json
{
  "success": false,
  "message": "Error message"
}
```

### 0.3 Role người dùng

```txt
CUSTOMER
DRIVER
ADMIN
```

### 0.4 URL trực tiếp của từng service

| Service | URL local | URL nội bộ Docker | Gateway path |
|---|---:|---:|---|
| API Gateway | `http://localhost:3000` | `http://api-gateway:3000` | `/` |
| Auth Service | `http://localhost:3001` | `http://auth-service:3000` | `/auth/*` |
| Order Service | `http://localhost:3002` | `http://order-service:3000` | `/orders/*` |
| Driver Service | `http://localhost:3003` | `http://driver-service:3000` | `/drivers/*` |
| Tracking Service | `http://localhost:3004` | `http://tracking-service:3000` | `/tracking/*` |
| Dispatch Service | `http://localhost:3005` | `http://dispatch-service:3000` | `/dispatch/*` |
| Notification Service | `http://localhost:3006` | `http://notification-service:3000` | `/notifications/*` |
| AI Service | `http://localhost:3007` | `http://ai-service:3000` | `/ai/*` |
| User Service | `http://localhost:3008` | `http://user-service:3000` | `/users/*` |
| Admin Service | `http://localhost:3009` | `http://admin-service:3000` | `/admin/*` |
| Chatbot Service | `http://localhost:3010` | `http://chatbot-service:3000` | `/chatbot/*` |
| Payment Service | `http://localhost:3011` | `http://payment-service:3000` | `/payments/*` |

---

## 1. API Gateway

API Gateway gom tất cả service về một cổng duy nhất. Frontend/Postman nên ưu tiên gọi qua gateway `http://localhost:3000`.

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/health` | Không | Kiểm tra trạng thái API Gateway |
| GET | `/` | Không | Xem danh sách route gateway |
| ANY | `/auth/*` | Tùy API đích | Proxy tới auth-service |
| ANY | `/users/*` | Tùy API đích | Proxy tới user-service |
| ANY | `/orders/*` | Tùy API đích | Proxy tới order-service |
| ANY | `/payments/*` | Tùy API đích | Proxy tới payment-service |
| ANY | `/drivers/*` | Tùy API đích | Proxy tới driver-service |
| ANY | `/tracking/*` | Tùy API đích | Proxy tới tracking-service |
| ANY | `/dispatch/*` | Tùy API đích | Proxy tới dispatch-service |
| ANY | `/notifications/*` | Tùy API đích | Proxy tới notification-service |
| ANY | `/ai/*` | Tùy API đích | Proxy tới ai-service |
| ANY | `/chatbot/*` | Tùy API đích | Proxy tới chatbot-service |
| ANY | `/admin/*` | ADMIN | Proxy tới admin-service |

---

## 2. Auth Service

**Base URL trực tiếp:** `http://localhost:3001`  
**Gateway:** `http://localhost:3000/auth`

### 2.1 Danh sách API

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/auth/register` | Không | - | Đăng ký tài khoản |
| POST | `/auth/login` | Không | - | Đăng nhập |
| POST | `/auth/refresh-token` | Không | - | Cấp lại access token |
| GET | `/auth/me` | Có | CUSTOMER/DRIVER/ADMIN | Lấy thông tin user hiện tại |
| POST | `/auth/logout` | Có | CUSTOMER/DRIVER/ADMIN | Đăng xuất |
| PATCH | `/auth/change-password` | Có | CUSTOMER/DRIVER/ADMIN | Đổi mật khẩu |
| POST | `/auth/forgot-password` | Không | - | Tạo reset token demo |
| POST | `/auth/reset-password` | Không | - | Reset mật khẩu bằng token |

### 2.2 Đăng ký

```http
POST /auth/register
```

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "a@example.com",
  "password": "123456",
  "role": "CUSTOMER"
}
```

### 2.3 Đăng nhập

```http
POST /auth/login
```

```json
{
  "phone": "0901234567",
  "password": "123456"
}
```

---

## 3. User Service

**Base URL trực tiếp:** `http://localhost:3008`  
**Gateway:** `http://localhost:3000/users`

User Service quản lý hồ sơ cá nhân và địa chỉ của user đang đăng nhập. Các API quản lý user toàn hệ thống đã được chuyển sang Admin Service.

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| GET | `/users/me` | Có | CUSTOMER/DRIVER/ADMIN | Lấy profile của user hiện tại |
| PATCH | `/users/me` | Có | CUSTOMER/DRIVER/ADMIN | Cập nhật profile |
| GET | `/users/me/addresses` | Có | CUSTOMER/DRIVER/ADMIN | Lấy danh sách địa chỉ |
| POST | `/users/me/addresses` | Có | CUSTOMER/DRIVER/ADMIN | Thêm địa chỉ |
| GET | `/users/me/addresses/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xem chi tiết địa chỉ |
| PATCH | `/users/me/addresses/:id` | Có | CUSTOMER/DRIVER/ADMIN | Cập nhật địa chỉ |
| DELETE | `/users/me/addresses/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xóa địa chỉ |

### 3.1 Thêm địa chỉ

```json
{
  "label": "Nhà riêng",
  "receiverName": "Nguyen Van A",
  "receiverPhone": "0901234567",
  "addressLine": "12 Nguyen Van Cu",
  "ward": "Phuong 1",
  "district": "Quan 5",
  "city": "Ho Chi Minh City",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "isDefault": true
}
```

---

## 4. Order Service

**Base URL trực tiếp:** `http://localhost:3002`  
**Gateway:** `http://localhost:3000/orders`

### 4.1 Danh sách API

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/orders` | Có | CUSTOMER/ADMIN | Tạo đơn hàng |
| GET | `/orders` | Có | ADMIN | Xem danh sách đơn hàng |
| GET | `/orders/my-orders` | Có | CUSTOMER | Xem đơn hàng của tôi |
| GET | `/orders/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xem chi tiết đơn hàng |
| PATCH | `/orders/:id` | Có | CUSTOMER/ADMIN | Cập nhật đơn hàng |
| PATCH | `/orders/:id/cancel` | Có | CUSTOMER/ADMIN | Hủy đơn hàng |
| PATCH | `/orders/:id/status` | Có | DRIVER/ADMIN | Cập nhật trạng thái đơn |
| GET | `/orders/:id/timeline` | Có | CUSTOMER/DRIVER/ADMIN | Xem timeline trạng thái đơn |
| GET | `/orders/stats/today` | Có | ADMIN | Thống kê đơn trong ngày |
| GET | `/orders/stats/month` | Có | ADMIN | Thống kê đơn trong tháng |
| GET | `/orders/stats/year` | Có | ADMIN | Thống kê đơn trong năm |

> Lưu ý: route `/orders/stats/*` và `/orders/my-orders` phải được khai báo trước `/orders/:id` trong code.

### 4.2 Tạo đơn hàng

```http
POST /orders
```

```json
{
  "pickupAddressLine": "12 Nguyen Van Cu",
  "pickupWard": "Ward 1",
  "pickupDistrict": "District 5",
  "pickupCity": "Ho Chi Minh City",
  "pickupLat": 10.762622,
  "pickupLng": 106.660172,
  "receiverName": "Tran Van B",
  "receiverPhone": "0912345678",
  "deliveryAddressLine": "25 Le Loi",
  "deliveryWard": "Ben Nghe",
  "deliveryDistrict": "District 1",
  "deliveryCity": "Ho Chi Minh City",
  "deliveryLat": 10.776889,
  "deliveryLng": 106.700806,
  "distanceKm": 5.2,
  "paymentMethod": "COD",
  "note": "Call before delivery",
  "items": [
    {
      "itemName": "Shoes",
      "quantity": 1,
      "weightKg": 0.8,
      "note": "Fragile box"
    }
  ]
}
```

### 4.3 Trạng thái đơn hàng

```txt
PENDING
CONFIRMED
ASSIGNED
PICKED_UP
IN_TRANSIT
DELIVERED
CANCELLED
FAILED
```

---

## 5. Payment Service

**Base URL trực tiếp:** `http://localhost:3011`  
**Gateway:** `http://localhost:3000/payments`

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/payments` | Có | CUSTOMER/ADMIN | Tạo payment transaction |
| GET | `/payments/my-payments` | Có | CUSTOMER | Xem giao dịch của tôi |
| GET | `/payments/:id` | Có | CUSTOMER/ADMIN | Xem chi tiết payment |
| GET | `/payments/order/:orderId` | Có | CUSTOMER/ADMIN | Xem payment theo order |
| PATCH | `/payments/:id/paid` | Có | ADMIN | Đánh dấu đã thanh toán |
| PATCH | `/payments/:id/failed` | Có | ADMIN | Đánh dấu thanh toán thất bại |
| POST | `/payments/:id/refund` | Có | ADMIN | Hoàn tiền |

### 5.1 Tạo payment

```json
{
  "orderId": "ORDER_ID",
  "amount": 35000,
  "paymentMethod": "COD",
  "provider": "COD",
  "note": "Thanh toán khi nhận hàng"
}
```

### 5.2 Payment method/status

```txt
PaymentMethod: COD, BANK_TRANSFER, MOMO, VNPAY
PaymentStatus: UNPAID, PENDING, PAID, FAILED, REFUNDED, CANCELLED
TransactionType: PAYMENT, REFUND, COD_COLLECTION
```

---

## 6. Driver Service

**Base URL trực tiếp:** `http://localhost:3003`  
**Gateway:** `http://localhost:3000/drivers`

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| GET | `/drivers/me` | Có | DRIVER | Xem hồ sơ tài xế của tôi |
| PATCH | `/drivers/me` | Có | DRIVER | Cập nhật hồ sơ tài xế |
| PATCH | `/drivers/me/status` | Có | DRIVER | Cập nhật trạng thái online/busy/offline |
| POST | `/drivers/me/location` | Có | DRIVER | Gửi vị trí hiện tại |
| PATCH | `/drivers/me/location` | Có | DRIVER | Cập nhật vị trí hiện tại |
| GET | `/drivers` | Có | ADMIN | Xem danh sách tài xế |
| GET | `/drivers/nearby` | Có | ADMIN | Tìm tài xế gần vị trí |
| GET | `/drivers/:id` | Có | ADMIN | Xem chi tiết tài xế |
| PATCH | `/drivers/:id/approve` | Có | ADMIN | Duyệt tài xế |
| PATCH | `/drivers/:id/reject` | Có | ADMIN | Từ chối tài xế |

### 6.1 Trạng thái tài xế

```txt
DriverStatus: OFFLINE, ONLINE, BUSY, SUSPENDED
DriverVerificationStatus: PENDING, APPROVED, REJECTED
VehicleType: MOTORBIKE, CAR, VAN
```

---

## 7. Dispatch Service

**Base URL trực tiếp:** `http://localhost:3005`  
**Gateway:** `http://localhost:3000/dispatch`

Dispatch Service quản lý việc gán đơn cho tài xế.

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/dispatch/assignments` | Có | ADMIN | Gán đơn thủ công cho tài xế |
| POST | `/dispatch/assign` | Có | ADMIN | Alias của `/dispatch/assignments` |
| POST | `/dispatch/assignments/auto` | Có | ADMIN | Tự động gợi ý/gán tài xế |
| POST | `/dispatch/auto-assign` | Có | ADMIN | Alias của `/dispatch/assignments/auto` |
| GET | `/dispatch/assignments` | Có | ADMIN | Xem danh sách assignment |
| GET | `/dispatch/history` | Có | ADMIN | Alias danh sách assignment |
| GET | `/dispatch/assignments/:id` | Có | ADMIN/DRIVER | Xem chi tiết assignment |
| GET | `/dispatch/my-assignments` | Có | DRIVER | Xem assignment của tài xế hiện tại |
| GET | `/dispatch/my-current-assignment` | Có | DRIVER | Xem assignment đang xử lý |
| GET | `/dispatch/my-history` | Có | DRIVER | Lịch sử assignment của tài xế |
| PATCH | `/dispatch/assignments/:id/accept` | Có | DRIVER | Tài xế nhận đơn |
| PATCH | `/dispatch/assignments/:id/reject` | Có | DRIVER | Tài xế từ chối đơn |
| PATCH | `/dispatch/assignments/:id/cancel` | Có | ADMIN | Hủy assignment |
| PATCH | `/dispatch/assignments/:id/complete` | Có | DRIVER/ADMIN | Hoàn tất assignment |

### 7.1 Trạng thái assignment

```txt
PENDING
ACCEPTED
REJECTED
CANCELLED
COMPLETED
EXPIRED
```

---

## 8. Tracking Service

**Base URL trực tiếp:** `http://localhost:3004`  
**Gateway:** `http://localhost:3000/tracking`

Tracking Service lưu log vị trí và trạng thái giao hàng.

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/tracking/location` | Có | DRIVER/ADMIN | Gửi location, nhận `orderId` từ body |
| POST | `/tracking/orders/:orderId/location` | Có | DRIVER/ADMIN | Gửi location theo order |
| GET | `/tracking/orders/:orderId` | Có | CUSTOMER/DRIVER/ADMIN | Lấy vị trí hiện tại của đơn |
| GET | `/tracking/orders/:orderId/current` | Có | CUSTOMER/DRIVER/ADMIN | Alias vị trí hiện tại |
| GET | `/tracking/orders/:orderId/history` | Có | CUSTOMER/DRIVER/ADMIN | Lịch sử tracking |
| GET | `/tracking/orders/:orderId/route` | Có | CUSTOMER/DRIVER/ADMIN | Route tracking |

### 8.1 Gửi location

```json
{
  "orderId": "ORDER_ID",
  "driverId": "DRIVER_ID",
  "latitude": 10.776889,
  "longitude": 106.700806,
  "eventType": "LOCATION_UPDATE",
  "note": "Driver is moving"
}
```

### 8.2 Tracking event type

```txt
LOCATION_UPDATE
PICKED_UP
IN_TRANSIT
DELIVERED
FAILED
```

---

## 9. Notification Service

**Base URL trực tiếp:** `http://localhost:3006`  
**Gateway:** `http://localhost:3000/notifications`

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/notifications` | Có | ADMIN | Tạo thông báo |
| POST | `/notifications/push` | Có | ADMIN | Alias tạo thông báo |
| POST | `/notifications/bulk` | Có | ADMIN | Tạo nhiều thông báo |
| POST | `/notifications/broadcast` | Có | ADMIN | Broadcast thông báo |
| GET | `/notifications` | Có | CUSTOMER/DRIVER/ADMIN | Xem thông báo của tôi |
| GET | `/notifications/me` | Có | CUSTOMER/DRIVER/ADMIN | Alias xem thông báo của tôi |
| GET | `/notifications/me/unread-count` | Có | CUSTOMER/DRIVER/ADMIN | Đếm thông báo chưa đọc |
| PATCH | `/notifications/me/read-all` | Có | CUSTOMER/DRIVER/ADMIN | Đánh dấu tất cả đã đọc |
| GET | `/notifications/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xem chi tiết thông báo |
| PATCH | `/notifications/:id/read` | Có | CUSTOMER/DRIVER/ADMIN | Đánh dấu đã đọc |
| DELETE | `/notifications/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xóa thông báo |

### 9.1 Loại thông báo

```txt
NotificationType: ORDER, PAYMENT, DRIVER, DISPATCH, SYSTEM, PROMOTION
NotificationChannel: IN_APP, EMAIL, SMS, PUSH
NotificationStatus: UNREAD, READ
```

---

## 10. AI Service

**Base URL trực tiếp:** `http://localhost:3007`  
**Gateway:** `http://localhost:3000/ai`

AI Service hiện có 2 phần:

1. **AI chính:** ETA Prediction Model tự train bằng dữ liệu lịch sử giao hàng.  
2. **AI phụ/rule-based:** recommend driver, anomaly detection, risk score. LLM/OpenAI nếu có chỉ là phần phân tích phụ, có fallback nếu chưa cấu hình API key.

### 10.1 Danh sách API chính

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/ai/recommend-driver` | Có | ADMIN | Gợi ý tài xế phù hợp |
| POST | `/ai/eta` | Có | CUSTOMER/DRIVER/ADMIN | Dự đoán ETA, alias predict |
| POST | `/ai/predict-eta` | Có | CUSTOMER/DRIVER/ADMIN | Alias dự đoán ETA |
| POST | `/ai/eta/predict` | Có | CUSTOMER/DRIVER/ADMIN | Dự đoán ETA bằng model nếu đã train |
| POST | `/ai/anomaly-detection` | Có | ADMIN | Phát hiện bất thường |
| POST | `/ai/detect-anomaly` | Có | ADMIN | Alias phát hiện bất thường |
| POST | `/ai/risk-score` | Có | ADMIN | Tính điểm rủi ro |

### 10.2 API train ETA model

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| POST | `/ai/eta/training-samples` | Có | ADMIN | Thêm một mẫu training ETA |
| POST | `/ai/eta/training-samples/seed` | Có | ADMIN | Tạo dữ liệu mẫu để demo train |
| POST | `/ai/eta/train` | Có | ADMIN | Train ETA model |
| GET | `/ai/eta/model` | Có | ADMIN | Xem model ETA đang active |

### 10.3 API logs AI

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/ai/logs/recommendations` | Có | ADMIN | Xem log recommend driver |
| GET | `/ai/logs/etas` | Có | ADMIN | Xem log dự đoán ETA |
| GET | `/ai/logs/anomalies` | Có | ADMIN | Xem log anomaly |

### 10.4 Thêm training sample

```json
{
  "orderId": "ORDER_ID",
  "distanceKm": 5.2,
  "averageSpeedKmh": 25,
  "trafficLevel": "MEDIUM",
  "pickupHour": 17,
  "vehicleType": "MOTORBIKE",
  "driverRating": 4.8,
  "driverTotalDeliveries": 120,
  "actualMinutes": 24
}
```

### 10.5 Seed dữ liệu mẫu

```json
{
  "count": 100
}
```

### 10.6 Predict ETA

```json
{
  "orderId": "ORDER_ID",
  "distanceKm": 5.2,
  "averageSpeedKmh": 25,
  "trafficLevel": "MEDIUM",
  "pickupHour": 17,
  "vehicleType": "MOTORBIKE",
  "driverRating": 4.8,
  "driverTotalDeliveries": 120
}
```

Response nếu đã train model:

```json
{
  "success": true,
  "data": {
    "estimatedMinutes": 22,
    "modelSource": "trained_model",
    "modelName": "ETA_PREDICTION",
    "modelType": "LINEAR_REGRESSION_NODE_JS",
    "confidence": 0.9
  }
}
```

Response nếu chưa có model active:

```json
{
  "success": true,
  "data": {
    "estimatedMinutes": 25,
    "modelSource": "fallback_formula",
    "confidence": 0.55
  }
}
```

---

## 11. Chatbot Service

**Base URL trực tiếp:** `http://localhost:3010`  
**Gateway:** `http://localhost:3000/chatbot`

Chatbot Service dùng để hỗ trợ khách hàng hỏi về đơn hàng. Nếu có `OPENAI_API_KEY`, chatbot gọi OpenAI model. Nếu chưa có key, service vẫn chạy và trả lời fallback.

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra service |
| POST | `/chatbot/session` | Có | CUSTOMER/DRIVER/ADMIN | Tạo chat session, alias cũ |
| POST | `/chatbot/sessions` | Có | CUSTOMER/DRIVER/ADMIN | Tạo chat session |
| GET | `/chatbot/sessions` | Có | CUSTOMER/DRIVER/ADMIN | Xem danh sách session của tôi |
| GET | `/chatbot/history` | Có | CUSTOMER/DRIVER/ADMIN | Alias danh sách session |
| GET | `/chatbot/session/:id/messages` | Có | CUSTOMER/DRIVER/ADMIN | Xem message trong session, alias cũ |
| GET | `/chatbot/sessions/:id` | Có | CUSTOMER/DRIVER/ADMIN | Xem chi tiết session + messages |
| POST | `/chatbot/sessions/:id/messages` | Có | CUSTOMER/DRIVER/ADMIN | Gửi message trong session |
| POST | `/chatbot/message` | Có | CUSTOMER/DRIVER/ADMIN | Gửi message nhanh, tự tạo session nếu cần |
| POST | `/chatbot/ask` | Có | CUSTOMER/DRIVER/ADMIN | Alias gửi message nhanh |
| GET | `/chatbot/suggestions` | Có | CUSTOMER/DRIVER/ADMIN | Lấy câu hỏi gợi ý |
| PATCH | `/chatbot/sessions/:id/close` | Có | CUSTOMER/DRIVER/ADMIN | Đóng session |

### 11.1 Gửi tin nhắn nhanh

```json
{
  "orderId": "ORDER_ID",
  "message": "Đơn hàng của tôi hiện đang ở đâu?"
}
```

Hoặc dùng session cũ:

```json
{
  "sessionId": "SESSION_ID",
  "message": "Khi nào tôi nhận được hàng?"
}
```

---

## 12. Admin Service

**Base URL trực tiếp:** `http://localhost:3009`  
**Gateway:** `http://localhost:3000/admin`

Admin Service dùng cho dashboard, quản lý user, xem dữ liệu hệ thống, xem AI logs và health check nhiều service.

Tất cả API `/admin/*` cần:

```txt
Authorization: Bearer <admin_access_token>
Role: ADMIN
```

### 12.1 Dashboard và system

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/health` | Không | - | Kiểm tra admin-service |
| GET | `/admin/dashboard` | Có | ADMIN | Dashboard tổng quan |
| GET | `/admin/system/health` | Có | ADMIN | Kiểm tra health của các service |

> `/admin/system/events` và `/admin/system/logs` chưa triển khai vì hệ thống hiện chưa có centralized event/log collector. Hiện tại dùng domain logs như order status logs, tracking logs, AI logs và notification logs.

### 12.2 Quản lý user

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/admin/users` | Có | ADMIN | Danh sách user, hỗ trợ phân trang/filter |
| POST | `/admin/users` | Có | ADMIN | Tạo user |
| GET | `/admin/users/:id` | Có | ADMIN | Xem chi tiết user |
| PATCH | `/admin/users/:id` | Có | ADMIN | Cập nhật user |
| PATCH | `/admin/users/:id/block` | Có | ADMIN | Khóa user |
| PATCH | `/admin/users/:id/unblock` | Có | ADMIN | Mở khóa user |
| DELETE | `/admin/users/:id` | Có | ADMIN | Xóa mềm user, status = DELETED |

Query hỗ trợ:

```txt
/admin/users?page=1&limit=10&role=CUSTOMER&status=ACTIVE&search=nguyen
```

### 12.3 Quản lý order/driver/payment

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/admin/orders` | Có | ADMIN | Danh sách order |
| GET | `/admin/orders/:id` | Có | ADMIN | Chi tiết order, items, timeline, payment, tracking, assignment |
| GET | `/admin/drivers` | Có | ADMIN | Danh sách driver |
| GET | `/admin/drivers/:id` | Có | ADMIN | Chi tiết driver, recent locations, recent assignments |
| PATCH | `/admin/drivers/:id/status` | Có | ADMIN | Cập nhật trạng thái driver |
| GET | `/admin/payments` | Có | ADMIN | Danh sách payment transactions |

Cập nhật trạng thái driver:

```json
{
  "status": "SUSPENDED"
}
```

### 12.4 AI logs trong admin

| Method | Path | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | `/admin/ai/recommendations` | Có | ADMIN | Xem AI recommendation logs |
| GET | `/admin/ai/anomalies` | Có | ADMIN | Xem AI anomaly logs |

---

## 13. Database và quan hệ dữ liệu

Project hiện tại dùng hướng **microservice-lite**:

```txt
1 PostgreSQL instance
1 database: delivery_db
nhiều schema riêng cho từng service
```

Các schema chính:

```txt
auth
user_profile
orders
payments
drivers
dispatch
tracking
notifications
ai
chatbot
```

### 13.1 Quan hệ vật lý và quan hệ logic

Trong cùng một service/schema, các bảng có thể có foreign key thật.

Ví dụ:

```txt
orders.order_items.order_id       -> orders.orders.id
orders.order_status_logs.order_id -> orders.orders.id
chatbot.chat_messages.session_id  -> chatbot.chat_sessions.id
```

Giữa các service khác nhau, hệ thống ưu tiên dùng **UUID logical reference**, không FK chéo service.

Ví dụ:

```txt
orders.orders.customer_id                  -> auth.users.id
payments.payment_transactions.order_id     -> orders.orders.id
dispatch.delivery_assignments.driver_id    -> drivers.drivers.id
tracking.tracking_logs.order_id            -> orders.orders.id
chatbot.chat_sessions.user_id              -> auth.users.id
```

Các quan hệ trên được hiểu là quan hệ logic. Khi triển khai microservice strict hơn, các schema này có thể tách thành database riêng và service giao tiếp qua REST API hoặc RabbitMQ.

### 13.2 ERD logic tổng quát

```txt
auth.users
├─ user_profile.profiles.user_id
├─ orders.orders.customer_id
├─ drivers.drivers.user_id
├─ notifications.notifications.user_id
└─ chatbot.chat_sessions.user_id

orders.orders
├─ orders.order_items.order_id
├─ orders.order_status_logs.order_id
├─ payments.payment_transactions.order_id
├─ dispatch.delivery_assignments.order_id
├─ tracking.tracking_logs.order_id
├─ ai.ai_eta_logs.order_id
├─ ai.ai_anomaly_logs.order_id
└─ chatbot.chat_sessions.order_id

drivers.drivers
├─ drivers.driver_locations.driver_id
├─ dispatch.delivery_assignments.driver_id
├─ ai.ai_driver_recommendation_logs.driver_id
└─ tracking.tracking_logs.driver_id
```

---

## 14. Redis và RabbitMQ trong project

### 14.1 Redis

Redis dùng cho dữ liệu tạm thời, truy xuất nhanh, realtime/cache.

Các use case phù hợp:

```txt
- Lưu current location của driver/order
- Cache nearby drivers
- Cache trạng thái online của tài xế
- Blacklist token sau logout
- Lưu OTP/reset token tạm thời
- Rate limit API
```

### 14.2 RabbitMQ

RabbitMQ dùng để truyền event bất đồng bộ giữa các service.

Các event phù hợp:

```txt
ORDER_CREATED
ORDER_ASSIGNED
ORDER_DELIVERED
PAYMENT_PAID
PAYMENT_FAILED
DRIVER_LOCATION_UPDATED
AI_MODEL_TRAINED
```

Hiện tại Redis/RabbitMQ được đưa vào docker-compose để sẵn sàng mở rộng, nhưng không phải service nào cũng cần `depends_on` Redis/RabbitMQ.

---

## 15. Ghi chú triển khai

### 15.1 Service có Prisma

Các service dùng Prisma:

```txt
auth-service
user-service
order-service
payment-service
driver-service
dispatch-service
tracking-service
notification-service
ai-service
chatbot-service
admin-service
```

Mỗi service cần:

```txt
prisma/schema.prisma
prisma.config.ts
src/config/prisma.js
```

### 15.2 Service không dùng Prisma

```txt
api-gateway
```

Gateway chỉ proxy request, không cần database.

### 15.3 Biến môi trường OpenAI

Chatbot Service có thể dùng OpenAI nếu có key:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Nếu không có `OPENAI_API_KEY`, chatbot vẫn chạy bằng fallback response.

AI Service có thể giữ OpenAI cho phần phân tích phụ, nhưng phần AI chính của project là ETA Prediction Model tự train trong `ai-service`.

---

## 16. Tóm tắt service chính

| Service | Vai trò |
|---|---|
| api-gateway | Cổng vào duy nhất cho frontend/client |
| auth-service | Đăng ký, đăng nhập, JWT, role |
| user-service | Profile và địa chỉ của user |
| order-service | Quản lý đơn hàng |
| payment-service | Quản lý thanh toán |
| driver-service | Quản lý tài xế, trạng thái, vị trí |
| dispatch-service | Gán đơn cho tài xế |
| tracking-service | Theo dõi vị trí đơn hàng |
| notification-service | Thông báo in-app/email/SMS/push dạng mock |
| ai-service | ETA model tự train, recommend driver, anomaly/risk |
| chatbot-service | Chatbot hỗ trợ khách hàng |
| admin-service | Dashboard, quản trị, monitoring |
