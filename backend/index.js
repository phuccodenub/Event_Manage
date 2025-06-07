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

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    console.log(`User ${userId} connected`);
    
    // Join community chat rooms
    socket.on('community:join-chat', (communityId) => {
      socket.join(`community_${communityId}`);
      console.log(`User ${userId} joined community chat ${communityId}`);
    });

    // Leave community chat rooms
    socket.on('community:leave-chat', (communityId) => {
      socket.leave(`community_${communityId}`);
      console.log(`User ${userId} left community chat ${communityId}`);
    });

    // Handle message sending (real-time broadcast to other users)
    socket.on('community:send-message', (messageData) => {
      // Broadcast to all other users in the community room
      socket.to(`community_${messageData.communityId}`).emit('community:new-message', messageData);
    });

    // Handle typing indicators
    socket.on('community:typing-start', (data) => {
      socket.to(`community_${data.communityId}`).emit('community:user-typing', {
        userId: userId,
        communityId: data.communityId
      });
    });

    socket.on('community:typing-stop', (data) => {
      socket.to(`community_${data.communityId}`).emit('community:user-stopped-typing', {
        userId: userId,
        communityId: data.communityId
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  }
});

// Make io accessible to our controllers
app.set('io', io);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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
app.use('/api/v1/event', eventRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/forms', formRoutes);
app.use('/api/v1/checkins', checkinRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/announcements', announcementRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
});