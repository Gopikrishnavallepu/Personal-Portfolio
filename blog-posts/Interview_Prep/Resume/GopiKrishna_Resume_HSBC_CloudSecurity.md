# **GOPIKRISHNA VALLEPU**

**Hyderabad, Telangana – 500084**
📞 +91 9160216468 | ✉️ gopikrishnavallepu1998@gmail.com | [LinkedIn](https://linkedin.com/in/gopikrishna-vallepu)

---

## Professional Summary

Cloud & Container Security Engineer with **4+ years** of hands-on cybersecurity experience, specializing in **CrowdStrike Falcon CNAPP**, **AWS cloud security**, and **Kubernetes runtime protection**. Currently operating as a Security Analyst focused on cloud workload protection (CWPP), cloud security posture management (CSPM), and container security across enterprise AWS and EKS environments. Proficient in **detection engineering, security agent lifecycle management, and compliance evidence generation** against CIS AWS Foundations Benchmark. Experienced in triaging runtime detections — including container escape attempts, privilege escalation, drift events, and IAM anomalies — using eBPF-based telemetry from Falcon sensors deployed via DaemonSets. Proven ability to build security dashboards, reduce false positive rates through systematic tuning, and collaborate across platform, engineering, and SOC teams to resolve incidents within defined SLAs.

---

## Core Competencies

| Domain | Skills |
|--------|--------|
| **CNAPP & Cloud Security** | CrowdStrike Falcon (CWPP, CSPM, CIEM, KAC), Cloud-native security architecture, CNAPP design |
| **Runtime Protection** | Container drift detection/prevention, interactive session detection, kernel exploit detection, eBPF telemetry |
| **Kubernetes Security** | EKS, Kubernetes Admission Controller (KAC), RBAC auditing, Pod Security Standards, DaemonSet sensor deployment |
| **AWS Security** | IAM, EC2, S3, EKS, VPC, KMS, GuardDuty, CloudTrail, CloudWatch, Secrets Manager, IRSA |
| **Detection Engineering** | Custom detection rule building, false positive tuning, alert correlation, MITRE ATT&CK cloud mapping |
| **Monitoring & Reporting** | Security dashboards, coverage metrics, sensor health validation, detection accuracy tracking |
| **Governance & Compliance** | CIS AWS/EKS Benchmarks, audit evidence generation, change management, SLA enforcement |
| **Incident Response** | Alert triage, root cause analysis, containment workflows, threat hunting, log correlation |
| **Tools & Platforms** | SecureWorks Taegis XDR, CrowdStrike Falcon EDR, Zscaler, Tenable Nessus, Python, Bash, Linux |

---

## Professional Experience

### **UltraViolet Cyber** — Security Analyst
📍 Hyderabad, Telangana | 📅 January 2023 – Present

#### Endpoint Security for Cloud & Containers
- Managed and configured **CrowdStrike Falcon** across AWS EC2, Linux workloads, and **EKS Kubernetes clusters**, ensuring consistent runtime protection and endpoint visibility across cloud-native environments.
- Validated and maintained **Falcon sensor deployment on EKS worker nodes** via DaemonSets, achieving **100% cluster-wide sensor coverage** and ensuring automated enrollment for new nodes in managed node groups.
- Executed **sensor onboarding, health validation, and decommissioning** procedures during workload provisioning and scale-down events, maintaining complete detection visibility with zero telemetry gaps.

#### Detection Engineering & Runtime Protection
- Triaged and investigated **runtime detections** including suspicious process execution, privilege escalation attempts, container drift events, abnormal network activity, and unauthorized interactive shell access within containerized workloads.
- Performed **detection reviews and false positive tuning** using SecureWorks Taegis XDR and CrowdStrike Falcon, analyzing true positive rates monthly and suppressing known false-positive patterns with documented justification and expiry dates.
- Built **custom detection correlation logic** to reduce alert fatigue — combining low-signal events (e.g., first-seen domain connections) with process chain anomalies to surface high-confidence alerts, improving SOC response efficiency.
- Investigated multi-stage attack patterns including: **container escape attempts via nsenter/hostPID**, **IMDS credential theft via SSRF**, **IAM privilege escalation via CreatePolicyVersion**, and **S3 data exfiltration via presigned URL abuse**.

#### Cloud Security Posture & Governance (CSPM / CIEM)
- Proactively monitored AWS environments for **high-risk misconfigurations** including publicly exposed S3 buckets, overly permissive IAM policies, open security groups (port 10250, 0.0.0.0/0), and missing encryption controls.
- Conducted **granular IAM access reviews** to enforce least privilege principles, identifying shadow admin paths, over-privileged instance profiles, and IRSA roles missing `aws:SourceVpc` conditions — reducing privilege escalation risk surface.
- Identified and remediated **configuration drift** from baseline security standards, ensuring adherence to internal governance policies and CIS AWS Foundations Benchmark.
- **Generated audit evidence** aligned with CIS AWS and EKS Benchmarks, supporting compliance and regulatory readiness for audit cycles — producing reports on S3 access controls, CloudTrail status, IAM policy reviews, and sensor coverage metrics.

#### Kubernetes Admission Control (KAC)
- Supported **Falcon KAC policy configuration** to enforce admission controls on EKS clusters — policies covering privileged container blocking, root container prevention, host namespace restrictions, and image assessment enforcement.
- Monitored KAC **Indicators of Misconfiguration (IOMs)** including: privileged containers, running as root, hostPID/hostNetwork/hostIPC enabled, excessive capabilities, and sensitive volume mounts.
- Contributed to **staged KAC rollout strategy**: Alert-only mode for 2 weeks → selective prevention for critical IOMs → full PREVENT mode after 72-hour clean detection runs — achieving zero false-positive production blocks.

#### Monitoring, Dashboards & Reporting
- Defined and maintained **operational dashboards** tracking sensor coverage percentage, detection accuracy rates, false positive trends, and container asset counts across clusters.
- Monitored **container inventory** — total containers, pods, nodes, and clusters — and investigated anomalies such as unidentified containers not visible to Kubernetes (indicating compromised node/orchestrator).
- Created **weekly and monthly reports** for stakeholders including detection volume, mean-time-to-triage, coverage gaps, and remediation SLA compliance metrics.

#### Collaboration & Incident Support
- Performed **log correlation and threat analysis** across AWS CloudTrail, GuardDuty, Falcon EDR, Microsoft security logs, Zscaler, authentication logs, process execution logs, and NetFlow telemetry to identify IOCs and lateral movement patterns.
- Collaborated with **cloud platform teams and application owners** to resolve security findings, ensuring timely remediation within SLA — CRITICAL: 24 hours, HIGH: 48 hours, MEDIUM: 7 days.
- Supported **incident response workflows** for cloud and container security events — executing containment (pod quarantine via NetworkPolicy, node cordon/drain), credential rotation, and post-incident root cause analysis.

---

### **Cisco Systems, Inc** — Consulting Engineer Apprentice
📍 Bangalore, Karnataka | 📅 July 2021 – July 2022

- Developed a **Firewall Migration Tool** using Python, parsing ASA/FTD configuration files and automating migration steps, reducing manual migration effort by 60%.
- Performed **bug scrubbing** for Cisco ASA and FTD platforms, analyzing defects and providing software recommendation reports to enterprise customers.
- Contributed to **application containerization initiatives** using Docker and supported basic Kubernetes configurations, building foundational experience in container orchestration and secure infrastructure practices.

---

## Key Projects & Scenarios Handled

| Scenario | My Role | Outcome |
|----------|---------|---------|
| Container drift — offensive tool injection post-RCE | Triaged drift alert, correlated with process tree, identified RCE vector | Containment in <15 min, drift prevention switched to PREVENT mode |
| IMDS v1 credential theft via SSRF | Investigated CloudTrail + Falcon CWPP telemetry, traced stolen session | IMDSv2 enforced org-wide via SCP, CSPM policy created |
| Privileged container escape via hostPID + nsenter | Detected container escape pattern in Falcon process tree | Node cordoned, replaced; KAC policy tightened to PREVENT |
| EKS RBAC misconfig — system:masters in aws-auth | Identified during CSPM audit of aws-auth ConfigMap | Custom ClusterRole created, system:masters mapping removed |
| kubectl exec abuse from leaked kubeconfig | Investigated interactive session alert in production pod | SA token rotated, exec RBAC removed, secrets moved to Secrets Manager |

---

## Technical Skills

| Category | Technologies |
|----------|-------------|
| **Security Platforms** | CrowdStrike Falcon (EDR, CWPP, CSPM, CIEM, KAC), SecureWorks Taegis XDR, Zscaler, Tenable Nessus |
| **Cloud (AWS)** | IAM, EC2, S3, EKS, VPC, KMS, GuardDuty, CloudTrail, CloudWatch, Secrets Manager, Route 53, IRSA, SCP |
| **Kubernetes** | EKS, kubectl, RBAC, DaemonSets, Admission Controllers, Pod Security Standards, Helm, Namespaces |
| **Containerization** | Docker, containerd, image assessment, container drift detection, runtime protection |
| **Detection & Response** | MITRE ATT&CK (Cloud Matrix), IOA/IOM/IOC analysis, threat hunting, log correlation, incident response |
| **Compliance** | CIS AWS Foundations Benchmark, CIS EKS Benchmark, CIS Kubernetes Benchmark, audit evidence generation |
| **Scripting & Tools** | Python, Bash, Regex, Linux, Wireshark, CyberChef |
| **Protocols** | TCP/IP, DNS, HTTP/HTTPS, TLS, OIDC |

---

## Certifications

| Certification | Issuer |
|--------------|--------|
| CCNA 200-301 | Cisco |
| CyberOps Associate | Cisco |
| AWS Cloud Essentials | Amazon Web Services |

---

## Education

**PSCMR College of Engineering and Technology** — Vijayawada, Andhra Pradesh
Bachelor of Technology in Electronics and Communication Engineering
📅 July 2016 – May 2020
