# PART 4: APPLICATION & WEB SECURITY (15–20 minutes)

---

## 4.1 "How do you explain **OWASP Top 10** and which three issues do you see most often in real projects?"

**Answer Outline:**

**OWASP Top 10** = Industry-standard list of the 10 most critical web application security risks, updated every ~3–4 years by the Open Web Application Security Project (OWASP).

**Current OWASP Top 10 (2021):**

| # | Category | What it means |
|---|----------|---------------|
| **A01** | **Broken Access Control** | Users can act outside their intended permissions (access other users' data, admin functions) |
| **A02** | **Cryptographic Failures** | Sensitive data exposed due to weak/missing encryption (PII, passwords in plaintext) |
| **A03** | **Injection** | Untrusted data sent to interpreter as part of command (SQL injection, OS command injection) |
| **A04** | **Insecure Design** | Missing or ineffective security controls built into design (threat modeling gaps) |
| **A05** | **Security Misconfiguration** | Default configs, unnecessary features enabled, missing security headers |
| **A06** | **Vulnerable & Outdated Components** | Using libraries/frameworks with known vulnerabilities (Log4j, Struts) |
| **A07** | **Identification & Authentication Failures** | Weak passwords, missing MFA, session fixation |
| **A08** | **Software & Data Integrity Failures** | CI/CD pipeline tampering, untrusted deserialization |
| **A09** | **Security Logging & Monitoring Failures** | Insufficient logging; breaches go undetected |
| **A10** | **Server-Side Request Forgery (SSRF)** | App fetches remote resource without validating user-supplied URL |

**Three most common in real projects:**

**1. Broken Access Control (A01):**
- "This is the #1 issue I see. Developers build authentication but forget authorization."
- Example: "User A can view User B's bank statement by changing the account ID in the URL from `/account/12345` to `/account/12346`."
- Fix: "Server-side access checks on every request. Never trust client-side validation alone. Use role-based access control (RBAC) middleware."
- Banking impact: "Customer can access another customer's financial data. Regulatory violation (GLBA, PCI-DSS)."

**2. Injection (A03):**
- "SQL injection is still alive. Developers use string concatenation for database queries instead of parameterized queries."
- Example: Login form where username field accepts `' OR 1=1 --` → bypasses authentication.
- Fix: "Parameterized queries / prepared statements. Input validation. WAF rules. Code review for concatenation patterns."
- Banking impact: "Attacker dumps entire customer database. Catastrophic breach."

**3. Security Misconfiguration (A05):**
- "Default admin passwords, debug mode enabled in production, unnecessary ports open, missing security headers."
- Example: "Production server running with `DEBUG=True` → exposes stack traces with database credentials."
- Fix: "Hardening checklist (CIS benchmarks). Automated config scanning. Infrastructure-as-code with security baselines."
- Banking impact: "Attacker discovers internal architecture from error messages. Uses information for targeted attack."

**Your approach:** "I ensure OWASP Top 10 is part of our secure SDLC. Developers are trained on these vulnerabilities. Code reviews check for injection and access control issues. SAST/DAST tools scan for all 10 categories. WAF provides runtime protection. We track OWASP-related findings as KPIs."

---

## 4.2 "How would you secure an **internet banking web application** end-to-end?"

**Answer Outline:**

**End-to-end security for internet banking application:**

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: NETWORK & PERIMETER                                  │
│  - DDoS protection (AWS Shield / Cloudflare)                   │
│  - WAF (OWASP Top 10 rules, rate limiting, bot detection)      │
│  - NGFW (stateful inspection, IPS)                             │
│  - TLS 1.3 everywhere (HSTS headers, certificate pinning)      │
│  - DNS filtering (block malicious domains)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: AUTHENTICATION & SESSION MANAGEMENT                  │
│  - MFA (password + OTP/biometric)                              │
│  - Risk-based authentication (new device → step-up auth)       │
│  - Session tokens: secure, HttpOnly, SameSite cookies          │
│  - Session timeout: 15 min idle, 8 hours absolute              │
│  - Account lockout after 5 failed attempts                     │
│  - CAPTCHA after 3 failed attempts                             │
│  - Password policy: 12+ chars, complexity, no reuse            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: APPLICATION SECURITY                                 │
│  - Input validation (server-side, whitelist approach)           │
│  - Output encoding (prevent XSS)                               │
│  - Parameterized queries (prevent SQL injection)               │
│  - CSRF tokens on all state-changing requests                  │
│  - Content Security Policy (CSP) headers                       │
│  - X-Frame-Options: DENY (prevent clickjacking)                │
│  - Security headers (X-Content-Type-Options, Referrer-Policy)  │
│  - API authentication (OAuth 2.0 + JWT)                        │
│  - Rate limiting on all API endpoints                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: DATA PROTECTION                                      │
│  - Encryption at rest: AES-256 for all customer data           │
│  - Encryption in transit: TLS 1.3                              │
│  - Field-level encryption for PII (SSN, account numbers)       │
│  - Data masking in non-production environments                  │
│  - Key management via HSM/KMS (rotation every 90 days)         │
│  - PCI-DSS compliance for card data (tokenization)             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 5: MONITORING & INCIDENT RESPONSE                       │
│  - SIEM: All security events logged and correlated             │
│  - Real-time alerts for brute force, SQL injection attempts    │
│  - Transaction monitoring (unusual patterns → fraud detection) │
│  - Audit logging: Who accessed what, when, from where          │
│  - Incident response playbooks for banking-specific threats    │
│  - 24/7 SOC monitoring                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Additional controls:**
- **Secure SDLC:** Threat modeling → secure coding → SAST/DAST → pen testing → deployment.
- **Third-party risk:** All libraries scanned for vulnerabilities (SCA). No known-vulnerable components in production.
- **Business logic validation:** "Transfer $10,000" → verify sender has sufficient funds, verify recipient exists, check daily limits, flag unusual amounts.
- **Fraud detection:** "Normal user transfers $500/month. New transfer of $50,000 to unknown account → flag and require additional verification."

**Your experience:** "In our internet-facing applications, we implement defense in depth: WAF at the edge for OWASP protection, MFA for authentication, parameterized queries and input validation in code, encryption for all data, and SIEM for monitoring. We've prevented SQL injection attempts (blocked by WAF), credential stuffing (stopped by MFA + rate limiting), and session hijacking (secure cookies + session management). Our approach has maintained zero customer data breaches."

---

## 4.3 "How do you handle **input validation**, **output encoding**, and **authentication/authorization** in secure design?"

**Answer Outline:**

### Input Validation

**Principle:** "Never trust user input. Validate everything on the server side."

**Approach:**
- **Whitelist validation:** Define what's allowed, reject everything else.
  - Example: "Account number field: only digits, exactly 10 characters. Reject anything with letters or special characters."
- **Server-side validation:** Client-side validation is for UX only; attacker can bypass it.
  - "Even if JavaScript validates the form, the server must re-validate."
- **Type checking:** Ensure data matches expected type (integer, string, date).
- **Length limits:** "Username: 3–50 characters. Comment field: max 500 characters."
- **Encoding-aware:** Validate after decoding (prevent double-encoding attacks).
- **Reject known-bad patterns:** Block SQL keywords (`SELECT`, `DROP`, `--`), script tags (`<script>`).

### Output Encoding

**Principle:** "Encode output before rendering to prevent XSS."

**Approach:**
- **Context-aware encoding:**
  - HTML context: `&lt;` instead of `<`
  - JavaScript context: `\x3C` instead of `<`
  - URL context: `%3C` instead of `<`
  - CSS context: `\003C` instead of `<`
- **Use framework auto-encoding:** React, Angular auto-encode output by default. Don't bypass it (`dangerouslySetInnerHTML` in React = bad).
- **Content Security Policy (CSP):** Prevent inline scripts: `Content-Security-Policy: script-src 'self'`
- **Template engines:** Use template engines that auto-escape (Jinja2, Handlebars).

### Authentication

**Principle:** "Verify identity securely."

**Approach:**
- **Password storage:** bcrypt/scrypt/Argon2 hashing (not MD5/SHA1). Salt each password.
- **MFA:** Mandatory for banking apps. SMS is acceptable; authenticator app is better; FIDO2 is best.
- **Session management:** Cryptographically random session IDs. Regenerate after login. HttpOnly + Secure + SameSite cookies.
- **Credential recovery:** "Forgot password" uses email verification + MFA, not security questions.

### Authorization

**Principle:** "Verify permissions on every request."

**Approach:**
- **Server-side checks:** Every API endpoint checks if the authenticated user has permission for the requested action.
  - "User requests `/api/account/12345/statement` → Server checks: Does this user own account 12345? If not, deny."
- **RBAC middleware:** Centralized authorization layer. Roles: `customer`, `teller`, `manager`, `admin`. Permissions mapped to roles.
- **Object-level access control:** "Don't just check 'can user access accounts?'—check 'can user access THIS specific account?'"
- **Principle of least privilege:** Default deny. Only grant what's explicitly needed.

**Your experience:** "In our secure design reviews, I focus on these four areas as the foundation. We've caught authorization bypass vulnerabilities during code review—where the developer checked authentication but skipped authorization. In one case, any authenticated user could access any other user's data by changing the account ID. We fixed it by implementing object-level authorization middleware."

---

## 4.4 "How do you protect against **SQL injection**, **XSS**, and **CSRF**? Give practical controls."

**Answer Outline:**

### SQL Injection

**What:** Attacker inserts SQL code into input fields, modifying backend queries.

**Example (vulnerable code):**
```sql
-- Attacker enters username: ' OR 1=1 --
SELECT * FROM users WHERE username = '' OR 1=1 --' AND password = 'anything'
-- Result: Returns ALL users (authentication bypassed)
```

**Controls:**
1. **Parameterized queries / Prepared statements (PRIMARY):**
   ```python
   # SAFE: Parameter is treated as data, not SQL code
   cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
   ```
2. **ORM usage:** Use ORM (SQLAlchemy, Hibernate, Entity Framework) that auto-parameterizes.
3. **Input validation:** Reject SQL keywords in user inputs.
4. **WAF rules:** Block requests containing SQL injection patterns.
5. **Database least privilege:** App database account has only SELECT/INSERT/UPDATE—not DROP, CREATE, ALTER.
6. **Stored procedures:** Reduce direct SQL in application code.

### Cross-Site Scripting (XSS)

**What:** Attacker injects malicious JavaScript into web page viewed by other users.

**Types:**
- **Stored XSS:** Malicious script saved in database (e.g., comment field), executed when other users view the page.
- **Reflected XSS:** Malicious script in URL parameter, reflected in page response.
- **DOM-based XSS:** Client-side JavaScript manipulates DOM unsafely.

**Controls:**
1. **Output encoding (PRIMARY):** Encode all user-supplied data before rendering.
2. **Content Security Policy (CSP):** `Content-Security-Policy: script-src 'self'` — prevents inline scripts.
3. **HttpOnly cookies:** JavaScript can't access session cookies (prevents session theft via XSS).
4. **Input validation:** Strip or reject HTML tags in text inputs.
5. **WAF rules:** Block requests containing script tags.
6. **Framework protection:** Use React/Angular/Vue that auto-encode output.

### Cross-Site Request Forgery (CSRF)

**What:** Attacker tricks authenticated user into making unintended request to the application.

**Example:** "User is logged into bank. Visits attacker's site. Attacker's page sends hidden form POST to `bank.com/transfer?to=attacker&amount=10000`. Browser includes user's session cookie. Bank processes transfer."

**Controls:**
1. **CSRF tokens (PRIMARY):** Unique, unpredictable token in every form. Server validates token on submission. Attacker doesn't know the token.
2. **SameSite cookies:** `Set-Cookie: session=xyz; SameSite=Strict` — browser won't send cookie with cross-site requests.
3. **Origin/Referer header validation:** Reject requests from unexpected origins.
4. **Double-submit cookie:** CSRF token sent as both cookie and hidden form field. Server verifies they match.
5. **Re-authentication for sensitive operations:** "Transferring $10,000? Enter password again."

**Your experience:** "We implement all three defenses in layers. Parameterized queries eliminate SQL injection at the source. Output encoding + CSP headers stop XSS. CSRF tokens + SameSite cookies prevent CSRF. Our SAST tools scan for these patterns in every code commit. WAF provides additional runtime protection. In our last pen test, zero SQL injection, XSS, or CSRF vulnerabilities were found."

---

## 4.5 "What is **secure SDLC** and how have you implemented or improved it in your previous role?"

**Answer Outline:**

**Secure SDLC (Software Development Life Cycle)** = Integrating security activities into every phase of software development, not just at the end.

**Phases:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ PLANNING │ →  │  DESIGN  │ →  │  BUILD   │ →  │  TEST    │ →  │ DEPLOY   │ →  │ OPERATE  │
│          │    │          │    │          │    │          │    │          │    │          │
│Security: │    │Security: │    │Security: │    │Security: │    │Security: │    │Security: │
│- Risk    │    │- Threat  │    │- Secure  │    │- SAST    │    │- Config  │    │- Monitor │
│  assess  │    │  model   │    │  code    │    │- DAST    │    │  review  │    │- Patch   │
│- Req     │    │- Security│    │- Code    │    │- SCA     │    │- Pen test│    │- Incident│
│  gather  │    │  design  │    │  review  │    │- Manual  │    │- Sign-off│    │  response│
│          │    │  review  │    │          │    │  test    │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Key activities per phase:**

| Phase | Security Activity | Detail |
|-------|------------------|--------|
| **Planning** | Security requirements | "What data does this app handle? PCI? PII? What compliance applies?" |
| **Design** | Threat modeling | STRIDE analysis: Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege |
| **Build** | Secure coding + code review | Developers follow secure coding guidelines. Security-focused code review. |
| **Test** | SAST, DAST, SCA, manual testing | Automated scanning + manual penetration testing |
| **Deploy** | Configuration review + pen test | Final security gate before production |
| **Operate** | Monitoring, patching, IR | Continuous monitoring, vulnerability management, incident response |

**How I improved secure SDLC:**

1. **Before (gaps):** Security was only checked at the end (pen test before release). Expensive to fix late-stage vulnerabilities.

2. **Changes I implemented:**
   - **Threat modeling in design phase:** Required STRIDE analysis for every new feature. Template provided to dev team.
   - **SAST in CI/CD:** Integrated SonarQube into pipeline. Every commit scanned. Build fails on critical/high severity findings.
   - **Developer training:** Quarterly secure coding workshop. Focus on OWASP Top 10 with hands-on examples.
   - **Security champion program:** One developer per team designated as security champion. They attend extra training, do first-pass security review.
   - **Automated dependency scanning (SCA):** Integrated Snyk into CI/CD. Alerts when library has known CVE. Block merge if critical CVE.
   - **Pre-deployment security gate:** Checklist before production: SAST clean, DAST clean, pen test complete, threat model reviewed.

3. **Results:**
   - "Reduced production security bugs by 60%."
   - "Average cost to fix a vulnerability dropped from $5,000 (found in testing) to $500 (found in code review)."
   - "Dev teams now proactively raise security concerns in design phase instead of waiting for security team to find issues."

---

## 4.6 "How do you integrate **SAST, DAST, and SCA** into CI/CD pipelines?"

**Answer Outline:**

| Tool | What it does | When it runs | What it catches |
|------|-------------|-------------|-----------------|
| **SAST** (Static Application Security Testing) | Scans source code without executing it | At code commit / PR | SQL injection, XSS, hardcoded secrets, insecure patterns |
| **DAST** (Dynamic Application Security Testing) | Scans running application by sending requests | In staging/QA environment | Authentication issues, misconfigurations, runtime vulnerabilities |
| **SCA** (Software Composition Analysis) | Scans third-party dependencies | At code commit / build | Known CVEs in libraries (e.g., Log4Shell, Spring4Shell) |

**CI/CD integration architecture:**

```
Developer commits code
        ↓
┌───────────────────────────────────────┐
│  CI PIPELINE (GitHub Actions/Jenkins) │
│                                       │
│  Stage 1: Build                       │
│    └─ Compile, unit tests             │
│                                       │
│  Stage 2: SAST Scan                   │
│    └─ SonarQube / Checkmarx / Veracode│
│    └─ Scan source code                │
│    └─ ❌ FAIL BUILD if Critical/High  │
│                                       │
│  Stage 3: SCA Scan                    │
│    └─ Snyk / Dependabot / WhiteSource │
│    └─ Check dependencies for CVEs     │
│    └─ ❌ FAIL BUILD if Critical CVE   │
│                                       │
│  Stage 4: Secret Scanning             │
│    └─ GitLeaks / TruffleHog           │
│    └─ Check for hardcoded passwords,  │
│       API keys, tokens                │
│    └─ ❌ FAIL BUILD if secret found   │
│                                       │
│  Stage 5: Deploy to Staging           │
│    └─ Deploy application to QA env    │
│                                       │
│  Stage 6: DAST Scan                   │
│    └─ OWASP ZAP / Burp Suite / Rapid7 │
│    └─ Scan running application        │
│    └─ Report findings (don't fail     │
│       build, but alert security team) │
│                                       │
│  Stage 7: Security Gate               │
│    └─ Security team reviews findings  │
│    └─ Approve/reject promotion to prod│
└───────────────────────────────────────┘
        ↓
Production deployment
```

**Key decisions:**
- **SAST + SCA block the build** (shift-left: catch early, fix cheap)
- **DAST reports findings** but doesn't block (runs on deployed staging; blocking would slow releases)
- **Secret scanning blocks** (hardcoded secrets are always critical)
- **Security gate before production:** Human review of all findings. Security team approves.

**Tuning to reduce false positives:**
- "SAST tools are noisy. We spent 2 sprints tuning SonarQube rules: disabled rules not relevant to our stack, adjusted severity thresholds, created exceptions for known-safe patterns."
- "SCA findings: We assess CVE exploitability in our context. 'CVE in library X' but we don't use the affected function → mark as 'accepted risk.'"

**Your experience:** "We integrated SonarQube (SAST) and Snyk (SCA) into our GitHub Actions pipeline. Builds fail on critical/high findings. OWASP ZAP runs DAST against staging nightly. Results feed into Jira for tracking. Before production deployment, security team reviews the dashboard. This shifted security left and reduced production vulnerabilities by 60%. Developers now fix issues in the same sprint they're introduced."

---

## 4.7 "What is **API security** and what common weaknesses do you check for in REST APIs?"

**Answer Outline:**

**Why API security matters:** "Modern banking apps are API-first. Mobile app, web app, and partner systems all communicate via REST APIs. A vulnerable API = direct access to banking data."

**Common API weaknesses (OWASP API Security Top 10):**

| # | Weakness | Example | Control |
|---|----------|---------|---------|
| **1** | **Broken Object Level Authorization (BOLA)** | `GET /api/accounts/12345` → change to `12346` → access other user's data | Object-level auth checks on every request |
| **2** | **Broken Authentication** | Weak API keys, no token expiration, no rate limiting on auth endpoints | OAuth 2.0 + JWT with short TTL + refresh tokens |
| **3** | **Excessive Data Exposure** | API returns full user object including SSN, DOB when only name is needed | Return only necessary fields; response filtering |
| **4** | **Lack of Resources & Rate Limiting** | No rate limit → attacker sends 1M requests/min → DoS or brute force | Rate limiting per user/IP; throttling |
| **5** | **Broken Function Level Authorization** | Regular user can call admin endpoints (`DELETE /api/users/123`) | Role-based access on every endpoint |
| **6** | **Mass Assignment** | Attacker sends `{"role": "admin"}` in request body → app blindly assigns | Whitelist allowed fields; ignore unexpected params |
| **7** | **Security Misconfiguration** | CORS set to `*`, debug endpoints exposed, verbose error messages | Hardened config; production-ready settings |
| **8** | **Injection** | SQL/NoSQL injection via API parameters | Input validation + parameterized queries |
| **9** | **Improper Asset Management** | Old API version still running with known vulnerabilities | API inventory; deprecate old versions |
| **10** | **Insufficient Logging** | API calls not logged → can't detect or investigate breaches | Log all API calls; alert on anomalies |

**API security controls I implement:**

1. **Authentication:** OAuth 2.0 with JWT tokens. Short-lived access tokens (15 min). Refresh tokens stored securely.
2. **Authorization:** RBAC middleware checks permissions on every endpoint. Object-level auth for resource access.
3. **Input validation:** JSON schema validation. Reject unexpected fields. Type/length checks.
4. **Rate limiting:** Per-user, per-IP, per-endpoint limits. Configurable. Alert on threshold breach.
5. **API gateway:** Centralized entry point (Kong, AWS API Gateway, Apigee). Handles auth, rate limiting, logging, versioning.
6. **Encryption:** TLS 1.3 for all API traffic. Mutual TLS (mTLS) for internal service-to-service APIs.
7. **Logging & monitoring:** Every API call logged (request, response status, user, timestamp). SIEM alerts on unusual patterns.
8. **API versioning:** Deprecated versions removed after migration period. No zombie APIs.

**Your experience:** "I've reviewed and secured REST APIs for customer-facing banking services. Key findings in previous assessments: BOLA (most common—developers authenticated users but didn't check if they owned the requested resource), excessive data exposure (API returning full user profiles including sensitive fields), and missing rate limiting. After implementing object-level auth, response filtering, and rate limiting via API gateway, we eliminated these categories of vulnerabilities."

---

## 4.8 "Explain how you would review and sign off on a **threat model** for a new application."

**Answer Outline:**

**Threat modeling process:**

**Step 1: Understand the application**
- "What does it do? What data does it handle? Who are the users?"
- Create data flow diagram (DFD): Show how data moves through the system.
- Identify trust boundaries: Where does data cross from trusted to untrusted zone?
- Example: "New mobile payment feature: Customer → Mobile App → API Gateway → Payment Service → Bank Core System → External Payment Network (Visa/Mastercard)"

**Step 2: Identify threats (STRIDE model)**

| STRIDE | Threat | Example for Payment App |
|--------|--------|------------------------|
| **S**poofing | Impersonating another user | Attacker uses stolen session token to make payment as victim |
| **T**ampering | Modifying data in transit | Attacker modifies payment amount from $10 to $10,000 during transmission |
| **R**epudiation | Denying an action | Customer claims they didn't authorize a payment (insufficient audit trail) |
| **I**nformation Disclosure | Exposing sensitive data | API returns full card number instead of masked version |
| **D**enial of Service | Making service unavailable | Flood payment endpoint with requests → legitimate customers can't pay |
| **E**levation of Privilege | Gaining unauthorized access | Regular customer calls admin API endpoint to view all transactions |

**Step 3: Assess risk (Likelihood × Impact)**
- For each threat, assess:
  - **Likelihood:** How easy is it to exploit? (Low / Medium / High)
  - **Impact:** What's the business damage? (Low / Medium / High / Critical)
- Focus on high-likelihood + high-impact threats first.

**Step 4: Define mitigations**
- For each high-risk threat, define specific controls:
  - Spoofing → MFA + session management
  - Tampering → TLS + digital signatures on transactions
  - Repudiation → Comprehensive audit logging
  - Info Disclosure → Data masking + field-level encryption
  - DoS → Rate limiting + DDoS protection
  - Elevation → RBAC + object-level authorization

**Step 5: Review and sign-off**
- "I review the threat model document with the development team, architecture team, and compliance."
- **Checklist for sign-off:**
  - [ ] All data flows documented
  - [ ] Trust boundaries identified
  - [ ] STRIDE analysis complete
  - [ ] All high/critical risks have defined mitigations
  - [ ] Mitigations are technically feasible and scheduled for implementation
  - [ ] Residual risks documented and accepted by business owner
  - [ ] Compliance requirements addressed (PCI-DSS for payment data)
  - [ ] Threat model document stored in repository for future reference

**Your experience:** "I've led threat modeling sessions using STRIDE for new banking features. In one case, we identified an elevation of privilege risk where the mobile app could call admin APIs. This was caught in design phase, saving significant rework. We now require threat models for all new features handling PII or financial data before development begins. I sign off on the model only when all high/critical risks have defined mitigations with implementation timelines."

---
