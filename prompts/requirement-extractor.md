# Requirement Extractor Prompt

Extract the customer's property requirements into the provided schema.

Rules:
- Do not infer exact values when the customer is vague.
- Use null for unknown fields.
- Preserve explicit ranges.
- Separate customer-stated facts from inferred preferences.
- Return confidence per extracted field when supported by the implementation.
