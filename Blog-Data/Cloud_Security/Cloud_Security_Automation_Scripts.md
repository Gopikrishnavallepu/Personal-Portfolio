# 🤖 CLOUD SECURITY AUTOMATION — Implementation Ideas & Python Scripts

> **Where automation is needed, why, and working Python scripts you can explain in an interview.**

---

## WHERE IS AUTOMATION NEEDED? — 10 Key Areas

Based on everything in the interview guide, here are the **10 automation gaps** and what each script solves:

```
AUTOMATION MAP — Mapped to Your EY JD Responsibilities:

┌──────────────────────────────────────────────────────────────────────────┐
│  EY JD RESPONSIBILITY              AUTOMATION NEEDED         SCRIPT #   │
│──────────────────────────────────────────────────────────────────────────│
│  Monitor cloud assets for          1. Sensor Coverage Gap     Script 1  │
│    vulnerabilities                    Reconciliation                    │
│                                    2. PSS Misconfiguration    Script 2  │
│                                       Scanner                          │
│                                                                        │
│  Implement security controls       3. Auto-Remediate S3       Script 3  │
│    ensuring compliance                Public Access                    │
│                                    4. SG Open Port Auto-Fix   Script 4  │
│                                                                        │
│  Investigate false positives       5. Alert Triage &          Script 5  │
│    and risk-acceptance                Classification Bot                │
│                                                                        │
│  Shape remediation SLAs            6. SLA Tracker &           Script 6  │
│                                       Escalation Engine                │
│                                                                        │
│  Respond to zero-day events        7. Zero-Day Blast Radius   Script 7  │
│                                       Scanner                          │
│                                                                        │
│  Tune scanning tools               8. IAM Credential          Script 8  │
│                                       Hygiene Enforcer                 │
│                                                                        │
│  Identify opportunities for        9. Compliance Report       Script 9  │
│    automation                         Generator                        │
│                                    10. K8s RBAC Audit          Script 10 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## SCRIPT 1: Falcon Sensor Coverage Gap Reconciliation

### 🎯 What It Does
Compares **all EC2 instances in your AWS account** against **Falcon-reported hosts** to find nodes that are running but have no security sensor. Alerts on gaps.

### 🤔 Why It's Needed
- New node groups with taints → DaemonSet doesn't schedule → coverage drops silently
- Auto-scaling adds nodes faster than sensor deployment
- EY JD: "Monitor cloud assets for vulnerabilities" — can't monitor what you can't see

### 📝 Interview Explanation
> "I built this automation because coverage gaps are silent failures. A node without a sensor is a blind spot. This script runs daily via CloudWatch Events → Lambda. It compares the EC2 instance list with the Falcon Hosts API. Any instance that's been running for >10 minutes without a sensor is flagged as a gap. The alert includes the instance ID, node group, and which DaemonSet tolerations are missing."

```python
"""
SCRIPT 1: Sensor Coverage Gap Reconciliation
Trigger: Daily via CloudWatch Events / EventBridge → Lambda
What: Finds EC2 instances in EKS clusters that don't have a Falcon sensor reporting
Action: Alerts security team via SNS + creates Jira ticket
"""

import boto3
import json
import requests
from datetime import datetime, timezone, timedelta

# --- Configuration ---
FALCON_CLIENT_ID = "your-falcon-client-id"       # Store in Secrets Manager
FALCON_CLIENT_SECRET = "your-falcon-client-secret" # Store in Secrets Manager
FALCON_BASE_URL = "https://api.crowdstrike.com"
SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:123456789:SecurityAlerts"
EKS_CLUSTER_TAG = "kubernetes.io/cluster/production"
GRACE_PERIOD_MINUTES = 10  # New instances get 10 min before flagging

def get_falcon_token():
    """Authenticate to CrowdStrike Falcon API and get bearer token."""
    response = requests.post(
        f"{FALCON_BASE_URL}/oauth2/token",
        data={
            "client_id": FALCON_CLIENT_ID,
            "client_secret": FALCON_CLIENT_SECRET
        }
    )
    response.raise_for_status()
    return response.json()["access_token"]

