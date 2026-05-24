# SQL Mastery — Phase 6: DevSecOps / SOC Integration & SIEM
## SQL in Security Tools, Threat Hunting, Log Analysis

---

# 1. SQL in SIEM Tools

## How SIEMs Use SQL Internally

Most SIEM platforms use SQL or SQL-like query languages:

| SIEM | Query Language | SQL-like? |
|------|---------------|-----------|
| **Splunk** | SPL (Search Processing Language) | Similar concepts (search, stats, eval, join) |
| **Azure Sentinel** | KQL (Kusto Query Language) | Very SQL-like (where, project, summarize, join) |
| **QRadar** | AQL (Ariel Query Language) | Almost identical to SQL |
| **Elastic/OpenSearch** | EQL, ES|QL | Growing SQL support |
| **Google Chronicle** | YARA-L, UDM Search | Rule-based, SQL concepts |

## QRadar AQL Example (Nearly Pure SQL)

```sql
-- QRadar: Find brute force attempts (AQL is SQL-like)
SELECT 
    sourceIP, 
    destinationIP, 
    userName,
    COUNT(*) AS failCount
FROM events
WHERE category = 'Authentication' 
  AND eventName = 'Login Failed'
  AND LAST 1 HOURS
GROUP BY sourceIP, destinationIP, userName
HAVING COUNT(*) > 10
ORDER BY failCount DESC
```

## Azure Sentinel KQL (Maps to SQL)

```
// KQL version
SigninLogs
| where ResultType != 0  // Failed logins
| summarize FailCount = count() by IPAddress, UserPrincipalName
| where FailCount > 10
| order by FailCount desc
```

**SQL equivalent:**
```sql
SELECT IPAddress, UserPrincipalName, COUNT(*) AS FailCount
FROM SigninLogs
WHERE ResultType != 0
GROUP BY IPAddress, UserPrincipalName
HAVING COUNT(*) > 10
ORDER BY FailCount DESC;
```

## Splunk SPL (Maps to SQL)

```
// SPL version
index=auth sourcetype=linux_secure action=failure
| stats count by src_ip, user
| where count > 10
| sort - count
```

**SQL equivalent:**
```sql
SELECT src_ip, user, COUNT(*) AS count
FROM auth_events
WHERE action = 'failure'
GROUP BY src_ip, user
HAVING COUNT(*) > 10
ORDER BY count DESC;
```

**Key takeaway:** If you know SQL, you can learn ANY SIEM query language in days.

---

# 2. Log Analysis Using SQL

## 2.1 Firewall Log Analysis

```sql
-- Create table mimicking firewall logs
CREATE TABLE firewall_logs (
    log_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    timestamp   TIMESTAMP NOT NULL,
    action      ENUM('allow', 'deny', 'drop') NOT NULL,
    src_ip      VARCHAR(45) NOT NULL,
    dst_ip      VARCHAR(45) NOT NULL,
    src_port    INT,
    dst_port    INT,
    protocol    ENUM('TCP', 'UDP', 'ICMP') NOT NULL,
    bytes_sent  BIGINT DEFAULT 0,
    rule_name   VARCHAR(100)
);
```

### Port Scan Detection

```sql
-- IP scanning multiple ports in short time
SELECT 
    src_ip,
    COUNT(DISTINCT dst_port) AS ports_scanned,
    MIN(timestamp) AS scan_start,
    MAX(timestamp) AS scan_end,
    TIMESTAMPDIFF(SECOND, MIN(timestamp), MAX(timestamp)) AS duration_sec
FROM firewall_logs
WHERE action = 'deny'
  AND timestamp >= NOW() - INTERVAL 1 HOUR
GROUP BY src_ip
HAVING ports_scanned > 20
ORDER BY ports_scanned DESC;
```

### Data Exfiltration Detection

```sql
-- Unusual outbound data volume from internal servers
SELECT 
    src_ip,
    dst_ip,
    SUM(bytes_sent) / (1024*1024) AS mb_transferred,
    COUNT(*) AS connection_count,
    MIN(timestamp) AS first_seen,
    MAX(timestamp) AS last_seen
FROM firewall_logs
WHERE action = 'allow'
  AND src_ip LIKE '10.%'          -- Internal source
  AND dst_ip NOT LIKE '10.%'      -- External destination
  AND timestamp >= NOW() - INTERVAL 24 HOUR
GROUP BY src_ip, dst_ip
HAVING mb_transferred > 100       -- More than 100MB to single external IP
ORDER BY mb_transferred DESC;
```

