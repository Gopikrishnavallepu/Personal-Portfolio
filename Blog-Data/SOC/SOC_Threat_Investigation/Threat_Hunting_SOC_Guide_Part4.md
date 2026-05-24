# 🎯 Threat Hunting SOC Guide — Part 4: C2, Exfiltration, Impact & Master Investigation Playbooks

---

# PART 4: C2, EXFILTRATION, IMPACT & COMPLETE SOC INVESTIGATION FRAMEWORKS

---

## 15. TA0011 — Command and Control (C2)

#### Overview
After establishing a foothold, adversaries need a **communication channel** back to their infrastructure to issue commands, receive output, and download additional tools. C2 is the adversary's lifeline — **cutting C2 = cutting the attacker off**.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1071.001 | Application Layer Protocol: Web (HTTP/S) | C2 over HTTP/HTTPS | Proxy logs, SSL inspection |
| T1071.004 | DNS | C2 encoded in DNS queries | DNS logs, passive DNS |
| T1573 | Encrypted Channel | Custom encryption for C2 | Network anomaly, JA3/JA3S |
| T1572 | Protocol Tunneling | Tunnel C2 inside SSH, DNS, ICMP | Deep packet inspection, anomaly |
| T1090.002 | External Proxy | Route C2 through proxies/CDNs | Proxy logs, domain fronting |
| T1105 | Ingress Tool Transfer | Download additional tools via C2 | Proxy, EDR, Sysmon 11 |
| T1571 | Non-Standard Port | C2 on unusual port (443 on HTTP) | Firewall, network anomaly |
| T1568.002 | Dynamic Resolution: DGA | Domain Generation Algorithms | DNS logs, entropy analysis |
| T1102 | Web Service | Use legitimate services (GitHub, Slack, Telegram) for C2 | Proxy, EDR |
| T1132 | Data Encoding | Base64/custom encoding in traffic | Network inspection |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Beaconing | Proxy/Firewall | Regular interval connections (every 60s ± jitter) to same domain/IP |
| DNS tunneling | DNS logs | High volume of TXT/NULL queries, long subdomain labels (>50 chars), high entropy |
| DGA domains | DNS logs | Algorithmically generated domains (high entropy, random characters) |
| Unusual User-Agents | Proxy logs | Non-browser HTTP traffic, custom user-agents, missing standard headers |
| Long DNS queries | DNS logs | Subdomain length > 50 characters (data in subdomain = exfil/C2) |
| JA3 fingerprints | Network sensor | Known malicious JA3 hashes (Cobalt Strike, Metasploit, Sliver) |
| Domain fronting | Proxy/TLS | SNI hostname differs from HTTP Host header |
| C2 via legitimate services | Proxy | Repeated API calls to pastebin, github raw, telegram bots, discord webhooks |

#### ✅ True Positive Scenario — HTTPS Beaconing (T1071.001 + T1573)

**Scenario:** Network anomaly detection identifies a workstation making HTTPS connections to `cdn-static-assets[.]com` every 62-68 seconds for 14 hours. The domain was registered 5 days ago and resolves to a VPS provider.

**Investigation Steps:**
```
1. CONFIRM BEACONING PATTERN
   □ Regular interval (62-68s) = consistent with C2 jitter → 🔴
   □ 14 hours of sustained beaconing = persistent implant
   □ HTTPS on port 443 → encrypted C2 channel
   □ New domain (5 days old) on VPS → throwaway infrastructure

2. DOMAIN/IP ANALYSIS
   □ WHOIS: registration date, registrar, privacy protection
   □ Passive DNS: what other IPs has this domain resolved to?
   □ VirusTotal: any malware samples communicating with this domain?
   □ URLScan.io: what does the website look like?
   □ JA3/JA3S hash: matches known C2 framework? (Cobalt Strike JA3)

3. ENDPOINT INVESTIGATION
   □ What process is making the connections? (Sysmon Event 3)
   □ Is it a legitimate process (svchost, explorer) or malicious binary?
   □ If legitimate process → possible process injection (check Sysmon 8)
   □ Check for parent process and full execution chain
   □ Check for persistence mechanism keeping the beacon alive

4. TLS/SSL INSPECTION
   □ If SSL inspection is available: inspect traffic content
   □ Check for unusual certificate properties (self-signed, short validity)
   □ Check certificate issuer and subject name
   □ Small POST requests (command check-in) → larger responses (commands)

5. RESPOND
   □ Block the domain and IP at firewall/proxy immediately
   □ DO NOT alert the user first — isolate endpoint silently
   □ Capture memory dump of the beaconing process
   □ Isolate the endpoint from the network
   □ Identify the malware/implant type (Cobalt Strike? Custom?)
   □ Search for same domain/IP/JA3 across all endpoints
   □ Check for lateral movement from this host
   □ Full forensic investigation
   □ Add IOCs to threat intel platform
```

