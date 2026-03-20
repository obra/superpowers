# External API Setup Instructions

## 🚀 **Quick Setup - Run this script in your Supabase**

To set up all required API configurations, run the `insert_api_configurations.sql` script in your **Supabase SQL Editor**:

```sql
-- Paste the entire content of insert_api_configurations.sql here
```

Or run the file directly if you have Supabase CLI:
```bash
supabase db reset --db-url "YOUR_SUPABASE_DB_URL"
# Then run the insert_api_configurations.sql script
```

## 🔑 **APIs Being Configured**

### **1. Tavily Search API**
- **Purpose**: Web search and data gathering
- **Use Case**: Procurement and research features

### **2. OpenAI GPT-4o Vision**
- **Purpose**: Advanced drawing analysis and visual content processing
- **Use Case**: Architecture drawing comparison and analysis

### **3. OpenAI GPT-4 Turbo**
- **Purpose**: Text generation and correspondence analysis
- **Use Case**: Contract correspondence and reply generation

## ✅ **After Running the SQL Script**

1. **Verification**: The script includes verification queries to confirm successful insertion
2. **Application Restart**: Restart your development servers to pick up the new configurations
3. **Testing**: Verify APIs work by testing through the application interface

## 🏗️ **How It Works Now**

### **Before (Broken)**
- Hardcoded API keys in environment variables
- Manual configuration required
- Prone to key mismatches

### **After (Fixed)**
- ✅ All APIs stored securely in Supabase `external_api_configurations` table
- ✅ Automatic API key retrieval by type and use case
- ✅ Fallback mechanisms for development/production continuity
- ✅ Centralized API management through Admin UI

## 🧪 **Testing the Setup**

### **1. Drawing Analysis**
```bash
# Test the drawing analysis API configuration
curl "http://localhost:3060/api/external-apis" | jq '.data[] | select(.api_type == "OpenAI" and (.metadata->>\"use_case\") == \"drawing\")'
```

### **2. Correspondence Agent**
```bash
# Test correspondence API configuration
curl "http://localhost:3060/api/external-apis" | jq '.data[] | select(.api_type == "OpenAI" and (.metadata->>\"use_case\") == \"correspondence\")'
```

### **3. Tavily Search**
```bash
# Test Tavily API configuration
curl "http://localhost:3060/api/external-apis" | jq '.data[] | select(.api_type == \"Tavily\")'
```

## 🚨 **Important Notes**

1. **API Keys**: Replace placeholder keys in the SQL script with your actual API keys
2. **Security**: API keys are stored encrypted in the database
3. **Environment**: Works in both development and production
4. **Fallback**: System includes fallback configurations for continuity

## 🔧 **Troubleshooting**

### **If APIs Still Fail:**

1. **Check Supabase Connection**: Ensure your `.env` has proper Supabase credentials
2. **Verify Table Schema**: Confirm `external_api_configurations` table exists
3. **Run Verification Queries**: Check if data was inserted properly
4. **Restart Services**: Restart both client and server after changes

### **If Mock Data Appears:**
- Set `DEV_UI_ONLY_BYPASS=false` in your environment
- Or completely remove this environment variable

## 📋 **API Management Interface**

Access the API management interface at:
- **URL**: `http://localhost:3001/02050-information-technology/dev-settings`
- **Features**:
  - Add/Edit/Delete API configurations
  - Test API connections
  - Monitor API usage

## 🎯 **Next Steps**

1. ✅ Run the SQL script in Supabase
2. ✅ Restart your development servers
3. ✅ Test the drawing comparison feature
4. ✅ Test the correspondence reply feature
5. ✅ Verify Tavily search functionality works

The API integration now follows proper architecture with centralized configuration management!
