-- =====================================================
-- VOICE TODO APP - COMPREHENSIVE DATABASE SCHEMA
-- =====================================================
-- PostgreSQL Database Schema for Enterprise-Scale Voice Todo App
-- Designed for scalability, security, and analytics

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =====================================================
-- USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- User accounts table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- GDPR compliance
    data_retention_until TIMESTAMP WITH TIME ZONE,
    consent_version INTEGER DEFAULT 1,
    marketing_consent BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User preferences and AI personality settings
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Voice settings
    voice_enabled BOOLEAN DEFAULT TRUE,
    voice_language VARCHAR(10) DEFAULT 'en-US',
    voice_speed DECIMAL(3,2) DEFAULT 1.0,
    voice_pitch DECIMAL(3,2) DEFAULT 1.0,
    preferred_voice VARCHAR(100),
    
    -- AI personality
    ai_personality VARCHAR(50) DEFAULT 'helpful', -- helpful, friendly, professional, casual
    ai_response_style VARCHAR(50) DEFAULT 'concise', -- concise, detailed, motivational
    ai_name VARCHAR(50) DEFAULT 'Assistant',
    
    -- UI preferences
    theme VARCHAR(20) DEFAULT 'system', -- light, dark, system
    default_priority VARCHAR(10) DEFAULT 'medium',
    auto_complete_suggestions BOOLEAN DEFAULT TRUE,
    show_completed_tasks BOOLEAN DEFAULT TRUE,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    reminder_notifications BOOLEAN DEFAULT TRUE,
    
    -- Privacy settings
    data_sharing_analytics BOOLEAN DEFAULT FALSE,
    data_sharing_improvements BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- =====================================================
-- CORE TODO FUNCTIONALITY
-- =====================================================

-- Categories for organizing todos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT FALSE, -- System-defined categories
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, name)
);

-- Main todos table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Core todo data
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    reminder_at TIMESTAMP WITH TIME ZONE,
    
    -- Voice interaction metadata
    created_via VARCHAR(20) DEFAULT 'manual' CHECK (created_via IN ('manual', 'voice', 'import', 'api')),
    voice_confidence DECIMAL(3,2), -- Speech recognition confidence
    original_voice_text TEXT, -- Original voice command
    
    -- Collaboration
    shared_with UUID[] DEFAULT '{}', -- Array of user IDs
    assigned_to UUID REFERENCES users(id),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    location JSONB, -- Geographic location when created
    attachments JSONB DEFAULT '[]', -- File attachments metadata
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector TSVECTOR,
    
    -- Constraints
    CONSTRAINT todos_due_date_check CHECK (due_date > created_at),
    CONSTRAINT todos_reminder_check CHECK (reminder_at <= due_date OR reminder_at IS NULL)
);

-- Todo subtasks for breaking down complex tasks
CREATE TABLE todo_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Todo activity log for tracking changes
CREATE TABLE todo_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- created, updated, completed, deleted, shared, etc.
    changes JSONB, -- What changed (old_value, new_value, field)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- VOICE INTERACTION ANALYTICS
-- =====================================================

-- Voice interaction sessions
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    total_commands INTEGER DEFAULT 0,
    successful_commands INTEGER DEFAULT 0,
    failed_commands INTEGER DEFAULT 0,
    average_confidence DECIMAL(3,2),
    device_info JSONB,
    location JSONB
);

-- Individual voice commands
CREATE TABLE voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
    
    -- Voice data
    original_text TEXT NOT NULL,
    processed_text TEXT,
    confidence DECIMAL(3,2),
    language VARCHAR(10),
    
    -- Command processing
    command_type VARCHAR(50), -- add, complete, delete, edit, list, etc.
    command_success BOOLEAN DEFAULT FALSE,
    processing_time_ms INTEGER,
    
    -- Audio metadata (if stored)
    audio_duration_ms INTEGER,
    audio_file_url TEXT,
    
    -- Context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    context_data JSONB -- Additional context like current todos, etc.
);

-- =====================================================
-- TEAM COLLABORATION
-- =====================================================

-- Teams/workspaces
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(team_id, user_id)
);

-- Shared todo lists
CREATE TABLE shared_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{"read": true, "write": true, "delete": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INTEGRATIONS & EXTERNAL SERVICES
-- =====================================================

-- Connected integrations (Google Calendar, Slack, etc.)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- google_calendar, slack, notion, etc.
    service_user_id VARCHAR(255),
    access_token TEXT, -- Encrypted
    refresh_token TEXT, -- Encrypted
    token_expires_at TIMESTAMP WITH TIME ZONE,
    integration_data JSONB, -- Service-specific configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, service_name)
);

