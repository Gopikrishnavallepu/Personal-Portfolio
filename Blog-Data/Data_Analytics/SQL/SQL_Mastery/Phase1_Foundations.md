# SQL Mastery — Phase 1: Foundations
## Database: SOC Security Operations Center

---

# 1. DATABASE DESIGN & SCHEMA

## The SOC Database

We're building a **Security Operations Center** database that tracks:
- Users & employees accessing systems
- Login events (success/failure)
- Security alerts & incidents
- Assets (servers, endpoints)
- Threat intelligence (malicious IPs)
- Vulnerability scan results

This is the SAME database used by SIEM tools like Splunk, QRadar, Sentinel.

---

## 1.1 Create the Database

```sql
CREATE DATABASE soc_db;
USE soc_db;
```

**What happens internally:**
- DB engine creates a directory on disk
- Creates system catalog tables (metadata)
- Allocates initial storage pages

---

## 1.2 Create Tables (Step-by-Step)

### Table 1: users (employees/accounts)

```sql
CREATE TABLE users (
    user_id       INT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(50) NOT NULL UNIQUE,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL,
    department    VARCHAR(50),
    role          VARCHAR(30) DEFAULT 'analyst',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Why each column:**
- `AUTO_INCREMENT` — DB generates unique ID automatically. No duplicates ever.
- `NOT NULL` — Column MUST have a value. Prevents garbage data.
- `UNIQUE` — No two rows can have same username.
- `DEFAULT` — If you don't provide value, DB uses this.
- `TIMESTAMP` — Stores date+time. Critical for SOC (when did this happen?).

### Table 2: assets (servers, endpoints, network devices)

```sql
CREATE TABLE assets (
    asset_id      INT PRIMARY KEY AUTO_INCREMENT,
    hostname      VARCHAR(100) NOT NULL,
    ip_address    VARCHAR(45) NOT NULL,
    asset_type    ENUM('server', 'workstation', 'firewall', 'switch', 'cloud_vm') NOT NULL,
    os            VARCHAR(50),
    environment   ENUM('production', 'staging', 'development', 'dmz') DEFAULT 'production',
    owner_id      INT,
    is_critical   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);
