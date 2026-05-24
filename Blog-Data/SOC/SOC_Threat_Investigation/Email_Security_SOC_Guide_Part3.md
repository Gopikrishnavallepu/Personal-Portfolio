# 📧 Email Security SOC Guide — Part 3: Advanced Analysis & IOC Extraction

---

# PART 3: ADVANCED EMAIL ANALYSIS TECHNIQUES

---

## 9. Email Header Deep-Dive Analysis

### 9.1 Reading Headers (Bottom to Top)

> **Critical Rule**: Email headers are read **bottom-to-top**. The bottom-most `Received:` header is the originating server. Each subsequent header is added by each MTA in the delivery chain.

```
Received: from final-hop.company.com (10.0.0.5)      ← 3rd hop (recipient MTA)
    by mailbox-server.company.com; Wed, 08 Apr 2026 10:30:05
Received: from relay.example.com (203.0.113.50)       ← 2nd hop (relay/SEG)
    by final-hop.company.com; Wed, 08 Apr 2026 10:30:03
Received: from sender-mta.attacker.com (198.51.100.1) ← 1st hop (ORIGINATOR)
    by relay.example.com; Wed, 08 Apr 2026 10:30:00
```

### 9.2 Key Headers & SOC Relevance

| Header | What to Check | Red Flags |
|--------|--------------|-----------|
| **From** | Display name and email address | Display name ≠ email domain; impersonation |
| **Return-Path / Envelope-From** | Actual sender for bounce handling | Different domain from `From:` header |
| **Reply-To** | Where replies are directed | External free email (Gmail, Yahoo) when From is corporate |
| **Received** | Delivery chain, originating IP | Mismatched geolocation; known bad IPs |
| **X-Originating-IP** | Original sender's IP | Residential IP, TOR exit node, VPN |
| **Authentication-Results** | SPF/DKIM/DMARC verdict | Any fail or softfail |
| **X-Mailer / User-Agent** | Email client used | Unusual or outdated client for the claimed sender |
| **Message-ID** | Unique message identifier | Domain in Message-ID doesn't match sender domain |
| **Content-Type** | MIME type of message body | multipart/mixed with unexpected attachment types |
| **X-MS-Exchange-Organization-SCL** | Spam Confidence Level (Exchange) | High SCL value (≥5) indicates spam likelihood |
| **X-Forefront-Antispam-Report** | Microsoft's detailed spam analysis | Contains CAT (category), SFV (spam filter verdict) |
| **X-Microsoft-Antispam** | Additional Microsoft filtering data | BCL (Bulk Complaint Level), PCL values |
| **Received-SPF** | SPF check result | softfail or fail |
| **ARC-Authentication-Results** | Authenticated Received Chain | Useful when email passes through intermediaries |

### 9.3 Header Anomaly Detection

| Anomaly | Description | Likely Verdict |
|---------|-------------|----------------|
| **Hop count mismatch** | Too many or too few Received headers | ⚠️ Possible relay abuse or header injection |
| **Timestamp inconsistency** | Received timestamps go backwards | 🔴 Header forgery |
| **Missing headers** | No Authentication-Results, no Message-ID | ⚠️ Non-standard or crafted email |
| **From ≠ Return-Path** | Envelope sender differs from display sender | ⚠️ May be legitimate (mailing list) or spoofing |
| **Reply-To mismatch** | Reply-To points to different domain | 🔴 BEC indicator |
| **Internal-looking but external origin** | Claims to be from @company.com but Received shows external | 🔴 Spoofing attempt |
| **Encoded/obfuscated subject** | Base64 or unusual encoding in Subject | ⚠️ Evasion attempt |

### 9.4 Microsoft 365 Specific Headers

| Header | Values & Meaning |
|--------|-----------------|
| **X-MS-Exchange-Organization-SCL** | -1 (bypass), 0-4 (low risk), 5-6 (spam), 7-9 (high confidence spam) |
| **X-Forefront-Antispam-Report: CAT** | `PHSH` (phishing), `MALW` (malware), `SPM` (spam), `HSPM` (high confidence spam), `SPOOF` (spoofing) |
| **X-Forefront-Antispam-Report: SFV** | `BLK` (blocked), `NSPM` (not spam), `SPM` (spam), `SKS` (skipped scanning) |
| **X-MS-Exchange-Organization-AuthSource** | Server that performed authentication |
| **X-MS-Exchange-Organization-AuthAs** | `Anonymous` (external), `Internal` (internal) |
| **X-MS-Exchange-Transport-CrossTenantHeadersStamped** | Cross-tenant routing information |
| **X-OriginatorOrg** | Originating organization |

