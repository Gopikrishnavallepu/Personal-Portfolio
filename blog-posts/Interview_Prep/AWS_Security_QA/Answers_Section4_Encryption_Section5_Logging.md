# Section 4 — Encryption & KMS (Q28–Q33) — Answers

---

## Q28. KMS Key Policy vs IAM Policy

**Answer:**

**Key policy + IAM policy interaction:**
- KMS is unique: the **key policy is the primary access control**. Unlike most AWS services, IAM policies alone are NOT sufficient — the key policy must explicitly allow the account to use IAM policies for the key (via the "root" statement).
- For **cross-account access**, you need BOTH:
  1. **Key policy** in Account-B: Allow Account-A's role to use the key.
  2. **IAM policy** in Account-A: Allow the developer's role to call KMS actions on the key ARN in Account-B.

**KMS Grants vs Key Policies:**
| Feature | Key Policy | Grant |
|---|---|---|
| **Scope** | Attached directly to the key | Programmatically issued token |
| **Use case** | Long-term, static permissions | Temporary, delegated access |
| **Example** | Account-level or role-level access | AWS services creating encrypted resources (EBS, RDS) |
| **Revocation** | Edit the key policy | `RetireGrant` or `RevokeGrant` |
- AWS services (like EBS, RDS) use **grants** under the hood when they need to use a CMK — you'll see `CreateGrant` calls in CloudTrail.

**Key KMS actions explained:**
| Action | Purpose |
|---|---|
| `kms:Encrypt` | Encrypt data directly (up to 4 KB) |
| `kms:Decrypt` | Decrypt ciphertext |
| `kms:GenerateDataKey` | Generate a unique data key for envelope encryption — returns both plaintext and encrypted copies |
| `kms:GenerateDataKeyWithoutPlaintext` | Same but without the plaintext copy (for later use) |
| `kms:CreateGrant` | Delegate key usage to an AWS service or principal |
| `kms:ReEncryptFrom/To` | Re-encrypt data under a different key without exposing plaintext |

---

## Q29. Encryption at Rest & In Transit (HIPAA-Compliant)

**Answer:**

**Encryption at rest:**

| Component | Encryption Method | Details |
|---|---|---|
| **ECS Fargate (ephemeral storage)** | AES-256 by default (since 2020), or specify KMS CMK for platform version 1.4.0+ | Managed by AWS, no config needed, but use CMK for audit/control |
| **EFS (if used by Fargate)** | SSE-KMS or SSE-EFS | Enable encryption at file system creation, specify CMK |
| **RDS Aurora** | SSE-KMS | Enable at cluster creation, specify CMK. Cannot enable after creation on existing instances |
| **S3** | SSE-KMS (recommended) or SSE-S3 | Set default bucket encryption to SSE-KMS with your CMK |
| **EBS** | AES-256 via KMS | Account-level setting: enable "EBS encryption by default" so all new volumes are encrypted |

**Encryption in transit:**

| Path | Enforcement |
|---|---|
| **Client → ALB** | ACM-issued TLS certificate on ALB. Set TLS 1.2 minimum via security policy (`ELBSecurityPolicy-TLS-1-2-2017-01`) |
| **ALB → ECS** | Configure ALB target group for HTTPS (port 443). ECS task uses a self-signed cert or ACM Private CA cert |
| **ECS → RDS** | RDS Aurora enforces SSL: set `rds.force_ssl = 1` parameter. Application connection string must include `sslmode=verify-full` with the RDS CA certificate |
| **ECS → S3** | Use HTTPS endpoint (default). Add bucket policy condition: `"aws:SecureTransport": "true"` to deny HTTP |

**TLS certificate management:**
- **Public-facing (ALB):** AWS Certificate Manager (ACM) — free, auto-renewal.
- **Internal (ECS ↔ RDS, service-to-service):** **ACM Private CA** — create a private CA, issue internal certificates. Costs $400/month per CA but essential for mTLS in healthcare.

**KMS key accidental deletion:**
- KMS keys have a **mandatory waiting period** of 7-30 days (you choose) before deletion.
- During the waiting period, the key is in "Pending deletion" state — **all encrypt/decrypt operations fail**.
- **Recovery:** Cancel the scheduled deletion within the waiting period: `aws kms cancel-key-deletion --key-id <key-id>`.
- **After deletion:** The key is gone forever. You **cannot recover** the key or any data encrypted with it. EBS volumes, RDS databases, S3 objects — all become permanently inaccessible.
- **Prevention:** SCP denying `kms:ScheduleKeyDeletion` for all non-admin roles. CloudWatch alarm on the API call.

