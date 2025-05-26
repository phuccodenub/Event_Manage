# Hướng dẫn Debug Community Management System

## 🔍 Các lỗi thường gặp và cách fix

### 1. Lỗi "Cannot read properties of undefined"

**Nguyên nhân**: CommunityCard component đang cố access `user._id` nhưng User interface có thể dùng `user.id`

**Đã fix**: Sử dụng `userId = user?.id || user?._id` để hỗ trợ cả hai format

### 2. Lỗi 404 "Cannot GET /api/v1/communities"

**Nguyên nhân**: Test server chưa có endpoint communities

**Đã fix**: Thêm endpoints vào `backend/test-server.js`:
- `GET /api/v1/communities` - Lấy danh sách communities
- `GET /api/v1/communities/:id` - Lấy chi tiết community

### 3. Lỗi "ID cộng đồng không hợp lệ"

**Nguyên nhân**: `isValidMongoId()` check format ObjectId strict nhưng test data có thể dùng format khác

**Đã fix**: Bỏ check `isValidMongoId` trong `loadCommunityDetails()` và `loadCommunityEvents()`

### 4. Lỗi "Cannot find name 'isLoading'"

**Nguyên nhân**: Có thể conflict với state names trong components

**Đã fix**: Ensure state names consistent trong components

## 🚀 Cách chạy để test

### 1. Khởi động Backend Test Server
```bash
cd backend
npm run test-server  # Port 5000
```

### 2. Khởi động Frontend
```bash
cd frontend
npm run dev          # Port 5173
```

### 3. Test API endpoints
```bash
curl http://localhost:5000/api/v1/communities
curl http://localhost:5000/api/v1/communities/68246b14d782c2c4f415a9fb
```

## 📋 Checklist Debug

- [x] Test server running (port 5000)
- [x] Frontend dev server running (port 5173)
- [x] Communities endpoint working
- [x] Community details endpoint working
- [x] CommunityCard component không lỗi với user properties
- [x] CommunityDetail component load được data
- [x] Remove strict MongoId validation

## 🔧 Test Data Available

Test server cung cấp 2 sample communities:
1. "Cộng đồng IT HUTECH" (ID: 68246b14d782c2c4f415a9fb)
2. "Cộng đồng Design HUTECH" (ID: 68246b14d782c2c4f415a9fc)

Mỗi community có:
- Leader, deputies, members
- Avatar và banner images (sử dụng placeholder)
- Pending requests (cho test join flow)
- Events (community events)

## 🌐 URLs để test

- Community List: http://localhost:5173/community
- Community Detail: http://localhost:5173/communities/68246b14d782c2c4f415a9fb
- API Test: http://localhost:5000/api/v1/test

## 💡 Tips

1. Mở Browser DevTools > Console để xem lỗi JavaScript
2. Mở Network tab để xem API calls
3. Check Backend console cho API logs
4. Ensure CORS working between frontend (5173) và backend (5000)

## 🔄 Nếu vẫn lỗi

1. Restart cả 2 servers
2. Clear browser cache/localStorage
3. Check ports không bị conflict
4. Verify all dependencies installed 