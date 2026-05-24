# 🎯 Cloud & Container Security Mock Interview Guide

A highly realistic mock interview simulation designed for a senior/mid-level **Cloud & Container Security Engineer** role at HSBC or a major enterprise.

---

## 🔥 1. Interview Question Bank (Scenario-Based)

### Q: "We noticed an alert from Falcon: 'Privilege Escalation' on an EC2 instance. Walk me through your investigation."
**A:** "First, I would open the Falcon console and look at the process tree to identify the specific binary that triggered the alert and its parent process. I’d check if the binary is known or anomalous. Next, I would pivot to AWS CloudTrail and GuardDuty. Since it's an EC2 instance, I would check if the instance role was assumed recently and if any unexpected API calls (like `sts:AssumeRole`, `iam:CreatePolicyVersion`, or `s3:GetObject`) were made from that instance's metadata IP (`169.254.169.254`). 
If I confirm it's a true positive, my immediate containment step is to attach a Deny-All IAM policy to the instance's role, isolate the EC2 instance using a restrictive Security Group, and capture the disk/memory for IR."

### Q: "GuardDuty flagged an IAM anomaly (e.g., unusual API call). How do you validate if it’s a true positive?"
**A:** "I start by correlating the GuardDuty finding with CloudTrail logs to see exactly what the IAM principal was doing. I check the `userAgent`, `sourceIPAddress`, and the time of the event. Is the API call coming from a known corporate IP or an anomalous location? Did the user agent suddenly change from a standard AWS SDK to a curl command or a different browser? I would also contextualize the principal — is this a CI/CD role that usually assumes this permission, or is it a developer role that shouldn't be making infrastructure changes in production? If the context doesn't match normal behavior, it’s a true positive."

### Q: "An EKS node has a suspicious process running (e.g., a reverse shell). What is your immediate action and investigation strategy?"
**A:** "Immediate action: Use Falcon Real Time Response (RTR) to kill the suspicious process (`sudo docker kill <container-id>` or `kubectl delete pod`). Since the orchestrator might just spin up another pod, the long-term fix is to block the vulnerable image via the Kubernetes Admission Controller (KAC) and quarantine the Node using Network Policies.
For investigation: I’d check the Falcon 'Drift Indicators' to see if the process deviated from the base image. I’ll review the container’s configuration — was it running as root? Did it have host network access? Finally, I’ll coordinate to patch the vulnerability (e.g., arbitrary file upload or RCE) in the image."

---

## 🧠 2. Advanced “What-If” Scenario Questions

### Q: "Your team deployed a new Falcon Prevention Policy to stop container drift. Suddenly, developers report their production application is completely down. What happened and how do you fix it?"
**A:** "What likely happened is the prevention policy was enabled without a proper baseline monitoring phase. The application likely executes legitimate 'drift' as part of its normal operation (e.g., a startup script downloading a config file at runtime, or an auto-updater). 
**Fix:** Immediately switch the policy from 'Prevent' back to 'Alert/Disabled' for that specific host group to restore service. Then, review the blocked processes in Falcon to understand the application’s behavior, build targeted exclusions (by process path, image hash, or namespace), and test the tuning thoroughly in staging before re-enabling prevention."

### Q: "You find an S3 bucket publicly exposed. How do you determine if it's a real risk or a false positive?"
**A:** "Not all public buckets are risks. First, I check the bucket contents and its intended use case. Is it hosting static assets for a public website? If so, it's expected, but I must verify that the bucket policy only allows `s3:GetObject` and strictly denies `s3:PutObject` or `s3:DeleteObject`. Do they have `Block Public Access` disabled at the account level? 
If the bucket contains PII, database backups, or Terraform state files, it's a critical true positive. I would immediately review the specific bucket policy, check CloudTrail data events to see if unauthorized entities have accessed the objects, and apply a restrictive policy."

---

## 🎯 3. 30-60-90 Day Strategy Answer

### Q: "If you join us, what is your plan for the first 30, 60, and 90 days?"
**A:**
* **First 30 Days (Understand & Assess):** Focus on understanding the environment. Review the current AWS architecture, EKS cluster configurations, and the existing Falcon deployment. Identify visibility gaps — do we have 100% sensor coverage? I will build relationships with the DevOps and SOC teams, understand the current alert volume, and review existing Runbooks.
* **Days 31-60 (Optimize & Tune):** Start addressing the highest-noise alerts. I will implement a detection tuning framework to reduce false positives by analyzing the data and creating precise exclusions. I’ll ensure that GuardDuty, CloudTrail, and Falcon alerts are properly correlated in the SIEM. I’ll also review our Kubernetes Admission Controller policies and work to shift them from 'Alert' to 'Prevent' for non-breaking misconfigurations.
* **Days 61-90 (Automate & Prevent):** Shift focus from reactive to proactive. I will implement automated CSPM checks to ensure CIS AWS Foundations compliance. I will establish baseline monitoring for container drift and gradually enable drift prevention policies on critical production clusters. I will also develop automated containment workflows (SOAR) for high-fidelity alerts like IMDSv2 abuse or lateral movement.

---

## 🗣 4. Behavioral + Technical Blended Answers

### Q: "Tell me about a time you had to push back on a developer who wanted to bypass a security control (e.g., running a privileged container)."
**A:** "In a previous project, a DevOps team requested to run a pod as `privileged: true` because their application needed specific host access to manage network interfaces. Instead of just saying 'no', I scheduled a call to understand their technical requirement. I explained the immense risk: a single container breakout would compromise the entire EKS node. 
I worked with them to identify the exact Linux capabilities they needed (like `CAP_NET_ADMIN`) rather than the blanket `privileged` flag. By applying the principle of least privilege through a specific SecurityContext, they got their tool working, and we avoided opening a critical vulnerability."
