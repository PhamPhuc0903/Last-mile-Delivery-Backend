# API Tests - Last Mile Delivery Backend

Bộ file này dùng để test nhanh API qua Postman/Newman.

## Số lượng endpoint theo docs hiện tại

- Tổng dòng API trong doc: **140**
- Dòng proxy `ANY /.../*` của API Gateway: **11**
- Endpoint thực tế để test: **129**

## Cài Newman

```powershell
npm install -D newman
```

Hoặc chạy trực tiếp:

```powershell
npx newman --version
```

## Chạy smoke test bằng Node, không cần Newman

```powershell
node api-tests/scripts/smoke-test.js
```

Lệnh này chỉ kiểm tra `/health` của các service.

## Chạy smoke test bằng Newman

```powershell
npx newman run api-tests/postman/lastmile-smoke.postman_collection.json -e api-tests/postman/local.postman_environment.json
```

## Chạy full API route check

```powershell
npx newman run api-tests/postman/lastmile-full.postman_collection.json -e api-tests/postman/local.postman_environment.json
```

## Lưu ý quan trọng

Collection full dùng để kiểm tra nhanh route/service có bị lỗi 5xx/502 không. Một số API có thể trả `401`, `403`, `404` hoặc `400` nếu chưa có token, chưa có dữ liệu seed, hoặc ID không tồn tại. Đó không nhất thiết là lỗi server.

Muốn test flow chuẩn, hãy sửa các biến trong `local.postman_environment.json`:

- `customerPhone`, `customerPassword`
- `adminPhone`, `adminPassword`
- `driverPhone`, `driverPassword`
- `orderId`, `driverId`, `paymentId`, `assignmentId`, ... nếu muốn test detail/update API

## Cách dùng trong Postman UI

1. Import `postman/lastmile-full.postman_collection.json`
2. Import `postman/local.postman_environment.json`
3. Chọn environment `Last Mile Local Environment`
4. Chạy folder `00 Setup - Login tokens` trước
5. Chạy từng folder service hoặc Run Collection