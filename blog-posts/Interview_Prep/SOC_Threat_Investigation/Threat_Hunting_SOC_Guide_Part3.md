# 🎯 Threat Hunting SOC Guide — Part 3: Discovery, Lateral Movement & Collection

---

# PART 3: ATT&CK TACTICS — DISCOVERY, LATERAL MOVEMENT & COLLECTION

---

## 11. TA0007 — Discovery

#### Overview
After gaining access and credentials, adversaries **map the environment** — discovering users, groups, systems, shares, and trust relationships. Discovery commands are often **living-off-the-land** (using built-in OS tools), making them harder to detect.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1087 | Account Discovery | Enumerate local/domain accounts | Event 4688, Sysmon 1 |
| T1082 | System Information Discovery | Hostname, OS version, architecture | Event 4688 (systeminfo, hostname) |
| T1083 | File and Directory Discovery | Browse file systems | EDR, Sysmon 1 (dir, tree) |
| T1069 | Permission Groups Discovery | Enumerate groups (Domain Admins) | Event 4688 (net group) |
| T1018 | Remote System Discovery | Find other machines on network | Event 4688 (net view, ping sweep) |
| T1016 | System Network Configuration | IP config, routes, DNS | Event 4688 (ipconfig, route, nslookup) |
| T1049 | System Network Connections | Active connections | Event 4688 (netstat) |
| T1482 | Domain Trust Discovery | Map AD trust relationships | Event 4688 (nltest /domain_trusts) |
| T1135 | Network Share Discovery | Find accessible shares | Event 4688 (net share, net view) |
| T1046 | Network Service Scanning | Port scan internal network | Firewall, IDS, EDR |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Recon command burst | Sysmon 1 / Event 4688 | Multiple discovery commands from single host in < 5 min: `whoami`, `ipconfig`, `net user`, `net group`, `systeminfo`, `nltest` |
| BloodHound/SharpHound | Event 4688/EDR | SharpHound.exe, or LDAP queries for all users/groups/trusts in rapid succession |
| AD enumeration | LDAP logs | Unusual LDAP queries from workstations (all adminCount=1 objects) |
| Internal port scanning | Firewall/IDS | Single host connecting to many internal IPs on common ports (445, 3389, 22, 80) |
| Share enumeration | Event 5140/5145 | Single user accessing multiple network shares in sequence |

#### ✅ True Positive Scenario — Post-Compromise Enumeration (T1087 + T1069 + T1082)

**Scenario:** EDR detects a workstation executing the following commands in rapid succession within 3 minutes:
```
whoami /all
systeminfo
ipconfig /all
net user /domain
net group "Domain Admins" /domain
net group "Enterprise Admins" /domain
nltest /domain_trusts
net view /domain
```

**Investigation Steps:**
```
1. ASSESS THE COMMAND PATTERN
   □ 8+ discovery commands in < 3 minutes → 🔴 AUTOMATED RECON
   □ This is textbook post-exploitation enumeration
   □ No legitimate user runs all these commands together
   □ Often from Cobalt Strike, Metasploit, or attack scripts

2. IDENTIFY THE USER AND CONTEXT
   □ What user account ran these commands?
   □ Is this user an IT admin? (admins might run some, but not all at once)
   □ What was the parent process? (cmd.exe? powershell.exe? beacon?)
   □ What happened BEFORE these commands? (initial access vector)

3. CHECK FOR PRE-CURSOR ACTIVITY
   □ Was there a phishing email opened by this user?
   □ Was there a malicious document executed?
   □ Was there an exploit or credential dump?
   □ Check process tree: what spawned the command shell?

4. CHECK FOR POST-RECON ACTIVITY
   □ After discovery: did the attacker attempt lateral movement?
   □ Did they target the Domain Admin accounts found?
   □ Did they connect to discovered shares?
   □ Did they attempt to access discovered systems?

5. RESPOND
   □ Isolate the workstation
   □ Kill the command/process chain
   □ Reset the user's credentials
   □ Review all discoveries made — what did attacker learn?
   □ Monitor targeted accounts/systems for access
   □ Create alert for burst of discovery commands
```

**TP Confidence:** 🔴 HIGH — Rapid sequential execution of 8+ recon commands = confirmed post-exploitation enumeration.

#### ✅ True Positive Scenario — BloodHound / SharpHound Collection (T1087 + T1069 + T1482)

**Scenario:** LDAP audit logs show a workstation issuing thousands of LDAP queries in 2 minutes, querying all users, groups, computers, GPOs, and trust relationships. EDR shows `SharpHound.exe` running.

