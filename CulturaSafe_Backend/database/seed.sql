-- Optional Seed Data for CulturaSafe testing
-- Run this in Supabase SQL editor after creating a test user in Auth.

-- Replace '00000000-0000-0000-0000-000000000000' with your actual test user UUID
DO $$
DECLARE
  test_uid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Only insert if the dummy UUID or user exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_uid) THEN
    -- Seed Belonging
    INSERT INTO public.belongings (user_id, name, item_type, battery_level, last_seen_location_name, last_seen_lat, last_seen_lng)
    VALUES (test_uid, 'Travel Backpack Tag', 'backpack', 88, 'Promenade Beach', 11.9304, 79.8357)
    ON CONFLICT DO NOTHING;

    -- Seed Saved Destinations
    INSERT INTO public.saved_destinations (user_id, destination_id, destination_name, place_type)
    VALUES 
      (test_uid, 'ashram', 'Sri Aurobindo Ashram', 'Spiritual'),
      (test_uid, 'promenade', 'Promenade Beach', 'Seafront')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
