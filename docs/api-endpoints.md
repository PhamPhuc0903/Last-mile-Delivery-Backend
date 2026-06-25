# Last Mile Delivery Backend - API Endpoints

**Project:** Last Mile Delivery Backend  
**Architecture:** Microservices + API Gateway  
**Base Gateway URL:** `http://localhost:3000/api/v1`  
**Auth Service Direct URL:** `http://localhost:3001`  
**Order Service Direct URL:** `http://localhost:3002`  
**Driver Service Direct URL:** `http://localhost:3003`  
**Tracking Service Direct URL:** `http://localhost:3004`  
**Dispatch Service Direct URL:** `http://localhost:3005`  
**Notification Service Direct URL:** `http://localhost:3006`  
**AI Service Direct URL:** `http://localhost:3007`  
**User Service Direct URL:** `http://localhost:3008`  
**Admin Service Direct URL:** `http://localhost:3009`  
**Chatbot Service Direct URL:** `http://localhost:3010`

---

## 1. API Gateway Routes

Gateway forwards public requests to internal services.

| Method | Gateway Path | Target Service | Description |
|---|---|---|---|
| ANY | `/api/v1/auth/*` | auth-service | Authentication APIs |
| ANY | `/api/v1/users/*` | user-service | User and address APIs |
| ANY | `/api/v1/orders/*` | order-service | Order management APIs |
| ANY | `/api/v1/drivers/*` | driver-service | Driver APIs |
| ANY | `/api/v1/dispatch/*` | dispatch-service | Dispatch and assignment APIs |
| ANY | `/api/v1/tracking/*` | tracking-service | Tracking APIs |
| ANY | `/api/v1/notifications/*` | notification-service | Notification APIs |
| ANY | `/api/v1/ai/*` | ai-service | AI APIs |
| ANY | `/api/v1/chatbot/*` | chatbot-service | Chatbot APIs |
| ANY | `/api/v1/admin/*` | admin-service | Admin APIs |

---

## 2. Auth Service

**Direct Base URL:** `http://localhost:3001`  
**Gateway Base URL:** `http://localhost:3000/api/v1/auth`

### 2.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check auth-service health |

### 2.2 Authentication

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | Public | Register new user |
| POST | `/auth/login` | No | Public | Login and receive access token / refresh token |
| POST | `/auth/logout` | Yes | CUSTOMER / DRIVER / ADMIN | Logout current user |
| POST | `/auth/refresh-token` | No | Public | Generate new access token from refresh token |
| POST | `/auth/forgot-password` | No | Public | Request password reset |
| POST | `/auth/reset-password` | No | Public | Reset password using token |
| POST | `/auth/change-password` | Yes | CUSTOMER / DRIVER / ADMIN | Change current password |
| GET | `/auth/me` | Yes | CUSTOMER / DRIVER / ADMIN | Get current authenticated user |

#### Register Request

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "email": "a@gmail.com",
  "password": "123456",
  "role": "CUSTOMER"
}
```

#### Login Request

```json
{
  "phone": "0901234567",
  "password": "123456"
}
```

#### Login Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": {
      "id": "uuid",
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "email": "a@gmail.com",
      "role": "CUSTOMER"
    }
  }
}
```

---

## 3. User Service

**Direct Base URL:** `http://localhost:3008`  
**Gateway Base URL:** `http://localhost:3000/api/v1/users`

### 3.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check user-service health |

### 3.2 Customer Profile

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users/me` | Yes | CUSTOMER / DRIVER / ADMIN | Get current user profile |
| PATCH | `/users/me` | Yes | CUSTOMER / DRIVER / ADMIN | Update current user profile |

### 3.3 Address Management

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users/me/addresses` | Yes | CUSTOMER | Get saved addresses |
| POST | `/users/me/addresses` | Yes | CUSTOMER | Create saved address |
| GET | `/users/me/addresses/:id` | Yes | CUSTOMER | Get address detail |
| PATCH | `/users/me/addresses/:id` | Yes | CUSTOMER | Update address |
| DELETE | `/users/me/addresses/:id` | Yes | CUSTOMER | Delete address |

### 3.4 User Management

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/users` | Yes | ADMIN | Get all users |
| GET | `/users/:id` | Yes | ADMIN | Get user detail |
| POST | `/users` | Yes | ADMIN | Create user by admin |
| PATCH | `/users/:id` | Yes | ADMIN | Update user by admin |
| DELETE | `/users/:id` | Yes | ADMIN | Delete user by admin |
| PATCH | `/users/:id/block` | Yes | ADMIN | Block user |
| PATCH | `/users/:id/unblock` | Yes | ADMIN | Unblock user |

---

## 4. Order Service

**Direct Base URL:** `http://localhost:3002`  
**Gateway Base URL:** `http://localhost:3000/api/v1/orders`

