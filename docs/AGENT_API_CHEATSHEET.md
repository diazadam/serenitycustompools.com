# 🚀 Agent API Quick Reference Cheatsheet

## Authentication
**Your API Key:** `U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE`
**Header Format:** `Authorization: Bearer YOUR_API_KEY`

---

## 📡 All Available Endpoints (21 Feature Sets)

### 1. Database Operations
```bash
# Execute SQL
POST /api/admin/db/query          {"sql": "SELECT * FROM leads"}

# Get table structure
GET  /api/admin/db/schema/{table}

# List all tables
GET  /api/admin/db/tables
```

### 2. Lead Management  
```bash
GET    /api/admin/leads
GET    /api/admin/leads/{id}
POST   /api/admin/leads           {"name":"","email":"","phone":"","score":0}
PUT    /api/admin/leads/{id}      
DELETE /api/admin/leads/{id}
```

### 3. Email Campaigns
```bash
POST   /api/admin/campaigns/start   {"leadId":"","campaignType":""}
POST   /api/admin/campaigns/stop    {"leadId":"","campaignType":""}
GET    /api/admin/campaigns/status/{leadId}
```

### 4. AI Agents Control
```bash
POST   /api/admin/ai/chat           {"message":""}
POST   /api/admin/ai/voice/start    {"leadId":""}
POST   /api/admin/ai/voice/stop     {"callId":""}
GET    /api/admin/ai/voice/transcript/{callId}
```

### 5. Email Automation
```bash
POST   /api/admin/email/send        {"to":"","subject":"","body":""}
POST   /api/admin/email/draft       {"leadId":"","template":""}
GET    /api/admin/email/threads/{leadId}
POST   /api/admin/email/reply       {"threadId":"","message":""}
```

### 6. Webhooks
```bash
POST   /api/admin/webhooks/create   {"url":"","events":[],"active":true}
GET    /api/admin/webhooks
PUT    /api/admin/webhooks/{id}
DELETE /api/admin/webhooks/{id}
POST   /api/admin/webhooks/{id}/test
```

### 7. Scheduled Jobs
```bash
POST   /api/admin/jobs/create       {"name":"","cron":"","handler":""}
GET    /api/admin/jobs
PUT    /api/admin/jobs/{id}/toggle
DELETE /api/admin/jobs/{id}
GET    /api/admin/jobs/{id}/logs
```

### 8. Analytics
```bash
GET    /api/admin/analytics/leads?period=7d
GET    /api/admin/analytics/performance
GET    /api/admin/analytics/campaigns
POST   /api/admin/analytics/custom   {"metric":"","filters":{}}
```

### 9. System Control
```bash
GET    /api/admin/system/health
POST   /api/admin/system/restart
GET    /api/admin/system/logs?limit=100
POST   /api/admin/system/maintenance {"enabled":true}
```

### 10. Integrations (Third-Party)
```bash
POST   /api/admin/integrations/connect    {"service":"stripe","config":{}}
GET    /api/admin/integrations/list
POST   /api/admin/integrations/{service}/sync
POST   /api/admin/integrations/{service}/test
DELETE /api/admin/integrations/{service}
```

### 11. File System
```bash
GET    /api/admin/files/list        {"path":"./","recursive":true}
GET    /api/admin/files/read        {"path":"./file.txt"}
POST   /api/admin/files/write       {"path":"","content":""}
DELETE /api/admin/files/delete      {"path":""}
POST   /api/admin/files/search      {"pattern":"","path":"./"}
```

### 12. Environment & Config
```bash
GET    /api/admin/env/list?showSensitive=true
POST   /api/admin/env/set           {"key":"","value":"","permanent":true}
GET    /api/admin/config/all
POST   /api/admin/config/update     {"updates":{},"persist":true}
POST   /api/admin/config/reset      {"keys":[]}
```

### 13. Meta-Endpoints (Dynamic API Creation)
```bash
POST   /api/admin/endpoints/create  {"method":"","path":"","handler":"","requiresAuth":true}
GET    /api/admin/endpoints/list
PUT    /api/admin/endpoints/update  {"method":"","path":"","handler":""}
DELETE /api/admin/endpoints/{method}/{path}
GET    /api/admin/endpoints/{method}/{path}
```

### 14. Content Generation
```bash
POST   /api/admin/content/generate  {"type":"blog","topic":"","style":""}
POST   /api/admin/content/improve   {"content":"","goal":""}
POST   /api/admin/content/translate {"content":"","language":""}
```

### 15. Backup & Restore
```bash
POST   /api/admin/backup/create     {"includeDb":true,"includeFiles":true}
GET    /api/admin/backup/list
POST   /api/admin/backup/restore    {"backupId":""}
DELETE /api/admin/backup/{id}
```

