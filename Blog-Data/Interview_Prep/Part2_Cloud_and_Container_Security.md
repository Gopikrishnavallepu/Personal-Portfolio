# DevSecOps & Cloud Security Architect Interview Guide

## SECTION 4 — AWS Cloud Security

### Q1: You receive an alert from GuardDuty for `Recon:EC2/PortProbeUnprotectedPort`. Upon investigation, you see an EC2 instance has port 22 open to `0.0.0.0/0`. Walk me through how you investigate and remediate this from start to finish.
**What they are evaluating:** Incident response methodology in the cloud. They want to see if you immediately terminate the instance (bad) or if you isolate it and check for lateral movement first (good).

**Expert-Level Answer:**
"First, I would validate the alert. I'd check the Security Group associated with the EC2 instance via AWS CLI or Console to confirm port 22 is indeed open to the internet. 
Second, I wouldn't immediately terminate the instance. Instead, I would **contain** it. I'd change the Security Group to a strict isolation group that blocks all inbound/outbound traffic except for our forensic/IR tools (like CrowdStrike or SSM). 
Third, I'd investigate for compromise. I'd check CloudTrail to see who modified the Security Group recently (`AuthorizeSecurityGroupIngress`). I'd also query Falcon EDR telemetry to see if there were successful SSH logins (`Event: UserLogon`) around the time of the port probe, and check for any anomalous child processes spawned by `sshd`. 
If compromised, I'd trigger the IR playbook: snapshot the EBS volume for forensics, tag the instance as 'Compromised', and coordinate with the asset owner to rebuild the server from a clean AMI. Finally, I'd implement a preventative control—such as an AWS Config Rule or Terraform check—to automatically flag or revert Security Groups opening port 22 globally."

**Follow-up Grilling Questions:**
- What if the instance is part of an Auto Scaling Group? If you isolate it, won't the ASG just spin up a new vulnerable instance?
- How do you find the exact IAM user who opened the port in CloudTrail?

**Common Mistakes Candidates Make:**
- Saying "I'll just delete the instance." (Destroys forensic evidence).
- Focusing only on the AWS console and forgetting to check the endpoint (EDR) for actual compromise.

**Real-World Example:**
In my SOC environment, developers sometimes temporarily opened SSH for debugging and forgot to close it. We moved away from SSH entirely by implementing AWS Systems Manager (SSM) Session Manager, which doesn't require open inbound ports.

---

### Q2: An attacker compromises an EC2 instance that has an overly permissive IAM role attached. Explain the exact mechanism of how they extract the credentials and what they could do with them.
**What they are evaluating:** Understanding of the Instance Metadata Service (IMDS) and Server-Side Request Forgery (SSRF) to IAM abuse vectors.

**Expert-Level Answer:**
"Once an attacker gains remote code execution on the EC2 instance, they can query the Instance Metadata Service (IMDS) using a simple HTTP request to a non-routable IP. 
They would execute a command like `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/<RoleName>`. 
The response contains an `AccessKeyId`, a `SecretAccessKey`, and a `Token`. The attacker can copy these credentials and configure them on their own local machine using `aws configure`.
Once configured locally, the attacker assumes the identity of that EC2 instance. If the role has `s3:GetObject` and `s3:ListBucket`, they can exfiltrate data to their own machine. If it has `iam:CreateUser` or `iam:AttachUserPolicy`, they can create a backdoor admin account for persistence."

**Follow-up Grilling Questions:**
- How does AWS IMDSv2 mitigate this specific attack? 
- If you see those temporary credentials being used from an external IP address in CloudTrail, what is the fastest way to revoke them?

**Common Mistakes Candidates Make:**
- Confusing EC2 Instance Profiles with IAM Users. (Instance profiles generate temporary STS tokens, not permanent access keys).
- Not knowing the IP address `169.254.169.254`.

---

## SECTION 5 — Kubernetes & EKS Security

### Q3: You mentioned deploying Falcon CWPP as a DaemonSet in EKS. Why a DaemonSet, and how does CrowdStrike gain visibility into other containers running on that node?
**What they are evaluating:** Deep understanding of Kubernetes architecture and how container security sensors actually function at the OS level.

**Expert-Level Answer:**
"We deploy it as a DaemonSet because Kubernetes guarantees that a DaemonSet ensures exactly one copy of the pod runs on every single worker node in the cluster. This is crucial for security because as the EKS cluster scales up and adds new nodes, the Falcon sensor is automatically provisioned without manual intervention, ensuring zero coverage gaps.
CrowdStrike gains visibility into other containers because the Falcon pod runs with elevated privileges on the host—specifically using `hostPID` and `hostNetwork`, and it mounts the host's `/var/run/docker.sock` or `containerd.sock`. Because containers are essentially just isolated processes sharing the same host kernel, the Falcon sensor hooks into the host's kernel (often using eBPF) to monitor syscalls across all container namespaces. This allows it to see exactly what processes are executing inside every other pod."

