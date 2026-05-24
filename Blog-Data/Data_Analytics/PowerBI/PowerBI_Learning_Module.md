# 📊 POWER BI LEARNING MODULE — Build, Maintain & Master Dashboards

> **JD Task:** Build and maintain Power BI dashboards and reports, including dataset
> connections, DAX development, Power Query (M-language) transformations for security
> and inventory data.
>
> **What You'll Learn:** Every concept explained → What it is → How it works in real-time
> → Hands-on example using security data.

---

# PART 1: WHAT IS POWER BI & HOW WELLS FARGO USES IT

## 1.1 What Power BI Actually Is

Power BI is a **business intelligence tool** that connects to data sources, transforms raw data into a clean model, and visualizes it as interactive dashboards. Think of it as:

```
Raw Data (messy CSVs, APIs, databases)
          ↓
  Power Query (clean & shape)        ← ETL layer
          ↓
  Data Model (relationships)         ← structure layer
          ↓
  DAX Measures (calculations)        ← intelligence layer
          ↓
  Visuals (charts, tables, KPIs)     ← presentation layer
          ↓
  Published Dashboard (shared)       ← consumption layer
```

## 1.2 Real-Time at Wells Fargo FM Team

```
YOUR DAILY POWER BI WORKFLOW:

MORNING (9 AM):
├── Open Power BI Service (browser) → check overnight refresh status
├── Review "Findings Management Dashboard" for new Critical findings
├── Export SLA breach list → email to team leads
└── Check data quality — are new findings flowing in?

WEEKLY (Monday):
├── Run SLA compliance report → share in weekly office hours meeting
├── Update team scorecard → send to VPs
├── Check month-over-month trend — improving or declining?
└── Identify top 5 teams with worst SLA

MONTHLY:
├── Build exec summary report for CISO
├── Refresh compliance dashboards for audit readiness
├── Add/update DAX measures for new KPIs leadership requested
└── Tune Power Query if Wiz export format changed

QUARTERLY (Audit Prep):
├── Export audit evidence from dashboard → PDF
├── Run compliance score trends for auditors
├── Validate data completeness (all accounts scanned?)
└── Present findings lifecycle metrics to governance team
```

---

# PART 2: DATASET CONNECTIONS — Connecting to Data Sources

## 2.1 What Are Dataset Connections?

A **dataset connection** is how Power BI reads your data. Wells Fargo FM team connects to:

| Source | What It Contains | Connection Type |
|--------|-----------------|----------------|
| **Wiz API** | Security findings, compliance results | Web/REST API |
| **SQL Database** | Historical findings, enriched with CMDB data | SQL Server |
| **CSV Exports** | Weekly Wiz exports, audit lists | File |
| **ServiceNow** | Tickets, SLA data, CMDB assets | REST API or ODBC |
| **SharePoint** | Team tracking sheets, exception lists | SharePoint Online |
| **Azure Resource Graph** | Live cloud resource inventory | Azure connector |

## 2.2 Connection Types Explained

### Import Mode (Most Common)

```
WHAT: Data is copied INTO Power BI's in-memory engine
WHEN USED: Daily/weekly refresh is sufficient
HOW: Scheduled to refresh 1-8 times per day

Example:
├── Connect to Wiz API → import all findings
├── Data stored in Power BI dataset (~200MB compressed)
├── Schedule refresh: 6 AM and 12 PM daily
├── Queries run against local copy → FAST (sub-second)
└── Dashboard always shows data as of last refresh

REAL-TIME USE:
"Every morning at 6 AM, our dataset refreshes from the Wiz API.
When I open the dashboard at 9 AM, I see all findings detected
overnight. If something urgent comes in at 2 PM, I click
'Refresh now' for an ad-hoc update."
```

### DirectQuery Mode (Less Common)

```
WHAT: Power BI queries the source database LIVE (no local copy)
WHEN USED: When you need real-time data and can accept slower queries
HOW: Every visual interaction sends a query to the source

Example:
├── Connect to SQL database with DirectQuery
├── No data stored in Power BI
├── Every filter click → SQL query sent to database
├── Results in 2-10 seconds (depends on DB performance)
└── Always shows latest data

REAL-TIME USE:
"We use DirectQuery for our operational dashboard that the SOC
monitors. They need to see findings the moment they're ingested
into our SQL database — can't wait for scheduled refresh."
```

