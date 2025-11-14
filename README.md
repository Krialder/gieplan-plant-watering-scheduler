# GießPlan - Plant Watering Schedule System

A fair and intelligent scheduling application for managing weekly plant watering assignments at Rotkreuz-Institut BBW (Berufsvorbereitung).

## 🌱 Overview

GießPlan is a React-based web application that automatically generates fair watering schedules while considering:
- Individual availability periods
- Experience levels and mentorship needs
- Long-term fairness across multiple years
- Temporal distribution of assignments
- Vacation and absence periods

## ✨ Features

### 👥 People Management
- Add and manage participants with arrival/departure dates
- Track multiple program periods per person
- Automatic experience level classification (new/experienced)
- Flexible date handling for ongoing participants

### 📅 Smart Scheduling
- **Automatic schedule generation** with advanced fairness algorithm
- **Mentorship pairing** - pairs experienced members with newcomers
- **Cross-year fairness** - tracks assignment debt across years
- **Temporal distribution** - evenly spaces assignments over time
- **Substitute management** - assign backup people for each week

### 🎯 Fairness Engine
- Multi-dimensional fairness scoring system
- Temporal fairness (spacing between assignments)
- Assignment frequency fairness (per day present)
- Cross-year debt tracking
- Mentorship burden balancing
- Recent assignment balance consideration

### 📊 Data Management
- **File-based persistence** - select your own storage location
- **Import/Export** functionality (JSON format)
- **Multi-year support** - manage multiple years separately
- **Backup and recovery** options
- **Data validation** and integrity checks

### 🎨 User Interface
- Clean, modern interface with shadcn/ui components
- **Three theme modes**: Light, Dark, and Twilight
- Responsive design for desktop and mobile
- Real-time updates and notifications
- Accessible and keyboard-friendly

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krialder/gieplan-plant-wateri.git
   cd gieplan-plant-wateri
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

### Windows Quick Start

Use the provided batch or PowerShell scripts:

```powershell
# Using PowerShell
.\run.ps1

# Using Command Prompt
.\run.bat
```

## 📖 Usage

### 1. Select Data Folder
On first launch, select a folder to store your data files. The app will create JSON files for each year.

### 2. Add People
Navigate to the **People** tab:
- Click "Person hinzufügen" (Add Person)
- Enter name, arrival date, and expected departure date
- The system automatically tracks experience levels

### 3. Generate Schedule
Navigate to the **Schedule** tab:
- Set the date range for your schedule
- Configure options:
  - Enable/disable mentorship pairing
  - Set people per week
  - Choose to include currently absent people
- Click "Zeitplan generieren" (Generate Schedule)

### 4. Review and Adjust
The generated schedule shows:
- Week-by-week assignments
- Fairness scores for each person
- Mentorship pairs (if enabled)
- Assignment statistics

### 5. Manual Adjustments
Navigate to the **Manual** tab to:
- Edit individual week assignments
- Add or remove substitutes
- Swap people between weeks
- Fine-tune the schedule

### 6. Export Data
Navigate to the **Data** tab to:
- Export schedules to JSON
- Import data from backups
- Manage year data
- View data statistics

## 🏗️ Project Structure

```
gieplan-plant-wateri/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── dialogs/         # Dialog components
│   │   ├── PeopleTab.tsx    # People management
│   │   ├── ScheduleTab.tsx  # Schedule generation
│   │   ├── ManualTab.tsx    # Manual editing
│   │   └── DataTab.tsx      # Data import/export
│   ├── lib/                 # Core business logic
│   │   ├── fairnessEngine.ts    # Fairness calculation
│   │   ├── scheduleEngine.ts    # Schedule generation
│   │   ├── personManager.ts     # Person management
│   │   ├── fileStorage.ts       # File persistence
│   │   ├── dateUtils.ts         # Date utilities
│   │   └── exportUtils.ts       # Export functionality
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # CSS and themes
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Entry point
├── Test/                    # Test files
│   ├── fairnessEngine.test.ts
│   ├── scheduleEngine.test.ts
│   ├── personManager.test.ts
│   └── stress.test.ts
├── legacy/                  # Legacy documentation
├── savings/                 # Default data storage location
└── package.json             # Project configuration
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The project includes tests for:
- ✅ Fairness engine calculations
- ✅ Schedule generation algorithms
- ✅ Person management logic
- ✅ Date utilities
- ✅ Progressive fairness improvements
- ✅ Stress tests with large datasets

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run optimize` - Optimize dependencies
- `npm test` - Run test suite

