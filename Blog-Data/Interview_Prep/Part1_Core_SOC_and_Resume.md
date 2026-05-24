# DevSecOps & Cloud Security Architect Interview Guide

## SECTION 1 — Self Introduction & Resume Deep Dive

### Q1: Walk me through your background and how your experience aligns with this Senior Security Analyst/Architect role.
**What they are evaluating:** Your ability to summarize 4 years of experience cohesively, highlighting relevant skills (Cloud Security, EDR, Incident Response) without getting bogged down in irrelevant details. They want to see communication skills and confidence.

**Expert-Level Answer:**
"I have four years of dedicated experience in Security Operations, heavily focused on cloud security, threat hunting, and incident response. Currently, at UltraViolet Cyber, I act as a key player in our SOC, where I monitor and investigate complex alerts across hybrid environments using tools like CrowdStrike Falcon and SecureWorks Taegis XDR. My day-to-day involves deep-dive log analysis—correlating telemetry from AWS CloudTrail, GuardDuty, and EKS clusters with traditional endpoint logs to identify sophisticated threat actors. 
Recently, I've shifted significantly towards proactive security and DevSecOps. I manage Falcon CWPP deployments across AWS EC2 and Kubernetes (EKS) using DaemonSets, ensuring runtime protection. I also integrated Terraform code scanning into our CI/CD pipelines to catch insecure configurations before deployment, effectively shifting security left. My background started at Cisco, where I built a strong foundation in networking, firewall automation (ASA/FTD), and containerization. Ultimately, my transition from network engineering to cloud-native threat hunting allows me to not just detect threats, but architect secure, automated defenses against them."

**Follow-up Grilling Questions:**
- You mentioned managing Falcon CWPP on EKS. How exactly did you configure the DaemonSets, and how do you handle nodes that fail to deploy the sensor?
- How do you balance the noise of Shift-Left IaC scanning (Terraform) with developer velocity?

**Common Mistakes Candidates Make:**
- Reciting the resume bullet by bullet like a laundry list.
- Focusing too much on entry-level tasks (like basic SIEM monitoring) instead of architect-level achievements (like EKS DaemonSet deployments and CI/CD integrations).

**Real-World Example:**
Instead of saying "I use CrowdStrike," emphasize: "When we deployed EKS, I identified a visibility gap. I authored the Kubernetes manifest to deploy Falcon as a DaemonSet to ensure every new worker node instantly spun up a sensor, guaranteeing zero runtime visibility gaps."

---

### Q2: On your resume, you mention "Correlated logs from AWS CloudTrail, GuardDuty, Falcon telemetry... and NetFlow". Can you walk me through a specific investigation where you had to correlate three or more of these sources?
**What they are evaluating:** Hands-on analytical methodology. Can you actually connect the dots between cloud control plane logs, endpoint execution, and network traffic, or are you just reading alerts off a single dashboard?

**Expert-Level Answer:**
"Certainly. We had a GuardDuty alert trigger for anomalous IAM behavior—specifically, 'UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration'. 
1. **CloudTrail:** I immediately pivoted to CloudTrail and searched for the assumed role session. I identified that the `sts:AssumeRole` was called from an IP address outside our corporate VPN, and the actor was subsequently making `ec2:DescribeInstances` and `s3:ListBuckets` API calls.
2. **Falcon Telemetry:** I took the instance ID that originally owned that IAM role and queried CrowdStrike Falcon. I found a suspicious `curl` command hitting the AWS metadata service (`169.254.169.254/latest/meta-data/iam/security-credentials/`) originating from a Python script running under a web server daemon.
3. **NetFlow/WAF Logs:** To determine how the web server was compromised, I correlated the timestamp of the payload drop with our WAF and NetFlow logs, identifying an initial Server-Side Request Forgery (SSRF) payload successfully bypassing our WAF rules. 
By correlating these three, we identified the entire kill chain: SSRF -> Metadata Exfiltration -> External API enumeration, and isolated the EC2 instance immediately while rotating the IAM credentials."

