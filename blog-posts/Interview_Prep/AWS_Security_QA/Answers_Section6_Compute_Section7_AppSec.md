# Section 6 — Compute & Host Security (Q41–Q45) — Answers

---

## Q41. EC2 Instance Hardening

**Answer:**

**CIS Benchmark hardening for Amazon Linux 2:**
- **Disable unused services:** `systemctl disable rpcbind`, `telnet`, `vsftpd`, etc.
- **SSH hardening:** Disable root login (`PermitRootLogin no`), disable password auth (`PasswordAuthentication no`), change default port (optional), restrict to SSM-only access.
- **Filesystem:** Set `noexec`, `nosuid`, `nodev` on `/tmp`, `/var/tmp`. Disable USB storage.
- **Auditd:** Enable auditd for syscall monitoring — log all execve, file access, privilege escalation attempts.
- **Kernel hardening:** Enable ASLR, disable core dumps, restrict `dmesg`, set `net.ipv4.conf.all.rp_filter = 1`.
- **Remove unnecessary packages:** `yum remove telnet ftp nfs-utils`.

**Patching with SSM Patch Manager:**
1. Create a **patch baseline** — define approved patches, severity classification (Critical, Important), and auto-approval delay (e.g., 7 days after release).
2. Create a **maintenance window** — schedule patching (e.g., every Sunday 2 AM UTC).
3. Associate a **patch group** tag on instances (e.g., `PatchGroup: production-linux`).
4. SSM runs `AWS-RunPatchBaseline` command during the maintenance window.
5. **Compliance reporting:** SSM Patch Manager reports patch compliance in real-time — feed to Security Hub.

**Enforcing approved AMIs:**
- **AWS Config rule** `approved-amis-by-id` or `approved-amis-by-tag` — flags instances launched from unapproved AMIs.
- **SCP or IAM condition:**
```json
{
  "Effect": "Deny",
  "Action": "ec2:RunInstances",
  "Resource": "arn:aws:ec2:*::image/*",
  "Condition": {
    "StringNotEquals": {
      "ec2:ImageId": ["ami-approved1", "ami-approved2"]
    }
  }
}
```
- Better approach: Use **EC2 Image Builder** to create hardened, approved AMIs and tag them. SCP allows only instances from images with tag `Approved: true`.

**IMDSv2 enforcement:**
- **IMDSv1** uses a simple HTTP GET — vulnerable to **SSRF attacks**. An attacker exploiting a web app SSRF can steal instance credentials by requesting `http://169.254.169.254/latest/meta-data/iam/security-credentials/`.
- **IMDSv2** requires a **PUT request with a hop limit** to get a session token first — SSRF attacks can't perform PUT requests, and the X-Forwarded-For hop count prevents proxied requests.
- **Enforce IMDSv2:**
```bash
aws ec2 modify-instance-metadata-options --instance-id i-xxx \
  --http-tokens required --http-endpoint enabled --http-put-response-hop-limit 1
```
- **At launch (SCP/IAM condition):**
```json
{
  "Condition": {
    "StringNotEquals": { "ec2:MetadataHttpTokens": "required" }
  }
}
```

---

## Q42. Container Security on ECS Fargate

**Answer:**

**Image vulnerability scanning:**
- **ECR Basic Scanning:** OS package vulnerability scanning at push time (uses Clair). Limited — only OS-level CVEs.
- **ECR Enhanced Scanning:** Uses Amazon Inspector under the hood. Scans OS packages AND application dependencies (Java, Python, Node.js). Continuous scanning — rescans when new CVEs are published.
- **Third-party (Trivy, Snyk):** Integrate into CI/CD pipeline. Run `trivy image my-image:latest` before pushing to ECR. Fail the build if Critical/High CVEs are found.

**Image signing & verification:**
- Use **ECR image signing** with AWS Signer or **Notation** (CNCF standard).
- In CI/CD: sign image after build → push signed image to ECR.
- In ECS task definition: use image digest (`@sha256:...`) instead of tags to ensure immutability.
- **Kyverno** or **OPA Gatekeeper** (on EKS) can enforce that only signed images run. On ECS, enforce via a custom Lambda function that validates image signatures before task deployment.