### Tech Stack

**Frontend:**
- React 19 (with hooks)
- TypeScript 5.7
- Vite 6 (build tool)
- Tailwind CSS 4 (styling)

**UI Components:**
- shadcn/ui (Radix UI primitives)
- Lucide React (icons)
- Sonner (toast notifications)
- React Hook Form (forms)

**State Management:**
- React hooks (useState, useEffect)
- File-based persistence
- Local storage for preferences

**Testing:**
- Vitest (test runner)
- Testing Library (React testing)
- JSDOM (DOM simulation)

## 📝 Algorithm Details

### Fairness Calculation

The fairness engine uses multiple metrics:

1. **Temporal Fairness Score** (0.0 - 1.0)
   - Measures spacing between assignments
   - Prevents clustering of assignments
   - Higher score = better temporal distribution

2. **Assignments Per Day Present** 
   - Normalizes by actual days present
   - Fair comparison between people with different tenures

3. **Cross-Year Fairness Debt**
   - Tracks unfairness from previous years
   - Negative debt = owed assignments
   - Positive debt = has extra assignments

4. **Mentorship Burden Score**
   - Accounts for mentoring responsibilities
   - Experienced members get credit for training

5. **Recent Assignment Balance**
   - Prevents same people being chosen repeatedly
   - Balances recent vs. historical fairness

### Schedule Generation

1. **Initialization**
   - Calculate date range and week boundaries
   - Determine available people for each week
   - Initialize fairness metrics

2. **Week-by-Week Assignment**
   - For each week, select people with:
     - Lowest total fairness debt
     - Best temporal spacing
     - Appropriate experience mix
   - Pair mentors with newcomers when enabled

3. **Optimization**
   - Progressive fairness recalculation
   - Multi-pass refinement
   - Balance short-term and long-term fairness

## 🎨 Themes

Three carefully designed themes:

- **Light** - Clean and professional for daytime use
- **Dark** - Easy on the eyes for low-light environments  
- **Twilight** - Warm purple tones for evening work

Toggle themes using the icon button in the header.

## 💾 Data Storage

### File Format

Data is stored as JSON files, one per year:

```json
{
  "year": 2025,
  "people": [...],
  "schedules": [...],
  "lastModified": "2025-11-14T10:00:00.000Z"
}
```

### Storage Location

- **Default**: `savings/` directory in project root
- **Custom**: Select any folder via file picker
- **Persistence**: Selection saved in browser localStorage

### File Operations

- **Auto-save** on every change
- **Atomic writes** to prevent corruption
- **Validation** on load
- **Error recovery** with user notifications

## 🔒 Privacy & Security

- **100% local** - No cloud storage, no server communication
- **Your data, your control** - Choose where files are stored
- **File system security** - Relies on OS-level permissions
- **No sensitive data** - Only names and dates stored

## 🐛 Troubleshooting

### Data Not Saving
- Verify folder permissions (write access required)
- Check available disk space
- Try selecting a different storage folder
- Ensure no other program has files locked

### Schedule Generation Issues
- Ensure at least 2 people are available
- Check date ranges are valid
- Verify people have correct arrival/departure dates
- Try adjusting fairness settings

### Cannot Load Previous Data
- Verify JSON file exists in selected folder
- Check JSON syntax with a validator
- Look for backup files
- Try manual import in Data tab

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is private and proprietary for use by Rotkreuz-Institut BBW.

## 🙏 Acknowledgments

- **Rotkreuz-Institut BBW** - Berufsvorbereitung program
- **shadcn/ui** - Beautiful, accessible UI components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework

## 📧 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the development team
- Check the `legacy/` folder for additional documentation

---

**Built with ❤️ for fair and efficient plant care scheduling**
