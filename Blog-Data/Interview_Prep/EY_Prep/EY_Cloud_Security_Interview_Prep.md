# 🛡️ EY India — Application Security / Cloud Security Engineer Interview Prep

> **Role:** Application Security / Cloud Security Engineer (4–5 Years)
> **Company:** Ernst & Young India (EY India)
> **Core Focus:** CNAPP, CSPM, CWPP, Vulnerability Management, Multi-Cloud Security (AWS/Azure/GCP)

---

## 📋 Table of Contents

1. [Role Overview & Key Themes](#-1-role-overview--key-themes)
2. [CNAPP / CSPM / CWPP Deep Dive](#-2-cnapp--cspm--cwpp-deep-dive)
3. [Cloud Security Posture Management (CSPM)](#-3-cloud-security-posture-management-cspm)
4. [Vulnerability Management Lifecycle](#-4-vulnerability-management-lifecycle)
5. [Identity & Access Management (IAM)](#-5-identity--access-management-iam)
6. [Data & Workload Security](#-6-data--workload-security)
7. [Zero-Day & Incident Response](#-7-zero-day--incident-response)
8. [SIEM Integration & Automation](#-8-siem-integration--automation)
9. [Compliance & Governance Frameworks](#-9-compliance--governance-frameworks)
10. [Stakeholder Collaboration & Communication](#-10-stakeholder-collaboration--communication)
11. [Scripting & Automation](#-11-scripting--automation)
12. [IaC Security Scanning](#-12-iac-security-scanning)
13. [Scenario-Based Interview Questions](#-13-scenario-based-interview-questions)
14. [Behavioral & Soft-Skills Questions](#-14-behavioral--soft-skills-questions)
15. [30-60-90 Day Plan for EY](#-15-30-60-90-day-plan-for-ey)

---

## 🎯 1. Role Overview & Key Themes

### What This Role Really Expects

| Theme | What They Want | How to Demonstrate |
|---|---|---|
| **CNAPP Mastery** | Hands-on with Orca Security or equivalent | Talk about alert triage, policy tuning, dashboard building |
| **Multi-Cloud** | AWS + Azure + GCP | Show breadth — IAM, networking, storage security across clouds |
| **Vulnerability Mgmt** | Full lifecycle — discover → prioritize → remediate → verify | Describe your SLA framework and risk-acceptance workflows |
| **Automation** | Python/Bash/PowerShell scripting | Share examples of automated security checks and reporting |
| **Compliance** | NIST, ISO 27001, CIS Benchmarks | Explain how you map controls and generate compliance reports |
| **Integration** | SIEM (Splunk/Sentinel) + Ticketing (Jira/ServiceNow) | Detail your experience building bi-directional integrations |
| **Stakeholder Mgmt** | Translate findings for non-security teams | Give examples of clear, actionable remediation guidance |

---

## 🔍 2. CNAPP / CSPM / CWPP Deep Dive

### Q: "What is a CNAPP and how does it unify cloud security?"

**A:** "A Cloud-Native Application Protection Platform (CNAPP) converges multiple cloud security capabilities into a single platform. It combines:

- **CSPM (Cloud Security Posture Management):** Continuously monitors cloud configurations against benchmarks (CIS, NIST) and detects misconfigurations like open security groups, unencrypted storage, or overly permissive IAM policies.
- **CWPP (Cloud Workload Protection Platform):** Protects runtime workloads — VMs, containers, serverless — by detecting vulnerabilities, malware, and anomalous behavior at the workload level.
- **CIEM (Cloud Infrastructure Entitlement Management):** Analyzes IAM permissions across cloud accounts to detect over-privileged identities and enforce least privilege.
- **IaC Scanning:** Shifts security left by scanning Terraform, CloudFormation, and ARM templates before deployment.
- **Container Security:** Image scanning, runtime monitoring, and Kubernetes admission control.

The real value of a CNAPP like **Orca Security** is its **agentless, SideScanning™** approach — it reads cloud block storage snapshots to discover vulnerabilities, misconfigurations, malware, lateral movement risk, and sensitive data exposure without installing agents on every workload."

### Q: "What is SideScanning and why is it significant?"

**A:** "Orca's SideScanning technology reads the runtime block storage of cloud instances out-of-band (without deploying agents). This means:
1. **100% coverage instantly** — no deployment gaps or agent health issues.
2. **Zero performance impact** — no CPU/memory overhead on production workloads.
3. **Deep visibility** — it can see inside containers, detect installed packages, running services, exposed secrets, and misconfigurations.

This is significant for EY because as a consulting/services firm, they likely manage multiple client environments. Agentless scanning enables rapid onboarding of new cloud accounts without coordination overhead."

### Q: "Compare Orca Security vs. Wiz vs. Prisma Cloud."

**A:**

| Capability | Orca Security | Wiz | Prisma Cloud (Palo Alto) |
|---|---|---|---|
| **Approach** | Agentless (SideScanning) | Agentless (Snapshot-based) | Agent + Agentless hybrid |
| **CSPM** | ✅ Strong | ✅ Strong | ✅ Strong |
| **CWPP** | ✅ Agentless | ✅ Agentless | ✅ Agent-based (Defender) |
| **CIEM** | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **IaC Scanning** | ✅ | ✅ | ✅ (Bridgecrew/Checkov) |
| **API Security** | ✅ | ✅ | ✅ |
| **Attack Path Analysis** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Deployment Speed** | Minutes (agentless) | Minutes (agentless) | Hours–Days (agent deploy) |
| **Best For** | Full-stack visibility, no agents | Risk prioritization, Graph | Enterprises wanting agent depth |

---

## 🏗️ 3. Cloud Security Posture Management (CSPM)

### Q: "Walk me through how you manage cloud security posture across a multi-cloud environment."

**A:** "My approach to CSPM is structured in layers:

1. **Baseline Configuration:** I establish security baselines using CIS Benchmarks for each cloud provider — CIS AWS Foundations, CIS Azure Foundations, CIS GCP Foundations. These are loaded as compliance frameworks in the CNAPP tool.

2. **Continuous Monitoring:** The CNAPP continuously scans cloud accounts and flags deviations. Common findings include:
   - **AWS:** S3 buckets without encryption-at-rest, Security Groups with `0.0.0.0/0` ingress, CloudTrail disabled in a region, root account without MFA.
   - **Azure:** NSGs with open RDP/SSH, Storage Accounts with public blob access, Key Vaults without soft-delete enabled.
   - **GCP:** Firewall rules allowing ingress from `0.0.0.0/0`, Cloud Storage buckets with `allUsers` ACL, API keys without restriction.

3. **Risk Prioritization:** Not all misconfigurations are equal. I use the CNAPP's risk scoring (factoring in asset exposure, data sensitivity, and exploitability) to prioritize remediation. A public-facing EC2 instance with an exploitable CVE and an overly permissive IAM role is far more critical than an internal dev instance with a minor config gap.

4. **Remediation Workflow:** High/Critical findings are auto-ticketed to Jira/ServiceNow with remediation steps, SLA timers, and escalation rules. Medium/Low findings are batched into weekly reports for the respective cloud teams.

5. **Policy Enforcement:** I implement preventive guardrails — AWS SCPs, Azure Policies, GCP Organization Policies — to prevent insecure configurations from being deployed in the first place."

### Q: "How do you handle false positives in CSPM?"

**A:** "False positive management is a critical part of the role. My process:

1. **Investigate the Finding:** Verify whether the flagged configuration is truly insecure in the context of the environment. Example: A CNAPP flags a public S3 bucket, but it's intentionally hosting a static website — this is a false positive.

2. **Document the Exception:** I create a formal risk-acceptance record that includes:
   - The specific finding ID and description.
   - Business justification for the exception.
   - Compensating controls in place (e.g., CloudFront with OAI restricts direct bucket access).
   - Risk owner sign-off and review date.

3. **Suppress in the Tool:** I apply a scoped suppression rule in the CNAPP — limited to that specific asset and that specific check. I never apply broad suppressions.

4. **Periodic Review:** All exceptions are reviewed quarterly to validate they're still warranted. Business context changes — what was acceptable 6 months ago might not be today."

---

## 🔄 4. Vulnerability Management Lifecycle

### Q: "Describe your end-to-end vulnerability management lifecycle."

**A:** "I follow a structured 6-phase lifecycle:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. DISCOVER  │───▶│  2. ASSESS   │───▶│ 3. PRIORITIZE│
│  Scan assets  │    │  Validate    │    │  Risk-rank   │
│  and configs  │    │  findings    │    │  with context │
└──────────────┘    └──────────────┘    └──────────────┘
        ▲                                       │
        │                                       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  6. REPORT   │◀───│  5. VERIFY   │◀───│ 4. REMEDIATE │
│  Metrics &   │    │  Re-scan &   │    │  Patch/Fix   │
│  dashboards  │    │  validate    │    │  or mitigate │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Phase Details:**

1. **Discover:** CNAPP (Orca/Wiz) scans all cloud assets — VMs, containers, serverless, IaC templates. Native tools (AWS Inspector, Azure Defender, GCP SCC) provide supplementary scanning.

2. **Assess:** Validate that findings are real. Check CVE applicability (is the vulnerable library actually loaded at runtime? Is the vulnerable port actually exposed?). This is where the CNAPP's context-aware risk scoring is invaluable.

3. **Prioritize:** I use a risk-based approach, not just CVSS alone. Factors:
   - **Exploitability:** Is there a public exploit (check KEV catalog)?
   - **Exposure:** Is the asset internet-facing?
   - **Data Sensitivity:** Does it process PII or financial data?
   - **Blast Radius:** Can an attacker pivot laterally from here?

4. **Remediate:** Work with app owners to patch, upgrade, or apply compensating controls. I define clear SLAs:
   - **Critical (CVSS 9.0+ & exploitable):** 24–48 hours
   - **High:** 7 days
   - **Medium:** 30 days
   - **Low:** 90 days

5. **Verify:** Re-scan to confirm the fix is effective. Close the ticket only after verification.

6. **Report:** Executive dashboards showing MTTR (Mean Time to Remediate), open vulnerability count by severity, SLA compliance rates, and trend analysis."

### Q: "How do you shape remediation SLAs and build-breaking policies?"

**A:** "SLAs must be realistic, measurable, and enforceable. My approach:

- **Tiered SLAs:** Based on risk rating (not just CVSS). A Critical CVE on a public-facing prod system gets a tighter SLA than the same CVE on an air-gapped dev box.
- **Build-Breaking Policies:** In CI/CD pipelines, I integrate CNAPP/SAST/SCA scans that **fail the build** if Critical or High vulnerabilities are detected in the artifact. This is the strongest shift-left enforcement.
- **Exception Process:** Teams can request a time-limited exception with business justification + compensating controls. These are tracked and auto-expire.
- **Escalation:** If an SLA is breached, the ticket auto-escalates to the team lead → director → CISO. Repeated SLA breaches trigger a process review with the team."

---

## 🔐 5. Identity & Access Management (IAM)

### Q: "How do you secure IAM across multi-cloud?"

**A:**

| Principle | AWS | Azure | GCP |
|---|---|---|---|
| **Least Privilege** | IAM Access Analyzer, unused permissions removal | Azure AD PIM (Just-in-Time) | IAM Recommender |
| **MFA Enforcement** | IAM Policy conditions, SCP denying no-MFA | Conditional Access Policies | Context-Aware Access |
| **Service Account Control** | Rotate access keys, prefer IAM Roles | Managed Identities (no creds) | Service Account key rotation |
| **Cross-Account** | AWS Organizations + SCPs, AssumeRole | Azure Lighthouse, RBAC | GCP Resource Manager, IAM bindings |
| **Monitoring** | CloudTrail + GuardDuty IAM findings | Azure AD Sign-in Logs, Sentinel | Cloud Audit Logs + SCC |
| **CIEM** | CNAPP identifies over-permissioned roles | Entra Permissions Management | CNAPP native CIEM |

### Q: "How would you detect and respond to compromised credentials in the cloud?"

**A:** "Detection signals include:
- **Impossible travel:** Login from India, then API calls from Eastern Europe within minutes.
- **Anomalous API calls:** A developer IAM user suddenly calling `ec2:RunInstances` or `iam:CreateUser`.
- **Programmatic access from new IP:** Access key used from an IP not in the corporate CIDR.

**Response:**
1. **Disable the credential immediately** — deactivate access keys, revoke active sessions.
2. **Quarantine the principal** — attach Deny-All IAM policy.
3. **Investigate scope** — CloudTrail audit for all actions performed with the compromised credential. Check for persistence mechanisms (new IAM users, roles, Lambda functions, backdoor keys).
4. **Remediate** — rotate all credentials, review and tighten permissions, patch the initial vector (phished creds? leaked in code repo?).
5. **Post-incident review** — update detection rules and share findings with the SOC/CTI team."

---

## 🗃️ 6. Data & Workload Security

### Q: "How do you protect 'the crown jewels' — sensitive data in the cloud?"

**A:** "A layered defense approach:

1. **Discovery & Classification:** Use CNAPP's data discovery module (or native tools like AWS Macie, Azure Purview, GCP DLP API) to scan for sensitive data — PII, PHI, financial records, secrets, keys.

2. **Encryption:**
   - **At Rest:** Enforce KMS-managed encryption on all storage (S3, EBS, RDS, Azure Blob, GCS buckets). Use customer-managed keys (CMK) for sensitive workloads.
   - **In Transit:** TLS 1.2+ everywhere. Enforce HTTPS-only policies on storage services.

3. **Access Controls:** S3 bucket policies, Azure RBAC on storage, GCS IAM — all following least privilege. Block public access at the account/subscription/organization level.

4. **DLP (Data Loss Prevention):** Inspect egress traffic for sensitive data patterns. Integrate DLP policies with email gateways, SaaS tools, and cloud storage.

5. **Monitoring:** Alert on unauthorized access patterns, abnormal data download volumes, or access from unusual locations.

### Q: "How do you secure containerized workloads?"

**A:** "Full lifecycle protection:

- **Build Time:** Scan container images in CI/CD for OS and library vulnerabilities. Block images with Critical CVEs from being pushed to the registry.
- **Registry:** Periodic scanning of all images in ECR/ACR/GCR. Remove stale and vulnerable images.
- **Admission Control:** Kubernetes Admission Controllers (OPA/Gatekeeper or CNAPP-native) enforce policies — no `privileged: true`, no root containers, required resource limits, approved registries only.
- **Runtime:** CWPP monitors for drift (new processes not in the original image), cryptominers, reverse shells, and anomalous network connections.
- **Network:** Kubernetes Network Policies and service mesh (Istio) to enforce micro-segmentation between pods/namespaces."

---

## 🚨 7. Zero-Day & Incident Response

### Q: "A zero-day vulnerability (like Log4Shell) is disclosed. Walk me through your response."

**A:** "Zero-day response is time-critical. My playbook:

**Hour 0–2 (Assessment):**
- Get the CVE details, affected versions, and exploitation vector.
- Use the CNAPP to immediately query: 'Which of our assets have the vulnerable library installed?' — Orca/Wiz can answer this in minutes because they've already indexed all installed packages.
- Generate a blast-radius report: How many assets? Which environments (prod/staging/dev)? Internet-facing?

**Hour 2–8 (Containment & Prioritization):**
- For directly exploitable internet-facing systems: Apply WAF rules (virtual patching) to block known exploit signatures.
- Notify asset owners through automated Jira tickets with severity, impact, and remediation steps.
- If a patch exists: Prioritize patching internet-facing prod systems. If no patch: Apply compensating controls (network segmentation, disable the vulnerable feature, WAF rules).

**Hour 8–48 (Remediation):**
- Track patching progress against the Critical SLA (24–48 hours for Critical).
- Coordinate with the SOC/CTI team: Are we seeing active exploitation attempts? Update detection rules in SIEM.

**Post-Event (After 48 Hours):**
- Re-scan all assets to verify remediation completeness.
- Conduct a lessons-learned review: How fast did we detect? What was our MTTR? How can we improve?
- Update runbooks and IR playbooks with this scenario."

### Q: "How do you differentiate between a true zero-day and a hyped vulnerability?"

**A:** "I evaluate:
1. **CISA KEV (Known Exploited Vulnerabilities) Catalog:** Is it listed? If yes, it's actively exploited.
2. **EPSS Score (Exploit Prediction Scoring System):** High EPSS = high probability of exploitation in the wild.
3. **Attack Complexity:** Is exploitation trivial (like Log4Shell's `${jndi:ldap://...}`) or does it require local access, user interaction, or specific configurations?
4. **Our Exposure:** Even a critical CVE is low-risk if none of our assets are affected. The CNAPP answers this instantly.
5. **Vendor Advisory:** What does the vendor say? Is there a patch or workaround?

I communicate this risk assessment clearly to leadership — not every 'Critical' CVE warrants a 2 AM war room."

---

## 🔗 8. SIEM Integration & Automation

### Q: "How do you integrate a CNAPP with SIEM and ticketing tools?"

**A:** "Integration architecture:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  CNAPP       │─────▶│   SIEM       │─────▶│   SOAR       │
│ (Orca/Wiz)  │ API  │ (Splunk/    │ Auto │ (Automated   │
│              │ Push │  Sentinel)  │ Play │  Response)   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                          │
       │              ┌─────────────┐             │
       └─────────────▶│  Ticketing   │◀────────────┘
               API    │ (Jira/SNOW) │  Auto-Create
                      └─────────────┘
```

**SIEM Integration (Splunk/Sentinel):**
- CNAPP findings are pushed via API/webhook to SIEM.
- I create custom correlation rules — e.g., if a CNAPP alert for 'public-facing asset with critical CVE' correlates with a GuardDuty alert for 'anomalous API call' on the same asset → escalate to P1.
- Dashboards in SIEM show unified cloud security posture.

**Ticketing (Jira/ServiceNow):**
- Critical and High findings auto-create tickets with:
  - Affected asset, finding description, remediation steps.
  - SLA timer based on severity.
  - Auto-assignment to the responsible team/owner (based on asset tagging).
- Bi-directional sync: When a ticket is resolved, the CNAPP finding is re-verified and auto-closed if remediated.

**Automation Examples:**
- **Auto-Remediation:** If a Security Group is opened to `0.0.0.0/0`, a Lambda function automatically reverts it and notifies the owner.
- **Alert Enrichment:** SOAR playbook enriches CNAPP alerts with threat intel (VirusTotal, Shodan) before creating the ticket."

---

## 📜 9. Compliance & Governance Frameworks

### Q: "How do you monitor and ensure compliance with NIST, ISO 27001, and CIS Benchmarks?"

**A:**

| Framework | What It Covers | How I Use It |
|---|---|---|
| **CIS Benchmarks** | Specific technical checks per cloud provider | Primary CSPM baseline — mapped as policies in the CNAPP. Every failing check = a finding with remediation guidance. |
| **NIST CSF** | Identify → Protect → Detect → Respond → Recover | Organizational framework — I map our cloud security program to these functions and report coverage. |
| **NIST 800-53** | Detailed security controls | Map CNAPP findings to specific 800-53 controls (e.g., AC-2 for IAM, SC-28 for encryption). |
| **ISO 27001** | Information Security Management System (ISMS) | Ensure cloud controls satisfy Annex A requirements. CNAPP compliance reports feed directly into audit evidence. |

**Process:**
1. Map the compliance framework's controls to specific cloud configurations.
2. Load or customize the compliance framework in the CNAPP.
3. Run continuous compliance assessments — not just point-in-time audits.
4. Generate compliance reports for auditors showing pass/fail status, evidence, and remediation plans for gaps.
5. Track compliance score trends over time — the goal is continuous improvement."

### Q: "How do you enforce governance across multiple cloud accounts/subscriptions?"

**A:**
- **AWS:** Organizations + SCPs to enforce guardrails (e.g., deny deletion of CloudTrail, require encryption, restrict regions).
- **Azure:** Management Groups + Azure Policies (deny non-compliant resources, auto-remediate configs).
- **GCP:** Organization Policies (restrict resource locations, enforce uniform bucket-level access).
- **Cross-Cloud:** CNAPP provides a unified governance view across all three clouds with consistent policy enforcement."

---

## 🤝 10. Stakeholder Collaboration & Communication

### Q: "How do you translate complex security findings for non-security teams?"

**A:** "This is one of the most important skills. My approach:

1. **Lead with business impact, not CVE numbers:** Instead of 'CVE-2024-XXXX with CVSS 9.8 found on asset X,' I say: 'Your production database server is running an outdated version of OpenSSL. An attacker on the internet could exploit this to decrypt sensitive customer data. Here's exactly how to fix it.'

2. **Provide actionable remediation:** Don't just say 'patch it.' Provide the exact command, configuration change, or Terraform update needed. Include before/after examples.

3. **Risk-ranked reports:** App owners see only findings relevant to their assets, sorted by priority. They don't need to sift through 500 findings — they see their top 10.

4. **Office Hours:** I hold weekly 'Security Office Hours' where teams can bring questions, discuss findings, and get help with remediation. This builds trust and reduces the adversarial perception of security."

### Q: "How do you collaborate with the SOC and CTI teams?"

**A:**
- **SOC:** I ensure CNAPP findings feed into the SOC's SIEM. I validate whether cloud-specific alerts (GuardDuty, CNAPP) correlate with SOC detections. I help SOC analysts understand cloud context.
- **CTI (Cyber Threat Intelligence):** When a new threat campaign targets cloud infrastructure (e.g., SCARLETEEL targeting AWS credentials via compromised containers), I work with CTI to validate exposure, update detection rules, and hunt for IOCs in our environment.
- **Offensive Security (Red Team):** I review red team findings to understand attack paths and validate that our CNAPP detects the simulated attacks. This feeds back into improving our detection coverage."

---

## 🤖 11. Scripting & Automation

### Q: "Give examples of how you've used scripting to automate cloud security."

**A:** "Python and Bash are my primary tools:

**Example 1 — Automated Compliance Daily Report (Python + Boto3):**
```python
import boto3
import json
from datetime import datetime

def generate_compliance_report():
    securityhub = boto3.client('securityhub')
    findings = securityhub.get_findings(
        Filters={
            'ComplianceStatus': [{'Value': 'FAILED', 'Comparison': 'EQUALS'}],
            'SeverityLabel': [{'Value': 'CRITICAL', 'Comparison': 'EQUALS'},
                             {'Value': 'HIGH', 'Comparison': 'EQUALS'}]
        }
    )
    # Parse, format, and send daily email/Slack report
    report = {
        'date': datetime.now().isoformat(),
        'total_critical': len([f for f in findings['Findings'] if f['Severity']['Label'] == 'CRITICAL']),
        'total_high': len([f for f in findings['Findings'] if f['Severity']['Label'] == 'HIGH']),
        'findings': findings['Findings']
    }
    return report
```

**Example 2 — Auto-Remediate Public S3 Buckets (Python + Lambda):**
```python
import boto3

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    bucket_name = event['detail']['requestParameters']['bucketName']
    
    # Block public access
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    # Notify via SNS
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789:SecurityAlerts',
        Message=f'Public access blocked on bucket: {bucket_name}'
    )
```

**Example 3 — PowerShell Azure NSG Audit:**
```powershell
# Audit all NSGs for rules allowing inbound from Any source
$nsgs = Get-AzNetworkSecurityGroup
foreach ($nsg in $nsgs) {
    $riskyRules = $nsg.SecurityRules | Where-Object {
        $_.Direction -eq "Inbound" -and
        $_.SourceAddressPrefix -eq "*" -and
        $_.Access -eq "Allow"
    }
    if ($riskyRules) {
        Write-Output "⚠️ NSG '$($nsg.Name)' has open inbound rules:"
        $riskyRules | ForEach-Object { Write-Output "  - $($_.Name): Port $($_.DestinationPortRange)" }
    }
}
```"

---

## 🏗️ 12. IaC Security Scanning

### Q: "How do you integrate IaC security scanning into the DevSecOps pipeline?"

**A:** "IaC scanning is a key shift-left strategy:

**Tools:**
- **Checkov** (open-source by Bridgecrew/Prisma): Scans Terraform, CloudFormation, Kubernetes manifests, Dockerfile.
- **tfsec** / **Trivy config**: Terraform-specific scanning.
- **KICS**: Multi-framework scanner (Terraform, ARM, Ansible, Kubernetes).
- **CNAPP-native IaC scanning**: Orca, Wiz, Prisma all support IaC scanning integrated into CI/CD.

**Pipeline Integration:**
```
Developer → Git Push → CI Pipeline → IaC Scan → Policy Gate → Deploy
                                         │
                                    ┌────┴────┐
                                    │ PASS     │ FAIL
                                    │ Deploy   │ Block + Notify
                                    └─────────┘
```

**What we scan for:**
- Hardcoded secrets in Terraform variables.
- Security groups/firewall rules with `0.0.0.0/0` ingress.
- Unencrypted storage resources.
- Overly permissive IAM policy documents.
- Missing logging/monitoring configurations.
- Non-compliant resource configurations per CIS Benchmarks.

**Policy as Code:**
I write custom Checkov/OPA policies for organization-specific requirements that go beyond CIS baselines. Example: 'All S3 buckets must have a specific tag `data-classification`.' This ensures governance alignment from day one."

---

## ❓ 13. Scenario-Based Interview Questions

### Q: "Your CNAPP shows 5,000 findings across multiple cloud accounts. How do you prioritize?"

**A:** "5,000 findings is normal for a large environment. I do NOT try to fix all 5,000. My prioritization framework:

1. **Internet-facing assets with Critical/High CVEs and active exploits:** These are tier-1 and get immediate remediation within the Critical SLA.
2. **Crown jewels exposure:** Any finding related to databases, data stores, or secrets management — regardless of severity — gets elevated attention.
3. **Attack path analysis:** Use the CNAPP's attack path feature. A Medium-severity misconfiguration that enables a path from internet → compute → IAM → data store is more dangerous than an isolated Critical finding.
4. **Compliance-mandated controls:** Anything that would cause an audit failure.
5. **Everything else:** Batched into regular sprint work.

I also segment by responsibility — route findings to the right team (DevOps for infra configs, App teams for code vulnerabilities, Platform for IAM)."

### Q: "A developer pushes back saying a security finding is a false positive. How do you handle it?"

**A:** "I take it seriously — developers often have context that the scanner doesn't.

1. **Verify the finding technically:** Is the flagged library actually used at runtime? Is the flagged config compensated by another control?
2. **If it's a genuine false positive:** Suppress it in the scanning tool with a documented exception. Provide the developer with feedback and potentially tune the scanner to avoid this class of FP.
3. **If it's NOT a false positive:** Show the developer the impact — ideally through an attack-path visualization or a proof-of-concept exploitation. Help them understand the 'why.'
4. **If it's valid but low-risk:** Propose a risk-acceptance route with the security risk manager's sign-off and a review date.

The goal is to be a trusted advisor, not a blocker."

### Q: "You receive a critical alert from Orca at 2 AM — a production EC2 instance has a Critical RCE vulnerability and is publicly exposed. What do you do?"

**A:**
1. **Confirm the finding:** Is the instance truly internet-facing (check SG, NACL, public IP)? Is the vulnerable service actually running (check port/process)?
2. **Immediate containment:** If confirmed, restrict the Security Group to allow only known IPs. If a patch is available, coordinate an emergency patch. If not, consider taking the service offline or adding a WAF rule.
3. **Check for compromise:** Review CloudTrail, VPC Flow Logs, and the CNAPP for any indicators of exploitation — anomalous outbound connections, new IAM credentials, cryptomining processes.
4. **Notify stakeholders:** Alert the SOC, the asset owner, and the on-call incident manager.
5. **Document everything:** Time of detection, actions taken, people involved, and outcome."

---

## 🗣️ 14. Behavioral & Soft-Skills Questions

### Q: "Tell me about a time you improved a cloud security process."

**A:** "In a previous role, our vulnerability SLA compliance was around 60% because teams received generic vulnerability reports and didn't know how to prioritize. I revamped the process:
- Built custom CNAPP dashboards per team, showing only their assets' findings ranked by exploitability and exposure.
- Automated Jira ticket creation from CNAPP with step-by-step remediation.
- Established weekly 'security syncs' with top offending teams.
- Result: SLA compliance improved from 60% to 92% in 3 months."

### Q: "Describe a time-sensitive escalation you handled."

**A:** "During the Log4Shell disclosure, I was called into a war room at midnight. Within 2 hours, I had used our CNAPP to identify all 47 instances running affected Log4j versions across 3 cloud accounts. I prioritized the 12 internet-facing production instances, coordinated with DevOps to deploy patches on those within 6 hours, and deployed WAF rules as an interim control for the remaining instances. I provided hourly updates to leadership with a clear dashboard showing remediation progress."

### Q: "How do you handle a situation where a risk is accepted but you disagree?"

**A:** "I document my technical risk assessment clearly — the potential impact, likelihood, and recommended mitigations. I present it to the risk owner and the CISO with data, not opinions. If the decision is to accept the risk, I ensure it's formally documented with:
- The risk owner's name and sign-off.
- A review date (typically 90 days).
- Compensating controls (if any).
- A clear statement of what could happen if the risk materializes.

Ultimately, it's a business decision, and my job is to ensure the decision-makers have complete and accurate information."

---

## 📅 15. 30-60-90 Day Plan for EY

### Q: "What's your plan for your first 90 days?"

**A:**

**Days 1–30 (Learn & Assess):**
- Understand EY's cloud footprint across AWS, Azure, and GCP.
- Get access to the CNAPP console (Orca or equivalent) and audit current configurations, suppressed findings, and policy coverage.
- Meet with key stakeholders — SOC, CTI, Cloud Engineering, Compliance, App Owners.
- Review existing remediation SLAs, compliance reports, and incident response playbooks.
- Identify the top 10 recurring findings and understand why they persist.

**Days 31–60 (Optimize & Integrate):**
- Tune CNAPP policies to reduce false positives and improve signal-to-noise ratio.
- Establish or refine integrations with SIEM (Splunk/Sentinel) and ticketing (Jira/ServiceNow).
- Implement automated remediation workflows for low-complexity, high-frequency findings (e.g., auto-block public S3, auto-enforce encryption).
- Build risk-ranked dashboards for leadership and team-specific views for app owners.
- Review and improve remediation SLAs based on the EY context.

**Days 61–90 (Automate & Scale):**
- Implement IaC scanning in CI/CD pipelines to shift security left.
- Develop custom CNAPP policies for EY-specific compliance requirements.
- Build automated compliance reporting for NIST/ISO 27001/CIS.
- Establish a regular cadence of security reviews, threat model sessions, and vulnerability trending reports.
- Document all processes and create runbooks for the team.
- Present a 'State of Cloud Security' report to leadership with metrics, trends, and a roadmap.

---

## 📌 Quick-Reference Cheat Sheet

| Topic | Key Points to Remember |
|---|---|
| **CNAPP** | Orca/Wiz/Prisma. Unifies CSPM + CWPP + CIEM + IaC scanning. Agentless = fast coverage. |
| **CSPM** | CIS Benchmarks, continuous monitoring, risk-ranked findings, preventive guardrails (SCPs, Azure Policies). |
| **Vuln Mgmt** | Discover → Assess → Prioritize → Remediate → Verify → Report. Risk-based, not CVSS-only. |
| **IAM** | Least privilege, MFA, CIEM, credential rotation, anomaly detection. |
| **Zero-Day** | CNAPP query → blast radius → WAF/virtual patching → patch → verify → lessons learned. |
| **SIEM** | CNAPP → SIEM (Splunk/Sentinel) → SOAR → Ticketing. Correlation rules for unified detection. |
| **Compliance** | NIST CSF, NIST 800-53, ISO 27001, CIS. Continuous assessment, mapped controls, audit evidence. |
| **Automation** | Python/Bash/PowerShell. Auto-remediate, auto-ticket, auto-report. Lambda/Azure Functions for serverless automation. |
| **IaC** | Checkov, tfsec, KICS. Scan in CI/CD. Policy-as-code. Fail builds on Critical findings. |
| **Communication** | Business impact first, actionable remediation, risk-ranked per team, security office hours. |

---

> 💡 **Tip:** For the EY interview, emphasize your experience with **CNAPP tools**, **multi-cloud environments**, **stakeholder collaboration**, and **automation**. EY values consultants who can communicate risk clearly and drive remediation at scale.
