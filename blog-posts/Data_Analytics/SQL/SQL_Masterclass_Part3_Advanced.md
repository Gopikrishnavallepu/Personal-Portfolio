# SQL Masterclass Part 3: Advanced + Expert Level
## Window Functions, CTEs, Indexes, Optimization, Real-World Scenarios

---

## PHASE 3: ADVANCED

---

### 3.1 Window Functions (Advanced Analytical Queries)

**What it is:** Functions that operate over a "window" of rows (a subset) without reducing rows to one like GROUP BY.

**Why it's used:** Complex analytics: ranking, running totals, comparing row to average, detecting trends.

**Key difference from GROUP BY:**
- GROUP BY: Collapses rows (5 rows → 1 row)
- Window functions: Keeps all rows, adds analytical column

**How it works internally:**
1. Partitions rows into windows based on PARTITION BY.
2. Orders rows within partition based on ORDER BY.
3. For each row, applies function over its window.
4. Returns original rows + new window function column.

---

### **Common Window Functions:**

```sql
ROW_NUMBER()      -- 1, 2, 3, ... (unique rank even for ties)
RANK()            -- 1, 1, 3, ... (repeats for ties)
DENSE_RANK()      -- 1, 1, 2, ... (no gaps after ties)
LAG(col, offset)  -- Previous row's value
LEAD(col, offset) -- Next row's value
SUM() OVER        -- Running total
AVG() OVER        -- Running average
FIRST_VALUE()     -- First row in window
LAST_VALUE()      -- Last row in window
```

---

### **Syntax:**

```sql
SELECT 
  column1,
  column2,
  ROW_NUMBER() OVER (PARTITION BY partition_col ORDER BY order_col) as row_num,
  SUM(numeric_col) OVER (PARTITION BY partition_col ORDER BY order_col) as running_total
FROM table;

-- PARTITION BY: Divides data into groups (like GROUP BY, but keeps rows)
-- ORDER BY: Determines order within partition
```

---

### **Real-World Scenario: "Rank users by failed login attempts (detect brute force attacks)"**

```sql
SELECT 
  u.username,
  al.timestamp,
  al.auth_status,
  ROW_NUMBER() OVER (PARTITION BY al.user_id ORDER BY al.timestamp DESC) as attempt_number,
  RANK() OVER (PARTITION BY al.user_id ORDER BY COUNT(*) DESC) as brute_force_rank
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
WHERE al.auth_status = 'Failed'
GROUP BY al.user_id, u.username, al.timestamp, al.auth_status;

-- For user mike_chen (user_id=3):
-- username   | timestamp           | auth_status | attempt_number | brute_force_rank
-- mike_chen  | 2024-03-28 10:17:00 | Failed      | 1              | 1
-- mike_chen  | 2024-03-28 10:16:00 | Failed      | 2              | 1
-- mike_chen  | 2024-03-28 10:15:00 | Failed      | 3              | 1

-- Action: User attempted 3 times in short period. Brute force! Block.
```

---

### **More Window Function Examples:**

```sql
-- 1. Rank alerts by severity (within each user's alerts)
SELECT 
  u.username,
  a.alert_type,
  a.alert_severity,
  ROW_NUMBER() OVER (PARTITION BY a.user_id ORDER BY a.created_at DESC) as alert_rank
FROM alerts a
LEFT JOIN users u ON a.user_id = u.user_id
WHERE a.user_id IS NOT NULL;

-- 2. Running sum of bytes sent (network flow analysis)
SELECT 
  src.ip_address,
  nf.flow_start,
  nf.bytes_sent,
  SUM(nf.bytes_sent) OVER (PARTITION BY nf.source_ip_id ORDER BY nf.flow_start) as running_total_bytes
FROM network_flows nf
JOIN ip_addresses src ON nf.source_ip_id = src.ip_id
ORDER BY nf.source_ip_id, nf.flow_start;

-- Result scenario:
-- ip_address     | flow_start          | bytes_sent | running_total_bytes
-- 10.0.1.10      | 2024-03-28 10:00:00 | 1024       | 1024
-- 10.0.1.10      | 2024-03-28 11:00:00 | 512        | 1536        <- Running total
-- 10.0.1.10      | 2024-03-28 12:00:00 | 2048       | 3584        <- Running total

-- 3. Compare each user's risk score to average
SELECT 
  username,
  risk_score,
  AVG(risk_score) OVER () as avg_risk,
  risk_score - AVG(risk_score) OVER () as risk_diff
FROM users
ORDER BY risk_score DESC;

-- Result:
-- username        | risk_score | avg_risk | risk_diff
-- alex_contractor | 45         | 15.6     | 29.4       <- Much higher than average
-- mike_chen       | 15         | 15.6     | -0.6
-- sarah_jones     | 10         | 15.6     | -5.6
-- john_smith      | 5          | 15.6     | -10.6

-- 4. Detect anomalies: When did risk score last change?
SELECT 
  username,
  risk_score,
  LAG(risk_score) OVER (PARTITION BY user_id ORDER BY user_id) as prev_risk_score,
  CASE 
    WHEN LAG(risk_score) OVER (PARTITION BY user_id ORDER BY user_id) IS NULL THEN 'Initial'
    WHEN risk_score > LAG(risk_score) OVER (PARTITION BY user_id ORDER BY user_id) THEN 'Increased'
    WHEN risk_score < LAG(risk_score) OVER (PARTITION BY user_id ORDER BY user_id) THEN 'Decreased'
    ELSE 'Same'
  END as risk_change
FROM users;

-- 5. DENSE_RANK: Rank incidents by severity
SELECT 
  incident_name,
  severity,
  DENSE_RANK() OVER (ORDER BY severity DESC) as severity_rank
FROM incidents;

-- With DENSE_RANK: 1, 1, 2, 2, 3 (no gaps)
-- With RANK: 1, 1, 3, 3, 5 (gaps after ties)
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Forgetting PARTITION BY (assumes all data is one window)
```sql
-- This creates a MASSIVE window across all data
SELECT username, risk_score, 
  ROW_NUMBER() OVER (ORDER BY user_id) as row_num
