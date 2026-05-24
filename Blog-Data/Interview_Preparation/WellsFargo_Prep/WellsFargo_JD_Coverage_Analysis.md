# 🏦 Wells Fargo Senior Info Security Analyst — What You Already Know vs What to Learn

> **Role:** Senior Information Security Analyst — Cloud Workload Lifecycle Security (CWLS) Findings Management
> **Company:** Wells Fargo
> **Focus:** Wiz CSPM/CWPP Findings Management, Power BI, ServiceNow, Azure/GCP

---

## COVERAGE SUMMARY AT A GLANCE

```
JD REQUIREMENT                              COVERAGE    SOURCE FILE(S)
──────────────────────────────────────────────────────────────────────────
CSPM/CWPP findings triage & management      ✅ 90%      All guides
Wiz platform (attack paths, compliance)     ✅ 70%      Part1 (Sec 2.3 tool comparison)
Splunk integration                          ✅ 60%      EY_Prep (Sec 8), Part2 (Q17)
Cloud misconfigs (IAM, network, storage)    ✅ 95%      Part1 (Sec 3.2, 3.8), Part2 (Sec 6)
Compliance (CIS, NIST)                      ✅ 90%      Part2 (Sec 6)
Vulnerability management lifecycle          ✅ 95%      Part1 (Sec 3.1), EY_Prep (Sec 4)
SLA tracking & escalation                   ✅ 85%      Part1 (Sec 3.5), Automation Script 5
Container/K8s security                      ✅ 95%      Part1 (Sec 3.8 PSS), all guides
Azure/GCP specific controls                 ⚠️ 40%      EY_Prep (Sec 5, 9) — mostly AWS-focused
Power BI / DAX / Power Query                ❌ 0%       NOT COVERED — NEW SKILL NEEDED
Excel (VLOOKUP, PivotTables, Power Query)   ❌ 0%       NOT COVERED — NEW SKILL NEEDED
ServiceNow (CMDB, ticket routing)           ❌ 0%       NOT COVERED — NEW SKILL NEEDED
SQL queries for dashboards                  ❌ 5%       NOT COVERED — NEW SKILL NEEDED
REST API / JSON data processing             ⚠️ 50%      Automation scripts use APIs
Stakeholder engagement / office hours       ✅ 80%      EY_Prep (Sec 10), Part2 (Q22-24)
SOPs / KB articles / documentation          ⚠️ 40%      Mentioned but not detailed
```

---

## SECTION 1: WHAT YOU ALREADY LEARNED — JD Requirement by Requirement

---

### ✅ 1. "Manage security findings, alerts, and exceptions across CSPM, CWPP"

**You know this well. Here's where you learned it:**

| What You Learned | Where |
|-----------------|-------|
| CSPM investigation workflow (filter → examine → remediate/suppress/accept) | `Ultimate_Prep_Part1.md` Section 3.2 |
| CWPP runtime detection investigation (process tree, drift, network) | `Ultimate_Prep_Part1.md` Section 3.3 |
| TP vs FP decision framework (context → process tree → correlation) | `Ultimate_Prep_Part2.md` Section 5.1 |
| Risk acceptance process (document → approve → expiry → review) | `Ultimate_Prep_Part2.md` Section 5.3 |
| Suppression rules with justification, scope, expiry, reviewer | `Ultimate_Prep_Part2.md` Section 5.2 |
| IOA vs IOC vs IOM differences | `Ultimate_Prep_Part2.md` Q10 |
| 20 incident scenarios with console navigation | `Ultimate_Prep_Part1.md` Section 4 |
| 10 PSS misconfigurations with detection + remediation | `Ultimate_Prep_Part1.md` Section 3.8 |
| Alert fatigue management | `Ultimate_Prep_Part2.md` Q9 |

**Wells Fargo Twist:** They use **Wiz** not CrowdStrike. But concepts are identical — you already know the Wiz comparison from Part1 Section 2.3. The key difference: Wiz is 100% agentless (snapshot-based), no runtime sensor.

---

### ✅ 2. "Cloud security misconfigurations across Azure and GCP — IAM, network, storage, VM hardening"

**You know the concepts. Here's what maps:**

