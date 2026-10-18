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

## Try the agent / جرّب الوكيل

**Live:** https://islamelsabahy.github.io/ai-real-estate-sales-agent/

The design in this repo now runs as a working, grounded agent you can chat with:

- **Understands Egyptian Arabic and English WhatsApp-style messages:** budget ranges ("من 6 لـ 8 مليون"), monthly instalment limits, bedrooms, areas (التجمع، زايد، العاصمة، الساحل…), unit type, purpose, timing, cash vs instalments and decision maker. Requirements are remembered across turns.
- **Qualifies the lead** using the weights in [`02-lead-qualification/lead-scoring.md`](02-lead-qualification/lead-scoring.md), and **matches units** with the hard filters and weighted formula in [`04-unit-matching/matching-logic.md`](04-unit-matching/matching-logic.md), from the supplied inventory only. It shows the estimated monthly instalment per unit.
- **Applies the guardrails** in [`08-safety-privacy`](08-safety-privacy): no invented units, prices or discounts; sold/reserved units are never offered; prompt-injection attempts are refused; when nothing matches it says so and offers one clearly labelled closest option.
- **Writes the CRM note** in the format of [`07-crm/crm-note-format.md`](07-crm/crm-note-format.md) and gives the next best action.
- **Optional AI mode:** paste your own Anthropic API key and Claude rephrases replies naturally from the same matched data. **Every AI reply is audited.** If it mentions a unit that does not exist or is unavailable, a price not in the inventory, or a discount percentage, it is rejected and the safe reply is used. The key is never stored.
- **Executable evaluation:** the cases in [`tests/evaluation-cases.md`](tests/evaluation-cases.md), plus an audit check, run in the page and in CI (`node tests/test_agent.js`).
- **Excel template**: download `sales-agent-inventory-template.xlsx` from the page (Units, Projects and Guide sheets, dropdowns for status, type and location), fill in your projects and units, and upload it back. You can also export the current inventory, edit it and re-upload. CSV still works (same columns as [`sample-data/units.csv`](sample-data/units.csv)). Rows with errors are skipped and listed with the row number.

Engine: `docs/app/agent.js`. All inventory is fictional.


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

Eng. Islam El-Sherbiny  
AI · Real Estate Technology · Digital Transformation · ERP/Odoo · Automation

## Limitations
- Demonstration tool built on **fictional sample data**. Outputs are decision support, not legal, tax or investment advice.
- Results depend on the assumptions you enter; check them against your own numbers before relying on them.
- Local by default: calculations run in your browser and nothing is sent to a server. Where a page offers an **optional AI mode**, turning it on sends the text/data you entered (and the computed results it needs) to `api.anthropic.com` using your own API key. Do not enable it with confidential customer, inventory or finance data. See [SECURITY.md](SECURITY.md).
