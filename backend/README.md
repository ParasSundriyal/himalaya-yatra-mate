# Himalaya Yatra Mate - Backend API

Backend API for the Char Dham Yatra Tourism Platform built with Node.js, Express, and MongoDB.

## Features

- ✅ User Authentication & Authorization (JWT)
- ✅ Role-based Access Control (User, Group Instructor, Admin)
- ✅ Parking Slot Booking System
- ✅ Hotel Booking Management
- ✅ Taxi Booking System
- ✅ Group Management (for tour instructors)
- ✅ AI Vehicle Detection Logging
- ✅ Admin Dashboard APIs
- ✅ QR Code Generation for Parking
- ✅ Booking Management & Cancellation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **QR Codes**: qrcode

## Project Structure

```
backend/
├── models/           # MongoDB models
│   ├── User.model.js
│   ├── Parking.model.js
│   ├── Hotel.model.js
│   ├── Taxi.model.js
│   ├── Booking.model.js
│   ├── Group.model.js
│   └── AIDetection.model.js
├── routes/           # API routes
│   ├── auth.routes.js
│   ├── parking.routes.js
│   ├── hotel.routes.js
│   ├── taxi.routes.js
│   ├── booking.routes.js
│   ├── group.routes.js
│   ├── aiDetection.routes.js
│   └── admin.routes.js
├── middleware/       # Custom middleware
│   └── auth.middleware.js
├── utils/            # Utility functions
│   └── generateToken.js
├── scripts/          # Database scripts
│   └── seed.js
├── server.js         # Main server file
└── package.json
```

## Installation

1. **Navigate to backend directory**:
   ```bash
   cd himalaya-yatra-mate/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/himalaya-yatra
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

5. **Make sure MongoDB is running**:
   - Local MongoDB: `mongod`
   - Or use MongoDB Atlas (cloud)

6. **Seed the database** (optional but recommended):
   ```bash
   node scripts/seed.js
   ```

7. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Parking
- `GET /api/parking/areas` - Get all parking areas
- `GET /api/parking/areas/:areaId/slots` - Get slots for an area
- `POST /api/parking/book` - Book a parking slot
- `GET /api/parking/my-bookings` - Get user's parking bookings
- `POST /api/parking/cancel/:bookingId` - Cancel parking booking

### Hotels
- `GET /api/hotels` - Get all hotels (with filters)
- `GET /api/hotels/:id` - Get single hotel
- `POST /api/hotels/book` - Book a hotel
- `GET /api/hotels/my-bookings` - Get user's hotel bookings
- `POST /api/hotels/cancel/:bookingId` - Cancel hotel booking

### Taxis
- `GET /api/taxis` - Get all available taxis
- `GET /api/taxis/:id` - Get single taxi
- `POST /api/taxis/book` - Book a taxi
- `GET /api/taxis/my-bookings` - Get user's taxi bookings
- `POST /api/taxis/cancel/:bookingId` - Cancel taxi booking

### Bookings
- `GET /api/bookings` - Get all user's bookings
- `GET /api/bookings/:id` - Get single booking

### Groups
- `POST /api/groups` - Create a group (Group Instructor)
- `GET /api/groups/my-group` - Get instructor's group
- `POST /api/groups/add-member` - Add member to group
- `DELETE /api/groups/remove-member/:memberId` - Remove member from group

### AI Detection
- `POST /api/ai-detection/log` - Log a vehicle detection
- `GET /api/ai-detection` - Get detection logs
- `GET /api/ai-detection/stats` - Get detection statistics
- `PUT /api/ai-detection/:id/process` - Update detection status

### Admin
- `GET /api/admin/stats` - Get admin dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/activities` - Get recent activities

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Test Credentials

After running the seed script, you can use these test accounts:

- **Admin**: `admin@chardham.com` / `admin123`
- **Group Instructor**: `instructor@chardham.com` / `instructor123`
- **User**: `user@chardham.com` / `user123`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/himalaya-yatra |
| `JWT_SECRET` | Secret key for JWT tokens | (required) |
| `JWT_EXPIRE` | JWT token expiration | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `NODE_ENV` | Environment (development/production) | development |

## Error Handling

The API returns errors in the following format:

```json
{
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses `nodemon` for auto-reloading on file changes.

### Database Seeding

To populate the database with sample data:

```bash
node scripts/seed.js
```

This will create:
- Admin, Group Instructor, and Test User accounts
- 4 Parking Areas with slots
- 4 Hotels
- 4 Taxis

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or a managed MongoDB service
4. Set up proper CORS for your frontend domain
5. Use environment variables for all sensitive data
6. Enable HTTPS
7. Set up logging and monitoring

## Next Steps

- [ ] Add payment gateway integration (Razorpay/Stripe)
- [ ] Add email notifications
- [ ] Add file upload for AI detection images
- [ ] Add real-time updates with WebSockets
- [ ] Add rate limiting
- [ ] Add API documentation with Swagger
- [ ] Add unit and integration tests

## Support

For issues or questions, please create an issue in the repository.

## License

ISC