| What You Learned | Where |
|-----------------|-------|
| CSPM finding types (open SGs, unencrypted storage, IAM misconfigs) | `EY_Prep.md` Section 3 |
| Multi-cloud security controls matrix (AWS/Azure/GCP) | `Ultimate_Prep_Part1.md` Section 2.4 |
| CIS AWS Benchmarks (detailed control-level) | `Ultimate_Prep_Part2.md` Section 6.1 |
| CIS EKS Benchmarks (12 key controls) | `Ultimate_Prep_Part2.md` Section 6.1 |
| NIST 800-53 → cloud control mapping | `Ultimate_Prep_Part2.md` Section 6.2 |
| IAM privilege escalation paths (12 paths) | `Ultimate_Prep_Part2.md` Section 10 |
| False positive investigation process | `EY_Prep.md` Section 3 Q2 |
| S3/SG/IAM misconfigurations with remediation | `Advanced_Study_Guide.md`, `EY_Prep.md` |
| Azure NSG audit (PowerShell script) | `EY_Prep.md` Section 11 |
| Azure compliance report (PowerShell) | `Automation_Scripts.md` Script 5 (PowerShell) |

**⚠️ Gap:** Your materials are **heavily AWS-focused**. Wells Fargo specifically asks for **Azure and GCP**. You need to study:
- Azure: NSGs, Azure Policy, Key Vault, Defender for Cloud, Entra ID (formerly Azure AD), Storage Account security
- GCP: Firewall Rules, Organization Policies, Cloud KMS, SCC (Security Command Center), IAM Recommender

---

### ✅ 3. "Vulnerability management lifecycle — compliance & vulnerability scanning for containers/Kubernetes"

**Strongly covered:**

| What You Learned | Where |
|-----------------|-------|
| 6-phase vuln lifecycle (Discover → Assess → Prioritize → Remediate → Verify → Report) | `Ultimate_Prep_Part1.md` Section 3.1 |
| SLA framework (severity × exposure × data sensitivity) | `Ultimate_Prep_Part1.md` Section 3.5 |
| SLA escalation chain (50% → 75% → 100% → 150%) | `Ultimate_Prep_Part1.md` Section 3.5 |
| Image assessment workflow | `Ultimate_Prep_Part1.md` Section 2.2 |
| Build-breaking policies (CI/CD security gates) | `Ultimate_Prep_Part1.md` Section 3.7 |
| Container security lifecycle (build → registry → admit → runtime → network) | `EY_Prep.md` Section 6 |
| KAC admission control policies | `CNAPP_Structured_Guide.md`, `KAC_Guide.md` |
| Pod Security Standards (10 misconfigs with scenarios) | `Ultimate_Prep_Part1.md` Section 3.8 |
| Automated SLA tracker script | `Automation_Scripts.md` Script 5 |

---

### ✅ 4. "Wiz (attack paths, compliance issues, CCR)"

**Partially covered — you know the concepts, need Wiz-specific UI knowledge:**

| What You Learned | Where |
|-----------------|-------|
| CNAPP tool comparison (CrowdStrike vs Orca vs **Wiz** vs Prisma) | `Ultimate_Prep_Part1.md` Section 2.3 |
| Attack path analysis (Cloud Risks in Falcon = Attack Path in Wiz) | `Ultimate_Prep_Part1.md` Section 2.2 |
| Compliance framework mapping (CIS, NIST, SOC2, HIPAA, PCI) | `Ultimate_Prep_Part2.md` Section 6 |

**What you know about Wiz specifically:**
- 100% agentless via snapshot scanning
- Strong CSPM, CIEM, DSPM, IaC scanning
- Excellent attack path visualization (graph-based)
- Risk prioritization via "toxic combinations"

**⚠️ Gap:** You haven't studied the **Wiz console UI** specifically. Key Wiz concepts to learn:
- **Wiz Issues** = their version of findings/IOMs
- **Wiz Controls** = specific compliance checks
- **Wiz Rules** = custom detection policies
- **CCR (Cloud Configuration Review)** = Wiz's compliance scanning module
- **Wiz Attack Paths** = graph-based lateral movement visualization
- **Wiz Inventory** = asset graph with relationships

---

### ⚠️ 5. "Splunk — manage security findings and alerts"

**Partially covered:**

| What You Learned | Where |
|-----------------|-------|
| CNAPP → SIEM integration architecture | `EY_Prep.md` Section 8 |
| SIEM correlation rules (CSPM + GuardDuty → P1 escalation) | `Ultimate_Prep_Part2.md` Q17 |
| Falcon Insight query syntax (event_simpleName, CommandLine) | `Ultimate_Prep_Part2.md` Section 9 |

