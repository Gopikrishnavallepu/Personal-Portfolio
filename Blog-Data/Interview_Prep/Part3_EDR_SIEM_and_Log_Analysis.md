# DevSecOps & Cloud Security Architect Interview Guide

## SECTION 3 — CrowdStrike Falcon Deep Technical

### Q1: An alert fires in CrowdStrike Falcon for a "High Severity: OverWatch detection". You check the process tree, and it's simply `cmd.exe` running `ping 8.8.8.8`. Why did Falcon flag this, and how do you investigate?
**What they are evaluating:** Understanding of behavioral heuristics, IOAs (Indicators of Attack), and process lineage vs. just looking at the binary.

**Expert-Level Answer:**
"Falcon doesn't just alert on bad hashes; it alerts on anomalous behavior (IOAs). If `ping 8.8.8.8` triggers an OverWatch (threat hunting) detection, I immediately look at the **Process Lineage**. 
If the parent process is `winword.exe` (Microsoft Word), `excel.exe`, or `w3wp.exe` (IIS web server), that is a massive red flag. `winword.exe` should never spawn a command prompt to ping an external IP. This usually indicates a malicious macro payload checking for internet connectivity before downloading the second-stage payload.
To investigate:
1. I would expand the process tree in the Falcon UI to see the exact parent and grandparent processes.
2. I would check the 'Network Operations' tab for that PID to see if the macro subsequently reached out to a suspicious domain.
3. I would network-contain the host via Falcon immediately to prevent the second-stage download or lateral movement, then retrieve the malicious Word document for sandbox analysis."

**Follow-up Grilling Questions:**
- What if the parent process is `explorer.exe`?
- How do you pull a file from an endpoint remotely using CrowdStrike? (Hint: Real Time Response / RTR).

**Common Mistakes Candidates Make:**
- Dismissing it as a False Positive simply because `ping.exe` is a legitimate Windows binary.
- Not understanding what CrowdStrike OverWatch actually is (human-led threat hunting).

**Real-World Example:**
This exact pattern is used by Emotet and Trickbot. The macro runs `ping` with a delay to evade sandbox detection before reaching out to the C2 server.

---

### Q2: You need to investigate a machine that you suspect is compromised, but it's currently isolated via CrowdStrike Network Containment. How do you investigate it, and what commands would you run?
**What they are evaluating:** Knowledge of CrowdStrike's Real Time Response (RTR) capabilities and live forensics.

**Expert-Level Answer:**
"When a machine is Network Contained in Falcon, it drops all network connections except the persistent TLS connection to the CrowdStrike cloud. I would use **Real Time Response (RTR)** to establish a remote shell into the isolated host.
Once connected, I would execute several live response commands:
1. `ps` - to list running processes and look for anomalies not caught by the sensor.
2. `netstat` - to check for active or listening ports (though external connections will be blocked, local bind shells might be visible).
3. `cd` and `ls` - to navigate to suspicious directories like `C:\Users\Public` or `%TEMP%`.
4. `get` - to pull a suspicious file or memory dump off the machine and upload it to the Falcon cloud for my review.
5. If I need to run a custom PowerShell script to hunt for specific IOCs, I would use the `runscript` command to execute a pre-approved script from our Falcon repository."

**Follow-up Grilling Questions:**
- What permissions do you need in Falcon to use the `runscript` or `get` commands? (Hint: RTR Active Responder / RTR Admin).
- If the attacker achieves SYSTEM privileges and uninstalls the Falcon sensor, what happens? (Hint: Sensor Tampering Protection).

---

## SECTION 10 — SIEM/XDR & Log Correlation

### Q3: You have logs coming into Splunk/Taegis XDR from AWS CloudTrail, CrowdStrike, and Cisco FTD Firewalls. How would you correlate these logs to track an attacker who compromised an EC2 instance and exfiltrated data?
**What they are evaluating:** Understanding of log schemas, correlation keys, and SIEM search logic.