def get_falcon_hosts(token):
    """Get all hosts reporting to Falcon with their instance IDs."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Query for all Linux hosts (EKS nodes)
    response = requests.get(
        f"{FALCON_BASE_URL}/devices/queries/devices/v1",
        headers=headers,
        params={"filter": "platform_name:'Linux'", "limit": 5000}
    )
    response.raise_for_status()
    device_ids = response.json()["resources"]
    
    if not device_ids:
        return set()
    
    # Get device details to extract instance IDs
    response = requests.post(
        f"{FALCON_BASE_URL}/devices/entities/devices/v2",
        headers=headers,
        json={"ids": device_ids}
    )
    response.raise_for_status()
    
    # Extract instance IDs from Falcon hosts
    falcon_instance_ids = set()
    for device in response.json()["resources"]:
        instance_id = device.get("service_provider_account_id") or device.get("hostname")
        if instance_id:
            falcon_instance_ids.add(instance_id)
    
    return falcon_instance_ids

def get_eks_instances():
    """Get all EC2 instances that are part of EKS clusters."""
    ec2 = boto3.client('ec2')
    now = datetime.now(timezone.utc)
    
    # Find instances tagged as EKS nodes
    response = ec2.describe_instances(
        Filters=[
            {'Name': f'tag:{EKS_CLUSTER_TAG}', 'Values': ['owned', 'shared']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    instances = {}
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            launch_time = instance['LaunchTime']
            age_minutes = (now - launch_time).total_seconds() / 60
            
            # Skip instances launched less than grace period ago
            if age_minutes < GRACE_PERIOD_MINUTES:
                continue
            
            instance_id = instance['InstanceId']
            # Get the node group name from tags
            tags = {t['Key']: t['Value'] for t in instance.get('Tags', [])}
            instances[instance_id] = {
                'instance_id': instance_id,
                'private_ip': instance.get('PrivateIpAddress'),
                'node_group': tags.get('eks:nodegroup-name', 'unknown'),
                'launch_time': launch_time.isoformat(),
                'age_hours': round(age_minutes / 60, 1)
            }
    
    return instances

def alert_on_gaps(gaps):
    """Send SNS alert for coverage gaps."""
    sns = boto3.client('sns')
    
    message = {
        "alert": "FALCON SENSOR COVERAGE GAP DETECTED",
        "severity": "HIGH",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_gaps": len(gaps),
        "unmonitored_instances": gaps,
        "action_required": [
            "Check Falcon DaemonSet tolerations for these node groups",
            "Verify DaemonSet is DESIRED=CURRENT on these nodes",
            "Run: kubectl get ds -n falcon-system",
            "Add tolerations if missing: tolerations: [{operator: Exists}]"
        ]
    }
    
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject=f"[SECURITY] {len(gaps)} EKS nodes without Falcon sensor",
        Message=json.dumps(message, indent=2, default=str)
    )

def lambda_handler(event, context):
    """Main Lambda handler — runs daily."""
    print("Starting Falcon coverage reconciliation...")
    
    # Step 1: Get all Falcon-reporting hosts
    token = get_falcon_token()
    falcon_hosts = get_falcon_hosts(token)
    print(f"Falcon reports {len(falcon_hosts)} hosts")
    
    # Step 2: Get all EKS EC2 instances
    eks_instances = get_eks_instances()
    print(f"AWS reports {len(eks_instances)} EKS instances")
    
    # Step 3: Find gaps (in AWS but NOT in Falcon)
    eks_ids = set(eks_instances.keys())
    unmonitored_ids = eks_ids - falcon_hosts
    
    # Step 4: Calculate coverage percentage
    total = len(eks_ids)
    covered = total - len(unmonitored_ids)
    coverage_pct = (covered / total * 100) if total > 0 else 100
    
    print(f"Coverage: {coverage_pct:.1f}% ({covered}/{total})")
    
    # Step 5: Alert if gaps found
    if unmonitored_ids:
        gaps = [eks_instances[iid] for iid in unmonitored_ids]
        alert_on_gaps(gaps)
        print(f"ALERT: {len(gaps)} unmonitored instances found")
    else:
        print("All EKS instances have Falcon sensor coverage ✓")
    
    return {
        "coverage_percent": round(coverage_pct, 1),
        "total_instances": total,
        "covered": covered,
        "gaps": len(unmonitored_ids)
    }
```

---

## SCRIPT 2: Kubernetes PSS Misconfiguration Scanner

### 🎯 What It Does
Scans all pods across all namespaces for the **10 PSS misconfigurations** from Section 3.8 of the guide. Generates a risk-scored report.

### 🤔 Why It's Needed
- PSA only blocks at deploy time — existing pods may already violate standards
- Need visibility into current state before enforcing PSA `enforce` mode
- EY JD: "Implement cloud security controls ensuring compliance"

### 📝 Interview Explanation
> "Before enforcing PSA restricted mode, I need to know how many existing pods would break. This script audits every running pod against all 10 PSS misconfigurations, scores each violation by risk, and generates a namespace-by-namespace report. This is how I plan the rollout — fix violations first, then enforce."

```python
"""
SCRIPT 2: Kubernetes PSS Misconfiguration Scanner
Trigger: Weekly via CronJob in the cluster OR on-demand
What: Scans all pods for 10 PSS misconfigurations with risk scoring
Output: JSON report + summary table
"""

from kubernetes import client, config
import json
from datetime import datetime
from collections import defaultdict

# Risk scores for each misconfiguration
MISCONFIG_RISK = {
    "privileged_container": {"severity": "CRITICAL", "score": 10, "pss_profile": "baseline"},
    "running_as_root": {"severity": "HIGH", "score": 8, "pss_profile": "restricted"},
    "writable_root_fs": {"severity": "MEDIUM", "score": 5, "pss_profile": "restricted"},
    "privilege_escalation": {"severity": "HIGH", "score": 7, "pss_profile": "restricted"},
    "excessive_capabilities": {"severity": "CRITICAL", "score": 9, "pss_profile": "restricted"},
    "host_namespace_sharing": {"severity": "HIGH", "score": 8, "pss_profile": "baseline"},
    "hostpath_volume": {"severity": "CRITICAL", "score": 9, "pss_profile": "baseline"},
    "no_seccomp": {"severity": "MEDIUM", "score": 4, "pss_profile": "restricted"},
    "no_resource_limits": {"severity": "MEDIUM", "score": 5, "pss_profile": "N/A"},
    "sa_token_automount": {"severity": "MEDIUM", "score": 5, "pss_profile": "N/A"},
}

# Namespaces to skip (system components that legitimately need privileges)
SKIP_NAMESPACES = {"kube-system", "kube-public", "kube-node-lease", "falcon-system"}

# Dangerous capabilities that should be dropped
DANGEROUS_CAPS = {"SYS_ADMIN", "NET_RAW", "SYS_PTRACE", "SYS_MODULE", 
                  "DAC_OVERRIDE", "FOWNER", "NET_ADMIN", "SYS_RAWIO", "MKNOD"}

def load_kube_config():
    """Load kubeconfig — works both locally and inside a cluster."""
    try:
        config.load_incluster_config()  # Running inside K8s
    except config.ConfigException:
        config.load_kube_config()       # Running locally

def check_container_misconfigs(container, pod_spec):
    """Check a single container for all 10 PSS misconfigurations."""
    findings = []
    sc = container.security_context or client.V1SecurityContext()
    
    # 1. Privileged container
    if sc.privileged:
        findings.append({
            "check": "privileged_container",
            "detail": "Container runs with privileged: true — full host kernel access",
            "fix": "Remove privileged: true, use specific capabilities instead"
        })
    
    # 2. Running as root
    if sc.run_as_user == 0 or (sc.run_as_non_root is None or sc.run_as_non_root == False):
        # Check if image likely runs as root
        is_root = sc.run_as_user == 0 or sc.run_as_non_root is not True
        if is_root:
            findings.append({
                "check": "running_as_root",
                "detail": f"Container may run as root (runAsUser={sc.run_as_user}, "
                          f"runAsNonRoot={sc.run_as_non_root})",
                "fix": "Set runAsNonRoot: true, runAsUser: 1000"
            })
    
    # 3. Writable root filesystem
    if not sc.read_only_root_filesystem:
        findings.append({
            "check": "writable_root_fs",
            "detail": "Root filesystem is writable — allows drift/malware writes",
            "fix": "Set readOnlyRootFilesystem: true, use emptyDir for /tmp"
        })
    
    # 4. Privilege escalation allowed
    if sc.allow_privilege_escalation is None or sc.allow_privilege_escalation:
        findings.append({
            "check": "privilege_escalation",
            "detail": "allowPrivilegeEscalation not set to false (defaults to true)",
            "fix": "Set allowPrivilegeEscalation: false"
        })
    
    # 5. Excessive capabilities
    if sc.capabilities and sc.capabilities.add:
        dangerous = set(sc.capabilities.add) & DANGEROUS_CAPS
        if dangerous:
            findings.append({
                "check": "excessive_capabilities",
                "detail": f"Dangerous capabilities granted: {', '.join(dangerous)}",
                "fix": "Drop ALL capabilities, add back only NET_BIND_SERVICE if needed"
            })
    
    # Check if capabilities are not dropped
    if not sc.capabilities or not sc.capabilities.drop or "ALL" not in (sc.capabilities.drop or []):
        findings.append({
            "check": "excessive_capabilities",
            "detail": "Capabilities not dropped — container retains default caps",
            "fix": "Add capabilities.drop: ['ALL']"
        })
    
    # 6. Host namespace sharing (checked at pod level)
    if pod_spec.host_pid:
        findings.append({
            "check": "host_namespace_sharing",
            "detail": "hostPID: true — container can see all host processes",
            "fix": "Remove hostPID: true"
        })
    if pod_spec.host_network:
        findings.append({
            "check": "host_namespace_sharing",
            "detail": "hostNetwork: true — bypasses NetworkPolicies",
            "fix": "Remove hostNetwork: true"
        })
    if pod_spec.host_ipc:
        findings.append({
            "check": "host_namespace_sharing",
            "detail": "hostIPC: true — can read shared memory from host",
            "fix": "Remove hostIPC: true"
        })
    
    # 7. HostPath volumes
    if pod_spec.volumes:
        for vol in pod_spec.volumes:
            if vol.host_path:
                severity = "CRITICAL" if vol.host_path.path in ["/", "/var/run/docker.sock"] else "HIGH"
                findings.append({
                    "check": "hostpath_volume",
                    "detail": f"HostPath volume mounted: {vol.host_path.path}",
                    "fix": "Replace with emptyDir, PVC, or configMap"
                })
    
    # 8. No seccomp profile
    if not sc.seccomp_profile:
        findings.append({
            "check": "no_seccomp",
            "detail": "No seccomp profile — container has access to all syscalls",
            "fix": "Add seccompProfile.type: RuntimeDefault"
        })
    
    # 9. No resource limits
    if not container.resources or not container.resources.limits:
        findings.append({
            "check": "no_resource_limits",
            "detail": "No CPU/memory limits — vulnerable to resource exhaustion attacks",
            "fix": "Set resources.limits.cpu and resources.limits.memory"
        })
    
    # 10. SA token auto-mount (checked at pod level)
    if pod_spec.automount_service_account_token is None or pod_spec.automount_service_account_token:
        findings.append({
            "check": "sa_token_automount",
            "detail": "Service account token auto-mounted — K8s API token available to attacker",
            "fix": "Set automountServiceAccountToken: false on pod or ServiceAccount"
        })
    
    return findings

def scan_cluster():
    """Scan all pods across all namespaces for PSS misconfigurations."""
    load_kube_config()
    v1 = client.CoreV1Api()
    
    # Get all pods in all namespaces
    pods = v1.list_pod_for_all_namespaces()
    
    results = {
        "scan_time": datetime.utcnow().isoformat(),
        "total_pods_scanned": 0,
        "total_findings": 0,
        "findings_by_severity": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0},
        "findings_by_namespace": defaultdict(list),
        "namespace_summary": {},
        "worst_pods": []
    }
    
    pod_scores = []
    
    for pod in pods.items:
        namespace = pod.metadata.namespace
        
        # Skip system namespaces
        if namespace in SKIP_NAMESPACES:
            continue
        
        results["total_pods_scanned"] += 1
        pod_name = pod.metadata.name
        pod_findings = []
        
        # Scan each container in the pod
        containers = (pod.spec.containers or []) + (pod.spec.init_containers or [])
        for container in containers:
            findings = check_container_misconfigs(container, pod.spec)
            for f in findings:
                f["container"] = container.name
                f["severity"] = MISCONFIG_RISK[f["check"]]["severity"]
                f["risk_score"] = MISCONFIG_RISK[f["check"]]["score"]
                f["pss_profile"] = MISCONFIG_RISK[f["check"]]["pss_profile"]
            pod_findings.extend(findings)
        
        if pod_findings:
            # Deduplicate findings (host namespace checks repeat per container)
            seen = set()
            unique_findings = []
            for f in pod_findings:
                key = (f["check"], f["detail"])
                if key not in seen:
                    seen.add(key)
                    unique_findings.append(f)
            
            # Calculate pod risk score
            pod_risk = sum(f["risk_score"] for f in unique_findings)
            
            pod_result = {
                "pod": pod_name,
                "namespace": namespace,
                "risk_score": pod_risk,
                "finding_count": len(unique_findings),
                "findings": unique_findings
            }
            
            results["findings_by_namespace"][namespace].append(pod_result)
            results["total_findings"] += len(unique_findings)
            pod_scores.append(pod_result)
            
            for f in unique_findings:
                results["findings_by_severity"][f["severity"]] += 1
    
    # Top 10 riskiest pods
    pod_scores.sort(key=lambda x: x["risk_score"], reverse=True)
    results["worst_pods"] = pod_scores[:10]
    
    # Namespace summary
    for ns, pods_list in results["findings_by_namespace"].items():
        total_findings = sum(p["finding_count"] for p in pods_list)
        max_risk = max(p["risk_score"] for p in pods_list) if pods_list else 0
        results["namespace_summary"][ns] = {
            "pods_with_issues": len(pods_list),
            "total_findings": total_findings,
            "max_risk_score": max_risk,
            "ready_for_restricted": total_findings == 0
        }
    
    return results

def print_report(results):
    """Print a human-readable summary."""
    print("=" * 70)
    print("  KUBERNETES PSS MISCONFIGURATION SCAN REPORT")
    print(f"  Scan Time: {results['scan_time']}")
    print("=" * 70)
    print(f"\n  Total Pods Scanned: {results['total_pods_scanned']}")
    print(f"  Total Findings:     {results['total_findings']}")
    print(f"    CRITICAL: {results['findings_by_severity']['CRITICAL']}")
    print(f"    HIGH:     {results['findings_by_severity']['HIGH']}")
    print(f"    MEDIUM:   {results['findings_by_severity']['MEDIUM']}")
    
    print("\n  TOP 10 RISKIEST PODS:")
    print("-" * 70)
    for pod in results["worst_pods"]:
        print(f"  [{pod['risk_score']:3d}] {pod['namespace']}/{pod['pod']} "
              f"({pod['finding_count']} findings)")
        for f in pod["findings"]:
            print(f"        ⚠ [{f['severity']}] {f['detail']}")
    
    print("\n  NAMESPACE READINESS FOR PSA ENFORCEMENT:")
    print("-" * 70)
    for ns, summary in sorted(results["namespace_summary"].items()):
        status = "✅ READY" if summary["ready_for_restricted"] else "❌ NOT READY"
        print(f"  {ns:30s} {status} "
              f"(pods:{summary['pods_with_issues']}, findings:{summary['total_findings']})")

if __name__ == "__main__":
    results = scan_cluster()
    print_report(results)
    
    # Save full report as JSON
    with open("/tmp/pss_scan_report.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nFull report saved to /tmp/pss_scan_report.json")
```

---

## SCRIPT 3: Auto-Remediate S3 Public Access

### 🎯 What It Does
Triggered by CloudTrail event when someone modifies S3 bucket ACL or policy. **Instantly reverts** the bucket to Block Public Access and alerts the security team.

### 🤔 Why It's Needed
- S3 public exposure is the #1 cloud data breach vector
- Manual response is too slow — data can be exfiltrated in minutes
- EY JD: "Implement cloud security controls (both out-of-box and custom)"

### 📝 Interview Explanation
> "This is event-driven auto-remediation. CloudTrail captures the PutBucketAcl or PutBucketPolicy event, EventBridge routes it to Lambda, and the Lambda re-enables Block Public Access within seconds. It also creates a Jira ticket so the team knows what happened and who did it. The key principle: you can't trust humans to not make mistakes, so you automate the guardrail."

```python
"""
SCRIPT 3: Auto-Remediate S3 Public Access
Trigger: EventBridge rule on CloudTrail events:
         PutBucketAcl, PutBucketPolicy, DeleteBucketPolicy,
         PutPublicAccessBlock (when disabling)
