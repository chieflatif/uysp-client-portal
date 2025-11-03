## UYSP — End‑to‑End System Workflow (Preliminary Sketch)

This diagram summarizes the implemented production flows across ingestion, enrichment, qualification, SMS outreach, tracking, and bookings. It reflects the current architecture documented in the runbook and SOPs.

```mermaid
flowchart TB

    %% ====== CLASS STYLES ======
    classDef source fill:#0e7490,stroke:#083344,color:#ffffff;
    classDef ingest fill:#1d4ed8,stroke:#0b1957,color:#ffffff;
    classDef hub fill:#334155,stroke:#111827,color:#e5e7eb;
    classDef enrich fill:#7c3aed,stroke:#3b0764,color:#ffffff;
    classDef qualify fill:#8b5cf6,stroke:#3b0764,color:#ffffff;
    classDef sms fill:#047857,stroke:#052e1b,color:#ffffff;
    classDef track fill:#b45309,stroke:#3f1f0b,color:#ffffff;
    classDef alert fill:#0f172a,stroke:#0b1220,color:#93c5fd;
    classDef person fill:#0f766e,stroke:#064e3b,color:#ffffff;
    classDef ops fill:#0369a1,stroke:#0a3147,color:#ffffff;

    %% ====== SOURCES (Two Blocks) ======
    subgraph Lead_Sources[Sources]
        A[Manual Import]:::source
        B[CRM Dynamic Link]:::source
    end

    %% ====== INTAKE WORKFLOW (n8n) ======
    subgraph Intake[Intake Workflow]
        D[Intake and Normalize]:::ingest
        E[Upsert to Airtable]:::ingest
        D --> E
    end
    A --> D
    B --> D

    %% ====== CENTRAL HUB (Airtable) ======
    subgraph Hub[Central Hub]
        F[(Leads)]:::hub
        G[(Companies)]:::hub
    end
    E --> F
    F --> G
    G --> F

    %% ====== CLAY WORKFLOW (separate application) ======
    subgraph ClayWF[Clay Enrichment Workflow]
        Cq[Pull Clay Queue view]:::enrich
        Ce[Enrich company and person]:::enrich
        Cs[Clay scoring]:::enrich
        Cw[Write results to Airtable]:::enrich
        Cq --> Ce --> Cs --> Cw
    end
    F --> Cq
    Cw --> F

    %% ====== QUALIFICATION IN HUB (no SMS path via Clay) ======
    subgraph QualifyHub[Qualification in Hub]
        Hf[Final ICP score in hub]:::qualify
        L1{Qualified for campaign}:::qualify
        Hmark[Mark SMS eligible]:::qualify
        Hreject[Archive or HRQ]:::qualify
        Hf --> L1
        L1 -- yes --> Hmark
        L1 -- no --> Hreject
    end
    Cw --> Hf
    Hmark --> F
    Hreject --> F

    %% ====== SCHEDULER AND SMS OUTREACH ======
    subgraph SMS[Scheduler and SMS]
        O[Scheduler window]:::sms
        P[Read eligible leads]:::sms
        Q[Select template A or B]:::sms
        R[Create tracking link]:::sms
        S[Send via SimpleTexting]:::sms
        T[Write log and set In Sequence]:::sms
        O --> P --> Q --> R --> S --> T
    end
    Hmark --> O
    T --> F

    %% ====== TRACKING AND EVENTS (all flow back to hub) ======
    subgraph Tracking[Tracking and Events]
        U[Click tracker cron]:::track
        V[Click redirect webhook]:::track
        W[Delivery webhook]:::track
        X[Inbound STOP webhook]:::track
        Y[Calendly booking webhook]:::track
        Z[Slack alerts]:::alert
    end
    R --> V --> F
    U --> F
    S -- delivery --> W --> F
    S -- stop --> X --> F
    Y --> F
    F --> Z

    %% ====== LEGEND ======
    subgraph Legend[Legend]
        Lsrc[Sources]:::source
        Ling[Intake]:::ingest
        Lhub[Hub]:::hub
        Lclay[Clay WF]:::enrich
        Lq[Qualify in Hub]:::qualify
        Lsms[Scheduler and SMS]:::sms
        Ltrk[Tracking]:::track
        Lslk[Alerts]:::alert
    end

    %% ====== REPORTING & MESSAGING HUB ======
    subgraph Ops[Reporting & Messaging Hub]
        OA[Collect events and errors]:::ops
        OB[(Audit Log table)]:::ops
        OC[Aggregate metrics and reports]:::ops
        OD[Notify via Slack and Email]:::ops
        OA --> OB --> OC --> OD
    end

    %% Event sources to Ops
    D --> OA
    Ce --> OA
    O --> OA
    W --> OA
    X --> OA
    Y --> OA
    V --> OA
```

Legend / Notes:
- Airtable `Leads` is the state machine (e.g., "Queued" → "Ready for SMS" → "In Sequence" → "Completed/Stopped").
- Batch Control is applied in the scheduler via an Airtable view filter to safely stage cohorts.
- Click tracking uses unique alias + Switchy; clicks and deliveries update Airtable and send Slack alerts.
- Bookings arrive via Calendly webhooks and stop the active sequence.

Open the standalone HTML viewer in this folder for a full‑screen render.


