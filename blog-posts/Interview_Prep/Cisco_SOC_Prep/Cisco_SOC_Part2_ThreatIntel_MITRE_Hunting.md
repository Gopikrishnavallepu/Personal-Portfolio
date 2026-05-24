# Cisco SOC Security Investigator – Interview Q&A
## Part 2: Threat Intelligence, MITRE ATT&CK & Threat Hunting

---

## Section C: Threat Intelligence

---

### Q15. What is threat intelligence and how do you use it in a SOC?

**Answer:**

**Threat intelligence (TI)** is evidence-based knowledge about existing or emerging threats that helps inform security decisions and prioritize defenses.

**Three levels of threat intelligence**:

| Level | Audience | Content | Example |
|-------|----------|---------|---------|
| **Strategic** | CISOs, executives | High-level trends, motivations, geopolitical context | "Ransomware groups are increasingly targeting healthcare in Q4" |
| **Operational** | SOC managers, IR leads | Campaign details, adversary TTPs, attack timelines | "APT29 is using OAuth token theft against M365 tenants" |
| **Tactical** | SOC analysts, detection engineers | Specific IOCs, signatures, detection rules | Hash: `a1b2c3...`, Domain: `malware-c2.evil.com`, Snort SID: 12345 |

**How I use it daily in a SOC**:
1. **Alert enrichment**: When I get an alert, I check if the IP/domain/hash matches known threat actor infrastructure via feeds (Cisco Talos, MISP, OTX, VirusTotal).
2. **Proactive detection**: Ingest IOCs from threat reports into SIEM as watchlists — if any client hits a new C2 domain, we detect it before an automated rule fires.
3. **Contextual prioritization**: An alert involving infrastructure tied to a nation-state APT gets escalated faster than generic commodity malware.
4. **Hunt hypothesis generation**: Threat reports describing new TTPs fuel my proactive hunt queries.
5. **Client advisories**: Translate intel into actionable advisories — "Patch CVE-2024-XXXX now, active exploitation confirmed."

---

### Q16. What open-source threat intelligence tools and feeds are you familiar with?

**Answer:**

| Tool/Feed | Purpose |
|-----------|---------|
| **VirusTotal** | Multi-engine file/URL/IP/domain analysis, community comments, relationships |
| **AbuseIPDB** | IP reputation — check if an IP is reported for malicious activity |
| **AlienVault OTX (Open Threat Exchange)** | Community-shared threat pulses with IOCs and context |
| **MISP (Malware Information Sharing Platform)** | Open-source TI platform for sharing, storing, and correlating IOCs |
| **Shodan / Censys** | Internet-facing asset intelligence — what's exposed and what services are running |
| **URLhaus** | Community project tracking malware distribution URLs |
| **MalwareBazaar** | Malware sample repository with hashes and YARA rules |
| **PhishTank** | Community-verified phishing URL database |
| **GreyNoise** | Distinguish targeted attacks from internet background noise/scanners |
| **Cisco Talos Intelligence** | Cisco's own threat research — IP/domain reputation, vulnerability research, malware analysis |
| **CISA KEV Catalog** | Known Exploited Vulnerabilities list — what's being actively exploited |

**How I integrate them**: I use a combination of API-based automated lookups (integrated into SIEM/SOAR playbooks) and manual lookups during investigations. For example, when investigating a suspicious IP, I'll check VirusTotal for detection history, AbuseIPDB for report frequency, GreyNoise to rule out scan noise, and Shodan to understand what services the IP runs.

---

### Q17. What is the Pyramid of Pain and why is it important?

**Answer:**

The **Pyramid of Pain** (by David Bianco) ranks indicator types by how much pain it causes an attacker when you detect and block them:

```
        /\
       /  \  TTPs (Most Painful)
      /    \
     / Tools \
    /  Network/ \
   / Host Artifacts\
  / Domain Names     \
 / IP Addresses        \
/ Hash Values (Trivial)  \
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
```

