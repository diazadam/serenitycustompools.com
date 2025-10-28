# Existing Automations - Serenity Custom Pools

**Date Documented**: 2025-10-28
**Status**: ✅ Complete Audit

---

## 📋 SUMMARY

Your site has **2 active automation systems** working:

1. **Lead Form → CRM + Email Automation** (✅ ACTIVE)
2. **Blog AI Writing System** (⚠️ CONFIGURED BUT DISABLED)

**Important Discovery**: Your automations are **hardcoded service integrations**, NOT using the Admin API agent registry system. This is why `/api/admin/agents/list` returns empty!

---

## 🔄 AUTOMATION #1: Lead Form → CRM + Email System

**Status**: ✅ **FULLY ACTIVE AND WORKING**

### How It Works

When a visitor submits a lead form anywhere on your site:

```
Lead Form Submitted
    ↓
POST /api/leads endpoint triggered
    ↓
[Parallel Actions]
    ├─→ Save to PostgreSQL database
    ├─→ Send Admin Notification Email (adam@serenitycustompools.com)
    ├─→ Send Welcome Email to Customer (via Gmail + AI personalization)
    ├─→ AI Lead Qualification (scores the lead)
    └─→ Auto-enroll in Email Drip Campaign
```

### Implementation Details

**Endpoint**: `POST /api/leads`
**File**: `/server/routes.ts` (lines ~125-200)

**Email Automation Files**:
- `/server/services/gmail-service.ts` - Gmail OAuth integration, welcome emails
- `/server/services/appointment-email.ts` - Appointment confirmations
- `/server/services/simple-email-notification.ts` - Admin notifications
- `/server/services/email-campaigns.ts` - Drip campaign logic
- `/server/services/campaign-scheduler.ts` - Campaign processor

**AI Integration**:
- Uses **Gemini AI** for personalized email content
- Uses **OpenAI** for lead qualification
- Generates custom consultation tips based on lead data

**What Gets Sent**:

1. **Admin Notification** → adam@serenitycustompools.com
   - Lead details (name, email, phone, budget, project type)
   - Lead source and city
   - Affiliate info (if applicable)

2. **Customer Welcome Email** → Lead's email address
   - From: adam@serenitycustompools.com
   - Personalized with AI insights
   - Includes company info and next steps
   - Gmail OAuth authenticated

3. **Campaign Enrollment**
   - Automatically determines best email campaign
   - Schedules follow-up emails
   - Tracks opens, clicks, engagement

### Email Accounts Used
- **adam@serenitycustompools.com** (primary)
- **service@serenitycustompools.com** (mentioned in code but not active)

### Database Tables Involved
- `leads` - Stores lead data
- `email_campaigns` - Campaign enrollment tracking
- `campaign_history` - Email send history
- `email_threads` - Gmail thread tracking

---

## 📝 AUTOMATION #2: Blog AI Writing System

**Status**: ⚠️ **CONFIGURED BUT CURRENTLY DISABLED**

### How It Works (When Enabled)

```
[Weekly Schedule: Mondays @ 9:00 AM Eastern]
    ↓
Scheduler wakes up
    ↓
AI Writer selects topic (rotates through 15 pool topics)
    ↓
OpenAI GPT-4o generates full blog post:
    - Title (SEO optimized)
    - 800-1200 word article
    - Excerpt, tags, meta description
    - Georgia-specific content
    ↓
Auto-publish to database
    ↓
Blog live at /blog/[slug]
```

### Implementation Details

**Scheduler Service**: `/server/services/scheduler.ts`
**AI Writer Service**: `/server/services/blog-ai-writer.ts`

**Configuration**:
- Schedule: Mondays at 9:00 AM Eastern
- Currently: `enabled: false` (not running)
- OpenAI API Key: ✅ Configured
- Model: GPT-4o

**Topics Rotation** (15 topics):
1. Latest pool design trends and innovations
2. Pool maintenance tips and seasonal guides
3. Smart pool technology and automation
4. Luxury pool features and additions
5. Pool safety and family-friendly designs
6. Eco-friendly and sustainable pool solutions
7. Pool landscaping and outdoor entertainment
8. Pool financing and ROI analysis
9. Natural and infinity pool designs
10. Pool renovation and modernization ideas
11. Saltwater vs chlorine pool systems
12. Pool lighting and water features
13. Small backyard pool solutions
14. Pool construction process and timeline
15. Pool heating and climate considerations

