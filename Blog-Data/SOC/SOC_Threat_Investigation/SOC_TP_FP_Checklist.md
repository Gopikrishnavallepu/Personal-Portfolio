# 🔍 SOC Detection Checklist — TP or FP?

> **Purpose**: A step-by-step checklist to determine if a detection/alert is a **True Positive (TP)** or **False Positive (FP)**.  
> **How to use**: When an alert fires → go to the matching section → follow the checklist → make your decision.

---

## Quick Recall: What Are We Deciding?

```
┌─────────────────────────────────────────────────────────┐
│                  IS THERE A REAL THREAT?                 │
│                                                         │
│              YES (Real Attack)    NO (No Attack)         │
│   ┌─────────┼────────────────────┼──────────┐           │
│   │ ALERT   │  ✅ True Positive  │ ⚠️ False  │           │
│   │ FIRED   │     (Correct!)     │  Positive │           │
│   ├─────────┼────────────────────┼──────────┤           │
│   │ NO      │  💀 False Negative │ ✅ True   │           │
│   │ ALERT   │    (DANGEROUS!)    │ Negative  │           │
│   └─────────┴────────────────────┴──────────┘           │
└─────────────────────────────────────────────────────────┘
```

> **Your job as a SOC analyst**: Every alert starts as "Unknown" — your investigation turns it into TP or FP.

---

## 🧭 Universal First-Response Checklist (Do This EVERY Time)

Before diving into specific detection types, run through these **5 universal checks**:

- [ ] **1. READ the alert details** — Source, severity, timestamp, affected asset, triggered rule name
- [ ] **2. CHECK the user/source** — Is this a known user? Known system? Service account?
- [ ] **3. CHECK the timing** — Did this happen during business hours or off-hours?
- [ ] **4. CHECK history** — Has this alert fired before for this user/system? Was it TP or FP last time?
- [ ] **5. CHECK threat intel** — Are any IPs, domains, or hashes flagged in VirusTotal, AbuseIPDB, or your TI feeds?

> Once done, move to the **specific checklist** below based on your alert type.

---

## 1. 🔐 Brute Force Detection

**Alert Trigger**: Multiple failed login attempts (Event ID **4625**) in a short period

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Source IP** | Check the IP in SIEM — is it internal or external? | External / unknown IP | Internal / known VPN IP |
| 2 | **Number of failures** | Count failed attempts in time window | 10+ failures in < 5 min | 2-3 failures (user typo) |
| 3 | **Target accounts** | One account or many? | Multiple accounts targeted | Single account (user forgot password) |
| 4 | **Success after failures?** | Check for Event ID **4624** after the 4625s | ✅ Yes → Compromised! (TP) | No success → attack failed |
| 5 | **Time of activity** | Business hours or off-hours? | 3 AM on a weekend | 9 AM on Monday |
| 6 | **Geo-location** | Where is the source IP from? | Foreign country, unusual location | User's normal location |
| 7 | **Contact the user** | Call/message the user directly | "I didn't try to log in" | "Yes, I forgot my password" |

### Decision Flow

```
Multiple 4625 events?
  ├── YES
  │   ├── From external/unknown IP?
  │   │   ├── YES → Followed by 4624 (success)?
  │   │   │   ├── YES → 🔴 TP — Account Compromised! → Disable account, block IP
  │   │   │   └── NO  → 🟡 TP (Attack attempted, not successful) → Block IP, monitor
  │   │   └── NO (internal IP)
  │   │       ├── User confirms activity? → 🟢 FP — Password issue
  │   │       └── User denies activity?   → 🔴 TP — Internal threat
  └── NO → 🟢 FP — Normal failed login
```

### Logs to Check
- [ ] Windows Security Logs (Event ID 4625, 4624, 4740)
- [ ] Active Directory logs
- [ ] VPN / Remote Access logs
- [ ] SIEM correlation rules

---

## 2. 📧 Phishing Email Detection

