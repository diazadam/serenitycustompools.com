# Admin API Documentation

## Overview
The Admin API provides complete programmatic control over your Serenity Custom Pools webapp. This API is designed for use by your coding agents (Claude, etc.) to automate tasks and manage your application.

## Authentication
All admin API endpoints require Bearer token authentication using the `ADMIN_API_KEY` environment variable.

### API Key
Your API key has been generated and stored as an environment variable. Use it in the Authorization header for all requests.

**Important:** Keep your API key secure and never share it publicly.

### Authentication Header Format
```
Authorization: Bearer YOUR_API_KEY
```

## Base URL
- Development: `http://localhost:5000/api/admin`
- Production: `https://yourdomain.com/api/admin`

## API Endpoints

### 1. Lead Management

#### Get All Leads
Retrieve all leads with optional filtering and pagination.

```bash
# Get all leads
curl -X GET http://localhost:5000/api/admin/leads \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get leads with filtering
curl -X GET "http://localhost:5000/api/admin/leads?filter=john&limit=10&offset=0&sortBy=createdAt&order=desc" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Query Parameters:**
- `filter` (optional): Search filter for email, name, or city
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `order` (optional): Sort order - asc or desc (default: desc)

#### Create or Update Lead
Create a new lead or update an existing one.

```bash
# Create new lead
curl -X POST http://localhost:5000/api/admin/leads \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "city": "Atlanta",
    "state": "GA",
    "projectType": "New Pool Installation",
    "budgetRange": "$50,000 - $75,000"
  }'

# Update existing lead
curl -X POST http://localhost:5000/api/admin/leads \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lead-123",
    "score": 85,
    "status": "qualified"
  }'
```

#### Delete Lead
Delete a specific lead by ID.

```bash
curl -X DELETE http://localhost:5000/api/admin/leads/lead-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Batch Operations on Leads
Perform batch updates or deletions on multiple leads.

```bash
# Batch delete leads
curl -X POST http://localhost:5000/api/admin/leads/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "delete",
    "ids": ["lead-1", "lead-2", "lead-3"]
  }'

# Batch update leads
curl -X POST http://localhost:5000/api/admin/leads/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "ids": ["lead-1", "lead-2"],
    "data": {
      "status": "contacted",
      "score": 90
    }
  }'
```

### 2. Voice Call Management

#### Get All Voice Calls
Retrieve all voice call records.

```bash
curl -X GET http://localhost:5000/api/admin/voice-calls \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Campaign Management

#### Get All Campaigns
Retrieve all email campaigns.

```bash
curl -X GET http://localhost:5000/api/admin/campaigns \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Trigger Campaign for Lead
Enroll a lead in an automated email campaign.

```bash
curl -X POST http://localhost:5000/api/admin/campaigns/trigger \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-123"
  }'
```

#### Get Campaign Status
Check the status of the campaign processor.

```bash
curl -X GET http://localhost:5000/api/admin/campaigns/status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 4. File System Management

#### Read File
Read any file from the project.

```bash
curl -X GET http://localhost:5000/api/admin/files/client/src/pages/home.tsx \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Write/Update File
Write or update any file in the project.

```bash
curl -X PUT http://localhost:5000/api/admin/files/client/src/pages/home.tsx \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "// Your updated file content here\nimport React from \"react\";\n..."
  }'
```

#### Delete File
Delete a file from the project.

```bash
curl -X DELETE http://localhost:5000/api/admin/files/temp/test.txt \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### List Directory Contents
List files and directories in a specific path.

```bash
curl -X GET http://localhost:5000/api/admin/directory/client/src/pages \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 5. System Control

#### Execute Shell Commands
Execute safe shell commands (limited to allowed commands).

```bash
curl -X POST http://localhost:5000/api/admin/system/exec \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "npm run build",
    "timeout": 30000
  }'
```

**Allowed Commands:**
- `npm run` commands
- `ls`, `pwd`
- `node -v`, `npm -v`
- `git status`, `git log`

#### Get Environment Variables
Get non-sensitive environment variables.

```bash
curl -X GET http://localhost:5000/api/admin/system/env \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 6. Analytics & Reporting

#### Get Comprehensive Analytics
Get detailed analytics about leads, campaigns, and conversions.

```bash
curl -X GET http://localhost:5000/api/admin/analytics \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response includes:**
- Total counts (leads, voice calls, campaigns, emails sent)
- Recent activity (last 7 and 30 days)
- Lead sources breakdown
- Leads by city
- Campaign metrics

### 7. Health Check

#### System Health Check
Check the health status of the system.

```bash
curl -X GET http://localhost:5000/api/admin/health \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Example Automation Scenarios

### Scenario 1: Daily Lead Report
Get all leads from the last 24 hours and generate a summary.

```bash
# Get recent leads
curl -X GET "http://localhost:5000/api/admin/leads?sortBy=createdAt&order=desc&limit=100" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  | jq '.data[] | select(.createdAt > (now - 86400))'
```

### Scenario 2: Bulk Lead Qualification
Update scores for multiple leads based on criteria.

```bash
# Update high-value leads
curl -X POST http://localhost:5000/api/admin/leads/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "ids": ["lead-1", "lead-2", "lead-3"],
    "data": {
      "score": 95,
      "priority": "high",
      "status": "qualified"
    }
  }'
```

### Scenario 3: Update Website Content
Modify a page on the website programmatically.

```bash
# Read current content
curl -X GET http://localhost:5000/api/admin/files/client/src/pages/home.tsx \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -o home-backup.tsx

# Update with new content
curl -X PUT http://localhost:5000/api/admin/files/client/src/pages/home.tsx \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "// Updated content here..."
  }'
```

### Scenario 4: Campaign Automation
Automatically enroll qualified leads in campaigns.

```bash
# Get high-score leads
LEADS=$(curl -X GET http://localhost:5000/api/admin/leads \
  -H "Authorization: Bearer YOUR_API_KEY" \
  | jq '.data[] | select(.score >= 80) | .id')

# Enroll each in campaign
for LEAD_ID in $LEADS; do
  curl -X POST http://localhost:5000/api/admin/campaigns/trigger \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"leadId\": \"$LEAD_ID\"}"
done
```

## Rate Limiting and Best Practices

1. **Rate Limiting**: The API doesn't currently have rate limiting, but be mindful of server resources.

2. **Error Handling**: Always check response status codes:
   - 200: Success
   - 401: Unauthorized (invalid API key)
   - 403: Forbidden (invalid permissions)
   - 404: Resource not found
   - 500: Server error

3. **Logging**: All admin API access is logged for security auditing.

4. **File Operations**: Be careful with file system operations as they can directly affect your application.

5. **Batch Operations**: Use batch endpoints when updating multiple records to improve performance.

## Security Considerations

1. **Never expose your API key** in client-side code or public repositories.
2. **Use HTTPS** in production to encrypt API requests.
3. **Rotate your API key** periodically for security.
4. **Monitor API logs** regularly for suspicious activity.
5. **Backup your data** before performing bulk operations.

## Integration with Claude Code Agent

To use this API with your Claude coding agent, provide it with:

1. The API key (stored securely)
2. The base URL of your application
3. This documentation

Example instructions for Claude:
```
You have access to my webapp's admin API. The base URL is http://localhost:5000 and the API key is stored in ADMIN_API_KEY environment variable. Use the admin API endpoints to manage leads, update content, and automate tasks as needed. Always use Bearer token authentication.
```

## Support

For issues or questions about the Admin API:
1. Check the server logs for detailed error messages
2. Verify your API key is correctly configured
3. Ensure the server is running and accessible

## Direct Database Access

These endpoints provide direct SQL access to the PostgreSQL database. Use with caution as they allow full database manipulation.

### 11.1 Run Read-Only Query

Execute SELECT queries and other read-only operations.

```bash
# Simple query
curl -X GET "http://localhost:5000/api/admin/db/query?sql=SELECT%20*%20FROM%20leads%20LIMIT%205" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Query with WHERE clause
curl -X GET "http://localhost:5000/api/admin/db/query?sql=SELECT%20*%20FROM%20leads%20WHERE%20score%20>%2080" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Count query
curl -X GET "http://localhost:5000/api/admin/db/query?sql=SELECT%20COUNT(*)%20FROM%20voice_calls" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 11.2 Execute Any SQL