---

## Q30. KMS Key Rotation

**Answer:**

**Automatic rotation:**
- AWS creates new cryptographic material **annually** (365 days).
- The key ID, key ARN, and alias **don't change** — completely transparent to applications.
- **Old key material is preserved indefinitely** so existing ciphertext can still be decrypted.
- Newly encrypted data uses the **new key material**. Existing data is NOT re-encrypted — this is important.
- Automatic rotation only works for **symmetric CMKs**, not asymmetric or HMAC keys.

**Automatic vs Manual rotation:**
| | Automatic | Manual |
|---|---|---|
| **Frequency** | Annual (fixed) | Any schedule |
| **Key ID changes** | No | Yes (new key, new ARN) |
| **Old data** | Auto-decrypted (old material preserved) | Must update references or use aliases |
| **Effort** | Zero | High (update all references) |
| **Compliance** | May not satisfy "rotate annually" literal requirement | Full control |

**Rotating keys without downtime:**
- **EBS:** Automatic rotation is transparent — existing volumes continue to work. New volumes use new material. To re-encrypt existing volumes: create a snapshot → copy with new key → create new volume.
- **RDS:** Cannot change the KMS key on an existing instance. To rotate: create an encrypted snapshot → restore the snapshot specifying the new key → switch traffic to the new instance.
- **S3:** Automatic rotation handles new `PutObject` calls. For existing objects, use **S3 Batch Operations** to copy objects in-place, which re-encrypts with the new key material.

---

## Q31. Envelope Encryption Deep Dive

**Answer:**

**Step-by-step for a 10 GB S3 file (SSE-KMS):**

1. S3 calls KMS `GenerateDataKey` with your CMK → KMS returns TWO copies of a **unique data key**:
   - **Plaintext data key** (256-bit symmetric key)
   - **Encrypted data key** (the same key, encrypted under your CMK)

2. S3 uses the **plaintext data key** to encrypt the 10 GB file using AES-256-GCM.

3. S3 **discards the plaintext data key from memory** immediately after encryption.

4. S3 **stores the encrypted data key alongside the encrypted file** as object metadata.

5. **Decryption:** S3 retrieves the encrypted data key from metadata → calls KMS `Decrypt` → gets the plaintext data key → decrypts the file → discards the plaintext key.

