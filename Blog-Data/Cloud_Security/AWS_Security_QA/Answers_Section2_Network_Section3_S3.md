# Section 2 — Network Security: VPC, SGs, NACLs, Firewalls (Q11–Q20) — Answers

---

## Q11. VPC Design for a Multi-Tier Payment Application

**Answer:**

**Subnet layout (PCI DSS compliant):**
- **Public subnets** (2 AZs): ALB/NLB only. No application servers directly here.
- **Private subnets - App tier** (2 AZs): ECS Fargate tasks / EC2 instances running application code.
- **Private subnets - Database tier** (2 AZs): RDS Aurora (Multi-AZ), ElastiCache. No NAT route — fully isolated.
- **Isolated subnets** (2 AZs): For any components that must have zero internet access (HSM, internal APIs).

**Component placement:**
- **ALB** → public subnets, with WAF attached.
- **NAT Gateway** → public subnets (for app tier to pull patches/updates), one per AZ for HA.
- **Bastion Host** → **eliminate entirely**, use SSM Session Manager instead.
- **VPC endpoints** → S3 (Gateway), DynamoDB (Gateway), STS/CloudWatch/ECR (Interface) in private subnets.

**Security Groups (stateful) — layered approach:**
| SG | Inbound | Outbound |
|---|---|---|
| ALB-SG | 443 from `0.0.0.0/0` | App-tier SG on app port |
| App-SG | App port from ALB-SG **only** | DB-SG on 3306/5432, HTTPS to VPC endpoints |
| DB-SG | 3306/5432 from App-SG **only** | None (deny all) |

**NACLs (stateless) — extra defense:**
- DB subnet NACL: allow inbound only from app subnet CIDR on DB port; explicitly deny all other inbound.
- NACLs require ephemeral port rules (1024-65535) for return traffic since they're stateless.

**CDE boundary:** The Cardholder Data Environment is defined as any system that stores, processes, or transmits cardholder data. In this design, the CDE boundary is the App + DB subnets. The CDE is segmented from non-CDE via separate subnets, SGs, NACLs, and potentially separate VPCs. All traffic crossing the CDE boundary must be logged and monitored. **VPC Flow Logs** must be enabled on all CDE subnets.

---

## Q12. Security Group vs NACL Troubleshooting

**Answer:**

**Systematic troubleshooting:**

1. **Security Groups (stateful):** Check the EC2 instance's SG — does it allow inbound from the on-prem CIDR on the required port? Since SGs are stateful, if inbound is allowed, return traffic is automatic.

2. **NACLs (stateless):** This is the most common culprit. Check the **subnet's NACL**:
   - Inbound rule: Allow traffic from on-prem CIDR on the required port.
   - **Outbound rule:** Allow ephemeral ports (1024-65535) back to on-prem CIDR. Since NACLs are **stateless**, return traffic is NOT automatic — you need an explicit outbound rule.

3. **Route Tables:** Check that the private subnet's route table has a route to the on-prem CIDR via the Virtual Private Gateway (VGW) or Transit Gateway.

4. **VPN config:** Check IPsec tunnel status, BGP routes (if using dynamic routing), and that the on-prem firewall allows return traffic.

**Using VPC Flow Logs:**
- Enable Flow Logs on the ENI of the EC2 instance.
- Filter for the on-prem source IP and look at the `action` field:
  - `ACCEPT` then `REJECT` = traffic reaches the instance but return traffic is blocked (likely NACL outbound rule missing).
  - `REJECT` on inbound = SG or NACL inbound rule blocking it.
- Flow Log fields: `srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status`

---

## Q13. VPC Peering vs Transit Gateway vs PrivateLink

**Answer:**

| Feature | VPC Peering | Transit Gateway | PrivateLink |
|---|---|---|---|
| **Connectivity** | 1-to-1 between two VPCs | Hub-and-spoke, many-to-many | Expose specific services to consumers |
| **Transitive routing** | ❌ No | ✅ Yes | N/A (service-level, not network-level) |
| **Cross-account** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cross-region** | ✅ Yes | ✅ Yes (inter-region peering) | ✅ Yes |
| **Scale** | Limit of 125 peering connections per VPC | Thousands of VPCs | Unlimited endpoints |
| **Cost** | Data transfer only | Per attachment + data transfer | Per endpoint-hour + data transfer |
| **Security inspection** | ❌ No centralized point | ✅ AWS Network Firewall | N/A |

