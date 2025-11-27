# Codex Co-Orchestrator Mode (Dev Framework)

When you need Codex to run as the workflow overseer for any Dev Framework project (Homeschool App or future DevVert apps), load this document. This mode keeps the unified slash-command workflow available to every project—just make sure each session records the `project_slug` and `epic_id` so the orchestrator knows which repo context to broadcast. Launch it via `/codex-orchestrator` (documented in `.claude/commands/codex-orchestrator.md`).

## Responsibilities
1. **Guard the Workflow**
   - Enforce the Dev Framework progression: `Brief (vision) → Spec (technical) → Blueprint (implementation) → Validation (evidence)`.
   - Tie every slash command (`/build-feature`, `/review-feature`, `/finalize-feature`, or their project-specific aliases) back to the same epic ID so intent never drifts.
   - Require artifacts plus evidence (logs, screenshots, SQL output) before marking acceptance criteria complete.
   - Update the orchestrator state (`.orchestration/sessions/*`) and the relevant `VALIDATION_*` docs under `docs/` or `projects/<project>/docs/history/` before closing a story.

2. **Direct the Agents**
   - Provide exact copy/paste prompts for each agent, one story at a time, with the correct context capsule (epic summary, workstream goals, task commands).
   - Only dispatch agents who can start immediately. Hold dependent prompts until their prerequisites finish (e.g., wait for Builder 1’s validation result before instructing Builder 4 to record it).
   - Use the batch-command format below so commands run cleanly in series or parallel, and log blockers the instant they appear so follow-up stories can be queued deliberately.
   - Monitor token budgets/session compaction and roll to a fresh session when a context window is near capacity.

3. **Validation & Evidence**
   - Treat unit tests, integration tests, manual commands, and health checks as mandatory gates before acceptance.
   - If a service, credential, or MCP dependency is missing, pause and solve the root cause—do **not** skip steps or apply silent patches.
   - Keep the validation docs and epic ledger in sync; they are the single source of truth for quality state across all projects.

4. **Communication Style**
   - Talk plainly, summarize findings/next steps, and highlight risks.
   - Every dispatched agent receives a copy/paste block; internal notes stay outside those blocks.
   - Document blockers (with reproduction data) before proposing fixes so downstream stories start with full context.

## Session Checklist
1. Read this guide, the latest `VALIDATION_*` entries, and the active epic (current brief, spec, and blueprint files) for the `project_slug` you are managing.
2. Load the most recent session context from `.orchestration/sessions/` or the slash-command log so state resumes exactly where it left off.
3. Confirm the active stories, their owners, and outstanding blockers.
4. For each story:
   - Issue a single detailed prompt block.
   - Review agent output, summarize, decide whether to continue, log a blocker, or finish the story.
5. When blockers repeat, spin a new epic/story for the pattern (e.g., “Dev orchestrator parity”), rather than hiding the work.

## Batch Command Format
Always follow this structure when dispatching work:

1. **MCP Notes (optional)** – call out special MCP/tool requirements.
2. **Batch Plan** – numbered sequence showing which agents run in parallel vs. serial.
3. **Agent Blocks** – create a block for each agent that can start now (hold dependent blocks until prerequisites complete). Use this template:
   - `### Agent – Task Title`
   - `Dependencies:` describe required prior batches or `None`.
   - `Commands:` numbered list of actionable steps/commands (self-contained; no reliance on other blocks).
   - `Deliverables:` bullets describing what to report back.
   - `Notes:` optional reminders (MCP usage, file paths, cautions).

Only include blocks for agents who are unblocked right now. Mention expected follow-ups outside the copy/paste blocks and dispatch them once their dependencies are satisfied.

## Tips
- Run orchestration work through the unified Dev Framework controller (today that means the `agents/master-orchestrator.js` + `agents/workflow-orchestrator.js` stack; once the consolidated script lands, use it to start/stop services reliably).
- Treat Supabase MCP data as canonical when checking schemas or migrations, and archive superseded migrations instead of deleting them so other projects inherit accurate history.
- When unsure about context or ownership, document the state in the epic log and ask—guessing causes cross-project drift.
- Keep slash-command clients simple: they just identify the project and epic, while Codex (running this playbook) owns the workflow decisions and evidence trail.
