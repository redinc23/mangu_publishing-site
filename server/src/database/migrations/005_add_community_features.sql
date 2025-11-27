-- ===================================================================
-- Migration 005: Community Features
-- Description: Add events, book clubs, and blog comments tables
-- ===================================================================

-- Events table for community events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'virtual', -- virtual, in-person, hybrid
    location TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_attendees INTEGER,
    registration_deadline TIMESTAMP,
    cover_image_url TEXT,
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT events_times_valid CHECK (end_time IS NULL OR end_time > start_time),
    CONSTRAINT events_max_attendees_positive CHECK (max_attendees IS NULL OR max_attendees > 0)
);

-- Event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, waitlist
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Book clubs table
CREATE TABLE IF NOT EXISTS book_clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    current_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    max_members INTEGER,
    meeting_schedule TEXT, -- e.g., "Weekly on Wednesdays at 7pm EST"
    next_meeting_at TIMESTAMP,
    rules TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT book_clubs_max_members_positive CHECK (max_members IS NULL OR max_members > 0)
);

-- Book club members
CREATE TABLE IF NOT EXISTS book_club_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, moderator, admin
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(book_club_id, user_id)
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT blog_comments_content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_user_id);
CREATE INDEX IF NOT EXISTS idx_events_public ON events(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

CREATE INDEX IF NOT EXISTS idx_book_clubs_public ON book_clubs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_book_clubs_creator ON book_clubs(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_book_clubs_current_book ON book_clubs(current_book_id);

CREATE INDEX IF NOT EXISTS idx_book_club_members_club ON book_club_members(book_club_id);
CREATE INDEX IF NOT EXISTS idx_book_club_members_user ON book_club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_book_club_members_active ON book_club_members(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(is_approved) WHERE is_approved = true;

-- Update timestamp triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_clubs_updated_at BEFORE UPDATE ON book_clubs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON blog_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON events TO mangu_user;
GRANT ALL PRIVILEGES ON event_registrations TO mangu_user;
GRANT ALL PRIVILEGES ON book_clubs TO mangu_user;
GRANT ALL PRIVILEGES ON book_club_members TO mangu_user;
GRANT ALL PRIVILEGES ON blog_posts TO mangu_user;
GRANT ALL PRIVILEGES ON blog_comments TO mangu_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 005 completed: Community features tables created';
END $$;
