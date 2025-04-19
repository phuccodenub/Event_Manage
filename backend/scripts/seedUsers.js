const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');

// Load environment variables
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the .env file');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Generate 100 users
const generateUsers = () => {
  const users = [];
  for (let i = 1; i <= 100; i++) {
    users.push({
      username: `user${i}`,
      email: `user${i}@example.com`,
      password: 'password123',
      fullName: `User ${i}`,
      userId: `22806018${i.toString().padStart(2, '0')}`,
      class: `22DTHE${i % 5 + 1}`,
      gender: i % 2 === 0 ? 'nam' : 'nữ',
      phone: `03526416${i.toString().padStart(2, '0')}`,
    });
  }
  return users;
};

// Seed users into the database
const seedUsers = async () => {
  try {
    await connectDB();
    const users = generateUsers();
    await User.insertMany(users);
    console.log('100 users have been added to the database');
    process.exit();
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