**Best choice for 15-account shared services:** **Transit Gateway** — it provides a centralized hub, supports transitive routing, and you can insert **AWS Network Firewall** for centralized traffic inspection.

**Preventing transitive routing in peering:** VPC peering is non-transitive by design. If A↔B and B↔C are peered, A cannot reach C through B. This is a security feature. But it doesn't scale — with 15 accounts you'd need 105 peering connections (n(n-1)/2).

**TGW + Network Firewall:** Deploy Network Firewall in a dedicated "inspection VPC" attached to the Transit Gateway. Configure TGW route tables to send inter-VPC traffic through the firewall VPC for IDS/IPS inspection before forwarding.

---

## Q14. AWS Network Firewall Deployment

**Answer:**

**Architecture placement:**
- Deploy in a **dedicated firewall subnet** within each VPC (or a centralized inspection VPC attached to Transit Gateway).
- **Ingress pattern:** Internet → IGW → Firewall subnet → ALB subnet → App subnet.
- **Egress pattern:** App subnet → Firewall subnet → NAT Gateway → Internet.

**Domain-based filtering (Suricata rules):**
```
# Allow only specific domains
pass tls any any -> any any (tls.sni; content:"amazonaws.com"; endswith; nocase; sid:1; rev:1;)
pass tls any any -> any any (tls.sni; content:"github.com"; endswith; nocase; sid:2; rev:1;)
# Drop everything else
drop tls any any -> any any (msg:"Blocked TLS to unauthorized domain"; sid:100; rev:1;)
```
- Use **stateful rule groups** with `domain-list` for HTTP/HTTPS domain filtering (built-in feature, simpler than raw Suricata).
- Use Custom Suricata rules for advanced IDS/IPS signatures.

**Route table integration:**
- Modify the **IGW route table** (ingress routing) to send traffic to the firewall endpoint.
- Modify **private subnet route tables** to send `0.0.0.0/0` traffic through the firewall endpoint instead of directly to the NAT Gateway.
- This requires **VPC routing enhancements** (appliance routing).

**Cost justification:** Network Firewall costs ~$0.395/hr per endpoint + $0.065/GB processed. For a healthcare/payments company, justify by: (1) regulatory compliance requirement for IDS/IPS, (2) data exfiltration prevention, (3) cost of a breach ($10M+ in healthcare) vastly exceeds firewall cost.

---

## Q15. DDoS Attack on Public ALB

**Answer:**

**Shield Standard vs Advanced:**
| | Shield Standard | Shield Advanced |
|---|---|---|
| **Cost** | Free (included) | $3,000/month + data transfer |
| **Protection** | Layer 3/4 automatic | Layer 3/4/7 advanced |
| **DRT** | ❌ | ✅ AWS DDoS Response Team 24/7 |
| **Cost protection** | ❌ | ✅ Credits for DDoS scaling costs |
| **WAF integration** | ❌ | ✅ Free WAF for protected resources |
| **Visibility** | Basic | Real-time metrics, attack forensics |

**WAF rate-based rules:**
```json
{
  "Name": "RateLimitRule",
  "Priority": 1,
  "Action": { "Block": {} },
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  }
}
```
- Set rate limit per IP (e.g., 2000 requests per 5 minutes).
- Add **geographic-based blocking** for traffic from unexpected countries.
- Add **IP reputation rules** using AWS Managed Rule Groups (`AWSManagedRulesAmazonIpReputationList`).

**Incident response:**
1. **Detection:** Shield/GuardDuty/CloudWatch alarms fire → PagerDuty alert.
2. **Mitigation:** Enable WAF rate-based rules, geo-blocking. If Shield Advanced, engage DRT.
3. **Scaling:** ALB auto-scales, CloudFront absorbs volumetric traffic at edge.
4. **Monitoring:** Watch metrics — `RequestCount`, `HTTPCode_ELB_5XX`, `HealthyHostCount`.
5. **Post-mortem:** Analyze attack vectors, update WAF rules, review if Shield Advanced is needed.

**CloudFront for DDoS:** Putting CloudFront in front of ALB absorbs volumetric attacks at 400+ global edge locations. Shield Standard protects CloudFront automatically. Attackers can't reach the origin ALB directly if you restrict the ALB SG to only CloudFront IPs (use AWS-managed prefix list `com.amazonaws.global.cloudfront.origin-facing`).

---

## Q16. Unintended Public Exposure of an EC2 Instance

**Answer:**

