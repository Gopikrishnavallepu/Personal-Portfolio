# ☁️ GAP LEARNING NOTES — Part 3: Azure Security, GCP Security & Wiz Platform

> **For:** Wells Fargo Senior Info Security Analyst — CWLS Findings Management
> **Why:** JD requires Azure & GCP misconfig review + Wiz platform expertise

---

# SECTION 1: AZURE SECURITY — Services, Misconfigurations & Controls

## 1.1 Azure Security Architecture Overview

```
AZURE SECURITY STACK:

┌─────────────────────────────────────────────────────────────────┐
│                    AZURE MANAGEMENT HIERARCHY                    │
│                                                                  │
│  Tenant (Entra ID) ── root management group                     │
│    └── Management Groups (organize subscriptions)               │
│         └── Subscriptions (billing + access boundary)           │
│              └── Resource Groups (logical grouping)             │
│                   └── Resources (VMs, Storage, DBs, etc.)       │
│                                                                  │
│  SECURITY SERVICES:                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐           │
│  │ Defender for  │ │ Entra ID     │ │ Azure Policy  │           │
│  │ Cloud        │ │ (IAM)        │ │ (Guardrails)  │           │
│  │ • CSPM       │ │ • Users/Groups│ │ • Enforce     │           │
│  │ • CWPP       │ │ • Cond Access │ │   standards   │           │
│  │ • Compliance │ │ • PIM (JIT)  │ │ • Deny/Audit  │           │
│  │ • Attack Path│ │ • App Reg    │ │ • Auto-remediate│          │
│  └──────────────┘ └──────────────┘ └───────────────┘           │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐           │
│  │ Key Vault    │ │ NSG / Firewall│ │ Sentinel      │           │
│  │ • Key mgmt   │ │ • Network ACL│ │ • SIEM + SOAR │           │
│  │ • Secrets    │ │ • Flow Logs  │ │ • KQL queries  │           │
│  │ • Cert mgmt  │ │ • WAF        │ │ • Playbooks   │           │
│  └──────────────┘ └──────────────┘ └───────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Azure IAM — Entra ID (Formerly Azure AD)

### Key Concepts

| Concept | What It Is | Security Implication |
|---------|-----------|---------------------|
| **Entra ID** | Identity provider for Azure (users, groups, apps) | Central authentication — compromise = full access |
| **RBAC** | Role-Based Access Control on Azure resources | Over-permissive roles = lateral movement |
| **PIM** | Privileged Identity Management — JIT (Just-In-Time) access | Users activate roles only when needed, time-limited |
| **Conditional Access** | Policies that control HOW users can sign in | MFA requirement, device compliance, location-based |
| **App Registrations** | Service principals for apps to access Azure APIs | Stale app registrations with secrets = credential theft |
| **Managed Identity** | Azure-assigned identity for resources (no secrets) | Eliminates hardcoded credentials |

### Azure IAM Misconfigurations to Know

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. No MFA for Global Admin                CIS 1.1.1          CRITICAL
2. Guest users with privileged roles      CIS 1.3            HIGH
3. Custom role with * permissions         CIS 1.23           CRITICAL
4. PIM not enabled for admin roles        CIS 1.1.3          HIGH
5. Conditional Access not requiring MFA   CIS 1.2.1          HIGH
   for all users
6. App registration secrets not rotated   CIS 1.11           MEDIUM
   (>365 days)
7. Subscription has no custom RBAC        Best Practice       MEDIUM
   (everyone is Contributor/Owner)
8. No break-glass emergency access        CIS 1.1.4          HIGH
   account configured
```

### Azure CLI Commands for IAM Audit

```bash
# List all Global Admins
az ad directory role members list --role "Global Administrator" --query "[].userPrincipalName"

# Check MFA status (requires MS Graph)
az ad user list --query "[].{name:displayName, mfa:strongAuthenticationRequirements}"

# List role assignments at subscription level
az role assignment list --all --query "[?roleDefinitionName=='Owner'].{Principal:principalName, Scope:scope}"

# Find custom roles with wildcard permissions
az role definition list --custom-role-only --query "[?contains(permissions[0].actions[0], '*')]"

# List app registrations with expired secrets
az ad app list --query "[?passwordCredentials[?endDateTime<'2025-01-01']].{app:displayName, id:appId}"
```

