# SQL Mastery — Phase 2: Intermediate
## JOINS, GROUP BY, Aggregates, Subqueries

---

# 1. JOINS — Combining Tables

## Why JOINS exist
Data is normalized (split across tables to avoid duplication). To get meaningful answers, you must combine tables.

**Real-world:** "Show me which analyst is assigned to each alert" → needs `security_alerts` + `users`.

---

## 1.1 INNER JOIN

**What:** Returns only rows that have matching values in BOTH tables.  
**Internally:** DB builds hash table of smaller table, probes it with each row of larger table.

```sql
-- Show alerts with analyst names (only assigned alerts)
SELECT 
    a.alert_id,
    a.alert_name,
    a.severity,
    a.status,
    u.full_name AS assigned_analyst,
    u.department
FROM security_alerts a
INNER JOIN users u ON a.assigned_to = u.user_id;
```

**Result:** Only alerts WHERE `assigned_to` is NOT NULL and matches a `user_id`.

### Real SOC scenario: Login events with usernames

```sql
SELECT 
    le.event_id,
    u.username,
    u.full_name,
    le.source_ip,
    le.status,
    le.event_time,
    le.geo_location
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id
WHERE le.status = 'failure'
ORDER BY le.event_time DESC;
```

---

## 1.2 LEFT JOIN (LEFT OUTER JOIN)

**What:** Returns ALL rows from LEFT table + matching rows from RIGHT table. If no match, RIGHT columns = NULL.

```sql
-- All alerts, including unassigned ones (show analyst if assigned)
SELECT 
    a.alert_id,
    a.alert_name,
    a.severity,
    a.status,
    COALESCE(u.full_name, 'UNASSIGNED') AS assigned_analyst
FROM security_alerts a
LEFT JOIN users u ON a.assigned_to = u.user_id
ORDER BY a.alert_time DESC;
```

**COALESCE:** Returns first non-NULL value. If `u.full_name` is NULL → returns 'UNASSIGNED'.

### Real scenario: Find assets with no vulnerabilities (they're clean)

```sql
SELECT 
    a.hostname,
    a.ip_address,
    a.environment,
    v.cve_id
FROM assets a
LEFT JOIN vulnerability_scans v ON a.asset_id = v.asset_id
WHERE v.scan_id IS NULL;  -- No matching vulnerability = clean asset
```

**Interview tip:** LEFT JOIN + WHERE right_table.key IS NULL = "find rows in left that DON'T exist in right" (anti-join pattern).

---

## 1.3 RIGHT JOIN

**What:** Returns ALL rows from RIGHT table + matching from LEFT. Opposite of LEFT JOIN.

```sql
-- All users and their assigned alerts (even users with no alerts)
SELECT 
    u.full_name,
    u.department,
    a.alert_name,
    a.severity
FROM security_alerts a
RIGHT JOIN users u ON a.assigned_to = u.user_id;
```

**Production tip:** RIGHT JOIN is rarely used. Rewrite as LEFT JOIN by swapping table order.

---

## 1.4 FULL OUTER JOIN

**What:** Returns ALL rows from BOTH tables. NULL where no match.  
**MySQL note:** MySQL doesn't support FULL OUTER JOIN directly. Use UNION of LEFT + RIGHT JOIN.

```sql
-- MySQL workaround
SELECT a.hostname, v.cve_id, v.severity
FROM assets a
LEFT JOIN vulnerability_scans v ON a.asset_id = v.asset_id
UNION
SELECT a.hostname, v.cve_id, v.severity
FROM assets a
RIGHT JOIN vulnerability_scans v ON a.asset_id = v.asset_id;
```

---

## 1.5 Multi-table JOINs

### Real SOC Query: Correlate login events with threat intelligence

```sql
-- Find logins from known malicious IPs
SELECT 
    u.username,
    u.full_name,
    le.source_ip,
    le.event_time,
    le.status,
    le.geo_location,
    ti.threat_type,
    ti.confidence,
    ti.source AS intel_source
FROM login_events le
LEFT JOIN users u ON le.user_id = u.user_id
INNER JOIN threat_intel ti ON le.source_ip = ti.indicator
WHERE ti.indicator_type = 'ip'
ORDER BY ti.confidence DESC, le.event_time DESC;
```

### Correlation: Alerts → Assets → Vulnerabilities

```sql
-- Find alerts on assets that also have critical vulnerabilities
SELECT 
    sa.alert_name,
    sa.severity AS alert_severity,
    a.hostname,
    a.ip_address,
    vs.cve_id,
    vs.cvss_score,
    vs.status AS vuln_status
FROM security_alerts sa
INNER JOIN assets a ON sa.source_ip = a.ip_address OR sa.destination_ip = a.ip_address
INNER JOIN vulnerability_scans vs ON a.asset_id = vs.asset_id
WHERE vs.severity = 'critical' AND vs.status = 'open'
ORDER BY vs.cvss_score DESC;
```

