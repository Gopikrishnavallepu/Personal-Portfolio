# Prisma Cloud CSPM — Interview Questions & Answers

**Comprehensive CSPM / CNAPP Interview Preparation**
Prepared: March 2026

---

# SECTION 1: PRISMA CLOUD PLATFORM FUNDAMENTALS

---

### Q1. What is Prisma Cloud and what are its core capabilities?

**Answer:**
Prisma Cloud by Palo Alto Networks is a comprehensive Cloud-Native Application Protection Platform (CNAPP) that provides full lifecycle security — from code to cloud — across multi-cloud and hybrid environments.

**Core Capabilities:**

| Module | Description |
|---|---|
| **CSPM** (Cloud Security Posture Management) | Continuous monitoring of cloud configurations against security benchmarks and compliance frameworks |
| **CWPP** (Cloud Workload Protection Platform) | Runtime protection for VMs, containers, serverless, and web applications (formerly Twistlock) |
| **CIEM** (Cloud Infrastructure Entitlement Management) | IAM security — effective permissions analysis, excessive privilege detection, identity governance |
| **DSPM** (Data Security Posture Management) | Sensitive data discovery and classification across cloud data stores |
| **Code Security** | IaC scanning (built on Checkov), SCA, secrets detection, CI/CD pipeline security |
| **Cloud Network Security** | Microsegmentation, network visualization, and network-level threat detection |
| **AI Security** | Prisma Cloud AI-SPM for discovering and securing AI workloads |
| **Prisma Cloud Copilot** | AI-powered assistant using Precision AI® for natural language queries, investigation, and remediation guidance |

**Prisma Cloud Architecture:**
- **SaaS-delivered** management console (app.prismacloud.io)
- **Agentless scanning** for CSPM and some CWPP capabilities
- **Agent-based (Defender)** for comprehensive runtime protection (CWPP)
- **API-based** cloud account onboarding via read-only service principals / cross-account roles
- **Checkov** open-source engine for IaC scanning

**Key differentiator:**
Prisma Cloud's strength lies in its **breadth of coverage** — it's one of the most comprehensive CNAPPs covering code, build, deploy, and run phases with a single platform. The Palo Alto Networks ecosystem integration (Cortex XSIAM, XSOAR, Strata firewalls) provides a unified security operations experience.

---

### Q2. Explain Prisma Cloud's CSPM architecture. How does it connect to cloud accounts?

**Answer:**
Prisma Cloud CSPM connects to cloud providers through **Cloud Account onboarding**, which involves creating a service principal (Azure), cross-account role (AWS), or service account (GCP) with read-only permissions.

**AWS Onboarding:**
1. Prisma Cloud provides a CloudFormation template
2. Template creates an IAM role with the `SecurityAudit` managed policy and Prisma Cloud-specific permissions
3. The role's trust policy allows Prisma Cloud's external AWS account to assume it with an External ID
4. Prisma Cloud assumes this role every 4-24 hours (configurable) to scan the account

**Azure Onboarding:**
1. Register Prisma Cloud as an application in Azure AD
2. Create a custom role with read-only permissions across subscriptions
3. Prisma Cloud uses the app registration credentials to query Azure APIs

**GCP Onboarding:**
1. Create a service account with Viewer role and Organization-level access
2. Enable required GCP APIs
3. Prisma Cloud uses the service account key to access GCP APIs

**Data Flow:**
```
Cloud Provider APIs → Prisma Cloud Ingestion Engine → Configuration Database → 
RQL Query Engine → Policy Evaluation → Alert Generation → Notification Channels
```

**Ingestion Frequency:**
- Default: Every 4 hours for full configuration scan
- Near real-time: For specific high-priority services using event-driven ingestion (CloudTrail integration)
- Custom: Configurable scan intervals per account group

---

### Q3. What is RQL (Resource Query Language) in Prisma Cloud? Why is it important?

**Answer:**
RQL is Prisma Cloud's proprietary query language for investigating and analyzing cloud resource configurations, network flows, and events. It is the **backbone** of all Prisma Cloud CSPM operations.

**Three Types of RQL Queries:**

**1. Config Queries:**
Query the configuration state of cloud resources.
```
config from cloud.resource where api.name = 'aws-s3api-get-bucket-acl' 
AND json.rule = acl.grants[?(@.permission=='FULL_CONTROL' && @.grantee=='AllUsers')]
```
This finds all S3 buckets with full public access.

**2. Network Queries:**
Query network flow data to understand actual traffic patterns.
```
network from vpc.flow_record where 
source.publicnetwork IN ('Internet IPs', 'Suspicious IPs') AND 
dest.resource IN (resource where role IN ('AWS RDS'))
```
This identifies internet traffic reaching RDS databases.

**3. Event Queries:**
Query cloud audit events to investigate actions taken.
```
event from cloud.audit_logs where 
operation = 'SetDefaultPolicyVersion' AND 
user = 'arn:aws:iam::123456789012:user/suspicious-user'
```
This finds IAM policy version changes by a specific user.

**Why RQL is critical for interviews:**
- Every custom policy in Prisma Cloud is written in RQL
- Investigation workflows rely on RQL queries
- Demonstrating RQL proficiency shows hands-on Prisma Cloud experience
- It's the equivalent of knowing KQL for Sentinel or SPL for Splunk

**Common RQL Patterns to Know:**

| Pattern | RQL Example |
|---|---|
| Find unencrypted resources | `config from cloud.resource where api.name = 'aws-rds-describe-db-instances' AND json.rule = storageEncrypted is false` |
| Find public security groups | `config from cloud.resource where api.name = 'aws-ec2-describe-security-groups' AND json.rule = ipPermissions[*].ipRanges[*] contains 0.0.0.0/0` |
| Find IAM users with console access but no MFA | `config from cloud.resource where api.name = 'aws-iam-get-credential-report' AND json.rule = mfa_active is false AND password_enabled is true` |
| Find inactive access keys | `config from cloud.resource where api.name = 'aws-iam-get-credential-report' AND json.rule = access_key_1_last_used_date older_than 90` |

---

### Q4. Explain the policy framework in Prisma Cloud. What are the different policy types?

**Answer:**
Prisma Cloud policies are the security rules that evaluate cloud configurations and generate alerts when violations are found.

**Policy Types:**

| Policy Type | Description | Example |
|---|---|---|
| **Config** | Evaluates cloud resource configurations at a point in time | "S3 bucket does not have server-side encryption enabled" |
| **Network** | Analyzes network flow data for suspicious traffic patterns | "Database instance receives direct internet traffic" |
| **Audit Event** | Monitors cloud audit logs for high-risk actions | "Root account used for API calls" |
| **IAM** | Evaluates identity and access management configurations | "IAM group with admin privileges has inactive users" |
| **Data** | Monitors for exposed sensitive data | "S3 bucket with PII data has public access" |
| **Anomaly** | Uses ML to detect unusual behavior patterns | "Unusual API activity from an IAM user" |
| **Attack Path** | Identifies chains of vulnerabilities leading to high-value targets | "Internet-facing VM with Critical CVE can access database with PII" |

**Policy Severity Levels:**
- **Critical** — Immediate remediation required (e.g., public database with PII)
- **High** — Remediate within 48 hours (e.g., unrestricted security group on production)
- **Medium** — Remediate within 7 days (e.g., missing encryption at rest)
- **Low** — Informational, track in governance (e.g., resource without required tags)
- **Informational** — No action required, used for visibility

