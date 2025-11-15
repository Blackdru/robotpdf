-- Visitor Analytics Table
-- This table tracks unique visitors to the tools page only

CREATE TABLE IF NOT EXISTS visitor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL UNIQUE, -- Fingerprint/unique identifier for the visitor
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  referrer TEXT,
  country TEXT,
  city TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_visitor_id ON visitor_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_first_visit ON visitor_analytics(first_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_last_visit ON visitor_analytics(last_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_country ON visitor_analytics(country);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_device_type ON visitor_analytics(device_type);

-- Page Views Table (detailed tracking)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  session_duration INTEGER, -- in seconds
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (visitor_id) REFERENCES visitor_analytics(visitor_id) ON DELETE CASCADE
);

-- Create indexes for page views
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON page_views(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);

-- Function to update last_visit_at and visit_count
CREATE OR REPLACE FUNCTION update_visitor_analytics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_visitor_analytics
  BEFORE UPDATE ON visitor_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_analytics();

-- Comments for documentation
COMMENT ON TABLE visitor_analytics IS 'Tracks unique visitors to the tools page';
COMMENT ON COLUMN visitor_analytics.visitor_id IS 'Unique fingerprint identifier for the visitor';
COMMENT ON COLUMN visitor_analytics.visit_count IS 'Total number of visits by this unique visitor';
COMMENT ON TABLE page_views IS 'Detailed page view tracking for each visitor session';
