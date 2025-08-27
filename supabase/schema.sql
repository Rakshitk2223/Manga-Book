-- Supabase Database Schema for Manga-Book App
-- This script creates all necessary tables with proper relationships and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE reading_status AS ENUM ('plan-to-read', 'reading', 'completed', 'dropped', 'on-hold');
CREATE TYPE content_rating AS ENUM ('G', 'PG', 'PG-13', 'R', 'R+');

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User preferences
    theme VARCHAR(20) DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    items_per_page INTEGER DEFAULT 20 CHECK (items_per_page BETWEEN 10 AND 100),
    content_filters content_rating[] DEFAULT ARRAY['G', 'PG', 'PG-13']::content_rating[],
    
    -- Privacy settings
    profile_public BOOLEAN DEFAULT false,
    lists_public BOOLEAN DEFAULT false,
    show_reading_progress BOOLEAN DEFAULT true
);

-- =============================================
-- MANGA CATEGORIES TABLE
-- =============================================
CREATE TABLE public.manga_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name) -- Prevent duplicate category names per user
);

-- =============================================
-- MANGA LISTS TABLE
-- =============================================
CREATE TABLE public.manga_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.manga_categories(id) ON DELETE CASCADE NOT NULL,
    
    -- Manga information (from Jikan API)
    mal_id INTEGER, -- MyAnimeList ID
    title VARCHAR(500) NOT NULL,
    title_english VARCHAR(500),
    title_japanese VARCHAR(500),
    author VARCHAR(200),
    status VARCHAR(50), -- publishing, completed, etc.
    genres TEXT[], -- Array of genre names
    themes TEXT[], -- Array of theme names
    demographics TEXT[], -- Array of demographic names
    
    -- Manga metadata
    type VARCHAR(50), -- manga, novel, light_novel, etc.
    chapters INTEGER,
    volumes INTEGER,
    score DECIMAL(3,2), -- MAL score
    scored_by INTEGER, -- Number of users who scored it
    rank INTEGER, -- MAL rank
    popularity INTEGER, -- MAL popularity rank
    
    -- URLs and images
    image_url TEXT,
    image_url_large TEXT,
    trailer_url TEXT,
    url TEXT, -- MAL URL
    
    -- Dates
    published_from DATE,
    published_to DATE,
    
    -- Content info
    synopsis TEXT,
    background TEXT,
    content_rating content_rating DEFAULT 'PG',
    
    -- User-specific data
    user_rating DECIMAL(3,1) CHECK (user_rating BETWEEN 1.0 AND 10.0),
    user_notes TEXT,
    user_tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    
    -- Tracking
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, mal_id) -- Prevent duplicate manga per user
);

-- =============================================
-- READING PROGRESS TABLE
-- =============================================
CREATE TABLE public.reading_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    manga_list_id UUID REFERENCES public.manga_lists(id) ON DELETE CASCADE NOT NULL,
    
    -- Reading status and progress
    status reading_status DEFAULT 'plan-to-read',
    chapters_read INTEGER DEFAULT 0 CHECK (chapters_read >= 0),
    volumes_read INTEGER DEFAULT 0 CHECK (volumes_read >= 0),
    
    -- Progress tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Reading dates
    start_date DATE,
    finish_date DATE,
    last_read_date DATE,
    
    -- Reading sessions for analytics
    total_reading_time_minutes INTEGER DEFAULT 0,
    reading_sessions INTEGER DEFAULT 0,
    
    -- Notes and bookmarks
    current_chapter_notes TEXT,
    bookmarks JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, manga_list_id)
);

-- =============================================
-- USER STATISTICS (Materialized View for Performance)
-- =============================================
CREATE TABLE public.user_statistics (
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Reading stats
    total_manga INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    total_reading INTEGER DEFAULT 0,
    total_plan_to_read INTEGER DEFAULT 0,
    total_dropped INTEGER DEFAULT 0,
    total_on_hold INTEGER DEFAULT 0,
    
    -- Progress stats
    total_chapters_read INTEGER DEFAULT 0,
    total_volumes_read INTEGER DEFAULT 0,
    total_reading_time_minutes INTEGER DEFAULT 0,
    
    -- Favorites and ratings
    total_favorites INTEGER DEFAULT 0,
    average_user_rating DECIMAL(3,2),
    
    -- Streaks
    current_reading_streak INTEGER DEFAULT 0,
    longest_reading_streak INTEGER DEFAULT 0,
    
    -- Time tracking
    last_activity_date DATE,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOG (For reading history and analytics)
-- =============================================
CREATE TABLE public.activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    manga_list_id UUID REFERENCES public.manga_lists(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(50) NOT NULL, -- 'manga_added', 'status_changed', 'chapter_read', etc.
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX idx_manga_lists_user_id ON public.manga_lists(user_id);
CREATE INDEX idx_manga_lists_category_id ON public.manga_lists(category_id);
CREATE INDEX idx_manga_lists_mal_id ON public.manga_lists(mal_id);
CREATE INDEX idx_manga_lists_title ON public.manga_lists USING gin(to_tsvector('english', title));
CREATE INDEX idx_manga_lists_genres ON public.manga_lists USING gin(genres);
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX idx_reading_progress_status ON public.reading_progress(status);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (profile_public = true);

-- Manga Categories Policies
CREATE POLICY "Users can manage their own categories" ON public.manga_categories
    FOR ALL USING (auth.uid() = user_id);

-- Manga Lists Policies
CREATE POLICY "Users can manage their own manga lists" ON public.manga_lists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public lists are viewable by everyone" ON public.manga_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_id AND lists_public = true
        )
    );

