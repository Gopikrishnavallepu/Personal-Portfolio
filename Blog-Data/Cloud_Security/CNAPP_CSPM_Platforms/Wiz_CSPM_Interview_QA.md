# Wiz Cloud Security — Interview Questions & Answers

**Comprehensive CSPM / CNAPP Interview Preparation**
Prepared: March 2026

---

# SECTION 1: WIZ PLATFORM FUNDAMENTALS

---

### Q1. What is Wiz and how does it differentiate itself in the CNAPP market?

**Answer:**
Wiz is an agentless Cloud-Native Application Protection Platform (CNAPP) that provides full-stack cloud security visibility across IaaS, PaaS, containers, serverless, and data stores — all without deploying any agents into the customer environment.

What sets Wiz apart is its **Security Graph** — a contextual risk engine that connects and correlates findings across misconfigurations (CSPM), vulnerabilities (CWPP), excessive identities (CIEM), exposed sensitive data (DSPM), and network exposure into a single interconnected graph. Instead of generating thousands of siloed alerts, Wiz identifies **"toxic combinations"** — scenarios where multiple low-to-medium severity issues chain together to create genuine, exploitable attack paths.

**Key differentiators:**
- **100% Agentless:** Uses cloud provider APIs (AWS, Azure, GCP, OCI, Alibaba) for read-only snapshot analysis — zero performance impact on workloads
- **Time-to-Value:** Can onboard an entire AWS Organization in minutes via a single CloudFormation StackSet, compared to weeks for agent-based solutions
- **Contextual Prioritization:** A Critical CVE on an internet-facing VM with admin IAM permissions and access to PII data is flagged differently than the same CVE on an internal dev box with no data access
- **Unified Platform:** Single console covering CSPM, CWPP, CIEM, DSPM, IaC scanning, Container/K8s security, and AI-SPM
- **Google Acquisition (2026):** Now integrated with Google Security Operations and Mandiant threat intelligence for enhanced detection and response

---

### Q2. Explain Wiz's agentless architecture. How does it scan workloads without agents?

**Answer:**
Wiz's agentless approach works by connecting to the cloud provider's control plane APIs and taking a multi-layered approach:

**1. Cloud API Enumeration:**
Wiz connects via cloud-native APIs (e.g., AWS APIs for EC2, IAM, S3, EKS, Lambda, etc.) using a read-only cross-account role. This provides the full asset inventory — every resource, its configuration, IAM bindings, network exposure, and relationships.

**2. Disk Snapshot Analysis (Workload Scanning):**
For vulnerability and malware scanning, Wiz takes point-in-time snapshots of the virtual disks (EBS volumes in AWS, Managed Disks in Azure) attached to running instances. These snapshots are:
- Created in the customer's account
- Mounted in an isolated Wiz-managed environment (or customer-managed connector account)
- Analyzed for: OS packages, application libraries, container images, secrets, malware, and sensitive data
- Deleted after scanning

This approach provides deep workload visibility (equivalent to what an agent sees on a filesystem) without running any code on production machines.

**3. Container Registry Scanning:**
Wiz connects directly to container registries (ECR, ACR, GCR, Harbor, JFrog) to scan every image for vulnerabilities and misconfigurations before they are deployed.

**4. Kubernetes API Analysis:**
Wiz connects to the Kubernetes API server (EKS, AKS, GKE) to enumerate all workloads, RBAC configurations, network policies, and pod security settings.

**Trade-offs vs. Agent-Based:**
- **Pros:** No deployment overhead, no kernel compatibility issues, no performance impact, instant org-wide coverage
- **Cons:** No real-time runtime detection (process execution, syscall monitoring) — Wiz addresses this with **Wiz Defend**, which uses lightweight eBPF-based sensors for runtime CDR (Cloud Detection & Response)

---

### Q3. What is the Wiz Security Graph? Why is it important?

**Answer:**
The Wiz Security Graph is the core data model that distinguishes Wiz from traditional CSPM tools. It is a massive interconnected graph that maps **relationships** between every entity in your cloud environment.

**How it works:**
- Every cloud resource (VM, container, database, S3 bucket, IAM role, security group, VPC, etc.) becomes a **node** in the graph
- Every relationship (e.g., "VM → uses → IAM Role", "IAM Role → can access → S3 Bucket", "S3 Bucket → contains → PII data", "VM → exposed to → Internet") becomes an **edge**
- The graph engine traverses these edges to compute **effective exposure paths** and **blast radius**