**Fargate vs EC2 security posture:**
| Aspect | Fargate | EC2-backed ECS |
|---|---|---|
| **OS patching** | AWS-managed (no host access) | Your responsibility |
| **Host access** | No SSH, no docker socket | Full host access — attack surface |
| **Privilege escalation** | Containers can't access host | Container escape → host compromise |
| **Kernel** | Shared but isolated (Firecracker microVM) | Shared kernel — container escape risk |
| **Compliance** | Easier to demonstrate isolation | Requires CIS benchmarking of hosts |

**Secrets management in containers:**
- **Never** bake secrets into images or environment variables.
- Use **ECS secrets integration:** Reference Secrets Manager or SSM Parameter Store in the task definition:
```json
{
  "secrets": [
    {
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db-password"
    }
  ]
}
```
- ECS injects the secret at container startup. The secret is never stored in the task definition or image.
- **Automatic rotation:** Secrets Manager can rotate RDS credentials automatically — configure a rotation Lambda.

---

## Q43. Lambda Security Best Practices

**Answer:**

**Securing the execution environment:**
- **Reserved concurrency:** Set to prevent a compromised function from consuming all account concurrency (default 1000).
- **Memory/timeout:** Set to minimum viable values — `128 MB, 30 seconds` for simple API handlers. Limits resource abuse if compromised.
- **DLQ (Dead Letter Queue):** Configure SQS DLQ for failed invocations — prevents silent failures and aids forensics.

**Lambda-specific attack vectors:**
- **Event injection:** If the Lambda processes user input from API Gateway/S3/SQS, malicious payloads can exploit the function. Example: SQL injection through API Gateway event → Lambda → DynamoDB (NoSQL injection).
  - **Mitigation:** Validate and sanitize ALL event fields. Use parameterized queries.
- **Dependency confusion:** Malicious packages published to public npm/PyPI with names matching internal packages.
  - **Mitigation:** Pin dependency versions, use private registries, audit `requirements.txt`/`package.json`.
- **Execution role abuse:** If the role is over-permissioned, attackers get broad AWS access.
  - **Mitigation:** Least-privilege roles (see Q2).

**Scanning Lambda code/dependencies:**
- **Amazon Inspector:** Scans Lambda function code and layers for known CVEs.
- **SAST in CI/CD:** Tools like Semgrep, Bandit (Python), or ESLint security plugins.
- **SCA:** Snyk, Dependabot, or `npm audit` for dependency vulnerabilities.
- **Lambda Layers:** Audit shared layers — a compromised layer affects all functions using it.

**VPC placement enforcement:**
- For Lambda functions accessing PHI in RDS/ElastiCache, enforce VPC placement via SCP:
```json
{
  "Effect": "Deny",
  "Action": ["lambda:CreateFunction", "lambda:UpdateFunctionConfiguration"],
  "Resource": "*",
  "Condition": {
    "Null": { "lambda:VpcIds": "true" }
  }
}
```
- When in a VPC, Lambda uses **ENIs in your subnets** — subject to SGs and NACLs. Add VPC endpoints for AWS service access (S3, DynamoDB, STS, Secrets Manager).

---

## Q44. SSM Session Manager vs SSH Bastion

**Answer:**

**How SSM Session Manager replaces bastions:**
- No need for SSH keys, bastion hosts, or port 22 open.
- Uses the **SSM Agent** (pre-installed on Amazon Linux 2, Windows AMIs).
- Traffic goes through the **SSM service endpoint** (HTTPS 443) — no inbound ports needed.
- Works through **VPC Interface Endpoint** for private subnets (no internet required).

**Architecture:**
```
Engineer's laptop → AWS Console/CLI
    → SSM Service (HTTPS 443)
    → SSM Agent on EC2 instance (outbound HTTPS only)
    → Interactive shell session
```