**⚠️ Gap:** You need Splunk-specific skills:
- SPL (Search Processing Language) for log queries
- Splunk dashboards for security KPIs
- Alert configuration and notable events
- CIM (Common Information Model) for data normalization
- Correlation searches and data models

---

### ✅ 6. "SLA tracking reviews, escalations with application teams"

**Well covered from EY prep:**

| What You Learned | Where |
|-----------------|-------|
| SLA framework with tiered severity | `Ultimate_Prep_Part1.md` Section 3.5 |
| Automated SLA escalation engine (Python script) | `Automation_Scripts.md` Script 5 |
| Stakeholder communication (business impact first) | `EY_Prep.md` Section 10, `Part2` Q22 |
| Weekly security office hours concept | `EY_Prep.md` Section 10 |
| Handling pushback from developers | `Ultimate_Prep_Part2.md` Q23 |
| Risk acceptance when you disagree | `Ultimate_Prep_Part2.md` Q24 |
| 30-60-90 day plan structure | `Ultimate_Prep_Part2.md` Q25, `EY_Prep.md` Section 15 |

---

### ✅ 7. "REST APIs and JSON-based datasets for reporting"

**Partially covered through automation scripts:**

| What You Learned | Where |
|-----------------|-------|
| Falcon API authentication (OAuth2 token) | `Automation_Scripts.md` Script 1 |
| AWS Boto3 API calls (EC2, S3, IAM, SecurityHub) | `Automation_Scripts.md` Scripts 1-6 |
| JSON data processing in Python | All automation scripts |
| API-driven alert enrichment | `EY_Prep.md` Section 8 |

---

### ✅ 8. "SOPs, KB articles, remediation guides, documentation"

**Covered conceptually, not as a dedicated skill:**

| What You Learned | Where |
|-----------------|-------|
| Remediation steps for every misconfiguration | `Ultimate_Prep_Part1.md` Section 3.8 (all 10 PSS misconfigs) |
| Runbook updates as post-incident activity | `Ultimate_Prep_Part1.md` Section 3.4 Phase 6 |
| 30-60-90 day plan includes "Document all processes" | `EY_Prep.md` Section 15 |

---

## SECTION 2: WHAT YOU NEED TO LEARN — THE GAPS

### ❌ GAP 1: Power BI / DAX / Power Query (CRITICAL — Required Qualification)

**Why Wells Fargo needs this:** They track cloud security KPIs via Power BI dashboards. The FM team builds datasets from Wiz APIs, CSVs, and databases to create executive reports.

**What to learn:**
```
POWER BI LEARNING PATH:
├── 1. Power BI Desktop basics (drag-and-drop reports, visuals)
├── 2. Power Query (M-language) — connect to CSV, API, database
│   ├── Data cleaning: remove nulls, split columns, merge queries
│   ├── Data shaping: pivot/unpivot, group by, add custom columns
│   └── Incremental refresh for large datasets
├── 3. DAX (Data Analysis Expressions)
│   ├── Measures: CALCULATE, FILTER, SUMX, COUNTROWS
│   ├── Time intelligence: DATEADD, TOTALYTD, SAMEPERIODLASTYEAR
│   ├── Context: row context vs filter context
│   └── KPI measures: SLA compliance %, MTTR, finding age distribution
├── 4. Data modeling
│   ├── Star schema (fact tables + dimension tables)
│   ├── Relationships (one-to-many, many-to-many)
│   └── Role-level security (RLS) for team-specific views
└── 5. Security-specific dashboards
    ├── Finding count by severity over time
    ├── SLA compliance by team / cloud account
    ├── MTTR trends
    ├── Compliance score by framework
    └── Coverage gaps by region / account
```

**Sample DAX you should know:**
```
SLA_Compliance_Rate =
DIVIDE(
    COUNTROWS(FILTER(Findings, Findings[SLA_Status] = "On Track")),
    COUNTROWS(Findings),
    0
) * 100

Open_Critical_Findings =
CALCULATE(
    COUNTROWS(Findings),
    Findings[Severity] = "CRITICAL",
    Findings[Status] = "Open"
)

MTTR_Days =
AVERAGEX(
    FILTER(Findings, Findings[Status] = "Closed"),
    DATEDIFF(Findings[Created_Date], Findings[Closed_Date], DAY)
)
```

---

### ❌ GAP 2: Excel Advanced (Required Qualification)

