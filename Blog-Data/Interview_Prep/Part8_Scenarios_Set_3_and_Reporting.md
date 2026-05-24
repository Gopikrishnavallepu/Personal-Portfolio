# DevSecOps & Cloud Security Architect Interview Guide: Scenarios Set 3

## 15 Detection Tuning Exercises

1. **Rule**: Alert on any use of `whoami`.
   **Problem**: Triggers 500 times a day because the SCCM client uses it during software deployment.
   **Tuning Solution**: Exclude the specific Parent Process (`ccmexec.exe`) running from the exact System Center installation directory.

2. **Rule**: Alert on AWS `ConsoleLogin` without MFA.
   **Problem**: Triggers constantly for a specific service account that doesn't support virtual MFA.
   **Tuning Solution**: Create an exception for that specific IAM User ARN, but enforce a secondary compensating control rule (e.g., alert if that user logs in from any IP other than the corporate NAT Gateway).

3. **Rule**: Alert on high volume of HTTP 403 Forbidden errors (brute force detection).
   **Problem**: An outdated mobile app version is hitting a deprecated API endpoint, causing 10,000 FPs a day.
   **Tuning Solution**: Filter out the User-Agent specific to that old mobile app version, while retaining the rule for all other traffic.

4. **Rule**: Alert on PowerShell execution with `-ep bypass`.
   **Problem**: The DevOps team uses this in a Jenkins build script globally.
   **Tuning Solution**: Whitelist the specific hash of the Jenkins build script, or restrict the exclusion to the Jenkins worker node hostnames/IPs.

5. **Rule**: Alert on outbound RDP (3389).
   **Problem**: The IT Helpdesk uses RDP daily for remote support.
   **Tuning Solution**: Create an Active Directory Group exclusion (`Helpdesk_Admins`) so the alert only fires if a *non-IT* user initiates an RDP session.

6. **Rule**: Alert on `aws s3 sync` execution.
   **Problem**: Data engineers use this command hourly to back up logs.
   **Tuning Solution**: Exclude the specific IAM Role (`DataEngineeringRole`) used by the automated pipeline, but keep the alert active for all human IAM users.

7. **Rule**: Alert on `curl` or `wget` execution on Linux servers.
   **Problem**: Triggers during automated package updates (`apt-get` / `yum` post-install scripts).
   **Tuning Solution**: Exclude `curl`/`wget` when the parent process is the package manager (`dpkg` or `rpm`), or when the destination URL is an official Ubuntu/CentOS repository.

8. **Rule**: Alert on massive file deletion (Ransomware/Wiper detection).
   **Problem**: A log rotation script naturally deletes thousands of old `.log` files every night at midnight.
   **Tuning Solution**: Whitelist the specific script path and bound the exclusion to the scheduled 12:00 AM - 12:05 AM time window.

9. **Rule**: Alert on impossible travel (e.g., login from US, then India 5 mins later).
   **Problem**: The CEO travels and uses a commercial VPN on their phone.
   **Tuning Solution**: Integrate the SIEM with Azure AD to recognize 'Known Good Devices' or whitelist known commercial VPN ASN ranges for executives, requiring a secondary risk factor (like a new device) to trigger.

10. **Rule**: Alert on `net user /add`.
    **Problem**: The desktop provisioning script creates local admin accounts on first boot.
    **Tuning Solution**: Exclude the alert if it occurs within 10 minutes of the system's first boot/uptime timestamp, and only if spawned by the deployment service.

11. **Rule**: Alert on base64 encoded PowerShell commands.
    **Problem**: Microsoft Exchange Server naturally generates massive amounts of base64 PowerShell during normal operation.
    **Tuning Solution**: Create a strict exclusion for Exchange Servers (`Parent Process: w3wp.exe` originating from the Exchange install path).

12. **Rule**: Alert on new EC2 instance creation.
    **Problem**: The Auto Scaling Group scales up and down constantly.
    **Tuning Solution**: Exclude `RunInstances` API calls made by the `AWSServiceRoleForAutoScaling` role.

13. **Rule**: Alert on suspicious child processes of Microsoft Word (`winword.exe`).
    **Problem**: A legacy financial plugin genuinely spawns `cmd.exe` to check a local license file.
    **Tuning Solution**: Do not whitelist `cmd.exe` entirely! Whitelist the exact command line string (e.g., `cmd.exe /c type C:\license.txt`) so other malicious commands still trigger.

14. **Rule**: Alert on any AWS Security Group change.
    **Problem**: Terraform pipelines destroy and recreate security groups daily during testing.
    **Tuning Solution**: Exclude the Terraform Jenkins execution role, but monitor if the SG change opens ports `22` or `3389` to `0.0.0.0/0` (a "never allow" condition regardless of the user).