**Follow-up Grilling Questions:**
- In that scenario, how fast does GuardDuty generate that alert? Is there a delay? (Hint: GuardDuty can have a 15-20 minute delay).
- How would you automate the containment of that exact attack path?

**Common Mistakes Candidates Make:**
- Giving a theoretical answer instead of a step-by-step technical narrative.
- Failing to mention the exact logs or API calls (e.g., just saying "I checked AWS" instead of "I queried CloudTrail for `sts:AssumeRole`").

**Real-World Example:**
This exact scenario mimics the Capital One breach methodology (SSRF to Metadata service to S3 exfiltration). Demonstrating you know how to trace this specific path is highly impressive.

---

## SECTION 2 — SOC Operations

### Q3: How do you differentiate a True Positive from a False Positive when an EDR triggers an alert for "Suspicious PowerShell Execution"?
**What they are evaluating:** Your analytical process and understanding of LOLBins (Living Off the Land Binaries). Do you blindly trust alerts, or do you analyze the command line arguments and process lineage?

**Expert-Level Answer:**
"A 'Suspicious PowerShell Execution' alert requires immediate context gathering. To determine if it's a True Positive, I look at the **Process Lineage** and the **Command Line Arguments**.
First, I check the parent process. If `powershell.exe` was spawned by `winword.exe` (Microsoft Word) or `wsmprovhost.exe` (WinRM), that is highly anomalous and leans towards a True Positive—likely a macro or lateral movement. If it was spawned by `explorer.exe` or `sccm.exe` (System Center), it requires further digging.
Second, I analyze the arguments. I look for obfuscation (e.g., mixed case, backticks), encoded commands (`-enc`, `-EncodedCommand`), execution policy bypasses (`-ep bypass`), or window hiding (`-w hidden`). 
Third, I look at network connections originating from that specific PID. Is it reaching out to a raw IP address over port 443, or a known malicious domain?
If the script is a known IT admin script running from a centralized share with standard arguments, I classify it as a False Positive and tune the detection rule to exclude that specific hash or file path to reduce SOC fatigue."

**Follow-up Grilling Questions:**
- What if the PowerShell script is running purely in memory (fileless)? How does CrowdStrike Falcon see it? (Hint: AMSI integration / Script Control).
- If it is a True Positive and actively downloading a payload, what is your immediate next step?

