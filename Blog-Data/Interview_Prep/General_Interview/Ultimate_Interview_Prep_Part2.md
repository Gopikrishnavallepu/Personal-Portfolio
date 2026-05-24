# 🎯 ULTIMATE CLOUD SECURITY INTERVIEW PREPARATION GUIDE
## Part 2 — CIS/NIST Compliance Mastery, Interview Q&A, Automation Playbooks & Role Readiness

> **Gopikrishna Vallepu** | Application Security / Cloud Security Engineer
> Tailored for: EY India — CNAPP, CWPP, CSPM, Vulnerability Management, Multi-Cloud Security

---

# SECTION 5: TRUE POSITIVE vs FALSE POSITIVE — THE DECISION FRAMEWORK

> This is the #1 skill interviewers test. You MUST be able to articulate how you decide.

## 5.1 The TP/FP Decision Tree

```
DETECTION RECEIVED
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: CONTEXT CHECK                                         │
│                                                                │
│ • Which workload type? (web server, CI/CD, batch job, DB)     │
│ • Which environment? (production, staging, dev)               │
│ • What time? (business hours vs 3 AM)                         │
│ • Who deployed it? (known team vs unknown)                    │
│ • Is there a change window active?                            │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: PROCESS TREE ANALYSIS                                  │
│                                                                │
│ Web server → bash → curl               = 🔴 SUSPICIOUS (TP)   │
│ CI/CD runner → bash → npm install       = 🟢 EXPECTED (FP)     │
│ Cron → bash → python → report.py       = 🟢 EXPECTED (FP)     │
│ Java → /bin/sh → /tmp/exploit           = 🔴 SUSPICIOUS (TP)   │
│ Init container → curl → health check   = 🟡 CHECK FURTHER      │
│ Python → bash → id; whoami; uname -a   = 🔴 RECON (TP)         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: CORRELATION CHECK                                      │
│                                                                │
│ • Are there OTHER detections for this asset? (multi-signal)   │
│ • Is there a related CSPM finding? (misconfiguration enabling) │
│ • Does CIEM show unusual identity usage?                      │
│ • Does CloudTrail show anomalous API calls?                   │
│                                                                │
│ SINGLE signal = investigate cautiously                        │
│ MULTIPLE correlated signals = almost certainly TP → RESPOND   │
└────────────────────────────┬─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼──────┐
        │  TRUE      │ │  FALSE    │ │  UNCERTAIN │
        │  POSITIVE  │ │  POSITIVE │ │            │
        │            │ │           │ │  Treat as  │
        │  → Respond │ │ → Suppress│ │  TP until  │
        │  → Contain │ │ → Document│ │  proven    │
        │  → Report  │ │ → Expiry  │ │  otherwise │
        │            │ │ → Review  │ │            │
        └────────────┘ └───────────┘ └────────────┘
```

## 5.2 Suppression Rules — The Safe Way

| Requirement | Detail | Why It Matters |
|------------|--------|----------------|
| **Justification** | Written reason why this is an FP | Auditable trail |
| **Scope** | As narrow as possible (specific image, namespace, label) | Prevents blind spots |
| **Expiry** | Maximum 90 days, auto-review | Business context changes |
| **Reviewer** | Named individual responsible for periodic review | Accountability |
| **Quarterly Review** | All suppressions reviewed every 90 days | Prevents suppression debt |

**Interview Answer:**
> "I never suppress without documentation. Every suppression has 4 components: justification, narrow scope, 90-day expiry, and an assigned reviewer. I run a quarterly suppression review where we validate that all existing suppressions are still warranted. The alternative — permanent, undocumented suppressions — creates exactly the blind spots attackers exploit."

## 5.3 Risk Acceptance Process

```
RISK ACCEPTANCE WORKFLOW:

1. Security team identifies a finding that cannot be remediated
   (legitimate business reason or technical constraint)

2. Security engineer documents:
   ├── Finding ID and description
   ├── Affected resources and blast radius
   ├── Business justification for acceptance
   ├── Compensating controls already in place
   ├── What happens if the risk materializes (business impact)
   └── Recommended additional compensating controls

3. Risk acceptance form submitted to:
   ├── LOW/MEDIUM risk → Team lead approval
   ├── HIGH risk → Director + CISO awareness
   └── CRITICAL risk → VP/CISO sign-off required

4. Acceptance formally recorded in risk register with:
   ├── Maximum duration: 90 days
   ├── Mandatory quarterly re-review
   ├── Compensating controls are the CONDITIONS of acceptance
   └── If compensating controls change → acceptance VOID

5. Tracking:
   ├── Risk register dashboard tracks all active acceptances
   ├── 30-day reminder to review compensating controls
   ├── Auto-expiry at 90 days → forces re-evaluation
   └── Governance report: total accepted risks by severity and age
```

---

# SECTION 6: CIS & NIST COMPLIANCE DEEP DIVE

## 6.1 CIS Benchmarks — What They Are and How to Use Them

