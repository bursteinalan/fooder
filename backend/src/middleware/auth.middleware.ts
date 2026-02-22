import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Extended Request interface with userId
 */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Authentication middleware factory
 * Creates middleware that validates session tokens and attaches userId to requests
 * Requirements: 2.1, 3.1, 3.2
 */
export function createAuthMiddleware(authService: AuthService) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authorization header is required' 
        });
        return;
      }

      // Expected format: "Bearer <token>"
      const parts = authHeader.split(' ');

      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authorization header must be in format: Bearer <token>' 
        });
        return;
      }

      const token = parts[1];

      if (!token) {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Token is required' 
        });
        return;
      }

      // Validate token using auth service
      const userId = await authService.validateSession(token);

      if (!userId) {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or expired token' 
        });
        return;
      }

      // Attach userId to request object
      req.userId = userId;

      // Continue to next middleware/route handler
      next();
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'An error occurred during authentication' 
      });
    }
  };
}
