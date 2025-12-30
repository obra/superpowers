# Example Brainstorming Session

Demonstrates the brainstorming workflow with a real scenario.

---

## Scenario: Adding User Notifications

**User:** I want to add notifications to my app.

---

### Phase 1: Understand Context

**Claude:** I see this is a React/Node.js web application with PostgreSQL. Before diving into notifications, let me understand the scope:

What types of events should trigger notifications?

A) User actions (new messages, mentions, replies)
B) System events (maintenance, updates, errors)
C) Both user and system events
D) Something else

**User:** A - just user actions for now.

**Claude:** Good, focusing on user-triggered notifications. What's the primary delivery channel?

A) In-app notifications only (badge, dropdown)
B) Email notifications only
C) Both in-app and email
D) Push notifications (mobile/browser)

**User:** A - in-app only.

---

### Phase 2: Explore Approaches

**Claude:** For in-app notifications, here are three approaches:

**Recommended: Polling with Smart Caching**
- Client polls every 30 seconds
- Server caches unread count in Redis
- Simple to implement, good enough for most apps
- Trade-off: Slight delay (up to 30s)

**Alternative 1: WebSockets**
- Real-time updates
- More complex infrastructure
- Better for chat-heavy apps

**Alternative 2: Server-Sent Events**
- One-way real-time
- Simpler than WebSockets
- Limited browser connection pool

I recommend polling for this use case. The 30-second delay is acceptable for user action notifications, and it avoids WebSocket complexity. Agree?

**User:** Yes, polling sounds right.

---

### Phase 3: Present Design

**Claude:** Here's the first section - the data model:

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

The `type` field allows filtering (mentions, replies, etc.). The `read_at` timestamp tracks read status while preserving when it was read.

Does this look right so far?

**User:** Yes, but add a `link` field for navigation.

**Claude:** Good catch. Adding `link VARCHAR(500)` for the target URL. Next section - the API endpoints...

---

### Phase 4: Document

**Claude:** Design validated. Writing to `docs/plans/2025-01-15-user-notifications-design.md`.

[Commits design document]

---

### Phase 5: Handoff

**Claude:** Ready to set up for implementation? I can create a worktree and detailed implementation plan.

**User:** Yes, let's do it.

---

## Key Patterns Demonstrated

1. **One question per message** - Each question focused on single decision
2. **Multiple-choice options** - Made decisions easier
3. **Recommendation with reasoning** - Led with preferred option
4. **Incremental validation** - Checked after each design section
5. **Flexibility** - Incorporated user's `link` field suggestion