```
CIS BENCHMARK STRUCTURE:

CIS AWS Foundations Benchmark v3.0
│
├── 1: Identity and Access Management (25 controls)
│   ├── 1.1: Maintain current contact details ─────── MANUAL
│   ├── 1.4: Ensure no root account access key ────── AUTOMATED via CSPM
│   ├── 1.5: Ensure MFA on root account ───────────── AUTOMATED via CSPM
│   ├── 1.10: Ensure MFA on all IAM users ─────────── AUTOMATED via CSPM
│   ├── 1.14: Ensure credentials unused 90d disabled── AUTOMATED via CSPM
│   └── 1.16: Ensure IAM policies used only via groups ─ AUTOMATED
│
├── 2: Storage (10 controls)
│   ├── 2.1.1: Ensure S3 Block Public Access ──────── AUTOMATED
│   ├── 2.1.2: Ensure MFA Delete on S3 ───────────── AUTOMATED
│   ├── 2.2.1: Ensure EBS encryption ─────────────── AUTOMATED
│   └── 2.3.1: Ensure RDS encryption ─────────────── AUTOMATED
│
├── 3: Logging (12 controls)
│   ├── 3.1: Ensure CloudTrail enabled all regions ── AUTOMATED
│   ├── 3.3: Ensure CloudTrail log validation ─────── AUTOMATED
│   ├── 3.7: Ensure VPC Flow Logging enabled ─────── AUTOMATED
│   └── 3.9: Ensure Config is enabled ────────────── AUTOMATED
│
├── 4: Monitoring (16 controls)
│   ├── 4.3: Ensure alarm for root usage ──────────── AUTOMATED
│   ├── 4.4: Ensure alarm for IAM policy changes ──── AUTOMATED
│   ├── 4.12: Ensure alarm for network gateway chgs── AUTOMATED
│   └── 4.15: Ensure alarm for AWS Config changes ── AUTOMATED
│
└── 5: Networking (6 controls)
    ├── 5.1: Ensure no SG allows 0.0.0.0/0 to 22 ─── AUTOMATED
    ├── 5.2: Ensure no SG allows 0.0.0.0/0 to 3389 ─ AUTOMATED
    ├── 5.3: Ensure VPC default SG restricts all ──── AUTOMATED
    └── 5.6: Ensure EC2 Metadata Service v2 ─────── AUTOMATED
```

### CIS EKS Benchmark — Key K8s Security Controls

| CIS EKS # | Control | What to Check | How to Fix |
|-----------|---------|--------------|------------|
| 3.2.1 | Kubelet anonymous auth disabled | `--anonymous-auth=false` | Managed node group config |
| 3.2.6 | Kubelet protect kernel defaults | `--protect-kernel-defaults=true` | Node bootstrap |
| 4.1.1 | RBAC enabled for cluster | `--authorization-mode=RBAC,Webhook` | EKS default |
| 4.2.1 | Minimize wildcard RBAC | No `*` in Role resources/verbs | kubectl get clusterroles -o yaml | grep "*" |
| 5.1.1 | Restrict image registries | KAC or OPA policy per namespace | KAC image assessment policy |
| 5.2.1 | Minimize privileged containers | `privileged: false` enforced | KAC + PSA |
| 5.2.2 | Minimize host PID sharing | `hostPID: false` | KAC |
| 5.2.3 | Minimize host network | `hostNetwork: false` | KAC |
| 5.2.9 | Minimize root containers | `runAsNonRoot: true` | SecurityContext + KAC |
| 5.3.2 | Ensure all namespaces have NetworkPolicies | At least 1 per namespace | Default deny apply |
| 5.4.1 | Prefer using secrets as volumes | Volumes over env vars | Pod spec review |
| 5.7.2 | Ensure seccomp profile | `RuntimeDefault` or custom | SecurityContext |

### Interview Answer — CIS:
> "I use CIS benchmarks as the primary baseline for CSPM policies. Each CIS control maps to a specific CSPM check in the platform. I load the appropriate CIS benchmark profile — AWS Foundations, EKS, Azure, or GCP — and run continuous assessments. Failing controls create IOMs with remediation steps. For audits, I export the compliance report showing pass/fail per control with evidence. The key metric I track is the percentage of 'automated' CIS controls that pass continuously — that tells me our configuration management maturity."

## 6.2 NIST Cybersecurity Framework (CSF) — Mapped to Your Role