**Investigation Steps:**
```
1. CONFIRM BLOODHOUND USAGE
   □ SharpHound.exe or SharpHound.ps1 detected → 🔴 ATTACK TOOL
   □ Massive LDAP queries for AD objects → AD enumeration
   □ Check for output files: *.json or *.zip (BloodHound data)
   □ BloodHound maps attack paths to Domain Admin → PRE-ATTACK

2. ASSESS WHAT DATA WAS COLLECTED
   □ BloodHound collects: users, groups, computers, sessions, ACLs, trusts
   □ This gives attacker a COMPLETE MAP of AD attack paths
   □ Attacker now knows shortest path to Domain Admin

3. CHECK FOR FOLLOW-UP ATTACKS
   □ Did attacker use discovered attack paths?
   □ Check for Kerberoasting of identified service accounts
   □ Check for ACL abuse (WriteDACL, GenericAll exploitation)
   □ Check for lateral movement to discovered high-value targets

4. RESPOND
   □ Isolate the workstation immediately
   □ Delete SharpHound output files
   □ Reset the compromised user account
   □ Assume attacker has full AD topology knowledge
   □ Review and harden AD attack paths identified by BloodHound
   □ Run BloodHound defensively to find and fix attack paths
   □ Create detection for LDAP enumeration patterns
```

**TP Confidence:** 🔴 CRITICAL — SharpHound/BloodHound execution = attacker mapping AD attack paths for escalation.

---

## 12. TA0008 — Lateral Movement

#### Overview
Adversaries move from the initially compromised system to other systems in the network. Lateral movement is the **bridge** between initial access and reaching high-value targets (domain controllers, file servers, databases).

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1021.001 | Remote Desktop Protocol (RDP) | RDP to other systems | Event 4624 Type 10, 1149 |
| T1021.002 | SMB/Windows Admin Shares | Access C$, ADMIN$ shares | Event 5140, 5145 |
| T1021.003 | DCOM | Distributed COM for remote execution | Event 4688, Sysmon 1 |
| T1021.006 | Windows Remote Management (WinRM) | PowerShell remoting | Event 4688, 91, 168 |
| T1570 | Lateral Tool Transfer | Copy tools to remote system | Sysmon 11 (network file creates) |
| T1563 | Remote Service Session Hijacking | Hijack existing RDP/SSH | Event 4778 (session reconnect) |
| T1072 | Software Deployment Tools | Abuse SCCM, GPO, Ansible | Deployment tool logs |
| T1550.002 | Pass the Hash | Use NTLM hash directly | Event 4624 Type 3 (NTLM, NtLmSsp) |
| T1550.003 | Pass the Ticket | Use stolen Kerberos ticket | Event 4768, 4769 anomalies |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| PsExec usage | Event 7045, 5145 | Service install "PSEXESVC" + access to ADMIN$ share |
| RDP lateral movement | Event 4624 Type 10 | RDP from workstation-to-workstation (not from jump server) |
| WMI remote execution | Event 4688 | `wmic /node:<remote> process call create` |
| Pass-the-Hash | Event 4624 Type 3 | NTLM auth for admin account from unusual source |
| WinRM remoting | Event 4688, 91 | `Enter-PSSession`, `Invoke-Command` to non-admin targets |
| Admin share access | Event 5140, 5145 | Access to C$, ADMIN$, IPC$ from workstations |
| Tool transfer | Sysmon 11 | Executables written to remote system's Windows\Temp or ProgramData |
| SMB lateral movement | Event 5145 | SMB file access to `\*\C$\Windows\Temp\*.exe` |

#### ✅ True Positive Scenario — PsExec Lateral Movement (T1021.002 + T1569.002)

**Scenario:** Event 7045 fires on multiple servers showing a new service named `PSEXESVC` installed. Event 5145 shows the source workstation accessed `\\server\ADMIN$`. The activity originates from a Finance workstation.

**Investigation Steps:**
```
1. CONFIRM PSEXEC PATTERN
   □ Event 5145: ADMIN$ and IPC$ share access from workstation
   □ Event 7045: Service "PSEXESVC" installed on target → 🔴
   □ PsExec copies itself to ADMIN$ → creates a service → executes
   □ Finance workstation → multiple servers = LATERAL MOVEMENT

2. IDENTIFY THE SCOPE
   □ How many target servers? List all Event 7045 with PSEXESVC
   □ What user account was used? (local admin? domain admin?)
   □ What was the timeline? (how fast was the spread?)
   □ What commands were executed via PsExec?

3. TRACE THE SOURCE
   □ How was the Finance workstation compromised initially?
   □ Was it phishing? Drive-by? Credential reuse?
   □ What credentials does the attacker have?
   □ Check for prior credential dumping activity

4. INVESTIGATE TARGET SERVERS
   □ On each target: what ran after PsExec connected?
   □ Check for data access, credential dumping, persistence
   □ Was ransomware deployed?
   □ Were any servers domain controllers?

5. RESPOND
   □ Isolate the source workstation
   □ Isolate ALL target servers and investigate
   □ Block ADMIN$ share access from workstations (network segmentation)
   □ Reset all credentials used by the attacker
   □ Remove PSEXESVC services from targets
   □ Audit local admin membership across the environment
   □ Implement LAPS (Local Administrator Password Solution)
   □ Create detection for PSEXESVC service installation
```

