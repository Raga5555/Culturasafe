-- ====================================================================
-- CulturaSafe Backend Database Schema & Row Level Security (RLS)
-- Target Platform: Supabase PostgreSQL
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  transport_mode TEXT DEFAULT 'walking',
  exploration_pace TEXT DEFAULT 'moderate',
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 3. SAVED DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  place_type TEXT DEFAULT 'attraction',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_saved_dest UNIQUE (user_id, destination_id)
);

-- 4. ITINERARIES TABLE
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  travel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  itinerary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BELONGINGS & BLE TRACKING TAGS
-- Stores registered belongings metadata and paired BLE tag configurations.
-- Note: Real BLE separation detection is performed locally by user's client hardware.
CREATE TABLE IF NOT EXISTS public.belongings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'backpack' CHECK (item_type IN ('backpack', 'wallet', 'camera', 'luggage', 'passport', 'keys', 'other')),
  tag_mac_address TEXT,
  tag_uuid TEXT,
  battery_level INTEGER DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  last_seen_at TIMESTAMPTZ,
  last_seen_location_name TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_on_separation BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ALERT EVENTS
-- Audit log of separation, low battery, and reconnection events logged from client devices.
CREATE TABLE IF NOT EXISTS public.alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  belonging_id UUID REFERENCES public.belongings(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('separation', 'low_battery', 'reconnected', 'sos')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. LOCATION HISTORY (Strictly consent-based opt-in only)
CREATE TABLE IF NOT EXISTS public.location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  consent_verified BOOLEAN NOT NULL DEFAULT true,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. OFFLINE SYNC LOG
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_sync_id TEXT,
  entities_synced JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'completed'
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_dest_user ON public.saved_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user ON public.itineraries(user_id, travel_date DESC);
CREATE INDEX IF NOT EXISTS idx_belongings_user ON public.belongings(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_user ON public.alert_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_history_user_time ON public.location_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_user ON public.sync_log(user_id, server_timestamp DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Authenticated users can only view and mutate their own data.
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belongings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User Preferences Policies
DROP POLICY IF EXISTS "preferences_select_own" ON public.user_preferences;
CREATE POLICY "preferences_select_own" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_insert_own" ON public.user_preferences;
CREATE POLICY "preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_update_own" ON public.user_preferences;
CREATE POLICY "preferences_update_own" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved Destinations Policies
DROP POLICY IF EXISTS "saved_dest_select_own" ON public.saved_destinations;
CREATE POLICY "saved_dest_select_own" ON public.saved_destinations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_dest_insert_own" ON public.saved_destinations;
CREATE POLICY "saved_dest_insert_own" ON public.saved_destinations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_dest_delete_own" ON public.saved_destinations;
CREATE POLICY "saved_dest_delete_own" ON public.saved_destinations FOR DELETE USING (auth.uid() = user_id);

-- Itineraries Policies
DROP POLICY IF EXISTS "itineraries_select_own" ON public.itineraries;
CREATE POLICY "itineraries_select_own" ON public.itineraries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_insert_own" ON public.itineraries;
CREATE POLICY "itineraries_insert_own" ON public.itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_update_own" ON public.itineraries;
CREATE POLICY "itineraries_update_own" ON public.itineraries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "itineraries_delete_own" ON public.itineraries;
CREATE POLICY "itineraries_delete_own" ON public.itineraries FOR DELETE USING (auth.uid() = user_id);

-- Belongings Policies
DROP POLICY IF EXISTS "belongings_select_own" ON public.belongings;
CREATE POLICY "belongings_select_own" ON public.belongings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "belongings_insert_own" ON public.belongings;
CREATE POLICY "belongings_insert_own" ON public.belongings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "belongings_update_own" ON public.belongings;
CREATE POLICY "belongings_update_own" ON public.belongings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "belongings_delete_own" ON public.belongings;
CREATE POLICY "belongings_delete_own" ON public.belongings FOR DELETE USING (auth.uid() = user_id);

-- Alert Events Policies
DROP POLICY IF EXISTS "alert_events_select_own" ON public.alert_events;
CREATE POLICY "alert_events_select_own" ON public.alert_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alert_events_insert_own" ON public.alert_events;
CREATE POLICY "alert_events_insert_own" ON public.alert_events FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "alert_events_update_own" ON public.alert_events;
CREATE POLICY "alert_events_update_own" ON public.alert_events FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Location History Policies
DROP POLICY IF EXISTS "loc_hist_select_own" ON public.location_history;
CREATE POLICY "loc_hist_select_own" ON public.location_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "loc_hist_insert_own" ON public.location_history;
CREATE POLICY "loc_hist_insert_own" ON public.location_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "loc_hist_delete_own" ON public.location_history;
CREATE POLICY "loc_hist_delete_own" ON public.location_history FOR DELETE USING (auth.uid() = user_id);

-- Sync Log Policies
DROP POLICY IF EXISTS "sync_log_select_own" ON public.sync_log;
CREATE POLICY "sync_log_select_own" ON public.sync_log FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sync_log_insert_own" ON public.sync_log;
CREATE POLICY "sync_log_insert_own" ON public.sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Automatic New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_culturasafe_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id, interests)
  VALUES (new.id, ARRAY['heritage', 'culture', 'beaches'])
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_culturasafe_user();
