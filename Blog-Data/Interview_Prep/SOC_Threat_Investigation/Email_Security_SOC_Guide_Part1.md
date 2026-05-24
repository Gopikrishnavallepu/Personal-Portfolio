# 📧 Comprehensive Email Security Guide — SOC Analyst L2 Investigation

> **Purpose**: Complete reference for investigating email security alerts, determining True Positive (TP) vs False Positive (FP), and performing deep-dive email threat analysis.

---

## Table of Contents (Full Guide)

| Part | Coverage |
|------|----------|
| **Part 1** (this file) | Email Fundamentals, Threat Taxonomy, Authentication (SPF/DKIM/DMARC) |
| **Part 2** | Alert Triage & Investigation Workflow, TP vs FP Decision Framework |
| **Part 3** | Advanced Analysis — Headers, URLs, Attachments, IOC Extraction, Playbooks |

---

# PART 1: FOUNDATIONS & EMAIL AUTHENTICATION

---

## 1. Email Security Fundamentals

### 1.1 How Email Works (SMTP Flow)

```
Sender MUA → Sender MTA → DNS (MX Lookup) → Recipient MTA → Recipient MDA → Recipient MUA
```

| Component | Role |
|-----------|------|
| **MUA** (Mail User Agent) | Email client (Outlook, Gmail, Thunderbird) |
| **MTA** (Mail Transfer Agent) | Routes email between servers (Postfix, Exchange, Sendmail) |
| **MDA** (Mail Delivery Agent) | Delivers to mailbox (Dovecot, Exchange Store) |
| **MX Record** | DNS record pointing to the mail server for a domain |
| **SMTP** | Protocol for sending (port 25, 587, 465) |
| **IMAP/POP3** | Protocols for receiving (143/993, 110/995) |

### 1.2 Email Header Structure (Key Fields)

```
Return-Path: <sender@example.com>
Received: from mail-server.example.com (10.0.0.1) by recipient-mx.com; Date
Authentication-Results: spf=pass; dkim=pass; dmarc=pass
From: "John Doe" <john@example.com>
To: victim@company.com
Subject: Urgent Invoice
Date: Wed, 08 Apr 2026 10:30:00 +0000
Message-ID: <unique-id@example.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="boundary-string"
X-Mailer: Microsoft Outlook 16.0
X-Originating-IP: 203.0.113.50
```

### 1.3 Email Security Gateway (SEG) Stack

```
Inbound Email Flow Through Security Stack:
┌──────────────────────────────────────────────────┐
│  Internet → Connection Filtering (IP Reputation) │
│          → Authentication (SPF/DKIM/DMARC)       │
│          → Anti-Spam Engine                       │
│          → Anti-Malware / Sandboxing              │
│          → URL Rewriting / Time-of-Click          │
│          → DLP Policy Check                       │
│          → Content Filtering                      │
│          → Delivery to Mailbox                    │
└──────────────────────────────────────────────────┘
```

**Common SEG/Email Security Platforms:**
- Microsoft Defender for Office 365 (MDO)
- Proofpoint Email Protection
- Mimecast Secure Email Gateway
- Cisco Secure Email (IronPort)
- Barracuda Email Security Gateway
- Google Workspace Security (Gmail)
- Trend Micro Email Security
- Abnormal Security (API-based)

---

## 2. Email Threat Taxonomy

### 2.1 Threat Categories

| Category | Description | Common Indicators |
|----------|-------------|-------------------|
| **Phishing** | Social engineering to steal credentials | Fake login pages, urgency, spoofed sender |
| **Spear Phishing** | Targeted phishing at specific individuals | Personalized content, researched targets |
| **Business Email Compromise (BEC)** | Impersonation of executives/vendors | Display name spoofing, domain lookalikes, no malware |
| **Whaling** | BEC targeting C-suite executives | High-value wire transfers, CEO fraud |
| **Malware Delivery** | Emails with malicious attachments | Macros, executables, archive files |
| **Ransomware Delivery** | Malware that encrypts files | .zip, .js, .docm, .iso attachments |
| **Credential Harvesting** | Fake login pages to steal passwords | URL redirects to phishing kits |
| **Account Takeover (ATO)** | Compromised mailbox used for attacks | Impossible travel, inbox rule changes |
| **Spam / Graymail** | Unsolicited bulk email | Mass distribution, marketing content |
| **Email Bombing** | Flooding inbox to hide malicious activity | Thousands of subscription confirmations |
| **Callback Phishing (BazarCall)** | Email with phone number, no malicious link | Fake invoices with "call to cancel" |
| **QR Code Phishing (Quishing)** | QR codes leading to phishing sites | Image-only emails with QR codes |
| **Thread Hijacking** | Reply to existing email thread | Legitimate conversation thread with malicious insert |
| **HTML Smuggling** | HTML attachment generates malware on open | .html/.htm attachments with embedded JavaScript |

### 2.2 Attack Vectors & Kill Chain Mapping