### 9.5 Header Analysis Tools

| Tool | Purpose | URL/Access |
|------|---------|------------|
| **MXToolbox Header Analyzer** | Parse and visualize email headers | mxtoolbox.com/HeaderAnalyzer.aspx |
| **Google Admin Toolbox** | Analyze email headers | toolbox.googleapps.com/apps/messageheader |
| **Mail Header Analyzer (by GlockApps)** | Detailed header breakdown | glockapps.com/email-header-analyzer |
| **Message Trace (M365 Admin)** | Trace email delivery in Microsoft 365 | admin.microsoft.com → Mail flow → Message trace |
| **Threat Explorer (MDO)** | Hunt emails in Microsoft Defender | security.microsoft.com → Email & collaboration |

---

## 10. URL Analysis

### 10.1 URL Investigation Workflow

```
URL Found in Email
       │
       ▼
┌─────────────────┐
│ 1. DEFANG the URL│ → Replace http with hxxp, . with [.]
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Expand URL    │ → Unshorten bit.ly, tinyurl, etc.
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Check         │ → VirusTotal, URLScan.io, URLhaus
│    Reputation    │    PhishTank, Google Safe Browsing
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Inspect       │ → WHOIS domain lookup, DNS records
│    Domain        │    Domain age, registrar, hosting
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. Safe Browse   │ → Open in sandbox/isolated browser
│    the URL       │    Check for credential harvesting form
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. Screenshot    │ → Capture landing page for evidence
│    & Document    │    Archive with urlscan.io or Wayback
└─────────────────┘
```

### 10.2 URL Red Flags

| Indicator | Example | Risk Level |
|-----------|---------|------------|
| **IP-based URL** | `http://198.51.100.1/login` | 🔴 High |
| **Lookalike domain** | `micros0ft-login.com` | 🔴 High |
| **Excessive subdomains** | `login.microsoft.com.evil.com` | 🔴 High |
| **URL shortener** | `bit.ly/3xAbCdE` | 🟡 Medium |
| **Base64 in URL path** | `/redirect?url=aHR0cDov...` | 🔴 High |
| **Multiple redirects** | 3+ hops before final destination | 🔴 High |
| **Newly registered domain** | Domain age < 30 days | 🔴 High |
| **Free hosting/sites** | `sites.google.com`, `weebly.com` | 🟡 Medium |
| **Credential form on landing** | Username/password fields | 🔴 High |
| **Brand logos on non-brand domain** | Microsoft logo on `random-site.xyz` | 🔴 High |
| **CAPTCHA before phishing page** | CloudFlare turnstile hiding content | 🔴 High (evasion) |
| **URL encoded characters** | `%2F%2Flogin%2Ephishing%2Ecom` | 🟡 Medium |
| **Data URI** | `data:text/html;base64,...` | 🔴 High |
| **JavaScript redirect** | `javascript:window.location=...` | 🔴 High |

### 10.3 URL Analysis Tools

| Tool | Purpose | Type |
|------|---------|------|
| **URLScan.io** | Scan & screenshot URLs safely | Free/Paid |
| **VirusTotal** | Multi-engine URL scanning | Free/Paid |
| **PhishTank** | Community phishing URL database | Free |
| **URLhaus** (abuse.ch) | Malware URL database | Free |
| **Google Safe Browsing** | Google's URL threat check | Free API |
| **Hybrid Analysis** | URL sandbox detonation | Free/Paid |
| **ANY.RUN** | Interactive URL sandbox | Free/Paid |
| **CheckPhish.ai** | AI-powered phishing detection | Free |
| **Unfurl** | Parse & visualize URL components | Free |
| **CyberChef** | Decode/deobfuscate URL encoding | Free |
| **WhoisXML API** | Domain WHOIS and history | Paid |
| **SecurityTrails** | Historical DNS data | Free/Paid |

### 10.4 Phishing Kit Indicators

