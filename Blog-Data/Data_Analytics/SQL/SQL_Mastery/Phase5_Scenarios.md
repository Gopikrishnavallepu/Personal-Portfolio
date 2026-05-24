# SQL Mastery — Phase 5: Scenario-Based Learning
## Real SOC Workflows Built with SQL

---

# 1. Detect Suspicious Login Patterns

## 1.1 Brute Force Detection

```sql
-- Find IPs with > 5 failed logins in 10-minute windows
WITH failed_windows AS (
    SELECT 
        source_ip,
        DATE_FORMAT(event_time, '%Y-%m-%d %H:%i') AS minute_bucket,
        COUNT(*) AS fail_count,
        MIN(event_time) AS first_attempt,
        MAX(event_time) AS last_attempt,
        TIMESTAMPDIFF(SECOND, MIN(event_time), MAX(event_time)) AS duration_seconds
    FROM login_events
    WHERE status = 'failure'
    GROUP BY source_ip, DATE_FORMAT(event_time, '%Y-%m-%d %H:%i')
    HAVING COUNT(*) >= 5
)
SELECT 
    fw.*,
    COALESCE(ti.threat_type, 'Unknown') AS threat_classification,
    COALESCE(ti.confidence, 0) AS threat_confidence
FROM failed_windows fw
LEFT JOIN threat_intel ti ON fw.source_ip = ti.indicator AND ti.indicator_type = 'ip'
ORDER BY fw.fail_count DESC;
```

## 1.2 Impossible Travel Detection

```sql
-- Users who logged in from two different countries within 1 hour
WITH login_pairs AS (
    SELECT 
        le.user_id,
        u.username,
        le.source_ip AS current_ip,
        le.geo_location AS current_location,
        le.event_time AS current_time,
        LAG(le.source_ip) OVER (PARTITION BY le.user_id ORDER BY le.event_time) AS prev_ip,
        LAG(le.geo_location) OVER (PARTITION BY le.user_id ORDER BY le.event_time) AS prev_location,
        LAG(le.event_time) OVER (PARTITION BY le.user_id ORDER BY le.event_time) AS prev_time
    FROM login_events le
    INNER JOIN users u ON le.user_id = u.user_id
    WHERE le.status = 'success'
)
SELECT 
    username,
    prev_location,
    prev_time,
    current_location,
    current_time,
    TIMESTAMPDIFF(MINUTE, prev_time, current_time) AS minutes_between,
    prev_ip,
    current_ip
FROM login_pairs
WHERE prev_location IS NOT NULL
  AND prev_location != current_location
  AND TIMESTAMPDIFF(MINUTE, prev_time, current_time) <= 60
ORDER BY minutes_between ASC;
```

## 1.3 After-Hours Access Detection

```sql
-- Logins between 10 PM and 6 AM (non-business hours)
SELECT 
    u.username,
    u.department,
    le.source_ip,
    le.destination_ip,
    le.event_time,
    le.auth_method,
    le.geo_location,
    CASE 
        WHEN HOUR(le.event_time) BETWEEN 0 AND 5 THEN 'Late Night (12AM-6AM)'
        WHEN HOUR(le.event_time) BETWEEN 22 AND 23 THEN 'Evening (10PM-12AM)'
    END AS time_category,
    a.hostname AS target_system,
    a.is_critical AS target_is_critical
FROM login_events le
INNER JOIN users u ON le.user_id = u.user_id
LEFT JOIN assets a ON le.destination_ip = a.ip_address
WHERE le.status = 'success'
  AND (HOUR(le.event_time) >= 22 OR HOUR(le.event_time) <= 5)
ORDER BY le.event_time DESC;
```

## 1.4 Credential Compromise Detection

```sql
-- Users with both failed logins from external IPs AND successful login after (credential stuffing)
WITH external_failures AS (
    SELECT user_id, source_ip, event_time
    FROM login_events
    WHERE status = 'failure' AND source_ip NOT LIKE '10.%'
),
successful_after_failure AS (
    SELECT 
        le.user_id,
        u.username,
        ef.source_ip AS attack_ip,
        ef.event_time AS attack_time,
        le.source_ip AS success_ip,
        le.event_time AS success_time,
        TIMESTAMPDIFF(MINUTE, ef.event_time, le.event_time) AS minutes_after_attack
    FROM login_events le
    INNER JOIN external_failures ef ON le.user_id = ef.user_id
    INNER JOIN users u ON le.user_id = u.user_id
    WHERE le.status = 'success'
      AND le.event_time > ef.event_time
      AND TIMESTAMPDIFF(HOUR, ef.event_time, le.event_time) <= 24
)
SELECT * FROM successful_after_failure
ORDER BY minutes_after_attack ASC;
```