**Alert Trigger**: Suspicious email reported by user or caught by email security gateway

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Sender address** | Inspect the "From" field carefully | Misspelled domain (e.g., `@paypa1.com`) | Exact match to legitimate domain |
| 2 | **SPF check** | View email headers → look for SPF result | `SPF: FAIL` | `SPF: PASS` |
| 3 | **DKIM check** | View email headers → look for DKIM result | `DKIM: FAIL` | `DKIM: PASS` |
| 4 | **DMARC check** | View email headers → look for DMARC result | `DMARC: FAIL` | `DMARC: PASS` |
| 5 | **Reply-to address** | Compare reply-to with sender | Different from sender address | Same as sender or not present |
| 6 | **URLs in body** | Hover over / extract all URLs | URL domain ≠ display text, uses URL shortener | Legitimate known URL |
| 7 | **URL reputation** | Check URLs in VirusTotal / URLhaus | Flagged as malicious | Clean reputation |
| 8 | **Attachments** | Check file type and hash | `.exe`, `.js`, `.scr`, `.bat`, macro-enabled `.docm` | `.pdf`, `.png` from known sender |
| 9 | **Attachment hash** | Get MD5/SHA256 → check VirusTotal | Hash flagged by multiple AV engines | Clean / 0 detections |
| 10 | **Email content** | Read the body text | Urgency, threats, "click now", grammar errors | Normal business communication |
| 11 | **Who else received?** | Search SIEM for same subject/sender | Sent to many users (campaign) | Only this recipient |
| 12 | **Did user click?** | Check proxy/web logs for URL visit | User visited the malicious URL | No click recorded |

### Decision Flow

```
Suspicious email alert?
  ├── Check SPF/DKIM/DMARC
  │   ├── ALL PASS + Legitimate domain → 🟢 Likely FP
  │   └── ANY FAIL or spoofed domain
  │       ├── Contains malicious URL/attachment?
  │       │   ├── YES
  │       │   │   ├── User clicked/opened?
  │       │   │   │   ├── YES → 🔴 TP — URGENT! → Isolate endpoint, reset creds
  │       │   │   │   └── NO  → 🔴 TP — Blocked → Block sender, purge from mailboxes
  │       │   └── NO → 🟡 Suspicious but not directly malicious → Monitor, block sender
  └── Legitimate email miscategorized → 🟢 FP → Whitelist sender
```

### Artifacts to Collect
- [ ] Sender email address
- [ ] Sender IP address
- [ ] Email subject line
- [ ] Recipient email addresses (all)
- [ ] Reply-to email address
- [ ] Date/time
- [ ] All URLs (expanded if shortened)
- [ ] Attachment names
- [ ] Attachment hash (MD5 / SHA256)
- [ ] Email headers (full)

### Logs to Check
- [ ] Email Server / Gateway logs
- [ ] Proxy / Web filter logs (did user click?)
- [ ] Endpoint / EDR logs (did attachment execute?)
- [ ] DNS logs (did endpoint resolve the malicious domain?)
- [ ] Firewall logs (outbound connection to malicious IP?)

---

## 3. 💀 Ransomware Detection

**Alert Trigger**: AV/EDR alert for ransomware, files encrypted, ransom note displayed

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **AV/EDR alert** | Review the alert details and signature name | Known ransomware family detected | Generic / heuristic low-confidence alert |
| 2 | **File activity** | Check for mass file renames/encryption | Many files with new extensions (`.encrypted`, `.locked`) | Normal file operations |
| 3 | **Ransom note** | Look for ransom note files on disk | `README.txt`, `HOW_TO_DECRYPT.html` found | No ransom artifacts |
| 4 | **Process activity** | Check EDR for suspicious processes | Unknown process encrypting files rapidly | Known backup / encryption tool |
| 5 | **Network connections** | Check for C2 communication | Outbound connections to suspicious IPs | No unusual connections |
| 6 | **User confirmation** | Contact the endpoint user | "My files are locked, I see a ransom message" | "I was running a legitimate encryption tool" |
| 7 | **Lateral spread** | Check other endpoints for similar activity | Same behavior on multiple machines | Isolated to one machine |

