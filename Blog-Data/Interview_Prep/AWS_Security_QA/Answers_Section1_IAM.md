# Section 1 — IAM & Permission Controls (Q1–Q10) — Answers

---

## Q1. Cross-Account S3 Access Gone Wrong

**Scenario:** A developer from Account-A needs read-only access to an S3 bucket in Account-B that stores PHI. They propose adding a bucket policy with `"Principal": "*"` and restricting by source IP.

**Answer:**

**Why this is dangerous:**
- `"Principal": "*"` means **any AWS principal in the world** can access the bucket — it's essentially public. IP-based restriction is a weak compensating control because:
  - IPs can be spoofed or change (especially in cloud environments).
  - If the IP condition is misconfigured even slightly, PHI is exposed.
  - It violates the principle of least privilege and HIPAA access controls.

**Secure cross-account pattern:**
1. **In Account-B**, create an IAM role (`CrossAccountS3ReadRole`) with a trust policy allowing only Account-A's specific role/principal to assume it:
```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::ACCOUNT-A-ID:role/DevRole" },
  "Action": "sts:AssumeRole",
  "Condition": { "StringEquals": { "sts:ExternalId": "unique-external-id" } }
}
```
2. Attach a **permission policy** granting only `s3:GetObject` on the specific bucket/prefix.
3. In Account-A, grant the developer's role permission to `sts:AssumeRole` on the Account-B role.
4. Use **S3 bucket policy** to restrict access to the specific role ARN, not `*`.

**Auditability for HIPAA:**
- Enable **CloudTrail data events** on the S3 bucket to log every `GetObject` call.
- Enable **S3 server access logging** as a secondary log source.
- Use **CloudWatch/EventBridge** to alert on unusual access patterns.
- Store all logs in a **separate, locked-down logging account** with Object Lock.

---

## Q2. Over-Permissioned Lambda Execution Role

**Scenario:** A Lambda function has `AdministratorAccess` but only needs DynamoDB read and CloudWatch log write.

**Answer:**

**Risk:** If the Lambda function is compromised (e.g., via event injection, dependency vulnerability), the attacker gains **full admin access** to the entire AWS account — they can create IAM users, exfiltrate data, delete resources, or pivot to other accounts.

