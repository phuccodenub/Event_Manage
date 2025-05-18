const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Load env vars với đường dẫn tuyệt đối
dotenv.config({ path: path.resolve(__dirname, '.env') });

// In ra để kiểm tra biến môi trường
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

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

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// API URL prefix
const API_PREFIX = '/api/v1';

// Route files
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

// Mount routers
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/checkins`, checkinRoutes);
app.use(`${API_PREFIX}/certificates`, certificateRoutes);

// Error handler
app.use(errorHandler);

// Home route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Set up cron job for updating event statuses and sending feedback notifications
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
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
  // Close server & exit process
  // server.close(() => process.exit(1));
});