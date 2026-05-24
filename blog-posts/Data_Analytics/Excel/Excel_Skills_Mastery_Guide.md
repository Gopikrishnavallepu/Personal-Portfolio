# 📗 EXCEL SKILLS MASTERY — Basic to Advanced with Practicals

> **For:** Wells Fargo Findings Management — Extract, Clean, Shape, Report, Audit
> **Approach:** Every concept has a practical exercise using security findings data

---

# MODULE 1: EXCEL FUNDAMENTALS (30 min)

## 1.1 Workbook Structure

```
WORKBOOK (.xlsx) → contains multiple SHEETS (tabs)

For our security work, create these sheets:
├── Sheet 1: "Raw_Findings"      → paste Wiz export here
├── Sheet 2: "CMDB_Lookup"       → paste CMDB data here
├── Sheet 3: "Analysis"          → your formulas & calculations
├── Sheet 4: "PivotTable"        → summary pivots
└── Sheet 5: "Dashboard"         → visual summary for management
```

## 1.2 Cell References — The Foundation

```excel
// RELATIVE reference (changes when copied):
=A2 + B2     → when copied down: =A3 + B3, =A4 + B4...

// ABSOLUTE reference (stays fixed with $):
=$A$2 + B2   → when copied down: =$A$2 + B3, =$A$2 + B4...

// MIXED reference:
=$A2          → column locked, row changes
=A$2          → row locked, column changes

WHEN TO USE WHAT:
├── Relative: most formulas (auto-adjust when copying)
├── Absolute: lookup ranges, constants, target values
└── Mixed: building matrices (lock row OR column)
```

## 1.3 Essential Functions — Level 1

```excel
// COUNTING
=COUNT(A2:A100)        → counts cells with numbers
=COUNTA(A2:A100)       → counts non-empty cells (text + numbers)
=COUNTBLANK(A2:A100)   → counts empty cells
=COUNTIF(D2:D100, "CRITICAL")    → count cells matching criteria
=COUNTIFS(D2:D100, "CRITICAL", G2:G100, "Open")  → multiple criteria

// SUMMING
=SUM(H2:H100)          → add all values
=SUMIF(D2:D100, "HIGH", H2:H100)  → sum where severity is HIGH
=SUMIFS(H2:H100, D2:D100, "HIGH", G2:G100, "Open")  → multiple criteria

// AVERAGING
=AVERAGE(H2:H100)      → average of all
=AVERAGEIF(D2:D100, "CRITICAL", H2:H100)  → avg where Critical
=AVERAGEIFS(H2:H100, D2:D100, "CRITICAL", G2:G100, "Closed")

// MIN / MAX
=MIN(H2:H100)          → lowest value
=MAX(H2:H100)          → highest value
=MINIFS(H2:H100, D2:D100, "CRITICAL")  → min for Critical only
```

### 🔧 PRACTICAL 1: Basic Counts

```
SETUP: Open wiz_findings.csv from the PowerBI_Project/data/ folder

In a new sheet called "Analysis", create these:

Cell A1: "METRIC"              Cell B1: "VALUE"
Cell A2: "Total Findings"      Cell B2: =COUNTA(Raw_Findings!A2:A51)
Cell A3: "Open Findings"       Cell B3: =COUNTIF(Raw_Findings!F2:F51,"Open")
Cell A4: "Closed Findings"     Cell B4: =COUNTIF(Raw_Findings!F2:F51,"Closed")
Cell A5: "Critical Open"       Cell B5: =COUNTIFS(Raw_Findings!D2:D51,"CRITICAL",Raw_Findings!F2:F51,"Open")
Cell A6: "High Open"           Cell B6: =COUNTIFS(Raw_Findings!D2:D51,"HIGH",Raw_Findings!F2:F51,"Open")
Cell A7: "Medium Open"         Cell B7: =COUNTIFS(Raw_Findings!D2:D51,"MEDIUM",Raw_Findings!F2:F51,"Open")
Cell A8: "Low Open"            Cell B8: =COUNTIFS(Raw_Findings!D2:D51,"LOW",Raw_Findings!F2:F51,"Open")
Cell A9: "Azure Findings"      Cell B9: =COUNTIF(Raw_Findings!E2:E51,"Azure")
Cell A10: "GCP Findings"       Cell B10: =COUNTIF(Raw_Findings!E2:E51,"GCP")

EXPECTED RESULTS:
Total: 50, Open: 40, Closed: 10, CritOpen: 8, HighOpen: 14, MedOpen: 13, LowOpen: 5
```

