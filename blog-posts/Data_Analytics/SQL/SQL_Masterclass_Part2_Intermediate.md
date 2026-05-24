# SQL Masterclass Part 2: Intermediate Level
## JOINS, GROUP BY, HAVING, Aggregate Functions, Subqueries

---

## PHASE 2: INTERMEDIATE

---

### 2.1 INSERT (Adding Data)

**What it is:** Add new rows to a table.

**Why it's used:** Main way to populate database. Daily operations: new users, new alerts, new logs.

**How it works internally:**
1. Validates data (type checking, constraints, foreign keys).
2. Allocates space in table.
3. Adds row and updates indexes.
4. If error (duplicate key, foreign key violation), entire INSERT is rolled back (ACID property).

**Syntax:**
```sql
-- Single row insert
INSERT INTO table_name (column1, column2, column3) 
VALUES (value1, value2, value3);

-- Multiple rows insert (more efficient)
INSERT INTO table_name (column1, column2, column3) 
VALUES 
  (value1, value2, value3),
  (value4, value5, value6);

-- Insert with SELECT (from another table)
INSERT INTO table_name (column1, column2)
SELECT col_a, col_b FROM another_table WHERE condition;
```

---

### **Real-World Scenario:** "New security alert detected. Add it to the database."

```sql
-- New brute force attempt detected by SIEM
INSERT INTO alerts (user_id, ip_id, alert_type, alert_severity, description) 
VALUES (3, 2, 'Brute Force', 'High', 'User mike_chen had 5 failed attempts in 2 minutes');

-- Query to verify
SELECT alert_id, alert_type, alert_severity, created_at 
FROM alerts 
WHERE user_id = 3 AND alert_type = 'Brute Force'
ORDER BY created_at DESC
LIMIT 1;
```

---

### **Hands-On Examples:**

```sql
-- 1. Add a new user
INSERT INTO users (username, email, department, role, is_active, risk_score) 
VALUES ('bob_miller', 'bob.miller@wf.com', 'Operations', 'Employee', TRUE, 20);

-- 2. Add new IP (external threat)
INSERT INTO ip_addresses (ip_address, is_internal, location, organization, threat_level) 
VALUES ('91.199.77.50', FALSE, 'Ukraine', 'Hosting Provider X', 'Critical');

-- 3. Add multiple failed login attempts at once
INSERT INTO auth_logs (user_id, ip_id, auth_type, auth_status) 
VALUES 
  (3, 2, 'Password', 'Failed'),
  (3, 2, 'Password', 'Failed'),
  (3, 2, 'Password', 'Failed');

-- 4. Batch insert: Copy recent incidents that are Critical to an archive table
-- (Assuming we had an archive_incidents table)
-- INSERT INTO archive_incidents (incident_name, severity, created_at)
-- SELECT incident_name, severity, created_at FROM incidents WHERE severity = 'Critical';

-- 5. Insert with default values (some columns get default)
INSERT INTO devices (user_id, device_name, device_type, os) 
VALUES (1, 'DESKTOP-NEW', 'Server', 'Linux');
-- Note: antivirus_installed defaults to FALSE, is_compromised to FALSE, last_updated to NOW()
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Not specifying columns
```sql
-- Risky: If column order changes, data goes to wrong columns
INSERT INTO users VALUES ('user1', 'user1@test.com', 'IT', 'Admin', TRUE, 5);
```

✅ **GOOD:** Always specify column names
```sql
INSERT INTO users (username, email, department, role, is_active, risk_score) 
VALUES ('user1', 'user1@test.com', 'IT', 'Admin', TRUE, 5);
```

❌ **Mistake 2:** Violating FOREIGN KEY constraints
```sql
-- This fails if user_id 999 doesn't exist
INSERT INTO devices (user_id, device_name, device_type, os) 
VALUES (999, 'DEVICE1', 'Laptop', 'Windows');
-- Error: Foreign key constraint violated
```

✅ **GOOD:** Ensure referenced records exist
```sql
-- First confirm user exists
SELECT * FROM users WHERE user_id = 999;  -- Make sure it exists
INSERT INTO devices (user_id, device_name, device_type, os) 
VALUES (999, 'DEVICE1', 'Laptop', 'Windows');
```

❌ **Mistake 3:** Duplicate key violation
```sql
-- email is UNIQUE; can't insert same email twice
INSERT INTO users (username, email, department, role) 
VALUES ('user_new', 'john.smith@wf.com', 'Finance', 'Employee');
-- Error: Duplicate entry 'john.smith@wf.com' for key 'email'
```

✅ **GOOD:** Use unique emails
```sql
INSERT INTO users (username, email, department, role) 
VALUES ('user_new', 'user_new@wf.com', 'Finance', 'Employee');
```

---

### **Performance Considerations:**

- **Batch inserts are faster:** `INSERT INTO ... VALUES (row1), (row2), (row3)` is faster than 3 separate INSERT statements.
- **Transaction overhead:** Each INSERT is a transaction. Batching reduces transaction overhead.
- **Indexes slow down inserts:** Each new row updates all indexes. Large indexes = slower inserts. This is the trade-off with optimization.

---

### **Interview Questions:**

**Q1:** What's faster: 100 separate INSERT statements or 1 INSERT with 100 VALUES?  
**A:** One INSERT with 100 VALUES (or using batching). Less network round-trips, one transaction overhead.

**Q2:** If email is UNIQUE and you try to INSERT a duplicate email, what happens?  
**A:** Error immediately. The entire INSERT is rolled back (ACID). The table remains unchanged.

---

---

### 2.2 UPDATE (Modifying Data)

**What it is:** Change existing rows.

**Why it's used:** Every day in production: mark alerts as resolved, update user risk scores, update device compliance status.

**How it works internally:**
1. Finds rows matching WHERE clause.
2. Updates specified columns.
3. Updates indexes.
4. Returns count of rows affected.

**Syntax:**
```sql
UPDATE table_name 
SET column1 = value1, column2 = value2, ...
WHERE condition;