---

# 2. Fraud / Data Exfiltration Detection

## 2.1 Unusual Data Access Patterns

```sql
-- Users accessing production databases they don't normally access
WITH user_normal_targets AS (
    SELECT user_id, destination_ip, COUNT(*) AS access_count
    FROM login_events
    WHERE event_time < '2024-03-15'
      AND status = 'success'
    GROUP BY user_id, destination_ip
),
recent_access AS (
    SELECT user_id, destination_ip, event_time
    FROM login_events
    WHERE event_time >= '2024-03-15'
      AND status = 'success'
)
SELECT 
    u.username,
    ra.destination_ip,
    a.hostname,
    a.is_critical,
    ra.event_time,
    'FIRST TIME ACCESS' AS anomaly_type
FROM recent_access ra
INNER JOIN users u ON ra.user_id = u.user_id
LEFT JOIN assets a ON ra.destination_ip = a.ip_address
LEFT JOIN user_normal_targets unt ON ra.user_id = unt.user_id AND ra.destination_ip = unt.destination_ip
WHERE unt.access_count IS NULL  -- Never accessed this target before
  AND a.is_critical = TRUE      -- ... and it's a critical asset
ORDER BY ra.event_time DESC;
```

## 2.2 Alert-to-Threat Intel Correlation

```sql
-- Cross-reference all alerts with threat intelligence for enrichment
SELECT 
    sa.alert_id,
    sa.alert_name,
    sa.severity,
    sa.source_ip,
    sa.mitre_tactic,
    sa.mitre_technique,
    ti.threat_type,
    ti.confidence AS intel_confidence,
    ti.source AS intel_source,
    CASE 
        WHEN ti.confidence >= 90 THEN 'CONFIRMED THREAT'
        WHEN ti.confidence >= 70 THEN 'HIGH PROBABILITY'
        WHEN ti.confidence >= 50 THEN 'MODERATE - INVESTIGATE'
        ELSE 'LOW - MONITOR'
    END AS threat_assessment
FROM security_alerts sa
LEFT JOIN threat_intel ti ON sa.source_ip = ti.indicator AND ti.indicator_type = 'ip'
WHERE sa.status NOT IN ('resolved', 'false_positive')
ORDER BY ti.confidence DESC NULLS LAST, sa.severity;
```

---

# 3. SOC Dashboard Reports

## 3.1 Executive Summary Report

```sql
-- Security posture overview for CISO briefing
SELECT 
    'Alerts' AS category,
    COUNT(*) AS total,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN status NOT IN ('resolved', 'false_positive') THEN 1 ELSE 0 END) AS open_count
FROM security_alerts
WHERE alert_time >= NOW() - INTERVAL 7 DAY

UNION ALL

SELECT 
    'Vulnerabilities',
    COUNT(*),
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)
FROM vulnerability_scans

UNION ALL

SELECT 
    'Incidents',
    COUNT(*),
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status NOT IN ('closed', 'recovered') THEN 1 ELSE 0 END)
FROM incidents;
```

## 3.2 Vulnerability SLA Tracking

```sql
-- Which critical vulnerabilities are past their patch deadline?
SELECT 
    a.hostname,
    a.ip_address,
    a.environment,
    vs.cve_id,
    vs.vuln_name,
    vs.cvss_score,
    vs.patch_deadline,
    DATEDIFF(CURDATE(), vs.patch_deadline) AS days_overdue,
    CASE 
        WHEN vs.patch_deadline < CURDATE() THEN '🔴 OVERDUE'
        WHEN vs.patch_deadline <= CURDATE() + INTERVAL 3 DAY THEN '🟡 DUE SOON'
        ELSE '🟢 ON TRACK'
    END AS sla_status
FROM vulnerability_scans vs
INNER JOIN assets a ON vs.asset_id = a.asset_id
WHERE vs.status = 'open' AND vs.severity IN ('critical', 'high')
ORDER BY vs.patch_deadline ASC;
```

## 3.3 MITRE ATT&CK Coverage