---

# MODULE 2: LOOKUP FUNCTIONS (45 min)

## 2.1 VLOOKUP — The Classic

```excel
// Syntax: =VLOOKUP(lookup_value, table_array, col_index, [exact_match])

=VLOOKUP(A2, CMDB!$A:$F, 4, FALSE)
//        ↑       ↑        ↑    ↑
//   what to     where    which  FALSE = exact match
//   look for    to look  column (ALWAYS use FALSE)
//               (must be to
//               first col) return

LIMITATIONS:
├── Can only look RIGHT (lookup column must be leftmost)
├── Returns only ONE value (first match)
├── Breaks if columns are inserted/deleted
└── col_index is a number — hard to maintain
```

## 2.2 XLOOKUP — The Replacement (Excel 365+)

```excel
// Syntax: =XLOOKUP(lookup_value, lookup_array, return_array, [not_found], [match_mode], [search_mode])

=XLOOKUP(A2, CMDB!$B:$B, CMDB!$D:$D, "NOT FOUND")
//       ↑       ↑            ↑            ↑
//   what to   where to     what to      if no
//   find      search       return       match

ADVANTAGES OVER VLOOKUP:
├── Can look LEFT, RIGHT, or any direction
├── Has built-in "not found" value
├── Exact match by default
├── Can return multiple columns at once
├── Doesn't need column index number
└── More readable
```

## 2.3 INDEX-MATCH — The Power Combo

```excel
// Syntax: =INDEX(return_range, MATCH(lookup_value, lookup_range, 0))

=INDEX(CMDB!$D:$D, MATCH(A2, CMDB!$B:$B, 0))
//        ↑                ↑       ↑       ↑
//   column to       what to   where    0 = exact
//   return from     find      to look  match

WHY USE INDEX-MATCH:
├── Works in ALL Excel versions (XLOOKUP needs 365)
├── Can look in any direction
├── More flexible than VLOOKUP
├── Faster on large datasets
└── Can do multi-criteria lookups (see below)

// MULTI-CRITERIA INDEX-MATCH:
=INDEX(CMDB!$D:$D, MATCH(A2&B2, CMDB!$A:$A&CMDB!$B:$B, 0))
// Press Ctrl+Shift+Enter (array formula in older Excel)
// Matches where BOTH resource_id AND cloud match
```

### 🔧 PRACTICAL 2: Lookup Owner from CMDB

```
SETUP:
1. Open wiz_findings.csv in Sheet "Findings"
2. Open cmdb_assets.csv in Sheet "CMDB"
3. In Findings sheet, add column header in cell L1: "Owner"

EXERCISE 1 — VLOOKUP:
Cell L2: =VLOOKUP(H2, CMDB!$B:$D, 3, FALSE)
// Looks up resource_id (col H) in CMDB col B, returns col D (owner)
// Copy down to L51

EXERCISE 2 — XLOOKUP (if you have Excel 365):
Cell M1: "Owner_XL"
Cell M2: =XLOOKUP(H2, CMDB!$B:$B, CMDB!$D:$D, "UNASSIGNED")
// Same result but with "UNASSIGNED" for any unmatched findings

EXERCISE 3 — INDEX-MATCH:
Cell N1: "Owner_IM"
Cell N2: =INDEX(CMDB!$D:$D, MATCH(H2, CMDB!$B:$B, 0))

EXERCISE 4 — Get Assignment Group too:
Cell O1: "Team"
Cell O2: =XLOOKUP(H2, CMDB!$B:$B, CMDB!$F:$F, "UNASSIGNED")
// Returns the assignment_group for this finding

VERIFY: Finding WIZ-001 (stgprod01) should return "Rajesh Kumar"
VERIFY: Finding WIZ-012 (gke-prod-01) should return "Kevin Zhang"
```

### 🔧 PRACTICAL 3: Handle Missing Lookups

