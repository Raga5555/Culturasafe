import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const recordLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().positive().optional(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  consentGiven: z.boolean().refine((val: boolean) => val === true, {
    message: 'Explicit user consent is mandatory for storing location history.'
  })
});

export async function recordLocationPoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { latitude, longitude, accuracyMeters, speed, heading, consentGiven } = req.body;

    // Optional server-side throttle check: check timestamp of last recorded point
    const { data: recentPoints } = await client
      .from('location_history')
      .select('recorded_at')
      .eq('user_id', req.user!.id)
      .order('recorded_at', { ascending: false })
      .limit(1);

    if (recentPoints && recentPoints.length > 0) {
      const lastRecorded = new Date(recentPoints[0].recorded_at).getTime();
      const now = Date.now();
      // Throttle: minimum 10 seconds between points to prevent excessive database bloat
      if (now - lastRecorded < 10000) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_THROTTLED',
            message: 'Location point submitted too frequently. Minimum 10 seconds required between writes.'
          }
        });
        return;
      }
    }

    const { data, error } = await client
      .from('location_history')
      .insert({
        user_id: req.user!.id,
        latitude,
        longitude,
        accuracy_meters: accuracyMeters || null,
        speed: speed || null,
        heading: heading || null,
        consent_verified: consentGiven
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'SAVE_FAILED', message: error.message } });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Location point securely recorded.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getLocationHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

    const { data, error } = await client
      .from('location_history')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      res.status(400).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
}

export async function clearLocationHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);

    const { error } = await client
      .from('location_history')
      .delete()
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'All private location history deleted.'
    });
  } catch (err) {
    next(err);
  }
}
