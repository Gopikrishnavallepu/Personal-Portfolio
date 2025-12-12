---
date: "2025-12-11T14:30:00+00:00"
month: "December"
week: 50
topic: "Container Security Basics"
category: "CloudSecurity"
focus: "Docker/Container Scanning"
activity: "Set up Trivy scanner and scan Docker images"
key_task: "container-sec-1"
tool_concept: "Trivy, Docker, Image Scanning"
status: "Published"
links:
  github: ""
  medium: ""
  hashnode: ""
  devto: ""
  substack: ""
  notion: ""
  gitbook: ""
---

# Container Security Basics

Container security is critical in modern DevSecOps pipelines. This post walks through scanning Docker images for vulnerabilities.

## Goals for this week

- Understand container image structure
- Set up vulnerability scanning with Trivy
- Integrate scanning into build pipeline

## What is Trivy?

Trivy is a simple, comprehensive vulnerability scanner for containers and other artifacts. It scans for:
- OS package vulnerabilities (Alpine, Debian, etc.)
- Language-specific dependencies (npm, pip, gem, etc.)
- Misconfigurations

## Installation

```bash
# macOS
brew install aquasecurity/trivy/trivy

# Linux
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list
apt-get update && apt-get install trivy

# Docker (easiest)
docker run aquasec/trivy --version
```

## Scanning your first image

```bash
# Scan a public image
trivy image ubuntu:22.04

# Scan a local image
trivy image myapp:latest

# Output as JSON for automation
trivy image --format json myapp:latest > vulnerabilities.json
```

## Key findings

- Most images have vulnerabilities in base OS packages
- Regular updates and patching are essential
- Use minimal base images (alpine, distroless) to reduce attack surface

## Next steps

- Integrate Trivy into GitHub Actions
- Set severity thresholds and gates
- Document findings and remediation