### Composite Model (Advanced)

```
WHAT: Mix of Import + DirectQuery in one dataset
WHEN USED: Some tables need real-time, others don't
HOW: Mark each table as Import or DirectQuery

Example:
├── Findings table → DirectQuery (need latest)
├── CMDB table → Import (changes rarely, refresh daily)
├── Date table → Import (static)
└── Best of both: fast dimension lookups + real-time fact data
```

## 2.3 Connecting to Each Source — Step by Step

### Connect to CSV File

```
1. Home → Get Data → Text/CSV
2. Browse → select your file → Open
3. Preview window → check data types look correct
4. Click "Transform Data" to open Power Query (recommended)
   OR "Load" to import directly

REAL-TIME TIP: Use "From Folder" instead of single file.
Point to a folder where you drop weekly exports.
Power Query auto-combines all files on refresh.
```

### Connect to SQL Database

```
1. Home → Get Data → SQL Server
2. Enter:
   Server: your-sql-server.database.windows.net
   Database: SecurityFindings
3. Authentication: Microsoft Account or Windows
4. Navigator → check tables you want:
   ☑ dbo.wiz_findings
   ☑ dbo.cmdb_assets
   ☑ dbo.servicenow_tickets
5. Click "Transform Data"

REAL-TIME TIP:
Write SQL directly in the "Advanced options" box:
┌────────────────────────────────────────────┐
│ SELECT f.*, c.owner, c.assignment_group    │
│ FROM wiz_findings f                         │
│ LEFT JOIN cmdb_assets c                     │
│   ON f.resource_id = c.cloud_resource_id   │
│ WHERE f.created_date >= DATEADD(month,-6,  │
│   GETDATE())                                │
└────────────────────────────────────────────┘
This pushes the JOIN to the database (faster than doing it in PBI).
```

### Connect to REST API (Wiz API)

```
1. Home → Get Data → Web
2. URL: https://api.wiz.io/v2/issues?severity=CRITICAL&status=Open
3. Click "Advanced" → add Header:
   Name: Authorization
   Value: Bearer YOUR_TOKEN_HERE
4. Click OK → Power Query parses JSON response
5. Convert JSON to table (click "To Table" or expand records)

REAL-TIME TIP:
Use a Parameter for the API token:
├── Manage Parameters → New → Name: "WizToken"
├── In query: [Headers = [Authorization = "Bearer " & WizToken]]
├── When token rotates, update the parameter — no query rewrite
```

### Connect to SharePoint List

```
1. Home → Get Data → SharePoint Online List
2. Enter SharePoint site URL
3. Select list → Transform Data
4. Useful for: exception tracking, team assignments, audit logs
```

---

# PART 3: POWER QUERY (M-LANGUAGE) — The ETL Engine

## 3.1 What Is Power Query?

Power Query is the **data preparation layer** — it connects, cleans, merges, and shapes data BEFORE it reaches your data model. Every transformation is recorded as a "step" and replays automatically on refresh.

```
POWER QUERY WORKFLOW:

Source Data (messy)
     │
     ↓  ① Connect (Get Data)
     │
     ↓  ② Remove unnecessary columns
     │
     ↓  ③ Fix data types (text → date, text → number)
     │
     ↓  ④ Filter rows (remove test data, old records)
     │
     ↓  ⑤ Add calculated columns (Age, SLA Status, Risk Score)
     │
     ↓  ⑥ Merge with other tables (CMDB lookup for owners)
     │
     ↓  ⑦ Group/aggregate if needed
     │
     ↓  Close & Apply → Clean data loads into model
```

## 3.2 The Power Query Editor — Your Workspace