-- CRITICAL: Always include WHERE
-- Without WHERE, ALL rows are updated!
```

---

### **Real-World Scenario:** "Alert is resolved. Update it."

```sql
-- Incident handler resolved the brute force alert
UPDATE alerts 
SET is_resolved = TRUE, resolved_at = NOW(),
    resolution_notes = 'False positive - user forgot password, tried multiple combinations'
WHERE alert_id = 1;

-- Verify
SELECT * FROM alerts WHERE alert_id = 1;
-- is_resolved: TRUE, resolved_at: 2024-03-28 14:32:00
```

---

### **Hands-On Examples:**

```sql
-- 1. Mark all unresolved Critical alerts as resolved (SOC cleared them)
UPDATE alerts 
SET is_resolved = TRUE, resolved_at = NOW()
WHERE alert_severity = 'Critical' AND is_resolved = FALSE;

-- 2. Increase risk score of contractors (higher risk profile)
UPDATE users 
SET risk_score = risk_score + 10
WHERE role = 'Contractor';

-- 3. Mark device as compromised after confirming malware
UPDATE devices 
SET is_compromised = TRUE
WHERE device_id = 5;

-- 4. Update vulnerability as patched
UPDATE vulnerabilities 
SET is_patched = TRUE, patch_date = NOW()
WHERE cve_id = 'CVE-2024-5678';

-- 5. Close all non-Critical incidents
UPDATE incidents 
SET status = 'Closed'
WHERE severity != 'Critical' AND status != 'Closed';

-- 6. Update incident after investigation
UPDATE incidents 
SET status = 'Resolved', resolved_at = NOW(), num_users_affected = 1
WHERE incident_id = 1;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Forgot WHERE clause (UPDATE ALL ROWS!)
```sql
-- DISASTER: Updates ALL users' emails to the same value
UPDATE users SET email = 'admin@wf.com';  -- Every user now has same email!
```

✅ **GOOD:** Always use WHERE
```sql
UPDATE users SET email = 'admin@wf.com' 
WHERE user_id = 5;  -- Only update user_id 5
```

❌ **Mistake 2:** Type mismatch
```sql
-- Fails: risk_score is INT, you're setting to a string
UPDATE users SET risk_score = 'very high' WHERE user_id = 1;
```

✅ **GOOD:** Match data types
```sql
UPDATE users SET risk_score = 95 WHERE user_id = 1;
```

❌ **Mistake 3:** Updating with wrong relationships
```sql
-- If you're updating based on a JOIN, be careful with multiple matches
UPDATE devices 
SET is_compromised = TRUE
WHERE user_id IN (SELECT user_id FROM users WHERE department = 'Finance');
-- This updates ALL devices of Finance users!
```

