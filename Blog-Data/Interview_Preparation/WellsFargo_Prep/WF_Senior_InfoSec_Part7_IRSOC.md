# PART 7: MONITORING, INCIDENT RESPONSE & SOC (20–25 minutes)

---

## 7.1 "What is your experience with **SIEM** platforms (e.g., Splunk, QRadar, Sentinel)? What kind of use cases have you built?"

**Answer Outline:**

**SIEM experience:**

| Platform | Experience Level | Context |
|----------|-----------------|---------|
| **Splunk** | Advanced | Primary SIEM in current role. Built dashboards, correlation searches, alerts |
| **QRadar** | Intermediate | Used in previous role. Managed log sources, tuned offenses |
| **Sentinel** | Intermediate | Used for Azure-based workloads. Built KQL queries and analytics rules |

**Use cases I've built:**

**1. Brute force detection:**
```
Rule: More than 10 failed login attempts from single source IP within 5 minutes
→ Alert: "Potential brute force attack"
→ Auto-response: Block IP at firewall for 1 hour
→ Context enrichment: Check if IP is in threat intel feed
```

**2. Impossible travel:**
```
Rule: Same user logs in from two geographically distant locations within 30 minutes
(e.g., New York and London within 20 minutes → physically impossible)
→ Alert: "Impossible travel detected — possible credential compromise"
→ Action: Force MFA re-verification; disable session
```

**3. Lateral movement detection:**
```
Rule: Internal host contacts >10 other internal hosts on port 445 (SMB) within 10 minutes
→ Alert: "Potential lateral movement / worm spreading via SMB"
→ Correlation: Check EDR for process execution on source host
→ Action: Isolate host; investigate
```

**4. Data exfiltration:**
```
Rule: Host uploads >500MB to external IP within 1 hour (outside normal patterns)
→ Alert: "Potential data exfiltration"
→ Context: Is this a known backup destination? Is the user authorized?
→ Action: Investigate; check DLP alerts
```

**5. Privileged account abuse:**
```
Rule: Service account logs in interactively (shouldn't happen — service accounts run automated jobs)
→ Alert: "Service account interactive login — possible misuse"
→ Action: Investigate; verify with account owner
```

**6. Cloud security events:**
```
Rule: CloudTrail event "PutBucketPolicy" with public access → CRITICAL alert
Rule: Root account used → CRITICAL alert
Rule: IAM policy allowing * resources and * actions created → HIGH alert
Rule: Security group modified to allow 0.0.0.0/0 → HIGH alert
```

**7. Compliance monitoring:**
```
Rule: No audit log received from critical server for >1 hour → alert
Rule: Firewall rule changed outside change window → alert
Rule: Admin password not rotated in 90 days → alert
```

**SIEM architecture I've designed:**

```
Log Sources → Log Collectors/Forwarders → SIEM Platform → Analytics Engine
                                                              ↓
                                              Dashboards / Alerts / Reports
                                                              ↓
                                              SOC Analysts / Automated Response
```

**Key metrics I track for SIEM health:**
- Events per second (EPS) — capacity planning
- License usage — cost management
- Log source coverage — are all critical systems sending logs?
- Alert volume — too many = tuning needed
- False positive rate — <20% is good
- Mean time to investigate — SOC efficiency

**Your experience:** "I manage a Splunk deployment ingesting 50,000+ EPS from 200+ log sources. I've built 60+ correlation rules covering the MITRE ATT&CK framework. Our detection coverage for critical techniques (credential dumping, lateral movement, data exfiltration) is >80%. I regularly review and tune rules to keep false positive rate below 15%."

---

## 7.2 "How do you design and tune detection rules to reduce false positives while maintaining coverage?"

**Answer Outline:**

**The false positive problem:**
- Too many false positives → alert fatigue → analysts ignore alerts → real attacks missed
- Too few alerts (over-tuned) → missed detections → breaches go undetected
- **Goal: High true-positive rate with low false-positive rate**

**Detection rule design process:**

**Step 1: Start with threat model**
- "What are we trying to detect?" → Map to MITRE ATT&CK techniques
- Example: "Detect credential dumping (T1003)" → What does that look like in our environment?

**Step 2: Write initial rule (broad)**
```
Rule v1: Alert when process "mimikatz.exe" OR "procdump.exe" runs on any endpoint
→ Problem: Catches legitimate admin use of procdump for debugging
```

