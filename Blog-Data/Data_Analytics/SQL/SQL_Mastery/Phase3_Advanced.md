# SQL Mastery — Phase 3: Advanced
## Window Functions, CTEs, Indexes, Transactions

---

# 1. Window Functions

## What
Functions that perform calculations ACROSS a set of rows related to the current row — without collapsing rows (unlike GROUP BY).

## Why
GROUP BY gives you one row per group. Window functions give you the aggregate value NEXT TO each original row. Critical for rankings, running totals, comparisons.

---

## 1.1 ROW_NUMBER()

**Assigns a unique sequential number to each row within a partition.**

```sql
-- Number each login event per user (ordered by time)
SELECT 
    u.username,
    le.source_ip,
    le.event_time,
    le.status,
    ROW_NUMBER() OVER (
        PARTITION BY le.user_id 
        ORDER BY le.event_time
    ) AS login_sequence
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id;
```

### Real SOC use: Get the FIRST login per user each day

```sql
-- Using CTE + ROW_NUMBER (covered together here)
WITH ranked_logins AS (
    SELECT 
        user_id,
        source_ip,
        event_time,
        geo_location,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, DATE(event_time) 
            ORDER BY event_time ASC
        ) AS rn
    FROM login_events
    WHERE user_id IS NOT NULL
)
SELECT * FROM ranked_logins WHERE rn = 1;
```

---

## 1.2 RANK() and DENSE_RANK()

```sql
-- Rank assets by vulnerability count
SELECT 
    a.hostname,
    COUNT(vs.scan_id) AS vuln_count,
    RANK() OVER (ORDER BY COUNT(vs.scan_id) DESC) AS rank_position,
    DENSE_RANK() OVER (ORDER BY COUNT(vs.scan_id) DESC) AS dense_rank_position
FROM assets a
LEFT JOIN vulnerability_scans vs ON a.asset_id = vs.asset_id
GROUP BY a.asset_id, a.hostname;
```

| Difference | RANK | DENSE_RANK | ROW_NUMBER |
|-----------|------|------------|------------|
| Ties | Same rank, skips next | Same rank, no skip | Always unique |
| Example (scores: 100,100,90) | 1,1,3 | 1,1,2 | 1,2,3 |

---

## 1.3 LAG() and LEAD()

**Access previous/next row's value. Essential for time-series analysis.**

```sql
-- Detect impossible travel: Compare each login with the previous one for same user
SELECT 
    u.username,
    le.source_ip,
    le.geo_location,
    le.event_time,
    LAG(le.geo_location) OVER (PARTITION BY le.user_id ORDER BY le.event_time) AS prev_location,
    LAG(le.event_time) OVER (PARTITION BY le.user_id ORDER BY le.event_time) AS prev_time,
    TIMESTAMPDIFF(
        MINUTE, 
        LAG(le.event_time) OVER (PARTITION BY le.user_id ORDER BY le.event_time),
        le.event_time
    ) AS minutes_since_last_login
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id
ORDER BY le.user_id, le.event_time;
```

### Detect rapid repeated failures (brute force)

```sql
SELECT * FROM (
    SELECT 
        source_ip,
        event_time,
        status,
        LAG(event_time) OVER (PARTITION BY source_ip ORDER BY event_time) AS prev_time,
        TIMESTAMPDIFF(
            SECOND,
            LAG(event_time) OVER (PARTITION BY source_ip ORDER BY event_time),
            event_time
        ) AS seconds_between
    FROM login_events
    WHERE status = 'failure'
) sub
WHERE seconds_between IS NOT NULL AND seconds_between <= 10;
```

---

## 1.4 Running Totals & Moving Averages

```sql
-- Running count of alerts per day
SELECT 
    DATE(alert_time) AS alert_date,
    COUNT(*) AS daily_alerts,
    SUM(COUNT(*)) OVER (ORDER BY DATE(alert_time)) AS running_total
FROM security_alerts
GROUP BY DATE(alert_time)
ORDER BY alert_date;
```

```sql
-- Running average CVSS score (as vulnerabilities are discovered)
SELECT 
    scan_id,
    cve_id,
    cvss_score,
    AVG(cvss_score) OVER (ORDER BY scan_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3
FROM vulnerability_scans
ORDER BY scan_date;
```

---

## 1.5 NTILE() — Bucket rows into groups

```sql
-- Divide vulnerabilities into 4 priority quartiles by CVSS score
SELECT 
    cve_id,
    vuln_name,
    cvss_score,
    NTILE(4) OVER (ORDER BY cvss_score DESC) AS priority_quartile
FROM vulnerability_scans
WHERE status = 'open';
-- quartile 1 = most critical, quartile 4 = least
```

---