**Why not encrypt directly with the CMK?**
- KMS `Encrypt` API has a **4 KB limit** — you physically cannot send 10 GB to KMS for encryption.
- KMS operations are **network calls** to the KMS service — encrypting 10 GB directly would be incredibly slow.
- Data encryption happens **locally** (within S3's infrastructure) using the data key, which is fast (AES hardware acceleration).
- KMS only handles the small **key encryption/decryption** operations.

**How envelope encryption solves the 4 KB limit:**
- The data key IS less than 4 KB (256 bits = 32 bytes), so it fits within the KMS `Encrypt`/`Decrypt` size limit.
- The actual data (10 GB) is encrypted locally using that data key with efficient symmetric encryption (AES).
- This is called "envelope" encryption because the data key is "enveloped" (wrapped) by the CMK.

---

## Q32. CloudHSM vs KMS

**Answer:**

**FIPS 140-2 Levels:**
| Service | FIPS 140-2 Level | Details |
|---|---|---|
| **KMS** | Level 2 (standard) / Level 3 (some regions) | AWS manages the HSMs. Most regions are Level 3 as of 2023 |
| **CloudHSM** | Level 3 (always) | Customer-managed, dedicated HSMs |

**PCI DSS answer:** Modern KMS IS validated to FIPS 140-2 Level 3 in most regions. However, if your compliance team or QSA specifically requires **customer-controlled, dedicated HSMs**, then CloudHSM is the answer.

**When to use CloudHSM:**
- Regulatory requirement for **dedicated, single-tenant HSMs** (not shared infrastructure).
- Need for **custom key store** — full control over key generation, storage, and lifecycle.
- Require **PKCS#11, JCE, or CNG** interfaces for application-level crypto.
- Need to perform non-AWS crypto operations (code signing, custom TLS offloading, Oracle TDE).
- Requirements to generate keys in a way that AWS never has access to the plaintext key material.

**CloudHSM + KMS integration (Custom Key Store):**
- Create a **KMS Custom Key Store** backed by a CloudHSM cluster.
- KMS CMKs are stored in YOUR CloudHSM cluster instead of AWS-managed HSMs.
- Applications use standard KMS APIs, but the actual cryptographic operations happen in your CloudHSM.
- **Best of both worlds:** KMS API simplicity + CloudHSM security assurance.
- **Trade-off:** Higher cost ($1.60/hr per HSM, minimum 2 for HA = ~$2,300/month), higher operational complexity.

---

## Q33. Data Key Caching & Performance

**Answer:**

**KMS request quotas:**
- Default: **5,500 requests/second** for symmetric CMKs per region (shared across `Encrypt`, `Decrypt`, `GenerateDataKey`).
- Can be increased via service quota request, but there are practical limits.
- Each Lambda invocation calling `kms:Decrypt` = 1 KMS API call. 1,000 concurrent Lambdas = 1,000 requests/second.

**AWS Encryption SDK data key caching:**
```python
import aws_encryption_sdk
from aws_encryption_sdk.caches import LocalCryptoMaterialsCache

cache = LocalCryptoMaterialsCache(capacity=100)
caching_cmm = CachingCryptoMaterialsManager(
    master_key_provider=kms_key_provider,
    cache=cache,
    max_age=300.0,          # Cache keys for 5 minutes
    max_messages_encrypted=1000,  # Re-use key for up to 1000 messages
    max_bytes_encrypted=10000000  # Re-use key for up to 10 MB
)
```
- Instead of calling KMS `GenerateDataKey` for every encrypt operation, the SDK **caches the data key** locally and reuses it for multiple operations.
- Dramatically reduces KMS API calls — from 1000/sec to perhaps 10/sec.

**Security trade-offs:**
| Pro | Con |
|---|---|
| Reduces KMS API calls and latency | Same data key encrypts multiple messages — if compromised, more data is exposed |
| Avoids throttling errors | Cached plaintext key in memory — memory dump attack vector |
| Lower cost (fewer KMS calls) | Stale key if CMK is rotated or revoked — cached key still works |

**Mitigations:**
- Set aggressive `max_age` (short cache duration, e.g., 5 minutes).
- Set `max_messages_encrypted` to limit blast radius.
- Set `max_bytes_encrypted` to limit total data exposure.
- Use **Lambda reserved concurrency** to limit the number of concurrent caches.

---

# Section 5 — Logging, Monitoring & Detection (Q34–Q40) — Answers

---

## Q34. CloudTrail Multi-Account Configuration

**Answer:**

**Organization Trail setup:**
1. In the **management account**, create a trail with "Enable for all accounts in my organization" = Yes.
2. Specify an S3 bucket in a dedicated **logging account** (not the management account).
3. Enable **multi-region trail** to capture API calls in all regions.
4. Enable **CloudTrail Insights** for anomaly detection on write APIs.

**Protecting the logging bucket:**
- Logging bucket is in a **separate, locked-down account** with no general access.
- **S3 bucket policy:** Only CloudTrail service principal can write. Deny delete for all principals.
- **S3 Object Lock (Compliance mode):** 7-year retention — nobody can delete.
- **MFA Delete** enabled on the bucket.
- **S3 Block Public Access** at account level.
- **Cross-region replication** to a third account for redundancy.

**Preventing CloudTrail disable:**
- **SCP at Organization level:**
```json
{
  "Effect": "Deny",
  "Action": [
    "cloudtrail:StopLogging",
    "cloudtrail:DeleteTrail",
    "cloudtrail:UpdateTrail",
    "cloudtrail:PutEventSelectors"
  ],
  "Resource": "*"
}
```
- This prevents anyone in any member account from stopping or modifying CloudTrail.

**Management vs Data events:**
| Type | Examples | Cost |
|---|---|---|
| **Management events** | `RunInstances`, `CreateBucket`, `AttachRolePolicy` | Free (first trail) |
| **Data events** | `s3:GetObject`, `s3:PutObject`, `lambda:Invoke` | ~$0.10 per 100,000 events |
- Data events are critical for PHI/PCI audit trails but can be expensive. Enable selectively on sensitive buckets/functions.

---

## Q35. GuardDuty Finding Triage

**Answer:**

**`UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS` meaning:**
- EC2 instance credentials (from the instance metadata service) are being used from an **IP address outside AWS**. This means someone copied the temporary credentials from the instance and is using them from a non-AWS location — strong indicator of compromise.

**Triage process:**
1. **Identify the instance:** Finding includes the instance ID, IAM role ARN, and the external IP using the credentials.
2. **Check CloudTrail:** Search for all API calls using the session credential (look for `userIdentity.type: AssumedRole` matching the instance role, from the external IP).
3. **Assess damage:** What actions were performed? Data access, IAM changes, resource creation?
4. **Isolate the instance:**
   - Replace the instance's Security Group with a **quarantine SG** (deny all inbound/outbound except forensic access).
   - **Do NOT terminate** — preserve for forensics.
5. **Revoke the credential:** Modify the IAM role to add a deny-all policy with a `DateLessThan` condition on `aws:TokenIssueTime` to invalidate all current sessions.
6. **Investigate how credentials were exfiltrated:** Was IMDS v1 used (SSRF attack)? Was there a vulnerability in the application?

**Automated response with EventBridge → Lambda:**
```
EventBridge Rule:
  Source: "aws.guardduty"
  Detail-type: "GuardDuty Finding"
  Detail:
    type: ["UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS"]

→ Lambda function:
  1. Extract instance ID from finding
  2. Swap SG to quarantine SG
  3. Snapshot EBS volumes for forensics
  4. Notify security team via SNS
  5. Create JIRA/ServiceNow incident ticket
```

---

## Q36. Security Hub & Custom Standards

**Answer:**

**Setup with multiple standards:**
- Enable Security Hub in the delegated admin account.
- Turn on compliance standards: **CIS AWS Foundations Benchmark v1.4**, **AWS Foundational Security Best Practices**, **PCI DSS**, **NIST 800-53**.
- Each standard generates findings mapped to specific controls. A single resource can have findings across multiple standards.

**Custom insights:**
- Security Hub **insights** are saved filters for findings. Create custom insights:
  - "All CRITICAL findings in production accounts"
  - "All failed PCI DSS controls in the payments OU"
  - "Resources with most failed controls (top 10)"

**Custom controls:**
- Use **AWS Config custom rules** (Lambda-backed) for organization-specific checks.
- Security Hub automatically imports Config rule evaluation results as findings.
- Example custom rule: "All RDS instances must have `deletion_protection` enabled in production."

**Multi-account, multi-region aggregation:**
- Designate an **aggregation region** (e.g., `us-east-1`).
- Enable **cross-region aggregation** — findings from all regions flow to the aggregation region.
- Use **delegated admin** to aggregate findings from all member accounts.
- Result: Single-pane-of-glass view across all accounts and regions.

---

## Q37. CloudWatch Alarms for Security Events

**Answer:**

**Metric filters for each event (on the CloudTrail log group):**

**1. Root account usage:**
```
{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }
```

**2. Unauthorized API calls:**
```
{ ($.errorCode = "*UnauthorizedAccess") || ($.errorCode = "AccessDenied*") }
```

**3. Security Group changes:**
```
{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }
```

**4. S3 bucket policy changes:**
```
{ ($.eventName = PutBucketPolicy) || ($.eventName = PutBucketAcl) || ($.eventName = PutBucketCors) || ($.eventName = PutBucketLifecycle) || ($.eventName = PutBucketReplication) || ($.eventName = DeleteBucketPolicy) }
```

**SNS notification workflow:**
- Each metric filter → CloudWatch Alarm (threshold ≥ 1 in 5 minutes) → SNS Topic → Security team email + PagerDuty + Slack.
- For critical alerts (root usage, SG changes): immediate PagerDuty page.
- For informational (unauthorized API calls): batch into daily digest.

**CIS Benchmark alignment:** These filters directly map to CIS AWS Foundations Benchmark v1.4 controls 4.1-4.15. Implementing all CIS-recommended metric filters is a common Security Hub compliance requirement.

---

## Q38. SIEM Integration (Splunk)

**Answer:**

**Architecture per log source:**

| Log Source | Delivery Path | Details |
|---|---|---|
| **CloudTrail** | S3 → SQS → Splunk Add-on for AWS | CloudTrail delivers JSON to S3; Splunk polls SQS notifications |
| **VPC Flow Logs** | CloudWatch Logs → Kinesis Firehose → Splunk HEC | Near real-time; Firehose handles buffering/batching |
| **GuardDuty** | EventBridge → Kinesis Firehose → Splunk HEC | Event-driven, low latency |
| **WAF Logs** | Kinesis Firehose → Splunk HEC | WAF natively supports Firehose delivery |
| **Config** | SNS → SQS → Splunk Add-on | Config change notifications |

**Push (Firehose → HEC) vs Pull (SQS → Add-on):**
| | Push (Firehose → HEC) | Pull (Splunk Add-on → SQS/S3) |
|---|---|---|
| **Latency** | Near real-time (60 sec buffer) | 5-10 minute polling intervals |
| **Reliability** | Firehose handles retries, backup to S3 | Splunk manages polling |
| **Cost** | Firehose data processing fees | SQS (cheap) + S3 GET requests |
| **Best for** | High-volume, real-time (Flow Logs, WAF) | Lower-volume, batch OK (CloudTrail, Config) |

**Cost at scale:**
- VPC Flow Logs are the highest volume — enable selectively (reject-only, or specific ENIs).
- Use **Firehose data transformation** Lambda to filter/enrich before delivery — reduce Splunk ingestion volume.
- Apply **Splunk index-time filters** to drop noise.
- Consider **S3-based ingestion** for historical/cold data (cheaper than real-time).

---

## Q39. Detecting Cryptomining

**Answer:**

**GuardDuty detection:**
- GuardDuty monitors **DNS queries** from EC2 instances. It maintains a database of known cryptocurrency mining pool domains.
- `CryptoCurrency:EC2/BitcoinTool.B!DNS` = the instance is making DNS queries to known Bitcoin mining pool domains.
- GuardDuty also detects via **VPC Flow Logs** — unusual outbound traffic patterns to mining pool IPs.

**Immediate containment:**
1. **Identify the instance** from the GuardDuty finding.
2. **Isolate** — swap Security Group to quarantine SG (block all outbound).
3. **Snapshot the EBS volume** for forensic analysis.
4. **Stop the instance** (not terminate — preserve evidence).
5. **Investigate:**
   - How was the instance compromised? (Check for exposed SSH keys, vulnerable applications, SSRF).
   - Was it a compromised application or a malicious insider who launched mining software?
   - Check CloudTrail for `RunInstances` — was this an unauthorized instance?

**Prevention:**
- **SCP restricting instance types:** Deny `ec2:RunInstances` for GPU instances (p3, p4, g4 families) and large compute instances unless approved.
- **AWS Config rule** for approved instance types in each account.
- **Cost anomaly detection** (AWS Cost Anomaly Detection) with tight thresholds.
- **Spot Instance limits** — set account-level limits on spot instances.
- **IMDSv2 enforcement** — prevents SSRF-based credential theft that often leads to cryptomining.
- **Inspector** for vulnerability scanning to catch the entry point.

---

## Q40. Config Rules for Continuous Compliance

**Answer:**

**AWS Config managed rules for each requirement:**

| Requirement | Config Rule | Rule Identifier |
|---|---|---|
| All EBS encrypted | `encrypted-volumes` | ENCRYPTED_VOLUMES |
| All S3 versioned | `s3-bucket-versioning-enabled` | S3_BUCKET_VERSIONING_ENABLED |
| All RDS Multi-AZ | `rds-multi-az-support` | RDS_MULTI_AZ_SUPPORT |
| No SG `0.0.0.0/0` on port 22 | `restricted-ssh` | INCOMING_SSH_DISABLED |

**Auto-remediation with SSM:**
1. **Config Rule** detects non-compliant resource.
2. Config triggers a **remediation action** — an **SSM Automation document**.
3. Example for unencrypted EBS: SSM document creates an encrypted snapshot, creates a new encrypted volume, detaches old volume, attaches new encrypted volume.
4. Example for open SSH SG: SSM document calls `ec2:RevokeSecurityGroupIngress` to remove the `0.0.0.0/0:22` rule.

**Conformance packs vs individual rules:**
| | Individual Rules | Conformance Packs |
|---|---|---|
| **Scope** | Single rule | Bundle of rules (10-100+) |
| **Deployment** | One at a time | Deploy all at once via YAML template |
| **Use case** | Custom, specific checks | Compliance frameworks (CIS, PCI, HIPAA) |
| **Cross-account** | Manual per account | Deploy via Organizations (delegated admin) |
| **Example** | `restricted-ssh` | `Operational-Best-Practices-for-HIPAA-Security` |

**Best practice:** Use **conformance packs** for baseline compliance (HIPAA, PCI), then add **individual custom rules** for organization-specific requirements.
