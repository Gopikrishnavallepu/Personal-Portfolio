# SQL Mastery — Phase 4: Expert / Real-World
## Performance Tuning, Partitioning, Data Modeling, Production Queries

---

# 1. Query Performance Tuning

## 1.1 The Performance Tuning Mindset

In production SOC environments with millions of log rows, a bad query can:
- Take 30 minutes instead of 30 seconds
- Lock tables, blocking other analysts
- Crash the SIEM dashboard
- Cause missed alerts during incident response

### Performance checklist (in order):

```
1. Check EXPLAIN output — is it doing a full table scan?
2. Add missing indexes
3. Rewrite the query (avoid functions on indexed columns)
4. Reduce data scanned (use date ranges, LIMIT)
5. Consider partitioning for huge tables
6. Use summary/aggregate tables for dashboards
```

## 1.2 Real Optimization Examples

### Scenario: Slow alert query (10M+ rows)

```sql
-- ❌ SLOW: Full table scan + function on column + SELECT *
SELECT * FROM login_events 
WHERE DATE(event_time) = '2024-03-15' 
AND status = 'failure';

-- ✅ FAST: Range scan on index + specific columns
SELECT event_id, user_id, source_ip, event_time, status
FROM login_events 
WHERE event_time >= '2024-03-15 00:00:00' 
  AND event_time < '2024-03-16 00:00:00'
  AND status = 'failure';
-- Composite index: CREATE INDEX idx_time_status ON login_events(event_time, status);
```

### Scenario: JOIN optimization

```sql
-- ❌ SLOW: Joining on non-indexed column
SELECT le.*, a.hostname
FROM login_events le
JOIN assets a ON le.destination_ip = a.ip_address;

-- ✅ FAST: Create index on join column
CREATE INDEX idx_assets_ip ON assets(ip_address);
-- Then same query uses index
```

### Scenario: Aggregate query optimization

```sql
-- ❌ SLOW: Counting entire table every time dashboard loads
SELECT severity, COUNT(*) FROM security_alerts GROUP BY severity;

-- ✅ FAST: Pre-aggregated summary table updated periodically
CREATE TABLE alert_summary_hourly (
    summary_id INT PRIMARY KEY AUTO_INCREMENT,
    hour_bucket DATETIME NOT NULL,
    severity VARCHAR(10) NOT NULL,
    alert_count INT NOT NULL,
    UNIQUE KEY (hour_bucket, severity)
);

-- Populate via scheduled job every hour
INSERT INTO alert_summary_hourly (hour_bucket, severity, alert_count)
SELECT 
    DATE_FORMAT(alert_time, '%Y-%m-%d %H:00:00') AS hour_bucket,
    severity,
    COUNT(*) AS alert_count
FROM security_alerts
WHERE alert_time >= NOW() - INTERVAL 1 HOUR
GROUP BY hour_bucket, severity
ON DUPLICATE KEY UPDATE alert_count = VALUES(alert_count);
```

---

# 2. Partitioning

## What
Split a large table into smaller physical pieces (partitions) based on a column value. DB knows which partition to scan, skipping irrelevant ones.

## Why
login_events table might have 100M+ rows. Querying by date should only scan 1 day's partition, not all 100M rows.

```sql
-- Partition login_events by month
CREATE TABLE login_events_partitioned (
    event_id      BIGINT NOT NULL AUTO_INCREMENT,
    user_id       INT,
    source_ip     VARCHAR(45) NOT NULL,
    destination_ip VARCHAR(45),
    event_time    TIMESTAMP NOT NULL,
    status        ENUM('success', 'failure') NOT NULL,
    auth_method   VARCHAR(20),
    geo_location  VARCHAR(100),
    user_agent    VARCHAR(255),
    PRIMARY KEY (event_id, event_time)  -- Partition key must be in PRIMARY KEY
) PARTITION BY RANGE (UNIX_TIMESTAMP(event_time)) (
    PARTITION p2024_01 VALUES LESS THAN (UNIX_TIMESTAMP('2024-02-01')),
    PARTITION p2024_02 VALUES LESS THAN (UNIX_TIMESTAMP('2024-03-01')),
    PARTITION p2024_03 VALUES LESS THAN (UNIX_TIMESTAMP('2024-04-01')),
    PARTITION p2024_04 VALUES LESS THAN (UNIX_TIMESTAMP('2024-05-01')),
    PARTITION p_future  VALUES LESS THAN MAXVALUE
);
```

**Partition pruning:** Query with `WHERE event_time >= '2024-03-01' AND event_time < '2024-04-01'` only scans partition `p2024_03`.

### Data retention with partitions

```sql
-- Drop old data instantly (instead of slow DELETE)
ALTER TABLE login_events_partitioned DROP PARTITION p2024_01;
-- This removes ALL data in Jan 2024 instantly (not row-by-row delete)

-- Add new partition for next month
ALTER TABLE login_events_partitioned ADD PARTITION (
    PARTITION p2024_05 VALUES LESS THAN (UNIX_TIMESTAMP('2024-06-01'))
);
```

---

# 3. Data Modeling Basics

## SOC Database — Entity Relationship

