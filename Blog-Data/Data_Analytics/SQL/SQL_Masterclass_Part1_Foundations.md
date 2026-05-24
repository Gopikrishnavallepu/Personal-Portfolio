# SQL Masterclass: From Beginner to Expert
## Real-World SOC Database System (Practical, Hands-On)

**Experience Level:** Senior Data Engineer / Database Architect  
**Teaching Style:** Zero Theory, 100% Practical Application  
**Real-world Context:** Security Operations Center (SOC) System  

---

## PART 0: DATABASE DESIGN & SETUP

### Our Playground: A Security Operations Center (SOC) Database

You work at Wells Fargo's Security Operations Center. Your database tracks:
- **Users:** Employees, contractors, external admins
- **Devices:** Company laptops, servers, mobile devices
- **IPs:** Internal IPs, external IPs, VPN addresses
- **Logs:** Authentication attempts, network flows, system events
- **Alerts:** Security alerts triggered by SIEM
- **Incidents:** Formal security incidents created from alerts
- **Vulnerabilities:** CVEs discovered and their remediation status

This is how **real SOC systems work**—you query this data 100 times per day to investigate threats.

---

### Database Schema (Production-Grade)

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS soc_db;
USE soc_db;

-- Table 1: Users (employees, contractors)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),           -- Finance, IT, Sales, etc.
    role VARCHAR(50),                  -- Employee, Contractor, Admin
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risk_score INT DEFAULT 0           -- 0-100, higher = more suspicious
);

-- Table 2: Devices (laptops, servers, mobile)
CREATE TABLE devices (
    device_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    device_name VARCHAR(100),          -- LAPTOP-JOHN, SERVER-01, etc.
    device_type VARCHAR(50),           -- Laptop, Server, Mobile
    os VARCHAR(50),                    -- Windows, Linux, macOS, iOS
    os_version VARCHAR(50),
    antivirus_installed BOOLEAN,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_compromised BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table 3: IP Addresses (internal & external)
CREATE TABLE ip_addresses (
    ip_id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(15) UNIQUE NOT NULL,
    is_internal BOOLEAN,              -- TRUE = company network, FALSE = external
    location VARCHAR(100),            -- City, country
    organization VARCHAR(100),        -- ISP or company name
    threat_level VARCHAR(20),         -- Low, Medium, High, Critical
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Authentication Logs (login attempts, VPN connections)
CREATE TABLE auth_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_id INT NOT NULL,
    device_id INT NULL,
    auth_type VARCHAR(50),            -- Password, MFA, Certificate, SSO
    auth_status VARCHAR(20),          -- Success, Failed, MFA_Denied
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_duration_minutes INT NULL, -- How long user stayed logged in
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (ip_id) REFERENCES ip_addresses(ip_id),
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

-- Table 5: Alerts (triggered by SIEM rules)
CREATE TABLE alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    ip_id INT NULL,
    alert_type VARCHAR(100),          -- Brute Force, Malware, Data Exfiltration, etc.
    alert_severity VARCHAR(20),       -- Low, Medium, High, Critical
    description TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (ip_id) REFERENCES ip_addresses(ip_id)
);

-- Table 6: Incidents (formal security incidents)
CREATE TABLE incidents (
    incident_id INT PRIMARY KEY AUTO_INCREMENT,
    incident_name VARCHAR(100),
    severity VARCHAR(20),             -- Low, Medium, High, Critical
    status VARCHAR(50),               -- Open, In Progress, Resolved, Closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    description TEXT,
    num_users_affected INT DEFAULT 0,
    data_lost BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
);

-- Table 7: Incident-Alert Mapping (many alerts can relate to 1 incident)
CREATE TABLE incident_alerts (
    incident_id INT NOT NULL,
    alert_id INT NOT NULL,
    PRIMARY KEY (incident_id, alert_id),
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id),
    FOREIGN KEY (alert_id) REFERENCES alerts(alert_id)
);

