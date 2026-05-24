# PART 8: SECURE ARCHITECTURE & DESIGN (15–20 minutes)

---

## 8.1 "When reviewing a new project, what are the first **security architecture** aspects you look at?"

**Answer Outline:**

**Security architecture review checklist (in priority order):**

**1. Data flow and trust boundaries:**
- "Where does data enter the system? Where does it leave? What trust boundaries does it cross?"
- Draw data flow diagram: User → Frontend → API → Backend → Database → External system
- "Every trust boundary crossing needs authentication, encryption, and validation."

**2. Authentication & authorization:**
- How are users authenticated? (Password? MFA? Certificate?)
- How is authorization enforced? (RBAC? ABAC? Per-resource checks?)
- "I check: Can any user access any resource? Or are there proper access controls per resource?"

**3. Data classification & protection:**
- What data is processed? (PII, PCI, financial, public?)
- How is data encrypted at rest and in transit?
- How is data retained and deleted?
- "If the system handles PCI data, it immediately pulls in PCI-DSS requirements."

**4. Network architecture:**
- Where is the system deployed? (Cloud, on-prem, hybrid?)
- Is it internet-facing? What's exposed?
- Network segmentation: Is the system isolated from other environments?
- "I check: Can a compromise in this system lead to lateral movement to other critical systems?"

**5. Third-party integrations:**
- What external services does it connect to?
- How are API keys/credentials managed?
- What data is shared with third parties?
- "Every external integration is a potential attack vector."

**6. Logging & monitoring:**
- What security events are logged?
- Are logs sent to SIEM?
- Can we detect and respond to attacks against this system?
- "If it's not logged, it didn't happen from a security perspective."

**7. Resilience & availability:**
- Single points of failure?
- Backup and recovery strategy?
- DDoS protection?
- "For banking systems, availability is as important as confidentiality."

**Your approach:** "For every new project, I start with a 1-hour architecture review session. I ask the team to walk me through the data flow diagram and explain trust boundaries. I then assess each boundary for authentication, encryption, and validation. This catches 80% of architectural security issues before a single line of code is written."

---

## 8.2 "How do you balance **business requirements, usability, and security** when designing controls?"

**Answer Outline:**

**The security-usability-business triangle:**

```
           SECURITY
          /        \
         /          \
        /   BALANCE  \
       /              \
USABILITY ———————— BUSINESS
```

**Principles:**

1. **Security should enable business, not block it:**
   - "If security makes the system unusable, users will find workarounds (which are even less secure)."
   - Example: "If password requirements are too strict (20 characters, change weekly), employees write passwords on sticky notes."

2. **Risk-based decisions:**
   - High-risk transactions (wire transfers): MFA + step-up authentication → worth the friction
   - Low-risk actions (checking balance): Single authentication → minimal friction
   - "Don't apply the same security level to everything. Tailor controls to risk."