**Policy Modes:**
- **Default Policies:** Pre-built by Palo Alto Networks security research team, mapped to compliance frameworks
- **Custom Policies:** Written by the customer using RQL to address organization-specific requirements
- **System Policies:** Prisma-managed, cannot be modified (but can be enabled/disabled)

**Policy-to-Compliance Mapping:**
Each policy can be mapped to one or more compliance standards:
- A single policy like "Ensure encryption at rest is enabled for RDS" maps to:
  - CIS AWS 2.3.1
  - PCI DSS 3.4
  - HIPAA 164.312(a)(1)
  - NIST 800-53 SC-28

---

### Q5. Describe the alert lifecycle in Prisma Cloud. How are alerts generated, managed, and resolved?

**Answer:**

**Alert Generation Flow:**
```
Cloud Account Scan → Resource Configuration Ingested → 
RQL Policy Evaluated → Violation Detected → Alert Created → 
Notification Sent (Slack/Jira/Email/SIEM/ServiceNow)
```

**Alert States:**

| State | Description |
|---|---|
| **Open** | Policy violation detected and active — resource is currently non-compliant |
| **Resolved** | Resource configuration has been fixed to comply with the policy |
| **Dismissed** | Manually dismissed by an analyst with a reason (accepted risk, false positive, etc.) |
| **Snoozed** | Temporarily hidden for a defined period (e.g., remediation in progress) |

**Alert Rules:**
Alert Rules define which policies generate notifications and where they are sent:

```
Alert Rule = Account Groups + Policies + Notification Channels + Severity Threshold
```

Example:
- **Production Alert Rule:** All Critical & High policies → PagerDuty + Jira (auto-ticket) + Slack #security-alerts
- **Development Alert Rule:** Critical only → Jira (auto-ticket) + Slack #dev-security
- **Compliance Alert Rule:** All PCI DSS policies → ServiceNow + Email compliance-team

**Auto-Remediation:**
Prisma Cloud supports automated remediation for certain policies:
- Remediation is executed via cloud-native actions (e.g., aws cli commands, Azure PowerShell)
- Must be explicitly enabled per policy — never enable without testing in non-production
- Example: Auto-enable S3 encryption when an unencrypted bucket is detected

**Alert Investigation Workflow:**
1. Alert fires → Analyst clicks to view the resource in Prisma Cloud
2. **Resource Detail View:** Shows the actual JSON configuration of the violating resource
3. **RQL Investigation:** Analyst runs additional RQL queries to understand context
4. **Graph View:** Shows the resource's relationships to other resources (identity, network, data)
5. **Remediation:** Analyst follows the guided remediation steps or runs auto-remediation
6. **Verification:** Next scan cycle confirms the fix and auto-resolves the alert

---

### Q6. What compliance frameworks does Prisma Cloud support? How do you use compliance in practice?

**Answer:**
Prisma Cloud supports 100+ compliance frameworks out-of-the-box:

**Major Frameworks:**
- CIS Benchmarks (AWS, Azure, GCP, Kubernetes, Docker)
- NIST SP 800-53 (Rev 4 & 5)
- NIST CSF (Cybersecurity Framework)
- PCI DSS v4.0
- SOC 2 Type II
- HIPAA / HITECH
- GDPR
- ISO 27001 / 27017 / 27018
- FedRAMP High / Moderate / Low
- MITRE ATT&CK Cloud Matrix
- CSA CCM (Cloud Controls Matrix)
- AWS Well-Architected Framework (Security Pillar)
- APRA CPS 234 (Australian banking)
- MAS TRM (Singapore banking)
- RBI Guidelines (India banking)
- Custom organizational frameworks

**How Compliance Works in Practice:**

**1. Framework Activation:**
- Enable the required compliance framework in Prisma Cloud Settings
- Prisma Cloud automatically maps its policies to the framework's controls

**2. Compliance Dashboard:**
- Shows pass/fail percentage per framework
- Drill down by: Section, Requirement, Control, Individual Policy
- Filter by: Cloud account, region, resource type, business unit

**3. Compliance Reports:**
- **One-click export** to PDF/CSV suitable for auditors
- Shows: Control description, policy status, failing resources, evidence timestamps
- Scheduled reports: Auto-generate and email weekly/monthly compliance reports

**4. Custom Compliance Standards:**
- Create custom standards by mapping a selection of Prisma Cloud policies
- Useful for internal security standards that don't align exactly with public frameworks

**Compliance Workflow for Audit Prep:**
```
Enable Framework → Review Dashboard → Identify Failing Controls → 
Create Remediation Tickets → Track Progress → Generate Report → 
Present to Auditor
```

---

# SECTION 2: PRISMA CLOUD CSPM DEEP DIVE

---

### Q7. How does Prisma Cloud handle multi-cloud environments?

**Answer:**
Prisma Cloud supports 7+ cloud providers with unified policy enforcement:

**Supported Clouds:**
- AWS (most comprehensive coverage)
- Microsoft Azure
- Google Cloud Platform (GCP)
- Oracle Cloud Infrastructure (OCI)
- Alibaba Cloud
- IBM Cloud

**Multi-Cloud Policy Enforcement:**
Prisma Cloud uses a **normalized data model** that allows a single policy to evaluate resources across clouds:

| Concept | AWS | Azure | GCP |
|---|---|---|---|
| Object Storage | S3 | Blob Storage | Cloud Storage |
| Compute | EC2 | Virtual Machines | Compute Engine |
| IAM Role | IAM Role | Managed Identity | Service Account |
| VPC | VPC | VNet | VPC |
| Kubernetes | EKS | AKS | GKE |

**Unified Asset Inventory:**
The Asset Inventory in Prisma Cloud provides a single view of all resources across all clouds:
- Total resource count by cloud, type, region
- Compliance status per resource
- Tag-based filtering and grouping
- Historical change tracking

**Account Groups:**
Resources are organized into **Account Groups** that support multi-cloud organizational structures:
```
Account Group: Production
├── AWS Account: prod-main (123456789012)
├── AWS Account: prod-data (234567890123)
├── Azure Subscription: Production-Sub
└── GCP Project: prod-gcp-1
```

Alert rules, compliance requirements, and access controls are applied at the Account Group level.

---

### Q8. Explain Asset Inventory in Prisma Cloud. How do you use it effectively?

**Answer:**
The Asset Inventory is the centralized resource database in Prisma Cloud that tracks every cloud resource across all onboarded accounts.

