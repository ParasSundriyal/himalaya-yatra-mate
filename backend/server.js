import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import parkingRoutes from './routes/parking.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import taxiRoutes from './routes/taxi.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import groupRoutes from './routes/group.routes.js';
import aiDetectionRoutes from './routes/aiDetection.routes.js';
import adminRoutes from './routes/admin.routes.js';
import checkpointRoutes from './routes/checkpoint.routes.js';
import hourlyPassRoutes from './routes/hourlyPass.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing with increased limits for uploads (e.g., profile photos as base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra';

if (!process.env.MONGODB_URI) {
  console.warn('⚠️  Warning: MONGODB_URI not set in environment variables');
  console.warn('   Using default: mongodb://localhost:27017/himalaya-yatra');
  console.warn('   Please set MONGODB_URI in .env file for MongoDB Atlas connection');
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:');
    console.error('   Error:', err.message);
    if (err.message.includes('authentication failed')) {
      console.error('   💡 Tip: Check your username and password in MONGODB_URI');
      console.error('   💡 Tip: Make sure to URL encode special characters in password');
    } else if (err.message.includes('IP')) {
      console.error('   💡 Tip: Add your IP address to Network Access in MongoDB Atlas');
    }
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Himalaya Yatra Mate API', 
    version: '1.0.0',
    status: 'running' 
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/taxis', taxiRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai-detection', aiDetectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/hourly-passes', hourlyPassRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
