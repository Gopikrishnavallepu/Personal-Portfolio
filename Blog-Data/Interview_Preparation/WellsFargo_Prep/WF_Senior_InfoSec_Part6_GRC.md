# PART 6: GOVERNANCE, RISK, COMPLIANCE & AUDIT (15–20 minutes)

---

## 6.1 "How do you perform a **security risk assessment** for a new system or vendor? Walk through your steps."

**Answer Outline:**

**Step 1: Scope & asset identification**
- What system/vendor is being assessed?
- What data does it process/store? (PII, PCI, financial, public)
- What is the criticality to business operations? (Critical, High, Medium, Low)
- Who are the stakeholders? (Business owner, IT, compliance, legal)

**Step 2: Data classification**
- Classify data sensitivity: Public → Internal → Confidential → Restricted
- Restricted: PCI cardholder data, SSN, account numbers
- Confidential: Customer PII, financial reports
- Internal: Employee directories, internal procedures
- Public: Marketing materials, press releases

**Step 3: Threat identification**
- What threats apply? (External attackers, insider threats, supply chain, regulatory)
- What's the threat landscape for this type of system/vendor?
- "For a SaaS vendor: data breach, vendor employee misuse, account compromise, data residency issues"

**Step 4: Vulnerability assessment**
- Technical vulnerabilities: Scan the system or review vendor's SOC 2 report
- Process vulnerabilities: Missing change control, weak access management, no incident response
- Compliance gaps: Does the system meet PCI-DSS, SOX, GLBA requirements?

**Step 5: Risk calculation**
- **Risk = Likelihood × Impact**
- Use a risk matrix:

| | Low Impact | Medium Impact | High Impact | Critical Impact |
|---|-----------|--------------|-------------|----------------|
| **High Likelihood** | Medium | High | Critical | Critical |
| **Medium Likelihood** | Low | Medium | High | Critical |
| **Low Likelihood** | Low | Low | Medium | High |

**Step 6: Control recommendations**
- For each identified risk, recommend mitigating controls
- Prioritize: Critical risks first → High → Medium → Low
- Example: "Risk: Vendor has no encryption at rest → Control: Require vendor to implement AES-256 encryption within 90 days"

