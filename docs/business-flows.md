# Business Flows Documentation

## 1. Tổng quan nghiệp vụ

Hệ thống Last-mile Delivery Backend mô phỏng quy trình giao hàng chặng cuối từ lúc khách hàng tạo đơn đến khi tài xế hoàn tất giao hàng.

Các nghiệp vụ chính:

```txt
Đăng ký / đăng nhập
Quản lý hồ sơ người dùng
Tạo và quản lý đơn hàng
Thanh toán
Quản lý tài xế
Điều phối tài xế
Theo dõi vị trí đơn hàng
Gửi thông báo
AI recommendation / ETA / risk score
Chatbot hỗ trợ khách hàng
Quản trị hệ thống
```

Các vai trò:

```txt
CUSTOMER: khách hàng
DRIVER: tài xế
ADMIN: quản trị viên
```

---

## 2. Auth Flow

### 2.1 Đăng ký tài khoản

Endpoint:

```txt
POST /auth/register
```

Người dùng có thể đăng ký public với role:

```txt
CUSTOMER
DRIVER
```

Không cho đăng ký public role `ADMIN`.

Input chính:

```txt
fullName
phone
email
password
role
```

Luồng xử lý:

```txt
Client gửi thông tin đăng ký
        |
        v
Auth service validate dữ liệu
        |
        v
Kiểm tra phone/email đã tồn tại chưa
        |
        v
Hash password bằng bcrypt
        |
        v
Tạo user trong auth.users
        |
        v
Trả thông tin user đã sanitize
```

Trường hợp lỗi:

```txt
400: thiếu field hoặc password quá ngắn
409: phone/email đã tồn tại
```

---

### 2.2 Đăng nhập

Endpoint:

```txt
POST /auth/login
```

Input:

```txt
phone hoặc email
password
```

Luồng xử lý:

```txt
Client gửi phone/email + password
        |
        v
Auth service tìm user
        |
        v
Kiểm tra user ACTIVE
        |
        v
So sánh password bằng bcrypt
        |
        v
Sinh accessToken và refreshToken
        |
        v
Trả token + user
```

Response chứa:

```txt
accessToken
refreshToken
user
```

Token được dùng trong header:

```txt
Authorization: Bearer <accessToken>
```

---

### 2.3 Lấy thông tin người dùng hiện tại

Endpoint:

```txt
GET /auth/me
```

Yêu cầu:

```txt
Authenticated user
```

Luồng xử lý:

```txt
Client gửi accessToken
        |
        v
Auth middleware verify JWT
        |
        v
Auth service tìm user theo id
        |
        v
Trả thông tin user
```

---

### 2.4 Đổi mật khẩu

Endpoint:

```txt
PATCH /auth/change-password
```

Yêu cầu:

```txt
Authenticated user
```

Input:

```txt
oldPassword
newPassword
```

Luồng xử lý:

```txt
Kiểm tra oldPassword
        |
        v
Hash newPassword
        |
        v
Cập nhật passwordHash
```

---

## 3. User Profile Flow

### 3.1 Lấy hồ sơ cá nhân

Endpoint:

```txt
GET /users/me
```

Yêu cầu:

```txt
CUSTOMER / DRIVER / ADMIN
```

Luồng xử lý:

```txt
User gửi request
        |
        v
User service tìm profile theo userId
        |
        v
Nếu chưa có thì tự tạo profile rỗng
        |
        v
Trả profile
```

---

### 3.2 Cập nhật hồ sơ

Endpoint:

```txt
PATCH /users/me
```

Input:

```txt
fullName
avatarUrl
```

Luồng xử lý:

```txt
Validate token
        |
        v
Upsert profile theo userId
        |
        v
Trả profile đã cập nhật
```

---

### 3.3 Quản lý địa chỉ

Endpoints:

```txt
GET    /users/me/addresses
POST   /users/me/addresses
GET    /users/me/addresses/:id
PATCH  /users/me/addresses/:id
DELETE /users/me/addresses/:id
```

Khi tạo địa chỉ có `isDefault = true`, hệ thống sẽ bỏ default của các địa chỉ cũ rồi set địa chỉ mới làm mặc định.

---

## 4. Order Flow

### 4.1 Customer tạo đơn hàng

Endpoint:

```txt
POST /orders
```

Yêu cầu:

```txt
CUSTOMER hoặc ADMIN
```

Input chính:

