# Quick Start Guide - MongoDB Atlas Setup

## 🚀 Quick Setup (5 Minutes)

### 1. Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Login
3. Create a FREE cluster (M0 tier)
4. Create database user (Database Access)
5. Whitelist IP (Network Access - "Allow from anywhere" for dev)
6. Get connection string (Database → Connect → Connect your application)

### 2. Configure Backend

```bash
cd himalaya-yatra-mate/backend
```

Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/himalaya-yatra?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Replace:**
- `username` → Your MongoDB Atlas username
- `password` → Your MongoDB Atlas password (URL encode special chars)
- `cluster.mongodb.net` → Your actual cluster URL

### 3. Install Dependencies

```bash
npm install
```

### 4. Test Connection

```bash
npm run test-connection
```

Should see: `✅ MongoDB connected successfully!`

### 5. Seed Database

```bash
npm run seed
```

### 6. Start Server

```bash
npm run dev
```

### 7. Test Login

1. Start frontend: `npm run dev` (from root)
2. Go to: http://localhost:5173/login
3. Login with:
   - **User:** `user@chardham.com` / `user123`
   - **Admin:** `admin@chardham.com` / `admin123`
   - **Instructor:** `instructor@chardham.com` / `instructor123`

## 🎯 That's it! You're ready to go!

For detailed setup instructions, see `MONGODB_ATLAS_SETUP.md`
