# Motherbrain Kanban UI Spec

Updated: 2026-03-30
Author: Prime Sam
Status: Draft v1

## Purpose

Create a lightweight local UI for the Motherbrain Kanban system so tasks, decisions, and updates are visible without manually browsing markdown files.

This UI is intentionally not a complex SaaS board clone.
It should be a practical, inspectable interface over the file-based Kanban system already created in the workspace.

## Product Goal

Give Adam and local Motherbrain agents a transparent project-management interface for:
- viewing board state
- reviewing task cards
- reviewing decision records
- seeing progress updates
- making simple state changes without destroying the file-backed source of truth

## Source of Truth

The source of truth remains the filesystem:
- `docs/motherbrain-kanban.md`
- `docs/motherbrain-kanban/cards/`
- `docs/motherbrain-kanban/decisions/`
- `docs/motherbrain-kanban/updates/`

The UI is a view/controller over those files, not a replacement for them.

## MVP Scope

### 1. Board View
A board with columns:
- Backlog
- Ready
- In Progress
- Blocked
- Review
- Done

Each card tile should show:
- card ID
- title
- priority
- owner
- short summary or objective snippet

### 2. Card Detail View
When a card is opened, show:
- ID
- title
- status
- priority
- owner
- objective
- why it matters
- scope
- out of scope
- steps/checklist
- blockers
- artifacts
- update log

### 3. Decision View
List and open decisions from `decisions/`.
Show:
- decision ID
- title
- status
- date
- context
- options considered
- decision
- consequences
- follow-up tasks

### 4. Updates Timeline
Chronological view of files in `updates/`.
Useful for seeing what actually happened over time.

### 5. Lightweight Editing
MVP editing should allow only safe operations:
- move card status
- edit priority
- append update-log entry
- create new card from template
- create new decision from template

Do not begin with arbitrary markdown editing of every field through the UI.
That way lies nonsense.

## Non-Goals for MVP

Do not build initially:
- multi-user auth system
- realtime collaboration
- rich comments database
- drag-and-drop perfectionism if it slows delivery
- hidden backend state separate from files
- fancy permissions model
- AI orchestration inside the UI itself

## Technical Direction

Preferred style:
- simple local web app
- reads from file-backed workspace
- minimal server layer if needed
- simple parser for markdown card/decision files

Acceptable stack options:
- static frontend + tiny Node backend
- simple React/Vite app
- minimal server-rendered interface

My bias:
- choose the lowest-complexity stack that Motherbrain-local coding agents can implement quickly and maintainably

## Data Model Assumptions

### Cards
Each card file follows predictable sections:
- header line with card ID and title
- status
- priority
- owner
- created/updated dates
- structured section headers

### Decisions
Each decision file follows predictable sections:
- header line with decision ID and title
- status/date/owner
- context/options/decision/consequences/follow-up

### Board
`motherbrain-kanban.md` remains the summary board and high-level index.
The UI may derive state from card files directly and optionally compare against the board summary for consistency warnings.

## UX Principles

1. Readability first
2. Fast loading over polish
3. File truth stays visible
4. Simple operations should be obvious
5. Nothing magical or hidden

## MVP Screens

### Screen 1 — Board
- six status columns
- cards grouped by status
- filter by priority/owner

### Screen 2 — Card Details
- full card content
- buttons for status transitions
- append update note

### Screen 3 — Decisions
- list of decision records
- detail panel for selected decision

### Screen 4 — Updates
- reverse-chronological update feed

### Optional Screen 5 — Consistency Check
- warn if board summary and card file statuses disagree
- warn about missing card files or malformed cards

## Validation Requirements

The UI build should prove that Motherbrain-local coding agents can:
- read structured project files
- create sensible UI architecture
- implement a small but useful product end-to-end
- work within file-backed constraints
- leave clear progress notes in Kanban artifacts

## Definition of Done

The Kanban UI MVP is done when:
- board view works from real files
- card detail view works
- decision list/detail works
- updates timeline works
- basic safe editing works for at least status changes and update-log append
- the UI can be run locally and documented clearly

## Suggested Build Breakdown

1. parser for cards/decisions/updates
2. board read model
3. board UI
4. card detail UI
5. decision UI
6. update timeline UI
7. safe write operations
8. run instructions
9. validation against real Motherbrain Kanban files

## First Assignment Framing for Local Agents

Build the smallest useful version first.
No ornamental complexity.
The point is to validate capability and create a real tool we will actually use.
