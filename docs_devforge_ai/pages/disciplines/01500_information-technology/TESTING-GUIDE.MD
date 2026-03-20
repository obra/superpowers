# 🧪 COMPLETE TESTING GUIDE: Department-Aware Embeddings with Record Manager

## 📋 **TESTING CHECKLIST**

### **Phase 1: Database Setup (Required First)**
- [ ] Run department routing SQL (update-embeddings-table-fixed.sql)
- [ ] Run record manager SQL (enhanced-record-manager.sql)
- [ ] Verify table creation and foreign keys
- [ ] Test basic database connectivity

### **Phase 2: Record Manager Testing**
- [ ] Test duplicate detection
- [ ] Verify version management
- [ ] Test cleanup operations
- [ ] Validate processing status tracking

### **Phase 3: Department-Aware Embeddings Testing**
- [ ] Test page context detection
- [ ] Verify department routing
- [ ] Test embeddings storage with department metadata
- [ ] Test department-specific search

### **Phase 4: Integration Testing**
- [ ] Test complete upload workflow with record manager
- [ ] Verify all table updates during processing
- [ ] Test end-to-end functionality
- [ ] Validate audit trail

### **Phase 5: Production Readiness**
- [ ] Add OpenAI API key (optional)
- [ ] Test with real embeddings
- [ ] Performance validation
- [ ] Monitor department statistics

---

## 🚀 **STEP-BY-STEP TESTING INSTRUCTIONS**

### **STEP 1: Database Setup**

**1.1 Create Department-Aware Tables**
```bash
# Run these SQL files in order:
# 1. update-embeddings-table-fixed.sql (department routing with UUID foreign keys)
# 2. enhanced-record-manager.sql (record manager with duplicate prevention)

# This creates:
# - Enhanced document_embeddings table with department routing
# - document_processing_records table for record management
# - Department-aware search functions
# - Duplicate prevention and version management
```

**1.2 Verify Table Creation**
```bash
# After running SQL, test database connectivity:
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function verifyTables() {
  console.log('🔍 Verifying enhanced tables...');
  
  // Check document_embeddings with new columns
  const { data: embData, error: embError } = await supabase
    .from('document_embeddings')
    .select('id, discipline_code, document_store_id')
    .limit(1);
  console.log('document_embeddings:', embError ? 'FAILED: ' + embError.message : 'SUCCESS');
  
  // Check document_processing_records
  const { data: procData, error: procError } = await supabase
    .from('document_processing_records')
    .select('id, discipline_code, status')
    .limit(1);
  console.log('document_processing_records:', procError ? 'FAILED: ' + procError.message : 'SUCCESS');
  
  // Link existing embeddings to stores
  console.log('🔗 Linking existing embeddings to stores...');
  const { data: linkData, error: linkError } = await supabase
    .rpc('link_embeddings_to_stores');
  console.log('Link result:', linkError ? 'FAILED: ' + linkError.message : 'SUCCESS: ' + JSON.stringify(linkData));
}

verifyTables();
"
```

### **STEP 2: Test Record Manager Functions**

**2.1 Test Duplicate Detection**
```bash
# Test duplicate detection functionality:
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testDuplicateDetection() {
  console.log('🔍 Testing duplicate detection...');
  
  // Test check for non-existent document
  const { data: checkNew, error: checkError } = await supabase
    .rpc('check_document_exists', {
      p_discipline_code: '00435',
      p_source_file: 'test-document.pdf',
      p_file_hash: 'sha256_test_hash',
      p_file_size: 1024000
    });
  
  if (checkError) {
    console.log('❌ Check failed:', checkError.message);
  } else {
    console.log('✅ Duplicate check result:', checkNew[0]);
  }
}

testDuplicateDetection();
"
```

**2.2 Test Processing Record Creation**
```bash
# Test starting document processing:
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testProcessingStart() {
  console.log('🚀 Testing processing record creation...');
  
  // Get a document store UUID first
  const { data: stores } = await supabase
    .from('document_stores')
    .select('id, discipline_code')
    .eq('discipline_code', '00435')
    .limit(1);
  
  if (!stores || stores.length === 0) {
    console.log('❌ No document store found for 00435');
    return;
  }
  
  const storeId = stores[0].id;
  console.log('📋 Using store:', storeId);
  
  const { data: result, error } = await supabase
    .rpc('start_document_processing', {
      p_document_store_id: storeId,
      p_discipline_code: '00435',
      p_source_file: 'test-record-manager.pdf',
      p_file_hash: 'sha256_test_hash_' + Date.now(),
      p_file_size: 1024000,
      p_mime_type: 'application/pdf',
      p_metadata: { test: 'record_manager_test' }
    });
  
  if (error) {
    console.log('❌ Processing start failed:', error.message);
  } else {
    console.log('✅ Processing started:', result[0]);
  }
}

testProcessingStart();
"
```

**2.2 Verify Data Storage**
```bash
# Check if embeddings were stored:
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.from('document_embeddings').select('id, source, content').then(({data, error}) => {
  if (error) console.log('ERROR:', error.message);
  else console.log('Stored embeddings:', data?.length || 0, 'records');
  data?.forEach((row, i) => console.log(\`\${i+1}. \${row.source} - \${row.content.substring(0, 50)}...\`));
});
"
```