```
EXERCISE 5 — Count unmatched findings:
Cell A15: "Unmatched Findings"
Cell B15: =COUNTIF(M2:M51, "UNASSIGNED")
// Shows how many findings have no CMDB entry (orphaned assets)

EXERCISE 6 — IFERROR with VLOOKUP:
Cell P1: "Owner_Safe"
Cell P2: =IFERROR(VLOOKUP(H2, CMDB!$B:$D, 3, FALSE), "⚠️ NOT IN CMDB")
// Shows warning for any unmatched items

EXERCISE 7 — Flag orphaned assets:
Cell Q1: "CMDB_Status"
Cell Q2: =IF(ISNA(MATCH(H2, CMDB!$B:$B, 0)), "❌ ORPHANED", "✅ REGISTERED")
// Binary flag: is this asset in CMDB or not?
```

---

# MODULE 3: TEXT & DATE FUNCTIONS (30 min)

## 3.1 Text Functions

```excel
// CONCATENATION
=A2 & " - " & B2              → "WIZ-001 - S3 Bucket Public Access"
=TEXTJOIN(", ", TRUE, A2:A5)   → "WIZ-001, WIZ-002, WIZ-003, WIZ-004"

// EXTRACTION
=LEFT(A2, 3)          → "WIZ"
=RIGHT(A2, 3)         → "001"
=MID(A2, 5, 3)        → "001" (start at pos 5, take 3 chars)
=LEN(A2)              → 7

// CLEANING
=TRIM(A2)             → removes extra spaces
=CLEAN(A2)            → removes non-printable characters
=UPPER(D2)            → "CRITICAL"
=LOWER(D2)            → "critical"
=PROPER(D2)           → "Critical"

// SEARCH & REPLACE
=FIND("NSG", C2)      → position of "NSG" in title (error if not found)
=SEARCH("nsg", C2)    → same but case-insensitive
=SUBSTITUTE(C2, "0.0.0.0/0", "ANY")  → replace text
```

## 3.2 Date Functions

```excel
// CURRENT DATE
=TODAY()               → today's date (no time)
=NOW()                 → current date + time

// DATE MATH
=TODAY() - F2          → days since created_date (result is a number)
=DATEDIF(F2, TODAY(), "d")  → days between two dates
=DATEDIF(F2, TODAY(), "m")  → months between

// DATE PARTS
=YEAR(F2)              → 2025
=MONTH(F2)             → 1
=DAY(F2)               → 15
=WEEKNUM(F2)           → week number
=TEXT(F2, "MMM-YYYY")  → "Jan-2025"
=TEXT(F2, "ddd")       → "Wed"

// DATE CREATION
=DATE(2025, 1, 15)     → creates date Jan 15, 2025
=EOMONTH(F2, 0)       → end of same month as F2
=WORKDAY(F2, 7)        → 7 business days after F2
```

### 🔧 PRACTICAL 4: Calculate Finding Age & SLA

```
ADD THESE COLUMNS TO YOUR FINDINGS SHEET:

Cell R1: "Age_Days"
Cell R2: =IF(G2="Closed", F7-F2, TODAY()-F2)
// If closed: days between created and closed
// If open: days since created until today
// Copy down to R51

Cell S1: "SLA_Days"
Cell S2: =SWITCH(D2, "CRITICAL",1, "HIGH",7, "MEDIUM",30, "LOW",90, 90)
// SLA target in days based on severity

Cell T1: "SLA_Pct_Used"
Cell T2: =ROUND(R2/S2*100, 0)
// What percentage of SLA has been consumed

Cell U1: "SLA_Status"
Cell U2: =IF(G2="Closed","✅ Resolved",IF(T2>=100,"🔴 Breached",IF(T2>=75,"🟡 At Risk","🟢 On Track")))
// Visual SLA status with emojis

Cell V1: "Days_Remaining"
Cell V2: =IF(G2="Closed","N/A", MAX(S2-R2, 0))
// Days left before SLA breach (0 if already breached)

Cell W1: "Month_Created"
Cell W2: =TEXT(F2, "MMM-YYYY")
// For grouping by month in PivotTables

VERIFY: WIZ-001 (Critical, created Jan 5) should show Breached (>1 day old)
VERIFY: WIZ-050 (Low, created Mar 20) should show On Track
```

