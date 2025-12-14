# Spontaneous Ideas Database Schema

## Overview

This schema supports the "Share Your Spontaneous Idea" feature with:
- ✅ Anonymous submissions (demo mode)
- ✅ Authenticated user support (future)
- ✅ AI-powered similarity search (vector embeddings)
- ✅ Geo-location discovery (map-based search)
- ✅ Time-based filtering
- ✅ Social interactions (likes, views, comments)

## Database Tables

### 1. `spontaneous_ideas` (Main Table)

**Purpose**: Stores user-submitted spontaneous activity ideas.

**Key Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID, nullable): References `auth.users` for authenticated submissions
- `is_anonymous` (boolean): True for demo/anonymous submissions
- `headline` (text): Required, 3-200 characters
- `description` (text): Optional, max 500 characters
- `location_name`, `city`, `country`: Location text fields
- `latitude`, `longitude`: Decimal coordinates for geo-search
- `starts_at`, `ends_at`: Time range for the activity
- `embedding` (vector): AI embedding for similarity search (1536 dimensions)
- `tags` (text[]): Array of tags for filtering
- `status`: 'pending', 'approved', 'rejected', 'archived'
- `is_public`: Visibility flag

### 2. `spontaneous_idea_interactions`

**Purpose**: Tracks user interactions (views, likes, saves, shares).

**Key Fields**:
- `idea_id`: References `spontaneous_ideas`
- `user_id` (nullable): For authenticated users
- `session_id`: For anonymous tracking
- `interaction_type`: 'view', 'like', 'save', 'share', 'click'

### 3. `spontaneous_idea_comments`

**Purpose**: User comments/feedback on ideas (future social feature).

**Key Fields**:
- `idea_id`: References `spontaneous_ideas`
- `user_id` (nullable): For authenticated users
- `comment_text`: 1-1000 characters
- `status`: 'pending', 'approved', 'rejected', 'deleted'

## Row Level Security (RLS) Policies

### Public Access (Anonymous Users)
- ✅ **SELECT**: Can view approved, public ideas
- ✅ **INSERT**: Can submit new ideas (anonymous)
- ❌ **UPDATE/DELETE**: Not allowed

### Authenticated Users
- ✅ **SELECT**: Can view approved ideas + their own ideas (any status)
- ✅ **INSERT**: Can submit ideas
- ✅ **UPDATE/DELETE**: Can modify/delete their own ideas

## Frontend Integration

### 1. Insert a New Idea (Anonymous)

```typescript
// Example: Insert from UGCSubmissionModal
const { data, error } = await supabase
  .from('spontaneous_ideas')
  .insert({
    headline: 'Sunset view from the hill behind the old fort',
    description: 'A peaceful spot to watch the sunset...',
    location_name: 'Denver, CO',
    city: 'Denver',
    country: 'US',
    latitude: 39.7392,
    longitude: -104.9903,
    is_anonymous: true,
    user_display_name: null, // Optional for anonymous
    status: 'pending', // Will be auto-approved or moderated
    is_public: true,
    tags: ['outdoor', 'sunset', 'scenic'],
    vibe: 'chill',
    submission_source: 'demo',
  })
  .select()
  .single();
```

### 2. Fetch Approved Ideas

```typescript
// Get all approved, public ideas
const { data, error } = await supabase
  .from('spontaneous_ideas')
  .select('*')
  .eq('status', 'approved')
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

### 3. Geo-Based Discovery (Nearby Ideas)

```typescript
// Use the helper function for nearby ideas
const { data, error } = await supabase
  .rpc('get_nearby_ideas', {
    lat: 39.7392, // User's latitude
    lng: -104.9903, // User's longitude
    radius_km: 10, // Search radius
    limit_count: 20
  });
```

### 4. AI-Powered Similarity Search

```typescript
// First, generate embedding from user input using OpenAI
const embedding = await generateEmbedding(userInput);

// Then search for similar ideas
const { data, error } = await supabase
  .rpc('search_ideas_by_similarity', {
    query_embedding: embedding, // vector(1536)
    similarity_threshold: 0.7, // 0-1, higher = more similar
    limit_count: 20
  });
```

### 5. Track Interaction (View/Like)

```typescript
// Track a view (anonymous)
const { error } = await supabase
  .from('spontaneous_idea_interactions')
  .insert({
    idea_id: ideaId,
    interaction_type: 'view',
    session_id: getSessionId(), // Your session tracking
    user_agent: navigator.userAgent,
  });

// Track a like (authenticated)
const { error } = await supabase
  .from('spontaneous_idea_interactions')
  .insert({
    idea_id: ideaId,
    user_id: userId, // From auth.users
    interaction_type: 'like',
  });
```

### 6. Filter by Tags

```typescript
// Get ideas with specific tags
const { data, error } = await supabase
  .from('spontaneous_ideas')
  .select('*')
  .eq('status', 'approved')
  .contains('tags', ['outdoor', 'food']) // Array contains
  .order('created_at', { ascending: false });
```

### 7. Time-Based Filtering

```typescript
// Get ideas available now
const now = new Date().toISOString();
const { data, error } = await supabase
  .from('spontaneous_ideas')
  .select('*')
  .eq('status', 'approved')
  .or(`is_flexible_time.eq.true,and(starts_at.lte.${now},ends_at.gte.${now})`)
  .order('created_at', { ascending: false });
```

## AI Embedding Generation

### Using OpenAI (Recommended)

```typescript
// Generate embedding for a new idea
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });
  
  const data = await response.json();
  return data.data[0].embedding; // Returns 1536-dimensional vector
}

// Use when inserting an idea
const embedding = await generateEmbedding(
  `${headline} ${description} ${location_name} ${tags.join(' ')}`
);
```

## Indexes & Performance

The schema includes optimized indexes for:
- ✅ Vector similarity search (HNSW index)
- ✅ Geo-location queries (GIST index)
- ✅ Status/visibility filtering
- ✅ Time-based queries
- ✅ Tag filtering (GIN index)
- ✅ User lookups
- ✅ Popularity sorting

## Future Enhancements

1. **Moderation Queue**: Admin table for reviewing pending submissions
2. **User Profiles**: Link to user profiles when authenticated
3. **Ratings**: Add rating system for ideas
4. **Collections**: Allow users to save ideas into collections
5. **Notifications**: Alert users when their ideas are liked/commented
6. **Analytics**: Aggregate interaction data for insights

## Migration Instructions

1. **Run the migration**:
   ```bash
   # If using Supabase CLI
   supabase migration up
   
   # Or apply directly in Supabase Dashboard SQL Editor
   ```

2. **Verify extensions**:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');
   ```

3. **Test RLS policies**:
   ```sql
   -- As anonymous user
   SET ROLE anon;
   SELECT * FROM spontaneous_ideas; -- Should only see approved, public
   
   -- Reset
   RESET ROLE;
   ```

## Notes

- **Embedding Dimension**: Currently set to 1536 (OpenAI ada-002). Adjust if using different model.
- **Privacy**: IP addresses stored for analytics. Consider GDPR compliance.
- **Moderation**: Ideas start as 'pending'. Implement moderation workflow.
- **Coordinates**: Use `ll_to_earth()` function for geo-queries (requires `earthdistance` extension or custom function).

