# 🏗️ POWER BI DASHBOARD PROJECT — Security Findings Management

> **Complete, hands-on project to build a production-quality dashboard**
> **Mapped to Wells Fargo JD: CSPM/CWPP Findings Management + SLA Tracking**

---

# PROJECT OVERVIEW

```
WHAT YOU'LL BUILD:

A 3-page Power BI dashboard that answers:
1. "What is our current cloud security posture?" → Executive Summary
2. "Which teams need help?"                     → Team Performance
3. "What are the riskiest findings?"            → Finding Details

DATA SOURCES (included in /data/ folder):
├── wiz_findings.csv     → 50 security findings (Azure + GCP)
├── cmdb_assets.csv      → 30 CMDB configuration items with owners
└── servicenow_tickets.csv → 50 ServiceNow tickets with SLA data

TIME TO COMPLETE: 3-4 hours
SKILL LEVEL: Beginner → Intermediate
```

---

# STEP 1: INSTALL & SETUP

## 1.1 Install Power BI Desktop (Free)

```
1. Go to: https://powerbi.microsoft.com/en-us/desktop/
2. Click "Download free" → install
3. Sign in with Microsoft account (free — use any Outlook/Hotmail account)
4. Open Power BI Desktop
```

## 1.2 Download Project Files

```
All 3 CSV files are in the PowerBI_Project/data/ folder:
├── wiz_findings.csv
├── cmdb_assets.csv
└── servicenow_tickets.csv
```

---

# STEP 2: LOAD DATA (Get Data → Power Query)

## 2.1 Import the 3 CSV Files

```
1. Home → Get Data → Text/CSV
2. Browse to: PowerBI_Project/data/wiz_findings.csv → Open → Load
3. Repeat for cmdb_assets.csv
4. Repeat for servicenow_tickets.csv
```

## 2.2 Transform Data in Power Query

Click **"Transform Data"** on the Home tab to open Power Query Editor.

### Transform: wiz_findings table

```
Apply these steps IN ORDER:

1. CHANGE DATA TYPES (click column header → Change Type):
   ├── created_date → Date
   ├── closed_date → Date
   └── sla_hours → Whole Number

2. ADD CUSTOM COLUMN: Age_Days
   ├── Add Column → Custom Column
   ├── Name: Age_Days
   ├── Formula:
       if [status] = "Closed" then
           Duration.Days([closed_date] - [created_date])
       else
           Duration.Days(DateTime.LocalNow() - [created_date])

3. ADD CUSTOM COLUMN: SLA_Days
   ├── Add Column → Custom Column
   ├── Name: SLA_Days
   ├── Formula:
       [sla_hours] / 24

4. ADD CUSTOM COLUMN: SLA_Pct_Used
   ├── Add Column → Custom Column
   ├── Name: SLA_Pct_Used
   ├── Formula:
       if [SLA_Days] = 0 then 0
       else [Age_Days] / [SLA_Days] * 100

5. ADD CUSTOM COLUMN: SLA_Status
   ├── Add Column → Custom Column
   ├── Name: SLA_Status
   ├── Formula:
       if [status] = "Closed" then "Resolved"
       else if [SLA_Pct_Used] >= 100 then "Breached"
       else if [SLA_Pct_Used] >= 75 then "At Risk"
       else "On Track"

6. ADD CUSTOM COLUMN: Age_Bucket
   ├── Add Column → Custom Column
   ├── Name: Age_Bucket
   ├── Formula:
       if [Age_Days] <= 7 then "0-7 days"
       else if [Age_Days] <= 30 then "8-30 days"
       else if [Age_Days] <= 60 then "31-60 days"
       else "60+ days"

7. ADD CUSTOM COLUMN: Severity_Order (for sorting)
   ├── Add Column → Custom Column
   ├── Name: Severity_Order
   ├── Formula:
       if [severity] = "CRITICAL" then 1
       else if [severity] = "HIGH" then 2
       else if [severity] = "MEDIUM" then 3
       else 4
```

### Transform: cmdb_assets table

```
1. CHANGE DATA TYPES:
   └── All text columns should be Text type (should be auto-detected)

2. No additional transformations needed — this is a lookup table
```

### Transform: servicenow_tickets table

```
1. CHANGE DATA TYPES:
   ├── created_date → Date
   ├── resolved_date → Date
   └── sla_target_date → Date

2. ADD CUSTOM COLUMN: Resolution_Days
   ├── Add Column → Custom Column
   ├── Name: Resolution_Days
   ├── Formula:
       if [resolved_date] = null then null
       else Duration.Days([resolved_date] - [created_date])
```

