# Architecture Documentation

## 1. Tổng quan hệ thống

Last-mile Delivery Backend là hệ thống backend mô phỏng nền tảng giao hàng chặng cuối. Hệ thống được thiết kế theo hướng **microservice-lite**, trong đó mỗi chức năng nghiệp vụ chính được tách thành một service riêng, nhưng các service vẫn dùng chung một PostgreSQL instance.

Mục tiêu chính của kiến trúc là:

* Tách biệt nghiệp vụ theo domain.
* Dễ mở rộng từng service độc lập.
* Dễ test, bảo trì và demo.
* Có API Gateway làm điểm truy cập tập trung.
* Có phân quyền theo vai trò người dùng.
* Có tích hợp AI và chatbot để tăng tính ứng dụng thực tế.

Các vai trò chính trong hệ thống:

* `CUSTOMER`: tạo đơn hàng, theo dõi đơn hàng, thanh toán, nhận thông báo, sử dụng chatbot.
* `DRIVER`: cập nhật hồ sơ tài xế, nhận đơn, cập nhật vị trí giao hàng.
* `ADMIN`: quản lý người dùng, đơn hàng, tài xế, điều phối, thanh toán, AI logs và dashboard.

---

## 2. Kiến trúc tổng thể

Hệ thống gồm các thành phần chính:

```txt
Client / Postman / Swagger
          |
          v
    API Gateway
          |
          v
+-------------------------------+
| Backend Services              |
| - auth-service                |
| - user-service                |
| - order-service               |
| - payment-service             |
| - driver-service              |
| - dispatch-service            |
| - tracking-service            |
| - notification-service        |
| - ai-service                  |
| - chatbot-service             |
| - admin-service               |
+-------------------------------+
          |
          v
+-------------------------------+
| Infrastructure                |
| - PostgreSQL                  |
| - Redis                       |
| - RabbitMQ                    |
+-------------------------------+
```

API Gateway là entrypoint duy nhất cho client. Gateway nhận request từ client rồi proxy đến service tương ứng.

Ví dụ:

```txt
POST /auth/login            -> auth-service
GET /orders/my-orders       -> order-service
GET /drivers/me             -> driver-service
POST /dispatch/assignments  -> dispatch-service
GET /admin/dashboard        -> admin-service
```

---

## 3. Danh sách service

| Service              | Port host | Port container | Vai trò                               |
| -------------------- | --------: | -------------: | ------------------------------------- |
| api-gateway          |      3000 |           3000 | Gateway, Swagger, proxy request       |
| auth-service         |      3001 |           3000 | Đăng ký, đăng nhập, JWT, đổi mật khẩu |
| order-service        |      3002 |           3000 | Quản lý đơn hàng, item, trạng thái    |
| driver-service       |      3003 |           3000 | Hồ sơ tài xế, trạng thái, vị trí      |
| tracking-service     |      3004 |           3000 | Tracking vị trí đơn hàng              |
| dispatch-service     |      3005 |           3000 | Điều phối, gán tài xế cho đơn hàng    |
| notification-service |      3006 |           3000 | Thông báo người dùng                  |
| ai-service           |      3007 |           3000 | Gợi ý tài xế, dự đoán ETA, risk score |
| user-service         |      3008 |           3000 | Hồ sơ người dùng, địa chỉ             |
| admin-service        |      3009 |           3000 | Dashboard, quản trị hệ thống          |
| chatbot-service      |      3010 |           3000 | Chatbot hỗ trợ đơn hàng               |
| payment-service      |      3011 |           3000 | Thanh toán, refund                    |

---

## 4. Mô hình microservice-lite

Hệ thống không dùng mô hình database-per-service tuyệt đối. Thay vào đó, hệ thống dùng mô hình:

```txt
One PostgreSQL instance
Multiple database schemas
Each service owns one schema
```

Mỗi service làm việc chủ yếu với schema riêng của nó.

| Service              | Schema chính                  |
| -------------------- | ----------------------------- |
| auth-service         | auth                          |
| user-service         | user_profile                  |
| order-service        | orders                        |
| payment-service      | payments                      |
| driver-service       | drivers                       |
| dispatch-service     | dispatch                      |
| tracking-service     | tracking                      |
| notification-service | notifications                 |
| ai-service           | ai                            |
| chatbot-service      | chatbot                       |
| admin-service        | auth + raw query cross-schema |

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

Thiết kế này giúp hệ thống vẫn có tính tách biệt theo service, nhưng đơn giản hơn cho đồ án, dễ triển khai bằng Docker Compose và dễ quản lý dữ liệu.

---

## 5. Nguyên tắc quan hệ dữ liệu