```
Email Attack Kill Chain (Lockheed Martin + MITRE ATT&CK):

1. Reconnaissance     → T1598 (Phishing for Information)
2. Weaponization      → Craft malicious document/URL
3. Delivery           → T1566.001 (Spearphishing Attachment)
                        T1566.002 (Spearphishing Link)
                        T1566.003 (Spearphishing via Service)
4. Exploitation       → T1204.001 (User Execution: Malicious Link)
                        T1204.002 (User Execution: Malicious File)
5. Installation       → T1059 (Command & Scripting Interpreter)
6. C2                 → T1071 (Application Layer Protocol)
7. Actions on Obj.    → T1114 (Email Collection), T1534 (Internal Spearphishing)
```

### 2.3 Common Phishing Lure Themes

| Theme | Example Subject Lines |
|-------|----------------------|
| **IT/Password** | "Your password expires in 24 hours", "Verify your account" |
| **HR/Payroll** | "Updated benefits enrollment", "Payroll discrepancy" |
| **Finance** | "Invoice #INV-2026-0408 attached", "Wire transfer confirmation" |
| **Legal** | "Subpoena notification", "Contract review required" |
| **Shipping** | "Package delivery failed", "DHL shipment tracking" |
| **COVID/Health** | "Health screening results", "Updated safety protocol" |
| **Microsoft 365** | "Shared document via OneDrive", "Teams meeting update" |
| **Voicemail** | "New voicemail from +1-XXX", "Missed call notification" |
| **MFA/Security** | "Unusual sign-in activity", "MFA verification required" |

---

## 3. Email Authentication Protocols (SPF, DKIM, DMARC)

### 3.1 SPF (Sender Policy Framework)

**What it does**: Specifies which mail servers are authorized to send email on behalf of a domain.

**DNS Record Example:**
```
v=spf1 ip4:192.168.1.0/24 include:spf.google.com include:spf.protection.outlook.com -all
```

**SPF Qualifiers:**
| Qualifier | Meaning | Action |
|-----------|---------|--------|
| `+all` | Pass (allow all) | ⚠️ Dangerous — allows anyone |
| `-all` | Hard Fail | ✅ Reject unauthorized senders |
| `~all` | Soft Fail | ⚠️ Mark but don't reject |
| `?all` | Neutral | No policy |

**SPF Result Interpretations for SOC:**

| Result | Meaning | TP/FP Implication |
|--------|---------|-------------------|
| `spf=pass` | Sending IP is authorized | Could still be spoofed (compromised infra) |
| `spf=fail` | Sending IP NOT authorized | 🔴 Strong spoofing indicator |
| `spf=softfail` | Not authorized but not strictly rejected | ⚠️ Investigate further |
| `spf=neutral` | No SPF policy defined | ⚠️ Domain may lack email security |
| `spf=temperror` | Temporary DNS error | May cause FP — retry needed |
| `spf=permerror` | SPF record misconfigured | May cause FP — notify domain owner |

### 3.2 DKIM (DomainKeys Identified Mail)

**What it does**: Adds a digital signature to verify the email was not altered in transit and was sent by the claimed domain.

**DKIM Header Example:**
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
  d=example.com; s=selector1;
  h=from:to:subject:date;
  bh=base64-body-hash;
  b=base64-signature;
