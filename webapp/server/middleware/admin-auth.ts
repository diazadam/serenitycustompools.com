import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include adminAuthenticated flag
declare global {
  namespace Express {
    interface Request {
      adminAuthenticated?: boolean;
    }
  }
}

/**
 * Middleware to authenticate admin API requests using Bearer token
 * Checks for ADMIN_API_KEY environment variable
 */
export function authenticateAdminAPI(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Missing or invalid authorization header. Use Bearer token format.' 
    });
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  if (!adminApiKey) {
    console.error('ADMIN_API_KEY not configured in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error', 
      message: 'Admin API not properly configured' 
    });
  }
  
  if (token !== adminApiKey) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid API key' 
    });
  }
  
  // Mark request as authenticated
  req.adminAuthenticated = true;
  next();
}

/**
 * Optional middleware to log admin API access for security auditing
 */
export function logAdminAccess(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const body = req.body ? JSON.stringify(req.body).substring(0, 200) : 'N/A';
  
  console.log(`[ADMIN API ACCESS] ${timestamp} - ${method} ${path} - Body: ${body}`);
  
  next();
}