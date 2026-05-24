# 🎯 WELLS FARGO INTERVIEW — Power BI, SQL & Advanced Excel Mastery

> **Missing Topics Re-Check + 30 Interview Q&As + Advanced Excel Optimization**

---

# ⚠️ MISSING TOPICS RE-CHECK — What's Still Not Covered

After reviewing the JD against all materials, here are items that need attention:

```
TOPIC                                STATUS     ACTION
────────────────────────────────────────────────────────────────
1. Bulk data operations              ❌ NEW     Learn below (Excel + SQL)
   (deduplication, correlation,
   bulk updates from CSV/API)

2. Power Query M-language            ⚠️ Basic   Advanced patterns below
   (incremental refresh, error
   handling, parameterized queries)

3. Data modeling in Power BI         ⚠️ Basic   Star schema, relationships,
   (star schema, RLS)                           role-level security below

4. DAX time intelligence             ⚠️ Basic   YTD/QTD/MTD, period
   (advanced patterns)                          comparison below

5. JSON processing from APIs         ⚠️ Partial Python + Power Query JSON
   (Wiz API, REST endpoints)                    parsing below

6. Deduplication logic               ❌ NEW     Critical for FM role — below

7. Exception management              ✅ Covered  Risk acceptance in Part2
   (risk-acceptance workflows)

8. Onboarding documentation          ❌ NEW     SOP writing tips below
   (SOPs, KB articles)

9. Cross-team collaboration          ✅ Covered  Stakeholder mgmt in EY guide
   patterns

10. Audit preparation workflow       ❌ NEW     How to prepare for audits
```

---

# PART A: POWER BI INTERVIEW Q&A — 15 Questions

---

### Q1: "What is the difference between a Measure and a Calculated Column in Power BI?"

