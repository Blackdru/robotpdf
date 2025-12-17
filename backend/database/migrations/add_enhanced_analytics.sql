-- Enhanced Analytics Migration
-- Adds page_category to page_views and creates tool_usage table

-- Add page_category and referrer columns to page_views if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'page_category') THEN
    ALTER TABLE page_views ADD COLUMN page_category TEXT DEFAULT 'other';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'referrer') THEN
    ALTER TABLE page_views ADD COLUMN referrer TEXT DEFAULT 'direct';
  END IF;
END $$;

-- Create index for page_category
CREATE INDEX IF NOT EXISTS idx_page_views_page_category ON page_views(page_category);

-- Tool Usage Table
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tool_usage
CREATE INDEX IF NOT EXISTS idx_tool_usage_visitor_id ON tool_usage(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_used_at ON tool_usage(used_at DESC);

-- Disable RLS for tool_usage (allow public inserts for analytics)
ALTER TABLE tool_usage DISABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE tool_usage IS 'Tracks actual tool usage (when users process files)';
COMMENT ON COLUMN tool_usage.tool_id IS 'Identifier for the tool (e.g., merge-pdf, compress-pdf)';
COMMENT ON COLUMN tool_usage.tool_name IS 'Human-readable tool name';