**Does a public IP = publicly reachable?** **No.** Multiple conditions must align:
1. ✅ Public IP or Elastic IP attached — **yes, it's attached**.
2. ❓ **Internet Gateway** attached to the VPC — if the VPC has an IGW, this is met.
3. ❓ **Route table** of the subnet has a route `0.0.0.0/0 → IGW` — private subnets typically route to NAT, not IGW.
4. ❓ **Security Group** allows inbound traffic from `0.0.0.0/0` — if SG only allows internal CIDRs, external traffic is blocked.
5. ❓ **NACL** allows inbound traffic — if the NACL denies public IPs, traffic is blocked.

In a properly designed private subnet, step 3 fails — the route table sends `0.0.0.0/0` to NAT, not IGW. So the instance has a public IP but is **not reachable** from the internet. However, this is still a misconfiguration that should be remediated.

**Proactive detection:**
- **AWS Config rule:** `ec2-instance-no-public-ip` — flags any EC2 instance with a public IP.
- **Security Hub:** CIS Benchmark control flags EC2 instances in public subnets.
- **Custom EventBridge rule:** Trigger on `RunInstances` API call → Lambda checks if public IP was assigned → auto-remediate or alert.

**Preventive guardrails:**
- **SCP:** Deny `ec2:RunInstances` unless `ec2:AssociatePublicIpAddress` is `false`.
- **VPC subnet setting:** Disable "auto-assign public IP" on all private subnets — this is a subnet-level setting.
- **AWS Config remediation:** Auto-dissociate public IPs from instances in tagged "private" subnets.

---

## Q17. VPC Endpoint Security for S3

**Answer:**

**Enforcement architecture:**

1. **S3 Bucket Policy** — deny all access NOT from the VPC endpoint:
```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::my-bucket", "arn:aws:s3:::my-bucket/*"],
  "Condition": {
    "StringNotEquals": {
      "aws:sourceVpce": "vpce-abc123"
    }
  }
}
```

2. **VPC Endpoint Policy** — restrict which buckets can be accessed through the endpoint:
```json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/*"
}
```

3. **Route Table:** Ensure the S3 Gateway Endpoint is in the route table for the private subnets. AWS automatically adds a route for S3 prefixes via the endpoint.

**Verification (no traffic via NAT):**
- **VPC Flow Logs** — check for traffic to S3 public IP ranges (available from `ip-ranges.json`) from the NAT Gateway ENI. If you see traffic to S3 IPs through NAT, the endpoint isn't being used.
- **CloudTrail S3 data events** — the `vpcEndpointId` field in CloudTrail shows which VPC endpoint was used. If this field is absent, the request went over the internet.
- **S3 server access logs** — check the `Remote IP` field.

---

## Q18. Micro-Segmentation with Security Groups for Pods

**Answer:**

**Security Groups for Pods (SGP):**
- Available on **EKS with Nitro-based instances** (not Fargate).
- Assign specific SGs to pods based on a `SecurityGroupPolicy` CRD:
```yaml
apiVersion: vpcresources.k8s.aws/v1beta1
kind: SecurityGroupPolicy
metadata:
  name: payments-sg-policy
  namespace: payments
spec:
  podSelector:
    matchLabels:
      app: payments
  securityGroups:
    groupIds:
      - sg-payments-pods
```
- Create `sg-payments-pods` that only allows traffic to/from `sg-database-pods` on the DB port.

**SGP vs Kubernetes Network Policies:**
| Feature | Security Groups for Pods | K8s Network Policies |
|---|---|---|
| **Enforcement** | AWS VPC level (ENI) | CNI plugin level (iptables/eBPF) |
| **Scope** | AWS-native, works with non-K8s AWS resources | K8s-only, within cluster |
| **RDS integration** | ✅ SG can reference RDS SGs directly | ❌ Can't reference AWS resources |
| **Logging** | VPC Flow Logs | CNI-specific logging |

**Limitations of SGP:**
- Only works on Nitro instances (not t2, m4, etc.).
- Maximum 5 SGs per ENI (pod limit).
- Trunk ENI capacity limits the number of pods with SGs per node.
- Doesn't support IPv6 in all configurations.
- **Best practice:** Use SGP for AWS resource access (RDS, ElastiCache) and K8s Network Policies for pod-to-pod traffic.

---

## Q19. DNS-Based Exfiltration Detection

**Answer:**

