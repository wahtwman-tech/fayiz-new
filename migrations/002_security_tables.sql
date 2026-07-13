-- =============================================================================
-- Security Tables for IP Banning and Login Attempts
-- =============================================================================

-- Table: ip_bans
-- Description: Stores banned IP addresses after failed login attempts
CREATE TABLE IF NOT EXISTS ip_bans (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE, -- IPv4/IPv6
    failed_attempts INTEGER NOT NULL DEFAULT 1,
    banned_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ip_bans_ip_address ON ip_bans(ip_address);
CREATE INDEX idx_ip_bans_banned_until ON ip_bans(banned_until);

-- Table: login_attempts
-- Description: Logs all login attempts for security auditing
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    username VARCHAR(255) NOT NULL,
    success INTEGER NOT NULL DEFAULT 0, -- 0 = failed, 1 = success
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_username ON login_attempts(username);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- Cleanup old login attempts (older than 24 hours) - run periodically
-- This can be called via a cron job or PostgreSQL scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
