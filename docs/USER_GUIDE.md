# User Guide

Practical guide for program coordinators and end users.

**IHK Abschlussprojekt**: Fachinformatiker/-in für Anwendungsentwicklung  
📄 [Technical Documentation](README.md)

---

## Quick Start

### First Time Setup

1. **Download & Install**
   - Ensure Node.js 18+ is installed
   - Download project or run: `npm install`

2. **Start Application**
   ```bash
   npm run dev
   ```
   - Opens at `http://localhost:5173`

3. **Select Data Folder**
   - Click "Select Data Folder" button
   - Choose a folder to store schedule data
   - Application creates `yearData_YYYY.json` files here

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

**IHK Abschlussprojekt 2025** | Fachinformatiker/-in für Anwendungsentwicklung

[⬆ Back to Top](#user-guide)

</div>