-- Table 8: Vulnerabilities (CVEs, tracked remediation)
CREATE TABLE vulnerabilities (
    vuln_id INT PRIMARY KEY AUTO_INCREMENT,
    cve_id VARCHAR(20) UNIQUE,        -- CVE-2023-1234
    severity VARCHAR(20),            -- Low, Medium, High, Critical
    affected_systems INT,            -- How many systems have this CVE?
    is_patched BOOLEAN DEFAULT FALSE,
    discovered_date TIMESTAMP,
    patch_deadline TIMESTAMP,
    patch_date TIMESTAMP NULL,
    CVSS_score DECIMAL(3, 1)         -- 0.0 - 10.0
);

-- Table 9: Network Flows (connection data)
CREATE TABLE network_flows (
    flow_id INT PRIMARY KEY AUTO_INCREMENT,
    source_ip_id INT NOT NULL,
    dest_ip_id INT NOT NULL,
    protocol VARCHAR(20),            -- TCP, UDP, ICMP
    source_port INT,
    dest_port INT,
    bytes_sent BIGINT,               -- Data transferred
    bytes_received BIGINT,
    flow_start TIMESTAMP,
    flow_end TIMESTAMP,
    is_suspicious BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (source_ip_id) REFERENCES ip_addresses(ip_id),
    FOREIGN KEY (dest_ip_id) REFERENCES ip_addresses(ip_id)
);
```

---

### Sample Data (Realistic SOC Dataset)

```sql
-- Insert 5 employees
INSERT INTO users (username, email, department, role, is_active, risk_score) VALUES
('john_smith', 'john.smith@wf.com', 'Finance', 'Employee', TRUE, 5),
('sarah_jones', 'sarah.jones@wf.com', 'IT', 'Admin', TRUE, 10),
('mike_chen', 'mike.chen@wf.com', 'Sales', 'Employee', TRUE, 15),
('alex_contractor', 'alex@external.com', 'Consulting', 'Contractor', TRUE, 45),
('admin_user', 'admin@wf.com', 'IT', 'Admin', TRUE, 8);

-- Insert devices
INSERT INTO devices (user_id, device_name, device_type, os, os_version, antivirus_installed, is_compromised) VALUES
(1, 'LAPTOP-JOHN', 'Laptop', 'Windows', '11', TRUE, FALSE),
(1, 'PHONE-JOHN', 'Mobile', 'iOS', '17.3', TRUE, FALSE),
(2, 'SERVER-AD', 'Server', 'Windows', 'Server 2022', TRUE, FALSE),
(3, 'LAPTOP-MIKE', 'Laptop', 'Windows', '11', FALSE, FALSE),  -- No AV!
(4, 'LAPTOP-ALEX', 'Laptop', 'macOS', 'Sonoma', TRUE, FALSE),
(5, 'SERVER-PROD', 'Server', 'Linux', 'Ubuntu 22.04', TRUE, FALSE);

-- Insert IP addresses
INSERT INTO ip_addresses (ip_address, is_internal, location, organization, threat_level, last_seen) VALUES
('10.0.1.10', TRUE, 'HQ-Floor1', 'Wells Fargo Internal', 'Low', NOW()),
('10.0.2.50', TRUE, 'HQ-Floor2', 'Wells Fargo Internal', 'Low', NOW()),
('10.0.3.100', TRUE, 'DataCenter', 'Wells Fargo Internal', 'Low', NOW()),
('192.168.1.1', TRUE, 'VPN-Gateway', 'Wells Fargo VPN', 'Low', NOW()),
('203.45.67.89', FALSE, 'Moscow', 'Unknown ISP', 'Critical', NOW()),  -- Suspicious!
('8.8.8.8', FALSE, 'USA', 'Google DNS', 'Low', NOW()),
('45.142.212.15', FALSE, 'Romania', 'DataCenter Pro', 'High', NOW());  -- Threat IP