**TP Confidence:** 🔴 CRITICAL — PSEXESVC service on multiple servers from a workstation = confirmed lateral movement.

#### ✅ True Positive Scenario — RDP Lateral Movement with Stolen Credentials (T1021.001)

**Scenario:** Event 4624 (Logon Type 10 - RDP) shows the Domain Admin account `admin.jdoe` logging into 5 servers from a workstation that this admin has never used before. The logons happen at 11:30 PM on a Saturday.

**Investigation Steps:**
```
1. VERIFY ABNORMAL RDP
   □ Logon Type 10 = RDP for admin.jdoe from unusual workstation → 🔴
   □ 5 servers accessed via RDP in rapid succession
   □ Saturday 11:30 PM = outside business hours
   □ Source workstation not in admin's usual devices → SUSPICIOUS

2. VERIFY WITH THE ADMIN
   □ Contact admin.jdoe via phone (out-of-band)
   □ Was this admin working Saturday night? From that workstation?
   □ If NO → CONFIRMED COMPROMISE of domain admin credentials

3. INVESTIGATE SOURCE WORKSTATION
   □ Who was logged into the source workstation?
   □ How did they obtain admin.jdoe credentials?
   □ Check for credential dumping tools, keylogger artifacts
   □ Check for prior Pass-the-Hash or Kerberoast activity

4. INVESTIGATE TARGET SERVERS
   □ What did the attacker do on each server via RDP?
   □ Check for: data access, tool deployment, credential harvesting
   □ Check for: persistence installation, log clearing
   □ Check clipboard history (RDP clipboard data)
   □ Were any DCs among the targets?

5. RESPOND
   □ Disable admin.jdoe account immediately
   □ Terminate all active RDP sessions
   □ Isolate source workstation and all 5 target servers
   □ Reset admin.jdoe credentials and MFA
   □ Review all actions performed with admin.jdoe creds
   □ Restrict RDP access via Network Level Authentication
   □ Implement PAM (Privileged Access Management) solution
   □ Enforce tiered admin model (admin accounts only from PAWs)
```

**TP Confidence:** 🔴 CRITICAL — Domain Admin RDP from unknown workstation after-hours to multiple servers = confirmed lateral movement with stolen creds.

---

## 13. TA0009 — Collection

#### Overview
Adversaries gather data of interest — emails, documents, databases, credentials — before exfiltrating. Collection activity often indicates the attacker is **nearing their objective**.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1560 | Archive Collected Data | Zip/rar files for exfil | EDR (7z.exe, rar.exe, compress-archive) |
| T1114.001 | Local Email Collection | Access local .pst/.ost files | File access logs, EDR |
| T1114.002 | Remote Email Collection | Access Exchange/O365 mailbox | Exchange audit, Graph API logs |
| T1119 | Automated Collection | Scripts to collect files | EDR, Sysmon 1 |
| T1005 | Data from Local System | Manually browse/copy files | File access logs |
| T1039 | Data from Network Shared Drive | Access file shares | Event 5140, 5145 |
| T1113 | Screen Capture | Screenshot tools | EDR (screenshot utilities) |
| T1125 | Video Capture | Webcam access | EDR, camera API calls |
| T1056.001 | Input Capture: Keylogging | Record keystrokes | EDR, behavioral detection |
| T1213 | Data from Information Repositories | SharePoint, Confluence, wikis | App audit logs |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Mass file archiving | EDR/Sysmon | 7z.exe, rar.exe, zip creating large archives in TEMP or staging dirs |
| Email collection | Exchange audit | Unusual mailbox access, export-mailbox cmdlets, .pst creation |
| Mass file access | Event 5145 | Single user accessing hundreds of files on shares in sequence |
| Staging directories | Sysmon 11 | Large files created in C:\ProgramData, C:\Users\Public, C:\Temp |
| Database dumps | App logs/EDR | mysqldump, pg_dump, sqlcmd with bulk export commands |
| Screenshot tools | EDR | Nircmd, screenshot.exe, or PowerShell screen capture scripts |
| Clipboard theft | EDR | Get-Clipboard in loops, or clipboard monitoring tools |

#### ✅ True Positive Scenario — Data Staging and Archiving (T1560 + T1074)

**Scenario:** EDR alerts that `7z.exe` created a 2.5 GB password-protected archive at `C:\ProgramData\update.7z` on a file server. The archive was created by a service account at 2 AM.

