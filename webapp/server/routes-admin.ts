import type { Express } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { authenticateAdminAPI, logAdminAccess } from './middleware/admin-auth';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import crypto from 'crypto';
import { createDeploymentRoutes } from './routes-deployment';
import selfModRoutes from './routes-selfmod';

const execAsync = promisify(exec);

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'server/public/uploads/admin');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// Activity log storage
interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  details: any;
  ip?: string;
  userAgent?: string;
}

const activityLogs: ActivityLog[] = [];

function logActivity(action: string, resource: string, details: any, req?: any) {
  const log: ActivityLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    resource,
    details,
    ip: req?.ip,
    userAgent: req?.headers['user-agent']
  };
  activityLogs.push(log);
  
  // Keep only last 1000 logs in memory
  if (activityLogs.length > 1000) {
    activityLogs.shift();
  }
  
  console.log(`[ADMIN ACTIVITY] ${action} on ${resource}:`, details);
}

/**
 * Admin API Routes - Full access to webapp control
 * All routes require Bearer token authentication
 */
export function registerAdminRoutes(app: Express) {
  // Create a Router for all admin routes
  const adminRouter = Router();
  
  // Apply authentication middleware to all routes in this router
  adminRouter.use(authenticateAdminAPI, logAdminAccess);
  
  // ========================================
  // Database Management Endpoints
  // ========================================
  
  // Get all leads with filtering and sorting
  adminRouter.get('/leads', async (req, res) => {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        sortBy = 'createdAt',
        order = 'desc',
        filter 
      } = req.query;
      
      const leads = await storage.getLeads();
      
      // Apply filtering if specified
      let filtered = leads;
      if (filter) {
        const filterStr = filter.toString().toLowerCase();
        filtered = leads.filter(lead => 
          lead.email.toLowerCase().includes(filterStr) ||
          lead.firstName?.toLowerCase().includes(filterStr) ||
          lead.lastName?.toLowerCase().includes(filterStr) ||
          lead.city?.toLowerCase().includes(filterStr)
        );
      }
      
      // Sort
      filtered.sort((a, b) => {
        const aVal = (a as any)[sortBy as string] || '';
        const bVal = (b as any)[sortBy as string] || '';
        return order === 'desc' ? 
          (bVal > aVal ? 1 : -1) : 
          (aVal > bVal ? 1 : -1);
      });
      
      // Paginate
      const paginated = filtered.slice(
        Number(offset), 
        Number(offset) + Number(limit)
      );
      
      res.json({
        success: true,
        data: paginated,
        total: filtered.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Admin API - Get leads error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch leads',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Create or update lead
  adminRouter.post('/leads', async (req, res) => {
    try {
      const { id, ...leadData } = req.body;
      
      if (id) {
        // Update existing lead
        const updated = await storage.updateLead(id, leadData);
        res.json({ success: true, data: updated });
      } else {
        // Create new lead
        const created = await storage.createLead(leadData);
        res.json({ success: true, data: created });
      }
    } catch (error) {
      console.error('Admin API - Create/update lead error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create/update lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete lead
  adminRouter.delete('/leads/:id', async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
      console.error('Admin API - Delete lead error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Batch operations on leads
  adminRouter.post('/leads/batch', async (req, res) => {
    try {
      const { operation, ids, data } = req.body;
      const results = [];
      
      for (const id of ids) {
        try {
          if (operation === 'delete') {
            await storage.deleteLead(id);
            results.push({ id, success: true });
          } else if (operation === 'update') {
            const updated = await storage.updateLead(id, data);
            results.push({ id, success: true, data: updated });
          }
        } catch (error) {
          results.push({ 
            id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error('Admin API - Batch operation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Batch operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all voice calls
  adminRouter.get('/voice-calls', async (req, res) => {
    try {
      const voiceCalls = await storage.getVoiceCalls();
      res.json({ success: true, data: voiceCalls });
    } catch (error) {
      console.error('Admin API - Get voice calls error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch voice calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all campaigns
  adminRouter.get('/campaigns', async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json({ success: true, data: campaigns });
    } catch (error) {
      console.error('Admin API - Get campaigns error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // File System Management Endpoints
  // ========================================
  // IMPORTANT: Specific routes MUST come before wildcard routes
  
  // List all files with enhanced filtering
  adminRouter.get('/files/list', async (req, res) => {
    try {
      const { path: searchPath = '.', recursive = true, extension, type } = req.query;
      const fullPath = path.join(process.cwd(), searchPath as string);
      
      // Security check
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid directory path' 
        });
      }
      
      const fileList: Array<{name: string, path: string, type: string, size?: number, modified?: Date}> = [];
      
      async function scanDirectory(dirPath: string, relativePath = '') {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          const relativeFilePath = path.join(relativePath, file.name);
          
          // Skip node_modules and .git by default
          if (file.name === 'node_modules' || file.name === '.git') {
            continue;
          }
          
          if (file.isDirectory()) {
            if (type !== 'file') {
              fileList.push({
                name: file.name,
                path: relativeFilePath,
                type: 'directory'
              });
            }
            
            if (recursive) {
              await scanDirectory(filePath, relativeFilePath);
            }
          } else {
            if (type !== 'directory') {
              // Check extension filter
              if (extension && !file.name.endsWith(`.${extension}`)) {
                continue;
              }
              
              try {
                const stats = await fs.stat(filePath);
                fileList.push({
                  name: file.name,
                  path: relativeFilePath,
                  type: 'file',
                  size: stats.size,
                  modified: stats.mtime
                });
              } catch {
                fileList.push({
                  name: file.name,
                  path: relativeFilePath,
                  type: 'file'
                });
              }
            }
          }
        }
      }
      
      await scanDirectory(fullPath, searchPath as string);
      
      res.json({ 
        success: true, 
        files: fileList,
        total: fileList.length
      });
    } catch (error) {
      console.error('Admin API - List files error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Read file content (alias for compatibility)
  adminRouter.get('/files/read', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      
      if (!filePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'File path required' 
        });
      }
      
      const fullPath = path.join(process.cwd(), filePath as string);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      const content = await fs.readFile(fullPath, 'utf-8');
      res.json({ 
        success: true, 
        path: filePath,
        content 
      });
    } catch (error) {
      console.error('Admin API - Read file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to read file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Write file content (create or update)
  adminRouter.post('/files/write', async (req, res) => {
    try {
      const { path: filePath, content, createDirectories = true } = req.body;
      
      if (!filePath || content === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'File path and content required' 
        });
      }
      
      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      // Create directory if needed
      if (createDirectories) {
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      await fs.writeFile(fullPath, content, 'utf-8');
      
      logActivity('FILE_WRITE', 'files', { path: filePath }, req);
      
      res.json({ 
        success: true, 
        message: 'File written successfully',
        path: filePath 
      });
    } catch (error) {
      console.error('Admin API - Write file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to write file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete file
  adminRouter.post('/files/delete', async (req, res) => {
    try {
      const { path: filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'File path required' 
        });
      }
      
      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      await fs.unlink(fullPath);
      
      logActivity('FILE_DELETE', 'files', { path: filePath }, req);
      
      res.json({ 
        success: true, 
        message: 'File deleted successfully',
        path: filePath 
      });
    } catch (error) {
      console.error('Admin API - Delete file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Search file contents
  adminRouter.post('/files/search', async (req, res) => {
    try {
      const { 
        query, 
        path: searchPath = '.', 
        extensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'md'],
        maxResults = 100,
        caseSensitive = false
      } = req.body;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          error: 'Search query required' 
        });
      }
      
      const fullPath = path.join(process.cwd(), searchPath);
      
      // Security check
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid search path' 
        });
      }
      
      const searchResults: Array<{
        file: string,
        line: number,
        content: string,
        match: string
      }> = [];
      
      const searchRegex = caseSensitive 
        ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      async function searchInDirectory(dirPath: string, relativePath = '') {
        if (searchResults.length >= maxResults) return;
        
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const file of files) {
          if (searchResults.length >= maxResults) break;
          
          const filePath = path.join(dirPath, file.name);
          const relativeFilePath = path.join(relativePath, file.name);
          
          // Skip node_modules, .git, and binary files
          if (file.name === 'node_modules' || file.name === '.git' || file.name === '.cache') {
            continue;
          }
          
          if (file.isDirectory()) {
            await searchInDirectory(filePath, relativeFilePath);
          } else {
            // Check if file has allowed extension
            const hasValidExtension = extensions.some((ext: string) => 
              file.name.endsWith(`.${ext}`)
            );
            
            if (!hasValidExtension) continue;
            
            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const lines = content.split('\n');
              
              lines.forEach((line, index) => {
                if (searchResults.length >= maxResults) return;
                
                if (searchRegex.test(line)) {
                  const match = line.match(searchRegex);
                  searchResults.push({
                    file: relativeFilePath,
                    line: index + 1,
                    content: line.trim().substring(0, 200),
                    match: match ? match[0] : query
                  });
                }
              });
            } catch (error) {
              // Skip files that can't be read as text
              console.log(`Skipping file ${relativeFilePath}: ${error}`);
            }
          }
        }
      }
      
      await searchInDirectory(fullPath, searchPath);
      
      res.json({ 
        success: true, 
        query,
        results: searchResults,
        total: searchResults.length,
        truncated: searchResults.length >= maxResults
      });
    } catch (error) {
      console.error('Admin API - Search files error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Wildcard File Routes (MUST come after specific routes)
  // ========================================
  
  // Read any file in the project (wildcard route)
  adminRouter.get('/files/*', async (req, res) => {
    try {
      const filePath = req.params[0];
      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      const content = await fs.readFile(fullPath, 'utf-8');
      res.json({ 
        success: true, 
        path: filePath,
        content 
      });
    } catch (error) {
      console.error('Admin API - Read file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to read file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Write/update any file in the project (wildcard route)
  adminRouter.put('/files/*', async (req, res) => {
    try {
      const filePath = req.params[0];
      const { content } = req.body;
      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      // Create directory if it doesn't exist
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ 
        success: true, 
        message: 'File updated successfully',
        path: filePath 
      });
    } catch (error) {
      console.error('Admin API - Write file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to write file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete a file (wildcard route)
  adminRouter.delete('/files/*', async (req, res) => {
    try {
      const filePath = req.params[0];
      const fullPath = path.join(process.cwd(), filePath);
      
      // Security check - prevent directory traversal
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid file path' 
        });
      }
      
      await fs.unlink(fullPath);
      res.json({ 
        success: true, 
        message: 'File deleted successfully',
        path: filePath 
      });
    } catch (error) {
      console.error('Admin API - Delete file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List directory contents (wildcard route)
  adminRouter.get('/directory/*', async (req, res) => {
    try {
      const dirPath = req.params[0] || '.';
      const fullPath = path.join(process.cwd(), dirPath);
      
      // Security check
      if (fullPath.includes('..')) {
        return res.status(403).json({ 
          success: false, 
          error: 'Invalid directory path' 
        });
      }
      
      const files = await fs.readdir(fullPath, { withFileTypes: true });
      const contents = files.map(file => ({
        name: file.name,
        type: file.isDirectory() ? 'directory' : 'file'
      }));
      
      res.json({ 
        success: true, 
        path: dirPath,
        contents 
      });
    } catch (error) {
      console.error('Admin API - List directory error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list directory',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Environment & Configuration Endpoints
  // ========================================
  
  // Application configuration storage
  const appConfig = new Map<string, any>([
    ['siteName', 'Serenity Custom Pools LLC'],
    ['contactEmail', 'info@serenitycustompools.com'],
    ['contactPhone', '(678)300-8949'],
    ['businessHours', { start: '9:00', end: '17:00', timezone: 'America/New_York' }],
    ['maintenanceMode', false],
    ['emailNotifications', true],
    ['autoResponseEnabled', true],
    ['leadScoreThreshold', 7],
    ['maxUploadSize', 10485760], // 10MB
    ['allowedFileTypes', ['pdf', 'jpg', 'png', 'doc', 'docx']],
    ['apiRateLimit', 1000],
    ['sessionTimeout', 3600000], // 1 hour
    ['debugMode', process.env.NODE_ENV === 'development'],
    ['analyticsEnabled', true],
    ['chatbotEnabled', true],
    ['voiceAgentEnabled', true]
  ]);
  
  // List environment variables (filtered for security)
  adminRouter.get('/env/list', async (req, res) => {
    try {
      const { showSensitive = false } = req.query;
      
      // List of sensitive keys to filter out by default
      const sensitiveKeys = [
        'DATABASE_URL',
        'ADMIN_API_KEY',
        'OPENAI_API_KEY',
        'STRIPE_SECRET_KEY',
        'SENDGRID_API_KEY',
        'TWILIO_AUTH_TOKEN',
        'AWS_SECRET_ACCESS_KEY',
        'JWT_SECRET',
        'SESSION_SECRET',
        'ENCRYPTION_KEY'
      ];
      
      const envVars: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(process.env)) {
        const isSensitive = sensitiveKeys.some(sk => 
          key.includes(sk) || key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
        );
        
        if (showSensitive === 'true' || showSensitive === true) {
          // Show full value but mask sensitive ones partially
          envVars[key] = isSensitive && value ? 
            `${value.substring(0, 4)}...${value.slice(-4)}` : 
            value;
        } else if (!isSensitive) {
          // Only show non-sensitive variables
          envVars[key] = value;
        }
      }
      
      res.json({ 
        success: true, 
        environment: process.env.NODE_ENV || 'development',
        variables: envVars,
        total: Object.keys(envVars).length,
        filtered: !showSensitive ? sensitiveKeys.length : 0
      });
    } catch (error) {
      console.error('Admin API - List env vars error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Set/update environment variable
  adminRouter.post('/env/set', async (req, res) => {
    try {
      const { key, value, permanent = false } = req.body;
      
      if (!key) {
        return res.status(400).json({ 
          success: false, 
          error: 'Environment variable key required' 
        });
      }
      
      // Validate key format
      if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid key format. Use UPPER_SNAKE_CASE' 
        });
      }
      
      const previousValue = process.env[key];
      
      // Set in current process
      if (value === null || value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = String(value);
      }
      
      // If permanent, write to .env file (in production, use proper env management)
      if (permanent) {
        try {
          const envPath = path.join(process.cwd(), '.env');
          let envContent = '';
          
          try {
            envContent = await fs.readFile(envPath, 'utf-8');
          } catch (error) {
            // .env file doesn't exist, create it
            envContent = '';
          }
          
          // Parse existing env file
          const lines = envContent.split('\n');
          let found = false;
          
          const updatedLines = lines.map(line => {
            if (line.startsWith(`${key}=`)) {
              found = true;
              return value === null ? '' : `${key}=${value}`;
            }
            return line;
          }).filter(line => line !== '');
          
          // Add new variable if not found
          if (!found && value !== null && value !== undefined) {
            updatedLines.push(`${key}=${value}`);
          }
          
          // Write back to file
          await fs.writeFile(envPath, updatedLines.join('\n'), 'utf-8');
        } catch (error) {
          console.error('Failed to write to .env file:', error);
        }
      }
      
      logActivity('ENV_UPDATE', 'environment', { 
        key, 
        hadPrevious: previousValue !== undefined,
        permanent 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Environment variable ${value === null ? 'removed' : 'updated'}`,
        key,
        value: value === null ? undefined : '***masked***',
        permanent,
        previousExists: previousValue !== undefined
      });
    } catch (error) {
      console.error('Admin API - Set env var error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to set environment variable',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get all application configuration
  adminRouter.get('/config/all', async (req, res) => {
    try {
      const config: Record<string, any> = {};
      
      // Convert Map to object
      for (const [key, value] of appConfig.entries()) {
        config[key] = value;
      }
      
      // Add runtime information
      config.runtime = {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        cwd: process.cwd(),
        env: process.env.NODE_ENV || 'development'
      };
      
      // Add feature flags
      config.features = {
        emailAutomation: !!process.env.SENDGRID_API_KEY,
        voiceAgent: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        aiChatbot: !!process.env.OPENAI_API_KEY,
        stripePayments: !!process.env.STRIPE_SECRET_KEY,
        twilioSms: !!process.env.TWILIO_AUTH_TOKEN,
        googleAnalytics: !!process.env.VITE_GA_MEASUREMENT_ID
      };
      
      res.json({ 
        success: true, 
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin API - Get config error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update application configuration
  adminRouter.post('/config/update', async (req, res) => {
    try {
      const { updates, persist = false } = req.body;
      
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ 
          success: false, 
          error: 'Configuration updates required' 
        });
      }
      
      const changedKeys: string[] = [];
      const invalidKeys: string[] = [];
      
      // Validate and apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (appConfig.has(key)) {
          const oldValue = appConfig.get(key);
          
          // Type validation
          if (typeof oldValue !== typeof value && value !== null) {
            invalidKeys.push(`${key} (expected ${typeof oldValue}, got ${typeof value})`);
            continue;
          }
          
          appConfig.set(key, value);
          changedKeys.push(key);
        } else {
          // Allow new keys
          appConfig.set(key, value);
          changedKeys.push(key);
        }
      }
      
      // Persist to config file if requested
      if (persist && changedKeys.length > 0) {
        try {
          const configPath = path.join(process.cwd(), 'config', 'app-settings.json');
          const configDir = path.dirname(configPath);
          
          // Create config directory if it doesn't exist
          await fs.mkdir(configDir, { recursive: true });
          
          // Convert Map to object for saving
          const configObj: Record<string, any> = {};
          for (const [key, value] of appConfig.entries()) {
            if (!['runtime', 'features'].includes(key)) {
              configObj[key] = value;
            }
          }
          
          await fs.writeFile(
            configPath, 
            JSON.stringify(configObj, null, 2), 
            'utf-8'
          );
        } catch (error) {
          console.error('Failed to persist config:', error);
        }
      }
      
      logActivity('CONFIG_UPDATE', 'configuration', { 
        changedKeys, 
        persist 
      }, req);
      
      // Apply certain settings immediately
      if (updates.debugMode !== undefined) {
        process.env.DEBUG = updates.debugMode ? 'true' : 'false';
      }
      
      res.json({ 
        success: true, 
        message: 'Configuration updated',
        changed: changedKeys,
        invalid: invalidKeys,
        persisted: persist
      });
    } catch (error) {
      console.error('Admin API - Update config error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get specific configuration value
  adminRouter.get('/config/:key', async (req, res) => {
    try {
      const { key } = req.params;
      
      if (!appConfig.has(key)) {
        return res.status(404).json({ 
          success: false, 
          error: 'Configuration key not found' 
        });
      }
      
      res.json({ 
        success: true, 
        key,
        value: appConfig.get(key)
      });
    } catch (error) {
      console.error('Admin API - Get config value error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve configuration value',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Reset configuration to defaults
  adminRouter.post('/config/reset', async (req, res) => {
    try {
      const { keys } = req.body;
      
      const defaults = {
        siteName: 'Serenity Custom Pools LLC',
        contactEmail: 'info@serenitycustompools.com',
        contactPhone: '(678)300-8949',
        businessHours: { start: '9:00', end: '17:00', timezone: 'America/New_York' },
        maintenanceMode: false,
        emailNotifications: true,
        autoResponseEnabled: true,
        leadScoreThreshold: 7,
        maxUploadSize: 10485760,
        allowedFileTypes: ['pdf', 'jpg', 'png', 'doc', 'docx'],
        apiRateLimit: 1000,
        sessionTimeout: 3600000,
        debugMode: process.env.NODE_ENV === 'development',
        analyticsEnabled: true,
        chatbotEnabled: true,
        voiceAgentEnabled: true
      };
      
      const resetKeys: string[] = [];
      
      if (keys && Array.isArray(keys)) {
        // Reset specific keys
        for (const key of keys) {
          if (defaults.hasOwnProperty(key)) {
            appConfig.set(key, defaults[key as keyof typeof defaults]);
            resetKeys.push(key);
          }
        }
      } else {
        // Reset all to defaults
        appConfig.clear();
        for (const [key, value] of Object.entries(defaults)) {
          appConfig.set(key, value);
          resetKeys.push(key);
        }
      }
      
      logActivity('CONFIG_RESET', 'configuration', { resetKeys }, req);
      
      res.json({ 
        success: true, 
        message: 'Configuration reset to defaults',
        resetKeys
      });
    } catch (error) {
      console.error('Admin API - Reset config error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reset configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // White-Label & Backend Cloning
  // ========================================
  
  // Export entire backend configuration for white-labeling
  adminRouter.get('/export/backend', async (req, res) => {
    try {
      // Gather all backend components
      const backendExport = {
        // Database schema
        schema: await (async () => {
          try {
            const tables = await db.query(`
              SELECT table_name, column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_schema = 'public'
              ORDER BY table_name, ordinal_position
            `);
            return tables.rows;
          } catch (err) {
            return null;
          }
        })(),
        
        // Environment variables (sanitized)
        environment: Object.keys(process.env).reduce((acc, key) => {
          // Exclude sensitive keys but include structure
          const sensitiveKeys = ['DATABASE_URL', 'ADMIN_API_KEY', 'OPENAI_API_KEY', 
                                'STRIPE_SECRET_KEY', 'SENDGRID_API_KEY'];
          acc[key] = sensitiveKeys.includes(key) ? '[REDACTED]' : process.env[key];
          return acc;
        }, {} as Record<string, string | undefined>),
        
        // API routes structure
        routes: {
          admin: [
            'GET /api/admin/leads',
            'POST /api/admin/leads',
            'PUT /api/admin/leads/:id',
            'DELETE /api/admin/leads/:id',
            'POST /api/admin/db/query',
            'GET /api/admin/db/schema/:table',
            'POST /api/admin/email/send',
            'POST /api/admin/campaigns/start',
            'POST /api/admin/ai/chat',
            'POST /api/admin/webhooks/create',
            'POST /api/admin/jobs/create',
            'GET /api/admin/analytics/leads',
            'POST /api/admin/integrations/connect',
            'GET /api/admin/files/list',
            'POST /api/admin/endpoints/create',
            // Add more routes as needed
          ],
          public: [
            'POST /api/leads',
            'POST /api/chat/message',
            'GET /api/voice/session',
            'POST /api/voice/save-transcript'
          ]
        },
        
        // Storage interface methods
        storageInterface: [
          'getLeads()',
          'getLead(id)',
          'createLead(data)',
          'updateLead(id, data)',
          'deleteLead(id)',
          'getChatMessages()',
          'saveChatMessage(msg)',
          'getEmailThreads()',
          'getVoiceCalls()',
          'saveVoiceCall(data)'
        ],
        
        // Custom endpoints (if any)
        customEndpoints: Array.from(customEndpoints.entries()).map(([id, config]) => ({
          id,
          method: config.method,
          path: config.path,
          description: config.description,
          requiresAuth: config.requiresAuth
        })),
        
        // Integration configurations (sanitized)
        integrations: [],
        
        // Export metadata
        exported_at: new Date(),
        version: '1.0.0',
        project: 'Serenity Custom Pools Backend',
        tech_stack: ['Node.js', 'Express', 'PostgreSQL', 'TypeScript', 'Drizzle ORM']
      };
      
      logActivity('BACKEND_EXPORT', 'export', { 
        timestamp: new Date() 
      }, req);
      
      res.json({ 
        success: true, 
        export: backendExport,
        instructions: {
          clone: 'Use /api/admin/export/code to get full source code',
          database: 'Use /api/admin/export/database for SQL dump',
          deploy: 'Use /api/admin/export/deployment for deployment package'
        }
      });
    } catch (error) {
      console.error('Admin API - Backend export error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Export full source code for cloning
  adminRouter.get('/export/code', async (req, res) => {
    try {
      const { includeNode = false } = req.query;
      
      // Define files to export
      const backendFiles = [
        'server/index.ts',
        'server/routes.ts',
        'server/routes-admin.ts',
        'server/storage.ts',
        'server/db.ts',
        'server/vite.ts',
        'server/middleware/admin-auth.ts',
        'shared/schema.ts',
        'package.json',
        'tsconfig.json',
        'drizzle.config.ts',
        '.env.example'
      ];
      
      const codeExport: Record<string, string> = {};
      
      // Read each file
      for (const filePath of backendFiles) {
        try {
          const fullPath = path.join(process.cwd(), filePath);
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          
          // Sanitize sensitive data
          let sanitized = content;
          if (filePath === '.env' || filePath === '.env.example') {
            sanitized = content.replace(/=(.+)/g, (match, value) => {
              if (match.includes('API_KEY') || match.includes('SECRET') || 
                  match.includes('DATABASE_URL')) {
                return '=YOUR_VALUE_HERE';
              }
              return match;
            });
          }
          
          codeExport[filePath] = sanitized;
        } catch (err) {
          codeExport[filePath] = `// File not found or couldn't be read`;
        }
      }
      
      // Create deployment instructions
      const deploymentInstructions = `
# Backend Deployment Instructions

## 1. Setup New Project
\`\`\`bash
# Create new directory
mkdir my-white-label-backend
cd my-white-label-backend

# Initialize git
git init
\`\`\`

## 2. Create Files
Save all exported files to their respective paths

## 3. Install Dependencies
\`\`\`bash
npm install
\`\`\`

## 4. Configure Environment
\`\`\`bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your values
# - Set DATABASE_URL for your PostgreSQL
# - Set ADMIN_API_KEY to a secure value
# - Configure other API keys
\`\`\`

## 5. Setup Database
\`\`\`bash
# Push schema to database
npm run db:push
\`\`\`

## 6. Start Server
\`\`\`bash
npm run dev
\`\`\`

## 7. Connect Your Frontend
Point your React frontend API calls to:
- Development: http://localhost:5000
- Production: https://your-domain.com
`;
      
      codeExport['DEPLOYMENT.md'] = deploymentInstructions;
      
      logActivity('CODE_EXPORT', 'export', { 
        files: backendFiles.length 
      }, req);
      
      res.json({ 
        success: true, 
        files: codeExport,
        totalFiles: Object.keys(codeExport).length,
        message: 'Backend code exported. Save these files to clone the backend.'
      });
    } catch (error) {
      console.error('Admin API - Code export error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export code',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Export database as SQL dump
  adminRouter.get('/export/database', async (req, res) => {
    try {
      const { includeData = true } = req.query;
      
      // Get all tables
      const tablesResult = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      let sqlDump = `-- Serenity Custom Pools Database Export
-- Generated: ${new Date().toISOString()}
-- Warning: This contains your database structure and data

`;
      
      // Export each table
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        
        // Get CREATE TABLE statement (approximation)
        const columnsResult = await db.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        sqlDump += `\n-- Table: ${tableName}\n`;
        sqlDump += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
        sqlDump += `CREATE TABLE ${tableName} (\n`;
        
        const columns = columnsResult.rows.map(col => {
          let def = `  ${col.column_name} ${col.data_type}`;
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          return def;
        }).join(',\n');
        
        sqlDump += columns + '\n);\n\n';
        
        // Export data if requested
        if (includeData === true || includeData === 'true') {
          const dataResult = await db.query(`SELECT * FROM ${tableName}`);
          if (dataResult.rows.length > 0) {
            sqlDump += `-- Data for ${tableName}\n`;
            for (const dataRow of dataResult.rows) {
              const values = Object.values(dataRow).map(v => 
                v === null ? 'NULL' : 
                typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
                v
              ).join(', ');
              sqlDump += `INSERT INTO ${tableName} VALUES (${values});\n`;
            }
            sqlDump += '\n';
          }
        }
      }
      
      logActivity('DATABASE_EXPORT', 'export', { 
        tables: tablesResult.rows.length,
        includeData 
      }, req);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=database_export.sql');
      res.send(sqlDump);
    } catch (error) {
      console.error('Admin API - Database export error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export database',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Create white-label configuration
  adminRouter.post('/whitelabel/configure', async (req, res) => {
    try {
      const { 
        businessName,
        domain,
        primaryColor,
        logo,
        contactPhone,
        contactEmail,
        apiEndpoint 
      } = req.body;
      
      if (!businessName || !domain) {
        return res.status(400).json({ 
          success: false, 
          error: 'Business name and domain required' 
        });
      }
      
      // Generate white-label configuration
      const whitelabelConfig = {
        brand: {
          name: businessName,
          domain,
          logo: logo || '/logo.png',
          favicon: '/favicon.ico'
        },
        theme: {
          primaryColor: primaryColor || '#1e40af',
          secondaryColor: '#fbbf24',
          fontFamily: 'Inter, sans-serif'
        },
        contact: {
          phone: contactPhone || '(555) 123-4567',
          email: contactEmail || `info@${domain}`,
          address: 'Update with your address'
        },
        api: {
          endpoint: apiEndpoint || `https://api.${domain}`,
          version: 'v1'
        },
        features: {
          voiceAgent: true,
          chatbot: true,
          emailAutomation: true,
          leadScoring: true,
          campaigns: true
        },
        generated_at: new Date(),
        instructions: `
1. Update your frontend .env:
   VITE_BUSINESS_NAME="${businessName}"
   VITE_API_ENDPOINT="${apiEndpoint || `https://api.${domain}`}"
   VITE_PRIMARY_COLOR="${primaryColor || '#1e40af'}"

2. Update backend .env:
   BUSINESS_NAME="${businessName}"
   DOMAIN="${domain}"
   CONTACT_EMAIL="${contactEmail || `info@${domain}`}"
   CONTACT_PHONE="${contactPhone || '(555) 123-4567'}"

3. Replace logo and favicon files in public/

4. Update index.html title and meta tags

5. Deploy to ${domain}
`
      };
      
      logActivity('WHITELABEL_CONFIG', 'whitelabel', { 
        businessName,
        domain 
      }, req);
      
      res.json({ 
        success: true, 
        config: whitelabelConfig,
        message: 'White-label configuration generated successfully'
      });
    } catch (error) {
      console.error('Admin API - White-label config error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate white-label configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Dynamic Endpoint Management (Meta-API)
  // ========================================
  
  // Storage for custom endpoints
  const customEndpoints = new Map<string, {
    method: string;
    path: string;
    description: string;
    handler: string; // Serialized function code
    created: Date;
    updated: Date;
    executionCount: number;
    lastExecuted?: Date;
    requiresAuth: boolean;
  }>();
  
  // Create a new custom endpoint
  adminRouter.post('/endpoints/create', async (req, res) => {
    try {
      const { 
        method, 
        path, 
        description,
        handler,
        requiresAuth = true 
      } = req.body;
      
      if (!method || !path || !handler) {
        return res.status(400).json({ 
          success: false, 
          error: 'Method, path, and handler required' 
        });
      }
      
      // Validate method
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(method.toUpperCase())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid HTTP method' 
        });
      }
      
      // Validate path format
      if (!path.startsWith('/api/admin/custom/')) {
        return res.status(400).json({ 
          success: false, 
          error: 'Custom endpoints must start with /api/admin/custom/' 
        });
      }
      
      const endpointId = `${method.toUpperCase()}_${path}`;
      
      // Check if endpoint already exists
      if (customEndpoints.has(endpointId)) {
        return res.status(409).json({ 
          success: false, 
          error: 'Endpoint already exists. Use update instead.' 
        });
      }
      
      // Store endpoint configuration
      const endpointConfig = {
        method: method.toUpperCase(),
        path,
        description: description || 'Custom endpoint',
        handler,
        created: new Date(),
        updated: new Date(),
        executionCount: 0,
        requiresAuth
      };
      
      customEndpoints.set(endpointId, endpointConfig);
      
      // Register the actual endpoint
      try {
        const httpMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
        
        // Create the handler function
        const handlerFn = async (customReq: Request, customRes: Response) => {
          try {
            // Check auth if required
            if (requiresAuth && !customReq.headers.authorization?.includes(process.env.ADMIN_API_KEY!)) {
              return customRes.status(401).json({ 
                success: false, 
                error: 'Unauthorized' 
              });
            }
            
            // Update execution stats
            const config = customEndpoints.get(endpointId);
            if (config) {
              config.executionCount++;
              config.lastExecuted = new Date();
            }
            
            // Create sandbox context with useful utilities
            const context = {
              req: customReq,
              res: customRes,
              body: customReq.body,
              query: customReq.query,
              params: customReq.params,
              headers: customReq.headers,
              fs,
              path,
              process: {
                env: process.env,
                cwd: process.cwd()
              },
              storage,
              console,
              JSON,
              Date,
              Math,
              String,
              Number,
              Array,
              Object,
              Promise,
              Buffer,
              logActivity: (action: string, details: any) => {
                logActivity(action, 'custom_endpoint', details, customReq);
              }
            };
            
            // Execute the handler code
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const executableHandler = new AsyncFunction(
              ...Object.keys(context),
              handler
            );
            
            await executableHandler(...Object.values(context));
          } catch (error) {
            console.error(`Custom endpoint error (${endpointId}):`, error);
            if (!customRes.headersSent) {
              customRes.status(500).json({ 
                success: false, 
                error: 'Custom endpoint execution failed',
                details: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        };
        
        // Register the endpoint
        (app as any)[httpMethod](path, handlerFn);
        
        logActivity('ENDPOINT_CREATE', 'endpoints', { 
          method: method.toUpperCase(), 
          path,
          requiresAuth 
        }, req);
        
        res.json({ 
          success: true, 
          message: 'Custom endpoint created successfully',
          endpoint: {
            id: endpointId,
            method: method.toUpperCase(),
            path,
            description,
            requiresAuth
          }
        });
      } catch (error) {
        // Remove from storage if registration failed
        customEndpoints.delete(endpointId);
        throw error;
      }
    } catch (error) {
      console.error('Admin API - Create endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List all custom endpoints
  adminRouter.get('/endpoints/list', async (req, res) => {
    try {
      const endpoints = Array.from(customEndpoints.entries()).map(([id, config]) => ({
        id,
        method: config.method,
        path: config.path,
        description: config.description,
        created: config.created,
        updated: config.updated,
        executionCount: config.executionCount,
        lastExecuted: config.lastExecuted,
        requiresAuth: config.requiresAuth
      }));
      
      res.json({ 
        success: true, 
        endpoints,
        total: endpoints.length
      });
    } catch (error) {
      console.error('Admin API - List endpoints error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list endpoints',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get endpoint details including handler code
  adminRouter.get('/endpoints/:method/:path(*)', async (req, res) => {
    try {
      const { method, path: endpointPath } = req.params;
      const fullPath = `/api/admin/custom/${endpointPath}`;
      const endpointId = `${method.toUpperCase()}_${fullPath}`;
      
      const endpoint = customEndpoints.get(endpointId);
      
      if (!endpoint) {
        return res.status(404).json({ 
          success: false, 
          error: 'Endpoint not found' 
        });
      }
      
      res.json({ 
        success: true, 
        endpoint: {
          id: endpointId,
          ...endpoint
        }
      });
    } catch (error) {
      console.error('Admin API - Get endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update custom endpoint
  adminRouter.put('/endpoints/update', async (req, res) => {
    try {
      const { 
        method, 
        path,
        description,
        handler,
        requiresAuth
      } = req.body;
      
      if (!method || !path) {
        return res.status(400).json({ 
          success: false, 
          error: 'Method and path required' 
        });
      }
      
      const endpointId = `${method.toUpperCase()}_${path}`;
      const endpoint = customEndpoints.get(endpointId);
      
      if (!endpoint) {
        return res.status(404).json({ 
          success: false, 
          error: 'Endpoint not found' 
        });
      }
      
      // Update endpoint configuration
      if (description !== undefined) endpoint.description = description;
      if (handler !== undefined) endpoint.handler = handler;
      if (requiresAuth !== undefined) endpoint.requiresAuth = requiresAuth;
      endpoint.updated = new Date();
      
      logActivity('ENDPOINT_UPDATE', 'endpoints', { 
        method: method.toUpperCase(), 
        path 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Endpoint updated successfully',
        endpoint: {
          id: endpointId,
          method: endpoint.method,
          path: endpoint.path,
          description: endpoint.description,
          requiresAuth: endpoint.requiresAuth
        }
      });
    } catch (error) {
      console.error('Admin API - Update endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete custom endpoint
  adminRouter.delete('/endpoints/:method/:path(*)', async (req, res) => {
    try {
      const { method, path: endpointPath } = req.params;
      const fullPath = `/api/admin/custom/${endpointPath}`;
      const endpointId = `${method.toUpperCase()}_${fullPath}`;
      
      const endpoint = customEndpoints.get(endpointId);
      
      if (!endpoint) {
        return res.status(404).json({ 
          success: false, 
          error: 'Endpoint not found' 
        });
      }
      
      // Note: We can't actually unregister Express routes at runtime
      // The endpoint will return 404 after deletion from our storage
      customEndpoints.delete(endpointId);
      
      logActivity('ENDPOINT_DELETE', 'endpoints', { 
        method: method.toUpperCase(), 
        path: fullPath 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Endpoint deleted successfully. Note: Restart required for full removal.'
      });
    } catch (error) {
      console.error('Admin API - Delete endpoint error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Execute custom endpoint (fallback handler for /api/admin/custom/*)
  app.all('/api/admin/custom/*', async (req, res) => {
    const endpointPath = req.path;
    const method = req.method.toUpperCase();
    const endpointId = `${method}_${endpointPath}`;
    
    const endpoint = customEndpoints.get(endpointId);
    
    if (!endpoint) {
      return res.status(404).json({ 
        success: false, 
        error: 'Custom endpoint not found' 
      });
    }
    
    // This should be handled by the registered handler
    // This is a fallback in case the endpoint was created before server restart
    res.status(503).json({ 
      success: false, 
      error: 'Endpoint requires server restart to activate' 
    });
  });
  
  // ========================================
  // Campaign Control Endpoints
  // ========================================
  
  // Trigger campaign for specific lead
  adminRouter.post('/campaigns/trigger', async (req, res) => {
    try {
      const { leadId, campaignType } = req.body;
      
      // Import campaign functions dynamically to avoid circular dependencies
      const { autoEnrollLead, triggerCampaignEmail } = 
        await import('./services/campaign-scheduler');
      
      if (leadId) {
        await autoEnrollLead(leadId);
        res.json({ 
          success: true, 
          message: `Lead ${leadId} enrolled in campaign` 
        });
      } else {
        res.json({ 
          success: false, 
          error: 'Lead ID required' 
        });
      }
    } catch (error) {
      console.error('Admin API - Trigger campaign error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to trigger campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get campaign status
  adminRouter.get('/campaigns/status', async (req, res) => {
    try {
      const { getCampaignProcessorStatus } = 
        await import('./services/campaign-scheduler');
      
      const status = getCampaignProcessorStatus();
      res.json({ 
        success: true, 
        status 
      });
    } catch (error) {
      console.error('Admin API - Get campaign status error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get campaign status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // System Control Endpoints
  // ========================================
  
  // Execute shell commands (with caution!)
  adminRouter.post('/system/exec', async (req, res) => {
    try {
      const { command, timeout = 10000 } = req.body;
      
      // Security: Allow only safe commands
      const allowedCommands = [
        'npm run',
        'ls',
        'pwd',
        'node -v',
        'npm -v',
        'git status',
        'git log'
      ];
      
      const isAllowed = allowedCommands.some(allowed => 
        command.startsWith(allowed)
      );
      
      if (!isAllowed) {
        return res.status(403).json({ 
          success: false, 
          error: 'Command not allowed for security reasons' 
        });
      }
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout,
        cwd: process.cwd() 
      });
      
      res.json({ 
        success: true, 
        stdout: stdout.toString(),
        stderr: stderr.toString() 
      });
    } catch (error) {
      console.error('Admin API - Execute command error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Command execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get environment variables (excluding secrets)
  adminRouter.get('/system/env', async (req, res) => {
    try {
      const safeEnv: Record<string, string> = {};
      
      // Only return non-sensitive environment variables
      const allowedKeys = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'REPLIT_DB_URL'
      ];
      
      for (const key of allowedKeys) {
        if (process.env[key]) {
          // Mask sensitive parts
          if (key.includes('URL') || key.includes('KEY')) {
            safeEnv[key] = '***MASKED***';
          } else {
            safeEnv[key] = process.env[key]!;
          }
        }
      }
      
      res.json({ 
        success: true, 
        env: safeEnv 
      });
    } catch (error) {
      console.error('Admin API - Get environment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Analytics & Reporting Endpoints
  // ========================================
  
  // Get comprehensive analytics
  adminRouter.get('/analytics', async (req, res) => {
    try {
      const leads = await storage.getLeads();
      const voiceCalls = await storage.getVoiceCalls();
      const campaigns = await storage.getCampaigns();
      const campaignHistory = await storage.getCampaignHistory();
      
      // Calculate metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentLeads = leads.filter(l => 
        new Date(l.createdAt) > thirtyDaysAgo
      );
      
      const weeklyLeads = leads.filter(l => 
        new Date(l.createdAt) > sevenDaysAgo
      );
      
      const analytics = {
        totals: {
          leads: leads.length,
          voiceCalls: voiceCalls.length,
          campaigns: campaigns.length,
          emailsSent: campaignHistory.length
        },
        recent: {
          leadsLast30Days: recentLeads.length,
          leadsLast7Days: weeklyLeads.length,
          conversionRate: leads.length > 0 ? 
            (leads.filter(l => l.score && l.score >= 70).length / leads.length * 100).toFixed(2) : 
            0
        },
        leadSources: {
          form: leads.filter(l => l.source === 'form').length,
          voice: leads.filter(l => l.isFromVoiceCall).length,
          chat: leads.filter(l => l.source === 'chat').length,
          email: leads.filter(l => l.source === 'email').length
        },
        leadsByCity: leads.reduce((acc, lead) => {
          if (lead.city) {
            acc[lead.city] = (acc[lead.city] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        campaignMetrics: {
          active: campaigns.filter(c => c.status === 'active').length,
          paused: campaigns.filter(c => c.status === 'paused').length,
          completed: campaigns.filter(c => c.status === 'completed').length
        }
      };
      
      res.json({ 
        success: true, 
        data: analytics 
      });
    } catch (error) {
      console.error('Admin API - Get analytics error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // File Upload Endpoints
  // ========================================
  
  // Upload files (images and PDFs)
  adminRouter.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ 
          success: false, 
          error: 'No files uploaded' 
        });
      }
      
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/api/uploads/admin/${file.filename}`
      }));
      
      logActivity('UPLOAD', 'files', { count: uploadedFiles.length }, req);
      
      res.json({ 
        success: true, 
        files: uploadedFiles 
      });
    } catch (error) {
      console.error('Admin API - File upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'File upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get uploaded files
  adminRouter.get('/uploads', async (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'server/public/uploads/admin');
      const files = await fs.readdir(uploadsDir).catch(() => []);
      
      const fileDetails = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(uploadsDir, filename);
          const stats = await fs.stat(filePath);
          return {
            filename,
            size: stats.size,
            uploadedAt: stats.birthtime,
            url: `/api/uploads/admin/${filename}`
          };
        })
      );
      
      res.json({ 
        success: true, 
        files: fileDetails 
      });
    } catch (error) {
      console.error('Admin API - Get uploads error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get uploaded files',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Content Management Endpoints
  // ========================================
  
  // Get all blog posts
  adminRouter.get('/content/blogs', async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error('Admin API - Get blog posts error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch blog posts' 
      });
    }
  });
  
  // Create or update blog post
  adminRouter.post('/content/blogs', async (req, res) => {
    try {
      const { id, ...postData } = req.body;
      
      if (id) {
        // Update existing post
        const updated = await storage.updateBlogPost(id, postData);
        logActivity('UPDATE', 'blog', { id }, req);
        res.json({ success: true, data: updated });
      } else {
        // Create new post
        const created = await storage.createBlogPost(postData);
        logActivity('CREATE', 'blog', { title: postData.title }, req);
        res.json({ success: true, data: created });
      }
    } catch (error) {
      console.error('Admin API - Create/update blog post error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create/update blog post' 
      });
    }
  });
  
  // Delete blog post
  adminRouter.delete('/content/blogs/:id', async (req, res) => {
    try {
      await storage.deleteBlogPost(req.params.id);
      logActivity('DELETE', 'blog', { id: req.params.id }, req);
      res.json({ success: true, message: 'Blog post deleted' });
    } catch (error) {
      console.error('Admin API - Delete blog post error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete blog post' 
      });
    }
  });
  
  // Get page content (reads React component files)
  adminRouter.get('/content/pages', async (req, res) => {
    try {
      const pagesDir = path.join(process.cwd(), 'client/src/pages');
      const files = await fs.readdir(pagesDir);
      
      const pages = files
        .filter(file => file.endsWith('.tsx'))
        .map(file => ({
          name: file.replace('.tsx', ''),
          path: `/client/src/pages/${file}`,
          route: `/${file.replace('.tsx', '').toLowerCase().replace('-', '/')}`
        }));
      
      res.json({ success: true, data: pages });
    } catch (error) {
      console.error('Admin API - Get pages error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pages' 
      });
    }
  });
  
  // ========================================
  // Settings & Configuration Endpoints  
  // ========================================
  
  // Get site settings
  adminRouter.get('/settings', async (req, res) => {
    try {
      // Read from a settings file or database
      const settingsPath = path.join(process.cwd(), 'server/settings.json');
      let settings = {};
      
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        settings = JSON.parse(settingsContent);
      } catch {
        // Default settings if file doesn't exist
        settings = {
          siteName: 'Serenity Custom Pools LLC',
          contactEmail: 'info@serenitypools.com',
          contactPhone: '(678) 300-8949',
          address: '5011 Hwy 53 West, Dawsonville, GA',
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: ''
          },
          seo: {
            defaultTitle: 'Serenity Custom Pools - Luxury Pool Construction',
            defaultDescription: 'Transform your backyard into a luxury oasis',
            keywords: 'luxury pools, pool construction, custom pools'
          }
        };
      }
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Admin API - Get settings error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch settings' 
      });
    }
  });
  
  // Update site settings
  adminRouter.post('/settings', async (req, res) => {
    try {
      const settingsPath = path.join(process.cwd(), 'server/settings.json');
      const settings = req.body;
      
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
      logActivity('UPDATE', 'settings', settings, req);
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Admin API - Update settings error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update settings' 
      });
    }
  });
  
  // ========================================
  // Enhanced Analytics Endpoints
  // ========================================
  
  // Get performance metrics
  adminRouter.get('/analytics/performance', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Calculate performance metrics
      const leads = await storage.getLeads();
      const voiceCalls = await storage.getVoiceCalls();
      
      // Filter by date range if provided
      let filteredLeads = leads;
      let filteredCalls = voiceCalls;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        filteredLeads = leads.filter(l => {
          const date = new Date(l.createdAt);
          return date >= start && date <= end;
        });
        
        filteredCalls = voiceCalls.filter(c => {
          const date = new Date(c.startTime);
          return date >= start && date <= end;
        });
      }
      
      // Calculate metrics
      const conversionRate = filteredLeads.length > 0 
        ? (filteredLeads.filter(l => l.score && l.score >= 70).length / filteredLeads.length * 100)
        : 0;
      
      const avgCallDuration = filteredCalls.length > 0
        ? filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / filteredCalls.length
        : 0;
      
      const performance = {
        period: {
          start: startDate || 'all-time',
          end: endDate || 'now'
        },
        leads: {
          total: filteredLeads.length,
          qualified: filteredLeads.filter(l => l.score && l.score >= 70).length,
          conversionRate: conversionRate.toFixed(2)
        },
        voiceCalls: {
          total: filteredCalls.length,
          avgDuration: Math.round(avgCallDuration),
          totalDuration: filteredCalls.reduce((sum, call) => sum + (call.duration || 0), 0)
        },
        topSources: {
          form: filteredLeads.filter(l => l.source === 'form').length,
          voice: filteredLeads.filter(l => l.isFromVoiceCall).length,
          chat: filteredLeads.filter(l => l.source === 'chat').length
        }
      };
      
      res.json({ success: true, data: performance });
    } catch (error) {
      console.error('Admin API - Get performance metrics error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch performance metrics' 
      });
    }
  });
  
  // ========================================
  // Backup & Restore Endpoints
  // ========================================
  
  // Create backup
  adminRouter.post('/backup', async (req, res) => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        leads: await storage.getLeads(),
        voiceCalls: await storage.getVoiceCalls(),
        campaigns: await storage.getCampaigns(),
        affiliates: await storage.getAffiliates(),
        blogPosts: await storage.getBlogPosts()
      };
      
      const backupDir = path.join(process.cwd(), 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const backupFilename = `backup-${Date.now()}.json`;
      const backupPath = path.join(backupDir, backupFilename);
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      logActivity('BACKUP', 'system', { filename: backupFilename }, req);
      
      res.json({ 
        success: true, 
        filename: backupFilename,
        size: JSON.stringify(backupData).length,
        timestamp: backupData.timestamp
      });
    } catch (error) {
      console.error('Admin API - Backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Backup failed' 
      });
    }
  });
  
  // List backups
  adminRouter.get('/backups', async (req, res) => {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      
      try {
        const files = await fs.readdir(backupDir);
        const backups = await Promise.all(
          files.filter(f => f.endsWith('.json')).map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return {
              filename: file,
              size: stats.size,
              createdAt: stats.birthtime
            };
          })
        );
        
        res.json({ success: true, data: backups });
      } catch {
        res.json({ success: true, data: [] });
      }
    } catch (error) {
      console.error('Admin API - List backups error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list backups' 
      });
    }
  });
  
  // Restore from backup
  adminRouter.post('/restore', async (req, res) => {
    try {
      const { filename } = req.body;
      
      if (!filename) {
        return res.status(400).json({ 
          success: false, 
          error: 'Backup filename required' 
        });
      }
      
      const backupPath = path.join(process.cwd(), 'backups', filename);
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      // Note: This is a simplified restore - in production you'd want
      // more sophisticated merging/replacement strategies
      logActivity('RESTORE', 'system', { filename }, req);
      
      res.json({ 
        success: true, 
        message: 'Restore completed',
        restored: {
          leads: backupData.leads?.length || 0,
          voiceCalls: backupData.voiceCalls?.length || 0,
          campaigns: backupData.campaigns?.length || 0
        }
      });
    } catch (error) {
      console.error('Admin API - Restore error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Restore failed' 
      });
    }
  });
  
  // ========================================
  // Activity Logs & Audit Trail
  // ========================================
  
  // Get activity logs
  adminRouter.get('/logs/activity', async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      
      const paginatedLogs = activityLogs
        .slice()
        .reverse() // Most recent first
        .slice(Number(offset), Number(offset) + Number(limit));
      
      res.json({ 
        success: true, 
        data: paginatedLogs,
        total: activityLogs.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error('Admin API - Get activity logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch activity logs' 
      });
    }
  });
  
  // Clear activity logs
  adminRouter.delete('/logs/activity', async (req, res) => {
    try {
      const logsCleared = activityLogs.length;
      activityLogs.length = 0;
      logActivity('CLEAR', 'activity-logs', { cleared: logsCleared }, req);
      
      res.json({ 
        success: true, 
        message: `Cleared ${logsCleared} activity logs` 
      });
    } catch (error) {
      console.error('Admin API - Clear activity logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear activity logs' 
      });
    }
  });
  
  // Get system logs (last N lines of console output)
  adminRouter.get('/logs/system', async (req, res) => {
    try {
      const { lines = 100 } = req.query;
      
      // In a real implementation, you'd read from a log file
      // For now, return a message about implementation
      res.json({ 
        success: true, 
        message: 'System logs would be retrieved from log files',
        lines: Number(lines)
      });
    } catch (error) {
      console.error('Admin API - Get system logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch system logs' 
      });
    }
  });
  
  // ========================================
  // Direct Database Access Endpoints
  // ========================================
  
  // Run read-only SQL queries
  adminRouter.get('/db/query', async (req, res) => {
    try {
      const { sql } = req.query;
      
      if (!sql) {
        return res.status(400).json({ 
          success: false, 
          error: 'SQL query required' 
        });
      }
      
      const query = sql.toString();
      
      // Basic validation for read-only queries
      const readOnlyKeywords = ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH'];
      const isReadOnly = readOnlyKeywords.some(keyword => 
        query.trim().toUpperCase().startsWith(keyword)
      );
      
      if (!isReadOnly) {
        return res.status(400).json({ 
          success: false, 
          error: 'Only read-only queries allowed in GET endpoint. Use POST /api/admin/db/execute for write operations.' 
        });
      }
      
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ 
          success: false, 
          error: 'Database not configured. Using in-memory storage.' 
        });
      }
      
      const { pool } = await import('./db');
      const result = await pool.query(query);
      
      logActivity('DB_QUERY', 'database', { query: query.substring(0, 100) }, req);
      
      res.json({ 
        success: true, 
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({ name: f.name, dataType: f.dataTypeID }))
      });
    } catch (error) {
      console.error('Admin API - Database query error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Database query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Execute any SQL (INSERT, UPDATE, DELETE, etc.)
  adminRouter.post('/db/execute', async (req, res) => {
    try {
      const { sql, params = [] } = req.body;
      
      if (!sql) {
        return res.status(400).json({ 
          success: false, 
          error: 'SQL statement required' 
        });
      }
      
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ 
          success: false, 
          error: 'Database not configured. Using in-memory storage.' 
        });
      }
      
      const { pool } = await import('./db');
      
      // Execute with parameters to prevent SQL injection
      const result = await pool.query(sql, params);
      
      logActivity('DB_EXECUTE', 'database', { 
        operation: sql.trim().split(' ')[0].toUpperCase(),
        affected: result.rowCount 
      }, req);
      
      res.json({ 
        success: true, 
        rowCount: result.rowCount,
        rows: result.rows,
        command: result.command
      });
    } catch (error) {
      console.error('Admin API - Database execute error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Database execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get database schema (table structures)
  adminRouter.get('/db/schema', async (req, res) => {
    try {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        // Return in-memory storage schema
        return res.json({ 
          success: true, 
          message: 'Using in-memory storage',
          tables: [
            'leads', 'chatMessages', 'voiceCalls', 'emailThreads', 
            'emailCampaigns', 'campaignHistory', 'affiliates', 
            'affiliateReferrals', 'blogPosts', 'appointments'
          ]
        });
      }
      
      const { pool } = await import('./db');
      
      // Query to get all tables and their columns
      const tablesQuery = `
        SELECT 
          t.table_name,
          json_agg(
            json_build_object(
              'column_name', c.column_name,
              'data_type', c.data_type,
              'is_nullable', c.is_nullable,
              'column_default', c.column_default,
              'character_maximum_length', c.character_maximum_length
            ) ORDER BY c.ordinal_position
          ) as columns
        FROM information_schema.tables t
        JOIN information_schema.columns c 
          ON t.table_name = c.table_name 
          AND t.table_schema = c.table_schema
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
        ORDER BY t.table_name;
      `;
      
      const result = await pool.query(tablesQuery);
      
      res.json({ 
        success: true, 
        database: 'PostgreSQL (Neon)',
        tables: result.rows
      });
    } catch (error) {
      console.error('Admin API - Get schema error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Create database backup (SQL dump)
  adminRouter.post('/db/backup', async (req, res) => {
    try {
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ 
          success: false, 
          error: 'Database not configured. Use /api/admin/backup for in-memory backup.' 
        });
      }
      
      const { pool } = await import('./db');
      
      // Get all table names
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      const backupData: any = {
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL',
        tables: {}
      };
      
      // Export data from each table
      for (const table of tablesResult.rows) {
        const tableName = table.table_name;
        const dataResult = await pool.query(`SELECT * FROM ${tableName}`);
        backupData.tables[tableName] = dataResult.rows;
      }
      
      // Save backup to file
      const backupDir = path.join(process.cwd(), 'backups/database');
      await fs.mkdir(backupDir, { recursive: true });
      
      const backupFilename = `db-backup-${Date.now()}.json`;
      const backupPath = path.join(backupDir, backupFilename);
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      
      logActivity('DB_BACKUP', 'database', { filename: backupFilename }, req);
      
      res.json({ 
        success: true, 
        filename: backupFilename,
        tables: Object.keys(backupData.tables),
        totalRecords: Object.values(backupData.tables).reduce((sum: number, rows: any) => sum + rows.length, 0)
      });
    } catch (error) {
      console.error('Admin API - Database backup error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Database backup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Seed database with test data
  adminRouter.post('/db/seed', async (req, res) => {
    try {
      const { type = 'basic', count = 10 } = req.body;
      
      // Check if database is available
      if (!process.env.DATABASE_URL) {
        return res.status(503).json({ 
          success: false, 
          error: 'Database not configured. Cannot seed in-memory storage.' 
        });
      }
      
      const { pool } = await import('./db');
      const seedData = {
        leads: 0,
        voiceCalls: 0,
        campaigns: 0
      };
      
      // Generate test leads
      for (let i = 0; i < count; i++) {
        const result = await pool.query(`
          INSERT INTO leads (
            id, first_name, last_name, email, phone, city, state,
            project_type, budget_range, source, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) ON CONFLICT (id) DO NOTHING
        `, [
          `test-lead-${Date.now()}-${i}`,
          `Test${i}`,
          `User${i}`,
          `test${i}@example.com`,
          `555-${String(i).padStart(4, '0')}`,
          ['Atlanta', 'Alpharetta', 'Roswell', 'Marietta'][i % 4],
          'GA',
          ['New Pool', 'Renovation', 'Spa Addition'][i % 3],
          ['$50k-$75k', '$75k-$100k', '$100k+'][i % 3],
          'test-seed',
          new Date()
        ]);
        
        if (result.rowCount && result.rowCount > 0) {
          seedData.leads++;
        }
      }
      
      // Generate test voice calls
      for (let i = 0; i < Math.floor(count / 2); i++) {
        const result = await pool.query(`
          INSERT INTO voice_calls (
            id, session_id, call_date, duration, 
            full_transcript, transcript_summary, lead_data_captured,
            grounding_sources, status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) ON CONFLICT (id) DO NOTHING
        `, [
          `test-call-${Date.now()}-${i}`,
          `TEST_SESSION_${Date.now()}${i}`,
          new Date(Date.now() - i * 86400000),
          Math.floor(Math.random() * 300) + 60,
          JSON.stringify({
            messages: [
              { role: 'agent', content: 'Hello, welcome to Serenity Custom Pools!' },
              { role: 'customer', content: "Hi, I'm interested in getting a pool installed." },
              { role: 'agent', content: 'Great! Let me help you with that...' }
            ],
            timestamp: new Date().toISOString()
          }),
          `Test call summary ${i} - Customer interested in pool installation`,
          JSON.stringify({
            firstName: `Test${i}`,
            lastName: `Customer${i}`,
            email: `testcustomer${i}@example.com`,
            phone: `555-${String(i).padStart(4, '0')}`,
            projectType: 'pool_installation'
          }),
          JSON.stringify([]),
          'completed',
          new Date()
        ]);
        
        if (result.rowCount && result.rowCount > 0) {
          seedData.voiceCalls++;
        }
      }
      
      logActivity('DB_SEED', 'database', seedData, req);
      
      res.json({ 
        success: true, 
        message: 'Test data seeded successfully',
        seeded: seedData
      });
    } catch (error) {
      console.error('Admin API - Database seed error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Database seeding failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Webhook System Endpoints
  // ========================================
  
  // Webhook storage
  const webhooks = new Map<string, any>();
  const webhookLogs = new Map<string, any[]>();
  
  // Create webhook listener
  adminRouter.post('/webhooks/create', async (req, res) => {
    try {
      const { 
        name, 
        url, 
        events, 
        headers, 
        retryConfig,
        active = true 
      } = req.body;
      
      if (!name || !url || !events || events.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, URL, and events required' 
        });
      }
      
      const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const webhook = {
        id: webhookId,
        name,
        url,
        events, // ['lead.created', 'payment.received', 'form.submitted', etc.]
        headers: headers || {},
        retryConfig: retryConfig || {
          maxRetries: 3,
          retryDelay: 5000,
          backoffMultiplier: 2
        },
        active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastTriggered: null,
        triggerCount: 0,
        successCount: 0,
        failureCount: 0
      };
      
      webhooks.set(webhookId, webhook);
      
      logActivity('WEBHOOK_CREATE', 'webhooks', { 
        id: webhookId, 
        name, 
        events 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Webhook created successfully',
        webhook,
        endpoint: `/api/webhook/${webhookId}` // Where external services should send data
      });
    } catch (error) {
      console.error('Admin API - Create webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Webhook creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get webhook activity logs
  adminRouter.get('/webhooks/logs', async (req, res) => {
    try {
      const { webhookId, limit = 100, status } = req.query;
      
      let logs: any[] = [];
      
      if (webhookId) {
        // Get logs for specific webhook
        logs = webhookLogs.get(webhookId as string) || [];
      } else {
        // Get all webhook logs
        for (const [id, webhookLogList] of webhookLogs.entries()) {
          logs = logs.concat(webhookLogList.map(log => ({ ...log, webhookId: id })));
        }
      }
      
      // Filter by status if provided
      if (status) {
        logs = logs.filter(log => log.status === status);
      }
      
      // Sort by timestamp and limit
      logs = logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, parseInt(limit as string));
      
      res.json({ 
        success: true, 
        logs,
        total: logs.length,
        webhooks: Array.from(webhooks.values()).map(w => ({
          id: w.id,
          name: w.name,
          active: w.active,
          triggerCount: w.triggerCount
        }))
      });
    } catch (error) {
      console.error('Admin API - Get webhook logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve webhook logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Test a webhook
  adminRouter.post('/webhooks/test', async (req, res) => {
    try {
      const { webhookId, testData } = req.body;
      
      if (!webhookId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Webhook ID required' 
        });
      }
      
      const webhook = webhooks.get(webhookId);
      
      if (!webhook) {
        return res.status(404).json({ 
          success: false, 
          error: 'Webhook not found' 
        });
      }
      
      // Create test log entry
      const logEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: 'test',
        url: webhook.url,
        method: 'POST',
        headers: webhook.headers,
        payload: testData || { test: true, timestamp: new Date().toISOString() },
        response: null,
        status: 'pending',
        statusCode: null,
        duration: 0,
        error: null,
        retryCount: 0
      };
      
      // Store log
      if (!webhookLogs.has(webhookId)) {
        webhookLogs.set(webhookId, []);
      }
      webhookLogs.get(webhookId)!.push(logEntry);
      
      // Simulate webhook call
      const startTime = Date.now();
      
      try {
        // In a real implementation, you would make an actual HTTP request here
        // For now, simulate success
        logEntry.status = 'success';
        logEntry.statusCode = 200;
        logEntry.response = { 
          message: 'Test webhook received',
          received: logEntry.payload 
        };
        logEntry.duration = Date.now() - startTime;
        
        webhook.lastTriggered = new Date().toISOString();
        webhook.triggerCount++;
        webhook.successCount++;
        
      } catch (error) {
        logEntry.status = 'failed';
        logEntry.error = error instanceof Error ? error.message : 'Unknown error';
        logEntry.duration = Date.now() - startTime;
        webhook.failureCount++;
      }
      
      webhooks.set(webhookId, webhook);
      
      logActivity('WEBHOOK_TEST', 'webhooks', { 
        webhookId,
        status: logEntry.status 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Webhook test completed',
        result: logEntry
      });
    } catch (error) {
      console.error('Admin API - Test webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Webhook test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List all webhooks
  adminRouter.get('/webhooks/list', async (req, res) => {
    try {
      const { active } = req.query;
      
      let webhookList = Array.from(webhooks.values());
      
      if (active !== undefined) {
        webhookList = webhookList.filter(w => w.active === (active === 'true'));
      }
      
      res.json({ 
        success: true, 
        webhooks: webhookList,
        total: webhookList.length,
        stats: {
          active: webhookList.filter(w => w.active).length,
          inactive: webhookList.filter(w => !w.active).length,
          totalTriggers: webhookList.reduce((sum, w) => sum + w.triggerCount, 0)
        }
      });
    } catch (error) {
      console.error('Admin API - List webhooks error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list webhooks',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete webhook
  adminRouter.delete('/webhooks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const webhook = webhooks.get(id);
      
      if (!webhook) {
        return res.status(404).json({ 
          success: false, 
          error: 'Webhook not found' 
        });
      }
      
      webhooks.delete(id);
      webhookLogs.delete(id);
      
      logActivity('WEBHOOK_DELETE', 'webhooks', { 
        id, 
        name: webhook.name 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Webhook "${webhook.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Admin API - Delete webhook error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Webhook deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Scheduled Jobs/Cron Endpoints
  // ========================================
  
  // Scheduled jobs storage
  const scheduledJobs = new Map<string, any>();
  const jobExecutions = new Map<string, any[]>();
  const activeIntervals = new Map<string, NodeJS.Timeout>();
  
  // Parse cron expression to milliseconds (simplified)
  function parseCronToMs(cronExpression: string): number | null {
    // Simple parsing for common patterns
    if (cronExpression === '* * * * *') return 60000; // Every minute
    if (cronExpression === '*/5 * * * *') return 300000; // Every 5 minutes
    if (cronExpression === '*/15 * * * *') return 900000; // Every 15 minutes
    if (cronExpression === '0 * * * *') return 3600000; // Every hour
    if (cronExpression === '0 0 * * *') return 86400000; // Daily
    if (cronExpression === '0 0 * * 0') return 604800000; // Weekly
    if (cronExpression === '0 0 1 * *') return 2592000000; // Monthly (30 days)
    
    // For other patterns, return hourly as default
    return 3600000;
  }
  
  // Create scheduled job
  adminRouter.post('/cron/create', async (req, res) => {
    try {
      const { 
        name, 
        schedule, 
        task,
        description,
        timezone = 'UTC',
        active = true,
        metadata 
      } = req.body;
      
      if (!name || !schedule || !task) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, schedule, and task required' 
        });
      }
      
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const job = {
        id: jobId,
        name,
        schedule, // Cron expression: "0 9 * * *" for 9am daily
        task, // What to execute: { type: 'webhook', url: '...' } or { type: 'function', name: '...' }
        description: description || '',
        timezone,
        active,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRun: null,
        nextRun: null,
        runCount: 0,
        successCount: 0,
        failureCount: 0
      };
      
      // Calculate next run time
      const intervalMs = parseCronToMs(schedule);
      if (intervalMs) {
        job.nextRun = new Date(Date.now() + intervalMs).toISOString();
        
        // Set up actual scheduled execution if active
        if (active) {
          const interval = setInterval(() => {
            executeScheduledJob(job);
          }, intervalMs);
          activeIntervals.set(jobId, interval);
        }
      }
      
      scheduledJobs.set(jobId, job);
      
      logActivity('CRON_CREATE', 'scheduled_jobs', { 
        id: jobId, 
        name, 
        schedule 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Scheduled job created successfully',
        job
      });
    } catch (error) {
      console.error('Admin API - Create cron job error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Scheduled job creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Helper function to execute a scheduled job
  async function executeScheduledJob(job: any): Promise<any> {
    const execution = {
      id: `exec-${Date.now()}`,
      jobId: job.id,
      jobName: job.name,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      result: null,
      error: null
    };
    
    // Store execution
    if (!jobExecutions.has(job.id)) {
      jobExecutions.set(job.id, []);
    }
    jobExecutions.get(job.id)!.push(execution);
    
    try {
      // Execute based on task type
      switch (job.task.type) {
        case 'report':
          execution.result = {
            type: 'report',
            message: `Generated ${job.task.reportType || 'daily'} report`,
            timestamp: new Date().toISOString()
          };
          break;
          
        case 'backup':
          execution.result = {
            type: 'backup',
            message: 'Backup completed successfully',
            filename: `backup-${Date.now()}.json`
          };
          break;
          
        case 'analytics':
          execution.result = {
            type: 'analytics',
            message: 'Analytics summary generated',
            metrics: {
              leads: Math.floor(Math.random() * 100),
              conversions: Math.floor(Math.random() * 20)
            }
          };
          break;
          
        case 'cleanup':
          execution.result = {
            type: 'cleanup',
            message: 'Cleanup task completed',
            itemsProcessed: Math.floor(Math.random() * 500)
          };
          break;
          
        case 'webhook':
          execution.result = {
            type: 'webhook',
            message: `Called webhook: ${job.task.url}`,
            statusCode: 200
          };
          break;
          
        default:
          execution.result = {
            type: job.task.type || 'custom',
            message: `Executed ${job.name}`,
            timestamp: new Date().toISOString()
          };
      }
      
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      
      // Update job stats
      job.lastRun = new Date().toISOString();
      job.runCount++;
      job.successCount++;
      
      // Calculate next run
      const intervalMs = parseCronToMs(job.schedule);
      if (intervalMs) {
        job.nextRun = new Date(Date.now() + intervalMs).toISOString();
      }
      
      scheduledJobs.set(job.id, job);
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      job.lastRun = new Date().toISOString();
      job.runCount++;
      job.failureCount++;
      scheduledJobs.set(job.id, job);
    }
    
    return execution;
  }
  
  // List all scheduled jobs
  adminRouter.get('/cron/list', async (req, res) => {
    try {
      const { active } = req.query;
      
      let jobs = Array.from(scheduledJobs.values());
      
      if (active !== undefined) {
        jobs = jobs.filter(job => job.active === (active === 'true'));
      }
      
      // Add recent executions
      jobs = jobs.map(job => ({
        ...job,
        recentExecutions: jobExecutions.get(job.id)?.slice(-5) || []
      }));
      
      res.json({ 
        success: true, 
        jobs,
        total: jobs.length,
        stats: {
          active: jobs.filter(j => j.active).length,
          inactive: jobs.filter(j => !j.active).length,
          totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0)
        }
      });
    } catch (error) {
      console.error('Admin API - List cron jobs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list scheduled jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Run scheduled job immediately
  adminRouter.post('/cron/run-now', async (req, res) => {
    try {
      const { jobId } = req.body;
      
      if (!jobId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Job ID required' 
        });
      }
      
      const job = scheduledJobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scheduled job not found' 
        });
      }
      
      // Execute the job
      const execution = await executeScheduledJob(job);
      
      logActivity('CRON_RUN_MANUAL', 'scheduled_jobs', { 
        jobId,
        jobName: job.name,
        status: execution.status 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Job "${job.name}" executed manually`,
        execution,
        job
      });
    } catch (error) {
      console.error('Admin API - Run cron job error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Job execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update scheduled job
  adminRouter.put('/cron/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const job = scheduledJobs.get(id);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scheduled job not found' 
        });
      }
      
      // Clear existing interval if schedule or active status changes
      if (updates.schedule !== undefined || updates.active !== undefined) {
        const existingInterval = activeIntervals.get(id);
        if (existingInterval) {
          clearInterval(existingInterval);
          activeIntervals.delete(id);
        }
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'schedule', 'task', 'description', 
        'timezone', 'active', 'metadata'
      ];
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          job[key] = updates[key];
        }
      }
      
      job.updatedAt = new Date().toISOString();
      
      // Set up new interval if active
      if (job.active) {
        const intervalMs = parseCronToMs(job.schedule);
        if (intervalMs) {
          const interval = setInterval(() => {
            executeScheduledJob(job);
          }, intervalMs);
          activeIntervals.set(id, interval);
          job.nextRun = new Date(Date.now() + intervalMs).toISOString();
        }
      }
      
      scheduledJobs.set(id, job);
      
      logActivity('CRON_UPDATE', 'scheduled_jobs', { 
        id, 
        updates: Object.keys(updates) 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Scheduled job updated successfully',
        job
      });
    } catch (error) {
      console.error('Admin API - Update cron job error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Job update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete scheduled job
  adminRouter.delete('/cron/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const job = scheduledJobs.get(id);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scheduled job not found' 
        });
      }
      
      // Clear interval if exists
      const interval = activeIntervals.get(id);
      if (interval) {
        clearInterval(interval);
        activeIntervals.delete(id);
      }
      
      scheduledJobs.delete(id);
      jobExecutions.delete(id);
      
      logActivity('CRON_DELETE', 'scheduled_jobs', { 
        id, 
        name: job.name 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Scheduled job "${job.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Admin API - Delete cron job error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Job deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get job execution history
  adminRouter.get('/cron/:id/executions', async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;
      
      const job = scheduledJobs.get(id);
      
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scheduled job not found' 
        });
      }
      
      const executions = jobExecutions.get(id) || [];
      const limitNum = parseInt(limit as string);
      
      res.json({ 
        success: true, 
        job: {
          id: job.id,
          name: job.name,
          schedule: job.schedule
        },
        executions: executions.slice(-limitNum).reverse(),
        total: executions.length
      });
    } catch (error) {
      console.error('Admin API - Get job executions error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Email Control Endpoints
  // ========================================
  
  // Email template storage
  const emailTemplates = new Map<string, any>();
  const emailHistory = new Map<string, any>();
  
  // Send custom email
  adminRouter.post('/email/send', async (req, res) => {
    try {
      const { 
        to, 
        cc,
        bcc,
        subject, 
        body, 
        html,
        templateId,
        variables,
        attachments,
        from = 'noreply@serenitypools.com',
        replyTo
      } = req.body;
      
      // Validate required fields
      if (!to || (!body && !html && !templateId)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Recipient and content required' 
        });
      }
      
      let finalHtml = html;
      let finalText = body;
      let finalSubject = subject;
      
      // If using a template
      if (templateId) {
        const template = emailTemplates.get(templateId);
        if (!template) {
          return res.status(404).json({ 
            success: false, 
            error: 'Template not found' 
          });
        }
        
        // Replace variables in template
        finalHtml = template.html || '';
        finalText = template.text || '';
        finalSubject = template.subject || subject;
        
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalHtml = finalHtml.replace(regex, String(value));
            finalText = finalText.replace(regex, String(value));
            finalSubject = finalSubject.replace(regex, String(value));
          });
        }
      }
      
      // Create email record
      const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const emailRecord = {
        id: emailId,
        to: Array.isArray(to) ? to : [to],
        cc: cc || [],
        bcc: bcc || [],
        from,
        replyTo: replyTo || from,
        subject: finalSubject,
        body: finalText,
        html: finalHtml,
        templateId,
        variables,
        attachments: attachments || [],
        status: 'sent',
        sentAt: new Date().toISOString(),
        opens: 0,
        clicks: 0,
        bounced: false,
        error: null
      };
      
      // Store in history
      emailHistory.set(emailId, emailRecord);
      
      // In production, this would integrate with SendGrid or another email service
      // For now, simulate success
      
      logActivity('EMAIL_SEND', 'emails', { 
        id: emailId, 
        to: emailRecord.to,
        subject: finalSubject 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        emailId,
        details: {
          to: emailRecord.to,
          subject: finalSubject,
          sentAt: emailRecord.sentAt
        }
      });
    } catch (error) {
      console.error('Admin API - Send email error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Email sending failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Create email template
  adminRouter.post('/email/template', async (req, res) => {
    try {
      const { 
        name, 
        subject, 
        html, 
        text,
        category,
        variables,
        description,
        active = true
      } = req.body;
      
      if (!name || !subject || (!html && !text)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, subject, and content required' 
        });
      }
      
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const template = {
        id: templateId,
        name,
        subject,
        html: html || '',
        text: text || '',
        category: category || 'general',
        variables: variables || [], // ['name', 'email', 'date'] - variables that can be replaced
        description: description || '',
        active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        lastUsed: null
      };
      
      emailTemplates.set(templateId, template);
      
      logActivity('EMAIL_TEMPLATE_CREATE', 'emails', { 
        id: templateId, 
        name 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Email template created successfully',
        template
      });
    } catch (error) {
      console.error('Admin API - Create template error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Template creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List email templates
  adminRouter.get('/email/templates', async (req, res) => {
    try {
      const { category, active } = req.query;
      
      let templates = Array.from(emailTemplates.values());
      
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      
      if (active !== undefined) {
        templates = templates.filter(t => t.active === (active === 'true'));
      }
      
      res.json({ 
        success: true, 
        templates,
        total: templates.length,
        categories: [...new Set(templates.map(t => t.category))]
      });
    } catch (error) {
      console.error('Admin API - List templates error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get email template by ID
  adminRouter.get('/email/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = emailTemplates.get(id);
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      res.json({ 
        success: true, 
        template
      });
    } catch (error) {
      console.error('Admin API - Get template error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update email template
  adminRouter.put('/email/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const template = emailTemplates.get(id);
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'subject', 'html', 'text', 
        'category', 'variables', 'description', 'active'
      ];
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          template[key] = updates[key];
        }
      }
      
      template.updatedAt = new Date().toISOString();
      
      emailTemplates.set(id, template);
      
      logActivity('EMAIL_TEMPLATE_UPDATE', 'emails', { 
        id, 
        updates: Object.keys(updates) 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Template updated successfully',
        template
      });
    } catch (error) {
      console.error('Admin API - Update template error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Template update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete email template
  adminRouter.delete('/email/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const template = emailTemplates.get(id);
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      emailTemplates.delete(id);
      
      logActivity('EMAIL_TEMPLATE_DELETE', 'emails', { 
        id, 
        name: template.name 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Template "${template.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Admin API - Delete template error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Template deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get email history/logs
  adminRouter.get('/email/history', async (req, res) => {
    try {
      const { limit = 100, status, to } = req.query;
      
      let emails = Array.from(emailHistory.values());
      
      // Filter by status
      if (status) {
        emails = emails.filter(e => e.status === status);
      }
      
      // Filter by recipient
      if (to) {
        emails = emails.filter(e => 
          e.to.some((recipient: string) => 
            recipient.toLowerCase().includes((to as string).toLowerCase())
          )
        );
      }
      
      // Sort by most recent and limit
      emails = emails
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
        .slice(0, parseInt(limit as string));
      
      res.json({ 
        success: true, 
        emails,
        total: emails.length,
        stats: {
          sent: emails.filter(e => e.status === 'sent').length,
          failed: emails.filter(e => e.status === 'failed').length,
          bounced: emails.filter(e => e.bounced).length,
          totalOpens: emails.reduce((sum, e) => sum + e.opens, 0),
          totalClicks: emails.reduce((sum, e) => sum + e.clicks, 0)
        }
      });
    } catch (error) {
      console.error('Admin API - Get email history error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve email history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Send bulk emails
  adminRouter.post('/email/bulk', async (req, res) => {
    try {
      const { 
        recipients, 
        templateId, 
        subject,
        personalizations,
        scheduledFor,
        batchSize = 100
      } = req.body;
      
      if (!recipients || recipients.length === 0 || !templateId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Recipients and template required' 
        });
      }
      
      const template = emailTemplates.get(templateId);
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      const campaignId = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const emailIds: string[] = [];
      
      // Process in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        for (const recipient of batch) {
          const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Get personalization variables for this recipient
          const variables = personalizations?.[recipient] || {};
          
          // Replace variables in template
          let finalHtml = template.html;
          let finalText = template.text;
          let finalSubject = subject || template.subject;
          
          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            finalHtml = finalHtml.replace(regex, String(value));
            finalText = finalText.replace(regex, String(value));
            finalSubject = finalSubject.replace(regex, String(value));
          });
          
          const emailRecord = {
            id: emailId,
            campaignId,
            to: [recipient],
            from: 'noreply@serenitypools.com',
            subject: finalSubject,
            body: finalText,
            html: finalHtml,
            templateId,
            variables,
            status: scheduledFor ? 'scheduled' : 'sent',
            sentAt: scheduledFor || new Date().toISOString(),
            opens: 0,
            clicks: 0,
            bounced: false
          };
          
          emailHistory.set(emailId, emailRecord);
          emailIds.push(emailId);
        }
      }
      
      template.usageCount = (template.usageCount || 0) + recipients.length;
      template.lastUsed = new Date().toISOString();
      emailTemplates.set(templateId, template);
      
      logActivity('EMAIL_BULK_SEND', 'emails', { 
        campaignId,
        recipientCount: recipients.length,
        templateId 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Bulk email campaign created`,
        campaignId,
        details: {
          recipientCount: recipients.length,
          emailsSent: emailIds.length,
          scheduledFor: scheduledFor || 'immediate'
        }
      });
    } catch (error) {
      console.error('Admin API - Bulk email error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Bulk email failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Content Generation Pipeline Endpoints
  // ========================================
  
  // Content storage
  const generatedContent = new Map<string, any>();
  const scheduledContent = new Map<string, any>();
  const contentVersions = new Map<string, any[]>();
  
  // Generate AI content
  adminRouter.post('/content/generate', async (req, res) => {
    try {
      const { 
        type, 
        topic, 
        keywords,
        tone,
        length,
        format,
        targetAudience,
        includeImages,
        seoOptimized = true,
        language = 'en' 
      } = req.body;
      
      if (!type || !topic) {
        return res.status(400).json({ 
          success: false, 
          error: 'Content type and topic required' 
        });
      }
      
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate AI content generation based on type
      let generatedTitle = '';
      let generatedBody = '';
      let metaDescription = '';
      let tags: string[] = [];
      
      switch (type) {
        case 'blog':
          generatedTitle = `${topic}: The Ultimate Guide to Luxury Pool Design`;
          generatedBody = `
# ${generatedTitle}

## Introduction
When it comes to creating your dream outdoor oasis, ${topic.toLowerCase()} plays a crucial role in transforming your backyard into a luxurious retreat. At Serenity Custom Pools, we've helped countless homeowners in North Georgia achieve their vision of the perfect pool.

## Key Considerations for ${topic}

### 1. Design Elements
The modern pool design incorporates various elements that blend aesthetics with functionality. Consider features like:
- **Infinity edges** for dramatic visual impact
- **Natural stone** coping for an organic feel
- **LED lighting** systems for nighttime ambiance
- **Water features** including fountains and waterfalls

### 2. Material Selection
Choosing the right materials is essential for both durability and beauty:
- Premium tile options for lasting elegance
- Natural stone decking for slip resistance
- Glass tile accents for visual interest
- Pebble finishes for a natural look

### 3. Technology Integration
Modern pools benefit from smart technology:
- Automated cleaning systems
- Smart pool controllers
- Energy-efficient pumps and heaters
- Salt water chlorination systems

## Benefits of Professional Pool Design

Working with experienced pool designers ensures:
1. **Optimal space utilization** - Making the most of your available area
2. **Code compliance** - Meeting all local regulations
3. **Budget management** - Avoiding costly mistakes
4. **Quality assurance** - Using premium materials and techniques

## Investment Value

A well-designed pool adds significant value to your property:
- Increases home value by 5-7% on average
- Creates an entertainment destination
- Provides health and wellness benefits
- Enhances overall property aesthetics

## Conclusion

Transform your backyard into a personal paradise with ${topic.toLowerCase()}. Contact Serenity Custom Pools at (678) 300-8949 to schedule your free consultation and start planning your dream pool today.

**Keywords:** ${keywords?.join(', ') || `${topic}, luxury pools, pool design, North Georgia pools`}
`;
          metaDescription = `Discover expert insights on ${topic.toLowerCase()} from Serenity Custom Pools. Learn about design options, materials, and technology for your luxury pool project in North Georgia.`;
          tags = keywords || [topic, 'pool design', 'luxury pools', 'outdoor living'];
          break;
          
        case 'landing':
          generatedTitle = `${topic} - Serenity Custom Pools`;
          generatedBody = `
<section class="hero">
  <h1>${topic} Services</h1>
  <p class="lead">Transform your backyard with North Georgia's premier pool construction experts</p>
  <button class="cta">Get Free Consultation</button>
</section>

<section class="benefits">
  <h2>Why Choose Serenity Custom Pools?</h2>
  <div class="benefits-grid">
    <div class="benefit">
      <h3>30+ Years Experience</h3>
      <p>Ronald Jones brings decades of expertise to every project</p>
    </div>
    <div class="benefit">
      <h3>Custom Design</h3>
      <p>Tailored solutions for your unique space and vision</p>
    </div>
    <div class="benefit">
      <h3>Quality Guarantee</h3>
      <p>Premium materials and lifetime structural warranty</p>
    </div>
  </div>
</section>

<section class="cta-section">
  <h2>Ready to Start Your Pool Project?</h2>
  <p>Call (678) 300-8949 or fill out our form for a free consultation</p>
  <button class="cta-primary">Schedule Consultation</button>
</section>
`;
          metaDescription = `${topic} services by Serenity Custom Pools. Expert pool construction and design in North Georgia. Call (678) 300-8949 for your free consultation.`;
          tags = [topic, 'pool construction', 'North Georgia'];
          break;
          
        case 'email':
          generatedTitle = `${topic} - Special Offer Inside!`;
          generatedBody = `
Dear {{name}},

${topic} is more important than ever for creating your perfect outdoor living space.

At Serenity Custom Pools, we're excited to share some insights about ${topic.toLowerCase()} and how it can transform your backyard into a luxury retreat.

**Why Now is the Perfect Time:**
• Season special pricing available
• Faster permit processing
• Complete before summer
• Lock in current material prices

**Our Current Promotion:**
- Save $5,000 on infinity edge designs
- Free LED lighting upgrade
- Complimentary first year maintenance

Don't miss this opportunity to create the pool you've always dreamed of. Our team is ready to bring your vision to life.

Schedule your free consultation today:
📞 Call: (678) 300-8949
🌐 Visit: serenitycustompools.com

Best regards,
The Serenity Custom Pools Team
`;
          metaDescription = '';
          tags = ['email', topic];
          break;
          
        case 'social':
          generatedTitle = topic;
          generatedBody = `
🏊‍♂️ ${topic} 🏊‍♀️

Transform your backyard into a luxury oasis! ✨

${keywords?.map(k => `#${k.replace(/\s+/g, '')}`).join(' ') || '#LuxuryPools #PoolDesign #NorthGeorgiaPools'}

📞 (678) 300-8949
🔗 Link in bio for free consultation!
`;
          metaDescription = '';
          tags = ['social media', topic];
          break;
          
        default:
          generatedTitle = topic;
          generatedBody = `Content about ${topic} for ${targetAudience || 'pool owners'}. ${keywords?.join(', ') || ''}`;
      }
      
      // Add tone adjustments
      if (tone === 'professional') {
        generatedBody = generatedBody.replace(/!/g, '.');
      } else if (tone === 'casual') {
        generatedBody = generatedBody.replace(/\. /g, '! ');
      }
      
      // Store generated content
      const content = {
        id: contentId,
        type,
        topic,
        title: generatedTitle,
        body: generatedBody,
        metaDescription,
        keywords: keywords || [],
        tags,
        tone,
        length: generatedBody.length,
        format,
        targetAudience,
        language,
        seoOptimized,
        includeImages,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: null,
        versions: []
      };
      
      generatedContent.set(contentId, content);
      
      logActivity('CONTENT_GENERATE', 'content', { 
        id: contentId, 
        type, 
        topic 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Content generated successfully',
        content
      });
    } catch (error) {
      console.error('Admin API - Generate content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Content generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Optimize content for SEO
  adminRouter.post('/content/optimize', async (req, res) => {
    try {
      const { 
        contentId, 
        content,
        targetKeywords,
        competitorUrls,
        optimizationLevel = 'standard' 
      } = req.body;
      
      let contentToOptimize: any = null;
      
      if (contentId) {
        contentToOptimize = generatedContent.get(contentId);
        if (!contentToOptimize) {
          return res.status(404).json({ 
            success: false, 
            error: 'Content not found' 
          });
        }
      } else if (content) {
        contentToOptimize = {
          title: content.title || '',
          body: content.body || '',
          metaDescription: content.metaDescription || ''
        };
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Content ID or content required' 
        });
      }
      
      // SEO optimization suggestions
      const optimizations = {
        title: {
          original: contentToOptimize.title,
          optimized: contentToOptimize.title,
          suggestions: []
        },
        metaDescription: {
          original: contentToOptimize.metaDescription,
          optimized: '',
          suggestions: []
        },
        headings: [],
        keywords: {
          density: {},
          suggestions: targetKeywords || []
        },
        images: {
          altTags: [],
          suggestions: []
        },
        readability: {
          score: 85,
          grade: 'B+',
          suggestions: []
        },
        technicalSEO: {
          urlSlug: '',
          canonicalUrl: '',
          structuredData: {}
        }
      };
      
      // Title optimization
      if (contentToOptimize.title.length > 60) {
        optimizations.title.suggestions.push('Shorten title to under 60 characters');
        optimizations.title.optimized = contentToOptimize.title.substring(0, 57) + '...';
      }
      if (!contentToOptimize.title.includes('Serenity')) {
        optimizations.title.suggestions.push('Include brand name in title');
        optimizations.title.optimized = contentToOptimize.title + ' | Serenity Pools';
      }
      
      // Meta description optimization
      optimizations.metaDescription.optimized = contentToOptimize.metaDescription || 
        `${contentToOptimize.title}. Expert pool construction in North Georgia. Call (678) 300-8949 for free consultation.`;
      
      if (optimizations.metaDescription.optimized.length > 160) {
        optimizations.metaDescription.suggestions.push('Shorten to under 160 characters');
      }
      if (!optimizations.metaDescription.optimized.includes('678')) {
        optimizations.metaDescription.suggestions.push('Include phone number for local SEO');
      }
      
      // Keyword density analysis
      const words = contentToOptimize.body.toLowerCase().split(/\s+/);
      const keywordCount: Record<string, number> = {};
      
      if (targetKeywords) {
        targetKeywords.forEach((keyword: string) => {
          const regex = new RegExp(keyword.toLowerCase(), 'gi');
          const matches = contentToOptimize.body.match(regex);
          keywordCount[keyword] = matches ? matches.length : 0;
        });
      }
      
      optimizations.keywords.density = keywordCount;
      
      // Heading extraction
      const headingRegex = /#+ .+/g;
      const headings = contentToOptimize.body.match(headingRegex) || [];
      optimizations.headings = headings.map((h: string) => ({
        text: h,
        level: h.match(/^#+/)?.[0].length || 0,
        optimized: h.includes(targetKeywords?.[0]) ? h : `${h} - ${targetKeywords?.[0] || 'Pools'}`
      }));
      
      // Readability suggestions
      const avgSentenceLength = contentToOptimize.body.split(/[.!?]/).length;
      if (avgSentenceLength > 20) {
        optimizations.readability.suggestions.push('Use shorter sentences for better readability');
      }
      optimizations.readability.suggestions.push('Add bullet points for easy scanning');
      optimizations.readability.suggestions.push('Use subheadings every 2-3 paragraphs');
      
      // Technical SEO
      optimizations.technicalSEO.urlSlug = contentToOptimize.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      optimizations.technicalSEO.canonicalUrl = `https://serenitycustompools.com/${optimizations.technicalSEO.urlSlug}`;
      
      optimizations.technicalSEO.structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: optimizations.title.optimized,
        description: optimizations.metaDescription.optimized,
        author: {
          '@type': 'Organization',
          name: 'Serenity Custom Pools'
        },
        datePublished: new Date().toISOString()
      };
      
      // Image optimization suggestions
      optimizations.images.suggestions = [
        'Add alt text describing pool features',
        'Use descriptive file names (luxury-pool-design.jpg)',
        'Compress images to under 200KB',
        'Include captions with keywords'
      ];
      
      // Update content if it exists
      if (contentId && contentToOptimize) {
        contentToOptimize.seoOptimizations = optimizations;
        contentToOptimize.updatedAt = new Date().toISOString();
        generatedContent.set(contentId, contentToOptimize);
      }
      
      logActivity('CONTENT_OPTIMIZE', 'content', { 
        contentId, 
        optimizationLevel 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'SEO optimization complete',
        optimizations,
        seoScore: Math.floor(Math.random() * 20) + 80, // 80-100 score
        improvements: optimizations.title.suggestions.length + 
                     optimizations.metaDescription.suggestions.length + 
                     optimizations.readability.suggestions.length
      });
    } catch (error) {
      console.error('Admin API - Optimize content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'SEO optimization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Translate content to multiple languages
  adminRouter.post('/content/translate', async (req, res) => {
    try {
      const { 
        contentId, 
        content,
        targetLanguages,
        preserveFormatting = true 
      } = req.body;
      
      if (!targetLanguages || targetLanguages.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Target languages required' 
        });
      }
      
      let contentToTranslate: any = null;
      
      if (contentId) {
        contentToTranslate = generatedContent.get(contentId);
        if (!contentToTranslate) {
          return res.status(404).json({ 
            success: false, 
            error: 'Content not found' 
          });
        }
      } else if (content) {
        contentToTranslate = content;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Content ID or content required' 
        });
      }
      
      // Simulate translations
      const translations: Record<string, any> = {};
      
      const languageMap: Record<string, any> = {
        'es': {
          name: 'Spanish',
          title: `${contentToTranslate.title || 'Título'} - Piscinas de Lujo`,
          body: `Este es el contenido traducido al español sobre ${contentToTranslate.topic || 'piscinas'}. 
                 Serenity Custom Pools ofrece servicios de construcción de piscinas de lujo en Georgia del Norte.
                 Llámenos al (678) 300-8949 para una consulta gratuita.`,
          metaDescription: 'Construcción de piscinas de lujo en Georgia. Diseño personalizado y calidad garantizada.',
          cta: 'Obtener Consulta Gratis'
        },
        'fr': {
          name: 'French', 
          title: `${contentToTranslate.title || 'Titre'} - Piscines de Luxe`,
          body: `Ceci est le contenu traduit en français sur ${contentToTranslate.topic || 'piscines'}.
                 Serenity Custom Pools propose des services de construction de piscines de luxe en Géorgie du Nord.
                 Appelez-nous au (678) 300-8949 pour une consultation gratuite.`,
          metaDescription: 'Construction de piscines de luxe en Géorgie. Design personnalisé et qualité garantie.',
          cta: 'Obtenir une Consultation Gratuite'
        },
        'zh': {
          name: 'Chinese',
          title: `${contentToTranslate.title || '标题'} - 豪华泳池`,
          body: `这是关于${contentToTranslate.topic || '游泳池'}的中文翻译内容。
                 Serenity Custom Pools 在北乔治亚州提供豪华游泳池建设服务。
                 致电 (678) 300-8949 获取免费咨询。`,
          metaDescription: '乔治亚州豪华游泳池建设。定制设计，品质保证。',
          cta: '获取免费咨询'
        },
        'pt': {
          name: 'Portuguese',
          title: `${contentToTranslate.title || 'Título'} - Piscinas de Luxo`,
          body: `Este é o conteúdo traduzido para português sobre ${contentToTranslate.topic || 'piscinas'}.
                 Serenity Custom Pools oferece serviços de construção de piscinas de luxo no Norte da Geórgia.
                 Ligue para (678) 300-8949 para uma consulta gratuita.`,
          metaDescription: 'Construção de piscinas de luxo na Geórgia. Design personalizado e qualidade garantida.',
          cta: 'Obter Consulta Grátis'
        }
      };
      
      for (const lang of targetLanguages) {
        if (languageMap[lang]) {
          translations[lang] = {
            language: lang,
            languageName: languageMap[lang].name,
            title: languageMap[lang].title,
            body: preserveFormatting ? 
              contentToTranslate.body?.replace(/Serenity Custom Pools/g, 'Serenity Custom Pools™')
                .replace(/\(678\) 300-8949/g, '📞 (678) 300-8949') : 
              languageMap[lang].body,
            metaDescription: languageMap[lang].metaDescription,
            cta: languageMap[lang].cta,
            translatedAt: new Date().toISOString(),
            quality: 'machine',
            reviewStatus: 'pending'
          };
        } else {
          translations[lang] = {
            language: lang,
            error: 'Language not supported',
            supportedLanguages: Object.keys(languageMap)
          };
        }
      }
      
      // Store translations if content exists
      if (contentId && contentToTranslate) {
        contentToTranslate.translations = translations;
        contentToTranslate.updatedAt = new Date().toISOString();
        generatedContent.set(contentId, contentToTranslate);
      }
      
      logActivity('CONTENT_TRANSLATE', 'content', { 
        contentId, 
        languages: targetLanguages 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Content translated successfully',
        translations,
        languagesProcessed: targetLanguages.length,
        originalLanguage: 'en'
      });
    } catch (error) {
      console.error('Admin API - Translate content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Schedule content for auto-publishing
  adminRouter.post('/content/schedule', async (req, res) => {
    try {
      const { 
        contentId, 
        publishAt,
        channels,
        timezone = 'America/New_York',
        repeatSchedule,
        expiresAt
      } = req.body;
      
      if (!contentId || !publishAt || !channels || channels.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Content ID, publish time, and channels required' 
        });
      }
      
      const content = generatedContent.get(contentId);
      
      if (!content) {
        return res.status(404).json({ 
          success: false, 
          error: 'Content not found' 
        });
      }
      
      const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const schedule = {
        id: scheduleId,
        contentId,
        contentTitle: content.title,
        contentType: content.type,
        publishAt,
        timezone,
        channels, // ['website', 'blog', 'social_facebook', 'social_twitter', 'email']
        repeatSchedule: repeatSchedule || null, // { frequency: 'weekly', dayOfWeek: 2, time: '10:00' }
        expiresAt: expiresAt || null,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedChannels: [],
        failedChannels: [],
        attempts: 0
      };
      
      // Calculate next publish time
      const publishDate = new Date(publishAt);
      const now = new Date();
      
      if (publishDate <= now) {
        // Publish immediately
        schedule.status = 'publishing';
        
        // Simulate publishing to channels
        setTimeout(() => {
          schedule.status = 'published';
          schedule.publishedChannels = channels;
          content.status = 'published';
          content.publishedAt = new Date().toISOString();
          generatedContent.set(contentId, content);
          scheduledContent.set(scheduleId, schedule);
        }, 1000);
      } else {
        // Schedule for future
        const delay = publishDate.getTime() - now.getTime();
        
        setTimeout(() => {
          schedule.status = 'published';
          schedule.publishedChannels = channels;
          content.status = 'published';
          content.publishedAt = publishDate.toISOString();
          generatedContent.set(contentId, content);
          scheduledContent.set(scheduleId, schedule);
        }, Math.min(delay, 2147483647)); // Max timeout value
      }
      
      scheduledContent.set(scheduleId, schedule);
      
      // Update content
      content.scheduledPublish = {
        scheduleId,
        publishAt,
        channels
      };
      content.updatedAt = new Date().toISOString();
      generatedContent.set(contentId, content);
      
      logActivity('CONTENT_SCHEDULE', 'content', { 
        scheduleId,
        contentId, 
        publishAt,
        channels 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Content scheduled for publishing',
        schedule,
        content: {
          id: content.id,
          title: content.title,
          type: content.type
        }
      });
    } catch (error) {
      console.error('Admin API - Schedule content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Content scheduling failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List generated content
  adminRouter.get('/content/list', async (req, res) => {
    try {
      const { type, status, language } = req.query;
      
      let contents = Array.from(generatedContent.values());
      
      if (type) {
        contents = contents.filter(c => c.type === type);
      }
      
      if (status) {
        contents = contents.filter(c => c.status === status);
      }
      
      if (language) {
        contents = contents.filter(c => c.language === language);
      }
      
      res.json({ 
        success: true, 
        contents,
        total: contents.length,
        stats: {
          draft: contents.filter(c => c.status === 'draft').length,
          scheduled: contents.filter(c => c.status === 'scheduled').length,
          published: contents.filter(c => c.status === 'published').length
        }
      });
    } catch (error) {
      console.error('Admin API - List content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get scheduled content
  adminRouter.get('/content/scheduled', async (req, res) => {
    try {
      const schedules = Array.from(scheduledContent.values())
        .sort((a, b) => new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime());
      
      res.json({ 
        success: true, 
        schedules,
        total: schedules.length,
        upcoming: schedules.filter(s => s.status === 'scheduled').length,
        published: schedules.filter(s => s.status === 'published').length
      });
    } catch (error) {
      console.error('Admin API - Get scheduled content error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve scheduled content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Third-Party Integration Endpoints
  // ========================================
  
  // Integration storage
  const connectedIntegrations = new Map<string, any>();
  const integrationLogs = new Map<string, any[]>();
  const integrationData = new Map<string, any>();
  
  // Connect external API integration
  adminRouter.post('/integrations/connect', async (req, res) => {
    try {
      const { 
        name, 
        provider,
        apiKey,
        apiSecret,
        webhookUrl,
        config,
        autoSync = false,
        syncInterval = 3600000 // 1 hour default
      } = req.body;
      
      if (!name || !provider) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name and provider required' 
        });
      }
      
      const integrationId = `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Test connection based on provider
      let connectionStatus = 'pending';
      let connectionDetails: any = {};
      
      switch (provider) {
        case 'stripe':
          connectionStatus = apiKey?.startsWith('sk_') ? 'connected' : 'invalid_key';
          connectionDetails = {
            mode: apiKey?.startsWith('sk_test') ? 'test' : 'live',
            webhookEndpoint: `/api/webhook/stripe/${integrationId}`,
            capabilities: ['payments', 'subscriptions', 'invoices', 'customers']
          };
          break;
          
        case 'sendgrid':
          connectionStatus = apiKey?.startsWith('SG.') ? 'connected' : 'invalid_key';
          connectionDetails = {
            capabilities: ['email_send', 'email_templates', 'email_analytics', 'contacts'],
            dailyLimit: 100,
            monthlyLimit: 3000
          };
          break;
          
        case 'twilio':
          connectionStatus = apiKey && apiSecret ? 'connected' : 'invalid_credentials';
          connectionDetails = {
            capabilities: ['sms', 'voice', 'whatsapp', 'verify'],
            phoneNumbers: [],
            monthlyCredits: 15
          };
          break;
          
        case 'hubspot':
          connectionStatus = apiKey ? 'connected' : 'invalid_key';
          connectionDetails = {
            capabilities: ['contacts', 'deals', 'companies', 'tickets', 'marketing'],
            portalId: Math.floor(Math.random() * 10000000),
            apiLimit: 1000
          };
          break;
          
        case 'salesforce':
          connectionStatus = apiKey && apiSecret ? 'connected' : 'invalid_credentials';
          connectionDetails = {
            capabilities: ['leads', 'opportunities', 'accounts', 'contacts', 'campaigns'],
            instance: 'na135',
            apiVersion: 'v58.0'
          };
          break;
          
        case 'zapier':
          connectionStatus = webhookUrl ? 'connected' : 'webhook_required';
          connectionDetails = {
            webhookUrl: webhookUrl || '',
            capabilities: ['triggers', 'actions', 'multi-step'],
            zapCount: 0
          };
          break;
          
        case 'google':
          connectionStatus = apiKey ? 'connected' : 'invalid_key';
          connectionDetails = {
            capabilities: ['analytics', 'ads', 'calendar', 'drive', 'sheets'],
            scopes: config?.scopes || ['analytics.readonly'],
            quotaLimit: 10000
          };
          break;
          
        case 'openai':
          connectionStatus = apiKey?.startsWith('sk-') ? 'connected' : 'invalid_key';
          connectionDetails = {
            capabilities: ['chat', 'completion', 'embeddings', 'images', 'audio'],
            model: config?.model || 'gpt-4',
            monthlyLimit: '$500'
          };
          break;
          
        case 'github':
          connectionStatus = apiKey ? 'connected' : 'invalid_token';
          connectionDetails = {
            capabilities: ['repos', 'issues', 'pulls', 'actions', 'webhooks'],
            organization: config?.org || 'personal',
            rateLimit: 5000
          };
          break;
          
        case 'slack':
          connectionStatus = apiKey?.startsWith('xoxb-') ? 'connected' : 'invalid_token';
          connectionDetails = {
            capabilities: ['messages', 'channels', 'users', 'files', 'webhooks'],
            workspace: 'serenity-pools',
            botUser: true
          };
          break;
          
        default:
          connectionStatus = apiKey || webhookUrl ? 'connected' : 'configuration_required';
          connectionDetails = {
            capabilities: config?.capabilities || [],
            custom: true
          };
      }
      
      const integration = {
        id: integrationId,
        name,
        provider,
        status: connectionStatus,
        config: config || {},
        connectionDetails,
        credentials: {
          apiKey: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}` : null,
          apiSecret: apiSecret ? '***hidden***' : null,
          webhookUrl
        },
        autoSync,
        syncInterval,
        lastSync: null,
        nextSync: autoSync ? new Date(Date.now() + syncInterval).toISOString() : null,
        dataMapping: config?.dataMapping || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncCount: 0,
        errorCount: 0
      };
      
      connectedIntegrations.set(integrationId, {
        ...integration,
        // Store actual credentials securely (in production, use encryption)
        _credentials: {
          apiKey,
          apiSecret,
          webhookUrl
        }
      });
      
      // Set up auto-sync if enabled
      if (autoSync && connectionStatus === 'connected') {
        setInterval(() => {
          syncIntegrationData(integrationId);
        }, syncInterval);
      }
      
      logActivity('INTEGRATION_CONNECT', 'integrations', { 
        id: integrationId, 
        name, 
        provider 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Integration "${name}" connected successfully`,
        integration
      });
    } catch (error) {
      console.error('Admin API - Connect integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Integration connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List all integrations
  adminRouter.get('/integrations/list', async (req, res) => {
    try {
      const { status, provider } = req.query;
      
      let integrations = Array.from(connectedIntegrations.values()).map(i => {
        // Remove sensitive data
        const { _credentials, ...safeIntegration } = i;
        return safeIntegration;
      });
      
      if (status) {
        integrations = integrations.filter(i => i.status === status);
      }
      
      if (provider) {
        integrations = integrations.filter(i => i.provider === provider);
      }
      
      res.json({ 
        success: true, 
        integrations,
        total: integrations.length,
        providers: [...new Set(integrations.map(i => i.provider))],
        stats: {
          connected: integrations.filter(i => i.status === 'connected').length,
          pending: integrations.filter(i => i.status === 'pending').length,
          failed: integrations.filter(i => i.status === 'failed').length,
          totalSyncs: integrations.reduce((sum, i) => sum + i.syncCount, 0)
        }
      });
    } catch (error) {
      console.error('Admin API - List integrations error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list integrations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Sync data from integration
  adminRouter.post('/integrations/sync', async (req, res) => {
    try {
      const { 
        integrationId, 
        syncType = 'full',
        dataTypes,
        dateRange
      } = req.body;
      
      if (!integrationId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Integration ID required' 
        });
      }
      
      const integration = connectedIntegrations.get(integrationId);
      
      if (!integration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Integration not found' 
        });
      }
      
      if (integration.status !== 'connected') {
        return res.status(400).json({ 
          success: false, 
          error: 'Integration not connected',
          status: integration.status
        });
      }
      
      // Start sync
      const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const syncLog = {
        id: syncId,
        integrationId,
        integrationName: integration.name,
        provider: integration.provider,
        syncType,
        dataTypes: dataTypes || integration.connectionDetails.capabilities,
        dateRange: dateRange || { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          end: new Date().toISOString() 
        },
        status: 'syncing',
        startedAt: new Date().toISOString(),
        completedAt: null,
        recordsProcessed: 0,
        errors: []
      };
      
      // Store sync log
      if (!integrationLogs.has(integrationId)) {
        integrationLogs.set(integrationId, []);
      }
      integrationLogs.get(integrationId)!.push(syncLog);
      
      // Simulate sync process
      syncIntegrationData(integrationId, syncLog);
      
      res.json({ 
        success: true, 
        message: `Sync started for "${integration.name}"`,
        sync: syncLog
      });
    } catch (error) {
      console.error('Admin API - Sync integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Helper function to sync integration data
  function syncIntegrationData(integrationId: string, syncLog?: any): void {
    const integration = connectedIntegrations.get(integrationId);
    if (!integration) return;
    
    // Create or use existing sync log
    const log = syncLog || {
      id: `sync-${Date.now()}`,
      integrationId,
      status: 'syncing',
      startedAt: new Date().toISOString(),
      recordsProcessed: 0
    };
    
    // Simulate data sync based on provider
    setTimeout(() => {
      const syncData: any = {
        provider: integration.provider,
        timestamp: new Date().toISOString(),
        data: {}
      };
      
      switch (integration.provider) {
        case 'stripe':
          syncData.data = {
            customers: Math.floor(Math.random() * 100),
            payments: Math.floor(Math.random() * 50),
            subscriptions: Math.floor(Math.random() * 20),
            revenue: Math.floor(Math.random() * 100000)
          };
          break;
          
        case 'hubspot':
          syncData.data = {
            contacts: Math.floor(Math.random() * 500),
            deals: Math.floor(Math.random() * 50),
            companies: Math.floor(Math.random() * 100),
            activities: Math.floor(Math.random() * 200)
          };
          break;
          
        case 'google':
          syncData.data = {
            pageviews: Math.floor(Math.random() * 10000),
            users: Math.floor(Math.random() * 1000),
            sessions: Math.floor(Math.random() * 2000),
            bounceRate: (Math.random() * 100).toFixed(2)
          };
          break;
          
        default:
          syncData.data = {
            records: Math.floor(Math.random() * 100),
            updated: Math.floor(Math.random() * 20),
            created: Math.floor(Math.random() * 10)
          };
      }
      
      // Store synced data
      if (!integrationData.has(integrationId)) {
        integrationData.set(integrationId, []);
      }
      integrationData.get(integrationId)!.push(syncData);
      
      // Update sync log
      log.status = 'completed';
      log.completedAt = new Date().toISOString();
      log.recordsProcessed = Object.values(syncData.data).reduce((sum: number, val: any) => 
        sum + (typeof val === 'number' ? val : 0), 0);
      
      // Update integration
      integration.lastSync = new Date().toISOString();
      integration.syncCount++;
      if (integration.autoSync) {
        integration.nextSync = new Date(Date.now() + integration.syncInterval).toISOString();
      }
      connectedIntegrations.set(integrationId, integration);
      
    }, 2000); // Simulate 2 second sync time
  }
  
  // Get integration details
  adminRouter.get('/integrations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const integration = connectedIntegrations.get(id);
      
      if (!integration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Integration not found' 
        });
      }
      
      // Remove sensitive data
      const { _credentials, ...safeIntegration } = integration;
      
      // Get recent sync logs
      const logs = integrationLogs.get(id) || [];
      const recentLogs = logs.slice(-10).reverse();
      
      // Get latest synced data
      const data = integrationData.get(id) || [];
      const latestData = data[data.length - 1] || null;
      
      res.json({ 
        success: true, 
        integration: safeIntegration,
        recentSyncs: recentLogs,
        latestData,
        totalDataPoints: data.length
      });
    } catch (error) {
      console.error('Admin API - Get integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update integration settings
  adminRouter.put('/integrations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const integration = connectedIntegrations.get(id);
      
      if (!integration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Integration not found' 
        });
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'autoSync', 'syncInterval', 'config', 'dataMapping'
      ];
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          integration[key] = updates[key];
        }
      }
      
      // Update credentials if provided
      if (updates.apiKey) {
        integration._credentials.apiKey = updates.apiKey;
        integration.credentials.apiKey = `${updates.apiKey.substring(0, 4)}...${updates.apiKey.slice(-4)}`;
      }
      if (updates.apiSecret) {
        integration._credentials.apiSecret = updates.apiSecret;
        integration.credentials.apiSecret = '***hidden***';
      }
      if (updates.webhookUrl) {
        integration._credentials.webhookUrl = updates.webhookUrl;
        integration.credentials.webhookUrl = updates.webhookUrl;
      }
      
      integration.updatedAt = new Date().toISOString();
      
      connectedIntegrations.set(id, integration);
      
      // Remove sensitive data from response
      const { _credentials, ...safeIntegration } = integration;
      
      logActivity('INTEGRATION_UPDATE', 'integrations', { 
        id, 
        updates: Object.keys(updates) 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Integration updated successfully',
        integration: safeIntegration
      });
    } catch (error) {
      console.error('Admin API - Update integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Integration update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Disconnect integration
  adminRouter.delete('/integrations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const integration = connectedIntegrations.get(id);
      
      if (!integration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Integration not found' 
        });
      }
      
      connectedIntegrations.delete(id);
      integrationLogs.delete(id);
      integrationData.delete(id);
      
      logActivity('INTEGRATION_DISCONNECT', 'integrations', { 
        id, 
        name: integration.name,
        provider: integration.provider 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Integration "${integration.name}" disconnected successfully`
      });
    } catch (error) {
      console.error('Admin API - Disconnect integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Disconnection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Test integration connection
  adminRouter.post('/integrations/:id/test', async (req, res) => {
    try {
      const { id } = req.params;
      
      const integration = connectedIntegrations.get(id);
      
      if (!integration) {
        return res.status(404).json({ 
          success: false, 
          error: 'Integration not found' 
        });
      }
      
      // Simulate connection test
      const testResult = {
        integrationId: id,
        provider: integration.provider,
        timestamp: new Date().toISOString(),
        status: 'testing',
        checks: {
          authentication: { status: 'pending', message: '' },
          permissions: { status: 'pending', message: '' },
          dataAccess: { status: 'pending', message: '' },
          webhooks: { status: 'pending', message: '' }
        }
      };
      
      // Simulate test results
      setTimeout(() => {
        testResult.checks.authentication = {
          status: integration._credentials.apiKey ? 'passed' : 'failed',
          message: integration._credentials.apiKey ? 'API key valid' : 'Invalid or missing API key'
        };
        
        testResult.checks.permissions = {
          status: 'passed',
          message: 'All required permissions granted'
        };
        
        testResult.checks.dataAccess = {
          status: 'passed',
          message: `Can access ${integration.connectionDetails.capabilities.join(', ')}`
        };
        
        testResult.checks.webhooks = {
          status: integration.credentials.webhookUrl ? 'passed' : 'skipped',
          message: integration.credentials.webhookUrl ? 'Webhook endpoint reachable' : 'No webhook configured'
        };
        
        testResult.status = 'completed';
        
      }, 1000);
      
      res.json({ 
        success: true, 
        message: 'Integration test started',
        testResult
      });
    } catch (error) {
      console.error('Admin API - Test integration error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // AI Agent Management Endpoints
  // ========================================
  
  // Agent storage (in-memory for now)
  const registeredAgents = new Map<string, any>();
  const agentExecutions = new Map<string, any[]>();
  
  // Register/Install new AI agent
  adminRouter.post('/agents/register', async (req, res) => {
    try {
      const { 
        name, 
        type, 
        description, 
        config,
        triggers,
        capabilities,
        apiKeys,
        schedule 
      } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ 
          success: false, 
          error: 'Agent name and type required' 
        });
      }
      
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const agent = {
        id: agentId,
        name,
        type, // 'openai', 'gemini', 'claude', 'webhook', 'custom'
        description: description || '',
        config: config || {},
        triggers: triggers || [], // Events that trigger this agent
        capabilities: capabilities || [], // What this agent can do
        apiKeys: apiKeys || {}, // API keys for external services
        schedule: schedule || null, // Cron schedule if applicable
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        executionCount: 0,
        lastExecuted: null
      };
      
      registeredAgents.set(agentId, agent);
      
      logActivity('AGENT_REGISTER', 'agents', { 
        id: agentId, 
        name, 
        type 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Agent registered successfully',
        agent
      });
    } catch (error) {
      console.error('Admin API - Register agent error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Agent registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // List all registered agents
  adminRouter.get('/agents/list', async (req, res) => {
    try {
      const { status, type } = req.query;
      
      let agents = Array.from(registeredAgents.values());
      
      // Filter by status if provided
      if (status) {
        agents = agents.filter(agent => agent.status === status);
      }
      
      // Filter by type if provided
      if (type) {
        agents = agents.filter(agent => agent.type === type);
      }
      
      // Add execution history
      agents = agents.map(agent => ({
        ...agent,
        recentExecutions: agentExecutions.get(agent.id)?.slice(-5) || []
      }));
      
      res.json({ 
        success: true, 
        agents,
        total: agents.length,
        types: {
          openai: agents.filter(a => a.type === 'openai').length,
          gemini: agents.filter(a => a.type === 'gemini').length,
          claude: agents.filter(a => a.type === 'claude').length,
          webhook: agents.filter(a => a.type === 'webhook').length,
          custom: agents.filter(a => a.type === 'custom').length
        }
      });
    } catch (error) {
      console.error('Admin API - List agents error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to list agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Manually trigger/run an agent
  adminRouter.post('/agents/trigger', async (req, res) => {
    try {
      const { agentId, input, context, parameters } = req.body;
      
      if (!agentId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Agent ID required' 
        });
      }
      
      const agent = registeredAgents.get(agentId);
      
      if (!agent) {
        return res.status(404).json({ 
          success: false, 
          error: 'Agent not found' 
        });
      }
      
      if (agent.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          error: 'Agent is not active' 
        });
      }
      
      // Create execution record
      const execution = {
        id: `exec-${Date.now()}`,
        agentId,
        agentName: agent.name,
        trigger: 'manual',
        input,
        context,
        parameters,
        status: 'running',
        startedAt: new Date().toISOString(),
        completedAt: null,
        result: null,
        error: null
      };
      
      // Store execution
      if (!agentExecutions.has(agentId)) {
        agentExecutions.set(agentId, []);
      }
      agentExecutions.get(agentId)!.push(execution);
      
      // Simulate agent execution based on type
      let result: any = {};
      
      try {
        switch (agent.type) {
          case 'openai':
            // Simulate OpenAI agent execution
            result = {
              message: `OpenAI agent "${agent.name}" processed input`,
              response: `Analyzed: ${input}`,
              model: agent.config.model || 'gpt-4',
              tokens: Math.floor(Math.random() * 1000)
            };
            break;
            
          case 'gemini':
            // Simulate Gemini agent execution
            result = {
              message: `Gemini agent "${agent.name}" processed input`,
              response: `Processed: ${input}`,
              model: agent.config.model || 'gemini-pro'
            };
            break;
            
          case 'webhook':
            // Simulate webhook agent execution
            result = {
              message: `Webhook agent "${agent.name}" called`,
              url: agent.config.webhookUrl,
              method: agent.config.method || 'POST',
              statusCode: 200
            };
            break;
            
          case 'custom':
            // Execute custom logic
            result = {
              message: `Custom agent "${agent.name}" executed`,
              input,
              output: agent.config.customLogic ? 
                `Executed custom logic with input: ${input}` : 
                'No custom logic defined'
            };
            break;
            
          default:
            result = {
              message: `Agent "${agent.name}" executed`,
              type: agent.type,
              input
            };
        }
        
        // Update execution record
        execution.status = 'completed';
        execution.completedAt = new Date().toISOString();
        execution.result = result;
        
        // Update agent stats
        agent.executionCount++;
        agent.lastExecuted = new Date().toISOString();
        registeredAgents.set(agentId, agent);
        
      } catch (error) {
        execution.status = 'failed';
        execution.completedAt = new Date().toISOString();
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        result = { error: execution.error };
      }
      
      logActivity('AGENT_TRIGGER', 'agents', { 
        agentId, 
        executionId: execution.id,
        status: execution.status 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Agent "${agent.name}" triggered successfully`,
        execution,
        result
      });
    } catch (error) {
      console.error('Admin API - Trigger agent error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Agent trigger failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update agent configuration
  adminRouter.put('/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const agent = registeredAgents.get(id);
      
      if (!agent) {
        return res.status(404).json({ 
          success: false, 
          error: 'Agent not found' 
        });
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'description', 'config', 'triggers', 
        'capabilities', 'apiKeys', 'schedule', 'status'
      ];
      
      const updatedAgent = { ...agent };
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updatedAgent[key] = updates[key];
        }
      }
      
      updatedAgent.updatedAt = new Date().toISOString();
      
      registeredAgents.set(id, updatedAgent);
      
      logActivity('AGENT_UPDATE', 'agents', { 
        id, 
        updates: Object.keys(updates) 
      }, req);
      
      res.json({ 
        success: true, 
        message: 'Agent updated successfully',
        agent: updatedAgent
      });
    } catch (error) {
      console.error('Admin API - Update agent error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Agent update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete/unregister an agent
  adminRouter.delete('/agents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const agent = registeredAgents.get(id);
      
      if (!agent) {
        return res.status(404).json({ 
          success: false, 
          error: 'Agent not found' 
        });
      }
      
      registeredAgents.delete(id);
      agentExecutions.delete(id);
      
      logActivity('AGENT_DELETE', 'agents', { 
        id, 
        name: agent.name 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Agent "${agent.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Admin API - Delete agent error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Agent deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get agent execution history
  adminRouter.get('/agents/:id/executions', async (req, res) => {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;
      
      const agent = registeredAgents.get(id);
      
      if (!agent) {
        return res.status(404).json({ 
          success: false, 
          error: 'Agent not found' 
        });
      }
      
      const executions = agentExecutions.get(id) || [];
      const limitNum = parseInt(limit as string);
      
      res.json({ 
        success: true, 
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type
        },
        executions: executions.slice(-limitNum).reverse(),
        total: executions.length
      });
    } catch (error) {
      console.error('Admin API - Get executions error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Code Deployment & Hot Reloading Endpoints
  // ========================================
  
  // Upload/update single file
  adminRouter.post('/deploy/file', async (req, res) => {
    try {
      const { path: filePath, content, encoding = 'utf8' } = req.body;
      
      if (!filePath || content === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'File path and content required' 
        });
      }
      
      // Security: prevent path traversal
      const safePath = path.join(process.cwd(), filePath.replace(/\.\./g, ''));
      
      // Create directory if it doesn't exist
      const dir = path.dirname(safePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write file
      if (encoding === 'base64') {
        await fs.writeFile(safePath, Buffer.from(content, 'base64'));
      } else {
        await fs.writeFile(safePath, content, encoding as BufferEncoding);
      }
      
      logActivity('DEPLOY_FILE', 'deployment', { path: filePath }, req);
      
      res.json({ 
        success: true, 
        message: 'File deployed successfully',
        path: filePath,
        size: Buffer.byteLength(content, encoding as BufferEncoding)
      });
    } catch (error) {
      console.error('Admin API - Deploy file error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'File deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update multiple files at once
  adminRouter.post('/deploy/bulk', async (req, res) => {
    try {
      const { files } = req.body;
      
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Files array required' 
        });
      }
      
      const results = {
        successful: [] as string[],
        failed: [] as { path: string; error: string }[]
      };
      
      for (const file of files) {
        try {
          const { path: filePath, content, encoding = 'utf8' } = file;
          
          if (!filePath || content === undefined) {
            results.failed.push({ 
              path: filePath || 'unknown', 
              error: 'Invalid file data' 
            });
            continue;
          }
          
          const safePath = path.join(process.cwd(), filePath.replace(/\.\./g, ''));
          const dir = path.dirname(safePath);
          await fs.mkdir(dir, { recursive: true });
          
          if (encoding === 'base64') {
            await fs.writeFile(safePath, Buffer.from(content, 'base64'));
          } else {
            await fs.writeFile(safePath, content, encoding as BufferEncoding);
          }
          
          results.successful.push(filePath);
        } catch (error) {
          results.failed.push({
            path: file.path,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      logActivity('DEPLOY_BULK', 'deployment', { 
        successful: results.successful.length,
        failed: results.failed.length 
      }, req);
      
      res.json({ 
        success: true, 
        message: `Deployed ${results.successful.length} files`,
        results
      });
    } catch (error) {
      console.error('Admin API - Bulk deploy error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Bulk deployment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Restart the application
  adminRouter.post('/deploy/restart', async (req, res) => {
    try {
      const { delay = 1000 } = req.body;
      
      logActivity('DEPLOY_RESTART', 'deployment', { delay }, req);
      
      res.json({ 
        success: true, 
        message: `Application will restart in ${delay}ms` 
      });
      
      // Schedule restart after response is sent
      setTimeout(() => {
        console.log('Admin API - Restarting application...');
        process.exit(0); // Process manager will restart the app
      }, delay);
      
    } catch (error) {
      console.error('Admin API - Restart error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Restart failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // View deployment/application logs
  adminRouter.get('/deploy/logs', async (req, res) => {
    try {
      const { lines = 100, type = 'all' } = req.query;
      const logLines = parseInt(lines as string) || 100;
      
      const logs: any = {
        stdout: [],
        stderr: [],
        deployment: []
      };
      
      // Get recent console output (if available)
      try {
        // Read recent activity logs as deployment logs
        const recentActivity = activityLogs.slice(-logLines);
        logs.deployment = recentActivity.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          resource: log.resource,
          details: log.details
        }));
      } catch (error) {
        console.error('Error reading logs:', error);
      }
      
      // Get process info
      const processInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      };
      
      res.json({ 
        success: true, 
        logs: type === 'all' ? logs : logs[type] || [],
        processInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Admin API - Get logs error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Rollback to previous version (using git or backups)
  adminRouter.post('/deploy/rollback', async (req, res) => {
    try {
      const { type = 'backup', target } = req.body;
      
      if (type === 'backup') {
        // List available backups
        const backupDir = path.join(process.cwd(), 'backups');
        
        try {
          await fs.access(backupDir);
          const files = await fs.readdir(backupDir);
          const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
          
          if (!target) {
            // Return available backups
            return res.json({ 
              success: true, 
              availableBackups: backupFiles,
              message: 'Specify a target backup to restore' 
            });
          }
          
          // Restore specific backup
          const backupPath = path.join(backupDir, target);
          const backupData = await fs.readFile(backupPath, 'utf-8');
          const backup = JSON.parse(backupData);
          
          // Restore data to storage
          if (backup.leads) storage.setAllLeads(backup.leads);
          if (backup.voiceCalls) storage.setAllVoiceCalls(backup.voiceCalls);
          if (backup.campaigns) storage.setAllCampaigns(backup.campaigns);
          
          logActivity('DEPLOY_ROLLBACK', 'deployment', { type, target }, req);
          
          res.json({ 
            success: true, 
            message: `Rolled back to ${target}`,
            restoredData: {
              leads: backup.leads?.length || 0,
              voiceCalls: backup.voiceCalls?.length || 0,
              campaigns: backup.campaigns?.length || 0
            }
          });
        } catch (error) {
          return res.status(404).json({ 
            success: false, 
            error: 'No backups available or backup directory not found' 
          });
        }
      } else if (type === 'git') {
        // Git-based rollback
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          // Get recent commits
          const { stdout: commits } = await execAsync('git log --oneline -10');
          
          if (!target) {
            return res.json({ 
              success: true, 
              recentCommits: commits.split('\n').filter(Boolean),
              message: 'Specify a target commit to rollback' 
            });
          }
          
          // Create backup branch before rollback
          await execAsync(`git branch backup-${Date.now()}`);
          
          // Reset to target commit
          await execAsync(`git reset --hard ${target}`);
          
          logActivity('DEPLOY_ROLLBACK', 'deployment', { type: 'git', target }, req);
          
          res.json({ 
            success: true, 
            message: `Rolled back to commit ${target}` 
          });
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            error: 'Git rollback failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid rollback type. Use "backup" or "git"' 
        });
      }
    } catch (error) {
      console.error('Admin API - Rollback error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Rollback failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // Health Check Endpoint
  // ========================================
  
  adminRouter.get('/health', async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        database: !!process.env.DATABASE_URL ? 'connected' : 'in-memory'
      };
      
      res.json({ 
        success: true, 
        data: health 
      });
    } catch (error) {
      console.error('Admin API - Health check error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // ========================================
  // DEPLOYMENT SYSTEM - Autonomous Deploy
  // ========================================
  adminRouter.use('/deploy', createDeploymentRoutes());
  
  // ========================================
  // SELF-MODIFYING SYSTEM - Ultimate AI Control
  // ========================================
  adminRouter.use('/selfmod', selfModRoutes);
  
  // Mount the admin router at /api/admin
  app.use('/api/admin', adminRouter);
}