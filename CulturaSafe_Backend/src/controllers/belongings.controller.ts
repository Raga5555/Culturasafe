import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const registerBelongingSchema = z.object({
  name: z.string().min(1),
  itemType: z.enum(['backpack', 'wallet', 'camera', 'luggage', 'passport', 'keys', 'other']).default('backpack'),
  tagMacAddress: z.string().optional(),
  tagUuid: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  alertOnSeparation: z.boolean().default(true)
});

export const updateBelongingSchema = z.object({
  name: z.string().min(1).optional(),
  itemType: z.enum(['backpack', 'wallet', 'camera', 'luggage', 'passport', 'keys', 'other']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  lastSeenAt: z.string().optional(),
  lastSeenLocationName: z.string().optional(),
  lastSeenLat: z.number().min(-90).max(90).optional(),
  lastSeenLng: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
  alertOnSeparation: z.boolean().optional()
});

export const recordAlertEventSchema = z.object({
  belongingId: z.string().uuid().optional(),
  alertType: z.enum(['separation', 'low_battery', 'reconnected', 'sos']),
  severity: z.enum(['info', 'warning', 'critical']).default('warning'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().optional()
});

export async function getBelongings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { data, error } = await client
      .from('belongings')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

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

export async function registerBelonging(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { name, itemType, tagMacAddress, tagUuid, batteryLevel, alertOnSeparation } = req.body;

    const { data, error } = await client
      .from('belongings')
      .insert({
        user_id: req.user!.id,
        name,
        item_type: itemType,
        tag_mac_address: tagMacAddress,
        tag_uuid: tagUuid,
        battery_level: batteryLevel ?? 100,
        alert_on_separation: alertOnSeparation ?? true
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'REGISTER_FAILED', message: error.message } });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Belonging tag registered successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBelonging(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { id } = req.params;
    const body = req.body;

    const { data, error } = await client
      .from('belongings')
      .update({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.itemType !== undefined ? { item_type: body.itemType } : {}),
        ...(body.batteryLevel !== undefined ? { battery_level: body.batteryLevel } : {}),
        ...(body.lastSeenAt !== undefined ? { last_seen_at: body.lastSeenAt } : {}),
        ...(body.lastSeenLocationName !== undefined ? { last_seen_location_name: body.lastSeenLocationName } : {}),
        ...(body.lastSeenLat !== undefined ? { last_seen_lat: body.lastSeenLat } : {}),
        ...(body.lastSeenLng !== undefined ? { last_seen_lng: body.lastSeenLng } : {}),
        ...(body.isActive !== undefined ? { is_active: body.isActive } : {}),
        ...(body.alertOnSeparation !== undefined ? { alert_on_separation: body.alertOnSeparation } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Belonging details updated.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBelonging(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { id } = req.params;

    const { error } = await client
      .from('belongings')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Belonging unregistered successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function recordAlertEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { belongingId, alertType, severity, latitude, longitude, locationName } = req.body;

    const { data, error } = await client
      .from('alert_events')
      .insert({
        user_id: req.user!.id,
        belonging_id: belongingId || null,
        alert_type: alertType,
        severity: severity || 'warning',
        latitude: latitude || null,
        longitude: longitude || null,
        location_name: locationName || null,
        resolved: alertType === 'reconnected'
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'ALERT_FAILED', message: error.message } });
      return;
    }

    // If belongingId is provided and location was recorded, update belonging's last_seen info
    if (belongingId && (latitude || locationName)) {
      await client
        .from('belongings')
        .update({
          last_seen_at: new Date().toISOString(),
          last_seen_location_name: locationName || null,
          last_seen_lat: latitude || null,
          last_seen_lng: longitude || null
        })
        .eq('id', belongingId)
        .eq('user_id', req.user!.id);
    }

    res.status(201).json({
      success: true,
      message: 'Belonging alert event recorded.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function getAlertEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const limit = Math.min(parseInt((req.query.limit as string) || '30', 10), 100);

    const { data, error } = await client
      .from('alert_events')
      .select('*, belongings(name, item_type)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
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
