# Cisco SOC Security Investigator – Interview Q&A
## Part 3: Network Security, Endpoint Protection & Security Tools

---

## Section F: Network Security & Protocols

---

### Q26. Explain the TCP three-way handshake and how attackers abuse it.

**Answer:**

**Normal TCP three-way handshake**:
1. **SYN**: Client sends SYN packet to server (request to connect).
2. **SYN-ACK**: Server responds with SYN-ACK (acknowledges and agrees).
3. **ACK**: Client sends ACK (connection established).

**Attack techniques abusing TCP**:

| Attack | Method | Detection |
|--------|--------|-----------|
| **SYN Flood (DoS)** | Attacker sends massive SYN packets but never completes the handshake. Server allocates resources for half-open connections and becomes overwhelmed. | Monitor for high volume of SYN packets without corresponding ACKs. IDS/IPS rate limiting. |
| **SYN Scan (Reconnaissance)** | Attacker sends SYN, receives SYN-ACK (port open) or RST (port closed), but never sends final ACK. This is a "stealth scan" because the connection is never completed. | Detect incomplete handshakes in firewall logs or IDS (e.g., Nmap SYN scan signatures). |
| **TCP Reset Attack** | Attacker sends spoofed RST packets to tear down legitimate connections. | Anomalous RST packets from unexpected sources. |
| **Session Hijacking** | Attacker predicts TCP sequence numbers to inject packets into an established session. | Monitor for out-of-sequence packets, use encrypted protocols (TLS). |

---

### Q27. What is the difference between IDS, IPS, and NDR?

**Answer:**

| Feature | IDS (Intrusion Detection System) | IPS (Intrusion Prevention System) | NDR (Network Detection & Response) |
|---------|-----|-----|-----|
| **Mode** | Passive (monitors copy of traffic) | Inline (sits in traffic path) | Passive + active response |
| **Action** | Alerts only | Blocks/drops malicious traffic | Alerts + automated response (isolation, blocking) |
| **Detection** | Signature-based + some anomaly | Signature-based + some anomaly | Behavioral analytics, ML, traffic analysis |
| **Strengths** | No latency impact, good for visibility | Active prevention, stops attacks in real-time | Detects unknown threats, lateral movement, encrypted traffic anomalies |
| **Cisco Example** | Cisco Firepower (IDS mode) | Cisco Firepower (IPS mode) | Cisco Secure Network Analytics (Stealthwatch) |

**In a modern SOC**, all three work together: IDS/IPS handles known threats with signatures, while NDR catches the unknown/sophisticated threats through behavioral analysis.

---

### Q28. Explain common network-based attacks and how you'd detect them.

**Answer:**

| Attack | Description | Detection Method |
|--------|-------------|-----------------|
| **ARP Spoofing** | Attacker sends fake ARP replies to associate their MAC with a legitimate IP, enabling MITM | Dynamic ARP Inspection (DAI), monitoring ARP tables for duplicate IPs with different MACs |
| **DNS Spoofing/Poisoning** | Attacker injects false DNS responses to redirect traffic to malicious IPs | DNSSEC validation, monitoring for DNS response mismatches, unusual TTL values |
| **Man-in-the-Middle (MITM)** | Attacker intercepts communication between two parties | Certificate validation, HSTS, monitoring for unexpected certificate changes |
| **VLAN Hopping** | Attacker uses 802.1Q double-tagging to access traffic on a different VLAN | Disable DTP on access ports, set native VLAN to unused VLAN, never use VLAN 1 |
| **BGP Hijacking** | Attacker announces more specific IP prefixes to redirect internet traffic | RPKI validation, route monitoring services, BGP alerting tools |
| **SSL Stripping** | Attacker downgrades HTTPS to HTTP to intercept traffic | HSTS preloading, monitoring for unencrypted traffic where encrypted is expected |

---

### Q29. A firewall log shows a connection from an internal host to an external IP on port 4444. What do you investigate?

**Answer:**

Port 4444 is the **default port for Metasploit's Meterpreter reverse shell**. This is a high-priority alert.

**Investigation steps**:

1. **Immediate containment consideration**: If there's active outbound traffic on port 4444, consider isolating the host via EDR while investigating.

2. **Identify the internal host**: Look up the source IP — hostname, logged-in user, asset criticality, department.