```
NIST CSF 2.0 FUNCTIONS:

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐
│  GOVERN      │  │  IDENTIFY    │  │  PROTECT     │  │  DETECT      │  │  RESPOND     │  │ RECOVER  │
│              │  │              │  │              │  │              │  │              │  │          │
│ Policies     │  │ Asset        │  │ Access       │  │ Continuous   │  │ Analysis &   │  │ Recovery │
│ Risk mgmt    │→ │ inventory    │→ │ controls     │→ │ monitoring   │→ │ Containment  │→ │ Restore  │
│ Strategy     │  │ Risk assess  │  │ Encryption   │  │ Alerting     │  │ Mitigation   │  │ Improve  │
│ Oversight    │  │ Supply chain │  │ Awareness    │  │ Analysis     │  │ Reporting    │  │ Lessons  │
│              │  │              │  │ Security     │  │              │  │              │  │          │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘
       │                │                │                │                │                │
       ▼                ▼                ▼                ▼                ▼                ▼
YOUR ROLE MAPPING:
       │                │                │                │                │                │
 SLA policies    CSPM scanning     KAC policies      CWPP runtime     IR lifecycle     Post-incident
 Risk accept     Asset inventory   SCPs/Policies     IOA detection    Containment      Recovery plan
 Compliance      CIEM analysis     Encryption enf.   IOM monitoring   Investigation    Lessons learned
 Governance      Vuln assessment   Build-breaking    Alert tuning     Eradication      Control updates
```

### NIST 800-53 — Key Controls for Cloud Security

| Control Family | Control ID | Control Name | How You Implement It |
|---------------|-----------|-------------|---------------------|
| **AC (Access Control)** | AC-2 | Account Management | CIEM — identify dormant accounts, enforce JML process |
| | AC-3 | Access Enforcement | IAM least privilege, RBAC, SCPs, Azure Policies |
| | AC-6 | Least Privilege | CIEM effective permissions analysis, quarterly access review |
| | AC-17 | Remote Access | VPN/SSO required, no direct SSH to production |
| **AU (Audit)** | AU-2 | Audit Events | CloudTrail all regions, K8s audit logs, VPC Flow Logs |
| | AU-3 | Content of Audit Records | Ensure logs contain who, what, when, where, outcome |
| | AU-6 | Audit Review | SIEM correlation, weekly log review, automated alerting |
| | AU-12 | Audit Generation | Enable all audit sources, forward to central SIEM |
| **CA (Assessment)** | CA-7 | Continuous Monitoring | CSPM continuous scanning, CWPP runtime monitoring |
| | CA-8 | Penetration Testing | Annual pen test, red team exercises, purple team |
| **CM (Config Mgmt)** | CM-2 | Baseline Configuration | CIS benchmarks loaded as CSPM policies |
| | CM-6 | Configuration Settings | CSPM IOMs detect deviations from baseline |
| | CM-8 | Information System Component Inventory | Asset inventory via CSPM + cloud provider APIs |
| **IR (Incident Response)** | IR-4 | Incident Handling | 6-phase IR lifecycle (Section 3.4 of Part 1) |
| | IR-5 | Incident Monitoring | CWPP detections, SIEM alerts, dashboard monitoring |
| | IR-6 | Incident Reporting | Post-incident reports, regulatory notifications |
| **RA (Risk Assessment)** | RA-3 | Risk Assessment | Cloud Risks attack path analysis, CIEM blast radius |
| | RA-5 | Vulnerability Monitoring | CWPP + image assessment + agentless scanning |
| **SC (System & Comms)** | SC-7 | Boundary Protection | SGs, NACLs, NetworkPolicies, WAF |
| | SC-8 | Transmission Confidentiality | TLS 1.2+ enforced, HTTPS-only |
| | SC-28 | Protection of Information at Rest | KMS encryption on all storage |
| **SI (System Integrity)** | SI-2 | Flaw Remediation | Vulnerability management lifecycle with SLAs |
| | SI-3 | Malicious Code Protection | CWPP malware detection, image scanning |
| | SI-4 | Information System Monitoring | CWPP + CSPM + CIEM continuous monitoring |

### Interview Answer — NIST:
> "I map our cloud security program to NIST CSF functions. Under IDENTIFY, CSPM provides the asset inventory and risk assessment. Under PROTECT, KAC and SCPs enforce access controls. Under DETECT, CWPP provides continuous runtime monitoring with IOAs. Under RESPOND, we execute the IR lifecycle from containment to eradication. Under RECOVER, we restore from clean images and conduct lessons learned. For compliance reporting, I map each Falcon detection and CSPM finding to the specific NIST 800-53 control it satisfies — this creates the audit evidence chain that satisfies both internal governance and external auditors."

## 6.3 Compliance Workflow in the Falcon Console

```
COMPLIANCE AUDIT PREPARATION:

1. GO TO: Posture and Compliance → Compliance
2. SELECT: the applicable framework (CIS AWS, NIST 800-53, SOC 2, HIPAA, PCI DSS)
3. VIEW: Pass/Fail status per control category
4. DRILL DOWN: Into failing controls → see affected resources → remediation steps
5. EXPORT: Compliance report in PDF for auditors

WHAT AUDITORS TYPICALLY ASK:

| Auditor Question                          | Where to Get Evidence                    |
|------------------------------------------|------------------------------------------|
| "Show vulnerability scan results"         | Vulnerabilities → Image Assessments      |
| "Show compliance posture over time"       | Posture → Compliance → trend chart       |
| "Show your IR process"                    | IR runbook doc + Falcon Fusion workflow  |
| "Show access control reviews"             | CIEM → effective permissions report      |
| "Show detection coverage"                 | Host Management → sensor coverage %      |
| "Show remediation SLA compliance"         | CSPM findings → filter by SLA status     |
| "Show data encryption enforcement"        | CSPM → filter by SC-28 controls          |
| "Show logging is enabled everywhere"      | CSPM → filter by AU-2/AU-12 controls     |
| "Show identity mgmt controls"             | CIEM → dormant accounts, privilege usage |
| "Show change management controls"         | K8s audit logs + Git commit history      |
```

