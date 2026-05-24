# PART 5: CLOUD & INFRASTRUCTURE SECURITY (20–25 minutes)

---

## 5.1 "How do you handle security differently for **on-prem** vs **cloud** resources?"

**Answer Outline:**

| Aspect | On-Premises | Cloud |
|--------|-------------|-------|
| **Physical security** | You own it: data center locks, guards, CCTV | Cloud provider handles it (shared responsibility) |
| **Network perimeter** | Clear boundary: firewall at edge | Blurred boundary: services exposed via APIs, internet-facing by default |
| **Patching** | You patch everything (OS, middleware, apps) | Shared: provider patches infra; you patch apps and configs |
| **IAM** | Active Directory, LDAP, local accounts | Cloud IAM (roles, policies, federation). More granular but more complex |
| **Visibility** | Full network TAP, packet capture | Limited: rely on cloud-native logs (CloudTrail, VPC Flow Logs) |
| **Scaling** | Manual provisioning, slow | Auto-scaling: new resources spin up instantly (security must follow) |
| **Configuration** | Managed manually or via scripts | Infrastructure-as-Code (Terraform, CloudFormation). Misconfigurations at scale |
| **Data sovereignty** | Data stays in your data center | Data could be in any region unless you restrict it |

**Key differences in approach:**

1. **Shared responsibility model:** "On-prem, I'm responsible for everything. In cloud, provider handles physical, network, and hypervisor security. I handle IAM, data, application, and OS-level security."

2. **Identity is the new perimeter:** "On-prem, the network firewall is the primary control. In cloud, IAM policies are the primary control. A misconfigured IAM role can expose more than a misconfigured firewall."

3. **Ephemeral resources:** "Cloud instances spin up and down. Security controls must be automated—can't manually configure each instance. We use launch templates with security baselines baked in."

4. **API-driven everything:** "Cloud infrastructure is managed via APIs. Security includes protecting API keys, auditing API calls (CloudTrail), and monitoring for unauthorized API usage."

5. **Logging & monitoring:** "On-prem: collect logs via syslog/agent. Cloud: enable cloud-native logging (CloudTrail for API calls, VPC Flow Logs for network, GuardDuty for threat detection). Aggregate into SIEM."

**Your experience:** "We run a hybrid environment. On-prem has traditional controls: firewalls, IDS, physical security. Cloud has automated security: Terraform enforces security baselines, CloudTrail logs every API call, GuardDuty detects threats, and IAM policies enforce least privilege. The biggest lesson: cloud security requires automation—manual processes don't scale."

---

## 5.2 "What are the main security responsibilities under the **shared responsibility model** for cloud providers?"

**Answer Outline:**

```
┌──────────────────────────────────────────────────────────────┐
│                    CUSTOMER RESPONSIBILITY                     │
│  (Security IN the cloud)                                      │
│                                                               │
│  ✅ Customer data & encryption                                │
│  ✅ Identity & access management (IAM)                        │
│  ✅ Application security                                      │
│  ✅ Operating system, network, firewall configuration          │
│  ✅ Client-side data encryption                               │
│  ✅ Server-side encryption (data at rest)                     │
│  ✅ Networking traffic protection (TLS, VPN)                  │
├──────────────────────────────────────────────────────────────┤
│                   PROVIDER RESPONSIBILITY                      │
│  (Security OF the cloud)                                      │
│                                                               │
│  ✅ Physical security of data centers                         │
│  ✅ Hardware, networking infrastructure                       │
│  ✅ Hypervisor / compute isolation                            │
│  ✅ Global infrastructure (regions, AZs, edge)               │
│  ✅ Managed services' infrastructure                          │
└──────────────────────────────────────────────────────────────┘
```

**Varies by service type:**

| Service Type | Customer Manages | Provider Manages |
|-------------|-----------------|-----------------|
| **IaaS** (EC2, VMs) | OS, apps, data, IAM, firewalls, patching | Hardware, hypervisor, networking |
| **PaaS** (RDS, Lambda) | Data, IAM, app code | OS, runtime, patching, scaling |
| **SaaS** (Office 365, Salesforce) | Data, access controls, config | Everything else |

