# Last Mile Delivery Backend

Backend cho hệ thống giao hàng chặng cuối, xây dựng bằng Node.js, Express, PostgreSQL và Prisma ORM theo kiến trúc microservice-lite/schema-per-service.

## 1. Tổng quan dự án

Dự án mô phỏng backend của một nền tảng giao hàng chặng cuối, hỗ trợ các chức năng chính:

* Đăng ký, đăng nhập, phân quyền người dùng
* Quản lý hồ sơ khách hàng và địa chỉ giao hàng
* Tạo và quản lý đơn hàng
* Quản lý thanh toán
* Quản lý tài xế
* Phân công giao hàng thủ công hoặc tự động
* Theo dõi vị trí giao hàng
* Gửi thông báo
* Dự đoán ETA bằng AI
* Gợi ý tài xế phù hợp bằng AI
* Phát hiện bất thường/rủi ro đơn hàng
* Chatbot hỗ trợ khách hàng
* Trang quản trị admin
* Tài liệu API bằng Swagger/OpenAPI

## 2. Công nghệ sử dụng

* Node.js
* Express.js
* PostgreSQL 16
* Prisma ORM
* Docker Compose
* JWT Authentication
* Redis
* RabbitMQ
* Swagger/OpenAPI
* AI ETA Prediction
* AI Driver Recommendation
* Chatbot hỗ trợ khách hàng
* OpenAI API optional fallback

## 3. Kiến trúc hệ thống

Dự án sử dụng kiến trúc microservice-lite. Các service được tách riêng theo nghiệp vụ, chạy độc lập, giao tiếp thông qua API Gateway.

Database sử dụng chung một PostgreSQL instance, nhưng mỗi service có schema riêng.

Các service chính:

* `api-gateway`
* `auth-service`
* `user-service`
* `order-service`
* `payment-service`
* `driver-service`
* `dispatch-service`
* `tracking-service`
* `notification-service`
* `ai-service`
* `chatbot-service`
* `admin-service`

## 4. Cấu trúc thư mục

```txt
Last-mile-Delivery-Backend/
├─ api-gateway/
├─ auth-service/
├─ user-service/
├─ order-service/
├─ payment-service/
├─ driver-service/
├─ dispatch-service/
├─ tracking-service/
├─ notification-service/
├─ ai-service/
├─ chatbot-service/
├─ admin-service/
├─ infrastructure/
│  └─ postgres/
├─ docs/
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## 5. Cổng service

| Service                |  Port |
| ---------------------- | ----: |
| API Gateway            |  3000 |
| Auth Service           |  3001 |
| Order Service          |  3002 |
| Driver Service         |  3003 |
| Tracking Service       |  3004 |
| Dispatch Service       |  3005 |
| Notification Service   |  3006 |
| AI Service             |  3007 |
| User Service           |  3008 |
| Admin Service          |  3009 |
| Chatbot Service        |  3010 |
| Payment Service        |  3011 |
| PostgreSQL             |  5432 |
| Redis                  |  6379 |
| RabbitMQ               |  5672 |
| RabbitMQ Management UI | 15672 |

## 6. API Documentation

Swagger UI:

```txt
http://localhost:3000/docs
```

Gateway health check:

```txt
http://localhost:3000/health
```

## 7. Cài đặt môi trường

Clone project:

```powershell
git clone <repository-url>
cd Last-mile-Delivery-Backend
```

Copy toàn bộ `.env.example` thành `.env`:

```powershell
Get-ChildItem -Recurse -Filter ".env.example" | ForEach-Object {
  $envFile = Join-Path $_.DirectoryName ".env"
  Copy-Item $_.FullName $envFile -Force
}
```

## 8. Chạy hạ tầng bằng Docker

Chạy PostgreSQL, Redis và RabbitMQ:

```powershell
docker compose up -d postgres redis rabbitmq
```

Kiểm tra container:

```powershell
docker compose ps
```

Truy cập RabbitMQ Management UI:

```txt
http://localhost:15672
```

## 9. Khởi tạo database

Nếu database chưa có schema, chạy file SQL:

```powershell
Get-Content .\infrastructure\postgres\init.sql | docker exec -i postgres psql -U delivery -d delivery_db
```

Kiểm tra database:

```powershell
docker exec -it postgres psql -U delivery -d delivery_db
```

Trong psql:

```sql
\dn
\dt auth.*
\dt orders.*
\dt drivers.*
```

## 10. Generate Prisma Client

Chạy Prisma generate cho toàn bộ service có Prisma:

```powershell
$services = @(
  "auth-service",
  "user-service",
  "order-service",
  "payment-service",
  "driver-service",
  "dispatch-service",
  "tracking-service",
  "notification-service",
  "ai-service",
  "chatbot-service",
  "admin-service"
)