---

# SECTION 7: AUTOMATION PLAYBOOKS — WHAT TO AUTOMATE AND HOW

## 7.1 Auto-Remediation: S3 Public Access

```python
# Lambda triggered by CloudTrail event: PutBucketAcl or PutBucketPolicy
import boto3, json

def lambda_handler(event, context):
    s3 = boto3.client('s3')
    bucket = event['detail']['requestParameters']['bucketName']
    
    # Enforce Block Public Access
    s3.put_public_access_block(
        Bucket=bucket,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    
    # Alert security team
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123456789:SecurityAlerts',
        Subject=f'[AUTO-REMEDIATED] S3 bucket {bucket} public access blocked',
        Message=json.dumps({
            'action': 'BlockPublicAccessEnforced',
            'bucket': bucket,
            'triggered_by': event['detail']['userIdentity']['arn'],
            'timestamp': event['detail']['eventTime']
        })
    )
```

## 7.2 Coverage Gap Reconciliation

```python
# Daily Lambda: compare AWS EC2 instances vs Falcon reporting sensors
import boto3
from falconpy import Hosts

def reconcile_coverage():
    # Get all EC2 instances in EKS
    ec2 = boto3.client('ec2')
    instances = ec2.describe_instances(
        Filters=[{'Name': 'tag:kubernetes.io/cluster/production', 'Values': ['owned']}]
    )
    ec2_ids = {i['InstanceId'] for r in instances['Reservations'] for i in r['Instances']}
    
    # Get all Falcon-reporting hosts
    falcon = Hosts(client_id="...", client_secret="...")
    response = falcon.query_devices_by_filter(filter="platform_name:'Linux'")
    falcon_hosts = {h['hostname'] for h in response['body']['resources']}
    
    # Find gaps
    unmonitored = ec2_ids - falcon_hosts
    if unmonitored:
        alert_security_team(
            severity="HIGH",
            message=f"Coverage gap: {len(unmonitored)} EKS nodes without Falcon sensor",
            details=list(unmonitored)
        )
    
    return {'coverage': len(falcon_hosts) / len(ec2_ids) * 100}
```

## 7.3 Security Group Audit

```python
# Weekly audit: find all SGs with 0.0.0.0/0 ingress
import boto3

def audit_open_security_groups():
    ec2 = boto3.client('ec2')
    sgs = ec2.describe_security_groups()['SecurityGroups']
    
    risky_sgs = []
    for sg in sgs:
        for rule in sg.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == '0.0.0.0/0':
                    risky_sgs.append({
                        'GroupId': sg['GroupId'],
                        'GroupName': sg['GroupName'],
                        'Port': rule.get('FromPort', 'All'),
                        'Protocol': rule.get('IpProtocol', 'All'),
                        'VpcId': sg.get('VpcId')
                    })
    
    if risky_sgs:
        create_jira_tickets(risky_sgs)
        notify_slack(f"Found {len(risky_sgs)} SGs with 0.0.0.0/0 ingress")
    
    return risky_sgs
```

## 7.4 IAM Credential Rotation Enforcement

```python
# Automated: deactivate IAM keys unused for 90 days, delete after 120
import boto3
from datetime import datetime, timezone

def enforce_key_rotation():
    iam = boto3.client('iam')
    users = iam.list_users()['Users']
    now = datetime.now(timezone.utc)
    
    for user in users:
        keys = iam.list_access_keys(UserName=user['UserName'])['AccessKeyMetadata']
        for key in keys:
            age_days = (now - key['CreateDate']).days
            last_used = iam.get_access_key_last_used(AccessKeyId=key['AccessKeyId'])
            
            if last_used.get('LastUsedDate'):
                idle_days = (now - last_used['LastUsedDate']).days
            else:
                idle_days = age_days
            
            if idle_days > 120 and key['Status'] == 'Inactive':
                iam.delete_access_key(UserName=user['UserName'], AccessKeyId=key['AccessKeyId'])
                log(f"DELETED key {key['AccessKeyId']} for {user['UserName']} (idle {idle_days}d)")
            
            elif idle_days > 90 and key['Status'] == 'Active':
                iam.update_access_key(UserName=user['UserName'],
                                      AccessKeyId=key['AccessKeyId'], Status='Inactive')
                notify_user_and_manager(user['UserName'], key['AccessKeyId'], idle_days)
```

## 7.5 Compliance Summary Generator (PowerShell for Azure)

