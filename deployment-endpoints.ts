/**
 * DEPLOYMENT ENDPOINTS - AUTONOMOUS DEPLOYMENT SYSTEM
 *
 * This module gives Claude Code (or any AI agent) complete power to:
 * - Modify frontend/backend files
 * - Build the React application
 * - Restart the server
 * - Deploy changes automatically
 *
 * NO MANUAL REDEPLOYMENT NEEDED!
 */

import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

// Deployment state tracking
interface DeploymentLog {
  id: string;
  timestamp: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  message: string;
  buildOutput?: string;
  error?: string;
  duration?: number;
  filesChanged?: string[];
}

const deploymentHistory: DeploymentLog[] = [];
let currentDeployment: DeploymentLog | null = null;
let isDeploying = false;

// Track last deployment time to prevent rapid redeployments
let lastDeploymentTime = 0;
const MIN_DEPLOY_INTERVAL = 10000; // 10 seconds minimum between deployments

function logDeployment(log: DeploymentLog) {
  deploymentHistory.push(log);

  // Keep only last 50 deployments
  if (deploymentHistory.length > 50) {
    deploymentHistory.shift();
  }

  console.log(`[DEPLOYMENT] ${log.status.toUpperCase()}: ${log.message}`);
}

/**
 * Create deployment endpoints router
 */
