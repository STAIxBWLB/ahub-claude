# Changelog

## Unreleased

- Brought up from `integrations/claude-code/` of STAIxBWLB/agent-hub at commit `16b8251657a2196a472aa3c578450489286637d7` (STAIxBWLB/agent-hub#1387, T3). No behaviour change.
- Added `.claude-plugin/marketplace.json` listing this one plugin (`agent-hub-companion`). The install path through it is not qualified: the support matrix stays `fixture_only` and all four receipts stay NOT RUN.
- Added `contract/companion-cli-v1.json` (copied from agent-hub PR #1388 head `0c427dd06a600fb0003977a8bde75bec097eb3e9`, ahub 0.37.0 unreleased; see `contract/SOURCE.md`) and `test/companion-cli-contract.test.ts`.
- The two `needs` producer cases, the `pausedNote` producer case (they read agent-hub's `src/`) and the agent-hub marketplace check stay in agent-hub; the attention fixture writes the `paused` value out literally.
- Added CI: `bun test`, then a static `claude plugin validate .` with a pinned CLI, and a tag check against the plugin version.

## 0.1.0

Not tagged yet. The tag needs the person's release consent (STAIxBWLB/agent-hub#1387).