Run INSERT, UPDATE, DELETE, and other write operations. Supports parameterized queries for safety.

```bash
# Update with parameters (recommended)
curl -X POST http://localhost:5000/api/admin/db/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE leads SET status = $1, score = $2 WHERE id = $3",
    "params": ["qualified", 95, "lead-123"]
  }'

# Insert new record
curl -X POST http://localhost:5000/api/admin/db/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "INSERT INTO leads (id, first_name, last_name, email) VALUES ($1, $2, $3, $4)",
    "params": ["new-lead-1", "John", "Doe", "john@example.com"]
  }'

# Delete records
curl -X POST http://localhost:5000/api/admin/db/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DELETE FROM leads WHERE source = $1",
    "params": ["test-seed"]
  }'
```

### 11.3 Get Database Schema

Retrieve the complete database schema including all tables and their columns.

```bash
curl -X GET http://localhost:5000/api/admin/db/schema \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response includes:**
- Table names
- Column names and types
- Nullable constraints
- Default values
- Character limits

### 11.4 Database Backup

Create a JSON backup of all database tables.

```bash
curl -X POST http://localhost:5000/api/admin/db/backup \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "filename": "db-backup-1698765432100.json",
  "tables": ["leads", "voice_calls", "campaigns"],
  "totalRecords": 156
}
```

### 11.5 Seed Test Data

Populate the database with test data for development and testing.

```bash
# Seed with default count (10 records)
curl -X POST http://localhost:5000/api/admin/db/seed \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Seed with custom count
curl -X POST http://localhost:5000/api/admin/db/seed \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20
  }'
```

**Creates:**
- Test leads with realistic data
- Voice call records with transcripts
- Sample metadata and timestamps

## Database Query Examples

### Find High-Value Leads
```bash
curl -X GET "http://localhost:5000/api/admin/db/query?sql=SELECT%20*%20FROM%20leads%20WHERE%20budget_range%20=%20'%24100k%2B'%20ORDER%20BY%20created_at%20DESC" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Get Recent Voice Calls
```bash
curl -X GET "http://localhost:5000/api/admin/db/query?sql=SELECT%20id,%20session_id,%20duration,%20call_date%20FROM%20voice_calls%20WHERE%20call_date%20>%20CURRENT_DATE%20-%20INTERVAL%20'7%20days'" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Update Lead Scores in Bulk
```bash
curl -X POST http://localhost:5000/api/admin/db/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "UPDATE leads SET score = CASE WHEN budget_range = '\''$100k+'\'' THEN 90 WHEN budget_range = '\''$75k-$100k'\'' THEN 75 ELSE 50 END WHERE project_type = '\''pool_installation'\''"
  }'
```

### Clean Test Data
```bash
curl -X POST http://localhost:5000/api/admin/db/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DELETE FROM leads WHERE id LIKE '\''test-%'\''"
  }'
```

## Database Safety Guidelines

1. **Always use parameterized queries** when working with user input to prevent SQL injection.
2. **Test queries on development** database before running on production.
3. **Create backups** before running DELETE or UPDATE operations.
4. **Monitor query performance** - avoid queries that scan entire tables without indexes.
5. **Use transactions** for multi-step operations that need to be atomic.

## Code Deployment & Hot Reloading

These endpoints allow live code updates without touching the Replit IDE. Your coding agents can deploy code changes directly.

### 12.1 Deploy Single File

Upload or update a single file in the project.

```bash
# Deploy a TypeScript file
curl -X POST http://localhost:5000/api/admin/deploy/file \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "client/src/components/NewComponent.tsx",
    "content": "import React from \"react\";\n\nexport function NewComponent() {\n  return <div>Hello from API</div>;\n}"
  }'

# Deploy a binary file (base64 encoded)
curl -X POST http://localhost:5000/api/admin/deploy/file \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "public/logo.png",
    "content": "iVBORw0KGgoAAAANS...",
    "encoding": "base64"
  }'
```

### 12.2 Deploy Multiple Files

Update multiple files in a single request.

```bash
curl -X POST http://localhost:5000/api/admin/deploy/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "path": "client/src/pages/page1.tsx",
        "content": "// Page 1 content"
      },
      {
        "path": "client/src/pages/page2.tsx",
        "content": "// Page 2 content"
      },
      {
        "path": "server/routes/new-route.ts",
        "content": "// New API route"
      }
    ]
  }'
```

### 12.3 Restart Application

Trigger an application restart to reload changes.

```bash
# Immediate restart
curl -X POST http://localhost:5000/api/admin/deploy/restart \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Delayed restart (3 seconds)
curl -X POST http://localhost:5000/api/admin/deploy/restart \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "delay": 3000
  }'
```

### 12.4 View Deployment Logs

Get recent deployment activity and process information.

```bash
# Get all logs
curl -X GET http://localhost:5000/api/admin/deploy/logs \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get last 50 entries
curl -X GET "http://localhost:5000/api/admin/deploy/logs?lines=50" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get only deployment logs
curl -X GET "http://localhost:5000/api/admin/deploy/logs?type=deployment" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 12.5 Rollback to Previous Version

Restore previous versions using backups.

```bash
# List available backups
curl -X POST http://localhost:5000/api/admin/deploy/rollback \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "backup"
  }'

# Restore specific backup
curl -X POST http://localhost:5000/api/admin/deploy/rollback \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "backup",
    "target": "backup-1698765432100.json"
  }'
```

## Deployment Examples for Coding Agents

### Example 1: Update React Component
```bash
# 1. Read current component
curl -X GET http://localhost:5000/api/admin/files/client/src/components/Hero.tsx \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -o hero-backup.tsx

# 2. Deploy updated component
curl -X POST http://localhost:5000/api/admin/deploy/file \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "client/src/components/Hero.tsx",
    "content": "// Updated Hero component with new features..."
  }'

# 3. Restart to see changes
curl -X POST http://localhost:5000/api/admin/deploy/restart \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Example 2: Add New API Endpoint
```bash
# Deploy new API route and restart
curl -X POST http://localhost:5000/api/admin/deploy/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "path": "server/routes/custom-api.ts",
        "content": "import { Express } from \"express\";\n\nexport function setupCustomAPI(app: Express) {\n  app.get(\"/api/custom\", (req, res) => {\n    res.json({ message: \"Custom API endpoint\" });\n  });\n}"
      }
    ]
  }' && \
curl -X POST http://localhost:5000/api/admin/deploy/restart \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Example 3: Emergency Rollback with Backups
```bash
# Create a backup first
curl -X POST http://localhost:5000/api/admin/backup \
  -H "Authorization: Bearer YOUR_API_KEY"

# If something goes wrong, restore from backup
curl -X POST http://localhost:5000/api/admin/deploy/rollback \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "backup",
    "target": "backup-TIMESTAMP.json"
  }'
```

## Deployment Safety Notes

1. **File Path Security**: Paths are sanitized to prevent directory traversal
2. **Automatic Restart**: Replit will automatically restart the app after file changes
3. **Backup Before Deploy**: Consider creating backups before major deployments
4. **Test in Development**: Test deployments before pushing to production
5. **Monitor Logs**: Check deployment logs after changes to ensure success

## AI Agent Management

These endpoints allow your coding agents to register, manage, and orchestrate other AI agents and automations.

### 13.1 Register New AI Agent