```
┌──────────────────────────────────────────────────────────────────┐
│ POWER QUERY EDITOR                                               │
│                                                                   │
│ ┌────────────────┐  ┌────────────────────────────┐ ┌───────────┐│
│ │ QUERIES PANEL  │  │ DATA PREVIEW               │ │ APPLIED   ││
│ │                │  │                            │ │ STEPS     ││
│ │ wiz_findings   │  │ ID | Title | Sev  | Cloud | │           ││
│ │ cmdb_assets    │  │ 01 | NSG.. | CRIT | Azure | │ Source    ││
│ │ snow_tickets   │  │ 02 | S3 .. | HIGH | GCP   | │ Changed   ││
│ │ merged_data    │  │ 03 | Key.. | MED  | Azure | │  Type     ││
│ │                │  │ 04 | IAM.. | CRIT | GCP   | │ Removed   ││
│ │                │  │                            │ │  Cols     ││
│ │                │  │                            │ │ Added     ││
│ │                │  │                            │ │  Custom   ││
│ │                │  │                            │ │ Merged    ││
│ └────────────────┘  └────────────────────────────┘ └───────────┘│
│                                                                   │
│ [Formula Bar]:  = Table.AddColumn(#"Changed Type", "Age", ...)   │
└──────────────────────────────────────────────────────────────────┘

APPLIED STEPS = Your transformation recipe
├── Each step is ONE operation (rename, filter, merge, etc.)
├── Steps execute TOP to BOTTOM on every refresh
├── Click any step to see data at that point
├── Right-click to delete/rename/insert steps
├── The FORMULA BAR shows the M-language code for each step
```

## 3.3 M-Language — The Code Behind Power Query

Every click in the Power Query UI generates M-language code. You can also write M directly for complex transformations.

### M-Language Structure

```m
// Every Power Query query is a "let...in" expression:

let
    // Step 1: Connect to source
    Source = Csv.Document(File.Contents("C:\data\findings.csv")),

    // Step 2: Promote headers (first row becomes column names)
    Headers = Table.PromoteHeaders(Source),

    // Step 3: Change data types
    ChangedTypes = Table.TransformColumnTypes(Headers, {
        {"created_date", type date},
        {"sla_hours", Int64.Type},
        {"severity", type text}
    }),

    // Step 4: Filter to open findings only
    FilteredOpen = Table.SelectRows(ChangedTypes,
        each [status] = "Open"),

    // Step 5: Add calculated column
    AddedAge = Table.AddColumn(FilteredOpen, "Age_Days",
        each Duration.Days(DateTime.LocalNow() - [created_date]),
        Int64.Type)
in
    // Return the final step
    AddedAge
```

### Real-Time M-Language Examples

#### Example 1: Add SLA Status Column

```m
// Click: Add Column → Custom Column → paste this formula:

let
    age = Duration.Days(DateTime.LocalNow() - [created_date]),
    sla = if [severity] = "CRITICAL" then 1
          else if [severity] = "HIGH" then 7
          else if [severity] = "MEDIUM" then 30
          else 90,
    pct = age / sla * 100
in
    if [status] = "Closed" then "Resolved"
    else if pct >= 100 then "Breached"
    else if pct >= 75 then "At Risk"
    else "On Track"
```

**Real-Time Use:** "I calculate SLA status in Power Query rather than DAX because it's computed once during refresh, not on every visual interaction. This makes the dashboard faster."

#### Example 2: Merge Findings with CMDB (JOIN)

```m
// Home → Merge Queries → Select tables and key columns
// M-language generated:

let
    Source = findings_table,
    MergedCMDB = Table.NestedJoin(
        Source,                          // left table
        {"resource_id"},                 // left key
        cmdb_assets,                     // right table
        {"cloud_resource_id"},           // right key
        "CMDB",                          // new column name
        JoinKind.LeftOuter               // keep all findings
    ),
    ExpandedCMDB = Table.ExpandTableColumn(
        MergedCMDB,
        "CMDB",
        {"owner", "assignment_group", "environment", "manager"}
    )
in
    ExpandedCMDB
```

**Real-Time Use:** "Every finding now has owner and team info from CMDB. When a finding has no CMDB match, the owner fields are null — I filter these as 'orphaned assets' and report them to asset management."

#### Example 3: Parse JSON from Wiz API