### Close & Apply

```
Click "Close & Apply" in the top-left
→ Data loads into the Power BI data model
```

---

# STEP 3: BUILD DATA MODEL (Relationships)

## 3.1 Create Relationships

```
1. Click the "Model" view icon (3rd icon on the left sidebar)
2. Create these relationships by dragging fields:

   wiz_findings[resource_id]  ──→  cmdb_assets[cloud_resource_id]
   (Many-to-One, Single direction)

   wiz_findings[finding_id]   ──→  servicenow_tickets[finding_id]
   (One-to-One, Single direction)

RESULT:
┌───────────────┐        ┌──────────────┐        ┌────────────────────┐
│ cmdb_assets   │◄──────►│ wiz_findings │◄──────►│ servicenow_tickets │
│ (Dimension)   │  M:1   │ (Fact Table) │  1:1   │ (Fact Table)       │
└───────────────┘        └──────────────┘        └────────────────────┘
```

## 3.2 Create a Date Table (for Time Intelligence)

```
1. Go to "Report" view
2. Modeling → New Table
3. Paste this DAX:

DIM_Date =
ADDCOLUMNS(
    CALENDAR(DATE(2024,12,1), DATE(2025,12,31)),
    "Year", YEAR([Date]),
    "Month", FORMAT([Date], "MMM"),
    "MonthNumber", MONTH([Date]),
    "Quarter", "Q" & FORMAT(CEILING(MONTH([Date])/3, 1), "0"),
    "WeekNumber", WEEKNUM([Date]),
    "DayOfWeek", FORMAT([Date], "ddd"),
    "YearMonth", FORMAT([Date], "YYYY-MM")
)

4. Go to Model view → drag:
   DIM_Date[Date] → wiz_findings[created_date]
   (Many-to-One)
```

---

# STEP 4: CREATE DAX MEASURES

## 4.1 Create a Measures Table

```
1. Modeling → New Table → paste: Measures = ROW("x", 0)
2. This creates a dedicated table for all measures (best practice)
3. Right-click "Measures" table → select "Hide in report view"
   (hides the dummy column)
```

## 4.2 KPI Measures — Create Each One

```
Go to Modeling → New Measure for each:
```

### Core Counts

```dax
Total Findings = COUNTROWS(wiz_findings)

Open Findings =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Open"
)

Closed Findings =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Closed"
)

Critical Open =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[severity] = "CRITICAL",
    wiz_findings[status] = "Open"
)

High Open =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[severity] = "HIGH",
    wiz_findings[status] = "Open"
)

Medium Open =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[severity] = "MEDIUM",
    wiz_findings[status] = "Open"
)

Low Open =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[severity] = "LOW",
    wiz_findings[status] = "Open"
)
```

### SLA Measures

```dax
SLA Compliance Rate =
VAR _total = CALCULATE(COUNTROWS(wiz_findings), wiz_findings[status] = "Open")
VAR _ontrack = CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Open",
    wiz_findings[SLA_Status] = "On Track"
)
RETURN DIVIDE(_ontrack, _total, 0) * 100

SLA Breached Count =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Open",
    wiz_findings[SLA_Status] = "Breached"
)

SLA At Risk Count =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Open",
    wiz_findings[SLA_Status] = "At Risk"
)
```

### MTTR Measures

```dax
MTTR Days =
AVERAGEX(
    FILTER(wiz_findings, wiz_findings[status] = "Closed"),
    wiz_findings[Age_Days]
)

MTTR Critical =
AVERAGEX(
    FILTER(wiz_findings,
        wiz_findings[status] = "Closed" &&
        wiz_findings[severity] = "CRITICAL"
    ),
    wiz_findings[Age_Days]
)

MTTR High =
AVERAGEX(
    FILTER(wiz_findings,
        wiz_findings[status] = "Closed" &&
        wiz_findings[severity] = "HIGH"
    ),
    wiz_findings[Age_Days]
)
```

### Trend Measures

```dax
Findings This Month =
CALCULATE(
    COUNTROWS(wiz_findings),
    DATESMTD(DIM_Date[Date])
)

Findings Last Month =
CALCULATE(
    [Total Findings],
    DATEADD(DIM_Date[Date], -1, MONTH)
)

MoM Change % =
VAR _current = [Open Findings]
VAR _previous = CALCULATE([Open Findings], DATEADD(DIM_Date[Date], -1, MONTH))
RETURN DIVIDE(_current - _previous, _previous, 0) * 100
```

