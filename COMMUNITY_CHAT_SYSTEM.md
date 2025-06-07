# Hệ Thống Chat Cộng Đồng

## Tổng Quan

Hệ thống chat cộng đồng cho phép các thành viên trong cộng đồng có thể thảo luận với nhau thông qua chat real-time. Hệ thống được xây dựng với WebSocket để đảm bảo tính real-time và tích hợp sâu với hệ thống quản lý cộng đồng hiện tại.

## Tính Năng

### ✅ Đã Hoàn Thành

1. **Chat Real-time**
   - Gửi/nhận tin nhắn trong thời gian thực
   - Hiển thị trạng thái "đang gửi..." cho tin nhắn optimistic
   - Tự động scroll xuống tin nhắn mới

2. **Kiểm Tra Quyền Truy Cập**
   - Chỉ thành viên của cộng đồng mới có thể xem và gửi tin nhắn
   - Hiển thị thông báo "Bạn cần tham gia cộng đồng để có thể thảo luận"

3. **Giao Diện Hiện Đại**
   - Design responsive, tương thích mobile và desktop
   - Hiển thị avatar và tên người gửi
   - Phân biệt tin nhắn của bạn và người khác
   - Hiển thị thời gian tương đối (vd: "2 phút trước")

4. **Tích Hợp WebSocket**
   - Kết nối socket tự động với userId
   - Join/leave community chat rooms
   - Xử lý lỗi kết nối và reconnect

### 🚧 Dự Kiến Phát Triển

1. **Chỉnh Sửa Tin Nhắn** (trong 15 phút)
2. **Xóa Tin Nhắn** (chủ sở hữu và admin)
3. **Typing Indicators** (hiển thị khi ai đó đang gõ)
4. **Upload Hình Ảnh** trong chat
5. **Emoji Reactions** cho tin nhắn
6. **Reply/Quote** tin nhắn
7. **Online Members** indicator

## Cấu Trúc Dự Án

### Frontend Components

```
src/components/community/
├── CommunityChat.tsx        # Main chat component
└── ...

src/services/
├── chatService.ts           # API calls cho chat
└── ...

src/context/
├── CommunityContext.tsx     # Socket connection & state
└── ...
```

### Backend Structure

```
backend/
├── models/
│   └── chatMessageModel.js  # Chat message schema
├── controllers/
│   └── chatController.js    # Chat API controllers
├── routes/
│   └── communityRoutes.js   # Chat routes
└── index.js                 # Socket.IO setup
```

## API Endpoints

### Chat Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/communities/:communityId/messages` | Lấy lịch sử chat |
| POST | `/api/v1/communities/:communityId/messages` | Gửi tin nhắn mới |
| PUT | `/api/v1/communities/:communityId/messages/:messageId` | Chỉnh sửa tin nhắn |
| DELETE | `/api/v1/communities/:communityId/messages/:messageId` | Xóa tin nhắn |
| GET | `/api/v1/communities/:communityId/online-members` | Lấy members online |

## WebSocket Events

### Client → Server

- `community:join-chat` - Join vào chat room của community
- `community:leave-chat` - Rời khỏi chat room
- `community:send-message` - Broadcast tin nhắn mới (real-time)
- `community:typing-start` - Bắt đầu typing
- `community:typing-stop` - Dừng typing

### Server → Client

- `community:new-message` - Tin nhắn mới từ user khác
- `community:message-updated` - Tin nhắn được chỉnh sửa
- `community:message-deleted` - Tin nhắn bị xóa
- `community:user-typing` - User khác đang typing
- `community:user-stopped-typing` - User khác dừng typing

## Database Schema

### ChatMessage Model

