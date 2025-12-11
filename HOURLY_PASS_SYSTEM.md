# Hourly Pass Booking System

## Overview

The Hourly Pass Booking System allows tourists to book time-slot based passes for passing through specific checkpoints. This helps regulate traffic flow and manage checkpoint access efficiently.

## Features

### For Users (Tourists)
- ✅ View all available checkpoints
- ✅ Book hourly passes for specific time slots
- ✅ View available time slots for each checkpoint
- ✅ Generate QR codes for booked passes
- ✅ View all their passes
- ✅ Cancel passes (if not used or expired)
- ✅ Pass validity automatically checked based on time slot

### For Admins
- ✅ Issue passes directly to users
- ✅ View all passes with filters
- ✅ Monitor checkpoint usage

## System Architecture

### Backend Components

1. **Checkpoint Model** (`backend/models/Checkpoint.model.js`)
   - Stores checkpoint information
   - Configures time slot duration
   - Sets operating hours
   - Defines maximum passes per slot
   - Sets pricing (can be free)

2. **CheckpointPass Model** (`backend/models/CheckpointPass.model.js`)
   - Stores pass bookings
   - Contains QR code data
   - Tracks pass status (confirmed, used, expired, cancelled)
   - Validates pass based on time slot
   - Records verification details

3. **Checkpoint Routes** (`backend/routes/checkpoint.routes.js`)
   - `GET /api/checkpoints` - Get all checkpoints
   - `GET /api/checkpoints/:checkpointId/available-slots` - Get available time slots
   - `POST /api/checkpoints/:checkpointId/book` - Book a pass (User)
   - `POST /api/checkpoints/:checkpointId/issue` - Issue a pass (Admin)
   - `GET /api/checkpoints/my-passes` - Get user's passes
   - `GET /api/checkpoints/admin/all-passes` - Get all passes (Admin)
   - `POST /api/checkpoints/cancel/:passId` - Cancel a pass

### Frontend Components

1. **HourlyPass Page** (`src/pages/HourlyPass.tsx`)
   - User interface for booking passes
   - View available time slots
   - Manage user's passes
   - Display QR codes

## How It Works

### Booking Flow

1. **User selects a checkpoint**
   - System displays checkpoint details
   - Shows operating hours and slot duration

2. **User selects a date**
   - System fetches available time slots for that date
   - Each slot shows availability (X of Y available)

3. **User selects a time slot**
   - Opens booking dialog
   - User enters vehicle number (optional)
   - User enters number of people
   - System calculates amount (if not free)

4. **Booking confirmation**
   - System generates unique Pass ID
   - Creates QR code with pass information
   - QR code contains:
     - Pass ID
     - Checkpoint information
     - User information
     - Time slot
     - Vehicle number (if provided)

5. **Pass management**
   - User can view all their passes
   - User can view QR code for each pass
   - User can cancel passes (if not used/expired)
   - Passes automatically expire after time slot ends

## Pass Validity

- **Valid**: Current time is within the booked time slot AND status is "confirmed"
- **Expired**: Current time is after the time slot end
- **Not Yet Valid**: Current time is before the time slot start
- **Cancelled**: User cancelled the pass

## Time Slot Management

- Each checkpoint has a configurable slot duration (default: 60 minutes)
- Operating hours define when checkpoints are open
- Maximum passes per slot prevent overcrowding
- System automatically calculates available slots based on existing bookings
- Past time slots are not shown to users

## QR Code Structure

The QR code contains JSON data with:
```json
{
  "passId": "PASS-1234567890-1234",
  "checkpointId": "checkpoint_id",
  "checkpointName": "Badrinath Checkpoint",
  "userId": "user_id",
  "userName": "User Name",
  "timeSlot": {
    "start": "2024-01-01T10:00:00.000Z",
    "end": "2024-01-01T11:00:00.000Z"
  },
  "vehicleNumber": "UK-05-AB-1234",
  "numberOfPeople": 2
}
```

## Setup Instructions

### 1. Backend Setup

1. **Seed checkpoints** (if not already done):
   ```bash
   cd backend
   node scripts/seed.js
   ```

2. **Start backend server**:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start frontend**:
   ```bash
   npm run dev
   ```

### 3. Accessing the System

- **User Booking**: Navigate to `/hourly-pass` (requires user login)

## API Endpoints

### Public Endpoints
- `GET /api/checkpoints` - Get all checkpoints
- `GET /api/checkpoints/:checkpointId/available-slots` - Get available slots

### User Endpoints (Requires Authentication)
- `POST /api/checkpoints/:checkpointId/book` - Book a pass
- `GET /api/checkpoints/my-passes` - Get user's passes
- `POST /api/checkpoints/cancel/:passId` - Cancel a pass

### Admin Endpoints (Requires Admin Role)
- `POST /api/checkpoints/:checkpointId/issue` - Issue a pass
- `GET /api/checkpoints/admin/all-passes` - Get all passes

## Database Models

### Checkpoint Schema
```javascript
{
  name: String,
  location: String,
  coordinates: { lat: Number, lng: Number },
  description: String,
  slotDuration: Number, // in minutes
  operatingHours: { start: String, end: String },
  maxPassesPerSlot: Number,
  pricePerHour: Number,
  isActive: Boolean
}
```

### CheckpointPass Schema
```javascript
{
  user: ObjectId (ref: User),
  checkpoint: ObjectId (ref: Checkpoint),
  timeSlot: { start: Date, end: Date },
  vehicleNumber: String (optional),
  numberOfPeople: Number,
  qrCode: String,
  passId: String (unique),
  status: String (enum: ['pending', 'confirmed', 'used', 'expired', 'cancelled']),
  verifiedAt: Date,
  verifiedBy: ObjectId (ref: User),
  amount: Number,
  paymentStatus: String,
  issuedBy: ObjectId (ref: User)
}
```

## Future Enhancements

1. **QR Code Scanner Integration**
   - Add camera-based QR code scanning
   - Use libraries like `html5-qrcode` or `react-qr-reader`

2. **Real-time Updates**
   - WebSocket support for real-time slot availability
   - Push notifications for pass reminders

3. **Mobile App**
   - Native mobile app for easier QR code scanning
   - Offline pass storage

4. **Advanced Analytics**
   - Checkpoint usage statistics
   - Peak time analysis
   - Traffic flow patterns

5. **Payment Integration**
   - Integrate payment gateway for paid passes
   - Support for multiple payment methods

6. **SMS/Email Notifications**
   - Send pass confirmation via SMS/Email
   - Reminder notifications before time slot

7. **Group Passes**
   - Allow group instructors to book passes for group members
   - Bulk pass issuance

## Troubleshooting

### Pass not showing as available
- Check if checkpoint is active
- Verify operating hours
- Check if maximum passes per slot is reached
- Ensure date is not in the past

### Time slot not available
- Check operating hours
- Verify date is correct
- Check if all slots are booked
- Try a different date or time

## Security Considerations

1. **QR Code Security**
   - QR codes contain encrypted/encoded data
   - Pass IDs are unique and non-guessable
   - Server-side validation prevents tampering

2. **Time Validation**
   - All time validations are server-side
   - Client-side time is not trusted
   - Time slots are validated during booking

3. **Access Control**
   - User endpoints require authentication
   - Admin endpoints require admin role

4. **Data Privacy**
   - Pass history is only accessible to pass owner and admins

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API error messages
3. Check browser console for frontend errors
4. Check backend logs for server errors

---

**Last Updated**: 2024-01-01
**Version**: 1.0.0

