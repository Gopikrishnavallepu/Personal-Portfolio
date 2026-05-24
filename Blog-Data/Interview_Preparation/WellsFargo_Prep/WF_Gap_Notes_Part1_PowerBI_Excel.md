# 📊 GAP LEARNING NOTES — Part 1: Power BI, DAX, Power Query & Excel Advanced

> **For:** Wells Fargo Senior Info Security Analyst — CWLS Findings Management
> **Why:** Required qualification — build dashboards and reports for cloud security KPIs

---

# SECTION 1: POWER BI FUNDAMENTALS

## 1.1 What Is Power BI and Why Wells Fargo Uses It

```
POWER BI ARCHITECTURE:

Data Sources                Power BI Desktop           Power BI Service (Cloud)
┌──────────┐              ┌──────────────────┐        ┌──────────────────┐
│ CSV files │──┐           │                  │        │                  │
│ (Wiz export)│ │          │  Power Query     │        │  Dashboards      │
├──────────┤  │  ┌────┐   │  (ETL = Extract, │  ──►  │  Shared Reports  │
│ SQL DB    │──┼─►│ PBI│──►│   Transform,     │        │  Scheduled       │
│ (findings)│  │  │ Des│   │   Load)          │        │   Refresh        │
├──────────┤  │  │ ktop│   │                  │        │  Row-Level       │
│ REST APIs │──┤  └────┘   │  Data Model      │        │   Security       │
│ (Wiz API) │  │           │  (Relationships) │        │                  │
├──────────┤  │           │                  │        │  Mobile App      │
│ ServiceNow│──┘           │  DAX Measures     │        │                  │
│ (tickets) │              │  (Calculations)  │        │                  │
└──────────┘              │                  │        │                  │
                           │  Visualizations   │        │                  │
                           └──────────────────┘        └──────────────────┘
```

**Wells Fargo FM Team uses Power BI to:**
- Track open findings by severity, team, cloud account, and age
- Monitor SLA compliance rates across all teams
- Show MTTR (Mean Time to Remediate) trends
- Compliance dashboard (CIS/NIST pass rates over time)
- Coverage dashboards (% of assets scanned)
- Executive reports for CISO and governance

## 1.2 Power BI Desktop — Core Concepts

### The Three Layers

| Layer | What It Does | Where In Power BI |
|-------|-------------|-------------------|
| **Power Query (M)** | Extract, transform, load data from sources | "Transform Data" button |
| **Data Model** | Define table relationships, create calculated columns | "Model" view |
| **DAX Measures** | Create dynamic calculations for reports | "Modeling" tab → New Measure |

### Building Your First Security Dashboard — Step by Step

```
Step 1: GET DATA
├── File → Get Data → CSV (import Wiz findings export)
├── Or: Get Data → Web → enter Wiz API endpoint
├── Or: Get Data → SQL Server → enter connection string
└── Power Query Editor opens → you see raw data

Step 2: TRANSFORM DATA (Power Query)
├── Remove unnecessary columns (click column header → Remove)
├── Change data types (Date columns → Date type)
├── Filter rows (remove test/dev-only findings if needed)
├── Add custom columns (e.g., SLA_Status based on age + severity)
├── Merge Queries (join findings with CMDB data to get owners)
└── Click "Close & Apply" → data loads into model

Step 3: BUILD DATA MODEL
├── Go to Model View
├── Create relationships between tables
│   ├── Findings[asset_id] → CMDB[asset_id]  (many-to-one)
│   ├── Findings[team_id] → Teams[team_id]    (many-to-one)
│   └── Findings[date] → Calendar[date]       (many-to-one)
└── This enables cross-table filtering in reports

Step 4: CREATE DAX MEASURES
├── (See Section 2 below for all measures)

Step 5: BUILD VISUALIZATIONS
├── Drag fields onto canvas
├── Choose visual type (bar chart, card, table, matrix)
├── Add slicers for filtering (severity, team, date range)
└── Format → make it look professional
```

---