## 2.2 DNS Log Analysis

```sql
-- Create DNS log table
CREATE TABLE dns_logs (
    log_id      BIGINT PRIMARY KEY AUTO_INCREMENT,
    timestamp   TIMESTAMP NOT NULL,
    client_ip   VARCHAR(45) NOT NULL,
    query_name  VARCHAR(255) NOT NULL,
    query_type  VARCHAR(10) NOT NULL,    -- A, AAAA, MX, TXT, CNAME
    response    VARCHAR(45),
    ttl         INT
);
```

### DNS Tunneling Detection

```sql
-- Detect DNS tunneling: high volume of queries to same domain
SELECT 
    client_ip,
    -- Extract base domain (last 2 parts)
    SUBSTRING_INDEX(query_name, '.', -2) AS base_domain,
    COUNT(*) AS query_count,
    COUNT(DISTINCT query_name) AS unique_subdomains,
    AVG(LENGTH(query_name)) AS avg_query_length
FROM dns_logs
WHERE timestamp >= NOW() - INTERVAL 1 HOUR
GROUP BY client_ip, SUBSTRING_INDEX(query_name, '.', -2)
HAVING query_count > 100 
   AND unique_subdomains > 50  -- Many unique subdomains = tunneling
   AND avg_query_length > 50   -- Long query names = encoded data
ORDER BY query_count DESC;
```

### C2 Domain Resolution

```sql
-- Cross-reference DNS queries with threat intelligence
SELECT 
    dl.client_ip,
    dl.query_name,
    dl.timestamp,
    ti.threat_type,
    ti.confidence,
    a.hostname AS affected_host
FROM dns_logs dl
INNER JOIN threat_intel ti ON dl.query_name = ti.indicator OR 
    SUBSTRING_INDEX(dl.query_name, '.', -2) = ti.indicator
LEFT JOIN assets a ON dl.client_ip = a.ip_address
WHERE ti.indicator_type = 'domain'
ORDER BY ti.confidence DESC;
```

---

# 3. Threat Hunting Queries

## 3.1 Hunt: Lateral Movement

```sql
-- Find internal-to-internal connections on sensitive ports
SELECT 
    fl.src_ip,
    a_src.hostname AS source_host,
    fl.dst_ip,
    a_dst.hostname AS dest_host,
    fl.dst_port,
    CASE fl.dst_port
        WHEN 22 THEN 'SSH'
        WHEN 3389 THEN 'RDP'
        WHEN 445 THEN 'SMB'
        WHEN 5985 THEN 'WinRM'
        WHEN 5986 THEN 'WinRM-SSL'
        WHEN 3306 THEN 'MySQL'
        WHEN 5432 THEN 'PostgreSQL'
    END AS service,
    COUNT(*) AS connection_count,
    fl.action
FROM firewall_logs fl
LEFT JOIN assets a_src ON fl.src_ip = a_src.ip_address
LEFT JOIN assets a_dst ON fl.dst_ip = a_dst.ip_address
WHERE fl.src_ip LIKE '10.%' AND fl.dst_ip LIKE '10.%'
  AND fl.dst_port IN (22, 3389, 445, 5985, 5986, 3306, 5432)
  AND fl.timestamp >= NOW() - INTERVAL 24 HOUR
GROUP BY fl.src_ip, a_src.hostname, fl.dst_ip, a_dst.hostname, fl.dst_port, fl.action
ORDER BY connection_count DESC;
```

## 3.2 Hunt: Privilege Escalation

```sql
-- Find users who accessed systems outside their normal scope
WITH user_baseline AS (
    SELECT user_id, destination_ip, COUNT(*) AS normal_count
    FROM login_events
    WHERE event_time < NOW() - INTERVAL 30 DAY
      AND status = 'success'
    GROUP BY user_id, destination_ip
),
recent_access AS (
    SELECT le.user_id, le.destination_ip, le.event_time, le.auth_method
    FROM login_events le
    WHERE le.event_time >= NOW() - INTERVAL 7 DAY
      AND le.status = 'success'
)
SELECT 
    u.username,
    u.department,
    ra.destination_ip,
    a.hostname,
    a.is_critical,
    ra.event_time,
    ra.auth_method,
    'ANOMALOUS ACCESS - NO BASELINE' AS finding
FROM recent_access ra
INNER JOIN users u ON ra.user_id = u.user_id
LEFT JOIN assets a ON ra.destination_ip = a.ip_address
LEFT JOIN user_baseline ub ON ra.user_id = ub.user_id AND ra.destination_ip = ub.destination_ip
WHERE ub.normal_count IS NULL  -- No prior access to this destination
  AND a.is_critical = TRUE
ORDER BY ra.event_time DESC;
```