**TP Confidence:** 🔴 CRITICAL — Regular beacon interval to new domain on VPS = confirmed C2 communication.

#### ✅ True Positive Scenario — DNS Tunneling C2 (T1071.004)

**Scenario:** DNS monitoring reveals a workstation sending 500+ DNS TXT queries per hour to subdomains of `update-check[.]xyz`. Subdomain labels are 60+ character Base64-encoded strings like: `dGhpcyBpcyBlbmNvZGVkIGRhdGE.update-check[.]xyz`

**Investigation Steps:**
```
1. CONFIRM DNS TUNNELING
   □ 500+ queries/hour to single domain → abnormal → 🔴
   □ Long subdomain labels (60+ chars) with Base64 encoding → DATA IN DNS
   □ TXT record queries → response carries C2 commands
   □ This is textbook DNS tunneling (dnscat2, iodine, Cobalt Strike DNS)

2. DECODE THE DATA
   □ Base64 decode subdomain labels → what data is being sent?
   □ Is it command output? Credential data? File contents?
   □ Check TXT responses → are C2 commands embedded?

3. ENDPOINT INVESTIGATION
   □ What process is generating DNS queries? (Sysmon Event 22 or Event 3)
   □ Is it a known DNS tunneling tool or custom implant?
   □ Check process tree and persistence
   □ When did the tunneling start? (first query timestamp)

4. NETWORK SCOPE
   □ Are other hosts querying the same domain?
   □ Does your DNS server forward to upstream? (queries visible there too)
   □ Calculate total data volume transferred via DNS

5. RESPOND
   □ Block the domain at DNS resolver (sinkhole to internal server)
   □ Isolate the endpoint
   □ Capture the DNS tunneling tool for analysis
   □ Create DNS analytics: flag domains with high query volume + long labels
   □ Consider DNS query length restrictions at resolver
   □ Deploy DNS security solution (DNS firewall/RPZ)
```

**TP Confidence:** 🔴 CRITICAL — High-volume encoded DNS queries to single domain = confirmed DNS tunneling C2.

---

## 16. TA0010 — Exfiltration

#### Overview
The adversary's **end goal** — stealing data out of the organization. Exfiltration can use the C2 channel, alternative protocols, or physical media.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1041 | Exfiltration Over C2 Channel | Use existing C2 to extract data | C2 detection + data volume |
| T1048 | Exfiltration Over Alternative Protocol | FTP, SFTP, DNS, SMTP | Network logs, DLP |
| T1567 | Exfiltration to Cloud Storage | Upload to Dropbox, OneDrive, Mega | Proxy, CASB, DLP |
| T1029 | Scheduled Transfer | Timed data transfers | Network anomaly, schedule |
| T1030 | Data Transfer Size Limits | Small chunks to avoid detection | Network anomaly |
| T1052 | Exfiltration Over Physical Medium | USB, portable drives | USB audit logs, DLP |
| T1537 | Transfer Data to Cloud Account | Upload to attacker's cloud | Cloud audit logs |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Large outbound transfers | Firewall/Proxy | Uploads > 100MB to external IPs/domains, especially after-hours |
| Cloud storage uploads | Proxy/CASB | Bulk uploads to personal Dropbox, Google Drive, Mega.nz |
| DNS exfiltration | DNS logs | Encoded data in subdomain labels (same as DNS C2) |
| Email exfiltration | Email gateway | Emails with large/numerous attachments to personal addresses |
| USB data copy | USB audit/DLP | Large file copies to removable media |
| Encrypted uploads | Proxy | Large HTTPS POSTs to unknown/new domains |
| Scheduled FTP | Firewall | Recurring FTP/SFTP connections to external at same time |