**Common mistakes in banking:**
- "Assuming AWS/Azure secures your data for you" → No. Data encryption is YOUR job.
- "Leaving S3 buckets public" → Your misconfiguration, your breach.
- "Not enabling MFA on root account" → Your responsibility.
- "Not enabling CloudTrail" → You lose audit visibility.

**Your approach:** "I map every cloud service we use to the shared responsibility model. For each service, I document: What does the provider manage? What do we manage? Then I ensure our controls cover our responsibilities—IAM policies, encryption, logging, and configuration management."

---

## 5.3 "How would you secure a multi-account **AWS** or **Azure** setup used by a bank?"

**Answer Outline:**

**Multi-account architecture (AWS Organizations):**

```
┌──────────────────────────────────────────────────┐
│                 MANAGEMENT ACCOUNT                │
│  - AWS Organizations root                        │
│  - SCPs (Service Control Policies)               │
│  - Consolidated billing                          │
│  - CloudTrail (org-wide)                         │
└──────────────────────────────────────────────────┘
        ↓                    ↓                ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  SECURITY    │   │  PRODUCTION  │   │  DEVELOPMENT │
│  ACCOUNT     │   │  ACCOUNTS    │   │  ACCOUNTS    │
│              │   │              │   │              │
│ - GuardDuty  │   │ - Prod apps  │   │ - Dev/QA     │
│ - Security   │   │ - Customer   │   │ - Sandbox    │
│   Hub        │   │   data       │   │ - No prod    │
│ - CloudTrail │   │ - Strict IAM │   │   data       │
│   aggregation│   │ - Encrypted  │   │ - Looser IAM │
│ - Config     │   │   data       │   │              │
│   rules      │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        ↓                    ↓                ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  LOGGING     │   │  SHARED      │   │  NETWORKING  │
│  ACCOUNT     │   │  SERVICES    │   │  ACCOUNT     │
│              │   │  ACCOUNT     │   │              │
│ - S3 buckets │   │ - Active Dir │   │ - Transit    │
│   for logs   │   │ - DNS        │   │   Gateway    │
│ - Immutable  │   │ - Shared     │   │ - VPN        │
│   storage    │   │   tools      │   │ - Direct     │
│              │   │              │   │   Connect    │
└──────────────┘   └──────────────┘   └──────────────┘
```

**Security controls:**

1. **SCPs (Service Control Policies):**
   - Deny regions outside approved list (data sovereignty)
   - Deny disabling CloudTrail
   - Deny public S3 buckets
   - Deny creation of IAM users (force SSO/federation)

