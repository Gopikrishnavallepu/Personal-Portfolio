# 📊 PART 7C: Build Risk Analysis Page — Detailed Step-by-Step

> **Time:** 20-30 minutes for complete Page 3
> **Order:** Scatter plot (center), histogram (left), bar chart (right)
> **Save after each section** (Ctrl+S)

---

## SECTION 1: Create New Page 3

### Step 1.1: Add a New Page

1. At the bottom of Power BI, right-click next to "Page 2" tab
2. Click **Insert Page** → **Blank Page**
3. New page appears → you're now on **Page 3**
4. Rename it: Right-click tab → **Rename** → type `Risk Analysis`

✅ **Result:** New page tab labeled "Risk Analysis"

---

### Step 1.2: Add Page Title

1. Click **Insert** → **Text Box**
2. Drag box at top (full width)
3. Type: `Risk Analysis — Exposure & Compliance`
4. Format:
   - Font size: 24
   - Bold: Yes
   - Color: Dark red or burgundy (risk theme)

✅ **Result:** Title for Page 3

---

## SECTION 2: Add Scatter Plot (Internet-Facing vs Age vs Severity)

### Step 2.1: Insert Scatter Chart

1. Click **Insert** → **Scatter Chart** (XY scatter)
2. Position: **bottom center**, spanning ~50% width
3. Height: ~350px

---

### Step 2.2: Configure Axes

**In FIELDS PANEL:**

1. Expand **Findings** table

**X-Axis (Horizontal):**
2. Drag `Days Open` → drop on **X Axis** area
   - ✅ X-axis shows age (0 days → 60+ days, left to right)

**Y-Axis (Vertical):**
3. Drag `Severity Order` → drop on **Y Axis** area
   - ✅ Y-axis shows severity (LOW=4 at bottom → CRITICAL=1 at top)

---

### Step 2.3: Add Size (Risk Score)

1. Expand **Findings** table
2. Drag `risk_score` → drop on **Size** area
   - ✅ Bubble size = risk score (bigger bubbles = higher risk)

---

### Step 2.4: Add Legend (Internet Facing)

1. Drag `internet_facing` → drop on **Legend** area
   - ✅ Legend shows "Yes" (red dots) and "No" (blue dots)
   - Internet-facing findings appear as red bubbles

**Result:** 
- **Left side:** Old, low-severity, low-risk (safe)
- **Right side:** New findings (short age)
- **Top area:** Critical findings (severity order = 1)
- **Top-right:** OLD + CRITICAL + INTERNET-FACING = HIGHEST RISK (red bubble, large)

---

### Step 2.5: Format Scatter Chart

1. Click chart → **Format**
   - Title: **ON** → "Risk Exposure Map: Age × Severity × Internet Facing"
   - Title Font Size: 13
   - X-axis label: "Days Open (Age)"
   - Y-axis label: "Severity (1=Critical)"
   - Legend: **ON** (right side)
   - Data labels: turn **OFF** (clean look)