-- Insert authentication logs (realistic scenarios)
INSERT INTO auth_logs (user_id, ip_id, device_id, auth_type, auth_status, session_duration_minutes) VALUES
(1, 1, 1, 'Password+MFA', 'Success', 480),      -- 8 hours, normal
(1, 1, 1, 'Password+MFA', 'Success', 380),      -- Next day
(3, 2, 4, 'Password', 'Success', 60),           -- Mike, shorter session
(3, 2, 4, 'Password', 'Failed', NULL),          -- Failed attempt
(3, 2, 4, 'Password', 'Failed', NULL),          -- Another failed attempt
(3, 2, 4, 'Password', 'Failed', NULL),          -- And another
(4, 3, 5, 'Certificate', 'Success', 120),       -- Contractor VPN
(1, 5, 1, 'Password', 'Failed', NULL),          -- John's IP from critical threat IP?
(1, 5, 1, 'Password', 'Failed', NULL),          -- Brute force alert!
(2, 1, 2, 'SSO', 'Success', 600),               -- Admin login, long session
(5, 3, 6, 'Certificate', 'Success', 1440);     -- Prod admin, all day

-- Insert alerts (triggered by SIEM rules)
INSERT INTO alerts (user_id, ip_id, alert_type, alert_severity, description, is_resolved) VALUES
(3, 2, 'Brute Force', 'High', 'User mike_chen had 3 failed login attempts in 5 min', FALSE),
(1, 5, 'Impossible Travel', 'Critical', 'User john_smith login from critical threat IP (Moscow)', FALSE),
(NULL, 7, 'Malware IP Communication', 'Critical', 'Detected connection to known malware IP 45.142.212.15', FALSE),
(3, 2, 'Anomalous Behavior', 'Medium', 'User accessing more files than usual', TRUE),
(4, 3, 'VPN Anomaly', 'High', 'Contractor accessed restricted database via VPN', FALSE),
(2, 1, 'Admin Access', 'Low', 'Admin user_id=2 accessed security logs', TRUE);

-- Insert incidents
INSERT INTO incidents (incident_name, severity, status, num_users_affected, data_lost) VALUES
('Brute Force Attack on Sales Department', 'High', 'In Progress', 1, FALSE),
('Possible Account Compromise - Finance', 'Critical', 'Open', 1, FALSE),
('Malware Detection Network Segment', 'Critical', 'Open', 3, TRUE),
('Unauthorized VPN Access', 'High', 'Resolved', 1, FALSE);

-- Map alerts to incidents
INSERT INTO incident_alerts (incident_id, alert_id) VALUES
(1, 1),  -- Brute force alert → incident 1
(2, 2),  -- Impossible travel → incident 2
(3, 3),  -- Malware → incident 3
(4, 5);  -- VPN anomaly → incident 4

-- Insert vulnerabilities
INSERT INTO vulnerabilities (cve_id, severity, affected_systems, discovered_date, patch_deadline, CVSS_score) VALUES
('CVE-2023-44487', 'Critical', 50, '2023-10-01', '2023-10-15', 10.0),
('CVE-2024-1234', 'High', 120, '2024-01-10', '2024-02-10', 8.5),
('CVE-2024-5678', 'Medium', 30, '2024-02-01', '2024-03-15', 6.2),
('CVE-2024-9999', 'Low', 5, '2024-03-01', '2024-04-01', 3.5);

-- Add a few patches
UPDATE vulnerabilities SET is_patched = TRUE, patch_date = '2023-10-14' WHERE cve_id = 'CVE-2023-44487';
UPDATE vulnerabilities SET is_patched = TRUE, patch_date = '2024-02-08' WHERE cve_id = 'CVE-2024-1234';

-- Insert network flows
INSERT INTO network_flows (source_ip_id, dest_ip_id, protocol, source_port, dest_port, bytes_sent, bytes_received, flow_start, flow_end, is_suspicious) VALUES
(1, 3, 'TCP', 54321, 443, 1024, 2048, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, FALSE),
(2, 3, 'TCP', 54322, 3306, 512, 50000, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 50 MINUTE, TRUE),  -- Large data transfer
(1, 6, 'TCP', 54323, 53, 256, 256, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 25 MINUTE, FALSE),
(5, 3, 'TCP', 54324, 22, 128, 1024, NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 10 MINUTE, TRUE); -- Suspicious SSH
```

---

### Verify Your Setup

Run this to confirm everything is created:

```sql
-- Show all tables
SHOW TABLES;

