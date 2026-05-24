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
