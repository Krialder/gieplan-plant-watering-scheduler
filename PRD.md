# GießPlan System - Product Requirements Document

A professional web application for managing plant watering schedules in high-fluctuation vocational preparation programs.

## Mission Statement

Build a time-proportional fairness system that handles constant participant arrivals/departures while maintaining cross-year continuity and intelligent mentorship pairing for the Red Cross Institute's Berufsvorbereitung program.

**Experience Qualities:**
1. **Professional** - Enterprise-grade interface suitable for institutional use with clear workflows and robust data management
2. **Transparent** - Fairness metrics visible in real-time, helping participants understand workload distribution based on time present
3. **Adaptive** - Seamlessly handles high fluctuation (2-week to multi-year participants) with intelligent schedule rebalancing

**Complexity Level:** Complex Application (advanced functionality, multi-year data management, sophisticated algorithms)
- This requires managing complex time-proportional fairness calculations, cross-year data continuity, mentorship logic, and real-time schedule generation with multiple constraints.

## Essential Features

### Feature 1: Person Management with Time Tracking
- **Functionality**: Add/remove participants with arrival/departure dates, track experience levels, manage program periods including re-entries
- **Purpose**: Core data foundation for time-proportional fairness - must accurately track how long each person has been present
- **Trigger**: User clicks "Add Person" or manages existing participant records
- **Progression**: Open dialog → Enter name/dates → Validate German umlauts → Calculate initial fairness weight → Save with timestamp → Update participant list
- **Success Criteria**: Participants added with accurate time tracking, handles 100+ people across multiple years, preserves data integrity

### Feature 2: Time-Proportional Fairness Engine
- **Functionality**: Calculate workload distribution based on time present (not assignment count), track cross-year fairness debt/credit, suggest next assignments prioritizing balance
- **Purpose**: Primary requirement - ensures someone present 2 weeks gets proportionally fewer assignments than someone present 2 years
- **Trigger**: Schedule generation or manual assignment request
- **Progression**: Calculate days present for each participant → Compute assignment rate ratio → Apply cross-year adjustments → Generate fairness scores → Rank suggestions
- **Success Criteria**: >95% temporal fairness accuracy, cross-year continuity maintained, visible fairness metrics updated in real-time

### Feature 3: Intelligent Mentorship Pairing
- **Functionality**: Automatically pair new participants (<3 months OR <4 watering sessions) with experienced mentors, prevent inexperienced-only pairings
- **Purpose**: Ensure proper training and prevent assignment failures from inexperienced teams
- **Trigger**: Schedule generation with new participants present
- **Progression**: Identify new participants → Find available mentors (experience + recent load + availability) → Create optimal pairings → Validate constraints → Assign with mentor flag
- **Success Criteria**: 90%+ successful new person integration, zero inexperienced-only pairings (unless emergency override), balanced mentor workload

### Feature 4: 6-Week Schedule Generation
- **Functionality**: Generate balanced schedules with no consecutive weeks, maintain fairness, respect experience levels, handle various constraints
- **Purpose**: Automate complex scheduling while maintaining fairness and operational requirements
- **Trigger**: User clicks "Generate Schedule" with date range selection
- **Progression**: Load active participants → Calculate fairness weights → Apply mentorship constraints → Generate assignments week-by-week → Validate no consecutive weeks → Display with fairness indicators
- **Success Criteria**: Valid 6-week schedules generated in <3 seconds, all constraints satisfied, fairness deviation <5%

### Feature 5: Fluctuation Event Handling
- **Functionality**: Handle arrivals/departures seamlessly, redistribute future assignments, update fairness metrics for all participants
- **Purpose**: Core requirement for high-fluctuation environment - system must adapt in real-time to roster changes
- **Trigger**: Participant arrival/departure date recorded or mass transition event
- **Progression**: Record event with date → Calculate impact on fairness weights → Redistribute affected future assignments → Update all metrics → Notify of schedule changes
- **Success Criteria**: Handle 10+ simultaneous events without data corruption, fairness recalculated within 1 second, schedule adjustments suggested automatically

### Feature 6: Multi-Year Data Management & Export
- **Functionality**: Store separate data files per year, automated backups, CSV/Excel export with German formatting, data integrity validation
- **Purpose**: Long-term data management for institutional compliance and cross-year fairness tracking
- **Trigger**: Automatic daily backups, user-initiated export requests
- **Progression**: Save data → Validate integrity → Create timestamped backup → Generate export with formatting → Download file
- **Success Criteria**: Zero data loss, export compatible with German Excel, backup/restore in <5 seconds

## Edge Case Handling

- **Empty participant pool**: Display helpful onboarding message with "Add First Person" call-to-action instead of empty state
- **All new participants**: Emergency override allows schedule generation with warning about lack of experienced mentors
- **Consecutive week conflicts**: Algorithm detects and resolves conflicts by swapping with next-best fairness match
- **Year boundary transitions**: Cross-year fairness debt preserved seamlessly, new year file created automatically with carryover metrics
- **Invalid date ranges**: Real-time validation prevents departure before arrival, highlights conflicts in UI immediately
- **German umlaut encoding**: UTF-8 throughout, special handling for CSV export to ensure Excel compatibility
- **Data corruption recovery**: Integrity validation on load, automatic rollback to last valid backup if corruption detected
- **Simultaneous edits**: Optimistic updates with conflict resolution, last-write-wins with user notification
- **Very long absences**: Re-entry treated as new period, fairness weight recalculated based on total time present across all periods
- **Mentor overload**: System warns when mentor has >3 mentorship assignments in rolling 12-week window