## 1.3 Azure Network Security

### NSG (Network Security Groups) vs Azure Firewall

| Feature | NSG | Azure Firewall |
|---------|-----|---------------|
| **Layer** | L3/L4 (IP + Port) | L3-L7 (includes FQDN, URL filtering) |
| **Scope** | Per subnet or NIC | Per VNet (centralized) |
| **Logging** | NSG Flow Logs → Log Analytics | Firewall Logs → Sentinel |
| **Threat Intel** | No | Yes — blocks known-bad IPs/domains |
| **Cost** | Free (flow logs cost) | ~$900/month |

### NSG Misconfigurations

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. NSG allows 0.0.0.0/0 inbound to       CIS 6.1/6.2       CRITICAL
   SSH (22) or RDP (3389)
2. No NSG attached to subnet              CIS 6.4            HIGH
3. NSG allows ALL ports from ANY source   CIS 6.3            CRITICAL
4. No NSG Flow Logs enabled               CIS 6.5            MEDIUM
5. Flow logs not sent to Log Analytics    Best Practice       MEDIUM
```

```bash
# Find NSGs with open SSH/RDP
az network nsg list --query "[].{Name:name, Rules:securityRules[?access=='Allow' && direction=='Inbound' && (destinationPortRange=='22' || destinationPortRange=='3389') && sourceAddressPrefix=='*']}"

# List NSGs with no rules (default allow)
az network nsg list --query "[?length(securityRules)==\`0\`].{Name:name, RG:resourceGroup}"

# Check NSG flow logs status
az network watcher flow-log list --location eastus --query "[].{NSG:targetResourceId, Enabled:enabled}"
```

## 1.4 Azure Storage Security

### Storage Account Misconfigurations

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. Public blob access enabled             CIS 3.7            CRITICAL
2. HTTPS not enforced (HTTP allowed)      CIS 3.1            HIGH
3. No encryption at rest with CMK         CIS 3.9            MEDIUM
4. Shared Key access enabled              CIS 3.3            HIGH
   (should use Entra + RBAC)
5. No soft delete on blob containers      CIS 3.8            MEDIUM
6. Storage account not using              CIS 3.10           HIGH
   private endpoints
7. SAS tokens with no expiry              Best Practice       HIGH
8. Anonymous access to containers         CIS 3.5            CRITICAL
```

```bash
# Check for public blob access
az storage account list --query "[].{Name:name, PublicAccess:allowBlobPublicAccess}"

# Check HTTPS enforcement
az storage account list --query "[?enableHttpsTrafficOnly==\`false\`].{Name:name, RG:resourceGroup}"

# Check encryption with CMK
az storage account list --query "[].{Name:name, KeySource:encryption.keySource}"
```

## 1.5 Azure Defender for Cloud (CSPM/CWPP)

```
DEFENDER FOR CLOUD ≈ Wells Fargo's Wiz equivalent for Azure:

Dashboard → Secure Score (0-100%)
├── Score breakdown by category:
│   ├── Identity & Access (Entra ID, RBAC)
│   ├── Network Security (NSGs, Firewall)
│   ├── Compute (VMs, AKS, containers)
│   ├── Data & Storage (Storage accounts, DBs)
│   └── Application Security (App Services)
│
├── Recommendations → specific misconfigurations to fix
│   ├── Each has: severity, resource, remediation steps
│   ├── Can be auto-remediated (Azure Policy)
│   └── Can be exempted (risk acceptance)
│
├── Regulatory Compliance → CIS, NIST, SOC2, PCI
│   ├── Pass/fail per control
│   └── Exportable for auditors
│
├── Attack Path Analysis → same concept as Wiz
│   ├── Visual graph of exploit paths
│   └── Prioritize by risk score
│
└── Workload Protection (CWPP plans):
    ├── Defender for Servers (VM runtime protection)
    ├── Defender for Containers (AKS/container security)
    ├── Defender for Databases
    ├── Defender for Storage
    └── Defender for App Service
```