```powershell
# Weekly Azure compliance report
$subscriptions = Get-AzSubscription

foreach ($sub in $subscriptions) {
    Set-AzContext -Subscription $sub.Id
    
    # Get compliance state
    $compliance = Get-AzPolicyState -SubscriptionId $sub.Id |
        Group-Object ComplianceState |
        Select-Object Name, Count
    
    $nonCompliant = Get-AzPolicyState -SubscriptionId $sub.Id |
        Where-Object { $_.ComplianceState -eq "NonCompliant" } |
        Group-Object PolicyDefinitionName |
        Sort-Object Count -Descending |
        Select-Object -First 10 Name, Count
    
    Write-Output "=== Subscription: $($sub.Name) ==="
    Write-Output "Compliant: $($compliance | Where-Object Name -eq 'Compliant' | Select -Exp Count)"
    Write-Output "Non-Compliant: $($compliance | Where-Object Name -eq 'NonCompliant' | Select -Exp Count)"
    Write-Output "Top 10 violations:"
    $nonCompliant | ForEach-Object { Write-Output "  $($_.Count)x $($_.Name)" }
}
```

---

# SECTION 8: INTERVIEW Q&A — 25 QUESTIONS ALIGNED TO EY JD

## Category 1: CNAPP Platform Mastery

### Q1: "Walk me through how you use a CNAPP tool to secure a client's cloud environment."

> "I start by onboarding their AWS/Azure/GCP accounts into the CNAPP — with CrowdStrike Falcon, that's through CloudFormation for AWS, ARM template for Azure. This gives us API-based access for CSPM scanning. For runtime protection (CWPP), I deploy the Falcon sensor as a DaemonSet on EKS clusters, which provides eBPF-based telemetry across all containers on every node. For admission control, I deploy KAC as a validating webhook. Once deployed, I establish three operational rhythms: **daily** — triage new Critical/High detections; **weekly** — review posture score trends, SLA compliance, and coverage gaps; **monthly** — tool tuning cycle to reduce false positives and improve signal quality."

### Q2: "What's the difference between CWPP and CSPM?"

> "CSPM is the building inspector — it checks whether your cloud resources are configured securely against benchmarks like CIS. It finds that your S3 bucket is public or your Security Group allows SSH from 0.0.0.0/0. CWPP is the security camera inside — it monitors what's happening at runtime in your workloads. It detects a reverse shell, a crypto miner, or container drift. You need both because CSPM can't see malware running inside a container, and CWPP can't see that your S3 bucket is publicly readable. The operational model is: CSPM prevents attack surface, CWPP catches exploitation. The SLA between a CSPM finding and remediation is your most critical security metric."

### Q3: "How does CIEM fit into the CNAPP ecosystem?"

> "CIEM answers: 'If this identity is compromised, what can the attacker do?' It computes effective permissions including transitive role chains, maps all privilege escalation paths like PassRole-to-Lambda or AssumeRole chaining, and identifies dormant/over-privileged credentials. In incident response, CIEM provides immediate blast radius computation — when a credential is compromised, I know the worst-case impact in seconds, not hours."

### Q4: "Compare CrowdStrike Falcon with Orca, Wiz, and Prisma."

> "CrowdStrike uses an agent (eBPF sensor) for deep runtime visibility plus agentless for CSPM. Orca and Wiz are 100% agentless using snapshot scanning — fast deployment, zero performance impact, but limited real-time runtime detection. Prisma Cloud is a hybrid — agent (Defender) for runtime, agentless for CSPM. The choice depends on the use case: for a consulting firm like EY managing multiple client environments, agentless tools enable rapid onboarding. For organizations running their own production workloads, agent-based CWPP provides deeper runtime detection. In practice, I recommend agent-based for production workloads and agentless for broader coverage."

## Category 2: Vulnerability Management & SLAs

### Q5: "Describe your end-to-end vulnerability management lifecycle."

> "Six phases: Discover — I scan all cloud assets continuously. Assess — I validate that findings are real and contextually relevant. Prioritize — using risk scoring (not just CVSS) that factors in exploitability, exposure, data sensitivity, and blast radius. Remediate — tickets auto-assigned with specific fix steps and SLA timers. Verify — re-scan after fix, close only when confirmed. Report — executive dashboard with MTTR, SLA compliance, and age analysis. The key differentiator is that I prioritize by attack path, not individual CVE severity. A Medium CVE on a public-facing internet asset with an admin IAM role is more dangerous than an isolated Critical CVE."

### Q6: "How do you shape remediation SLAs?"

> "SLAs are based on three factors: severity, exposure, and data sensitivity. Critical CVE on a public-facing asset with PII gets a 4-hour SLA. The same Critical CVE on an internal dev instance gets 24 hours. I enforce SLAs through automated escalation: at 50% elapsed time, the owner gets a reminder; at 100%, the engineering manager is notified; at 150%, the CISO gets a governance report. Repeated SLA breaches trigger a process review with the team. The target is >95% SLA compliance."

### Q7: "How do you implement build-breaking policies?"

