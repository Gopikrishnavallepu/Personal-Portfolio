# 📊 Complete Excel Tutorial for Data Analysis — From Zero to Dashboard

> **What you'll learn:** Excel basics → Power Query → 20+ formulas → Pivot Tables → Interactive Dashboard
> **Data used:** Employee HR dataset + Call center dataset (1,000 records)
> **Level:** Beginner to Advanced | **Estimated time:** 4-5 hours hands-on

---

# TABLE OF CONTENTS

| # | Section | Key Skills |
|---|---------|-----------|
| 1 | [Excel Basics](#part-1-excel-basics) | Filters, sorting, duplicates, conditional formatting, auto-sum |
| 2 | [Power Query](#part-2-power-query) | Web scraping, file connections, transformations, M language |
| 3 | [Formulas & Functions](#part-3-excel-formulas--functions) | COUNTIFS, SUMIFS, FILTER, VLOOKUP, XLOOKUP, INDEX MATCH |
| 4 | [Pivot Tables & Charts](#part-4-pivot-tables-slicers--charts) | 10 analysis themes, slicers, conditional formatting, grouping |
| 5 | [Portfolio Dashboard](#part-5-portfolio-dashboard-project) | Power Pivot, DAX measures, interactive charts, slicer-driven dashboard |

---

# PART 1: EXCEL BASICS

## 1.1 The Excel Interface

When you open a blank Excel file, the screen is divided into **3 main areas**:

```
┌──────────────────────────────────────────────────────────┐
│  RIBBON (Home, Insert, Data, etc.)                        │ ← All buttons/tools
├──────────────────────────────────────────────────────────┤
│                                                          │
│  GRID AREA                                               │
│  ├── Columns: A, B, C, D, E...                          │
│  ├── Rows: 1, 2, 3, 4, 5...                             │
│  └── Cell = intersection of row + column (e.g., B3)     │
│                                                          │
│  The grid is divided into SHEETS (tabs at the bottom)    │
│  Click [+] to add more sheets                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  STATUS BAR (bottom) — shows count, sum, zoom control    │
└──────────────────────────────────────────────────────────┘
```

**Key concept:** A **cell** is where you put values — numbers, text, images, or formulas.

---

## 1.2 Filtering Data

Filtering lets you **view a subset** of your data based on conditions.

### How to Apply Filters

```
Step 1: Select all data
        → Ctrl+A (select all)
        → OR Ctrl+Shift+8 (select contiguous data)

Step 2: Home ribbon → Sort & Filter → Filter
        → Shortcut: Ctrl+Shift+L

Step 3: Click the dropdown arrow (▼) on any column header
        → Check/uncheck values to filter
```

### Filter Types

| Filter Type | How to Use | Example |
|------------|-----------|---------|
| **Single value** | Uncheck "Select All", check one value | Show only "Chennai" employees |
| **Multiple values** | Check multiple items | Show "Chennai" + "Wellington" |
| **Multi-column** | Apply filters on different columns | Location = Chennai AND Gender = Female |
| **Number filter** | Column ▼ → Number Filters → Greater Than | Salary > $80,000 |
| **Date filter** | Column ▼ → Date Filters → Last Month/Quarter/Year | Employees joined last quarter |
| **Top N** | Column ▼ → Number Filters → Top 10 | Show top 10 salaries |
| **Right-click** | Right-click a cell → Filter → By selected cell value | Quick filter on any value |

### Clearing Filters

```
Clear ONE column:  Click column ▼ → Clear Filter from [column name]
Clear ALL columns: Home → Sort & Filter → Clear
                   OR: Alt → H → S → C (keyboard sequence)
```

> **Pro Tip:** Press **Alt** briefly to see keyboard shortcuts for every ribbon button. Then press the letter sequence to reach any button without using the mouse.

---

## 1.3 Sorting Data

Sorting arranges your data in ascending or descending order.

```
Single-level sort:
  Click column header ▼ → Sort Smallest to Largest (or A to Z)

Multi-level sort (e.g., Gender first, then Salary within gender):
  Home → Sort & Filter → Custom Sort
  → Level 1: Sort by Gender (A to Z)
  → Level 2: Then by Salary (Smallest to Largest)
```

---

## 1.4 Finding Duplicates with Conditional Formatting

```
Step 1: Select the column you want to check (e.g., Employee ID)
        → Ctrl+Shift+Down Arrow (to select entire column)

Step 2: Home → Conditional Formatting → Highlight Cell Rules → Duplicate Values

Step 3: Click OK → all duplicates highlighted in pink

Step 4: To FILTER the duplicates:
        Apply filter → Column ▼ → Filter by Color → select the pink color
        → Now you see only the duplicate rows

Step 5: To REMOVE the highlighting:
        Select cells → Home → Conditional Formatting → Clear Rules → From Selected Cells
```

> **Why this matters:** Duplicate employee IDs with different names = data quality issue. This technique helps you catch them instantly.

---

## 1.5 Quick Summary with Auto-Sum

```
To calculate totals at the bottom of a column:

Step 1: Select the column (Ctrl+Shift+Down Arrow)
Step 2: Press Alt+= (Auto-Sum shortcut)
        → Excel writes =SUM(...) and adds the total below the column

Works for: Salary totals, FTE counts, numeric columns
Does NOT work for: Text columns (use COUNTA instead for counting text)

To examine a formula: Select the cell → press F2 (edit mode)
```

---

# PART 2: POWER QUERY

## 2.1 What is Power Query?

```
Power Query = Data Cleaning + Data Transformation software

✅ Comes built into Excel 2016+ and Power BI
✅ Steps are RECORDED — run them again on new data with one click
✅ Works with: Web pages, Excel files, CSV, text files, PDFs, SQL, SharePoint
✅ Same approach in Excel and Power BI

WHERE TO FIND IT: Data ribbon → Get & Transform Data section
```

## 2.2 Power Query Interface

```
┌──────────────────────────────────────────────────────────────┐
│  RIBBON: Home | Transform | Add Column | View                 │
├──────────┬─────────────────────────────────┬─────────────────┤
│          │                                 │                 │
│  QUERIES │  DATA PREVIEW                   │  APPLIED STEPS  │
│  LIST    │  (shows your data)              │  (what you did) │
│          │                                 │                 │
│  List of │  Each column shows:             │  Source          │
│  all     │  - Column name + type icon      │  Navigation     │
│  queries │  - Green bar = data quality     │  Promoted Headers│
│          │    (% valid / empty / error)    │  Changed Type   │
│          │                                 │  Replaced Value │
│          │                                 │  ...            │
│          │                                 │                 │
│          │  Formula bar: shows M code      │  ⚙ = edit step  │
│          │  for selected step              │  ✕ = delete step│
├──────────┴─────────────────────────────────┴─────────────────┤
│  Enable formula bar: View → check "Formula Bar"              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2.3 Example 1: Web Scraping (Wikipedia Medal Table)

### Step-by-Step

```
1. CONNECT TO WEB
   Data ribbon → From Web → paste URL → OK
   → Navigator screen shows all HTML tables on the page
   → Select the table you want
   → Click "Transform Data" (not "Load" — we want to clean first)

2. PROMOTE HEADERS
   Home → Use First Row as Headers
   → The first data row becomes column headers

3. RENAME COLUMNS
   Double-click any column header → type new name
   Example: Rename "No" → "Country"

4. REPLACE VALUES
   Right-click column → Replace Values
   → Find: *  (asterisk after "Japan" for host nation)
   → Replace with: (nothing)
   → Click OK

5. FILL DOWN (fix merged cells)
   Select the Rank column → Transform → Fill → Down
   → Fills blank cells with the value from the cell above
   → Fixes shared-rank rows where Wikipedia merged cells

6. CHANGE DATA TYPES
   Select columns (Gold, Silver, Bronze, Total) → Right-click → Change Type → Whole Number

7. ADD CALCULATED COLUMN
   Select Gold column → hold Ctrl → select Total column
   → Add Column → Standard → Divide
   → Right-click new column → Change Type → Percentage
   → Now you see gold medals as % of total

8. FILTER OUT TOTALS ROW
   Click Rank column ▼ → uncheck the "Totals" row → OK

9. RENAME QUERY
   Double-click query name in left panel → type "Medals"

10. LOAD TO EXCEL
    Home → Close & Load
    → Data appears as a live, refreshable table in Excel
```

### Key Concept: Dynamic Connection

```
The Power Query connection is LIVE:
  → Right-click the table → Refresh
  → OR: Query ribbon → Refresh
  → Excel re-runs ALL steps against the source and updates data

This means: If the website changes, your Excel updates too!
```

---

## 2.4 Example 2: Local File Connection (Staff Data)

### Common Data Problems & Fixes

| Problem | Power Query Fix | How |
|---------|---------------|-----|
| Wrong headers | Promote first row | Home → Use First Row as Headers |
| Extra spaces in names | Trim | Select column → Transform → Format → Trim |
| `null` in Gender column | Replace values | Right-click → Replace Values → null → "Missing" |
| `???` in Department | Replace values | Right-click → Replace → `???` → "Engineering" |
| Zero/null salary (inactive) | Filter | Click Salary ▼ → uncheck null and 0 |
| Inconsistent dates | Change type | Right-click → Change Type → Date |
| Full name → First + Last | Split column | Transform → Split Column → By Delimiter (Space) |

### Adding Calculated Columns

```
SALARY BUCKET (using Conditional Column):
  Add Column → Conditional Column
  Name: Salary Bucket
  Rules:
    IF Salary < 50000    THEN "Under 50K"
    IF Salary < 100000   THEN "50K to 100K"
    ELSE                      "Above 100K"

EMPLOYEE TENURE (using Date functions):
  Select Start Date → Add Column → Date → Age
  → Gives days since start date
  → Transform → Duration → Total Years
  → Now you see years of service (e.g., 5.61 years)

EMPLOYEE WORK TYPE (using Custom Column):
  Add Column → Custom Column
  Name: Employee Work Type
  Formula: if [FTE] = 1 then "Full Time" else "Part Time"
```

### Editing & Managing Steps

```
Every step you do is recorded in "Applied Steps":

⚙ (gear icon)  = Edit that step's parameters
✕ (x icon)     = Delete that step entirely

Example: If file path changes:
  → Click ⚙ on "Source" step → Browse to new file → OK
  → All subsequent steps replay automatically on the new file!

TO REFRESH after source data changes:
  Right-click the table in Excel → Refresh
  → Power Query replays ALL steps on the updated source file
```

---

# PART 3: EXCEL FORMULAS & FUNCTIONS

## 3.1 Business Problem 1: Total Salary & Head Count by Department

### COUNTIFS — Count with Conditions

```
=COUNTIFS(Staff[Department], B3)

┌─ WHAT: Counts rows where Department matches the value in B3
├─ Staff[Department] = the criteria range (which column to check)
└─ B3 = the criteria value (what to look for — e.g., "Training")

DRAG DOWN to get counts for all departments.

EXCEL 365 TRICK (spilling): Instead of B3, use the entire range B3:B14
  → Formula automatically spills ALL department counts at once!
```

### SUMIFS — Sum with Conditions

```
=SUMIFS(Staff[Salary], Staff[Department], B3:B14)

┌─ WHAT: Adds up salaries where Department matches
├─ Staff[Salary] = what to sum (the numbers)
├─ Staff[Department] = criteria range
└─ B3:B14 = criteria values (all department names)

Multi-criteria version (permanent staff only):
=COUNTIFS(Staff[Department], B3, Staff[Employee Type], "Permanent")
```

### AVERAGEIFS — Average with Conditions

```
=AVERAGEIFS(Staff[Salary], Staff[Department], B3:B14)

Result: Training = $83,400 avg | Engineering = $81,000 | Marketing = $64,000
```

---

## 3.2 Business Problem 2: Filter Employees by Salary

### FILTER Function (Excel 365)

```
Basic: All employees with salary > 100K
=FILTER(Staff, Staff[Salary] > 100000)

With input cell (dynamic threshold):
=FILTER(Staff, Staff[Salary] > F67)
→ Change F67 from 100000 to 115000 = instantly fewer results

Select specific columns only:
=CHOOSECOLS(FILTER(Staff, Staff[Salary] > F67), 1, 2, 3, 5, 6)
→ Returns columns 1,2,3,5,6 (skips column 4)

Add headers:
=CHOOSECOLS(Staff[#Headers], 1, 2, 3, 5, 6)
→ Staff[#Headers] returns the column names of the table
```

### Multiple Conditions in FILTER

```
Female employees with salary > 100K:
=FILTER(Staff, (Staff[Salary] > F67) * (Staff[Gender] = "Female"))

┌─ Each condition gets its own parentheses
├─ Multiply (*) conditions together = AND logic
└─ Add (+) conditions = OR logic

Three conditions (Female, >100K, joined 2020+):
=FILTER(Staff,
    (Staff[Salary] > 100000) *
    (Staff[Gender] = "Female") *
    (YEAR(Staff[Start Date]) >= 2020)
)
```

### Continuous Column Range Syntax

```
Instead of CHOOSECOLS for continuous columns (1-6), use:
=FILTER(Staff[[Employee ID]:[Salary]],
    (Staff[Salary] > 100000) * (Staff[Gender] = "Female"))

Staff[[Employee ID]:[Salary]] = all columns from Employee ID to Salary
→ Cleaner than CHOOSECOLS when columns are contiguous
```

---

## 3.3 Business Problem 3: MIN, MAX, LARGE, SORT+TAKE

### Basic Min/Max

```
Lowest salary:   =MIN(Staff[Salary])          → $28,600
Highest salary:  =MAX(Staff[Salary])          → $120,000
```

### Top 5 Salaries with LARGE

```
=LARGE(Staff[Salary], 1)   → 1st highest = $120,000
=LARGE(Staff[Salary], 2)   → 2nd highest = $120,000
=LARGE(Staff[Salary], 3)   → 3rd highest
...

Pro tip: Put numbers 1-5 in a helper column (e.g., G2:G6)
Then: =LARGE(Staff[Salary], G2) and drag down
```

### Top 5 with SORT + TAKE (Excel 365)

```
=TAKE(SORT(Staff[Salary], , -1), 5)

┌─ SORT(Staff[Salary], , -1) = sort descending (-1)
├─ TAKE( ... , 5) = take first 5 rows from the sorted result
└─ Dynamic: Change 5 to any number, or link to a cell

Even more dynamic:
=TAKE(SORT(Staff[Salary], , -1), I12)
→ Change I12 from 5 → 10 → 8 = different number of results
```

### Gender-Specific Min/Max (MINIFS, MAXIFS)

```
Lowest male salary:   =MINIFS(Staff[Salary], Staff[Gender], "Male")
Highest female salary: =MAXIFS(Staff[Salary], Staff[Gender], "Female")

Top 5 male salaries (FILTER + LARGE):
=LARGE(FILTER(Staff[Salary], Staff[Gender] = "Male"), {1,2,3,4,5})

Or using SORT+TAKE on filtered data:
=TAKE(SORT(FILTER(Staff[Salary], Staff[Gender] = "Male"), , -1), 5)
```

---

## 3.4 Business Problem 4: List Unique Departments

### UNIQUE + SORT

```
All departments (deduplicated):
=UNIQUE(Staff[Department])                → 12 departments

Alphabetically sorted:
=SORT(UNIQUE(Staff[Department]))          → Accounting to Training

Count of departments:
=COUNTA(B4#)
→ B4# = the "spill range" starting at B4 (auto-expands!)
→ The # operator references everything a spilled formula produced
```

### The Hash (#) Operator

```
When a formula "spills" results (like UNIQUE, FILTER, SORT):
  =B4#   references the ENTIRE spilled range
  → If UNIQUE returns 12 items, B4# = B4:B15
  → If UNIQUE grows to 13 items, B4# = B4:B16 (auto-adjusts!)

Use B4# inside other formulas:
  =COUNTA(B4#)        → count the spilled values
  =TEXTJOIN(", ", TRUE, B4#)  → comma-separated list in ONE cell
```

---

## 3.5 Business Problem 5: Lookups (VLOOKUP, INDEX MATCH, XLOOKUP)

### VLOOKUP

```
=VLOOKUP(C4, Staff, 2, FALSE)

┌─ C4 = lookup value (employee ID to find)
├─ Staff = table to search (looks in FIRST column only!)
├─ 2 = column number to return (2 = first name, 3 = last name, etc.)
└─ FALSE = exact match (ALWAYS use FALSE, never omit this!)

LIMITATIONS:
  ❌ Can only look up in the FIRST column of the table
  ❌ No built-in "not found" handling — use IFERROR wrapper:
     =IFERROR(VLOOKUP(C4, Staff, 2, FALSE), "Not Found")
```

### INDEX MATCH

```
=INDEX(Staff[Employee ID], MATCH("Scard", Staff[Last Name], 0))

MATCH: Finds the ROW POSITION of "Scard" in the Last Name column
  → Result: 43 (Scard is the 43rd person)

INDEX: Returns the value at that position from another column
  → INDEX(Staff[Employee ID], 43) = the Employee ID of person #43

ADVANTAGE over VLOOKUP:
  ✅ Can look up in ANY column (not just the first)
  ✅ More flexible for complex scenarios
```

### XLOOKUP (Recommended — Excel 365)

```
=XLOOKUP(C4, Staff[Employee ID], Staff[First Name], "Not Found")

┌─ C4 = what to search for
├─ Staff[Employee ID] = where to search (lookup array)
├─ Staff[First Name] = what to return (return array)
└─ "Not Found" = optional error message (no IFERROR needed!)

ADVANTAGES over VLOOKUP/INDEX MATCH:
  ✅ Lookup in ANY column (not limited to first column)
  ✅ Built-in "if not found" parameter
  ✅ Can return MULTIPLE columns at once
  ✅ Cleaner syntax — one function does it all
```

### XLOOKUP Advanced Tricks

```
Return full name (combine columns in return):
=XLOOKUP(MAX(Staff[Salary]), Staff[Salary],
    Staff[First Name] & " " & Staff[Last Name])
→ Returns: "Minerva Ricardot" (the highest-paid employee)

Return ENTIRE ROW:
=XLOOKUP("Tuxwell", Staff[Last Name], Staff)
→ Returns all columns for that person, horizontally

Transpose to vertical:
=TRANSPOSE(XLOOKUP("Tuxwell", Staff[Last Name], Staff))
→ Same data, but laid out vertically (one field per row)
```

---

## 3.6 Business Problem 6: Finding Highest-Paid Person by Name

### Combining XLOOKUP + MAX

```
First person with highest salary:
=XLOOKUP(MAX(Staff[Salary]), Staff[Salary],
    Staff[First Name] & " " & Staff[Last Name])
→ "Minerva Ricardot"

ALL people with highest salary (in case of ties):
=FILTER(Staff[First Name] & " " & Staff[Last Name],
    Staff[Salary] = MAX(Staff[Salary]))
→ "Minerva Ricardot" and "Mick Praberry" (both at $120K)

Comma-separated in ONE cell:
=TEXTJOIN(", ", TRUE,
    FILTER(Staff[First Name] & " " & Staff[Last Name],
        Staff[Salary] = MAX(Staff[Salary])))
→ "Minerva Ricardot, Mick Praberry"
```

---

## 3.7 Business Problem 7: Employees Joined in March

### Using MONTH() Inside FILTER

```
All employees who joined in March (any year):
=FILTER(Staff[[Employee ID]:[Last Name]],
    MONTH(Staff[Start Date]) = 3)

Employees who joined since 2020:
=FILTER(Staff, Staff[Start Date] >= DATE(2020, 1, 1))

Names starting with "H":
=FILTER(Staff, LEFT(Staff[First Name], 1) = "H")
```

---

## 3.8 Business Problem 8: Department Report with Data Bars

### Percentage Difference from Average

```
Average salary per department:
=AVERAGEIFS(Staff[Salary], Staff[Department], B6#)

Difference from overall average:
=D6# - D3    (D6# = department averages, D3 = overall average)
→ Positive = above average, Negative = below average

Conditional formatting with DATA BARS:
  1. Select the difference column
  2. Home → Conditional Formatting → Data Bars → Solid Fill
  3. Click the tiny icon → "All cells showing 'Difference' values"
  4. Edit Rule: Show Bar Only = YES
  5. Add a separate column: =E6# (duplicates the values for readability)
```

### MAXIFS — Highest Salary per Department

```
=MAXIFS(Staff[Salary], Staff[Department], B6#)
```

---

# PART 4: PIVOT TABLES, SLICERS & CHARTS

## 4.1 Data Preparation

```
ALWAYS convert raw data to a TABLE before creating pivots:

Step 1: Select any cell in the data
Step 2: Ctrl+T → click OK
Step 3: Table Design → rename table (e.g., "Calls")
Step 4: Insert → Pivot Table → New Worksheet → OK
```

## 4.2 The Pivot Table Interface

```
┌──────────────────────────────────────────────────────────┐
│  PIVOT TABLE FIELDS (right panel)                         │
│                                                          │
│  FIELD LIST (top)                                        │
│  ☑ Call Number                                           │
│  ☐ Customer ID                                           │
│  ☐ Duration                                              │
│  ☐ Representative                                        │
│  ☐ Purchase Amount                                       │
│                                                          │
│  AREAS (bottom — drag fields here)                       │
│  ┌────────────┐  ┌────────────┐                         │
│  │  FILTERS   │  │  COLUMNS   │  → across the screen    │
│  └────────────┘  └────────────┘                         │
│  ┌────────────┐  ┌────────────┐                         │
│  │   ROWS     │  │   VALUES   │  → counted/summed/avg   │
│  └────────────┘  └────────────┘                         │
│                                                          │
│  Rows = labels going DOWN the screen                     │
│  Columns = labels going ACROSS the screen                │
│  Values = the NUMBERS (counts, sums, averages)           │
│  Filters = report-level filters (dropdown at top)        │
└──────────────────────────────────────────────────────────┘
```

---

## 4.3 The 10 Analysis Themes

### Theme 1: Calls by Customer

```
ROWS:    Customer ID
VALUES:  Count of Call Number

→ Shows how many calls each customer made (e.g., Customer 4 = 82 calls)
```

### Theme 2: Customer Satisfaction

```
Add Satisfaction Rating to VALUES
→ Default: Sum (ridiculous — "249" total satisfaction)
→ Fix: Right-click number → Summarize Values By → Average
→ Fix decimals: Right-click → Number Format → Number → 1 decimal

Result: Average rating per customer, overall average = 3.9
```

### Theme 3: Top 10 Customers (Value Filters + Slicers)

```
ROWS:    Customer ID
VALUES:  Sum of Purchase Amount

Apply Top 10 filter:
  Click Customer ID ▼ → Value Filters → Top 10 → OK
  Right-click → Sort → Largest to Smallest

Add report-level filter:
  Drag Representative to FILTERS area
  → Filter dropdown appears above pivot
  → Select specific rep to see THEIR top 10

SLICERS (better than report filters!):
  Right-click Representative → Add as Slicer
  → Click buttons to filter interactively
  → Ctrl+Click for multi-select
  → Linked to pivot charts too!
```

### Theme 4: Interactive Pivot Chart

```
Step 1: Select any pivot cell
Step 2: Insert → Column Chart
Step 3: The chart is MARRIED to the pivot table:
        → Change the slicer = chart updates
        → Expand/collapse pivot rows = chart updates
        → Filter the pivot = chart filters too
```

### Theme 5: Call Duration Analysis (Grouping)

```
ROWS:    Duration
VALUES:  Count of Call Number

Manual grouping:
  Select range of values (e.g., 2-10) → Right-click → Group
  Repeat for 10-30, 30-60, 60-120, 120+

⚠️ PROBLEM with manual grouping:
  If new data has a value NOT in any group (e.g., 9),
  it creates its OWN separate group!

✅ BETTER APPROACH: Use formulas in source data:
  =IFS(Duration<=10, "Under 10 min",
       Duration<=30, "10-30 min",
       Duration<=60, "30-60 min",
       Duration<=120, "1-2 hours",
       TRUE, "More than 2 hours")
  → Always works, even with new data values
```

### Theme 6: Monthly Call Trends (Date Grouping)

```
ROWS:    Date of Call → Excel auto-groups by Month
VALUES:  Count of Call Number

Date auto-grouping:
  → Excel adds: Years, Quarters, Months, Days as fields
  → Click [+] on any month to expand to daily detail
  → Pivot chart updates when you expand/collapse

Add line chart:
  Insert → Line Chart → see call volume trends over the year
  → Jan/Feb slow, March-May peak, October-November peak
```

### Theme 7: Year-to-Date Running Totals

```
VALUES:  Sum of Purchase Amount
→ Right-click → Show Values As → Running Total In → Month
→ December shows $96,000 (cumulative total)

Add area chart to visualize the S-curve of revenue accumulation.

Financial Year (FY) calculation:
  Add column in source data:
  =IF(MONTH(Date) <= 6, YEAR(Date), YEAR(Date) + 1)
  → Refresh pivot → use FY as a Row field above Month
  → Running total resets at FY boundary (July → new FY)
```

### Theme 8: Busiest Day of Week (Heatmap)

```
COLUMNS: Day of Week (from =TEXT(Date, "DDDD"))
ROWS:    Representative
VALUES:  Count of Call Number

Show as percentages:
  Right-click → Show Values As → % of Row Total

Apply heatmap:
  Home → Conditional Formatting → Color Scales → Green-Red
  → Click the tiny icon → select "All cells showing Values"
  → Instantly see: Saturday is consistently busiest day

INSIGHT: Tell boss "Saturday is our peak day — customers
are free on weekends and call us more."
```

### Theme 9: Duration vs Satisfaction (Cross-Analysis)

```
ROWS:    Duration Bucket
COLUMNS: Rating Rounded (0-5)
VALUES:  Count of Call Number

REORDER rows manually:
  Click on "Under 10 min" → place cursor on cell border
  → Drag to correct position (top)
  
Apply conditional formatting to spot patterns:
  → Shorter calls = higher satisfaction %
  → Conclusion: "Keep calls quick and to-the-point"
```

### Theme 10: Staffing Recommendations

```
ROWS:    Representative
COLUMNS: Month
VALUES:  Count of Call Number

Apply data bars:
  → Spot months where a rep has 2x their normal volume
  
Example insight:
  "R02 gets ~20 calls/month normally but spikes to 40 in March/April.
   Recommend temp support for R02 during Q1 peak."
```

---

# PART 5: PORTFOLIO DASHBOARD PROJECT

## 5.1 Project Overview

```
BUILD THIS: An interactive Call Center Performance Dashboard

FEATURES:
├── Slicer to select representatives (with photos!)
├── KPI cards: Total calls, selected calls, amount, duration, rating
├── Bar chart: Calls by representative (selected one highlighted)
├── Bar chart: Revenue by representative
├── Customer table by city/region
├── Dynamic — all visuals update when slicer selection changes
```

## 5.2 Data Setup

```
TWO TABLES:
├── Calls table (1,000 rows): Call#, Customer, Duration, Rep, Date,
│   Purchase Amount, Rating, FY, Day of Week, Duration Bucket, Rating Rounded
│
└── Customers table (15 rows): Customer ID, Gender, Age, City
    (Cities: Columbus, Cincinnati, Cleveland)

ASSETS TAB: Representative photos (stock images from Excel)
```

## 5.3 Step 1: Color Theme & Fonts

```
Page Layout → Colors → select "Slipstream"
Page Layout → Fonts → select "Aptos ExtraBold + Aptos"
  (Or customize: Page Layout → Fonts → Customize Fonts)

WHY DO THIS FIRST:
  All subsequent tables, charts, and formatting will inherit
  these choices automatically. Saves massive formatting time later.
```

## 5.4 Step 2: Set Up Pivot Tables Using Data Model

```
SELECT any cell in Calls table
→ Insert → Pivot Table
→ ☑ CHECK "Add this data to the Data Model"  ← IMPORTANT!
→ New Worksheet → OK
→ Rename sheet as "Pivots"

WHY Data Model:
  Enables relationships between multiple tables (Calls + Customers)
  Enables DAX measures (powerful calculated fields)
  Enables Power Pivot features
```

### Create Table Relationship

```
Pivot Table Analyze → Relationships → New

Table:         Calls
Column:        Customer ID
Related Table: Customers
Related Column: Customer ID

→ Now fields from BOTH tables appear in the pivot field list
→ Use "All" tab to see both Calls and Customers fields
```

## 5.5 Step 3: Create DAX Measures

DAX (Data Analysis Expressions) is the formula language for Power Pivot. Unlike regular formulas, DAX measures live **inside the data model** and automatically respect slicer/filter context.

### How to Add a Measure

```
In the PivotTable Fields list:
  Right-click on table name (e.g., "Calls") → Add Measure
  → Give it a name
  → Write the DAX formula
  → Set number format
  → Click OK
  → The measure appears in the field list (with a tiny calculator icon)
```

### The 5 Essential Measures

```dax
// MEASURE 1: Call Count
Call Count = COUNTROWS(Calls)
Format: Number, 0 decimals, use thousands separator

// MEASURE 2: Total Amount
Total Amount = SUM(Calls[Purchase Amount])
Format: Currency, 0 decimals

// MEASURE 3: Total Duration
Total Duration = SUM(Calls[Duration])
Format: Number, 0 decimals

// MEASURE 4: Average Rating
Average Rating = AVERAGE(Calls[Satisfaction Rating])
Format: Number, 1 decimal

// MEASURE 5: Five Star Calls
Five Star Calls = CALCULATE(
    [Call Count],
    Calls[Rating Rounded] = 5
)
Format: Number, 0 decimals
```

> **Key concept — CALCULATE:** This function modifies the filter context. `CALCULATE([Call Count], Rating = 5)` means "count rows, but ONLY where rating = 5." This is the most powerful DAX function.

## 5.6 Step 4: Build Pivot Tables

```
PIVOT 1: "Summary Pivot" (overall KPIs)
  VALUES: Call Count, Total Amount, Total Duration, Average Rating, Five Star Calls
  NO ROWS/COLUMNS — just shows one summary row of totals

PIVOT 2: "Rep Pivot" (per-representative KPIs)
  Copy Pivot 1 (Ctrl+C → Ctrl+V)
  Rename as "Rep Pivot"
  Add Representative slicer → connects ONLY to this pivot

PIVOT 3: "Rep-Customer-City Pivot" (for the customer table by city)
  ROWS: City (from Customers table), then Customer ID
  VALUES: Call Count, Total Amount
  Add same Representative slicer connection

PIVOT 4: "Rep Chart Pivot" (for bar charts)
  ROWS: Representative
  VALUES: Call Count, Total Amount
  Connect to same slicer
```

## 5.7 Step 5: Add Slicers & Connect to Multiple Pivots

```
Create slicer:
  Right-click Representative → Add as Slicer

Connect slicer to MULTIPLE pivots:
  Right-click the slicer → Report Connections
  → Check ALL pivot tables you want this slicer to control
  → Now ONE slicer drives ALL pivots simultaneously!

Slicer formatting:
  Slicer → Options → Columns: 5 (show all 5 reps in one row)
  Slicer → Options → customize button height/width
```

## 5.8 Step 6: Build the Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  CALL CENTER PERFORMANCE DASHBOARD          [Rep Photo]       │
│                                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │R01   │ │R02   │ │R03   │ │R04   │ │R05   │  ← SLICER    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │ TOTAL CALLS   │ │ TOTAL AMOUNT  │ │ AVG RATING    │      │
│  │    1,000      │ │   $96,623     │ │    3.9        │      │
│  │ Selected: 214 │ │ Sel: $20,412  │ │  ★★★★☆       │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ CALLS BY REP         │  │ CUSTOMER TABLE BY CITY      │  │
│  │ (Bar chart)          │  │                             │  │
│  │ ████ R01 = 214       │  │ Cincinnati                  │  │
│  │ ████ R02 = 198  ←HL  │  │  C001  42  $4,200          │  │
│  │ ████ R03 = 195       │  │  C005  55  $5,500          │  │
│  │ ████ R04 = 199       │  │ Cleveland                   │  │
│  │ ████ R05 = 194       │  │  C002  38  $3,800          │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐                                    │
│  │ AMOUNT BY REP        │                                    │
│  │ (Bar chart)          │                                    │
│  │ ████ R01 = $20,412   │                                    │
│  └──────────────────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

### Dashboard Construction Steps

```
Step 1: CREATE the dashboard sheet
  → Add new sheet → rename "Call Center Report"
  → Make first two columns narrow (cosmetic margin)
  → Select a large range → fill with light gray background

Step 2: REFERENCE the pivot table values
  → In KPI card cells, use = to reference Summary Pivot values
  → In "Selected" sub-values, reference Rep Pivot values
  → Both pivots use the SAME DAX measures (Call Count, Total Amount, etc.)
  → When slicer changes, Rep Pivot updates → dashboard cards update!

Step 3: CREATE charts from the chart pivot tables
  → Select Rep Chart Pivot → Insert → Bar Chart
  → Move chart to the dashboard sheet
  → Format: remove gridlines, remove legend, add data labels
  → The selected rep's bar is auto-highlighted by the slicer

Step 4: FORMAT the customer table
  → Reference the Rep-Customer-City pivot
  → Add conditional formatting to highlight selected rep's data

Step 5: ADD representative photo
  → Use INDEX to select the correct image based on slicer
  → Or use a formula to swap images dynamically
```

## 5.9 Step 7: Highlighting the Selected Representative

```
TO HIGHLIGHT the selected rep's bar in the chart:

Method: Use a "helper" measure in DAX

// This measure returns the amount ONLY for the selected rep
Selected Rep Amount = CALCULATE(
    [Total Amount],
    ALLSELECTED(Calls[Representative])
)

// Another measure shows amount for ALL reps (ignores slicer)
All Rep Amount = CALCULATE(
    [Total Amount],
    ALL(Calls[Representative])
)

→ Plot BOTH measures as overlapping bars
→ The "Selected" bar appears highlighted (different color)
→ The "All" bar shows the base (lighter color)
```

## 5.10 Step 8: Final Polish

```
FORMATTING CHECKLIST:
  ✅ Remove gridlines: View → uncheck Gridlines
  ✅ Remove headings: View → uncheck Headings
  ✅ Set print area if needed
  ✅ Lock cells to prevent accidental edits
  ✅ Hide the Pivots sheet (right-click tab → Hide)
  ✅ Hide row/column headers
  ✅ Add company logo and title with styled text
  ✅ Use consistent colors from your theme
  ✅ Test all slicer combinations

INTERACTION TESTING:
  → Click each rep → verify ALL visuals update
  → Multi-select reps (Ctrl+Click) → verify aggregation
  → Clear slicer → verify "All" state shows correctly
```

---

# PART 6: FORMULA CHEAT SHEET

## Quick Reference — All Functions Covered

| Category | Function | Syntax | Purpose |
|----------|----------|--------|---------|
| **Counting** | `COUNTIFS` | `=COUNTIFS(range, criteria)` | Count rows matching criteria |
| | `COUNTA` | `=COUNTA(range)` | Count non-empty cells |
| **Summing** | `SUMIFS` | `=SUMIFS(sum_range, criteria_range, criteria)` | Sum values matching criteria |
| | `SUM` | `=SUM(range)` | Sum all values |
| **Averaging** | `AVERAGEIFS` | `=AVERAGEIFS(avg_range, criteria_range, criteria)` | Average matching criteria |
| | `AVERAGE` | `=AVERAGE(range)` | Average all values |
| **Min/Max** | `MIN` / `MAX` | `=MIN(range)` | Smallest / largest value |
| | `MINIFS` / `MAXIFS` | `=MINIFS(range, criteria_range, criteria)` | Min/Max with conditions |
| | `LARGE` | `=LARGE(range, k)` | k-th largest value |
| **Lookup** | `VLOOKUP` | `=VLOOKUP(value, table, col#, FALSE)` | Vertical lookup (first column only) |
| | `INDEX+MATCH` | `=INDEX(return, MATCH(value, lookup, 0))` | Flexible lookup (any column) |
| | `XLOOKUP` | `=XLOOKUP(value, lookup, return, "not found")` | Modern lookup (any direction) |
| **filtering** | `FILTER` | `=FILTER(data, condition)` | Extract rows meeting criteria |
| | `UNIQUE` | `=UNIQUE(range)` | Remove duplicates |
| | `SORT` | `=SORT(range, col, order)` | Sort data (-1 = descending) |
| | `TAKE` | `=TAKE(range, rows)` | First N rows from range |
| | `CHOOSECOLS` | `=CHOOSECOLS(range, col1, col2...)` | Select specific columns |
| **Text** | `TEXTJOIN` | `=TEXTJOIN(", ", TRUE, range)` | Combine text with delimiter |
| | `LEFT` | `=LEFT(text, n)` | First n characters |
| | `TEXT` | `=TEXT(date, "DDDD")` | Format value as text |
| | `TRIM` | `=TRIM(text)` | Remove extra spaces |
| **Date** | `YEAR` / `MONTH` / `DAY` | `=MONTH(date)` | Extract date parts |
| | `DATE` | `=DATE(2020, 1, 1)` | Create a date |
| **Logic** | `IF` | `=IF(condition, true, false)` | Single condition |
| | `IFS` | `=IFS(cond1, val1, cond2, val2...)` | Multiple conditions |
| | `IFERROR` | `=IFERROR(formula, "error msg")` | Handle errors gracefully |
| **Other** | `ROUND` | `=ROUND(number, decimals)` | Round a number |
| | `TRANSPOSE` | `=TRANSPOSE(range)` | Flip rows ↔ columns |

---

## Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Select all data |
| `Ctrl+Shift+L` | Toggle filters on/off |
| `Ctrl+Shift+↓` | Select to bottom of column |
| `Ctrl+Shift+→` | Select to end of row |
| `Ctrl+T` | Convert to table |
| `Ctrl+Shift+8` | Select current region |
| `Alt+=` | Auto-sum |
| `F2` | Edit cell (see formula) |
| `F4` | Toggle absolute reference ($) |
| `Ctrl+Shift+4` | Currency format |
| `Ctrl+Shift+3` | Date format |
| `Ctrl+C / Ctrl+V` | Copy / Paste |
| `Ctrl+S` | Save |
| `Alt` (tap briefly) | Show ribbon shortcuts |
| `Alt+H+S+C` | Clear all filters |

---

## DAX Measures Reference (Power Pivot)

```dax
// Count rows
COUNTROWS(TableName)

// Sum a column
SUM(Table[Column])

// Average a column
AVERAGE(Table[Column])

// Count with filter (THE most powerful DAX function)
CALCULATE(
    [MeasureName],              // What to calculate
    Table[Column] = "Value"     // Filter to apply
)

// Example: Count only 5-star calls
Five Star = CALCULATE([Call Count], Calls[Rating Rounded] = 5)

// Ignore slicer context (show ALL regardless of slicer)
ALL(Table[Column])

// Respect slicer but show selected subset
ALLSELECTED(Table[Column])
```