#### ✅ True Positive Scenario — Exfiltration to Cloud Storage (T1567)

**Scenario:** CASB alerts that user `s.contractor` uploaded 4.2 GB of data to a personal Mega.nz account during 1 AM - 3 AM. The data consists of 340 files from the Engineering share.

**Investigation Steps:**
```
1. CONFIRM ABNORMAL UPLOAD
   □ 4.2 GB upload to personal cloud storage → 🔴
   □ Mega.nz = encrypted cloud, popular for exfil
   □ 1-3 AM = outside business hours → suspicious timing
   □ Contractor account accessing Engineering data → policy violation at minimum

2. ANALYZE THE DATA
   □ What 340 files were uploaded? (DLP/CASB file listing)
   □ Classification: PII, trade secrets, source code, financial?
   □ Were files downloaded from Engineering share first? (Event 5145)
   □ Were files staged/archived before upload?

3. INVESTIGATE THE ACCOUNT
   □ Is s.contractor still an active contractor?
   □ Is this their typical work pattern?
   □ Check login history: was the account compromised?
   □ Check for impossible travel or unusual login source
   □ Interview the contractor (via HR/Legal)

4. DETERMINE INTENT: INSIDER THREAT vs. EXTERNAL COMPROMISE
   □ If contractor's account was hacked → external actor using their access
   □ If contractor intentionally exfiltrated → insider threat
   □ Check if contractor gave notice recently or has grievances
   □ Check for other data hoarding behavior in recent weeks

5. RESPOND
   □ Disable the contractor's account immediately
   □ Block Mega.nz at proxy (or at least personal accounts)
   □ Notify Legal, HR, and CISO about potential data breach
   □ Preserve all audit logs as evidence
   □ Request Mega.nz account takedown (through legal channels)
   □ Assess regulatory impact (GDPR, CCPA, export controls)
   □ Initiate incident response for data breach
   □ Review all contractor access permissions
```

**TP Confidence:** 🔴 CRITICAL — 4.2 GB upload to personal cloud at 1 AM by contractor = confirmed data exfiltration.

---

## 17. TA0040 — Impact

#### Overview
Adversaries may **destroy, encrypt, or disrupt** systems and data. This includes ransomware, data wiping, defacement, and denial of service. Impact is the **most visible** tactic — it's when the attack reaches its destructive conclusion.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1486 | Data Encrypted for Impact | Ransomware encryption | EDR, File integrity |
| T1485 | Data Destruction | Delete/overwrite data | EDR, File integrity |
| T1490 | Inhibit System Recovery | Delete shadow copies, backups | Event 4688 (vssadmin, wbadmin) |
| T1489 | Service Stop | Stop critical services | Event 7036 |
| T1491 | Defacement | Modify web content | File integrity, Web monitoring |
| T1561 | Disk Wipe | Wipe MBR or disk content | EDR, Boot sector monitoring |
| T1529 | System Shutdown/Reboot | Force reboot after encryption | Event 1074 |
| T1498 | Network Denial of Service | DDoS attacks | Network monitoring |

#### ✅ True Positive Scenario — Ransomware Pre-Deployment (T1486 + T1490)

**Scenario:** Multiple servers simultaneously execute:
```
vssadmin delete shadows /all /quiet
wmic shadowcopy delete
bcdedit /set {default} recoveryenabled No
wbadmin delete catalog -quiet
```
Followed by a new executable `svc_update.exe` dropping ransom notes named `RECOVER-FILES.txt` in multiple directories.

