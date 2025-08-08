# v0 UI Generation Prompts for Email/Calendar Agent

## 🎯 Ready-to-Use v0 Prompts

### Prompt 1: Voice Command Interface
```
Create a mobile voice command interface component with:
- Floating circular button (64px) at bottom center with microphone icon
- On press: expand to show waveform visualization
- Real-time transcription appears above in a card
- Use Framer Motion for smooth animations
- Color scheme: Blue primary (#2563eb), white background
- Include listening, processing, and success states
- Add haptic feedback simulation with CSS animations
- Show confidence percentage for voice recognition
- Mobile-first design for 375px viewport width
```

### Prompt 2: Email Thread View
```
Design a mobile email thread interface with:
- Collapsible thread cards with sender avatars
- Priority badges (urgent=red, follow-up=amber, FYI=gray)
- AI-generated action suggestions as chips below each thread
- Swipe left to archive, swipe right to star
- Voice reply button on each thread
- Show sentiment indicator (positive=green, neutral=gray, negative=red)
- Time-based grouping (Today, Yesterday, This Week)
- Search bar with voice input option
- Dark mode support with system preference detection
```

### Prompt 3: AI Conversation Assistant
```
Build a conversational AI interface component:
- Chat bubble design with AI avatar
- Suggested actions as interactive cards
- "Should I email Jon?" style confirmation dialogs
- Voice and text input options
- Typing indicator animation
- Context cards showing related emails/meetings
- Quick reply suggestions as buttons
- Smooth scroll to latest message
- Pull-to-refresh for new suggestions
- Glassmorphism effect for overlay cards
```

### Prompt 4: Contact Management Card
```
Create a contact card component with:
- Profile image with online status indicator
- Name, role, and company
- Communication history timeline
- Last interaction summary
- Relationship score visualization (1-100)
- Quick action buttons (email, call, schedule)
- Voice memo recording option
- Expandable notes section
- Social media links if available
- Meeting history with this contact
```

### Prompt 5: Calendar Day View
```
Design a mobile calendar day view:
- Time slots from 6 AM to 10 PM
- Color-coded events by type
- Tap to expand event details
- Voice command shortcuts at bottom
- Meeting preparation status indicators
- Conflict visualization with red overlay
- Attendee avatars on each event
- Swipe between days gesture
- Today button for quick navigation
- Integration with email context shown as badges
```

### Prompt 6: Meeting Preparation Assistant
```
Build a meeting prep assistant interface:
- Meeting card with countdown timer
- Attendee list with profile photos
- Related email threads section
- AI-generated talking points
- Voice briefing player
- Documents checklist
- Quick actions (join call, send agenda)
- Preparation progress bar
- Notes input with voice option
- Post-meeting follow-up suggestions
```

### Prompt 7: Voice Feedback Overlay
```
Create a voice feedback overlay component:
- Semi-transparent background
- Animated sound waves during recording
- Real-time transcription display
- Cancel and confirm buttons
- Error state with retry option
- Processing spinner with context
- Success checkmark animation
- Auto-dismiss after 3 seconds
- Accessibility labels for screen readers
- Keyboard navigation support
```

### Prompt 8: Settings Dashboard
```
Design a settings dashboard for the app:
- Voice activation phrase customization
- Notification preferences with toggles
- Email summary schedule picker
- Theme selection (light/dark/auto)
- Account linking section
- Privacy controls
- Data export options
- Voice training interface
- Language selection
- Help and feedback sections
```

## 🚀 Implementation Tips for v0

### Best Practices:
1. Always specify "mobile-first" or "375px viewport"
2. Include "with Framer Motion" for animations
3. Mention "dark mode support" for modern UI
4. Add "accessibility features" for inclusive design
5. Request "TypeScript" for type safety
6. Include "Tailwind CSS" for consistent styling

### Example Full Implementation Request:
```
Create a complete mobile email/calendar agent UI with:
- Voice-first interaction design
- Email thread management with AI suggestions
- Contact database with relationship scoring
- Calendar integration with meeting prep
- Conversational AI assistant
- Use Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- Include Supabase integration hooks
- Add voice recognition with Web Speech API
- Mobile-first responsive design
- Dark mode with system preference
- Accessibility compliant (WCAG 2.1 AA)
```

### Component Library Request:
```
Build a React component library for email/calendar agent:
- VoiceButton component with recording states
- ThreadCard with swipe actions
- ContactCard with relationship visualization
- CalendarEvent with preparation status
- AIChat with suggestion cards
- ConfirmDialog with voice feedback
- Export as npm package
- Include Storybook stories
- Full TypeScript definitions
- Comprehensive documentation
```

## 📝 Notes

- Each prompt is optimized for v0's understanding
- Combine multiple prompts for complete interfaces
- Iterate on generated code with specific refinements
- Test on actual mobile devices for best results
- Consider Progressive Web App (PWA) features

---

Use these prompts directly in v0 to generate the mobile UI components for your Email/Calendar Agent.