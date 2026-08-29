# Agent Architecture

## High-Level Components

1. Input Normalizer
2. Lead Qualification Engine
3. Requirement Extractor
4. Inventory Retrieval Layer
5. Unit Ranking Engine
6. Objection Handler
7. Follow-up Generator
8. CRM Note Generator
9. Guardrail Layer
10. Evaluation Layer

## Recommended Runtime Flow

```text
User Message
→ Normalize
→ Detect Intent
→ Extract Known Fields
→ Identify Missing Required Fields
→ Qualify Lead
→ Retrieve Candidate Units
→ Score Candidates
→ Generate Grounded Recommendation
→ Suggest Next Best Action
→ Produce CRM Note
```

## Separation of Responsibilities

### LLM
- Understand natural language
- Extract structured requirements
- Explain recommendations
- Draft responses
- Summarize conversation

### Deterministic Logic
- Lead scoring
- Budget checks
- Availability filters
- Unit ranking
- Eligibility rules
- Approval requirements
- Data validation

### Data Layer
- Inventory
- Projects
- Payment plans
- Unit status
- Approved pricing
- Sales rules
