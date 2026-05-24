# 🛡️ CrowdStrike Falcon CSPM — IOMs, AWS Onboarding, Terraform Drift Remediation & Interview Guide

> **Purpose:** Complete learning guide for writing IOM policies/rules in CrowdStrike Falcon,
> onboarding AWS accounts, remediating misconfigurations/drift via Terraform, and
> acing interview questions on these topics.
> **Last Updated:** April 2026

---

# TABLE OF CONTENTS

| # | Section | Description |
|---|---------|-------------|
| 1 | [Writing IOM Policies & Rules](#part-1-writing-iom-policies--rules-in-crowdstrike-falcon) | How to create, customize, and manage IOM rules |
| 2 | [Onboarding AWS Accounts](#part-2-onboarding-aws-accounts-to-falcon-cspm) | Step-by-step AWS account registration |
| 3 | [Terraform Drift Remediation](#part-3-remediating-misconfigurations--drifts-with-terraform) | Detecting and fixing drift via IaC |
| 4 | [5 Terraform Container Security IOMs](#part-4-5-terraform-based-iom-rules-for-container-security) | Ready-to-use Terraform IOM rules |
| 5 | [Interview Q&A](#part-5-interview-questions--answers) | 25+ interview questions with expert answers |

---

# PART 1: WRITING IOM POLICIES & RULES IN CROWDSTRIKE FALCON

---

## 1.1 Understanding IOMs vs IOAs

```
┌──────────────────────────────────────────────────────────────────┐
│            CrowdStrike Detection Types — Side by Side            │
├──────────────────────────────┬───────────────────────────────────┤
│   IOM (Indicator of         │   IOA (Indicator of               │
│   Misconfiguration)         │   Attack)                         │
├──────────────────────────────┼───────────────────────────────────┤
│ WHAT:  Static config check   │ WHAT:  Behavioral runtime rule    │
│ WHEN:  During scan/assessment│ WHEN:  Real-time during execution │
│ WHERE: Cloud API / IaC       │ WHERE: Running workload/container │
│ SPEED: Point-in-time         │ SPEED: Continuous / live          │
│ EXAMPLE:                     │ EXAMPLE:                          │
│  S3 bucket is public         │  Container spawns reverse shell   │
│  SG allows 0.0.0.0/0:22     │  New binary runs (drift)          │
│  EKS cluster not encrypted   │  Crypto mining process detected   │
│  Pod runs as root            │  Container escape via nsenter     │
├──────────────────────────────┼───────────────────────────────────┤
│ ACTION: Alert + Jira ticket  │ ACTION: Alert + PREVENT (kill)    │
│ FIX: Change config / IaC     │ FIX: Kill process + investigate   │
└──────────────────────────────┴───────────────────────────────────┘
```

## 1.2 IOM Policy Architecture in Falcon

```
FALCON CLOUD SECURITY → CONFIGURATION ASSESSMENT → POLICIES
│
├── POLICY GROUP (e.g., "AWS Production Security Standards")
│   ├── RULE 1: S3 bucket must not be publicly accessible
│   │   ├── Severity: CRITICAL
│   │   ├── Cloud Provider: AWS
│   │   ├── Service: S3
│   │   ├── Check Logic: BucketPublicAccess != "enabled"
│   │   ├── Compliance: CIS AWS 2.1.5, PCI DSS 1.3.4
│   │   └── Action: ALERT
│   │
│   ├── RULE 2: Security Group must not allow 0.0.0.0/0 to port 22
│   │   ├── Severity: CRITICAL
│   │   ├── Cloud Provider: AWS
│   │   ├── Service: EC2 (Security Group)
│   │   ├── Check Logic: IngressRule.cidr == "0.0.0.0/0" AND port == 22
│   │   ├── Compliance: CIS AWS 5.2.1
│   │   └── Action: ALERT
│   │
│   └── RULE N: [Additional rules...]
│
├── POLICY GROUP (e.g., "Kubernetes Container Standards")
│   ├── RULE 1: Containers must not run as privileged
│   ├── RULE 2: Containers must not run as root
│   └── RULE N: [Additional rules...]
│
└── POLICY GROUP (e.g., "Compliance — CIS Benchmarks")
    ├── CIS AWS Foundations 3.0
    ├── CIS EKS Benchmark 1.4
    └── CIS Docker Benchmark 1.6
```

## 1.3 Step-by-Step: Creating IOM Policies in Falcon Console

### Method 1: Customize Built-In Policies (Recommended Start)

```
STEP 1: NAVIGATE TO POLICIES
├── Falcon Console → Cloud Security → Configuration Assessment
├── Click "Policies" tab
└── You'll see built-in policy groups organized by:
    ├── Cloud Provider (AWS / Azure / GCP)
    ├── Service (IAM, S3, EC2, EKS, RDS, etc.)
    └── Compliance Framework (CIS, NIST, PCI, SOC2)

STEP 2: SELECT A POLICY GROUP
├── Example: Select "AWS > S3 > Security Best Practices"
├── You'll see individual rules within this group
└── Each rule shows:
    ├── Rule Name
    ├── Description
    ├── Default Severity (Informational / Low / Medium / High / Critical)
    ├── Compliance Mappings
    └── Current State (Enabled / Disabled)

STEP 3: CUSTOMIZE SEVERITY
├── Click on a rule (e.g., "S3 Bucket Has Public Access")
├── Change severity from HIGH to CRITICAL (for financial org compliance)
├── Add custom compliance mapping (e.g., map to SOX requirement)
├── Justification: "Financial data in S3 — public access = regulatory violation"
└── Save

STEP 4: ENABLE/DISABLE RULES PER YOUR ENVIRONMENT
├── Disable rules that don't apply:
│   ├── "GCP Dataflow not using CMEK" → Not applicable (we don't use GCP)
│   └── "Azure NSG allows SSH from any" → Not applicable (AWS only)
├── Enable rules that were off by default:
│   └── "EKS cluster endpoint is publicly accessible" → Enable + set CRITICAL
└── Document every disable with justification in a config spreadsheet

STEP 5: ASSIGN TO ACCOUNTS/REGIONS
├── Assign policy group to specific AWS accounts:
│   ├── "Production Accounts" → All rules enforced
│   ├── "Dev/Test Accounts" → Relaxed severity (Critical → High)
│   └── "Sandbox Accounts" → Alert only, no escalation
└── Save and activate
```

### Method 2: Clone and Modify Existing Policies

```
STEP 1: FIND A SIMILAR BUILT-IN POLICY
├── Example: You want a custom rule for "EBS volumes must use CMK, not default aws/ebs"
├── Built-in rule exists: "EBS volume is unencrypted" (checks encryption on/off)
└── But you need MORE specific: must use Customer-Managed Key (CMK)

STEP 2: CLONE THE POLICY
├── Click the existing rule → "Clone"
├── New rule created: "EBS Volume Must Use Customer-Managed Key (Custom)"
├── Modify the check logic:
│   ├── Original: Encrypted = true
│   └── Custom:   Encrypted = true AND KmsKeyId != "alias/aws/ebs"
└── This checks not just that encryption is on, but that it uses YOUR key

STEP 3: SET CUSTOM METADATA
├── Name: "EBS CMK Encryption Required — Finance Standard"
├── Severity: HIGH
├── Description: "EBS volumes must be encrypted with organization CMK for key 
│   rotation control. Default aws/ebs key does not meet SOX requirements."
├── Compliance: SOX Section 302, PCI DSS 3.4
└── Tags: finance, encryption, ebs, custom

STEP 4: ENABLE AND TEST
├── Enable in "Alert Only" mode for 2 weeks
├── Review findings → How many EBS volumes use default key?
├── Work with teams to migrate to CMK
└── Graduate to standard monitoring after migration complete
```

### Method 3: Create Custom Policies from Scratch

```
STEP 1: NAVIGATE TO CUSTOM POLICIES
├── Cloud Security → Configuration Assessment → Custom Policies
└── Click "Create New Custom Policy"

STEP 2: DEFINE THE POLICY
├── Name: "Tag Compliance — Mandatory Tags Required"
├── Cloud Provider: AWS
├── Service: All Services
├── Severity: MEDIUM
├── Description: "All cloud resources must have mandatory tags: Owner, 
│   Environment, CostCenter, DataClassification"

STEP 3: DEFINE THE RULE LOGIC
├── Check: Resource must have ALL of these tags:
│   ├── "Owner" — must not be empty
│   ├── "Environment" — must be one of: production, staging, dev, sandbox
│   ├── "CostCenter" — must match pattern: CC-[0-9]{4}
│   └── "DataClassification" — must be one of: public, internal, confidential, restricted
├── Scope: All resource types in all accounts
└── Exceptions: Resources in "sandbox" accounts exempt from CostCenter tag

STEP 4: MAP TO COMPLIANCE FRAMEWORK
├── Internal Standard: "Cloud Governance Policy v2.3"
├── NIST CSF: ID.AM-2 (Software platforms and applications are inventoried)
└── CIS AWS: Custom (tag governance)

STEP 5: CONFIGURE NOTIFICATIONS
├── Critical/High IOMs → Jira ticket auto-created
├── Medium IOMs → Weekly summary email to resource owners
└── Informational → Dashboard visibility only
```

## 1.4 Severity Customization Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SEVERITY OVERRIDE GUIDE — When to Change Default Severity              │
├──────────────────────────────┬─────────────┬────────────┬──────────────┤
│  Rule                        │ CrowdStrike │ Our Custom │ Why          │
│                              │ Default     │ Override   │              │
├──────────────────────────────┼─────────────┼────────────┼──────────────┤
│ S3 public access             │ HIGH        │ 🔴 CRITICAL │ PCI/GLBA     │
│ RDS publicly accessible      │ HIGH        │ 🔴 CRITICAL │ SOX/PCI      │
│ SG allows 0.0.0.0/0 SSH     │ CRITICAL    │ 🔴 CRITICAL │ CIS 5.2      │
│ Root account has access keys │ CRITICAL    │ 🔴 CRITICAL │ CIS 1.4      │
│ CloudTrail not all regions   │ MEDIUM      │ 🔴 CRITICAL │ NYDFS/SOX    │
│ IAM user without MFA         │ HIGH        │ 🔴 CRITICAL │ NYDFS mandate│
│ EBS unencrypted              │ HIGH        │ 🟠 HIGH     │ PCI Req 3    │
│ S3 without versioning        │ MEDIUM      │ 🟡 MEDIUM   │ Best practice│
│ Missing tags                 │ LOW         │ 🟡 MEDIUM   │ Governance   │
│ EKS public endpoint          │ HIGH        │ 🔴 CRITICAL │ CIS EKS      │
│ Pod running as root          │ HIGH        │ 🔴 CRITICAL │ Container sec│
│ No network policy            │ MEDIUM      │ 🟠 HIGH     │ Micro-seg    │
└──────────────────────────────┴─────────────┴────────────┴──────────────┘
```

## 1.5 IOM Policy Governance Workflow

```
NEW IOM DISCOVERED IN ENVIRONMENT
        │
        ▼
┌───────────────┐
│  TRIAGE       │ ← Security analyst reviews the finding
│  TP or FP?    │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
TRUE POS   FALSE POS
   │         │
   │         ▼
   │    ┌──────────────┐
   │    │ Create scoped │
   │    │ exception:    │
   │    │ • Resource ARN│
   │    │ • Justification│
   │    │ • 90-day expiry│
   │    │ • Reviewer     │
   │    └──────────────┘
   │
   ▼
┌──────────────────┐
│ DETERMINE OWNER  │ ← Resource tags → team → Jira assignee
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ CREATE TICKET    │ ← Auto via Jira/ServiceNow integration
│ • IOM details    │
│ • Resource ARN   │
│ • Fix steps      │
│ • SLA deadline   │
│ • Terraform fix  │
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ TRACK SLA        │
│ Critical: 4h     │
│ High:     24h    │
│ Medium:   7 days │
│ Low:      30 days│
└───────┬──────────┘
        │
        ▼
┌──────────────────┐
│ VERIFY FIX       │ ← Falcon re-scans → IOM resolves automatically
│ Close ticket     │
│ Update metrics   │
└──────────────────┘
```

---

# PART 2: ONBOARDING AWS ACCOUNTS TO FALCON CSPM

---

## 2.1 Prerequisites

```
BEFORE YOU START — CHECKLIST
├── ☐ CrowdStrike Falcon subscription with Cloud Security module enabled
├── ☐ Falcon console admin access (or Cloud Security Admin role)
├── ☐ AWS account with admin/CloudFormation access
├── ☐ For AWS Organization: Management Account access
├── ☐ Decision: Individual account vs. Organization-wide onboarding
└── ☐ API Client credentials (created in Step 1 below)
```

## 2.2 Step-by-Step: AWS Account Onboarding

### Step 1: Create API Client in Falcon

```
FALCON CONSOLE → SUPPORT & RESOURCES → API CLIENTS AND KEYS

1. Click "Add New API Client"
2. Configure:
   ├── Client Name: "AWS-CSPM-Registration"
   ├── Description: "API client for CSPM AWS account registration"
   └── Scopes:
       ├── Cloud Security Registration → READ + WRITE
       ├── CSPM Registration → READ + WRITE
       └── Cloud Security Accounts → READ + WRITE

3. Click "Create"
4. ⚠️ SAVE THE CLIENT ID AND SECRET IMMEDIATELY
   ├── Client ID:     abc123def456.....
   └── Client Secret: xxxxxxxxxxxxxx (shown ONCE only)
   
5. Store securely:
   ├── AWS Secrets Manager (recommended)
   ├── HashiCorp Vault
   └── NOT in plaintext, NOT in code, NOT in Slack
```

### Step 2: Register AWS Account in Falcon Console

```
METHOD A: CONSOLE-GUIDED (RECOMMENDED FOR FIRST-TIME)
═══════════════════════════════════════════════════════

1. NAVIGATE:
   Falcon Console → Cloud Security → Cloud Account Registration
   
2. CLICK: "Register Cloud Account" → Select "AWS"

3. CHOOSE REGISTRATION TYPE:
   ├── Option A: "Single Account" — Register one AWS account
   └── Option B: "AWS Organization" — Register all accounts at once
       (Recommended for enterprise — uses AWS StackSets)

4. SELECT FEATURES TO ENABLE:
   ┌─────────────────────────────────┬──────────────────────────────┐
   │ Feature                         │ Description                  │
   ├─────────────────────────────────┼──────────────────────────────┤
   │ ☑ CSPM (Posture Management)     │ Configuration assessment     │
   │ ☑ IOM Detection                 │ Misconfiguration detection   │
   │ ☑ Behavioral Assessment (IOA)   │ Runtime threat detection     │
   │ ☑ Identity Protection           │ IAM/Identity risk analysis   │
   │ ☐ Sensor Management             │ Agent-based protection       │
   │ ☐ Data Security Posture (DSPM)  │ Sensitive data discovery     │
   └─────────────────────────────────┴──────────────────────────────┘
   
5. PROVIDE AWS DETAILS:
   ├── AWS Account ID: 123456789012
   ├── AWS Account Name: "Production-Main" (for your reference)
   └── For Organization: AWS Organization ID (ou-xxxx-xxxxxxxx)

6. FALCON GENERATES A CLOUDFORMATION TEMPLATE
   ├── Template contains:
   │   ├── IAM Role: "CrowdStrikeCSPMRole" (cross-account)
   │   ├── IAM Policy: Read-only permissions for scanning
   │   ├── Trust Relationship: CrowdStrike's AWS account
   │   └── External ID: Unique per registration (anti-confused deputy)
   │
   └── Click: "Open in AWS CloudFormation" (opens new tab)
```

### Step 3: Deploy CloudFormation Stack in AWS

```
AWS CONSOLE → CLOUDFORMATION → CREATE STACK
═══════════════════════════════════════════

1. The CloudFormation URL from Falcon auto-fills the template

2. REVIEW PARAMETERS:
   ├── CrowdStrike Falcon Client ID: (auto-populated)
   ├── CrowdStrike Falcon Client Secret: (enter from Step 1)
   ├── External ID: (auto-populated — unique per registration)
   ├── Enable IOA: true
   ├── Enable IOM: true
   └── Log Archive Region: us-east-1 (or your region)

3. ACKNOWLEDGE IAM CAPABILITIES:
   ├── ☑ "I acknowledge that AWS CloudFormation might create IAM resources"
   └── ☑ "I acknowledge that AWS CloudFormation might create IAM resources
        with custom names"

4. CLICK "CREATE STACK"

5. WAIT FOR STATUS: CREATE_COMPLETE (usually 3-5 minutes)
   ├── Outputs tab will show:
   │   ├── RoleARN: arn:aws:iam::123456789012:role/CrowdStrikeCSPMRole
   │   ├── ExternalID: cs-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   │   └── EventBridge Rule ARN (for IOA behavioral scanning)
   └── If FAILED: Check Events tab for the specific error
        (usually IAM permission issue or duplicate role name)

FOR AWS ORGANIZATION (ALL ACCOUNTS):
├── The template uses AWS StackSets to deploy to all member accounts
├── StackSet deployment status visible in CloudFormation → StackSets
├── New accounts added later → auto-enrolled via StackSet
└── Delegated admin account can manage without management account
```

### Step 4: Verify Registration in Falcon

```
BACK IN FALCON CONSOLE:
═══════════════════════

1. VERIFY ACCOUNT APPEARS:
   Cloud Security → Cloud Account Registration
   ├── Account ID: 123456789012
   ├── Status: ✅ Connected
   ├── Features: CSPM ✅, IOA ✅, Identity ✅
   └── Last Scan: Just now / In progress

2. WAIT FOR FIRST SCAN (15-30 minutes):
   ├── Cloud Security → Configuration Assessment → Dashboard
   ├── You'll see initial findings populate
   └── Baseline metrics established

3. VERIFY PERMISSIONS:
   ├── Cloud Security → Health & Diagnostics
   │   ├── All checks green = good
   │   ├── Yellow/Red = missing permissions → review IAM policy
   │   └── Common issue: missing s3:GetBucketPolicy / ec2:DescribeSecurityGroups

4. INITIAL BASELINE:
   ├── First scan will likely show hundreds of IOMs
   ├── Don't panic — this is your starting point
   ├── Focus on: Critical + Internet-facing first
   └── Create a remediation plan (see Part 3)
```

### Alternative: Terraform-Based Onboarding

```hcl
# ==================================================================
# METHOD B: TERRAFORM ONBOARDING (RECOMMENDED FOR IaC-FIRST ORGS)
# ==================================================================

# 1. Configure the CrowdStrike Provider
terraform {
  required_providers {
    crowdstrike = {
      source  = "crowdstrike/crowdstrike"
      version = "~> 1.0"
    }
  }
}

provider "crowdstrike" {
  client_id     = var.falcon_client_id      # From API Client creation
  client_secret = var.falcon_client_secret   # From API Client creation
  cloud         = "us-1"                     # us-1, us-2, eu-1, etc.
}

# 2. Register the AWS Account
resource "crowdstrike_cloud_aws_account" "production" {
  account_id        = "123456789012"
  organization_id   = "o-xxxxxxxxxx"         # Optional: for org-wide
  
  # Features to enable
  cspm_enabled      = true
  behavior_assessment_enabled = true
  sensor_management_enabled   = false
  
  # Account metadata
  account_type      = "commercial"           # commercial or gov-cloud
}

# 3. Create the IAM Role in AWS (using AWS provider)
provider "aws" {
  region = "us-east-1"
}

module "crowdstrike_cspm" {
  source  = "crowdstrike/cloud-registration/aws"
  version = "~> 1.0"

  falcon_client_id  = var.falcon_client_id
  external_id       = crowdstrike_cloud_aws_account.production.external_id
  
  enable_iom        = true
  enable_ioa        = true
  enable_idp        = true
  
  # Optional: Limit scanning to specific regions
  # target_regions  = ["us-east-1", "us-west-2", "eu-west-1"]
}

# 4. Variables
variable "falcon_client_id" {
  type        = string
  description = "CrowdStrike Falcon API Client ID"
  sensitive   = true
}

variable "falcon_client_secret" {
  type        = string
  description = "CrowdStrike Falcon API Client Secret"
  sensitive   = true
}

# 5. Outputs
output "cspm_role_arn" {
  value = module.crowdstrike_cspm.iam_role_arn
}

output "registration_status" {
  value = crowdstrike_cloud_aws_account.production.status
}
```

## 2.3 Post-Onboarding Checklist

```
AFTER SUCCESSFUL ONBOARDING — OPERATIONAL SETUP
════════════════════════════════════════════════

☐ SCAN RESULTS REVIEW (Day 1)
   ├── Review initial IOM count by severity
   ├── Identify false positives from environment-specific configs
   ├── Create exceptions for known acceptable risks (with documentation)
   └── Set baseline metrics for tracking improvement

☐ NOTIFICATION SETUP (Day 1-2)
   ├── Critical IOMs → PagerDuty/OpsGenie → SOC on-call
   ├── High IOMs → Slack #cloud-security channel
   ├── Medium/Low IOMs → Weekly digest email to team leads
   └── New account registration alerts → Security team

☐ INTEGRATION SETUP (Week 1)
   ├── Jira integration → Auto-create tickets for Critical/High
   ├── SIEM integration → Forward IOMs to Splunk/Sentinel
   ├── Slack integration → Real-time notifications
   └── ServiceNow → CMDB mapping for asset ownership

☐ POLICY TUNING (Week 1-2)
   ├── Customize severity for your compliance requirements
   ├── Disable irrelevant rules (services not in use)
   ├── Enable additional rules missed by defaults
   └── Map policies to your compliance frameworks

☐ TEAM ONBOARDING (Week 2)
   ├── Create read-only roles for DevOps teams
   ├── Train teams on interpreting IOMs
   ├── Share remediation runbooks
   └── Establish SLA expectations

☐ ONGOING MONITORING (Monthly)
   ├── Review IOM trends — are we improving?
   ├── Audit exception list — any expired?
   ├── Check for new CrowdStrike rule updates
   └── Report posture metrics to leadership
```

---

# PART 3: REMEDIATING MISCONFIGURATIONS & DRIFTS WITH TERRAFORM

---

## 3.1 Understanding Configuration Drift

```
WHAT IS DRIFT?
══════════════

Drift = When live cloud state ≠ what's defined in your Terraform code

HOW DRIFT HAPPENS:
├── 1. Console Cowboy: Engineer changes SG rule directly in AWS Console
├── 2. CLI Quick Fix: Someone runs `aws ec2 authorize-security-group-ingress` manually
├── 3. Another Tool: A different automation tool modifies the same resource
├── 4. Emergency Fix: Incident response team opens ports during an incident
└── 5. AWS Auto-Changes: Service updates, default changes, deprecations

WHY DRIFT IS A SECURITY RISK:
├── Terraform doesn't know about the manual change
├── Next `terraform apply` may OVERWRITE the change (or not — depends on state)
├── Manual changes bypass code review, PR approval, and security scanning
├── IOMs in Falcon fire on the drifted resource — but the IaC looks clean
└── Compliance auditors see different configs in IaC vs. live environment

DRIFT DETECTION CHAIN:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Terraform│    │Falcon    │    │ Security │    │  Fix in  │
│ State    │ →  │ CSPM     │ →  │ Analyst  │ →  │ Terraform│
│ (desired)│    │ (actual) │    │ (triage) │    │ (source) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     ↕                ↕
  "SG allows       "SG allows
   10.0.0.0/8"     0.0.0.0/0"
                        ↑
                  DRIFT DETECTED!
```

## 3.2 Drift Detection Workflow

```
COMPLETE DRIFT DETECTION & REMEDIATION WORKFLOW
════════════════════════════════════════════════

STEP 1: FALCON DETECTS THE IOM
├── CrowdStrike Falcon CSPM scans the AWS account
├── Finds: Security Group sg-0abc123 allows 0.0.0.0/0 on port 22
├── Creates IOM: "Security Group allows unrestricted SSH access"
├── Severity: 🔴 CRITICAL
└── Notification sent via configured channel

STEP 2: ANALYST DETERMINES IF THIS IS DRIFT OR BAD IaC
├── Check 1: Look at resource tags
│   ├── Tag: terraform:workspace = "vpc-production"
│   ├── Tag: terraform:module = "security-groups"
│   └── This tells us: resource IS managed by Terraform
│
├── Check 2: Compare with Terraform code
│   ├── Open the relevant .tf file in the repo
│   ├── Find the resource: aws_security_group_rule.ssh_access
│   ├── Code says: cidr_blocks = ["10.0.0.0/8"]
│   └── Live says: cidr_blocks = ["0.0.0.0/0"]
│   ├── VERDICT: THIS IS DRIFT — someone changed it manually
│
├── Check 3: Find who made the change
│   ├── AWS CloudTrail → Filter: AuthorizeSecurityGroupIngress
│   ├── Resource: sg-0abc123
│   ├── User: arn:aws:iam::123456789012:user/john.doe
│   ├── Time: 2026-04-10 03:22:00 UTC (during incident response)
│   └── Source IP: 10.1.2.3 (corporate VPN)
│
└── VERDICT: John opened SSH during an incident and forgot to close it

STEP 3: FIX IN TERRAFORM (NOT IN CONSOLE!)
├── Option A: Run terraform plan → see drift → terraform apply to revert
├── Option B: Update Terraform code if the change was intentional
└── ⚠️ NEVER FIX DRIFT IN THE CONSOLE — it will drift again!
```

## 3.3 Terraform Drift Detection Commands

```bash
# ==================================================================
# TERRAFORM DRIFT DETECTION COMMANDS
# ==================================================================

# 1. DETECT DRIFT — See what changed vs. Terraform state
terraform plan -refresh-only
# Output shows resources that changed outside Terraform

# 2. DETAILED DRIFT REPORT
terraform plan -refresh-only -detailed-exitcode
# Exit codes:
#   0 = No changes
#   1 = Error
#   2 = Changes detected (DRIFT EXISTS!)

# 3. REFRESH STATE (Accept current live state into Terraform state)
# ⚠️ USE ONLY IF the manual change was INTENTIONAL and you want to KEEP it
terraform apply -refresh-only

# 4. REVERT DRIFT (Apply original Terraform config to overwrite manual changes)
terraform apply
# This will show the changes needed to bring live → match code
# Review carefully before approving!

# 5. TARGETED DRIFT CHECK (Single resource)
terraform plan -target=aws_security_group.main
# Only checks drift on the specified resource

# 6. IMPORT UNMANAGED RESOURCES
# If a resource was created manually and needs to be Terraform-managed:
terraform import aws_security_group.manually_created sg-0abc123
# Then write the corresponding .tf code to match the live config
```

## 3.4 Common Misconfiguration Remediations in Terraform

### Remediation 1: S3 Bucket Public Access (IOM: S3 Public)

```hcl
# ❌ MISCONFIGURATION — S3 bucket without public access block
resource "aws_s3_bucket" "data" {
  bucket = "my-app-data-bucket"
}

# ✅ REMEDIATION — Add public access block + encryption
resource "aws_s3_bucket" "data" {
  bucket = "my-app-data-bucket"
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket = aws_s3_bucket.data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_key.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_logging" "data" {
  bucket        = aws_s3_bucket.data.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access-logs/data-bucket/"
}
```

### Remediation 2: Security Group Open SSH (IOM: Open SG)

```hcl
# ❌ MISCONFIGURATION — SSH open to the world
resource "aws_security_group_rule" "ssh" {
  type              = "ingress"
  security_group_id = aws_security_group.app.id
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]    # ← CRITICAL IOM
}

# ✅ REMEDIATION — Option A: Restrict to corporate CIDR
resource "aws_security_group_rule" "ssh" {
  type              = "ingress"
  security_group_id = aws_security_group.app.id
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["10.0.0.0/8"]    # Corporate network only
  description       = "SSH from corporate VPN only"
}

# ✅ REMEDIATION — Option B: Remove SSH entirely, use SSM
# (BETTER — no inbound ports needed at all)
# Delete the SSH security group rule entirely
# Add SSM IAM policy to instance role instead:

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
```

### Remediation 3: RDS Publicly Accessible (IOM: Public Database)

```hcl
# ❌ MISCONFIGURATION
resource "aws_db_instance" "app_db" {
  identifier     = "app-database"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  publicly_accessible = true           # ← CRITICAL IOM
  storage_encrypted   = false          # ← HIGH IOM
}

# ✅ REMEDIATION
resource "aws_db_instance" "app_db" {
  identifier          = "app-database"
  engine              = "postgres"
  instance_class      = "db.t3.medium"
  publicly_accessible = false                              # Fix 1: Private only
  storage_encrypted   = true                               # Fix 2: Encrypted
  kms_key_id          = aws_kms_key.rds_key.arn           # Fix 3: CMK
  db_subnet_group_name = aws_db_subnet_group.private.name # Fix 4: Private subnet
  
  # Additional security hardening
  deletion_protection = true
  backup_retention_period = 7
  multi_az            = true
  
  # Performance Insights (for monitoring)
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.rds_key.arn
}
```

### Remediation 4: IAM User with Access Keys (IOM: IAM Risk)

```hcl
# ❌ MISCONFIGURATION — IAM user with long-lived access keys
resource "aws_iam_user" "deploy_user" {
  name = "cicd-deploy-user"
}

resource "aws_iam_access_key" "deploy_key" {
  user = aws_iam_user.deploy_user.name
  # ← Long-lived credential — HIGH RISK
}

# ✅ REMEDIATION — Use OIDC federation for CI/CD
# Delete the IAM user and access keys
# Replace with OIDC provider for GitHub Actions:

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:myorg/myrepo:ref:refs/heads/main"
        }
      }
    }]
  })
}
# Result: No long-lived credentials, scoped to specific repo/branch
```

### Remediation 5: EKS Public Endpoint (IOM: EKS Exposure)

```hcl
# ❌ MISCONFIGURATION
resource "aws_eks_cluster" "main" {
  name     = "prod-cluster"
  role_arn = aws_iam_role.eks.arn

  vpc_config {
    endpoint_private_access = false    # ← Can't access from VPC
    endpoint_public_access  = true     # ← Open to internet!
    public_access_cidrs     = ["0.0.0.0/0"]  # ← All IPs!
  }
}