**Route 53 Resolver DNS Firewall:**
- Create **domain lists** of known-good domains (allow list) and known-bad domains (block list).
- Associate firewall rules with VPCs.
- Block DNS queries to newly registered domains (common in DNS tunneling).
- Use **AWS Managed Domain Lists** for known malware/botnet domains.
- Set action to `BLOCK` with response type `NXDOMAIN` or `OVERRIDE` (redirect to a sinkhole).

**GuardDuty DNS detection:**
- GuardDuty monitors VPC DNS logs (Route 53 Resolver query logs) automatically.
- Detects `Trojan:EC2/DNSDataExfiltration` — identifies DNS queries with unusually long or high-entropy subdomains (e.g., `base64encodeddata.malicious.com`).
- Detects `Backdoor:EC2/DenialOfService.Dns` — DNS amplification attacks.

**VPC Flow Log patterns for DNS tunneling:**
- Unusual volume of DNS traffic (UDP 53) from a single instance.
- Large DNS response sizes (normal DNS responses < 512 bytes; tunneling often > 1000 bytes).
- High frequency of DNS queries to a single domain with varying subdomains.
- To capture DNS: enable **Route 53 Resolver Query Logging** — this gives you the actual domain names, which Flow Logs don't capture (Flow Logs only show IPs and ports).

---

## Q20. Hybrid Network Security (VPN + Direct Connect)

**Answer:**

**Encrypting traffic over Direct Connect:**
- Direct Connect provides a **private, dedicated connection** but is **NOT encrypted** by default — traffic traverses AWS's network, not the public internet, but it's still unencrypted on the wire.
- **Option 1:** Create a **Site-to-Site VPN over Direct Connect** — run an IPsec VPN tunnel over the DX connection using a Direct Connect public VIF. This gives you encryption + private connectivity.
- **Option 2:** Use **MACsec** (IEEE 802.1AE) — available on 10 Gbps and 100 Gbps dedicated connections. Provides Layer 2 encryption directly on the DX port. This is the highest-performance option.
- **Option 3:** Application-level encryption (TLS) — encrypt at the application layer regardless of the transport.

**Direct Connect Gateway with Transit VIF:**
- Create a **Direct Connect Gateway** and associate it with your **Transit Gateway**.
- Create a **Transit Virtual Interface (VIF)** on the DX connection.
- This allows your on-premises network to reach **multiple VPCs across multiple regions** through a single DX connection → DX Gateway → Transit Gateway.
- Attach VPCs to the Transit Gateway to give them on-prem connectivity.

**Monitoring VPN failover:**
- **CloudWatch metrics** for VPN: `TunnelState` (UP/DOWN), `TunnelDataIn`, `TunnelDataOut`.
- Set **CloudWatch Alarm** on `TunnelState = 0` (down) → SNS notification.
- When DX fails and traffic fails over to VPN:
  - Latency increases (VPN over internet vs DX).
  - Throughput drops (VPN ~1.25 Gbps vs DX 10+ Gbps).
  - **Security implication:** Traffic now traverses the public internet — ensure IPsec is properly configured with strong ciphers (AES-256, SHA-256, DH group 20+).
- Monitor **BGP route changes** in Transit Gateway route tables to detect failover events.

---

# Section 3 — S3 & Data Security (Q21–Q27) — Answers

---

## Q21. S3 Bucket Containing PHI Exposed Publicly

**Answer:**

**Immediate remediation:**
1. **Block public access** — apply `S3 Block Public Access` at the **bucket level** immediately:
   - `BlockPublicAcls: true`, `IgnorePublicAcls: true`, `BlockPublicPolicy: true`, `RestrictPublicBuckets: true`.
2. **Remove the offending ACL** — reset bucket ACL to `private`.
3. **Verify** — use `aws s3api get-bucket-acl` and `get-bucket-policy-status` to confirm it's no longer public.

**Determining if data was accessed:**
- **CloudTrail S3 data events** (must be enabled): Query for `GetObject` calls on the bucket. Filter by:
  - `sourceIPAddress` — any external IPs?
  - `userIdentity` — any anonymous (`Principal: *`) access?
  - Time range — from when the ACL was changed to when you remediated.
- **S3 server access logs** (if enabled): Show all requests including anonymous ones.
- If data events weren't enabled, you may not have evidence — this is a gap. **Lesson:** Always enable CloudTrail data events for PHI buckets.

**S3 Block Public Access — account vs bucket:**
- **Account-level** BPA: Overrides all bucket-level settings. If enabled at account level, NO bucket in the account can be public — even if a bucket policy says otherwise.
- **Bucket-level** BPA: Applies only to that specific bucket.
- **Best practice:** Enable BPA at the **account level** (or via SCP) and only create exceptions for known-public buckets (like static website hosting).