### Compliance Measures

```dax
Azure Findings =
CALCULATE(COUNTROWS(wiz_findings), wiz_findings[cloud_provider] = "Azure")

GCP Findings =
CALCULATE(COUNTROWS(wiz_findings), wiz_findings[cloud_provider] = "GCP")

Internet Facing Critical =
CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[severity] = "CRITICAL",
    wiz_findings[internet_facing] = "Yes",
    wiz_findings[status] = "Open"
)
```

### Team Performance

```dax
Team SLA Compliance =
VAR _team_total =
    CALCULATE(COUNTROWS(servicenow_tickets), servicenow_tickets[status] <> "Closed")
VAR _team_met =
    CALCULATE(
        COUNTROWS(servicenow_tickets),
        servicenow_tickets[status] <> "Closed",
        servicenow_tickets[sla_status] = "On Track"
    )
RETURN DIVIDE(_team_met, _team_total, 0) * 100

Avg Resolution Days =
AVERAGEX(
    FILTER(servicenow_tickets, servicenow_tickets[Resolution_Days] <> BLANK()),
    servicenow_tickets[Resolution_Days]
)
```

---

# STEP 5: BUILD PAGE 1 — EXECUTIVE SUMMARY

## 5.1 Page Setup

```
1. Right-click "Page 1" tab at bottom → Rename to "Executive Summary"
2. Format → Page background → Color: #1a1a2e (dark navy)
3. Format → Canvas settings → Type: Custom, Width: 1920, Height: 1080
```

## 5.2 Add Header

```
1. Insert → Text Box
2. Text: "☁️ CLOUD SECURITY FINDINGS MANAGEMENT DASHBOARD"
3. Font: Segoe UI, Size: 24, Bold, Color: White
4. Position: top center, spanning full width
5. Background: transparent
```

## 5.3 Add KPI Cards (Top Row)

```
Create 6 Card visuals across the top:

CARD 1: Total Open
├── Fields: [Open Findings]
├── Format → Callout value: Font 36, Color: White
├── Format → Category label: "OPEN FINDINGS", Size 12, Color: #aaaaaa
├── Format → Background: #16213e
├── Format → Border: Left bar, Color: #3498db, Width: 4
└── Size: 200x120

CARD 2: Critical
├── Fields: [Critical Open]
├── Same format as Card 1
├── Border color: #e74c3c (red)
└── Category label: "CRITICAL"

CARD 3: High
├── Fields: [High Open]
├── Border color: #e67e22 (orange)
└── Category label: "HIGH"

CARD 4: SLA Compliance
├── Fields: [SLA Compliance Rate]
├── Format → Display units: None
├── Format → Value suffix: "%"
├── Border color: #2ecc71 (green)
└── Category label: "SLA COMPLIANCE"

CARD 5: SLA Breached
├── Fields: [SLA Breached Count]
├── Border color: #e74c3c (red)
└── Category label: "SLA BREACHED"

CARD 6: MTTR (Days)
├── Fields: [MTTR Days]
├── Format → Decimal places: 1
├── Border color: #9b59b6 (purple)
└── Category label: "AVG MTTR (DAYS)"
```

## 5.4 Add Charts (Middle Row)

```
CHART 1: Findings by Severity (Donut Chart) — Left
├── Legend: wiz_findings[severity]
├── Values: [Open Findings]
├── Format → Colors:
│   ├── CRITICAL: #e74c3c
│   ├── HIGH: #e67e22
│   ├── MEDIUM: #f1c40f
│   └── LOW: #2ecc71
├── Format → Detail labels: Show category + value
├── Size: 400x300
└── Position: Left side, below KPI cards

CHART 2: Findings by Category (Bar Chart) — Center
├── Y-axis: wiz_findings[category]
├── Values: [Open Findings]
├── Format → Data colors: #3498db
├── Format → Sort: Descending by value
├── Size: 500x300
└── Position: Center, below KPI cards

CHART 3: Findings by Cloud Provider (Donut Chart) — Right
├── Legend: wiz_findings[cloud_provider]
├── Values: [Total Findings]
├── Format → Colors:
│   ├── Azure: #0078d4
│   └── GCP: #4285f4
├── Size: 400x300
└── Position: Right side, below KPI cards
```

## 5.5 Add Charts (Bottom Row)