**Step 7: Risk acceptance**
- Present findings to risk owner (business leader)
- Business decides: Accept risk, mitigate, transfer (insurance), or avoid (don't use system)
- Document decision with sign-off

**Step 8: Ongoing monitoring**
- "Risk assessment isn't one-time. We reassess annually or when there's a significant change."
- Continuous monitoring: Vendor's security posture, new vulnerabilities, compliance changes

**Vendor-specific additions:**
- **Vendor questionnaire:** 150+ questions covering security controls, compliance, incident response, business continuity
- **SOC 2 Type II review:** Independent audit of vendor's security controls
- **Right-to-audit clause:** Contract allows us to audit vendor's security practices
- **Data processing agreement:** Legal agreement on data handling, breach notification, data deletion
- **SLA review:** Uptime guarantees, breach notification timelines, security incident response times

**Your experience:** "I've led 20+ vendor risk assessments for banking applications. For a critical payment processing vendor, our assessment identified: no encryption at rest, overly permissive IAM, and insufficient logging. We worked with the vendor to remediate these issues before approval and included contractual obligations for ongoing compliance. We reassess all critical vendors annually."

---

## 6.2 "What frameworks are you familiar with (e.g., **NIST CSF, ISO 27001, CIS Controls**) and how have you applied them?"

**Answer Outline:**

| Framework | Focus | How I've Applied It |
|-----------|-------|-------------------|
| **NIST CSF** | Identify, Protect, Detect, Respond, Recover | Used as our primary framework to organize security program. Mapped all controls to CSF categories. Reports to board show maturity per function. |
| **ISO 27001** | Information Security Management System (ISMS) | Implemented ISMS for our cloud environment. Defined scope, risk treatment plan, and statement of applicability. Prepared for certification audit. |
| **CIS Controls** | 18 prioritized security controls | Used CIS Controls as implementation guide for NIST CSF. Prioritized top 6 controls for quick wins: inventory, software inventory, secure config, vulnerability mgmt, access control, audit log mgmt. |
| **NIST 800-53** | Comprehensive control catalog | Referenced for detailed control requirements during audit preparation. Mapped PCI-DSS controls to 800-53 families. |
| **PCI-DSS** | Payment card data security | Implemented all 12 requirements for systems handling card data. Led quarterly self-assessments and annual QSA audit. |
| **MITRE ATT&CK** | Adversary tactics and techniques | Mapped SIEM detection rules to ATT&CK techniques. Identified coverage gaps. Used for threat hunting exercises. |

**Practical application example (NIST CSF):**

```
IDENTIFY:
  ✅ Asset inventory (all cloud resources tagged and tracked)
  ✅ Data classification (PII, PCI, internal, public)
  ✅ Risk assessments (annual + event-driven)
  ✅ Business impact analysis

PROTECT:
  ✅ IAM (MFA, least privilege, SSO)
  ✅ Encryption (at rest + in transit)
  ✅ Network segmentation
  ✅ Security awareness training

DETECT:
  ✅ SIEM with 50+ detection rules
  ✅ GuardDuty + Security Hub
  ✅ Vulnerability scanning (continuous)
  ✅ Threat intelligence feeds

RESPOND:
  ✅ Incident response playbooks (10+ scenarios)
  ✅ Communication plan (internal + regulatory)
  ✅ Forensics capability

RECOVER:
  ✅ Backup and restore procedures
  ✅ Business continuity plan
  ✅ Lessons learned process
```

**Your experience:** "I use NIST CSF as the overarching framework and map specific controls from CIS Controls and NIST 800-53. For PCI-DSS compliance, I maintain a control matrix showing how each PCI requirement maps to our implemented controls. During audits, I present this mapping to demonstrate comprehensive coverage. MITRE ATT&CK helps me identify detection gaps—I've increased our ATT&CK technique coverage from 40% to 75%."

---

## 6.3 "How do regulations like **PCI-DSS, SOX, GLBA, GDPR** or RBI-related guidance influence security controls in a bank?"

**Answer Outline:**

| Regulation | Scope | Key Security Requirements | Impact on Controls |
|-----------|-------|--------------------------|-------------------|
| **PCI-DSS** | Payment card data (cardholder data environment) | Network segmentation, encryption, access control, vulnerability mgmt, logging, pen testing | Isolate payment systems; encrypt card data; quarterly vuln scans; annual pen test; log all access to cardholder data |
| **SOX** | Financial reporting integrity | Change management, access controls, audit trails, segregation of duties | All changes to financial systems go through change control; audit logs immutable; no single person can approve + execute |
| **GLBA** | Customer financial information | Safeguards Rule: administrative, technical, physical safeguards | Risk assessment required; information sharing restricted; privacy notices; vendor oversight |
| **GDPR** | Personal data of EU residents | Data minimization, consent, right to erasure, breach notification (72 hours) | Data inventory; consent management; deletion workflows; breach detection within 72 hours |
| **RBI Guidelines** | Indian banking regulation | Cyber security framework, incident reporting, outsourcing guidelines | Board-level cyber oversight; mandatory CISO appointment; incident reporting to CERT-In |

**How regulations shape daily operations:**

1. **Logging & audit trails:** "Every regulation requires evidence. We log everything: access to sensitive data, configuration changes, privileged actions. Logs are immutable (write-once storage)."

2. **Change management:** "SOX requires documented change control for financial systems. Every change has a ticket, approval, test evidence, and rollback plan."

3. **Access control:** "PCI-DSS requires unique user IDs for all system access and MFA for remote admin access. GLBA requires access restrictions based on business need."

4. **Incident response:** "GDPR requires 72-hour breach notification. PCI-DSS requires IR plan tested annually. We maintain a regulatory notification matrix—who to notify, when, for which breach types."

5. **Vendor management:** "GLBA requires oversight of service providers. We assess all vendors annually and include security requirements in contracts."

6. **Data protection:** "PCI-DSS requires encryption of cardholder data. GDPR requires data minimization. We encrypt all sensitive data and regularly purge data beyond retention requirements."

**Your experience:** "In our banking environment, PCI-DSS drives network segmentation for payment systems, SOX drives change management rigor, and GLBA drives customer data protection. I maintain a compliance matrix mapping each regulatory requirement to our implemented controls. During audits, I present this matrix with evidence (logs, screenshots, policy documents). This approach has resulted in zero material findings in our last three regulatory audits."

---

## 6.4 "Explain how you would design and track **security KPIs/KRIs** for senior management."

**Answer Outline:**

**KPI (Key Performance Indicator)** = measures how well security program is performing  
**KRI (Key Risk Indicator)** = measures current risk exposure level

**KPIs for security program:**

| Category | KPI | Target | Why It Matters |
|----------|-----|--------|---------------|
| **Vulnerability Mgmt** | Mean time to remediate critical vulnerabilities | < 7 days | Shows patching speed for highest risks |
| **Vulnerability Mgmt** | % of systems scanned in last 30 days | > 95% | Shows scanning coverage |
| **Incident Response** | Mean time to detect (MTTD) | < 4 hours | How fast we find threats |
| **Incident Response** | Mean time to respond (MTTR) | < 1 hour | How fast we contain threats |
| **Incident Response** | Number of incidents by severity | Trending down | Shows overall risk reduction |
| **Compliance** | % of systems compliant with security baseline | > 98% | Shows configuration hygiene |
| **Training** | % employees completed security awareness training | 100% | Shows culture maturity |
| **Access Control** | % of privileged accounts with MFA | 100% | Shows IAM hygiene |
| **Phishing** | Phishing simulation click rate | < 5% | Shows employee awareness |

**KRIs for risk exposure:**

| KRI | Current | Threshold | Action |
|-----|---------|-----------|--------|
| Critical vulnerabilities unpatched > 30 days | 3 | < 5 | Monitor closely |
| Failed login attempts (per day) | 500 | < 1000 | Normal |
| Privileged account growth (month-over-month) | +5% | < +10% | Review new accounts |
| Third-party vendor risk score changes | 2 vendors degraded | < 3 | Engage vendors |
| DLP alerts (data exfiltration attempts) | 15/week | < 20 | Normal |

**Reporting format for senior management:**
- **Executive dashboard:** Traffic-light view (Red/Yellow/Green) for each KPI
- **Trend lines:** Show improvement over time (quarterly comparison)
- **Risk heatmap:** Visual representation of risk across business units
- **Narrative:** One paragraph explaining notable changes, actions taken

**Your experience:** "I designed a security KPI dashboard for our CISO. It shows 12 key metrics updated monthly. Each KPI has a target, current value, trend arrow (improving/declining), and owner. The dashboard is reviewed monthly by leadership. When Mean Time to Remediate drifted from 5 days to 12 days, the dashboard triggered a conversation that resulted in additional resources for vulnerability management. KPIs drive accountability."

---

## 6.5 "What is your approach to conducting a **security audit** from planning to reporting and follow-up?"

**Answer Outline:**

**Audit lifecycle:**

**Phase 1: Planning (2-4 weeks before)**
- Define audit scope: Which systems, processes, or controls?
- Identify audit criteria: Which framework? (PCI-DSS, ISO 27001, CIS Controls)
- Request documentation: Policies, procedures, network diagrams, asset inventory
- Schedule interviews with system owners, admins, managers
- Prepare audit checklist based on scope and criteria

**Phase 2: Fieldwork / Evidence Collection (1-2 weeks)**
- **Document review:** Read policies, procedures, configurations
- **Interviews:** Talk to system owners, admins, operators about processes
- **Technical testing:** Verify controls are actually implemented:
  - "Policy says MFA required. Let me check—is MFA actually enabled on all admin accounts?"
  - "Policy says patching within 30 days. Let me check—are there unpatched systems?"
- **Evidence collection:** Screenshots, log samples, configuration exports, access reports
- **Sampling:** Can't check everything. Sample 20-30 items per control area for large environments.

**Phase 3: Analysis & Finding Development**
- Compare actual state vs. expected state (criteria)
- For each gap, document:
  - **Finding:** What's wrong?
  - **Criteria:** What should it be?
  - **Evidence:** How do you know it's wrong?
  - **Risk rating:** Critical / High / Medium / Low
  - **Root cause:** Why did this happen?
  - **Recommendation:** How to fix it?

**Phase 4: Reporting**
- **Executive summary:** 1 page for leadership. Key findings, overall assessment.
- **Detailed findings:** Each finding with evidence and recommendations.
- **Risk-based prioritization:** Critical findings first.
- **Management response:** Audit owner documents their remediation plan and timeline.

**Phase 5: Follow-up**
- Track remediation progress monthly
- Verify fixes are actually implemented (not just planned)
- Re-test critical findings after remediation
- Present status updates to audit committee

**Your experience:** "I've supported multiple internal and external audits (PCI-DSS, SOX, regulatory exams). I prepare evidence packages in advance: policy documents, configuration screenshots, access reviews, vulnerability scan reports, incident response records. During the audit, I serve as the security team's point of contact, answering auditor questions with specific evidence. In our last PCI-DSS audit, zero findings because of thorough pre-audit preparation and continuous monitoring."

---

## 6.6 "How do you ensure **policy compliance** across multiple business units and geographies?"

**Answer Outline:**

**Challenge:** Large banks have 50+ business units across 20+ countries. Each has different systems, teams, and regulatory requirements.

**Approach:**

1. **Global baseline policy:** Define minimum security standards applicable everywhere. Customize (add requirements) per region based on local regulations.

2. **Policy-as-code:** Convert policy requirements into automated checks:
   - AWS Config rules check: "All S3 buckets encrypted" → auto-flag violations
   - CIS benchmark scanning across all environments
   - "We can tell in real-time which business units are compliant"

3. **Compliance dashboards:** Real-time visibility per business unit. Each unit sees their compliance score.

4. **Governance structure:**
   - Global CISO → Regional CISOs → Business Unit Security Officers
   - Monthly compliance review meetings
   - Annual policy review and update cycle

5. **Training & awareness:** Localized training programs. Phishing simulations per geography.

6. **Exception management:** Business units can request exceptions to global policy. Must include risk assessment, business justification, compensating controls, and expiration date. Security team approves/denies.

7. **Audit program:** Regular audits across all units. Rotate focus areas. Share findings anonymized across units for learning.

---

## 6.7 "Describe how you would assess and manage **third-party / vendor risk** for a critical banking application."

**Answer Outline:**

**Vendor risk management lifecycle:**

1. **Pre-engagement:**
   - Risk questionnaire (SIG questionnaire: 150+ questions covering security, privacy, compliance)
   - SOC 2 Type II report review
   - Financial stability assessment
   - Regulatory compliance verification (PCI-DSS, SOX if applicable)

2. **Contract requirements:**
   - Data protection obligations (encryption, access control, breach notification)
   - Right-to-audit clause
   - SLA with security metrics (uptime, patching, incident response times)
   - Breach notification: Within 24-72 hours
   - Data handling and deletion requirements (on contract termination)
   - Cyber insurance requirements

3. **Ongoing monitoring:**
   - Annual risk reassessment
   - Continuous monitoring via security rating services (BitSight, SecurityScorecard)
   - Review vendor's SOC 2 report annually
   - Track vendor incidents (media monitoring)
   - Regular performance reviews against SLA

4. **Vendor tiering:**

| Tier | Criteria | Assessment Frequency | Assessment Depth |
|------|----------|---------------------|-----------------|
| **Critical** | Processes PCI/PII data; single point of failure | Quarterly review; annual full assessment | Full questionnaire + SOC 2 + pen test + on-site |
| **High** | Accesses internal network; handles confidential data | Semi-annual review | Questionnaire + SOC 2 review |
| **Medium** | Limited data access; replaceable | Annual review | Questionnaire only |
| **Low** | No data access; commodity service | Biennial | Light-touch review |

5. **Incident response with vendors:**
   - Contractual obligation: Vendor notifies us within 24 hours of security incident affecting our data
   - Joint IR plan: Tested annually with tabletop exercise
   - Vendor breach response: We assess our exposure, notify affected customers if needed

**Your experience:** "I manage vendor risk for 30+ banking vendors. Critical vendors undergo quarterly security reviews including SOC 2 analysis, BitSight score monitoring, and annual on-site assessments. When a critical SaaS vendor reported a breach, our pre-established IR process allowed us to assess impact within 4 hours, determine no customer data was affected, and document everything for our regulatory examiner."

---

## 6.8 "How do you prioritize remediation when audit findings and vulnerability reports are larger than available capacity?"

**Answer Outline:**

**Prioritization framework:**

**Step 1: Risk-based scoring**
- Combine: Vulnerability severity (CVSS) + Asset criticality + Exploit availability + Business context
- Not all "Critical" CVEs are equal: A critical vuln on an internet-facing payment server is higher priority than the same vuln on an isolated test server

**Step 2: Priority matrix**

| Priority | Criteria | Target Remediation Time |
|----------|----------|------------------------|
| **P1 (Emergency)** | Critical vuln + Internet-facing + Active exploit + PCI/SOX system | 24-48 hours |
| **P2 (Urgent)** | High vuln + Internal production + Known exploit available | 7 days |
| **P3 (Important)** | Medium vuln + Production systems | 30 days |
| **P4 (Routine)** | Low vuln OR non-production systems | 90 days |

**Step 3: Compensating controls (buy time)**
- If can't patch immediately, implement temporary controls:
  - WAF rule to block exploitation
  - Network ACL to restrict access
  - Enhanced monitoring/alerting
- Document compensating control and expiration date

**Step 4: Communication**
- Report to management: "We have 200 findings. 10 are P1 (addressing now), 30 are P2 (next sprint), 60 P3 (this quarter), 100 P4 (next quarter)."
- If capacity is insufficient for P1/P2: Escalate for additional resources
- "Never hide the gap. Present the risk, the plan, and the resource ask."

**Step 5: Track and report**
- Vulnerability management dashboard showing aging, priority, owner, status
- Weekly review of P1/P2; monthly review of P3/P4
- Regulatory audit prep: Show progress trend (declining open findings)

**Your experience:** "After a regulatory audit with 45 findings, I created a prioritized remediation plan. 5 critical findings addressed in first 2 weeks (compensating controls + permanent fixes). 15 high findings scheduled across next quarter. Remaining 25 medium/low findings tracked on 90-day timeline. I presented the plan to our risk committee with clear timelines, owners, and resource requirements. All critical findings were closed within 30 days."

---