## 3.3 Hunt: Compromised Service Accounts

```sql
-- Service account behavioral anomalies
SELECT 
    le.source_ip,
    le.destination_ip,
    le.event_time,
    le.auth_method,
    HOUR(le.event_time) AS login_hour,
    DAYNAME(le.event_time) AS login_day,
    CASE 
        WHEN le.auth_method != 'api_key' THEN 'ANOMALY: Non-API auth method'
        WHEN HOUR(le.event_time) NOT BETWEEN 22 AND 23 
             AND HOUR(le.event_time) NOT BETWEEN 0 AND 1 THEN 'ANOMALY: Unusual time'
        ELSE 'Normal'
    END AS anomaly_flag
FROM login_events le
WHERE le.user_id IS NULL  -- Service accounts (no user_id)
ORDER BY le.event_time DESC;
```

---

# 4. Real-World SOC Project

## Build a Complete Threat Investigation Workflow

**Scenario:** You receive an alert: "Data Exfiltration Attempt from db-prod-01 (10.0.2.10)"

**Step 1:** Check the alert details
```sql
SELECT * FROM security_alerts WHERE source_ip = '10.0.2.10' ORDER BY alert_time DESC;
```

**Step 2:** Who accessed this server recently?
```sql
SELECT u.username, le.source_ip, le.event_time, le.auth_method, le.status
FROM login_events le
LEFT JOIN users u ON le.user_id = u.user_id
WHERE le.destination_ip = '10.0.2.10'
  AND le.event_time >= '2024-03-15 00:00:00'
ORDER BY le.event_time DESC;
```

**Step 3:** Any vulnerabilities on this server?
```sql
SELECT vs.cve_id, vs.vuln_name, vs.cvss_score, vs.status
FROM vulnerability_scans vs
WHERE vs.asset_id = (SELECT asset_id FROM assets WHERE ip_address = '10.0.2.10')
ORDER BY vs.cvss_score DESC;
```

**Step 4:** Is the external destination IP in threat intel?
```sql
SELECT * FROM threat_intel WHERE indicator = '198.51.100.5';
```

**Step 5:** Build the full incident picture
```sql
-- Combined investigation query
WITH target_asset AS (
    SELECT * FROM assets WHERE ip_address = '10.0.2.10'
),
recent_logins AS (
    SELECT le.*, u.username, u.department
    FROM login_events le
    LEFT JOIN users u ON le.user_id = u.user_id
    WHERE le.destination_ip = '10.0.2.10'
      AND le.event_time >= NOW() - INTERVAL 48 HOUR
),
asset_vulns AS (
    SELECT vs.*
    FROM vulnerability_scans vs
    INNER JOIN target_asset ta ON vs.asset_id = ta.asset_id
    WHERE vs.status = 'open'
),
related_alerts AS (
    SELECT sa.*
    FROM security_alerts sa
    WHERE sa.source_ip = '10.0.2.10' OR sa.destination_ip = '10.0.2.10'
)
SELECT 
    'ASSET' AS section, ta.hostname, ta.ip_address, ta.os, ta.environment, NULL, NULL
FROM target_asset ta
UNION ALL
SELECT 'LOGIN', rl.username, rl.source_ip, CAST(rl.event_time AS CHAR), rl.status, rl.auth_method, rl.geo_location
FROM recent_logins rl
UNION ALL
SELECT 'VULN', av.cve_id, av.vuln_name, CAST(av.cvss_score AS CHAR), av.status, av.severity, NULL
FROM asset_vulns av
UNION ALL
SELECT 'ALERT', ra.alert_name, ra.source_ip, CAST(ra.alert_time AS CHAR), ra.status, ra.severity, ra.mitre_tactic
FROM related_alerts ra;
```

---

# 5. Mini Challenge Set

## Easy (1-5)
1. Count total login events per status (success/failure)
2. List all critical severity alerts that are still open
3. Find all assets running Ubuntu
4. Show users sorted by department
5. Count vulnerabilities per severity level

## Medium (6-12)
6. Find the top 3 most active source IPs (by login count)
7. Show each analyst's alert count (include those with 0 alerts)
8. List assets with open critical vulnerabilities and their hostnames
9. Find logins from IPs in the threat_intel table with confidence > 80
10. Calculate the average CVSS score per environment (production, staging, etc.)
11. Find users who logged in on weekends
12. Show the time difference between each consecutive alert