**HIPAA breach notification:**
- If PHI was accessed by unauthorized parties, this is a **reportable breach** under HIPAA.
- **60-day notification window** to affected individuals.
- If >500 individuals affected, must also notify **HHS (Dept. of Health and Human Services)** and **prominent media outlets**.
- Document the breach, cause, data involved, and remediation in a formal report.

---

## Q22. S3 Cross-Region Replication Security

**Answer:**

**Encryption during replication:**
- **SSE-S3 (AES-256):** Replication works seamlessly. AWS automatically re-encrypts with SSE-S3 in the destination region.
- **SSE-KMS:** More complex. You must specify a **destination KMS key** in the replication configuration because KMS keys are region-specific.
  - The replication role needs `kms:Decrypt` on the source key and `kms:Encrypt` on the destination key.
  - You can use an **AWS-managed KMS key** in the destination region, or create a **customer-managed key** for more control.
```json
{
  "ReplicaKmsKeyID": "arn:aws:kms:eu-west-1:123456789012:key/dest-key-id"
}
```

**KMS cross-region implications:**
- KMS keys cannot be replicated across regions. You need **separate keys per region**.
- This means the key policy, grants, and IAM permissions must be configured **separately in each region**.
- If using **AWS-managed keys** (`aws/s3`), you cannot control the key policy — use customer-managed CMKs for fine-grained access control.

**Data residency / PCI jurisdictional issues:**
- PCI DSS doesn't explicitly restrict data geography, but your **PCI QSA (Qualified Security Assessor)** may have opinions on where cardholder data can reside.
- **GDPR:** Replicating to EU is fine from a US compliance perspective, but replicating EU data to certain countries may violate GDPR.
- **Recommendation:** Get legal/compliance approval before configuring cross-region replication for PCI-scoped data. Document the business justification (BCDR requirement) and ensure both regions have equivalent security controls.

---

## Q23. S3 Object Lock for Compliance

**Answer:**

**S3 Object Lock configuration:**
- **Governance mode:** Objects can't be deleted or overwritten by *most* users, but users with `s3:BypassGovernanceRetention` permission can override. Good for testing or when you need administrative flexibility.
- **Compliance mode:** NO ONE can delete or overwrite the object during the retention period — not even the root user. Object is truly immutable. Once set, the retention period **cannot be shortened**, only extended.

**For CloudTrail audit logs → use Compliance mode:**
- Set retention period to **7 years (2555 days)**.
- Once applied, the logs are WORM (Write Once Read Many).

**Can root delete in Compliance mode?** **NO.** Not even the root user, not even AWS Support. The only way to remove the objects is to wait for the retention period to expire. You can also delete the entire AWS account, but the objects remain for 90 days even after account closure.

**Configuration steps:**
1. Create the bucket with Object Lock enabled (can only be set at bucket creation time).
2. Set a **default retention** configuration: Compliance mode, 2555 days.
3. Enable **versioning** (required for Object Lock).
4. Set the bucket as the **CloudTrail destination** in the Organization Trail.
5. Add a **bucket policy** denying `s3:DeleteObject`, `s3:PutBucketPolicy`, and `s3:DeleteBucket` for extra protection.
6. Apply **S3 Block Public Access** at account level.

---

## Q24. Macie for Sensitive Data Discovery

**Answer:**

**Multi-account Macie setup:**
- Designate a **delegated administrator account** (typically the security/audit account) in AWS Organizations.
- From the admin account, enable Macie on all member accounts.
- Create **classification jobs** that scan S3 buckets across all 10 accounts.
- Findings are aggregated in the admin account.

**How Macie classifies data:**
- **Managed data identifiers:** Built-in ML models and pattern matching for ~100+ data types: SSN, credit card numbers, AWS keys, email addresses, medical record numbers, etc.
- **Custom data identifiers:** Regex + keyword combinations for domain-specific data:
  - Healthcare payment data examples:
    - `NPI (National Provider Identifier)`: regex `\b\d{10}\b` with keyword proximity to "NPI", "provider"
    - `CPT codes`: regex `\b\d{5}\b` near "CPT", "procedure"
    - `ICD-10 codes`: regex `\b[A-Z]\d{2}\.?\d{0,4}\b` near "diagnosis", "ICD"
    - `Member ID`: your organization's specific format