```m
let
    // Connect to Wiz API
    apiUrl = "https://api.wiz.io/v2/issues",
    token = "Bearer " & WizApiToken,
    response = Web.Contents(apiUrl, [
        Headers = [
            #"Authorization" = token,
            #"Content-Type" = "application/json"
        ],
        Query = [
            severity = "CRITICAL,HIGH",
            status = "Open",
            limit = "500"
        ]
    ]),

    // Parse JSON
    json = Json.Document(response),
    data = json[data],

    // Convert list of records to table
    toTable = Table.FromList(data, Splitter.SplitByNothing()),

    // Expand nested record fields
    expanded = Table.ExpandRecordColumn(toTable, "Column1", {
        "id", "title", "severity", "status",
        "resource", "createdAt", "remediation"
    }),

    // Expand nested resource object
    expandedResource = Table.ExpandRecordColumn(expanded, "resource", {
        "id", "type", "name", "cloudPlatform", "subscriptionId"
    }, {"resource_id", "resource_type", "resource_name", "cloud", "account"})
in
    expandedResource
```

**Real-Time Use:** "Instead of exporting CSVs from Wiz, I connect directly to the API. On scheduled refresh, Power Query pulls the latest findings, parses the JSON, flattens nested objects, and my dashboard auto-updates."

#### Example 4: Data from Folder (Auto-Combine Weekly CSVs)

```m
let
    // Connect to folder
    Source = Folder.Files("\\server\share\wiz_exports\"),

    // Filter to only CSV files
    Filtered = Table.SelectRows(Source,
        each Text.EndsWith([Name], ".csv")),

    // Parse each CSV
    AddContent = Table.AddColumn(Filtered, "ParsedCSV",
        each Csv.Document([Content], [Delimiter=",", Encoding=65001])),

    // Combine all into one table
    Combined = Table.Combine(AddContent[ParsedCSV]),

    // Promote first row of each CSV as headers
    Headers = Table.PromoteHeaders(Combined),

    // Remove duplicate rows (same finding in multiple exports)
    Deduped = Table.Distinct(Headers, {"finding_id"})
in
    Deduped
```

**Real-Time Use:** "We get a Wiz export every Monday. I drop the CSV into a network folder. Power BI auto-detects the new file, combines it with historical data, deduplicates by finding_id, and the dashboard shows the complete picture."

#### Example 5: Parameterized Query for Date Range

```m
let
    // Parameters (created via Manage Parameters)
    startDate = #date(2025, 1, 1),
    endDate = Date.From(DateTime.LocalNow()),

    // Connect and filter at source (pushes filter to database)
    Source = Sql.Database("server.database.windows.net", "SecurityDB", [
        Query = "SELECT * FROM wiz_findings WHERE created_date >= '"
                & Date.ToText(startDate, "yyyy-MM-dd") & "'"
                & " AND created_date <= '"
                & Date.ToText(endDate, "yyyy-MM-dd") & "'"
    ])
in
    Source
```

**Real-Time Use:** "For incremental refresh, I use date parameters so only recent data is pulled — this reduced refresh time from 20 minutes to 2 minutes."

## 3.4 Common Power Query Patterns — Quick Reference

| What You Want | UI Action | M-Language |
|--------------|-----------|-----------|
| Remove columns | Right-click column → Remove | `Table.RemoveColumns(t, {"col"})` |
| Rename column | Double-click header | `Table.RenameColumns(t, {{"old","new"}})` |
| Filter rows | Click dropdown → filter | `Table.SelectRows(t, each [col] = "value")` |
| Change type | Click type icon on header | `Table.TransformColumnTypes(t, {{"col", type date}})` |
| Add custom column | Add Column → Custom | `Table.AddColumn(t, "name", each [col1]+[col2])` |
| Replace values | Right-click → Replace | `Table.ReplaceValue(t, "old", "new", Replacer.ReplaceText, {"col"})` |
| Merge (JOIN) | Home → Merge Queries | `Table.NestedJoin(t1, "key", t2, "key", "name", JoinKind.LeftOuter)` |
| Append (UNION) | Home → Append Queries | `Table.Combine({t1, t2})` |
| Group by | Transform → Group By | `Table.Group(t, {"col"}, {{"Count", each Table.RowCount(_)}})` |
| Pivot column | Transform → Pivot | `Table.Pivot(t, values, "attr", "val")` |
| Unpivot | Transform → Unpivot | `Table.UnpivotOtherColumns(t, {"keep"}, "attr", "val")` |
| Sort | Right-click → Sort | `Table.Sort(t, {{"col", Order.Ascending}})` |
| Deduplicate | Home → Remove Rows → Duplicates | `Table.Distinct(t, {"key_col"})` |
| Handle errors | Right-click → Replace Errors | `Table.ReplaceErrorValues(t, {{"col", null}})` |
| Conditional column | Add Column → Conditional | `Table.AddColumn(t, "name", each if [col]>0 then "Yes" else "No")` |