---

# SECTION 2: GCP SECURITY — Services, Misconfigurations & Controls

## 2.1 GCP Security Architecture

```
GCP MANAGEMENT HIERARCHY:

Organization (domain level)
  └── Folders (organize projects — e.g., by department, env)
       └── Projects (resource + billing boundary)
            └── Resources (VMs, GCS buckets, GKE clusters, etc.)

SECURITY SERVICES:
┌──────────────┐ ┌──────────────┐ ┌───────────────┐
│ Security     │ │ IAM          │ │ Org Policies  │
│ Command      │ │              │ │               │
│ Center (SCC) │ │ • IAM Roles  │ │ • Constraint  │
│ • Findings   │ │ • Svc Accounts│ │   enforcement │
│ • Compliance │ │ • Workload ID│ │ • Override at  │
│ • Attack Path│ │ • Recommender│ │   folder/proj │
│ • Vuln scan  │ │ • Conditions │ │               │
└──────────────┘ └──────────────┘ └───────────────┘
┌──────────────┐ ┌──────────────┐ ┌───────────────┐
│ Cloud KMS    │ │ VPC / FW     │ │ Chronicle     │
│ • CMEK keys  │ │ • FW rules   │ │  (SIEM)       │
│ • Key rotation│ │ • VPC SC     │ │ • Log analysis│
│ • HSM support│ │ • Flow logs  │ │ • Detection   │
└──────────────┘ └──────────────┘ └───────────────┘
```

## 2.2 GCP IAM

### Key Differences from AWS/Azure

| Concept | AWS | Azure | GCP |
|---------|-----|-------|-----|
| **Identity Provider** | IAM Users/Roles | Entra ID | Google Cloud Identity |
| **Service Identity** | IAM Roles for services | Managed Identity | Service Accounts |
| **Least Privilege Tool** | IAM Access Analyzer | PIM + Access Reviews | IAM Recommender |
| **Policy Guardrails** | SCPs | Azure Policy | Organization Policies |
| **JIT Access** | No native (use SSO) | PIM | PAM (Privileged Access Manager) |
| **K8s Identity** | IRSA | Workload Identity | Workload Identity |

### GCP IAM Misconfigurations

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. Service account key not rotated        CIS 1.7            HIGH
   (>90 days)
2. User-managed SA key (should use        CIS 1.4            MEDIUM
   Workload Identity or impersonation)
3. Service account with Owner or          CIS 1.5            CRITICAL
   Editor role at project level
4. allUsers or allAuthenticatedUsers      CIS 1.14           CRITICAL
   in IAM binding (public access)
5. Domain-wide delegation enabled         CIS 1.9            HIGH
   on service account
6. IAM Recommender suggestions not        Best Practice       MEDIUM
   applied (stale permissions)
```

```bash
# List service accounts with keys older than 90 days
gcloud iam service-accounts keys list --iam-account=NAME@PROJECT.iam.gserviceaccount.com \
  --format="table(keyId, validAfterTime, keyType)"

# Find IAM bindings with allUsers (public access!)
gcloud projects get-iam-policy PROJECT_ID --format=json \
  | jq '.bindings[] | select(.members[] | contains("allUsers"))'

# Find service accounts with Owner role
gcloud projects get-iam-policy PROJECT_ID --format=json \
  | jq '.bindings[] | select(.role=="roles/owner") | .members[]' | grep "serviceAccount"
```

## 2.3 GCP Network Security

### VPC Firewall Rules Misconfigurations

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. Firewall rule allows 0.0.0.0/0        CIS 3.6/3.7       CRITICAL
   to SSH (22) or RDP (3389)
2. Default network in use (has            CIS 3.1            HIGH
   permissive default firewall rules)
3. VPC Flow Logs disabled                 CIS 3.8            MEDIUM
4. No VPC Service Controls (VPC SC)       Best Practice       MEDIUM
   for sensitive projects
5. DNS logging disabled                   CIS 3.9            MEDIUM
```

