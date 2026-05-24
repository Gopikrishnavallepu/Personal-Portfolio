# DevSecOps & Cloud Security Architect Interview Guide: Scenarios Set 1

## 25 Advanced Real-World Attack Scenarios

1. **SSRF to IMDSv1 Metadata Theft**: An attacker uses a vulnerable web application to query `169.254.169.254` and steal EC2 instance IAM credentials.
2. **S3 Bucket Ransomware**: An attacker gains access to an S3 bucket, downloads the data, encrypts the objects in place using a KMS key they control, and deletes the originals.
3. **Lateral Movement via SSM**: An attacker compromises a developer laptop and uses AWS Systems Manager (SSM) Session Manager to seamlessly shell into private EC2 instances without needing SSH keys.
4. **Golden SAML Attack**: An attacker steals the ADFS token signing certificate and forges SAML tokens to bypass Azure AD / AWS SSO authentication entirely.
5. **Living off the Land (LOLBins)**: An attacker uses `certutil.exe` to download a malicious payload to bypass perimeter web filters.
6. **Docker Escape via Privileged Container**: An attacker compromises a pod running with `privileged: true`, mounts the host filesystem (`/dev/sda1`), and `chroot`s into the worker node.
7. **CloudTrail Evasion**: An attacker disables CloudTrail logging for a specific region, creates a backdoor IAM user, and then re-enables logging to hide their tracks.
8. **Kerberoasting**: An attacker requests service tickets for SPNs (Service Principal Names) and cracks the NTLM hashes offline to gain privileged Active Directory access.
9. **Log4Shell on EKS**: An attacker exploits CVE-2021-44228 on a Java-based microservice running in Kubernetes, gaining reverse shell access to the pod.
10. **Malicious Terraform Provider**: An attacker submits a PR that includes a compromised Terraform provider registry URL, executing malicious code during the CI/CD pipeline run.
11. **RDP Brute Force to Ransomware**: An attacker brute-forces an exposed RDP port, disables Windows Defender using `Set-MpPreference`, and deploys LockBit.
12. **Pass-the-Hash**: An attacker dumps LSASS memory using Mimikatz, extracts NTLM hashes, and authenticates to other domain machines without ever knowing the plaintext password.
13. **AWS GuardDuty Evasion**: An attacker uses an IP address previously whitelisted (e.g., a compromised corporate VPN IP) to perform reconnaissance, bypassing anomaly detections.
14. **Cross-Tenant AWS Abuse**: An attacker modifies an IAM Role Trust Policy to allow `sts:AssumeRole` from an AWS account number they control.
15. **Supply Chain Attack (NPM/PyPI)**: A developer accidentally installs a typosquatted Python package (`requessts` instead of `requests`) which opens a reverse shell during the Docker build process.
16. **DNS Data Exfiltration**: An attacker encodes stolen data into subdomains and queries a malicious DNS server to bypass outbound firewall restrictions.
17. **C2 via Domain Fronting**: An attacker hides Command and Control traffic behind a high-reputation CDN (like Cloudflare or CloudFront) to evade SIEM detection.
18. **Azure AD Illicit Consent Grant**: An attacker phishing email tricks a user into granting a malicious OAuth app permissions to read their O365 mailbox.
19. **Kubelet API Anonymous Access**: An attacker connects to an exposed Kubelet API on port 10250 and uses `/run` to execute commands directly on running pods.
20. **VPC Flow Log Blindness**: An attacker routes malicious traffic through AWS PrivateLink or VPC Peering to bypass traditional perimeter IDS/IPS appliances.
21. **Malicious Lambda Deployment**: An attacker updates an existing AWS Lambda function's code to silently forward all processed data to an external webhook.
22. **Container Registry Poisoning**: An attacker gains access to the company's ECR registry and replaces the `latest` tag of a core microservice with a backdoored image.
23. **BGP Hijacking**: (Conceptual) An attacker manipulates BGP routes to intercept traffic destined for the company's public IP space.
24. **Active Directory DCSync**: An attacker compromises a Domain Admin account and uses the Directory Replication Service (DRS) to pull all password hashes from the Domain Controller.
25. **Data Exfiltration via ICMP**: An attacker embeds stolen files within the data payload of ICMP Echo Request packets to bypass standard proxy monitoring.

---

## 20 True Positive (TP) vs False Positive (FP) Exercises

