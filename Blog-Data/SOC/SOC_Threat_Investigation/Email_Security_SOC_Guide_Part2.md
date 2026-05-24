# 📧 Email Security SOC Guide — Part 2: Alert Triage, TP vs FP Framework

---

# PART 2: ALERT TRIAGE & TP vs FP DECISION FRAMEWORK

---

## 6. Email Alert Triage Workflow (L2 SOC Analyst)

### 6.1 Standard Investigation Workflow

```
┌───────────────────────────────────────────────────────────────────┐
│                    EMAIL ALERT TRIAGE WORKFLOW                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. ALERT INTAKE                                                  │
│     ├─ Review alert source (SEG, SIEM, user report, phishing sim)│
│     ├─ Capture alert metadata (severity, category, timestamp)     │
│     └─ Check for related/duplicate alerts                        │
│                                                                   │
│  2. INITIAL ASSESSMENT (5-min quick look)                        │
│     ├─ Who sent it? (From, Return-Path, sending IP)              │
│     ├─ Who received it? (To, CC, BCC, distribution lists)        │
│     ├─ What's the subject/content? (Lure theme, urgency cues)    │
│     ├─ Authentication results? (SPF/DKIM/DMARC)                 │
│     └─ Any attachments or URLs?                                  │
│                                                                   │
│  3. DEEP ANALYSIS                                                 │
│     ├─ Full header analysis                                      │
│     ├─ Sender reputation & domain age check                      │
│     ├─ URL analysis (defanged, deobfuscated, sandboxed)          │
│     ├─ Attachment analysis (hash, sandbox, VirusTotal)           │
│     ├─ Content analysis (language, branding, social engineering) │
│     └─ Cross-reference threat intelligence                       │
│                                                                   │
│  4. VERDICT DETERMINATION                                        │
│     ├─ True Positive (TP) → Containment & Remediation            │
│     ├─ Benign True Positive (BTP) → Suspicious but authorized    │
│     ├─ False Positive (FP) → Release & Tune                      │
│     └─ False Negative (FN) → Retroactive hunt & remediate        │
│                                                                   │
│  5. RESPONSE ACTIONS                                              │
│     ├─ Block sender/domain/IP                                    │
│     ├─ Remove email from all mailboxes (purge/TRAP/ZAP)          │
│     ├─ Reset credentials if clicked/compromised                  │
│     ├─ Isolate endpoint if malware executed                      │
│     ├─ Submit IOCs to threat intel platform                      │
│     └─ Document & close ticket                                   │
│                                                                   │
│  6. POST-INCIDENT                                                 │
│     ├─ Update detection rules                                    │
│     ├─ Conduct threat hunting for similar emails                 │
│     ├─ User awareness notification                               │
│     └─ Lessons learned / metrics update                          │
└───────────────────────────────────────────────────────────────────┘
```

### 6.2 Critical Questions During Investigation

| Phase | Key Questions |
|-------|--------------|
| **Sender** | Is the sender internal or external? Is the domain legitimate or lookalike? Was the account compromised? What is the domain age? |
| **Recipient** | Is the recipient a high-value target (executive, finance, IT admin)? How many recipients? Is this a targeted or mass campaign? |
| **Content** | Does the email create urgency/fear? Is there brand impersonation? Does the language match expected communication? |
| **URLs** | Where does the URL redirect? Is URL shortening used? Does the landing page mimic a login portal? Is it behind CAPTCHA? |
| **Attachments** | What file type? Does it contain macros? What's the file hash? Does it match known malware signatures? |
| **Delivery** | Was it delivered or quarantined? Did ZAP/TRAP remove it post-delivery? Did the user interact with it? |
| **Context** | Is this part of a larger campaign? Have we seen this IOC before? Does it correlate with any ongoing incidents? |

---

## 7. True Positive (TP) vs False Positive (FP) Decision Framework

### 7.1 TP vs FP Definitions

| Verdict | Definition | Example |
|---------|------------|---------|
| **True Positive (TP)** | Alert correctly identified a real threat | Phishing email with credential harvesting URL correctly blocked |
| **False Positive (FP)** | Alert triggered on legitimate/benign email | Legitimate invoice from vendor flagged as phishing |
| **True Negative (TN)** | Legitimate email correctly allowed | Normal business email delivered successfully |
| **False Negative (FN)** | Real threat missed by security controls | Phishing email bypassed SEG and reached inbox |
| **Benign True Positive (BTP)** | Alert is technically correct but activity is authorized | Penetration test phishing simulation flagged |

### 7.2 Comprehensive TP Indicators

#### 🔴 Strong TP Indicators (High Confidence)

