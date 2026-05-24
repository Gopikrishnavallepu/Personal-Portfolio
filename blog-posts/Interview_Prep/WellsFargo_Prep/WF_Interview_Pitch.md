# 🎤 INTERVIEW PITCH — Day-to-Day Roles, Responsibilities & Workflow

> **Purpose:** Explain clearly what you DID in your previous org to maintain secure posture.
> **How to use:** Adapt these scripts. Practice speaking them aloud until natural.
> **Tone:** Confident, structured, results-driven.

---

# 1. OPENING PITCH (2 minutes)

> "In my previous role as a Cloud Security Analyst, I was part of the Findings Management team responsible for cloud security posture across Azure and GCP environments covering approximately 150 cloud accounts.
>
> My core job was to ensure that every cloud misconfiguration detected by our CNAPP tool was triaged, routed to the right owner, tracked against SLA, and validated once remediated. I worked at the intersection of security tooling, data analytics, and cross-team collaboration — managing anywhere from 500 to 2,000 open findings at any given time across CSPM, CWPP, and vulnerability modules.
>
> What made me effective was that I didn't just manage findings — I built the operational framework around them. I created Power BI dashboards for SLA tracking, automated CMDB validation for ownership mapping, built Power Query pipelines that reduced our weekly reporting from 3 hours to 10 minutes, and led weekly remediation office hours with application teams.
>
> I'd like to walk you through a typical day and week to show how all these pieces fit together."

---

# 2. A TYPICAL DAY (The "Walk Me Through Your Day" Answer)

## Morning (9:00 AM – 11:00 AM): Triage & Prioritize

> "My day started by opening three things: the CNAPP console, our Power BI findings dashboard, and ServiceNow.
>
> First, I checked the **CNAPP console** for new Critical and High findings that came in overnight. Our scanning was continuous — we'd typically see 5-15 new findings daily. For each new Critical finding, I performed initial triage:
>
> - **Is it a true positive?** I'd check the resource configuration directly in the Azure Portal or GCP Console to verify.
> - **Is the resource still active?** Cross-reference with CMDB to ensure it's not a decommissioned asset.
> - **Is it internet-facing?** If yes, it escalates to P1 regardless of the base severity.
> - **Does it have existing context?** Check if this resource already has related tickets from prior findings.
>
> For confirmed true positives, I created a ServiceNow ticket. The routing was semi-automated — I'd look up the resource in CMDB to get the owner and assignment group, set the priority based on severity plus exposure, and include specific remediation steps from the CNAPP tool's guidance.
>
> False positives were documented and suppressed with a justification, scope, and 90-day expiry. I maintained a monthly FP log so we could tune detection rules to reduce noise."

## Midday (11:00 AM – 1:00 PM): Data Analysis & Reporting

> "The second part of my morning was data-driven work. I used **Power BI** and **Excel** to answer questions from leadership and prepare for meetings.
>
> A typical task: our VP would ask, 'How are we doing on Critical findings this month compared to last month?' I'd open our Power BI dashboard, which I built and maintained, and pull the month-over-month trend. The DAX measures I created — SLA compliance rate, MTTR by severity, finding count trends — gave instant answers without manual number-crunching.
>
> If I needed deeper analysis — like deduplicating findings across two data sources or identifying orphaned cloud assets not in CMDB — I'd use **Power Query** in Excel or Power BI to merge datasets, apply transformations, and produce a clean output.
>
> I also maintained the **CMDB validation process**. Every week, I ran a comparison: Wiz findings export versus CMDB asset list. The delta showed me orphaned assets (in cloud but not in CMDB) and stale CIs (in CMDB but no longer in cloud). I'd report these to the asset management team for cleanup. Clean CMDB data was critical because if we couldn't map a finding to an owner, it sat unresolved."

## Afternoon (2:00 PM – 5:00 PM): Collaboration & Follow-Up

> "Afternoons were collaboration-heavy. I'd follow up on SLA-approaching tickets — sending reminders to teams at 75% SLA consumption and escalating to managers at 100%.
>
> I also prepared content for our **weekly office hours** — a recurring meeting where application teams could bring questions about their findings. I'd pre-pull each team's open findings, SLA status, and any recurring patterns. For example, if a team had 5 findings all related to NSG configurations, I'd prepare a bulk remediation guide rather than having them fix each one individually.
>
> If we were in an incident or a zero-day event — like a new Critical CVE dropping — my day shifted entirely. I'd query the CNAPP tool for all affected resources, create a focused report showing exposure across our environment, set up emergency tickets, and coordinate with the vulnerability management team on patching timelines."