**What it shows:**
- **Total Resources:** Count by cloud provider, service, region
- **Resource Details:** Full JSON configuration of each resource (same data you'd see in the cloud provider console)
- **Pass/Fail Status:** How many policies each resource passes/fails
- **Compliance Mapping:** Which compliance standards the resource is relevant to
- **Change History:** Configuration changes over time (when it was compliant vs non-compliant)
- **Relationships:** Connected resources (e.g., EC2 → Security Group → VPC → Subnet)

**How I use Asset Inventory:**

**1. Shadow IT Discovery:**
```
config from cloud.resource where cloud.type = 'aws' AND api.name = 'aws-ec2-describe-instances' 
AND tag.Name does not exist
```
This finds all EC2 instances without a Name tag — likely unmanaged resources.

**2. Blast Radius Assessment:**
During an incident, query the asset inventory to understand what else is in the same environment:
```
config from cloud.resource where cloud.account = 'prod-main' AND 
cloud.region = 'us-east-1' AND api.name = 'aws-rds-describe-db-instances'
```
This lists all RDS databases in the affected account/region.

**3. Compliance Tracking:**
Filter the inventory by a specific compliance standard to see which resources are non-compliant:
- "Show me all resources failing PCI DSS controls in the payments account group"
- Export to CSV for the audit team

**4. Configuration Drift:**
Track changes over time — if a resource was compliant on Monday but non-compliant on Wednesday, the Asset Inventory shows the configuration diff.

---

### Q9. How do you create custom policies in Prisma Cloud? Walk through an example.

**Answer:**

**Step-by-Step Process:**

**1. Define the Requirement:**
"Alert if any AWS Lambda function has environment variables containing strings that look like credentials (containing 'password', 'secret', 'key', or 'token')."

**2. Build the RQL Query:**
```
config from cloud.resource where 
api.name = 'aws-lambda-list-functions' AND 
json.rule = environment.variables[*] contains "password" or 
environment.variables[*] contains "secret" or 
environment.variables[*] contains "key" or 
environment.variables[*] contains "token"
```

**3. Test the Query in Prisma Cloud Investigate:**
- Go to **Investigate** tab
- Paste the RQL query
- Review results — confirm it catches real violations and doesn't produce excessive false positives
- Refine the query based on results

**4. Create the Custom Policy:**
- Go to **Policies** → **Add Policy**
- **Policy Name:** "Lambda function with credentials in environment variables"
- **Policy Type:** Config
- **Severity:** High
- **Description:** "Lambda functions should not store sensitive credentials as environment variables. Use AWS Secrets Manager or SSM Parameter Store instead."
- **RQL Query:** Paste the tested query
- **Compliance Mapping:** Map to relevant standards (CIS, NIST)
- **Remediation:** "Remove credentials from Lambda environment variables. Store sensitive values in AWS Secrets Manager and reference via the SDK."

**5. Assign to Alert Rules:**
- Add the policy to relevant Alert Rules so it generates notifications
- Test in a dev account before enabling for production

**6. Validate:**
- Verify alerts are firing for known violations
- Confirm no false positives
- Document the policy for the security team

---

### Q10. Compare Prisma Cloud's approach to alerts vs. Wiz's approach. What are the key differences?

**Answer:**

| Aspect | Prisma Cloud | Wiz |
|---|---|---|
| **Primary Unit** | Individual policy-level alerts (one alert per failing resource per policy) | Attack paths + Issues (contextual grouping of related findings) |
| **Alert Volume** | Can be very high — thousands of individual alerts across hundreds of policies | Lower effective volume — focuses on attack paths rather than individual findings |
| **Prioritization** | Policy-defined severity (Critical/High/Medium/Low) — static per policy | Dynamic severity based on Security Graph context — same finding gets different severity based on exposure, identity, and data context |
| **Investigation** | RQL-driven — analyst writes queries to understand context | Graph-driven — analyst visualizes relationships in the Security Graph |
| **Strengths** | Deep RQL capability for custom investigation, granular policy control, extensive cloud API coverage | Superior contextual risk prioritization, attack path visualization, intuitive UX |
| **Weaknesses** | Can produce alert fatigue without careful tuning; less contextual correlation out-of-the-box | Less granular RQL-level control for power users; newer platform with some feature gaps |
| **Best For** | Organizations that want deep customization and integration with Palo Alto ecosystem | Organizations that want contextual risk prioritization and fast time-to-value |

**Interview Talking Point:**
"Both tools are strong CSPM platforms. My approach is to use each tool's strength: Prisma Cloud's RQL gives me deep investigative querying power and its ecosystem integration with Cortex XSIAM/XSOAR provides a unified SOC workflow. Wiz's Security Graph gives me immediate visibility into which risks actually form exploitable attack paths. In an ideal architecture, you'd use the contextual risk prioritization to decide what to fix first, and the deep querying capability to investigate and validate."

---

# SECTION 3: PRISMA CLOUD ADMINISTRATION & OPERATIONS

---

### Q11. Describe the role-based access control (RBAC) model in Prisma Cloud.

**Answer:**
Prisma Cloud uses a granular RBAC model with three key components:

**1. Roles:**

| Role | Permissions |
|---|---|
| **System Admin** | Full access to all features, settings, and accounts |
| **Account Group Admin** | Full access scoped to specific Account Groups |
| **Account Group Read Only** | Read-only access to specific Account Groups |
| **Cloud Provisioning Admin** | Manage cloud account onboarding and settings |
| **Build and Deploy Security** | Access to Code Security and CI/CD features |
| **Compute Admin** | Full access to CWPP (Compute) features |
| **Custom Roles** | Organization-defined roles with granular permission selection |

**2. Account Groups:**
Control which cloud accounts a user can see and manage:
- A user assigned to "Production" Account Group only sees resources from production accounts
- This enforces line-of-business or environment-level access segregation

**3. Access Keys:**
For API access and automation:
- Generate access keys per user for programmatic Prisma Cloud API calls
- Keys inherit the permissions of the user who created them
- Keys should be rotated every 90 days

**RBAC Best Practices:**
- Map RBAC roles to AD/Okta groups via SSO integration
- Use Account Group-scoped roles to enforce least privilege
- Never share System Admin credentials across team members
- Audit user access quarterly

---

### Q12. How do you integrate Prisma Cloud with external tools and workflows?

**Answer:**

**1. SIEM Integration:**
- **Splunk:** Native app (Prisma Cloud App for Splunk) sends alerts as syslog/webhook
- **Sentinel (Azure):** Direct integration via Data Connectors
- **QRadar:** Webhook-based alert forwarding
- **Cortex XSIAM:** Native Palo Alto integration for unified SOC operations

**2. Ticketing & ITSM:**
- **Jira:** Auto-create tickets from Prisma Cloud alerts, with resource details and remediation steps
- **ServiceNow:** Incident creation with policy mapping and compliance context
- **PagerDuty:** Alert routing based on severity for on-call engineers

**3. Notification Channels:**
- **Slack / Microsoft Teams:** Channel notifications for Critical/High alerts
- **Email:** For compliance reports and summary digests
- **Webhooks:** Custom integration with any tool that accepts HTTP webhooks

**4. CI/CD Integration:**
- **GitHub / GitLab / Bitbucket:** IaC scanning in PRs via Checkov or Prisma Cloud Code Security
- **Jenkins:** Plugin for pipeline-integrated scanning
- **Terraform Cloud / Enterprise:** Pre-plan scanning via Sentinel policies
- **IDE Plugins:** VS Code extension for real-time IaC feedback

**5. Automation & Orchestration:**
- **Cortex XSOAR:** Prisma Cloud content pack for automated incident response playbooks
- **Prisma Cloud API:** REST API for programmatic access to all Prisma features
- **Terraform Provider:** Manage Prisma Cloud policies and settings as code

**Example Integration Architecture:**
```
Prisma Cloud Alert (Critical) 
  → PagerDuty (immediate notification)
  → Jira (auto-create ticket)
  → Slack #security-critical (visibility)
  → XSOAR Playbook (automated investigation + containment)
```

---

### Q13. How do you manage alert fatigue in Prisma Cloud?

**Answer:**

**1. Alert Rule Optimization:**
- Create separate Alert Rules per environment (Production, Staging, Dev)
- Production: All severities → PagerDuty + Jira
- Development: Critical only → Slack + Jira
- Sandbox: Disabled — use Compliance dashboard only

**2. Policy Tuning:**
- Review each enabled policy for relevance to the organization
- Disable policies that don't apply (e.g., disable GovCloud-specific policies if not using GovCloud)
- Adjust severity levels if the default doesn't match organizational risk appetite
- Use RQL to refine policies (e.g., exclude specific resource tags from alerting)

**3. Alert Grouping & Aggregation:**
- Use Alert Rule filters to group related alerts
- Configure digest notifications instead of real-time for Medium/Low findings
- Leverage the Compliance dashboard for bulk tracking rather than individual alerts

**4. Dismissal & Snooze Governance:**
- **Dismiss:** Only with documented reason (Accepted Risk, False Positive, Compensating Control)
- **Snooze:** For known remediation in progress — set to auto-reopen after snooze period
- **Never** permanently dismiss without exception process approval

**5. Metrics Tracking:**
- Monitor: Alert volume trends, resolution time, dismiss rate, top noisy policies
- Monthly review: Which policies generate the most alerts? Are they actionable?
- Quarterly: Review dismissed/snoozed alerts — are they still valid?

**6. Anomaly Policy Tuning:**
- Anomaly-based policies (ML-driven) require baseline training
- Allow 2-4 weeks for the baseline to stabilize before enforcing alerts
- Whitelist known automation patterns (CI/CD service accounts, etc.)

---

### Q14. How does Prisma Cloud handle IaC scanning (Infrastructure as Code)?

**Answer:**
Prisma Cloud Code Security (formerly Bridgecrew) provides IaC scanning built on the open-source **Checkov** engine.

**Supported IaC Frameworks:**
- Terraform (HCL & JSON)
- CloudFormation (YAML & JSON)
- Kubernetes manifests (YAML)
- Helm charts
- Dockerfile
- ARM Templates (Azure)
- Serverless Framework
- Bicep
- CDK (synthesized)
- Ansible

**How IaC Scanning Works:**

**1. CI/CD Integration:**
```yaml
# GitHub Actions Example
- name: Prisma Cloud IaC Scan
  uses: bridgecrewio/checkov-action@master
  with:
    api-key: ${{ secrets.PRISMA_API_KEY }}
    directory: './terraform'
    framework: terraform
    soft_fail: false  # fail the pipeline on violations
```

**2. Pre-Commit Hooks:**
Developers run Checkov locally before pushing code:
```bash
checkov -d ./terraform --bc-api-key $PRISMA_API_KEY
```

**3. VCS Integration:**
- Connect GitHub/GitLab/Bitbucket repositories directly to Prisma Cloud
- Automatic PR scanning — comments on PRs with violations
- Tracks drift between IaC definitions and runtime configurations

**4. Supply Chain Security:**
- Visualizes dependency chains in IaC modules
- Detects vulnerable third-party Terraform modules
- Identifies hard-coded secrets in IaC files

**Shift-Left Value:**
"Catching a security group misconfiguration in Terraform during a PR review costs $0 and takes 5 minutes. Catching the same misconfiguration in production after it's been exploited costs millions. IaC scanning is the highest-ROI security investment for cloud-native organizations."

---

### Q15. Explain how Prisma Cloud CIEM works and its relationship with CSPM.

**Answer:**

**Prisma Cloud CIEM Capabilities:**

**1. Net Effective Permissions:**
Prisma Cloud calculates the actual permissions an identity has by evaluating:
- Identity policies (managed + inline)
- Resource-based policies
- Permission boundaries
- SCPs (Organizations)
- Session policies

**2. Overly Permissive Access Detection:**
RQL query example:
```
config from iam where action.name = '*' AND 
dest.cloud.resource.name = '*' AND 
source.cloud.service.name = 'iam'
```
This finds identities with wildcard permissions on all resources — admin-level access.

**3. Unused Access Detection:**
By correlating granted permissions with CloudTrail event data:
- Identifies permissions granted but never used in the last 90 days
- Recommends right-sized policies based on actual usage

**4. Cross-Account Access Mapping:**
Visualizes all cross-account trust relationships:
- Which roles can be assumed from other accounts?
- Are trust policies using External IDs?
- Are there orphaned cross-account trusts?

**5. Service Account Risk:**
- Identifies service accounts with console access enabled
- Detects access keys that haven't been rotated
- Flags service accounts with admin-level permissions

**Relationship with CSPM:**
CIEM findings feed into the CSPM risk model:
- A misconfigured Security Group (CSPM finding) on a VM with an overly-permissive IAM role (CIEM finding) accessing sensitive data (DSPM finding) creates a **compound risk** that is higher than any individual finding
- This correlation is what makes a CNAPP platform more valuable than point solutions

---

# SECTION 4: SCENARIO-BASED QUESTIONS

---

### Q16. Scenario: You receive 500 new Prisma Cloud alerts after onboarding a new AWS account. How do you triage?

**Answer:**

**Step 1: Don't Panic — Categorize (First 30 minutes)**
1. Open the Prisma Cloud Alerts page and filter by the new account
2. Group by severity: Critical → High → Medium → Low
3. Group by policy type: What categories dominate? (e.g., 200 are network-related, 150 are IAM, etc.)

**Step 2: Critical Alerts First (First 2 hours)**
4. Review all Critical alerts individually — these represent immediate risk:
   - Public-facing databases
   - Admin-level IAM with no MFA
   - S3 buckets with public access containing sensitive data
5. For each Critical, determine: Is this a real risk or a known-accepted configuration?
6. Create incident tickets for genuine Critical risks with remediation deadlines

**Step 3: Pattern Analysis (Day 1)**
7. Look for patterns — are 200 alerts caused by the same misconfiguration applied to 200 resources?
   - Example: All 200 EC2 instances missing a required tag → single remediation action (Terraform update)
8. Identify the "noisy" policies — if a policy generates 100+ alerts, investigate:
   - Is the policy relevant to this account type?
   - Should this account be in a different Account Group with different policies?

**Step 4: Establish Baseline (Week 1)**
9. Work with the account owner to understand intended configurations
10. Dismiss or snooze known-accepted configurations with documentation
11. Create remediation tickets for genuine violations with SLA-based deadlines
12. Configure Alert Rules appropriate for this account's tier (prod vs dev)

**Step 5: Ongoing Governance**
13. After initial triage, track: How many new alerts per day? What's the resolution rate?
14. Goal: Reduce open alerts by 80% in the first 30 days through remediation + appropriate tuning

---

### Q17. Scenario: An auditor asks you to prove PCI DSS compliance across your AWS environment using Prisma Cloud. Walk through your approach.

**Answer:**

**Phase 1: Scope Definition**
1. Identify the AWS accounts and services in PCI scope (cardholder data environment)
2. Create a dedicated Account Group in Prisma Cloud: "PCI Scope"
3. Onboard all in-scope accounts to this Account Group

**Phase 2: Compliance Assessment**
4. Go to **Compliance** → Select **PCI DSS v4.0**
5. Review the overall compliance percentage: "Currently 78% compliant"
6. Drill down by requirement:
   - Requirement 1 (Network Security Controls): 90% compliant
   - Requirement 3 (Protect Stored Account Data): 65% compliant — needs work
   - Requirement 6 (Secure Development): 72% compliant
   - Requirement 8 (Strong Access Controls): 55% compliant — critical gap

**Phase 3: Evidence Collection**
7. For each passing control, export the evidence:
   - "Encryption at rest is enabled on all RDS instances in PCI scope — confirmed by Prisma Cloud policy XYZ, last validated [timestamp]"
8. For each failing control, document:
   - What's failing (specific resources)
   - Remediation plan with timeline
   - Compensating controls (if applicable)

**Phase 4: Remediation**
9. Prioritize by requirement criticality:
   - Requirement 8 (IAM) — 55% → Focus remediation effort here
   - Create Jira tickets for each failing policy
10. Track remediation progress in the Compliance dashboard

**Phase 5: Audit Presentation**
11. Generate the **Prisma Cloud PCI DSS Compliance Report** (one-click PDF)
12. Walk the auditor through:
    - How Prisma Cloud continuously monitors the environment (not point-in-time)
    - How policies map to PCI requirements
    - Evidence of continuous compliance for passing controls
    - Remediation plans and timelines for failing controls

**Key Evidence Artifacts:**
- Compliance dashboard screenshots showing control pass/fail status
- Policy details showing the RQL query that validates each control
- Alert history showing when failures were detected and resolved
- Change history showing resource configurations over time

---

### Q18. Scenario: A developer complains that Prisma Cloud is blocking their Terraform deployment in CI/CD. How do you handle it?

**Answer:**

**Step 1: Understand the Block (Immediate)**
1. Review the CI/CD pipeline logs to identify which Prisma Cloud / Checkov policy caused the failure
2. Example: Policy "Ensure Security Group does not allow ingress from 0.0.0.0/0 to port 22" blocked the deployment

**Step 2: Assess the Finding (15 minutes)**
3. Is this a legitimate security concern?
   - **Yes:** The Terraform is creating an SSH-open security group for a production application → this should be blocked
   - **Maybe:** It's a bastion host that legitimately needs SSH access from specific IPs → the Terraform should be refined
   - **No:** It's a false positive caused by a policy that's too broad → the policy needs tuning

**Step 3: Respond Appropriately**

**If the block is correct:**
4. Explain to the developer why this configuration is risky
5. Provide the correct Terraform configuration:
   ```hcl
   # Instead of:
   ingress {
     from_port   = 22
     to_port     = 22
     cidr_blocks = ["0.0.0.0/0"]  # BLOCKED by Prisma Cloud
   }
   
   # Use:
   ingress {
     from_port   = 22
     to_port     = 22
     cidr_blocks = ["10.0.0.0/8"]  # Corporate CIDR only
   }
   ```

**If an exception is needed:**
5. Document the business justification
6. Add a Checkov skip annotation to the specific resource (not globally):
   ```hcl
   resource "aws_security_group" "bastion" {
     #checkov:skip=CKV_AWS_24:Bastion host requires SSH from approved IPs, approved by security team JIRA-1234
   }
   ```
7. The skip annotation is version-controlled and auditable

**If the policy needs tuning:**
5. Refine the policy to exclude specific resource types or tags:
   ```
   config from cloud.resource where api.name = 'aws-ec2-describe-security-groups' 
   AND json.rule = ipPermissions[*].ipRanges[*] contains 0.0.0.0/0 
   AND tag.exception_approved does not exist
   ```

**Key Principle:**
"I never disable a policy globally to unblock one developer. Instead, I provide the correct configuration, or if an exception is truly needed, it's documented, scoped, and auditable."

---

### Q19. Scenario: You notice that Prisma Cloud shows a spike in anomaly alerts — 50 new "Unusual API Activity" alerts in the last 24 hours. How do you investigate?

**Answer:**

**Step 1: Pattern Recognition (First 15 minutes)**
1. Review all 50 alerts — look for commonalities:
   - Are they all from the same AWS account?
   - Are they all from the same IAM principal?
   - Are they all happening in the same time window?
   - Are the API calls similar (all IAM calls? all S3 calls?)

**Step 2: Classify the Spike**

**If all from one principal making unusual calls:**
- Possible compromised credentials
- Query CloudTrail via RQL:
  ```
  event from cloud.audit_logs where cloud.account = 'prod-main' AND 
  user = 'arn:aws:iam::123456789012:user/deploy-bot' AND 
  crud IN ('create', 'update', 'delete')
  ```
- Check: Source IP, user agent, time of day
- Compare against the principal's baseline behavior

**If from many principals — pattern change:**
- Possible organizational change (new deployment pipeline, new team, new tool)
- Check with DevOps: "Did anything change in the last 24-48 hours?"
- Common causes: New CI/CD tool adopted, new team members onboarded, infrastructure migration

**Step 3: Determine if Malicious**
2. Red flags for compromised credentials:
   - API calls from unusual geographic locations
   - reconnaissance-pattern calls: ListUsers, ListBuckets, DescribeInstances
   - Calls from unexpected user agents (aws-cli when expecting SDK)
   - IAM modifications: CreateUser, PutRolePolicy, CreateAccessKey

3. If confirmed malicious:
   - Trigger IR playbook
   - Revoke the compromised credentials
   - Rotate all credentials the principal could access
   - Review CloudTrail for full scope of compromise

**Step 4: Resolution**
4. If benign: Whitelist the new pattern in anomaly policy configuration
5. If malicious: Complete incident response and tighten IAM policies to prevent recurrence

---

### Q20. Scenario: You need to set up Prisma Cloud for a new organization with 50 AWS accounts across 3 business units. Describe your approach.

**Answer:**

**Phase 1: Architecture Design (Week 1)**

**Account Group Structure:**
```
Root
├── Business Unit A (Finance)
│   ├── BU-A-Production (10 accounts)
│   ├── BU-A-Staging (3 accounts)
│   └── BU-A-Development (5 accounts)
├── Business Unit B (Retail)
│   ├── BU-B-Production (8 accounts)
│   ├── BU-B-Staging (3 accounts)
│   └── BU-B-Development (6 accounts)
├── Business Unit C (Operations)
│   ├── BU-C-Production (5 accounts)
│   ├── BU-C-Staging (3 accounts)
│   └── BU-C-Development (7 accounts)
└── Shared Services
    └── Shared-Infra (3 accounts - logging, networking, security)
```

**RBAC Design:**
- **Security Team:** System Admin across all Account Groups
- **BU-A Security Lead:** Account Group Admin for BU-A groups
- **BU-A Developers:** Account Group Read Only for BU-A groups
- **Compliance Team:** Account Group Read Only for all Production Account Groups

**Phase 2: Onboarding (Week 2-3)**
1. Create a Terraform module for the Prisma Cloud IAM role deployment
2. Deploy via AWS CloudFormation StackSets to all 50 accounts simultaneously
3. Onboard accounts in Prisma Cloud and assign to Account Groups
4. Validate connectivity and initial scan completion

**Phase 3: Policy Configuration (Week 3-4)**

**Alert Rules by Environment:**

| Environment | Severity Threshold | Channels |
|---|---|---|
| Production | Critical + High | PagerDuty + Jira + Slack |
| Staging | Critical | Jira + Slack |
| Development | Critical only (informational) | Slack only |

**Compliance Enablement:**
- PCI DSS → Finance BU Production accounts
- SOC 2 → All Production accounts
- CIS AWS → All accounts
- Custom internal standard → All accounts

**Phase 4: Integration (Week 4-5)**
- Jira: Project per BU, auto-ticket creation from alerts
- Slack: Channel per BU (#security-bu-a, #security-bu-b)
- SIEM: Forward all alerts to Cortex XSIAM/Splunk
- CI/CD: Integrate Checkov into all CI/CD pipelines

**Phase 5: Operationalization (Week 5-8)**
- Train security team and BU security leads
- Establish SLA framework for remediation
- Create governance dashboards
- Schedule monthly compliance review meetings per BU
- Document runbooks for common investigation flows

---

# SECTION 5: PRISMA CLOUD CWPP (COMPUTE) & CODE SECURITY

---

### Q21. Explain Prisma Cloud CWPP (formerly Twistlock). How does it differ from CSPM?

**Answer:**

| Aspect | CSPM | CWPP (Compute) |
|---|---|---|
| **What it monitors** | Cloud infrastructure configuration (how resources are set up) | Runtime workload behavior (what's running inside VMs, containers, serverless) |
| **Architecture** | Agentless — API-based cloud scanning | Agent-based — Prisma Cloud Defender deployed on each host/container |
| **Detection Focus** | Misconfigurations, compliance violations, identity risks | Vulnerabilities, malware, container drift, runtime attacks, network anomalies |
| **Example Finding (CSPM)** | "Security group allows SSH from 0.0.0.0/0" | N/A |
| **Example Finding (CWPP)** | N/A | "Cryptominer binary executed in container after deploy" |
| **When it helps** | Preventing misconfigurations before they're exploited | Detecting and preventing attacks during runtime |

**CWPP Key Capabilities:**

**1. Vulnerability Management:**
- Scans running workloads for OS and application vulnerabilities
- Image scanning in registries (ECR, ACR, GCR, Artifactory)
- CI/CD pipeline scanning (fail builds with Critical CVEs)

**2. Runtime Protection:**
- Process monitoring — detect and block unexpected process execution
- File system monitoring — detect container drift (new binaries added post-deploy)
- Network monitoring — detect anomalous connections and port scanning

**3. Container Security:**
- Container compliance — enforce CIS Docker/Kubernetes benchmarks
- Admission control — block non-compliant images from being deployed
- Forensics — full process tree and command history for incident investigation

**4. Web Application & API Security (WAAS):**
- Built-in WAF for protecting web applications
- API security — detect and block API abuse
- Bot protection — block automated attacks

**5. Serverless Security:**
- Scan Lambda, Azure Functions, GCP Cloud Functions for vulnerabilities
- Runtime protection via wrapper instrumentation

---

### Q22. How does the Prisma Cloud Defender (agent) work? Discuss deployment models.

**Answer:**

**What is the Defender?**
The Prisma Cloud Defender is a lightweight agent deployed on hosts, containers, and serverless functions to provide runtime security monitoring and protection.

**Deployment Models:**

| Model | Where Deployed | Use Case |
|---|---|---|
| **Container Defender** | DaemonSet on each Kubernetes node | EKS, AKS, GKE clusters |
| **Host Defender** | On each VM/EC2 instance | Non-containerized workloads |
| **Serverless Defender** | Lambda layer / function wrapper | Serverless functions |
| **App-Embedded Defender** | Embedded in container image | Fargate, Cloud Run (no host access) |
| **Agentless Scanning** | No deployment needed | Quick assessment without agent installation |

**Container Defender Architecture (EKS):**
```
EKS Cluster
├── Namespace: twistlock
│   ├── DaemonSet: twistlock-defender-ds
│   │   ├── Pod on Node 1: defender
│   │   ├── Pod on Node 2: defender  
│   │   └── Pod on Node N: defender
│   └── Console Connection: → Prisma Cloud SaaS Console
```

**How the Defender works:**
1. Runs as a privileged container (DaemonSet) on each node
2. Monitors all containers on the node via the container runtime socket
3. Captures: process execution, file system changes, network connections
4. Compares observed behavior against learned models and configured rules
5. Actions: Alert, Block, or Quarantine based on policy configuration

**Sizing Guidelines:**
- Memory: ~256MB per Defender
- CPU: ~0.5 vCPU
- Network: Only outbound to Prisma Cloud SaaS console (port 443)

---

### Q23. Describe Prisma Cloud's Code Security capability (formerly Bridgecrew/Checkov).

**Answer:**

**Checkov — The Engine:**
Checkov is the open-source IaC scanning engine that powers Prisma Cloud Code Security. It's the most widely adopted open-source IaC scanner.

**Key Capabilities:**

**1. IaC Scanning:**
- Scans Terraform, CloudFormation, Kubernetes YAML, Helm, Dockerfile, ARM, Bicep
- 1000+ built-in policies covering AWS, Azure, GCP
- Custom policies in Python or YAML

**2. SCA (Software Composition Analysis):**
- Scans open-source dependencies (package.json, requirements.txt, pom.xml)
- Identifies known CVEs in third-party libraries
- License compliance checking

**3. Secrets Detection:**
- Identifies hard-coded secrets in source code and IaC files
- Detects: API keys, passwords, tokens, certificates, private keys
- Reduces risk of credential exposure in version control

**4. Supply Chain Security:**
- Visualizes the dependency graph of IaC modules
- Identifies which third-party Terraform modules are used and their trust level
- Detects if any module versions have known vulnerabilities

**5. Drift Detection:**
- Compares IaC definitions against actual cloud configuration
- Identifies resources that were modified outside of IaC (manual console changes)
- Helps enforce IaC-as-single-source-of-truth

**Integration Points:**
```
Developer Workstation (IDE Plugin)
    ↓
Git (Pre-commit Hook via Checkov)
    ↓
CI/CD Pipeline (GitHub Actions / GitLab CI / Jenkins)
    ↓
Prisma Cloud Console (centralized visibility)
    ↓
Cloud Runtime (drift monitoring)
```

---

# SECTION 6: PRISMA CLOUD vs. COMPETITORS

---

### Q24. Compare Prisma Cloud CSPM with AWS Security Hub.

**Answer:**

| Capability | AWS Security Hub | Prisma Cloud CSPM |
|---|---|---|
| **Scope** | AWS only (single cloud) | Multi-cloud: AWS, Azure, GCP, OCI, Alibaba, IBM |
| **Data Sources** | Aggregates findings from GuardDuty, Inspector, Macie, Config, Firewall Manager | Direct API-based scanning of all cloud resources + IaC + runtime |
| **Custom Rules** | Limited to AWS Config managed/custom rules | Full RQL query language for custom policies — highly flexible |
| **Compliance** | Maps to CIS, NIST, PCI — basic reporting | 100+ frameworks, one-click reporting, custom standards |
| **Identity Analysis** | IAM Access Analyzer — some cross-account analysis | Full CIEM — effective permissions, unused privileges, cross-account trust mapping |
| **Attack Path** | No attack path analysis | Attack path analysis connecting misconfigs, vulns, identities, and data |
| **IaC Scanning** | No native IaC scanning | Full Checkov-powered IaC scanning integrated into CI/CD |
| **Cost** | Free to enable (charges for consolidated findings) | Subscription-based licensing (by resource count) |
| **Integration** | Native AWS services, basic SIEM forwarding | Extensive integration: Jira, ServiceNow, Slack, SIEM, SOAR, CI/CD |

**When to use each:**
- **Security Hub:** Best within AWS-only shops that want a free, native aggregation point for AWS findings
- **Prisma Cloud:** Essential for multi-cloud environments, organizations needing deep investigation (RQL), comprehensive compliance reporting, and full CNAPP capabilities

---

### Q25. Compare Prisma Cloud with Wiz. When would you choose one over the other?

**Answer:**

| Aspect | Prisma Cloud | Wiz |
|---|---|---|
| **Architecture** | Hybrid: Agentless CSPM + Agent-based CWPP (Defender) | Agentless-first (optional Wiz Defend sensors) |
| **CSPM** | Strong — RQL-powered, 100+ compliance frameworks | Very strong — Security Graph with contextual attack path analysis |
| **CWPP** | Excellent — Mature runtime protection (ex-Twistlock), container drift prevention, WAAS | Good — Agentless vuln scanning; runtime CDR via Wiz Defend (newer) |
| **CIEM** | Strong — Net effective permissions, unused access detection | Strong — Transitive access mapping, blast radius computation |
| **IaC Scanning** | Excellent — Checkov (open-source leader), supply chain security | Good — IaC scanning integrated but Checkov is more feature-rich |
| **Risk Prioritization** | Policy-level severity, improving with attack path analysis | Industry-leading — Security Graph + toxic combinations |
| **Investigation** | RQL — powerful for advanced users, steep learning curve | Graph visualization — intuitive, fast time-to-insight |
| **Ecosystem** | Palo Alto Networks (Cortex XSIAM, XSOAR, Strata) — enterprise SOC integration | Google Cloud (after 2026 acquisition) — Google SecOps, Mandiant |
| **Time to Value** | Longer — agent deployment, RQL learning curve, policy tuning | Faster — agentless, intuitive UX, immediate attack path visibility |
| **Maturity** | Very mature — evolved over 5+ years through acquisitions | Newer but rapidly maturing — founded 2020 |
| **Pricing** | Credit-based model — can be complex | Simpler per-resource pricing |

**When to choose Prisma Cloud:**
- Organizations already invested in Palo Alto Networks ecosystem (Cortex, Strata)
- Need strong runtime CWPP (agent-based container protection, WAAS)
- Want deep investigation capability with RQL
- Large engineering teams comfortable with complex tooling

**When to choose Wiz:**
- Need rapid time-to-value and immediate risk visibility
- Want intuitive, graph-based risk prioritization
- Organization prefers agentless-first approach
- Need to quickly demonstrate ROI to leadership with attack path reduction metrics

---

# SECTION 7: ADVANCED & GRILLING QUESTIONS

---

### Q26. How does Prisma Cloud detect and respond to threats at runtime vs. at the configuration layer?

**Answer:**

**Configuration Layer (CSPM — Proactive):**
- **Detection:** Continuous API-based scanning identifies misconfigurations before they're exploited
- **Response:** Alert → Ticket → Remediation (manual or automated)
- **Example:** "Security group allows 0.0.0.0/0 to port 3306" → Alert fires → DBA updates the SG → Alert auto-resolves on next scan

**Runtime Layer (CWPP/Compute — Reactive):**
- **Detection:** Defender agent monitors live workload behavior at the process, file, and network level
- **Response:** Alert + Block + Quarantine (automated prevention)
- **Example:** "Container drift detected — unknown binary 'xmrig' written to /tmp and executed" → Defender blocks the process → SOC investigates

**The Combined Power (CNAPP):**
When both layers are active, you get full lifecycle security:
1. **CSPM** warns: "This EC2 instance has a Critical CVE, is internet-facing, and has an overly-permissive IAM role" (configuration risk)
2. **CWPP** detects: "This EC2 instance is actively being exploited — reverse shell spawned" (runtime attack)
3. **Combined response:** Immediately correlate the CSPM risk with the CWPP detection, validate the attack path, and contain (isolate instance + revoke IAM role)

---

### Q27. Explain how Prisma Cloud handles network security and microsegmentation.

**Answer:**

**Network Flow Visualization:**
Prisma Cloud ingests VPC Flow Logs (AWS), NSG Flow Logs (Azure), and VPC Flow Logs (GCP) to build a visual network topology:
- Shows actual traffic flows between resources
- Identifies: Internet-facing resources, internal communication patterns, unexpected cross-VPC traffic

**Network RQL Queries:**
```
network from vpc.flow_record where 
dest.resource IN (resource where role IN ('AWS RDS', 'AWS Redshift')) AND 
source.publicnetwork IN ('Internet IPs')
AND bytes > 0
```
This identifies actual internet traffic reaching databases — not just security group rules that allow it, but confirmed traffic flows.

**Network Exposure Analysis:**
Combines:
- Security group rules (what's allowed?)
- Network ACL rules (what's filtered?)
- VPC routing (how is traffic routed?)
- Actual flow logs (what traffic is actually flowing?)

**Microsegmentation (Cloud Network Security Module):**
- Visualizes workload communication patterns
- Recommends network policies based on observed traffic
- Identifies workloads that communicate but shouldn't
- Helps implement zero-trust network architecture

**Why this matters:**
"A security group rule allowing 0.0.0.0/0 is a CSPM finding. But if VPC Flow Logs show that no actual internet traffic is reaching the resource (maybe it's behind an ALB with tighter rules), the real risk is lower. Network flow analysis gives us the ground truth."

---

### Q28. What are Prisma Cloud Anomaly Policies and how do you tune them?

**Answer:**

**Anomaly Policies:**
Prisma Cloud uses ML-based behavioral analytics to detect unusual patterns:

**Types:**
- **UEBA (User and Entity Behavior Analytics):** Unusual API calls, unusual geographic access, unusual time-of-day activity
- **Network Anomalies:** Unusual port usage, unusual data transfer volumes, unusual destination IPs
- **DNS Anomalies:** Communication with known malicious domains

**How anomaly detection works:**
1. **Baseline Period:** 2-4 weeks of learning normal behavior per identity and resource
2. **Model Training:** ML models establish what "normal" looks like for each entity
3. **Detection:** Deviations from the baseline trigger anomaly alerts
4. **Severity:** Based on the degree of deviation and the risk context

**Tuning Process:**
1. **Initial Deployment:** Enable all anomaly policies in "low" sensitivity
2. **Baseline Period (2-4 weeks):** Allow models to train — expect some noise
3. **Review False Positives:** Common FPs:
   - CI/CD service accounts using different source IPs (legitimate)
   - New team members accessing resources for the first time (legitimate)
   - Seasonal business patterns (e.g., end-of-quarter reporting)
4. **Whitelist Known Patterns:**
   - Exclude CI/CD service account ARNs from UEBA policies
   - Add known automation IPs to trusted IP lists
5. **Adjust Sensitivity:**
   - Critical environments: High sensitivity → more alerts but catches subtle attacks
   - Dev environments: Low sensitivity → fewer false positives
6. **Monthly Review:** Are anomaly alerts leading to investigations? If not, further tune.

---

### Q29. How would you use Prisma Cloud to investigate a suspected compromised IAM access key?

**Answer:**

**Step 1: Identify the Key**
```
config from cloud.resource where api.name = 'aws-iam-get-credential-report' AND 
json.rule = user_name = 'suspicious-user'
```
Pull the credential report for the user.

**Step 2: Event Investigation**
```
event from cloud.audit_logs where 
user = 'arn:aws:iam::123456789012:user/suspicious-user' AND 
cloud.account = 'prod-main'
```
Review all API calls made by this user in the incident window.

**Step 3: Look for Reconnaissance**
```
event from cloud.audit_logs where 
user = 'arn:aws:iam::123456789012:user/suspicious-user' AND 
operation IN ('ListBuckets', 'DescribeInstances', 'ListRoles', 'ListUsers', 
'GetCallerIdentity', 'ListSecrets')
```
These reconnaissance API calls are strong indicators of compromised credentials.

**Step 4: Check for Privilege Escalation**
```
event from cloud.audit_logs where 
user = 'arn:aws:iam::123456789012:user/suspicious-user' AND 
operation IN ('CreateUser', 'CreateAccessKey', 'PutRolePolicy', 
'AttachUserPolicy', 'CreatePolicyVersion', 'CreateRole')
```
These operations suggest the attacker is establishing persistence or escalating privileges.

**Step 5: Check Source IPs**
Review the source IPs in the event logs:
- Are they from known corporate egress IPs?
- Are they from an unexpected country?
- Are they from known VPN/Tor exit nodes?

**Step 6: Containment**
If compromise is confirmed:
1. Disable the access key immediately
2. Apply an inline IAM deny policy to the user (blocks all sessions)
3. Review all resources accessed/modified during the compromise
4. Rotate any secrets or credentials the user could have accessed
5. Create Prisma Cloud alert for similar patterns to catch future attempts

---

### Q30. What is the Prisma Cloud Copilot and how does it help security operations?

**Answer:**
Prisma Cloud Copilot is the AI-powered assistant built on Palo Alto Networks' **Precision AI®** that enables security teams to interact with Prisma Cloud using natural language.

**Capabilities:**

**1. Natural Language Querying:**
Instead of writing RQL:
```
Human: "Show me all S3 buckets that are publicly accessible and contain sensitive data"
Copilot: Translates to RQL → Runs query → Returns results with context
```

**2. Investigation Assistance:**
```
Human: "Why is this alert Critical?"
Copilot: "This S3 bucket is publicly accessible (policy XYZ), contains PII data classified by DSPM, 
and is accessible via an IAM role attached to an internet-facing EC2 instance with a Critical CVE. 
These three factors create an exploitable attack path."
```

**3. Remediation Guidance:**
```
Human: "How do I fix this finding?"
Copilot: "To remediate, update the S3 bucket policy to deny public access. 
Here's the specific AWS CLI command... and here's the Terraform change..."
```

**4. Report Generation:**
```
Human: "Generate a compliance summary for our PCI scope for the last quarter"
Copilot: Generates a formatted report with trend data, top failures, and remediation progress
```

**Why it matters:**
"The Copilot lowers the barrier to entry for cloud security. A Level 1 analyst who doesn't know RQL can still investigate alerts effectively. A compliance officer who needs a report doesn't need to navigate 10 dashboard pages. It democratizes access to Prisma Cloud's powerful data."

---

# SECTION 8: OPERATIONAL BEST PRACTICES

---

### Q31. What operational metrics should you track for Prisma Cloud CSPM?

**Answer:**

| Metric | What It Measures | Target |
|---|---|---|
| **Mean Time to Remediate (MTTR) by Severity** | Average time from alert creation to resolution | Critical: < 24h, High: < 48h, Medium: < 7d |
| **Open Alert Count by Severity** | Current backlog of unresolved alerts | Trending down month-over-month |
| **Alert-to-Resolution Rate** | % of alerts resolved vs. dismissed/snoozed | > 70% resolved (not just dismissed) |
| **Compliance Score by Framework** | % of controls passing per framework | > 90% for production environments |
| **Policy Coverage** | % of cloud resource types covered by at least one policy | > 95% |
| **Account Onboarding Coverage** | % of cloud accounts onboarded to Prisma Cloud | 100% |
| **False Positive Rate** | % of alerts that are dismissed as false positives | < 15% (if higher, policies need tuning) |
| **Critical Attack Paths** | Number of exploitable attack paths to sensitive data | 0 (aspirational), trending down |
| **SLA Compliance** | % of alerts remediated within SLA | > 90% |
| **Scan Failure Rate** | % of accounts/resources that fail to scan | < 1% |

**Governance Dashboard:**
Present these metrics monthly to:
- **CISO:** Top 5 Critical risks, compliance trends, SLA compliance
- **Engineering Leads:** Their team's open alerts, remediation velocity, top findings
- **Audit/Compliance:** Framework-specific compliance trends, evidence generation

---

### Q32. Describe your incident response workflow using Prisma Cloud.

**Answer:**

**Phase 1: Detection (0-15 minutes)**
1. Prisma Cloud alert fires (CSPM misconfiguration, CWPP runtime event, or Anomaly)
2. Alert routes to PagerDuty (Critical) or Jira (High) based on Alert Rules
3. SOC analyst reviews the alert in Prisma Cloud console

**Phase 2: Triage (15-60 minutes)**
4. Assess the alert context:
   - CSPM: Review resource configuration, check attack path context
   - CWPP: Review process tree, file events, network connections
   - Anomaly: Review behavioral deviation, source IP, API call pattern
5. Query related events via RQL:
   ```
   event from cloud.audit_logs where 
   cloud.account = 'affected-account' AND 
   operation IN ('suspicious-ops') AND 
   timestamp > '2026-03-30T00:00:00Z'
   ```
6. Determine: Is this a real threat or a benign activity?

**Phase 3: Containment (1-4 hours)**
7. If confirmed threat:
   - Revoke compromised credentials (IAM inline deny policy)
   - Isolate affected resources (security group quarantine)
   - Block attacker network indicators (WAF/NACL)
8. If CWPP runtime event:
   - Use Defender to quarantine the container/host
   - Capture forensic data (process tree, file events, network connections)

**Phase 4: Investigation (4-24 hours)**
9. Use Prisma Cloud's timeline and graph views to understand full scope
10. Cross-reference with SIEM (Cortex XSIAM/Splunk) for correlated events
11. Document findings in incident report

**Phase 5: Remediation (24-72 hours)**
12. Fix the root cause configuration (patch, update IAM policy, fix network rules)
13. Verify fix in Prisma Cloud — alert should auto-resolve
14. Add preventive controls (SCP, policy update, IaC pipeline check)
15. Conduct post-incident review and update playbooks

---

### Q33. How do you handle Prisma Cloud platform maintenance and lifecycle management?

**Answer:**

**1. Defender Upgrades:**
- Prisma Cloud releases new Defender versions regularly
- Upgrade strategy: Dev → Staging → Production (never upgrade all at once)
- Monitor Defender health dashboard after upgrades — watch for connectivity issues
- Automate upgrades via DaemonSet rolling update strategy

**2. Policy Updates:**
- Prisma Cloud regularly adds new policies (monthly cadence)
- New policies are disabled by default — review before enabling
- Process: Review new policies → Test in non-production → Enable for production
- Track policy changelog for breaking changes

**3. API Key Rotation:**
- Rotate Prisma Cloud API keys every 90 days
- Automate via vault/secrets management
- Audit which automation uses which API keys

**4. Account Maintenance:**
- New AWS accounts created → auto-onboard via StackSets + Lambda webhook
- Decommissioned accounts → remove from Prisma Cloud to avoid stale alerts
- Validate scan connectivity monthly — check for expired cross-account roles

**5. Performance Monitoring:**
- Monitor scan latency — if scans take longer than expected, check account permissions
- Monitor alert pipeline — if alerts stop flowing for an account, investigate
- Monitor Defender resource usage — ensure DaemonSet pods aren't consuming excessive node resources

---

END OF PRISMA CLOUD INTERVIEW Q&A

---
*Prepared for Cloud Security Interview Preparation — March 2026*
