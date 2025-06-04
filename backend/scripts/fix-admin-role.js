const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import User model
const User = require('../models/userModel');

const fixAdminRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find users that should be admin
    const adminEmails = [
      'nguyenchidi.dev@gmail.com',
      'lala@gmail.com',
      'admin@hutech.edu.vn'
    ];

    console.log('🔧 Updating admin roles...');

    for (const email of adminEmails) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        const wasUpdated = user.role !== 'admin';
        user.role = 'admin';
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });
        
        console.log(`✅ ${wasUpdated ? 'Updated' : 'Confirmed'} admin role for: ${email}`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

    // List all admin users
    const admins = await User.find({ role: 'admin' }).select('email fullName role');
    console.log('\n👑 Current admin users:');
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.fullName})`);
    });

    console.log(`\n📊 Total admin users: ${admins.length}`);

  } catch (error) {
    console.error('❌ Fix admin roles failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Run fix
fixAdminRoles(); 