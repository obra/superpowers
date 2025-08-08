# Email/Calendar Agent - Mobile UI Design Specifications

## 🎯 Core Design Principles

### Voice-First Interaction
- **Primary Input**: Voice commands with visual feedback
- **Visual Confirmation**: Real-time transcription display
- **Conversation Flow**: Natural language processing with contextual responses
- **Fallback Options**: Touch interface for noise-sensitive environments

### Mobile-First Design
- **Screen Priority**: Optimized for 375px - 428px viewport width
- **Thumb-Friendly**: Bottom navigation and action zones
- **Gesture Support**: Swipe actions for quick operations
- **Accessibility**: WCAG 2.1 AA compliance

## 📱 Key UI Components

### 1. Voice Command Interface
```
Components:
- Floating voice activation button (bottom center)
- Waveform visualization during recording
- Real-time transcription overlay
- Confidence indicator for voice recognition
- Quick action buttons for common commands
```

**Visual States:**
- Idle: Subtle pulse animation
- Listening: Active waveform display
- Processing: Loading spinner with context
- Success: Green confirmation animation
- Error: Red alert with retry option

### 2. Email Thread Context Display
```
Layout:
- Collapsible thread summaries
- Sender avatars with relationship indicators
- Priority badges (urgent, follow-up, FYI)
- AI-generated action suggestions
- Voice response indicators
```

**Key Features:**
- Thread timeline visualization
- Sentiment analysis indicators
- Quick reply suggestions
- Voice note attachments

### 3. Conversational AI Assistant
```
Interface Elements:
- Chat bubble interface for AI suggestions
- Contextual action cards
- Confirmation dialogs with voice feedback
- Multi-step workflow guidance
```

**Example Flows:**
```
AI: "Jon from marketing hasn't responded to your proposal. Should I send a follow-up?"
Options: [Voice Reply] [Yes, Draft It] [Remind Me Later] [No Thanks]

AI: "You have 3 meetings tomorrow. Want me to prepare briefing notes?"
Options: [Voice Command] [Show Details] [Prepare All] [Select Specific]
```

### 4. Contact Database Management
```
Features:
- Smart contact cards with relationship context
- Communication history timeline
- Preferred contact methods
- Meeting notes integration
- Voice memo attachments
```

**Contact Card Layout:**
- Profile photo/avatar
- Name and role
- Last interaction summary
- Upcoming meetings/deadlines
- Quick actions (email, call, schedule)

### 5. Calendar Integration Views
```
Views:
- Day view with voice command shortcuts
- Week view with email context
- Meeting preparation assistant
- Conflict resolution interface
```

**Meeting Card Design:**
- Title and duration
- Attendee avatars
- Preparation checklist
- Related email threads
- Voice briefing option

## 🗄️ Database Schema (Supabase)

### Tables Structure

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  voice_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  relationship_score INTEGER DEFAULT 50,
  preferred_contact_method TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email threads table
CREATE TABLE email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  participants TEXT[],
  summary TEXT,
  sentiment_score FLOAT,
  priority_level INTEGER,
  ai_suggestions JSONB,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table (AI interactions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE SET NULL,
  message_type TEXT, -- 'user_voice', 'ai_suggestion', 'action_taken'
  content TEXT,
  voice_transcription TEXT,
  action_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendees JSONB,
  related_threads UUID[],
  preparation_notes TEXT,
  voice_briefing_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voice_activation_phrase TEXT DEFAULT 'Hey Assistant',
  auto_suggest_replies BOOLEAN DEFAULT true,
  email_summary_time TIME DEFAULT '09:00:00',
  notification_preferences JSONB,
  ui_theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 UI Mockup Specifications

### Color Palette
```css
:root {
  --primary: #2563eb;      /* Blue - primary actions */
  --secondary: #7c3aed;    /* Purple - AI suggestions */
  --success: #10b981;      /* Green - confirmations */
  --warning: #f59e0b;      /* Amber - alerts */
  --danger: #ef4444;       /* Red - errors */
  --neutral-50: #fafafa;   /* Background */
  --neutral-900: #171717;  /* Text */
}
```

### Typography
```css
/* System fonts for performance */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

/* Size scale */
--text-xs: 0.75rem;    /* 12px - metadata */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - headings */
--text-xl: 1.25rem;    /* 20px - titles */
```

### Component Dimensions
```css
/* Touch targets minimum 44x44px */
--button-height: 48px;
--input-height: 52px;
--card-padding: 16px;
--screen-padding: 20px;
--voice-button-size: 64px;
```

## 🔄 User Interaction Flows

### Flow 1: Voice Email Response
1. User activates voice button
2. Speaks command: "Reply to Jon about the proposal"
3. AI shows draft with voice feedback
4. User confirms or edits via voice/touch
5. Email sent with confirmation

### Flow 2: Contact Context Query
1. User asks: "When did I last talk to Sarah?"
2. AI displays contact card with timeline
3. Shows recent emails and meetings
4. Suggests next action based on context

### Flow 3: Meeting Preparation
1. AI proactively alerts about upcoming meeting
2. Shows related email threads
3. Generates talking points
4. Offers voice briefing creation

## 📊 Performance Targets

- **Voice Recognition**: < 300ms latency
- **UI Response**: < 100ms for interactions
- **Data Sync**: Real-time with offline support
- **Battery Impact**: < 5% per hour active use

## 🚀 Next Steps

1. **Create v0 Mockups**: Generate interactive prototypes
2. **Implement Database**: Set up Supabase tables
3. **Voice Integration**: Configure speech recognition
4. **API Development**: Build backend services
5. **Testing Framework**: Establish QA processes

---

This design specification provides the foundation for building a voice-driven, mobile-first Email/Calendar Agent with conversational AI capabilities.