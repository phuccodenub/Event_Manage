const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());

// Test route
app.get('/api/v1/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Mock collaborator form endpoint
app.get('/api/v1/event/:id/collaborator-form', (req, res) => {
  res.json({
    success: true,
    data: {
      fields: [
        {
          fieldId: 'fullName',
          label: 'Họ và tên',
          type: 'text',
          required: true,
          placeholder: 'Nhập họ và tên'
        },
        {
          fieldId: 'studentId',
          label: 'Mã số sinh viên',
          type: 'text',
          required: true,
          placeholder: 'Nhập mã số sinh viên'
        },
        {
          fieldId: 'phone',
          label: 'Số điện thoại',
          type: 'tel',
          required: true,
          placeholder: 'Nhập số điện thoại'
        },
        {
          fieldId: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          placeholder: 'Nhập email'
        }
      ],
      setupTime: {
        supportDays: [
          {
            date: '2024-12-25',
            sessions: [
              {
                type: 'morning',
                startTime: '07:30',
                endTime: '11:15',
                label: 'Buổi Sáng'
              },
              {
                type: 'afternoon', 
                startTime: '12:30',
                endTime: '16:15',
                label: 'Buổi Chiều'
              }
            ]
          }
        ]
      }
    }
  });
});

// Mock community event creation endpoint
app.post('/api/v1/communities/:communityId/events', (req, res) => {
  res.json({
    success: true,
    data: {
      _id: 'mock-event-id',
      title: req.body.title || 'Mock Event',
      description: req.body.description || 'Mock Description'
    },
    message: 'Sự kiện đã được tạo thành công!'
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 