### Decision Flow

```
AV/EDR ransomware alert?
  ├── Files actually encrypted + ransom note present?
  │   ├── YES → 🔴 TP — CRITICAL!
  │   │         → Isolate machine immediately
  │   │         → Check for lateral spread
  │   │         → Activate IR playbook
  │   └── NO
  │       ├── Process known/legitimate? (e.g., BitLocker, backup tool)
  │       │   ├── YES → 🟢 FP — Legitimate encryption activity
  │       │   └── NO  → 🟡 Suspicious — Investigate further, sandbox the file
  └── Heuristic-only detection, no file changes → 🟢 Likely FP → Tune the rule
```

### Logs to Check
- [ ] AV / Anti-malware logs
- [ ] EDR logs (process tree, file activity)
- [ ] Windows Event logs (Event ID 4688 — new process)
- [ ] Firewall logs (outbound C2 traffic)
- [ ] Network flow logs (unusual traffic volume)

---

## 4. 📤 Data Exfiltration Detection

**Alert Trigger**: Large outbound data transfer, connection to cloud storage, unusual upload activity

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Data volume** | Check bytes transferred in proxy/firewall logs | Unusually large upload (GBs) | Normal-sized transfers |
| 2 | **Destination** | Where is data going? | Dropbox, Google Drive, personal email, Mega, unknown IPs | Approved business cloud storage |
| 3 | **User context** | Who is the user? What do they normally do? | User doesn't normally transfer large data | Data analyst doing routine export |
| 4 | **Time** | When did it happen? | Off-hours, weekend | During business hours |
| 5 | **Data type** | What data is being transferred? | Sensitive files, database exports, source code | Marketing materials, public docs |
| 6 | **Authorization** | Was this transfer approved? | No ticket / approval | Change request / approved transfer |
| 7 | **User leaving?** | Check HR — is user on notice period? | Yes, resignation submitted | No, long-term employee |
| 8 | **Endpoint check** | Any malware or suspicious tools? | Unknown upload tools, encrypted archives being created | Standard business tools |

### Decision Flow

```
Large outbound data transfer detected?
  ├── To unauthorized destination (personal cloud, unknown IP)?
  │   ├── YES
  │   │   ├── User on notice period / HR flagged?
  │   │   │   ├── YES → 🔴 TP — Insider Threat → Contact manager, forensics
  │   │   │   └── NO  → Is endpoint compromised (malware)?
  │   │   │       ├── YES → 🔴 TP — External attacker exfiltrating
  │   │   │       └── NO  → 🟡 Investigate — may be policy violation
  │   └── NO (to approved destination)
  │       ├── Volume matches normal pattern? → 🟢 FP
  │       └── Volume abnormally high?        → 🟡 Investigate further
```

### Logs to Check
- [ ] Proxy logs (URL, destination, bytes transferred)
- [ ] DLP (Data Loss Prevention) alerts
- [ ] Firewall logs (outbound connections)
- [ ] Endpoint / EDR logs
- [ ] Cloud access logs (CASB)

---

## 5. 🕸️ Lateral Movement Detection

**Alert Trigger**: Internal scanning, unusual admin tool usage (PsExec, WMI), RDP to unexpected hosts

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Source system** | Is this machine already flagged/compromised? | Yes, previous alert on this host | No prior alerts |
| 2 | **Tool used** | What tool triggered the alert? | PsExec, Mimikatz, WMI, PowerShell remoting | SCCM, Intune, legit admin tool |
| 3 | **User account** | Who initiated the connection? | Compromised account, or unusual account | IT admin performing routine maintenance |
| 4 | **Destination** | Which systems are being accessed? | Servers the user never accesses | Normal systems for this user's role |
| 5 | **Number of targets** | How many systems? | Multiple systems in rapid succession | Single system |
| 6 | **Time** | Business hours? | Off-hours | During maintenance window |
| 7 | **Credential use** | Any pass-the-hash / pass-the-ticket signs? | Event ID 4648, NTLM auth where Kerberos expected | Normal Kerberos authentication |
| 8 | **IT team confirmation** | Is IT doing maintenance/patching? | "No, we have no activity planned" | "Yes, we're patching servers" |

