-- Create app_contact_submissions table for mobile/app feedback
CREATE TABLE IF NOT EXISTS app_contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(50),
  app_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_contact_status ON app_contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_app_contact_created_at ON app_contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_contact_email ON app_contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_app_contact_app_name ON app_contact_submissions(app_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_app_contact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_contact_updated_at_trigger
BEFORE UPDATE ON app_contact_submissions
FOR EACH ROW
EXECUTE FUNCTION update_app_contact_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE app_contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (public submission)
CREATE POLICY "Allow public insert" ON app_contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Only admins can view all submissions
CREATE POLICY "Allow admin select" ON app_contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can update submissions
CREATE POLICY "Allow admin update" ON app_contact_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment to table
COMMENT ON TABLE app_contact_submissions IS 'Stores contact form submissions from mobile apps and web apps';