**IAM permissions required:**
```json
{
  "Effect": "Allow",
  "Action": [
    "ssm:StartSession",
    "ssm:TerminateSession",
    "ssm:ResumeSession"
  ],
  "Resource": [
    "arn:aws:ec2:*:*:instance/i-*",
    "arn:aws:ssm:*:*:document/AWS-StartInteractiveCommand"
  ],
  "Condition": {
    "StringEquals": { "ssm:resourceTag/Environment": "production" }
  }
}
```
- Use **tag-based conditions** to restrict which instances a user can access.

**Auditing session activity:**
- **Session logging:** Configure SSM to log all session data (keystrokes/output) to S3 and/or CloudWatch Logs.
- **CloudTrail:** Every `StartSession`, `TerminateSession` call is logged with the IAM principal.
- **Session Manager preferences:** Set idle timeout (e.g., 20 minutes) and max session duration.

**Enforcing no port 22:**
- **AWS Config rule** `restricted-ssh` — flags any SG with inbound `0.0.0.0/0:22`.
- **Auto-remediation:** Config → SSM Automation → `AWS-DisablePublicAccessForSecurityGroup`.
- **SCP:** Deny `ec2:AuthorizeSecurityGroupIngress` if the rule includes port 22 with `0.0.0.0/0` (use custom Lambda-backed Config rule for this).

---

## Q45. Inspector for Vulnerability Management

**Answer:**

**Inspector v2 vs Classic:**
| Feature | Inspector v2 (current) | Inspector Classic (deprecated) |
|---|---|---|
| **Activation** | Account-level, always-on scanning | Assessment template per target group |
| **Scope** | EC2 + ECR + Lambda | EC2 only |
| **Scanning** | Continuous — triggers on new instances, new CVEs, ECR pushes | Scheduled runs only |
| **Agent** | Uses SSM Agent (no separate agent) | Required standalone Inspector agent |
| **Multi-account** | Delegated admin via Organizations | Manual per account |
| **Pricing** | Per instance/image/function scanned | Per assessment run |

**Integration with Security Hub:**
- Inspector v2 **automatically sends findings** to Security Hub.
- Findings include CVE ID, severity (CVSS score), affected package, remediation guidance.
- In Security Hub, create a **custom insight**: "Inspector findings with CVSS ≥ 9.0 on production instances" for immediate attention.
- **Automated workflow:** Security Hub → EventBridge → Lambda → create JIRA ticket for remediation.

**Automated patching based on Inspector findings:**
1. Inspector detects a Critical CVE on an instance.
2. Finding → EventBridge rule matching Critical severity.
3. EventBridge triggers **SSM Automation** `AWS-RunPatchBaseline` on the affected instance.
4. SSM applies the relevant patch.
5. Inspector re-scans and the finding is resolved.
6. **Guardrail:** For production instances, instead of auto-patching, create a change request in ServiceNow and patch during the next maintenance window.

---

# Section 7 — Application Security, CI/CD & Secure SDLC (Q46–Q50) — Answers

---

## Q46. WAF Rule Design for Payments API

**Answer:**

**AWS Managed Rule Groups:**
- **Core Rule Set (CRS):** Covers OWASP Top 10 — SQL injection, XSS, path traversal, remote file inclusion.
- **SQL Database:** Additional SQL injection patterns specific to MySQL, PostgreSQL.
- **Known Bad Inputs:** Blocks request patterns associated with exploitation of known vulnerabilities (Log4j, Spring4Shell).
- **IP Reputation List:** Blocks known bad IP addresses (botnets, scanners).
- **Bot Control:** Detects and manages bot traffic (scrapers, credential stuffers).

**Custom rate limiting per API key:**
```json
{
  "Name": "APIKeyRateLimit",
  "Priority": 2,
  "Action": { "Block": {} },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 1000,
      "AggregateKeyType": "CUSTOM_KEYS",
      "CustomKeys": [
        {
          "Header": {
            "Name": "X-API-Key",
            "TextTransformations": [{ "Priority": 0, "Type": "NONE" }]
          }
        }
      ]
    }
  }
}
```

