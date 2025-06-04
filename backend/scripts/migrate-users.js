const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import User model
const User = require('../models/userModel');

const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;

    for (const user of users) {
      let hasUpdate = false;
      const updates = {};

      // Set default security fields for existing users
      if (user.isEmailVerified === undefined || user.isEmailVerified === null) {
        updates.isEmailVerified = true; // Existing users should be verified
        hasUpdate = true;
      }

      if (user.loginAttempts === undefined || user.loginAttempts === null) {
        updates.loginAttempts = 0;
        hasUpdate = true;
      }

      if (user.mustChangePassword === undefined || user.mustChangePassword === null) {
        updates.mustChangePassword = false;
        hasUpdate = true;
      }

      if (user.passwordHistory === undefined || user.passwordHistory === null) {
        updates.passwordHistory = [];
        hasUpdate = true;
      }

      if (user.lastPasswordChange === undefined || user.lastPasswordChange === null) {
        updates.lastPasswordChange = new Date();
        hasUpdate = true;
      }

      // Update OAuth provider info if missing
      if (!user.oauthProvider) {
        if (user.username && user.username.startsWith('google_')) {
          updates.oauthProvider = 'google';
          updates.oauthId = user.username.replace('google_', '');
        } else if (user.username && user.username.startsWith('facebook_')) {
          updates.oauthProvider = 'facebook';
          updates.oauthId = user.username.replace('facebook_', '');
        } else {
          updates.oauthProvider = 'local';
        }
        hasUpdate = true;
      }

      // Set password for OAuth users to allow admin access
      if ((user.oauthProvider === 'google' || user.oauthProvider === 'facebook' || !user.password) && user.role === 'admin') {
        const tempPassword = '12345678'; // Temporary password for admin OAuth users
        const salt = await bcrypt.genSalt(12);
        updates.password = await bcrypt.hash(tempPassword, salt);
        updates.mustChangePassword = true; // Force password change
        console.log(`🔑 Set temporary password for admin: ${user.email} - password: ${tempPassword}`);
        hasUpdate = true;
      }

      if (hasUpdate) {
        await User.findByIdAndUpdate(user._id, updates, { 
          validateBeforeSave: false,
          runValidators: false 
        });
        updatedCount++;
        console.log(`✅ Updated user: ${user.email || user.username}`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} users`);

    // Create a new admin user if none exists
    const adminExists = await User.findOne({ role: 'admin', oauthProvider: 'local' });
    
    if (!adminExists) {
      console.log('🔧 Creating new local admin user...');
      
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@hutech.edu.vn',
        password: 'Admin@123456', // Strong default password
        fullName: 'System Administrator',
        phone: '0000000000',
        gender: 'khác',
        role: 'admin',
        oauthProvider: 'local',
        isEmailVerified: true,
        mustChangePassword: false,
        loginAttempts: 0,
        passwordHistory: [],
        lastPasswordChange: new Date()
      });

      console.log('✅ Created new admin user:');
      console.log('   Username: admin');
      console.log('   Email: admin@hutech.edu.vn');
      console.log('   Password: Admin@123456');
      console.log('   ⚠️  Please change this password after first login!');
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated users: ${updatedCount}`);
    console.log(`   Admin users available: ${await User.countDocuments({ role: 'admin' })}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Run migration
migrateUsers(); 