---

# PART 4: DAX DEVELOPMENT — Dynamic Calculations

## 4.1 What Is DAX and When to Use It

DAX (Data Analysis Expressions) creates **dynamic calculations** that react to user interactions (clicks on slicers, filters, drill-downs). Unlike Power Query (runs once on refresh), DAX runs EVERY TIME a visual renders.

```
POWER QUERY vs DAX — WHEN TO USE WHICH:

Use POWER QUERY when:                    Use DAX when:
├── Cleaning data (remove nulls)          ├── Calculating KPIs (SLA %, MTTR)
├── Changing data types                   ├── Creating measures that react to filters
├── Merging/joining tables                ├── Time intelligence (MoM, YTD)
├── Static calculations (age at refresh)  ├── Comparisons (actual vs target)
├── Deduplication                         ├── Conditional aggregation
└── Data from external sources            └── Ranking and percentiles

RULE OF THUMB:
"If the value should be the SAME regardless of what the user
clicks → Power Query.
If the value should CHANGE when the user clicks a slicer → DAX."
```

## 4.2 DAX Measure Library for Findings Management

### Tier 1: Basic Measures (Always Needed)

```dax
// ===== COUNTS =====

Total Findings = COUNTROWS(wiz_findings)

Open Findings =
CALCULATE(COUNTROWS(wiz_findings), wiz_findings[status] = "Open")

Closed Findings =
CALCULATE(COUNTROWS(wiz_findings), wiz_findings[status] = "Closed")

// These react to ANY slicer on the page.
// If user clicks "Azure" slicer → shows only Azure findings
// If user clicks "CRITICAL" slicer → shows only Critical findings
// CALCULATE modifies the filter context.


// ===== BY SEVERITY (for KPI cards) =====

Critical Open =
CALCULATE([Open Findings], wiz_findings[severity] = "CRITICAL")

High Open =
CALCULATE([Open Findings], wiz_findings[severity] = "HIGH")


// ===== BY CLOUD =====

Azure Open =
CALCULATE([Open Findings], wiz_findings[cloud_provider] = "Azure")

GCP Open =
CALCULATE([Open Findings], wiz_findings[cloud_provider] = "GCP")
```

**Real-Time Use:** "These cards sit at the top of every dashboard page. When a VP filters to their team, the cards instantly update to show only their team's numbers."

### Tier 2: SLA & Performance Measures

```dax
// ===== SLA COMPLIANCE =====

SLA Compliance % =
VAR _total = [Open Findings]
VAR _compliant =
    CALCULATE([Open Findings], wiz_findings[SLA_Status] = "On Track")
RETURN
    DIVIDE(_compliant, _total, 0) * 100

// REAL-TIME USE: "This is THE number leadership looks at. If it drops
// below 85%, I drill into which teams are causing the dip."


// ===== SLA BY STATE =====

SLA Breached =
CALCULATE([Open Findings], wiz_findings[SLA_Status] = "Breached")

SLA At Risk =
CALCULATE([Open Findings], wiz_findings[SLA_Status] = "At Risk")


// ===== MTTR (Mean Time to Remediate) =====

MTTR Overall =
AVERAGEX(
    FILTER(wiz_findings, wiz_findings[status] = "Closed"),
    wiz_findings[Age_Days]
)
// Averages the Age_Days for all closed findings.
// Reacts to slicers: filter to CRITICAL → shows MTTR for Critical only.

// REAL-TIME USE: "I use this in a line chart by month — if MTTR is
// trending up, we need more resources or better tooling."


// ===== REMEDIATION RATE =====

Remediation Rate % =
DIVIDE([Closed Findings], [Total Findings], 0) * 100

// Shows what percentage of all findings have been remediated.
```