**Handling false positives:**
1. **Start in COUNT mode** — don't block, just log.
2. **Analyze WAF logs** in S3/CloudWatch — use Athena to query: `SELECT * FROM waf_logs WHERE action = 'COUNT' AND ruleGroupId = 'CRS'`
3. Identify legitimate requests being flagged — often due to body content matching SQL patterns.
4. **Create scope-down statements:** Exclude specific URIs or IP addresses from specific rules.
5. **Override individual rules** within managed groups: set specific rule actions to COUNT while keeping the group in BLOCK.

**COUNT vs BLOCK:**
- **COUNT mode:** Request is allowed through, but the rule match is logged. Use for tuning — observe what would be blocked without impacting users.
- **BLOCK mode:** Request is denied (403). Enable only after confirming no legitimate traffic is matched.
- **Best practice:** Deploy new rules in COUNT for 1-2 weeks → analyze logs → tune with exclusions → switch to BLOCK.

---

## Q47. Secrets Management in CI/CD

**Answer:**

**Architecture using Secrets Manager:**
1. Store database credentials, API keys in **AWS Secrets Manager** with **resource-based policy** restricting access to specific IAM roles.
2. Jenkins node assumes an **IAM role** (via instance profile or OIDC federation — NOT access keys).
3. Build script retrieves secrets at runtime: `aws secretsmanager get-secret-value --secret-id prod/db-credentials`.
4. Secrets are used in-memory during the build/deploy — **never written to disk or environment variables**.

**Automatic rotation for RDS credentials:**
```
Secrets Manager → Rotation Lambda (built-in template)
    → Connects to RDS as admin
    → Changes the password
    → Updates the secret in Secrets Manager
    → Application automatically gets new credential on next retrieval
```
- **Multi-user rotation strategy:** Maintain two alternating database users (`user_v1`, `user_v2`). Rotation switches between them, so the old credential works until all connections drain.
- Set rotation to every **30 days** for PCI/HIPAA compliance.

**Preventing secrets in build logs:**
- **Mask secrets in Jenkins:** Use the `Credentials Binding Plugin` and `Mask Passwords Plugin`.
- **Don't pass secrets as environment variables** — they appear in process listings and crash dumps.
- In `buildspec.yml` (CodeBuild): Use the `secrets-manager` directive:
```yaml
env:
  secrets-manager:
    DB_PASSWORD: prod/db-credentials:password
```
- CodeBuild automatically masks these values in build logs.
- **Post-build audit:** Scan build logs for secret patterns (regex for API keys, passwords) as a safety net.

---

## Q48. Securing a CI/CD Pipeline on AWS

**Answer:**

**Securing CodeBuild:**
- Run CodeBuild in a **VPC** with no internet access — pull dependencies from an internal artifact mirror (CodeArtifact or Nexus).
- Use a **custom build image** from your private ECR (not Docker Hub) — hardened, with pre-installed tools.
- CodeBuild service role: least privilege — only access to ECR, S3 (build artifacts), Secrets Manager.
- Enable **build logs** to CloudWatch (encrypted).

**Integrating security scanning:**
| Stage | Tool Type | Example Tools | Action on Failure |
|---|---|---|---|
| Pre-commit | IaC scanning | tfsec, Checkov | Block commit |
| Build | SAST (static analysis) | SonarQube, Semgrep, CodeGuru | Fail build if Critical |
| Build | SCA (dependencies) | Snyk, Dependabot, npm audit | Fail build if Critical |
| Post-build | Container scan | ECR scanning, Trivy | Block push if Critical |
| Pre-deploy | DAST (dynamic) | OWASP ZAP, Burp | Gate deployment |

**Enforcing security gates before production:**
- In **CodePipeline**, add a **manual approval stage** between staging and production.
- Create a **Lambda function** that checks: (1) SonarQube quality gate passed, (2) no Critical CVEs in container scan, (3) all Config rules compliant in staging.
- The Lambda returns approval/rejection to CodePipeline automatically.

**Signing build artifacts:**
- Use **AWS Signer** to code-sign Lambda deployment packages and container images.
- In CodeBuild `post_build` phase, sign the artifact.
- In the deployment stage, **verify the signature** before deploying.
- For containers, use **Notation** to sign images and store signatures in ECR alongside the image.