# 2. CTEs (Common Table Expressions)

## What
Named temporary result set defined using `WITH`. Exists only for the duration of the query. Makes complex queries readable.

## Why
- Break complex queries into logical steps
- Avoid nested subqueries (readability)
- Reuse result within same query
- Recursive queries (hierarchical data)

```sql
-- Step-by-step alert analysis using CTE
WITH alert_summary AS (
    SELECT 
        assigned_to,
        severity,
        COUNT(*) AS alert_count
    FROM security_alerts
    WHERE status NOT IN ('resolved', 'false_positive')
    GROUP BY assigned_to, severity
),
analyst_workload AS (
    SELECT 
        u.full_name,
        COALESCE(SUM(als.alert_count), 0) AS total_open_alerts,
        COALESCE(SUM(CASE WHEN als.severity = 'critical' THEN als.alert_count ELSE 0 END), 0) AS critical_alerts
    FROM users u
    LEFT JOIN alert_summary als ON u.user_id = als.assigned_to
    WHERE u.department = 'SOC'
    GROUP BY u.user_id, u.full_name
)
SELECT 
    full_name,
    total_open_alerts,
    critical_alerts,
    CASE 
        WHEN critical_alerts > 2 THEN '🔴 OVERLOADED'
        WHEN total_open_alerts > 3 THEN '🟡 BUSY'
        ELSE '🟢 AVAILABLE'
    END AS workload_status
FROM analyst_workload
ORDER BY critical_alerts DESC, total_open_alerts DESC;
```

### Threat Correlation CTE

```sql
-- Correlate logins with threat intel and alerts in one clean query
WITH suspicious_logins AS (
    SELECT le.*, ti.threat_type, ti.confidence
    FROM login_events le
    INNER JOIN threat_intel ti ON le.source_ip = ti.indicator
    WHERE ti.indicator_type = 'ip' AND ti.confidence > 70
),
related_alerts AS (
    SELECT sa.*
    FROM security_alerts sa
    WHERE sa.source_ip IN (SELECT source_ip FROM suspicious_logins)
)
SELECT 
    sl.source_ip,
    sl.event_time AS login_time,
    sl.status AS login_status,
    sl.threat_type,
    sl.confidence,
    ra.alert_name,
    ra.severity AS alert_severity
FROM suspicious_logins sl
LEFT JOIN related_alerts ra ON sl.source_ip = ra.source_ip
ORDER BY sl.confidence DESC;
```

---

# 3. Indexes & Query Optimization

## 3.1 What is an Index?

Like a book's index. Instead of reading every page (full table scan), you look up the index to find the exact page.

**Without index:** DB scans every row (slow for large tables).  
**With index:** DB uses B-tree (or hash) structure to find rows in O(log n) time.

## 3.2 Creating Indexes

```sql
-- Index on columns used in WHERE clauses frequently
CREATE INDEX idx_login_events_source_ip ON login_events(source_ip);
CREATE INDEX idx_login_events_user_time ON login_events(user_id, event_time);
CREATE INDEX idx_login_events_status ON login_events(status);

CREATE INDEX idx_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_alerts_status ON security_alerts(status);
CREATE INDEX idx_alerts_time ON security_alerts(alert_time);

CREATE INDEX idx_vulns_asset ON vulnerability_scans(asset_id);
CREATE INDEX idx_vulns_severity_status ON vulnerability_scans(severity, status);

CREATE INDEX idx_threat_intel_indicator ON threat_intel(indicator);
```

## 3.3 EXPLAIN — See How DB Executes Your Query

```sql
EXPLAIN SELECT * FROM login_events WHERE source_ip = '185.220.101.5';
```

**Key EXPLAIN columns:**
| Column | What to look for |
|--------|-----------------|
| **type** | `ALL` = full scan (bad). `ref` / `range` / `const` = index used (good) |
| **key** | Which index is being used (NULL = no index) |
| **rows** | Estimated rows to examine (lower = better) |
| **Extra** | `Using index` (covering index, best). `Using filesort` (needs optimization) |

## 3.4 Index Best Practices

```
✅ DO Index:
  - Columns in WHERE clauses
  - Columns in JOIN conditions
  - Columns in ORDER BY
  - Composite index for multi-column queries (leftmost prefix rule)

❌ DON'T Index:
  - Columns with very low cardinality (e.g., boolean with 50/50 distribution)
  - Tables with <1000 rows (full scan is faster)
  - Columns you rarely query on
  - Too many indexes (slows INSERT/UPDATE)
```

## 3.5 Query Optimization Techniques

