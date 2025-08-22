# Sink Your Time - Productivity Timer

A modern, feature-rich Pomodoro-style productivity timer built with React, TypeScript, and Tailwind CSS. Track your time across different projects and categories while gaining insights into your productivity patterns.

## Features

### 🍅 Pomodoro Timer System

- Customizable work intervals (default: 25 minutes)
- Short and long break periods
- Automatic long breaks after configurable pomodoro cycles
- Audio notifications and browser notifications
- Visual progress indicators
- Keyboard shortcuts (Space: Start/Pause, R: Reset)

### 📊 Project Management

- Create and manage up to 10 projects
- Color-coded project organization
- Project-specific categories
- Default categories: Development, Marketing, Design, Planning, Meetings, Research, Administration
- Add, edit, and delete projects and categories

### ⏱️ Time Tracking

- Automatic session logging
- Track planned vs actual time spent
- Session completion status
- Data persistence using IndexedDB
- Export functionality (coming soon)

### 📈 Analytics & Insights

- Daily, weekly, and monthly time breakdowns
- Project and category time distribution
- Productivity trends and patterns
- Interactive charts and visualizations
- Key metrics: total focus time, completed pomodoros, average session length

### ⚙️ Customization

- Adjustable timer durations
- Theme selection (light, dark, system)
- Audio and notification preferences
- Auto-start breaks option
- Long break interval configuration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Database**: Dexie.js (IndexedDB wrapper)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd sinkyourtime
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### First Time Setup

1. The app will automatically create a default project with predefined categories
2. Select a project and category to start your first timer session
3. Configure your preferences in the Settings panel

### Using the Timer

1. **Select Project & Category**: Choose from the dropdown menus in the left panel
2. **Start Timer**: Click the Start button or press Space
3. **Take Breaks**: The app will automatically suggest breaks after work sessions
4. **Track Progress**: View your analytics in the Analytics tab

### Keyboard Shortcuts

- `Space`: Start/Pause timer
- `R`: Reset timer
- `Esc`: Pause timer (when running)

## Data Management

### Local Storage

All data is stored locally in your browser using IndexedDB:

- Timer sessions and history
- Project and category data
- User settings and preferences

### Data Export (Coming Soon)

- Export sessions as CSV
- Export analytics as PDF
- Data backup and restore functionality

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the Pomodoro Technique
- Built with modern web technologies
- Designed for productivity and focus

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Sink Your Time** - Make every minute count! 🚀
