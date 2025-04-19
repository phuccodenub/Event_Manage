# Event_Management

Dự án quản lý sự kiện khoa CNTT.

## Hướng dẫn thiết lập dự án

### 1. Clone repository
```bash
git clone https://github.com/developerchidi/Event_Management.git
cd Event_Management_Hutech
```

### 2. Cài đặt dependencies
- Cài đặt dependencies cho cả `frontend` và `backend`:
```bash
cd frontend
npm install
cd ../backend
npm install
```

### 3. Tạo file `.env`
- Tạo file `.env` trong cả hai thư mục `frontend` và `backend` dựa trên file mẫu hoặc thông tin cần thiết.

#### Ví dụ cho `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

#### Ví dụ cho `backend/.env`:
```
PORT=5000
MONGODB_URI=<MongoDB Connection String>
JWT_SECRET=<Your JWT Secret>
JWT_EXPIRE=5d
COOKIE_EXPIRE=5
```

### 4. Chạy dự án
- Chạy `backend`:
```bash
cd backend
npm run dev
```

- Chạy `frontend`:
```bash
cd frontend
npm run dev
```

### 5. Truy cập ứng dụng
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)