FROM users;
-- Works but probably not what you intended
```

✅ **GOOD:** Be explicit
```sql
SELECT username, risk_score, 
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY user_id) as row_num_by_dept
FROM users;
```

❌ **Mistake 2:** Using window function in WHERE clause
```sql
-- Fails: Can't use window functions in WHERE
SELECT * FROM users WHERE ROW_NUMBER() OVER (ORDER BY user_id) = 1;
```

✅ **GOOD:** Use CTE or subquery
```sql
WITH ranked_users AS (
  SELECT *, ROW_NUMBER() OVER (ORDER BY user_id) as row_num FROM users
)
SELECT * FROM ranked_users WHERE row_num = 1;
```

---

---

### 3.2 CTEs (Common Table Expressions - WITH clause)

**What it is:** Named temporary result set that exists for the duration of one query.

**Why it's used:** Break complex queries into readable steps. Reuse subqueries.

**How it works internally:**
1. CTE executes first, creates temporary named table.
2. Main query uses the CTE like normal table.
3. CTE is discarded after query completes.

**Syntax:**

```sql
WITH cte_name AS (
  SELECT ... FROM ...
),
cte_name2 AS (
  SELECT ... FROM ...
)
SELECT * FROM cte_name JOIN cte_name2;
```

---

### **Real-World Scenario: "Find users with unusually high alert count."**

```sql
-- Complex query broken down with CTEs
WITH user_alert_counts AS (
  SELECT 
    u.user_id,
    u.username,
    COUNT(a.alert_id) as alert_count
  FROM users u
  LEFT JOIN alerts a ON u.user_id = a.user_id
  GROUP BY u.user_id, u.username
),
stats AS (
  SELECT 
    AVG(alert_count) as avg_alerts,
    STDDEV(alert_count) as std_alerts
  FROM user_alert_counts
),
anomalies AS (
  SELECT 
    uac.username,
    uac.alert_count,
    s.avg_alerts,
    s.std_alerts,
    CASE 
      WHEN uac.alert_count > s.avg_alerts + (2 * s.std_alerts) THEN 'Critical Anomaly'
      WHEN uac.alert_count > s.avg_alerts + s.std_alerts THEN 'High Anomaly'
      ELSE 'Normal'
    END as anomaly_level
  FROM user_alert_counts uac
  CROSS JOIN stats s
  WHERE uac.alert_count > s.avg_alerts
)
SELECT * FROM anomalies ORDER BY alert_count DESC;

-- Result:
-- username        | alert_count | avg_alerts | anomaly_level
-- john_smith      | 3           | 1.1        | High Anomaly       <- More alerts than normal
```

---

### **More CTE Examples:**

```sql
-- 1. Incident timeline (recursive - shows alert progression)
WITH incident_events AS (
  SELECT 
    ia.incident_id,
    i.incident_name,
    a.alert_type,
    a.created_at as event_time
  FROM incident_alerts ia
  JOIN incidents i ON ia.incident_id = i.incident_id
  JOIN alerts a ON ia.alert_id = a.alert_id
),
event_sequence AS (
  SELECT 
    incident_id,
    incident_name,
    alert_type,
    event_time,
    ROW_NUMBER() OVER (PARTITION BY incident_id ORDER BY event_time) as sequence
  FROM incident_events
)
SELECT * FROM event_sequence ORDER BY incident_id, sequence;

-- 2. Vulnerability remediation status (tracked over time)
WITH vuln_status AS (
  SELECT 
    cve_id,
    severity,
    is_patched,
    affected_systems,
    CASE 
      WHEN is_patched = TRUE THEN 'Patched'
      WHEN discovered_date < NOW() - INTERVAL 30 DAY AND is_patched = FALSE THEN 'Overdue'
      WHEN discovered_date < NOW() - INTERVAL 7 DAY AND is_patched = FALSE THEN 'Due Soon'
      ELSE 'On Track'
    END as status
  FROM vulnerabilities
)
SELECT 
  status,
  COUNT(*) as count,
  SUM(affected_systems) as total_systems_affected
FROM vuln_status
GROUP BY status;

