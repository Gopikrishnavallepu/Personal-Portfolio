# 📊 CEO/CISO Executive Security Posture Dashboard — Complete Build Guide

> **Purpose:** Step-by-step guide to build a 3-page Power BI dashboard for executive
> security reporting using Wiz findings, CMDB, and ServiceNow data.
> **Audience:** You (the analyst building it) + CEO/CISO/Board (consuming it)

---

# PART 1: DATA ANALYSIS — What the Numbers Tell Us

## 1.1 Current Security Posture Snapshot

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY POSTURE AT A GLANCE                          │
│                                                                          │
│   Total Findings: 50         Closed: 10 (20%)     Open: 40 (80%)        │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │ CRITICAL  ████████████░░░  11 total (8 OPEN, 3 Closed)  │           │
│   │ HIGH      ████████████████  16 total (12 OPEN, 4 Closed)│           │
│   │ MEDIUM    ██████████████░░  14 total (12 OPEN, 2 Closed)│           │
│   │ LOW       █████░░░░░░░░░░   5 total (4 OPEN, 1 Closed) │           │
│   └─────────────────────────────────────────────────────────┘           │
│                                                                          │
│   SLA Compliance: 50%  ← 🔴 UNACCEPTABLE FOR BANKING                   │
│   SLA Breached:   18 tickets (36%)                                       │
│   SLA At Risk:     7 tickets (14%)                                       │
│   SLA On Track:   15 tickets (30%)                                       │
│   SLA Met:         9 tickets (closed on time)                            │
│   SLA Missed:      1 ticket (closed late)                                │
│                                                                          │
│   Internet-Facing + Critical/High:  ~8 findings ← 🔴 HIGHEST RISK      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Parameters a CEO/CISO Dashboard MUST Show

### Tier 1 — CEO Level (Board-Ready)

| # | Parameter | What It Answers | Data Source |
|---|-----------|----------------|-------------|
| 1 | **Overall Security Score** (0-100) | "Are we secure?" | Calculated from all findings |
| 2 | **Risk Trend** (month-over-month) | "Are we getting better or worse?" | findings.created_date, closed_date |
| 3 | **Critical Open Findings Count** | "How many fires exist right now?" | findings.severity = CRITICAL, status = Open |
| 4 | **SLA Compliance Rate (%)** | "Are teams fixing issues on time?" | tickets.sla_status |
| 5 | **Internet-Facing Exposure** | "How many assets are visible to attackers?" | findings.internet_facing = Yes |
| 6 | **Risk by Business Unit** | "Which business line has the most risk?" | cmdb.business_unit joined to findings |
| 7 | **Cloud Provider Risk Split** | "Azure vs GCP — where's the risk?" | findings.cloud_provider |

### Tier 2 — CISO Level (Operational)

| # | Parameter | What It Answers | Data Source |
|---|-----------|----------------|-------------|
| 8 | **Mean Time to Remediate (MTTR)** | "How fast are we fixing issues?" | tickets.resolved_date - created_date |
| 9 | **SLA Breach by Team** | "Which teams are struggling?" | tickets.assignment_group + sla_status |
| 10 | **Findings by Category** | "Where are the gaps? (Network, IAM, Storage...)" | findings.category |
| 11 | **Open Findings Aging** | "How old are our oldest unfixed issues?" | DATEDIFF(created_date, TODAY) |
| 12 | **Findings Opened vs Closed Trend** | "Is the backlog growing?" | Monthly count comparison |
| 13 | **Top Repeat Offender Assets** | "Which resources keep failing?" | COUNT findings per resource |
| 14 | **Owner Accountability Matrix** | "Who owns what? Who is behind?" | cmdb.owner + tickets.sla_status |
| 15 | **Remediation Velocity** | "How many findings do we close per week?" | Rolling close rate |

### Tier 3 — GRC / Audit Level (Compliance)

| # | Parameter | What It Answers | Data Source |
|---|-----------|----------------|-------------|
| 16 | **CIS Benchmark Coverage** | "Which CIS controls are we failing?" | findings.cis_control |
| 17 | **Compliance by Framework** | "CIS Azure vs CIS GCP vs CIS EKS status" | findings.compliance_framework |
| 18 | **Data Classification × Severity** | "Are our most sensitive assets protected?" | findings.data_classification × severity |
| 19 | **Environment Risk** (Prod vs Dev) | "Is production properly secured?" | cmdb.environment |
| 20 | **Evidence of Remediation** | "Can we prove we fixed things?" | tickets.resolution_notes + change_request_id |

---

# PART 2: POWER BI SETUP — Step by Step

## Step 1: Import Data

```
1. Open Power BI Desktop
2. Home → Get Data → Text/CSV
3. Import these 3 files:
   ├── wiz_findings.csv       → rename query to "Findings"
   ├── cmdb_assets.csv        → rename query to "Assets"
   └── servicenow_tickets.csv → rename query to "Tickets"
4. Click "Transform Data" to open Power Query Editor
```

## Step 2: Power Query Transformations

### Findings Table

```
// In Power Query Editor → select "Findings" query

// Step 2.1: Set data types
Select columns → Transform → Detect Data Types
Then manually verify:
  - created_date → Date
  - closed_date → Date
  - sla_hours → Whole Number
  - internet_facing → Text

// Step 2.2: Add calculated columns

// Column: Days Open
= if [status] = "Open"
  then Duration.Days(DateTime.LocalNow() - [created_date])
  else Duration.Days([closed_date] - [created_date])

// Column: Resolution Time (hours) — only for closed findings
= if [closed_date] <> null
  then Duration.TotalHours([closed_date] - [created_date])
  else null

// Column: SLA Met (calculated)
= if [status] = "Closed" then
    (if Duration.TotalHours([closed_date] - [created_date]) <= [sla_hours]
     then "Met" else "Missed")
  else
    (if Duration.TotalHours(DateTime.LocalNow() - [created_date]) > [sla_hours]
     then "Breached" else "On Track")

// Column: Severity Order (for correct sorting)
= if [severity] = "CRITICAL" then 1
  else if [severity] = "HIGH" then 2
  else if [severity] = "MEDIUM" then 3
  else 4

// Column: Risk Score (weighted)
= if [severity] = "CRITICAL" then 10
  else if [severity] = "HIGH" then 5
  else if [severity] = "MEDIUM" then 2
  else 1

// Column: Exposure Risk (combines internet + severity)
= if [internet_facing] = "Yes" and [severity] = "CRITICAL" then "EXTREME"
  else if [internet_facing] = "Yes" and [severity] = "HIGH" then "VERY HIGH"
  else if [internet_facing] = "Yes" then "ELEVATED"
  else [severity]

// Column: Age Bucket
= if Duration.Days(DateTime.LocalNow() - [created_date]) <= 7 then "0-7 days"
  else if Duration.Days(DateTime.LocalNow() - [created_date]) <= 30 then "8-30 days"
  else if Duration.Days(DateTime.LocalNow() - [created_date]) <= 60 then "31-60 days"
  else "60+ days"

// Column: Month-Year (for trending)
= Date.ToText([created_date], "yyyy-MM")
```

### Assets Table

```
// In Power Query Editor → select "Assets" query

// Rename cloud_resource_id to resource_id (to match findings table for JOIN)
Right-click column → Rename → "resource_id"

// No other transformations needed — this is a lookup/dimension table
```

### Tickets Table

```
// In Power Query Editor → select "Tickets" query

// Step: Set data types
  - created_date → Date
  - resolved_date → Date
  - sla_target_date → Date

// Column: Days to Resolve (for closed tickets)
= if [resolved_date] <> null
  then Duration.Days([resolved_date] - [created_date])
  else null

// Column: Priority Order
= if [priority] = "P1" then 1
  else if [priority] = "P2" then 2
  else if [priority] = "P3" then 3
  else 4
```

## Step 3: Click "Close & Apply" → Power Query loads data into model

## Step 4: Data Model — Create Relationships

```
In Model View (left sidebar → diagram icon):

┌────────────┐        ┌────────────┐        ┌────────────┐
│  Findings   │───────▶│   Assets    │        │  Tickets   │
│             │        │             │        │            │
│ resource_id │──1:1──▶│ resource_id │        │ finding_id │
│ finding_id  │◀──1:1──────────────────────────│ finding_id │
└────────────┘        └────────────┘        └────────────┘

Create relationships:
1. Findings[resource_id] → Assets[resource_id]  (Many to One)
2. Findings[finding_id]  → Tickets[finding_id]  (One to One)
```

## Step 5: Create a Date Table (for time intelligence)