### 16. Security & Auth
```bash
POST   /api/admin/auth/tokens/create {"name":"","permissions":[]}
GET    /api/admin/auth/tokens
DELETE /api/admin/auth/tokens/{id}
GET    /api/admin/auth/activity?limit=100
```

### 17. Cache Management
```bash
POST   /api/admin/cache/clear       {"keys":[]}
GET    /api/admin/cache/stats
POST   /api/admin/cache/warm        {"endpoints":[]}
```

### 18. Deploy & Publishing
```bash
POST   /api/admin/deploy/build
POST   /api/admin/deploy/publish    {"environment":"production"}
GET    /api/admin/deploy/status
POST   /api/admin/deploy/rollback   {"version":""}
```

### 19. Real-time Events
```bash
WebSocket: ws://localhost:5000/api/admin/events
POST   /api/admin/events/emit       {"event":"","data":{}}
GET    /api/admin/events/history?limit=50
```

### 20. Testing & QA
```bash
POST   /api/admin/test/run          {"suite":"","tests":[]}
GET    /api/admin/test/results/{id}
POST   /api/admin/test/coverage
```

### 21. Custom Business Logic
```bash
# Your custom endpoints created via meta-API
GET/POST/PUT/DELETE /api/admin/custom/*
```

---

## 🎯 Common Agent Tasks

### Task: "Check system health"
```bash
curl -X GET http://localhost:5000/api/admin/system/health \
  -H "Authorization: Bearer YOUR_KEY"
```

### Task: "Get all high-value leads"
```bash
curl -X POST http://localhost:5000/api/admin/db/query \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM leads WHERE score >= 8 ORDER BY created_at DESC"}'
```

### Task: "Send email to a lead"
```bash
curl -X POST http://localhost:5000/api/admin/email/send \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "client@example.com", "subject": "Follow-up", "body": "Message content"}'
```

### Task: "Create a webhook for new leads"
```bash
curl -X POST http://localhost:5000/api/admin/webhooks/create \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-endpoint.com/webhook", "events": ["lead.created"], "active": true}'
```

### Task: "Schedule a daily report"
```bash
curl -X POST http://localhost:5000/api/admin/jobs/create \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "daily_report", "cron": "0 9 * * *", "handler": "generateDailyReport"}'
```

### Task: "Export leads to CSV"
```bash
# First create the custom endpoint
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/export-csv",
    "handler": "const leads=storage.getLeads();const csv=\"Name,Email,Score\\n\"+leads.map(l=>`${l.name},${l.email},${l.score}`).join(\"\\n\");res.setHeader(\"Content-Type\",\"text/csv\");res.send(csv);"
  }'
```

### Task: "Connect Stripe integration"
```bash
curl -X POST http://localhost:5000/api/admin/integrations/connect \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"service": "stripe", "config": {"apiKey": "sk_test_...", "webhookSecret": "whsec_..."}}'
```

### Task: "Check environment variables"
```bash
curl -X GET http://localhost:5000/api/admin/env/list?showSensitive=false \
  -H "Authorization: Bearer YOUR_KEY"
```

### Task: "Update configuration"
```bash
curl -X POST http://localhost:5000/api/admin/config/update \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"updates": {"maintenanceMode": false, "leadScoreThreshold": 7}, "persist": true}'
```

### Task: "Search files for specific content"
```bash
curl -X POST http://localhost:5000/api/admin/files/search \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "TODO", "path": "./", "filePattern": "*.ts"}'
```

---

## 💡 Pro Tips

1. **Parallel Operations**: Many endpoints can be called in parallel for efficiency
2. **Pagination**: Use `?limit=X&offset=Y` on list endpoints
3. **Filtering**: Most GET endpoints support query parameters for filtering
4. **Error Handling**: Always check `success` field in responses
5. **Activity Logging**: All actions are logged for audit trails
6. **Rate Limiting**: Default 1000 requests/hour per API key
7. **Batch Operations**: Many endpoints support arrays for batch processing
8. **Webhooks**: Set up webhooks to avoid polling for updates
9. **Caching**: Use cache endpoints to improve performance
10. **Testing**: Always test in development before production

---

## 🔍 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (check your parameters)
- `401` - Unauthorized (check API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `429` - Rate Limited
- `500` - Server Error
- `503` - Service Unavailable (maintenance mode)

---

## 🛠️ Debugging

### Enable Debug Mode
```bash
curl -X POST http://localhost:5000/api/admin/config/update \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"updates": {"debugMode": true}}'
```

### Check Recent Activity
```bash
curl -X GET http://localhost:5000/api/admin/auth/activity?limit=10 \
  -H "Authorization: Bearer YOUR_KEY"
```

### View System Logs
```bash
curl -X GET http://localhost:5000/api/admin/system/logs?limit=50 \
  -H "Authorization: Bearer YOUR_KEY"
```

---

**Remember:** All endpoints require the Bearer token in the Authorization header!
