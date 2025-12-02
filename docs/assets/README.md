# Screenshots Placeholder

## Required Screenshots

To complete documentation, capture these screenshots when application is running:

### 1. Main Interface
- **File**: `main-interface.png`
- **Show**: Full application with all tabs visible, People tab active
- **Include**: Theme switcher, folder indicator, navigation tabs

### 2. Schedule View
- **File**: `schedule-view.png`
- **Show**: Schedule tab with generated 4-week schedule
- **Include**: Week assignments, fairness scores, mentor indicators, substitutes

### 3. People Management
- **File**: `people-management.png`
- **Show**: People tab with list of participants
- **Include**: Experience levels, arrival dates, fairness metrics, action buttons

### 4. Schedule Generation Dialog
- **File**: `schedule-generation.png`
- **Show**: Schedule generation dialog with options
- **Include**: Date picker, weeks input, checkboxes for options

## Instructions

1. Start application: `npm run dev`
2. Add sample data (5-10 people)
3. Generate a sample schedule
4. Take screenshots:
   - Use browser dev tools (F12) → Device toolbar for consistent sizing
   - Recommended size: 1280x800
   - Save as PNG
5. Place in `docs/assets/` folder
6. Update references in documentation

## Where to Add

**README.md** - After "Features" section:
```markdown
## Screenshots

![Main Interface](docs/assets/main-interface.png)
*Main application interface with People management*

![Schedule View](docs/assets/schedule-view.png)
*Generated schedule with fairness optimization*
```

**USER_GUIDE.md** - Add screenshots inline with relevant sections:
- Main interface → Quick Start
- People management → Managing People
- Schedule view → Creating Schedules
- Generation dialog → Generate New Schedule

---

**Note**: This is a placeholder. Screenshots will be added when application is running with sample data.