**Expert-Level Answer:**
"To track the full kill chain, I need to pivot between log sources using common correlation keys—primarily IP addresses, timestamps, and hostnames/instance IDs.
1. **Initial Access (Cisco FTD):** I'd query the firewall logs filtering by the EC2 instance's public IP. I'd look for anomalous inbound traffic, such as SSH brute force or an HTTP exploit attempt. The correlation key here is the **Destination IP** (EC2 public IP) and **Source IP** (Attacker).
2. **Execution (CrowdStrike):** Using the timestamp from the firewall log, I'd query Falcon logs (or use the Falcon console) for that specific EC2 instance's hostname. I'd look for process executions (e.g., `wget`, `curl`, `bash -i`) originating from the web server daemon. Correlation key: **Hostname / Local IP**.
3. **Privilege Escalation / Cloud Abuse (AWS CloudTrail):** If the attacker stole the IAM role from the instance metadata, I would take the IAM Role ARN found on that EC2 instance and query CloudTrail. My query would look for `userIdentity.arn` matching the role, but where the `sourceIPAddress` does *not* match our VPC NAT Gateway or corporate IPs. This reveals what AWS API calls the attacker made externally.
4. **Exfiltration (Cisco FTD / CloudTrail):** I'd check CloudTrail for `s3:GetObject` if they stole data from S3, or check the firewall/VPC Flow Logs for massive outbound bytes (e.g., 50GB transferred out) from the EC2 instance to the attacker's IP."

**Follow-up Grilling Questions:**
- How do you handle timestamp discrepancies between AWS (UTC), Firewalls (Local), and endpoints?
- In Splunk, how would you write a `stats` or `transaction` command to link these together?

**Common Mistakes Candidates Make:**
- Giving vague answers like "I'll just search for the IP in Splunk." You must specify the fields and the logic.
- Forgetting that CloudTrail logs external API usage, which is the most critical part of an AWS breach.

---

## SECTION 11 — Networking & Packet Analysis

### Q4: You capture a PCAP of suspicious traffic. You see a DNS request for a very long, random string like `jh234g23j4hg234.maliciousdomain.com`. What is happening here, and how do you investigate?
**What they are evaluating:** Deep networking knowledge and understanding of DNS Data Exfiltration / C2.

**Expert-Level Answer:**
"This is highly indicative of **DNS Tunneling** or **DNS Data Exfiltration**. Because DNS is rarely blocked outbound by corporate firewalls, attackers use it to bypass restrictions.
The attacker encodes stolen data (like passwords or sensitive files) into Base64 or Hex, appends it as a subdomain to a domain they control (`maliciousdomain.com`), and makes a DNS TXT or A record request. The corporate DNS server recursively forwards this to the attacker's authoritative name server, effectively delivering the stolen data.
To investigate:
1. In Wireshark, I would filter by `dns` and look at the query lengths. A high volume of unique, exceptionally long subdomains to a single domain is a dead giveaway.
2. I would check the response size. If it's a Command and Control (C2) channel, the attacker's server will respond with TXT records containing commands to execute.
3. To remediate, I would immediately block `maliciousdomain.com` on our DNS sinkhole (like Cisco Umbrella or Pi-hole) and our perimeter firewalls. Then, I'd trace the source IP of the DNS request back to the endpoint and isolate it using CrowdStrike."

**Follow-up Grilling Questions:**
- How is this different from Domain Generation Algorithms (DGA)?
- If the traffic is encrypted using DoH (DNS over HTTPS), how can you detect it?

**Common Mistakes Candidates Make:**
- Confusing DNS tunneling with DGA (DGA is used by malware to find its C2 server by generating thousands of domains; Tunneling is using the DNS protocol itself to transmit data).

**Real-World Example:**
Tools like `Iodine` or `Dnscat2` are specifically designed to create these tunnels. In a SOC environment, you should have SIEM alerts configured to trigger when the average length of DNS queries from a single host exceeds a specific threshold.