### Decision Flow

```
Lateral movement alert (PsExec, WMI, internal scan)?
  ├── Initiated by IT admin during maintenance?        → 🟢 FP
  ├── Tool = Mimikatz or credential dumping?           → 🔴 TP — Immediate containment!
  ├── User accessing systems they never access?
  │   ├── YES + Off-hours + Multiple targets           → 🔴 TP — Active compromise
  │   └── Single target + business hours               → 🟡 Verify with user/IT
  └── Automated scan from security tool (Nessus, Qualys)? → 🟢 FP
```

### Key Event IDs to Check
- [ ] **4648** — Logon with explicit credentials (Pass-the-Hash indicator)
- [ ] **4624** — Successful logon (Type 3 = network, Type 10 = RDP)
- [ ] **4688** — New process created (look for PsExec, cmd.exe, powershell.exe)
- [ ] **4698** — Scheduled task created (persistence after lateral move)

### Logs to Check
- [ ] Windows Security logs on source AND destination
- [ ] EDR logs (process tree, network connections)
- [ ] Network flow logs (internal traffic patterns)
- [ ] Firewall logs (internal segment traffic)

---

## 6. ⬆️ Privilege Escalation Detection

**Alert Trigger**: Unexpected admin privilege assignment, new admin account, sudo abuse

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Event ID 4672** | Special privileges assigned — to whom? | Unexpected user gets admin rights | Known admin logging in |
| 2 | **Event ID 4720** | New account created — by whom? | Created by non-admin, or unfamiliar account | Created by IT via ticketing system |
| 3 | **Event ID 4732** | Added to admin group — authorized? | No change request/ticket | Matches approved change request |
| 4 | **Process context** | How was the privilege obtained? | Exploit, buffer overflow, unknown binary | sudo with valid justification |
| 5 | **Timing** | When did it happen? | Off-hours, no maintenance window | During approved change window |
| 6 | **Change management** | Is there a matching change ticket? | No ticket exists | Ticket # matches the activity |

### Decision Flow

```
Privilege escalation alert?
  ├── Matches an approved change request / IT ticket?     → 🟢 FP
  ├── New admin account created by unknown user?          → 🔴 TP — Backdoor account!
  ├── 4672 for a non-admin user?
  │   ├── Known exploit / suspicious process?              → 🔴 TP — Active exploitation
  │   └── Application service account?                     → 🟢 FP — Expected behavior
  └── User added to Domain Admins unexpectedly?            → 🔴 TP — Immediate investigation
```

### Logs to Check
- [ ] Windows Security logs (4672, 4720, 4732, 4728)
- [ ] Active Directory audit logs
- [ ] EDR logs (exploit detection, process lineage)
- [ ] Change management / ticketing system

---

## 7. 🪝 Persistence Detection