foreach ($service in $services) {
  Push-Location $service
  npx prisma generate
  Pop-Location
}
```

## 11. Chạy local từng service

Ví dụ chạy `auth-service`:

```powershell
cd auth-service
node src/server.js
```

Ví dụ chạy API Gateway:

```powershell
cd api-gateway
node src/server.js
```

## 12. Chạy toàn bộ bằng Docker Compose

Build:

```powershell
$env:COMPOSE_PARALLEL_LIMIT=1
docker compose build --progress=plain
```

Start:

```powershell
docker compose up -d
```

Kiểm tra trạng thái:

```powershell
docker compose ps
```

Xem logs:

```powershell
docker compose logs --tail=100
```

Xem logs một service:

```powershell
docker compose logs -f auth-service
```

## 13. Tài khoản test

Password mặc định:

```txt
123456
```

| Role     | Phone      | Email                                         |
| -------- | ---------- | --------------------------------------------- |
| ADMIN    | 0900000001 | [admin@test.com](mailto:admin@test.com)       |
| CUSTOMER | 0900000002 | [customer@test.com](mailto:customer@test.com) |
| DRIVER   | 0900000003 | [driver@test.com](mailto:driver@test.com)     |

Seed test users:

```powershell
Get-Content .\infrastructure\postgres\seed_test_users.sql | docker exec -i postgres psql -U delivery -d delivery_db
```

## 14. Một số API chính

### Auth

```txt
POST  /auth/register
POST  /auth/login
POST  /auth/refresh-token
GET   /auth/me
POST  /auth/logout
PATCH /auth/change-password
POST  /auth/forgot-password
POST  /auth/reset-password
GET   /auth/admin-test
```

### User

```txt
GET    /users/me
PATCH  /users/me
GET    /users/me/addresses
POST   /users/me/addresses
GET    /users/me/addresses/:id
PATCH  /users/me/addresses/:id
DELETE /users/me/addresses/:id
```

### Order

```txt
POST   /orders
GET    /orders
GET    /orders/my-orders
GET    /orders/:id
PATCH  /orders/:id
PATCH  /orders/:id/cancel
PATCH  /orders/:id/status
GET    /orders/:id/timeline
GET    /orders/stats/today
GET    /orders/stats/month
GET    /orders/stats/year
```

### Payment

```txt
POST  /payments
GET   /payments/my-payments
GET   /payments/:id
GET   /payments/order/:orderId
PATCH /payments/:id/paid
PATCH /payments/:id/failed
POST  /payments/:id/refund
```

### Driver

```txt
GET    /drivers/me
PATCH  /drivers/me
PATCH  /drivers/me/status
POST   /drivers/me/location
PATCH  /drivers/me/location
GET    /drivers
GET    /drivers/nearby
GET    /drivers/:id
PATCH  /drivers/:id/approve
PATCH  /drivers/:id/reject
```

### Dispatch

```txt
POST   /dispatch/assignments
POST   /dispatch/assignments/auto
GET    /dispatch/assignments
GET    /dispatch/assignments/:id
GET    /dispatch/my-assignments
GET    /dispatch/my-current-assignment
GET    /dispatch/my-history
PATCH  /dispatch/assignments/:id/accept
PATCH  /dispatch/assignments/:id/reject
PATCH  /dispatch/assignments/:id/cancel
PATCH  /dispatch/assignments/:id/complete
```

### Tracking

```txt
POST /tracking/location
POST /tracking/orders/:orderId/location
GET  /tracking/orders/:orderId
GET  /tracking/orders/:orderId/current
GET  /tracking/orders/:orderId/history
GET  /tracking/orders/:orderId/route
```

### Notification

```txt
POST   /notifications
POST   /notifications/push
POST   /notifications/bulk
POST   /notifications/broadcast
GET    /notifications
GET    /notifications/me
GET    /notifications/me/unread-count
PATCH  /notifications/me/read-all
GET    /notifications/:id
PATCH  /notifications/:id/read
DELETE /notifications/:id
```

### AI

```txt
POST /ai/recommend-driver
POST /ai/eta
POST /ai/predict-eta
POST /ai/eta/predict
POST /ai/eta/training-samples
POST /ai/eta/training-samples/seed
POST /ai/eta/train
GET  /ai/eta/model
POST /ai/anomaly-detection
POST /ai/detect-anomaly
POST /ai/risk-score
GET  /ai/logs/recommendations
GET  /ai/logs/etas
GET  /ai/logs/anomalies
```

### Chatbot

```txt
POST  /chatbot/session
POST  /chatbot/sessions
POST  /chatbot/ask
POST  /chatbot/message
POST  /chatbot/sessions/:id/messages
GET   /chatbot/session/:id/messages
GET   /chatbot/sessions/:id
GET   /chatbot/sessions
GET   /chatbot/history
GET   /chatbot/suggestions
PATCH /chatbot/sessions/:id/close
```

### Admin

```txt
GET    /admin/dashboard
GET    /admin/system/health
GET    /admin/users
POST   /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id
PATCH  /admin/users/:id/block
PATCH  /admin/users/:id/unblock
DELETE /admin/users/:id
GET    /admin/orders
GET    /admin/orders/:id
GET    /admin/drivers
GET    /admin/drivers/:id
PATCH  /admin/drivers/:id/status
GET    /admin/payments
GET    /admin/ai/recommendations
GET    /admin/ai/anomalies
```

## 15. Luồng nghiệp vụ chính

### Luồng tạo và giao đơn hàng

1. Customer đăng nhập.
2. Customer tạo đơn hàng.
3. Admin xác nhận hoặc cập nhật trạng thái đơn.
4. Admin phân công tài xế thủ công hoặc tự động.
5. Driver nhận assignment.
6. Driver cập nhật vị trí tracking.
7. Customer theo dõi trạng thái và vị trí đơn hàng.
8. Đơn hàng hoàn tất khi driver complete assignment.

### Luồng thanh toán

1. Customer tạo payment cho order.
2. Payment có thể là COD, BANK_TRANSFER, MOMO hoặc VNPAY.
3. Admin xác nhận payment paid hoặc failed.
4. Admin có thể refund payment nếu payment đã paid.

### Luồng AI

1. AI service nhận thông tin khoảng cách, tốc độ, traffic.
2. Nếu có model đã train, service dùng model ETA.
3. Nếu chưa có model, service dùng fallback formula.
4. Admin có thể seed sample và train ETA model.
5. AI service có thể recommend driver và tính risk score.

### Luồng chatbot

1. User tạo chat session hoặc hỏi trực tiếp.
2. Chatbot lấy context đơn hàng nếu user có quyền truy cập.
3. Nếu có `OPENAI_API_KEY`, chatbot dùng OpenAI.
4. Nếu không có key, chatbot trả fallback response.

## 16. Ghi chú kiến trúc

* Mỗi service có schema database riêng.
* Quan hệ trong cùng service/schema có thể dùng foreign key thật.
* Quan hệ giữa các service dùng logical reference bằng UUID.
* API Gateway là điểm vào chính cho client/frontend.
* Redis được chuẩn bị cho cache, trạng thái tài xế online và realtime tracking.
* RabbitMQ được chuẩn bị cho event-driven communication như order created, payment paid, assignment created.
* AI service hỗ trợ ETA prediction, driver recommendation và anomaly/risk scoring.
* Chatbot service hỗ trợ OpenAI optional fallback.

## 17. Bảo mật

* JWT Authentication.
* Role-based authorization.
* Middleware kiểm tra quyền theo role.
* Ownership authorization cho order, payment, tracking, notification, chatbot.
* Helmet security headers.
* CORS configuration.
* Rate limiting.
* Không commit file `.env`.

## 18. Tác giả

Đồ án backend hệ thống giao hàng chặng cuối.
