# ☁️ AWS Cloud Security — TP/FP Checklist, Attacks & Best Practices

> **Purpose**: Complete guide for AWS Cloud Security — detect attacks, determine TP vs FP, apply best practices, and map everything to MITRE ATT&CK.  
> **Audience**: SOC Analysts, Cloud Security Engineers, Interview Preparation.

---

## Table of Contents

1. [AWS Security Tools — Know Your Arsenal](#1-aws-security-tools--know-your-arsenal)
2. [Critical AWS CloudTrail Events to Monitor](#2-critical-aws-cloudtrail-events-to-monitor)
3. [TP/FP Checklists by Detection Category](#3-tpfp-checklists-by-detection-category)
   - [3.1 IAM Abuse / Credential Compromise](#31-iam-abuse--credential-compromise)
   - [3.2 S3 Bucket Exposure / Data Leak](#32-s3-bucket-exposure--data-leak)
   - [3.3 EC2 Instance Compromise](#33-ec2-instance-compromise)
   - [3.4 Crypto Mining Detection](#34-crypto-mining-detection)
   - [3.5 Lambda Function Abuse](#35-lambda-function-abuse)
   - [3.6 VPC Network Anomalies](#36-vpc-network-anomalies)
   - [3.7 CloudTrail Tampering](#37-cloudtrail-tampering)
   - [3.8 KMS Key Misuse](#38-kms-key-misuse)
   - [3.9 RDS / Database Exposure](#39-rds--database-exposure)
   - [3.10 Privilege Escalation in AWS](#310-privilege-escalation-in-aws)
   - [3.11 Persistence in AWS](#311-persistence-in-aws)
   - [3.12 Data Exfiltration from AWS](#312-data-exfiltration-from-aws)
   - [3.13 AWS Account Takeover](#313-aws-account-takeover)
   - [3.14 Security Group / Firewall Changes](#314-security-group--firewall-changes)
   - [3.15 SSM / EC2 Instance Connect Abuse](#315-ssm--ec2-instance-connect-abuse)
4. [MITRE ATT&CK Cloud Matrix — Full Mapping](#4-mitre-attck-cloud-matrix--full-mapping)
5. [AWS Security Best Practices — Complete Checklist](#5-aws-security-best-practices--complete-checklist)
6. [Common AWS Attack Scenarios & Kill Chains](#6-common-aws-attack-scenarios--kill-chains)
7. [GuardDuty Finding Types — Quick Reference](#7-guardduty-finding-types--quick-reference)
8. [Universal AWS Alert Investigation Framework](#8-universal-aws-alert-investigation-framework)

---

## 1. AWS Security Tools — Know Your Arsenal

> Before investigating, know **where** to look.

| Tool | What It Does | Key Data Source |
|------|-------------|-----------------|
| **CloudTrail** | Logs ALL API calls (management + data events) | Who did what, when, from where |
| **GuardDuty** | Threat detection using ML + TI feeds | Automated TP/FP findings |
| **SecurityHub** | Aggregates findings from all services | Centralized security dashboard |
| **Config** | Tracks resource configuration changes | Drift detection, compliance |
| **VPC Flow Logs** | Network traffic metadata (src/dst IP, port, action) | Network anomalies |
| **CloudWatch** | Metrics, logs, alarms | Performance + security monitoring |
| **Access Analyzer** | Identifies resources shared externally | Public/cross-account access |
| **Inspector** | Vulnerability scanning for EC2 + containers | CVE detection |
| **Macie** | Discovers & protects sensitive data in S3 | PII/PHI detection |
| **Detective** | Investigates security findings (graph analysis) | Root cause analysis |
| **WAF** | Web application firewall for ALB/CloudFront/API GW | Web attack protection |
| **Shield** | DDoS protection (Standard free, Advanced paid) | DDoS mitigation |
| **KMS** | Key management for encryption | Encryption audit |
| **IAM Access Advisor** | Shows last-used permissions per service | Least privilege analysis |
| **SCPs (Org)** | Service Control Policies — guardrails | Preventive controls |

### 🧠 Memory Trick
> **"CT-GD-SH-CO-VF-CW-AA-IN-MA-DE-WA-SH-KM"**  
> Think of it as: **"CloudTrail Guards Security, Config Validates, Flow CloudWatch Analyzes, Inspector Macie Detect, WAF Shields Keys"**

---

## 2. Critical AWS CloudTrail Events to Monitor

### 🔐 IAM Events (Identity Attacks)

| CloudTrail Event | What Happened | Why It Matters |
|-----------------|---------------|----------------|
| `ConsoleLogin` | User logged into AWS Console | Check: MFA used? Source IP? |
| `CreateUser` | New IAM user created | Backdoor account? |
| `CreateAccessKey` | New access key generated | Credential persistence |
| `DeleteAccessKey` | Access key deleted | Covering tracks? |
| `AttachUserPolicy` | Policy attached to user | Privilege escalation? |
| `AttachRolePolicy` | Policy attached to role | Role escalation? |
| `PutUserPolicy` | Inline policy added to user | Inline priv esc |
| `CreateRole` | New IAM role created | Backdoor role? |
| `UpdateAssumeRolePolicy` | Trust policy updated | Allow external entity to assume role? |
| `CreateLoginProfile` | Console password set for IAM user | Enabling console access |
| `PutRolePolicy` | Inline policy added to role | Shadow admin creation |
| `AssumeRole` | Role assumed by entity | Check who and from where |
| `AssumeRoleWithSAML` | Federated login via SAML | SSO abuse? |
| `GetSessionToken` | Temporary credentials via STS | Token abuse |
| `SwitchRole` | Account/role switch | Cross-account movement |

### 🪣 S3 Events (Data Access)

| CloudTrail Event | What Happened | Why It Matters |
|-----------------|---------------|----------------|
| `PutBucketPolicy` | Bucket policy changed | Made public? |
| `PutBucketAcl` | Bucket ACL changed | Open permissions? |
| `DeleteBucketEncryption` | Encryption removed | Data exposure |
| `PutBucketPublicAccessBlock` | Public access block modified | Protection removed? |
| `GetObject` | Object downloaded | Data exfiltration? |
| `PutObject` | Object uploaded | Malware upload? |
| `DeleteObject` | Object deleted | Data destruction? |

### 🖥️ EC2 / Network Events

| CloudTrail Event | What Happened | Why It Matters |
|-----------------|---------------|----------------|
| `RunInstances` | New EC2 launched | Crypto mining? Unauthorized compute? |
| `AuthorizeSecurityGroupIngress` | Inbound rule added to SG | Port opened (0.0.0.0/0)? |
| `CreateSecurityGroup` | New security group created | Overly permissive? |
| `ModifyInstanceAttribute` | Instance settings changed | User data tampered? |
| `StopLogging` | CloudTrail logging stopped | Covering tracks! 🔴 |
| `DeleteTrail` | CloudTrail trail deleted | Covering tracks! 🔴 |
| `DisableKey` | KMS key disabled | Breaking encryption |
| `DeleteFlowLogs` | VPC flow logs deleted | Hiding network activity |

### ⚡ Lambda / Serverless Events

| CloudTrail Event | What Happened | Why It Matters |
|-----------------|---------------|----------------|
| `CreateFunction` | New Lambda function created | Malicious code deployment? |
| `UpdateFunctionCode` | Lambda code changed | Code injection? |
| `UpdateFunctionConfiguration` | Lambda config changed | Env variables with secrets? |
| `AddPermission` | Resource-based policy added | External invocation allowed? |

---

## 3. TP/FP Checklists by Detection Category

---

### 3.1 IAM Abuse / Credential Compromise

**Alert Examples**: `UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B`, unusual `AssumeRole`, access key used from new IP

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Source IP** | CloudTrail → `sourceIPAddress` | Unfamiliar IP, TOR exit node, foreign country | Known corporate IP / VPN |
| 2 | **User Agent** | CloudTrail → `userAgent` | Python `boto3`, `curl`, CLI from unusual source | Normal AWS Console/SDK |
| 3 | **MFA used?** | CloudTrail → `ConsoleLogin` → `additionalEventData.MFAUsed` | `MFAUsed: No` for sensitive operations | `MFAUsed: Yes` |
| 4 | **Time of access** | CloudTrail → `eventTime` | Off-hours, holiday, weekend | Business hours |
| 5 | **Impossible travel** | Compare IP geolocations across short time window | Login from US then India in 30 min | Same region consistently |
| 6 | **API calls made** | CloudTrail → what did they do after login? | `CreateUser`, `AttachPolicy`, recon API calls | Normal work activity |
| 7 | **Access key age** | IAM → key creation date | Very old key (>90 days, never rotated) | Recently rotated key |
| 8 | **Key exposed?** | Check GitHub, Pastebin, TruffleHog | Key found in public repo | No exposure found |
| 9 | **Contact user** | Verify with the IAM user | "I didn't log in" / "I didn't create that key" | "Yes, that was me" |

#### Decision Flow

```
IAM credential alert?
  ├── Source IP = TOR / anonymous proxy / foreign?
  │   ├── YES + No MFA + Recon API calls?         → 🔴 TP — Credential compromised!
  │   │     Action: Disable access key, revoke sessions, rotate creds
  │   └── NO
  │       ├── User confirms activity?              → 🟢 FP
  │       └── User denies?                         → 🔴 TP — Investigate further
  ├── Impossible travel detected?                  → 🔴 TP
  ├── Access key found on GitHub?                  → 🔴 TP — Immediate key rotation!
  └── Normal IP + MFA + business hours?            → 🟢 FP
```

#### Logs to Check
- [ ] CloudTrail (ConsoleLogin, AssumeRole, API calls)
- [ ] GuardDuty findings
- [ ] IAM Access Advisor (last used services)
- [ ] IAM Credential Report

---

### 3.2 S3 Bucket Exposure / Data Leak

**Alert Examples**: `Policy:S3/BucketAnonymousAccessGranted`, Macie sensitive data alert, public bucket

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Bucket policy** | S3 → Bucket Policy → look for `"Principal": "*"` | Allows public access | Restricted to specific accounts/roles |
| 2 | **ACL** | S3 → ACL → check for `AllUsers` or `AuthenticatedUsers` | Public read/write granted | Private |
| 3 | **Public Access Block** | S3 → Block Public Access settings | Disabled / partially disabled | All 4 blocks enabled |
| 4 | **Data sensitivity** | Macie scan results or manual check | Contains PII, credentials, secrets | Public marketing content |
| 5 | **Who changed it?** | CloudTrail → `PutBucketPolicy` / `PutBucketAcl` | Unauthorized user, compromised role | Authorized admin with change ticket |
| 6 | **Access Analyzer** | IAM Access Analyzer findings | External access detected | Only internal access |
| 7 | **GetObject activity** | S3 data events in CloudTrail | Downloads from unknown IPs | Internal service access |
| 8 | **Was it intentional?** | Check with bucket owner / application team | "We didn't make it public" | "It's a static website bucket, needs public" |

#### Decision Flow

```
S3 bucket exposure alert?
  ├── Contains sensitive data (PII, secrets, credentials)?
  │   ├── YES + Public access enabled?
  │   │   ├── YES → 🔴 TP — CRITICAL! → Remove public access, assess data breach
  │   │   └── NO  → 🟡 Monitor — sensitive but not exposed yet
  │   └── NO (public content, website assets)
  │       ├── Intentionally public (static site)?  → 🟢 FP — But verify with team
  │       └── Not intentionally public?             → 🟠 TP — Policy violation
  ├── Encryption removed (DeleteBucketEncryption)?  → 🔴 TP — Restore encryption
  └── Access Analyzer shows internal-only access?   → 🟢 FP
```

#### Key AWS Config Rules
- [ ] `s3-bucket-public-read-prohibited`
- [ ] `s3-bucket-public-write-prohibited`
- [ ] `s3-bucket-server-side-encryption-enabled`
- [ ] `s3-bucket-ssl-requests-only`
- [ ] `s3-bucket-logging-enabled`

---

### 3.3 EC2 Instance Compromise

**Alert Examples**: `UnauthorizedAccess:EC2/SSHBruteForce`, `Backdoor:EC2/C&CActivity`, unusual outbound traffic

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **GuardDuty finding** | Review finding type and severity | High severity C2/Trojan finding | Low severity recon finding |
| 2 | **Outbound traffic** | VPC Flow Logs → unusual destinations | Traffic to known C2 IPs, mining pools | Traffic to known SaaS/CDN |
| 3 | **CPU usage** | CloudWatch → CPUUtilization | Sustained 90-100% (crypto mining) | Normal usage pattern |
| 4 | **Security Group** | Check inbound rules | 0.0.0.0/0 on SSH(22)/RDP(3389) | Restricted to bastion/VPN only |
| 5 | **Instance metadata** | Was IMDS v2 enforced? | IMDSv1 used (SSRF vulnerable) | IMDSv2 required |
| 6 | **User data script** | EC2 → View User Data | Contains suspicious commands, downloads | Normal bootstrapping |
| 7 | **SSH keys** | Authorized_keys on the instance | Unknown keys added | Only expected keys |
| 8 | **Running processes** | SSM → Run Command or direct check | Unknown processes, miners, reverse shells | Known application processes |
| 9 | **Instance owner** | Tag-based identification + contact | "This isn't our instance" / "We didn't modify it" | "Yes, we deployed this" |

#### Decision Flow

```
EC2 compromise alert?
  ├── GuardDuty C2/Backdoor/Trojan finding?
  │   ├── HIGH severity + outbound to malicious IP?     → 🔴 TP — Isolate instance!
  │   └── LOW/MEDIUM + no network IOCs?                  → 🟡 Investigate further
  ├── CPU at 100% unexpectedly?
  │   ├── Unknown mining process found?                   → 🔴 TP — Crypto mining!
  │   └── Known application spike (deployment/build)?     → 🟢 FP
  ├── SSH brute force (many rejected connections)?
  │   ├── Followed by successful SSH + suspicious activity? → 🔴 TP
  │   └── All connections rejected?                        → 🟡 TP (Attack) but not compromised
  └── Instance launched by unknown principal?              → 🔴 TP — Unauthorized resource
```

#### Logs to Check
- [ ] GuardDuty findings
- [ ] VPC Flow Logs (outbound traffic)
- [ ] CloudWatch metrics (CPU, Network)
- [ ] CloudTrail (RunInstances, ModifyInstanceAttribute)
- [ ] OS-level logs via SSM (auth.log, syslog)

---

### 3.4 Crypto Mining Detection

**Alert Examples**: `CryptoCurrency:EC2/BitcoinTool.B!DNS`, high CPU alert, traffic to mining pools

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **DNS queries** | Route 53 resolver logs / GuardDuty | Queries to mining pool domains (`pool.minexmr.com`) | Normal DNS queries |
| 2 | **CPU utilization** | CloudWatch → CPUUtilization | 95-100% sustained for hours/days | Brief spike during deployment |
| 3 | **Outbound traffic** | VPC Flow Logs → port 3333, 4444, 8333 | Traffic on known mining ports | Standard HTTPS/443 |
| 4 | **Process list** | SSM Run Command → `ps aux` | `xmrig`, `minerd`, `cryptonight` | Known application processes |
| 5 | **Instance type** | EC2 Console → instance type | Large compute-optimized instance (c5, c6g) launched | Normal instance type |
| 6 | **Who launched?** | CloudTrail → RunInstances | Unknown IAM user/role, compromised credentials | DevOps team, CI/CD pipeline |
| 7 | **Cost spike** | AWS Cost Explorer | Sudden unexplained cost increase | Expected growth |

#### Decision Flow

```
Crypto mining alert?
  ├── DNS to mining pool + High CPU + mining process?    → 🔴 TP — Terminate instance!
  ├── High CPU only?
  │   ├── Known batch job / ML training?                  → 🟢 FP
  │   └── Unknown process consuming CPU?                  → 🟡 Investigate → check processes
  ├── Unauthorized large instances launched?               → 🔴 TP — Check for credential compromise
  └── GuardDuty CryptoCurrency finding?                   → 🔴 TP — Respond immediately
```

---

### 3.5 Lambda Function Abuse

**Alert Examples**: New Lambda with suspicious code, Lambda calling out to C2, privilege escalation via Lambda

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Who created/modified?** | CloudTrail → `CreateFunction` / `UpdateFunctionCode` | Unknown user, compromised role | Authorized developer |
| 2 | **Function code** | Lambda → Download deployment package | Reverse shell, credential harvesting, obfuscated code | Normal application code |
| 3 | **Environment variables** | Lambda → Configuration → Env vars | Hardcoded secrets, C2 URLs | Normal config variables |
| 4 | **Execution role** | Lambda → Configuration → Execution role | Admin rights (`*:*`), overly broad permissions | Least-privilege scoped role |
| 5 | **Invocation pattern** | CloudWatch → Invocations metric | Unusual spike, invoked from unknown source | Normal trigger pattern |
| 6 | **Network activity** | VPC-attached Lambda → Flow Logs | Outbound to suspicious IPs | Expected API calls |
| 7 | **Resource policy** | Lambda → Permissions → Resource-based policy | Allows cross-account / public invocation | Restricted to same account |

#### Decision Flow

```
Suspicious Lambda activity?
  ├── Created by compromised credentials?                  → 🔴 TP
  ├── Code contains reverse shell / crypto miner?          → 🔴 TP — Delete function!
  ├── Execution role has admin privileges?
  │   ├── Developer intended? (check with team)             → 🟡 Policy violation, not attack
  │   └── Role was escalated by attacker?                   → 🔴 TP — Privilege escalation
  ├── Normal function with configuration change ticket?     → 🟢 FP
  └── Lambda calling external APIs it shouldn't?            → 🟠 TP — Investigate
```

---

### 3.6 VPC Network Anomalies

**Alert Examples**: Port scan detected, unusual traffic patterns, traffic to/from sanctioned countries

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Traffic direction** | VPC Flow Logs → inbound vs outbound | Large outbound to unknown IPs | Internal service-to-service |
| 2 | **Port scanning** | Flow Logs → many rejected connections to sequential ports | Systematic port scan pattern | Health check traffic |
| 3 | **Protocol** | Flow Logs → protocol field | Unusual protocols (IRC, Telnet, FTP) | HTTPS, database ports |
| 4 | **Source** | Internal EC2 or external IP? | Internal EC2 scanning other internal hosts | External scanner (Shodan, etc.) |
| 5 | **NACL/SG changes** | CloudTrail → `AuthorizeSecurityGroupIngress` | 0.0.0.0/0 opened on sensitive ports | Restricted CIDR added with ticket |
| 6 | **DNS exfiltration** | Route 53 logs → long DNS queries, high volume | DNS tunneling indicators | Normal DNS resolution |
| 7 | **Data transfer** | VPC Flow Logs → bytes transferred | GBs sent to external destinations | Normal API response sizes |

#### Decision Flow

```
VPC network anomaly alert?
  ├── Internal instance scanning other instances?
  │   ├── Security scanner (Nessus, Qualys)?               → 🟢 FP
  │   └── Unknown source, no scan scheduled?               → 🔴 TP — Lateral movement!
  ├── 0.0.0.0/0 added to security group?
  │   ├── Change ticket exists?                             → 🟡 Policy violation
  │   └── No ticket, done by compromised user?              → 🔴 TP
  ├── Large outbound transfer to unusual destination?       → 🔴 TP — Data exfiltration
  └── Normal traffic between known services?                → 🟢 FP
```

---

### 3.7 CloudTrail Tampering

**Alert Examples**: `StopLogging`, `DeleteTrail`, `UpdateTrail` to different bucket, `PutEventSelectors` excluding events

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **What happened?** | CloudTrail → Event Name | `StopLogging` or `DeleteTrail` | `UpdateTrail` to upgrade config |
| 2 | **Who did it?** | CloudTrail → `userIdentity` | Unknown user, compromised credentials | Authorized admin |
| 3 | **When?** | CloudTrail → `eventTime` | During an active investigation / attack | During maintenance window |
| 4 | **Other suspicious activity?** | Correlate with other events from same user | Other malicious API calls around same time | Clean activity history |
| 5 | **Was logging restored?** | Check if trail is currently active | Trail still stopped | Briefly stopped then restarted (config update) |
| 6 | **Change ticket?** | Check change management system | No ticket | Approved maintenance ticket |

#### Decision Flow

```
CloudTrail tamper alert?
  ├── StopLogging / DeleteTrail / DeleteFlowLogs?
  │   ├── By authorized admin + change ticket?              → 🟢 FP (but bad practice!)
  │   └── By unknown/compromised user?                      → 🔴 TP — CRITICAL! Attacker covering tracks!
  │         Action: Restore logging, investigate ALL activity during gap
  ├── PutEventSelectors excluding specific events?          → 🔴 TP — Selective log evasion
  └── UpdateTrail to different S3 bucket?
      ├── New bucket in attacker-controlled account?        → 🔴 TP — Log diversion
      └── Migration to new logging bucket (planned)?        → 🟢 FP
```

> [!CAUTION]
> **CloudTrail tampering is almost always TP** — legitimate admins rarely stop logging. Treat this as HIGH PRIORITY.

---

### 3.8 KMS Key Misuse

**Alert Examples**: Key disabled, key scheduled for deletion, unauthorized `Decrypt` calls, key policy changed

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Action** | CloudTrail → EventName | `DisableKey`, `ScheduleKeyDeletion` | `CreateKey`, `EnableKey` |
| 2 | **Who?** | CloudTrail → `userIdentity` | Unauthorized user | Key administrator |
| 3 | **Key purpose** | KMS → Key description/tags | Production encryption key | Test/dev key |
| 4 | **Decrypt calls** | CloudTrail → `Decrypt` events | Massive volume of Decrypt from new IP/role | Normal application decryption |
| 5 | **Key policy change** | CloudTrail → `PutKeyPolicy` | External account added to policy | Internal admin access |
| 6 | **Impact** | What data does this key encrypt? | Production database, secrets | Non-sensitive test data |

#### Decision Flow

```
KMS key alert?
  ├── Key disabled or scheduled for deletion?
  │   ├── Production key by unauthorized user?              → 🔴 TP — Cancel deletion, investigate!
  │   └── Test key by authorized admin?                     → 🟢 FP
  ├── Mass Decrypt calls from unusual source?               → 🔴 TP — Data access attempt
  ├── Key policy grants access to external account?         → 🔴 TP — Cross-account key theft
  └── Normal admin key rotation?                            → 🟢 FP
```

---

### 3.9 RDS / Database Exposure

**Alert Examples**: RDS made publicly accessible, snapshot shared publicly, master password changed

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Public access** | RDS → `PubliclyAccessible` flag | Changed to `true` | Remains `false` |
| 2 | **Security Group** | RDS SG → inbound rules | 0.0.0.0/0 on port 3306/5432 | Restricted to app subnets |
| 3 | **Snapshot sharing** | CloudTrail → `ModifyDBSnapshotAttribute` | Shared with `all` (public) | Shared with specific account |
| 4 | **Who changed?** | CloudTrail → `userIdentity` | Unknown/compromised user | Authorized DBA |
| 5 | **Password change** | CloudTrail → `ModifyDBInstance` | Master password changed without ticket | Scheduled rotation |
| 6 | **Database content** | What data does it contain? | Customer PII, financial records | Test data |

#### Decision Flow

```
RDS exposure alert?
  ├── RDS set to PubliclyAccessible = true?
  │   ├── Contains production/sensitive data?               → 🔴 TP — Disable public access NOW
  │   └── Dev database, intended for testing?               → 🟡 Policy violation
  ├── Snapshot shared publicly?                             → 🔴 TP — Remove public sharing
  ├── Master password changed by unknown user?              → 🔴 TP — Credential compromise
  └── Authorized DBA making scheduled change?               → 🟢 FP
```

---

### 3.10 Privilege Escalation in AWS

**Alert Examples**: Policy attached with `*:*`, new admin user, role trust policy modified

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Policy content** | IAM → review the attached policy | `"Action": "*", "Resource": "*"` | Scoped permissions for specific service |
| 2 | **Who attached it?** | CloudTrail → `AttachUserPolicy` / `PutUserPolicy` | Non-admin user attached admin policy | IAM admin following change process |
| 3 | **Self-escalation?** | Did the user modify their own permissions? | User attached `AdministratorAccess` to themselves | Admin modified another user |
| 4 | **Existing permissions** | What permissions did the user have before? | Had `iam:*` which allowed self-escalation | Didn't have IAM permissions |
| 5 | **Trust policy** | CloudTrail → `UpdateAssumeRolePolicy` | External account/unknown AWS account added | Known partner account |
| 6 | **Change ticket** | Check ITSM / change management | No ticket exists | Approved change |

#### Common AWS Privilege Escalation Paths

```
1. iam:CreateUser + iam:AttachUserPolicy    → Create admin user
2. iam:PutUserPolicy                        → Add inline admin policy to self
3. iam:CreateRole + sts:AssumeRole           → Create admin role, assume it
4. iam:PassRole + lambda:CreateFunction      → Pass admin role to Lambda
5. iam:PassRole + ec2:RunInstances           → Launch EC2 with admin instance profile
6. iam:UpdateAssumeRolePolicy               → Modify role trust to allow self
7. lambda:UpdateFunctionCode                 → Inject code into privileged Lambda
8. iam:CreateLoginProfile                    → Add console password to user
9. iam:CreateAccessKey                       → Create new keys for existing user
10. glue:UpdateDevEndpoint                   → Add SSH key to privileged Glue endpoint
```

#### Decision Flow

```
Privilege escalation alert?
  ├── User gave themselves admin policy?                    → 🔴 TP — Self-escalation!
  ├── New role with admin trusts external account?          → 🔴 TP — Backdoor role
  ├── iam:PassRole to compute service (Lambda/EC2)?
  │   ├── Authorized DevOps deployment?                     → 🟢 FP
  │   └── Unknown user or unusual timing?                   → 🔴 TP
  ├── IAM admin following standard process?                 → 🟢 FP
  └── CreateAccessKey for another user without ticket?      → 🔴 TP — Credential persistence
```

---

### 3.11 Persistence in AWS

**Alert Examples**: New access key, new IAM user, Lambda with scheduled trigger, cross-account role

#### Persistence Methods in AWS

| Method | CloudTrail Event | What to Check |
|--------|-----------------|---------------|
| **Create IAM user** | `CreateUser` + `CreateAccessKey` | Was this authorized? |
| **Create access key** | `CreateAccessKey` | For existing user — was a second key created? |
| **Create login profile** | `CreateLoginProfile` | Console access added to programmatic-only user? |
| **Create role with external trust** | `CreateRole` / `UpdateAssumeRolePolicy` | Trust allows unknown AWS accounts? |
| **Lambda with EventBridge trigger** | `CreateFunction` + `PutRule` + `PutTargets` | Scheduled Lambda running attacker code? |
| **EC2 instance with IAM role** | `RunInstances` + `AssociateIamInstanceProfile` | Persistent compute with stolen-role access? |
| **SSM document** | `CreateDocument` | Backdoor SSM run command document? |
| **CloudFormation stack** | `CreateStack` | Infrastructure as code for persistent resources? |

#### Decision Flow

```
Persistence mechanism detected?
  ├── New IAM user/access key created without ticket?        → 🔴 TP — Backdoor!
  ├── Second access key added to existing user?
  │   ├── Key rotation process (old key to be deleted)?      → 🟢 FP
  │   └── Both keys active, no rotation?                     → 🔴 TP
  ├── Role trust allows external unknown account?            → 🔴 TP — Cross-account backdoor
  ├── Scheduled Lambda with suspicious code?                 → 🔴 TP
  └── Standard CI/CD or IaC deployment?                      → 🟢 FP
```

---

### 3.12 Data Exfiltration from AWS

**Alert Examples**: S3 bulk download, RDS snapshot copy to external account, EC2 AMI shared publicly

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **S3 GetObject volume** | CloudTrail S3 data events | Mass download of sensitive files | Normal API access |
| 2 | **S3 to external** | CloudTrail → source IP of GetObject | External IP / unexpected account | Internal application |
| 3 | **Snapshot sharing** | `ModifyDBSnapshotAttribute`, `ModifySnapshotAttribute` | Shared with unknown AWS account | Shared with known partner |
| 4 | **AMI sharing** | `ModifyImageAttribute` | AMI made public or shared externally | Shared with internal account |
| 5 | **EC2 data transfer** | VPC Flow Logs → outbound bytes | GBs/TBs sent to external IPs | Normal response traffic |
| 6 | **DNS exfiltration** | Route53 resolver logs | Encoded data in DNS queries | Normal DNS |
| 7 | **STS token used externally** | CloudTrail → `AssumeRole` from unknown account | Credentials used from external | Normal cross-account |

#### Decision Flow

```
Data exfiltration alert?
  ├── Mass S3 download from external IP?                    → 🔴 TP
  ├── RDS/EBS snapshot shared with unknown account?         → 🔴 TP — Immediate unshare!
  ├── AMI shared publicly?                                  → 🔴 TP — Contains sensitive data?
  ├── Large outbound data via EC2?
  │   ├── Known data pipeline / backup?                     → 🟢 FP
  │   └── Unexpected, no business justification?            → 🔴 TP
  └── Cross-account access to known partner?                → 🟢 FP — Verify with team
```

---

### 3.13 AWS Account Takeover

**Alert Examples**: Root account used, MFA disabled, password changed, email changed

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Root login** | CloudTrail → `ConsoleLogin` by root | Root account used (should NEVER happen) | IAM user login |
| 2 | **MFA disabled** | CloudTrail → `DeactivateMFADevice` | MFA removed from privileged user | User replacing MFA device (ticketed) |
| 3 | **Password changed** | CloudTrail → `ChangePassword` / `UpdateLoginProfile` | Changed by different user / without MFA | User changed own password normally |
| 4 | **Account email** | CloudTrail → `UpdateAccountEmailAddress` | Root email changed | None (this should never happen) |
| 5 | **Billing changes** | CloudTrail → billing API calls | Payment method changed, resource limits raised | Normal billing review |
| 6 | **SCP changes** | CloudTrail → `UpdatePolicy` (Organizations) | SCP removed/weakened | SCP update via approved process |

#### Decision Flow

```
Account takeover indicators?
  ├── Root account login detected?                          → 🔴 TP — Always investigate root!
  ├── MFA disabled on admin accounts?
  │   ├── Approved MFA device change?                       → 🟢 FP
  │   └── No ticket, done by unknown entity?                → 🔴 TP — Account compromised!
  ├── Root email changed?                                   → 🔴 TP — CRITICAL! Contact AWS Support!
  └── SCP removed allowing previously blocked actions?      → 🔴 TP — Guardrails bypassed
```

> [!CAUTION]
> **Root account usage is almost ALWAYS a TP** — root should have MFA enabled and never be used for daily operations.

---

### 3.14 Security Group / Firewall Changes

**Alert Examples**: Ingress 0.0.0.0/0 added, NACL modified, port 22/3389 opened to world

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **What was opened?** | CloudTrail → `AuthorizeSecurityGroupIngress` | 0.0.0.0/0 on 22/3389/3306/all ports | Specific CIDR on specific port |
| 2 | **Who changed it?** | CloudTrail → `userIdentity` | Unknown / compromised user | Authorized network admin |
| 3 | **Which instances affected?** | EC2 → instances using this SG | Production servers | Dev/test instances |
| 4 | **Duration** | Is this temporary or permanent? | No end date, no ticket | Temporary with scheduled revert |
| 5 | **Change ticket** | Check ITSM system | No ticket | Approved change request |
| 6 | **NACL changes** | CloudTrail → `CreateNetworkAclEntry` | Allow all inbound | Specific rule addition |

#### Decision Flow

```
Security group change alert?
  ├── 0.0.0.0/0 on SSH(22) or RDP(3389)?
  │   ├── Change ticket exists + temporary?                 → 🟡 Policy violation (bad practice)
  │   └── No ticket + compromised user?                     → 🔴 TP — Revert immediately!
  ├── All ports opened (0-65535)?                           → 🔴 TP — Revert NOW!
  ├── Specific CIDR added by authorized admin?              → 🟢 FP
  └── NACL changed to allow all?                            → 🔴 TP — Investigate
```

---

### 3.15 SSM / EC2 Instance Connect Abuse

**Alert Examples**: SSM session started by unusual user, RunCommand execution, EC2 Instance Connect from unknown IP

#### Step-by-Step Checklist

| # | Check | How to Verify | TP Signal 🔴 | FP Signal 🟢 |
|---|-------|---------------|-------------|-------------|
| 1 | **Who started the session?** | CloudTrail → `StartSession` | Unknown user, compromised credentials | Authorized ops team member |
| 2 | **What commands ran?** | SSM Session Manager logs | Reverse shell, data export, credential harvesting | Standard maintenance commands |
| 3 | **Target instance** | Which instance was accessed? | Production server outside normal access | Dev/staging in user's scope |
| 4 | **Time** | When was the session? | Off-hours, no maintenance window | During scheduled maintenance |
| 5 | **SendCommand** | CloudTrail → `SendCommand` | Command sent to many instances at once | Single instance, routine |

#### Decision Flow

```
SSM/Instance Connect alert?
  ├── Compromised credentials used to start session?        → 🔴 TP
  ├── Commands include data exfil or reverse shell?         → 🔴 TP
  ├── Authorized ops team during maintenance window?        → 🟢 FP
  └── SendCommand to many instances simultaneously?
      ├── Known automation / patching?                      → 🟢 FP
      └── Unknown, suspicious commands?                     → 🔴 TP
```

---

## 4. MITRE ATT&CK Cloud Matrix — Full Mapping

### The 14 Tactics Mapped to AWS

> Each tactic represents a **"WHY"** — the attacker's goal at each stage.

---

### 🔵 Tactic 1: Reconnaissance (TA0043)

> **Goal**: Gather information about the target AWS environment.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Cloud Infrastructure Discovery** | `DescribeInstances`, `ListBuckets`, `DescribeSecurityGroups` | CloudTrail — mass Describe/List API calls |
| **Cloud Service Discovery** | Enumerate services, regions, accounts | CloudTrail — rapid API calls across services |
| **Account Discovery** | `ListUsers`, `ListRoles`, `GetAccountAuthorizationDetails` | CloudTrail — IAM enumeration events |
| **Search Open Websites** | Find leaked keys on GitHub, Pastebin | GitHub scanning tools, TruffleHog |

**How to Detect**: Look for a burst of `Describe*`, `List*`, `Get*` API calls from a single principal in a short time window.

---

### 🔵 Tactic 2: Resource Development (TA0042)

> **Goal**: Set up infrastructure for the attack.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Obtain Cloud Credentials** | Stolen access keys, leaked .env files | GuardDuty UnauthorizedAccess findings |
| **Compromise Accounts** | Phish AWS console credentials | Impossible travel, unusual login patterns |
| **Develop Capabilities** | Create malicious Lambda functions, AMIs | CloudTrail — `CreateFunction`, `CreateImage` |

---

### 🔵 Tactic 3: Initial Access (TA0001)

> **Goal**: Get into the AWS environment.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Valid Accounts: Cloud** | Stolen access keys, leaked credentials | GuardDuty, CloudTrail — new IP/user agent |
| **Phishing for Cloud Creds** | Fake AWS login page | SSO/IdP logs, impossible travel |
| **Exploit Public-Facing App** | Exploit vulnerable web app on EC2/ECS | WAF logs, ALB access logs |
| **Trusted Relationship** | Compromised partner's cross-account role | CloudTrail — `AssumeRole` from new account |
| **SSRF on EC2** | Exploit SSRF to steal IMDS credentials | Enforce IMDSv2, GuardDuty findings |

---

### 🔵 Tactic 4: Execution (TA0002)

> **Goal**: Run malicious code.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Serverless Execution** | Malicious Lambda function | CloudTrail — `CreateFunction`, `UpdateFunctionCode` |
| **User Data Script** | Inject commands in EC2 user data | CloudTrail — `ModifyInstanceAttribute` (userData) |
| **SSM Run Command** | Execute commands via SSM | CloudTrail — `SendCommand`, SSM logs |
| **Container Execution** | Deploy malicious container in ECS/EKS | CloudTrail — `RunTask`, `CreateService` |

---

### 🔵 Tactic 5: Persistence (TA0003)

> **Goal**: Maintain access even if initial entry point is closed.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Create Cloud Account** | `CreateUser`, `CreateLoginProfile`, `CreateAccessKey` | CloudTrail IAM events |
| **Modify Cloud Auth** | `UpdateAssumeRolePolicy` (add external trust) | CloudTrail, Access Analyzer |
| **Scheduled Task** | EventBridge rule triggering malicious Lambda | CloudTrail — `PutRule`, `PutTargets` |
| **Implant on Instance** | Install backdoor on EC2, add SSH key | OS audit logs, EDR on instances |
| **Account Manipulation** | Add MFA device attacker controls | CloudTrail — `EnableMFADevice` |

---

### 🔵 Tactic 6: Privilege Escalation (TA0004)

> **Goal**: Get higher-level permissions.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **IAM Policy Manipulation** | `AttachUserPolicy` → `AdministratorAccess` | CloudTrail, AWS Config rule |
| **Assume Higher Role** | `AssumeRole` to admin role | CloudTrail — check who's assuming what |
| **Pass Role to Service** | `iam:PassRole` + `lambda:CreateFunction` | CloudTrail — `PassRole` events |
| **Exploit Public App** | Gain instance profile credentials via SSRF | GuardDuty SSRF findings |

---

### 🔵 Tactic 7: Defense Evasion (TA0005)

> **Goal**: Avoid detection.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Disable CloudTrail** | `StopLogging`, `DeleteTrail` | CloudTrail — these events themselves! |
| **Delete Flow Logs** | `DeleteFlowLogs` | CloudTrail — flow log deletion |
| **Modify GuardDuty** | `DeleteDetector`, `UpdateDetector` | CloudTrail — GuardDuty API calls |
| **Remove Config Rules** | `DeleteConfigRule`, `StopConfigurationRecorder` | CloudTrail — Config events |
| **Use Regions Without Monitoring** | Operate in regions where CloudTrail isn't enabled | Enable multi-region CloudTrail |
| **Modify S3 Bucket Logging** | `PutBucketLogging` → disable | CloudTrail S3 management events |
| **Trusted IP Bypass** | Use VPN/proxy to mimic known good IP | Behavioral analysis beyond IP |

---

### 🔵 Tactic 8: Credential Access (TA0006)

> **Goal**: Steal credentials.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Steal Instance Profile Creds** | SSRF → IMDS → role credentials | Enforce IMDSv2, GuardDuty |
| **Steal Access Keys** | From environment variables, code, config files | Key usage from new IP, GuardDuty |
| **Brute Force Console Login** | Password spraying on AWS Console | CloudTrail `ConsoleLogin` failures |
| **Unsecured Credentials** | Keys in Lambda env vars, EC2 user data, SSM params | Audit env vars, use Secrets Manager |
| **Steal STS Tokens** | `GetSessionToken`, `AssumeRole` → exfiltrate token | Unusual STS activity in CloudTrail |

---

### 🔵 Tactic 9: Discovery (TA0007)

> **Goal**: Learn about the environment.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Cloud Service Dashboard** | AWS Console browsing | CloudTrail Console login + Describe calls |
| **Cloud Infrastructure Discovery** | `DescribeInstances`, `DescribeVpcs`, `ListBuckets` | Mass Describe/List API spike |
| **Permission Groups Discovery** | `ListGroups`, `ListGroupPolicies`, `GetGroupPolicy` | IAM enumeration in CloudTrail |
| **Account Discovery** | `GetCallerIdentity`, `ListUsers` | STS/IAM APIs from new source |
| **Network Service Discovery** | `DescribeSecurityGroups`, `DescribeSubnets` | VPC enumeration pattern |

---

### 🔵 Tactic 10: Lateral Movement (TA0008)

> **Goal**: Move to other resources/accounts.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Use Alternate Auth** | `AssumeRole` to access other accounts | Cross-account `AssumeRole` from new source |
| **Internal Spear Phishing** | Phish other AWS users via SES/WorkMail | SES sending logs |
| **SSH/RDP to Other Instances** | Use compromised instance to pivot | VPC Flow Logs — instance-to-instance traffic |
| **Shared Credentials** | Same keys used across services/accounts | Same key ID in multiple account CloudTrails |

---

### 🔵 Tactic 11: Collection (TA0009)

> **Goal**: Gather data of interest.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Data from Cloud Storage** | S3 `GetObject` — bulk download | CloudTrail S3 data events |
| **Data from Cloud Database** | RDS/DynamoDB queries | Database audit logs |
| **Email Collection** | WorkMail / SES access | WorkMail audit logs |
| **Data Staged** | Copy to attacker-controlled S3 bucket | Cross-account `PutObject` |

---

### 🔵 Tactic 12: Command and Control (TA0011)

> **Goal**: Communicate with compromised resources.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Web Service** | Use Lambda/API Gateway as C2 relay | CloudWatch, Lambda invocation patterns |
| **DNS Tunneling** | Encode data in DNS queries | Route53 resolver logs |
| **Proxy** | Use compromised EC2 as proxy | VPC Flow Logs — unusual relay patterns |
| **Encrypted Channel** | HTTPS to C2 infra | Domain reputation, certificate analysis |

---

### 🔵 Tactic 13: Exfiltration (TA0010)

> **Goal**: Steal data out of AWS.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Transfer to Cloud Account** | Share snapshots, AMIs, S3 objects cross-account | CloudTrail — `ModifySnapshotAttribute`, `ModifyImageAttribute` |
| **Exfil Over Web Service** | Upload S3 data to external service | Proxy logs, VPC Flow logs |
| **Exfil Over DNS** | DNS tunneling for small data | Route53 resolver logs — long queries |
| **Automated Exfil** | Script to continuously sync S3 to attacker bucket | S3 data events — high volume `GetObject` |

---

### 🔵 Tactic 14: Impact (TA0040)

> **Goal**: Destroy, disrupt, or manipulate.

| Technique | AWS Implementation | Detection |
|-----------|-------------------|-----------|
| **Data Destruction** | `DeleteBucket`, `TerminateInstances`, `DeleteDBInstance` | CloudTrail — destructive API calls |
| **Resource Hijacking** | Crypto mining on EC2 | GuardDuty CryptoCurrency finding |
| **Service Disruption** | Delete production resources, modify configs | CloudTrail — `Delete*`, `Modify*` events |
| **Account Manipulation** | Change root password, disable MFA | CloudTrail — root activity |
| **Ransomware** | Encrypt S3 objects with attacker's KMS key | S3 `PutObject` with custom SSE-KMS key |

---

## 5. AWS Security Best Practices — Complete Checklist

### 🔐 IAM Best Practices

- [ ] **Never use root account** — create IAM users for daily operations
- [ ] **Enable MFA on root** — hardware MFA preferred
- [ ] **Enable MFA on all IAM users** — especially admins
- [ ] **Use IAM roles for applications** — never hardcode access keys
- [ ] **Principle of least privilege** — grant only needed permissions
- [ ] **Use IAM policies (not inline)** — easier to audit and manage
- [ ] **Rotate access keys regularly** — every 90 days max
- [ ] **Remove unused credentials** — use Credential Report + Access Advisor
- [ ] **Use permission boundaries** — limit max permissions for delegated admin
- [ ] **Use SCPs in Organizations** — guardrails for all accounts
- [ ] **Use conditions in policies** — `aws:SourceIp`, `aws:MultiFactorAuthPresent`
- [ ] **Disable root access keys** — root should have NO programmatic access
- [ ] **Use AWS SSO / Identity Center** — centralized access management
- [ ] **Use STS temporary credentials** — prefer over long-lived access keys
- [ ] **Tag all IAM resources** — for audit and cost tracking

### 🪣 S3 Best Practices

- [ ] **Enable S3 Block Public Access** — at account AND bucket level
- [ ] **Enable default encryption** — SSE-S3, SSE-KMS, or SSE-C
- [ ] **Enable versioning** — protect against accidental deletion
- [ ] **Enable access logging** — S3 server access logs or CloudTrail data events
- [ ] **Use bucket policies** — restrict to VPC endpoints, specific IPs
- [ ] **Enable MFA Delete** — require MFA to delete objects
- [ ] **Use VPC endpoints for S3** — keep traffic private
- [ ] **Use Macie** — discover and protect sensitive data
- [ ] **Apply lifecycle policies** — manage data retention
- [ ] **Enforce SSL-only access** — `aws:SecureTransport` condition

### 🖥️ EC2 / Compute Best Practices

- [ ] **Use IMDSv2** — prevent SSRF attacks on instance metadata
- [ ] **Use IAM roles (instance profiles)** — never store keys on instances
- [ ] **Harden security groups** — no 0.0.0.0/0 on SSH/RDP
- [ ] **Use bastion hosts or SSM** — never expose instances directly
- [ ] **Enable EBS encryption** — by default for all volumes
- [ ] **Enable detailed monitoring** — CloudWatch enhanced metrics
- [ ] **Use AMI hardening** — CIS benchmarks, remove unnecessary packages
- [ ] **Keep instances patched** — use SSM Patch Manager
- [ ] **Use VPC endpoints** — avoid internet for AWS API calls
- [ ] **Disable unused ports/services** — minimize attack surface

### 🌐 Network / VPC Best Practices

- [ ] **Use private subnets** — for databases, application servers
- [ ] **Use NAT Gateway** — for outbound-only internet access
- [ ] **Enable VPC Flow Logs** — for ALL VPCs
- [ ] **Use NACLs as backup** — defense-in-depth with security groups
- [ ] **Use AWS PrivateLink** — for VPC-to-service private connections
- [ ] **Segment with multiple VPCs** — isolate environments (prod/dev/staging)
- [ ] **Use Transit Gateway** — centralized networking
- [ ] **Enable DNS query logging** — Route53 resolver logs
- [ ] **Use WAF on ALB/CloudFront** — protect web applications
- [ ] **Enable Shield Advanced** — for DDoS protection (critical apps)

### 📊 Logging & Monitoring Best Practices

- [ ] **Enable CloudTrail in ALL regions** — multi-region trail
- [ ] **Enable CloudTrail log file integrity** — detect tampering
- [ ] **Enable S3 data events** — track object-level access
- [ ] **Enable Lambda data events** — track function invocations
- [ ] **Send CloudTrail to S3 + CloudWatch Logs** — for analysis
- [ ] **Enable GuardDuty in ALL accounts and regions** — threat detection
- [ ] **Enable SecurityHub** — aggregate all findings
- [ ] **Enable AWS Config** — track configuration changes
- [ ] **Set up CloudWatch Alarms** — for critical metrics (root login, billing)
- [ ] **Use SNS for alerting** — real-time notifications
- [ ] **Enable VPC Flow Logs** — in ALL VPCs
- [ ] **Protect CloudTrail S3 bucket** — bucket policy preventing deletion
- [ ] **Use CloudTrail Lake or Athena** — for log analysis

### 🔑 Encryption Best Practices

- [ ] **Encrypt data at rest** — EBS, S3, RDS, DynamoDB, Redshift
- [ ] **Encrypt data in transit** — TLS/SSL everywhere
- [ ] **Use KMS CMKs** — not just default AWS-managed keys
- [ ] **Enable automatic key rotation** — annual for CMKs
- [ ] **Use key policies** — restrict who can use/manage keys
- [ ] **Use Secrets Manager** — for credentials, API keys (not env vars)
- [ ] **Use Parameter Store** — for non-secret configuration (SecureString for secrets)
- [ ] **Use ACM** — free SSL/TLS certificates for AWS resources
- [ ] **Enable default EBS encryption** — account-level setting
- [ ] **Use envelope encryption** — for large data sets

### 🐳 Container / Serverless Best Practices

- [ ] **Scan container images** — use ECR image scanning (Inspector)
- [ ] **Use private ECR repositories** — no public images with secrets
- [ ] **Use minimal base images** — Alpine, distroless
- [ ] **No root in containers** — run as non-root user
- [ ] **Lambda: least privilege execution role** — per-function roles
- [ ] **Lambda: don't store secrets in env vars** — use Secrets Manager
- [ ] **ECS: use Fargate** — reduces OS management burden
- [ ] **EKS: enable control plane logging** — audit logs
- [ ] **EKS: use IRSA** — IAM Roles for Service Accounts
- [ ] **EKS: enable network policies** — microsegmentation

### 🏢 Account / Organization Best Practices

- [ ] **Use AWS Organizations** — multi-account strategy
- [ ] **Use SCPs** — preventive guardrails across all accounts
- [ ] **Dedicated security account** — for centralized logging/monitoring
- [ ] **Dedicated log archive account** — immutable log storage
- [ ] **Enable AWS Config aggregator** — multi-account compliance view
- [ ] **Use Control Tower** — automated account governance
- [ ] **Tag everything** — for cost, security, and compliance tracking
- [ ] **Enable billing alarms** — detect cost anomalies (crypto mining)
- [ ] **Use AWS Backup** — centralized backup management
- [ ] **Regular security assessments** — use Trusted Advisor, SecurityHub

---

## 6. Common AWS Attack Scenarios & Kill Chains

### 🔴 Scenario 1: Leaked AWS Access Key

```
KILL CHAIN:
1. INITIAL ACCESS    → Developer commits access key to GitHub
2. DISCOVERY         → Attacker finds key, runs DescribeInstances, ListBuckets
3. CREDENTIAL ACCESS → Uses key to get more creds (AssumeRole, GetSessionToken)
4. PRIVILEGE ESCAL.  → AttachUserPolicy (AdministratorAccess)
5. PERSISTENCE       → CreateUser, CreateAccessKey for new user
6. IMPACT            → RunInstances (crypto mining) + S3 data exfiltration
```

**Detection Points**:
- GuardDuty: `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration`
- CloudTrail: Access key used from new IP/region
- Billing: Sudden cost spike

**Response**:
1. Disable the leaked access key immediately
2. Revoke all sessions (`aws iam put-user-policy --policy-name DenyAll`)
3. Check CloudTrail for all actions taken with the key
4. Remove any resources created by attacker
5. Rotate all credentials in the account
6. Enable GitHub secret scanning

---

### 🔴 Scenario 2: S3 Bucket Data Breach

```
KILL CHAIN:
1. RECONNAISSANCE    → Scanner finds public S3 bucket (bucket enumeration)
2. DISCOVERY         → ListObjects on the bucket
3. COLLECTION        → GetObject — download sensitive files
4. EXFILTRATION      → Data copied to attacker infrastructure
```

**Detection Points**:
- Access Analyzer: External access finding
- Macie: Sensitive data exposure alert
- CloudTrail S3 data events: Mass GetObject from external IP
- AWS Config: `s3-bucket-public-read-prohibited` non-compliant

**Response**:
1. Block public access immediately
2. Review all data that was exposed
3. Check CloudTrail for who accessed the data
4. Notify affected parties if PII was exposed
5. Enable S3 Block Public Access at account level

---

### 🔴 Scenario 3: EC2 SSRF → Credential Theft

```
KILL CHAIN:
1. INITIAL ACCESS    → Exploit SSRF in web app on EC2
2. CREDENTIAL ACCESS → Hit IMDS (169.254.169.254) → steal instance role credentials
3. LATERAL MOVEMENT  → Use stolen role creds to access other AWS services
4. EXFILTRATION      → Access S3, RDS with the stolen role credentials
```

**Detection Points**:
- GuardDuty: `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS`
- CloudTrail: Role credentials used from IP ≠ EC2 instance IP
- WAF: SSRF pattern blocked

**Response**:
1. Revoke the instance role's active sessions
2. Rotate the role credentials
3. Patch the SSRF vulnerability
4. Enforce IMDSv2 on ALL instances
5. Review all actions taken with the stolen credentials

---

### 🔴 Scenario 4: Privilege Escalation → Account Takeover

```
KILL CHAIN:
1. INITIAL ACCESS    → Compromised IAM user with iam:* permissions
2. PRIVILEGE ESCAL.  → AttachUserPolicy → AdministratorAccess to self
3. PERSISTENCE       → CreateUser (backdoor), CreateAccessKey
4. DEFENSE EVASION   → StopLogging (CloudTrail), DeleteDetector (GuardDuty)
5. IMPACT            → Data exfiltration, resource destruction
```

**Detection Points**:
- CloudTrail: `AttachUserPolicy` with `AdministratorAccess`
- AWS Config: IAM policy change rule
- GuardDuty: `Persistence:IAMUser/UserPermissions`
- CloudTrail: `StopLogging` event 🔴

**Response**:
1. Disable the compromised user
2. Restore CloudTrail logging
3. Restore GuardDuty
4. Remove attacker-created users and keys
5. Audit all changes made during the attack window
6. Restrict `iam:*` permissions — use permission boundaries

---

### 🔴 Scenario 5: Crypto Mining Attack

```
KILL CHAIN:
1. INITIAL ACCESS    → Stolen access key or compromised EC2
2. EXECUTION         → RunInstances (large instance types, GPU instances)
3. IMPACT            → Install & run crypto miner (xmrig)
4. C2                → Connect to mining pool
```

**Detection Points**:
- GuardDuty: `CryptoCurrency:EC2/BitcoinTool.B!DNS`
- CloudWatch: CPU 100% sustained
- Billing: Cost spike (10-100x normal)
- VPC Flow Logs: Traffic to mining pool IPs on ports 3333/4444

**Response**:
1. Terminate unauthorized instances
2. Rotate compromised credentials
3. Set billing alarms and budgets
4. Use SCPs to restrict instance types
5. Enable GuardDuty in all regions

---

### 🔴 Scenario 6: Cross-Account Attack via Role Trust

```
KILL CHAIN:
1. INITIAL ACCESS    → Compromise IAM user with iam:UpdateAssumeRolePolicy
2. PERSISTENCE       → Modify role trust policy → add attacker's AWS account
3. LATERAL MOVEMENT  → AssumeRole from attacker's account
4. EXFILTRATION      → Access resources using the assumed role
```

**Detection Points**:
- CloudTrail: `UpdateAssumeRolePolicy` with external account ID
- Access Analyzer: Cross-account access finding
- GuardDuty: Unusual cross-account `AssumeRole`

**Response**:
1. Revert the trust policy
2. Disable the compromised IAM user
3. Audit all actions from the attacker's sessions
4. Use permission boundaries to prevent trust policy modifications

---

## 7. GuardDuty Finding Types — Quick Reference

### 🔴 High Severity — Always Investigate

| Finding Type | What It Means |
|-------------|---------------|
| `Backdoor:EC2/C&CActivity.B` | EC2 communicating with known C2 server |
| `CryptoCurrency:EC2/BitcoinTool.B!DNS` | EC2 querying crypto mining pool domains |
| `Trojan:EC2/BlackholeTraffic` | EC2 sending traffic to known bad IPs |
| `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS` | Instance role creds used outside AWS |
| `UnauthorizedAccess:IAMUser/MaliciousIPCaller.Custom` | API called from your custom threat list IP |
| `Exfiltration:S3/AnomalousBehavior` | Unusual S3 data access pattern |
| `Impact:EC2/PortSweep` | EC2 scanning ports on other hosts |
| `Persistence:IAMUser/UserPermissions` | Unusual IAM persistence behavior |

### 🟠 Medium Severity — Investigate When Correlated

| Finding Type | What It Means |
|-------------|---------------|
| `Recon:EC2/PortProbeUnprotectedPort` | Unprotected port being probed from internet |
| `UnauthorizedAccess:EC2/SSHBruteForce` | SSH brute force on EC2 |
| `UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B` | Console login from unusual location |
| `Policy:S3/BucketAnonymousAccessGranted` | S3 bucket made public |
| `Stealth:IAMUser/CloudTrailLoggingDisabled` | CloudTrail logging stopped |

### 🟡 Low Severity — Monitor & Tune

| Finding Type | What It Means |
|-------------|---------------|
| `Recon:EC2/Portscan` | EC2 performing outbound port scan |
| `UnauthorizedAccess:EC2/TorClient` | EC2 connecting to TOR network |
| `Policy:IAMUser/RootCredentialUsage` | Root credentials used |

---

## 8. Universal AWS Alert Investigation Framework

### The 6-Step AWS Investigation Process (mnemonic: **W-I-C-C-V-D**)

```
┌───────────────────────────────────────────────────────────┐
│           AWS CLOUD SECURITY INVESTIGATION                │
│                                                           │
│  Step 1: W — WHAT happened?                              │
│    → Read the GuardDuty / SecurityHub finding              │
│    → Identify the CloudTrail event name                    │
│    → Note: resource, region, account                       │
│                                                           │
│  Step 2: I — IDENTITY: Who did it?                       │
│    → CloudTrail → userIdentity (user/role/root?)           │
│    → Source IP, user agent, MFA status                     │
│    → Is this a known principal?                            │
│                                                           │
│  Step 3: C — CONTEXT: Is this normal?                    │
│    → Check time (business hours?)                          │
│    → Check location (expected region/IP?)                  │
│    → Check history (has this user done this before?)       │
│    → Check change management (is there a ticket?)          │
│                                                           │
│  Step 4: C — CORRELATE across sources                    │
│    → CloudTrail (API calls before & after)                 │
│    → VPC Flow Logs (network activity)                      │
│    → GuardDuty (other findings for same resource)          │
│    → AWS Config (resource state changes)                   │
│                                                           │
│  Step 5: V — VERIFY with humans                          │
│    → Contact the resource owner / team                     │
│    → Check with IAM admin                                  │
│    → Verify against deployment pipelines                   │
│                                                           │
│  Step 6: D — DECIDE and act                              │
│    → TP → Contain (isolate/disable), Eradicate, Recover   │
│    → FP → Document, tune the detection, close              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 🧠 Memory Trick
> **W-I-C-C-V-D** = "**W**hat **I**dentity **C**ontext **C**orrelate **V**erify **D**ecide"  
> Think: **"What Is Claude Checking? — Verify, Decide!"**

---

## 📋 Master Log Source Reference for AWS

| Investigation Type | Primary AWS Source | Secondary Source |
|-------------------|-------------------|-----------------|
| **IAM/Credential** | CloudTrail, GuardDuty | IAM Access Advisor, Credential Report |
| **S3 Data Access** | CloudTrail S3 Data Events | Macie, Access Analyzer, S3 Server Logs |
| **EC2 Compromise** | GuardDuty, VPC Flow Logs | CloudWatch Metrics, OS Logs via SSM |
| **Network Anomaly** | VPC Flow Logs | Route53 Resolver Logs, WAF Logs |
| **Config Changes** | AWS Config, CloudTrail | SecurityHub, Config Rules |
| **Crypto Mining** | GuardDuty, CloudWatch | Billing/Cost Explorer, VPC Flow Logs |
| **Serverless Abuse** | CloudTrail, CloudWatch | Lambda Logs, X-Ray Traces |
| **Logging Evasion** | CloudTrail (self-referencing!) | AWS Config Rules |
| **Cross-Account** | CloudTrail, Access Analyzer | Organizations, SCP Evaluation Logs |
| **Web Application** | WAF Logs, ALB Access Logs | CloudFront Logs, Lambda@Edge Logs |

---

> [!TIP]
> **Interview tip**: When asked about AWS security, structure your answer around: **"Prevention (IAM, SGs, encryption) → Detection (GuardDuty, CloudTrail, Config) → Response (isolate, rotate, patch) → Recovery (restore, audit, improve)"**

---

*Use this alongside the [SOC TP/FP Checklist](./SOC_TP_FP_Checklist.md) and [SOC Concepts Interview Guide](./SOC_Concepts_Interview_Guide.md) for complete preparation.*
