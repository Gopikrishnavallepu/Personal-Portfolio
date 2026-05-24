# 🎯 DAZN — Cloud Security Engineer Interview Preparation

> **Role:** Cloud Security Engineer
> **Company:** DAZN (Sports Streaming Platform)
> **Duration:** 1-Hour Deep Technical Interview
> **Primary Cloud:** AWS | Secondary: Azure, GCP, OCI
> **Key Tool:** Wiz (CSPM/CNAPP)
> **Created:** April 2026

---

## 📋 TABLE OF CONTENTS — 1-HOUR INTERVIEW SCHEDULE

| Time Block | Section | Topics | Est. Duration |
|------------|---------|--------|---------------|
| 0:00–0:05 | [SECTION 1](#section-1-self-introduction--role-fit) | Self-Introduction & Role Fit | 5 min |
| 0:05–0:20 | [SECTION 2](#section-2-cloud-security-posture-management-with-wiz) | Wiz CSPM — Triage, Remediation, Reporting | 15 min |
| 0:20–0:30 | [SECTION 3](#section-3-aws-security-services--architecture) | AWS Security Deep Dive — IAM, SGs, VPCs, FW Manager | 10 min |
| 0:30–0:40 | [SECTION 4](#section-4-infrastructure-as-code-security--cicd) | IaC Security (Terraform/CFN) & CI/CD Pipeline Security | 10 min |
| 0:40–0:48 | [SECTION 5](#section-5-container-security--ekskubernetes) | Container Security — EKS/Kubernetes | 8 min |
| 0:48–0:53 | [SECTION 6](#section-6-waf-operations--multi-cloud) | WAF Operations & Multi-Cloud | 5 min |
| 0:53–0:58 | [SECTION 7](#section-7-automation-standards--security-operations) | Automation, Standards & Security Operations | 5 min |
| 0:58–1:00 | [SECTION 8](#section-8-behavioral--closing) | Behavioral & Closing | 2 min |

---

## 📁 FILE INDEX — YOUR EXISTING KNOWLEDGE BASE

> **Don't recreate — navigate. Each topic below links to your existing files.**

### 🔴 CRITICAL FILES FOR DAZN (Read These First)

| Priority | File | What It Covers | DAZN JD Mapping |
|----------|------|---------------|-----------------|
| 1️⃣ | [Wiz CSPM Interview Q&A](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | 28 Wiz questions — Security Graph, toxic combinations, CIEM, DSPM, CI/CD, multi-cloud, K8s, attack paths | CSPM posture management, triage, reporting |
| 2️⃣ | [AWS IAM Q&A](../AWS_Security_QA/Answers_Section1_IAM.md) | 10 IAM scenarios — cross-account, Lambda roles, leaked keys, SCPs, break-glass, federation | AWS IAM, Security Groups, VPCs |
| 3️⃣ | [AWS Network & S3 Q&A](../AWS_Security_QA/Answers_Section2_Network_Section3_S3.md) | VPC design, SG vs NACL, Transit Gateway, VPC endpoints, DDoS, S3 security | Network security architecture |
| 4️⃣ | [AWS Compute & AppSec Q&A](../AWS_Security_QA/Answers_Section6_Compute_Section7_AppSec.md) | EC2 hardening, ECS/Fargate, Lambda, WAF rules, CI/CD security, IaC scanning | WAF, CI/CD pipeline security |
| 5️⃣ | [EKS & K8s Security CNAPP](../../Container_K8s_Security/EKS_K8s_Security_CNAPP.md) | Full EKS security — 6 pillars, image scanning, RBAC, runtime, admission control, incident response | Container security, EKS/K8s |
| 6️⃣ | [Azure, GCP & Wiz Gap Notes](../WellsFargo_Prep/WF_Gap_Notes_Part3_Azure_GCP_Wiz.md) | Azure security stack, GCP security, Wiz console navigation, attack paths | Multi-cloud, Wiz experience |

### 🟠 SUPPLEMENTARY FILES

| File | What It Covers | DAZN JD Mapping |
|------|---------------|-----------------|
| [Cloud Security Automation Scripts](../../Cloud_Security_Guides/Cloud_Security_Automation_Scripts.md) | 10 Python scripts — sensor coverage, S3 remediation, SG fix, SLA tracker | Automation opportunities |
| [Ultimate Interview Prep Part 1](../General_Interview/Ultimate_Interview_Prep_Part1.md) | Falcon platform deep dive, IR lifecycle, SLA framework, build-breaking policies | Cloud security operations |
| [Ultimate Interview Prep Part 2](../General_Interview/Ultimate_Interview_Prep_Part2.md) | TP/FP framework, CIS/NIST compliance, 25 Q&As | False positive handling |
| [Cloud Security Complete Playbook](../../Cloud_Security_Guides/Cloud_Security_Complete_Playbook.md) | K8s breach simulation, MITRE ATT&CK, SOC analyst checklist | Incident response |
| [Prisma Cloud CSPM Q&A](../CNAPP_CSPM_Platforms/Prisma_Cloud_CSPM_Interview_QA.md) | 28 Prisma questions — RQL, policy framework, CIEM, compliance | CSPM breadth knowledge |
| [EY Cloud Security Prep](../EY_Prep/EY_Cloud_Security_Interview_Prep.md) | CNAPP deep dive, vulnerability lifecycle, SIEM integration, 30-60-90 plan | Holistic cloud security |
| [AWS Encryption & Logging Q&A](../AWS_Security_QA/Answers_Section4_Encryption_Section5_Logging.md) | KMS, CloudTrail, CloudWatch, Config | Logging & monitoring |
| [AWS Compliance & Grilling Q&A](../AWS_Security_QA/Answers_Section8_Compliance_Section9_Grilling.md) | Organizations, SCPs, compliance, deep-dive grilling | Compliance & governance |
| [K8s Security Manifests](../../Container_K8s_Security/K8s_Security_Manifests_Examples.md) | SecurityContext, NetworkPolicy, RBAC YAML examples | Hands-on K8s security |

---

# SECTION 1: SELF-INTRODUCTION & ROLE FIT

---

### Q1. "Tell me about yourself and why you're interested in this role at DAZN."

**Answer:**

> "Hello, I'm Gopikrishna Vallepu, a Security Analyst with approximately 4 years of experience in SOC operations, threat detection, and cloud security monitoring. I started my career building a strong foundation in networking and infrastructure during my time as a Technical Apprentice at Cisco, which gave me a deep understanding of how enterprise environments operate.
>
> For the past 3+ years, I've been working in SOC environments where my role evolved from basic alert triage to deep investigation and incident handling. Currently at **UltraViolet Cyber**, I investigate security incidents using **SecureWorks Taegis XDR** and **CrowdStrike Falcon EDR**, performing alert triage, log correlation, and threat analysis across endpoint, network, and **AWS cloud environments**.
>
> On the cloud side, I contribute to **CSPM operations** — identifying high-risk AWS misconfigurations like exposed S3 buckets, overly permissive IAM policies, and open security groups, while ensuring compliance with **CIS AWS Foundations benchmarks**. I also support **CWPP operations** by validating Falcon sensor deployment across **EKS clusters** and monitoring CrowdStrike runtime detections on EC2 and containerized workloads.
>
> **What excites me about DAZN** is the opportunity to **define and build** a cloud security function from the ground up. DAZN operates a global streaming platform at massive scale — that means real attack surfaces, real-time availability requirements, and engineering teams that need a security partner, not a gatekeeper. The tech stack — Wiz for CSPM, AWS-primary with multi-cloud, EKS for containers — aligns directly with my hands-on experience.
>
> I bring three things that align with this JD:
> 1. **Threat detection depth** — 3+ years of SIEM/XDR investigations, IOC threat hunting, and MITRE ATT&CK-mapped analysis — I know the attacker's perspective when I look at a CSPM finding
> 2. **Cloud security hands-on** — AWS CSPM, CIS benchmarks, EKS sensor validation, S3/IAM/SG remediation — not aspirational, it's my current job
> 3. **Engineering collaboration** — I don't just file tickets; I trace misconfigurations to their source and work directly with teams to fix them. I'm not a blocker — I'm an enabler."

---

### Q2. "What does 'defining and building a cloud security function' mean to you?"

**Answer:**

> "It means going from zero to operational maturity in cloud security. At DAZN, this is what I'd build:
>
> **Month 1 — Foundation:**
> - Onboard all AWS accounts (and Azure/GCP/OCI) to Wiz with proper connector setup
> - Establish the initial findings baseline — understand the current posture
> - Define severity-based SLA framework tailored to DAZN's risk profile (streaming platform = availability is critical)
> - Set up alert routing: Critical → PagerDuty/Slack, High → Jira auto-ticket, Medium → weekly report
>
> **Month 2 — Operationalize:**
> - Build triage workflows — classify IOMs, assign owners via tagging/CMDB integration
> - Integrate Wiz with CI/CD pipelines for IaC scanning (catch Terraform misconfigs pre-deploy)
> - Create cloud security standards and runbooks for the top 20 recurring misconfigurations
> - Establish remediation tracking dashboards for engineering leadership
>
> **Month 3 — Mature:**
> - Implement automated remediation for low-complexity, high-frequency findings (public S3, open SGs)
> - Build compliance reporting for DAZN's regulatory requirements
> - Identify attack paths unique to DAZN's architecture and break the highest-risk ones
> - Establish a regular cadence: weekly remediation reviews, monthly posture reports, quarterly risk assessments
>
> The key metric: CISOs don't want to hear 'we have 3,000 findings.' They want to hear 'we had 12 critical attack paths, now we have 3, and here's how we closed the other 9.'"

📖 **Deeper reading:** [EY 30-60-90 Day Plan](../EY_Prep/EY_Cloud_Security_Interview_Prep.md) (Section 15) | [Wiz Onboarding Q8](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md)

---

# SECTION 2: CLOUD SECURITY POSTURE MANAGEMENT WITH WIZ

---

### Q3. "How does Wiz work? Explain its architecture and what makes it different."

**Answer:**

> "Wiz is an **agentless CNAPP** that connects to cloud provider APIs using read-only cross-account roles. It has three data collection layers:
>
> 1. **Cloud API Enumeration** — reads every resource's configuration via native APIs (EC2, IAM, S3, EKS, VPC, etc.)
> 2. **Disk Snapshot Analysis** — takes point-in-time EBS snapshots, mounts them in an isolated environment, scans for CVEs, secrets, malware, and sensitive data, then deletes the snapshot
> 3. **Kubernetes API Analysis** — connects to the K8s API server to enumerate RBAC, workloads, network policies, and pod security settings
>
> What sets Wiz apart is the **Security Graph** — it maps every resource as a node and every relationship as an edge, then computes **toxic combinations** where multiple low-severity issues chain into critical attack paths. A public-facing EC2 instance with a critical CVE, an overly-permissive IAM role, and access to a PII S3 bucket isn't three medium findings — it's one critical attack path."

📖 **Full deep dive:** [Wiz CSPM Q&A — Q1-Q5](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md)

---

### Q4. "How would you establish cloud security posture management using Wiz at DAZN — including triage workflows, remediation tracking, and reporting?"

**Answer (This is a KEY DAZN JD question):**

> **Triage Workflow:**
> 1. Wiz scans continuously and generates **Issues** (findings categorized as misconfiguration, vulnerability, network exposure, identity risk, or data exposure)
> 2. Each morning, I review new Critical/High issues, filtering by `cloud account = production` and `severity >= High`
> 3. For each issue, I determine:
>    - **True positive?** → Verify the resource configuration against the Wiz evidence
>    - **Who owns it?** → Check cloud tags, team labels, or CMDB mapping
>    - **Part of an attack path?** → Check the Security Graph for connected risks
> 4. True positives get a Jira ticket auto-created via Wiz integration, with:
>    - Affected resource ARN, region, account
>    - Exact remediation steps (CLI/Terraform/Console)
>    - SLA based on severity + exposure (Critical public = 4h, Critical internal = 24h, High = 48h)
>    - Assigned to the team that owns the resource
> 5. False positives get a **scoped exception** in Wiz with documented justification and 90-day expiry
>
> **Remediation Tracking:**
> - Weekly governance dashboard: open findings by severity, SLA compliance %, team-level remediation velocity
> - Attack path tracking: "We started the quarter with 15 critical attack paths, currently at 7"
> - Automated escalation: SLA at 50% → email owner, 75% → Slack team lead, 100% → JIRA escalate to manager, 150% → CISO
>
> **Reporting:**
> - **Engineering teams:** Filtered view of their findings only, ranked by risk
> - **CISO/Leadership:** Attack path summary, compliance posture, trend lines, top 5 risks
> - **Compliance/Audit:** Framework-specific reports (CIS, NIST, PCI, SOC2) — one-click export from Wiz

📖 **Deeper reading:** [Wiz Alert Management Q12](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | [SLA Framework](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 3.5) | [Wiz Issues Lifecycle](../WellsFargo_Prep/WF_Gap_Notes_Part3_Azure_GCP_Wiz.md) (Section 3.4)

---

### Q5. "How do you assess findings, determine real-world risk, and cut through noise and false positives?"

**Answer:**

> "I use a **4-layer risk assessment model** that goes beyond CVSS:
>
> **Layer 1 — Is it technically valid?** Does the raw configuration actually violate the control? Sometimes rules fire on edge cases that aren't truly insecure.
>
> **Layer 2 — What's the exposure context?**
> - Is the resource internet-facing or internal?
> - What IAM permissions are attached?
> - Does it contain or access sensitive data (DSPM classification)?
> - Is it in production or dev?
>
> **Layer 3 — Is it part of an attack path?** A public S3 bucket with test data is a medium. The same bucket accessible via an overly-permissive IAM role on an internet-facing vulnerable VM is critical — Wiz's Security Graph shows this.
>
> **Layer 4 — Exploitability.** Is there a known exploit in the wild? Is it in the CISA KEV catalog? What's the EPSS score?
>
> **Cutting through noise specifically at DAZN:**
> DAZN is a streaming platform — they'll have thousands of cloud resources. The key is:
> - Focus on **attack paths**, not individual findings
> - Segment by environment: production findings ≠ dev findings
> - Auto-suppress known-accepted patterns with documented justification and expiry
> - Track the false positive rate per rule — if a rule has <50% TP rate, tune or scope it down
> - Never suppress without documentation, owner sign-off, and expiry date"

📖 **Deeper reading:** [TP/FP Investigation Framework](../General_Interview/Ultimate_Interview_Prep_Part2.md) | [Wiz Prioritization Q9](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | [Handling Developer Pushback Q19](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md)

---

### Q6. "Scenario: Wiz identifies a production EC2 instance appearing in 3 different Critical attack paths. How do you respond?"

**Answer:**

> **Immediate (0-30 min):**
> 1. Open the Security Graph — visualize all 3 attack paths to understand entry points, pivots, and targets
> 2. Identify why this instance is in 3 paths — likely it's internet-facing + has a Critical CVE + overly-permissive IAM role + accesses sensitive data
> 3. Check Wiz Defend / CDR signals — any evidence of active exploitation? If yes → activate IR playbook
>
> **Remediation (Priority order — break the most paths with the fewest changes):**
> 4. **Identity fix first** (usually breaks multiple paths): Restrict the IAM role from `s3:*` to specific bucket ARNs
> 5. **Network hardening**: If it doesn't need to be public, move it behind an ALB/WAF or restrict the security group
> 6. **Patch vulnerabilities**: Schedule emergency change to patch the Critical CVE
> 7. **Verify in Wiz**: After each change, confirm the attack paths are broken
>
> **Communication:**
> 8. Brief the security team and instance owner with a clear risk statement: "This instance was reachable from the internet, had a known exploit, and could access 50K customer records in S3. We've closed all 3 paths by restricting IAM and patching."

📖 **Full scenario:** [Wiz Scenario Q16-Q18](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md)

---

# SECTION 3: AWS SECURITY SERVICES & ARCHITECTURE

---

### Q7. "Walk me through how you'd secure AWS IAM in a large environment like DAZN."

**Answer:**

> "For a streaming platform with multiple teams and services:
>
> **Foundation:**
> - **AWS Organizations** with SCPs as guardrails — deny dangerous actions (delete CloudTrail, create root access keys, launch in non-approved regions)
> - **SSO/Federation** via Okta/Azure AD — no IAM users with console passwords; all access via federated roles
> - **Permission boundaries** on all developer roles — cap maximum permissions regardless of attached policies
>
> **Least Privilege Enforcement:**
> - **IAM Access Analyzer** — analyze CloudTrail to generate least-privilege policies based on actual 90-day usage
> - **CIEM in Wiz** — compute effective permissions including transitive role assumptions and unused privileges
> - **Automated key rotation** — AWS Config rule `access-keys-rotated` enforced at 90 days
>
> **Monitoring & Response:**
> - **GuardDuty** — detects credential compromise, impossible travel, anomalous API calls
> - **CloudTrail** — full API audit log across all accounts, data events on sensitive S3 buckets
> - **EventBridge** → Lambda automated response for credential compromise: auto-disable keys, attach deny-all policy, notify SOC
>
> **DAZN-specific consideration:** Streaming services use many service-to-service IAM roles (API Gateway → Lambda → DynamoDB → S3). Each role must be scoped to exactly what it needs — IRSA for EKS pods instead of node instance profiles."

📖 **Full IAM deep dive:** [AWS IAM Q&A — Q1-Q10](../AWS_Security_QA/Answers_Section1_IAM.md) | [Multi-cloud IAM](../EY_Prep/EY_Cloud_Security_Interview_Prep.md) (Section 5)

---

### Q8. "Explain VPC architecture security — Security Groups, NACLs, FW Manager, and how they work together."

**Answer:**

> "**Layered network security in AWS:**
>
> | Layer | Tool | Function | Stateful? |
> |-------|------|----------|-----------|
> | **VPC Level** | VPC + Subnets | Network isolation — public/private/isolated subnets | N/A |
> | **Subnet Level** | NACLs | Stateless L3/L4 filtering — explicit allow/deny for subnet ingress/egress | ❌ Stateless |
> | **Instance Level** | Security Groups | Stateful L3/L4 filtering — allow rules only (implicit deny) | ✅ Stateful |
> | **Service Level** | AWS Network Firewall | Stateful L3-L7 — domain filtering, IDS/IPS (Suricata rules) | ✅ Stateful |
> | **Org Level** | AWS Firewall Manager | Centralized SG/WAF/Network FW policy management across all accounts | N/A |
>
> **How I'd use AWS Firewall Manager at DAZN:**
> - Create **organization-wide security group policies** — baseline SG rules applied to all accounts (e.g., no 0.0.0.0/0 to SSH/RDP)
> - Centrally deploy **WAF policies** across all ALBs, CloudFront distributions, and API Gateways
> - **Audit mode first** — use Firewall Manager to find non-compliant SGs before enforcing
> - Detect and auto-remediate: `0.0.0.0/0` ingress on critical ports → auto-revoke via EventBridge + Lambda
>
> **Common DAZN Troubleshooting Scenario:**
> If an EKS pod can't reach an RDS database:
> 1. Check the **Security Group** on the RDS instance — does it allow inbound from the EKS worker node SG?
> 2. Check the **NACL** on the database subnet — outbound ephemeral ports (1024-65535) allowed back? (NACLs are stateless!)
> 3. Check the **Route Table** — does the EKS subnet have a route to the RDS subnet?
> 4. Use **VPC Flow Logs** — filter by the pod IP, check if traffic is ACCEPT or REJECT"

📖 **Full network deep dive:** [AWS Network Q&A — Q11-Q20](../AWS_Security_QA/Answers_Section2_Network_Section3_S3.md) | [VPC Endpoint Security Q17](../AWS_Security_QA/Answers_Section2_Network_Section3_S3.md)

---

### Q9. "How would you handle cloud vulnerability management across AWS, Azure, GCP, and OCI?"

**Answer:**

> "The key is a **unified platform approach with Wiz as the single pane of glass:**
>
> **Wiz normalizes resources across clouds:**
> - AWS EC2 / Azure VM / GCP Compute → 'Virtual Machine' nodes in the Security Graph
> - AWS IAM Role / Azure Managed Identity / GCP Service Account → 'Cloud Identity' nodes
> - AWS S3 / Azure Blob / GCP Cloud Storage → 'Object Storage' nodes
>
> **Single vulnerability lifecycle across all clouds:**
> 1. **Discover:** Wiz scans all cloud accounts — agentless, no deployment overhead per cloud
> 2. **Assess:** Contextual risk scoring — same CVE gets different severity based on exposure across clouds
> 3. **Prioritize:** Attack path analysis spans clouds — a compromised AWS Lambda that federates to Azure AD is a cross-cloud path
> 4. **Remediate:** Same Jira/ServiceNow workflow regardless of cloud — SLA tracks by risk, not by cloud
> 5. **Verify:** Wiz re-scans and auto-closes resolved findings
>
> **Cloud-specific nuances I handle:**
> - **AWS (primary):** GuardDuty, Inspector, Config, Security Hub as supplementary native tools
> - **Azure:** Defender for Cloud, Entra ID, NSG audit
> - **GCP:** Security Command Center, IAM Recommender, Org Policies
> - **OCI:** Cloud Guard, Network Security Groups, IAM domain policies
>
> **Unified reporting:** One dashboard showing vulnerability count, SLA compliance, and attack paths across all clouds — not separate dashboards per provider."

📖 **Multi-cloud security:** [Azure/GCP/Wiz Gap Notes](../WellsFargo_Prep/WF_Gap_Notes_Part3_Azure_GCP_Wiz.md) | [Wiz Multi-Cloud Q15](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | [Multi-Cloud Controls Matrix](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 2.4)

---

# SECTION 4: INFRASTRUCTURE AS CODE SECURITY & CI/CD

---

### Q10. "How do you trace misconfigurations to their source in Terraform/CloudFormation and work with the teams who deploy?"

**Answer (KEY DAZN JD question):**

> "This is about connecting **runtime findings back to code** — the shift-left loop:
>
> **Step 1: Identify the runtime misconfiguration in Wiz**
> - Example: Wiz flags a Security Group allowing `0.0.0.0/0` ingress on port 22 in production
>
> **Step 2: Trace to the IaC source**
> - Check the resource's tags for `terraform:workspace`, `terraform:module`, `aws:cloudformation:stack-name`
> - Use Wiz's IaC drift detection — it can show when the runtime config diverged from the IaC definition
> - If the misconfiguration is in the Terraform code, find the exact `.tf` file and line:
> ```hcl
> # The problem:
> resource 'aws_security_group_rule' 'ssh' {
>   type        = 'ingress'
>   from_port   = 22
>   to_port     = 22
>   cidr_blocks = ['0.0.0.0/0']  # ← THIS IS THE ROOT CAUSE
> }
> ```
>
> **Step 3: Fix at the source, not the console**
> - Create a PR to fix the Terraform code — don't fix in the AWS console (it'll drift back)
> - Provide the exact remediation:
> ```hcl
> # The fix:
> cidr_blocks = ['10.0.0.0/8']  # Corporate CIDR only
> # Or better yet — use SSM Session Manager and remove SSH SG entirely
> ```
>
> **Step 4: Prevent recurrence in the CI/CD pipeline**
> - Add **Wiz IaC scanning** (or Checkov/tfsec) as a pipeline step:
> ```yaml
> - name: Wiz IaC Scan
>   uses: wiz-sec/iac-scan-action@v1
>   with:
>     policy: 'Default IaC Policy'
>     fail-on-severity: 'HIGH'
>     path: './terraform'
> ```
> - This blocks the same misconfiguration from ever reaching production again
>
> **How I work with engineering teams:**
> - I don't just file a ticket that says 'fix this SG.' I provide the exact Terraform diff
> - I hold weekly security office hours where teams can ask questions and get help
> - I create runbooks for the top 20 recurring IaC misconfigurations with copy-paste Terraform fixes
> - I deploy IaC scanning in **COUNT mode first** for 2 weeks — observe impact, tune exceptions — then switch to **BLOCK** for Critical/High"

📖 **Full IaC security:** [IaC Security Q50](../AWS_Security_QA/Answers_Section6_Compute_Section7_AppSec.md) | [Wiz CI/CD Integration Q13](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | [Build-Breaking Policy](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 3.7)

---

### Q11. "Walk me through your approach to securing CI/CD pipelines."

**Answer:**

> "CI/CD pipeline security at DAZN has **4 gates**:
>
> | Gate | Stage | Tool | Action on Failure |
> |------|-------|------|-------------------|
> | 1 | **Pre-commit** | Pre-commit hooks (tfsec, detect-secrets) | Block commit locally |
> | 2 | **Build (IaC)** | Wiz IaC Scanner / Checkov / tfsec | Fail pipeline on Critical/High |
> | 3 | **Build (Image)** | Wiz Image Scan / Trivy / Snyk | Block push to ECR on Critical CVE |
> | 4 | **Deploy (Admission)** | Kubernetes Admission Controller (Wiz/OPA) | Reject non-compliant pods |
>
> **Pipeline security hardening:**
> - Build environment runs in a **private VPC** — no internet access, pull dependencies from internal artifact mirror
> - Build role is **least-privilege** — only access to ECR, S3 artifacts, Secrets Manager
> - **No secrets in environment variables** — use Secrets Manager references in buildspec
> - **Image signing** with AWS Signer — verify signatures at admission
> - **OIDC federation** for GitHub Actions — no long-lived AWS access keys
>
> **Exception process:**
> - Developer gets a build failure → reads exact finding + remediation
> - If a legitimate exception is needed → time-limited bypass (max 7 days) via #checkov:skip annotation with Jira ticket reference
> - All exceptions are auditable in git history"

📖 **Full CI/CD security:** [CI/CD Security Q48](../AWS_Security_QA/Answers_Section6_Compute_Section7_AppSec.md) | [Build-Breaking Policy](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 3.7)

---

# SECTION 5: CONTAINER SECURITY — EKS/KUBERNETES

---

### Q12. "How do you approach container security in an EKS environment, particularly using a CNAPP/Wiz?"

**Answer:**

> "I secure EKS through **6 pillars**, mapped to the CNAPP platform:
>
> | Pillar | What | How |
> |--------|------|-----|
> | **1. Image Scanning** | Scan every container image for CVEs, malware, secrets | Wiz scans ECR registries + running images continuously; CI/CD gate blocks Critical CVEs |
> | **2. Configuration Posture** | Audit K8s configs against CIS EKS Benchmark | Wiz CSPM flags: privileged pods, root containers, missing NetworkPolicies, wildcard RBAC, hostPath mounts |
> | **3. Runtime Protection** | Detect live threats in containers | Wiz Defend (eBPF sensors) for runtime CDR — container escape, drift, reverse shells |
> | **4. Admission Control** | Block non-compliant workloads before they run | Wiz Admission Controller (or OPA Gatekeeper) — reject unscanned images, privileged pods, unauthorized registries |
> | **5. Identity (CIEM)** | Audit K8s RBAC + cloud IAM (IRSA) | Wiz maps: ServiceAccount → RBAC → IRSA role → AWS resources. Flag overprivileged identities |
> | **6. Network Visibility** | Map pod-to-pod traffic, detect lateral movement | NetworkPolicies (default-deny per namespace) + Wiz network visualization |
>
> **EKS-specific security checks:**
> - `aws-auth` ConfigMap — no `system:masters` mappings for non-admin identities
> - IRSA (IAM Roles for Service Accounts) — every pod uses IRSA, not node instance profile
> - IMDSv2 enforced with hop limit = 1 — prevents SSRF-based credential theft
> - EKS control plane logging enabled (API server, authenticator, audit)
> - EKS cluster endpoint — private only or restricted to corporate CIDRs
>
> **Rollout strategy for admission control:**
> Week 1-2: Deploy in **ALERT** mode → observe what would be blocked
> Week 3: Review alerts → create exceptions for legitimate cases (e.g., Falcon sensor DaemonSet)
> Week 4: Switch Critical rules to **PREVENT** mode
> Ongoing: Add rules incrementally — avoid 'big bang' disruption"

📖 **Full EKS security guide:** [EKS & K8s Security CNAPP](../../Container_K8s_Security/EKS_K8s_Security_CNAPP.md) | [K8s Security in Wiz Q23](../CNAPP_CSPM_Platforms/Wiz_CSPM_Interview_QA.md) | [K8s Manifests Examples](../../Container_K8s_Security/K8s_Security_Manifests_Examples.md)

---

### Q13. "Scenario: A container escape is detected in a production EKS cluster. Walk through your response."

**Answer:**

> "**Phase 1 — Identify (0-5 min):**
> Wiz Defend / Falcon fires `ContainerEscape.Nsenter`. Check: cluster = `prod-eks-01`, namespace = `payments`, pod = `api-server-xyz`. Process tree shows: `java → /bin/sh → nsenter -t 1 -m -u -i -n -p -- /bin/bash`. All namespace flags targeting PID 1 = **HOST ACCESS**. Verdict: **TRUE POSITIVE — CRITICAL**.
>
> **Phase 2 — Contain (5-15 min):**
> ```bash
> kubectl delete pod api-server-xyz -n payments --grace-period=0   # Kill pod
> kubectl cordon ip-10-0-1-42.ec2.internal                        # Preserve evidence
> kubectl apply -f emergency-deny-all-netpol.yaml -n payments     # Isolate namespace
> ```
> Check if kubelet kubeconfig was accessed → if yes, assume full cluster compromise → rotate cluster certificates
>
> **Phase 3 — Investigate (15-120 min):**
> - **Entry point:** Was the pod privileged? (Root cause: `privileged: true` in security context)
> - **Lateral movement:** Did they read service account token? Query K8s API? Access IMDS?
> - **Data access:** CloudTrail for API calls via node instance profile; S3/RDS access logs
> - **Persistence:** New ClusterRoleBindings? Rogue DaemonSets? Modified `aws-auth` ConfigMap?
>
> **Phase 4 — Eradicate & Harden:**
> - Remove persistence, rotate all namespace secrets, replace the compromised node
> - Root cause fix: Remove `privileged: true`, enforce PSA `restricted` on the namespace
> - Deploy KAC rule to permanently block privileged containers
>
> **Phase 5 — Post-incident:**
> - Incident report with timeline, root cause, blast radius
> - Action items: KAC enforcement, PSA labels, RBAC audit, NetworkPolicy default-deny"

📖 **Full incident playbook:** [Container Escape IR](../../Container_K8s_Security/EKS_K8s_Security_CNAPP.md) (Part 3.3) | [IR Lifecycle](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 3.4)

---

# SECTION 6: WAF OPERATIONS & MULTI-CLOUD

---

### Q14. "How would you support and improve WAF operations at DAZN?"

**Answer:**

> "For a streaming platform like DAZN, WAF protects APIs and web frontends from:
>
> **AWS WAF Rule Strategy:**
> 1. **AWS Managed Rule Groups (baseline):**
>    - Core Rule Set (CRS) — OWASP Top 10 coverage
>    - SQL Database — injection patterns
>    - Known Bad Inputs — Log4Shell, Spring4Shell signatures
>    - IP Reputation List — known bad IPs
>    - Bot Control — scrapers, credential stuffers (critical for streaming auth)
>
> 2. **Custom Rate Limiting (DAZN-specific):**
>    - Rate limit per API key: Prevent any single client from overwhelming the API
>    - Rate limit per IP: Block brute-force login attempts
>    - Geographic blocking: If DAZN operates in specific markets, block traffic from non-operational regions
>
> 3. **WAF Tuning Workflow (supporting existing WAF engineers):**
>    - **Deploy new rules in COUNT mode** for 1-2 weeks
>    - Analyze WAF logs (S3 + Athena): `SELECT * FROM waf_logs WHERE action = 'COUNT'`
>    - Identify legitimate traffic being flagged → create scope-down exclusions
>    - Switch to BLOCK only after confirming no false positives
>    - Monitor post-deployment: any spike in 403s from legitimate users?
>
> 4. **Integration with Wiz:**
>    - Wiz identifies internet-facing resources without WAF → I ensure they get WAF coverage
>    - AWS Firewall Manager → centrally deploy WAF policies across all ALBs and CloudFront distributions
>
> **Improvement opportunities:**
> - Automate WAF log analysis for anomaly detection
> - Create WAF dashboards showing: block rates, top blocked rules, geographic patterns
> - Integrate WAF events with SIEM for correlation with other threat signals"

📖 **WAF deep dive:** [WAF Rule Design Q46](../AWS_Security_QA/Answers_Section6_Compute_Section7_AppSec.md) | [DDoS Protection Q15](../AWS_Security_QA/Answers_Section2_Network_Section3_S3.md)

---

### Q15. "How do you handle security across multiple clouds — AWS, Azure, GCP, and OCI?"

**Answer:**

> "The process is identical regardless of cloud — the tool differences are implementation details:
>
> | Capability | AWS | Azure | GCP | OCI |
> |-----------|-----|-------|-----|-----|
> | **Guardrails** | SCPs | Azure Policy | Org Policies | Compartment Policies |
> | **IAM Monitoring** | CloudTrail + Access Analyzer | Entra Sign-in Logs | Audit Logs + IAM Recommender | Audit Logs |
> | **Network Security** | SGs + NACLs + VPC Flow Logs | NSGs + Azure Firewall | Firewall Rules + VPC Flow Logs | NSGs + Security Lists |
> | **CSPM** | Security Hub + Config | Defender for Cloud | SCC (Security Command Center) | Cloud Guard |
> | **Container** | EKS + ECR Scanning | AKS + ACR Scanning | GKE + Artifact Analysis | OKE |
>
> **Wiz unifies all of this.** One platform, one dashboard, one set of policies across all clouds. A policy like 'no public object storage' applies to AWS S3, Azure Blob, GCP Cloud Storage, and OCI Object Storage simultaneously.
>
> The key skill is understanding cloud-specific nuances while maintaining a unified governance framework."

📖 **Multi-cloud references:** [Azure/GCP Gap Notes](../WellsFargo_Prep/WF_Gap_Notes_Part3_Azure_GCP_Wiz.md) | [Multi-Cloud Controls Matrix](../General_Interview/Ultimate_Interview_Prep_Part1.md) (Section 2.4)

---

# SECTION 7: AUTOMATION, STANDARDS & SECURITY OPERATIONS

---

### Q16. "How would you develop cloud security standards and runbooks that engineering teams can actually use?"

**Answer:**

> "The key word is **'actually use'** — most security runbooks fail because they're written by security people for security people. For DAZN:
>
> **Standard Format — Each Runbook Contains:**
> 1. **What:** One-paragraph explanation of the misconfiguration and its risk (business impact, not just technical)
> 2. **Why it matters at DAZN:** 'This could allow an attacker to access our streaming content delivery keys'
> 3. **How to fix — Console:** Step-by-step with screenshots
> 4. **How to fix — Terraform:** Copy-paste HCL code block
> 5. **How to fix — CLI:** Exact AWS CLI command
> 6. **How to verify:** Command to confirm the fix worked
> 7. **How to prevent:** What CI/CD policy prevents recurrence
>
> **Top 10 Runbooks I'd Create First (Based on Most Common Wiz Findings):**
> 1. S3 bucket public access remediation
> 2. Security Group open port remediation
> 3. IAM role least-privilege scoping
> 4. EKS pod security hardening (SecurityContext)
> 5. KMS encryption enablement
> 6. CloudTrail / logging enablement
> 7. IRSA setup for EKS pods (replacing instance profiles)
> 8. NetworkPolicy default-deny deployment
> 9. Secrets management (Secrets Manager instead of env vars)
> 10. IMDSv2 enforcement
>
> **Distribution:** Confluence/Notion wiki, linked directly from Jira tickets. When Wiz auto-creates a ticket, the remediation field links to the specific runbook."

---

### Q17. "Where would you identify opportunities to automate cloud security processes?"

**Answer:**

> "I look for the **high-frequency, low-complexity patterns** — things that happen repeatedly and have deterministic fixes:
>
> | Automation | Trigger | Action | Effort |
> |-----------|---------|--------|--------|
> | **Auto-block public S3** | CloudTrail: PutBucketAcl/PutBucketPolicy | Lambda re-enables Block Public Access + SNS alert | Low |
> | **Auto-revoke open SGs** | CloudTrail: AuthorizeSecurityGroupIngress with 0.0.0.0/0 | Lambda revokes rule + creates Jira ticket | Low |
> | **Sensor coverage check** | Daily CloudWatch Events schedule | Lambda compares EC2 list vs Wiz-reported hosts → alert on gaps | Medium |
> | **SLA escalation engine** | Every 6 hours via EventBridge | Lambda checks finding age vs SLA → auto-escalate overdue items | Medium |
> | **IaC scanning gate** | Git push / PR | Wiz IaC scanner runs in CI/CD pipeline → fail on Critical | Low |
> | **Compliance report** | Weekly schedule | Lambda queries Wiz API → generates compliance dashboard → emails leadership | Medium |
> | **IAM key rotation** | AWS Config rule: access-keys-rotated | Config auto-remediation: notify + disable stale keys after 90 days | Low |
>
> **The automation philosophy:** Start with guardrails that prevent the worst outcomes automatically (public S3, open SSH), then expand to operational efficiency (SLA tracking, reporting). Never automate complex remediation that could break production without human approval."

📖 **Full automation scripts:** [Cloud Security Automation Scripts](../../Cloud_Security_Guides/Cloud_Security_Automation_Scripts.md) — 10 ready-to-deploy Python scripts

---

### Q18. "As the subject matter expert for cloud security within Security Operations, how would you collaborate with the SOC?"

**Answer:**

> "This is where my background gives me a unique advantage — I've *been* the SOC analyst. I've done the triage, the log correlation, the IOC hunting. So I know exactly what SOC analysts need from a cloud security SME.
>
> **Integration:**
> - Wiz findings → SIEM (Splunk/Sentinel) via webhook/API for correlation
> - Critical Wiz attack paths → PagerDuty for immediate SOC triage
> - Custom SIEM correlation rules: Wiz alert 'public-facing asset with Critical CVE' + GuardDuty alert 'anomalous API call' on same asset → P1 incident
> - I currently do this kind of multi-source correlation daily with SecureWorks Taegis XDR + CrowdStrike Falcon — the workflow is identical, the data sources change
>
> **SME Support (informed by my SOC experience):**
> - Create cloud-specific investigation runbooks for SOC analysts: 'How to investigate an IAM credential compromise in AWS' — written by someone who *does* investigations, not just cloud engineering
> - Train SOC on cloud-specific attack patterns: SCARLETEEL, container escape, credential theft via SSRF/IMDS — I map these to **MITRE ATT&CK** because that's the language SOC analysts speak
> - Participate in **IOC-based threat hunting**: I already hunt for malicious hashes, IPs, domains, and breach indicators — extending this to cloud-native indicators (unusual API calls, lateral movement in K8s) is natural
> - Post-incident: translate cloud attack findings into MITRE ATT&CK mappings for SOC enrichment — I do this today with CrowdStrike Falcon detections
>
> **Operational cadence:**
> - Daily: Triage high-severity Wiz findings, correlate with SOC alerts
> - Weekly: Cloud security posture review with SOC leads
> - Monthly: Threat landscape update — new cloud attack techniques, tool updates
> - Quarterly: Purple team exercises — validate detection coverage against cloud attack scenarios
>
> **My differentiator:** Most cloud security engineers don't know what it's like to be in the SOC queue at 2 AM. I do. That makes my runbooks better, my alerts more actionable, and my collaboration more effective."

---

# SECTION 8: BEHAVIORAL & CLOSING

---

### Q19. "Tell me about a time you drove remediation with an engineering/operations team that was resistant."

**Answer:**

> "In my current role, I identified a pattern where multiple EC2 instances across several AWS accounts had overly permissive security groups — port 22 open to 0.0.0.0/0 — and flagged as non-compliant against CIS AWS Foundations benchmarks. The DevOps team initially pushed back, saying they needed SSH access for troubleshooting.
>
> Instead of just escalating the ticket, I:
>
> 1. **Showed them the actual risk** — I correlated the open SG with CrowdStrike Falcon alerts showing brute-force SSH attempts against those exact instances. This wasn't theoretical — we had evidence of active scanning.
> 2. **Proposed an alternative** — SSM Session Manager for shell access, which doesn't require any inbound ports and provides full audit logging via CloudTrail.
> 3. **Provided the exact configuration change** — the Security Group rule to remove, the SSM IAM policy to add, and the SSM agent verification commands.
> 4. **Validated the fix** — confirmed the instances were still manageable via SSM, and the CIS benchmark check passed.
> 5. **Result:** The team adopted SSM across all environments, eliminated SSH-based SG rules, and the pattern became the organization standard.
>
> The key lesson: **show the attacker's evidence, not just the compliance finding.** When I showed them real brute-force attempts hitting their open ports, the resistance disappeared because the risk became tangible."
>
> *Alternative STAR for container security:*
> "When validating Falcon sensor deployment on EKS clusters, I discovered pods running as privileged containers without justified need. The team said their application required it. I investigated and found they only needed the NET_BIND_SERVICE capability — not full privileged access. I showed them how a privileged container could allow an attacker to escape to the host node, provided the exact SecurityContext fix (`drop: ALL`, `add: NET_BIND_SERVICE`), and tested it in staging. The team deployed the fix voluntarily."

---

### Q20. "What questions do you have for us?"

**Suggested Questions:**

1. "How mature is DAZN's current cloud security posture — am I inheriting an existing Wiz deployment, or deploying from scratch?"
2. "What's the engineering team structure — how many teams will I be collaborating with for remediation?"
3. "What compliance frameworks are most relevant to DAZN — GDPR, PCI, SOC2?"
4. "How does the current WAF engineering team operate — what's the collaboration model?"
5. "What's DAZN's approach to multi-cloud — is the Azure/GCP/OCI footprint growing, or is it consolidating on AWS?"

---

# 🏃 LEARNING PATH — 4-HOUR CRASH COURSE

If you have limited time, read in this order:

```
Hour 1: This guide (top to bottom) — DAZN-specific narrative
Hour 2: Wiz CSPM Interview Q&A (Q1-Q20) — Deep Wiz expertise
Hour 3: EKS & K8s Security CNAPP (Parts 1-3) — Container security
Hour 4: AWS IAM Q&A (Q1-Q10) + Network Q&A (Q11-Q15) — AWS depth

Optional:
  - Cloud Security Automation Scripts (Script 1-4) — Automation examples
  - WAF Rule Design Q46 — WAF specifics
  - Azure/GCP Gap Notes — Multi-cloud breadth
```

---

# 📊 DAZN JD → GOPIKRISHNA'S EXPERIENCE MAPPING

| DAZN JD Requirement | Your Real Experience | How to Frame It | Confidence |
|---------------------|---------------------|-----------------|------------|
| Define and build cloud security function | ✅ Built SOC-to-cloud security workflows, 30-60-90 plans | "I've built triage/remediation processes — now I want to build a full function" | ⭐⭐⭐⭐ |
| Wiz CSPM — triage, remediation, reporting | ✅ CrowdStrike Falcon CSPM/CWPP + CIS benchmarks + 28 Wiz Q&As studied | "I do CSPM today with CrowdStrike; Wiz is the same discipline with a superior Security Graph" | ⭐⭐⭐⭐ |
| Cloud vulnerability management (AWS primary) | ✅ AWS S3/IAM/SG misconfiguration ID, CIS AWS Foundations | "I identify and remediate AWS misconfigs daily against CIS benchmarks" | ⭐⭐⭐⭐⭐ |
| Multi-cloud (Azure, GCP, OCI) | ✅ Knowledge of Azure/GCP security, 🟡 OCI light | "My multi-cloud knowledge is strong; Wiz normalizes the differences" | ⭐⭐⭐⭐ |
| Assess findings, cut through noise/FPs | ✅ 3+ years SOC triage, TP/FP validation, IOC hunting | "3+ years separating signal from noise — IOC validation, multi-source correlation" | ⭐⭐⭐⭐⭐ |
| Trace misconfigs to IaC (Terraform/CFN) | ✅ Deep cloud config knowledge, IaC scanning concepts | "I know what configs should look like; tracing to Terraform is the natural next step" | ⭐⭐⭐⭐ |
| WAF operations | ✅ Cisco networking foundation + network threat analysis | "Cisco networking background + current network threat analysis = strong WAF context" | ⭐⭐⭐⭐ |
| Cloud security standards/runbooks | ✅ Runbook methodology from SOC operations | "I create investigation runbooks today; cloud security runbooks are the same discipline" | ⭐⭐⭐⭐ |
| Automation opportunities | ✅ Sensor coverage validation, workflow automation | "I automate repetitive tasks — sensor coverage checks, alert enrichment, reporting" | ⭐⭐⭐⭐ |
| Container security (EKS/K8s) | ✅ Falcon sensor validation on EKS, runtime monitoring on EC2 + containers | "I validate Falcon on EKS and investigate container runtime detections daily" | ⭐⭐⭐⭐⭐ |
| SME for cloud security in SecOps | ✅ **THIS IS YOUR DIFFERENTIATOR** — 3+ years in SOC, SIEM/XDR, MITRE ATT&CK | "I've *been* the SOC analyst — I know what actionable looks like from the receiving end" | ⭐⭐⭐⭐⭐ |

---

> **Prepared for DAZN Cloud Security Engineer Interview — April 2026**
> **Total Q&As in this guide:** 20 (covering all JD requirements)
> **Total Q&As available across all files:** 200+
