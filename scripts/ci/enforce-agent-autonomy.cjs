#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('node:fs')
const path = require('node:path')

const agentsDir = path.resolve(process.cwd(), '.github', 'agents')

const forbiddenPatterns = [
  { label: 'ask-user', regex: /\bask\s+user\b/i },
  { label: 'do-you-want', regex: /\bdo\s+you\s+want\b/i },
  { label: 'would-you-like', regex: /\bwould\s+you\s+like\b/i },
  { label: 'if-you-want', regex: /\bif\s+you\s+want\b/i },
  { label: 'let-me-know', regex: /\blet\s+me\s+know\b/i },
  { label: 'user-approval-required', regex: /\buser\s+approval\s+required\b/i },
  { label: 'with-user-approval', regex: /\bwith\s+user\s+approval\b/i },
  { label: 'provide-options-to-user', regex: /\bprovide\s+\d*\s*options\s+to\s+user\b/i },
  { label: 'question-template', regex: /^\s*Question:\s*\[specific/i },
]

function listAgentFiles(directory) {
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.agent.md'))
    .map((name) => path.join(directory, name))
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const violations = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(line)) {
        violations.push({
          filePath,
          lineNumber: index + 1,
          label: pattern.label,
          line: line.trim(),
        })
      }
    }
  }

  return violations
}

if (!fs.existsSync(agentsDir)) {
  console.error(`Autonomy policy check failed: missing directory ${agentsDir}`)
  process.exit(1)
}

const agentFiles = listAgentFiles(agentsDir)
const violations = agentFiles.flatMap(scanFile)

if (violations.length > 0) {
  console.error('❌ Agent autonomy policy violation(s) detected:')
  for (const violation of violations) {
    const relPath = path.relative(process.cwd(), violation.filePath).replace(/\\/g, '/')
    console.error(
      `- ${relPath}:${violation.lineNumber} [${violation.label}] ${violation.line}`,
    )
  }
  console.error(
    '\nPolicy: agent files must not ask users for preferences, approvals, or optional next steps.',
  )
  process.exit(1)
}

console.log(`✅ Agent autonomy policy check passed (${agentFiles.length} agent files scanned).`)
