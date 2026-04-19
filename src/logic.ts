import type { Hono } from "hono";
import { Database } from "bun:sqlite";


// ATXP: requirePayment only fires inside an ATXP context (set by atxpHono middleware).
// For raw x402 requests, the existing @x402/hono middleware handles the gate.
// If neither protocol is active (ATXP_CONNECTION unset), tryRequirePayment is a no-op.
async function tryRequirePayment(price: number): Promise<void> {
  if (!process.env.ATXP_CONNECTION) return;
  try {
    const { requirePayment } = await import("@atxp/server");
    const BigNumber = (await import("bignumber.js")).default;
    await requirePayment({ price: BigNumber(price) });
  } catch (e: any) {
    if (e?.code === -30402) throw e;
  }
}

const MAX_TIMEOUT = 10_000;
const DEFAULT_TIMEOUT = 5_000;
const MAX_OUTPUT = 10 * 1024; // 10KB

function truncateOutput(output: string): string {
  if (output.length > MAX_OUTPUT) {
    return output.slice(0, MAX_OUTPUT) + "\n...[output truncated at 10KB]";
  }
  return output;
}

async function executeJavaScript(code: string, timeout: number): Promise<{ output: string; error?: string }> {
  try {
    const fn = new Function("return (async () => { const __results = []; const console = { log: (...a) => __results.push(a.map(String).join(' ')), error: (...a) => __results.push('[error] ' + a.map(String).join(' ')), warn: (...a) => __results.push('[warn] ' + a.map(String).join(' ')) }; " + code + "; return __results.join('\\n'); })()");
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Execution timed out")), timeout)),
    ]);
    return { output: truncateOutput(String(result ?? "")) };
  } catch (e: any) {
    return { output: "", error: e.message };
  }
}

async function executePython(code: string, timeout: number): Promise<{ output: string; error?: string }> {
  try {
    const proc = Bun.spawn(["python", "-c", code], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const timer = setTimeout(() => {
      try { proc.kill(); } catch {}
    }, timeout);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    clearTimeout(timer);

    await proc.exited;

    if (proc.exitCode !== 0) {
      return { output: truncateOutput(stdout), error: truncateOutput(stderr || `Process exited with code ${proc.exitCode}`) };
    }
    return { output: truncateOutput(stdout) };
  } catch (e: any) {
    return { output: "", error: e.message };
  }
}

function executeSQL(code: string): { output: string; error?: string } {
  let db: Database | null = null;
  try {
    db = new Database(":memory:");

    // Split by semicolons to handle multiple statements
    const statements = code.split(";").map((s) => s.trim()).filter(Boolean);
    const results: string[] = [];

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trimStart();
      if (upper.startsWith("SELECT") || upper.startsWith("PRAGMA") || upper.startsWith("EXPLAIN") || upper.startsWith("WITH")) {
        const rows = db.query(stmt).all();
        results.push(JSON.stringify(rows, null, 2));
      } else {
        const result = db.run(stmt);
        results.push(`OK — ${result.changes} row(s) affected`);
      }
    }

    return { output: truncateOutput(results.join("\n")) };
  } catch (e: any) {
    return { output: "", error: e.message };
  } finally {
    if (db) db.close();
  }
}

export function registerRoutes(app: Hono) {
  app.post("/api/execute", async (c) => {
    await tryRequirePayment(0.01);
    const body = await c.req.json().catch(() => null);
    if (!body?.code) {
      return c.json({ error: "Missing required field: code" }, 400);
    }
    if (!body?.language) {
      return c.json({ error: "Missing required field: language" }, 400);
    }

    const code: string = body.code;
    const language: string = body.language.toLowerCase();
    const validLanguages = ["python", "javascript", "sql"];

    if (!validLanguages.includes(language)) {
      return c.json({ error: `Invalid language. Supported: ${validLanguages.join(", ")}` }, 400);
    }

    const timeout = Math.min(Math.max(body.timeout || DEFAULT_TIMEOUT, 100), MAX_TIMEOUT);
    const startTime = performance.now();

    let result: { output: string; error?: string };

    switch (language) {
      case "javascript":
        result = await executeJavaScript(code, timeout);
        break;
      case "python":
        result = await executePython(code, timeout);
        break;
      case "sql":
        result = executeSQL(code);
        break;
      default:
        return c.json({ error: "Unsupported language" }, 400);
    }

    const executionTime = Math.round((performance.now() - startTime) * 100) / 100;

    return c.json({
      output: result.output,
      language,
      executionTime,
      ...(result.error ? { error: result.error } : {}),
    });
  });
}
