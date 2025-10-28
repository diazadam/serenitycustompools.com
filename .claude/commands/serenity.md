# Serenity Custom Pools - Agent Context

You are now working with the **Serenity Custom Pools API** - a revolutionary self-modifying web application for a custom pool business in Georgia.

---

## 🔐 API CREDENTIALS

**API Key**: `U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE`
**Base URL**: `https://serenitycustompools.com`
**Authentication**: Bearer token in Authorization header

**Example Request:**
```bash
curl -X GET "https://serenitycustompools.com/api/admin/leads" \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE"
```

---

## 🎯 SYSTEM OVERVIEW

**What This Is:**
- Production web application for Serenity Custom Pools
- Full-stack: React + TypeScript frontend, Node.js + Express backend
- PostgreSQL (Neon) database with 18 tables
- Hosted on Replit
- 35+ active leads in CRM

**Revolutionary Feature:**
🚀 **SELF-MODIFYING SYSTEM** - Can create API endpoints, modify database schemas, generate components, and build workflows **at runtime via API calls** (no code editing needed!)

---

## ⚡ KEY CAPABILITIES

### 1. **Self-Modification System** (META-PROGRAMMING)
**Base**: `/api/admin/selfmod`

**Create Dynamic Routes:**
```bash
POST /api/admin/selfmod/routes/create
{
  "path": "/api/custom/endpoint",
  "method": "GET",
  "handler": "res.json({success: true, data: 'anything'})",
  "description": "Your description"
}
# Route goes LIVE instantly - no deployment needed!
```

**Other Self-Mod Endpoints:**
- `/api/admin/selfmod/schema/add-column` - Modify database
- `/api/admin/selfmod/components/create` - Generate React components
- `/api/admin/selfmod/workflows/create` - Build automations
- `/api/admin/selfmod/config/set` - Update configuration
- `/api/admin/selfmod/history` - View changes
- `/api/admin/selfmod/rollback` - Undo changes

### 2. **Lead Management**
- `GET /api/admin/leads` - Fetch all leads (35 active)
- `POST /api/leads` - Create new lead (triggers email automation)
- Lead form submissions auto-trigger:
  - Admin notification to adam@serenitycustompools.com
  - Welcome email to customer (Gmail OAuth + Gemini AI)
  - Lead qualification (OpenAI)
  - Email drip campaign enrollment

### 3. **File System Access**
- `GET /api/admin/files/list` - List all files
- `GET /api/admin/files/read?path=/FILE` - Read any file
- `POST /api/admin/files/write` - Write/modify files
- Full access to frontend and backend code

### 4. **Blog Automation**
- **Status**: ✅ ENABLED
- **Schedule**: Mondays at 9:00 AM Eastern
- **AI Model**: OpenAI GPT-4o
- Rotates through 15 pool-related topics
- Auto-publishes to database
- `POST /api/blog/automation/generate-now` - Manual trigger

### 5. **Database Access**
- PostgreSQL (Neon) with 18 tables
- Tables: leads, email_campaigns, blog_posts, appointments, chat_messages, etc.
- Direct queries available (check documentation)

---

## 📊 ACTIVE AUTOMATIONS

1. **Lead Form → CRM + Email** ✅ ACTIVE
   - Auto-sends admin notification
   - Auto-sends welcome email (Gmail + Gemini AI)
   - Auto-qualifies leads (OpenAI)
   - Auto-enrolls in drip campaigns

2. **Blog AI Writer** ✅ ENABLED
   - Weekly blog generation (Mondays 9 AM)
   - OpenAI GPT-4o powered
   - SEO-optimized content

3. **Email Campaign Processor** ✅ ACTIVE
   - Runs every 60 seconds
   - Sends scheduled emails
   - Tracks opens/clicks

---

## 🔧 SYSTEM INTEGRATIONS

**AI Services:**
- ✅ Gemini AI (gemini-2.0-flash-exp) - Email personalization
- ✅ OpenAI (GPT-4o) - Lead qualification, blog generation

**Email:**
- ✅ Gmail OAuth - adam@serenitycustompools.com
- ✅ SendGrid - Backup email service

**SMS/Voice:**
- ✅ Twilio - (678) 300-8949

**Storage:**
- ✅ PostgreSQL (Neon) - Cloud database

---

## 📁 DOCUMENTATION LOCATIONS

**In Project Folder** (`~/serenity-pools-api/`):
- `docs/ADMIN_API_DOCUMENTATION.md` - Complete API reference (2,587 lines)
- `docs/AGENT_META_ENDPOINT_GUIDE.md` - Self-modification system (713 lines)
- `docs/AGENT_API_CHEATSHEET.md` - Quick reference (323 lines)
- `docs/EXISTING_AUTOMATIONS.md` - Current automations (460+ lines)
- `docs/DEPLOYMENT_SYSTEM_GUIDE.md` - Deployment info (570 lines)
- `logs/changelog.md` - Complete action history

**On Server** (via API):
Access with: `GET /api/admin/files/read?path=/FILENAME.md`

---

## 🚀 QUICK START EXAMPLES

**Create a new lead:**
```bash
POST https://serenitycustompools.com/api/leads
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "404-555-1234",
  "source": "website",
  "message": "Interested in pool"
}
```

**Create dynamic API endpoint:**
```bash
POST https://serenitycustompools.com/api/admin/selfmod/routes/create
{
  "path": "/api/test/hello",
  "method": "GET",
  "handler": "res.json({hello: 'world'})",
  "description": "Test endpoint"
}
# Test immediately: GET /api/test/hello
```

**List all leads:**
```bash
GET https://serenitycustompools.com/api/admin/leads
```

**Trigger blog generation:**
```bash
POST https://serenitycustompools.com/api/blog/automation/generate-now
```

---

## ⚠️ IMPORTANT NOTES

1. **Authentication Required**: All `/api/admin/*` endpoints require Bearer token
2. **Replit Hosting**: Files modified via API persist through restarts
3. **Self-Mod Power**: Dynamic routes work INSTANTLY (no restart needed)
4. **Email Active**: Welcome emails auto-send on lead creation
5. **Blog Automation**: Running weekly (Mondays 9 AM)

---

## 📈 CURRENT STATUS

- ✅ API fully operational (100+ endpoints)
- ✅ Self-modification system verified working
- ✅ Lead automations active
- ✅ Blog automation enabled
- ✅ Email campaigns running
- ✅ 35 leads in database
- ✅ All integrations connected (Gemini, OpenAI, Gmail, Twilio)

---

## 💡 WHAT YOU CAN DO

**Immediate Actions:**
- Fetch and analyze leads
- Create new API endpoints dynamically
- Modify database schema
- Generate blog posts
- Build automation workflows
- Access and modify any file
- Create new features without touching code

**This system can literally program itself!** 🎉

---

**Ready to build something awesome!** 🚀