```
CHART 4: Findings Trend by Month (Stacked Area Chart)
├── X-axis: DIM_Date[YearMonth]
├── Legend: wiz_findings[severity]
├── Values: Count of finding_id
├── Format → Same severity colors as donut
├── Size: 600x250
└── Position: Left bottom

CHART 5: SLA Status Distribution (Stacked Bar)
├── X-axis: wiz_findings[SLA_Status]
├── Values: [Open Findings]
├── Format → Colors:
│   ├── On Track: #2ecc71
│   ├── At Risk: #f1c40f
│   ├── Breached: #e74c3c
│   └── Resolved: #95a5a6
├── Size: 400x250
└── Position: Center bottom

CHART 6: Internet-Facing Critical (KPI Visual)
├── Value: [Internet Facing Critical]
├── Target: 0 (goal is zero)
├── Format → Direction: Low is good
├── Size: 300x250
└── Position: Right bottom
```

## 5.6 Add Slicers

```
SLICER 1: Cloud Provider
├── Field: wiz_findings[cloud_provider]
├── Style: Tile (horizontal buttons)
├── Position: Below header, left

SLICER 2: Severity
├── Field: wiz_findings[severity]
├── Style: Tile
├── Position: Below header, center

SLICER 3: Category
├── Field: wiz_findings[category]
├── Style: Dropdown
├── Position: Below header, right
```

---

# STEP 6: BUILD PAGE 2 — TEAM PERFORMANCE

```
1. Click "+" at bottom to add new page → Rename to "Team Performance"
2. Same dark background: #1a1a2e
```

## 6.1 Visuals to Add

```
VISUAL 1: SLA Compliance by Team (Horizontal Bar Chart)
├── Y-axis: cmdb_assets[assignment_group]
├── Values: [Team SLA Compliance]
├── Format → Data colors: Conditional formatting
│   ├── Rules:
│   │   ├── >=90: #2ecc71 (green)
│   │   ├── >=70: #f1c40f (yellow)
│   │   └── <70: #e74c3c (red)
├── Format → Data labels: ON, show percentage
├── Size: 600x400
└── Position: Left side

VISUAL 2: Open Findings by Team (Stacked Bar)
├── Y-axis: cmdb_assets[assignment_group]
├── Legend: wiz_findings[severity]
├── Values: [Open Findings]
├── Format → Same severity colors
├── Size: 600x400
└── Position: Right side

VISUAL 3: Team Detail Table (Table Visual)
├── Columns:
│   ├── cmdb_assets[assignment_group]
│   ├── cmdb_assets[manager]
│   ├── [Open Findings]
│   ├── [Critical Open]
│   ├── [SLA Breached Count]
│   ├── [Team SLA Compliance]
│   └── [Avg Resolution Days]
├── Format → Conditional formatting on SLA Breached Count (red scale)
├── Format → Style: Alternating rows
├── Size: full width, 300 height
└── Position: Bottom

VISUAL 4: MTTR by Severity (Clustered Column)
├── X-axis: wiz_findings[severity]
├── Values: [MTTR Days]
├── Format → Data labels: ON
├── Size: 400x250
└── Position: Bottom right
```

---

# STEP 7: BUILD PAGE 3 — FINDING DETAILS

```
1. Add new page → Rename to "Finding Details"
2. Same dark background
```

## 7.1 Visuals

```
VISUAL 1: Findings Detail Table
├── Columns:
│   ├── wiz_findings[finding_id]
│   ├── wiz_findings[severity]
│   ├── wiz_findings[title]
│   ├── wiz_findings[cloud_provider]
│   ├── wiz_findings[status]
│   ├── wiz_findings[Age_Days]
│   ├── wiz_findings[SLA_Status]
│   ├── cmdb_assets[owner]
│   ├── cmdb_assets[assignment_group]
│   └── servicenow_tickets[ticket_id]
├── Format → Conditional formatting:
│   ├── Severity: colors (CRITICAL=red, HIGH=orange, etc.)
│   ├── SLA_Status: colors (Breached=red, At Risk=yellow, On Track=green)
│   └── Age_Days: color scale (low=green, high=red)
├── Sort: by Severity_Order ASC, then Age_Days DESC
└── Size: Full page width, 500 height

VISUAL 2: Top 10 Oldest Open Findings (Table)
├── Filter: status = "Open"
├── Top N: 10, by Age_Days
├── Columns: finding_id, title, severity, Age_Days, owner, SLA_Status
└── Position: Bottom

VISUAL 3: Findings by CIS Control (Treemap)
├── Group: wiz_findings[cis_control]
├── Values: Count of finding_id
├── Format → Data colors: by severity
└── Position: Bottom right
```

