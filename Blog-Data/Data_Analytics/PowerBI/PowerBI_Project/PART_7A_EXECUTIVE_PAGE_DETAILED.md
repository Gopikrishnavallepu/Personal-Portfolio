# 📊 PART 7A: Build Executive Summary Page — Detailed Step-by-Step

> **Time:** 20-30 minutes for complete Page 1
> **Order:** Build cards first (top), then chart (left), then table (bottom-right)
> **Save after each section** (Ctrl+S)

---

## SECTION 1: Add Title + 4 KPI Cards

### Step 1.1: Add Page Title

In Power BI, you should see:
- **Report canvas** (large blank area on right)
- **Ribbon** (top with Home, Insert, etc.)
- **Fields panel** (right side with table names)

1. Click **Insert** ribbon → **Text Box**
2. Click-drag a box at the very top (span full width)
3. Type: `Executive Security Dashboard`
4. Format:
   - Font size: 28
   - Bold: Yes
   - Color: Dark blue

✅ **Result:** Large title at top of page

---

### Step 1.2: Add Card 1 — Total Findings

1. Click **Insert** → **Card**
2. A blank card appears on canvas
3. Look at **Fields panel** (right) → expand **Measures** folder
4. **Drag** `Total Findings` measure onto the card
   - (Card should auto-populate with a number like "50")
5. Click on the card → **Format** (paintbrush icon in ribbon)
   - Title: turn **ON** → "Total Findings"
   - Font size: 14
   - Data: Number format to **Whole Number**
6. Resize card to ~250px wide × 150px tall
7. Position: top-left area below title

✅ **Result:** Card showing "50" or similar with title "Total Findings"

---

### Step 1.3: Add Card 2 — Open Findings

Repeat exactly like Step 1.2, but:
1. Click **Insert** → **Card**
2. Drag `Open Findings` (from Measures) onto this new card
3. Format title: "Open Findings"
4. Position: next to Card 1 (same row)

✅ **Result:** Card showing "40" or similar

---

### Step 1.4: Add Card 3 — Critical Open

Repeat:
1. Click **Insert** → **Card**
2. Drag `Critical Open` onto this card
3. Title: "Critical Open"
4. Position: row 1, third position

✅ **Result:** Card showing "8" or similar

---

### Step 1.5: Add Card 4 — SLA Compliance %

Repeat:
1. Click **Insert** → **Card**
2. Drag `SLA Compliance %` onto this card
3. Title: "SLA Compliance %"
4. Position: row 1, far right

✅ **Result:** Card showing percentage like "50%" or "48%"

---

### Expected Layout After Step 1:

```
┌─────────────────────────────────────────────────────────────┐
│            Executive Security Dashboard                      │
├─────────────┬──────────────┬──────────────┬──────────────────┤
│  Total      │    Open      │   Critical   │   SLA Compliance │
│ Findings    │  Findings    │    Open      │       %          │
│     50      │      40      │       8      │       50%        │
└─────────────┴──────────────┴──────────────┴──────────────────┘
```

---

## SECTION 2: Add Bar Chart (Findings by Severity)

### Step 2.1: Insert Bar Chart

1. Click **Insert** → **Bar Chart** (horizontal bars)
2. A blank chart appears on canvas below the cards
3. Position below the 4 cards, spanning **left half** of page

---

### Step 2.2: Configure the Chart

**On the CANVAS:** chart is blank — we need to add data

**In FIELDS PANEL (right side):**

1. Expand **Findings** table (click arrow)
2. Find column **severity**
   - Drag `severity` → drop it on **Axis** area (bottom-left of chart)
   - ✅ Chart shows 4 bars: CRITICAL, HIGH, MEDIUM, LOW
3. Expand **Measures** table
4. Find **Total Findings** measure
   - Drag `Total Findings` → drop it on **Value** area
   - ✅ Bars now show counts (e.g., CRITICAL = 11, HIGH = 16, etc.)

---

### Step 2.3: Format the Chart

1. Click on the chart → **Format** (paintbrush)
   - Title: **ON** → "Findings by Severity"
   - Title Font Size: 16
   - X-axis labels: turn **ON**, size 11
   - Y-axis labels: turn **ON**, size 11
2. Colors:
   - CRITICAL → Red
   - HIGH → Orange
   - MEDIUM → Yellow
   - LOW → Green
   - (Format → Data colors → set each)

✅ **Result:** Horizontal bar chart with labeled bars, title "Findings by Severity"

---

### Step 2.4: Resize and Position

