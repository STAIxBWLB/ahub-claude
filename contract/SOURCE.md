# Source of `companion-cli-v1.json`

`companion-cli-v1.json` in this folder is a byte-for-byte copy of `docs/contracts/companion-cli-v1.json` in STAIxBWLB/agent-hub.

- Copied from: agent-hub PR #1388 (branch `feat/1387-companion-contract`), head `b2ec055d504658e3d280a64c3810bc79f494352d`.
- ahub version: 0.37.0 (unreleased at the time of the copy).
- SHA-256 of the copy: `6117e7d121c1b432c3fea50705e16db3dfee2e0216de434722fea2beb0e483ff`.
- Status: copied before #1388 merged. If its review changes the file, copy it again and update this record.

Never edit the JSON to suit this repository. A change belongs to agent-hub; a new contract version (`companion-cli-v2.json`) arrives here by `hub_task_handoff`. `test/companion-cli-contract.test.ts` checks the reader (`hooks/status.ts`, `hooks/attention.ts`) against it.