---

# MODULE 4: LOGICAL & CONDITIONAL FUNCTIONS (30 min)

## 4.1 IF, IFS, SWITCH, AND, OR

```excel
// BASIC IF
=IF(D2="CRITICAL", "P1", "P2+")

// NESTED IF (old way — messy)
=IF(D2="CRITICAL","P1", IF(D2="HIGH","P2", IF(D2="MEDIUM","P3","P4")))

// IFS (cleaner — Excel 365)
=IFS(D2="CRITICAL","P1", D2="HIGH","P2", D2="MEDIUM","P3", TRUE,"P4")

// SWITCH (cleanest)
=SWITCH(D2, "CRITICAL","P1", "HIGH","P2", "MEDIUM","P3", "P4")

// AND / OR for complex conditions
=IF(AND(D2="CRITICAL", E2="Yes"), "🚨 URGENT", "Normal")
// Critical AND internet-facing → URGENT

=IF(OR(D2="CRITICAL", D2="HIGH"), "Priority", "Standard")
// Critical OR High → Priority
```

## 4.2 LET — Make Complex Formulas Readable (Excel 365)

```excel
// WITHOUT LET (unreadable):
=IF(((TODAY()-F2)/IF(D2="CRITICAL",1,IF(D2="HIGH",7,30)))>=1,"Breached","OK")

// WITH LET (readable):
=LET(
    age, TODAY()-F2,
    sla, SWITCH(D2, "CRITICAL",1, "HIGH",7, "MEDIUM",30, 90),
    pct, age/sla,
    IF(pct>=1, "🔴 BREACHED",
    IF(pct>=0.75, "🟡 AT RISK",
    "🟢 ON TRACK"))
)
```

### 🔧 PRACTICAL 5: Risk Scoring Formula

```
Cell X1: "Risk_Score"
Cell X2: =LET(
    sev_score, SWITCH(D2, "CRITICAL",40, "HIGH",30, "MEDIUM",20, "LOW",10),
    exposure, IF(K2="Yes", 25, 0),
    data_score, SWITCH(L2, "Restricted",25, "Confidential",20, "Internal",10, "Public",5, 10),
    age_score, MIN(R2/7*10, 10),
    sev_score + exposure + data_score + age_score
)

// Scoring:
// Severity:      CRITICAL=40, HIGH=30, MEDIUM=20, LOW=10
// Internet-facing: Yes=25, No=0
// Data class:    Restricted=25, Confidential=20, Internal=10, Public=5
// Age factor:    +10 for every 7 days old (max 10)
// MAX SCORE: 100

Cell Y1: "Risk_Level"
Cell Y2: =IF(X2>=80,"🔴 CRITICAL",IF(X2>=60,"🟠 HIGH",IF(X2>=40,"🟡 MEDIUM","🟢 LOW")))

VERIFY: WIZ-001 (Critical+Internet+Confidential+Old) should be 80+
VERIFY: WIZ-050 (Low+NoInternet+Internal+New) should be <40
```

---

# MODULE 5: PIVOTTABLES (45 min)

## 5.1 Creating Your First PivotTable

```
STEPS:
1. Click anywhere in your Findings data
2. Insert → PivotTable → New Worksheet
3. Name the sheet "PivotAnalysis"
4. The PivotTable Fields pane appears on the right
```

## 5.2 PivotTable Configurations

### 🔧 PRACTICAL 6: Build 5 PivotTables

```
PIVOT 1: Findings by Severity × Status
├── ROWS: severity
├── COLUMNS: status (Open/Closed)
├── VALUES: Count of finding_id
├── EXPECTED RESULT:
│   Severity  | Closed | Open | Total
│   CRITICAL  |   4    |  8   |  12
│   HIGH      |   4    |  14  |  18
│   MEDIUM    |   1    |  13  |  14
│   LOW       |   1    |  5   |   6
│   Total     |  10    |  40  |  50

PIVOT 2: Findings by Team (needs XLOOKUP column first)
├── ROWS: assignment_group (from your lookup column)
├── COLUMNS: severity
├── VALUES: Count of finding_id
├── FILTER: status = "Open" only
├── Sort: by Grand Total descending
├── Shows: which teams have the most open findings

PIVOT 3: Findings by Category × Cloud Provider
├── ROWS: category
├── COLUMNS: cloud_provider
├── VALUES: Count of finding_id
├── FILTER: status = "Open"
├── Shows: IAM vs Network vs Storage vs Container distribution

PIVOT 4: Monthly Trend
├── ROWS: Month_Created (your calculated column)
├── COLUMNS: severity
├── VALUES: Count of finding_id
├── Shows: are findings increasing or decreasing over time?

PIVOT 5: SLA Status Summary
├── ROWS: SLA_Status (your calculated column)
├── VALUES: Count of finding_id
├── Shows: how many On Track vs At Risk vs Breached
```