- Drag edges to make it take **left half** (width ~400px)
- Height ~300px
- Position: below cards, left side

---

## SECTION 3: Add Table (Top Open Findings)

### Step 3.1: Insert Table

1. Click **Insert** → **Table**
2. A blank table appears on canvas
3. Position: **right side**, same row as the bar chart

---

### Step 3.2: Add Columns to Table

In **FIELDS PANEL:**

Expand **Findings** table, then drag these columns **one by one** onto the table:
1. `finding_id` (first column)
2. `severity` (second column)
3. `status` (third column, should show "Open")
4. `Days Open` (fourth column, should show age)

✅ **Result:** Table showing 4 columns with all Findings rows

---

### Step 3.3: Add Filters (Show Only Open Findings)

We want to show only `status = "Open"` and oldest first.

1. In the table, look for **Filters** area (above the table)
2. Expand **Findings** → drag `status` to **Filters on this visual**
3. Click the filter → select **"Open"** only → **Apply**
   - ✅ Table now shows only Open findings

4. Click column header **Days Open** → **Sort descending** (down arrow)
   - ✅ Oldest findings appear first

---

### Step 3.4: Format Table

1. Click on table → **Format**
   - Title: **ON** → "Top Open Findings"
   - Title Font Size: 14
   - Row height: 25px
   - Alternate row color: Light gray

---

### Step 3.5: Resize and Position

- Width: ~400px
- Height: ~300px
- Position: right side of page, same row as bar chart

---

## SECTION 4: Final Layout

### Expected page appearance:

```
┌─────────────────────────────────────────────────────────────────┐
│          Executive Security Dashboard                            │
├────────────┬──────────────┬──────────────┬─────────────────────┤
│  Total     │  Open        │  Critical    │  SLA Compliance     │
│ Findings   │ Findings     │  Open        │  %                  │
│    50      │     40       │      8       │      50%            │
├────────────────────────────────────┬──────────────────────────────┤
│                                    │                              │
│   Findings by Severity             │  Top Open Findings           │
│   ▓▓▓▓▓▓▓ CRITICAL (11)           │  ID  │ Severity │ Days Open │
│   ▓▓▓▓▓▓▓▓▓ HIGH (16)             │ W001 │ CRITICAL │    60     │
│   ▓▓▓▓▓▓ MEDIUM (14)              │ W002 │ CRITICAL │    45     │
│   ▓ LOW (5)                        │ W003 │   HIGH   │    38     │
│                                    │ ...  │   ...    │   ...     │
│                                    │                              │
└────────────────────────────────────┴──────────────────────────────┘
```

---

## ✅ CHECKLIST — Page 1 Complete

- [ ] Title added and formatted
- [ ] Card 1: Total Findings (shows ~50)
- [ ] Card 2: Open Findings (shows ~40)
- [ ] Card 3: Critical Open (shows ~8)
- [ ] Card 4: SLA Compliance % (shows ~50%)
- [ ] Bar chart: Findings by Severity (4 bars with colors)
- [ ] Table: Top Open Findings (filtered to Open, sorted by age)
- [ ] All visuals positioned and sized
- [ ] File saved (Ctrl+S)

---

## 🎯 TROUBLESHOOTING

### Problem: "Chart shows no data"
**Solution:**
- Right-click chart → **Reset visual**
- Re-drag fields from Fields panel

### Problem: "Table is empty"
**Solution:**
- Check if `status` filter is set correctly
- Expand Findings filter → check "Open" is selected

### Problem: "Measure shows error"
**Solution:**
- Go to Model view (left sidebar)
- Click Measures table → right-click measure → **Delete**
- Re-add it with exact formula from guide (Part 6)

### Problem: "Cards show 0 or blank"
**Solution:**
- Check your CSV files have data in `PowerBI_Project/data/` folder
- Verify Data view shows rows (not empty)

---

## 🚀 NEXT STEPS

Once Page 1 looks good:
1. **Save** (Ctrl+S)
2. **Add Page 2** (Operational) — click **+** icon at bottom
3. Follow Part 7B for chart + matrix + gauge
4. **Add Page 3** (Risk Analysis) — scatter plot

---

## 📌 Pro Tips

- **Use Format painter** (paintbrush) to copy formatting to other visuals
- **Align visuals** via ribbon: Format → Align → Left/Right/Center
- **Group visuals** together for easier moving
- **Test your slicers** by clicking values in table/chart (should auto-filter)

✅ Ready to build Page 1? Follow each step above and reply with any issues!

