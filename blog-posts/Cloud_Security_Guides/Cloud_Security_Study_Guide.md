# ☁️ Cloud & Container Security Study 

A meticulously structured deep dive for a **Cloud & Container Security Engineer** focused on endpoint protection (CrowdStrike Falcon), AWS, Kubernetes (EKS), and detection engineering.

---

## 🛠 1. CrowdStrike Falcon & Cloud Endpoint Security Deep Dive

### High-Level Architecture
* **Falcon Sensor for Linux:** Deployed directly on the host or as a DaemonSet to provide deep system visibility using eBPF or a kernel module. Protects both the host OS and all running containers.
* **Falcon Container Sensor:** Runs as a sidecar without host privileges (used in serverless/managed environments like AWS Fargate).
* **Kubernetes Admission Controller (KAC):** Intercepts K8s API server requests to block deploying vulnerable images, misconfigured pods (e.g., privileged containers, running as root), or drifted images. 

### Falcon in Practice (Runtime Protection)
* **Container Drift Detection**: Detecting when a container's filesystem or executed processes deviate from the original immutable image. **Why it matters:** Attackers usually spawn new processes (like a shell or curl) to download stage-2 payloads. Falcon logs these under "Drift indicators".
* **Interactive Intrusion**: Distinguishing administrator debugging (e.g., `kubectl exec`) from adversarial lateral movement.
* **Prevention vs Alerting**: KAC policies block bad objects before they start. Runtime drift prevention policies terminate drifted processes in real time based on established baselines.

---

## 🏗 2. Real AWS & EKS Attack Scenarios (Step-by-Step)

### Scenario A: IMDSv1 SSRF to STS Token Theft
1. **Initial Access:** Attacker finds a web vulnerability (SSRF) in an application running on EC2.
2. **Execution:** Attacker queries `http://169.254.169.254/latest/meta-data/iam/security-credentials/<role-name>` to steal temporary STS tokens.
3. **Lateral Movement/Exfiltration:** Attacker configures AWS CLI locally using stolen credentials and lists S3 buckets or assumes higher-privileged roles.
* **Detection & Mitigation:**
  * **AWS:** GuardDuty detects `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS`. Ensure IMDSv2 is enforced (requires session token).
  * **Falcon:** Detects suspicious outbound network connections to the metadata IP from unexpected binaries. 

### Scenario B: EKS Container Breakout
1. **Initial Access:** RCE on a vulnerable web app running inside a K8s pod.
2. **Exploitation:** The container was misconfigured as `privileged: true` or with dangerous capabilities (`CAP_SYS_ADMIN`). Attacker executes a shell.
3. **Breakout:** Attacker mounts the underlying node’s filesystem (`mount -t ext4 /dev/sda1 /mnt`) or abuses the container runtime socket (`/var/run/docker.sock` or containerd equivalent).
4. **Impact:** Attacker owns the underlying EKS worker node and can steal Kubelet certificates to compromise the entire cluster.
* **Detection & Mitigation:**
  * **Falcon Runtime:** Alerts on `PotentialKernelTampering` or `ContainerDrift`. Falcon can block the interactive shell.
  * **KAC:** KAC Admission Controller policy should block `privileged: true` at deployment.

---

## 🧪 3. True Positive (TP) vs False Positive (FP) Decision Trees

**Alert: High volume of `S3 Bucket Publicly Exposed`**
* **Step 1:** Is the bucket serving static website assets? 
  * Yes -> **FP / Accepted Risk.** Ensure `s3:GetObject` is restricted to explicit paths and `s3:PutObject` is blocked.
  * No -> Go to Step 2.
* **Step 2:** Was the bucket purposely made public for a third-party integration (e.g., cross-account vendor access)?
  * Yes -> Ensure bucket policy restricts access via `aws:PrincipalArn` instead of just `*`.
  * No -> **True Positive.** Immediate remediation (Block public access at account level if possible).

**Alert: EKS Pod executing a shell (`/bin/bash` invoked)**
* **Step 1:** Compare against baselines. Is the user `system:serviceaccount:default` but the parent process is unexpected (like python/java instead of containerd)?
* **Step 2:** Check CloudTrail/Audit Logs. Did an engineer run `kubectl exec` for debugging? 
  * Yes -> **FP (Operational).** Educate engineer to use ephemeral debug containers instead of dropping into prod pods.
  * No -> **True Positive.** Interactive intrusion. Trigger IR playbook, isolate node, and kill container.

---

## 📊 4. Detection Tuning Framework

A systematic approach to reducing noise without compromising coverage:
1. **Understand Intent:** Why did the rule fire? What MITRE technique is it mapped to?
2. **Analyze the Outliers:** Look at the events generating noise. Are they originating from a specific vulnerability scanner, specific CI/CD pipeline, or expected administrative script?
3. **Filter Strategically:** Avoid global allowlists. Tune specifically by:
   * Process Hash + Command Line Arguments
   * IAM Role + Specific API Call (in CloudTrail logs)
   * Specific Kubernetes Namespace + Image Hash
4. **Validation:** Re-run the attack simulation to ensure the exclusion didn't create a blind spot (False Negative).
5. **Continuous Review:** Metrics dashboard showing "Alert Volume by Rule" and "Alert to Ticket Ratio".

---

## 🧾 5. Governance & Audit Response Strategy

As an engineer owning cloud endpoint security, you'll be grilled by auditors on CIS Benchmarks and compliance.
* **Demonstrating Coverage:** Using Falcon to show that 100% of EKS worker nodes run the DaemonSet. You prove this by comparing AWS API data (List of EC2s) against Falcon API data (List of reporting sensors).
* **CIS AWS Foundations:** Implementing automated checks via CSPM to ensure CloudTrail is enabled in all regions, GuardDuty is running, and IAM policies enforce MFA and Least Privilege.
* **Handling Exemptions:** If a team needs a privileged container, document the risk, define a time-bound exception, and enforce heavy compensating controls (monitor all syscalls specifically for that pod).