```
users ──1:N──→ login_events     (one user, many logins)
users ──1:N──→ security_alerts  (one analyst assigned to many alerts)
users ──1:N──→ incidents        (one analyst assigned to many incidents)
users ──1:N──→ assets           (one owner, many assets)
assets ──1:N──→ vulnerability_scans (one asset, many vulnerabilities)
```

## Normalization Rules (Production Relevance)

| Normal Form | Rule | SOC Example |
|-------------|------|-------------|
| **1NF** | No repeating groups; atomic values | Don't store "10.0.1.10, 10.0.1.11" in one column |
| **2NF** | No partial dependencies | Don't store `username` in login_events (it's in users table) |
| **3NF** | No transitive dependencies | Don't store `department_name` if you already store `department_id` → `departments` table |

## When to Denormalize

- **Dashboard queries:** Pre-join data into summary tables for fast reads
- **Log analysis:** Store flattened log entries (already denormalized from source)
- **SIEM ingest:** Ingest raw json/csv as-is, normalize later

---

# 4. Writing Production-Grade Queries

## Production query standards:

```sql
-- ✅ PRODUCTION QUALITY QUERY
-- Purpose: Daily SOC shift report — unresolved critical/high alerts with analyst assignment
-- Author: Security Engineering
-- Last updated: 2024-03-15
-- Performance: Uses idx_alerts_severity_status, runs < 500ms on 1M rows

SELECT 
    sa.alert_id,
    sa.alert_name,
    sa.severity,
    sa.source,
    sa.source_ip,
    sa.alert_time,
    sa.status,
    COALESCE(u.full_name, 'UNASSIGNED') AS analyst,
    sa.mitre_tactic,
    sa.mitre_technique,
    TIMESTAMPDIFF(HOUR, sa.alert_time, NOW()) AS hours_open,
    CASE 
        WHEN sa.severity = 'critical' AND TIMESTAMPDIFF(HOUR, sa.alert_time, NOW()) > 4 THEN 'SLA BREACH'
        WHEN sa.severity = 'high' AND TIMESTAMPDIFF(HOUR, sa.alert_time, NOW()) > 8 THEN 'SLA BREACH'
        ELSE 'WITHIN SLA'
    END AS sla_status
FROM security_alerts sa
LEFT JOIN users u ON sa.assigned_to = u.user_id
WHERE sa.status NOT IN ('resolved', 'false_positive')
  AND sa.severity IN ('critical', 'high')
  AND sa.alert_time >= NOW() - INTERVAL 7 DAY
ORDER BY 
    FIELD(sa.severity, 'critical', 'high') ASC,
    sa.alert_time ASC;
```

### Production rules:
1. **Comment your queries** — who wrote it, what it does, when updated
2. **Use explicit column names** — never SELECT *
3. **Use COALESCE for NULLs** — dashboards shouldn't show blanks
4. **Add SLA logic** — automate reporting
5. **Filter by date range** — never scan entire table history
6. **Order by business priority** — critical first

---

# 5. Debugging Slow Queries

## Step-by-step debugging process

```
Step 1: Run EXPLAIN on the slow query
Step 2: Check for "ALL" in type column (full table scan)
Step 3: Check if key column is NULL (no index used)
Step 4: Check rows column (too many rows being examined?)
Step 5: Look for "Using temporary" or "Using filesort" in Extra
Step 6: Identify missing indexes → create them
Step 7: Rewrite query if needed (avoid functions on indexed columns)
Step 8: Re-run EXPLAIN → verify improvement
Step 9: Test timing: SELECT ... (check actual execution time)
```

### Slow query log (MySQL)

```sql
-- Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries taking > 1 second
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- Check slow queries
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

---

# 6. Practice Tasks — Phase 4

1. Write EXPLAIN for a complex JOIN query and identify optimization opportunities
2. Design a partition strategy for the `vulnerability_scans` table by scan_date
3. Create a pre-aggregated summary table for the SOC dashboard showing alerts per hour per severity
4. Write a production-grade query for "Top 10 riskiest assets" (combine vulnerability count + alert count + criticality)
5. Optimize this query: `SELECT * FROM login_events WHERE MONTH(event_time) = 3 AND YEAR(event_time) = 2024`

---

# 7. Interview Questions — Phase 4

**Q1: How do you optimize a slow query?**
1. EXPLAIN to identify full scans
2. Add indexes on WHERE/JOIN/ORDER BY columns
3. Avoid functions on indexed columns
4. Use date ranges instead of date functions
5. Use covering indexes for frequently accessed columns
6. Consider partitioning for very large tables
7. Pre-aggregate for dashboard queries

**Q2: What is query execution order?**
`FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`

**Q3: What is database partitioning? Types?**
Splitting table into smaller pieces. Types: RANGE (by date), LIST (by category), HASH (by hash of column), KEY (by primary key hash).

**Q4: Difference between horizontal and vertical partitioning?**
Horizontal: Split rows (e.g., 2024 data in one partition, 2023 in another). Vertical: Split columns (frequently accessed columns in one table, rarely accessed in another).

**Q5: What is a covering index?**
Index that includes all columns the query needs. DB reads only the index, never touches table data. Fastest possible query.