# ✅ REMEDIATION
resource "aws_eks_cluster" "main" {
  name     = "prod-cluster"
  role_arn = aws_iam_role.eks.arn

  vpc_config {
    endpoint_private_access = true                  # Fix 1: VPC access
    endpoint_public_access  = true                  # Still needed for kubectl
    public_access_cidrs     = [                     # Fix 2: Restrict CIDRs
      "10.0.0.0/8",                                 # Corporate network
      "203.0.113.50/32"                             # VPN exit IP
    ]
    subnet_ids              = var.private_subnet_ids # Fix 3: Private subnets
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  # Fix 4: Enable control plane logging
  enabled_cluster_log_types = [
    "api", "audit", "authenticator", "controllerManager", "scheduler"
  ]

  # Fix 5: Encryption
  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }
}
```

## 3.5 Automated Drift Prevention Pipeline

```yaml
# ==================================================================
# CI/CD PIPELINE — PREVENT DRIFT & MISCONFIGURATIONS
# ==================================================================
# .github/workflows/terraform-security.yml

name: Terraform Security Pipeline

on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      # Step 1: IaC Security Scanning (Pre-Deploy)
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Checkov IaC Scan
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          framework: terraform
          output_format: junitxml
          soft_fail: false          # FAIL the build on violations
          skip_check: ""            # No skips by default
          check: >
            CKV_AWS_145,CKV_AWS_24,CKV_AWS_18,CKV_AWS_19,
            CKV_AWS_23,CKV_AWS_79,CKV_AWS_130,CKV_K8S_1,
            CKV_K8S_8,CKV_K8S_20

      # Step 2: Terraform Plan (Detect Drift)
      - name: Terraform Init
        run: terraform init -backend-config=backend.hcl
        working-directory: terraform/

      - name: Terraform Plan
        run: terraform plan -out=plan.tfplan -detailed-exitcode
        working-directory: terraform/
        continue-on-error: true

      # Step 3: Drift Alert
      - name: Alert on Drift
        if: steps.plan.outputs.exitcode == 2
        run: |
          echo "⚠️ DRIFT DETECTED — Live infrastructure differs from code!"
          echo "Review the plan output and verify changes are intentional."
          # Send Slack notification
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"🚨 Terraform Drift Detected in production!"}'

      # Step 4: CrowdStrike Falcon IaC Scan (Optional — if using Falcon IaC)
      - name: Falcon IaC Scan
        uses: crowdstrike/falcon-iac-scan@v1
        with:
          falcon_client_id: ${{ secrets.FALCON_CLIENT_ID }}
          falcon_client_secret: ${{ secrets.FALCON_CLIENT_SECRET }}
          path: terraform/
          fail_on: high    # Fail on HIGH and CRITICAL