-- Count rows in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'ip_addresses', COUNT(*) FROM ip_addresses
UNION ALL
SELECT 'auth_logs', COUNT(*) FROM auth_logs
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'incidents', COUNT(*) FROM incidents
UNION ALL
SELECT 'vulnerabilities', COUNT(*) FROM vulnerabilities
UNION ALL
SELECT 'network_flows', COUNT(*) FROM network_flows;
```

**Expected output:**
```
users: 5
devices: 6
ip_addresses: 7
auth_logs: 11
alerts: 6
incidents: 4
vulnerabilities: 4
network_flows: 4
```

---

---

## PHASE 1: FOUNDATIONS
### SELECT, WHERE, ORDER BY, LIMIT, INSERT, UPDATE, DELETE

---

### 1.1 SELECT Basics

**What it is:** Retrieve data from a table.

**Why it's used:** This is 80% of what you'll do in production. You read WAY more often than you write.

**How it works internally:**
1. Database scans the table (or index, for optimization).
2. Finds matching rows based on conditions (if any).
3. Returns columns you asked for.
4. If very large, returns in chunks to avoid memory overload.

**Syntax:**
```sql
SELECT column1, column2, ... FROM table_name;
SELECT * FROM table_name;  -- All columns
```

---

### **Real-World Scenario:** Your SOC manager asks: "Who are our users?"

```sql
-- Get all users with their details
SELECT user_id, username, email, department, role, risk_score 
FROM users;

-- Result:
-- user_id | username        | email                  | department | role       | risk_score
-- 1       | john_smith      | john.smith@wf.com      | Finance    | Employee   | 5
-- 2       | sarah_jones     | sarah.jones@wf.com     | IT         | Admin      | 10
-- 3       | mike_chen       | mike.chen@wf.com       | Sales      | Employee   | 15
-- 4       | alex_contractor | alex@external.com      | Consulting | Contractor | 45
-- 5       | admin_user      | admin@wf.com           | IT         | Admin      | 8
```

---

### **Hands-On Examples:**

```sql
-- 1. Get usernames and emails only (subset of columns)
SELECT username, email FROM users;

-- 2. Get all device information
SELECT * FROM devices;

-- 3. Get IP addresses (external only)
SELECT ip_address, location, organization FROM ip_addresses;

-- 4. Check all alerts in the system
SELECT alert_id, alert_type, alert_severity, description FROM alerts;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Selecting too much data unnecessarily
```sql
-- BAD: Always returning 1000s of rows
SELECT * FROM network_flows;  -- What if you have 1M flows?
```

✅ **GOOD:** Be specific
```sql
SELECT flow_id, source_ip_id, dest_ip_id, is_suspicious FROM network_flows WHERE is_suspicious = TRUE;
```

❌ **Mistake 2:** Forgetting table names in ambiguous queries
```sql
-- Will fail if multiple tables have 'user_id'
SELECT user_id FROM devices, auth_logs;
```

✅ **GOOD:** Specify the table
```sql
SELECT devices.device_id, devices.user_id FROM devices;
```

---

### **Performance Considerations:**

- **Columns matter:** `SELECT *` is lazy. In production, always specify columns you need.
  - If you have 50 columns but only need 3, selecting * loads 50 into memory.
  - Explicit columns = less I/O = faster query.

- **Later, we'll add indexes** to make SELECT fast (Phase 3).

---

### **Interview Questions:**

**Q1:** What's the difference between `SELECT *` and `SELECT column1, column2`?  
**A:** SELECT * returns all columns; slower if you don't need all data. SELECT specific columns = faster.

**Q2:** If you have a table with 100M rows and run `SELECT * FROM table`, what happens?  
**A:** The database returns rows in chunks (depends on fetch size, default ~1000), but loading all 100M rows into memory is bad practice. You'd use LIMIT or WHERE to reduce results.

---

### **Practice Task 1:**

```
Task: Write a query to get the username and risk_score for all users.
Expected output: 5 rows with username and risk_score columns
```

**Solution:**
```sql
SELECT username, risk_score FROM users;
```

---

---

### 1.2 WHERE Clause (Filtering)