## 5.3 PivotTable Advanced Techniques

```
TECHNIQUE 1: Show Values As → % of Grand Total
├── Right-click any value → Show Values As → % of Grand Total
├── Shows: "42% of all findings are HIGH severity"

TECHNIQUE 2: Calculated Field
├── PivotTable Analyze → Fields, Items & Sets → Calculated Field
├── Name: Breach_Rate
├── Formula: = Breached / (Breached + OnTrack)
├── Shows: breach rate without adding a column

TECHNIQUE 3: Group Dates by Month/Quarter
├── Right-click any date in ROWS → Group
├── Select: Months + Quarters
├── Now you have auto time hierarchy

TECHNIQUE 4: Slicers for Visual Filtering
├── PivotTable Analyze → Insert Slicer
├── Check: severity, cloud_provider, category
├── Click buttons to instantly filter the PivotTable
├── Connect to multiple PivotTables:
│   Right-click slicer → Report Connections → check all PivotTables

TECHNIQUE 5: Conditional Formatting in PivotTable
├── Select the value cells in the PivotTable
├── Home → Conditional Formatting → Color Scales
├── Green-Yellow-Red: low=green, high=red
├── Now your PivotTable is a heatmap
```

### 🔧 PRACTICAL 7: Executive Summary PivotTable

```
Create a single PivotTable that leadership can glance at:

ROWS: assignment_group
VALUES (multiple):
├── Count of finding_id → rename "Total Findings"
├── Count of finding_id (add again) → filter "CRITICAL" → rename "Critical"
├── Count of finding_id (add again) → Show Values As % → rename "% of Total"

Add Slicer: cloud_provider (tiles at top)
Add Slicer: status (tiles: Open / Closed)

FORMAT:
├── PivotTable Design → Report Layout → Tabular
├── PivotTable Design → Subtotals → Do Not Show
├── Conditional Formatting on Critical column: data bar (red)
```

---

# MODULE 6: CONDITIONAL FORMATTING (30 min)

## 6.1 Rules You Need

```
RULE 1: Color by Severity
├── Select severity column → Conditional Formatting → New Rule
├── Rule Type: Format only cells that contain
├── Cell Value → equal to → "CRITICAL"
├── Format: Fill = #e74c3c (red), Font = White, Bold
├── Repeat for HIGH (orange), MEDIUM (yellow), LOW (green)

RULE 2: SLA Status Colors
├── Select SLA_Status column
├── "🔴 Breached" → Red fill
├── "🟡 At Risk" → Yellow fill
├── "🟢 On Track" → Green fill

RULE 3: Age Heatmap (Color Scale)
├── Select Age_Days column
├── Conditional Formatting → Color Scales → Green-Yellow-Red
├── Minimum (green) = 0
├── Maximum (red) = 90

RULE 4: Entire Row Highlight
├── Select entire data range (A2:Y51)
├── Conditional Formatting → New Rule
├── Use a formula: =$D2="CRITICAL"
├── Format: Light red fill
├── Now entire rows with CRITICAL findings are highlighted

RULE 5: Data Bars for Risk Score
├── Select Risk_Score column
├── Conditional Formatting → Data Bars
├── Solid fill → gradient from green to red
├── Shows: visual bar proportional to risk score

RULE 6: Icon Sets for Age
├── Select Age_Days column
├── Conditional Formatting → Icon Sets → 3 Traffic Lights
├── Custom: ⚫ Red >= 30, 🟡 Yellow >= 15, 🟢 Green < 15
```

### 🔧 PRACTICAL 8: Build a Formatted Findings Table

