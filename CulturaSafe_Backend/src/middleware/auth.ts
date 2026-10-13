import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { supabasePublic } from '../config/supabase.js';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Provide a valid Bearer token.'
        }
      });
      return;
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token format invalid.'
        }
      });
      return;
    }

    // Verify token with Supabase Auth
    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: error?.message || 'Authentication session has expired or is invalid.'
        }
      });
      return;
    }

    // Attach authenticated user identity
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.role
    };
    req.token = token;

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_VERIFICATION_ERROR',
        message: err?.message || 'Internal error validating authentication credentials.'
      }
    });
  }
}