-- 3. Multi-step investigative query
WITH suspicious_users AS (
  SELECT DISTINCT user_id FROM auth_logs WHERE auth_status = 'Failed' GROUP BY user_id HAVING COUNT(*) > 2
),
suspicious_devices AS (
  SELECT DISTINCT device_id FROM devices WHERE is_compromised = TRUE
),
suspicious_ips AS (
  SELECT DISTINCT ip_id FROM ip_addresses WHERE threat_level IN ('Critical', 'High')
),
user_details AS (
  SELECT 
    u.user_id,
    u.username,
    u.department,
    u.risk_score,
    (SELECT COUNT(*) FROM auth_logs al WHERE al.user_id = u.user_id) as total_logins,
    (SELECT COUNT(*) FROM alerts a WHERE a.user_id = u.user_id) as alert_count
  FROM users u
  WHERE u.user_id IN (SELECT user_id FROM suspicious_users)
)
SELECT * FROM user_details WHERE alert_count > 0 ORDER BY alert_count DESC;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Redefining CTE in another query (each query has its own scope)
```sql
-- This fails: cte1 not available in second query
WITH cte1 AS (SELECT ... FROM users)
SELECT * FROM cte1;
SELECT * FROM cte1;  -- Error: cte1 not defined
```

✅ **GOOD:** Define CTE within each query
```sql
WITH cte1 AS (SELECT ... FROM users)
SELECT * FROM cte1;

WITH cte1 AS (SELECT ... FROM users)
SELECT * FROM cte1;  -- Separate query, redefine CTE
```

❌ **Mistake 2:** Circular CTE references
```sql
-- Can't reference cte1 while defining cte1
WITH cte1 AS (SELECT * FROM cte1)  -- Error
SELECT * FROM cte1;
```

---

---

### 3.3 Indexes (Making Queries Fast)

**What it is:** Data structure (usually B-tree) that helps find rows quickly.

**Why it's used:** Without indexes, queries scan entire table. With 1B rows, that's slow.

**How it works internally:**
1. Index is like a book index: "topic X appears on pages Y, Z"
2. Instead of reading entire book, jump to pages directly.
3. Database maintains index as data changes (automatic).
4. Trade-off: Indexes speed up SELECT but slow down UPDATE/INSERT/DELETE.

**Syntax:**

```sql
-- Create index on single column
CREATE INDEX idx_name ON table_name (column_name);

-- Create composite index (multiple columns)
CREATE INDEX idx_name ON table_name (col1, col2);

-- Create unique index (bonus: enforces uniqueness)
CREATE UNIQUE INDEX idx_name ON table_name (column_name);

-- Drop index
DROP INDEX idx_name ON table_name;

-- Show indexes
SHOW INDEXES FROM table_name;
```

---

### **When to Index:**

✅ **Index these columns:**
- Foreign keys (used in JOINs)
- Frequently used in WHERE clauses
- Columns used in ORDER BY and GROUP BY
- Columns in frequent subqueries

❌ **Don't index:**
- Columns rarely queried
- Small lookup tables (< 1000 rows)
- Columns with many NULL values
- Boolean columns with few values (high cardinality needed)

---

### **Real-World Scenario: "Query is slow. Let's optimize with indexes."**

```sql
-- SLOW query without index
SELECT username, email FROM users WHERE department = 'IT' AND risk_score > 10;
-- Scans all 5 rows (OK for 5, terrible for 1M rows)

-- Add index on department and risk_score
CREATE INDEX idx_dept_risk ON users (department, risk_score);

-- Now FAST query (uses index to find rows directly)
SELECT username, email FROM users WHERE department = 'IT' AND risk_score > 10;
-- Finds 1-2 rows in milliseconds instead of scanning all
```

---

### **Hands-On Indexing Examples:**

```sql
-- Create index on frequently queried columns
CREATE INDEX idx_user_id ON auth_logs (user_id);
CREATE INDEX idx_alert_severity ON alerts (alert_severity);
CREATE INDEX idx_vuln_severity ON vulnerabilities (severity);
CREATE INDEX idx_device_compromised ON devices (is_compromised);
CREATE INDEX idx_incident_status ON incidents (status);

-- Composite index for common filter + order combinations
CREATE INDEX idx_alert_timestamp ON alerts (alert_severity, created_at);

-- Check index was created
SHOW INDEXES FROM users;
-- Result shows: idx_dept_risk on (department, risk_score)
```

---

### **Index Performance Tips:**

```sql
-- Before optimization: Check query performance
-- (This is database-specific; MySQL uses EXPLAIN)
EXPLAIN SELECT username FROM users WHERE risk_score > 10;
-- Shows: Full table scan, rows examined: 5

--After adding index:
CREATE INDEX idx_risk_score ON users (risk_score);
EXPLAIN SELECT username FROM users WHERE risk_score > 10;
-- Shows: Index scan, rows examined: 1 (much faster!)
```

---

---

### 3.4 Transactions and ACID Properties

**What it is:** Grouping multiple operations as single atomic unit. All-or-nothing guarantee.

**Why it's used:** Consistency. If system crashes mid-operation, data remains valid.

**ACID properties:**
- **Atomic:** All or nothing. If 1 operation fails, all rollback.
- **Consistent:** Database always in valid state.
- **Isolated:** Concurrent transactions don't interfere.
- **Durable:** Once committed, data persists.

**Syntax:**

```sql
START TRANSACTION;  -- or BEGIN

UPDATE users SET risk_score = 50 WHERE user_id = 1;
UPDATE users SET risk_score = 50 WHERE user_id = 2;
INSERT INTO audit_log VALUES ('updated risk scores');

COMMIT;     -- Saves all changes
-- OR
ROLLBACK;   -- Undoes all changes
```

---

### **Real-World Scenario: "Update multiple tables consistently."**

