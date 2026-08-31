[![License](https://img.shields.io/github/license/islamelsabahy/ai-real-estate-sales-agent)](LICENSE) [![Maintained by](https://img.shields.io/badge/maintained%20by-Islam%20El--sabahy-blue)](https://github.com/islamelsabahy)

# AI Real Estate Sales Agent

A public-safe reference architecture for an AI-powered real-estate sales assistant.

The agent helps sales teams qualify leads, extract requirements, match suitable units, prepare responses, handle common objections, generate follow-up messages, and produce CRM-ready notes.

All examples and datasets in this repository are fictional.

## Core Capabilities

- Lead qualification
- Requirement extraction
- Budget normalization
- Location and property preference capture
- Unit matching
- Recommendation ranking
- Objection handling
- Follow-up generation
- CRM note generation
- Conversation summarization
- Sales next-best-action suggestions

## Sales Flow

```text
Incoming Lead
   ↓
Qualification
   ↓
Requirement Extraction
   ↓
Budget / Location / Property Profile
   ↓
Inventory Matching
   ↓
Recommendation Ranking
   ↓
Objection Handling
   ↓
Follow-up
   ↓
CRM Note
   ↓
Next Best Action
```

## Guiding Principles

1. Never invent unit availability, prices, discounts, or payment terms.
2. Recommendations must be grounded in supplied inventory data.
3. Clearly distinguish facts from assumptions.
4. Ask for missing must-have requirements when needed.
5. Do not expose personal or confidential customer data.
6. Public demo datasets must use fictional records only.
7. CRM notes should be concise, factual, and auditable.
8. The agent supports salespeople; it does not bypass required approvals.
9. Any discount, reservation, or commercial commitment requires approved business logic.
10. Human review is required for sensitive or high-impact decisions.

## Roadmap

- [x] Agent workflow
- [x] Lead qualification framework
- [x] Requirement schema
- [x] Unit matching logic
- [x] Objection handling library
- [x] Follow-up templates
- [x] CRM note format
- [x] Privacy and hallucination controls
- [x] Fictional sample data
- [ ] Runnable Python agent
- [ ] Retrieval / RAG inventory adapter
- [ ] API layer
- [ ] Web chat interface
- [ ] CRM integration
- [ ] Evaluation suite
- [ ] Multi-language support

## Author

Eng. Islam El Sherbiny  
AI · Real Estate Technology · Digital Transformation · ERP/Odoo · Automation
