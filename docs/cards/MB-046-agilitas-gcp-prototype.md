# MB-046 — Agilitas: Infrastructure: GCP Demoable Prototype (Functional MVP)

Status: Ready
Priority: P1 high
Project: Agilitas Solutions
Owner: Adam Goldband
Created: 2026-04-01
Last Updated: 2026-04-01

## Objective
Deploy a functional, non-scaled demo prototype of the Agilitas Platform on GCP.

## Why It Matters
This is the sales and proof-of-concept environment. It must be accessible, demo-ready, and show the full end-to-end flow from "Raw Transcript" to "Executive Dashboard."

## Scope
- Deployment of the Core AI, Business Logic, and Action Engines on GCP (Cloud Run / GKE).
- Integration with Azure OpenAI and Language Service (hybrid-cloud setup).
- Development of the "Executive Dashboard" UI using existing poc-ui/poc-ui2 assets.
- Setup of a clean "Demo Dataset" showing a full vertical (e.g., Banking/Mortgage) flow.

## Steps
- [ ] Containerize the Agilitas services (Core, Business, Action Engine).
- [ ] Set up GCP infrastructure (Cloud Run, Cloud SQL, Secret Manager).
- [ ] Port/Revive the poc-ui frontend and connect to the new engine backend.
- [ ] Script a "One-Click Demo" ingestor for the Banking vertical.

## Artifacts
- `infra/gcp-deployment/`
- `services/agilitas-poc-ui/`
- `demo/banking-vertical-set/`
