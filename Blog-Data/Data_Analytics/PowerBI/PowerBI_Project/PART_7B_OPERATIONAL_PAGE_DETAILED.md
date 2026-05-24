# 📈 PART 7B: Build Operational Page — Detailed Step-by-Step

> **Time:** 20-30 minutes for complete Page 2
> **Order:** Trend line (top), matrix (bottom-left), gauge (bottom-right)
> **Save after each section** (Ctrl+S)

---

## SECTION 1: Create New Page 2

### Step 1.1: Add a New Page

1. At the bottom of Power BI (where it says "Page 1"), right-click in empty space
2. Click **Insert Page** → **Blank Page**
3. A new page appears → now you're on **Page 2**
4. Rename it: Right-click tab → **Rename** → type `Operational Health`

✅ **Result:** New page tab labeled "Operational Health"

---

### Step 1.2: Add Page Title

1. Click **Insert** → **Text Box**
2. Drag box at top (full width)
3. Type: `Operational Health — SLA & Remediation`
4. Format:
   - Font size: 24
   - Bold: Yes
   - Color: Dark green or teal

✅ **Result:** Title for Page 2

---

## SECTION 2: Add Trend Line Chart (Open vs Closed Findings)

### Step 2.1: Insert Line Chart

1. Click **Insert** → **Line Chart**
2. Position: **full width**, below title, **top half** of page

---

### Step 2.2: Configure Axis (Time)

In **FIELDS PANEL** (right side):

1. Expand **DateTable** folder
2. Drag `YearMonth` → drop on **Axis** area of chart
   - ✅ X-axis now shows months (e.g., 2024-12, 2025-01, etc.)

---

### Step 2.3: Add Two Lines (Open & Closed Trends)

1. Expand **Measures** table
2. Drag `Open Findings` → drop on **Values**
   - ✅ First line appears (blue, showing Open count over time)
3. Drag `Closed Findings` → drop on **Values**
   - ✅ Second line appears (orange, showing Closed count over time)
4. Optional: Drag `Total Findings` → drop on **Values**
   - ✅ Third line (gray, total)

---

### Step 2.4: Format Chart

1. Click chart → **Format** (paintbrush)
   - Title: **ON** → "Findings Opened vs Closed — Monthly Trend"
   - Title Font Size: 14
   - Legend: **ON** (bottom or right)
   - X-axis labels: turn **ON**
   - Y-axis labels: turn **ON**
   - Line style: Solid
   - Data labels: turn **OFF** (for clean look)

2. **Colors** (optional):
   - Open Findings line → Red
   - Closed Findings line → Green
   - Total Findings line → Gray

✅ **Result:** Line chart with 2-3 trends, clear legend, title

---

### Step 2.5: Resize and Position

- Width: **Full page width** (or 95%)
- Height: **250px**
- Position: Top of page, below title

---

## SECTION 3: Add Matrix (SLA Status by Team)

### Step 3.1: Insert Matrix

1. Click **Insert** → **Matrix**
2. Position: **bottom-left**, under the trend line
3. Width: ~45% of page
4. Height: ~250px

---

### Step 3.2: Configure Matrix (Rows & Columns)

**In FIELDS PANEL:**

1. Expand **Tickets** table
2. Drag `assignment_group` → drop on **Rows** area
   - ✅ Matrix shows rows: Infrastructure, Security, Platform, Networking, etc. (your teams)
3. Drag `sla_status` → drop on **Columns** area
   - ✅ Matrix shows columns: Met, Missed, On Track, Breached

---

### Step 3.3: Add Values (Count)

1. Expand **Measures** table
2. Drag `Total Findings` → drop on **Values**
   - ✅ Matrix cells now show counts (Team × SLA Status)

**Example output:**
```
                 Met    Missed  On Track  Breached
Infrastructure    5      2       8         1
Security          3      1       4         2
Platform          2      3       2         1
Networking        0      2       1         0
```

---

### Step 3.4: Format Matrix

1. Click matrix → **Format**
   - Title: **ON** → "SLA Performance by Team"
   - Title Font Size: 12
   - Row headers font size: 11
   - Column headers font size: 11

2. **Conditional formatting** (optional):
   - High values (Met, On Track) → Green background
   - Low values (Missed, Breached) → Red background
   - Format → Conditional Formatting → Background Color

✅ **Result:** Matrix showing team SLA performance

---

## SECTION 4: Add Gauge Chart (SLA Compliance Target)

### Step 4.1: Insert Gauge

1. Click **Insert** → **Gauge Chart**
2. Position: **bottom-right**, same row as matrix
3. Width: ~45% of page
4. Height: ~250px