**Step 3: Add context (reduce noise)**
```
Rule v2: Alert when mimikatz/procdump runs on endpoint
  AND user is NOT in "approved_security_tools" group
  AND time is NOT during maintenance window
  AND target system accesses LSASS process
→ Better: Filters out legitimate use
```

**Step 4: Correlate with other signals**
```
Rule v3: Alert when:
  - mimikatz/procdump runs on endpoint (EDR signal)
  AND - unsuccessful login attempts follow within 30 min (auth logs)
  AND - connection to unusual internal systems detected (network logs)
→ High confidence: This pattern strongly suggests active attacker
```

**Step 5: Test and baseline**
- Run rule in "alert only" mode for 2 weeks. Don't page SOC.
- Review triggered alerts: How many are true positives? False positives?
- Adjust thresholds: "Change from 5 to 15 failed logins" if too many normal false triggers.

**Step 6: Continuous tuning cycle**
```
Alert triggers → SOC investigates → Outcome (TP or FP)
                                         ↓
                              FP → Why was it false?
                                   → Add exception
                                   → Adjust threshold
                                   → Add context filter
                              TP → Document → Improve rule
                                   → Share with team
```

**Tuning techniques:**

| Technique | Example |
|-----------|---------|
| **Whitelisting** | Exclude known-good: Vulnerability scanner IP, backup server traffic |
| **Threshold adjustment** | "Failed logins > 5 in 5 min" → "Failed logins > 15 in 5 min" (environment-specific baseline) |
| **Time-based filtering** | Suppress alerts during known maintenance windows |
| **User-based filtering** | Security team running authorized tools → suppress for their accounts |
| **Correlation** | Require multiple signals before alerting (single signal = too noisy) |
| **Severity layering** | Low-confidence = info; medium = investigation; high = page SOC |

**Metrics:**
- **Detection rate:** % of known attacks detected (target >95% for critical techniques)
- **False positive rate:** % of alerts that are false (target <15%)
- **Alert-to-incident ratio:** How many alerts become real incidents? (healthy: 1 in 10–20)
- **Tuning velocity:** How many rules tuned per week?

**Your experience:** "When I joined, false positive rate was 60%—analysts were overwhelmed. Over 6 months, I systematically reviewed each rule, added context enrichment, implemented whitelisting for known-good activity, and tuned thresholds. Result: False positives dropped to 12% while detection coverage actually improved (added 20 new rules during tuning). SOC analysts now spend time investigating real threats, not chasing noise."

---

## 7.3 "Walk me through your **incident response lifecycle** for a serious security incident."

**Answer Outline:**

**IR Lifecycle (NIST SP 800-61):**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PREPARATION  │ →  │  DETECTION   │ →  │ CONTAINMENT  │ →  │ ERADICATION  │
│              │    │  & ANALYSIS  │    │              │    │              │
│ - IR plan    │    │ - SIEM alert │    │ - Isolate    │    │ - Remove     │
│ - Playbooks  │    │ - Triage     │    │   affected   │    │   malware    │
│ - Team roles │    │ - Classify   │    │   systems    │    │ - Patch vuln │
│ - Tools      │    │ - Scope      │    │ - Preserve   │    │ - Reset      │
│ - Drills     │    │   assessment │    │   evidence   │    │   credentials│
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    ↓
                                        ┌──────────────┐    ┌──────────────┐
                                        │   LESSONS    │ ←  │  RECOVERY    │
                                        │   LEARNED    │    │              │
                                        │              │    │ - Restore    │
                                        │ - Post-mortem│    │   from backup│
                                        │ - Update     │    │ - Monitor    │
                                        │   playbooks  │    │ - Verify     │
                                        │ - Improve    │    │   clean      │
                                        └──────────────┘    └──────────────┘