---

## Q49. API Gateway Security Hardening

**Answer:**

**Authentication options:**
| Method | Best For | Details |
|---|---|---|
| **Cognito User Pool** | B2C apps, mobile clients | JWT-based, built-in user management |
| **Lambda Authorizer (Token)** | Custom auth (SAML, OAuth from any IdP) | You code the validation logic |
| **Lambda Authorizer (Request)** | Multi-source auth (headers, query strings) | Access to full request context |
| **IAM Auth (SigV4)** | Service-to-service, internal APIs | Uses IAM credentials to sign requests |

For healthcare payments: **Lambda Authorizer** with custom token validation (validates JWTs from your IdP, checks scopes/permissions, enforces MFA claim).

**Mutual TLS (mTLS) on API Gateway:**
- Upload your **CA certificate** to API Gateway's truststore (S3-hosted PEM file).
- Enable mTLS on the custom domain: both client and server present certificates.
- API Gateway validates the client certificate against your CA before allowing the request.
- Use **certificate-based identity** for partner integrations in healthcare payments.

**Injection protection:**
- **Request validation:** Enable API Gateway request validators to enforce required parameters, data types, and schemas.
- **WAF integration:** Attach WAF WebACL with SQL injection and XSS rules (see Q46).
- **Lambda authorizer:** Additional input validation in the authorizer before the request reaches the backend.
- **API Gateway request models:** Define JSON Schema models for request bodies — API Gateway rejects non-conforming requests.

**Throttling and quotas:**
- **Account-level:** Default 10,000 requests/second steady-state, 5,000 burst.
- **Stage-level:** Set per-stage limits (e.g., production: 5,000 req/sec).
- **Usage plans + API keys:** Create per-client quotas:
  - Partner A: 1,000 req/day, 50 req/sec burst
  - Partner B: 10,000 req/day, 100 req/sec burst
- **Purpose:** Prevent any single client from overwhelming the API and impacting other clients (noisy neighbor problem).

---

## Q50. Securing Infrastructure as Code (IaC)

**Answer:**

**IaC security scanning in CI/CD:**

```yaml
# CodeBuild buildspec.yml example
phases:
  pre_build:
    commands:
      # tfsec - Terraform static analysis
      - tfsec . --format json --out tfsec-results.json --minimum-severity HIGH
      # Checkov - Multi-framework IaC scanner (Terraform, CloudFormation, K8s)
      - checkov -d . --framework terraform --output json > checkov-results.json
      # terrascan - OPA-based policy scanning
      - terrascan scan -d . -o json > terrascan-results.json
  build:
    commands:
      # Fail if any Critical findings
      - |
        if jq -e '.results[] | select(.severity == "CRITICAL")' tfsec-results.json; then
          echo "CRITICAL findings detected. Failing build."
          exit 1
        fi
```

**Policy-as-code with OPA:**
```rego
# opa_policies/s3_encryption.rego
package terraform.s3

deny[msg] {
  resource := input.resource.aws_s3_bucket[name]
  not resource.server_side_encryption_configuration
  msg := sprintf("S3 bucket '%v' must have server-side encryption enabled", [name])
}

deny[msg] {
  resource := input.resource.aws_s3_bucket_public_access_block[name]
  resource.block_public_acls != true
  msg := sprintf("S3 bucket '%v' must block public ACLs", [name])
}
```
- Run OPA against the Terraform plan JSON: `terraform plan -out=plan.tfplan && terraform show -json plan.tfplan | opa eval -d policies/ 'data.terraform.s3.deny'`
- **Sentinel** (HashiCorp) is an alternative for Terraform Cloud/Enterprise.

**Pre-commit hooks:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    hooks:
      - id: terraform_tfsec
      - id: terraform_checkov
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
```
- Runs on every `git commit` — blocks commits with security violations.
- **Limitation:** Developers can bypass with `--no-verify`. The CI/CD pipeline check is the true enforcement gate.