Install and configure a new AI agent in the system.

```bash
curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Qualifier Bot",
    "type": "openai",
    "description": "Automatically qualifies leads using GPT-4",
    "config": {
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 500
    },
    "triggers": ["new_lead", "form_submission"],
    "capabilities": ["lead_scoring", "qualification", "email_generation"],
    "apiKeys": {
      "openai": "sk-your-api-key"
    },
    "schedule": "0 */2 * * *"
  }'
```

**Agent Types:**
- `openai` - OpenAI GPT models
- `gemini` - Google Gemini models
- `claude` - Anthropic Claude models
- `webhook` - External webhook integration
- `custom` - Custom logic implementation

### 13.2 List All Agents

Get all registered agents with their status and execution history.

```bash
# List all agents
curl -X GET http://localhost:5000/api/admin/agents/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl -X GET "http://localhost:5000/api/admin/agents/list?status=active" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by type
curl -X GET "http://localhost:5000/api/admin/agents/list?type=openai" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 13.3 Trigger Agent Manually

Run an agent on-demand with custom input.

```bash
curl -X POST http://localhost:5000/api/admin/agents/trigger \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-1234567890",
    "input": "Process this lead: John Doe, $100k budget",
    "context": {
      "leadId": "lead-456",
      "source": "manual"
    },
    "parameters": {
      "priority": "high",
      "scoreThreshold": 80
    }
  }'
```

### 13.4 Update Agent Configuration

Modify agent settings, triggers, or capabilities.

```bash
curl -X PUT http://localhost:5000/api/admin/agents/agent-1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "config": {
      "model": "gpt-4-turbo",
      "temperature": 0.8
    },
    "status": "paused",
    "triggers": ["new_lead", "lead_updated"],
    "schedule": "0 8,12,16 * * *"
  }'
```

**Updatable Fields:**
- `name` - Agent display name
- `description` - Agent description
- `config` - Model and execution settings
- `triggers` - Events that activate the agent
- `capabilities` - What the agent can do
- `apiKeys` - External service credentials
- `schedule` - Cron schedule for automatic runs
- `status` - `active`, `paused`, or `inactive`

### 13.5 Delete Agent

Remove an agent from the system.

```bash
curl -X DELETE http://localhost:5000/api/admin/agents/agent-1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 13.6 Get Agent Execution History

View an agent's recent activity and performance.

```bash
# Get last 50 executions
curl -X GET http://localhost:5000/api/admin/agents/agent-1234567890/executions \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get last 100 executions
curl -X GET "http://localhost:5000/api/admin/agents/agent-1234567890/executions?limit=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Agent Automation Examples

### Example 1: Create Lead Scoring Agent
```bash
curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smart Lead Scorer",
    "type": "openai",
    "description": "Scores leads based on multiple factors",
    "config": {
      "model": "gpt-4",
      "temperature": 0.3,
      "systemPrompt": "You are a lead scoring expert. Rate leads 0-100."
    },
    "triggers": ["new_lead", "lead_updated"],
    "capabilities": ["scoring", "qualification", "prioritization"]
  }'
```

### Example 2: Create Email Campaign Agent
```bash
curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Campaign Manager",
    "type": "gemini",
    "description": "Manages drip campaigns",
    "config": {
      "model": "gemini-pro"
    },
    "triggers": ["lead_qualified"],
    "capabilities": ["email_campaigns", "follow_ups"],
    "schedule": "0 9 * * *"
  }'
```

### Example 3: Chain Multiple Agents
```bash
# Step 1: Register data collection agent
COLLECTOR_ID=$(curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Collector",
    "type": "webhook",
    "config": {
      "webhookUrl": "https://api.example.com/collect"
    }
  }' | jq -r '.agent.id')

# Step 2: Register processor agent
PROCESSOR_ID=$(curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Processor",
    "type": "openai",
    "triggers": ["data_collected"]
  }' | jq -r '.agent.id')

# Step 3: Trigger collector which triggers processor
curl -X POST http://localhost:5000/api/admin/agents/trigger \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\": \"$COLLECTOR_ID\", \"input\": \"Start collection\"}"
```

### Example 4: Schedule Automated Reports
```bash
curl -X POST http://localhost:5000/api/admin/agents/register \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Report Generator",
    "type": "custom",
    "description": "Generates daily performance reports",
    "config": {
      "reportType": "daily_summary",
      "recipients": ["admin@example.com"]
    },
    "capabilities": ["reporting", "analytics"],
    "schedule": "0 18 * * *"
  }'
```

## Agent Management Best Practices

1. **Agent Naming**: Use descriptive names that explain the agent's purpose
2. **Error Handling**: Always check execution history for failures
3. **API Key Security**: Store API keys securely and rotate regularly
4. **Rate Limiting**: Be mindful of API rate limits for external services
5. **Monitoring**: Regularly check agent execution logs
6. **Testing**: Test agents with manual triggers before scheduling
7. **Chaining**: Design agents to work together for complex workflows

## Meta-Agent Capabilities

Your coding agents can now:
- **Create specialized agents** for specific tasks
- **Orchestrate multi-agent workflows**
- **Update agent behaviors** based on performance
- **Monitor and optimize** agent operations
- **Build self-improving systems** that adapt over time

## 14. Webhook System

Set up webhook listeners to respond to external events in real-time.

### 14.1 Create Webhook Listener

Register a webhook endpoint to receive external events.

```bash
curl -X POST http://localhost:5000/api/admin/webhooks/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Processor",
    "url": "https://example.com/payment-webhook",
    "events": ["payment.received", "payment.failed"],
    "headers": {
      "X-API-Key": "webhook-secret"
    },
    "retryConfig": {
      "maxRetries": 5,
      "retryDelay": 10000,
      "backoffMultiplier": 2
    }
  }'
```

**Event Types:**
- `lead.created` - New lead captured
- `lead.qualified` - Lead scored and qualified
- `form.submitted` - Form submission received
- `payment.received` - Payment processed
- `payment.failed` - Payment failed
- `email.opened` - Email opened by recipient
- `email.clicked` - Link clicked in email
- Custom events you define

### 14.2 List All Webhooks

View all configured webhooks and their status.

```bash
# List all webhooks
curl -X GET http://localhost:5000/api/admin/webhooks/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter active webhooks only
curl -X GET "http://localhost:5000/api/admin/webhooks/list?active=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 14.3 View Webhook Activity Logs

Track webhook triggers and responses.

```bash
# Get all webhook logs
curl -X GET http://localhost:5000/api/admin/webhooks/logs \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get logs for specific webhook
curl -X GET "http://localhost:5000/api/admin/webhooks/logs?webhookId=webhook-123" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl -X GET "http://localhost:5000/api/admin/webhooks/logs?status=success" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 14.4 Test Webhook

Manually trigger a webhook with test data.

```bash
curl -X POST http://localhost:5000/api/admin/webhooks/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "webhook-123",
    "testData": {
      "payment_id": "test-payment",
      "amount": 5000,
      "status": "completed"
    }
  }'
```

### 14.5 Delete Webhook

Remove a webhook listener.

```bash
curl -X DELETE http://localhost:5000/api/admin/webhooks/webhook-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 15. Scheduled Jobs/Cron

Create and manage recurring tasks that run automatically.

### 15.1 Create Scheduled Job

Set up a recurring task with cron-like scheduling.

```bash
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Lead Report",
    "schedule": "0 9 * * *",
    "task": {
      "type": "report",
      "reportType": "daily_leads"
    },
    "description": "Generate daily lead summary",
    "timezone": "America/New_York",
    "active": true
  }'
```