```sql
-- Incident resolution: Update incident + all related alerts + log action
START TRANSACTION;

UPDATE incidents 
SET status = 'Resolved', resolved_at = NOW()
WHERE incident_id = 2;

UPDATE alerts 
SET is_resolved = TRUE, resolved_at = NOW()
WHERE alert_id IN (SELECT alert_id FROM incident_alerts WHERE incident_id = 2);

INSERT INTO audit_log (action, timestamp) 
VALUES ('Incident 2 resolved', NOW());

COMMIT;  -- All three operations succeed together

-- If INSERT fails, entire transaction rolls back
-- Update + Update + Insert are atomic unit
```

---

### **Example: Money Transfer (Bank Context)**

```sql
-- Transfer $1000 from account A to account B
START TRANSACTION;

-- Deduct from account A
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 'A';

-- Add to account B
UPDATE accounts SET balance = balance + 1000 WHERE account_id = 'B';

-- Log transaction
INSERT INTO transaction_log (from_account, to_account, amount) 
VALUES ('A', 'B', 1000);

COMMIT;

-- If step 2 fails (account B doesn't exist), step 1 also rolls back
-- Money not lost!
```

---

#### **3.4.1 Isolation Levels**

Different isolation levels allow trade-offs between consistency and performance:

```sql
-- Set isolation level
SET SESSION TRANSACTION ISOLATION LEVEL serializable;

-- Levels (most to least restrictive):
-- SERIALIZABLE      -- Most isolated, slowest (no concurrency)
-- REPEATABLE READ   -- Default in MySQL, good balance
-- READ COMMITTED    -- Less isolation, faster
-- READ UNCOMMITTED  -- Least isolated, fastest (rarely used)
```

---

---

### 3.5 Query Optimization Techniques

**When to optimize:**
- Query takes >1 second (in production, >100ms is slow)
- Queries run frequently (slow query that runs once/month matters less)
- Large tables (1B+ rows)

**Optimization steps:**

```
1. EXPLAIN the query (understand execution plan)
2. Look for table scans (no indexes)
3. Add indexes (if scanning large tables)
4. Rewrite query logic (if possible)
5. Archive old data (reduces table size)
6. Partition large tables
7. Consider caching
```

---

### **EXPLAIN Example:**

```sql
-- Slow query
SELECT u.username, COUNT(a.alert_id) as alert_count 
FROM users u
LEFT JOIN alerts a ON u.user_id = a.user_id
GROUP BY u.user_id
ORDER BY alert_count DESC;

-- Analyze execution plan
EXPLAIN SELECT u.username, COUNT(a.alert_id) as alert_count 
FROM users u
LEFT JOIN alerts a ON u.user_id = a.user_id
GROUP BY u.user_id
ORDER BY alert_count DESC;

-- Output (MySQL format):
-- id | select_type | table | type  | key  | rows | Extra
-- 1  | SIMPLE      | u     | ALL   | NULL | 5    | (full scan)
-- 1  | SIMPLE      | a     | ref   | idx_user_id | 1 | (uses index)

-- The first row shows "ALL" type = full table scan
-- Add index on users primary key or user_id
```

---

### **Real-World Optimization Example:**

```sql
-- BEFORE (slow):
SELECT alert_id, alert_type, alert_severity 
FROM alerts 
WHERE alert_severity = 'Critical' 
  AND created_at > NOW() - INTERVAL 7 DAY;
-- Scans all 1B alerts (if that's size)

-- AFTER (add index):
CREATE INDEX idx_severity_timestamp ON alerts (alert_severity, created_at);

-- Now same query uses index, returns in milliseconds
```

---

---

## PHASE 4: EXPERT / REAL-WORLD

### 4.1 Data Modeling Basics

**Good schema design = faster, more maintainable queries.**

**Principles:**
1. **Normalization:** Avoid data duplication.
2. **Foreign keys:** Maintain referential integrity.
3. **Appropriate data types:** Use INT for IDs, VARCHAR for strings, TIMESTAMP for dates.
4. **Indexes:** Index foreign keys and frequently queried columns.

---

### **Example Bad Design vs. Good Design:**

```sql
-- BAD: Username stored in every auth_log row (duplication)
CREATE TABLE auth_logs_bad (
  log_id INT,
  username VARCHAR(50),  -- Duplicated in many rows
  ip_address VARCHAR(15),  -- Duplicated
  auth_status VARCHAR(20),
  timestamp TIMESTAMP
);

-- GOOD: Store IDs, join to get names (normalization)
CREATE TABLE users (user_id INT, username VARCHAR(50));
CREATE TABLE ip_addresses (ip_id INT, ip_address VARCHAR(15));
CREATE TABLE auth_logs_good (
  log_id INT,
  user_id INT,  -- Foreign key, not duplicated
  ip_id INT,    -- Foreign key, not duplicated
  auth_status VARCHAR(20),
  timestamp TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (ip_id) REFERENCES ip_addresses(ip_id)
);

-- Good design:
-- - No duplication (reduces storage)
-- - Easier to update (one username = one update)
-- - Supports joins (connects related data)
```

---

---

### 4.2 Production-Grade Query Patterns

#### **Pattern 1: Safely Delete Old Data (Archiving)**