```

**Why FOREIGN KEY:** Links `owner_id` to `users.user_id`. DB enforces this — you can't assign an owner that doesn't exist. This is **referential integrity**.

### Table 3: login_events (authentication logs)

```sql
CREATE TABLE login_events (
    event_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT,
    source_ip     VARCHAR(45) NOT NULL,
    destination_ip VARCHAR(45),
    event_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('success', 'failure') NOT NULL,
    auth_method   ENUM('password', 'mfa', 'sso', 'certificate', 'api_key') DEFAULT 'password',
    geo_location  VARCHAR(100),
    user_agent    VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

**Why BIGINT:** Login events can be millions/billions of rows. INT maxes at ~2.1 billion. BIGINT handles up to 9.2 quintillion.

### Table 4: security_alerts

```sql
CREATE TABLE security_alerts (
    alert_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    alert_name    VARCHAR(200) NOT NULL,
    severity      ENUM('critical', 'high', 'medium', 'low', 'info') NOT NULL,
    source        VARCHAR(100) NOT NULL,
    source_ip     VARCHAR(45),
    destination_ip VARCHAR(45),
    alert_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('new', 'investigating', 'resolved', 'false_positive', 'escalated') DEFAULT 'new',
    assigned_to   INT,
    description   TEXT,
    mitre_tactic  VARCHAR(100),
    mitre_technique VARCHAR(100),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);
```

### Table 5: incidents

```sql
CREATE TABLE incidents (
    incident_id   INT PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(200) NOT NULL,
    severity      ENUM('critical', 'high', 'medium', 'low') NOT NULL,
    status        ENUM('open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed') DEFAULT 'open',
    created_by    INT,
    assigned_to   INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at   TIMESTAMP NULL,
    root_cause    TEXT,
    affected_assets TEXT,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);
```

### Table 6: threat_intel (known malicious IPs/domains)

```sql
CREATE TABLE threat_intel (
    intel_id      INT PRIMARY KEY AUTO_INCREMENT,
    indicator     VARCHAR(255) NOT NULL,
    indicator_type ENUM('ip', 'domain', 'hash', 'url', 'email') NOT NULL,
    threat_type   VARCHAR(100),
    confidence    INT CHECK (confidence BETWEEN 0 AND 100),
    source        VARCHAR(100),
    first_seen    TIMESTAMP,
    last_seen     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active     BOOLEAN DEFAULT TRUE
);
```

### Table 7: vulnerability_scans

```sql
CREATE TABLE vulnerability_scans (
    scan_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
    asset_id      INT,
    cve_id        VARCHAR(20),
    vuln_name     VARCHAR(200),
    severity      ENUM('critical', 'high', 'medium', 'low', 'info') NOT NULL,
    cvss_score    DECIMAL(3,1),
    status        ENUM('open', 'patched', 'accepted_risk', 'mitigated') DEFAULT 'open',
    scan_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    patch_deadline DATE,
    FOREIGN KEY (asset_id) REFERENCES assets(asset_id)
);
```

---

## 1.3 Insert Sample Data

### Users

```sql
INSERT INTO users (username, full_name, email, department, role) VALUES
('jsmith',    'John Smith',      'john.smith@bank.com',     'SOC',          'senior_analyst'),
('agarcia',   'Ana Garcia',      'ana.garcia@bank.com',     'SOC',          'analyst'),
('mkumar',    'Manoj Kumar',     'manoj.kumar@bank.com',    'SOC',          'analyst'),
('pjones',    'Patricia Jones',  'patricia.jones@bank.com', 'SOC',          'soc_manager'),
('rwilson',   'Robert Wilson',   'robert.wilson@bank.com',  'IT_Infra',     'sysadmin'),
('lchen',     'Linda Chen',      'linda.chen@bank.com',     'IT_Infra',     'sysadmin'),
('dpark',     'David Park',      'david.park@bank.com',     'DevOps',       'engineer'),
('sjohnson',  'Sarah Johnson',   'sarah.johnson@bank.com',  'Security_Arch','architect'),
('tbrown',    'Tom Brown',       'tom.brown@bank.com',      'Compliance',   'auditor'),
('nwang',     'Nancy Wang',      'nancy.wang@bank.com',     'SOC',          'threat_hunter');
```

### Assets

```sql
INSERT INTO assets (hostname, ip_address, asset_type, os, environment, owner_id, is_critical) VALUES
('web-prod-01',    '10.0.1.10',  'server',      'Ubuntu 22.04',    'production',  5, TRUE),
('web-prod-02',    '10.0.1.11',  'server',      'Ubuntu 22.04',    'production',  5, TRUE),
('db-prod-01',     '10.0.2.10',  'server',      'RHEL 9',          'production',  6, TRUE),
('db-prod-02',     '10.0.2.11',  'server',      'RHEL 9',          'production',  6, TRUE),
('app-prod-01',    '10.0.3.10',  'server',      'Ubuntu 22.04',    'production',  7, TRUE),
('fw-edge-01',     '10.0.0.1',   'firewall',    'PAN-OS 11',       'dmz',         5, TRUE),
('ws-jsmith',      '10.10.1.50', 'workstation', 'Windows 11',      'production',  1, FALSE),
('ws-agarcia',     '10.10.1.51', 'workstation', 'Windows 11',      'production',  2, FALSE),
('dev-server-01',  '10.20.1.10', 'server',      'Ubuntu 22.04',    'development', 7, FALSE),
('cloud-vm-01',    '172.16.1.10','cloud_vm',    'Amazon Linux 2',  'production',  7, TRUE);
```

### Login Events (mix of normal and suspicious)

```sql
INSERT INTO login_events (user_id, source_ip, destination_ip, event_time, status, auth_method, geo_location) VALUES
-- Normal logins (business hours, expected locations)
(1, '10.10.1.50', '10.0.1.10', '2024-03-15 09:15:00', 'success', 'mfa',      'New York, US'),
(2, '10.10.1.51', '10.0.1.10', '2024-03-15 09:30:00', 'success', 'mfa',      'New York, US'),
(3, '10.10.1.52', '10.0.2.10', '2024-03-15 09:45:00', 'success', 'password', 'Mumbai, IN'),
(5, '10.10.2.10', '10.0.1.10', '2024-03-15 10:00:00', 'success', 'sso',      'New York, US'),
(1, '10.10.1.50', '10.0.2.10', '2024-03-15 11:00:00', 'success', 'mfa',      'New York, US'),

-- Suspicious: Failed logins (brute force attempt)
(1, '185.220.101.5', '10.0.1.10', '2024-03-15 02:10:00', 'failure', 'password', 'Moscow, RU'),
(1, '185.220.101.5', '10.0.1.10', '2024-03-15 02:10:05', 'failure', 'password', 'Moscow, RU'),
(1, '185.220.101.5', '10.0.1.10', '2024-03-15 02:10:10', 'failure', 'password', 'Moscow, RU'),
(1, '185.220.101.5', '10.0.1.10', '2024-03-15 02:10:15', 'failure', 'password', 'Moscow, RU'),
(1, '185.220.101.5', '10.0.1.10', '2024-03-15 02:10:20', 'failure', 'password', 'Moscow, RU'),

-- Suspicious: Login from unusual location (impossible travel)
(2, '10.10.1.51', '10.0.1.10', '2024-03-15 14:00:00', 'success', 'mfa',      'New York, US'),
(2, '91.234.56.78','10.0.1.10', '2024-03-15 14:30:00', 'success', 'password', 'Beijing, CN'),

-- Suspicious: After-hours access
(5, '10.10.2.10', '10.0.2.10', '2024-03-16 03:15:00', 'success', 'password', 'New York, US'),
(5, '10.10.2.10', '10.0.2.11', '2024-03-16 03:20:00', 'success', 'password', 'New York, US'),

-- Normal pattern continued
(4, '10.10.1.60', '10.0.1.10', '2024-03-15 08:00:00', 'success', 'sso',      'New York, US'),
(7, '10.10.3.10', '10.20.1.10','2024-03-15 10:30:00', 'success', 'sso',      'San Francisco, US'),
(6, '10.10.2.11', '10.0.2.10', '2024-03-15 09:00:00', 'success', 'mfa',      'New York, US'),

-- Service account login at odd time
(NULL, '10.0.3.10', '10.0.2.10', '2024-03-15 23:00:00', 'success', 'api_key', NULL),
(NULL, '10.0.3.10', '10.0.2.10', '2024-03-16 23:00:00', 'success', 'api_key', NULL);
```

### Security Alerts

```sql
INSERT INTO security_alerts (alert_name, severity, source, source_ip, destination_ip, alert_time, status, assigned_to, description, mitre_tactic, mitre_technique) VALUES
('Brute Force Login Attempt',        'high',     'IDS',       '185.220.101.5', '10.0.1.10', '2024-03-15 02:11:00', 'investigating', 1, '5 failed logins in 10 seconds from external IP', 'Credential Access', 'T1110'),
('Impossible Travel Detected',       'critical', 'UEBA',      '91.234.56.78',  '10.0.1.10', '2024-03-15 14:31:00', 'new',           NULL, 'User agarcia logged in from NY then Beijing in 30min', 'Initial Access', 'T1078'),
('Port Scan Detected',               'medium',   'Firewall',  '45.33.32.156',  '10.0.0.1',  '2024-03-15 04:00:00', 'resolved',      3, 'External IP scanned ports 1-1024', 'Reconnaissance', 'T1046'),
('Malware Hash Detected',            'critical', 'EDR',       '10.10.1.51',    NULL,         '2024-03-15 15:00:00', 'escalated',     1, 'Known ransomware hash detected on workstation', 'Execution', 'T1204'),
('Suspicious PowerShell Execution',  'high',     'EDR',       '10.10.1.50',    NULL,         '2024-03-15 16:00:00', 'investigating', 10,'Encoded PowerShell command executed', 'Execution', 'T1059.001'),
('Data Exfiltration Attempt',        'critical', 'DLP',       '10.0.2.10',     '198.51.100.5','2024-03-16 03:30:00','new',           NULL, 'Large data transfer from DB to external IP', 'Exfiltration', 'T1041'),
('SQL Injection Attempt',            'high',     'WAF',       '203.0.113.50',  '10.0.1.10', '2024-03-15 12:00:00', 'false_positive', 2, 'SQL injection pattern in HTTP request', 'Initial Access', 'T1190'),
('Unauthorized DNS Query',           'medium',   'DNS_Monitor','10.10.1.50',   NULL,         '2024-03-15 16:05:00', 'investigating', 10,'DNS query to known C2 domain', 'Command and Control', 'T1071.004'),
('Failed SSH to Production DB',      'low',      'SIEM',      '10.20.1.10',    '10.0.2.10', '2024-03-15 11:00:00', 'resolved',      3, 'Dev server attempted SSH to prod DB', 'Lateral Movement', 'T1021.004'),
('Privilege Escalation Attempt',     'high',     'EDR',       '10.10.1.52',    NULL,         '2024-03-15 17:00:00', 'new',           NULL, 'User attempted sudo on restricted command', 'Privilege Escalation', 'T1548');
```

### Threat Intel

```sql
INSERT INTO threat_intel (indicator, indicator_type, threat_type, confidence, source, first_seen) VALUES
('185.220.101.5',   'ip',     'Tor Exit Node / Brute Force',  95, 'AlienVault OTX',    '2024-01-15 00:00:00'),
('91.234.56.78',    'ip',     'APT28 Infrastructure',          90, 'CrowdStrike',       '2024-02-01 00:00:00'),
('45.33.32.156',    'ip',     'Scanner / Shodan',              60, 'AbuseIPDB',         '2024-03-01 00:00:00'),
('198.51.100.5',    'ip',     'Data Exfil C2',                 85, 'Mandiant',          '2024-03-10 00:00:00'),
('203.0.113.50',    'ip',     'Web Attack Source',             70, 'Internal Threat Intel','2024-03-05 00:00:00'),
('evil-domain.xyz', 'domain', 'Phishing',                      80, 'PhishTank',         '2024-02-20 00:00:00'),
('a1b2c3d4e5f6...', 'hash',  'Ransomware (LockBit)',          99, 'VirusTotal',        '2024-03-14 00:00:00'),
('bad-c2.example.net','domain','Command and Control',          88, 'CISA',              '2024-03-01 00:00:00');
```

### Vulnerability Scans

```sql
INSERT INTO vulnerability_scans (asset_id, cve_id, vuln_name, severity, cvss_score, status, scan_date, patch_deadline) VALUES
(1, 'CVE-2024-1234', 'OpenSSL Buffer Overflow',    'critical', 9.8, 'open',     '2024-03-14', '2024-03-21'),
(1, 'CVE-2024-5678', 'Apache Log4j RCE',           'critical', 10.0,'open',     '2024-03-14', '2024-03-16'),
(3, 'CVE-2024-2222', 'PostgreSQL Auth Bypass',      'high',     8.1, 'open',     '2024-03-14', '2024-03-28'),
(3, 'CVE-2024-3333', 'Kernel Privilege Escalation', 'high',     7.8, 'patched',  '2024-03-10', '2024-03-17'),
(5, 'CVE-2024-4444', 'Node.js Prototype Pollution', 'medium',   6.5, 'open',     '2024-03-14', '2024-04-14'),
(6, 'CVE-2024-5555', 'PAN-OS Command Injection',    'critical', 9.9, 'mitigated','2024-03-12', '2024-03-14'),
(9, 'CVE-2024-6666', 'SSH Weak Key Exchange',       'low',      3.7, 'accepted_risk','2024-03-14', NULL),
(10,'CVE-2024-7777', 'AWS SSM Agent RCE',           'high',     8.5, 'open',     '2024-03-14', '2024-03-21'),
(2, 'CVE-2024-1234', 'OpenSSL Buffer Overflow',     'critical', 9.8, 'open',     '2024-03-14', '2024-03-21'),
(4, 'CVE-2024-2222', 'PostgreSQL Auth Bypass',      'high',     8.1, 'open',     '2024-03-14', '2024-03-28');
```

---

# 2. SELECT — Reading Data

## 2.1 Basic SELECT

**What:** Retrieves data from a table.  
**Internally:** DB engine → parses SQL → creates execution plan → scans table/index → returns result set.

```sql
-- Select all columns, all rows
SELECT * FROM users;

-- Select specific columns only (ALWAYS do this in production — less data = faster)
SELECT username, full_name, department FROM users;

-- Select with alias (rename column in output)
SELECT username AS "User", department AS "Dept" FROM users;
```

**⚠️ Common Mistake:** Using `SELECT *` in production queries. It fetches ALL columns, including BLOBs and TEXT fields. Always specify needed columns.

---

## 2.2 WHERE — Filtering Rows

**What:** Filters rows based on conditions.  
**Internally:** DB checks each row against the condition. With index, it skips non-matching rows (fast). Without index, it scans every row (slow).

```sql
-- Find all SOC department users
SELECT * FROM users WHERE department = 'SOC';

-- Find active analysts
SELECT username, full_name FROM users WHERE role = 'analyst' AND is_active = TRUE;

-- Find non-SOC users
SELECT * FROM users WHERE department != 'SOC';
-- or
SELECT * FROM users WHERE department <> 'SOC';

-- Find users in SOC or DevOps
SELECT * FROM users WHERE department IN ('SOC', 'DevOps', 'IT_Infra');

-- Find users NOT in certain departments
SELECT * FROM users WHERE department NOT IN ('Compliance', 'Security_Arch');
```

### Comparison Operators

```sql
-- Numeric comparison
SELECT * FROM vulnerability_scans WHERE cvss_score >= 9.0;

-- Date comparison
SELECT * FROM login_events WHERE event_time > '2024-03-15 12:00:00';

-- Between (inclusive on both ends)
SELECT * FROM vulnerability_scans WHERE cvss_score BETWEEN 7.0 AND 9.0;

-- NULL checks (IS NULL, not = NULL)
SELECT * FROM login_events WHERE user_id IS NULL;     -- Service account logins
SELECT * FROM security_alerts WHERE assigned_to IS NOT NULL;  -- Assigned alerts

-- Pattern matching with LIKE
SELECT * FROM assets WHERE hostname LIKE 'web-%';       -- Starts with 'web-'
SELECT * FROM assets WHERE hostname LIKE '%-prod-%';    -- Contains 'prod'
SELECT * FROM users WHERE email LIKE '%@bank.com';      -- Ends with '@bank.com'
```

**⚠️ Common Mistake:** `WHERE status = NULL` returns nothing. NULL is not a value — it's absence of value. Always use `IS NULL` / `IS NOT NULL`.

---

## 2.3 ORDER BY — Sorting Results

```sql
-- Sort alerts by severity (alphabetical — not ideal, we fix this later)
SELECT alert_name, severity, alert_time 
FROM security_alerts 
ORDER BY alert_time DESC;  -- DESC = newest first, ASC = oldest first (default)

-- Sort by multiple columns
SELECT * FROM vulnerability_scans 
ORDER BY severity ASC, cvss_score DESC;

-- Sort by column position (not recommended but common in interviews)
SELECT username, department, role FROM users ORDER BY 2, 3;  -- 2=department, 3=role
```

---

## 2.4 LIMIT — Restricting Rows

```sql
-- Get top 5 most recent alerts
SELECT * FROM security_alerts ORDER BY alert_time DESC LIMIT 5;

-- Pagination: Get rows 11-20 (page 2, 10 per page)
SELECT * FROM login_events ORDER BY event_time DESC LIMIT 10 OFFSET 10;

-- Get the single most critical vulnerability
SELECT * FROM vulnerability_scans ORDER BY cvss_score DESC LIMIT 1;
```

**Performance:** LIMIT without ORDER BY returns arbitrary rows. Always ORDER BY first.

---

# 3. INSERT — Adding Data

```sql
-- Insert single row
INSERT INTO users (username, full_name, email, department, role)
VALUES ('mlee', 'Mike Lee', 'mike.lee@bank.com', 'SOC', 'analyst');

-- Insert multiple rows (batch insert — much faster than individual inserts)
INSERT INTO login_events (user_id, source_ip, destination_ip, event_time, status, auth_method, geo_location) VALUES
(1, '10.10.1.50', '10.0.1.10', '2024-03-16 09:00:00', 'success', 'mfa', 'New York, US'),
(2, '10.10.1.51', '10.0.1.10', '2024-03-16 09:15:00', 'success', 'mfa', 'New York, US');
```

**⚠️ Common Mistake:** Forgetting NOT NULL columns → INSERT fails. Always check table schema first.

---

# 4. UPDATE — Modifying Data

```sql
-- Assign an alert to an analyst
UPDATE security_alerts SET assigned_to = 10, status = 'investigating' 
WHERE alert_id = 2;

-- Close resolved alerts
UPDATE security_alerts SET status = 'resolved' 
WHERE alert_id = 3 AND status = 'resolved';

-- Mark vulnerability as patched
UPDATE vulnerability_scans SET status = 'patched' 
WHERE scan_id = 4;
```

**⚠️ CRITICAL Mistake:** Running UPDATE without WHERE → updates ALL rows!
```sql
-- ❌ NEVER DO THIS (updates every user)
UPDATE users SET is_active = FALSE;

-- ✅ ALWAYS include WHERE
UPDATE users SET is_active = FALSE WHERE user_id = 11;
```

**Production tip:** Always run a SELECT with the same WHERE first to verify which rows will be affected:
```sql
-- Step 1: Check what will be updated
SELECT * FROM users WHERE user_id = 11;
-- Step 2: If correct, run update
UPDATE users SET is_active = FALSE WHERE user_id = 11;
```

---

# 5. DELETE — Removing Data

```sql
-- Delete a specific record
DELETE FROM login_events WHERE event_id = 100;

-- Delete old events (data retention)
DELETE FROM login_events WHERE event_time < '2024-01-01';
```

**⚠️ CRITICAL:** Same as UPDATE — DELETE without WHERE deletes ALL rows. In production, use soft delete (set `is_active = FALSE`) instead of actual DELETE.

---

# 6. Practice Tasks — Phase 1

Try these yourself before looking at answers:

### Easy
1. List all users in the SOC department
2. Show all critical assets
3. Find all failed login events
4. List alerts sorted by newest first

### Medium
5. Find all login events from external IPs (not starting with '10.')
6. Show all open critical vulnerabilities with CVSS score >= 9.0
7. Find alerts that are not yet assigned to anyone
8. List assets in production environment sorted by hostname

### Hard
9. Find logins that happened between 12 AM and 6 AM (after-hours)
10. Find all login events from IPs that appear in the threat_intel table (hint: use a subquery or just think about it — we'll cover this in Phase 2)

---

### Answers

```sql
-- 1
SELECT * FROM users WHERE department = 'SOC';

-- 2
SELECT hostname, ip_address, os FROM assets WHERE is_critical = TRUE;

-- 3
SELECT * FROM login_events WHERE status = 'failure';

-- 4
SELECT alert_name, severity, alert_time, status 
FROM security_alerts ORDER BY alert_time DESC;

-- 5
SELECT * FROM login_events WHERE source_ip NOT LIKE '10.%';

-- 6
SELECT * FROM vulnerability_scans 
WHERE severity = 'critical' AND cvss_score >= 9.0 AND status = 'open';

-- 7
SELECT * FROM security_alerts WHERE assigned_to IS NULL;

-- 8
SELECT hostname, ip_address, asset_type, os 
FROM assets 
WHERE environment = 'production' 
ORDER BY hostname;

-- 9
SELECT * FROM login_events 
WHERE HOUR(event_time) BETWEEN 0 AND 5
ORDER BY event_time;

-- 10 (preview — subquery)
SELECT * FROM login_events 
WHERE source_ip IN (SELECT indicator FROM threat_intel WHERE indicator_type = 'ip');
```

---

# 7. Interview Questions — Phase 1

**Q1: What's the difference between DELETE, TRUNCATE, and DROP?**
| Command | What it does | Can rollback? | Resets AUTO_INCREMENT? |
|---------|-------------|---------------|----------------------|
| DELETE | Removes rows (with WHERE) | Yes (in transaction) | No |
| TRUNCATE | Removes ALL rows instantly | No | Yes |
| DROP | Removes entire table + schema | No | N/A (table gone) |

**Q2: What is NULL in SQL?**  
NULL = unknown/missing value. It's NOT zero, NOT empty string. Any comparison with NULL returns NULL (not TRUE/FALSE). Use IS NULL to check.

**Q3: What's the execution order of a SQL query?**
```
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```
This is why you can't use a column alias (defined in SELECT) inside WHERE.

**Q4: What's the difference between WHERE and HAVING?**  
WHERE filters rows BEFORE grouping. HAVING filters AFTER grouping (on aggregated results).

**Q5: Why should you avoid SELECT * in production?**  
- Fetches unnecessary data (more I/O, more network transfer)
- Breaks applications if table schema changes (new columns added)
- Prevents covering index usage (index can't satisfy all columns)