| Level | Pain to Attacker | Example |
|-------|-----------------|---------|
| **Hash values** | Trivial — change one byte, new hash | Block SHA256 of malware binary |
| **IP addresses** | Easy — switch to new VPS/proxy | Block C2 IP |
| **Domain names** | Simple — register new domain | Block C2 domain |
| **Network/Host Artifacts** | Annoying — requires retooling | Block specific User-Agent string, URI pattern, registry key |
| **Tools** | Challenging — must develop/acquire new tools | Detect and block Cobalt Strike framework |
| **TTPs** | Painful — must fundamentally change attack methodology | Detect "process injection via early bird APC queue" regardless of tool used |

**Why it matters**: A SOC that only blocks hashes and IPs will be continuously evaded. By focusing detection on **TTPs** (behavioral detection), we force attackers to fundamentally change their approach, which is expensive and time-consuming for them. This is why MITRE ATT&CK mapping is so valuable.

---

### Q18. How does Cisco Talos fit into the threat intelligence landscape?

**Answer:**

**Cisco Talos** is one of the largest commercial threat intelligence and research organizations globally. It directly powers security across all Cisco security products.

**Key contributions**:
1. **Threat research**: Publishes detailed analysis of malware campaigns, APT groups, and zero-day vulnerabilities.
2. **Reputation intelligence**: Maintains reputation databases for IPs, domains, URLs, and file hashes that feed into Cisco Umbrella, Firepower, ESA, and Secure Endpoint.
3. **Vulnerability discovery**: Talos researchers discover and responsibly disclose vulnerabilities (frequent CVE publishers).
4. **Snort rules**: Maintains the open-source Snort IDS/IPS rule set and writes custom detection rules for emerging threats.
5. **ClamAV**: Maintains the open-source ClamAV antivirus engine.
6. **Incident response**: Cisco Talos Incident Response (CTIR) provides hands-on IR services.

**As a Cisco SOC Investigator**, Talos intelligence is a primary enrichment source. When I investigate an alert from Cisco Secure Endpoint or Firepower, the detection often originates from Talos research. I also reference Talos blog posts for emerging threat details and TTPs to guide my investigations.

---

## Section D: MITRE ATT&CK Framework

---

### Q19. What is the MITRE ATT&CK framework and how do you use it?

**Answer:**

**MITRE ATT&CK** (Adversarial Tactics, Techniques, and Common Knowledge) is a knowledge base of adversary behaviors observed in real-world attacks, organized into:

- **Tactics** (the "why"): The adversary's goal at each attack stage (14 tactics for Enterprise).
- **Techniques** (the "how"): Specific methods used to achieve each tactic.
- **Sub-techniques**: More granular breakdowns of techniques.
- **Procedures**: Specific implementations by known threat groups.

**The 14 Enterprise Tactics (in order)**:
1. Reconnaissance
2. Resource Development
3. Initial Access
4. Execution
5. Persistence
6. Privilege Escalation
7. Defense Evasion
8. Credential Access
9. Discovery
10. Lateral Movement
11. Collection
12. Command and Control
13. Exfiltration
14. Impact

**How I use it daily**:
1. **Investigation mapping**: During every investigation, I map observed attacker behaviors to ATT&CK techniques. This standardizes communication and ensures completeness.
2. **Gap analysis**: Compare our detection rules against the ATT&CK matrix to identify blind spots (which techniques do we not have coverage for?).
3. **Hunt hypotheses**: "We don't have detection for T1053.005 (Scheduled Task). Let me hunt for suspicious scheduled task creation across client environments."
4. **Threat group profiling**: When threat intel identifies a specific APT group, I look at their known ATT&CK techniques to proactively check for their TTPs.
5. **Client reporting**: ATT&CK IDs provide a standardized, vendor-neutral language when communicating findings.

---

### Q20. Map a phishing attack through the MITRE ATT&CK framework.

**Answer:**