**Schedule Format (Cron Expression):**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 9 * * *` - Daily at 9am
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday
- `0 0 1 * *` - Monthly on the 1st

**Task Types:**
- `report` - Generate reports
- `backup` - Database backups
- `analytics` - Analytics summaries
- `cleanup` - Clean old data
- `webhook` - Call external webhook
- `custom` - Custom tasks

### 15.2 List All Scheduled Jobs

View all scheduled jobs and their status.

```bash
# List all jobs
curl -X GET http://localhost:5000/api/admin/cron/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter active jobs only
curl -X GET "http://localhost:5000/api/admin/cron/list?active=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 15.3 Run Job Immediately

Execute a scheduled job on-demand.

```bash
curl -X POST http://localhost:5000/api/admin/cron/run-now \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-123"
  }'
```

### 15.4 Update Scheduled Job

Modify job settings, schedule, or status.

```bash
curl -X PUT http://localhost:5000/api/admin/cron/job-123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 10 * * *",
    "active": false,
    "description": "Updated description"
  }'
```

### 15.5 Delete Scheduled Job

Remove a scheduled job.

```bash
curl -X DELETE http://localhost:5000/api/admin/cron/job-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 15.6 Get Job Execution History

View a job's execution history.

```bash
# Get last 50 executions
curl -X GET http://localhost:5000/api/admin/cron/job-123/executions \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get last 100 executions
curl -X GET "http://localhost:5000/api/admin/cron/job-123/executions?limit=100" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Webhook Examples

### Example 1: Stripe Payment Webhook
```bash
curl -X POST http://localhost:5000/api/admin/webhooks/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe Payment Handler",
    "url": "https://api.stripe.com/webhook",
    "events": ["payment.intent.succeeded", "payment.intent.failed"],
    "headers": {
      "Stripe-Signature": "whsec_xxx"
    },
    "retryConfig": {
      "maxRetries": 3,
      "retryDelay": 5000
    }
  }'
```

### Example 2: SendGrid Email Events
```bash
curl -X POST http://localhost:5000/api/admin/webhooks/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Event Tracker",
    "url": "https://api.sendgrid.com/v3/user/webhooks/event/settings",
    "events": ["email.opened", "email.clicked", "email.bounced"],
    "headers": {
      "Authorization": "Bearer SG.xxx"
    }
  }'
```

### Example 3: Form Submission Handler
```bash
curl -X POST http://localhost:5000/api/admin/webhooks/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Form Processor",
    "url": "https://yourapp.com/process-form",
    "events": ["form.submitted"],
    "active": true
  }'
```

## Scheduled Job Examples

### Example 1: Daily SEO Report
```bash
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SEO Performance Report",
    "schedule": "0 8 * * *",
    "task": {
      "type": "report",
      "reportType": "seo_metrics",
      "recipients": ["admin@example.com"]
    },
    "description": "Daily SEO metrics and ranking updates",
    "timezone": "America/New_York"
  }'
```

### Example 2: Weekly Database Backup
```bash
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Full Backup",
    "schedule": "0 2 * * 0",
    "task": {
      "type": "backup",
      "destination": "s3://backups/weekly/"
    },
    "description": "Complete database backup every Sunday at 2am"
  }'
```

### Example 3: Monthly Analytics Summary
```bash
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Analytics",
    "schedule": "0 0 1 * *",
    "task": {
      "type": "analytics",
      "metrics": ["leads", "conversions", "revenue"]
    },
    "description": "Monthly performance metrics"
  }'
```

### Example 4: Auto-Publish Scheduled Content
```bash
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Content Publisher",
    "schedule": "0 10 * * 1-5",
    "task": {
      "type": "custom",
      "action": "publish_scheduled_posts"
    },
    "description": "Publish scheduled posts weekdays at 10am"
  }'
```

## Complete Admin API Capabilities Summary

Your coding agents now have **15 powerful feature sets**:

1. ✅ **Lead Management** - Full CRUD operations
2. ✅ **File System** - Read/write any file
3. ✅ **System Control** - Execute commands
4. ✅ **Analytics** - Comprehensive metrics
5. ✅ **File Uploads** - Images and PDFs
6. ✅ **Content Management** - Blogs and pages
7. ✅ **Settings** - Site configuration
8. ✅ **Backup & Restore** - Data safety
9. ✅ **Activity Logs** - Audit trail
10. ✅ **Database Direct Access** - SQL operations
11. ✅ **Code Deployment** - Hot reload without IDE
12. ✅ **AI Agent Management** - Meta-agent capabilities
13. ✅ **Agent Orchestration** - Register and trigger AI agents
14. ✅ **Webhook System** - Respond to external events
15. ✅ **Scheduled Jobs/Cron** - Recurring automated tasks

Your agents can now:
- **Respond to payments** via webhooks
- **Process form submissions** automatically
- **Generate daily reports** on schedule
- **Run weekly backups** without intervention
- **Publish content** at optimal times
- **Clean up old data** automatically
- **Trigger actions** from external events
- **Chain webhooks and jobs** for complex workflows

## 16. Email Control System

Send custom emails and manage email templates programmatically.

### 16.1 Send Custom Email

Send individual emails with custom content or using templates.

```bash
curl -X POST http://localhost:5000/api/admin/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "subject": "Your Pool Design is Ready!",
    "html": "<h1>Your Custom Pool Design</h1><p>View your 3D design attached.</p>",
    "text": "Your custom pool design is ready. View the attached 3D rendering."
  }'

# Or send using a template
curl -X POST http://localhost:5000/api/admin/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["customer1@example.com", "customer2@example.com"],
    "templateId": "template-123",
    "variables": {
      "name": "John Smith",
      "projectId": "POOL-2024-001"
    }
  }'
```

**Parameters:**
- `to` - Recipient email(s) (string or array)
- `cc` - CC recipients (optional)
- `bcc` - BCC recipients (optional)
- `subject` - Email subject line
- `body` - Plain text content
- `html` - HTML content
- `templateId` - Use existing template
- `variables` - Template variable replacements
- `attachments` - File attachments
- `from` - Sender email (default: noreply@serenitypools.com)
- `replyTo` - Reply-to address

### 16.2 Create Email Template

Create reusable email templates with variable placeholders.

```bash
curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Email",
    "subject": "Welcome {{name}}!",
    "html": "<h1>Welcome {{name}}</h1><p>Thank you for choosing Serenity Pools for your {{poolType}} project.</p>",
    "text": "Welcome {{name}}! Thank you for choosing Serenity Pools for your {{poolType}} project.",
    "category": "onboarding",
    "variables": ["name", "poolType"],
    "description": "Welcome email for new customers"
  }'
```

### 16.3 List Email Templates

Get all email templates or filter by category/status.

```bash
# Get all templates
curl -X GET http://localhost:5000/api/admin/email/templates \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by category
curl -X GET "http://localhost:5000/api/admin/email/templates?category=onboarding" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get active templates only
curl -X GET "http://localhost:5000/api/admin/email/templates?active=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 16.4 Get Email Template

Retrieve a specific template by ID.

```bash
curl -X GET http://localhost:5000/api/admin/email/templates/template-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 16.5 Update Email Template

Modify existing email templates.

```bash
curl -X PUT http://localhost:5000/api/admin/email/templates/template-123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Updated: Welcome to Serenity Pools!",
    "active": true
  }'
```

### 16.6 Delete Email Template

Remove an email template.

```bash
curl -X DELETE http://localhost:5000/api/admin/email/templates/template-123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 16.7 Get Email History

View sent emails with tracking metrics.

```bash
# Get all email history
curl -X GET http://localhost:5000/api/admin/email/history \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl -X GET "http://localhost:5000/api/admin/email/history?status=sent" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by recipient
curl -X GET "http://localhost:5000/api/admin/email/history?to=customer@example.com" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Limit results
curl -X GET "http://localhost:5000/api/admin/email/history?limit=50" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 16.8 Send Bulk Emails

Send personalized emails to multiple recipients.

