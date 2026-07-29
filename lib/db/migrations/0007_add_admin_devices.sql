-- Create admin_devices table for storing FCM tokens
CREATE TABLE IF NOT EXISTS mawashi_admin_devices (
  id SERIAL PRIMARY KEY,
  fcm_token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_devices_fcm_token ON mawashi_admin_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_admin_devices_is_active ON mawashi_admin_devices(is_active);

-- Add comment
COMMENT ON TABLE mawashi_admin_devices IS 'Stores FCM tokens for admin push notifications';