**Minimal IAM policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/MyFunction:*"
    }
  ]
}
```

**Detecting over-permissioned roles at scale:**
- **IAM Access Analyzer** — use the "policy generation" feature that analyzes CloudTrail to generate least-privilege policies based on **actual usage** over 90 days.
- **AWS Config rule** `iam-policy-no-statements-with-admin-access` flags any role with `*:*` permissions.
- **Custom Config/Lambda rule** that scans all Lambda execution roles and compares attached policies against a baseline.
- **Third-party tools** like Prowler, CloudSploit, or Prisma Cloud can audit this continuously.

---

## Q3. Leaked IAM Access Keys

**Scenario:** GuardDuty alerts that IAM access keys are being used from an unfamiliar IP in a different geography.

**Answer:**

**Immediate incident response steps (in order):**
1. **Don't delete the keys yet** — first, identify the key and associated user/role.
2. **Disable the access keys** via IAM console/CLI: `aws iam update-access-key --status Inactive`
3. **Check CloudTrail** for all API calls made by those keys in the last 24-72 hours:
   - Filter by `userIdentity.accessKeyId`
   - Look for: new IAM users created, S3 data exfiltration, EC2 instances launched, security group changes.
4. **Revoke any active sessions** by adding an inline deny policy with a date condition: deny all actions where `aws:TokenIssueTime` is before the current time.
5. **Rotate the credentials** — generate new keys if the service account still needs them.

**Determining blast radius:**
- Query CloudTrail for all actions taken by the compromised credentials.
- Check if new resources were created (EC2 instances, IAM users, access keys).
- Check S3 data access logs for any data downloads.
- Review any IAM policy changes or privilege escalation attempts.
- Check for Lambda functions or CloudFormation stacks created (persistence mechanisms).

**Preventive controls:**
- **Eliminate long-lived access keys** — use IAM roles with temporary credentials (STS) everywhere possible.
- **Enable GuardDuty** across all accounts (it detected this!).
- **SCPs** to deny `iam:CreateAccessKey` except for authorized automation roles.
- **AWS Config rule** `access-keys-rotated` to enforce maximum key age (90 days).
- **IAM credential report** automated review for unused/old keys.
- **Set up automated response** via EventBridge → Lambda to auto-disable keys when GuardDuty raises this finding type.

**SCPs for containment:** SCPs can restrict what actions can be performed in member accounts. During an incident, you can apply a **"quarantine SCP"** that denies all actions except read-only security investigation APIs, effectively locking down the compromised account.

---

## Q4. SCP vs IAM Policy Conflict

**Scenario:** Developer has `ec2:*` in IAM policy, but SCP at OU level denies `ec2:RunInstances` for instances larger than `m5.xlarge`.

**Answer:**

**What happens:** The launch of `m5.4xlarge` is **DENIED**. The request fails with an "Access Denied" error.

**IAM policy evaluation logic (full chain):**

1. **SCPs (Organization level)** — evaluated first as a **guardrail**. SCPs don't grant permissions; they define the **maximum** permissions available. If the SCP denies it, the evaluation stops — **DENY**.
2. **Resource-based policies** — checked for cross-account access or direct resource grants.
3. **Permission boundaries** — if set on the IAM entity, they cap the maximum permissions the identity policy can grant.
4. **Identity-based policies** (IAM user/role policies) — the actual permissions granted.
5. **Session policies** — if using `AssumeRole` with a session policy, further restricts permissions.

**Key principle:** For an action to be allowed, it must be permitted at **every level**. An explicit deny at any level overrides allows at all other levels.

**Permission boundaries for defense-in-depth:**
- Even if an admin accidentally grants `AdministratorAccess`, the permission boundary limits what the user can actually do.
- Example: Set a permission boundary on all developer roles allowing only `ec2:*`, `s3:*`, `rds:*` on specific resources — even if someone attaches `AdministratorAccess`, they can't touch IAM, Organizations, or billing.

---

## Q5. Break-Glass Access Pattern

**Scenario:** On-call engineer needs elevated access at 2 AM for an RDS issue, but normal role is read-only.

**Answer:**

**Secure break-glass design:**

1. **Create an elevated IAM role** (`BreakGlassRDSAdmin`) with the necessary RDS troubleshooting permissions.
2. **Trust policy** allows only authorized on-call engineers to assume it, with MFA required:
```json
{
  "Condition": {
    "Bool": { "aws:MultiFactorAuthPresent": "true" },
    "NumericLessThan": { "aws:MultiFactorAuthAge": "3600" }
  }
}
```
3. **Set maximum session duration** to 1 hour (`--duration-seconds 3600`) so access auto-expires.
4. **Use STS AssumeRole** — the engineer assumes the break-glass role, gets temporary credentials valid for 1 hour.
5. **Approval workflow (optional):**
   - Integrate with a ticketing system (PagerDuty/ServiceNow) — the break-glass Lambda verifies an open incident ticket before granting access.
   - Use **AWS Step Functions** for a multi-step approval: request → manager approval (SNS) → credential vending → auto-expiry.

**Auditing:**
- Every `AssumeRole` call is logged in **CloudTrail** with the source identity, time, and session name.
- Set up a **CloudWatch alarm** on break-glass role assumption events.
- Require the engineer to include a **session tag** with the incident ticket number.

**Auto-revocation:** STS temporary credentials expire automatically. No manual cleanup needed. If you need to revoke earlier, apply an inline deny policy on the role with a time condition.

---

## Q6. Federated Identity & MFA Enforcement

**Scenario:** Okta SAML federation into AWS — enforce MFA for all federated users.

**Answer:**

**MFA at SAML federation level:**
- Configure Okta to **require MFA** before issuing the SAML assertion.
- In the SAML assertion, include the `https://aws.amazon.com/SAML/Attributes/SessionDuration` and crucially, set the MFA-related claim.

**IAM condition keys for MFA enforcement:**
- The SAML federation passes `aws:MultiFactorAuthPresent` as a condition key.
- Apply a **deny policy** on the federated role:
```json
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "BoolIfExists": { "aws:MultiFactorAuthPresent": "false" }
  }
}
```
- **Important:** Use `BoolIfExists` instead of `Bool` because for some API calls the key may not exist.

**Troubleshooting MFA claim issue:**
1. Check the **SAML assertion** (Okta provides a SAML tracer) — verify `aws:MultiFactorAuthPresent` is set to `true`.
2. Check if Okta is sending the MFA attribute correctly — AWS expects it in the `https://aws.amazon.com/SAML/Attributes/` namespace.
3. Check **CloudTrail** `AssumeRoleWithSAML` event — look at the `additionalEventData` field for MFA details.
4. If the user authenticated with MFA in Okta but the assertion doesn't include the flag, it's an Okta SAML assertion configuration issue — the MFA claim must be mapped explicitly.

---

## Q7. IAM Policy Conditions for IP + VPC Endpoint Restrictions

**Scenario:** Restrict IAM actions to only corporate VPN CIDR and VPC endpoints, while allowing Lambda in VPC.

**Answer:**

**Policy combining VPN IPs and VPC endpoints:**
```json
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringNotEqualsIfExists": {
      "aws:SourceVpce": ["vpce-abc123", "vpce-def456"]
    },
    "NotIpAddressIfExists": {
      "aws:SourceIp": ["10.0.0.0/8", "172.16.0.0/12"]
    },
    "Bool": {
      "aws:ViaAWSService": "false"
    }
  }
}
```

**`aws:SourceIp` vs `aws:SourceVpce`:**
- `aws:SourceIp` — the IP making the API call. Applies when traffic goes via the **internet** (console, CLI from laptop, NAT Gateway).
- `aws:SourceVpce` — the VPC endpoint ID. Applies when traffic goes via a **VPC endpoint** (interface or gateway). In this case, `aws:SourceIp` is **not present** in the request context.
- This is why you must use `IfExists` variants — the key may or may not be present depending on the traffic path.