> "I enforce security gates at two points. First, in the CI/CD pipeline: image scans and IaC scans fail the build on Critical/High findings. The developer sees the exact CVE, affected package, and remediation guidance — not just a red build. Second, at the admission layer: even if someone bypasses the pipeline, KAC blocks deployments with Critical CVEs or security misconfigurations. The key to adoption is communication — engineering teams must understand why their build broke and have a clear exception process for legitimate urgency."

## Category 3: Detection & Investigation

### Q8: "How do you distinguish a true positive from a false positive?"

> "I use a three-step process: context, process tree, and correlation. First, context — what workload, what environment, what time? Second, process tree — is the parent-child chain expected? A web server spawning bash is always suspicious; a CI runner spawning bash is expected. Third, correlation — are there other signals? A single low-severity alert might be noise, but the same alert correlated with a CSPM finding and a CIEM anomaly is almost certainly real. My default: when in doubt, treat as TP. I'd rather investigate a false alarm than ignore a real attack."

### Q9: "How do you handle alert fatigue?"

> "Alert fatigue is a process problem, not a tooling problem. My approach: tuning — monthly review of alert types by TP rate, suppressing known FPs with documented justification and expiry. Correlation — SIEM rules that only page the analyst when multiple signals align. SLAs — CSPM findings go through automated ticketing, not manual triage. The metric I track is 'actionable alert rate' — what percentage of alerts that reach a human require a real response? Target is >80%."

### Q10: "Explain IOA vs IOC vs IOM."

> "IOA — Indicator of Attack — behavioral detection. Watches what processes DO regardless of whether the binary is known malicious. Catches zero-days. IOC — Indicator of Compromise — signature-based. Matches known malicious hashes, IPs, domains. Fast but requires prior knowledge. IOM — Indicator of Misconfiguration — configuration audit. Catches insecure settings before they're exploited. Priority order for maturity: IOMs prevent attack surface, IOAs catch unknown threats, IOCs catch known threats fast."

## Category 4: Incident Response

### Q11: "Walk through a container escape incident from detection to post-incident."

> "**Identification:** Falcon fires `ContainerEscape.Nsenter` — process tree shows nsenter with all namespace flags from inside a privileged container. **Containment:** Kill the pod, cordon the node, apply deny-all NetworkPolicy. **Investigation:** Check if kubelet kubeconfig was read — if yes, assume full cluster compromise. Check CloudTrail for API calls made with the instance role. Check for persistence (new IAM users, roles, ServiceAccounts). **Eradication:** Rotate all cluster secrets, delete any persistence mechanisms, rebuild the node from golden AMI. **Recovery:** Redeploy clean workloads, verify sensor coverage. **Post-incident:** Set KAC to PREVENT for privileged containers, document and train the team, update runbooks."

### Q12: "How do you respond to a zero-day disclosure?"

> "Four phases. Hour 0-2: use the CNAPP to instantly identify all affected assets. Generate blast radius report. Hour 2-6: deploy compensating controls — WAF rules, tightened NetworkPolicies, KAC blocks for affected images. Hour 6-48: track patching against Critical SLA. Coordinate with SOC for active exploitation attempts. Post-48h: verify all instances patched, conduct lessons learned, update policies to flag the vulnerable version as Critical."

### Q13: "You get 3 CSPM findings that individually look like HIGH but together describe a critical attack chain. How do you handle this?"

> "This is the correlation problem. Individually, a public LoadBalancer, an unchanged default password, and an over-privileged service account are each HIGH. Together, they're an internet-to-admin attack path. Using Falcon Cloud Risks or Wiz Attack Path, I visualize the chain and assign a composite risk score. This gets a CRITICAL SLA even though individual findings are HIGH. Post-incident, I implement automated correlation rules that detect these multi-finding attack chains and auto-escalate."

## Category 5: Compliance & Governance

### Q14: "How do you ensure continuous compliance with CIS benchmarks?"

> "I load the CIS benchmark profile into the CSPM tool and run continuous assessments — not annual point-in-time audits. Every CIS control maps to a specific CSPM check. Failing controls create IOMs with auto-assigned tickets and SLAs. I track compliance score continuously and alert when it drops below 95%. For audits, I export the compliance report showing pass/fail per control with evidence. The key metric is the trend line — compliance should be continuously improving, not just passing at audit time."

### Q15: "How do you map cloud security to NIST 800-53?"

> "I map each Falcon module to NIST control families: CSPM satisfies CM-2 (baseline), CM-6 (config settings), and CM-8 (inventory). CWPP satisfies SI-3 (malware protection), SI-4 (monitoring), and RA-5 (vulnerability scanning). CIEM satisfies AC-2 (account management), AC-6 (least privilege). KAC satisfies CA-7 (continuous monitoring) and CM-3 (change control). For each finding we remediate, I document which NIST control it satisfies — this creates the audit evidence chain."

### Q16: "How do you enforce governance across multiple cloud accounts?"