✅ **GOOD:** Be specific
```sql
UPDATE devices 
SET is_compromised = TRUE
WHERE device_id = 3;  -- Or use very specific WHERE
```

---

### **Performance Considerations:**

- **WhereIndex matters:** If you UPDATE rows based on a non-indexed column, database scans all rows. Slow on large tables.
- **Indexes are updated:** Each UPDATE modifies all indexes. Many indexes = slower updates.
- **Transaction locks:** UPDATE locks the rows being changed. Other transactions wait. Can cause bottlenecks.

---

---

### 2.3 DELETE (Removing Data)

**What it is:** Remove rows.

**Why it's used:** Clean up old data (logs older than 90 days), remove test records, archive resolved incidents.

**How it works internally:**
1. Finds rows matching WHERE.
2. Marks them for deletion (doesn't immediately free disk space, depends on database).
3. Updates indexes.
4. Logs deletion for audit trails (in production systems).

**Syntax:**
```sql
DELETE FROM table_name WHERE condition;

-- CRITICAL: Always WHERE
-- Without WHERE, table is completely emptied!
```

---

### **Real-World Scenario:** "Delete old logs (older than 90 days) for compliance."

```sql
-- Clean up old auth logs (keep 90 days)
DELETE FROM auth_logs 
WHERE timestamp < NOW() - INTERVAL 90 DAY;

-- Verify
SELECT COUNT(*) FROM auth_logs;
```

---

### **Hands-On Examples:**

```sql
-- 1. Delete records for a specific user (user deactivated)
DELETE FROM auth_logs WHERE user_id = 1;
-- Note: Only deletes auth_logs. If you have foreign keys, might fail.

-- 2. Delete closed incidents older than 1 year
DELETE FROM incidents 
WHERE status = 'Closed' AND created_at < NOW() - INTERVAL 1 YEAR;

-- 3. Delete resolved alerts older than 30 days
DELETE FROM alerts 
WHERE is_resolved = TRUE AND resolved_at < NOW() - INTERVAL 30 DAY;

-- 4. Delete low-severity vulnerabilities that are already patched
DELETE FROM vulnerabilities 
WHERE severity = 'Low' AND is_patched = TRUE;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** DELETE without WHERE (DELETE EVERYTHING!)
```sql
-- DISASTER: Deletes entire users table!
DELETE FROM users;
```

✅ **GOOD:** Always use WHERE
```sql
DELETE FROM users WHERE user_id = 999;
```

❌ **Mistake 2:** Foreign key constraints block delete
```sql
-- If a user has auth_logs, you can't delete the user
DELETE FROM users WHERE user_id = 1;
-- Error: Cannot delete or update a parent row (foreign key constraint fails)
```

✅ **GOOD:** Options:
```sql
-- Option 1: Delete dependent rows first
DELETE FROM auth_logs WHERE user_id = 1;
DELETE FROM users WHERE user_id = 1;

-- Option 2: Set FK to ON DELETE CASCADE (design-time choice)
-- This automatically deletes dependent rows when parent deleted
```

❌ **Mistake 3:** Deleting data you might need later
```sql
-- Deletes all incidents without keeping a backup
DELETE FROM incidents;
```

✅ **GOOD:** Archive before deleting
```sql
-- If you have archive table, copy first
INSERT INTO incidents_archive SELECT * FROM incidents WHERE status = 'Closed';
-- Then delete
DELETE FROM incidents WHERE status = 'Closed';
```

---

### **Performance Considerations:**

- **DELETE is expensive:** Scans all rows matching WHERE, updates indexes, logs changes.
- **Disk space not freed immediately:** Depends on database. Some databases need VACUUM/OPTIMIZE to reclaim space.
- **Large deletes should be batched:** DELETE up to 10K rows, commit, repeat. Prevents long locks.

---

---

### 2.4 JOINS (Combining Data)

**What it is:** Combine rows from multiple tables based on a condition (usually matching IDs).

**Why it's used:** Data is normalized (spread across tables). Joins reassemble it.
- Example: auth_logs has user_id, but username is in users table. Use JOIN to get both.

**How it works internally:**
1. Database has two or more result sets (one from each table).
2. Matches rows based on ON condition (e.g., auth_logs.user_id = users.user_id).
3. Combines matching rows.
4. Returns combined result.

**Syntax:**

```sql
-- INNER JOIN (only matching rows)
SELECT a.col, b.col FROM table_a a
INNER JOIN table_b b ON a.id = b.id;

-- LEFT JOIN (all rows from left table, matching from right)
SELECT a.col, b.col FROM table_a a
LEFT JOIN table_b b ON a.id = b.id;

-- RIGHT JOIN (all rows from right table, matching from left)
SELECT a.col, b.col FROM table_a a
RIGHT JOIN table_b b ON a.id = b.id;

-- FULL OUTER JOIN (all rows from both tables)
SELECT a.col, b.col FROM table_a a
FULL OUTER JOIN table_b b ON a.id = b.id;
```

---

### **2.4.1 INNER JOIN (Only Matching Rows)**

```sql
-- Get authentication logs with usernames
SELECT 
  al.log_id,
  u.username,
  al.auth_status,
  al.timestamp
FROM auth_logs al
INNER JOIN users u ON al.user_id = u.user_id
WHERE al.auth_status = 'Failed';

-- Result:
-- log_id | username  | auth_status | timestamp
-- 4      | mike_chen | Failed      | 2024-03-28 10:15:00
-- 5      | mike_chen | Failed      | 2024-03-28 10:16:00
-- ...

-- Interpretation: 
-- For each auth_log row, find the matching user row (by user_id)
-- Return columns from both tables
-- INNER JOIN means: only rows where user_id exists in both tables
```

---

### **2.4.2 LEFT JOIN (All Left Rows, Matching Right Rows)**

```sql
-- Get all users and their devices (even if no devices)
SELECT 
  u.user_id,
  u.username,
  d.device_id,
  d.device_name,
  d.device_type
FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id
ORDER BY u.user_id;

-- Result:
-- user_id | username        | device_id | device_name  | device_type
-- 1       | john_smith      | 1         | LAPTOP-JOHN  | Laptop
-- 1       | john_smith      | 2         | PHONE-JOHN   | Mobile
-- 2       | sarah_jones     | 3         | SERVER-AD    | Server
-- 3       | mike_chen       | 4         | LAPTOP-MIKE  | Laptop
-- 4       | alex_contractor | 5         | LAPTOP-ALEX  | Laptop
-- 5       | admin_user      | 6         | SERVER-PROD  | Server

-- If a user had no devices, still shown (with device columns as NULL):
-- 999     | new_user        | NULL      | NULL         | NULL
```

---

### **2.4.3 RIGHT JOIN**

```sql
-- Get all devices and their users (reverse of LEFT JOIN)
SELECT 
  d.device_id,
  d.device_name,
  u.username,
  u.department
FROM devices d
RIGHT JOIN users u ON d.user_id = u.user_id;

-- Usually, you'd just do LEFT JOIN with tables reversed:
SELECT 
  u.user_id,
  u.username,
  d.device_id,
  d.device_name
FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id;
-- Same result as the RIGHT JOIN above
```

---

### **Real-World Scenario:** "Alert triggered. Show user, device, and IP details."

```sql
SELECT 
  a.alert_id,
  a.alert_type,
  a.alert_severity,
  u.username,
  u.email,
  u.department,
  i.ip_address,
  i.location,
  i.threat_level,
  a.created_at
FROM alerts a
LEFT JOIN users u ON a.user_id = u.user_id
LEFT JOIN ip_addresses i ON a.ip_id = i.ip_id
WHERE a.alert_id = 2;

-- Result:
-- alert_id | alert_type           | alert_severity | username   | email              | department | ip_address      | location | threat_level | created_at
-- 2        | Impossible Travel    | Critical       | john_smith | john.smith@wf.com  | Finance    | 203.45.67.89    | Moscow   | Critical     | 2024-03-28 08:00:00
```

**Action:** User john_smith from Moscow (impossible travel from company location). Critical threat!

---

### **Hands-On Examples:**

```sql
-- 1. Get alerts with username and IP address
SELECT 
  a.alert_id,
  a.alert_type,
  u.username,
  i.ip_address,
  i.threat_level
FROM alerts a
LEFT JOIN users u ON a.user_id = u.user_id
LEFT JOIN ip_addresses i ON a.ip_id = i.ip_id
ORDER BY a.alert_severity DESC;

-- 2. Find incidents with alert details
SELECT 
  inc.incident_id,
  inc.incident_name,
  inc.severity,
  COUNT(ia.alert_id) as num_alerts
FROM incidents inc
LEFT JOIN incident_alerts ia ON inc.incident_id = ia.incident_id
GROUP BY inc.incident_id;

-- 3. Get users and their last login time
SELECT 
  u.user_id,
  u.username,
  u.department,
  MAX(al.timestamp) as last_login
FROM users u
LEFT JOIN auth_logs al ON u.user_id = al.user_id
GROUP BY u.user_id
ORDER BY last_login DESC;

-- 4. Get devices with their users and compromised status
SELECT 
  u.username,
  d.device_name,
  d.device_type,
  d.is_compromised,
  d.antivirus_installed
FROM users u
INNER JOIN devices d ON u.user_id = d.user_id
WHERE d.is_compromised = TRUE;

-- 5. Find network flows with source and destination IPs
SELECT 
  nf.flow_id,
  src.ip_address as source_ip,
  dst.ip_address as dest_ip,
  nf.protocol,
  nf.bytes_sent,
  nf.is_suspicious
FROM network_flows nf
INNER JOIN ip_addresses src ON nf.source_ip_id = src.ip_id
INNER JOIN ip_addresses dst ON nf.dest_ip_id = dst.ip_id
WHERE nf.is_suspicious = TRUE;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Ambiguous column names (column exists in both tables)
```sql
-- Fails: Which table_id?
SELECT table_id FROM users u
JOIN devices d ON u.user_id = d.user_id;
```

✅ **GOOD:** Specify table
```sql
SELECT u.user_id, d.device_id FROM users u
JOIN devices d ON u.user_id = d.user_id;
```

❌ **Mistake 2:** Wrong JOIN type (losing data)
```sql
-- If you use INNER JOIN but some users have no devices, those users disappear!
SELECT u.username, d.device_name FROM users u
INNER JOIN devices d ON u.user_id = d.user_id;
-- Missing users with no devices
```

✅ **GOOD:** Use LEFT JOIN to keep all users
```sql
SELECT u.username, d.device_name FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id;
```

❌ **Mistake 3:** Dangling join condition
```sql
-- Confusing: Orders and Customers not related somehow
SELECT * FROM auth_logs JOIN ip_addresses;
-- ERROR: No ON clause specified
```

✅ **GOOD:** Always specify ON condition
```sql
SELECT * FROM auth_logs a
JOIN ip_addresses i ON a.ip_id = i.ip_id;
```

---

### **Performance Considerations:**

- **Join is expensive:** Requires scanning both tables, matching rows.
- **Indexes on join columns matter:** If user_id is indexed in both tables, JOIN is fast.
- **Avoid unnecessary joins:** Only join tables you actually need.
- **Join order matters:** Database optimizer reorders JOINs for performance. Trust it, but be aware.

---

---

### 2.5 GROUP BY (Aggregating Data)

**What it is:** Group rows by column value, then apply aggregate functions.

**Why it's used:** Reporting: "How many failed logins per user?", "How many alerts per severity?", "Total bytes sent per IP?"

**How it works internally:**
1. Groups rows by specified column (e.g., all rows with user_id=1, then all with user_id=2, etc.).
2. For each group, applies aggregate function (COUNT, SUM, AVG, etc.).
3. Returns one row per group with aggregate result.

**Syntax:**

```sql
SELECT column_to_group, aggregate_function(column_to_aggregate)
FROM table
GROUP BY column_to_group
ORDER BY aggregate_result DESC;
```

---

### **Hands-On Examples:**

```sql
-- 1. Count failed logins per user
SELECT 
  u.username,
  COUNT(*) as failed_attempts
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
WHERE al.auth_status = 'Failed'
GROUP BY al.user_id, u.username
ORDER BY failed_attempts DESC;

-- Result:
-- username   | failed_attempts
-- mike_chen  | 3
-- john_smith | 2

-- 2. Count alerts per severity
SELECT 
  alert_severity,
  COUNT(*) as count
FROM alerts
GROUP BY alert_severity
ORDER BY count DESC;

-- Result:
-- alert_severity | count
-- High           | 3
-- Critical       | 2
-- Medium         | 1

-- 3. Count devices per user
SELECT 
  u.username,
  COUNT(d.device_id) as device_count
FROM users u
LEFT JOIN devices d ON u.user_id = d.user_id
GROUP BY u.user_id, u.username
ORDER BY device_count DESC;

-- 4. Total bytes sent per source IP
SELECT 
  src.ip_address as source_ip,
  SUM(nf.bytes_sent) as total_bytes_sent
FROM network_flows nf
JOIN ip_addresses src ON nf.source_ip_id = src.ip_id
GROUP BY nf.source_ip_id, src.ip_address
ORDER BY total_bytes_sent DESC;

-- 5. Average CVSS score per severity level
SELECT 
  severity,
  AVG(CVSS_score) as avg_cvss,
  COUNT(*) as vuln_count
FROM vulnerabilities
GROUP BY severity
ORDER BY avg_cvss DESC;
```

---

### **2.5.1 HAVING Clause (Filter Groups)**

Sometimes you want to filter groups (not individual rows). Use HAVING.

```sql
-- Get users with MORE THAN 2 failed logins
SELECT 
  u.username,
  COUNT(*) as failed_attempts
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
WHERE al.auth_status = 'Failed'
GROUP BY al.user_id, u.username
HAVING COUNT(*) > 2  -- Filter after GROUP BY
ORDER BY failed_attempts DESC;

-- Result:
-- username  | failed_attempts
-- mike_chen | 3           <- Only mike_chen has >2 failures

-- Difference:
-- WHERE filters BEFORE grouping (on individual rows)
-- HAVING filters AFTER grouping (on aggregates)
```

---

### **More GROUP BY Examples:**

```sql
-- 1. Incidents with more than 1 alert
SELECT 
  inc.incident_id,
  inc.incident_name,
  COUNT(ia.alert_id) as alert_count
FROM incidents inc
LEFT JOIN incident_alerts ia ON inc.incident_id = ia.incident_id
GROUP BY inc.incident_id
HAVING COUNT(ia.alert_id) > 1
ORDER BY alert_count DESC;

-- 2. Devices with NO antivirus and their user count
SELECT 
  COUNT(DISTINCT d.user_id) as users_with_unprotected_devices,
  COUNT(d.device_id) as device_count
FROM devices d
WHERE d.antivirus_installed = FALSE;

-- 3. Authors who contributed more than 10 vulnerabilities (if we had author column)
-- SELECT author, COUNT(*) as vuln_count FROM vulnerabilities
-- GROUP BY author HAVING COUNT(*) > 10;

-- 4. Most recent timestamp per user
SELECT 
  u.username,
  MAX(al.timestamp) as last_auth,
  COUNT(*) as total_logins
FROM auth_logs al
JOIN users u ON al.user_id = u.user_id
GROUP BY al.user_id, u.username
ORDER BY last_auth DESC;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Non-aggregated column in SELECT not in GROUP BY
```sql
-- Fails: alert_type not aggregated and not in GROUP BY
SELECT alert_type, COUNT(*) FROM alerts GROUP BY alert_severity;
-- Error: alert_type not in GROUP BY clause
```

✅ **GOOD:** All non-aggregated columns must be in GROUP BY
```sql
SELECT alert_type, alert_severity, COUNT(*) FROM alerts 
GROUP BY alert_type, alert_severity;
```

❌ **Mistake 2:** Using WHERE instead of HAVING to filter aggregates
```sql
-- Fails: Can't use WHERE on aggregate
SELECT alert_severity, COUNT(*) FROM alerts WHERE COUNT(*) > 2 GROUP BY alert_severity;
```

✅ **GOOD:** Use HAVING
```sql
SELECT alert_severity, COUNT(*) FROM alerts 
GROUP BY alert_severity 
HAVING COUNT(*) > 2;
```

---

---

### 2.6 Aggregate Functions

**What they are:** Functions that operate on groups of rows and return single value.

**Common aggregate functions:**

```sql
COUNT(column)     -- Count non-NULL values
SUM(column)       -- Sum of values
AVG(column)       -- Average of values
MIN(column)       -- Minimum value
MAX(column)       -- Maximum value
COUNT(DISTINCT c) -- Count unique values
```

---

### **Examples:**

```sql
-- Count total rows
SELECT COUNT(*) FROM users;  -- 5

-- Count failed logins
SELECT COUNT(*) FROM auth_logs WHERE auth_status = 'Failed';  -- 5

-- Count distinct users who had alerts
SELECT COUNT(DISTINCT user_id) FROM alerts;  -- 3 (multiple users)

-- Sum bytes in network flows
SELECT SUM(bytes_sent) as total_bytes_sent FROM network_flows;  -- Large number

-- Average CVSS score
SELECT AVG(CVSS_score) FROM vulnerabilities;  -- 6.7 or similar

-- Min and Max CVSS
SELECT MIN(CVSS_score), MAX(CVSS_score) FROM vulnerabilities;
-- MIN: 3.5, MAX: 10.0

-- Count devices per alert (complex)
SELECT 
  alert_severity,
  COUNT(DISTINCT device_id) as affected_devices
FROM alerts a
LEFT JOIN devices d ON a.user_id = d.user_id
GROUP BY alert_severity;
```

---

---

### 2.7 Subqueries (Queries Within Queries)

**What it is:** A query inside another query. Inner query runs first, result used by outer query.

**Why it's used:** Complex logic, finding rows matching criteria from another query.

**How it works internally:**
1. Inner query executes first.
2. Result stored in temporary result set.
3. Outer query uses that result set.

**Syntax:**

```sql
SELECT * FROM table1 WHERE column IN (SELECT column FROM table2 WHERE condition);

-- Or with SELECT subquery:
SELECT (SELECT COUNT(*) FROM table2) FROM table1;
```

---

### **Examples:**

```sql
-- 1. Find users who had alerts
SELECT username, email FROM users 
WHERE user_id IN (SELECT DISTINCT user_id FROM alerts WHERE user_id IS NOT NULL);

-- 2. Find alerts from high-risk IPs
SELECT alert_id, alert_type FROM alerts 
WHERE ip_id IN (SELECT ip_id FROM ip_addresses WHERE threat_level = 'Critical');

-- 3. Get incidents that affected more than 1 user
SELECT incident_id, incident_name, num_users_affected FROM incidents 
WHERE num_users_affected > (SELECT AVG(num_users_affected) FROM incidents);

-- 4. Complex: Find devices from users with risk score > 20
SELECT device_name, device_type FROM devices 
WHERE user_id IN (
  SELECT user_id FROM users WHERE risk_score > 20
);

-- 5. With Exists:
SELECT username FROM users u WHERE EXISTS (
  SELECT 1 FROM auth_logs al WHERE al.user_id = u.user_id AND al.auth_status = 'Failed'
);
-- More efficient for checking existence
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Subquery returns multiple rows, used with = (expects single value)
```sql
-- Fails: subquery returns multiple values
SELECT * FROM users WHERE user_id = (SELECT user_id FROM auth_logs);
-- Error: Subquery returned more than 1 row
```

✅ **GOOD:** Use IN for multiple values
```sql
SELECT * FROM users WHERE user_id IN (SELECT user_id FROM auth_logs);
```

---

### **Practice Task 5:**

```
Task 1: Count how many alerts are attributed to each severity level
Expected: 6 alerts grouped by severity

Task 2: Get all users with their device count (use LEFT JOIN + GROUP BY)
Expected: 5 users with device counts

Task 3: Find users with more than 1 device
Expected: 1 user (john_smith with 2 devices)

Task 4: Get incidents with count of related alerts
Expected: 4 incidents with alert counts
```

**Solutions:**
```sql
-- Task 1
SELECT alert_severity, COUNT(*) as count FROM alerts GROUP BY alert_severity;

-- Task 2
SELECT u.username, COUNT(d.device_id) as device_count 
FROM users u 
LEFT JOIN devices d ON u.user_id = d.user_id 
GROUP BY u.user_id, u.username;

-- Task 3
SELECT u.username, COUNT(d.device_id) as device_count 
FROM users u 
LEFT JOIN devices d ON u.user_id = d.user_id 
GROUP BY u.user_id, u.username 
HAVING COUNT(d.device_id) > 1;

-- Task 4
SELECT inc.incident_id, inc.incident_name, COUNT(ia.alert_id) as alert_count 
FROM incidents inc 
LEFT JOIN incident_alerts ia ON inc.incident_id = ia.incident_id 
GROUP BY inc.incident_id;
```

---

**[Document continues in files: SQL_Masterclass_Part3_Advanced.md, SQL_Masterclass_Part4_Expert.md, etc.]**

---

**End of Part 2: Intermediate Level**

Next level focuses on:
- Window functions (ROW_NUMBER, RANK, LAG, LEAD)
- CTEs (WITH clause)
- Advanced indexing strategies
- Query optimization
- Production performance tuning