## Design Direction

The design should feel professional, trustworthy, and institutional - suitable for Red Cross Institute branding while remaining modern and approachable. It should evoke confidence through clear data visualization and transparent fairness metrics. A clean, organized interface serves the complex data management needs while remaining accessible to participants with diverse technical skills.

## Color Selection

**Custom palette** - Red Cross Institute branding with professional accents for data states and fairness indicators

- **Primary Color**: Deep Red `oklch(0.45 0.15 25)` - Red Cross Institute brand identity, commands authority and institutional trust
- **Secondary Colors**: Warm Gray `oklch(0.55 0.01 60)` for subdued backgrounds, Cool Blue `oklch(0.60 0.12 240)` for informational elements
- **Accent Color**: Vibrant Green `oklch(0.65 0.18 145)` - Success states, optimal fairness scores, positive feedback
- **Foreground/Background Pairings**:
  - Background (White `oklch(0.98 0 0)`): Dark Gray text `oklch(0.20 0 0)` - Ratio 14.2:1 ✓
  - Card (Light Gray `oklch(0.96 0 0)`): Dark Gray text `oklch(0.20 0 0)` - Ratio 13.1:1 ✓
  - Primary (Deep Red `oklch(0.45 0.15 25)`): White text `oklch(1.0 0 0)` - Ratio 6.8:1 ✓
  - Secondary (Warm Gray `oklch(0.55 0.01 60)`): White text `oklch(1.0 0 0)` - Ratio 4.9:1 ✓
  - Accent (Vibrant Green `oklch(0.65 0.18 145)`): White text `oklch(1.0 0 0)` - Ratio 5.2:1 ✓
  - Muted (Pale Gray `oklch(0.92 0 0)`): Medium Gray text `oklch(0.48 0 0)` - Ratio 5.1:1 ✓

## Font Selection

Typography should convey institutional professionalism while maintaining excellent readability for data-heavy interfaces and long participant lists.

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter Bold/32px/tight (-0.02em) letter spacing
  - H2 (Section Headers): Inter SemiBold/24px/normal spacing
  - H3 (Card Titles): Inter Medium/18px/normal spacing
  - Body (General Text): Inter Regular/15px/relaxed (1.6) line height
  - Small (Metadata): Inter Regular/13px/muted color
  - Data (Tables/Numbers): Inter Medium/14px/tabular numbers enabled

## Animations

Motion should be subtle and purposeful, reinforcing institutional professionalism while providing helpful feedback. Animations guide attention to fairness updates and schedule changes without feeling playful.

- **Purposeful Meaning**: Smooth transitions communicate data updates and status changes, reinforcing system reliability and data integrity
- **Hierarchy of Movement**: Fairness score updates deserve subtle highlight animation, schedule generation shows progressive loading, critical warnings use gentle pulse

## Component Selection

- **Components**: 
  - **Tabs** for main navigation (People, Schedule, Manual, Data)
  - **Table** for participant lists with sortable columns and fairness metrics
  - **Dialog** for add/edit person forms
  - **Card** for schedule week displays and metric summaries
  - **Select** for year/date range pickers
  - **Button** with variants (primary for actions, destructive for departures, outline for secondary)
  - **Badge** for experience levels and fairness status indicators
  - **Alert** for validation warnings and system notifications
  - **Popover** for detailed fairness breakdowns and help text

- **Customizations**: 
  - Custom schedule grid component showing 6-week calendar view with color-coded fairness indicators
  - Fairness meter component displaying real-time temporal fairness scores with visual gauge
  - Timeline component for participant program periods with arrival/departure markers
  - Experience level badges with custom RKI branding colors

- **States**: 
  - Buttons show distinct hover (subtle lift), active (press down), disabled (grayed + cursor not-allowed)
  - Table rows highlight on hover, selected state with left border accent
  - Form inputs show focus with ring, error state with red border + message, success with green checkmark
  - Cards have subtle shadow at rest, enhanced shadow on hover for interactive elements

- **Icon Selection**: 
  - **Users** icon for person management
  - **Calendar** icon for schedule generation  
  - **TrendingUp/Down** for fairness metrics
  - **Award** for experienced mentor status
  - **UserPlus/UserMinus** for arrivals/departures
  - **Download** for export actions
  - **Settings** for configuration
  - **ArrowRight** for progression flows

- **Spacing**: 
  - Page padding: `p-6` (24px)
  - Card padding: `p-4` (16px)
  - Form field gaps: `gap-4` (16px)
  - Table cell padding: `px-4 py-2` (16px/8px)
  - Button padding: `px-4 py-2` for default, `px-6 py-3` for primary actions
  - Consistent `gap-6` (24px) between major sections

- **Mobile**: 
  - Tabs collapse to dropdown menu on <768px
  - Table switches to card-based layout with stacked fields
  - Schedule grid shows one week at a time with swipe navigation
  - Dialogs become full-screen on mobile for better form interaction
  - Floating action button for primary "Add Person" action on mobile
  - Touch-friendly 44px minimum touch targets throughout
