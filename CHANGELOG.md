# Changelog - Event Management System Improvements

## Phiên bản mới - Cải tiến cấu trúc Event và Community

### 🎯 Mục tiêu chính
1. **Thay đổi cấu trúc thời gian Event**: Từ startDate/endDate sang eventDays với sessions
2. **Cải tiến form đăng ký CTV**: 2 bước với validation và chọn ca hỗ trợ
3. **Tích hợp Community Events**: Hiển thị tên community, phân biệt public/private

### 🔧 Thay đổi Backend

#### 1. Event Model (`backend/models/eventModel.js`)
- **Thay đổi cấu trúc thời gian**:
  - Bỏ: `startDate`, `endDate`, `startTime`, `endTime`
  - Thêm: `eventDays` array với `date` và `sessions`
  - Mỗi session có: `type`, `startTime`, `endTime`, `label`
  
- **Thêm hỗ trợ CTV**:
  - `needsCollaboratorForm`: boolean
  - `collaboratorForm`: reference đến CollaboratorForm
  - `setupTime.supportDays`: lịch hỗ trợ CTV

- **Virtual getters**: `startDate` và `endDate` tự động tính từ eventDays

#### 2. CollaboratorForm Model (`backend/models/collaboratorFormModel.js`)
- **Mới**: Model quản lý form fields cho đăng ký CTV
- **Hỗ trợ**: text, email, select, radio, checkbox, textarea, date
- **Validation**: rules cho từng field

#### 3. Event Controller (`backend/controllers/eventController.js`)
- **Cập nhật createEvent**: xử lý eventDays thay vì startDate/endDate
- **Cập nhật createCommunityEvent**: tương tự createEvent
- **joinEventAsCollaborator**: nhận formData và selectedShifts
- **API mới**:
  - `getEventCollaboratorForm`: lấy form CTV
  - `updateEventCollaboratorForm`: cập nhật form CTV
  - `getCollaboratorFormSubmissions`: xem submissions CTV
- **getAllEvents**: populate community info, xử lý public/private
- **getEventById**: populate đầy đủ community info

#### 4. Routes (`backend/routes/eventRoutes.js`)
- **Thêm routes**:
  - `GET /:id/collaborator-form`
  - `PUT /:id/collaborator-form`
  - `GET /:id/collaborator-submissions`

### 🎨 Thay đổi Frontend

#### 1. EventDaysSelector Component (`frontend/src/components/EventDaysSelector.tsx`)
- **Mới**: Component chọn nhiều ngày với DatePicker
- **Tính năng**:
  - Mỗi ngày có thể thêm nhiều buổi
  - Preset: Sáng/Chiều/Tối/Tự chọn
  - Tùy chỉnh tên buổi, giờ bắt đầu/kết thúc

#### 2. SupportScheduleSelector Component (`frontend/src/components/SupportScheduleSelector.tsx`)
- **Mới**: Tương tự EventDaysSelector nhưng cho lịch hỗ trợ CTV
- **Styling**: Màu xanh lá để phân biệt với event days

#### 3. CollaboratorScheduleModal (`frontend/src/components/modals/CollaboratorScheduleModal.tsx`)
- **Cải tiến**: 2 bước với progress indicator
  - Bước 1: Điền thông tin cá nhân
  - Bước 2: Chọn ca hỗ trợ
- **Tính năng**:
  - Render dynamic form fields từ API
  - Validation form trước khi chuyển bước
  - Gửi cả formData và selectedShifts

#### 4. CreateCommunityEventModal (`frontend/src/components/CreateCommunityEventModal.tsx`)
- **Cập nhật**: Sử dụng EventDaysSelector thay vì date/time inputs
- **Thêm**: Tùy chọn needsCollaboratorForm
- **Tích hợp**: SupportScheduleSelector
- **Xử lý**: eventDays trong form submission

#### 5. CreateEventModal (`frontend/src/components/modals/CreateEventModal.tsx`)
- **Cập nhật**: Sử dụng EventDaysSelector
- **Thêm**: Checkbox cho needsRegistrationForm và needsCollaboratorForm
- **Validation**: Kiểm tra eventDays thay vì startDate/endDate

#### 6. Event Service (`frontend/src/services/eventService.ts`)
- **API mới**:
  - `getEventCollaboratorForm`
  - `updateEventCollaboratorForm`
  - `getCollaboratorFormSubmissions`
- **Cập nhật**: `joinEventAsCollaborator` nhận formData

#### 7. Hiển thị Events
- **Events.tsx**: Hiển thị tên community cho community events
- **Home.tsx**: Tương tự Events.tsx
- **PostDetails.tsx**: Hiển thị community trong event details
- **Format**: "organizer • department • trong communityName"

### 📦 Dependencies mới
- `react-datepicker`: Date selection component
- `@types/react-datepicker`: TypeScript types

### 🔄 Migration từ phiên bản cũ

#### Dữ liệu Event cũ
- Events cũ vẫn hoạt động nhờ virtual getters
- `startDate`/`endDate` tự động tính từ `eventDays[0].sessions[0]` và `eventDays[last].sessions[last]`

#### Form CTV
- Events cũ không có form CTV sẽ sử dụng form mặc định
- Bao gồm: Họ tên, MSSV, Lớp, Khoa, Email, SĐT

### 🎯 Tính năng mới

#### 1. Event Days với Sessions
```javascript
eventDays: [{
  date: "2024-01-15",
  sessions: [{
    type: "morning",
    startTime: "07:30",
    endTime: "11:15",
    label: "Buổi Sáng"
  }]
}]
```

#### 2. Collaborator Form 2 bước
1. **Thông tin cá nhân**: Dynamic form fields
2. **Chọn ca hỗ trợ**: Từ setupTime.supportDays

#### 3. Community Events
- **Public**: Hiển thị trên trang chủ với tên community
- **Private**: Chỉ hiển thị trong community
- **Format hiển thị**: "organizer • department • trong communityName"

### 🐛 Fixes
- Form validation cải thiện
- Error handling tốt hơn
- UI/UX nhất quán
- Performance optimization

### 🚀 Cách sử dụng

#### Tạo Event mới
1. Chọn ngày và thêm buổi
2. Cấu hình location theo eventType
3. Tùy chọn form đăng ký và CTV
4. Thiết lập lịch hỗ trợ nếu cần CTV

#### Đăng ký CTV
1. Bước 1: Điền thông tin cá nhân
2. Bước 2: Chọn ca hỗ trợ từ lịch có sẵn
3. Chờ phê duyệt (trừ admin/creator/organizer)

#### Community Events
1. Tạo trong community với visibility public/private
2. Public events hiển thị trên trang chủ
3. Private events chỉ thành viên community thấy

### 📝 Notes
- Tất cả thay đổi backward compatible
- Events cũ vẫn hoạt động bình thường
- UI/UX được cải thiện đáng kể
- Performance tối ưu hơn với lazy loading 