---

# 3. A TYPICAL WEEK

## Monday: Weekly Kickoff

> "Mondays I refreshed all reporting. Our Power BI dataset pulled from the CNAPP API overnight, but I'd do a manual data quality check — verifying finding counts matched between the console and the dashboard. Then I'd generate the weekly SLA compliance report: a one-page summary showing each team's open findings by severity, SLA status, and MTTR trend.
>
> This report went to all team leads and VPs. It was the scoreboard. Teams that were consistently green got positive recognition. Teams trending red got a follow-up meeting."

## Tuesday–Wednesday: Remediation Support

> "Mid-week was about unblocking teams. Common scenarios:
>
> - A team disagreed that a finding was valid → I'd review the evidence, check the CNAPP detection logic, and either validate it as TP or suppress as FP with documentation.
> - A team couldn't remediate without a change window → I'd process the exception request: document the risk, get VP approval, set a 90-day expiry, and mark the finding as Risk Accepted in ServiceNow.
> - A team fixed the finding but it wasn't auto-closing → I'd verify the remediation in the cloud console, confirm the CNAPP rescanned and resolved it, then close both the finding and the ServiceNow ticket."

## Thursday: Office Hours & Stakeholder Engagement

> "Every Thursday, I ran a 1-hour **remediation office hours** meeting. Teams joined to discuss their findings, ask for help, or escalate blockers. I'd share my screen showing their Power BI filtered view — their findings, their SLAs, their trends. Making the data visible and specific to their team drove accountability.
>
> I also used this time to **educate teams** on common misconfigurations. For example, I created a KB article on 'Top 5 NSG Misconfigurations and How to Fix Them' that reduced NSG-related findings by 30% over two months because teams learned to avoid them in the first place."

## Friday: Reporting & Continuous Improvement

> "Fridays I focused on process improvement. I'd review the week's FP rate — if a specific detection rule was generating more than 40% false positives, I'd work with the engineering team to tune it. I maintained a tuning tracker: rule name, current FP rate, proposed change, expected improvement.
>
> I also updated documentation — SOPs, KB articles, remediation guides. Good documentation meant that when I was out, anyone on the team could follow the same triage process and get the same results."

---

# 4. KEY ACCOMPLISHMENTS PITCH (Use 2-3 of These)

### Accomplishment 1: SLA Compliance Improvement

> "When I joined, SLA compliance for Critical findings was around 62% — many teams didn't even know they had SLA-breached findings. I built a Power BI dashboard that made SLA status visible at the team level, created an escalation framework with automated email alerts at 50%, 75%, and 100% thresholds, and established weekly office hours to drive accountability. Within 6 months, Critical SLA compliance improved from 62% to 91%."

### Accomplishment 2: Reporting Automation

> "Our weekly findings report used to take 3 hours of manual work — exporting CSVs, doing VLOOKUPs to map owners, creating pivot tables, formatting, and emailing. I replaced this with a Power BI pipeline: Power Query auto-merges the Wiz export with CMDB data, DAX measures calculate all KPIs dynamically, and the report auto-refreshes daily. What took 3 hours now takes 10 minutes — just a data quality check and publish."

### Accomplishment 3: CMDB Hygiene

> "I discovered that 22% of our cloud resources had no CMDB entry — meaning findings for those resources couldn't be assigned to anyone. I built a weekly reconciliation process: export cloud inventory, compare against CMDB, flag gaps. I worked with asset management to onboard the missing CIs. Over 3 months, we got CMDB coverage from 78% to 97%, which directly improved our ticket routing accuracy."

### Accomplishment 4: False Positive Reduction

> "Our CNAPP tool had a 35% false positive rate on certain detection rules, especially around storage encryption and network configurations. I tracked FP rates by rule, identified the top 10 noisiest rules, and worked with the platform engineering team to tune detection logic — adjusting scope, adding exclusions for approved architectures, and updating severity classifications. We reduced the overall FP rate from 35% to 12%, which saved the team approximately 8 hours per week in unnecessary triage."

