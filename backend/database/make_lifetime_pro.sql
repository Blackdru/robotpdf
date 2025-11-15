-- Make ganeshmudiraj7tec@gmail.com a lifetime pro user
-- Run this in your Supabase SQL editor

-- Verify email if not already verified
UPDATE users
SET 
  email_verified = TRUE,
  verified_at = NOW()
WHERE email = 'ganeshmudiraj7tec@gmail.com';

-- Update existing subscription or insert new one
UPDATE subscriptions
SET 
  plan = 'pro',
  status = 'active',
  expires_at = NULL,
  cancel_at_period_end = FALSE,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lifetime}',
    'true'::jsonb
  )
WHERE user_id = (SELECT id FROM users WHERE email = 'ganeshmudiraj7tec@gmail.com');

-- If no subscription exists, insert one
INSERT INTO subscriptions (user_id, plan, status, expires_at, cancel_at_period_end, started_at, metadata)
SELECT 
  id,
  'pro',
  'active',
  NULL,
  FALSE,
  NOW(),
  '{"lifetime": true}'::jsonb
FROM users
WHERE email = 'ganeshmudiraj7tec@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = (SELECT id FROM users WHERE email = 'ganeshmudiraj7tec@gmail.com')
);
