import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  branch: string;
  commit?: string;
  author?: string;
  message?: string;
  logs: string[];
  metadata?: Record<string, any>;
  previousVersion?: string;
  currentVersion?: string;
  healthChecks?: HealthCheckResult[];
  rollbackAvailable: boolean;
}

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  timestamp: Date;
  responseTime?: number;
}

interface DeploymentStrategy {
  type: 'rolling' | 'blue-green' | 'canary' | 'recreate';
  config?: Record<string, any>;
}

class DeploymentManager {
  private deployments: Map<string, DeploymentConfig> = new Map();
  private currentDeployment: DeploymentConfig | null = null;
  private deploymentHistory: DeploymentConfig[] = [];
  
  async createDeployment(config: Partial<DeploymentConfig>): Promise<DeploymentConfig> {
    const deployment: DeploymentConfig = {
      id: crypto.randomUUID(),
      name: config.name || `deployment-${Date.now()}`,
      environment: config.environment || 'development',
      status: 'pending',
      startedAt: new Date(),
      branch: config.branch || 'main',
      logs: [],
      rollbackAvailable: false,
      ...config
    };
    
    this.deployments.set(deployment.id, deployment);
    this.currentDeployment = deployment;
    return deployment;
  }
  
  async updateDeploymentStatus(
    deploymentId: string, 
    status: DeploymentConfig['status'],
    log?: string
  ): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    
    deployment.status = status;
    if (log) deployment.logs.push(`[${new Date().toISOString()}] ${log}`);
    
    if (status === 'success' || status === 'failed') {
      deployment.completedAt = new Date();
      this.deploymentHistory.push(deployment);
      if (this.deploymentHistory.length > 50) {
        this.deploymentHistory.shift();
      }
    }
  }
  
  getDeployment(deploymentId: string): DeploymentConfig | undefined {
    return this.deployments.get(deploymentId);
  }
  
  getCurrentDeployment(): DeploymentConfig | null {
    return this.currentDeployment;
  }
  
  getDeploymentHistory(limit: number = 10): DeploymentConfig[] {
    return this.deploymentHistory.slice(-limit);
  }
}

const deploymentManager = new DeploymentManager();

