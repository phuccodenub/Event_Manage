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
    origin: ['http://localhost:3000', 'http://localhost:5173', process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Global socket store
global.io = io;
global.userSockets = new Map();

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  
  if (userId) {
    console.log(`User connected: ${userId} (Socket ID: ${socket.id})`);
    global.userSockets.set(userId, socket);

    // Gửi số lượng thông báo chưa đọc khi user kết nối
    socket.emit('unreadCount', { count: await getUnreadCount(userId) });
  }

  socket.on('disconnect', () => {
    if (userId) {
      console.log(`User disconnected: ${userId}`);
      global.userSockets.delete(userId);
    }
  });
});

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', process.env.CLIENT_URL].filter(Boolean),
  credentials: true
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

// Mount routers
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/departments`, departmentRoutes);

// Error handler middleware
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

// Change app.listen to httpServer.listen
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

async function getUnreadCount(userId) {
  // Placeholder function to simulate fetching unread notification count
  // Replace with actual implementation
  return 0;
}