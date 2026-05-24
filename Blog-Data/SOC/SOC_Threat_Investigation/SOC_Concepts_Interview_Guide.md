# 🛡️ SOC Concepts — Complete Interview Guide
> **Goal**: Explain every concept clearly so you can confidently answer in an interview.  
> **Format**: Each topic has a **One-Liner** (quick recall), **Explain Like a Story** (for interviews), **Key Points**, and **Memory Tricks**.

---

## Table of Contents
1. [IOC vs IOA](#1-ioc-vs-ioa)
2. [Threat Intelligence](#2-threat-intelligence)
3. [System Hardening](#3-system-hardening)
4. [Privilege Escalation](#4-privilege-escalation)
5. [Persistence](#5-persistence)
6. [Lateral Movement](#6-lateral-movement)
7. [SANS Incident Response Steps](#7-sans-incident-response-steps)
8. [Types of Logs](#8-types-of-logs)
9. [Protocol Logs](#9-protocol-logs)
10. [Windows Event IDs (Must-Know)](#10-windows-event-ids)
11. [Kerberos Authentication](#11-kerberos-authentication)
12. [SAM & NTLM](#12-sam--ntlm)
13. [Phishing Emails](#13-phishing-emails)
14. [SPF, DKIM & DMARC](#14-spf-dkim--dmarc)
15. [Email Flow](#15-email-flow)
16. [Malicious Activity Indicators](#16-malicious-activity-indicators)
17. [Defensive Measures & Detection](#17-defensive-measures--detection)
18. [NetBIOS & SMB](#18-netbios--smb)
19. [Digital Certificates & HTTPS](#19-digital-certificates--https)
20. [SIEM Solutions](#20-siem-solutions)
21. [EDR vs XDR](#21-edr-vs-xdr)
22. [IDS vs IPS vs Firewall](#22-ids-vs-ips-vs-firewall)
23. [Firewall Types](#23-firewall-types)
24. [Security Definitions (CIA + More)](#24-security-definitions)
25. [Common Vulnerabilities](#25-common-vulnerabilities)
26. [Detection Categories (TP/FP/TN/FN)](#26-detection-categories)
27. [OSI Layer Attacks](#27-osi-layer-attacks)
28. [MITRE ATT&CK Framework](#28-mitre-attck-framework)
29. [Incident Response Playbooks (Scenarios)](#29-incident-response-playbooks)

---

## 1. IOC vs IOA

### One-Liner
> **IOC** = Evidence a crime happened (like bloodstains) | **IOA** = Suspicious behavior happening NOW (like someone picking a lock)

### Interview Answer
"IOCs are **forensic artifacts** — things like malicious IPs, file hashes, or suspicious URLs that tell us a breach **may have already occurred**. IOAs focus on **attacker behavior in real-time** — like unusual PowerShell usage or lateral movement patterns — helping us **detect and stop attacks before damage is done**."

### Quick Comparison Table

| Aspect | IOC (Indicator of Compromise) | IOA (Indicator of Attack) |
|--------|-------------------------------|---------------------------|
| **Focus** | Evidence of an incident | Behavior indicating an attack |
| **When** | Post-incident (reactive) | Real-time (proactive) |
| **Nature** | Static & specific | Dynamic & behavior-based |
| **Examples** | Malicious IPs, file hashes, URLs | Unusual PowerShell downloads, lateral movement patterns |

### 🧠 Memory Trick
> **IOC = "C" for Crime Scene** (after the fact)  
> **IOA = "A" for Active Threat** (happening now)

---

## 2. Threat Intelligence

### One-Liner
> Gathering & analyzing info about threats so you can **predict, prevent, and respond** to attacks.

### Interview Answer
"Threat Intelligence is the process of collecting data from sources like open-source feeds, dark web monitoring, and commercial feeds — then analyzing it to understand attacker **TTPs** (Tactics, Techniques, Procedures). It helps us move from **reactive to proactive** defense."

### Key Benefits
- ⚡ **Faster Response** — know what you're dealing with
- 🎯 **Better Detection** — recognize known threat patterns
- 🧠 **Informed Decisions** — prioritize real risks
- 🛡️ **Risk Mitigation** — strengthen defenses before attacks

### Well-Known Threat Intel Platforms
| Platform | What It Does |
|----------|-------------|
| **VirusTotal** | Scan files/URLs against 70+ AV engines |
| **AbuseIPDB** | Check & report malicious IPs |
| **IBM X-Force** | Threat research & IP reputation |
| **Cisco Talos** | World's largest commercial threat intel team |

### 🧠 Memory Trick
> **"Know Thy Enemy"** — Threat Intel = studying the attacker's playbook before the game starts.

---

## 3. System Hardening

### One-Liner
> **Reducing the attack surface** by removing what's unnecessary and securing what remains.

### Interview Answer
"System hardening is about minimizing vulnerabilities. We **remove unnecessary services and software**, apply **patches regularly**, enforce **strong passwords with MFA**, configure **firewalls and IDS/IPS**, enable **logging**, and **encrypt sensitive data**."

### 6 Steps of Hardening (mnemonic: **R-A-U-N-L-D**)

| Step | Action | Example |
|------|--------|---------|
| **R**emove | Unneeded services & software | Disable FTP if not needed |
| **A**pply | Security patches & updates | Windows Update, WSUS |
| **U**ser controls | Strong passwords, MFA, least privilege | Disable default admin accounts |
| **N**etwork security | Firewalls, IDS/IPS | Block unnecessary ports |
| **L**ogging | Enable system & security logs | Forward to SIEM |
| **D**ata protection | Encryption + Backups | BitLocker, AES-256 |

### 🧠 Memory Trick
> **"RAUNLD"** → Think: "**R**un **A** **U**nified **N**etwork **L**ock**D**own"

---

## 4. Privilege Escalation

### One-Liner
> Attacker goes from **"regular user" → "admin/root"** to gain full control.

### Interview Answer
"Privilege escalation is when an attacker elevates their access level. **Vertical** means going from user to admin. **Horizontal** means accessing another user's resources at the same level. Common methods include exploiting **unpatched software**, **misconfigurations**, **credential theft** (keylogging, pass-the-hash), and **social engineering**."

### Two Types

```
Vertical:   User ──────▲──────► Admin/Root  (going UP)
Horizontal: User A ────►────── User B      (going SIDEWAYS)
```

### Common Methods
1. **Buffer Overflow / Zero-day** — exploit software bugs
2. **Insecure Permissions** — weak file/directory ACLs
3. **Pass-the-Hash** — use stolen password hashes to authenticate
4. **Keylogging** — capture admin credentials via keylogger
5. **Phishing** — trick user into running elevated payload

### Prevention
- ✅ Patch Management
- ✅ Principle of Least Privilege
- ✅ MFA everywhere
- ✅ Secure credential storage

### 🧠 Memory Trick
> **Vertical = Elevator** (going up floors) | **Horizontal = Hallway** (moving between rooms on same floor)

---

## 5. Persistence

### One-Liner
> How attackers **stay inside your system** even after reboots and logouts.

### Interview Answer
"Persistence is about maintaining access. Attackers use **registry autostart keys**, **scheduled tasks**, **rootkits**, **backdoor accounts**, **DLL injection/hijacking**, and **C2 channels (RATs)** to ensure they can always get back in."

### 6 Methods (mnemonic: **A-S-R-U-D-N**)

| Method | How It Works |
|--------|-------------|
| **A**utoStart entries | Registry run keys, startup folder shortcuts |
| **S**cheduled Tasks | Windows Task Scheduler runs malware at intervals |
| **R**ootkits | Hide malware deep in the OS |
| **U**ser accounts | Create hidden backdoor admin accounts |
| **D**LL Injection/Hijacking | Inject malicious code into legit processes |
| **N**etwork-based | RATs + C2 channels for remote control |

### 🧠 Memory Trick
> Think of persistence like a **cockroach** 🪳 — it survives everything and keeps coming back!

---

## 6. Lateral Movement

### One-Liner
> Attacker **moves sideways through the network** from one system to another after the initial compromise.

### Interview Answer
"After compromising one system, attackers use lateral movement to access additional systems. Common techniques include **credential dumping** (Mimikatz), **pass-the-hash**, **pass-the-ticket** (Kerberos), and **remote execution** tools like PsExec, WMI, and RDP."

### 5 Key Techniques

| Technique | Tool/Method |
|-----------|------------|
| Credential Dumping | **Mimikatz**, WCE |
| Pass-the-Hash | Use NTLM hashes without cracking |
| Pass-the-Ticket | Steal Kerberos TGT/TGS tickets |
| Remote Execution | **PsExec**, WMI, RDP, SSH |
| Service Creation | Create malicious services on remote hosts |

### Prevention (mnemonic: **"N-L-M-M-B-E-P-R"**)
1. **N**etwork Segmentation
2. **L**east Privilege
3. **M**onitoring & Logging
4. **M**FA
5. **B**ehavioral Analysis
6. **E**DR
7. **P**atch Management
8. **R**egular Audits & Pen Testing

### 🧠 Memory Trick
> Lateral movement = **"Hopping from room to room"** inside a building you've broken into.

---

## 7. SANS Incident Response Steps

### One-Liner
> **P-I-C-E-R-L-R**: The 7-step playbook every SOC analyst follows during a security incident.

### Interview Answer
"The SANS IR framework has 7 phases: **Preparation** (build the team & tools), **Identification** (detect & triage the alert), **Containment** (stop the bleeding), **Eradication** (remove the root cause), **Recovery** (restore systems), **Lessons Learned** (what went wrong & how to improve), and **Reporting** (document everything)."

### The 7 Steps Explained

```
┌─────────────────────────────────────────────────────┐
│  1. PREPARATION    → Build team, tools, policies    │
│  2. IDENTIFICATION → Detect, alert, triage          │
│  3. CONTAINMENT    → Isolate, stop the spread       │
│  4. ERADICATION    → Remove root cause, patch       │
│  5. RECOVERY       → Restore from backup, validate  │
│  6. LESSONS LEARNED→ Post-incident review           │
│  7. REPORTING      → Internal + External reports    │
└─────────────────────────────────────────────────────┘
```

### 🧠 Memory Trick — Use the story:
> **P**olice **I**dentified the **C**rime, **E**liminated the threat, **R**estored order, **L**earned from it, and **R**eported it.

---

## 8. Types of Logs

### One-Liner
> Logs are the **black box recordings** of your IT environment — without them, you're flying blind.

### The 12 Log Types Every SOC Analyst Must Know

| # | Log Type | What It Captures | Example |
|---|----------|------------------|---------|
| 1 | **System** | OS events: boot, crash, shutdown | Windows Event Viewer |
| 2 | **Application** | App-level events | Apache, Nginx, MySQL logs |
| 3 | **Security** | Auth attempts, access control, policy changes | Login success/failure |
| 4 | **Network** | Traffic flow, routing | NetFlow, sFlow, router logs |
| 5 | **Web Server** | HTTP requests/responses | Apache access & error logs |
| 6 | **Database** | Queries, transactions, errors | SQL query logs |
| 7 | **Email** | Email transactions | SMTP logs, Exchange logs |
| 8 | **Authentication** | Login attempts, MFA events | AD auth logs |
| 9 | **Firewall** | Allowed/blocked traffic | Rule matches, packet logs |
| 10 | **IDS/IPS** | Intrusion alerts | Snort, Suricata alerts |
| 11 | **Endpoint** | Device-level activity | EDR logs, AV scan results |
| 12 | **Audit** | Compliance-related events | Access audits, config changes |

### 🧠 Memory Trick
> Think: **"SANSWNDEFIA"** — or just remember the categories: **System, App, Security, Network, Web, Database, Email, Firewall, IDS, Authentication, Endpoint**

---

## 9. Protocol Logs

### What Each Protocol Log Contains

| Protocol | Key Fields Logged |
|----------|------------------|
| **HTTP/HTTPS** | Timestamp, Client IP, Method (GET/POST), URI, Status Code, User-Agent, Referer |
| **DNS** | Timestamp, Client IP, Query Name, Query Type (A/AAAA/MX), Response Code |
| **SMTP** | Timestamp, Client IP, Sender, Recipient, Message ID, Status Code |
| **FTP** | Timestamp, Client IP, Username, Command (RETR/STOR), File Path, Transfer Size |
| **SSH** | Timestamp, Client IP, Username, Auth Method (password/key), Result, Commands |
| **IMAP/POP3** | Timestamp, Client IP, Username, Command (LOGIN/FETCH), Result |
| **Kerberos** | Timestamp, Client IP, Username, Ticket Type (TGT/Service), Result |

### 🧠 Interview Tip
> "In a SOC investigation, I correlate logs across protocols. For example, a suspicious DNS query → then HTTP traffic to the resolved IP → then SMTP logs showing data exfiltration."

---

## 10. Windows Event IDs

> [!IMPORTANT]
> These are the **MOST ASKED** Event IDs in SOC interviews. Memorize these!

### 🔐 Security Log — Authentication Events

| Event ID | What Happened | Why It Matters |
|----------|--------------|----------------|
| **4624** | ✅ Successful logon | Normal — but check for unusual times/locations |
| **4625** | ❌ Failed logon | Multiple = possible brute force |
| **4648** | Logon with explicit credentials | Could indicate pass-the-hash |
| **4672** | Special privileges assigned | Admin logon — watch for unexpected ones |
| **4720** | User account created | New account by attacker? |
| **4740** | Account locked out | Brute force evidence |

### 👤 Account Management Events

| Event ID | What Happened |
|----------|--------------|
| **4722** | Account enabled |
| **4723** | Password change attempt |
| **4724** | Password reset attempt |
| **4725** | Account disabled |
| **4726** | Account deleted |
| **4732** | Member added to local security group |
| **4738** | Account changed |
| **4767** | Account unlocked |

### ⏰ Scheduled Tasks (Persistence Detection!)

| Event ID | What Happened |
|----------|--------------|
| **4698** | Scheduled task created ⚠️ |
| **4699** | Scheduled task deleted |
| **4700** | Scheduled task enabled |
| **4701** | Scheduled task disabled |

### 🔍 Process & Audit Events

| Event ID | What Happened |
|----------|--------------|
| **4688** | New process created (track malicious executables) |
| **4689** | Process exited |
| **4719** | Audit policy changed ⚠️ |

### ⚡ System Events

| Event ID | What Happened |
|----------|--------------|
| **6005** | Event log service started |
| **6006** | Event log service stopped |
| **6008** | Unexpected shutdown |
| **41** | Kernel-Power: system rebooted without clean shutdown |

### 🧠 Memory Trick for Top 5 Event IDs
> **"4-6-2-4, 4-6-2-5, 4-6-4-8, 4-6-7-2, 4-7-2-0"**  
> → **Success, Fail, ExplicitCreds, AdminPrivs, NewAccount**  
> Think: **"S-F-E-A-N"** = **S**uccessful **F**ailed **E**xplicit **A**dmin **N**ew

---

## 11. Kerberos Authentication

### One-Liner
> Kerberos is a **ticket-based authentication system** — like getting a movie ticket from a box office, then showing it to the usher.

### How Kerberos Works (6 Steps)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   USER   │         │    KDC   │         │  SERVER  │
│ (Client) │         │ (AS+TGS) │         │(Resource)│
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                     │                     │
     │ 1. "I want access"  │                     │
     │ ──────────────────►  │                     │
     │                     │                     │
     │ 2. Here's your TGT  │                     │
     │ ◄──────────────────  │                     │
     │   (encrypted with    │                     │
     │    user's password)  │                     │
     │                     │                     │
     │ 3. TGT + "I need    │                     │
     │    Service X"        │                     │
     │ ──────────────────►  │                     │
     │                     │                     │
     │ 4. Here's Service   │                     │
     │    Ticket (TGS)      │                     │
     │ ◄──────────────────  │                     │
     │                     │                     │
     │ 5. Service Ticket ──────────────────────► │
     │                     │                     │
     │ 6. Access Granted ◄──────────────────────│
     │                     │                     │
```

### 3 Key Components
| Component | Role |
|-----------|------|
| **AS (Authentication Server)** | Verifies identity, issues TGT |
| **TGS (Ticket Granting Server)** | Issues service tickets using TGT |
| **Database** | Stores user credentials |

### ⚔️ Kerberos Attacks (MUST KNOW for interviews)

| Attack | How It Works | Severity |
|--------|-------------|----------|
| **Pass-the-Ticket (PtT)** | Steal a Kerberos ticket and reuse it | 🔴 High |
| **Pass-the-Hash (PtH)** | Use stolen NTLM hash to authenticate | 🔴 High |
| **Overpass-the-Hash** | Use NTLM hash to request Kerberos tickets | 🔴 High |
| **Golden Ticket** | Forge a TGT with domain admin rights using KRBTGT hash | 🔴🔴 Critical |

### 🧠 Memory Trick
> **Golden Ticket** = Willy Wonka's golden ticket — it gives you **unlimited access to everything** forever!

---

## 12. SAM & NTLM

### SAM (Security Accounts Manager)

| Aspect | Detail |
|--------|--------|
| **What** | Database file storing usernames + password hashes |
| **Where** | `C:\Windows\System32\config\SAM` |
| **Registry** | `HKEY_LOCAL_MACHINE\SAM` |
| **Protected by** | LSASS (Local Security Authority Subsystem Service) |
| **Purpose** | Authenticate local user logins |

### NTLM (NT LAN Manager)

**How NTLM Works (3-step handshake):**
```
Client ──── 1. NEGOTIATE ────► Server
       ◄─── 2. CHALLENGE ─────        (Server sends random nonce)
       ──── 3. AUTHENTICATE ──►        (Client sends hashed response)
```

| Aspect | Detail |
|--------|--------|
| **Type** | Challenge-response authentication protocol |
| **Used when** | Kerberos can't be used (non-domain, legacy systems) |
| **Weakness** | Vulnerable to relay attacks, pass-the-hash, brute force |
| **Versions** | NTLMv1 (weak) → NTLMv2 (stronger, uses HMAC-MD5) |

### 🧠 Memory Trick
> **SAM = the safe** where passwords are stored  
> **NTLM = the old lock** (use Kerberos — the newer, better lock — whenever possible!)

---

## 13. Phishing Emails

### One-Liner
> Fake emails pretending to be legit, designed to **steal your credentials or install malware**.

### 4 Types of Phishing

| Type | Target | Example |
|------|--------|---------|
| **Spear Phishing** | Specific person/org | "Hi John, please review this invoice from your boss" |
| **Clone Phishing** | Copy of real email | Exact copy of a real invoice but with a malicious link |
| **Whaling** | Executives/VIPs | Email impersonating the CEO requesting a wire transfer |
| **Vishing/Smishing** | Voice calls / SMS | "Your bank account is locked. Call this number..." |

### 4 Common Tactics
1. **Urgency & Fear** — "Your account will be locked in 24 hours!"
2. **Spoofed Addresses** — `support@paypal.com` vs `support@paipal.com`
3. **Compelling Subject Lines** — "Urgent: Invoice Overdue"
4. **Malicious Links/Attachments** — Links to fake login pages or malware downloads

### 🔍 How to Identify a Phishing Email
1. Check sender's **email address** for misspellings
2. **Hover over links** (don't click!) to see the real URL
3. Look for **poor grammar** and spelling errors
4. Be wary of **urgency** and unusual requests
5. **Verify** directly with the supposed sender

### 📋 What to Collect During Email Investigation
| Artifact | Why |
|----------|-----|
| Sender email address | Identify the attacker |
| Sender IP address | Trace origin |
| Subject line | Pattern matching |
| Recipient email | Scope of attack |
| Reply-to address | Often different from sender |
| Date/time | Timeline |
| URL links (expanded) | Check reputation |
| Attachment name | File analysis |
| Attachment hash (MD5/SHA256) | Malware lookup on VirusTotal |

### Attacker Evasion Techniques
- Use **newly created domains** (no reputation yet)
- Use **non-blacklisted SMTP servers**
- Employ **sandbox evasion** techniques

### 🧠 Memory Trick
> **S-C-W-V**: **S**pear, **C**lone, **W**haling, **V**ishing — Think: "**S**ome **C**riminals **W**ant **V**ictims"

---

## 14. SPF, DKIM & DMARC

### One-Liner
> Three protocols that work together to **prove an email is really from who it claims to be**.

### The Trio Explained

| Protocol | What It Checks | Analogy |
|----------|---------------|---------|
| **SPF** | "Is this mail server **authorized** to send for this domain?" | Checking the **return address** on a letter |
| **DKIM** | "Was this email **tampered with** in transit?" | A **wax seal** on the envelope |
| **DMARC** | "What should I **do** if SPF or DKIM fails?" | The **policy** (reject, quarantine, or accept) |

### How Each Works

**SPF (Sender Policy Framework)**
```
DNS Record:  v=spf1 ip4:192.168.0.1 include:spf.google.com -all
             ↑                                                 ↑
    "Only these servers can send for us"         "Reject all others"
```

**DKIM (DomainKeys Identified Mail)**
```
Sending Server: Signs email with PRIVATE key → adds DKIM-Signature header
Receiving Server: Gets PUBLIC key from DNS → verifies signature
Result: Email content integrity confirmed ✅
```

**DMARC (Domain-based Message Authentication, Reporting & Conformance)**
```
DNS Record:  v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com
             ↑         ↑ policy    ↑ send reports here
```
- **p=none** → just monitor
- **p=quarantine** → send to spam
- **p=reject** → block completely

### Combined Flow
```
Email arrives → Check SPF ✅ → Check DKIM ✅ → Apply DMARC policy → DELIVER
Email arrives → Check SPF ❌ → Check DKIM ❌ → Apply DMARC policy → REJECT/QUARANTINE
```

### 🧠 Memory Trick
> **SPF** = "**S**erver **P**ermission **F**ile" (who can send?)  
> **DKIM** = "**D**igital **K**ey for **I**ntegrity of **M**ail" (was it tampered?)  
> **DMARC** = "**D**ecision **M**aker for **A**uthentication **R**ules & **C**ompliance" (what to do about failures?)

---

## 15. Email Flow

### One-Liner
> Email travels through **6 stages**: Compose → Submit → Route → Deliver → Store → Read

### The Complete Flow

```
Step 1: COMPOSE         → MUA (Mail User Agent) — Outlook, Gmail
          ↓
Step 2: SUBMIT           → MSA (Mail Submission Agent) — Port 587/465
          ↓
Step 3: ROUTE            → MTA (Mail Transfer Agent) — DNS MX lookup
          ↓
Step 4: DELIVER          → MX Server — SPF/DKIM/DMARC checks happen here
          ↓
Step 5: STORE            → MDA (Mail Delivery Agent) — stores in mailbox
          ↓
Step 6: READ             → MUA retrieves via IMAP (143/993) or POP3 (110/995)
```

### Key Ports to Remember

| Protocol | Port | Secure Port |
|----------|------|-------------|
| **SMTP Submission** | 587 | 465 (SSL) |
| **IMAP** | 143 | 993 (TLS) |
| **POP3** | 110 | 995 (TLS) |

### IMAP vs POP3
| | IMAP | POP3 |
|---|------|------|
| **Emails** | Stay on server | Downloaded, usually deleted from server |
| **Access** | Multiple devices | Typically one device |
| **Best for** | Modern use | Legacy/offline use |

### 🧠 Memory Trick
> **"MUA → MSA → MTA → MX → MDA → MUA"**  
> Think: **"My Mail Moves Through Many Doors And Back"**

---

## 16. Malicious Activity Indicators

### The 7 Categories of Suspicious Behavior

| Category | Red Flags 🚩 |
|----------|-------------|
| **1. Network** | Large data transfers to external IPs, unusual port activity, connections to known malicious IPs, internal scanning |
| **2. User Behavior** | Multiple failed logins, logins from unfamiliar locations, access to unusual data |
| **3. Endpoint** | Unknown processes running, unauthorized PowerShell/CMD, file encryption (ransomware), registry changes |
| **4. Application** | Apps crashing, unauthorized external connections, suspicious macros/scripts |
| **5. Email** | Phishing indicators, spoofed addresses, high volume outbound emails |
| **6. Logs** | Unexplained gaps/deletions in logs, privilege escalation attempts |
| **7. External** | Threat intel alerts, compromised credentials on dark web |

### 🧠 Interview Tip
> When asked "How would you detect malicious activity?", organize your answer by these 7 categories!

---

## 17. Defensive Measures & Detection

### 6 Key Defensive Strategies

| Strategy | Tool/Approach |
|----------|--------------|
| **Network Monitoring** | IDS/IPS + SIEM |
| **User Behavior Analytics** | UEBA tools — detect anomalies |
| **Endpoint Protection** | EDR solutions |
| **Access Controls** | Least Privilege (PoLP) + MFA |
| **Email Security** | Email filtering + user training |
| **Regular Testing** | Audits + Penetration Testing |

---

## 18. NetBIOS & SMB

### NetBIOS

| Aspect | Detail |
|--------|--------|
| **What** | Legacy networking protocol for LAN communication |
| **OSI Layer** | Session Layer (Layer 5) |
| **Ports** | **137** (Name Service), **138** (Datagram), **139** (Session) |
| **Status** | Mostly replaced by TCP/IP but still in some legacy systems |

### SMB (Server Message Block)

| Aspect | Detail |
|--------|--------|
| **What** | Network file sharing protocol |
| **OSI Layer** | Application Layer (Layer 7) |
| **Port** | **445** |
| **Versions** | SMB1 (vulnerable!) → SMB2 → SMB3 (encrypted) |
| **Famous Exploit** | **WannaCry ransomware** exploited SMB1 (EternalBlue) |

### 🧠 Memory Trick
> **SMB1 = WannaCry** — always disable SMB1!  
> NetBIOS ports: **137-138-139** (three consecutive numbers starting from 137)

---

## 19. Digital Certificates & HTTPS

### Digital Certificates
| Component | Purpose |
|-----------|---------|
| **Public Key** | Encrypt data / verify signatures |
| **Owner Identity** | Who the cert belongs to |
| **Issuer (CA)** | Trusted authority that verified the owner |
| **Digital Signature** | CA's signature proving authenticity |
| **Validity Period** | Start and expiry dates |

### How HTTPS Works (The Handshake)

```
┌──────────┐                           ┌──────────┐
│  CLIENT  │                           │  SERVER  │
│(Browser) │                           │(Website) │
└────┬─────┘                           └────┬─────┘
     │                                      │
     │ 1. CLIENT HELLO ───────────────────► │  (supported TLS versions, ciphers)
     │                                      │
     │ ◄─────────────────── 2. SERVER HELLO │  (chosen TLS version, cipher + certificate)
     │                                      │
     │ 3. VERIFY CERTIFICATE                │  (check CA, validity, domain match)
     │                                      │
     │ 4. KEY EXCHANGE ───────────────────► │  (generate shared session key)
     │                                      │
     │ ◄══════ 5. ENCRYPTED DATA ═════════► │  (symmetric encryption with session key)
     │                                      │
```

### Interview Summary
"HTTPS uses a **TLS handshake** to establish a secure connection. The client and server exchange hellos, the server presents its **certificate** (verified against a trusted CA), they perform a **key exchange** to create a shared **symmetric session key**, and all subsequent data is **encrypted** with that key."

### 🧠 Memory Trick
> **"Client Hello → Server Hello → Certificate Check → Key Exchange → Encrypted Talk"**  
> = **"C-S-C-K-E"** = "**C**ars **S**top, **C**heck **K**eys, **E**nter"

---

## 20. SIEM Solutions

### One-Liner
> **SIEM = Security's Central Nervous System** — it collects, correlates, and alerts on all security events.

### What SIEM Stands For
- **S**ecurity **I**nformation (**log collection & analysis**) +
- **E**vent **M**anagement (**real-time monitoring & correlation**)

### 7 Key Functions

| Function | What It Does |
|----------|-------------|
| 1. **Data Collection** | Collects logs from everywhere (network, endpoints, apps, cloud) |
| 2. **Normalization** | Converts different log formats into a standard format |
| 3. **Correlation** | Connects related events to detect patterns |
| 4. **Real-time Monitoring** | Watches events as they happen |
| 5. **Alerting** | Triggers alerts based on rules/thresholds |
| 6. **Forensic Analysis** | Deep-dive investigation of incidents |
| 7. **Compliance Reporting** | Generates audit reports for regulations |

### SIEM Challenges
- ⚠️ **Complex** to implement and manage
- ⚠️ Requires **tuning** to reduce false positives
- ⚠️ Needs **skilled analysts** to operate effectively

### 🧠 Memory Trick
> SIEM = **"See Everything In Motion"** — it's your security surveillance camera system for ALL logs.

---

## 21. EDR vs XDR

### One-Liner
> **EDR** watches endpoints only | **XDR** watches **everything** (endpoints + network + email + cloud)

### Comparison

| Aspect | EDR | XDR |
|--------|-----|-----|
| **Scope** | Endpoints only | Endpoints + Network + Email + Cloud |
| **Visibility** | Deep endpoint visibility | Unified cross-layer visibility |
| **Detection** | Endpoint threats | Complex multi-stage attacks |
| **Response** | Isolate endpoints | Automated response across all layers |
| **Data Sources** | Process, file, registry, network on endpoint | EDR + NDR + email + cloud telemetry |
| **Example** | CrowdStrike Falcon | Microsoft Sentinel + Defender XDR |

### Key Term: Dwell Time
> **Dwell Time** = how long an attacker stays undetected in your environment. EDR/XDR reduce this!

### 🧠 Memory Trick
> **EDR = "E"ndpoint only** (single room security camera)  
> **XDR = "X"tended** (security cameras covering the ENTIRE building)

---

## 22. IDS vs IPS vs Firewall

### Quick Comparison

| | IDS | IPS | Firewall |
|---|-----|-----|----------|
| **What** | Detects intrusions | Detects AND prevents intrusions | Controls traffic flow |
| **Action** | Alerts only (passive) | Alerts + blocks (active) | Allow/deny based on rules |
| **Position** | Monitors traffic (TAP/SPAN) | Inline (traffic flows through it) | Network boundary |
| **Analogy** | Security **camera** | Security **guard** | **Gate** with a checkpoint |

### Key Definitions
- **Event** = a log of a specific action at a specific time (e.g., user login)
- **Flow** = a record of network activity between two hosts over a period (seconds to hours)

---

## 23. Firewall Types

### 7 Types of Firewalls

| Type | Layer | Key Feature | Pros/Cons |
|------|-------|-------------|-----------|
| **Packet-Filtering** | Network (L3) | Examines individual packets | Simple but can be bypassed |
| **Stateful Inspection** | Network (L3-4) | Tracks connection state | More secure but resource-heavy |
| **Proxy (App Gateway)** | Application (L7) | Intermediary between users & services | Deep inspection but adds latency |
| **NGFW** | All layers | FW + IPS + DPI + app awareness | Comprehensive but expensive |
| **UTM** | All layers | All-in-one security appliance | Simple management but single point of failure |
| **WAF** | Application (L7) | Protects web apps (HTTP/HTTPS) | Stops SQL injection, XSS |
| **Software Firewall** | Host-based | Installed on individual devices | Flexible but uses system resources |

### Firewall Log Fields
```
Date/Time | Source IP | Destination IP | Source Port | Dest Port | Action (Allow/Deny) | Packets Sent/Received
```

### WAF Specifically
- Monitors, filters, and blocks HTTP traffic to/from web applications
- Works at **Application Layer** (Layer 7)
- Prevents: SQL Injection, XSS, and other web-based attacks

### 🧠 Memory Trick
> **"P-S-P-N-U-W-S"** = **P**acket, **S**tateful, **P**roxy, **N**GFW, **U**TM, **W**AF, **S**oftware
> Think: "**P**lease **S**top **P**eople **N**ow **U**sing **W**eird **S**tuff"

---

## 24. Security Definitions

### CIA Triad (The Foundation!)

```
         Confidentiality
              ▲
             / \
            /   \
           /     \
          / CIA   \
         / Triad   \
        /___________\
Integrity            Availability
```

| Principle | Meaning | How to Achieve |
|-----------|---------|----------------|
| **Confidentiality** | Only authorized people see the data | Encryption, access controls |
| **Integrity** | Data is accurate and untampered | Checksums, version control, validation |
| **Availability** | Data is accessible when needed | Redundancy, backups, DR plans |

### Other Key Definitions

| Term | One-Line Definition |
|------|-------------------|
| **Authentication** | "Are you who you say you are?" (passwords, biometrics, MFA) |
| **Authorization** | "What are you allowed to do?" (RBAC, least privilege) |
| **Risk Management** | Identify, assess, and mitigate risks |
| **Vulnerability Management** | Scan → find vulns → patch them |
| **Incident Response** | Plan to contain, investigate, recover from attacks |
| **Zero Trust** | "**Never trust, always verify**" — even internal users |
| **Trust but Verify** | Always verify even trusted entities |
| **Attack Surface** | All potential vulnerabilities a threat actor could exploit |

### Detection Categories

| | Alert Triggered | No Alert |
|---|:---:|:---:|
| **Actual Threat** | ✅ **True Positive** | ❌ **False Negative** (DANGEROUS!) |
| **No Threat** | ⚠️ **False Positive** (annoying) | ✅ **True Negative** |

### 🧠 Memory Trick
> - **Positive = Alert fires** | **Negative = No alert**
> - **True = Correct** | **False = Wrong**
> - **False Negative is the worst** — real attack, no alert! 💀

---

## 25. Common Vulnerabilities

| # | Vulnerability | Impact |
|---|--------------|--------|
| 1 | **Unpatched Software** | Known exploits used by attackers |
| 2 | **Weak Passwords** | Easy brute force / credential stuffing |
| 3 | **Lack of Encryption** | Data exposed in transit/at rest |
| 4 | **SQL Injection** | Unauthorized database access |
| 5 | **Cross-Site Scripting (XSS)** | Inject malicious scripts into web pages |
| 6 | **Phishing** | Credential theft, malware installation |
| 7 | **Insider Threats** | Employees misuse access |
| 8 | **Social Engineering** | Manipulate people into revealing info |
| 9 | **Remote Work Risks** | Unsecured home networks, data leakage |

---

## 26. Detection Categories

### The 2x2 Matrix (Favorite Interview Question!)

```
                     ACTUALLY MALICIOUS?
                    ┌─────────┬──────────┐
                    │   YES   │    NO    │
         ┌──────────┼─────────┼──────────┤
ALERT    │   YES    │   TP ✅  │   FP ⚠️  │
FIRED?   ├──────────┼─────────┼──────────┤
         │   NO     │   FN 💀  │   TN ✅  │
         └──────────┴─────────┴──────────┘
```

| Category | Meaning | Impact |
|----------|---------|--------|
| **True Positive (TP)** | Real attack → Alert fired ✅ | System working correctly! |
| **True Negative (TN)** | No attack → No alert ✅ | System working correctly! |
| **False Positive (FP)** | No attack → Alert fired ⚠️ | Wastes analyst time |
| **False Negative (FN)** | Real attack → No alert 💀 | **MOST DANGEROUS** — missed attack! |

---

## 27. OSI Layer Attacks

### Attacks Mapped to Each Layer

| Layer | Name | Common Attacks |
|-------|------|---------------|
| **7** | Application | DNS Zone Transfer/Spoofing, Web attacks (SQLi, XSS), FTP brute force, Telnet brute force |
| **6** | Presentation | SSL Stripping |
| **5** | Session | Session Hijacking |
| **4** | Transport | **TCP SYN Flood**, TCP Session Hijacking, TCP Reset, **UDP Flooding** |
| **3** | Network | IP Spoofing, Smurf Attack, **ICMP Flooding**, DHCP Spoofing/Starvation, IPv6 Tunneling |
| **2** | Data Link | **ARP Spoofing/Poisoning**, **MAC Flooding** |
| **1** | Physical | Wire tapping, hardware tampering |

### 🧠 Interview Tip
> "When investigating, I consider which OSI layer the attack targets to narrow down my analysis — Layer 3 attacks show in network/firewall logs, Layer 7 attacks show in web/application logs."

---

## 28. MITRE ATT&CK Framework

### One-Liner
> A **global knowledge base** of real-world attacker tactics and techniques used to improve detection and response.

### Interview Answer
"MITRE ATT&CK stands for **Adversarial Tactics, Techniques, and Common Knowledge**. It maps out the different stages and methods attackers use in real-world attacks. As a SOC analyst, I use it to:
- **Map alerts** to specific techniques
- **Identify gaps** in our detection coverage
- **Understand attacker behavior** during investigations
- **Build detection rules** based on known techniques"

### Key Tactics (The Attack Lifecycle)
```
Reconnaissance → Resource Development → Initial Access → Execution →
Persistence → Privilege Escalation → Defense Evasion → Credential Access →
Discovery → Lateral Movement → Collection → C2 → Exfiltration → Impact
```

---

## 29. Incident Response Playbooks

### 🔴 Playbook 1: Brute Force Attack

| Step | Action |
|------|--------|
| **Detect** | Multiple failed login attempts (Event ID **4625**) in a short period |
| **Investigate** | AD logs, Application logs, OS logs → Contact the user |
| **Respond** | If not legitimate → **Disable the account** + **Block attacker IP** |

---

### 🔴 Playbook 2: Botnet Infection

| Step | Action |
|------|--------|
| **Detect** | Connection to suspicious IPs, abnormally high network traffic |
| **Investigate** | Network traffic, OS logs (new processes), Contact server owner |
| **Respond** | **Isolate server** → Remove malicious processes → Patch the vulnerability |

---

### 🔴 Playbook 3: Ransomware

| Step | Action |
|------|--------|
| **Detect** | AV alerts, connection to suspicious IPs, files encrypted with unusual extensions |
| **Investigate** | AV logs, OS logs, Account logs, Network traffic |
| **Respond** | **Isolate machine** → Run AV scan → Restore from backup → Patch |
| **Log Sources** | Firewall logs, Network logs, AV/Anti-malware logs |

---

### 🔴 Playbook 4: Data Exfiltration

| Step | Action |
|------|--------|
| **Detect** | High outbound traffic, connections to cloud storage (Dropbox, Google Drive) |
| **Investigate** | Network traffic, Proxy logs, OS logs |
| **Respond (Insider)** | Contact manager → Full forensics |
| **Respond (External)** | **Isolate machine** → Disconnect from network |

---

### 🔴 Playbook 5: APT (Advanced Persistent Threat)

| Step | Action |
|------|--------|
| **Detect** | Suspicious IP connections, high traffic, off-hours access, new admin accounts created |
| **Investigate** | Network traffic, Access logs, OS logs (processes, connections, users) |
| **Respond** | **Isolate machine** → Start formal forensics process |

---

### 🔴 Playbook 6: Phishing Attack

| Step | Action |
|------|--------|
| **Detect** | Suspicious email reported by user or email security tool |
| **Investigate** | Sender address, links, attachments (check hash on VirusTotal) |
| **Respond** | Report to IT → Block sender domain → If attachment downloaded: run malware scan |
| **Logs** | Email Server logs, Firewall logs, Endpoint Security logs |

---

### 🔴 Playbook 7: Data Breach

| Step | Action |
|------|--------|
| **Detect** | Unauthorized access to sensitive data |
| **Investigate** | Access logs, System event logs, Network logs |
| **Respond** | Disconnect affected systems → Patch vulnerabilities → Notify affected parties |

---

### 🧠 Universal Incident Response Pattern (Remember This!)

> For **ANY** incident, the approach is always:
> ```
> 1. How to DETECT it?       → What alerts/logs tell you?
> 2. How to RESPOND?         → Contain, investigate, communicate
> 3. How to MITIGATE?        → Fix root cause, prevent recurrence
> ```

---

## 🎯 Quick Interview Cheat Sheet

### If asked "Walk me through investigating an alert..."
```
1. Understand the alert (source, severity, affected assets)
2. Gather context (SIEM logs, threat intel, affected user)
3. Correlate with other events (look for patterns)
4. Determine TP or FP (evidence-based decision)
5. If TP → Contain, Eradicate, Recover (SANS steps)
6. Document everything
```

### If asked "What tools do you use?"
| Category | Tools |
|----------|-------|
| **SIEM** | Splunk, QRadar, Microsoft Sentinel, ELK |
| **EDR** | CrowdStrike, Carbon Black, Microsoft Defender |
| **Threat Intel** | VirusTotal, AbuseIPDB, IBM X-Force, MITRE ATT&CK |
| **Network** | Wireshark, Zeek, tcpdump |
| **Email** | PhishTool, MX Toolbox, Header Analyzer |

### If asked "What's your approach to security?"
> "I follow a **defense-in-depth** strategy — multiple layers of security (network, endpoint, email, user awareness) — combined with **Zero Trust** principles (never trust, always verify) and continuous monitoring through **SIEM** and **EDR/XDR** platforms."

---

> [!TIP]
> **Best study approach**: Read each section's **One-Liner** first, then the **Interview Answer**. Use the **Memory Tricks** to recall the details. Practice explaining each concept out loud as if you're in an interview.

---
*Generated from "Security Operations Centre (SOC) Concepts" — 41 pages covering core SOC knowledge for interview preparation.*