---

# STEP 8: ADD DRILL-THROUGH

```
1. On "Finding Details" page:
   ├── Drag wiz_findings[severity] to Drill-Through field well
   ├── Drag cmdb_assets[assignment_group] to Drill-Through field well
   └── Add a "Back" button: Insert → Buttons → Back

2. Now from Executive Summary or Team Performance:
   ├── Right-click any CRITICAL bar → Drill Through → Finding Details
   └── Shows only Critical findings on the detail page

3. Click the Back button to return to the summary page
```

---

# STEP 9: FORMAT & POLISH

## 9.1 Theme

```
1. View → Themes → Browse for themes
2. Or customize:
   ├── Background: #1a1a2e
   ├── Card background: #16213e
   ├── Text: White (#ffffff)
   ├── Secondary text: #aaaaaa
   ├── Accent 1: #3498db (blue)
   ├── Accent 2: #e74c3c (red)
   ├── Accent 3: #2ecc71 (green)
   ├── Accent 4: #f1c40f (yellow)
   └── Font: Segoe UI
```

## 9.2 Add Page Navigation

```
1. Insert → Buttons → Navigator → Page Navigator
2. Style: Fill with dark color, text white
3. Position: Top right corner
4. Users can click to switch between pages
```

## 9.3 Add Last Refresh Date

```
1. Insert → Text Box
2. Type: "Last Refresh: "
3. Or create a Measure:

Last Refresh = "Data as of: " & FORMAT(NOW(), "DD-MMM-YYYY HH:MM")

4. Add a Card with this measure at the top right
```

---

# STEP 10: PUBLISH & SHARE

```
1. Save: File → Save As → "WF_Findings_Dashboard.pbix"

2. Publish to Power BI Service (optional):
   ├── Home → Publish → My Workspace
   ├── Opens in browser
   └── Can share with others via link

3. Export: File → Export → PDF
   → Great for emailing to stakeholders or bringing to interviews
```

---

# 📋 CHECKLIST — Did You Build Everything?

```
DATA LAYER:
☐ Imported wiz_findings.csv
☐ Imported cmdb_assets.csv
☐ Imported servicenow_tickets.csv
☐ Applied Power Query transformations (Age_Days, SLA_Status, etc.)
☐ Created DIM_Date table
☐ Created relationships between tables

DAX MEASURES:
☐ Total / Open / Closed Findings
☐ Critical / High / Medium / Low Open
☐ SLA Compliance Rate
☐ SLA Breached Count
☐ MTTR Days + MTTR by severity
☐ MoM Change %
☐ Azure / GCP Findings
☐ Internet Facing Critical
☐ Team SLA Compliance
☐ Avg Resolution Days

PAGE 1 — EXECUTIVE SUMMARY:
☐ 6 KPI cards
☐ Severity donut chart
☐ Category bar chart
☐ Cloud provider donut
☐ Trend area chart
☐ SLA status bar
☐ 3 slicers (cloud, severity, category)

PAGE 2 — TEAM PERFORMANCE:
☐ SLA compliance by team (conditional colors)
☐ Open findings by team (stacked by severity)
☐ Team detail table
☐ MTTR by severity column chart

PAGE 3 — FINDING DETAILS:
☐ Full findings table with conditional formatting
☐ Top 10 oldest findings
☐ CIS control treemap
☐ Drill-through configured

POLISH:
☐ Dark theme applied
☐ Page navigation added
☐ Last refresh date
☐ All visuals labeled clearly
☐ Exported to PDF for interview portfolio
```

---

# 🎤 INTERVIEW TALKING POINTS FOR THIS DASHBOARD

> "I built a 3-page Power BI dashboard for findings management. Page 1 is the executive summary — KPI cards show open findings, SLA compliance rate, and MTTR. Page 2 drills into team performance, showing SLA compliance by assignment group with conditional formatting — red means they're behind, green means on track. Page 3 is the detail drill-through for investigation."

> "Under the hood, I use Power Query for ETL — merging Wiz findings with CMDB data to get owners, and calculating SLA status dynamically based on severity-specific SLA targets. I created DAX measures for everything — using CALCULATE for context-aware KPIs, AVERAGEX for MTTR calculation, and time intelligence functions for month-over-month trend analysis."

> "The data model follows a star schema — wiz_findings is the fact table, linked to CMDB dimension table for owners and ServiceNow tickets for tracking. I also created a date dimension table for time intelligence. This is the same architecture I'd use in production at Wells Fargo."
