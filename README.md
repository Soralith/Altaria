<p align="center">
  <img src="images/Altaria.png" alt="Altaria Logo" width="100%">
</p>

<h1 align="center">Altaria</h1>

<p align="center">
  <strong>An advanced contextual codebase analysis suite for <a href="https://opencode.ai">OpenCode</a>.</strong><br>
  Fly through complex codebases, map dependencies, and extract deep insights instantly.
</p>

<p align="center">
  <a href="https://github.com/Soralith/Altaria/stargazers"><img src="https://img.shields.io/github/stars/Soralith/Altaria?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/Soralith/Altaria/issues"><img src="https://img.shields.io/github/issues/Soralith/Altaria?style=flat-square" alt="Issues"></a>
  <a href="https://github.com/Soralith/Altaria/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Soralith/Altaria?style=flat-square" alt="License"></a>
</p>

---

## 🦅 What is Altaria?

Inspired by the sharp vision and message-carrying nature of the eagle (**Altair**), **Altaria** is an extension built to eliminate cognitive friction when diving into unfamiliar or massive codebases. It provides a bird's-eye view of your project's architecture, performs high-precision micro-analysis on targeted files, and audits your workspace for anomalies—all directly inside the OpenCode terminal interface.

## 🛠️ Slash Commands

Altaria registers 4 core commands into your OpenCode environment:

| Command | Action | Description |
| :--- | :--- | :--- |
| **`/alscout`** | Scout Report | Scans the entire workspace to identify the tech stack, database, architecture, and core capabilities |
| **`/alswoop`** | Target Deep-Dive | Dissects a specific file's inner logic, imports/exports, key functions, and side-effects |
| **`/almap`** | Architecture Map | Generates a clean hierarchical directory tree and dependency flow |
| **`/alscan`** | Security Audit | Scans for exposed secrets, .env leaks, package vulnerabilities, and misconfigurations |

## 🚀 Installation

```bash
git clone https://github.com/Soralith/Altaria.git /tmp/altaria
cp -r /tmp/altaria/skills/* ~/.config/opencode/skills/
cp /tmp/altaria/commands/*.md ~/.config/opencode/commands/
cp /tmp/altaria/plugin/altaria.js ~/.config/opencode/plugins/
rm -rf /tmp/altaria
```

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**[GitHub](https://github.com/Soralith/Altaria) · [Report a bug](https://github.com/Soralith/Altaria/issues)**
