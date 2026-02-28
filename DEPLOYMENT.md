# Deployment Guide

## Quick Start Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Supabase URL and anon key obtained
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Environment variables configured
- [ ] App deployed to Vercel
- [ ] Telegram bot created
- [ ] Mini App registered with BotFather

---

## Step 1: Supabase Setup (5 minutes)

### 1.1 Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: telegram-route-app
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 1.2 Apply Database Schema
1. Go to SQL Editor in left sidebar
2. Click "New Query"
3. Copy entire content from `database-schema.sql`
4. Paste and click "Run"
5. Verify success (should see "Success. No rows returned")

### 1.3 Get API Credentials
1. Go to "Project Settings" (gear icon)
2. Click "API" tab
3. Copy and save:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

---

## Step 2: GitHub Setup (3 minutes)

### 2.1 Create Repository
1. Go to https://github.com/new
2. Repository name: `telegram-route-app`
3. Keep it public or private (your choice)
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### 2.2 Push Code
```bash
cd telegram-route-app

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Telegram Route Finder Mini App"

# Add remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/telegram-route-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Vercel Deployment (5 minutes)

### 3.1 Connect to Vercel

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New..." → "Project"
4. Import your `telegram-route-app` repository
5. Configure project:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)

6. Add Environment Variables:
   - Click "Environment Variables"
   - Add:
     ```
     Name: VITE_SUPABASE_URL
     Value: [Your Supabase URL]
     
     Name: VITE_SUPABASE_ANON_KEY
     Value: [Your Supabase anon key]
     ```
   - Ensure "Production", "Preview", and "Development" are all checked

7. Click "Deploy"
8. Wait 1-2 minutes
9. Your app URL: `https://telegram-route-app-xxxxx.vercel.app`

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? telegram-route-app
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste your Supabase anon key when prompted

# Deploy to production with env vars
vercel --prod
```

### 3.2 Verify Deployment
1. Visit your Vercel URL
2. App should load (might show default theme if not in Telegram)
3. Test route selection
4. Verify vehicles load

---

## Step 4: Telegram Bot Setup (5 minutes)

### 4.1 Create Bot
1. Open Telegram
2. Search for `@BotFather`
3. Start chat and send: `/newbot`
4. Enter bot name: `Route Finder Bot`
5. Enter username: `YourRouteFinder_bot` (must end with `_bot`)
6. Save the **HTTP API token** (you'll need it later for advanced features)

### 4.2 Register Mini App
1. Send to BotFather: `/newapp`
2. Select your bot from the list
3. Provide information:

   **Title**: `Route Finder`
   
   **Description**: `Find available vehicles for routes between cities. Select departure and destination to see vehicle options with driver contacts.`
   
   **Photo**: Upload a 640x360px image (create one or skip for now)
   
   **Demo GIF/Video**: (Optional, press Skip)
   
   **Web App URL**: `https://your-app.vercel.app`
   (Your exact Vercel URL from Step 3)
   
   **Short name**: `routefinder`
   (Must be unique, lowercase, no spaces)

4. BotFather will confirm: "Done! Your Web App route finder is now available"

### 4.3 Get Mini App Link
BotFather provides a link like:
```
https://t.me/YourRouteFinder_bot/routefinder
```

---

## Step 5: Testing (2 minutes)

### 5.1 Test in Telegram
1. Click the Mini App link from BotFather
2. App should open in Telegram
3. Verify:
   - App expands to full height
   - Theme colors match Telegram
   - Route selector loads cities
   - Selecting route shows vehicles
   - Phone numbers are clickable
   - UI is responsive

### 5.2 Test Features
- [ ] Routes load without errors
- [ ] Can select "From" city
- [ ] "To" dropdown populates correctly
- [ ] "Show Vehicles" button works
- [ ] Vehicles display correctly
- [ ] Phone numbers are clickable (tel: links)
- [ ] Vehicle types show (bus/car/minivan)
- [ ] Prices display when available
- [ ] Empty state shows when no vehicles
- [ ] Loading states appear

---

## Step 6: Share Your Mini App

### Users can access via:

1. **Direct Link**:
   ```
   https://t.me/YourRouteFinder_bot/routefinder
   ```

2. **Via Bot Menu** (Configure in BotFather):
   - Send `/mybots` to BotFather
   - Select your bot
   - "Bot Settings" → "Menu Button"
   - Configure mini app link

3. **Inline Button** (Advanced):
   - Add a button to bot messages
   - Requires bot programming (not covered here)

---

## Troubleshooting

### App shows blank screen in Telegram
**Solution**: 
- Check Vercel deployment succeeded
- Verify URL is HTTPS
- Check browser console for errors
- Ensure environment variables are set

### "Missing Supabase environment variables" error
**Solution**:
- Go to Vercel dashboard → Project → Settings → Environment Variables
- Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist
- Redeploy: Deployments → Three dots → Redeploy

### No routes or vehicles showing
**Solution**:
- Verify database schema was applied correctly
- Check RLS policies are enabled
- Test queries in Supabase SQL Editor
- Check browser console for errors

### Theme colors not working
**Solution**:
- This is expected when testing in browser
- Theme only works inside Telegram app
- Test by opening actual Telegram link

### Changes not appearing after git push
**Solution**:
- Vercel auto-deploys on push
- Check Vercel dashboard → Deployments
- Wait 1-2 minutes for build
- Clear browser cache

---

## Maintenance

### Update App
```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push

# Vercel automatically deploys new version
```

### Add More Routes/Vehicles
1. Go to Supabase → Table Editor
2. Select `routes`, `drivers`, or `vehicles` table
3. Click "Insert row"
4. Fill in data
5. Save
6. Changes appear immediately in app

### Monitor Usage
- Supabase: Database → Reports
- Vercel: Analytics tab

### View Logs
- Vercel: Deployments → Click deployment → Runtime Logs
- Supabase: Logs & Observability

---

## Environment Variables Reference

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → Project API keys → anon/public | `eyJhbGciOiJIUzI1...` |

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Read-only policies for anonymous access
- [x] Anon key used (safe for client-side)
- [x] No authentication required
- [x] Environment variables not committed to Git
- [x] HTTPS enforced by Vercel
- [x] No sensitive data in client code

---

## Cost Estimate

All services used are **FREE** for this project:

- **Supabase**: Free tier (500MB database, 50,000 monthly active users)
- **Vercel**: Free tier (unlimited deployments, 100GB bandwidth/month)
- **GitHub**: Free for public/private repos
- **Telegram**: Free

---

## Next Steps

### Optional Enhancements:
1. Add more routes and vehicles
2. Customize app icon and branding
3. Add filtering by vehicle type
4. Add sorting options
5. Implement favorites/bookmarks
6. Add user reviews
7. Integrate payment system
8. Add admin panel for data management

### For these features:
- You'll need authentication
- Additional Supabase tables
- More complex RLS policies
- Backend API routes

This basic version is production-ready and fully functional!

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Telegram Mini Apps**: https://core.telegram.org/bots/webapps
- **React Docs**: https://react.dev

---

**Congratulations! Your Telegram Mini App is live! 🎉**
