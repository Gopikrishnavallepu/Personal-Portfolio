# 🔧 GAP LEARNING NOTES — Part 2: ServiceNow, SQL, and Splunk SPL

> **For:** Wells Fargo Senior Info Security Analyst — CWLS Findings Management
> **Why:** ServiceNow is the ticketing/CMDB backbone, SQL feeds data to dashboards, Splunk is the SIEM

---

# SECTION 1: SERVICENOW — CMDB, Workflows & Ticket Management

## 1.1 What Is ServiceNow and Why FM Teams Use It

```
SERVICENOW IN THE FINDINGS MANAGEMENT WORKFLOW:

Wiz Detection → API/CSV Export → Power BI Dashboard
                      │                     │
                      ▼                     │
              ServiceNow Ticket             │
              ┌─────────────────┐           │
              │ • Finding details│           │
              │ • Asset from CMDB│           │
              │ • Owner (auto)   │           │
              │ • SLA timer      │◄──────────┘ (SLA tracking in PBI)
              │ • Priority       │
              └───────┬─────────┘
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
      Remediate    Exception   Escalate
      (close)      (risk accept)(manager)
```

## 1.2 CMDB (Configuration Management Database) — The Asset Truth

### What CMDB Stores

| CMDB Field | What It Is | Why FM Needs It |
|-----------|-----------|-----------------|
| **CI (Configuration Item)** | Any managed asset (VM, container, app, database) | Match findings to assets |
| **CI Name** | Human-readable name | Identification |
| **CI ID / sys_id** | Unique identifier | API lookups, ticket routing |
| **Owner** | Person or team responsible | Auto-assign tickets |
| **Assignment Group** | ServiceNow group that handles this CI | Ticket routing |
| **Environment** | Production, Staging, Dev, DR | SLA selection |
| **Cloud Account** | Azure subscription / GCP project | Filtering |
| **Application** | Business application this CI belongs to | Ownership mapping |
| **Support Group** | L1/L2/L3 support team | Escalation path |
| **Operational Status** | Active, Retired, Decommissioned | Filter out retired assets |

### CMDB Validation — Your Daily Task

```
CMDB VALIDATION WORKFLOW:

1. EXPORT Wiz findings (CSV or API)
2. MATCH each finding's resource_id against CMDB CI IDs
3. CHECK for:
   ├── ORPHANED ASSETS: Resource exists in Wiz but NOT in CMDB
   │   → Action: Flag to asset management team to register the CI
   │
   ├── STALE CIs: CI exists in CMDB but marked "Active" while
   │   cloud resource is terminated
   │   → Action: Update CMDB status to "Retired"
   │
   ├── WRONG OWNER: CI has an owner who left the company
   │   → Action: Update owner via HR/Manager lookup
   │
   └── MISSING ASSIGNMENT GROUP: CI has no support group
       → Action: Cannot create ticket → flag for CMDB hygiene fix

4. RESULT: Every finding can be routed to the correct owner
```

### Interview Answer — CMDB:
> "CMDB is the foundation of findings management. If I can't map a finding to an owner, I can't assign it, and it sits unresolved. I run weekly CMDB validation: matching Wiz resources against CMDB CIs, flagging orphaned assets, updating stale owners, and ensuring every asset has an assignment group. Clean CMDB = effective ticket routing = timely remediation."

## 1.3 ServiceNow Ticket Lifecycle

```
TICKET LIFECYCLE FOR SECURITY FINDINGS:

NEW ──→ ASSIGNED ──→ IN PROGRESS ──→ RESOLVED ──→ CLOSED
 │         │              │              │            │
 │         │              │              │            └─ Auto-close after
 │         │              │              │               verification scan
 │         │              │              │
 │         │              │              └─ Re-scan confirms fix
 │         │              │                 CNAPP shows finding resolved
 │         │              │
 │         │              └─ Owner working on remediation
 │         │                 SLA timer running
 │         │
 │         └─ Auto-assigned via CMDB lookup:
 │            Finding → resource_id → CMDB CI → Assignment Group
 │
 └─ Created by automation (Wiz webhook / Python script)
    OR manually by FM analyst

SPECIAL STATES:
├── ON HOLD: Waiting for change window / dependency
│   → SLA paused (with approval)
├── EXCEPTION: Risk accepted → formal exception record
│   → Max 90 days, VP sign-off, quarterly review
└── ESCALATED: SLA breached → auto-escalate to manager
```