### Tier 3: Time Intelligence (Trends)

```dax
// ===== MONTH-OVER-MONTH CHANGE =====

New Findings This Month =
CALCULATE(
    COUNTROWS(wiz_findings),
    DATESMTD(DIM_Date[Date])
)

New Findings Last Month =
CALCULATE(
    COUNTROWS(wiz_findings),
    DATEADD(DIM_Date[Date], -1, MONTH)
)

MoM Change % =
VAR _current = [New Findings This Month]
VAR _previous = [New Findings Last Month]
RETURN DIVIDE(_current - _previous, _previous, 0) * 100

// REAL-TIME USE: "In my weekly report, I show MoM change. If findings
// increased 15% this month, I investigate: new cloud accounts onboarded?
// new Wiz rules enabled? or actual posture degradation?"


// ===== YEAR-TO-DATE =====

Findings Closed YTD =
CALCULATE(
    [Closed Findings],
    DATESYTD(DIM_Date[Date])
)

// REAL-TIME USE: "In Q4, leadership asks 'how many findings did we
// close this year?' This measure answers it dynamically."


// ===== RUNNING TOTAL =====

Running Total Open =
CALCULATE(
    [Open Findings],
    FILTER(
        ALL(DIM_Date),
        DIM_Date[Date] <= MAX(DIM_Date[Date])
    )
)

// Shows cumulative open findings over time — use with area chart
```

### Tier 4: Advanced Patterns

```dax
// ===== FINDING AGE DISTRIBUTION =====

Age 0-7 Days = CALCULATE([Open Findings], wiz_findings[Age_Days] <= 7)
Age 8-30 Days = CALCULATE([Open Findings], wiz_findings[Age_Days] > 7, wiz_findings[Age_Days] <= 30)
Age 31-60 Days = CALCULATE([Open Findings], wiz_findings[Age_Days] > 30, wiz_findings[Age_Days] <= 60)
Age 60+ Days = CALCULATE([Open Findings], wiz_findings[Age_Days] > 60)

// REAL-TIME USE: "Stacked bar chart shows age distribution. If the
// '60+ days' bucket is growing, we have a backlog problem."


// ===== TOP N TEAMS BY FINDINGS =====

Team Rank =
RANKX(
    ALL(cmdb_assets[assignment_group]),
    [Open Findings],
    ,
    DESC,
    Dense
)

// Use with a Table visual — shows rank 1, 2, 3... by finding count
// REAL-TIME USE: "In weekly meeting, I show the top 5 teams with most
// open findings. It creates healthy competition."


// ===== COVERAGE METRIC =====

Scanned Accounts =
DISTINCTCOUNT(wiz_findings[cloud_account])

Total Accounts = 42  // Or from a separate accounts table

Coverage % =
DIVIDE([Scanned Accounts], [Total Accounts], 0) * 100

// REAL-TIME USE: "If coverage drops below 100%, a new cloud account
// was created but not connected to Wiz. I flag it for onboarding."


// ===== INTERNET-FACING RISK =====

Internet Facing Critical =
CALCULATE(
    [Open Findings],
    wiz_findings[severity] = "CRITICAL",
    wiz_findings[internet_facing] = "Yes"
)

// REAL-TIME USE: "This is our highest-risk metric. Zero is the target.
// Any value > 0 triggers immediate escalation."
```

---

# PART 5: DASHBOARD MAINTENANCE — Real-Time Operations

## 5.1 Scheduled Refresh Setup

```
IN POWER BI SERVICE (app.powerbi.com):

1. Publish report from Desktop → My Workspace
2. Go to Dataset Settings:
   ├── Data source credentials → enter API keys / DB password
   ├── Scheduled refresh → ON
   ├── Refresh frequency: Daily
   ├── Time: 6:00 AM, 12:00 PM (2x per day)
   └── Send refresh failure notification to: your email

REAL-TIME USE: "I set 6 AM refresh so the dashboard has fresh data
when the team starts at 9 AM. The noon refresh catches any
findings detected during the morning."

TROUBLESHOOTING REFRESH FAILURES:
├── API token expired → update in Data source credentials
├── CSV file moved → update file path in Power Query
├── Database timeout → optimize SQL query or increase timeout
├── Exceeded dataset size limit → add filters in Power Query
└── Schema change (new column in Wiz) → update Power Query
```

