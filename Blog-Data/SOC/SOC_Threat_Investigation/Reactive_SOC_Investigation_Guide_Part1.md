# 🔍 Reactive SOC Investigation Guide — Part 1: Deep-Dive TP Determination Framework

---

# PART 1: ALERT INVESTIGATION METHODOLOGY & ENDPOINT/MALWARE DEEP DIVES

---

## 1. Reactive Investigation — Core Philosophy

### 1.1 What Makes This Guide Different?

| Proactive (Threat Hunting) | Reactive (This Guide) |
|---------------------------|----------------------|
| You go looking for threats | Alert comes TO you |
| Hypothesis-driven | Alert-driven |
| "What might be hiding?" | "Is THIS alert real?" |
| Broad scope | Focused on specific alert |
| Schedule-based | Real-time / SLA-driven |
| Output: new detections | Output: TP/FP verdict + response |

### 1.2 The TP Determination Mindset

```
┌───────────────────────────────────────────────────────────────────────┐
│              THE ANALYST'S INVESTIGATION MINDSET                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ❌ WRONG MINDSET:                                                   │
│     "This alert fired, it must be real. Let me confirm it."          │
│     "This looks like a false positive, let me close it quickly."     │
│                                                                       │
│  ✅ CORRECT MINDSET:                                                 │
│     "I have a SECURITY EVENT. I don't know if it's malicious yet."   │
│     "I will gather evidence, analyze context, and form a judgment."  │
│     "I will prove or disprove malicious intent with DATA."           │
│                                                                       │
│  KEY PRINCIPLES:                                                      │
│  1. Never assume TP or FP until you have EVIDENCE                    │
│  2. Context is everything — same activity can be TP or FP            │
│  3. Ask "WHY would this happen legitimately?"                        │
│  4. Ask "WHY would an attacker do this?"                             │
│  5. Correlate: One indicator is suspicious, three is a pattern       │
│  6. Document EVERYTHING — your notes are evidence                    │
│  7. When in doubt, ESCALATE — never close unsure as FP              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Universal Deep-Dive Investigation Framework

### 2.1 The 7-Layer Investigation Model

Every alert, regardless of type, should be investigated using this layered approach:

```
┌────────────────────────────────────────────────────────────────────────┐
│              7-LAYER DEEP INVESTIGATION MODEL                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  LAYER 1: ALERT CONTEXT  (What triggered this?)                       │
│  ├─ What rule/signature/detection fired?                               │
│  ├─ What is the rule logic? (understand WHY it triggered)             │
│  ├─ What is the severity and confidence level?                        │
│  ├─ Has this rule produced FPs before? (check tuning history)         │
│  └─ Is this part of a known alert storm or rule issue?                │
│                                                                        │
│  LAYER 2: ACTOR CONTEXT  (Who did this?)                              │
│  ├─ What user account was involved?                                   │
│  ├─ What is their role? (IT admin vs. HR vs. executive)               │
│  ├─ Is this normal behavior for this user?                            │
│  ├─ Have they been involved in prior alerts?                          │
│  ├─ Is the account a service account, shared, or personal?           │
│  └─ Has the account shown signs of compromise? (impossible travel)   │
│                                                                        │
│  LAYER 3: ASSET CONTEXT  (Where did this happen?)                     │
│  ├─ What system/endpoint is involved?                                 │
│  ├─ Is it a workstation, server, DC, or cloud resource?              │
│  ├─ What is its criticality? (crown jewel, standard, DMZ)            │
│  ├─ What software/services run on this asset?                        │
│  ├─ Is this asset part of an admin tier?                              │
│  └─ Has this asset been involved in prior incidents?                  │
│                                                                        │
│  LAYER 4: TEMPORAL CONTEXT  (When did this happen?)                   │
│  ├─ What time did the event occur? (business hours vs. off-hours)    │
│  ├─ Was there a change window or maintenance scheduled?              │
│  ├─ Does this correlate with user's normal work schedule?            │
│  ├─ Did similar events occur before/after? (pattern?)                │
│  └─ Does the timing match known threat campaign patterns?             │
│                                                                        │
│  LAYER 5: TECHNICAL ANALYSIS  (What exactly happened?)               │
│  ├─ Full process chain analysis (parent → child tree)                │
│  ├─ Command line argument analysis                                    │
│  ├─ Network connection analysis (src, dst, port, protocol)           │
│  ├─ File analysis (hash, origin, behavior in sandbox)                │
│  ├─ Authentication analysis (how did they get access?)               │
│  └─ Correlation with other log sources                                │
│                                                                        │
│  LAYER 6: THREAT INTELLIGENCE  (Is this known bad?)                  │
│  ├─ Check IOCs against threat intel (VirusTotal, OTX, MISP)         │
│  ├─ Check IP/domain reputation (AbuseIPDB, Shodan, Talos)           │
│  ├─ Match file hash against known malware databases                  │
│  ├─ Check MITRE ATT&CK for technique identification                 │
│  └─ Check recent threat reports for matching TTPs                     │
│                                                                        │
│  LAYER 7: IMPACT ASSESSMENT  (How bad is this?)                      │
│  ├─ What data/systems are at risk?                                   │
│  ├─ Has the attacker achieved their objective?                       │
│  ├─ What is the blast radius? (affected scope)                       │
│  ├─ Is containment needed immediately?                                │
│  └─ What is the business and regulatory impact?                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Evidence Strength Matrix