## 1.4 Ticket Routing Logic

```python
# How ticket routing works (simplified logic):

def route_finding(finding):
    """Route a security finding to the correct ServiceNow assignment group."""

    # Step 1: Look up asset in CMDB
    cmdb_ci = lookup_cmdb(finding['resource_id'])

    if not cmdb_ci:
        return assign_to("Cloud-Security-FM-Team",
                         note="ORPHANED ASSET - not in CMDB")

    # Step 2: Check if assignment group exists
    if not cmdb_ci.get('assignment_group'):
        return assign_to("Cloud-Security-FM-Team",
                         note="NO ASSIGNMENT GROUP in CMDB")

    # Step 3: Determine priority based on severity + environment
    priority = calculate_priority(
        severity=finding['severity'],
        environment=cmdb_ci['environment'],
        exposure=finding.get('internet_facing', False)
    )

    # Step 4: Create ticket
    return create_ticket(
        assignment_group=cmdb_ci['assignment_group'],
        ci=cmdb_ci['sys_id'],
        short_description=f"[{finding['severity']}] {finding['title']}",
        description=finding['remediation_steps'],
        priority=priority,
        sla=get_sla(priority)
    )
```

## 1.5 Change Request Processing

```
WHEN IS A CHANGE REQUEST (CR) NEEDED?

Security finding remediation that:
├── Requires patching a production system → Standard Change
├── Requires firewall/SG rule modification → Normal Change
├── Requires IAM policy change → Normal Change (approval required)
├── Requires application code change → follows team's sprint process
└── Emergency: active exploitation → Emergency Change (expedited approval)

CR WORKFLOW:
1. FM team creates CR linked to the security finding ticket
2. CR includes: what changes, rollback plan, testing plan, impact
3. CAB (Change Advisory Board) reviews and approves
4. Change implemented during approved window
5. Post-implementation: re-scan to verify remediation
6. Close both CR and security finding ticket
```

---

# SECTION 2: SQL — Querying Security Data for Dashboards

## 2.1 Why SQL at Wells Fargo

Power BI connects to databases (SQL Server, PostgreSQL, etc.) where Wiz findings, CMDB data, and ServiceNow tickets are stored. You write SQL to:
- Pull findings data into Power BI
- Create custom views for dashboards
- Run ad-hoc analysis on large datasets
- Build materialized views for performance

## 2.2 Essential SQL for Security Data

### Basic Queries

```sql
-- All open Critical findings
SELECT finding_id, title, resource_id, cloud_provider, created_date
FROM wiz_findings
WHERE severity = 'CRITICAL' AND status = 'Open'
ORDER BY created_date ASC;

-- Findings count by severity
SELECT severity, COUNT(*) as count
FROM wiz_findings
WHERE status = 'Open'
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;
```

### JOINs — Combining Data Sources

```sql
-- Join findings with CMDB to get owners
SELECT
    f.finding_id,
    f.title,
    f.severity,
    f.created_date,
    c.ci_name,
    c.owner,
    c.assignment_group,
    c.environment
FROM wiz_findings f
LEFT JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE f.status = 'Open'
ORDER BY f.severity, f.created_date;

-- Findings WITHOUT a CMDB entry (orphaned assets)
SELECT f.finding_id, f.resource_id, f.cloud_provider, f.title
FROM wiz_findings f
LEFT JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE c.ci_id IS NULL AND f.status = 'Open';
```

### Aggregation — KPI Queries