---

## 1.6 SELF JOIN

**What:** Join a table with itself. Used for hierarchical data or comparisons within same table.

```sql
-- Find users who logged in from multiple locations on the same day (impossible travel)
SELECT 
    a.user_id,
    u.username,
    a.source_ip AS ip_1,
    a.geo_location AS location_1,
    a.event_time AS time_1,
    b.source_ip AS ip_2,
    b.geo_location AS location_2,
    b.event_time AS time_2
FROM login_events a
INNER JOIN login_events b ON a.user_id = b.user_id 
    AND a.event_id < b.event_id          -- Avoid duplicate pairs
    AND a.geo_location != b.geo_location -- Different locations
    AND TIMESTAMPDIFF(MINUTE, a.event_time, b.event_time) BETWEEN 0 AND 60  -- Within 1 hour
INNER JOIN users u ON a.user_id = u.user_id
WHERE a.status = 'success' AND b.status = 'success';
```

This is a real **impossible travel detection** query used by SIEM tools.

---

# 2. GROUP BY & Aggregate Functions

## 2.1 Aggregate Functions

```sql
-- COUNT: How many total alerts?
SELECT COUNT(*) AS total_alerts FROM security_alerts;

-- COUNT with condition
SELECT COUNT(*) AS critical_alerts 
FROM security_alerts WHERE severity = 'critical';

-- COUNT DISTINCT: How many unique users logged in?
SELECT COUNT(DISTINCT user_id) AS unique_users FROM login_events;

-- SUM: Total CVSS score of all open vulnerabilities
SELECT SUM(cvss_score) AS total_risk_score 
FROM vulnerability_scans WHERE status = 'open';

-- AVG: Average CVSS score
SELECT AVG(cvss_score) AS avg_cvss FROM vulnerability_scans;

-- MIN / MAX
SELECT MIN(cvss_score) AS lowest, MAX(cvss_score) AS highest FROM vulnerability_scans;
```

---

## 2.2 GROUP BY

**What:** Groups rows that share a value, then applies aggregate function per group.

```sql
-- Count alerts by severity
SELECT 
    severity,
    COUNT(*) AS alert_count
FROM security_alerts
GROUP BY severity
ORDER BY alert_count DESC;
```

**Result:**
| severity | alert_count |
|----------|-------------|
| critical | 3 |
| high | 3 |
| medium | 2 |
| low | 1 |
| info | 0 |

### SOC Dashboard Queries

```sql
-- Alerts per analyst (workload distribution)
SELECT 
    u.full_name,
    COUNT(sa.alert_id) AS assigned_alerts,
    SUM(CASE WHEN sa.severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN sa.severity = 'high' THEN 1 ELSE 0 END) AS high_count
FROM users u
LEFT JOIN security_alerts sa ON u.user_id = sa.assigned_to
WHERE u.department = 'SOC'
GROUP BY u.user_id, u.full_name
ORDER BY assigned_alerts DESC;
```

```sql
-- Login failure rate by user
SELECT 
    u.username,
    COUNT(*) AS total_logins,
    SUM(CASE WHEN le.status = 'failure' THEN 1 ELSE 0 END) AS failed_logins,
    ROUND(SUM(CASE WHEN le.status = 'failure' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS failure_rate_pct
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id
GROUP BY u.user_id, u.username
ORDER BY failure_rate_pct DESC;
```

```sql
-- Vulnerabilities by asset and severity
SELECT 
    a.hostname,
    a.environment,
    COUNT(*) AS total_vulns,
    SUM(CASE WHEN vs.severity = 'critical' THEN 1 ELSE 0 END) AS critical,
    SUM(CASE WHEN vs.severity = 'high' THEN 1 ELSE 0 END) AS high,
    SUM(CASE WHEN vs.status = 'open' THEN 1 ELSE 0 END) AS open_vulns
FROM vulnerability_scans vs
INNER JOIN assets a ON vs.asset_id = a.asset_id
GROUP BY a.asset_id, a.hostname, a.environment
ORDER BY critical DESC, high DESC;
```

---

## 2.3 HAVING — Filter After Grouping

**What:** WHERE filters rows BEFORE grouping. HAVING filters AFTER aggregation.

```sql
-- Find users with more than 3 failed logins (brute force targets)
SELECT 
    u.username,
    COUNT(*) AS failed_attempts
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id
WHERE le.status = 'failure'
GROUP BY u.user_id, u.username
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;
```

```sql
-- Find assets with more than 1 critical vulnerability (priority patching)
SELECT 
    a.hostname,
    a.ip_address,
    COUNT(*) AS critical_vulns
FROM vulnerability_scans vs
INNER JOIN assets a ON vs.asset_id = a.asset_id
WHERE vs.severity = 'critical' AND vs.status = 'open'
GROUP BY a.asset_id, a.hostname, a.ip_address
HAVING COUNT(*) > 1;
```

