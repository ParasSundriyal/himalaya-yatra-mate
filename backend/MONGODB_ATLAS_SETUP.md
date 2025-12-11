# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (or sign in if you already have one)
3. Complete the registration process

## Step 2: Create a Cluster

1. **Create a Free Cluster:**
   - Click "Create" or "Build a Database"
   - Select **FREE (M0)** tier
   - Choose a Cloud Provider (AWS, Google Cloud, or Azure)
   - Select a Region (choose one close to you, e.g., Mumbai for India)
   - Give your cluster a name (e.g., "CharDhamCluster")
   - Click "Create Cluster"

2. **Wait for Cluster Creation:**
   - This usually takes 3-5 minutes
   - You'll see a progress indicator

## Step 3: Create Database User

1. **Go to Database Access:**
   - Click on "Database Access" in the left sidebar
   - Click "Add New Database User"

2. **Configure User:**
   - Authentication Method: **Password**
   - Username: Choose a username (e.g., "chardham_user")
   - Password: Click "Autogenerate Secure Password" or create your own
   - **IMPORTANT:** Copy and save the password!
   - Database User Privileges: **Atlas admin** (for free tier)
   - Click "Add User"

## Step 4: Configure Network Access

1. **Go to Network Access:**
   - Click on "Network Access" in the left sidebar
   - Click "Add IP Address"

2. **Allow Access:**
   - Click "Allow Access from Anywhere" (for development)
   - OR add your current IP address
   - Click "Confirm"

   **Note:** For production, only allow specific IP addresses for security.

## Step 5: Get Connection String

1. **Go to Database:**
   - Click on "Database" in the left sidebar
   - Click "Connect" on your cluster

2. **Choose Connection Method:**
   - Select "Connect your application"
   - Driver: **Node.js**
   - Version: **5.5 or later**

3. **Copy Connection String:**
   - You'll see a connection string like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Copy this string
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password (URL encode if special characters)
   - Replace `?retryWrites=true&w=majority` with `/himalaya-yatra?retryWrites=true&w=majority`
   
   **Final connection string should look like:**
   ```
   mongodb+srv://chardham_user:yourpassword@cluster0.xxxxx.mongodb.net/himalaya-yatra?retryWrites=true&w=majority
   ```

## Step 6: Update Backend Configuration

1. **Create `.env` file in backend folder:**
   ```bash
   cd himalaya-yatra-mate/backend
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Atlas Connection String
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/himalaya-yatra?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_make_it_long_and_random
   JWT_EXPIRE=7d
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

3. **Important Notes:**
   - Replace `your_username` with your MongoDB Atlas username
   - Replace `your_password` with your MongoDB Atlas password
   - Replace `cluster0.xxxxx` with your actual cluster address
   - **URL encode special characters** in password if any (e.g., `@` becomes `%40`)
   - Use a strong, random JWT_SECRET (you can generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## Step 7: Test Connection

1. **Install dependencies (if not done):**
   ```bash
   cd backend
   npm install
   ```

2. **Test connection:**
   ```bash
   node server.js
   ```
   
   You should see:
   ```
   ✅ MongoDB connected successfully
   🚀 Server running on port 5000
   ```

3. **If connection fails:**
   - Check your connection string
   - Verify username and password are correct
   - Check if IP address is whitelisted
   - Check if password has special characters (URL encode them)

## Step 8: Seed Database

1. **Run seed script:**
   ```bash
   node scripts/seed.js
   ```

2. **Expected output:**
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
   ✅ Created taxi: UK-07-CD-5678 - Amit Sharma
   ✅ Created taxi: UK-06-EF-9012 - Vikram Singh
   ✅ Created taxi: UK-05-GH-3456 - Ramesh Patel
   
   🎉 Seeding completed successfully!
   ```

## Step 9: Verify in MongoDB Atlas

1. **Go to Database → Browse Collections:**
   - You should see collections:
     - `users`
     - `parkings`
     - `hotels`
     - `taxis`
     - `bookings` (empty initially)
     - `groups` (empty initially)
     - `aidetections` (empty initially)

## Troubleshooting

### Connection Error: "Authentication failed"
- **Solution:** Check username and password in connection string
- Make sure password is URL encoded if it has special characters

### Connection Error: "IP not whitelisted"
- **Solution:** Add your IP address to Network Access in MongoDB Atlas
- Or use "Allow Access from Anywhere" for development

### Connection Error: "Timeout"
- **Solution:** Check your internet connection
- Verify the cluster is running (not paused)
- Check if firewall is blocking the connection

### Password Special Characters
If your password has special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

### Generate Strong JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Next Steps

1. ✅ Database is set up
2. ✅ Backend is configured
3. ✅ Database is seeded
4. ✅ Test user login with credentials:
   - User: `user@chardham.com` / `user123`
   - Admin: `admin@chardham.com` / `admin123`
   - Instructor: `instructor@chardham.com` / `instructor123`

## Security Notes

- **Never commit `.env` file to git** (it's in .gitignore)
- Use strong, unique passwords
- Rotate JWT secret regularly
- In production, use environment variables from your hosting platform
- Restrict IP access in production
- Use MongoDB Atlas encryption at rest

## Free Tier Limitations

- **512 MB storage**
- **Shared RAM and vCPU**
- **No automated backups** (manual backups available)
- Perfect for development and small projects

## Support

If you encounter any issues:
1. Check MongoDB Atlas status page
2. Review connection string format
3. Verify network access settings
4. Check backend logs for detailed error messages