```

**Walkthrough of a serious incident (ransomware):**

**Phase 1: Preparation (Before incident)**
- IR plan documented and tested
- Team roles assigned: IR lead, forensics analyst, communications lead, legal, IT operations
- Tools ready: forensic workstation, memory capture tools, network isolation capability
- Playbooks: ransomware, data breach, insider threat, DDoS, compromised credentials
- Tabletop exercises: quarterly simulation with all stakeholders

**Phase 2: Detection & Analysis (T+0 to T+30 min)**
- **Alert:** EDR detects mass file encryption on 3 servers
- **Triage:** SOC analyst validates alert (not false positive)
- **Classification:** Severity = Critical (production systems affected, potential data loss)
- **Scope assessment:** How many systems? Which data? How did attacker get in?
  - Check SIEM: When did first suspicious activity occur? (Patient zero)
  - Check EDR: Which process is encrypting files? What's the ransomware variant?
  - Check network: Is there outbound C2 communication?

**Phase 3: Containment (T+30 min to T+2 hours)**
- **Short-term:** Isolate affected servers from network (disable NIC, firewall rules)
- **Prevent spread:** Block C2 IP/domain at firewall; disable compromised accounts
- **Preserve evidence:** Memory dump, disk image of affected server; packet capture
- **Communication:** Notify CISO, legal, management; activate IR team
- **Decision:** Do NOT pay ransom (organizational policy)

**Phase 4: Eradication (T+2 hours to T+24 hours)**
- **Root cause:** How did ransomware enter? (Phishing email → macro → PowerShell → ransomware)
- **Remove malware:** EDR removes ransomware from all affected endpoints
- **Patch vulnerability:** Update email gateway to block malicious macros
- **Reset credentials:** All admin passwords reset; all affected user passwords reset
- **Block indicators:** Add ransomware hashes, C2 IPs, and phishing sender to blocklists

**Phase 5: Recovery (T+24 hours to T+1 week)**
- **Restore from backup:** Verify backups are clean (not infected). Restore encrypted files.
- **Rebuild systems:** If backup not available, rebuild from clean image.
- **Monitor:** Enhanced monitoring for 30 days—watch for re-infection or backdoors
- **Verify:** Confirm all systems clean; all indicators of compromise removed
- **Resume operations:** Gradual restoration of services

**Phase 6: Lessons Learned (T+1 week to T+2 weeks)**
- **Post-mortem meeting:** All stakeholders review timeline, decisions, outcomes
- **Report:** Document everything: timeline, root cause, impact, response actions, costs
- **Improvements:**
  - "Improve email filtering to catch macro-based attacks"
  - "Add detection rule for mass file encryption pattern"
  - "Update IR playbook with lessons learned"
  - "Conduct phishing training for employees who clicked"
- **Regulatory notification:** If PII affected, notify regulators per requirements (72 hours GDPR)

---

## 7.4 "Tell me about a major incident you handled end-to-end. What happened, what did you do, and what was the outcome?"

**Answer Outline (STAR format):**

**Situation:** "Our SOC detected unusual outbound traffic from a production database server at 2 AM. The server was communicating with an external IP not in our known-good list. Data volume was 10x higher than baseline."

**Task:** "As the senior analyst on call, I led the investigation and response."

**Action:**
1. **Detection (T+0):** SIEM correlated two signals: (a) network anomaly (large outbound transfer), (b) VPC Flow Logs showing connection to unknown external IP
2. **Triage (T+15 min):** Confirmed it wasn't backup traffic (checked backup schedule). External IP was flagged by threat intelligence as potential C2 server.
3. **Containment (T+30 min):** Isolated database server from network (security group change). Blocked external IP at firewall. Disabled the service account accessing the database.
4. **Investigation (T+1h):** Analyzed CloudTrail: Service account had been compromised via leaked API key in a public GitHub repo (developer accidentally pushed it). Attacker used the key to access production database.
5. **Scope (T+2h):** Determined attacker accessed customer name and email data (not financial data or SSN—those were in a separate encrypted database). Approximately 5,000 records potentially affected.
6. **Eradication (T+4h):** Rotated all API keys. Scanned all GitHub repos for exposed secrets using TruffleHog. Implemented pre-commit hooks to block secret commits.
7. **Recovery (T+8h):** Restored clean database from backup. Enhanced monitoring on affected systems.
8. **Lessons learned:** Implemented automated secret scanning in CI/CD. Deployed AWS GuardDuty for anomalous API usage detection. Conducted developer training on secret management.

**Result:**
- Breach contained within 30 minutes of detection
- Customer impact: 5,000 records (name/email only) — notified affected customers
- Regulatory: Filed breach notification per requirements
- Improvements: Secret scanning prevented 12 additional potential leaks in the following quarter
- No financial data compromised

---

## 7.5 "How do you triage and prioritize alerts when there's a high volume from multiple tools?"

**Answer Outline:**

**Alert triage framework:**

**Priority 1: Classification by source confidence**
```
HIGH confidence sources: EDR (malware detected), SIEM correlation (multi-signal), 
                         GuardDuty (known threat), DLP (confirmed PII leak)
                         → Investigate IMMEDIATELY

MEDIUM confidence:        IDS (signature match), single SIEM alert, suspicious login
                         → Investigate within 1 hour

LOW confidence:           Info-level alerts, vulnerability scan findings, awareness alerts
                         → Queue for review; batch processing
