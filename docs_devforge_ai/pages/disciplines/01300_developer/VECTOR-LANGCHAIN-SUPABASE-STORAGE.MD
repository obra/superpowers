# LangChain Settings Supabase Storage Implementation

## Overview
This document outlines the plan to implement Supabase storage for LangChain settings, replacing the current localStorage implementation while maintaining it as a fallback.

## Implementation Plan

### Database Changes
1. Create new `user_langchain_settings` table:
```sql
CREATE TABLE user_langchain_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security
ALTER TABLE user_langchain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" 
ON user_langchain_settings
FOR ALL
USING (auth.uid() = user_id);
```

### Code Changes
1. Update `langchainSettingsService.js`:
```javascript
// Modified loadSettings()
async loadSettings() {
  try {
    // Try Supabase first if authenticated
    if (supabase.auth.user()) {
      const { data, error } = await supabase
        .from('user_langchain_settings')
        .select('settings')
        .eq('user_id', supabase.auth.user().id)
        .single();
      
      if (data && !error) {
        this.settings = { ...this.getDefaultSettings(), ...data.settings };
        return;
      }
    }

    // Fall back to localStorage
    const localSettings = localStorage.getItem('langchain-settings');
    if (localSettings) {
      this.settings = { ...this.getDefaultSettings(), ...JSON.parse(localSettings) };
      return;
    }

    // Final fallback to defaults
    this.settings = this.getDefaultSettings();
  } catch (error) {
    console.error('Error loading LangChain settings:', error);
    this.settings = this.getDefaultSettings();
  }
}

// Modified saveSettings()
async saveSettings(newSettings) {
  try {
    this.settings = { ...this.settings, ...newSettings };
    
    // Save to localStorage
    localStorage.setItem('langchain-settings', JSON.stringify(this.settings));

    // Save to Supabase if authenticated
    if (supabase.auth.user()) {
      await supabase.from('user_langchain_settings').upsert({
        user_id: supabase.auth.user().id,
        settings: this.settings,
        updated_at: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving LangChain settings:', error);
    return { success: false, error: error.message };
  }
}
```

## Migration Strategy
1. **Phase 1**: Implement new Supabase table
2. **Phase 2**: Update service code with dual storage
3. **Phase 3**: Deploy and test with small user group
4. **Phase 4**: Full rollout

## Testing Plan
| Test Case | Expected Result |
|-----------|-----------------|
| Authenticated user saves settings | Settings persist in Supabase |
| Unauthenticated user saves settings | Settings persist in localStorage |
| Supabase unavailable | Falls back to localStorage |
| Migration from localStorage | Existing settings transfer to Supabase on login |

## Rollback Plan
1. Revert code changes
2. Keep Supabase table (will be unused)
3. System will automatically fall back to localStorage

## Documentation Updates Required
1. Update `1385_LANGCHAIN_SETTINGS_UI.md` to reflect new storage
2. Add section to `0500_SUPABASE.md` about new table

## Implementation Timeline
1. Day 1: Database changes
2. Day 2: Code implementation
3. Day 3: Testing
4. Day 4: Deployment

## Dependencies
1. Supabase authentication must be working
2. Client must have network connectivity

## Security Considerations
1. API keys encrypted at rest
2. Row-level security enforced
3. LocalStorage fallback maintains basic functionality

## Monitoring
1. Log Supabase operation success/failure rates
2. Monitor localStorage fallback usage
3. Track settings load times

## Future Enhancements
1. Settings versioning
2. Organization-level defaults
3. Settings change history
