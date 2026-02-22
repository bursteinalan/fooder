import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Validation middleware for signup/login requests
 */
function validateAuthInput(req: Request, res: Response, next: NextFunction): void {
  const { username, password } = req.body;

  // Validate username
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ 
      error: 'Validation Error',
      message: 'Username is required and must be a non-empty string' 
    });
    return;
  }

  // Validate password exists (can be empty string per requirement 1.4)
  if (password === undefined || password === null || typeof password !== 'string') {
    res.status(400).json({ 
      error: 'Validation Error',
      message: 'Password is required and must be a string' 
    });
    return;
  }

  next();
}

/**
 * Create authentication router
 * Requirements: 1.1, 1.3, 2.1, 2.2
 */
export function createAuthRouter(authService: AuthService, authMiddleware: any): Router {
  const router = Router();

  /**
   * POST /api/auth/signup - Create new user account
   * Requirements: 1.1, 1.3
   */
  router.post('/signup', validateAuthInput, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const authResponse = await authService.signup({ username, password });
      
      res.status(201).json(authResponse);
    } catch (error) {
      // Check if it's a username conflict error (Requirement 1.3)
      if (error instanceof Error && error.message === 'Username already exists') {
        res.status(409).json({ 
          error: 'Conflict',
          message: 'Username already exists' 
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create account' 
      });
    }
  });

  /**
   * POST /api/auth/login - Authenticate user
   * Requirements: 2.1, 2.2
   */
  router.post('/login', validateAuthInput, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const authResponse = await authService.login({ username, password });
      
      res.json(authResponse);
    } catch (error) {
      // Check if it's an invalid credentials error (Requirement 2.2)
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid credentials' 
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to log in' 
      });
    }
  });

  /**
   * GET /api/auth/me - Get current user info
   * Requires authentication
   */
  router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User ID not found in request' 
        });
        return;
      }
      
      const user = await authService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'User not found' 
        });
        return;
      }
      
      // Return user info without password hash
      res.json({
        userId: user.id,
        username: user.username,
        createdAt: user.createdAt
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve user info' 
      });
    }
  });

  return router;
}