```sql
-- SLA compliance by team
SELECT
    c.assignment_group AS team,
    COUNT(*) AS total_findings,
    SUM(CASE WHEN f.sla_status = 'On Track' THEN 1 ELSE 0 END) AS on_track,
    ROUND(
        SUM(CASE WHEN f.sla_status = 'On Track' THEN 1 ELSE 0 END) * 100.0
        / COUNT(*), 1
    ) AS sla_compliance_pct
FROM wiz_findings f
JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE f.status = 'Open'
GROUP BY c.assignment_group
ORDER BY sla_compliance_pct ASC;

-- MTTR by severity (closed findings)
SELECT
    severity,
    COUNT(*) AS closed_count,
    ROUND(AVG(DATEDIFF(day, created_date, closed_date)), 1) AS avg_mttr_days,
    MAX(DATEDIFF(day, created_date, closed_date)) AS max_mttr_days,
    MIN(DATEDIFF(day, created_date, closed_date)) AS min_mttr_days
FROM wiz_findings
WHERE status = 'Closed' AND closed_date IS NOT NULL
GROUP BY severity;

-- Monthly trend: opened vs closed
SELECT
    FORMAT(created_date, 'yyyy-MM') AS month,
    COUNT(*) AS opened
FROM wiz_findings
GROUP BY FORMAT(created_date, 'yyyy-MM')

UNION ALL

SELECT
    FORMAT(closed_date, 'yyyy-MM') AS month,
    -COUNT(*) AS closed  -- Negative for visualization
FROM wiz_findings
WHERE closed_date IS NOT NULL
GROUP BY FORMAT(closed_date, 'yyyy-MM')
ORDER BY month;
```

### Advanced — Window Functions

```sql
-- Finding age percentiles by team (how bad is each team's backlog?)
SELECT
    c.assignment_group,
    f.severity,
    DATEDIFF(day, f.created_date, GETDATE()) AS age_days,
    PERCENT_RANK() OVER (
        PARTITION BY c.assignment_group
        ORDER BY DATEDIFF(day, f.created_date, GETDATE())
    ) AS age_percentile
FROM wiz_findings f
JOIN cmdb_assets c ON f.resource_id = c.cloud_resource_id
WHERE f.status = 'Open';

-- Running total of open findings over time
SELECT
    created_date,
    COUNT(*) AS new_findings,
    SUM(COUNT(*)) OVER (ORDER BY created_date) AS running_total
FROM wiz_findings
GROUP BY created_date;
```

---

# SECTION 3: SPLUNK SPL — Security Log Queries

## 3.1 Why Splunk at Wells Fargo

Wells Fargo uses Splunk as their SIEM. The FM team uses Splunk to:
- Correlate Wiz findings with runtime events
- Investigate incidents referenced by findings
- Build alerts for specific cloud misconfigurations
- Create dashboards for SOC visibility

## 3.2 SPL Basics

```spl
// SPL (Search Processing Language) basic structure:
// index=<index> sourcetype=<type> <search terms>
// | command1
// | command2

// Search all Wiz findings ingested into Splunk
index=cloud_security sourcetype=wiz_findings severity="CRITICAL"

// Count findings by severity
index=cloud_security sourcetype=wiz_findings
| stats count BY severity

// Table view with specific fields
index=cloud_security sourcetype=wiz_findings status="Open"
| table finding_id, title, severity, resource_id, created_date
| sort -severity

// Time-based search (last 7 days)
index=cloud_security sourcetype=wiz_findings earliest=-7d latest=now
| timechart span=1d count BY severity
```

## 3.3 SPL for Security Operations

```spl
// SLA compliance dashboard
index=cloud_security sourcetype=wiz_findings status="Open"
| eval age_days = round((now() - strptime(created_date, "%Y-%m-%d")) / 86400, 0)
| eval sla_hours = case(
    severity="CRITICAL", 24,
    severity="HIGH", 168,
    severity="MEDIUM", 720,
    severity="LOW", 2160
)
| eval sla_status = if(age_days * 24 > sla_hours, "Breached", "On Track")
| stats count BY sla_status severity
| sort severity

// Top 10 accounts with most findings
index=cloud_security sourcetype=wiz_findings status="Open"
| stats count AS finding_count BY cloud_account
| sort -finding_count
| head 10

// Correlation: Wiz finding + CloudTrail activity on same resource
index=cloud_security sourcetype=wiz_findings severity="CRITICAL"
| join resource_id [
    search index=aws_cloudtrail eventName="*"
    | rename requestParameters.instanceId AS resource_id
]
| table finding_id, resource_id, eventName, userIdentity.arn, eventTime

// Alert: New Critical finding on internet-facing asset
index=cloud_security sourcetype=wiz_findings severity="CRITICAL" exposure="public"
| where _time > relative_time(now(), "-1h")
| eval alert_message = "CRITICAL finding on public asset: " . title
| sendemail to="security-team@wellsfargo.com"
              subject="[ALERT] New Critical Finding on Public Asset"
```