```txt
pickupAddress
pickupLat
pickupLng
deliveryAddress
deliveryLat
deliveryLng
receiverName
receiverPhone
shippingFee
codAmount
items
```

Luồng xử lý:

```txt
Customer gửi thông tin đơn hàng
        |
        v
Order service validate dữ liệu
        |
        v
Tạo order trong orders.orders
        |
        v
Tạo order_items
        |
        v
Tạo status log PENDING
        |
        v
Trả order chi tiết
```

Trạng thái ban đầu:

```txt
PENDING
```

---

### 4.2 Customer xem đơn hàng của mình

Endpoint:

```txt
GET /orders/my-orders
```

Yêu cầu:

```txt
CUSTOMER
```

Luồng xử lý:

```txt
Lấy userId từ JWT
        |
        v
Query orders theo customerId
        |
        v
Trả danh sách order
```

---

### 4.3 Admin xem toàn bộ đơn hàng

Endpoint:

```txt
GET /orders
```

Yêu cầu:

```txt
ADMIN
```

Admin có thể xem danh sách tất cả đơn hàng trong hệ thống.

---

### 4.4 Xem chi tiết đơn hàng

Endpoint:

```txt
GET /orders/:id
```

Quyền truy cập:

```txt
CUSTOMER: chỉ xem đơn của mình
DRIVER: chỉ xem đơn được assign cho mình
ADMIN: xem tất cả
```

Luồng xử lý:

```txt
Tìm order theo id
        |
        v
Kiểm tra quyền truy cập
        |
        v
Trả order + items + status logs
```

---

### 4.5 Cập nhật trạng thái đơn hàng

Endpoint:

```txt
PATCH /orders/:id/status
```

Yêu cầu:

```txt
ADMIN
```

Luồng xử lý:

```txt
Admin gửi status mới
        |
        v
Order service kiểm tra order tồn tại
        |
        v
Update orders.orders.status
        |
        v
Tạo order_status_logs
        |
        v
Trả order đã cập nhật
```

Ví dụ trạng thái:

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

### 4.6 Customer hủy đơn

Endpoint:

```txt
PATCH /orders/:id/cancel
```

Yêu cầu:

```txt
CUSTOMER hoặc ADMIN
```

Điều kiện:

```txt
Chỉ hủy được khi đơn chưa hoàn tất hoặc chưa ở trạng thái không cho hủy
```

Luồng xử lý:

```txt
Kiểm tra quyền
        |
        v
Kiểm tra trạng thái hiện tại
        |
        v
Update status CANCELLED
        |
        v
Ghi status log
```

---

## 5. Driver Flow

### 5.1 Driver lấy hồ sơ tài xế

Endpoint:

```txt
GET /drivers/me
```

Yêu cầu:

```txt
DRIVER
```

Nếu chưa có driver profile, hệ thống có thể tạo profile mặc định cho user driver.

---

### 5.2 Driver cập nhật hồ sơ

Endpoint:

```txt
PATCH /drivers/me/profile
```

Input:

```txt
licenseNumber
vehicleType
vehiclePlate
```

Luồng xử lý:

```txt
Driver gửi thông tin xe
        |
        v
Driver service upsert profile
        |
        v
Trả driver profile
```

---

### 5.3 Driver cập nhật trạng thái

Endpoint:

```txt
PATCH /drivers/me/status
```

Input:

```txt
status
```

Các trạng thái:

```txt
OFFLINE
ONLINE
BUSY
SUSPENDED
```

Luồng xử lý:

```txt
Driver gửi status mới
        |
        v
Validate status
        |
        v
Update drivers.drivers.status
```

---

### 5.4 Driver cập nhật vị trí

Endpoint:

```txt
POST /drivers/me/location
```

Input:

```txt
lat
lng
heading
speed
```

Luồng xử lý:

```txt
Driver gửi vị trí hiện tại
        |
        v
Update currentLat/currentLng trong drivers.drivers
        |
        v
Insert drivers.driver_locations
```

---

### 5.5 Admin duyệt tài xế

Endpoints:

```txt
PATCH /drivers/:id/approve
PATCH /drivers/:id/reject
```

Yêu cầu:

```txt
ADMIN
```

Admin duyệt hoặc từ chối hồ sơ tài xế.

---

## 6. Dispatch Flow

Dispatch service chịu trách nhiệm gán tài xế cho đơn hàng.

### 6.1 Admin tạo assignment thủ công

Endpoint:

```txt
POST /dispatch/assignments
```