**What it is:** Filter rows based on conditions.

**Why it's used:** 99% of queries have WHERE. You rarely want ALL data.

**How it works internally:**
1. Database reads table (or index).
2. For each row, evaluates the condition (e.g., `department = 'Finance'`).
3. Includes only rows where condition = TRUE.
4. Returns filtered results.

**Syntax:**
```sql
SELECT columns FROM table WHERE condition;

-- Conditions:
-- = (equal), != or <> (not equal)
-- > (greater), < (less), >= (greater equal), <= (less equal)
-- AND, OR, NOT
-- IN, NOT IN
-- BETWEEN, NOT BETWEEN
-- IS NULL, IS NOT NULL
-- LIKE (pattern matching)
```

---

### **Real-World Scenario:** "Show me all failed login attempts."

```sql
SELECT log_id, user_id, ip_id, auth_type, auth_status, timestamp
FROM auth_logs
WHERE auth_status = 'Failed';

-- Result:
-- log_id | user_id | ip_id | auth_type      | auth_status | timestamp
-- 4      | 3       | 2     | Password       | Failed      | 2024-03-28 10:15:00
-- 5      | 3       | 2     | Password       | Failed      | 2024-03-28 10:16:00
-- 6      | 3       | 2     | Password       | Failed      | 2024-03-28 10:17:00
-- 8      | 1       | 5     | Password       | Failed      | 2024-03-28 11:00:00
-- 9      | 1       | 5     | Password       | Failed      | 2024-03-28 11:01:00
```

**Action:** This looks like a brute force attack! Both user 3 and user 1 had multiple failed attempts. Alert on this.

---

### **Hands-On Examples:**

```sql
-- 1. Find all Critical threat IPs
SELECT ip_address, location, threat_level FROM ip_addresses WHERE threat_level = 'Critical';

-- 2. Find devices without antivirus
SELECT device_id, user_id, device_name FROM devices WHERE antivirus_installed = FALSE;

-- 3. Find admins
SELECT username, email, role FROM users WHERE role = 'Admin';

-- 4. Find active users
SELECT username, department FROM users WHERE is_active = TRUE;

-- 5. Find unresolved alerts
SELECT alert_id, alert_type, alert_severity FROM alerts WHERE is_resolved = FALSE;

-- 6. Find incidents that resulted in data loss
SELECT incident_id, incident_name, severity FROM incidents WHERE data_lost = TRUE;

-- 7. Find Critical or High severity vulnerabilities
SELECT cve_id, severity, CVSS_score FROM vulnerabilities 
WHERE severity = 'Critical' OR severity = 'High';

-- 8. Combined: Find Critical alerts that are unresolved
SELECT alert_id, alert_type, description FROM alerts 
WHERE alert_severity = 'Critical' AND is_resolved = FALSE;

-- 9. Find users NOT in IT department
SELECT username, department FROM users WHERE department != 'IT';

-- 10. Find suspicious network flows
SELECT flow_id, source_ip_id, dest_ip_id FROM network_flows WHERE is_suspicious = TRUE;
```

---

### **Advanced WHERE (Operators):**

```sql
-- IN: Check multiple values
SELECT username FROM users WHERE role IN ('Admin', 'Employee');  -- 4 rows

-- BETWEEN: Range check
SELECT * FROM auth_logs WHERE session_duration_minutes BETWEEN 100 AND 500;

-- LIKE: Pattern matching
SELECT username FROM users WHERE username LIKE '%contractor%';  -- alex_contractor

-- IS NULL: Check for missing values
SELECT device_id FROM devices WHERE is_compromised IS NULL;  -- None in our data

-- Combine multiple conditions
SELECT username, risk_score FROM users 
WHERE department = 'IT' AND is_active = TRUE AND risk_score > 7;
-- Result: sarah_jones (risk=10), admin_user (risk=8)
```

---

### **Common Mistakes:**

❌ **Mistake 1:** String comparisons are case-sensitive (in most databases)
```sql
-- This might return nothing if data is stored differently
SELECT * FROM users WHERE department = 'finance';  -- Case matters!
```