| Component | Description |
|-----------|-------------|
| **Login form clone** | Pixel-perfect copy of Microsoft 365, Google, bank login |
| **Hidden form fields** | Captures additional data (user-agent, IP, location) |
| **Exfiltration method** | Form POST to attacker server, Telegram bot, email |
| **Anti-analysis** | GeoIP blocking, user-agent filtering, bot detection |
| **Token theft** | AiTM (Adversary-in-the-Middle) proxying real login to steal session tokens |
| **Progressive phishing** | First page asks for email, second for password, third for MFA |

---

## 11. Attachment Analysis

### 11.1 High-Risk Attachment Types

| File Type | Risk | Common Attack Vector |
|-----------|------|---------------------|
| `.exe, .scr, .bat, .cmd, .com` | 🔴 Critical | Direct executable — malware dropper |
| `.js, .vbs, .wsf, .ps1` | 🔴 Critical | Script-based malware execution |
| `.docm, .xlsm, .pptm` | 🔴 High | Macro-enabled Office documents |
| `.doc, .xls` (legacy) | 🔴 High | Legacy formats support macros by default |
| `.iso, .img, .vhd, .vhdx` | 🔴 High | Disk image — bypasses Mark-of-the-Web (MOTW) |
| `.lnk` | 🔴 High | Windows shortcut executing hidden commands |
| `.html, .htm, .mht` | 🟠 High | HTML smuggling — generates payload on open |
| `.zip, .rar, .7z, .gz` | 🟡 Medium | May contain hidden executables |
| `.pdf` | 🟡 Medium | Can contain JavaScript, embedded objects, URLs |
| `.one` (OneNote) | 🟠 High | Embedded scripts in OneNote files (newer vector) |
| `.svg` | 🟡 Medium | Can contain embedded JavaScript |
| `.eml, .msg` | 🟡 Medium | Nested email with malicious content inside |

### 11.2 Attachment Analysis Workflow

```
Attachment Received
       │
       ▼
┌──────────────────────┐
│ 1. DO NOT OPEN on    │
│    production system  │
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 2. Calculate hash    │ → MD5, SHA1, SHA256
│    (without opening) │    Use: certutil, sha256sum, PowerShell
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 3. Check hash on     │ → VirusTotal, Malware Bazaar,
│    threat intel      │    Hybrid Analysis, OPSWAT
└──────────┬───────────┘
           ▼
┌──────────────────────┐         ┌───────────────────┐
│ 4. Known malware?    │──YES──▶ │ 🔴 TP Confirmed   │
│                      │         │ Proceed to contain │
└──────────┬───────────┘         └───────────────────┘
           NO
           ▼
┌──────────────────────┐
│ 5. Submit to sandbox │ → ANY.RUN, Joe Sandbox, Hybrid Analysis
│    for detonation    │    Microsoft Defender Sandbox, Cuckoo
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 6. Analyze behavior  │ → Process creation, network connections,
│                      │    file system changes, registry mods
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 7. Static analysis   │ → Strings, YARA rules, macro extraction
│    (if needed)       │    PE analysis, OLE analysis
└──────────┬───────────┘
           ▼
    Determine Verdict
```

### 11.3 Attachment Analysis Tools

| Tool | Purpose | Type |
|------|---------|------|
| **VirusTotal** | Multi-AV hash/file scanning | Free/Paid |
| **Hybrid Analysis** | Automated sandbox analysis | Free/Paid |
| **ANY.RUN** | Interactive malware sandbox | Free/Paid |
| **Joe Sandbox** | Deep malware analysis | Paid |
| **Cuckoo Sandbox** | Open-source sandbox | Free (self-hosted) |
| **Malware Bazaar** (abuse.ch) | Malware sample sharing | Free |
| **OPSWAT MetaDefender** | Multi-engine file scanning | Free/Paid |
| **OLETools** | Analyze OLE/Office macro documents | Free |
| **YARA** | Pattern matching for malware detection | Free |
| **PEStudio** | Static PE file analysis | Free |
| **CyberChef** | Decode/deobfuscate payloads | Free |
| **Didier Stevens Suite** | PDF & Office document analysis tools | Free |
| **ExifTool** | Metadata extraction from files | Free |

### 11.4 Office Macro Analysis