```sql
-- Don't delete directly (risky, locks table)

-- Step 1: Archive to backup table
INSERT INTO alerts_archive 
SELECT * FROM alerts 
WHERE created_at < NOW() - INTERVAL 90 DAY;

-- Step 2: Verify archive (spot check)
SELECT COUNT(*) FROM alerts_archive WHERE created_at < NOW() - INTERVAL 90 DAY LIMIT 10;

-- Step 3: Delete original
DELETE FROM alerts 
WHERE created_at < NOW() - INTERVAL 90 DAY;

-- Step 4: Optimize table (reclaim space)
OPTIMIZE TABLE alerts;
```

---

#### **Pattern 2: Bulk Update with Conditions (Batching)**

```sql
-- Risky: Updates 1B rows at once, locks table for long
UPDATE devices SET is_compromised = TRUE WHERE antivirus_installed = FALSE;

-- Better: Batch updates (1000 rows at a time)
UPDATE devices 
SET is_compromised = TRUE 
WHERE antivirus_installed = FALSE 
LIMIT 1000;
-- Run this query multiple times until 0 rows updated (all done)
```

---

#### **Pattern 3: Efficient Pagination**

```sql
-- Inefficient: OFFSET is slow for large offsets
SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10 OFFSET 1000000;
-- Scans past 1M rows even though doesn't return them

-- Efficient: Keyset pagination (use last row's ID)
-- First page
SELECT * FROM alerts ORDER BY created_at DESC LIMIT 10;
-- Get last_id = 500

-- Next page
SELECT * FROM alerts WHERE alert_id < 500 ORDER BY created_at DESC LIMIT 10;
-- Much faster (uses index to skip directly to alert_id < 500)
```

---

#### **Pattern 4: Conditional Aggregation**

```sql
-- Count alerts by severity in one query
SELECT 
  SUM(CASE WHEN alert_severity = 'Critical' THEN 1 ELSE 0 END) as critical_count,
  SUM(CASE WHEN alert_severity = 'High' THEN 1 ELSE 0 END) as high_count,
  SUM(CASE WHEN alert_severity = 'Medium' THEN 1 ELSE 0 END) as medium_count,
  SUM(CASE WHEN alert_severity = 'Low' THEN 1 ELSE 0 END) as low_count
FROM alerts;

-- Result:
-- critical_count | high_count | medium_count | low_count
-- 2              | 3          | 1            | 0
```

---

---

### 4.3 Real-World Scenario Queries (SOC/Security Context)

#### **Scenario 1: Threat Hunting - Detect Lateral Movement**

```sql
-- Find users who accessed multiple sensitive systems in short time window
WITH user_access AS (
  SELECT 
    al.user_id,
    u.username,
    u.department,
    i.ip_address,
    i.location,
    COUNT(DISTINCT al.log_id) as access_count,
    MIN(al.timestamp) as first_access,
    MAX(al.timestamp) as last_access,
    TIMESTAMPDIFF(MINUTE, MIN(al.timestamp), MAX(al.timestamp)) as time_window_minutes
  FROM auth_logs al
  JOIN users u ON al.user_id = u.user_id
  JOIN ip_addresses i ON al.ip_id = i.ip_id
  WHERE al.auth_status = 'Success'
    AND al.timestamp > NOW() - INTERVAL 1 HOUR
  GROUP BY al.user_id, u.username, u.department, i.ip_address, i.location
)
SELECT * FROM user_access 
WHERE time_window_minutes < 30 AND access_count > 5
ORDER BY access_count DESC;

-- Result: If user accessed 10 systems in 15 minutes = suspicious lateral movement
```

---

#### **Scenario 2: Anomaly Detection - High-Volume Data Transfer**

```sql
-- Detect unusual data exfiltration (baseline + threshold)
WITH flow_stats AS (
  SELECT 
    nf.source_ip_id,
    src.ip_address,
    SUM(nf.bytes_sent) as total_bytes,
    AVG(nf.bytes_sent) as avg_bytes,
    COUNT(*) as flow_count
  FROM network_flows nf
  JOIN ip_addresses src ON nf.source_ip_id = src.ip_id
  WHERE nf.flow_start > NOW() - INTERVAL 1 DAY
  GROUP BY nf.source_ip_id, src.ip_address
),
monthly_baseline AS (
  SELECT 
    nf.source_ip_id,
    SUM(nf.bytes_sent) / COUNT(*) as baseline_avg_bytes
  FROM network_flows nf
  WHERE nf.flow_start > NOW() - INTERVAL 30 DAY
  GROUP BY nf.source_ip_id
)
SELECT 
  fs.ip_address,
  fs.total_bytes,
  fs.avg_bytes,
  mb.baseline_avg_bytes,
  (fs.avg_bytes / mb.baseline_avg_bytes) as anomaly_ratio
FROM flow_stats fs
LEFT JOIN monthly_baseline mb ON fs.source_ip_id = mb.source_ip_id
WHERE fs.avg_bytes > mb.baseline_avg_bytes * 3  -- 3x baseline = anomaly
ORDER BY anomaly_ratio DESC;

-- Result: IP with 3x normal traffic = possible data exfiltration
```

---

#### **Scenario 3: Compliance Reporting - Audit Trail**