```

**Priority 2: Asset criticality**
- Critical asset (payment system, customer database) → Priority ↑
- Low-risk asset (dev sandbox, test server) → Priority ↓

**Priority 3: Threat intelligence enrichment**
- Alert involves known malicious IP/domain/hash → Priority ↑
- Alert involves unknown IP → Priority standard

**Triage decision tree:**
```
Alert received
    ↓
Is it a known false positive? → YES → Suppress; update tuning
    ↓ NO
Is it from a high-confidence source? → YES → Investigate immediately
    ↓ NO
Does it involve a critical asset? → YES → Investigate within 1 hour
    ↓ NO
Does it correlate with other alerts? → YES → Escalate priority; investigate
    ↓ NO
Queue for batch review → Analyst reviews during scheduled queue time
```

**Practical approach during high-volume periods:**
1. **SOAR automation:** Auto-enrich alerts (threat intel, asset lookup, user context) before analyst sees them
2. **Alert grouping:** Group related alerts into one investigation (e.g., 50 failed logins from same IP = 1 investigation, not 50)
3. **Severity-based SLAs:** Critical = 15 min response; High = 1 hour; Medium = 4 hours; Low = 24 hours
4. **Escalation:** If queue exceeds capacity, escalate to management for additional resources

---

## 7.6 "How do you perform **root cause analysis** after an incident and ensure lessons learned are implemented?"

**Answer Outline:**

**Root Cause Analysis (RCA) process:**

**Step 1: Timeline reconstruction**
- Build detailed timeline: What happened, when, in what sequence
- Use: SIEM logs, EDR telemetry, network captures, interview notes
- "Event at T-72h: Phishing email delivered. T-48h: User clicked. T-24h: Malware installed. T-0: Data exfiltration detected."

**Step 2: 5 Whys technique**
```
1. Why was data exfiltrated? → Malware on server connected to C2 server
2. Why was malware on server? → Employee clicked phishing link, downloaded malware
3. Why did employee click? → Phishing email bypassed email filtering
4. Why did it bypass filtering? → New phishing technique not in signature database
5. Why wasn't it detected earlier? → No behavioral detection rule for this pattern
```
→ Root cause: Detection gap for new phishing techniques + missing behavioral rules

**Step 3: Contributing factors**
- Technical: Missing security control (no behavioral detection)
- Process: Phishing training was 6 months old; didn't cover this technique
- People: Employee wasn't aware of this specific lure type

**Step 4: Recommendations (with ownership)**

| Finding | Recommendation | Owner | Target Date | Priority |
|---------|---------------|-------|-------------|----------|
| Email filter gap | Update email filter to detect URL obfuscation | Email Admin | 7 days | P1 |
| Missing detection | Add SIEM rule for behavioral phishing detection | SOC Lead | 14 days | P1 |
| Training gap | Conduct emergency phishing awareness training | HR + Security | 7 days | P2 |
| Process gap | Quarterly phishing simulation exercises | Security Mgr | Ongoing | P2 |

**Step 5: Implementation tracking**
- Track each recommendation in JIRA/ServiceNow
- Weekly status updates until all items closed
- Verify implementation (test the fix)
- Report completion to management

**Step 6: Knowledge sharing**
- Share anonymized findings with broader security team
- Update playbooks with lessons learned
- Present at monthly security review meeting

---

## 7.7 "Describe your approach to **ransomware** incident handling in a bank's environment."

**Answer Outline:**

**Ransomware-specific playbook:**

**Phase 1: Immediate actions (first 15 minutes)**
1. **Confirm ransomware** (not false positive): Check ransom note, file extensions, encryption behavior
2. **Isolate affected systems:** Disconnect from network. Do NOT power off (preserve memory for forensics)
3. **Alert IR team:** Page IR lead, CISO, legal, communications
4. **Identify ransomware variant:** Check ransom note, encrypted file pattern → determine if decryptor exists
5. **Assess scope:** How many systems affected? Is it still spreading?

**Phase 2: Containment (15 min to 2 hours)**
6. **Stop the spread:** Block lateral movement at network level (segment affected VLAN)
7. **Block C2:** Identify C2 IP/domain; block at firewall/DNS
8. **Disable compromised accounts:** Prevent attacker from using stolen credentials
9. **Preserve evidence:** Memory dumps, disk images, network captures
10. **Check backups:** Are backups available and clean? Are they disconnected from network? (Critical: ransomware targets backups)

**Phase 3: Assessment (2-24 hours)**
11. **Root cause:** How did ransomware enter? (Phishing? RDP? Vulnerability?)
12. **Data assessment:** Was data exfiltrated BEFORE encryption? (Double extortion)
13. **Business impact:** Which services are down? Customer impact? Financial impact?
14. **Ransom decision:** Organizational policy: DO NOT PAY. Consult legal, law enforcement.

**Phase 4: Recovery (1-7 days)**
15. **Restore from backup:** Verify backup integrity. Restore in clean environment.
16. **Rebuild affected systems:** Clean OS install → deploy from known-good image
17. **Patch entry point:** Fix the vulnerability that allowed initial access
18. **Enhanced monitoring:** Watch for re-infection indicators for 30+ days
19. **Gradual service restoration:** Bring systems back online in priority order

**Phase 5: Post-incident (1-2 weeks)**
20. **Regulatory notifications:** If customer data affected, notify regulators
21. **Customer notifications:** If PII affected, notify customers per legal requirements
22. **Post-mortem:** Detailed timeline, root cause, improvements
23. **Training:** Address awareness gaps identified during incident

**Banking-specific considerations:**
- **Business continuity:** Activate BCP if core banking systems affected
- **Regulatory:** FDIC, OCC, SEC notification requirements
- **Customer communications:** Prepared holding statement; don't speculate
- **Law enforcement:** FBI IC3 notification; may assist with decryption
- **Insurance:** Notify cyber insurance carrier within policy timeframe

---

## 7.8 "How do you distinguish between **benign anomalies** and true malicious behavior in logs?"

**Answer Outline:**

**Framework for distinguishing benign vs malicious:**

| Signal | Benign Indicator | Malicious Indicator |
|--------|-----------------|-------------------|
| **Time of activity** | Business hours, known maintenance window | 2-4 AM, weekends, holidays |
| **User behavior** | Matches historical pattern | Deviates from norm (new system access, new geography) |
| **Data volume** | Within baseline range | 10x+ normal volume |
| **Destination** | Known internal/approved external | Unknown external, known-bad IP/domain |
| **Process behavior** | Expected software, normal execution | Unexpected process, unusual arguments, child processes |
| **Frequency** | Gradual, consistent | Sudden spike |
| **Context** | Matches change ticket, scheduled job | No corresponding change ticket |

**Decision process:**
1. **Check context first:** Is there a change ticket? Scheduled maintenance? Known activity?
2. **Enrich with threat intel:** Is the IP/domain/hash known-bad?
3. **Compare to baseline:** Is this within normal behavior for this user/system?
4. **Correlate with other signals:** Single anomaly might be benign. Multiple correlated anomalies = suspicious.
5. **When in doubt:** Investigate. Better to investigate 10 benign anomalies than miss 1 real attack.

---

## 7.9 "What metrics do you use to measure **SOC effectiveness**?"

**Answer Outline:**

| Metric Category | Metric | Target | Why |
|-----------------|--------|--------|-----|
| **Detection** | Mean Time to Detect (MTTD) | < 4 hours | How fast do we find threats? |
| **Detection** | Detection coverage (% MITRE ATT&CK) | > 75% | How many attack techniques can we detect? |
| **Response** | Mean Time to Respond (MTTR) | < 1 hour | How fast do we contain threats? |
| **Response** | Mean Time to Resolve (MTTR-full) | < 24 hours | How fast do we fully remediate? |
| **Quality** | False positive rate | < 15% | Are we chasing noise? |
| **Quality** | Alert-to-incident ratio | 1:15 to 1:20 | Healthy signal-to-noise ratio |
| **Efficiency** | Alerts handled per analyst per shift | 20-30 | Analyst workload balance |
| **Coverage** | Log source coverage | > 95% of critical systems | Are we monitoring everything important? |
| **Improvement** | Lessons learned implemented (%) | > 90% | Are we learning from incidents? |
| **Compliance** | SLA adherence (%) | > 95% | Are we meeting response time commitments? |

**Monthly reporting to management:**
- Trend charts (MTTD/MTTR over 12 months — should be improving)
- Incident summary by severity and category
- Top attack types encountered
- Detection coverage gaps and improvement plans
- Team capacity and resource needs

**Your experience:** "I track 10 SOC metrics monthly. Our MTTD improved from 8 hours to 2 hours over 12 months through better detection rules and SOAR automation. MTTR improved from 4 hours to 45 minutes. False positive rate decreased from 45% to 12% through systematic tuning. I present these metrics monthly to leadership, showing clear ROI on our security investments."

---
