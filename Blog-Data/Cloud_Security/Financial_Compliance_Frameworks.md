# 🏦 FINANCIAL COMPLIANCE FRAMEWORKS — Cloud Security Guide

> **Target:** Financial Institutions (Wells Fargo, HSBC, Banking, Fintech)
> **Goal:** Understand the mandatory security frameworks a Cloud Security Analyst must enforce using CNAPP/CSPM tools.

---

## 1. THE "BIG FOUR" MANDATORY FINANCIAL FRAMEWORKS

### 1.1 PCI DSS (Payment Card Industry Data Security Standard)
**What it is:** Global baseline for any organization handling credit card data.
**Key Focus for Cloud:** Network isolation and encryption.
**How it maps to CNAPP/CSPM:**
*   **Req 1 (Network Security):** Ensure strict Security Groups / NSGs. No 0.0.0.0/0 to databases.
*   **Req 3 (Stored Data Protection):** KMS/CMEK encryption enforced on all S3, EBS, and RDS instances.
*   **Req 4 (Data in Transit):** Enforce TLS 1.2+ on all Load Balancers and API Gateways.
*   **Req 10 (Logging):** Ensure CloudTrail, VPC Flow Logs, and DB Audit logging are active and cannot be tampered with.

*Interview Buzzword:* "Cardholder Data Environment (CDE) Isolation." If a pod processes payments, it must be network-isolated from general pods.

### 1.2 GLBA (Gramm-Leach-Bliley Act)
**What it is:** US law requiring financial institutions to explain their information-sharing practices and safeguard sensitive data (NPI - Nonpublic Personal Information).
**Key Focus for Cloud:** Data Privacy and Access Control.
**How it maps to CNAPP/CSPM:**
*   **Access Control:** Strict CIEM enforcement. Least privilege IAM roles.
*   **Data Protection:** Macie / DSPM scanning to identify where NPI (like SSNs, account numbers) lives in S3 buckets.
*   **Risk Assessment:** Continuous CSPM scanning satisfies the GLBA requirement for continuous risk assessment.

### 1.3 SOX (Sarbanes-Oxley Act)
**What it is:** US law focusing on corporate financial reporting accuracy to prevent corporate fraud.
**Key Focus for Cloud:** Change Management and Integrity of Financial Systems.
**How it maps to CNAPP/CSPM:**
*   **Change Control:** Only CI/CD pipelines can deploy to production. KAC (Admission Controllers) enforce immutability (containers cannot be modified at runtime).
*   **Audit Trails:** Immutaiblity of logs. CloudTrail logs must be sent to a central, locked-down S3 bucket (with Object Lock / WORM enabled).
*   **Separation of Duties (SoD):** CIEM checks to ensure a developer cannot both write code and approve their own merge/deploy.

### 1.4 NIST 800-53 / NIST CSF (Cybersecurity Framework)
**What it is:** Not exclusively financial, but it is the *De Facto Gold Standard* baseline that US banks (like Wells Fargo) build their internal security policies upon.
**Key Focus for Cloud:** Comprehensive Security Controls.
**How it maps to CNAPP/CSPM:** *(See Ultimate Prep Guide Part 2 for full mapping)*
*   Banks take NIST 800-53, customize it, and call it their "Internal Control Standard."
*   **CSPM Translation:** Every IOM (Indicator of Misconfiguration) maps to a NIST control Family (e.g., AC for Access Control, SC for System & Comms).

---

## 2. REGIONAL & SPECIALIZED REGULATORY FRAMEWORKS

### 2.1 NYDFS 23 NYCRR 500 (New York Department of Financial Services)
**What it is:** One of the strictest state-level cyber regulations for banks operating in NY (which is basically all major banks).
**Key Focus for Cloud:** 72-hour breach reporting, mandatory MFA, and CISO accountability.
**How it maps to CNAPP/CSPM:**
*   **MFA Enforcement:** CSPM policies must immediately alert if any IAM user or root account lacks MFA.
*   **Incident Response:** CWPP (Runtime protection) speeds up identification to meet the brutal 72-hour regulatory notification window.

### 2.2 FFIEC (Federal Financial Institutions Examination Council)
**What it is:** US regulatory body that audits banks (Examiners use the FFIEC IT Examination Handbook).
**Key Focus for Cloud:** IT Governance, BCDR (Business Continuity/Disaster Recovery), and Third-Party Risk.
**How it maps to CNAPP/CSPM:**
*   **Architecture:** Cross-region backups. CSPM checks that RDS instances are Multi-AZ and DynamoDB has Point-In-Time Recovery (PITR) enabled.

### 2.3 DORA (Digital Operational Resilience Act) - *Crucial for EU / Global Banks*
**What it is:** EU regulation focusing on IT system resilience in the financial sector. 
**Key Focus for Cloud:** Third-party cloud provider risk (AWS/Azure going down) and massive resilience.
**How it maps to CNAPP/CSPM:**
*   Requires strict incident reporting and advanced threat-led penetration testing (TLPT).
*   CWPP provides the forensic data required by DORA during severe operational disruptions.

---

## 3. HOW TO TALK ABOUT COMPLIANCE IN A BANKING INTERVIEW

### 🟢 The "Continuous Compliance" Pitch
> "In a financial organization, compliance isn't an annual checklist; it's a continuous operational state. I use the CNAPP tool to map our cloud estate against PCI-DSS and NIST 800-53 in real-time. Instead of auditor scrambles every December, I configure the CSPM to generate daily compliance posture scores. If a developer launches a database without KMS encryption, we don't wait for an audit—the CSPM flags the PCI violation immediately, creates a ServiceNow ticket, and auto-remediates it via a Python Lambda script if it breaches our 4-hour SLA."

### 🟢 The "Data Governance" Pitch
> "Banks care about NPI (Nonpublic Personal Information) under GLBA. I leverage DSPM (Data Security Posture Management) to automatically classify data in S3 buckets. If a bucket is tagged 'Contains NPI', my CSPM policies dynamically apply stricter guardrails: absolute denial of public access, mandatory strict IAM resource policies, and alerts for any unusual data egress patterns picked up by the CWPP."

### 🟢 The "Audit Readiness" Pitch
> "I act as the bridge between Cloud Engineering and IT Audit. When internal audit asks for evidence under SOX ITGCs (IT General Controls), I don't give them raw logs. I pull the specific Falcon/Wiz compliance report that maps our AWS configurations directly to their control requirements, proving that our separation of duties and encryption-at-rest mandates are actively enforced across 100% of the estate."

---

## 📋 QUICK REFERENCE: Mapping Cloud Services to Banking Compliance

| Cloud Action/Setup | Triggers Which Framework? | How Bank Security Handles It |
| :--- | :--- | :--- |
| Processing credit cards on EKS | **PCI-DSS** | Network isolation, KAC image enforcement, strict WAF. |
| Storing customer SSNs in S3 | **GLBA, NYDFS** | CMEK KMS encryption, Macie classification, highly restricted IAM. |
| Financial reporting database (RDS) | **SOX** | Absolute immutability of logs, rigorous change management, Point-in-time recovery. |
| High availability of trading platform | **FFIEC, DORA** | Multi-AZ/Multi-Region active-active setups, CSPM checks for backup configs. |