```sql
-- Generate audit report for compliance (shows who accessed what when)
SELECT 
  u.user_id,
  u.username,
  u.department,
  u.role,
  COUNT(al.log_id) as total_logins,
  SUM(CASE WHEN al.auth_status = 'Success' THEN 1 ELSE 0 END) as successful_logins,
  SUM(CASE WHEN al.auth_status = 'Failed' THEN 1 ELSE 0 END) as failed_logins,
  MAX(al.timestamp) as last_login,
  STRING_AGG(DISTINCT al.auth_type, ', ') as auth_methods_used
FROM users u
LEFT JOIN auth_logs al ON u.user_id = al.user_id 
  AND al.timestamp > NOW() - INTERVAL 30 DAY
WHERE u.is_active = TRUE
GROUP BY u.user_id, u.username, u.department, u.role
ORDER BY total_logins DESC;

-- Note: STRING_AGG may vary (GROUP_CONCAT in MySQL, STRING_AGG in PostgreSQL, etc.)
```

---

#### **Scenario 4: Risk Prioritization - CVSS + Context**

```sql
-- Prioritize vulnerabilities by CVSS + affected systems + patch status
WITH vuln_risk AS (
  SELECT 
    cve_id,
    severity,
    CVSS_score,
    affected_systems,
    is_patched,
    discovered_date,
    patch_deadline,
    -- Risk score: CVSS + days overdue + affected systems
    (CVSS_score * 10) +  -- CVSS weight
    (CASE WHEN is_patched = FALSE AND patch_deadline < NOW() THEN 100 ELSE 0 END) +  -- Overdue penalty
    (affected_systems / 10) as risk_priority
  FROM vulnerabilities
),
remediation_plan AS (
  SELECT 
    cve_id,
    risk_priority,
    CASE 
      WHEN risk_priority > 500 THEN 'Immediate (next 24h)'
      WHEN risk_priority > 300 THEN 'Urgent (next 7d)'
      WHEN risk_priority > 100 THEN 'High (next 30d)'
      ELSE 'Standard (ok)'
    END as remediation_sla
  FROM vuln_risk
  WHERE is_patched = FALSE
)
SELECT * FROM remediation_plan ORDER BY risk_priority DESC;

-- Result: CVE priority list with SLA
```

---

---

### 4.4 Debugging Slow Queries

**Checklist when query is slow:**

```
1. Run EXPLAIN to see execution plan
2. Check for full table scans (type = ALL)
3. Add indexes on filtered columns
4. Check query logic (unnecessary JOINs? subqueries?)
5. Use ANALYZE to update index statistics
6. Consider query rewrite
7. Check server load (might be resource contention)
```

---

### **Example: Slow Query Debugging**

```sql
-- Slow query reported
SELECT a.alert_id, a.alert_type, u.username
FROM alerts a
JOIN users u ON a.user_id = u.user_id
WHERE a.alert_severity = 'Critical';

-- Step 1: EXPLAIN
EXPLAIN SELECT a.alert_id, a.alert_type, u.username
FROM alerts a
JOIN users u ON a.user_id = u.user_id
WHERE a.alert_severity = 'Critical';

-- Output: Full table scan on alerts (slow!)
-- id | select_type | table | type  | possible_keys | key  | rows
-- 1  | SIMPLE      | a     | ALL   | NULL          | NULL | 1000000  <- ALL means full scan!
-- 1  | SIMPLE      | u     | eq_ref| PRIMARY       | pk   | 1

-- Step 2: Add index on alert_severity
CREATE INDEX idx_alert_severity ON alerts (alert_severity);

-- Step 3: Re-run EXPLAIN
EXPLAIN SELECT a.alert_id, a.alert_type, u.username
FROM alerts a
JOIN users u ON a.user_id = u.user_id
WHERE a.alert_severity = 'Critical';

-- Output: Now uses index!
-- id | select_type | table | type  | possible_keys | key               | rows
-- 1  | SIMPLE      | a     | ref   | idx_alert_sev | idx_alert_sev     | 100   <- Only 100 rows!
-- 1  | SIMPLE      | u     | eq_ref| PRIMARY       | pk                | 1

-- Query now 10x faster (scans 100 rows instead of 1M)
```

---

---

## PHASE 5 & 6: COMPLETE REAL-WORLD PROJECT + INTERVIEW Q&A

### 5.1 End-to-End Project: SOC Incident Analysis

**Scenario:** You're a SOC analyst. Investigate a security incident using SQL.

**Task:** Incident #3 "Malware Detection Network Segment" was created. Your job:
1. Find which alert triggered the incident
2. Identify affected users and devices
3. Analyze network flows from those devices
4. Check device security posture
5. Recommend containment actions

---

### **Solution:**

