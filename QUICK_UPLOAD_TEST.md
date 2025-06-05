# Quick Upload Test Guide

## Test Upload Endpoint Trực Tiếp

### 1. Kiểm tra Backend đang chạy
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test endpoint
curl -X POST http://localhost:5000/api/v1/upload/events
# Kết quả mong đợi: {"success":false,"error":"Please upload at least one image"}
```

### 2. Test với Postman hoặc cURL
```bash
curl -X POST http://localhost:5000/api/v1/upload/events \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@path/to/image.jpg"
```

### 3. Debug Steps nếu Upload vẫn lỗi

#### A. Kiểm tra Network Tab
1. Mở DevTools > Network
2. Tạo event với ảnh
3. Tìm request `/upload/events`
4. Check:
   - Status code
   - Request headers (có Authorization không?)
   - Request payload (có files không?)
   - Response body

#### B. Check Console Logs
Tìm các log:
```
Adding file 0: filename.jpg image/jpeg 123456
Uploading to /upload/events with 1 files
Upload response: {...}
```

#### C. Temporary Fix - Skip Upload
Trong `CreateCommunityEventModal.tsx`, thêm temporary bypass:

```typescript
// TEMPORARY: Skip upload nếu gặp lỗi
const SKIP_UPLOAD = true; // Set to true để skip upload

if (selectedImages.length > 0 && !SKIP_UPLOAD) {
  // Upload logic...
} else if (SKIP_UPLOAD && selectedImages.length > 0) {
  toast.warning('Tạm thời bỏ qua upload ảnh');
}
```

### 4. Alternative: Manual Upload Test
1. Thêm button test trong modal:
```jsx
<button 
  type="button" 
  onClick={async () => {
    try {
      const testFile = selectedImages[0];
      if (!testFile) {
        alert('Chọn ảnh trước');
        return;
      }
      const result = await uploadService.uploadEventImages([testFile]);
      console.log('Test upload result:', result);
      alert('Upload thành công: ' + JSON.stringify(result));
    } catch (error) {
      console.error('Test upload error:', error);
      alert('Upload lỗi: ' + error.message);
    }
  }}
>
  Test Upload
</button>
```

### 5. Backend Debug
Thêm log vào `backend/routes/uploadRoutes.js`:
```javascript
router.post('/events', protect, async (req, res) => {
  console.log('Upload request received:', {
    hasFiles: !!req.files,
    filesCount: req.files?.images ? (Array.isArray(req.files.images) ? req.files.images.length : 1) : 0,
    user: req.user?.email
  });
  
  try {
    // existing logic...
  } catch (error) {
    console.error('Upload error details:', error);
    // existing error handling...
  }
});
```

## Kết Quả Mong Đợi

✅ **Backend running**: `Server running on port 5000`  
✅ **Upload endpoint responds**: Status 400 với "Please upload at least one image"  
✅ **With images**: Status 200 với uploaded file data  
✅ **Network tab**: Request đến `/upload/events` với files  
✅ **Console**: Upload progress logs  

## Troubleshooting Common Issues

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| 404 Not Found | Backend chưa chạy | `npm run dev` trong backend |
| 401 Unauthorized | Token không hợp lệ | Đăng nhập lại |
| 400 Bad Request | Không có files | Kiểm tra form data |
| 500 Server Error | Cloudinary config | Kiểm tra .env trong backend |
| Network Error | CORS/Connection | Kiểm tra CORS settings | 