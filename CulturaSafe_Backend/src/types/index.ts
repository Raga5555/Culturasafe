import { Request } from 'express';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  interests: string[];
  transportMode: string;
  explorationPace: string;
  alertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDestination {
  id: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  placeType: string;
  notes?: string | null;
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  userId: string;
  destination: string;
  travelDate: string;
  startTime: string;
  endTime: string;
  interests: string[];
  itineraryData: any;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Belonging {
  id: string;
  userId: string;
  name: string;
  itemType: 'backpack' | 'wallet' | 'camera' | 'luggage' | 'passport' | 'keys' | 'other';
  tagMacAddress?: string | null;
  tagUuid?: string | null;
  batteryLevel?: number;
  lastSeenAt?: string | null;
  lastSeenLocationName?: string | null;
  lastSeenLat?: number | null;
  lastSeenLng?: number | null;
  isActive: boolean;
  alertOnSeparation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  userId: string;
  belongingId?: string | null;
  alertType: 'separation' | 'low_battery' | 'reconnected' | 'sos';
  severity: 'info' | 'warning' | 'critical';
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  resolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface LocationPoint {
  id?: string;
  userId?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  speed?: number | null;
  heading?: number | null;
  consentVerified?: boolean;
  recordedAt?: string;
}

export interface OfflineSyncPayload {
  clientSyncId: string;
  clientTimestamp: string;
  savedDestinations?: Array<{
    destinationId: string;
    destinationName: string;
    placeType?: string;
  }>;
  itineraries?: Array<{
    id?: string;
    destination: string;
    travelDate: string;
    startTime: string;
    endTime: string;
    interests: string[];
    itineraryData: any;
  }>;
  alertEvents?: Array<{
    belongingId?: string;
    alertType: 'separation' | 'low_battery' | 'reconnected';
    latitude?: number;
    longitude?: number;
    locationName?: string;
    createdAt?: string;
  }>;
}