3. **Transparent security (invisible to user when possible):**
   - Behavioral analytics runs in background (user doesn't see it)
   - Encryption is automatic (user doesn't choose)
   - Device health checks happen at VPN connection (user just clicks connect)
   - "Best security is security users don't notice."

4. **Offer alternatives, not just "no":**
   - Business: "We need this feature launched in 2 weeks."
   - Bad response: "No, it's not secure."
   - Good response: "We can launch with these controls now, and add advanced controls in phase 2. Here's the residual risk we're accepting."

**Real example:**
- Business wanted to launch a new payment feature quickly.
- Security concern: Missing input validation and transaction monitoring.
- My approach: "Let's launch with WAF protection and basic validation (2 days of work). We'll add full input validation and transaction monitoring in the next sprint. I'll document the residual risk. Business owner signs off on temporary risk acceptance."
- Result: Feature launched on time. Full security controls implemented 3 weeks later. No incidents in the interim.

---

## 8.3 "Describe a time you rejected or pushed back on an application design due to security concerns."

**Answer Outline (STAR format):**

**Situation:** "Development team proposed a new microservice architecture where all internal services communicated over unencrypted HTTP. They argued: 'It's all internal, so encryption isn't needed. TLS adds latency.'"

**Task:** "As the security architect, I needed to ensure the design met our security standards without blocking the project."

**Action:**
1. **Quantified the risk:** "If any internal host is compromised, attacker can eavesdrop on ALL internal traffic—including customer data, authentication tokens, and financial transactions."
2. **Referenced compliance:** "PCI-DSS requires encryption of cardholder data in transit, even within the internal network."
3. **Addressed performance concern:** "TLS 1.3 handshake adds <5ms latency. For our use case, this is negligible. I ran benchmarks to prove it."
4. **Proposed implementation path:** "Use service mesh (Istio) for automatic mTLS. Zero code changes needed. Infrastructure team handles setup."
5. **Demonstrated business risk:** "A recent breach at [competitor] was caused by exactly this—unencrypted internal traffic. Attacker intercepted API tokens after gaining initial foothold."

**Result:** "Team agreed to implement mTLS via Istio. Total implementation time: 1 week. Performance impact: <3ms additional latency. The architecture was approved by compliance. This became the standard for all new microservice deployments."

---

## 8.4 "How do you approach **segmentation** of high-value assets (e.g., payment systems, core banking) from other networks?"

**Answer Outline:**

**Segmentation strategy for banking:**

```
┌─────────────────────────────────────────────────────────┐
│  ZONE 1: CORE BANKING (Highest Security)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Payment Processing | Core Banking DB | SWIFT     │   │
│  │ • Dedicated VLAN/VPC                            │   │
│  │ • Only app-tier can access (not web tier)       │   │
│  │ • All traffic encrypted (mTLS)                  │   │
│  │ • No internet access (air-gapped from internet) │   │
│  │ • PAM required for admin access                 │   │
│  │ • IDS/IPS monitoring on all interfaces          │   │
│  │ • Change control: Dual approval required        │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ZONE 2: APPLICATION TIER (Medium-High Security)        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ App Servers | API Gateway | Message Queue        │   │
│  │ • Can access Core Banking zone (specific ports)  │   │
│  │ • Can receive from DMZ (specific ports)          │   │
│  │ • Cannot access internet directly                │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ZONE 3: DMZ (Medium Security)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Web Servers | Load Balancers | WAF               │   │
│  │ • Internet-facing (HTTPS only)                   │   │
│  │ • Can forward to App Tier (specific ports)       │   │
│  │ • Cannot access Core Banking directly            │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ZONE 4: CORPORATE (Standard Security)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Employee Workstations | Email | File Servers     │   │
│  │ • Cannot access Core Banking or App Tier         │   │
│  │ • Admin access to zones requires VPN + PAM       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Implementation mechanisms:**
- **VLANs:** Physical/logical network separation
- **Firewalls:** Rules between zones (deny by default, explicit allow)
- **AWS Security Groups/NACLs:** Cloud-native segmentation
- **Kubernetes Network Policies:** Pod-level microsegmentation
- **Monitoring:** All cross-zone traffic logged and analyzed in SIEM

---

## 8.5 "Explain how you would design **access control** for privileged users and administrators."

**Answer Outline:**

**Privileged Access Management (PAM) architecture:**

```
┌────────────────────────────────────────────────────┐
│           PRIVILEGED ACCESS WORKFLOW                │
│                                                     │
│  1. Admin requests access via PAM tool              │
│     (CyberArk, BeyondTrust, HashiCorp Vault)       │
│                                                     │
│  2. Approval workflow:                              │
│     - Manager approves                              │
│     - Security team validates business justification│
│     - Dual approval for critical systems            │
│                                                     │
│  3. Time-limited access granted:                    │
│     - 4-hour window for specific task               │
│     - Auto-revoked after expiry                     │
│     - All actions logged and recorded               │
│                                                     │
│  4. Session monitoring:                             │
│     - Screen recording of admin sessions            │
│     - Keystroke logging (for compliance)            │
│     - Real-time alerting on suspicious commands     │
│                                                     │
│  5. Post-session review:                            │
│     - Audit logs reviewed by security team          │
│     - Anomalous activity investigated               │
└────────────────────────────────────────────────────┘
```

**Key principles:**
1. **No standing privileges:** Admin access is temporary. Zero standing admin accounts.
2. **Just-In-Time (JIT):** Access granted only when needed, for minimum duration.
3. **Just-Enough-Access (JEA):** Grant only the specific permissions needed for the task.
4. **Break-glass accounts:** Emergency admin accounts with extra logging and alerting. Used only when PAM is unavailable.
5. **Separation of duties:** Person requesting access ≠ person approving ≠ person auditing.
6. **MFA everywhere:** All admin access requires MFA (certificate + OTP minimum).

---

## 8.6 "What is your approach to **key management** for encryption at scale (HSMs, KMS, rotation, segregation of duties)?"

**Answer Outline:**

**Key management architecture:**

```
┌───────────────────────────────────────────────────────┐
│  KEY HIERARCHY                                         │
│                                                        │
│  Master Key (HSM-protected)                            │
│    └── Data Encryption Keys (DEKs)                    │
│          ├── DEK for Customer Data (AES-256)           │
│          ├── DEK for Payment Data (AES-256)            │
│          ├── DEK for Backup Encryption                 │
│          └── DEK for Log Encryption                    │
│                                                        │
│  Key Wrapping: Master key encrypts DEKs (envelope     │
│  encryption). DEKs encrypt actual data.               │
│  Compromise of one DEK doesn't expose all data.       │
└───────────────────────────────────────────────────────┘
```

**Key management practices:**

| Practice | Implementation | Why |
|----------|---------------|-----|
| **HSM for master keys** | CloudHSM or on-prem HSM (FIPS 140-2 Level 3) | Master key never leaves HSM; tamper-resistant |
| **KMS for DEKs** | AWS KMS / Azure Key Vault | Managed service; auto-rotation; IAM-controlled access |
| **Key rotation** | Automatic annual rotation for KMS keys; manual rotation if compromise suspected | Limits exposure if key is compromised |
| **Separation of duties** | Key admin ≠ data admin. Key admin can manage keys but can't decrypt data. Data admin can use keys but can't manage them. | Prevents single person from both managing keys and accessing data |
| **Key access logging** | All key usage logged in CloudTrail | Audit trail for compliance |
| **Key access policies** | IAM policies restrict which roles can use which keys | Least privilege for encryption/decryption |
| **Backup & escrow** | Key material backed up in secondary HSM. Escrow for disaster recovery. | Business continuity |
| **Key deletion** | Soft delete with 30-day recovery window. Hard delete requires dual approval. | Prevent accidental data loss |

**PCI-DSS key management requirements:**
- Split knowledge: No single person knows the full key
- Dual control: Key operations require two authorized individuals
- Key custodians formally appointed and trained
- Key ceremony documented and witnessed

**Your experience:** "We use AWS KMS with customer-managed keys for all production encryption. Master keys reside in CloudHSM (FIPS 140-2 Level 3). Key access is controlled by IAM policies—only specific service roles can encrypt/decrypt. All key usage is logged in CloudTrail and monitored by SIEM. Keys rotate annually. For PCI environments, we implement dual control: key generation requires two authorized custodians. This architecture meets PCI-DSS and SOX key management requirements."

---
