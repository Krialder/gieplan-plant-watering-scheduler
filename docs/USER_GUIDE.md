# User Guide

Practical guide for program coordinators and end users.

📄 [Technical Documentation](README.md)

---

## Quick Start

### First Time Setup

#### Step 1: Install Node.js

1. Visit [https://nodejs.org/](https://nodejs.org/)
2. Download **LTS version** (recommended)
3. Run installer
   - Accept default settings
   - Check "Automatically install necessary tools"
4. Restart computer after installation

**Verify installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

---

#### Step 2: Get GießPlan

**Option A: Download ZIP**
1. Go to [GitHub Repository](https://github.com/Krialder/gieplan-plant-watering-scheduler)
2. Click green "Code" button → "Download ZIP"
3. Extract to folder (e.g., `C:\Users\YourName\gieplan`)

**Option B: Clone with Git**
```bash
git clone https://github.com/Krialder/gieplan-plant-watering-scheduler.git
cd gieplan-plant-watering-scheduler
```

---

#### Step 3: Run Setup (Windows)

1. Open folder in File Explorer
2. Double-click `setup.bat`
   - Command window opens
   - Dependencies install (1-3 minutes)
   - **Some tests may fail - this is okay!**
   - Wait for "Setup complete!"

---

#### Step 4: Start Application

1. Double-click `run.bat`
   - Development server starts
   - Browser opens automatically
   - You'll see GießPlan interface

2. **Keep command window open** while using app
   - Closing it stops the server

---

#### Step 5: Configure Data Storage

**First time you open GießPlan:**

1. Click **"Select Data Folder"** button

2. Browser shows permission dialog:
   - "gieplan wants to access files"
   - Click **"View files"**
   - Click **"Allow"**

3. Choose where to save data:
   - Create new folder: `C:\Users\YourName\GießPlan-Data`
   - Or select existing folder
   - Click **"Select Folder"**

4. ✅ **Setup complete!** GießPlan creates `yearData_2025.json` automatically

---

### What Each File Does

- `setup.bat` - Installs dependencies (run once)
- `run.bat` - Starts application (run every time)
- `package.json` - Project configuration
- `src/` - Application code
- `Test/` - Automated tests

**Data files** are created in your chosen folder:
- `yearData_2025.json` - All schedules and people for 2025
- `yearData_2026.json` - Data for 2026 (created when needed)

---

### Expected Behavior

**When running setup.bat:**
```
✓ Node.js found
✓ Installing dependencies...
✓ Running tests...
  ⚠ Some tests failed (expected)
✓ Setup complete!
```

**When running run.bat:**
```
> gieplan@1.0.0 dev
> vite

  VITE v6.3.0  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Browser opens showing:**
- GießPlan logo
- Four tabs: People, Schedule, Manual, Data
- "Select Data Folder" button (if first run)

---

**You're ready to use GießPlan!**

---

## Common Tasks

### Managing People

#### Add New Person
1. Go to **People** tab
2. Click **Add Person** button
3. Fill in:
   - **Name**: Full name (e.g., "Anna Schmidt")
   - **Arrival Date**: First day in program
   - **Expected Departure**: (Optional) Planned last day
4. Click **Save**

**Automatic**: System tracks experience level (experienced after 90 days + 4 assignments)

⚠️ **Important**: Add people BEFORE generating schedules. If you add someone after generating a schedule that starts on their arrival date, their fairness tracking will be inaccurate until you regenerate. See "Important Timing Considerations" below for details.

#### Edit Person Details
1. Find person in list
2. Click **Edit** icon
3. Update information
4. Click **Save**

#### Mark Person as Departed
1. Find person in list
2. Click **Departure** icon
3. Enter departure date and optional reason
4. Click **Confirm**

**Note**: Person stays in records but becomes inactive

#### Person Returns
1. Find departed person
2. Click **Return** icon
3. Enter return date
4. Click **Confirm**

**System creates new program period**

---

### Creating Schedules

#### Generate New Schedule
1. Go to **Schedule** tab
2. Click **Generate Schedule** button
3. Configure:
   - **Start Date**: First Monday of schedule
   - **Number of Weeks**: 1-52 weeks
   - **Options**:
     - ☑ Prevent consecutive weeks (recommended)
     - ☑ Require mentor in team (recommended)
     - ☐ Include future arrivals
4. Click **Generate**

**System automatically**:
- Assigns 2 people per week
- Ensures fair distribution
- Pairs new participants with experienced mentors
- Prevents same person multiple weeks in a row

#### View Schedule
- Scroll through week-by-week assignments
- See assigned people and substitutes
- Check fairness scores
- View mentor status

#### Add Comment to Week
1. Click on specific week
2. Click **Add Comment**
3. Enter note (e.g., "Holiday week")
4. Click **Save**

---

### Manual Adjustments

#### Replace Person in Week
1. Go to **Manual** tab
2. Select schedule and week
3. Click **Replace** next to person's name
4. Select replacement person
5. Click **Confirm**

**System updates fairness metrics automatically**

#### Emergency Override
When normal scheduling isn't possible:
1. Click **Emergency Override** on week
2. Manually select people
3. Enter reason (required)
4. Click **Confirm**

**Use sparingly** - affects fairness tracking

---

### Data Management

#### Export Data

**JSON Format** (backup):
1. Go to **Data** tab
2. Click **Export JSON**
3. Save file
4. Use for backup/restore

**CSV Format** (spreadsheet):
1. Click **Export CSV**
2. Open in Excel/Google Sheets
3. Use for reports/analysis

**Excel Format** (formatted):
1. Click **Export Excel**
2. Get formatted workbook
3. Ready for printing/sharing

#### Import Data
1. Click **Import** button
2. Select JSON file
3. Review preview
4. Click **Confirm Import**

**Warning**: Imports merge with existing data

#### Change Data Folder
1. Click **Change Folder**
2. Select new folder
3. Application reloads data

**Previous folder data not affected**

---

## Understanding Fairness

### Fairness Metrics

**Temporal Fairness Score** (1.0 = perfect):
- Measures overall fairness
- Accounts for time in program
- Lower = person needs more assignments

**Assignments Per Day**:
- How often person is assigned
- Higher = more workload

**Cross-Year Fairness Debt**:
- Unfairness carried from previous year
- Negative = person deserves priority

**Mentorship Burden**:
- Extra credit for mentoring new people
- Reduces assignment requirement

### Experience Levels

**New**:
- Less than 90 days in program, OR
- Fewer than 4 assignments
- Needs mentor in team

**Experienced**:
- 90+ days in program, AND
- 4+ assignments completed
- Can mentor new participants

---

## Tips & Best Practices

### Scheduling

✅ **Generate in advance**: Create 4-8 week schedules  
✅ **Check mentor coverage**: Ensure experienced people available  
✅ **Review fairness**: Check metrics before finalizing  
✅ **Add comments**: Note holidays, special circumstances  

❌ **Avoid**: Generating too far ahead (people change)  
❌ **Avoid**: Too many manual overrides (breaks fairness)  

### Person Management

✅ **Update departures**: Mark people when they leave  
✅ **Plan ahead**: Enter expected departure dates  
✅ **Use return feature**: For people coming back  

❌ **Avoid**: Deleting people (breaks history)  
❌ **Avoid**: Duplicate entries for same person  

### ⚠️ Important Timing Considerations

**Critical: Adding People After Schedule Generation**

If you generate a schedule FIRST, then add a person with an arrival date matching the schedule's start date, their fairness scores will be incorrect until the next schedule generation.

**Why this happens:**
- The system tracks when each person first becomes "eligible for scheduling" (`firstSchedulingDate`)
- This date is only set when a person enters the selection pool during schedule generation
- If you add someone retroactively with an arrival date that matches an existing schedule week, the system doesn't know they were "available" during those weeks
- Their fairness calculations will show 0 days present until they're included in a new generation

**Example Problem:**
1. Dec 2: Generate schedule for weeks starting Dec 2, Dec 9, Dec 16
2. Dec 3: Add new person "Dave" with arrival date = Dec 2
3. Dave's fairness score shows incorrectly because system thinks he has 0 scheduling days
4. Dec 9: Generate new schedule → Dave's `firstSchedulingDate` is now set to Dec 9 (not Dec 2!)
5. Dave is now missing 7 days of fairness tracking

**Best Practice:**
- ✅ **Add all people BEFORE generating schedules**
- ✅ **If you must add someone retroactively:**
  1. Delete the existing schedule(s) that overlap their arrival date
  2. Add the person
  3. Regenerate the schedule from their arrival date forward
  4. This ensures their fairness tracking is accurate from day one

**Alternative (if you can't delete schedules):**
- Accept that the person's fairness score will be slightly off
- The system will correct itself over time as new schedules are generated
- The impact diminishes as more weeks pass  

### Data Safety

✅ **Regular backups**: Export JSON monthly  
✅ **Consistent folder**: Keep same data folder  
✅ **Multiple exports**: CSV for reporting, JSON for backup  

❌ **Avoid**: Switching folders unnecessarily  
❌ **Avoid**: Editing JSON files manually  

---

## Troubleshooting

### "Not enough people for scheduling"
**Cause**: Less than 2 active people  
**Fix**: Add more people or adjust date range

### "No experienced mentor available"
**Cause**: All experienced people unavailable  
**Fix**: 
- Disable "Require mentor" option, OR
- Wait for experienced person to return, OR
- Use emergency override

### "Fairness constraint violation"
**Cause**: Generated schedule too unequal  
**Fix**: System automatically adjusts - review and accept

### "Person shows 0 fairness score / assignments per day incorrect"
**Cause**: Person was added AFTER schedule generation with arrival date matching an existing schedule week  
**Root issue**: System sets `firstSchedulingDate` only during generation, not retroactively  
**Fix**: 
1. **Recommended**: Delete overlapping schedules, then regenerate from person's arrival date
2. **Alternative**: Accept temporary inaccuracy - will self-correct over 2-3 schedule generations
3. **Prevention**: Always add people BEFORE generating schedules (see "Important Timing Considerations" above)

**Technical explanation**: 
The fairness engine tracks how many "scheduling days" each person has been in the selection pool. When you add someone after generating a schedule, even if their arrival date is Dec 2 and a schedule exists starting Dec 2, the system doesn't retroactively mark them as "available" for those weeks. Their `firstSchedulingDate` stays unset (0 days) until they're included in a generation. This makes their assignment rate calculation (assignments ÷ scheduling days) incorrect.

### Schedule looks unbalanced
**Cause**: Recent changes, new people  
**Fix**: System self-corrects over time (3-4 weeks)

### Person not appearing in selection
**Check**:
- Person is active (not departed)
- Person available on week date
- Person not assigned consecutive weeks

### Data not saving
**Check**:
- Data folder selected
- Write permissions on folder
- No file errors in browser console

---

## Keyboard Shortcuts

- **Tab** + Click name: Edit person quickly
- **Ctrl+F**: Find person in list
- **Esc**: Close dialogs
- **Ctrl+S**: Save changes (in edit dialogs)

---

## Getting Help

**Issues**: [GitHub Issues](https://github.com/Krialder/gieplan-plant-watering-scheduler/issues)  
**Questions**: [GitHub Discussions](https://github.com/Krialder/gieplan-plant-watering-scheduler/discussions)  
**Documentation**: [docs/README.md](README.md)

---

<div align="center">

[⬆ Back to Top](#user-guide)

</div>