```

---

# PART 4: 5 TERRAFORM-BASED IOM RULES FOR CONTAINER SECURITY

---

> **Context:** These 5 Terraform configurations define IOM rules that detect
> container security misconfigurations. Each includes the insecure config,
> the Falcon IOM that triggers, and the Terraform remediation.

## IOM Rule 1: Privileged Container Detection

```
┌─────────────────────────────────────────────────────────────┐
│  IOM RULE #1: PRIVILEGED CONTAINER DETECTED                  │
├─────────────────────────────────────────────────────────────┤
│  SEVERITY:     🔴 CRITICAL                                   │
│  CIS BENCHMARK: CIS Kubernetes 5.2.1                         │
│  MITRE ATT&CK:  T1611 (Escape to Host)                      │
│  FALCON RULE:   "Container running with privileged flag"     │
│  RISK:          Container has FULL host kernel access         │
│                 — attacker can escape to node                │
└─────────────────────────────────────────────────────────────┘
```

```hcl
# ==================================================================
# IOM #1: PRIVILEGED CONTAINER — TERRAFORM (KAC Policy)
# ==================================================================

# --- CrowdStrike KAC Policy: Block Privileged Containers ---
resource "crowdstrike_cloud_security_kac_policy" "block_privileged" {
  name        = "Block Privileged Containers — Production"
  description = "Prevents deployment of containers with privileged: true"
  enabled     = true

  rule_groups {
    name   = "privileged-container-block"
    action = "prevent"  # Block deployment (use "alert" for monitoring phase)
    
    rules {
      privileged_container = "enabled"
    }
  }

  # Assign to production clusters only
  cluster_groups = ["production-eks-clusters"]
  
  # Exceptions for system components
  exceptions {
    namespace = "kube-system"
    reason    = "CNI plugins require privileged for network setup"
  }
  exceptions {
    namespace = "falcon-system"
    reason    = "Falcon sensor DaemonSet requires privileged for monitoring"
  }
}