Yêu cầu:

```txt
ADMIN
```

Input:

```txt
orderId
driverId
note
```

Trong đó `driverId` là driver profile id.

Luồng xử lý:

```txt
Admin chọn order và driver
        |
        v
Dispatch service kiểm tra order tồn tại
        |
        v
Kiểm tra driver tồn tại và được duyệt
        |
        v
Kiểm tra order chưa có active assignment
        |
        v
Tạo delivery_assignment
        |
        v
Trả assignment
```

Assignment lưu:

```txt
order_id
driver_user_id
driver_profile_id
assigned_by
status = PENDING
```

---

### 6.2 Auto assign

Endpoint:

```txt
POST /dispatch/assignments/auto
```

Yêu cầu:

```txt
ADMIN
```

Luồng xử lý:

```txt
Admin gửi orderId + pickup location
        |
        v
Dispatch service gọi driver-service /drivers/nearby
        |
        v
Chọn driver phù hợp
        |
        v
Tạo assignment
```

Nếu không có driver phù hợp:

```txt
404 No nearby driver found
```

---

### 6.3 Driver xem assignment của mình

Endpoints:

```txt
GET /dispatch/my-assignments
GET /dispatch/my-current-assignment
GET /dispatch/my-history
```

Yêu cầu:

```txt
DRIVER
```

Driver chỉ xem được assignment có `driver_user_id` trùng với userId trong JWT.

---

### 6.4 Driver accept assignment

Endpoint:

```txt
PATCH /dispatch/assignments/:id/accept
```

Yêu cầu:

```txt
DRIVER
```

Luồng xử lý:

```txt
Driver gửi accept
        |
        v
Kiểm tra assignment tồn tại
        |
        v
Kiểm tra assignment thuộc driver hiện tại
        |
        v
Kiểm tra assignment đang PENDING
        |
        v
Update status ACCEPTED
```

---

### 6.5 Driver reject assignment

Endpoint:

```txt
PATCH /dispatch/assignments/:id/reject
```

Yêu cầu:

```txt
DRIVER
```

Input:

```txt
rejectReason
```

Trạng thái chuyển thành:

```txt
REJECTED
```

---

### 6.6 Complete assignment

Endpoint:

```txt
PATCH /dispatch/assignments/:id/complete
```

Yêu cầu:

```txt
DRIVER owner hoặc ADMIN
```

Luồng xử lý:

```txt
Kiểm tra assignment
        |
        v
Kiểm tra quyền
        |
        v
Update status COMPLETED
```

---

## 7. Tracking Flow

Tracking service lưu lịch sử vị trí của đơn hàng.

### 7.1 Driver gửi tracking location

Endpoint:

```txt
POST /tracking/location
```

Yêu cầu:

```txt
DRIVER hoặc ADMIN
```

Input:

```txt
orderId
lat
lng
heading
speed
eventType
note
```

Luồng xử lý:

```txt
Driver gửi vị trí
        |
        v
Tracking service kiểm tra driver được assign cho order
        |
        v
Tìm driver profile id
        |
        v
Tạo tracking_logs
```

---

### 7.2 Xem vị trí hiện tại

Endpoint:

```txt
GET /tracking/orders/:orderId/current
```

Quyền truy cập:

```txt
CUSTOMER: nếu là chủ đơn hàng
DRIVER: nếu được assign vào đơn hàng
ADMIN: tất cả
```

Luồng xử lý:

```txt
Kiểm tra order owner hoặc assignment
        |
        v
Lấy tracking log mới nhất
        |
        v
Trả current location
```

---

### 7.3 Xem lịch sử tracking

Endpoints:

```txt
GET /tracking/orders/:orderId/history
GET /tracking/orders/:orderId/route
```

`history` trả danh sách tracking log.

`route` trả dữ liệu tuyến đường gồm lat/lng theo thời gian.

---

## 8. Payment Flow

### 8.1 Customer tạo payment

Endpoint:

```txt
POST /payments
```

Yêu cầu:

```txt
CUSTOMER hoặc ADMIN
```

Input:

```txt
orderId
amount
paymentMethod
provider
note
```

Luồng xử lý:

```txt
Customer gửi payment request
        |
        v
Payment service kiểm tra order tồn tại qua orders.orders
        |
        v
Kiểm tra customer có quyền với order
        |
        v
Tạo payment_transactions
```

Trạng thái ban đầu có thể là:

```txt
PENDING
```

---

