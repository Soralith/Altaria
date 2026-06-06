---
name: alscan
description: Broad security audit — dependency vulns, exposed secrets, .env leaks, misconfigurations, and hygiene issues
---

## What I do

I scan the project for security issues: dependency vulnerabilities (npm/pip/cargo), hardcoded secrets/API keys, missing .env.example, uncommitted lock files, Docker port exposure, and other hygiene problems.

## When to use me

Use when the user asks to scan, audit, check security, or review for vulnerabilities or secrets exposure.

## Instructions

Call `altaria_scan_vulnerabilities` to run the scan. Present a severity summary (critical/high/moderate/low/info) with per-finding details and recommended fixes. Write the full report to `Altaria/Altaria-Scan.md` in the project root.
