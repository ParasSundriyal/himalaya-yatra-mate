import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
// 1. Import Swagger libraries
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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
import chatbotRoutes from './routes/chatbot.routes.js';
import passesRoutes from './routes/passes.routes.js';
import registrationRoutes from './routes/registration.routes.js';
import itineraryRoutes from './routes/itinerary.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import locationRoutes from './routes/location.routes.js';
import crowdRoutes from './routes/crowd.routes.js';
import mapsRoutes from './routes/maps.js';
import { bootstrapFirebaseAdmin } from './services/firebaseAdmin.js';
import { scheduleScraperCron } from './services/scraperService.js';
import {
  scheduleCrowdBlendCron,
  updateCrowdFirestore,
} from './services/crowdBlender.js';

dotenv.config();
bootstrapFirebaseAdmin();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. Swagger Configuration ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Himalaya Yatra Mate API',
      version: '1.0.0',
      description: 'API Documentation for the Himalaya Yatra Mate platform',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
        url: 'https://himalaya-yatra-mate-etw5.vercel.app/',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
      },
    },
  },
  // Path to the API docs (it will look inside your routes folder for JSDoc comments)
  apis: ['./routes/*.js'],
  failOnErrors: false,
};

const enableSwaggerDocs = process.env.ENABLE_SWAGGER_DOCS === 'true';
let swaggerSpec = null;
if (enableSwaggerDocs) {
  try {
    swaggerSpec = swaggerJsdoc(swaggerOptions);
  } catch (e) {
    console.error('⚠️ Swagger generation failed. Continuing without /api-docs:', e.message);
  }
}
// --------------------------------

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
  'http://192.168.29.85:5000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 3. Serve Swagger UI (optional) ---
if (swaggerSpec) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/himalaya-yatra';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      const llmProvider = process.env.LLM_PROVIDER || 'groq';
      const llmModel = process.env.LLM_MODEL || '(provider default)';
      const llmReady = process.env.LLM_API_KEY ? 'yes' : 'NO — set LLM_API_KEY';
      console.log(`🤖 Chatbot LLM: ${llmProvider} / ${llmModel} (key: ${llmReady})`);
      if (swaggerSpec) {
        console.log(`📖 API Docs available at http://localhost:${PORT}/api-docs`);
      } else if (enableSwaggerDocs) {
        console.log('⚠️ API Docs disabled due to Swagger parse errors.');
      } else {
        console.log('ℹ️ Swagger docs disabled (set ENABLE_SWAGGER_DOCS=true to enable).');
      }
      
      scheduleScraperCron();
      scheduleCrowdBlendCron();
      updateCrowdFirestore().catch((e) => console.error(e.message));
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Himalaya Yatra Mate API', version: '1.0.0', status: 'running' });
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
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/passes', passesRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/maps', mapsRoutes);

// Error handling
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});