```

| Field | Meaning |
|-------|---------|
| `d=` | Signing domain |
| `s=` | Selector (used for DNS key lookup) |
| `a=` | Algorithm (rsa-sha256) |
| `h=` | Headers included in signature |
| `b=` | The actual signature |
| `bh=` | Body hash |

**DKIM Results for SOC:**

| Result | Meaning | Investigation Action |
|--------|---------|---------------------|
| `dkim=pass` | Signature valid, email unaltered | Verify `d=` matches `From:` domain |
| `dkim=fail` | Signature invalid or tampered | 🔴 Possible tampering or spoofing |
| `dkim=none` | No DKIM signature present | ⚠️ Check if domain should have DKIM |

> **Key SOC Check**: Even with `dkim=pass`, verify that the `d=` domain in DKIM matches the `From:` header domain. A mismatch could indicate abuse of a legitimate signing infrastructure.

### 3.3 DMARC (Domain-based Message Authentication, Reporting & Conformance)

**What it does**: Ties SPF and DKIM together with a policy for handling failures.

**DMARC DNS Record Example:**
```
_dmarc.example.com  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com; pct=100; adkim=s; aspf=s"
```

**DMARC Policies:**

| Policy | Meaning | Security Level |
|--------|---------|----------------|
| `p=none` | Monitor only, no action | 🟡 Weak — only reporting |
| `p=quarantine` | Send to spam/junk | 🟠 Medium — messages flagged |
| `p=reject` | Block the email | 🟢 Strong — full protection |

**DMARC Alignment:**

| Type | Strict (`s`) | Relaxed (`r`) |
|------|-------------|---------------|
| **SPF Alignment** | `Return-Path` domain must exactly match `From` domain | Organizational domain match OK |
| **DKIM Alignment** | `d=` domain must exactly match `From` domain | Organizational domain match OK |

**DMARC Result Interpretation:**

| Result | Meaning | SOC Action |
|--------|---------|------------|
| `dmarc=pass` | SPF or DKIM passed AND aligned | Lower risk, but still analyze content |
| `dmarc=fail` | Neither SPF nor DKIM aligned | 🔴 High spoofing probability |
| `dmarc=bestguesspass` | No DMARC record, gateway guessed | ⚠️ Domain lacks DMARC |

### 3.4 Authentication Analysis Decision Matrix

```
┌─────────────────────────────────────────────────────────────┐
│              EMAIL AUTHENTICATION ANALYSIS                   │
├──────────┬──────────┬──────────┬────────────────────────────┤
│   SPF    │   DKIM   │  DMARC   │       Assessment           │
├──────────┼──────────┼──────────┼────────────────────────────┤
│   Pass   │   Pass   │   Pass   │ ✅ Legitimate (check content) │
│   Pass   │   Fail   │   Pass   │ ⚠️ DKIM issue — investigate  │
│   Fail   │   Pass   │   Pass   │ ⚠️ SPF issue — check IP      │
│   Fail   │   Fail   │   Fail   │ 🔴 HIGH RISK — likely spoof  │
│   Pass   │   Pass   │   Fail   │ ⚠️ Alignment issue           │
│   Fail   │   Fail   │   None   │ 🔴 No protection — suspicious│
│   None   │   None   │   None   │ 🟡 Domain has no email auth  │
│ SoftFail │   Pass   │   Pass   │ ⚠️ SPF misconfigured        │
└──────────┴──────────┴──────────┴────────────────────────────┘
```

---

## 4. Common Email Security Technologies & Controls

### 4.1 Protection Technologies

| Technology | Purpose | Examples |
|------------|---------|----------|
| **Secure Email Gateway (SEG)** | Filter inbound/outbound email | Proofpoint, Mimecast, Cisco ESA |
| **API-Based Email Security** | Post-delivery analysis via API | Abnormal Security, Material Security |
| **Sandboxing** | Detonate attachments/URLs in isolated env | Microsoft Defender, CrowdStrike Falcon Sandbox |
| **URL Rewriting** | Replace URLs with safe links for time-of-click | Proofpoint URL Defense, Mimecast URL Protect |
| **Email DLP** | Prevent sensitive data exfiltration | Microsoft Purview DLP, Symantec DLP |
| **Encryption** | Protect email content in transit/rest | TLS, S/MIME, PGP, Microsoft OME |
| **ICES** | Integrated Cloud Email Security | API-based, supplements SEG |
| **Email Archiving** | Retain emails for compliance/investigation | Mimecast Archive, Barracuda |

### 4.2 Microsoft Defender for Office 365 (MDO) — Key Features for SOC

| Feature | Description |
|---------|-------------|
| **Safe Attachments** | Sandboxing for email attachments |
| **Safe Links** | Time-of-click URL verification |
| **Anti-Phishing Policies** | Impersonation protection, mailbox intelligence |
| **ZAP** (Zero-hour Auto Purge) | Retroactive removal of delivered threats |
| **AIR** (Automated Investigation & Response) | Automated threat investigation |
| **Threat Explorer** | Email hunting and investigation tool |
| **Attack Simulator** | Phishing simulation for awareness training |
| **Submissions** | Submit FPs/FNs to Microsoft for analysis |
| **Campaign Views** | Group related phishing emails into campaigns |
| **Tenant Allow/Block List** | Override filtering decisions |

### 4.3 Proofpoint Email Protection — Key Features for SOC

| Feature | Description |
|---------|-------------|
| **TAP** (Targeted Attack Protection) | Advanced threat sandboxing |
| **URL Defense** | URL rewriting and click-time analysis |
| **Attachment Defense** | Sandbox & static analysis of files |
| **Impostor Detection** | BEC/impersonation detection |
| **TRAP** (Threat Response Auto-Pull) | Remove delivered threats from mailboxes |
| **Forensics Dashboard** | Detailed threat forensics |
| **Smart Search** | Email trace and investigation |
| **SER** (Sender Email Reputation) | IP and domain reputation scoring |

---

## 5. Key Email-Related MITRE ATT&CK Techniques

| Technique ID | Name | Description |
|-------------|------|-------------|
| T1566.001 | Spearphishing Attachment | Malicious file attached to email |
| T1566.002 | Spearphishing Link | Malicious URL in email body |
| T1566.003 | Spearphishing via Service | Phishing via social media/messaging |
| T1566.004 | Spearphishing Voice (Vishing) | Phone-based social engineering |
| T1598 | Phishing for Information | Recon phishing to gather info |
| T1534 | Internal Spearphishing | Lateral phishing from compromised account |
| T1114.001 | Local Email Collection | Accessing local email data |
| T1114.002 | Remote Email Collection | Accessing email via APIs/protocols |
| T1114.003 | Email Forwarding Rule | Auto-forwarding to external address |
| T1204.001 | User Execution: Malicious Link | User clicks malicious URL |
| T1204.002 | User Execution: Malicious File | User opens malicious attachment |
| T1586.002 | Compromise Accounts: Email | Attacker compromises email accounts |

---

*Continued in Part 2 → Alert Triage, Investigation Workflow, TP vs FP Framework*