### 8.2 Customer xem payment của mình

Endpoints:

```txt
GET /payments/my-payments
GET /payments/order/:orderId
GET /payments/:id
```

Customer chỉ xem được payment của mình.

Admin có quyền xem tất cả.

---

### 8.3 Admin cập nhật payment

Endpoints:

```txt
PATCH /payments/:id/paid
PATCH /payments/:id/failed
POST /payments/:id/refund
```

Yêu cầu:

```txt
ADMIN
```

Luồng xử lý:

```txt
Admin xác nhận thanh toán thành công/thất bại/refund
        |
        v
Payment service cập nhật payment_status
        |
        v
Lưu thời điểm paid/refunded nếu có
```

---

## 9. Notification Flow

Notification service dùng để tạo và quản lý thông báo.

### 9.1 Admin tạo thông báo

Endpoint:

```txt
POST /notifications
```

Yêu cầu:

```txt
ADMIN
```

Input:

```txt
userId
title
message
type
channel
metadata
```

Luồng xử lý:

```txt
Admin gửi thông báo
        |
        v
Notification service validate userId/title/message
        |
        v
Tạo notification
```

---

### 9.2 Bulk notification

Endpoint:

```txt
POST /notifications/bulk
```

Input:

```txt
userIds
title
message
type
channel
metadata
```

Tạo thông báo cho nhiều user.

---

### 9.3 User xem thông báo

Endpoints:

```txt
GET /notifications/me
GET /notifications/me/unread-count
GET /notifications/:id
```

User chỉ xem được thông báo thuộc về mình.

Admin có thể xem thông báo theo quyền quản trị nếu endpoint cho phép.

---

### 9.4 Đánh dấu đã đọc

Endpoints:

```txt
PATCH /notifications/:id/read
PATCH /notifications/me/read-all
```

Khi read:

```txt
status = READ
readAt = current timestamp
```

---

## 10. AI Flow

AI service hỗ trợ tối ưu vận hành giao hàng.

### 10.1 Gợi ý tài xế

Endpoint:

```txt
POST /ai/recommend-driver
```

Yêu cầu:

```txt
ADMIN
```

Input:

```txt
orderId
pickupLat
pickupLng
radiusKm
drivers optional
```

Luồng xử lý:

```txt
Admin gửi thông tin pickup
        |
        v
Nếu chưa có drivers input thì gọi driver-service /drivers/nearby
        |
        v
Tính điểm từng driver theo distance, rating, experience
        |
        v
Chọn driver score cao nhất
        |
        v
Lưu ai_driver_recommendation_logs
```

---

### 10.2 Dự đoán ETA

Endpoint:

```txt
POST /ai/eta/predict
```

Yêu cầu:

```txt
ADMIN / CUSTOMER / DRIVER
```

Input:

```txt
orderId
distanceKm
averageSpeedKmh
trafficLevel
vehicleType
pickupHour
driverRating
driverTotalDeliveries
```

Luồng xử lý:

```txt
Kiểm tra active ETA model
        |
        v
Nếu có model thì dự đoán bằng weights
        |
        v
Nếu không có model thì dùng fallback formula
        |
        v
Lưu ai_eta_logs
```

---

### 10.3 Risk score

Endpoint:

```txt
POST /ai/risk-score
```

Yêu cầu:

```txt
ADMIN
```

Luồng xử lý:

```txt
Tính điểm rủi ro theo rule-based factors
        |
        v
Gọi LLM/fallback để phân tích
        |
        v
Lưu ai_anomaly_logs
```

---

### 10.4 Training ETA model

Endpoints:

```txt
POST /ai/eta/training-samples
POST /ai/eta/training-samples/seed
POST /ai/eta/train
GET  /ai/eta/model
```

Yêu cầu:

```txt
ADMIN
```

Luồng xử lý train:

```txt
Lấy training samples
        |
        v
Train linear regression bằng Node.js
        |
        v
Deactivate model cũ
        |
        v
Lưu model mới active
```

---

## 11. Chatbot Flow

Chatbot hỗ trợ customer/driver/admin hỏi thông tin liên quan đến đơn hàng.

### 11.1 Tạo session

Endpoint:

```txt
POST /chatbot/sessions
```

Input:

```txt
orderId
title
```

Luồng xử lý:

```txt
User tạo chat session
        |
        v
Chatbot service lưu chat_sessions
```

---

### 11.2 Gửi message

Endpoint:

```txt
POST /chatbot/sessions/:id/messages
```

Input:

```txt
message
orderId optional
```

Luồng xử lý:

```txt
User gửi message
        |
        v
Chatbot service kiểm tra session
        |
        v
Nếu có orderId thì gọi order-service lấy order context
        |
        v
Gọi LLM/fallback để sinh câu trả lời
        |
        v
Lưu user message và bot message
```

---

### 11.3 Lấy lịch sử session

Endpoint:

```txt
GET /chatbot/sessions/:id
```

Trả về session kèm messages.

---

### 11.4 Đóng session

Endpoint:

```txt
PATCH /chatbot/sessions/:id/close
```

Trạng thái session chuyển thành:

```txt
CLOSED
```

---

## 12. Admin Flow

Admin service là trung tâm quản trị hệ thống.

### 12.1 Dashboard

Endpoint:

```txt
GET /admin/dashboard
```

Trả về thống kê:

```txt
Tổng user
Tổng admin/customer/driver
User active/blocked
Tổng order
Order hôm nay
Order theo status
Tổng driver profile
Driver theo status
Tổng payment
Paid revenue
Payment theo status
```

---

### 12.2 System health

Endpoint:

```txt
GET /admin/system/health
```

Luồng xử lý:

```txt
Admin gọi health check
        |
        v
Admin service gọi /health của từng service
        |
        v
Tổng hợp UP/DOWN
        |
        v
Trả trạng thái toàn hệ thống
```

---

### 12.3 Quản lý user

Endpoints:

```txt
GET    /admin/users
POST   /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id
PATCH  /admin/users/:id/block
PATCH  /admin/users/:id/unblock
DELETE /admin/users/:id
```

Admin có thể tạo, cập nhật, block, unblock hoặc soft-delete user.

---

### 12.4 Quản lý order, driver, payment

Endpoints:

```txt
GET /admin/orders
GET /admin/orders/:id

GET /admin/drivers
GET /admin/drivers/:id
PATCH /admin/drivers/:id/status

GET /admin/payments
```

Admin service dùng raw query cross-schema để tổng hợp dữ liệu từ nhiều service.

---

### 12.5 Xem AI logs

Endpoints:

```txt
GET /admin/ai/recommendations
GET /admin/ai/anomalies
```

Admin dùng các API này để xem lịch sử recommendation và anomaly/risk analysis.

---

## 13. Main End-to-End Delivery Flow

Luồng nghiệp vụ giao hàng đầy đủ:

```txt
1. Customer đăng nhập
2. Customer tạo order
3. Driver đăng nhập
4. Driver cập nhật profile và location
5. Admin duyệt driver
6. Admin xem danh sách order
7. Admin gán driver cho order
8. Driver xem current assignment
9. Driver accept assignment
10. Driver cập nhật tracking location
11. Customer xem tracking current/history/route
12. Payment được tạo cho order
13. Admin hoặc hệ thống cập nhật trạng thái order
14. Driver complete assignment
15. Customer nhận notification
16. Customer có thể hỏi chatbot về order
17. Admin xem dashboard và logs
```

---

## 14. Lưu ý khi test nghiệp vụ

Postman/Newman gọi API thật nên sẽ ghi dữ liệu thật vào database.

Các lỗi thường gặp khi chạy nhiều lần:

```txt
409 Phone or email already exists
400 Invalid UUID
403 Forbidden
404 Route not found do biến id rỗng
```

Nguyên nhân phổ biến:

```txt
Token chưa được set vào environment
Sai token role
Request tạo resource trước đó fail
Biến orderId/paymentId/assignmentId/sessionId bị rỗng
Collection lệch với route thật trong code
```

Khi test flow tự động cần lưu các biến sau:

```txt
customerToken
adminToken
driverToken
customerId
adminId
driverUserId
driverId
orderId
paymentId
assignmentId
notificationId
chatSessionId
```

---

## 15. Kết luận

Các business flow trong hệ thống phản ánh một quy trình giao hàng chặng cuối tương đối đầy đủ:

```txt
Customer -> Order -> Dispatch -> Driver -> Tracking -> Payment -> Notification
```

Ngoài ra hệ thống còn có:

```txt
AI recommendation
ETA prediction
Risk analysis
Chatbot support
Admin dashboard
```

Nhờ đó project không chỉ dừng ở CRUD cơ bản mà có thêm các nghiệp vụ thực tế thường gặp trong hệ thống giao hàng.