> "AWS Organizations with SCPs enforce immutable guardrails — deny CloudTrail deletion, require encryption, restrict regions. Azure Management Groups with Policies enforce resource compliance. GCP Organization Policies restrict locations and access patterns. Cross-cloud, the CNAPP provides unified governance with consistent policy enforcement. I implement this as defense-in-depth: SCP at the account level → CSPM at the resource level → KAC at the workload level → CWPP at runtime."

## Category 6: Tools, Automation & Integration

### Q17: "How do you integrate CNAPP with SIEM and ticketing?"

> "CNAPP findings push to SIEM via API/webhook. I create correlation rules — a CSPM finding for 'public-facing asset with critical CVE' correlated with a GuardDuty 'anomalous API call' on the same asset escalates to P1. For ticketing, Critical/High findings auto-create Jira tickets with affected asset, remediation steps, SLA timer, and auto-assignment via resource tagging. Bi-directional sync: when the ticket is resolved, the CNAPP re-verifies and auto-closes if remediated."

### Q18: "What automation opportunities do you look for?"

> "Three patterns: repeatability — same fix more than 3 times, automate it; speed — manual remediation slower than SLA, automate it; consistency — different engineers fix the same issue differently, standardize and automate. Examples: auto-block S3 public access via Lambda, auto-rotate stale IAM keys, auto-reconcile sensor coverage, auto-create compliance reports."

### Q19: "How do you tune scanning tools to improve visibility?"

> "Monthly cycle: analyze top-10 noisiest alerts by volume, calculate TP rate for each. Alert types with <50% TP rate get tuned — narrow the scope, adjust thresholds, or add suppressions with documentation and expiry. Alert types with 0% TP rate get reviewed — is the alert irrelevant or is our environment clean? Apply changes in staging first, monitor 72 hours, then move to production. I track three metrics: alert volume reduction %, TP rate improvement, and MTTD improvement."

## Category 7: Multi-Cloud & AWS

### Q20: "How do you secure IAM across multi-cloud?"

> "The principles are the same across clouds: least privilege, MFA enforcement, credential rotation, and anomaly detection. The implementations differ: AWS uses IAM Access Analyzer and SCPs, Azure uses PIM for just-in-time access, GCP uses IAM Recommender. CIEM provides the cross-cloud unified view — it identifies over-privileged identities regardless of provider. I conduct quarterly access reviews using CIEM data, focusing on effective permissions rather than just assigned policies."

### Q21: "What are the key AWS security services you integrate?"

> "CloudTrail for API audit logging, GuardDuty for threat detection, Security Hub for centralized findings, IAM Access Analyzer for permission analysis, Inspector for vulnerability scanning, Macie for data discovery, KMS for encryption management, Organizations + SCPs for governance, Config for configuration compliance, and Secrets Manager for credential management. These complement the CNAPP — native services provide cloud-specific context that enriches CNAPP findings."

## Category 8: Behavioral & Stakeholder

### Q22: "How do you translate security findings for non-technical stakeholders?"

> "Three elements: What — '47 cloud resources are publicly accessible from the internet.' So what — 'If exploited, this exposes 2.1 million customer records and triggers mandatory breach notification.' Now what — 'We can fix 80% by enabling a single AWS setting, deployable in 48 hours with zero downtime.' I use risk scores (98/100) because executives understand numbers. I avoid jargon like 'S3 ACL' and say 'customer data storage publicly accessible.' I always present solutions alongside problems."

### Q23: "Tell me about a time you pushed back on a stakeholder."

> "A development lead wanted to deploy a container with `privileged: true` because their monitoring tool 'needed it.' Instead of blocking, I investigated. The tool only needed `CAP_NET_ADMIN` — one specific capability, not full privileged access. I demonstrated the risk by showing what an attacker can do with privileged access — mount the host filesystem, read cluster secrets, move laterally. The developer agreed to use the specific capability. My approach: don't just say no — understand the requirement, find the least-privilege solution, and educate through concrete risk demonstration."

### Q24: "How do you handle a situation where risk is accepted but you disagree?"

> "I document my risk assessment with data: potential impact, likelihood, blast radius, and recommended mitigations. If the business decides to accept, I ensure it's formalized — risk owner sign-off at VP level, compensating controls documented, 90-day maximum duration, quarterly review. I track it in the risk register and revisit at every review. Ultimately, informed risk acceptance is a valid business decision — my job is ensuring the decision-makers have complete and accurate information."

### Q25: "What's your 30-60-90 day plan?"

> **Days 1-30 (Learn & Assess):** Map EY's cloud environment, get access to CNAPP/SIEM/ticketing, review existing posture findings and suppression backlog, meet all stakeholders, identify top-10 recurring issues, create 'State of Cloud Security' baseline.

> **Days 31-60 (Optimize & Automate):** Close top-20 critical findings, implement tiered SLAs with automated escalation, tune top-10 noisiest alerts (reduce FP rate <15%), set up 3 auto-remediation workflows, start KAC rollout in Alert mode, build weekly metrics dashboard.

