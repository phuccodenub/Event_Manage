# Tóm tắt các sửa lỗi đã thực hiện

## 1. Sửa lỗi Button "Đăng ký làm CTV" không hiển thị form

### Vấn đề:
- Button "Đăng ký làm CTV" không mở được modal chọn buổi hỗ trợ
- Lỗi logic trong việc kiểm tra setupTime

### Giải pháp:
1. **Cập nhật CollaborateEventButton.tsx**:
   - Sửa interface `setupTime` từ `{start, end}` thành `{supportDays}`
   - Bỏ validation không cần thiết trong `handleJoinAsCollaborator`
   - Cập nhật cách truyền setupTime vào CollaboratorScheduleModal

2. **Cập nhật CollaboratorScheduleModal.tsx**:
   - Sửa interface Props để nhận `setupTime` với cấu trúc đúng
   - Thêm useEffect để set availableDays từ setupTime prop
   - Bỏ logic lấy setupTime từ API response

### Files đã sửa:
- `frontend/src/components/CollaborateEventButton.tsx`
- `frontend/src/components/modals/CollaboratorScheduleModal.tsx`

## 2. Thống nhất form tạo sự kiện giữa trang chủ và community

### Vấn đề:
- Form tạo sự kiện ở trang chủ thiếu field "Số lượng tình nguyện viên tối đa"
- Form tạo sự kiện ở community thiếu field "Khoa"
- Không thống nhất về cấu trúc và fields

### Giải pháp:
1. **Cập nhật CreateEventModal.tsx** (trang chủ):
   - Thêm field "Số lượng tình nguyện viên tối đa" (`maxCollaborators`)
   - Thêm field "Hạn chót đăng ký" (`registrationDeadline`)
   - Cập nhật form submission để gửi đúng field names (`maxVolunteers`, `needsVolunteers`)
   - Sửa logic checkbox cho `needsRegistrationForm`

2. **Cập nhật CreateCommunityEventModal.tsx**:
   - Thêm field "Khoa" (`department`)
   - Import và fetch departments
   - Thêm department vào form validation và submission
   - Cập nhật form submission để gửi `needsVolunteers`

### Thống nhất các fields:
- ✅ Tên sự kiện
- ✅ Mô tả  
- ✅ Danh mục
- ✅ Khoa (đã thêm vào community)
- ✅ Hình thức tổ chức
- ✅ EventDays (thời gian)
- ✅ Địa điểm
- ✅ Sức chứa
- ✅ Số lượng tình nguyện viên tối đa (đã thêm vào trang chủ)
- ✅ Hạn chót đăng ký (đã thêm vào trang chủ)
- ✅ Tùy chọn form đăng ký
- ✅ Tùy chọn cộng tác viên
- ✅ Lịch hỗ trợ
- ✅ Hình ảnh

### Khác biệt duy nhất:
- **Community**: Có field "Khả năng hiển thị" (Public/Private)
- **Trang chủ**: Mặc định Public, không có tùy chọn visibility

### Files đã sửa:
- `frontend/src/components/modals/CreateEventModal.tsx`
- `frontend/src/components/CreateCommunityEventModal.tsx`

## 3. Cập nhật backend compatibility

### Thay đổi:
- Đảm bảo frontend gửi đúng field names mà backend mong đợi:
  - `maxCollaborators` → `maxVolunteers`
  - Thêm `needsVolunteers` field
  - Thêm `department` field cho community events

## Kết quả:
1. ✅ Button "Đăng ký làm CTV" đã hoạt động và hiển thị form chọn buổi hỗ trợ
2. ✅ Form tạo sự kiện ở trang chủ và community đã thống nhất về cấu trúc
3. ✅ Tất cả events đều lưu vào cùng collection `events` với cấu trúc giống nhau
4. ✅ Chỉ khác biệt về visibility: trang chủ mặc định public, community có thể chọn public/private

## Test cần thực hiện:
1. Tạo sự kiện từ trang chủ với đầy đủ fields
2. Tạo sự kiện từ community với đầy đủ fields  
3. Bấm "Đăng ký làm CTV" và kiểm tra modal hiển thị
4. Kiểm tra form đăng ký CTV có 2 bước: thông tin cá nhân + chọn ca hỗ trợ
5. Kiểm tra events hiển thị đúng trên trang chủ (bao gồm community events public) 