```bash
# Find firewall rules open to 0.0.0.0/0 on SSH/RDP
gcloud compute firewall-rules list \
  --filter="sourceRanges=0.0.0.0/0 AND (allowed.ports=22 OR allowed.ports=3389)" \
  --format="table(name, network, sourceRanges, allowed)"

# Check for default network
gcloud compute networks list --filter="name=default"

# Check VPC Flow Logs status
gcloud compute networks subnets list \
  --format="table(name, region, logConfig.enable)"
```

## 2.4 GCP Storage (Cloud Storage / GCS)

```
MISCONFIGURATION                          CIS CONTROL        SEVERITY
──────────────────────────────────────────────────────────────────────
1. Bucket with uniform access disabled    CIS 5.2            MEDIUM
   (ACL-based — harder to audit)
2. Bucket publicly accessible             CIS 5.1            CRITICAL
   (allUsers read/write)
3. No CMEK encryption                     CIS 5.3            MEDIUM
4. Bucket versioning disabled             Best Practice       LOW
5. No Object Lifecycle policy             Best Practice       LOW
```

```bash
# Find public buckets
gsutil iam get gs://BUCKET_NAME | grep allUsers

# Check uniform bucket-level access
gsutil uniformbucketlevelaccess get gs://BUCKET_NAME

# Check encryption type
gsutil kms encryption gs://BUCKET_NAME
```

## 2.5 GCP Security Command Center (≈ Defender for Cloud / Wiz)

```
SCC TIERS:
├── Standard: basic findings (free)
└── Premium: full CSPM, vuln scanning, attack path, compliance

SCC FINDINGS CATEGORIES:
├── Vulnerability findings → CVEs in VMs, containers
├── Misconfiguration findings → IAM, network, storage misconfigs
├── Threat findings → active threats detected
├── Compliance findings → CIS GCP, NIST, PCI, ISO 27001
└── Attack path findings → graph-based exploit chains
```

---

# SECTION 3: WIZ PLATFORM — The CNAPP Wells Fargo Uses

## 3.1 Wiz Architecture — Key Differences from CrowdStrike

```
WIZ vs CROWDSTRIKE FALCON:

                    CrowdStrike Falcon          Wiz
─────────────────────────────────────────────────────────────
Deployment          Agent (eBPF sensor)         100% Agentless
                    + Agentless option          (snapshot-based)

How it scans        Runtime telemetry           Reads cloud API +
                    (real-time events)          disk snapshots

Runtime detection   Yes (process trees,         Limited (no real-time
                    network, drift)             process monitoring)

CSPM                API-based polling           API-based polling
                    (same concept)              (same concept)

Attack paths        Cloud Risks                 Wiz Attack Paths
                    (newer feature)             (industry-leading)

Image scanning      Image Assessment            Image scanning
                    (registry + runtime)        (registry + runtime)

Strengths           Best runtime detection      Best attack path analysis
                    Best process visibility     Best graph visualization
                                               Fastest deployment (no agent)

Weaknesses          Requires agent deployment   No runtime process tree
                    Slower initial setup        Can't see live network
                                               connections
```

## 3.2 Wiz Console Navigation

