# Email Test Data

## Final Working Script

**File:** `populate-comprehensive-email-test-data-corrected.sql`

This is the final, tested, and working email test data script that successfully populates the email management system with comprehensive test data.

### What it creates:

- **17 total emails** with proper categorization
- **📥 Inbox**: 5 emails (unread, incoming emails)
- **📤 Sent**: 5 emails (sent by current user)
- **📝 Drafts**: 2 emails (draft emails by current user)
- **🗄️ Archived**: 2 emails (archived emails)
- **💬 Threads**: 5 emails (2 conversation threads with proper threading)

### Features:

✅ **Proper foreign key relationships** - All thread IDs correctly reference email_threads table
✅ **Correct user mapping** - Uses actual user ID from user_management table
✅ **Proper boolean flags** - Correct is_sent, is_draft, is_archived flags
✅ **AI processing data** - Includes sample AI results for testing AI tools
✅ **Thread support** - Creates proper email threads with conversation flow
✅ **All email states** - Covers all possible email statuses and priorities

### How to use:

```bash
psql -f populate-comprehensive-email-test-data-corrected.sql
```

### User Information:

- **User ID**: `22564dd8-9bcb-41c3-acc5-569e87551fd1`
- **Email**: `alistair.tennant@constructai.biz`
- **Account ID**: `3405f81f-21a3-44eb-9c25-6877959ea9f9`

### Cleanup:

All other email test files have been removed to avoid confusion. This is the single source of truth for email test data.

---

**Note:** The `populate-email-docs-test-data.cjs` file is for document testing, not email testing, so it remains.
