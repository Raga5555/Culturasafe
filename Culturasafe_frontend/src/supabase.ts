/**
 * CulturaSafe - Supabase Integration Client & Services
 * Handles PostgreSQL queries, authentication, session state, and RLS-protected records.
 */
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'culturasafe_supabase_url';
const STORAGE_ANON_KEY = 'culturasafe_supabase_anon_key';

export interface DbProfile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSavedDestination {
  id: string;
  user_id: string;
  destination_id: string;
  destination_name: string;
  created_at: string;
}

export interface DbItinerary {
  id: string;
  user_id: string;
  destination: string;
  travel_date: string;
  start_time: string;
  end_time: string;
  interests: string[];
  itinerary_data: any;
  created_at: string;
  updated_at: string;
}

export interface DbLocationHistory {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  recorded_at: string;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static currentUser: User | null = null;
  private static listeners: Array<(user: User | null) => void> = [];

  /**
   * Resolve current URL and Key from env vars or localStorage overrides
   */
  public static getConfig(): { url: string; key: string; isConfigured: boolean } {
    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
    const localUrl = (localStorage.getItem(STORAGE_URL_KEY) || '').trim();
    const localKey = (localStorage.getItem(STORAGE_ANON_KEY) || '').trim();

    const url = localUrl || envUrl;
    const key = localKey || envKey;

    const isPlaceholder = url.includes('your-project') || key.includes('your-anon-public-key') || !url || !key;
    return {
      url,
      key,
      isConfigured: !isPlaceholder && url.startsWith('http') && key.length > 20
    };
  }

  public static setConfig(url: string, key: string) {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (key) localStorage.setItem(STORAGE_ANON_KEY, key.trim());
    else localStorage.removeItem(STORAGE_ANON_KEY);

    this.client = null;
    this.init();
  }

  public static init(): SupabaseClient | null {
    const { url, key, isConfigured } = this.getConfig();
    if (!isConfigured) {
      this.client = null;
      return null;
    }

    try {
      this.client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      // Listen for auth state changes
      this.client.auth.onAuthStateChange((_event, session) => {
        this.currentUser = session?.user ?? null;
        this.listeners.forEach(cb => cb(this.currentUser));
      });

      // Get current user initial check
      this.client.auth.getUser().then(({ data }) => {
        this.currentUser = data?.user ?? null;
        this.listeners.forEach(cb => cb(this.currentUser));
      }).catch(err => {
        console.warn('Initial auth check notice:', err);
      });

      return this.client;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      this.client = null;
      return null;
    }
  }

  public static getClient(): SupabaseClient | null {
    if (!this.client) {
      this.init();
    }
    return this.client;
  }

  public static isAvailable(): boolean {
    return !!this.getClient();
  }

  public static getCurrentUser(): User | null {
    return this.currentUser;
  }

  public static onAuth(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /* ================= AUTHENTICATION ================= */
  public static async signUp(email: string, pass: string, displayName?: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase is not configured. Please enter your project URL & Anon Key.');

    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) throw error;
    if (data.user) {
      this.currentUser = data.user;
      // Try creating profile row
      try {
        await client.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName || email.split('@')[0],
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Profile auto-insert note:', e);
      }
    }
    return data;
  }

  public static async signIn(email: string, pass: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase is not configured. Please enter your project URL & Anon Key.');

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error) throw error;
    this.currentUser = data.user;
    return data;
  }

  public static async signOut() {
    const client = this.getClient();
    if (client) {
      await client.auth.signOut();
    }
    this.currentUser = null;
    this.listeners.forEach(cb => cb(null));
  }

  /* ================= SAVED DESTINATIONS ================= */
  public static async getSavedDestinations(): Promise<DbSavedDestination[]> {
    const client = this.getClient();
    if (!client || !this.currentUser) return [];

    const { data, error } = await client
      .from('saved_destinations')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getSavedDestinations error:', error.message);
      return [];
    }
    return data || [];
  }

  public static async saveDestination(destId: string, destName: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.currentUser) return false;

    const { error } = await client.from('saved_destinations').upsert(
      {
        user_id: this.currentUser.id,
        destination_id: destId,
        destination_name: destName
      },
      { onConflict: 'user_id,destination_id' }
    );

    if (error) {
      console.warn('Supabase saveDestination error:', error.message);
      return false;
    }
    return true;
  }

  public static async removeSavedDestination(destId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.currentUser) return false;

    const { error } = await client
      .from('saved_destinations')
      .delete()
      .eq('user_id', this.currentUser.id)
      .eq('destination_id', destId);

    if (error) {
      console.warn('Supabase removeSavedDestination error:', error.message);
      return false;
    }
    return true;
  }

  /* ================= ITINERARIES ================= */
  public static async getItineraries(): Promise<DbItinerary[]> {
    const client = this.getClient();
    if (!client || !this.currentUser) return [];

    const { data, error } = await client
      .from('itineraries')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getItineraries error:', error.message);
      return [];
    }
    return data || [];
  }

  public static async saveItinerary(itin: {
    destination: string;
    travel_date: string;
    start_time: string;
    end_time: string;
    interests: string[];
    itinerary_data: any;
  }): Promise<DbItinerary | null> {
    const client = this.getClient();
    if (!client || !this.currentUser) return null;

    const { data, error } = await client
      .from('itineraries')
      .insert({
        user_id: this.currentUser.id,
        destination: itin.destination,
        travel_date: itin.travel_date,
        start_time: itin.start_time,
        end_time: itin.end_time,
        interests: itin.interests,
        itinerary_data: itin.itinerary_data
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase saveItinerary error:', error.message);
      return null;
    }
    return data;
  }

  public static async deleteItinerary(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.currentUser) return false;

    const { error } = await client
      .from('itineraries')
      .delete()
      .eq('id', id)
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.warn('Supabase deleteItinerary error:', error.message);
      return false;
    }
    return true;
  }

  /* ================= LOCATION HISTORY ================= */
  public static async saveLocationPoint(
    lat: number,
    lng: number,
    accuracyMeters: number | null
  ): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.currentUser) return false;

    const { error } = await client.from('location_history').insert({
      user_id: this.currentUser.id,
      latitude: lat,
      longitude: lng,
      accuracy_meters: accuracyMeters
    });

    if (error) {
      console.warn('Supabase saveLocationPoint error:', error.message);
      return false;
    }
    return true;
  }

  public static async getLocationHistory(limit = 30): Promise<DbLocationHistory[]> {
    const client = this.getClient();
    if (!client || !this.currentUser) return [];

    const { data, error } = await client
      .from('location_history')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase getLocationHistory error:', error.message);
      return [];
    }
    return data || [];
  }

  public static async clearLocationHistory(): Promise<boolean> {
    const client = this.getClient();
    if (!client || !this.currentUser) return false;

    const { error } = await client
      .from('location_history')
      .delete()
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.warn('Supabase clearLocationHistory error:', error.message);
      return false;
    }
    return true;
  }
}

// Auto-initialize when file is imported
SupabaseService.init();