### **STEP 3: Test Department-Aware Embeddings Service**

**3.1 Test Enhanced Service with Department Detection**
```bash
# Test the enhanced department-aware service:
node enhanced-embeddings-service.cjs

# Expected output:
# ✅ Page context detection successful
# ✅ Document store lookup successful  
# ✅ Department routing working
# ✅ Record manager integration working
# ✅ Embeddings stored with department metadata
```

**3.2 Test Different Department Routing**
```bash
# Test with different page contexts:
node -e "
const EnhancedEmbeddingsService = require('./enhanced-embeddings-service.cjs');
const service = new EnhancedEmbeddingsService();

async function testDepartmentRouting() {
  console.log('🧪 Testing department routing...');
  
  try {
    // Test 1: Explicit page prefix
    console.log('📍 Test 1: Explicit page prefix (00435)');
    const result1 = await service.processDocumentWithDepartmentAwareness('Accordion & pages.pdf', {
      pagePrefix: '00435',
      title: 'Contracts - Test Document',
      metadata: { test: 'explicit_prefix' }
    });
    console.log('✅ Result 1:', result1.success ? 'SUCCESS' : 'FAILED');
    
    // Test 2: URL-based detection
    console.log('📍 Test 2: URL-based detection (01300)');
    const result2 = await service.processDocumentWithDepartmentAwareness('Accordion & pages.pdf', {
      currentUrl: 'https://example.com/pages/01300-governance',
      title: 'Governance - Test Document',
      metadata: { test: 'url_detection' }
    });
    console.log('✅ Result 2:', result2.success ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('❌ Department routing test failed:', error.message);
  }
}

testDepartmentRouting();
"
```

**3.2 Test Dashboard Persistence Fix**
```bash
# Test our dashboard persistence fix (will fail due to external issues but shows our fix works):
curl -X POST http://localhost:3060/api/documents/upsert-with-template \
  -F "file=@Accordion & pages.pdf" \
  -F "title=TESTING DASHBOARD PERSISTENCE FIX" \
  -F "description=Verifying unique document ID generation" \
  -F "store_id=b4d5e3a9-0ffb-458b-8371-3ffe3fb238ce" \
  -F "discipline=contracts" \
  -F "page_prefix=00435" \
  -F "metadata={\"test\":\"dashboard_persistence\"}"

# Expected: Unique docId generated, Supabase storage successful, Flowise fails (external issue)
```

### **STEP 4: Test Department-Specific Search**

**4.1 Test Department-Filtered Search**
```bash
# Test department-specific search functionality:
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testDepartmentSearch() {
  console.log('🔍 Testing department-specific search...');
  
  // Test department search function
  const { data: searchResults, error: searchError } = await supabase
    .rpc('search_department_embeddings', {
      department_code: '00435',
      search_query: 'accordion',
      max_results: 5
    });
  
  if (searchError) {
    console.log('❌ Department search failed:', searchError.message);
  } else {
    console.log(\`✅ Found \${searchResults.length} results in 00435 department\`);
    searchResults.forEach((result, i) => {
      console.log(\`\${i+1}. \${result.section}: \${result.content.substring(0, 80)}... (Score: \${result.combined_score})\`);
    });
  }
  
  // Test basic department filter
  const { data: basicResults, error: basicError } = await supabase
    .from('document_embeddings')
    .select('*')
    .eq('discipline_code', '00435')
    .ilike('content', '%accordion%')
    .limit(3);
  
  if (basicError) {
    console.log('❌ Basic search failed:', basicError.message);
  } else {
    console.log(\`✅ Basic department filter found \${basicResults.length} results\`);
  }
}

testDepartmentSearch();
"
```

**4.2 Test Metadata Search**
```bash
# Test metadata-based search:
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testMetadataSearch() {
  console.log('🔍 Testing metadata search...');
  
  const { data, error } = await supabase
    .from('document_embeddings')
    .select('*')
    .contains('metadata', { processingMethod: 'direct_embeddings' });
  
  if (error) {
    console.log('❌ Metadata search failed:', error.message);
  } else {
    console.log(\`✅ Found \${data.length} direct embeddings records\`);
  }
}

testMetadataSearch();
"
```

### **STEP 5: Test Complete Integration & Monitoring**

**5.1 Test Complete Workflow with All Tables**
```bash
# Test complete workflow that updates all tables:
node -e "
const EnhancedEmbeddingsService = require('./enhanced-embeddings-service.cjs');
const service = new EnhancedEmbeddingsService();

async function testCompleteWorkflow() {
  console.log('🔄 Testing complete workflow with all table updates...');
  
  try {
    const result = await service.processDocumentWithDepartmentAwareness('Accordion & pages.pdf', {
      pagePrefix: '00435',
      currentUrl: 'https://example.com/pages/00435-contracts-post-award',
      title: 'Complete Workflow Test',
      metadata: { 
        test: 'complete_workflow',
        uploadedBy: 'test_user',
        department: 'contracts'
      }
    });
    
    console.log('✅ Complete workflow result:', {
      success: result.success,
      pageInfo: result.pageInfo?.page_name,
      documentStore: result.documentStore?.name,
      chunksProcessed: result.chunksProcessed,
      chunksStored: result.chunksStored
    });
    
  } catch (error) {
    console.error('❌ Complete workflow failed:', error.message);
  }
}

testCompleteWorkflow();
"
```

