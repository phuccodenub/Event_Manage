const express = require('express');
const cron = require('node-cron');
const Event = require('./models/eventModel');

const app = express();

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