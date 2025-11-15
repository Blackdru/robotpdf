-- Developer API Schema for RobotPDF
-- Run this in your Supabase SQL editor after schema.sql

-- Developers table
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer usage tracking
CREATE TABLE IF NOT EXISTS developer_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL CHECK (tool_name IN (
        'ocr_pro',
        'chat_pdf',
        'summarize',
        'compress',
        'images_to_pdf',
        'pdf_to_docx',
        'pdf_to_excel',
        'pdf_to_ppt',
        'merge_pdf',
        'split_pdf'
    )),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(developer_id, tool_name)
);

-- Developer limits (quota management)
CREATE TABLE IF NOT EXISTS developer_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL UNIQUE REFERENCES developers(id) ON DELETE CASCADE,
    monthly_limit INTEGER DEFAULT 1000,
    current_month_used INTEGER DEFAULT 0,
    current_month VARCHAR(7) NOT NULL,
    rate_limit_per_minute INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer API logs (for debugging and auditing)
CREATE TABLE IF NOT EXISTS developer_api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_developers_api_key ON developers(api_key);
CREATE INDEX IF NOT EXISTS idx_developers_is_active ON developers(is_active);
CREATE INDEX IF NOT EXISTS idx_developer_usage_developer_id ON developer_usage(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_usage_tool_name ON developer_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_developer_limits_developer_id ON developer_limits(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_logs_developer_id ON developer_api_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_logs_created_at ON developer_api_logs(created_at DESC);

-- Updated_at triggers
CREATE TRIGGER update_developers_updated_at 
    BEFORE UPDATE ON developers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_usage_updated_at 
    BEFORE UPDATE ON developer_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_limits_updated_at 
    BEFORE UPDATE ON developer_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly usage (run via cron job monthly)
CREATE OR REPLACE FUNCTION reset_monthly_developer_limits()
RETURNS void AS $$
DECLARE
    current_month_str VARCHAR(7);
BEGIN
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    
    UPDATE developer_limits
    SET 
        current_month_used = 0,
        current_month = current_month_str,
        updated_at = NOW()
    WHERE current_month != current_month_str;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage and check limits
CREATE OR REPLACE FUNCTION increment_developer_usage(
    p_developer_id UUID,
    p_tool_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_limit INTEGER;
    v_current_used INTEGER;
    v_current_month VARCHAR(7);
    v_result JSONB;
BEGIN
    v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current limits
    SELECT monthly_limit, current_month_used, current_month
    INTO v_limit, v_current_used, v_current_month
    FROM developer_limits
    WHERE developer_id = p_developer_id;
    
    -- If no limit record exists, create one with defaults
    IF NOT FOUND THEN
        INSERT INTO developer_limits (developer_id, monthly_limit, current_month_used, current_month)
        VALUES (p_developer_id, 1000, 0, v_current_month)
        RETURNING monthly_limit, current_month_used INTO v_limit, v_current_used;
    END IF;
    
    -- Reset if new month
    IF v_current_month != v_current_month THEN
        UPDATE developer_limits
        SET current_month_used = 0, current_month = v_current_month
        WHERE developer_id = p_developer_id;
        v_current_used := 0;
    END IF;
    
    -- Check if limit exceeded
    IF v_current_used >= v_limit THEN
        v_result := jsonb_build_object(
            'allowed', false,
            'limit', v_limit,
            'used', v_current_used,
            'remaining', 0
        );
        RETURN v_result;
    END IF;
    
    -- Increment usage
    UPDATE developer_limits
    SET current_month_used = current_month_used + 1
    WHERE developer_id = p_developer_id;
    
    -- Update tool-specific usage
    INSERT INTO developer_usage (developer_id, tool_name, usage_count, last_used_at)
    VALUES (p_developer_id, p_tool_name, 1, NOW())
    ON CONFLICT (developer_id, tool_name)
    DO UPDATE SET 
        usage_count = developer_usage.usage_count + 1,
        last_used_at = NOW();
    
    v_result := jsonb_build_object(
        'allowed', true,
        'limit', v_limit,
        'used', v_current_used + 1,
        'remaining', v_limit - v_current_used - 1
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (disable for now, API key auth is enough)
ALTER TABLE developers DISABLE ROW LEVEL SECURITY;
ALTER TABLE developer_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE developer_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE developer_api_logs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON developers TO authenticated, service_role;
GRANT ALL ON developer_usage TO authenticated, service_role;
GRANT ALL ON developer_limits TO authenticated, service_role;
GRANT ALL ON developer_api_logs TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_developer_usage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reset_monthly_developer_limits TO authenticated, service_role;

-- Sample developer for testing (you can remove this in production)
-- INSERT INTO developers (name, email, api_key, api_secret, is_active)
-- VALUES (
--     'Test Developer',
--     'dev@example.com',
--     'pk_test_' || encode(gen_random_bytes(32), 'base64'),
--     'sk_test_' || encode(gen_random_bytes(48), 'base64'),
--     true
-- );
