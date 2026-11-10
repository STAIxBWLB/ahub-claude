import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { consoleCommand } from "../hooks/status.ts";

// The contract copy (contract/companion-cli-v1.json, source in contract/SOURCE.md) is all this companion may assume about ahub's CLI (agent-hub#1387).
// These tests hold the readers (hooks/status.ts, hooks/attention.ts) to it: the quoting against the golden vectors, every command against the listed argv forms, the no-hub prefix,
// and every status field the reader touches against the listed paths.
const ROOT = join(import.meta.dir, "..");
const contract = JSON.parse(readFileSync(join(ROOT, "contract/companion-cli-v1.json"), "utf8"));
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
const status = code(read("hooks/status.ts")), attention = code(read("hooks/attention.ts")), controller = code(read("hooks/controller.ts")), register = code(read("hooks/register.tsx"));

test("the contract copy is the version this companion was written against", () => {
  expect(contract.contract).toBe("companion-cli");
  expect(contract.version).toBe(1);
  expect(read("contract/SOURCE.md")).toMatch(/ahub version: \d+\.\d+\.\d+/);
});

test("the console command the companion types quotes its root exactly as the contract's shellQuote vectors do", () => {
  expect(contract.shellQuote.length).toBeGreaterThanOrEqual(11);
  for (const vector of contract.shellQuote) expect(consoleCommand(vector.in), JSON.stringify(vector.in)).toBe(`ahub --project ${vector.out} console`);
});

test("every ahub command the companion runs or types is a listed argv form", () => {
  const listed = (argv: string[]) => contract.commands.some((c: { bin?: string; argv: string[] }) => (c.bin ?? "ahub") === "ahub" && JSON.stringify(c.argv) === JSON.stringify(argv));
  // the read: `ahub --project <root> status --json`, run once per refresh through a typed argv tuple
  expect(controller).toContain('argv: ["--project", root, "status", "--json"]');
  expect(controller).toContain('readonly ["--project", string, "status", "--json"]');
  expect(listed(["--project", "<id|root>", "status", "--json"])).toBe(true);
  // the typed console command
  expect(status).toContain("ahub --project '${root.replaceAll(\"'\", \"'\\\\''\")}' console");
  expect(listed(["--project", "<root>", "console"])).toBe(true);
  // no other ahub subcommand is run or typed: the only command words in the shipped code are status and console
  const words = [...(status + controller + register + attention).matchAll(/\bahub (?!up\b|executable\b|read\b|output\b)(--project|\w+)/g)].map(m => m[1]);
  expect(new Set(words)).toEqual(new Set(["--project"]));
  expect(status + controller + register + attention).not.toMatch(/\bahub (board|projects|ui)\b|"projects"|"board"/);
});

test("the no-hub stderr prefix and exit code the controller relies on are the contract's", () => {
  expect(controller).toContain(`result.exitCode === ${contract.noHub.exitCode} && (result.stderr ?? "").startsWith(${JSON.stringify(contract.noHub.stderrPrefix)})`);
});

test("every status field the reader touches is a listed path, and the closed sets it recognises are the contract's", () => {
  const touched = new Set<string>();
  // only `needs` is read one level down (as `raw.needs.first`); `raw.version.length` and the like are properties of a string
  for (const m of status.matchAll(/\braw\.(\w+)(?:\.(first)\b)?/g)) touched.add(m[2] && m[1] === "needs" ? `${m[1]}.${m[2]}` : m[1]!);
  for (const m of status.matchAll(/\bpeer\.(\w+)/g)) touched.add(`peers.<id>.${m[1]}`);
  for (const m of status.matchAll(/\bfirst\??\.(\w+)/g)) touched.add(`needs.first.${m[1]}`);
  // a guard against the scan finding nothing: these are the paths the readers are known to use today
  expect([...touched].sort()).toEqual([
    "cwd", "needs", "needs.first", "needs.first.kind", "needs.first.level", "needs.first.peer", "needs.first.until",
    "peers", "peers.<id>.attached", "peers.<id>.needsReview", "peers.<id>.paused", "peers.<id>.queued", "peers.<id>.state",
    "projectId", "tasks", "version",
  ]);
  for (const path of touched) expect(contract.status[path], `${path} is not a listed status path`).toBeDefined();
  // closed sets: peer states and task states in the reader are the contract's lists
  const quoted = (source: string) => [...source.matchAll(/"([a-z_]+)"/g)].map(m => m[1]!);
  const peerStates = /\[("idle"[^\]]*)\]\.includes\(String\(peer\.state\)\)/.exec(status)?.[1];
  expect(quoted(peerStates ?? "")).toEqual(contract.status["peers.<id>.state"].values);
  const taskStates = /const states = \[([^\]]*)\]/.exec(status)?.[1];
  expect([...quoted(taskStates ?? "")].sort()).toEqual([...contract.status.tasks.values].sort());
  // `paused` is read as "manual" or the "budget: " prefix, and `needs.first.level` is read only as "act"
  expect(contract.status["peers.<id>.paused"].values).toEqual(["manual"]);
  expect(contract.status["peers.<id>.paused"].prefixes).toEqual(["budget: "]);
  expect(status).toContain('peer.paused.startsWith("budget: ")');
  expect(status).toContain('peer.paused !== "manual"');
  expect(contract.status["needs.first.level"].values).toContain("act");
  expect(contract.status["needs.first.kind"].presence).toContain("approval");
});

test("the attention view reads only the closed projection the status reader builds, never ahub's raw output", () => {
  expect(attention).not.toMatch(/\braw\b|JSON\.parse|\.cwd\b|\.projectId\b|\.needs\b/);
});
