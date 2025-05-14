# Scripts Hệ thống Quản lý Sự kiện

Thư mục này chứa các script tiện ích để hỗ trợ phát triển và vận hành hệ thống.

## importUsers.js

Script tạo dữ liệu mẫu với 100 người dùng với các vai trò khác nhau:
- 5 tài khoản admin
- 10 giảng viên (teacher)
- 85 sinh viên (student) phân bố theo các khóa:
  - Khóa 21: 20 sinh viên
  - Khóa 22: 35 sinh viên
  - Khóa 23: 30 sinh viên

### Tính năng
- Tạo tự động dữ liệu người dùng với thông tin đầy đủ
- Mã hóa mật khẩu (bcrypt)
- Mật khẩu mặc định cho tất cả tài khoản: "password123"
- **Không xóa dữ liệu hiện có trong cơ sở dữ liệu**
- Sinh tên phù hợp với giới tính (Thị -> nữ)
- Sinh năm sinh phù hợp với khóa (khóa 22 -> sinh năm 2004)
- Sinh mã số sinh viên theo định dạng: 228060184321 (22: khóa, 806018: cố định, 4 số cuối ngẫu nhiên)
- Tên lớp theo định dạng chuẩn: 22DTHE3 (22: khóa, DTH: ngành, E3: lớp)
- Lưu danh sách người dùng đã tạo vào file JSON để tham khảo

### Cách sử dụng

1. Từ thư mục gốc của dự án:
```bash
cd backend
node scripts/importUsers.js
```

2. Kiểm tra file `users.json` trong thư mục `scripts` để biết danh sách tài khoản đã tạo

### Lưu ý

- Script **KHÔNG xóa** dữ liệu người dùng hiện có, chỉ thêm mới
- Chỉ nên dùng ở môi trường phát triển hoặc test
- Cần có file .env cấu hình đúng kết nối MongoDB. 