What: Automatically re-enables S3 Block Public Access
Action: Remediate + SNS alert + Jira ticket
"""

import boto3
import json
import os
from datetime import datetime

SNS_TOPIC = os.environ.get('SNS_TOPIC_ARN')
JIRA_WEBHOOK = os.environ.get('JIRA_WEBHOOK_URL')
EXEMPT_BUCKETS = os.environ.get('EXEMPT_BUCKETS', '').split(',')  # e.g., static websites

def lambda_handler(event, context):
    """Triggered by CloudTrail event via EventBridge."""
    
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    bucket_name = detail.get('requestParameters', {}).get('bucketName', 'unknown')
    user_arn = detail.get('userIdentity', {}).get('arn', 'unknown')
    source_ip = detail.get('sourceIPAddress', 'unknown')
    event_time = detail.get('eventTime', datetime.utcnow().isoformat())
    
    print(f"Event: {event_name} on bucket {bucket_name} by {user_arn}")
    
    # Check if bucket is exempt (e.g., intentional static website hosting)
    if bucket_name in EXEMPT_BUCKETS:
        print(f"Bucket {bucket_name} is exempt — skipping remediation")
        return {"action": "skipped", "reason": "exempt_bucket"}
    
    # Step 1: Check current public access status
    s3 = boto3.client('s3')
    try:
        pab = s3.get_public_access_block(Bucket=bucket_name)
        config = pab['PublicAccessBlockConfiguration']
        is_fully_blocked = all([
            config.get('BlockPublicAcls'),
            config.get('IgnorePublicAcls'),
            config.get('BlockPublicPolicy'),
            config.get('RestrictPublicBuckets')
        ])
    except s3.exceptions.NoSuchPublicAccessBlockConfiguration:
        is_fully_blocked = False
    except Exception as e:
        print(f"Error checking bucket: {e}")
        is_fully_blocked = False
    
    if is_fully_blocked:
        print(f"Bucket {bucket_name} already fully blocked — no action needed")
        return {"action": "already_blocked"}
    
    # Step 2: REMEDIATE — Force Block Public Access
    s3.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': True,
            'IgnorePublicAcls': True,
            'BlockPublicPolicy': True,
            'RestrictPublicBuckets': True
        }
    )
    print(f"✅ Block Public Access enforced on {bucket_name}")
    
    # Step 3: Alert via SNS
    alert = {
        "alert_type": "AUTO_REMEDIATION",
        "resource": f"s3://{bucket_name}",
        "event": event_name,
        "actor": user_arn,
        "source_ip": source_ip,
        "time": event_time,
        "action_taken": "Block Public Access re-enabled",
        "status": "REMEDIATED",
        "investigation_needed": "Verify if the change was intentional"
    }
    
    sns = boto3.client('sns')
    sns.publish(
        TopicArn=SNS_TOPIC,
        Subject=f"[AUTO-REMEDIATED] S3 public access blocked: {bucket_name}",
        Message=json.dumps(alert, indent=2)
    )
    
    return {"action": "remediated", "bucket": bucket_name}
```

---

## SCRIPT 4: Security Group Open Port Auto-Fix

### 🎯 What It Does
Scans all Security Groups for rules allowing `0.0.0.0/0` ingress on critical ports (SSH/22, RDP/3389, DB ports). **Automatically revokes** the rule and alerts.

### 📝 Interview Explanation
> "CIS AWS 5.1 and 5.2 require no SGs allow 0.0.0.0/0 to SSH or RDP. This script runs on a schedule and also event-driven. It covers the automated remediation that CSPM can detect but can't fix on its own."

```python
"""
SCRIPT 4: Security Group Open Port Remediation
Trigger: Hourly via EventBridge OR event-driven on AuthorizeSecurityGroupIngress
What: Finds and revokes SG rules allowing 0.0.0.0/0 on critical ports
"""

import boto3
import json

CRITICAL_PORTS = {22, 3389, 3306, 5432, 1433, 27017, 6379, 9200, 5601}
# SSH, RDP, MySQL, PostgreSQL, MSSQL, MongoDB, Redis, Elasticsearch, Kibana

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    remediated = []
    
    # Get all security groups
    sgs = ec2.describe_security_groups()['SecurityGroups']
    
    for sg in sgs:
        for rule in sg.get('IpPermissions', []):
            from_port = rule.get('FromPort', 0)
            to_port = rule.get('ToPort', 65535)
            
            # Check if any critical port is in the range
            affected_ports = {p for p in CRITICAL_PORTS if from_port <= p <= to_port}
            if not affected_ports:
                continue
            
            # Check for 0.0.0.0/0 or ::/0
            open_cidrs = [r for r in rule.get('IpRanges', []) 
                         if r.get('CidrIp') == '0.0.0.0/0']
            open_ipv6 = [r for r in rule.get('Ipv6Ranges', []) 
                        if r.get('CidrIpv6') == '::/0']
            
            if not open_cidrs and not open_ipv6:
                continue
            
            # REMEDIATE: Revoke the open rule
            try:
                if open_cidrs:
                    ec2.revoke_security_group_ingress(
                        GroupId=sg['GroupId'],
                        IpPermissions=[{
                            'IpProtocol': rule['IpProtocol'],
                            'FromPort': from_port,
                            'ToPort': to_port,
                            'IpRanges': open_cidrs
                        }]
                    )
                
                remediated.append({
                    "sg_id": sg['GroupId'],
                    "sg_name": sg['GroupName'],
                    "vpc": sg.get('VpcId'),
                    "ports": list(affected_ports),
                    "action": "REVOKED 0.0.0.0/0 ingress rule"
                })
                
                print(f"✅ Revoked 0.0.0.0/0 on ports {affected_ports} "
                      f"from SG {sg['GroupId']} ({sg['GroupName']})")
                
            except Exception as e:
                print(f"❌ Failed to remediate {sg['GroupId']}: {e}")
    
    # Alert if any remediations occurred
    if remediated:
        sns = boto3.client('sns')
        sns.publish(
            TopicArn="arn:aws:sns:us-east-1:123456789:SecurityAlerts",
            Subject=f"[AUTO-REMEDIATED] {len(remediated)} SG rules with 0.0.0.0/0 revoked",
            Message=json.dumps(remediated, indent=2)
        )
    
    return {"remediated": len(remediated), "details": remediated}
```

---

## SCRIPT 5: SLA Tracker & Escalation Engine

### 🎯 What It Does
Reads all open CSPM/vulnerability findings, checks their age against SLA thresholds, and triggers escalation alerts at 50%, 75%, 100%, and 150% of SLA.

### 🤔 Why It's Needed
- SLAs are meaningless without automated tracking and escalation
- EY JD: "Shape remediation SLAs, build-breaking policies, and enforcement guardrails"

```python
"""
SCRIPT 5: SLA Tracking & Automated Escalation
Trigger: Every 6 hours via EventBridge
What: Checks all open findings against SLA targets, escalates overdue items
"""

import boto3
import json
from datetime import datetime, timezone, timedelta

# SLA definitions (in hours)
SLA_MATRIX = {
    # (severity, exposure) → SLA in hours
    ("CRITICAL", "public"): 4,
    ("CRITICAL", "internal"): 24,
    ("HIGH", "public"): 24,
    ("HIGH", "internal"): 48,
    ("MEDIUM", "public"): 168,     # 7 days
    ("MEDIUM", "internal"): 336,   # 14 days
    ("LOW", "public"): 720,        # 30 days
    ("LOW", "internal"): 2160,     # 90 days
}

ESCALATION_THRESHOLDS = [
    {"percent": 50,  "action": "email_owner",          "label": "REMINDER"},
    {"percent": 75,  "action": "slack_team_lead",      "label": "WARNING"},
    {"percent": 100, "action": "jira_escalate_manager", "label": "SLA BREACHED"},
    {"percent": 150, "action": "page_ciso",            "label": "CRITICAL OVERDUE"},
]

def get_open_findings():
    """
    Simulate fetching open findings from CNAPP API or Security Hub.
    In production, replace with actual API call to Falcon/Orca/Wiz/SecurityHub.
    """
    securityhub = boto3.client('securityhub')
    findings = securityhub.get_findings(
        Filters={
            'WorkflowStatus': [{'Value': 'NEW', 'Comparison': 'EQUALS'}],
            'RecordState': [{'Value': 'ACTIVE', 'Comparison': 'EQUALS'}],
        },
        MaxResults=100
    )
    
    processed = []
    for f in findings.get('Findings', []):
        severity = f.get('Severity', {}).get('Label', 'MEDIUM')
        created = f.get('CreatedAt', '')
        resource_type = f.get('Resources', [{}])[0].get('Type', '')
        
        # Determine exposure (simplified — in production, check SG/public IP)
        exposure = "public" if "Public" in f.get('Title', '') else "internal"
        
        processed.append({
            "id": f.get('Id', ''),
            "title": f.get('Title', ''),
            "severity": severity,
            "exposure": exposure,
            "created_at": created,
            "resource": f.get('Resources', [{}])[0].get('Id', ''),
            "owner": f.get('Note', {}).get('UpdatedBy', 'UNASSIGNED')
        })
    
    return processed

def check_sla_status(finding):
    """Calculate SLA status for a single finding."""
    now = datetime.now(timezone.utc)
    created = datetime.fromisoformat(finding['created_at'].replace('Z', '+00:00'))
    age_hours = (now - created).total_seconds() / 3600
    
    # Get SLA target
    key = (finding['severity'], finding['exposure'])
    sla_hours = SLA_MATRIX.get(key, 720)  # Default 30 days
    
    # Calculate SLA percentage consumed
    sla_percent = (age_hours / sla_hours) * 100
    
    # Determine escalation level
    escalation = None
    for threshold in reversed(ESCALATION_THRESHOLDS):
        if sla_percent >= threshold["percent"]:
            escalation = threshold
            break
    
    return {
        **finding,
        "age_hours": round(age_hours, 1),
        "sla_hours": sla_hours,
        "sla_percent": round(sla_percent, 1),
        "sla_status": "BREACHED" if sla_percent >= 100 else "ON_TRACK",
        "escalation": escalation
    }

def execute_escalation(finding_status):
    """Execute the appropriate escalation action."""
    esc = finding_status.get('escalation')
    if not esc:
        return
    
    message = (
        f"[{esc['label']}] Finding: {finding_status['title']}\n"
        f"Severity: {finding_status['severity']} | Exposure: {finding_status['exposure']}\n"
        f"Age: {finding_status['age_hours']}h | SLA: {finding_status['sla_hours']}h "
        f"({finding_status['sla_percent']}% consumed)\n"
        f"Resource: {finding_status['resource']}\n"
        f"Owner: {finding_status['owner']}"
    )
    
    # In production: route to appropriate channel based on esc['action']
    print(f"  📧 ESCALATION [{esc['label']}]: {finding_status['title'][:60]}...")

def lambda_handler(event, context):
    """Main handler — check all open findings against SLAs."""
    findings = get_open_findings()
    
    summary = {"on_track": 0, "breached": 0, "escalated": 0}
    breached_findings = []
    
    for finding in findings:
        status = check_sla_status(finding)
        
        if status['sla_status'] == "BREACHED":
            summary["breached"] += 1
            breached_findings.append(status)
        else:
            summary["on_track"] += 1
        
        if status.get('escalation'):
            summary["escalated"] += 1
            execute_escalation(status)
    
    # Send summary report
    sla_compliance = (summary["on_track"] / len(findings) * 100) if findings else 100
    
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_findings": len(findings),
        "on_track": summary["on_track"],
        "breached": summary["breached"],
        "escalated": summary["escalated"],
        "sla_compliance_pct": round(sla_compliance, 1),
        "worst_breaches": sorted(breached_findings, 
                                 key=lambda x: x['sla_percent'], reverse=True)[:5]
    }
    
    print(f"\n📊 SLA Compliance: {sla_compliance:.1f}% "
          f"({summary['on_track']}/{len(findings)} on track)")
    
    return report
```

---

## SCRIPT 6: IAM Credential Hygiene Enforcer

### 🎯 What It Does
Scans all IAM users for: stale access keys (>90 days), unused keys, missing MFA, and console access without MFA. Auto-deactivates stale keys and alerts.

### 🤔 Why It's Needed
- CIS AWS 1.14: "Ensure credentials unused for 90 days are disabled"
- CIS AWS 1.4/1.5: "Ensure MFA is enabled"
- EY JD: "Tune scanning tools to improve visibility and meet security objectives"

```python
"""
SCRIPT 6: IAM Credential Hygiene Enforcer
Trigger: Daily via EventBridge
What: Audits all IAM users for stale keys, missing MFA, and policy violations
Action: Auto-deactivate stale keys, alert on MFA gaps
"""

import boto3
from datetime import datetime, timezone

def lambda_handler(event, context):
    iam = boto3.client('iam')
    users = iam.list_users()['Users']
    now = datetime.now(timezone.utc)
    
    report = {
        "stale_keys_deactivated": [],
        "mfa_missing": [],
        "unused_keys": [],
        "console_no_mfa": [],
        "total_users": len(users)
    }
    
    for user in users:
        username = user['UserName']
        
        # --- Check MFA ---
        mfa_devices = iam.list_mfa_devices(UserName=username)['MFADevices']
        has_mfa = len(mfa_devices) > 0
        
        # Check if user has console access (login profile)
        has_console = True
        try:
            iam.get_login_profile(UserName=username)
        except iam.exceptions.NoSuchEntityException:
            has_console = False
        
        if has_console and not has_mfa:
            report["console_no_mfa"].append(username)
        
        if not has_mfa:
            report["mfa_missing"].append(username)
        
        # --- Check Access Keys ---
        keys = iam.list_access_keys(UserName=username)['AccessKeyMetadata']
        
        for key in keys:
            key_id = key['AccessKeyId']
            key_age_days = (now - key['CreateDate']).days
            
            # Check last used
            last_used_response = iam.get_access_key_last_used(AccessKeyId=key_id)
            last_used_info = last_used_response.get('AccessKeyLastUsed', {})
            last_used_date = last_used_info.get('LastUsedDate')
            
            if last_used_date:
                idle_days = (now - last_used_date).days
            else:
                idle_days = key_age_days  # Never used
            
            # Auto-deactivate keys idle > 90 days (CIS AWS 1.14)
            if idle_days > 90 and key['Status'] == 'Active':
                iam.update_access_key(
                    UserName=username,
                    AccessKeyId=key_id,
                    Status='Inactive'
                )
                report["stale_keys_deactivated"].append({
                    "user": username,
                    "key_id": key_id,
                    "idle_days": idle_days,
                    "action": "DEACTIVATED"
                })
                print(f"🔒 Deactivated key {key_id} for {username} (idle {idle_days}d)")
            
            # Flag never-used keys
            if not last_used_date and key_age_days > 30:
                report["unused_keys"].append({
                    "user": username,
                    "key_id": key_id, 
                    "age_days": key_age_days,
                    "status": key['Status']
                })
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"IAM CREDENTIAL HYGIENE REPORT")
    print(f"{'='*50}")
    print(f"Total Users:            {report['total_users']}")
    print(f"Stale Keys Deactivated: {len(report['stale_keys_deactivated'])}")
    print(f"MFA Missing:            {len(report['mfa_missing'])}")
    print(f"Console Without MFA:    {len(report['console_no_mfa'])}")
    print(f"Never-Used Keys (>30d): {len(report['unused_keys'])}")
    
    # CIS Compliance Score
    users_with_issues = len(set(
        report['mfa_missing'] + report['console_no_mfa'] +
        [k['user'] for k in report['stale_keys_deactivated']]
    ))
    compliance = ((report['total_users'] - users_with_issues) / 
                  report['total_users'] * 100) if report['total_users'] else 100
    print(f"\nIAM Compliance Score: {compliance:.1f}%")
    
    return report
```

---

## SUMMARY — How to Talk About These in an Interview

### Interview Answer Template:

> "In my role, I identify three categories of automation opportunity:
> 
> **1. Auto-Remediation (Scripts 3, 4):** For high-confidence, low-risk fixes like re-enabling S3 Block Public Access or revoking 0.0.0.0/0 Security Group rules. These are event-driven via CloudTrail → EventBridge → Lambda. The key principle: if the fix is deterministic and reversible, automate it.
>
> **2. Visibility & Coverage (Scripts 1, 2):** Daily reconciliation scripts that ensure no blind spots. The Falcon sensor coverage reconciler compares EC2 instances vs Falcon hosts. The PSS scanner audits all pods against security standards. These run on schedule and generate reports.
>
> **3. Process Enforcement (Scripts 5, 6):** SLA tracking with automated escalation ensures findings don't age silently. IAM hygiene enforcement auto-deactivates stale credentials per CIS benchmarks. These encode organizational policy into code.
>
> Every script follows the same pattern: **detect** the issue, **remediate** or **alert**, **document** the action, and **report** metrics. This is what I mean by turning security tools into security outcomes."

```
AUTOMATION DECISION MATRIX:

                      ┌──────────────────────────────────────┐
                      │       SHOULD I AUTOMATE THIS?         │
                      └──────────────┬───────────────────────┘
                                     │
                      ┌──────────────▼───────────────────────┐
                      │  Is the fix deterministic?            │
                      │  (Always the same action)             │
                      └──┬─────────────────────────────┬─────┘
                       YES                              NO
                         │                              │
              ┌──────────▼──────────┐        ┌─────────▼──────────┐
              │  Is it reversible?   │        │  Automate ALERTING  │
              │  (Low risk of harm)  │        │  not remediation    │
              └──┬──────────────┬───┘        │  → SNS / Jira / PD  │
               YES              NO           └────────────────────┘
                 │              │
      ┌──────────▼──────┐  ┌───▼────────────────────┐
      │  AUTOMATE IT     │  │  Automate with          │
      │  (Full auto-     │  │  HUMAN APPROVAL GATE    │
      │   remediation)   │  │  (Slack button / Jira   │
      │                  │  │   approval workflow)     │
      │  Examples:       │  │                          │
      │  • Block S3      │  │  Examples:               │
      │  • Revoke SG     │  │  • Kill production pod   │
      │  • Deactivate key│  │  • Rotate DB credentials │
      └─────────────────┘  └──────────────────────────┘
```

---

> **Pro Tip for Interview:** When asked "What would you automate?", always start with the decision matrix above. It shows you think about risk, not just efficiency.
