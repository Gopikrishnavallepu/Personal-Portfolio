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