### 4.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check order-service health |

### 4.2 Customer Orders

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/orders` | Yes | CUSTOMER | Create new delivery order |
| GET | `/orders` | Yes | CUSTOMER / ADMIN | Get orders list |
| GET | `/orders/:id` | Yes | CUSTOMER / DRIVER / ADMIN | Get order detail |
| PATCH | `/orders/:id` | Yes | CUSTOMER / ADMIN | Update order information |
| PATCH | `/orders/:id/cancel` | Yes | CUSTOMER / ADMIN | Cancel order |

#### Create Order Request

```json
{
  "pickupAddress": "12 Nguyen Trai, District 1, HCMC",
  "pickupLat": 10.776,
  "pickupLng": 106.701,
  "dropoffAddress": "99 Le Loi, District 3, HCMC",
  "dropoffLat": 10.781,
  "dropoffLng": 106.695,
  "receiverName": "Nguyen Van B",
  "receiverPhone": "0909999999",
  "codAmount": 500000,
  "deliveryFee": 25000,
  "note": "Giao giờ hành chính",
  "items": [
    {
      "itemName": "Áo thun",
      "quantity": 2,
      "weight": 0.5,
      "value": 300000
    }
  ]
}
```

### 4.3 Order Timeline

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/orders/:id/timeline` | Yes | CUSTOMER / DRIVER / ADMIN | Get order status timeline |

### 4.4 Order Statistics

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/orders/stats/today` | Yes | ADMIN | Get today's order statistics |
| GET | `/orders/stats/month` | Yes | ADMIN | Get monthly order statistics |
| GET | `/orders/stats/year` | Yes | ADMIN | Get yearly order statistics |

---

## 5. Driver Service

**Direct Base URL:** `http://localhost:3003`  
**Gateway Base URL:** `http://localhost:3000/api/v1/drivers`

### 5.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check driver-service health |

### 5.2 Driver Profile

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/drivers/me` | Yes | DRIVER | Get driver profile |
| PATCH | `/drivers/me` | Yes | DRIVER | Update driver profile |

### 5.3 Driver Availability

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| PATCH | `/drivers/me/status` | Yes | DRIVER | Update driver status |

#### Update Driver Status Request

```json
{
  "status": "ONLINE"
}
```

### 5.4 Driver GPS

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/drivers/me/location` | Yes | DRIVER | Update driver GPS location |

#### Update Location Request

```json
{
  "lat": 10.776,
  "lng": 106.701,
  "speed": 30,
  "heading": 180
}
```

### 5.5 Driver Orders

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/drivers/me/orders` | Yes | DRIVER | Get driver's assigned orders |
| GET | `/drivers/me/orders/current` | Yes | DRIVER | Get driver's current active order |
| GET | `/drivers/me/orders/history` | Yes | DRIVER | Get driver's delivery history |

### 5.6 Driver Order Actions

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| PATCH | `/drivers/orders/:id/accept` | Yes | DRIVER | Accept assigned order |
| PATCH | `/drivers/orders/:id/reject` | Yes | DRIVER | Reject assigned order |
| PATCH | `/drivers/orders/:id/picked-up` | Yes | DRIVER | Mark order as picked up |
| PATCH | `/drivers/orders/:id/in-transit` | Yes | DRIVER | Mark order as in transit |
| PATCH | `/drivers/orders/:id/delivered` | Yes | DRIVER | Mark order as delivered |
| PATCH | `/drivers/orders/:id/failed` | Yes | DRIVER | Mark order as failed |

---

## 6. Dispatch Service

**Direct Base URL:** `http://localhost:3005`  
**Gateway Base URL:** `http://localhost:3000/api/v1/dispatch`

### 6.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check dispatch-service health |

### 6.2 Assignment

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/dispatch/assign` | Yes | ADMIN | Manually assign driver to order |
| POST | `/dispatch/ai-suggest` | Yes | ADMIN | Suggest best driver using AI scoring |
| POST | `/dispatch/auto-assign` | Yes | ADMIN | Automatically assign best driver |
| GET | `/dispatch/history` | Yes | ADMIN | Get assignment history |

#### Manual Assignment Request

```json
{
  "orderId": "order-uuid",
  "driverId": "driver-uuid"
}
```

#### AI Suggest Response

```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "suggestedDriverId": "driver-uuid",
    "score": 0.92,
    "reason": "Driver is near pickup location and currently available."
  }
}
```

---

## 7. Tracking Service

**Direct Base URL:** `http://localhost:3004`  
**Gateway Base URL:** `http://localhost:3000/api/v1/tracking`

### 7.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check tracking-service health |

