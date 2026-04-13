import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "code-sandbox",
  slug: "code-sandbox",
  description: "Execute Python, JavaScript, or SQL in a sandbox. Get stdout, execution time, errors. 10s timeout.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/execute",
      price: "$0.01",
      description: "Execute code in a sandboxed environment",
      toolName: "code_execute_sandbox",
      toolDescription: `Use this when you need to execute Python, JavaScript, or SQL code in a sandboxed environment and get the output. Supports Python (subprocess), JavaScript (eval), and SQL (in-memory SQLite).

1. output: stdout captured from code execution (max 10KB)
2. language: the language that was executed
3. executionTimeMs: execution duration in milliseconds
4. exitCode: process exit code (0 = success)
5. error: error message if execution failed (null on success)

Example output: {"output":"Hello World\\n42\\n","language":"python","executionTimeMs":234,"exitCode":0,"error":null}

Use this FOR running calculations, data transformations, validating code snippets, or querying in-memory databases. Essential when you need computed results rather than static data.

Do NOT use for persistent file storage -- sandbox is ephemeral. Do NOT use for generating hashes -- use crypto_generate_hash. Do NOT use for PDF generation -- use document_generate_pdf. Do NOT use for web scraping -- use web_scrape_to_markdown.`,
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "The code to execute" },
          language: { type: "string", enum: ["python", "javascript", "sql"], description: "Programming language: python, javascript, or sql" },
          timeout: { type: "number", description: "Execution timeout in milliseconds (default: 5000, max: 10000)" },
        },
        required: ["code", "language"],
      },
      outputSchema: {
          "type": "object",
          "properties": {
            "output": {
              "type": "string",
              "description": "Code execution output (stdout)"
            },
            "language": {
              "type": "string",
              "description": "Language executed"
            },
            "executionTime": {
              "type": "number",
              "description": "Execution time in milliseconds"
            }
          },
          "required": [
            "output",
            "language",
            "executionTime"
          ]
        },
    },
  ],
};