# --- Terraform Configuration That TRIGGERS This IOM ---
# This Kubernetes deployment will be BLOCKED by the KAC policy above

resource "kubernetes_deployment" "insecure_app" {
  metadata {
    name      = "payment-api"
    namespace = "payments"
  }
  spec {
    replicas = 2
    selector {
      match_labels = { app = "payment-api" }
    }
    template {
      metadata {
        labels = { app = "payment-api" }
      }
      spec {
        container {
          name  = "payment-api"
          image = "123456.dkr.ecr.us-east-1.amazonaws.com/payment-api:v2.1"
          
          security_context {
            privileged = true   # ← THIS TRIGGERS IOM #1
            # Falcon KAC intercepts this → DEPLOYMENT REJECTED
          }
        }
      }
    }
  }
}

# --- REMEDIATED Terraform (Passes IOM Check) ---
resource "kubernetes_deployment" "secure_app" {
  metadata {
    name      = "payment-api"
    namespace = "payments"
  }
  spec {
    replicas = 2
    selector {
      match_labels = { app = "payment-api" }
    }
    template {
      metadata {
        labels = { app = "payment-api" }
      }
      spec {
        container {
          name  = "payment-api"
          image = "123456.dkr.ecr.us-east-1.amazonaws.com/payment-api:v2.1"
          
          security_context {
            privileged                 = false    # ✅ Not privileged
            run_as_non_root            = true     # ✅ Non-root user
            read_only_root_filesystem  = true     # ✅ Read-only fs
            allow_privilege_escalation = false     # ✅ No escalation
            
            capabilities {
              drop = ["ALL"]                      # ✅ Drop all caps
              add  = ["NET_BIND_SERVICE"]         # ✅ Only what's needed
            }
          }
        }
      }
    }
  }
}
```

## IOM Rule 2: Container Running as Root User

```
┌─────────────────────────────────────────────────────────────┐
│  IOM RULE #2: CONTAINER RUNNING AS ROOT                      │
├─────────────────────────────────────────────────────────────┤
│  SEVERITY:     🟠 HIGH                                       │
│  CIS BENCHMARK: CIS Kubernetes 5.2.6                         │
│  MITRE ATT&CK:  T1078 (Valid Accounts — Default Accounts)   │
│  FALCON RULE:   "Container process running as UID 0"        │
│  RISK:          Root in container = easier escape,           │
│                 mount host paths, access secrets             │
└─────────────────────────────────────────────────────────────┘
```

```hcl
# ==================================================================
# IOM #2: ROOT USER IN CONTAINER — TERRAFORM (KAC Policy)
# ==================================================================

resource "crowdstrike_cloud_security_kac_policy" "block_root_user" {
  name        = "Enforce Non-Root Containers — All Clusters"
  description = "Blocks containers that run as root (UID 0)"
  enabled     = true

  rule_groups {
    name   = "root-user-block"
    action = "prevent"
    
    rules {
      run_as_root_user = "enabled"
    }
  }

  cluster_groups = ["all-eks-clusters"]
  
  exceptions {
    namespace = "kube-system"
    reason    = "CoreDNS and kube-proxy require root for port binding"
  }
}

# --- Terraform That TRIGGERS This IOM ---
resource "kubernetes_deployment" "root_app" {
  metadata {
    name      = "data-processor"
    namespace = "analytics"
  }
  spec {
    replicas = 3
    selector {
      match_labels = { app = "data-processor" }
    }
    template {
      metadata {
        labels = { app = "data-processor" }
      }
      spec {
        container {
          name  = "processor"
          image = "123456.dkr.ecr.us-east-1.amazonaws.com/data-processor:v1.5"
          
          # ❌ NO securityContext defined
          # → Container runs as whatever USER is in Dockerfile
          # → If Dockerfile has no USER instruction → runs as ROOT
          # → THIS TRIGGERS IOM #2
        }
      }
    }
  }
}

# --- REMEDIATED Terraform ---
resource "kubernetes_deployment" "secure_root_app" {
  metadata {
    name      = "data-processor"
    namespace = "analytics"
  }
  spec {
    replicas = 3
    selector {
      match_labels = { app = "data-processor" }
    }
    template {
      metadata {
        labels = { app = "data-processor" }
      }
      spec {
        security_context {
          run_as_non_root = true       # ✅ Pod-level: enforce non-root
          run_as_user     = 1000       # ✅ Explicit non-root UID
          run_as_group    = 1000       # ✅ Explicit non-root GID
          fs_group        = 1000       # ✅ Volume ownership
          
          seccomp_profile {
            type = "RuntimeDefault"    # ✅ Default seccomp profile
          }
        }

        container {
          name  = "processor"
          image = "123456.dkr.ecr.us-east-1.amazonaws.com/data-processor:v1.5"
          
          security_context {
            run_as_non_root            = true
            read_only_root_filesystem  = true
            allow_privilege_escalation = false
            capabilities {
              drop = ["ALL"]
            }
          }
          
          # Writable directories via volumes only
          volume_mount {
            name       = "tmp"
            mount_path = "/tmp"
          }
        }
        
        volume {
          name = "tmp"
          empty_dir {}  # Ephemeral writable volume
        }
      }
    }
  }
}
```

## IOM Rule 3: Host Docker Socket Mounted in Container

```
┌─────────────────────────────────────────────────────────────┐
│  IOM RULE #3: DOCKER SOCKET MOUNTED IN CONTAINER             │
├─────────────────────────────────────────────────────────────┤
│  SEVERITY:     🔴 CRITICAL                                   │
│  CIS BENCHMARK: CIS Docker 5.31                              │
│  MITRE ATT&CK:  T1610 (Deploy Container via API)            │
│  FALCON RULE:   "Container mounting host runtime socket"     │
│  RISK:          Pod with docker.sock can spawn new           │
│                 privileged containers on the host            │
│                 — equivalent to full host compromise         │
└─────────────────────────────────────────────────────────────┘
```

```hcl
# ==================================================================
# IOM #3: DOCKER SOCKET MOUNT — TERRAFORM (KAC Policy)
# ==================================================================

resource "crowdstrike_cloud_security_kac_policy" "block_docker_socket" {
  name        = "Block Docker Socket Mount — All Environments"
  description = "Prevents containers from mounting /var/run/docker.sock"
  enabled     = true

  rule_groups {
    name   = "docker-socket-block"
    action = "prevent"
    
    rules {
      runtime_socket_in_container = "enabled"
    }
  }

  cluster_groups = ["all-eks-clusters"]
  
  # NO exceptions — docker socket mount should NEVER be allowed
  # If CI/CD runners need container builds, use Kaniko or buildah instead
}

