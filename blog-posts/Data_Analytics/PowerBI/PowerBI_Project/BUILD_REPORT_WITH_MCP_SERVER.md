# 🚀 Build a Power BI Report Using MCP Server — Complete Beginner Guide

> **For:** Complete beginners with no prior MCP/Power Query experience
> **Goal:** Create a working Power BI executive dashboard from CSV data + MCP metadata server
> **Time:** ~2 hours total

---

## Table of Contents
1. [What is MCP and why use it?](#what-is-mcp)
2. [Part 1: Set up the MCP Server (Python+Flask)](#part-1-mcp-server)
3. [Part 2: Start Power BI Desktop and connect](#part-2-power-bi-setup)
4. [Part 3: Load data into Power BI](#part-3-load-data)
5. [Part 4: Transform data in Power Query](#part-4-transform-data)
6. [Part 5: Create relationships](#part-5-relationships)
7. [Part 6: Build DAX measures](#part-6-dax-measures)
8. [Part 7: Build report pages](#part-7-report-pages)
9. [Part 8: Publish and refresh](#part-8-publish)

---

## What is MCP?

**MCP (Model Context Protocol)** is a metadata standard. Think of it as a "blueprint" that describes:
- What tables you have (Findings, Assets, Tickets)
- What columns are in each table (name, type, relationships)
- How tables connect together

Instead of manually building this in Power BI, you ask the MCP server "what tables do you have?" and it tells you in JSON format. Then Power BI uses that info to auto-load and connect everything.

**Why use it?**
- Automated schema discovery (no manual clicking for each column)
- Repeatable — run again next month, same structure
- Reduces errors — schema is source of truth

---

# PART 1: Set Up the MCP Server (Python+Flask)

## Step 1.1: Check if Python is installed

Open PowerShell and type:
```powershell
python --version
```

**Expected output:** `Python 3.x.x` (any 3.8+)

**If you see error:** Download Python from https://www.python.org/downloads/
- Install with ✅ "Add Python to PATH"
- Restart PowerShell after install

---

## Step 1.2: Create MCP server directory

In PowerShell, type:
```powershell
cd "c:\Users\gopik\Desktop\New folder\CNAPP\PowerBI_Project"
mkdir mcp
cd mcp
```

This creates folder `PowerBI_Project/mcp/` where we'll put the server code.

---

## Step 1.3: Create `server.py` file

In the `mcp` folder, create a file named `server.py`.

Copy this code into it:

```python
from flask import Flask, jsonify, request
import csv
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# Get the data folder path
DATA_FOLDER = Path(__file__).parent.parent / "data"

# ============================================
# METADATA SCHEMA (answers "what tables exist?")
# ============================================
@app.route("/mcp/model", methods=["GET"])
def get_model():
    """Returns the schema: tables, columns, types, relationships"""
    return jsonify({
        "id": "CNAPP",
        "name": "Cloud Security Posture Dashboard",
        "tables": [
            {
                "name": "Findings",
                "description": "Security findings from Wiz cloud scanning",
                "columns": [
                    {"name": "finding_id", "dataType": "string", "description": "Unique finding ID"},
                    {"name": "severity", "dataType": "string", "description": "CRITICAL, HIGH, MEDIUM, LOW"},
                    {"name": "status", "dataType": "string", "description": "Open or Closed"},
                    {"name": "created_date", "dataType": "date", "description": "When finding was discovered"},
                    {"name": "closed_date", "dataType": "date", "description": "When finding was closed (if closed)"},
                    {"name": "internet_facing", "dataType": "string", "description": "Yes/No"},
                    {"name": "resource_id", "dataType": "string", "description": "Cloud resource identifier"},
                    {"name": "category", "dataType": "string", "description": "Finding category (Network, IAM, Storage, etc)"},
                    {"name": "sla_hours", "dataType": "integer", "description": "SLA target hours for remediation"}
                ]
            },
            {
                "name": "Assets",
                "description": "Cloud assets (servers, databases, storage accounts)",
                "columns": [
                    {"name": "resource_id", "dataType": "string", "description": "Cloud resource ID"},
                    {"name": "asset_name", "dataType": "string", "description": "Human-readable asset name"},
                    {"name": "business_unit", "dataType": "string", "description": "Team that owns this asset"},
                    {"name": "environment", "dataType": "string", "description": "Prod, Staging, Dev"},
                    {"name": "owner", "dataType": "string", "description": "Person responsible for this asset"}
                ]
            },
            {
                "name": "Tickets",
                "description": "ServiceNow tickets for remediation",
                "columns": [
                    {"name": "ticket_id", "dataType": "string", "description": "ServiceNow ticket number"},
                    {"name": "finding_id", "dataType": "string", "description": "Links to Findings table"},
                    {"name": "sla_status", "dataType": "string", "description": "Met, Missed, On Track, Breached"},
                    {"name": "created_date", "dataType": "date", "description": "When ticket was opened"},
                    {"name": "resolved_date", "dataType": "date", "description": "When ticket was resolved"},
                    {"name": "assignment_group", "dataType": "string", "description": "Team assigned to fix"}
                ]
            }
        ],
        "relationships": [
            {"from": "Findings.resource_id", "to": "Assets.resource_id", "type": "Many-to-One"},
            {"from": "Findings.finding_id", "to": "Tickets.finding_id", "type": "One-to-One"}
        ]
    })

# ============================================
# DATA ENDPOINTS (answers "give me the actual data")
# ============================================

@app.route("/mcp/data/Findings", methods=["GET"])
def get_findings_data():
    """Load Findings table from CSV"""
    findings_path = DATA_FOLDER / "wiz_findings.csv"
    if not findings_path.exists():
        return jsonify({"error": f"File not found: {findings_path}"}), 404
    
    data = []
    with open(findings_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Findings", "rowCount": len(data), "data": data[:100]})  # First 100 rows

@app.route("/mcp/data/Assets", methods=["GET"])
def get_assets_data():
    """Load Assets table from CSV"""
    assets_path = DATA_FOLDER / "cmdb_assets.csv"
    if not assets_path.exists():
        return jsonify({"error": f"File not found: {assets_path}"}), 404
    
    data = []
    with open(assets_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Assets", "rowCount": len(data), "data": data[:100]})

@app.route("/mcp/data/Tickets", methods=["GET"])
def get_tickets_data():
    """Load Tickets table from CSV"""
    tickets_path = DATA_FOLDER / "servicenow_tickets.csv"
    if not tickets_path.exists():
        return jsonify({"error": f"File not found: {tickets_path}"}), 404
    
    data = []
    with open(tickets_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    
    return jsonify({"table": "Tickets", "rowCount": len(data), "data": data[:100]})

# ============================================
# HEALTH CHECK & REFRESH
# ============================================

@app.route("/mcp/health", methods=["GET"])
def health():
    """Check if MCP server is alive"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route("/mcp/refresh", methods=["POST"])
def refresh_data():
    """Trigger a data refresh (for Power BI scheduled refresh)"""
    return jsonify({
        "status": "refresh_started",
        "message": "Data refresh triggered. CSV files will be reloaded next query.",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    print("🚀 MCP Server starting...")
    print("📊 Endpoints:")
    print("   GET  http://localhost:5000/mcp/model")
    print("   GET  http://localhost:5000/mcp/data/Findings")
    print("   GET  http://localhost:5000/mcp/data/Assets")
    print("   GET  http://localhost:5000/mcp/data/Tickets")
    print("   GET  http://localhost:5000/mcp/health")
    print("   POST http://localhost:5000/mcp/refresh")
    print("\n💡 Tip: Keep this window open while using Power BI!")
    app.run(port=5000, debug=True)
```

---

## Step 1.4: Install Flask dependency

Still in PowerShell (in `mcp` folder), type:
```powershell
pip install flask
```

Wait for it to complete (should say "Successfully installed").

---

## Step 1.5: Start the MCP server

In PowerShell, type:
```powershell
python server.py
```

**Expected output:**
```
 * Serving Flask app 'server'
 * Running on http://127.0.0.1:5000
```

✅ **Keep this PowerShell window open!** The server must stay running while you use Power BI.

---

## Step 1.6: Test the MCP server

Open a web browser and go to:
```
http://localhost:5000/mcp/model
```

You should see JSON with table schema (Findings, Assets, Tickets).

✅ **Great!** MCP server is working.

---

# PART 2: Power BI Setup

## Step 2.1: Open Power BI Desktop

If not already open, click Start → type "Power BI Desktop" → open it.

Go to **File** → **Open**.

Look for your file (if you already have a PBIX) or click **Create Blank Report**.

For now, create **Blank Report**.

---

## Step 2.2: Get Data from API

In Power BI ribbon, click:
```
Home → Get Data → Web
```

In the dialog box, paste:
```
http://localhost:5000/mcp/data/Findings
```

Click **OK**.

Power BI will ask to authenticate (click **Anonymous**).

Click **Load**.

---

## Step 2.3: Inspect the Findings data

You should see a table appear with columns: `finding_id`, `severity`, `status`, etc.

If you see data, ✅ **connection works!**

---

# PART 3: Load All Three Tables

Repeat the **Get Data → Web** process for:
1. `http://localhost:5000/mcp/data/Assets`
2. `http://localhost:5000/mcp/data/Tickets`

You now have 3 tables loaded into Power BI.

---

# PART 4: Transform Data (Power Query)

Power Query is where you "clean up" your data before putting it into the model.

## Step 4.1: Open Power Query Editor

Click: **Queries** (on the left) or **Home** → **Transform Data**.

---

## Step 4.2: Transform Findings table

In the left panel, click **Findings**.

### Set data types:
- Click column **created_date** → **Transform** → change to **Date**
- Click column **closed_date** → **Transform** → change to **Date**
- Click column **sla_hours** → **Transform** → change to **Whole Number**

### Add a new column: "Days Open"

Right-click the last column → **Insert Column** → **Custom Column**.

Name: `Days Open`

Formula:
```
if [status] = "Open" then Duration.Days(DateTime.LocalNow() - [created_date]) else Duration.Days([closed_date] - [created_date])
```

Click **OK**.

### Add a new column: "SLA Met"

Right-click the last column → **Insert Column** → **Custom Column**.

Name: `SLA Met`

Formula:
```
if [status] = "Closed" then (if Duration.TotalHours([closed_date] - [created_date]) <= [sla_hours] then "Met" else "Missed") else (if Duration.TotalHours(DateTime.LocalNow() - [created_date]) > [sla_hours] then "Breached" else "On Track")
```

---

### Add "Severity Order" (for correct sorting)

Name: `Severity Order`

Formula:
```
if [severity] = "CRITICAL" then 1 else if [severity] = "HIGH" then 2 else if [severity] = "MEDIUM" then 3 else 4
```

---

## Step 4.3: Transform Tickets table

Click **Tickets** in left panel.

### Set data types:
- **created_date** → Date
- **resolved_date** → Date

### Add "Days to Resolve"

Name: `Days to Resolve`

Formula:
```
if [resolved_date] <> null then Duration.Days([resolved_date] - [created_date]) else null
```

---

## Step 4.4: Transform Assets table

Click **Assets** in left panel.

No transformations needed — this is a dimension table. Just verify data types are correct.

---

## Step 4.5: Close Power Query

Click **Close & Apply** (top-left).

Power Query disappears and data loads into Power BI model.

---

# PART 5: Create Relationships

Relationships tell Power BI how tables connect to each other.

## Step 5.1: Open Model view

Click the **diagram icon** (left sidebar) to go to Model view.

You should see 3 table boxes: **Findings**, **Assets**, **Tickets**.

---

## Step 5.2: Create relationship 1 (Findings → Assets)

Click **Findings** table and drag the **resource_id** column onto **Assets** table's **resource_id** column.

A line should appear connecting them.

Right-click the line → **Properties**:
- From: **Findings** → **resource_id**
- To: **Assets** → **resource_id**
- Cardinality: **Many to One**
- Click **OK**

---

## Step 5.3: Create relationship 2 (Findings → Tickets)

Drag **Findings.finding_id** onto **Tickets.finding_id**.

Right-click → **Properties**:
- Cardinality: **One to One**
- Click **OK**

---

## Step 5.4: Create a Date table (for time intelligence)

In Model view, click **Modeling** tab → **New Table**.

Paste this formula:
```dax
DateTable = ADDCOLUMNS(
    CALENDAR(DATE(2024, 1, 1), DATE(2025, 12, 31)),
    "Year", YEAR([Date]),
    "Month", MONTH([Date]),
    "MonthName", FORMAT([Date], "MMM"),
    "YearMonth", FORMAT([Date], "YYYY-MM")
)
```

Click checkmark to save.

---

## Step 5.5: Mark DateTable as a date table

Select the **DateTable** → **Modeling** → **Mark as Date Table** → select **[Date]** column.

Now create a relationship:
Drag **DateTable[Date]** → **Findings[created_date]** (Many to One).

---

# PART 6: Build DAX Measures

DAX is the formula language for Power BI. Measures are calculated fields.

## Step 6.1: Create a Measures table

In Model view, click **Modeling** → **New Table**.

Paste:
```dax
Measures = ROW("x", 0)
```

Then delete the "x" column (right-click → Delete).

This empty table is just a container for measures.

---

## Step 6.2: Add measures to Measures table

Click **Measures** table → right-click → **New Measure**.

Add each measure one by one:

### Measure 1: Total Findings
```dax
Total Findings = COUNTROWS(Findings)
```

### Measure 2: Open Findings
```dax
Open Findings = CALCULATE(COUNTROWS(Findings), Findings[status] = "Open")
```

### Measure 3: Critical Open
```dax
Critical Open = CALCULATE(COUNTROWS(Findings), Findings[severity] = "CRITICAL", Findings[status] = "Open")
```

### Measure 4: SLA Compliance %
```dax
SLA Compliance % = DIVIDE(CALCULATE(COUNTROWS(Tickets), Tickets[sla_status] = "Met"), COUNTROWS(Tickets), 0) * 100
```

### Measure 5: MTTR (days)
```dax
MTTR Days = DIVIDE(
    SUMX(FILTER(Tickets, NOT(ISBLANK(Tickets[resolved_date]))), DATEDIFF(Tickets[created_date], Tickets[resolved_date], DAY)),
    COUNTROWS(FILTER(Tickets, NOT(ISBLANK(Tickets[resolved_date])))),
    BLANK()
)
```

### Measure 6: Internet-Facing Criticals
```dax
Internet Facing Critical = CALCULATE(COUNTROWS(Findings), Findings[internet_facing] = "Yes", Findings[severity] = "CRITICAL")
```

---

# PART 7: Build Report Pages

Now let's create visuals (charts, tables, cards).

## Step 7.1: Go to Report view

Click the **chart icon** (left sidebar) to go to Report view.

---

## Step 7.2: Create Page 1 (Executive Summary)

### Add Title

Click **Insert** → **Text Box** → type **Executive Security Dashboard**.

---

### Add KPI Cards

**Card 1: Total Findings**
- Click **Insert** → **Card**
- Drag **Measures[Total Findings]** to the card
- You should see the number appear (e.g., "50")

**Card 2: Open Findings**
- Add another Card
- Drag **Measures[Open Findings]**

**Card 3: Critical Open**
- Add another Card
- Drag **Measures[Critical Open]**

**Card 4: SLA Compliance %**
- Add another Card
- Drag **Measures[SLA Compliance %]**

Arrange cards horizontally at the top.

---

### Add a Bar Chart: Findings by Severity

- Click **Insert** → **Bar Chart**
- Drag **Findings[severity]** to Axis
- Drag **Measures[Total Findings]** to Value
- Title: "Findings by Severity"

---

### Add a Table: Top Open Findings

- Click **Insert** → **Table**
- Drag columns: **finding_id**, **severity**, **status**, **Days Open**
- Filter to show only `status = "Open"` and sort by `Days Open` descending
- Title: "Top 10 Oldest Open Findings"

---

## Step 7.3: Create Page 2 (Operational)

Click the **+** icon to add a new page.

### Add Trend Line: Open vs Closed over time

- Click **Insert** → **Line Chart**
- Drag **DateTable[YearMonth]** to Axis
- Drag **Measures[Open Findings]** to Values (creates one line)
- Drag **Measures[Closed Findings]** to Values (creates second line)
- Title: "Findings Trend"

### Add Matrix: SLA Status by Assignment Group

- Click **Insert** → **Matrix**
- Rows: **Tickets[assignment_group]**
- Columns: **Tickets[sla_status]**
- Values: **Measures[Total Findings]** (count)

### Add Gauge: SLA Compliance %

- Click **Insert** → **Gauge Chart**
- Value: **Measures[SLA Compliance %]**
- Minimum Value: 0, Target: 100
- Title: "SLA Compliance Target"

---

## Step 7.4: Create Page 3 (Risk Analysis)

Click **+** to add a new page.

### Add Scatter Plot: Internet-Facing vs Severity

- Click **Insert** → **Scatter Chart**
- X Axis: **Findings[Days Open]**
- Y Axis: **Findings[Severity Order]** (so CRITICAL at top)
- Legend: **Findings[internet_facing]**
- Title: "Risk Exposure: Internet-Facing + Age"

---

# PART 8: Publish and Use

## Step 8.1: Save locally

**File** → **Save** → Save as `CSPM_MCP_Report.pbix` in your `PowerBI_Project` folder.

---

## Step 8.2: Publish to Power BI Service (optional)

**File** → **Publish** (requires Power BI Pro account and internet).

Select your workspace → **Select**.

---

## Step 8.3: Set up refresh

For your MCP server to refresh data:

**Home** → **Refresh** (to manually refresh)

For **automatic refresh**: 
- Publish to Power BI Service
- Settings → **Dataset settings** → **Scheduled refresh**
- Set frequency (e.g., daily at 6 AM)

---

# 📋 Troubleshooting

## Problem: "Unable to connect to localhost:5000"
**Solution:** 
- Check MCP server is still running in PowerShell
- Verify no other app is using port 5000
- Try `http://127.0.0.1:5000/mcp/health` in browser

## Problem: "Column not found" in Power Query
**Solution:**
- Check CSV file headers match exactly (case-sensitive)
- Verify CSV files are in `PowerBI_Project/data/` folder

## Problem: Relationships don't appear in Model view
**Solution:**
- Check columns have same data type (both text, both date, etc.)
- Drag carefully from one column header to the other

## Problem: DAX formula gives error
**Solution:**
- Copy formula exactly as shown (including brackets and commas)
- Click outside measure formula box to save

---

# 🎉 You're Done!

You now have a working Power BI report built with MCP metadata + data.

**Next steps:**
1. Keep MCP server running for live data
2. Add more pages/visuals as needed
3. Share report link with team
4. Set up automatic refresh schedule

Congratulations! 🚀

