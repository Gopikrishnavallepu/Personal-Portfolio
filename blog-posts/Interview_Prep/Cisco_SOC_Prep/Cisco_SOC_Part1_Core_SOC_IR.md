# Cisco SOC Security Investigator – Interview Q&A
## Part 1: Core SOC Operations, Incident Response & Investigation Methodology

---

## Section A: SOC Operations Fundamentals

---

### Q1. Walk me through a typical day as a SOC Security Investigator. What does your workflow look like?

**Answer:**

A typical day starts with a **shift handover** — reviewing the open ticket queue, any escalated incidents from the previous shift, and threat intelligence bulletins that dropped overnight.

Then I move into **alert triage**:
- Pull the top-priority alerts from the SIEM queue (sorted by severity and SLA timers).
- For each alert, I perform initial enrichment — check source/destination IPs against threat intel feeds (VirusTotal, AbuseIPDB, OTX), review the detection logic that fired, and correlate with adjacent logs (firewall, proxy, EDR, DNS).
- Classify as **True Positive, Benign True Positive, or False Positive**.

For confirmed true positives, I **escalate into a full investigation**:
- Build a timeline of attacker activity.
- Identify affected assets and accounts.
- Determine scope (lateral movement? data exfiltration?).
- Document findings and provide remediation recommendations to the client.

Throughout the day I also handle **client service requests** (firewall rule changes, policy tuning requests, ad hoc log queries) and dedicate time to **proactive threat hunting** when the queue allows — looking for IOCs from recent threat reports, anomalous beaconing patterns, or living-off-the-land binaries.

I close out by updating case notes, documenting any new detection gaps found, and preparing the handover for the next shift.

---

### Q2. Explain the difference between an Event, an Alert, and an Incident.

**Answer:**

| Term | Definition | Example |
|------|-----------|---------|
| **Event** | Any observable occurrence in a system or network. Most events are benign. | A user logging in, a firewall allowing traffic on port 443. |
| **Alert** | An event (or correlated set of events) that matches a detection rule and warrants analyst review. | A SIEM correlation rule fires because 50 failed logins occurred in 60 seconds from a single IP. |
| **Incident** | A confirmed security event that poses a real threat and requires a structured response. | Investigation confirms the brute-force alert led to a successful credential compromise and unauthorized data access. |

**Key takeaway**: Not every event becomes an alert, and not every alert becomes an incident. The SOC's job is to efficiently funnel events → alerts → incidents while minimizing false positives.

---

### Q3. How do you prioritize alerts in a high-volume SOC environment?

**Answer:**

I use a combination of:

1. **Severity of the detection rule** — Critical/High alerts (ransomware execution, C2 beaconing, data exfil) always take precedence.
2. **Asset criticality** — An alert on a domain controller or a PCI-scoped database server is prioritized over a standard workstation.
3. **Threat intelligence context** — Alerts matching known active campaign IOCs get elevated.
4. **Customer SLA requirements** — Managed security clients often have contractual response times (e.g., P1 = 15 min acknowledgement).
5. **Kill chain stage** — An alert at the "Actions on Objectives" stage (exfiltration, destruction) is more urgent than one at "Reconnaissance."

I also look for **alert clustering** — if 5 different alerts fire on the same host within minutes, they likely represent a single attack chain and should be investigated together rather than individually.

---

### Q4. What is the NIST Incident Response Framework? Walk through each phase.

**Answer:**

The **NIST SP 800-61 Rev 2** framework defines four phases:

**1. Preparation**
- Establish IR policies, procedures, and playbooks.
- Deploy detection tools (SIEM, EDR, IDS/IPS, NDR).
- Build communication plans (escalation paths, client contacts, legal).
- Conduct tabletop exercises and red/blue team drills.

**2. Detection & Analysis**
- Monitor alerts from security tools.
- Triage and validate alerts — determine if it's a true incident.
- Perform initial scoping: what systems, accounts, and data are affected?
- Classify severity and assign priority.
- Document everything from the start.

**3. Containment, Eradication & Recovery**
- **Short-term containment**: Isolate the host (network quarantine via EDR), disable compromised accounts, block malicious IPs/domains.
- **Long-term containment**: Apply patches, harden configurations, implement additional monitoring.
- **Eradication**: Remove malware, close backdoors, eliminate persistence mechanisms.
- **Recovery**: Restore systems from clean backups, verify integrity, gradually reintroduce to production with heightened monitoring.