# --- Terraform That TRIGGERS This IOM ---
resource "kubernetes_deployment" "cicd_runner" {
  metadata {
    name      = "jenkins-agent"
    namespace = "ci-cd"
  }
  spec {
    replicas = 2
    selector {
      match_labels = { app = "jenkins-agent" }
    }
    template {
      metadata {
        labels = { app = "jenkins-agent" }
      }
      spec {
        container {
          name  = "jenkins-agent"
          image = "jenkins/inbound-agent:latest"
          
          volume_mount {
            name       = "docker-sock"
            mount_path = "/var/run/docker.sock"   # ← TRIGGERS IOM #3
          }
        }
        
        volume {
          name = "docker-sock"
          host_path {
            path = "/var/run/docker.sock"          # ← CRITICAL: Host socket!
            type = "Socket"
          }
        }
      }
    }
  }
}

# --- REMEDIATED Terraform (Use Kaniko for in-cluster builds) ---
resource "kubernetes_deployment" "secure_cicd_runner" {
  metadata {
    name      = "jenkins-agent"
    namespace = "ci-cd"
  }
  spec {
    replicas = 2
    selector {
      match_labels = { app = "jenkins-agent" }
    }
    template {
      metadata {
        labels = { app = "jenkins-agent" }
      }
      spec {
        service_account_name = "jenkins-agent-sa"
        
        container {
          name  = "jenkins-agent"
          image = "jenkins/inbound-agent:4.11.2"   # ✅ Pinned version
          
          security_context {
            run_as_non_root            = true
            read_only_root_filesystem  = true
            allow_privilege_escalation = false
            capabilities {
              drop = ["ALL"]
            }
          }
          # ✅ NO docker.sock mount
          # Use Kaniko sidecar for container builds instead
        }
        
        # Kaniko sidecar for building images without Docker daemon
        container {
          name  = "kaniko"
          image = "gcr.io/kaniko-project/executor:v1.22.0"
          
          args = [
            "--dockerfile=Dockerfile",
            "--context=dir:///workspace",
            "--destination=123456.dkr.ecr.us-east-1.amazonaws.com/app:latest",
            "--cache=true"
          ]
          
          volume_mount {
            name       = "workspace"
            mount_path = "/workspace"
          }
          volume_mount {
            name       = "docker-config"
            mount_path = "/kaniko/.docker"
          }
        }
        
        volume {
          name = "workspace"
          empty_dir {}  # ✅ No host paths
        }
        volume {
          name = "docker-config"
          secret {
            secret_name = "ecr-registry-credentials"
          }
        }
      }
    }
  }
}
```

## IOM Rule 4: Container with Dangerous Linux Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│  IOM RULE #4: DANGEROUS LINUX CAPABILITIES GRANTED           │
├─────────────────────────────────────────────────────────────┤
│  SEVERITY:     🟠 HIGH                                       │
│  CIS BENCHMARK: CIS Kubernetes 5.2.8, 5.2.9                 │
│  MITRE ATT&CK:  T1611 (Escape to Host), T1068 (Exploitation │
│                  for Privilege Escalation)                    │
│  FALCON RULE:   "Container granted SYS_ADMIN/NET_RAW/etc."  │
│  RISK:          SYS_ADMIN = near-privileged access           │
│                 NET_RAW = network sniffing/spoofing           │
│                 SYS_PTRACE = process injection                │
└─────────────────────────────────────────────────────────────┘
```

```hcl
# ==================================================================
# IOM #4: DANGEROUS CAPABILITIES — TERRAFORM (KAC Policy)
# ==================================================================

resource "crowdstrike_cloud_security_kac_policy" "block_dangerous_caps" {
  name        = "Block Dangerous Linux Capabilities — Production"
  description = "Prevents containers from adding SYS_ADMIN, NET_RAW, SYS_PTRACE"
  enabled     = true

  rule_groups {
    name   = "dangerous-capabilities-block"
    action = "prevent"
    
    rules {
      container_with_sysadmin_capability  = "enabled"
      container_with_net_raw_capability   = "enabled"
      container_with_sys_ptrace_capability = "enabled"
    }
  }

  cluster_groups = ["production-eks-clusters"]

  exceptions {
    namespace = "falcon-system"
    reason    = "Falcon sensor requires SYS_PTRACE for process inspection"
  }
  exceptions {
    namespace = "monitoring"
    image     = "calico/node:*"
    reason    = "Calico CNI requires NET_RAW for network policy enforcement"
  }
}

# --- Terraform That TRIGGERS This IOM ---
resource "kubernetes_deployment" "debug_tool" {
  metadata {
    name      = "network-debugger"
    namespace = "platform"
  }
  spec {
    replicas = 1
    selector {
      match_labels = { app = "network-debugger" }
    }
    template {
      metadata {
        labels = { app = "network-debugger" }
      }
      spec {
        container {
          name  = "debugger"
          image = "nicolaka/netshoot:latest"
          
          security_context {
            capabilities {
              add = [
                "SYS_ADMIN",    # ← TRIGGERS IOM #4 (near-privileged)
                "NET_RAW",      # ← TRIGGERS IOM #4 (packet sniffing)
                "SYS_PTRACE",   # ← TRIGGERS IOM #4 (process injection)
                "NET_ADMIN"     # ← Additional risk
              ]
            }
          }
        }
      }
    }
  }
}

# --- REMEDIATED Terraform ---
resource "kubernetes_deployment" "secure_debug_tool" {
  metadata {
    name      = "network-debugger"
    namespace = "platform"
    labels = {
      "app.kubernetes.io/name" = "network-debugger"
      "security-review"        = "approved-2026-04"
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = { app = "network-debugger" }
    }
    template {
      metadata {
        labels = { app = "network-debugger" }
      }
      spec {
        # Pod-level security context
        security_context {
          run_as_non_root = true
          run_as_user     = 65534   # nobody user
          seccomp_profile {
            type = "RuntimeDefault"
          }
        }
        
        container {
          name  = "debugger"
          image = "123456.dkr.ecr.us-east-1.amazonaws.com/netshoot:v0.12"  # ✅ Private registry
          
          security_context {
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
            capabilities {
              drop = ["ALL"]                # ✅ Drop everything
              add  = ["NET_BIND_SERVICE"]   # ✅ Only what's actually needed
            }
          }
        }
        
        # If the tool needs temporary storage
        volume {
          name = "tmp"
          empty_dir {
            size_limit = "100Mi"
          }
        }
      }
    }
  }
}
```

## IOM Rule 5: Container Without Network Policy Enforcement

```
┌─────────────────────────────────────────────────────────────┐
│  IOM RULE #5: NO NETWORK POLICY IN NAMESPACE                 │
├─────────────────────────────────────────────────────────────┤
│  SEVERITY:     🟠 HIGH                                       │
│  CIS BENCHMARK: CIS Kubernetes 5.3.2                         │
│  MITRE ATT&CK:  T1021 (Lateral Movement via Remote Services)│
│  FALCON RULE:   "Namespace has no NetworkPolicy defined"     │
│  RISK:          Without NetworkPolicy, ANY pod can talk to   │
│                 ANY other pod — lateral movement is trivial  │
│                 Attacker compromises one pod → moves to ALL  │
└─────────────────────────────────────────────────────────────┘
```

```hcl
# ==================================================================
# IOM #5: MISSING NETWORK POLICY — TERRAFORM
# ==================================================================

# This IOM is detected by Falcon CSPM's Kubernetes assessment,
# not KAC admission control (since NetworkPolicy is not a pod-level setting).
# The remediation is to deploy NetworkPolicies via Terraform.

# --- Checking for this IOM in Falcon ---
# Cloud Security → Configuration Assessment → Kubernetes
# Finding: "Namespace 'payments' has no NetworkPolicy"
# Severity: HIGH
# Recommendation: "Deploy a default-deny NetworkPolicy and then 
#                  add allow rules for required traffic"

# --- REMEDIATION: Deploy Default-Deny + Allowlist ---

# STEP 1: Default-Deny All Traffic in Namespace
resource "kubernetes_network_policy" "default_deny_all" {
  metadata {
    name      = "default-deny-all"
    namespace = "payments"
  }

  spec {
    pod_selector {}   # Empty = applies to ALL pods in namespace

    # Deny ALL ingress
    ingress {}

    # Deny ALL egress
    egress {}

    policy_types = ["Ingress", "Egress"]
  }
}

# STEP 2: Allow Specific Traffic — API to Database
resource "kubernetes_network_policy" "allow_api_to_db" {
  metadata {
    name      = "allow-api-to-database"
    namespace = "payments"
  }

  spec {
    pod_selector {
      match_labels = { app = "payment-api" }   # Source: API pods
    }

    # Allow egress TO database pods on port 5432
    egress {
      to {
        pod_selector {
          match_labels = { app = "payment-db" }  # Destination: DB pods
        }
      }
      ports {
        port     = "5432"
        protocol = "TCP"
      }
    }

    # Allow egress TO DNS (required for service discovery)
    egress {
      to {
        namespace_selector {
          match_labels = { name = "kube-system" }
        }
      }
      ports {
        port     = "53"
        protocol = "UDP"
      }
      ports {
        port     = "53"
        protocol = "TCP"
      }
    }

    policy_types = ["Egress"]
  }
}

# STEP 3: Allow Ingress from Load Balancer to API
resource "kubernetes_network_policy" "allow_lb_to_api" {
  metadata {
    name      = "allow-ingress-to-api"
    namespace = "payments"
  }

  spec {
    pod_selector {
      match_labels = { app = "payment-api" }
    }

    # Allow ingress FROM ingress controller namespace
    ingress {
      from {
        namespace_selector {
          match_labels = { name = "ingress-nginx" }
        }
      }
      ports {
        port     = "8080"
        protocol = "TCP"
      }
    }

    policy_types = ["Ingress"]
  }
}

# STEP 4: Allow Falcon Sensor Communication
resource "kubernetes_network_policy" "allow_falcon" {
  metadata {
    name      = "allow-falcon-sensor"
    namespace = "payments"
  }

  spec {
    pod_selector {}     # All pods need Falcon connectivity

    # Allow egress to Falcon cloud
    egress {
      ports {
        port     = "443"
        protocol = "TCP"
      }
    }

    policy_types = ["Egress"]
  }
}
```

## Summary: All 5 Container Security IOM Rules