-- Sync events for external integrations
CREATE TABLE sync_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- created, updated, deleted, synced
    external_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- NOTIFICATIONS & REMINDERS
-- =====================================================

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    
    -- Notification content
    type VARCHAR(50) NOT NULL, -- reminder, deadline, shared, completed, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,
    action_url TEXT,
    
    -- Delivery
    channels VARCHAR(50)[] DEFAULT '{}', -- email, push, sms, voice
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed', 'cancelled')),
    
    -- Metadata
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYTICS & REPORTING
-- =====================================================

-- User activity analytics
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Task metrics
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_deleted INTEGER DEFAULT 0,
    
    -- Voice metrics
    voice_commands_total INTEGER DEFAULT 0,
    voice_commands_successful INTEGER DEFAULT 0,
    voice_session_duration_seconds INTEGER DEFAULT 0,
    
    -- Engagement metrics
    session_count INTEGER DEFAULT 0,
    total_session_duration_seconds INTEGER DEFAULT 0,
    features_used TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, date)
);

-- System-wide analytics
CREATE TABLE system_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- User metrics
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    premium_users INTEGER DEFAULT 0,
    
    -- Usage metrics
    total_todos INTEGER DEFAULT 0,
    todos_created INTEGER DEFAULT 0,
    todos_completed INTEGER DEFAULT 0,
    voice_commands_total INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    error_rate DECIMAL(5,4) DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(date)
);

-- =====================================================
-- AUDIT & COMPLIANCE
-- =====================================================

-- Security audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data processing log for GDPR compliance
CREATE TABLE data_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    processing_type VARCHAR(50) NOT NULL, -- export, delete, anonymize, etc.
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT, -- For data exports
    error_message TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Todo indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_category_id ON todos(category_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_reminder_at ON todos(reminder_at);
CREATE INDEX idx_todos_is_deleted ON todos(is_deleted);
CREATE INDEX idx_todos_search_vector ON todos USING GIN(search_vector);
CREATE INDEX idx_todos_tags ON todos USING GIN(tags);

-- Voice command indexes
CREATE INDEX idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX idx_voice_commands_session_id ON voice_commands(session_id);
CREATE INDEX idx_voice_commands_created_at ON voice_commands(created_at);
CREATE INDEX idx_voice_commands_command_type ON voice_commands(command_type);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);
CREATE INDEX idx_system_analytics_date ON system_analytics(date);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_delivery_status ON notifications(delivery_status);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector trigger for todos
CREATE OR REPLACE FUNCTION update_todo_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_search_vector BEFORE INSERT OR UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_todo_search_vector();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Default categories
INSERT INTO categories (id, user_id, name, color, is_system, sort_order) VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Personal', '#3B82F6', TRUE, 1),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Work', '#10B981', TRUE, 2),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Shopping', '#F59E0B', TRUE, 3),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Health', '#EF4444', TRUE, 4),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Learning', '#8B5CF6', TRUE, 5);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active todos with category info
CREATE VIEW active_todos AS
SELECT 
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.priority,
    t.status,
    t.created_at,
    t.updated_at,
    t.due_date,
    t.reminder_at,
    c.name as category_name,
    c.color as category_color,
    t.tags,
    t.created_via
FROM todos t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.is_deleted = FALSE AND t.status != 'cancelled';

-- User statistics view
CREATE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    COUNT(t.id) as total_todos,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_todos,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_todos,
    COUNT(CASE WHEN t.created_via = 'voice' THEN 1 END) as voice_created_todos,
    MAX(t.created_at) as last_todo_created
FROM users u
LEFT JOIN todos t ON u.id = t.user_id AND t.is_deleted = FALSE
GROUP BY u.id, u.email, u.created_at;

-- Voice command success rate view
CREATE VIEW voice_command_stats AS
SELECT 
    vc.user_id,
    DATE(vc.created_at) as date,
    COUNT(*) as total_commands,
    COUNT(CASE WHEN vc.command_success = TRUE THEN 1 END) as successful_commands,
    AVG(vc.confidence) as avg_confidence,
    AVG(vc.processing_time_ms) as avg_processing_time
FROM voice_commands vc
GROUP BY vc.user_id, DATE(vc.created_at);