**Investigation Steps:**
```
1. ANALYZE THE ARCHIVING
   □ 7z.exe creating large password-protected archive → 🔴
   □ C:\ProgramData = staging location (not normal for 7z output)
   □ 2 AM + service account = off-hours automated collection
   □ What files were added to the archive? (7z command line args)

2. DETERMINE SOURCE FILES
   □ Check 7z.exe command line for source paths
   □ Were sensitive files/shares included? (Finance, HR, Engineering)
   □ What volume of data was compressed?
   □ Check Sysmon Event 1 for full command line

3. CHECK POST-STAGING
   □ Was the archive moved or copied elsewhere?
   □ Check for exfiltration: upload to cloud, FTP, HTTP POST
   □ Check network logs for large outbound transfers from this server
   □ Is the archive still present on disk?

4. INVESTIGATE THE SERVICE ACCOUNT
   □ What is this service account normally used for?
   □ When was it last used legitimately?
   □ Check authentication logs for unusual access
   □ Was the account compromised?

5. RESPOND
   □ Preserve the archive as forensic evidence
   □ Block the service account immediately
   □ Isolate the file server
   □ Determine if data was exfiltrated
   □ Notify data owners about potential data breach
   □ Check for same pattern on other servers
   □ Review service account permissions (least privilege)
   □ If exfiltrated: initiate breach notification procedures
```

**TP Confidence:** 🔴 CRITICAL — Large password-protected archive created by service account at 2 AM in staging directory = confirmed data collection for exfiltration.

---

## 14. Lateral Movement & Collection — Quick Reference Checklists

### 14.1 Lateral Movement Detection Checklist

```
┌───────────────────────────────────────────────────────────────────────┐
│              LATERAL MOVEMENT HUNTING CHECKLIST                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  RDP ANOMALIES                                                        │
│  □ RDP (4624 Type 10) from workstation to workstation                │
│  □ RDP from non-jump-server sources to servers                       │
│  □ RDP sessions outside business hours                               │
│  □ Admin RDP from unexpected hosts                                   │
│                                                                       │
│  SMB / ADMIN SHARE                                                    │
│  □ Access to C$, ADMIN$, IPC$ from workstations                     │
│  □ PSEXESVC service installation (Event 7045)                        │
│  □ Files written to \\remote\ADMIN$\Temp                            │
│  □ SMB connections from non-IT workstations to servers               │
│                                                                       │
│  WMI / WINRM                                                          │
│  □ wmic /node: process call create from workstations                 │
│  □ PowerShell remoting (Invoke-Command) to non-standard targets     │
│  □ WSMan connections from unexpected sources                         │
│                                                                       │
│  PASS-THE-HASH / PASS-THE-TICKET                                     │
│  □ NTLM auth (4624 Type 3) for privileged accounts from workstations│
│  □ Kerberos ticket anomalies (forged tickets, lifetime mismatch)     │
│  □ Multiple systems authenticated with same credential in sequence   │
│                                                                       │
│  TOOL TRANSFER                                                        │
│  □ Executables copied to remote hosts' TEMP or ProgramData          │
│  □ Certutil/BITSAdmin used to download tools on remote hosts        │
│  □ PowerShell scripts transferred and executed remotely              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 14.2 Data Collection Detection Checklist

```
┌───────────────────────────────────────────────────────────────────────┐
│              DATA COLLECTION HUNTING CHECKLIST                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  STAGING                                                              │
│  □ Large files in C:\ProgramData, C:\Users\Public, C:\TEMP          │
│  □ Archive creation (7z, rar, zip) with sensitive content            │
│  □ Password-protected archives (evasion of DLP)                      │
│  □ Renamed archives (.docx, .png extensions hiding .7z)             │
│                                                                       │
│  EMAIL COLLECTION                                                     │
│  □ Export-Mailbox or New-MailboxExportRequest in Exchange             │
│  □ .pst file creation on endpoints                                   │
│  □ Graph API access to multiple mailboxes from single app            │
│  □ Inbox forwarding to external addresses                            │
│                                                                       │
│  FILE ACCESS                                                          │
│  □ Single user accessing 100+ files on shared drives rapidly        │
│  □ Access to sensitive directories (Finance, HR, Legal, Engineering) │
│  □ After-hours bulk file access                                      │
│  □ Service accounts accessing file shares they normally don't       │
│                                                                       │
│  DATABASE                                                             │
│  □ Database export commands (mysqldump, bcp, sqlcmd bulk)           │
│  □ Large query result sets exported to file                          │
│  □ Database access from non-application accounts                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

*Continued in Part 4 → Command & Control, Exfiltration, Impact — Complete TP Scenarios, Full Investigation Playbooks & Master SOC Checklists*
