# 🚀 Agent Onboarding: Serenity Custom Pools Admin API Access

## Welcome, Agent!

You've been granted full administrative access to the Serenity Custom Pools system through a powerful API that gives you complete control over all aspects of the application. This message contains everything you need to get started.

## 🔑 Your API Credentials

**API Key:** `U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE`
**Base URL:** `http://localhost:5000`
**Authorization Header:** `Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE`

## 📚 Essential Documentation

You have three comprehensive documentation files available in the project:

### 1. **ADMIN_API_DOCUMENTATION.md** - Complete API Reference
This is your primary resource containing:
- All 21 feature sets with detailed endpoint documentation
- Database operations, AI agent control, email automation
- Third-party integrations, webhooks, scheduled jobs
- File system access, environment management
- Over 100+ endpoints fully documented with examples

### 2. **AGENT_META_ENDPOINT_GUIDE.md** - Dynamic Endpoint Creation
Learn how to create your own API endpoints on the fly:
- Step-by-step tutorials for creating custom endpoints
- 7+ ready-to-use templates (analytics, CSV export, webhooks)
- Programming capabilities and available context
- Best practices and troubleshooting

### 3. **AGENT_API_CHEATSHEET.md** - Quick Reference
Your go-to guide for rapid API usage:
- All endpoints organized by feature
- Copy-paste ready curl commands
- Common tasks with solutions
- Status codes and debugging tips

## 🎯 Quick Start - Your First Commands

### 1. Check System Health
```bash
curl -X GET http://localhost:5000/api/admin/system/health \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE"
```

### 2. Get All Leads
```bash
curl -X GET http://localhost:5000/api/admin/leads \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE"
```

### 3. Execute a Database Query
```bash
curl -X POST http://localhost:5000/api/admin/db/query \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT COUNT(*) as total_leads FROM leads"}'
```

## 💪 Your Capabilities

With this API key, you can:

### Database Control
- Execute any SQL query directly
- Manage 18 tables (leads, voice_calls, email_threads, etc.)
- Perform migrations and schema updates

### AI & Automation
- Control Gemini voice agent (Serenity AI)
- Manage email campaigns and automation
- Orchestrate chatbot interactions

### System Management
- Create/modify/delete API endpoints dynamically
- Manage environment variables and configuration
- Access and modify any file in the project
- Schedule jobs and webhooks

### Integrations
- Connect with Stripe, HubSpot, Salesforce, Twilio
- Sync data across platforms
- Test and validate connections

### Special Power: Meta-Programming
You can create your own API endpoints! Example:
```bash
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/my-tool",
    "handler": "res.json({ message: \"Custom endpoint working!\" });",
    "requiresAuth": true
  }'
```

## 🗂️ System Overview

**Project:** Serenity Custom Pools LLC - Luxury pool company with AI-powered lead generation
**Tech Stack:** Node.js, Express, React, PostgreSQL (Neon), Gemini AI, OpenAI
**Database:** 18 tables including leads, voice_calls, email_threads, chat_messages
**Key Phone:** (678) 300-8949

## 📋 Common Tasks You Might Need

1. **Managing Leads:** Create, update, score, and track leads through the sales pipeline
2. **Email Automation:** Send emails, manage campaigns, track threads
3. **Voice AI:** Start/stop calls, retrieve transcripts, update call summaries
4. **Analytics:** Generate reports, export data, track performance metrics
5. **System Maintenance:** Update configurations, manage integrations, monitor health

## ⚡ Pro Tips

1. **Always include the Bearer token** in your Authorization header
2. **Read the full documentation** before complex operations
3. **Test in small batches** before bulk operations
4. **Use the meta-endpoint system** to create custom tools as needed
5. **Check AGENT_META_ENDPOINT_GUIDE.md** for creating new capabilities

## 🚨 Important Notes

- The API runs on `localhost:5000`
- All admin endpoints require authentication
- Actions are logged for audit trails
- Rate limit: 1000 requests/hour
- Database changes are immediate and permanent

## 🎬 Getting Started Checklist

1. ✅ Save this API key securely
2. ✅ Read `AGENT_API_CHEATSHEET.md` for quick overview
3. ✅ Test system health endpoint to verify access
4. ✅ Explore `ADMIN_API_DOCUMENTATION.md` for full capabilities
5. ✅ Try creating a custom endpoint using `AGENT_META_ENDPOINT_GUIDE.md`

## 🆘 Need Help?

- For API reference: Check `ADMIN_API_DOCUMENTATION.md`
- For creating endpoints: See `AGENT_META_ENDPOINT_GUIDE.md`
- For quick commands: Use `AGENT_API_CHEATSHEET.md`
- For debugging: Enable debug mode via config API

---

You now have complete control over the Serenity Custom Pools system. Use your access wisely and efficiently to manage leads, automate processes, and extend the system's capabilities as needed.

Welcome to the team! 🎉
