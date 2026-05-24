# DevSecOps & Cloud Security Architect Interview Guide: Final Evaluation

## My Weak Areas Based on Resume

1. **Length of Experience vs. Senior Titles:** You have 4 years of experience. Applying for "Senior Architect" or "SOC Manager" roles might raise eyebrows. You need to compensate for the *duration* by emphasizing the *depth* and *complexity* of what you've handled (e.g., EKS DaemonSets, CWPP).
2. **Heavy Tool Focus over Conceptual Depth:** Your resume lists many tools (Falcon, Taegis, Wazuh, Splunk). Interviewers might suspect you only know how to click buttons in a UI. You must prove you understand *how* the tools work under the hood (e.g., eBPF in Falcon, API queries in AWS).
3. **Architecture/Design Experience:** A SOC Analyst role is highly reactive. An Architect role is proactive. Your resume is very strong on response/hunting but lighter on initial network/cloud design from scratch.
4. **DevSecOps Depth:** You mention Terraform and Docker/Kubernetes, but "basic" next to them in your skills list is a red flag for senior roles. You need to remove the word "basic" and speak confidently about integrating security into pipelines.

---

## What Interviewers Are Likely to Challenge Me On

1. **"You claim you managed Falcon CWPP on EKS. Walk me through the exact deployment architecture. How did you handle RBAC for the sensor?"** (They are checking if you actually deployed it or just monitored the dashboard).
2. **"You mention MITRE ATT&CK. Tell me exactly how you mapped a specific threat hunt to a MITRE Tactic and Technique, and what the resulting detection looked like."** (Checking if it's just a buzzword).
3. **"How do you distinguish between a False Positive and True Positive for an AWS IAM abuse alert?"** (Testing your analytical methodology and AWS knowledge).
4. **"If I give you a blank AWS account, how would you design the security architecture from the ground up?"** (Testing your transition from Analyst to Architect).

---

## What Topics I Should Study Deeper

1. **AWS Identity and Access Management (IAM):** Understand `sts:AssumeRole`, Instance Profiles, Cross-Account access, and SCPs natively. This is the #1 attack vector in the cloud.
2. **Kubernetes Architecture:** Understand the difference between the Control Plane (API Server, etcd) and the Data Plane (Kubelet, worker nodes). Understand how Admission Controllers (OPA Gatekeeper) and Network Policies work.
3. **DevSecOps Pipelines:** Be able to draw on a whiteboard how code moves from a developer's laptop -> Git -> CI/CD Runner (Jenkins/GitLab) -> Docker Registry (ECR) -> EKS, and where exactly security tools (SAST, SCA, DAST, Image Scanning) fit into that flow.
4. **Server-Side Request Forgery (SSRF) & IMDS:** Deeply understand how web application vulnerabilities lead to cloud infrastructure compromise.

---

## Final 7-Day Preparation Roadmap

* **Day 1: Resume Mastery & Narrative.** Re-read your resume. Prepare a STAR (Situation, Task, Action, Result) story for *every single bullet point*. Never be caught off-guard by your own resume.
* **Day 2: AWS Deep Dive.** Review AWS IAM privilege escalation paths. Memorize how to investigate CloudTrail logs for `ConsoleLogin`, `AssumeRole`, and `CreateAccessKey`.
* **Day 3: Kubernetes & Falcon.** Review the CrowdStrike documentation for deploying on Kubernetes. Understand DaemonSets, `hostPID`, and kernel monitoring.
* **Day 4: Incident Response.** Practice walking through the SANS IR lifecycle for three scenarios: Phishing, Ransomware, and AWS IAM credential theft. Speak out loud.
* **Day 5: DevSecOps & Architecture.** Map out a CI/CD pipeline on paper. Know the difference between SAST, DAST, and SCA. Be ready to explain "Shift-Left".
* **Day 6: Mock Interview (Out Loud).** Record yourself answering the questions from *Part 1* and *Part 2* of this guide. Listen to the playback. Are you saying "um"? Are you rambling? Keep answers under 3 minutes.
* **Day 7: Rest and Mindset.** Do not study new material. Review your top 3 success stories. Focus on your breathing and confidence.

---

## A Confidence-Building Strategy for Interviews

1. **The "Consultant" Mindset:** Do not go into the interview thinking "Please hire me." Go in thinking, "I am a security consultant evaluating if my skills can solve their current problems." This shifts the power dynamic and relaxes you.
2. **You Know More Than You Think:** The interviewer likely doesn't know everything you know. They might be an expert in AppSec but know very little about CrowdStrike EDR. Don't assume they are trying to trick you; often, they are just curious about how *you* solved a problem.
3. **The Power of "I Don't Know, But..."**: If you get a question you don't know, never panic or lie. Say: *"I haven't encountered that specific scenario in my environment. However, based on my understanding of X, my approach to investigating it would be Y."* This shows analytical thinking, which is more valuable than memorization.
4. **Control the Pace:** When asked a complex architecture question, say: *"That's a great question. Let me take 10 seconds to structure my thoughts."* Take a sip of water, outline your 3 main points in your head, and then answer. It projects immense seniority and control.
5. **Remember Your Wins:** Before you log into the Zoom call, remind yourself: *You have 4 years of experience. You have secured production Kubernetes clusters. You have hunted real threats. You belong in this room.*