```
┌────┬──────────────────────────┬──────────┬─────────────────────────────────┐
│ #  │ IOM Rule                 │ Severity │ Terraform Resource              │
├────┼──────────────────────────┼──────────┼─────────────────────────────────┤
│ 1  │ Privileged Container     │ CRITICAL │ crowdstrike_kac_policy          │
│    │                          │          │ + kubernetes_deployment         │
├────┼──────────────────────────┼──────────┼─────────────────────────────────┤
│ 2  │ Root User in Container   │ HIGH     │ crowdstrike_kac_policy          │
│    │                          │          │ + kubernetes_deployment         │
├────┼──────────────────────────┼──────────┼─────────────────────────────────┤
│ 3  │ Docker Socket Mount      │ CRITICAL │ crowdstrike_kac_policy          │
│    │                          │          │ + kubernetes_deployment         │
├────┼──────────────────────────┼──────────┼─────────────────────────────────┤
│ 4  │ Dangerous Capabilities   │ HIGH     │ crowdstrike_kac_policy          │
│    │ (SYS_ADMIN/NET_RAW)      │          │ + kubernetes_deployment         │
├────┼──────────────────────────┼──────────┼─────────────────────────────────┤
│ 5  │ No NetworkPolicy in NS   │ HIGH     │ kubernetes_network_policy       │
│    │                          │          │ (default-deny + allowlist)      │
└────┴──────────────────────────┴──────────┴─────────────────────────────────┘
```

---

# PART 5: INTERVIEW QUESTIONS & ANSWERS

---

## Section A: IOM Policies & Rules (8 Questions)

---

### Q1. "What is an IOM in CrowdStrike Falcon, and how does it differ from an IOA?"

**Answer:**

> "An **IOM (Indicator of Misconfiguration)** is a static, configuration-based detection in CrowdStrike Falcon Cloud Security that identifies insecure settings in cloud resources. It checks the *configuration state* — like 'is this S3 bucket public?' or 'does this pod run as root?'
>
> An **IOA (Indicator of Attack)** is a behavioral, runtime-based detection that identifies suspicious *actions* — like 'a new executable appeared in a running container' (drift) or 'a process opened a reverse shell.'
>
> **Key differences:**
> - **IOM = What IS configured wrong** → Fix the configuration
> - **IOA = What IS happening right now** → Kill the process, investigate
> - IOMs fire during periodic scans or at deployment (via KAC)
> - IOAs fire in real-time during container execution
> - IOMs are typically remediated via Terraform/IaC fixes
> - IOAs are typically responded to via IR playbooks
>
> **Example in practice:** An IOM flags 'this pod runs as privileged' (before or during deployment). An IOA fires when 'a privileged pod just executed nsenter to escape to the host' (during runtime). The IOM could have *prevented* the IOA if we had enforced the KAC policy."

---

### Q2. "How do you write a custom IOM policy in CrowdStrike Falcon?"

**Answer:**