```
WIZ CONSOLE LEFT MENU:

Dashboard
├── Risk overview (Critical/High/Medium/Low)
├── Cloud accounts connected
├── Compliance posture
└── Attack path summary

Issues ◄── PRIMARY FINDINGS VIEW
├── All findings from all modules
├── Filters: severity, category, cloud, subscription, project
├── Status: Open, Resolved, Rejected (exception), In Progress
├── Each issue has:
│   ├── Title and description
│   ├── Affected resource (with full metadata)
│   ├── Remediation steps
│   ├── Evidence (what Wiz found)
│   ├── Related issues (deduplication)
│   └── Status + assignee + due date

Controls ◄── POLICY DEFINITIONS
├── Built-in controls (CIS, NIST, PCI mappings)
├── Custom controls (organization-specific)
├── Each control:
│   ├── What it checks
│   ├── Which compliance frameworks it maps to
│   ├── Severity assignment
│   └── Auto-remediation option (if available)

Explorer ◄── THE GRAPH (Wiz's Superpower)
├── Visual graph of ALL cloud resources and relationships
├── Query language: Wiz Query Language (WQL)
├── Node types: VMs, containers, identities, data stores, networks
├── Edge types: has access to, is exposed to, connects to
├── Use cases:
│   ├── "Show me all VMs with Critical CVEs that are internet-facing"
│   ├── "Show me all service accounts that can access PII buckets"
│   ├── "Show me attack paths from internet to database"
│   └── Click on any resource → see full context

Compliance
├── Frameworks: CIS AWS, CIS Azure, CIS GCP, NIST 800-53, SOC2, PCI, HIPAA
├── Per-framework dashboard: pass/fail by control section
├── Drill down: which resources fail which control
├── Export: PDF/CSV for auditors

Inventory
├── All cloud resources across all accounts
├── searchable and filterable
├── Resource detail: metadata, tags, config, related findings

Settings
├── Cloud account connections (connectors)
├── Integration: ServiceNow, Jira, Slack, Splunk, email
├── Automation rules (auto-assign, auto-close, auto-escalate)
├── User management and RBAC
```

## 3.3 Wiz-Specific Terminology Mapping

| Your Existing Knowledge | Wiz Equivalent | Notes |
|------------------------|---------------|-------|
| IOM (Indicator of Misconfiguration) | **Wiz Issue** (type: Configuration) | Same concept, different name |
| IOA (Indicator of Attack) | **Wiz Issue** (type: Threat Detection) | Wiz is less real-time |
| Cloud Risks / Attack Path | **Wiz Attack Path** | Wiz pioneered this feature |
| Compliance page → framework | **Wiz Compliance** module | Same concept |
| Explorer (Falcon) | **Wiz Explorer** (Graph) | Wiz Graph is more powerful |
| KAC (Admission Controller) | **Wiz Admission Controller** | Wiz has its own OPA-based AC |
| Detection → process tree | ❌ Not available in Wiz | Wiz is agentless — no runtime process tree |
| Drift detection | **Wiz Runtime Sensor** (newer) | Optional lightweight sensor for runtime |
| Image Assessment | **Wiz Image Scanning** | Registry + CI/CD integration |
| CCR (Cloud Config Review) | Wiz's compliance scanning engine | Maps to CIS/NIST controls |

## 3.4 Wiz Issues Lifecycle (Findings Management)

```
WIZ ISSUE LIFECYCLE — This is your daily workflow at WF:

                ┌──────────────────────┐
                │   WIZ DETECTS ISSUE  │
                │   (scan runs hourly) │
                └──────────┬───────────┘
                           │
                     ┌─────▼──────┐
                     │   TRIAGE    │
                     │  (FM team)  │
                     └─┬────┬────┬┘
                       │    │    │
              ┌────────▼┐  ┌▼────────┐  ┌──▼──────────┐
              │ TRUE     │  │ FALSE   │  │ DUPLICATE   │
              │ POSITIVE │  │ POSITIVE│  │  / KNOWN     │
              └────┬─────┘  └────┬────┘  └──────┬──────┘
                   │             │               │
          ┌────────▼─────┐ ┌────▼────────┐ ┌────▼────────┐
          │  CREATE SNOW │ │ REJECT      │ │ LINK to     │
          │  TICKET      │ │ with reason │ │ existing    │
          │  (auto or    │ │ (Wiz status │ │ issue       │
          │   manual)    │ │  = Rejected)│ │ (dedup)     │
          └────┬─────────┘ └─────────────┘ └─────────────┘
               │
          ┌────▼─────────┐
          │  ASSIGN TO   │
          │  OWNER       │ ← CMDB lookup → ServiceNow Assignment Group
          │  SET SLA     │ ← Based on severity + exposure
          └────┬─────────┘
               │
          ┌────▼─────────┐
          │  TRACK       │
          │  Monitor SLA │ ← Power BI dashboard
          │  Weekly       │ ← Office hours / remediation meetings
          │  follow-up   │
          └────┬─────────┘
               │
          ┌────▼─────────┐    ┌──────────────┐
          │ REMEDIATED   │◄───│ Wiz re-scans │
          │ (auto-close  │    │ confirms fix │
          │  when Wiz    │    └──────────────┘
          │  resolves)   │
          └──────────────┘
```

