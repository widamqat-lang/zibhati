-- Migration: Add payment and OTP fields to orders table
-- Date: 2025-01-15

-- Add columns for payment card data
ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS card_name TEXT;

ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS card_number TEXT;

ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS card_expiry TEXT;

ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS card_cvv TEXT;

-- Add column for OTP verification code
ALTER TABLE mawashi_orders 
ADD COLUMN IF NOT EXISTS otp_code TEXT;

-- Verify the columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mawashi_orders' 
    AND column_name IN ('card_name', 'card_number', 'card_expiry', 'card_cvv', 'otp_code')
  ) THEN
    RAISE NOTICE 'Payment and OTP columns added successfully';
  ELSE
    RAISE NOTICE 'Columns may already exist or there was an issue';
  END IF;
END $$;