1. **Powershell.exe running with `-EncodedCommand`**. (Likely TP, requires decoding the Base64 to confirm. Often used by malware, but sometimes by SCCM).
2. **`whoami /all` executed by `cmd.exe`**. (Likely TP. This is classic reconnaissance. Standard users rarely run this).
3. **Nmap scanning activity originating from the Qualys scanner IP**. (FP. Authorized vulnerability scanning).
4. **`vssadmin.exe delete shadows /all /quiet`**. (TP. Absolute indicator of Ransomware preparing to encrypt).
5. **AWS CloudTrail showing `ConsoleLogin` without MFA**. (TP. Policy violation, unless it's a break-glass service account).
6. **CrowdStrike alerts on `psexec.exe`**. (Depends. If run by an IT admin for patching, FP. If run by an unknown user across 50 machines at 2 AM, TP).
7. **Impossible Travel: Login from New York and London within 10 minutes**. (Depends. If the London IP is a known corporate VPN or Zscaler node, FP. If it's a generic ISP, TP).
8. **Multiple failed SSH logins from a single IP, followed by a success**. (TP. Successful brute force attack).
9. **`rundll32.exe` communicating over the internet**. (TP. `rundll32` should generally not be making external network calls; often used to load malicious DLLs).
10. **High volume of `NXDOMAIN` DNS responses**. (TP. Indicator of malware using a Domain Generation Algorithm to find its C2).
11. **Developer executing `docker run --privileged` in development**. (FP from a threat perspective, but a policy violation from an architecture perspective).
12. **`svchost.exe` spawning `cmd.exe`**. (TP. `svchost` should not spawn command shells. Likely a hijacked service).
13. **AWS GuardDuty alerts on `UnauthorizedAccess:EC2/SSHBruteForce`**. (FP if it's the internet hitting the port, but the Security Group blocks it. TP if the Security Group allows it and the login succeeds).
14. **User downloads a ZIP file from an email, and `wscript.exe` executes a `.vbs` file inside it**. (TP. Classic phishing payload execution).
15. **Taegis XDR alerts on `mimikatz` string in memory**. (TP. Credential dumping).
16. **`aws s3 sync` command executed locally transferring 500GB of data**. (Depends. If it's the data engineering team, FP. If it's a compromised web server, TP/Exfiltration).
17. **A sudden spike in 500 Internal Server Errors on the WAF**. (TP. Likely an attacker fuzzing the application or attempting SQL injection).
18. **`schtasks.exe` creating a task named 'UpdateCheck' running from `%APPDATA%`**. (TP. Malware establishing persistence).
19. **Falcon alerts on a known malicious hash, but the action was 'Blocked'**. (TP that malware was present, but the incident is contained. Still requires investigation into *how* the hash arrived).
20. **AWS IAM `CreateAccessKey` called by a user who hasn't logged in for 90 days**. (TP. Likely a compromised dormant account).

---

## 20 EKS/Kubernetes Security Scenarios

1. **Unauthenticated Kube API**: The Kubernetes API is exposed to the internet `0.0.0.0/0` without requiring authentication.
2. **Default Service Account Abuse**: An attacker uses the automatically mounted service account token to query the API for secrets.
3. **Privileged Pod Breakout**: A pod deployed with `securityContext.privileged: true` allows an attacker to mount the underlying EC2 node's disk.
4. **Missing Network Policies**: An attacker compromises the frontend web pod and freely uses `curl` to reach the backend database pod because no network isolation exists.
5. **HostPath Mount Abuse**: A pod mounts `/var/run/docker.sock`, allowing an attacker to spin up new, completely uncontrolled containers on the host.
6. **Cleartext Secrets in etcd**: Kubernetes Secrets are not encrypted at rest using an AWS KMS key.
7. **Cluster-Admin Overprovisioning**: Developers are given `cluster-admin` RBAC roles instead of namespace-scoped access.
8. **EKS Node Group Vulnerabilities**: The underlying EC2 AMI for the EKS worker nodes is severely outdated and vulnerable to kernel exploits.
9. **Image Vulnerabilities (Log4j)**: A pod is deployed using an image with critical vulnerabilities because no Admission Controller (e.g., OPA Gatekeeper) blocks it.
10. **Egress Traffic Unrestricted**: A compromised pod initiates an outbound connection to a crypto-mining pool because there is no egress filtering.
11. **Helm Chart Poisoning**: A developer uses a publicly available, unverified Helm chart that contains a malicious sidecar container.
12. **Kube-proxy ARP Spoofing**: An attacker performs ARP spoofing inside the cluster network to intercept traffic between pods.
13. **Missing Pod Security Standards (PSS)**: Pods are allowed to run as root (`runAsNonRoot: false`).
14. **Dashboard Exposed**: The Kubernetes Dashboard is deployed publicly without authentication.
15. **Container Resource Exhaustion (DoS)**: A pod is deployed without CPU/Memory limits, and a malicious script causes it to consume 100% of the node's resources, starving other pods.
16. **Metadata Service Theft**: A pod accesses `169.254.169.254` to steal the worker node's IAM instance profile because IAM Roles for Service Accounts (IRSA) isn't used.
17. **Unauthorized Image Registries**: Pods are pulling images from Docker Hub instead of the approved internal Amazon ECR registry.
18. **Sidecar Injection Bypass**: An attacker modifies a deployment to remove the required security sidecar (e.g., a logging or proxy container).
19. **Compromised CI/CD Kubeconfig**: The Jenkins/GitLab runner's `kubeconfig` file is stolen, giving the attacker direct deployment access to the EKS cluster.
20. **eBPF Sensor Tampering**: An attacker with root privileges unloads the CrowdStrike Falcon eBPF sensor from the kernel, blinding the SOC to container activity.