**Scenario**: Employee receives a phishing email with a malicious Word document, leading to credential theft and data exfiltration.

| Stage | ATT&CK Tactic | Technique ID | Description |
|-------|---------------|-------------|-------------|
| 1 | **Initial Access** | T1566.001 | Spearphishing Attachment — Malicious .docm sent via email |
| 2 | **Execution** | T1204.002 | User Execution: Malicious File — User opens doc and enables macros |
| 3 | **Execution** | T1059.001 | PowerShell — Macro launches encoded PowerShell command |
| 4 | **Defense Evasion** | T1027 | Obfuscated Files or Information — Base64-encoded PowerShell |
| 5 | **Persistence** | T1547.001 | Registry Run Keys — Payload adds itself to HKCU Run key |
| 6 | **Credential Access** | T1003.001 | OS Credential Dumping: LSASS Memory — Mimikatz dumps credentials |
| 7 | **Discovery** | T1083 | File and Directory Discovery — Attacker enumerates file shares |
| 8 | **Lateral Movement** | T1021.002 | SMB/Windows Admin Shares — Attacker moves to file server |
| 9 | **Collection** | T1005 | Data from Local System — Sensitive files staged |
| 10 | **Exfiltration** | T1041 | Exfiltration Over C2 Channel — Data sent out via HTTPS C2 |

This mapping helps me: (a) validate I've investigated every attack phase, (b) identify detection gaps we should close, and (c) communicate findings to the client in a standardized way.

---

### Q21. What is the difference between ATT&CK and the Cyber Kill Chain?

**Answer:**

| Aspect | Lockheed Martin Cyber Kill Chain | MITRE ATT&CK |
|--------|--------------------------------|---------------|
| **Structure** | 7 linear, sequential phases | 14 tactics with hundreds of techniques, non-linear |
| **Granularity** | High-level stages | Detailed technique-level behaviors |
| **Assumption** | Attack follows a linear progression | Attackers can jump between tactics, skip stages, or loop |
| **Focus** | Primarily network intrusion (perimeter-centric) | Covers full spectrum including cloud, mobile, ICS, containers |
| **Use case** | Strategic understanding of attack flow | Operational detection engineering, gap analysis, threat profiling |
| **Maintenance** | Static since publication | Continuously updated by MITRE with community contributions |

**My view**: The Kill Chain is useful for explaining attack flow to non-technical stakeholders. ATT&CK is what I use day-to-day for detection engineering, investigation mapping, and threat hunting. They complement each other — Kill Chain for the "big picture," ATT&CK for the details.

---

## Section E: Threat Hunting

---

### Q22. What is proactive threat hunting and how does it differ from detection?

**Answer:**

| Aspect | Detection (Reactive) | Threat Hunting (Proactive) |
|--------|---------------------|---------------------------|
| **Trigger** | Automated alert fires | Analyst-driven hypothesis |
| **Approach** | Rule matches known pattern | Search for unknown/undetected threats |
| **Dependency** | Requires pre-built detection rules | Requires analyst expertise and creativity |
| **Coverage** | Known knowns and known unknowns | Unknown unknowns |
| **Output** | Alert → Investigation | New detection rules, found threats, improved visibility |

**Threat hunting process**:
1. **Form a hypothesis**: Based on threat intel, ATT&CK gaps, or anomalies (e.g., "APT group X is targeting our client's industry using OAuth app abuse, are we seeing this?").
2. **Collect and analyze data**: Query SIEM, EDR, network analytics for evidence supporting or disproving the hypothesis.
3. **Investigate findings**: Any suspicious results get a full investigation.
4. **Produce outputs**: 
   - If malicious activity found → escalate to incident response.
   - If new behavioral pattern identified → create new detection rules.
   - If data gaps found → request new log sources or telemetry.
5. **Document and share**: Write up the hunt methodology and results for team knowledge sharing.

---

### Q23. Give an example of a threat hunt you would conduct.

**Answer:**

