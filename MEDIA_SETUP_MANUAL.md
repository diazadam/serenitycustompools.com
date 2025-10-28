# Media Center - Manual Database Setup (2 minutes)

## ✅ What's Already Done:

1. **Schema Added** - The `media` table is defined in `/shared/schema.ts` ✓
2. **Frontend Complete** - Your Media Center page exists at `/media` ✓
3. **Routes Created** - Files exist but need server to load them properly

## 🚀 Quick Setup (Choose ONE):

### Option A: Use Drizzle Kit (Recommended - 30 seconds)

Open Replit Shell and run:
```bash
npm run db:push
```

That's it! This syncs your schema (including media table) to the database.

### Option B: Direct SQL (If Option A fails)

1. Find your `DATABASE_URL` in Replit Secrets
2. Open a PostgreSQL client or run in Shell:

```sql
CREATE TABLE IF NOT EXISTS media (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_id TEXT,
  embed_url TEXT,
  duration INTEGER,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'general',
  tags JSONB,
  view_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 🎬 Add Your Canva Video:

Once table is created, use this curl command:

```bash
curl -X POST "https://serenitycustompools.com/api/admin/media/add-video" \\
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://www.canva.com/design/DAG1W-u7qoM/KCM_fv5sNZxO-MHw81T-wA/watch",
    "title": "Serenity Custom Pools - Promotional Video",
    "description": "Professional pool construction showcase",
    "category": "construction",
    "tags": ["promo", "showcase"],
    "featured": true
  }'
```

## 📁 Files I Created:

- `/shared/schema.ts` - Updated with media table ✓
- `/server/routes-media.ts` - Media routes (needs to be loaded)
- `/server/routes.ts` - Updated to import media routes

## 🔧 If Endpoints Still Don't Work:

The routes files exist but the server may need a clean restart. In Replit:

1. Stop the server (Ctrl+C in Shell)
2. Run: `npm run dev`
3. Wait for "serving on port 5000"

Then the endpoints will be available:
- `POST /api/admin/media/add-video`
- `GET /api/admin/media/list-videos`
- `POST /api/admin/media/create-table`

## 🎯 Expected Result:

After setup:
✅ Media table exists in database
✅ Can add videos via API
✅ Videos persist across restarts
✅ Media Center page shows your videos
✅ Your Canva video displays properly

## 💡 Alternative: I Can Create JSON File Version

If database continues to be problematic, I can create a JSON file-based version in 5 minutes that:
- Stores videos in `/server/data/media.json`
- Works immediately without database
- Can migrate to database later

Let me know which path you want to take!