### 7.2 Order Tracking

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/tracking/orders/:orderId` | Yes | CUSTOMER / ADMIN | Get current tracking information |
| GET | `/tracking/orders/:orderId/history` | Yes | CUSTOMER / ADMIN | Get tracking history |
| GET | `/tracking/orders/:orderId/route` | Yes | CUSTOMER / ADMIN | Get route points for map display |
| POST | `/tracking/location` | Yes | DRIVER | Submit tracking location for active order |

#### Current Tracking Response

```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "driver": {
      "id": "driver-uuid",
      "name": "Nguyen Van A"
    },
    "location": {
      "lat": 10.77,
      "lng": 106.70
    },
    "status": "IN_TRANSIT"
  }
}
```

---

## 8. Notification Service

**Direct Base URL:** `http://localhost:3006`  
**Gateway Base URL:** `http://localhost:3000/api/v1/notifications`

### 8.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check notification-service health |

### 8.2 Notifications

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/notifications` | Yes | CUSTOMER / DRIVER / ADMIN | Get current user's notifications |
| GET | `/notifications/:id` | Yes | CUSTOMER / DRIVER / ADMIN | Get notification detail |
| PATCH | `/notifications/:id/read` | Yes | CUSTOMER / DRIVER / ADMIN | Mark notification as read |
| POST | `/notifications/push` | Yes | ADMIN | Push notification to a user |
| POST | `/notifications/broadcast` | Yes | ADMIN | Broadcast notification to users |

---

## 9. AI Service

**Direct Base URL:** `http://localhost:3007`  
**Gateway Base URL:** `http://localhost:3000/api/v1/ai`

### 9.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check ai-service health |

### 9.2 AI APIs

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/ai/eta` | Yes | ADMIN / CUSTOMER | Predict delivery ETA |
| POST | `/ai/recommend-driver` | Yes | ADMIN | Recommend best driver |
| POST | `/ai/anomaly-detection` | Yes | ADMIN | Detect delivery anomalies |
| POST | `/ai/risk-score` | Yes | ADMIN | Calculate delivery risk score |

#### ETA Request

```json
{
  "orderId": "order-uuid"
}
```

#### ETA Response

```json
{
  "success": true,
  "data": {
    "orderId": "order-uuid",
    "etaMinutes": 18
  }
}
```

#### Recommend Driver Request

```json
{
  "orderId": "order-uuid"
}
```

#### Recommend Driver Response

```json
{
  "success": true,
  "data": {
    "suggestedDriverId": "driver-uuid",
    "score": 0.89,
    "reason": "Driver is close to pickup point, online and has high successful delivery rate."
  }
}
```

---

## 10. Chatbot Service

**Direct Base URL:** `http://localhost:3010`  
**Gateway Base URL:** `http://localhost:3000/api/v1/chatbot`

### 10.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check chatbot-service health |

### 10.2 Chatbot APIs

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/chatbot/session` | Yes | CUSTOMER | Create chatbot session |
| POST | `/chatbot/ask` | Yes | CUSTOMER | Ask chatbot about current order |
| GET | `/chatbot/session/:id/messages` | Yes | CUSTOMER | Get chat history |
| GET | `/chatbot/suggestions` | Yes | CUSTOMER | Get suggested questions |

#### Chatbot Ask Request

```json
{
  "sessionId": "chat-session-uuid",
  "orderId": "order-uuid",
  "message": "Đơn hàng của tôi đang ở đâu?"
}
```

#### Chatbot Ask Response

```json
{
  "success": true,
  "data": {
    "intent": "ORDER_STATUS",
    "confidence": 0.92,
    "answer": "Đơn hàng của bạn đang được giao và dự kiến tới trong khoảng 15 phút nữa."
  }
}
```

---

## 11. Admin Service

**Direct Base URL:** `http://localhost:3009`  
**Gateway Base URL:** `http://localhost:3000/api/v1/admin`

### 11.1 Health Check

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/health` | No | Public | Check admin-service health |

### 11.2 Dashboard

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/dashboard` | Yes | ADMIN | Get dashboard summary |

### 11.3 Admin Orders

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/orders` | Yes | ADMIN | Get all orders |
| GET | `/admin/orders/:id` | Yes | ADMIN | Get order detail |

### 11.4 Admin Drivers

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/drivers` | Yes | ADMIN | Get all drivers |
| GET | `/admin/drivers/:id` | Yes | ADMIN | Get driver detail |
| PATCH | `/admin/drivers/:id/status` | Yes | ADMIN | Update driver status |

### 11.5 AI Monitoring

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/ai/recommendations` | Yes | ADMIN | Get AI recommendation logs |
| GET | `/admin/ai/anomalies` | Yes | ADMIN | Get AI anomaly logs |

### 11.6 System Monitoring

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/system/health` | Yes | ADMIN | Get system health summary |
| GET | `/admin/system/events` | Yes | ADMIN | Get system events |
| GET | `/admin/system/logs` | Yes | ADMIN | Get system logs |

