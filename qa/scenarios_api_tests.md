# Task: API Test Scenarios

## Definition of Done
- All endpoints tested for success + failure cases
- Status transitions verified

## Test Steps
1. POST /deliveries → expect status REQUESTED
2. PATCH /deliveries/:id assign rider → expect status ASSIGNED
3. PATCH /deliveries/:id status=PICKED_UP → expect status PICKED_UP
4. PATCH /deliveries/:id status=DELIVERED → expect status DELIVERED
5. Invalid transitions rejected (e.g., DELIVERED before PICKED_UP)

## Evidence
- Logs in /qa/evidence/api_tests.log
- Screenshots in /qa/evidence/api_tests.png

## Defense Notes
- STATE: Tested all API endpoints
- CONTEXT: Ensures lifecycle integrity
- EVIDENCE: Logs + screenshots confirm correct behavior
