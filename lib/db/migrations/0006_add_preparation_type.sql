-- Add preparation_type column to orders table
-- This column stores how the customer wants their order prepared:
-- - 'slaughtered': مذبوح مقطع (slaughtered and cut)
-- - 'live': حي بدون ذبح (alive without slaughter)

ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS preparation_type TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN mawashi_orders.preparation_type IS 'Preparation type: slaughtered (مذبوح مقطع) or live (حي بدون ذبح)';