```sql
-- Step 1: Get incident details
SELECT * FROM incidents WHERE incident_id = 3;
-- Result: Incident 3, Malware Detection, Status: Open, Data Lost: TRUE

-- Step 2: Find related alerts
SELECT 
  ia.alert_id,
  a.alert_type,
  a.alert_severity,
  a.description,
  a.created_at
FROM incident_alerts ia
JOIN alerts a ON ia.alert_id = a.alert_id
WHERE ia.incident_id = 3;
-- Result: Alert 3, Malware IP Communication, Critical

-- Step 3: Find affected IPs and users
SELECT 
  DISTINCT a.user_id,
  u.username,
  u.department,
  u.risk_score,
  i.ip_address,
  i.location,
  i.threat_level
FROM alerts a
LEFT JOIN users u ON a.user_id = u.user_id
LEFT JOIN ip_addresses i ON a.ip_id = i.ip_id
JOIN incident_alerts ia ON a.alert_id = ia.alert_id
WHERE ia.incident_id = 3;
-- Result: Possibly no specific user (network-level malware signal)

-- Step 4: Check devices with suspicious network flows to malware IP
SELECT 
  d.device_id,
  d.device_name,
  d.user_id,
  u.username,
  d.device_type,
  d.is_compromised,
  d.antivirus_installed,
  COUNT(nf.flow_id) as suspicious_flows
FROM network_flows nf
JOIN ip_addresses malware_ip ON nf.dest_ip_id = malware_ip.ip_id
JOIN ip_addresses source_ip ON nf.source_ip_id = source_ip.ip_id
LEFT JOIN devices d ON ... -- Hard to join without device_ip table
LEFT JOIN users u ON d.user_id = u.user_id
WHERE malware_ip.ip_address = '45.142.212.15'  -- Malware IP from alerts
  AND nf.is_suspicious = TRUE
GROUP BY d.device_id, d.device_name;

-- Step 5: Security posture of devices
SELECT 
  u.username,
  COUNT(d.device_id) as total_devices,
  SUM(CASE WHEN d.antivirus_installed = TRUE THEN 1 ELSE 0 END) as av_installed,
  SUM(CASE WHEN d.is_compromised = TRUE THEN 1 ELSE 0 END) as compromised_devices,
  u.risk_score
FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id
GROUP BY u.user_id, u.username, u.risk_score
HAVING compromised_devices > 0;

-- Step 6: Recommended actions
-- Based on findings, recommend:
-- - Isolate compromised devices
-- - Block malware IP at firewall
-- - Require password reset for affected users
-- - Run malware scan on all devices in segment
```

---

---

### 5.2 Interview Questions & Answers (20+ questions)

#### **Junior Questions:**

**Q1: What's the difference between WHERE and HAVING?**
```
A: WHERE filters rows before grouping (on individual rows).
   HAVING filters groups after aggregation.
   
Example:
WHERE status = 'Active'          -- Filters before GROUP BY
HAVING COUNT(*) > 5             -- Filters after GROUP BY
```

**Q2: Write a query to count distinct users.**
```sql
SELECT COUNT(DISTINCT user_id) as unique_users FROM auth_logs;
```

**Q3: How do you find duplicate emails in users table?**
```sql
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
```

---

#### **Intermediate Questions:**

**Q4: Explain INNER vs LEFT JOIN with an example.**
```
A: INNER JOIN returns only matching rows.
   LEFT JOIN returns all rows from left table + matching from right.
   
Example:
SELECT u.username, d.device_name
FROM users u
INNER JOIN devices d ON u.user_id = d.user_id;
-- Only users WITH devices

SELECT u.username, d.device_name
FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id;
-- All users, even those without devices (device columns = NULL)
```

**Q5: Write a query to find users with more than 3 failed logins.**
```sql
SELECT u.username, COUNT(*) as failed_count
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
WHERE al.auth_status = 'Failed'
GROUP BY al.user_id, u.username
HAVING COUNT(*) > 3;
```

**Q6: What's a subquery? When do you use it?**
```
A: Query inside another query. Used when:
- Need result from one query to filter another
- Complex logic easier to read with subqueries
- Window functions unavailable in older databases

Example: Find users with above-average risk score
SELECT username FROM users 
WHERE risk_score > (SELECT AVG(risk_score) FROM users);
```

---

#### **Advanced Questions:**

**Q7: Optimize this query:**
```sql
SELECT DISTINCT u.username 
FROM users u 
JOIN auth_logs al ON u.user_id = al.user_id 
WHERE al.timestamp > NOW() - INTERVAL 7 DAY;
--If this is slow:
-- 1. Add index: CREATE INDEX idx_timestamp ON auth_logs (timestamp);
-- 2. Or change logic: 
SELECT username FROM users 
WHERE user_id IN (SELECT DISTINCT user_id FROM auth_logs WHERE timestamp > NOW() - INTERVAL 7 DAY);
```

**Q8: Write a window function query to rank alerts by severity.**
```sql
SELECT 
  username,
  alert_type,
  alert_severity,
  RANK() OVER (PARTITION BY user_id ORDER BY alert_severity DESC) as severity_rank
FROM alerts a
JOIN users u ON a.user_id = u.user_id;
```

**Q9: What are CTEs and why use them?**
```
A: Common Table Expressions (WITH clause) create named temporary result sets.
   Benefits:
   - Readability (break complex query into steps)
   - Reusability (reference CTE multiple times)
   - Recursion (certain databases support recursive CTEs)
   
Example:
WITH high_risk_users AS (
  SELECT user_id FROM users WHERE risk_score > 50
)
SELECT * FROM high_risk_users;
```

---

#### **Expert Questions:**

**Q10: Design a scalable schema for a logging system with 100B records/day.**
```
A: Partition by date: logs_2024_03, logs_2024_04, etc.
   Indexes: (timestamp, user_id, severity)
   Retention: Keep 90 days hot, archive older
   Schema:
   CREATE TABLE logs_2024_03 (
     log_id BIGINT AUTO_INCREMENT,
     timestamp TIMESTAMP,
     user_id INT,
     severity VARCHAR(10),
     message TEXT,
     PRIMARY KEY (log_id),
     INDEX idx_timestamp (timestamp),
     INDEX idx_user (user_id),
     INDEX idx_severity (severity)
   );
```