**4. Post-Incident Activity**
- Conduct lessons-learned review.
- Update detection rules and playbooks.
- Document root cause and timeline.
- Share IOCs with threat intel teams and community.

---

### Q5. Describe a complex security investigation you conducted. How did you approach it?

**Answer (Example Scenario):**

**Situation**: Multiple EDR alerts fired for `Mimikatz` execution and suspicious PowerShell activity on a finance department workstation.

**Approach**:

1. **Initial Triage (5 min)**: Confirmed the alert was not from a penetration test or authorized red team. Checked the asset inventory — this was a high-value finance endpoint.

2. **Containment (10 min)**: Used EDR to network-isolate the host while keeping the agent connected for remote investigation. Disabled the affected user's AD account.

3. **Deep Investigation**:
   - **EDR telemetry**: Traced the process tree — `outlook.exe` → `winword.exe` → `cmd.exe` → `powershell.exe` (encoded command) → `mimikatz.exe`. This confirmed a phishing-delivered macro payload.
   - **Email gateway logs**: Found the initial phishing email with a .docm attachment from a spoofed vendor domain.
   - **SIEM correlation**: Searched for the same sender/attachment hash across all mailboxes — 12 other users received it, 3 opened the attachment.
   - **Network logs**: The PowerShell script reached out to a C2 domain. Checked proxy logs for other hosts beaconing to the same domain — found 1 additional compromised system.
   - **AD logs**: Mimikatz was used for credential dumping. Reviewed 4624/4625/4672 events — attacker performed lateral movement to a file server using stolen creds.

4. **Scoping**: 2 endpoints compromised, 1 service account credential stolen, potential access to financial share (reviewed SMB access logs — no evidence of exfiltration).

5. **Remediation Recommendations to Client**:
   - Reset passwords for affected accounts + all accounts on compromised hosts.
   - Reimage both endpoints.
   - Block C2 domain/IP at firewall and proxy.
   - Purge phishing email from all mailboxes.
   - Implement DMARC/DKIM for the spoofed vendor domain.
   - Disable Office macros via Group Policy for non-exception users.

6. **Documentation**: Full timeline, IOCs, MITRE ATT&CK mapping (T1566.001, T1059.001, T1003.001, T1021.002), and lessons learned.

---

### Q6. How do you differentiate between a True Positive, False Positive, and Benign True Positive?

**Answer:**

| Classification | Description | Example |
|---------------|-------------|---------|
| **True Positive (TP)** | Alert correctly detected malicious activity. | EDR alert for Cobalt Strike beacon — investigation confirms C2 communication. |
| **False Positive (FP)** | Alert fired but no malicious activity occurred; the detection logic misfired. | Antivirus flags a legitimate sysadmin tool (PsExec) used for authorized maintenance. |
| **Benign True Positive (BTP)** | Alert correctly detected the activity it was designed to, but the activity is authorized/expected. | Penetration testing team triggers brute-force alerts during a scheduled engagement. |

**Why it matters for Cisco MSS**: Accurate classification directly impacts the client experience. Escalating FPs wastes client time and erodes trust. Missing TPs exposes clients to real threats. Proper BTP handling avoids unnecessary incident response while maintaining detection coverage.

---

### Q7. What is the difference between NIST and ISO 27035 incident response frameworks?

**Answer:**

| Aspect | NIST SP 800-61 | ISO 27035 |
|--------|---------------|-----------|
| **Origin** | US government (NIST) | International (ISO/IEC) |
| **Phases** | 4 phases: Preparation → Detection & Analysis → Containment/Eradication/Recovery → Post-Incident | 5 phases: Plan & Prepare → Detection & Reporting → Assessment & Decision → Responses → Lessons Learned |
| **Focus** | Practical, hands-on guidance for technical IR teams | Broader organizational approach, includes governance and management responsibilities |
| **Audience** | SOC analysts, IR teams, technical staff | CISO, management, and technical teams |
| **Adoption** | Dominant in the US, widely used in MSSPs | Common in organizations pursuing ISO 27001 certification |

**In practice**, I use NIST as my operational framework for hands-on investigation work, but understanding ISO 27035 helps when working with clients who follow ISO standards for their compliance requirements.

---

## Section B: Investigation Techniques & Log Analysis

---