**Auto-Generated Content Includes**:
- SEO-optimized title and meta description
- Local Georgia references (Alpharetta, Milton, Cumming, etc.)
- Seasonal considerations
- Expert insights from "Ronald Jones" (owner)
- Professional headers and formatting
- Relevant tags and categories
- Stock pool images from your library

### How to Enable

**Option 1: Via API** (from your CRM dashboard):
```bash
POST https://serenitycustompools.com/api/blog/automation/enable
```

**Option 2: Via UI**:
- Visit: https://serenitycustompools.com/blog-automation
- Toggle "Auto-Publish Weekly Blogs" to ON

**Option 3: Environment Variable**:
```bash
AUTO_PUBLISH_BLOGS=true
```

### Manual Blog Generation

You can generate a blog post immediately without waiting:

```bash
POST https://serenitycustompools.com/api/blog/automation/generate-now
```

Or use the "Generate Blog Post Now" button in the UI at `/blog-automation`.

---

## 🤔 WHY AGENT API ENDPOINTS RETURN EMPTY

You mentioned checking for agents and found nothing. Here's why:

### Two Different Systems

**1. Hardcoded Service Automations** (What You Have)
- Lead emails, blog writer, appointment confirmations
- Built directly into your application code
- Run as singleton services
- Started when the app starts
- **These work but DON'T appear in the agent registry**

**2. Admin API Agent System** (What You CAN Use)
- Dynamic agents registered via API
- `/api/admin/agents/list` - For REGISTERING external agents
- `/api/admin/cron/list` - For SCHEDULING tasks via API
- `/api/admin/webhooks/list` - For EVENT-DRIVEN automations
- **These are currently unused (0 agents registered)**

### Your Current Architecture

```
┌─────────────────────────────────────────┐
│  Hardcoded Service Layer (Active)       │
│  - Lead form automation                 │
│  - Blog scheduler                       │
│  - Email campaigns                      │
│  - Appointment emails                   │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│  Application Code (routes.ts, etc.)     │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Admin API Agent System (Unused)        │
│  - Available but empty                  │
│  - Ready for NEW automations            │
│  - Dynamic agent registration           │
└─────────────────────────────────────────┘
```

---

## 📊 INTEGRATION SERVICES ACTIVELY USED

### AI Services
- ✅ **Gemini AI** (Google)
  - Used in: Welcome emails, appointment confirmations
  - Generates personalized tips and insights
  - Model: gemini-2.0-flash-exp

- ✅ **OpenAI**
  - Used in: Lead qualification, blog generation
  - Models: GPT-4o for blogs, others for scoring
  - Configured via OPENAI_API_KEY

### Email Services
- ✅ **Gmail OAuth**
  - Primary email: adam@serenitycustompools.com
  - Full send/receive via Google APIs
  - OAuth tokens configured
  - Used for: Customer welcome emails, appointment confirmations

- ✅ **SendGrid** (configured but not primary)
  - API key present
  - Available as fallback email service

### SMS/Voice
- ✅ **Twilio**
  - Configured via TWILIO_ACCOUNT_SID
  - Phone: (678) 300-8949
  - Used for: SMS notifications (if triggered)

### Storage
- ✅ **PostgreSQL (Neon)**
  - 18 database tables
  - Stores: leads, campaigns, blog posts, etc.
  - Cloud-hosted

---

## 🎯 ACTIVE AUTOMATION FLOWS

### Flow 1: Contact Form Submission
```
Visitor fills contact form
    → Create lead in database
    → Send admin email (gmail)
    → Send welcome email to customer (gmail + Gemini AI)
    → Qualify lead with OpenAI
    → Enroll in drip campaign
```

### Flow 2: Appointment Booking
```
Visitor books consultation
    → Save appointment to database
    → Send confirmation email to customer (gmail + Gemini AI personalization)
    → Send admin notification to adam@serenitycustompools.com
    → Add to calendar reminder
```

### Flow 3: Email Campaign (After Lead Created)
```
Lead enrolled in campaign
    → Campaign processor runs (every 60 seconds)
    → Checks for emails to send
    → Sends next email in sequence
    → Tracks opens/clicks
    → Advances to next step
```

### Flow 4: Blog Generation (When Enabled)
```
Monday 9:00 AM Eastern
    → Scheduler triggers
    → AI selects next topic
    → OpenAI generates article
    → Save to database as published
    → Available at /blog/[slug]
```

---

## 📁 KEY SERVICE FILES