2. **Centralized logging:**
   - All accounts send CloudTrail, VPC Flow Logs, Config data to logging account
   - Logs stored in S3 with Object Lock (immutable—can't be deleted even by admin)
   - SIEM (Splunk/Sentinel) ingests all logs for correlation

3. **Centralized security monitoring:**
   - AWS Security Hub aggregates findings from all accounts
   - GuardDuty enabled in all accounts, findings sent to security account
   - AWS Config rules check compliance across all accounts

4. **IAM governance:**
   - SSO via AWS IAM Identity Center (formerly AWS SSO)
   - No IAM users; all access via federated roles
   - Permission boundaries limit maximum privileges
   - MFA enforced on all accounts

5. **Network isolation:**
   - Each account has its own VPC
   - Transit Gateway connects VPCs with controlled routing
   - Network ACLs and security groups per account
   - No direct internet access from production accounts (via NAT gateway only)

**Your experience:** "We designed a multi-account AWS architecture with separate accounts for security, production, development, logging, and networking. SCPs prevent destructive actions. All logs aggregate into a centralized logging account with immutable storage. GuardDuty and Security Hub provide unified threat detection. IAM access is federated—no static credentials. This architecture passed our PCI-DSS audit."

---

## 5.4 "How do you manage **IAM** in the cloud (roles, policies, least privilege, separation of duties)?"

**Answer Outline:**

**IAM challenges in cloud banking:**
- Thousands of users, hundreds of roles, millions of permissions
- Static credentials can be compromised
- Over-permissioned roles are common (developers copy existing broad policies)

**Best practices:**

**1. Federation (no IAM users):**
- All human access via SSO (Okta, Azure AD → AWS)
- No static IAM users with passwords
- Federated roles with session-based temporary credentials
- "Our developers assume roles via SSO. No access keys stored on laptops."

**2. Least privilege policies:**
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::prod-data-bucket/reports/*",
  "Condition": {
    "IpAddress": {"aws:SourceIp": ["10.0.0.0/8"]},
    "StringEquals": {"aws:PrincipalTag/Department": "Finance"}
  }
}
```
- Action: Only read (not write/delete)
- Resource: Only specific bucket/prefix
- Condition: Only from corporate network + finance department

**3. Permission boundaries:**
- Maximum permissions a role can ever have, regardless of attached policies
- "Even if someone attaches `AdministratorAccess`, the boundary limits actual permissions"

**4. Access analysis:**
- IAM Access Analyzer: Identifies resources shared externally
- Access Advisor: Shows which permissions were actually used
- "We run monthly access reviews: unused permissions → removed. Reduced over-provisioned roles by 70%."

**5. Separation of duties:**
- Dev can deploy code but can't modify IAM policies
- Security can review policies but can't deploy code
- Finance can access billing but not production systems
- "No single role has both 'deploy code' and 'modify IAM' permissions"

**6. Service control at organization level:**
- SCPs prevent anyone from disabling security controls
- "Even account admins can't disable CloudTrail or create public S3 buckets"

**Your experience:** "We migrated from IAM users to federated SSO access. Eliminated all static credentials. Implemented permission boundaries to cap maximum privileges. Monthly access reviews remove unused permissions. IAM Access Analyzer catches unintended external sharing. Result: Zero IAM-related security incidents since implementation."

---

## 5.5 "What controls do you use for **securing data at rest and in transit** in cloud environments?"

**Answer Outline:**

### Data at Rest

| Control | Implementation | Example |
|---------|---------------|---------|
| **Server-side encryption** | AWS KMS / Azure Key Vault manages keys | S3 SSE-KMS, EBS encryption, RDS encryption |
| **Customer-managed keys** | You control the key lifecycle (rotation, deletion) | KMS CMK for sensitive data; no AWS-managed keys for PCI data |
| **Field-level encryption** | Encrypt specific fields before storage | SSN encrypted before writing to DynamoDB |
| **HSM-backed keys** | Hardware Security Module for highest assurance | CloudHSM for payment processing keys |
| **Key rotation** | Automatic annual rotation; manual for compromise | KMS auto-rotation enabled; manual rotation if key suspected compromised |
| **Access control on keys** | IAM policies on KMS keys control who can encrypt/decrypt | Only payment service role can decrypt payment data |

### Data in Transit

| Control | Implementation | Example |
|---------|---------------|---------|
| **TLS 1.2/1.3** | All API calls, web traffic, internal service communication | ALB terminates TLS; backend uses TLS for internal calls |
| **mTLS** | Mutual TLS between services | Service mesh (Istio) enforces mTLS for pod-to-pod communication |
| **VPN / Direct Connect** | Encrypted tunnel for hybrid connectivity | AWS Direct Connect + VPN for on-prem ↔ cloud traffic |
| **Certificate management** | ACM (AWS Certificate Manager) for automated cert provisioning | Auto-renewing certs on ALB endpoints |
| **Private endpoints** | Services communicate via private network, not internet | VPC endpoints for S3, KMS, DynamoDB—no internet transit |

**Banking-specific requirements:**
- PCI-DSS: Card data must be encrypted at rest with strong cryptography; key management must follow PCI requirements
- GLBA: Customer financial data must be protected in transit and at rest
- SOX: Audit trails for all key management operations

**Your experience:** "All data in our cloud environment is encrypted at rest using customer-managed KMS keys with automatic rotation. In transit, TLS 1.3 is enforced everywhere. Internal service communication uses mTLS via service mesh. We use VPC endpoints to keep traffic off the internet. HSM-backed keys are used for payment processing. This architecture meets PCI-DSS and SOX requirements."

---

## 5.6 "How do you monitor and respond to security events using tools like **CloudTrail / Azure Monitor / SIEM**?"

**Answer Outline:**

**Monitoring architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│  DATA SOURCES                                                │
│                                                              │
│  CloudTrail ─────→ All API calls (who did what, when)       │
│  VPC Flow Logs ──→ Network traffic (src, dst, allowed/denied)│
│  GuardDuty ──────→ Threat detection (anomalous behavior)    │
│  Config ─────────→ Resource configuration changes           │
│  WAF Logs ───────→ Web attack attempts                      │
│  Application Logs→ App-specific events (login, transactions)│
│  CloudWatch ─────→ Metrics and alarms                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  AGGREGATION & CORRELATION (SIEM)                           │
│                                                              │
│  Splunk / QRadar / Sentinel                                 │
│  - Ingest all log sources                                   │
│  - Normalize and parse                                      │
│  - Apply correlation rules                                  │
│  - Generate alerts                                          │
│  - Dashboards for SOC                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  DETECTION RULES (Examples)                                  │
│                                                              │
│  1. CloudTrail: "Root account used" → CRITICAL alert        │
│  2. CloudTrail: "IAM policy changed" → HIGH alert           │
│  3. CloudTrail: "S3 bucket made public" → CRITICAL alert    │
│  4. GuardDuty: "Cryptocurrency mining detected" → HIGH      │
│  5. VPC Flow Logs: "Outbound traffic to known C2 IP" → CRIT│
│  6. Config: "Security group allows 0.0.0.0/0 on port 22"   │
│  7. WAF: "SQL injection blocked" → MEDIUM (info)            │
│  8. App Logs: "50 failed logins in 5 min" → HIGH            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE                                                    │
│                                                              │
│  Automated:                                                  │
│  - Lambda revokes public S3 bucket access                   │
│  - Lambda disables compromised IAM user                     │
│  - Security group auto-remediated via Config rules          │
│                                                              │
│  Manual (SOC):                                               │
│  - Investigate GuardDuty findings                           │
│  - Analyze lateral movement in VPC Flow Logs                │
│  - Incident response playbook execution                     │
└─────────────────────────────────────────────────────────────┘
```

**Response playbook example: "Root account used"**
1. SIEM alert triggers: "CloudTrail event: root account signed in"
2. SOC analyst verifies: Was this authorized maintenance?
3. If unauthorized: Immediately rotate root credentials, enable MFA, review all root actions in last 24 hours
4. Investigate: Was there a credential leak? Check for unauthorized resource creation
5. Remediate: Remove any resources created by unauthorized root access
6. Document: Incident report, lessons learned

**Your experience:** "We aggregate CloudTrail, VPC Flow Logs, GuardDuty, and application logs into Splunk. We've built 50+ detection rules covering IAM misuse, network anomalies, and compliance violations. Automated response via Lambda remediates common issues (public S3 buckets, overly permissive security groups). SOC handles complex investigations. We detect and respond to cloud security events within 15 minutes on average."

---

## 5.7 "Describe your experience with **container** and **Kubernetes** security (namespaces, RBAC, network policies, image scanning)."

**Answer Outline:**

**Container security layers:**

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: IMAGE SECURITY (Build time)                        │
│  - Scan images for vulnerabilities (Trivy, Snyk, Aqua)      │
│  - Use minimal base images (Alpine, distroless)             │
│  - No secrets in images (use external secret management)    │
│  - Sign images (cosign) → verify signature before deploy    │
│  - Private registry only (ECR, ACR) → no public images      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: CLUSTER SECURITY (Kubernetes config)               │
│                                                              │
│  RBAC (Role-Based Access Control):                          │
│  - ClusterRole: cluster-wide permissions                    │
│  - Role: namespace-scoped permissions                       │
│  - Example: Dev team → Role in "dev" namespace only         │
│    (can deploy pods, can't access "production" namespace)   │
│                                                              │
│  Namespaces:                                                │
│  - Logical isolation: production, staging, monitoring       │
│  - Resource quotas per namespace (CPU, memory limits)       │
│  - "Dev namespace can't consume more than 4 CPU cores"      │
│                                                              │
│  Pod Security Standards:                                     │
│  - Restricted: No root containers, no host networking       │
│  - Baseline: Safe defaults                                  │
│  - Privileged: Only for system pods (monitoring agents)     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: NETWORK SECURITY                                   │
│                                                              │
│  Network Policies:                                          │
│  - Default deny all ingress/egress                         │
│  - Whitelist specific pod-to-pod communication              │
│  - Example: "Payment pod can only talk to database pod      │
│    on port 5432. Cannot reach internet."                    │
│                                                              │
│  Service Mesh (Istio/Linkerd):                              │
│  - mTLS between all pods (encrypted by default)             │
│  - Traffic policies and authorization                       │
│  - Observability (distributed tracing)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: RUNTIME SECURITY                                   │
│                                                              │
│  - Runtime detection (Falco, Aqua, Sysdig)                  │
│  - Detect: shell spawned in container, file write to /etc,  │
│    network connection to unexpected IP                      │
│  - Response: Alert SOC, kill container, isolate pod         │
│                                                              │
│  - Secrets management:                                      │
│  - External Secrets Operator → pulls secrets from Vault/KMS │
│  - Not Kubernetes Secrets (base64 encoded, not encrypted)   │
│                                                              │
│  - Admission controllers:                                    │
│  - OPA/Gatekeeper: Policy-as-code                           │
│  - "Deny pods without resource limits"                      │
│  - "Deny images from public registries"                     │
│  - "Deny privileged containers"                             │
└─────────────────────────────────────────────────────────────┘
```

**Practical controls I implement:**

1. **Image scanning in CI/CD:** Trivy scans every image before it enters the registry. Critical CVEs block deployment.
2. **RBAC:** Developers get namespace-scoped roles. Only SRE team has cluster-admin. Service accounts have minimal permissions.
3. **Network policies:** Default deny. Explicitly allow required pod-to-pod communication. Payment services isolated.
4. **Pod security:** Non-root containers, read-only filesystems, no host namespace access.
5. **Runtime monitoring:** Falco detects anomalous behavior (unexpected process execution, network connections).
6. **Admission control:** OPA/Gatekeeper enforces policies at deployment time (no privileged pods, no public images, resource limits required).

**Your experience:** "We run 200+ microservices on EKS. Security starts at build: Trivy scans images in CI/CD, blocking critical CVEs. In cluster: RBAC restricts access by team namespace, network policies isolate services, and pod security standards prevent privileged containers. Runtime: Falco monitors for anomalies, alerting SOC on suspicious behavior. OPA/Gatekeeper enforces policies at admission. This layered approach has prevented container escapes and lateral movement in our Kubernetes environment."

---

## 5.8 "How do you assess risk before approving deployment of a new cloud service in a regulated environment?"

**Answer Outline:**

**Risk assessment checklist for new cloud service:**

**Step 1: Service classification**
- What data will this service process? (PII, PCI, financial data, public data)
- What regulatory frameworks apply? (PCI-DSS, SOX, GLBA, GDPR)
- What's the business impact if this service is compromised? (Critical, High, Medium, Low)
- Who are the users? (Internal only, customer-facing, third-party)

**Step 2: Shared responsibility analysis**
- Map the service to the shared responsibility model
- What does the cloud provider manage? What do we manage?
- Is this IaaS, PaaS, or SaaS? (Different risk profiles)

**Step 3: Security control assessment**
- **IAM:** How is access controlled? Can we integrate with our SSO? RBAC supported?
- **Encryption:** Data encrypted at rest and in transit? Customer-managed keys?
- **Logging:** Does it integrate with CloudTrail/SIEM? Audit logs available?
- **Network:** Can we restrict access via VPC/private endpoints? Public access required?
- **Compliance:** SOC 2 Type II report? ISO 27001? PCI-DSS certified?
- **Data residency:** Where is data stored? Can we restrict to approved regions?

**Step 4: Vendor/service assessment**
- Review service's SOC 2 report
- Check for known vulnerabilities or breaches
- Assess vendor's security posture
- Review service-level agreement (SLA)
- "We use a vendor risk questionnaire covering 150+ security questions"

**Step 5: Proof of concept with security validation**
- Deploy in sandbox account
- Validate controls: IAM, encryption, logging, network isolation
- Penetration test if customer-facing
- Validate compliance controls

**Step 6: Approval and documentation**
- Security team signs off
- Compliance team validates regulatory requirements
- Architecture team reviews integration
- Document: Approved service, controls in place, residual risks, review date

**Your experience:** "Before approving any new cloud service in our environment, I perform a structured risk assessment covering data classification, shared responsibility, security controls, and compliance alignment. For a recent database service evaluation, I identified that the service didn't support customer-managed encryption keys—a PCI-DSS requirement for our use case. We worked with the vendor to enable this feature before approval. This process ensures we don't introduce uncontrolled risk into our regulated environment."

---
