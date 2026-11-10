# Source of `companion-cli-v1.json`

`companion-cli-v1.json` in this folder is a byte-for-byte copy of `docs/contracts/companion-cli-v1.json` in STAIxBWLB/agent-hub.

- Copied from: agent-hub PR #1388 (branch `feat/1387-companion-contract`), head `0c427dd06a600fb0003977a8bde75bec097eb3e9`.
- ahub version: 0.37.0 (unreleased at the time of the copy).
- SHA-256 of the copy: `ea99c0227061234b54d20deb8a0ad4aaa3266643e611ae6baa7f410f57cd8cb8`.
- Status: copied before #1388 merged. If its review changes the file, copy it again and update this record.
- History: the first copy (head `b2ec055d504658e3d280a64c3810bc79f494352d`) used `<root>` for the console selector and did not list `--project <id|root> ui`; the head above uses `<id|root>` for both.

Never edit the JSON to suit this repository. A change belongs to agent-hub; a new contract version (`companion-cli-v2.json`) arrives here by `hub_task_handoff`. `test/companion-cli-contract.test.ts` checks the reader (`hooks/status.ts`, `hooks/attention.ts`) against it.