## 3.4 Key SPL Commands

| Command | What It Does | Example |
|---------|-------------|---------|
| `stats` | Aggregate data | `stats count BY severity` |
| `timechart` | Time-based chart | `timechart span=1d count BY severity` |
| `eval` | Create/modify fields | `eval age = now() - _time` |
| `where` | Filter results | `where age_days > 90` |
| `table` | Display specific columns | `table id, title, severity` |
| `sort` | Sort results | `sort -severity` (descending) |
| `head` | Top N results | `head 10` |
| `join` | Join two searches | `join resource_id [search ...]` |
| `lookup` | Enrich with lookup table | `lookup cmdb_lookup ci_id AS resource_id` |
| `rex` | Regex extraction | `rex field=title "CVE-(?<cve>\d+-\d+)"` |
| `transaction` | Group related events | `transaction resource_id maxspan=1h` |
| `tstats` | Fast aggregation on indexed data | `tstats count WHERE index=cloud_security` |

## 3.5 Splunk Dashboards for FM

```
SPLUNK DASHBOARD PANELS:

Panel 1: "Findings Ingestion Health"
├── Are Wiz findings flowing into Splunk?
├── SPL: index=cloud_security sourcetype=wiz_findings | timechart span=1h count
└── Alert if: count drops to 0 for >2 hours

Panel 2: "Critical Findings SLA Status"
├── How many Critical findings are breaching SLA?
├── SPL: ... | eval sla_status | stats count BY sla_status
└── Single value: % compliance

Panel 3: "Correlation Events"
├── Wiz findings that correlate with suspicious CloudTrail activity
├── SPL: join on resource_id between wiz_findings and cloudtrail
└── Table with finding + correlated event details

Panel 4: "Remediation Velocity"
├── How fast are findings being closed?
├── SPL: timechart span=1w count(eval(status="Closed")) AS closed
└── Line chart showing trend
```

---

# SECTION 4: INTERVIEW ANSWERS FOR THESE SKILLS

### Q: "How do you use ServiceNow in your findings management workflow?"

> "ServiceNow is the backbone of our ticket routing and tracking. When Wiz detects a finding, our automation creates a ServiceNow ticket by looking up the affected resource in the CMDB to get the owner and assignment group. The ticket includes the finding details, remediation steps, and an SLA timer based on severity and exposure. I validate CMDB data weekly — checking for orphaned assets, stale owners, and missing assignment groups — because clean CMDB data is the foundation of effective findings management."

### Q: "How do you use SQL in your role?"

> "I write SQL queries that feed our Power BI dashboards. My queries join Wiz findings with CMDB data to calculate KPIs like SLA compliance by team, MTTR by severity, and finding age distribution. I also build ad-hoc queries for audit preparation — for example, pulling all findings closed in the last quarter with their remediation evidence. For large datasets, I use window functions to calculate percentiles and running totals."

### Q: "How do you use Splunk for findings management?"

> "Splunk is where I correlate Wiz findings with runtime events. A Critical CSPM finding alone might be informational, but when I join it with CloudTrail events showing unusual API activity on the same resource, it becomes actionable intelligence. I also build Splunk alerts for specific patterns — like new Critical findings on internet-facing assets — and dashboards that track findings ingestion health and remediation velocity."

---

*Continue to Part 3 → Azure & GCP Security Deep Dive, Wiz Platform*