# SECTION 2: DAX — The Formula Language for Power BI

## 2.1 DAX Basics — Think of It Like Excel Formulas for Databases

| Concept | Excel Equivalent | DAX |
|---------|-----------------|-----|
| Simple count | `=COUNTA(A:A)` | `COUNTROWS(Findings)` |
| Conditional count | `=COUNTIFS(A:A,"CRITICAL")` | `CALCULATE(COUNTROWS(Findings), Findings[Severity]="CRITICAL")` |
| Sum | `=SUM(A:A)` | `SUM(Findings[RiskScore])` |
| Average | `=AVERAGE(A:A)` | `AVERAGE(Findings[Age_Days])` |
| Percentage | `=A1/B1*100` | `DIVIDE([On_Track], [Total], 0) * 100` |

## 2.2 Essential DAX for Security Dashboards

### Finding Counts

```dax
// Total open findings
Total_Open_Findings =
COUNTROWS(
    FILTER(Findings, Findings[Status] = "Open")
)

// Critical open findings
Critical_Open =
CALCULATE(
    COUNTROWS(Findings),
    Findings[Severity] = "CRITICAL",
    Findings[Status] = "Open"
)

// High open findings
High_Open =
CALCULATE(
    COUNTROWS(Findings),
    Findings[Severity] = "HIGH",
    Findings[Status] = "Open"
)

// Findings by cloud provider
Azure_Findings =
CALCULATE(COUNTROWS(Findings), Findings[Cloud] = "Azure")

GCP_Findings =
CALCULATE(COUNTROWS(Findings), Findings[Cloud] = "GCP")
```

### SLA Compliance

```dax
// SLA compliance rate (% of findings within SLA)
SLA_Compliance_Rate =
DIVIDE(
    CALCULATE(COUNTROWS(Findings), Findings[SLA_Status] = "On Track"),
    COUNTROWS(Findings),
    0
) * 100

// SLA breached count
SLA_Breached =
CALCULATE(
    COUNTROWS(Findings),
    Findings[SLA_Status] = "Breached",
    Findings[Status] = "Open"
)

// SLA compliance by severity (use with matrix visual)
SLA_Compliance_By_Severity =
VAR _total = COUNTROWS(Findings)
VAR _ontrack = CALCULATE(COUNTROWS(Findings), Findings[SLA_Status] = "On Track")
RETURN DIVIDE(_ontrack, _total, 0) * 100
```

### MTTR (Mean Time to Remediate)

```dax
// Average MTTR in days (for closed findings only)
MTTR_Days =
AVERAGEX(
    FILTER(Findings, Findings[Status] = "Closed"),
    DATEDIFF(Findings[Created_Date], Findings[Closed_Date], DAY)
)

// MTTR for Critical findings only
MTTR_Critical =
AVERAGEX(
    FILTER(Findings,
        Findings[Status] = "Closed" && Findings[Severity] = "CRITICAL"
    ),
    DATEDIFF(Findings[Created_Date], Findings[Closed_Date], DAY)
)
```

### Time Intelligence (Trends Over Time)

```dax
// Findings closed this month
Closed_This_Month =
CALCULATE(
    COUNTROWS(Findings),
    Findings[Status] = "Closed",
    DATESMTD(Findings[Closed_Date])
)

// Findings opened vs closed comparison
Net_Change =
[Opened_This_Month] - [Closed_This_Month]

// Month-over-month change
MoM_Change =
VAR _current = [Total_Open_Findings]
VAR _previous = CALCULATE([Total_Open_Findings], DATEADD(Calendar[Date], -1, MONTH))
RETURN DIVIDE(_current - _previous, _previous, 0) * 100
```

### Compliance Score

```dax
// CIS compliance percentage
CIS_Compliance_Pct =
DIVIDE(
    CALCULATE(COUNTROWS(Controls), Controls[Status] = "Pass"),
    COUNTROWS(Controls),
    0
) * 100

// Compliance trend (used with line chart over time)
Compliance_Score_Over_Time =
CALCULATE(
    [CIS_Compliance_Pct],
    FILTER(ALL(Calendar), Calendar[Date] <= MAX(Calendar[Date]))
)
```