### Q8. What key log sources do you rely on during a security investigation?

**Answer:**

| Log Source | What It Tells Me |
|-----------|-----------------|
| **SIEM (Splunk/QRadar/Sentinel)** | Correlated view across all sources, timeline reconstruction |
| **Firewall logs** | Allowed/denied connections, source/dest IPs, ports, geo-location |
| **Proxy/Web gateway** | URL categories, domains visited, user-agent strings, file downloads |
| **DNS logs** | Domain lookups — spot DGA domains, DNS tunneling, C2 resolution |
| **EDR (AMP/CrowdStrike/Defender)** | Process execution chains, file creation, registry modifications, network connections per process |
| **Windows Event Logs** | Authentication (4624/4625/4648), privilege escalation (4672/4673), process creation (4688), PowerShell (4103/4104) |
| **Email gateway** | Phishing emails, attachment hashes, sender reputation, URL rewrites |
| **Cloud audit logs (CloudTrail/Azure Activity)** | API calls, IAM changes, resource creation/deletion |
| **IDS/IPS (Snort/Suricata/Firepower)** | Signature-based network threat detection, exploit attempts |
| **NetFlow/IPFIX** | Traffic volume patterns, beaconing detection, data exfiltration indicators |

---

### Q9. You see a Windows Event ID 4625 followed by 4624 from the same source. What does this indicate?

**Answer:**

- **4625** = Failed logon attempt.
- **4624** = Successful logon.

This sequence from the same source IP suggests a **successful brute-force or password-spraying attack** — the attacker tried multiple credentials and eventually found a valid one.

**My investigation steps**:
1. Check the **Logon Type** in the 4624 event (Type 3 = network, Type 10 = RDP, Type 7 = unlock).
2. Count the number of 4625 events preceding the 4624 — a large number confirms brute-force.
3. Check if the source IP is **internal or external**. External = likely attacker. Internal = could be lateral movement from already-compromised host.
4. Check the **account name** — is it a service account, admin account, or regular user?
5. Review subsequent activity from that session — look for 4672 (special privileges assigned), 4688 (process creation), 4698 (scheduled task created).
6. Cross-reference the source IP with threat intel feeds.
7. Check if MFA was required and whether it was bypassed.

---

### Q10. How would you detect DNS tunneling in your environment?

**Answer:**

DNS tunneling encodes data within DNS queries/responses to exfiltrate data or establish C2 communication.

**Detection indicators**:
1. **Unusually long DNS queries** — legitimate domains are short; tunneled data creates long subdomain strings (e.g., `aGVsbG8gd29ybGQ.evil.com`).
2. **High volume of DNS requests** to a single domain — normal browsing queries many domains; tunneling hammers one.
3. **Unusual record types** — TXT, NULL, or CNAME records used for data transfer (legitimate traffic is mostly A/AAAA).
4. **High entropy in subdomain names** — Base64/hex encoded data looks random compared to normal subdomains.
5. **DNS query/response size ratio** — responses significantly larger than queries may indicate data download.

**Detection methods**:
- **SIEM rules**: Alert on DNS queries exceeding a character threshold or high query volume to a single domain.
- **Network analytics** (Cisco Stealthwatch/Secure Network Analytics): Baseline DNS behavior and flag anomalies.
- **Passive DNS monitoring**: Identify newly registered or recently active domains receiving high query volumes.
- **Threat intel**: Match queried domains against known DNS tunneling tool infrastructure (iodine, dnscat2, Cobalt Strike DNS).

---

### Q11. A client reports their antivirus flagged a file but they believe it's a false positive. How do you investigate?

**Answer:**

1. **Gather details**: File name, file path, hash (MD5/SHA256), detection name, which AV engine flagged it.

2. **Hash lookup**:
   - Check on **VirusTotal** — how many engines detect it? What's the detection ratio?
   - Check **Hybrid Analysis / ANY.RUN** for sandbox reports.
   - Check internal threat intel platforms.

3. **Context analysis**:
   - Where did the file come from? (Download, email attachment, USB, software installation)
   - Is the file digitally signed? By whom?
   - What is the file's purpose in the client's environment?
   - Is it in the expected directory for that application?

4. **Behavioral analysis** (if needed):
   - Submit to a sandbox (Cisco Threat Grid / Cuckoo) and examine behavior — does it make network connections, modify registry, drop files, inject into processes?