```sql
-- ❌ BAD: Function on indexed column disables index
SELECT * FROM login_events WHERE YEAR(event_time) = 2024;

-- ✅ GOOD: Range query uses index
SELECT * FROM login_events 
WHERE event_time >= '2024-01-01' AND event_time < '2025-01-01';

-- ❌ BAD: Leading wildcard disables index
SELECT * FROM assets WHERE hostname LIKE '%prod%';

-- ✅ GOOD: Trailing wildcard uses index
SELECT * FROM assets WHERE hostname LIKE 'web-prod%';

-- ❌ BAD: OR conditions often cause full scan
SELECT * FROM login_events WHERE source_ip = '10.0.1.10' OR destination_ip = '10.0.1.10';

-- ✅ GOOD: UNION of two indexed queries
SELECT * FROM login_events WHERE source_ip = '10.0.1.10'
UNION ALL
SELECT * FROM login_events WHERE destination_ip = '10.0.1.10';
```

---

# 4. Transactions & ACID Properties

## 4.1 What Are Transactions?

A group of SQL operations that execute as ONE atomic unit. Either ALL succeed, or ALL rollback.

**Banking example:** Transfer $100 from Account A to Account B:
1. Debit A by $100
2. Credit B by $100  
If step 2 fails, step 1 must be undone. Otherwise money disappears.

## 4.2 ACID Properties

| Property | Meaning | Example |
|----------|---------|---------|
| **Atomicity** | All or nothing | Both debit and credit succeed, or neither happens |
| **Consistency** | DB moves from valid state to valid state | Total money before = total money after |
| **Isolation** | Concurrent transactions don't interfere | Two transfers happening simultaneously don't corrupt data |
| **Durability** | Once committed, data survives crashes | Power outage after commit → data is still there |

## 4.3 Transaction Syntax

```sql
-- SOC scenario: Create incident from alert (must be atomic)
START TRANSACTION;

-- Step 1: Create incident
INSERT INTO incidents (title, severity, status, created_by, assigned_to, affected_assets)
VALUES ('Ransomware Detected on ws-agarcia', 'critical', 'open', 4, 1, 'ws-agarcia (10.10.1.51)');

-- Step 2: Update related alert status
UPDATE security_alerts 
SET status = 'escalated' 
WHERE alert_id = 4;  -- Malware Hash Detected alert

-- Step 3: Verify both operations
-- If everything looks good:
COMMIT;

-- If something went wrong:
-- ROLLBACK;
```

```sql
-- Batch vulnerability patch update (all or nothing)
START TRANSACTION;

UPDATE vulnerability_scans SET status = 'patched' WHERE scan_id = 1;
UPDATE vulnerability_scans SET status = 'patched' WHERE scan_id = 2;
UPDATE vulnerability_scans SET status = 'patched' WHERE scan_id = 9;

-- Verify
SELECT * FROM vulnerability_scans WHERE scan_id IN (1, 2, 9);

COMMIT;
```

---

# 5. Practice Tasks — Phase 3

### Window Functions
1. Rank users by their total login count (use DENSE_RANK)
2. For each user, show the time difference between consecutive logins (use LAG)
3. Calculate a running total of alerts per day

### CTEs
4. Write a CTE that finds unassigned critical alerts and shows related threat intel
5. Use a multi-step CTE to calculate: alerts per analyst → identify overloaded analysts (>2 alerts)

### Indexes
6. Write an EXPLAIN for a query searching login_events by source_ip. Identify if an index is used.
7. Create appropriate indexes for: finding alerts by severity and status

### Transactions
8. Write a transaction that creates a new incident and updates 2 related alerts to 'escalated'

---

# 6. Interview Questions — Phase 3

**Q1: Difference between ROW_NUMBER, RANK, and DENSE_RANK?**
ROW_NUMBER: Always unique (1,2,3). RANK: Same for ties, skips (1,1,3). DENSE_RANK: Same for ties, no skip (1,1,2).

**Q2: What is a CTE? How is it different from a subquery?**
CTE is a named temporary result set (WITH clause). More readable than nested subqueries. Can be referenced multiple times in the same query. Subquery can only be used once where defined.

**Q3: When would you NOT use an index?**
Small tables (<1000 rows), columns with low cardinality, columns rarely queried, tables with heavy INSERT/UPDATE workload (indexes slow writes).

**Q4: What happens if a transaction fails midway?**
If ROLLBACK is executed (or error occurs), all changes within the transaction are undone. DB returns to state before START TRANSACTION.

**Q5: What is a covering index?**
An index that contains ALL columns needed by a query, so the DB never needs to access the actual table data. Fastest possible query. EXPLAIN shows "Using index".

**Q6: What is the leftmost prefix rule for composite indexes?**
For index on (A, B, C): queries filtering on A, or A+B, or A+B+C use the index. Queries filtering only on B or C do NOT use this index.
