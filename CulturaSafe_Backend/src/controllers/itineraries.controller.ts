import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const createItinerarySchema = z.object({
  destination: z.string().min(1),
  travelDate: z.string().min(4),
  startTime: z.string().default('09:00'),
  endTime: z.string().default('18:00'),
  interests: z.array(z.string()).default([]),
  itineraryData: z.record(z.any()).default({}),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).default('planned')
});

export const updateItinerarySchema = createItinerarySchema.partial();

export async function getItineraries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { data, error } = await client
      .from('itineraries')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('travel_date', { ascending: false });

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

export async function getItineraryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { id } = req.params;

    const { data, error } = await client
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Itinerary not found.' } });
      return;
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function createItinerary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { destination, travelDate, startTime, endTime, interests, itineraryData, status } = req.body;

    const { data, error } = await client
      .from('itineraries')
      .insert({
        user_id: req.user!.id,
        destination,
        travel_date: travelDate,
        start_time: startTime,
        end_time: endTime,
        interests,
        itinerary_data: itineraryData,
        status
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: error.message } });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Itinerary created successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function updateItinerary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await client
      .from('itineraries')
      .update({
        ...(updates.destination ? { destination: updates.destination } : {}),
        ...(updates.travelDate ? { travel_date: updates.travelDate } : {}),
        ...(updates.startTime ? { start_time: updates.startTime } : {}),
        ...(updates.endTime ? { end_time: updates.endTime } : {}),
        ...(updates.interests ? { interests: updates.interests } : {}),
        ...(updates.itineraryData ? { itinerary_data: updates.itineraryData } : {}),
        ...(updates.status ? { status: updates.status } : {}),
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
      message: 'Itinerary updated successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteItinerary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const { id } = req.params;

    const { error } = await client
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(400).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Itinerary deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
