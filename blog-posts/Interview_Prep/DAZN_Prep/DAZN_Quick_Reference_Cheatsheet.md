# ⚡ DAZN Cloud Security Engineer — Quick Reference Cheatsheet

> **Print this. Review 30 minutes before the interview.**
> **Every answer below maps to a specific DAZN JD requirement.**

---

## 🔑 WIZ — THE 10 THINGS YOU MUST KNOW

```
1. AGENTLESS     → No agent deployment. API-based + Disk snapshot + K8s API
2. SECURITY GRAPH → Every resource is a node, every relationship is an edge
3. TOXIC COMBO   → Multiple low-severity findings chaining into a critical attack path
4. ISSUES vs IOMs → Issues = actionable findings | IOMs = informational misconfigs
5. ATTACK PATHS  → Visual representation of how an attacker could reach sensitive data
6. CIEM          → IAM risk: effective permissions, unused access, cross-account trusts
7. DSPM          → Data classification: PII, PHI, financial data discovery across storage
8. IaC SCANNING  → Scan Terraform/CFN in CI/CD pipeline → block before deployment
9. CDR (DEFEND)  → Cloud Detection & Response: runtime monitoring, container drift
10. CONNECTORS   → Read-only cross-account roles for each cloud provider
```

---

## 🔑 AWS — KEY SERVICES TO REFERENCE

| Service | What It Does | When to Mention |
|---------|-------------|-----------------|
| **IAM** | Identity management, roles, policies, permission boundaries | Every IAM question |
| **GuardDuty** | Threat detection — credential theft, C2, crypto mining | Threat detection questions |
| **Security Hub** | Aggregates findings from Inspector, GuardDuty, Config, Macie | Centralized security posture |
| **CloudTrail** | API audit logs — who did what, when, from where | Investigation & forensics |
| **AWS Config** | Configuration recording + compliance rules | Compliance & drift detection |
| **Inspector** | CVE scanning on EC2, ECR, Lambda | Vulnerability management |
| **WAF** | Web application firewall — managed rules, rate limiting | WAF operations |
| **Firewall Manager** | Centralized WAF/SG/Network FW policy management | Multi-account governance |
| **KMS** | Encryption key management — CMK, automatic rotation | Data protection |
| **Secrets Manager** | Secrets storage — not env vars, not SSM for secrets | Secure configuration |
| **EKS** | Managed Kubernetes — IRSA, PSS, aws-auth, IMDSv2 | Container security |
| **Organizations + SCPs** | Account governance — prevent dangerous actions centrally | Guardrails & governance |

---

## 🔑 TERRAFORM / IaC — CRITICAL CODE SNIPPETS

### Bad → Good: Security Group
```hcl
# ❌ BAD — Open SSH to the world
cidr_blocks = ["0.0.0.0/0"]

# ✅ GOOD — Corporate CIDR only
cidr_blocks = ["10.0.0.0/8"]
```

### Bad → Good: S3 Bucket
```hcl
# ❌ BAD — No encryption, no blocking
resource "aws_s3_bucket" "data" {
  bucket = "customer-data"
}

# ✅ GOOD — Encryption + Block Public Access
resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" } }
}
resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### Pipeline Integration
```yaml
# GitHub Actions — Wiz IaC Scanning
- name: Wiz IaC Scan
  uses: wiz-sec/iac-scan-action@v1
  with:
    policy: 'Default IaC Policy'
    fail-on-severity: 'HIGH'
    path: './terraform'
