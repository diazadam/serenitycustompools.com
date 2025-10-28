import { Router, Request, Response, NextFunction } from 'express';
import { authenticateAdminAPI } from './middleware/admin-auth';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as esbuild from 'esbuild';
import { db } from './db';
import { sql } from 'drizzle-orm';

const execAsync = promisify(exec);
const router = Router();

// Store for dynamically created routes - EXPORTED for global use
export const dynamicRoutes = new Map<string, any>();

// Store for configuration values
export const configStore = new Map<string, any>();

// Store for workflow definitions
const workflows = new Map<string, any>();

// Change history for rollback capabilities
const changeHistory: any[] = [];

/**
 * Global dynamic route handler middleware
 * This checks if a request matches any dynamically created route
 */
export const dynamicRouteHandler = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();
  const path = req.path;
  const routeKey = `${method}:${path}`;
  
  // Check if this matches a dynamic route
  const dynamicRoute = dynamicRoutes.get(routeKey);
  
  if (dynamicRoute && dynamicRoute.handler) {
    try {
      // Create handler function if it's a string
      const handlerFunction = typeof dynamicRoute.handler === 'string' 
        ? new Function('req', 'res', 'next', dynamicRoute.handler)
        : dynamicRoute.handler;
      
      // Execute the dynamic route handler
      handlerFunction(req, res, next);
    } catch (error: any) {
      console.error(`Error executing dynamic route ${routeKey}:`, error);
      res.status(500).json({
        success: false,
        error: 'Dynamic route execution failed',
        details: error.message
      });
    }
  } else {
    // No dynamic route found, continue to next middleware
    next();
  }
};

/**
 * 🚀 DYNAMIC ROUTE CREATION
 * Allows agent to create new API endpoints on the fly
 */
router.post('/routes/create', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { path: routePath, method, handler, description, params, response } = req.body;

    if (!routePath || !method || !handler) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: path, method, handler'
      });
    }

    // Create handler function from string
    const handlerFunction = new Function('req', 'res', 'next', handler);
    
    // Store route metadata
    const routeData = {
      path: routePath,
      method: method.toUpperCase(),
      handler: handlerFunction,
      description,
      params,
      response,
      createdAt: new Date().toISOString()
    };

    // Add to dynamic routes store
    const routeKey = `${method.toUpperCase()}:${routePath}`;
    dynamicRoutes.set(routeKey, routeData);

    // Track change for rollback
    changeHistory.push({
      type: 'route_created',
      data: routeData,
      timestamp: new Date().toISOString()
    });

    // Write route to file for persistence
    await persistDynamicRoute(routeData);

    res.json({
      success: true,
      message: `Route ${method.toUpperCase()} ${routePath} created successfully`,
      route: {
        path: routePath,
        method: method.toUpperCase(),
        description
      }
    });
  } catch (error: any) {
    console.error('Error creating dynamic route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🗄️ DATABASE SCHEMA EVOLUTION
 * Modify database structure dynamically
 */
router.post('/schema/add-column', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { table, column, type, defaultValue, nullable } = req.body;

    if (!table || !column || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: table, column, type'
      });
    }

    // Build SQL query for adding column
    let query = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
    
    if (defaultValue !== undefined) {
      query += ` DEFAULT '${defaultValue}'`;
    }
    
    if (nullable === false) {
      query += ' NOT NULL';
    }

    // Execute schema change
    await db.execute(sql.raw(query));

    // Track change
    changeHistory.push({
      type: 'schema_modified',
      data: { table, column, type, defaultValue, nullable },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Column ${column} added to table ${table}`,
      schema: { table, column, type }
    });
  } catch (error: any) {
    console.error('Error modifying schema:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🔧 CREATE DATABASE INDEX
 * Optimize queries with dynamic indexes
 */
router.post('/schema/add-index', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { table, columns, name, unique } = req.body;

    if (!table || !columns || !Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: table, columns (array)'
      });
    }

    const indexName = name || `idx_${table}_${columns.join('_')}`;
    const uniqueStr = unique ? 'UNIQUE ' : '';
    const query = `CREATE ${uniqueStr}INDEX ${indexName} ON ${table} (${columns.join(', ')})`;

    await db.execute(sql.raw(query));

    changeHistory.push({
      type: 'index_created',
      data: { table, columns, name: indexName, unique },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Index ${indexName} created on ${table}`,
      index: { name: indexName, table, columns, unique }
    });
  } catch (error: any) {
    console.error('Error creating index:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ⚛️ REACT COMPONENT GENERATION
 * Create UI components dynamically
 */
router.post('/components/create', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { name, props, template, styles, imports } = req.body;

    if (!name || !template) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, template'
      });
    }

    // Generate component code
    const componentCode = `
${imports || "import React from 'react';"}

interface ${name}Props {
  ${props ? props.map((p: string) => `${p}: any;`).join('\n  ') : ''}
}

export const ${name}: React.FC<${name}Props> = (props) => {
  ${template}
};

${styles ? `// Styles\n${styles}` : ''}
`;

    // Write component to file
    const componentPath = path.join(process.cwd(), 'client', 'src', 'components', 'generated', `${name}.tsx`);
    await fs.mkdir(path.dirname(componentPath), { recursive: true });
    await fs.writeFile(componentPath, componentCode);

    // Track change
    changeHistory.push({
      type: 'component_created',
      data: { name, props, path: componentPath },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Component ${name} created successfully`,
      component: {
        name,
        path: componentPath,
        props
      }
    });
  } catch (error: any) {
    console.error('Error creating component:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ⚙️ CONFIGURATION HOT-RELOAD
 * Update app configuration without restart
 */
router.post('/config/set', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: key, value'
      });
    }

    // Store configuration
    const oldValue = configStore.get(key);
    configStore.set(key, value);

    // Track change
    changeHistory.push({
      type: 'config_updated',
      data: { key, oldValue, newValue: value },
      timestamp: new Date().toISOString()
    });

    // Persist to file
    await persistConfiguration();

    res.json({
      success: true,
      message: `Configuration ${key} updated`,
      config: { key, value, description }
    });
  } catch (error: any) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🔄 WORKFLOW AUTOMATION ENGINE
 * Create complex automation workflows
 */
