# Setup Instructions for Enhanced Contributor Hub

## Required Steps to Complete Setup

### 1. Database Migration (REQUIRED)
You need to run the SQL migration scripts to create the new database tables:

```bash
# Run the contributor tables migration
node sql/migrate-contributor-tables.cjs

# Run the agent-modal assignments migration  
node sql/migrate-agent-modal-assignments.cjs
```

### 2. Wait for Build to Complete
The build is currently running. Wait for it to finish before testing.

### 3. Start the Server
```bash
npm run start:server
# or
node server/src/index.js
```

### 4. Test the Enhanced UI
1. Navigate to `http://localhost:3060/00180-contributor-hub`
2. You should see the new enhanced contributor hub interface with:
   - Contributors table
   - Assignment form
   - GitHub sync button
   - Agent selection with context

### 5. Populate Initial Data (Optional)
To test the full functionality, you may need to add some initial data:

```bash
# Example API calls to add test data
curl -X POST http://localhost:3060/api/agent-names \
  -H "Content-Type: application/json" \
  -d '{"name":"Legal Team","description":"Legal department agents"}'

curl -X POST http://localhost:3060/api/contributors \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","github_username":"testuser","email":"test@example.com"}'
```

## What the Enhanced UI Provides

### New Features:
- **Dynamic Data Loading**: Fetches real data from database
- **GitHub Integration**: Sync button (placeholder for now)
- **Assignment Management**: Create agent-modal-page assignments
- **Context Display**: Shows existing assignments when selecting agents
- **Multi-modal Selection**: Assign multiple modals to one agent

### Database Tables Created:
- `contributors` - GitHub user information
- `agent_names` - Available agent names
- `agent_modal_assignments` - Junction table for assignments

### API Endpoints Available:
- `/api/contributors` - Contributor management
- `/api/agent-names` - Agent name management  
- `/api/modal-configurations` - Modal management
- `/api/agent-modal` - Assignment management

## Troubleshooting

If you see errors:
1. Check that Supabase is running
2. Verify environment variables are set
3. Ensure migrations ran successfully
4. Check server logs for API errors

The enhanced UI will show loading states and error messages if data cannot be loaded.
