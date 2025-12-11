# Backend Integration Guide

## 🎉 Backend Created Successfully!

I've created a complete backend for your Himalaya Yatra Mate application. Here's what has been built:

## ✅ What's Been Created

### Backend Structure
- ✅ Complete Express.js backend with MongoDB
- ✅ 7 Database Models (User, Parking, Hotel, Taxi, Booking, Group, AIDetection)
- ✅ 8 API Route Modules (auth, parking, hotels, taxis, bookings, groups, aiDetection, admin)
- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control (User, Group Instructor, Admin)
- ✅ Database Seeding Script
- ✅ API Service Utility for React App
- ✅ Updated AuthContext to use Backend API

### Features Implemented
1. **Authentication System**
   - User registration
   - User login with JWT tokens
   - Profile management
   - Token-based authentication

2. **Parking Management**
   - Get parking areas
   - Get available slots
   - Book parking slots
   - QR code generation
   - Booking cancellation

3. **Hotel Management**
   - List hotels with filters
   - Hotel booking
   - Booking management
   - Cancellation

4. **Taxi Management**
   - List available taxis
   - Taxi booking
   - Booking management
   - Cancellation

5. **Group Management**
   - Create groups (for instructors)
   - Add/remove members
   - Member management

6. **AI Detection**
   - Log vehicle detections
   - Get detection statistics
   - View detection logs

7. **Admin Dashboard**
   - System statistics
   - User management
   - Booking management
   - Activity logs

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd himalaya-yatra-mate/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
node scripts/seed.js  # Seed database with test data
npm run dev  # Start development server
```

### 2. Setup Frontend

```bash
cd himalaya-yatra-mate
# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_WEATHER_API_KEY=your_openweathermap_api_key_here" >> .env
npm install  # If not already done
npm run dev  # Start frontend
```

**Note:** For weather functionality, you need to get a free API key from [OpenWeatherMap](https://openweathermap.org/api) and add it to your `.env` file as `VITE_WEATHER_API_KEY`. The weather data for all 4 Char Dhams will be automatically displayed to all users once configured.

### 3. Test Credentials

After seeding:
- **Admin**: `admin@chardham.com` / `admin123`
- **Group Instructor**: `instructor@chardham.com` / `instructor123`
- **User**: `user@chardham.com` / `user123`

## 📝 Next Steps

### Immediate Tasks

1. **Update Login Component** ✅ (Already updated to handle async)
   - The Login component now handles async API calls properly

2. **Connect Dashboard to Backend**
   - Update `Dashboard.tsx` to fetch hotels, taxis from API
   - Connect parking booking to backend
   - Integrate real weather data (already using OpenWeatherMap API)

3. **Connect Parking Page**
   - Fetch parking areas from API
   - Display real slots
   - Implement booking functionality

4. **Connect Admin Dashboard**
   - Fetch real statistics from API
   - Connect user management
   - Show real booking data

5. **Connect Group Portal**
   - Connect group creation to API
   - Connect member management
   - Fetch real group data

### Integration Examples

#### Fetching Hotels in Dashboard
```typescript
import api from '@/services/api';

const [hotels, setHotels] = useState([]);

useEffect(() => {
  const fetchHotels = async () => {
    try {
      const response = await api.hotels.getAll({ location: 'Badrinath' });
      setHotels(response.hotels);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };
  fetchHotels();
}, []);
```

#### Booking a Parking Slot
```typescript
import api from '@/services/api';

const handleBookParking = async () => {
  try {
    const response = await api.parking.bookSlot({
      areaId: 'parking-area-id',
      slotId: 'slot-id',
      vehicleNumber: 'UK-05-AB-1234',
      entryTime: new Date().toISOString(),
      exitTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Show QR code
    setQrCode(response.booking.qrCode);
    toast({ title: 'Parking booked successfully!' });
  } catch (error) {
    toast({ title: 'Booking failed', variant: 'destructive' });
  }
};
```

## 📚 API Documentation

All API endpoints are documented in `backend/README.md`. The API service utility (`src/services/api.ts`) provides TypeScript-typed functions for all endpoints.

## 🔧 Configuration

### Backend Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default: 5000)

### Frontend Environment Variables
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)
- `VITE_WEATHER_API_KEY` - OpenWeatherMap API key for weather data (required for weather widget)
  - Get a free API key from: https://openweathermap.org/api
  - The weather widget automatically displays weather for all 4 Char Dhams (Badrinath, Kedarnath, Gangotri, Yamunotri) to all users

## 🐛 Troubleshooting

### CORS Issues
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that the frontend is making requests to the correct API URL

### Authentication Issues
- Verify JWT token is being stored in localStorage
- Check that token is included in Authorization header
- Ensure backend JWT_SECRET is set

### MongoDB Connection
- Make sure MongoDB is running
- Check connection string in `.env`
- For MongoDB Atlas, ensure IP is whitelisted

## 📦 What's Next?

1. **Payment Integration**
   - Add Razorpay/Stripe integration
   - Update booking APIs to handle payments

2. **Email Notifications**
   - Send booking confirmations
   - Send cancellation emails

3. **File Uploads**
   - Add image upload for AI detection
   - Store images in cloud storage

4. **Real-time Updates**
   - Add WebSocket support
   - Real-time parking slot updates
   - Live AI detection feed

5. **Testing**
   - Add unit tests
   - Add integration tests
   - Add E2E tests

## 🎯 Current Status

- ✅ Backend API Complete
- ✅ Database Models Created
- ✅ Authentication System Ready
- ✅ API Service Utility Created
- ✅ AuthContext Updated
- ⏳ Frontend Pages Need Integration
- ⏳ Payment Gateway Integration Needed
- ⏳ Email Notifications Needed

## 💡 Tips

1. Always check the browser console for API errors
2. Use the Network tab to debug API calls
3. Test API endpoints using Postman or curl
4. Check backend logs for server-side errors
5. Verify MongoDB connection before starting server

## 📞 Support

If you encounter any issues:
1. Check the backend logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB connection
5. Review error messages in browser console

Happy coding! 🚀
