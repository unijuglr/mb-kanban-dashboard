# DEC-002 — Canonical hive root on Motherbrain storage

Status: Proposed
Date: 2026-03-30
Owner: Adam + Prime Sam

## Context
Motherbrain has multiple large mounted volumes. `hellastuff 1` is the clearest primary candidate with large free capacity and existing AI-related assets.

## Options Considered

### Option A
Keep using ad hoc paths across home directory and volumes.

### Option B
Adopt `/Volumes/hellastuff 1/hive/` as the canonical Motherbrain hive root.

### Option C
Use a home-directory workspace as canonical and keep RAID only for bulk storage.

## Decision
Proposed: choose Option B.

## Why
- explicit and memorable root
- durable high-capacity storage
- simplifies future memory/workspace/service layout

## Consequences
- new shared memory and infrastructure assets should target the hive root
- existing data will need migration planning

## Follow-Up Tasks
- [ ] MB-002 create hive root scaffold
- [ ] MB-010 define workspace layout
- [ ] MB-013 prepare migration plan for large assets
