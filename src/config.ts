import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "code-sandbox",
  slug: "code-sandbox",
  description: "Execute Python, JavaScript, or SQL code in a sandboxed environment and get the output.",
  version: "1.0.0",
  routes: [
    {
      method: "POST",
      path: "/api/execute",
      price: "$0.01",
      description: "Execute code in a sandboxed environment",
      toolName: "code_execute_sandbox",
      toolDescription: "Use this when you need to execute Python, JavaScript, or SQL code in a sandboxed environment and get the output. Supports Python (via subprocess), JavaScript (via eval), and SQL (via in-memory SQLite). Returns stdout output, language used, and execution time in milliseconds. Timeout capped at 10 seconds, output capped at 10KB. Do NOT use for file operations or persistent storage — use web_scrape_to_markdown instead. Do NOT use for generating hashes — use crypto_generate_hash instead. Do NOT use for PDF generation — use document_generate_pdf instead.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "The code to execute" },
          language: { type: "string", enum: ["python", "javascript", "sql"], description: "Programming language: python, javascript, or sql" },
          timeout: { type: "number", description: "Execution timeout in milliseconds (default: 5000, max: 10000)" },
        },
        required: ["code", "language"],
      },
    },
  ],
};