| Category | Indicator | Why It Matters |
|----------|-----------|----------------|
| **Sender** | Domain registered < 30 days ago | Attackers register fresh domains for campaigns |
| **Sender** | Lookalike/typosquat domain (e.g., `micr0soft.com`) | Classic impersonation technique |
| **Sender** | SPF=Fail, DKIM=Fail, DMARC=Fail | Email authentication completely failed |
| **Sender** | Sending IP on known blocklists | Infrastructure associated with malicious activity |
| **Sender** | Display name mismatch with email address | "Microsoft Support" \<support@randomdomain.xyz\> |
| **URL** | URL redirects to credential harvesting page | Designed to steal login credentials |
| **URL** | Known malicious URL in threat intel feeds | Previously reported as malicious |
| **URL** | URL uses URL shortener + redirect chain | Evasion technique to hide true destination |
| **URL** | Landing page mimics legitimate login portal | Brand impersonation for credential theft |
| **Attachment** | File hash matches known malware on VirusTotal | Previously identified malware sample |
| **Attachment** | Contains malicious macros (VBA, PowerShell) | Weaponized document |
| **Attachment** | Password-protected archive with executable inside | Evasion of security scanning |
| **Attachment** | .iso, .img, .vhd files (MOTW bypass) | Mark-of-the-Web bypass technique |
| **Content** | Urgency + threat of account closure/legal action | Social engineering pressure tactics |
| **Content** | Request for credentials, PII, or financial data | Data harvesting attempt |
| **Content** | Mismatch between claimed sender and content origin | Spoofing evidence |
| **Behavior** | User clicked link and credentials were entered | Confirmed compromise |
| **Behavior** | Post-click: new inbox rules, forwarding rules created | Account takeover indicators |
| **Behavior** | Post-click: impossible travel login detected | Compromised credentials in use |

#### 🟡 Medium Confidence TP Indicators

| Indicator | Context |
|-----------|---------|
| Email from free email provider claiming to be business | Could be legitimate for small businesses |
| Generic greeting ("Dear Customer") in targeted context | Could be mass marketing |
| Suspicious attachment type (.js, .vbs, .scr, .lnk) | Rarely used in legitimate business |
| URL with excessive subdomains or IP-based URL | Evasion technique but some legitimate services do this |
| Email sent outside business hours from internal domain | Could be remote worker in different timezone |
| Reply-to differs from From address | Some legitimate use cases exist (mailing lists) |

### 7.3 Comprehensive FP Indicators

#### 🟢 Strong FP Indicators (High Confidence)

| Category | Indicator | Why It's Likely FP |
|----------|-----------|-------------------|
| **Sender** | Known trusted vendor/partner domain | Established business relationship |
| **Sender** | SPF=Pass, DKIM=Pass, DMARC=Pass | Full authentication verified |
| **Sender** | Domain age > 1 year with good reputation | Established domain |
| **Sender** | Consistent sending patterns from this sender | Not anomalous behavior |
| **URL** | URL resolves to known legitimate service | Office 365, Google, DocuSign, etc. |
| **URL** | URL matches known SaaS platform patterns | Legitimate business tools |
| **Attachment** | Clean on VirusTotal (0 detections, known hash) | Not flagged by any AV engine |
| **Attachment** | File type matches expected business content | .pdf invoice from known vendor |
| **Content** | Expected communication matching business context | Scheduled report, newsletter |
| **Content** | Part of ongoing legitimate email thread | Pre-existing conversation |
| **Context** | User confirms they were expecting this email | Legitimate business transaction |
| **Context** | Matches known marketing/newsletter pattern | Opted-in communications |
| **Technical** | SEG rule triggered on keyword heuristic only | Overly broad detection rule |
| **Technical** | Quarantined due to bulk sending but content is clean | Marketing email misclassified |

#### 🟡 FP Scenarios Requiring Careful Validation

| Scenario | Investigation Steps |
|----------|-------------------|
| Legitimate email flagged by new detection rule | Review rule logic, check for overmatching |
| Encrypted attachment blocked by policy | Verify sender, request unencrypted version |
| Marketing email from new vendor platform | Verify vendor relationship, check headers |
| Internal email flagged due to external relay | Verify email flow, check for misconfigured routing |
| Auto-forwarded email flagged as external threat | Check forwarding rules, verify original sender |
| Calendar invite with external URL flagged | Verify meeting organizer, check URL destination |

### 7.4 TP vs FP Decision Tree

```
                        📧 Email Alert Received
                                │
                    ┌───────────┴───────────┐
                    │  Check Authentication  │
                    │  (SPF/DKIM/DMARC)      │
                    └───────────┬───────────┘
                         │            │
                    ALL FAIL      ANY PASS
                         │            │
                   🔴 High Risk   ┌───┴───┐
                         │        │       │
                         ▼        ▼       │
                   Check Sender   Check   │
                   Domain Age    Sender   │
                         │      Known?    │
                    < 30 days    │    │    │
                         │     YES   NO   │
                    🔴 Likely    │    │    │
                       TP       │    ▼    │
                         │      │  Check  │
                         │      │ Content │
                         │      │    │    │
                         │      │   ┌┴┐   │
                         │      │  Sus Normal
                         │      │   │    │
                         │      │  🟡    🟢
                         │      │ Invest. Likely
                         │      │ More    FP
                         │      │
                         │      ▼
                         │   Check URL/
                         │   Attachment
                         │      │
                         │   ┌──┴──┐
                         │  Clean  Malicious
                         │   │      │
                         │  🟢     🔴
                         │  FP     TP
                         ▼
                    Deep Analysis
                    Required
```