```
Macro Analysis Steps:
1. Extract with olevba (oletools):
   $ olevba suspicious.docm

2. Look for:
   ├─ AutoOpen / Document_Open (auto-execute triggers)
   ├─ Shell / WScript.Shell (command execution)
   ├─ PowerShell invocations
   ├─ URLDownloadToFile / XMLHTTP (downloading payloads)
   ├─ Environment variable access
   ├─ Base64 encoded strings
   └─ Heavily obfuscated variable names

3. Red flags in macro code:
   ├─ CreateObject("WScript.Shell").Run
   ├─ powershell -encodedcommand
   ├─ Invoke-Expression (IEX)
   ├─ certutil -decode
   ├─ bitsadmin /transfer
   └─ regsvr32 /s /n /u /i:http://...
```

---

## 12. IOC (Indicators of Compromise) Extraction & Enrichment

### 12.1 Email IOC Types

| IOC Type | Example | Where to Find |
|----------|---------|---------------|
| **Sender Email** | attacker@malicious-domain.com | From header |
| **Sender Domain** | malicious-domain.com | From header, Return-Path |
| **Sender IP** | 198.51.100.1 | Received headers, X-Originating-IP |
| **Phishing URL** | hxxps://fake-login[.]com/o365 | Email body, HTML source |
| **Redirect URL** | hxxps://bit[.]ly/3xAbCdE | Email body |
| **Final Landing URL** | hxxps://credential-harvest[.]xyz | URL redirect chain |
| **Attachment Hash (MD5)** | d41d8cd98f00b204e9800998ecf8427e | File hash calculation |
| **Attachment Hash (SHA256)** | e3b0c44298fc1c149afbf4c8996... | File hash calculation |
| **Attachment Filename** | Invoice_April_2026.docm | MIME part headers |
| **Subject Line** | "Urgent: Verify Your Account" | Subject header |
| **Message-ID** | \<unique-id@malicious.com\> | Message-ID header |
| **User-Agent** | Custom-Mailer/1.0 | X-Mailer header |
| **DKIM Selector** | selector1 | DKIM-Signature header |
| **Reply-To Address** | reply@different-domain.com | Reply-To header |

### 12.2 IOC Enrichment Matrix

| IOC Type | Enrichment Sources | What to Check |
|----------|-------------------|---------------|
| **IP Address** | VirusTotal, AbuseIPDB, Shodan, IPVoid, Talos Intelligence, OTX | Geolocation, ASN, abuse reports, open ports, reputation score |
| **Domain** | VirusTotal, URLScan, WHOIS, DomainTools, SecurityTrails, PassiveTotal | Registration date, registrar, nameservers, historical DNS, subdomains |
| **URL** | URLScan.io, VirusTotal, PhishTank, Google Safe Browsing, URLhaus | Screenshot, final destination, technologies, categorization |
| **File Hash** | VirusTotal, Malware Bazaar, Hybrid Analysis, OPSWAT, ThreatFox | AV detections, sandbox results, associated campaigns, YARA matches |
| **Email Address** | Have I Been Pwned, Hunter.io, EmailRep.io | Breach history, disposable check, reputation |

### 12.3 IOC Documentation Template

```markdown
## Email Security Incident — IOC Report

**Ticket ID**: INC-2026-XXXX
**Date**: 2026-04-08
**Analyst**: [Name]
**Severity**: [Critical/High/Medium/Low]
**Verdict**: [TP/FP/BTP]

### Email Metadata
- **Subject**: 
- **From (Display)**: 
- **From (Address)**: 
- **Return-Path**: 
- **Reply-To**: 
- **Date/Time**: 
- **Message-ID**: 
- **Recipients**: 
- **SPF**: [pass/fail/softfail/none]
- **DKIM**: [pass/fail/none]
- **DMARC**: [pass/fail/none]
- **X-Originating-IP**: 

### Sender Analysis
- **Domain**: 
- **Domain Age**: 
- **WHOIS Registrant**: 
- **Reputation**: 
- **Sending IP**: 
- **IP Geolocation**: 
- **IP Reputation**: 

### URL IOCs
| # | Defanged URL | Type | Verdict | VT Score |
|---|-------------|------|---------|----------|
| 1 | hxxps://... | Redirect | Malicious | 15/90 |
| 2 | hxxps://... | Landing Page | Malicious | 22/90 |

### Attachment IOCs
| Filename | SHA256 | File Type | VT Score | Sandbox Result |
|----------|--------|-----------|----------|----------------|
| file.docm | abc123... | Office/Macro | 30/70 | Malicious |

### Network IOCs (from sandbox)
| IOC | Type | Context |
|-----|------|---------|
| 198.51.100.50 | C2 IP | PowerShell beacon |
| evil-c2.com | C2 Domain | Payload download |

### Analysis Summary
[Detailed narrative of findings]

### Response Actions Taken
- [ ] Email purged from all mailboxes
- [ ] Sender domain blocked
- [ ] URL blocked at proxy/firewall
- [ ] File hash blocked at endpoint
- [ ] Affected users notified
- [ ] Credentials reset (if clicked)
- [ ] IOCs shared with threat intel team
```