Not all evidence carries equal weight. Rate your findings:

| Evidence Level | Description | Examples | TP Likelihood |
|---------------|-------------|---------|---------------|
| 🔴 **Definitive** | Irrefutable proof of malicious activity | Known malware hash, confirmed C2 traffic, ransom note | 99%+ |
| 🟠 **Strong** | Multiple correlated indicators pointing to malicious | Encoded PowerShell + C2 beaconing + new persistence | 85-99% |
| 🟡 **Moderate** | Suspicious but could have legitimate explanation | LOLBin execution, unusual logon hours, new scheduled task | 50-85% |
| 🟢 **Weak** | Single anomaly with many legitimate explanations | Single failed login, large file download, new software install | 10-50% |
| ⚪ **Informational** | Normal variation or known-benign activity | IT admin running admin tools, scheduled backup job | <10% |

### 2.3 Correlation Multiplier — The Power of Combined Evidence

```
Single anomaly     = Suspicious (investigate further)
Two correlated     = Concerning (deep dive required)
Three correlated   = Probable TP (begin containment planning)
Four+ correlated   = Confirmed TP (contain immediately + investigate)

Example:  
  1. PowerShell -Enc execution               → 🟡 Moderate alone
  2. + From a non-IT user workstation         → 🟠 Now Strong
  3. + Beacon-like outbound connections       → 🔴 Near Definitive
  4. + Followed by LSASS access              → 🔴 CONFIRMED TP — CONTAIN NOW
```

---

## 3. Deep-Dive: Endpoint Alert Investigation

### 3.1 Suspicious Process Execution Alert