```
// In Power BI → Modeling → New Table:

DateTable =
ADDCOLUMNS(
    CALENDAR(DATE(2024, 12, 1), DATE(2025, 6, 30)),
    "Year", YEAR([Date]),
    "MonthNum", MONTH([Date]),
    "MonthName", FORMAT([Date], "MMM"),
    "YearMonth", FORMAT([Date], "YYYY-MM"),
    "WeekNum", WEEKNUM([Date]),
    "Quarter", "Q" & FORMAT([Date], "Q"),
    "IsCurrentMonth", IF(MONTH([Date]) = MONTH(TODAY()) && YEAR([Date]) = YEAR(TODAY()), TRUE, FALSE)
)

// Mark as Date Table:
// Select DateTable → Modeling → Mark as Date Table → select [Date]

// Create relationships:
// DateTable[Date] → Findings[created_date]
```

---

# PART 3: DAX MEASURES — The Analytics Engine

## Create all measures in a "Measures" table:

```
// Modeling → New Table → Measures = ROW("x", 0)
// Then delete the "x" column — this is just a container for measures
```

### 3.1 Core Counts

```dax
// MEASURE 1: Total Findings
Total Findings = COUNTROWS(Findings)

// MEASURE 2: Open Findings
Open Findings = CALCULATE(COUNTROWS(Findings), Findings[status] = "Open")

// MEASURE 3: Closed Findings
Closed Findings = CALCULATE(COUNTROWS(Findings), Findings[status] = "Closed")

// MEASURE 4: Closure Rate
Closure Rate % = DIVIDE([Closed Findings], [Total Findings], 0) * 100
```

### 3.2 Severity Breakdowns

```dax
// MEASURE 5: Critical Open
Critical Open = CALCULATE(
    COUNTROWS(Findings),
    Findings[severity] = "CRITICAL",
    Findings[status] = "Open"
)

// MEASURE 6: High Open
High Open = CALCULATE(
    COUNTROWS(Findings),
    Findings[severity] = "HIGH",
    Findings[status] = "Open"
)

// MEASURE 7: Internet-Facing Critical/High Open
Internet Exposure Count = CALCULATE(
    COUNTROWS(Findings),
    Findings[internet_facing] = "Yes",
    Findings[status] = "Open",
    Findings[severity] IN {"CRITICAL", "HIGH"}
)
```

### 3.3 Security Score (THE most important executive metric)

```dax
// MEASURE 8: Overall Security Score (0-100, higher = more secure)
//
// LOGIC: Start at 100. Deduct points for every open finding:
//   Critical = -4 points each
//   High = -2 points each
//   Medium = -0.5 points each
//   Low = -0.25 points each
// Floor at 0 (can't go negative)
//
// WHY THIS FORMULA: Executive boards need ONE number.
// This creates a weighted score that drops fast when Criticals accumulate.

Security Score =
VAR CriticalCount = [Critical Open]
VAR HighCount = [High Open]
VAR MediumCount = CALCULATE(COUNTROWS(Findings), Findings[severity] = "MEDIUM", Findings[status] = "Open")
VAR LowCount = CALCULATE(COUNTROWS(Findings), Findings[severity] = "LOW", Findings[status] = "Open")
VAR Deductions = (CriticalCount * 4) + (HighCount * 2) + (MediumCount * 0.5) + (LowCount * 0.25)
RETURN MAX(0, 100 - Deductions)

// CURRENT VALUE: 100 - (8*4) - (12*2) - (12*0.5) - (4*0.25) = 100 - 32 - 24 - 6 - 1 = 37
// SCORE: 37/100 = 🔴 POOR
```

### 3.4 SLA Metrics

```dax
// MEASURE 9: SLA Compliance Rate
SLA Compliance % = DIVIDE(
    CALCULATE(COUNTROWS(Tickets), Tickets[sla_status] IN {"Met", "On Track"}),
    COUNTROWS(Tickets),
    0
) * 100

// MEASURE 10: SLA Breach Count
SLA Breached Count = CALCULATE(COUNTROWS(Tickets), Tickets[sla_status] = "Breached")

// MEASURE 11: SLA At Risk Count
SLA At Risk Count = CALCULATE(COUNTROWS(Tickets), Tickets[sla_status] = "At Risk")
```

### 3.5 MTTR (Mean Time to Remediate)

```dax
// MEASURE 12: MTTR in Days (for closed findings only)
MTTR Days = AVERAGE(Tickets[Days to Resolve])

// MEASURE 13: MTTR by Critical (use with slicer)
MTTR Critical = CALCULATE(
    AVERAGE(Tickets[Days to Resolve]),
    Tickets[priority] = "P1"
)

// MEASURE 14: MTTR by High
MTTR High = CALCULATE(
    AVERAGE(Tickets[Days to Resolve]),
    Tickets[priority] = "P2"
)
```

### 3.6 Trend & Comparison

```dax
// MEASURE 15: Findings Opened This Month
Opened This Month = CALCULATE(
    COUNTROWS(Findings),
    DATESMTD(DateTable[Date])
)

// MEASURE 16: Findings Closed This Month
Closed This Month = CALCULATE(
    COUNTROWS(Findings),
    Findings[status] = "Closed",
    DATESMTD(DateTable[Date])
)

// MEASURE 17: Net Change (Opened minus Closed)
Net Change = [Opened This Month] - [Closed This Month]
// Positive = backlog growing 🔴 | Negative = backlog shrinking 🟢

// MEASURE 18: Risk Score Total (for BU comparison)
Total Risk Score = SUMX(
    FILTER(Findings, Findings[status] = "Open"),
    Findings[Risk Score]
)
```

### 3.7 Aging Analysis

```dax
// MEASURE 19: Average Age of Open Findings (days)
Avg Age Days = CALCULATE(
    AVERAGE(Findings[Days Open]),
    Findings[status] = "Open"
)

// MEASURE 20: Findings Over 30 Days Old
Overdue Findings = CALCULATE(
    COUNTROWS(Findings),
    Findings[status] = "Open",
    Findings[Days Open] > 30
)
```

---

# PART 4: DASHBOARD PAGES — Layout & Visual Design

## 🎨 Color Theme

```
Executive Dashboard Color Palette:

Background:     #1E1E2E (dark navy — executive/premium feel)
Card Background: #2A2A3E
Text Primary:    #FFFFFF
Text Secondary:  #A0A0C0

CRITICAL:  #FF4444 (red)
HIGH:      #FF8C00 (orange)
MEDIUM:    #FFD700 (gold)
LOW:       #4CAF50 (green)

Score Gauge:
  0-30:    #FF4444 (red — poor)
  31-60:   #FF8C00 (orange — needs work)
  61-80:   #FFD700 (gold — acceptable)
  81-100:  #4CAF50 (green — strong)

SLA Status:
  Breached: #FF4444
  At Risk:  #FF8C00
  On Track: #4CAF50
  Met:      #2196F3 (blue)
```

## 📊 PAGE 1: EXECUTIVE RISK OVERVIEW

```
┌──────────────────────────────────────────────────────────────────────────┐
│ EXECUTIVE RISK OVERVIEW                                    [ March 2025 ]│
│                                                                          │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│ │ SECURITY  │  │ OPEN      │  │ CRITICAL  │  │ INTERNET  │            │
│ │ SCORE     │  │ FINDINGS  │  │ OPEN      │  │ EXPOSED   │            │
│ │           │  │           │  │           │  │           │            │
│ │   37/100  │  │    40     │  │    8      │  │    8      │            │
│ │   🔴 POOR │  │   🔴 HIGH │  │  🔴 CRIT  │  │  🔴 RISK  │            │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘            │
│                                                                          │
│ ┌──────────────────────────────┐  ┌───────────────────────────────────┐│
│ │  RISK TREND (Line Chart)     │  │  RISK BY CLOUD PROVIDER (Donut)  ││
│ │                              │  │                                   ││
│ │  ↗ Critical ─── 5→8 (↑60%)  │  │    Azure: 68% (34 findings)      ││
│ │  → High ──── 10→12 (↑20%)   │  │    GCP:   32% (16 findings)      ││
│ │  → Medium ── 10→12 (↑20%)   │  │                                   ││
│ │  ↘ Low ───── 5→4  (↓20%)    │  │                                   ││
│ └──────────────────────────────┘  └───────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────┐  ┌───────────────────────────────────┐│
│ │  RISK BY BUSINESS UNIT       │  │  DATA CLASSIFICATION × SEVERITY  ││
│ │  (Stacked Bar Chart)         │  │  (Heat Map / Matrix)             ││
│ │                              │  │                                   ││
│ │  Risk Analytics ████████ 38  │  │        CRIT  HIGH  MED   LOW     ││
│ │  Digital Banking ██████ 30   │  │  REST:   2    2     0     0  🔴  ││
│ │  Capital Markets ████ 20     │  │  CONF:   3    5     3     0  🟠  ││
│ │  Retail Banking ███ 15       │  │  INTR:   2    4     9     4  🟡  ││
│ │  Enterprise Sec ██ 12        │  │  PUBL:   1    0     0     0  🟡  ││
│ │  Infrastructure █ 5          │  │                                   ││
│ └──────────────────────────────┘  └───────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Build Instructions — Page 1 (Detailed)

#### Step 1: Page Setup

```
1. Right-click "Page 1" tab at bottom → Rename → type "Executive Risk Overview"
2. With this page selected, click the empty canvas area (no visual selected)
3. In the Visualizations pane (right side), click the FORMAT icon
   (the paint roller 🖌️ icon — NOT the fields icon)