---

## 13. Email Threat Hunting Queries

### 13.1 Microsoft 365 — Threat Explorer / Advanced Hunting (KQL)

```kusto
// Find emails from a specific sender domain
EmailEvents
| where SenderFromDomain == "suspicious-domain.com"
| where Timestamp > ago(7d)
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, DeliveryAction, DeliveryLocation

// Find emails with specific attachment type
EmailAttachmentInfo
| where FileName endswith ".docm" or FileName endswith ".xlsm" or FileName endswith ".iso"
| where Timestamp > ago(7d)
| join EmailEvents on NetworkMessageId
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, FileName, FileType

// Find emails containing specific URL domain
EmailUrlInfo
| where UrlDomain contains "phishing-domain"
| where Timestamp > ago(7d)
| join EmailEvents on NetworkMessageId
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Subject, Url

// Find emails with specific subject pattern
EmailEvents
| where Subject contains "invoice" and Subject contains "urgent"
| where Timestamp > ago(7d)
| where DeliveryAction == "Delivered"

// Detect potential BEC — Display name spoofing executives
EmailEvents
| where SenderFromAddress !endswith "@company.com"
| where SenderDisplayName in ("CEO Name", "CFO Name", "CTO Name")
| where Timestamp > ago(30d)

// Find emails where user clicked URLs
EmailEvents
| join UrlClickEvents on NetworkMessageId
| where Timestamp > ago(7d)
| project Timestamp, SenderFromAddress, RecipientEmailAddress, Url, ActionType, IsClickedThrough

// Detect inbox rule creation (account compromise indicator)
CloudAppEvents
| where ActionType == "New-InboxRule"
| where Timestamp > ago(30d)
| extend RuleName = tostring(parse_json(RawEventData).Parameters[0].Value)
| project Timestamp, AccountDisplayName, RuleName, RawEventData

// Hunt for emails from newly registered domains
EmailEvents
| where Timestamp > ago(7d)
| where DeliveryAction == "Delivered"
| join kind=leftouter (
    EmailAttachmentInfo | project NetworkMessageId, FileName
) on NetworkMessageId
| where SenderFromDomain !endswith ".com" or SenderFromDomain matches regex @"[0-9]{4,}"
```

### 13.2 Splunk — Email Security Queries

```spl
// Phishing emails with failed authentication
index=email sourcetype=email:headers
| where spf_result="fail" OR dkim_result="fail" OR dmarc_result="fail"
| stats count by sender_domain, sender_address, subject, spf_result, dkim_result, dmarc_result
| sort -count

// Emails with suspicious attachment types
index=email sourcetype=email:attachments
| where match(attachment_name, "\.(exe|scr|js|vbs|docm|xlsm|iso|lnk|html|ps1)$")
| stats count by sender_address, attachment_name, attachment_hash
| sort -count

// URL click analysis
index=email_proxy sourcetype=urlclick
| where action="allowed"
| stats count by user, url_domain, url_full
| where count > 0
| sort -count

// Detect email bombing (high volume to single recipient)
index=email sourcetype=email:headers
| bin _time span=1h
| stats count by recipient_address, _time
| where count > 50
| sort -count

// BEC detection — Reply-To mismatch
index=email sourcetype=email:headers
| where reply_to != sender_address AND reply_to != ""
| stats count by sender_address, reply_to, subject
| sort -count
```