```
STEPS:
1. Copy columns A-Y to a new sheet "Formatted_Report"
2. Select all data → Ctrl+T → Create Table → Name: "FindingsTable"
3. Apply ALL 6 conditional formatting rules above
4. Sort by: Severity_Order ASC, then Age_Days DESC
5. Freeze top row: View → Freeze Panes → Freeze Top Row
6. Auto-fit column widths: Select all → Format → AutoFit Column Width

RESULT: A color-coded, sortable, filterable findings report that
        looks professional when shared with management or auditors
```

---

# MODULE 7: POWER QUERY IN EXCEL (45 min)

## 7.1 Why Power Query

```
POWER QUERY vs FORMULAS:

Without Power Query:
├── Open CSV → copy/paste into sheet
├── Write VLOOKUP formulas for each lookup
├── Manually clean data (remove blanks, fix types)
├── Redo everything when new CSV arrives next week

With Power Query:
├── Connect to CSV file/folder (one-time setup)
├── Define transformations (merge, clean, calculate)
├── Click REFRESH when new data arrives
├── Everything auto-updates
└── No formulas needed
```

## 7.2 Steps to Build

### 🔧 PRACTICAL 9: Power Query — Auto-Merge Findings + CMDB

```
STEP 1: Import Findings
├── Data → Get Data → From File → From Text/CSV
├── Select wiz_findings.csv → Import
├── Click "Transform Data" (opens Power Query Editor)

STEP 2: Clean Findings Data
In Power Query Editor:
├── Change created_date type: Click column header → Date
├── Change closed_date type: Date
├── Change sla_hours type: Whole Number
├── Remove columns you don't need: Right-click → Remove Columns
│   (keep: finding_id, title, severity, status, category, 
│    cloud_provider, resource_id, internet_facing, created_date, 
│    closed_date, sla_hours)

STEP 3: Add Calculated Columns
├── Add Column → Custom Column → Name: "Age_Days"
├── Formula:
    if [status] = "Closed" then
        Duration.Days([closed_date] - [created_date])
    else
        Duration.Days(DateTime.LocalNow() - [created_date])

├── Add Column → Custom Column → Name: "SLA_Status"
├── Formula:
    let
        age = Duration.Days(DateTime.LocalNow() - [created_date]),
        sla = if [severity] = "CRITICAL" then 1
              else if [severity] = "HIGH" then 7
              else if [severity] = "MEDIUM" then 30
              else 90
    in
        if [status] = "Closed" then "Resolved"
        else if age >= sla then "Breached"
        else if age >= sla * 0.75 then "At Risk"
        else "On Track"

STEP 4: Import CMDB Data
├── Home → New Source → File → Text/CSV
├── Select cmdb_assets.csv → OK

STEP 5: Merge Queries (= JOIN in SQL)
├── Back on the Findings query
├── Home → Merge Queries
├── Select: Findings[resource_id] = cmdb_assets[cloud_resource_id]
├── Join Kind: Left Outer (keep ALL findings, add CMDB where matched)
├── Click OK
├── Expand the merged column (click the expand icon ⇔)
├── Select: owner, assignment_group, environment
├── Uncheck "Use original column name as prefix"

STEP 6: Close & Apply
├── Home → Close & Apply
├── Your merged, cleaned data appears as an Excel Table
├── PivotTables will auto-reference this data

NEXT WEEK: When you get a new findings CSV:
├── Just replace the old CSV file with the new one
├── Open Excel → Data → Refresh All
├── Everything updates automatically — zero manual work!
```

## 7.3 Advanced Power Query Operations

```
OPERATION: Group By (for summary tables)
├── Transform → Group By
├── Group by: severity
├── New column: Count → Count Rows
├── Result: summary table (like PivotTable but in ETL)

OPERATION: Unpivot (wide → tall)
├── Select columns to keep → Right-click → Unpivot Other Columns
├── Use when: CSV has months as columns (Jan, Feb, Mar...)
├── Result: one row per month per finding

OPERATION: Pivot (tall → wide)
├── Transform → Pivot Column
├── Select value column → Values Column: Count
├── Use when: you need a cross-tab from flat data

OPERATION: Append (combine multiple CSVs)
├── Home → Append Queries → Three or More
├── Select all monthly exports
├── Result: one combined table

OPERATION: Data From Folder (auto-combine all CSVs in a folder)
├── Data → Get Data → From File → From Folder
├── Select folder path
├── Power Query finds all files, combines them
├── Next month: just drop new CSV in folder → Refresh → done
```