export function createDeploymentRoutes() {
  const router = Router();

  // ========================================
  // DEPLOYMENT CONTROL ENDPOINTS
  // ========================================

  /**
   * POST /deploy/now
   *
   * Main deployment endpoint - builds and restarts the application
   *
   * Body:
   * - buildFirst: boolean (default: true) - Run npm build before deploying
   * - skipBuild: boolean (default: false) - Skip build step (for backend-only changes)
   * - message: string - Deployment message/reason
   * - filesChanged: string[] - List of files that were changed (for logging)
   */
  router.post('/deploy/now', async (req, res) => {
    try {
      const {
        buildFirst = true,
        skipBuild = false,
        message = 'Deployment via Admin API',
        filesChanged = []
      } = req.body;

      // Check if already deploying
      if (isDeploying) {
        return res.status(409).json({
          success: false,
          error: 'Deployment already in progress',
          currentDeployment
        });
      }

      // Rate limiting - prevent rapid deployments
      const now = Date.now();
      if (now - lastDeploymentTime < MIN_DEPLOY_INTERVAL) {
        const waitTime = Math.ceil((MIN_DEPLOY_INTERVAL - (now - lastDeploymentTime)) / 1000);
        return res.status(429).json({
          success: false,
          error: `Please wait ${waitTime} seconds before next deployment`,
          lastDeployment: lastDeploymentTime
        });
      }

      lastDeploymentTime = now;

      // Create deployment log
      const deployment: DeploymentLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        message,
        filesChanged
      };

      currentDeployment = deployment;
      isDeploying = true;
      logDeployment(deployment);

      // Send immediate response
      res.json({
        success: true,
        message: 'Deployment initiated',
        deploymentId: deployment.id,
        estimatedTime: (buildFirst && !skipBuild) ? '30-60 seconds' : '5-10 seconds',
        steps: (buildFirst && !skipBuild) ? [
          '1. Building React application (npm run build)',
          '2. Restarting server',
          '3. Changes live!'
        ] : [
          '1. Restarting server',
          '2. Changes live!'
        ]
      });

      // Run deployment in background
      setTimeout(async () => {
        const startTime = Date.now();

        try {
          deployment.status = 'building';
          logDeployment({ ...deployment });

          let buildOutput = '';

          // Step 1: Build if needed
          if (buildFirst && !skipBuild) {
            console.log('🔨 Building React application...');

            try {
              const { stdout, stderr } = await execAsync('npm run build', {
                timeout: 300000, // 5 minute timeout
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer
              });

              buildOutput = stdout + stderr;
              console.log('✅ Build completed successfully');

              deployment.buildOutput = buildOutput;
            } catch (error: any) {
              console.error('❌ Build failed:', error);

              deployment.status = 'failed';
              deployment.error = error.message;
              deployment.buildOutput = error.stdout + error.stderr;
              deployment.duration = Date.now() - startTime;

              logDeployment(deployment);
              currentDeployment = null;
              isDeploying = false;
              return;
            }
          }

          // Step 2: Deploy (restart server)
          deployment.status = 'deploying';
          console.log('🚀 Restarting server...');

          deployment.status = 'success';
          deployment.duration = Date.now() - startTime;
          deployment.message += ` (completed in ${deployment.duration}ms)`;

          logDeployment(deployment);

          console.log(`✅ Deployment complete! Server restarting...`);

          // Give a moment for logs to flush
          await new Promise(resolve => setTimeout(resolve, 500));

          // Restart the application
          // Replit will automatically restart the process
          currentDeployment = null;
          isDeploying = false;
          process.exit(0);

        } catch (error: any) {
          console.error('❌ Deployment failed:', error);

          deployment.status = 'failed';
          deployment.error = error.message;
          deployment.duration = Date.now() - startTime;

          logDeployment(deployment);
          currentDeployment = null;
          isDeploying = false;
        }
      }, 500);

    } catch (error: any) {
      console.error('Deployment initiation error:', error);
      isDeploying = false;
      currentDeployment = null;

      res.status(500).json({
        success: false,
        error: 'Failed to initiate deployment',
        details: error.message
      });
    }
  });

  /**
   * POST /deploy/build-only
   *
   * Build the React app without restarting (for testing)
   */
  router.post('/deploy/build-only', async (req, res) => {
    try {
      if (isDeploying) {
        return res.status(409).json({
          success: false,
          error: 'Deployment already in progress'
        });
      }

      res.json({
        success: true,
        message: 'Build started',
        note: 'Build output will be logged to console'
      });

      // Run build in background
      setTimeout(async () => {
        try {
          console.log('🔨 Building React application (test build)...');
          const { stdout, stderr } = await execAsync('npm run build', {
            timeout: 300000
          });

          console.log('✅ Build completed successfully');
          console.log('Build output:', stdout);
          if (stderr) console.log('Build warnings:', stderr);

        } catch (error: any) {
          console.error('❌ Build failed:', error);
          console.error('Error output:', error.stdout + error.stderr);
        }
      }, 100);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to start build',
        details: error.message
      });
    }
  });

  /**
   * POST /deploy/restart
   *
   * Restart the server without building (for backend-only changes)
   */
  router.post('/deploy/restart', async (req, res) => {
    try {
      const { message = 'Server restart via Admin API' } = req.body;

      res.json({
        success: true,
        message: 'Server restarting...',
        note: 'Application will be back online in 5-10 seconds'
      });

      console.log(`🔄 ${message}`);
      console.log('Server restarting...');

      // Give response time to send
      setTimeout(() => {
        process.exit(0);
      }, 500);

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to restart server',
        details: error.message
      });
    }
  });

  /**
   * GET /deploy/status
   *
   * Get current deployment status
   */
  router.get('/deploy/status', async (req, res) => {
    try {
      res.json({
        success: true,
        isDeploying,
        currentDeployment,
        lastDeploymentTime: lastDeploymentTime ? new Date(lastDeploymentTime).toISOString() : null,
        canDeploy: !isDeploying && (Date.now() - lastDeploymentTime >= MIN_DEPLOY_INTERVAL),
        minIntervalMs: MIN_DEPLOY_INTERVAL,
        serverUptime: process.uptime(),
        serverStarted: new Date(Date.now() - process.uptime() * 1000).toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment status',
        details: error.message
      });
    }
  });

  /**
   * GET /deploy/history
   *
   * Get deployment history
   */
  router.get('/deploy/history', async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const limitNum = parseInt(limit as string);

      const history = deploymentHistory
        .slice(-limitNum)
        .reverse(); // Most recent first

      res.json({
        success: true,
        history,
        total: deploymentHistory.length,
        showing: history.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment history',
        details: error.message
      });
    }
  });

  /**
   * GET /deploy/info
   *
   * Get information about the deployment system
   */
  router.get('/deploy/info', async (req, res) => {
    try {
      res.json({
        success: true,
        info: {
          system: 'Autonomous Deployment System',
          version: '1.0.0',
          capabilities: [
            'Build React application (npm run build)',
            'Restart Node.js server',
            'Deploy backend changes without build',
            'Deploy frontend changes with build',
            'Deployment history tracking',
            'Rate limiting (10s minimum interval)',
            'Build output logging',
            'Error handling and rollback readiness'
          ],
          endpoints: {
            'POST /api/admin/deploy/now': 'Full deployment (build + restart)',
            'POST /api/admin/deploy/build-only': 'Build without restart (testing)',
            'POST /api/admin/deploy/restart': 'Restart without build (backend only)',
            'GET /api/admin/deploy/status': 'Current deployment status',
            'GET /api/admin/deploy/history': 'Deployment history',
            'GET /api/admin/deploy/info': 'This information endpoint'
          },
          usage: {
            'Frontend changes': 'Use /deploy/now with buildFirst: true (default)',
            'Backend changes': 'Use /deploy/restart (faster)',
            'Testing build': 'Use /deploy/build-only',
            'Full deploy': 'Use /deploy/now with message describing changes'
          },
          timing: {
            'Backend restart': '5-10 seconds',
            'Frontend build + restart': '30-60 seconds',
            'Rate limit': '10 seconds minimum between deployments'
          },
          notes: [
            'All deployments run in background - API responds immediately',
            'Server will restart automatically after deployment',
            'Build errors are logged and prevent deployment',
            'Deployment history is kept in memory (last 50)',
            'Replit will automatically restart the server on exit'
          ]
        },
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          env: process.env.NODE_ENV || 'development',
          cwd: process.cwd()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment info',
        details: error.message
      });
    }
  });

  return router;
}

export { DeploymentLog };
