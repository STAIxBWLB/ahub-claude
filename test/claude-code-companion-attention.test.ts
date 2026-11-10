import { expect, test } from "bun:test";

import { attentionLines } from "../hooks/attention.ts";
import { consoleCommand, projectReading, type Reading } from "../hooks/status.ts";
const root = "/fixture/a b'; $(touch never-run)";
const binding = { root, projectId: "p_fixture" };
const rawStatus = { cwd: root, projectId: binding.projectId, version: "0.35.0", peers: {}, tasks: {} };
const positive = () => projectReading({ ...rawStatus,
  // `paused` as the contract lists it: "manual" or a string starting "budget: ". The ahub-side producer cases stay in agent-hub (test/companion-contract.test.ts), so the value is written out here.
  peers: { claude: { state: "paused", queued: 0, attached: true, needsReview: 2, paused: "budget: PRIVATE_REASON, resets 12:00:09 AM" } },
  needs: { first: { kind: "approval", level: "act", peer: "claude", id: "PRIVATE_TICKET", until: 2000, note: "PRIVATE_NOTE" } },
}, binding, 1000);

test("fresh partial snapshots show only independently proven kinds and literal terminal guidance", () => {
  const reading = positive(), lines = attentionLines(reading, root, 1000);
  expect(reading.state).toBe("partial"); expect(lines).toHaveLength(3);
  expect(lines[0]).toContain("2 held deliveries"); expect(lines[1]).toContain("budget pause"); expect(lines[2]).toContain("Permission request");
  expect(lines.every(line => line.endsWith(consoleCommand(root)))).toBe(true);
  expect(reading.peers?.[0]?.budgetPaused).toBe(true);
  expect(reading.permission).toEqual({ peer: "claude", until: 2000 });
  expect(JSON.stringify(reading)).not.toContain("PRIVATE"); expect(lines.join("\n")).not.toContain("PRIVATE");
  expect(reading.missing).toContain("full permission inventory"); expect(reading.missing).toContain("offline assigned in_progress");
});

test("stale, unrecognized, unknown, failed or identity-refused readings never show a waiting band", () => {
  const reading = positive();
  for (const state of ["stale", "unknown", "unrecognized", "binding", "offline", "unavailable_version", "missing_cli", "timeout", "nonzero", "oversized"] as const) {
    expect(attentionLines({ ...reading, state }, root, 1000)).toEqual([]);
  }
  expect(attentionLines(reading, root, 61001)).toEqual([]);
  expect(attentionLines({ ...reading, fetchedAt: undefined }, root, 1000)).toEqual([]);
  expect(attentionLines(reading, root, 999)).toEqual([]);
  expect(attentionLines(reading, root, NaN)).toEqual([]);
  expect(attentionLines(reading, "", 1000)).toEqual([]);
  expect(attentionLines({ ...reading, state: "running" }, root, 1000)).toHaveLength(3);
});

test("permission evidence expires independently, without turning missing or aggregate needs into a band", () => {
  expect(attentionLines(positive(), root, 2000)).toHaveLength(2);
  for (const first of [undefined, { kind: "approval", level: "watch", until: 2000 }, { kind: "approval", level: "act", until: 999 }, { kind: "approval", level: "act", until: 2000, peer: "bad\npeer" }, { kind: "unknown", level: "act", until: 2000 }]) {
    const reading = projectReading({ ...rawStatus, needs: { act: 100, state: "waiting", first } }, binding, 1000);
    expect(reading.permission).toBeUndefined(); expect(attentionLines(reading, root, 1000)).toEqual([]);
    expect(reading.missing).toContain("full permission inventory");
  }
});

test("manual pause, arbitrary paused state and active WIP never imply budget or offline in_progress needs", () => {
  for (const paused of [undefined, "manual", "budgetary: unavailable", { reason: "budget" }]) {
    const reading = projectReading({ ...rawStatus, peers: { codex: { state: "offline", queued: 0, paused, budgetPaused: true } },
      taskWip: { codex: { active: 7 } }, needs: { first: { kind: "offline", level: "watch", peer: "codex", id: 1 } },
    }, binding, 1000);
    expect(reading.peers?.[0]?.budgetPaused).toBeUndefined(); expect(attentionLines(reading, root, 1000)).toEqual([]);
    expect(reading.missing).toContain("offline assigned in_progress");
  }
});

test("attention is bounded by closed peer projections and validates cached positive metadata", () => {
  const reading: Reading = { state: "partial", fetchedAt: 1000, peers: [{ id: "bad\npeer", state: "idle", needsReview: 2, budgetPaused: true }], permission: { until: 2000, peer: "bad\npeer" } };
  expect(attentionLines(reading, root, 1000)).toEqual([]);
});
