# Test Agent Setup - Contracts Post-Award (5-Digit Prefix)

## ✅ Complete Setup with 5-Digit Prefix Naming Convention

**Branch**: `chad-00435-contracts-post-award-test`

## 📁 Files Created:

### 1. **Agent Logic** (`components/agents/test.js`)
- Main test processing component
- Uses `useModal` hook for modal management
- Connects to `/api/agents/test`

### 2. **Agent Modal** (`components/agents/test-modal.js`)
- Modal wrapper using the official Modal component
- Follows 5-digit prefix naming: `A-00435-03-001-test-contract-analysis`

### 3. **Trigger Button** (`components/modals/test-trigger.js`)
- Button to launch the test agent
- Uses `useModal` hook with 5-digit prefix modal key

## 🎯 Database Integration (5-Digit Prefix)

### Modal Configuration:
```sql
INSERT INTO public.modal_configurations (
  modal_key,
  display_name,
  component_path,
  target_page_prefix,
  target_state,
  chatbot_id,
  integration_type,
  interaction_style,
  is_legacy
) VALUES (
  'A-00435-03-001-test-contract-analysis',
  'Test Contract Analysis',
  '@pages/00435-contracts-post-award/components/agents/test-modal.js',
  '00435',
  'Agent',
  'test-contracts-agent',
  'None',
  'Input Form',
  false
);
```

## 🎯 Integration Instructions

### 1. Add Trigger to Contracts Post-Award Page:
```javascript
// In 00435-contracts-post-award-page.js
import TestTrigger from './components/modals/test-trigger';
import { useModal } from '@components/modal/hooks/0170-useModal';

// Add trigger button in appropriate location
<TestTrigger 
  contractId={selectedContract?.id} 
  documentContext={currentDocument} 
/>
```

### 2. Alternative: Direct Modal Opening:
```javascript
// Using useModal hook directly
import { useModal } from '@components/modal/hooks/0170-useModal';

const { openModal } = useModal();

// Open test agent modal with 5-digit prefix
openModal('A-00435-03-001-test-contract-analysis', {
  contractId: 'contract-123',
  documentContext: { title: 'Test Contract' },
  chatbot_id: 'test-contracts-agent'
});
```

## 🔄 Development Workflow

1. **Configure in Database**: Run the SQL insert above
2. **Rebuild Application**: `npm run build` (generates modal registry)
3. **Test Integration**: Use the Modal Management page (0170) to verify
4. **Work on Branch**: `chad-00435-contracts-post-award-test`
5. **Push Changes**: `git push origin chad-00435-contracts-post-award-test`

## 📋 Next Steps:
1. **Add SQL configuration** to `sql/setup_modal_configurations.sql`
2. **Run build** to generate modal registry
3. **Test modal** via Modal Management page
4. **Integrate trigger** into contracts post-award page
5. **Test API endpoint** `/api/agents/test`

## 🔒 Security & Access:
- **RLS Policies**: Ensure authenticated users can access modal configurations
- **Service Key**: Required for build-time registry generation
- **User Session**: Used for runtime modal management

## 🎯 Key Features:
- **5-digit prefix naming**: `A-00435-03-001-test-contract-analysis`
- **Database-driven**: Modal configuration stored in Supabase
- **Build-time registry**: Automatic component mapping
- **Standard naming**: Follows `A-[5-digit-prefix]-[type]-[sequence]-[description]` convention
- **React context**: Uses official modal system with `useModal` hook