✅ **GOOD:** Use LOWER() or UPPER() if unsure
```sql
SELECT * FROM users WHERE LOWER(department) = 'finance';
```

❌ **Mistake 2:** NULL comparisons with `=`
```sql
-- This returns NOTHING (NULL != anything, including NULL)
SELECT * FROM devices WHERE is_compromised = NULL;
```

✅ **GOOD:** Use IS NULL
```sql
SELECT * FROM devices WHERE is_compromised IS NULL;
```

❌ **Mistake 3:** Logic error (AND vs OR)
```sql
-- BAD: Finds users who are BOTH admin AND employee (impossible)
SELECT * FROM users WHERE role = 'Admin' AND role = 'Employee';  -- 0 rows
```

✅ **GOOD:** Use OR if you want either
```sql
SELECT * FROM users WHERE role = 'Admin' OR role = 'Employee';  -- 4 rows
```

---

### **Interview Questions:**

**Q1:** What's the difference between `= NULL` and `IS NULL`?  
**A:** In SQL, `= NULL` always returns NULL (never TRUE). Use `IS NULL` to check for missing values. This is because NULL represents "unknown," so "unknown = something" is also unknown.

**Q2:** If you have 10M rows and need to filter to 100 rows, is WHERE slow?  
**A:** Not if there's an index on the filtered column. We'll cover indexes in Phase 3. Without index, yes, it scans all 10M rows.

---

### **Practice Task 2:**

```
Task 1: Get all contractors (role = 'Contractor')
Expected: 1 row (alex_contractor)

Task 2: Get all users with risk_score > 10
Expected: 2 rows (mike_chen, alex_contractor)

Task 3: Get all failed authentications from user_id = 3
Expected: 3 rows
```

**Solutions:**
```sql
-- Task 1
SELECT username, email FROM users WHERE role = 'Contractor';

-- Task 2
SELECT username, risk_score FROM users WHERE risk_score > 10;

-- Task 3
SELECT log_id, auth_status FROM auth_logs WHERE user_id = 3 AND auth_status = 'Failed';
```

---

---

### 1.3 ORDER BY (Sorting)

**What it is:** Sort results in ascending (ASC) or descending (DESC) order.

**Why it's used:** Reports need to be sorted (highest risk first, oldest alerts first, etc.).

**How it works internally:**
1. Database executes WHERE to get matching rows.
2. Loads them into memory and uses a sorting algorithm (QuickSort, MergeSort).
3. Returns sorted results.
4. **Performance note:** Large sorts can be slow; databases try to avoid disk-based sorts.

**Syntax:**
```sql
SELECT columns FROM table 
ORDER BY column1 ASC, column2 DESC;  -- Can sort by multiple columns
-- ASC = ascending (default), DESC = descending
```

---

### **Real-World Scenario:** "Show me users sorted by risk score (highest first)."

```sql
SELECT username, department, risk_score FROM users 
ORDER BY risk_score DESC;

-- Result:
-- username        | department  | risk_score
-- alex_contractor | Consulting  | 45         <- Highest risk
-- mike_chen       | Sales       | 15
-- sarah_jones     | IT          | 10
-- admin_user      | IT          | 8
-- john_smith      | Finance     | 5          <- Lowest risk
```

**Action:** Contractor has highest risk score. Investigate why.

---

### **Hands-On Examples:**

```sql
-- 1. Get incidents sorted by severity (Critical first)
SELECT incident_name, severity FROM incidents 
ORDER BY severity DESC;  -- Critical, High, Medium, Low

-- 2. Get oldest unresolved alerts
SELECT alert_id, alert_type, created_at FROM alerts 
WHERE is_resolved = FALSE
ORDER BY created_at ASC;

-- 3. Get devices by user, then by device type
SELECT user_id, device_name, device_type FROM devices 
ORDER BY user_id ASC, device_type DESC;

-- 4. Get vulnerabilities sorted by CVSS (highest risk first)
SELECT cve_id, severity, CVSS_score FROM vulnerabilities 
ORDER BY CVSS_score DESC;

-- 5. Get authentication logs sorted by timestamp (newest first)
SELECT user_id, auth_status, timestamp FROM auth_logs 
ORDER BY timestamp DESC;
LIMIT 5;  -- Show only the 5 most recent (we'll cover LIMIT next)
```

