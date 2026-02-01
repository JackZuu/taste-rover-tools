# Taste Rover Deployment Guide

## 🚀 Deploy to Railway.app (Recommended - Easiest)

### Step 1: Push to GitHub

1. **Create a GitHub account** (if you don't have one): https://github.com/signup

2. **Create a new repository:**
   - Go to https://github.com/new
   - Name it: `taste-rover-tools`
   - Make it Public or Private
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Push your code to GitHub:**
   ```bash
   cd local-python-ui
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/taste-rover-tools.git
   git push -u origin main
   ```

### Step 2: Deploy on Railway

1. **Create Railway account:** https://railway.app/
   - Sign up with GitHub (easiest)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `taste-rover-tools` repository

3. **Add Environment Variables:**
   - Click on your project
   - Go to "Variables" tab
   - Add:
     ```
     OPENAI_API_KEY=your-openai-key-here
     OPENWEATHER_API_KEY=6df4eae843042183d88511bdfdc7abc9
     PORT=8000
     ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - Wait 3-5 minutes for first deployment
   - You'll get a URL like: `https://taste-rover-tools.up.railway.app`

5. **Generate Domain (Optional):**
   - Go to Settings → Domains
   - Click "Generate Domain"
   - Get a permanent URL!

### Cost
- **Free:** $5 credit per month (enough for POC)
- **Paid:** $5/month after free credit

---

## Alternative: Render.com (100% Free)

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy on Render

1. **Create account:** https://render.com/

2. **New Web Service:**
   - Click "New +" → "Web Service"
   - Connect GitHub repository

3. **Configure:**
   - **Name:** taste-rover-tools
   - **Region:** Choose closest to you
   - **Branch:** main
   - **Root Directory:** backend
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt && cd ../frontend && npm install && npm run build && cd ../backend`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables:**
   ```
   OPENAI_API_KEY=your-key
   OPENWEATHER_API_KEY=6df4eae843042183d88511bdfdc7abc9
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - Get URL like: `https://taste-rover-tools.onrender.com`

### Limitations
- Free tier sleeps after 15 mins of inactivity
- First request takes ~30 seconds to wake up
- Perfect for POC/demo

---

## Troubleshooting

### If deployment fails:

1. **Check logs** in Railway/Render dashboard
2. **Verify environment variables** are set
3. **Make sure** OPENAI_API_KEY is valid

### If frontend doesn't load:

1. Make sure build completed successfully
2. Check that `backend/static` folder was created
3. Try redeploying

---

## Quick Commands Reference

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Connect to GitHub
git remote add origin https://github.com/YOUR-USERNAME/taste-rover-tools.git
git push -u origin main

# Update deployment (after making changes)
git add .
git commit -m "Update"
git push
```

Railway/Render will automatically redeploy when you push changes!