**Alert Example:** "Suspicious process execution detected — powershell.exe with encoded command on WKST-FIN-042"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: DECODE THE COMMAND (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Extract the -Enc (Base64) value from the alert
□ Decode it: [System.Text.Encoding]::Unicode.GetString(
    [System.Convert]::FromBase64String('<encoded_string>'))
□ Read the decoded command — what does it DO?

  IF decoded contains:
    → IEX / Invoke-Expression + Download    = 🔴 Download cradle
    → Net.WebClient / Invoke-WebRequest     = 🔴 Downloading payload
    → -WindowStyle Hidden / -W Hidden       = 🔴 Hiding from user
    → Start-Process with remote binary      = 🔴 Executing downloaded file
    → AMSI bypass strings                   = 🔴 Evading detection
    → Get-Process / Get-Service             = 🟡 Could be recon or admin
    → Set-ExecutionPolicy Bypass            = 🟠 Enabling script execution

  IF decoded contains:
    → Known IT automation scripts           = 🟢 Likely FP
    → SCCM / Intune / GPO script patterns  = 🟢 Likely management tool
    → Software installation commands        = 🟡 Verify with IT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: ANALYZE PROCESS TREE (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What is the PARENT process of powershell.exe?

  SUSPICIOUS PARENTS (🔴):
    → WINWORD.EXE / EXCEL.EXE / OUTLOOK.EXE  (macro execution)
    → wscript.exe / cscript.exe               (script launched PS)
    → mshta.exe                                (HTA launched PS)
    → WmiPrvSE.exe                             (WMI remote execution)
    → services.exe                             (service-based execution)
    → cmd.exe with /c or /k                    (chained execution)
    → rundll32.exe                             (DLL-based launch)

  NORMAL PARENTS (🟢):
    → explorer.exe    (user manually opened PowerShell)
    → svchost.exe     (system service — check which service)
    → sccm/intune     (management tool — verify deployment)
    → scheduled task   (verify task is legitimate)

□ What CHILD processes did PowerShell spawn?

  SUSPICIOUS CHILDREN (🔴):
    → cmd.exe, certutil.exe, bitsadmin.exe     (tool download/exec)
    → net.exe, nltest.exe, whoami.exe           (discovery)
    → reg.exe (add Run key)                     (persistence)
    → schtasks.exe                              (persistence)
    → mshta.exe, rundll32.exe                   (further execution)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: CHECK NETWORK CONNECTIONS (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Did the PowerShell process make outbound connections?
   → Sysmon Event 3 / EDR network telemetry / Firewall logs

□ Where did it connect to?
   → External IP?  Check: VirusTotal, AbuseIPDB, Shodan
   → External domain?  Check: WHOIS (age, registrar), URLScan.io
   → Internal IP?  Could be lateral movement

□ What was downloaded?
   → Check proxy logs for the URL
   → What content type was returned?
   → Was it a script (.ps1), binary (.exe), or DLL?

□ Was there beaconing behavior after initial connection?
   → Regular interval connections = C2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: CHECK USER AND ASSET CONTEXT (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Who is the user on WKST-FIN-042?
   → Finance user running encoded PowerShell = 🔴 (not their job)
   → IT admin on their assigned workstation = 🟡 (possible but verify)

□ Is this workstation known for IT activity?
   → Standard user workstation running admin tools = 🔴
   → IT admin jump box = 🟡 (still verify the specific command)

□ Check user's alert history:
   → First-time alert = could be fresh compromise
   → Repeat alerts = either persistent issue or ongoing attack

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: MAKE VERDICT (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Score your findings:

  CONFIRM TP IF:
  ✓ Decoded command = download cradle / C2 beacon / credential theft
  ✓ Parent process = Office app, script engine, or unexpected parent
  ✓ Network connection to known-bad or newly registered domain
  ✓ User has no legitimate reason for this activity
  ✓ Post-execution: persistence / discovery / credential access seen

  CONFIRM FP IF:
  ✓ Decoded command = known IT automation script  
  ✓ Parent process = SCCM, Intune, GPO, or IT tool
  ✓ Network connection to internal management server
  ✓ User is IT admin performing documented task
  ✓ Activity matches known change window
  ✓ Same alert fires on many machines = deployment push

  ESCALATE IF UNSURE:
  ✓ Command is obfuscated beyond your analysis capability
  ✓ Conflicting signals (admin user but suspicious command)
  ✓ New technique you haven't seen before
```

---

### 3.2 Suspicious File/Malware Detection Alert

**Alert Example:** "Malicious file detected — `update_client.exe` with high-risk score on SVR-APP-019"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: FILE STATIC ANALYSIS (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Collect file metadata:
   → Full file path:  C:\ProgramData\update_client.exe
   → File size:       [note size — tiny or huge is suspicious]
   → Creation time:   [when was it dropped?]
   → Modified time:   [matches creation? or timestomped?]
   → File hash:       SHA256 = [calculate]

□ Check hash on VirusTotal:
   → 0 detections = unknown (not necessarily clean — could be new)
   → 1-5 detections = possibly suspicious (check which AVs detected)
   → 10+ detections = likely malicious → 🔴
   → 30+ detections = confirmed malware → 🔴 DEFINITIVE

□ Check code signing:
   → Unsigned executable in ProgramData → 🔴 SUSPICIOUS
   → Signed by Microsoft/known vendor → 🟢 (but verify hash)
   → Signed by unknown/expired cert → 🟠 INVESTIGATE
   → Self-signed certificate → 🔴 SUSPICIOUS

□ Check file naming:
   → Does name mimic legitimate software? (update_client, svchost)
   → Double extension? (report.pdf.exe) → 🔴
   → Random characters? (a3f8x9.exe) → 🔴
   → Matches legitimate software exactly? Verify path is correct

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: FILE ORIGIN — HOW DID IT GET THERE? (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Check Sysmon Event 11 (File Create):
   → What process CREATED this file?

  SUSPICIOUS ORIGINS (🔴):
   → powershell.exe    (downloaded via script)
   → cmd.exe           (downloaded via certutil/bitsadmin)
   → outlook.exe       (email attachment saved)
   → browser process   (downloaded from web)
   → wmiprvse.exe      (WMI remote file drop)
   → services.exe      (service-based file creation)

  NORMAL ORIGINS (🟢):
   → msiexec.exe       (software installer — verify legitimacy)
   → setup.exe         (installation — verify source)
   → sccm/intune agent (management deployment)
   → windows update    (legitimate update)

□ Check browser download history / proxy logs:
   → What URL was the file downloaded from?
   → Was the domain legitimate or suspicious?

□ Check email logs:
   → Was this file attached to an email?
   → Was the email from a known sender?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: FILE EXECUTION ANALYSIS (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Did the file EXECUTE? (Critical question)
   → Sysmon Event 1: was update_client.exe started as a process?
   → If NOT executed: lower risk (file was only dropped, not run)
   → If EXECUTED: high risk → full investigation required

□ If executed, what did it DO?
   → Child processes spawned?
   → Network connections made? (Sysmon Event 3)
   → Files created/modified? (Sysmon Event 11)
   → Registry changes? (Sysmon Event 13)
   → LSASS accessed? (Sysmon Event 10)

□ Sandbox analysis (if available):
   → Submit file hash to Any.Run, Hybrid Analysis, Joe Sandbox
   → Review behavioral report:
     - Does it establish persistence?
     - Does it connect to C2?
     - Does it access credentials?
     - Does it perform discovery?
     - Does it encrypt files?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: SCOPE AND SPREAD (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Is this file on other endpoints?
   → EDR: search for same file hash across environment
   → How many hosts have this file? 1 = targeted, 100 = campaign

□ Is this part of a known malware family?
   → VirusTotal: check "Community" and "Relations" tabs
   → Check if linked to known APT group or ransomware strain

□ Are other IOCs from sandbox analysis present in environment?
   → Search for C2 domains/IPs in DNS and proxy logs
   → Search for related file hashes on other endpoints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  CONFIRM TP IF:
  ✓ VT detections > 5 from reputable engines
  ✓ File dropped by suspicious process (PS, cmd, browser)
  ✓ File is unsigned or signed with suspicious cert
  ✓ File executed and made C2 connections
  ✓ Sandbox confirms malicious behavior

  CONFIRM FP IF:
  ✓ VT detections = 0 with high submission count (well-known clean)
  ✓ File is from legitimate software installation
  ✓ Signed by verified vendor with valid certificate
  ✓ File path matches expected software location
  ✓ IT confirms planned deployment
  ✓ AV triggered on heuristic with no behavioral confirmation
```

---

## 4. Deep-Dive: Authentication & Identity Alert Investigation

### 4.1 Impossible Travel / Anomalous Login Alert

**Alert Example:** "Impossible travel detected — user john.doe logged in from New York and Lagos, Nigeria within 30 minutes"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: VERIFY THE GEOGRAPHIC DATA (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Pull both login events:
   Login 1: Time, IP, Geo, Device, App, Status, MFA result
   Login 2: Time, IP, Geo, Device, App, Status, MFA result

□ Verify geo accuracy:
   → Not all IP-to-geo is accurate (CDN, mobile data can shift)
   → Check if either IP is a known VPN provider
   → Check if either IP belongs to your corporate infrastructure
   → Some ISPs geolocate inaccurately

□ Calculate travel feasibility:
   → Time difference between logins
   → Distance between locations
   → Is it physically possible? (NYC to London in 30 min = impossible)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: ANALYZE EACH LOGIN SESSION (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ FOR EACH LOGIN — Check:
   → Device fingerprint: known device name? Registered device?
   → Browser/User-Agent: matches user's normal browser?
   → App accessed: O365? VPN? Business app?
   → MFA status: MFA passed? MFA challenged but not completed?
   → Login result: Success or failure?

□ Red flags on the suspicious login:
   → Unknown device / unregistered device → 🔴
   → Linux User-Agent when user uses Windows → 🔴
   → No MFA challenge (token replay?) → 🔴
   → MFA completed via push (MFA fatigue?) → 🟠
   → Accessing email immediately after login → 🟠

□ Check if the user has VPN/proxy configured:
   → Personal VPN can cause false "impossible travel"
   → Corporate split-tunnel VPN can cause dual-location
   → Mobile hotspot handoff can cause location jump

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: POST-LOGIN BEHAVIOR ANALYSIS (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ What happened AFTER the suspicious login?
   This is the MOST IMPORTANT step — behavior reveals intent.

  MALICIOUS POST-LOGIN (🔴 Confirm TP):
   → Inbox rules created (forwarding to external)
   → Mass email download / mailbox search
   → Password change attempted
   → MFA method changed or added
   → OAuth app consent granted
   → SharePoint/OneDrive mass download  
   → Sent phishing emails from the account
   → Accessed other users' mailboxes
   → Added to privileged groups

  NORMAL POST-LOGIN (🟢 Likely FP):
   → Normal email reading pattern
   → No configuration changes
   → Activity matches user's typical behavior
   → Same applications accessed as usual
   → Session duration matches normal patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: OUT-OF-BAND VERIFICATION (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Contact the user via PHONE (not email — email may be compromised)
   → "Did you log in from [location] at [time]?"
   → "Are you using a VPN or proxy?"
   → "Did you share your credentials with anyone?"
   → "Did you receive an unusual MFA prompt?"

□ If user confirms: NOT ME
   → CONFIRMED TP → Account compromised → Immediate response

□ If user confirms: Yes, that was me (VPN, travel, etc.)
   → CONFIRMED FP → Document and close
   → Consider tuning alert for this user's VPN if recurring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: RESPOND IF TP CONFIRMED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Revoke all active sessions immediately
□ Reset password
□ Reset MFA (re-register clean device)
□ Remove any malicious inbox rules
□ Revoke any OAuth app consents granted
□ Revert any password/MFA changes by attacker
□ Check for data exfiltration (DLP, download logs)
□ Notify the user about the compromise
□ Check if credentials were in known breach database
□ Search for same attacker IP across all user accounts
```

### 4.2 Brute Force / Password Spray Alert

**Alert Example:** "Account lockout detected — 50 failed logins for user jane.smith from IP 203.x.x.x in 5 minutes"

#### Step-by-Step Deep Dive:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: CLASSIFY THE ATTACK TYPE (2 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Check the PATTERN of failures:
   → 1 account, many passwords = BRUTE FORCE
   → Many accounts, 1-2 passwords = PASSWORD SPRAY
   → Many accounts, many passwords = CREDENTIAL STUFFING
   → 1 account, constant attempts = automated script or misconfiguration

□ Check the failure reason code:
   → 0xC000006A = Wrong password (attack in progress)
   → 0xC0000234 = Account locked (lockout triggered)
   → 0xC0000072 = Account disabled
   → 0xC000006D = Bad username (account enumeration)
   → 0xC0000064 = Username does not exist (enumeration)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: ANALYZE THE SOURCE (3 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Where is 203.x.x.x?
   → Geolocation: what country?
   → Reputation: AbuseIPDB, VirusTotal, Shodan
   → Is it a known VPN/TOR node?
   → Is it a cloud provider IP (AWS, Azure, GCP)?
   → Does it belong to your organization?

□ What protocol/service was targeted?
   → RDP (3389) → 🔴 Direct remote access attempt
   → OWA/O365 → 🔴 Email access attempt
   → VPN → 🔴 Network access attempt
   → SSH (22) → 🔴 Linux/network device access
   → SMB (445) → 🔴 Internal network attack
   → Web app login → 🟠 Application-specific

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: CHECK FOR SUCCESS (5 minutes — CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ After the failures, was there a SUCCESSFUL login?
   → 4625 (fail) × 50 → 4624 (success) = 🔴 CREDENTIAL COMPROMISED
   → 4625 (fail) × 50 → no success = Attack failed (but still a TP for attack)

□ If successful login occurred:
   → Was it from the SAME source IP? = attacker guessed correctly
   → Was it from a DIFFERENT IP shortly after? = attacker using creds elsewhere
   → What did the attacker do after logging in?
     Check all post-login activity (see Section 4.1 Step 3)

□ Check OTHER accounts from same source IP:
   → Did the same IP target multiple accounts? (spray indicator)
   → Were any OTHER accounts successfully compromised?
   → Search: all 4625 events WHERE source_IP = 203.x.x.x

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: VERDICT AND RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TP — Attack WITH Compromise:
  □ Failures followed by success from attacker IP
  □ Reset compromised account passwords
  □ Revoke sessions and enforce MFA
  □ Block attacker IP at perimeter
  □ Check for post-compromise activity
  □ Full account compromise investigation

  TP — Attack WITHOUT Compromise:
  □ 50+ failures from external suspicious IP
  □ Block attacker IP at perimeter  
  □ Verify account lockout policy is enforced
  □ Ensure MFA is enabled on targeted accounts
  □ Monitor for continued attempts from different IPs
  □ Consider adding IP range to blocklist

  FP — Misconfiguration:
  □ Failed logins from internal service account
  □ Password recently changed but cached creds not updated
  □ IT identifies a misconfigured service/script
  □ Fix the misconfiguration and close as FP
```

---

## 5. TP Determination Decision Matrix — Quick Reference

| Alert Type | Strongest TP Indicator | Strongest FP Indicator | Tiebreaker Question |
|------------|----------------------|----------------------|-------------------|
| **Suspicious Process** | Encoded download cradle from Office child process | IT management tool (SCCM/Intune) as parent | "Is this user an admin running an expected script?" |
| **Malware Detection** | VT 10+ detections + process executed + C2 connection | Known software, signed, clean VT, expected path | "What process created this file and why?" |
| **Impossible Travel** | Unknown device + malicious post-login behavior | User confirms VPN/travel + normal post-login | "What happened AFTER the login?" |
| **Brute Force** | Failures → success from same attacker IP | Cached creds / misconfigured service | "Did the attacker get in?" |
| **Privilege Escalation** | Non-admin exploiting UAC + credential dump after | Admin using admin tools on their workstation | "Does this user NEED these privileges for their job?" |
| **Lateral Movement** | PsExec from workstation to multiple servers | SCCM push deployment across managed hosts | "Why is this workstation connecting to server admin shares?" |
| **Data Exfil** | 4GB upload to personal Mega.nz at 2 AM | Cloud backup service syncing to corporate cloud | "Is this in line with the user's job function and timing?" |

---

*Continued in Part 2 → Network Alert Deep Dives, Cloud/SaaS Alert Investigations, Email Alert Investigation, Insider Threat, and Complete SOC Analyst Investigation Checklists*