3. **Check the external IP**:
   - VirusTotal, AbuseIPDB, GreyNoise — known malicious?
   - Shodan — what services is it running? (If it's running Metasploit, that's confirmation.)
   - Geo-IP — location consistent with expected traffic?

4. **Analyze traffic pattern**:
   - Duration of connection — ongoing or brief?
   - Volume of data transferred — large outbound = possible exfiltration.
   - Is it recurring (beaconing)?

5. **Check EDR on the source host**:
   - What process initiated the connection? (`svchost.exe`? `powershell.exe`? An unknown binary?)
   - Process tree — how was that process launched?
   - Any file drops, registry modifications, or scheduled tasks created?

6. **Correlate across environment**:
   - Are any other hosts connecting to the same IP?
   - Did the same user/host show earlier indicators (phishing email, suspicious download)?

7. **Determine if this is a penetration test**: Check with the client — is there an authorized engagement? If yes → Benign True Positive.

8. **If confirmed malicious**: Full incident response — isolate, investigate scope, eradicate, and recover.

---

### Q30. What is the difference between east-west and north-south traffic? Why does it matter for security?

**Answer:**

| Direction | Description | Example |
|-----------|-------------|---------|
| **North-South** | Traffic crossing the network perimeter — between internal network and internet/external networks | User accessing a website, email received from external sender |
| **East-West** | Traffic moving laterally within the network — between internal hosts/segments | Server-to-server communication, workstation accessing a file share, database replication |

**Security implications**:
- Traditional security focuses on **north-south** (firewalls, proxies, IDS/IPS at the perimeter).
- Modern attacks (post-initial-compromise) focus on **east-west** lateral movement.
- Once an attacker breaches the perimeter, they move laterally — and if you only monitor N-S traffic, you're blind.

**Detection strategy for east-west**:
- **Network segmentation**: Micro-segmentation limits blast radius.
- **Internal firewalls**: Monitor and control inter-segment traffic.
- **NDR / Network Analytics**: Tools like Cisco Secure Network Analytics baseline internal traffic patterns and detect anomalies.
- **EDR**: Monitors host-level network connections.
- **Zero Trust**: Verify every connection regardless of network location.

---

## Section G: Endpoint Protection & EDR

---

### Q31. How does EDR (Endpoint Detection & Response) work and why is it critical for SOC investigations?

**Answer:**

**EDR** deploys agents on endpoints that continuously record system activity and provide detection, investigation, and response capabilities.

**What EDR records**:
- Process creation and termination (with full command lines)
- File creation, modification, and deletion
- Registry changes
- Network connections (per-process)
- DLL loading
- User logins
- Script execution (PowerShell, WScript, CScript)

**How it helps SOC investigations**:

1. **Root cause analysis**: Trace the full process tree — from initial execution to lateral movement. Example: `outlook.exe` → `winword.exe` → `powershell.exe` → `mimikatz.exe`.

2. **Scope determination**: Query across all endpoints — "Show me every host where this file hash exists" or "Which hosts connected to this C2 domain?"

3. **Remote response**: Isolate a compromised host from the network while maintaining EDR agent connectivity for continued investigation.

4. **Behavioral detection**: EDR detects malicious behavior patterns (credential dumping, process injection, persistence mechanisms) even if the malware is custom/unknown.

5. **Forensic timeline**: EDR provides days/weeks of historical telemetry without needing to deploy forensic tools.

**Cisco's EDR offering**: **Cisco Secure Endpoint (formerly AMP for Endpoints)** — provides file reputation, behavioral analysis, device trajectory (timeline view), and retrospective security (re-evaluates files previously classified as unknown when new threat intel emerges).

---

### Q32. What is the difference between antivirus (AV) and EDR?

**Answer:**

| Feature | Traditional AV | EDR |
|---------|---------------|-----|
| **Detection method** | Primarily signature-based (known malware hashes and patterns) | Behavioral + signature + ML/AI |
| **Visibility** | File-level (scan files on disk) | Full endpoint telemetry (processes, network, registry, memory) |
| **Response capability** | Quarantine/delete file | Isolate host, kill process, collect forensic data, remote shell |
| **Investigation** | Minimal — "Malware X was found and quarantined" | Full timeline — who did what, when, and how |
| **Zero-day/fileless** | Poor — no signature = no detection | Strong — detects abnormal behaviors regardless of signatures |
| **Threat hunting** | Not possible | Query historical data across all endpoints |

**Bottom line**: AV is like a door lock — it keeps out known bad actors. EDR is like a security camera system with armed response — it sees everything, records it, and can take action on unknown threats.

