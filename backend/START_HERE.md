# 🚀 MongoDB Atlas Setup - START HERE

## Quick Setup Guide

Follow these steps to set up MongoDB Atlas and get your backend running:

### Step 1: Get MongoDB Atlas Connection String (5 minutes)

1. **Go to MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
2. **Sign up/Login** to your account
3. **Create a FREE Cluster:**
   - Click "Create" or "Build a Database"
   - Select **FREE (M0)** tier
   - Choose provider and region (Mumbai recommended for India)
   - Click "Create Cluster"
   - Wait 3-5 minutes for creation

4. **Create Database User:**
   - Go to **"Database Access"** → **"Add New Database User"**
   - Username: `chardham_user` (or any name)
   - Password: Click "Autogenerate" or create your own
   - **⚠️ SAVE THE PASSWORD!**
   - Privileges: **Atlas admin**
   - Click "Add User"

5. **Allow Network Access:**
   - Go to **"Network Access"** → **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (for development)
   - Click "Confirm"

6. **Get Connection String:**
   - Go to **"Database"** → Click **"Connect"**
   - Select **"Connect your application"**
   - Driver: **Node.js**, Version: **5.5 or later**
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 2: Configure Backend (2 minutes)

1. **Create `.env` file:**
   ```bash
   cd himalaya-yatra-mate/backend
   # Copy the example file
   copy .env.example .env
   ```

2. **Edit `.env` file:**
   - Open `.env` in a text editor
   - Update `MONGODB_URI` with your connection string
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - **Important:** Change `?retryWrites=true&w=majority` to `/himalaya-yatra?retryWrites=true&w=majority`
   
   **Example:**
   ```env
   MONGODB_URI=mongodb+srv://chardham_user:MyPassword123@cluster0.abc123.mongodb.net/himalaya-yatra?retryWrites=true&w=majority
   JWT_SECRET=391b34c441aefeac6710daff08da472c70194eec38945fa261ba7465f7098c9b
   ```

   **If password has special characters, URL encode them:**
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`

3. **Save the file**

### Step 3: Install & Test (3 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test connection:**
   ```bash
   npm run test-connection
   ```
   
   Should see: `✅ MongoDB connected successfully!`

3. **Seed database:**
   ```bash
   npm run seed
   ```
   
   This creates test users, hotels, taxis, and parking areas.

4. **Start server:**
   ```bash
   npm run dev
   ```
   
   Should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database: himalaya-yatra
   🚀 Server running on port 5000
   ```

### Step 4: Test Login (1 minute)

1. **Start frontend** (in another terminal):
   ```bash
   cd ..  # Go back to project root
   npm run dev
   ```

2. **Open browser:**
   - Go to: http://localhost:5173/login

3. **Test login:**
   - **User:** `user@chardham.com` / `user123`
   - **Admin:** `admin@chardham.com` / `admin123`
   - **Instructor:** `instructor@chardham.com` / `instructor123`

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelisted
- [ ] Connection string obtained
- [ ] `.env` file created with connection string
- [ ] `npm install` completed
- [ ] Connection test passed
- [ ] Database seeded
- [ ] Backend server running
- [ ] Frontend running
- [ ] Login works!

## 🐛 Common Issues

### "Authentication failed"
- Check username/password in connection string
- URL encode special characters in password

### "IP not whitelisted"
- Add your IP to Network Access in MongoDB Atlas

### "Connection timeout"
- Check internet connection
- Verify cluster is running

## 📚 Need More Help?

- See `MONGODB_ATLAS_SETUP.md` for detailed guide
- See `SETUP_STEPS.md` for step-by-step instructions
- Check backend logs for error messages

## 🎉 You're Ready!

Once login works, you can:
- Create new user accounts via signup
- Book hotels and taxis
- View your bookings
- Explore the dashboard

---

**Generated JWT Secret:** `391b34c441aefeac6710daff08da472c70194eec38945fa261ba7465f7098c9b`

Use this in your `.env` file as `JWT_SECRET`