**Common Mistakes Candidates Make:**
- Just saying "I check VirusTotal." (PowerShell is a legitimate tool; VT won't flag the `powershell.exe` binary).
- Not mentioning parent-child process relationships.

**Real-World Example:**
Identifying that a developer legitimately uses `-ep bypass` for a build script, and creating an IOA (Indicator of Attack) exclusion in Falcon specifically for that developer's machine and script path, rather than globally whitelisting the command.

---

### Q4: You notice a sudden spike in MTTD (Mean Time to Detect) and MTTR (Mean Time to Respond) in the SOC. As a senior analyst, how do you address this?
**What they are evaluating:** SOC maturity, leadership, and process improvement skills. Can you think like a SOC Manager?

**Expert-Level Answer:**
"A spike in MTTD and MTTR usually indicates either an influx of noisy alerts (alert fatigue), a lack of clear playbooks, or a tooling failure. I would take a data-driven approach to fix this:
1. **Analyze the Top Talkers:** I'd pull a report from Taegis XDR or Splunk to identify which rules are firing the most. Often, 80% of the noise comes from 20% of the rules.
2. **Detection Tuning:** For high-volume false positives, I would refine the logic—adding exclusions for known benign behavior or correlating it with secondary indicators before triggering a high-severity alert.
3. **SOAR Automation:** If the alerts are True Positives but routine (e.g., phishing emails or impossible travel), I would leverage SOAR (like Shuffle, which I've used) to automate the initial triage. For example, automatically extracting URLs, querying MISP/VirusTotal, and disabling the user account if malicious.
4. **Playbook Refinement:** I would review our SOPs. If analysts don't know exactly what to do when a specific alert fires, MTTR skyrockets. I'd ensure the playbook is explicitly linked in the alert notes."

**Follow-up Grilling Questions:**
- How do you convince management to dedicate time to tuning when the queue is overflowing with active alerts?
- Describe a time you automated a task that significantly reduced MTTR.

**Common Mistakes Candidates Make:**
- Blaming junior analysts for being slow.
- Throwing more headcount at the problem instead of tuning and automation.

---

## SECTION 16 — Mock HR Round

### Q5: Tell me about a time you had a conflict with a developer or an infrastructure team regarding a security implementation. How did you resolve it?
**What they are evaluating:** Empathy, communication, and business acumen. Security is often seen as a blocker; they want to see if you are a business enabler.

**Expert-Level Answer:**
"During my time at UltraViolet, we were rolling out CrowdStrike Falcon CWPP across our Amazon EKS clusters. The DevOps team pushed back heavily, concerned that the DaemonSet would consume too many node resources and impact application performance.
Instead of forcing the mandate, I sat down with their lead engineer. I agreed to a phased rollout. We deployed the sensor to a non-production staging cluster first. I set up Datadog dashboards to monitor CPU and memory consumption of the Falcon pods specifically. After a week, we reviewed the data together, which showed the sensor utilized less than 1% of CPU and minimal memory. 
By providing empirical data and treating them as partners rather than adversaries, they became comfortable with the rollout, and we successfully deployed it to production without further friction."

**Follow-up Grilling Questions:**
- What if the sensor *did* cause a CPU spike? What would have been your compromise?

### Q6: Why are you looking to leave your current role at UltraViolet Cyber?
**What they are evaluating:** Professionalism and career trajectory.

**Expert-Level Answer:**
"I’ve had a great experience at UltraViolet Cyber, growing from fundamental SOC monitoring to leading complex cloud investigations and Kubernetes security deployments. However, I am now looking for a role that leans heavier into Cloud Security Architecture and Detection Engineering. I want to build defenses and DevSecOps pipelines at a larger scale, and this organization’s focus on mature cloud-native infrastructure aligns perfectly with where I want to take my career next."

---

## SECTION 17 — Final Rapid Fire Round

**Q: Port 3389 is open to the internet on an EC2 instance. What is the immediate risk, and what is the AWS remediation?**
**A:** RDP brute force or BlueKeep exploitation. Remediation: Modify the attached Security Group to remove the 0.0.0.0/0 inbound rule for 3389 and restrict it to a specific corporate VPN IP or use AWS Systems Manager (SSM) Fleet Manager instead of exposing RDP.

**Q: What is the difference between a Bind Shell and a Reverse Shell?**
**A:** In a Bind Shell, the attacker connects to a port opened by the victim machine. In a Reverse Shell, the victim machine actively calls back out to the attacker's listening machine (often bypassing inbound firewall rules).

**Q: You see `svchost.exe` running from `C:\Users\Public`. What is your conclusion?**
**A:** 100% malicious. `svchost.exe` should strictly execute from `C:\Windows\System32`. It is likely malware masquerading as a legitimate system process.

**Q: What HTTP status code indicates an SSRF attempt might have been successful in hitting the AWS Metadata service?**
**A:** HTTP 200 OK.

**Q: How do you grep for an IP address in a log file?**
**A:** `grep -E -o "([0-9]{1,3}[\.]){3}[0-9]{1,3}" /var/log/syslog`

**Q: What is the primary purpose of an AWS IAM SCP (Service Control Policy)?**
**A:** It acts as a guardrail at the AWS Organization level, defining the maximum available permissions for member accounts, regardless of what local IAM policies allow.