**Hunt: Detecting Beaconing Activity to C2 Infrastructure**

**Hypothesis**: An attacker has established a C2 channel in the environment, and the compromised host is periodically beaconing to an external server at regular intervals.

**Data sources**: Proxy logs, firewall logs, DNS logs, NetFlow data.

**Methodology**:
1. **Extract outbound connection data**: Pull all outbound HTTP/HTTPS connections over the past 30 days from proxy logs.
2. **Calculate connection intervals**: For each source IP → destination domain pair, calculate the time delta between connections.
3. **Identify regularity**: Flag pairs where the standard deviation of connection intervals is very low (e.g., connecting every 60 seconds ± 2 seconds). Legitimate browsing is irregular; C2 beacons are metronomic.
4. **Enrich results**: Check flagged domains against threat intel. Look at domain age (newly registered?), registration details, hosting provider.
5. **Investigate outliers**: For those with no TI hits, examine the traffic volume, User-Agent strings, URL patterns, and TLS certificate details.
6. **Correlate with EDR**: For any confirmed suspicious hosts, check EDR telemetry for process responsible for the connections.

**Expected outcomes**:
- Discover compromised hosts with active C2 → escalate as incident.
- Discover legitimate but unknown scheduled tasks/applications → document as known goods.
- Create a **SIEM correlation rule** to automatically detect beaconing patterns going forward.

---

### Q24. How do you use network analytics for security investigations?

**Answer:**

Network analytics (e.g., **Cisco Secure Network Analytics / Stealthwatch**) provides behavioral visibility into network traffic without requiring full packet capture.

**Key use cases**:

1. **Anomaly detection**: Baseline normal traffic patterns and detect deviations — sudden spike in outbound data from a server, unusual port usage, new internal-to-internal connections.

2. **Lateral movement detection**: Identify hosts communicating with systems they've never contacted before, especially using administrative protocols (SMB, RDP, WMI, SSH).

3. **Data exfiltration**: Flag hosts transferring abnormally large volumes of data to external IPs, especially to uncommon destinations or during off-hours.

4. **Beaconing detection**: Statistical analysis of connection regularity to identify C2 callbacks (as described in the hunt above).

5. **Encrypted traffic analysis (ETA)**: Cisco's ETA can identify malware in encrypted traffic without decryption, using metadata analysis (TLS fingerprinting, packet length/timing sequences).

6. **Insider threat**: Detect authorized users accessing resources outside their normal behavioral pattern — a finance user suddenly querying engineering file shares.

**In an investigation workflow**: When I get an EDR alert on a host, I immediately check network analytics to see: What external IPs did this host communicate with? What internal hosts did it reach? How much data was transferred? This gives me a network-level view to complement the endpoint telemetry.

---

### Q25. What are Indicators of Compromise (IOCs) vs. Indicators of Attack (IOAs)?

**Answer:**

| Aspect | IOC (Indicator of Compromise) | IOA (Indicator of Attack) |
|--------|------------------------------|--------------------------|
| **What** | Forensic evidence that a breach occurred | Real-time behavioral patterns suggesting an active attack |
| **When** | After the fact (reactive) | During the attack (proactive) |
| **Examples** | Malware hash, C2 IP address, malicious domain, registry key | Process injection, credential dumping behavior, suspicious PowerShell execution pattern |
| **Lifespan** | Short — attackers change hashes/IPs frequently | Long — behaviors change slowly |
| **Detection** | Hash/IP blocklists, YARA rules, signature matching | Behavioral analytics, EDR behavioral rules, ML models |

**Why IOAs are more valuable for hunting**: IOCs are like "wanted posters" — they only work if you have the exact mugshot. IOAs are like "behavioral profiles" — they detect the attacker regardless of what tools or infrastructure they use. Modern SOCs need both, but investing in IOA-based detection provides more durable coverage.

---

*End of Part 2 — Continue to Part 3 for Network Security, Endpoint Protection, and Security Tools.*