```bash
curl -X POST http://localhost:5000/api/admin/email/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com", "user3@example.com"],
    "templateId": "template-welcome",
    "personalizations": {
      "user1@example.com": {"name": "Alice", "poolType": "Infinity"},
      "user2@example.com": {"name": "Bob", "poolType": "Lap Pool"},
      "user3@example.com": {"name": "Carol", "poolType": "Natural"}
    },
    "batchSize": 100
  }'
```

## Email Template Examples

### Example 1: Lead Welcome Email
```bash
curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Lead Welcome",
    "subject": "Welcome to Serenity Pools, {{firstName}}!",
    "html": "<h2>Thank You for Your Interest!</h2><p>Hi {{firstName}},</p><p>We received your request for a {{poolType}} pool installation in {{city}}.</p><p>Your project consultant will contact you within 24 hours to schedule your free consultation.</p><p>In the meantime, <a href=\"https://serenitypools.com/portfolio\">view our portfolio</a> for inspiration!</p><p>Best regards,<br>The Serenity Pools Team<br>(678) 300-8949</p>",
    "text": "Hi {{firstName}}, Thank you for your interest in Serenity Pools! We received your request for a {{poolType}} pool in {{city}}. Your consultant will contact you within 24 hours. Call us at (678) 300-8949.",
    "category": "lead_nurturing",
    "variables": ["firstName", "poolType", "city"]
  }'
```

### Example 2: Appointment Confirmation
```bash
curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultation Scheduled",
    "subject": "Consultation Confirmed: {{date}} at {{time}}",
    "html": "<h2>Your Consultation is Confirmed!</h2><p>Dear {{name}},</p><p>Your pool design consultation is scheduled for:</p><p><strong>Date:</strong> {{date}}<br><strong>Time:</strong> {{time}}<br><strong>Location:</strong> {{address}}</p><p>Your consultant {{consultantName}} will review your property and discuss design options.</p><p>Please have ready:<ul><li>Property survey or plot plan</li><li>HOA guidelines (if applicable)</li><li>Design inspiration photos</li></ul></p>",
    "category": "appointments",
    "variables": ["name", "date", "time", "address", "consultantName"]
  }'
```

### Example 3: Project Update
```bash
curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Construction Update",
    "subject": "Pool Construction Update - {{projectPhase}}",
    "html": "<h2>Project Update: {{projectName}}</h2><p>{{customerName}},</p><p>Great news! Your pool construction has reached: <strong>{{projectPhase}}</strong></p><p>{{updateDetails}}</p><p>Next steps: {{nextSteps}}</p><p>Estimated completion: {{completionDate}}</p><p>View live progress photos: <a href=\"{{projectLink}}\">Click here</a></p>",
    "category": "project_updates",
    "variables": ["projectName", "customerName", "projectPhase", "updateDetails", "nextSteps", "completionDate", "projectLink"]
  }'
```

## Email Campaign Examples

### Example 1: Seasonal Promotion
```bash
# Create template
TEMPLATE_ID=$(curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Special 2024",
    "subject": "🏊 Summer Special: Save $5,000 on Your Dream Pool!",
    "html": "<h1>Limited Time: Summer Pool Special!</h1><p>Dear {{name}},</p><p>Start construction before July 31st and save $5,000!</p>",
    "category": "promotions"
  }' | jq -r '.template.id')

# Send to all leads
curl -X POST http://localhost:5000/api/admin/email/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"recipients\": $(curl -s -H \"Authorization: Bearer YOUR_API_KEY\" http://localhost:5000/api/admin/leads | jq '[.leads[].email]'),
    \"templateId\": \"$TEMPLATE_ID\"
  }"
```

### Example 2: Follow-Up Sequence
```bash
# Day 1: Welcome
curl -X POST http://localhost:5000/api/admin/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "new-lead@example.com",
    "templateId": "template-welcome"
  }'

# Day 3: Portfolio
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Send Portfolio Email",
    "schedule": "0 10 * * *",
    "task": {
      "type": "email",
      "templateId": "template-portfolio"
    }
  }'

# Day 7: Special Offer
curl -X POST http://localhost:5000/api/admin/cron/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Send Special Offer",
    "schedule": "0 10 * * *",
    "task": {
      "type": "email",
      "templateId": "template-offer"
    }
  }'
```

## Complete Admin API Feature List

Your coding agents now have **16 POWERFUL CAPABILITIES**:

1. ✅ **Lead Management** - Full CRUD operations
2. ✅ **File System** - Read/write any file
3. ✅ **System Control** - Execute commands
4. ✅ **Analytics** - Comprehensive metrics
5. ✅ **File Uploads** - Images and PDFs
6. ✅ **Content Management** - Blogs and pages
7. ✅ **Settings** - Site configuration
8. ✅ **Backup & Restore** - Data safety
9. ✅ **Activity Logs** - Audit trail
10. ✅ **Database Direct Access** - SQL operations
11. ✅ **Code Deployment** - Hot reload without IDE
12. ✅ **AI Agent Management** - Meta-agent capabilities
13. ✅ **Agent Orchestration** - Register and trigger AI agents
14. ✅ **Webhook System** - Respond to external events
15. ✅ **Scheduled Jobs/Cron** - Recurring automated tasks
16. ✅ **Email Control** - Send emails and manage templates

Your agents are now **FULLY AUTONOMOUS** with the ability to:
- Send personalized emails to leads
- Create and manage email campaigns
- Build drip sequences with templates
- Track email performance metrics
- Integrate email with webhooks and scheduled jobs
- Chain email workflows with AI agents

## 17. Content Generation Pipeline

AI-powered content generation, SEO optimization, translation, and auto-publishing.

### 17.1 Generate AI Content

Create AI-generated content for blogs, landing pages, emails, and social media.

```bash
curl -X POST http://localhost:5000/api/admin/content/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "blog",
    "topic": "Infinity Edge Pools",
    "keywords": ["luxury pools", "infinity edge", "pool design"],
    "tone": "professional",
    "targetAudience": "affluent homeowners",
    "seoOptimized": true,
    "language": "en"
  }'
```

**Content Types:**
- `blog` - Full blog articles with SEO optimization
- `landing` - Landing pages with CTAs
- `email` - Email campaigns with personalization
- `social` - Social media posts with hashtags

**Parameters:**
- `type` - Content type (required)
- `topic` - Main subject (required)
- `keywords` - Target keywords array
- `tone` - Writing style: `professional`, `casual`, `friendly`
- `targetAudience` - Who the content is for
- `length` - Desired word count
- `seoOptimized` - Include SEO elements
- `language` - Content language (default: en)

### 17.2 Optimize Content for SEO

Analyze and optimize content for search engines.

```bash
curl -X POST http://localhost:5000/api/admin/content/optimize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "content-123",
    "targetKeywords": ["luxury pools", "North Georgia"],
    "optimizationLevel": "advanced"
  }'
```

**Returns:**
- Title optimization suggestions
- Meta description improvements
- Keyword density analysis
- Heading structure recommendations
- Readability score
- Technical SEO elements (URL slug, structured data)
- SEO score (0-100)

### 17.3 Translate Content

Translate content to multiple languages while preserving formatting.

```bash
curl -X POST http://localhost:5000/api/admin/content/translate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "content-123",
    "targetLanguages": ["es", "fr", "zh", "pt"],
    "preserveFormatting": true
  }'
```

**Supported Languages:**
- `es` - Spanish
- `fr` - French
- `zh` - Chinese
- `pt` - Portuguese

### 17.4 Schedule Content Publishing

Schedule content to auto-publish across multiple channels.

```bash
curl -X POST http://localhost:5000/api/admin/content/schedule \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "content-123",
    "publishAt": "2024-12-01T10:00:00Z",
    "channels": ["website", "blog", "social_facebook", "social_twitter"],
    "timezone": "America/New_York",
    "repeatSchedule": {
      "frequency": "weekly",
      "dayOfWeek": 2,
      "time": "10:00"
    }
  }'
```

