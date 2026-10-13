import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createUserClient } from '../config/supabase.js';

export const syncPayloadSchema = z.object({
  clientSyncId: z.string().min(1),
  clientTimestamp: z.string(),
  savedDestinations: z
    .array(
      z.object({
        destinationId: z.string().min(1),
        destinationName: z.string().min(1),
        placeType: z.string().optional()
      })
    )
    .optional(),
  itineraries: z
    .array(
      z.object({
        id: z.string().optional(),
        destination: z.string().min(1),
        travelDate: z.string().min(4),
        startTime: z.string(),
        endTime: z.string(),
        interests: z.array(z.string()).default([]),
        itineraryData: z.record(z.any()).default({})
      })
    )
    .optional(),
  alertEvents: z
    .array(
      z.object({
        belongingId: z.string().uuid().optional(),
        alertType: z.enum(['separation', 'low_battery', 'reconnected', 'sos']),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        locationName: z.string().optional(),
        createdAt: z.string().optional()
      })
    )
    .optional()
});

export async function syncOfflineData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = createUserClient(req.token!);
    const userId = req.user!.id;
    const { clientSyncId, clientTimestamp, savedDestinations, itineraries, alertEvents } = req.body;

    const summary = {
      destinationsSynced: 0,
      itinerariesSynced: 0,
      alertsSynced: 0,
      errors: [] as string[]
    };

    // 1. Process Saved Destinations (deduplicating using unique_user_saved_dest constraint)
    if (savedDestinations && savedDestinations.length > 0) {
      for (const dest of savedDestinations) {
        const { error } = await client.from('saved_destinations').upsert(
          {
            user_id: userId,
            destination_id: dest.destinationId,
            destination_name: dest.destinationName,
            place_type: dest.placeType || 'attraction'
          },
          { onConflict: 'user_id,destination_id' }
        );

        if (error) {
          summary.errors.push(`Destination ${dest.destinationId}: ${error.message}`);
        } else {
          summary.destinationsSynced++;
        }
      }
    }

    // 2. Process Itineraries (matching on user_id, date, and destination to prevent duplicates)
    if (itineraries && itineraries.length > 0) {
      for (const itin of itineraries) {
        // If an explicit UUID is provided, try update or insert
        if (itin.id && itin.id.includes('-') && itin.id.length >= 32) {
          const { error } = await client.from('itineraries').upsert({
            id: itin.id,
            user_id: userId,
            destination: itin.destination,
            travel_date: itin.travelDate,
            start_time: itin.startTime,
            end_time: itin.endTime,
            interests: itin.interests,
            itinerary_data: itin.itineraryData,
            updated_at: new Date().toISOString()
          });
          if (error) {
            summary.errors.push(`Itinerary ${itin.destination}: ${error.message}`);
          } else {
            summary.itinerariesSynced++;
          }
        } else {
          // Insert new itinerary
          const { error } = await client.from('itineraries').insert({
            user_id: userId,
            destination: itin.destination,
            travel_date: itin.travelDate,
            start_time: itin.startTime,
            end_time: itin.endTime,
            interests: itin.interests,
            itinerary_data: itin.itineraryData
          });
          if (error) {
            summary.errors.push(`Itinerary ${itin.destination}: ${error.message}`);
          } else {
            summary.itinerariesSynced++;
          }
        }
      }
    }

    // 3. Process Alert Events
    if (alertEvents && alertEvents.length > 0) {
      for (const alert of alertEvents) {
        const { error } = await client.from('alert_events').insert({
          user_id: userId,
          belonging_id: alert.belongingId || null,
          alert_type: alert.alertType,
          latitude: alert.latitude || null,
          longitude: alert.longitude || null,
          location_name: alert.locationName || null,
          created_at: alert.createdAt || new Date().toISOString()
        });

        if (error) {
          summary.errors.push(`Alert ${alert.alertType}: ${error.message}`);
        } else {
          summary.alertsSynced++;
        }
      }
    }

    // 4. Record sync log
    await client.from('sync_log').insert({
      user_id: userId,
      client_sync_id: clientSyncId,
      entities_synced: summary,
      client_timestamp: clientTimestamp,
      server_timestamp: new Date().toISOString(),
      status: summary.errors.length > 0 ? 'partial' : 'completed'
    });

    res.status(200).json({
      success: true,
      message: 'Offline synchronization completed.',
      data: {
        clientSyncId,
        serverTimestamp: new Date().toISOString(),
        summary
      }
    });
  } catch (err) {
    next(err);
  }
}