---

### **Multiple Sort Columns (Priority sorting):**

```sql
-- Sort by severity first (Critical, High, Medium, Low)
-- Then by created_at (oldest first)
SELECT alert_id, alert_type, alert_severity, created_at FROM alerts
ORDER BY alert_severity DESC, created_at ASC;

-- Result (if we had more data):
-- alert_id | alert_type                | alert_severity | created_at
-- 2        | Impossible Travel         | Critical       | 2024-03-28 08:00:00
-- 3        | Malware IP Communication  | Critical       | 2024-03-28 09:00:00
-- 1        | Brute Force               | High           | 2024-03-28 10:00:00
-- 5        | VPN Anomaly               | High           | 2024-03-28 11:00:00
```

---

### **Performance Considerations:**

- **Sorting is expensive:** Sorting 1M rows takes time & memory. Minimize sorts on large tables.
- **Sort on indexed columns when possible:** If you sort frequently on a column, add an index (Phase 3).
- **Limit sorts:** Use LIMIT (next) to reduce rows before sorting.
  ```sql
  -- Instead of sorting all 1M rows then limiting:
  SELECT * FROM big_table ORDER BY created_at DESC LIMIT 10;
  
  -- Database can be smart: stop after finding 10 rows.
  ```

---

### **Interview Questions:**