**Publishing Channels:**
- `website` - Main website
- `blog` - Blog section
- `social_facebook` - Facebook page
- `social_twitter` - Twitter/X
- `social_instagram` - Instagram
- `email` - Email campaign

**Repeat Schedules:**
- `frequency` - daily, weekly, monthly
- `dayOfWeek` - 0-6 (Sunday-Saturday)
- `time` - HH:MM format

### 17.5 List Generated Content

View all generated content with filtering options.

```bash
# List all content
curl -X GET http://localhost:5000/api/admin/content/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by type
curl -X GET "http://localhost:5000/api/admin/content/list?type=blog" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl -X GET "http://localhost:5000/api/admin/content/list?status=published" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 17.6 View Scheduled Content

Check upcoming scheduled publications.

```bash
curl -X GET http://localhost:5000/api/admin/content/scheduled \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Content Generation Examples

### Example 1: Complete Blog Workflow
```bash
# 1. Generate blog content
CONTENT_ID=$(curl -X POST http://localhost:5000/api/admin/content/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "blog",
    "topic": "Pool Maintenance Tips",
    "keywords": ["pool care", "maintenance", "water chemistry"]
  }' | jq -r '.content.id')

# 2. Optimize for SEO
curl -X POST http://localhost:5000/api/admin/content/optimize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\": \"$CONTENT_ID\", \"targetKeywords\": [\"pool maintenance\"]}"

# 3. Translate to Spanish
curl -X POST http://localhost:5000/api/admin/content/translate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\": \"$CONTENT_ID\", \"targetLanguages\": [\"es\"]}"

# 4. Schedule publishing
curl -X POST http://localhost:5000/api/admin/content/schedule \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"contentId\": \"$CONTENT_ID\", \"publishAt\": \"2024-12-01T10:00:00Z\", \"channels\": [\"blog\", \"social_facebook\"]}"
```

### Example 2: Social Media Campaign
```bash
# Generate multiple social posts
for topic in "Summer Pool Party" "Pool Safety Tips" "Design Trends 2024"; do
  curl -X POST http://localhost:5000/api/admin/content/generate \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"social\",
      \"topic\": \"$topic\",
      \"tone\": \"casual\"
    }"
done
```

### Example 3: Email Drip Campaign
```bash
# Generate welcome series
TOPICS=("Welcome to Serenity Pools" "Pool Design Inspiration" "Maintenance Guide" "Special Offer")

for i in "${!TOPICS[@]}"; do
  CONTENT_ID=$(curl -X POST http://localhost:5000/api/admin/content/generate \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"email\",
      \"topic\": \"${TOPICS[$i]}\"
    }" | jq -r '.content.id')
  
  # Schedule each email 3 days apart
  DAYS=$((i * 3))
  PUBLISH_DATE=$(date -d "+$DAYS days" '+%Y-%m-%dT10:00:00Z')
  
  curl -X POST http://localhost:5000/api/admin/content/schedule \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"contentId\": \"$CONTENT_ID\",
      \"publishAt\": \"$PUBLISH_DATE\",
      \"channels\": [\"email\"]
    }"
done
```

## Content Pipeline Integration

### Combine with Other APIs
```bash
# Generate content → Create email template → Send campaign
CONTENT=$(curl -X POST http://localhost:5000/api/admin/content/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"type": "email", "topic": "Spring Pool Opening"}')

TEMPLATE_ID=$(curl -X POST http://localhost:5000/api/admin/email/template \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d "{
    \"name\": \"Spring Campaign\",
    \"html\": \"$(echo $CONTENT | jq -r '.content.body')\"
  }" | jq -r '.template.id')

curl -X POST http://localhost:5000/api/admin/email/bulk \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d "{\"templateId\": \"$TEMPLATE_ID\", \"recipients\": [...]}"
```

## Complete Admin API Capabilities

Your coding agents now have **17 POWERFUL FEATURE SETS**:

1. ✅ **Lead Management** - Full CRUD operations
2. ✅ **File System** - Read/write any file
3. ✅ **System Control** - Execute commands
4. ✅ **Analytics** - Comprehensive metrics
5. ✅ **File Uploads** - Images and PDFs
6. ✅ **Content Management** - Blogs and pages
7. ✅ **Settings** - Site configuration
8. ✅ **Backup & Restore** - Data safety
9. ✅ **Activity Logs** - Audit trail
10. ✅ **Database Direct Access** - SQL operations
11. ✅ **Code Deployment** - Hot reload without IDE
12. ✅ **AI Agent Management** - Meta-agent capabilities
13. ✅ **Agent Orchestration** - Register and trigger AI agents
14. ✅ **Webhook System** - Respond to external events
15. ✅ **Scheduled Jobs/Cron** - Recurring automated tasks
16. ✅ **Email Control** - Send emails and manage templates
17. ✅ **Content Generation Pipeline** - AI content, SEO, translation

Your agents can now:
- **Generate AI content** for any channel
- **Optimize for SEO** automatically
- **Translate to multiple languages**
- **Schedule auto-publishing** across platforms
- **Build complete content workflows**
18. ✅ **Third-Party Integrations** - Connect external APIs and services
19. ✅ **File System Access** - Read, write, search, and manage project files
20. ✅ **Environment & Configuration** - Manage env variables and app settings
21. ✅ **Dynamic Endpoint Management** - Create custom API endpoints on the fly

## 19. Third-Party Integration Management

Connect and manage external APIs and services with automatic syncing and data mapping.

### 19.1 Connect External API

Register a new third-party integration with your application.

```bash
curl -X POST http://localhost:5000/api/admin/integrations/connect \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe Payments",
    "provider": "stripe",
    "apiKey": "sk_test_...",
    "webhookUrl": "https://yourdomain.com/webhook/stripe",
    "config": {
      "currency": "USD",
      "statementDescriptor": "SERENITY POOLS"
    },
    "autoSync": true,
    "syncInterval": 3600000
  }'
```

**Supported Providers:**
- `stripe` - Payment processing (payments, subscriptions, invoices)
- `sendgrid` - Email delivery (transactional emails, templates)
- `twilio` - SMS/Voice (notifications, verification)
- `hubspot` - CRM (contacts, deals, companies, marketing)
- `salesforce` - CRM (leads, opportunities, accounts)
- `zapier` - Automation (triggers, multi-step workflows)
- `google` - Analytics, Ads, Calendar, Drive, Sheets
- `openai` - AI models (chat, completion, embeddings)
- `github` - Code repository (repos, issues, pulls)
- `slack` - Team communication (messages, channels)

### 19.2 List All Integrations

View all connected integrations and their status.

```bash
# List all integrations
curl -X GET http://localhost:5000/api/admin/integrations/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by status
curl -X GET "http://localhost:5000/api/admin/integrations/list?status=connected" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by provider
curl -X GET "http://localhost:5000/api/admin/integrations/list?provider=stripe" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 19.3 Sync Data from Integration

Pull data from connected integrations.

```bash
curl -X POST http://localhost:5000/api/admin/integrations/sync \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationId": "integration-123456",
    "syncType": "full",
    "dataTypes": ["payments", "customers"],
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
  }'
```

**Sync Types:**
- `full` - Complete data sync
- `incremental` - Only new/updated data since last sync
- `selective` - Specific data types only

### 19.4 Get Integration Details

View detailed information about a specific integration.

```bash
curl -X GET http://localhost:5000/api/admin/integrations/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 19.5 Update Integration Settings

Modify integration configuration and credentials.

```bash
curl -X PUT http://localhost:5000/api/admin/integrations/{id} \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "autoSync": true,
    "syncInterval": 1800000,
    "config": {
      "syncContacts": true,
      "syncDeals": true
    }
  }'
```