4. Expand "Canvas background":
   → Color: #1E1E2E (click the color box → Custom color → paste hex)
   → Transparency: 0%
5. Expand "Canvas settings":
   → Type: Custom
   → Width: 1920
   → Height: 1080
6. View menu (top ribbon) → UNCHECK "Gridlines" and "Snap to grid"
   → This gives you precise visual placement
```

#### Step 2: Add Header Text Box

```
1. Insert ribbon (top) → Text box
2. Click-drag across the top of the canvas (full width, ~60px tall)
3. Type: "☁️ CLOUD SECURITY — EXECUTIVE RISK OVERVIEW"
4. Select the text → set:
   → Font: Segoe UI Semibold
   → Size: 22
   → Color: White (#FFFFFF)
   → Alignment: Center
5. With the text box selected, go to Format pane:
   → General → Properties → Position:
     X: 0, Y: 0, Width: 1920, Height: 60
   → General → Effects → Background: OFF
```

#### Step 3: Add Security Score Gauge

```
1. Click empty canvas area
2. Visualizations pane → click the GAUGE icon (🎯 speedometer)
   → An empty gauge appears on canvas
3. From Fields pane (right side), expand "_Measures" table
   → Drag [Security Score] into the "Value" field well
4. Still in Fields wells:
   → Min value: click the ▼ dropdown → type 0
   → Max value: click the ▼ dropdown → type 100
   → Target value: click the ▼ dropdown → type 75
5. FORMAT the gauge (click paint roller 🖌️):
   → Visual → Gauge axis:
     Min: 0, Max: 100
     Target: 75
   → Visual → Colors:
     Fill: #3498db (blue arc)
     Target: #FFFFFF (white target line)
   → Visual → Callout value:
     Font: Segoe UI, Size: 36, Color: #FFFFFF
   → Visual → Data labels: ON
   → General → Title: ON
     Text: "Security Posture Score"
     Font: Segoe UI, Size: 14, Color: #A0A0C0
   → General → Effects → Background:
     Color: #2A2A3E, Transparency: 0%
   → General → Effects → Border:
     ON, Color: #3A3A5E, Rounded corners: 8px
   → General → Properties → Position:
     X: 40, Y: 80, Width: 300, Height: 250

6. ADD CONDITIONAL FORMATTING to gauge fill:
   → Still in Format → Visual → Colors → Fill color
   → Click "fx" (conditional formatting button)
   → Format style: Rules
   → Based on: [Security Score]
   → Rules:
     IF value >= 0  AND < 30  THEN #FF4444 (red)
     IF value >= 30 AND < 60  THEN #FF8C00 (orange)
     IF value >= 60 AND < 80  THEN #FFD700 (gold)
     IF value >= 80 AND <= 100 THEN #4CAF50 (green)
   → Click OK
```

#### Step 4: Add 4 KPI Cards (Top Row)

```
FOR EACH CARD, repeat these steps:

1. Click empty canvas → Visualizations pane → "Card" visual (rectangle with number)
2. Drag the measure from _Measures into the "Fields" well

CARD 1 — Open Findings:
  → Drag [Open Findings] into Fields
  → FORMAT (paint roller):
    → Visual → Callout value:
      Font: Segoe UI, Size: 36, Bold, Color: #FFFFFF
      Display units: None
    → Visual → Category label:
      ON, Text: "OPEN FINDINGS", Size: 11, Color: #A0A0C0
    → General → Title: OFF (category label replaces it)
    → General → Effects → Background: Color #2A2A3E
    → General → Effects → Visual border:
      ON, Color: #3498db (blue left accent), Width: 4
    → General → Properties → Position:
      X: 360, Y: 80, Width: 220, Height: 120
  → CONDITIONAL FORMATTING on callout value:
    Right-click the card number → "Conditional formatting" → "Font color"
    → Format style: Rules
    → Rules:
      IF value > 30 THEN #FF4444 (red)
      IF value >= 20 AND <= 30 THEN #FF8C00 (orange)
      IF value < 20 THEN #4CAF50 (green)
    → Click OK

CARD 2 — Critical Open:
  → Drag [Critical Open] into Fields
  → Same formatting as Card 1 EXCEPT:
    → Category label text: "CRITICAL"
    → Border Color: #FF4444 (red accent)
    → Position: X: 600, Y: 80, Width: 220, Height: 120
  → Conditional formatting:
    IF value > 0 THEN #FF4444 (always red when criticals exist)
    IF value = 0 THEN #4CAF50 (green when zero)

CARD 3 — Internet Exposure:
  → Drag [Internet Exposure Count] into Fields
  → Category label text: "INTERNET-FACING"
  → Border Color: #FF4444 (red)
  → Position: X: 840, Y: 80, Width: 220, Height: 120
  → Same conditional as Card 2

CARD 4 — SLA Compliance:
  → Drag [SLA Compliance %] into Fields
  → Category label text: "SLA COMPLIANCE"
  → Border Color: #4CAF50 (green accent)
  → Position: X: 1080, Y: 80, Width: 220, Height: 120
  → FORMAT the number:
    Click the measure in Fields well → Modeling ribbon → Format: Percentage
    OR: Format pane → Visual → Callout value → Display units: None, Decimal: 1
  → Conditional formatting:
    IF value < 70 THEN #FF4444 (red)
    IF value >= 70 AND < 90 THEN #FF8C00 (orange)
    IF value >= 90 THEN #4CAF50 (green)
```

#### Step 5: Add Slicers (Below Header)

```
SLICER 1 — Cloud Provider:
  1. Visualizations pane → Slicer icon (funnel with lines)
  2. Drag wiz_findings[cloud_provider] into "Field" well
  3. FORMAT:
     → Visual → Slicer settings → Style: "Tile"
       (click the dropdown — options are: Vertical list, Tile, Dropdown)
     → Visual → Slicer settings → Orientation: Horizontal
     → Visual → Selection → Single select: OFF (allow multi-select)
     → Visual → Values:
       Font: Segoe UI, Size: 11, Color: #FFFFFF
       Background: #2A2A3E
     → When selected: Background: #3498db (blue highlight)
     → General → Properties → Position:
       X: 1340, Y: 85, Width: 250, Height: 45

SLICER 2 — Severity:
  1. Same process → drag wiz_findings[severity] → Tile style
  2. Position: X: 1340, Y: 135, Width: 250, Height: 45

SLICER 3 — Category:
  1. Same process → drag wiz_findings[category] → Style: "Dropdown"
     (Dropdown is better here because there are many categories)
  2. Position: X: 1600, Y: 85, Width: 280, Height: 45
```

#### Step 6: Add Risk Trend Line Chart (Middle-Left)

```
1. Click empty canvas → Visualizations pane → "Line chart" icon
2. FIELD ASSIGNMENTS (drag from Fields pane):
   → X-axis: drag wiz_findings[Month_Year]
   → Y-axis: drag [Open Findings] from _Measures
   → Legend: drag wiz_findings[severity]
3. FORMAT (paint roller):
   → Visual → X-axis:
     Font: Segoe UI, Size: 10, Color: #A0A0C0
     Title: OFF
   → Visual → Y-axis:
     Font: Segoe UI, Size: 10, Color: #A0A0C0
     Title: OFF
     Gridlines: Color #3A3A5E
   → Visual → Lines:
     Stroke width: 2
   → Visual → Data colors:
     Click each series → set colors:
     CRITICAL: #FF4444, HIGH: #FF8C00, MEDIUM: #FFD700, LOW: #4CAF50
   → Visual → Markers: ON, Size: 4
   → Visual → Legend:
     Position: Top, Font Color: #A0A0C0, Size: 10
   → General → Title:
     Text: "Risk Trend — Open Findings by Severity"
     Font: Segoe UI, Size: 14, Color: #A0A0C0
   → General → Effects → Background: Color #2A2A3E
   → General → Effects → Border: ON, Color #3A3A5E, Round: 8px
   → General → Properties → Position:
     X: 40, Y: 350, Width: 600, Height: 300
```

#### Step 7: Add Cloud Provider Donut (Middle-Right)

```
1. Click empty canvas → Visualizations → "Donut chart" icon
2. FIELD ASSIGNMENTS:
   → Legend: drag wiz_findings[cloud_provider]
   → Values: drag [Open Findings] from _Measures
3. FORMAT:
   → Visual → Slices:
     Azure: #0078D4 (Microsoft blue)
     GCP: #4285F4 (Google blue)
   → Visual → Detail labels:
     ON, Label style: "Category, data value, percent of total"
     Font Size: 11, Color: #FFFFFF
   → Visual → Legend:
     Position: Bottom, Font Color: #A0A0C0
   → Visual → Inner radius: 60% (controls donut hole size)
   → General → Title: "Open Findings by Cloud Provider"
   → General → Effects → Background: #2A2A3E
   → General → Properties → Position:
     X: 660, Y: 350, Width: 400, Height: 300
```

#### Step 8: Add Risk by Business Unit Stacked Bar (Bottom-Left)

```
1. Click empty canvas → Visualizations → "Stacked bar chart" icon
2. FIELD ASSIGNMENTS:
   → Y-axis: drag cmdb_assets[business_unit]
   → X-axis: drag [Total Risk Score] from _Measures
   → Legend: drag wiz_findings[severity]
3. FORMAT:
   → Visual → Bars:
     CRITICAL: #FF4444, HIGH: #FF8C00, MEDIUM: #FFD700, LOW: #4CAF50
   → Visual → X-axis: Color: #A0A0C0, Gridlines: #3A3A5E
   → Visual → Y-axis: Color: #A0A0C0
   → Visual → Data labels: ON, Color: #FFFFFF, Size: 10
   → General → Title: "Risk Exposure by Business Unit"
   → General → Effects → Background: #2A2A3E
   → Position: X: 40, Y: 670, Width: 600, Height: 300

4. SORT the chart:
   → Click the three-dot menu (⋯) on the chart header
   → Sort by → "Total Risk Score"
   → Click again → Sort descending
   → Now the highest-risk BU is at the top
```

#### Step 9: Add Data Classification × Severity Matrix (Bottom-Right)

```
1. Click empty canvas → Visualizations → "Matrix" icon (grid with header)
2. FIELD ASSIGNMENTS:
   → Rows: drag wiz_findings[data_classification]
   → Columns: drag wiz_findings[severity]
   → Values: drag [Open Findings] from _Measures
3. FORMAT:
   → Visual → Column headers:
     Font: Segoe UI Bold, Size: 11, Color: #FFFFFF
     Background: #2A2A3E
   → Visual → Row headers:
     Font: Segoe UI, Size: 11, Color: #A0A0C0
   → Visual → Values:
     Font: Segoe UI, Size: 12, Color: #FFFFFF
   → Visual → Grid:
     Vertical gridlines: #3A3A5E
     Horizontal gridlines: #3A3A5E
     Row padding: 6
   → General → Title: "Sensitive Data Risk Heatmap"
   → General → Effects → Background: #2A2A3E
   → Position: X: 660, Y: 670, Width: 600, Height: 300

4. ADD HEATMAP CONDITIONAL FORMATTING:
   → In the Values field well, click the ▼ dropdown on [Open Findings]
   → Select "Conditional formatting" → "Background color"
   → Format style: Gradient
   → Minimum: Value 0, Color: #2A2A3E (dark — blends with background)
   → Maximum: Value 5, Color: #FF4444 (red — danger)
   → Click OK
   → Now cells with more findings glow increasingly red
```

---

## 📊 PAGE 2: SLA & REMEDIATION OPERATIONS

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SLA & REMEDIATION OPERATIONS                              [ March 2025 ]│
│                                                                          │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│ │ SLA       │  │ SLA       │  │ SLA       │  │ MTTR      │            │
│ │ COMPLI-   │  │ BREACHED  │  │ AT RISK   │  │ (DAYS)    │            │
│ │ ANCE %    │  │           │  │           │  │           │            │
│ │   48%     │  │    18     │  │    7      │  │   5.2     │            │
│ │  🔴 FAIL  │  │  🔴 CRIT  │  │  🟠 WARN │  │  🟡 AVG   │            │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘            │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  SLA PERFORMANCE BY TEAM (Stacked Bar — most important chart)       ││
│ │                                                                      ││
│ │  Container-Platform  ████████ 3 breach │ 4 at risk │ 2 on track     ││
│ │  Platform-Eng        █████ 3 breach │ 0 at risk │ 2 on track       ││
│ │  Network-Ops         ████ 2 breach │ 0 at risk │ 3 on track        ││
│ │  Data-Engineering    ███ 2 breach │ 2 at risk │ 5 on track         ││
│ │  AppDev-Team         ███ 3 breach │ 1 at risk │ 1 on track         ││
│ │  Identity-Security   ██ 1 breach │ 0 at risk │ 2 on track          ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌────────────────────────────┐  ┌─────────────────────────────────────┐│
│ │  MTTR BY PRIORITY (Column) │  │  OPEN vs CLOSED TREND (Area Chart) ││
│ │                            │  │                                     ││
│ │  P1: 1.5 days (target: 1) │  │  Opened ↗ climbing steadily        ││
│ │  P2: 6.0 days (target: 7) │  │  Closed → flat (not keeping up)    ││
│ │  P3: 18 days (target: 30) │  │  Gap widening 🔴                    ││
│ │  P4: N/A (none closed)    │  │                                     ││
│ └────────────────────────────┘  └─────────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  OPEN CRITICAL FINDINGS — DRILLTHROUGH TABLE                        ││
│ │                                                                      ││
│ │  Finding | Title              | Days | Owner       | SLA    | BU     ││
│ │  WIZ-001 | S3 Public Access   | 75d  | Rajesh K    | BREACH | CapMkt ││
│ │  WIZ-002 | NSG SSH 0.0.0.0/0  | 72d  | Amit P      | BREACH | DigBnk ││
│ │  WIZ-009 | MFA Not Enforced   | 60d  | Priya S     | BREACH | EntSec ││
│ │  WIZ-012 | GKE Legacy ABAC    | 55d  | Kevin Z     | BREACH | DigBnk ││
│ │  WIZ-016 | NSG All Inbound    | 47d  | Amit P      | BREACH | Infra  ││
│ │  WIZ-023 | SA Owner Role      | 36d  | Kevin Z     | ATRISK | DigBnk ││
│ │  WIZ-024 | AKS Privileged     | 34d  | Kevin Z     | ATRISK | DigBnk ││
│ │  WIZ-040 | NSG MySQL Open     | 9d   | Sarah J     | ATRISK | RetBnk ││
│ └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Build Instructions — Page 2 (Detailed)

#### Step 1: Page Setup

```
1. Click "+" at the bottom to add a new page
2. Right-click the new tab → Rename → "SLA & Remediation Operations"
3. Click empty canvas → Format pane (paint roller):
   → Canvas background: Color #1E1E2E, Transparency 0%
   → Canvas settings: Custom, 1920 × 1080
4. Add header text box (same method as Page 1):
   Text: "🔧 SLA & REMEDIATION OPERATIONS"
   Position: X: 0, Y: 0, Width: 1920, Height: 60
```

#### Step 2: Create 3 Additional DAX Measures (Needed for This Page)

```
Before building visuals, create these measures in _Measures table:
(Modeling → New Measure → paste each one)
```

```dax
Opened This Month = CALCULATE(
    COUNTROWS(wiz_findings),
    MONTH(wiz_findings[created_date]) = MONTH(TODAY()) &&
    YEAR(wiz_findings[created_date]) = YEAR(TODAY())
)
```

```dax
Closed This Month = CALCULATE(
    COUNTROWS(wiz_findings),
    wiz_findings[status] = "Closed",
    MONTH(wiz_findings[closed_date]) = MONTH(TODAY()) &&
    YEAR(wiz_findings[closed_date]) = YEAR(TODAY())
)
```

```dax
Net Change = [Opened This Month] - [Closed This Month]
```

#### Step 3: Add 4 SLA KPI Cards (Top Row)

```
Create 4 cards using the same method as Page 1:

CARD 1 — SLA Compliance %:
  → Drag [SLA Compliance %] into Fields
  → FORMAT:
    Callout value: Size 36, Color #FFFFFF
    Category label: "SLA COMPLIANCE", Color #A0A0C0
    Background: #2A2A3E
    Border: Left bar, Color #4CAF50, Width 4
    Position: X: 40, Y: 80, Width: 220, Height: 120
  → Conditional formatting (font color):
    < 70: #FF4444 (red)
    70-90: #FF8C00 (orange)
    ≥ 90: #4CAF50 (green)

CARD 2 — SLA Breached:
  → Drag [SLA Breached Count]
  → Category label: "SLA BREACHED"
  → Border: #FF4444 (red)
  → Position: X: 280, Y: 80, Width: 220, Height: 120
  → Conditional: > 0 THEN #FF4444 (always red)

CARD 3 — MTTR Days:
  → Drag [MTTR Days]
  → Category label: "AVG MTTR (DAYS)"
  → FORMAT: Decimal places: 1
  → Border: #FFD700 (gold)
  → Position: X: 520, Y: 80, Width: 220, Height: 120
  → Conditional: > 7 THEN #FF4444, 3-7 THEN #FF8C00, < 3 THEN #4CAF50

CARD 4 — Net Change:
  → Drag [Net Change]
  → Category label: "NET CHANGE (OPENED - CLOSED)"
  → Border: #9b59b6 (purple)
  → Position: X: 760, Y: 80, Width: 220, Height: 120
  → Conditional: > 0 THEN #FF4444 (backlog growing = bad)
                  = 0 THEN #FFD700
                  < 0 THEN #4CAF50 (backlog shrinking = good)
```

#### Step 4: Add SLA by Team — 100% Stacked Bar Chart

```
1. Visualizations → "100% Stacked bar chart" icon
   (NOT regular stacked bar — this shows PROPORTIONS)
2. FIELD ASSIGNMENTS:
   → Y-axis: drag wiz_findings[assignment_group]
             (or cmdb_assets[assignment_group] if using CMDB)
   → X-axis: drag [Open Findings] from _Measures
   → Legend: drag wiz_findings[SLA_Met]
3. FORMAT:
   → Visual → Bars → Data colors:
     Click each legend entry to set colors:
     "Breached": #FF4444 (red)
     "On Track": #4CAF50 (green)
     "Met": #2196F3 (blue)
     "Missed": #FF8C00 (orange)
   → Visual → Y-axis:
     Font: Segoe UI, Size: 11, Color: #FFFFFF
   → Visual → X-axis:
     Title: OFF
     Labels: ON, Color: #A0A0C0
   → Visual → Data labels:
     ON, Color: #FFFFFF, Size: 10
     Display units: None
   → Visual → Legend:
     Position: Top, Color: #A0A0C0
   → General → Title:
     Text: "SLA Performance by Assignment Group"
     Font: Segoe UI, Size: 14, Color: #A0A0C0
   → General → Effects → Background: #2A2A3E
   → General → Effects → Border: ON, #3A3A5E, Round 8px
   → Position: X: 40, Y: 220, Width: 940, Height: 300

4. SORT:
   → Click ⋯ (three dots) on chart → Sort by → Count of SLA Breached
   → Sort descending (team with most breaches at top)
```

#### Step 5: Add MTTR by Severity — Clustered Column Chart

```
1. Visualizations → "Clustered column chart"
2. FIELD ASSIGNMENTS:
   → X-axis: drag wiz_findings[severity]
   → Y-axis: drag [MTTR Days] from _Measures
3. FORMAT:
   → Visual → Columns → Data colors:
     CRITICAL: #FF4444, HIGH: #FF8C00, MEDIUM: #FFD700, LOW: #4CAF50
   → Visual → X-axis:
     Sort order: Use Severity_Order column
     HOW TO SORT BY Severity_Order:
       a. Click ⋯ on chart → Sort by → Severity_Order
       b. Now CRITICAL appears first, then HIGH, MEDIUM, LOW
     Font: Segoe UI, Size: 11, Color: #A0A0C0
   → Visual → Y-axis:
     Title: "Average Days to Resolve"
     Color: #A0A0C0
     Gridlines: #3A3A5E
   → Visual → Data labels: ON, Color #FFFFFF, Size 11
   → General → Title: "Mean Time to Remediate by Severity"
   → General → Effects → Background: #2A2A3E
   → Position: X: 40, Y: 540, Width: 450, Height: 280

4. ADD REFERENCE LINES (SLA targets):
   → Format → Visual → Reference lines (or "Analytics" pane on older versions)
   → Click "+" Add line → Constant line
     Value: 1, Label: "P1 Target (1 day)", Color: #FFFFFF, Style: Dashed
   → Add another: Value: 7, Label: "P2 Target (7 days)", Style: Dashed
   → Add another: Value: 30, Label: "P3 Target (30 days)", Style: Dashed
   → These horizontal lines show if teams meet their SLA targets
```

#### Step 6: Add Opened vs Closed Trend — Area Chart

```
1. Visualizations → "Area chart" icon
2. FIELD ASSIGNMENTS:
   → X-axis: drag wiz_findings[Month_Year]
   → Y-axis: drag BOTH measures:
     [Opened This Month]
     [Closed This Month]
3. FORMAT:
   → Visual → Data colors:
     Opened This Month: #FF4444 (red — new problems)
     Closed This Month: #4CAF50 (green — problems fixed)
   → Visual → Area transparency: 60% (so you can see overlap)
   → Visual → Lines: Stroke width 2
   → Visual → Legend:
     Position: Top, Color: #A0A0C0
   → Visual → X-axis: Color #A0A0C0, Title OFF
   → Visual → Y-axis: Color #A0A0C0, Gridlines #3A3A5E
   → General → Title: "Findings Opened vs Closed — Monthly Trend"
   → General → Effects → Background: #2A2A3E
   → Position: X: 510, Y: 540, Width: 470, Height: 280

INSIGHT TO LOOK FOR:
  → If red area > green area → backlog is GROWING (bad)
  → If green area > red area → backlog is SHRINKING (good)
  → The GAP between lines = net change per month
```

#### Step 7: Add Open Critical Findings Table

```
1. Visualizations → "Table" icon (grid with rows)
2. FIELD ASSIGNMENTS (drag each into the "Columns" well):
   → wiz_findings[finding_id]
   → wiz_findings[title]
   → wiz_findings[severity]
   → wiz_findings[Days_Open]
   → cmdb_assets[owner]
   → wiz_findings[SLA_Met]
   → cmdb_assets[business_unit]
3. ADD FILTERS (Filters pane on the right):
   → Drag wiz_findings[severity] into "Filters on this visual"
   → Expand it → check ONLY "CRITICAL" and "HIGH"
   → Drag wiz_findings[status] into "Filters on this visual"
   → Expand it → check ONLY "Open"
4. FORMAT:
   → Visual → Style: "Minimal" (from the Style dropdown at top)
   → Visual → Column headers:
     Font: Segoe UI Bold, Size: 11, Color: #FFFFFF
     Background: #3A3A5E
   → Visual → Values:
     Font: Segoe UI, Size: 10, Color: #FFFFFF
     Background: #2A2A3E, Alternate: #252540
   → Visual → Grid:
     Horizontal gridlines: #3A3A5E
     Row padding: 4
   → General → Title: "Open Critical/High Findings — Action Required"
   → General → Effects → Background: #2A2A3E
   → Position: X: 1000, Y: 80, Width: 880, Height: 740

5. SORT the table:
   → Click the "Days_Open" column header in the visual → sort descending
   → Oldest (most urgent) findings appear first

6. CONDITIONAL FORMATTING on Days_Open column:
   → Click ▼ dropdown on Days_Open in the Columns well
   → "Conditional formatting" → "Background color"
   → Format style: Rules
   → Rules:
     IF value > 60 THEN Background: #FF4444 (red — severely overdue)
     IF value > 30 AND ≤ 60 THEN Background: #FF8C00 (orange)
     IF value ≤ 30 THEN Background: #2A2A3E (dark — normal)
   → Click OK

7. CONDITIONAL FORMATTING on SLA_Met column:
   → Click ▼ dropdown on SLA_Met in Columns well
   → "Conditional formatting" → "Background color"
   → Format style: Rules
   → Rules:
     IF value = "Breached" THEN Background: #FF4444
     IF value = "Missed" THEN Background: #FF8C00
     IF value = "On Track" THEN Background: #4CAF50
     IF value = "Met" THEN Background: #2196F3
   → Click OK
```

---

## 📊 PAGE 3: POSTURE IMPROVEMENT & COMPLIANCE

```
┌──────────────────────────────────────────────────────────────────────────┐
│ POSTURE IMPROVEMENT & COMPLIANCE                          [ March 2025 ]│
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  FINDINGS BY CATEGORY (Treemap)                                     ││
│ │                                                                      ││
│ │  ┌──────────────┬──────────────┬──────────────┐                     ││
│ │  │   NETWORK    │     IAM      │   STORAGE    │                     ││
│ │  │   10 (20%)   │   10 (20%)   │   10 (20%)   │                     ││
│ │  ├──────────────┼──────────┬───┴──────────────┤                     ││
│ │  │  CONTAINER   │ COMPUTE  │ ENCRYPT │  DB    │                     ││
│ │  │   8 (16%)    │  4 (8%)  │ 3 (6%)  │ 3 (6%)│                     ││
│ │  └──────────────┴──────────┴─────────┴────────┘                     ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌────────────────────────────┐  ┌─────────────────────────────────────┐│
│ │  CIS BENCHMARK GAPS        │  │  AGING ANALYSIS (Histogram)        ││
│ │  (Horizontal Bar)          │  │                                     ││
│ │                            │  │  0-7d:   ████ 8 findings            ││
│ │  CIS Azure 6.x Network: 5 │  │  8-30d:  ██████ 12 findings        ││
│ │  CIS Azure 1.x IAM:     4 │  │  31-60d: ████████ 14 findings      ││
│ │  CIS Azure 3.x Storage: 4 │  │  60+d:   ██████ 6 findings 🔴      ││
│ │  CIS GKE 6.x Container: 3 │  │                                     ││
│ │  CIS GCP 1.x IAM:       3 │  │                                     ││
│ │  CIS Azure 7.x Compute: 2 │  │                                     ││
│ └────────────────────────────┘  └─────────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  🔑 TOP 5 IMPROVEMENT RECOMMENDATIONS                              ││
│ │                                                                      ││
│ │  1. 🔴 ELIMINATE SLA BREACHES: 18 breached tickets (36%).           ││
│ │     → Implement automated escalation at 75% of SLA window.          ││
│ │     → Impact: SLA compliance from 48% → target 85%+                 ││
│ │                                                                      ││
│ │  2. 🔴 CLOSE 8 OPEN CRITICAL FINDINGS: Some are 60-75 days old.    ││
│ │     → Weekly CISO review for all P1s. War-room for findings >30d.   ││
│ │     → Impact: Security Score from 37 → estimated 69                  ││
│ │                                                                      ││
│ │  3. 🟠 HARDEN CONTAINER SECURITY: 8 container findings (16%).       ││
│ │     → Deploy PSA restricted on production namespaces.               ││
│ │     → Enable KAC to block privileged/root pods. Impact: -8 findings ││
│ │                                                                      ││
│ │  4. 🟠 LOCK DOWN NETWORK LAYER: 10 network findings (20%).         ││
│ │     → Auto-remediate 0.0.0.0/0 rules via Lambda/Azure Function.    ││
│ │     → Enforce NSG baseline via Azure Policy. Impact: -6 findings    ││
│ │                                                                      ││
│ │  5. 🟡 ENFORCE MFA & IAM HYGIENE: 10 IAM findings (20%).           ││
│ │     → Entra ID Conditional Access policies. Rotate stale SA keys.   ││
│ │     → Automate key rotation for GCP Service Accounts.               ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  OWNER ACCOUNTABILITY MATRIX                                        ││
│ │                                                                      ││
│ │  Owner          │ Critical │ High │ Breached │ Score │ Status        ││
│ │  Kevin Zhang    │    3     │   3  │    3     │  48   │ 🔴 Overloaded ││
│ │  Amit Patel     │    2     │   0  │    2     │  24   │ 🟠 At Limit   ││
│ │  Rajesh Kumar   │    1     │   2  │    3     │  19   │ 🟠 At Limit   ││
│ │  Sarah Johnson  │    1     │   1  │    2     │  17   │ 🟠 At Limit   ││
│ │  Priya Sharma   │    1     │   1  │    1     │  14   │ 🟡 Managing   ││
│ │  Others         │    0     │   5  │    3     │  10   │ 🟡 Managing   ││
│ └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Build Instructions — Page 3 (Detailed)

#### Step 1: Page Setup

```
1. Click "+" at bottom → Rename → "Posture Improvement & Compliance"
2. Canvas background: #1E1E2E, Canvas: 1920 × 1080
3. Add header text box:
   Text: "📋 POSTURE IMPROVEMENT & COMPLIANCE"
   Position: X: 0, Y: 0, Width: 1920, Height: 60
```

#### Step 2: Add Category Treemap (Top — Full Width)

```
1. Visualizations → "Treemap" icon (nested rectangles)
2. FIELD ASSIGNMENTS:
   → Group: drag wiz_findings[category]
   → Values: drag [Open Findings] from _Measures
3. ADD FILTER:
   → Drag wiz_findings[status] into "Filters on this visual"
   → Check ONLY "Open"
4. FORMAT:
   → Visual → Data colors:
     Click each category rectangle to set color:
     Network: #FF4444, IAM: #FF8C00, Storage: #FFD700
     Container: #e74c3c, Compute: #9b59b6
     Encryption: #3498db, Database: #2ecc71
   → Visual → Category labels:
     Font: Segoe UI Bold, Size: 12, Color: #FFFFFF
   → Visual → Data labels:
     ON, Display units: None, Color: #FFFFFF
     Label format: Category + Value (e.g., "Network - 10")
   → General → Title: "Open Findings by Security Category"
   → General → Effects → Background: #2A2A3E
   → General → Effects → Border: ON, #3A3A5E, Round 8px
   → Position: X: 40, Y: 80, Width: 1840, Height: 250

5. INTERACTION:
   → Clicking a category filters ALL other visuals on this page
   → Click "Network" → CIS gaps chart shows only network benchmarks
```

#### Step 3: Add CIS Benchmark Gaps — Clustered Bar Chart (Middle-Left)

```
1. Visualizations → "Clustered bar chart" (horizontal bars)
2. FIELD ASSIGNMENTS:
   → Y-axis: drag wiz_findings[compliance_framework]
   → X-axis: drag [Open Findings] from _Measures
3. ADD FILTER:
   → wiz_findings[status] → check only "Open"
4. FORMAT:
   → Visual → Bars:
     All bars: #3498db (or conditional by count)
   → Visual → Y-axis:
     Font: Segoe UI, Size: 10, Color: #A0A0C0
     Title: OFF
   → Visual → X-axis:
     Color: #A0A0C0, Gridlines: #3A3A5E
   → Visual → Data labels: ON, Color #FFFFFF, Size: 10
   → General → Title: "CIS Benchmark Gaps — Open Findings by Framework"
   → General → Effects → Background: #2A2A3E
   → Position: X: 40, Y: 350, Width: 450, Height: 280

5. SORT:
   → Click ⋯ → Sort by → Open Findings → Sort descending
   → Framework with most gaps appears at top
```

#### Step 4: Add Finding Age Distribution — Column Chart (Middle-Right)

```
1. Visualizations → "Clustered column chart" (vertical bars)
2. FIELD ASSIGNMENTS:
   → X-axis: drag wiz_findings[Age_Bucket]
   → Y-axis: drag [Open Findings] from _Measures
3. ADD FILTER:
   → wiz_findings[status] → check only "Open"
4. FORMAT:
   → Visual → Columns:
     Default: #3498db
   → Visual → X-axis:
     Font: Segoe UI, Size: 11, Color: #A0A0C0
   → Visual → Data labels: ON, Color #FFFFFF
   → General → Title: "Finding Age Distribution"
   → General → Effects → Background: #2A2A3E
   → Position: X: 510, Y: 350, Width: 450, Height: 280

5. SORT X-axis to correct order (0-7, 8-30, 31-60, 60+):
   → Click ⋯ → Sort by → Age_Bucket
   → If wrong order, you need a sort column:
     Go to Modeling → New Column on wiz_findings table:
     Age_Bucket_Order =
       SWITCH([Age_Bucket],
         "0-7 days", 1,
         "8-30 days", 2,
         "31-60 days", 3,
         "60+ days", 4, 5)
   → Then: Click ⋯ → Sort by → Age_Bucket_Order

6. CONDITIONAL FORMATTING on columns:
   → Format → Visual → Columns → Color → click "fx"
   → Format style: Rules, Based on: [Open Findings]
   → Rules:
     IF Age_Bucket = "60+ days" THEN #FF4444 (red)
     IF Age_Bucket = "31-60 days" THEN #FF8C00 (orange)
     ELSE #3498db (blue)
   → Click OK → the "60+ days" column is now RED (urgency!)
```

#### Step 5: Add Improvement Recommendations — Text Box (Bottom-Left)

```
1. Insert ribbon → Text box
2. Click-drag a rectangle on the canvas
3. Type the following (with formatting):

   🔑 TOP 5 IMPROVEMENT RECOMMENDATIONS

   1. 🔴 ELIMINATE SLA BREACHES
      18 breached tickets (36%). Implement automated escalation
      at 75% of SLA window. Target: 85%+ SLA compliance.

   2. 🔴 CLOSE OPEN CRITICALS
      8 open Criticals, some 60+ days old. Weekly CISO review.
      Impact: Security Score 37 → 69.

   3. 🟠 HARDEN CONTAINERS
      8 container findings. Deploy PSA restricted + KAC.
      Impact: -8 findings.

   4. 🟠 LOCK DOWN NETWORK
      10 network findings. Auto-remediate 0.0.0.0/0 rules.
      Impact: -6 findings.

   5. 🟡 ENFORCE IAM HYGIENE
      10 IAM findings. MFA via Conditional Access. Rotate SA keys.

4. FORMAT the text:
   → Title line: Segoe UI Bold, Size 14, Color: #FFD700 (gold)
   → Item numbers: Bold, Color: #FFFFFF
   → Body text: Segoe UI, Size: 10, Color: #A0A0C0
5. FORMAT the text box:
   → General → Effects → Background: #2A2A3E
   → General → Effects → Border: ON, #3A3A5E, Round 8px
   → Position: X: 40, Y: 650, Width: 600, Height: 350

NOTE: This is STATIC text — update it monthly based on current data.
```

#### Step 6: Add Owner Accountability Matrix (Bottom-Right)

```
1. Visualizations → "Matrix" icon
2. FIELD ASSIGNMENTS:
   → Rows: drag cmdb_assets[owner]
   → Values: drag these in ORDER:
     [Critical Open]
     [High Open]
     [SLA Breached Count]
     [MTTR Days]
     [Total Risk Score]
3. FORMAT:
   → Visual → Row headers:
     Font: Segoe UI, Size: 11, Color: #FFFFFF
   → Visual → Column headers:
     Font: Segoe UI Bold, Size: 10, Color: #A0A0C0
     Background: #3A3A5E
   → Visual → Values:
     Font: Segoe UI, Size: 11, Color: #FFFFFF
   → Visual → Grid:
     Row padding: 6
     Horizontal gridlines: #3A3A5E
   → General → Title: "Owner Accountability — Risk & SLA Performance"
   → General → Effects → Background: #2A2A3E
   → Position: X: 660, Y: 650, Width: 600, Height: 350

4. SORT:
   → Click ⋯ → Sort by → Total Risk Score → descending
   → Highest-risk owner appears first

5. CONDITIONAL FORMATTING on Critical Open column:
   → Click ▼ on [Critical Open] in Values well
   → "Conditional formatting" → "Background color"
   → Rules:
     IF value > 2 THEN Background: #FF4444 (red)
     IF value = 1 or 2 THEN Background: #FF8C00 (orange)
     IF value = 0 THEN Background: #2A2A3E (dark)
   → Click OK

6. CONDITIONAL FORMATTING on SLA Breached Count:
   → Same process:
     IF value > 2 THEN #FF4444 (red)
     IF value = 1 or 2 THEN #FF8C00 (orange)
     IF value = 0 THEN #4CAF50 (green)

7. CONDITIONAL FORMATTING on Total Risk Score (data bars):
   → Click ▼ on [Total Risk Score] → "Conditional formatting" → "Data bars"
   → Positive bar: #FF4444 (red fill)
   → Show bar only: NO (show number AND bar)
   → Click OK → horizontal bars inside cells show relative risk
```

---

## 📊 BONUS PAGE: DRILL-THROUGH DETAIL PAGE (Detailed Setup)

```
This page shows FULL DETAILS when someone right-clicks a finding,
team, or severity on any other page and selects "Drill through."
```

#### Step 1: Create the Drill-Through Page

```
1. Click "+" → Rename → "Finding Detail"
2. Canvas background: #1E1E2E
3. Add header text: "🔍 FINDING DETAIL — DRILL-THROUGH"

4. CONFIGURE DRILL-THROUGH FIELDS:
   → Click the empty canvas (no visual selected)
   → In the Visualizations pane, find "Drill through" section at bottom
   → Drag these fields into the Drill-through wells:
     wiz_findings[severity]
     cmdb_assets[assignment_group]
     cmdb_assets[owner]
   → Cross-report drill-through: ON (allows drill from other pages)

5. Power BI auto-adds a "← Back" button — keep it!
   → Format the back button:
     Text: "← Back to Dashboard"
     Background: #3498db
     Font color: #FFFFFF
     Position: X: 40, Y: 80, Width: 180, Height: 35
```

#### Step 2: Add Detail Table on Drill-Through Page

```
1. Visualizations → "Table"
2. COLUMNS (drag all of these):
   → wiz_findings[finding_id]
   → wiz_findings[title]
   → wiz_findings[severity]
   → wiz_findings[status]
   → wiz_findings[category]
   → wiz_findings[cloud_provider]
   → wiz_findings[resource_name]
   → wiz_findings[Days_Open]
   → wiz_findings[SLA_Met]
   → cmdb_assets[owner]
   → cmdb_assets[owner_email]
   → cmdb_assets[assignment_group]
   → cmdb_assets[business_unit]
   → cmdb_assets[environment]
   → cmdb_assets[data_classification]
   → wiz_findings[compliance_framework]
3. FORMAT:
   → Same dark theme as other tables
   → Full page width: X: 40, Y: 130, Width: 1840, Height: 900
   → Conditional formatting on severity, SLA_Met, Days_Open
     (same rules as Page 2 table)

HOW TO USE:
  → On Page 1, right-click any bar in the "Risk by BU" chart
  → Select "Drill through" → "Finding Detail"
  → The detail page shows ONLY findings for that business unit
  → Click "← Back" to return to the original page
```

---

## ✅ PAGE NAVIGATION — Connect All Pages

#### Option 1: Page Navigator (Recommended)

```
1. On EACH page, add navigation:
   → Insert ribbon → Buttons → Navigator → "Page navigator"
   → Power BI auto-creates buttons for all pages
2. FORMAT:
   → Shape → Fill: #2A2A3E
   → Shape → Outline: #3A3A5E
   → Text → Color: #FFFFFF, Size: 11
   → Selected state → Fill: #3498db (blue highlight for current page)
   → Position: top-right corner of each page
     X: 1400, Y: 10, Width: 500, Height: 40
3. HIDE the drill-through page from navigation:
   → Right-click "Finding Detail" tab → "Hide page"
   → It won't show in the navigator but is still accessible via drill-through
```

#### Option 2: Custom Buttons

```
1. Insert → Buttons → Blank
2. Format:
   → Text: "Executive Summary" (or whichever page)
   → Action → Type: "Page navigation"
   → Action → Destination: select the target page
3. Repeat for each page
4. Style them as tabs across the top
```

---

## 🕐 ADD LAST REFRESH DATE

```
1. Create a DAX measure:

Last Refresh = "Data as of: " & FORMAT(NOW(), "DD-MMM-YYYY HH:MM")

2. Add a Card visual on each page:
   → Drag [Last Refresh] into Fields
   → FORMAT:
     Callout value: Size 11, Color: #A0A0C0
     Category label: OFF
     Background: transparent (or match header)
   → Position: top-right corner, X: 1700, Y: 15, Width: 200, Height: 35
3. This updates automatically every time the dashboard refreshes
```

---

# PART 6: WHAT THE DATA TELLS US — IMPROVEMENT ROADMAP

## 6.1 Current State Assessment

| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| Security Score | **37/100** | 75/100 | 38 points | 🔴 P1 |
| SLA Compliance | **48%** | 90% | 42% gap | 🔴 P1 |
| Critical Open | **8** | 0 | 8 findings | 🔴 P1 |
| MTTR (P1) | **~5 days** | 1 day | 4 days | 🟠 P2 |
| Closure Rate | **20%** | 80%+ | 60% gap | 🟠 P2 |
| Internet Exposure | **8** | 0 | 8 findings | 🔴 P1 |

## 6.2 30-60-90 Day Improvement Plan

### Days 1-30: STOP THE BLEEDING
```
OBJECTIVE: Close all Critical findings and fix SLA breach process

ACTIONS:
├── Week 1: War room for 8 open Criticals
│   ├── WIZ-001: S3 public access → disable public access (1 hour fix)
│   ├── WIZ-002: NSG SSH 0.0.0.0/0 → restrict to VPN CIDR (1 hour fix)
│   ├── WIZ-009: MFA not enforced → enable Conditional Access policy
│   └── WIZ-016: NSG all inbound → restrict immediately
│
├── Week 2: Fix remaining Criticals
│   ├── WIZ-012: GKE legacy ABAC → enable RBAC, disable ABAC
│   ├── WIZ-023: SA Owner role → scope down to specific permissions
│   ├── WIZ-024: AKS privileged pod → remove privileged, add specific caps
│   └── WIZ-040: NSG MySQL open → restrict to app subnet CIDR
│
├── Week 3-4: Fix SLA process
│   ├── Implement auto-escalation: 50% SLA → email owner
│   ├── 75% SLA → email manager
│   ├── 100% SLA breached → email director + CISO
│   └── Weekly SLA dashboard review with all team leads

EXPECTED IMPACT:
├── Security Score: 37 → 69 (closing 8 Criticals removes 32 points of deductions)
├── Critical Open: 8 → 0
├── SLA Breach Rate: 36% → starts declining
└── Internet Exposure: 8 → 0
```

### Days 31-60: FIX THE FOUNDATION
```
OBJECTIVE: Address High-severity backlog and implement preventive controls

ACTIONS:
├── Close 12 open HIGH findings (prioritize internet-facing and Restricted data)
├── Deploy KAC/PSA on all production K8s namespaces
│   ├── PSA enforce: baseline on all namespaces
│   ├── PSA enforce: restricted on payments, PII namespaces
│   └── KAC: block privileged, unscanned images, Docker Hub
├── Deploy auto-remediation for:
│   ├── S3/GCS public access → auto-disable via Lambda/Cloud Function
│   ├── NSG 0.0.0.0/0 rules → auto-fix via Azure Function
│   └── Unencrypted storage → auto-enable encryption
├── Implement NetworkPolicies: default-deny on all prod namespaces

EXPECTED IMPACT:
├── Security Score: 69 → 81
├── High Open: 12 → 0
├── New findings auto-remediated before becoming tickets
└── Container findings reduced by 80%
```

### Days 61-90: CONTINUOUS IMPROVEMENT
```
OBJECTIVE: Achieve steady-state security posture management

ACTIONS:
├── Clear Medium/Low backlog (16 findings)
├── Implement shift-left scanning in CI/CD
│   ├── IaC scanning (Checkov/tfsec) in Terraform pipelines
│   ├── Container image scanning in build pipeline
│   └── Break builds for Critical CVEs
├── Monthly executive report automation (Power BI scheduled refresh)
├── Quarterly CIS benchmark assessment review
├── Set up Wiz → ServiceNow auto-ticket creation for new findings

EXPECTED IMPACT:
├── Security Score: 81 → 90+
├── SLA Compliance: 90%+
├── New findings caught at build time (before production)
└── MTTR: P1 = <24 hours, P2 = <7 days
```

---

# PART 7: INTERVIEW TALKING POINTS

### Q: "How would you present cloud security posture to the CEO?"

> "I build a 3-page Power BI dashboard. Page 1 is the CEO view: one Security Score number (0-100), risk trend, and business unit exposure — they see in 10 seconds if we're improving or declining. Page 2 is operational: SLA compliance, team performance, MTTR, and a drill-through table of every open Critical finding. Page 3 is for GRC and audit: CIS benchmark gaps, compliance framework coverage, and actionable improvement recommendations. The dashboard connects to Wiz findings via API, enriches with CMDB ownership data, and pulls ticket SLA status from ServiceNow. I refresh it daily and present monthly to leadership."

### Q: "What metrics matter most for a CISO?"

> "Three metrics. **One: SLA Compliance %** — are we fixing things on time? In our current data, we're at 48% which is unacceptable for a financial institution. **Two: Security Score trend** — is the number going up or down month-over-month? A declining score means we're falling behind. **Three: MTTR by severity** — how fast are we closing Critical vs High vs Medium? If our P1 MTTR is 5 days but our SLA is 24 hours, there's a fundamental process failure. These three metrics together tell the CISO: are we finding things, are we fixing them fast enough, and is the overall trend positive?"

### Q: "What improvement would you recommend based on the data?"

> "Based on 50 findings, three immediate actions. **First:** War-room the 8 open Criticals — some are 60+ days old and internet-facing. Most are quick fixes (disable public access, restrict NSG rules). Closing these alone raises our Security Score from 37 to 69. **Second:** Fix the SLA process — 36% breach rate means automated escalation isn't working. I'd implement tiered escalation (50% → owner, 75% → manager, 100% → CISO) via ServiceNow workflow. **Third:** Deploy preventive controls — KAC for Kubernetes, auto-remediation Lambda for network/storage misconfigs, and IaC scanning to catch issues before they reach production."

---

# PART 8: MCP payload → Power BI model mapping (final mapping for `PowerBI_Project/EXECUTIVE_DASHBOARD_GUIDE`)

## 8.1 MCP payload schema (discover from `/mcp/model`)

Assume API returns:

```json
{
  "id": "CNAPP",
  "tables": [
    {"name":"Findings","columns":[{"name":"finding_id","dataType":"string"},{"name":"severity","dataType":"string"},{"name":"status","dataType":"string"},{"name":"created_date","dataType":"date"},{"name":"closed_date","dataType":"date"},{"name":"internet_facing","dataType":"string"},{"name":"resource_id","dataType":"string"},{"name":"category","dataType":"string"},{"name":"risk_score","dataType":"int64"}]},
    {"name":"Assets","columns":[{"name":"resource_id","dataType":"string"},{"name":"business_unit","dataType":"string"},{"name":"environment","dataType":"string"},{"name":"owner","dataType":"string"}]},
    {"name":"Tickets","columns":[{"name":"ticket_id","dataType":"string"},{"name":"finding_id","dataType":"string"},{"name":"sla_status","dataType":"string"},{"name":"created_date","dataType":"date"},{"name":"resolved_date","dataType":"date"},{"name":"assignment_group","dataType":"string"}]}
  ]
}
```

## 8.2 Power Query mapping

- Keep all MCP columns verbatim in the respective queries: `Findings`, `Assets`, `Tickets`.
- Apply the same transformations in PART 2, Step 2
  - `Findings` → add `Days Open`, `SLA Met`, `Risk Score`, etc.
  - `Assets` → keep as dimension, add any lookup mappings
  - `Tickets` → add `Days to Resolve`, `Priority Order`

## 8.3 Relationships from MCP to DAX

In Model view:
1. `Findings[resource_id]` (many) → `Assets[resource_id]` (one)
2. `Findings[finding_id]` (one) → `Tickets[finding_id]` (one)
3. `DateTable[Date]` (one) → `Findings[created_date]` (many)

This transforms MCP object graph into tabular in-memory relationship graph for DAX.

## 8.4 DAX measures (from MCP contextual data)

`Total Findings = COUNTROWS(Findings)`

`Open Findings = CALCULATE(COUNTROWS(Findings), Findings[status] = "Open")`

`Critical Open = CALCULATE(COUNTROWS(Findings), Findings[severity] = "CRITICAL", Findings[status] = "Open")`

`SLA Compliance % = DIVIDE(CALCULATE(COUNTROWS(Tickets), Tickets[sla_status] = "Met"), COUNTROWS(Tickets), 0) * 100`

`Enterprise Risk Score = SUMX(Findings, Findings[risk_score])`

`MTTR (days) =
DIVIDE(
   SUMX(FILTER(Tickets, NOT(ISBLANK(Tickets[resolved_date]))), DATEDIFF(Tickets[created_date], Tickets[resolved_date], DAY)),
   COUNTROWS(FILTER(Tickets, NOT(ISBLANK(Tickets[resolved_date])))),
   BLANK()
)`

`Findings trend (monthly) = CALCULATE([Total Findings], DATESINPERIOD(DateTable[Date], LASTDATE(DateTable[Date]), -12, MONTH))`

## 8.5 Final Power BI report (from Executive_Dashboard_Guide)

- Page 1: CEO snapshot (risk score, total findings, SLA compliance, business unit exposure, internet-facing criticals)
- Page 2: Operations production (open/closed trend, SLA breach by assignment group, MTTR, backlog age buckets)
- Page 3: GRC (compliance framework, CIS coverage, production/dev risk posture)

> Now you have a full mapping from MCP API model (schema + relationships) to Power BI implementation and final executive report layout.