## 5.2 Row-Level Security (RLS)

```
WHAT: Each team only sees THEIR OWN findings in the dashboard.

HOW TO SET UP:
1. In Power BI Desktop:
   ├── Modeling → Manage Roles → New → Name: "TeamFilter"
   ├── Add table filter on cmdb_assets:
   │   [assignment_group] = USERPRINCIPALNAME()
   └── Save

2. In Power BI Service:
   ├── Dataset → Security → TeamFilter role
   ├── Add members: AD groups for each team
   └── Platform-Engineering team → sees only their findings

REAL-TIME USE: "Platform Engineering's VP opens the dashboard and
sees 5 Critical findings — those are THEIR findings. They don't see
AppDev's findings. This creates ownership and accountability."
```

## 5.3 Alerts & Subscriptions

```
ALERTS (triggered by data):
├── Click on a KPI card (e.g., Internet Facing Critical)
├── ⋯ → Manage Alerts → New
├── Condition: Above → Threshold: 0
├── Check frequency: Hourly
├── When triggered: email notification
├── REAL-TIME USE: "If ANY internet-facing Critical finding appears,
│   I get an instant email. I don't need to watch the dashboard."

SUBSCRIPTIONS (scheduled delivery):
├── Open report in Service → Subscribe
├── Frequency: Daily at 8 AM
├── Deliver: email with snapshot of dashboard page
├── REAL-TIME USE: "Every Monday morning, VPs get an email with
│   their team's SLA snapshot — no need to log into Power BI."
```

## 5.4 Version Control & Change Management

```
BEST PRACTICE:

1. VERSION FILES:
   ├── WF_Dashboard_v1.0.pbix → original
   ├── WF_Dashboard_v1.1.pbix → added new KPI
   ├── WF_Dashboard_v2.0.pbix → major redesign
   └── Keep changelog in README or the file name

2. DEV → PROD PROMOTION:
   ├── Dev Workspace: test new measures and visuals
   ├── Prod Workspace: what users see
   ├── Test in Dev → validate data → copy to Prod
   └── Use Power BI Deployment Pipelines (premium feature)

3. DAX DOCUMENTATION:
   ├── For each measure, add a Description:
   │   Right-click measure → Properties → Description
   │   "SLA Compliance %: Percentage of open findings within
   │    SLA target. Calculated as On Track / Total Open * 100.
   │    Target: >85%. Refreshes daily."
   └── Future you (or your replacement) will thank you
```

---

# PART 6: HANDS-ON EXERCISE — Build Everything End to End

```
TIME: 2-3 hours
PREREQUISITE: Install Power BI Desktop, have the 3 CSV files from PowerBI_Project/data/

EXERCISE MAP:

Step 1 (15 min): Load 3 CSVs via Power Query
Step 2 (20 min): Apply Power Query transformations (all M-language examples above)
Step 3 (10 min): Build data model with relationships
Step 4 (30 min): Create all DAX measures from Tier 1-4
Step 5 (45 min): Build 3-page dashboard (follow PROJECT_GUIDE.md)
Step 6 (15 min): Add slicers, drill-through, conditional formatting
Step 7 (10 min): Save, export PDF, tell yourself the interview story

INTERVIEW STORY:
"I built a 3-page findings management dashboard in Power BI that
connects to Wiz API data, merges it with CMDB in Power Query for
ownership mapping, and calculates SLA compliance, MTTR, and risk
distribution using DAX measures. The dashboard refreshes twice
daily and uses Row-Level Security so each team only sees their
findings. It powers our weekly office hours and monthly exec reports."
```

---

> **Key Takeaway:** Power BI isn't just "making charts." It's an end-to-end data pipeline — connect → transform → model → calculate → visualize → share → maintain. Every step has a real-time purpose in the Findings Management workflow.