---

### Q33. Explain Cisco Secure Endpoint (AMP) features relevant to SOC investigations.

**Answer:**

1. **Device Trajectory**: Visual timeline of all activity on an endpoint — process executions, file operations, network connections. Essential for understanding the full attack chain.

2. **File Trajectory**: Track a specific file (by hash) across the entire environment — which hosts have it, when did it first appear, how did it spread? Critical for scoping an outbreak.

3. **Retrospective Security**: If a file was initially classified as "unknown" or "clean" and is later determined malicious, AMP retroactively alerts on every endpoint that encountered it. Unique to Cisco — eliminates the "time of detection" gap.

4. **Orbital Advanced Search**: Run complex, live queries across all endpoints using osquery — check for specific IOCs, configurations, or artifacts without requiring RDP/SSH access.

5. **Endpoint Isolation**: Network-quarantine a compromised host while keeping the AMP agent connected for remote investigation and remediation.

6. **Threat Grid Integration**: Automatically or manually submit suspicious files to Cisco Threat Grid for sandbox detonation and behavioral analysis.

7. **Behavioral Indicators of Compromise (BIOCs)**: Custom or Talos-provided rules that detect specific behavioral patterns rather than static signatures.

---

## Section H: SIEM & Security Tools

---

### Q34. What is the role of a SIEM in SOC operations?

**Answer:**

**SIEM (Security Information and Event Management)** is the central nervous system of a SOC. It:

1. **Collects**: Ingests logs from all security and IT infrastructure — firewalls, endpoints, servers, cloud, identity, applications.
2. **Normalizes**: Standardizes log formats from different vendors into a common schema.
3. **Correlates**: Links related events across sources using correlation rules — "failed login on VPN + successful login on VPN + unusual geo-IP = potential credential compromise."
4. **Alerts**: Generates prioritized alerts when correlation rules or detection logic matches.
5. **Stores**: Retains log data for compliance, forensics, and historical analysis.
6. **Visualizes**: Provides dashboards, reports, and search capabilities for investigation.

**SIEM platforms I have experience with** (tailor to your actual experience):
- **Splunk**: SPL (Search Processing Language) for queries, premium analytics
- **IBM QRadar**: Offense-based workflow, Ariel Query Language
- **Microsoft Sentinel**: Cloud-native, KQL (Kusto Query Language), integrated with Azure/M365
- **Elastic SIEM**: Open-source foundation, EQL and Lucene queries

---

### Q35. Write a SIEM query to detect potential brute-force attacks.

**Answer:**

**Splunk SPL**:
```spl
index=windows sourcetype=WinEventLog:Security EventCode=4625
| stats count AS failed_attempts, values(TargetUserName) AS targeted_accounts,
        dc(TargetUserName) AS unique_accounts BY src_ip
| where failed_attempts > 50 AND unique_accounts > 5
| sort -failed_attempts
| lookup threat_intel_ip src_ip OUTPUT threat_category, threat_score
```

**What this does**:
1. Searches Windows Security logs for Event 4625 (failed logon).
2. Groups by source IP and counts failures and unique targeted accounts.
3. Filters for IPs with >50 failures targeting >5 unique accounts (password spraying pattern).
4. Sorts by volume.
5. Enriches with threat intel lookup.

**Variations for different attack patterns**:

- **Single-account brute force**: Remove the `unique_accounts > 5` filter, focus on high `failed_attempts` against one account.
- **Slow-and-low brute force**: Extend the time window (e.g., 24 hours) and lower the threshold.
- **Successful brute force**: Add a sub-search for Event 4624 from the same src_ip within minutes of the failures.

---

### Q36. What is SOAR and how does it complement SIEM?

**Answer:**

**SOAR (Security Orchestration, Automation, and Response)** automates repetitive SOC tasks and orchestrates workflows across security tools.

| SIEM | SOAR |
|------|------|
| Detects and alerts | Responds and automates |
| "Something suspicious happened" | "Here's what we automatically did about it, and here's what the analyst needs to decide" |

**SOAR capabilities**:

1. **Playbook automation**: When a phishing alert fires:
   - Auto-extract sender, URLs, attachments
   - Check URLs against threat intel
   - Detonate attachment in sandbox
   - If malicious: block sender, quarantine email from all mailboxes, isolate affected endpoint
   - Create ticket with enrichment data for analyst review

