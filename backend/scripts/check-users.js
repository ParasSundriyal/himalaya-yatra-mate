import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra');
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}).select('name email role phone isActive');
    
    console.log(`📊 Found ${users.length} users in database:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('');
    });

    // Test password verification for each user
    console.log('🧪 Testing password verification:\n');
    for (const user of users) {
      const fullUser = await User.findOne({ email: user.email });
      if (fullUser) {
        let testPassword = '';
        if (user.email === 'admin@chardham.com') {
          testPassword = 'admin123';
        } else if (user.email === 'instructor@chardham.com') {
          testPassword = 'instructor123';
        } else if (user.email === 'user@chardham.com') {
          testPassword = 'user123';
        } else {
          console.log(`   ⚠️  ${user.email}: Unknown test password`);
          continue;
        }
        
        const isValid = await fullUser.comparePassword(testPassword);
        console.log(`   ${user.email}: ${testPassword} → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUsers();
