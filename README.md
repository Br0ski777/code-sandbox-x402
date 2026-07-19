# Code Sandbox API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://code-sandbox.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Execute Python, JavaScript, or SQL in a sandbox. Get stdout, execution time, errors. 10s timeout. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "code-sandbox": {
      "url": "https://code-sandbox.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl -X POST "https://code-sandbox.api.klymax402.com/api/execute" \
  -H "Content-Type: application/json" \
  -d '{"code":"...","language":"..."}'
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `code_execute_sandbox` | POST | `/api/execute` | $0.02 | Execute code in a sandboxed environment |

### `code_execute_sandbox`

Use this when you need to execute Python, JavaScript, or SQL code in a sandboxed environment and get the output. Supports Python (subprocess), JavaScript (eval), and SQL (in-memory SQLite).

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | The code to execute |
| `language` | string | yes | Programming language: python, javascript, or sql |
| `timeout` | number | no | Execution timeout in milliseconds (default: 5000, max: 10000) |

**Returns**

- `output` -- stdout captured from code execution (max 10KB)
- `language` -- the language that was executed
- `executionTimeMs` -- execution duration in milliseconds
- `exitCode` -- process exit code (0 = success)
- `error` -- error message if execution failed (null on success)

Example response:

```json
{"output":"Hello World\n42\n","language":"python","executionTimeMs":234,"exitCode":0,"error":null}
```

**When to use**: running calculations, data transformations, validating code snippets, or querying in-memory databases. Essential when you need computed results rather than static data.

## Example agent prompts

- "Execute Python, JavaScript, or SQL code in a sandboxed environment and get the output"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)
- Also reachable via [ATXP](https://atxp.ai) (OAuth-wrapped x402, RFC 9728 protected-resource metadata)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
