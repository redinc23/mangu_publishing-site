-- ===================================================================
-- MANGU Publishing Database Schema
-- Version: 2.0.0
-- Description: Complete database schema with proper constraints,
--              indexes, and sample data
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create application user
CREATE USER mangu_user WITH PASSWORD 'MxiXcjyvHot7BjuMuwUlmbYLqmv79jlH';
GRANT ALL PRIVILEGES ON DATABASE mangu_db TO mangu_user;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE book_format AS ENUM ('ebook', 'audiobook', 'physical');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');

-- Users table (supplements Cognito)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$')
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    photo_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    birth_date DATE,
    nationality VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    founded_year INTEGER,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table (enhanced)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    isbn VARCHAR(20) UNIQUE,
    description TEXT,
    publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
    publication_date DATE,
    language VARCHAR(10) DEFAULT 'en',
    page_count INTEGER,
    word_count INTEGER,
    reading_time_minutes INTEGER,
    cover_url TEXT,
    sample_url TEXT,
    format book_format DEFAULT 'ebook',
    price_cents INTEGER DEFAULT 0,
    original_price_cents INTEGER,
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_new_release BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    sale_ends_at TIMESTAMP,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT books_price_positive CHECK (price_cents >= 0),
    CONSTRAINT books_pages_positive CHECK (page_count > 0 OR page_count IS NULL),
    CONSTRAINT books_isbn_format CHECK (isbn IS NULL OR isbn ~* '^(978|979)?[0-9]{9}[0-9X]$')
);

-- Book authors junction table (many-to-many)
CREATE TABLE IF NOT EXISTS book_authors (
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'author', -- author, illustrator, editor, translator
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (book_id, author_id, role)
);

-- Book categories junction table (many-to-many)
CREATE TABLE IF NOT EXISTS book_categories (
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (book_id, category_id)
);

-- User library (enhanced)
CREATE TABLE IF NOT EXISTS user_library (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percent DECIMAL(5,2) DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    last_read_at TIMESTAMP,
    reading_time_minutes INTEGER DEFAULT 0,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    review_public BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, book_id)
);

-- Reading sessions for analytics
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    pages_read INTEGER DEFAULT 0,
    progress_start DECIMAL(5,2) DEFAULT 0,
    progress_end DECIMAL(5,2) DEFAULT 0,
    device_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT
);

-- Shopping cart (enhanced)
CREATE TABLE IF NOT EXISTS cart (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id)
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wishlist_id, book_id)
);