---

## 12. Payment Service APIs

Payment service is optional in MVP. If implemented, use these endpoints.

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/payments/orders/:orderId` | Yes | CUSTOMER / ADMIN | Get payment detail by order |
| POST | `/payments/cod/confirm` | Yes | DRIVER / ADMIN | Confirm COD collection |
| GET | `/payments/transactions` | Yes | ADMIN | Get payment transactions |
| GET | `/payments/transactions/:id` | Yes | ADMIN | Get transaction detail |
| PATCH | `/payments/transactions/:id/refund` | Yes | ADMIN | Refund transaction |

---

## 13. Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 14. Order Status Values

```txt
PENDING
ASSIGNED
ACCEPTED
PICKED_UP
IN_TRANSIT
DELIVERED
FAILED
CANCELLED
```

---

## 15. Driver Status Values

```txt
ONLINE
OFFLINE
BUSY
SUSPENDED
```

---

## 16. User Role Values

```txt
ADMIN
CUSTOMER
DRIVER
```

---

## 17. Chatbot Intent Values

```txt
ORDER_STATUS
ORDER_LOCATION
ORDER_ETA
DRIVER_INFO
CANCEL_ORDER
DELIVERY_FEE
FAILED_REASON
UNKNOWN
```

---

## 18. RabbitMQ Events

| Event | Publisher | Consumer | Description |
|---|---|---|---|
| `ORDER_CREATED` | order-service | dispatch-service, notification-service | New order was created |
| `DRIVER_ASSIGNED` | dispatch-service | order-service, notification-service | Driver assigned to order |
| `ORDER_ACCEPTED` | driver-service | order-service, notification-service | Driver accepted order |
| `ORDER_PICKED_UP` | driver-service | order-service, tracking-service, notification-service | Driver picked up package |
| `ORDER_IN_TRANSIT` | driver-service | order-service, tracking-service, notification-service | Order is in transit |
| `ORDER_DELIVERED` | driver-service | order-service, payment-service, notification-service | Order delivered successfully |
| `ORDER_FAILED` | driver-service | order-service, notification-service, ai-service | Order delivery failed |
| `ORDER_CANCELLED` | order-service | dispatch-service, notification-service | Order was cancelled |
| `DRIVER_LOCATION_UPDATED` | driver-service | tracking-service, ai-service | Driver location updated |
| `AI_DRIVER_SUGGESTED` | ai-service | dispatch-service | AI suggested a driver |
| `AI_ANOMALY_DETECTED` | ai-service | notification-service, admin-service | AI detected anomaly |
| `NOTIFICATION_SENT` | notification-service | admin-service | Notification was sent |

---

## 19. Socket.IO Events

### Client to Server

| Event | Sender | Description |
|---|---|---|
| `join_order_room` | CUSTOMER / ADMIN | Join room for order tracking |
| `leave_order_room` | CUSTOMER / ADMIN | Leave order tracking room |
| `driver_location_update` | DRIVER | Send driver location update |
| `driver_online` | DRIVER | Driver becomes online |
| `driver_offline` | DRIVER | Driver becomes offline |
| `chat_message` | CUSTOMER | Send chatbot message |
| `chat_typing` | CUSTOMER | Send chatbot typing status |

### Server to Client

| Event | Receiver | Description |
|---|---|---|
| `order_assigned` | CUSTOMER / DRIVER | Order was assigned |
| `order_picked_up` | CUSTOMER | Order was picked up |
| `order_in_transit` | CUSTOMER | Order is in transit |
| `order_delivered` | CUSTOMER | Order delivered successfully |
| `order_failed` | CUSTOMER | Order delivery failed |
| `driver_location_updated` | CUSTOMER / ADMIN | Driver location was updated |
| `eta_updated` | CUSTOMER | ETA changed |
| `chatbot_response` | CUSTOMER | Chatbot response message |
| `notification_received` | CUSTOMER / DRIVER / ADMIN | New notification received |

---

## 20. MVP Implementation Priority

### Phase 1 - Core Backend

```txt
1. Auth Service
2. User Service
3. Order Service
4. Driver Service
5. Dispatch Service
```

### Phase 2 - Realtime and Events

```txt
1. RabbitMQ events
2. Tracking Service
3. Notification Service
4. Socket.IO tracking
```

### Phase 3 - AI Features

```txt
1. AI driver recommendation
2. ETA prediction
3. Anomaly detection
4. Chatbot order Q&A
```

### Phase 4 - Admin and Documentation

```txt
1. Admin dashboard APIs
2. Swagger documentation
3. Postman collection
4. Final report integration
```
