# DEC-001 — Authority model: laptop as control plane, Motherbrain as durable backend

Status: Proposed
Date: 2026-03-30
Owner: Adam + Prime Sam

## Context
Current observed state is split-brain:
- laptop is the actively used OpenClaw/control environment
- Motherbrain also has OpenClaw state and a workspace
- Motherbrain is the better long-term host for storage, models, and heavy workloads

## Options Considered

### Option A
Keep laptop as canonical home for everything.

### Option B
Make Motherbrain canonical for durable backend functions while keeping laptop as operator control plane.

### Option C
Move everything entirely to Motherbrain immediately.

## Decision
Proposed: choose Option B.

## Why
- it matches the observed strengths of each machine
- it reduces migration risk
- it lets Motherbrain become the real home for durable AI infrastructure
- it avoids forcing all human interaction to move off the laptop immediately

## Consequences
- canonical durable state should migrate toward Motherbrain
- laptop remains the human console and orchestration surface
- split-brain artifacts need to be explicitly reconciled over time

## Follow-Up Tasks
- [ ] MB-001 finalize authority model
- [ ] MB-009 decide OpenClaw topology
- [ ] MB-010 define workspace layout
