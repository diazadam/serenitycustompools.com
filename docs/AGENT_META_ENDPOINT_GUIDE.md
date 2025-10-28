# 🤖 Agent Meta-Endpoint Developer Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Programming Capabilities](#programming-capabilities)
5. [Templates & Examples](#templates--examples)
6. [Database Access](#database-access)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Your API Key
```
U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE
```

### ⚠️ Important Note
Currently, newly created endpoints require a server restart to become fully active. After creating an endpoint, it will be stored and tracked but may return "Endpoint requires server restart to activate" until the next restart. The endpoint configuration is preserved and will work after restart.

### Creating Your First Endpoint (30 seconds)
```bash
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer U9XRq0TsmaoTie6F2zTuLavTGLfSW5pTOQJIORoJE" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/my-first-endpoint",
    "description": "My first custom endpoint",
    "handler": "res.json({ success: true, message: \"Hello from my custom endpoint!\", timestamp: new Date() });",
    "requiresAuth": true
  }'
```

Your endpoint is now live at: `GET /api/admin/custom/my-first-endpoint`

---

## Core Concepts

### What Are Meta-Endpoints?
Meta-endpoints are dynamically created API endpoints that you can build, modify, and delete at runtime without deploying code. Think of them as "programmable API routes" that extend the system's capabilities on demand.

### Key Rules
1. **Path Prefix**: All custom endpoints MUST start with `/api/admin/custom/`
2. **Methods**: Supports GET, POST, PUT, DELETE, PATCH
3. **Language**: JavaScript (Node.js runtime)
4. **Persistence**: In-memory (cleared on server restart)
5. **Execution**: Immediate (no restart required for new endpoints)

---

## API Reference

### 1️⃣ CREATE - Make a New Endpoint
```http
POST /api/admin/endpoints/create
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "/api/admin/custom/your-endpoint",
  "description": "What this endpoint does",
  "handler": "JavaScript code as string",
  "requiresAuth": true|false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Custom endpoint created successfully",
  "endpoint": {
    "id": "GET_/api/admin/custom/your-endpoint",
    "method": "GET",
    "path": "/api/admin/custom/your-endpoint",
    "description": "What this endpoint does",
    "requiresAuth": true
  }
}
```

### 2️⃣ LIST - See All Your Endpoints
```http
GET /api/admin/endpoints/list
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "endpoints": [
    {
      "id": "GET_/api/admin/custom/example",
      "method": "GET",
      "path": "/api/admin/custom/example",
      "description": "Example endpoint",
      "created": "2025-10-28T08:00:00Z",
      "updated": "2025-10-28T08:00:00Z",
      "executionCount": 5,
      "lastExecuted": "2025-10-28T08:30:00Z",
      "requiresAuth": true
    }
  ],
  "total": 1
}
```

### 3️⃣ UPDATE - Modify Existing Endpoint
```http
PUT /api/admin/endpoints/update
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/admin/custom/your-endpoint",
  "description": "Updated description",
  "handler": "Updated JavaScript code",
  "requiresAuth": false
}
```

### 4️⃣ DELETE - Remove an Endpoint
```http
DELETE /api/admin/endpoints/{method}/{path}
Authorization: Bearer YOUR_API_KEY
```

Example: `DELETE /api/admin/endpoints/GET/example`

### 5️⃣ GET DETAILS - View Endpoint Code
```http
GET /api/admin/endpoints/{method}/{path}
Authorization: Bearer YOUR_API_KEY
```

---

## Programming Capabilities

### Available Context Variables
Your handler code has access to these pre-defined variables:

| Variable | Description | Example Usage |
|----------|-------------|---------------|
| `req` | Express request object | `req.method`, `req.url` |
| `res` | Express response object | `res.json()`, `res.send()` |
| `body` | Parsed request body | `const { name, email } = body;` |
| `query` | Query parameters | `const page = query.page || 1;` |
| `params` | Route parameters | `const id = params.id;` |
| `headers` | Request headers | `headers['user-agent']` |
| `storage` | App storage interface | `storage.getLeads()` |
| `fs` | File system module | `fs.readFileSync()` |
| `path` | Path module | `path.join()` |
| `process.env` | Environment variables | `process.env.NODE_ENV` |
| `console` | Console for logging | `console.log()` |
| `logActivity()` | Activity logger | `logActivity('ACTION', details)` |
| All JS built-ins | Date, Math, JSON, etc. | `new Date()`, `Math.random()` |

### What You CAN Do ✅
- Write any JavaScript code
- Access the database via `storage`
- Read/write files
- Make calculations
- Transform data
- Call other APIs (using fetch)
- Set response headers
- Handle different HTTP methods
- Access environment variables
- Log activities

### What You CANNOT Do ❌
- Import external modules (use built-ins only)
- Install new npm packages
- Access modules not in context
- Execute shell commands
- Modify the server configuration
- Access other endpoints' handlers directly

---

## Templates & Examples

### Template 1: Basic GET Endpoint
```javascript
// Simple data retrieval
const data = {
  status: "operational",
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || "development"
};
res.json({ success: true, data });
```

### Template 2: POST with Data Processing
```javascript
// Process incoming data
const { name, email, score } = body;

// Validation
if (!name || !email) {
  return res.status(400).json({ 
    success: false, 
    error: "Name and email required" 
  });
}

// Business logic
const processedData = {
  name: name.trim().toUpperCase(),
  email: email.toLowerCase(),
  score: Math.min(10, Math.max(0, score || 5)),
  processed_at: new Date()
};

// Log activity
logActivity("DATA_PROCESSED", processedData);

// Return response
res.json({ 
  success: true, 
  result: processedData 
});
```

### Template 3: Database Query
```javascript
// Get leads from storage
const leads = storage.getLeads();

// Filter and transform
const qualifiedLeads = leads
  .filter(lead => lead.score >= 7)
  .map(lead => ({
    id: lead.id,
    name: lead.name,
    score: lead.score,
    qualified: true
  }));

res.json({ 
  success: true, 
  total: qualifiedLeads.length,
  leads: qualifiedLeads 
});
```

### Template 4: File Operations
```javascript
// Read a configuration file
try {
  const configPath = path.join(process.cwd(), "config.json");
  const configData = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(configData);
  
  res.json({ 
    success: true, 
    config 
  });
} catch (error) {
  res.status(500).json({ 
    success: false, 
    error: error.message 
  });
}
```

### Template 5: Aggregation & Analytics
```javascript
// Complex analytics query
const leads = storage.getLeads();
const now = new Date();
const dayAgo = new Date(now - 86400000);

const analytics = {
  total_leads: leads.length,
  recent_leads: leads.filter(l => new Date(l.created_at) > dayAgo).length,
  average_score: leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length || 0,
  by_source: leads.reduce((acc, l) => {
    acc[l.source || "unknown"] = (acc[l.source || "unknown"] || 0) + 1;
    return acc;
  }, {}),
  high_value: leads.filter(l => l.score >= 8).length,
  conversion_ready: leads.filter(l => l.score >= 7 && l.email_verified).length
};

res.json({ 
  success: true, 
  analytics,
  generated_at: now 
});
```

### Template 6: Webhook Handler
```javascript
// Handle incoming webhook
const { event, data, signature } = body;

// Verify webhook (example)
if (!signature || signature !== "expected_signature") {
  return res.status(401).json({ 
    success: false, 
    error: "Invalid signature" 
  });
}

// Process based on event type
switch(event) {
  case "payment.success":
    logActivity("PAYMENT_RECEIVED", data);
    // Process payment...
    res.json({ success: true, processed: true });
    break;
    
  case "user.signup":
    logActivity("NEW_USER", data);
    // Create user...
    res.json({ success: true, user_created: true });
    break;
    
  default:
    res.status(400).json({ 
      success: false, 
      error: "Unknown event type" 
    });
}
```

### Template 7: CSV Export
```javascript
// Export data as CSV
const leads = storage.getLeads();

// Build CSV
const headers = ["Name", "Email", "Phone", "Score", "Created"];
const rows = leads.map(lead => [
  lead.name || "",
  lead.email || "",
  lead.phone || "",
  lead.score || 0,
  lead.created_at || ""
]);

const csv = [
  headers.join(","),
  ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
].join("\\n");

// Set headers for download
res.setHeader("Content-Type", "text/csv");
res.setHeader("Content-Disposition", "attachment; filename=leads_export.csv");
res.send(csv);
```

---

## Database Access

### Available Storage Methods
The `storage` object provides these methods:

```javascript
// Leads
storage.getLeads()           // Get all leads
storage.getLead(id)          // Get single lead
storage.createLead(data)     // Create new lead
storage.updateLead(id, data) // Update lead
storage.deleteLead(id)       // Delete lead

// Chat Messages
storage.getChatMessages()     // Get all messages
storage.saveChatMessage(msg)  // Save message

// Email Threads
storage.getEmailThreads()     // Get threads
storage.getEmailThread(id)    // Get single thread

// Voice Calls
storage.getVoiceCalls()       // Get all calls
storage.saveVoiceCall(data)   // Save call data
```

### Example: Complex Database Operation
```javascript
// Get and analyze leads
const leads = storage.getLeads();
const emailThreads = storage.getEmailThreads();

// Join data
const enrichedLeads = leads.map(lead => {
  const threads = emailThreads.filter(t => t.lead_id === lead.id);
  return {
    ...lead,
    email_count: threads.length,
    last_contact: threads[0]?.updated_at || null,
    engagement_score: threads.reduce((sum, t) => sum + (t.emails?.length || 0), 0)
  };
});

// Sort by engagement
enrichedLeads.sort((a, b) => b.engagement_score - a.engagement_score);

res.json({ 
  success: true, 
  leads: enrichedLeads.slice(0, 10) // Top 10
});
```

---

## Best Practices

### 1. Error Handling
Always wrap complex logic in try-catch:
```javascript
try {
  // Your logic here
  const result = complexOperation();
  res.json({ success: true, result });
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ 
    success: false, 
    error: error.message 
  });
}
```

### 2. Input Validation
Validate all inputs:
```javascript
// Check required fields
if (!body.email || !body.name) {
  return res.status(400).json({ 
    success: false, 
    error: "Missing required fields" 
  });
}

// Validate format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(body.email)) {
  return res.status(400).json({ 
    success: false, 
    error: "Invalid email format" 
  });
}
```

### 3. Performance
For large datasets, implement pagination:
```javascript
const page = parseInt(query.page) || 1;
const limit = parseInt(query.limit) || 10;
const offset = (page - 1) * limit;

const allItems = storage.getLeads();
const paginatedItems = allItems.slice(offset, offset + limit);

res.json({ 
  success: true,
  data: paginatedItems,
  pagination: {
    page,
    limit,
    total: allItems.length,
    pages: Math.ceil(allItems.length / limit)
  }
});
```

### 4. Security
- Always use `requiresAuth: true` for sensitive endpoints
- Sanitize user inputs
- Don't expose sensitive data
- Log important activities

### 5. Naming Conventions
- Use descriptive paths: `/api/admin/custom/lead-analytics` not `/api/admin/custom/la`
- Use kebab-case for URLs
- Be consistent with HTTP methods (GET for reading, POST for creating, etc.)

---

## Troubleshooting

### Common Issues & Solutions

**Issue: "Endpoint already exists"**
```bash
# Solution: Delete first, then recreate
curl -X DELETE "/api/admin/endpoints/GET/your-endpoint" -H "Authorization: Bearer YOUR_KEY"
curl -X POST "/api/admin/endpoints/create" ... # Then create
```

**Issue: "Handler execution failed"**
- Check your JavaScript syntax
- Ensure all variables are defined
- Look for typos in property names
- Check that you're not using undefined modules

**Issue: "Unauthorized"**
- Verify your API key is correct
- Check the `Authorization` header format: `Bearer YOUR_KEY`
- Ensure `requiresAuth` setting matches your request

**Issue: "Endpoint not found"**
- Verify the path starts with `/api/admin/custom/`
- Check the HTTP method matches
- List all endpoints to verify it exists

### Debug Template
Use this for debugging:
```javascript
console.log("=== Debug Info ===");
console.log("Method:", req.method);
console.log("Path:", req.path);
console.log("Body:", JSON.stringify(body, null, 2));
console.log("Query:", query);
console.log("Headers:", headers);

try {
  // Your logic here
  const result = { test: "success" };
  console.log("Result:", result);
  res.json({ success: true, result });
} catch (error) {
  console.error("ERROR:", error);
  res.status(500).json({ 
    success: false, 
    error: error.message,
    stack: error.stack 
  });
}
```

---

## Advanced Examples

### Multi-Step Data Pipeline
```javascript
// Step 1: Fetch data
const leads = storage.getLeads();
const threads = storage.getEmailThreads();

// Step 2: Transform
const pipeline = leads
  .filter(lead => lead.score >= 5)
  .map(lead => {
    const leadThreads = threads.filter(t => t.lead_id === lead.id);
    return {
      id: lead.id,
      name: lead.name,
      score: lead.score,
      emails_sent: leadThreads.reduce((sum, t) => sum + (t.emails?.length || 0), 0),
      last_activity: leadThreads[0]?.updated_at || lead.created_at
    };
  })
  .filter(lead => lead.emails_sent > 0)
  .sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));

// Step 3: Aggregate
const summary = {
  total_qualified: pipeline.length,
  total_emails: pipeline.reduce((sum, l) => sum + l.emails_sent, 0),
  average_score: pipeline.reduce((sum, l) => sum + l.score, 0) / pipeline.length || 0,
  most_engaged: pipeline[0] || null
};

// Step 4: Return results
res.json({ 
  success: true, 
  summary,
  top_leads: pipeline.slice(0, 5),
  generated_at: new Date()
});
```

### Dynamic Report Generator
```javascript
// Accept report parameters
const { 
  report_type = "summary",
  date_range = "7d",
  format = "json" 
} = body;

// Calculate date range
const now = new Date();
const ranges = {
  "1d": 86400000,
  "7d": 604800000,
  "30d": 2592000000
};
const cutoff = new Date(now - (ranges[date_range] || ranges["7d"]));

// Get data
const leads = storage.getLeads()
  .filter(l => new Date(l.created_at) >= cutoff);

// Generate report based on type
let report;
switch(report_type) {
  case "summary":
    report = {
      total: leads.length,
      average_score: leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length || 0,
      by_source: leads.reduce((acc, l) => {
        acc[l.source || "direct"] = (acc[l.source || "direct"] || 0) + 1;
        return acc;
      }, {})
    };
    break;
    
  case "detailed":
    report = leads.map(l => ({
      id: l.id,
      name: l.name,
      email: l.email,
      score: l.score,
      created: l.created_at,
      days_ago: Math.floor((now - new Date(l.created_at)) / 86400000)
    }));
    break;
    
  default:
    return res.status(400).json({ 
      success: false, 
      error: "Invalid report type" 
    });
}

// Format output
if (format === "csv" && Array.isArray(report)) {
  const csv = [
    Object.keys(report[0]).join(","),
    ...report.map(row => Object.values(row).join(","))
  ].join("\\n");
  
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=report_${date_range}.csv`);
  res.send(csv);
} else {
  res.json({ 
    success: true, 
    report,
    parameters: { report_type, date_range, format },
    generated_at: now
  });
}
```

---

## Quick Reference Card

### Create Endpoint
```bash
curl -X POST localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","path":"/api/admin/custom/test","handler":"res.json({ok:true});"}'
```

### List All
```bash
curl localhost:5000/api/admin/endpoints/list \
  -H "Authorization: Bearer YOUR_KEY"
```

### Update
```bash
curl -X PUT localhost:5000/api/admin/endpoints/update \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","path":"/api/admin/custom/test","handler":"res.json({updated:true});"}'
```

### Delete
```bash
curl -X DELETE localhost:5000/api/admin/endpoints/GET/test \
  -H "Authorization: Bearer YOUR_KEY"
```

### Test Your Endpoint
```bash
curl localhost:5000/api/admin/custom/test \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## Remember
- ✅ Endpoints work immediately after creation
- ✅ Use JavaScript for handler code
- ✅ Access storage, files, and environment
- ✅ Full control over request/response
- ⚠️ Endpoints are cleared on server restart
- ⚠️ Always prefix paths with `/api/admin/custom/`
- ⚠️ Test your handlers before production use

---

**You now have the power to extend the API infinitely. Build whatever you need!**
