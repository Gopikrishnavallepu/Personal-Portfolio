# DevSecOps & Cloud Security Architect Interview Guide: Scenarios Set 2

## 20 AWS IAM Abuse Scenarios

1. **`iam:CreateUser` Abuse**: An attacker creates a new IAM user (`backup-admin`) for persistent backdoor access.
2. **`iam:CreateAccessKey` Abuse**: An attacker generates a second set of access keys for an existing admin user.
3. **`iam:AttachUserPolicy` Privilege Escalation**: An attacker with limited permissions attaches the `AdministratorAccess` managed policy to themselves.
4. **`iam:UpdateAssumeRolePolicy`**: An attacker modifies a role's trust policy to allow an external AWS account (the attacker's account) to assume it.
5. **`sts:AssumeRole` Chaining**: An attacker assumes a low-privilege role, which has permissions to assume a higher-privilege role, chaining them to reach Admin access.
6. **`iam:PassRole` to EC2**: An attacker creates an EC2 instance and passes an overly permissive `AdministratorAccess` role to it, then SSHes in to use the permissions.
7. **`iam:PassRole` to Lambda**: An attacker creates a Lambda function, passes it an Admin role, and sets the code to exfiltrate secrets or create users.
8. **`iam:CreateLoginProfile`**: An attacker sets a console password for an IAM user that previously only had API keys, allowing them GUI access.
9. **Inline Policy Injection (`iam:PutUserPolicy`)**: An attacker embeds a raw JSON policy directly onto a user to grant themselves `s3:*` permissions.
10. **Group Membership Manipulation (`iam:AddUserToGroup`)**: An attacker adds their compromised, low-privilege user into the `CloudAdmins` group.
11. **MFA Device Deletion (`iam:DeactivateMFADevice`)**: An attacker disables MFA on an admin account to maintain easier persistent access.
12. **`iam:UpdateLoginProfile`**: An attacker resets the console password of another legitimate user to hijack their session.
13. **CloudFormation Privilege Escalation**: An attacker with `cloudformation:CreateStack` uses it to deploy IAM roles they don't natively have permission to create.
14. **Cognito Identity Pool Abuse**: An attacker exploits an unauthenticated Cognito Identity Pool to obtain temporary AWS credentials with excessive permissions.
15. **S3 Bucket Policy Modification (`s3:PutBucketPolicy`)**: An attacker modifies a bucket policy to allow `Principal: "*"` to read sensitive data.
16. **KMS Key Deletion (`kms:ScheduleKeyDeletion`)**: A malicious insider schedules the deletion of the KMS key used to encrypt the company's main database, effectively destroying the data.
17. **CodeBuild Service Role Abuse**: An attacker modifies the `buildspec.yml` of an AWS CodeBuild project to exfiltrate the IAM role credentials assigned to the build runner.
18. **Systems Manager (SSM) Command Execution**: An attacker with `ssm:SendCommand` executes code as SYSTEM on all EC2 instances simultaneously without needing IAM keys on the instances themselves.
19. **`iam:SetDefaultPolicyVersion`**: An attacker reverts an IAM policy to an older, overly permissive version that the security team had previously fixed.
20. **IAM Role Session Name Spoofing**: An attacker assumes a role using `sts:AssumeRole` and sets the `RoleSessionName` to match a legitimate developer's email to throw off SOC investigations.

---

## 15 Ransomware Investigation Scenarios

1. **Patient Zero Identification**: Determining which endpoint was initially compromised 3 weeks before the encryption began.
2. **Double Extortion (Exfiltration before Encryption)**: Detecting `rclone` or `MegaSync` transferring 5TB of data to a cloud storage provider just prior to ransomware deployment.
3. **Lateral Movement via PsExec**: Investigating `psexec.exe` being executed across 50 servers from a single compromised Domain Controller.
4. **GPO-Based Ransomware Deployment**: Ransomware deployed via a malicious Active Directory Group Policy Object to instantly hit all domain-joined endpoints.
5. **VSS Deletion (Shadow Copies)**: Detecting `vssadmin.exe delete shadows /all /quiet` or `wmic shadowcopy delete`.
6. **Safe Mode Booting**: Ransomware configuring the machine to boot into Safe Mode (`bcdedit /set {default} safeboot minimal`) to bypass EDR software.
7. **RDP Brute Force Initial Access**: Investigating a server that had thousands of failed login attempts over port 3389 before a successful login and subsequent encryption.
8. **Malicious Macro Entry**: A user opens an Excel file, clicks "Enable Content", causing PowerShell to download Emotet, which eventually drops Ryuk.
9. **ESXi Hypervisor Ransomware**: Ransomware specifically targeting VMware ESXi servers and encrypting the underlying `.vmdk` files, bypassing Windows EDR.
10. **Service Deletion/Termination**: Ransomware systematically killing backup services (e.g., Veeam) and database services (e.g., MSSQL) before encryption to ensure files are unlocked.
11. **Defense Evasion (EDR Unhooking)**: Ransomware using API unhooking techniques to disable CrowdStrike Falcon's visibility before executing the payload.
12. **Living off the Land (BitLocker Abuse)**: Attackers using the native Windows BitLocker utility to encrypt drives and holding the recovery key for ransom, rather than using custom malware.
13. **Cloud Ransomware (S3 Versioning)**: Attackers encrypting an S3 bucket and deleting the previous versions because MFA Delete was not enabled.
14. **Time Delay Execution**: Ransomware scheduled to execute globally via Scheduled Tasks at 2:00 AM on a Sunday to maximize impact before the SOC can respond.
15. **The Ransom Note Drop**: Investigating the creation of `README.txt` files across thousands of directories using File Integrity Monitoring (FIM).

