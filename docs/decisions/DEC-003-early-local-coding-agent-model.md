# DEC-003 — Early local coding-agent execution model on Motherbrain

Status: Proposed
Date: 2026-03-30
Owner: Adam + Prime Sam

## Context
An early goal is to have local coding agents operating on Motherbrain so they can help build the rest of the environment.

## Options Considered

### Option A
Wait until the full hive architecture is complete.

### Option B
Enable a minimal, controlled coding-agent environment early and expand later.

### Option C
Run everything from the laptop and defer Motherbrain-local agents indefinitely.

## Decision
Proposed: choose Option B.

## Why
- creates leverage early
- helps Motherbrain become a real working habitat
- supports iterative buildout rather than linear perfectionism

## Consequences
- we need an early bootstrap standard
- we should start with a constrained, inspectable operating model
- model/tool/workspace assumptions need to be documented

## Follow-Up Tasks
- [ ] MB-004 enable early local coding agents
- [ ] MB-014 create local agent workspace bootstrap
- [ ] MB-007 add status support for local coding environment