## 2.3 Key DAX Functions to Memorize

| Function | What It Does | Example |
|----------|-------------|---------|
| `CALCULATE` | Changes filter context — THE most important function | `CALCULATE(COUNTROWS(T), T[Col]="X")` |
| `COUNTROWS` | Counts rows in a table | `COUNTROWS(Findings)` |
| `FILTER` | Returns a filtered table | `FILTER(Findings, Findings[Age]>90)` |
| `DIVIDE` | Safe division (handles divide by zero) | `DIVIDE(10, 0, 0)` → returns 0 |
| `SUMX` | Iterates and sums | `SUMX(Findings, Findings[Score])` |
| `AVERAGEX` | Iterates and averages | `AVERAGEX(T, DATEDIFF(...))` |
| `DATEDIFF` | Date difference | `DATEDIFF(Start, End, DAY)` |
| `DATESMTD` | Month-to-date filter | `DATESMTD(Calendar[Date])` |
| `ALL` | Removes all filters | `CALCULATE(COUNT, ALL(Findings))` |
| `VAR / RETURN` | Variables for readability | `VAR x = 10 RETURN x * 2` |

---

# SECTION 3: POWER QUERY (M-Language) — Data Transformation

## 3.1 What Power Query Does

Power Query is the **ETL engine** — it connects to data sources, cleans/transforms the data, and loads it into the model. You use it before DAX.

## 3.2 Common Transformations for Security Data

### Connecting to a CSV (Wiz Findings Export)

```
1. Get Data → Text/CSV → select file
2. Power Query Editor opens
3. Apply transformations:
```

### Key Operations

| Operation | What It Does | How (UI) | M-Language |
|-----------|-------------|----------|------------|
| Remove columns | Drop unnecessary columns | Right-click → Remove | `Table.RemoveColumns(Source, {"Col1"})` |
| Filter rows | Keep only relevant rows | Click dropdown → filter | `Table.SelectRows(Source, each [Status] <> "Closed")` |
| Change type | Set correct data types | Click column header icon | `Table.TransformColumnTypes(Source, {{"Date", type date}})` |
| Add custom column | Calculate new values | Add Column → Custom | `Table.AddColumn(Source, "Age", each Duration.Days(DateTime.LocalNow() - [Created]))` |
| Merge queries | JOIN two tables | Home → Merge Queries | `Table.NestedJoin(Findings, "AssetID", CMDB, "AssetID", "CMDB", JoinKind.LeftOuter)` |
| Group by | Aggregate data | Transform → Group By | `Table.Group(Source, {"Team"}, {{"Count", each Table.RowCount(_)}})` |
| Unpivot | Wide → tall format | Transform → Unpivot | `Table.UnpivotOtherColumns(Source, {"ID"}, "Attribute", "Value")` |
| Replace values | Fix data quality | Transform → Replace | `Table.ReplaceValue(Source, "HIGH", "High", Replacer.ReplaceText, {"Severity"})` |

### Example: Adding SLA Status Column

```m
// Add column that calculates SLA status based on severity and age
Table.AddColumn(Source, "SLA_Status", each
    let
        age = Duration.Days(DateTime.LocalNow() - [Created_Date]),
        sla = if [Severity] = "CRITICAL" then 1
              else if [Severity] = "HIGH" then 7
              else if [Severity] = "MEDIUM" then 30
              else 90
    in
        if age > sla then "Breached"
        else if age > sla * 0.75 then "At Risk"
        else "On Track"
)
```

### Example: Merging Findings with CMDB Owner Data

```
1. Load Findings CSV (table 1)
2. Load CMDB export (table 2)
3. Home → Merge Queries
4. Select: Findings[resource_id] = CMDB[ci_id]
5. Join Kind: Left Outer (keep all findings, add CMDB columns where matched)
6. Expand the merged column → select "Owner", "Team", "Environment"
7. Now every finding has an owner!
```