**Investigation Steps:**
```
1. IMMEDIATE — THIS IS AN ACTIVE RANSOMWARE ATTACK
   □ Shadow copy deletion + recovery disabled = pre-encryption → 🔴 CRITICAL
   □ Ransom note deployment = ACTIVE RANSOMWARE
   □ Time is critical — every second, more files encrypt
   □ ACTIVATE INCIDENT RESPONSE PLAN IMMEDIATELY

2. CONTAIN — FIRST PRIORITY (Minutes matter)
   □ Isolate ALL affected servers from network immediately
   □ Disable the account executing the ransomware
   □ Block the ransomware hash at EDR (auto-quarantine)
   □ Disconnect network segments to prevent spread
   □ Shut down shares (SMB) to prevent lateral encryption
   □ DO NOT shut down encrypted servers (memory forensics possible)

3. SCOPE THE ATTACK
   □ How many servers are affected?
   □ What data has been encrypted? Is it recoverable from backup?
   □ Are backups intact? (attackers often target backups first)
   □ Has the ransomware spread to workstations?
   □ Are domain controllers compromised?

4. INVESTIGATE THE KILL CHAIN
   □ How did the attacker get in? (Initial Access — check past days/weeks)
   □ How long has the attacker been in the environment? (dwell time)
   □ What credentials were compromised?
   □ What persistence was established? (must be removed before recovery)
   □ Was data exfiltrated BEFORE encryption? (double extortion)

5. RESPOND & RECOVER
   □ Engage executive leadership and legal counsel
   □ Contact cyber insurance provider
   □ Engage incident response firm (if needed)
   □ Determine ransom demand and payment policy
   □ Identify ransomware variant (ID Ransomware, check for decryptors)
   □ Begin restoration from clean backups (verify integrity first)
   □ Rebuild compromised systems from clean images
   □ Reset ALL passwords (assume complete credential compromise)
   □ Reset KRBTGT password (twice, 12-hour interval)
   □ Implement all missing security controls before reconnecting
   □ Post-incident: complete lessons learned review
```

**TP Confidence:** 🔴 CRITICAL — Shadow copy deletion + ransom notes = ACTIVE RANSOMWARE ATTACK. Maximum severity.

---

## 18. Master Investigation Playbooks

### 18.1 Full Attack Chain Investigation Playbook

When you discover a confirmed compromise, use this playbook to investigate the **complete kill chain**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│            FULL KILL CHAIN INVESTIGATION PLAYBOOK                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: ESTABLISH TIMELINE                                              │
│  □ When was the FIRST indicator of compromise?                          │
│  □ Build timeline: initial access → current state                       │
│  □ Use SIEM, EDR, and network logs to reconstruct events               │
│  □ Create visual timeline in investigation notes                        │
│                                                                          │
│  STEP 2: IDENTIFY INITIAL ACCESS (TA0001)                               │
│  □ How did the attacker get in? Phishing? Exploit? Stolen creds?       │
│  □ What was the first compromised system/account?                       │
│  □ When exactly did initial access occur?                                │
│                                                                          │
│  STEP 3: MAP EXECUTION (TA0002)                                         │
│  □ What was executed on the first compromised system?                   │
│  □ What tools did the attacker deploy?                                  │
│  □ Was it a known malware family or custom tooling?                     │
│                                                                          │
│  STEP 4: IDENTIFY PERSISTENCE (TA0003)                                  │
│  □ What persistence mechanisms were installed?                           │
│  □ Check: scheduled tasks, services, registry, startup, web shells     │
│  □ ALL persistence must be removed before recovery                      │
│                                                                          │
│  STEP 5: MAP PRIVILEGE ESCALATION (TA0004)                              │
│  □ How did the attacker escalate privileges?                            │
│  □ What is the highest privilege level achieved?                        │
│  □ Are domain admin credentials compromised?                            │
│                                                                          │
│  STEP 6: IDENTIFY CREDENTIAL ACCESS (TA0006)                           │
│  □ Were credentials dumped? Which accounts?                             │
│  □ Was DCSync performed?                                                │
│  □ All compromised credentials must be reset                            │
│                                                                          │
│  STEP 7: MAP LATERAL MOVEMENT (TA0008)                                  │
│  □ What systems did the attacker move to?                               │
│  □ What methods? (RDP, PsExec, WMI, WinRM, PTH)                       │
│  □ Complete inventory of ALL touched systems                            │
│                                                                          │
│  STEP 8: ASSESS DATA IMPACT (TA0009 + TA0010)                          │
│  □ Was data collected/staged?                                           │
│  □ Was data exfiltrated? To where? How much?                            │
│  □ What is the business/regulatory impact?                              │
│                                                                          │
│  STEP 9: CHECK FOR IMPACT (TA0040)                                      │
│  □ Was data destroyed or encrypted?                                     │
│  □ Were recovery mechanisms disabled?                                   │
│  □ What is the operational impact?                                      │
│                                                                          │
│  STEP 10: ERADICATE & RECOVER                                           │
│  □ Remove ALL persistence mechanisms                                    │
│  □ Reset ALL compromised credentials                                    │
│  □ Patch exploited vulnerabilities                                      │
│  □ Rebuild compromised systems                                          │
│  □ Restore from clean backups                                           │
│  □ Verify no attacker access remains                                    │
│  □ Enhanced monitoring for re-compromise                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 18.2 Key Windows Event IDs for Threat Hunting — Quick Reference