```

### Checkov Skip (Exception)
```hcl
resource "aws_security_group" "bastion" {
  #checkov:skip=CKV_AWS_24:Approved bastion SSH - JIRA-1234
}
```

---

## 🔑 EKS/KUBERNETES — 6 SECURITY PILLARS

```
1. IMAGE           → Scan images in CI/CD + admission; block Critical CVEs
2. CONFIGURATION   → CIS EKS Benchmark; no privileged, no root, no hostPath
3. RUNTIME         → eBPF/Falcon sensors; detect container escape, drift, reverse shells
4. ADMISSION       → KAC/OPA/Wiz Admission → reject non-compliant workloads
5. IDENTITY (IRSA) → Pod-level IAM via ServiceAccount → no node instance profile
6. NETWORK         → NetworkPolicy default-deny per namespace; restrict egress
```

### EKS-Specific Checks
```
✅ IMDSv2 with hop-limit=1 (prevents SSRF credential theft)
✅ IRSA for all pods (not node instance profile)
✅ aws-auth ConfigMap — no system:masters for non-admin
✅ Private endpoint or restricted CIDR
✅ Control plane audit logging enabled
✅ PSA labels: restricted on production namespaces
```

---

## 🔑 SLA FRAMEWORK — MEMORIZE THIS

| Severity | Public/Internet-Facing | Internal/Private |
|----------|----------------------|------------------|
| **Critical** | 4 hours | 24 hours |
| **High** | 48 hours | 7 days |
| **Medium** | 7 days | 30 days |
| **Low** | 30 days | 90 days / next sprint |

### Escalation Ladder
```
50% SLA elapsed  → Email to owner
75% SLA elapsed  → Slack team lead
100% SLA elapsed → Jira escalation to manager
150% SLA elapsed → CISO briefing
```

---

## 🔑 MULTI-CLOUD — AWS vs AZURE vs GCP vs OCI

| Capability | AWS | Azure | GCP | OCI |
|-----------|-----|-------|-----|-----|
| **Guardrails** | SCPs | Azure Policy | Org Policies | Compartment Pol. |
| **IAM Audit** | CloudTrail + AA | Entra Logs | Audit Logs + Recommender | Audit Logs |
| **Network** | SGs + NACLs | NSGs + Az FW | FW Rules + VPC Flow | NSGs + Sec Lists |
| **CSPM** | Security Hub | Defender for Cloud | SCC | Cloud Guard |
| **Container** | EKS + ECR | AKS + ACR | GKE + Artifact Analysis | OKE |

**Key insight for interview:** "Wiz normalizes all of this. One policy, one dashboard, across all clouds."

---

## 🔑 WAF — RULE STRATEGY FOR A STREAMING PLATFORM

```
Layer 1: AWS Managed Rules (CRS, SQLi, Known Bad Inputs, Bot Control)
Layer 2: IP Reputation List (known bad actors)
Layer 3: Rate Limiting (per API key, per IP — prevent brute force, scraping)
Layer 4: Geo Blocking (if DAZN operates only in specific markets)
Layer 5: Custom Rules (content-specific patterns for DAZN's APIs)

Deployment: ALWAYS COUNT mode first → analyze 1-2 weeks → then BLOCK
Tuning: WAF logs → S3 → Athena → identify FPs → scoped exclusions
```

---

## 🔑 AUTOMATION — TOP 7 WINS (mention these)

| # | What | How | Impact |
|---|------|-----|--------|
| 1 | Auto-block public S3 | EventBridge + Lambda | Prevent data exposure in <1 min |
| 2 | Auto-revoke 0.0.0.0/0 SGs | EventBridge + Lambda | Prevent network exposure |
| 3 | Sensor coverage check | Scheduled Lambda | Ensure 100% Wiz coverage |
| 4 | SLA escalation engine | EventBridge + Lambda | Auto-escalate overdue items |
| 5 | IaC pipeline scanning | Wiz/Checkov in CI/CD | Prevent misconfigs pre-deploy |
| 6 | Weekly compliance report | Lambda + Wiz API | Auto-generated, emailed |
| 7 | IAM key rotation enforcement | Config rule + SSM | Auto-disable stale keys >90d |

---

## 🔑 BEHAVIORAL — STAR ANSWERS READY

### "Drive remediation with resistant teams"
```
S: EC2 instances had port 22 open to 0.0.0.0/0, flagged by CIS AWS benchmarks
T: Close open SSH access without breaking DevOps workflows
A: Correlated open SG with CrowdStrike Falcon brute-force SSH alerts on those
   exact instances, proposed SSM Session Manager as alternative, provided
   exact SG rule removal + SSM IAM policy, validated fix
R: Team adopted SSM across all environments, SSH SG rules eliminated org-wide
```

### "How you cut through noise / false positives"
```
S: Daily XDR/EDR alerts across endpoints, network, and AWS cloud — mix of
   real threats and benign activity
T: Efficiently separate true positives from false positives
A: Developed multi-source correlation approach: EDR alert → check CloudTrail
   for matching API activity → validate IOC across threat intel feeds →
   confirm scope via log analysis. Tuned noisy detection rules, documented
   FP patterns for team reference
R: Reduced investigation time per alert, improved TP identification accuracy,
   fewer escalations of non-issues to engineering
```

### "How you built a process from scratch"
```
S: No standardized cloud security triage workflow for AWS findings
T: Build a repeatable process for identifying and remediating cloud misconfigs
A: Established daily CSPM review cadence, defined severity-based SLA framework,
   integrated CrowdStrike findings with CIS benchmarks, created remediation
   guides for top recurring misconfigurations (S3, IAM, SGs), automated
   Falcon sensor coverage validation on EKS clusters
R: Consistent posture improvement, faster remediation cycles, better
   collaboration with DevOps on security fixes
```

### "Why SOC → Cloud Security Engineer?" (KEY QUESTION)
```
S: 3+ years in SOC with growing cloud security responsibilities
T: Transition from investigating cloud incidents to preventing them
A: Already doing CSPM (CIS benchmarks), CWPP (Falcon on EKS), and IOC hunting
   in cloud environments — Cloud Security Engineer is the natural evolution
R: My SOC background is a STRENGTH — I understand the attacker's perspective,
   I know what actionable looks like, and I can bridge SecOps and CloudSec
```

---

## ❓ QUESTIONS TO ASK DAZN

1. "How mature is the current cloud security posture — am I deploying Wiz from scratch or inheriting an existing setup?"
2. "What's the engineering team structure — how many teams will I collaborate with?"
3. "Which compliance frameworks are most relevant — GDPR, PCI, SOC2?"
4. "How does the WAF engineering team currently operate — what's the collaboration model?"
5. "Is the multi-cloud footprint (Azure/GCP/OCI) growing or consolidating on AWS?"
6. "What's the current CI/CD pipeline stack — GitHub Actions, Jenkins, GitLab CI?"
7. "How does the security team interact with the SRE/platform team?"

---

## 🏁 LAST-MINUTE REMINDERS

```
✅ Say "attack paths" not "alerts" — shows you think contextually
✅ Say "trace to Terraform source" — shows you're an engineer, not just a triager
✅ Say "COUNT mode first, then BLOCK" — shows operational maturity
✅ Say "toxic combinations" — proves Wiz knowledge depth
✅ Reference DAZN as a "streaming platform" — shows you've researched the company
✅ Mention IRSA, IMDSv2, PSS — shows EKS hands-on depth
✅ Frame SOC background as STRENGTH — "I know the attacker's perspective"
✅ Name your tools: "SecureWorks Taegis XDR, CrowdStrike Falcon, CIS AWS benchmarks"
✅ Bridge experiences: "I do CSPM today with CrowdStrike; Wiz is the same discipline"
✅ Say "I don't just file tickets — I trace to the source and provide the fix"
```

---

> **You've got this. 🎯**
