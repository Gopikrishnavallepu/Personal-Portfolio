# 🔐 Infrastructure as Code Security, Container Security & Cloud Findings Assessment — Complete Interview Preparation Guide

> **Purpose:** Master IaC/Terraform security, CI/CD pipeline security, container security in AWS EKS/Kubernetes, and cloud security findings assessment for interviews.
> **Target Roles:** Cloud Security Engineer, DevSecOps Engineer, CNAPP Security Specialist
> **Created:** April 2026

---

# TABLE OF CONTENTS

| # | Section | Description |
|---|---------|-------------|
| 1 | [IaC Security Fundamentals](#part-1-infrastructure-as-code-iac-security-fundamentals) | What IaC security is, why it matters, attack surface |
| 2 | [Terraform Security Deep Dive](#part-2-terraform-security-deep-dive) | Terraform-specific security concerns, misconfigurations, hardening |
| 3 | [IaC Security Scanning Tools & Techniques](#part-3-iac-security-scanning-tools--techniques) | Checkov, tfsec, Wiz IaC, Snyk IaC, Terrascan — comparison & usage |
| 4 | [CI/CD Pipeline Security](#part-4-cicd-pipeline-security) | Pipeline threat model, secret management, supply chain, hardening |
| 5 | [Container Security in AWS EKS/Kubernetes](#part-5-container-security-in-aws-ekskubernetes) | EKS architecture, pod security, image scanning, RBAC, runtime |
| 6 | [Kubernetes-Specific Attack Vectors & Defenses](#part-6-kubernetes-specific-attack-vectors--defenses) | Container escape, SSRF/IMDS, RBAC abuse, lateral movement |
| 7 | [Cloud Security Findings Assessment](#part-7-cloud-security-findings-assessment) | Severity determination, exploitability analysis, risk communication |
| 8 | [Risk Communication Framework](#part-8-risk-communication-framework) | Speaking to technical vs non-technical stakeholders |
| 9 | [Interview Questions — IaC & Terraform Security (Q1–Q20)](#part-9-interview-questions--iac--terraform-security) | 20 questions with expert answers |
| 10 | [Interview Questions — CI/CD Pipeline Security (Q21–Q35)](#part-10-interview-questions--cicd-pipeline-security) | 15 questions with expert answers |
| 11 | [Interview Questions — Container Security & EKS (Q36–Q50)](#part-11-interview-questions--container-security--eks) | 15 questions with expert answers |
| 12 | [Interview Questions — Findings Assessment & Communication (Q51–Q65)](#part-12-interview-questions--findings-assessment--communication) | 15 questions with expert answers |
| 13 | [Scenario-Based Interview Simulations](#part-13-scenario-based-interview-simulations) | 5 end-to-end scenarios combining all three domains |
| 14 | [Quick Reference Cheatsheet](#part-14-quick-reference-cheatsheet) | One-page summary of key concepts, tools, and frameworks |

---

# PART 1: INFRASTRUCTURE AS CODE (IaC) SECURITY FUNDAMENTALS

---

## 1.1 What is IaC Security?

### 🔹 What is IaC?

**Infrastructure as Code** = Defining cloud infrastructure in code files instead of clicking in the AWS Console.

| Aspect | Details |
|--------|--------|
| **Definition** | Write Terraform / CloudFormation / Pulumi to define infrastructure |
| **Benefits** | Version control, repeatable, auditable, peer-reviewed |
| **Tools** | Terraform (HCL), CloudFormation (YAML/JSON), Pulumi (Python/TS), CDK, Ansible, ARM, Deployment Manager |

### 🔹 What is IaC Security?

> **Core Idea:** Scan IaC templates **BEFORE** deployment for misconfigurations — "Shift-Left" security.

| Misconfig Example | Where It's Caught |
|-------------------|--------------------|
| S3 bucket without encryption | ✅ Caught in Terraform code |
| Security Group allowing `0.0.0.0/0` | ✅ Blocked in CI/CD |
| RDS `publicly_accessible = true` | ✅ PR rejected by IaC scanner |
| IAM role with `AdministratorAccess` | ✅ Flagged before deployment |

> 💡 **KEY INSIGHT:** If you fix it in code, it **NEVER** reaches the cloud.

### 🔹 Why IaC Security Matters

| | ❌ Without IaC Security | ✅ With IaC Security |
|---|---|---|
| **Flow** | Write TF → Deploy → CSPM detects → Triage → Ticket → Fix | Write TF → CI/CD scanner → **BLOCKS** → Fix in code → Deploy SECURE |
| **Time to Fix** | ⏱️ Days / Weeks | ⚡ Minutes |
| **Exposure Window** | 🔴 Open and vulnerable | 🟢 **ZERO** exposure |

## 1.2 IaC Security Attack Surface

| # | Attack Surface | Frequency | Key Risks |
|---|---------------|-----------|----------|
| 1️⃣ | **Misconfigured Resources** | 🔴 Most Common (~80%) | Public S3 buckets, open SGs, unencrypted storage, overly permissive IAM, missing logging, default settings |
| 2️⃣ | **Hardcoded Secrets in Code** | 🔴 Critical | AWS keys in `.tf`, DB passwords in variables, API tokens in `user_data`, private keys in git |
| 3️⃣ | **Insecure State Management** | 🟠 TF-Specific | `.tfstate` contains ALL details, local/unencrypted storage, plaintext secrets, unauthorized access |
| 4️⃣ | **Configuration Drift** | 🟡 Post-Deploy | Console changes, emergency bypasses, detection gaps, compliance violations from untracked changes |
| 5️⃣ | **Supply Chain Risks** | 🟡 Modules/Providers | Malicious public modules, compromised providers, unpinned versions, typosquatting |

---

# PART 2: TERRAFORM SECURITY DEEP DIVE

---

## 2.1 Terraform Security Concerns by Category

```
TERRAFORM SECURITY — CATEGORY BREAKDOWN
════════════════════════════════════════

CATEGORY 1: STATE FILE SECURITY
├── terraform.tfstate = JSON file containing ALL resource metadata
├── Includes: resource IDs, ARNs, IPs, and SECRETS in plaintext
├── RISK: Anyone who reads the state file knows your entire infrastructure
│
├── ✅ BEST PRACTICES:
│   ├── Store state in encrypted S3 bucket with versioning
│   ├── Enable server-side encryption (SSE-KMS)
│   ├── Use DynamoDB for state locking (prevent concurrent access)
│   ├── Enable S3 bucket logging for audit trail
│   ├── Restrict S3 bucket access to CI/CD service role only
│   ├── Use terraform_remote_state data source (not local state)
│   └── NEVER commit .tfstate to git (.gitignore it)
│
│   SECURE BACKEND CONFIGURATION:
│   ```hcl
│   terraform {
│     backend "s3" {
│       bucket         = "myorg-terraform-state"
│       key            = "production/vpc/terraform.tfstate"
│       region         = "us-east-1"
│       encrypt        = true                      # SSE at rest
│       kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/xxx"
│       dynamodb_table = "terraform-state-lock"    # State locking
│       acl            = "private"
│     }
│   }
│   ```

CATEGORY 2: SECRET MANAGEMENT
├── NEVER hardcode secrets in .tf files
├── NEVER pass secrets via terraform.tfvars committed to git
│
├── ✅ APPROACHES (Best to Worst):
│   ├── 1. AWS Secrets Manager / HashiCorp Vault (BEST)
│   │      Use data sources to fetch secrets at apply time
│   │      ```hcl
│   │      data "aws_secretsmanager_secret_version" "db_pass" {
│   │        secret_id = "production/database/password"
│   │      }
│   │      resource "aws_db_instance" "app" {
│   │        password = data.aws_secretsmanager_secret_version.db_pass.secret_string
│   │      }
│   │      ```
│   │
│   ├── 2. Environment Variables
│   │      export TF_VAR_db_password="..." (set in CI/CD, not committed)
│   │
│   ├── 3. Sensitive Variables (TF 0.14+)
│   │      variable "db_password" {
│   │        type      = string
│   │        sensitive = true    # Redacted from plan/apply output
│   │      }
│   │
│   └── 4. .tfvars file NOT in git (WORST acceptable option)
│          Add *.tfvars to .gitignore

CATEGORY 3: PROVIDER & MODULE SECURITY
├── PROVIDER PINNING:
│   ```hcl
│   terraform {
│     required_providers {
│       aws = {
│         source  = "hashicorp/aws"
│         version = "~> 5.0"       # Pin major version
│       }
│     }
│     required_version = ">= 1.5"   # Pin Terraform version
│   }
│   ```
│
├── MODULE SECURITY:
│   ├── Use PRIVATE module registry for internal modules
│   ├── Pin module versions: source = "git::ssh://...?ref=v1.2.3"
│   ├── Review module code before first use
│   ├── Avoid using "latest" or unpinned module refs
│   └── Use terraform-docs to document module inputs/outputs
│
├── DEPENDENCY LOCK FILE:
│   ├── .terraform.lock.hcl = records exact provider versions + checksums
│   ├── COMMIT this file to git (unlike .terraform directory)
│   └── Ensures all team members use identical provider versions

CATEGORY 4: ACCESS CONTROL FOR TERRAFORM
├── WHO can run terraform apply?
│   ├── Service role in CI/CD pipeline (not developers directly)
│   ├── Developers can run terraform plan locally (read-only)
│   ├── Only CI/CD can apply to production
│   └── Break-glass process for emergency manual applies
│
├── IAM ROLE FOR TERRAFORM:
│   ├── Principle of least privilege
│   ├── Separate roles per environment (dev/staging/prod)
│   ├── Use assume_role with session tagging
│   ├── Log all API calls via CloudTrail
│   └── Rotate credentials regularly (use OIDC federation)
│
├── TERRAFORM CLOUD / ENTERPRISE:
│   ├── Remote execution in managed environment
│   ├── Policy-as-code with Sentinel
│   ├── Run approval workflows (require manager for prod)
│   ├── Audit log for all plans and applies
│   └── Variable sets for secret management
```

## 2.2 Top 20 Terraform Misconfigurations

| # | Misconfiguration | Severity | Terraform Fix |
|:---:|-----------------|:--------:|---------------|
| 1 | S3 bucket without public access block | 🔴 CRITICAL | `aws_s3_bucket_public_access_block` → all `true` |
| 2 | SG allows `0.0.0.0/0` ingress | 🔴 CRITICAL | `cidr_blocks = ["10.0.0.0/8"]` |
| 3 | RDS `publicly_accessible = true` | 🔴 CRITICAL | `publicly_accessible = false` |
| 4 | IAM policy with `Action: "*"` | 🔴 CRITICAL | Scope to specific actions |
| 5 | EC2 without IMDSv2 enforcement | 🟠 HIGH | `metadata_options { http_tokens = "required" }` |
| 6 | EBS volume unencrypted | 🟠 HIGH | `encrypted = true` + `kms_key_id` |
| 7 | CloudTrail not enabled | 🔴 CRITICAL | `aws_cloudtrail` + `is_multi_region_trail = true` |
| 8 | Root account access keys exist | 🔴 CRITICAL | N/A — manual: delete keys |
| 9 | EKS public endpoint | 🔴 CRITICAL | `endpoint_public_access = false` |
| 10 | Lambda without VPC | 🟡 MEDIUM | `vpc_config { subnet_ids... }` |
| 11 | KMS key without rotation | 🟠 HIGH | `enable_key_rotation = true` |
| 12 | ALB not using HTTPS | 🟠 HIGH | `protocol = "HTTPS"` + `certificate_arn` |
| 13 | Missing access logging | 🟡 MEDIUM | `aws_s3_bucket_logging`, `flow_log`, `access_logs` |
| 14 | No backup/versioning on S3 | 🟡 MEDIUM | `versioning { status = "Enabled" }` |
| 15 | No deletion protection on RDS | 🟡 MEDIUM | `deletion_protection = true` |
| 16 | Default VPC in use | 🟡 MEDIUM | Create custom VPC, delete default |
| 17 | No tags on resources | 🔵 LOW | `tags = { Owner = "..." }` |
| 18 | Secrets in `user_data` plaintext | 🔴 CRITICAL | Reference Secrets Manager |
| 19 | EKS node group with SSH key | 🟡 MEDIUM | Remove `remote_access` block, use SSM |
| 20 | SNS topic without encryption | 🟡 MEDIUM | `kms_master_key_id = ...` |

## 2.3 Terraform Security Scanning in CI/CD

### Pipeline Workflow

> `Developer` → `git push` → `Pull Request` → **CI/CD Pipeline** →

| Step | Command / Action | Purpose |
|:----:|-----------------|--------|
| 1 | `terraform fmt -check -recursive` | 🎨 Code style validation |
| 2 | `terraform init` | 📦 Initialize providers and modules |
| 3 | `terraform validate` | ✅ Syntax validation |
| **4** | **IaC SECURITY SCAN** ⭐ | 🛡️ **KEY STEP** — Checkov / Trivy / Snyk IaC / Terrascan |
| | |└ Scan `.tf` files, FAIL on CRITICAL/HIGH, output remediation guidance |
| 5 | `terraform plan` | 📝 Generate execution plan |
| 6 | Plan review & approval | 👤 Manual approval for production changes |
| 7 | `terraform apply` *(on merge to main)* | 🚀 Apply changes to infrastructure |

### GitHub Actions Example

```yaml
name: Terraform Security Pipeline
on:
  pull_request:
    paths: ['terraform/**']

jobs:
  iac-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Checkov IaC Scan
      - name: Run Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          framework: terraform
          soft_fail: false          # FAIL pipeline on findings
          output_format: sarif
          download_external_modules: true
          check: CKV_AWS_*          # AWS-specific checks

      # Trivy IaC Scan (replaces tfsec)
      - name: Run Trivy IaC
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'config'
          scan-ref: 'terraform/'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      # Terraform Plan
      - name: Terraform Plan
        run: |
          cd terraform/
          terraform init
          terraform plan -out=tfplan

      # OPA/Conftest Policy Check on Plan
      - name: Policy Check (OPA)
        uses: open-policy-agent/conftest-action@v2
        with:
          files: terraform/tfplan.json
          policy: policies/
```

---

# PART 3: IaC SECURITY SCANNING TOOLS & TECHNIQUES

---

## 3.1 Tool Comparison Matrix

> ⚠️ **NOTE:** tfsec was **DEPRECATED in 2023** and merged into **Trivy** by Aqua Security. If you see tfsec referenced, know that Trivy IaC is the active successor.

| # | Tool | Vendor | Type | IaC Supported | Policies | Cost |
|:---:|------|--------|------|--------------|:--------:|:----:|
| 1 | **Checkov** | Palo Alto / Bridgecrew | Open Source | Terraform, CFN, K8s, ARM, Helm, Dockerfile, Serverless, Bicep, Ansible | 2,500+ | Free |
| 2 | **Trivy** *(includes former tfsec)* | Aqua Security | Open Source | Terraform, CFN, K8s, Dockerfile, Helm, Ansible | 1,500+ | Free |
| 3 | **Snyk IaC** | Snyk | Freemium | Terraform, CFN, K8s, ARM, Bicep | 800+ | Free tier |
| 4 | **Terrascan** | Tenable | Open Source | Terraform, CFN, K8s, Helm, Dockerfile, Kustomize | 500+ | Free |
| 5 | **KICS** | Checkmarx | Open Source | Terraform, CFN, K8s, Helm, Ansible, Docker, Pulumi, Crossplane, gRPC, OpenAPI | 3,000+ | Free |
| 6 | **Wiz IaC Scanner** | Wiz (Google) | Commercial | Terraform, CFN, K8s, ARM, Bicep, CDK | CSPM-linked | Paid |
| 7 | **Prisma Cloud IaC** | Palo Alto Networks | Commercial | Terraform, CFN, K8s, ARM, Helm, Dockerfile, Bicep | Checkov engine | Paid |
| 8 | **Sentinel** | HashiCorp | Commercial | Terraform only | Custom only | TF Cloud |
| 9 | **OPA / Conftest** | CNCF / Styra | Open Source | Any JSON / YAML / HCL (evaluates TF plan output) | Custom (Rego) | Free |

### Tool-by-Tool Breakdown

```
═══════════════════════════════════════════════════════════════════════════
1. CHECKOV (Palo Alto / Bridgecrew)              ★ MOST POPULAR OSS SCANNER
═══════════════════════════════════════════════════════════════════════════
  Policies:    2,500+ built-in checks (CIS, NIST, PCI, HIPAA, SOC2)
  Languages:   Custom policies in Python or YAML
  Scan Modes:  Static .tf files + Terraform plan JSON + graph-based analysis
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, Azure DevOps, Bitbucket
  Output:      SARIF, JSON, JUnit, CLI, GitHub PR comments
  Unique:      ✅ Supply chain analysis (scans modules + providers)
               ✅ Bridgecrew cloud platform (paid) for centralized dashboard
               ✅ SCA for Terraform modules (dependency scanning)
  Limitation:  Python dependency — slightly heavier install
  Best For:    Teams needing the broadest policy coverage across multi-IaC

═══════════════════════════════════════════════════════════════════════════
2. TRIVY (Aqua Security)                      ★ BEST ALL-IN-ONE FREE SCANNER
═══════════════════════════════════════════════════════════════════════════
  Policies:    1,500+ built-in IaC checks (absorbed tfsec's entire rule set)
  Languages:   Custom policies in Rego (OPA)
  Scan Modes:  IaC files, container images, SBOM, filesystem, git repos — ALL IN ONE
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, native trivy CLI
  Output:      Table, JSON, SARIF, CycloneDX, SPDX, GitHub SBOM
  Unique:      ✅ Single binary scans IaC + images + deps + secrets + licenses
               ✅ Replaced tfsec (2023) — all tfsec rules migrated to Trivy
               ✅ Fastest scan speed among multi-purpose scanners
               ✅ Kubernetes operator for in-cluster scanning
  Limitation:  Custom Rego policies have a learning curve
  Best For:    Teams wanting ONE tool for IaC + container + dependency scanning

  ⚠️ INTERVIEW NOTE: If asked about "tfsec":
     "tfsec was an excellent Terraform-specific scanner by Aqua Security.
      It was deprecated in 2023 and its entire rule set was absorbed into
      Trivy's misconfiguration scanner. Trivy is now the recommended
      successor — it does everything tfsec did plus container scanning,
      SCA, SBOM generation, and secret detection in a single binary."

═══════════════════════════════════════════════════════════════════════════
3. SNYK IaC (Snyk)                                  ★ BEST DEVELOPER EXPERIENCE
═══════════════════════════════════════════════════════════════════════════
  Policies:    800+ built-in rules, continuously updated
  Languages:   Custom rules via Snyk platform (no code needed)
  Scan Modes:  CLI, IDE plugin (VS Code, IntelliJ), CI/CD, git integration
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, Bitbucket, Azure DevOps
  Output:      CLI, HTML, JSON, SARIF, Snyk dashboard
  Unique:      ✅ Auto-fix PRs — generates remediation pull requests
               ✅ Best-in-class fix guidance (exact code suggestions)
               ✅ Unified platform: IaC + SCA + SAST + Container in one
               ✅ IDE real-time scanning (catches issues as you type)
  Limitation:  Free tier limited to 300 tests/month; full features are paid
  Best For:    Developer-centric teams wanting inline fix suggestions

═══════════════════════════════════════════════════════════════════════════
4. TERRASCAN (Tenable)                           ★ BEST FOR OPA/REGO POLICIES
═══════════════════════════════════════════════════════════════════════════
  Policies:    500+ built-in, all written in OPA/Rego
  Languages:   Custom policies in Rego natively
  Scan Modes:  CLI, API server mode (run as a service), K8s admission webhook
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, Argo CD (via webhook)
  Output:      JSON, YAML, XML, SARIF, human-readable
  Unique:      ✅ Can run as an API server — centralized scanning service
               ✅ Native K8s admission controller mode (validateing webhook)
               ✅ All policies are Rego — one language for IaC + K8s + runtime
  Limitation:  Smaller policy set than Checkov; less active community
  Best For:    Organizations already invested in OPA/Rego ecosystem

═══════════════════════════════════════════════════════════════════════════
5. KICS (Checkmarx)                             ★ BROADEST PLATFORM COVERAGE
═══════════════════════════════════════════════════════════════════════════
  Policies:    3,000+ queries across all platforms
  Languages:   Custom queries in Rego
  Scan Modes:  CLI, Docker, CI/CD plugins
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, Azure DevOps, Bitbucket
  Output:      JSON, SARIF, HTML, PDF, SONARQUBE, CycloneDX, ASFF
  Unique:      ✅ Supports 15+ IaC platforms (most in the industry)
               ✅ Includes OpenAPI, gRPC, Crossplane scanning
               ✅ PDF report generation for compliance evidence
  Limitation:  Query language (Rego-based) can be complex for customization
  Best For:    Organizations using diverse IaC platforms beyond TF/CFN

═══════════════════════════════════════════════════════════════════════════
6. WIZ IaC SCANNER (Wiz / Google Cloud)           ★ BEST CSPM-UNIFIED SCANNER
═══════════════════════════════════════════════════════════════════════════
  Policies:    Linked to Wiz CSPM policy library (runtime + IaC unified)
  Languages:   Wiz policy framework (no custom code)
  Scan Modes:  CI/CD plugin, Wiz CLI, Wiz Console (runtime drift view)
  CI/CD:       GitHub Actions, GitLab CI, Jenkins, Azure DevOps, Bitbucket
  Output:      Wiz Console, SARIF, JSON, CI/CD PR annotations
  Unique:      ✅ Maps IaC findings to runtime attack paths in Security Graph
               ✅ Shows: "This TF misconfig would create an attack path to PII"
               ✅ Drift detection: shows when runtime diverges from IaC
               ✅ Unified remediation: fix IaC and runtime findings in one view
  Limitation:  Requires Wiz subscription (commercial product)
  Best For:    Organizations already using Wiz CSPM for a unified view

═══════════════════════════════════════════════════════════════════════════
7. SENTINEL (HashiCorp)                     ★ BEST FOR TERRAFORM CLOUD/ENT
═══════════════════════════════════════════════════════════════════════════
  Policies:    Custom only — write your own in Sentinel language
  Languages:   Sentinel (HashiCorp proprietary)
  Scan Modes:  Embedded in Terraform Cloud/Enterprise (runs between plan → apply)
  CI/CD:       Native to Terraform Cloud/Enterprise (no separate CI/CD setup)
  Output:      Pass/Fail in TF Cloud run UI, API response
  Unique:      ✅ Runs AFTER plan, BEFORE apply — sees resolved values
               ✅ Three enforcement levels: Advisory, Soft Mandatory, Hard Mandatory
               ✅ No separate CI/CD integration needed
  Limitation:  Requires Terraform Cloud/Enterprise (paid); proprietary language
  Best For:    Organizations using Terraform Cloud for centralized governance

═══════════════════════════════════════════════════════════════════════════
8. OPA / CONFTEST (CNCF / Styra)                ★ BEST FOR CUSTOM GOVERNANCE
═══════════════════════════════════════════════════════════════════════════
  Policies:    Community libraries + fully custom in Rego
  Languages:   Rego (OPA's native policy language)
  Scan Modes:  Evaluates any structured data (TF plan JSON, K8s manifests, etc.)
  CI/CD:       Any CI/CD via conftest CLI or OPA binary
  Output:      Table, JSON, TAP, JUnit
  Unique:      ✅ Cloud-agnostic — same engine for IaC, K8s, Envoy, Kafka, etc.
               ✅ Evaluates RESOLVED TF plan (not just source code)
               ✅ Can enforce non-security policies (cost, naming, tagging)
               ✅ Powers Gatekeeper (K8s admission) — same policy language
  Limitation:  Rego has a steep learning curve; no built-in security policies
  Best For:    Advanced teams needing full policy customization + a single
               policy language across IaC, K8s admission, and API gateway
```

### Choosing the Right Tool — Decision Guide

```
CHOOSING THE RIGHT IaC SCANNER — DECISION TREE
═══════════════════════════════════════════════

  START HERE: What's your primary need?
      │
      ├── "ONE tool for everything (IaC + images + SCA)"
      │      └──→ ✅ Trivy (replaced tfsec, all-in-one)
      │
      ├── "Maximum built-in policy coverage"
      │      └──→ ✅ Checkov (2,500+ policies, most frameworks)
      │           └──→ OR KICS (3,000+ queries, 15+ platforms)
      │
      ├── "Best developer experience + auto-fix PRs"
      │      └──→ ✅ Snyk IaC (inline suggestions, IDE plugin)
      │
      ├── "Unified with our CNAPP/CSPM platform"
      │      ├── Using Wiz?     → ✅ Wiz IaC Scanner
      │      └── Using Prisma?  → ✅ Prisma Cloud (Checkov engine)
      │
      ├── "We use Terraform Cloud / Enterprise"
      │      └──→ ✅ Sentinel (native, no CI/CD setup needed)
      │
      ├── "Custom governance policies (cost, naming, regions)"
      │      └──→ ✅ OPA / Conftest (Rego, works on TF plan JSON)
      │
      └── "OPA/Rego-based + want an API server mode"
             └──→ ✅ Terrascan (Rego native, webhook mode)

RECOMMENDED COMBINATION (Enterprise):
├── Primary scanner in CI/CD:   Checkov OR Trivy (broad coverage, free)
├── Developer IDE integration:  Snyk IaC (inline fix suggestions)
├── Runtime correlation:        Wiz IaC or Prisma Cloud (CSPM-linked)
├── Org governance policies:    OPA/Conftest (custom Rego for business rules)
└── K8s admission enforcement:  OPA Gatekeeper (same Rego policies)
```

## 3.2 Policy-as-Code Deep Dive

```
POLICY-AS-CODE — ENFORCING SECURITY RULES IN CODE
═════════════════════════════════════════════════

WHAT IS POLICY-AS-CODE:
├── Security policies expressed as executable code (not documents)
├── Evaluated automatically in CI/CD pipelines
├── Results: PASS (deploy) or FAIL (block deployment)
├── Humans write the policy ONCE → machines enforce it FOREVER
└── Languages: Rego (OPA), Sentinel (HashiCorp), Python (Checkov)

EXAMPLE — OPA/REGO POLICY:
```rego
# deny_public_s3.rego — Block any S3 bucket without public access block
package terraform.aws

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    not has_public_access_block(resource.change.after.id)
    msg := sprintf("S3 bucket '%s' must have a public access block", 
                   [resource.change.after.bucket])
}
```

EXAMPLE — SENTINEL POLICY (Terraform Cloud):

```sentinel
# restrict_instance_types.sentinel
import "tfplan/v2" as tfplan

main = rule {
    all tfplan.resource_changes as _, rc {
        rc.type is "aws_instance" implies
        rc.change.after.instance_type in [
            "t3.micro", "t3.small", "t3.medium",
            "m5.large", "m5.xlarge"
        ]
    }
}
```

EXAMPLE — CHECKOV CUSTOM POLICY (Python):

```python
# CKV_CUSTOM_1.py — Ensure all resources have mandatory tags
from checkov.terraform.checks.resource.base_resource_check import BaseResourceCheck
from checkov.common.models.enums import CheckResult, CheckCategories

class MandatoryTags(BaseResourceCheck):
    def __init__(self):
        name = "Ensure all resources have mandatory tags"
        id = "CKV_CUSTOM_1"
        supported = ["aws_instance", "aws_s3_bucket", "aws_rds_cluster"]
        categories = [CheckCategories.GENERAL_SECURITY]
        super().__init__(name=name, id=id, categories=categories,
                        supported_resource_type=supported)

    def scan_resource_conf(self, conf):
        tags = conf.get("tags", [{}])[0]
        required = ["Owner", "Environment", "CostCenter"]
        return CheckResult.PASSED if all(t in tags for t in required) \
               else CheckResult.FAILED

check = MandatoryTags()
```

WHY POLICY-AS-CODE MATTERS FOR INTERVIEWS:
├── Shows you can AUTOMATE security, not just audit manually
├── Demonstrates understanding of "guardrails vs gates"
├── Proves CI/CD integration capability
└── Essential for DevSecOps and Cloud Security Engineer roles

```

---

# PART 4: CI/CD PIPELINE SECURITY

---

## 4.1 CI/CD Pipeline Threat Model

### CI/CD Attack Surface — Three Stages

| Stage | Attack Vector | Description |
|:-----:|:------------:|-------------|
| 💻 **Source Code** | ① Compromised developer account | Attacker pushes malicious code |
| | ② Malicious PR/commit | Trojan code in pull request |
| | ③ Branch protection bypass | Direct push to main/production |
| 🔧 **Build System** | ④ Dependency confusion | Public package replaces internal name |
| | ⑤ Build env compromise | Persistent agents leak secrets |
| | ⑥ Secret exfiltration | Build step exfils env vars |
| | ⑦ Malicious build steps | Injected steps in pipeline |
| 🚀 **Deployment** | ⑧ Registry poisoning | Tampered images in registry |
| | ⑨ Deployment credential theft | Stolen deploy keys |
| | ⑩ Tampered artifacts | Modified binaries between build → deploy |

### Real-World Supply Chain Attacks

| Year | Attack | Impact |
|:----:|--------|--------|
| 2020 | **SolarWinds** | Build system compromised → backdoor in update → **18,000+ orgs** affected |
| 2021 | **CodeCov** | CI/CD script modified → credentials stolen from thousands of repos |
| 2021 | **Dependency Confusion** | Published internal package name to public npm → auto-installed in CI → code execution |
| 2024 | **xz Utils** | Trusted maintainer planted backdoor in build scripts → could backdoor OpenSSH globally |

## 4.2 CI/CD Security Hardening Checklist

```

CI/CD SECURITY HARDENING — COMPREHENSIVE CHECKLIST
═══════════════════════════════════════════════════

SOURCE CONTROL SECURITY:
├── ☐ Enforce branch protection rules on main/production branches
├── ☐ Require minimum 2 PR reviewers (1 must be from security for IaC)
├── ☐ Require signed commits (GPG signing)
├── ☐ Enable secret scanning in GitHub/GitLab
├── ☐ Pre-commit hooks: detect-secrets, tfsec, gitleaks
├── ☐ Audit log all git operations (who pushed what, when)
└── ☐ No force-push to protected branches

BUILD ENVIRONMENT SECURITY:
├── ☐ Ephemeral build agents (destroy after each job)
├── ☐ Build in isolated VPC with no internet (pull from internal mirrors)
├── ☐ Minimal IAM permissions for build role
├── ☐ No persistent state between builds
├── ☐ Use private artifact registries (not public Docker Hub)
├── ☐ SBOM generation in every build
└── ☐ Build reproducibility (same inputs → same outputs)

SECRET MANAGEMENT IN CI/CD:
├── ☐ Use native secret managers (GitHub Secrets, GitLab CI variables)
├── ☐ OIDC federation (GitHub Actions → AWS) — NO long-lived credentials
│     ```yaml
│     - name: Configure AWS Credentials
│       uses: aws-actions/configure-aws-credentials@v4
│       with:
│         role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
│         aws-region: us-east-1
│         # NO access key or secret — uses OIDC token
│```
├── ☐ Rotate secrets automatically
├── ☐ Never echo/print secrets in build logs
├── ☐ Use vault/secrets-manager references, not env vars
└── ☐ Audit who accesses secrets and when

ARTIFACT SECURITY:
├── ☐ Sign container images (Cosign / AWS Signer / Notary)
├── ☐ Verify signatures at deployment (admission controller)
├── ☐ Store artifacts in private ECR/Artifactory
├── ☐ Scan artifacts before promotion to next stage
├── ☐ Immutable tags (no `:latest` in production)
└── ☐ Content trust / image provenance verification

DEPLOYMENT SECURITY:
├── ☐ Progressive deployments (canary, blue/green)
├── ☐ Automatic rollback on health check failure
├── ☐ Deployment approval gates for production
├── ☐ Post-deploy security validation scan
├── ☐ Kubernetes admission controller (KAC/OPA)
└── ☐ Infrastructure drift detection after deployment

```

## 4.3 OIDC Federation — Eliminating Long-Lived Credentials

```

OIDC FEDERATION — THE MODERN WAY TO AUTHENTICATE CI/CD
════════════════════════════════════════════════════════

OLD WAY (INSECURE):
├── Create IAM user with access key + secret key
├── Store key pair as CI/CD secret
├── Build job uses static credentials
├── RISKS:
│   ├── Key leaked → attacker has persistent cloud access
│   ├── Key never rotated → exposure grows over time
│   ├── Key shared across repos → blast radius expands
│   └── No session tracking → hard to audit

NEW WAY (OIDC — OpenID Connect):
├── CI/CD platform issues a short-lived JWT token
├── JWT is exchanged for temporary AWS STS credentials
├── Credentials expire in 1 hour, scoped to the specific job
├── BENEFITS:
│   ├── No long-lived secrets to leak
│   ├── Each build gets unique session → full audit trail
│   ├── Scoped to specific repo/branch via trust policy
│   └── No secrets to rotate

AWS TRUST POLICY FOR GITHUB ACTIONS OIDC:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:ref:refs/heads/main"
      }
    }
  }]
}

KEY INSIGHT: The "sub" condition restricts which repo AND branch can assume
this role. Even if an attacker creates a fork, they can't assume your role
because the repo name won't match.

```

---

# PART 5: CONTAINER SECURITY IN AWS EKS/KUBERNETES

---

## 5.1 EKS Security Architecture

```

EKS SECURITY ARCHITECTURE — LAYERED DEFENSE
═══════════════════════════════════════════

       LAYER 1: AWS ACCOUNT LEVEL
       ┌──────────────────────────────────────────────────┐
       │  SCPs, CloudTrail, GuardDuty, Config Rules       │
       │  IAM roles, VPC design, KMS keys                 │
       └──────────────────────────────────────────────────┘
                              │
       LAYER 2: EKS CLUSTER LEVEL
       ┌──────────────────────────────────────────────────┐
       │  Control plane security:                          │
       │  ├── Endpoint access: private or restricted       │
       │  ├── Encryption: secrets at rest via KMS          │
       │  ├── Logging: API server, authenticator, audit    │
       │  ├── K8s version: latest supported                │
       │  └── Authentication: aws-auth ConfigMap / EKS API │
       └──────────────────────────────────────────────────┘
                              │
       LAYER 3: NODE LEVEL
       ┌──────────────────────────────────────────────────┐
       │  Worker node security:                            │
       │  ├── AMI: EKS optimized + CIS hardened            │
       │  ├── IMDSv2: http_tokens = required, hop_limit=1  │
       │  ├── No SSH keys: Use SSM Session Manager         │
       │  ├── Node IAM role: minimal (ECR pull, logs, CNI) │
       │  ├── Security sensor: Falcon/Wiz DaemonSet        │
       │  └── Auto-scaling: replace, don't patch           │
       └──────────────────────────────────────────────────┘
                              │
       LAYER 4: NAMESPACE/POD LEVEL
       ┌──────────────────────────────────────────────────┐
       │  Workload security:                               │
       │  ├── Pod Security Admission (PSA): restricted     │
       │  ├── SecurityContext: non-root, drop ALL caps     │
       │  ├── IRSA: dedicated IAM role per service account │
       │  ├── NetworkPolicy: default-deny per namespace    │
       │  ├── Resource limits: CPU/memory on every pod     │
       │  ├── Admission controller: KAC / OPA Gatekeeper   │
       │  └── Image policy: scanned, signed, trusted reg   │
       └──────────────────────────────────────────────────┘
                              │
       LAYER 5: APPLICATION LEVEL
       ┌──────────────────────────────────────────────────┐
       │  App security:                                    │
       │  ├── Secrets via External Secrets Operator (ESO)  │
       │  ├── mTLS: service mesh (Istio) or native         │
       │  ├── API authentication: JWT, OAuth               │
       │  └── SAST/SCA/DAST in CI/CD                       │
       └──────────────────────────────────────────────────┘

```

## 5.2 EKS Security Hardening — Detailed Configuration

```

EKS HARDENING — TERRAFORM EXAMPLES
═══════════════════════════════════

EKS CLUSTER RESOURCE (SECURE):

```hcl
resource "aws_eks_cluster" "production" {
  name     = "prod-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.29"                           # Latest supported

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true             # ✅ Enable private
    endpoint_public_access  = false            # ✅ Disable public
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_secrets.arn   # ✅ Encrypt secrets at rest
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = [               # ✅ Enable all logging
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

NODE GROUP (SECURE):

```hcl
resource "aws_eks_node_group" "workers" {
  cluster_name    = aws_eks_cluster.production.name
  node_group_name = "prod-workers"
  node_role_arn   = aws_iam_role.eks_node.arn  # Minimal role
  subnet_ids      = var.private_subnet_ids

  instance_types = ["m5.xlarge"]
  disk_size      = 50

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 2
  }

  launch_template {
    id      = aws_launch_template.eks_node.id
    version = "$Latest"
  }

  # ✅ NO remote_access block — use SSM instead of SSH
}

resource "aws_launch_template" "eks_node" {
  name = "eks-node-template"

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"   # ✅ IMDSv2 only
    http_put_response_hop_limit = 1            # ✅ Blocks pod IMDS access
  }

  monitoring {
    enabled = true                             # ✅ Detailed monitoring
  }
}
```

IRSA (IAM Roles for Service Accounts) — SECURE:

```hcl
# OIDC provider for IRSA
data "tls_certificate" "eks" {
  url = aws_eks_cluster.production.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  url             = aws_eks_cluster.production.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
}

# Per-service IAM role (not shared)
resource "aws_iam_role" "payment_service" {
  name = "eks-payment-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_eks_cluster.production.identity[0].oidc[0].issuer, "https://", "")}:sub" = 
            "system:serviceaccount:payments:payment-sa"
          "${replace(aws_eks_cluster.production.identity[0].oidc[0].issuer, "https://", "")}:aud" = 
            "sts.amazonaws.com"
        }
      }
    }]
  })
}

# Least-privilege policy
resource "aws_iam_role_policy" "payment_service" {
  name = "payment-service-policy"
  role = aws_iam_role.payment_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"]
        Resource = "arn:aws:dynamodb:us-east-1:123456789012:table/payments"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = aws_kms_key.payments.arn
      }
    ]
  })
}
```

```

## 5.3 Pod Security Standards (PSS) & Pod Security Admission (PSA)

```

POD SECURITY STANDARDS — THREE LEVELS
══════════════════════════════════════

┌──────────────┬──────────────────────────────────────────────────────────┐
│ Level        │ What It Allows                                          │
├──────────────┼──────────────────────────────────────────────────────────┤
│ PRIVILEGED   │ Everything — no restrictions at all                      │
│              │ Use case: System components (Falcon sensor, kube-system) │
│              │ ⚠️ NEVER for application workloads                       │
├──────────────┼──────────────────────────────────────────────────────────┤
│ BASELINE     │ Prevents known privilege escalations:                    │
│              │ ├── No privileged containers                             │
│              │ ├── No hostNetwork, hostPID, hostIPC                     │
│              │ ├── No hostPath volumes                                  │
│              │ ├── Limited capabilities (drop NET_RAW)                  │
│              │ └── No /proc mount types that enable escape              │
│              │ Use case: General workloads, good starting point         │
├──────────────┼──────────────────────────────────────────────────────────┤
│ RESTRICTED   │ Maximum security (CIS Benchmark alignment):              │
│              │ ├── Everything in Baseline PLUS:                         │
│              │ ├── Must run as non-root (runAsNonRoot: true)            │
│              │ ├── Must drop ALL capabilities                           │
│              │ ├── Seccomp profile must be RuntimeDefault or Localhost  │
│              │ ├── No privilege escalation (allowPrivilegeEscalation:   │
│              │ │   false)                                               │
│              │ └── Volume types restricted (no hostPath, no emptyDir   │
│              │     with exec)                                           │
│              │ Use case: Production workloads, sensitive namespaces     │
└──────────────┴──────────────────────────────────────────────────────────┘

APPLYING PSA VIA NAMESPACE LABELS:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted   # REJECT non-compliant
    pod-security.kubernetes.io/audit: restricted      # LOG violations
    pod-security.kubernetes.io/warn: restricted       # WARN developers
```

SECURE POD SECURITYCONTEXT EXAMPLE:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: payments
spec:
  template:
    spec:
      automountServiceAccountToken: false    # Don't mount SA token
      securityContext:
        runAsNonRoot: true                   # Pod-level: must be non-root
        runAsUser: 1000                      # Specific non-root UID
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault               # Seccomp profile
      containers:
        - name: payment-api
          image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-api:v2.1.0
          securityContext:
            allowPrivilegeEscalation: false  # Cannot escalate
            readOnlyRootFilesystem: true     # Immutable filesystem
            capabilities:
              drop: ["ALL"]                  # Drop ALL Linux capabilities
              add: ["NET_BIND_SERVICE"]      # Only add what's needed
          resources:
            limits:
              cpu: "500m"
              memory: "256Mi"
            requests:
              cpu: "100m"
              memory: "128Mi"
          volumeMounts:
            - name: tmp
              mountPath: /tmp                # Writable temp dir
      volumes:
        - name: tmp
          emptyDir: {}                       # Ephemeral, not hostPath
```

```

---

# PART 6: KUBERNETES-SPECIFIC ATTACK VECTORS & DEFENSES

---

## 6.1 Attack Vector Matrix

```

KUBERNETES ATTACK VECTORS — MITRE ATT&CK FOR CONTAINERS
═══════════════════════════════════════════════════════

┌─────────────────┬──────────────────────────────────┬──────────────────────────┐
│ MITRE Tactic    │ K8s Attack Technique             │ Defense                  │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Initial Access  │ Exposed K8s dashboard            │ Private endpoint, authN  │
│                 │ Compromised image from Docker Hub│ Private registry + scan  │
│                 │ Exploited vulnerable application │ SAST/DAST, patching      │
│                 │ Stolen kubeconfig                │ RBAC, short-lived tokens │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Execution       │ Exec into container              │ PSA restricted, no TTY   │
│                 │ Deploy malicious workload        │ KAC admission control    │
│                 │ Sidecar injection                │ Webhook validation       │
│                 │ CronJob / Job scheduled payload  │ RBAC restrict create     │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Persistence     │ Backdoor container / image       │ Image signing, KAC       │
│                 │ Create rogue ServiceAccount      │ Audit RBAC changes       │
│                 │ Modify aws-auth ConfigMap        │ GitOps, change detection │
│                 │ Deploy DaemonSet (all nodes)     │ KAC blocks unauthorized  │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Priv Escalation │ Privileged container → host      │ PSA restricted, KAC      │
│                 │ hostPath volume mount            │ Block hostPath via OPA   │
│                 │ RBAC wildcard permissions         │ Least-privilege RBAC     │
│                 │ IMDS credential theft             │ IMDSv2 + hop limit = 1  │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Defense Evasion │ Deploy to kube-system namespace  │ PSA enforce on all ns    │
│                 │ Clear pod logs                   │ External log aggregation │
│                 │ Use legitimate tools (kubectl)   │ Audit log analysis       │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Credential Acc. │ Read mounted SA tokens           │ automountSAToken: false  │
│                 │ Access K8s Secrets API           │ RBAC restrict get/list   │
│                 │ Query IMDS for IAM creds         │ IRSA + IMDSv2 hop=1     │
│                 │ Read etcd directly               │ etcd encryption, RBAC    │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Lateral Move    │ Access other pods via network    │ NetworkPolicy deny-all   │
│                 │ Use SA token for K8s API calls   │ Scoped RBAC per SA       │
│                 │ Pivot to cloud via IRSA/IMDS     │ Least-privilege IAM      │
├─────────────────┼──────────────────────────────────┼──────────────────────────┤
│ Exfiltration    │ Egress to external endpoint      │ NetworkPolicy egress     │
│                 │ DNS tunneling                    │ DNS monitoring, CoreDNS  │
│                 │ Cloud storage exfil              │ S3/DynamoDB access logs  │
└─────────────────┴──────────────────────────────────┴──────────────────────────┘

```

## 6.2 IMDS Attack & IRSA Defense — Critical EKS Topic

```

IMDS ATTACK SCENARIO (SSRF → CREDENTIAL THEFT)
═══════════════════════════════════════════════

THE ATTACK:

1. Attacker exploits SSRF vulnerability in web application running in EKS pod
2. SSRF allows attacker to reach <http://169.254.169.254/> (IMDS endpoint)
3. With IMDSv1: Simple GET request returns temporary IAM credentials
4. With node instance profile: These credentials have broad permissions
5. Attacker uses stolen credentials to access S3, DynamoDB, Secrets Manager

DEFENSE LAYERS:
├── LAYER 1: Enforce IMDSv2 (http_tokens = "required")
│   → Requires PUT with token header first, then GET with token
│   → SSRF typically can't send PUT requests or handle multi-step flows
│
├── LAYER 2: Set hop_limit = 1 on launch template
│   → IMDS response won't cross network namespace boundary to container
│   → Only the host OS can reach IMDS, not pods
│
├── LAYER 3: Use IRSA instead of node instance profile
│   → Each pod gets its OWN IAM role via ServiceAccount annotation
│   → Pod uses projected token, not IMDS
│   → Even if IMDS is reached, node role has minimal permissions
│
├── LAYER 4: NetworkPolicy blocking 169.254.169.254
│   ```yaml
│   apiVersion: networking.k8s.io/v1
│   kind: NetworkPolicy
│   metadata:
│     name: block-imds
│   spec:
│     podSelector: {}
│     egress:
│     - to:
│       - ipBlock:
│           cidr: 0.0.0.0/0
│           except:
│           - 169.254.169.254/32    # Block IMDS
│     policyTypes:
│     - Egress
│```
│
└── LAYER 5: Monitor IMDS access via Falcon/Wiz runtime detection
    → Alert on any pod querying 169.254.169.254
    → IOA: "IMDSAccess from non-system container"

```

---

# PART 7: CLOUD SECURITY FINDINGS ASSESSMENT

---

## 7.1 The FIVE-Layer Risk Assessment Model

```

CLOUD SECURITY FINDINGS — 5-LAYER RISK ASSESSMENT MODEL
═══════════════════════════════════════════════════════

When you receive a cloud security finding (from Wiz, CrowdStrike, Prisma, etc.),
evaluate it through these 5 layers BEFORE assigning final risk:

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  LAYER 1: TECHNICAL VALIDITY                                         │
│  ├── Is the finding technically accurate?                            │
│  ├── Does the configuration actually violate the security control?   │
│  ├── Is this a scanner false positive / edge case?                   │
│  ├── Example: "S3 bucket is public" — but it's a static website    │
│  │   bucket MEANT to be public → TRUE POSITIVE but ACCEPTED RISK    │
│  └── OUTCOME: Valid finding? → proceed. FP? → create exception      │
│                                                                      │
│  LAYER 2: EXPOSURE CONTEXT                                           │
│  ├── Is the resource internet-facing or internal-only?               │
│  ├── What environment? Production > Staging > Dev > Sandbox          │
│  ├── Data classification: PII? Financial? PHI? Public?              │
│  ├── What IAM permissions are attached?                              │
│  ├── What network access exists (SGs, NACLs, routing)?              │
│  └── OUTCOME: Adjust severity based on exposure                     │
│      │                                                               │
│      │  Same finding, different exposure:                            │
│      │  ├── Public-facing EC2 with Critical CVE → CRITICAL          │
│      │  ├── Internal EC2 with same CVE → HIGH                       │
│      │  └── Sandbox EC2 with same CVE → MEDIUM                      │
│                                                                      │
│  LAYER 3: ATTACK PATH ANALYSIS (TOXIC COMBINATIONS)                  │
│  ├── Is this finding part of a chain that leads to data/access?      │
│  ├── Wiz Security Graph / Falcon Attack Path shows connections       │
│  ├── Individual finding severity << Attack path severity             │
│  ├── Example chain:                                                  │
│  │   Internet → Public ALB → EC2 (CVE-2024-XXX, CVSS 9.8)          │
│  │   → Overpermissive IAM role → S3 bucket (50K PII records)        │
│  │   Each link alone = HIGH. The chain = CRITICAL.                  │
│  └── OUTCOME: If part of attack path → escalate severity             │
│                                                                      │
│  LAYER 4: EXPLOITABILITY                                             │
│  ├── Is there a known public exploit? (Check ExploitDB, GitHub POCs)│
│  ├── Is the CVE in CISA KEV (Known Exploited Vulnerabilities)?      │
│  ├── What is the EPSS score? (Exploit Prediction Scoring System)    │
│  │   ├── EPSS > 0.5 = Very likely to be exploited                   │
│  │   └── EPSS < 0.01 = Very unlikely to be exploited               │
│  ├── Does exploiting it require authentication? Physical access?     │
│  ├── Is the attack vector Network (worst) or Local (less critical)? │
│  └── OUTCOME: High exploitability + exposure → immediate action     │
│                                                                      │
│  LAYER 5: BUSINESS IMPACT                                            │
│  ├── What's the blast radius if exploited?                          │
│  ├── Customer data exposure → regulatory notification required?     │
│  ├── Revenue impact: does this affect payment or streaming?         │
│  ├── Reputational damage: public breach disclosure?                 │
│  ├── Regulatory consequences: PCI, HIPAA, GDPR fines?              │
│  └── OUTCOME: Business-critical systems → highest remediation SLA   │
│                                                                      │
│  FINAL RISK = f(Validity × Exposure × Attack Path × Exploit × Biz) │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

```

## 7.2 Severity & SLA Framework

```

SEVERITY DETERMINATION & SLA FRAMEWORK
══════════════════════════════════════

┌──────────────┬──────────────────────────────────────┬──────────────┐
│ Severity     │ Criteria                              │ Remediation  │
│              │                                       │ SLA          │
├──────────────┼──────────────────────────────────────┼──────────────┤
│ 🔴 P1        │ • Active exploitation in progress     │ IMMEDIATE    │
│ CRITICAL     │ • Internet-facing + Critical CVE      │ (4 hours)    │
│              │   + data access                       │              │
│              │ • Sensitive data publicly exposed      │              │
│              │ • Part of critical attack path         │              │
│              │ • Zero-day with public exploit          │              │
├──────────────┼──────────────────────────────────────┼──────────────┤
│ 🟠 P2        │ • Internet-facing misconfiguration    │ 24 hours     │
│ HIGH         │ • Critical CVE without exploit POC     │              │
│              │ • IAM over-privilege on prod resources │              │
│              │ • Missing encryption on sensitive data │              │
│              │ • Exploitable but limited blast radius │              │
├──────────────┼──────────────────────────────────────┼──────────────┤
│ 🟡 P3        │ • Internal misconfiguration           │ 7 days       │
│ MEDIUM       │ • High CVE on internal resource       │              │
│              │ • Dev/staging environment exposure     │              │
│              │ • Missing best practice control        │              │
│              │ • No direct data access path           │              │
├──────────────┼──────────────────────────────────────┼──────────────┤
│ 🔵 P4        │ • Informational findings              │ 30 days      │
│ LOW          │ • Best practice recommendations       │              │
│              │ • Non-sensitive data, low exposure     │              │
│              │ • Hardening opportunities              │              │
│              │ • No known exploit, no attack path     │              │
└──────────────┴──────────────────────────────────────┴──────────────┘

SLA ESCALATION CHAIN:
├── 50% of SLA elapsed → Automated reminder to resource owner
├── 75% of SLA elapsed → Escalate to team lead + Slack notification
├── 100% of SLA elapsed → Escalate to engineering manager + Jira priority bump
├── 150% of SLA elapsed → Escalate to CISO/Director + risk acceptance required
└── 200% of SLA elapsed → Auto-create incident, block deployments to affected system

```

## 7.3 Finding Triage Workflow

```

CLOUD SECURITY FINDING TRIAGE — STEP-BY-STEP
═════════════════════════════════════════════

  NEW FINDING FROM CSPM/CNAPP
         │
         ▼
  ┌──────────────────┐
  │ 1. VALIDATE       │ Is this a TRUE POSITIVE?
  │    TP or FP?      │ Check configuration, compare to intended state
  └───────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
  TRUE       FALSE
  POSITIVE   POSITIVE
    │         │
    │         ▼
    │    ┌───────────────────────┐
    │    │ Create EXCEPTION:      │
    │    │ • Scope (specific ARN) │
    │    │ • Justification        │
    │    │ • Approver sign-off    │
    │    │ • Expiry date (90 days)│
    │    │ • Re-review trigger    │
    │    └───────────────────────┘
    │
    ▼
  ┌──────────────────┐
  │ 2. CONTEXTUALIZE  │ Apply 5-Layer Risk Assessment
  │    (5 Layers)     │ Determine real-world severity
  └───────┬──────────┘
         │
         ▼
  ┌──────────────────┐
  │ 3. DETERMINE      │ Is it configuration drift or bad IaC?
  │    ROOT CAUSE     │ Check tags: terraform:workspace, cloudformation:stack
  │                   │ Compare live config vs code
  └───────┬──────────┘
         │
    ┌────┴────┐
    ▼         ▼
  DRIFT      BAD IaC
  (manual    (code has
   change)   the bug)
    │         │
    │         │
    ▼         ▼
  ┌──────────────────┐
  │ 4. ASSIGN OWNER   │ Resource tags → team → individual
  │    & CREATE TICKET │ Include: fix steps, Terraform diff, SLA
  └───────┬──────────┘
         │
         ▼
  ┌──────────────────┐
  │ 5. TRACK & VERIFY │ Monitor SLA compliance
  │                   │ Verify fix in next CSPM scan
  │                   │ Close ticket when resolved
  └──────────────────┘

```

---

# PART 8: RISK COMMUNICATION FRAMEWORK

---

## 8.1 Speaking to Different Audiences

```

RISK COMMUNICATION — AUDIENCE ADAPTATION
════════════════════════════════════════

THE SAME FINDING, THREE AUDIENCES:

FINDING: "Production EKS pods running as privileged containers with
          access to customer database via overly-permissive IRSA role"

┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  AUDIENCE 1: ENGINEERING TEAM (Technical)                            │
│  ─────────────────────────────────────────                           │
│  "The payment-service pods in the payments namespace are running     │
│  with privileged: true in the SecurityContext. Combined with the     │
│  IRSA role arn:aws:iam::xxx:role/payment-role having s3:*and       │
│  dynamodb:* permissions, an attacker who exploits a container escape │
│  could access the customer-data S3 bucket and payments DynamoDB     │
│  table. Here's the fix:                                              │
│                                                                      │
│  1. Remove privileged: true from deployment.yaml line 42            │
│  2. Add drop: ['ALL'] to securityContext.capabilities               │
│  3. Scope IRSA policy to specific table/bucket ARNs                 │
│  4. I've created a PR with the exact changes: PR #1234"             │
│                                                                      │
│  FORMAT: Technical details + exact remediation + PR link             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AUDIENCE 2: ENGINEERING MANAGER (Semi-Technical)                    │
│  ─────────────────────────────────────────────────                   │
│  "We've identified a critical security gap in the payments service. │
│  The containers running the payment API have elevated privileges     │
│  that could allow an attacker to access our customer database       │
│  containing 2M+ records. The fix is a configuration change that     │
│  takes ~2 hours of developer time. We need it prioritized this      │
│  sprint — the SLA is 24 hours. I've already prepared the code       │
│  changes in PR #1234 to minimize developer effort."                 │
│                                                                      │
│  FORMAT: Risk summary + business impact + effort estimate + ask     │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AUDIENCE 3: CISO / VP / BOARD (Non-Technical)                       │
│  ──────────────────────────────────────────────                      │
│  "We discovered that our payment system has a security              │
│  vulnerability that could allow unauthorized access to 2 million    │
│  customer records. If exploited, this would require mandatory       │
│  breach notification under GDPR/PCI-DSS, estimated cost $2M-$5M    │
│  in fines and remediation. Our team has already developed the fix   │
│  and will deploy it within 24 hours. After this fix, we'll have     │
│  3 critical attack paths remaining, down from 12 at the start of   │
│  the quarter."                                                      │
│                                                                      │
│  FORMAT: Business risk + regulatory impact + dollar cost +           │
│          remediation timeline + progress trend                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

```

## 8.2 Risk Quantification for Stakeholders

```

RISK QUANTIFICATION TECHNIQUES
═══════════════════════════════

TECHNIQUE 1: FAIR (Factor Analysis of Information Risk)
├── FREQUENCY: How often could this be exploited? (per year)
├── MAGNITUDE: What's the maximum loss if exploited? (dollars)
├── RISK = FREQUENCY × MAGNITUDE
├── Example: SSRF exploit on public EKS pod
│   ├── Frequency: 2-5 attempts/year (based on threat intel)
│   ├── Magnitude: $1M-$5M (breach notification + fines)
│   └── Annual risk exposure: $2M-$25M
└── Makes security spending justifiable: "We're spending $50K to
    prevent a $2M+ potential loss"

TECHNIQUE 2: ATTACK PATH SCORING
├── Instead of counting individual findings, count ATTACK PATHS
├── "We have 3,000 findings but only 12 critical attack paths"
├── Track attack paths closed over time (trend line)
├── Leadership cares about attack paths, not individual findings
└── Metric: "Critical attack paths: 12 → 3 this quarter" (75% reduction)

TECHNIQUE 3: SLA COMPLIANCE RATE
├── Track: What % of findings are remediated within SLA?
├── Target: 95%+ for Critical, 90%+ for High
├── Shows operational maturity, not just finding count
└── "Our SLA compliance for critical findings is 97%"

TECHNIQUE 4: RISK ACCEPTANCE REGISTER
├── For findings that WON'T be fixed (business decision)
├── Document: Finding, Risk, Business Justification, Approver, Expiry
├── Review quarterly: "We have 15 accepted risks, 3 expiring this month"
├── Prevents "shadow risk" — accepted risks are visible and tracked
└── Audit trail for compliance (SOC 2, PCI-DSS, HIPAA)

```

---

# PART 9: INTERVIEW QUESTIONS — IaC & TERRAFORM SECURITY

---

### Q1. "What is Infrastructure as Code security and why is it important?"

> "IaC security means scanning infrastructure definitions — Terraform, CloudFormation, Kubernetes YAML — for security misconfigurations BEFORE they're deployed to the cloud. It's the cornerstone of shift-left security.
>
> Why it matters: Without IaC scanning, you deploy first and detect later. A Security Group allowing 0.0.0.0/0 exists in production for days or weeks before CSPM catches it. With IaC scanning in CI/CD, that same misconfiguration is caught in the pull request — zero exposure window. The fix costs 1x in code versus 100x in production.
>
> In my experience, I trace CSPM findings back to their Terraform source. When I see a misconfiguration in Falcon or Wiz, I check the resource tags for `terraform:workspace` to find the exact `.tf` file, then provide the engineering team with the specific code fix — not just a ticket saying 'fix this.'"

---

### Q2. "How do you secure Terraform state files?"

> "Terraform state files are arguably the most sensitive artifact in your IaC workflow because they contain a complete blueprint of your infrastructure including resource IDs, ARNs, IPs, and often secrets in plaintext.
>
> My approach:
> 1. **Remote backend in S3** with server-side encryption (SSE-KMS using a CMK, not the default key)
> 2. **DynamoDB state locking** to prevent concurrent modifications
> 3. **Bucket access restricted** to the CI/CD service role only — developers can't directly read the state
> 4. **S3 versioning enabled** so you can recover from state corruption
> 5. **S3 access logging** for full audit trail of who accessed the state
> 6. **Never commit** `.tfstate` to git — added to `.gitignore`
> 7. **Separate state files** per environment — `prod/terraform.tfstate` and `dev/terraform.tfstate` are isolated
>
> The most overlooked risk? Secrets in the state file. Even if you use `sensitive = true` in variables, the actual value is stored in plaintext in the state. That's why the state file encryption and access control are non-negotiable."

---

### Q3. "Explain configuration drift and how you detect and remediate it."

> "Drift is when the live cloud state doesn't match what's defined in your Terraform code. It typically happens through 'console cowboys' — engineers making quick fixes in the AWS Console during incidents, or running CLI commands that bypass the IaC workflow.
>
> **Detection:**
> - `terraform plan -refresh-only` shows resources that changed outside Terraform
> - CSPM tools (Falcon, Wiz) detect the misconfiguration in the live environment
> - AWS Config rules catch non-compliant configurations
> - I cross-reference: if CSPM finds an open SG but the Terraform code says it should be restricted, that's drift
>
> **Remediation (CRITICAL — fix in code, NOT in console):**
> 1. Identify the drifted resource via CSPM + CloudTrail
> 2. Determine if the manual change was intentional or accidental
> 3. If accidental: run `terraform apply` to revert to the IaC-defined state
> 4. If intentional: update the Terraform code to reflect the desired state, then apply
> 5. NEVER fix drift in the console — it will drift again on the next `terraform apply`
>
> **Prevention:**
> - Automated drift detection in CI/CD (scheduled `terraform plan` runs)
> - AWS Config rules that alert on out-of-band changes
> - EventBridge + Lambda auto-revert for critical security controls (e.g., auto-close public S3)"

---

### Q4. "What IaC scanning tools have you used, and how do you choose between them?"

> "I evaluate IaC scanners on five criteria: policy coverage, CI/CD integration, false positive rate, custom policy support, and remediation guidance.
>
> **Checkov** — My go-to for comprehensive scanning. 2,500+ built-in policies, supports Terraform, CloudFormation, Kubernetes, and Dockerfiles. I write custom policies in Python when our organization has specific requirements not covered by defaults.
>
> **tfsec** — Fastest for pure Terraform. Great for developer IDE integration (VS Code). Lower latency in CI/CD pipelines. Now part of Trivy.
>
> **Wiz IaC Scanner** — Best when you already use Wiz for runtime CSPM. It maps IaC findings to their runtime counterparts — you can see both 'this SG rule in Terraform allows 0.0.0.0/0' and 'this SG in production has 50 incoming connection attempts today.'
>
> **OPA/Conftest** — When you need custom policies that go beyond security (cost controls, naming conventions, tagging requirements). Rego language is powerful but has a learning curve.
>
> **Sentinel** — If you use Terraform Cloud/Enterprise. Native integration, no pipeline setup needed.
>
> My recommendation: Checkov or Wiz IaC as the primary scanner in CI/CD, with OPA/Conftest for organization-specific policies."

---

### Q5. "How do you handle exceptions when an IaC scanner blocks a deployment?"

> "Exceptions must be controlled, documented, and time-bounded. Here's my process:
>
> 1. **Developer gets a pipeline failure** — the error message includes the exact finding, severity, and remediation guidance
> 2. **First attempt: fix the code** — 80% of the time, the finding is valid and should be fixed
> 3. **If a legitimate exception is needed** (e.g., the Falcon sensor DaemonSet genuinely needs privileged access):
>    - Developer adds an inline skip annotation: `#checkov:skip=CKV_AWS_123:Falcon sensor requires privileged`
>    - The skip must include a Jira ticket reference for tracking
>    - The skip is code-reviewed in the PR — security team approves
> 4. **Exception audit:** I regularly grep for `checkov:skip` annotations across all repos to ensure they're still justified
> 5. **Time-bounded:** Critical exceptions get a 30-day expiry with automated reminder to re-evaluate
>
> The key principle: exceptions are visible, auditable, and approved — never silent suppression."

---

### Q6. "Walk me through how you'd implement Terraform security scanning in a CI/CD pipeline from scratch."

> "I follow a phased rollout to avoid disrupting development velocity:
>
> **Phase 1 — Observe (Week 1-2):**
> - Add Checkov/tfsec to the pipeline in soft-fail mode (warn, don't block)
> - Run on all PRs, output findings as PR comments
> - Baseline: understand how many findings exist across teams
> - Identify common patterns: 'Every team forgets S3 encryption'
>
> **Phase 2 — Educate (Week 2-3):**
> - Share findings with engineering teams
> - Create remediation runbooks for the top 10 recurring issues
> - Hold 'Secure Terraform' training sessions with code examples
> - Update Terraform modules to be secure by default
>
> **Phase 3 — Enforce Critical (Week 4):**
> - Switch to hard-fail for Critical severity only (open SGs, public RDS, no encryption)
> - Teams have 2 weeks of data showing what would have been blocked
> - Exception process documented and operational
>
> **Phase 4 — Expand (Month 2+):**
> - Add High severity to hard-fail
> - Add custom policies for organization-specific requirements
> - Integrate with Terraform Cloud/Enterprise for approval workflows
> - Track metrics: findings per team, time-to-fix, exception count
>
> **Phase 5 — Continuous Improvement:**
> - Monthly review of scanner effectiveness
> - Tune false positives
> - Add new policies for emerging threats or new compliance requirements"

---

### Q7. "What's the difference between scanning Terraform HCL files versus scanning a Terraform plan?"

> "This is an important distinction that most people miss.
>
> **Scanning .tf files (static analysis):**
> - Analyzes the raw HCL code as text
> - Doesn't resolve variables, modules, or data sources
> - Fast, simple, runs without AWS credentials
> - Limitation: Can't detect issues that depend on dynamic values
>   - Example: `cidr_blocks = var.allowed_cidrs` — the scanner doesn't know what's in the variable
>
> **Scanning Terraform plan (plan analysis):**
> - Runs after `terraform plan` which resolves all variables, modules, and data sources
> - Sees the ACTUAL values that will be applied
> - Can detect: 'this SG will allow 0.0.0.0/0 because var.allowed_cidrs defaults to 0.0.0.0/0'
> - Detects drift: shows what will CHANGE in the live environment
> - Limitation: Requires AWS credentials and takes longer
>
> **Best practice: Do BOTH.**
> - Scan HCL in pre-commit hooks (fast feedback)
> - Scan the plan output in CI/CD (comprehensive, catches dynamic issues)
> - `terraform plan -out=tfplan && terraform show -json tfplan | conftest test -`"

---

### Q8. "How do you secure Terraform modules, especially from public registries?"

> "Terraform modules are a supply chain risk — you're executing code written by someone else in your infrastructure pipeline.
>
> **Security controls:**
> 1. **Prefer private module registry** — Internal modules vetted by the security team
> 2. **Pin versions explicitly** — `source = 'hashicorp/vpc/aws' version = '5.1.2'` not `version = '>= 5.0'`
> 3. **Lock file** — Commit `.terraform.lock.hcl` which includes checksums of exact provider/module versions
> 4. **Review before adoption** — Read the module source code before first use. Check: what resources does it create? Any IAM resources? Any public-facing resources?
> 5. **Automated scanning** — Run IaC scanner on the resolved module code (Checkov `--download-external-modules`)
> 6. **Fork and mirror** — For critical modules, fork to internal git and update on your schedule
> 7. **Monitor updates** — Use Dependabot/Renovate to track module version updates, review changelogs for security-relevant changes"

---

### Q9. "How do you prevent secrets from being exposed in Terraform?"

> "Secrets in Terraform is a multi-layered problem:
>
> **Layer 1 — Don't hardcode:** Use variables marked `sensitive = true`, never literal strings in `.tf` files
>
> **Layer 2 — Don't commit:** Add `*.tfvars` to `.gitignore`, use environment variables (`TF_VAR_`) in CI/CD
>
> **Layer 3 — Use a secrets manager:** Fetch at apply time via `data 'aws_secretsmanager_secret_version'` — secrets never exist in code or tfvars
>
> **Layer 4 — Protect the state:** Even with `sensitive = true`, the actual value is in the state file in plaintext. Encrypt the state backend, restrict access.
>
> **Layer 5 — Detect leaks:** Pre-commit hooks with `detect-secrets` or `gitleaks` scan for patterns that look like credentials
>
> **Layer 6 — Audit trail:** If a secret IS leaked to git, immediately rotate the credential, use `git filter-branch` or BFG Repo-Cleaner to remove from history, and notify the security team"

---

### Q10. "Explain the concept of Terraform Sentinel policies and how they differ from IaC scanners."

> "Sentinel is HashiCorp's policy-as-code framework, native to Terraform Cloud and Enterprise. It evaluates policies AFTER `terraform plan` but BEFORE `terraform apply`.
>
> **Key differences from IaC scanners:**
>
> | | Sentinel | IaC Scanners (Checkov/tfsec) |
> |---|---|---|
> | **When it runs** | Between plan and apply (built into TF workflow) | In CI/CD pipeline (external to TF) |
> | **What it sees** | Full plan context: resource changes, state, variable values | HCL source code or plan JSON |
> | **Policy language** | Sentinel (HashiCorp proprietary) | Python, Rego, YAML, JSON |
> | **Enforcement levels** | Advisory, Soft Mandatory, Hard Mandatory | Pass/Fail (binary) |
> | **Use case** | Organizational policies (cost, tagging, regions) | Security misconfigurations |
> | **Open source** | No (requires TF Cloud/Enterprise) | Yes (most scanners are OSS) |
>
> **Sentinel enforcement levels:**
> - **Advisory** — logs warning, apply proceeds
> - **Soft Mandatory** — blocks apply, but operator can override with justification
> - **Hard Mandatory** — blocks apply, no override possible
>
> **Real-world usage:** We use Checkov in CI/CD for security scanning AND Sentinel in Terraform Cloud for organizational policies like 'no resources outside approved regions' or 'all instances must be under $X/month'"

---

### Q11. "What are the most critical Terraform misconfigurations you've encountered, and how did you remediate them?"

> "The ones I see most often in production environments:
>
> **1. S3 buckets without public access block** — Most dangerous because it's one API call away from data exposure. Fix: `aws_s3_bucket_public_access_block` with all four settings set to `true`. I enforce this via IaC scanner + EventBridge auto-remediation Lambda.
>
> **2. Security Groups with 0.0.0.0/0 ingress on SSH/RDP** — Especially common after incident response when engineers open ports and forget to close them. Fix: restrict to corporate CIDR, or better, eliminate SSH entirely and use SSM Session Manager.
>
> **3. RDS instances with `publicly_accessible = true`** — Usually accidental from copying dev configs to prod. Fix: `publicly_accessible = false` + ensure it's in a private subnet group.
>
> **4. IAM policies with `Action: '*'` and `Resource: '*'`** — 'Admin access because it works' mentality. Fix: Use IAM Access Analyzer to generate least-privilege policies based on actual usage.
>
> **5. EKS clusters with public API endpoint** — Exposes the Kubernetes API to the internet. Fix: `endpoint_public_access = false`, `endpoint_private_access = true`, access via VPN or bastion.
>
> For each of these, I create a Terraform module that's secure by default, so teams don't have to remember the security settings — they're built in."

---

### Q12. "How do you handle Terraform at scale across multiple teams and environments?"

> "At scale, you need governance, modularity, and automation:
>
> **Architecture:**
> - Separate state files per environment per team (e.g., `team-a/prod/vpc/terraform.tfstate`)
> - Shared modules in a private registry with version tags
> - Standard directory layout enforced via a cookiecutter template
>
> **Governance:**
> - Terraform Cloud/Enterprise with workspace-level IAM (team A can only apply to their accounts)
> - Sentinel policies for organizational guardrails
> - Mandatory IaC scanning in CI/CD for all teams
> - Security team reviews all new module publications
>
> **Access Control:**
> - Developers: `terraform plan` only (read-only AWS access)
> - CI/CD: `terraform apply` with scoped IAM roles per workspace
> - Production: requires manual approval from team lead + security review for sensitive changes (IAM, networking)
>
> **Monitoring:**
> - Drift detection: scheduled `terraform plan` runs comparing state to live
> - CSPM integration: Wiz/Falcon catches anything the IaC process misses
> - Metrics: findings per team, SLA compliance, module adoption rate"

---

### Q13. "What's your approach to creating secure Terraform modules?"

> "Secure modules are the force multiplier — write it once, secure every deployment:
>
> **Design principles:**
> 1. **Secure by default** — encryption enabled, public access blocked, logging on
> 2. **Opt-in for weakening** — if someone needs to make it less secure, they must explicitly set `enable_public_access = true` (and IaC scanner will flag it)
> 3. **Validated inputs** — use `validation` blocks on variables to reject insecure values
> 4. **Comprehensive tagging** — module automatically applies mandatory tags
> 5. **Documentation** — `terraform-docs` generates input/output docs
>
> **Example: Secure S3 module:**
> ```hcl
> variable 'enable_public_access' {
>   type    = bool
>   default = false
>   validation {
>     condition     = var.enable_public_access == false
>     error_message = 'Public access is not allowed. Contact security@company.com for exceptions.'
>   }
> }
> ```
>
> The module automatically creates the bucket WITH encryption, logging, versioning, public access block, and lifecycle rules. The developer only specifies the bucket name and data classification."

---

### Q14. "How do you handle Terraform provider and version management from a security perspective?"

> "Provider and version management is often overlooked but it's a classic supply chain risk.
>
> **Provider pinning:** I pin major versions in `required_providers` to prevent breaking changes, but allow patch updates for security fixes: `version = '~> 5.0'` means >= 5.0, < 6.0.
>
> **Lock file:** `.terraform.lock.hcl` is committed to git. It contains SHA-256 checksums of the exact provider binary. If someone tampers with the provider, the checksum won't match and `terraform init` will fail.
>
> **Terraform version:** Pinned in `required_version` and enforced in CI/CD via `tfenv` or Docker image with a specific Terraform version.
>
> **Update process:**
> 1. Dependabot/Renovate creates PRs for version updates
> 2. Security team reviews the changelog for each update
> 3. Update is tested in dev/staging first
> 4. Promoted to production after validation
>
> **Network security:** In restricted environments, providers are downloaded from an internal mirror (Artifactory), not directly from HashiCorp. Prevents supply chain attack at the network level."

---

### Q15. "Describe a scenario where you traced a runtime misconfiguration back to Terraform code."

> "A real scenario from my work: Falcon CSPM flagged a Security Group in production allowing inbound 0.0.0.0/0 on port 22. This was a Critical IOM.
>
> **Investigation:**
> 1. I checked the resource tags — `terraform:workspace = vpc-production`, `terraform:module = security-groups`
> 2. This confirmed it was Terraform-managed, so I opened the repo
> 3. The `.tf` file showed `cidr_blocks = [var.ssh_allowed_cidr]`
> 4. I checked the `terraform.tfvars` for production — `ssh_allowed_cidr = '10.0.0.0/8'` (correct)
> 5. But `terraform plan` showed no drift — the live state matched the code
> 6. CloudTrail showed: `AuthorizeSecurityGroupIngress` by `user/john.doe` adding 0.0.0.0/0 manually
>
> **Verdict:** This was drift, not bad IaC. John opened SSH during an incident and forgot to close it.
>
> **Fix:** Ran `terraform apply` which reverted the SG to the code-defined value (10.0.0.0/8). Added an AWS Config rule + Lambda auto-remediation to automatically revoke any 0.0.0.0/0 rules on ports 22/3389.
>
> **Prevention:** Proposed replacing SSH access entirely with SSM Session Manager — no inbound SG rules needed."

---

### Q16. "What is the role of OPA (Open Policy Agent) in Terraform security?"

> "OPA is a general-purpose policy engine that uses the Rego language to evaluate structured data against policies. In Terraform, it's used via Conftest to evaluate the Terraform plan JSON output.
>
> **How it works:**
> 1. Run `terraform plan -out=tfplan`
> 2. Convert to JSON: `terraform show -json tfplan > tfplan.json`
> 3. Evaluate against OPA policies: `conftest test tfplan.json -p policies/`
>
> **Why OPA over IaC scanners?**
> - OPA evaluates the RESOLVED plan (all variables substituted, modules expanded)
> - OPA policies are infinitely customizable — any business logic you can express
> - OPA is not limited to security — cost controls, naming conventions, region restrictions
> - OPA is cloud-agnostic — same engine for AWS, Azure, GCP
>
> **Example Rego policies:**
> - 'No EC2 instances larger than m5.xlarge'
> - 'All S3 buckets must be in us-east-1 or eu-west-1'
> - 'IAM policies cannot grant PassRole on *'
> - 'Total estimated cost change must be < $1000 per PR'
>
> I use OPA alongside Checkov: Checkov for standard security checks, OPA for organization-specific policies."

---

### Q17. "How do you manage Terraform security in a multi-account AWS environment?"

> "Multi-account requires a hub-and-spoke model:
>
> **Architecture:**
> - **Pipeline account** (hub): runs Terraform with assume-role into target accounts
> - **Target accounts** (spokes): production, staging, dev, security, logging
> - Each target has a `TerraformExecutionRole` with specific permissions for that environment
>
> **Assume-role pattern:**
> ```hcl
> provider 'aws' {
>   alias  = 'production'
>   region = 'us-east-1'
>   assume_role {
>     role_arn     = 'arn:aws:iam::PROD_ID:role/TerraformExecutionRole'
>     session_name = 'terraform-prod'
>     external_id  = 'org-unique-id'
>   }
> }
> ```
>
> **Security controls:**
> - SCPs at the organization level prevent Terraform from doing anything outside policy
> - Each account's execution role is scoped to only what Terraform manages in that account
> - State files are separated by account: `s3://state/account-123/terraform.tfstate`
> - IaC scanning occurs centrally in the pipeline account
> - CloudTrail aggregates all API calls to a centralized logging account
>
> **Governance:**
> - Account vending machine (AFT or custom) creates new accounts with the execution role pre-configured
> - Baseline modules deployed to every account via StackSets or Terraform"

---

### Q18. "How do you implement 'secure by default' Terraform modules?"

> "Secure-by-default means the developer doesn't have to remember security controls — they're built into the module:
>
> **Pattern:**
> ```hcl
> # SECURE BY DEFAULT — developer only specifies business requirements
> module 's3_bucket' {
>   source = 'git::ssh://git@github.com/myorg/terraform-modules.git//s3-secure?ref=v2.0.0'
>   
>   bucket_name         = 'my-app-data'
>   data_classification = 'confidential'    # triggers stricter controls
>   
>   # EVERYTHING ELSE IS HANDLED BY THE MODULE:
>   # ✅ Encryption with CMK (auto-selected by data classification)
>   # ✅ Public access block (all four settings)
>   # ✅ Versioning enabled
>   # ✅ Access logging to central logging bucket
>   # ✅ Lifecycle rules based on data classification
>   # ✅ Mandatory tags (Owner, CostCenter from caller context)
>   # ✅ Bucket policy denying unencrypted uploads
> }
> ```
>
> **Key design decisions:**
> - Variables have secure defaults — you must explicitly opt into insecurity
> - Input validation blocks reject obviously insecure values
> - The module is versioned — security updates are released as new versions
> - Adoption is tracked: 'What % of S3 buckets use the secure module?'
> - Non-module S3 buckets are flagged by CSPM as non-compliant"

---

### Q19. "What is Terraform import and what are the security implications?"

> "`terraform import` brings existing, manually-created resources into Terraform management. There are important security considerations:
>
> **When to use:** A resource was created manually (console/CLI) and needs to be managed by IaC going forward. Common during cloud security remediation — bringing 'shadow infrastructure' under IaC control.
>
> **Security implications:**
> 1. **Configuration accuracy:** After import, you must write the `.tf` code that EXACTLY matches the current live state, or the next `terraform apply` will change the resource (potentially breaking it)
> 2. **State file exposure:** The imported resource's full configuration, including any secrets, is now in the state file
> 3. **Drift risk:** If you import but write incorrect HCL, `terraform apply` will modify the live resource — this could be destructive
> 4. **IaC scanner baseline:** After import, run IaC scanning on the new code — it will likely show misconfigurations that existed in the manually-created resource
>
> **Safe import process:**
> 1. `terraform import aws_security_group.existing sg-abc123`
> 2. `terraform state show aws_security_group.existing` → see the full config
> 3. Write the `.tf` code to match the current state exactly
> 4. `terraform plan` → should show 'No changes' (confirms accuracy)
> 5. NOW fix the misconfigurations in code + IaC scan
> 6. `terraform apply` to apply the security fixes"

---

### Q20. "How do you use Terraform workspaces securely?"

> "Terraform workspaces allow multiple state files for the same configuration. They're useful but need security considerations:
>
> **Good use case:** Same VPC module deployed to dev/staging/prod with different variable values:
> ```bash
> terraform workspace new production
> terraform workspace new staging
> terraform workspace select production
> terraform apply -var-file=production.tfvars
> ```
>
> **Security considerations:**
> - Each workspace has its own state file — ensure ALL state files are encrypted and access-controlled
> - Workspace names are stored in the state path: `env:/production/terraform.tfstate`
> - **RISK:** A developer accidentally `terraform workspace select production` and runs `apply` with dev variables → destroys prod resources
>
> **Mitigation:**
> - Don't use workspaces for environment separation in production — use separate directories/repos instead
> - If using workspaces, implement Terraform Cloud workspace-level RBAC (only CI/CD can apply to production workspace)
> - Pipeline validates: `if [[ $(terraform workspace show) == 'production' ]] && [[ ${BRANCH} != 'main' ]]; then exit 1; fi`
>
> **My recommendation:** For enterprise environments, separate directories or repos per environment are safer than workspaces because they have independent state, independent CI/CD, and independent access controls."

---

# PART 10: INTERVIEW QUESTIONS — CI/CD PIPELINE SECURITY

---

### Q21. "What are the biggest security risks in CI/CD pipelines?"

> "I categorize CI/CD risks using the **STRIDE** model adapted for pipelines:
>
> 1. **Secret exfiltration** — Build steps can read environment variables, including secrets. A malicious build step or dependency can exfiltrate credentials to an external server.
> 2. **Dependency confusion** — Attacker publishes a package with the same name as your internal package but in a public registry. Your build system auto-downloads the malicious public version.
> 3. **Build environment compromise** — If build agents are persistent (not ephemeral), an attacker who compromises one build can access secrets from subsequent builds.
> 4. **Tampered artifacts** — Images or binaries modified between build and deployment. Without image signing and verification, you can't prove integrity.
> 5. **Credential theft via SSRF** — Build environment in AWS can query IMDS for IAM credentials attached to the build instance.
> 6. **Branch protection bypass** — Without strict branch protection, an attacker who compromises a developer account can push directly to main.
>
> The SolarWinds attack demonstrated the worst case: a compromised build system that injected a backdoor into signed software updates affecting 18,000+ organizations."

---

### Q22. "How do you eliminate long-lived credentials in CI/CD pipelines?"

> "OIDC federation is the answer. Instead of storing AWS access keys as CI/CD secrets:
>
> 1. **Configure an OIDC provider** in AWS IAM that trusts your CI/CD platform (GitHub Actions, GitLab CI)
> 2. **Create an IAM role** with a trust policy that only allows the specific repo and branch
> 3. **In the pipeline,** the CI/CD platform issues a short-lived JWT token
> 4. **AWS STS** exchanges the JWT for temporary credentials (1 hour, no persistent secret)
>
> **Why this is critical:**
> - No secrets to leak or rotate
> - Each build gets unique credentials → full audit trail in CloudTrail
> - Scoped to specific repo AND branch via trust policy conditions
> - Even if a fork runs the same workflow, it can't assume the role because the `sub` claim won't match
>
> I've implemented this for GitHub Actions, and it eliminates the entire class of 'leaked CI/CD credentials' incidents."

---

### Q23. "How do you implement image signing and verification in a CI/CD pipeline?"

> "Image signing creates a cryptographic guarantee that the image deployed to production is the exact image built and scanned in CI/CD.
>
> **Pipeline flow:**
> 1. **Build:** Docker image built in CI/CD
> 2. **Scan:** Image scanned for CVEs (Trivy, Snyk, Wiz)
> 3. **Sign:** If scan passes, sign with Cosign or AWS Signer
>    - `cosign sign --key cosign.key $IMAGE_DIGEST`
> 4. **Push:** Signed image pushed to ECR with immutable tag
> 5. **Deploy:** Kubernetes admission controller verifies signature
>    - Unsigned or tampered image → **REJECTED**
>
> **Verification at admission:**
> - Sigstore/Cosign verification policy in Kyverno or OPA
> - Only images signed with our organization's key are admitted
> - This prevents: rogue images, tampered images, images from unauthorized registries
>
> **Key management:**
> - Signing key stored in KMS (not in code)
> - Key rotation: annual, with overlap period
> - Separate keys per environment (dev/prod)"

---

### Q24. "How do you secure the build environment itself?"

> "The build environment is a high-value target because it has access to secrets, source code, and deployment credentials.
>
> **Hardening measures:**
> 1. **Ephemeral agents** — Destroy the build VM/container after each job. No persistent state between builds.
> 2. **Network isolation** — Build in a private VPC with no internet access. Pull dependencies from internal artifact mirrors (Artifactory, Nexus).
> 3. **Minimal IAM** — Build role can push to ECR and read from Secrets Manager. Nothing else.
> 4. **No secrets in environment variables** — Fetch from Secrets Manager at runtime, never set as env vars that could be logged.
> 5. **Build log scrubbing** — Mask any value that matches a secret pattern in logs.
> 6. **Monitoring** — CloudTrail for all API calls from the build role. Alert on unusual patterns (e.g., build role accessing S3 buckets outside its scope).
>
> **Advanced:** Use hardware-backed attestation (e.g., SLSA Level 3) where the build system itself is verified before producing artifacts."

---

### Q25. "What is SLSA and why does it matter for CI/CD security?"

> "SLSA (Supply-chain Levels for Software Artifacts) is a framework from Google that defines four levels of increasing supply chain security:
>
> **Level 1:** Build process is documented (basic provenance)
> **Level 2:** Build run by a hosted, authenticated service (not local machines)
> **Level 3:** Source and build are verified — hermetic builds, OIDC identity, build provenance attestation
> **Level 4:** All dependencies have verified provenance, two-party code review
>
> **Why it matters:** After SolarWinds and xz Utils, organizations need to prove that the artifact deployed to production was built from the exact source code in the reviewed PR, using a verified build system, with no tampering in between. SLSA provenance provides cryptographic proof of this chain.
>
> **In practice:** GitHub Actions now generates SLSA provenance attestations automatically. Kubernetes admission controllers can verify these attestations before admitting a container."

---

### Q26. "How do you prevent dependency confusion attacks?"

> "Dependency confusion exploits the way package managers resolve names. If I know your internal package is called `myorg-auth`, I publish `myorg-auth` to the public npm/PyPI registry with a higher version number. Your build system pulls the public (malicious) version.
>
> **Prevention:**
> 1. **Scoped packages** — Use npm scopes (`@myorg/auth`), Python namespace packages
> 2. **Registry configuration** — Configure build to ONLY pull from internal registry for internal packages: `.npmrc: registry=https://artifactory.myorg.com/npm/`
> 3. **Reserved names** — Publish placeholder packages to public registries for your internal package names
> 4. **Lock files** — Commit lock files (`package-lock.json`, `Pipfile.lock`) with exact versions and registry URLs
> 5. **SCA scanning** — Tools like Snyk can detect dependency confusion patterns
> 6. **Network restrictions** — Build environment can only reach internal artifact registry, not public internet"

---

### Q27. "How would you implement security gates in a CI/CD pipeline?"

> "I implement four progressive gates in every pipeline:
>
> | Gate | Stage | Tools | Fail Criteria | Action |
> |------|-------|-------|---------------|--------|
> | 1 | Pre-commit | detect-secrets, tfsec, gitleaks | Secret detected | Block commit |
> | 2 | Build (IaC) | Checkov, Wiz IaC, Conftest | Critical/High severity | Fail pipeline |
> | 3 | Build (Image) | Trivy, Snyk Container | Critical CVE | Block ECR push |
> | 4 | Deploy (K8s) | KAC, OPA Gatekeeper | Non-compliant pod | Reject admission |
>
> **Exception handling per gate:**
> - Gate 1: Inline skip (`#checkov:skip=CKV_...`) with Jira reference
> - Gate 2: Policy exception file in repo, approved by security team in PR
> - Gate 3: CVE exception list with expiry date and remediation ticket
> - Gate 4: Namespace-scoped KAC exceptions (e.g., `falcon-system` namespace)
>
> **Monitoring:** Track block rates per gate, false positive rates, time-to-fix when blocked."

---

### Q28. "What is GitOps and how does it improve security?"

> "GitOps is a pattern where git is the single source of truth for both application code AND infrastructure configuration. Tools like ArgoCD or Flux continuously reconcile the live cluster state with what's in git.
>
> **Security benefits:**
> 1. **Audit trail** — Every change is a git commit with author, timestamp, and diff
> 2. **Approval workflows** — Production changes require PR approval (code review = change review)
> 3. **Drift detection** — ArgoCD shows when live state diverges from git → auto-reconcile or alert
> 4. **Credential isolation** — Only ArgoCD has deployment credentials, not developers
> 5. **Rollback** — `git revert` undoes any change, including security issues
> 6. **Least privilege** — Developers push to git, ArgoCD deploys. Developers never need cluster access for deployments.
>
> **Security risk in GitOps:** The git repository becomes the crown jewel. Compromise git → compromise everything. Mitigation: branch protection, signed commits, CODEOWNERS file for security-sensitive paths."

---

### Q29. "How do you scan container images in the CI/CD pipeline?"

> "I scan images at three points in the lifecycle:
>
> 1. **Build time (CI):** After `docker build`, before `docker push`
>    ```yaml
>    - name: Scan Image
>      uses: aquasecurity/trivy-action@master
>      with:
>        image-ref: myapp:${{ github.sha }}
>        severity: 'CRITICAL,HIGH'
>        exit-code: '1'
>        ignore-unfixed: true
>    ```
>    - Blocks push to ECR if Critical CVEs found
>    - `ignore-unfixed: true` avoids blocking on CVEs with no available patch
>
> 2. **Registry (continuous):** ECR enhanced scanning or Wiz scans all images in the registry continuously
>    - New CVE published yesterday? Every image in ECR is re-evaluated
>    - Alert on Critical CVEs in images used by production workloads
>
> 3. **Runtime (ongoing):** Wiz/Falcon scans running containers
>    - Maps CVEs to actual running pods, not just stored images
>    - Prioritizes: 'This CVE is on an internet-facing pod with data access' vs 'same CVE on an internal dev pod'
>
> **The key metric:** 'Mean time from CVE publication to patched image in production'"

---

### Q30. "What's the difference between SAST, SCA, DAST, and IAST?"

> "These are complementary application security testing methods:
>
> | Method | What It Scans | When | Strengths | Limitations |
> |--------|--------------|------|-----------|-------------|
> | **SAST** | Source code (white-box) | Build time | Finds code flaws (SQLi, XSS), early feedback | High false positives, can't test runtime behavior |
> | **SCA** | Dependencies (libraries) | Build time | Finds CVEs in third-party code, license issues | Can't assess your custom code |
> | **DAST** | Running application (black-box) | Test/staging | Finds runtime issues (auth bypass, SSRF), low false positives | Slow, requires running app, late in pipeline |
> | **IAST** | Instrumented app (gray-box) | Test/staging | Combines SAST+DAST accuracy, maps to exact code line | Requires runtime agent, language-specific |
>
> **In CI/CD:** SAST + SCA at build time (fast, shift-left), DAST in staging (runtime validation), IAST if available.
>
> **For IaC:** IaC scanners (Checkov/tfsec) are essentially SAST for infrastructure code — they analyze the code without executing it."

---

### Q31. "How do you handle a compromised CI/CD pipeline?"

> "This is a critical incident response scenario:
>
> **Detection:** Unusual behavior in build logs, unexpected packages installed, builds taking longer, CloudTrail shows unusual API calls from the build role.
>
> **Immediate response:**
> 1. **Disable the pipeline** — Stop all running jobs immediately
> 2. **Quarantine artifacts** — Mark all recent builds as untrusted until verified
> 3. **Revoke credentials** — Rotate ALL secrets accessible from the CI/CD environment (AWS keys, Docker tokens, API keys, deployment credentials)
> 4. **Investigate scope:**
>    - Which jobs were affected?
>    - When did the compromise start? (review build logs going back as far as possible)
>    - What artifacts were produced during the compromised period?
>    - Were any of these artifacts deployed to production?
>
> **If compromised artifacts reached production:**
> - Roll back to the last known-good build
> - Scan production for indicators of compromise
> - Check for persistence mechanisms in deployed workloads
>
> **Root cause investigation:**
> - Malicious PR merged? → Review git history
> - Compromised dependency? → SCA scan all dependencies
> - Build environment compromised? → Check if agents were persistent (should be ephemeral)
>
> **Post-incident:** Implement SLSA provenance, image signing, and ephemeral build agents if not already in place."

---

### Q32. "How do you implement least-privilege access for CI/CD pipelines?"

> "Every CI/CD component should have exactly the permissions it needs and nothing more:
>
> **Source control access:**
> - Pipeline bot account: read repo + write PR comments (for scanner results)
> - No admin access to the git organization
>
> **Build stage:**
> - Read: Source code repository (clone)
> - Read: Artifact registry (pull base images, dependencies)
> - Write: Build artifacts (push to staging artifact store only)
>
> **Scan stage:**
> - Read: Built artifacts (scan images, code)
> - Write: Results to security dashboard (SARIF upload)
>
> **Deploy stage (per environment):**
> - Staging: Apply changes + ECR push to staging account
> - Production: Assume production deployment role (separate, more restricted)
> - Each environment role is in a different AWS account with distinct permissions
>
> **The anti-pattern to avoid:** One service account with admin access used for build, scan, AND deploy across all environments. If compromised, the attacker can deploy anything to production."

---

### Q33. "How do you manage secrets rotation in CI/CD?"

> "Secret rotation in CI/CD requires a strategy that doesn't break the pipeline:
>
> **Approach 1: No secrets to rotate (OIDC — preferred):**
> - Use OIDC federation for AWS → zero persistent secrets
> - Use short-lived tokens for registry access → auto-expire
>
> **Approach 2: Automated rotation with dual-write:**
> - AWS Secrets Manager with automated rotation Lambda
> - Rotation creates a new version while keeping the old one valid for 24h
> - CI/CD always reads the latest version → picks up new secret automatically
> - No pipeline changes needed during rotation
>
> **Approach 3: External Secrets Operator (Kubernetes):**
> - ESO syncs secrets from Secrets Manager/Vault to Kubernetes secrets
> - Rotation in the source automatically propagates to the cluster
> - Pods can be configured to restart on secret change
>
> **What NOT to do:**
> - Don't store secrets in pipeline YAML files
> - Don't share secrets across environments
> - Don't use the same service account for all pipelines"

---

### Q34. "How do you implement compliance checks in CI/CD?"

> "Compliance-as-code ensures every deployment meets regulatory requirements automatically:
>
> **Framework compliance in CI/CD:**
> ```yaml
> # Checkov compliance frameworks
> - name: CIS AWS Compliance Check
>   run: checkov -d ./terraform --framework terraform 
>        --check CKV_AWS_* --compact --bc-api-key $BC_KEY
>        --repo-id myorg/myrepo
> ```
>
> **What we check per framework:**
> - **CIS AWS:** S3 encryption, SG rules, IAM policies, CloudTrail, KMS rotation
> - **PCI-DSS:** Encryption in transit/rest, access controls, logging, WAF presence
> - **SOC 2:** Change management (PR approval), access control, monitoring
> - **HIPAA:** PHI encryption, audit logging, access controls for health data
>
> **Compliance evidence automation:**
> - Pipeline logs serve as SOC 2 CC8.1 evidence (automated change management)
> - IaC scan results serve as CIS compliance evidence
> - Image scan results serve as PCI Req 6 evidence
> - All evidence auto-exported to compliance dashboard for auditor access"

---

### Q35. "How do you measure the effectiveness of your CI/CD security program?"

> "I track five key metrics:
>
> 1. **Block rate:** What percentage of PRs are blocked by security gates? (Target: decreasing over time as teams learn)
> 2. **False positive rate:** What percentage of blocks are overridden as exceptions? (Target: < 10%)
> 3. **Mean time to remediation:** How long from finding to fix when a gate blocks? (Target: < 4 hours)
> 4. **Coverage:** What percentage of repos have IaC scanning enabled? (Target: 100%)
> 5. **Escape rate:** How many security issues reach production despite scanning? (Target: near zero)
>
> **Leading indicator:** If block rates are decreasing while coverage stays at 100%, it means teams are writing more secure code from the start — the shift-left is working.
>
> **Dashboards:**
> - Weekly: Findings by team, SLA compliance, top recurring issues
> - Monthly: Trend lines, new policy effectiveness, false positive tuning
> - Quarterly: Security posture improvement, compliance audit readiness"

---

# PART 11: INTERVIEW QUESTIONS — CONTAINER SECURITY & EKS

---

### Q36. "How do you approach container security in an EKS environment?"

> "I secure EKS through six pillars, covering the full lifecycle:
>
> | Pillar | What | How |
> |--------|------|-----|
> | **1. Image Scanning** | Scan every image for CVEs, malware, secrets | CI/CD gate (Trivy/Snyk) + continuous registry scan + runtime re-scan |
> | **2. Configuration Posture** | Audit K8s configs against CIS EKS Benchmark | CSPM flags privileged pods, root containers, missing NetworkPolicies, wildcard RBAC |
> | **3. Runtime Protection** | Detect live threats in containers | Falcon eBPF sensor DaemonSet — container escape, drift, reverse shells, cryptomining |
> | **4. Admission Control** | Block non-compliant workloads | KAC/OPA Gatekeeper rejects unscanned images, privileged pods, unauthorized registries |
> | **5. Identity (CIEM)** | Audit K8s RBAC + cloud IAM (IRSA) | Map ServiceAccount → RBAC → IRSA role → AWS resources. Flag overprivileged identities |
> | **6. Network Visibility** | Map pod-to-pod traffic | Default-deny NetworkPolicies per namespace, alert on unexpected egress |
>
> Each pillar catches what the others miss. Image scanning catches CVEs but not runtime behavior. Runtime protection catches attacks but not misconfigurations. Together, they provide comprehensive defense."

---

### Q37. "Explain IRSA (IAM Roles for Service Accounts) and why it's critical for EKS security."

> "IRSA replaces the node instance profile as the identity mechanism for EKS pods. Without IRSA, every pod on a node shares the node's IAM role — meaning a compromised low-privilege pod can access the same AWS resources as a high-privilege pod on the same node.
>
> **How IRSA works:**
> 1. EKS cluster has an OIDC provider
> 2. Kubernetes ServiceAccount is annotated with an IAM role ARN
> 3. Pod uses the ServiceAccount → receives a projected JWT token
> 4. Pod calls `sts:AssumeRoleWithWebIdentity` using the JWT
> 5. AWS returns temporary credentials scoped to THAT specific role
>
> **Security benefits:**
> - **Isolation:** Each service gets its own IAM role with least-privilege permissions
> - **No IMDS dependency:** Pod uses projected token, not the node's IMDS endpoint
> - **Auditability:** CloudTrail shows which service account made which API call
> - **Condition-based trust:** IAM trust policy requires specific namespace+SA combination
>
> **Common IRSA misconfigurations I check for:**
> - Trust policy missing the OIDC subject condition (any SA could assume the role)
> - IRSA role with `s3:*` or `dynamodb:*` instead of specific resource ARNs
> - Multiple services sharing the same IRSA role (violates isolation principle)"

---

### Q38. "What is Pod Security Admission (PSA) and how do you enforce it?"

> "PSA is the Kubernetes-native replacement for PodSecurityPolicy (deprecated in 1.25). It enforces three security levels — Privileged, Baseline, and Restricted — via namespace labels.
>
> **Enforcement modes:**
> - **enforce:** Non-compliant pods are REJECTED (not created)
> - **audit:** Non-compliant pods are created but logged to the audit log
> - **warn:** Non-compliant pods are created but developer gets a CLI warning
>
> **My deployment strategy:**
> 1. Start with `audit` + `warn` on all namespaces (observe impact)
> 2. Review audit logs: which pods would be blocked?
> 3. Fix the most common issues (privileged, root, etc.)
> 4. Switch production namespaces to `enforce: restricted`
> 5. System namespaces (`falcon-system`, `kube-system`) get `enforce: privileged`
>
> **PSA + KAC/OPA:** PSA is built-in but has limited granularity. I supplement with KAC/OPA for additional checks: specific registry allowlists, image scanning verification, custom label requirements."

---

### Q39. "How do you handle Kubernetes RBAC at scale?"

> "RBAC is the most commonly misconfigured aspect of Kubernetes security. My approach:
>
> **Principle: Namespace-scoped Roles, not ClusterRoles**
> - Application workloads get Roles (namespace-scoped), not ClusterRoles
> - Only platform components (monitoring, logging, security sensors) get ClusterRoles
>
> **Common RBAC misconfigurations I audit for:**
> - `system:masters` group membership for non-admin users
> - ClusterRoleBindings granting `cluster-admin` to ServiceAccounts
> - Wildcard permissions: `resources: ['*'], verbs: ['*']`
> - ServiceAccounts that can `get/list` secrets across namespaces
> - ServiceAccounts that can `create` ClusterRoleBindings (privilege escalation)
>
> **Audit process:**
> ```bash
> # Find all ClusterRoleBindings with cluster-admin
> kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name==\"cluster-admin\") | .subjects'
> 
> # Check what a specific ServiceAccount can do
> kubectl auth can-i --list --as=system:serviceaccount:payments:api-sa
> ```
>
> **Best practice:** `automountServiceAccountToken: false` on all pods that don't need Kubernetes API access (most application pods don't)."

---

### Q40. "Describe your approach to Kubernetes NetworkPolicies."

> "NetworkPolicies are the firewall rules for pod-to-pod communication. Without them, any pod can talk to any other pod — a massive lateral movement opportunity.
>
> **Strategy: Default-Deny + Explicit Allow**
>
> Step 1: Apply default-deny to every namespace:
> ```yaml
> apiVersion: networking.k8s.io/v1
> kind: NetworkPolicy
> metadata:
>   name: default-deny-all
>   namespace: payments
> spec:
>   podSelector: {}
>   policyTypes: [Ingress, Egress]
> ```
>
> Step 2: Add explicit allow rules:
> ```yaml
> # Allow frontend → backend on port 8080
> apiVersion: networking.k8s.io/v1
> kind: NetworkPolicy
> metadata:
>   name: allow-frontend-to-backend
>   namespace: backend
> spec:
>   podSelector:
>     matchLabels:
>       app: api-server
>   ingress:
>   - from:
>     - namespaceSelector:
>         matchLabels:
>           name: frontend
>     ports:
>     - protocol: TCP
>       port: 8080
> ```
>
> **Critical: Must also allow egress to:**
> - DNS (kube-dns on port 53)
> - External services the pod legitimately needs
> - Block egress to 169.254.169.254 (IMDS)"

---

### Q41. "How do you detect and respond to a container escape in EKS?"

> "Container escape is a CRITICAL incident — it means an attacker has broken out of the container and has host-level access.
>
> **Detection (Falcon/Wiz Runtime):**
> - IOA: `ContainerEscape.Nsenter` — nsenter with namespace flags from inside a container
> - IOA: `PotentialKernelTampering` — kernel module loading from container
> - IOA: `ContainerDrift.NewExecutable` — new binary written post-start (might indicate exploit payload)
>
> **Immediate Response (5 minutes):**
> 1. Kill the compromised pod: `kubectl delete pod <name> -n <ns> --grace-period=0`
> 2. Cordon the node: `kubectl cordon <node>` (preserve evidence, prevent new scheduling)
> 3. Apply emergency deny-all NetworkPolicy to the namespace
> 4. Check if kubelet kubeconfig was accessed → if yes, assume cluster compromise
>
> **Investigation (15-120 minutes):**
> - **Root cause:** Was the pod privileged? (enabled nsenter) What vulnerability was exploited?
> - **Lateral movement:** Did they access IMDS? K8s API? Other pods?
> - **Persistence:** New ClusterRoleBindings? DaemonSets? Modified aws-auth ConfigMap?
> - **Data access:** CloudTrail for API calls, S3 access logs, DynamoDB logs
>
> **Post-incident remediation:**
> - Root cause fix: Remove privileged=true, enforce PSA restricted
> - Deploy KAC rule to permanently block privileged containers
> - Rotate all secrets in the affected namespace
> - Replace the compromised node (drain + terminate + auto-scale replaces it)"

---

### Q42. "What is container runtime drift and why is it a security concern?"

> "Container drift means a running container's filesystem has been modified after it started — files that weren't in the original image now exist in the container.
>
> **Why it's dangerous:**
> - Legitimate containers are immutable — they shouldn't change after deployment
> - Drift usually indicates: malware downloaded, exploit payload staged, attacker tools installed, or cryptominer deployed
> - If you can modify the filesystem, the container's integrity is compromised
>
> **How it's detected:**
> - Falcon sensor monitors file creation events inside containers
> - IOA: `ContainerDrift.NewExecutable` — new executable binary written post-start
> - The sensor compares the container's filesystem to its original image layers
>
> **Response:**
> 1. Immediate: Investigate the new file — is it malware? An update script?
> 2. If malicious: Kill the pod, investigate how the attacker got in
> 3. Prevention: Set `readOnlyRootFilesystem: true` in SecurityContext
>    - Only `/tmp` or explicit emptyDir mounts are writable
>    - Prevents most drift attacks
> 4. Detection: Even with readOnly, monitor for attempts to write (they'll fail, but the attempt indicates compromise)"

---

### Q43. "How do you secure the EKS control plane?"

> "With managed EKS, AWS manages the control plane, but you still configure it:
>
> **API Server Access:**
> - `endpoint_public_access = false` — API not accessible from internet
> - `endpoint_private_access = true` — accessible only from within VPC
> - If public access is needed (rare): restrict to specific corporate CIDRs
>
> **Authentication:**
> - `aws-auth` ConfigMap: map IAM roles to Kubernetes groups
> - Never map any role to `system:masters` except a break-glass admin role
> - Use EKS Access Entries API (newer, recommended over aws-auth)
>
> **Encryption:**
> - Enable envelope encryption for Kubernetes Secrets using KMS
> - Without this, Secrets are stored base64-encoded (NOT encrypted) in etcd
>
> **Logging (enable ALL):**
> - API server logs: all API requests
> - Audit logs: who did what in the cluster
> - Authenticator logs: authentication attempts
> - Controller Manager: controller operations
> - Scheduler: scheduling decisions
>
> **Version management:**
> - Keep EKS version within one minor version of latest
> - Subscribe to EKS security advisories
> - Plan upgrades before version end-of-support"

---

### Q44. "What are the key differences between securing EKS (managed) vs self-managed Kubernetes?"

> "The fundamental difference is the shared responsibility boundary:
>
> | Component | EKS (Managed) | Self-Managed |
> |-----------|--------------|--------------|
> | API server patching | AWS | ⚠️ YOU |
> | etcd encryption | AWS handles at rest | ⚠️ YOU must configure |
> | Certificate rotation | AWS | ⚠️ YOU (critical) |
> | etcd backup | AWS | ⚠️ YOU (disaster recovery) |
> | Control plane HA | AWS | ⚠️ YOU (multi-master) |
> | Node OS patching | YOU (AMI updates) | YOU (full OS lifecycle) |
> | RBAC configuration | YOU | YOU |
> | NetworkPolicies | YOU | YOU + CNI plugin choice |
> | Admission control | YOU | YOU + manage webhook infra |
>
> **Self-managed extra CIS checks:**
> - API server: `--anonymous-auth=false`, `--authorization-mode=RBAC,Webhook`
> - etcd: TLS for peer communication, client certificate auth
> - Scheduler/CM: `--profiling=false`
>
> **Bottom line:** Self-managed K8s doubles your security responsibilities. Most organizations choose EKS to offload control plane security to AWS."

---

### Q45. "How do you handle vulnerability management for container images?"

> "I implement a full lifecycle vuln management approach:
>
> **Pre-production:**
> - Base images: Use minimal, hardened base images (distroless, Alpine)
> - CI/CD scan: Trivy/Snyk scans every image at build time
> - Policy: Block Critical CVEs with public exploits or in CISA KEV
> - Exception: CVEs with no available fix → time-bounded exception with tracking ticket
>
> **Production:**
> - Continuous registry scan: New CVE published → all stored images re-evaluated
> - Runtime scanning: Wiz/Falcon maps CVEs to running pods with context (exposure, data access)
> - Prioritization: Same CVE gets different priority based on context:
>   - Internet-facing pod with PII access + Critical CVE = P1
>   - Internal dev pod with same CVE = P3
>
> **Remediation:**
> - SLA: Critical+exploitable = 24h, High = 7 days, Medium = 30 days
> - Process: Update base image → rebuild → scan → deploy
> - Automation: Dependabot/Renovate creates PRs for base image updates
>
> **Metrics:**
> - Mean time from CVE publication to patched image in production
> - Percentage of running images with zero Critical CVEs
> - Coverage: percentage of pods using approved base images"

---

### Q46. "How do you implement network segmentation in Kubernetes?"

> "Network segmentation in Kubernetes has three layers:
>
> **Layer 1: Namespace isolation with NetworkPolicies**
> - Default-deny in every namespace
> - Explicit allow rules between namespaces that need to communicate
> - Egress rules: only allow traffic to specific external endpoints
>
> **Layer 2: Cloud-level VPC networking**
> - EKS pods get VPC IPs (via VPC CNI plugin)
> - Security Groups for pods (SGP): apply SG rules directly to pods
> - VPC endpoints for AWS services: traffic stays within VPC
> - Private subnets for worker nodes
>
> **Layer 3: Service mesh (advanced)**
> - Istio/Linkerd for mTLS between services
> - Authorization policies at L7 (HTTP method, path)
> - Traffic visualization and anomaly detection
>
> **Critical egress controls:**
> - Block IMDS (169.254.169.254) from all non-system pods
> - Allow DNS (port 53) to kube-dns only
> - Restrict external egress to approved domains
> - Log all egress traffic for forensics"

---

### Q47. "What are Kubernetes admission controllers and how do they improve security?"

> "Admission controllers intercept every API request to the Kubernetes API server BEFORE the resource is persisted. They can mutate (modify) or validate (accept/reject) the request.
>
> **Built-in admission controllers:**
> - **PodSecurity** (PSA) — enforces Pod Security Standards
> - **LimitRanger** — enforces resource limits
> - **ResourceQuota** — prevents resource exhaustion
>
> **External admission controllers (webhooks):**
> - **CrowdStrike KAC** — validates image scan results, blocks privileged pods, enforces registry allowlists
> - **OPA Gatekeeper** — custom policies in Rego (label requirements, naming conventions, custom security rules)
> - **Kyverno** — policy engine with YAML-based policies (simpler than Rego)
>
> **Rollout strategy:**
> - Week 1-2: Deploy in alert/audit mode → understand what WOULD be blocked
> - Week 3: Review and create legitimate exceptions
> - Week 4: Enable enforcement for Critical rules (no privileged, no root, scanned images required)
> - Ongoing: Add rules incrementally, never 'big bang'
>
> **Critical: Failure mode**
> - Configure `failurePolicy: Ignore` initially (if webhook is down, don't block all deployments)
> - Once stable, switch to `failurePolicy: Fail` (if webhook is down, block everything → fail-closed)"

---

### Q48. "How do you manage secrets in Kubernetes?"

> "Kubernetes Secrets are base64-encoded, NOT encrypted — anyone with `get secrets` RBAC can read them. Here's my approach:
>
> **Layer 1: Encrypt at rest**
> - Enable EKS envelope encryption with KMS
> - Without this, Secrets are stored in plaintext in etcd
>
> **Layer 2: External Secrets Operator (ESO)**
> - Secrets live in AWS Secrets Manager (encrypted, audited, rotated)
> - ESO syncs them to Kubernetes Secrets automatically
> - Source of truth is Secrets Manager, not Kubernetes manifests
>
> **Layer 3: RBAC for Secrets**
> - Most ServiceAccounts should NOT have `get/list` on secrets
> - `automountServiceAccountToken: false` for pods that don't need API access
> - Audit: who has secrets access? `kubectl auth can-i get secrets --as=system:serviceaccount:<ns>:<sa>`
>
> **Layer 4: Mount as volumes, not environment variables**
> - Env vars are visible in `/proc/<pid>/environ`, leaked in crash dumps, and logged by some frameworks
> - Volume mounts are file-based and can be more tightly controlled
>
> **Layer 5: Rotation**
> - External Secrets Operator auto-syncs on rotation
> - Pods can be configured to auto-restart when secrets change"

---

### Q49. "Describe the CIS EKS Benchmark and how you audit against it."

> "The CIS EKS Benchmark has sections covering both the managed control plane and your responsibilities:
>
> **Sections:**
> - Section 2: Logging (EKS control plane logging)
> - Section 3: Worker nodes (kubelet config, node hardening)
> - Section 4: Policies (RBAC, PSA, NetworkPolicies, secrets)
> - Section 5: Managed services (EKS-specific settings)
>
> **Key controls I audit:**
> - 3.2.1: Kubelet anonymous auth disabled
> - 4.1.x: RBAC least privilege (no wildcard, no cluster-admin to SAs)
> - 4.2.x: Pod Security Standards enforced
> - 5.1.1: Image registry restricted to private ECR
> - 5.2.x: Endpoint access, secrets encryption, logging enabled
> - 5.3.x: NetworkPolicy presence in all namespaces
>
> **Audit tools:**
> - Checkov: `checkov --framework kubernetes`
> - kube-bench: Automated CIS benchmark scanning against live cluster
> - CSPM (Wiz/Falcon): Maps cluster config to CIS controls
>
> **Process:** Weekly CIS compliance scan → dashboard showing pass/fail per control → tickets for failures → SLA tracking."

---

### Q50. "How would you investigate suspicious activity in an EKS cluster?"

> "I follow a structured investigation framework:
>
> **Data sources:**
> 1. **Falcon/Wiz detections** — runtime alerts with process trees, network connections
> 2. **EKS audit logs** — every Kubernetes API request (who, what, when)
> 3. **CloudTrail** — AWS API calls made via IRSA roles or node instance profiles
> 4. **VPC Flow Logs** — network traffic flows (source, destination, ports, accept/reject)
> 5. **Container runtime logs** — application logs from the suspect pod
>
> **Investigation sequence:**
> ```
> ALERT: Unusual process execution in production pod
>   │
>   ▼ CHECK RUNTIME DETECTION
>   What process? Who launched it? Parent process chain?
>   │
>   ▼ CHECK K8S AUDIT LOGS
>   Was kubectl exec used? By whom? From what IP?
>   │
>   ▼ CHECK RBAC
>   Does this user/SA have exec permissions? Should they?
>   │
>   ▼ CHECK NETWORK
>   Is the pod making unexpected outbound connections?
>   │
>   ▼ CHECK CLOUD
>   Did the pod's IRSA role make unusual AWS API calls?
>   │
>   ▼ DETERMINE VERDICT
>   TP → Contain + Investigate further
>   FP → Document + Tune detection rule
> ```"

---

# PART 12: INTERVIEW QUESTIONS — FINDINGS ASSESSMENT & COMMUNICATION

---

### Q51. "How do you assess the severity of a cloud security finding?"

> "I use the five-layer model: Technical Validity → Exposure Context → Attack Path → Exploitability → Business Impact.
>
> A finding's severity is NOT just the CVSS score or the scanner's label. It's the combination of all five layers.
>
> Example: An RDS instance with `publicly_accessible = true` could be Critical or Medium depending on:
> - Is it actually reachable from the internet? (check SG rules, VPC routing)
> - Does it contain sensitive data? (PII, financial, health)
> - Is it protected by additional controls? (IAM auth, TLS required)
> - What attack paths connect to it? (is it the target of a chain?)
> - What's the regulatory impact if breached? (PCI-DSS, HIPAA)
>
> A publicly accessible RDS with PII in a PCI scope that's reachable via an open SG = CRITICAL.
> The same RDS config in a dev account with test data and restricted SG = MEDIUM."

---

### Q52. "How do you differentiate between a true positive and a false positive in cloud security?"

> "I apply a structured validation process:
>
> **True Positive criteria:**
> 1. The configuration actually matches what the scanner reports
> 2. The configuration violates the security control intent
> 3. It creates real risk if exploited
>
> **False Positive scenarios:**
> 1. **Edge case:** Scanner reports 'S3 bucket is public' but it's a static website bucket intentionally public → TRUE finding, but ACCEPTED RISK, not FP
> 2. **Compensating control:** SG allows 0.0.0.0/0 but only from within a private VPC peering → exposure is limited, severity should be lowered
> 3. **Scanner limitation:** Scanner can't evaluate dynamic values → flags `cidr_blocks = var.cidrs` as potentially open
> 4. **Environment context:** Finding is in a sandbox account with no real data → reduce severity
>
> **My process:**
> - Verify the configuration directly (AWS CLI/Console)
> - Check for compensating controls
> - Evaluate business context
> - Document the decision with evidence
> - If FP: Create scoped exception with justification + expiry date
> - If TP: Create remediation ticket with SLA"

---

### Q53. "How do you communicate a critical finding to an engineering team that's under deadline pressure?"

> "I follow the **AIDE** framework: Acknowledge, Inform, Demonstrate, Enable.
>
> **A — Acknowledge** their deadline pressure: 'I know you're pushing to release by Friday.'
> **I — Inform** with business context, not technical jargon: 'This config could expose customer payment data.'
> **D — Demonstrate** the actual risk: Show CloudTrail evidence of scanning activity against their resource, or show the attack path in Wiz.
> **E — Enable** with a minimal fix: 'Here's a one-line Terraform change that fixes it without delaying your release.'
>
> **What I DON'T do:**
> - Block without explanation → creates adversarial relationship
> - Cite only compliance requirements → feels like bureaucracy
> - Demand a large refactor → unrealistic under time pressure
>
> **What I DO:**
> - Provide the exact code fix (PR or Terraform diff)
> - Offer to pair on the fix (10 minutes together > 2 hours of back-and-forth)
> - If the fix truly can't be done now: negotiate a time-bounded exception with a tracking ticket and SLA"

---

### Q54. "How do you explain cloud attack paths to non-technical leadership?"

> "I use the **home security analogy:**
>
> 'Imagine your house. Having a window slightly open is a medium risk. Having an unlocked front door is a high risk. But having an unlocked front door + no alarm system + an open safe with cash inside — that's not three separate medium risks, it's one critical path that an intruder can walk from the street to your money without being stopped.'
>
> **Then I translate to our environment:**
> 'We found a similar chain in our cloud: a public-facing server with a known vulnerability (the unlocked door), connected to an overly-permissive identity (no alarm), that can access a database with 2 million customer records (the open safe). Any one of these alone is manageable. Together, they create a direct path from the internet to our customer data.'
>
> **Then the business impact:**
> 'If exploited, this would require breach notification under GDPR within 72 hours. Potential cost: $2M-$5M in fines plus reputational damage.'
>
> **Then the action plan:**
> 'Our team has already identified the fix — it takes 2 hours. After fixing this, we'll have 3 critical attack paths remaining, down from 12 at the start of the quarter.'"

---

### Q55. "How do you handle a situation where a business unit accepts a risk you believe is too high?"

> "Risk acceptance is a business decision, but I ensure it's an INFORMED decision:
>
> 1. **Document clearly:** Write a risk statement that includes: specific technical risk, potential business impact (dollars, customers, regulatory), probability of exploitation, compensating controls in place (or lack thereof)
>
> 2. **Quantify:** Use FAIR-based analysis: 'Based on threat intel, the probability of exploitation is approximately 15% per year. The potential impact is $2M-$5M. Expected annual loss: $300K-$750K.'
>
> 3. **Escalation:** If the risk exceeds my approval authority, I escalate. 'This requires CISO approval because the residual risk exceeds our organizational risk tolerance as defined in our risk management policy.'
>
> 4. **Governance:** Even if accepted, the risk goes in the risk register with:
>    - Owner: VP who accepted it (personal accountability)
>    - Expiry: 90 days (must be re-accepted quarterly)
>    - Compensating controls: what mitigations ARE in place
>    - Review trigger: if exposure changes (e.g., becomes internet-facing), auto-escalate
>
> 5. **No silent acceptance:** Risk acceptance is transparent — it appears on the CISO dashboard and in compliance reports."

---

### Q56. "How do you prioritize remediation when you have hundreds of findings?"

> "Never prioritize by count or scanner severity alone. Use this prioritization matrix:
>
> **Priority 1 (Immediate):** Attack paths with internet exposure + data access + exploitable CVE
> - These are the findings that could lead to a breach TODAY
> - Track as attack paths, not individual findings
>
> **Priority 2 (This sprint):** Internet-facing misconfigurations without full attack path
> - Open SGs, public databases, missing WAF
> - High severity, high exposure, but missing some chain elements
>
> **Priority 3 (This month):** Internal misconfigurations in production
> - Overly permissive IAM, missing encryption, no logging
> - Important but require insider threat or initial access first
>
> **Priority 4 (This quarter):** Dev/staging issues, informational findings
> - Still fix them, but lower SLA
> - Focus on preventing them from reaching production (IaC scanning)
>
> **Communication to leadership:** 'We have 2,000 findings. But we have 8 critical attack paths — we're fixing those first. The 2,000 findings feed into a continuous improvement program.'"

---

### Q57. "How do you track remediation progress and report to leadership?"

> "I use three reporting tiers:
>
> **Operational (Weekly — for engineering teams):**
> - New findings this week by team/namespace
> - SLA compliance percentage
> - Top 5 overdue items with escalation status
> - Remediation velocity (findings closed per week)
>
> **Tactical (Monthly — for security leadership):**
> - Critical attack paths: opened vs closed (trend)
> - Overall posture score trend (Wiz/Falcon security score)
> - SLA compliance by severity tier
> - Top recurring finding categories → root cause analysis
> - Exception register: accepted risks with expiry dates
>
> **Strategic (Quarterly — for CISO/Board):**
> - Attack path reduction: '12 critical paths → 3 (75% improvement)'
> - Compliance posture: CIS/PCI/SOC2 compliance percentage
> - Return on security investment: 'IaC scanning prevented 450 misconfigurations from reaching production this quarter'
> - Industry benchmarking where available
> - Risk acceptance dashboard: outstanding accepted risks by business unit"

---

### Q58. "How do you use CVSS, EPSS, and CISA KEV together for vulnerability prioritization?"

> "Each metric answers a different question:
>
> | Metric | Question It Answers | Range | Limitation |
> |--------|-------------------|-------|------------|
> | **CVSS** | How BAD could it be if exploited? | 0-10 | Doesn't say if it WILL be exploited |
> | **EPSS** | How LIKELY is it to be exploited? | 0-1 (probability) | Based on historical patterns, not certainty |
> | **CISA KEV** | IS it being exploited right now? | Yes/No | Only includes confirmed exploited CVEs |
>
> **I combine them:**
> - CISA KEV = YES → **Immediate action** regardless of CVSS
> - CVSS ≥ 9.0 + EPSS ≥ 0.5 → P1 Critical (high severity + high likelihood)
> - CVSS ≥ 7.0 + EPSS ≥ 0.1 → P2 High
> - CVSS ≥ 7.0 + EPSS < 0.01 → P3 Medium (severe but unlikely to be exploited soon)
>
> **Plus context (my 5-layer model):**
> - A CVSS 9.8 + EPSS 0.9 CVE on an internal-only, no-data-access pod might still be P3
> - A CVSS 7.0 + EPSS 0.3 CVE on a public-facing pod accessing PII is P1
> - Context always overrides raw metrics"

---

### Q59. "How do you deal with alert fatigue in cloud security?"

> "Alert fatigue is the #1 reason security programs fail. My strategy:
>
> **1. Reduce noise at the source:**
> - Disable rules that don't apply to your environment
> - Customize severity to match your actual risk tolerance
> - Scope rules to relevant accounts/resources (production only for Critical)
>
> **2. Focus on attack paths, not individual findings:**
> - 3,000 individual findings → might be only 10 attack paths
> - Present attack paths to teams, not finding lists
>
> **3. Tier your alerts:**
> - P1 (attack paths + internet + data): PagerDuty → SOC
> - P2 (high severity): Jira auto-ticket → team
> - P3 (medium): Weekly digest → team lead
> - P4 (low): Dashboard only → self-service
>
> **4. Measure and tune:**
> - Track false positive rate per rule → if >50% FP, tune or disable
> - Track 'alert to action' ratio → how many alerts actually result in a fix?
> - Monthly tuning session: review noisiest rules, adjust or scope down
>
> **5. Automate the obvious:**
> - Auto-remediate low-risk, deterministic patterns (re-enable public access block on S3)
> - Auto-close duplicate findings
> - Auto-suppress known-accepted exceptions"

---

### Q60. "How do you build a cloud security findings management program from scratch?"

> "I follow a 90-day maturity model:
>
> **Days 1-30 (Foundation):**
> - Deploy CSPM (Wiz/Falcon) across all accounts
> - Establish initial findings baseline — expect thousands
> - Define severity framework + SLA matrix
> - Identify resource ownership (tags → teams → CMDB)
> - Set up basic alerting (Critical → SOC, High → Slack)
>
> **Days 31-60 (Operationalize):**
> - Build triage workflow: TP/FP determination → assignment → tracking
> - Create exception management process (documented, time-bounded, approved)
> - Implement top 10 remediation runbooks (Terraform fixes for each)
> - Launch weekly governance: review open Critical/High, SLA compliance
> - Start IaC scanning in CI/CD (observe mode first)
>
> **Days 61-90 (Mature):**
> - Enable IaC scanning enforcement (block Critical/High)
> - Implement auto-remediation for low-complexity patterns
> - Launch attack path program: track paths, not just findings
> - Build executive reporting: quarterly posture trends, risk reduction
> - Conduct first tabletop exercise: 'What if this attack path is exploited?'
>
> **Ongoing:**
> - Monthly: tune scanner rules, review exceptions, update policies
> - Quarterly: risk assessment, compliance audit prep, program metrics review
> - Annually: program maturity assessment, tool evaluation, strategy update"

---

### Q61. "How do you handle a scenario where a Critical finding is discovered in production during business hours?"

> "I follow the **SCAN** response method:
>
> **S — Scope:** What's the finding? What's the affected resource? Is it actively being exploited?
> - Check Wiz/Falcon for the full context: exposure, attack paths, connected resources
> - Check native tools (GuardDuty, CloudTrail) for exploitation indicators
>
> **C — Contain (if needed):** If there's evidence of active exploitation, contain first:
> - Security Group: restrict inbound to known IPs
> - IAM: attach deny policy to the overpermissive role
> - Network: add NACL deny rule
> - K8s: apply emergency NetworkPolicy
>
> **A — Assign:** Identify the resource owner, assign remediation with SLA:
> - Critical + internet-facing + active exploitation: 4 hours
> - Critical + internet-facing + no exploitation evidence: 24 hours
> - Provide the exact fix (Terraform diff, CLI command, console steps)
>
> **N — Notify:** Communicate to stakeholders:
> - SOC: awareness of potential incident
> - Engineering team: remediation assignment
> - Security leadership: if it's an attack path affecting sensitive data"

---

### Q62. "How do you create effective cloud security runbooks that engineering teams actually follow?"

> "The secret is writing runbooks FROM the developer's perspective, not the security team's:
>
> **Structure for each runbook:**
> 1. **What** (1 paragraph): Plain English description of the misconfiguration
> 2. **Why it matters at OUR company**: Business-specific risk, not generic compliance language
> 3. **How to verify**: CLI command to confirm the issue exists
> 4. **How to fix — Terraform**: Copy-paste HCL code block
> 5. **How to fix — CLI**: Exact `aws` CLI command for quick fixes
> 6. **How to fix — Console**: Step-by-step with screenshot for console users
> 7. **How to verify the fix**: Command to confirm remediation worked
> 8. **How to prevent recurrence**: What CI/CD policy catches this
>
> **Distribution:** Link runbooks directly from Jira ticket templates. When Wiz auto-creates a ticket, the 'Remediation' field links to the specific runbook for that finding type.
>
> **Feedback loop:** Track which runbooks are opened and whether they lead to faster remediation. Low-usage runbooks need improvement or better discoverability."

---

### Q63. "How do you handle compliance mapping for cloud security findings?"

> "I map findings to multiple frameworks simultaneously because most controls overlap:
>
> **Example: S3 bucket without encryption**
> - CIS AWS 2.1.1: S3 bucket encryption
> - NIST CSF PR.DS-1: Data at rest protection
> - SOC 2 CC6.1: Logical access + encryption controls
> - PCI-DSS 3.4: Render PAN unreadable (if cardholder data)
> - HIPAA §164.312(a)(2)(iv): Encryption of PHI
>
> **ONE fix satisfies FIVE frameworks.** This is the power of control mapping.
>
> **Implementation in CSPM:**
> - Wiz/Falcon automatically maps findings to CIS, NIST, PCI, SOC2, HIPAA
> - Compliance dashboard shows percentage pass/fail per framework
> - Auditors get framework-specific reports: 'show me all PCI-DSS failures'
>
> **For audit preparation:**
> - Pre-populate evidence with CSPM screenshots and scan results
> - Track control effectiveness over time (trend lines)
> - Document exceptions with business justification and compensating controls"

---

### Q64. "How do you measure and report on cloud security posture over time?"

> "I track four categories of metrics:
>
> **1. Risk Metrics (What matters most):**
> - Critical attack paths: count, trend, time-to-close
> - Internet-facing resources with Critical vulnerabilities
> - Unencrypted data stores in production
> - Overprivileged identity access (IAM, RBAC)
>
> **2. Operational Metrics (How well we manage):**
> - SLA compliance by severity (%  remediated within SLA)
> - Mean time to remediate (MTTR) by severity
> - Exception count and age (how many accepted risks, are they expiring?)
> - Finding reopen rate (are fixes sticking?)
>
> **3. Prevention Metrics (Are we shifting left?):**
> - IaC scan block rate in CI/CD (misconfigs caught before deployment)
> - Admission controller block rate (non-compliant pods caught at deploy)
> - Training completion rate by team
> - Secure module adoption rate
>
> **4. Coverage Metrics (Are we seeing everything?):**
> - % of cloud accounts connected to CSPM
> - % of EKS nodes with runtime sensor
> - % of CI/CD pipelines with IaC scanning
> - % of container images scanned before deployment
>
> **The story I tell leadership:** 'Our risk is decreasing (attack paths down 75%), our operations are maturing (SLA compliance up to 95%), and we're preventing more issues before they reach production (IaC blocked 450 misconfigs this quarter).'"

---

### Q65. "Describe a time you had to explain a complex technical security finding to a non-technical stakeholder."

> "In a recent scenario, Falcon CSPM discovered a chain where an internet-facing EKS pod had a Critical CVE, running with an overpermissive IRSA role that could access an S3 bucket containing customer data.
>
> **For the VP of Engineering (semi-technical):**
> 'We have a production service that has three overlapping security gaps. Any one alone is manageable, but together they create a direct path from the internet to customer data. The fix is a combination of patching the vulnerability, restricting the pod's AWS permissions, and adding network controls. Total effort: 4 developer hours. If we don't fix it, we have an open window to a data breach.'
>
> **For the CFO (non-technical):**
> 'We've identified a security vulnerability that could allow unauthorized access to customer records. If exploited, this would trigger mandatory breach notification, with estimated costs of $2-5M in regulatory fines and incident response. Our team can close this gap today at no additional cost — it's a configuration change. This is part of our quarterly attack path reduction program — we've closed 9 of 12 similar paths this quarter.'
>
> **The key principles:**
> - Lead with IMPACT, not technical details
> - Quantify in dollars and customer impact
> - Show you already have a fix ready
> - Frame within a larger improvement narrative
> - Never use fear as a manipulation tactic — present facts objectively"

---

# PART 13: SCENARIO-BASED INTERVIEW SIMULATIONS

---

## Scenario 1: Terraform Misconfiguration in Production Pipeline

**Situation:** Your IaC scanner (Checkov) catches a Critical finding in a PR: a Terraform module creating an RDS instance with `publicly_accessible = true` and `storage_encrypted = false`. The developer argues the change is for a staging database and pushes back on the block.

**Your Response:**

> **Immediate:** "I wouldn't override the policy just because it's staging. Misconfigurations in staging often move to production via copy-paste or module promotion.
>
> **My approach:**
> 1. Review the PR and confirm the finding is accurate
> 2. Explain to the developer: 'Even in staging, we enforce encryption because our Terraform modules are shared. If we allow an unencrypted pattern here, it becomes a template someone copies to production.'
> 3. Provide the exact fix: `publicly_accessible = false`, `storage_encrypted = true`, `kms_key_id = staging-key-arn`
> 4. Compromise on severity: I won't block staging deployments for a public endpoint IF it's in a private VPC subnet with restricted SGs. But encryption is non-negotiable — it's one line of code.
> 5. Long-term fix: Update the shared RDS module to be secure by default — developers just specify the instance size and name; encryption and private networking are built in."

---

## Scenario 2: Container Escape Alert in EKS

**Situation:** Falcon fires `ContainerEscape.Nsenter` on a production EKS cluster in the `payments` namespace at 2 AM. You're on-call.

**Your Response:**

> "This is a CRITICAL incident. Nsenter with namespace flags from inside a container means the attacker has host access.
>
> **Phase 1 — Contain (2:00-2:15 AM):**
> ```bash
> kubectl delete pod <compromised-pod> -n payments --grace-period=0
> kubectl cordon <affected-node>
> kubectl apply -f emergency-deny-all.yaml -n payments
> ```
> - Check: did the attacker read kubelet kubeconfig? If yes → assume full cluster compromise → page the security team for cluster-wide response
>
> **Phase 2 — Investigate (2:15-4:00 AM):**
> - Root cause: Was the pod privileged? (Check deployment YAML)
> - Entry point: How did attacker get shell? (K8s audit logs for exec, application vulnerability?)
> - Lateral movement: CloudTrail for IRSA/instance profile API calls, K8s audit for RBAC changes
> - Persistence: New ClusterRoleBindings? DaemonSets? aws-auth modifications?
>
> **Phase 3 — Eradicate & Recover (4:00-6:00 AM):**
> - Remove persistence mechanisms
> - Rotate all secrets in the namespace
> - Terminate node, let auto-scaling replace it
> - Deploy clean pods
>
> **Phase 4 — Post-Incident (Next business day):**
> - Root cause: The pod was running with `privileged: true` — this should have been caught by KAC/PSA
> - Action items: Enable PSA `enforce: restricted` on payments namespace, deploy KAC rule to block privileged pods permanently, audit all namespaces for similar misconfigurations"

---

## Scenario 3: Critical Attack Path Discovery

**Situation:** Wiz Security Graph shows a critical attack path: Internet → Public ALB → EC2 (CVE-2024-XXXX, CVSS 9.8, EPSS 0.85, in CISA KEV) → IAM Role with s3:* → S3 bucket with 5M customer records.

**Your Response:**

> "This is a P1 — all five layers of my risk model are red:
> 1. Technically valid: confirmed CVE with public exploit
> 2. Internet-exposed: public ALB, reachable from anywhere
> 3. Full attack path: five links from internet to customer data
> 4. Highly exploitable: CISA KEV, EPSS 0.85, known exploit available
> 5. Maximum business impact: 5M customer records, breach notification required
>
> **Immediate actions (within 1 hour):**
> 1. Patch the CVE on the EC2 instance (emergency change)
> 2. Scope the IAM role: replace `s3:*` with specific bucket ARN + read-only actions
> 3. Verify the S3 bucket has encryption and access logging enabled
>
> **Same day:**
> 4. Review Security Graph: are there similar paths to other data stores?
> 5. Add WAF rules on the ALB for the specific CVE's attack vector
>
> **Communication:**
> - SOC: Alert on active exploitation attempts against this CVE
> - Engineering team: Emergency patch + IAM scoping
> - CISO: 'Critical attack path to 5M customer records. We're closing it within 4 hours. Risk: potential breach notification if exploited before patching.'
>
> **This week:**
> - Create IaC scanning rule to prevent this IAM pattern
> - Auto-tag EC2 instances that haven't been patched for KEV CVEs
> - Review all IRSA/IAM roles for s3:* patterns"

---

## Scenario 4: CI/CD Pipeline Compromise Suspicion

**Situation:** A developer reports that their GitHub Actions workflow is running successfully, but the deployed container image has a binary that wasn't in their Dockerfile. Falcon detects `ContainerDrift.NewExecutable` in the running pod.

**Your Response:**

> "This suggests either a build-time or supply-chain compromise. I treat this as a P1 incident.
>
> **Investigation:**
> 1. Compare the image manifest (layers, digests) between what was built and what was deployed
> 2. Check if the binary exists in any base image layer (could be from a compromised base image)
> 3. Review the GitHub Actions workflow: any new/modified steps? Third-party actions updated?
> 4. Check npm/pip install logs: any unexpected packages downloaded during build?
> 5. Verify image signature: does the deployed image match what was signed in CI/CD?
>
> **If confirmed compromise:**
> 1. Stop all pipeline runs immediately
> 2. Quarantine all images built in the last 7 days
> 3. Roll back production to the last verified-clean build
> 4. Rotate ALL CI/CD secrets (OIDC provider is safe, but API tokens, registry credentials)
> 5. Forensic analysis: was the GitHub Actions runner compromised? Dependency confusion? Base image supply chain?
>
> **Prevention:**
> - SLSA provenance attestation on all builds
> - Image signing with Cosign
> - Admission controller that verifies provenance + signature
> - Lock file for all dependencies (no floating versions)
> - Internal base image mirror (don't pull from Docker Hub directly)"

---

## Scenario 5: Cross-Functional Risk Communication

**Situation:** Your quarterly posture report shows 2,500 open findings across the organization. The CISO asks: "Are we secure?" The VP of Engineering says: "These findings are slowing us down." You need to address both.

**Your Response:**

> **To the CISO:**
> 'The raw number of 2,500 findings is misleading. Here's what actually matters:
> - We have **4 critical attack paths** to sensitive data, down from 15 at the start of the quarter
> - All 4 are actively being remediated with SLA compliance at 94%
> - **Zero findings** are in CISA KEV (Known Exploited Vulnerabilities)
> - Our prevention rate has improved: IaC scanning blocked 450 misconfigurations from reaching production this quarter
> - The remaining 2,500 findings are Medium/Low severity with no internet exposure
>
> Are we secure? We're significantly more secure than last quarter, the highest-risk paths are being closed, and our prevention program is reducing the inflow of new findings.'
>
> **To the VP of Engineering:**
> 'I understand the friction. Here's what we're doing to reduce developer impact:
> 1. **Secure-by-default modules** — 60% of the IaC scan blocks could be eliminated if teams use our pre-built secure modules
> 2. **Gradual enforcement** — We always deploy in observe mode first, so teams see what would be blocked before we enforce
> 3. **Runbooks with copy-paste fixes** — Every finding links to an exact code fix, not a vague recommendation
> 4. **Weekly office hours** — I hold sessions where teams can get live help resolving scan findings
> 5. **By the numbers:** The average remediation time per finding is 30 minutes. The average time to handle a production security incident is 40 hours. Prevention is 80x more efficient.'"

---

# PART 14: QUICK REFERENCE CHEATSHEET

---

```

═══════════════════════════════════════════════════════════════════════
INTERVIEW QUICK REFERENCE — IaC, CONTAINERS, FINDINGS
═══════════════════════════════════════════════════════════════════════

IaC/TERRAFORM SECURITY — KEY CONCEPTS:
├── State file: encrypt (S3+KMS), lock (DynamoDB), restrict access
├── Secrets: Never hardcode → use Secrets Manager data sources
├── Modules: Pin versions, use private registry, review before adopt
├── Drift: detect (terraform plan -refresh-only), fix in CODE not console
├── Scanning: Checkov/tfsec in CI/CD, block on Critical/High
├── Policy-as-code: OPA/Rego, Sentinel, custom Checkov policies
└── Secure-by-default modules: encryption on, public off, logging on

CI/CD PIPELINE SECURITY — KEY CONCEPTS:
├── OIDC federation: eliminate long-lived credentials
├── Ephemeral build agents: destroy after each job
├── Image signing: Cosign/AWS Signer + admission verification
├── 4 gates: pre-commit → build → test → deploy
├── SLSA: provenance attestation for supply chain security
├── Dependency confusion: scoped packages, internal registry
└── GitOps: git = source of truth, ArgoCD deploys

CONTAINER SECURITY (EKS) — KEY CONCEPTS:
├── 6 pillars: Image scan, Config posture, Runtime, Admission, Identity, Network
├── IRSA: per-pod IAM role via ServiceAccount annotation
├── PSA: enforce restricted on production namespaces
├── IMDSv2: http_tokens=required, hop_limit=1
├── NetworkPolicy: default-deny per namespace + explicit allows
├── SecurityContext: non-root, drop ALL caps, readOnlyRootFilesystem
├── KAC/OPA: block privileged, require scanned images, registry allowlist
└── aws-auth: no system:masters for non-admin roles

FINDINGS ASSESSMENT — KEY CONCEPTS:
├── 5-Layer Model: Validity → Exposure → Attack Path → Exploitability → Business
├── CVSS + EPSS + CISA KEV = comprehensive vulnerability prioritization
├── Attack paths, not individual findings
├── SLA: P1=4h, P2=24h, P3=7d, P4=30d
├── Communication: Engineers=code fix, Managers=effort+impact, CISO=dollars+trend
├── Exception: scoped, justified, time-bounded, approved, auditable
└── Metrics: attack paths (risk), SLA compliance (operations), block rate (prevention)

TOOLS QUICK REFERENCE:
├── IaC Scan: Checkov, tfsec, Snyk IaC, KICS, Terrascan
├── Image Scan: Trivy, Snyk Container, Grype, ECR Enhanced
├── Runtime: CrowdStrike Falcon (eBPF), Wiz Defend, Prisma
├── Admission: CrowdStrike KAC, OPA Gatekeeper, Kyverno
├── Policy: OPA (Rego), Sentinel (HashiCorp), Checkov (Python)
├── CSPM: Wiz, CrowdStrike Falcon, Prisma Cloud, AWS Security Hub
├── CI/CD: GitHub Actions, GitLab CI, Jenkins, ArgoCD (GitOps)
└── Secrets: AWS Secrets Manager, HashiCorp Vault, ESO (K8s)

FRAMEWORKS FOR INTERVIEWS:
├── CIS: Prescriptive technical controls (18 controls, benchmarks for AWS/EKS)
├── NIST CSF: Strategic framework (6 functions: GV-ID-PR-DE-RS-RC)
├── SOC 2: Customer trust (5 Trust Service Criteria, Type I/II audit)
├── PCI-DSS: Payment data (12 requirements, mandatory for card processing)
├── HIPAA: Health data (3 safeguards, mandatory for PHI)
├── MITRE ATT&CK: Adversary TTPs (tactics, techniques, containers matrix)
└── SLSA: Supply chain security (4 levels, provenance attestation)
═══════════════════════════════════════════════════════════════════════

```

---

> **Guide Stats:**
> - **Total Questions:** 65 interview Q&As covering all three domains
> - **Scenario Simulations:** 5 end-to-end scenarios combining IaC, containers, and findings
> - **Key Concepts:** Terraform security, CI/CD hardening, EKS 6-pillar model, 5-layer risk assessment
> - **Ready for:** Cloud Security Engineer, DevSecOps Engineer, CNAPP Security Specialist interviews
> - **Last Updated:** April 2026