2. **Colors:**
   - Internet-facing = "Yes" → Red (#FF0000)
   - Internet-facing = "No" → Blue (#0066CC)

---

### Step 2.6: Interpretation Guide (Add Text Box)

Below the scatter chart, add a small text box:

```
Red bubbles (top-right) = HIGHEST RISK: old, critical, internet-exposed
Blue bubbles (bottom-left) = LOWEST RISK: new, low-severity, internal only
Focus remediation on largest red bubbles.
```

✅ **Result:** Scatter plot showing risk landscape visually

---

## SECTION 3: Add Histogram (Finding Age Distribution)

### Step 3.1: Insert Histogram

1. Click **Insert** → **Histogram** (bin/distribution chart)
2. Position: **left side** of page, below title
3. Width: ~40%
4. Height: ~300px

---

### Step 3.2: Configure Histogram

In **FIELDS PANEL:**

1. Expand **Findings**
2. Drag `Days Open` → drop on **Axis** area
   - ✅ Histogram groups findings by age buckets (0-7, 8-30, 31-60, 60+ days)

**OR** if histogram auto-fails, use **Bar Chart** instead:

1. Click **Insert** → **Bar Chart** (horizontal)
2. Drag `Age Bucket` → Axis
3. Drag `Total Findings` → Value
   - Shows: 0-7 days, 8-30 days, 31-60 days, 60+ days

---

### Step 3.3: Format Histogram

1. Click chart → **Format**
   - Title: **ON** → "Finding Age Distribution"
   - Title Font Size: 12
   - X-axis label: "Age (Days)"
   - Y-axis label: "Count"
   - Bar color: Blue
   - Data labels: **ON** (show counts on bars)

---

### Step 3.4: Interpretation

- **Tall bar on left (0-7 days):** New findings = good (active scanning)
- **Tall bar on right (60+ days):** Old findings = BAD (backlog aging)

✅ **Result:** Shows how old your backlog is

---

## SECTION 4: Add Bar Chart (Risk by Business Unit)

### Step 4.1: Insert Bar Chart

1. Click **Insert** → **Bar Chart** (horizontal)
2. Position: **right side** of page, same row as histogram
3. Width: ~40%
4. Height: ~300px

---

### Step 4.2: Configure Chart

In **FIELDS PANEL:**

1. Expand **Assets** table
2. Drag `business_unit` → drop on **Axis** area
   - ✅ Chart shows: Finance, Engineering, Operations, Marketing, etc.

3. Expand **Measures**
4. Drag `Total Risk Score` → drop on **Value**
   - ✅ Bars show total risk per business unit

**Alternative** (if Total Risk Score unavailable):
- Drag `Total Findings` to Value instead

---

### Step 4.3: Format Chart

1. Click chart → **Format**
   - Title: **ON** → "Risk by Business Unit"
   - Title Font Size: 12
   - X-axis label: "Risk Score" (or "Finding Count")
   - Y-axis label: "Business Unit"
   - Sort: Descending (highest risk at top)
   - Bar color: Orange or red

2. **Data labels**: turn **ON** (show values)

---

### Step 4.4: Interpretation

- **Longest bar:** Business unit with most risk = needs attention
- **Shortest bar:** Least risky unit = good hygiene

✅ **Result:** Shows which teams/departments have worst security posture

---

## SECTION 5: Add Slicers to Filter All Visuals

### Step 5.1: Add Severity Slicer

1. Click **Insert** → **Slicer**
2. Drag `Findings[severity]` onto it
3. Position: **Top-right corner**
4. Format: Show checkboxes
5. Users can now filter to see only CRITICAL findings, or HIGH + CRITICAL, etc.

---

### Step 5.2: Add Environment Slicer

1. Click **Insert** → **Slicer**
2. Drag `Assets[environment]` onto it
3. Position: **Below severity slicer**
4. Shows: Prod, Staging, Dev
5. Users can now filter by environment

---

### Step 5.3: Add Category Slicer (Optional)

1. Click **Insert** → **Slicer**
2. Drag `Findings[category]` onto it (if available)
3. Position: **Below environment slicer**
4. Shows: Network, IAM, Storage, Compute, etc.

---

## SECTION 6: Final Page Layout

### Expected Final Layout (Page 3):

```
┌────────────────────────────────────────────────────────────────┐
│    Risk Analysis — Exposure & Compliance                       │
├──────────────────────────────────────────────┬─────────────────┤
│                                              │ ☐ CRITICAL     │
│   Risk Exposure Map (Scatter)                │ ☐ HIGH         │
│   ╱ (top-right = highest risk)              │ ☐ MEDIUM       │
│  ╱╱ ●●                                      │ ☐ LOW          │
│ ╱ ●●●                                      │                 │
│●  ●                                         │ ☐ Prod         │
│    Red = Internet-exposed, Blue = Internal │ ☐ Staging      │
│                                              │ ☐ Dev          │
├──────────────────────┬──────────────────────┤                 │
│ Finding Age          │ Risk by Business Unit│                 │
│ Distribution         │                      │ ☐ Network      │
│ ▓▓▓▓ (0-7 days)     │ ▓▓▓▓▓ Finance (45)  │ ☐ IAM          │
│ ▓▓▓ (8-30 days)     │ ▓▓▓▓ Eng (35)       │ ☐ Storage      │
│ ▓▓ (31-60 days)     │ ▓▓▓ Ops (22)        │                 │
│ ▓▓▓▓▓ (60+ days)    │ ▓ Mkt (8)          │                 │
│                      │                      │                 │
└──────────────────────┴──────────────────────┴─────────────────┘
```

---

## ✅ CHECKLIST — Page 3 Complete

- [ ] Page 3 created and named "Risk Analysis"
- [ ] Title added and formatted
- [ ] Scatter plot (Age × Severity × Internet-facing)
- [ ] Histogram or bar chart (Finding age distribution)
- [ ] Horizontal bar chart (Risk by business unit)
- [ ] Slicers added (Severity, Environment, Category)
- [ ] All visuals positioned and sized
- [ ] File saved (Ctrl+S)

---

## 🎯 TROUBLESHOOTING

### Problem: "Scatter chart shows error 'field invalid'"
**Solution:**
- Make sure `Severity Order` column exists in Findings
- If not, go to Model → Findings → add column via formula:
  ```
  Severity Order = IF([severity]="CRITICAL",1,IF([severity]="HIGH",2,IF([severity]="MEDIUM",3,4)))
  ```

### Problem: "Histogram shows wrong grouping"
**Solution:**
- Use **Bar Chart** instead with `Age Bucket` column
- Make sure Age Bucket exists (Part 4 of main guide)

### Problem: "Business unit chart shows wrong data"
**Solution:**
- Verify Assets table has `business_unit` column
- Check Data view → Assets → see values
- Refresh data if needed

### Problem: "Slicers not filtering all visuals"
**Solution:**
- Right-click slicer → **Edit interactions**
- Ensure "Apply to all visuals" is enabled
- Check all visuals use same tables (Findings, Assets)

---

## 🚀 ALL 3 PAGES COMPLETE!

Once Page 3 is done:
1. **Save** (Ctrl+S)
2. Go back to **Page 1** to verify title, cards, chart
3. Go to **Page 2** to verify trend line, matrix, gauge
4. Go to **Page 3** to verify scatter, histograms, slicers

---

## 📌 Pro Tips

- **Cross-page slicers:** Add same slicer on all 3 pages so users can filter globally
- **Bookmarks:** Create "snapshot" views (e.g., "Critical Findings Only")
- **Q&A visual:** Insert → Q&A to let users ask questions naturally
- **Export:** File → Export to save as PDF or PowerPoint

---

## 🎉 FINAL REPORT STRUCTURE

```
PAGE 1: Executive Summary
  ├─ 4 KPI cards (Total, Open, Critical, SLA%)
  ├─ Findings by Severity (bar chart)
  └─ Top Open Findings (table)

PAGE 2: Operational Health
  ├─ Trend line (Open vs Closed over time)
  ├─ Matrix (Team SLA performance)
  └─ Gauge (SLA Compliance %)

PAGE 3: Risk Analysis
  ├─ Scatter plot (Age × Severity × Internet-facing)
  ├─ Histogram (Age distribution)
  ├─ Bar chart (Risk by business unit)
  └─ Slicers (Severity, Environment, Category)
```

---

## 📋 Next: Publish & Share

Once all 3 pages are complete and look good:

**Option A: Save locally**
- File → Save → `CSPM_MCP_Report.pbix`

**Option B: Publish to Power BI Service**
- File → Publish
- Select workspace
- Set up scheduled refresh (daily at 6 AM)
- Share link with team

✅ **Your executive dashboard is ready to present!** 🚀

