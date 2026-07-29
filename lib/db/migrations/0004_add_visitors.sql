-- Add visitor_id column to orders table
ALTER TABLE mawashi_orders ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);

-- Create visitors table
CREATE TABLE IF NOT EXISTS mawashi_visitors (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(64) UNIQUE NOT NULL,
  first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_orders INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Create index on visitor_id in orders
CREATE INDEX IF NOT EXISTS idx_orders_visitor_id ON mawashi_orders(visitor_id);

-- Create index on visitor_id in visitors
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON mawashi_visitors(visitor_id);

-- Add visitor_id to presence table
ALTER TABLE mawashi_presence ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);
