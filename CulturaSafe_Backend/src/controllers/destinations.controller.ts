import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const saveDestinationSchema = z.object({
  destinationId: z.string().min(1),
  destinationName: z.string().min(1),
  placeType: z.string().default('attraction'),
  notes: z.string().optional()
});

export async function getSavedDestinations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { data, error } = await client
      .from('saved_destinations')
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

export async function saveDestination(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { destinationId, destinationName, placeType, notes } = req.body;

    const { data, error } = await client
      .from('saved_destinations')
      .upsert(
        {
          user_id: req.user!.id,
          destination_id: destinationId,
          destination_name: destinationName,
          place_type: placeType,
          notes
        },
        { onConflict: 'user_id,destination_id' }
      )
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'SAVE_FAILED', message: error.message } });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Destination saved to favourites.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedDestination(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { destinationId } = req.params;

    const { error } = await client
      .from('saved_destinations')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('destination_id', destinationId);

    if (error) {
      res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Destination removed from favourites.'
    });
  } catch (err) {
    next(err);
  }
}