**Q11: Explain transaction ACID properties with an example.**
```
A: ACID = Atomic, Consistent, Isolated, Durable

Atomic: All-or-nothing. If 1 operation fails, all rollback.
Consistent: DB always valid state.
Isolated: Concurrent transactions don't interfere.
Durable: Committed data persists even if crash.

Example: Money transfer
START TRANSACTION;
UPDATE accounts SET balance = balance - 1000 WHERE id = 'A';
UPDATE accounts SET balance = balance + 1000 WHERE id = 'B';
COMMIT;
-- If step 2 fails, step 1 rolls back (Atomic)
-- Both succeed together or not at all (Consistent)
-- Other users don't see partial state (Isolated)
-- Once COMMIT, survives crash (Durable)
```

**Q12: How do you detect slow queries in production?**
```
A: Check MySQL slow query log:
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1;  -- Queries > 1 second logged
   
   Then analyze with:
   mysql -u root -p -e "SELECT query_time, query FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;"
   
   Or use EXPLAIN to understand execution plan:
   EXPLAIN SELECT ...;  -- Check for full table scans (type=ALL)
```

---

#### **Scenario Questions (Real SOC Context):**

**Q13: Find all users who accessed production servers in the last 24 hours.**
```sql
SELECT DISTINCT u.username, u.department, MAX(al.timestamp) as last_access
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
JOIN devices d ON al.device_id = d.device_id
WHERE d.device_type = 'Server' 
  AND al.timestamp > NOW() - INTERVAL 1 DAY
  AND al.auth_status = 'Success'
GROUP BY u.user_id, u.username, u.department
ORDER BY last_access DESC;
```

**Q14: Detect potential data exfiltration (large data transfer to external IP).**
```sql
SELECT 
  src.ip_address as internal_ip,
  dst.ip_address as external_ip,
  dst.location,
  SUM(nf.bytes_sent) as bytes_sent,
  COUNT(*) as flow_count
FROM network_flows nf
JOIN ip_addresses src ON nf.source_ip_id = src.ip_id
JOIN ip_addresses dst ON nf.dest_ip_id = dst.ip_id
WHERE src.is_internal = TRUE 
  AND dst.is_internal = FALSE
  AND nf.flow_start > NOW() - INTERVAL 1 DAY
GROUP BY nf.source_ip_id, nf.dest_ip_id, src.ip_address, dst.ip_address, dst.location
HAVING SUM(nf.bytes_sent) > 1000000000  -- > 1 GB = suspicious
ORDER BY bytes_sent DESC;
```

**Q15: Incident response: Find all systems affected by CVE-2023-44487.**
```sql
SELECT DISTINCT
  d.device_id,
  d.device_name,
  d.user_id,
  u.username,
  d.device_type,
  d.os,
  d.os_version
FROM devices d
LEFT JOIN users u ON d.user_id = u.user_id
WHERE d.os_version NOT LIKE '%patched%'  -- Assuming unpatched version indicator
  AND (d.os LIKE '%Windows%' OR d.os LIKE '%Linux%')  -- Assuming vulnerability affects these
ORDER BY d.device_id;
-- Then manually verify or use vulnerability tracking DB
```

---

#### **Trick Questions:**

**Q16: What happens if you run `DELETE FROM users;` without WHERE?**
```
A: DISASTER! All users deleted permanently.
   Prevention: Always use WHERE. Many companies have safeguards:
   - Require LIMIT in DELETE
   - Disable direct delete, use soft delete (update is_active = FALSE)
   - Audit logs capture deletes
   - Backup strategy allows recovery
```

**Q17: If table has 1M rows and you `ORDER BY random_column`, what happens?**
```
A: Database loads all 1M rows into memory, sorts them (slow & expensive).
   Better: Use LIMIT to reduce rows first, or use indexed column.
   
   SLOW:
   SELECT * FROM big_table ORDER BY random_column LIMIT 10;
   
   BETTER:
   SELECT * FROM big_table WHERE indexed_column = 'value' ORDER BY created_at LIMIT 10;
```

---

### 5.3 Mini Challenge Set (Easy → Hard)

**Easy:**
```
1. Get all Critical alerts (3 rows expected)
2. Count total failed authentications
3. List all users in IT department
4. Find device with ID 5
5. Get most recent alert
```

**Medium:**
```
6. Show users and number of devices each has
7. Find incidents with more than 1 alert
8. Detect users with multiple failed logins on different IPs (possible account compromise)
9. List top 3 threat IPs by number of connection attempts
10. Get vulnerabilities overdue for patching (patch_deadline passed)
```

**Hard:**
```
11. Write a query to rank users by alert frequency (using window functions)
12. Create a query that shows percentage of alerts resolved per severity
13. Detect lateral movement (same user accessing multiple systems in <30 minutes)
14. Show incident severity distribution and average resolution time
15. Build a query that gives daily threat metrics (alerts, failed logins, data transfers)
```

---

**End of SQL Masterclass**

---

## Summary Files Created:

1. **SQL_Masterclass_Part1_Foundations.md** → SELECT, WHERE, ORDER BY, LIMIT, INSERT, UPDATE, DELETE
2. **SQL_Masterclass_Part2_Intermediate.md** → JOINS, GROUP BY, AGGREGATE, Subqueries
3. **SQL_Masterclass_Part3_Advanced.md** → Window Functions, CTEs, Indexes, Transactions

Each file is progressive, practical, SOC-focused, and designed for hands-on learning.