Hệ thống hạn chế dùng foreign key chéo schema giữa các service. Các quan hệ giữa service được lưu bằng UUID logic.

Ví dụ:

```txt
orders.orders.customer_id        -> auth.users.id
payments.payment_transactions.order_id -> orders.orders.id
dispatch.delivery_assignments.order_id -> orders.orders.id
dispatch.delivery_assignments.driver_user_id -> auth.users.id
dispatch.delivery_assignments.driver_profile_id -> drivers.drivers.id
tracking.tracking_logs.order_id -> orders.orders.id
```

Các quan hệ này được kiểm soát ở tầng service/repository thay vì ràng buộc foreign key cứng giữa nhiều schema.

Lý do:

* Giảm coupling giữa service.
* Dễ refactor từng service.
* Phù hợp với hướng microservice-lite.
* Admin-service vẫn có thể tổng hợp dữ liệu bằng raw query cross-schema.

---

## 6. Layered Architecture

Mỗi service chính được tổ chức theo mô hình nhiều tầng:

```txt
Route -> Middleware -> Controller -> Service -> Repository -> Prisma/PostgreSQL
```

Ý nghĩa từng tầng:

### Route

Định nghĩa endpoint và middleware.

Ví dụ:

```txt
POST /orders
GET /orders/my-orders
PATCH /orders/:id/status
```

### Middleware

Xử lý các phần dùng chung:

* Xác thực JWT.
* Phân quyền role.
* Validate request body/params/query.
* Error handling.
* Rate limit, CORS, JSON body limit.

### Controller

Controller nhận request, gọi service và trả response.

Controller không chứa nghiệp vụ phức tạp.

### Service

Service chứa business logic chính:

* Kiểm tra quyền truy cập.
* Kiểm tra trạng thái hợp lệ.
* Điều phối logic nhiều bước.
* Gọi repository để thao tác database.
* Gọi service khác nếu cần.

### Repository

Repository chứa toàn bộ truy vấn database:

* Prisma model query.
* Prisma transaction.
* Raw SQL cross-schema.
* Aggregate/count/query logs.

Sau refactor, các service nghiệp vụ chính không gọi Prisma trực tiếp trong service layer nữa.

---

## 7. API Gateway

API Gateway chịu trách nhiệm:

* Cung cấp entrypoint duy nhất ở port `3000`.
* Proxy request đến service tương ứng.
* Cung cấp Swagger UI tại `/docs`.
* Cung cấp health check tổng quan.

Gateway route:

```txt
/auth          -> auth-service
/users         -> user-service
/orders        -> order-service
/payments      -> payment-service
/drivers       -> driver-service
/dispatch      -> dispatch-service
/tracking      -> tracking-service
/notifications -> notification-service
/ai            -> ai-service
/chatbot       -> chatbot-service
/admin         -> admin-service
```

Trong Docker Compose, các service gọi nhau bằng service name thay vì localhost.

Ví dụ:

```txt
http://auth-service:3000
http://order-service:3000
http://driver-service:3000
```

Lưu ý:

```txt
localhost
```

chỉ dùng khi gọi từ máy host. Trong container, `localhost` là chính container đó.

---

## 8. Authentication và Authorization

Hệ thống dùng JWT để xác thực.

Auth flow:

```txt
POST /auth/login
        |
        v
Auth service kiểm tra phone/email + password
        |
        v
Trả accessToken + refreshToken
        |
        v
Client gửi Authorization: Bearer <token>
```

JWT payload gồm:

```txt
id
role
```

Các role chính:

```txt
ADMIN
CUSTOMER
DRIVER
```

Phân quyền được áp dụng theo endpoint.

Ví dụ:

```txt
CUSTOMER:
- tạo đơn hàng
- xem đơn hàng của mình
- xem tracking của đơn hàng mình sở hữu
- tạo payment của mình
- dùng chatbot

DRIVER:
- cập nhật profile tài xế
- cập nhật vị trí
- xem assignment của mình
- accept/reject/complete assignment

ADMIN:
- xem dashboard
- quản lý user
- xem toàn bộ order/payment/driver
- approve/reject driver
- tạo assignment
- xem AI logs
```

---

## 9. Database và Prisma

Mỗi service có Prisma schema riêng, trỏ đến schema PostgreSQL tương ứng.

Ví dụ order-service:

```txt
DATABASE_URL=postgresql://delivery:delivery@postgres:5432/delivery_db?schema=orders
```

Khi chạy local ngoài Docker, host database có thể là:

```txt
localhost
```

Khi chạy trong Docker Compose, host database phải là:

```txt
postgres
```

Do đó cần phân biệt env local và env Docker.

---

## 10. Docker Compose

Docker Compose dùng để chạy toàn bộ hệ thống:

* API Gateway.
* Các backend service.
* PostgreSQL.
* Redis.
* RabbitMQ.

Các container backend đều chạy port nội bộ `3000`, sau đó map ra host theo từng service.

Ví dụ:

```txt
auth-service: container 3000 -> host 3001
order-service: container 3000 -> host 3002
payment-service: container 3000 -> host 3011
```

Khi service gọi nhau trong Docker, dùng port container:

```txt
http://order-service:3000
```

Khi client gọi từ máy host, dùng port host:

```txt
http://localhost:3000
http://localhost:3002
```

---

## 11. Redis và RabbitMQ

Redis và RabbitMQ được đưa vào hạ tầng để hỗ trợ mở rộng hệ thống.

Redis có thể dùng cho:

* Cache dữ liệu đọc nhiều.
* Rate limit.
* Lưu session/token blacklist nếu mở rộng logout thực sự.

RabbitMQ có thể dùng cho:

* Gửi notification bất đồng bộ.
* Event order created.
* Event payment completed.
* Event assignment created.
* Event tracking updated.

Trong phạm vi hiện tại, hệ thống chủ yếu xử lý synchronous API, nhưng kiến trúc đã sẵn sàng để mở rộng event-driven.

---

## 12. AI Service

AI service cung cấp các chức năng:

* Gợi ý tài xế phù hợp cho đơn hàng.
* Dự đoán thời gian giao hàng ETA.
* Phát hiện bất thường.
* Tính risk score.
* Lưu AI logs.
* Huấn luyện model ETA đơn giản bằng dữ liệu training sample.

AI service gồm 2 phần:

```txt
ai.service.js
llm.service.js
```

`ai.service.js` xử lý nghiệp vụ AI, training, scoring và lưu log.

`llm.service.js` xử lý phần gọi LLM hoặc fallback response.

---

## 13. Chatbot Service

Chatbot service hỗ trợ người dùng hỏi về đơn hàng.

Các chức năng chính:

* Tạo chat session.
* Gửi message trong session.
* Lấy lịch sử chat.
* Đóng session.
* Gợi ý câu hỏi phổ biến.
* Gọi order-service để lấy context đơn hàng.
* Gọi LLM/fallback để sinh câu trả lời.

Chatbot không truy vấn trực tiếp dữ liệu order bằng Prisma mà gọi qua API của order-service để giữ đúng ranh giới service.

---

## 14. Admin Service

Admin service có vai trò tổng hợp và quản trị.

Admin service dùng schema `auth` làm schema Prisma chính, đồng thời dùng raw query để đọc dữ liệu từ nhiều schema:

```txt
orders
drivers
payments
dispatch
tracking
ai
```

Các chức năng chính:

* Dashboard thống kê.
* Quản lý user.
* Xem danh sách order.
* Xem chi tiết order.
* Xem danh sách driver.
* Cập nhật trạng thái driver.
* Xem payment.
* Xem AI logs.
* Health check toàn hệ thống.

---

## 15. Health Check

Mỗi service có endpoint:

```txt
GET /health
```

API Gateway có:

```txt
GET /health
GET /
```

Admin service có:

```txt
GET /admin/system/health
```

Endpoint này gọi health check các service khác và trả về trạng thái tổng hợp.

---

## 16. Testing

Hệ thống có thể test bằng:

* Swagger UI tại `/docs`.
* Postman collection.
* Newman CLI.
* Manual PowerShell/curl.
* Docker logs.

Các nhóm test chính:

```txt
Health test
Auth test
User profile test
Order flow test
Driver flow test
Dispatch flow test
Tracking flow test
Payment flow test
Notification test
AI test
Chatbot test
Admin test
```

Lưu ý: Postman/Newman gọi API thật nên có ghi dữ liệu thật vào database. Khi chạy nhiều lần có thể gặp lỗi `409 already exists` hoặc ID bị lệch nếu collection chưa reset dữ liệu.

---

## 17. Kết luận

Kiến trúc Last-mile Delivery Backend được thiết kế theo hướng microservice-lite, đủ tách biệt domain nhưng vẫn phù hợp với phạm vi đồ án. Hệ thống có đầy đủ các thành phần quan trọng của một backend giao hàng thực tế:

* API Gateway.
* Authentication/Authorization.
* User, Order, Payment, Driver.
* Dispatch và Tracking.
* Notification.
* AI và Chatbot.
* Admin dashboard.
* Docker Compose deployment.
* Swagger/OpenAPI documentation.
* Repository-service-controller architecture.

Kiến trúc này có thể tiếp tục mở rộng theo hướng event-driven, database-per-service, message queue, caching và CI/CD trong các phiên bản sau.
