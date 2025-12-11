import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const resetAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra');
    console.log('✅ Connected to MongoDB\n');

    // Admin credentials
    const adminEmail = 'admin@chardham.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    const adminPhone = '9876543210';

    // Check if admin exists and delete it to recreate with correct password
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      await User.deleteOne({ email: adminEmail });
      console.log('✅ Removed existing admin user');
    }

    // Create admin with plain password - pre-save hook will hash it
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Plain password - will be hashed by pre-save hook
      phone: adminPhone,
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    await admin.save();
    console.log('✅ Created admin user with correct password');
    
    // Refresh admin from database to verify
    const savedAdmin = await User.findOne({ email: adminEmail });

    // Verify password
    const isValid = await savedAdmin.comparePassword(adminPassword);
    console.log(`✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    console.log('\n📝 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log(`   Active: ${savedAdmin.isActive}`);
    console.log('\n🎉 Admin credentials reset successfully!');
    console.log('\n💡 You can now login to the admin panel with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();
