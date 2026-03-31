# Motherbrain Kanban Interface

This directory is the operational interface for the Motherbrain build program.

## Structure

- `../motherbrain-kanban.md` — human-readable board summary
- `cards/` — one markdown file per task card
- `decisions/` — one markdown file per architectural/operational decision
- `templates/` — reusable templates for new cards and decisions
- `updates/` — chronological status updates and execution notes

## Conventions

### Cards
Each card should contain:
- ID
- title
- status
- priority
- owner
- objective
- scope
- steps
- blockers
- artifacts
- update log

### Decisions
Each decision should contain:
- decision ID
- title
- status
- context
- options considered
- decision
- consequences
- follow-up tasks

### Transparency rule
If work changes state, write it down.
No ghost work.

## Status Values
- Backlog
- Ready
- In Progress
- Blocked
- Review
- Done

## Initial Focus
The first major milestone is:
- make Motherbrain good enough to host local coding agents safely and usefully
- then use those agents to help build the rest of the Motherbrain hive