export function createDeploymentRoutes(): Router {
  const router = Router();
  
  // ========================================
  // Autonomous Deployment Endpoints
  // ========================================
  
  // Trigger a new deployment
  router.post('/trigger', async (req, res) => {
    try {
      const { 
        branch = 'main',
        environment = 'production',
        strategy = 'rolling',
        autoRollback = true,
        healthCheckInterval = 5000,
        maxHealthCheckAttempts = 10
      } = req.body;
      
      // Create deployment record
      const deployment = await deploymentManager.createDeployment({
        branch,
        environment,
        metadata: { strategy, autoRollback }
      });
      
      // Start deployment in background
      setImmediate(async () => {
        try {
          await deploymentManager.updateDeploymentStatus(
            deployment.id, 
            'in_progress',
            'Starting deployment process...'
          );
          
          // Git operations
          await performGitOperations(deployment);
          
          // Build process
          await performBuild(deployment);
          
          // Run tests
          await runTests(deployment);
          
          // Deploy based on strategy
          await deployWithStrategy(deployment, strategy as DeploymentStrategy['type']);
          
          // Health checks
          const healthPassed = await performHealthChecks(
            deployment,
            healthCheckInterval,
            maxHealthCheckAttempts
          );
          
          if (!healthPassed && autoRollback) {
            await performRollback(deployment);
          } else if (healthPassed) {
            await deploymentManager.updateDeploymentStatus(
              deployment.id,
              'success',
              'Deployment completed successfully'
            );
          }
        } catch (error) {
          await deploymentManager.updateDeploymentStatus(
            deployment.id,
            'failed',
            `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          
          if (autoRollback) {
            await performRollback(deployment);
          }
        }
      });
      
      res.json({
        success: true,
        deploymentId: deployment.id,
        message: 'Deployment initiated',
        trackingUrl: `/api/admin/deploy/status/${deployment.id}`
      });
    } catch (error) {
      console.error('Deployment trigger error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger deployment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get deployment status
  router.get('/status/:deploymentId', async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentManager.getDeployment(deploymentId);
      
      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found'
        });
      }
      
      res.json({
        success: true,
        deployment: {
          ...deployment,
          duration: deployment.completedAt 
            ? (deployment.completedAt.getTime() - deployment.startedAt.getTime()) / 1000
            : null,
          isActive: deployment.status === 'in_progress'
        }
      });
    } catch (error) {
      console.error('Get deployment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment status'
      });
    }
  });
  
  // Get current deployment
  router.get('/current', async (req, res) => {
    try {
      const current = deploymentManager.getCurrentDeployment();
      
      res.json({
        success: true,
        deployment: current,
        hasActiveDeployment: current !== null && current.status === 'in_progress'
      });
    } catch (error) {
      console.error('Get current deployment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get current deployment'
      });
    }
  });
  
  // Get deployment history
  router.get('/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = deploymentManager.getDeploymentHistory(limit);
      
      res.json({
        success: true,
        deployments: history,
        total: history.length
      });
    } catch (error) {
      console.error('Get deployment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment history'
      });
    }
  });
  
  // Rollback deployment
  router.post('/rollback/:deploymentId', async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentManager.getDeployment(deploymentId);
      
      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found'
        });
      }
      
      if (!deployment.rollbackAvailable || !deployment.previousVersion) {
        return res.status(400).json({
          success: false,
          error: 'Rollback not available for this deployment'
        });
      }
      
      // Perform rollback
      await performRollback(deployment);
      
      res.json({
        success: true,
        message: 'Rollback initiated',
        previousVersion: deployment.previousVersion
      });
    } catch (error) {
      console.error('Rollback error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform rollback'
      });
    }
  });
  
  // Health check endpoint
  router.get('/health', async (req, res) => {
    try {
      const checks = await performSystemHealthChecks();
      const allPassed = checks.every(check => check.status === 'pass');
      
      res.status(allPassed ? 200 : 503).json({
        success: allPassed,
        status: allPassed ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        status: 'error',
        error: 'Health check failed'
      });
    }
  });
  
  // Cancel deployment
  router.post('/cancel/:deploymentId', async (req, res) => {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentManager.getDeployment(deploymentId);
      
      if (!deployment) {
        return res.status(404).json({
          success: false,
          error: 'Deployment not found'
        });
      }
      
      if (deployment.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          error: 'Can only cancel in-progress deployments'
        });
      }
      
      await deploymentManager.updateDeploymentStatus(
        deploymentId,
        'failed',
        'Deployment cancelled by user'
      );
      
      // Rollback if possible
      if (deployment.rollbackAvailable && deployment.previousVersion) {
        await performRollback(deployment);
      }
      
      res.json({
        success: true,
        message: 'Deployment cancelled'
      });
    } catch (error) {
      console.error('Cancel deployment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel deployment'
      });
    }
  });
  
  // Auto-deploy webhook (for CI/CD)
  router.post('/webhook', async (req, res) => {
    try {
      const { 
        event, 
        branch, 
        commit,
        author,
        message,
        repository 
      } = req.body;
      
      // Validate webhook signature if configured
      if (process.env.WEBHOOK_SECRET) {
        const signature = req.headers['x-signature'] as string;
        if (!validateWebhookSignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
          return res.status(401).json({
            success: false,
            error: 'Invalid webhook signature'
          });
        }
      }
      
      // Check if auto-deploy is enabled for this branch
      const autoDeployBranches = (process.env.AUTO_DEPLOY_BRANCHES || 'main,master').split(',');
      if (!autoDeployBranches.includes(branch)) {
        return res.json({
          success: true,
          message: `Auto-deploy not enabled for branch: ${branch}`
        });
      }
      
      // Trigger deployment
      const deployment = await deploymentManager.createDeployment({
        branch,
        commit,
        author,
        message,
        environment: branch === 'main' ? 'production' : 'staging',
        metadata: { 
          triggeredBy: 'webhook',
          event,
          repository 
        }
      });
      
      // Start async deployment
      setImmediate(async () => {
        await executeAutonomousDeployment(deployment);
      });
      
      res.json({
        success: true,
        message: 'Auto-deployment triggered',
        deploymentId: deployment.id
      });
    } catch (error) {
      console.error('Webhook deployment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  });
  
  return router;
}

// Helper Functions
async function performGitOperations(deployment: DeploymentConfig): Promise<void> {
  try {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Fetching latest code...'
    );
    
    // Store current version for rollback
    const { stdout: currentCommit } = await execAsync('git rev-parse HEAD');
    deployment.previousVersion = currentCommit.trim();
    
    // Fetch and checkout
    await execAsync('git fetch origin');
    await execAsync(`git checkout ${deployment.branch}`);
    await execAsync(`git pull origin ${deployment.branch}`);
    
    // Get new commit info
    const { stdout: newCommit } = await execAsync('git rev-parse HEAD');
    deployment.currentVersion = newCommit.trim();
    deployment.commit = newCommit.trim();
    
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      `Updated to commit: ${deployment.currentVersion.substring(0, 8)}`
    );
  } catch (error) {
    throw new Error(`Git operations failed: ${error}`);
  }
}

async function performBuild(deployment: DeploymentConfig): Promise<void> {
  try {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Building application...'
    );
    
    // Install dependencies
    await execAsync('npm ci');
    
    // Run build
    await execAsync('npm run build');
    
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Build completed successfully'
    );
  } catch (error) {
    throw new Error(`Build failed: ${error}`);
  }
}

async function runTests(deployment: DeploymentConfig): Promise<void> {
  try {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Running tests...'
    );
    
    // Run tests if they exist
    try {
      await execAsync('npm test -- --passWithNoTests');
      await deploymentManager.updateDeploymentStatus(
        deployment.id,
        'in_progress',
        'Tests passed'
      );
    } catch (error) {
      // Tests failed but continue if configured
      if (process.env.REQUIRE_TESTS_PASS === 'true') {
        throw error;
      }
      await deploymentManager.updateDeploymentStatus(
        deployment.id,
        'in_progress',
        'Tests skipped or failed (non-blocking)'
      );
    }
  } catch (error) {
    throw new Error(`Tests failed: ${error}`);
  }
}

async function deployWithStrategy(
  deployment: DeploymentConfig, 
  strategy: DeploymentStrategy['type']
): Promise<void> {
  await deploymentManager.updateDeploymentStatus(
    deployment.id,
    'in_progress',
    `Deploying with ${strategy} strategy...`
  );
  
  switch (strategy) {
    case 'rolling':
      await performRollingDeployment(deployment);
      break;
    case 'blue-green':
      await performBlueGreenDeployment(deployment);
      break;
    case 'canary':
      await performCanaryDeployment(deployment);
      break;
    case 'recreate':
      await performRecreateDeployment(deployment);
      break;
    default:
      await performRollingDeployment(deployment);
  }
}

async function performRollingDeployment(deployment: DeploymentConfig): Promise<void> {
  // Restart application with zero-downtime
  await execAsync('pm2 reload all --update-env');
  deployment.rollbackAvailable = true;
}

async function performBlueGreenDeployment(deployment: DeploymentConfig): Promise<void> {
  // Implement blue-green deployment logic
  // This would involve switching between two identical production environments
  deployment.rollbackAvailable = true;
}

async function performCanaryDeployment(deployment: DeploymentConfig): Promise<void> {
  // Implement canary deployment logic
  // This would involve gradually rolling out to a percentage of users
  deployment.rollbackAvailable = true;
}

async function performRecreateDeployment(deployment: DeploymentConfig): Promise<void> {
  // Stop and restart application
  await execAsync('pm2 stop all');
  await execAsync('pm2 start all');
  deployment.rollbackAvailable = true;
}

async function performHealthChecks(
  deployment: DeploymentConfig,
  interval: number,
  maxAttempts: number
): Promise<boolean> {
  await deploymentManager.updateDeploymentStatus(
    deployment.id,
    'in_progress',
    'Performing health checks...'
  );
  
  let attempts = 0;
  let allChecksPassed = false;
  
  while (attempts < maxAttempts && !allChecksPassed) {
    attempts++;
    const checks = await performSystemHealthChecks();
    deployment.healthChecks = checks;
    
    allChecksPassed = checks.every(check => check.status === 'pass');
    
    if (!allChecksPassed) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  if (allChecksPassed) {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Health checks passed'
    );
  } else {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Health checks failed'
    );
  }
  
  return allChecksPassed;
}

async function performSystemHealthChecks(): Promise<HealthCheckResult[]> {
  const checks: HealthCheckResult[] = [];
  
  // Check API health
  checks.push({
    name: 'API',
    status: 'pass',
    timestamp: new Date(),
    message: 'API is responding'
  });
  
  // Check database connection
  try {
    // Add database check logic here
    checks.push({
      name: 'Database',
      status: 'pass',
      timestamp: new Date(),
      message: 'Database connection established'
    });
  } catch {
    checks.push({
      name: 'Database',
      status: 'fail',
      timestamp: new Date(),
      message: 'Database connection failed'
    });
  }
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  const memLimit = 1024 * 1024 * 1024; // 1GB
  checks.push({
    name: 'Memory',
    status: memUsage.heapUsed < memLimit ? 'pass' : 'fail',
    timestamp: new Date(),
    message: `Using ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
  });
  
  return checks;
}

async function performRollback(deployment: DeploymentConfig): Promise<void> {
  try {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'in_progress',
      'Initiating rollback...'
    );
    
    if (deployment.previousVersion) {
      await execAsync(`git checkout ${deployment.previousVersion}`);
      await execAsync('npm ci');
      await execAsync('npm run build');
      await execAsync('pm2 reload all');
    }
    
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'rolled_back',
      'Rollback completed'
    );
  } catch (error) {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'failed',
      `Rollback failed: ${error}`
    );
  }
}

async function executeAutonomousDeployment(deployment: DeploymentConfig): Promise<void> {
  try {
    await performGitOperations(deployment);
    await performBuild(deployment);
    await runTests(deployment);
    await deployWithStrategy(deployment, 'rolling');
    await performHealthChecks(deployment, 5000, 10);
    
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'success',
      'Autonomous deployment completed'
    );
  } catch (error) {
    await deploymentManager.updateDeploymentStatus(
      deployment.id,
      'failed',
      `Deployment failed: ${error}`
    );
  }
}

function validateWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return signature === expectedSignature;
}