```sql
-- IPs with heavy activity (potential scanning or DoS)
SELECT 
    source_ip,
    COUNT(*) AS event_count,
    SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) AS failures
FROM login_events
GROUP BY source_ip
HAVING event_count > 5
ORDER BY event_count DESC;
```

---

# 3. Subqueries

## 3.1 Subquery in WHERE

```sql
-- Find all logins from known threat IPs
SELECT 
    le.*
FROM login_events le
WHERE le.source_ip IN (
    SELECT indicator 
    FROM threat_intel 
    WHERE indicator_type = 'ip' AND confidence > 80
);
```

```sql
-- Find users who have never logged in
SELECT * FROM users 
WHERE user_id NOT IN (
    SELECT DISTINCT user_id FROM login_events WHERE user_id IS NOT NULL
);
```

```sql
-- Find assets with the highest CVSS score vulnerability
SELECT * FROM vulnerability_scans
WHERE cvss_score = (SELECT MAX(cvss_score) FROM vulnerability_scans);
```

## 3.2 Subquery in FROM (Derived Table)

```sql
-- Find average failures per user, then find users above average
SELECT * FROM (
    SELECT 
        u.username,
        COUNT(*) AS fail_count
    FROM login_events le
    INNER JOIN users u ON le.user_id = u.user_id
    WHERE le.status = 'failure'
    GROUP BY u.user_id, u.username
) AS user_failures
WHERE fail_count > (
    SELECT AVG(fc) FROM (
        SELECT COUNT(*) AS fc
        FROM login_events
        WHERE status = 'failure' AND user_id IS NOT NULL
        GROUP BY user_id
    ) AS avg_calc
);
```

## 3.3 Correlated Subquery

```sql
-- For each asset, get the most critical open vulnerability
SELECT 
    a.hostname,
    a.ip_address,
    (SELECT MAX(vs.cvss_score) 
     FROM vulnerability_scans vs 
     WHERE vs.asset_id = a.asset_id AND vs.status = 'open'
    ) AS max_cvss,
    (SELECT COUNT(*) 
     FROM vulnerability_scans vs 
     WHERE vs.asset_id = a.asset_id AND vs.status = 'open'
    ) AS open_vuln_count
FROM assets a
WHERE a.is_critical = TRUE;
```

**⚠️ Performance:** Correlated subqueries execute once per row of outer query. For large tables, use JOIN instead.

## 3.4 EXISTS (more efficient than IN for large datasets)

```sql
-- Find alerts where the source IP is a known threat
SELECT sa.* 
FROM security_alerts sa
WHERE EXISTS (
    SELECT 1 FROM threat_intel ti 
    WHERE ti.indicator = sa.source_ip 
    AND ti.confidence > 80
);
```

**Why EXISTS > IN:** EXISTS stops checking after first match. IN builds complete list first.

---

# 4. Practice Tasks — Phase 2

### JOINs
1. List all login events with user's full name and department
2. Show all alerts with the assigned analyst's name (include unassigned alerts showing 'UNASSIGNED')
3. Find assets that have BOTH alerts AND open vulnerabilities

### GROUP BY + HAVING
4. Count logins per geo_location, sorted by count descending
5. Find alert sources (IDS, EDR, etc.) with more than 2 alerts
6. Calculate average CVSS score per asset (only assets with avg > 7.0)

### Subqueries
7. Find all alerts where the source IP has a confidence > 80 in threat_intel
8. Find users who are assigned more alerts than the average
9. Find the asset with the most open critical vulnerabilities

---

# 5. Interview Questions — Phase 2

**Q1: Difference between INNER JOIN and LEFT JOIN?**
INNER returns only matching rows from both tables. LEFT returns all rows from left table, NULLs for non-matching right rows.

**Q2: Can you use WHERE to filter aggregated results?**
No. WHERE filters before GROUP BY. Use HAVING to filter after aggregation.

**Q3: What's the difference between IN and EXISTS?**
- IN: Evaluates the full subquery result, then checks membership. Better for small subquery results.
- EXISTS: Returns TRUE at first match, stops scanning. Better for large tables.

**Q4: What is a correlated subquery?**
A subquery that references a column from the outer query. It executes once per row of the outer query. Can be slow — rewrite as JOIN when possible.

**Q5: What does COALESCE do?**
Returns the first non-NULL value from a list of expressions. `COALESCE(col1, col2, 'default')` — if col1 is NULL, try col2; if also NULL, return 'default'.

**Q6: How to find duplicates in a table?**
```sql
SELECT column, COUNT(*) 
FROM table 
GROUP BY column 
HAVING COUNT(*) > 1;
```
