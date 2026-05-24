# 🔍 Reactive SOC Investigation Guide — Part 2: Network, Cloud, Email & Insider Threat Deep Dives

---

# PART 2: NETWORK, CLOUD/SAAS, EMAIL ALERT INVESTIGATIONS & MASTER CHECKLISTS

---

## 6. Deep-Dive: Network Alert Investigation

### 6.1 C2 / Beaconing Alert

**Alert Example:** "Potential C2 beaconing — host WKST-HR-017 connecting to `cdn-update[.]xyz` every 60-65 seconds for 6 hours"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: VALIDATE THE BEACONING PATTERN (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Pull proxy/firewall connection logs for the host + domain
□ Plot the connection intervals on a timeline
□ Calculate standard deviation of intervals:
   → Low jitter (±2-5 sec) = automated C2 beacon → 🔴
   → High jitter (±30+ sec) = possibly legitimate polling
   → Exact same interval = scripted / cron job (check if legit)

□ Check data sizes per connection:
   → Small POST (check-in) → larger GET (commands) = C2 pattern → 🔴
   → Consistent small sizes = heartbeat/monitoring
   → Large downloads only = could be CDN/update service

□ Check connection duration:
   → 6+ hours continuous = persistent implant → 🔴
   → Brief burst then stops = might be legitimate retry loop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: INVESTIGATE THE DOMAIN/IP (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ WHOIS lookup on cdn-update[.]xyz:
   → Domain age < 30 days → 🔴 HIGH RISK
   → Privacy-protected registrant → 🟠
   → Registrar known for abuse (cheap bulk registration) → 🔴

□ VirusTotal domain report:
   → Any AV vendors flag as malicious?
   → What files have communicated with this domain?
   → What subdomains exist?

□ URLScan.io:
   → What content is served? (empty page, fake site, parking page)
   → What technologies are running?

□ Passive DNS (SecurityTrails, RiskIQ):
   → What IPs has this domain resolved to historically?
   → Are those IPs associated with other malicious domains?
   → IP hosted on VPS (DigitalOcean, Linode, Vultr) → 🟠

□ Shodan / Censys on the IP:
   → What services are running? (Cobalt Strike default profile?)
   → Open ports matching C2 frameworks?
   → TLS certificate: self-signed? Default Cobalt Strike cert?

□ JA3/JA3S fingerprint (if available):
   → Match against known C2 framework JA3 hashes
   → Cobalt Strike, Metasploit, Sliver all have known JA3s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: ENDPOINT INVESTIGATION (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What process is making the connections?
   → EDR / Sysmon Event 3: SourceImage for network connections
   → Legitimate process? (chrome.exe, outlook.exe) or unusual?
   → If legitimate name (svchost.exe): verify path and hash
   → If unknown binary: file analysis (hash, signing, origin)

□ Check for process injection:
   → Is a legitimate process (explorer.exe) making unusual connections?
   → Sysmon Event 8: CreateRemoteThread into that process?
   → Memory-only implant? (no file on disk)

□ Check what ELSE happened on this endpoint:
   → Any discovery commands (whoami, net user)?
   → Any credential access (LSASS)?
   → Any persistence installed?
   → Any lateral movement from this host?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  CONFIRM TP IF:
  ✓ Regular beacon interval with low jitter
  ✓ Domain is newly registered / known malicious
  ✓ JA3 matches known C2 framework
  ✓ Process making connections is injected or suspicious
  ✓ Post-beacon: discovery/credential access activity observed

  CONFIRM FP IF:
  ✓ Domain belongs to legitimate SaaS (telemetry, monitoring)
  ✓ Software update check pattern (known software, signed)
  ✓ IT confirms: monitoring agent heartbeat
  ✓ Domain age > 2 years with clean reputation
  ✓ Process is verified legitimate with correct hash/path
```

---

### 6.2 Suspicious DNS Activity Alert

**Alert Example:** "DNS anomaly — host SRV-DB-003 querying 400+ unique subdomains of `data-sync[.]top` with long encoded labels"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: CLASSIFY THE DNS ANOMALY (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Pull DNS query logs for this host + domain:
   → Query types: A, AAAA, TXT, NULL, CNAME, MX?
   → TXT or NULL queries = 🔴 (commonly used for DNS tunneling)
   → Subdomain label length > 50 chars = 🔴 (data encoded in query)

□ Classify the behavior:
   SCENARIO A: DNS TUNNELING (data exfil/C2) → 🔴
     Indicators: Long subdomains, high entropy, TXT records,
     high query rate, encoded data in labels

   SCENARIO B: DGA (Domain Generation Algorithm) → 🔴
     Indicators: Many NXDOMAIN responses, random-looking domains,
     algorithmic pattern in domain names

   SCENARIO C: Legitimate high DNS volume → 🟢
     Indicators: CDN resolution, load balancing, service mesh,
     known cloud service subdomains

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: ANALYZE THE DATA (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Decode subdomain labels:
   → Try Base64 decode → readable data = data exfil → 🔴
   → Try Base32/Hex decode
   → High Shannon entropy (>3.5) = encoded data → 🔴
   → Readable strings = might be legitimate (but unusual)

□ Check query responses:
   → Are TXT responses also long/encoded? = C2 commands → 🔴
   → All NXDOMAIN? = DGA waiting for activation → 🔴
   → Valid A/CNAME responses? = possibly legitimate

□ Calculate data volume:
   → (avg subdomain length × queries) = data exfiltrated
   → 400 queries × 60 chars × ~0.75 bytes = ~18KB (commands/small exfil)
   → Thousands of queries = larger data exfil attempt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: ENDPOINT + NETWORK CORRELATION (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Critical: This is a DATABASE SERVER (SRV-DB-003) → 🔴🔴
   → Data exfil from a DB server is worst-case scenario
   → Check what database is hosted and its sensitivity level

□ What process is generating DNS queries?
   → Expected: database engine (sqlservr.exe) resolving clients
   → Suspicious: powershell.exe, unknown binary, python, dnscat

□ Check for related indicators:
   → File access logs on the DB server
   → Database query logs (unusual bulk SELECT queries?)
   → Any data export operations (BCP, mysqldump)?
   → Network connections beyond DNS?

□ RESPOND IF TP:
   → Sinkhole the domain at DNS resolver
   → Isolate SRV-DB-003 from network
   → Capture the DNS tunneling tool
   → Assess what data was potentially exfiltrated
   → THIS IS A DATA BREACH → notify Legal and CISO
   → Full database audit (what was accessed?)
```

---

## 7. Deep-Dive: Cloud / SaaS Alert Investigation

### 7.1 Suspicious OAuth / App Consent Alert

**Alert Example:** "High-risk OAuth app consent — user mike.johnson granted 'Mail.ReadWrite, Files.ReadWrite.All' to app 'Productivity Helper' from publisher 'Unknown'"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: ANALYZE THE APP CONSENT (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What permissions were granted?
   → Mail.ReadWrite = read/modify ALL email → 🔴
   → Files.ReadWrite.All = access ALL OneDrive/SharePoint → 🔴
   → User.Read = basic profile only → 🟢 (benign)
   → Directory.ReadWrite.All = modify AD → 🔴 CRITICAL

□ Who is the publisher?
   → "Unknown" or unverified publisher → 🔴
   → Known vendor (Microsoft, Google, Salesforce) → 🟢
   → Publisher name mimics known brand → 🔴 (impersonation)

□ App registration details (Azure AD > Enterprise Apps):
   → When was the app registered?
   → Multi-tenant or single-tenant?
   → How many users in your org have consented?
   → App homepage URL — does it look legitimate?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: INVESTIGATE THE USER (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ How did mike.johnson encounter this app?
   → Check email for OAuth consent phishing (common attack vector)
   → Was there a phishing email with "Click to authorize app"?
   → Did user click a link leading to Microsoft consent screen?

□ Check sign-in logs around consent time:
   → Was there an anomalous login before consent?
   → Different IP/location than usual?

□ Check if user was socially engineered:
   → Contact user: "Did you intentionally install Productivity Helper?"
   → If NO / unsure → 🔴 consent phishing attack

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: CHECK APP ACTIVITY POST-CONSENT (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Azure AD audit logs → filter by App ID:
   → Has the app read email? How many messages?
   → Has the app accessed OneDrive/SharePoint files?
   → Has the app sent emails on behalf of the user?
   → Has the app modified mailbox rules?

□ If the app DID access data → 🔴 CONFIRMED TP:
   → What data was accessed/exfiltrated?
   → Were emails forwarded externally?
   → Were files downloaded in bulk?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: RESPOND IF TP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ REVOKE the app consent immediately
   → Azure AD > Enterprise Apps > Permissions > Revoke
□ Remove the app from the tenant
□ Reset the user's password and MFA
□ Revoke all user sessions
□ Audit what data the app accessed
□ Block non-verified app consents via policy:
   → Azure AD > User Settings > App Registrations > "No" for user consent
   → Require admin approval for all app consents
□ Check if other users also consented to this app
□ Report the app to Microsoft (if hosted on Azure AD)
```

### 7.2 Cloud IAM / Privilege Change Alert

**Alert Example:** "User added to Global Administrator role — target: svc_helpdesk@corp.com, added by: admin@corp.com at 11:45 PM"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: ANALYZE THE CHANGE (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What role was assigned?
   → Global Administrator = highest privilege → 🔴 ALWAYS INVESTIGATE
   → Billing Admin = financial access → 🟠
   → Helpdesk Admin = password reset → 🟡 (for helpdesk user, maybe ok)

□ svc_helpdesk as Global Admin → 🔴🔴
   → Helpdesk service account NEVER needs Global Admin
   → This is either a mistake or malicious privilege escalation

□ Timing: 11:45 PM → outside business hours → 🔴

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: VERIFY THE ADMIN (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Is admin@corp.com a legitimate Global Admin?
□ Check admin@corp.com's sign-in logs:
   → Where did they log in from at 11:45 PM?
   → Known device? Known IP? Known location?
   → Was MFA completed?
   → Any impossible travel or anomalous access?

□ Contact admin@corp.com out-of-band:
   → "Did you add svc_helpdesk to Global Admin at 11:45 PM?"
   → If YES → ask for justification and change management ticket
   → If NO → admin's account is COMPROMISED → 🔴 CRITICAL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: CHECK POST-ESCALATION ACTIVITY (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What did svc_helpdesk do WITH Global Admin rights?
   → Create new admin accounts?
   → Modify conditional access policies?
   → Disable MFA for accounts?
   → Access Exchange admin center?
   → Modify mail flow rules (org-wide forwarding)?
   → Create new OAuth apps with admin consent?
   → Access Azure subscriptions or resources?
   → Export data from admin portals?

□ If ANY of the above → 🔴 CONFIRMED TP — ACTIVE COMPROMISE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: RESPOND IF TP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Remove svc_helpdesk from Global Admin IMMEDIATELY
□ Disable svc_helpdesk account
□ If admin@corp.com was compromised:
   → Reset password and MFA
   → Revoke sessions
   → Audit all actions by admin@corp.com in last 30 days
□ Audit ALL Global Admin role assignments
□ Review all changes made by svc_helpdesk as Global Admin
□ Revert any unauthorized changes (policies, rules, apps)
□ Implement PIM (Privileged Identity Management):
   → Just-in-time admin access
   → Require approval for Global Admin activation
   → Set maximum activation duration
□ Enable alerts for ALL critical role assignments
```

---

## 8. Deep-Dive: Insider Threat Alert Investigation

### 8.1 Data Exfiltration / DLP Alert

**Alert Example:** "DLP policy violation — user sarah.chen downloaded 2,400 files from SharePoint Engineering site in 45 minutes, then uploaded 1.8GB to personal Google Drive"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: ASSESS THE ACTIVITY (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Volume assessment:
   → 2,400 files in 45 min = ~53 files/minute → 🔴 AUTOMATED
   → 1.8 GB to personal cloud → 🔴 DATA LEAVING ORGANIZATION
   → Engineering site = likely intellectual property → 🔴

□ Is sarah.chen authorized to access Engineering SharePoint?
   → YES → access is legitimate, but DATA TRANSFER is not
   → NO → unauthorized access + exfil → DOUBLY SUSPICIOUS

□ Check DLP classification of files:
   → Classified as Confidential/Restricted? → 🔴
   → Source code files? Design documents? → 🔴
   → Public/Internal only? → 🟡 (still a policy violation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: ESTABLISH USER CONTEXT (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ WHO is sarah.chen?
   → Role: Engineer, Manager, Contractor?
   → Department: Engineering (relevant to data accessed?)
   → Employment status: Active? Notice period? PIP?

□ HR INTELLIGENCE (coordinate with HR/Legal):
   → Has sarah.chen submitted resignation? → 🔴🔴
   → Is sarah.chen on a performance improvement plan? → 🔴
   → Is sarah.chen interviewing elsewhere? (if known) → 🔴
   → Any recent disciplinary actions? → 🟠
   → None of the above → 🟡 (but still investigate)

□ Historic behavior:
   → Has sarah.chen downloaded large volumes before?
   → Is bulk download part of their normal work pattern?
   → Prior DLP violations?
   → Check last 30/60/90 days of activity for trending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: ANALYZE THE FULL ACTIVITY CHAIN (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ BEFORE the download:
   → Any searches for specific file types or keywords?
   → SharePoint audit: search queries run by the user?
   → Did they browse systematically through folders?

□ DURING the download:
   → Was OneDrive Sync used? Browser download? API?
   → Sync client = might be accidental mass sync
   → Browser/API download = deliberate selection

□ AFTER the download → TRANSFER:
   → Uploaded to personal Google Drive → 🔴
   → Copied to USB drive? (check endpoint DLP) → 🔴
   → Emailed to personal email? → 🔴
   → Uploaded to other cloud? (Dropbox, WeTransfer) → 🔴
   → Printed large volumes? → 🟠

□ OTHER suspicious behavior:
   → Accessing systems/files they don't normally access?
   → Working at unusual hours?
   → Using personal devices?
   → Clearing browser history or app logs?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: VERDICT AND RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  CONFIRM TP — INSIDER THREAT IF:
  ✓ Mass file download + transfer to personal cloud
  ✓ Files contain confidential/IP data
  ✓ User is departing / under performance review
  ✓ Activity is outside normal work patterns
  ✓ Deliberate circumvention of DLP controls

  POSSIBLE FP IF:
  ✓ OneDrive sync misconfiguration (accidental full sync)
  ✓ Legitimate work-from-home needing offline copies
  ✓ IT-approved backup or migration activity
  ✓ User explains valid business reason
  → STILL requires manager + HR + Legal review

  RESPOND:
  □ DO NOT alert the user initially (preserve investigation)
  □ Notify Legal and HR immediately
  □ Preserve ALL evidence (audit logs, DLP logs, email)
  □ Legal decides on approach (interview, monitoring, etc.)
  □ Consider: restrict access to sensitive SharePoint sites
  □ Consider: block personal cloud storage uploads
  □ If confirmed malicious: engage Legal for employment action
  □ If data contained trade secrets: consider legal action
  □ Document for potential litigation hold
```

---

## 9. Master SOC Investigation Checklists

### 9.1 The Universal 5-Minute Triage Checklist

**Use this for EVERY alert to quickly determine if deep investigation is needed:**

```
┌───────────────────────────────────────────────────────────────────────┐
│            5-MINUTE INITIAL TRIAGE CHECKLIST                          │
│           (Complete before deciding to deep-dive)                     │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  □ 1. READ THE ALERT: What exactly fired and why?                    │
│  □ 2. CHECK THE USER: Who is involved? Role? Privileged?             │
│  □ 3. CHECK THE ASSET: What system? Criticality? Server/Workstation? │
│  □ 4. CHECK THE TIME: Business hours? Change window? Weekend?        │
│  □ 5. CHECK HISTORY: Has this alert fired before? Known FP pattern?  │
│  □ 6. CHECK SEVERITY: Critical/High = deep dive immediately          │
│  □ 7. FIRST INSTINCT: Does this FEEL like a real attack?             │
│                                                                       │
│  DECISION:                                                            │
│  → If 3+ red flags from above → DEEP DIVE (proceed with full invest)│
│  → If appears routine with known FP pattern → Quick verify, then FP  │
│  → If unsure → DEEP DIVE (always err on side of investigation)       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 9.2 Investigation Documentation Template

```
═══════════════════════════════════════════════════════════
              INVESTIGATION DOCUMENTATION
═══════════════════════════════════════════════════════════

TICKET ID:          INC-YYYY-#####
ANALYST:            [Your Name]
DATE/TIME STARTED:  [Timestamp]
ALERT SOURCE:       [SIEM Rule / EDR Alert / User Report / TI Feed]
ALERT NAME:         [Exact alert name/rule]
SEVERITY:           [Critical / High / Medium / Low]
SLA TARGET:         [Time to respond based on severity]

───────────────────────────────────────────────────────────
AFFECTED ENTITIES
───────────────────────────────────────────────────────────
User(s):    [username, domain, role]
Host(s):    [hostname, IP, OS, criticality]
Service(s): [application, service, cloud resource]

───────────────────────────────────────────────────────────
INVESTIGATION TIMELINE
───────────────────────────────────────────────────────────
[HH:MM] Alert received, initial triage started
[HH:MM] [Action taken — e.g., "Pulled process tree from EDR"]
[HH:MM] [Finding — e.g., "PowerShell decoded to download cradle"]
[HH:MM] [Action taken — e.g., "Checked VirusTotal for domain"]
[HH:MM] [Finding — e.g., "Domain registered 3 days ago"]
[HH:MM] Verdict determined
[HH:MM] Response actions initiated

───────────────────────────────────────────────────────────
EVIDENCE COLLECTED
───────────────────────────────────────────────────────────
□ Process tree screenshot / export
□ SIEM query results (with query text)
□ EDR timeline export
□ IOCs extracted (IPs, domains, hashes)
□ Email headers (if email-related)
□ Sandbox report URL
□ VirusTotal links
□ User confirmation (phone/email)

───────────────────────────────────────────────────────────
VERDICT
───────────────────────────────────────────────────────────
□ TRUE POSITIVE — Confirmed threat, response required
□ BENIGN TRUE POSITIVE — Correct detection, authorized activity
□ FALSE POSITIVE — No threat, rule tuning recommended
□ INCONCLUSIVE — Escalated to [L3 / IR / Threat Intel]

Confidence Level: [High / Medium / Low]
MITRE ATT&CK:     [Tactic] — [Technique ID + Name]
Justification:    [2-3 sentences explaining your verdict]

───────────────────────────────────────────────────────────
RESPONSE ACTIONS TAKEN
───────────────────────────────────────────────────────────
□ Host isolated                    □ Account disabled
□ IOCs blocked (firewall/proxy)    □ Password reset
□ Malware quarantined             □ Sessions revoked
□ Email purged                    □ Rule tuning requested
□ IOCs shared to TI platform      □ Escalated to IR team
□ User notified                   □ No action required

───────────────────────────────────────────────────────────
FOLLOW-UP / RECOMMENDATIONS
───────────────────────────────────────────────────────────
[What should be done next? New detections? Policy changes?]

═══════════════════════════════════════════════════════════
```

### 9.3 Alert-Specific Quick Reference: TP vs FP Cheat Sheet

| Alert Type | #1 Question to Ask | TP Pattern | FP Pattern |
|------------|-------------------|------------|------------|
| **Encoded PowerShell** | What does the decoded command do? | Download cradle, C2 beacon, AMSI bypass | SCCM deployment, IT automation script |
| **Malware File** | What's the VT score + did it execute? | 10+ VT, executed, made network calls | Legit software, heuristic-only detection |
| **Impossible Travel** | What happened AFTER the suspicious login? | Inbox rules, OAuth grants, mass download | User VPN, mobile handoff, geo inaccuracy |
| **Brute Force** | Did any account get successfully compromised? | Failures → success → post-compromise activity | Cached creds, misconfigured service |
| **Lateral Movement** | Why is this host connecting to that host? | Workstation → server admin shares → multi-hop | IT admin from jump box, SCCM agent push |
| **C2 Beacon** | Is the domain new + is the interval regular? | New domain, low-jitter beacon, VPS hosting | SaaS heartbeat, monitoring agent, update check |
| **DNS Anomaly** | Is data encoded in subdomain labels? | Encoded labels, TXT queries, high entropy | CDN lookups, service mesh, cloud endpoints |
| **OAuth Consent** | What permissions + is publisher verified? | Mail.ReadWrite, unknown publisher, consent phish | Microsoft verified app, minimal permissions |
| **Privilege Change** | Did the admin confirm + was it after-hours? | Unauthorized role assignment, no change ticket | Approved change, documented request |
| **Data Exfil/DLP** | Is the user departing + is data sensitive? | Mass download → personal cloud, departing employee | OneDrive sync, approved backup |
| **Account Created** | Was it created through normal provisioning? | Manual creation outside HR workflow → 🔴 | HR onboarding, IT provisioning ticket |
| **Log Cleared** | Was it on a critical system (DC/Server)? | Security log cleared on DC at night → 🔴 | Log rotation, disk space management |

---

### 9.4 SOC Analyst Investigation Toolkit — Tools Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **VirusTotal** | File/URL/IP/domain reputation | Every alert with IOCs |
| **AbuseIPDB** | IP abuse reporting and reputation | External IP investigation |
| **Shodan / Censys** | Internet-facing service discovery | C2 IP infrastructure analysis |
| **URLScan.io** | Safe URL rendering and analysis | Suspicious URLs |
| **WHOIS** | Domain registration info | New/suspicious domains |
| **Any.Run / Hybrid Analysis** | Malware sandboxing | Suspicious files |
| **CyberChef** | Data decoding, transformation | Encoded commands, Base64 |
| **MXToolbox** | Email/DNS/blacklist checks | Email investigations |
| **Have I Been Pwned** | Credential exposure check | Account compromise |
| **MITRE ATT&CK Navigator** | Technique mapping and coverage | Mapping findings to ATT&CK |

---

*End of Reactive SOC Investigation Guide (Parts 1-2). This guide provides deep-dive investigation procedures for every major alert type, TP determination frameworks, evidence collection standards, and comprehensive SOC analyst checklists.*
