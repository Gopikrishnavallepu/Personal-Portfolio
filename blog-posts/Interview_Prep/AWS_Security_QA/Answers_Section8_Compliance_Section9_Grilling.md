# Section 8 — Compliance, Governance & BCDR (Q51–Q55) — Answers

---

## Q51. HIPAA Compliance on AWS — Architecture Review

**Answer:**

**BAA (Business Associate Agreement):**
- A **legal contract** between you (the Covered Entity or Business Associate) and AWS, establishing that AWS will handle PHI according to HIPAA requirements.
- **Must be signed** before putting ANY PHI on AWS. Without a BAA, using AWS for PHI is a HIPAA violation regardless of technical controls.
- Only **HIPAA-eligible services** are covered under the BAA. AWS maintains a published list (~100+ services including EC2, S3, RDS, Lambda, ECS, DynamoDB, KMS, CloudTrail, etc.).

**Ensuring PHI is only on eligible services:**
- Maintain an internal list of approved services (sync with AWS's HIPAA-eligible list).
- **SCP to block non-eligible services:**
```json
{
  "Effect": "Deny",
  "NotAction": [
    "ec2:*", "s3:*", "rds:*", "lambda:*", "ecs:*",
    "dynamodb:*", "kms:*", "cloudtrail:*", "guardduty:*",
    "config:*", "logs:*", "sns:*", "sqs:*"
  ],
  "Resource": "*"
}
```
- Use a **Service Control Policy allowlist approach** — only permit known HIPAA-eligible services.

**Technical safeguards demonstrated to auditors:**
| HIPAA Requirement | AWS Implementation |
|---|---|
| **Access Control** | IAM least privilege, MFA, RBAC, permission boundaries |
| **Audit Controls** | CloudTrail (all API calls), VPC Flow Logs, S3 access logs |
| **Integrity** | S3 Object Lock, CloudTrail log file integrity validation |
| **Transmission Security** | TLS 1.2+ everywhere, VPN/DX encryption |
| **Encryption at Rest** | KMS for all data stores (S3, EBS, RDS, DynamoDB) |
| **Person/Entity Auth** | Cognito or federated IdP with MFA |

**Administrative safeguards:** Security awareness training for all employees, documented incident response plan, regular risk assessments, workforce access procedures.

**Breach notification (60-day rule):**
- **Discover** the breach → clock starts.
- **60 calendar days** to notify affected individuals (written notification).
- If **500+ individuals** affected: notify HHS immediately and prominent media outlets in the state/jurisdiction.
- If **fewer than 500**: log and report to HHS annually.
- Document: what PHI was involved, who accessed it, how it was accessed, what was done to mitigate.

---

## Q52. PCI DSS Scope Reduction on AWS

**Answer:**

**Tokenization for scope reduction:**
- Use a **PCI-certified payment processor** (e.g., Stripe, Adyen) to handle raw card data.
- Your system only sees a **token** (e.g., `tok_1LqFm2eZvKYlo2CWhJLbU4Bb`) — not the actual card number.
- Since your systems **never see, store, or process** cardholder data, they're typically **out of PCI scope** or classified as **SAQ-A** (simplest compliance).
- **Key distinction:** If you control the payment page (even via iframe), you're still partially in scope.

**PCI DSS certified AWS services:**
- AWS itself is PCI DSS Level 1 Service Provider certified.
- All major services are covered: EC2, S3, RDS, VPC, IAM, KMS, CloudTrail, Lambda, ECS, EKS, etc.
- AWS being PCI-certified covers the **infrastructure layer** — you're still responsible for your **application and configuration** layer (shared responsibility model).

**CDE network segmentation:**
- Place CDE resources in **dedicated VPCs** or **dedicated subnets** with strict SGs and NACLs.
- CDE VPC has **no VPC peering** to non-CDE VPCs — use PrivateLink for necessary communication (no transitive access).
- **Separate AWS accounts** for CDE vs non-CDE is the strongest segmentation.
- Tag all CDE resources with `PCI-Scope: true` and enforce tagging via AWS Config.
- VPC Flow Logs on all CDE subnets — mandatory for PCI requirement 10 (logging & monitoring).

**Evidence for QSA assessment:**
| PCI DSS Requirement | Evidence Source |
|---|---|
| Req 1 (Firewalls) | SG rules, NACL rules, Network Firewall config, VPC architecture diagrams |
| Req 2 (Default passwords) | AMI hardening docs, CIS benchmark scan results |
| Req 3 (Protect stored data) | KMS key policies, S3/RDS encryption config |
| Req 4 (Encrypt transmission) | TLS configs, ACM certificates, ALB security policies |
| Req 7 (Restrict access) | IAM policies, RBAC design, least privilege proof |
| Req 8 (Identify users) | IAM user list, MFA enforcement, federation config |
| Req 10 (Logging) | CloudTrail config, Flow Logs, S3 access logs, SIEM dashboards |
| Req 11 (Regular testing) | Inspector scan results, penetration test reports |

---

## Q53. SOC 2 Continuous Compliance

**Answer:**

**AWS tools for evidence automation:**
- **AWS Config:** Continuous compliance checks — every rule evaluation is evidence (timestamped, resource-specific).
- **Security Hub:** Aggregated compliance scores against CIS, NIST — export findings as compliance evidence.
- **CloudTrail:** API call audit trail — proves who did what, when.
- **AWS Audit Manager:** Purpose-built for compliance evidence collection.

**AWS Audit Manager workflow:**
1. Select a **SOC 2 framework** (pre-built in Audit Manager).
2. Audit Manager automatically maps framework controls to AWS Config rules, CloudTrail events, and Security Hub findings.
3. Evidence is **continuously collected** — no manual screenshots needed.
4. Generate **assessment reports** for your auditor with all evidence attached.
5. Export the report as a PDF + evidence package for the auditor.

**SOC 2 Trust Service Criteria → AWS Controls:**

| TSC | Description | AWS Controls |
|---|---|---|
| **Security** | Protect against unauthorized access | IAM, SGs, NACLs, WAF, KMS encryption, GuardDuty |
| **Availability** | System availability as committed | Multi-AZ, Auto Scaling, Route 53 failover, BCDR plan |
| **Processing Integrity** | System processes data correctly | Input validation, Lambda DLQs, CloudWatch alarms on errors |
| **Confidentiality** | Protect confidential information | KMS encryption, S3 bucket policies, VPC endpoints, Macie |
| **Privacy** | PII is collected/used/retained properly | Macie for PII discovery, data retention policies, access controls |

---

## Q54. Business Continuity & Disaster Recovery (BCDR)

**Answer:**

**Multi-region DR architecture (RPO 15 min, RTO 1 hour):**

This requires a **Warm Standby** approach — active resources in the DR region, scaled down, ready to scale up.

**Component-by-component:**

| Component | DR Strategy | RPO Achieved | Details |
|---|---|---|---|
| **Aurora** | Global Database | ~1 sec (async replication) | Secondary cluster in DR region with read replicas. Promote in <1 min during failover |
| **ECS Fargate** | Pre-deployed, scaled down | N/A (stateless) | Task definitions, images in ECR (cross-region replicated). Scale up tasks during failover |
| **S3** | Cross-Region Replication | ~15 min | CRR with RTC (Replication Time Control) guarantees 15-min SLA |
| **Secrets/Config** | Multi-region replicas | ~1 min | Secrets Manager with multi-region secrets |

**Aurora Global Database for RPO:**
- Primary region writes → replication to secondary region with **<1 second lag** (typical ~100-200ms).
- During failover: promote secondary to primary in **<1 minute**.
- RPO achieved: ~1 second (far better than the 15-min requirement).
- **Caveat:** This is asynchronous replication — in an extreme disaster, you could lose up to 1 second of transactions.

**Automated failover with Route 53:**
1. **Route 53 health check** monitors the primary region's ALB endpoint.
2. **Failover routing policy:** Primary region = primary record, DR region = secondary record.
3. When health check fails → Route 53 automatically routes DNS to DR region endpoint.
4. **Automated scaling:** EventBridge rule (or Route 53 health check → SNS → Lambda) triggers:
   - Scale up ECS tasks in DR region to match production capacity.
   - Promote Aurora secondary to primary.
   - Update any region-specific configurations.

**Testing DR without impacting production:**
- **Tabletop exercises:** Walk through the failover runbook on paper with the team.
- **Planned failover tests:** During maintenance windows, perform actual failover → run production load in DR region → fail back.
- **AWS Fault Injection Simulator (FIS):** Inject controlled failures (AZ outage, instance termination) to test resilience.
- **Parallel testing:** Deploy synthetic traffic to the DR region independently — doesn't affect real production traffic.
- **GameDays:** Simulate realistic disaster scenarios with the entire team.

---

## Q55. AWS Organizations & Multi-Account Governance

**Answer:**

**OU structure design:**
```
Root
├── Security OU
│   ├── Security-Tooling Account (GuardDuty, Security Hub, Inspector delegated admin)
│   └── Log-Archive Account (centralized CloudTrail, Config, Flow Logs)
├── Infrastructure OU
│   └── Shared-Services Account (CI/CD, artifact repositories, internal tools)
├── Workloads OU
│   ├── Dev OU
│   │   └── Dev Account
│   ├── Staging OU
│   │   └── Staging Account
│   └── Prod OU
│       └── Prod Account
└── Sandbox OU
    └── Sandbox Account (experimentation, restrictive budget)
```

**SCPs per OU:**

| OU | SCP | Purpose |
|---|---|---|
| **Root (all accounts)** | Deny disabling CloudTrail, GuardDuty, Config | Baseline security |
| **Root** | Deny leaving the organization | Prevent account escape |
| **Root** | Deny non-approved regions | Restrict to us-east-1, us-west-2 |
| **Prod OU** | Deny creating IAM users (force federation) | No service accounts with long-lived keys |
| **Prod OU** | Deny `ec2:RunInstances` on unapproved instance types | Cost and security control |
| **Sandbox OU** | Deny expensive services (Redshift, SageMaker) | Budget control |
| **Sandbox OU** | Deny creating VPC peering/Transit Gateway attachments | Isolation |

**Centralized security tooling:**
- **GuardDuty:** Delegated admin in Security-Tooling account. Auto-enable on new member accounts.
- **Security Hub:** Delegated admin. Aggregate findings from all accounts and regions.
- **AWS Config:** Delegated admin. Deploy conformance packs across all accounts.
- **CloudTrail:** Organization Trail stored in Log-Archive account.
- **IAM Access Analyzer:** Organization-level analyzer in Security-Tooling account.

**Preventing accounts from leaving:**
```json
{
  "Effect": "Deny",
  "Action": "organizations:LeaveOrganization",
  "Resource": "*"
}
```
- This SCP prevents any member account from calling `LeaveOrganization`.
- **Note:** The management account can still remove member accounts using `RemoveAccountFromOrganization`. Restrict management account access to a very small number of highly trusted admins.

---

# Section 9 — Grilling / Deep-Dive Questions (Q56–Q65) — Answers

---

## Q56. Policy Evaluation Logic — Full Walk-Through

**Scenario:** User has identity policy (`s3:*`), permission boundary (`s3:GetObject`), bucket resource policy (`s3:PutObject`), and SCP (`s3:Get*`). Can user call `s3:PutObject`?

**Answer: NO.** Here's the step-by-step evaluation:

1. **SCP Check:** SCP allows only `s3:Get*`. `s3:PutObject` does NOT match → **SCP implicitly denies**. **Evaluation stops here — DENY.**

Even if SCP allowed it, let's continue the full logic for education:

2. **Resource-based policy:** Bucket policy grants `s3:PutObject` — this is relevant for cross-account but in same-account, the identity still needs permission.
3. **Permission boundary:** Only allows `s3:GetObject`. `s3:PutObject` is not in the boundary → **boundary denies.**
4. **Identity policy:** Allows `s3:*` including `s3:PutObject` → allows.
5. **Final:** For same-account access, the effective permission is the **intersection** of SCP ∩ Permission Boundary ∩ Identity Policy. Since SCP and permission boundary both exclude `s3:PutObject`, the action is **DENIED**.

**Key principle:** An action must be allowed at ALL levels: SCP + Permission Boundary + Identity Policy + Session Policy. Any one denying = denied.

---

## Q57. Assume Role Chaining

**Answer:**

**Can you chain AssumeRole?** Yes, but with limitations.
- Role A assumes Role B, then using Role B's credentials, assumes Role C. This is **allowed**.
- **Session duration:** Each `AssumeRole` in the chain **resets the session duration**. The chained session can have its own duration (up to Role C's max session duration).
- **Maximum chain length:** No hardcoded AWS limit, but each hop adds latency and complexity.

**Source identity:**
- **`sts:SetSourceIdentity`** — set in the first `AssumeRole` call and **propagated through the chain**. Subsequent roles in the chain **cannot change it**.
- Lets you trace back who originally initiated the chain (e.g., `jane.doe`) regardless of how many roles were assumed.
- Must be explicitly enabled in the trust policy of each role in the chain.

**CloudTrail audit:**
- Each `AssumeRole` call is a separate CloudTrail event.
- `AssumeRole` event includes: `assumedRoleArn`, `sourceIdentity`, `accessKeyId` of the new session, and the calling principal.
- To trace the full chain: follow the `accessKeyId` from each event → find the next `AssumeRole` event using those credentials.

---

## Q58. S3 Encryption Options — Deep Dive

**Answer:**

| Option | Key Management | When to Use | Cost |
|---|---|---|---|
| **SSE-S3** | AWS manages key entirely | Default, simplest. No key management overhead | Free |
| **SSE-KMS** | You control KMS CMK + key policy | Need audit trail of key usage, key rotation control, regulatory requirement | KMS API call cost ($0.03/10,000 requests) |
| **SSE-C** | You provide the key with every request | You want full key control without KMS. Key never stored by AWS | Free (but you manage keys) |
| **Client-side** | You encrypt before upload | End-to-end encryption, AWS never sees plaintext | Free (you manage everything) |

**SSE-KMS over SSE-S3 — when?**
- When you need to control WHO can decrypt (KMS key policy).
- When you need **CloudTrail logging** of every encrypt/decrypt (KMS logs all API calls).
- When compliance requires **customer-managed keys** with documented key rotation.
- When you need **cross-account access control** at the key level.

**SSE-C — when?**
- Highly regulated environments requiring that AWS never stores your key.
- You provide the encryption key as an HTTP header with each PUT/GET request.
- AWS uses the key, encrypts/decrypts, then **discards the key from memory**.
- **Risk:** If you lose the key, data is unrecoverable.

**KMS API cost at scale:**
- Each `PutObject` with SSE-KMS = 1 `GenerateDataKey` call.
- Each `GetObject` = 1 `Decrypt` call.
- At 1 million objects/day = 1M KMS calls = ~$3/day.
- **At massive scale:** Consider SSE-S3 for non-sensitive data, SSE-KMS only for sensitive data. Or use data key caching (see Q33).

**Bucket default encryption vs per-object:**
- Bucket default encryption applies **only when the PutObject request doesn't specify encryption**.
- If a PutObject explicitly specifies SSE-S3, it overrides the bucket default of SSE-KMS.
- To enforce SSE-KMS for all objects: add a **bucket policy condition** denying PutObject unless `s3:x-amz-server-side-encryption: aws:kms`.

---

## Q59. VPC Flow Log Parsing

**Log entry:** `2 123456789012 eni-abc123 203.0.113.5 10.0.1.50 443 49152 6 15 5000 1620140400 1620140460 REJECT OK`

**Answer — field-by-field:**

| Field | Value | Meaning |
|---|---|---|
| Version | `2` | Flow log format version 2 |
| Account ID | `123456789012` | AWS account |
| ENI | `eni-abc123` | Network interface receiving the traffic |
| Source IP | `203.0.113.5` | **External IP** (public documentation range) — traffic from the internet |
| Dest IP | `10.0.1.50` | Private IP of the instance |
| Src Port | `443` | Source port (HTTPS) |
| Dst Port | `49152` | Destination ephemeral port |
| Protocol | `6` | TCP |
| Packets | `15` | 15 packets in this flow |
| Bytes | `5000` | 5 KB transferred |
| Start | `1620140400` | Unix timestamp (May 4, 2021 16:00 UTC) |
| End | `1620140460` | 60-second window |
| **Action** | **`REJECT`** | **Traffic was BLOCKED** |
| Log Status | `OK` | Flow log captured successfully |

**Analysis:** An external IP (`203.0.113.5`) attempted to reach an instance on port 49152 (ephemeral) from source port 443. The traffic was **rejected** — either by a Security Group or NACL. This looks like a **return connection** from a web server (443 → ephemeral port), which was blocked.

**Action:** Investigate whether the instance should be communicating with `203.0.113.5`. If legitimate: check NACL outbound rules (stateless — may be blocking return traffic). If not legitimate: investigate the external IP for threat intelligence.

---

## Q60. GuardDuty Detector Internals

**Answer:**

**How GuardDuty consumes logs without separate enablement:**
- GuardDuty accesses **VPC Flow Logs, CloudTrail management events, and DNS query logs** from an **independent, internal data stream** — NOT from your configured Flow Logs or CloudTrail trails.
- AWS maintains a **separate, parallel copy** of these data sources for GuardDuty. You don't need to enable VPC Flow Logs or CloudTrail for GuardDuty to work — it has its own access.
- This means: (1) No cost impact on your Flow Logs/CloudTrail, (2) GuardDuty can't be blinded by disabling your trails, (3) No duplicate storage.

**Anomaly detection models:**
- **Baseline profiling:** GuardDuty learns normal behavior for each account over 7-14 days (API call patterns, network traffic patterns, DNS query patterns).
- **ML-based anomaly detection:** Detects deviations from baseline — unusual API calls, unusual regions, unusual instance behavior.
- **Threat intelligence feeds:** AWS internal feeds + third-party feeds (ProofPoint, CrowdStrike) for known malicious IPs, domains.
- **Rule-based detection:** Pattern matching for known attack signatures (cryptomining DNS, port scanning patterns).

---

## Q61. KMS Key Deletion Emergency

**Answer:**

**Day 6 (within waiting period):**
1. **Immediately cancel deletion:** `aws kms cancel-key-deletion --key-id <key-id>`
2. Key status changes from "Pending deletion" back to "Disabled."
3. **Re-enable the key:** `aws kms enable-key --key-id <key-id>`
4. All 500 EBS volumes and 50 RDS instances immediately work again.
5. **Post-incident:** Investigate who scheduled the deletion (CloudTrail `ScheduleKeyDeletion` event), add SCP to prevent future occurrences, set CloudWatch alarm on this API call.

**Day 8 (after deletion):**
- **The key is permanently gone.** AWS has cryptographically shredded the key material.
- **All 500 EBS volumes** become **unreadable** — any attempt to start the instances or read data will fail.
- **All 50 RDS instances** become **inaccessible** — you cannot start, snapshot, or read them.
- **Recovery options:**
  - If you **imported custom key material** (BYOK), you can reimport the same key material to a new CMK. This is the ONLY recovery path and only works for imported keys.
  - If it was **AWS-generated key material** (default) → **no recovery possible.** Data is permanently lost.
- **Lesson:** Enable a 30-day deletion window (maximum). Set up alerts on `ScheduleKeyDeletion`. Use SCPs to restrict who can schedule key deletions.

---

## Q62. CloudTrail Integrity & Tampering

**Answer:**

**Log file integrity validation:**
- CloudTrail creates **SHA-256 hash** of every log file.
- Every hour, CloudTrail creates a **digest file** containing: hashes of all log files delivered in that hour, the hash of the previous digest file (creating a chain), and a digital signature using AWS's private key.
- This creates a **cryptographic chain of integrity** — like a blockchain for your logs.

**Validation command:**
```bash
aws cloudtrail validate-logs --trail-arn arn:aws:cloudtrail:us-east-1:123456789012:trail/MyTrail \
  --start-time 2024-01-01T00:00:00Z --end-time 2024-01-31T23:59:59Z
```

**If an attacker modifies logs in S3:**
- The hash of the modified log file won't match the hash recorded in the digest file.
- `validate-logs` will report: `"INVALID: hash value doesn't match"`.
- If the attacker also modifies the digest file, the digital signature (signed by AWS's private key that the attacker doesn't have) won't validate.
- If the attacker deletes digest files, `validate-logs` reports missing digests.

**Additional protection:**
- Store logs in a **separate account** the attacker can't access.
- **S3 Object Lock (Compliance mode)** — even if attacker has access, they can't modify or delete.
- **MFA Delete** on the log bucket.

---

## Q63. Cross-Region Encrypted AMI Sharing

**Answer:**

**Can you directly share an encrypted AMI cross-region?** No — not directly. Here's the process:

1. **Copy the AMI to the target region:** `aws ec2 copy-image --source-image-id ami-xxx --source-region us-east-1 --region eu-west-1 --encrypted --kms-key-id <target-region-key>`
2. During copy, AWS **decrypts** with the source CMK (us-east-1), transfers the data, and **re-encrypts** with the destination CMK (eu-west-1).
3. The copying principal needs `kms:Decrypt` on the source key and `kms:CreateGrant` + `kms:Encrypt` on the destination key.

**For encrypted EBS snapshots:**
- Same process: `copy-snapshot` re-encrypts with a key in the destination region.
- Cannot share encrypted snapshots cross-account if encrypted with **AWS-managed key** (`aws/ebs`) — must use a **customer-managed CMK** and grant the target account access to the key.
- **Steps for cross-account:**
  1. Share the CMK with the target account (key policy).
  2. Share the snapshot with the target account.
  3. Target account copies the snapshot, re-encrypting with their own CMK.

---

## Q64. Security Group Limits & Scalability

**Answer:**

**Default limits:**
- 60 inbound + 60 outbound rules per SG.
- 5 SGs per ENI (can be increased to 16 via support request).
- Effective rules per ENI = 5 × 60 = 300.

**Architecture strategies for 500 microservices:**

1. **Reference Security Groups by ID, not by CIDR:** Instead of 500 CIDR rules, create one SG per service and reference the SG ID in rules. SG-to-SG references count as ONE rule regardless of how many instances are in the referenced SG.

2. **Managed Prefix Lists:** Group CIDRs into named prefix lists. One prefix list entry counts as ONE rule, even if it contains 100 CIDRs. Example: `pl-internal-services` containing all internal service CIDRs → one rule instead of 100.

3. **Shared Security Groups:** Instead of unique SGs per microservice, categorize services by role (web, app, db, monitoring) and share SGs across similar services.

4. **Hierarchical SG design:**
   - `base-sg` → applied to all instances (allow monitoring, management traffic)
   - `web-sg` → HTTP/HTTPS inbound
   - `app-sg` → app port from web-sg
   - `db-sg` → DB port from app-sg
   - Each instance gets 2-3 SGs instead of one massive SG.

5. **AWS Network Firewall or PrivateLink** for complex inter-service communication rules — offload from SGs.

---

## Q65. Real-Time Compliance Enforcement (< 1 min)

**Answer:**

**Architecture for sub-minute enforcement:**

```
EC2 CreateVolume API call
  → CloudTrail event (near real-time, 5-15 min delay)  ← TOO SLOW
  → EventBridge event (near real-time, seconds)         ← USE THIS

EventBridge Rule:
  Source: "aws.ec2"
  Detail-type: "AWS API Call via CloudTrail"
  Detail:
    eventName: "CreateVolume"

  → Lambda function:
    1. Describe the volume (check encryption status)
    2. If unencrypted:
       Option A: Delete the volume immediately
       Option B: Tag as "non-compliant", create encrypted copy, 
                 alert security team, delete original
    3. Log the action for audit
```

**Race conditions:**
- **Eventual consistency:** Between `CreateVolume` and the EventBridge event, there's a delay of **seconds**. During this window, the unencrypted volume exists.
- Someone could attach the volume and write data before the remediation Lambda runs.
- **Mitigation:** The Lambda should check if the volume is attached before deleting. If attached, tag for manual remediation and alert.

**Handling API eventual consistency:**
- `DescribeVolumes` may return stale data immediately after creation. Use **retries with exponential backoff**.
- Use `VolumeId` from the event directly instead of listing/describing.

**Better preventive approach (defense-in-depth):**
- **Account-level EBS encryption default:** Set `aws ec2 enable-ebs-encryption-by-default` — ALL new volumes are automatically encrypted. No Lambda needed.
- **SCP:** Deny `ec2:CreateVolume` without encryption:
```json
{
  "Effect": "Deny",
  "Action": "ec2:CreateVolume",
  "Resource": "*",
  "Condition": {
    "Bool": { "ec2:Encrypted": "false" }
  }
}
```
- The EventBridge + Lambda approach is a **detective/reactive control** — the SCP is the **preventive control**. Use both for defense-in-depth.

---

# Bonus — Behavioral & Situational (Q66–Q70) — Answers

---

## Q66. Pushing Back on Developers

**Answer:**

**Approach — lead with empathy and business risk, not rules:**

1. **Acknowledge their goal:** "I understand you want quick access — deploying in production should be fast."
2. **Explain the risk in business terms:** "Hardcoded access keys in PCI-scoped applications mean if anyone gets access to your source code, they have production access to cardholder data. That's a PCI DSS violation that could result in fines up to $500K/month and loss of card processing ability."
3. **Propose a better solution that's EQUALLY simple:**
   - "Let me set up an IAM role for your application — it does the same thing, but credentials rotate automatically every hour, and there's zero code change needed if you're running on EC2/ECS/Lambda."
   - "I'll create the role and update your deployment config. It will take 30 minutes of my time, and your code gets simpler — remove the hardcoded keys entirely."
4. **Make it easy:** Do the work for them. Create the role, update the trust policy, test it, and hand them a working solution.
5. **Escalate if needed:** If they refuse, document the risk and escalate to their manager and CISO. Reference PCI DSS Requirement 2.3 and 8.2 (no shared/hardcoded credentials).

---

## Q67. Prioritizing Security Findings

**Answer:**

**Prioritization (highest to lowest):**

| Priority | Finding | Rationale | SLA |
|---|---|---|---|
| **P1 (Critical)** | S3 bucket with PHI publicly accessible | Active data exposure of protected health data. Potential HIPAA breach. | Remediate NOW (within minutes) |
| **P2 (High)** | Root account used over the weekend | Potential compromise of highest-privilege account. Need to investigate intent. | Investigate within 1 hour |
| **P3 (High)** | SGs allowing 0.0.0.0/0 on RDP (3389) | Active attack vector (RDP brute force), but requires exploitation. | Remediate within 4 hours |
| **P4 (Medium)** | 20 EC2 instances missing patches | Vulnerability, but requires additional exploitation. Not immediately active. | Patch within 7 days (or next maintenance window) |

**Rationale:**
- **S3 PHI exposure** is the only finding with **active, confirmed data exposure**. Every minute it's public, data could be exfiltrated. HIPAA breach notification clock may have already started.
- **Root account usage** could be legitimate (admin) or a compromise — requires immediate investigation to determine scope.
- **Open RDP** is a known attack vector but requires an attacker to find and exploit it — serious but less immediately impactful than already-exposed data.
- **Missing patches** are a vulnerability, not an active exploit — can be scheduled.

---

## Q68. Security vs Speed Trade-off

**Answer:**

**The answer is never "skip security review entirely," but also never "block the launch indefinitely."**

1. **Negotiate scope:** "A full security review takes 5 days, but I can do a **focused, high-priority review in 4 hours** covering the critical areas: IAM permissions, input validation, encryption, and data handling."
2. **Risk-based approach:** Assess the Lambda — does it handle payment data directly? If yes, the review is non-negotiable (PCI compliance). If it's a supporting function (e.g., notification service), a lightweight review may suffice.
3. **Accelerated review checklist (4 hours):**
   - IAM role permissions (least privilege?)
   - Input validation (event injection?)
   - Secrets handling (no hardcoded keys?)
   - Encryption (data at rest/transit?)
   - Logging enabled?
   - VPC placement (if accessing sensitive data)?
4. **Conditional approval:** "I'll approve for launch with these conditions: (1) full security review within 2 weeks post-launch, (2) enhanced monitoring (GuardDuty, CloudWatch) on the function during interim, (3) the team commits to remediating any findings from the full review."
5. **Document the decision:** Send an email to the engineering lead and CISO: "Approved accelerated security review for [function] due to [deadline]. Full review scheduled for [date]. Residual risk accepted by [stakeholder]."

---

## Q69. Incident Response — Active Compromise

**Answer:**

**Phase 1 — Detection & Alerting (0-15 min):**
- GuardDuty finding → EventBridge → PagerDuty → Security team paged.
- Acknowledge the alert and begin investigation.
- **Do NOT panic-terminate the instance** — you'll lose forensic evidence.

**Phase 2 — Containment (15-60 min):**
1. **Network isolation:** Change the instance's SG to a **quarantine SG** (deny all inbound/outbound except security team CIDR on SSM port).
2. **Preserve evidence:**
   - Create EBS snapshot of all volumes (forensic image).
   - Enable VPC Flow Logs at maximum granularity on the ENI (if not already).
   - Capture memory dump if possible (SSM run command).
3. **Credential compromise:** If instance role may have been compromised:
   - Revoke IAM sessions (inline deny policy with `DateLessThan` condition).
   - Check CloudTrail for any actions taken with the instance's credentials.
4. **Assess blast radius:** Did the attacker move laterally? Check CloudTrail for `AssumeRole`, `RunInstances`, IAM changes.

**Phase 3 — Eradication (1-4 hours):**
- Analyze the compromised instance (forensic analysis of EBS snapshot — mount to a clean forensic instance).
- Identify the attack vector (SSH brute force → weak/exposed key? Unpatched vulnerability?).
- Remove attacker's persistence mechanisms (new SSH keys, cron jobs, new IAM users/keys).
- Patch the vulnerability or rotate the compromised credential.

**Phase 4 — Recovery (4-8 hours):**
- Launch a new, clean instance from a known-good AMI.
- Restore data from backup (verified clean).
- Update security controls (SG rules, patch baseline, SSH key rotation).
- Gradually restore connectivity.

**Phase 5 — Post-Mortem (within 48 hours):**
- **Timeline:** Document exactly what happened, when, and how.
- **Root cause:** Why did the brute force succeed? (Weak password, port 22 open to 0.0.0.0/0, no fail2ban).
- **Lessons learned:** What controls failed? What new controls are needed?
- **HIPAA breach assessment:** Was PHI accessed? If yes, trigger breach notification process (60-day window).
- **Improvements:** Enforce SSM Session Manager (eliminate SSH), IMDSv2, Inspector continuous scanning, and auto-remediation for open SGs.

---

## Q70. Mentoring & Security Culture

**Answer:**

**Diagnosis:** Developers bypass controls because security is perceived as a **blocker**, not a **feature**. The goal is to change this perception.

**Strategic initiatives:**

1. **"Security Champions" program:**
   - Identify 1 security champion per dev team (volunteer or nominated).
   - Train them in secure coding, threat modeling, and AWS security.
   - They become the first point of contact for security questions — faster than going through the security team.
   - Give them recognition, bonus, career progression incentives.

2. **Make security self-service:**
   - Build **Terraform modules** with security baked in (encrypted S3 module, hardened VPC module). Developers use modules and get security for free.
   - Create **AWS Service Catalog** portfolios — pre-approved, secure infrastructure products that developers can self-provision.
   - Build a **security scanning dashboard** (Security Hub) that teams can check themselves.

3. **Shift-left — integrate security into CI/CD:**
   - Pre-commit hooks (tfsec, Checkov) — developers see security issues at `git commit`, not during review.
   - Automated PR comments from security scanners — immediate feedback.
   - **Gamify:** Publish "security scorecard" per team — teams with zero critical findings get recognition.

4. **Threat modeling workshops:**
   - Quarterly threat modeling sessions for each product team.
   - Use STRIDE methodology — developers learn to think like attackers.
   - Output: actionable security stories in the team's backlog.

5. **AWS-specific tools for enablement:**
   - **AWS Well-Architected Tool** — run security pillar reviews with teams.
   - **GuardDuty finding walkthroughs** — show teams real findings from their accounts. "This is what an attacker looks like in YOUR environment."
   - **IAM Access Analyzer** — show developers their over-permissioned roles with data. "Your Lambda can delete the production database — is that intended?"

6. **Blameless security incident reviews:**
   - When a developer introduces a security issue, treat it as a learning opportunity, not a punishment.
   - Focus on "how do we prevent this class of issue" rather than "who caused this."
