# CORS Fix - Frontend on Port 8080

## Issue
Frontend is running on `http://localhost:8080` but backend CORS was configured for `http://localhost:5173` only.

## Solution
Updated backend CORS configuration to allow multiple origins including port 8080.

## What Changed
- Updated `server.js` to allow multiple frontend origins
- Added support for ports: 5173, 8080, 3000
- In development mode, all localhost origins are allowed

## Steps to Fix

### 1. Restart Backend Server
The backend server needs to be restarted for the CORS changes to take effect.

**Stop the current server** (Ctrl+C if running in terminal)

**Then restart:**
```bash
cd himalaya-yatra-mate/backend
npm run dev
```

### 2. Verify CORS Configuration
You should see the server start with:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 3. Test Login
- Go to: http://localhost:8080/login
- Try logging in with: `user@chardham.com` / `user123`
- Should work without CORS errors

## Allowed Origins (Development)
- http://localhost:5173
- http://localhost:8080
- http://localhost:3000
- http://127.0.0.1:5173
- http://127.0.0.1:8080
- http://127.0.0.1:3000
- Any origin in development mode (for flexibility)

## If Still Getting CORS Errors

1. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser cache

2. **Check backend is running:**
   - Visit: http://localhost:5000/
   - Should see: `{"message":"Himalaya Yatra Mate API","version":"1.0.0","status":"running"}`

3. **Verify frontend URL:**
   - Make sure frontend is running on http://localhost:8080
   - Check browser console for actual origin

4. **Check .env file:**
   - Make sure FRONTEND_URL includes port 8080 (optional, as it's now auto-allowed)

## Production Notes
In production, you'll want to:
- Set specific allowed origins only
- Remove the "allow all in development" fallback
- Use environment variables for allowed origins
