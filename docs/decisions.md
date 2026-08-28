# Decisions

Architecture decision log. Add one entry per decision — keep old entries even when superseded (mark them as such) so we can see how the design evolved.

## Format

    ## ADR-<number>: <title>
    - Status: Proposed | Accepted | Superseded by ADR-<n>
    - Date:
    - Owner:

    **Context**
    What problem are we solving?

    **Decision**
    What did we choose?

    **Alternatives considered**
    What else was on the table, and why not?

    **Consequences**
    What does this commit us to?

## Open decisions (from the board)

- Real-time synchronization mechanism — WebSockets vs. Server-Sent Events vs. polling. Affects backend, frontend, and rider client. Owner: TBD.
- Database model — see the Data track cards (delivery schema, rider schema, index strategy, data integrity rules).
- Delivery state machine — draft proposed in `architecture.md`; confirm here once the team agrees.

## ADR-1: <example — replace or delete once a real decision lands>
- Status: Proposed
- Date:
- Owner:

**Context**


**Decision**


**Alternatives considered**


**Consequences**