15. **Rule**: Alert on `vssadmin.exe` execution (Shadow copy deletion).
    **Problem**: A third-party backup agent uses `vssadmin.exe` to manage snapshots.
    **Tuning Solution**: Whitelist the code-signing certificate of the legitimate backup vendor, ensuring that if malware renames itself to the backup agent, it still triggers because the signature will be invalid.

---

## 15 SOC Manager-Level Reporting Questions

### Q1: The CISO asks for a weekly report on SOC performance. What 5 metrics do you include and why?
**Answer:**
1. **MTTD (Mean Time to Detect):** How fast we spot the bad guys.
2. **MTTR (Mean Time to Respond):** How fast we contain them.
3. **True Positive Ratio (Fidelity Rate):** Are our rules noisy, or are they accurate?
4. **Alerts per Analyst / Burnout Rate:** To ensure we aren't overwhelming the team.
5. **Coverage Gaps (e.g., % of endpoints missing Falcon):** To show risk outside the SOC's immediate control.

### Q2: How do you justify the budget for a SOAR platform to the Board of Directors?
**Answer:** "A SOAR platform is an ROI multiplier. Currently, our Level 1 analysts spend 20 minutes manually triaging a single phishing email. We receive 500 a week. That's 166 hours of manual labor. A SOAR platform automates this triage, reducing the time to 1 minute per email. This allows us to reallocate 3 full-time analysts from repetitive copy-pasting to proactive threat hunting and cloud architecture, drastically lowering our breach risk without adding headcount."

### Q3: A major zero-day vulnerability (like Log4Shell) drops on a Friday night. Walk me through your communication and execution plan as the SOC Lead.
**Answer:** 
1. **Declare an Incident:** Open a priority bridge.
2. **Triage:** Query the SIEM/Falcon to see if we have active exploitation attempts against our perimeter.
3. **Identify:** Pull a Nessus or CrowdStrike Spotlight report to identify all vulnerable assets.
4. **Communicate:** Send an initial brief to the CISO: "We are aware of CVE-X. We have Y vulnerable assets. We are seeing Z exploit attempts but no successful breaches. We are deploying WAF blocking rules now."
5. **Remediate:** Coordinate with IT to patch internet-facing assets immediately.

### Q4: You notice MTTR is steadily increasing over the last 3 months. How do you investigate the root cause?
**Answer:** I look at three areas: People, Process, and Technology. 
- *People*: Have we lost senior analysts, leaving juniors to handle complex alerts? 
- *Process*: Are the playbooks outdated, requiring analysts to guess what to do? 
- *Technology*: Is the SIEM searching slowly? Did we turn on a new log source that flooded the queue?

### Q5: How do you build a Detection Engineering lifecycle?
**Answer:** It's a continuous loop:
1. **Threat Intel:** Read about a new attack (e.g., APT29 using a new technique).
2. **Hypothesis:** Assume we are compromised by it.
3. **Hunt:** Search the SIEM for the behavior.
4. **Code:** Write the detection rule.
5. **Test:** Execute a red-team simulation (e.g., using Atomic Red Team) to ensure the rule fires.
6. **Tune:** Reduce false positives.
7. **Deploy:** Push to production.

*(Remaining 10 questions focus on strategic thinking)*

6. **How do you measure the effectiveness of your Threat Intelligence feeds?** (Look at hit rates. If a feed costs $50k/year but hasn't generated a single True Positive alert in 6 months, it's low value).
7. **What is the difference between an SLA (Service Level Agreement) and an SLO (Service Level Objective) in the SOC?** (SLA is a contractual obligation, often with penalties; SLO is an internal goal for MTTR/MTTD).
8. **How do you handle 'Alert Fatigue' among your analysts?** (Aggressive rule tuning, SOAR automation, and rotating analysts out of the queue into project work/hunting).
9. **How do you map SOC coverage to the MITRE ATT&CK framework for executive reporting?** (Use a heat map showing which techniques we have strong detections for vs. blind spots).
10. **A penetration test report comes back with a "Critical" finding that the SOC completely missed. How do you respond?** (Do a blameless post-mortem. Why didn't it fire? Was it a lack of logs, a broken rule, or analyst error? Fix the gap).
11. **How do you integrate the SOC with the DevOps/Engineering teams?** (Create a DevSecOps culture—embed security champions in the dev teams, and ensure SOC alerts have clear, actionable remediation steps for engineers).
12. **What is your strategy for retaining top SOC talent?** (Pay for certifications, allow them time for research/hunting, and automate the boring L1 work so they can focus on complex analysis).
13. **How do you report Cloud Security posture (AWS) to non-technical leadership?** (Use simple metrics: "Percentage of public S3 buckets," "Number of overly permissive IAM roles," and trend lines showing improvement over time).
14. **When do you decide to escalate a security event to a full-blown Critical Incident?** (When there is confirmed unauthorized access to sensitive data, widespread lateral movement, or an active ransomware deployment).
15. **How do you ensure your SOC playbooks remain relevant?** (Schedule quarterly reviews, and mandate that every post-incident report includes a section on "Playbook Updates Required").
