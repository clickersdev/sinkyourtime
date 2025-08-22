# Sink Your Time - Product Requirements Document

## Product Overview

**Product Name:** Sink Your Time  
**Product Type:** Web-based Productivity Timer Application  
**Target Platform:** Web Browser (Desktop/Mobile responsive)  
**User Base:** Single-user focused (Phase 1)

## Product Vision

Sink Your Time is a Pomodoro-style productivity timer that helps users track and analyze how they spend their time across different projects and categories. The app combines focused work sessions with detailed time analytics to help users understand their productivity patterns and optimize their workflow.

## Core Features

### 1. Pomodoro Timer System

**Timer Functionality:**
- Customizable work intervals (default: 25 minutes)
- Customizable short break intervals (default: 5 minutes)  
- Customizable long break intervals (default: 15-30 minutes)
- Long breaks automatically triggered after configurable number of pomodoros (default: 4)
- Audio notifications when timers complete
- One active timer at a time
- Visual countdown display

**Timer Behavior:**
- Incomplete sessions are still logged with actual time spent
- Break periods remain attached to the active project/category
- Timer state persists across browser sessions
- Clear visual indicators for work vs. break periods

### 2. Project Management

**Project Structure:**
- Maximum of 10 projects per user
- Each project can have multiple categories
- Project metadata includes:
  - Name (required)
  - Description (optional)
  - Color coding
  - Status (Active/Archived)
- Projects displayed in a clean, organized interface

**Category System:**
- Pre-defined default categories:
  - Development
  - Marketing
  - Design
  - Planning
  - Meetings
  - Research
  - Administration
- Users can edit, add, or remove categories
- Categories are project-specific (Project1/Marketing, Project2/Development)
- Simple one-level categorization (no subcategories)

### 3. Time Tracking & Data Management

**Session Logging:**
- All timer sessions automatically logged
- Data captured per session:
  - Project name
  - Category
  - Start/end time
  - Duration (planned vs actual)
  - Session type (work/break)
  - Completion status

**Data Persistence:**
- All time entries stored locally/in database
- Users can edit or delete historical entries
- Export functionality (CSV, PDF formats)

### 4. Analytics & Reporting

**Dashboard Views:**
- Daily time breakdown
- Weekly time summary  
- Monthly overview
- Time spent per project (today/week/month)
- Time breakdown by category
- Productivity trends over time

**Visualizations:**
- Pie charts for category distribution
- Bar charts for project comparison
- Line graphs for productivity trends
- Progress indicators for daily/weekly goals

**Key Metrics:**
- Total focused time
- Number of completed pomodoros
- Average session length
- Most productive time periods
- Project completion rates

## User Experience Requirements

### Interface Design
- Clean, minimalist design focused on the timer
- Easy project/category selection
- Quick access to start timer
- Distraction-free timer display during active sessions
- Responsive design for desktop and mobile browsers

### User Flow
1. User selects project and category
2. Customizes timer intervals (if desired)
3. Starts pomodoro session
4. Receives audio notification when work period ends
5. Takes break (timer automatically starts break period)
6. Returns to work or views analytics
7. Reviews time tracking data in dashboard

### Accessibility
- Keyboard navigation support
- High contrast mode option
- Screen reader compatible
- Clear visual/audio cues for timer state changes

## Technical Requirements

### Recommended Technical Stack

**Frontend Framework:**
- **React 18+** with TypeScript for type safety and better developer experience
- **Vite** for fast development and build tooling
- **Tailwind CSS** for utility-first styling and responsive design
- **React Router** for client-side routing
- **Zustand** or **React Context** for state management (timer state, user preferences)

**UI Components:**
- **Headless UI** or **Radix UI** for accessible components
- **React Hot Toast** for notifications
- **Recharts** or **Chart.js** for analytics visualizations
- **Lucide React** for consistent iconography

**Audio/Notifications:**
- **Web Audio API** for timer completion sounds
- **Web Notifications API** for browser notifications
- Custom audio files for different notification types

**Data Management:**
- **IndexedDB** (via Dexie.js) for local data persistence
- **JSON export/import** functionality for data portability
- **LocalStorage** for user preferences and settings
- Future: **Firebase** or **Supabase** for cloud sync (Phase 2)

**Timer Implementation:**
- **Web Workers** for accurate background timer execution
- **requestAnimationFrame** for smooth UI updates
- **Performance.now()** for precise time tracking
- Fallback to **Date.now()** for older browser support

**Build & Deployment:**
- **Vercel** or **Netlify** for static site hosting
- **GitHub Actions** for CI/CD pipeline
- **ESLint + Prettier** for code quality
- **Vitest** for unit testing

**PWA Features:**
- **Vite PWA Plugin** for service worker generation
- **Web App Manifest** for install prompts
- **Background Sync** for offline timer functionality
- **Cache strategies** for offline-first experience

### Performance Requirements
- Fast loading times (<3 seconds initial load)
- <100ms response time for timer start/stop actions
- Reliable timer accuracy (±1 second over 25 minutes)
- Smooth 60fps animations and transitions
- Efficient memory usage for long-running sessions

### Browser Support
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browser compatibility (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers
- Responsive design (320px - 2560px viewports)

### Data Architecture
```typescript
// Core data models
interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'archived';
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  projectId: string;
}

interface TimerSession {
  id: string;
  projectId: string;
  categoryId: string;
  type: 'work' | 'short_break' | 'long_break';
  plannedDuration: number; // milliseconds
  actualDuration: number; // milliseconds
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

interface UserSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // after X pomodoros
  audioEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

### Security & Privacy
- No user authentication required (single-user, local-first)
- All data stored locally in browser
- No external tracking or analytics
- Optional telemetry for performance monitoring
- GDPR-compliant data handling

### Development Workflow
```bash
# Recommended project structure
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── services/           # Timer logic, data persistence
├── stores/             # State management
├── types/              # TypeScript definitions
├── utils/              # Helper functions
└── workers/            # Web Workers for timers
```

## Success Metrics

### User Engagement
- Daily active sessions per user
- Average session completion rate
- Time spent in application per day
- Feature adoption rates

### Productivity Metrics
- Number of completed pomodoros per user
- Project completion tracking
- Category usage patterns
- User retention rates

## Future Enhancements (Phase 2+)

### Advanced Features
- Team collaboration and shared projects
- Integration with calendar applications
- Goal setting and achievement tracking
- Advanced analytics and insights
- Mobile native applications
- Desktop application versions

### Gamification Elements
- Achievement badges
- Productivity streaks
- Weekly challenges
- Progress milestones

## Risk Assessment

### Technical Risks
- Browser compatibility issues
- Timer accuracy across different devices
- Data loss prevention
- Performance optimization

### User Experience Risks
- Learning curve for new users
- Feature complexity balance
- Notification fatigue
- Mobile usability challenges

## Launch Strategy

### MVP Features (Phase 1)
- Core Pomodoro timer functionality
- Basic project/category management
- Essential time tracking
- Simple analytics dashboard
- Data export capability

### Success Criteria for MVP
- 90%+ timer accuracy
- <2 second response times
- Successful data persistence
- Positive user feedback on core functionality
- Working export/import features

## Conclusion

Sink Your Time addresses the growing need for effective time management tools by combining the proven Pomodoro Technique with detailed project tracking and analytics. The focus on simplicity, customization, and insightful reporting will help users build better productivity habits while gaining valuable insights into their work patterns.