### Accomplishment 5: Zero-Day Response

> "When a Critical CVE dropped affecting Azure Container instances, I ran an impact assessment within 2 hours. Using the CNAPP vulnerability scanner, I identified 34 affected resources across 8 cloud accounts. I created a focused report with resource details, owners, exposure level, and patching guidance. Emergency tickets were created, and I coordinated with the patching team to prioritize internet-facing instances. All 34 resources were patched within 48 hours, well within our emergency SLA."

---

# 5. THE "HOW DID YOU MAINTAIN POSTURE LONG-TERM?" ANSWER

> "Maintaining posture isn't a one-time effort — it's a system of overlapping controls:
>
> **Prevention:** I worked with platform teams to implement guardrails — Azure Policies and GCP Organization Policies that prevented misconfigurations before they happened. For example, a policy that blocks creation of NSGs with 0.0.0.0/0 rules.
>
> **Detection:** Our CNAPP tool scanned continuously — posture assessment hourly, vulnerability scanning daily, compliance checks weekly. I tuned detection rules monthly to reduce false positives and improve signal quality.
>
> **Response:** Every finding had a ticket, an owner, and an SLA. Power BI dashboards made this visible. Office hours created accountability. Escalation frameworks ensured nothing aged indefinitely.
>
> **Measurement:** I tracked MTTR, SLA compliance, finding velocity (new vs closed per month), FP rate, and CMDB coverage. These metrics told us whether posture was improving or degrading — and specifically WHERE.
>
> **Continuous Improvement:** Monthly, I reviewed which CIS controls had the highest failure rates and created targeted remediation guides. Quarterly, I reported to governance on compliance trends against CIS and NIST frameworks.
>
> The result was measurable: over 12 months, our open Critical findings decreased from 45 to 8, our SLA compliance went from 62% to 91%, and our MTTR for High findings dropped from 18 days to 6 days. Posture improvement is a trend line, not a point in time — and every metric I tracked proved the trend was moving in the right direction."

---

# 6. THE 30-60-90 DAY PLAN FOR WELLS FARGO

### Days 1-30: Learn & Understand

> "In the first 30 days, I'd focus on understanding the current state:
> - Learn the Wiz console — understand how findings are generated, categorized, and prioritized.
> - Map the current workflow: how are findings triaged today? Who does what?
> - Review existing Power BI dashboards — understand the data model, current measures, and refresh schedule.
> - Meet with each team lead to understand their pain points with findings management.
> - Shadow current processes: sit in on office hours, watch how exceptions are processed.
> - Document gaps I identify — things I'd improve but don't change yet."

### Days 31-60: Optimize & Contribute

> "In days 31-60, I'd start making the workflow better:
> - Improve Power BI dashboards based on gaps I identified — add missing KPIs, fix data quality issues, optimize DAX performance.
> - Enhance the CMDB validation process — automate the weekly reconciliation.
> - Build or improve Power Query pipelines for data ingestion and transformation.
> - Start running office hours independently — become the go-to person for remediation support.
> - Create 2-3 KB articles for the most common remediation patterns I see."

### Days 31-90: Lead & Scale

> "By day 60-90, I'd be operating independently and driving improvements:
> - Own the weekly SLA reporting end-to-end.
> - Propose automation for repetitive tasks (Python scripts for bulk updates, API-driven ticket creation).
> - Build a tuning roadmap: identify noisy rules and work with engineering to reduce FP rates.
> - Present first monthly metrics review to leadership — showing trends and recommending actions.
> - Document all processes I've built or improved so the team isn't dependent on one person."

---

# 7. CLOSING STATEMENT

> "What I bring to this role is the combination of three things that don't always exist in one person: first, **deep security knowledge** — I understand CSPM, CWPP, CIS benchmarks, and compliance frameworks well enough to make accurate triage decisions. Second, **data and analytics skills** — I build Power BI dashboards, write DAX, use Power Query, and work with SQL to turn raw findings into actionable intelligence. Third, **operational discipline** — I believe that findings management is a process, not a project. It requires consistent triage, reliable SLA tracking, clean CMDB data, and weekly stakeholder engagement. I've built this process before, improved it measurably, and I'm ready to bring that experience to Wells Fargo."