2. **Orchestration**: Connect disparate tools via APIs — SIEM triggers SOAR, SOAR queries EDR, enriches with TI, updates firewall rules, creates ServiceNow ticket — all without analyst intervention.

3. **Case management**: Centralized investigation workspace with evidence collection, collaboration, and audit trail.

4. **Metrics**: Track MTTD (Mean Time to Detect), MTTR (Mean Time to Respond), analyst workload, and playbook effectiveness.

**Cisco's SOAR**: **Cisco SecureX** (now part of the Cisco XDR platform) — provides integrated workflow orchestration across all Cisco security products plus third-party integrations.

---

### Q37. What is XDR and how does it differ from SIEM and EDR?

**Answer:**

| Aspect | SIEM | EDR | XDR |
|--------|------|-----|-----|
| **Scope** | All log sources (broad but shallow) | Endpoint-only (narrow but deep) | Cross-domain: endpoint + network + cloud + email + identity (broad AND deep) |
| **Detection** | Rule/correlation-based | Endpoint behavioral analytics | Unified analytics across all telemetry |
| **Correlation** | Manual correlation rules | Endpoint-level correlation | Automatic cross-domain correlation |
| **Response** | Alert + ticketing | Endpoint isolation, process kill | Coordinated cross-domain response |
| **Cisco Example** | N/A (partner with Splunk) | Cisco Secure Endpoint | Cisco XDR |

**XDR value**: An XDR platform correlates a phishing email (email telemetry) + malicious attachment download (endpoint telemetry) + C2 beaconing (network telemetry) + suspicious Azure AD login (identity telemetry) into a **single unified incident** rather than four separate alerts across four different tools. This reduces investigation time dramatically.

---

## Section I: Scripting & Automation

---

### Q38. How do you use Python/scripting in your SOC work?

**Answer:**

**Common use cases**:

1. **IOC enrichment**: Script that takes a list of IPs/domains/hashes from an investigation and auto-queries VirusTotal, AbuseIPDB, Shodan APIs — outputs a formatted report.

```python
import requests

def check_virustotal(ioc, api_key):
    url = f"https://www.virustotal.com/api/v3/ip_addresses/{ioc}"
    headers = {"x-apikey": api_key}
    response = requests.get(url, headers=headers)
    data = response.json()
    malicious = data['data']['attributes']['last_analysis_stats']['malicious']
    return f"IP: {ioc} | Malicious detections: {malicious}"
```

2. **Log parsing**: Parse large CSV/JSON log exports to extract specific patterns — e.g., "Extract all unique destination IPs from this firewall log where port = 4444."

3. **Alert deduplication**: Script that groups similar alerts by source IP, destination, and technique to reduce noise.

4. **Automation candidates** I've identified:
   - Auto-disable user accounts after confirmed phishing compromise.
   - Auto-block IOCs in firewall via API after analyst confirmation.
   - Auto-generate investigation reports from SIEM query results.
   - Auto-check hash reputation before escalating AV alerts.

5. **SIEM integration**: Use Python SDK for Splunk or QRadar to programmatically run queries, pull results, and feed into downstream tools.

---

### Q39. Describe a process you automated or identified as an automation candidate.

**Answer:**

**Problem**: Every phishing investigation required manually extracting URLs and attachments from reported emails, checking them against 3-4 threat intel sources, and documenting results — taking 15-20 minutes per report.

**Solution I proposed/built**:

1. **Email parsing module** (Python + `email` library): Automatically extracts sender, subject, URLs, attachment names, and attachment hashes from reported phishing emails in a shared mailbox.

2. **TI enrichment** (API calls): For each extracted IOC:
   - URLs → URLhaus, VirusTotal URL scan, PhishTank
   - Attachment hash → VirusTotal, MalwareBazaar
   - Sender IP (from headers) → AbuseIPDB, GreyNoise

3. **Scoring logic**: If any IOC hits ≥ 2 TI sources as malicious → auto-classify as confirmed phishing. If 1 hit → flag for manual review. If 0 → likely benign.

4. **Output**: Auto-generates a pre-filled investigation ticket with all enrichment data, classification recommendation, and remediation steps.

**Impact**: Reduced average phishing triage time from 15 minutes to 3 minutes. Analyst only needs to review the pre-filled ticket and approve recommendations rather than doing manual lookups.

---

*End of Part 3 — Continue to Part 4 for Scenario-Based Questions and Behavioral Questions.*
