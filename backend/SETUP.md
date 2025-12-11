# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string
   - `FRONTEND_URL` - Your frontend URL (default: http://localhost:5173)

3. **Start MongoDB**
   - Local: Make sure MongoDB is running (`mongod`)
   - Cloud: Use MongoDB Atlas connection string

4. **Seed Database** (Optional but Recommended)
   ```bash
   node scripts/seed.js
   ```
   
   This creates:
   - Admin user: `admin@chardham.com` / `admin123`
   - Group instructor: `instructor@chardham.com` / `instructor123`
   - Test user: `user@chardham.com` / `user123`
   - Sample parking areas, hotels, and taxis

5. **Start Server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

6. **Test the API**
   ```bash
   curl http://localhost:5000/
   ```

## API Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chardham.com",
    "password": "admin123"
  }'
```

### Test with Authentication
```bash
# Replace YOUR_TOKEN with the token from login response
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check the connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

### CORS Issues
- Make sure `FRONTEND_URL` in `.env` matches your frontend URL
- Check that the frontend is making requests to the correct API URL

## Next Steps

1. Update the React app's `.env` file with `VITE_API_URL=http://localhost:5000/api`
2. Test the authentication flow in the React app
3. Connect all frontend pages to the backend APIs
4. Add payment gateway integration
5. Deploy to production
