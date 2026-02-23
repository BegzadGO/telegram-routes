# Quick Start Guide

Get your Telegram Mini App running in 15 minutes!

## Prerequisites

- Node.js 18+ installed
- GitHub account
- Telegram account
- Supabase account (free)
- Vercel account (free)

## 🚀 5-Step Setup

### Step 1: Database (3 min)

1. Create Supabase project at https://supabase.com
2. Run `database-schema.sql` in SQL Editor
3. Copy URL and anon key from Settings → API

### Step 2: Local Setup (2 min)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Run locally
npm run dev
```

Visit http://localhost:3000 to test!

### Step 3: Deploy (3 min)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main

# Deploy to Vercel
# Visit vercel.com
# Import your GitHub repo
# Add environment variables (same as .env)
# Click Deploy
```

### Step 4: Telegram Setup (5 min)

1. Open Telegram → Search `@BotFather`
2. Create bot: `/newbot`
3. Register Mini App: `/newapp`
   - Web App URL: Your Vercel URL
   - Short name: `routefinder`
4. Get your link: `https://t.me/YourBot/routefinder`

### Step 5: Test (2 min)

1. Click your Mini App link
2. Select route
3. View vehicles
4. ✅ Done!

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `DEPLOYMENT.md` for detailed deployment guide
- Review `PROJECT_OVERVIEW.md` for architecture details

## 🆘 Need Help?

Common issues and solutions:

**Blank screen?**
→ Check environment variables in Vercel

**No data showing?**
→ Run database-schema.sql again

**Theme not working?**
→ Only works inside Telegram, not browser

**Deploy failed?**
→ Check Vercel logs for specific error

## 📁 Project Structure

```
src/
├── components/        # React components
├── App.jsx           # Main app
├── supabase.js       # Database queries
└── styles.css        # Styling

database-schema.sql   # Database setup
README.md             # Full documentation
DEPLOYMENT.md         # Deployment guide
```

## 🎯 What You Get

✅ Working Telegram Mini App
✅ Route selection interface  
✅ Vehicle listing with driver info
✅ Click-to-call phone numbers
✅ Telegram theme integration
✅ Production-ready deployment
✅ Free hosting (Vercel + Supabase)

---

**Time to complete**: ~15 minutes
**Cost**: $0 (all free tiers)
**Difficulty**: Beginner-friendly

Happy coding! 🚀
