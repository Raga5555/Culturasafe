import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabasePublic, createUserClient } from '../config/supabase.js';
import { AuthenticatedRequest } from '../types/index.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, displayName } = req.body;

    const { data, error } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: error.message }
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          displayName: displayName || email.split('@')[0]
        },
        session: data.session
          ? {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresAt: data.session.expires_at
            }
          : null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: error?.message || 'Invalid email or password.' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0]
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.token) {
      const client = createUserClient(req.token);
      await client.auth.signOut();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || !req.token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated.' }
      });
      return;
    }

    const client = createUserClient(req.token);
    const { data: profile } = await client
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        profile: profile || null
      }
    });
  } catch (err) {
    next(err);
  }
}
