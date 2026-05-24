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