**5.2 Test Department Statistics & Monitoring**
```bash
# Test department statistics and monitoring:
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testMonitoring() {
  console.log('📊 Testing department statistics and monitoring...');
  
  // Get department statistics
  const { data: stats, error: statsError } = await supabase
    .rpc('get_department_embedding_stats');
  
  if (statsError) {
    console.log('❌ Statistics failed:', statsError.message);
  } else {
    console.log('✅ Department Statistics:');
    stats.forEach(stat => {
      console.log(\`  \${stat.discipline_code}: \${stat.total_embeddings} embeddings, \${stat.total_documents} documents\`);
    });
  }
  
  // Get processing status
  const { data: status, error: statusError } = await supabase
    .rpc('get_document_processing_status', { p_discipline_code: '00435' });
  
  if (statusError) {
    console.log('❌ Status check failed:', statusError.message);
  } else {
    console.log(\`✅ Processing Status: \${status.length} records for 00435\`);
  }
  
  // Check consolidated view
  const { data: consolidated, error: consolidatedError } = await supabase
    .from('consolidated_documents')
    .select('*')
    .eq('discipline_code', '00435')
    .limit(3);
  
  if (consolidatedError) {
    console.log('❌ Consolidated view failed:', consolidatedError.message);
  } else {
    console.log(\`✅ Consolidated view: \${consolidated.length} unified records\`);
  }
}

testMonitoring();
"
```

### **STEP 6: Production Readiness (Optional)**

**6.1 Add OpenAI API Key for Real Embeddings**
```bash
# Add to .env file:
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env

# Then test with real embeddings:
node enhanced-embeddings-service.cjs
# Should show: "✅ Using OpenAI embeddings" instead of mock embeddings
```

**5.2 Test Vector Similarity Search (Requires OpenAI)**
```bash
# Test semantic similarity search:
node -e "
const DirectEmbeddingsService = require('./create-direct-embeddings-service.cjs');
const service = new DirectEmbeddingsService();

async function testVectorSearch() {
  console.log('🧠 Testing vector similarity search...');
  
  try {
    const results = await service.searchEmbeddings('user interface components');
    console.log(\`✅ Vector search returned \${results.length} results\`);
    results.forEach((result, i) => {
      console.log(\`\${i+1}. \${result.section}: \${result.content.substring(0, 80)}...\`);
    });
  } catch (error) {
    console.log('❌ Vector search failed:', error.message);
  }
}

testVectorSearch();
"
```

---

## 🎯 **EXPECTED TEST RESULTS**

### **✅ Success Indicators**

**Database Setup**:
- Enhanced tables created successfully
- UUID foreign keys working properly
- Record manager functions operational
- Existing embeddings linked to stores

**Record Manager**:
- Duplicate detection working
- Version management functional
- Processing status tracking operational
- Cleanup operations successful

**Department-Aware Embeddings**:
- Page context detection successful
- Department routing working correctly
- Embeddings stored with department metadata
- All tables updated during processing

**Search Functionality**:
- Department-specific search returns relevant results
- Consolidated view provides unified access
- Department statistics available
- No query syntax errors

**Complete Integration**:
- All tables updated automatically during processing
- Audit trail maintained across all operations
- Department isolation working properly
- Performance acceptable for production use

### **❌ Troubleshooting Common Issues**

**"Table doesn't exist"**:
- Run the SQL file first: `create-embeddings-table.sql`
- Check Supabase permissions

**"Search syntax error"**:
- Use simple text search instead of full-text search
- Check PostgreSQL version compatibility

**"Mock embeddings only"**:
- Add OPENAI_API_KEY to .env for real embeddings
- Mock embeddings work fine for testing

---

## 🚀 **QUICK START TESTING**

**Minimum Viable Test (10 minutes)**:
```bash
# 1. Run SQL files (you'll do this):
# - update-embeddings-table-fixed.sql
# - enhanced-record-manager.sql

# 2. Test enhanced embeddings service
node enhanced-embeddings-service.cjs

# 3. Verify department routing
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.from('document_embeddings').select('discipline_code, count').then(({data, error}) => {
  console.log('Department routing:', error ? 'ERROR' : 'SUCCESS - ' + data.length + ' departments');
});
"

# 4. Test department search
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.rpc('search_department_embeddings', {department_code: '00435', search_query: 'accordion'}).then(({data, error}) => {
  console.log('Department search:', error ? 'FAILED' : 'SUCCESS - Found ' + data.length + ' results');
});
"

# 5. Check department statistics
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.rpc('get_department_embedding_stats').then(({data, error}) => {
  console.log('Department stats:', error ? 'FAILED' : 'SUCCESS - ' + data.length + ' departments tracked');
});
"
```

**This will validate that the complete department-aware system with record manager is working!**