---

## 15 Phishing Investigation Scenarios

1. **Adversary-in-the-Middle (AiTM)**: A user clicks a link, is directed to an Evilginx2 proxy, and both their password and MFA session cookie are stolen.
2. **Malicious OAuth App Consent**: A user clicks "Accept" on a realistic-looking Microsoft login prompt, granting a malicious third-party app read access to their mailbox.
3. **Business Email Compromise (BEC)**: An attacker compromises the CEO's email and sends wire transfer instructions to the finance department.
4. **Right-to-Left Override (RTLO) Spoofing**: An attacker sends an executable attachment named `invoice_fdp.exe` but uses an RTLO character so it displays to the user as `invoice_exe.pdf`.
5. **Lookalike Domains (Typosquatting)**: Investigating an email originating from `microsofft.com` instead of `microsoft.com`.
6. **QR Code Phishing (Quishing)**: An email contains a QR code directing the user's mobile device to a credential harvesting site, bypassing corporate email URL scanners.
7. **HTML Smuggling**: A phishing email contains an HTML attachment. When opened, JavaScript inside the HTML dynamically generates a malicious `.zip` or `.iso` file directly in the browser, bypassing email attachment filters.
8. **SPF/DKIM/DMARC Failure**: An email is spoofed to look like an internal address, but checking the headers reveals it failed SPF and DMARC alignment.
9. **Malicious Inbox Rules**: After a successful phishing campaign, the attacker sets a rule to forward all emails containing the word "invoice" to an external address.
10. **Reply-Chain Phishing**: An attacker compromises a vendor's email account and replies to an existing, legitimate email thread with a malicious link, making it highly convincing.
11. **Credential Harvesting via SharePoint**: A legitimate compromised SharePoint account is used to host a document containing a link to a credential harvesting site.
12. **PDF with Embedded Link**: A PDF that contains no malware itself, but contains a clickable image that redirects to a phishing site.
13. **Password-Protected ZIPs**: An attacker sends a password-protected ZIP (with the password in the email body) to bypass antivirus scanning at the email gateway.
14. **Spearphishing targeting IT Admin**: A highly targeted email mimicking a Jira ticket alert sent to a Sysadmin to steal highly privileged credentials.
15. **Open Redirect Abuse**: A phishing link uses a legitimate corporate domain (e.g., `https://trusted.com/redirect?url=http://evil.com`) to bypass URL reputation filters.

---

## 20 Cloud Misconfiguration Scenarios

1. **Publicly Exposed S3 Bucket**: An S3 bucket containing PII has `Block Public Access` disabled and a bucket policy allowing `*`.
2. **Overly Permissive Security Groups**: Port 22 (SSH) and Port 3389 (RDP) open to `0.0.0.0/0` across multiple EC2 instances.
3. **Hardcoded AWS Credentials in GitHub**: A developer accidentally commits their `~/.aws/credentials` file to a public GitHub repository.
4. **Unencrypted EBS Volumes**: EC2 instances deployed without EBS encryption, risking data exposure if snapshots are shared publicly.
5. **No MFA for AWS Root User**: The root account has no virtual MFA device attached and is actively being used for administrative tasks.
6. **Public RDS Database**: An Amazon RDS instance is deployed in a public subnet with a security group allowing internet access.
7. **IAM Users with AdministratorAccess**: 50+ developers have the `AdministratorAccess` managed policy attached directly to their users instead of using groups or least-privilege roles.
8. **Unrestricted Egress Traffic**: A VPC has no outbound filtering (NAT Gateway open to `0.0.0.0/0`), allowing a compromised instance to easily download malware or exfiltrate data.
9. **CloudTrail Logging Disabled**: CloudTrail is not enabled for all regions, creating blind spots for API activity.
10. **IMDSv1 Enabled**: EC2 instances are running with IMDSv1 enabled, making them highly susceptible to SSRF-to-credential-theft attacks.
11. **Unsecured Lambda Environment Variables**: AWS Lambda functions containing raw API keys and database passwords in plaintext environment variables instead of Secrets Manager.
12. **Publicly Accessible EKS API Server**: The Amazon EKS control plane API endpoint is public and not restricted to corporate VPN IP ranges.
13. **Missing S3 Bucket Versioning/MFA Delete**: Critical data buckets lack versioning, making ransomware encryption permanent and irreversible.
14. **Broad KMS Key Policies**: A Customer Managed Key (CMK) has a key policy allowing any principal in the account to decrypt it.
15. **Dangling Elastic IPs (Subdomain Takeover)**: An Elastic IP is disassociated from an EC2 instance but still pointed to by a Route 53 DNS record, allowing an attacker to claim the IP and serve malicious content on the company's subdomain.
16. **SNS Topic Public Access**: An Amazon SNS topic policy allows `Publish` from any AWS account, enabling spam or malicious payload injection.
17. **ECR Image Tag Mutability**: ECR repositories are set to mutable, allowing an attacker to overwrite a legitimate `latest` image with a backdoored version.
18. **Unrestricted IAM PassRole**: A developer role has `iam:PassRole` for `Resource: *`, allowing them to pass Administrator roles to EC2 instances they create.
19. **Default VPC in Use**: Production workloads are deployed in the Default VPC with default security groups instead of a custom, segmented network architecture.
20. **No GuardDuty/Security Hub Enabled**: Core AWS threat detection services are completely disabled, leaving the SOC blind to cloud-native attacks.