### Incremental Refresh (For Large Datasets)

```
WHY: Wiz may have millions of historical findings — you don't want to reload ALL data daily

HOW:
1. Create parameters: RangeStart and RangeEnd (type DateTime)
2. Filter your query: [Created_Date] >= RangeStart AND [Created_Date] < RangeEnd
3. In Power BI Service: Set incremental refresh policy
   - Store data for last 3 years
   - Refresh data for last 7 days
   - Result: only 7 days of data refreshed daily, not the entire dataset
```

---

# SECTION 4: EXCEL ADVANCED — For Security Data Analysis

## 4.1 XLOOKUP (Replaces VLOOKUP)

**Use case:** Match finding asset IDs to CMDB owners

```excel
// Syntax: =XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])

// Find the owner for an asset ID
=XLOOKUP(A2, CMDB!$A:$A, CMDB!$D:$D, "UNASSIGNED")

// A2 = asset ID in findings sheet
// CMDB!$A:$A = asset IDs in CMDB sheet
// CMDB!$D:$D = owner names in CMDB sheet
// "UNASSIGNED" = returned if no match found
```

**Why XLOOKUP > VLOOKUP:**
- Can look LEFT (VLOOKUP can only look right)
- Has a default "not found" value
- Exact match by default (VLOOKUP defaults to approximate)
- Can return multiple columns

## 4.2 INDEX-MATCH (Most Flexible Lookup)

```excel
// Syntax: =INDEX(return_range, MATCH(lookup_value, lookup_range, 0))

// Find team name for a given asset ID
=INDEX(CMDB!$E:$E, MATCH(A2, CMDB!$A:$A, 0))

// Multi-criteria match (find owner where BOTH asset_id AND cloud match)
=INDEX(CMDB!$D:$D, MATCH(A2&B2, CMDB!$A:$A&CMDB!$B:$B, 0))
// ↑ Enter with Ctrl+Shift+Enter (array formula)
```

## 4.3 PivotTables — Summarize Findings Instantly

```
HOW TO CREATE:
1. Select your findings data (including headers)
2. Insert → PivotTable → New Worksheet
3. Drag fields:
   ├── ROWS:    Severity
   ├── COLUMNS: Cloud_Provider (Azure, GCP)
   ├── VALUES:  Count of Finding_ID
   └── FILTERS: Status (set to "Open" only)

RESULT:
              | Azure | GCP  | Total
──────────────┼───────┼──────┼──────
CRITICAL      |   23  |  11  |   34
HIGH          |  147  |  89  |  236
MEDIUM        |  412  | 201  |  613
LOW           |  156  |  78  |  234
──────────────┼───────┼──────┼──────
Total         |  738  | 379  | 1117

COMMON PIVOTS FOR SECURITY:
├── Findings by Severity × Team → shows which teams have most debt
├── Findings by Age Bucket × Severity → shows SLA compliance
├── Closed findings by Month → shows remediation velocity
├── Findings by CIS Control → shows which controls fail most
└── Findings by Cloud Account × Type → shows hotspot accounts
```

## 4.4 Conditional Formatting — Visual SLA Tracking

```
USE CASE: Color-code findings by SLA status

HOW:
1. Select the SLA_Status column
2. Home → Conditional Formatting → Highlight Cell Rules

RULES:
├── Text = "Breached"  → Red fill, white text
├── Text = "At Risk"   → Yellow fill, black text
├── Text = "On Track"  → Green fill, white text
└── Text = "UNASSIGNED" → Gray fill, italic text

USE CASE 2: Heatmap for finding age
1. Select the Age_Days column
2. Conditional Formatting → Color Scales
3. Minimum (green) = 0, Maximum (red) = 90
```

## 4.5 Power Query in Excel (Same as Power BI!)