**Alert Trigger**: New registry autostart entry, new scheduled task, startup folder modification

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **What was created?** | Registry key? Scheduled task? Service? | Points to unknown executable | Points to known software (Chrome updater, etc.) |
| 2 | **Who created it?** | Which user/process? | Unknown user, compromised account | SYSTEM or known installer |
| 3 | **Executable path** | Where does the autostart point to? | `C:\Temp\`, `C:\Users\Public\`, random name | `C:\Program Files\` standard path |
| 4 | **File hash** | Hash the executable → check VirusTotal | Flagged as malicious | Clean / known good |
| 5 | **Signed?** | Is the binary digitally signed? | Unsigned or invalid signature | Valid signature from known vendor |
| 6 | **Event ID 4698** | Scheduled task created | Unknown task, suspicious name | Matches known software or IT deployment |
| 7 | **Recent software install?** | Was software installed recently? | No installation recorded | Yes, legitimate software installed today |

### Decision Flow

```
New persistence mechanism detected?
  ├── Created by known software installer?                       → 🟢 FP
  ├── Executable is unsigned + in temp/unusual directory?
  │   ├── Hash flagged on VirusTotal?                             → 🔴 TP — Malware!
  │   └── Hash clean but suspicious path?                         → 🟡 Investigate — sandbox it
  ├── Scheduled task pointing to PowerShell + encoded command?    → 🔴 TP
  └── New service created by SYSTEM during patch cycle?           → 🟢 FP
```

### Logs to Check
- [ ] Windows Security logs (4698, 4697 — service installed)
- [ ] Sysmon logs (Event 1 — process creation, Event 13 — registry modification)
- [ ] EDR logs (autostart enumeration)
- [ ] File system audit logs

---

## 8. 📡 C2 (Command & Control) Communication Detection

**Alert Trigger**: Beaconing traffic to suspicious domain/IP, DNS tunneling, encoded traffic

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Destination IP/Domain** | Check reputation on VirusTotal, AbuseIPDB | Flagged as C2/malware | Known CDN, SaaS provider |
| 2 | **Traffic pattern** | Is it beaconing (regular intervals)? | Fixed interval (e.g., every 60 sec) | Irregular / random pattern |
| 3 | **Data volume** | Size of packets? | Small, consistent packets (heartbeat) | Large, varied (normal browsing) |
| 4 | **Protocol** | What protocol is used? | DNS over HTTPS, unusual port usage | Standard HTTPS on port 443 |
| 5 | **DNS queries** | Abnormal DNS query patterns? | Long subdomain names (DNS tunneling), high volume | Normal domain queries |
| 6 | **Process on endpoint** | What process is making the connection? | Unknown process, renamed system binary | Browser, Teams, Slack |
| 7 | **Domain age** | When was the domain registered? | < 30 days old | Years old, well-established |
| 8 | **GeoIP** | Where is the server located? | Suspicious country, known APT infra | Expected business location |

### Decision Flow

```
Suspicious outbound connection / beaconing alert?
  ├── Destination flagged as C2 on TI feeds?               → 🔴 TP — Isolate endpoint!
  ├── Regular beaconing interval from unknown process?
  │   ├── Process unsigned + connects to new domain?        → 🔴 TP
  │   └── Known app (Slack, Teams) with regular pings?      → 🟢 FP — Normal keepalive
  ├── DNS tunneling indicators (long subdomains)?            → 🔴 TP
  └── Connection to known CDN / cloud provider?              → 🟢 FP — Verify the specific URL
```

### Logs to Check
- [ ] Firewall logs (outbound connections, blocked connections)
- [ ] Proxy / Web gateway logs
- [ ] DNS logs (query names, volume, response sizes)
- [ ] EDR logs (process → network mapping)
- [ ] NetFlow data (traffic patterns)

---

## 9. 🤖 Botnet Detection

**Alert Trigger**: Connection to known botnet C2, abnormal outbound traffic volume, DDoS participation

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Destination IP** | Check against botnet C2 lists | Known botnet infrastructure | Legitimate service |
| 2 | **Traffic volume** | Outbound traffic spike? | Massive outbound (DDoS participation) | Normal traffic levels |
| 3 | **Processes** | New/unknown processes running? | Unknown process, connects to multiple IPs | Known application |
| 4 | **IRC/P2P traffic** | Unusual protocol usage? | IRC connections, P2P traffic from server | No unusual protocols |
| 5 | **Multiple endpoints** | Same behavior across machines? | Yes → Botnet spread confirmed | Isolated to one machine |
| 6 | **Server owner** | Contact system owner | "This server shouldn't have outbound traffic" | "We're running a load test" |

### Decision Flow

```
Botnet alert triggered?
  ├── IP matches known botnet C2 list?                      → 🔴 TP — Isolate immediately
  ├── Massive outbound traffic to many IPs?
  │   ├── Server owner confirms no activity planned?         → 🔴 TP — DDoS participation
  │   └── Load test / stress test running?                   → 🟢 FP
  └── Single connection to suspicious IP, low volume?        → 🟡 Investigate — early infection?