| Event ID | Log | Description | MITRE Tactic |
|----------|-----|-------------|--------------|
| **1** (Sysmon) | Sysmon | Process Creation | Execution, Discovery |
| **3** (Sysmon) | Sysmon | Network Connection | C2, Lateral Movement |
| **7** (Sysmon) | Sysmon | Image Loaded (DLL) | Defense Evasion |
| **8** (Sysmon) | Sysmon | CreateRemoteThread | Priv Esc, Defense Evasion |
| **10** (Sysmon) | Sysmon | Process Access | Credential Access |
| **11** (Sysmon) | Sysmon | File Create | Persistence, Collection |
| **13** (Sysmon) | Sysmon | Registry Modification | Persistence, Defense Evasion |
| **22** (Sysmon) | Sysmon | DNS Query | C2, Discovery |
| **1102** | Security | Audit Log Cleared | Defense Evasion |
| **4624** | Security | Successful Logon | Initial Access, Lat. Movement |
| **4625** | Security | Failed Logon | Credential Access (Brute Force) |
| **4648** | Security | Explicit Credential Logon | Lateral Movement |
| **4662** | Security | Object Access (AD) | Credential Access (DCSync) |
| **4672** | Security | Special Privileges Assigned | Privilege Escalation |
| **4688** | Security | Process Creation | Execution, Discovery |
| **4697** | Security | Service Installed | Persistence |
| **4698** | Security | Scheduled Task Created | Persistence |
| **4720** | Security | User Account Created | Persistence |
| **4728/4732** | Security | Member Added to Group | Privilege Escalation |
| **4769** | Security | Kerberos TGS Request | Credential Access |
| **5140** | Security | Network Share Access | Lateral Movement, Collection |
| **5145** | Security | Detailed Share Access | Lateral Movement, Collection |
| **7036** | System | Service State Change | Impact (Service Stop) |
| **7045** | System | Service Installed | Persistence, Lateral Movement |
| **4104** | PowerShell | Script Block Logging | Execution |

### 18.3 IOC Types to Collect and Share

| IOC Type | Examples | Where to Find |
|----------|---------|---------------|
| **IP Addresses** | C2 server IPs, scanner IPs | Firewall, proxy, Sysmon Event 3 |
| **Domains** | C2 domains, phishing domains | DNS logs, proxy, email headers |
| **URLs** | Payload URLs, phishing URLs | Proxy, email body, script content |
| **File Hashes** | Malware hashes (MD5, SHA1, SHA256) | EDR, Sysmon Event 11, file analysis |
| **Email Addresses** | Attacker sender addresses | Email headers |
| **File Names/Paths** | Malware file names, persistence paths | EDR, Sysmon, file system |
| **Registry Keys** | Persistence registry entries | Sysmon Event 13, registry audit |
| **User Agents** | C2 beacon user agents | Proxy logs |
| **JA3/JA3S Hashes** | TLS fingerprints of C2 | Network sensor, SSL inspection |
| **YARA Rules** | Pattern-based malware detection | Custom creation from analysis |
| **Sigma Rules** | Log-based detection rules | Custom creation from hunting |