### 19.6 Test Integration Connection

Verify that an integration is properly configured and accessible.

```bash
curl -X POST http://localhost:5000/api/admin/integrations/{id}/test \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 19.7 Disconnect Integration

Remove an integration and all associated data.

```bash
curl -X DELETE http://localhost:5000/api/admin/integrations/{id} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Integration Examples

### Example 1: Stripe Payment Sync
```bash
# 1. Connect Stripe
STRIPE_ID=$(curl -X POST http://localhost:5000/api/admin/integrations/connect \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stripe Production",
    "provider": "stripe",
    "apiKey": "sk_live_...",
    "autoSync": true,
    "syncInterval": 900000
  }' | jq -r '.integration.id')

# 2. Test connection
curl -X POST "http://localhost:5000/api/admin/integrations/$STRIPE_ID/test" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Manual sync
curl -X POST http://localhost:5000/api/admin/integrations/sync \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"integrationId\": \"$STRIPE_ID\", \"dataTypes\": [\"payments\", \"subscriptions\"]}"
```

### Example 2: HubSpot CRM Integration
```bash
# Connect HubSpot with custom mapping
curl -X POST http://localhost:5000/api/admin/integrations/connect \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HubSpot CRM",
    "provider": "hubspot",
    "apiKey": "hapikey-...",
    "config": {
      "portalId": "12345678",
      "syncContacts": true,
      "syncDeals": true,
      "syncCompanies": true
    },
    "dataMapping": {
      "contacts": "leads",
      "deals": "opportunities"
    },
    "autoSync": true,
    "syncInterval": 3600000
  }'
```

### Example 3: Multi-Integration Workflow
```bash
# Sync all CRM integrations
for provider in "hubspot" "salesforce"; do
  INTEGRATIONS=$(curl -X GET "http://localhost:5000/api/admin/integrations/list?provider=$provider" \
    -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.integrations[].id')
  
  for ID in $INTEGRATIONS; do
    curl -X POST http://localhost:5000/api/admin/integrations/sync \
      -H "Authorization: Bearer YOUR_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"integrationId\": \"$ID\", \"syncType\": \"incremental\"}"
  done
done
```

## Your Agents Can Now:
- **Connect any external API** with proper authentication
- **Auto-sync data** at defined intervals
- **Map data fields** between systems
- **Test connections** before production use
- **Orchestrate multi-system workflows**
- **Build unified dashboards** from multiple sources

## 20. File System Access

Complete file system control for reading, writing, and managing project files.

### 20.1 List Files

List all files in a directory with filtering options.

```bash
# List files in root directory (non-recursive)
curl -X GET "http://localhost:5000/api/admin/files/list?recursive=false" \
  -H "Authorization: Bearer YOUR_API_KEY"

# List all files recursively
curl -X GET "http://localhost:5000/api/admin/files/list" \
  -H "Authorization: Bearer YOUR_API_KEY"

# List only JavaScript files
curl -X GET "http://localhost:5000/api/admin/files/list?extension=js" \
  -H "Authorization: Bearer YOUR_API_KEY"

# List from specific directory
curl -X GET "http://localhost:5000/api/admin/files/list?path=client/src" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 20.2 Read File Content

Read the content of any file in the project.

```bash
# Read using query parameter
curl -X GET "http://localhost:5000/api/admin/files/read?path=package.json" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Read using path parameter
curl -X GET http://localhost:5000/api/admin/files/package.json \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 20.3 Write/Create Files

Create new files or update existing ones.

```bash
curl -X POST http://localhost:5000/api/admin/files/write \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "config/settings.json",
    "content": "{\"apiUrl\": \"https://api.example.com\"}",
    "createDirectories": true
  }'
```

### 20.4 Delete Files

Remove files from the project.

```bash
curl -X POST http://localhost:5000/api/admin/files/delete \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"path": "temp/old-file.txt"}'
```

### 20.5 Search File Contents

Search for text patterns across all project files.

```bash
# Basic search
curl -X POST http://localhost:5000/api/admin/files/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "TODO",
    "maxResults": 10
  }'

# Search with options
curl -X POST http://localhost:5000/api/admin/files/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "className",
    "path": "client/src",
    "extensions": ["tsx", "jsx"],
    "caseSensitive": false,
    "maxResults": 50
  }'
```

### 20.6 List Directory Contents

View the contents of any directory.

```bash
# List root directory
curl -X GET http://localhost:5000/api/admin/directory/ \
  -H "Authorization: Bearer YOUR_API_KEY"

# List specific directory
curl -X GET http://localhost:5000/api/admin/directory/client/src/components \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## File System Examples

### Example 1: Update Configuration File
```bash
# Read current config
CONFIG=$(curl -X GET "http://localhost:5000/api/admin/files/read?path=config.json" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.content')

# Modify and write back
echo "$CONFIG" | jq '.newSetting = true' | \
curl -X POST http://localhost:5000/api/admin/files/write \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @- <<< '{"path": "config.json", "content": "'$(cat)'"}'
```

### Example 2: Find and Replace Across Files
```bash
# Find all files containing old API URL
RESULTS=$(curl -X POST http://localhost:5000/api/admin/files/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "https://old-api.example.com"}' | jq -r '.results[].file')

# Update each file
for FILE in $RESULTS; do
  CONTENT=$(curl -X GET "http://localhost:5000/api/admin/files/read?path=$FILE" \
    -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.content')
  
  UPDATED=$(echo "$CONTENT" | sed 's|https://old-api.example.com|https://new-api.example.com|g')
  
  curl -X POST http://localhost:5000/api/admin/files/write \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"path\": \"$FILE\", \"content\": $(echo "$UPDATED" | jq -Rs .)}"
done
```

### Example 3: Create Project Documentation
```bash
# Generate file list
FILES=$(curl -X GET "http://localhost:5000/api/admin/files/list?extension=ts" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.files[].path' | head -20)

# Create documentation file
DOC="# Project Structure\n\n## TypeScript Files:\n"
for FILE in $FILES; do
  DOC="$DOC- $FILE\n"
done

curl -X POST http://localhost:5000/api/admin/files/write \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"path\": \"PROJECT_FILES.md\", \"content\": \"$DOC\"}"
```

## Security Notes

- All file paths are validated to prevent directory traversal attacks
- Cannot access files outside the project directory
- Binary files should not be read as text (will error)
- Large files may timeout or truncate

Your agents can now:
- **Read any project file** to understand code structure
- **Write and update files** without IDE access
- **Search across codebase** to find patterns
- **Create new files and directories** programmatically
- **Delete unnecessary files** for cleanup
- **Build automated refactoring tools**

## 21. Environment & Configuration Management

Full control over environment variables and application configuration settings.

### 21.1 List Environment Variables

View all environment variables with optional sensitive data filtering.

```bash
# List non-sensitive environment variables only
curl -X GET http://localhost:5000/api/admin/env/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# Include sensitive variables (partially masked)
curl -X GET "http://localhost:5000/api/admin/env/list?showSensitive=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 21.2 Set Environment Variable

Add or update environment variables at runtime.

```bash
# Set temporary environment variable (runtime only)
curl -X POST http://localhost:5000/api/admin/env/set \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "API_ENDPOINT",
    "value": "https://api.example.com",
    "permanent": false
  }'

# Set permanent environment variable (writes to .env)
curl -X POST http://localhost:5000/api/admin/env/set \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "FEATURE_FLAG_NEW_UI",
    "value": "true",
    "permanent": true
  }'

# Remove environment variable
curl -X POST http://localhost:5000/api/admin/env/set \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "OLD_API_KEY",
    "value": null
  }'
```

### 21.3 Get Application Configuration

Retrieve all application settings and runtime information.

```bash
# Get full configuration
curl -X GET http://localhost:5000/api/admin/config/all \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get specific configuration value
curl -X GET http://localhost:5000/api/admin/config/maintenanceMode \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 21.4 Update Configuration

Modify application settings at runtime.

```bash
# Update configuration (temporary)
curl -X POST http://localhost:5000/api/admin/config/update \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": {
      "maintenanceMode": true,
      "leadScoreThreshold": 8,
      "emailNotifications": false
    },
    "persist": false
  }'

# Update and persist configuration
curl -X POST http://localhost:5000/api/admin/config/update \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": {
      "siteName": "Custom Pool Experts",
      "contactEmail": "support@custompoolexperts.com"
    },
    "persist": true
  }'