```

### Logs to Check
- [ ] Network flow logs (traffic volume, destinations)
- [ ] Firewall logs
- [ ] OS logs (new processes, new services)
- [ ] EDR logs

---

## 10. 🎯 APT (Advanced Persistent Threat) Detection

**Alert Trigger**: Combination of multiple low-severity alerts, off-hours access, new admin accounts, slow exfiltration

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Alert correlation** | Multiple related alerts across time? | Chain: phishing → persistence → lateral movement | Isolated, unrelated alerts |
| 2 | **Off-hours access** | Login times unusual? | Consistent off-hours access over days/weeks | One-time late login (overtime) |
| 3 | **New admin accounts** | 4720 events? | Accounts created without IT tickets | IT-provisioned accounts |
| 4 | **Slow exfiltration** | Small but consistent data transfers? | Regular small uploads to unknown destinations | Normal business uploads |
| 5 | **Dwell time** | How long has the activity been going on? | Weeks or months of low-noise activity | Single recent event |
| 6 | **MITRE ATT&CK mapping** | Activity maps to multiple ATT&CK tactics? | Covers 3+ tactics in the kill chain | Matches only 1 tactic |
| 7 | **Threat intel match** | IOCs match known APT groups? | Matches known APT campaign IOCs | No TI matches |

### Decision Flow

```
Suspected APT activity?
  ├── Multiple ATT&CK tactics observed over extended period? → 🔴 TP — Escalate to IR team!
  ├── IOCs match known APT group?                            → 🔴 TP — CRITICAL
  ├── Single suspicious event, no correlation?               → 🟡 Monitor, correlate further
  └── Matches known IT activity / maintenance?               → 🟢 FP
```

---

## 11. 🗃️ Data Breach Detection

**Alert Trigger**: Unauthorized access to sensitive data, unusual database queries, access policy violations

### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Who accessed?** | Check the user account | Unauthorized user, or compromised account | Authorized user with valid access |
| 2 | **What data?** | What was accessed/exported? | PII, financial data, credentials, source code | Public / non-sensitive data |
| 3 | **Volume** | How much data was accessed? | Large bulk export, full table dump | Normal query result set |
| 4 | **Access pattern** | Normal for this user? | First time accessing this database/table | Regular scheduled report |
| 5 | **Failed access attempts** | Event ID 4625, DB auth failures? | Multiple failures before success | No failures |
| 6 | **Permission changes** | Was access recently granted? | Permissions changed without ticket | Standard access review |

### Decision Flow

```
Unauthorized data access alert?
  ├── User authorized + normal access pattern?                 → 🟢 FP
  ├── User accessing data outside their role?
  │   ├── Large volume / bulk export?                           → 🔴 TP — Data breach!
  │   └── Small query, one-time?                                → 🟡 Investigate further
  ├── Compromised account indicators (impossible travel, etc.)? → 🔴 TP
  └── Automated scan / vulnerability assessment?                → 🟢 FP — Expected
