# Weather API Setup Guide

## Overview
The weather widget displays live weather data for all 4 Char Dhams (Badrinath, Kedarnath, Gangotri, Yamunotri) to all users automatically. No user input is required.

## Setup Instructions

### Step 1: Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap API](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to your API keys section
4. Copy your API key (it looks like: `abc123def456ghi789jkl012mno345pq`)

### Step 2: Create Frontend .env File

Create a `.env` file in the **frontend root directory** (`himalaya-yatra-mate/.env`):

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# OpenWeatherMap API Key for weather data
VITE_WEATHER_API_KEY=your_actual_api_key_here
```

**Important Notes:**
- Replace `your_actual_api_key_here` with your actual OpenWeatherMap API key
- The file should be in `himalaya-yatra-mate/.env` (NOT in the backend folder)
- The `VITE_` prefix is required for Vite to expose the variable to the frontend code

### Step 3: Restart Development Server

After creating/updating the `.env` file:

1. Stop your development server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

**Note:** You must restart the dev server for Vite to load the new environment variables.

### Step 4: Verify Setup

1. Open the application in your browser
2. Navigate to the Dashboard (Tourist Dashboard)
3. You should see the "Live Weather - Char Dham" section at the top
4. All 4 dhams should display weather information automatically

## File Structure

```
himalaya-yatra-mate/
├── .env                    ← CREATE THIS FILE HERE (frontend root)
├── backend/                ← Backend .env goes here (different file)
│   └── .env
├── src/
│   └── pages/
│       └── Dashboard.tsx   ← Uses VITE_WEATHER_API_KEY
├── package.json
└── vite.config.ts
```

## Environment Variables Summary

### Frontend (.env in `himalaya-yatra-mate/`)
- `VITE_API_URL` - Backend API URL
- `VITE_WEATHER_API_KEY` - OpenWeatherMap API key ⭐ **NEW**

### Backend (.env in `himalaya-yatra-mate/backend/`)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port

## Troubleshooting

### Weather data not showing?
1. Check that `.env` file exists in the frontend root directory
2. Verify `VITE_WEATHER_API_KEY` is set correctly
3. Make sure you restarted the dev server after adding the key
4. Check browser console for error messages
5. Verify your OpenWeatherMap API key is valid and active

### API Key Invalid Error?
1. Make sure you copied the entire API key (no spaces)
2. Check that your OpenWeatherMap account is activated
3. Wait a few minutes after creating the key (it may take time to activate)
4. Verify the key has the correct permissions

### Still having issues?
- Check the browser console for specific error messages
- Verify the `.env` file is in the correct location
- Ensure the dev server was restarted after adding the key
- Check that the API key variable name is exactly `VITE_WEATHER_API_KEY`

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to version control
- The `.env` file should already be in `.gitignore`
- Keep your API key secure and don't share it publicly
- For production, use environment variables provided by your hosting platform

## How It Works

1. Frontend reads `VITE_WEATHER_API_KEY` from `.env` file
2. On Dashboard load, automatically fetches weather for all 4 Char Dhams
3. Weather data is displayed to all users without requiring any input
4. Data refreshes automatically when the component mounts

No user interaction is required - the weather widget works automatically for all tourists once configured!

