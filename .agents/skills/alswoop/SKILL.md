---
name: alswoop
description: Deep-dive analysis of a single file — imports, exports, key functions/classes, structure, and project role
---

## What I do

I deep-dive into a single file and report its structure: imports, exports, key classes/functions, size, and how it fits in the project.

## When to use me

Use when the user asks to analyze, inspect, or dive into a specific file — or when you need to understand a file's role and dependencies.

## Instructions

Ask the user which file to analyze if none was specified, then call `altaria_analyze_file` with the file path. Present the results and write the full report to `Altaria/Altaria-Swoop.md` in the project root.