```

### Logs to Check
- [ ] Database access / query logs
- [ ] Application access logs
- [ ] Windows Security logs (4663 — object access)
- [ ] DLP alerts
- [ ] Network logs (data transfer volume)

---

## 🧰 Master Decision Framework

> For **ANY** alert type, follow this **5-step framework** (mnemonic: **U-G-C-V-D**):

```
┌───────────────────────────────────────────────────────────┐
│              SOC ANALYST DECISION FLOW                    │
│                                                           │
│  Step 1: U — UNDERSTAND the alert                        │
│    → What rule fired? What is the expected behavior?      │
│                                                           │
│  Step 2: G — GATHER EVIDENCE                             │
│    → Collect logs from all relevant sources               │
│    → Check threat intel (VirusTotal, AbuseIPDB)           │
│                                                           │
│  Step 3: C — CORRELATE                                   │
│    → Link to other events (same user, same IP, etc.)      │
│    → Look for attack chain patterns                       │
│                                                           │
│  Step 4: V — VERIFY                                      │
│    → Contact the user / system owner                      │
│    → Check change management tickets                      │
│    → Check with IT team                                   │
│                                                           │
│  Step 5: D — DECIDE                                      │
│    → TP → Escalate, Contain, Follow IR playbook           │
│    → FP → Document, tune the rule, close the alert        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 🧠 Memory Trick
> **U-G-C-V-D** = "**U**nderstand, **G**ather, **C**orrelate, **V**erify, **D**ecide"
> Think: **"U Got Caught? Verify Dude!"**

---

## 📊 Evidence Strength Quick Reference

| Strength | What You Have | Example |
|----------|--------------|---------|
| 🔴 **Strong TP** | TI-confirmed IOC + endpoint activity + user denies | Malicious hash on endpoint + C2 traffic + user says "wasn't me" |
| 🟠 **Moderate TP** | Suspicious behavior + no business justification | Off-hours admin login + no change ticket |
| 🟡 **Needs More Info** | Single indicator, no correlation | One failed login from unknown IP |
| 🟢 **Likely FP** | Business justification exists | IT admin patching servers after hours |
| ✅ **Confirmed FP** | User/IT confirms + matches known pattern | Vulnerability scanner triggered IDS alert |

---

## 📋 Log Source Quick Reference by Alert Type

| Alert Type | Primary Logs | Secondary Logs |
|-----------|-------------|----------------|
| **Brute Force** | Windows Security (4625, 4624) | AD logs, VPN logs |
| **Phishing** | Email Gateway, Email Headers | Proxy, DNS, EDR |
| **Ransomware** | AV/EDR, Windows Security (4688) | Firewall, Network Flow |
| **Data Exfiltration** | Proxy, DLP | Firewall, Cloud Access (CASB) |
| **Lateral Movement** | Windows Security (4648, 4624) | EDR, Network Flow |
| **Privilege Escalation** | Windows Security (4672, 4720, 4732) | AD Audit, Change Mgmt |
| **Persistence** | Sysmon (Event 1, 13), Security (4698) | EDR, File Audit |
| **C2 / Beaconing** | Firewall, Proxy, DNS | EDR, NetFlow |
| **Botnet** | Network Flow, Firewall | OS Logs, EDR |
| **APT** | SIEM Correlation (all sources) | Threat Intel, MITRE ATT&CK |
| **Data Breach** | Database Logs, App Access Logs | DLP, Network, Security (4663) |

---

## ✅ Post-Decision Actions

### If TP (True Positive)
- [ ] Follow the SANS IR steps: **Contain → Eradicate → Recover → Lessons Learned**
- [ ] Document the incident timeline
- [ ] Collect all evidence and IOCs
- [ ] Escalate to the IR team if high severity
- [ ] Update threat intel feeds with new IOCs
- [ ] Notify management (if required)

### If FP (False Positive)
- [ ] Document **why** it's FP (for future reference)
- [ ] Tune the detection rule to reduce future FPs
- [ ] Add whitelist/exception if appropriate
- [ ] Close the alert with proper notes
- [ ] Track FP rate per rule (high FP rate = rule needs fixing)

---

> [!TIP]
> **Interview tip**: When explaining your TP/FP process, always structure your answer around the **U-G-C-V-D** framework. Interviewers love hearing a clear, repeatable methodology.

---
*Use this checklist alongside the [SOC Concepts Interview Guide](./SOC_Concepts_Interview_Guide.md) for complete interview preparation.*