### 13.3 Google Workspace — Email Log Search

```
// Admin Console → Reporting → Email Log Search
// Key filters:
- Sender: attacker@domain.com
- Recipient: victim@company.com
- Date range: [specific period]
- Subject: contains "invoice"
- Message ID: <specific-message-id>
- Has attachment: yes
- Attachment name: contains ".docm"

// Gmail Security Investigation Tool
// Admin Console → Security → Investigation Tool
// Search by: Message ID, sender, subject, attachment hash
// Actions: Delete, Mark as phishing, Move to inbox
```

---

## 14. Response & Remediation Playbooks

### 14.1 Phishing Email — Response Playbook

```
┌─────────────────────────────────────────────────────────┐
│           PHISHING EMAIL RESPONSE PLAYBOOK               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PHASE 1: CONTAIN (0-15 minutes)                       │
│  ├─ Block sender domain/address at SEG                  │
│  ├─ Block malicious URLs at proxy/firewall              │
│  ├─ Block file hash at endpoint (EDR)                   │
│  ├─ Purge email from all mailboxes (ZAP/TRAP/purge)    │
│  └─ Quarantine affected endpoints (if malware executed) │
│                                                         │
│  PHASE 2: ASSESS IMPACT (15-60 minutes)                │
│  ├─ Identify all recipients                             │
│  ├─ Determine who opened/clicked/downloaded             │
│  ├─ Check endpoint telemetry for execution              │
│  ├─ Check authentication logs for credential use        │
│  └─ Assess data exposure risk                           │
│                                                         │
│  PHASE 3: REMEDIATE (1-4 hours)                        │
│  ├─ Reset passwords for compromised users               │
│  ├─ Revoke active sessions (Azure AD/Okta)             │
│  ├─ Re-enroll MFA if MFA was bypassed                  │
│  ├─ Remove malware from affected endpoints              │
│  ├─ Remove malicious inbox rules                        │
│  └─ Restore any modified files/settings                 │
│                                                         │
│  PHASE 4: COMMUNICATE (ongoing)                        │
│  ├─ Notify affected users                               │
│  ├─ Send org-wide awareness alert (if widespread)      │
│  ├─ Notify management/CISO (if significant impact)     │
│  └─ Report to external authorities if required          │
│                                                         │
│  PHASE 5: LEARN (post-incident)                        │
│  ├─ Update detection rules to catch similar emails      │
│  ├─ Add IOCs to blocklists and threat intel feeds      │
│  ├─ Conduct targeted phishing awareness training        │
│  ├─ Document lessons learned                            │
│  └─ Update playbook based on findings                   │
└─────────────────────────────────────────────────────────┘
```

### 14.2 BEC — Response Playbook

```
PHASE 1: IMMEDIATE (0-30 minutes)
├─ Contact the impersonated person via out-of-band channel
├─ If financial transaction initiated → IMMEDIATELY contact bank
├─ Block the attacker's email address
├─ Quarantine all related emails
└─ Preserve evidence (full email with headers)

PHASE 2: INVESTIGATE (30 min - 2 hours)
├─ Determine if impersonated person's account is compromised
├─ Review sign-in logs for the impersonated account
├─ Check for inbox rules/forwarding on impersonated account
├─ Analyze email headers for origin
├─ Check for domain lookalike registration
└─ Identify all recipients and check for responses

PHASE 3: REMEDIATE
├─ If account compromised: Reset password, revoke sessions, re-enroll MFA
├─ Remove any unauthorized inbox rules
├─ If wire transfer sent: Work with legal and banking to recall
├─ Block the lookalike domain at DNS/proxy level
└─ Report the lookalike domain (registrar abuse, takedown request)

PHASE 4: PREVENT
├─ Implement/strengthen DMARC to p=reject
├─ Enable external email banner/warning
├─ Configure impersonation protection in email security
├─ Require dual approval for financial transactions
└─ Conduct BEC-specific awareness training for finance team
```

### 14.3 Account Compromise — Response Playbook