## 3.5 Wiz Attack Paths — Key Interview Topic

```
WHAT IS A WIZ ATTACK PATH?

An attack path is a chain of findings that, combined, create an exploit route.

Example Attack Path:
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ Internet   │────►│ VM with    │────►│ SA with    │────►│ GCS Bucket │
│ Exposed    │     │ Critical   │     │ Storage    │     │ with PII   │
│ (Port 443) │     │ CVE        │     │ Admin role │     │ Data       │
└────────────┘     └────────────┘     └────────────┘     └────────────┘

Individual findings:                    Combined attack path:
• Open port → LOW                       CRITICAL
• CVE → HIGH                           (internet → exploit → pivot → data)
• SA over-permissive → MEDIUM
• Bucket has PII → INFO

WHY THIS MATTERS:
Fixing ANY ONE link breaks the entire path.
The FM team prioritizes which link to fix based on effort vs impact.
```

### Interview Answer — Wiz Attack Paths:
> "Attack paths are Wiz's most powerful feature. Instead of treating each finding individually, it chains them into exploit routes — like 'internet-exposed VM with Critical CVE has a service account that can access a PII bucket.' Each individual finding might be medium severity, but the combined path is critical. In findings management, I use attack paths to prioritize remediation — we fix the easiest link in the highest-risk paths first. For example, restricting the service account's permissions breaks the path faster than patching the CVE."

---

# SECTION 4: INTERVIEW ANSWERS FOR AZURE/GCP/WIZ

### Q: "Walk me through how you validate Azure misconfigurations."

> "I validate Azure misconfigurations through both Wiz and Defender for Cloud. For IAM, I check for Global Admins without MFA, stale app registration secrets, and over-permissive custom roles. For networking, I review NSG rules for 0.0.0.0/0 access to SSH/RDP. For storage, I verify Block Public Access is enabled and HTTPS is enforced. Each finding goes through our triage process — I verify it in the Azure portal, determine the owner via CMDB, create a ServiceNow ticket with remediation steps, and track it against SLA in our Power BI dashboard."

### Q: "How do you handle findings in GCP vs Azure?"

> "The processes are identical — triage, assign, track, verify. The differences are in the specific controls: GCP uses Organization Policies instead of Azure Policy, IAM Recommender instead of PIM, and VPC Service Controls for data perimeter security. The misconfigurations are similar — public buckets, open firewall rules, over-permissive service accounts. I adapt my validation commands based on the platform — `gcloud` for GCP, `az` for Azure — but the findings management workflow in ServiceNow and Power BI is the same regardless of cloud provider."

### Q: "What's your experience with Wiz?"

> "I work with Wiz as our primary CNAPP platform — specifically the Issues module for findings triage, the Explorer graph for resource relationship analysis, and the Compliance module for framework-specific auditing. My daily workflow is: review new Critical/High Issues, triage them as TP/FP, create ServiceNow tickets for TPs with CMDB-sourced ownership, track SLA compliance in Power BI, and run weekly remediation meetings with application teams. Wiz's attack path analysis is what I use to prioritize — instead of fixing thousands of individual findings, I focus on breaking the highest-risk attack paths."

---

> **All 3 Parts Complete!** You now have learning notes covering every gap identified in the Wells Fargo JD analysis.
