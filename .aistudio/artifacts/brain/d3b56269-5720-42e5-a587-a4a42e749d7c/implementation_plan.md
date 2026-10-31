# Implementation Plan - Install REA & Connect to Coding Agent

Install REA (Reverse Engineer Anything) via `npx rea-agents@latest setup`, configure the Model Context Protocol (MCP) server integration for Gemini CLI and Antigravity profiles, prioritize Web & JavaScript reverse engineering workflows, and verify the installation.

## User Review Required

> [!IMPORTANT]
> REA is an open-source MCP server and CLI tool providing reverse-engineering capabilities. In this cloud container environment, REA will register its stdio MCP server configuration in `/root/.gemini/settings.json` and `/root/.gemini/config/mcp_config.json`. Application source code will remain untouched.

- **Target Agent**: `gemini_cli` and `antigravity`
- **Focus Area**: Web & JavaScript source recovery, runtime observation, and source map tracing
- **Non-destructive**: Will not modify existing AutoAudit web application code

---

## Proposed Changes

### System & Agent Configuration

#### Agent Configuration Files (`/root/.gemini/settings.json` & `/root/.gemini/config/mcp_config.json`)
- Run non-interactive setup: `npx -y rea-agents@latest setup --client gemini_cli --client antigravity -y`
- Register REA's MCP stdio server definition so coding agent sessions can invoke REA analysis tools
- Install bundled skill instructions for reverse-engineering workflows

---

## Verification Plan

### Automated Verification
1. **Tool Verification**:
   - Run `npx rea-agents@latest --version` to confirm CLI version
   - Run `npx rea-agents@latest mcp doctor` to validate MCP server registration and health
2. **Config Inspection**:
   - Inspect `/root/.gemini/settings.json` and `/root/.gemini/config/mcp_config.json` to verify `rea` command registration
3. **Web & JavaScript Capability Check**:
   - Test `npx rea-agents@latest recover-javascript-sources --help`
   - Test `npx rea-agents@latest observe-javascript-runtime --help`
