# Telegram Route Finder Mini App

A production-ready Telegram Mini App for viewing available vehicles on routes between cities. Built with React, Vite, and Supabase.

## Features

- 🚗 View vehicles by route (From → To cities)
- 📱 Native Telegram Mini App integration
- 🎨 Telegram theme-aware UI
- 📞 Click-to-call driver phone numbers
- 🔒 Read-only Supabase access with RLS
- ⚡ Fast and lightweight
- 📱 Mobile-first responsive design

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Platform**: Telegram Mini Apps

## Project Structure

```
telegram-route-app/
├── src/
│   ├── components/
│   │   ├── RouteSelector.jsx    # Route selection dropdown
│   │   ├── VehicleList.jsx      # Vehicle list container
│   │   └── VehicleCard.jsx      # Individual vehicle card
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   ├── supabase.js              # Supabase client & queries
│   └── styles.css               # Global styles
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### 2. Create Tables

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Create routes table
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bus', 'car', 'minivan')),
  price INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_vehicles_route_id ON vehicles(route_id);
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_routes_cities ON routes(from_city, to_city);
```

### 3. Set Up Row Level Security (RLS)

Enable RLS and create SELECT-only policies:

```sql
-- Enable RLS on all tables
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create read-only policies for public access
CREATE POLICY "Allow public read access on routes"
  ON routes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access on drivers"
  ON drivers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access on vehicles"
  ON vehicles FOR SELECT
  TO anon
  USING (true);
```

### 4. Insert Sample Data (Optional)

```sql
-- Insert sample routes
INSERT INTO routes (from_city, to_city) VALUES
  ('New York', 'Boston'),
  ('New York', 'Philadelphia'),
  ('Boston', 'New York'),
  ('Los Angeles', 'San Francisco');

-- Insert sample drivers
INSERT INTO drivers (name, phone) VALUES
  ('John Smith', '+1-555-0101'),
  ('Maria Garcia', '+1-555-0102'),
  ('David Lee', '+1-555-0103');

-- Insert sample vehicles (use actual route_id and driver_id from above)
-- Replace the UUIDs with actual IDs from your routes and drivers tables
INSERT INTO vehicles (route_id, driver_id, vehicle_name, type, price) VALUES
  ((SELECT id FROM routes WHERE from_city = 'New York' AND to_city = 'Boston' LIMIT 1),
   (SELECT id FROM drivers WHERE name = 'John Smith' LIMIT 1),
   'Comfort Express', 'bus', 45),
  ((SELECT id FROM routes WHERE from_city = 'New York' AND to_city = 'Boston' LIMIT 1),
   (SELECT id FROM drivers WHERE name = 'Maria Garcia' LIMIT 1),
   'Quick Ride', 'car', 60);
```

### 5. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Local Development

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd telegram-route-app

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

4. Redeploy with environment variables:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

Your app will be deployed at: `https://your-app.vercel.app`

## Telegram Mini App Setup

### 1. Create a Bot with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Save your **Bot Token**

### 2. Register the Mini App

1. Send `/newapp` to @BotFather
2. Select your bot
3. Provide:
   - **Title**: Route Finder
   - **Description**: Find available vehicles for your journey
   - **Photo**: Upload an app icon (640x360px)
   - **Web App URL**: Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - **Short name**: routefinder (unique identifier)

### 3. Test Your Mini App

1. @BotFather will provide a link like: `https://t.me/YourBot/routefinder`
2. Click the link to open your Mini App in Telegram
3. Test the functionality

### 4. Share Your Mini App

Users can access your app via:
- Direct link: `https://t.me/YourBot/routefinder`
- Inline button in your bot messages
- Keyboard button in your bot

## Security Notes

✅ **Implemented Security Measures:**
- RLS (Row Level Security) enabled on all tables
- Read-only policies for anonymous users
- No authentication required (public read-only)
- Supabase anon key used (safe for client-side)
- No realtime subscriptions enabled
- Environment variables for sensitive data

⚠️ **Important:**
- Never commit `.env` file to Git
- Anon key is safe to expose (RLS protects your data)
- Only SELECT operations are allowed
- All INSERT/UPDATE/DELETE operations require authentication

## Troubleshooting

### App doesn't load in Telegram
- Check that your Vercel URL is correct and accessible
- Ensure the app is served over HTTPS
- Check browser console for errors

### "Missing Supabase environment variables" error
- Verify `.env` file exists locally
- Check environment variables are set in Vercel
- Redeploy after adding environment variables

### No vehicles showing
- Check Supabase RLS policies are correctly set
- Verify sample data exists in database
- Check browser console for errors
- Test Supabase connection in SQL Editor

### Theme colors not working
- Telegram WebApp API only works inside Telegram
- For local testing, default colors will be used
- Test inside actual Telegram app for theme support

## Browser Testing

For testing outside Telegram:
```bash
npm run dev
```

The app will work in any browser but Telegram-specific features (theme, haptic feedback) will only work inside Telegram.

## Support

For issues and questions:
- Check the Supabase documentation: https://supabase.com/docs
- Check Telegram Mini Apps docs: https://core.telegram.org/bots/webapps
- Check Vercel documentation: https://vercel.com/docs

## License

MIT
