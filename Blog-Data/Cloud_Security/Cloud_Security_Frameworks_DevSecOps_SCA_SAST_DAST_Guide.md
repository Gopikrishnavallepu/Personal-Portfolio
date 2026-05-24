# 🔐 Cloud Security Frameworks, DevSecOps Automation & Application Security (SCA/SAST/DAST) — Complete Guide

> **Purpose:** Master cloud security frameworks (CIS, NIST, SOC 2, PCI-DSS, HIPAA),
> DevSecOps pipeline security automation, cloud workload protection (containers + serverless),
> and application security testing (SCA, SAST, DAST) for interviews and hands-on work.
> **Last Updated:** April 2026

---

# TABLE OF CONTENTS

| # | Section | Topics |
|---|---------|--------|
| 1 | [Cloud Security Frameworks](#part-1-cloud-security-frameworks--compliance) | CIS, NIST, SOC 2, PCI-DSS, HIPAA — deep dive + comparison |
| 2 | [DevSecOps Pipeline Security](#part-2-devsecops-pipeline-security--automation) | 7-stage secure pipeline, automation patterns, tools |
| 3 | [SCA — Software Composition Analysis](#part-3-sca--software-composition-analysis) | Third-party dependency scanning, SBOM, supply chain |
| 4 | [SAST — Static Application Security Testing](#part-4-sast--static-application-security-testing) | Source code analysis, white-box testing |
| 5 | [DAST — Dynamic Application Security Testing](#part-5-dast--dynamic-application-security-testing) | Runtime testing, black-box scanning |
| 6 | [Cloud Workload Protection](#part-6-cloud-workload-protection--containers--serverless) | Containers, serverless (Lambda), CWPP |
| 7 | [Integration Architecture](#part-7-complete-devsecops-integration-architecture) | End-to-end pipeline with all tools combined |
| 8 | [Interview Q&A](#part-8-interview-questions--answers) | 35+ interview questions with expert answers |

---

# PART 1: CLOUD SECURITY FRAMEWORKS & COMPLIANCE

---

## 1.1 Framework Landscape — The Big Picture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                CLOUD SECURITY FRAMEWORK ECOSYSTEM                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VOLUNTARY / BEST PRACTICES:              MANDATORY / REGULATORY:        │
│  ┌──────────────┐ ┌──────────────┐       ┌──────────────┐               │
│  │  NIST CSF     │ │  CIS Controls│       │  PCI-DSS     │               │
│  │  (Strategy)   │ │  (Tactical)  │       │  (Payments)  │               │
│  └──────────────┘ └──────────────┘       └──────────────┘               │
│  ┌──────────────┐ ┌──────────────┐       ┌──────────────┐               │
│  │  SOC 2        │ │  ISO 27001   │       │  HIPAA        │               │
│  │  (Trust)      │ │  (ISMS)      │       │  (Healthcare) │               │
│  └──────────────┘ └──────────────┘       └──────────────┘               │
│  ┌──────────────┐                        ┌──────────────┐               │
│  │  CSA CCM      │                        │  GDPR         │               │
│  │  (Cloud)      │                        │  (Privacy)    │               │
│  └──────────────┘                        └──────────────┘               │
│                                                                          │
│  HOW THEY RELATE:                                                        │
│  NIST CSF = "Rosetta Stone" → maps to ALL other frameworks              │
│  CIS Controls = Tactical "HOW-TO" for NIST objectives                   │
│  SOC 2 = Prove to CUSTOMERS that you're secure                          │
│  PCI-DSS = MUST do if you process credit cards                          │
│  HIPAA = MUST do if you handle patient health data                      │
│  ISO 27001 = International certification (like SOC 2 but global)        │
└──────────────────────────────────────────────────────────────────────────┘
```

## 1.2 CIS (Center for Internet Security) — Deep Dive

```
CIS CONTROLS v8 — 18 CONTROLS IN 3 IMPLEMENTATION GROUPS
═══════════════════════════════════════════════════════════

WHAT IS CIS:
├── Nonprofit organization that produces security benchmarks and controls
├── CIS Controls = WHAT to do (18 security controls, prioritized)
├── CIS Benchmarks = HOW to configure (specific configs for AWS, K8s, etc.)
├── Prescriptive, actionable, and technically specific
└── Most commonly used in CSPM tools (CrowdStrike, Wiz, Prisma Cloud)

IMPLEMENTATION GROUPS (IG):
┌────────────────────────────────────────────────────────────────────┐
│  IG1 (Essential Cyber Hygiene)  →  Small org, limited IT staff     │
│  IG2 (Enterprise Level)         →  Mid-size, dedicated IT/Security │
│  IG3 (Comprehensive)            →  Regulated, advanced threats     │
└────────────────────────────────────────────────────────────────────┘

THE 18 CIS CONTROLS (v8):
┌────┬──────────────────────────────────────────────────────────────┐
│ #  │ Control Name                              │ IG1 │ IG2 │ IG3 │
├────┼──────────────────────────────────────────────────────────────┤
│  1 │ Inventory & Control of Enterprise Assets   │  ✅ │  ✅ │  ✅ │
│  2 │ Inventory & Control of Software Assets     │  ✅ │  ✅ │  ✅ │
│  3 │ Data Protection                            │  ✅ │  ✅ │  ✅ │
│  4 │ Secure Configuration                       │  ✅ │  ✅ │  ✅ │
│  5 │ Account Management                         │  ✅ │  ✅ │  ✅ │
│  6 │ Access Control Management                  │  ✅ │  ✅ │  ✅ │
│  7 │ Continuous Vulnerability Management        │     │  ✅ │  ✅ │
│  8 │ Audit Log Management                       │     │  ✅ │  ✅ │
│  9 │ Email & Web Browser Protections            │     │  ✅ │  ✅ │
│ 10 │ Malware Defenses                           │  ✅ │  ✅ │  ✅ │
│ 11 │ Data Recovery                              │  ✅ │  ✅ │  ✅ │
│ 12 │ Network Infrastructure Management          │     │  ✅ │  ✅ │
│ 13 │ Network Monitoring & Defense               │     │     │  ✅ │
│ 14 │ Security Awareness Training                │  ✅ │  ✅ │  ✅ │
│ 15 │ Service Provider Management                │     │  ✅ │  ✅ │
│ 16 │ Application Software Security              │     │  ✅ │  ✅ │
│ 17 │ Incident Response Management               │  ✅ │  ✅ │  ✅ │
│ 18 │ Penetration Testing                        │     │     │  ✅ │
└────┴──────────────────────────────────────────────────────────────┘

CIS BENCHMARKS FOR CLOUD (Used in CSPM):
├── CIS AWS Foundations Benchmark v3.0 (125+ checks)
│   ├── Section 1: IAM (MFA, access keys, password policy)
│   ├── Section 2: Storage (S3 encryption, logging)
│   ├── Section 3: Logging (CloudTrail, Config, Flow Logs)
│   ├── Section 4: Monitoring (CloudWatch alarms)
│   └── Section 5: Networking (SGs, NACLs, VPC settings)
│
├── CIS EKS Benchmark v1.4
│   ├── Control Plane (API server, etcd, scheduler)
│   ├── Worker Nodes (kubelet, container runtime)
│   ├── Policies (RBAC, PSA, NetworkPolicies)
│   └── Managed Services (EKS-specific settings)
│
├── CIS Docker Benchmark v1.6
│   ├── Host Configuration
│   ├── Docker Daemon Configuration
│   ├── Container Images & Runtime
│   └── Docker Security Operations
│
└── CIS Azure / GCP Benchmarks

HOW CIS IS USED IN CSPM TOOLS:
┌──────────────┬──────────────────────────────────────────────────┐
│  CSPM Tool    │  CIS Integration                                │
├──────────────┼──────────────────────────────────────────────────┤
│ CrowdStrike  │ IOM rules mapped to CIS controls automatically  │
│ Wiz          │ Built-in CIS compliance dashboard + auto-mapping │
│ Prisma Cloud │ CIS policies as RQL-based config checks          │
│ AWS Config   │ CIS Conformance Pack (managed rules)             │
│ SecurityHub  │ CIS AWS Foundations as a built-in standard        │
└──────────────┴──────────────────────────────────────────────────┘
```

## 1.3 NIST (National Institute of Standards & Technology) — Deep Dive

```
NIST CYBERSECURITY FRAMEWORK (CSF) v2.0 — THE "ROSETTA STONE"
══════════════════════════════════════════════════════════════

WHAT IS NIST CSF:
├── Created by US government (NIST), but adopted globally
├── Provides a STRATEGIC framework for managing cybersecurity risk
├── Organized into 6 core Functions (added GOVERN in v2.0)
├── Maps to nearly every other framework (CIS, PCI, HIPAA, SOC2)
└── Best used as: the "backbone" of your security program

THE 6 FUNCTIONS (NIST CSF v2.0):

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  GOVERN  │→ │ IDENTIFY │→ │ PROTECT  │→ │ DETECT   │→ │ RESPOND  │→ │ RECOVER  │
│          │  │          │  │          │  │          │  │          │  │          │
│ Risk     │  │ Asset    │  │ Access   │  │ Monitor  │  │ IR Plan  │  │ Backup   │
│ Strategy │  │ Inventory│  │ Control  │  │ Logs     │  │ Contain  │  │ Restore  │
│ Policy   │  │ Risk     │  │ Encrypt  │  │ SIEM     │  │ Eradicate│  │ Lessons  │
│ Oversight│  │ Assess   │  │ Training │  │ Alerting │  │ Notify   │  │ Improve  │
│ Supply   │  │ Business │  │ Security │  │ Anomaly  │  │ Forensics│  │ Comms    │
│ Chain    │  │ Context  │  │ Config   │  │ Detect   │  │ Report   │  │ Test     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘

NIST 800-53 VS NIST CSF:
┌──────────────────┬─────────────────────────────────────────────┐
│  NIST CSF        │  Strategic framework — WHAT to do            │
│                  │  6 Functions → 22 Categories → 106 Subcats   │
│                  │  Used by: Everyone (voluntary)                │
├──────────────────┼─────────────────────────────────────────────┤
│  NIST 800-53     │  Detailed controls catalog — HOW to do it    │
│                  │  20 Control Families → 1000+ Individual Ctrls │
│                  │  Used by: Federal agencies (mandatory), FedRAMP│
│                  │  Maps directly to CSF subcategories            │
└──────────────────┴─────────────────────────────────────────────┘

NIST CSF MAPPED TO CLOUD SECURITY ACTIVITIES:
┌──────────────┬────────────────────────────────────────────────────┐
│ CSF Function │ Cloud Security Activities                          │
├──────────────┼────────────────────────────────────────────────────┤
│ GOVERN       │ Define cloud security policy, risk tolerance,      │
│              │ roles/responsibilities, supply chain requirements  │
├──────────────┼────────────────────────────────────────────────────┤
│ IDENTIFY     │ Cloud asset inventory (CSPM discovery), risk       │
│              │ assessment, data classification, SBOM management   │
├──────────────┼────────────────────────────────────────────────────┤
│ PROTECT      │ IAM least-privilege, encryption (KMS), IaC         │
│              │ scanning, SAST/SCA in pipeline, container hardening│
├──────────────┼────────────────────────────────────────────────────┤
│ DETECT       │ CSPM continuous monitoring, runtime detection      │
│              │ (IOAs), SIEM integration, CloudTrail analysis      │
├──────────────┼────────────────────────────────────────────────────┤
│ RESPOND      │ Incident response playbooks, auto-remediation,     │
│              │ SOC investigation, containment automation          │
├──────────────┼────────────────────────────────────────────────────┤
│ RECOVER      │ Backup/restore (S3 versioning, RDS snapshots),     │
│              │ DR testing, post-incident lessons learned          │
└──────────────┴────────────────────────────────────────────────────┘
```

## 1.4 SOC 2 (Service Organization Control Type 2) — Deep Dive

```
SOC 2 — TRUST SERVICES CRITERIA (TSC)
══════════════════════════════════════

WHAT IS SOC 2:
├── Auditing standard created by AICPA (American Institute of CPAs)
├── Proves to CUSTOMERS that you protect their data properly
├── Audit by a licensed CPA firm → SOC 2 Report (Type I or Type II)
├── Type I = Point-in-time assessment (controls ARE designed)
├── Type II = Period assessment (controls OPERATE effectively over 3-12 months)
└── Required by: Most enterprise B2B SaaS customers during vendor evaluation

5 TRUST SERVICES CRITERIA:
┌────────────────────┬──────────────────────────────────────────────────┐
│ Criteria           │ What It Covers                                   │
├────────────────────┼──────────────────────────────────────────────────┤
│ 1. SECURITY        │ Protection against unauthorized access            │
│    (Required)      │ Firewalls, encryption, MFA, IDS, logging,        │
│                    │ access control, vulnerability management          │
├────────────────────┼──────────────────────────────────────────────────┤
│ 2. AVAILABILITY    │ System is available per SLA                       │
│    (Optional)      │ Uptime monitoring, DR, backups, capacity planning│
├────────────────────┼──────────────────────────────────────────────────┤
│ 3. PROCESSING      │ System processing is complete & accurate          │
│    INTEGRITY       │ Data validation, error handling, quality checks   │
│    (Optional)      │                                                   │
├────────────────────┼──────────────────────────────────────────────────┤
│ 4. CONFIDENTIALITY │ Confidential data is protected                    │
│    (Optional)      │ Encryption at rest/transit, access controls,     │
│                    │ data classification, NDA enforcement              │
├────────────────────┼──────────────────────────────────────────────────┤
│ 5. PRIVACY         │ Personal data handled per privacy notice          │
│    (Optional)      │ Consent, data minimization, retention, disposal  │
└────────────────────┴──────────────────────────────────────────────────┘

SOC 2 CLOUD SECURITY EVIDENCE YOU'D PROVIDE:
├── SECURITY: Wiz/Falcon CSPM dashboard showing posture score
├── SECURITY: IAM access reviews, MFA enforcement evidence
├── SECURITY: SAST/SCA scan results from CI/CD pipeline
├── SECURITY: Incident response plan + test results
├── AVAILABILITY: Uptime reports, DR test evidence
├── CONFIDENTIALITY: KMS encryption policies, key rotation logs
├── PROCESSING INTEGRITY: Pipeline test results, deployment logs
└── PRIVACY: Data classification tags, retention policies

SOC 2 COMMON CONTROLS (Cloud Security Focus):
├── CC6.1: Logical access controls (IAM policies, RBAC)
├── CC6.2: Restrict access based on job function (least privilege)
├── CC6.3: Remove access when no longer needed (offboarding)
├── CC6.6: Data transmission security (TLS, VPN)
├── CC6.7: Restrict data movement (DLP, VPC endpoints)
├── CC7.1: Detect unauthorized changes (CSPM, Config monitoring)
├── CC7.2: Monitor system components (CloudWatch, SIEM)
├── CC7.3: Evaluate detected events (SOC triage, IR process)
├── CC8.1: Change management (CI/CD, IaC, PR reviews)
└── CC9.1: Risk mitigation (Vulnerability management, patching)
```

## 1.5 PCI-DSS v4.0 (Payment Card Industry Data Security Standard)

```
PCI-DSS v4.0 — 12 REQUIREMENTS
═══════════════════════════════

WHEN IT APPLIES:
├── You store, process, or transmit credit card data
├── Even if you use Stripe/PayPal — you may still be in scope
├── Levels: L1 (>6M transactions) → L4 (<20K e-commerce transactions)
└── Non-compliance = Fines ($5K-$100K/month), ban from processing

THE 12 REQUIREMENTS (Grouped by Goal):
┌──────────────────────────────────────────────────────────────────────┐
│ GOAL: BUILD & MAINTAIN A SECURE NETWORK                              │
│  1. Install and maintain network security controls (firewalls, SGs)  │
│  2. Apply secure configurations to all system components             │
│                                                                      │
│ GOAL: PROTECT ACCOUNT DATA                                           │
│  3. Protect stored account data (encryption, masking, tokenization)  │
│  4. Protect data in transit (TLS 1.2+, no SSL/early TLS)            │
│                                                                      │
│ GOAL: MAINTAIN A VULNERABILITY MANAGEMENT PROGRAM                    │
│  5. Protect from malicious software (anti-malware, EDR)              │
│  6. Develop and maintain secure systems (SAST, patching, SDLC)      │
│                                                                      │
│ GOAL: IMPLEMENT STRONG ACCESS CONTROL                                │
│  7. Restrict access by business need-to-know (least privilege)       │
│  8. Identify users and authenticate access (MFA, strong passwords)  │
│  9. Restrict physical access to cardholder data                      │
│                                                                      │
│ GOAL: REGULARLY MONITOR AND TEST NETWORKS                            │
│ 10. Log and monitor all access (SIEM, CloudTrail, audit logs)       │
│ 11. Regularly test security (vuln scans, pen tests, DAST)           │
│                                                                      │
│ GOAL: MAINTAIN AN INFORMATION SECURITY POLICY                        │
│ 12. Support security with organizational policies                    │
└──────────────────────────────────────────────────────────────────────┘

PCI-DSS v4.0 NEW REQUIREMENTS (2025 Mandatory):
├── Req 3.5.1.2: Disk-level encryption no longer sufficient (need field/column-level)
├── Req 6.4.2: WAF required for all public-facing web applications
├── Req 8.3.6: MFA for ALL access to CDE (not just admin)
├── Req 11.6.1: Detect payment page tampering (Magecart protection)
├── Req 12.3.1: Targeted risk analysis for flexible requirements
└── Req 5.4.1: Anti-phishing mechanisms (DMARC, SPF, DKIM)

PCI-DSS CLOUD MAPPING:
┌──────────────┬────────────────────────────────────────────────────┐
│ PCI Req      │ AWS Cloud Implementation                           │
├──────────────┼────────────────────────────────────────────────────┤
│ Req 1 (Net)  │ VPC, Security Groups, NACLs, AWS Firewall Manager │
│ Req 2 (Config)│ AWS Config, CIS Benchmarks, CSPM hardening       │
│ Req 3 (Data) │ KMS encryption, S3 SSE, RDS Encryption, Tokenize  │
│ Req 4 (TLS)  │ ACM certificates, ALB HTTPS, API Gateway TLS 1.2 │
│ Req 5 (AV)   │ CrowdStrike Falcon EDR on EC2, container runtime  │
│ Req 6 (DevSec)│ SAST/SCA/DAST in pipeline, patch management      │
│ Req 7 (Access)│ IAM least privilege, IRSA, SCPs, permission bndry │
│ Req 8 (Auth) │ SSO+MFA, IAM password policy, no shared accounts  │
│ Req 10 (Log) │ CloudTrail, VPC Flow Logs, S3 access logs, SIEM   │
│ Req 11 (Test)│ AWS Inspector, DAST scans, quarterly pen tests     │
│ Req 12 (Pol) │ Security policies, training, risk assessments      │
└──────────────┴────────────────────────────────────────────────────┘
```

## 1.6 HIPAA (Health Insurance Portability and Accountability Act)

```
HIPAA — SAFEGUARDS FOR PROTECTED HEALTH INFORMATION (PHI)
═════════════════════════════════════════════════════════

WHEN IT APPLIES:
├── You handle Protected Health Information (PHI)
├── Covered Entities: Hospitals, insurance, providers
├── Business Associates: Any vendor handling PHI for a covered entity
└── Penalties: $100–$50,000 per violation, up to $1.5M/year per category

THREE TYPES OF SAFEGUARDS:
┌──────────────────────────────────────────────────────────────────────┐
│ 1. ADMINISTRATIVE SAFEGUARDS                                         │
│    ├── Risk assessment (annual)                                      │
│    ├── Security policies and procedures                              │
│    ├── Workforce training                                            │
│    ├── Incident response plan                                        │
│    ├── Business Associate Agreements (BAAs)                          │
│    └── Access management procedures                                  │
│                                                                      │
│ 2. PHYSICAL SAFEGUARDS                                               │
│    ├── Facility access controls                                      │
│    ├── Workstation security                                          │
│    ├── Device and media controls                                     │
│    └── AWS Shared Responsibility: AWS handles physical (SOC reports) │
│                                                                      │
│ 3. TECHNICAL SAFEGUARDS                                              │
│    ├── Access Control: Unique user IDs, emergency access, auto-logoff│
│    ├── Audit Controls: Logging all PHI access (CloudTrail)           │
│    ├── Integrity Controls: Ensure PHI not altered improperly         │
│    ├── Person Authentication: MFA, strong passwords                  │
│    └── Transmission Security: Encryption in transit (TLS)            │
└──────────────────────────────────────────────────────────────────────┘

HIPAA IN AWS:
├── Use HIPAA-eligible AWS services ONLY (not all services are eligible)
│   ├── Eligible: EC2, S3, RDS, Lambda, EKS, ECS, DynamoDB, etc.
│   ├── NOT eligible: Some ML, analytics services (check AWS list)
│   └── AWS BAA must be signed before handling PHI
├── Encryption: REQUIRED at rest (KMS) AND in transit (TLS)
├── Logging: CloudTrail + VPC Flow Logs + S3 access logs (REQUIRED)
├── Access: IAM least privilege + MFA + audit trail for PHI access
└── Backup: Regular backups with encryption, tested recovery

HIPAA BREACH NOTIFICATION:
├── Notify affected individuals within 60 days
├── Notify HHS (Health & Human Services) 
│   ├── <500 affected: Annual report
│   └── ≥500 affected: Within 60 days + media notification
└── Documentation: 6-year retention of all security activities
```

## 1.7 Unified Framework Comparison Matrix

```
FRAMEWORK COMPARISON — SIDE BY SIDE
═══════════════════════════════════

┌────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Dimension     │ CIS      │ NIST CSF │ SOC 2    │ PCI-DSS  │ HIPAA    │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ TYPE           │ Best     │ Framework│ Audit    │ Regulation│ Regulation
│                │ Practice │ /Guide   │ Standard │          │          │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ MANDATORY?     │ No       │ No*      │ No**     │ YES      │ YES      │
│                │ (vol.)   │ (*Fed)   │ (*cust.) │ (cards)  │ (PHI)    │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ WHO AUDITS?    │ Self     │ Self     │ CPA firm │ QSA/ISA  │ HHS/OCR  │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ FOCUS          │ Technical│ Risk-    │ Trust &  │ Payment  │ Health   │
│                │ controls │ based    │ assurance│ data     │ data     │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ STRUCTURE      │ 18 Ctrls │ 6 Funcs  │ 5 TSC    │ 12 Reqs  │ 3 Safe-  │
│                │ 153 Safe │ 22 Cats  │          │ ~300 Reqs│ guards   │
│                │ guards   │ 106 Sub  │          │          │          │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ PENALTY        │ None     │ None     │ Lose     │ Fines    │ Fines    │
│                │          │ (rep.)   │ customers│ $5K-100K │ $100-50K │
│                │          │          │          │ /month   │ /violation│
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ CLOUD USE CASE │ CSPM     │ Security │ Vendor   │ E-comm,  │ Health-  │
│                │ baseline │ program  │ trust    │ fintech, │ tech,    │
│                │          │ design   │          │ payments │ pharma   │
├────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ IN CSPM TOOLS? │ ✅ Built │ ✅ Mapped│ ✅ Mapped│ ✅ Built │ ✅ Mapped │
│                │ -in      │          │          │ -in      │          │
└────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

OVERLAPPING CONTROLS (Implement Once, Map to Many):
├── ACCESS CONTROL → CIS 5,6 | NIST PR.AC | SOC2 CC6.1 | PCI 7,8 | HIPAA §164.312(a)
├── ENCRYPTION     → CIS 3   | NIST PR.DS | SOC2 CC6.1 | PCI 3,4 | HIPAA §164.312(e)
├── LOGGING        → CIS 8   | NIST DE.AE | SOC2 CC7.2 | PCI 10  | HIPAA §164.312(b)
├── INCIDENT RESP  → CIS 17  | NIST RS.RP | SOC2 CC7.3 | PCI 12  | HIPAA §164.308(a)(6)
├── VULN MGMT      → CIS 7   | NIST ID.RA | SOC2 CC7.1 | PCI 6,11| HIPAA §164.308(a)(1)
└── CHANGE MGMT    → CIS 4   | NIST PR.IP | SOC2 CC8.1 | PCI 6   | HIPAA §164.308(a)(8)

MNEMONIC: "ALL EVIL LIVES IN CLOUD"
├── A = Access Control
├── E = Encryption
├── L = Logging
├── I = Incident Response
├── V = Vulnerability Management
├── C = Change Management
└── These 6 controls satisfy 70%+ of ALL framework requirements
```

---

# PART 2: DEVSECOPS PIPELINE SECURITY & AUTOMATION

---

## 2.1 The 7-Stage Secure DevSecOps Pipeline

```
THE DEVSECOPS PIPELINE — 7 SECURITY GATES
══════════════════════════════════════════

   DEVELOPER                CI/CD PIPELINE                    PRODUCTION
   ┌──────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌──────────┐
   │STAGE1│ → │STG 2│ → │STG 3│ → │STG 4│ → │STG 5│ → │STG 6│ → │ STAGE 7  │
   │ IDE  │   │COMMIT│  │BUILD│   │TEST │   │STAGE│   │DEPLOY│  │ RUNTIME  │
   │      │   │      │   │     │   │     │   │     │   │     │   │          │
   │SAST  │   │Pre-  │   │SCA  │   │DAST │   │Pen  │   │KAC  │   │CSPM/CWPP│
   │Lint  │   │commit│   │SAST │   │IAST │   │Test │   │Image│   │EDR/CDR  │
   │Secret│   │hooks │   │Image│   │Fuzz │   │     │   │Sign │   │WAF/IDS  │
   │Detect│   │      │   │Scan │   │     │   │     │   │     │   │SIEM     │
   └──────┘   └─────┘   └─────┘   └─────┘   └─────┘   └─────┘   └──────────┘
   
   🟢 Cheapest                                             🔴 Most Expensive
   to fix here                                              to fix here

SHIFT-LEFT COST MULTIPLIER:
├── Fix in IDE:            1x cost
├── Fix in Code Review:    5x cost
├── Fix in Build/Test:     10x cost
├── Fix in Staging:        50x cost
├── Fix in Production:     100x cost
├── Fix after Breach:      1000x cost
└── CONCLUSION: Shift EVERY check as far left as possible
```

## 2.2 Stage-by-Stage Tool Mapping

```
┌──────────┬────────────────────┬────────────────────┬──────────────────────────┐
│ Stage    │ Security Activity  │ Tools              │ Action on Failure        │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 1. IDE   │ Real-time code     │ SonarLint          │ Yellow/red warning in IDE│
│          │ analysis           │ Snyk IDE plugin     │ Suggest fix inline       │
│          │ Secret detection   │ GitLeaks (pre-save)│ Block save/commit        │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 2. COMMIT│ Pre-commit hooks   │ pre-commit framework│ Block git commit        │
│          │ Secret scanning    │ detect-secrets      │ Reject push             │
│          │ Linting            │ tfsec (IaC lint)    │ Developer must fix first│
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 3. BUILD │ Source code scan   │ Checkmarx, SonarQube│ FAIL pipeline          │
│ (CI)     │ Dependency scan    │ Snyk, OWASP DepChk │ FAIL on Critical CVE    │
│          │ IaC scan           │ Checkov, tfsec      │ FAIL on HIGH+ IaC issue │
│          │ Container scan     │ Trivy, Snyk, Grype │ FAIL on Critical image  │
│          │ SBOM generation    │ Syft, Trivy         │ Generate & store SBOM   │
│          │ License check      │ FOSSA, Snyk         │ WARN on GPL-3.0 in prod │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 4. TEST  │ DAST scan          │ OWASP ZAP, Burp    │ FAIL on High+           │
│          │ API security test  │ Postman, ZAP API    │ Block promotion         │
│          │ Fuzz testing       │ AFL, OSS-Fuzz       │ Report findings         │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 5. STAGE │ Full pen test      │ Manual + Automated  │ Go/no-go for prod       │
│          │ Compliance check   │ InSpec, Cloud Custdn│ Verify all controls     │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 6. DEPLOY│ Image signature    │ AWS Signer, Cosign  │ Reject unsigned images  │
│          │ Admission control  │ CrowdStrike KAC,    │ Block non-compliant pods│
│          │                    │ OPA Gatekeeper       │                         │
│          │ Config validation  │ AWS Config, Falcon   │ Reject bad configs      │
├──────────┼────────────────────┼────────────────────┼──────────────────────────┤
│ 7. RUN   │ Runtime protection │ CrowdStrike Falcon  │ Kill malicious process  │
│          │ CSPM monitoring    │ Falcon, Wiz, Prisma │ Alert + auto-remediate  │
│          │ WAF                │ AWS WAF, CloudFlare │ Block malicious requests│
│          │ SIEM               │ Splunk, Sentinel    │ Correlate + investigate │
│          │ CDR                │ Wiz Defend, Falcon  │ Cloud threat detection  │
└──────────┴────────────────────┴────────────────────┴──────────────────────────┘
```

---

# PART 3: SCA — SOFTWARE COMPOSITION ANALYSIS

---

## 3.1 What is SCA?

```
SCA — SOFTWARE COMPOSITION ANALYSIS
════════════════════════════════════

DEFINITION:
├── Scans your APPLICATION'S DEPENDENCIES (third-party libraries)
├── for known vulnerabilities (CVEs), license compliance, and outdated packages
├── Does NOT scan YOUR code — scans what your code IMPORTS
└── "Are you using vulnerable or risky open-source components?"

WHY SCA MATTERS:
├── 80-90% of modern applications are open-source code
├── Your app may have 10 direct dependencies and 200+ transitive deps
├── One vulnerable transitive dependency = your app is vulnerable
├── Log4Shell (CVE-2021-44228): One library → millions of apps affected
├── xz Utils backdoor (CVE-2024-3094): Supply chain compromise
└── SCA is your defense against SOFTWARE SUPPLY CHAIN ATTACKS

WHAT SCA CHECKS:
┌──────────────────────┬──────────────────────────────────────────────┐
│ Check Type           │ What It Finds                                │
├──────────────────────┼──────────────────────────────────────────────┤
│ Known Vulnerabilities│ CVEs in packages (NVD, GitHub Advisory DB)   │
│ License Compliance   │ GPL-3.0 in commercial code? AGPL in SaaS?  │
│ Outdated Packages    │ Using package v2.1 when v5.0 is available   │
│ Malicious Packages   │ Typosquatting (lodash vs lodas)             │
│ SBOM Generation      │ Complete inventory of all components         │
│ Transitive Deps      │ Vuln in dep-of-dep-of-dep                   │
│ Fix Guidance         │ "Upgrade react-scripts from 4.0 to 5.0"    │
│ Reachability         │ Is the vulnerable function actually called?  │
└──────────────────────┴──────────────────────────────────────────────┘

SCA SCAN FLOW:
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Source Code  │     │ SCA Scanner  │     │ Vulnerability│     │ Results  │
│ Repository   │ →   │ Parses:      │ →   │ Database     │ →   │          │
│              │     │ package.json │     │ NVD          │     │ CVEs     │
│              │     │ requirements │     │ GitHub Adv.  │     │ Licenses │
│              │     │ go.mod       │     │ OSV          │     │ SBOM     │
│              │     │ pom.xml      │     │ Snyk DB      │     │ Fixes    │
│              │     │ Gemfile.lock │     │              │     │          │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────┘
```

## 3.2 SCA Tools Comparison

```
┌──────────────────┬─────────────┬──────────────────────────────────────────┐
│ Tool             │ Type        │ Key Features                             │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Snyk Open Source │ Commercial  │ Best dev experience, auto-fix PRs,       │
│                  │ (free tier) │ reachability analysis, IDE integration   │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ OWASP Dep-Check  │ Open Source │ Java/.NET focus, NVD-backed, free,      │
│                  │             │ good for regulated environments          │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Trivy            │ Open Source │ All-in-one: SCA + container + IaC scan, │
│                  │             │ lightweight, fast, CI-friendly           │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Grype            │ Open Source │ Container + SCA, by Anchore, SBOM-aware │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ GitHub Dependabot│ Free (GH)   │ Auto-creates PRs for vuln deps, free    │
│                  │             │ for GitHub repos, easy to enable         │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Checkmarx SCA    │ Enterprise  │ Deep transitive analysis, license mgmt, │
│                  │             │ compliance reporting                     │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Black Duck       │ Enterprise  │ Most complete license database, M&A     │
│  (Synopsys)      │             │ due diligence, comprehensive SBOM       │
└──────────────────┴─────────────┴──────────────────────────────────────────┘
```

## 3.3 SCA in CI/CD Pipeline — Implementation

```yaml
# ==================================================================
# SCA IN CI/CD — GITHUB ACTIONS EXAMPLE
# ==================================================================

name: SCA Security Scan

on:
  pull_request:
    paths:
      - '**/*.json'        # package.json, package-lock.json
      - '**/*.lock'        # yarn.lock, Gemfile.lock, Pipfile.lock
      - '**/requirements*' # requirements.txt
      - '**/go.mod'
      - '**/go.sum'

jobs:
  sca-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ---- Method 1: Snyk SCA ----
      - name: Snyk Dependency Check
        uses: snyk/actions/node@master   # or /python, /golang, /maven
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: >
            --severity-threshold=high
            --fail-on=upgradable
        # Fails if HIGH+ vuln with available upgrade

      # ---- Method 2: Trivy SCA ----
      - name: Trivy Filesystem Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'              # Fail pipeline
          format: 'sarif'
          output: 'trivy-sca.sarif'

      # ---- Method 3: OWASP Dependency-Check ----
      - name: OWASP Dependency-Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'my-app'
          path: '.'
          format: 'HTML'
          args: >
            --failOnCVSS 7
            --enableRetired

      # ---- Generate SBOM ----
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          format: spdx-json
          output-file: sbom.spdx.json
          # Upload SBOM as build artifact for compliance/audit
      
      - name: Upload SBOM
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.spdx.json
```

## 3.4 SBOM (Software Bill of Materials)

```
SBOM — YOUR APPLICATION'S INGREDIENT LIST
═════════════════════════════════════════

WHAT IS AN SBOM:
├── A machine-readable inventory of ALL components in your software
├── Like a nutrition label for software
├── Includes: name, version, supplier, license, dependencies
├── Required by US Executive Order 14028 for federal software
└── Generated automatically during CI/CD build

SBOM FORMATS:
├── SPDX (Linux Foundation) — Most widely adopted, ISO standard
├── CycloneDX (OWASP) — Security-focused, supports VEX
└── SWID Tags (ISO/IEC 19770) — Less common

SBOM TOOLS:
├── Syft (by Anchore) — Generate SBOMs from code, containers, filesystems
├── Trivy — Generates SBOM + scans in one step
├── CycloneDX CLI — Official CycloneDX generator
└── cdxgen — Multi-language SBOM generator

WHY SBOMs MATTER FOR INCIDENT RESPONSE:
┌───────────────────────────────────────────────────────────────────┐
│ SCENARIO: New Critical CVE announced (like Log4Shell)            │
│                                                                   │
│ WITHOUT SBOM:                                                     │
│  ├── Panic: "Do we use this library?"                            │
│  ├── Manual search across 200 repos                              │
│  ├── Takes days to determine impact                              │
│  └── Some teams miss it → remain vulnerable                     │
│                                                                   │
│ WITH SBOM:                                                        │
│  ├── Query SBOM database: "Which apps contain log4j?"            │
│  ├── Instant answer: "3 services: auth-api, payment-service,     │
│  │    notification-service"                                      │
│  ├── Patch all 3 within hours                                    │
│  └── Confidence: "No other services are affected"               │
└───────────────────────────────────────────────────────────────────┘
```

---

# PART 4: SAST — STATIC APPLICATION SECURITY TESTING

---

## 4.1 What is SAST?

```
SAST — STATIC APPLICATION SECURITY TESTING
═══════════════════════════════════════════

DEFINITION:
├── Scans YOUR source code (or bytecode/binary) for security vulnerabilities
├── WITHOUT executing the application (analyzes code "at rest")
├── WHITE-BOX testing — has full access to source code
├── Finds: SQL injection, XSS, insecure crypto, hardcoded secrets,
│   buffer overflows, path traversal, command injection
└── "Are YOUR developers writing insecure code?"

HOW SAST WORKS:
┌─────────────────────────────────────────────────────────────────┐
│                    SAST ANALYSIS ENGINE                          │
│                                                                  │
│  SOURCE CODE  →  PARSE  →  BUILD  →  DATA FLOW  →  PATTERN  →  │
│                  (AST)     MODEL     ANALYSIS      MATCHING     │
│                                       (taint)      (rules)     │
│                                                                  │
│  1. Parse code into Abstract Syntax Tree (AST)                  │
│  2. Build a model of the application (call graph, data flow)    │
│  3. Taint Analysis: Track user input (sources) through code     │
│     to dangerous operations (sinks)                             │
│  4. If tainted data reaches a sink without sanitization → VULN  │
│                                                                  │
│  EXAMPLE:                                                        │
│  Source: request.getParameter("name")    ← User input (tainted) │
│  Flow:   String name = request.getParameter("name");            │
│          String query = "SELECT * FROM users WHERE name='" + name│
│  Sink:   statement.execute(query);       ← SQL execution        │
│  RESULT: SQL INJECTION (CWE-89) — tainted input reaches SQL     │
│          without parameterization                                │
└─────────────────────────────────────────────────────────────────┘

WHAT SAST FINDS (OWASP Top 10 Coverage):
├── A03: Injection (SQL, Command, LDAP, XPath)
├── A02: Cryptographic Failures (weak algorithms, hardcoded keys)
├── A07: Cross-Site Scripting (XSS) — reflected, stored, DOM-based
├── A04: Insecure Design (improper error handling, logic flaws)
├── A08: Software & Data Integrity (deserialization, unsigned code)
├── Hardcoded secrets (passwords, API keys, tokens in source)
├── Buffer overflows (C/C++)
├── Path traversal
├── Race conditions
└── Null pointer dereference

WHAT SAST CANNOT FIND:
├── Authentication/authorization flaws (needs runtime context)
├── Configuration issues in deployed environments
├── Business logic vulnerabilities
├── Runtime-specific issues (SSRF, timing attacks)
└── Issues in compiled third-party libraries (SCA handles this)
```

## 4.2 SAST Tools Comparison

```
┌──────────────────┬─────────────┬─────────────┬──────────────────────────┐
│ Tool             │ Type        │ Languages   │ Key Strengths            │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ Checkmarx SAST   │ Enterprise  │ 25+ langs   │ Deep analysis, custom    │
│                  │             │             │ queries, lowest FP rate  │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ SonarQube        │ Open Source │ 30+ langs   │ Code quality + security, │
│                  │ + Commercial│             │ great CI integration     │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ Snyk Code        │ Commercial  │ 10+ langs   │ AI-powered, fastest scan,│
│                  │ (free tier) │             │ best developer UX        │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ Semgrep          │ Open Source │ 20+ langs   │ Custom rules engine,     │
│                  │             │             │ pattern-matching, fast   │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ Bandit           │ Open Source │ Python only │ Python-specific, free,   │
│                  │             │             │ great for Python shops   │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ ESLint Security  │ Open Source │ JavaScript  │ JS/TS security rules,    │
│  (eslint-plugin) │             │ TypeScript  │ integrates with ESLint   │
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ CodeQL           │ Free (GH)   │ 6 langs     │ GitHub-native, semantic  │
│  (GitHub)        │             │             │ analysis, community rules│
├──────────────────┼─────────────┼─────────────┼──────────────────────────┤
│ Fortify          │ Enterprise  │ 25+ langs   │ Enterprise-grade, strong │
│  (MicroFocus)    │             │             │ compliance reporting     │
└──────────────────┴─────────────┴─────────────┴──────────────────────────┘
```

## 4.3 SAST in CI/CD Pipeline — Implementation

```yaml
# ==================================================================
# SAST IN CI/CD — GITHUB ACTIONS EXAMPLE
# ==================================================================

name: SAST Security Scan

on:
  pull_request:
    paths:
      - 'src/**'
      - 'app/**'
      - '*.py'
      - '*.js'
      - '*.java'

jobs:
  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ---- Method 1: SonarQube SAST ----
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST }}
        with:
          args: >
            -Dsonar.projectKey=my-app
            -Dsonar.sources=src/
            -Dsonar.qualitygate.wait=true

      # ---- Method 2: Semgrep SAST ----
      - name: Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: >
            p/owasp-top-ten
            p/security-audit
            p/secrets
          generateSarif: '1'
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_TOKEN }}
      
      # ---- Method 3: CodeQL (GitHub-native) ----
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, python

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

      # ---- Secret Detection (Critical!) ----
      - name: GitLeaks Secret Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        # Fails if any secrets found in code or git history
```

---

# PART 5: DAST — DYNAMIC APPLICATION SECURITY TESTING

---

## 5.1 What is DAST?

```
DAST — DYNAMIC APPLICATION SECURITY TESTING
════════════════════════════════════════════

DEFINITION:
├── Tests the RUNNING application from the OUTSIDE
├── BLACK-BOX testing — no source code access needed
├── Sends malicious requests and analyzes responses
├── Simulates a real attacker probing for vulnerabilities
├── Finds runtime-specific issues that SAST cannot detect
└── "Can an attacker break into your running application?"

HOW DAST WORKS:
┌─────────────────────────────────────────────────────────────────┐
│                    DAST SCANNING ENGINE                          │
│                                                                  │
│  RUNNING APP  ←  CRAWL  →  ATTACK  →  ANALYZE  →  REPORT       │
│  (staging)       (map)     (payloads)  (responses) (findings)   │
│                                                                  │
│  1. CRAWL: Spider the application to discover endpoints,        │
│     forms, APIs, parameters                                      │
│  2. ATTACK: Send crafted payloads to each input:                │
│     ├── SQL injection strings: ' OR 1=1 --                      │
│     ├── XSS probes: <script>alert(1)</script>                   │
│     ├── Path traversal: ../../../../etc/passwd                  │
│     ├── Command injection: ; ls -la                             │
│     ├── Header manipulation: Host: evil.com                     │
│     └── Authentication bypass: Token manipulation               │
│  3. ANALYZE: Did the response indicate a vulnerability?         │
│     ├── SQL error message in response = SQL injection           │
│     ├── Script executed in response = XSS                       │
│     ├── File contents in response = Path traversal              │
│     └── Different behavior = Logic flaw                         │
│  4. REPORT: Generate findings with severity, evidence, fix      │
└─────────────────────────────────────────────────────────────────┘

WHAT DAST FINDS (that SAST cannot):
├── Authentication & Session Management flaws
│   ├── Broken authentication (weak password policies)
│   ├── Session fixation / hijacking
│   ├── Missing session timeout
│   └── JWT token manipulation
├── Authorization flaws (Broken Access Control)
│   ├── IDOR (Insecure Direct Object Reference)
│   ├── Horizontal privilege escalation
│   ├── Vertical privilege escalation
│   └── Missing function-level access control
├── Server Configuration Issues
│   ├── Security headers missing (CSP, HSTS, X-Frame-Options)
│   ├── TLS/SSL misconfigurations
│   ├── Cookie flags missing (Secure, HttpOnly, SameSite)
│   ├── CORS misconfigurations
│   └── Information disclosure (stack traces, version headers)
├── Runtime-Specific Vulnerabilities
│   ├── SSRF (Server-Side Request Forgery)
│   ├── Race conditions
│   ├── HTTP request smuggling
│   └── Cache poisoning
└── API Security Issues
    ├── Mass assignment
    ├── Rate limiting absent
    ├── Improper input validation
    └── GraphQL introspection enabled
```

## 5.2 DAST Tools Comparison

```
┌──────────────────┬─────────────┬──────────────────────────────────────────┐
│ Tool             │ Type        │ Key Strengths                            │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ OWASP ZAP        │ Open Source │ Industry standard, free, active/passive  │
│                  │             │ scan, API scan, CI/CD friendly           │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Burp Suite Pro   │ Commercial  │ Best manual pen testing, great scanner,  │
│  (PortSwigger)   │ ($449/yr)   │ extensible via BApps                     │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Nuclei           │ Open Source │ Template-based scanning, 5000+ community │
│  (ProjectDiscov) │             │ templates, fast, CI-native               │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Invicti          │ Enterprise  │ Proof-based scanning (confirms vulns),   │
│  (ex-Netsparker) │             │ lowest false positive rate               │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Qualys WAS       │ Enterprise  │ Cloud-based, integrates with Qualys VMDR,│
│                  │             │ continuous scanning                      │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ HCL AppScan      │ Enterprise  │ DAST + SAST + IAST, compliance reporting │
│                  │             │                                          │
├──────────────────┼─────────────┼──────────────────────────────────────────┤
│ Arachni          │ Open Source │ Ruby-based, modular, REST API available  │
└──────────────────┴─────────────┴──────────────────────────────────────────┘
```

## 5.3 DAST in CI/CD Pipeline — Implementation

```yaml
# ==================================================================
# DAST IN CI/CD — GITHUB ACTIONS EXAMPLE (OWASP ZAP)
# ==================================================================

name: DAST Security Scan

on:
  push:
    branches: [main, staging]
  schedule:
    - cron: '0 2 * * 1'  # Weekly full scan Monday 2 AM

jobs:
  dast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Step 1: Deploy app to staging environment
      - name: Deploy to Staging
        run: |
          docker-compose up -d
          sleep 30  # Wait for app to start
          # Verify app is running
          curl -f http://localhost:8080/health || exit 1

      # Step 2: OWASP ZAP Baseline Scan (Quick — every PR)
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:8080'
          rules_file_name: 'zap-rules.tsv'   # Custom rule thresholds
          fail_action: 'warn'                  # Warn on baseline scan
          cmd_options: '-a -j'                 # Enable AJAX spider

      # Step 3: OWASP ZAP Full Scan (Thorough — weekly/release)
      - name: ZAP Full Scan
        if: github.ref == 'refs/heads/main'
        uses: zaproxy/action-full-scan@v0.9.0
        with:
          target: 'http://localhost:8080'
          fail_action: 'true'                  # FAIL on full scan
          cmd_options: '-a -j -T 60'           # 60 min timeout
      
      # Step 4: ZAP API Scan (for REST/GraphQL APIs)
      - name: ZAP API Scan
        uses: zaproxy/action-api-scan@v0.6.0
        with:
          target: 'http://localhost:8080/api/openapi.json'  # OpenAPI spec
          fail_action: 'true'
          format: openapi

      # Step 5: Upload results
      - name: Upload DAST Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: dast-report
          path: report_html.html
```

---

# PART 6: CLOUD WORKLOAD PROTECTION — CONTAINERS & SERVERLESS

---

## 6.1 Container Security — Full Lifecycle

```
CONTAINER SECURITY — FROM BUILD TO RUNTIME
═══════════════════════════════════════════

STAGE 1: IMAGE BUILD (Shift-Left)
├── Use minimal base images (distroless, alpine, scratch)
│   ├── ubuntu:22.04     → 77 MB, 200+ CVEs
│   ├── alpine:3.19      → 7 MB, 2-5 CVEs
│   ├── distroless/base  → 2 MB, 0-1 CVEs  ← BEST
│   └── scratch          → 0 MB, 0 CVEs (for static Go binaries)
│
├── Dockerfile Best Practices:
│   ├── USER: Add non-root user (USER 1000:1000)
│   ├── COPY: Use specific files, not COPY . (reduces attack surface)
│   ├── RUN: Combine commands to reduce layers
│   ├── HEALTHCHECK: Add for orchestrator health monitoring
│   ├── Labels: Add org.opencontainers.image.* labels for traceability
│   └── Pin versions: FROM node:20.11.0-alpine (NOT :latest)
│
├── SCA on Dockerfile:
│   ├── trivy image myapp:latest  → Find CVEs in image
│   ├── grype myapp:latest        → Alternative scanner
│   └── snyk container test myapp → With reachability analysis
│
└── Image Signing:
    ├── cosign sign myapp:latest  → Sign with Sigstore
    ├── Verify at admission: cosign verify myapp:latest
    └── Prevents supply chain tampering

STAGE 2: REGISTRY (Storage)
├── Use PRIVATE registry only (ECR, Harbor, GCR — NOT Docker Hub)
├── Enable auto-scanning on push (ECR Enhanced Scanning, Trivy)
├── Immutable tags: Once pushed, v1.2.3 cannot be overwritten
├── Lifecycle policies: Auto-delete images >90 days old
└── Network: VPC endpoint for ECR (no internet required)

STAGE 3: DEPLOYMENT (Admission Control)
├── CrowdStrike KAC / OPA Gatekeeper / Kyverno
├── Block: Unscanned images, privileged, root, docker.sock
├── Enforce: Non-root, read-only fs, drop ALL caps, NetworkPolicy
├── Verify: Image signature before allowing deployment
└── Strategy: Alert mode → Fix → Prevent mode

STAGE 4: RUNTIME (Detection & Response)
├── CrowdStrike Falcon sensor (DaemonSet on every node)
├── Detects: Container drift, reverse shells, crypto mining,
│   privilege escalation, lateral movement
├── Container Drift Detection:
│   ├── Tracks original image content (baseline)
│   ├── New binary executed → DRIFT ALERT
│   ├── Best practice: DETECT + PREVENT (kill new process)
│   └── Exceptions for legit cases (Java plugin loaders)
├── Runtime Threat Detection (IOAs):
│   ├── Interactive container session (kubectl exec in prod)
│   ├── Reverse shell patterns
│   ├── Crypto mining process signatures
│   └── Container escape (nsenter, CVE-based)
└── Network monitoring: NetworkPolicies + pod-to-pod visibility
```

## 6.2 Serverless Security (AWS Lambda)

```
SERVERLESS (LAMBDA) SECURITY — UNIQUE CHALLENGES
════════════════════════════════════════════════

WHY SERVERLESS IS DIFFERENT:
├── No server to patch (AWS manages the runtime)
├── No agent to install (can't install CrowdStrike on Lambda)
├── Ephemeral: Function runs for seconds → traditional monitoring fails
├── Event-driven: Multiple trigger sources = expanded attack surface
├── Shared responsibility shifts UP: You manage code + config only
└── But misconfigurations still cause breaches!

SERVERLESS ATTACK SURFACE:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  TRIGGERS:            FUNCTION:             IAM ROLE:            │
│  ┌──────────┐        ┌──────────┐         ┌──────────┐         │
│  │API Gateway│───────→│ Lambda   │────→    │ IAM Role │         │
│  │S3 Event   │        │ Code     │ ←SCAN   │ Perms    │ ←AUDIT  │
│  │SQS/SNS    │        │ + Deps   │ (SAST)  │          │ (CIEM)  │
│  │DynamoDB   │        │ + Config │ (SCA)   │          │         │
│  │EventBridge│        │ + Env    │         │          │         │
│  │CloudWatch │        │   Vars   │ ←CHECK  │          │         │
│  └──────────┘        └──────────┘         └──────────┘         │
│       ↑                                                          │
│  ←VALIDATE          ←MONITOR               ←LEAST PRIV          │
│  (input valid.)     (CloudWatch/X-Ray)     (Access Analyzer)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

SERVERLESS SECURITY CHECKLIST:
┌────┬──────────────────────────────────────────────────────────────┐
│ #  │ Security Control                                             │
├────┼──────────────────────────────────────────────────────────────┤
│  1 │ IAM: Least-privilege execution role (NOT AmazonFullAccess)  │
│    │ → Use specific: s3:GetObject on specific bucket ARN only    │
├────┼──────────────────────────────────────────────────────────────┤
│  2 │ Secrets: Use Secrets Manager/Parameter Store, NOT env vars  │
│    │ → Encrypt with customer KMS key, rotate automatically       │
├────┼──────────────────────────────────────────────────────────────┤
│  3 │ VPC: Deploy Lambda in VPC for database access               │
│    │ → Private subnets only, no public internet needed           │
├────┼──────────────────────────────────────────────────────────────┤
│  4 │ Dependencies: SCA scan in pipeline (Snyk, Trivy)            │
│    │ → Pin versions, update regularly, generate SBOM             │
├────┼──────────────────────────────────────────────────────────────┤
│  5 │ Code: SAST scan for injection, hardcoded secrets            │
│    │ → Semgrep, Bandit (Python), ESLint security plugin (Node)   │
├────┼──────────────────────────────────────────────────────────────┤
│  6 │ Input: Validate ALL event input (API Gateway, S3, SQS)     │
│    │ → Lambda Layers with validation libraries                   │
├────┼──────────────────────────────────────────────────────────────┤
│  7 │ Timeout: Set appropriate timeout (default 3s → 900s max)    │
│    │ → Prevent runaway executions that burn budget                │
├────┼──────────────────────────────────────────────────────────────┤
│  8 │ Concurrency: Set reserved concurrency to prevent DoS        │
│    │ → Malicious flood can exhaust account-wide concurrency      │
├────┼──────────────────────────────────────────────────────────────┤
│  9 │ Layers: Use Lambda Layers for shared security libraries     │
│    │ → Input validation, logging, error handling in one Layer    │
├────┼──────────────────────────────────────────────────────────────┤
│ 10 │ Monitoring: CloudWatch Logs + X-Ray tracing + Lambda Insights│
│    │ → Detect anomalous invocations, errors, duration spikes     │
├────┼──────────────────────────────────────────────────────────────┤
│ 11 │ Runtime: Use Amazon Inspector to scan Lambda for CVEs       │
│    │ → Continuous scanning of Lambda code + dependencies          │
├────┼──────────────────────────────────────────────────────────────┤
│ 12 │ Code Signing: Enable AWS Lambda Code Signing Policy         │
│    │ → Only signed code packages can be deployed                  │
└────┴──────────────────────────────────────────────────────────────┘

TERRAFORM — SECURE LAMBDA CONFIGURATION:
```

```hcl
# ==================================================================
# SECURE LAMBDA CONFIGURATION — TERRAFORM
# ==================================================================

# 1. Least-Privilege IAM Role
resource "aws_iam_role" "lambda_role" {
  name = "secure-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Specific permissions — NOT managed policies!
resource "aws_iam_role_policy" "lambda_policy" {
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "arn:aws:s3:::my-specific-bucket/specific-prefix/*"
        # ✅ Specific bucket + prefix (NOT s3:*)
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = aws_secretsmanager_secret.db_creds.arn
        # ✅ Specific secret ARN (NOT secretsmanager:*)
      },
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# 2. Lambda Function — Secure Configuration
resource "aws_lambda_function" "secure_function" {
  function_name = "process-orders"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30                    # ✅ Don't leave at default
  memory_size   = 256

  # ✅ Deploy in VPC for database access
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  # ✅ Environment variables — reference Secrets Manager, NOT plaintext
  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.db_creds.arn
      ENVIRONMENT   = "production"
      LOG_LEVEL     = "INFO"
      # ❌ NEVER: DB_PASSWORD = "mypassword123"
    }
  }

  # ✅ Reserved concurrency to prevent account-wide DoS
  reserved_concurrent_executions = 100

  # ✅ Enable X-Ray tracing
  tracing_config {
    mode = "Active"
  }

  # ✅ Dead letter queue for failed invocations
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  # ✅ Code signing (optional but recommended)
  code_signing_config_arn = aws_lambda_code_signing_config.signing.arn
}

# 3. Code Signing Policy
resource "aws_lambda_code_signing_config" "signing" {
  allowed_publishers {
    signing_profile_version_arns = [aws_signer_signing_profile.lambda.version_arn]
  }

  policies {
    untrusted_artifact_on_deployment = "Enforce"
    # ✅ Only signed code can be deployed
  }
}
```

---

# PART 7: COMPLETE DEVSECOPS INTEGRATION ARCHITECTURE

---

## 7.1 End-to-End Pipeline with All Security Tools

```
COMPLETE DEVSECOPS PIPELINE — ALL TOOLS INTEGRATED
═══════════════════════════════════════════════════

DEVELOPER WORKSTATION:
┌─────────────────────────────────────────────────────────────────┐
│ IDE: VSCode + Extensions                                         │
│ ├── SonarLint (real-time SAST)                                  │
│ ├── Snyk IDE Plugin (real-time SCA)                             │
│ ├── GitLens + detect-secrets (secret detection)                 │
│ └── tfsec for VSCode (IaC scanning)                             │
│                                                                  │
│ Pre-Commit Hooks (.pre-commit-config.yaml):                     │
│ ├── detect-secrets (block commits with secrets)                 │
│ ├── tfsec (block insecure Terraform)                            │
│ └── markdownlint (documentation quality)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ git push
                            ▼
CI/CD PIPELINE (GitHub Actions / GitLab CI):
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  STAGE 1: SOURCE CODE SECURITY                                  │
│  ├── SAST: SonarQube / Semgrep / CodeQL                        │
│  │   └── Fail PR on: Critical/High SAST findings               │
│  ├── Secret Detection: GitLeaks / TruffleHog                   │
│  │   └── Fail PR on: ANY secret detected                       │
│  └── SCA: Snyk / Trivy filesystem scan                         │
│      └── Fail PR on: Critical CVE with fix available           │
│                                                                  │
│  STAGE 2: BUILD SECURITY                                        │
│  ├── IaC Scan: Checkov / tfsec / Falcon IaC                    │
│  │   └── Fail build on: HIGH+ IaC misconfigurations            │
│  ├── Container Image Build: docker build + security layers     │
│  ├── Image Scan: Trivy / Snyk Container / Grype               │
│  │   └── Fail build on: Critical image CVE                     │
│  ├── SBOM: Syft → Generate CycloneDX SBOM                     │
│  │   └── Store in artifact registry for compliance             │
│  └── Image Sign: Cosign / AWS Signer                           │
│                                                                  │
│  STAGE 3: TEST SECURITY                                         │
│  ├── Deploy to staging environment                              │
│  ├── DAST: OWASP ZAP baseline scan                             │
│  │   └── Warn on: Auth issues, security headers                │
│  ├── API Security: ZAP API scan with OpenAPI spec              │
│  │   └── Fail on: High+ API vulnerabilities                   │
│  └── Integration tests with security assertions                │
│                                                                  │
│  STAGE 4: DEPLOY SECURITY                                       │
│  ├── Terraform Plan → Human review for sensitive changes       │
│  ├── Image Signature Verification (Cosign)                     │
│  ├── CrowdStrike KAC Admission Control                         │
│  │   └── Block: privileged, root, docker.sock, unscanned      │
│  └── AWS Config Rules validation                                │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ deploy
                            ▼
PRODUCTION RUNTIME:
┌─────────────────────────────────────────────────────────────────┐
│ CSPM: CrowdStrike Falcon / Wiz / Prisma Cloud                  │
│ ├── Continuous configuration assessment (IOMs)                  │
│ ├── Compliance monitoring (CIS, NIST, PCI, SOC2, HIPAA)        │
│ ├── Attack path analysis                                        │
│ └── Drift detection (IaC vs runtime)                            │
│                                                                  │
│ CWPP: CrowdStrike Falcon Sensor                                │
│ ├── Runtime threat detection (IOAs)                             │
│ ├── Container drift detection + prevention                     │
│ ├── Malware detection + process killing                        │
│ └── Vulnerability assessment (continuous)                       │
│                                                                  │
│ WAF: AWS WAF + CloudFront                                       │
│ ├── OWASP rule groups (SQL injection, XSS, LFI)               │
│ ├── Rate limiting + Bot control                                 │
│ └── Custom rules for application-specific protection           │
│                                                                  │
│ SIEM: Splunk / Sentinel / Security Lake                         │
│ ├── CloudTrail, VPC Flow Logs, GuardDuty findings              │
│ ├── Falcon alerts + CSPM findings                               │
│ ├── Correlation rules for multi-source detection               │
│ └── IR playbook automation                                      │
│                                                                  │
│ MONITORING: CloudWatch + X-Ray + Lambda Insights                │
│ ├── Application performance + error tracking                   │
│ ├── Anomaly detection (invocation spikes, error rates)         │
│ └── Distributed tracing for forensics                           │
└─────────────────────────────────────────────────────────────────┘
```

## 7.2 Security Gate Decision Matrix

```
WHEN TO BLOCK vs WARN vs ALLOW
═══════════════════════════════

┌──────────────────────────┬──────────┬──────────┬──────────────────┐
│ Finding                  │ Dev/Test │ Staging  │ Production       │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ SAST: Critical           │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
│ SAST: High               │ ⚠️ WARN  │ ⚠️ WARN  │ 🔴 BLOCK         │
│ SAST: Medium/Low         │ 📝 LOG   │ ⚠️ WARN  │ ⚠️ WARN          │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ SCA: Critical CVE        │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
│ SCA: High CVE            │ 📝 LOG   │ ⚠️ WARN  │ 🔴 BLOCK (if fix)│
│ SCA: Malware             │ 🔴 BLOCK │ 🔴 BLOCK │ 🔴 BLOCK         │
│ SCA: Restricted License  │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ DAST: Critical           │ N/A      │ 🔴 BLOCK │ 🔴 BLOCK         │
│ DAST: High               │ N/A      │ ⚠️ WARN  │ 🔴 BLOCK         │
│ DAST: Missing Headers    │ N/A      │ 📝 LOG   │ ⚠️ WARN          │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ IaC: Critical            │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
│ IaC: High                │ 📝 LOG   │ ⚠️ WARN  │ 🔴 BLOCK         │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ Image: Critical CVE      │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
│ Image: Malware           │ 🔴 BLOCK │ 🔴 BLOCK │ 🔴 BLOCK         │
│ Image: Secret Found      │ 🔴 BLOCK │ 🔴 BLOCK │ 🔴 BLOCK         │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ Secret in Code           │ 🔴 BLOCK │ 🔴 BLOCK │ 🔴 BLOCK         │
├──────────────────────────┼──────────┼──────────┼──────────────────┤
│ K8s: Privileged Pod      │ ⚠️ WARN  │ 🔴 BLOCK │ 🔴 BLOCK         │
│ K8s: Root Container      │ 📝 LOG   │ ⚠️ WARN  │ 🔴 BLOCK         │
│ K8s: No NetworkPolicy    │ 📝 LOG   │ ⚠️ WARN  │ ⚠️ WARN          │
└──────────────────────────┴──────────┴──────────┴──────────────────┘
```

---

# PART 8: INTERVIEW QUESTIONS & ANSWERS

---

## Section A: Frameworks & Compliance (10 Questions)

### Q1. "Compare CIS, NIST, SOC 2, PCI-DSS, and HIPAA. When would you use each?"

> "These frameworks serve different purposes:
>
> - **CIS Controls/Benchmarks** — Tactical, prescriptive security checklists. Use when: You need specific technical configurations for cloud resources. Every CSPM tool (CrowdStrike, Wiz, Prisma) uses CIS benchmarks as their primary rule set.
>
> - **NIST CSF** — Strategic risk management framework. Use when: Designing your overall security program. It's the 'Rosetta Stone' that maps to all other frameworks. 6 Functions: Govern, Identify, Protect, Detect, Respond, Recover.
>
> - **SOC 2** — Trust and assurance standard. Use when: Your customers (B2B SaaS) need proof that you protect their data. Requires annual audit by a CPA firm. 5 Trust Services Criteria, with Security being mandatory.
>
> - **PCI-DSS** — Mandatory if you process credit card data. 12 requirements covering everything from network security to access control. v4.0 added WAF requirements and anti-phishing mandates.
>
> - **HIPAA** — Mandatory if you handle Protected Health Information (PHI). Three types of safeguards: Administrative, Physical, Technical. In AWS, you must use HIPAA-eligible services and sign a BAA.
>
> **Strategy:** Use NIST CSF as your backbone, CIS Controls for implementation, and add PCI-DSS/HIPAA/SOC2 as overlays based on your regulatory requirements. One strong security program satisfies 70%+ of all frameworks simultaneously."

---

### Q2. "How do you build a Unified Control Framework across multiple compliance requirements?"

> "Instead of managing 5 separate compliance programs, I build one control framework that maps to all:
>
> **Step 1:** Identify the 6 core control domains that overlap: Access Control, Encryption, Logging, Incident Response, Vulnerability Management, Change Management.
>
> **Step 2:** For each domain, implement one strong control that satisfies multiple frameworks. Example: A robust IAM policy with MFA, least privilege, and quarterly access reviews satisfies CIS 5/6, NIST PR.AC, SOC2 CC6.1, PCI 7/8, and HIPAA §164.312(a) simultaneously.
>
> **Step 3:** Track evidence in a GRC tool (ServiceNow, Drata, Vanta) that maps each evidence artifact to multiple framework controls.
>
> **Result:** One audit → multiple compliance certifications. Implement once, document once, satisfy many."

---

### Q3. "What are the key changes in PCI-DSS v4.0 that affect cloud security?"

> "PCI-DSS v4.0 introduced several critical changes effective March 2025:
>
> 1. **Req 6.4.2: WAF required** for ALL public-facing web applications (not just recommended)
> 2. **Req 8.3.6: MFA for ALL CDE access** (not just admins — every user accessing cardholder data)
> 3. **Req 3.5.1.2: Disk-level encryption no longer sufficient** — Must use field-level or column-level encryption for stored card data
> 4. **Req 11.6.1: Payment page tampering detection** — Must detect unauthorized modifications (Magecart-style attacks)
> 5. **Req 5.4.1: Anti-phishing mechanisms** — DMARC, SPF, DKIM required
> 6. **Targeted Risk Analysis** — More flexibility but requires documented justification for any 'customized approach'
>
> **Cloud impact:** WAF is now mandatory (AWS WAF + Firewall Manager), MFA enforcement must cover all CDE access paths, and KMS encryption must be field/column-level, not just volume-level."

---

### Q4. "How do you automate compliance monitoring in the cloud?"

> "I use a layered automation approach:
>
> **Layer 1: CSPM (Continuous)** — CrowdStrike Falcon / Wiz continuously scans all cloud accounts against CIS, NIST, PCI, SOC2, HIPAA frameworks. Any deviation immediately creates an IOM finding.
>
> **Layer 2: AWS Config (Real-Time)** — AWS Config Rules evaluate resource configurations in real-time. Conformance Packs for CIS and PCI deploy 50+ managed rules at once.
>
> **Layer 3: IaC Scanning (Pre-Deploy)** — Checkov + Falcon IaC scans Terraform in CI/CD. Each Checkov rule maps to a specific CIS/PCI/NIST control. Misconfiguration blocked before it exists.
>
> **Layer 4: GRC Platform (Reporting)** — Drata/Vanta/ServiceNow aggregates evidence from CSPM, Config, and pipeline scans. Auto-generates compliance reports. Auditors get real-time dashboards instead of quarterly screenshot dumps.
>
> **Result:** Continuous compliance, not point-in-time compliance."

---

### Q5. "Explain the Shared Responsibility Model and how it impacts compliance."

> "The Shared Responsibility Model defines who secures what:
>
> **AWS Responsibility ('Security OF the Cloud'):**
> - Physical data center security
> - Network infrastructure, hypervisor
> - Managed service internals (RDS engine, Lambda runtime)
> - Hardware, global infrastructure
>
> **Customer Responsibility ('Security IN the Cloud'):**
> - IAM (users, roles, policies, MFA)
> - Data encryption (at rest and in transit)
> - Network configuration (SGs, NACLs, VPC design)
> - OS patching (EC2), application code
> - Logging and monitoring configuration
> - Compliance-specific controls
>
> **Compliance Impact:**
> - For PCI: AWS provides a PCI AOC (Attestation of Compliance) for their part. You must still pass your own PCI audit for your configuration.
> - For HIPAA: AWS signs a BAA but you must use only HIPAA-eligible services and configure them correctly.
> - For SOC 2: AWS's SOC 2 report covers their controls. Your SOC 2 report covers your application and configuration.
>
> **Key insight:** The shared responsibility model means compliance is NEVER 'done' by choosing AWS. You inherit their physical security, but everything else is on you."

---

## Section B: SCA/SAST/DAST (10 Questions)

### Q6. "Explain SCA, SAST, and DAST — when and where do you use each?"

> "These are three complementary application security testing methods:
>
> | Method | What It Scans | When | Analogy |
> |--------|--------------|------|---------|
> | **SCA** | Third-party dependencies (libraries, packages) | Build/CI | 'Are your ingredients safe?' |
> | **SAST** | Your source code (white-box, static) | Code/Build | 'Did your chef make mistakes?' |
> | **DAST** | Running application (black-box, dynamic) | Test/Staging | 'Can a customer get food poisoning?' |
>
> **Where in the pipeline:**
> - **SCA** → Every PR + container image build (catch vulnerable deps early)
> - **SAST** → Every PR (catch insecure code patterns at code review)
> - **DAST** → Staging deployment + weekly full scans (catch runtime issues)
>
> **Why all three:** SAST finds insecure code YOU wrote. SCA finds insecure code OTHERS wrote (that you imported). DAST finds issues that only appear when the app is RUNNING. No single tool catches everything — you need the trifecta."

---

### Q7. "What is an SBOM and why is it critical for security?"

> "An SBOM (Software Bill of Materials) is a machine-readable inventory of every component in your software — like a nutrition label for code.
>
> **Why it's critical:**
> - **Incident Response Speed:** When Log4Shell hit, orgs with SBOMs identified affected apps in hours. Orgs without SBOMs took weeks.
> - **Supply Chain Visibility:** Know exactly what's in your software, including transitive dependencies 5 levels deep
> - **Compliance:** US Executive Order 14028 requires SBOMs for federal software
> - **Vulnerability Tracking:** When a new CVE drops, query your SBOM database: 'Which apps use this library?'
>
> **Formats:** SPDX (ISO standard), CycloneDX (OWASP, security-focused)
> **Tools:** Syft, Trivy, CycloneDX CLI
> **Implementation:** Generate SBOM in CI/CD build stage, store alongside artifacts, scan continuously against CVE databases"

---

### Q8. "How do you handle false positives from SAST tools?"

> "SAST tools have historically high false positive rates (30-50%). My strategy:
>
> 1. **Verify the data flow:** Does user input actually reach the dangerous sink? If the tool says SQL injection but the input goes through a parameterized query, it's FP.
>
> 2. **Check framework awareness:** Many tools don't understand framework-specific sanitization. Django's `{% autoescape %}`, React's JSX auto-escaping, or Spring's `@RequestParam` validation may already handle the issue.
>
> 3. **Tune the tool:** Add suppressions with documented justification: `// NOSONAR: Input validated by custom sanitizer in line 45`. Require team lead approval for suppressions.
>
> 4. **Track FP rate per rule:** If a specific rule produces >50% FPs, modify or disable that rule. Configure the tool to your tech stack.
>
> 5. **Use reachability analysis:** Modern tools (Snyk Code, Checkmarx) can determine if the vulnerable code path is actually reachable from user input. This dramatically reduces FPs.
>
> **Key metric:** Track the FP rate monthly. Target: <20% FP rate. If higher, the tool needs tuning, not the developers' patience."

---

### Q9. "Scenario: Your SCA scan finds a Critical CVE in a transitive dependency. How do you remediate?"

> "Transitive dependency vulnerabilities are tricky because you don't directly control the affected package.
>
> **Step 1: Assess Impact.** Is the vulnerable function actually called by your code path? Use reachability analysis (Snyk, Grype) to determine if the CVE is exploitable in your context.
>
> **Step 2: Find the dependency chain.** `npm ls vulnerable-package` or `pip show --tree` to see: Your app → Package A → Package B → Vulnerable Package C.
>
> **Step 3: Remediation options (in order of preference):**
> 1. **Upgrade the direct dependency:** If Package A has a newer version that uses non-vulnerable Package C → upgrade A
> 2. **Override the transitive dependency:** npm `overrides`, pip `constraints.txt`, Maven `dependencyManagement` — force the fixed version
> 3. **Replace the direct dependency:** If Package A is unmaintained, find an alternative
> 4. **Compensating controls:** If no fix exists, add WAF rules, input validation, or disable the affected feature
>
> **Step 4: Verify.** Re-run SCA scan → CVE should be gone. Add a CI test to prevent regression."

---

### Q10. "How does DAST complement SAST? Give specific examples of what DAST catches that SAST misses."

> "DAST catches categories of vulnerabilities that are invisible to static analysis:
>
> 1. **Broken Authentication:** DAST can test login flows — weak passwords accepted, no rate limiting on failed logins, session tokens not invalidated after logout. SAST sees code but not the deployed auth configuration.
>
> 2. **Missing Security Headers:** DAST checks HTTP response headers — no HSTS, no CSP, no X-Frame-Options, cookies without Secure/HttpOnly flags. These are server configuration issues, not code issues.
>
> 3. **CORS Misconfigurations:** DAST sends requests with different `Origin` headers to test if the server allows unauthorized cross-origin access. This requires a running server to test.
>
> 4. **TLS Configuration:** DAST checks TLS version (TLS 1.0/1.1 still enabled?), cipher suites, certificate validity. SAST can't test deployed TLS settings.
>
> 5. **IDOR (Insecure Direct Object Reference):** DAST can test `GET /api/users/123` with user A's token → `GET /api/users/456` → does it return user B's data? This is a business logic flaw invisible to SAST.
>
> 6. **Rate Limiting:** DAST sends 1000 requests/second — is rate limiting enforced? SAST can't test infrastructure-level controls."

---

### Q11. "What OWASP Top 10 vulnerabilities can each tool type detect?"

> "
> | OWASP Top 10 (2021) | SAST | SCA | DAST |
> |---------------------|------|-----|------|
> | A01: Broken Access Control | Partial | ❌ | ✅ Best |
> | A02: Cryptographic Failures | ✅ Best | ✅ | Partial |
> | A03: Injection | ✅ Best | ❌ | ✅ |
> | A04: Insecure Design | Partial | ❌ | Partial |
> | A05: Security Misconfiguration | ❌ | ❌ | ✅ Best |
> | A06: Vulnerable Components | ❌ | ✅ Best | ❌ |
> | A07: Auth Failures | Partial | ❌ | ✅ Best |
> | A08: Software Integrity | ❌ | ✅ | ❌ |
> | A09: Logging Failures | Partial | ❌ | Partial |
> | A10: SSRF | ✅ | ❌ | ✅ Best |
>
> **Takeaway:** No single tool covers all 10. SAST excels at injection/crypto. SCA excels at vulnerable components. DAST excels at access control/auth/config. You need all three."

---

### Q12. "How do you secure a CI/CD pipeline itself against supply chain attacks?"

> "The pipeline is an attack vector itself — compromise it and you compromise everything it deploys:
>
> **1. Pipeline Infrastructure:**
> - Build environment in private VPC (no internet access)
> - Pull dependencies from internal artifact mirror (Artifactory, Nexus)
> - Ephemeral build agents (destroy after each build — no persistence)
> - Harden the CI/CD tool itself (Jenkins, GitHub Actions runner security)
>
> **2. Dependency Integrity:**
> - SCA scan every dependency + SBOM generation
> - Lock file verification (package-lock.json, yarn.lock)
> - Checksum verification of downloaded packages
> - Private package registry (no direct npm/PyPI access from build)
>
> **3. Code Integrity:**
> - Signed commits (GPG signatures, GitHub verified commits)
> - Branch protection rules (require reviews, no force push)
> - CODEOWNERS file (security team approves security-sensitive files)
> - Image signing with Cosign after successful build
>
> **4. Secrets Management:**
> - OIDC federation (GitHub Actions → AWS) — no long-lived credentials
> - Secrets in dedicated vault (not env vars in CI config)
> - Rotate pipeline credentials regularly
> - Audit: Who accessed pipeline secrets and when?
>
> **5. Monitoring:**
> - Audit logs for all pipeline modifications
> - Alert on: new workflows added, permissions changed, unusual build times
> - Dependabot alerts for pipeline action versions"

---

## Section C: Cloud Workload Protection (8 Questions)

### Q13. "How do you secure containers from build to runtime?"

> "I use a 4-stage lifecycle approach:
>
> **BUILD:** Minimize base image (distroless/alpine), scan with Trivy/Snyk for CVEs, generate SBOM, sign image. Fail if Critical CVE exists. Dockerfile must include: USER (non-root), HEALTHCHECK, pinned versions.
>
> **STORE:** Private ECR only, auto-scan on push, immutable tags, lifecycle policies (delete >90 day images). VPC endpoint for ECR access.
>
> **DEPLOY:** CrowdStrike KAC blocks: privileged, root, docker.sock mount, unscanned images. Verify image signature. Pod SecurityContext: runAsNonRoot, readOnlyRootFilesystem, drop ALL capabilities.
>
> **RUN:** Falcon sensor DaemonSet on every node. Container drift detection (kill new binaries). Runtime IOAs for reverse shells, crypto mining, escape attempts. NetworkPolicies for micro-segmentation."

---

### Q14. "How do you secure serverless (Lambda) functions?"

> "Serverless shifts the responsibility UP — no server to patch, but code and configuration are still yours:
>
> **IAM:** Create per-function roles with minimum required permissions. Never use AmazonFullAccess. Use IAM Access Analyzer to right-size policies.
>
> **Code Security:** SAST scan Lambda code in pipeline (Semgrep for Python, ESLint for Node). SCA scan dependencies (Trivy, Snyk). Use Amazon Inspector for continuous Lambda CVE scanning.
>
> **Secrets:** Use Secrets Manager with KMS encryption, NOT environment variables. Reference secrets at runtime, not build-time.
>
> **Network:** Deploy in VPC for database access. No public subnets. Security groups restricting outbound if possible.
>
> **Input Validation:** Lambda functions receive events from many sources (API Gateway, S3, SQS). Validate ALL input — don't trust any event source implicitly.
>
> **Monitoring:** CloudWatch Logs + X-Ray tracing + Lambda Insights for anomaly detection. Alert on: unusual invocation spikes, error rate increases, duration anomalies."

---

### Q15. "What is IAST and how does it differ from SAST and DAST?"

> "**IAST (Interactive Application Security Testing)** combines elements of both SAST and DAST:
>
> - **How it works:** An agent is deployed INSIDE the running application (instrumented). As DAST or test suites exercise the app externally, IAST observes the code paths being executed internally.
> - **Advantage:** It sees both the external attack AND the internal code response — dramatically reducing false positives. If a DAST payload reaches a vulnerable function, IAST confirms the data flow.
> - **When to use:** During QA/staging testing phase, alongside functional tests.
> - **Tools:** Contrast Security, Synopsys Seeker, Checkmarx IAST.
>
> | Aspect | SAST | DAST | IAST |
> |--------|------|------|------|
> | Code access | ✅ Full | ❌ None | ✅ Instrumented |
> | App running | ❌ No | ✅ Yes | ✅ Yes |
> | False positives | High | Medium | Low (best) |
> | Coverage | All code paths | Only tested paths | Tested paths + code |
> | CI/CD stage | Build | Test/Staging | Test/Staging |"

---

## Section D: DevSecOps Automation (7 Questions)

### Q16. "How do you integrate security into DevOps without slowing down deployments?"

> "The key is making security invisible and fast:
>
> 1. **Parallelize scans:** Run SAST, SCA, and IaC scans simultaneously (not sequentially). Total scan time ≈ longest single scan, not sum.
>
> 2. **Incremental scanning:** Only scan changed files/dependencies on PRs. Full scan runs on nightly schedule or release builds.
>
> 3. **Developer experience first:** Provide results IN the PR as comments, not in a separate portal. Show exact line, explanation, and fix suggestion.
>
> 4. **Smart gating:** Block only on Critical/High. Warn on Medium. Log Low. Start in monitoring mode, then tighten.
>
> 5. **Pre-commit hooks:** Catch the easiest issues (secrets, basic SAST) before code even enters the pipeline. Seconds, not minutes.
>
> 6. **Cached dependencies:** Internal artifact mirror eliminates download time. Docker layer caching speeds image builds.
>
> **Metrics I track:** Pipeline duration before/after security integration. Target: <5 minutes added. If security adds >10 minutes, optimize or parallelize."

---

### Q17. "Describe a Policy-as-Code approach for cloud security."

> "Policy-as-Code means defining security policies in machine-readable format that can be version-controlled, tested, and enforced automatically:
>
> **Tools:**
> - **OPA (Open Policy Agent) + Rego:** General-purpose policy engine for K8s, Terraform, API authorization
> - **Sentinel (HashiCorp):** Terraform-native policy enforcement
> - **Checkov:** Python-based IaC policy engine with 1000+ built-in rules
> - **AWS SCP (Service Control Policies):** Organization-level guardrails
> - **Kyverno:** K8s-native policy engine (YAML-based, no Rego needed)
>
> **Example Workflow:**
> ```
> 1. Security engineer writes policy in Rego/YAML
> 2. Policy stored in git alongside infrastructure code
> 3. PR review by security team
> 4. CI runs policy tests (unit tests for policies!)
> 5. Policy deployed to OPA/Kyverno/Sentinel
> 6. Developer deploys infrastructure → policy evaluates → allow/deny
> 7. Audit trail: who wrote the policy, when, git history
> ```
>
> **Benefit:** Policies are auditable, testable, versionable, and consistent across all environments."

---

### Q18. "What security automation would you build for a cloud-native organization?"

> "I prioritize high-frequency, low-complexity automations:
>
> | Priority | Automation | Trigger | Impact |
> |----------|-----------|---------|--------|
> | 1 | Auto-block public S3 | CloudTrail event | Prevents data breaches |
> | 2 | Auto-revoke open SGs | Config rule change | Closes network exposure |
> | 3 | SCA/SAST in every PR | Git push | Catches vulns at code review |
> | 4 | Image scan + SBOM gen | Docker build | Secures container supply chain |
> | 5 | Sensor coverage check | Daily schedule | Finds monitoring gaps |
> | 6 | SLA tracking + escalation | Every 6 hours | Ensures remediation velocity |
> | 7 | Compliance report gen | Weekly/Monthly | Auto-generates audit evidence |
> | 8 | IAM key rotation | 90-day Config rule | Prevents credential abuse |
>
> What I DON'T automate: Complex IAM policy changes, encryption key rotations, network routing — these need human review."

---

### Q19. "How do you measure the success of a DevSecOps program?"

> "I track metrics across four dimensions:
>
> **1. Shift-Left Effectiveness:**
> - % of vulnerabilities caught pre-production (target: >80%)
> - Mean Time to Detect (MTTD) — how quickly do we find issues?
> - Pre-commit vs CI vs staging detection ratio
>
> **2. Remediation Velocity:**
> - Mean Time to Remediate (MTTR) by severity
> - SLA compliance % (Critical: 4h, High: 24h adherence)
> - Open vulnerability trend (should decrease monthly)
>
> **3. Developer Experience:**
> - Pipeline time impact (security scans added minutes)
> - False positive rate per tool (<20% target)
> - Security exception/bypass frequency (should decrease over time)
>
> **4. Security Posture:**
> - CSPM compliance score trend (CIS, NIST, PCI)
> - Attack path count (should decrease quarterly)
> - Critical/High finding backlog size (should trend down)"

---

### Q20. "How do you handle a newly disclosed zero-day CVE (like Log4Shell) across your environment?"

> "My zero-day response has 4 phases:
>
> **Phase 1 — Scope (0-2 hours):**
> - Query SBOM database: 'Which applications contain the affected library?'
> - Check CSPM: Which running workloads have this library?
> - Check container registry: Which images contain it?
> - Result: Complete blast radius in hours, not days
>
> **Phase 2 — Mitigate (2-4 hours):**
> - Deploy WAF rules to block known exploit patterns
> - Apply runtime mitigations (environment variables, JVM flags for Log4Shell)
> - Network-level controls: Block outbound LDAP/RMI if possible
>
> **Phase 3 — Remediate (4-48 hours):**
> - Update dependencies in code (SCA identifies the fix version)
> - CI/CD pipeline builds + scans new images
> - Deploy patched versions to production
> - Verify via SCA re-scan: CVE no longer present
>
> **Phase 4 — Harden (Post-incident):**
> - Add permanent SCA check for this CVE family
> - Update SBOM policies to flag similar transitive risks
> - Conduct lessons learned: Could we have detected this sooner?
> - Report to leadership: scope, timeline, residual risk"

---

## Section E: Quick-Fire Questions (5 Questions)

### Q21. "Name the OWASP Top 10 categories."

> 1. **A01:** Broken Access Control
> 2. **A02:** Cryptographic Failures
> 3. **A03:** Injection
> 4. **A04:** Insecure Design
> 5. **A05:** Security Misconfiguration
> 6. **A06:** Vulnerable & Outdated Components
> 7. **A07:** Identification & Authentication Failures
> 8. **A08:** Software & Data Integrity Failures
> 9. **A09:** Security Logging & Monitoring Failures
> 10. **A10:** Server-Side Request Forgery (SSRF)

---

### Q22. "SAST is white-box, DAST is black-box. What is IAST?"

> "IAST is 'gray-box' — it instruments the running application to observe internal code execution while external tests exercise the app. It combines SAST's code visibility with DAST's runtime context, resulting in the lowest false positive rate. Tools: Contrast Security, Synopsys Seeker."

---

### Q23. "What is the difference between a vulnerability scan and a penetration test?"

> "A **vulnerability scan** is automated, covers broad surface area, and identifies *potential* vulnerabilities (may include false positives). A **penetration test** is human-led, targets specific systems, and *proves* exploitation (confirms vulnerabilities are real). Vuln scans run weekly/daily; pen tests run quarterly/annually. Both are required by PCI-DSS Req 11."

---

### Q24. "What is SCA's role in preventing supply chain attacks?"

> "SCA prevents supply chain attacks by: (1) identifying known-vulnerable dependencies before deployment, (2) detecting malicious packages (typosquatting), (3) generating SBOMs for rapid incident response when new CVEs drop, (4) checking license compliance (preventing legal supply chain risks), and (5) alerting on unmaintained packages that may have undiscovered vulns."

---

### Q25. "Name 3 tools for each: SCA, SAST, DAST."

> "**SCA:** Snyk Open Source, Trivy, OWASP Dependency-Check
> **SAST:** SonarQube, Checkmarx, Semgrep
> **DAST:** OWASP ZAP, Burp Suite, Nuclei"

---

# 📋 STUDY CHEATSHEET — KEY CONCEPTS

```
FRAMEWORKS:
  CIS     = Technical HOW-TO (benchmarks, prescriptive)
  NIST    = Strategic WHAT-TO-DO (risk framework, "Rosetta Stone")
  SOC 2   = Prove to CUSTOMERS (audit, 5 TSC, Security mandatory)
  PCI-DSS = Payment cards (12 reqs, mandatory, fines for non-compliance)
  HIPAA   = Health data (PHI, 3 safeguards, BAA required)

OVERLAPPING CONTROLS (Implement once → map to many):
  Access Control | Encryption | Logging | IR | Vuln Mgmt | Change Mgmt

APPLICATION SECURITY TESTING:
  SCA  = Third-party deps (WHAT you import)     → Build stage
  SAST = Your source code (WHAT you write)       → Code/Build stage
  DAST = Running application (HOW it behaves)    → Test/Staging stage
  IAST = Instrumented runtime (BOTH code + runtime) → Test stage

PIPELINE STAGES:
  IDE → Commit → Build → Test → Stage → Deploy → Runtime
       SAST+    SCA+    DAST   Pen    KAC+    CSPM+
       Secret   SAST+          Test   Sign    CWPP+
       Detect   IaC+                          WAF+
                Image                         SIEM

CONTAINER LIFECYCLE:
  BUILD (scan + sign) → STORE (private + immutable) →
  DEPLOY (KAC + verify) → RUN (sensor + detect + respond)

SERVERLESS SECURITY:
  Least-privilege IAM | Secrets Manager | VPC | SCA | SAST |
  Input validation | Timeout | Concurrency | Code signing

OWASP TOP 10 MNEMONIC: "BCIS SVA ISS"
  B-C-I-S-S-V-I-S-S-S
  Broken access, Crypto, Injection, Security misconfig,
  Security misconfig, Vuln components, ID/Auth, Software integrity,
  Security logging, SSRF

SHIFT-LEFT COST:
  IDE fix = 1x | Code Review = 5x | Build = 10x |
  Staging = 50x | Prod = 100x | Post-breach = 1000x
```

---

> **Guide Created:** April 2026
> **Topics Covered:** CIS, NIST, SOC 2, PCI-DSS, HIPAA, DevSecOps Pipeline,
> SCA, SAST, DAST, IAST, Container Security, Serverless Security, SBOM,
> Supply Chain, CI/CD Security, 25 Interview Q&As
> **Cross-References:** [Falcon CSPM IOM Guide](./Falcon_CSPM_IOM_Terraform_Guide.md) |
> [Cloud Security Automation Scripts](./Cloud_Security_Automation_Scripts.md) |
> [CNAPP Policy Examples](./CNAPP_Policy_Examples.md)
