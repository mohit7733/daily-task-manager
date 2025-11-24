# 🚀 Quick Start Guide

Get your Daily Task Management System up and running in 5 minutes!

## Step 1: Install MongoDB

If you don't have MongoDB installed:

**Option A: Local MongoDB**
- Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

**Option B: MongoDB Atlas (Cloud - Recommended)**
- Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string

## Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
echo "PORT=5000" > .env
echo "MONGO_URI=mongodb://localhost:27017/taskmanage" >> .env
echo "JWT_SECRET=your-super-secret-jwt-key-change-this" >> .env

# For MongoDB Atlas, use:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanage

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000` ✅

## Step 3: Setup Frontend

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Optional: Create .env file if API is on different URL
# echo "REACT_APP_API_URL=http://localhost:5000" > .env

# Start frontend
npm start
```

Frontend should now be running on `http://localhost:3000` ✅

## Step 4: Create Your First User

1. Open `http://localhost:3000` in your browser
2. Click "Register"
3. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Password: (min 6 characters)
   - Role: Admin (to access team view)
   - Team: Development (or your team name)
4. Click "Register"

## Step 5: Submit Your First Standup

1. After registration, you'll be redirected to Dashboard
2. Click "Submit Today's Standup"
3. Fill in:
   - ✅ What I completed yesterday
   - 🎯 What I will do today
   - 🚧 Any blockers / help needed
4. Click "Submit Standup"

## Step 6: Add Team Members

Each team member should:
1. Register their own account
2. Choose their role (Member, Lead, or Admin)
3. Select their team name

## For Team Leads/Admins

1. Navigate to "Team View" in the navbar
2. View all team standups for today
3. Filter by date and team
4. See who hasn't submitted standups yet

## Troubleshooting

**Backend won't start:**
- Check if MongoDB is running
- Verify MONGO_URI in .env file
- Check if port 5000 is available

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check REACT_APP_API_URL in frontend .env
- Check browser console for CORS errors

**MongoDB connection error:**
- Verify MongoDB is running
- Check connection string format
- For Atlas: Check IP whitelist and credentials

## Next Steps

- Customize team names
- Set up daily reminders
- Export standup reports
- Integrate with Slack/Teams

Happy task managing! 🎉

