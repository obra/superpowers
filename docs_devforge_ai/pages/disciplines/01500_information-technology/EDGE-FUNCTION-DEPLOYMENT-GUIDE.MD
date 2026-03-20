# How to Create and Deploy the Supabase Edge Function

## Prerequisites

1. **Install Supabase CLI**:
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

## Step 1: Initialize Supabase in Your Project

If you haven't already initialized Supabase in your project:

```bash
# Navigate to your project directory
cd /Users/_PropAI/simandou-ai-bundle

# Initialize Supabase
supabase init
```

This creates a `supabase/` folder structure.

## Step 2: Link to Your Supabase Project

```bash
# Link to your existing Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference from your Supabase dashboard.

## Step 3: The Function is Already Created

The Edge Function file already exists at:
```
supabase/functions/vector-search/index.ts
```

## Step 4: Deploy the Edge Function

```bash
# Deploy the vector-search function
supabase functions deploy vector-search
```

## Step 5: Verify Deployment

After deployment, your function will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/vector-search
```

## Alternative: Manual Creation Process

If you want to create the function from scratch:

### 1. Create the Function Structure
```bash
# Create a new function
supabase functions new vector-search
```

### 2. Replace the Generated Code
Replace the contents of `supabase/functions/vector-search/index.ts` with our code.

### 3. Deploy
```bash
supabase functions deploy vector-search
```

## Function Structure Explanation

```
supabase/
└── functions/
    └── vector-search/
        └── index.ts          # The Edge Function code
```

## What the Edge Function Does

1. **Receives HTTP requests** with embedding data and search criteria
2. **Validates input** (embedding dimensions, required parameters)
3. **Queries the search criteria table** to get filter configurations
4. **Maps table names to database functions** automatically
5. **Executes the vector search** using the appropriate database function
6. **Returns formatted results** with metadata

## Environment Variables (Optional)

If you need custom environment variables:

```bash
# Set secrets for the function
supabase secrets set CUSTOM_SECRET=value
```

## Testing the Deployed Function

### Using curl:
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/vector-search' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query_embedding": [-0.0251, 0.0901, 0.0464, ...],
    "search_name": "vi_003_search",
    "match_count": 10
  }'
```

### Using the JavaScript client:
```javascript
const vectorSearch = new VectorSearchClient(
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_ANON_KEY'
);

const results = await vectorSearch.searchVI003(queryEmbedding, 10);
```

## Troubleshooting

### Function Not Found
- Ensure you've deployed: `supabase functions deploy vector-search`
- Check the function name matches exactly

### Permission Errors
- Verify your API keys are correct
- Check RLS policies if enabled

### Deployment Errors
- Ensure you're linked to the correct project
- Check your internet connection
- Verify Supabase CLI is up to date

## Complete Deployment Commands

Here's the complete sequence to deploy:

```bash
# 1. Navigate to project
cd /Users/_PropAI/simandou-ai-bundle

# 2. Initialize (if not done)
supabase init

# 3. Link to project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy the function
supabase functions deploy vector-search

# 5. Verify deployment
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/vector-search' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"query_embedding": [], "search_name": "test"}'
```

The function is already created in the file structure - you just need to deploy it!