```
Data → Get Data → From File → From CSV
├── Same Power Query editor as Power BI
├── Same M-language transformations
├── Same merge queries capability
└── Output goes to Excel worksheet instead of Power BI model

WHY USE IT:
├── When you need a quick one-time analysis
├── When sharing with teams that don't have Power BI
├── When preparing data for audit (auditors prefer Excel)
└── When building ad-hoc reports before creating a full PBI dashboard
```

## 4.6 Key Excel Formulas for Security Analysis

```excel
// Count findings by severity
=COUNTIFS(Findings!$D:$D, "CRITICAL", Findings!$G:$G, "Open")

// Average age of open Critical findings
=AVERAGEIFS(Findings!$H:$H, Findings!$D:$D, "CRITICAL", Findings!$G:$G, "Open")

// SLA compliance rate
=COUNTIFS(Findings!$I:$I, "On Track") / COUNTA(Findings!$I:$I) * 100

// Days until SLA breach
=IF(H2="CRITICAL", 1-A2, IF(H2="HIGH", 7-A2, IF(H2="MEDIUM", 30-A2, 90-A2)))

// Dynamic severity label with emoji (for formatted reports)
=IF(D2="CRITICAL", "🔴 CRITICAL", IF(D2="HIGH", "🟠 HIGH", IF(D2="MEDIUM", "🟡 MEDIUM", "🟢 LOW")))
```

---

# SECTION 5: SAMPLE SECURITY DASHBOARD LAYOUT

```
┌──────────────────────────────────────────────────────────────────────┐
│              CLOUD SECURITY FINDINGS MANAGEMENT DASHBOARD            │
│                                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────────┐│
│  │  TOTAL  │  │CRITICAL│  │  HIGH  │  │  SLA   │  │   MTTR (Days)  ││
│  │  1,247  │  │   34   │  │  236   │  │ 89.2%  │  │   Crit: 2.1    ││
│  │  Open   │  │  🔴    │  │  🟠   │  │Comply  │  │   High: 5.4    ││
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │ FINDINGS TREND (Line Chart)     │ │ BY SEVERITY (Donut Chart)    ││
│  │                                 │ │                              ││
│  │ Open ───────╲                   │ │     ┌──┐                     ││
│  │              ╲___               │ │   ┌─┤CR├─┐   CRITICAL: 3%   ││
│  │ Closed ──────╱   ╲__            │ │   │ └──┘ │   HIGH: 21%      ││
│  │             ╱        ╲          │ │   │      │   MEDIUM: 55%    ││
│  │ Jan  Feb  Mar  Apr  May         │ │   └──────┘   LOW: 21%       ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────┐ ┌──────────────────────────────┐│
│  │ SLA COMPLIANCE BY TEAM (Bar)    │ │ TOP 10 OVERDUE FINDINGS      ││
│  │                                 │ │ (Table)                      ││
│  │ Platform ████████████ 96%       │ │                              ││
│  │ AppDev   ████████░░░░ 78%       │ │ ID | Severity | Age | Team  ││
│  │ DataEng  ██████░░░░░░ 65%       │ │ ---|----------|-----|-----  ││
│  │ Network  ████████████ 94%       │ │ 47 | CRITICAL | 12d | Data ││
│  │ Identity ██████████░░ 88%       │ │ 23 | HIGH     | 34d | App  ││
│  └─────────────────────────────────┘ └──────────────────────────────┘│
│                                                                      │
│  [Slicer: Cloud Provider]  [Slicer: Date Range]  [Slicer: Team]    │
└──────────────────────────────────────────────────────────────────────┘
```

---

> **Interview Tip:** "I build Power BI dashboards that answer three questions: **What's our current risk posture?** (finding counts by severity), **Are we improving?** (MTTR trends, SLA compliance), and **Who needs help?** (team-level breakdown with SLA status). The dashboard drives our weekly remediation meetings — every team sees their own findings and SLA status."

---

*Continue to Part 2 → ServiceNow, SQL, Splunk SPL*
*Continue to Part 3 → Azure & GCP Deep Dive, Wiz Platform*