> **Days 61-90 (Mature & Lead):** Switch critical KAC rules to PREVENT, enable drift prevention in production, launch quarterly access review using CIEM, implement CI/CD build-breaking policy for Critical CVEs, present '90-Day Improvement Report' — posture score improvement, findings closed, coverage achieved, automation implemented.

---

# SECTION 9: KEY COMMANDS CHEAT SHEET

```bash
# === AWS IAM ===
aws sts get-caller-identity                           # Who am I?
aws iam list-roles | jq '.Roles[] | {RoleName, Arn}'  # All roles
aws iam generate-credential-report                     # Credential audit
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,\
  AttributeValue=AssumeRole --max-results 20           # Role history

# === Emergency Containment ===
aws iam put-role-policy --role-name ROLE \
  --policy-name EmergencyDeny --policy-document \
  '{"Version":"2012-10-17","Statement":[{"Effect":"Deny",
  "Action":"*","Resource":"*","Condition":{"DateLessThan":
  {"aws:TokenIssueTime":"CURRENT_TIME"}}}]}'            # Revoke sessions

# === EKS / Kubernetes ===
kubectl get configmap aws-auth -n kube-system -o yaml   # Check RBAC mapping
kubectl get pods -A -o json | jq '.items[] |
  select(.spec.containers[].securityContext.privileged
  ==true) | .metadata'                                   # Find privileged pods
kubectl auth can-i --list --as=system:serviceaccount:NS:SA # SA permissions
kubectl get networkpolicies -A                           # List all NetPols
kubectl get ds -n falcon-system                          # Falcon DaemonSet status

# === S3 Security ===
aws s3api get-public-access-block --bucket NAME         # Public access check
aws s3api get-bucket-policy --bucket NAME               # Bucket policy

# === Azure ===
Get-AzNetworkSecurityGroup | ForEach-Object {            # Open NSG rules
  $_.SecurityRules | Where-Object {
    $_.SourceAddressPrefix -eq '*' -and $_.Access -eq 'Allow'
  }
}
Get-AzPolicyState | Where-Object ComplianceState -eq 'NonCompliant'

# === Falcon Insight Queries ===
event_simpleName=ProcessRollup2
  | where CommandLine matches "nsenter|mount|chroot"     # Container escape
event_simpleName=ContainerDriftFileCreated
  | where timestamp > now() - 24h                        # Recent drift
event_simpleName=DnsRequest
  | where IsFirstSeenDomain == true                      # First-seen domains
```

---

# SECTION 10: IAM PRIVILEGE ESCALATION PATHS TO MONITOR

| # | Path | What Attacker Does | CIEM Detection |
|---|------|-------------------|---------------|
| 1 | `iam:CreatePolicyVersion` | Replace managed policy with admin permissions | PolicyVersionCreated |
| 2 | `iam:PassRole` + `lambda:CreateFunction` | Create Lambda with admin role | UnusualRolePassage |
| 3 | `iam:PassRole` + `ec2:RunInstances` | Launch EC2 with admin instance profile | InstanceProfileEscalation |
| 4 | `sts:AssumeRole` (no condition) | Lateral movement across accounts | CrossAccountRoleChain |
| 5 | IRSA JWT + no SourceVpc | SA token used from external IP | ExternalIRSAAbuse |
| 6 | `aws-auth` ConfigMap edit | Map IAM role to cluster-admin | KubernetesRBACEscalation |
| 7 | AWS Config + Lambda | Self-healing backdoor every 24h | PersistenceViaConfig |
| 8 | `iam:SetDefaultPolicyVersion` | Activate dormant admin policy version | PolicyVersionActivated |
| 9 | `iam:CreateAccessKey` | Create long-lived keys for any user | NewAccessKeyCreated |
| 10 | `iam:AddUserToGroup` | Add self to admin group | GroupMembershipChange |
| 11 | `lambda:UpdateFunctionCode` | Modify existing Lambda to escalate | LambdaCodeModification |
| 12 | `ec2:CreateSnapshot` + share | Exfiltrate data via snapshot sharing | SnapshotExfiltration |

---

# SECTION 11: THE CLOSING STATEMENT

> "The thing I've learned from every incident I've investigated is that the breach was almost always preventable. The findings existed. The detections fired. The gap was always in the process — someone didn't act on the CSPM finding, the SLA wasn't enforced, the findings weren't correlated. I build security programs that close that gap. Not just deploying tools, but building the operational muscle that turns detections into outcomes — timely remediation, enforced SLAs, automated response, and a culture where security is everyone's responsibility. At EY, I want to bring that operational maturity to help clients move from having security tools to having security outcomes."

---

*End of Ultimate Interview Preparation Guide*

*Sources synthesized: Cloud Security Complete Playbook, CNAPP Structured Guide, KAC & Runtime Detections Guide, Advanced Cloud Security Study Guide, Cloud Security Mock Interview, Unified Mastery Guide, EY Interview Prep, cloud_security_interview_guide, and CrowdStrike Falcon Cloud Security 2024-2025 internet research.*