> **Answer:**
> A **Calculated Column** is computed row-by-row when data loads. It becomes a physical column stored in memory. Example: adding an `Age_Days` column to the findings table.
>
> A **Measure** is computed dynamically at query time based on filter context — it reacts to slicers and filters. Example: `SLA_Compliance_Rate` that changes when you filter by team or severity.
>
> **Rule:** Use Measures for aggregations and KPIs (they're dynamic). Use Calculated Columns only when you need row-level values for slicing/filtering and the value doesn't change with context.

```dax
-- Calculated Column (static, row-by-row)
Age_Days = DATEDIFF(Findings[Created_Date], TODAY(), DAY)

-- Measure (dynamic, reacts to filters)
Avg_Age = AVERAGE(Findings[Age_Days])
-- ↑ This changes when you filter by team, severity, etc.
```

---

### Q2: "Explain filter context and row context in DAX."

> **Answer:**
> **Row context** exists when DAX iterates row by row — inside Calculated Columns and iterator functions like `SUMX`, `AVERAGEX`. Each row has its own context.
>
> **Filter context** is the set of active filters from slicers, visuals, page filters, and `CALCULATE`. It determines WHICH rows are included in an aggregation.
>
> `CALCULATE` is the bridge — it modifies filter context. That's why it's the most important DAX function.

```dax
-- Filter context example:
-- If the user clicks "CRITICAL" in a severity slicer,
-- this measure automatically filters to only Critical findings:
Total_Open = COUNTROWS(FILTER(Findings, Findings[Status] = "Open"))
-- ↑ The slicer adds "Severity = CRITICAL" to the filter context

-- CALCULATE explicitly modifies filter context:
Critical_Regardless_Of_Slicer =
CALCULATE(
    COUNTROWS(Findings),
    Findings[Severity] = "CRITICAL",
    ALL(Findings[Severity])  -- ← removes the slicer filter
)
```

---

### Q3: "How do you handle incremental refresh in Power BI for large security datasets?"

> **Answer:**
> With millions of historical findings, full refresh is too slow and expensive. I use incremental refresh:
> 1. Create `RangeStart` and `RangeEnd` parameters (DateTime type)
> 2. Filter the source query: `Created_Date >= RangeStart AND Created_Date < RangeEnd`
> 3. In Power BI Service: set policy to store 2 years of data, refresh last 7 days
> 4. Only new/changed data is refreshed daily — 95% faster

---

### Q4: "How do you implement Row-Level Security (RLS) so each team only sees their own findings?"

> **Answer:**
> RLS lets me restrict data visibility by user role:
> 1. In Power BI Desktop → Modeling → Manage Roles
> 2. Create a role for each team: `AppDev_Team`
> 3. Add DAX filter: `Findings[Assignment_Group] = "AppDev"`
> 4. In Power BI Service → assign AD groups to each role
>
> Result: The AppDev team only sees their own findings in every visual. The security team sees everything.

```dax
-- RLS role filter example:
[Assignment_Group] = USERPRINCIPALNAME()
-- ↑ Each user only sees findings assigned to them

-- OR map via a security table:
FILTER(UserAccess, UserAccess[Email] = USERPRINCIPALNAME())
```

---

### Q5: "How do you build a star schema for security findings data?"

> **Answer:**

```
STAR SCHEMA FOR FINDINGS MANAGEMENT:

                    ┌─────────────┐
                    │ DIM_Date    │
                    │ • Date      │
                    │ • Month     │
                    │ • Quarter   │
                    │ • Year      │
                    │ • WeekNum   │
                    └──────┬──────┘
                           │
┌─────────────┐    ┌───────▼────────┐    ┌─────────────┐
│ DIM_Team    │    │  FACT_Findings  │    │ DIM_Cloud   │
│ • TeamID    │◄───│  • FindingID   │───►│ • CloudID   │
│ • TeamName  │    │  • Severity    │    │ • Provider  │
│ • Manager   │    │  • DateKey     │    │ • Account   │
│ • VP        │    │  • TeamKey     │    │ • Region    │
└─────────────┘    │  • CloudKey    │    └─────────────┘
                   │  • StatusKey   │
┌─────────────┐    │  • Age_Days   │    ┌─────────────┐
│ DIM_Severity│    │  • MTTR_Days  │    │ DIM_Status  │
│ • SevID     │◄───│  • RiskScore  │───►│ • StatusID  │
│ • SevName   │    │  • SLA_Status │    │ • StatusName│
│ • SLA_Hours │    │               │    │ • IsOpen    │
│ • Color     │    └───────────────┘    └─────────────┘
└─────────────┘

WHY: Smaller dimension tables linked to one large fact table
     → faster queries, simpler DAX, cleaner relationships
```

---

### Q6: "Write DAX to show Month-over-Month change in open findings."

```dax
Open_Findings_MoM_Change =
VAR _current_month = [Total_Open_Findings]
VAR _previous_month =
    CALCULATE(
        [Total_Open_Findings],
        DATEADD(DIM_Date[Date], -1, MONTH)
    )
RETURN
    DIVIDE(_current_month - _previous_month, _previous_month, 0) * 100

-- Display: "+12.3%" or "-5.7%"
-- Use with conditional formatting: green if negative (improving)
```

---

### Q7: "How do you connect Power BI to a REST API like the Wiz API?"

> **Answer:**
> 1. Get Data → Web → Advanced
> 2. Enter API URL with auth header: `Authorization: Bearer <token>`
> 3. Power Query parses the JSON response into a table
> 4. Apply transformations → expand nested records → load

```m
// Power Query M-language for API connection:
let
    url = "https://api.wiz.io/v1/issues?severity=CRITICAL&status=Open",
    headers = [
        #"Authorization" = "Bearer " & Token,
        #"Content-Type" = "application/json"
    ],
    response = Web.Contents(url, [Headers = headers]),
    json = Json.Document(response),
    issues = json[data],
    toTable = Table.FromList(issues, Splitter.SplitByNothing()),
    expanded = Table.ExpandRecordColumn(toTable, "Column1",
        {"id", "title", "severity", "status", "resource", "createdAt"})
in
    expanded
```

---

### Q8: "What visuals do you use for a security findings dashboard?"

> **Answer:**
> - **KPI cards** — Total open, Critical count, SLA compliance %, MTTR
> - **Stacked bar chart** — Findings by severity over time (shows trend)
> - **Donut chart** — Distribution by category (IAM, Network, Storage)
> - **Matrix** — Teams × Severity with conditional formatting (heatmap)
> - **Line chart** — MTTR trend over months (should be decreasing)
> - **Treemap** — Cloud accounts sized by finding count (spot hotspots)
> - **Slicer** — Cloud provider, date range, team, severity (interactive filtering)
> - **Table** — Top 10 overdue findings with details for action

---

### Q9: "How do you handle data refresh failures?"

> **Answer:**
> 1. Set up **email alerts** in Power BI Service for refresh failures
> 2. Common causes: API token expired, source moved, schema changed
> 3. For token expiry: use parameterized credentials stored in Power BI gateway
> 4. For schema changes: add error handling in Power Query:

```m
// Error handling in Power Query:
try Web.Contents(apiUrl, [Headers = headers])
otherwise #table({"Error"}, {{"API connection failed - check token"}})
```

---

### Q10: "How do you deduplicate findings across multiple sources?"

> **Answer:**
> This is critical for FM — same finding may come from Wiz, Defender, and Splunk.

```dax
// In Power Query (during ETL):
// 1. Add a "source" column to identify origin
// 2. Create a composite key: resource_id + finding_type + severity
// 3. Group by composite key → keep earliest created_date
// 4. Mark others as "duplicate"

// In DAX (for reporting):
Unique_Findings =
CALCULATE(
    DISTINCTCOUNT(Findings[Composite_Key]),
    Findings[Is_Primary] = TRUE
)
```

> "I create a composite key from resource_id + finding_category + severity. During ETL in Power Query, I group by this key and keep only the earliest record as primary. Duplicates are flagged but retained for audit trail. My dashboard shows unique finding counts, not raw counts."

---

### Q11-Q15: Quick Fire Round

**Q11: "What's DirectQuery vs Import mode?"**
> Import loads data into memory (fast queries, scheduled refresh). DirectQuery queries the source live (real-time but slower). I use Import for daily dashboards and DirectQuery for operational views needing real-time data.

**Q12: "How do you optimize a slow Power BI report?"**
> Remove unnecessary columns at the Power Query stage, use star schema, avoid bi-directional relationships, replace calculated columns with measures where possible, use variables in DAX to avoid repeated calculations, and reduce the number of visuals on one page.

**Q13: "What's the difference between ALL and ALLEXCEPT in DAX?"**
> `ALL` removes all filters from a table/column. `ALLEXCEPT` removes all filters EXCEPT the specified columns. Example: `CALCULATE(COUNT, ALLEXCEPT(Findings, Findings[Team]))` — shows total per team ignoring all other slicers.

**Q14: "How do you create a drill-through page?"**
> Right-click on a data point → Drill Through → navigates to a detail page filtered by that value. I set up drill-through from the summary dashboard to a findings detail page — clicking a team's bar drills into their specific findings list.

**Q15: "How do you share reports securely?"**
> Publish to Power BI Service → create a Workspace → add users/AD groups. Apply RLS for row-level data restriction. Use Power BI Apps for distributing to larger audiences. Never export raw data — always share the report link.

---

# PART B: SQL INTERVIEW Q&A — 15 Questions

---

### Q1: "Write a query to find the top 5 teams with the worst SLA compliance."

```sql
SELECT TOP 5
    c.assignment_group AS team,
    COUNT(*) AS total_findings,
    SUM(CASE WHEN f.sla_status = 'Breached' THEN 1 ELSE 0 END) AS breached,
    ROUND(
        SUM(CASE WHEN f.sla_status = 'Breached' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0), 1
    ) AS breach_pct
FROM wiz_findings f
JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE f.status = 'Open'
GROUP BY c.assignment_group
ORDER BY breach_pct DESC;
```

---

### Q2: "Write a query to deduplicate findings using ROW_NUMBER."

```sql
-- Keep only the earliest finding per resource + finding_type combo
WITH ranked AS (
    SELECT *,
        ROW_NUMBER() OVER (
            PARTITION BY resource_id, finding_type
            ORDER BY created_date ASC
        ) AS rn
    FROM wiz_findings
)
SELECT * FROM ranked WHERE rn = 1;

-- rn = 1 → oldest finding (primary)
-- rn > 1 → duplicates (can be archived)
```

---

### Q3: "Explain the difference between WHERE and HAVING."

> **Answer:**
> `WHERE` filters rows BEFORE grouping. `HAVING` filters groups AFTER aggregation.

```sql
-- WHERE: filter individual rows
SELECT * FROM wiz_findings WHERE severity = 'CRITICAL';

-- HAVING: filter aggregated results
SELECT assignment_group, COUNT(*) AS count
FROM wiz_findings
WHERE status = 'Open'                    -- filter rows first
GROUP BY assignment_group
HAVING COUNT(*) > 50                     -- then filter groups
ORDER BY count DESC;
```

---

### Q4: "Write a query to calculate running total of open findings over time."

```sql
SELECT
    created_date,
    COUNT(*) AS new_today,
    SUM(COUNT(*)) OVER (ORDER BY created_date) AS running_total
FROM wiz_findings
WHERE status = 'Open'
GROUP BY created_date
ORDER BY created_date;
```

---

### Q5: "Write a query to find orphaned assets (in Wiz but not in CMDB)."

```sql
SELECT
    f.resource_id,
    f.cloud_provider,
    f.resource_type,
    COUNT(*) AS finding_count,
    MAX(f.severity) AS max_severity
FROM wiz_findings f
LEFT JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE c.ci_id IS NULL        -- no CMDB match
  AND f.status = 'Open'
GROUP BY f.resource_id, f.cloud_provider, f.resource_type
ORDER BY finding_count DESC;
```

---

### Q6: "What's the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?"

```
INNER JOIN: Only rows that match in BOTH tables
LEFT JOIN:  ALL rows from left + matching from right (NULLs if no match)
FULL OUTER: ALL rows from BOTH tables (NULLs where no match)

For FM work:
├── LEFT JOIN findings → CMDB: shows ALL findings, even orphaned ones
├── INNER JOIN findings → tickets: shows only findings with tickets
└── FULL OUTER findings → CMDB: shows orphans + unscanned assets
```

---

### Q7: "Write a query for a monthly finding trend report."

```sql
SELECT
    FORMAT(created_date, 'yyyy-MM') AS month,
    SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical,
    SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) AS high,
    SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) AS medium,
    SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) AS low,
    COUNT(*) AS total
FROM wiz_findings
WHERE created_date >= DATEADD(MONTH, -12, GETDATE())
GROUP BY FORMAT(created_date, 'yyyy-MM')
ORDER BY month;
```

---

### Q8: "What are window functions and when do you use them?"

```sql
-- Window functions compute values ACROSS related rows without collapsing them

-- RANK: rank teams by finding count
SELECT
    assignment_group,
    COUNT(*) AS findings,
    RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
FROM wiz_findings f
JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
GROUP BY assignment_group;

-- LAG: compare with previous month
SELECT
    month,
    finding_count,
    LAG(finding_count) OVER (ORDER BY month) AS prev_month,
    finding_count - LAG(finding_count) OVER (ORDER BY month) AS change
FROM monthly_summary;

-- PERCENT_RANK: percentile distribution of finding ages
SELECT
    resource_id,
    age_days,
    PERCENT_RANK() OVER (ORDER BY age_days) AS percentile
FROM wiz_findings WHERE status = 'Open';
```

---

### Q9-Q15: Quick Fire Round

**Q9: "How do you optimize a slow query?"**
> Add indexes on frequently filtered columns (severity, status, created_date), use `EXISTS` instead of `IN` for subqueries, avoid `SELECT *`, use CTEs for readability, and check the execution plan for table scans.

**Q10: "What's a CTE and when do you use it?"**
> Common Table Expression — a temporary named result set. I use CTEs for complex queries to improve readability and for recursive queries.

**Q11: "Difference between DELETE and TRUNCATE?"**
> `DELETE` removes specific rows (WHERE clause), logged, can rollback. `TRUNCATE` removes all rows, minimal logging, faster, can't rollback.

**Q12: "What's an INDEX and when should you create one?"**
> An index speeds up queries on specific columns. Create indexes on columns used in WHERE, JOIN, and ORDER BY. Don't over-index — each index slows INSERT/UPDATE operations.

**Q13: "Write a query to find findings older than 90 days by team."**
```sql
SELECT c.assignment_group, COUNT(*) AS aged_findings
FROM wiz_findings f
JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE f.status = 'Open' AND DATEDIFF(DAY, f.created_date, GETDATE()) > 90
GROUP BY c.assignment_group ORDER BY aged_findings DESC;
```

**Q14: "How do you handle NULLs in SQL?"**
> Use `ISNULL(column, default)` or `COALESCE(col1, col2, default)` for replacement. Use `IS NULL` / `IS NOT NULL` for filtering. NULLs propagate in math — `5 + NULL = NULL`.

**Q15: "What's the difference between UNION and UNION ALL?"**
> `UNION` removes duplicates (slower). `UNION ALL` keeps all rows (faster). In FM reporting, I use `UNION ALL` when combining findings from different sources since I handle deduplication separately.

---

# PART C: ADVANCED EXCEL — Optimized Workflows for Security Data

---

## C1: Keyboard Shortcuts That Save Hours

```
NAVIGATION:
Ctrl + End           → Jump to last used cell
Ctrl + Home          → Jump to A1
Ctrl + Arrow         → Jump to edge of data region
Ctrl + Shift + End   → Select to last used cell
Ctrl + Space         → Select entire column
Shift + Space        → Select entire row

DATA ENTRY:
Ctrl + D             → Fill down (copy cell above)
Ctrl + R             → Fill right
Ctrl + Enter         → Enter value in ALL selected cells
Alt + Enter          → New line within a cell
F2                   → Edit cell without mouse

FORMATTING:
Ctrl + 1             → Format Cells dialog
Ctrl + Shift + !     → Number format (comma separated)
Ctrl + Shift + %     → Percentage format
Ctrl + B / I / U     → Bold / Italic / Underline
Alt + H + O + I      → Auto-fit column width

TABLES & ANALYSIS:
Ctrl + T             → Create Table (auto-filter, structured refs)
Alt + N + V          → Create PivotTable
Ctrl + Shift + L     → Toggle AutoFilter
F5 → Special         → Select blanks, errors, formulas
```

## C2: Dynamic Arrays (Excel 365 — Game Changer)

```excel
// UNIQUE — List all distinct teams from findings
=UNIQUE(Findings[Team])
// ↑ Returns a spill range — auto-expands as data grows

// FILTER — Get all Critical findings without a PivotTable
=FILTER(Findings, (Findings[Severity]="CRITICAL") * (Findings[Status]="Open"))
// ↑ Returns the entire matching rows — dynamic array

// SORT — Sort findings by age descending
=SORT(FILTER(Findings, Findings[Status]="Open"), Findings[Age_Days], -1)

// SORTBY — Sort by one column, display another
=SORTBY(Findings[Title], Findings[Age_Days], -1)

// SEQUENCE — Generate date series for dashboard
=SEQUENCE(12, 1, DATE(2025,1,1), 30)

// COMBINE: Top 10 oldest open Critical findings in one formula
=TAKE(
    SORT(
        FILTER(A2:H1000, (D2:D1000="CRITICAL") * (G2:G1000="Open")),
        8, -1
    ),
    10
)
```

## C3: LAMBDA Functions — Create Custom Reusable Functions

```excel
// Define a custom SLA calculator in Name Manager:
// Name: SLA_STATUS
// Formula:
=LAMBDA(severity, age_days,
    LET(
        sla, SWITCH(severity,
            "CRITICAL", 1,
            "HIGH", 7,
            "MEDIUM", 30,
            "LOW", 90, 90),
        pct, age_days / sla * 100,
        IF(pct >= 100, "🔴 BREACHED",
        IF(pct >= 75, "🟡 AT RISK",
        "🟢 ON TRACK"))
    )
)

// Use it like a built-in function:
=SLA_STATUS(D2, H2)
// ↑ Pass severity and age — returns status with emoji
```

## C4: LET Function — Make Complex Formulas Readable

```excel
// BAD (unreadable):
=IF(DATEDIFF(C2,TODAY(),"d")/IF(D2="CRITICAL",1,IF(D2="HIGH",7,30))>1,"Breached","OK")

// GOOD (with LET):
=LET(
    age, TODAY() - C2,
    sla, SWITCH(D2, "CRITICAL", 1, "HIGH", 7, "MEDIUM", 30, 90),
    pct, age / sla,
    status, IF(pct >= 1, "🔴 BREACHED", IF(pct >= 0.75, "🟡 AT RISK", "🟢 ON TRACK")),
    remaining, MAX(sla - age, 0),
    status & " (" & remaining & "d left)"
)
// Output: "🟡 AT RISK (2d left)"
```

## C5: Power Query in Excel — Automate Recurring Reports

```
USE CASE: Every Monday, you get a Wiz CSV export and need a formatted report.

AUTOMATE IT:

1. Data → Get Data → From File → From Folder
   (point to a folder where you drop the weekly CSV)

2. Power Query automatically picks up new files

3. Apply transformations:
   ├── Merge with CMDB lookup table (owner mapping)
   ├── Add SLA_Status column
   ├── Group by team → count findings
   ├── Add Week_Number column
   └── Filter to only current week's new findings

4. Close & Apply → formatted table auto-updates

5. PivotTable on top → instant summary

RESULT: Drop the CSV in the folder → open Excel → click Refresh → done.
No manual copy-paste, no VLOOKUP, no formatting needed.
```

## C6: Named Tables and Structured References

```excel
// Convert data range to a Table (Ctrl + T)
// Name it: "Findings"
// Now use structured references instead of cell ranges:

// OLD WAY (breaks when rows are added):
=COUNTIFS(D2:D1000, "CRITICAL", G2:G1000, "Open")

// NEW WAY (auto-expands with table):
=COUNTIFS(Findings[Severity], "CRITICAL", Findings[Status], "Open")

// PivotTable from named table → auto-includes new rows on refresh
```

## C7: Data Validation — Build Input Forms

```
USE CASE: Triage worksheet where analysts update finding status

1. Select the Status column
2. Data → Data Validation
3. Allow: List
4. Source: "Open,In Progress,Resolved,Exception,Closed"

Now analysts can ONLY pick from valid values → no typos → clean data

CASCADING VALIDATION (advanced):
├── Column E: Cloud Provider (Azure, GCP)
├── Column F: Region (depends on Cloud Provider)
│   → Use INDIRECT + named ranges:
│   =INDIRECT(E2)  where "Azure" and "GCP" are named ranges
│   with region lists
```

## C8: Conditional Formatting Rules for Security Dashboards

```
RULE SET FOR FINDINGS WORKSHEET:

1. Severity column:
   ├── CRITICAL → Red fill, white bold text
   ├── HIGH → Orange fill
   ├── MEDIUM → Yellow fill
   └── LOW → Light green fill

2. Age column (icon sets):
   ├── 🔴 Red circle: >30 days
   ├── 🟡 Yellow circle: 15-30 days
   └── 🟢 Green circle: <15 days

3. SLA Status (data bars):
   ├── Show percentage bar for SLA consumption
   └── Color: green→yellow→red gradient

4. Entire row highlighting:
   ├── If SLA = "Breached" → entire row light red fill
   └── Use formula rule: =$I2="BREACHED"

HOW TO APPLY:
Home → Conditional Formatting → New Rule → Use a formula
Formula: =$D2="CRITICAL"
Format: Fill = Red, Font = White, Bold
```

## C9: Pivot Table Advanced Techniques

```
TECHNIQUE 1: Calculated Fields
├── In PivotTable → Analyze → Fields, Items & Sets → Calculated Field
├── Name: SLA_Breach_Rate
├── Formula: = Breached / (Breached + On_Track) * 100
└── Result: percentage shown in PivotTable without adding a column

TECHNIQUE 2: Grouping Dates
├── Right-click a date field in PivotTable → Group
├── Select: Months + Quarters + Years
└── Result: automatic time hierarchy (drill down from Year → Quarter → Month)

TECHNIQUE 3: Show Values As
├── Right-click a value → Show Values As
├── Options:
│   ├── % of Grand Total → what % of all findings are Critical?
│   ├── % of Parent Row → what % of Azure findings are Critical?
│   ├── Running Total → cumulative findings over time
│   └── Difference From → compare vs previous month
└── No formulas needed — all built-in

TECHNIQUE 4: Slicers (Visual Filters)
├── PivotTable → Analyze → Insert Slicer
├── Select: Severity, Team, Cloud Provider
├── Connect multiple PivotTables to same slicer
│   (right-click slicer → Report Connections)
└── Result: one-click filtering across all tables/charts on the sheet
```

## C10: Bulk Operations — Working with 50,000+ Row Datasets

```
OPTIMIZATION TIPS:

1. Use Tables (Ctrl+T) not raw ranges
   → structured references, auto-expand, better performance

2. Turn off auto-calculate while processing
   → Formulas → Calculation Options → Manual
   → Press F9 to calculate when ready

3. Use Power Query instead of formulas for transformations
   → Power Query processes data OUTSIDE the worksheet
   → Doesn't slow down the workbook

4. Remove unnecessary formatting
   → Conditional formatting on 50K rows = slow
   → Apply only to visible/filtered rows

5. Use XLOOKUP with sorted data + binary search
   → =XLOOKUP(value, range, return, , 2)  ← the "2" = binary search
   → 10x faster than approximate match on sorted data

6. Replace volatile functions
   → TODAY(), NOW(), INDIRECT(), OFFSET() recalculate on EVERY change
   → Use a single cell with =TODAY() and reference THAT cell

7. Use helper columns instead of nested formulas
   → One formula per column instead of 5 nested IFs
   → Easier to debug, easier for others to understand
```

---

# PART D: SOP WRITING — Missing Skill for Documentation

```
SOP TEMPLATE FOR WELLS FARGO FM TEAM:

TITLE: [Action] - [System] - [Frequency]
Example: "Triaging Critical Wiz Findings - Daily"

SECTIONS:
1. PURPOSE: Why this SOP exists (1-2 sentences)
2. SCOPE: What it covers and doesn't cover
3. PREREQUISITES: Tools, access, permissions needed
4. PROCEDURE: Numbered steps with screenshots
   ├── Step 1: Log into [system]
   ├── Step 2: Navigate to [location]
   ├── Step 3: Apply these filters: [...]
   ├── Step 4: For each finding, determine [...]
   │   ├── IF [condition A] → Do [action A]
   │   └── IF [condition B] → Do [action B]
   └── Step 5: Update [tracking system]
5. ESCALATION: When to escalate and to whom
6. REFERENCES: Related SOPs, KB articles
7. REVISION HISTORY: Date, author, change description

EXAMPLE SOP TITLES FOR FM:
├── "Triaging New Critical/High Wiz Findings — Daily"
├── "CMDB Validation for Cloud Asset Ownership — Weekly"
├── "Creating ServiceNow Tickets from Wiz Findings — Ad Hoc"
├── "Running Monthly SLA Compliance Report in Power BI"
├── "Processing Risk Acceptance Exceptions — As Needed"
├── "Onboarding New Cloud Account into Wiz — As Needed"
└── "Preparing Quarterly Compliance Report for Audit"
```

---

# PART E: AUDIT PREPARATION WORKFLOW

```
QUARTERLY AUDIT PREP (2-3 weeks before audit):

WEEK 1: DATA COLLECTION
├── Export all findings from Wiz (CSV) for audit period
├── Export ServiceNow ticket data (open, closed, exceptions)
├── Pull Power BI report: SLA compliance, MTTR, finding trends
├── Collect evidence of remediation activities
└── Document all risk acceptances with approval chain

WEEK 2: ANALYSIS & REPORTING
├── Verify: all findings have corresponding tickets
├── Verify: all closed findings have remediation evidence
├── Verify: all exceptions have VP sign-off and expiry date
├── Create summary report:
│   ├── Total findings discovered vs remediated
│   ├── SLA compliance rate by severity
│   ├── MTTR by severity
│   ├── Exception count and justifications
│   └── Coverage: % of cloud assets scanned
└── Identify any gaps to address before audit

WEEK 3: REVIEW & PRESENTATION
├── Review report with team lead
├── Prepare answers for common auditor questions:
│   ├── "How do you ensure all misconfigurations are detected?"
│   ├── "What is your average time to remediate a Critical finding?"
│   ├── "How do you handle exceptions and risk acceptances?"
│   ├── "What percentage of your cloud assets are covered by scanning?"
│   └── "How do you validate that remediation was effective?"
└── Stage all evidence files in shared drive for auditor access
```
