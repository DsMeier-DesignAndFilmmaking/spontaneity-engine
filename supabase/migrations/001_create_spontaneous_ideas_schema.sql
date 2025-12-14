-- ============================================================================
-- Supabase Migration: Create Spontaneous Ideas Schema
-- ============================================================================
-- Purpose: Scalable database model for "Share Your Spontaneous Idea" feature
-- Supports: Anonymous submissions, AI embeddings, geo-discovery, time filtering
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ============================================================================
-- MAIN TABLE: spontaneous_ideas
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.spontaneous_ideas (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Identity (nullable for anonymous submissions)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  
  -- Core Content
  headline TEXT NOT NULL,
  description TEXT,
  
  -- Location Fields (for geo-discovery and map-based search)
  location_name TEXT NOT NULL, -- e.g., "Denver, CO", "Central Park"
  city TEXT,
  country TEXT DEFAULT 'US',
  latitude DECIMAL(10, 8), -- Precision for ~1mm accuracy
  longitude DECIMAL(11, 8),
  
  -- Time Fields (for time-based filtering)
  starts_at TIMESTAMPTZ, -- When the activity typically starts
  ends_at TIMESTAMPTZ, -- When the activity typically ends
  is_flexible_time BOOLEAN DEFAULT true, -- If time can vary
  
  -- AI & Discovery Fields
  embedding vector(1536), -- OpenAI ada-002 embedding dimension (adjust if using different model)
  tags TEXT[], -- Array of tags for filtering (e.g., ['outdoor', 'food', 'culture'])
  vibe TEXT, -- User-defined vibe (e.g., 'chill', 'adventurous', 'creative')
  
  -- Status & Visibility
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  submission_source TEXT DEFAULT 'demo', -- 'demo', 'web', 'mobile', etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT headline_length CHECK (char_length(headline) >= 3 AND char_length(headline) <= 200),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT valid_time_range CHECK (
    starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at
  )
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Vector similarity search index (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_embedding 
ON public.spontaneous_ideas 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Geo-location index (for spatial queries using earthdistance)
-- Note: For more advanced spatial queries, consider using PostGIS extension
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_location 
ON public.spontaneous_ideas (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Status and visibility index (for filtering active ideas)
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_status_public 
ON public.spontaneous_ideas (status, is_public) 
WHERE status = 'approved' AND is_public = true;

-- Time-based filtering index
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_time_range 
ON public.spontaneous_ideas (starts_at, ends_at, is_flexible_time);

-- User lookup index
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_user_id 
ON public.spontaneous_ideas (user_id) 
WHERE user_id IS NOT NULL;

-- Tags array index (for tag filtering)
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_tags 
ON public.spontaneous_ideas USING GIN (tags);

-- Created at index (for sorting by newest)
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_created_at 
ON public.spontaneous_ideas (created_at DESC);

-- Featured and view count (for discovery algorithms)
CREATE INDEX IF NOT EXISTS idx_spontaneous_ideas_featured_popular 
ON public.spontaneous_ideas (is_featured, view_count DESC, like_count DESC);

-- ============================================================================
-- SUPPORTING TABLE: spontaneous_idea_interactions
-- ============================================================================
-- Tracks user interactions (likes, views, saves) for analytics and personalization
CREATE TABLE IF NOT EXISTS public.spontaneous_idea_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.spontaneous_ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking
  
  -- Interaction Type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'save', 'share', 'click')),
  
  -- Metadata
  user_agent TEXT,
  ip_address INET, -- For geo-analytics (consider privacy regulations)
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_idea_interaction UNIQUE (idea_id, user_id, interaction_type)
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_idea_id 
ON public.spontaneous_idea_interactions (idea_id);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id 
ON public.spontaneous_idea_interactions (user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_type 
ON public.spontaneous_idea_interactions (interaction_type, created_at DESC);

-- ============================================================================
-- SUPPORTING TABLE: spontaneous_idea_comments
-- ============================================================================
-- User comments/feedback on ideas (future social feature)
CREATE TABLE IF NOT EXISTS public.spontaneous_idea_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES public.spontaneous_ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  
  -- Content
  comment_text TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
  is_edited BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT comment_length CHECK (char_length(comment_text) >= 1 AND char_length(comment_text) <= 1000)
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_idea_id 
ON public.spontaneous_idea_comments (idea_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON public.spontaneous_idea_comments (user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_status 
ON public.spontaneous_idea_comments (status) 
WHERE status = 'approved';

-- ============================================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for spontaneous_ideas
CREATE TRIGGER update_spontaneous_ideas_updated_at
  BEFORE UPDATE ON public.spontaneous_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.spontaneous_idea_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNCTION: Update like_count on interactions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_idea_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'like' THEN
    UPDATE public.spontaneous_ideas
    SET like_count = (
      SELECT COUNT(*) 
      FROM public.spontaneous_idea_interactions
      WHERE idea_id = NEW.idea_id AND interaction_type = 'like'
    )
    WHERE id = NEW.idea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_on_interaction
  AFTER INSERT OR DELETE ON public.spontaneous_idea_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_idea_like_count();

-- ============================================================================
-- FUNCTION: Update view_count on interactions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_idea_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.interaction_type = 'view' THEN
    UPDATE public.spontaneous_ideas
    SET view_count = view_count + 1
    WHERE id = NEW.idea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_view_count_on_interaction
  AFTER INSERT ON public.spontaneous_idea_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_idea_view_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.spontaneous_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spontaneous_idea_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spontaneous_idea_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: spontaneous_ideas
-- ============================================================================

-- Policy 1: Public read access for approved, public ideas
CREATE POLICY "Public can view approved ideas"
ON public.spontaneous_ideas
FOR SELECT
TO public
USING (status = 'approved' AND is_public = true);

-- Policy 2: Authenticated users can view their own ideas (any status)
CREATE POLICY "Users can view their own ideas"
ON public.spontaneous_ideas
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Anonymous insert (for demo mode)
CREATE POLICY "Anyone can submit ideas"
ON public.spontaneous_ideas
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 4: Users can update their own ideas
CREATE POLICY "Users can update their own ideas"
ON public.spontaneous_ideas
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 5: Users can delete their own ideas
CREATE POLICY "Users can delete their own ideas"
ON public.spontaneous_ideas
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: spontaneous_idea_interactions
-- ============================================================================

-- Policy 1: Public can insert interactions (for anonymous tracking)
CREATE POLICY "Anyone can create interactions"
ON public.spontaneous_idea_interactions
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Public can view interactions for approved ideas
CREATE POLICY "Public can view interactions for approved ideas"
ON public.spontaneous_idea_interactions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.spontaneous_ideas
    WHERE id = idea_id AND status = 'approved' AND is_public = true
  )
);

-- Policy 3: Users can view their own interactions
CREATE POLICY "Users can view their own interactions"
ON public.spontaneous_idea_interactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 4: Users can delete their own interactions
CREATE POLICY "Users can delete their own interactions"
ON public.spontaneous_idea_interactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: spontaneous_idea_comments
-- ============================================================================

-- Policy 1: Public can insert comments (for anonymous comments)
CREATE POLICY "Anyone can create comments"
ON public.spontaneous_idea_comments
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Public can view approved comments for approved ideas
CREATE POLICY "Public can view approved comments"
ON public.spontaneous_idea_comments
FOR SELECT
TO public
USING (
  status = 'approved' AND
  EXISTS (
    SELECT 1 FROM public.spontaneous_ideas
    WHERE id = idea_id AND status = 'approved' AND is_public = true
  )
);

-- Policy 3: Users can view their own comments (any status)
CREATE POLICY "Users can view their own comments"
ON public.spontaneous_idea_comments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 4: Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.spontaneous_idea_comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 5: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.spontaneous_idea_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS for Frontend
-- ============================================================================

-- Function: Get nearby ideas (geo-based discovery)
CREATE OR REPLACE FUNCTION public.get_nearby_ideas(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  headline TEXT,
  description TEXT,
  location_name TEXT,
  distance_km DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.headline,
    si.description,
    si.location_name,
    (earth_distance(ll_to_earth(si.latitude, si.longitude), ll_to_earth(lat, lng)) / 1000)::DECIMAL AS distance_km,
    si.created_at
  FROM public.spontaneous_ideas si
  WHERE 
    si.status = 'approved' 
    AND si.is_public = true
    AND si.latitude IS NOT NULL 
    AND si.longitude IS NOT NULL
    AND earth_distance(ll_to_earth(si.latitude, si.longitude), ll_to_earth(lat, lng)) <= (radius_km * 1000)
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Search ideas by vector similarity (AI-powered discovery)
CREATE OR REPLACE FUNCTION public.search_ideas_by_similarity(
  query_embedding vector(1536),
  similarity_threshold DECIMAL DEFAULT 0.7,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  headline TEXT,
  description TEXT,
  location_name TEXT,
  similarity DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.headline,
    si.description,
    si.location_name,
    (1 - (si.embedding <=> query_embedding))::DECIMAL AS similarity,
    si.created_at
  FROM public.spontaneous_ideas si
  WHERE 
    si.status = 'approved' 
    AND si.is_public = true
    AND si.embedding IS NOT NULL
    AND (1 - (si.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY si.embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS (Ensure public can access necessary functions)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.spontaneous_ideas TO anon, authenticated;
GRANT INSERT ON public.spontaneous_ideas TO anon, authenticated;
GRANT SELECT ON public.spontaneous_idea_interactions TO anon, authenticated;
GRANT INSERT ON public.spontaneous_idea_interactions TO anon, authenticated;
GRANT SELECT ON public.spontaneous_idea_comments TO anon, authenticated;
GRANT INSERT ON public.spontaneous_idea_comments TO anon, authenticated;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.spontaneous_ideas IS 'User-submitted spontaneous activity ideas. Supports anonymous and authenticated submissions.';
COMMENT ON COLUMN public.spontaneous_ideas.embedding IS 'AI embedding vector for similarity search. Dimension: 1536 (OpenAI ada-002).';
COMMENT ON COLUMN public.spontaneous_ideas.latitude IS 'Latitude in decimal degrees (-90 to 90).';
COMMENT ON COLUMN public.spontaneous_ideas.longitude IS 'Longitude in decimal degrees (-180 to 180).';
COMMENT ON FUNCTION public.get_nearby_ideas IS 'Returns ideas within specified radius (km) from given coordinates.';
COMMENT ON FUNCTION public.search_ideas_by_similarity IS 'Returns ideas similar to query embedding using cosine similarity.';