**What to learn:**
```
EXCEL SKILLS NEEDED:
├── VLOOKUP / XLOOKUP — match findings to asset owners by asset ID
├── INDEX-MATCH — flexible lookup across large datasets
├── PivotTables — summarize findings by severity, team, cloud account
├── Power Query in Excel — same transformations as Power BI
├── Conditional Formatting — heatmaps for SLA status
└── Data Validation — dropdown lists for triage status updates
```

**Example use case:** You receive a CSV with 5,000 Wiz findings. You need to:
1. XLOOKUP the asset owner from a CMDB export
2. PivotTable to show finding count by severity × team
3. Conditional formatting to highlight SLA-breached items in red
4. Power Query to merge with last month's data for trend analysis

---

### ❌ GAP 3: ServiceNow (CMDB, Workflows, Ticket Management)

**What to learn:**
```
SERVICENOW SKILLS NEEDED:
├── CMDB (Configuration Management Database)
│   ├── What it stores: all IT assets with owners, environments, relationships
│   ├── CI (Configuration Item) validation: is the asset in CMDB?
│   ├── Ownership mapping: which team owns this resource?
│   └── CMDB hygiene: stale CIs, missing owners, orphaned assets
├── Incident / Change Management
│   ├── Ticket creation from security findings
│   ├── Assignment groups and routing logic
│   ├── SLA timers and escalation rules
│   └── Change request processing for remediation
├── Workflows
│   ├── Automated ticket routing based on asset tags / cloud account
│   ├── Approval workflows for risk acceptance
│   └── Auto-closure when CNAPP confirms remediation
└── Reporting
    ├── ServiceNow dashboards for security metrics
    ├── CMDB coverage reports
    └── SLA compliance tracking
```

---

### ❌ GAP 4: SQL Queries for Dashboards

**What to learn:**
```sql
-- Example: Finding count by severity and cloud account
SELECT severity, cloud_account, COUNT(*) as finding_count
FROM wiz_findings
WHERE status = 'Open'
GROUP BY severity, cloud_account
ORDER BY 
  CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 
       WHEN 'MEDIUM' THEN 3 ELSE 4 END;

-- Example: SLA compliance by team
SELECT team, 
  COUNT(*) as total,
  SUM(CASE WHEN sla_status = 'On Track' THEN 1 ELSE 0 END) as on_track,
  ROUND(SUM(CASE WHEN sla_status = 'On Track' THEN 1 ELSE 0 END) * 100.0 
        / COUNT(*), 1) as compliance_pct
FROM findings
GROUP BY team
ORDER BY compliance_pct ASC;

-- Example: MTTR by severity
SELECT severity,
  AVG(DATEDIFF(day, created_date, closed_date)) as avg_mttr_days,
  MAX(DATEDIFF(day, created_date, closed_date)) as max_mttr_days
FROM findings WHERE status = 'Closed'
GROUP BY severity;
```

---

### ⚠️ GAP 5: Azure & GCP Specific Knowledge (Deeper Needed)

**What you know (from existing materials):**
- Multi-cloud controls matrix (high-level comparison)
- Azure NSG audit script (PowerShell)
- Azure Policy / GCP Organization Policy concepts
- Azure Key Vault / GCP Cloud KMS mentioned

**What you need to deepen:**

| Azure | GCP |
|-------|-----|
| Defender for Cloud (CSPM equivalent) | Security Command Center (SCC) |
| Entra ID (IAM, PIM, Conditional Access) | IAM, Workload Identity, IAM Recommender |
| NSGs + ASGs + Azure Firewall | Firewall Rules + VPCSC |
| Storage Account security (SAS tokens, private endpoints) | Cloud Storage (uniform bucket, signed URLs) |
| Azure Policy + Blueprints | Organization Policies + Assured Workloads |
| AKS security (pod identity, workload identity) | GKE security (Workload Identity, Binary Auth) |
| Key Vault (CMK, access policies, RBAC) | Cloud KMS (CMEK, key rotation) |
| Azure Resource Graph queries | Asset Inventory API |
| Management Groups hierarchy | Organization → Folders → Projects hierarchy |

---

## SECTION 3: YOUR COMPETITIVE ADVANTAGE — What Makes You Strong for This Role

Despite the gaps above, here's what makes you **very strong** for this role:

```
YOUR STRENGTHS FOR WELLS FARGO:

1. FINDINGS MANAGEMENT EXPERTISE     ← This IS the role
   • Full TP/FP investigation framework
   • Risk acceptance process with governance
   • Suppression management with accountability
   • SLA tracking and escalation automation
   
2. CSPM/CWPP DEEP KNOWLEDGE          ← Technical core
   • 20 incident scenarios with investigation steps
   • 10 PSS misconfigurations with remediation
   • CIS/NIST compliance mapping (control-level)
   • Detection types, severity, and TP rates
   
3. AUTOMATION MINDSET                 ← They want this
   • 6 Python automation scripts ready to discuss
   • API integration experience (Falcon, AWS)
   • Event-driven remediation architecture
   • Auto-escalation engine for SLAs
   
4. STAKEHOLDER MANAGEMENT            ← FM team is customer-facing
   • Business-impact-first communication style
   • Developer pushback handling
   • Office hours concept
   • Risk acceptance governance
   
5. VULNERABILITY MANAGEMENT          ← Core responsibility
   • Complete 6-phase lifecycle
   • Context-based prioritization (not just CVSS)
   • Attack path analysis for finding correlation
   • Build-breaking policies
```

---

## SECTION 4: STUDY PLAN — Priority Order for Wells Fargo Prep

```
WEEK 1 (HIGHEST PRIORITY):
├── ⬜ Power BI basics — install Desktop, build first dashboard from CSV
├── ⬜ DAX fundamentals — CALCULATE, COUNTROWS, DIVIDE, time intelligence
├── ⬜ Power Query — connect to CSV, clean data, merge queries
└── ⬜ Build a sample "Security Findings Dashboard" in Power BI

WEEK 2:
├── ⬜ Excel advanced — XLOOKUP, INDEX-MATCH, PivotTables, conditional formatting
├── ⬜ SQL fundamentals — SELECT, JOIN, GROUP BY, aggregation, subqueries
├── ⬜ Practice: take a sample findings CSV → Excel analysis → Power BI dashboard
└── ⬜ Wiz platform — watch YouTube demos, read Wiz docs (Issues, Controls, CCR)

WEEK 3:
├── ⬜ ServiceNow fundamentals — CMDB concepts, ticket lifecycle, assignment groups
├── ⬜ Azure security deep dive — Defender for Cloud, Entra ID, NSGs, Storage
├── ⬜ GCP security deep dive — SCC, IAM, Firewall Rules, Cloud KMS
└── ⬜ Splunk SPL basics — search, stats, timechart, eval, lookup

WEEK 4 (REVIEW):
├── ⬜ Re-read Ultimate_Prep_Part1 (Sections 2, 3 — platform workflows)
├── ⬜ Re-read Ultimate_Prep_Part2 (Section 5 TP/FP, Section 6 CIS/NIST)
├── ⬜ Practice interview Q&A — all 25 questions from Part2 Section 8
├── ⬜ Build a 30-60-90 day plan specifically for Wells Fargo FM role
└── ⬜ Prepare 2-3 STAR stories focused on findings management
```

---

## SECTION 5: FILES YOU CREATED — Quick Reference

| File | Key Content for This Role |
|------|--------------------------|
| `Ultimate_Interview_Prep_Part1.md` | Platform workflows, CSPM/CWPP investigation, IR lifecycle, 20 scenarios, PSS misconfigs |
| `Ultimate_Interview_Prep_Part2.md` | TP/FP framework, CIS/NIST compliance, 25 interview Q&As, SLA framework |
| `EY_Cloud_Security_Interview_Prep.md` | Multi-cloud IAM, vuln management lifecycle, SIEM integration, stakeholder mgmt |
| `Cloud_Security_Automation_Scripts.md` | 6 Python scripts — coverage reconciliation, PSS scanner, auto-remediation, SLA tracker |
| `Advanced_Cloud_Security_Study_Guide.md` | AWS attack scenarios, detection engineering, CloudTrail analysis |
| `CNAPP_Structured_Guide.md` | Sensor deployment, KAC architecture, runtime security principles |
| `KAC_and_Runtime_Detections_Guide.md` | 15 runtime detection scenarios, KAC policy types |
| `Cloud_Security_Complete_Playbook.md` | K8s breach simulation, MITRE ATT&CK mapping, SOC checklist |
| `cloud_security_interview_guide.md` | 15 attack scenarios, EKS security, command references |

---

> **Bottom Line:** You have ~70% of the technical security knowledge this role needs. The **big gaps are tooling-specific**: Power BI, Excel advanced, ServiceNow, and SQL. These are learnable in 2-3 weeks of focused study. Your CSPM/CWPP findings management knowledge is your strongest differentiator — that's the actual job.
