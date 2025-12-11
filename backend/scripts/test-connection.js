import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log('📍 Connection string:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Database name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Test a simple query
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users in database: ${userCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Tip: Check your username and password in the connection string');
      console.error('   Make sure to URL encode special characters in password');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Tip: Add your IP address to Network Access in MongoDB Atlas');
      console.error('   Or use "Allow Access from Anywhere" for development');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Tip: Check your internet connection and cluster status');
    }
    
    process.exit(1);
  }
};

testConnection();
