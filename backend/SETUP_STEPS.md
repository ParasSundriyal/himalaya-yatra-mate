# Step-by-Step MongoDB Atlas Setup

Follow these steps to set up your database and test user login:

## 📋 Prerequisites

- Node.js installed (v16 or higher)
- npm or yarn installed
- MongoDB Atlas account (free tier is fine)

## 🔧 Step 1: Create MongoDB Atlas Account & Cluster

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a FREE cluster (M0 tier)
4. Wait for cluster to be created (3-5 minutes)

## 🔐 Step 2: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose:
   - **Authentication Method:** Password
   - **Username:** `chardham_user` (or any username)
   - **Password:** Click "Autogenerate" or create your own
   - **⚠️ IMPORTANT:** Copy and save the password!
   - **Database User Privileges:** Atlas admin
4. Click **"Add User"**

## 🌐 Step 3: Configure Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add your specific IP address
4. Click **"Confirm"**

## 📝 Step 4: Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose:
   - **Driver:** Node.js
   - **Version:** 5.5 or later
5. Copy the connection string
6. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## ⚙️ Step 5: Configure Backend

1. **Navigate to backend folder:**
   ```bash
   cd himalaya-yatra-mate/backend
   ```

2. **Create `.env` file:**
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env
   
   # On Mac/Linux
   cp .env.example .env
   ```

3. **Edit `.env` file:**
   - Open `.env` in your editor
   - Replace the `MONGODB_URI` with your connection string
   - **Important:** 
     - Replace `<username>` with your database username
     - Replace `<password>` with your database password
     - Replace `?retryWrites=true&w=majority` with `/himalaya-yatra?retryWrites=true&w=majority`
     - If password has special characters, URL encode them:
       - `@` → `%40`
       - `#` → `%23`
       - `$` → `%24`
       - etc.

   **Example:**
   ```env
   MONGODB_URI=mongodb+srv://chardham_user:MyP@ssw0rd@cluster0.abc123.mongodb.net/himalaya-yatra?retryWrites=true&w=majority
   ```

4. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it in `.env` as `JWT_SECRET`

## 📦 Step 6: Install Dependencies

```bash
npm install
```

## 🧪 Step 7: Test Connection

```bash
npm run test-connection
```

**Expected output:**
```
🔄 Attempting to connect to MongoDB Atlas...
✅ MongoDB connected successfully!
📊 Database name: himalaya-yatra
🌐 Host: cluster0.xxxxx.mongodb.net
```

**If you see errors:**
- Check connection string format
- Verify username/password
- Check if IP is whitelisted
- URL encode special characters in password

## 🌱 Step 8: Seed Database

```bash
npm run seed
```

**Expected output:**
```
✅ MongoDB connected successfully
✅ Created admin user: admin@chardham.com / admin123
✅ Created group instructor: instructor@chardham.com / instructor123
✅ Created test user: user@chardham.com / user123
✅ Created parking area: Badrinath Main Parking with 100 slots
✅ Created parking area: Kedarnath North Zone with 80 slots
✅ Created parking area: Gangotri East Parking with 60 slots
✅ Created parking area: Yamunotri West Zone with 50 slots
✅ Created hotel: Divine Heights Hotel
✅ Created hotel: Mountain View Resort
✅ Created hotel: Ganga Retreat
✅ Created hotel: Yamuna Palace
✅ Created taxi: UK-05-AB-1234 - Rajesh Kumar
...
🎉 Seeding completed successfully!
```

## 🚀 Step 9: Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
📊 Database: himalaya-yatra
🌐 Host: cluster0.xxxxx.mongodb.net
🚀 Server running on port 5000
📡 Environment: development
```

## 🧪 Step 10: Test User Login

1. **Start Frontend:**
   ```bash
   # From project root
   cd ..
   npm run dev
   ```

2. **Open Browser:**
   - Go to: http://localhost:5173
   - Click "Login" or go to: http://localhost:5173/login

3. **Test Credentials:**
   - **User:** `user@chardham.com` / `user123`
   - **Admin:** `admin@chardham.com` / `admin123`
   - **Instructor:** `instructor@chardham.com` / `instructor123`

4. **Expected Behavior:**
   - Enter email and password
   - Click "Login"
   - Should see "Login Successful" message
   - Should redirect to dashboard
   - Should show user name in navbar

## ✅ Verification Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP address whitelisted
- [ ] Connection string obtained
- [ ] `.env` file created and configured
- [ ] Dependencies installed
- [ ] Connection test successful
- [ ] Database seeded
- [ ] Backend server running
- [ ] Frontend running
- [ ] Login works with test credentials

## 🐛 Troubleshooting

### Connection Fails

**Error: "Authentication failed"**
- ✅ Check username and password in connection string
- ✅ URL encode special characters in password
- ✅ Verify user exists in MongoDB Atlas

**Error: "IP not whitelisted"**
- ✅ Add your IP to Network Access
- ✅ Or use "Allow from anywhere" for development

**Error: "Timeout"**
- ✅ Check internet connection
- ✅ Verify cluster is running (not paused)
- ✅ Check firewall settings

### Login Fails

**Error: "Invalid credentials"**
- ✅ Verify user exists in database
- ✅ Check if password is correct
- ✅ Run seed script again if needed

**Error: "Network error"**
- ✅ Check if backend is running
- ✅ Verify FRONTEND_URL in .env matches frontend URL
- ✅ Check CORS settings

## 🎉 Success!

If everything works, you should be able to:
- ✅ Login with test credentials
- ✅ See user dashboard
- ✅ View hotels and taxis
- ✅ Make bookings
- ✅ View your bookings

## 📚 Next Steps

1. Create your own user account via signup page
2. Test hotel booking
3. Test taxi booking
4. Explore the dashboard features

## 💡 Tips

- Keep your `.env` file secure (never commit to git)
- Use strong passwords
- Rotate JWT secret regularly
- In production, restrict IP access
- Monitor your MongoDB Atlas usage

## 🆘 Need Help?

- Check `MONGODB_ATLAS_SETUP.md` for detailed guide
- Check backend logs for error messages
- Verify all environment variables are set
- Test connection with `npm run test-connection`
