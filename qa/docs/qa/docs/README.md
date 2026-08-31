# QA Documentation – Reflex Readiness Sprint

## Role & Scope
As QA, my responsibility is to ensure the Reflex MVP system is **testable, defensible, and reliable**.  
This includes verifying API endpoints, end-to-end workflows, edge cases, and collecting evidence for the panel.

## QA Coverage
1. **API Test Scenarios**  
   - Verify all endpoints (`create`, `retrieve`, `assign`, `update status`).  
   - Confirm lifecycle transitions: REQUESTED → ASSIGNED → PICKED_UP → DELIVERED.  
   - Validate error handling for invalid inputs.

2. **End-to-End Workflow Verification**  
   - Simulate full delivery lifecycle across Retailer, Dispatcher, Rider.  
   - Confirm data consistency between frontend, backend, and database.

3. **Edge-Case Testing**  
   - Test unusual inputs (long addresses, duplicate phone numbers).  
   - Block invalid transitions (e.g., DELIVERED before PICKED_UP).  
   - Handle concurrency (two dispatchers assigning same request).

4. **Evidence Collection**  
   - Store logs and screenshots in `/qa/evidence/`.  
   - Link evidence to commits for traceability.

5. **Technical Documentation**  
   - Provide this README and defensibility log.  
   - Document assumptions, limitations, and test coverage.

6. **Defensibility Log**  
   - Record QA decisions using STATE → CONTEXT → EVIDENCE format.  
   - Prepare material for panel questioning.

## How to Run Tests
- **Manual Tests**:  
  - Use REST client (e.g., Postman, VS Code REST extension).  
  - Execute API calls step by step.  
  - Record results in `/qa/evidence/`.

- **Automated Tests (Optional)**:  
  - Use Node.js + Jest or Python + Pytest.  
  - Scripts stored under `/qa/scenarios/`.  
  - Run with `npm test` or `pytest`.

## Assumptions
- MVP lifecycle is fixed: REQUESTED → ASSIGNED → PICKED_UP → DELIVERED.  
- No advanced features (payments, GPS, chat, ratings).  
- QA focuses on correctness, not performance optimization.

## Known Limitations
- No automated load testing in MVP.  
- No customer-facing mobile app tests.  
- Real-time sync tested only at functional level, not stress-tested.

## Defense Notes
- **STATE**: QA verified API, workflow, edge cases.  
- **CONTEXT**: Ensures MVP is reliable and defensible.  
- **EVIDENCE**: Logs, screenshots, and documentation stored in repo.