**Handling false positives:**
- **Suppression rules:** Create rules to automatically archive findings matching specific criteria (e.g., test data buckets, known non-sensitive data patterns).
- **Severity thresholds:** Only alert on Medium/High severity findings.
- **Allow lists:** Provide Macie with known-safe text (e.g., test credit card numbers `4111-1111-1111-1111`) to suppress matching.
- **Review and refine** custom data identifiers' regex patterns and keyword lists to improve accuracy.

---

## Q25. Presigned URL Abuse

**Answer:**

**How presigned URLs work:**
- The application (using IAM credentials or role) calls `s3.generate_presigned_url()` with: bucket, key, expiration time, and HTTP method (PUT for upload, GET for download).
- The URL contains a **signature** derived from the IAM credential — anyone with the URL can perform the action without AWS credentials.
- Validity is controlled by `ExpiresIn` parameter (default 3600 seconds) AND the validity of the signing credential.

**Limiting blast radius:**
- **Short expiration:** Set `ExpiresIn` to the minimum viable time (e.g., 300 seconds / 5 minutes for upload).
- **Unique object keys:** Generate unique S3 keys per upload (e.g., `uploads/{user-id}/{uuid}.pdf`) so URLs can't be reused for different objects.
- **IP restriction in bucket policy:**
```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/uploads/*",
  "Condition": {
    "NotIpAddress": { "aws:SourceIp": ["mobile-client-cidr"] }
  }
}
```
- **Content-type and size limits:** Use presigned POST policies (not presigned URLs) which support conditions like `content-length-range` and `Content-Type`.
- **One-time use pattern:** After successful upload, trigger a Lambda to move the object to a permanent location and make the original presigned key invalid.

**Auditing via CloudTrail:**
- Enable **S3 data events** in CloudTrail.
- Presigned URL requests appear as normal S3 API calls but with the **signing IAM identity** as the principal.
- Filter by `sourceIPAddress` to detect access from unexpected locations.

---

## Q26. S3 Bucket Policy vs IAM Policy vs ACL

**Answer:**

**When to use what:**
| Mechanism | Best For | Scope |
|---|---|---|
| **IAM Policy** | Granting permissions to AWS principals you control | Per identity (user/role) |
| **Bucket Policy** | Resource-based access, cross-account, public access, VPC restrictions | Per bucket |
| **ACL** | **Legacy — avoid.** Only for S3 log delivery pre-2023 | Per object or bucket |

**For the partner scenario:** Use a **bucket policy** with cross-account trust:
```json
{
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::PARTNER-ACCOUNT:role/DropRole" },
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::my-bucket/partner-drops/*",
  "Condition": {
    "StringEquals": { "s3:x-amz-acl": "bucket-owner-full-control" }
  }
}
```

**Bucket Owner Enforced (Object Ownership):**
- With **"Bucket owner enforced"**, ACLs are disabled entirely. All objects in the bucket are automatically owned by the bucket owner, regardless of who uploaded them.
- This is the **recommended setting** as of 2023. It eliminates the "object ownership" problem where cross-account uploads resulted in the uploader owning the object.
- Before this setting, you had to require uploaders to set `bucket-owner-full-control` ACL on every put — fragile and often forgotten.

---

## Q27. Versioning and MFA Delete

**Answer:**

**S3 versioning protection:**
- With versioning enabled, a `DeleteObject` call doesn't actually delete the data — it places a **delete marker** on top. The previous versions are preserved.
- To permanently delete a version, you must call `DeleteObject` with the specific `versionId`.

**MFA Delete:**
- An additional protection that requires **MFA authentication** to: (1) permanently delete an object version, or (2) change the versioning state of the bucket.
- Can only be enabled by the **root account** using the AWS CLI (not Console):
```bash
aws s3api put-bucket-versioning --bucket my-bucket \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::123456789012:mfa/root-mfa 123456"
```

**Recovery from insider deletion:**
- If delete markers were placed: Simply delete the delete marker to restore the objects.
- If versions were permanently deleted: Not recoverable from S3 alone — restore from cross-region replica or backup.
- **List versions:** `aws s3api list-object-versions --bucket my-bucket` to see all versions including delete markers.

**Additional controls against insider threats:**
- **SCP** denying `s3:DeleteObject` and `s3:PutBucketVersioning` for all non-admin roles.
- **S3 Object Lock (Compliance mode)** — even admins can't delete during retention period.
- **Cross-region replication** to a different account — insider in one account can't access the other.
- **CloudTrail alerting** on `DeleteObject` API calls on critical buckets.