```sql
-- Which ATT&CK tactics are we seeing? Where are the gaps?
SELECT 
    mitre_tactic,
    mitre_technique,
    COUNT(*) AS alert_count,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
    ROUND(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS resolution_rate
FROM security_alerts
WHERE mitre_tactic IS NOT NULL
GROUP BY mitre_tactic, mitre_technique
ORDER BY alert_count DESC;
```

## 3.4 Analyst Performance Metrics

```sql
-- SOC analyst performance dashboard
SELECT 
    u.full_name AS analyst,
    COUNT(sa.alert_id) AS total_assigned,
    SUM(CASE WHEN sa.status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN sa.status = 'false_positive' THEN 1 ELSE 0 END) AS false_positives,
    SUM(CASE WHEN sa.status NOT IN ('resolved', 'false_positive') THEN 1 ELSE 0 END) AS still_open,
    ROUND(
        SUM(CASE WHEN sa.status IN ('resolved', 'false_positive') THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(COUNT(sa.alert_id), 0), 1
    ) AS closure_rate_pct
FROM users u
LEFT JOIN security_alerts sa ON u.user_id = sa.assigned_to
WHERE u.department = 'SOC'
GROUP BY u.user_id, u.full_name
ORDER BY closure_rate_pct DESC;
```

---

# 4. Risk Scoring Model

```sql
-- Calculate risk score per asset (vulnerability + alert + criticality weighted)
WITH asset_vuln_score AS (
    SELECT 
        asset_id,
        SUM(CASE severity 
            WHEN 'critical' THEN 10
            WHEN 'high' THEN 7
            WHEN 'medium' THEN 4
            WHEN 'low' THEN 1
            ELSE 0
        END) AS vuln_risk_score,
        COUNT(*) AS vuln_count
    FROM vulnerability_scans
    WHERE status = 'open'
    GROUP BY asset_id
),
asset_alert_score AS (
    SELECT 
        a.asset_id,
        SUM(CASE sa.severity 
            WHEN 'critical' THEN 10
            WHEN 'high' THEN 7
            WHEN 'medium' THEN 4
            WHEN 'low' THEN 1
            ELSE 0
        END) AS alert_risk_score,
        COUNT(*) AS alert_count
    FROM security_alerts sa
    INNER JOIN assets a ON sa.source_ip = a.ip_address OR sa.destination_ip = a.ip_address
    WHERE sa.status NOT IN ('resolved', 'false_positive')
    GROUP BY a.asset_id
)
SELECT 
    a.hostname,
    a.ip_address,
    a.environment,
    a.is_critical,
    COALESCE(avs.vuln_count, 0) AS open_vulns,
    COALESCE(avs.vuln_risk_score, 0) AS vuln_score,
    COALESCE(aas.alert_count, 0) AS active_alerts,
    COALESCE(aas.alert_risk_score, 0) AS alert_score,
    (COALESCE(avs.vuln_risk_score, 0) + COALESCE(aas.alert_risk_score, 0)) 
        * CASE WHEN a.is_critical THEN 2 ELSE 1 END AS total_risk_score,
    CASE 
        WHEN (COALESCE(avs.vuln_risk_score, 0) + COALESCE(aas.alert_risk_score, 0)) 
             * CASE WHEN a.is_critical THEN 2 ELSE 1 END >= 30 THEN '🔴 CRITICAL RISK'
        WHEN (COALESCE(avs.vuln_risk_score, 0) + COALESCE(aas.alert_risk_score, 0)) 
             * CASE WHEN a.is_critical THEN 2 ELSE 1 END >= 15 THEN '🟡 HIGH RISK'
        ELSE '🟢 MODERATE'
    END AS risk_level
FROM assets a
LEFT JOIN asset_vuln_score avs ON a.asset_id = avs.asset_id
LEFT JOIN asset_alert_score aas ON a.asset_id = aas.asset_id
ORDER BY total_risk_score DESC;
```

---

# 5. Practice Scenarios

1. **Build a query** that identifies all users who logged in to production database servers from non-corporate IPs
2. **Create a report** showing the top 5 most targeted assets (by alert count) with their vulnerability status
3. **Write a threat hunting query** that finds login events from IPs in threat_intel that resulted in successful authentication
4. **Build an SLA dashboard** showing which incidents have been open longer than 24 hours
5. **Create a weekly report** query showing alert trends (this week vs last week by severity)