```javascript
{
  _id: ObjectId,
  communityId: ObjectId,          // Reference to Community
  sender: ObjectId,               // Reference to User
  content: String,                // Message content (max 2000 chars)
  type: String,                   // 'text' | 'image' | 'file'
  attachment: {                   // For image/file messages
    url: String,
    filename: String,
    size: Number,
    mimetype: String,
    public_id: String
  },
  edited: Boolean,                // Has message been edited?
  editedAt: Date,                 // When was it edited
  replyTo: ObjectId,              // Reference to another message
  reactions: [{                   // Emoji reactions
    user: ObjectId,
    emoji: String,
    createdAt: Date
  }],
  deleted: Boolean,               // Soft delete flag
  deletedAt: Date,                // When was it deleted
  createdAt: Date,                // Message timestamp
  updatedAt: Date
}
```

## Sử Dụng

### 1. Truy Cập Chat

1. Vào trang chi tiết cộng đồng
2. Click tab "Thảo luận"
3. Nếu bạn là thành viên, sẽ thấy khung chat
4. Nếu chưa tham gia, sẽ thấy thông báo yêu cầu tham gia

### 2. Gửi Tin Nhắn

1. Nhập tin nhắn vào ô text area
2. Nhấn Enter hoặc click nút gửi
3. Tin nhắn sẽ hiện ngay lập tức (optimistic update)
4. Nếu gửi thất bại, tin nhắn sẽ bị xóa và hiện lỗi

### 3. Xem Lịch Sử

- Chat tự động load 50 tin nhắn gần nhất
- Scroll tự động xuống tin nhắn mới
- Hiển thị thời gian tương đối cho mỗi tin nhắn

## Tối Ưu Hóa

### Performance

1. **Pagination** - Chỉ load 50 tin nhắn mỗi lần
2. **Optimistic Updates** - UI phản hồi ngay lập tức
3. **Socket Rooms** - Chỉ broadcast cho users trong community
4. **Lazy Loading** - Chat chỉ load khi vào tab "Thảo luận"

### UX Improvements

1. **Auto-scroll** - Tự động scroll xuống tin nhắn mới
2. **Loading States** - Spinner khi đang load/gửi
3. **Error Handling** - Thông báo lỗi rõ ràng
4. **Responsive Design** - Hoạt động tốt trên mọi thiết bị

## Bảo Mật

### Xác Thực & Phân Quyền

1. **JWT Authentication** - Yêu cầu đăng nhập
2. **Community Membership** - Kiểm tra thành viên
3. **Message Ownership** - Chỉ chủ tin nhắn có thể chỉnh sửa
4. **Admin Privileges** - Leader/Deputy có quyền xóa tin nhắn

### Validation

1. **Content Length** - Tối đa 2000 ký tự
2. **Rate Limiting** - Chống spam (có thể thêm sau)
3. **Sanitization** - Làm sạch input
4. **CORS Protection** - Chỉ cho phép frontend domain

## Troubleshooting

### Lỗi Thường Gặp

1. **"Bạn cần tham gia cộng đồng"**
   - Kiểm tra đã join community chưa
   - Đảm bảo request join đã được approve

2. **Tin nhắn không gửi được**
   - Kiểm tra kết nối internet
   - Kiểm tra server backend có đang chạy
   - Xem console log để debug

3. **Socket không kết nối**
   - Kiểm tra CORS settings
   - Đảm bảo userId được truyền đúng
   - Kiểm tra firewall/proxy settings

### Development Tips

1. **Console Logging** - Bật để debug socket events
2. **Network Tab** - Kiểm tra API calls
3. **WebSocket Tab** - Monitor socket connection
4. **Redux DevTools** - Inspect context state

## Kết Luận

Hệ thống chat cộng đồng đã được tích hợp thành công với:

- ✅ Real-time messaging với WebSocket
- ✅ Optimistic updates cho UX tốt
- ✅ Kiểm tra quyền truy cập chặt chẽ
- ✅ Design responsive và hiện đại
- ✅ Error handling và reconnection
- ✅ Integration với existing community system

Hệ thống sẵn sàng để sử dụng và có thể mở rộng với các tính năng nâng cao trong tương lai! 