## Hard (13-20)
13. Detect impossible travel (same user, different locations, <60 min)
14. Rank assets by total risk score (vulnerability + alert weighted)
15. Find IPs that appear in BOTH login_events (as failures) AND threat_intel
16. Build a query showing alert trends: count per day for the last 7 days
17. Write a CTE that finds all unassigned critical alerts, enriches them with threat intel, and ranks them by confidence
18. Create a query to identify potential brute force attacks (>5 failures from same IP in <5 minutes)
19. Build a complete incident timeline combining logins + alerts + vulns for a specific asset
20. Calculate SOC analyst efficiency: closure rate, average time to resolve, alerts per analyst

---

# 6. Interview Questions — Complete (20+)

**Q1: What does EXPLAIN do?**  
Shows query execution plan: which indexes used, rows examined, join type. Essential for optimization.

**Q2: Difference between UNION and UNION ALL?**  
UNION removes duplicates (slower). UNION ALL keeps all rows (faster). Use UNION ALL unless you specifically need dedup.

**Q3: What is a deadlock?**  
Two transactions waiting on each other's locks. Neither can proceed. DB detects and kills one.

**Q4: How would you optimize a query on a 100M row table?**  
Add indexes on WHERE/JOIN columns. Use partitioning by date. Avoid functions on indexed columns. Use covering indexes. Pre-aggregate for dashboards.

**Q5: What is the difference between CHAR and VARCHAR?**  
CHAR is fixed-length (always uses defined space). VARCHAR is variable-length (uses only needed space). Use VARCHAR for most cases.

**Q6: What are isolation levels?**  
READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE. Higher = more consistent, slower. Most production DBs use READ COMMITTED.

**Q7: What is a composite index? When to use it?**  
Index on multiple columns: `(col1, col2, col3)`. Follows leftmost prefix rule. Use when queries filter on multiple columns together.

**Q8: Explain window functions vs GROUP BY.**  
GROUP BY collapses rows (1 row per group). Window functions keep all rows and add computed column alongside.

**Q9: What are CTEs used for?**  
Readable temporary result sets within a query. Break complex logic into steps. Can be recursive for hierarchical data.

**Q10: How do you handle NULL values in calculations?**  
COALESCE to provide defaults. IFNULL for two-value check. NULLs propagate in arithmetic (NULL + 5 = NULL).

**Q11: What's the difference between DELETE and TRUNCATE?**  
DELETE: row-by-row, logged, can rollback, WHERE supported. TRUNCATE: drops all rows instantly, minimal logging, no WHERE.

**Q12: What is database normalization?**  
Organizing data to reduce redundancy. 1NF: atomic values. 2NF: no partial dependencies. 3NF: no transitive dependencies.

**Q13: How to find the Nth highest salary/score?**  
```sql
SELECT DISTINCT cvss_score FROM vulnerability_scans ORDER BY cvss_score DESC LIMIT 1 OFFSET N-1;
-- Or with window function:
SELECT * FROM (SELECT *, DENSE_RANK() OVER (ORDER BY cvss_score DESC) AS rnk FROM vulnerability_scans) t WHERE rnk = N;
```

**Q14: What is referential integrity?**  
FOREIGN KEY ensures that a value in one table exists in another table. Prevents orphan records.

**Q15: Difference between IN and EXISTS performance?**  
IN: evaluates full subquery first. EXISTS: stops at first match. EXISTS is faster for large subqueries.

**Q16: What is a stored procedure vs a view?**  
View: saved SELECT query (virtual table). Stored procedure: saved block of SQL logic with parameters, control flow, variables.

**Q17: What is an execution plan?**  
DB optimizer's strategy for executing a query: which indexes to use, join order, scan method. EXPLAIN shows this.

**Q18: How do you prevent SQL injection?**  
Parameterized queries (prepared statements). Never concatenate user input into SQL strings. Input validation. Least-privilege DB accounts.

**Q19: What are temp tables vs CTEs?**  
Temp tables: physical tables in tempdb, persist during session, indexed. CTEs: logical, exist only during query execution, not indexed.

**Q20: What is sharding?**  
Horizontal partitioning across multiple DB servers. Each shard holds a subset of data. Used for massive scale (billions of rows).

**Q21: How to detect slow queries in production?**  
Enable slow query log. Monitor query execution times. Use EXPLAIN on frequent queries. Set up alerts for queries exceeding thresholds.

**Q22: What is query caching?**  
DB caches query results. Same query returns cached result without re-execution. Invalidated when underlying data changes.