**Q1:** Which is faster: `ORDER BY column1` then `ORDER BY column1, column2`, assuming column1 has index?  
**A:** If column1 is indexed, sorting by just column1 is faster. Adding column2 requires full sort (can't use index fully).

**Q2:** What happens if you `ORDER BY` a column that's not in SELECT?  
**A:** It's allowed. The database fetches the column, sorts by it, but doesn't return it. The SELECT determines what's shown, ORDER BY is applied before SELECT.

---

### **Practice Task 3:**

```
Task 1: Get all users sorted by department alphabetically
Expected: Alphabetical order by department

Task 2: Get unresolved alerts sorted by severity (Critical first)
Expected: 4 unresolved alerts, sorted by severity and then by creation date

Task 3: Get vulnerabilities sorted by CVSS score (highest first)
Expected: 4 vulnerabilities, highest CVSS first
```

**Solutions:**
```sql
-- Task 1
SELECT username, department FROM users ORDER BY department ASC;

-- Task 2
SELECT alert_id, alert_type, alert_severity FROM alerts 
WHERE is_resolved = FALSE
ORDER BY alert_severity DESC, created_at ASC;

-- Task 3
SELECT cve_id, CVSS_score FROM vulnerabilities ORDER BY CVSS_score DESC;
```

---

---

### 1.4 LIMIT (Pagination & Limiting Results)

**What it is:** Limit number of rows returned.

**Why it's used:** 
- Pagination (show 10 results per page).
- Performance (don't load 1M rows when you only need 10).
- Sampling (get first N rows for preview).

**How it works internally:**
1. Database executes SELECT with WHERE and ORDER BY.
2. Returns only the first N rows (specified in LIMIT).
3. In optimized databases, can stop processing after reaching limit.

**Syntax:**
```sql
SELECT columns FROM table LIMIT count;          -- First N rows
SELECT columns FROM table LIMIT offset, count;  -- Skip offset rows, then return count rows
-- MySQL: LIMIT offset, count
-- PostgreSQL: LIMIT count OFFSET offset (same result, different syntax)
```

---

### **Real-World Scenario:** "Show me the 5 newest alerts."

```sql
SELECT alert_id, alert_type, alert_severity, created_at FROM alerts 
ORDER BY created_at DESC
LIMIT 5;

-- Result:
-- alert_id | alert_type                | alert_severity | created_at
-- 5        | VPN Anomaly               | High           | <newest>
-- 3        | Malware IP Communication  | Critical       | 
-- 2        | Impossible Travel         | Critical       |
-- 1        | Brute Force               | High           |
-- 4        | Anomalous Behavior        | Medium         | <5th newest>
```

**Action:** Show recent alerts to the SOC team on the dashboard.

---

### **Hands-On Examples:**

```sql
-- 1. Get top 3 highest risk users
SELECT username, risk_score FROM users 
ORDER BY risk_score DESC 
LIMIT 3;

-- 2. Pagination: Show 10 results per page
-- Page 1 (results 1-10)
SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 10;

-- Page 2 (results 11-20)
SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 10 OFFSET 10;

-- Page 3 (results 21-30)
SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT 20, 10;  -- Same as LIMIT 10 OFFSET 20

-- 3. Get first device for each user (using LIMIT per user - we'll do this properly later with GROUP BY)
SELECT device_id, user_id, device_name FROM devices LIMIT 1;  -- Just first row

-- 4. Get the newest critical incident
SELECT incident_id, incident_name, created_at FROM incidents 
WHERE severity = 'Critical'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Traffic analysis: Show top 5 suspicious network flows
SELECT flow_id, source_ip_id, dest_ip_id, bytes_sent FROM network_flows 
WHERE is_suspicious = TRUE
ORDER BY bytes_sent DESC
LIMIT 5;
```

---

### **Common Mistakes:**

❌ **Mistake 1:** Forgetting LIMIT with large queries
```sql
-- In production with 100M rows, this hangs
SELECT * FROM auth_logs;  -- Always add LIMIT or WHERE for safety!
```

✅ **GOOD:** Always bound your results
```sql
SELECT * FROM auth_logs LIMIT 100;
-- Or use WHERE to filter first
SELECT * FROM auth_logs WHERE timestamp > NOW() - INTERVAL 1 DAY;
```

❌ **Mistake 2:** OFFSET with large numbers is slow
```sql
-- Slow: Skip 500K rows, then get 10
SELECT * FROM big_table LIMIT 500000, 10;  -- Scans 500K rows then returns 10
```

✅ **GOOD:** It's fine for small offsets, but for large pagination, use keyset pagination
```sql
-- Better: Use the ID of the last row you saw
SELECT * FROM auth_logs WHERE log_id > 500000 LIMIT 10;
```

---

### **Performance Considerations:**

- **LIMIT is fast:** Databases optimize for LIMIT (stop processing when limit reached).
- **OFFSET is slow:** OFFSET still scans skipped rows. Large offsets (e.g., OFFSET 1000000) are slow.
- **Production tip:** For large result sets, use keyset pagination (track last ID, query next batch using WHERE).

---

### **Interview Questions:**

**Q1:** How does `LIMIT 10 OFFSET 100` work differently from `LIMIT 100, 10`?  
**A:** Same result. LIMIT offset, count (MySQL style) vs LIMIT count OFFSET offset (PostgreSQL style). Both skip 100 rows then return 10.

**Q2:** If you have 1B rows and do `LIMIT 1000000, 10`, why is it slow?  
**A:** The database scans past the first 1M rows (even though it doesn't return them). Use WHERE with indexed column or keyset pagination instead.

---

### **Practice Task 4:**

```
Task 1: Get the 3 newest alerts (ordered by creation date, newest first, limit to 3)
Expected: 3 alerts with newest timestamps

Task 2: Get users, skip first 2, get next 3 (pagination)
Expected: 3 users (rows 3-5 when ordered by user_id)

Task 3: Get top 5 vulnerabilities by CVSS score
Expected: Top 5 vulnerabilities with highest CVSS scores
```

**Solutions:**
```sql
-- Task 1
SELECT alert_id, alert_type, created_at FROM alerts 
ORDER BY created_at DESC 
LIMIT 3;

-- Task 2
SELECT user_id, username FROM users 
ORDER BY user_id ASC
LIMIT 3 OFFSET 2;

-- Task 3
SELECT cve_id, CVSS_score FROM vulnerabilities 
ORDER BY CVSS_score DESC
LIMIT 5;
```

---

---

## [CONTINUING WITH REMAINING PHASES...]

*Due to token limits, I'll create a compressed version of the remaining phases and save it. Let me create Part 2-6 in a condensed but comprehensive format.*
