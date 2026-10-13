import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
  emergencyContact: z.string().optional()
});

export const updatePreferencesSchema = z.object({
  interests: z.array(z.string()).default([]),
  transportMode: z.string().optional(),
  explorationPace: z.string().optional(),
  alertsEnabled: z.boolean().optional()
});

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      res.status(400).json({ success: false, error: { code: 'PROFILE_FETCH_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      data: data || { id: req.user!.id, display_name: null }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { displayName, avatarUrl, phone, emergencyContact } = req.body;

    const { data, error } = await client
      .from('profiles')
      .upsert({
        id: req.user!.id,
        display_name: displayName,
        avatar_url: avatarUrl,
        phone,
        emergency_contact: emergencyContact,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'PROFILE_UPDATE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { data, error } = await client
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user!.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      res.status(400).json({ success: false, error: { code: 'PREFERENCES_FETCH_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      data: data || {
        user_id: req.user!.id,
        interests: ['heritage', 'culture', 'beaches'],
        transport_mode: 'walking',
        exploration_pace: 'moderate',
        alerts_enabled: true
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { interests, transportMode, explorationPace, alertsEnabled } = req.body;

    const { data, error } = await client
      .from('user_preferences')
      .upsert(
        {
          user_id: req.user!.id,
          interests: interests || [],
          transport_mode: transportMode || 'walking',
          exploration_pace: explorationPace || 'moderate',
          alerts_enabled: alertsEnabled ?? true,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'PREFERENCES_UPDATE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}