### 🔧 PRACTICAL 10: Auto-Refresh Weekly Report

```
BUILD THIS ONCE, USE FOREVER:

1. Create a folder: C:\SecurityReports\Weekly\
2. Put wiz_findings.csv in that folder
3. In Excel: Data → Get Data → From File → From Folder
4. Select the folder
5. Power Query imports all CSVs in the folder
6. Apply transform steps (add Age, SLA_Status, merge with CMDB)
7. Close & Apply

EVERY WEEK:
├── Drop the new wiz_findings.csv into the folder
├── Open Excel → Data → Refresh All
├── Report auto-updates
├── PivotTables auto-update
├── Conditional formatting auto-applies
└── Total time: 10 seconds instead of 30 minutes
```

---

# MODULE 8: DATA VALIDATION & FORMS (20 min)

### 🔧 PRACTICAL 11: Build a Triage Input Form

```
PURPOSE: Analysts use this sheet to triage findings

COLUMN A: "Finding ID" → populated by Power Query
COLUMN B: "Title" → populated by Power Query
COLUMN C: "Severity" → populated by Power Query

COLUMN D: "Triage Status" (analyst input — use Data Validation)
├── Select D2:D100
├── Data → Data Validation
├── Allow: List
├── Source: True Positive,False Positive,Duplicate,Needs Review
├── Error Alert: "Please select a valid triage status"

COLUMN E: "Action" (analyst input)
├── Data → Data Validation → List
├── Source: Assign Ticket,Accept Risk,Suppress,Escalate

COLUMN F: "Notes" (free text — no validation)

COLUMN G: "Triaged By" (auto-populate)
├── Formula: =IF(D2<>"", ENVIRON("USERNAME"), "")
├── Or hardcode your name

COLUMN H: "Triage Date" (auto-populate)
├── Formula: =IF(D2<>"", TODAY(), "")

PROTECT THE SHEET:
├── Unlock columns D, E, F (right-click → Format Cells → Protection → Unlock)
├── Review → Protect Sheet → set password
├── Now analysts can ONLY edit the triage columns
```

---

# MODULE 9: CHARTS & DASHBOARD (30 min)

### 🔧 PRACTICAL 12: Build an Excel Dashboard

```
CREATE A NEW SHEET: "Dashboard"

CHART 1: Severity Distribution (Pie Chart)
├── Use PivotTable 1 data (severity × count)
├── Insert → Pie Chart → 3D Pie
├── Colors: CRITICAL=Red, HIGH=Orange, MEDIUM=Yellow, LOW=Green
├── Data Labels: Show percentage + category
├── Title: "Open Findings by Severity"
├── Size: 300x250, Position: A1

CHART 2: Findings by Team (Horizontal Bar Chart)
├── Use PivotTable 2 data (team × count)
├── Insert → Bar Chart → Clustered Bar
├── Sort: largest to smallest
├── Data Labels: show values
├── Title: "Open Findings by Team"
├── Size: 400x250, Position: D1

CHART 3: Monthly Trend (Line Chart)
├── Use PivotTable 4 data (month × count)
├── Insert → Line Chart → Line with Markers
├── Separate lines for CRITICAL, HIGH, MEDIUM, LOW
├── Title: "Finding Trend by Month"
├── Size: 400x200, Position: A15

CHART 4: SLA Status (Donut Chart)
├── Use PivotTable 5 data (SLA status × count)
├── Insert → Doughnut Chart
├── Colors: OnTrack=Green, AtRisk=Yellow, Breached=Red
├── Title: "SLA Compliance"
├── Size: 300x250, Position: D15

SUMMARY CARDS (Text Boxes):
├── Insert → Text Box → "TOTAL OPEN: " & link to cell B3
├── Create 4 text boxes:
│   ├── Total Open (blue border)
│   ├── Critical (red border)
│   ├── SLA Compliance % (green border)
│   └── Avg Age (purple border)
├── Position: across the top of the dashboard

SLICER:
├── Click any PivotTable → Analyze → Insert Slicer
├── Select: cloud_provider, severity
├── Connect slicer to ALL PivotTables on this sheet
├── Position: right side panel
```