> "There are three methods to create IOM policies in Falcon:
>
> **Method 1: Customize Built-In Policies**
> Navigate to Cloud Security → Configuration Assessment → Policies. Select a built-in rule (e.g., 'S3 bucket public'), change its severity from HIGH to CRITICAL for your compliance needs, and enable/disable rules per your environment. This is the quickest approach.
>
> **Method 2: Clone and Modify**
> If you need a stricter version of an existing rule — for example, enforcing CMK encryption instead of just requiring encryption on/off — clone the built-in rule, modify the check logic, add your compliance mappings, and assign a descriptive name.
>
> **Method 3: Create from Scratch**
> For organization-specific rules that don't have built-in equivalents — like mandatory tagging policies — create a new custom policy. Define the cloud provider, service, check logic, severity, and compliance framework mapping.
>
> **Best practices I follow:**
> - Start with clones of existing policies (proven logic, less error-prone)
> - Always map to compliance frameworks (CIS, PCI, SOX, NIST)
> - Test in Alert-Only mode for 2 weeks before enabling enforcement
> - Document every severity override with regulatory justification
> - Disable irrelevant rules with documented reason (e.g., 'We don't use GCP Dataflow')"

---

### Q3. "How do you handle false positives in IOM policies?"

**Answer:**

> "False positive management is critical for maintaining analyst trust in the system. My approach:
>
> **Step 1: Validate** — Before marking as FP, I verify: Is the configuration *actually* secure despite triggering the rule? For example, an S3 bucket flagged as 'public' might have a bucket policy that restricts to a specific CloudFront OAI — technically public ACL, but effectively private.
>
> **Step 2: Scoped Exception** — If it's a true FP, I create a narrow exception:
> - Scope to the specific resource ARN (not the entire account)
> - Add justification: 'This S3 bucket is a public website host with CloudFront OAI restriction'
> - Set 90-day expiry (forces re-validation)
> - Assign a reviewer (security team member)
>
> **Step 3: Rule Tuning** — If the same FP pattern repeats across multiple resources, I modify the rule logic rather than creating individual exceptions. For example, add a condition: 'Exclude buckets tagged Website=true that have CloudFront OAI policy.'
>
> **Step 4: Metrics** — I track FP rate per rule. If a rule has <50% true positive rate, it needs tuning or should be re-scoped. The goal is >80% TP rate for every enabled rule."

---

### Q4. "What are the most critical IOM rules for container security?"

**Answer:**

> "The top 5, ordered by risk:
>
> 1. **Privileged Containers** (CRITICAL) — Full host kernel access. An attacker in a privileged container can escape to the node using nsenter, mount host filesystem, and compromise the entire cluster. Should always be PREVENT mode.
>
> 2. **Docker Socket Mount** (CRITICAL) — Mounting `/var/run/docker.sock` gives the container control of the Docker daemon on the host. Attacker can spawn new privileged containers, read secrets from other containers, or compromise the node. Use Kaniko for in-cluster builds instead.
>
> 3. **Root User** (HIGH) — Containers running as UID 0 have broader access to host resources when combined with other misconfigs. Always enforce `runAsNonRoot: true` and explicit UID in SecurityContext.
>
> 4. **Dangerous Capabilities** (HIGH) — SYS_ADMIN is essentially privileged mode. NET_RAW enables packet sniffing. SYS_PTRACE allows process injection. Best practice: `drop: ALL`, then add only what's needed.
>
> 5. **No NetworkPolicy** (HIGH) — Without NetworkPolicy, all pods communicate freely. One compromised pod = lateral movement to all pods. Deploy default-deny and then whitelist required traffic."

---

### Q5. "How do you roll out IOM enforcement without breaking production?"

**Answer:**

> "I use a phased rollout strategy — never 'big bang':
>
> **Week 1-2: ALERT Mode (Observe)**
> - Deploy all IOM rules and KAC policies in Alert/Detect-Only mode
> - Monitor: How many existing deployments would be blocked?
> - Identify: Which teams have non-compliant workloads?
> - Create a findings spreadsheet: resource, team, violation, remediation
>
> **Week 3: Engage Teams (Fix)**
> - Share findings with each team — provide exact Terraform/YAML fixes
> - Hold security office hours for questions
> - Priority: Critical rules first (privileged, docker socket)
> - Track remediation progress
>
> **Week 4: Enforce Critical Rules**
> - Switch privileged container + docker socket rules to PREVENT
> - These have near-zero FP rate — safe to enforce
> - Monitor for deployment failures
>
> **Week 5-6: Enforce Remaining Rules**
> - Switch root user, capabilities, NetworkPolicy to PREVENT
> - These may need exceptions (system components, monitoring agents)
>
> **Ongoing: Continuous Improvement**
> - New clusters auto-inherit policies
> - Monthly exception review
> - Quarterly rule coverage assessment"

---

## Section B: AWS Onboarding (5 Questions)

---

### Q6. "Walk me through onboarding an AWS account to CrowdStrike Falcon for CSPM."

**Answer:**

> "The process has 4 steps:
>
> **Step 1: API Client** — In Falcon Console → Support & Resources → API Clients, create a new API client with 'Cloud Security Registration: Read+Write' scope. Save the Client ID and Secret immediately — the secret is shown only once.
>
> **Step 2: Account Registration** — Navigate to Cloud Security → Cloud Account Registration → Add AWS Account. Choose features: CSPM, IOA, Identity Protection. Provide the AWS Account ID.
>
> **Step 3: CloudFormation Stack** — Falcon generates a CloudFormation template. Deploy it in the target AWS account. It creates a cross-account IAM role with read-only permissions and an External ID for security (anti-confused deputy). Takes 3-5 minutes.
>
> **Step 4: Verification** — Back in Falcon, verify the account shows as 'Connected.' Wait 15-30 minutes for the first scan. Review initial findings in Configuration Assessment.
>
> **For enterprise/organization-wide:** Use AWS StackSets to deploy the CloudFormation template across all member accounts simultaneously. New accounts auto-enroll.
>
> **For IaC-first organizations:** Use the CrowdStrike Terraform provider (`crowdstrike/crowdstrike`) with the `crowdstrike_cloud_aws_account` resource and the official Terraform module for AWS registration."

---

### Q7. "What permissions does CrowdStrike need in your AWS account, and how do you ensure least privilege?"

**Answer:**

> "CrowdStrike uses a **cross-account IAM role** with specific, read-only permissions:
>
> **Permissions include:**
> - `ec2:Describe*` — Read SG, VPC, subnet, instance configs
> - `s3:GetBucket*`, `s3:GetEncryption*` — Read bucket configs (NOT object data)
> - `iam:Get*`, `iam:List*` — Read IAM policies, roles, users
> - `eks:Describe*`, `eks:List*` — Read EKS cluster configs
> - `rds:Describe*` — Read database configs
> - `lambda:Get*`, `lambda:List*` — Read function configs
> - `cloudtrail:Describe*` — Read trail settings
>
> **Security controls on the role:**
> - **External ID** — Prevents confused deputy attacks. Only CrowdStrike with the matching External ID can assume the role.
> - **Read-Only** — No write permissions. CrowdStrike cannot modify your resources.
> - **Trust Policy** — Limited to CrowdStrike's specific AWS account ARN.
> - **No Data Access** — For S3, it reads bucket policies/encryption, NOT the actual objects.
>
> **Verification:** I always review the CloudFormation template before deploying it. I check the IAM policy statement by statement. If any permission seems excessive, I raise it with CrowdStrike support."

---

### Q8. "What do you do after the first CSPM scan shows 500+ IOMs?"

**Answer:**

> "500+ IOMs on the first scan is completely normal for a brownfield environment. Here's my triaging approach:
>
> **Priority 1: Critical + Internet-Facing (Fix in 4h)**
> - Filter by: Severity = Critical AND NetworkExposure = Internet-Facing
> - These are your active attack surface — public S3, open SGs, public RDS
> - Usually 10-20 findings — manageable in day 1
>
> **Priority 2: Critical + Internal (Fix in 24h)**
> - Critical findings but not internet-facing
> - Still important but lower exploitation risk
>
> **Priority 3: High + Production (Fix in 48h)**
> - High severity in production accounts
>
> **Priority 4: Baseline Everything Else**
> - Medium/Low → Track in dashboard, assign to teams
> - Create weekly remediation targets: 'Reduce Critical from 50 to 30 this week'
>
> **What I report to leadership:** Not '500 findings' — instead: '12 critical attack paths involving internet-facing resources. I've closed the top 5. Here's my plan for the remaining 7 this week.'"

---

### Q9. "How do you onboard an entire AWS Organization versus individual accounts?"

**Answer:**

> "For AWS Organization-wide onboarding:
>
> **Approach:** Use the Organization registration option in Falcon, which leverages AWS CloudFormation StackSets.
>
> **Steps:**
> 1. Register the AWS Management Account (or delegated admin) in Falcon
> 2. Provide the AWS Organization ID
> 3. Falcon generates a StackSet template
> 4. Deploy via StackSets → automatically creates the IAM role in ALL member accounts
> 5. New accounts added later → auto-enrolled via StackSet auto-deployment
>
> **Benefits over individual registration:**
> - One deployment covers 50, 100, or 500 accounts
> - New accounts get Falcon automatically — no security gap
> - Centralized management from management account
> - Consistent IAM permissions across all accounts
>
> **Considerations:**
> - Requires StackSets admin permissions in management account
> - Some organizations use delegated admin for StackSets
> - Region restrictions: Deploy StackSet to all regions or target specific ones
> - Exception accounts: Can exclude specific accounts from the StackSet if needed"

---

### Q10. "Can you onboard AWS using Terraform instead of CloudFormation?"

**Answer:**

> "Yes — CrowdStrike provides an official Terraform provider and module:
>
> ```hcl
> # Provider setup
> provider 'crowdstrike' {
>   client_id     = var.falcon_client_id
>   client_secret = var.falcon_client_secret
>   cloud         = 'us-1'
> }
>
> # Register AWS account
> resource 'crowdstrike_cloud_aws_account' 'prod' {
>   account_id    = '123456789012'
>   cspm_enabled  = true
> }
>
> # Deploy IAM resources using official module
> module 'crowdstrike_cspm' {
>   source  = 'crowdstrike/cloud-registration/aws'
>   version = '~> 1.0'
>   falcon_client_id = var.falcon_client_id
>   external_id      = crowdstrike_cloud_aws_account.prod.external_id
> }
> ```
>
> **Why Terraform is preferred for IaC-first orgs:**
> - Version controlled — registration config in git
> - Reproducible — same module for all accounts
> - Auditable — PR review before deployment
> - Consistent — no console clicks, no manual errors
> - Integrated — same workflow as rest of infrastructure"

---

## Section C: Terraform Drift & Remediation (7 Questions)

---

### Q11. "What is configuration drift, and how do you detect it?"

**Answer:**

> "Configuration drift is when the live cloud resource state diverges from what's defined in your Infrastructure as Code (Terraform). It happens when someone makes manual changes via the AWS Console, CLI, or another automation tool.
>
> **Detection methods I use:**
> 1. **CrowdStrike Falcon CSPM** — Continuously scans live infrastructure and flags misconfigurations. If the IaC is correct but the runtime doesn't match, it's drift.
> 2. **`terraform plan -refresh-only`** — Compares Terraform state with live infrastructure. Shows what changed without planning to revert it.
> 3. **`terraform plan -detailed-exitcode`** — Returns exit code 2 if drift exists. Perfect for CI/CD automation.
> 4. **AWS Config Rules** — Detects specific configuration changes in real-time.
> 5. **CloudTrail monitoring** — Detect manual API calls that modify Terraform-managed resources.
>
> **My drift prevention strategy:**
> - CI/CD pipeline runs `terraform plan` nightly — alerts on any drift
> - All manual console access requires MFA + justification
> - SCPs prevent certain manual changes in production accounts
> - Post-incident review: if drift was from emergency fix, update IaC immediately"

---

### Q12. "How do you remediate a misconfiguration found by Falcon CSPM using Terraform?"

**Answer:**

> "My remediation workflow has 5 steps:
>
> **Step 1: Identify** — Falcon CSPM fires IOM: 'Security Group allows 0.0.0.0/0 to port 22'
>
> **Step 2: Trace to IaC Source**
> - Check resource tags: `terraform:workspace`, `terraform:module`
> - Find the .tf file in the repo: `modules/networking/security_groups.tf`
> - Compare IaC definition vs. live config
> - Is it drift (IaC is correct, live is wrong) or bad IaC (code is wrong)?
>
> **Step 3: Fix in Code**
> ```hcl
> # Before (insecure):
> cidr_blocks = ['0.0.0.0/0']
>
> # After (secure):
> cidr_blocks = ['10.0.0.0/8']    # Corporate CIDR only
> ```
>
> **Step 4: Apply via CI/CD**
> - Create PR with the fix
> - IaC scanner (Checkov) validates the change
> - Peer review + approval
> - `terraform apply` via pipeline (not manually)
>
> **Step 5: Verify**
> - Falcon re-scans → IOM resolved automatically
> - Close the Jira ticket
> - Update the remediation dashboard
>
> **Critical rule:** Never fix drift in the console — fix it in the Terraform code so it stays fixed permanently."

---

### Q13. "What's the difference between terraform plan -refresh-only and terraform apply?"

**Answer:**

> "`terraform plan -refresh-only` is a *read-only* operation that detects drift without planning any changes. It compares the live infrastructure state against Terraform's state file and shows you what changed *outside* of Terraform. It answers: 'Has anyone modified my resources manually?'
>
> `terraform apply` (without refresh-only) will actually modify infrastructure to match your Terraform code. If drift exists, `terraform apply` will revert the manual changes and bring the live state back in line with code.
>
> **When to use each:**
> - **Drift detection mode:** `terraform plan -refresh-only` (daily CI check)
> - **Accept manual changes:** `terraform apply -refresh-only` (updates state file to match live — use when the manual change was intentional)
> - **Revert drift:** `terraform apply` (overwrites manual changes with code definition)
> - **Target specific resources:** `terraform plan -target=aws_security_group.main` (check drift on one resource)"

---

### Q14. "How do you prevent misconfigurations from reaching production in the first place?"

**Answer:**

> "I implement a 4-gate security pipeline:
>
> **Gate 1: Pre-Commit (Developer's Machine)**
> - Pre-commit hooks running tfsec, detect-secrets
> - Catches obvious issues before code is even committed
>
> **Gate 2: CI Pipeline (IaC Scan)**
> - Checkov / tfsec / Falcon IaC Scan runs on every PR
> - Fail the build on Critical/High findings
> - Developer sees exact finding + remediation in PR comments
>
> **Gate 3: Terraform Plan Review**
> - terraform plan output posted as PR comment
> - Security team reviews for sensitive changes (IAM, SG, encryption)
> - No auto-apply to production without approval
>
> **Gate 4: Runtime (KAC / CSPM)**
> - CrowdStrike KAC blocks non-compliant K8s deployments
> - CSPM catches anything that slipped through
> - Auto-remediation for simple fixes (public S3 → re-enable block public access)
>
> **Result:** Misconfigurations are caught at the cheapest point to fix (code review) rather than the most expensive point (production incident)."

---

### Q15. "Scenario: A developer manually opens port 22 via AWS Console during an incident. How do you handle this?"

**Answer:**

> "**Immediate (During Incident):** Allow it — don't block emergency access. Safety first.
>
> **Post-Incident (Within 4 hours):**
> 1. CloudTrail shows: `AuthorizeSecurityGroupIngress` by `user/jane.doe` at 2:30 AM
> 2. Falcon CSPM fires: IOM 'SG allows 0.0.0.0/0 to port 22' — Severity CRITICAL
> 3. I contact Jane: 'Was this for last night's incident? Is SSH still needed?'
> 4. If no longer needed: Revert via Terraform (not console — to prevent permanent drift)
>
> **Permanent Fix:**
> 5. Update Terraform: Remove the SSH rule or restrict to VPN CIDR
> 6. Propose SSM Session Manager as the standard access method
> 7. Add SCP to prevent `0.0.0.0/0` SSH rules in production via AWS Organizations
>
> **Process Improvement:**
> 8. Create an emergency access runbook: 'During incident, use SSM instead of opening ports'
> 9. If SSH is truly needed for emergencies, create a time-limited Terraform module that opens SSH for 2 hours then auto-reverts
>
> **Key principle:** Understand *why* they did it, fix the root cause (lack of SSM), and prevent recurrence through both technical controls (SCP) and process (runbook)."

---

### Q16. "How do you handle situations where Terraform state and reality are completely out of sync?"

**Answer:**

> "This typically happens when infrastructure was partially built manually or when someone modified resources outside Terraform extensively. My recovery process:
>
> **Step 1: Assess the gap**
> - Run `terraform plan` to see the full extent of drift
> - Categorize: How many resources are affected?
>
> **Step 2: Decide the approach**
> - **Minor drift (1-5 resources):** `terraform import` the unmanaged resources, write matching .tf code, then run `terraform plan` to verify zero changes
> - **Major drift (many resources):** Consider using `terraform state rm` for resources that should no longer be managed, and `terraform import` for new ones
> - **Complete desync:** Sometimes it's better to re-import all resources into a new workspace than to fix the existing state
>
> **Step 3: Reconcile**
> - For each imported resource, write Terraform code that exactly matches the current live config
> - Run `terraform plan` — output should show zero changes
> - Then create follow-up PRs to bring the config to the desired secure state
>
> **Prevention:** 
> - Nightly `terraform plan` CI job that alerts on any drift
> - Read-only console access for developers (can view, not modify)
> - SCPs to prevent manual modifications to Terraform-tagged resources"

---

### Q17. "How do you integrate CrowdStrike Falcon CSPM findings with your Terraform workflow?"

**Answer:**

> "I build a closed-loop feedback system:
>
> **Falcon → Ticket → Code → Deploy → Falcon (Verify)**
>
> 1. **Falcon CSPM detects IOM** → Sends webhook to Jira
> 2. **Jira ticket auto-created** → Contains:
>    - IOM details, severity, affected resource ARN
>    - Exact Terraform remediation code snippet
>    - SLA deadline based on severity
>    - Assigned to team based on resource tags
> 3. **Developer creates PR** → Fixes the Terraform code
> 4. **CI pipeline runs** → Checkov validates the fix
> 5. **terraform apply** → Deploys the remediation
> 6. **Falcon re-scans** → IOM disappears → Ticket auto-closed
>
> **For IaC scanning (proactive):**
> - Falcon IaC scanner or Checkov runs in the CI pipeline
> - Scans Terraform files *before* deployment
> - Blocks PRs that would create new IOMs
>
> **Result:** 
> - IOMs found in production → fixed in code → never recur
> - New misconfigurations → caught in PR → never reach production
> - Continuous improvement loop: fewer IOMs over time"

---

## Section D: Advanced & Scenario Questions (5 Questions)

---

### Q18. "How do you prioritize IOM remediation across 50 AWS accounts with thousands of findings?"

**Answer:**

> "I use a risk-based prioritization matrix, not alphabetical ordering:
>
> **Tier 1: Fix NOW (Critical + Internet-Facing + Production)**
> - Filter: severity=CRITICAL AND exposure=internet AND env=production
> - Examples: Public S3 in prod, open SSH in prod
> - SLA: 4 hours
> - Usually 10-30 findings — manageable
>
> **Tier 2: Fix This Week (Critical + Internal + Production)**
> - Not internet-facing but still critical config issues
> - SLA: 24-48 hours
>
> **Tier 3: Fix This Sprint (High + Production)**
> - High severity in production
> - SLA: 7 days
> - Assign to individual teams
>
> **Tier 4: Track and Plan (Medium + Any, Low + Any)**
> - Track in dashboard, assign quarterly remediation goals
> - If a team has 50 medium findings, help them fix 10 per sprint
>
> **CEO Dashboard:** I report trends, not abs numbers: 'Critical findings reduced 60% over 3 months. 4 critical attack paths remain, targeting them this sprint.'"

---

### Q19. "How would you automate the remediation of common IOMs using Terraform?"

**Answer:**

> "I automate high-frequency, low-complexity IOMs where the fix is deterministic:
>
> **Automation 1: Auto-fix Public S3 Buckets**
> - Trigger: Falcon CSPM IOM 'S3 bucket publicly accessible'
> - Action: EventBridge → Lambda → Calls S3 API to enable Block Public Access
> - Terraform module: Pre-built that includes all S3 security settings
>
> **Automation 2: Auto-fix Open Security Groups**
> - Trigger: Falcon IOM 'SG allows 0.0.0.0/0 on port 22'
> - Action: Lambda revokes the rule + creates Jira ticket for review
> - Terraform: SCP prevents creation of 0.0.0.0/0 rules in production
>
> **Automation 3: Terraform Modules as Prevention**
> - Create organization-standard Terraform modules for common resources
> - S3 module automatically includes: encryption, versioning, logging, block-public-access
> - Developers use the module instead of raw resources → security built in
>
> **What I DON'T automate:**
> - IAM policy changes (too complex, could break applications)
> - Encryption key changes (could cause data loss)
> - Network routing changes (could cause outages)
> - These need human review and approval"

---

### Q20. "Explain the CrowdStrike Terraform provider and how it integrates with cloud security."

**Answer:**

> "The CrowdStrike Terraform provider (`crowdstrike/crowdstrike` on the Terraform Registry) allows you to manage Falcon configurations as Infrastructure as Code:
>
> **Resources available:**
> - `crowdstrike_cloud_aws_account` — Register/manage AWS accounts for CSPM
> - `crowdstrike_cloud_security_kac_policy` — Define KAC admission policies
> - `crowdstrike_prevention_policy` — Configure host prevention policies
> - `crowdstrike_sensor_update_policy` — Manage sensor update settings
>
> **Benefits:**
> - Security policies stored in git alongside infrastructure code
> - Changes to security configs go through PR review
> - Consistent deployment across environments (dev/staging/prod)
> - Rollback capability via `terraform destroy` or state revert
> - Audit trail in git history
>
> **Example workflow:**
> 1. Security engineer writes KAC policy in Terraform
> 2. PR review by security lead
> 3. Apply to staging cluster first (test mode)
> 4. After 1 week of monitoring, promote to production
> 5. Any issues → `git revert` → `terraform apply` → instant rollback
>
> **Key integration point:** Combining `crowdstrike` provider with `kubernetes` and `aws` providers in the same Terraform workspace lets you deploy infrastructure + security policies in a single pipeline."

---

### Q21. "What compliance frameworks can you map IOM policies to in CrowdStrike Falcon?"

**Answer:**

> "CrowdStrike Falcon supports multiple built-in compliance framework mappings:
>
> **Built-in Frameworks:**
> - CIS AWS Foundations Benchmark (v1.4, v2.0, v3.0)
> - CIS Azure Benchmark
> - CIS GCP Benchmark
> - CIS Kubernetes Benchmark (v1.6, v1.7, v1.8)
> - CIS EKS Benchmark (v1.3, v1.4)
> - CIS Docker Benchmark
> - NIST 800-53
> - PCI-DSS v3.2.1, v4.0
> - SOC 2 (TSC)
> - HIPAA
> - GDPR (data protection articles)
> - ISO 27001
>
> **Custom Framework Mapping:**
> - You can map custom IOM rules to internal compliance standards
> - Example: Map your 'mandatory tagging' rule to 'Internal Policy: Cloud Governance v2.3'
> - This lets you track custom compliance alongside regulatory frameworks
>
> **Reporting:**
> - Falcon generates compliance dashboards per framework
> - One-click export for auditors
> - Trend tracking: 'PCI compliance improved from 72% to 91% over 6 months'
> - Control-level detail: which specific controls pass/fail"

---

### Q22. "What happens when a Falcon KAC policy blocks a legitimate deployment?"

**Answer:**

> "This is a common operational scenario. My response:
>
> **Immediate:** The developer sees a clear error from kubectl:
> ```
> Error from server: admission webhook 'kac.crowdstrike.com' denied the request:
> privileged containers are not allowed [Policy: Block-Privileged]
> ```
>
> **Resolution workflow:**
> 1. Developer contacts security channel (Slack) with the error
> 2. I review: Is this a legitimate need or a misconfigured deployment?
> 3. **If misconfigured:** Help the developer fix the SecurityContext (provide exact YAML)
> 4. **If legitimate exception needed:**
>    - Confirm the business justification (e.g., CNI plugin truly needs privileged)
>    - Create a scoped exception in the KAC policy (namespace + image only)
>    - Document: who approved, why, expiry date (90 days max)
>    - Track in exception registry
> 5. Developer retries deployment → succeeds
>
> **Prevention:** 
> - In Alert mode first (2 weeks) to catch these before switching to Prevent
> - Clear error messages with remediation guidance
> - Security office hours for teams to get help proactively"

---

## Section E: Quick-Fire Interview Questions (5 Questions)

---

### Q23. "Name 3 critical IOM checks for AWS S3."

> 1. **S3 bucket Block Public Access disabled** (CRITICAL — CIS 2.1.5)
> 2. **S3 bucket without server-side encryption** (HIGH — CIS 2.1.1)
> 3. **S3 bucket access logging not enabled** (MEDIUM — CIS 2.1.3)

---

### Q24. "What's the External ID in AWS cross-account role, and why does Falcon use it?"

> "The External ID is a shared secret between CrowdStrike and your account. It's set in the IAM role trust policy's `Condition` block. It prevents the **confused deputy problem** — without it, any CrowdStrike customer could potentially reference your role ARN. With the External ID (unique per registration), only CrowdStrike with YOUR specific External ID can assume YOUR role."

---

### Q25. "What command detects drift without modifying anything?"

> "`terraform plan -refresh-only` — Shows what changed in live infrastructure without planning any modifications. Add `-detailed-exitcode` for CI automation: exit code 2 = drift detected."

---

### Q26. "How does CrowdStrike KAC differ from OPA Gatekeeper?"

> "Both are Kubernetes admission controllers, but:
> - **KAC** is integrated with the CrowdStrike Falcon ecosystem — IOMs, IOAs, image scanning, and threat intelligence all in one console
> - **OPA Gatekeeper** is open-source, uses Rego language for policy-as-code, more flexible but requires more maintenance
> - **KAC advantage:** Can check if an image has been scanned by Falcon before allowing deployment — impossible with standalone OPA
> - **OPA advantage:** More customizable, community-supported policies, no vendor lock-in
> - **In practice:** Many orgs use BOTH — OPA for custom policies, KAC for CrowdStrike-specific checks"

---

### Q27. "What is the difference between IaC scanning and CSPM?"

> "- **IaC scanning** = **Pre-deployment** — Scans Terraform/CloudFormation code in the CI/CD pipeline *before* deployment. Prevents misconfigurations from being created.
> - **CSPM** = **Post-deployment** — Scans live cloud infrastructure *after* deployment. Detects runtime misconfigs, manual changes, and drift.
> - **Together:** IaC scanning catches issues at code review (cheapest). CSPM catches issues that slip through or are created manually (safety net). You need both for complete coverage."

---

# 📋 STUDY CHEATSHEET — KEY CONCEPTS TO MEMORIZE

```
IOM vs IOA:
  IOM = Static config check (S3 public, SG open, pod privileged)
  IOA = Runtime behavior (reverse shell, drift, crypto mining)

AWS ONBOARDING FLOW:
  Create API Client → Register in Falcon → Deploy CloudFormation → Verify

DRIFT DETECTION:
  terraform plan -refresh-only      ← Detect drift
  terraform apply -refresh-only     ← Accept drift into state
  terraform apply                   ← Revert drift to match code

4-GATE PIPELINE:
  Pre-Commit → CI IaC Scan → Plan Review → KAC/CSPM

5 CONTAINER IOMs:
  1. Privileged Container (CRITICAL)
  2. Root User (HIGH)
  3. Docker Socket Mount (CRITICAL)
  4. Dangerous Capabilities (HIGH)
  5. No NetworkPolicy (HIGH)

SEVERITY SLA:
  Critical: 4h | High: 24h | Medium: 7d | Low: 30d

COMPLIANCE FRAMEWORKS:
  CIS AWS, CIS K8s, CIS EKS, PCI-DSS, SOC2, NIST, HIPAA
```

---

> **Guide Created:** April 2026
> **Topics Covered:** IOM Policy Writing, AWS Onboarding, Terraform Drift Remediation, 
> 5 Container Security IOM Rules, 27 Interview Q&As
> **Cross-References:** [CNAPP Policy Examples](./CNAPP_Policy_Examples.md) | [KAC & Runtime Guide](./KAC_and_Runtime_Detections_Guide.md)
