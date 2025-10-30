const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const errorHandler = require('./middleware/error');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['https://localhost:5173', 'http://localhost:5173', process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  },
  pingTimeout: 60000, // Tăng thời gian timeout
  pingInterval: 25000, // Tăng tần suất ping
});

// Global socket store
global.io = io;
global.userSockets = new Map();

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (userId) {
    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);
    
    // Lưu socket vào Map
    global.userSockets.set(userId, socket);

    try {
    // Gửi số lượng thông báo chưa đọc khi user kết nối
      const NotificationModel = require('./models/notificationModel');
      const unreadCount = await NotificationModel.countDocuments({
        recipient: userId,
        read: false
      });
      
      console.log(`Sending unread count to ${userId}:`, unreadCount);
      socket.emit('unreadCount', { count: unreadCount });
    } catch (error) {
      console.error('Error sending unread count:', error);
    }
    
    // Xử lý sự kiện ping từ client để giữ kết nối
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }

  socket.on('disconnect', () => {
    if (userId) {
      console.log(`User disconnected: ${userId}`);
      global.userSockets.delete(userId);
    }
  });
  
  // Xử lý lỗi socket
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Hàm tiện ích để gửi thông báo cho người dùng
global.notifyUser = (userId, notification) => {
  try {
    const userSocket = global.userSockets.get(userId.toString());
  if (userSocket) {
      console.log(`Sending notification to ${userId}`);
    userSocket.emit('newNotification', notification);
      
      // Cập nhật số lượng thông báo chưa đọc
      const NotificationModel = require('./models/notificationModel');
      NotificationModel.countDocuments({
        recipient: userId,
        read: false
      }).then(count => {
        userSocket.emit('unreadCount', { count });
      });
    } else {
      console.log(`User ${userId} is not connected`);
    }
  } catch (error) {
    console.error(`Error notifying user ${userId}:`, error);
  }
};

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: ['https://localhost:5173', 'http://localhost:5173', process.env.CLIENT_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// File upload
app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}));

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const formRoutes = require('./routes/formRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const communityRoutes = require('./routes/communityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const announcementRoutes = require('./routes/announcementRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/forms', formRoutes);
app.use('/api/v1/checkins', checkinRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Set up cron job for updating event statuses and sending feedback notifications
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      console.log('Running scheduled event status update...');
      const Event = require('./models/eventModel');
      await Event.updateEventStatus();
      console.log('Scheduled event status update completed');
    } catch (error) {
      console.error('Error in scheduled event status update:', error);
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
});