-- Reading Progress Policies
CREATE POLICY "Users can manage their own reading progress" ON public.reading_progress
    FOR ALL USING (auth.uid() = user_id);

-- User Statistics Policies
CREATE POLICY "Users can view their own statistics" ON public.user_statistics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update user statistics" ON public.user_statistics
    FOR ALL USING (true); -- This will be handled by triggers/functions

-- Activity Log Policies
CREATE POLICY "Users can view their own activity" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (true); -- Handled by triggers

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.manga_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.manga_lists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.reading_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update user statistics
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_statistics (user_id)
    VALUES (COALESCE(NEW.user_id, OLD.user_id))
    ON CONFLICT (user_id) DO UPDATE SET
        total_manga = (
            SELECT COUNT(*) FROM public.manga_lists 
            WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
        ),
        total_completed = (
            SELECT COUNT(*) FROM public.reading_progress rp
            JOIN public.manga_lists ml ON rp.manga_list_id = ml.id
            WHERE ml.user_id = COALESCE(NEW.user_id, OLD.user_id) 
            AND rp.status = 'completed'
        ),
        total_reading = (
            SELECT COUNT(*) FROM public.reading_progress rp
            JOIN public.manga_lists ml ON rp.manga_list_id = ml.id
            WHERE ml.user_id = COALESCE(NEW.user_id, OLD.user_id) 
            AND rp.status = 'reading'
        ),
        total_plan_to_read = (
            SELECT COUNT(*) FROM public.reading_progress rp
            JOIN public.manga_lists ml ON rp.manga_list_id = ml.id
            WHERE ml.user_id = COALESCE(NEW.user_id, OLD.user_id) 
            AND rp.status = 'plan-to-read'
        ),
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update statistics
CREATE TRIGGER update_user_stats_on_manga_change
    AFTER INSERT OR UPDATE OR DELETE ON public.manga_lists
    FOR EACH ROW EXECUTE FUNCTION public.update_user_statistics();

CREATE TRIGGER update_user_stats_on_progress_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reading_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_user_statistics();

-- Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_log (user_id, manga_list_id, activity_type, new_value)
        VALUES (NEW.user_id, NEW.id, 'manga_added', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_log (user_id, manga_list_id, activity_type, old_value, new_value)
        VALUES (NEW.user_id, NEW.id, 'manga_updated', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.activity_log (user_id, manga_list_id, activity_type, old_value)
        VALUES (OLD.user_id, OLD.id, 'manga_removed', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Activity logging triggers
CREATE TRIGGER log_manga_activity
    AFTER INSERT OR UPDATE OR DELETE ON public.manga_lists
    FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- =============================================
-- INITIAL DATA AND SETUP
-- =============================================

-- Create a function to initialize user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, username, display_name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    
    -- Create default categories
    INSERT INTO public.manga_categories (user_id, name, description, sort_order) VALUES
    (NEW.id, 'Currently Reading', 'Manga I am currently reading', 1),
    (NEW.id, 'Plan to Read', 'Manga I plan to read', 2),
    (NEW.id, 'Completed', 'Manga I have completed', 3),
    (NEW.id, 'Dropped', 'Manga I have dropped', 4),
    (NEW.id, 'On Hold', 'Manga I have put on hold', 5);
    
    -- Initialize user statistics
    INSERT INTO public.user_statistics (user_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for manga with reading progress
CREATE VIEW public.manga_with_progress AS
SELECT 
    ml.*,
    rp.status as reading_status,
    rp.chapters_read,
    rp.volumes_read,
    rp.progress_percentage,
    rp.start_date,
    rp.finish_date,
    rp.last_read_date,
    rp.current_chapter_notes,
    mc.name as category_name,
    mc.color as category_color
FROM public.manga_lists ml
LEFT JOIN public.reading_progress rp ON ml.id = rp.manga_list_id
LEFT JOIN public.manga_categories mc ON ml.category_id = mc.id;

-- View for user dashboard data
CREATE VIEW public.user_dashboard AS
SELECT 
    up.id,
    up.username,
    up.display_name,
    up.avatar_url,
    us.*,
    (
        SELECT COUNT(*) FROM public.manga_lists 
        WHERE user_id = up.id AND added_at >= CURRENT_DATE - INTERVAL '7 days'
    ) as manga_added_this_week,
    (
        SELECT COUNT(*) FROM public.reading_progress rp
        JOIN public.manga_lists ml ON rp.manga_list_id = ml.id
        WHERE ml.user_id = up.id AND rp.last_read_date >= CURRENT_DATE - INTERVAL '7 days'
    ) as chapters_read_this_week
FROM public.user_profiles up
LEFT JOIN public.user_statistics us ON up.id = us.user_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select access to anonymous users for public profiles and lists
GRANT SELECT ON public.user_profiles TO anon;
GRANT SELECT ON public.manga_lists TO anon;
GRANT SELECT ON public.manga_categories TO anon;