**Follow-up Grilling Questions:**
- Running a security pod with high privileges is inherently risky. How do you secure the Falcon DaemonSet itself? 
- If a developer deploys a pod with `privileged: true`, how does that bypass standard namespace isolation?

**Common Mistakes Candidates Make:**
- Not understanding *why* a DaemonSet is used over a Deployment.
- Thinking the Falcon sensor is injected *into* every other container, rather than running alongside them and monitoring the shared kernel.

**Real-World Example:**
This is the standard architectural deployment for almost all CWPPs (CrowdStrike, Aqua, Prisma Cloud). When I deployed this at UltraViolet, I had to ensure our OPA Gatekeeper policies allowed the CrowdStrike namespace to bypass our strict "No Privileged Pods" rule.

---

### Q4: An attacker compromises a web application pod running in EKS. What are the common techniques they would use to breakout of the container or escalate privileges within the cluster?
**What they are evaluating:** Kubernetes threat modeling and MITRE ATT&CK for Containers.

**Expert-Level Answer:**
"If a pod is compromised, the attacker's first goal is usually discovery and lateral movement.
1. **Service Account Token Abuse:** Every pod mounts a default service account token at `/var/run/secrets/kubernetes.io/serviceaccount/token`. The attacker will grab this token and attempt to query the Kubernetes API server. If RBAC is misconfigured (e.g., the service account has `cluster-admin` or can list secrets), they can dump all cluster secrets.
2. **Container Breakout:** If the pod was deployed with `securityContext: privileged: true`, the attacker has almost root-level access to the underlying worker node. They can execute `chroot /host` to escape the container boundary and take over the underlying EC2 node.
3. **Cloud Metadata Abuse:** If IMDSv2 isn't enforced, or if the pod isn't restricted by network policies, they can hit `169.254.169.254` to steal the worker node's underlying AWS IAM credentials."

**Follow-up Grilling Questions:**
- How do you detect someone querying the Kubernetes API server anomalously? (Hint: Kubernetes Audit Logs).
- How would you use IAM Roles for Service Accounts (IRSA) to mitigate the cloud metadata abuse?

---

## SECTION 13 — Architecture & Design Questions

### Q5: We are migrating a monolithic application to a microservices architecture on AWS EKS. As a Security Architect, design the security controls you would implement across the entire lifecycle (Code to Cloud).
**What they are evaluating:** Holistic DevSecOps and Shift-Left thinking. Can you design a secure pipeline rather than just reacting to alerts?

**Expert-Level Answer:**
"I would architect security in three distinct phases: Build, Deploy, and Run.
**1. Build Phase (Shift-Left):**
- I'd integrate SAST tools (like SonarQube) into the Git repository to catch vulnerable code on Pull Requests.
- I'd implement SCA (Software Composition Analysis) like OWASP Dependency-Check or Snyk to catch vulnerable open-source libraries.
- I'd integrate a container scanner (like Trivy) into the CI pipeline to scan the Docker image for vulnerabilities *before* it's pushed to the Elastic Container Registry (ECR).

**2. Deploy Phase (Infrastructure as Code):**
- Since we use Terraform, I'd integrate `tfsec` or `checkov` to scan the IaC for misconfigurations (e.g., ensuring S3 buckets aren't public, or EKS endpoints are private).
- Within Kubernetes, I'd implement an Admission Controller like OPA Gatekeeper or Kyverno. If a developer tries to deploy an image that hasn't been scanned or tries to run a pod as `root`, the Admission Controller rejects the deployment.

**3. Run Phase (Runtime Protection):**
- I'd deploy CrowdStrike Falcon CWPP as a DaemonSet on the EKS nodes for kernel-level visibility and threat detection.
- I'd implement Kubernetes Network Policies to enforce default-deny traffic between microservices, so if the frontend is compromised, it can't natively talk to the backend database.
- Finally, I'd feed CloudTrail, EKS Audit Logs, and Falcon telemetry into our SIEM (Taegis XDR/Splunk) for continuous SOC monitoring."

**Follow-up Grilling Questions:**
- Developers complain that the Trivy scanner is breaking the build due to unpatchable 'High' vulnerabilities in base images. How do you handle this?
- How do you handle secrets management in this architecture? Do you store them in Kubernetes Secrets or something external?

**Common Mistakes Candidates Make:**
- Only talking about runtime security (EDR/Firewalls) and ignoring the CI/CD pipeline.
- Not mentioning Admission Controllers, which are the backbone of Kubernetes security enforcement.
