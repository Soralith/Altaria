import { tool } from "@opencode-ai/plugin"
import { mkdirSync, cpSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

const PKG_ROOT = join(new URL('.', import.meta.url).pathname, '..')

try {
  const home = process.env.HOME || process.env.USERPROFILE || '/root'
  const opencodeDir = join(home, '.config', 'opencode')
  for (const type of ['skills', 'commands']) {
    const src = join(PKG_ROOT, type)
    const dst = join(opencodeDir, type)
    if (existsSync(src) && readdirSync(src).length > 0) {
      mkdirSync(dst, { recursive: true })
      for (const file of readdirSync(src)) {
        const srcFile = join(src, file)
        const dstFile = join(dst, file)
        if (!existsSync(dstFile)) cpSync(srcFile, dstFile, { recursive: true })
      }
    }
  }
} catch {}

export const AltariaPlugin = async ({ $, directory }) => {
  return {
    tool: {
      altaria_analyze_project: tool({
        description: "Scans the entire project to identify: tech stack (frameworks, language, build tools), database, architecture style, directory structure, and core capabilities (auth, validation, testing). Returns structured JSON.",
        args: {},
        async execute(_args, context) {
          const root = context.directory || directory
          const report = { techStack: [], database: null, architecture: null, directoryTree: "", capabilities: {} }
          try {
            const pkgRaw = await Bun.file(`${root}/package.json`).text()
            const pkg = JSON.parse(pkgRaw)
            const deps = { ...pkg.dependencies, ...pkg.devDependencies }
            if (deps.next) report.techStack.push("Next.js")
            else if (deps["@remix-run/react"]) report.techStack.push("Remix")
            else if (deps["@angular/core"]) report.techStack.push("Angular")
            else if (deps.react) report.techStack.push("React")
            else if (deps.vue) report.techStack.push("Vue")
            else if (deps.svelte) report.techStack.push("Svelte")
            else if (deps.express) report.techStack.push("Express")
            else if (deps.fastify) report.techStack.push("Fastify")
            else if (deps.nest) report.techStack.push("NestJS")
            if (deps.typescript) report.techStack.push("TypeScript")
            if (deps.prisma || deps["@prisma/client"]) { report.database = "PostgreSQL/SQLite (Prisma ORM)"; report.techStack.push("Prisma") }
            else if (deps.mongoose) report.database = "MongoDB (Mongoose)"
            else if (deps["typeorm"]) { report.database = "SQL (TypeORM)"; report.techStack.push("TypeORM") }
            else if (deps["drizzle-orm"]) { report.database = "SQL (Drizzle ORM)"; report.techStack.push("Drizzle ORM") }
            else if (deps.pg) report.database = "PostgreSQL (node-postgres)"
            else if (deps.mysql2) report.database = "MySQL"
            if (deps.zod) report.capabilities["Validation"] = "Zod"
            else if (deps.yup) report.capabilities["Validation"] = "Yup"
            else if (deps.joi) report.capabilities["Validation"] = "Joi"
            if (deps["jsonwebtoken"] || deps["jose"]) report.capabilities["Authentication"] = "JWT"
            else if (deps["next-auth"] || deps["@next-auth"]) report.capabilities["Authentication"] = "NextAuth.js"
            else if (deps.passport) report.capabilities["Authentication"] = "Passport.js"
            else if (deps["@clerk/nextjs"]) report.capabilities["Authentication"] = "Clerk"
            if (deps.jest) report.techStack.push("Jest")
            if (deps.vitest) report.techStack.push("Vitest")
            if (deps.cypress) report.techStack.push("Cypress")
            if (deps.playwright) report.techStack.push("Playwright")
            if (deps.tailwindcss) report.techStack.push("Tailwind CSS")
            if (deps.vite) report.techStack.push("Vite")
            else if (deps.webpack) report.techStack.push("Webpack")
            else if (deps.esbuild) report.techStack.push("esbuild")
            if (deps.turbopack) report.techStack.push("Turbopack")
            if (pkg.name) report.projectName = pkg.name
            if (pkg.description) report.description = pkg.description
          } catch {}
          try {
            const pyRaw = await Bun.file(`${root}/requirements.txt`).text()
            if (pyRaw.includes("django")) report.techStack.push("Django")
            if (pyRaw.includes("flask")) report.techStack.push("Flask")
            if (pyRaw.includes("fastapi")) report.techStack.push("FastAPI")
          } catch {}
          try {
            const cargoRaw = await Bun.file(`${root}/Cargo.toml`).text()
            if (cargoRaw.includes("actix")) report.techStack.push("Actix-web")
            if (cargoRaw.includes("axum")) report.techStack.push("Axum")
            if (cargoRaw.includes("rocket")) report.techStack.push("Rocket")
          } catch {}
          try {
            const topLevel = (await $`ls ${root}`.text()).split("\n").filter(Boolean)
            const srcDirs = topLevel.includes("src") ? (await $`ls ${root}/src`.text()).split("\n").map(s => s.trim()).filter(Boolean) : []
            const allDirs = [...topLevel, ...srcDirs.map(d => `src/${d}`)]
            if (["controllers", "models", "routes", "services", "views"].some(d => allDirs.includes(d) || allDirs.includes(`src/${d}`)))
              report.architecture = "MVC (Model-View-Controller)"
            else if (topLevel.includes("pages") || topLevel.includes("app") || topLevel.includes("components"))
              report.architecture = "Component-based (React/Next.js)"
            else if (topLevel.includes("api") || topLevel.includes("routes"))
              report.architecture = "Routes-based API"
          } catch {}
          try {
            report.directoryTree = await $`find ${root} -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/__pycache__/*' -not -path '*/.next/*' -not -path '*/coverage/*' -not -path '*/target/*' | sort`.text()
          } catch {}
          return JSON.stringify(report, null, 2)
        },
      }),

      altaria_analyze_file: tool({
        description: "Analyze a single file: detect its purpose, imports/exports, key functions/classes, dependencies, and how it fits in the project.",
        args: { file: tool.schema.string().describe("Relative path to the target file from project root") },
        async execute(args, context) {
          const root = context.directory || directory
          const fp = `${root}/${args.file}`
          try { await Bun.file(fp).stat() } catch { return JSON.stringify({ error: `File not found: ${args.file}` }) }
          const content = await Bun.file(fp).text()
          const ext = args.file.split(".").pop()?.toLowerCase() || ""
          const analysis = { file: args.file, sizeBytes: content.length, lines: content.split("\n").length, extension: ext, imports: [], exports: [], keyElements: [] }
          if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext)) {
            for (const m of content.matchAll(/import\s+(?:\{[^}]*\}\s+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g)) analysis.imports.push(m[1] || m[2])
            for (const m of content.matchAll(/export\s+(?:default\s+)?(?:const|function|class|interface|type|enum|let|var)\s+(\w+)/g)) analysis.exports.push(m[1])
            for (const m of content.matchAll(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g)) analysis.keyElements.push({ type: "class", name: m[1] })
            for (const m of content.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g)) analysis.keyElements.push({ type: "function", name: m[1] })
          }
          if (["py"].includes(ext)) {
            for (const m of content.matchAll(/^(?:from\s+(\S+)\s+)?import\s+(\S+)/gm)) analysis.imports.push(m[1] ? `${m[1]}.${m[2]}` : m[2])
            for (const m of content.matchAll(/(?:class)\s+(\w+)/g)) analysis.keyElements.push({ type: "class", name: m[1] })
            for (const m of content.matchAll(/(?:def)\s+(\w+)/g)) analysis.keyElements.push({ type: "function", name: m[1] })
          }
          if (["json"].includes(ext)) try { analysis.parsedKeys = Object.keys(JSON.parse(content)) } catch {}
          return JSON.stringify(analysis, null, 2)
        },
      }),

      altaria_map_structure: tool({
        description: "Generate a clean hierarchical directory tree of the project, excluding node_modules, .git, build artifacts, and cache dirs. Returns plain text.",
        args: {},
        async execute(_args, context) {
          const root = context.directory || directory
          return await $`find ${root} -maxdepth 4 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/__pycache__/*' -not -path '*/.next/*' -not -path '*/coverage/*' -not -path '*/target/*' -not -path '*/cache/*' | sort`.text()
        },
      }),

      altaria_scan_vulnerabilities: tool({
        description: "Broad security audit: dependency audits (npm/pip/cargo), exposed secrets, .env leaks, misconfigurations, and hygiene issues across any project type.",
        args: {},
        async execute(_args, context) {
          const root = context.directory || directory
          const report = { scanner: "Altaria Security Scan", summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0 }, findings: [], projectType: null, auditErrors: [] }
          async function addFinding(severity, title, detail, fix) {
            report.summary[severity] ??= 0; report.summary[severity]++
            report.findings.push({ severity, title, detail, fix: fix || null })
          }
          const exists = f => Bun.file(`${root}/${f}`).stat().then(() => true).catch(() => false)
          const readSafe = async f => { try { return await Bun.file(`${root}/${f}`).text() } catch { return "" } }

          // 1. Project type detection
          const [hasPkg, hasPyReq, hasCargo, hasDocker, hasEnv, hasEnvExample, hasGitignore, hasCompose] =
            await Promise.all([exists("package.json"), exists("requirements.txt"), exists("Cargo.toml"), exists("Dockerfile"), exists(".env"), exists(".env.example"), exists(".gitignore"), exists("docker-compose.yml")])
          if (hasPkg) report.projectType = "npm"
          else if (hasPyReq) report.projectType = "python"
          else if (hasCargo) report.projectType = "rust"

          // 2. .env hygiene
          if (hasEnv && !hasEnvExample) await addFinding("moderate", "Missing .env.example", ".env exists but no .env.example — template env vars may be undocumented", "Create a .env.example with placeholder values")
          if (hasEnv && hasGitignore) {
            const gi = await readSafe(".gitignore")
            if (!gi.includes(".env")) await addFinding("high", ".env not in .gitignore", ".env file found but .gitignore does not list it — secrets could be committed", "Add `.env` to .gitignore")
          }

          // 3. Exposed secrets / hardcoded credentials
          const secretPatterns = [
            { pattern: /(?:api[_-]?key|apikey|secret|token|password|passwd)\s*[:=]\s*['\"](?!\{|\$|%|<\/)[^'\"]{8,}['\"]/gi, label: "Hardcoded credential" },
            { pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/gi, label: "Embedded private key" },
            { pattern: /sk_live_[0-9a-z]{32}/gi, label: "Stripe live secret key" },
            { pattern: /pk_live_[0-9a-z]{32}/gi, label: "Stripe live publishable key" },
            { pattern: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/gi, label: "GitHub token" },
            { pattern: /AKIA[0-9A-Z]{16}/gi, label: "AWS access key" },
          ]
          const srcFiles = (await $`find ${root} -type f \( -name '*.js' -o -name '*.ts' -o -name '*.py' -o -name '*.env*' -o -name '*.yml' -o -name '*.yaml' -o -name '*.json' -o -name '*.sh' -o -name '*.rb' -o -name '*.go' -o -name '*.rs' -o -name '*.java' -o -name '*.php' -o -name '*.cs' \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/target/*' -not -path '*/vendor/*' -not -path '*/__pycache__/*' 2>/dev/null`.text()).trim().split("\n").filter(Boolean)
          for (const fp of srcFiles.slice(0, 300)) {
            const content = await readSafe(fp.replace(root, "").replace(/^\//, ""))
            for (const { pattern, label } of secretPatterns) {
              const matches = content.match(pattern)
              if (matches) await addFinding("critical", label, `Found in ${fp.replace(root, "")}: ${matches.length} match(es)`, "Remove from source, use environment variables or a vault")
            }
          }

          // 4. npm audit
          if (hasPkg) {
            try {
              const auditJson = await $`cd ${root} && npm audit --json 2>/dev/null`.text()
              if (auditJson && auditJson.trim()) {
                const audit = JSON.parse(auditJson)
                if (audit.vulnerabilities) {
                  for (const [pkgName, info] of Object.entries(audit.vulnerabilities)) {
                    const v = info
                    const via = v.via?.map(x => typeof x === "string" ? x : x.source || x.name).filter(Boolean).join(", ") || "unknown"
                    await addFinding(v.severity, `npm: ${pkgName}`, via, v.fixAvailable?.name ? `Upgrade to ${v.fixAvailable.name}@${v.fixAvailable.version}` : "No fix available")
                  }
                }
              }
            } catch (e) { report.auditErrors.push(`npm audit: ${e.message || e}`) }
          }

          // 5. Python dependency check (basic)
          if (hasPyReq) {
            const reqs = await readSafe("requirements.txt")
            const pinned = reqs.split("\n").filter(l => l.includes("==")).length
            const total = reqs.split("\n").filter(l => l.trim() && !l.startsWith("#")).length
            if (total > 0 && pinned < total) await addFinding("low", "Python deps not pinned", `${pinned}/${total} requirements pinned with ==`, "Pin all versions to avoid supply-chain risk")
          }

          // 6. Cargo audit
          if (hasCargo) {
            try {
              const auditOut = await $`cd ${root} && cargo audit --json 2>/dev/null`.text()
              if (auditOut && auditOut.trim()) {
                const parsed = JSON.parse(auditOut)
                if (parsed.vulnerabilities?.count > 0) {
                  for (const adv of parsed.vulnerabilities?.list || []) {
                    await addFinding(adv.severity || "high", `cargo: ${adv.package}`, adv.title || adv.id, `Upgrade ${adv.package} to ${adv.patched_version || "latest"}`)
                  }
                }
              }
            } catch (e) { report.auditErrors.push(`cargo audit: ${e.message || e}`) }
          }

          // 7. Git hygiene
          try {
            const { stdout: gitignored } = await $`cd ${root} && git ls-files --others --exclude-standard 2>/dev/null`.quiet()
            if (gitignored && gitignored.trim()) {
              const lines = gitignored.trim().split("\n").filter(Boolean)
              await addFinding("info", `Untracked files (${lines.length})`, lines.slice(0, 10).join(", ") + (lines.length > 10 ? ` +${lines.length - 10} more` : ""), "Review and clean up untracked files")
            }
          } catch {}

          // 8. Docker exposure
          if (hasDocker) {
            const df = await readSafe("Dockerfile")
            const exposed = [...df.matchAll(/EXPOSE\s+(\d+)/g)]
            if (exposed.length > 0) {
              const ports = exposed.map(m => m[1]).join(", ")
              await addFinding("info", `Docker exposes ${exposed.length} port(s)`, `Ports: ${ports}`, "Ensure only necessary ports are exposed")
            }
          }

          // 9. Outdated lock file
          if (hasPkg) {
            const hasLock = await exists("package-lock.json") || await exists("yarn.lock") || await exists("pnpm-lock.yaml") || await exists("bun.lock")
            if (!hasLock) await addFinding("moderate", "Missing lock file", "package.json found but no lock file (package-lock.json / yarn.lock / pnpm-lock.yaml / bun.lock)", "Commit a lock file for reproducible installs")
          }

          // 10. Unbounded dependency range
          if (hasPkg) {
            const pj = JSON.parse(await readSafe("package.json"))
            const deps = { ...pj.dependencies, ...pj.devDependencies }
            const unbounded = Object.entries(deps).filter(([, v]) => /^[^*]/.test(v) && !v.startsWith("npm:")).filter(([, v]) => /^[\^~<>=]/.test(v) || v === "*").map(([k]) => k)
            if (unbounded.length > 0) await addFinding("low", `${unbounded.length} unbounded dep(s)`, unbounded.slice(0, 15).join(", "), "Pin major versions to avoid breaking changes")
          }

          return JSON.stringify(report, null, 2)
        },
      }),
    },
  }
}