5. **Decision**:
   - If the file is confirmed benign → add an **exclusion/allowlist rule** with documentation of why.
   - If the file is suspicious → **quarantine**, investigate the host for additional IOCs, and advise the client.

6. **Documentation**: Record the finding regardless of outcome — if it's a recurring FP, it may warrant a tuning request to the AV vendor.

---

### Q12. Explain the concept of "Living off the Land" (LOLBins) and why it's challenging for detection.

**Answer:**

**Living off the Land Binaries (LOLBins)** are legitimate, pre-installed system tools that attackers abuse for malicious purposes — making their activity blend in with normal admin operations.

**Common LOLBins**:
| Binary | Legitimate Use | Malicious Use |
|--------|---------------|---------------|
| `powershell.exe` | Scripting/automation | Download payloads, execute in-memory malware |
| `certutil.exe` | Certificate management | Download files, encode/decode payloads |
| `mshta.exe` | Run HTML applications | Execute malicious HTA files/scripts |
| `rundll32.exe` | Load DLLs | Load malicious DLLs, proxy execution |
| `regsvr32.exe` | Register COM objects | Download and execute remote scripts (Squiblydoo) |
| `bitsadmin.exe` | Background file transfer | Download malicious payloads |
| `wmic.exe` | WMI management | Remote execution, reconnaissance |

**Why it's hard to detect**:
- These are **signed Microsoft binaries**, so they bypass application whitelisting.
- Their execution is **expected** in enterprise environments.
- They don't require dropping additional malware to disk (fileless attacks).
- Traditional signature-based AV won't flag them.

**Detection strategies**:
- Monitor **command-line arguments** (Event ID 4688 with process command-line logging enabled, or Sysmon Event ID 1).
- Flag unusual parent-child process relationships (e.g., `excel.exe` spawning `powershell.exe`).
- Use EDR behavioral analytics rather than signature-based detection.
- Baseline normal usage patterns and alert on anomalies.

---

### Q13. What is the importance of chain of custody in incident investigations?

**Answer:**

**Chain of custody** ensures that digital evidence is collected, preserved, and documented in a way that maintains its **integrity and admissibility** — both for internal investigations and potential legal/law enforcement proceedings.

**Key principles**:
1. **Identification**: Clearly label what evidence was collected (disk image, memory dump, log export).
2. **Collection**: Use forensically sound methods (write-blockers, verified imaging tools like FTK Imager or `dd`).
3. **Preservation**: Store evidence with cryptographic hashes (SHA256) to prove it hasn't been tampered with.
4. **Documentation**: Record who collected it, when, where, and every person who handled it.
5. **Transfer**: Log every handoff — from analyst to manager, from security team to legal, from company to law enforcement.

**For Cisco MSS specifically**: Even if an investigation won't go to court, maintaining proper chain of custody demonstrates professionalism, supports compliance audits, and protects both Cisco and the client if the incident later escalates to litigation or regulatory action.

---

### Q14. How do you document a security investigation? What should be included?

**Answer:**

A well-documented investigation includes:

1. **Executive Summary**: 2-3 sentence overview — what happened, was it confirmed, what's the impact.

2. **Timeline of Events**: Chronological sequence of attacker activities and analyst actions, with UTC timestamps.

3. **Affected Assets**: Hostnames, IP addresses, operating systems, business function, asset criticality.

4. **Affected Accounts**: Usernames, privilege level, account type (user/service/admin).

5. **Indicators of Compromise (IOCs)**:
   - File hashes (MD5, SHA256)
   - Malicious domains/URLs
   - IP addresses
   - Email addresses
   - Mutex names, registry keys

6. **MITRE ATT&CK Mapping**: Techniques observed, mapped to the framework for standardized classification.

7. **Evidence Collected**: Screenshots, log exports, PCAP files, memory dumps.

8. **Analysis Details**: Step-by-step walkthrough of what the analyst investigated and what was found.

9. **Remediation Actions**: What was done (containment steps) and what's recommended (long-term fixes).

10. **Client Communication Log**: When the client was notified, what was discussed, decisions made.

**Key principle**: Write as if someone who has never seen this case will need to understand and continue the investigation. In an MSSP environment, shift handovers make this critical.

---

*End of Part 1 — Continue to Part 2 for Threat Intelligence, MITRE ATT&CK, and Threat Hunting.*