**Lambda in VPC without NAT:** A Lambda in a VPC without a NAT gateway and without a VPC endpoint **cannot call AWS APIs at all** — it has no route to the internet or to AWS services. You must create **VPC interface endpoints** for every AWS service the Lambda needs to call (STS, DynamoDB, S3, etc.). The `aws:SourceVpce` condition then enforces access through those endpoints.

---

## Q8. Confused Deputy Problem

**Scenario:** Third-party SaaS vendor wants a cross-account role for backup management.

**Answer:**

**Confused deputy problem:** An attacker could use the same third-party service to access **your** AWS account. If the vendor's role trust policy only checks `"Principal": {"AWS": "arn:aws:iam::VENDOR-ACCOUNT:root"}`, any customer of that vendor who knows your role ARN could trick the vendor into assuming your role.

**ExternalId mitigation:**
```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::VENDOR-ACCOUNT:root" },
  "Action": "sts:AssumeRole",
  "Condition": {
    "StringEquals": { "sts:ExternalId": "your-unique-external-id-12345" }
  }
}
```
- The `ExternalId` is a **shared secret** between you and the vendor — unique to your account.
- Other customers of the vendor don't know your ExternalId, so they can't impersonate you.
- The ExternalId should be **generated by you**, not the vendor.

**Additional controls:**
- **Permission boundary** on the role to cap what the vendor can do (e.g., only `backup:*` and `s3:GetObject`).
- **CloudTrail** monitoring for all `AssumeRole` events on this role.
- **SCP** preventing the role from performing sensitive actions like IAM changes.
- **Time-based conditions** — restrict role usage to specific hours if the vendor operates in consistent windows.
- **Regularly rotate** the ExternalId and re-synchronize with the vendor.

---

## Q9. Access Analyzer Findings Triage

**Scenario:** 150+ findings from IAM Access Analyzer showing externally shared resources.

**Answer:**

**Prioritization in healthcare/payments:**
1. **Critical (fix immediately):**
   - S3 buckets with PHI/PCI data shared externally
   - KMS keys accessible by external accounts (they could decrypt your data)
   - Lambda functions invokable by external accounts
2. **High (fix within 24 hours):**
   - SQS/SNS topics with external access (potential data leakage channel)
   - IAM roles assumable by external accounts without ExternalId
3. **Medium (fix within 1 week):**
   - S3 buckets with non-sensitive data shared externally
   - Resources shared with known partner accounts (verify if intentional)

**Triage workflow:**
1. **Export all findings** and categorize by resource type and data sensitivity.
2. **Cross-reference** with your data classification — which resources contain PHI/PCI data?
3. **Verify intent** — some external sharing is legitimate (cross-account access in your org). Mark these as **archived** with justification.
4. **Remediate** — remove unintended external access by updating resource policies.
5. **Set up automated monitoring** — EventBridge rule on new Access Analyzer findings → SNS → security team.

**Access Analyzer vs Config:**
- **Access Analyzer** uses **automated reasoning** (Zelkova) to mathematically prove whether a resource is accessible externally. It catches subtle policy combinations that rules-based checks miss.
- **Config rules** like `s3-bucket-public-read-prohibited` are **pattern-based** — they check specific known-bad configurations but may miss complex policy interactions.
- Use **both**: Config for fast detection of common misconfigs, Access Analyzer for deep policy analysis.

---

## Q10. Root Account Security

**Scenario:** Root user has active access keys, no MFA, and was used 3 days ago.

**Answer:**

**Immediate steps:**
1. **Enable MFA on root** immediately — use a **hardware MFA** device (YubiKey), not a virtual one, for the root account.
2. **Delete the root access keys** — `aws iam delete-access-key --user-name root --access-key-id AKIA...`. Root should **never** have access keys.
3. **Check CloudTrail** for all actions performed by root in the last 30 days — look for unauthorized changes.
4. **Change the root password** to a strong, unique password stored in a physical safe or hardware vault.
5. **Set the root account email** to a **distribution list** (e.g., `aws-root@company.com`), not a personal email.
6. **Enable alternate contacts** for billing and security.

**Why root is dangerous in multi-account:**
- Root can bypass **all SCPs** — it's the only principal that SCPs don't affect.
- Root can close the AWS account entirely.
- Root can change the support plan, billing info, and account email.
- In an organization, if the **management account root** is compromised, the attacker controls everything.

**Monitoring root usage:**
- **CloudWatch metric filter** on CloudTrail for `"userIdentity.type": "Root"` → CloudWatch Alarm → SNS notification.
- **GuardDuty** flags root usage with `Policy:IAMUser/RootCredentialUsage`.
- **AWS Config rule** `root-account-mfa-enabled` for MFA compliance.

**SCPs and root:** SCPs **do not apply to the root user** of any account. You cannot prevent root actions via SCPs. The only mitigation is to secure the root credentials and monitor for usage. However, SCPs DO apply to the management account's root for certain actions in newer Organizations features.
