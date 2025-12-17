-- Database setup for Bank Transfer Payment Feature
-- Run this SQL in your Supabase SQL Editor

-- 1. Create organization_settings table for storing bank account details
CREATE TABLE IF NOT EXISTS organization_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on id
CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_id_idx ON organization_settings(id);

-- 2. Create pending_redemptions table for tracking bank transfer orders
CREATE TABLE IF NOT EXISTS pending_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  member_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
  coupon_code TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS pending_redemptions_order_id_idx ON pending_redemptions(order_id);
CREATE INDEX IF NOT EXISTS pending_redemptions_member_id_idx ON pending_redemptions(member_id);
CREATE INDEX IF NOT EXISTS pending_redemptions_status_idx ON pending_redemptions(status);
CREATE INDEX IF NOT EXISTS pending_redemptions_created_at_idx ON pending_redemptions(created_at);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization_settings (public read, admin write)
CREATE POLICY "Anyone can read organization settings"
  ON organization_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update organization settings"
  ON organization_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users."supabaseUserId"::text = auth.uid()::text
      AND users.role = 'ADMIN' -- Adjust based on your role system
    )
  );

-- Create RLS policies for pending_redemptions
-- Users can read their own pending redemptions
CREATE POLICY "Users can read own pending redemptions"
  ON pending_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = pending_redemptions.member_id
      AND members."userId" IN (
        SELECT id FROM users WHERE "supabaseUserId"::text = auth.uid()::text
      )
    )
  );

-- Users can create their own pending redemptions
CREATE POLICY "Users can create own pending redemptions"
  ON pending_redemptions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = pending_redemptions.member_id
      AND members."userId" IN (
        SELECT id FROM users WHERE "supabaseUserId"::text = auth.uid()::text
      )
    )
  );

-- Admins can read and update all pending redemptions
CREATE POLICY "Admins can manage all pending redemptions"
  ON pending_redemptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users."supabaseUserId"::text = auth.uid()::text
      AND users.role = 'ADMIN' -- Adjust based on your role system
    )
  );