---

# MODULE 10: AUDIT PREPARATION WORKBOOK (20 min)

### 🔧 PRACTICAL 13: Build an Audit-Ready Export

```
CREATE A NEW SHEET: "Audit_Report"

STRUCTURE:
Row 1: "CLOUD SECURITY FINDINGS AUDIT REPORT"
Row 2: "Report Period: Jan 2025 - Mar 2025"
Row 3: "Generated: " & =TEXT(TODAY(), "DD-MMM-YYYY")
Row 4: blank
Row 5: Headers

HEADERS (Row 5):
A: Finding ID      H: SLA Status
B: Severity         I: Age (Days)  
C: Title            J: Owner
D: Cloud Provider   K: Team
E: Category         L: Triage Decision
F: Status           M: SNOW Ticket
G: Created Date     N: Resolution/Notes

BELOW THE TABLE — Summary Section:
Row 55: "SUMMARY STATISTICS"
A56: "Total Findings Discovered"    B56: =COUNTA(A6:A54)
A57: "Findings Remediated"         B57: =COUNTIF(F6:F54,"Closed")
A58: "Remediation Rate"            B58: =B57/B56*100 & "%"
A59: "SLA Compliance (Open)"       B59: =COUNTIF(H6:H54,"On Track")/(COUNTA(H6:H54)-COUNTIF(H6:H54,"Resolved"))*100 & "%"
A60: "Avg MTTR (Closed, Days)"     B60: =AVERAGEIF(F6:F54,"Closed",I6:I54)
A61: "Findings with SNOW Ticket"   B61: =COUNTA(M6:M54)
A62: "Orphaned (No CMDB Owner)"    B62: =COUNTIF(J6:J54,"UNASSIGNED")

PRINT SETUP:
├── Page Layout → Orientation → Landscape
├── Page Layout → Print Area → Set Print Area (select all)
├── Page Layout → Scale to Fit → Width: 1 page
├── File → Print Preview → verify it looks clean
└── File → Save As → PDF for auditors
```

---

# 📋 SKILLS CHECKLIST — Track Your Progress

```
MODULE 1: FUNDAMENTALS
☐ Understand cell references (relative, absolute, mixed)
☐ Use COUNT, COUNTIF, COUNTIFS
☐ Use SUM, SUMIF, SUMIFS
☐ Use AVERAGE, AVERAGEIF

MODULE 2: LOOKUPS
☐ Write VLOOKUP formula
☐ Write XLOOKUP formula
☐ Write INDEX-MATCH formula
☐ Handle errors with IFERROR
☐ Do multi-criteria lookup

MODULE 3: TEXT & DATES
☐ Use TODAY(), DATEDIF for age calculation
☐ Use TEXT for date formatting
☐ Use SWITCH for severity mapping

MODULE 4: LOGIC
☐ Write nested IF/IFS/SWITCH
☐ Use AND/OR in conditions
☐ Build risk scoring formula with LET

MODULE 5: PIVOTTABLES
☐ Create basic PivotTable (severity × status)
☐ Add multiple value fields
☐ Use Show Values As (% of total)
☐ Group dates by month
☐ Add Slicers and connect to multiple PivotTables

MODULE 6: CONDITIONAL FORMATTING
☐ Color by severity
☐ Color scale for number columns
☐ Data bars for risk scores
☐ Icon sets for age buckets
☐ Entire row highlighting by formula

MODULE 7: POWER QUERY
☐ Import CSV via Power Query
☐ Add custom calculated columns
☐ Merge queries (JOIN findings + CMDB)
☐ Refresh auto-updates everything

MODULE 8: DATA VALIDATION
☐ Create dropdown lists for triage
☐ Protect sheet allowing only input columns

MODULE 9: DASHBOARDS
☐ Create pie, bar, line, donut charts from PivotTable
☐ Add text box KPI cards
☐ Connect slicers to multiple PivotTables

MODULE 10: AUDIT PREP
☐ Build formatted audit export table
☐ Add summary statistics section  
☐ Export to PDF
```