```
PHASE 1: CONTAIN (0-15 minutes)
├─ Reset user password immediately
├─ Revoke all active sessions and refresh tokens
├─ Disable account temporarily (if active attack)
├─ Block the attacker's IP at firewall/proxy
└─ Enable enhanced monitoring on the account

PHASE 2: INVESTIGATE (15 min - 2 hours)
├─ Review sign-in logs (Impossible travel? New devices? TOR/VPN?)
├─ Audit inbox rules (forwarding, auto-delete, move rules)
├─ Review sent items (internal phishing from this account?)
├─ Check OAuth app consents (malicious apps added?)
├─ Review mailbox delegation changes
├─ Check for eDiscovery searches or mail export
├─ Review admin role assignments (privilege escalation?)
└─ Timeline the compromise (first attacker action → last)

PHASE 3: REMEDIATE
├─ Remove all malicious inbox rules
├─ Revoke malicious OAuth app consents
├─ Remove unauthorized mailbox delegates
├─ Re-enroll MFA (new device, new method)
├─ Notify all recipients of phishing sent from this account
├─ If data was exfiltrated: Engage legal/compliance
└─ Restore mailbox to pre-compromise state if needed

PHASE 4: MONITOR
├─ Enable enhanced sign-in monitoring for 30 days
├─ Review for any additional compromised accounts
├─ Monitor for credential reuse on other platforms
└─ Check dark web for leaked credentials
```

---

## 15. Email Security Metrics for SOC

| Metric | Description | Target |
|--------|-------------|--------|
| **Mean Time to Detect (MTTD)** | Time from email delivery to alert | < 5 minutes |
| **Mean Time to Respond (MTTR)** | Time from alert to containment | < 30 minutes |
| **Phishing Report Rate** | % of users who report phishing | > 20% |
| **Click Rate** | % of users who click phishing links | < 5% |
| **False Positive Rate** | % of alerts that are FP | < 15% |
| **Email Purge Time** | Time to remove threat from all mailboxes | < 15 minutes |
| **Detection Coverage** | % of phishing caught by automation | > 95% |
| **User Report vs Auto-Detection** | Ratio of user reports to auto-caught | Track trend |
| **Repeat Clicker Rate** | Users who click phishing more than once | < 2% |
| **DMARC Adoption** | % of org domains with DMARC p=reject | 100% goal |

---

## 16. Quick Reference — Common Investigation Commands

### PowerShell (Exchange Online / M365)

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline -UserPrincipalName admin@company.com

# Search for specific email by Message-ID
Get-MessageTrace -MessageId "<message-id@domain.com>" -StartDate (Get-Date).AddDays(-10) -EndDate (Get-Date)

# Search by sender
Get-MessageTrace -SenderAddress "attacker@domain.com" -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date)

# Check inbox rules for a user
Get-InboxRule -Mailbox "user@company.com" | Format-List Name, Description, Enabled, ForwardTo, RedirectTo, DeleteMessage

# Remove malicious inbox rule
Remove-InboxRule -Mailbox "user@company.com" -Identity "Rule Name" -Confirm:$false

# Purge emails from mailboxes (Compliance Search)
New-ComplianceSearch -Name "Phishing Purge" -ExchangeLocation All -ContentMatchQuery 'subject:"malicious subject" AND received:2026-04-08'
Start-ComplianceSearch -Identity "Phishing Purge"
New-ComplianceSearchAction -SearchName "Phishing Purge" -Purge -PurgeType SoftDelete

# Check mail forwarding rules
Get-Mailbox -Identity "user@company.com" | Select ForwardingAddress, ForwardingSmtpAddress, DeliverToMailboxAndForward

# Get mailbox audit log
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-7) -EndDate (Get-Date) -UserIds "user@company.com" -Operations "New-InboxRule","Set-InboxRule","UpdateInboxRules"
```

### Linux CLI Tools

```bash
# Calculate file hash
sha256sum suspicious_file.docm
md5sum suspicious_file.docm

# Extract strings from attachment
strings suspicious_file.exe | grep -i "http\|powershell\|cmd\|invoke"

# Analyze Office document macros
olevba suspicious.docm
oleid suspicious.docm

# Check domain DNS records
dig TXT _dmarc.domain.com
dig TXT domain.com    # SPF record
dig MX domain.com

# WHOIS lookup
whois suspicious-domain.com

# Decode Base64 content
echo "base64string" | base64 -d
```

---

*Continued in Part 4 → Real-World Scenarios, Interview Q&A, and Quick Reference Card*