### 7.5 Alert-Specific TP/FP Analysis

#### Phishing Alert

| Check | TP Signal | FP Signal |
|-------|-----------|-----------|
| Sender domain | Lookalike, newly registered | Known vendor domain with history |
| Authentication | SPF/DKIM/DMARC fail | All pass with alignment |
| URL destination | Fake login page, IP-based | Known legitimate service |
| Content urgency | "Act now or account suspended" | Normal business tone |
| Branding | Slightly off logos/formatting | Professional, matches real brand |
| Recipients | Mass distribution, random targets | Expected business distribution |

#### BEC Alert

| Check | TP Signal | FP Signal |
|-------|-----------|-----------|
| Display name | Matches executive but email differs | Legitimate executive email |
| Reply-to | Points to external free email | Same as From address |
| Request type | Wire transfer, gift cards, W-2 | Normal business request |
| Tone | Unusual urgency, secrecy requested | Normal communication style |
| Timing | Sent while executive is traveling/OOO | During normal business hours |
| Previous pattern | First time this type of request | Regular recurring communication |

#### Malware Alert

| Check | TP Signal | FP Signal |
|-------|-----------|-----------|
| File hash | Known malware hash on VT | Clean hash, known software |
| Macro content | Obfuscated VBA, external call | Standard business macro |
| File extension | Double extension (.pdf.exe) | Normal extension for type |
| Sandbox result | Malicious behavior detected | Clean execution |
| Sender context | Unexpected attachment from unknown | Expected file from known sender |
| Password protection | "Password in email body" pattern | Enterprise-standard encryption |

#### Account Compromise / ATO Alert

| Check | TP Signal | FP Signal |
|-------|-----------|-----------|
| Login location | Impossible travel detected | User traveling (confirmed) |
| Inbox rules | New forward-to-external rule | User-configured legitimate rule |
| Sent items | Mass phishing from account | Normal sent activity |
| MFA | MFA challenged and bypassed | Normal MFA approval |
| Password change | Unauthorized password reset | User-initiated reset |
| Login pattern | Login from TOR/VPN exit node | Corporate VPN usage |

---

## 8. Investigation Checklist by Alert Type

### 8.1 Phishing Email Investigation Checklist

```
□ Capture the full email (including headers)
□ Identify sender: From, Return-Path, X-Originating-IP
□ Check SPF/DKIM/DMARC results in Authentication-Results header
□ WHOIS lookup on sender domain (age, registrar, registrant)
□ Check sender IP reputation (AbuseIPDB, VirusTotal, Talos)
□ Analyze all URLs (defang, expand shorteners, check URLScan.io)
□ Analyze all attachments (hash check, sandbox, VirusTotal)
□ Check if email was delivered or quarantined
□ Identify total recipients (scope assessment)
□ Check if any user clicked URLs or opened attachments
□ Check for similar emails in the environment (threat hunting)
□ Cross-reference with threat intelligence feeds
□ Determine verdict: TP / FP / BTP
□ Execute response actions based on verdict
□ Document findings in ticketing system
```

### 8.2 BEC Investigation Checklist

```
□ Verify the claimed sender via out-of-band communication
□ Check email headers for external origin indicators
□ Compare display name vs actual email address
□ Check Reply-To header for mismatch
□ Analyze communication pattern (tone, style, grammar)
□ Check if the real person's account is compromised
□ Review authentication results
□ Check if financial action was requested
□ Check for domain lookalike (homoglyph analysis)
□ Review recent inbox rules on the claimed sender's account
□ Determine if the real person is traveling/unavailable
□ Engage finance team if wire transfer was initiated
□ Document and escalate per BEC response procedure
```

### 8.3 Account Compromise Investigation Checklist

```
□ Review sign-in logs (location, IP, device, time)
□ Check for impossible travel
□ Review MFA logs and challenges
□ Audit inbox rules (forwarding, auto-delete, move)
□ Review sent items for internal/external phishing
□ Check for OAuth app consents
□ Review mailbox delegation changes
□ Check for PowerShell/Graph API access
□ Review password/MFA changes
□ Check for data exfiltration (mail forwarding, eDiscovery)
□ Analyze any emails sent from the compromised account
□ Check Azure AD / Entra ID sign-in risk events
□ Block & revoke sessions
□ Reset password and MFA
□ Remove malicious inbox rules
□ Notify affected recipients of phishing from this account
```

---

*Continued in Part 3 → Advanced Analysis: Headers, URLs, Attachments, IOC Extraction, Playbooks*