-- Orders and payments (enhanced)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    tax_cents INTEGER DEFAULT 0 CHECK (tax_cents >= 0),
    discount_cents INTEGER DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    billing_address JSONB,
    payment_metadata JSONB DEFAULT '{}',
    notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Comprehensive indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription ON users(subscription_tier);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_title_gin ON books USING gin(title gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_featured ON books(is_featured) WHERE is_featured = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_bestseller ON books(is_bestseller) WHERE is_bestseller = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_new_release ON books(is_new_release) WHERE is_new_release = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_rating ON books(rating DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_price ON books(price_cents);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_publication_date ON books(publication_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_active ON books(is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_categories_book ON book_categories(book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_categories_category ON book_categories(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_authors_book ON book_authors(book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_book_authors_author ON book_authors(author_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_library_book ON user_library(book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_library_favorite ON user_library(user_id) WHERE is_favorite = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_updated ON cart(updated_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_book ON reviews(book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_sessions_user_book ON reading_sessions(user_id, book_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(started_at DESC);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sample data
DO $$
BEGIN
    -- Insert categories
    INSERT INTO categories (name, slug, description) VALUES
    ('Science Fiction', 'science-fiction', 'Futuristic and speculative fiction'),
    ('Fantasy', 'fantasy', 'Magical and mythical stories'),
    ('Thriller', 'thriller', 'Suspenseful and exciting stories'),
    ('Romance', 'romance', 'Love and relationship stories'),
    ('Mystery', 'mystery', 'Crime and detective stories'),
    ('Biography', 'biography', 'Life stories of real people'),
    ('History', 'history', 'Historical accounts and stories'),
    ('Technology', 'technology', 'Books about technology and innovation')
    ON CONFLICT (slug) DO NOTHING;

    -- Insert sample publishers
    INSERT INTO publishers (name, description, website_url, founded_year, country) VALUES
    ('Future Press', 'Publisher of science fiction and fantasy novels', 'https://futurepress.com', 1995, 'USA'),
    ('Mystic Books', 'Specializing in fantasy and magical realism', 'https://mysticbooks.com', 2001, 'UK'),
    ('TechnoLit', 'Technology and innovation focused publishing', 'https://technolit.com', 2010, 'Canada')
    ON CONFLICT (name) DO NOTHING;

    -- Insert sample authors
    INSERT INTO authors (name, bio, nationality) VALUES
    ('Elena Vasquez', 'Acclaimed science fiction author known for her exploration of quantum mechanics in fiction', 'Spanish'),
    ('Marcus Chen', 'Former cybersecurity expert turned thriller novelist', 'Canadian'),
    ('Sarah Kim', 'Fantasy author with a background in astronomy', 'Korean-American'),
    ('James Rodriguez', 'Bestselling romance novelist', 'Mexican-American'),
    ('Lisa Wang', 'Mystery writer and former detective', 'Chinese-American')
    ON CONFLICT DO NOTHING;

    -- Insert sample books with enhanced data
    INSERT INTO books (
        title, subtitle, description, publication_date, language, page_count, 
        reading_time_minutes, cover_url, price_cents, original_price_cents,
        is_featured, is_bestseller, rating, rating_count, tags
    ) VALUES
    (
        'The Quantum Garden',
        'A Journey Through Parallel Realities',
        'A mind-bending journey through parallel realities where quantum mechanics meets human consciousness. Dr. Sarah Chen discovers that her research into quantum entanglement has opened doorways to infinite versions of herself across the multiverse.',
        '2024-03-15',
        'en',
        342,
        280,
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
        1299,
        1599,
        true,
        true,
        4.8,
        1247,
        ARRAY['science-fiction', 'quantum-physics', 'multiverse', 'consciousness']
    ),
    (
        'Digital Shadows',
        'A Cybersecurity Thriller',
        'A cybersecurity expert uncovers a conspiracy that threatens the global digital infrastructure. When Alex Morgan discovers a backdoor in critical systems, they must race against time to prevent a digital apocalypse.',
        '2024-01-20',
        'en',
        298,
        240,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        999,
        1199,
        false,
        true,
        4.6,
        892,
        ARRAY['thriller', 'cybersecurity', 'technology', 'conspiracy']
    ),
    (
        'The Last Observatory',
        'Where Magic Meets Science',
        'In a world where magic is dying, one astronomer holds the key to saving both science and sorcery. Luna Blackwood must bridge two worlds before both are lost forever.',
        '2023-11-10',
        'en',
        456,
        380,
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
        1499,
        null,
        true,
        false,
        4.9,
        2156,
        ARRAY['fantasy', 'magic', 'astronomy', 'science']
    ),
    (
        'Hearts in Silicon Valley',
        'A Tech Romance',
        'When startup founder Maya Patel clashes with venture capitalist David Chen, sparks fly in more ways than one. A modern romance set against the backdrop of Silicon Valley''s competitive tech scene.',
        '2024-02-14',
        'en',
        312,
        250,
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop',
        899,
        1099,
        false,
        false,
        4.4,
        634,
        ARRAY['romance', 'technology', 'startup', 'silicon-valley']
    ),
    (
        'The Algorithm Murder',
        'A Digital Age Mystery',
        'Detective Rachel Torres must solve a murder where the only witness is an AI algorithm. As she delves deeper, she questions whether artificial intelligence can be trusted to deliver justice.',
        '2024-04-01',
        'en',
        378,
        310,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        1199,
        null,
        false,
        false,
        4.3,
        445,
        ARRAY['mystery', 'artificial-intelligence', 'crime', 'technology']
    )
    ON CONFLICT (isbn) DO NOTHING;

    -- Grant permissions to mangu_user
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mangu_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mangu_user;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO mangu_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mangu_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mangu_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO mangu_user;
END $$;