```

### 21.5 Reset Configuration

Reset configuration values to defaults.

```bash
# Reset specific configuration keys
curl -X POST http://localhost:5000/api/admin/config/reset \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"keys": ["maintenanceMode", "leadScoreThreshold"]}'

# Reset all configuration to defaults
curl -X POST http://localhost:5000/api/admin/config/reset \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Configuration Examples

### Example 1: Enable Maintenance Mode
```bash
# Enable maintenance mode
curl -X POST http://localhost:5000/api/admin/config/update \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"updates": {"maintenanceMode": true}}'

# Check status
STATUS=$(curl -X GET http://localhost:5000/api/admin/config/maintenanceMode \
  -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.value')

echo "Maintenance mode: $STATUS"
```

### Example 2: Feature Flag Management
```bash
# Set multiple feature flags
curl -X POST http://localhost:5000/api/admin/env/set \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "FEATURE_NEW_DASHBOARD", "value": "true", "permanent": true}'

curl -X POST http://localhost:5000/api/admin/env/set \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "FEATURE_BETA_API", "value": "false", "permanent": true}'

# Check all feature flags
curl -X GET http://localhost:5000/api/admin/env/list \
  -H "Authorization: Bearer YOUR_API_KEY" | jq '.variables | with_entries(select(.key | startswith("FEATURE_")))'
```

### Example 3: Environment-Based Configuration
```bash
# Get current environment
ENV=$(curl -X GET http://localhost:5000/api/admin/env/list \
  -H "Authorization: Bearer YOUR_API_KEY" | jq -r '.environment')

# Apply environment-specific settings
if [ "$ENV" = "production" ]; then
  curl -X POST http://localhost:5000/api/admin/config/update \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "updates": {
        "debugMode": false,
        "apiRateLimit": 100,
        "sessionTimeout": 1800000
      }
    }'
else
  curl -X POST http://localhost:5000/api/admin/config/update \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "updates": {
        "debugMode": true,
        "apiRateLimit": 1000,
        "sessionTimeout": 7200000
      }
    }'
fi
```

## Available Configuration Settings

**Core Settings:**
- `siteName` - Application name
- `contactEmail` - Primary contact email
- `contactPhone` - Support phone number
- `businessHours` - Operating hours and timezone

**System Settings:**
- `maintenanceMode` - Enable/disable maintenance mode
- `debugMode` - Debug logging level
- `apiRateLimit` - API requests per hour
- `sessionTimeout` - Session expiration time (ms)
- `maxUploadSize` - Maximum file upload size (bytes)

**Feature Toggles:**
- `emailNotifications` - Email notification system
- `autoResponseEnabled` - Automatic email responses  
- `chatbotEnabled` - AI chatbot feature
- `voiceAgentEnabled` - Voice assistant feature
- `analyticsEnabled` - Analytics tracking

**Business Logic:**
- `leadScoreThreshold` - Lead qualification score
- `allowedFileTypes` - Permitted upload formats

Your agents can now:
- **Control environment variables** dynamically
- **Manage feature flags** without code changes
- **Configure application behavior** in real-time
- **Toggle maintenance mode** for updates
- **Adjust system limits** based on load
- **Enable/disable features** per environment

## 22. Dynamic Endpoint Management (Meta-API)

Your agents can now **create their own API endpoints** dynamically! This meta-programming capability allows autonomous extension of the API without manual intervention.

### 22.1 Create Custom Endpoint

Define new API endpoints with custom logic at runtime.

```bash
# Create a simple GET endpoint
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/hello",
    "description": "Simple greeting endpoint",
    "handler": "res.json({ message: \"Hello from custom endpoint!\", timestamp: new Date() });",
    "requiresAuth": true
  }'

# Create a complex POST endpoint with business logic
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/api/admin/custom/calculate-pool-cost",
    "description": "Calculate pool installation cost",
    "handler": "const { length, width, depth, features = [] } = body; const basePrice = length * width * depth * 100; const featuresCost = features.includes(\"heating\") ? 5000 : 0; const total = basePrice + featuresCost; res.json({ success: true, estimate: total, breakdown: { base: basePrice, features: featuresCost } });",
    "requiresAuth": false
  }'
```

### 22.2 List Custom Endpoints

View all dynamically created endpoints.

```bash
curl -X GET http://localhost:5000/api/admin/endpoints/list \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 22.3 Get Endpoint Details

Retrieve full details including handler code.

```bash
curl -X GET http://localhost:5000/api/admin/endpoints/GET/hello \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 22.4 Update Endpoint

Modify endpoint logic or configuration.

```bash
curl -X PUT http://localhost:5000/api/admin/endpoints/update \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/hello",
    "description": "Enhanced greeting endpoint",
    "handler": "const greetings = [\"Hello\", \"Hi\", \"Welcome\"]; const greeting = greetings[Math.floor(Math.random() * greetings.length)]; res.json({ message: greeting, timestamp: new Date() });"
  }'
```

### 22.5 Delete Endpoint

Remove custom endpoints.

```bash
curl -X DELETE http://localhost:5000/api/admin/endpoints/GET/hello \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Handler Context Available

Your custom endpoint handlers have access to:

- `req` - Express request object
- `res` - Express response object  
- `body` - Request body (parsed)
- `query` - Query parameters
- `params` - Route parameters
- `headers` - Request headers
- `fs` - File system module
- `path` - Path module
- `process.env` - Environment variables
- `storage` - Your app's storage layer
- `console` - For logging
- `logActivity()` - Activity logger
- All JavaScript built-ins (JSON, Date, Math, etc.)

## Example: Agent Creating Its Own Tools

```bash
# Agent creates a data export endpoint
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/export-leads-csv",
    "description": "Export leads to CSV format",
    "handler": "const leads = storage.getLeads(); const csv = \"Name,Email,Score\\n\" + leads.map(l => `${l.name},${l.email},${l.score}`).join(\"\\n\"); res.setHeader(\"Content-Type\", \"text/csv\"); res.setHeader(\"Content-Disposition\", \"attachment; filename=leads.csv\"); res.send(csv);",
    "requiresAuth": true
  }'

# Agent creates a monitoring endpoint
curl -X POST http://localhost:5000/api/admin/endpoints/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/admin/custom/health-check",
    "description": "System health monitoring",
    "handler": "const checks = { database: storage ? \"ok\" : \"error\", memory: process.memoryUsage().heapUsed < 500000000 ? \"ok\" : \"warning\", uptime: process.uptime() }; const status = checks.database === \"ok\" ? 200 : 503; res.status(status).json({ success: status === 200, checks, timestamp: new Date() });",
    "requiresAuth": false
  }'
```

## Important Notes

1. **Path Prefix**: All custom endpoints must start with `/api/admin/custom/`
2. **Persistence**: Endpoints are stored in memory and cleared on server restart
3. **Security**: Set `requiresAuth: true` for sensitive endpoints
4. **Execution**: New endpoints work immediately after creation
5. **Debugging**: Check execution count and last executed time in list endpoint

Your agents can now:
- **Create specialized tools** as needed
- **Build custom integrations** on the fly
- **Add monitoring endpoints** dynamically
- **Implement business logic** without code deployment
- **Extend the API** autonomously