**Why it matters — The Toxic Combination Example:**
Consider these 4 individual findings, each appearing as LOW or MEDIUM severity in a traditional CSPM:
1. An EC2 instance has a Critical CVE (MEDIUM — it's internal)
2. The same instance has a security group allowing port 443 from 0.0.0.0/0 (MEDIUM — many web servers do this)
3. The instance's IAM role has s3:* permissions (MEDIUM — overly broad but internal)
4. An S3 bucket accessible by that role contains PII classified by DSPM (LOW — it's IAM-protected)

Independently, none of these is urgent. But the Security Graph connects them into an **attack path**: Internet → Exploit CVE on public instance → Assume IAM role → Access PII in S3. This "toxic combination" is now a **CRITICAL** finding that demands immediate attention.

**Interview Talking Point:**
"The Security Graph turns cloud security from a whack-a-mole of individual alerts into a strategic exercise of eliminating the paths that actually lead to business-impacting breaches. When I prioritize remediation, I focus on breaking the highest-value attack paths rather than fixing every individual misconfiguration."

---

### Q4. Explain the concept of "Toxic Combinations" in Wiz. Give an example.

**Answer:**
Toxic combinations are scenarios where multiple individually low-severity security issues combine to form a high-risk, exploitable attack path. This is the fundamental insight behind Wiz's risk prioritization model.

**Example Scenario — "The Intern's S3 Backdoor":**

| Finding | Individual Severity |
|---|---|
| Lambda function has a code injection vulnerability (outdated dependency) | Medium |
| Lambda execution role has `s3:*` on all buckets | Medium |
| Lambda is invoked via a public API Gateway endpoint (no WAF, no auth) | Medium |
| An S3 bucket accessible by the Lambda role has Macie-classified PII data (50k customer records) | Low (IAM-protected) |
| The same S3 bucket has versioning disabled | Low |

**Toxic Combination (Attack Path):**
Public API Gateway → Exploit code injection in Lambda → Assume Lambda's overly-permissive IAM role → Exfiltrate 50k PII records from S3 → No versioning means attacker can also delete data to cover tracks

**Wiz presents this as:** A single CRITICAL attack path with all 5 nodes visualized in the Security Graph, along with a clear remediation priority:
1. **Break the path immediately:** Restrict Lambda IAM role to specific bucket ARNs (kills the path)
2. **Harden the entry point:** Add WAF + auth to API Gateway
3. **Fix the vulnerability:** Update the Lambda dependency
4. **Defense in depth:** Enable S3 versioning and Object Lock

**Why this matters in interviews:**
"When an auditor or CISO asks 'What are our top 5 risks?', I can point to 5 specific attack paths with business context — not a spreadsheet of 3,000 misconfiguration alerts."

---

### Q5. What are the core modules/capabilities of the Wiz platform?

**Answer:**

| Module | What It Does | Key Use Case |
|---|---|---|
| **CSPM** (Cloud Security Posture Management) | Continuously evaluates cloud infrastructure configuration against security benchmarks and best practices | Detect public S3 buckets, unrestricted security groups, missing encryption, IAM misconfigurations |
| **CWPP** (Cloud Workload Protection) | Agentless vulnerability scanning of VMs, containers, and serverless functions | Find Critical CVEs in running workloads without deploying agents |
| **CIEM** (Cloud Infrastructure Entitlement Management) | Analyzes effective IAM permissions, detects overly-permissive identities, unused privileges | Identify an IAM role that can assume 47 other roles but only uses 3 |
| **DSPM** (Data Security Posture Management) | Discovers and classifies sensitive data across data stores (S3, RDS, Snowflake, etc.) | Find PII/PHI/PCI data in unencrypted S3 buckets or publicly accessible databases |
| **Container & Kubernetes Security** | Scans K8s clusters, registries, and running containers for misconfigs and vulnerabilities | Detect privileged containers, overly-broad RBAC, unscanned images |
| **IaC Scanning** | Scans Terraform, CloudFormation, Helm, etc. in CI/CD pipelines before deployment | Prevent misconfigurations from reaching production — shift-left |
| **AI-SPM** (AI Security Posture Management) | Discovers AI pipelines, models, training data and assesses AI-specific risks | Find Shadow AI, misconfigured SageMaker endpoints, exposed model artifacts |
| **Wiz Defend (CDR)** | Runtime cloud detection & response using lightweight eBPF sensors + cloud signal correlation | Detect active exploitation, container escapes, and lateral movement in real-time |

---

### Q6. How does Wiz handle compliance monitoring? Name frameworks it supports.

**Answer:**
Wiz provides continuous compliance monitoring by mapping its security policies to regulatory and industry frameworks. Unlike point-in-time audit tools, Wiz provides a **live compliance posture** that updates as cloud configurations change.

**How it works:**
1. **Policy Mapping:** Each Wiz security rule is mapped to one or more compliance framework controls (e.g., a rule checking for S3 public access maps to CIS AWS 2.1.1, PCI DSS 1.3.6, NIST AC-3, etc.)
2. **Continuous Assessment:** Every cloud configuration change is evaluated against mapped policies in near-real-time
3. **Compliance Dashboard:** A unified view showing pass/fail status per framework, per account, per business unit
4. **Export & Reporting:** One-click compliance reports suitable for external auditors, with evidence of control effectiveness
5. **Custom Frameworks:** Organizations can define custom compliance frameworks mapping internal policies to Wiz rules

**Supported Frameworks:**
- CIS Benchmarks (AWS, Azure, GCP, Kubernetes, Docker)
- NIST SP 800-53 (Rev 4 & 5)
- NIST CSF
- PCI DSS v4.0
- SOC 2 Type II
- HIPAA / HITECH
- GDPR
- ISO 27001 / 27017 / 27018
- FedRAMP
- MITRE ATT&CK Cloud Matrix
- CSA CCM (Cloud Controls Matrix)
- AWS Well-Architected Framework (Security Pillar)
- Custom organizational frameworks

**Interview Talking Point:**
"When I need to prepare for a SOC 2 audit, I pull the Wiz compliance report for the SOC 2 framework, identify the failing controls, and work with engineering teams to remediate them before the auditor arrives. The evidence is already captured — control status, when it passed/failed, and what changed."

---

# SECTION 2: WIZ CSPM DEEP DIVE

---

### Q7. How does Wiz CSPM differ from traditional CSPM tools like AWS Config or Security Hub?

**Answer:**

| Capability | AWS Config / Security Hub | Wiz CSPM |
|---|---|---|
| **Scope** | Single AWS account (or Organization with aggregation) | Multi-cloud: AWS, Azure, GCP, OCI, Alibaba — unified view |
| **Finding Context** | Isolated — "SG allows 0.0.0.0/0" without context on what's behind the SG | Contextual — "SG allows 0.0.0.0/0 on a VM with Critical CVE, admin IAM role, and PII data access" |
| **Risk Prioritization** | Severity is static based on rule definition | Severity is dynamic based on graph analysis — same misconfiguration gets different severity depending on exposure context |
| **Attack Path Visualization** | No attack path analysis | Full attack path from internet to crown jewels visualized in the Security Graph |
| **Cross-Resource Correlation** | Limited — each Config rule evaluates one resource type | Full cross-resource correlation: VM → IAM → S3 → Data Classification in a single query |
| **Compliance** | Maps rules to frameworks but generating reports requires custom work | One-click compliance reports with evidence for 30+ frameworks |
| **Remediation Guidance** | Basic — "remediate this SG" | Rich — "this SG is the entry point to an attack path; here are the 3 ways to break the path, prioritized by impact and effort" |
| **Identity Context** | IAM Access Analyzer provides some policy analysis | Full effective permissions computation including transitive role assumptions and unused privilege identification |

**When you'd still use AWS-native tools:**
- AWS Config is excellent for **preventive guardrails** (e.g., auto-remediation via Config Rules + SSM Automation)
- Security Hub is great as a **central aggregation point** within AWS for native findings (GuardDuty, Inspector, Macie)
- Wiz complements these by providing the **cross-cloud, cross-resource, contextual risk layer** on top

---

### Q8. Walk me through how Wiz onboards a new AWS environment.

**Answer:**

**Step 1: Connector Setup (5-10 minutes per Organization)**
- Deploy a CloudFormation StackSet or Terraform module that creates a read-only IAM role in every account in the Organization
- The role has a trust policy allowing Wiz's external AWS account to assume it
- Permissions are read-only (SecurityAudit-level) plus snapshot permissions for workload scanning
- External ID is used in the trust policy for security

**Step 2: Initial Scan (hours, not days)**
- Wiz connects via the cross-account role and begins enumerating all resources via AWS APIs
- Asset inventory is populated: EC2, S3, IAM, VPC, RDS, Lambda, EKS, ECS, etc.
- Cloud configurations are evaluated against CSPM policies
- Disk snapshots are initiated for vulnerability scanning

**Step 3: Security Graph Population**
- As data flows in, the Security Graph builds relationships between entities
- Attack paths are computed
- Toxic combinations are identified

**Step 4: Compliance Mapping**
- Enable the relevant compliance frameworks for the organization
- Review initial compliance posture

**Step 5: Integration & Operationalization**
- Configure alert routing (Slack, Jira, ServiceNow, PagerDuty, SIEM)
- Set up remediation workflows
- Define SLA enforcement rules
- Assign ownership via tagging or business unit mapping
- Integrate with CI/CD for IaC scanning

**Key talking point:**
"I've onboarded entire AWS Organizations with 100+ accounts in under a day. The agentless model eliminates the months-long rollout you'd have with agent-based solutions, and the Security Graph immediately surfaces the highest-priority risks."

---

### Q9. How does Wiz identify and prioritize misconfigurations?

**Answer:**
Wiz uses a layered prioritization model that goes far beyond simple severity ratings:

**Layer 1: Configuration Assessment**
Wiz evaluates every resource against its configuration policies (equivalent to CIS benchmarks + Wiz's own research-driven rules). This produces raw findings like:
- S3 bucket has public ACL
- Security group allows SSH from 0.0.0.0/0
- RDS instance is not encrypted at rest
- IAM user has access keys older than 90 days

**Layer 2: Contextual Enrichment**
Each finding is enriched with context from the Security Graph:
- **Network Exposure:** Is this resource internet-facing? Behind a load balancer? In a private subnet?
- **Identity Context:** What IAM permissions does the associated role have? What can it access?
- **Data Sensitivity:** Does the resource contain or access sensitive data (from DSPM)?
- **Vulnerability Context:** Does the workload have known exploitable vulnerabilities?
- **Business Context:** Is this a production environment? What business unit owns it?

**Layer 3: Attack Path Analysis**
Findings that form part of an exploitable attack path are elevated. A public S3 bucket containing test data stays MEDIUM. A public S3 bucket accessible via an overly-permissive IAM role on an internet-facing, vulnerable VM becomes CRITICAL.

**Layer 4: Effective Severity Scoring**
The final severity considers:
- Base finding severity
- Attack path severity (CRITICAL if part of an active path to sensitive data)
- Business criticality (production vs development)
- Exploitability (is there a known exploit in the wild?)

---

### Q10. What is Wiz's approach to CIEM (Cloud Infrastructure Entitlement Management)?

**Answer:**
Wiz CIEM goes beyond simply listing IAM policies — it computes **effective permissions** by analyzing the full identity chain:

**What Wiz CIEM analyzes:**
1. **Effective Permissions:** Resolves the actual permissions an identity has after evaluating:
   - Attached managed policies
   - Inline policies
   - Group memberships
   - Permission boundaries
   - Service control policies (SCPs)
   - Resource-based policies
   - Session policies

2. **Transitive Access:** Maps multi-hop role assumption chains (Account A → Role B → Role C) to compute what an attacker could actually reach if they compromised a single identity

3. **Unused Privileges:** Analyzes CloudTrail to identify permissions that are granted but never used (e.g., a role has s3:* but only ever calls s3:GetObject on one bucket)

4. **Cross-Cloud Identities:** Tracks federated identities across AWS, Azure, and GCP to show the full blast radius

5. **Risk Indicators:**
   - Admin-equivalent permissions (any identity with iam:*, sts:*, or ability to escalate to admin)
   - Third-party cross-account access without ExternalID
   - Service accounts with console access enabled
   - Access keys older than 90 days

**How it integrates with CSPM:**
CIEM findings feed directly into the Security Graph. An overly-permissive IAM role alone is a MEDIUM CIEM finding. When connected to an internet-facing VM with a Critical CVE that accesses PII data in S3 — it becomes a CRITICAL attack path.

---

### Q11. Explain Wiz DSPM (Data Security Posture Management) and its importance.

**Answer:**
Wiz DSPM automatically discovers, classifies, and monitors sensitive data across cloud data stores:

**Discovery:**
- Scans S3 buckets, RDS databases, Azure Blob Storage, BigQuery datasets, Snowflake warehouses, etc.
- Uses agentless sampling — reads a statistically significant sample of data to classify without full data extraction

**Classification:**
- Identifies data types: PII (names, SSNs, emails), PHI (medical records), PCI (credit card numbers), financial data, credentials/secrets
- Uses pattern matching, ML-based classification, and pre-built data classifiers
- Results are tagged to the data store node in the Security Graph

**Why DSPM is critical for CSPM:**
Without DSPM, CSPM can tell you that an S3 bucket is public — but it can't tell you whether that matters. DSPM tells you "This public S3 bucket contains 250,000 customer credit card numbers." This transforms the CSPM finding from a compliance checkbox into an active data breach risk.

**Interview Talking Point:**
"DSPM is what turns a CSPM tool from a misconfiguration scanner into a business risk assessment tool. When the CISO asks 'What's our risk?', they don't want to hear 'We have 3,000 findings.' They want to hear 'We have 3 paths to our customer PII data, and here's how we close them.'"

---

# SECTION 3: WIZ OPERATIONS & ADMINISTRATION

---

### Q12. How do you manage alert fatigue in Wiz?

**Answer:**
Wiz's architecture inherently reduces alert fatigue through contextual prioritization, but operational governance is still essential:

**1. Leverage the Security Graph (Built-in Noise Reduction):**
- Wiz's attack path analysis naturally reduces noise by surfacing only the combinations that represent real risk
- Instead of 10,000 individual findings, you may have 50 attack paths — each a clear, actionable risk

**2. Alert Routing by Severity & Ownership:**
- **Critical Attack Paths:** → PagerDuty/Slack (immediate triage, 24h SLA)
- **High Findings:** → Jira ticket auto-created, assigned to owning team (48h SLA)
- **Medium Findings:** → Weekly governance report for team leads
- **Low Findings:** → Informational, reviewed monthly

**3. Automation Rules:**
- Auto-assign findings based on cloud tags (e.g., tag:team=payments → Jira project PAYMENTS)
- Auto-close findings when underlying resource is terminated
- Auto-suppress known-accepted risks with documented justification and expiry date

**4. Exception Management:**
- Approved exceptions with business justification, risk owner sign-off, and quarterly review
- Never permanent suppression — all exceptions expire and must be re-reviewed

**5. Governance Dashboards:**
- Track: Finding age, SLA compliance, team remediation velocity, top unremediated attack paths
- Report to CISO: "We have X Critical attack paths, Y are within SLA, Z need escalation"

---

### Q13. How would you integrate Wiz into a CI/CD pipeline for shift-left security?

**Answer:**

**Pre-Commit / IDE:**
- Wiz CLI scans IaC templates (Terraform, CloudFormation, Helm charts) locally before push
- Developer gets immediate feedback on misconfigurations

**CI Pipeline (Build Time):**
- Wiz IaC scanner runs as a pipeline step (GitHub Actions, GitLab CI, Jenkins)
- Scans Terraform plans, CloudFormation templates, Dockerfiles, Kubernetes manifests
- Pipeline fails on CRITICAL or HIGH severity misconfigurations
- Developer sees exactly which line in their Terraform has the issue

**Container Image Scanning:**
- After `docker build`, Wiz scans the image for vulnerabilities, malware, and misconfigurations
- Images with Critical CVEs are blocked from being pushed to the registry
- Image scan results are visible in Wiz alongside the running workload

**Post-Deploy (Runtime):**
- Wiz continuously monitors the deployed resources
- If drift occurs (someone manually changes a config that was correct in IaC), Wiz detects it and links back to the IaC commit

**Policy-as-Code:**
- Wiz policies can be defined in code and version-controlled
- Security team reviews and approves policy changes via PR process
- Same policies apply to both IaC scanning and runtime monitoring

**Example Pipeline Integration (GitHub Actions):**
```yaml
- name: Wiz IaC Scan
  uses: wiz-sec/iac-scan-action@v1
  with:
    wiz-client-id: ${{ secrets.WIZ_CLIENT_ID }}
    wiz-client-secret: ${{ secrets.WIZ_CLIENT_SECRET }}
    policy: "Default IaC Policy"
    fail-on-severity: "HIGH"
    path: "./terraform"
```

---

### Q14. Describe the Wiz Defend (CDR) capability and how it complements CSPM.

**Answer:**
Wiz Defend is the Cloud Detection & Response (CDR) layer that adds **runtime signal analysis** to Wiz's primarily posture-focused platform:

**Architecture:**
- Uses lightweight, optional eBPF-based sensors on cloud workloads
- Also correlates cloud control-plane signals (CloudTrail, Azure Activity Logs, GCP Audit Logs) without agents
- Integrates identity signals (unusual role assumptions, credential usage patterns)

**How it complements CSPM:**

| CSPM (Posture) | CDR / Wiz Defend (Runtime) |
|---|---|
| "This VM has a Critical CVE and is internet-facing" | "This VM is actively being exploited via that CVE right now" |
| "This IAM role is overly permissive" | "This IAM role's credentials are being used from an external IP" |
| "This S3 bucket is public" | "Someone is bulk-downloading data from this S3 bucket" |

**The CSPM + CDR Loop:**
1. CSPM identifies a risk **before** exploitation (proactive)
2. CDR detects the exploitation **in real-time** (reactive)
3. CSPM finding severity is elevated when CDR detects active exploitation of the same attack path
4. Automated response: CDR triggers containment (isolate instance, revoke credentials) while CSPM provides the remediation path to fix the root cause

---

### Q15. How does Wiz handle multi-cloud environments?

**Answer:**
Wiz's architecture is fundamentally multi-cloud — the Security Graph normalizes cloud resources across providers into a unified data model:

**Normalization Examples:**
- AWS EC2 Instance, Azure VM, GCP Compute Instance → all represented as "Virtual Machine" nodes
- AWS IAM Role, Azure Managed Identity, GCP Service Account → "Cloud Identity" nodes
- AWS S3, Azure Blob Storage, GCP Cloud Storage → "Object Storage" nodes
- AWS EKS, Azure AKS, GCP GKE → "Kubernetes Cluster" nodes

**Cross-Cloud Attack Paths:**
Wiz can identify attack paths that span clouds:
- A compromised AWS Lambda → assumes an IAM role → accesses a federated identity that has permissions in Azure Active Directory → accesses Azure Key Vault secrets

**Unified Policies:**
A single Wiz policy like "No public object storage buckets" automatically applies across AWS S3, Azure Blob, and GCP Cloud Storage — no need to write separate rules per cloud.

**Single Pane of Glass:**
One dashboard shows compliance posture, attack paths, and findings across all clouds — essential for organizations running hybrid or poly-cloud architectures.

---

# SECTION 4: SCENARIO-BASED QUESTIONS

---

### Q16. Scenario: You discover that a production EC2 instance appears in 3 different Critical attack paths in Wiz. How do you respond?

**Answer:**
**Immediate Assessment (First 30 minutes):**
1. Open the Wiz Security Graph and visualize all 3 attack paths to understand entry points, pivot points, and targets
2. Identify the common links — the EC2 instance is the hub. What makes it appear in 3 paths?
   - Is it internet-facing? (Network exposure)
   - Does it have an overly-permissive IAM role? (Identity risk)
   - Does it have Critical CVEs? (Vulnerability)
   - Does it access sensitive data? (Data exposure)

**Classification (30-60 minutes):**
3. Check Wiz Defend / CDR signals — is there any evidence of active exploitation? If yes, this is now an incident — trigger IR playbook
4. If no active exploitation, this is a Critical risk that needs immediate remediation

**Remediation Plan (Priority Order):**
5. **Break the paths:** Identify the single action that eliminates the most attack paths simultaneously:
   - Example: Restricting the IAM role from `s3:*` to specific bucket ARNs might break 2 of the 3 paths
6. **Harden the entry point:** If the instance is internet-facing, evaluate whether it needs to be or if it can be moved behind a load balancer / WAF
7. **Patch vulnerabilities:** Schedule patching for the Critical CVEs using the organization's emergency change process
8. **Verify:** After each remediation step, confirm in Wiz that the attack paths are resolved

**Communication:**
9. Brief the security team and instance owner on the risk and remediation timeline
10. Document the response for governance tracking

---

### Q17. Scenario: Your CISO asks you to prepare a compliance report for an upcoming PCI DSS audit using Wiz. Walk me through your process.

**Answer:**

**Phase 1: Framework Activation & Baseline (Week 1)**
1. Enable the PCI DSS v4.0 compliance framework in Wiz
2. Review the initial compliance dashboard — note the overall pass/fail percentage
3. Map Wiz's compliance findings to the specific PCI DSS requirements that are in scope (e.g., Requirement 1: Network Security Controls, Requirement 6: Secure Software Development, etc.)

**Phase 2: Gap Analysis (Week 1-2)**
4. Export the failing controls and categorize them:
   - **Quick Wins:** Can be remediated in < 1 day (e.g., enable encryption on an RDS instance)
   - **Engineering Work:** Requires code/architecture changes (e.g., network segmentation)
   - **Accepted Risks:** Business-justified exceptions with compensating controls documented
5. Create Jira tickets for each remediation item, auto-assigned via Wiz integration

**Phase 3: Remediation Sprint (Week 2-4)**
6. Work with engineering teams to remediate findings, prioritized by PCI requirement criticality
7. Track progress in Wiz's compliance dashboard — show improvement trends

**Phase 4: Audit Preparation (Week 4)**
8. Generate the Wiz PCI DSS compliance report — one-click export showing:
   - Control-by-control pass/fail status
   - Evidence of when controls were remediated
   - Remaining accepted risks with documented justification
9. Prepare a walkthrough for the auditor showing how Wiz continuously monitors PCI-related configurations

**Phase 5: Ongoing**
10. Set up automated alerts for any regression — if a PCI control starts failing again after remediation, the owning team is immediately notified

---

### Q18. Scenario: Wiz identifies an attack path where an internet-facing EKS pod with a Critical CVE can access an RDS database containing PII via an overly-permissive IRSA role. How do you remediate?

**Answer:**

**Attack Path Breakdown:**
```
Internet → EKS Pod (Critical CVE, public ingress) → IRSA Role (rds:*, s3:*) → RDS (PII data)
```

**Remediation Strategy — Break Each Link:**

**1. Identity (Most Impactful — Do First):**
- Restrict the IRSA role from `rds:*` to only the specific RDS cluster ARN the application needs
- Remove `s3:*` entirely if the pod doesn't need S3 access
- Add `aws:SourceVpc` condition to the IRSA trust policy to prevent external JWT abuse
- Review all IRSA roles in the cluster for similar over-permissiveness

**2. Vulnerability (Patch Immediately):**
- Identify the specific CVE — check if an exploit is available in the wild
- Update the container image to a patched version
- Run through CI/CD pipeline with Wiz image scanning to confirm the fix
- Redeploy the pod

**3. Network (Defense in Depth):**
- Review if the pod genuinely needs public internet exposure
- If yes, ensure it's behind an ALB/NLB with WAF and rate limiting
- If no, move the ingress to a private ingress controller
- Apply Kubernetes NetworkPolicy to restrict the pod's egress to only the RDS endpoint

**4. Data (Compensating Controls):**
- Ensure the RDS instance has audit logging enabled (log all queries against PII tables)
- Enable RDS encryption at rest and in transit
- Review RDS security group to ensure it only accepts connections from the EKS pod subnet

**5. Verification:**
- After all changes, re-check Wiz to confirm the attack path is eliminated
- Set up an alert if any component of this path reappears

---

### Q19. Scenario: A development team pushes back on a Wiz finding, claiming it's a false positive. How do you handle this?

**Answer:**

**Step 1: Investigate Before Responding**
- Review the finding in detail — look at the underlying resource configuration, the Security Graph context, and the attack path (if any)
- Don't dismiss the team's claim, but also don't accept it at face value

**Step 2: Evidence-Based Discussion**
- Pull the raw cloud configuration data that triggered the finding
- Compare it against the Wiz rule definition — is the rule accurately matching the configuration?
- If the team is correct (the rule doesn't apply to their specific use case):
  - Document the exception with business justification
  - Apply a scoped exception in Wiz (not a global rule change)
  - Set an expiry date for review
  - Ensure the team acknowledges residual risk

**Step 3: If the Finding is Valid but Low-Risk**
- Acknowledge the team's context (e.g., "Yes, this is a dev environment, but this same pattern would be Critical in production")
- Use it as a teaching moment — show the attack path that would exist if this config was in production
- Agree on remediation timeline appropriate to the environment

**Step 4: Process Improvement**
- If you keep getting the same "false positive" pushback, it may signal:
  - The rule needs a scope refinement (exclude dev accounts from production-grade rules)
  - The team needs training on security concepts
  - The rule is genuinely too noisy and should be tuned

**Key Principle:**
"I never suppress a finding without a documented justification, a risk owner, and an expiry date. Permanent suppressions are how organizations accumulate invisible risk."

---

### Q20. How would you use Wiz to investigate a potential data breach?

**Answer:**

**Initial Triage:**
1. Open the compromised resource in Wiz's Security Graph
2. Use the graph to map the **blast radius:**
   - What identities are associated with this resource?
   - What data stores can those identities access?
   - Are there cross-account or cross-cloud paths from this resource?

**DSPM Assessment:**
3. Check DSPM classifications for all data stores in the blast radius
   - Which stores contain PII, PHI, PCI data?
   - How many records are potentially exposed?
   - When was the data last accessed and by whom?

**Attack Path Reconstruction:**
4. Use Wiz's CSPM/CIEM data to reconstruct how the attacker could have reached the compromised resource:
   - Was there an internet-facing entry point?
   - Which misconfigurations enabled the path?
   - Were there any CSPM findings that predicted this path before the breach?

**Timeline Analysis:**
5. Correlate Wiz findings with cloud audit logs:
   - CloudTrail events for API calls from the compromised identity
   - VPC Flow Logs for network-level activity
   - Wiz Defend telemetry for runtime events

**Containment Guidance:**
6. Use Wiz's identity analysis to:
   - Identify all credentials that need rotation
   - Map all resources that need access revocation
   - Confirm containment is complete by verifying no remaining attack paths

---

# SECTION 5: WIZ AI-SPM & ADVANCED TOPICS

---

### Q21. What is Wiz AI-SPM (AI Security Posture Management)?

**Answer:**
AI-SPM is Wiz's capability to discover, assess, and secure AI workloads and ML pipelines:

**Discovery:**
- Identifies AI services: AWS SageMaker, Azure Machine Learning, GCP Vertex AI, Bedrock, OpenAI endpoints
- Detects "Shadow AI" — unauthorized or unmanaged AI workloads deployed by developers

**Risk Assessment:**
- **Model Security:** Are ML models stored in accessible locations? Are model artifacts encrypted?
- **Training Data Security:** Is training data properly classified and protected? Could it contain PII that would create compliance issues?
- **Endpoint Security:** Are inference endpoints publicly accessible without authentication?
- **Pipeline Security:** Are ML pipelines (training, deployment) secured with least-privilege IAM?

**Why it matters:**
"AI is the new S3 — teams are deploying SageMaker endpoints and Bedrock models without security review, just like they did with S3 buckets in 2017. AI-SPM ensures visibility and governance before Shadow AI becomes the next major attack surface."

---

### Q22. Compare Wiz's approach to Wiz Defend (CDR) vs. traditional SIEM-based detection.

**Answer:**

| Aspect | Traditional SIEM | Wiz Defend (CDR) |
|---|---|---|
| **Data Source** | Logs ingested from cloud (CloudTrail, VPC Flow Logs, K8s audit) | Cloud API signals + optional eBPF runtime telemetry + posture context |
| **Context** | Log events are evaluated in isolation — analyst must manually correlate | Events are automatically enriched with Security Graph context (what identity, what permissions, what data, what exposure) |
| **Detection Logic** | Rules/correlations written by security team based on log patterns | Graph-aware detections that understand the full attack path context |
| **Alert Quality** | Often noisy — high false positive rate without tuning | Contextual — a detection on a resource in a Critical attack path is prioritized differently than one on an isolated internal dev box |
| **Investigation** | Analyst pivots through multiple tools (SIEM → Cloud Console → IAM → network) | Single interface: detection event → resource → attack path → identity → data — all in the Security Graph |
| **Response** | Manual containment via separate tools or SOAR playbooks | Native automated containment (isolate instance, revoke credentials) within the Wiz platform |

**Key takeaway:**
"SIEM remains essential for log aggregation, compliance, and broad detection. Wiz Defend adds cloud-native, posture-aware detection that a SIEM cannot replicate — especially for understanding the business impact of a detection and automating cloud-specific containment."

---

### Q23. How does Wiz handle Kubernetes security specifically?

**Answer:**
Wiz provides comprehensive Kubernetes security across the entire lifecycle:

**Pre-Deployment:**
- IaC scanning of Helm charts, Kubernetes manifests, and Kustomize files in CI/CD
- Image scanning in container registries (ECR, ACR, GCR, Harbor)
- Policy-as-code for admission control (integrate with OPA/Gatekeeper)

**Runtime Posture (CSPM for K8s):**
- Connects to the Kubernetes API server to audit:
  - **RBAC:** Identifies overly-permissive ClusterRoleBindings, service accounts with cluster-admin access
  - **Pod Security:** Detects privileged containers, hostPID/hostNetwork/hostIPC, missing readOnlyRootFilesystem
  - **Network Policies:** Identifies namespaces without network policies, overly-permissive policies
  - **Secrets:** Detects secrets stored as environment variables instead of mounted secret volumes
  - **Image Compliance:** Identifies running containers from unscanned or unsigned images

**EKS/AKS/GKE Specific:**
- **EKS:** Checks aws-auth ConfigMap for dangerous mappings (system:masters), IRSA configurations, EKS cluster endpoint access settings, control plane logging
- **AKS:** Checks Azure RBAC integration, pod identity configurations, network security
- **GKE:** Checks Workload Identity, Binary Authorization, GKE Autopilot security settings

**Container Vulnerability Assessment:**
- Scans running container images for OS and language-level vulnerabilities
- Correlates vulnerabilities with the pod's network exposure, identity permissions, and data access to prioritize remediation

---

### Q24. What is the difference between Wiz Issues, Findings, and Attack Paths?

**Answer:**

| Concept | Definition | Example |
|---|---|---|
| **Finding** | A single security observation about a resource (misconfiguration, vulnerability, excessive permission) | "S3 bucket `customer-data` has public ACL enabled" |
| **Issue** | A Wiz-curated combination of findings that represents a notable risk. Issues are categorized by type (Misconfiguration, Vulnerability, Network Exposure, etc.) and severity. | "Public-facing VM with Critical CVE and admin-level IAM permissions" |
| **Attack Path** | A sequence of connected issues/findings in the Security Graph that shows how an attacker could move from an initial access point to a high-value target (sensitive data, admin access) | "Internet → Public VM (CVE-2024-1234) → Admin IAM Role → S3 Bucket (PII data)" |

**How they relate:**
- Many **Findings** feed into fewer **Issues** (contextual grouping)
- Issues are connected via the Security Graph to form **Attack Paths**
- Remediation is planned at the **Attack Path** level — fix the one link that breaks the most paths

---

### Q25. You're migrating from a legacy CSPM tool to Wiz. What's your approach?

**Answer:**

**Phase 1: Parallel Run (Weeks 1-4)**
1. Deploy Wiz alongside the existing tool — do not decommission yet
2. Onboard all cloud accounts to Wiz
3. Compare findings: map legacy tool's findings to Wiz's — identify gaps in both directions
4. Validate that all compliance frameworks the organization uses are available in Wiz

**Phase 2: Policy Alignment (Weeks 2-6)**
5. Review Wiz's default policies — enable/disable based on organizational relevance
6. Migrate any custom rules from the legacy tool to Wiz (using Wiz's custom policy framework)
7. Configure alert routing, Jira/ServiceNow integration, and notification channels
8. Test automated remediation workflows

**Phase 3: Operationalization (Weeks 4-8)**
9. Train security team and cloud engineering teams on Wiz console, Security Graph, and investigation workflows
10. Establish SLA enforcement rules and governance dashboards
11. Begin using Wiz as primary CSPM while maintaining legacy as read-only backup

**Phase 4: Decommission Legacy (Weeks 8-12)**
12. Confirm 100% coverage — all accounts, all resource types, all compliance frameworks
13. Decommission legacy tool after 2-week burn-in period with no issues
14. Document the migration for audit trail

**Key risk to address:**
"The biggest risk in migration is not the technology — it's the change management. Engineers are familiar with the old tool's workflows and may resist. I plan training sessions, create runbooks for common investigative workflows in Wiz, and appoint champions in each team."

---

# SECTION 6: COMPARISON & STRATEGIC QUESTIONS

---

### Q26. How would you explain the value of Wiz to a non-technical executive?

**Answer:**
"Think of our cloud environment as a building. Traditional security tools give us thousands of individual inspection reports — this lock is weak, that window is cracked, this fire alarm battery is low. Each report is accurate, but none of them tells us: 'Can a burglar actually get from the street to the vault?'

Wiz connects all of those individual findings into a map. It shows us: 'There are exactly 5 paths from the street to the vault — and here's the cheapest way to block each one.' We focus our limited engineering time on blocking those 5 paths instead of fixing 3,000 individual inspection findings.

The result: we reduce risk faster, with fewer resources, and I can show you a dashboard that says 'This week we went from 5 critical paths to 2' — not 'We fixed 200 findings but we don't know if we're actually safer.'"

---

### Q27. Wiz vs. CrowdStrike Falcon Cloud Security — how do they differ?

**Answer:**

| Aspect | Wiz | CrowdStrike Falcon Cloud Security |
|---|---|---|
| **Architecture** | Agentless-first (optional Wiz Defend sensors) | Agent-first (Falcon sensor DaemonSet) with agentless CSPM |
| **Strength** | Contextual risk prioritization, attack path analysis, Security Graph | Real-time runtime protection, eBPF-based process/syscall monitoring |
| **CSPM** | Industry-leading with graph-based prioritization | Solid but less graph-aware; more traditional finding-level alerts |
| **CWPP** | Agentless vulnerability scanning (no runtime kill/prevent capability without Defend) | Best-in-class runtime CWPP — detect and prevent container drift, binary execution, reverse shells |
| **CIEM** | Strong effective permissions analysis, transitive access mapping | Identity correlation with runtime telemetry — "this overly-permissive role was just used suspiciously" |
| **Container Security** | Registry scanning, K8s posture assessment, admission control integration | DaemonSet-based runtime container security, drift prevention in PREVENT mode, KAC admission controller |
| **Detection & Response** | Wiz Defend (newer, evolving) | Falcon Insight — mature, battle-tested XDR platform |
| **Ideal For** | Risk prioritization, posture management, compliance, board-level reporting | Runtime threat prevention, SOC operations, active breach response |

**Complementary Approach:**
"In an ideal architecture, Wiz provides the strategic risk layer (what should we fix to reduce our attack surface?) while CrowdStrike provides the tactical runtime layer (stop the attack that's happening right now). Many organizations run both."

---

### Q28. What are common pitfalls organizations face when implementing Wiz?

**Answer:**

1. **Alert Overload Without Process:**
   - Deploying Wiz across 200 accounts without establishing triage workflows → thousands of findings with no one to act on them
   - **Fix:** Start with top 10 Critical attack paths. Establish SLA-driven remediation process before expanding scope.

2. **Shadow IT Discovery Shock:**
   - Wiz discovers resources, accounts, and data stores the security team didn't know existed
   - **Fix:** Use this as a governance improvement opportunity. Establish asset ownership tagging and enforce via SCP.

3. **Over-Relying on Agentless:**
   - Assuming agentless = complete coverage. Without runtime sensors, you cannot detect active exploitation, container drift, or process-level attacks.
   - **Fix:** Deploy Wiz Defend sensors on high-value production workloads for runtime CDR.

4. **Compliance-Only Mindset:**
   - Using Wiz solely for CIS benchmark compliance and ignoring attack path analysis
   - **Fix:** Lead with attack paths for risk reduction, use compliance for regulatory requirements. Both are important but serve different purposes.

5. **No Developer Engagement:**
   - Security team uses Wiz as their private tool without integrating with development workflows
   - **Fix:** Integrate with CI/CD, Jira, Slack. Enable developer self-service remediation. Show developers their specific attack paths.

---

END OF WIZ INTERVIEW Q&A

---
*Prepared for Cloud Security Interview Preparation — March 2026*