---

## 19. Threat Hunting Report Template

```
═══════════════════════════════════════════════════════════
              THREAT HUNTING REPORT
═══════════════════════════════════════════════════════════

Hunt ID:            TH-YYYY-MM-###
Hunt Name:          [Descriptive Name]
Hunter:             [Analyst Name]
Date:               [Start Date] — [End Date]
Status:             [Active / Completed / Escalated to IR]

───────────────────────────────────────────────────────────
HYPOTHESIS
───────────────────────────────────────────────────────────
[What were you looking for and why?]

MITRE ATT&CK Mapping:
  Tactic:     [e.g., Persistence]
  Technique:  [e.g., T1053.005 — Scheduled Task]

Trigger:
  □ Intelligence-driven (cite report/advisory)
  □ Hypothesis-driven (cite reasoning)
  □ Anomaly-driven (cite data pattern)

───────────────────────────────────────────────────────────
DATA SOURCES & QUERIES
───────────────────────────────────────────────────────────
Data Sources Used:
  □ SIEM (Splunk / Sentinel / QRadar)
  □ EDR (CrowdStrike / Defender / SentinelOne)
  □ Firewall / Proxy / DNS
  □ Active Directory / Azure AD
  □ Other: ____________

Key Queries:
  [Paste actual SIEM/EDR queries used]

Time Range Searched:  [e.g., Last 30 days]
Scope:               [e.g., All endpoints / Servers only]

───────────────────────────────────────────────────────────
FINDINGS
───────────────────────────────────────────────────────────
Result:  □ Positive (Threat Found)  □ Negative (No Threat)

If Positive:
  Summary:        [Brief description of finding]
  Severity:       [Critical / High / Medium / Low]
  Affected Assets: [List hosts, users, services]
  IOCs Found:     [List IPs, domains, hashes]
  Timeline:       [Attack timeline]

If Negative:
  Conclusion:     [Why no threat was found]
  Coverage Gaps:  [Any data sources missing?]

───────────────────────────────────────────────────────────
ACTIONS TAKEN
───────────────────────────────────────────────────────────
  □ Escalated to Incident Response (IR-YYYY-###)
  □ IOCs submitted to threat intel platform
  □ New SIEM detection rule created (Rule ID: ___)
  □ Sigma/YARA rule written
  □ Tuned existing detection rules
  □ Reported to management
  □ No action required

───────────────────────────────────────────────────────────
RECOMMENDATIONS
───────────────────────────────────────────────────────────
  [What should the organization do to improve defenses?]

═══════════════════════════════════════════════════════════
```

---

## 20. Top 10 High-Value Hunts Every SOC Should Run Regularly

| # | Hunt | MITRE Technique | Frequency | Difficulty |
|---|------|----------------|-----------|------------|
| 1 | **Encoded PowerShell execution** | T1059.001 | Weekly | Medium |
| 2 | **LSASS access by non-system processes** | T1003.001 | Weekly | Medium |
| 3 | **Beaconing detection (interval analysis)** | T1071 | Weekly | Hard |
| 4 | **New scheduled tasks on DCs/servers** | T1053.005 | Daily | Easy |
| 5 | **Admin share (C$/ADMIN$) access from workstations** | T1021.002 | Weekly | Easy |
| 6 | **Event log clearing on critical servers** | T1070.001 | Daily | Easy |
| 7 | **Kerberoasting (mass TGS requests)** | T1558.003 | Weekly | Medium |
| 8 | **Office apps spawning command shells** | T1204.002 | Daily | Easy |
| 9 | **DNS query anomalies (high entropy, long labels)** | T1071.004 | Weekly | Hard |
| 10 | **Large outbound data transfers after-hours** | T1041/T1567 | Daily | Medium |

---

*End of Threat Hunting SOC Guide (Parts 1-4). This guide covers all 14 MITRE ATT&CK Enterprise tactics with real-world True Positive scenarios, step-by-step investigation procedures, detection checklists, and SOC analyst playbooks.*