router.post('/workflows/create', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { name, trigger, conditions, actions, schedule } = req.body;

    if (!name || !trigger || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, trigger, actions'
      });
    }

    // Create workflow definition
    const workflow = {
      name,
      trigger,
      conditions: conditions || [],
      actions,
      schedule,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    // Store workflow
    workflows.set(name, workflow);

    // Track change
    changeHistory.push({
      type: 'workflow_created',
      data: workflow,
      timestamp: new Date().toISOString()
    });

    // Persist workflow
    await persistWorkflow(workflow);

    res.json({
      success: true,
      message: `Workflow ${name} created successfully`,
      workflow: {
        name,
        trigger,
        actionsCount: actions.length
      }
    });
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📜 GET CHANGE HISTORY
 * View all modifications made to the system
 */
router.get('/history', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = changeHistory.slice(offset, offset + limit);

    res.json({
      success: true,
      history,
      total: changeHistory.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ↩️ ROLLBACK CHANGES
 * Undo recent modifications
 */
router.post('/rollback', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { steps } = req.body;
    const rollbackSteps = steps || 1;

    if (changeHistory.length < rollbackSteps) {
      return res.status(400).json({
        success: false,
        error: 'Not enough changes to rollback'
      });
    }

    const rolledBack = [];
    
    for (let i = 0; i < rollbackSteps; i++) {
      const change = changeHistory.pop();
      if (change) {
        // Implement rollback logic based on change type
        await rollbackChange(change);
        rolledBack.push(change);
      }
    }

    res.json({
      success: true,
      message: `Rolled back ${rolledBack.length} changes`,
      changes: rolledBack
    });
  } catch (error: any) {
    console.error('Error rolling back changes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🧠 AI LEARNING MODULE
 * Analyze usage patterns and optimize automatically
 */
router.post('/optimize/analyze', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    // Analyze system performance
    const analysis = {
      slowQueries: await analyzeSlowQueries(),
      unusedRoutes: analyzeUnusedRoutes(),
      frequentErrors: await analyzeErrors(),
      suggestions: [] as any[]
    };

    // Generate optimization suggestions
    if (analysis.slowQueries.length > 0) {
      analysis.suggestions.push({
        type: 'index',
        message: 'Create indexes for slow queries',
        queries: analysis.slowQueries
      });
    }

    if (analysis.unusedRoutes.length > 0) {
      analysis.suggestions.push({
        type: 'cleanup',
        message: 'Remove unused routes to improve performance',
        routes: analysis.unusedRoutes
      });
    }

    res.json({
      success: true,
      analysis,
      suggestionsCount: analysis.suggestions.length
    });
  } catch (error: any) {
    console.error('Error analyzing system:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 💾 EXPORT SYSTEM STATE
 * Export all dynamic configurations and routes
 */
router.get('/export', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const exportData = {
      routes: Array.from(dynamicRoutes.entries()),
      config: Array.from(configStore.entries()),
      workflows: Array.from(workflows.entries()),
      history: changeHistory,
      exportedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error: any) {
    console.error('Error exporting system state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📥 IMPORT SYSTEM STATE
 * Import previously exported configuration
 */
router.post('/import', authenticateAdminAPI, async (req: Request, res: Response) => {
  try {
    const { routes, config, workflows: importedWorkflows } = req.body;

    let imported = {
      routes: 0,
      config: 0,
      workflows: 0
    };

    // Import routes
    if (routes && Array.isArray(routes)) {
      for (const [key, route] of routes) {
        dynamicRoutes.set(key, route);
        imported.routes++;
      }
    }

    // Import configuration
    if (config && Array.isArray(config)) {
      for (const [key, value] of config) {
        configStore.set(key, value);
        imported.config++;
      }
    }

    // Import workflows
    if (importedWorkflows && Array.isArray(importedWorkflows)) {
      for (const [name, workflow] of importedWorkflows) {
        workflows.set(name, workflow);
        imported.workflows++;
      }
    }

    res.json({
      success: true,
      message: 'System state imported successfully',
      imported
    });
  } catch (error: any) {
    console.error('Error importing system state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions

async function persistDynamicRoute(routeData: any) {
  const routesPath = path.join(process.cwd(), 'dynamic-routes.json');
  let routes = [];
  
  try {
    const existing = await fs.readFile(routesPath, 'utf-8');
    routes = JSON.parse(existing);
  } catch (e) {
    // File doesn't exist yet
  }
  
  routes.push(routeData);
  await fs.writeFile(routesPath, JSON.stringify(routes, null, 2));
}

async function persistConfiguration() {
  const configPath = path.join(process.cwd(), 'dynamic-config.json');
  const config = Object.fromEntries(configStore);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function persistWorkflow(workflow: any) {
  const workflowsPath = path.join(process.cwd(), 'dynamic-workflows.json');
  let existingWorkflows = [];
  
  try {
    const existing = await fs.readFile(workflowsPath, 'utf-8');
    existingWorkflows = JSON.parse(existing);
  } catch (e) {
    // File doesn't exist yet
  }
  
  existingWorkflows.push(workflow);
  await fs.writeFile(workflowsPath, JSON.stringify(existingWorkflows, null, 2));
}

async function rollbackChange(change: any) {
  switch (change.type) {
    case 'route_created':
      const routeKey = `${change.data.method}:${change.data.path}`;
      dynamicRoutes.delete(routeKey);
      break;
    
    case 'config_updated':
      if (change.data.oldValue !== undefined) {
        configStore.set(change.data.key, change.data.oldValue);
      } else {
        configStore.delete(change.data.key);
      }
      break;
    
    case 'workflow_created':
      workflows.delete(change.data.name);
      break;
    
    // Add more rollback logic for other change types
  }
}

async function analyzeSlowQueries() {
  // Analyze database query performance
  try {
    const result = await db.execute(sql`
      SELECT query, mean_exec_time 
      FROM pg_stat_statements 
      WHERE mean_exec_time > 100 
      ORDER BY mean_exec_time DESC 
      LIMIT 10
    `);
    return result.rows || [];
  } catch (e) {
    return [];
  }
}

function analyzeUnusedRoutes() {
  // This would analyze route usage patterns
  // For now, return empty array
  return [];
}

async function analyzeErrors() {
  // This would analyze error patterns
  // For now, return empty array
  return [];
}

// Load persisted data on startup
async function loadPersistedData() {
  try {
    // Load routes
    const routesPath = path.join(process.cwd(), 'dynamic-routes.json');
    const routesData = await fs.readFile(routesPath, 'utf-8');
    const routes = JSON.parse(routesData);
    for (const route of routes) {
      const routeKey = `${route.method}:${route.path}`;
      dynamicRoutes.set(routeKey, route);
    }
  } catch (e) {
    console.log('No persisted routes found');
  }

  try {
    // Load config
    const configPath = path.join(process.cwd(), 'dynamic-config.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    for (const [key, value] of Object.entries(config)) {
      configStore.set(key, value);
    }
  } catch (e) {
    console.log('No persisted config found');
  }

  try {
    // Load workflows
    const workflowsPath = path.join(process.cwd(), 'dynamic-workflows.json');
    const workflowsData = await fs.readFile(workflowsPath, 'utf-8');
    const workflowList = JSON.parse(workflowsData);
    for (const workflow of workflowList) {
      workflows.set(workflow.name, workflow);
    }
  } catch (e) {
    console.log('No persisted workflows found');
  }
}

// Load data on module initialization
loadPersistedData();

export default router;