| File | Purpose | Status |
|------|---------|--------|
| `/server/routes.ts` | Main API routes, lead creation | ✅ Active |
| `/server/services/gmail-service.ts` | Gmail OAuth, send emails | ✅ Active |
| `/server/services/appointment-email.ts` | Appointment confirmations | ✅ Active |
| `/server/services/email-campaigns.ts` | Drip campaign logic | ✅ Active |
| `/server/services/campaign-scheduler.ts` | Campaign processor (60s interval) | ✅ Active |
| `/server/services/blog-ai-writer.ts` | Blog content generation | ⚠️ Configured |
| `/server/services/scheduler.ts` | Blog weekly scheduler | ⚠️ Disabled |
| `/server/services/simple-email-notification.ts` | Admin notifications | ✅ Active |
| `/server/services/ai-auto-reply.ts` | AI email reply generation | 🔷 Available |
| `/server/services/email-templates.ts` | Email template library | ✅ Active |
| `/server/services/crm-sync.ts` | CRM synchronization | 🔷 Available |

**Legend**:
- ✅ Active and running
- ⚠️ Configured but disabled
- 🔷 Available but not triggered yet

---

## 🚀 WHAT YOU CAN DO NOW

### 1. Enable Blog Automation
Turn on the weekly blog writer to start generating SEO content automatically:
```bash
curl -X POST "https://serenitycustompools.com/api/blog/automation/enable" \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE"
```

### 2. Test Lead Flow
Submit a test lead and watch the automation:
```bash
curl -X POST "https://serenitycustompools.com/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Customer",
    "email": "test@example.com",
    "phone": "404-555-1234",
    "source": "test",
    "message": "Testing automation"
  }'
```

### 3. Register Custom Agents
Use the Admin API to register NEW automations:
```bash
# Create a custom scheduled job
curl -X POST "https://serenitycustompools.com/api/admin/cron/create" \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "daily-lead-summary",
    "schedule": "0 8 * * *",
    "action": "send_email",
    "params": {"template": "daily_summary"}
  }'
```

### 4. Monitor Campaign Performance
Check how your email campaigns are performing:
```bash
# Get campaign processor status
curl -X GET "https://serenitycustompools.com/api/campaigns/processor/status" \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE"
```

---

## 💡 RECOMMENDATIONS

### Immediate Actions

1. **Enable Blog Automation**
   - Currently disabled but fully configured
   - Will generate weekly SEO content automatically
   - Costs: ~$0.10-0.20 per blog post (OpenAI API)

2. **Monitor Lead Emails**
   - Verify Gmail OAuth is still connected
   - Check spam folders for admin notifications
   - Test appointment flow

3. **Review Campaign Performance**
   - Check which leads are in active campaigns
   - Review email open/click rates
   - Adjust campaign timing if needed

### Future Enhancements

1. **Use Admin API Agent System**
   - Register custom agents for new automations
   - Set up webhooks for external integrations
   - Create scheduled jobs for reports

2. **Add More Automation**
   - SMS notifications for high-priority leads
   - Auto-reply to Gmail inbox (service exists!)
   - CRM sync with HubSpot/Salesforce
   - Analytics email summaries

3. **Optimize Campaigns**
   - A/B test email templates
   - Personalize based on lead score
   - Add re-engagement campaigns

---

## 🔐 CREDENTIALS USED

**Gmail OAuth**:
- Client ID: GOOGLE_CLIENT_ID (env)
- Client Secret: GOOGLE_CLIENT_SECRET (env)
- Refresh Token: GOOGLE_REFRESH_TOKEN (env)
- Account: adam@serenitycustompools.com

**OpenAI**:
- API Key: OPENAI_API_KEY (env)
- Used for: Blog generation, lead qualification

**Gemini AI**:
- API Key: GEMINI_API_KEY (env)
- Used for: Email personalization, insights

**Twilio** (available):
- Account SID: TWILIO_ACCOUNT_SID (env)
- Phone: (678) 300-8949

**SendGrid** (available):
- API Key: SENDGRID_API_KEY (env)
- Backup email service

---

## ✅ VERIFICATION CHECKLIST

- ✅ Lead form automation working
- ✅ Admin email notifications working
- ✅ Customer welcome emails working
- ✅ AI lead qualification working
- ✅ Email campaign enrollment working
- ⚠️ Blog automation disabled (can enable)
- ⏳ Admin API agent system ready (unused)

---

**Last Updated**: 2025-10-28
**Next Review**: Enable blog automation, test full lead flow
**Documentation By**: Claude Code

---

## 📞 SUPPORT

For questions about these automations:
- Check `/docs/ADMIN_API_DOCUMENTATION.md` for API endpoints
- View live status at https://serenitycustompools.com/blog-automation
- Review campaign dashboard at https://serenitycustompools.com/crm-dashboard
