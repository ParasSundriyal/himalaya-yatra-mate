# Group Bookings System - How It Works

## Current System (View-Only)

### 1. **Individual Member Bookings**
   - Each group member (user) can make their own bookings through their personal dashboard
   - Bookings are created for:
     - **Hotels**: Room bookings with check-in/check-out dates
     - **Taxis**: Taxi rides with pickup/dropoff locations
     - **Parking**: Parking slot reservations with vehicle details
   - Each booking is linked to the member's user account (`user: member._id`)

### 2. **Group Instructor View**
   - Group instructors can **VIEW** all bookings made by their group members
   - They can see:
     - Booking details (type, dates, amounts)
     - Member information (who made the booking)
     - Booking status (pending, confirmed, cancelled, completed)
     - Payment status
   - Filter bookings by:
     - Type (hotel, taxi, parking)
     - Status (pending, confirmed, cancelled, completed)

### 3. **Current Limitations**
   - Instructors **CANNOT** make bookings on behalf of members
   - Members must log in individually to make their own bookings
   - No centralized booking management for groups

---

## Proposed Enhancement: Instructor Booking for Members

### Feature: "Book for Member"
Allow group instructors to make bookings on behalf of their group members.

### How It Would Work:

#### 1. **Backend Changes**
   - Modify booking endpoints to accept an optional `memberId` parameter
   - When `memberId` is provided and user is a group instructor:
     - Verify the member belongs to the instructor's group
     - Create booking with `user: memberId` (instead of `req.user._id`)
     - Link booking to the member's account

#### 2. **Frontend Changes**
   - Add "Book for Member" button in Group Portal
   - Show dialog to:
     - Select a member from the group
     - Choose booking type (hotel, taxi, parking)
     - Fill in booking details
   - Display bookings made by instructor vs. self-bookings

#### 3. **Use Cases**
   - **Bulk Hotel Bookings**: Instructor books multiple rooms for the entire group
   - **Group Transportation**: Instructor books taxis for group members
   - **Coordinated Parking**: Instructor reserves parking slots for group vehicles
   - **Centralized Management**: Easier coordination for group travel

---

## Current API Endpoints

### View Member Bookings
```
GET /api/groups/member-bookings
Query params: ?type=hotel&status=confirmed
Returns: All bookings made by group members
```

### Individual Booking Endpoints (Members Only)
```
POST /api/hotels/book
POST /api/taxis/book
POST /api/parking/book
Creates booking for: req.user._id (logged-in user)
```

---

## Data Flow

### Current Flow:
```
Member → Login → Dashboard → Book Hotel/Taxi/Parking → Booking Created → Linked to Member
                                                                    ↓
Instructor → Group Portal → View All Member Bookings ← Bookings Linked to Members
```

### Enhanced Flow (Proposed):
```
Instructor → Group Portal → Select Member → Book for Member → Booking Created → Linked to Selected Member
                                                                        ↓
Member → Dashboard → View Their Bookings (including instructor-made bookings)
```

---

## Implementation Status

- ✅ **View Member Bookings**: Implemented
- ✅ **Filter Bookings**: Implemented
- ✅ **Booking Details Display**: Implemented
- ✅ **Book for Member (Hotels)**: Implemented
- ✅ **Book for Member (Taxis)**: Implemented
- ✅ **Book for Member (Parking)**: Implemented
- ✅ **Booking UI in Group Portal**: Implemented
- ⏳ **Bulk Bookings**: Not yet implemented
- ⏳ **Group Booking Discounts**: Not yet implemented

---

## How Group Bookings Work (Current Implementation)

### 1. **Viewing Member Bookings**
   - Instructors can view all bookings made by their group members
   - Access via: `GET /api/groups/member-bookings`
   - Can filter by type and status
   - Shows booking details, member info, and payment status

### 2. **Booking for Members (Hotels, Taxis, Parking)**
   - Instructors can now book hotels, taxis, and parking on behalf of their group members
   - API Endpoints:
     - `POST /api/hotels/book` (with `memberId`)
     - `POST /api/taxis/book` (with `memberId`)
     - `POST /api/parking/book` (with `memberId`)
   - Include `memberId` parameter when booking for a member
   - Backend validates:
     - User is a group instructor
     - Member belongs to instructor's group
     - Booking is created and linked to the member's account
   - UI: Booking dialogs in Group Portal with member selection

### 3. **Booking Flow**

#### For Individual Members:
```
Member → Login → Dashboard → Book Hotel → Booking Created → Linked to Member
```

#### For Group Instructors (Booking for Members):
```
Instructor → Group Portal → Select Member → Book Hotel (with memberId) 
→ Backend Validates → Booking Created → Linked to Selected Member
```

### 4. **API Usage Example**

#### Booking for Self (Member):
```javascript
POST /api/hotels/book
{
  "hotelId": "hotel123",
  "checkIn": "2024-06-01",
  "checkOut": "2024-06-05",
  "guests": 2,
  "rooms": 1
}
```

#### Booking for Member (Instructor):
```javascript
POST /api/hotels/book
{
  "hotelId": "hotel123",
  "checkIn": "2024-06-01",
  "checkOut": "2024-06-05",
  "guests": 2,
  "rooms": 1,
  "memberId": "member456"  // Optional: for group instructors
}
```

### 5. **Security Features**
   - ✅ Role-based authorization (only group instructors can use `memberId`)
   - ✅ Group membership validation (member must belong to instructor's group)
   - ✅ Booking ownership (bookings remain linked to member, not instructor)
   - ✅ Error handling for unauthorized access

### 6. **Future Enhancements**
   - Add similar functionality for taxi and parking bookings
   - Bulk booking interface in Group Portal
   - Group booking discounts
   - Booking templates for common group travel patterns
   - Export booking reports

---

## Security Considerations

1. **Authorization**: Verify instructor has permission to book for specific member
2. **Group Membership**: Ensure member belongs to instructor's group
3. **Booking Ownership**: Bookings remain linked to member, not instructor
4. **Audit Trail**: Track who made the booking (instructor vs. member)

