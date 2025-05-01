const express = require('express');
const app = express();
const cron = require('node-cron');
const Event = require('./models/eventModel');

// Add your express configurations here if needed

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store socket connections
const userSockets = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSockets.set(userId, socket);
  }

  socket.on('disconnect', () => {
    if (userId) {
      userSockets.delete(userId);
    }
  });
});

// Export để sử dụng trong các controller
module.exports.notifyUser = (userId, notification) => {
  const userSocket = userSockets.get(userId);
  if (userSocket) {
    userSocket.emit('newNotification', notification);
  }
};

// Add cron job to update event status every minute
cron.schedule('* * * * *', async () => {
  try {
    await Event.updateEventStatus();
    console.log('Event statuses updated successfully');
  } catch (error) {
    console.error('Error updating event statuses:', error);
  }
});

module.exports = app;