---

### Step 4.2: Configure Gauge

In **FIELDS PANEL:**

1. Expand **Measures**
2. Drag `SLA Compliance %` → drop on **Value** area
   - ✅ Gauge needle appears pointing to current value

---

### Step 4.3: Set Target & Min/Max

1. Click gauge → **Format**
   - Title: **ON** → "SLA Compliance Goal: 90%"
   - Title Font Size: 12

2. **Gauge settings:**
   - Min: 0
   - Max: 100
   - Target value: 90 (your goal)
   - Current value: auto (from SLA Compliance % measure)

3. **Colors:**
   - Red zone: 0-50 (danger)
   - Yellow zone: 50-80 (caution)
   - Green zone: 80-100 (good)

4. **Data labels**: turn **ON**

✅ **Result:** Gauge showing current SLA % vs 90% target

---

## SECTION 5: Finalize Page 2

### Step 5.1: Add Slicers (Optional but Recommended)

Slicers let viewers filter by category, so they can see data for one team or severity level.

1. Click **Insert** → **Slicer** (dropdown/list)
2. Drag `Findings[severity]` onto it
   - ✅ Shows: CRITICAL, HIGH, MEDIUM, LOW (checkboxes)
   - Users can click to filter all visuals

3. Add another slicer: `Tickets[assignment_group]`
   - ✅ Users can filter by team

Position both slicers on the **right side** below the gauge.

---

### Expected Final Layout (Page 2):

```
┌──────────────────────────────────────────────────────────────┐
│    Operational Health — SLA & Remediation                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Findings Opened vs Closed — Monthly Trend                  │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  ╱╲       ╱╲        ╱╲      ╱╲                         │ │
│   │ ╱  ╲    ╱    ╲    ╱    ╲  ╱    ╲  (lines trending)    │ │
│   │ ─────────────────────────────────── (X: months)       │ │
│   └────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────┬──────────────────────┤
│  SLA Performance by Team             │  SLA Compliance     │
│  Team│ Met│Missed│On Track│Breached │  Goal: 90%          │
│ Infra│ 5  │ 2   │ 8    │ 1       │    ╱─ ← 50% (needle) │
│ Sec  │ 3  │ 1   │ 4    │ 2       │   │ G │                │
│ Plat │ 2  │ 3   │ 2    │ 1       │   ╲─                   │
│ Net  │ 0  │ 2   │ 1    │ 0       │                        │
│                                    │   Red  Yellow Green  │
├──────────────────────────────────────┴──────────────────────┤
│ Severity: ☐ CRITICAL  ☐ HIGH  ☐ MEDIUM  ☐ LOW             │
│ Team:     ☐ Infra     ☐ Sec   ☐ Plat    ☐ Net             │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST — Page 2 Complete

- [ ] Page 2 created and named "Operational Health"
- [ ] Title added and formatted
- [ ] Trend line chart (Open vs Closed, 2+ lines)
- [ ] Matrix (Teams × SLA Status)
- [ ] Gauge chart (SLA Compliance % vs 90% target)
- [ ] Slicers added (Severity, Team) optional
- [ ] All visuals positioned and sized
- [ ] File saved (Ctrl+S)

---

## 🎯 TROUBLESHOOTING

### Problem: "Trend line shows no data"
**Solution:**
- Check DateTable was created and marked as Date table
- Verify created_date column in Findings is Date type
- Right-click chart → **Reset visual** → re-add fields

### Problem: "Matrix is empty"
**Solution:**
- Drag `assignment_group` to Rows
- Drag `sla_status` to Columns
- Ensure you have a measure in Values (e.g., Total Findings)

### Problem: "Gauge shows 0%"
**Solution:**
- Check SLA Compliance % measure is correct
- Verify Tickets table has sla_status = "Met" values
- Re-create measure if needed (Part 6 of main guide)

### Problem: "Slicer not filtering other visuals"
**Solution:**
- Ensure all visuals use the same tables (Findings/Tickets)
- Check cross-filter settings: right-click slicer → Edit interactions

---

## 🚀 NEXT

Once Page 2 is built:
1. **Save** (Ctrl+S)
2. Go to **Part 7C** to build **Page 3: Risk Analysis**
3. Follow same step-by-step process

---

## 📌 Pro Tips

- **Sync slicers:** If you add same slicer on multiple pages, users can filter across all
- **Drill-through:** Right-click matrix cell → drill through to see detail
- **Mobile view:** Format → Mobile layout to optimize for phones
- **Export:** File → Export → PDF to share report as read-only

✅ Build Page 2 using this guide, then move to **Part 7C for final page!**

